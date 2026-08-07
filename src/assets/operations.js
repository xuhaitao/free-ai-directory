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

const top3Text=button=>{
  const lines=JSON.parse(button.dataset.top3Lines||"[]");
  const note=button.dataset.top3Note||"";
  const parts=[`免费 AI 目录 · ${button.dataset.top3Heading||"今日 Top 3"} · ${button.dataset.top3Date||""}`,"",...lines.map((line,index)=>`${index+1}. ${line}`),""];
  if(note)parts.push(note,"");
  parts.push(`完整榜单：${button.dataset.top3Url||location.href}`);
  return parts.join("\n");
};

document.querySelectorAll("[data-copy-top3]").forEach(button=>button.addEventListener("click",async event=>{
  if(!event.isTrusted)return;
  const original=button.textContent;
  try{
    await copyText(top3Text(button));
    button.textContent="已复制";
    setTimeout(()=>button.textContent=original,1800);
    report(button.dataset.top3Track||"top3-copy");
  }catch{}
}));

document.querySelectorAll("[data-share-top3]").forEach(button=>button.addEventListener("click",async event=>{
  if(!event.isTrusted)return;
  const text=top3Text(button);
  const original=button.textContent;
  try{
    if(navigator.share){
      await navigator.share({title:`${button.dataset.top3Heading||"今日 Top 3"} · 免费 AI 目录`,text,url:button.dataset.top3Url||location.href});
    }else{
      await copyText(text);
      button.textContent="已复制";
      setTimeout(()=>button.textContent=original,1800);
    }
    report(button.dataset.top3Track||"top3-share");
  }catch(error){
    if(error?.name!=="AbortError")button.textContent="请手动复制页面链接";
  }
}));
