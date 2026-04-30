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

    // Sparse: ~10 columns across the full width, placed randomly
    const count = Math.max(6, Math.floor(window.innerWidth / 180));

    for (let i = 0; i < count; i++) {
        const col = document.createElement('div');
        col.className = 'matrix-column';
        col.style.left  = `${(i / count) * 90 + Math.random() * (90 / count)}%`;
        col.style.animationDuration = `${Math.random() * 14 + 22}s`;   // 22–36s slow fall
        col.style.animationDelay    = `${Math.random() * 40}s`;         // 0–40s stagger → rare

        col.textContent = FORMULAS[Math.floor(Math.random() * FORMULAS.length)];
        matrixRain.appendChild(col);
    }
}

function generateParticles() {
    const particlesContainer = document.getElementById('particlesContainer');
    if (!particlesContainer) return;
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 20}s`;
        particle.style.animationDuration = `${Math.random() * 10 + 20}s`;
        particlesContainer.appendChild(particle);
    }
}

function generateDataStreams() {
    const dataStreams = document.getElementById('dataStreams');
    if (!dataStreams) return;
    for (let i = 0; i < 10; i++) {
        const stream = document.createElement('div');
        stream.className = 'data-stream';
        stream.style.top = `${Math.random() * 100}%`;
        stream.style.left = `-300px`;
        stream.style.animationDelay = `${Math.random() * 5}s`;
        stream.style.transform = `rotate(${Math.random() * 30 - 15}deg)`;
        dataStreams.appendChild(stream);
    }
}

// Initial Call
generateMatrixRain();
generateParticles();
generateDataStreams();

window.addEventListener('resize', () => {
    const matrixRain = document.getElementById('matrixRain');
    if (matrixRain) {
        matrixRain.innerHTML = '';
        generateMatrixRain();
    }
});

/* ==========================================================
   INTERACTIVE MOUSE EFFECTS
   ========================================================== */
document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    const orbs = document.querySelectorAll('.orb');
    orbs.forEach((orb, index) => {
        const speed = (index + 1) * 0.02;
        const x = (mouseX - window.innerWidth / 2) * speed;
        const y = (mouseY - window.innerHeight / 2) * speed;
        orb.style.transform = `translate(${x}px, ${y}px)`;
    });

    if (window.innerWidth > 768) {
        const particles = document.querySelectorAll('.particle');
        particles.forEach(particle => {
            const rect = particle.getBoundingClientRect();
            const distance = Math.sqrt(Math.pow(mouseX - (rect.left + rect.width / 2), 2) + Math.pow(mouseY - (rect.top + rect.height / 2), 2));
            if (distance < 150) {
                const brightness = 1 - (distance / 150);
                particle.style.boxShadow = `0 0 ${20 + brightness * 30}px rgba(0, 255, 255, ${0.5 + brightness * 0.5})`;
                particle.style.transform = `scale(${1 + brightness * 0.5})`;
            } else {
                particle.style.boxShadow = '';
                particle.style.transform = '';
            }
        });
    }
});

// Cursor Glow Overlay
if (window.innerWidth > 768) {
    const cursorGlow = document.createElement('div');
    cursorGlow.style.cssText = `position: fixed; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(0, 255, 255, 0.1) 0%, transparent 70%); pointer-events: none; z-index: 9999; transform: translate(-50%, -50%); transition: opacity 0.3s ease; opacity: 0;`;
    document.body.appendChild(cursorGlow);
    document.addEventListener('mousemove', (e) => {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
        cursorGlow.style.opacity = '1';
    });
    document.addEventListener('mouseleave', () => cursorGlow.style.opacity = '0');
}

/* ==========================================================
   UI UTILITIES (Smooth Scroll, Tabs, Fade-In)
   ========================================================== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href === '#top' ? 'body' : href);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// Tabs
const tabs = document.querySelectorAll('.tab-item');
const panels = document.querySelectorAll('.content-panel');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
    });
});

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
    const randomText = cyberTexts[Math.floor(Math.random() * cyberTexts.length)];
    const tempElement = document.createElement('div');
    tempElement.textContent = randomText;
    tempElement.style.cssText = `position: fixed; top: ${Math.random() * 100}vh; left: ${Math.random() * 100}vw; color: var(--primary-cyan); font-size: 0.8rem; font-weight: 700; z-index: 1000; opacity: 0.7; pointer-events: none; animation: fadeOut 3s ease-out forwards; text-shadow: 0 0 10px var(--primary-cyan);`;
    document.body.appendChild(tempElement);
    setTimeout(() => tempElement.remove(), 3000);
}, 5000);

// Global Styles for Cyber Text
const style = document.createElement('style');
style.textContent = `@keyframes fadeOut { 0% { opacity: 0.7; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-50px); } }`;
document.head.appendChild(style);


/* ==========================================================
   ENHANCED SMOOTH SCROLL — nav flash line on click
   ========================================================== */
document.querySelectorAll('a[href^="#"], .mobile-menu-nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', () => {
        // Spawn flash line
        const flash = document.createElement('div');
        flash.className = 'nav-flash-line';
        document.body.appendChild(flash);
        flash.addEventListener('animationend', () => flash.remove());

        // Pulse the target section
        const href = anchor.getAttribute('href');
        if (href && href.length > 1 && href !== '#top') {
            const target = document.querySelector(href);
            if (target) {
                target.classList.remove('section-targeted');
                void target.offsetWidth;
                target.classList.add('section-targeted');
                setTimeout(() => target.classList.remove('section-targeted'), 1300);
            }
        }
    });
});

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

    const THEMES = {
        cyber:       { bg: '#0f051a', accent1: '#00ffff',  accent2: '#ff00ff' },
        'pink-blood':{ bg: '#050007', accent1: '#f17e97',  accent2: '#CE0D3C' },
        temerald:    { bg: '#121111', accent1: '#4ade7f',  accent2: '#d4953b' },
        neovoid:     { bg: '#000000', accent1: '#00BFFF',  accent2: '#FF0040' },
        eva01:       { bg: '#0d0020', accent1: '#adff2f',  accent2: '#7c4dff' },
        catppuccin:  { bg: '#181825', accent1: '#89b4fa',  accent2: '#cba6f7' },
        aura:        { bg: '#15161e', accent1: '#CBC3E3',  accent2: '#FFAFCC' },
        caroline:    { bg: '#1a0e0b', accent1: '#d4879d',  accent2: '#e07d44' },
    };

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

        // Update cursor glow color (injected by existing JS, hard-coded rgba)
        const t = THEMES[name] || THEMES.cyber;
        const glowEl = document.querySelector('div[style*="radial-gradient(circle, rgba(0, 255, 255"]');
        if (glowEl) {
            const r = parseInt(t.accent1.slice(1,3),16);
            const g = parseInt(t.accent1.slice(3,5),16);
            const b = parseInt(t.accent1.slice(5,7),16);
            glowEl.style.background = `radial-gradient(circle, rgba(${r},${g},${b},0.1) 0%, transparent 70%)`;
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
    if (saved && THEMES[saved]) applyTheme(saved);

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