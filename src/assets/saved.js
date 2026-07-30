const key='free-ai-directory:saved:v1';
const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}};
const write=items=>localStorage.setItem(key,JSON.stringify(items.slice(0,100)));
const buttons=()=>document.querySelectorAll('[data-save]');
function paint(){
  const ids=new Set(read().map(item=>item.id));
  for(const button of buttons()){
    const saved=ids.has(button.dataset.saveId);
    button.textContent=saved?'已收藏':'收藏';
    button.setAttribute('aria-pressed',String(saved));
    button.classList.toggle('active',saved);
  }
}
function renderSaved(){
  const root=document.querySelector('[data-saved-list]');
  if(!root)return;
  const items=read();root.replaceChildren();
  const count=document.querySelector('[data-saved-count]');if(count)count.textContent=String(items.length);
  if(!items.length){root.innerHTML='<section class="empty"><h2>还没有收藏</h2><p>在每日榜单或模型卡点击“收藏”，条目只保存在这台设备的浏览器中。</p><a class="button primary" href="/daily/">查看今日热点</a></section>';return}
  for(const item of items){
    const article=document.createElement('article');article.className='card';
    const meta=document.createElement('span');meta.className='eyebrow';meta.textContent=item.meta||'已收藏';
    const heading=document.createElement('h2');const link=document.createElement('a');link.href=item.url;link.textContent=item.title;heading.append(link);
    const remove=document.createElement('button');remove.type='button';remove.className='button';remove.textContent='移除收藏';remove.addEventListener('click',()=>{write(read().filter(x=>x.id!==item.id));paint();renderSaved()});
    article.append(meta,heading,remove);root.append(article);
  }
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-save]');if(!button)return;
  const item={id:button.dataset.saveId,title:button.dataset.saveTitle,url:button.dataset.saveUrl,meta:button.dataset.saveMeta,savedAt:new Date().toISOString()};
  const items=read(),index=items.findIndex(x=>x.id===item.id);
  if(index>=0)items.splice(index,1);else items.unshift(item);
  write(items);paint();renderSaved();
  if(index<0)document.dispatchEvent(new CustomEvent('site-metric',{detail:{type:'save-item'}}));
});
paint();renderSaved();
