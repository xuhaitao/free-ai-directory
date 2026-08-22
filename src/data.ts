import type { ModelCategory, ModelEntry, Provider, Relay } from "./types.ts";

export const reviewedAt = "2026-08-22";

export const categoryLabels: Record<ModelCategory, string> = {
  text_generation: "文本生成", code_generation: "代码生成", multimodal: "多模态理解",
  image_generation: "图像生成", video_generation: "视频生成", embedding: "Embedding",
  rerank: "Rerank", semantic_segmentation: "语义分割", object_detection: "目标检测",
  image_classification: "图像分类", speech_to_text: "语音转文字",
  text_to_speech: "文字转语音", audio_classification: "音频分类", translation: "翻译"
};

export const providers: Provider[] = [
  { id:"cloudflare", name:"Cloudflare Workers AI", websiteUrl:"https://workers.cloudflare.com/product/workers-ai/", docsUrl:"https://developers.cloudflare.com/workers-ai/", pricingUrl:"https://developers.cloudflare.com/workers-ai/platform/pricing/", freeSummary:"每天包含 10,000 Neurons 免费额度", registration:"account" },
  { id:"huggingface", name:"Hugging Face Inference Providers", websiteUrl:"https://huggingface.co/", docsUrl:"https://huggingface.co/docs/inference-providers", pricingUrl:"https://huggingface.co/docs/inference-providers/pricing", freeSummary:"免费账户每月含少量推理额度（当前文档为 0.10 美元，可能调整）", registration:"account" },
  { id:"google", name:"Google AI Studio", websiteUrl:"https://aistudio.google.com/", docsUrl:"https://ai.google.dev/gemini-api/docs", pricingUrl:"https://ai.google.dev/gemini-api/docs/pricing", freeSummary:"部分 Gemini/Gemma 模型提供免费层，限额与地区以控制台为准", registration:"account", notes:"免费层提交内容可能用于改进产品。" },
  { id:"openrouter", name:"OpenRouter", websiteUrl:"https://openrouter.ai/", docsUrl:"https://openrouter.ai/docs/guides/routing/model-variants/free", pricingUrl:"https://openrouter.ai/pricing", freeSummary:"25+ 免费模型；未充值账户通常合计 50 次请求/日", registration:"account" },
  { id:"github-models", name:"GitHub Models", websiteUrl:"https://github.com/marketplace/models", docsUrl:"https://docs.github.com/en/github-models/use-github-models/prototyping-with-ai-models", pricingUrl:"https://docs.github.com/en/billing/concepts/product-billing/github-models", freeSummary:"GitHub 账户包含按模型等级限流的免费 Playground 与 API 用量", registration:"account", notes:"免费 API 和部分模型仍处于公开预览，具体 RPD/RPM 因模型等级和 Copilot 方案而异。" },
  { id:"cerebras", name:"Cerebras Inference", websiteUrl:"https://cloud.cerebras.ai/", docsUrl:"https://inference-docs.cerebras.ai/", pricingUrl:"https://inference-docs.cerebras.ai/support/rate-limits", freeSummary:"Free Trial 为部分模型提供每日 1M tokens 等限额，RPM/TPM 因模型而异", registration:"account", notes:"官方要求以账户 Limits 页面显示的实时额度为准。" },
  { id:"sambanova", name:"SambaNova Cloud", websiteUrl:"https://cloud.sambanova.ai/", docsUrl:"https://docs.sambanova.ai/", pricingUrl:"https://cloud.sambanova.ai/plans", freeSummary:"注册赠送 5 美元 API 额度，无需信用卡，初始额度 30 天后过期", registration:"account" },
  { id:"siliconflow", name:"SiliconFlow", websiteUrl:"https://cloud.siliconflow.com/", docsUrl:"https://docs.siliconflow.com/", pricingUrl:"https://www.siliconflow.com/pricing", freeSummary:"注册可获得 1 美元免费额度；模型价格与免费条目以控制台为准", registration:"account" },
  { id:"mistral", name:"Mistral AI Studio", websiteUrl:"https://console.mistral.ai/", docsUrl:"https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key", pricingUrl:"https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key", freeSummary:"Free mode 默认开放 API，无需信用卡，采用受限用量和速率限制", registration:"account", notes:"免费模式可用模型和实时限额以账户控制台为准。" },
  { id:"cohere", name:"Cohere", websiteUrl:"https://dashboard.cohere.com/", docsUrl:"https://docs.cohere.com/", pricingUrl:"https://docs.cohere.com/v2/docs/rate-limits", freeSummary:"注册可获得免费 Evaluation key，试用 Key 通常限制为每月 1,000 次调用", registration:"account", notes:"免费 Key 用于评估和原型，不适合生产服务。" },
  { id:"jina", name:"Jina AI Search Foundation", websiteUrl:"https://jina.ai/api-dashboard/", docsUrl:"https://api.jina.ai/docs", pricingUrl:"https://api.jina.ai/docs", freeSummary:"新用户当前获得 10M 免费 tokens，Embedding 与 Rerank 共享免费额度", registration:"account", notes:"免费 Key 的 RPM、TPM 与并发限制以 API 文档为准。" },
  { id:"groq", name:"GroqCloud", websiteUrl:"https://console.groq.com/", docsUrl:"https://console.groq.com/docs/models", pricingUrl:"https://console.groq.com/docs/rate-limits", freeSummary:"开发者免费计划按模型限制 RPM/RPD/TPM", registration:"account" }
];

