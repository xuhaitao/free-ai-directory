import { loadWeeklyDigest } from "./weekly.ts";
const data=await loadWeeklyDigest();
console.log(`周报校验通过：${data.week}，覆盖 ${data.snapshotDays.daily}/${data.snapshotDays.opportunities}/${data.snapshotDays.stocks} 天快照`);
