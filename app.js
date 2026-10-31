/* Achu Vijayan — portfolio behaviour.
   Renders films, commercials, music videos and AI films, runs the archive browser and the
   detail dialog, then (unless the visitor prefers reduced motion) adds smooth scrolling and
   the scroll-driven sequences with GSAP + ScrollTrigger + SplitText + Lenis. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const pad = n => String(n).padStart(2, '0');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const imgReady = img => !img || img.complete ? Promise.resolve() : new Promise(r => {
    img.addEventListener('load', r, {toggleActions: 'play none none none'});
    img.addEventListener('error', r, {toggleActions: 'play none none none'});
  });
  // 24 fps timecode, HH:MM:SS:FF.
  const timecode = frames => {
    const s = Math.floor(frames / 24);
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(frames % 24)}`;
  };

  const root = document.documentElement;
  const films = typeof FEATURE_FILMS !== 'undefined' ? FEATURE_FILMS : [];
  const findFilm = id => films.find(f => f.id === id);

  let savedMotion = false;
  try { savedMotion = localStorage.getItem('achu-reduced-motion') === 'true'; } catch {}
  const systemMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reducedMotion = systemMotion || savedMotion;
  if (reducedMotion) root.classList.add('motion-reduced');
  const motion = !reducedMotion && ['gsap', 'ScrollTrigger', 'SplitText', 'Lenis'].every(n => typeof window[n] !== 'undefined');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const narrow = matchMedia('(max-width: 760px)');
  let lenis = null;
  const motionToggle = $('.motion-toggle');
  if (motionToggle) {
    motionToggle.hidden = false;
    motionToggle.setAttribute('aria-pressed', String(reducedMotion));
    motionToggle.textContent = reducedMotion ? 'Motion reduced' : 'Reduce motion';
    motionToggle.disabled = systemMotion;
    if (systemMotion) motionToggle.title = 'Reduced motion follows your device settings';
    motionToggle.addEventListener('click', () => {
      try { localStorage.setItem('achu-reduced-motion', String(!savedMotion)); } catch { return; }
      history.replaceState(null, '', '#contact');
      location.reload();
    });
  }
  // Close the work menu after a choice, an outside click, or Escape.
  const workMenu = $('.work-menu');
  document.addEventListener('click', e => {
    if (workMenu && (!workMenu.contains(e.target) || e.target.closest('a'))) workMenu.open = false;
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && workMenu?.open) {
      workMenu.open = false;
      $('summary', workMenu).focus();
    }
  });

  // Intrinsic poster sizes, so the reel lays out before the images arrive.
  const POSTER_SIZE = {
    '32aam_adhyayam': [682, 1024], aaram: [458, 669], aattam: [702, 1024], boom_bang: [768, 1024],
    charles_enterprises: [768, 1024], house_for_sale: [768, 1024], kidu: [1200, 1600],
    mukundan_unni_hd: [752, 1100], namaste_bali: [680, 859], oru_adaar_love: [768, 1024],
    second_show: [258, 387], simba: [750, 1024], starring_pournami: [540, 720], thuninthavan: [720, 1280],
    vichithram: [576, 1024], white: [768, 1024], gudiya: [825, 1100], flip_side: [733, 1100], copy_that: [742, 1100], maanasi: [806, 1100], narai: [215, 283]
  };
  const responsiveImages = typeof RESPONSIVE_IMAGES === 'undefined' ? {} : RESPONSIVE_IMAGES;
  const posterSize = src => responsiveImages[src]
    ? [responsiveImages[src].width, responsiveImages[src].height]
    : POSTER_SIZE[String(src || '').split('/').pop().replace(/\.\w+$/, '')] || [3, 4];
  const imageAttrs = (src, sizes) => {
    const image = responsiveImages[src];
    return `src="${esc(src)}"${image ? ` srcset="${image.variants.map(v => `${esc(v.src)} ${v.width}w`).join(', ')}" sizes="${sizes}"` : ''}`;
  };
  const optimizedPoster = src => responsiveImages[src]?.variants.at(-1)?.src || src;

  // Titles without artwork (shorts, music videos) get a clapperboard slate in place of a poster.
  const slate = (f, cls = '') => `<span class="slate ${cls}" role="img" aria-label="${esc(f.title)}, ${esc(f.badge || 'film')}, ${esc(f.year)}">
      <span class="slate-bar" aria-hidden="true"></span>
      <span class="slate-body" aria-hidden="true">
        <span class="slate-head"><span class="mono">Prod.</span><span class="slate-title">${esc(f.title)}</span></span>
        <span class="slate-grid">
          <span><span class="mono">Dir.</span>${esc(f.director || '—')}</span>
          <span><span class="mono">Year</span>${esc(f.year)}</span>
          <span><span class="mono">Type</span>${esc(f.badge || 'Feature')}</span>
          <span><span class="mono">Role</span>${esc(f.roles.join(' / '))}</span>
        </span>
      </span>
    </span>`;

  let refreshTimer;
  const refresh = () => {
    if (!motion) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 120);
  };

  /* ---------- Film archive reel: oldest to newest, like clips on a timeline ---------- */
  const chrono = [...films].reverse();
  const track = $('#reel-track');
  const viewport = $('#reel-viewport');
  if (track) track.innerHTML = chrono.map((f, i) => {
    const [w, h] = posterSize(f.poster);
    return `<button class="reel-clip" type="button" data-film="${f.id}" data-index="${i}" data-cursor="Open" aria-label="${esc(f.title)}, ${esc(f.year)}">
      <span class="reel-clip-head mono" aria-hidden="true"><span>${esc(f.year)}</span><span>${pad(i + 1)}</span></span>
      ${f.poster ? `<img class="reel-media" ${imageAttrs(f.poster, '(max-width: 760px) 280px, 320px')} alt="" width="${w}" height="${h}" loading="lazy" decoding="async">` : slate(f, 'reel-media')}
    </button>`;
  }).join('');
  const reelClips = $$('.reel-clip');
  $$('[data-film-count]').forEach(el => { el.textContent = films.length; });
  if ($('#reel-total')) $('#reel-total').textContent = pad(chrono.length);
  if (chrono.length && $('#reel-span')) $('#reel-span').textContent = `${chrono[0].year} — ${chrono.at(-1).year}`;

  let activeIndex = -1;
  function setActive(i) {
    if (i === activeIndex || !chrono[i]) return;
    activeIndex = i;
    // Prepare only nearby posters; keep the rest of the archive lazy.
    reelClips.slice(Math.max(0, i - 1), i + 3).forEach(clip => {
      const img = $('img', clip);
      if (img) img.loading = 'eager';
    });
    reelClips.forEach((c, n) => c.classList.toggle('is-active', n === i));
    const f = chrono[i];
    const title = $('#reel-active-title'), meta = $('#reel-active-meta'), desc = $('#reel-active-desc');
    $('#reel-year').textContent = f.year;
    $('#reel-index').textContent = pad(i + 1);
    if ($('#reel-prev')) $('#reel-prev').disabled = i === 0;
    if ($('#reel-next')) $('#reel-next').disabled = i === chrono.length - 1;
    title.textContent = f.title;
    meta.textContent = [f.roles.join(' · '), f.language].filter(Boolean).join(' — ');
    desc.textContent = f.description || '';
    if (motion) gsap.fromTo([title, meta, desc], {yPercent: 35, autoAlpha: 0}, {yPercent: 0, autoAlpha: 1, duration: .45, ease: 'power3.out', stagger: .04, overwrite: true});
  }

  // Pad the track so the first and last posters can sit under the centred playhead.
  let clipCenters = [];
  function measureReel() {
    if (!track || !reelClips.length) return;
    const W = viewport.clientWidth;
    track.style.paddingLeft = `${W / 2 - reelClips[0].offsetWidth / 2}px`;
    track.style.paddingRight = `${W / 2 - reelClips.at(-1).offsetWidth / 2}px`;
    clipCenters = reelClips.map(c => c.offsetLeft + c.offsetWidth / 2);
  }
  const nearestClip = x => clipCenters.reduce((best, c, i) => Math.abs(c - x) < Math.abs(clipCenters[best] - x) ? i : best, 0);
  let seekReel = i => {
    if (!reelClips[i]) return;
    viewport.scrollTo({left: clipCenters[i] - viewport.clientWidth / 2, behavior: reducedMotion ? 'instant' : 'smooth'});
  };
  $('#reel-prev')?.addEventListener('click', () => seekReel(activeIndex - 1));
  $('#reel-next')?.addEventListener('click', () => seekReel(activeIndex + 1));

  // Phones, short screens and reduced motion: a native swipeable strip.
  function nativeReel() {
    if (!viewport) return () => {};
    measureReel();
    const onScroll = () => setActive(nearestClip(viewport.scrollLeft + viewport.clientWidth / 2));
    const onResize = () => { measureReel(); onScroll(); };
    viewport.addEventListener('scroll', onScroll, {passive: true});
    addEventListener('resize', onResize);
    onScroll();
    return () => {
      viewport.removeEventListener('scroll', onScroll);
      removeEventListener('resize', onResize);
    };
  }
  $('#reel-open')?.addEventListener('click', e => openDetail(chrono[activeIndex], e.currentTarget));

  /* ---------- Complete filmography: list + poster preview ---------- */
  const list = $('#archive-list');
  const preview = $('.archive-preview');
  const browser = $('.archive-browser');
  if (list) list.innerHTML = films.map(f => `<button class="archive-row" type="button" data-film="${f.id}" data-roles="${esc(f.roles.join(' '))}" aria-pressed="false">
      <span class="year mono">${esc(f.year)}</span>
      <span class="title-wrap"><span class="title">${esc(f.title)}</span>${f.languageVersions ? `<span class="title-variants">${esc(f.languageVersions)}</span>` : ''}</span>
      <span class="roles mono">${esc(f.roles.join(' · '))}</span>
      <span class="arrow" aria-hidden="true">↗</span>
    </button>`).join('');
  const rows = $$('.archive-row');

  let previewId = null;
  function showPreview(id, animate) {
    const f = findFilm(id);
    if (!f || !preview) return;
    previewId = id;
    const art = $('.archive-preview-art', preview);
    const [w, h] = posterSize(f.poster);
    art.innerHTML = f.poster ? `<img ${imageAttrs(f.poster, '(max-width: 760px) 92vw, 32vw')} alt="${esc(f.title)} poster" width="${w}" height="${h}" loading="lazy" decoding="async">` : slate(f);
    const media = art.firstElementChild;
    $('.archive-preview-meta', preview).textContent = `${f.year} / ${f.roles.join(' · ')}`;
    $('h3', preview).textContent = f.title;
    $('.archive-preview-note', preview).textContent = f.versionEditing || '';
    $('.archive-preview-languages', preview).textContent = f.languageVersions || '';
    $('.archive-preview-description', preview).textContent = f.description || '';
    rows.forEach(r => r.setAttribute('aria-pressed', String(r.dataset.film === id)));
    if (animate && motion) {
      gsap.fromTo(media, {clipPath: 'inset(0% 0% 100% 0%)', scale: 1.08}, {clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: .9, ease: 'expo.out', overwrite: true});
      gsap.fromTo($$('.archive-preview-copy > *', preview), {y: 14, autoAlpha: 0}, {y: 0, autoAlpha: 1, duration: .6, ease: 'power3.out', stagger: .04, overwrite: true});
    }
  }

  // On a phone the preview opens directly under the chosen row.
  function placePreview(row) {
    if (!preview || !browser) return;
    if (narrow.matches && row) row.after(preview);
    else if (!narrow.matches && preview.parentElement !== browser) browser.append(preview);
  }
  narrow.addEventListener('change', () => {
    placePreview(rows.find(r => r.dataset.film === previewId && !r.hidden));
    refresh();
  });

  function applyFilter(filter, animate) {
    let count = 0;
    rows.forEach(r => {
      const show = filter === 'all' || r.dataset.roles.includes(filter);
      r.hidden = !show;
      if (show) count++;
    });
    $('#count').textContent = pad(count);
    if ($('#filter-status')) $('#filter-status').textContent = `${count} films shown${filter === 'all' ? '' : ' for ' + filter}`;
    const selectedRow = rows.find(r => r.dataset.film === previewId && !r.hidden);
    const nextRow = selectedRow || rows.find(r => !r.hidden);
    preview.hidden = !nextRow;
    if (nextRow) {
      if (!selectedRow) showPreview(nextRow.dataset.film, false);
      placePreview(nextRow);
    }
    if (animate && motion) gsap.fromTo(rows.filter(r => !r.hidden), {autoAlpha: 0, y: 16}, {autoAlpha: 1, y: 0, duration: .5, ease: 'power3.out', stagger: .03, overwrite: true});
    if (animate) refresh();
  }
  $$('[data-filter]').forEach(b => b.addEventListener('click', () => {
    $$('[data-filter]').forEach(x => {
      x.classList.toggle('active', x === b);
      x.setAttribute('aria-pressed', String(x === b));
    });
    applyFilter(b.dataset.filter, true);
  }));

  const defaultFilm = findFilm('vichithram') || films[0];
  if (defaultFilm) showPreview(defaultFilm.id, false);
  applyFilter('all', false);

  /* ---------- Commercials and music videos: shared click-to-play players ---------- */
  const commercials = typeof TV_COMMERCIALS !== 'undefined' ? TV_COMMERCIALS : [];
  const musicVideos = typeof MUSIC_VIDEOS !== 'undefined' ? MUSIC_VIDEOS : [];
  const trailers = typeof TRAILER_CUTS !== 'undefined' ? TRAILER_CUTS : [];
  const spots = [...commercials, ...musicVideos, ...trailers];
  // Accepts YouTube (watch / youtu.be / shorts / embed), Vimeo (incl. unlisted hash) or a direct video file.
  const parseVideo = url => {
    const u = String(url || '').trim();
    let m;
    if ((m = u.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/))) return {type: 'youtube', id: m[1], thumb: `https://i.ytimg.com/vi/${m[1]}/maxresdefault.jpg`, fallback: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`};
    if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([\da-f]+))?/))) return {type: 'vimeo', id: m[1], hash: m[2]};
    if (/\.(mp4|webm|mov)(\?|#|$)/i.test(u)) return {type: 'file', src: u};
    return null;
  };
  const tvcGrid = $('#tvc-grid');
  const renderSpots = (collection, offset = 0, category = 'TV commercial') => collection.map((c, localIndex) => {
    const i = offset + localIndex;
    const v = parseVideo(c.video);
    const poster = c.poster || v?.thumb || '';
    const title = c.title || 'Title to come';
    const tag = `<span class="spot-tag mono">${pad(localIndex + 1)} / ${pad(collection.length)}</span>`;
    const fallback = !c.poster && v?.fallback ? ` data-fallback="${v.fallback}"` : '';
    const art = poster ? `<img class="spot-poster" src="${esc(poster)}" alt="" loading="lazy" decoding="async"${fallback}>` : '<span class="spot-placeholder" aria-hidden="true"></span>';
    const face = v
      ? `<button class="spot-play" type="button" data-spot="${i}" data-cursor="Play" aria-label="Play ${esc(title)}">${art}${tag}<span class="spot-btn" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.2v13.6L19 12z" fill="currentColor"/></svg></span></button>`
      : `<div class="spot-play is-empty">${art}${tag}<span class="spot-empty mono">Video link to come</span></div>`;
    return `<article class="spot" data-index="${i}">
      <div class="spot-player">${face}</div>
      <div class="spot-info">
        <span class="spot-meta mono">${esc([c.year, c.duration, c.language].filter(Boolean).join(' · ') || category)}</span>
        <h3 class="spot-title">${esc(title)}</h3>
        ${c.role ? `<span class="spot-role mono">${esc(c.role)}</span>` : ''}
        ${c.note ? `<span class="spot-note mono">${esc(c.note)}</span>` : ''}
        ${c.description ? `<p class="spot-desc">${esc(c.description)}</p>` : ''}      </div>
    </article>`;
  }).join('');
  if (tvcGrid) tvcGrid.innerHTML = renderSpots(commercials);
  const musicGrid = $('#music-grid');
  if (musicGrid) musicGrid.innerHTML = renderSpots(musicVideos, commercials.length, 'Music video');
  const trailerGrid = $('#trailer-grid');
  if (trailerGrid) trailerGrid.innerHTML = renderSpots(trailers, commercials.length + musicVideos.length, 'Trailer');

  // YouTube answers a missing HD thumbnail with a 120px grey placeholder rather than an error,
  // so fall back to the standard thumbnail in either case.
  $$('.spot-poster[data-fallback]').forEach(img => {
    const swap = () => { if (img.dataset.fallback) { img.src = img.dataset.fallback; delete img.dataset.fallback; } };
    img.addEventListener('error', swap);
    img.addEventListener('load', () => { if (img.naturalWidth < 200) swap(); });
    if (img.complete && img.naturalWidth && img.naturalWidth < 200) swap();
  });

  // Embeds load only on play; commercials, music videos and trailers share one active player.
  let playing = null;
  function stopSpot() {
    if (!playing) return;
    playing.frame.remove();
    playing.face.hidden = false;
    playing = null;
    inView.forEach(startLoop);
  }
  function playSpot(i) {
    const c = spots[i], v = parseVideo(c?.video);
    const face = $(`.spot[data-index="${i}"] .spot-play`);
    if (!v || !face) return;
    stopSpot();
    [...loops.keys()].forEach(endLoop);
    $$('video.screen-media').forEach(v => v.pause());
    let frame;
    if (v.type === 'file') {
      frame = Object.assign(document.createElement('video'), {src: v.src, controls: true, autoplay: true, playsInline: true});
      if (c.poster) frame.poster = c.poster;
    } else {
      frame = document.createElement('iframe');
      frame.src = v.type === 'youtube'
        ? `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
        : `https://player.vimeo.com/video/${v.id}?autoplay=1&title=0&byline=0&portrait=0${v.hash ? `&h=${v.hash}` : ''}`;
      frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      frame.allowFullscreen = true;
      frame.title = c.title || 'TV commercial';
    }
    frame.className = 'spot-frame';
    face.hidden = true;
    face.parentElement.append(frame);
    playing = {frame, face};
    hideCursor();
    frame.focus?.();
  }
  document.addEventListener('click', e => {
    const play = e.target.closest('.spot-play[data-spot]');
    if (play) playSpot(+play.dataset.spot);
  });

  // Music videos loop silently in their cards while on screen (not for reduced motion or Data Saver).
  // A loop shows only once YouTube reports it playing, so its title overlay stays under the poster,
  // and returns to its loopStart when it ends; the loops stop while a video plays with sound.
  const loops = new Map(), inView = new Set();
  function endLoop(card) {
    loops.get(card)?.remove();
    loops.delete(card);
  }
  function startLoop(card) {
    const c = spots[+card.dataset.index], v = parseVideo(c?.video);
    if (playing || loops.has(card) || v?.type !== 'youtube') return;
    const frame = Object.assign(document.createElement('iframe'), {className: 'spot-loop', tabIndex: -1, title: ''});
    frame.dataset.start = c.loopStart || 0;
    frame.src = `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&mute=1&start=${frame.dataset.start}&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1`;
    frame.allow = 'autoplay; encrypted-media';
    frame.setAttribute('aria-hidden', 'true');
    frame.addEventListener('load', () => frame.contentWindow?.postMessage(JSON.stringify({event: 'listening', id: card.dataset.index, channel: 'widget'}), '*'));
    $('.spot-player', card).append(frame);
    loops.set(card, frame);
  }
  addEventListener('message', e => {
    if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin)) return;
    const frame = [...loops.values()].find(f => f.contentWindow === e.source);
    let d;
    try { d = JSON.parse(e.data); } catch { return; }
    const state = d.event === 'onStateChange' ? d.info : d.info?.playerState;
    if (!frame || state == null) return;
    if (state === 1) frame.classList.add('is-live');
    if (state === 0) {
      const send = (func, args = []) => frame.contentWindow?.postMessage(JSON.stringify({event: 'command', func, args}), '*');
      send('seekTo', [+frame.dataset.start, true]);
      send('playVideo');
    }
  });
  if (musicGrid && !reducedMotion && !navigator.connection?.saveData && 'IntersectionObserver' in window) {
    const loopWatch = new IntersectionObserver(entries => entries.forEach(({target, isIntersecting}) => {
      if (isIntersecting) { inView.add(target); startLoop(target); }
      else { inView.delete(target); endLoop(target); }
    }), {rootMargin: '10% 0px'});
    $$('.spot', musicGrid).forEach(card => loopWatch.observe(card));
  }

  /* ---------- AI filmmaking: films on a phone and on cinema screens ---------- */
  const aiFilms = typeof AI_FILMS !== 'undefined' ? AI_FILMS : [];
  const screensEl = $('#ai-screens');
  if (screensEl && aiFilms.length) {
    const playIcon = '<span class="screen-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.2v13.6L19 12z" fill="currentColor"/></svg></span>';
    const screen = (f, i) => `<div class="screen-col${f.format === '9:16' ? ' is-phone' : ' is-cinema'}">
        <div class="${f.format === '9:16' ? 'phone' : 'cinema'}">
          <button class="screen" type="button" data-ai="${f.id}" data-cursor="Play" aria-label="Watch ${esc(f.title)} with sound">
            ${f.loop
              ? `<video class="screen-media" muted loop playsinline preload="none" poster="${esc(optimizedPoster(f.poster))}" data-src="${esc(f.loop)}"></video>`
              : `<img class="screen-media" ${imageAttrs(f.poster, '(max-width: 760px) 92vw, 48vw')} alt="" loading="lazy" decoding="async">`}
            ${playIcon}
          </button>
        </div>
        <div class="screen-info">
          <span class="mono">${pad(i + 1)}</span>
          <h3>${esc(f.title)}</h3>
          <button class="pill" type="button" data-ai="${f.id}">Watch <span aria-hidden="true">↗</span></button>
          <span class="mono screen-meta">${esc([f.type, f.format, f.duration].filter(Boolean).join(' · '))}</span>
          ${f.credit ? `<p class="screen-credit">${esc(f.credit)}</p>` : ''}
          ${f.role ? `<span class="mono screen-role">${esc(f.role)}</span>` : ''}
        </div>
      </div>`;
    const phones = aiFilms.filter(f => f.format === '9:16'), wides = aiFilms.filter(f => f.format !== '9:16');
    screensEl.insertAdjacentHTML('beforeend', `<div class="screens-stage${phones.length ? '' : ' no-phone'}">${[...phones, ...wides].map((f) => screen(f, aiFilms.indexOf(f))).join('')}</div>`);

    // Silent loops play only while on screen (and not at all for reduced motion).
    $$('video.screen-media', screensEl).forEach(v => {
      v.muted = true;
      if (reducedMotion || navigator.connection?.saveData || !('IntersectionObserver' in window)) { v.preload = 'none'; return; }
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) {
          if (!v.src) v.src = v.dataset.src;
          if (!playing && !$('#vbox')?.open) v.play().catch(() => {});
        } else v.pause();
      }, {rootMargin: '15% 0px'}).observe(v);
    });
  }

  // Full film with sound: own files in a <video>, YouTube films in a privacy-enhanced embed.
  const vbox = $('#vbox');
  const vboxVideo = vbox && $('video', vbox), vboxFrame = vbox && $('iframe', vbox);
  let vboxOpener = null;
  function openFilm(id, from) {
    const f = aiFilms.find(x => x.id === id);
    if (!f || !vbox) return;
    vboxOpener = from || null;
    stopSpot();
    $$('video.screen-media').forEach(v => v.pause());
    vboxVideo.hidden = !!f.youtube;
    vboxFrame.hidden = !f.youtube;
    vbox.classList.toggle('is-vertical', f.format === '9:16');
    vboxFrame.title = f.title;
    vboxVideo.setAttribute('aria-label', f.title);
    if (f.youtube) vboxFrame.src = `https://www.youtube-nocookie.com/embed/${f.youtube}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    else Object.assign(vboxVideo, {src: f.full, poster: f.poster});
    vbox.showModal();
    lock(true);
    hideCursor();
    if (!f.youtube) vboxVideo.play().catch(() => {});
  }
  if (vbox) {
    $('.vbox-close', vbox).addEventListener('click', () => vbox.close());
    vbox.addEventListener('click', e => { if (e.target === vbox) vbox.close(); });
    vbox.addEventListener('close', () => {
      vboxVideo.pause();
      vboxVideo.removeAttribute('src');
      vboxVideo.load();
      vboxFrame.removeAttribute('src');
      lock(false);
      vboxOpener?.focus({preventScroll: true});
    });
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-ai]');
    if (t) openFilm(t.dataset.ai, t);
  });

  /* ---------- Detail dialog ---------- */
  const dialog = $('#detail');
  const detailContent = $('#detail-content');
  const panel = $('.detail-panel');
  let opener = null;
  let closing = false;

  function openDetail(f, from) {
    if (!f || !dialog) return;
    stopSpot();
    $$('video.screen-media').forEach(v => v.pause());
    opener = from || null;
    const img = f.poster || f.image;
    const art = img ? `<div class="detail-poster"><img ${imageAttrs(img, '(max-width: 900px) 92vw, 600px')} alt="${esc(f.title)}" decoding="async"></div>` : f.roles ? `<div class="detail-poster">${slate(f)}</div>` : '';
    const facts = [
      ['Role', f.roles ? f.roles.join(' / ') : f.role], ['Version editing', f.versionEditing], ['Language versions', f.languageVersions],
      ['Director', f.director], ['Cast', f.cast], ['Production', f.production || f.client], ['Film awards', f.award]
    ].filter(x => x[1]);
    detailContent.innerHTML = `${art}
      <div class="detail-copy"><span class="mono">${esc(f.year)} / ${esc([f.badge && /short|music/i.test(f.badge) ? f.badge : '', f.language].filter(Boolean).join(' · ') || f.badge)}</span><h2 id="detail-title">${esc(f.title)}</h2><p>${esc(f.description)}</p><dl>${facts.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl><button class="text-link project-share" type="button" data-share="${esc(f.id)}">Copy project link ↗</button><span class="share-status sr-only" role="status"></span></div>`;
    detailContent.classList.toggle('without-poster', !art);
    const pic = $('.detail-poster img', detailContent);
    pic?.addEventListener('error', () => {
      pic.parentElement.replaceWith(Object.assign(document.createElement('p'), {className: 'image-unavailable', textContent: 'Poster unavailable.'}));
    }, {toggleActions: 'play none none none'});
    dialog.showModal();
    lock(true);
    if (motion) {
      hideCursor();
      gsap.fromTo(panel, {autoAlpha: 0, y: 40}, {autoAlpha: 1, y: 0, duration: .7, ease: 'expo.out'});
      const artEl = $('.detail-poster > *', detailContent);
      if (artEl) gsap.fromTo(artEl, {clipPath: 'inset(100% 0% 0% 0%)'}, {clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut', delay: .1});
      gsap.fromTo($$('.detail-copy > *', detailContent), {y: 24, autoAlpha: 0}, {y: 0, autoAlpha: 1, duration: .8, ease: 'power3.out', stagger: .06, delay: .15});
    }
  }
  function closeDetail() {
    if (!dialog.open || closing) return;
    if (!motion) return dialog.close();
    closing = true;
    gsap.to(panel, {autoAlpha: 0, y: 24, duration: .32, ease: 'power2.in', onComplete: () => { closing = false; dialog.close(); }});
  }
  function lock(on) {
    root.classList.toggle('is-locked', on);
    if (lenis) on ? lenis.stop() : lenis.start();
  }
  $('#close')?.addEventListener('click', closeDetail);
  dialog?.addEventListener('cancel', e => { e.preventDefault(); closeDetail(); });
  dialog?.addEventListener('click', e => { if (e.target === dialog) closeDetail(); });
  dialog?.addEventListener('close', () => {
    lock(false);
    if (motion) gsap.set(panel, {clearProps: 'all'});
    opener?.focus({preventScroll: true});
  });

  document.addEventListener('click', e => {
    const share = e.target.closest('[data-share]');
    if (share) {
      const url = new URL(location.href);
      url.searchParams.set('film', share.dataset.share);
      url.hash = 'selected';
      const status = $('.share-status');
      if (!navigator.clipboard) { status.textContent = 'Copy this address: ' + url.href; status.classList.remove('sr-only'); return; }
      navigator.clipboard.writeText(url.href).then(() => {
        share.textContent = 'Link copied ✓'; status.textContent = 'Project link copied';
      }).catch(() => { status.textContent = 'Copy this address: ' + url.href; status.classList.remove('sr-only'); });
      return;
    }
    const row = e.target.closest('.archive-row');
    if (row) {
      showPreview(row.dataset.film, true);
      placePreview(row);
      if (narrow.matches) refresh();
      return;
    }
    const hit = e.target.closest('[data-film]');
    if (hit) { e.preventDefault(); return openDetail(findFilm(hit.dataset.film), hit); }
    const more = e.target.closest('.preview-open');
    if (more) openDetail(findFilm(previewId), more);
  });

  /* ---------- Small live details ---------- */
  const clock = $('#clock');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-GB', {timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit'});
    const tick = () => { clock.textContent = `Kerala ${fmt.format(new Date())} IST`; };
    tick();
    setInterval(tick, 20000);
  }
  // The viewfinder timecode runs while the opening frame is on screen.
  const frameTc = $('#frame-tc');
  if (frameTc && finePointer && !reducedMotion && 'IntersectionObserver' in window) {
    const start = performance.now();
    let raf = 0, last = -1;
    const run = now => {
      const f = Math.floor((now - start) / (1000 / 24));
      if (f !== last) { frameTc.textContent = timecode(f); last = f; }
      raf = requestAnimationFrame(run);
    };
    new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) raf = requestAnimationFrame(run);
    }).observe($('.hero'));
  }

  let hideCursor = () => {};

  if (motion) initMotion();
  else {
    $('.loader')?.remove();
    nativeReel();
  }
  const linkedFilm = findFilm(new URL(location.href).searchParams.get('film'));
  if (linkedFilm) openDetail(linkedFilm, null);

  /* =====================================================================
     Motion
     ===================================================================== */
  function initMotion() {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    root.classList.add('motion');
    ScrollTrigger.config({ignoreMobileResize: true});
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    // Build all triggers from the top before restoring an anchor. Initializing
    // at a restored deep scroll can retire one-time triggers during pin setup.
    scrollTo({top: 0, left: 0, behavior: 'instant'});

    lenis = new Lenis({lerp: .085, smoothWheel: true});
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    // In-page links glide instead of jumping.
    document.addEventListener('click', e => {
      if (e.defaultPrevented) return;
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      const target = id === 'home' || !id ? 0 : document.getElementById(id);
      if (target === null) return;
      e.preventDefault();
      history.pushState(null, '', `#${id || 'home'}`);
      lenis.scrollTo(target, {duration: 1, easing: t => 1 - Math.pow(1 - t, 4), onComplete: () => target && target.focus?.({preventScroll: true})});
    });
    addEventListener('popstate', () => {
      const target = document.getElementById(location.hash.slice(1)) || 0;
      lenis.scrollTo(target, {immediate:true});
    });

    const header = $('.site-header');
    lenis.on('scroll', ({scroll, direction}) => header.classList.toggle('is-hidden', direction > 0 && scroll > innerHeight * 1.2));

    const mm = gsap.matchMedia();

    /* --- Opening: the name rises, the portrait card is revealed and settles into its tilt --- */
    const card = $('.hero-card');
    const cardInner = $('.hero-card-inner');
    const heroImg = $('.hero-card img');
    const heroSplit = SplitText.create('.hero-line', {type: 'chars', charsClass: 'split-char', mask: 'chars'});

    function heroIntro() {
      return gsap.timeline()
        .from(heroSplit.chars, {yPercent: 115, duration: 1.5, ease: 'expo.out', stagger: .035}, 0)
        .fromTo(cardInner, {clipPath: 'inset(100% 0% 0% 0%)'}, {clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut'}, .15)
        .from(cardInner, {rotation: -10, y: 70, duration: 2, ease: 'expo.out'}, .15)
        .from('.frame-ui > *', {autoAlpha: 0, duration: .6, stagger: .06}, 1.1)
        .from(['.hero-meta > *', '.hero-foot > *'], {autoAlpha: 0, y: 18, duration: 1, ease: 'power3.out', stagger: .06}, .8);
    }

    // A gentle depth on the way out: the card lifts and straightens a little, the name lags behind.
    // The photo itself is never scaled.
    gsap.timeline({defaults: {ease: 'none'}, scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true}})
      .to('.hero-name', {yPercent: 16}, 0)
      .to(card, {y: () => -innerHeight * .1, rotation: 3}, 0)
      .to('.hero-foot', {autoAlpha: 0, y: -16, duration: .35}, 0);

    /* --- Film archive reel: vertical scroll drives the timeline under a fixed playhead --- */
    const reelPin = $('.reel-pin');
    mm.add({pinned: '(min-width: 768px) and (min-height: 560px)', native: '(max-width: 767px), (max-height: 559px)'}, ctx => {
      if (ctx.conditions.native) return nativeReel();
      const section = $('#archive');
      section.classList.add('reel--pinned');
      let dist = 0;
      // Keep the whole pinned view on screen: if heading + strip + readout overflow, shrink the posters to fit.
      const fitHeight = () => {
        section.style.removeProperty('--clip-h');
        const media = $('.reel-media', track);
        const pin = getComputedStyle(reelPin);
        const used = $('.reel-head').offsetHeight + $('.reel-stage').offsetHeight + $('.reel-readout').offsetHeight + $('.reel-controls').offsetHeight + parseFloat(pin.paddingTop) + parseFloat(pin.paddingBottom);
        const over = used - innerHeight;
        if (over > 0 && media) section.style.setProperty('--clip-h', `${Math.max(180, media.offsetHeight + 24 - over - 8)}px`);
      };
      const measure = () => { fitHeight(); measureReel(); dist = Math.max(0, track.offsetWidth - viewport.clientWidth); };
      measure();
      const pick = () => setActive(nearestClip(-gsap.getProperty(track, 'x') + viewport.clientWidth / 2));
      const tween = gsap.to(track, {
        x: () => -dist, ease: 'none',
        scrollTrigger: {trigger: reelPin, start: () => reelPin.offsetHeight < innerHeight ? 'center center' : 'top top', end: () => `+=${Math.min(dist * .6, innerHeight * 3)}`, pin: true, scrub: .35, invalidateOnRefresh: true, onRefreshInit: measure, onUpdate: pick, onRefresh: pick}
      });
      seekReel = i => {
        if (!reelClips[i] || !dist) return;
        const st = tween.scrollTrigger;
        const x = clipCenters[i] - viewport.clientWidth / 2;
        lenis.scrollTo(st.start + gsap.utils.clamp(0, 1, x / dist) * (st.end - st.start), {duration: .65});
      };
      pick();
      // Keyboard users tabbing through the posters get each one brought under the playhead.
      const onFocus = e => {
        const clip = e.target.closest('.reel-clip');
        if (!clip || !clip.matches(':focus-visible') || !dist) return;
        const st = tween.scrollTrigger;
        const x = clipCenters[+clip.dataset.index] - viewport.clientWidth / 2;
        lenis.scrollTo(st.start + gsap.utils.clamp(0, 1, x / dist) * (st.end - st.start), {immediate: true});
      };
      viewport.addEventListener('focusin', onFocus);
      return () => {
        seekReel = i => {
          if (reelClips[i]) viewport.scrollTo({left: clipCenters[i] - viewport.clientWidth / 2, behavior: reducedMotion ? 'instant' : 'smooth'});
        };
        viewport.removeEventListener('focusin', onFocus);
        section.classList.remove('reel--pinned');
        section.style.removeProperty('--clip-h');
        gsap.set(track, {clearProps: 'x'});
      };
    });

    /* --- Section furniture --- */
    $$('.selected-card').forEach((card, i) => {
      gsap.from(card, {y: 48, autoAlpha: 0, duration: 1, delay: i * .08, ease: 'power3.out', scrollTrigger: {trigger: '.selected-grid', start: 'top 85%', toggleActions: 'play none none none'}});
    });
    $$('.rule').forEach(r => gsap.fromTo(r, {scaleX: 0}, {scaleX: 1, duration: 1.6, ease: 'expo.inOut', scrollTrigger: {trigger: r.parentElement, start: 'top 90%', toggleActions: 'play none none none'}}));
    $$('.section-top').forEach(t => gsap.from($$(':scope > span', t), {y: 14, autoAlpha: 0, duration: .9, ease: 'power3.out', stagger: .08, scrollTrigger: {trigger: t, start: 'top 90%', toggleActions: 'play none none none'}}));
    $$('[data-split]').forEach(el => {
      // Phones keep the reveal without creating masks around every text line.
      if (narrow.matches) {
        gsap.from(el, {y:16, autoAlpha:0, duration:.7, ease:'power3.out', scrollTrigger:{trigger:el, start:'top 90%', toggleActions: 'play none none none'}});
        return;
      }
      SplitText.create(el, {
      type: 'lines', linesClass: 'split-line', mask: 'lines', autoSplit: true,
      onSplit: self => gsap.from(self.lines, {yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: .09, scrollTrigger: {trigger: el, start: 'top 86%', toggleActions: 'play none none none'}})
      });
    });
    $$('[data-fade]').forEach(el => gsap.from(el, {y: 24, autoAlpha: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: {trigger: el, start: 'top 88%', toggleActions: 'play none none none'}}));

    /* --- Filmography list --- */
    gsap.set(rows, {autoAlpha: 0, y: 24});
    const revealedRows = new WeakSet();
    ScrollTrigger.batch(rows, {start: 'top 94%', onEnter: batch => {
      const fresh = batch.filter(row => !revealedRows.has(row));
      fresh.forEach(row => revealedRows.add(row));
      if (fresh.length) gsap.to(fresh, {autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .05, overwrite: true});
    }});
    gsap.from('.archive-preview', {autoAlpha: 0, y: 40, duration: 1.2, ease: 'expo.out', scrollTrigger: {trigger: '.archive-browser', start: 'top 80%', toggleActions: 'play none none none'}});

    /* --- About: the page turns to paper --- */
    ScrollTrigger.create({trigger: '#about', start: 'top 55%', end: 'bottom 45%', onToggle: s => { document.body.dataset.theme = s.isActive ? 'light' : 'dark'; }});
    gsap.to('.asterisk', {rotate: 360, ease: 'none', scrollTrigger: {trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: true}});
    gsap.from('.disciplines li', {y: 20, autoAlpha: 0, duration: .8, ease: 'power3.out', stagger: .08, scrollTrigger: {trigger: '.disciplines', start: 'top 88%', toggleActions: 'play none none none'}});

    /* --- TV commercials: the count runs up once the brief is in view --- */
    const tvcCount = $('.tvc-count');
    if (tvcCount) {
      const n = {v: 0};
      gsap.to(n, {v: +tvcCount.dataset.count, duration: 2, ease: 'power3.out', scrollTrigger: {trigger: '.tvc-stat', start: 'top 85%', toggleActions: 'play none none none'},
        onStart: () => { tvcCount.textContent = '0'; }, onUpdate: () => { tvcCount.textContent = Math.round(n.v); }});
    }

    gsap.from('.tvc-beats li', {y: 20, autoAlpha: 0, duration: .8, ease: 'power3.out', stagger: .09, scrollTrigger: {trigger: '.tvc-beats', start: 'top 88%', toggleActions: 'play none none none'}});

    /* --- TV commercials: players wipe in --- */
    $$('.spot').forEach((spot, i) => {
      gsap.timeline({scrollTrigger: {trigger: spot, start: 'top 85%', toggleActions: 'play none none none'}})
        .fromTo($('.spot-player', spot), {clipPath: 'inset(0% 0% 100% 0%)'}, {clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', delay: (i % 2) * .12})
        .from($$('.spot-info > *', spot), {y: 18, autoAlpha: 0, duration: .8, ease: 'power3.out', stagger: .06}, .5);
    });

    gsap.from('.ai-process li', {y: 24, autoAlpha: 0, duration: .9, ease: 'power3.out', stagger: .12, scrollTrigger: {trigger: '.ai-process', start: 'top 85%', toggleActions: 'play none none none'}});

    /* --- AI filmmaking: the screens slide in from opposite sides --- */
    if ($('.screens-stage')) {
      const st = {trigger: '.screens-stage', start: 'top 78%', toggleActions: 'play none none none'};
      gsap.from('.screens .phone', {xPercent: -25, rotate: -6, autoAlpha: 0, duration: 1.5, ease: 'expo.out', scrollTrigger: st});
      gsap.from('.screens .cinema', {xPercent: 18, autoAlpha: 0, duration: 1.5, ease: 'expo.out', stagger: .15, scrollTrigger: st});
      gsap.from('.screen-info', {y: 20, autoAlpha: 0, duration: .9, ease: 'power3.out', stagger: .1, delay: .5, scrollTrigger: st});
      gsap.to('.screens-word', {xPercent: -14, ease: 'none', scrollTrigger: {trigger: '.screens', start: 'top bottom', end: 'bottom top', scrub: true}});
    }

    /* --- Contact: the light floods in --- */
    gsap.fromTo('.contact-fill', {clipPath: 'circle(0% at 50% 100%)'}, {clipPath: 'circle(150% at 50% 100%)', ease: 'none', scrollTrigger: {trigger: '#contact', start: 'top bottom', end: 'top 15%', scrub: true}});
    gsap.from('.ct-line > span', {yPercent: 115, duration: 1.4, ease: 'expo.out', stagger: .1, scrollTrigger: {trigger: '.contact-title', start: 'top 80%', toggleActions: 'play none none none'}});
    gsap.from('.contact-orb', {scale: 0, rotate: -90, duration: 1.4, ease: 'expo.out', scrollTrigger: {trigger: '.contact-title', start: 'top 80%', toggleActions: 'play none none none'}});
    gsap.from(['.contact-bottom > *', '#contact footer > *'], {y: 16, autoAlpha: 0, duration: .9, ease: 'power3.out', stagger: .06, scrollTrigger: {trigger: '.contact-bottom', start: 'top 95%', toggleActions: 'play none none none'}});

    /* --- Timeline HUD --- */
    const hud = $('.hud');
    const hudTc = $('#hud-tc');
    const hudReel = $('#hud-reel');
    const hudMarkers = $('#hud-markers');
    // Like an editor's overlay: it shows while you scrub and steps aside when you stop to read.
    let hudIdle;
    lenis.on('scroll', ({scroll, limit}) => {
      hudTc.textContent = timecode(Math.max(0, Math.round(scroll / 2)));
      hud.style.setProperty('--p', limit ? scroll / limit : 0);
      hud.classList.add('is-scrubbing');
      clearTimeout(hudIdle);
      hudIdle = setTimeout(() => hud.classList.remove('is-scrubbing'), 1100);
    });
    const reelTriggers = $$('[data-reel]').map((sec, i) => ScrollTrigger.create({
      trigger: sec, start: 'top 50%', end: 'bottom 50%',
      onToggle: s => { if (s.isActive) hudReel.textContent = `R${pad(i + 1)} — ${sec.dataset.reel}`; }
    }));
    ScrollTrigger.create({trigger: '#contact', start: 'top 70%', onToggle: s => hud.classList.toggle('is-off', s.isActive)});
    ScrollTrigger.addEventListener('refresh', () => {
      const max = ScrollTrigger.maxScroll(window) || 1;
      hudMarkers.innerHTML = reelTriggers.map(t => `<i style="left:${gsap.utils.clamp(0, 100, (t.start + innerHeight * .5) / max * 100)}%"></i>`).join('');
    });

    /* --- Pointer: a "view" lens over the films, magnetic buttons --- */
    if (finePointer) {
      root.classList.add('has-cursor');
      const cursor = $('.cursor');
      const label = $('.cursor-label');
      const xTo = gsap.quickTo(cursor, 'x', {duration: .45, ease: 'power3'});
      const yTo = gsap.quickTo(cursor, 'y', {duration: .45, ease: 'power3'});
      let placed = false, current = null;
      addEventListener('pointermove', e => {
        if (!placed) { gsap.set(cursor, {x: e.clientX, y: e.clientY}); placed = true; }
        xTo(e.clientX);
        yTo(e.clientY);
      }, {passive: true});
      hideCursor = () => {
        current = null;
        gsap.to(cursor, {scale: 0, autoAlpha: 0, duration: .3, ease: 'power3.out', overwrite: 'auto'});
      };
      document.addEventListener('pointerover', e => {
        const t = e.target.closest('[data-cursor]');
        if (t === current) return;
        if (!t) return hideCursor();
        current = t;
        label.textContent = t.dataset.cursor;
        gsap.to(cursor, {scale: 1, autoAlpha: 1, duration: .5, ease: 'expo.out', overwrite: 'auto'});
      });
      $$('[data-magnetic]').forEach(el => {
        const mx = gsap.quickTo(el, 'x', {duration: .9, ease: 'elastic.out(1, .35)'});
        const my = gsap.quickTo(el, 'y', {duration: .9, ease: 'elastic.out(1, .35)'});
        el.addEventListener('pointermove', e => {
          const r = el.getBoundingClientRect();
          mx((e.clientX - r.left - r.width / 2) * .35);
          my((e.clientY - r.top - r.height / 2) * .35);
        });
        el.addEventListener('pointerleave', () => { mx(0); my(0); });
      });
    }

    /* --- Ordering, late layout, and the opening --- */
    ScrollTrigger.sort();
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    addEventListener('load', () => {
      ScrollTrigger.refresh();
      lenis.resize();
      const anchor = document.getElementById(location.hash.slice(1));
      if (anchor) requestAnimationFrame(() => {
        lenis.resize();
        lenis.scrollTo(anchor, {immediate: true, force: true});
        ScrollTrigger.update();
      });
    });

    const loader = $('.loader');
    const hashTarget = location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null;
    if (hashTarget || new URL(location.href).searchParams.has('film') || !loader) {
      loader?.remove();
      heroIntro().progress(1);
      if (hashTarget) (document.fonts?.ready || Promise.resolve()).then(() => {
        ScrollTrigger.refresh();
        lenis.resize();
        lenis.scrollTo(hashTarget, {immediate: true, force: true});
        ScrollTrigger.update();
        // A direct section link should show its content immediately, including
        // on reload when the browser restores a position past reveal triggers.
        ScrollTrigger.getAll().forEach(trigger => {
          if (trigger.vars.toggleActions === 'play none none none' && hashTarget.contains(trigger.trigger)) trigger.animation?.progress(1);
        });
      });
      return;
    }

    let seenOpening = false;
    try { seenOpening = sessionStorage.getItem('achu-opening-seen') === 'true'; sessionStorage.setItem('achu-opening-seen', 'true'); } catch {}
    if (seenOpening) { loader?.remove(); heroIntro(); return; }
    scrollTo(0, 0);
    lenis.stop();
    (async () => {
      const tc = $('.loader-tc');
      const count = {f: 0};
      const ready = Promise.race([Promise.all([document.fonts?.ready, imgReady(heroImg)]), wait(1200)]);
      await gsap.timeline()
        .from('.loader-inner > *', {autoAlpha: 0, y: 12, duration: .3, ease: 'power3.out', stagger: .03})
        .to(count, {f: 23, duration: .65, ease: 'power2.inOut', onUpdate: () => { tc.textContent = timecode(Math.round(count.f)); }}, .05)
        .to('.loader-line i', {scaleX: 1, duration: .65, ease: 'power2.inOut'}, .05);
      await ready;
      gsap.timeline({onComplete: () => loader.remove()})
        .to('.loader-inner', {autoAlpha: 0, y: -16, duration: .2, ease: 'power2.in'})
        .to('.loader-panel--top', {yPercent: -100, duration: .65, ease: 'expo.inOut'}, '-=.05')
        .to('.loader-panel--bottom', {yPercent: 100, duration: .65, ease: 'expo.inOut'}, '<')
        .add(heroIntro(), '<.2')
        .call(() => { if (!dialog?.open && !vbox?.open) lenis.start(); }, null, .7);
    })();
  }
})();
