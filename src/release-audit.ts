import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
const root=resolve("dist");
async function filesIn(dir:string):Promise<string[]>{const entries=await readdir(dir);return(await Promise.all(entries.map(async name=>{const path=resolve(dir,name);return(await stat(path)).isDirectory()?filesIn(path):[path]}))).flat()}
const files=await filesIn(root),htmlFiles=files.filter(x=>x.endsWith(".html")&&!x.endsWith("google12cdc1700f3f0191.html")),errors:string[]=[];
const forbidden:[RegExp,string][]=[
  [/sk-[A-Za-z0-9_-]{16,}/,"疑似 API Key"],
  [/Bearer\s+[A-Za-z0-9._-]{16,}/i,"疑似 Bearer Token"],
  [/api\.example\.invalid/,"占位 API 地址"],
  [/实测可用|实时探测|最后检测|运行状态|可用率|延迟排名/,"出现与产品范围冲突的测试文案"],
  [/live-status\.js|analytics\.js|api\/status/,"仍引用已移除的动态系统"]
];
function internalExists(href:string){const clean=href.split(/[?#]/)[0]!;if(!clean||clean==="/")return true;const rel=clean.replace(/^\//,"");const candidates=clean.endsWith("/")?[resolve(root,rel,"index.html")]:[resolve(root,rel),resolve(root,`${rel}.html`),resolve(root,rel,"index.html")];return candidates.some(x=>files.includes(x))}
for(const path of htmlFiles){
  const html=await readFile(path,"utf8");
  for(const [p,label] of forbidden)if(p.test(html))errors.push(`${path}: ${label}`);
  for(const m of html.matchAll(/href="(\/[^"#]*)"/g))if(!internalExists(m[1]!))errors.push(`${path}: 站内链接不存在 ${m[1]}`);
  if(!/<link rel="canonical" href="https:\/\//.test(html))errors.push(`${path}: 缺少 HTTPS canonical`);
  const expectedRobots=path.endsWith("/saved/index.html")||path.endsWith("/following/index.html")?"noindex,follow":"index,follow";
  if(!new RegExp(`<meta name="robots" content="${expectedRobots}`).test(html))errors.push(`${path}: robots 声明错误`);
  if(!/<meta property="og:image" content="https:\/\//.test(html))errors.push(`${path}: 缺少社交分享图片`);
  if(!/href="\/ai-money\/"[^>]*>AI 创收<\/a>/.test(html))errors.push(`${path}: 主导航缺少 AI 创收入口`);
  if(!/href="\/skills\/"[^>]*>Skill 热榜<\/a>/.test(html))errors.push(`${path}: 主导航缺少 Skill 热榜入口`);
  if(!/href="\/ai-stocks\/"[^>]*>AI 炒股<\/a>/.test(html))errors.push(`${path}: 主导航缺少 AI 炒股入口`);
  if(!/href="\/weekly\/"[^>]*>AI 周报<\/a>/.test(html))errors.push(`${path}: 主导航缺少 AI 周报入口`);
  if(!/href="\/topics\/"[^>]*>主题追踪<\/a>/.test(html))errors.push(`${path}: 主导航缺少主题追踪入口`);
  if(path.endsWith("/weekly/index.html")&&(!/本周变化雷达/.test(html)||!/连续上榜/.test(html)||!/最新快照首次出现/.test(html)||!/排名升温/.test(html)))errors.push(`${path}: 周变化模块不完整`);
  if(path.endsWith("/topics/index.html")&&(!/跨榜追踪/.test(html)||!/至少匹配 3 条内容并覆盖 2 个栏目/.test(html)||!/data-track="topic-item"/.test(html)||!/data-topic-follow=/.test(html)||!/data-track="rss-topic"/.test(html)))errors.push(`${path}: 主题追踪模块不完整`);
}
if(htmlFiles.length<60)errors.push(`HTML 页面数量异常：${htmlFiles.length}`);
for(const required of [
  "about/index.html",
  "privacy/index.html",
  "models/index.html",
  "models/bge-m3/index.html",
  "relays/index.html",
  "changes/index.html",
  "search/index.html",
  "find-model/index.html",
  "ai-money/index.html",
  "skills/index.html",
  "ai-stocks/index.html",
  "weekly/index.html",
  "topics/index.html",
  "following/index.html",
  "saved/index.html",
  "compare/index.html",
  "sitemap/index.html",
  "methodology/index.html",
  "questions/index.html",
  "guides/free-ai-api/index.html",
  "guides/free-llm-api-providers/index.html",
  "guides/free-embedding-rerank/index.html",
  "guides/free-embedding-api/index.html",
  "guides/free-image-video-models/index.html",
  "guides/free-image-generation-api/index.html",
  "guides/free-image-segmentation-api/index.html",
  "guides/codex-claude-code-relay/index.html",
  "guides/codex-free/index.html",
  "guides/claude-code-free/index.html",
  "guides/openrouter-free-models/index.html",
  "guides/cloudflare-workers-ai-free-tier/index.html",
  "guides/github-models-free-api/index.html",
  "guides/free-ai-api-no-topup/index.html",
  "videos/codex-build-ai-daily-site/index.html",
  "providers/openrouter/index.html",
  "providers/cloudflare/index.html",
  "assets/metrics.js",
  "assets/share.js",
  "assets/saved.js",
  "assets/compare.js",
  "assets/topics.js",
  "assets/interactions.css",
  "assets/search.js",
  "assets/model-finder.js",
  "assets/responsive.css",
  "assets/opportunities.css",
  "assets/social-card.png",
  "favicon.ico",
  "assets/codex-ai-daily.mp4",
  "assets/codex-ai-daily-cover.jpg",
  "google12cdc1700f3f0191.html",
  "sitemap.xml",
  "video-sitemap.xml",
  "robots.txt",
  "data/directory.json",
  "data/search-index.json",
  "data/model-finder.json",
  "data/opportunities.json",
  "data/ai-stocks.json",
  "data/weekly.json",
  "data/topics.json",
  "ai-money.xml",
  "skills.xml",
  "ai-stocks.xml",
  "weekly.xml",
  "topics.xml",
  "models-changes.xml",
  "relays-changes.xml"
])if(!files.some(x=>x.endsWith(required)))errors.push(`缺少 ${required}`);
const topicData=JSON.parse(await readFile(resolve(root,"data/topics.json"),"utf8")) as {topics:{id:string}[]};
for(const topic of topicData.topics)if(!files.some(x=>x.endsWith(`topics/${topic.id}.xml`)))errors.push(`缺少主题 RSS topics/${topic.id}.xml`);
if(errors.length){console.error(errors.join("\n"));process.exitCode=1}else console.log(`发布审计通过：${htmlFiles.length} 个 HTML 页面，${files.length} 个构建文件`);