const m = (id:string, name:string, modelId:string, providerId:string, category:ModelCategory, freeType:ModelEntry["freeType"], freeSummary:string, modelUrl:string, sourceUrl:string, tags:string[], notes?:string, lastReviewedAt=reviewedAt):ModelEntry => ({ id,name,modelId,providerId,category,freeType,freeSummary,modelUrl,sourceUrl,tryUrl:modelUrl,tags,lastReviewedAt,notes });

export const models: ModelEntry[] = [
  m("gemini-36-flash","Gemini 3.6 Flash","gemini-3.6-flash","google","text_generation","recurring","官方定价页列有免费输入与输出额度","https://aistudio.google.com/","https://ai.google.dev/gemini-api/docs/pricing",["API","中文","长文本"]),
  m("gemma-4","Gemma 4","gemma-4","google","text_generation","recurring","官方定价页列为免费层可用","https://aistudio.google.com/","https://ai.google.dev/gemini-api/docs/pricing",["API","开放权重"]),
  m("openrouter-free","Free Models Router","openrouter/free","openrouter","text_generation","permanent","免费路由；模型随机、容量和可用性会变化","https://openrouter.ai/openrouter/free","https://openrouter.ai/docs/cookbook/get-started/free-models-router-playground",["OpenAI 兼容","免模型选择"]),
  m("github-gpt41","GPT-4.1","openai/gpt-4.1","github-models","text_generation","recurring","GitHub Models 提供限流的免费 Playground 与 API 用量，RPD/RPM 按模型等级和账户方案计算","https://github.com/marketplace/models","https://docs.github.com/en/github-models/use-github-models/prototyping-with-ai-models",["Playground","API","公开预览"],"不同账户方案和模型等级限额不同。","2026-07-26"),
  m("cerebras-glm47","GLM 4.7","zai-glm-4.7","cerebras","text_generation","recurring","Cerebras Free Trial 官方表列 1M TPD，并按 RPM/TPM 限流","https://cloud.cerebras.ai/","https://inference-docs.cerebras.ai/support/rate-limits",["OpenAI 兼容","推理","高速"],"以账户 Limits 页面实时额度为准。","2026-07-26"),
  m("sambanova-gpt-oss","GPT-OSS 120B","gpt-oss-120b","sambanova","text_generation","signup_credit","可使用注册赠送的 5 美元 API 额度，初始额度 30 天后过期","https://cloud.sambanova.ai/","https://cloud.sambanova.ai/plans",["OpenAI 兼容","API","试用额度"],undefined,"2026-07-26"),
  m("siliconflow-qwen35","Qwen3.5 9B","Qwen/Qwen3.5-9B","siliconflow","text_generation","signup_credit","可使用平台注册的 1 美元免费额度，实际扣费按价格页","https://cloud.siliconflow.com/models","https://www.siliconflow.com/pricing",["OpenAI 兼容","中文","试用额度"],undefined,"2026-07-26"),
  m("groq-compound","Groq Compound","groq/compound","groq","text_generation","recurring","Groq 免费计划有明确速率限制","https://console.groq.com/docs/models","https://console.groq.com/docs/rate-limits",["OpenAI 兼容","工具"]),
  m("mistral-small","Mistral Small","mistral-small-latest","mistral","text_generation","recurring","Mistral Studio Free mode 可调用，受账户用量与速率限制","https://console.mistral.ai/","https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key",["OpenAI 兼容","免信用卡","API"]),
  m("cohere-command-a","Command A","command-a-03-2025","cohere","text_generation","recurring","Cohere 免费 Evaluation key 可用于原型，试用 Key 每月最多 1,000 次 API 调用","https://dashboard.cohere.com/","https://docs.cohere.com/v2/docs/rate-limits",["API","工具调用","试用 Key"]),
  m("llama-cf","Llama 3.1 8B Instruct","@cf/meta/llama-3.1-8b-instruct","cloudflare","text_generation","recurring","计入 Workers AI 每日免费 Neurons","https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct/","https://developers.cloudflare.com/workers-ai/platform/pricing/",["API","轻量"]),

  m("qwen-coder-cf","Qwen2.5 Coder 32B","@cf/qwen/qwen2.5-coder-32b-instruct","cloudflare","code_generation","recurring","计入 Workers AI 每日免费 Neurons","https://developers.cloudflare.com/workers-ai/models/qwen2.5-coder-32b-instruct/","https://developers.cloudflare.com/workers-ai/platform/pricing/",["代码","API"]),
  m("gpt-oss-groq","GPT-OSS 120B","openai/gpt-oss-120b","groq","code_generation","recurring","Groq 免费计划按模型限流","https://console.groq.com/docs/models","https://console.groq.com/docs/rate-limits",["代码","推理","OpenAI 兼容"]),
  m("gpt-oss-cerebras","GPT-OSS 120B","gpt-oss-120b","cerebras","code_generation","recurring","Cerebras Free Trial 官方表列 1M TPD，并按 RPM/TPM 限流","https://cloud.cerebras.ai/","https://inference-docs.cerebras.ai/support/rate-limits",["代码","推理","OpenAI 兼容"],"以账户 Limits 页面实时额度为准。","2026-07-26"),
  m("qwen-coder-hf","Qwen2.5 Coder 32B","Qwen/Qwen2.5-Coder-32B-Instruct","huggingface","code_generation","signup_credit","可使用 Hugging Face 每月小额免费推理额度，需确认当前路由 Provider","https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct","https://huggingface.co/docs/inference-providers/pricing",["代码","开放权重"]),

  m("moondream-cf","Moondream 3.1","@cf/moondream/moondream3.1-9b-a2b","cloudflare","multimodal","recurring","计入 Workers AI 每日免费 Neurons","https://developers.cloudflare.com/workers-ai/models/","https://developers.cloudflare.com/workers-ai/platform/pricing/",["图片理解","OCR","目标定位"]),
  m("gemini-vision","Gemini 3.6 Flash Vision","gemini-3.6-flash","google","multimodal","recurring","免费层支持文本与多模态输入，具体限制以控制台为准","https://aistudio.google.com/","https://ai.google.dev/gemini-api/docs/pricing",["图片","文档","视频理解"]),

  m("flux-schnell","FLUX.1 Schnell","@cf/black-forest-labs/flux-1-schnell","cloudflare","image_generation","recurring","生成消耗每日免费 Neurons","https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/","https://developers.cloudflare.com/workers-ai/platform/pricing/",["文生图","API"]),
  m("flux-klein","FLUX.2 Klein 4B","@cf/black-forest-labs/flux-2-klein-4b","cloudflare","image_generation","recurring","生成消耗每日免费 Neurons","https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/","https://developers.cloudflare.com/workers-ai/platform/pricing/",["文生图","图像编辑"]),
  m("qwen-image","Qwen Image","Qwen/Qwen-Image","huggingface","image_generation","signup_credit","符合条件的路由可使用每月免费额度","https://huggingface.co/Qwen/Qwen-Image","https://huggingface.co/docs/inference-providers/tasks/text-to-image",["文生图","中文文字"]),

  m("wan22-video","Wan 2.2 TI2V 5B","Wan-AI/Wan2.2-TI2V-5B","huggingface","video_generation","signup_credit","符合条件的路由可使用每月免费额度；视频通常很快耗尽小额额度","https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B","https://huggingface.co/docs/inference-providers/tasks/text-to-video",["文生视频","图生视频"]),
  m("hunyuan-video","HunyuanVideo","tencent/HunyuanVideo","huggingface","video_generation","signup_credit","符合条件的路由可使用每月免费额度","https://huggingface.co/tencent/HunyuanVideo","https://huggingface.co/docs/inference-providers/tasks/text-to-video",["文生视频"]),
  m("ltx-video","LTX-Video","Lightricks/LTX-Video","huggingface","video_generation","open_source","模型权重可下载；在线推理是否覆盖免费额度取决于当前 Provider","https://huggingface.co/Lightricks/LTX-Video","https://huggingface.co/docs/inference-providers/tasks/text-to-video",["视频","开放权重"]),

  m("bge-m3","BGE-M3","@cf/baai/bge-m3","cloudflare","embedding","recurring","计入 Workers AI 每日免费 Neurons","https://developers.cloudflare.com/workers-ai/models/bge-m3/","https://developers.cloudflare.com/workers-ai/platform/pricing/",["多语言","稠密向量"]),
  m("qwen3-embed","Qwen3 Embedding 0.6B","@cf/qwen/qwen3-embedding-0.6b","cloudflare","embedding","recurring","计入 Workers AI 每日免费 Neurons","https://developers.cloudflare.com/workers-ai/models/","https://developers.cloudflare.com/workers-ai/platform/pricing/",["多语言","轻量"]),
  m("gemini-embedding","Gemini Embedding 2","gemini-embedding-2","google","embedding","recurring","官方定价页列有免费层，限额以控制台为准","https://ai.google.dev/gemini-api/docs/embeddings","https://ai.google.dev/gemini-api/docs/pricing",["多模态向量","API"]),
  m("cohere-embed-v4","Cohere Embed 4","embed-v4.0","cohere","embedding","recurring","免费 Evaluation key 可用；Embed 试用限额按输入数和月度调用量计算","https://dashboard.cohere.com/","https://docs.cohere.com/v2/docs/rate-limits",["多语言","多模态向量","API"]),
  m("jina-embeddings-v4","Jina Embeddings v4","jina-embeddings-v4","jina","embedding","signup_credit","新用户当前获得 10M 免费 tokens；免费 Key 有 RPM、TPM 与并发限制","https://jina.ai/models/jina-embeddings-v4/","https://api.jina.ai/docs",["多语言","多模态向量","长文本"],"模型权重使用 Qwen Research License；官方 API 与本地权重的使用边界不同。"),
  m("harrier-embed","Harrier OSS 0.6B","microsoft/harrier-oss-v1-0.6b","huggingface","embedding","signup_credit","符合条件的路由可使用每月免费额度","https://huggingface.co/microsoft/harrier-oss-v1-0.6b","https://huggingface.co/docs/inference-providers/tasks/feature-extraction",["向量","开放权重"]),

  m("bge-reranker","BGE Reranker Base","@cf/baai/bge-reranker-base","cloudflare","rerank","recurring","计入 Workers AI 每日免费 Neurons","https://developers.cloudflare.com/workers-ai/models/bge-reranker-base/","https://developers.cloudflare.com/workers-ai/platform/pricing/",["RAG","重排"]),
  m("cohere-rerank-v4","Cohere Rerank 4 Fast","rerank-v4.0-fast","cohere","rerank","recurring","免费 Evaluation key 可用；试用 Rerank 当前限制为 10 RPM，并受每月 1,000 次调用限制","https://dashboard.cohere.com/","https://docs.cohere.com/v2/docs/rate-limits",["RAG","多语言","API"]),
  m("jina-reranker-v3","Jina Reranker v3","jina-reranker-v3","jina","rerank","signup_credit","新用户当前获得 10M 免费 tokens，Embedding、Rerank 等服务共享","https://jina.ai/en-US/reranker/","https://api.jina.ai/docs",["RAG","多语言","长上下文"]),
  m("cross-encoder","MS MARCO MiniLM Reranker","cross-encoder/ms-marco-MiniLM-L-6-v2","huggingface","rerank","open_source","权重可免费下载并本地运行；HF 在线额度需看当前部署状态","https://huggingface.co/cross-encoder/ms-marco-MiniLM-L-6-v2","https://huggingface.co/docs/inference-providers/pricing",["RAG","本地运行"]),

  m("mask2former-panoptic","Mask2Former COCO Panoptic","facebook/mask2former-swin-large-coco-panoptic","huggingface","semantic_segmentation","signup_credit","Hugging Face 任务文档推荐模型；在线 Provider 与免费额度以页面实时状态为准","https://huggingface.co/facebook/mask2former-swin-large-coco-panoptic","https://huggingface.co/docs/inference-providers/tasks/image-segmentation",["全景分割","实例分割"]),
  m("mask2former-ade","Mask2Former ADE20K Semantic","facebook/mask2former-swin-base-ade-semantic","huggingface","semantic_segmentation","open_source","权重可免费下载并本地运行；当前模型页未显示托管 Provider","https://huggingface.co/facebook/mask2former-swin-base-ade-semantic","https://huggingface.co/facebook/mask2former-swin-base-ade-semantic",["语义分割","ADE20K","本地运行"]),
  m("rmbg2","RMBG 2.0","briaai/RMBG-2.0","huggingface","semantic_segmentation","signup_credit","任务文档提供 Inference Providers 调用示例，是否覆盖免费额度取决于路由","https://huggingface.co/briaai/RMBG-2.0","https://huggingface.co/docs/inference-providers/tasks/image-segmentation",["前景分割","抠图"]),

  m("detr-cf","DETR ResNet-50","@cf/facebook/detr-resnet-50","cloudflare","object_detection","recurring","计入 Workers AI 每日免费 Neurons","https://developers.cloudflare.com/workers-ai/models/","https://developers.cloudflare.com/workers-ai/platform/pricing/",["目标检测","COCO"]),
  m("resnet-cf","ResNet-50","@cf/microsoft/resnet-50","cloudflare","image_classification","recurring","计入 Workers AI 每日免费 Neurons","https://developers.cloudflare.com/workers-ai/models/","https://developers.cloudflare.com/workers-ai/platform/pricing/",["图像分类"]),
  m("whisper-cf","Whisper Large v3 Turbo","@cf/openai/whisper-large-v3-turbo","cloudflare","speech_to_text","recurring","计入 Workers AI 每日免费 Neurons","https://developers.cloudflare.com/workers-ai/models/","https://developers.cloudflare.com/workers-ai/platform/pricing/",["ASR","多语言"]),
  m("aura2-cf","Aura 2 English","@cf/deepgram/aura-2-en","cloudflare","text_to_speech","recurring","计入 Workers AI 每日免费 Neurons","https://developers.cloudflare.com/workers-ai/models/","https://developers.cloudflare.com/workers-ai/platform/pricing/",["TTS","英语"]),
  m("wav2vec-audio","Wav2Vec2 Audio Classification","superb/wav2vec2-base-superb-ks","huggingface","audio_classification","open_source","权重可下载本地运行；在线免费额度取决于部署状态","https://huggingface.co/superb/wav2vec2-base-superb-ks","https://huggingface.co/docs/inference-providers/en/tasks/index",["关键词识别","本地运行"]),
  m("m2m100-cf","M2M100 1.2B","@cf/meta/m2m100-1.2b","cloudflare","translation","recurring","计入 Workers AI 每日免费 Neurons","https://developers.cloudflare.com/workers-ai/models/","https://developers.cloudflare.com/workers-ai/platform/pricing/",["翻译","多语言"])
];

