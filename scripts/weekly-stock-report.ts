/**
 * 生成 AI 炒股周报 Markdown
 * 用法: npx tsx scripts/weekly-stock-report.ts
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import type { StockSnapshot } from "../src/types.ts";

const BASE = process.env.PUBLIC_SITE_URL || "https://www.qaz5678.xyz";
const CAMPAIGN = "utm_source=github&utm_medium=referral&utm_campaign=topic_test_2026q3&utm_content=ai_stocks";

function compactNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

async function main() {
  const historyDir = new URL("../content/stocks-history/", import.meta.url);
  const names = (await readdir(historyDir).catch(() => [] as string[]))
    .filter(n => /^\d{4}-\d{2}-\d{2}\.json$/.test(n))
    .sort()
    .reverse()
    .slice(0, 7);

  const snapshots: StockSnapshot[] = [];
  for (const name of names) {
    try {
      const data = JSON.parse(await readFile(new URL(name, historyDir), "utf8"));
      if (data.schemaVersion === 1 && Array.isArray(data.projects)) snapshots.push(data);
    } catch { /* skip */ }
  }

  if (snapshots.length === 0) {
    try {
      const current = JSON.parse(await readFile(new URL("../content/stocks.json", import.meta.url), "utf8"));
      snapshots.push(current);
    } catch { console.error("No data available"); process.exit(1); }
  }

  const latest = snapshots[0]!;

  // 本周值得关注的项目：Top 3 星标最高的
  const topProjects = [...latest.projects]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // 本周重要新闻：取信号为 监管/学术 的 Top 3
  const regulatory = latest.news.filter(n => n.signal === "监管").slice(0, 1);
  const academic = latest.news.filter(n => n.signal === "学术").slice(0, 1);
  const industry = latest.news.filter(n => n.signal === "行业").slice(0, 1);
  const keyNews = [...regulatory, ...academic, ...industry].slice(0, 3);

  const pageUrl = `${BASE}/ai-stocks/?${CAMPAIGN}`;
  const md = [
    `# AI 炒股研究周报（${latest.date}）`,
    "",
    "> 本文仅整理公开研究资料，不构成任何投资建议。",
    "> AI 模型结论可能包含过时或错误数据，请交叉验证。",
    "> 本站不预测涨跌、不荐股、不代客交易。",
    "",
    "---",
    "",
    "## 本周值得关注的研究项目",
    "",
    ...topProjects.map((p, i) => `${i + 1}. **[${p.name}](${p.url})** — ${p.kind} · ${p.category} · ★ ${compactNumber(p.stars)} · 综合分 ${p.score}\n   ${p.summary}`),
    "",
    "## 本周重要行业动态",
    "",
    ...keyNews.map((n, i) => `${i + 1}. **[${n.title}](${n.url})** — ${n.signal} · 来源 ${n.source} · 情报分 ${n.score}`),
    "",
    "---",
    "",
    "## 本周完整项目一览",
    "",
    ...latest.projects.map((p, i) => `${i + 1}. **[${p.name}](${p.url})** — ${p.kind} · ★ ${compactNumber(p.stars)} · 综合 ${p.score}`),
    "",
    "---",
    "",
    "## 风险提示（必读）",
    "",
    "- AI 结论不能直接当交易指令",
    "- 模型可能使用过时、错误或缺失数据",
    "- 回测成绩不等于实盘收益",
    "- 自动交易涉及券商权限、API Key、滑点和风控",
    "- 警惕「保证收益」和冒充 AI 的投资骗局",
    "- 请在合规券商平台交易",
    "",
    "[FINRA / SEC 投资者风险提示](https://www.finra.org/investors/insights/artificial-intelligence-and-investment-fraud)",
    "",
    `👉 [查看今日完整榜单](${pageUrl})`,
    "",
    `📡 [订阅 AI 炒股 RSS](/ai-stocks.xml)`,
    "",
  ].join("\n");

  const outDir = new URL("../marketing/", import.meta.url);
  await mkdir(outDir, { recursive: true });
  const outPath = new URL(`weekly-stocks-${latest.date}.md`, outDir);
  await writeFile(outPath, md, "utf8");
  console.log(`✅ AI 炒股周报已生成: ${outPath.pathname}`);
}

main().catch(err => { console.error(err); process.exit(1); });
