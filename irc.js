// ── Pure utilities (no DOM deps — exported for node:test) ────────────────────

function randomNick() {
    return 'Guest' + (Math.floor(Math.random() * 9000) + 1000);
}

function ts() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseIRC(raw) {
    let prefix = null;
    let i = 0;

    if (raw[0] === ':') {
        const sp = raw.indexOf(' ');
        prefix   = raw.slice(1, sp);
        i        = sp + 1;
    }

    const trailIdx = raw.indexOf(' :', i);
    const middle   = (trailIdx !== -1 ? raw.slice(i, trailIdx) : raw.slice(i)).trim();
    const parts    = middle.split(/\s+/).filter(Boolean);
    const command  = parts[0] || '';
    const params   = parts.slice(1);
    if (trailIdx !== -1) params.push(raw.slice(trailIdx + 2));

    return { prefix, command, params };
}

// Nick sanitiser — strips chars that would corrupt IRC wire lines; capped at 32
function sanitiseNick(input) {
    return String(input).trim()
        .replace(/[^a-zA-Z0-9_\-\[\]\\^{}|`]/g, '')
        .slice(0, 32);
}

// ── Node.js test export ───────────────────────────────────────────────────────

if (typeof module !== 'undefined') {
    module.exports = { randomNick, ts, esc, parseIRC, sanitiseNick };
}

// ── Browser client (skipped when required from Node) ─────────────────────────

if (typeof document !== 'undefined') (() => {
    const WSS_URL = window.__IRC_WSS_URL__;
    const CHANNEL = '#control-systems';

    const logEl       = document.getElementById('ircLog');
    const inputEl     = document.getElementById('ircInput');
    const statusEl    = document.getElementById('ircStatus');
    const titleEl     = document.getElementById('ircTitle');
    const rosterEl    = document.getElementById('ircRoster');
    const rosterPane  = document.getElementById('rosterPane');
    const commandPane = document.getElementById('commandsPane');
    const tabRosterBtn = document.getElementById('tabRoster');
    const tabCmdsBtn   = document.getElementById('tabCmds');
    const rosterUpBtn  = document.getElementById('rosterUp');
    const rosterDnBtn  = document.getElementById('rosterDown');

    let ws          = null;
    let nick        = '';
    let userCount   = 0;
    let reconnectMs = 2000;

    const roster = new Set();

    // ── Nick persistence (localStorage, 7-day TTL) ────────────────────────

    const NICK_KEY = 'cs-irc-nick';
    const NICK_TTL = 7 * 24 * 60 * 60 * 1000;

    function loadStoredNick() {
        try {
            const raw = localStorage.getItem(NICK_KEY);
            if (!raw) return null;
            const { nick: n, ts: saved } = JSON.parse(raw);
            if (Date.now() - saved < NICK_TTL) return n;
        } catch {}
        return null;
    }

    function saveNick(n) {
        try { localStorage.setItem(NICK_KEY, JSON.stringify({ nick: n, ts: Date.now() })); } catch {}
    }

    // ── Roster rendering ──────────────────────────────────────────────────

    function renderRoster() {
        if (!rosterEl) return;
        rosterEl.innerHTML = '';
        [...roster]
            .sort((a, b) => {
                if (a === nick) return -1;
                if (b === nick) return 1;
                return a.localeCompare(b, undefined, { sensitivity: 'base' });
            })
            .forEach(n => {
                const el = document.createElement('div');
                el.className = 'roster-nick' + (n === nick ? ' roster-nick--self' : '');
                el.textContent = (n === nick ? '● ' : '  ') + n;
                el.title = n === nick ? n + ' (you)' : n;
                el.addEventListener('click', () => {
                    inputEl.value += '@' + n + ' ';
                    inputEl.focus();
                });
                rosterEl.appendChild(el);
            });
    }

    // ── Tab switching ─────────────────────────────────────────────────────

    function switchTab(tab) {
        const toRoster = tab === 'roster';
        rosterPane .classList.toggle('hidden', !toRoster);
        commandPane.classList.toggle('hidden',  toRoster);
        tabRosterBtn.classList.toggle('active',  toRoster);
        tabCmdsBtn  .classList.toggle('active', !toRoster);
        tabRosterBtn.setAttribute('aria-pressed',  String( toRoster));
        tabCmdsBtn  .setAttribute('aria-pressed',  String(!toRoster));
    }

    if (tabRosterBtn) tabRosterBtn.addEventListener('click', () => switchTab('roster'));
    if (tabCmdsBtn)   tabCmdsBtn  .addEventListener('click', () => switchTab('commands'));

    if (rosterUpBtn) rosterUpBtn.addEventListener('click', () => { if (rosterEl) rosterEl.scrollTop -= 60; });
    if (rosterDnBtn) rosterDnBtn.addEventListener('click', () => { if (rosterEl) rosterEl.scrollTop += 60; });

    // ── @mention highlighting ─────────────────────────────────────────────
    // Runs on an already-escaped string — nick chars never overlap with & < >

    function highlightMentions(escapedText) {
        return escapedText.replace(/@([\w\-\[\]\\^{}|`]+)/g, (match, m) => {
            if (m === nick)      return `<span class="irc-mention irc-mention--self">${match}</span>`;
            if (roster.has(m))   return `<span class="irc-mention">${match}</span>`;
            return match;
        });
    }

    // ── Render helpers ────────────────────────────────────────────────────

    function appendLine(cls, html) {
        const el = document.createElement('div');
        el.className = cls;
        el.innerHTML = html;
        logEl.appendChild(el);
        logEl.scrollTop = logEl.scrollHeight;
    }

    function appendMsg(fromNick, text) {
        const isSelf  = fromNick === nick;
        const nickCls = isSelf ? 'irc-nick irc-nick--self' : 'irc-nick';
        const msgHtml = highlightMentions(esc(text));
        appendLine('irc-msg',
            `<span class="irc-ts">[${ts()}]</span> ` +
            `&lt;<span class="${nickCls}">${esc(fromNick)}</span>&gt; ${msgHtml}`
        );
    }

    function appendSys(text) {
        appendLine('irc-sys', `  · ${esc(text)}`);
    }

    function appendEvent(html) {
        appendLine('irc-event', `  · ${html}`);
    }

    function appendErr(text) {
        appendLine('irc-err', `  · ${esc(text)}`);
    }

    function setStatus(text) {
        if (statusEl) statusEl.textContent = text;
    }

    function setTitle(text) {
        if (titleEl) titleEl.textContent = text;
    }

    function updateStatusBar() {
        userCount = roster.size;
        setStatus(`connected as ${nick}  ·  ${CHANNEL}  ·  ${userCount} online`);
        setTitle(`IRC.SH — ${CHANNEL}`);
    }

    // ── IRC wire ──────────────────────────────────────────────────────────

    function send(line) {
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(line + '\r\n');
    }

    function nickOf(prefix) {
        return prefix ? prefix.split('!')[0] : '';
    }

    // ── Message dispatch ──────────────────────────────────────────────────

    function handle(raw) {
        const { prefix, command, params } = parseIRC(raw.trim());
        const who = nickOf(prefix);

        switch (command) {

            case 'PING':
                send('PONG :' + (params[0] || ''));
                break;

            case '001':
                reconnectMs = 2000;
                saveNick(nick);
                roster.clear();
                send('JOIN ' + CHANNEL);
                updateStatusBar();
                break;

            case '353': {
                (params[params.length - 1] || '').trim().split(/\s+/).forEach(n => {
                    const clean = n.replace(/^[@+~&]/, '');
                    if (clean) roster.add(clean);
                });
                renderRoster();
                updateStatusBar();
                break;
            }

            case 'JOIN':
                if (who === nick) {
                    roster.add(nick);
                    renderRoster();
                    appendSys('Joined ' + (params[0] || CHANNEL));
                } else {
                    roster.add(who);
                    renderRoster();
                    appendEvent(`<b>${esc(who)}</b> joined`);
                    updateStatusBar();
                }
                break;

            case 'PART':
                appendEvent(`<b>${esc(who)}</b> left`);
                if (who !== nick) {
                    roster.delete(who);
                    renderRoster();
                    updateStatusBar();
                }
                break;

            case 'QUIT':
                appendEvent(`<b>${esc(who)}</b> disconnected`);
                roster.delete(who);
                renderRoster();
                updateStatusBar();
                break;

            case 'NICK': {
                const newNick = params[0] || '';
                if (who === nick) {
                    roster.delete(nick);
                    nick = newNick;
                    roster.add(nick);
                    saveNick(nick);
                    renderRoster();
                    updateStatusBar();
                    appendSys('You are now ' + newNick);
                } else {
                    roster.delete(who);
                    roster.add(newNick);
                    renderRoster();
                    appendEvent(`<b>${esc(who)}</b> → <b>${esc(newNick)}</b>`);
                }
                break;
            }

            case 'PRIVMSG': {
                const target = params[0] || '';
                const text   = params[1] || '';
                if (target !== CHANNEL) break;

                if (text.charCodeAt(0) === 1 && text.endsWith('\x01')) {
                    const action = text.slice(8, -1);
                    appendEvent(`* <b>${esc(who)}</b> ${esc(action)}`);
                } else {
                    appendMsg(who, text);
                }
                break;
            }

            case 'KICK': {
                const kicked = params[1] || '';
                const reason = params[2] || '';
                if (kicked === nick) {
                    appendErr('You were kicked' + (reason ? ': ' + reason : ''));
                    setTimeout(() => send('JOIN ' + CHANNEL), 3000);
                } else {
                    roster.delete(kicked);
                    renderRoster();
                    appendEvent(`<b>${esc(kicked)}</b> was kicked`);
                    updateStatusBar();
                }
                break;
            }

            case 'NOTICE':
                appendSys((params[1] || '').slice(0, 200));
                break;

            case '432':
            case '433':
                nick = randomNick();
                send('NICK ' + nick);
                break;

            case 'ERROR':
                appendErr('Server: ' + (params[0] || ''));
                break;
        }
    }

    // ── WebSocket lifecycle ───────────────────────────────────────────────

    function connect() {
        setStatus('CONNECTING…');
        setTitle('IRC.SH — SESSION PENDING');

        ws = new WebSocket(WSS_URL);

        ws.onopen = () => {
            nick = loadStoredNick() || randomNick();
            send('NICK ' + nick);
            send('USER guest 0 * :Guest');
        };

        ws.onmessage = e => {
            String(e.data).split('\r\n').forEach(line => {
                if (line.trim()) handle(line);
            });
        };

        ws.onclose = () => {
            roster.clear();
            renderRoster();
            setStatus('DISCONNECTED — reconnecting in ' + (reconnectMs / 1000) + 's…');
            setTitle('IRC.SH — SESSION PENDING');
            setTimeout(connect, reconnectMs);
            reconnectMs = Math.min(reconnectMs * 2, 30000);
        };

        ws.onerror = () => ws.close();
    }

    // ── Input handling ────────────────────────────────────────────────────

    function sendInput() {
        // 400 chars leaves room for "PRIVMSG #control-systems :" within the 512-byte IRC line limit
        const val = inputEl.value.trim().slice(0, 400);
        if (!val) return;
        inputEl.value = '';

        if (val.startsWith('/nick ')) {
            const newNick = sanitiseNick(val.slice(6));
            if (newNick) send('NICK ' + newNick);

        } else if (val.startsWith('/me ')) {
            const action = val.slice(4);
            send('PRIVMSG ' + CHANNEL + ' :\x01ACTION ' + action + '\x01');
            appendEvent('* <b>' + esc(nick) + '</b> ' + esc(action));

        } else if (val.startsWith('/')) {
            appendSys('Unknown command. Available: /nick <name>  /me <action>');

        } else {
            send('PRIVMSG ' + CHANNEL + ' :' + val);
            appendMsg(nick, val);
        }
    }

    inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter') sendInput();
    });

    // ── Boot ──────────────────────────────────────────────────────────────

    if (!WSS_URL) {
        appendErr('IRC_WSS_URL is not set. Add window.__IRC_WSS_URL__ to irc.html before deploying.');
        setStatus('ERROR: server URL not configured');
        return;
    }

    connect();
})();
