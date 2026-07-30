# 免费 AI 目录

面向中文用户的每日 AI 情报与免费资源目录。每天更新 10 条 AI 热门新闻、10 个热门 AI 项目和 10 个趋势模型，并收录文本、代码、多模态、图像、视频、Embedding、Rerank、语义分割、目标检测、图像分类、语音和翻译等免费入口。

另提供每日约 50 条 AI 工具商业化与创收线索、50 个 Agent Skill 融合榜、12 个 AI 股票研究工具/项目和 12 条相关新闻，并用 AI 情报周报与跨榜主题追踪聚合一周内反复上榜的公开信号；这些榜单不构成收入承诺、投资建议或安全背书。

在线站点：[www.qaz5678.xyz](https://www.qaz5678.xyz/?utm_source=github&utm_medium=readme&utm_campaign=repository)

常用入口：

- [回答 5 个问题，筛选免费 AI 模型](https://www.qaz5678.xyz/find-model/?utm_source=github&utm_medium=readme&utm_campaign=model_finder)
- [浏览 57 个免费模型与 14 种能力](https://www.qaz5678.xyz/models/?utm_source=github&utm_medium=readme&utm_campaign=free_models)
- [查看每日 AI 新闻、项目和趋势模型 Top 10](https://www.qaz5678.xyz/daily/?utm_source=github&utm_medium=readme&utm_campaign=daily_ai)
- [查看一周 AI 情报汇总](https://www.qaz5678.xyz/weekly/?utm_source=github&utm_medium=readme&utm_campaign=weekly_ai)
- [查看跨榜 AI 主题追踪](https://www.qaz5678.xyz/topics/?utm_source=github&utm_medium=readme&utm_campaign=ai_topics)
- [查看当前浏览器关注的主题](https://www.qaz5678.xyz/following/?utm_source=github&utm_medium=readme&utm_campaign=topic_following)
- [查看 AI 炒股工具、项目与每日新闻](https://www.qaz5678.xyz/ai-stocks/?utm_source=github&utm_medium=readme&utm_campaign=ai_stocks)
- [核对 Codex / Claude Code 中转站协议与风险](https://www.qaz5678.xyz/guides/codex-claude-code-relay/?utm_source=github&utm_medium=readme&utm_campaign=relay_guide)
- [查看免费图像分割 API 与模型](https://www.qaz5678.xyz/guides/free-image-segmentation-api/?utm_source=github&utm_medium=readme&utm_campaign=segmentation_api)

产品边界很明确：不代测模型、不接收或托管用户 Key、不代理请求、不做伪精确的稳定性排名。模型卡只提供免费规则摘要、来源和可跳转地址；中转站卡显示证据等级和风险。

站内提供模型、中转站、新闻、项目、趋势模型和教程的统一搜索；每日目录页记录真实的新增、移除与规则变化。链接状态会区分正常响应、目标站限制自动检查、确认失效、更新服务器网络受限与临时错误，避免把国内服务器不可达误写成条目失效。

“帮我选免费模型”按用途、在线 API / 本地运行、充值、账户和中文需求缩小候选范围，结果可通过 URL 分享。免费模型变化和中转站变化分别提供独立 RSS。互动统计只记录搜索、筛选、引导器、详情跳转、外链、分享和订阅等事件类型，不发送搜索词或具体筛选答案。

## 本地开发

需要 Node.js 22.18 或更高版本。

```bash
npm install
npm run release:verify
npm run preview
```

普通预览地址为 `http://localhost:4173`。Worker 预览：

```bash
npm run dev:worker
curl http://localhost:8787/api/health
```

## 数据维护

- `npm run daily:update`：从 Hacker News、GitHub 与 Hugging Face 生成每日榜单和归档。
- `npm run opportunities:update`：融合 Hacker News、DEV Community、Bing News、TechCrunch、VentureBeat 的 AI 创收资讯，并融合 skills.sh 安装趋势与 GitHub 仓库信号生成 Agent Skill Top 50。
- `npm run stocks:update`：更新 12 个公开 AI 股票工具/项目的 GitHub 信号，并融合多个公开来源生成 12 条相关新闻。
- `npm run weekly:update`：按当前自然周聚合已保存的日榜、机会榜和 AI 炒股快照，计算连续上榜、最新快照首次出现、排名升温和跨榜主题；变化少于 2 天不判断，主题少于 3 条或不足 2 个栏目不发布。
- `npm run directory:update`：同步 OpenRouter 官方免费模型、发现高相关中转候选，并检查全部目录外链；不调用模型。
- `content/daily.json`：当前 3 个 Top 10 榜单；`content/history/` 保留每日快照。
- `content/opportunities.json`：当前 AI 创收资讯与 Skill Top 50；`content/opportunities-history/` 保留每日快照。
- `content/stocks.json`：当前 AI 炒股工具、项目与新闻；`content/stocks-history/` 保留最近 90 天可发布快照。
- `content/weekly.json`：当前 AI 情报周报；`content/weekly-history/` 按 ISO 周编号保留归档。
- `content/directory.json`：免费模型与中转站的每日有效快照；来源暂时失败时保留上一版有效数据。
- `content/directory-history/`：按日期保留目录快照与真实字段变化。
- `src/data.ts`：模型、平台、中转站和来源链接。
- `src/types.ts`：数据结构。
- `src/validate.ts`：数量、分类、HTTPS 来源和风险字段校验。
- `src/build.ts`：首页、列表、14 个分类页、SEO 文件。
- `src/static-worker.ts`：静态资源、安全响应头和健康检查。

新增模型时必须提供模型页和免费规则来源。开放权重模型应明确写“本地免费”，不能暗示托管 API 免费。新增中转站必须保留来源链接；无法找到主体、条款或隐私页时如实标注，不得写“稳定”“靠谱”或“官方上游”。

## 发布

```bash
PUBLIC_SITE_URL=https://你的域名 npm run release:verify
npm exec wrangler -- deploy
```

每日榜单和目录更新都不需要 API Key；服务器使用 systemd timer 每天北京时间 06:15 自动抓取榜单、同步目录、检查外链、校验、构建、发布并提交 IndexNow。更新日志使用 `journalctl -u free-ai-directory-daily.service` 查看。发布后检查：

```bash
curl -i https://你的域名/api/health
curl -I https://你的域名/models/
curl -I https://你的域名/relays/
curl -I https://你的域名/daily/
curl https://你的域名/data/daily.json
curl https://你的域名/data/directory.json
curl https://你的域名/data/model-finder.json
curl https://你的域名/models-changes.xml
curl https://你的域名/relays-changes.xml
```

## 安全与商业边界

- 不收集 API Key、提示词、代码或充值信息。
- 中转站收录不构成推荐或安全担保。
- 默认按资料规则排序，不按返佣排序。
- 外链使用 `noopener noreferrer nofollow`。
- 免费政策随时可能变化，用户应在来源页复核。

## 仓库边界

本仓库公开网站源码、测试、数据结构、构建脚本和通用部署配置，不包含生产环境凭据、服务器访问密钥、第三方 API Key、访问日志及运营素材。请通过 `.env.example` 创建本地环境变量文件，不要提交真实密钥。

## License

[MIT](LICENSE)
