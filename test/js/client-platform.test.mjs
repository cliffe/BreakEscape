// client-platform.js: the two platform fields (app window, store), the stored Play marker, the
// marker checks and the html attributes. The real source is run in jsdom as a classic script.
// Run with: bin/test-js test/js/client-platform.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/client-platform.js'), 'utf8');

const BROWSER_UA = 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36';
const PKG = 'uk.co.hacktivity.licencetohack';
const METAS = `<meta name="hacktivity-play-packages" content="${PKG}=licence-to-hack">` +
    '<meta name="hacktivity-app-event" content="42">' +
    '<meta name="hacktivity-app-paths" content=\'["/app/licence-to-hack","/hacktivities/42"]\'>';

// Load the script into a fresh page. opts: url, referrer, userAgent, metas, storage (a Storage
// stand-in or 'throws'), dg (getDigitalGoodsService stub), before(window) for anything else.
function load(opts = {}) {
    const html = `<!doctype html><html><head>${opts.metas === false ? '' : METAS}</head><body></body></html>`;
    const dom = new JSDOM(html, {
        url: opts.url || 'https://hacktivity.test/app/licence-to-hack',
        referrer: opts.referrer,
        runScripts: 'outside-only', pretendToBeVisual: true,
    });
    const w = dom.window;
    Object.defineProperty(w.navigator, 'userAgent', { value: opts.userAgent || BROWSER_UA });
    if (opts.storage === 'throws') {
        Object.defineProperty(w, 'sessionStorage', { get() { throw new Error('blocked'); } });
    } else if (opts.storage) {
        for (const [k, v] of Object.entries(opts.storage)) w.sessionStorage.setItem(k, v);
    }
    if (opts.dg) w.getDigitalGoodsService = opts.dg;
    opts.before?.(w);
    w.eval(src);
    return w;
}
const attrs = (w) => [w.document.documentElement.dataset.appWindow, w.document.documentElement.dataset.store];
const stored = (w) => JSON.parse(w.sessionStorage.getItem('hacktivity.platform'));
const PLAY = (extra = {}) => JSON.stringify({ appWindow: 'play-app', store: 'play', package: PKG, gameKey: 'licence-to-hack', eventId: '42', appPaths: [], at: 1, ...extra });

test('plain browser: browser/web, nothing stored', async () => {
    const w = load();
    await w.HacktivityPlatform.ready;
    assert.deepEqual(attrs(w), ['browser', 'web']);
    assert.equal(w.HacktivityPlatform.isAppWindow, false);
    assert.equal(w.sessionStorage.getItem('hacktivity.platform'), null);
    assert.equal(w.HacktivityPlatform.homeUrl(), '/');
});

test('desktop UA without a store field: desktop-app/steam', () => {
    const w = load({ userAgent: 'Mozilla/5.0 Electron/30 HacktivityApp/0.1.0 (game=licence-to-hack; edition=demo)' });
    assert.deepEqual(attrs(w), ['desktop-app', 'steam']);
    assert.equal(w.HacktivityPlatform.isAppWindow, true);
    assert.equal(w.HacktivityPlatform.homeUrl(), '/');
});

test('desktop UA with store=web: desktop-app/web; store=steam: steam', () => {
    let w = load({ userAgent: 'X HacktivityApp/0.2.0 (game=g; edition=full; store=web)' });
    assert.deepEqual(attrs(w), ['desktop-app', 'web']);
    w = load({ userAgent: 'X HacktivityApp/0.2.0 (game=g; edition=full; store=steam)' });
    assert.deepEqual(attrs(w), ['desktop-app', 'steam']);
    w = load({ userAgent: 'X HacktivityApp/0.2.0 (game=g; edition=full; store=bogus)' });
    assert.deepEqual(attrs(w), ['desktop-app', 'steam']);
});

test('marker plus matching referrer: play-app/play, stored, marker stripped', async () => {
    const w = load({ url: 'https://hacktivity.test/app/licence-to-hack?source=play&x=1', referrer: `android-app://${PKG}/` });
    assert.deepEqual(attrs(w), ['play-app', 'play'], 'set synchronously');
    await w.HacktivityPlatform.ready;
    assert.equal(w.location.search, '?x=1');
    const s = stored(w);
    assert.equal(s.appWindow, 'play-app');
    assert.equal(s.package, PKG);
    assert.equal(s.gameKey, 'licence-to-hack');
    assert.equal(s.eventId, '42');
    assert.deepEqual(s.appPaths, ['/app/licence-to-hack', '/hacktivities/42']);
    assert.equal(w.HacktivityPlatform.homeUrl(), '/app/licence-to-hack');
    assert.equal(w.HacktivityPlatform.gameKey, 'licence-to-hack');
});

test('marker plus a resolving Digital Goods stub: play-app', async () => {
    const calls = [];
    const w = load({ url: 'https://hacktivity.test/app/licence-to-hack?source=play',
        dg: (u) => { calls.push(u); return Promise.resolve({}); } });
    assert.deepEqual(attrs(w), ['browser', 'web'], 'not yet decided');
    await w.HacktivityPlatform.ready;
    assert.deepEqual(calls, ['https://play.google.com/billing']);
    assert.deepEqual(attrs(w), ['play-app', 'play']);
    assert.equal(w.location.search, '');
    assert.equal(stored(w).appWindow, 'play-app');
});

