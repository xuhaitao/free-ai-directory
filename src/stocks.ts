import { readFile, readdir } from "node:fs/promises";
import type { StockSnapshot } from "./types.ts";

const currentUrl=new URL("../content/stocks.json",import.meta.url),historyUrl=new URL("../content/stocks-history/",import.meta.url);

export function validateStockSnapshot(value:unknown):asserts value is StockSnapshot{
  const data=value as StockSnapshot,errors:string[]=[];
  if(!data||data.schemaVersion!==1)errors.push("schemaVersion 必须为 1");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(data?.date||""))errors.push("日期格式错误");
  if(data?.timezone!=="Asia/Shanghai")errors.push("时区必须为 Asia/Shanghai");
  if(!Array.isArray(data?.projects)||data.projects.length!==12)errors.push("AI 炒股工具与项目必须恰好 12 条");
  if(!Array.isArray(data?.news)||data.news.length!==12)errors.push("AI 炒股新闻必须恰好 12 条");
  if(new Set(data?.projects?.map(item=>item.id)).size!==data?.projects?.length)errors.push("AI 炒股项目 ID 重复");
  if(new Set(data?.news?.map(item=>item.id)).size!==data?.news?.length)errors.push("AI 炒股新闻 ID 重复");
  if((data?.projects||[]).some(item=>!item.url.startsWith("https://github.com/")||!item.sourceUrl.startsWith("https://github.com/")))errors.push("AI 炒股项目必须有 GitHub 公开来源");
  if((data?.projects||[]).some(item=>[item.popularityScore,item.freshnessScore,item.score].some(score=>!Number.isFinite(score)||score<0||score>100)))errors.push("AI 炒股项目评分无效");
  if((data?.news||[]).some(item=>!item.url.startsWith("https://")||!item.evidence?.length||item.evidence.some(source=>!source.url.startsWith("https://"))))errors.push("AI 炒股新闻缺少 HTTPS 来源证据");
  if(new Set((data?.news||[]).flatMap(item=>item.sourcePlatforms||[])).size<2)errors.push("AI 炒股新闻至少需要两个独立平台来源");
  if((data?.news||[]).some(item=>[item.sourceScore,item.freshnessScore,item.score].some(score=>!Number.isFinite(score)||score<0||score>100)))errors.push("AI 炒股新闻评分无效");
  if(errors.length)throw new Error(errors.join("\n"));
}

export async function loadStockSnapshot(){const data=JSON.parse(await readFile(currentUrl,"utf8"));validateStockSnapshot(data);return data}
export async function loadStockHistory(){const names=await readdir(historyUrl).catch(()=>[] as string[]),snapshots:StockSnapshot[]=[];for(const name of names.filter(name=>/^\d{4}-\d{2}-\d{2}\.json$/.test(name)).sort().reverse().slice(0,90)){try{const data=JSON.parse(await readFile(new URL(name,historyUrl),"utf8"));validateStockSnapshot(data);snapshots.push(data)}catch(error){console.warn(`跳过无效 AI 炒股归档 ${name}:`,error instanceof Error?error.message:error)}}return snapshots}
