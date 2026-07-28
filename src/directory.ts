import { readFile } from "node:fs/promises";
import type { DirectorySnapshot, ModelEntry, Relay } from "./types.ts";

const currentUrl = new URL("../content/directory.json", import.meta.url);
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function validateDirectorySnapshot(value: unknown): asserts value is DirectorySnapshot {
  const snapshot = value as DirectorySnapshot;
  const errors: string[] = [];
  if (!snapshot || snapshot.schemaVersion !== 1) errors.push("schemaVersion 必须为 1");
  if (!datePattern.test(snapshot?.date || "")) errors.push("目录日期格式错误");
  if (snapshot?.timezone !== "Asia/Shanghai") errors.push("目录时区必须为 Asia/Shanghai");
  if (!Array.isArray(snapshot?.models) || snapshot.models.length < 30) errors.push("免费模型少于 30 个");
  if (!Array.isArray(snapshot?.relays) || snapshot.relays.length < 10) errors.push("中转站少于 10 个");
  if (!Array.isArray(snapshot?.checks)) errors.push("缺少链接检查结果");
  if (snapshot?.changes !== undefined && !Array.isArray(snapshot.changes)) errors.push("目录变化记录格式错误");
  if (!Array.isArray(snapshot?.sourceStatus) || snapshot.sourceStatus.length < 2) errors.push("缺少目录来源状态");

  const models = snapshot?.models || [] as ModelEntry[];
  const relays = snapshot?.relays || [] as Relay[];
  if (new Set(models.map(item => item.id)).size !== models.length) errors.push("免费模型 ID 重复");
  if (new Set(relays.map(item => item.id)).size !== relays.length) errors.push("中转站 ID 重复");
  for (const model of models) {
    if (!model.modelUrl?.startsWith("https://") || !model.sourceUrl?.startsWith("https://")) errors.push(`${model.id}: 模型链接必须为 HTTPS`);
    if (!datePattern.test(model.lastReviewedAt || "")) errors.push(`${model.id}: 模型审阅日期错误`);
  }
  for (const relay of relays) {
    if (!relay.websiteUrl?.startsWith("https://") || !relay.sourceUrls?.length) errors.push(`${relay.id}: 中转站缺少 HTTPS 入口或来源`);
  }
  const states = new Set(["reachable", "restricted", "network_limited", "not_found", "temporary_error"]);
  for (const check of snapshot?.checks || []) if (!states.has(check.state)) errors.push(`${check.id}: 链接状态错误`);
  if (errors.length) throw new Error(errors.join("\n"));
}

export async function loadDirectorySnapshot() {
  const data = JSON.parse(await readFile(currentUrl, "utf8"));
  validateDirectorySnapshot(data);
  return data as DirectorySnapshot;
}
