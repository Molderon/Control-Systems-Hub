(function () {
    var container = document.querySelector('.curtain-boot');
    if (!container) return;
    var lines = container.querySelectorAll('.curtain-boot-line');
    if (lines.length !== 3) return;

    var triads = (window.__CURTAIN_BOOT_TRIADS__ || []).filter(function (t) {
        return Array.isArray(t) && t.length === 3;
    });
    if (triads.length <= 1) return;

    var INTERVAL_MS = 6000;
    var FADE_OUT_MS = 340;
    var FADE_MS = 360;
    var LINE_STAGGER_MS = 160;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var SLIDE_PX = reduced ? 0 : 12;

    var index = 0;
    var timer = null;
    var normalized = false;

    function normalize() {
        if (normalized) return;
        normalized = true;
        for (var i = 0; i < 3; i++) {
            lines[i].style.animation = 'none';
            lines[i].style.transition = 'none';
            lines[i].style.opacity = '1';
            lines[i].style.transform = 'translateY(0)';
        }
        void container.offsetHeight;
    }

    function paint(triad) {
        normalize();

        for (var i = 0; i < 3; i++) {
            lines[i].style.transition = 'opacity ' + FADE_MS + 'ms ease, transform ' + FADE_MS + 'ms ease';
            lines[i].style.opacity = '0';
            lines[i].style.transform = 'translateY(-' + SLIDE_PX + 'px)';
        }

        setTimeout(function () {
            for (var i = 0; i < 3; i++) {
                var line = lines[i];
                var tag = line.querySelector('.cb-tag');
                while (line.firstChild) line.removeChild(line.firstChild);
                if (tag) line.appendChild(tag);
                line.appendChild(document.createTextNode(' ' + triad[i]));
                line.style.transition = 'none';
                line.style.transform = 'translateY(' + SLIDE_PX + 'px)';
            }
            void container.offsetHeight;

            for (var j = 0; j < 3; j++) {
                (function (j) {
                    setTimeout(function () {
                        if (!lines[j]) return;
                        lines[j].style.transition = 'opacity ' + FADE_MS + 'ms ease, transform ' + FADE_MS + 'ms ease';
                        lines[j].style.opacity = '1';
                        lines[j].style.transform = 'translateY(0)';
                    }, j * LINE_STAGGER_MS);
                })(j);
            }
        }, FADE_OUT_MS);
    }

    function tick() {
        if (!document.body.contains(container)) {
            clearInterval(timer);
            return;
        }
        index = (index + 1) % triads.length;
        paint(triads[index]);
    }

    timer = setInterval(tick, INTERVAL_MS);
})();
