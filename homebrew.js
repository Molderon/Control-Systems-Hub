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

        return `
        <div class="hb-card" data-slug="${slug}">
            <div class="hb-logo-bg"></div>
            <div class="hb-card-inner">
                <div class="hb-card-header">
                    <span class="hb-name">${meta.name || slug}</span>
                    <span class="hb-contributors"><i class="ti ti-users"></i> ${count}</span>
                </div>
                <p class="hb-desc">${meta.description || ''}</p>
                <div class="hb-tags">${tagHtml}</div>
                <div class="hb-footer">
                    <div class="hb-stack">${stackHtml}</div>
                    <a href="${meta.github || '#'}" target="_blank" rel="noopener" class="hb-github-link">
                        <i class="ti ti-brand-github"></i> ${meta.lead || ''}
                    </a>
                </div>
            </div>
        </div>`;
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
