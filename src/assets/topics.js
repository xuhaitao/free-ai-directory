const key='free-ai-directory:followed-topics:v1';
const read=()=>{try{return [...new Set(JSON.parse(localStorage.getItem(key)||'[]'))].filter(id=>typeof id==='string').slice(0,20)}catch{return []}};
const write=ids=>localStorage.setItem(key,JSON.stringify(ids.slice(0,20)));
const buttons=()=>document.querySelectorAll('[data-topic-follow]');
function paint(){
  const followed=new Set(read());
  for(const button of buttons()){
    const active=followed.has(button.dataset.topicFollow);
    button.textContent=active?'已关注':'关注主题';
    button.setAttribute('aria-pressed',String(active));
    button.classList.toggle('active',active);
  }
}
function renderFollowing(){
  const root=document.querySelector('[data-following-list]');if(!root)return;
  const followed=new Set(read());let shown=0;
  for(const item of root.querySelectorAll('[data-following-topic]')){const visible=followed.has(item.dataset.followingTopic);item.hidden=!visible;if(visible)shown++}
  const count=document.querySelector('[data-following-count]');if(count)count.textContent=String(shown);
  const empty=document.querySelector('[data-following-empty]');if(empty)empty.hidden=shown>0;
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-topic-follow]');if(!button)return;
  const id=button.dataset.topicFollow,ids=read(),index=ids.indexOf(id);
  if(index>=0)ids.splice(index,1);else ids.unshift(id);
  write(ids);paint();renderFollowing();
  document.dispatchEvent(new CustomEvent('site-metric',{detail:{type:index>=0?'topic-unfollow':'topic-follow'}}));
});
paint();renderFollowing();
