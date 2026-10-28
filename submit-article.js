/* submit-article.js — terminal-styled visitor article submission modal.
   Picks up triggers via `[data-submit-trigger]` and talks to
   `${window.__BLOG_API_URL__}/api/submit-article` with multipart/form-data. */

(function () {
    const BACKEND = window.__BLOG_API_URL__ || '';
    const MAX_SIZE = 15 * 1024 * 1024;
    const ACCEPT   = '.md,.pdf,.zip';

    const MODAL_HTML = `
      <div class="sa-overlay" id="saOverlay" aria-hidden="true"></div>
      <div class="sa-modal" id="saModal" role="dialog" aria-modal="true" aria-label="Submit article" aria-hidden="true">
        <div class="sa-header">
          <span class="sa-prompt">▶_</span>
          <span class="sa-title">SIGNAL_CHANNEL://submit_article.sh</span>
          <button class="sa-close" id="saClose" aria-label="Close">×</button>
        </div>
        <form class="sa-body" id="saForm" enctype="multipart/form-data" novalidate>
          <div class="sa-field">
            <label for="saHandle">// enter_handle</label>
            <input type="text" id="saHandle" name="handle" required maxlength="80" placeholder="e.g. ry4n_m">
          </div>
          <div class="sa-field">
            <label for="saEmail">// enter_email</label>
            <input type="email" id="saEmail" name="email" required maxlength="254" placeholder="you@example.com">
          </div>
          <div class="sa-field">
            <label for="saTitle">// article_title</label>
            <input type="text" id="saTitle" name="title" required maxlength="200" placeholder="A short, descriptive title">
          </div>
          <div class="sa-field">
            <label for="saAbstract">// abstract <span class="sa-counter" id="saCounter">0 / 500</span></label>
            <textarea id="saAbstract" name="abstract" maxlength="500" rows="4" placeholder="One paragraph summary — what, why, how."></textarea>
          </div>
          <div class="sa-field sa-file-wrap">
            <label>// upload (.md / .pdf / .zip &mdash; max 15 MB)</label>
            <label class="sa-file-label">
              <span class="sa-file-cta">▶ Choose file…</span>
              <span class="sa-file-name" id="saFileName">none</span>
              <input type="file" id="saFile" name="file" accept="${ACCEPT}" required>
            </label>
          </div>
          <input type="text" name="_hp" id="saHp" class="sa-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
          <div class="sa-actions">
            <button type="submit" class="sa-submit" id="saSubmit">[ TRANSMIT ]</button>
          </div>
          <p class="sa-status" id="saStatus"></p>
        </form>
      </div>`;

    const STYLE = `
      .sa-overlay {
        position: fixed; inset: 0;
        background: rgba(0, 0, 0, 0.78);
        z-index: 11010;
        opacity: 0; visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        backdrop-filter: blur(4px);
      }
      .sa-overlay.open { opacity: 1; visibility: visible; }
      .sa-modal {
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -46%) scale(0.95);
        z-index: 11011;
        width: min(560px, calc(100vw - 2rem));
        max-height: calc(100vh - 4rem);
        overflow-y: auto;
        background: var(--darker-bg);
        border: 1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.45);
        box-shadow:
          0 0 60px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.14),
          inset 0 0 40px rgba(0, 0, 0, 0.3);
        clip-path: polygon(20px 0%, 100% 0%, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0% 100%, 0% 20px);
        opacity: 0; visibility: hidden;
        transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1);
      }
      .sa-modal.open {
        opacity: 1; visibility: visible;
        transform: translate(-50%, -50%) scale(1);
      }
      .sa-header {
        display: flex; align-items: center;
        padding: 10px 16px;
        border-bottom: 1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3);
        background: linear-gradient(90deg,
          rgba(var(--chrome-r), var(--chrome-g), var(--chrome-b), 0.75) 0%,
          rgba(0, 0, 0, 0.95) 100%);
        gap: 10px;
      }
      .sa-prompt { color: var(--primary-cyan); font-weight: 700; }
      .sa-title {
        flex: 1; font-size: 0.72rem; letter-spacing: 2px; text-transform: uppercase;
        color: var(--text-primary);
      }
      .sa-close {
        background: transparent; border: 1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.4);
        color: var(--text-secondary); font-size: 1rem; cursor: pointer;
        width: 24px; height: 24px; line-height: 1; padding: 0;
      }
      .sa-close:hover { color: var(--primary-pink); border-color: var(--primary-pink); }

      .sa-body { padding: 22px 24px 20px; display: flex; flex-direction: column; gap: 16px; }
      .sa-field { display: flex; flex-direction: column; gap: 6px; }
      .sa-field label {
        font-size: 0.7rem; letter-spacing: 1.5px; text-transform: lowercase;
        color: rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.75);
        display: flex; justify-content: space-between; align-items: center;
      }
      .sa-counter { color: var(--text-secondary); font-size: 0.65rem; }
      .sa-field input[type="text"],
      .sa-field input[type="email"],
      .sa-field textarea {
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3);
        color: var(--text-primary);
        padding: 0.65rem 0.85rem;
        font-family: inherit; font-size: 0.85rem;
        outline: none; width: 100%;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .sa-field input:focus,
      .sa-field textarea:focus {
        border-color: var(--primary-cyan);
        box-shadow: 0 0 10px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.2);
      }
      .sa-field textarea { resize: vertical; min-height: 90px; max-height: 220px; }

      .sa-file-label {
        display: flex; align-items: center; justify-content: space-between;
        gap: 10px; padding: 0.65rem 0.85rem;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3);
        cursor: pointer; position: relative;
      }
      .sa-file-cta { color: var(--primary-cyan); font-size: 0.78rem; letter-spacing: 1.5px; }
      .sa-file-name { color: var(--text-secondary); font-size: 0.72rem; flex: 1; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .sa-file-label input[type="file"] { position: absolute; opacity: 0; width: 100%; height: 100%; left: 0; top: 0; cursor: pointer; }

      .sa-hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }

      .sa-actions { margin-top: 4px; }
      .sa-submit {
        background: linear-gradient(135deg, rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.18), rgba(var(--accent2-r), var(--accent2-g), var(--accent2-b), 0.14));
        color: var(--primary-cyan);
        border: 1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.55);
        padding: 0.65rem 1.4rem;
        letter-spacing: 2px;
        font-family: inherit; font-size: 0.78rem; font-weight: 700;
        text-transform: uppercase; cursor: pointer;
        clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%);
        transition: all 0.25s ease;
      }
      .sa-submit:hover {
        box-shadow: 0 0 18px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.3);
        color: var(--text-primary);
      }
      .sa-submit:disabled { opacity: 0.6; cursor: progress; }

      .sa-status { font-size: 0.72rem; min-height: 1.2em; letter-spacing: 1px; margin: 0; }
      .sa-status.ok  { color: #39ff14; }
      .sa-status.err { color: var(--primary-pink); }

      .sa-trigger {
        display: inline-flex; align-items: center; gap: 8px;
        background: rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.05);
        border: 1px solid rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.4);
        color: var(--primary-cyan);
        font-family: inherit; font-size: 0.72rem;
        letter-spacing: 2px; text-transform: uppercase;
        padding: 0.65rem 1.4rem; cursor: pointer;
        clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
        transition: border-color 0.25s ease, color 0.25s ease, background 0.25s ease, transform 0.25s ease;
        text-decoration: none;
        animation: sa-trigger-breathe 2.8s ease-in-out infinite;
      }
      .sa-trigger:hover,
      .sa-trigger:focus-visible {
        border-color: var(--primary-cyan);
        color: var(--text-primary);
        background: rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.12);
        box-shadow: 0 0 22px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.28);
        transform: translateY(-1px);
        animation: none;
        outline: none;
      }
      @keyframes sa-trigger-breathe {
        0%, 100% { box-shadow: 0 0 8px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.06); }
        50%      { box-shadow: 0 0 18px rgba(var(--accent-r), var(--accent-g), var(--accent-b), 0.18); }
      }
      @media (prefers-reduced-motion: reduce) {
        .sa-trigger { animation: none; }
      }

      @media (max-width: 480px) {
        .sa-modal { width: calc(100vw - 1rem); }
        .sa-body  { padding: 18px 16px 16px; }
      }`;

    function inject() {
        if (document.getElementById('saModal')) return;
        const style = document.createElement('style');
        style.textContent = STYLE;
        document.head.appendChild(style);

        const wrap = document.createElement('div');
        wrap.innerHTML = MODAL_HTML;
        while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

        const overlay = document.getElementById('saOverlay');
        const modal   = document.getElementById('saModal');
        const close   = document.getElementById('saClose');
        const form    = document.getElementById('saForm');
        const status  = document.getElementById('saStatus');
        const submit  = document.getElementById('saSubmit');
        const fileIn  = document.getElementById('saFile');
        const fileLbl = document.getElementById('saFileName');
        const abstract = document.getElementById('saAbstract');
        const counter  = document.getElementById('saCounter');

        function open() {
            overlay.classList.add('open');
            modal.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
            modal.setAttribute('aria-hidden', 'false');
            setTimeout(() => document.getElementById('saHandle').focus(), 60);
        }
        function hide() {
            overlay.classList.remove('open');
            modal.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
            modal.setAttribute('aria-hidden', 'true');
        }
        close.addEventListener('click', hide);
        overlay.addEventListener('click', hide);
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) hide(); });

        document.querySelectorAll('[data-submit-trigger]').forEach(el => {
            el.addEventListener('click', (e) => { e.preventDefault(); open(); });
        });

        fileIn.addEventListener('change', () => {
            const f = fileIn.files[0];
            if (!f) { fileLbl.textContent = 'none'; return; }
            if (f.size > MAX_SIZE) {
                fileLbl.textContent = 'FILE TOO LARGE (>15 MB)';
                fileIn.value = '';
                return;
            }
            fileLbl.textContent = `${f.name} — ${(f.size / 1024).toFixed(1)} KB`;
        });

        abstract.addEventListener('input', () => {
            counter.textContent = `${abstract.value.length} / 500`;
        });

        function setStatus(cls, msg) {
            status.className = 'sa-status' + (cls ? ' ' + cls : '');
            status.textContent = msg;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            setStatus('', '// transmitting…');
            submit.disabled = true;
            submit.textContent = '[ TRANSMITTING… ]';

            try {
                const fd = new FormData(form);
                const res = await fetch(`${BACKEND}/api/submit-article`, { method: 'POST', body: fd });
                let data = {};
                try { data = await res.json(); } catch {}
                if (res.ok) {
                    setStatus('ok', '// transmitted — thank you. we will review.');
                    form.reset();
                    fileLbl.textContent = 'none';
                    counter.textContent = '0 / 500';
                    setTimeout(() => { if (modal.classList.contains('open')) hide(); }, 2200);
                } else if (res.status === 429) {
                    setStatus('err', '// rate limit — try again later');
                } else {
                    setStatus('err', `// error: ${data.error || res.statusText || 'unknown'}`);
                }
            } catch (err) {
                setStatus('err', '// network error — ' + err.message);
            } finally {
                submit.disabled = false;
                submit.textContent = '[ TRANSMIT ]';
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
})();
