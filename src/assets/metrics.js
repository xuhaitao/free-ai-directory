const send=(type,extra={})=>{
  const params=new URLSearchParams({type,path:location.pathname,...extra});
  const url=`/event?${params}`;
  if(navigator.sendBeacon){navigator.sendBeacon(url,new Blob([], {type:'text/plain'}));return;}
  fetch(url,{method:'POST',keepalive:true,credentials:'omit'}).catch(()=>{});
};

// A pageview alone is not enough to distinguish a person from a crawler that
// executes JavaScript. Count a visit as engaged only after a visible dwell or
// a real input event. This deliberately makes the growth metric conservative.
let engaged=false;
const markEngaged=reason=>{
  if(engaged||document.visibilityState!=='visible')return;
  engaged=true;
  send('engaged',{reason});
};

const startedAt=performance.now();
const onInput=event=>{
  if(!event.isTrusted||performance.now()-startedAt<2000)return;
  markEngaged(event.type);
};

for(const type of ['pointerdown','keydown','touchstart','scroll']){
  addEventListener(type,onInput,{once:true,passive:true});
}

for(const video of document.querySelectorAll('video')){
  video.addEventListener('play',()=>markEngaged('video-play'),{once:true});
  video.addEventListener('ended',()=>send('video-complete'),{once:true});
}

setTimeout(()=>markEngaged('dwell-15s'),15000);

try{
  const key=`pv:${location.pathname}`;
  if(!sessionStorage.getItem(key)){
    sessionStorage.setItem(key,'1');
    let ref='direct';
    const taggedSource=new URLSearchParams(location.search).get('utm_source');
    if(taggedSource&&/^[a-z0-9_-]{1,64}$/i.test(taggedSource))ref=`utm:${taggedSource.toLowerCase()}`;
    else if(document.referrer)ref=new URL(document.referrer).hostname||'direct';
    send('pageview',{ref});
  }
}catch{
  send('pageview',{ref:'unknown'});
}

document.addEventListener('click',event=>{
  const link=event.target.closest('a[data-track]');
  if(!link)return;
  send(link.dataset.track||'external');
});
