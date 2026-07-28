const form=document.querySelector('#model-finder');
const results=document.querySelector('#finder-results');
const status=document.querySelector('#finder-status');
const params=new URLSearchParams(location.search);
let models=[];
let started=false;

const categoryGroups={
  chat:['text_generation','multimodal'],code:['code_generation'],image:['image_generation'],video:['video_generation'],rag:['embedding','rerank'],vision:['semantic_segmentation','object_detection','image_classification'],audio:['speech_to_text','text_to_speech','audio_classification'],translation:['translation']
};
const emit=type=>document.dispatchEvent(new CustomEvent('site-metric',{detail:{type}}));
function values(){return Object.fromEntries(new FormData(form))}
function matches(item,answers){
  const categories=categoryGroups[answers.task]||[];
  if(categories.length&&!categories.includes(item.category))return false;
  if(answers.access==='api'&&item.freeType==='open_source')return false;
  if(answers.access==='local'&&item.freeType!=='open_source')return false;
  if(answers.budget==='no_topup'&&item.freeType==='signup_credit')return false;
  if(answers.account==='none'&&item.registration!=='none')return false;
  if(answers.chinese==='required'&&!item.chineseFriendly)return false;
  return true;
}
function render(syncUrl=true,event){
  const answers=values(),next=new URLSearchParams();for(const [key,value] of Object.entries(answers))if(value)next.set(key,value);
  if(syncUrl)history.replaceState(null,'',location.pathname+(next.size?`?${next}`:''));
  const found=models.filter(item=>matches(item,answers)).slice(0,8);results.replaceChildren();
  status.textContent=found.length?`找到 ${found.length} 个优先候选`:'没有完全匹配的条目，请放宽“无需账户”或“必须支持中文”等条件。';
  for(const item of found){
    const article=document.createElement('article');article.className='card';
    const meta=document.createElement('span');meta.className='eyebrow';meta.textContent=`${item.categoryLabel} · ${item.provider}`;
    const heading=document.createElement('h2');const link=document.createElement('a');link.href=item.url;link.textContent=item.name;link.dataset.track='finder-open';heading.append(link);
    const description=document.createElement('p');description.textContent=item.description;
    const tags=document.createElement('div');tags.className='tags';for(const value of item.labels){const tag=document.createElement('span');tag.textContent=value;tags.append(tag)}
    article.append(meta,heading,description,tags);results.append(article);
  }
  if(event?.isTrusted){if(!started){started=true;emit('finder-start')}emit('finder-result')}
}
for(const element of form.elements)if(element.name&&params.has(element.name))element.value=params.get(element.name);
form.addEventListener('input',event=>render(true,event));
form.addEventListener('reset',event=>setTimeout(()=>render(true,event),0));
try{models=await fetch('/data/model-finder.json',{credentials:'omit'}).then(response=>{if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.json()});render(false)}catch{status.textContent='模型选择数据暂时无法加载，请稍后重试。'}
