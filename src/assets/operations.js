const report=type=>{
  const body=new URLSearchParams({type,path:location.pathname});
  if(navigator.sendBeacon)navigator.sendBeacon("/event",body);
  else fetch("/event",{method:"POST",body,keepalive:true,credentials:"same-origin"}).catch(()=>{});
};

async function copyText(value){
  if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(value);
  const input=document.createElement("textarea");
  input.value=value;input.setAttribute("readonly","");input.style.position="fixed";input.style.opacity="0";
  document.body.append(input);input.select();document.execCommand("copy");input.remove();
}

document.querySelectorAll("[data-copy-brief]").forEach(button=>button.addEventListener("click",async()=>{
  const status=document.querySelector("[data-brief-status]");
  try{
    const lines=JSON.parse(button.dataset.briefLines||"[]");
    const url=new URL("/",location.origin);
    url.searchParams.set("utm_source","share");
    url.searchParams.set("utm_medium","web");
    url.searchParams.set("utm_campaign","daily_brief");
    const text=[`免费 AI 目录 · ${button.dataset.briefDate||"今日"}简报`,"",...lines.map((line,index)=>`${index+1}. ${line}`),"",`完整榜单：${url}`].join("\n");
    await copyText(text);
    button.textContent="已复制";
    if(status)status.textContent="简报已复制，可粘贴到微信、群聊或笔记中。";
    report("brief-copy");
  }catch{
    if(status)status.textContent="复制失败，请直接分享本站首页。";
  }
}));
