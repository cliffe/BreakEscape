// A2a: normaliseRing and normaliseCall (phone calls plan 3.1, 3.2).
// Unknown or malformed input gets defaults and a warning, never a throw.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/minigames/phone-chat/phone-ring-config.js'), 'utf8');
const { normaliseRing, normaliseCall } = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

const collect = () => { const w = []; return { warns: w, opts: { warn: (m) => w.push(m) } }; };

const DEFAULT = { onMissed: 'callback', voicemailKnot: null, withheld: false, untilAnswered: false, callbackWhen: null };

test('ring: nothing, false and null mean no ring', () => {
    for (const v of [undefined, null, false]) assert.equal(normaliseRing(v), null);
});

test('ring: true takes every default, with no warning', () => {
    const { warns, opts } = collect();
    assert.deepEqual(normaliseRing(true, opts), DEFAULT);
    assert.deepEqual(normaliseRing({}, opts), DEFAULT);
    assert.deepEqual(warns, []);
});

test('ring: the object form carries every field', () => {
    const { warns, opts } = collect();
    assert.deepEqual(
        normaliseRing({ onMissed: 'voicemail', voicemailKnot: 'vm', withheld: true, untilAnswered: true }, opts),
        { onMissed: 'voicemail', voicemailKnot: 'vm', withheld: true, untilAnswered: true, callbackWhen: null });
    assert.deepEqual(warns, []);
});

test('ring.callbackWhen: a non-empty string is carried; a blank or non-string warns; it needs onMissed callback (item 7)', () => {
    const a = collect();
    assert.equal(normaliseRing({ callbackWhen: 'globalVars.x !== true' }, a.opts).callbackWhen, 'globalVars.x !== true');
    assert.deepEqual(a.warns, []);
    const b = collect();
    assert.equal(normaliseRing({ callbackWhen: '   ' }, b.opts).callbackWhen, null);
    assert.equal(b.warns.length, 1);
    const c = collect();
    assert.equal(normaliseRing({ callbackWhen: 7 }, c.opts).callbackWhen, null);
    assert.equal(c.warns.length, 1);
    const d = collect();
    normaliseRing({ onMissed: 'voicemail', voicemailKnot: 'vm', callbackWhen: 'globalVars.x' }, d.opts);
    assert.ok(d.warns.some((w) => w.includes('callbackWhen has no effect')), 'warns when onMissed is not callback');
});

test('ring: malformed values fall back to defaults with a warning each, and never throw', () => {
    const { warns, opts } = collect();
    const r = normaliseRing({ onMissed: 'sms', voicemailKnot: 7, withheld: 'yes', untilAnswered: 1, extra: true }, opts);
    assert.deepEqual(r, DEFAULT);
    assert.equal(warns.length, 5);
    for (const bad of ['ring', 5, ['a'], () => 1]) {
        const c = collect();
        assert.deepEqual(normaliseRing(bad, c.opts), DEFAULT);
        assert.equal(c.warns.length, 1);
    }
});

test('ring: voicemail without a voicemailKnot falls back to callback with a warning', () => {
    const { warns, opts } = collect();
    assert.equal(normaliseRing({ onMissed: 'voicemail' }, opts).onMissed, 'callback');
    assert.equal(warns.length, 1);
});

test('ring: withheld without voicemail warns unless the call is forced; untilAnswered on a forced call warns', () => {
    const a = collect();
    assert.equal(normaliseRing({ withheld: true }, a.opts).withheld, true);
    assert.equal(a.warns.length, 1);
    const b = collect();
    normaliseRing({ withheld: true }, { ...b.opts, forced: true });
    assert.deepEqual(b.warns, []);
    const c = collect();
    normaliseRing({ untilAnswered: true }, { ...c.opts, forced: true });
    assert.equal(c.warns.length, 1);
    const d = collect();
    normaliseRing({ withheld: true, onMissed: 'voicemail', voicemailKnot: 'vm' }, d.opts);
    assert.deepEqual(d.warns, []);
});

test('ring: with no warn function it logs through console.warn and does not throw', () => {
    const orig = console.warn;
    const seen = [];
    console.warn = (m) => seen.push(m);
    try { normaliseRing({ onMissed: 'x' }); } finally { console.warn = orig; }
    assert.equal(seen.length, 1);
    assert.doesNotThrow(() => normaliseRing({ onMissed: 'x' }, { warn() { throw new Error('boom'); } }));
});

test('call: nothing means no entries; one entry and a list both give an array in order', () => {
    for (const v of [undefined, null, false]) assert.deepEqual(normaliseCall(v), []);
    const one = normaliseCall({ knot: 'support_call' });
    assert.deepEqual(one, [{ knot: 'support_call', when: null, unavailable: 'no_answer', button: true }]);
    const list = normaliseCall([
        { knot: 'm2_revelation_call', when: 'globalVars.a && !globalVars.b', unavailable: 'hidden' },
        { knot: 'extract_call', button: false },
    ]);
    assert.deepEqual(list, [
        { knot: 'm2_revelation_call', when: 'globalVars.a && !globalVars.b', unavailable: 'hidden', button: true },
        { knot: 'extract_call', when: null, unavailable: 'no_answer', button: false },
    ]);
});

test('call: an entry with no usable knot, or that is not an object, is dropped with a warning', () => {
    const { warns, opts } = collect();
    const out = normaliseCall([{ when: 'x' }, { knot: '' }, { knot: 5 }, 'text', null, { knot: 'ok' }], opts);
    assert.deepEqual(out.map((e) => e.knot), ['ok']);
    assert.equal(warns.length, 5);
    const c = collect();
    assert.deepEqual(normaliseCall('nope', c.opts), []);
    assert.equal(c.warns.length, 1);
});

test('call: malformed when, unavailable and button fall back to defaults with a warning; unknown fields warn', () => {
    const { warns, opts } = collect();
    const [e] = normaliseCall({ knot: 'k', when: 3, unavailable: 'later', button: 'no', colour: 'red' }, opts);
    assert.deepEqual(e, { knot: 'k', when: null, unavailable: 'no_answer', button: true });
    assert.equal(warns.length, 4);
});

test('call: an entry on the contact\'s home knot is dropped when the home knot is known', () => {
    const { warns, opts } = collect();
    const out = normaliseCall([{ knot: 'start' }, { knot: 'call' }], { ...opts, homeKnot: 'start' });
    assert.deepEqual(out.map((e) => e.knot), ['call']);
    assert.equal(warns.length, 1);
});
