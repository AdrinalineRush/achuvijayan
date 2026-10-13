/**
 * Achu Vijayan Portfolio — Main JavaScript
 * Interactive controls, filtering, modal lightbox, and scroll interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTimelineScrubber();
  renderMilestones();
  renderSpotlights();
  renderFilmography('all');
  renderFilmographyTable('all');
  renderAiCampaigns();
  renderToolkit();
  initFilters();
  initViewToggle();
  initModal();
  initMobileNav();
  initScrollSpy();
  initScrollReveal();
});

/* --------------------------------------------------------------------------
   1. Timeline Scrubber Progress Bar
   -------------------------------------------------------------------------- */
function initTimelineScrubber() {
  const fill = document.getElementById('scrubberFill');
  if (!fill) return;

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (window.scrollY / totalHeight) * 100;
    fill.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   2. Render Milestones / Stats Strip
   -------------------------------------------------------------------------- */
function renderMilestones() {
  const container = document.getElementById('milestonesGrid');
  if (!container || typeof MILESTONES === 'undefined') return;

  container.innerHTML = MILESTONES.map(m => `
    <div class="metric-item reveal">
      <div class="metric-header">
        <span class="metric-number">${m.stat}</span>
        <span class="metric-suffix">${m.suffix}</span>
      </div>
      <div class="metric-label">${m.label}</div>
      <div class="metric-detail">${m.detail}</div>
    </div>
  `).join('');
}

/* --------------------------------------------------------------------------
   3. Render Spotlight Cards (Aattam, Vichithram, Charles Enterprises, Boom Bang)
   -------------------------------------------------------------------------- */
function renderSpotlights() {
  const container = document.getElementById('spotlightsGrid');
  if (!container || typeof FEATURE_FILMS === 'undefined') return;

  // Curate top spotlight features
  const spotlightIds = ['aattam', 'vichithram', 'charles-enterprises', 'boom-bang'];
  const spotlights = spotlightIds
    .map(id => FEATURE_FILMS.find(f => f.id === id))
    .filter(Boolean);

  container.innerHTML = spotlights.map(film => `
    <article class="spotlight-card reveal" onclick="openFilmModal('${film.id}')">
      <div class="spotlight-hero-media">
        <img src="${film.poster || 'assets/images/vichithram.jpg'}" alt="${film.title} Poster" loading="lazy">
        <span class="spotlight-badge">${film.badge || film.language}</span>
      </div>
      <div class="spotlight-content">
        <div class="spotlight-meta-row">
          <span>${film.year} · ${film.language}</span>
          ${film.award ? `<span style="color:var(--amber-primary)">★ Award Winner</span>` : ''}
        </div>
        <h3 class="spotlight-title">${film.title}</h3>
        <div class="role-pill-group">
          ${film.roles.map(role => getRoleBadgeHtml(role)).join('')}
        </div>
        <p class="spotlight-desc">${film.description}</p>
        <div class="spotlight-footer">
          <span>${film.director ? `Dir: ${film.director}` : ''}</span>
          <span style="color:var(--amber-primary)">View Details →</span>
        </div>
      </div>
    </article>
  `).join('');
}

/* --------------------------------------------------------------------------
   4. Render Filmography Posters Grid with Filtering
   -------------------------------------------------------------------------- */
function renderFilmography(filterCategory = 'all') {
  const container = document.getElementById('postersGrid');
  if (!container || typeof FEATURE_FILMS === 'undefined') return;

  const filtered = filterFilms(FEATURE_FILMS, filterCategory);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--ink-muted);">
        No titles match the selected category.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(film => `
    <article class="poster-card reveal" onclick="openFilmModal('${film.id}')">
      <div class="poster-thumbnail">
        ${film.poster 
          ? `<img src="${film.poster}" alt="${film.title} Poster" loading="lazy">` 
          : `<div class="poster-fallback">
              <span class="poster-fallback-title">${film.title}</span>
              <span class="poster-fallback-year">${film.year}</span>
            </div>`
        }
      </div>
      <div class="poster-info">
        <div class="poster-header-row">
          <h4 class="poster-title">${film.title}</h4>
          <span class="poster-year">${film.year}</span>
        </div>
        <div class="role-pill-group" style="margin-top: 4px;">
          ${film.roles.map(r => getRoleBadgeHtml(r)).join('')}
        </div>
        <p class="poster-desc">${film.description}</p>
      </div>
    </article>
  `).join('');

  initScrollReveal();
}

/* --------------------------------------------------------------------------
   5. Render Master Filmography Table
   -------------------------------------------------------------------------- */
function renderFilmographyTable(filterCategory = 'all') {
  const tbody = document.getElementById('filmTableBody');
  if (!tbody || typeof FEATURE_FILMS === 'undefined') return;

  const filtered = filterFilms(FEATURE_FILMS, filterCategory);

  tbody.innerHTML = filtered.map(film => `
    <tr onclick="openFilmModal('${film.id}')" style="cursor: pointer;">
      <td class="td-year">${film.year}</td>
      <td class="td-title">${film.title}</td>
      <td>
        <div class="role-pill-group">
          ${film.roles.map(r => getRoleBadgeHtml(r)).join('')}
        </div>
      </td>
      <td class="td-lang">${film.language}</td>
      <td class="td-notes">${film.description}</td>
    </tr>
  `).join('');
}

/* --------------------------------------------------------------------------
   Filter Logic
   -------------------------------------------------------------------------- */
function filterFilms(films, category) {
  if (category === 'all') return films;
  const matchMap = {
    'directing': ['Director'],
    'editing': ['Editor', 'Spot Editor'],
    'producing': ['Producer', 'Co-Producer'],
    'vfx': ['VFX']
  };

  const targetRoles = matchMap[category] || [];
  return films.filter(film => film.roles.some(r => targetRoles.includes(r)));
}

