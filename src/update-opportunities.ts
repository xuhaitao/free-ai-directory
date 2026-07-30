import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import type { AIMoneyNews, OpportunitySnapshot, TrendingSkill } from "./types.ts";
import { validateOpportunitySnapshot } from "./opportunities.ts";

const contentDir=new URL("../content/",import.meta.url),currentUrl=new URL("opportunities.json",contentDir),historyDir=new URL("opportunities-history/",contentDir);
const now=new Date(),generatedAt=now.toISOString(),date=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
const userAgent="free-ai-directory-opportunities/1.0 (+https://www.qaz5678.xyz/methodology/)";
const aiPattern=/\b(ai|llm|llms|gpt|openai|anthropic|claude|gemini|deepseek|qwen|mistral|llama|chatbot|machine learning|agent|agents|generative)\b/i;
const businessPattern=/\b(revenue|arr|mrr|profit|profitable|money|monetiz|business|startup|saas|customer|client|freelanc|marketing|sales|pricing|paid|subscription|income|creator|agency|automation|commerce|shop|store|acqui|funding|raised|valuation|lead generation)\b/i;

const clean=(value:string)=>value.replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim();
async function request(url:string){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25_000);try{const response=await fetch(url,{headers:{"user-agent":userAgent,accept:"application/json,text/html;q=0.9"},signal:controller.signal});if(!response.ok)throw new Error(`${new URL(url).host} HTTP ${response.status}`);return response}finally{clearTimeout(timer)}}
function signalFor(text:string):AIMoneyNews["signal"]{
  if(/\b(revenue|arr|mrr|profit|profitable|income|money|monetiz)\b/i.test(text))return "收入 / 盈利";
  if(/\b(customer|client|sales|lead generation|lead)\b/i.test(text))return "获客 / 销售";
  if(/\b(pricing|paid|subscription)\b/i.test(text))return "付费 / 定价";
  if(/\b(freelanc|agency|creator|content)\b/i.test(text))return "服务 / 内容变现";
  if(/\b(automation|workflow|productivity|save money|cost)\b/i.test(text))return "自动化提效";
  return "创业 / SaaS";
}
async function fetchMoneyNews():Promise<AIMoneyNews[]>{
  const terms=["AI SaaS","AI revenue","AI business","AI startup","AI automation","AI marketing","AI freelance","AI customers","AI pricing","AI subscription","LLM SaaS","AI content creator"];
  const since=Math.floor((Date.now()-45*86400_000)/1000),hits:any[]=[];
  for(const query of terms){const params=new URLSearchParams({query,tags:"story",numericFilters:`created_at_i>${since}`,hitsPerPage:"100"});const json=await(await request(`https://hn.algolia.com/api/v1/search_by_date?${params}`)).json() as any;hits.push(...(json.hits||[]))}
  const seen=new Set<string>(),items:AIMoneyNews[]=[];
  for(const hit of hits){
    const title=clean(String(hit.title||"")),context=`${title} ${clean(String(hit.story_text||""))}`;
    if(!title||/^(Ask|Tell|Hiring) HN:/i.test(title)||!aiPattern.test(context)||!businessPattern.test(context))continue;
    const destination=String(hit.url||`https://news.ycombinator.com/item?id=${hit.objectID}`).replace(/^http:/,"https:");
    const canonical=destination.replace(/[?#].*$/,"").replace(/\/$/,"").toLowerCase();if(seen.has(canonical))continue;seen.add(canonical);
    const ageHours=Math.max(1,(Date.now()-new Date(hit.created_at).getTime())/3600_000),points=Number(hit.points||0),comments=Number(hit.num_comments||0);
    items.push({id:String(hit.objectID),title,url:destination,discussionUrl:`https://news.ycombinator.com/item?id=${hit.objectID}`,source:(()=>{try{return new URL(destination).hostname.replace(/^www\./,"")}catch{return"news.ycombinator.com"}})(),publishedAt:new Date(hit.created_at).toISOString(),points,comments,hotScore:Math.round((points+comments*1.6+20)/Math.pow(1+ageHours/24,.55)),signal:signalFor(context)});
  }
  return items.sort((a,b)=>b.hotScore-a.hotScore||b.points-a.points).slice(0,50);
}
async function fetchTrendingSkills():Promise<TrendingSkill[]>{
  const html=await(await request("https://skills.sh/trending")).text(),marker=html.indexOf("initialSkills"),start=html.indexOf("[{",marker),end=html.indexOf("}]",start)+2;
  if(marker<0||start<0||end<2)throw new Error("skills.sh 页面未找到榜单数据");
  const rows=JSON.parse(html.slice(start,end).replaceAll('\\"','"')) as {source:string;skillId:string;name:string;installs:number}[];
  const seen=new Set<string>(),items:TrendingSkill[]=[];
  for(const row of rows){if(!row.source||!row.skillId||!Number.isFinite(row.installs))continue;const id=`${row.source}/${row.skillId}`.toLowerCase();if(seen.has(id))continue;seen.add(id);const websiteSource=!row.source.includes("/");items.push({id,name:clean(row.name||row.skillId),source:row.source,url:`https://skills.sh/${websiteSource?"site/":""}${row.source}/${row.skillId}`,installs:row.installs,...(!websiteSource&&{installUrl:`https://github.com/${row.source}`})});if(items.length===50)break}
  return items;
}
async function previousSnapshot():Promise<OpportunitySnapshot|null>{try{const data=JSON.parse(await readFile(currentUrl,"utf8"));validateOpportunitySnapshot(data);return data}catch{return null}}
const previous=await previousSnapshot(),sourceStatus:OpportunitySnapshot["sourceStatus"]=[];
async function section<T>(name:string,url:string,run:()=>Promise<T[]>,old:T[]|undefined,min:number){try{const value=await run();if(value.length<min)throw new Error(`只得到 ${value.length} 条`);sourceStatus.push({name,url,ok:true,note:"本次抓取成功"});return value}catch(error){if(!old?.length)throw error;const note=error instanceof Error?error.message:String(error);sourceStatus.push({name,url,ok:false,note:`抓取失败，保留上一版：${note}`});return old}}
const moneyNews=await section("Hacker News / Algolia 商业化线索","https://hn.algolia.com/api",fetchMoneyNews,previous?.moneyNews,40);
const skills=await section("skills.sh 24 小时 Trending","https://skills.sh/trending",fetchTrendingSkills,previous?.skills,50);
const snapshot:OpportunitySnapshot={schemaVersion:1,date,generatedAt,timezone:"Asia/Shanghai",moneyNews,skills,sourceStatus};validateOpportunitySnapshot(snapshot);
await mkdir(historyDir,{recursive:true});const tempUrl=new URL(`opportunities.${process.pid}.tmp`,contentDir);await writeFile(tempUrl,JSON.stringify(snapshot,null,2)+"\n");await rename(tempUrl,currentUrl);await writeFile(new URL(`${date}.json`,historyDir),JSON.stringify(snapshot,null,2)+"\n");
console.log(`机会榜更新完成：${date}，创收资讯 ${moneyNews.length}、Skill ${skills.length}`);for(const source of sourceStatus)console.log(`${source.ok?"OK":"STALE"} ${source.name}: ${source.note}`);
