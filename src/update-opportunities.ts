import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import type { AIMoneyNews, OpportunitySnapshot, TrendingSkill } from "./types.ts";
import { validateOpportunitySnapshot } from "./opportunities.ts";

const contentDir=new URL("../content/",import.meta.url),currentUrl=new URL("opportunities.json",contentDir),historyDir=new URL("opportunities-history/",contentDir);
const now=new Date(),generatedAt=now.toISOString(),date=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
const userAgent="free-ai-directory-opportunities/2.0 (+https://www.qaz5678.xyz/methodology/)";
const aiPattern=/\b(ai|llm|llms|gpt|openai|anthropic|claude|gemini|deepseek|qwen|mistral|llama|chatbot|machine learning|agent|agents|generative)\b/i;
const businessPattern=/\b(revenue|arr|mrr|profit|profitable|money|monetiz|business|startup|saas|customer|client|freelanc|marketing|sales|pricing|paid|subscription|income|creator|agency|automation|commerce|shop|store|acqui|funding|raised|valuation|lead generation|productivity|workflow)\b/i;
const offTopicPattern=/\b(hack|hacked|security|vulnerab|exploit|malware|breach|crypto flaw|benchmark|research paper)\b/i;
const moneyPlatforms=["Hacker News","DEV Community","Bing News","TechCrunch","VentureBeat"] as const;
type MoneyPlatform=(typeof moneyPlatforms)[number];
type MoneyCandidate={platform:MoneyPlatform;title:string;url:string;evidenceUrl:string;source:string;publishedAt:string;engagement:number;context:string;platformScore?:number};
type SkillRow={source:string;skillId:string;name:string;installs:number};
type RepoMeta={stars:number;forks:number;updatedAt:string};

