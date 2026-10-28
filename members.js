(function () {
    const REGISTRY = 'members/index.json';

    function parseFrontmatter(text) {
        const m = text.match(/^---\n([\s\S]*?)\n---/);
        if (!m) return { meta: {}, body: text };
        const meta = {};
        m[1].split('\n').forEach(line => {
            const colon = line.indexOf(':');
            if (colon === -1) return;
            const key = line.slice(0, colon).trim();
            let val = line.slice(colon + 1).trim();
            if ((val.startsWith("'") && val.endsWith("'")) ||
                (val.startsWith('"') && val.endsWith('"'))) {
                val = val.slice(1, -1);
            }
            meta[key] = val;
        });
        return { meta, body: text.slice(m[0].length).trim() };
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function splitList(s) {
        return (s || '').split(',').map(t => t.trim()).filter(Boolean);
    }

    function probeAvatar(slug, onFound, onMissing) {
        const img = new Image();
        img.onload  = () => onFound(`members/${slug}/avatar.png`);
        img.onerror = () => onMissing();
        img.src     = `members/${slug}/avatar.png`;
    }

    function buildCard(slug, meta) {
        const statusDot = meta.status === 'idle' ? 'idle' : 'active';
        const legendDot = statusDot === 'active' ? 'green' : 'amber';
        const legendTxt = statusDot === 'active'
            ? 'available &mdash; by appointment'
            : 'on vacation &mdash; async only';
        return `
        <div class="pricing-card" data-profile="${esc(slug)}">
            <div class="plan-name">${esc(meta.name || slug)}</div>
            <div class="plan-period">${esc(meta.role || '')}</div>
            <ul class="plan-features">
                <li><span class="pf-lbl">Working Days</span><span class="pf-val">${esc(meta.days || '')}</span></li>
                <li><span class="pf-lbl">Availability</span><span class="pf-val"><a href="index.html#contact" class="pf-appointment">By Appointment</a></span></li>
                <li><span class="pf-lbl">Email</span><span class="pf-val">${esc(meta.email || '')}</span></li>
            </ul>
            <div class="card-proc-footer">
                <div class="card-proc-bar">
                    <span class="card-status-dot ${statusDot}"></span>
                    <span class="card-proc-name">${esc(meta.pid_label || `kthread/ctrl:${slug}@0x4319`)}</span>
                </div>
                <div class="card-proc-legend">
                    <div class="card-legend-row">
                        <span class="card-legend-dot ${legendDot}"></span>
                        <span class="card-legend-text">${legendTxt}</span>
                    </div>
                </div>
            </div>
        </div>`;
    }

    function renderCards(grid) {
        fetch(REGISTRY)
            .then(r => r.json())
            .then(slugs => Promise.all(
                slugs.map(slug =>
                    fetch(`members/${slug}/profile.md`)
                        .then(r => r.ok ? r.text() : Promise.reject())
                        .then(text => ({ slug, ...parseFrontmatter(text) }))
                        .catch(() => null)
                )
            ))
            .then(members => {
                const valid = members.filter(Boolean);
                grid.innerHTML = valid.length
                    ? valid.map(m => buildCard(m.slug, m.meta)).join('')
                    : '<p class="hb-empty">// no members indexed</p>';
            })
            .catch(() => { /* leave grid empty */ });
    }

    function buildProfile(slug, meta) {
        const topics   = splitList(meta.active_topics);
        const tagsHtml = topics.map(t => `<span class="profile-tag">${esc(t)}</span>`).join('');
        const titleSlug = meta.title_slug || slug;
        const github    = meta.github || '#';
        const ghUser    = meta.github_user ? `@${esc(meta.github_user)}` : '@username';
        const vacationLine = meta.log_vacation
            ? `<span class="log-prompt">$</span> cat vacation.notice<br>${esc(meta.log_vacation)}<br>`
            : '';

        return `
        <div class="profile-title-bar">
            <span class="profile-title-text">PROC/CTRL — ${esc(titleSlug)}.dat</span>
            <div class="profile-win-btns">
                <div class="profile-win-btn">×</div>
                <div class="profile-win-btn">−</div>
                <div class="profile-win-btn">□</div>
            </div>
        </div>

        <div class="profile-body">
            <div class="profile-sidebar">
                <div class="profile-avatar">
                    <div class="avatar-pending">
                        <div class="avatar-pending-scan"></div>
                        <span class="avatar-pending-label">PHOTO<br>PENDING</span>
                    </div>
                </div>
                <div class="profile-status-row">
                    <span class="profile-status-dot"></span>
                    <span class="profile-status-label">${meta.status === 'idle' ? 'idle' : 'available'}</span>
                </div>
                <ul class="profile-meta">
                    <li><span class="pm-key">Office</span><span class="pm-val">${esc(meta.office || '')}</span></li>
                    <li><span class="pm-key">Avail.</span><span class="pm-val"><a href="index.html#contact" class="pf-appointment">By Appointment</a></span></li>
                    <li><span class="pm-key">Days</span><span class="pm-val">${esc(meta.days || '')}</span></li>
                    <li><span class="pm-key">Email</span><span class="pm-val pm-val--email">${esc(meta.email || '')}</span></li>
                    <li><span class="pm-key">GitHub</span><span class="pm-val"><a href="${esc(github)}" target="_blank" rel="noopener noreferrer" class="profile-ext-link"><i class="ti ti-brand-github"></i> ${ghUser}</a></span></li>
                </ul>
            </div>

            <div class="profile-main">
                <div class="profile-name">${esc(meta.name || slug)}</div>
                <div class="profile-role">${esc(meta.role || '')}</div>
                <div class="profile-divider"></div>

                <div class="profile-section-label">// research focus</div>
                <p class="profile-bio">${esc(meta.research_focus || '')}</p>

                <div class="profile-section-label">// active topics</div>
                <div class="profile-tags">${tagsHtml}</div>

                <div class="profile-section-label">// terminal log</div>
                <div class="profile-log">
                    <span class="log-prompt">$</span> whoami<br>
                    ${esc(titleSlug)} — ${esc(meta.log_thread || 'ctrl/research thread')}<br>
                    <span class="log-prompt">$</span> cat thesis.status<br>
                    ${esc(meta.log_thesis || '')}<br>
                    <span class="log-prompt">$</span> uptime<br>
                    ${esc(meta.log_uptime || '')}<br>
                    ${vacationLine}
                    <span class="log-prompt">$</span> _
                </div>
            </div>
        </div>

        <div class="profile-kthread">${esc(meta.kthread || '')}</div>`;
    }

    function renderProfile(slug, root) {
        fetch(`members/${slug}/profile.md`)
            .then(r => {
                if (!r.ok) throw new Error('404');
                return r.text();
            })
            .then(text => {
                const { meta } = parseFrontmatter(text);
                document.title = `${meta.name || slug} — Control Systems, TU-Sofia Plovdiv`;
                root.innerHTML = buildProfile(slug, meta);

                const avatarBox = root.querySelector('.profile-avatar');
                if (!avatarBox) return;
                probeAvatar(slug,
                    (src) => {
                        const img = document.createElement('img');
                        img.className = 'profile-avatar-img';
                        img.alt       = meta.name || slug;
                        img.src       = src;
                        avatarBox.insertBefore(img, avatarBox.firstChild);
                        const pending = avatarBox.querySelector('.avatar-pending');
                        if (pending) pending.style.display = 'none';
                    },
                    () => { /* scanline placeholder stays */ }
                );
            })
            .catch(() => {
                root.innerHTML = '<p class="hb-empty" style="padding:40px;text-align:center;">// member not found — <a href="index.html#pricing" style="color:var(--primary-cyan)">return to roster</a></p>';
            });
    }

    function init() {
        if (window.__MEMBER_SLUG__) {
            const root = document.getElementById('profile-shell');
            if (root) renderProfile(window.__MEMBER_SLUG__, root);
            return;
        }
        const grid = document.getElementById('pricing-grid');
        if (grid) renderCards(grid);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
