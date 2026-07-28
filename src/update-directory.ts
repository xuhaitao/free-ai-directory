import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { models as curatedModels, relays as curatedRelays } from "./data.ts";
import { directoryChanges, linkStateForStatus, mergeDirectoryChanges } from "./directory-change-core.ts";
import { githubRelayCandidates, hasHostedRelayPageEvidence, openRouterFreeModels } from "./directory-update-core.ts";
import { validateDirectorySnapshot } from "./directory.ts";
import type { DirectoryLinkCheck, DirectorySnapshot, Relay } from "./types.ts";

const contentDir = new URL("../content/", import.meta.url);
const currentUrl = new URL("directory.json", contentDir);
const historyDir = new URL("directory-history/", contentDir);
const now = new Date();
const generatedAt = now.toISOString();
const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
const userAgent = "free-ai-directory-updater/1.0 (+https://www.qaz5678.xyz/methodology/)";

async function request(url: string, init: RequestInit = {}, timeout = 20_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...init, headers: { "user-agent": userAgent, accept: "application/json,text/html;q=0.9,*/*;q=0.8", ...init.headers }, redirect: "follow", signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } finally { clearTimeout(timer); }
}

async function previousSnapshot(): Promise<DirectorySnapshot | null> {
  try {
    const value = JSON.parse(await readFile(currentUrl, "utf8")) as DirectorySnapshot;
    for (const check of value.checks || []) if (!check.state) check.state = check.status === 0 ? "network_limited" : linkStateForStatus(check.status);
    validateDirectorySnapshot(value);
    return value;
  } catch { return null; }
}

async function fetchOpenRouter(previous: DirectorySnapshot | null, sourceStatus: DirectorySnapshot["sourceStatus"]) {
  const url = "https://openrouter.ai/api/v1/models";
  try {
    const data = await (await request(url)).json();
    const entries = openRouterFreeModels(data, date, curatedModels);
    sourceStatus.push({ name: "OpenRouter 免费模型目录", url, ok: true, note: `同步 ${entries.length} 个零价格模型` });
    return entries;
  } catch (error) {
    const fallback = previous?.models.filter(item => item.providerId === "openrouter" && item.tags.includes("每日同步")) || [];
    sourceStatus.push({ name: "OpenRouter 免费模型目录", url, ok: false, note: `同步失败，保留 ${fallback.length} 个上一版条目：${error instanceof Error ? error.message : error}` });
    return fallback;
  }
}

async function fetchRelayCandidates(previous: DirectorySnapshot | null, sourceStatus: DirectorySnapshot["sourceStatus"]) {
  const queries = [
    '"Claude Code" 中转 in:name,description stars:>1',
    'Codex 中转 in:name,description stars:>1',
    '"Claude Code" API gateway in:name,description stars:>1'
  ];
  const all: any[] = [];
  try {
    for (const query of queries) {
      const params = new URLSearchParams({ q: query, sort: "updated", order: "desc", per_page: "20" });
      const response = await request(`https://api.github.com/search/repositories?${params}`, { headers: { accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28" } });
      const json = await response.json() as any;
      all.push(...(json.items || []));
    }
    const unique = [...new Map(all.map(item => [item.full_name, item])).values()];
    const verified: any[] = [];
    for (const item of unique) {
      if (!item.homepage || !String(item.homepage).startsWith("https://")) continue;
      try {
        const response = await request(String(item.homepage), { headers: { Range: "bytes=0-262143" } }, 12_000);
        const html = (await response.text()).slice(0, 262_144).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
        if (hasHostedRelayPageEvidence(html, String(item.homepage))) verified.push({ ...item, page_evidence: html });
      } catch { /* 入口不可读的自动候选不发布 */ }
    }
    const candidates = githubRelayCandidates(verified, date, curatedRelays);
    sourceStatus.push({ name: "GitHub 中转站候选发现", url: "https://api.github.com/search/repositories", ok: true, note: `筛出 ${candidates.length} 个高相关候选` });
    return candidates;
  } catch (error) {
    const excluded = /(awesome|导航|nav|dashboard|switch|mcp|self[ -]?host|自托管|extension|vscode|marketplace)/i;
    const fallback = previous?.relays.filter(item => item.id.startsWith("github-") && !excluded.test(`${item.id} ${item.name} ${item.websiteUrl}`)) || [];
    sourceStatus.push({ name: "GitHub 中转站候选发现", url: "https://api.github.com/search/repositories", ok: false, note: `发现失败，保留 ${fallback.length} 个上一版候选：${error instanceof Error ? error.message : error}` });
    return fallback;
  }
}

async function checkLink(kind: DirectoryLinkCheck["kind"], id: string, url: string): Promise<DirectoryLinkCheck> {
  const probe = async (method: "HEAD" | "GET") => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      return await fetch(url, { method, headers: { "user-agent": userAgent, accept: "text/html,application/json;q=0.9,*/*;q=0.8", ...(method === "GET" ? { Range: "bytes=0-0" } : {}) }, redirect: "follow", signal: controller.signal });
    } finally { clearTimeout(timer); }
  };
  try {
    let response = await probe("HEAD");
    if ([403, 405].includes(response.status)) {
      const headResponse = response;
      try { response = await probe("GET"); } catch { response = headResponse; }
    }
    await response.body?.cancel();
    const status = response.status;
    const state: DirectoryLinkCheck["state"] = linkStateForStatus(status);
    const note = { reachable: "目标入口正常响应", restricted: "目标站已响应，但拒绝或限制自动检查", not_found: "目标入口确认不存在", temporary_error: "目标站暂时错误", network_limited: "更新服务器网络受限" }[state];
    return { kind, id, url, ok: state === "reachable" || state === "restricted", state, status, checkedAt: generatedAt, note };
  } catch (error) {
    return { kind, id, url, ok: false, state: "network_limited", status: 0, checkedAt: generatedAt, note: `更新服务器无法完成访问：${error instanceof Error ? error.message : String(error)}` };
  }
}

function checkSummary(checks: DirectoryLinkCheck[]) {
  const count = (state: DirectoryLinkCheck["state"]) => checks.filter(item => item.state === state).length;
  return `正常响应 ${count("reachable")}，限制自动检查 ${count("restricted")}，确认失效 ${count("not_found")}，网络受限 ${count("network_limited")}，临时错误 ${count("temporary_error")}`;
}

async function mapLimit<T, R>(items: T[], limit: number, run: (item: T) => Promise<R>) {
  const output: R[] = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await run(items[index]!);
    }
  }));
  return output;
}

