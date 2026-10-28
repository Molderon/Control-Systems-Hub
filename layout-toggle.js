(function () {
    function currentLayout() {
        if (document.body.classList.contains('layout-formal')) return 'formal';
        if (document.body.classList.contains('layout-indieweb')) return 'indieweb';
        try {
            var stored = localStorage.getItem('cs-layout');
            if (stored === 'formal' || stored === 'indieweb') return stored;
        } catch (e) {}
        return 'indieweb';
    }

    function applyLayout(layout) {
        document.body.classList.remove('layout-formal', 'layout-indieweb');
        document.body.classList.add('layout-' + layout);
        try { localStorage.setItem('cs-layout', layout); } catch (e) {}
    }

    window.toggleSiteLayout = function () {
        var next = currentLayout() === 'formal' ? 'indieweb' : 'formal';
        applyLayout(next);
        return next;
    };

    document.addEventListener('click', function (e) {
        var btn = e.target.closest('#layoutToggleBtn, [data-layout-toggle]');
        if (!btn) return;
        e.preventDefault();
        window.toggleSiteLayout();
    });
})();
