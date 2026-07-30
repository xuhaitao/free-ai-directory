import { readFile, readdir } from "node:fs/promises";
import type { OpportunitySnapshot } from "./types.ts";

const currentUrl=new URL("../content/opportunities.json",import.meta.url);
const historyUrl=new URL("../content/opportunities-history/",import.meta.url);

export function validateOpportunitySnapshot(value:unknown):asserts value is OpportunitySnapshot{
  const data=value as OpportunitySnapshot,errors:string[]=[];
  if(!data||data.schemaVersion!==1)errors.push("schemaVersion 必须为 1");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(data?.date||""))errors.push("日期格式错误");
  if(data?.timezone!=="Asia/Shanghai")errors.push("时区必须为 Asia/Shanghai");
  if(!Array.isArray(data?.moneyNews)||data.moneyNews.length<40||data.moneyNews.length>60)errors.push("AI 创收资讯应为 40–60 条");
  if(!Array.isArray(data?.skills)||data.skills.length!==50)errors.push("Skill 热榜必须恰好 50 条");
  if(new Set(data?.moneyNews?.map(item=>item.id)).size!==data?.moneyNews?.length)errors.push("AI 创收资讯 ID 重复");
  if(new Set(data?.skills?.map(item=>item.id)).size!==data?.skills?.length)errors.push("Skill ID 重复");
  if([...(data?.moneyNews||[]).map(item=>item.url),...(data?.skills||[]).map(item=>item.url)].some(url=>!url.startsWith("https://")))errors.push("所有来源必须为 HTTPS");
  if((data?.moneyNews||[]).some(item=>!item.discussionUrl.startsWith("https://news.ycombinator.com/")))errors.push("创收资讯缺少 HN 讨论来源");
  if((data?.skills||[]).some(item=>!item.url.startsWith("https://skills.sh/")))errors.push("Skill 缺少 skills.sh 排名来源");
  if(errors.length)throw new Error(errors.join("\n"));
}

export async function loadOpportunitySnapshot(){const data=JSON.parse(await readFile(currentUrl,"utf8"));validateOpportunitySnapshot(data);return data}
export async function loadOpportunityHistory(){
  const names=await readdir(historyUrl).catch(()=>[] as string[]),snapshots:OpportunitySnapshot[]=[];
  for(const name of names.filter(name=>/^\d{4}-\d{2}-\d{2}\.json$/.test(name)).sort().reverse().slice(0,90)){
    try{const data=JSON.parse(await readFile(new URL(name,historyUrl),"utf8"));validateOpportunitySnapshot(data);snapshots.push(data)}catch(error){console.warn(`跳过无效机会榜归档 ${name}:`,error instanceof Error?error.message:error)}
  }
  return snapshots;
}