function getRoleBadgeHtml(role) {
  const normalized = role.toLowerCase().replace(/[^a-z]/g, '');
  let cssClass = 'role-editor';
  if (normalized.includes('director')) cssClass = 'role-director';
  else if (normalized.includes('producer')) cssClass = 'role-producer';
  else if (normalized.includes('vfx')) cssClass = 'role-vfx';
  return `<span class="role-pill ${cssClass}">${role}</span>`;
}

function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');
      renderFilmography(cat);
      renderFilmographyTable(cat);
    });
  });
}

function initViewToggle() {
  const toggleBtns = document.querySelectorAll('.toggle-view-btn');
  const postersContainer = document.getElementById('postersGrid');
  const tableContainer = document.getElementById('tableWrapper');

  if (!postersContainer || !tableContainer) return;

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.getAttribute('data-view');
      if (view === 'table') {
        postersContainer.style.display = 'none';
        tableContainer.style.display = 'block';
      } else {
        postersContainer.style.display = 'grid';
        tableContainer.style.display = 'none';
      }
    });
  });
}

/* --------------------------------------------------------------------------
   6. Render AI Campaigns
   -------------------------------------------------------------------------- */
function renderAiCampaigns() {
  const container = document.getElementById('aiCampaignsGrid');
  if (!container || typeof AI_CAMPAIGNS === 'undefined') return;

  container.innerHTML = AI_CAMPAIGNS.map(item => `
    <article class="ai-card reveal">
      <div class="ai-thumb">
        <img src="${item.image}" alt="${item.title}" loading="lazy">
      </div>
      <div class="ai-info">
        <span class="ai-badge">${item.badge}</span>
        <h3 class="ai-title">${item.title}</h3>
        <div class="ai-role">${item.role} · ${item.client}</div>
        <p class="ai-desc">${item.description}</p>
      </div>
    </article>
  `).join('');
}

/* --------------------------------------------------------------------------
   7. Render Toolkit
   -------------------------------------------------------------------------- */
function renderToolkit() {
  const container = document.getElementById('toolkitGrid');
  if (!container || typeof TOOLKIT === 'undefined') return;

  container.innerHTML = TOOLKIT.map(tool => `
    <div class="toolkit-cell reveal">
      <div class="toolkit-cat">
        <span>▶</span> ${tool.category}
      </div>
      <ul class="toolkit-items">
        ${tool.items.map(i => `<li>${i}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}

/* --------------------------------------------------------------------------
   8. Film Details Lightbox Modal
   -------------------------------------------------------------------------- */
let activeModalFilm = null;

function openFilmModal(filmId) {
  const film = FEATURE_FILMS.find(f => f.id === filmId);
  if (!film) return;
  activeModalFilm = film;

  const modal = document.getElementById('filmModal');
  const posterContainer = document.getElementById('modalPoster');
  const metaContainer = document.getElementById('modalMeta');
  const titleEl = document.getElementById('modalTitle');
  const detailsContainer = document.getElementById('modalDetails');
  const synopsisEl = document.getElementById('modalSynopsis');

  if (film.poster) {
    posterContainer.innerHTML = `<img src="${film.poster}" alt="${film.title} Poster">`;
  } else {
    posterContainer.innerHTML = `
      <div class="poster-fallback" style="height:100%;">
        <span class="poster-fallback-title">${film.title}</span>
        <span class="poster-fallback-year">${film.year}</span>
      </div>`;
  }

  metaContainer.innerHTML = `
    <span>${film.year} · ${film.language}</span>
    <span>${film.badge || ''}</span>
  `;

  titleEl.textContent = film.title;

  detailsContainer.innerHTML = `
    <div class="modal-detail-row">
      <span class="modal-detail-label">Roles</span>
      <div class="modal-detail-value role-pill-group">
        ${film.roles.map(r => getRoleBadgeHtml(r)).join('')}
      </div>
    </div>
    ${film.director ? `
      <div class="modal-detail-row">
        <span class="modal-detail-label">Director</span>
        <span class="modal-detail-value">${film.director}</span>
      </div>` : ''}
    ${film.cast ? `
      <div class="modal-detail-row">
        <span class="modal-detail-label">Cast</span>
        <span class="modal-detail-value">${film.cast}</span>
      </div>` : ''}
    ${film.production ? `
      <div class="modal-detail-row">
        <span class="modal-detail-label">Banner</span>
        <span class="modal-detail-value">${film.production}</span>
      </div>` : ''}
    ${film.award ? `
      <div class="modal-detail-row">
        <span class="modal-detail-label">Awards</span>
        <span class="modal-detail-value" style="color:var(--amber-primary); font-weight:600;">${film.award}</span>
      </div>` : ''}
  `;

  synopsisEl.textContent = film.description;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeFilmModal() {
  const modal = document.getElementById('filmModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function initModal() {
  const modal = document.getElementById('filmModal');
  const closeBtn = document.getElementById('modalCloseBtn');

  if (closeBtn) closeBtn.addEventListener('click', closeFilmModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeFilmModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFilmModal();
  });
}

/* --------------------------------------------------------------------------
   9. Mobile Navigation Toggle
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileNavToggle');
  const navMenu = document.getElementById('navMenu');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    navMenu.classList.toggle('open');
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
    });
  });
}

/* --------------------------------------------------------------------------
   10. ScrollSpy Active Nav Tracking
   -------------------------------------------------------------------------- */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPos = window.scrollY + 200;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        current = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });
}

/* --------------------------------------------------------------------------
   11. Scroll Reveal Observer
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal:not(.visible)');
  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
}
