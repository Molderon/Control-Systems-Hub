(function () {
    var curtain = document.getElementById('site-curtain');
    if (!curtain) return;

    document.body.classList.add('curtain-locked');

    function readLayout() {
        try { return localStorage.getItem('cs-layout'); } catch (e) { return null; }
    }

    function applyLayout(layout) {
        document.body.classList.remove('layout-formal', 'layout-indieweb');
        document.body.classList.add('layout-' + layout);
        try { localStorage.setItem('cs-layout', layout); } catch (e) {}
    }

    var stored = readLayout();
    var initial = (stored === 'formal' || stored === 'indieweb') ? stored : 'indieweb';
    applyLayout(initial);
    curtain.querySelectorAll('[data-layout]').forEach(function (b) {
        b.classList.toggle('active', b.dataset.layout === initial);
    });

    curtain.querySelectorAll('[data-layout]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var layout = btn.dataset.layout;
            if (layout !== 'formal' && layout !== 'indieweb') return;
            curtain.querySelectorAll('[data-layout]').forEach(function (b) {
                b.classList.toggle('active', b === btn);
            });
            applyLayout(layout);
        });
    });

    var enter = document.getElementById('curtain-enter');
    if (enter) {
        enter.addEventListener('click', function () {
            curtain.classList.add('curtain-exit');
            document.body.classList.remove('curtain-locked');
            setTimeout(function () { curtain.remove(); }, 650);
        });
    }
})();
