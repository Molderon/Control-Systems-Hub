'use strict';

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const { parseIRC, esc, randomNick, ts, sanitiseNick } = require('../irc.js');

// ── parseIRC ─────────────────────────────────────────────────────────────────

describe('parseIRC', () => {

    test('server PING with trailing server name', () => {
        const r = parseIRC('PING :irc.control-systems.local');
        assert.equal(r.prefix,  null);
        assert.equal(r.command, 'PING');
        assert.deepEqual(r.params, ['irc.control-systems.local']);
    });

    test('PRIVMSG to channel with message body', () => {
        const r = parseIRC(':Alice!u@host PRIVMSG #control-systems :hello everyone');
        assert.equal(r.prefix,  'Alice!u@host');
        assert.equal(r.command, 'PRIVMSG');
        assert.deepEqual(r.params, ['#control-systems', 'hello everyone']);
    });

    test('RPL_WELCOME (001) with welcome text', () => {
        const r = parseIRC(':server 001 Guest1234 :Welcome to the Control Systems IRC');
        assert.equal(r.command, '001');
        assert.equal(r.params[0], 'Guest1234');
        assert.equal(r.params[1], 'Welcome to the Control Systems IRC');
    });

    test('RPL_NAMREPLY (353) with space-separated nick list in trailing', () => {
        const r = parseIRC(':server 353 me = #control-systems :Alice Bob Charlie');
        assert.equal(r.command, '353');
        assert.equal(r.params[r.params.length - 1], 'Alice Bob Charlie');
    });

    test('QUIT with reason', () => {
        const r = parseIRC(':Bob!u@h QUIT :Disconnected');
        assert.equal(r.command, 'QUIT');
        assert.equal(r.params[0], 'Disconnected');
        assert.equal(r.prefix, 'Bob!u@h');
    });

    test('JOIN with no trailing', () => {
        const r = parseIRC(':Alice!u@h JOIN #control-systems');
        assert.equal(r.command, 'QUIT' === r.command ? 'wrong' : r.command, 'JOIN');
        assert.equal(r.command, 'JOIN');
        assert.equal(r.params[0], '#control-systems');
        assert.equal(r.prefix, 'Alice!u@h');
    });

    test('ERR_NICKNAMEINUSE (433) with target and offending nick', () => {
        const r = parseIRC(':server 433 * wantednick :Nickname is already in use');
        assert.equal(r.command, '433');
        assert.equal(r.params[0], '*');
        assert.equal(r.params[1], 'wantednick');
        assert.equal(r.params[2], 'Nickname is already in use');
    });

    test('NICK change message', () => {
        const r = parseIRC(':OldNick!u@h NICK NewNick');
        assert.equal(r.command, 'NICK');
        assert.equal(r.params[0], 'NewNick');
        assert.equal(r.prefix, 'OldNick!u@h');
    });

    test('CTCP ACTION preserves control characters in trailing', () => {
        const r = parseIRC(':Alice!u@h PRIVMSG #control-systems :\x01ACTION waves at everyone\x01');
        assert.equal(r.command, 'PRIVMSG');
        const trailing = r.params[r.params.length - 1];
        assert.ok(trailing.startsWith('\x01ACTION'));
        assert.ok(trailing.endsWith('\x01'));
    });

    test('PART with reason', () => {
        const r = parseIRC(':Bob!u@h PART #control-systems :leaving for today');
        assert.equal(r.command, 'PART');
        assert.equal(r.params[0], '#control-systems');
        assert.equal(r.params[1], 'leaving for today');
    });

    test('KICK with kicked nick and reason', () => {
        const r = parseIRC(':oper!o@h KICK #control-systems SpamBot :flooding');
        assert.equal(r.command, 'KICK');
        assert.equal(r.params[0], '#control-systems');
        assert.equal(r.params[1], 'SpamBot');
        assert.equal(r.params[2], 'flooding');
    });

    test('NOTICE with empty trailing', () => {
        const r = parseIRC(':server NOTICE me :');
        assert.equal(r.command, 'NOTICE');
        assert.equal(r.params[r.params.length - 1], '');
    });

    test('message with multiple middle params and no trailing', () => {
        const r = parseIRC(':server MODE #control-systems +o Alice');
        assert.equal(r.command, 'MODE');
        assert.deepEqual(r.params, ['#control-systems', '+o', 'Alice']);
    });

    test('prefix-less ERROR message', () => {
        const r = parseIRC('ERROR :Closing Link: 127.0.0.1 (Quit)');
        assert.equal(r.prefix,  null);
        assert.equal(r.command, 'ERROR');
        assert.equal(r.params[0], 'Closing Link: 127.0.0.1 (Quit)');
    });

    test('trailing containing spaces is captured whole', () => {
        const r = parseIRC(':server 372 me :This is a  multi-space  MOTD line');
        assert.equal(r.params[r.params.length - 1], 'This is a  multi-space  MOTD line');
    });
});

