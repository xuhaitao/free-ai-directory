import type { ModelCategory, ModelEntry, Relay } from "./types.ts";

type OpenRouterModel = {
  id?: string;
  name?: string;
  pricing?: { prompt?: string; completion?: string };
  architecture?: { input_modalities?: string[]; output_modalities?: string[] };
};

type GitHubRepository = {
  full_name?: string;
  html_url?: string;
  homepage?: string | null;
  description?: string | null;
  archived?: boolean;
  disabled?: boolean;
  fork?: boolean;
  stargazers_count?: number;
  page_evidence?: string;
};

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function categoryFor(model: OpenRouterModel): ModelCategory {
  const id = `${model.id || ""} ${model.name || ""}`.toLowerCase();
  const input = model.architecture?.input_modalities || [];
  const output = model.architecture?.output_modalities || [];
  if (output.includes("video")) return "video_generation";
  if (output.includes("image") && !output.includes("text")) return "image_generation";
  if (/code|coder|codestral|devstral/.test(id)) return "code_generation";
  if (input.some(value => value !== "text")) return "multimodal";
  return "text_generation";
}

export function openRouterFreeModels(data: unknown, date: string, existing: ModelEntry[] = []) {
  const rows = Array.isArray((data as any)?.data) ? (data as any).data as OpenRouterModel[] : [];
  const existingModelIds = new Set(existing.map(item => `${item.providerId}:${item.modelId}`.toLowerCase()));
  const seen = new Set<string>();
  const result: ModelEntry[] = [];
  for (const row of rows) {
    const modelId = String(row.id || "").trim();
    if (!modelId.endsWith(":free") || row.pricing?.prompt !== "0" || row.pricing?.completion !== "0") continue;
    const output = row.architecture?.output_modalities || ["text"];
    if (!output.some(value => value === "text" || value === "image" || value === "video")) continue;
    const key = `openrouter:${modelId}`.toLowerCase();
    if (seen.has(key) || existingModelIds.has(key)) continue;
    seen.add(key);
    const input = row.architecture?.input_modalities || ["text"];
    result.push({
      id: `openrouter-${slug(modelId)}`,
      name: String(row.name || modelId).replace(/\s*\(free\)\s*$/i, ""),
      modelId,
      providerId: "openrouter",
      category: categoryFor(row),
      freeType: "recurring",
      freeSummary: "OpenRouter 官方模型目录当前将输入与输出价格标为 0；仍受共享免费额度和速率限制",
      modelUrl: `https://openrouter.ai/${modelId}`,
      sourceUrl: "https://openrouter.ai/api/v1/models",
      tryUrl: `https://openrouter.ai/${modelId}`,
      tags: ["OpenAI 兼容", "每日同步", ...input.filter(value => value !== "text").map(value => ({ image: "图片输入", video: "视频输入", audio: "音频输入", file: "文件输入" }[value] || value))].slice(0, 5),
      lastReviewedAt: date,
      notes: "由 OpenRouter 公开模型目录每日自动同步；免费路由可能增删或限流。"
    });
  }
  return result.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

const relayIntent = /(中转|转发|网关|gateway|relay|proxy|api)/i;
const clientIntent = /(claude\s*code|codex|anthropic|openai[ -]?responses)/i;
const serviceIntent = /(充值|价格|计费|额度|注册|购买|套餐|余额|令牌|控制台|api\s*key|billing|pricing|credits?|sign\s*up|dashboard)/i;
const toolIntent = /(awesome|导航|nav|dashboard|switch|mcp|self[ -]?host|自托管|extension|vscode|marketplace)/i;
const staticHosts = /(^|\.)(github\.io|netlify\.app|vercel\.app|marketplace\.visualstudio\.com)$/i;

export function hasRelayServiceEvidence(value: string) {
  return relayIntent.test(value) && clientIntent.test(value) && serviceIntent.test(value);
}

export function hasHostedRelayPageEvidence(value: string, homepage: string) {
  try {
    const url = new URL(homepage);
    if (staticHosts.test(url.hostname) || /\/(switch|dashboard)(\/|$)/i.test(url.pathname)) return false;
  } catch { return false; }
  return hasRelayServiceEvidence(value) && /(base\s*url|api\s*key|令牌|密钥|openai|anthropic|claude\s*code|codex)/i.test(value);
}

export function githubRelayCandidates(items: unknown, date: string, existing: Relay[] = []) {
  const rows = Array.isArray(items) ? items as GitHubRepository[] : [];
  const existingHosts = new Set(existing.map(item => new URL(item.websiteUrl).hostname.replace(/^www\./, "")));
  const seen = new Set<string>();
  const candidates: Relay[] = [];
  for (const repo of rows) {
    const description = String(repo.description || "");
    const homepage = String(repo.homepage || "").trim();
    if (repo.archived || repo.disabled || repo.fork || (repo.stargazers_count || 0) < 2) continue;
    if (!relayIntent.test(description) || !clientIntent.test(description)) continue;
    if (toolIntent.test(`${repo.full_name || ""} ${description} ${homepage}`) || !hasHostedRelayPageEvidence(String(repo.page_evidence || ""), homepage)) continue;
    let url: URL;
    try { url = new URL(homepage); } catch { continue; }
    if (url.protocol !== "https:" || /(^|\.)github\.com$/.test(url.hostname)) continue;
    const host = url.hostname.replace(/^www\./, "");
    if (existingHosts.has(host) || seen.has(host)) continue;
    seen.add(host);
    const supportsClaude = /claude\s*code|anthropic/i.test(description);
    const supportsCodex = /codex|openai[ -]?responses/i.test(description);
    const clients: Relay["clients"] = [...(supportsCodex ? ["Codex" as const] : []), ...(supportsClaude ? ["Claude Code" as const] : []), "通用 SDK"];
    const protocols = [...(supportsCodex ? ["OpenAI 兼容"] : []), ...(supportsClaude ? ["Anthropic 兼容"] : [])];
    candidates.push({
      id: `github-${slug(repo.full_name || host)}`,
      name: repo.full_name || host,
      websiteUrl: url.toString(),
      evidence: "third_party_listing",
      trialSummary: "由公开 GitHub 仓库每日发现；尚未核实免费额度、模型上游或运营主体",
      protocols: protocols.length ? protocols : ["多模型 API"],
      clients,
      operatorDisclosure: "not_found",
      termsFound: false,
      privacyFound: false,
      sourceUrls: [String(repo.html_url || `https://github.com/${repo.full_name}`), url.toString()],
      riskNotes: ["每日自动发现候选，不构成推荐；充值或发送代码前需人工核对主体、条款、隐私和退款规则。"],
      lastReviewedAt: date
    });
  }
  return candidates.slice(0, 10);
}
