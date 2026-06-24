/* blog.js — fetch posts, render list & detail */

const BACKEND = window.__BLOG_API_URL__ || '';

/* ── Minimal markdown renderer (no external deps) ────────────── */
function renderMarkdown(md) {
    let html = md
        // fenced code blocks
        .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
            `<pre><code class="lang-${lang}">${escHtml(code.trim())}</code></pre>`)
        // inline code
        .replace(/`([^`]+)`/g, (_, c) => `<code>${escHtml(c)}</code>`)
        // headings
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // blockquotes
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        // horizontal rule
        .replace(/^---$/gm, '<hr>')
        // bold + italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // images (before links)
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
        // links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        // unordered lists (simple single-level)
        .replace(/((?:^- .+\n?)+)/gm, (block) => {
            const items = block.trim().split('\n').map(l => `<li>${l.slice(2)}</li>`).join('');
            return `<ul>${items}</ul>`;
        })
        // ordered lists
        .replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
            const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
            return `<ol>${items}</ol>`;
        })
        // paragraphs — wrap double-newline-separated blocks that aren't already tags
        .split(/\n{2,}/)
        .map(chunk => {
            chunk = chunk.trim();
            if (!chunk) return '';
            if (/^<(h[1-6]|ul|ol|pre|blockquote|hr|img)/.test(chunk)) return chunk;
            return `<p>${chunk.replace(/\n/g, '<br>')}</p>`;
        })
        .join('\n');

    return typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : html;
}

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── Fetch with 5 s timeout + 1 retry ───────────────────────── */
async function fetchWithRetry(url, attempt = 0) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(timer);
        return res;
    } catch (err) {
        clearTimeout(timer);
        if (attempt === 0) {
            await new Promise(r => setTimeout(r, 2000));
            return fetchWithRetry(url, 1);
        }
        throw err;
    }
}

/* ── Status bar ──────────────────────────────────────────────── */
const statusBar  = document.getElementById('blogStatusBar');
const statusText = document.getElementById('blogStatusText');

function setStatus(state, msg) {
    if (!statusBar || !statusText) return;
    statusBar.className = 'blog-status-bar' + (state ? ' ' + state : '');
    statusText.textContent = msg;
}

/* ── Format ISO date ─────────────────────────────────────────── */
function fmtDate(iso) {
    try {
        return new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return iso;
    }
}

/* ── Attachment icon by extension ────────────────────────────── */
function attachIcon(filename) {
    const ext = (filename.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf')               return 'ti ti-file-type-pdf';
    if (['zip','tar','gz'].includes(ext)) return 'ti ti-file-zip';
    if (['png','jpg','jpeg','webp'].includes(ext)) return 'ti ti-photo';
    if (ext === 'md')                return 'ti ti-markdown';
    return 'ti ti-file-download';
}

/* ── Views ───────────────────────────────────────────────────── */
const listSection   = document.getElementById('blogListSection');
const detailSection = document.getElementById('blogDetailSection');
const blogGrid      = document.getElementById('blogGrid');
const blogEmpty     = document.getElementById('blogEmpty');
const backBtn       = document.getElementById('blogBackBtn');
const articleMeta   = document.getElementById('blogArticleMeta');
const articleTitle  = document.getElementById('blogArticleTitle');
const articleBody   = document.getElementById('blogArticleBody');
const articleAttach = document.getElementById('blogArticleAttachments');

function showList() {
    listSection.hidden   = false;
    detailSection.hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.replaceState(null, '', location.pathname);
}

function showDetail(post) {
    listSection.hidden   = true;
    detailSection.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    articleMeta.textContent  = fmtDate(post.date);
    articleTitle.textContent = post.title;
    articleBody.innerHTML    = renderMarkdown(post.content || '');

    if (post.attachments && post.attachments.length > 0) {
        articleAttach.hidden = false;
        articleAttach.innerHTML = `
            <p class="blog-attachments-title">// Attachments</p>
            <ul class="blog-attachment-list">
                ${post.attachments.map(a => `
                    <li>
                        <a href="${BACKEND}/uploads/${escHtml(a.file)}"
                           class="blog-attachment-link"
                           download="${escHtml(a.name)}"
                           target="_blank" rel="noopener">
                            <i class="${attachIcon(a.file)}"></i>
                            ${escHtml(a.name)}
                        </a>
                    </li>`).join('')}
            </ul>`;
    } else {
        articleAttach.hidden = true;
        articleAttach.innerHTML = '';
    }

    history.replaceState(null, '', `?post=${post.slug}`);
}

if (backBtn) {
    backBtn.addEventListener('click', () => {
        showList();
        if (blogGrid && blogGrid.children.length === 0) loadPosts();
    });
}

/* ── Build post card ─────────────────────────────────────────── */
function buildCard(post) {
    const card = document.createElement('article');
    card.className = 'blog-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Read: ${post.title}`);

    const imgHtml = post.cover
        ? `<img src="${BACKEND}/uploads/${escHtml(post.cover)}" alt="${escHtml(post.title)}" class="blog-card-image" loading="lazy">`
        : '';

    card.innerHTML = `
        ${imgHtml}
        <div class="blog-card-body">
            <span class="blog-card-date">${fmtDate(post.date)}</span>
            <h2 class="blog-card-title">${escHtml(post.title)}</h2>
            <p class="blog-card-excerpt">${escHtml(post.excerpt || '')}</p>
        </div>
        <div class="blog-card-footer">
            <span>${(post.tags || []).map(t => `#${escHtml(t)}`).join(' ')}</span>
            <span class="blog-card-read">READ ──►</span>
        </div>`;

    const open = () => loadAndShow(post.slug);
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });

    return card;
}

/* ── Load full post and show detail ──────────────────────────── */
async function loadAndShow(slug) {
    setStatus('', `LOADING POST: ${slug.toUpperCase()}`);
    try {
        const res = await fetchWithRetry(`${BACKEND}/api/posts/${slug}`);
        if (!res.ok) throw new Error(res.status);
        const post = await res.json();
        showDetail(post);
        setStatus('ok', `POST LOADED — ${slug.toUpperCase()}`);
    } catch (err) {
        setStatus('err', `LOAD ERROR — ${err.message}`);
    }
}

/* ── Load post list ──────────────────────────────────────────── */
async function loadPosts() {
    if (!BACKEND) {
        setStatus('err', 'BACKEND URL NOT SET — edit window.__BLOG_API_URL__ in blog.html');
        if (blogGrid) blogGrid.innerHTML = '';
        if (blogEmpty) blogEmpty.hidden = false;
        return;
    }

    setStatus('', 'FETCHING PUBLICATIONS…');

    try {
        const res = await fetchWithRetry(`${BACKEND}/api/posts`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { posts } = await res.json();

        if (blogGrid) blogGrid.innerHTML = '';

        if (!posts || posts.length === 0) {
            if (blogEmpty) blogEmpty.hidden = false;
            setStatus('ok', 'CHANNEL EMPTY — NO POSTS YET');
            return;
        }

        if (blogEmpty) blogEmpty.hidden = true;
        posts.forEach(p => blogGrid && blogGrid.appendChild(buildCard(p)));
        setStatus('ok', `${posts.length} PUBLICATION${posts.length !== 1 ? 'S' : ''} LOADED`);

    } catch (err) {
        if (blogGrid) blogGrid.innerHTML = '';
        if (blogEmpty) blogEmpty.hidden = false;
        setStatus('err', `BACKEND UNREACHABLE — ${err.message}`);
    }
}

const _deepSlug = new URLSearchParams(location.search).get('post');
if (_deepSlug) {
    loadAndShow(_deepSlug);
} else {
    loadPosts();
}
