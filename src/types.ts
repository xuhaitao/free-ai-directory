export type ModelCategory =
  | "text_generation" | "code_generation" | "multimodal" | "image_generation"
  | "video_generation" | "embedding" | "rerank" | "semantic_segmentation"
  | "object_detection" | "image_classification" | "speech_to_text"
  | "text_to_speech" | "audio_classification" | "translation";

export type FreeType = "permanent" | "recurring" | "signup_credit" | "open_source";
export type EvidenceLevel = "official_pricing" | "official_docs" | "official_catalog" | "site_claim" | "third_party";

export type Provider = {
  id: string;
  name: string;
  websiteUrl: string;
  docsUrl: string;
  pricingUrl: string;
  freeSummary: string;
  registration: "none" | "email" | "account";
  notes?: string;
};

export type ModelEntry = {
  id: string;
  name: string;
  modelId: string;
  providerId: string;
  category: ModelCategory;
  freeType: FreeType;
  freeSummary: string;
  modelUrl: string;
  sourceUrl: string;
  tryUrl?: string;
  tags: string[];
  lastReviewedAt: string;
  notes?: string;
};

export type Relay = {
  id: string;
  name: string;
  websiteUrl: string;
  docsUrl?: string;
  pricingUrl?: string;
  evidence: "official_docs" | "site_claim" | "third_party_listing";
  trialSummary: string;
  protocols: string[];
  clients: ("Codex" | "Claude Code" | "通用 SDK")[];
  operatorDisclosure: "public" | "partial" | "not_found";
  termsFound: boolean;
  privacyFound: boolean;
  sourceUrls: string[];
  riskNotes: string[];
  lastReviewedAt: string;
};

export type DailyNews = {
  id: string;
  title: string;
  url: string;
  discussionUrl: string;
  source: string;
  points: number;
  comments: number;
  publishedAt: string;
  hotScore: number;
};

export type DailyProject = {
  id: string;
  name: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  starsToday?: number;
  topics: string[];
  hotScore: number;
  basis: "github_trending" | "recent_star_velocity";
};

export type DailyModel = {
  id: string;
  name: string;
  url: string;
  pipelineTag: string;
  downloads: number;
  likes: number;
  trendingScore: number;
  lastModified: string;
  tags: string[];
};

export type DailySnapshot = {
  schemaVersion: 1;
  date: string;
  generatedAt: string;
  timezone: "Asia/Shanghai";
  freshness: { news: string; projects: string; models: string };
  news: DailyNews[];
  projects: DailyProject[];
  trendingModels: DailyModel[];
  sourceStatus: { name: string; url: string; ok: boolean; note: string }[];
};

export type DirectoryLinkCheck = {
  kind: "model" | "relay";
  id: string;
  url: string;
  ok: boolean;
  status: number;
  checkedAt: string;
  note: string;
};

export type DirectorySnapshot = {
  schemaVersion: 1;
  date: string;
  generatedAt: string;
  timezone: "Asia/Shanghai";
  models: ModelEntry[];
  relays: Relay[];
  checks: DirectoryLinkCheck[];
  sourceStatus: { name: string; url: string; ok: boolean; note: string }[];
};