async function main() {
  const previous = await previousSnapshot();
  const sourceStatus: DirectorySnapshot["sourceStatus"] = [];
  const autoModels = await fetchOpenRouter(previous, sourceStatus);
  const autoRelays = await fetchRelayCandidates(previous, sourceStatus);
  const models = [...curatedModels, ...autoModels];
  const relays = [...curatedRelays, ...autoRelays];
  const targets = new Map<string, { kind: DirectoryLinkCheck["kind"]; id: string; url: string }>();
  for (const model of models) for (const url of [model.modelUrl, model.sourceUrl]) targets.set(`model:${model.id}:${url}`, { kind: "model", id: model.id, url });
  for (const relay of relays) for (const url of [relay.websiteUrl, relay.docsUrl, relay.pricingUrl, ...relay.sourceUrls].filter(Boolean) as string[]) targets.set(`relay:${relay.id}:${url}`, { kind: "relay", id: relay.id, url });
  const checks = await mapLimit([...targets.values()], 6, item => checkLink(item.kind, item.id, item.url));
  const modelChecks = checks.filter(item => item.kind === "model"), relayChecks = checks.filter(item => item.kind === "relay");
  sourceStatus.push({ name: "免费模型入口检查", url: "https://www.qaz5678.xyz/models/", ok: !modelChecks.some(item => item.state === "not_found"), note: checkSummary(modelChecks) });
  sourceStatus.push({ name: "中转站入口与证据检查", url: "https://www.qaz5678.xyz/relays/", ok: !relayChecks.some(item => item.state === "not_found"), note: checkSummary(relayChecks) });
  const detectedChanges = directoryChanges(previous, models, relays);
  const changes = mergeDirectoryChanges(previous?.date === date ? previous.changes : [], detectedChanges);
  const snapshot: DirectorySnapshot = { schemaVersion: 1, date, generatedAt, timezone: "Asia/Shanghai", models, relays, checks, changes, sourceStatus };
  validateDirectorySnapshot(snapshot);
  await mkdir(contentDir, { recursive: true });
  const tempUrl = new URL(`directory.${process.pid}.tmp`, contentDir);
  await writeFile(tempUrl, JSON.stringify(snapshot, null, 2) + "\n");
  await rename(tempUrl, currentUrl);
  await mkdir(historyDir, { recursive: true });
  await writeFile(new URL(`${date}.json`, historyDir), JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`目录更新完成：${date}，模型 ${models.length}（自动 ${autoModels.length}），中转站 ${relays.length}（自动候选 ${autoRelays.length}），变化 ${changes.length}`);
  for (const source of sourceStatus) console.log(`${source.ok ? "OK" : "STALE"} ${source.name}: ${source.note}`);
}

await main();