// ── esc ───────────────────────────────────────────────────────────────────────

describe('esc', () => {

    test('escapes < and >', () => {
        assert.equal(esc('<script>'), '&lt;script&gt;');
    });

    test('escapes &', () => {
        assert.equal(esc('a & b'), 'a &amp; b');
    });

    test('full XSS payload is neutralised', () => {
        const payload = '<img src=x onerror=alert(1)>';
        const result  = esc(payload);
        assert.ok(!result.includes('<'));
        assert.ok(!result.includes('>'));
        assert.equal(result, '&lt;img src=x onerror=alert(1)&gt;');
    });

    test('combined < > & in one string', () => {
        assert.equal(esc('<a href="x&y">'), '&lt;a href="x&amp;y"&gt;');
    });

    test('normal text passes through unchanged', () => {
        assert.equal(esc('Control Systems 2026'), 'Control Systems 2026');
    });

    test('empty string returns empty string', () => {
        assert.equal(esc(''), '');
    });

    test('coerces non-string argument to string', () => {
        assert.equal(esc(42),   '42');
        assert.equal(esc(null), 'null');
        assert.equal(esc(true), 'true');
    });

    test('script tag with attributes is fully escaped', () => {
        const r = esc('<script src="evil.js"></script>');
        assert.ok(!r.includes('<script'));
        assert.ok(!r.includes('</script>'));
    });
});

// ── randomNick ────────────────────────────────────────────────────────────────

describe('randomNick', () => {

    test('starts with "Guest"', () => {
        assert.ok(randomNick().startsWith('Guest'));
    });

    test('total length is 9 characters (Guest + 4 digits)', () => {
        assert.equal(randomNick().length, 9);
    });

    test('suffix is a four-digit numeric string', () => {
        const suffix = randomNick().slice(5);
        assert.match(suffix, /^\d{4}$/);
    });

    test('numeric suffix is in range 1000–9999', () => {
        const n = parseInt(randomNick().slice(5), 10);
        assert.ok(n >= 1000 && n <= 9999, `${n} is outside 1000–9999`);
    });

    test('produces distinct values across multiple calls', () => {
        const nicks = new Set(Array.from({ length: 20 }, randomNick));
        assert.ok(nicks.size > 1, 'randomNick returned the same value 20 times');
    });
});

// ── ts ────────────────────────────────────────────────────────────────────────

describe('ts', () => {

    test('returns a string of exactly 5 characters', () => {
        assert.equal(ts().length, 5);
    });

    test('has colon at index 2', () => {
        assert.equal(ts()[2], ':');
    });

    test('hours segment is a valid 00–23 value', () => {
        const h = parseInt(ts().slice(0, 2), 10);
        assert.ok(h >= 0 && h <= 23, `hour ${h} out of range`);
    });

    test('minutes segment is a valid 00–59 value', () => {
        const m = parseInt(ts().slice(3, 5), 10);
        assert.ok(m >= 0 && m <= 59, `minute ${m} out of range`);
    });

    test('both segments are zero-padded two-digit strings', () => {
        assert.match(ts(), /^\d{2}:\d{2}$/);
    });
});

// ── sanitiseNick ──────────────────────────────────────────────────────────────

describe('sanitiseNick', () => {

    test('valid alphanumeric nick passes through unchanged', () => {
        assert.equal(sanitiseNick('Alice123'), 'Alice123');
    });

    test('underscores and hyphens are preserved', () => {
        assert.equal(sanitiseNick('my_nick-01'), 'my_nick-01');
    });

    test('IRC-standard special chars are preserved: [ ] \\ ^ { } | `', () => {
        assert.equal(sanitiseNick('[bot]'), '[bot]');
        assert.equal(sanitiseNick('{Alice}'), '{Alice}');
        assert.equal(sanitiseNick('Nick^'), 'Nick^');
    });

    test('spaces are stripped', () => {
        assert.equal(sanitiseNick('nick name'), 'nickname');
    });

    test('carriage return and newline are stripped', () => {
        assert.equal(sanitiseNick('nick\r\ninjection'), 'nickinjection');
    });

    test('IRC protocol chars ! @ # : are stripped', () => {
        assert.equal(sanitiseNick('nick!@#:'), 'nick');
    });

    test('input longer than 32 chars is capped at 32', () => {
        const long = 'a'.repeat(50);
        assert.equal(sanitiseNick(long).length, 32);
    });

    test('empty string returns empty string', () => {
        assert.equal(sanitiseNick(''), '');
    });

    test('input that becomes empty after sanitisation returns empty string', () => {
        assert.equal(sanitiseNick('!!!@@@'), '');
    });

    test('leading and trailing whitespace is trimmed before sanitisation', () => {
        assert.equal(sanitiseNick('  Alice  '), 'Alice');
    });

    test('non-string input is coerced and sanitised', () => {
        const r = sanitiseNick(12345);
        assert.match(r, /^\d+$/);
    });
});
