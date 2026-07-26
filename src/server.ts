import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
const root=resolve(process.argv[2]||"dist");
const types:Record<string,string>={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".xml":"application/xml",".txt":"text/plain; charset=utf-8"};
createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url!,"http://localhost").pathname);let file=join(root,pathname);if((await stat(file).catch(()=>null))?.isDirectory())file=join(file,"index.html");const data=await readFile(file);res.writeHead(200,{"content-type":types[extname(file)]||"application/octet-stream","cache-control":"no-cache","x-content-type-options":"nosniff"});res.end(data)}catch{const data=await readFile(join(root,"404.html"));res.writeHead(404,{"content-type":"text/html; charset=utf-8"});res.end(data)}}).listen(4173,"127.0.0.1",()=>console.log("预览：http://localhost:4173"));
