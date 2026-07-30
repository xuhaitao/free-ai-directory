import { mkdir, rename, writeFile } from "node:fs/promises";
import { loadDailyHistory, loadDailySnapshot } from "./daily.ts";
import { loadOpportunityHistory, loadOpportunitySnapshot } from "./opportunities.ts";
import { loadStockHistory, loadStockSnapshot } from "./stocks.ts";
import type { WeeklyDigest, WeeklyDigestItem } from "./types.ts";
import { validateWeeklyDigest } from "./weekly.ts";

const contentDir=new URL("../content/",import.meta.url),currentUrl=new URL("weekly.json",contentDir),historyDir=new URL("weekly-history/",contentDir);
const now=new Date(),generatedAt=now.toISOString(),date=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
function weekInfo(value:string){const day=new Date(`${value}T12:00:00Z`),weekday=day.getUTCDay()||7,thursday=new Date(day);thursday.setUTCDate(day.getUTCDate()+4-weekday);const year=thursday.getUTCFullYear(),yearStart=new Date(Date.UTC(year,0,1)),week=Math.ceil((((thursday.getTime()-yearStart.getTime())/86400_000)+1)/7),monday=new Date(day);monday.setUTCDate(day.getUTCDate()+1-weekday);return{week:`${year}-W${String(week).padStart(2,"0")}`,start:monday.toISOString().slice(0,10)}}
const {week,start:periodStart}=weekInfo(date);
function uniqueWeek<T extends {date:string}>(current:T,history:T[]){const byDate=new Map<string,T>();for(const item of [current,...history])if(item.date>=periodStart&&item.date<=date&&!byDate.has(item.date))byDate.set(item.date,item);return[...byDate.values()].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7)}
type Projected={id:string;title:string;url:string;summary:string;sources:string[]};
function aggregate<T>(snapshots:T[][],project:(item:T)=>Projected,limit:number):WeeklyDigestItem[]{
  const groups=new Map<string,{item:Projected;ranks:number[]}>();
  for(const items of snapshots)items.forEach((raw,index)=>{const item=project(raw),group=groups.get(item.id)||{item,ranks:[]};group.ranks.push(index+1);groups.set(item.id,group)});
  return[...groups.values()].map(({item,ranks})=>{const rankScore=ranks.reduce((sum,rank)=>sum+Math.max(40,100-(rank-1)*6),0)/ranks.length,coverage=ranks.length/snapshots.length*100;return{...item,sourceLabels:item.sources,appearances:ranks.length,bestRank:Math.min(...ranks),weeklyScore:Math.round((rankScore*.7+coverage*.3)*10)/10}}).sort((a,b)=>b.weeklyScore-a.weeklyScore||b.appearances-a.appearances||a.bestRank-b.bestRank).slice(0,limit);
}

const [dailyCurrent,dailyHistory,opportunityCurrent,opportunityHistory,stockCurrent,stockHistory]=await Promise.all([loadDailySnapshot(),loadDailyHistory(),loadOpportunitySnapshot(),loadOpportunityHistory(),loadStockSnapshot(),loadStockHistory()]);
const daily=uniqueWeek(dailyCurrent,dailyHistory),opportunities=uniqueWeek(opportunityCurrent,opportunityHistory),stocks=uniqueWeek(stockCurrent,stockHistory);
const digest:WeeklyDigest={schemaVersion:1,week,periodStart,periodEnd:date,generatedAt,timezone:"Asia/Shanghai",snapshotDays:{daily:daily.length,opportunities:opportunities.length,stocks:stocks.length},
  headlines:aggregate(daily.map(snapshot=>snapshot.news),item=>({id:item.id,title:item.title,url:item.url,summary:`${item.source} · ${item.points} 赞同 · ${item.comments} 讨论`,sources:[item.source,"Hacker News 日榜"]}),5),
  projects:aggregate(daily.map(snapshot=>snapshot.projects),item=>({id:item.id,title:item.name,url:item.url,summary:item.description,sources:["GitHub"]}),5),
  models:aggregate(daily.map(snapshot=>snapshot.trendingModels),item=>({id:item.id,title:item.name,url:item.url,summary:`${item.pipelineTag} · 近月下载 ${item.downloads}`,sources:["Hugging Face"]}),5),
  moneyNews:aggregate(opportunities.map(snapshot=>snapshot.moneyNews),item=>({id:item.id,title:item.title,url:item.url,summary:`${item.signal} · 融合分 ${item.fusionScore}`,sources:item.sourcePlatforms}),6),
  skills:aggregate(opportunities.map(snapshot=>snapshot.skills),item=>({id:item.id,title:item.name,url:item.url,summary:`${item.source} · 安装趋势 ${item.installs} · 融合分 ${item.fusionScore}`,sources:["skills.sh","GitHub"]}),6),
  stockProjects:aggregate(stocks.map(snapshot=>snapshot.projects),item=>({id:item.id,title:item.name,url:item.url,summary:`${item.category} · ${item.summary}`,sources:["GitHub"]}),5),
  stockNews:aggregate(stocks.map(snapshot=>snapshot.news),item=>({id:item.id,title:item.title,url:item.url,summary:`${item.signal} · 情报分 ${item.score}`,sources:item.sourcePlatforms}),5)};
validateWeeklyDigest(digest);await mkdir(historyDir,{recursive:true});const tempUrl=new URL(`weekly.${process.pid}.tmp`,contentDir);await writeFile(tempUrl,JSON.stringify(digest,null,2)+"\n");await rename(tempUrl,currentUrl);await writeFile(new URL(`${week}.json`,historyDir),JSON.stringify(digest,null,2)+"\n");console.log(`AI 情报周报更新完成：${week}，覆盖日榜 ${daily.length} 天、机会榜 ${opportunities.length} 天、AI 炒股 ${stocks.length} 天`);
