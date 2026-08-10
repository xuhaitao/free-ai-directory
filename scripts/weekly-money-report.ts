/**
 * 生成 AI 赚钱周报 Markdown
 * 用法: npx tsx scripts/weekly-money-report.ts
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import type { OpportunitySnapshot } from "../src/types.ts";

const BASE = process.env.PUBLIC_SITE_URL || "https://www.qaz5678.xyz";
const CAMPAIGN = "utm_source=github&utm_medium=referral&utm_campaign=topic_test_2026q3&utm_content=ai_money";

async function main() {
  const historyDir = new URL("../content/opportunities-history/", import.meta.url);
  const names = (await readdir(historyDir).catch(() => [] as string[]))
    .filter(n => /^\d{4}-\d{2}-\d{2}\.json$/.test(n))
    .sort()
    .reverse()
    .slice(0, 7);

  const snapshots: OpportunitySnapshot[] = [];
  for (const name of names) {
    try {
      const data = JSON.parse(await readFile(new URL(name, historyDir), "utf8"));
      if (data.schemaVersion === 1 && Array.isArray(data.moneyNews)) snapshots.push(data);
    } catch { /* skip */ }
  }

  if (snapshots.length === 0) {
    // Fallback: try current
    try {
      const current = JSON.parse(await readFile(new URL("../content/opportunities.json", import.meta.url), "utf8"));
      snapshots.push(current);
    } catch { console.error("No data available"); process.exit(1); }
  }

  const latest = snapshots[0]!;
  const allNews = snapshots.flatMap(s => s.moneyNews);
  const top10 = [...allNews].sort((a, b) => b.fusionScore - a.fusionScore).slice(0, 10);
  const seen = new Set<string>();
  const uniqueTop10 = top10.filter(item => { if (seen.has(item.id)) return false; seen.add(item.id); return true; }).slice(0, 10);

  // 信号分布
  const signalCounts = new Map<string, number>();
  for (const item of allNews) signalCounts.set(item.signal, (signalCounts.get(item.signal) || 0) + 1);
  const sortedSignals = [...signalCounts.entries()].sort((a, b) => b[1] - a[1]);

  const pageUrl = `${BASE}/ai-money/?${CAMPAIGN}`;
  const md = [
    `# AI 赚钱周报（${latest.date}）`,
    "",
    `> 数据覆盖 ${snapshots.length} 天（${snapshots[snapshots.length - 1]!.date} ~ ${latest.date}），共 ${allNews.length} 条公开商业化线索。`,
    `> 本站仅整理公开资料，不构成收入承诺或赚钱保证。`,
    "",
    "---",
    "",
    "## 本周 Top 10 精选",
    "",
    ...uniqueTop10.map((item, i) => {
      const platforms = item.sourcePlatforms.join(" + ");
      return `${i + 1}. **[${item.title}](${item.url})** — ${item.signal} · 来源 ${item.source}（${platforms}）· 融合分 ${item.fusionScore}`;
    }),
    "",
    "---",
    "",
    "## 本周信号分布",
    "",
    ...sortedSignals.map(([signal, count]) => `- **${signal}**：${count} 条`),
    "",
    "---",
    "",
    "## 风险提示",
    "",
    "- 以上只是公开商业化线索，不代表收入承诺或「保证赚钱」",
    "- 标题、产品自述和社区讨论都可能有偏差",
    "- 不要因为单条资讯付费、投资或上传敏感数据",
    "- 点击原文和来源证据交叉验证",
    "",
    `👉 [查看今日完整榜单（约 50 条）](${pageUrl})`,
    "",
    `📡 [订阅 AI 创收 RSS](/ai-money.xml)`,
    "",
  ].join("\n");

  const outDir = new URL("../marketing/", import.meta.url);
  await mkdir(outDir, { recursive: true });
  const outPath = new URL(`weekly-money-${latest.date}.md`, outDir);
  await writeFile(outPath, md, "utf8");
  console.log(`✅ 周报已生成: ${outPath.pathname}`);
}

main().catch(err => { console.error(err); process.exit(1); });
