(function () {
    const REGISTRY = 'homebrew/index.json';

    function parseFrontmatter(text) {
        const m = text.match(/^---\n([\s\S]*?)\n---/);
        if (!m) return { meta: {}, body: text };
        const meta = {};
        m[1].split('\n').forEach(line => {
            const colon = line.indexOf(':');
            if (colon === -1) return;
            const key = line.slice(0, colon).trim();
            meta[key] = line.slice(colon + 1).trim();
        });
        return { meta, body: text.slice(m[0].length).trim() };
    }

    function buildCard(slug, meta) {
        const tags  = (meta.tags  || '').split(',').map(t => t.trim()).filter(Boolean);
        const stack = (meta.stack || '').split(',').map(t => t.trim()).filter(Boolean);
        const count = parseInt(meta.contributors) || 0;

        const tagHtml   = tags.map(t  => `<span class="hb-tag">${t}</span>`).join('');
        const stackHtml = stack.map(t => `<span class="hb-stack-badge">${t}</span>`).join('');

        const repoUrl   = meta.github || '';
        const external  = repoUrl ? ' external-link" tabindex="0" role="link" aria-label="Open repository for ' +
                                    (meta.name || slug) + '" data-repo="' + repoUrl + '"' : '"';
        const badgeHtml = repoUrl ? '<span class="hb-repo-badge">[ REPO <span class="hb-repo-arrow">→</span> ]</span>' : '';

        return `
        <div class="hb-card${external} data-slug="${slug}">
            <div class="hb-logo-bg"></div>
            ${badgeHtml}
            <div class="hb-card-inner">
                <div class="hb-card-header">
                    <span class="hb-name">${meta.name || slug}</span>
                    <span class="hb-contributors"><i class="ti ti-users"></i> ${count}</span>
                </div>
                <p class="hb-desc">${meta.description || ''}</p>
                <div class="hb-tags">${tagHtml}</div>
                <div class="hb-footer">
                    <div class="hb-stack">${stackHtml}</div>
                    <a href="${repoUrl || '#'}" target="_blank" rel="noopener" class="hb-github-link">
                        <i class="ti ti-brand-github"></i> ${meta.lead || ''}
                    </a>
                </div>
            </div>
        </div>`;
    }

    function attachRepoHandlers(grid) {
        grid.querySelectorAll('.hb-card.external-link[data-repo]').forEach(card => {
            const url = card.dataset.repo;
            if (!url) return;
            card.addEventListener('click', e => {
                if (e.target.closest('a')) return;
                window.open(url, '_blank', 'noopener');
            });
            card.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.open(url, '_blank', 'noopener');
                }
            });
        });
    }

    function init() {
        const grid = document.getElementById('homebrew-grid');
        if (!grid) return;

        fetch(REGISTRY)
            .then(r => r.json())
            .then(slugs => Promise.all(
                slugs.map(slug =>
                    fetch(`homebrew/${slug}/project.md`)
                        .then(r => r.ok ? r.text() : Promise.reject())
                        .then(text => ({ slug, ...parseFrontmatter(text) }))
                        .catch(() => null)
                )
            ))
            .then(projects => {
                const valid = projects.filter(Boolean);
                valid.sort((a, b) => (parseInt(b.meta.contributors) || 0) - (parseInt(a.meta.contributors) || 0));
                grid.innerHTML = valid.length
                    ? valid.map(p => buildCard(p.slug, p.meta)).join('')
                    : '<p class="hb-empty">// no projects indexed</p>';

                attachRepoHandlers(grid);

                grid.querySelectorAll('.hb-card').forEach(card => {
                    const slug   = card.dataset.slug;
                    const logoEl = card.querySelector('.hb-logo-bg');
                    const img    = new Image();
                    img.onload  = () => logoEl.style.backgroundImage = `url('homebrew/${slug}/logo.png')`;
                    img.onerror = () => logoEl.classList.add('hb-logo-default');
                    img.src     = `homebrew/${slug}/logo.png`;
                });
            })
            .catch(() => { /* leave static fallback in place */ });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
