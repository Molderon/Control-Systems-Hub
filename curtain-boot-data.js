// Triads of boot-sequence privacy / safety messages.
// Each triad is an array of exactly 3 short strings.
// The curtain rotates to the next triad every 6 seconds.
// Add, remove, or edit freely — the loader auto-adapts.
window.__CURTAIN_BOOT_TRIADS__ = [
    [
        'drm subsystem absent',
        'no cookies to persist',
        'source: public mirror'
    ],
    [
        'no third-party trackers loaded',
        'analytics: /dev/null',
        'data stays on your device'
    ],
    [
        'transport: tls 1.3',
        'auth: none required',
        'logs: ephemeral'
    ],
    [
        'fingerprinting: avoided',
        'user agent: respected',
        'scripts: first-party only'
    ],
    [
        'license: agpl + mit',
        'no ads · no sponsors',
        'made by students, for students'
    ]
];
