const sendShare=()=>{
  const params=new URLSearchParams({type:'share',path:location.pathname});
  navigator.sendBeacon?.(`/event?${params}`,new Blob([], {type:'text/plain'}));
};

document.querySelectorAll('[data-share]').forEach(button=>button.addEventListener('click',async event=>{
  if(!event.isTrusted)return;
  const original=button.textContent;
  try{
    if(navigator.share){
      await navigator.share({title:document.title,text:document.querySelector('meta[name="description"]')?.content||'',url:location.href});
    }else{
      await navigator.clipboard.writeText(location.href);
      button.textContent='链接已复制';
      setTimeout(()=>button.textContent=original,1800);
    }
    sendShare();
  }catch(error){
    if(error?.name!=='AbortError')button.textContent='请复制地址栏链接';
  }
}));
