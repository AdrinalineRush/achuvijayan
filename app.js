const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const upcomingFilms=['house-for-sale','boom-bang'].map(id=>FEATURE_FILMS.find(f=>f.id===id)).filter(Boolean);
const workMarker=document.querySelector('#work .section-top span:first-child');
if(workMarker) workMarker.textContent='01 / UP COMING WORK';
const featured=$('#featured');
if(featured) featured.innerHTML=upcomingFilms.map(f=>`<button class="film-card" data-film="${f.id}"><div class="poster"><img src="${f.poster}" alt="${esc(f.title)} film poster"><span class="arrow" aria-hidden="true">↗</span></div><div class="film-meta"><span>${esc(f.roles.join(' / '))}</span><span>${f.year}</span></div><h3>${esc(f.title)}</h3></button>`).join('');
function render(filter='all'){let count=0;document.querySelectorAll('.archive-card').forEach(card=>{const visible=filter==='all'||card.dataset.roles.includes(filter);card.hidden=!visible;if(visible)count++});$('#count').textContent=String(count).padStart(2,'0')}
render();
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});render(b.dataset.filter)}));
const dialog=$('#detail');let opener;
document.addEventListener('click',e=>{
  const button=e.target.closest('[data-film],[data-campaign]');
  if(!button)return;
  const f=button.dataset.film?FEATURE_FILMS.find(f=>f.id===button.dataset.film):AI_CAMPAIGNS.find(c=>c.id===button.dataset.campaign);
  if(!f)return;
  opener=button;
  const sourceImage=button.querySelector('img');
  const img=sourceImage?(sourceImage.currentSrc||sourceImage.src):(f.poster||f.image||null);
  $('#detail-content').innerHTML=`${img?`<div class="detail-poster-wrap"><img src="${img}" alt="${esc(f.title)}"></div>`:''}<div class="detail-copy"><span class="mono">${esc(f.year)} / ${esc(f.language||f.badge)}</span><h2 id="detail-title">${esc(f.title)}</h2><p>${esc(f.description)}</p><dl>${[['Role',f.roles?.join(' / ')||f.role],['Director',f.director],['Cast',f.cast],['Production',f.production||f.client],['Awards',f.award]].filter(x=>x[1]).map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`;
  const detailImage=$('#detail-content img');
  if(detailImage){
    detailImage.addEventListener('error',()=>{
      detailImage.parentElement.replaceWith(Object.assign(document.createElement('p'),{className:'image-unavailable',textContent:'Poster unavailable.'}))
    },{once:true});
  }
  $('#detail-content').classList.toggle('without-poster',!img);
  dialog.showModal();
  document.body.style.overflow='hidden';
});
$('#close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});dialog.addEventListener('close',()=>{document.body.style.overflow='';opener?.focus()});
