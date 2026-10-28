(function () {
    var menu = null;
    var ITEMS = [
        { label: 'Home',  href: 'index.html' },
        { label: 'Blog',  href: 'blog.html'  },
        { label: 'IRC',   href: 'irc.html'   },
        { label: 'About', href: 'about.html' },
        { label: 'Theme', action: 'theme'    }
    ];

    function build() {
        var el = document.createElement('ul');
        el.className = 'rc-menu';
        el.setAttribute('role', 'menu');
        ITEMS.forEach(function (it) {
            var li = document.createElement('li');
            li.className = 'rc-menu-item';
            li.setAttribute('role', 'menuitem');
            li.tabIndex = 0;
            li.textContent = it.label;
            if (it.action === 'theme') {
                li.addEventListener('click', function () {
                    if (typeof window.toggleSiteLayout === 'function') window.toggleSiteLayout();
                    hide();
                });
            } else {
                li.addEventListener('click', function () {
                    window.location.href = it.href;
                });
            }
            el.appendChild(li);
        });
        document.body.appendChild(el);
        return el;
    }

    function show(x, y) {
        if (!menu) menu = build();
        menu.style.display = 'block';
        var w = menu.offsetWidth, h = menu.offsetHeight;
        var vw = window.innerWidth, vh = window.innerHeight;
        if (x + w > vw - 8) x = vw - w - 8;
        if (y + h > vh - 8) y = vh - h - 8;
        menu.style.left = x + 'px';
        menu.style.top  = y + 'px';
    }

    function hide() { if (menu) menu.style.display = 'none'; }

    document.addEventListener('contextmenu', function (e) {
        if (e.target.closest('input, textarea, [contenteditable], select')) return;
        e.preventDefault();
        show(e.clientX, e.clientY);
    });

    document.addEventListener('click', function (e) {
        if (menu && !menu.contains(e.target)) hide();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') hide();
    });

    window.addEventListener('scroll', hide, { passive: true });
    window.addEventListener('resize', hide);
})();
