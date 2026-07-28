import type { DirectoryChange, DirectorySnapshot, ModelEntry, Relay } from "./types.ts";

export function linkStateForStatus(status: number) {
  if (status === 404 || status === 410) return "not_found" as const;
  if (status >= 500) return "temporary_error" as const;
  if ([401, 403, 405, 406, 429, 451].includes(status)) return "restricted" as const;
  return "reachable" as const;
}

function changedFields<T extends { id: string }>(before: T, after: T, fields: [keyof T, string][]) {
  return fields.filter(([key]) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map(([, label]) => label);
}

export function directoryChanges(previous: DirectorySnapshot | null, models: ModelEntry[], relays: Relay[]): DirectoryChange[] {
  if (!previous) return [];
  const changes: DirectoryChange[] = [];
  const compare = <T extends { id: string; name: string }>(kind: DirectoryChange["kind"], beforeItems: T[], afterItems: T[], fields: [keyof T, string][], urlFor: (item: T) => string) => {
    const before = new Map(beforeItems.map(item => [item.id, item]));
    const after = new Map(afterItems.map(item => [item.id, item]));
    for (const item of afterItems) {
      const old = before.get(item.id);
      if (!old) changes.push({ kind, change: "added", id: item.id, name: item.name, summary: "新增收录", url: urlFor(item) });
      else {
        const fieldsChanged = changedFields(old, item, fields);
        if (fieldsChanged.length) changes.push({ kind, change: "changed", id: item.id, name: item.name, summary: `${fieldsChanged.join("、")}发生变化`, url: urlFor(item) });
      }
    }
    for (const item of beforeItems) if (!after.has(item.id)) changes.push({ kind, change: "removed", id: item.id, name: item.name, summary: "已从当前目录移除" });
  };
  compare("model", previous.models, models, [
    ["modelId", "模型 ID"], ["category", "能力类型"], ["freeType", "免费方式"], ["freeSummary", "免费规则"], ["modelUrl", "模型入口"], ["sourceUrl", "规则来源"]
  ], item => `/models/${item.id}/`);
  compare("relay", previous.relays, relays, [
    ["websiteUrl", "官网入口"], ["trialSummary", "免费说明"], ["evidence", "证据等级"], ["protocols", "协议"], ["clients", "客户端"], ["termsFound", "条款状态"], ["privacyFound", "隐私状态"]
  ], item => `/relays/?q=${encodeURIComponent(item.name)}`);
  return changes;
}

export function mergeDirectoryChanges(...groups: (DirectoryChange[] | undefined)[]) {
  const merged = new Map<string, DirectoryChange>();
  for (const item of groups.flatMap(group => group || [])) merged.set(`${item.kind}:${item.change}:${item.id}`, item);
  return [...merged.values()];
}
