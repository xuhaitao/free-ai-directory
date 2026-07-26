import { readFile, readdir } from "node:fs/promises";
import type { DailySnapshot } from "./types.ts";

const currentUrl = new URL("../content/daily.json", import.meta.url);
const historyUrl = new URL("../content/history/", import.meta.url);

export function validateDailySnapshot(value: unknown): asserts value is DailySnapshot {
  const d = value as DailySnapshot;
  const errors: string[] = [];
  if (!d || d.schemaVersion !== 1) errors.push("schemaVersion 必须为 1");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d?.date || "")) errors.push("日期格式错误");
  if (d?.timezone !== "Asia/Shanghai") errors.push("时区必须为 Asia/Shanghai");
  for (const [name, items] of [["新闻", d?.news], ["项目", d?.projects], ["模型", d?.trendingModels]] as const) {
    if (!Array.isArray(items) || items.length !== 10) errors.push(`${name}必须恰好 10 条`);
  }
  const urls = [...(d?.news || []).map(x => x.url), ...(d?.projects || []).map(x => x.url), ...(d?.trendingModels || []).map(x => x.url)];
  if (urls.some(url => !url.startsWith("https://"))) errors.push("每日榜外链必须为 HTTPS");
  if (new Set(d?.news?.map(x => x.id)).size !== d?.news?.length) errors.push("新闻 ID 重复");
  if (new Set(d?.projects?.map(x => x.id)).size !== d?.projects?.length) errors.push("项目 ID 重复");
  if (new Set(d?.trendingModels?.map(x => x.id)).size !== d?.trendingModels?.length) errors.push("模型 ID 重复");
  if (errors.length) throw new Error(errors.join("\n"));
}

export async function loadDailySnapshot() {
  const data = JSON.parse(await readFile(currentUrl, "utf8"));
  validateDailySnapshot(data);
  return data;
}

export async function loadDailyHistory() {
  const names = await readdir(historyUrl).catch(() => [] as string[]);
  const snapshots: DailySnapshot[] = [];
  for (const name of names.filter(x => /^\d{4}-\d{2}-\d{2}\.json$/.test(x)).sort().reverse().slice(0, 90)) {
    try {
      const data = JSON.parse(await readFile(new URL(name, historyUrl), "utf8"));
      validateDailySnapshot(data);
      snapshots.push(data);
    } catch (error) {
      console.warn(`跳过无效归档 ${name}:`, error instanceof Error ? error.message : error);
    }
  }
  return snapshots;
}
