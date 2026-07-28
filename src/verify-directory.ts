import { loadDirectorySnapshot } from "./directory.ts";

const snapshot = await loadDirectorySnapshot();
const age = Date.now() - new Date(snapshot.generatedAt).getTime();
if (age > 72 * 3600_000) throw new Error(`目录快照超过 72 小时：${snapshot.generatedAt}`);
console.log(`目录数据校验通过：${snapshot.date}，模型 ${snapshot.models.length}，中转站 ${snapshot.relays.length}，链接检查 ${snapshot.checks.length}`);
