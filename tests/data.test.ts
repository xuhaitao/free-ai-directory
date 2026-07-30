import test from "node:test";
import assert from "node:assert/strict";
import { categoryLabels, models, relays } from "../src/data.ts";
import { validateData } from "../src/validate.ts";
import { loadDailySnapshot } from "../src/daily.ts";
import { loadOpportunitySnapshot } from "../src/opportunities.ts";
import { loadDirectorySnapshot } from "../src/directory.ts";
import { githubRelayCandidates, hasHostedRelayPageEvidence, openRouterFreeModels } from "../src/directory-update-core.ts";
import { directoryChanges, linkStateForStatus, mergeDirectoryChanges } from "../src/directory-change-core.ts";

test("发布数据达到最低规模",()=>{const x=validateData();assert.ok(x.models>=30);assert.ok(x.relays>=10);assert.equal(x.categories,14);});
test("所有模型类型都有入口",()=>{for(const category of Object.keys(categoryLabels))assert.ok(models.some(x=>x.category===category),category);});
test("模型卡只需要跳转与来源，不包含探测字段",()=>{for(const model of models){assert.match(model.modelUrl,/^https:\/\//);assert.match(model.sourceUrl,/^https:\/\//);assert.equal("status" in model,false);assert.equal("baseUrl" in model,false);}});
test("弱证据中转站明确标注",()=>{assert.ok(relays.some(x=>x.evidence==="third_party_listing"));assert.ok(relays.filter(x=>x.operatorDisclosure==="not_found").every(x=>x.riskNotes.length>0));});
test("每日三个榜单均为 10 条且来源可追溯",async()=>{const daily=await loadDailySnapshot();assert.equal(daily.news.length,10);assert.equal(daily.projects.length,10);assert.equal(daily.trendingModels.length,10);assert.ok(daily.sourceStatus.length>=3);});
test("每日创收资讯与 Skill 热榜使用多源融合且来源可追溯",async()=>{const data=await loadOpportunitySnapshot();assert.ok(data.moneyNews.length>=40&&data.moneyNews.length<=60);assert.equal(data.skills.length,50);assert.ok(new Set(data.moneyNews.flatMap(item=>item.sourcePlatforms)).size>=2);assert.ok(data.moneyNews.every(item=>item.evidence.length>0&&item.fusionScore>=0&&item.fusionScore<=100));assert.ok(data.skills.every(item=>item.url.startsWith("https://skills.sh/")&&item.installUrl?.startsWith("https://github.com/")&&item.fusionScore>=0&&item.fusionScore<=100));const counts=new Map<string,number>();for(const item of data.skills)counts.set(item.source,(counts.get(item.source)||0)+1);assert.ok([...counts.values()].every(count=>count<=5));});
test("OpenRouter 每日同步只接收明确的免费路由",()=>{
  const result=openRouterFreeModels({data:[
    {id:"demo/free:free",name:"Free",pricing:{prompt:"0",completion:"0"},architecture:{input_modalities:["text"],output_modalities:["text"]}},
    {id:"demo/ambiguous",name:"Ambiguous",pricing:{prompt:"0",completion:"0"},architecture:{input_modalities:["text"],output_modalities:["text"]}},
    {id:"demo/paid:free",name:"Paid",pricing:{prompt:"0.1",completion:"0"},architecture:{input_modalities:["text"],output_modalities:["text"]}}
  ]},"2026-07-28");
  assert.deepEqual(result.map(item=>item.modelId),["demo/free:free"]);
});
test("中转站自动候选必须同时有仓库和自有站点服务证据",()=>{
  const page="Claude Code 与 Codex API 中转服务，登录后创建 API Key，查看 pricing、余额与 Base URL";
  assert.equal(hasHostedRelayPageEvidence(page,"https://relay.example.com/"),true);
  assert.equal(hasHostedRelayPageEvidence(page,"https://relay.github.io/"),false);
  const result=githubRelayCandidates([{full_name:"demo/relay",html_url:"https://github.com/demo/relay",homepage:"https://relay.example.com/",description:"Claude Code 与 Codex API 中转 gateway",stargazers_count:3,page_evidence:page}],"2026-07-28");
  assert.equal(result.length,1);
  assert.equal(result[0]!.evidence,"third_party_listing");
});
test("每日目录快照可校验且不把导航和切换工具自动收录",async()=>{
  const directory=await loadDirectorySnapshot();
  assert.ok(directory.models.length>=30);
  assert.ok(directory.relays.length>=10);
  assert.ok(directory.checks.length>0);
  assert.ok(directory.sourceStatus.length>=4);
  assert.ok(directory.models.some(item=>item.tags.includes("每日同步")));
  assert.ok(directory.relays.filter(item=>item.id.startsWith("github-")).every(item=>!/(awesome|nav|dashboard|switch|mcp|vscode)/i.test(`${item.id} ${item.name} ${item.websiteUrl}`)));
});
test("链接状态区分目标站限制、确认失效和临时错误",()=>{
  assert.equal(linkStateForStatus(200),"reachable");
  assert.equal(linkStateForStatus(403),"restricted");
  assert.equal(linkStateForStatus(404),"not_found");
  assert.equal(linkStateForStatus(503),"temporary_error");
});
test("目录变化只记录新增、移除和实质字段变更",()=>{
  const before={schemaVersion:1 as const,date:"2026-07-27",generatedAt:"2026-07-27T00:00:00.000Z",timezone:"Asia/Shanghai" as const,models:[models[0]!],relays:[relays[0]!],checks:[],sourceStatus:[]};
  const changedModel={...models[0]!,freeSummary:`${models[0]!.freeSummary}（调整）`,lastReviewedAt:"2026-07-28"};
  const changes=directoryChanges(before,[changedModel,models[1]!],[]);
  assert.ok(changes.some(item=>item.change==="changed"&&item.id===changedModel.id&&item.summary.includes("免费规则")));
  assert.ok(changes.some(item=>item.change==="added"&&item.id===models[1]!.id));
  assert.ok(changes.some(item=>item.change==="removed"&&item.id===relays[0]!.id));
  assert.equal(mergeDirectoryChanges(changes,changes).length,changes.length);
});
