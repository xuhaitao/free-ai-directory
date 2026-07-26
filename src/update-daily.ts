import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import type { DailyModel, DailyNews, DailyProject, DailySnapshot } from "./types.ts";
import { validateDailySnapshot } from "./daily.ts";

const contentDir = new URL("../content/", import.meta.url);
const currentUrl = new URL("daily.json", contentDir);
const historyDir = new URL("history/", contentDir);
const now = new Date();
const generatedAt = now.toISOString();
const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
const userAgent = "free-ai-directory-daily/2.0 (+https://www.qaz5678.xyz/methodology/)";
const aiPattern = /\b(ai|llm|llms|gpt|openai|anthropic|claude|gemini|deepseek|qwen|mistral|llama|chatbot|transformer|diffusion|machine learning|neural|inference|embedding|rerank|computer vision|vision model|speech model|language model|foundation model|agentic|ai agent|agents sdk)\b/i;

function cleanText(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

function parseMetric(value: string) {
  const match = value.match(/([\d,.]+)\s*([kKmM万]?)/);
  if (!match) return 0;
  const amount = Number(match[1]!.replaceAll(",", ""));
  const multiplier = /k/i.test(match[2] || "") ? 1_000 : /m/i.test(match[2] || "") ? 1_000_000 : match[2] === "万" ? 10_000 : 1;
  return Math.round(amount * multiplier);
}

async function request(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, { ...init, headers: { "user-agent": userAgent, accept: "application/json,text/html;q=0.9,*/*;q=0.8", ...init.headers }, signal: controller.signal });
    if (!response.ok) throw new Error(`${new URL(url).host} HTTP ${response.status}`);
    return response;
  } finally { clearTimeout(timer); }
}

