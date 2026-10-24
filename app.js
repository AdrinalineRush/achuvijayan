const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const upcomingFilms=['house-for-sale','boom-bang'].map(id=>FEATURE_FILMS.find(f=>f.id===id)).filter(Boolean);
const workMarker=document.querySelector('#work .section-top span:first-child');
if(workMarker) workMarker.textContent='01 / UP COMING WORK';
const featured=$('#featured');
if(featured) featured.innerHTML=upcomingFilms.map(f=>`<button class="film-card" data-film="${f.id}"><div class="poster"><img src="${f.poster}" alt="${esc(f.title)} film poster"><span class="arrow" aria-hidden="true">↗</span></div><div class="film-meta"><span>${esc(f.roles.join(' / '))}</span><span>${f.year}</span></div><h3>${esc(f.title)}</h3></button>`).join('');
const archive=$('#archive');
const archiveFilms=archive?[...archive.querySelectorAll('.archive-card')].map(card=>({
  id:card.dataset.film,
  title:card.querySelector('h3')?.textContent.trim()||'',
  year:card.querySelector('.film-meta span')?.textContent.trim()||'',
  roles:card.dataset.roles||'',
  poster:card.querySelector('img')?.getAttribute('src')||'',
  alt:card.querySelector('img')?.getAttribute('alt')||'',
  ...((feature)=>({
    languageVersions:feature?.languageVersions||'',
    versionEditing:feature?.versionEditing||'',
    description:feature?.description||'',
    director:feature?.director||'',
    cast:feature?.cast||''
  }))(FEATURE_FILMS.find(f=>f.id===card.dataset.film))
})):[];
if(archive){
  archive.className='archive-list';
  archive.innerHTML=archiveFilms.map((f,i)=>`<button class="archive-row" data-film="${f.id}" data-roles="${esc(f.roles)}" aria-pressed="${i===0?'true':'false'}"><span class="year">${esc(f.year)}</span><span class="title-wrap"><span class="title">${esc(f.title)}</span>${f.languageVersions?`<span class="title-variants">${esc(f.languageVersions)}</span>`:''}</span><span class="roles">${esc(f.roles.split(' ').join(' · '))}</span><span class="arrow">↗</span></button>`).join('');
  archive.insertAdjacentHTML('afterend','<aside class="archive-preview" aria-live="polite"><div class="archive-preview-art"><img alt=""></div><div class="archive-preview-copy"><div class="archive-preview-meta mono"></div><h3></h3><p class="archive-preview-note">Choose a title to view its poster.</p><p class="archive-preview-languages"></p><p class="archive-preview-description"></p></div></aside>');
}
const preview=$('.archive-preview');
if(archive&&preview){const browser=document.createElement('div');browser.className='archive-browser';archive.parentNode.insertBefore(browser,archive);browser.append(archive,preview)}
function showArchivePoster(id){
  const f=archiveFilms.find(x=>x.id===id);if(!f||!preview)return;
  preview.querySelector('img').src=f.poster;preview.querySelector('img').alt=f.alt;
  preview.querySelector('.archive-preview-meta').textContent=`${f.year} / ${f.roles.split(' ').join(' · ')}`;
  preview.querySelector('h3').textContent=f.title;preview.querySelector('.archive-preview-note').textContent=f.versionEditing||'Click another title to keep exploring the archive.';
  preview.querySelector('.archive-preview-languages').textContent=f.languageVersions;
  preview.querySelector('.archive-preview-description').textContent=f.description;
  document.querySelectorAll('.archive-row').forEach(row=>row.setAttribute('aria-pressed',String(row.dataset.film===id)));
}
const defaultArchiveFilm=archiveFilms.find(f=>f.id==='vichithram')||archiveFilms[0];
if(defaultArchiveFilm)showArchivePoster(defaultArchiveFilm.id);
function render(filter='all'){let count=0;document.querySelectorAll('.archive-row').forEach(row=>{const visible=filter==='all'||row.dataset.roles.includes(filter);row.hidden=!visible;if(visible)count++});$('#count').textContent=String(count).padStart(2,'0')}
render();
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});render(b.dataset.filter)}));
const dialog=$('#detail');let opener;
document.addEventListener('click',e=>{
  const button=e.target.closest('[data-film],[data-campaign]');
  if(!button)return;
  if(button.classList.contains('archive-row')){showArchivePoster(button.dataset.film);return}
  const f=button.dataset.film?FEATURE_FILMS.find(f=>f.id===button.dataset.film):AI_CAMPAIGNS.find(c=>c.id===button.dataset.campaign);
  if(!f)return;
  opener=button;
  const sourceImage=button.querySelector('img');
  const img=sourceImage?(sourceImage.currentSrc||sourceImage.src):(f.poster||f.image||null);
  $('#detail-content').innerHTML=`${img?`<div class="detail-poster-wrap"><img src="${img}" alt="${esc(f.title)}"></div>`:''}<div class="detail-copy"><span class="mono">${esc(f.year)} / ${esc(f.language||f.badge)}</span><h2 id="detail-title">${esc(f.title)}</h2><p>${esc(f.description)}</p><dl>${[['Role',f.roles?.join(' / ')||f.role],['Version editing',f.versionEditing],['Language versions',f.languageVersions],['Director',f.director],['Cast',f.cast],['Production',f.production||f.client],['Awards',f.award]].filter(x=>x[1]).map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`;
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
