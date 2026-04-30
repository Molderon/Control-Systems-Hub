/* ui-enhancements.js — tab switching + hero logo swap */
(function () {
    'use strict';

    /* ── Hero title ↔ logo morph ──────────────────────────────────────────── */
    function initHeroLogoSwap() {
        const wrap  = document.getElementById('heroTitleWrap');
        const title = document.getElementById('heroTitle');
        const logo  = document.getElementById('heroLogo');
        if (!wrap || !title || !logo) return;

        const GLITCH = '!<>-_\\/[]{}=+*^?#@%01';
        let logoVisible = false, isAnimating = false;

        const nexus   = title.querySelector('.hero-nexus');
        const flow    = title.querySelector('.hero-flow');
        const origN   = nexus ? nexus.textContent : 'Control';
        const origF   = flow  ? flow.textContent  : 'Systems';

        function scramble(span, original, ms) {
            const frames = Math.ceil(ms / 38);
            let f = 0;
            const iv = setInterval(() => {
                f++;
                span.textContent = original.split('').map(c => {
                    if (c === ' ') return ' ';
                    return (f / frames > Math.random() + 0.08)
                        ? c
                        : GLITCH[Math.floor(Math.random() * GLITCH.length)];
                }).join('');
                if (f >= frames) { clearInterval(iv); span.textContent = original; }
            }, 38);
        }

        wrap.addEventListener('mouseenter', () => {
            if (logoVisible || isAnimating) return;
            isAnimating = true;

            if (nexus) scramble(nexus, origN, 210);
            if (flow)  scramble(flow,  origF, 210);

            setTimeout(() => {
                title.style.animation = 'heroTitleOut 0.40s ease-out forwards';
                setTimeout(() => {
                    title.style.opacity   = '0';
                    title.style.animation = '';
                    logo.style.opacity    = '1';
                    logo.style.animation  = 'heroLogoIn 0.58s ease-out forwards';
                    logoVisible = true;
                    isAnimating = false;
                }, 400);
            }, 190);
        });

        wrap.addEventListener('mouseleave', () => {
            if (!logoVisible || isAnimating) return;
            isAnimating = true;

            logo.style.animation = 'heroLogoOut 0.32s ease-out forwards';
            setTimeout(() => {
                logo.style.opacity   = '0';
                logo.style.animation = '';
                title.style.opacity  = '';
                title.style.animation = 'heroTitleIn 0.52s ease-out forwards';
                logoVisible = false;
                setTimeout(() => {
                    title.style.animation = '';
                    if (nexus) nexus.textContent = origN;
                    if (flow)  flow.textContent  = origF;
                    isAnimating = false;
                }, 520);
            }, 320);
        });
    }

    function initTabs() {
        const tabItems      = document.querySelectorAll('.tab-item');
        const contentPanels = document.querySelectorAll('.content-panel');

        if (!tabItems.length || !contentPanels.length) return;

        tabItems.forEach(tab => {
            const fresh = tab.cloneNode(true);
            tab.parentNode.replaceChild(fresh, tab);
        });

        const freshTabs = document.querySelectorAll('.tab-item');
        const titleEl   = document.querySelector('.feature-content .win-title-text');
        const statusEl  = document.querySelector('.feature-content .win-status-bar');
        const bodyEl    = document.querySelector('.term-panel-body');

        const labels = {
            performance: { title: 'DOMAINS.DAT',      status: 'LOADED — RESEARCH DOMAINS' },
            security:    { title: 'PUBLICATIONS.DAT', status: 'LOADED — PUBLICATIONS' },
            network:     { title: 'EVENTS.DAT',       status: 'LOADED — EVENTS' },
            analytics:   { title: 'HACKATHON.DAT',    status: 'LOADED — HACKATHON' },
            integration: { title: 'THESIS.DAT',       status: 'LOADED — THESIS TOPICS' },
        };

        freshTabs.forEach(tab => {
            if (!tab.querySelector('.tab-scan')) {
                const s = document.createElement('span');
                s.className = 'tab-scan';
                tab.appendChild(s);
            }

            tab.addEventListener('click', () => {
                const targetId = tab.getAttribute('data-tab');
                const target   = document.getElementById(targetId);
                if (!target || target.classList.contains('active')) return;

                // Scan flash on clicked tab
                tab.classList.remove('scanning');
                void tab.offsetWidth;
                tab.classList.add('scanning');
                setTimeout(() => tab.classList.remove('scanning'), 450);

                // Switch active panel
                freshTabs.forEach(t => t.classList.remove('active'));
                contentPanels.forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                target.classList.add('active');

                // Title bar + status update
                const meta = labels[targetId];
                if (meta && titleEl)  titleEl.textContent  = meta.title;
                if (meta && statusEl) statusEl.textContent = meta.status;
            });
        });
    }

    function initProfileCards() {
        document.querySelectorAll('.pricing-card[data-profile]').forEach(card => {
            card.addEventListener('click', () => {
                window.location.href = card.dataset.profile + '.html';
            });
        });
    }

    function init() {
        initTabs();
        initHeroLogoSwap();
        initProfileCards();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

}());
