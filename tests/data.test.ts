import test from "node:test";
import assert from "node:assert/strict";
import { categoryLabels, models, relays } from "../src/data.ts";
import { validateData } from "../src/validate.ts";
import { loadDailySnapshot } from "../src/daily.ts";

test("发布数据达到最低规模",()=>{const x=validateData();assert.ok(x.models>=30);assert.ok(x.relays>=10);assert.equal(x.categories,14);});
test("所有模型类型都有入口",()=>{for(const category of Object.keys(categoryLabels))assert.ok(models.some(x=>x.category===category),category);});
test("模型卡只需要跳转与来源，不包含探测字段",()=>{for(const model of models){assert.match(model.modelUrl,/^https:\/\//);assert.match(model.sourceUrl,/^https:\/\//);assert.equal("status" in model,false);assert.equal("baseUrl" in model,false);}});
test("弱证据中转站明确标注",()=>{assert.ok(relays.some(x=>x.evidence==="third_party_listing"));assert.ok(relays.filter(x=>x.operatorDisclosure==="not_found").every(x=>x.riskNotes.length>0));});
test("每日三个榜单均为 10 条且来源可追溯",async()=>{const daily=await loadDailySnapshot();assert.equal(daily.news.length,10);assert.equal(daily.projects.length,10);assert.equal(daily.trendingModels.length,10);assert.ok(daily.sourceStatus.length>=3);});