const relay = (id:string,name:string,websiteUrl:string,docsUrl:string|undefined,trialSummary:string,protocols:string[],clients:Relay["clients"],evidence:Relay["evidence"],operatorDisclosure:Relay["operatorDisclosure"],termsFound:boolean,privacyFound:boolean,sourceUrls:string[],riskNotes:string[]=[]):Relay => ({id,name,websiteUrl,docsUrl,trialSummary,protocols,clients,evidence,operatorDisclosure,termsFound,privacyFound,sourceUrls,riskNotes,lastReviewedAt:reviewedAt});

export const relays: Relay[] = [
  relay("302ai","302.AI","https://302.ai/","https://help.302.ai/docs/chang-jian-wen-ti","官网 FAQ 称手机号注册用户有试用金；金额和规则以实时页面为准",["OpenAI 兼容","多模型 API"],["通用 SDK"],"official_docs","public",true,true,["https://help.302.ai/docs/chang-jian-wen-ti","https://price.302.ai/"],[]),
  relay("aihubmix","AIHubMix","https://aihubmix.com/","https://docs.aihubmix.com/","官网文档列有补贴免费模型；具体列表会变化",["OpenAI 兼容","Anthropic 兼容"],["Codex","Claude Code","通用 SDK"],"official_docs","partial",false,true,["https://docs.aihubmix.com/en/blogs/free-ai-models"],["免费模型可能下线或限流。"]),
  relay("api2d","API2D","https://api2d.com/",undefined,"未找到长期免费额度承诺；缓存命中免费不等于所有调用免费",["OpenAI 兼容","Claude","图像","向量"],["通用 SDK"],"site_claim","partial",false,false,["https://api2d.com/"],["主要为付费服务。"]),
  relay("packyapi","PackyAPI","https://packyapi.com/","https://docs.packyapi.com/docs/","未核实免充值试用额度",["OpenAI 兼容","Anthropic Messages"],["Codex","Claude Code","通用 SDK"],"official_docs","not_found",false,false,["https://docs.packyapi.com/docs/register/"],["上游和运营主体披露不足。"]),
  relay("fastapi","FastApi","https://fastapi.saturney.cn/",undefined,"官网称注册赠送少量体验额度",["Anthropic Messages"],["Claude Code"],"site_claim","not_found",false,false,["https://fastapi.saturney.cn/"],["额度、上游和持续运营均为官网自述。"]),
  relay("ccsub","CCSub","https://www.ccsub.net/","https://www.ccsub.net/docs","文档未核实长期免费额度",["OpenAI 兼容","Anthropic Messages"],["Codex","Claude Code"],"official_docs","not_found",false,false,["https://www.ccsub.net/docs"],["低价和倍率均为站方自述。"]),
  relay("apikl","API 快连","https://apikl.ai/","https://apikl.ai/","未核实免充值试用额度",["OpenAI 兼容","Anthropic Messages","Gemini"],["Codex","Claude Code","通用 SDK"],"site_claim","not_found",false,false,["https://apikl.ai/"],["账号池、价格和模型真实性为站方自述。"]),
  relay("getcodex","GetCodex","https://home.getcodex.cc/",undefined,"未核实免费额度；官网主打按量充值",["OpenAI 兼容"],["Codex"],"site_claim","not_found",false,false,["https://home.getcodex.cc/"],["模型核验截图不能替代独立审计。"]),
  relay("suixiang","随想 AI","https://sui-xiang.com/","https://sui-xiang.com/docs/","未核实免充值试用额度",["OpenAI 兼容","Anthropic 兼容"],["Codex","Claude Code","通用 SDK"],"official_docs","not_found",false,false,["https://sui-xiang.com/docs/"],["上游与数据处理方式未独立核验。"]),
  relay("timedigital","TimeDigital","https://www.timedigital.cn/",undefined,"可免费注册；未核实赠送额度",["OpenAI 兼容","国产模型"],["通用 SDK"],"site_claim","partial",false,false,["https://www.timedigital.cn/"],[]),
  relay("quickrouter","QuickRouter","https://quickrouter.ai/",undefined,"搜索快照称注册有小额赠金，需在官网实时确认",["OpenAI 兼容","多模型"],["通用 SDK"],"third_party_listing","not_found",false,false,["https://quickrouter.ai/"],["赠金额度尚无独立或文档级证据。"]),
  relay("pateway","PatewayAI","https://pateway.ai/",undefined,"搜索快照称注册有体验额度，需在官网实时确认",["OpenAI 兼容","多模型"],["通用 SDK"],"third_party_listing","not_found",false,false,["https://pateway.ai/"],["体验额度和上游均需用户自行复核。"]),
  relay("llmapi","LLM API","https://llmapi.pro/","https://llmapi.pro/api-relay-cn","官网称可免费获取 Key，是否含可调用余额未核实",["OpenAI Responses","Anthropic Messages","Gemini"],["Codex","Claude Code","通用 SDK"],"site_claim","not_found",false,false,["https://llmapi.pro/api-relay-cn"],["“低至官方十分之一”等为站方营销自述。"])
];
