/**
 * gallery.js — Reads projects.json manifest, renders project grid with filtering
 */
(function () {
  'use strict';

  const MANIFEST_URL = './projects.json';
  const grid = document.getElementById('projectGrid');
  const filterBar = document.getElementById('filterBar');
  const dayCounter = document.getElementById('dayCounter');

  let projects = [];
  let activeFilter = 'all';

  // --- Fetch manifest ---
  async function loadManifest() {
    try {
      const res = await fetch(MANIFEST_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      projects = await res.json();
      init();
    } catch (err) {
      console.error('Failed to load projects manifest:', err);
      grid.innerHTML = `<div class="empty-state"><p>Could not load projects. Check back soon.</p></div>`;
    }
  }

  // --- Init ---
  function init() {
    if (!projects.length) {
      grid.innerHTML = `<div class="empty-state"><p>No projects yet. The first one is coming soon.</p></div>`;
      return;
    }

    // Update day counter
    const maxDay = Math.max(...projects.map(p => p.dayNumber || 0));
    if (dayCounter) {
      dayCounter.textContent = `Day ${maxDay}`;
    }

    // Build filter pills
    buildFilters();

    // Render grid
    renderGrid();
  }

  // --- Filters ---
  function buildFilters() {
    if (!filterBar) return;

    const allTags = new Set();
    projects.forEach(p => {
      if (p.tags) p.tags.forEach(t => allTags.add(t));
    });

    filterBar.innerHTML = '';

    // "All" pill
    const allPill = createPill('All', 'all', true);
    filterBar.appendChild(allPill);

    // Tag pills
    Array.from(allTags).sort().forEach(tag => {
      filterBar.appendChild(createPill(tag, tag, false));
    });
  }

  function createPill(label, value, isActive) {
    const btn = document.createElement('button');
    btn.className = 'filter-pill' + (isActive ? ' active' : '');
    btn.textContent = label;
    btn.setAttribute('data-filter', value);
    btn.addEventListener('click', () => {
      activeFilter = value;
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      renderGrid();
    });
    return btn;
  }

  // --- Render ---
  function renderGrid() {
    const filtered = activeFilter === 'all'
      ? projects
      : projects.filter(p => p.tags && p.tags.includes(activeFilter));

    grid.innerHTML = '';

    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state"><p>No projects match this filter.</p></div>`;
      return;
    }

    filtered.forEach((project, i) => {
      const card = buildCard(project, i);
      grid.appendChild(card);
    });
  }

  function buildCard(project, index) {
    const card = document.createElement('a');
    card.className = 'project-card';
    card.href = `projects/${project.folder}/index.html`;
    card.style.setProperty('--stagger-delay', `${index * 80}ms`);

    if (project.accentColor) {
      card.style.setProperty('--card-accent', project.accentColor);
    }

    // Format date
    const dateObj = new Date(project.date + 'T12:00:00');
    const dateStr = dateObj.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });

    // Thumbnail
    const thumbSrc = project.thumb
      ? `projects/${project.folder}/${project.thumb}`
      : '';

    const thumbHtml = thumbSrc
      ? `<img src="${thumbSrc}" alt="${project.title}" loading="lazy">`
      : `<div style="width:100%;height:100%;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;color:var(--text-dim);font-size:0.8rem;">No preview</div>`;

    // Tags
    const tagsHtml = (project.tags || [])
      .map(t => `<span class="tag">${t}</span>`)
      .join('');

    card.innerHTML = `
      <div class="project-card__thumb">
        ${thumbHtml}
        <div class="project-card__day">Day ${project.dayNumber || '?'}</div>
      </div>
      <div class="project-card__body">
        <div class="project-card__title">${escapeHtml(project.title)}</div>
        <div class="project-card__date">${dateStr}</div>
        <div class="project-card__desc">${escapeHtml(project.description || '')}</div>
        <div class="project-card__tags">${tagsHtml}</div>
      </div>
    `;

    return card;
  }

  // --- Utilities ---
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Go ---
  loadManifest();
})();
