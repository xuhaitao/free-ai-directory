const form=document.querySelector('#site-search');
const input=form?.querySelector('input[name="q"]');
const results=document.querySelector('#search-results');
const status=document.querySelector('#search-status');
const params=new URLSearchParams(location.search);
let index=[];

const normalize=value=>String(value||'').toLocaleLowerCase('zh-CN');
function score(item,tokens){
  const title=normalize(item.title),keywords=normalize(item.keywords),description=normalize(item.description),haystack=`${title} ${keywords} ${description}`;
  if(!tokens.every(token=>haystack.includes(token)))return -1;
  return tokens.reduce((sum,token)=>sum+(title.includes(token)?8:0)+(keywords.includes(token)?4:0)+(description.includes(token)?1:0),0);
}
function render(){
  const query=input.value.trim();
  const tokens=normalize(query).split(/\s+/).filter(Boolean);
  const found=tokens.length?index.map(item=>({item,score:score(item,tokens)})).filter(row=>row.score>=0).sort((a,b)=>b.score-a.score).slice(0,50).map(row=>row.item):[];
  results.replaceChildren();
  status.textContent=query?`找到 ${found.length} 个结果`:`可搜索 ${index.length} 条模型、中转站、新闻、项目、趋势模型和教程`;
  for(const item of found){
    const article=document.createElement('article');article.className='card search-result';
    const meta=document.createElement('span');meta.className='eyebrow';meta.textContent=item.typeLabel;
    const heading=document.createElement('h2');const link=document.createElement('a');link.href=item.url;link.textContent=item.title;link.dataset.track='search-result';
    if(item.external){link.target='_blank';link.rel='noopener noreferrer nofollow'}
    heading.append(link);const description=document.createElement('p');description.textContent=item.description;
    article.append(meta,heading,description);results.append(article);
  }
  if(query&&!found.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='没有匹配结果，请尝试模型名、能力类型、客户端或项目名称。';results.append(empty)}
}
let searchMetricSent=false;function trackSearch(event){if(event?.isTrusted&&!searchMetricSent&&input.value.trim()){searchMetricSent=true;document.dispatchEvent(new CustomEvent('site-metric',{detail:{type:'site-search'}}))}}
function sync(event){const query=input.value.trim(),next=new URLSearchParams();if(query)next.set('q',query);history.replaceState(null,'',location.pathname+(next.size?`?${next}`:''));render();trackSearch(event)}
form?.addEventListener('submit',event=>{event.preventDefault();sync(event)});
input?.addEventListener('input',event=>{clearTimeout(input._timer);input._timer=setTimeout(()=>sync(event),120)});
if(input)input.value=params.get('q')||'';
try{index=await fetch('/data/search-index.json',{credentials:'omit'}).then(response=>{if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.json()});render()}catch{status.textContent='搜索索引暂时无法加载，请稍后重试。'}
