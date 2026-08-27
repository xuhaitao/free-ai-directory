# Codex 连环图｜小红书发布包

## 文件

- `output/01-01-cover.jpg` 到 `output/08-08-summary.jpg`：8 张 1242×1660、3:4 连环图。
- `output/qa-contact-sheet.jpg`：内部视觉抽检拼图。
- `publish-copy.md`：标题、正文、话题和置顶评论。
- `content.json`：图文内容源数据。
- `render_carousel.py`：可重复生成脚本。

## 选题策略

这组图文以“开更多代理反而返工”的反常识切入，依次给出失败画面、正确规则、三个角色、可复制提示词和收束流程。它适合图文笔记的收藏行为：第一张制造判断冲突，5/8 张提供可留存的模板与流程。

小红书网页版当前要求登录才会展示搜索卡片，因此没有伪造平台内互动数字；页面形式与标题切口来自可公开检索的近期 AI 编程 / Codex 内容样本，以及“痛点 + 对比 + 可复制模板”的共性。

## 重新生成

```bash
/Users/xht/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 render_carousel.py
```
