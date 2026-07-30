import { readFile, readdir } from "node:fs/promises";
import type { WeeklyDigest } from "./types.ts";

const currentUrl=new URL("../content/weekly.json",import.meta.url),historyUrl=new URL("../content/weekly-history/",import.meta.url);
const sectionSizes={headlines:5,projects:5,models:5,moneyNews:6,skills:6,stockProjects:5,stockNews:5} as const;

export function validateWeeklyDigest(value:unknown):asserts value is WeeklyDigest{
  const data=value as WeeklyDigest,errors:string[]=[];
  if(!data||data.schemaVersion!==1)errors.push("schemaVersion 必须为 1");
  if(!/^\d{4}-W\d{2}$/.test(data?.week||""))errors.push("周编号格式错误");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(data?.periodStart||"")||!/^\d{4}-\d{2}-\d{2}$/.test(data?.periodEnd||""))errors.push("周报日期格式错误");
  if(data?.timezone!=="Asia/Shanghai")errors.push("时区必须为 Asia/Shanghai");
  for(const [name,size] of Object.entries(sectionSizes)){
    const items=data?.[name as keyof typeof sectionSizes];
    if(!Array.isArray(items)||items.length!==size)errors.push(`${name} 必须恰好 ${size} 条`);
    else if(items.some(item=>!item.url.startsWith("https://")||!item.sourceLabels.length||item.appearances<1||item.bestRank<1||item.weeklyScore<0||item.weeklyScore>100))errors.push(`${name} 包含无效条目`);
  }
  if(!data?.snapshotDays||Object.values(data.snapshotDays).some(value=>!Number.isInteger(value)||value<1||value>7))errors.push("快照覆盖天数无效");
  if(errors.length)throw new Error(errors.join("\n"));
}

export async function loadWeeklyDigest(){const data=JSON.parse(await readFile(currentUrl,"utf8"));validateWeeklyDigest(data);return data}
export async function loadWeeklyHistory(){const names=await readdir(historyUrl).catch(()=>[] as string[]),digests:WeeklyDigest[]=[];for(const name of names.filter(name=>/^\d{4}-W\d{2}\.json$/.test(name)).sort().reverse().slice(0,52)){try{const data=JSON.parse(await readFile(new URL(name,historyUrl),"utf8"));validateWeeklyDigest(data);digests.push(data)}catch(error){console.warn(`跳过无效周报 ${name}:`,error instanceof Error?error.message:error)}}return digests}
