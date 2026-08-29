目前能免费调用的文字转语音 API，按"免费方式"可以分成三类：

1. **周期性免费额度**：平台每天或每月重置一定用量，适合持续低流量调用。
2. **注册赠金**：一次性的体验额度，用完即止，适合验证和原型。
3. **开放权重 / 本地部署**：模型本身免费，但 GPU、运维和部署成本不是 0。

下面按第一类和第二类，列出 4 个目前可以正规 API 调用的免费 TTS 入口。

---

### Fish Audio S2.1 Pro Free

- **免费方式**：周期性免费（Fair Use 无硬性用量上限）
- **语言支持**：83 种语言，含中文
- **注册要求**：注册账号即可，无需绑卡
- **特点**：支持声线克隆；中文 TTS 在免费 API 中属于少见的正规入口
- **限制**：Fair Use 政策下平台保留调整权利，不适合大批量商业用途
- **官方定价页**：https://docs.fish.audio/developer-guide/models-pricing/pricing-and-rate-limits

### Gemini 2.5 Flash TTS

- **免费方式**：周期性免费，与 Gemini 免费层共享额度（15 RPM / 1,500 RPD）
- **语言支持**：多语言
- **注册要求**：Google 账号
- **特点**：和 Gemini 文本模型共用免费额度，适合已有 Gemini 项目的开发者直接接入
- **限制**：当前为 preview 阶段，RPM/RPD 可能调整；免费层提交内容可能用于改进产品
- **官方文档**：https://ai.google.dev/gemini-api/docs/text-generation

### Deepgram Aura-2

- **免费方式**：注册赠金 $200（一年有效），与 STT 共享
- **语言支持**：英语
- **注册要求**：注册即可，无需绑卡
- **特点**：低延迟英文 TTS，适合对响应速度有要求的场景
- **限制**：赠金用完即止；仅支持英语
- **官方文档**：https://developers.deepgram.com/docs/text-to-speech

### Cloudflare Aura 2 English

- **免费方式**：周期性免费，计入 Workers AI 每日免费 Neurons 额度
- **语言支持**：英语
- **注册要求**：Cloudflare 账号
- **特点**：与文本生成、Embedding、图片生成等共享每日免费 Neurons，适合轻量多模态项目统一调用
- **限制**：仅英语；Neurons 按计算单元计费，复杂请求消耗更多
- **官方定价页**：https://developers.cloudflare.com/workers-ai/platform/pricing/

---

### 选型建议

- **中文 TTS**：目前免费 API 选项中只有 Fish Audio S2.1 Pro Free 正式支持中文，且支持声线克隆。
- **英文 TTS 追求品质**：Deepgram Aura-2 注册赠 $200，够做较长时间的验证和原型。
- **轻量英文 + 多模态统一**：Cloudflare Aura 2 适合已经在用 Workers AI 做文本或图片的项目，共用一套免费额度。
- **多语言 + 已有 Gemini 项目**：Gemini 2.5 Flash TTS 和文本模型共用免费层，接入成本最低。

以上数据基于 2026-08-27 的公开资料整理。免费政策和额度变化较快，实际调用前请以平台控制台和官方文档为准。

完整清单（含语音识别、文本生成等其他免费 API 入口）：https://www.qaz5678.xyz/categories/text-to-speech/?utm_source=zhihu&utm_medium=answer&utm_campaign=free_tts
