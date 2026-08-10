/**
 * 生成 Skill 热榜周报 Markdown
 * 用法: npx tsx scripts/weekly-skill-report.ts
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import type { OpportunitySnapshot } from "../src/types.ts";

const BASE = process.env.PUBLIC_SITE_URL || "https://www.qaz5678.xyz";
const CAMPAIGN = "utm_source=github&utm_medium=referral&utm_campaign=topic_test_2026q3&utm_content=skills";

function compactNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

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
      if (data.schemaVersion === 1 && Array.isArray(data.skills)) snapshots.push(data);
    } catch { /* skip */ }
  }

  if (snapshots.length === 0) {
    try {
      const current = JSON.parse(await readFile(new URL("../content/opportunities.json", import.meta.url), "utf8"));
      snapshots.push(current);
    } catch { console.error("No data available"); process.exit(1); }
  }

  const latest = snapshots[0]!;

  // 涨幅 Top 5: 比较最早和最新榜单
  const previous = snapshots[snapshots.length - 1]!;
  const prevRank = new Map(previous.skills.map((s, i) => [s.id, i]));
  const movements = latest.skills
    .map((s, i) => ({ skill: s, currentRank: i, prevRank: prevRank.get(s.id), delta: prevRank.has(s.id) ? prevRank.get(s.id)! - i : -999 }))
    .filter(m => m.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);

  // 新上榜
  const newcomers = latest.skills.filter(s => !prevRank.has(s.id)).slice(0, 5);

  const pageUrl = `${BASE}/skills/?${CAMPAIGN}`;
  const md = [
    `# Skill 热榜周报（${latest.date}）`,
    "",
    `> 覆盖 skills.sh 安装趋势 + GitHub 仓库关注 + 最近提交活跃信号。Top 50 完整榜单。`,
    `> 热度不代表质量、安全或官方认可，安装前请审查 SKILL.md 与来源仓库。`,
    "",
    "---",
    "",
    "## 本周涨幅 Top 5",
    "",
    ...(movements.length > 0
      ? movements.map((m, i) => {
          const s = m.skill;
          const up = m.prevRank !== undefined ? `第 ${m.prevRank + 1} → 第 ${m.currentRank + 1}（↑${m.delta}）` : "新上榜";
          return `${i + 1}. **[${s.name}](${s.url})** — 安装 ${compactNumber(s.installs)} · Star ${compactNumber(s.githubStars)} · ${up}`;
        })
      : ["本周无明显涨幅变化"]),
    "",
    "## 本周新上榜 Top 5",
    "",
    ...(newcomers.length > 0
      ? newcomers.map((s, i) => `${i + 1}. **[${s.name}](${s.url})** — 安装 ${compactNumber(s.installs)} · Star ${compactNumber(s.githubStars)} · 融合分 ${s.fusionScore}`)
      : ["本周无新上榜 Skill"]),
    "",
    "---",
    "",
    "## 今日 Top 10",
    "",
    ...latest.skills.slice(0, 10).map((s, i) => `${i + 1}. **[${s.name}](${s.url})** — 安装 ${compactNumber(s.installs)} · Star ${compactNumber(s.githubStars)} · 融合分 ${s.fusionScore}`),
    "",
    "---",
    "",
    "## 安全提醒",
    "",
    "- Skill 会向 Agent 注入指令，部分还会调用脚本或外部服务",
    "- 安装前先阅读 SKILL.md、检查来源仓库和权限",
    "- 榜单不构成安全背书",
    "",
    `👉 [查看今日完整 Top 50](${pageUrl})`,
    "",
    `📡 [订阅 Skill 热榜 RSS](/skills.xml)`,
    "",
  ].join("\n");

  const outDir = new URL("../marketing/", import.meta.url);
  await mkdir(outDir, { recursive: true });
  const outPath = new URL(`weekly-skills-${latest.date}.md`, outDir);
  await writeFile(outPath, md, "utf8");
  console.log(`✅ Skill 周报已生成: ${outPath.pathname}`);
}

main().catch(err => { console.error(err); process.exit(1); });
