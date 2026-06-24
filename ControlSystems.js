/* ==========================================================
   MOBILE MENU FUNCTIONALITY
   ========================================================== */
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu-nav a');
    const mobileMenuCta = document.querySelector('.mobile-menu-cta');
    const mobileMenuCtaButton = document.querySelector('.mobile-menu-cta a');
    const mobileMenuLogo = document.querySelector('.mobile-menu-logo');

    if (!mobileMenuBtn || !mobileMenu || !mobileMenuOverlay || !mobileMenuClose) return;

    function openMobileMenu() {
        mobileMenuBtn.classList.add('active');
        mobileMenu.classList.add('active');
        mobileMenuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        mobileMenuLinks.forEach((link, index) => {
            if (link) {
                link.style.animation = 'none';
                link.style.opacity = '0';
                link.style.transform = 'translateX(20px)';
                setTimeout(() => {
                    link.style.animation = `slideInLeft 0.4s ease forwards`;
                }, 250 + (index * 100));
            }
        });
        
        if (mobileMenuCta) {
            mobileMenuCta.style.animation = 'none';
            mobileMenuCta.style.opacity = '0';
            mobileMenuCta.style.transform = 'translateY(20px)';
            setTimeout(() => {
                mobileMenuCta.style.animation = 'slideInUp 0.4s ease forwards';
            }, 100);
        }
    }

    function closeMobileMenu() {
        mobileMenuBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    mobileMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        mobileMenu.classList.contains('active') ? closeMobileMenu() : openMobileMenu();
    });

    mobileMenuClose.addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileMenu();
    });
    
    mobileMenuOverlay.addEventListener('click', closeMobileMenu);
    mobileMenuLinks.forEach(link => link.addEventListener('click', closeMobileMenu));

    if (mobileMenuCtaButton) {
        mobileMenuCtaButton.addEventListener('click', (e) => {
            if (mobileMenuCtaButton.getAttribute('href') === '#') e.preventDefault();
            closeMobileMenu();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) closeMobileMenu();
    });
}

// Init Menu
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMobileMenu);
} else {
    initializeMobileMenu();
}

/* ==========================================================
   BACKGROUND EFFECTS (Matrix, Particles, Streams)
   ========================================================== */
function generateMatrixRain() {
    const matrixRain = document.getElementById('matrixRain');
    if (!matrixRain) return;

    const FORMULAS = [
        // Physics
        'E=mc²', 'F=ma', 'Ĥψ=Eψ', 'ΔxΔp≥ℏ/2', 'S=k·lnΩ',
        'E=ℏω', '∇×B=μ₀J', '∇·E=ρ/ε₀', 'ds²=-c²dt²+dx²',
        // Pure Math
        'e^(iπ)+1=0', '∑1/n²=π²/6', '∫e^(-x²)dx=√π/2',
        'lim(1+1/n)^n=e', '∀ε∃δ:|f(x)-L|<ε',
        'det(AB)=det(A)·det(B)', '∮F·ds=∬(∇×F)·dA',
        // Statistics
        'P(A|B)=P(B|A)P(A)/P(B)', 'X~N(μ,σ²)',
        'σ²=E[(X-μ)²]', 'ρ=Cov(X,Y)/σₓσᵧ',
        'CLT:X̄→N(μ,σ²/n)', 'H(X)=-∑p·log₂p',
        // CS / Algorithms
        'O(n·logn)', 'T(n)=2T(n/2)+n', 'P≠NP?',
        'VC-dim(H)<∞', 'MinCut=MaxFlow',
        // Deep Learning
        'L=-∑yᵢ·log(ŷᵢ)', 'θ←θ-α∇θL',
        'aˡ=σ(Wˡaˡ⁻¹+bˡ)', 'softmax(xᵢ)=eˣⁱ/∑eˣʲ',
        'Attn=softmax(QKᵀ/√d)V', '||W||₂→regularize',
        // Control Systems
        'ẋ=Ax+Bu', 'y=Cx+Du', 'G(s)=C(sI-A)⁻¹B',
        'det(sI-A)=0', 'K=LQR(A,B,Q,R)',
        'J=∫(xᵀQx+uᵀRu)dt', 'PM=arg(G(jω))+180°',
    ];

    const count = Math.max(6, Math.floor(window.innerWidth / 180));
    const frag = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
        const col = document.createElement('div');
        col.className = 'matrix-column';
        col.style.left  = `${(i / count) * 90 + Math.random() * (90 / count)}%`;
        col.style.animationDuration = `${Math.random() * 14 + 22}s`;
        col.style.animationDelay    = `${Math.random() * 40}s`;
        col.textContent = FORMULAS[Math.floor(Math.random() * FORMULAS.length)];
        frag.appendChild(col);
    }
    matrixRain.appendChild(frag);
}

