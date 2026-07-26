import test from "node:test";
import assert from "node:assert/strict";
import { filterModels, filterRelays, sortModels } from "../src/core.ts";
import { models, relays } from "../src/data.ts";

test("按模型类型和免费方式组合筛选",()=>{const out=filterModels(models,{category:"image_generation",freeType:"recurring"});assert.ok(out.length>=2);assert.ok(out.every(x=>x.category==="image_generation"&&x.freeType==="recurring"));});
test("关键词可匹配模型 ID 与标签",()=>{assert.equal(filterModels(models,{q:"bge-reranker-base"})[0]?.category,"rerank");assert.ok(filterModels(models,{q:"本地运行"}).length>=2);});
test("排序优先周期额度",()=>{const out=sortModels([models.find(x=>x.freeType==="open_source")!,models.find(x=>x.freeType==="recurring")!]);assert.equal(out[0]?.freeType,"recurring");});
test("中转站支持按客户端和证据筛选",()=>{const out=filterRelays(relays,{client:"Codex",evidence:"official_docs"});assert.ok(out.length>0);assert.ok(out.every(x=>x.clients.includes("Codex")&&x.evidence==="official_docs"));});
