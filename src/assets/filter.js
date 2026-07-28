const form=document.querySelector('#filters');
const cards=[...document.querySelectorAll('.card')];
const count=document.querySelector('#result-count');
const empty=document.querySelector('#empty');
const params=new URLSearchParams(location.search);
for(const el of form.elements)if(el.name&&params.has(el.name))el.value=params.get(el.name);
function apply(sync=true){const data=new FormData(form),next=new URLSearchParams();let visible=0;for(const [k,raw] of data){const v=String(raw).trim();if(v)next.set(k,v)}for(const card of cards){const q=String(data.get('q')||'').toLocaleLowerCase('zh-CN');const ok=(!q||card.dataset.search.includes(q))&&exact(card,data,'category')&&exact(card,data,'provider')&&exact(card,data,'freeType','free')&&exact(card,data,'evidence')&&contains(card,data,'client')&&contains(card,data,'protocol');card.hidden=!ok;if(ok)visible++}count.textContent=visible;empty.hidden=visible!==0;if(sync)history.replaceState(null,'',location.pathname+(next.size?'?'+next:''))}
function exact(card,data,name,attr=name){const v=String(data.get(name)||'');return !v||card.dataset[attr]===v}
function contains(card,data,name){const v=String(data.get(name)||'');return !v||String(card.dataset[name]||'').includes(v)}
let filterMetricSent=false;function filterMetric(event){if(event.isTrusted&&!filterMetricSent){filterMetricSent=true;document.dispatchEvent(new CustomEvent('site-metric',{detail:{type:'directory-filter'}}))}}
form.addEventListener('input',event=>{apply();filterMetric(event)});form.addEventListener('reset',event=>{filterMetric(event);setTimeout(()=>apply(),0)});apply(false);