function generateParticles() {
    const particlesContainer = document.getElementById('particlesContainer');
    if (!particlesContainer) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 20}s`;
        particle.style.animationDuration = `${Math.random() * 10 + 20}s`;
        frag.appendChild(particle);
    }
    particlesContainer.appendChild(frag);
}

function generateDataStreams() {
    const dataStreams = document.getElementById('dataStreams');
    if (!dataStreams) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 10; i++) {
        const stream = document.createElement('div');
        stream.className = 'data-stream';
        stream.style.top = `${Math.random() * 100}%`;
        stream.style.left = `-300px`;
        stream.style.animationDelay = `${Math.random() * 5}s`;
        stream.style.transform = `rotate(${Math.random() * 30 - 15}deg)`;
        frag.appendChild(stream);
    }
    dataStreams.appendChild(frag);
}

// Initial Call
generateMatrixRain();
generateParticles();
generateDataStreams();

window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
        const matrixRain = document.getElementById('matrixRain');
        if (matrixRain) {
            matrixRain.innerHTML = '';
            generateMatrixRain();
        }
    }, 200);
});

/* ==========================================================
   INTERACTIVE MOUSE EFFECTS
   ========================================================== */
let _mouseX = 0, _mouseY = 0, _rafPending = false, _resizeTimer;

const cursorGlow = window.innerWidth > 768
    ? (() => { const el = document.createElement('div'); el.className = 'cursor-glow'; document.body.appendChild(el); return el; })()
    : null;

function _applyMouseEffects() {
    _rafPending = false;
    const mouseX = _mouseX, mouseY = _mouseY;

    document.querySelectorAll('.orb').forEach((orb, index) => {
        const speed = (index + 1) * 0.02;
        orb.style.transform = `translate(${(mouseX - window.innerWidth / 2) * speed}px, ${(mouseY - window.innerHeight / 2) * speed}px)`;
    });

    if (cursorGlow) {
        cursorGlow.style.transform = `translate(${mouseX - 200}px, ${mouseY - 200}px)`;
        cursorGlow.style.opacity = '1';
    }
}

document.addEventListener('mousemove', (e) => {
    _mouseX = e.clientX;
    _mouseY = e.clientY;
    if (!_rafPending) { _rafPending = true; requestAnimationFrame(_applyMouseEffects); }
});
document.addEventListener('mouseleave', () => { if (cursorGlow) cursorGlow.style.opacity = '0'; });

/* ==========================================================
   UI UTILITIES (Smooth Scroll, Tabs, Fade-In)
   ========================================================== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href.length <= 1) return;

        e.preventDefault();

        const scrollTarget = document.querySelector(href === '#top' ? 'body' : href);
        if (scrollTarget) scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });

        const flash = document.createElement('div');
        flash.className = 'nav-flash-line';
        document.body.appendChild(flash);
        flash.addEventListener('animationend', () => flash.remove());

        if (href !== '#top') {
            const pulseTarget = document.querySelector(href);
            if (pulseTarget) {
                pulseTarget.classList.remove('section-targeted');
                void pulseTarget.offsetWidth;
                pulseTarget.classList.add('section-targeted');
                setTimeout(() => pulseTarget.classList.remove('section-targeted'), 1300);
            }
        }
    });
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));


/* ==========================================================
   FORM TRANSMISSION (NETLIFY + DISCORD)
   ========================================================== */
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerText;
        
        // UI Feedback: Start upload
        submitBtn.innerText = "INITIALIZING TRANSMISSION...";
        submitBtn.disabled = true;

        const formData = new FormData(contactForm);
        const data = new URLSearchParams();
        for (const pair of formData) {
            data.append(pair[0], pair[1]);
        }
        data.append("form-name", "contact");

        try {
            const response = await fetch("/", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: data.toString()
            });

            if (response.ok) {
                submitBtn.innerText = "TRANSMISSION SUCCESSFUL";
                submitBtn.style.color = "var(--primary-cyan)";
                contactForm.reset();

                // 60 Second Cooldown
                setTimeout(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.color = "";
                }, 60000);
            } else {
                throw new Error('Relay Failure');
            }
        } catch (err) {
            submitBtn.innerText = "ERROR: RELAY OFFLINE";
            setTimeout(() => {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }, 5000);
        }
    });
}

/* ==========================================================
   CYBER TEXT RANDOMIZER
   ========================================================== */
const cyberTexts = ['R&D...', 'DATA SCIENCE', 'INDUSTRIAL REVOLUTIONS', 'NEURO-SYMBOLICS', 'SYSTEM ARCHITECTURE', 'NEUROMORPHIC COMPUTING', 'COMPUTER SCIENCE', 'ROBOTICS', 'CONTROL THEORY', 'MACHINE LEARNING', 'DIGITAL TWINS','ADAPTIVE CONTROL', 'TEMPLE OS', 'DIGITAL PHENOTYPES'];

setInterval(() => {
    const el = document.createElement('div');
    el.className = 'cyber-float-text';
    el.textContent = cyberTexts[Math.floor(Math.random() * cyberTexts.length)];
    el.style.top  = `${Math.random() * 100}vh`;
    el.style.left = `${Math.random() * 100}vw`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}, 5000);


/* ── Smooth scroll + nav flash merged above ─────────────── */

/* ==========================================================
   WIN-PANEL BOOT SEQUENCE — animate on viewport entry
   ========================================================== */
(function initWinPanelBoot() {
    const panels = document.querySelectorAll(
        '.feature-tabs.win-panel, .feature-content.win-panel, .pricing-card.win-panel, .contact-form.win-panel, .contact-info.win-panel'
    );

    const bootObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('booted')) {
                entry.target.classList.add('booted');
                bootObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    panels.forEach(p => bootObserver.observe(p));
})();

/* ==========================================================
   THEME SWITCHER
   ========================================================== */
(function initThemeSwitcher() {
    const toggleBtn  = document.getElementById('themeToggleBtn');
    const panel      = document.getElementById('themePanel');
    const overlay    = document.getElementById('themeOverlay');
    const closeBtn   = document.getElementById('themePanelClose');
    const cards      = document.querySelectorAll('.theme-card');

    if (!toggleBtn || !panel || !overlay) return;


    function openPanel() {
        panel.classList.add('open');
        overlay.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
        toggleBtn.setAttribute('aria-expanded', 'true');
    }

    function closePanel() {
        panel.classList.remove('open');
        overlay.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
        toggleBtn.setAttribute('aria-expanded', 'false');
    }

    function applyTheme(name) {
        // Strip all theme classes
        document.body.classList.forEach(cls => {
            if (cls.startsWith('theme-')) document.body.classList.remove(cls);
        });

        if (name !== 'cyber') {
            document.body.classList.add(`theme-${name}`);
        }

        // Mark active card
        cards.forEach(c => c.classList.toggle('is-active', c.dataset.theme === name));

        // Update status bar
        const statusEl = panel.querySelector('.win-status-bar');
        if (statusEl) statusEl.textContent = `THEME APPLIED: ${name.toUpperCase()}`;

        localStorage.setItem('cs-theme', name);
    }

    // Restore saved theme
    const saved = localStorage.getItem('cs-theme');
    if (saved) applyTheme(saved);

    toggleBtn.addEventListener('click', () => {
        panel.classList.contains('open') ? closePanel() : openPanel();
    });

    if (closeBtn)  closeBtn.addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });

    cards.forEach(card => {
        card.addEventListener('click', () => {
            applyTheme(card.dataset.theme);
        });
    });
})();

/* ── Staff Directory Help Panel ────────────────────────────────────────── */
(function initHelpPanel() {
    const btn = document.getElementById('staffHelpBtn');
    if (!btn) return;

    const LINES = [
        { cls: 'help-prompt', text: '$ help --staff-directory' },
        { cls: 'help-heading', text: '// HOW TO REACH US' },
        { cls: '', text: 'Use the contact form on the left.' },
        { cls: '', text: 'Include your name, subject & message.' },
        { cls: 'help-heading', text: '// OFFICE HOURS' },
        { cls: '', text: 'Mon\u2013Fri · 10:00\u201314:00 (local time).' },
        { cls: '', text: 'Medev: by appointment (currently away).' },
        { cls: 'help-heading', text: '// WHAT TO INCLUDE' },
        { cls: '', text: 'Course / topic, student ID if applicable.' },
        { cls: 'help-prompt', text: '$ _' },
    ];

    const panel = document.createElement('div');
    panel.className = 'help-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Staff Directory Help');
    panel.innerHTML = `
        <div class="help-panel-bar">
            <span class="help-panel-title">HELP.DAT — staff/directory</span>
            <button class="help-panel-close" aria-label="Close">×</button>
        </div>
        <div class="help-panel-body">
            ${LINES.map(l => `<span class="help-line${l.cls ? ' ' + l.cls : ''}">${l.text}</span>`).join('\n')}
        </div>`;

    document.body.appendChild(panel);

    const closeBtn = panel.querySelector('.help-panel-close');
    let typeTimers = [];

    function positionPanel() {
        const r = btn.getBoundingClientRect();
        const pw = 340;
        let left = r.left;
        if (left + pw > window.innerWidth - 16) left = window.innerWidth - pw - 16;
        panel.style.left  = left + 'px';
        panel.style.top   = (r.bottom + 10) + 'px';
    }

    function clearTimers() {
        typeTimers.forEach(id => clearTimeout(id));
        typeTimers = [];
    }

    function reveal() {
        positionPanel();
        panel.classList.add('visible');
        const lines = panel.querySelectorAll('.help-line');
        lines.forEach(l => l.classList.remove('revealed'));
        clearTimers();
        lines.forEach((l, i) => {
            typeTimers.push(setTimeout(() => l.classList.add('revealed'), i * 110));
        });
    }

    function hide() {
        panel.classList.remove('visible');
        clearTimers();
    }

    let open = false;

    btn.addEventListener('click', e => {
        e.stopPropagation();
        open = !open;
        open ? reveal() : hide();
    });

    closeBtn.addEventListener('click', e => {
        e.stopPropagation();
        open = false;
        hide();
    });

    document.addEventListener('click', e => {
        if (open && !panel.contains(e.target) && e.target !== btn) {
            open = false;
            hide();
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && open) { open = false; hide(); }
    });
})();

/* ── Language Toggle ─────────────────────────────────────────── */
(function initLangToggle() {
    const btn   = document.getElementById('langToggle');
    const optEN = document.getElementById('langEN');
    const optBG = document.getElementById('langBG');
    if (!btn || !optEN || !optBG) return;

    let current = localStorage.getItem('cs-lang') || 'EN';

    function applyLang(lang) {
        current = lang;
        optEN.classList.toggle('lang-active', lang === 'EN');
        optBG.classList.toggle('lang-active', lang === 'BG');
        localStorage.setItem('cs-lang', lang);
        document.documentElement.lang = lang === 'BG' ? 'bg' : 'en';
    }

    applyLang(current);

    btn.addEventListener('click', () => {
        const next = current === 'EN' ? 'BG' : 'EN';
        btn.classList.add('glitching');
        btn.addEventListener('animationend', () => btn.classList.remove('glitching'), { once: true });
        applyLang(next);
    });
})();

/* ── Blog Portal ─────────────────────────────────────────────── */
(function initBlogPortal() {
    const openBtn  = document.getElementById('blogOpenBtn');
    const portal   = document.getElementById('blogPortal');
    const overlay  = document.getElementById('blogPortalOverlay');
    const closeBtn = document.getElementById('blogPortalClose');
    const subEmail = document.getElementById('blogSubEmail');
    const subBtn   = document.getElementById('blogSubBtn');
    const subStatus= document.getElementById('blogSubStatus');

    if (!openBtn || !portal || !overlay) return;

    const BACKEND = window.__BLOG_API_URL__ || '';

    function openPortal() {
        portal.classList.add('open');
        overlay.classList.add('open');
        portal.setAttribute('aria-hidden', 'false');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => { if (subEmail) subEmail.focus(); }, 350);
    }

    function closePortal() {
        portal.classList.remove('open');
        overlay.classList.remove('open');
        portal.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', openPortal);
    closeBtn.addEventListener('click', closePortal);
    overlay.addEventListener('click', closePortal);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && portal.classList.contains('open')) closePortal();
    });

    if (subBtn) {
        subBtn.addEventListener('click', async () => {
            const email = subEmail ? subEmail.value.trim() : '';
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setStatus('err', 'INVALID EMAIL FORMAT');
                return;
            }

            subBtn.disabled = true;
            subBtn.textContent = 'SYNCING…';

            try {
                const res = await fetch(`${BACKEND}/api/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                if (res.ok) {
                    setStatus('ok', 'SIGNAL LOCKED — SUBSCRIBED');
                    if (subEmail) subEmail.value = '';
                    setTimeout(() => setStatus('', ''), 5000);
                } else {
                    const d = await res.json().catch(() => ({}));
                    setStatus('err', d.error || 'RELAY ERROR — TRY AGAIN');
                }
            } catch {
                setStatus('err', 'BACKEND OFFLINE — CHECK CONNECTION');
            } finally {
                subBtn.disabled = false;
                subBtn.textContent = 'SYNC';
            }
        });
    }

    function setStatus(cls, msg) {
        if (!subStatus) return;
        subStatus.className = 'blog-sub-status' + (cls ? ' ' + cls : '');
        subStatus.textContent = msg;
    }
})();