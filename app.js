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
    img.addEventListener('load', r, {once: true});
    img.addEventListener('error', r, {once: true});
  });
  // 24 fps timecode, HH:MM:SS:FF.
  const timecode = frames => {
    const s = Math.floor(frames / 24);
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(frames % 24)}`;
  };

  const root = document.documentElement;
  // Theme is a visitor choice only. Restore before paint in the head, then
  // update the accessible control here; scrolling never changes this setting.
  const themeToggle = $('.theme-toggle');
  function applyTheme(theme) {
    const isDay = theme === 'light';
    root.dataset.theme = isDay ? 'light' : 'dark';
    $('meta[name="theme-color"]').content = isDay ? '#e9e5dc' : '#0b0b0a';
    if (themeToggle) {
      const label = isDay ? 'Switch to night theme' : 'Switch to day theme';
      themeToggle.setAttribute('aria-label', label);
      themeToggle.title = label;
      $('.theme-toggle-label', themeToggle).textContent = isDay ? 'Night' : 'Day';
    }
  }
  applyTheme(root.dataset.theme);
  if (themeToggle) {
    themeToggle.hidden = false;
    themeToggle.addEventListener('click', () => {
      const theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      applyTheme(theme);
      try { localStorage.setItem('achu-theme', theme); } catch {}
    });
  }
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
  // Shared timing keeps text, surfaces and overlays moving with the same weight.
  const MOTION = {ease: 'power3.out', reveal: .9, overlay: .55, stagger: .065};
  // Re-entering from either direction replays the entrance. Complete offscreen
  // instead of hiding at a mid-viewport threshold, so small scroll reversals
  // cannot blink content or restart a counter that is still being read.
  const replayOnScroll = trigger => ({
    trigger, start: 'top bottom', end: 'bottom top',
    toggleActions: 'restart complete restart complete'
  });
  // A reversible portrait reveal followed by free-flight intervals between
  // measured title landings. Pointer attraction is layered on in the ticker.
  function logoFlightPose(scroll, limit, g, velocity = 0) {
    const clamp = v => Math.max(0, Math.min(1, v));
    const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
    const mix = (a, b, t) => a + (b - a) * t;
    const s = Math.max(0, Math.min(scroll, limit));
    const point = (node, at) => ({x: node.x, y: node.fixed ? node.y : node.y - at + Math.max(0, Math.min(at - (node.pinStart || 0), (node.pinEnd || 0) - (node.pinStart || 0)))});
    const momentum = Math.max(-16, Math.min(16, velocity * .5));
    const base = {rotationX: 0, rotationY: 0, rotationZ: 0, energy: Math.min(1, Math.abs(velocity) / 35),
      phase: 'chapter', reveal: 1, active: -1, attraction: 0, freedom: .15, opacity: 1, photoOpacity: 0, docked: false};
    const launchEnd = g.heroEnd || g.height * 1.35;
    const heroScale = g.sourceSize / g.size;
    if (s <= launchEnd) {
      const p = clamp(s / launchEnd);
      const reveal = smooth((p - .06) / .72);
      const beauty = smooth((p - .58) / .3);
      return {...base, phase: 'reveal', reveal, x: g.sourceX, y: g.sourceY,
        scale: heroScale * (1 + beauty * .08), opacity: smooth(p / .06),
        photoOpacity: 1 - smooth(p / .08), freedom: beauty * .4,
        rotationX: Math.sin(beauty * Math.PI) * -10,
        rotationY: Math.sin(beauty * Math.PI) * -34,
        rotationZ: Math.sin(beauty * Math.PI) * -3, attraction: 0};
    }
    if (s >= limit) return {...base, phase: 'footer', x: g.dockX, y: g.dockY - s, scale: g.dockSize / g.size, freedom: 0, docked: true};
    const nodes = g.nodes.map((node, index) => ({...node, index, stopScale: 1,
      enter: Math.max(launchEnd + 1, node.y - g.height * .64),
      leave: node.y + Math.max(0, (node.pinEnd || 0) - (node.pinStart || 0)) - g.height * .29
    })).filter(node => node.enter < limit - 1);
    nodes.push({x: g.dockX, y: g.dockY, enter: limit, leave: limit, index: -1, stopScale: g.dockSize / g.size});
    nodes.forEach((node, index) => { node.leave = Math.max(node.enter, Math.min(node.leave, (nodes[index + 1]?.enter ?? limit) - g.height * .12)); });
    let previous = {x: g.sourceX, y: g.sourceY, fixed: true, leave: launchEnd, index: -1, stopScale: heroScale * 1.08};
    for (const node of nodes) {
      if (s >= node.enter && s <= node.leave) {
        return {...base, ...point(node, s), scale: node.stopScale, active: node.index};
      }
      if (s < node.enter) {
        const t = clamp((s - previous.leave) / Math.max(1, node.enter - previous.leave));
        const a = point(previous, previous.leave), b = point(node, node.enter);
        // Irrational phase spacing gives every journey its own screen-space
        // composition. Smooth endpoint envelopes make docking and reversal exact.
        const angle = (node.index + 2) * 2.399963;
        const roamX = g.width * (.5 + Math.sin(angle) * .32);
        const roamY = g.height * (.47 + Math.cos(angle * 1.37) * .17);
        const u = smooth(t), envelope = Math.sin(t * Math.PI) ** 2;
        const x = mix(a.x, b.x, u) + (roamX - mix(a.x, b.x, .5)) * envelope;
        const y = mix(a.y, b.y, t) + (roamY - mix(a.y, b.y, .5)) * envelope;
        return {...base, phase: 'transit', x, y,
          scale: mix(previous.stopScale, node.stopScale, u) * (1 - envelope * .16),
          attraction: envelope, freedom: .15 + envelope * .85,
          rotationX: Math.sin(t * Math.PI * 2) * 12 + momentum * -.25 * envelope,
          rotationY: Math.sin(angle) * envelope * 30 + momentum * .65 * envelope,
          rotationZ: Math.cos(angle) * envelope * 9 + momentum * .2 * envelope};
      }
      previous = node;
    }
    return {...base, x: g.dockX, y: g.dockY - s, scale: 1};
  }
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
    if (motion) gsap.fromTo([title, meta, desc], {y: 6, autoAlpha: .65}, {y: 0, autoAlpha: 1, duration: .32, ease: MOTION.ease, stagger: .025, overwrite: true});
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
      gsap.fromTo(media, {autoAlpha: 0, scale: 1.025}, {autoAlpha: 1, scale: 1, duration: MOTION.overlay, ease: MOTION.ease, overwrite: true});
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

  /* ---------- Video cards: muted autoplay previews and full playback with sound ---------- */
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
      ? `<button class="spot-play" type="button" data-spot="${i}" data-cursor="Sound" aria-label="Watch ${esc(title)} with sound">${art}${tag}<span class="spot-btn" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.2v13.6L19 12z" fill="currentColor"/></svg></span></button>`
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

  // Full playback with sound is exclusive; visible cards otherwise loop silently.
  let playing = null;
  function stopSpot() {
    if (!playing) return;
    soundWatch?.unobserve(playing.face.parentElement);
    playing.frame.remove();
    playing.face.hidden = false;
    playing = null;
    syncPreviews();
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
        ? `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1&start=${Number(c.start) || 0}`
        : `https://player.vimeo.com/video/${v.id}?autoplay=1&title=0&byline=0&portrait=0${v.hash ? `&h=${v.hash}` : ''}`;
      frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      frame.allowFullscreen = true;
      frame.title = c.title || 'TV commercial';
    }
    frame.className = 'spot-frame';
    face.hidden = true;
    face.parentElement.append(frame);
    playing = {frame, face};
    soundWatch?.observe(face.parentElement);
    hideCursor();
    frame.focus?.();
  }
  document.addEventListener('click', e => {
    const play = e.target.closest('.spot-play[data-spot]');
    if (play) playSpot(+play.dataset.spot);
  });

  // Commercials, music videos and trailers loop silently while on screen.
  // A loop shows only once YouTube reports it playing, so its title overlay stays under the poster,
  // and returns to its loopStart when it ends; the loops stop while a video plays with sound.
  const loops = new Map(), inView = new Set(), screensInView = new Set();
  // Use YouTube's ready/state events rather than a single postMessage sent
  // before its player is listening. Load the API once, on the first visible card.
  let youtubeReady;
  function loadYouTube() {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (youtubeReady) return youtubeReady;
    youtubeReady = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      const timeout = setTimeout(() => reject(new Error('YouTube player API timed out')), 20000);
      window.onYouTubeIframeAPIReady = () => {
        clearTimeout(timeout);
        previous?.();
        resolve(window.YT);
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => { clearTimeout(timeout); reject(new Error('YouTube player API unavailable')); };
      document.head.append(script);
    });
    return youtubeReady;
  }
  const soundWatch = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      if (!isIntersecting && playing?.face.parentElement === target) stopSpot();
    });
  }) : null;
  const previewsAllowed = () => !reducedMotion && !navigator.connection?.saveData && !document.hidden && !root.classList.contains('is-locked') && !playing;
  function syncPreviews() {
    if (previewsAllowed()) inView.forEach(startLoop);
    else [...loops.keys()].forEach(endLoop);
    screensInView.forEach(video => {
      if (previewsAllowed()) video.play().catch(() => {});
      else video.pause();
    });
  }
  document.addEventListener('visibilitychange', syncPreviews);
  document.addEventListener('portfolio:overlay', syncPreviews);
  // A user gesture also retries previews that the browser initially blocked.
  document.addEventListener('pointerdown', syncPreviews, {passive: true});
  document.addEventListener('keydown', syncPreviews);
  function endLoop(card) {
    const entry = loops.get(card);
    loops.delete(card);
    if (!entry) return;
    entry.player?.destroy();
    entry.frame.remove();
  }
  function startLoop(card) {
    const c = spots[+card.dataset.index], v = parseVideo(c?.video);
    if (!previewsAllowed() || v?.type !== 'youtube') return;
    const existing = loops.get(card);
    if (existing) {
      if (existing.ready) { existing.player.mute(); existing.player.playVideo(); }
      return;
    }
    const frame = Object.assign(document.createElement('iframe'), {className: 'spot-loop', tabIndex: -1, title: ''});
    frame.dataset.start = c.loopStart || 0;
    const origin = /^https?:$/.test(location.protocol) ? `&origin=${encodeURIComponent(location.origin)}` : '';
    frame.src = `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&mute=1&loop=1&playlist=${v.id}&start=${frame.dataset.start}&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1${origin}`;
    frame.allow = 'autoplay; encrypted-media';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.setAttribute('aria-hidden', 'true');
    const entry = {frame, player: null, ready: false};
    loops.set(card, entry);
    $('.spot-player', card).append(frame);
    loadYouTube().then(YT => {
      if (loops.get(card) !== entry) return;
      entry.player = new YT.Player(frame, {events: {
        onReady: event => {
          if (loops.get(card) !== entry) return;
          entry.ready = true;
          event.target.mute();
          if (previewsAllowed() && inView.has(card)) event.target.playVideo();
        },
        onStateChange: event => {
          if (loops.get(card) !== entry) return;
          if (event.data === YT.PlayerState.PLAYING) frame.classList.add('is-live');
          if (event.data === YT.PlayerState.ENDED && previewsAllowed() && inView.has(card)) {
            event.target.seekTo(Number(frame.dataset.start), true);
            event.target.playVideo();
          }
        },
        onError: () => { frame.classList.remove('is-live'); }
      }});
    }).catch(() => {
      // A blocked provider retains the clickable poster instead of a blank card.
      if (loops.get(card) === entry) endLoop(card);
    });
  }
  if (!reducedMotion && !navigator.connection?.saveData && 'IntersectionObserver' in window) {
    const loopWatch = new IntersectionObserver(entries => entries.forEach(({target, isIntersecting}) => {
      const card = target.closest('.spot');
      if (isIntersecting) { inView.add(card); startLoop(card); }
      else { inView.delete(card); endLoop(card); }
    }), {threshold: .05});
    $$('.spot-player').forEach(player => loopWatch.observe(player));
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
          screensInView.add(v);
          if (previewsAllowed()) v.play().catch(() => {});
        } else { screensInView.delete(v); v.pause(); }
      }, {threshold: .05}).observe(v);
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
    vbox.classList.remove('is-closing');
    lock(true);
    hideCursor();
    if (motion) gsap.fromTo([f.youtube ? vboxFrame : vboxVideo, $('.vbox-close', vbox)], {autoAlpha: 0, y: 16, scale: .985}, {autoAlpha: 1, y: 0, scale: 1, duration: MOTION.overlay, ease: MOTION.ease, overwrite: true});
    if (!f.youtube) vboxVideo.play().catch(() => {});
  }
  function closeFilm() {
    if (!vbox?.open || vbox.classList.contains('is-closing')) return;
    if (!motion) return vbox.close();
    vbox.classList.add('is-closing');
    vboxVideo.pause();
    gsap.to([vboxVideo, vboxFrame, $('.vbox-close', vbox)], {autoAlpha: 0, y: 10, scale: .99, duration: .24, ease: 'power2.in', overwrite: true, onComplete: () => vbox.close()});
  }
  if (vbox) {
    $('.vbox-close', vbox).addEventListener('click', closeFilm);
    vbox.addEventListener('cancel', e => { e.preventDefault(); closeFilm(); });
    vbox.addEventListener('click', e => { if (e.target === vbox) closeFilm(); });
    vbox.addEventListener('close', () => {
      vbox.classList.remove('is-closing');
      if (motion) {
        const targets = [vboxVideo, vboxFrame, $('.vbox-close', vbox)];
        gsap.killTweensOf(targets);
        gsap.set(targets, {clearProps: 'transform,opacity,visibility'});
      }
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
    }, {once: true});
    dialog.showModal();
    closing = false;
    dialog.classList.remove('is-closing');
    lock(true);
    if (motion) {
      hideCursor();
      gsap.fromTo(panel, {autoAlpha: 0, y: 24, scale: .985}, {autoAlpha: 1, y: 0, scale: 1, duration: MOTION.overlay, ease: MOTION.ease, overwrite: true});
      const artEl = $('.detail-poster > *', detailContent);
      if (artEl) gsap.fromTo(artEl, {autoAlpha: 0, y: 12, scale: .98}, {autoAlpha: 1, y: 0, scale: 1, duration: .7, ease: MOTION.ease, delay: .08});
      gsap.fromTo($$('.detail-copy > *', detailContent), {y: 14, autoAlpha: 0}, {y: 0, autoAlpha: 1, duration: .6, ease: MOTION.ease, stagger: .045, delay: .12});
    }
  }
  function closeDetail() {
    if (!dialog.open || closing) return;
    if (!motion) return dialog.close();
    closing = true;
    dialog.classList.add('is-closing');
    gsap.to(panel, {autoAlpha: 0, y: 12, scale: .99, duration: .24, ease: 'power2.in', overwrite: true, onComplete: () => dialog.close()});
  }
  function lock(on) {
    root.classList.toggle('is-locked', on);
    if (lenis) on ? lenis.stop() : lenis.start();
    document.dispatchEvent(new Event('portfolio:overlay'));
  }
  $('#close')?.addEventListener('click', closeDetail);
  dialog?.addEventListener('cancel', e => { e.preventDefault(); closeDetail(); });
  dialog?.addEventListener('click', e => { if (e.target === dialog) closeDetail(); });
  dialog?.addEventListener('close', () => {
    closing = false;
    dialog.classList.remove('is-closing');
    lock(false);
    if (motion) {
      gsap.killTweensOf([panel, ...$$('*', detailContent)]);
      gsap.set(panel, {clearProps: 'all'});
    }
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

  // The scroll layout is immediate; the self-hosted 3D renderer loads lazily.
  // Keep the vector visible until the first successful GPU frame.
  let logoSculpture = null;
  let logoPose = null;
  function mountSignature() {
    const mark = $('.signature-mark');
    if (!mark) return false;
    mark.addEventListener('click', () => {
      if (mark.classList.contains('is-playing') || root.classList.contains('is-locked')) return;
      mark.classList.add('is-playing');
      if (!logoSculpture?.interact()) {
        // A small flourish remains available if WebGL cannot render.
        gsap.timeline().to($('.signature-fallback', mark), {rotation: -12, scale: .94, duration: .25, ease: 'power2.out'})
          .to($('.signature-fallback', mark), {rotation: 0, scale: 1, duration: 1.1, ease: 'elastic.out(1,.5)'});
      }
      gsap.delayedCall(1.8, () => mark.classList.remove('is-playing'));
    });
    import('./vendor/logo-sculpture.js?v=20261102-portrait-flight')
      .then(({createLogoSculpture}) => createLogoSculpture(mark, gsap.ticker))
      .then(controller => {
        logoSculpture = controller;
        if (logoPose) controller.setPose(logoPose);
        mark.dataset.renderer = 'webgl';
      })
      .catch(error => {
        mark.dataset.renderer = 'fallback';
        console.warn('3D logo unavailable; using the vector fallback.', error);
      });
    return true;
  }
  const sculptedSignature = motion && mountSignature();
  if (sculptedSignature) {
    // Reserve a real place beside each heading, before SplitText measures it.
    // The one travelling emblem fills these slots; they are not extra logos.
    $$('main section').forEach(section => {
      const title = $('h2, .contact-title', section);
      if (!title) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'logo-heading' + (title.matches('.contact-title') ? ' logo-heading--contact' : '');
      const anchor = document.createElement('span');
      anchor.className = 'logo-anchor';
      anchor.setAttribute('aria-hidden', 'true');
      title.before(wrapper);
      wrapper.append(anchor, title);
    });
    root.classList.add('logo-chapters');
  }

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

    lenis = new Lenis({lerp: .1, smoothWheel: true});
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
      lenis.scrollTo(target, {duration: 1.15, easing: t => 1 - Math.pow(1 - t, 4), onComplete: () => target && target.focus?.({preventScroll: true})});
    });
    addEventListener('popstate', () => {
      const target = document.getElementById(location.hash.slice(1)) || 0;
      lenis.scrollTo(target, {immediate:true});
    });

    const header = $('.site-header');
    let headerScroll = 0;
    lenis.on('scroll', ({scroll, direction}) => {
      header.classList.toggle('is-scrolled', scroll > 24);
      // Ignore tiny inertial reversals and keep an open or focused menu reachable.
      if (Math.abs(scroll - headerScroll) < 10 && scroll > 24) return;
      header.classList.toggle('is-hidden', direction > 0 && scroll > innerHeight * 1.2 && !workMenu?.open && !header.contains(document.activeElement));
      headerScroll = scroll;
    });

    const mm = gsap.matchMedia();
    const heroHold = sculptedSignature ? ScrollTrigger.create({
      trigger: '.hero', start: 'top top', end: () => `+=${innerHeight * (narrow.matches ? 1.15 : 1.4)}`,
      pin: true, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 10
    }) : null;

    /* --- Opening: the name rises and the portrait settles before its scroll reveal. --- */
    const card = $('.hero-card');
    const cardInner = $('.hero-card-inner');
    const heroImg = $('.hero-card img');
    const heroSplit = SplitText.create('.hero-line', {type: 'chars', charsClass: 'split-char', mask: 'chars'});

    let heroEntrance;
    function heroIntro() {
      // Finish any previous entrance before capturing its natural end values.
      if (heroEntrance) heroEntrance.progress(1).kill();
      heroEntrance = gsap.timeline()
        .from(heroSplit.chars, {yPercent: 105, duration: 1.2, ease: 'power4.out', stagger: .025}, 0)
        .from(cardInner, {autoAlpha: 0, rotation: -4, y: 32, scale: .96, duration: 1.4, ease: MOTION.ease}, .12)
        .from('.frame-ui > *', {autoAlpha: 0, duration: .6, stagger: .04}, .65)
        .from(['.hero-meta > *', '.hero-foot > *'], {autoAlpha: 0, y: 12, duration: .85, ease: MOTION.ease, stagger: .045}, .4);
      return heroEntrance;
    }
    ScrollTrigger.create({trigger: '.hero', start: 'top bottom', end: 'bottom top',
      onLeave: () => heroEntrance?.progress(1), onEnterBack: () => heroIntro()});

    // A gentle depth on the way out: the card lifts and straightens a little, the name lags behind.
    // The photo itself is never scaled.
    if (!sculptedSignature) mm.add('(min-width: 761px) and (pointer: fine)', () => {
      gsap.timeline({defaults: {ease: 'none'}, scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6, invalidateOnRefresh: true}})
        .to('.hero-name', {yPercent: 10}, 0)
        .to(card, {y: () => -innerHeight * .065, rotation: 2}, 0);
    });

    /* --- The emblem visits each heading, then signs off at the footer. --- */
    function initLogoFlight() {
      if (!sculptedSignature) return;
      const flight = $('.signature-flight');
      const visual = $('.signature-visual');
      const source = $('.hero-card');
      const dock = $('.logo-dock');
      if (!dock || !source) return;
      const anchors = $$('.logo-anchor');
      mm.add({compact: '(max-width: 760px)', wide: '(min-width: 761px)', fine: '(hover: hover) and (pointer: fine)'}, context => {
        const compact = context.conditions.compact;
        let geometry, geometryFrame = 0, activeIndex = -1;
        let pointer = {x: innerWidth / 2, y: innerHeight / 2, active: false};
        let attraction = {x: 0, y: 0}, lastTick = 0;
        const setX = gsap.quickSetter(visual, 'x', 'px');
        const setY = gsap.quickSetter(visual, 'y', 'px');
        const setScaleX = gsap.quickSetter(visual, 'scaleX');
        const setScaleY = gsap.quickSetter(visual, 'scaleY');
        const setOpacity = gsap.quickSetter(visual, 'opacity');
        const setFallbackOpacity = gsap.quickSetter($('.signature-fallback'), 'opacity');
        const setSourceOpacity = gsap.quickSetter(source, 'opacity');
        const mark = $('.signature-mark');
        gsap.set(visual, {xPercent: -50, yPercent: -50, opacity: 1, force3D: false});
        logoSculpture?.setVisible(true);
        const render = (time = gsap.ticker.time) => {
          if (!geometry || document.hidden || root.classList.contains('is-locked')) return;
          const dt = Math.min(.05, Math.max(.001, time - lastTick));
          lastTick = time;
          const pose = logoFlightPose(lenis.scroll, lenis.limit, geometry, lenis.velocity || 0);
          // Attraction never exceeds a small fraction of the distance to the
          // pointer. It fades to exactly zero at every deliberate landing.
          const weight = compact ? 0 : pose.attraction;
          const tx = pointer.active ? gsap.utils.clamp(-100, 100, (pointer.x - pose.x) * .19) : 0;
          const ty = pointer.active ? gsap.utils.clamp(-72, 72, (pointer.y - pose.y) * .16) : 0;
          const damping = 1 - Math.exp(-dt * 4.5);
          attraction.x += (tx - attraction.x) * damping;
          attraction.y += (ty - attraction.y) * damping;
          const driftX = Math.sin(time * .63 + lenis.scroll * .0007) * 12;
          const driftY = Math.cos(time * .51 + lenis.scroll * .0004) * 9;
          const radius = geometry.size * pose.scale * .52;
          const x = gsap.utils.clamp(radius + 8, geometry.width - radius - 8, pose.x + (attraction.x + driftX) * weight);
          const y = pose.y + (attraction.y + driftY) * weight;
          setX(x); setY(y); setScaleX(pose.scale); setScaleY(pose.scale); setOpacity(pose.opacity);
          visual.dataset.phase = pose.phase;
          visual.style.setProperty('--flight-energy', (pose.phase === 'chapter' ? .1 : pose.energy).toFixed(3));
          const interactive = pose.opacity > .9 && pose.reveal > .9;
          mark.tabIndex = interactive ? 0 : -1;
          mark.style.pointerEvents = interactive ? 'auto' : 'none';
          if (mark.getAttribute('aria-hidden') !== String(!interactive)) mark.setAttribute('aria-hidden', String(!interactive));
          logoPose = pose;
          logoSculpture?.setPose(logoPose);
          // With no GPU the photograph dissolves into the original vector.
          const gpuReady = logoSculpture?.ready;
          setSourceOpacity(gpuReady ? pose.photoOpacity : (pose.phase === 'reveal' ? 1 - pose.reveal : 0));
          setFallbackOpacity(gpuReady || pose.phase !== 'reveal' ? 1 : pose.reveal);
          if (activeIndex !== pose.active) {
            activeIndex = pose.active;
            anchors.forEach((anchor, index) => anchor.parentElement.classList.toggle('is-logo-active', index === activeIndex));
          }
        };
        const measure = () => {
          geometryFrame = 0;
          const sourceRect = source.getBoundingClientRect();
          const dockRect = dock.getBoundingClientRect();
          const pins = ScrollTrigger.getAll().filter(trigger => trigger.vars.pin);
          const heroShift = heroHold ? Math.max(0, Math.min(scrollY - heroHold.start, heroHold.end - heroHold.start)) : 0;
          geometry = {
            compact, width: root.clientWidth, height: innerHeight, size: visual.offsetWidth,
            heroEnd: heroHold?.end || innerHeight * 1.4,
            sourceX: sourceRect.left + sourceRect.width / 2,
            sourceY: sourceRect.top + scrollY - heroShift + sourceRect.height / 2,
            sourceSize: sourceRect.width,
            dockX: dockRect.left + dockRect.width / 2,
            dockY: dockRect.top + scrollY + dockRect.height / 2,
            dockSize: dockRect.width,
            nodes: anchors.map(anchor => {
              const rect = anchor.getBoundingClientRect();
              const pin = pins.find(trigger => trigger.trigger.contains(anchor));
              const shift = pin ? Math.max(0, Math.min(scrollY - pin.start, pin.end - pin.start)) : 0;
              return {x: rect.left + rect.width / 2, y: rect.top + scrollY + rect.height / 2 - shift,
                pinStart: pin?.start || 0, pinEnd: pin?.end || 0};
            })
          };
          lenis.resize();
          render();
        };
        const scheduleMeasure = () => {
          if (!geometryFrame) geometryFrame = requestAnimationFrame(measure);
        };
        const repaint = () => render(gsap.ticker.time);
        gsap.ticker.add(render);
        ScrollTrigger.addEventListener('refresh', scheduleMeasure);
        addEventListener('resize', scheduleMeasure, {passive: true});
        document.addEventListener('visibilitychange', repaint);
        document.addEventListener('portfolio:overlay', repaint);
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleMeasure);
        observer?.observe(document.body);
        observer?.observe($('main'));
        observer?.observe(dock);
        anchors.forEach(anchor => observer?.observe(anchor.parentElement));
        measure();
        root.classList.add('logo-flight-active');
        flight.classList.add('is-ready');
        let removePointer = () => {};
        if (context.conditions.fine && !compact) {
          const follow = event => {
            pointer = {x: event.clientX, y: event.clientY, active: true};
            logoSculpture?.setPointer(event.clientX / innerWidth - .5, event.clientY / innerHeight - .5);
          };
          const settle = () => { pointer.active = false; logoSculpture?.setPointer(0, 0); };
          addEventListener('pointermove', follow, {passive: true});
          addEventListener('blur', settle);
          root.addEventListener('pointerleave', settle);
          removePointer = () => {
            removeEventListener('pointermove', follow);
            removeEventListener('blur', settle);
            root.removeEventListener('pointerleave', settle);
            settle();
          };
        }
        return () => {
          removePointer();
          observer?.disconnect();
          logoSculpture?.setVisible(false);
          if (geometryFrame) cancelAnimationFrame(geometryFrame);
          gsap.ticker.remove(render);
          ScrollTrigger.removeEventListener('refresh', scheduleMeasure);
          removeEventListener('resize', scheduleMeasure);
          document.removeEventListener('visibilitychange', repaint);
          document.removeEventListener('portfolio:overlay', repaint);
          anchors.forEach(anchor => anchor.parentElement.classList.remove('is-logo-active'));
          gsap.set(visual, {clearProps: 'transform,opacity'});
          gsap.set(source, {clearProps: 'opacity'});
          root.classList.remove('logo-flight-active');
          flight.classList.remove('is-ready');
        };
      });
    }

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
        x: () => -dist, ease: 'none', onUpdate: pick,
        scrollTrigger: {trigger: reelPin, start: () => reelPin.offsetHeight < innerHeight ? 'center center' : 'top top', end: () => `+=${Math.min(dist * .6, innerHeight * 3)}`, pin: true, scrub: .5, anticipatePin: 1, invalidateOnRefresh: true, onRefreshInit: measure, onRefresh: pick}
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
      gsap.from(card, {y: narrow.matches ? 20 : 32, autoAlpha: 0, duration: MOTION.reveal, delay: narrow.matches ? 0 : i * MOTION.stagger, ease: MOTION.ease, scrollTrigger: replayOnScroll(card)});
    });
    $$('.rule').forEach(r => gsap.fromTo(r, {scaleX: 0}, {scaleX: 1, duration: 1.15, ease: MOTION.ease, scrollTrigger: replayOnScroll(r.parentElement)}));
    $$('.section-top').forEach(t => gsap.from($$(':scope > span', t), {y: 14, autoAlpha: 0, duration: .9, ease: 'power3.out', stagger: .08, scrollTrigger: replayOnScroll(t)}));
    $$('[data-split]').forEach(el => {
      // Phones keep the reveal without creating masks around every text line.
      if (narrow.matches) {
        gsap.from(el, {y:16, autoAlpha:0, duration:.7, ease:'power3.out', scrollTrigger:replayOnScroll(el)});
        return;
      }
      SplitText.create(el, {
      type: 'lines', linesClass: 'split-line', mask: 'lines', autoSplit: true,
      onSplit: self => gsap.from(self.lines, {yPercent: 105, duration: 1.05, ease: 'power4.out', stagger: .075, scrollTrigger: replayOnScroll(el)})
      });
    });
    // The counter owns its own entrance below; sharing its visibility window
    // avoids counting behind a separate fade that has not yet become visible.
    $$('[data-fade]:not(.tvc-stat)').forEach(el => gsap.from(el, {y: 18, autoAlpha: 0, duration: MOTION.reveal, ease: MOTION.ease, scrollTrigger: replayOnScroll(el)}));

    /* --- Filmography list --- */
    gsap.set(rows, {autoAlpha: 0, y: 24});
    const rowInView = row => {
      const bounds = row.getBoundingClientRect();
      return !row.hidden && bounds.bottom > 0 && bounds.top < innerHeight;
    };
    const revealRows = batch => {
      const visible = batch.filter(rowInView);
      if (visible.length) gsap.fromTo(visible, {autoAlpha: 0, y: 18}, {autoAlpha: 1, y: 0, duration: .65, ease: MOTION.ease, stagger: .035, overwrite: true});
    };
    const finishRows = batch => {
      // Batches are delayed; re-check geometry after fast direction changes.
      const outside = batch.filter(row => !rowInView(row));
      gsap.killTweensOf(outside);
      gsap.set(outside, {autoAlpha: 1, y: 0});
    };
    ScrollTrigger.batch(rows, {start: 'top bottom', end: 'bottom top', interval: .08,
      onEnter: revealRows, onEnterBack: revealRows, onLeave: finishRows, onLeaveBack: finishRows});
    // The preview is sticky on desktop, so its whole browser owns the visit.
    gsap.from('.archive-preview', {autoAlpha: 0, y: 24, duration: MOTION.reveal, ease: MOTION.ease, scrollTrigger: replayOnScroll('.archive-browser')});

    /* --- About: motion follows the scroll; the visitor controls the theme. --- */
    gsap.to('.asterisk', {rotate: 360, ease: 'none', scrollTrigger: {trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: true}});
    $$('.disciplines li').forEach(el => gsap.from(el, {y: 20, autoAlpha: 0, duration: .8, ease: MOTION.ease, scrollTrigger: replayOnScroll(el)}));

    /* --- TV commercials: 0 → 300 on every viewport visit, in either direction. --- */
    const tvcCount = $('.tvc-count');
    if (tvcCount) {
      const n = {v: 0};
      gsap.timeline({scrollTrigger: replayOnScroll('.tvc-stat')})
        .from('.tvc-stat', {y: 18, autoAlpha: 0, duration: .65, ease: MOTION.ease}, 0)
        .fromTo(n, {v: 0}, {v: +tvcCount.dataset.count, duration: 2, ease: 'power3.out',
          onUpdate: () => { tvcCount.textContent = Math.round(n.v); }}, 0);
    }

    $$('.tvc-beats li').forEach(el => gsap.from(el, {y: 20, autoAlpha: 0, duration: .8, ease: MOTION.ease, scrollTrigger: replayOnScroll(el)}));

    /* --- Media surfaces settle into place; no full-frame wipes over footage. --- */
    $$('.spot').forEach((spot, i) => {
      gsap.timeline({scrollTrigger: replayOnScroll(spot)})
        .from(spot, {y: narrow.matches ? 20 : 32, autoAlpha: 0, duration: MOTION.reveal, ease: MOTION.ease, delay: narrow.matches ? 0 : (i % 2) * MOTION.stagger})
        .from($$('.spot-info > *', spot), {y: 10, autoAlpha: 0, duration: .65, ease: MOTION.ease, stagger: .035}, .15);
    });

    $$('.ai-process li').forEach(el => gsap.from(el, {y: 24, autoAlpha: 0, duration: .9, ease: MOTION.ease, scrollTrigger: replayOnScroll(el)}));

    /* --- Each screen reveals when it arrives, including stacked mobile cards. --- */
    if ($('.screens-stage')) {
      $$('.screens-stage > *').forEach(screen => {
        gsap.from(screen, {y: narrow.matches ? 24 : 40, autoAlpha: 0, duration: 1.1, ease: MOTION.ease, scrollTrigger: replayOnScroll(screen)});
      });
      if (!narrow.matches) gsap.to('.screens-word', {xPercent: -8, ease: 'none', scrollTrigger: {trigger: '.screens', start: 'top bottom', end: 'bottom top', scrub: .6}});
    }

    /* --- Contact: the glass surface catches the light. --- */
    gsap.from('.contact-fill', {opacity: .25, ease: 'none', scrollTrigger: {trigger: '#contact', start: 'top bottom', end: 'top 25%', scrub: .6}});
    gsap.from('.ct-line > span', {yPercent: 115, duration: 1.4, ease: 'expo.out', stagger: .1, scrollTrigger: replayOnScroll('.contact-title')});
    gsap.from('.contact-orb', {scale: .88, autoAlpha: 0, y: 20, duration: 1, ease: MOTION.ease, scrollTrigger: replayOnScroll('.contact-orb')});
    ['.contact-bottom', '#contact footer'].forEach(selector => gsap.from($$(`${selector} > *:not(.footer-brand)`), {y: 16, autoAlpha: 0, duration: .9, ease: MOTION.ease, stagger: .06, scrollTrigger: replayOnScroll(selector)}));
    // Keep the docking socket untransformed; only the closing name reveals.
    gsap.from('.footer-brand-copy', {y: 10, autoAlpha: 0, duration: .8, ease: MOTION.ease, scrollTrigger: replayOnScroll('.footer-brand')});

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
      const xTo = gsap.quickTo(cursor, 'x', {duration: .2, ease: MOTION.ease});
      const yTo = gsap.quickTo(cursor, 'y', {duration: .2, ease: MOTION.ease});
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
      document.documentElement.addEventListener('pointerleave', hideCursor);
      addEventListener('blur', hideCursor);
      document.addEventListener('pointerover', e => {
        const t = e.target.closest('[data-cursor]');
        if (t === current) return;
        if (!t) return hideCursor();
        current = t;
        label.textContent = t.dataset.cursor;
        gsap.to(cursor, {scale: 1, autoAlpha: 1, duration: .5, ease: 'expo.out', overwrite: 'auto'});
      });
      // Move the arrow inside its stable hit area, so the button never escapes the pointer.
      $$('.contact-orb, .scroll-cue').forEach(button => {
        const el = $('span', button);
        if (!el) return;
        const mx = gsap.quickTo(el, 'x', {duration: .5, ease: MOTION.ease});
        const my = gsap.quickTo(el, 'y', {duration: .5, ease: MOTION.ease});
        button.addEventListener('pointermove', e => {
          const r = button.getBoundingClientRect();
          mx((e.clientX - r.left - r.width / 2) * .16);
          my((e.clientY - r.top - r.height / 2) * .16);
        });
        button.addEventListener('pointerleave', () => { mx(0); my(0); });
      });
      const light = $('.hero-atmosphere i');
      const lightX = gsap.quickTo(light, 'x', {duration: 1.8, ease: MOTION.ease});
      const lightY = gsap.quickTo(light, 'y', {duration: 1.8, ease: MOTION.ease});
      $('.hero').addEventListener('pointermove', e => {
        lightX((e.clientX / innerWidth - .5) * 40);
        lightY((e.clientY / innerHeight - .5) * 30);
      }, {passive: true});
      $('.hero').addEventListener('pointerleave', () => { lightX(0); lightY(0); });
    }

    /* --- Ordering, late layout, and the opening --- */
    initLogoFlight();
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
        // Replay triggers finish skipped content and animate visible entries.
        // Do not force an entire section to its end state: that skips counters
        // and pre-completes cards that are still below the viewport.
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
