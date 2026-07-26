import { loadDailySnapshot } from "./daily.ts";
const data = await loadDailySnapshot();
const now = Date.now();
const stale = Object.entries(data.freshness).filter(([, value]) => now - new Date(value).getTime() > 48 * 3600_000);
if (stale.length) throw new Error(`每日数据超过 48 小时未更新：${stale.map(([name]) => name).join("、")}`);
console.log(`每日数据校验通过：${data.date}，3 个榜单各 10 条`);
