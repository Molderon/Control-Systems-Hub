(function () {
    var BASE = (typeof window !== 'undefined' && window.__BLOG_API_URL__) || '';
    var TIMEOUT_MS = 3500;

    function markDown() {
        if (document.body.classList.contains('backend-down')) return;
        document.body.classList.add('backend-down');
        if (document.getElementById('backend-banner')) return;

        var banner = document.createElement('div');
        banner.id = 'backend-banner';
        banner.setAttribute('role', 'status');
        banner.setAttribute('aria-live', 'polite');
        banner.innerHTML =
            '<span class="bb-dot" aria-hidden="true"></span>' +
            '<span class="bb-label">BACKEND OFFLINE</span>' +
            '<span class="bb-sub">site running in condensed mode &middot; dynamic features paused</span>';
        document.body.insertBefore(banner, document.body.firstChild);
    }

    if (!BASE) {
        document.body.classList.add('backend-dev-bypass');
        return;
    }

    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);

    fetch(BASE.replace(/\/+$/, '') + '/api/health', {
        signal: ctrl.signal,
        cache: 'no-store'
    })
        .then(function (r) {
            clearTimeout(timer);
            if (!r.ok) throw new Error('status ' + r.status);
            return r.json();
        })
        .then(function (data) {
            if (!data || data.ok !== true) throw new Error('invalid payload');
            document.body.classList.add('backend-up');
        })
        .catch(function () {
            clearTimeout(timer);
            markDown();
        });
})();
