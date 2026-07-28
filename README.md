# 免费 AI 目录

面向中文用户的每日 AI 情报与免费资源目录。每天更新 10 条 AI 热门新闻、10 个热门 AI 项目和 10 个趋势模型，并收录文本、代码、多模态、图像、视频、Embedding、Rerank、语义分割、目标检测、图像分类、语音和翻译等免费入口。

在线站点：[www.qaz5678.xyz](https://www.qaz5678.xyz/)

产品边界很明确：不代测模型、不接收或托管用户 Key、不代理请求、不做伪精确的稳定性排名。模型卡只提供免费规则摘要、来源和可跳转地址；中转站卡显示证据等级和风险。

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
- `npm run directory:update`：同步 OpenRouter 官方免费模型、发现高相关中转候选，并检查全部目录外链；不调用模型。
- `content/daily.json`：当前 3 个 Top 10 榜单；`content/history/` 保留每日快照。
- `content/directory.json`：免费模型与中转站的每日有效快照；来源暂时失败时保留上一版有效数据。
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
