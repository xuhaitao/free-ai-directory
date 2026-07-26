import type { ModelEntry, Relay } from "./types.ts";

const freeRank: Record<ModelEntry["freeType"], number> = { recurring: 0, permanent: 1, signup_credit: 2, open_source: 3 };

export function sortModels(items: ModelEntry[]) {
  return [...items].sort((a,b) => freeRank[a.freeType] - freeRank[b.freeType] || a.name.localeCompare(b.name, "zh-CN"));
}

export function filterModels(items: ModelEntry[], f: {q?:string;category?:string;provider?:string;freeType?:string}) {
  const q = f.q?.trim().toLocaleLowerCase("zh-CN");
  return items.filter(x => (!q || `${x.name} ${x.modelId} ${x.tags.join(" ")}`.toLocaleLowerCase("zh-CN").includes(q))
    && (!f.category || x.category === f.category)
    && (!f.provider || x.providerId === f.provider)
    && (!f.freeType || x.freeType === f.freeType));
}

export function filterRelays(items: Relay[], f:{q?:string;client?:string;protocol?:string;evidence?:string}) {
  const q = f.q?.trim().toLocaleLowerCase("zh-CN");
  return items.filter(x => (!q || `${x.name} ${x.protocols.join(" ")} ${x.clients.join(" ")}`.toLocaleLowerCase("zh-CN").includes(q))
    && (!f.client || x.clients.includes(f.client as never))
    && (!f.protocol || x.protocols.some(p => p.includes(f.protocol!)))
    && (!f.evidence || x.evidence === f.evidence));
}