const clean=(value:string)=>value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/\s+/g," ").trim();
const round=(value:number)=>Math.round(value*10)/10;
const host=(url:string)=>{try{return new URL(url).hostname.replace(/^www\./,"")}catch{return"unknown"}};
const hash=(value:string)=>createHash("sha1").update(value).digest("hex").slice(0,16);
async function requestBody<T>(url:string,parse:(response:Response)=>Promise<T>,accept="application/json,text/html;q=0.9,application/xml;q=0.8"){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25_000);try{const response=await fetch(url,{headers:{"user-agent":userAgent,accept},signal:controller.signal,redirect:"follow"});if(!response.ok)throw new Error(`${new URL(url).host} HTTP ${response.status}`);return await parse(response)}finally{clearTimeout(timer)}}
const requestText=(url:string,accept?:string)=>requestBody(url,response=>response.text(),accept);
const requestJson=<T>(url:string)=>requestBody(url,response=>response.json() as Promise<T>);
function signalFor(text:string):AIMoneyNews["signal"]{
  if(/\b(revenue|arr|mrr|profit|profitable|income|money|monetiz)\b/i.test(text))return "收入 / 盈利";
  if(/\b(customer|client|sales|lead generation|lead)\b/i.test(text))return "获客 / 销售";
  if(/\b(pricing|paid|subscription)\b/i.test(text))return "付费 / 定价";
  if(/\b(freelanc|agency|creator|content)\b/i.test(text))return "服务 / 内容变现";
  if(/\b(automation|workflow|productivity|save money|cost)\b/i.test(text))return "自动化提效";
  return "创业 / SaaS";
}
function eligible(title:string,context:string){const full=`${title} ${context}`;return !!title&&!/^(Ask|Tell|Hiring) HN:/i.test(title)&&(aiPattern.test(title)||businessPattern.test(title))&&aiPattern.test(full)&&businessPattern.test(full)&&(!offTopicPattern.test(title)||businessPattern.test(title))}
function canonicalUrl(value:string){try{const url=new URL(value.replace(/^http:/,"https:"));for(const key of ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","ref","source"])url.searchParams.delete(key);url.hash="";return url.toString().replace(/\/$/,"")}catch{return value}}
function titleKey(value:string){return clean(value).toLowerCase().replace(/\s[-–—|:]\s[^-–—|:]{2,35}$/," ").replace(/[^a-z0-9\u4e00-\u9fff]+/g," ").split(" ").filter(word=>word.length>1&&!new Set(["the","and","for","with","from","that","this","how","why","into","using"]).has(word)).slice(0,14).join(" ")}
function xmlTag(item:string,name:string){return clean(item.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`,"i"))?.[1]||"")}
async function mapLimit<T,R>(items:T[],limit:number,worker:(item:T)=>Promise<R>){const results:R[]=new Array(items.length);let next=0;await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(next<items.length){const index=next++;results[index]=await worker(items[index]!)} }));return results}

async function fetchHackerNews():Promise<MoneyCandidate[]>{
  const terms=["AI SaaS","AI revenue","AI business","AI startup","AI automation","AI marketing","AI freelance","AI customers","AI pricing","AI subscription","LLM SaaS","AI content creator"],since=Math.floor((Date.now()-45*86400_000)/1000);
  const pages=await mapLimit(terms,4,async query=>{try{const params=new URLSearchParams({query,tags:"story",numericFilters:`created_at_i>${since}`,hitsPerPage:"100"});const json=await requestJson<{hits?:any[]}>(`https://hn.algolia.com/api/v1/search_by_date?${params}`);return json.hits||[]}catch{return[]}});
  return pages.flat().flatMap((hit:any)=>{const title=clean(String(hit.title||"")),context=clean(String(hit.story_text||""));if(!eligible(title,context))return[];const discussion=`https://news.ycombinator.com/item?id=${hit.objectID}`,url=canonicalUrl(String(hit.url||discussion));return[{platform:"Hacker News" as const,title,url,evidenceUrl:discussion,source:host(url),publishedAt:new Date(hit.created_at).toISOString(),engagement:Number(hit.points||0)+Number(hit.num_comments||0)*1.6,context:`${title} ${context}`} ]});
}
async function fetchDevCommunity():Promise<MoneyCandidate[]>{
  const tags=["ai","startup","productivity","saas","automation","marketing"],pages=await mapLimit(tags,3,async tag=>{const xml=await requestText(`https://dev.to/feed/tag/${tag}`,"application/rss+xml,application/xml;q=0.9");return(xml.match(/<item>[\s\S]*?<\/item>/gi)||[]).map((item,index)=>({item,index}))});
  return pages.flat().flatMap(({item,index})=>{const title=xmlTag(item,"title"),description=xmlTag(item,"description"),url=canonicalUrl(xmlTag(item,"link")),published=xmlTag(item,"pubDate");if(!eligible(title,description)||!url.startsWith("https://"))return[];return[{platform:"DEV Community" as const,title,url,evidenceUrl:url,source:host(url),publishedAt:new Date(published).toISOString(),engagement:Math.max(1,100-index*6),context:`${title} ${description}`} ]});
}
async function fetchBingNews():Promise<MoneyCandidate[]>{
  const queries=["AI business","AI startup","AI revenue","AI automation business"],pages=await mapLimit(queries,4,async query=>{const url=`https://www.bing.com/news/search?${new URLSearchParams({q:query,format:"rss",setlang:"en-US"})}`;const xml=await requestText(url,"application/rss+xml,application/xml;q=0.9");return(xml.match(/<item>[\s\S]*?<\/item>/gi)||[]).map((item,index)=>({item,index}))});
  return pages.flat().flatMap(({item,index})=>{const title=xmlTag(item,"title"),description=xmlTag(item,"description"),published=xmlTag(item,"pubDate"),rssLink=xmlTag(item,"link"),publisher=xmlTag(item,"News:Source");if(!eligible(title,description))return[];let url=rssLink;try{const redirect=new URL(rssLink);url=decodeURIComponent(redirect.searchParams.get("url")||rssLink)}catch{}url=canonicalUrl(url);if(!url.startsWith("https://"))return[];return[{platform:"Bing News" as const,title,url,evidenceUrl:rssLink.replace(/^http:/,"https:"),source:publisher||host(url),publishedAt:new Date(published).toISOString(),engagement:Math.max(1,100-index*6),context:`${title} ${description}`} ]});
}
async function fetchTechCrunch():Promise<MoneyCandidate[]>{
  const feed="https://techcrunch.com/category/artificial-intelligence/feed/",xml=await requestText(feed,"application/rss+xml,application/xml;q=0.9"),items=xml.match(/<item>[\s\S]*?<\/item>/gi)||[];
  return items.flatMap((item,index)=>{const title=xmlTag(item,"title"),description=xmlTag(item,"description"),url=canonicalUrl(xmlTag(item,"link")),published=xmlTag(item,"pubDate");if(!eligible(title,description)||!url.startsWith("https://"))return[];return[{platform:"TechCrunch" as const,title,url,evidenceUrl:url,source:"TechCrunch",publishedAt:new Date(published).toISOString(),engagement:Math.max(1,100-index*4),context:`${title} ${description}`} ]});
}
async function fetchVentureBeat():Promise<MoneyCandidate[]>{
  const feed="https://venturebeat.com/category/ai/feed/",xml=await requestText(feed,"application/rss+xml,application/xml;q=0.9"),items=xml.match(/<item>[\s\S]*?<\/item>/gi)||[];
  return items.flatMap((item,index)=>{const title=xmlTag(item,"title"),description=xmlTag(item,"description"),url=canonicalUrl(xmlTag(item,"link")),published=xmlTag(item,"pubDate");if(!eligible(title,description)||!url.startsWith("https://"))return[];return[{platform:"VentureBeat" as const,title,url,evidenceUrl:url,source:"VentureBeat",publishedAt:new Date(published).toISOString(),engagement:Math.max(1,100-index*6),context:`${title} ${description}`} ]});
}
function fuseMoneyNews(candidates:MoneyCandidate[]):AIMoneyNews[]{
  const unique=new Map<string,MoneyCandidate>();for(const item of candidates){const key=`${item.platform}:${canonicalUrl(item.url).toLowerCase()}`;const old=unique.get(key);if(!old||item.engagement>old.engagement)unique.set(key,item)}const rows=[...unique.values()];
  for(const platform of moneyPlatforms){const group=rows.filter(item=>item.platform===platform).sort((a,b)=>a.engagement-b.engagement);group.forEach((item,index)=>item.platformScore=round(group.length<2?50:index/(group.length-1)*100))}
  const groups=new Map<string,MoneyCandidate[]>(),urlKeys=new Map<string,string>();
  for(const item of rows){const urlKey=canonicalUrl(item.url).toLowerCase(),nameKey=titleKey(item.title),existing=urlKeys.get(urlKey)||(groups.has(nameKey)?nameKey:"");const key=existing||nameKey||urlKey;const group=groups.get(key)||[];group.push(item);groups.set(key,group);urlKeys.set(urlKey,key)}
  const fused=[...groups.values()].map(group=>{const latest=group.reduce((a,b)=>new Date(a.publishedAt)>new Date(b.publishedAt)?a:b),evidence=[...new Map(group.map(item=>[`${item.platform}:${item.evidenceUrl}`,item])).values()].sort((a,b)=>(b.platformScore||0)-(a.platformScore||0)),sourcePlatforms=[...new Set(evidence.map(item=>item.platform))],ageDays=Math.max(0,(Date.now()-new Date(latest.publishedAt).getTime())/86400_000),engagementScore=round(evidence.slice(0,2).reduce((sum,item)=>sum+(item.platformScore||0),0)/Math.min(2,evidence.length)),freshnessScore=round(100*Math.pow(.5,ageDays/10)),coverageScore=sourcePlatforms.length===1?35:sourcePlatforms.length===2?75:100,fusionScore=round(engagementScore*.45+freshnessScore*.35+coverageScore*.20);return{id:hash(canonicalUrl(latest.url).toLowerCase()),title:latest.title,url:latest.url,source:latest.source,publishedAt:latest.publishedAt,sourcePlatforms,evidence:evidence.map(item=>({platform:item.platform,url:item.evidenceUrl,engagement:round(item.engagement)})),engagementScore,freshnessScore,coverageScore,fusionScore,signal:signalFor(group.map(item=>item.context).join(" "))}});
  const sorted=fused.sort((a,b)=>b.fusionScore-a.fusionScore||b.sourcePlatforms.length-a.sourcePlatforms.length||new Date(b.publishedAt).getTime()-new Date(a.publishedAt).getTime()),selected:AIMoneyNews[]=[],counts=new Map<string,number>();
  for(const item of sorted){const primary=item.sourcePlatforms[0]!;if((counts.get(primary)||0)>=22)continue;selected.push(item);counts.set(primary,(counts.get(primary)||0)+1);if(selected.length===50)break}for(const item of sorted){if(selected.length===50)break;if(!selected.includes(item))selected.push(item)}return selected;
}

async function fetchSkillRows():Promise<SkillRow[]>{
  const html=await requestText("https://skills.sh/trending"),marker=html.indexOf("initialSkills"),start=html.indexOf("[{",marker),end=html.indexOf("}]",start)+2;if(marker<0||start<0||end<2)throw new Error("skills.sh 页面未找到榜单数据");
  const rows=JSON.parse(html.slice(start,end).replaceAll('\\"','"')) as SkillRow[],seen=new Set<string>();return rows.filter(row=>{const id=`${row.source}/${row.skillId}`.toLowerCase();if(!row.source.includes("/")||!row.skillId||!Number.isFinite(row.installs)||seen.has(id))return false;seen.add(id);return true}).slice(0,220);
}
async function fetchRepoMeta(source:string):Promise<RepoMeta>{
  const repoUrl=`https://github.com/${source}`,[html,atom]=await Promise.all([requestText(repoUrl),requestText(`${repoUrl}/commits.atom`,"application/atom+xml,application/xml;q=0.9")]);const stars=Number(html.match(/"stargazerCount":(\d+)/)?.[1]),forks=Number(html.match(/"forksCount":(\d+)/)?.[1]),updatedAt=xmlTag(atom,"updated");if(!Number.isFinite(stars)||!Number.isFinite(forks)||!updatedAt)throw new Error(`${source} 元数据不完整`);return{stars,forks,updatedAt:new Date(updatedAt).toISOString()};
}
function fuseSkills(rows:SkillRow[],metadata:Map<string,RepoMeta>):TrendingSkill[]{
  const candidates=rows.filter(row=>metadata.has(row.source)),repoValues=[...metadata.values()],maxInstall=Math.max(...candidates.map(row=>Math.log1p(row.installs))),maxStars=Math.max(...repoValues.map(meta=>Math.log1p(meta.stars))),maxForks=Math.max(...repoValues.map(meta=>Math.log1p(meta.forks)));
  const ranked=candidates.map(row=>{const meta=metadata.get(row.source)!,installScore=round(Math.log1p(row.installs)/maxInstall*100),repositoryScore=round((Math.log1p(meta.stars)/maxStars*75)+(Math.log1p(meta.forks)/maxForks*25)),ageDays=Math.max(0,(Date.now()-new Date(meta.updatedAt).getTime())/86400_000),freshnessScore=round(100*Math.pow(.5,ageDays/120)),fusionScore=round(installScore*.60+repositoryScore*.25+freshnessScore*.15),id=`${row.source}/${row.skillId}`.toLowerCase();return{id,name:clean(row.name||row.skillId),source:row.source,url:`https://skills.sh/${row.source}/${row.skillId}`,installs:row.installs,installUrl:`https://github.com/${row.source}`,githubStars:meta.stars,githubForks:meta.forks,repositoryUpdatedAt:meta.updatedAt,installScore,repositoryScore,freshnessScore,fusionScore}}).sort((a,b)=>b.fusionScore-a.fusionScore||b.installs-a.installs);
  const selected:TrendingSkill[]=[],sourceCounts=new Map<string,number>();for(const item of ranked){if((sourceCounts.get(item.source)||0)>=5)continue;selected.push(item);sourceCounts.set(item.source,(sourceCounts.get(item.source)||0)+1);if(selected.length===50)break}return selected;
}

async function previousSnapshot():Promise<OpportunitySnapshot|null>{try{const data=JSON.parse(await readFile(currentUrl,"utf8"));validateOpportunitySnapshot(data);return data}catch{return null}}
const previous=await previousSnapshot(),sourceStatus:OpportunitySnapshot["sourceStatus"]=[];
async function moneySource(name:MoneyPlatform,url:string,run:()=>Promise<MoneyCandidate[]>){try{const rows=await run();if(rows.length<5)throw new Error(`只得到 ${rows.length} 条`);sourceStatus.push({name,url,ok:true,note:`抓取 ${rows.length} 条候选，参与站内归一化`});return rows}catch(error){sourceStatus.push({name,url,ok:false,note:error instanceof Error?error.message:String(error)});return[]}}
const moneyCandidates=(await Promise.all([moneySource("Hacker News","https://hn.algolia.com/api",fetchHackerNews),moneySource("DEV Community","https://dev.to/feed/tag/ai",fetchDevCommunity),moneySource("Bing News","https://www.bing.com/news/search",fetchBingNews),moneySource("TechCrunch","https://techcrunch.com/category/artificial-intelligence/feed/",fetchTechCrunch),moneySource("VentureBeat","https://venturebeat.com/category/ai/feed/",fetchVentureBeat)])).flat();
const successfulMoneySources=sourceStatus.filter(item=>item.ok&&moneyPlatforms.includes(item.name as MoneyPlatform)).map(item=>item.name);let moneyNews=fuseMoneyNews(moneyCandidates);if(successfulMoneySources.length<2||moneyNews.length<40){if(!previous?.moneyNews.length)throw new Error(`多源创收资讯不足：${moneyNews.length} 条`);moneyNews=previous.moneyNews;sourceStatus.push({name:"创收融合榜",url:"https://www.qaz5678.xyz/methodology/",ok:false,note:"成功来源少于 2 个或条目不足，保留上一版融合榜"})}else sourceStatus.push({name:"创收融合榜",url:"https://www.qaz5678.xyz/methodology/",ok:true,note:`${successfulMoneySources.join(" + ")} 站内归一化后按 45% 互动、35% 时效、20% 跨源覆盖排序`});

let skills:TrendingSkill[];try{const rows=await fetchSkillRows();sourceStatus.push({name:"skills.sh Trending",url:"https://skills.sh/trending",ok:true,note:`抓取 ${rows.length} 个带公开 GitHub 仓库的候选`});const sources=[...new Set(rows.map(row=>row.source))].slice(0,40),results=await mapLimit(sources,6,async source=>{try{return[source,await fetchRepoMeta(source)] as const}catch{return[source,null] as const}}),metadata=new Map(results.filter((row):row is readonly[string,RepoMeta]=>row[1]!==null));if(metadata.size<10)throw new Error(`GitHub 只核验 ${metadata.size}/${sources.length} 个仓库`);sourceStatus.push({name:"GitHub 仓库信号",url:"https://docs.github.com/en/repositories",ok:true,note:`核验 ${metadata.size}/${sources.length} 个仓库的 Star、Fork 与最近提交`});skills=fuseSkills(rows,metadata);if(skills.length!==50)throw new Error(`融合后只得到 ${skills.length} 个 Skill`);sourceStatus.push({name:"Skill 融合榜",url:"https://www.qaz5678.xyz/methodology/",ok:true,note:"按 60% 安装趋势、25% 仓库关注、15% 更新活跃排序；同仓最多 5 席"})}catch(error){if(!previous?.skills.length)throw error;skills=previous.skills;sourceStatus.push({name:"Skill 融合榜",url:"https://www.qaz5678.xyz/methodology/",ok:false,note:`更新失败，保留上一版：${error instanceof Error?error.message:String(error)}`})}

const snapshot:OpportunitySnapshot={schemaVersion:1,date,generatedAt,timezone:"Asia/Shanghai",moneyNews,skills,sourceStatus};validateOpportunitySnapshot(snapshot);
await mkdir(historyDir,{recursive:true});const tempUrl=new URL(`opportunities.${process.pid}.tmp`,contentDir);await writeFile(tempUrl,JSON.stringify(snapshot,null,2)+"\n");await rename(tempUrl,currentUrl);await writeFile(new URL(`${date}.json`,historyDir),JSON.stringify(snapshot,null,2)+"\n");
console.log(`机会融合榜更新完成：${date}，创收资讯 ${moneyNews.length}、Skill ${skills.length}`);for(const source of sourceStatus)console.log(`${source.ok?"OK":"STALE"} ${source.name}: ${source.note}`);
