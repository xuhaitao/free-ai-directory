import { loadOpportunitySnapshot } from "./opportunities.ts";
const data=await loadOpportunitySnapshot();
if(Date.now()-new Date(data.generatedAt).getTime()>48*3600_000)throw new Error("AI 创收资讯与 Skill 热榜超过 48 小时未更新");
console.log(`机会榜校验通过：${data.date}，创收资讯 ${data.moneyNews.length} 条、Skill ${data.skills.length} 条`);
