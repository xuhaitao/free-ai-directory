const safeTag=value=>value&&/^[a-z0-9_-]{1,64}$/i.test(value)?value.toLowerCase():'';
let attribution={};
try{
  const query=new URLSearchParams(location.search);
  const tagged={
    source:safeTag(query.get('utm_source')),
    medium:safeTag(query.get('utm_medium')),
    campaign:safeTag(query.get('utm_campaign')),
    content:safeTag(query.get('utm_content'))
  };
  if(Object.values(tagged).some(Boolean))sessionStorage.setItem('traffic-attribution-v1',JSON.stringify(tagged));
  attribution=JSON.parse(sessionStorage.getItem('traffic-attribution-v1')||'{}');
}catch{}

const send=(type,extra={})=>{
  const params=new URLSearchParams({type,path:location.pathname,...attribution,...extra});
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
    const taggedSource=attribution.source;
    if(taggedSource)ref=`utm:${taggedSource}`;
    else if(document.referrer)ref=new URL(document.referrer).hostname||'direct';
    send('pageview',{ref});
  }
}catch{
  send('pageview',{ref:'unknown'});
}

document.addEventListener('click',event=>{
  if(!event.isTrusted)return;
  const link=event.target.closest('a[data-track]');
  if(!link)return;
  send(link.dataset.track||'external');
});

const seenTopics=new Set();
if('IntersectionObserver' in window){
  const topicObserver=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting||entry.intersectionRatio<.5)continue;
      const topic=safeTag(entry.target.dataset.experimentTopic);
      if(!topic||seenTopics.has(topic))continue;
      seenTopics.add(topic);
      send(`topic-view-${topic}`);
      topicObserver.unobserve(entry.target);
    }
  },{threshold:.5});
  document.querySelectorAll('[data-experiment-topic]').forEach(card=>topicObserver.observe(card));
}

const funnelEvents=new Set(['site-search','directory-filter','finder-start','finder-result','finder-open','save-item','saved-open','model-compare-add','model-compare-open']);
document.addEventListener('site-metric',event=>{
  const type=String(event.detail?.type||'');
  if(funnelEvents.has(type))send(type);
});
