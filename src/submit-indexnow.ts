import { readFile } from "node:fs/promises";

const site = (process.env.PUBLIC_SITE_URL || "https://www.qaz5678.xyz").replace(/\/$/, "");
const host = new URL(site).host;
const key = "5a833d3afae13ba1ec3ccd2e2d888c08";
const keyLocation = `${site}/${key}.txt`;
const sitemap = await readFile(new URL("../dist/sitemap.xml", import.meta.url), "utf8");
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]!);

const keyResponse = await fetch(keyLocation);
if (!keyResponse.ok || (await keyResponse.text()).trim() !== key) {
  throw new Error(`IndexNow key 文件不可访问：${keyResponse.status}`);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation, urlList })
});

if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow 提交失败：HTTP ${response.status} ${await response.text()}`);
}
console.log(`IndexNow 已接收 ${urlList.length} 个 URL：HTTP ${response.status}`);