async function fetchNews(): Promise<DailyNews[]> {
  const since = Math.floor((Date.now() - 7 * 86400_000) / 1000);
  const terms = ["AI", "LLM", "OpenAI", "Anthropic", "Claude", "Gemini", "DeepSeek", "machine learning", "AI agent"];
  const hits: any[] = [];
  for (const term of terms) {
    const params = new URLSearchParams({ query: term, tags: "story", numericFilters: `created_at_i>${since}`, hitsPerPage: "50" });
    const json = await (await request(`https://hn.algolia.com/api/v1/search?${params}`)).json() as any;
    hits.push(...(json.hits || []));
  }
  const seen = new Set<string>();
  return hits.filter(hit => hit.title && aiPattern.test(`${hit.title} ${hit.story_text || ""} ${hit.url || ""}`)).map(hit => {
    const destination = String(hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`);
    const key = destination.replace(/[?#].*$/, "").replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) return null;
    seen.add(key);
    const ageHours = Math.max(1, (Date.now() - new Date(hit.created_at).getTime()) / 3600_000);
    const points = Number(hit.points || 0), comments = Number(hit.num_comments || 0);
    return {
      id: String(hit.objectID), title: cleanText(hit.title), url: destination.startsWith("https://") ? destination : destination.replace(/^http:/, "https:"),
      discussionUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      source: (() => { try { return new URL(destination).hostname.replace(/^www\./, ""); } catch { return "news.ycombinator.com"; } })(),
      points, comments, publishedAt: new Date(hit.created_at).toISOString(),
      hotScore: Math.round((points + comments * 1.6) / Math.pow(1 + ageHours / 24, .72))
    } satisfies DailyNews;
  }).filter(Boolean).sort((a: any, b: any) => b.hotScore - a.hotScore || b.points - a.points).slice(0, 10) as DailyNews[];
}

function parseGitHubTrending(html: string): DailyProject[] {
  const items: DailyProject[] = [];
  for (const block of html.match(/<article\b[^>]*class="[^"]*Box-row[^"]*"[\s\S]*?<\/article>/g) || []) {
    const repo = block.match(/<h2[\s\S]*?<a[^>]+href="\/([^"?#]+)"/)?.[1]?.trim();
    if (!repo || repo.split("/").length !== 2) continue;
    const desc = cleanText(block.match(/<p\b[^>]*>([\s\S]*?)<\/p>/)?.[1] || "");
    if (!aiPattern.test(`${repo} ${desc}`)) continue;
    const language = cleanText(block.match(/itemprop="programmingLanguage"[^>]*>([\s\S]*?)<\/span>/)?.[1] || "未标注");
    const starText = cleanText(block.match(new RegExp(`<a[^>]+href="/${repo.replace("/", "\\/")}\\/stargazers"[\\s\\S]*?<\\/a>`))?.[0] || "0");
    const forkText = cleanText(block.match(new RegExp(`<a[^>]+href="/${repo.replace("/", "\\/")}\\/forks"[\\s\\S]*?<\\/a>`))?.[0] || "0");
    const starsToday = parseMetric(block.match(/([\d,.]+\s*[kKmM万]?)\s+stars today/)?.[1] || "0");
    const stars = parseMetric(starText), forks = parseMetric(forkText);
    items.push({ id: repo.toLowerCase(), name: repo, url: `https://github.com/${repo}`, description: desc || "GitHub 今日趋势项目", language, stars, forks, starsToday, topics: [], hotScore: 100_000 + starsToday * 100 + stars, basis: "github_trending" });
  }
  return items;
}

async function fetchGitHubSearch(): Promise<DailyProject[]> {
  const since = new Date(Date.now() - 180 * 86400_000).toISOString().slice(0, 10);
  const topics = ["artificial-intelligence", "llm", "generative-ai", "ai-agents"];
  const headers: Record<string, string> = { accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const all: any[] = [];
  for (const topic of topics) {
    const params = new URLSearchParams({ q: `topic:${topic} created:>=${since} stars:>20`, sort: "stars", order: "desc", per_page: "30" });
    const json = await (await request(`https://api.github.com/search/repositories?${params}`, { headers })).json() as any;
    all.push(...(json.items || []));
  }
  const unique = new Map<string, any>();
  for (const item of all) unique.set(String(item.full_name).toLowerCase(), item);
  return [...unique.values()].map(item => {
    const ageDays = Math.max(1, (Date.now() - new Date(item.created_at).getTime()) / 86400_000);
    const stars = Number(item.stargazers_count || 0);
    return { id: String(item.full_name).toLowerCase(), name: item.full_name, url: item.html_url, description: cleanText(item.description || "近期热门 AI 开源项目"), language: item.language || "未标注", stars, forks: Number(item.forks_count || 0), topics: (item.topics || []).slice(0, 5), hotScore: Math.round(stars / Math.pow(ageDays + 2, .62) * 100), basis: "recent_star_velocity" } satisfies DailyProject;
  }).sort((a, b) => b.hotScore - a.hotScore);
}

async function fetchProjects(): Promise<DailyProject[]> {
  const html = await (await request("https://github.com/trending?since=daily")).text();
  const trending = parseGitHubTrending(html);
  const searched = await fetchGitHubSearch();
  const seen = new Set<string>();
  return [...trending, ...searched].filter(x => !seen.has(x.id) && seen.add(x.id)).slice(0, 10);
}

async function fetchModels(): Promise<DailyModel[]> {
  const params = new URLSearchParams({ sort: "trendingScore", direction: "-1", limit: "80", full: "true" });
  const apiBase = (process.env.HF_API_ENDPOINT || "https://huggingface.co").replace(/\/$/, "");
  const data = await (await request(`${apiBase}/api/models?${params}`)).json() as any[];
  return data.filter(x => !x.private && !x.gated && x.id && x.pipeline_tag).map(x => ({
    id: String(x.id).toLowerCase(), name: x.id, url: `https://huggingface.co/${x.id}`, pipelineTag: x.pipeline_tag,
    downloads: Number(x.downloads || 0), likes: Number(x.likes || 0), trendingScore: Number(x.trendingScore || 0),
    lastModified: x.lastModified || generatedAt, tags: (x.tags || []).filter((t: string) => !t.includes(":")) .slice(0, 5)
  } satisfies DailyModel)).sort((a, b) => b.trendingScore - a.trendingScore || b.likes - a.likes).slice(0, 10);
}

async function previousSnapshot(): Promise<DailySnapshot | null> {
  try { const data = JSON.parse(await readFile(currentUrl, "utf8")); validateDailySnapshot(data); return data; } catch { return null; }
}

const previous = await previousSnapshot();
const sourceStatus: DailySnapshot["sourceStatus"] = [];
async function section<T>(name: string, url: string, run: () => Promise<T[]>, old: T[] | undefined) {
  try {
    const value = await run();
    if (value.length !== 10) throw new Error(`只得到 ${value.length} 条`);
    sourceStatus.push({ name, url, ok: true, note: "本次抓取成功" });
    return { value, freshAt: generatedAt };
  } catch (error) {
    if (!old?.length) throw error;
    const note = error instanceof Error ? error.message : String(error);
    sourceStatus.push({ name, url, ok: false, note: `抓取失败，保留上一版：${note}` });
    console.warn(`${name}: ${note}`);
    return { value: old, freshAt: "" };
  }
}

const news = await section("Hacker News / Algolia", "https://hn.algolia.com/api", fetchNews, previous?.news);
const projects = await section("GitHub Trending / Search", "https://github.com/trending", fetchProjects, previous?.projects);
const models = await section(process.env.HF_API_ENDPOINT ? "Hugging Face Hub（镜像 API）" : "Hugging Face Hub", "https://huggingface.co/models", fetchModels, previous?.trendingModels);
const snapshot: DailySnapshot = {
  schemaVersion: 1, date, generatedAt, timezone: "Asia/Shanghai",
  freshness: {
    news: news.freshAt || previous?.freshness.news || generatedAt,
    projects: projects.freshAt || previous?.freshness.projects || generatedAt,
    models: models.freshAt || previous?.freshness.models || generatedAt
  },
  news: news.value as DailyNews[], projects: projects.value as DailyProject[], trendingModels: models.value as DailyModel[], sourceStatus
};
validateDailySnapshot(snapshot);
await mkdir(historyDir, { recursive: true });
const tempUrl = new URL(`daily.${process.pid}.tmp`, contentDir);
await writeFile(tempUrl, JSON.stringify(snapshot, null, 2) + "\n");
await rename(tempUrl, currentUrl);
await writeFile(new URL(`${date}.json`, historyDir), JSON.stringify(snapshot, null, 2) + "\n");
console.log(`每日数据更新完成：${date}，新闻 ${snapshot.news.length}、项目 ${snapshot.projects.length}、趋势模型 ${snapshot.trendingModels.length}`);
for (const source of sourceStatus) console.log(`${source.ok ? "OK" : "STALE"} ${source.name}: ${source.note}`);