test('marker with an https referrer and a rejecting stub: browser/web, marker stripped', async () => {
    const w = load({ url: 'https://hacktivity.test/app/licence-to-hack?source=play', referrer: 'https://example.org/',
        dg: () => Promise.reject(new Error('no')) });
    await w.HacktivityPlatform.ready;
    assert.deepEqual(attrs(w), ['browser', 'web']);
    assert.equal(w.location.search, '');
    assert.equal(w.sessionStorage.getItem('hacktivity.platform'), null);
});

test('method present but the call rejects: browser', async () => {
    const w = load({ url: 'https://hacktivity.test/x?source=play', dg: async () => { throw new Error('unsupported'); } });
    await w.HacktivityPlatform.ready;
    assert.deepEqual(attrs(w), ['browser', 'web']);
});

test('method present and throws synchronously: browser', async () => {
    const w = load({ url: 'https://hacktivity.test/x?source=play', dg: () => { throw new Error('boom'); } });
    await w.HacktivityPlatform.ready;
    assert.deepEqual(attrs(w), ['browser', 'web']);
});

test('marker with no Digital Goods and no referrer: browser, marker stripped', async () => {
    const w = load({ url: 'https://hacktivity.test/x?source=play' });
    await w.HacktivityPlatform.ready;
    assert.deepEqual(attrs(w), ['browser', 'web']);
    assert.equal(w.location.search, '');
});

test('referrer for a package that is not listed does not count', async () => {
    const w = load({ url: 'https://hacktivity.test/x?source=play', referrer: 'android-app://com.evil.app/' });
    await w.HacktivityPlatform.ready;
    assert.deepEqual(attrs(w), ['browser', 'web']);
});

test('stored value survives a navigation (no marker on the next page)', async () => {
    const w = load({ url: 'https://hacktivity.test/hacktivities/42/play', metas: false,
        storage: { 'hacktivity.platform': PLAY() } });
    assert.deepEqual(attrs(w), ['play-app', 'play']);
    assert.equal(w.HacktivityPlatform.homeUrl(), '/app/licence-to-hack');
    assert.equal(w.HacktivityPlatform.eventId, '42');
});

test('stored value: a later page with newer metas updates the stored facts', () => {
    const w = load({ url: 'https://hacktivity.test/hacktivities/43', storage: { 'hacktivity.platform': PLAY({ eventId: '1' }) } });
    assert.equal(stored(w).eventId, '42');
});

test('stored value plus a stray marker: stays play-app, marker stripped, no re-check', async () => {
    let called = 0;
    const w = load({ url: 'https://hacktivity.test/x?source=play', storage: { 'hacktivity.platform': PLAY() },
        dg: () => { called++; return Promise.reject(new Error('no')); } });
    assert.deepEqual(attrs(w), ['play-app', 'play']);
    assert.equal(w.location.search, '');
    assert.equal(called, 0);
});

test('a corrupt or wrong stored value is ignored', () => {
    for (const bad of ['not json', '{"appWindow":"desktop-app","store":"steam"}', 'null']) {
        const w = load({ storage: { 'hacktivity.platform': bad } });
        assert.deepEqual(attrs(w), ['browser', 'web'], bad);
    }
});

test('a second page in a fresh context (no stored value) is browser/web', () => {
    const first = load({ url: 'https://hacktivity.test/x?source=play', referrer: `android-app://${PKG}/` });
    assert.deepEqual(attrs(first), ['play-app', 'play']);
    assert.deepEqual(attrs(load()), ['browser', 'web']);
});

test('storage throwing gives browser/web without throwing', async () => {
    const w = load({ storage: 'throws' });
    assert.deepEqual(attrs(w), ['browser', 'web']);
    // and a valid marker still cannot be remembered, but the page still works for this load
    const w2 = load({ storage: 'throws', url: 'https://hacktivity.test/x?source=play', referrer: `android-app://${PKG}/` });
    assert.deepEqual(attrs(w2), ['play-app', 'play']);
});

test('the desktop token wins over a stored Play value', () => {
    const w = load({ userAgent: 'X HacktivityApp/1.0.0 (game=g; edition=full)', storage: { 'hacktivity.platform': PLAY() } });
    assert.deepEqual(attrs(w), ['desktop-app', 'steam']);
});

test('only the source=play value counts as a marker; other params are kept', async () => {
    const w = load({ url: 'https://hacktivity.test/x?source=other&a=b', referrer: `android-app://${PKG}/` });
    assert.deepEqual(attrs(w), ['browser', 'web']);
    assert.equal(w.location.search, '?source=other&a=b');
});

test('stubs exist so callers do not break before P5 and P7', async () => {
    const w = load();
    assert.equal(typeof w.HacktivityPlatform.openOutside, 'function');
    assert.equal((await w.HacktivityPlatform.buy()).ok, false);
    assert.equal((await w.HacktivityPlatform.restore()).ok, false);
});

test('desktop token with a stray marker: still desktop-app, marker stripped', () => {
    const w = load({ url: 'https://hacktivity.test/x?source=play&a=1', userAgent: 'X HacktivityApp/1.0.0 (game=g; edition=full)' });
    assert.deepEqual(attrs(w), ['desktop-app', 'steam']);
    assert.equal(w.location.search, '?a=1');
});

test('Digital Goods resolving to null or undefined is not a Play app', async () => {
    for (const value of [null, undefined]) {
        const w = load({ url: 'https://hacktivity.test/x?source=play', dg: () => Promise.resolve(value) });
        await w.HacktivityPlatform.ready;
        assert.deepEqual(attrs(w), ['browser', 'web'], String(value));
        assert.equal(w.sessionStorage.getItem('hacktivity.platform'), null);
    }
});
