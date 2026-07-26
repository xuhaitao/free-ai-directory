import { categoryLabels, models, providers, relays } from "./data.ts";

export function validateData(){
  const errors:string[]=[];
  const providerIds=new Set(providers.map(x=>x.id));
  const ids=[...models.map(x=>x.id),...relays.map(x=>x.id)];
  if(new Set(ids).size!==ids.length)errors.push("模型或中转站 ID 重复");
  if(models.length<30)errors.push("模型少于 30 个");
  if(relays.length<10)errors.push("中转站少于 10 个");
  for(const category of Object.keys(categoryLabels))if(!models.some(x=>x.category===category))errors.push(`${category}: 没有模型`);
  for(const model of models){
    if(!providerIds.has(model.providerId))errors.push(`${model.id}: 平台不存在`);
    for(const key of ["modelUrl","sourceUrl"] as const)if(!model[key].startsWith("https://"))errors.push(`${model.id}: ${key} 必须为 HTTPS`);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(model.lastReviewedAt))errors.push(`${model.id}: 审阅日期错误`);
  }
  for(const relay of relays){
    if(!relay.websiteUrl.startsWith("https://")||!relay.sourceUrls.length)errors.push(`${relay.id}: 缺少 HTTPS 入口或来源`);
    if(relay.evidence!=="official_docs"&&relay.sourceUrls.length===0)errors.push(`${relay.id}: 弱证据条目必须提供来源`);
    if(!relay.riskNotes.length&&relay.operatorDisclosure==="not_found")errors.push(`${relay.id}: 主体未知但无风险提示`);
  }
  if(errors.length)throw new Error(errors.join("\n"));
  return {providers:providers.length,models:models.length,relays:relays.length,categories:Object.keys(categoryLabels).length};
}
if(import.meta.url===`file://${process.argv[1]}`)console.log("数据校验通过",validateData());
