import { loadStockSnapshot } from "./stocks.ts";
const data=await loadStockSnapshot();
if(Date.now()-new Date(data.generatedAt).getTime()>48*3600_000)throw new Error("AI 炒股情报超过 48 小时未更新");
console.log(`AI 炒股情报校验通过：${data.date}，项目 ${data.projects.length}，新闻 ${data.news.length}`);
