const key='free-ai-directory:compare:v1';
const maximum=3;
const categoryLabels={text_generation:'文本生成',code_generation:'代码生成',multimodal:'多模态',image_generation:'图像生成',video_generation:'视频生成',embedding:'Embedding',rerank:'Rerank',semantic_segmentation:'语义分割',object_detection:'目标检测',image_classification:'图像分类',speech_to_text:'语音识别',text_to_speech:'语音合成',audio_classification:'音频分类',translation:'翻译'};
const freeLabels={permanent:'长期免费路由',recurring:'周期免费额度',signup_credit:'小额免费额度',open_source:'开放权重 / 本地免费'};
const read=()=>{try{return [...new Set(JSON.parse(localStorage.getItem(key)||'[]'))].slice(0,maximum)}catch{return []}};
const write=ids=>localStorage.setItem(key,JSON.stringify(ids.slice(0,maximum)));
function paint(){
  const selected=new Set(read());
  for(const button of document.querySelectorAll('[data-compare]')){
    const active=selected.has(button.dataset.compare);button.textContent=active?'已加入对比':'加入对比';button.setAttribute('aria-pressed',String(active));button.classList.toggle('active',active);
  }
  for(const bar of document.querySelectorAll('[data-compare-bar]')){bar.hidden=!selected.size;bar.querySelector('[data-compare-count]').textContent=String(selected.size)}
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-compare]');if(!button)return;
  const ids=read(),id=button.dataset.compare,index=ids.indexOf(id);
  if(index>=0)ids.splice(index,1);else if(ids.length<maximum)ids.push(id);else{button.textContent='最多对比 3 个';setTimeout(paint,1400);return}
  write(ids);paint();document.dispatchEvent(new CustomEvent('site-metric',{detail:{type:'model-compare-add'}}));
});
async function renderCompare(){
  const root=document.querySelector('[data-compare-results]');if(!root)return;
  const ids=read();const count=document.querySelector('[data-compare-selected]');if(count)count.textContent=String(ids.length);
  if(!ids.length){root.innerHTML='<section class="empty"><h2>先选 2–3 个模型</h2><p>回到目录，在模型卡点击“加入对比”。对比只显示本站已有的公开规则和来源。</p><a class="button primary" href="/models/">浏览免费模型</a></section>';return}
  try{
    const data=await fetch('/data/models.json',{credentials:'omit'}).then(r=>r.ok?r.json():Promise.reject());
    const models=ids.map(id=>data.models.find(item=>item.id===id)).filter(Boolean);
    if(!models.length){write([]);renderCompare();return}
    root.replaceChildren();const table=document.createElement('div');table.className='compare-grid';
    const fields=[['模型',item=>item.name],['模型 ID',item=>item.modelId],['能力',item=>categoryLabels[item.category]||item.category],['免费方式',item=>freeLabels[item.freeType]||item.freeType],['公开规则',item=>item.freeSummary],['标签',item=>item.tags.join('、')],['资料审阅',item=>item.lastReviewedAt]];
    for(const [label,get] of fields){const row=document.createElement('div');row.className='compare-row';const name=document.createElement('b');name.textContent=label;row.append(name);for(const item of models){const value=document.createElement('div');value.textContent=get(item);row.append(value)}table.append(row)}
    const links=document.createElement('div');links.className='compare-links';for(const item of models){const box=document.createElement('div');const title=document.createElement('b');title.textContent=item.name;const details=document.createElement('a');details.href=`/models/${item.id}/`;details.textContent='查看条目';const source=document.createElement('a');source.href=item.sourceUrl;source.target='_blank';source.rel='noopener noreferrer nofollow';source.textContent='核对免费规则 ↗';const remove=document.createElement('button');remove.type='button';remove.className='button';remove.textContent='移出对比';remove.addEventListener('click',()=>{write(read().filter(id=>id!==item.id));paint();renderCompare()});box.append(title,details,source,remove);links.append(box)}root.append(table,links);
  }catch{root.innerHTML='<section class="empty">模型目录暂时无法加载，请稍后重试。</section>'}
}
paint();renderCompare();
