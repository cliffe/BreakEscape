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

const FIXTURE = JSON.parse(readFileSync(join(here, 'fixtures/app-paths.json'), 'utf8'));
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
// the page is shown as an installed app (a TWA is fullscreen)
const FULLSCREEN = (w) => { w.matchMedia = (q) => ({ matches: /fullscreen/.test(q), media: q }); };
const plain = (x) => JSON.parse(JSON.stringify(x)); // jsdom objects live in another realm
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
    const w = load({ url: 'https://hacktivity.test/app/licence-to-hack?source=play&x=1', referrer: `android-app://${PKG}/`, before: FULLSCREEN });
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
    const w = load({ url: 'https://hacktivity.test/app/licence-to-hack?source=play', before: FULLSCREEN,
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
    const first = load({ url: 'https://hacktivity.test/x?source=play', referrer: `android-app://${PKG}/`, before: FULLSCREEN });
    assert.deepEqual(attrs(first), ['play-app', 'play']);
    assert.deepEqual(attrs(load()), ['browser', 'web']);
});

test('storage throwing gives browser/web without throwing', async () => {
    const w = load({ storage: 'throws' });
    assert.deepEqual(attrs(w), ['browser', 'web']);
    // and a valid marker still cannot be remembered, but the page still works for this load
    const w2 = load({ storage: 'throws', url: 'https://hacktivity.test/x?source=play', referrer: `android-app://${PKG}/`, before: FULLSCREEN });
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


// ---- version code, cold start from a link ----


test('marker plus v: v is stored and both are stripped', async () => {
    const w = load({ url: 'https://hacktivity.test/app/licence-to-hack?source=play&v=2&x=1', referrer: `android-app://${PKG}/`, before: FULLSCREEN });
    await w.HacktivityPlatform.ready;
    assert.equal(stored(w).v, '2');
    assert.equal(w.location.search, '?x=1');
});

test('a v that is not 1 to 9 digits is ignored', async () => {
    for (const v of ['x', '2a', '-1', '1234567890', '']) {
        const w = load({ url: `https://hacktivity.test/app/licence-to-hack?source=play&v=${v}`, referrer: `android-app://${PKG}/`, before: FULLSCREEN });
        await w.HacktivityPlatform.ready;
        assert.equal(stored(w).v, '', JSON.stringify(v));
    }
});

test('v without the marker is ignored and left in the address', () => {
    const w = load({ url: 'https://hacktivity.test/x?v=2', referrer: `android-app://${PKG}/` });
    assert.deepEqual(attrs(w), ['browser', 'web']);
    assert.equal(w.location.search, '?v=2');
});

test('cold start from a link: no marker, android-app referrer, shown as an app: play-app', async () => {
    const w = load({ url: 'https://hacktivity.test/hacktivities/42/play', referrer: `android-app://${PKG}/`, before: FULLSCREEN });
    assert.deepEqual(attrs(w), ['play-app', 'play']);
    assert.equal(stored(w).package, PKG);
    assert.equal(w.HacktivityPlatform.gameKey, 'licence-to-hack');
    assert.equal(w.HacktivityPlatform.homeUrl(), '/app/licence-to-hack');
});

test('cold start from a link: standalone and minimal-ui count too', () => {
    for (const mode of ['standalone', 'minimal-ui']) {
        const w = load({ referrer: `android-app://${PKG}/`, before: (x) => { x.matchMedia = (q) => ({ matches: q.includes(`display-mode: ${mode}`) }); } });
        assert.deepEqual(attrs(w), ['play-app', 'play'], mode);
    }
});

test('android-app referrer in a browser tab (display-mode browser, or no matchMedia) is not the app', () => {
    let w = load({ referrer: `android-app://${PKG}/`, before: (x) => { x.matchMedia = () => ({ matches: false }); } });
    assert.deepEqual(attrs(w), ['browser', 'web']);
    w = load({ referrer: `android-app://${PKG}/` });
    assert.deepEqual(attrs(w), ['browser', 'web']);
    w = load({ referrer: `android-app://${PKG}/`, before: (x) => { x.matchMedia = () => { throw new Error('no'); }; } });
    assert.deepEqual(attrs(w), ['browser', 'web']);
});

test('cold start: an unlisted package or an https referrer does not count', () => {
    let w = load({ referrer: 'android-app://com.evil.app/', before: FULLSCREEN });
    assert.deepEqual(attrs(w), ['browser', 'web']);
    w = load({ referrer: 'https://hacktivity.test/', before: FULLSCREEN });
    assert.deepEqual(attrs(w), ['browser', 'web']);
});

test('cold start does not override a desktop app', () => {
    const w = load({ referrer: `android-app://${PKG}/`, before: FULLSCREEN, userAgent: 'X HacktivityApp/1.0.0 (game=g; edition=full)' });
    assert.deepEqual(attrs(w), ['desktop-app', 'steam']);
});

test('there is no remembered version: a link start has none, so it uses the window.open fallback', () => {
    const w = load({ referrer: `android-app://${PKG}/`, before: (x) => { FULLSCREEN(x); x.localStorage.setItem('hacktivity.playVersion', '3'); } });
    assert.equal(stored(w).v, '');
    assert.equal(w.localStorage.getItem('hacktivity.playVersion'), '3', 'untouched');
});

test('a launch with v stores it for the tab only, nothing in localStorage', async () => {
    const w = load({ url: 'https://hacktivity.test/app/licence-to-hack?source=play&v=4', referrer: `android-app://${PKG}/`, before: FULLSCREEN });
    await w.HacktivityPlatform.ready;
    assert.equal(stored(w).v, '4');
    assert.equal(w.localStorage.getItem('hacktivity.playVersion'), null);
});

test('the marker is not enough in a browser tab: no display mode, no app (referrer or Digital Goods)', async () => {
    const withReferrer = load({ url: 'https://hacktivity.test/x?source=play&v=2', referrer: `android-app://${PKG}/` });
    assert.deepEqual(attrs(withReferrer), ['browser', 'web']);
    assert.equal(withReferrer.location.search, '', 'marker still stripped');
    const withDg = load({ url: 'https://hacktivity.test/x?source=play', dg: () => Promise.resolve({}) });
    await withDg.HacktivityPlatform.ready;
    assert.deepEqual(attrs(withDg), ['browser', 'web']);
    const browserMode = load({ url: 'https://hacktivity.test/x?source=play', referrer: `android-app://${PKG}/`, before: (x) => { x.matchMedia = () => ({ matches: false }); } });
    assert.deepEqual(attrs(browserMode), ['browser', 'web']);
});

// ---- openOutside ----

const APP_METAS = (extra = '') => `<meta name="hacktivity-play-packages" content="${PKG}=licence-to-hack">` +
    `<meta name="hacktivity-app-event" content="${FIXTURE.eventId}">` +
    `<meta name="hacktivity-app-paths" content='${JSON.stringify(FIXTURE.patterns).replace(/'/g, '&#39;')}'>` + extra;
const HOOKS = '<meta name="hacktivity-test-hooks" content="1">';

// A play-app page at `path`, with the real AppPaths patterns, an app version, and the navigation hooks
function playPage(path = '/hacktivities/6/play', { v = '2', hooks = true, stub = true, extra = {} } = {}) {
    const w = load({
        url: `https://hacktivity.test${path}`, metas: false,
        storage: { 'hacktivity.platform': PLAY({ eventId: String(FIXTURE.eventId), appPaths: FIXTURE.patterns, v }) },
        before: (x) => {
            x.document.head.insertAdjacentHTML('beforeend', APP_METAS(hooks ? HOOKS : ''));
            x.__hacktivityOutside = []; x.__hacktivityHome = []; x.__hacktivityStubNavigation = stub;
            x.__opened = []; x.open = (...a) => { x.__opened.push(a); return null; };
            Object.assign(x, extra);
        },
    });
    return w;
}

test('openOutside in the Play app (v>=2) sends https://... through the hacktivity-outside scheme', () => {
    const w = playPage();
    const r = w.HacktivityPlatform.openOutside('https://hacktivity.co.uk/terms?a=1&b=2');
    assert.deepEqual(plain(r), { ok: true, via: 'stub' });
    assert.deepEqual(plain(w.__hacktivityOutside), [{
        url: 'https://hacktivity.co.uk/terms?a=1&b=2', via: 'trampoline',
        target: 'hacktivity-outside://open?url=' + encodeURIComponent('https://hacktivity.co.uk/terms?a=1&b=2'),
    }]);
});

test('openOutside without the stub navigates with location.href for the trampoline and window.open otherwise', () => {
    // an off-site link in an old app (v=1) falls back to window.open
    let w = playPage('/hacktivities/6/play', { v: '1', stub: false });
    w.HacktivityPlatform.openOutside('https://cliffe.github.io/HacktivityLabSheets/');
    assert.deepEqual(plain(w.__opened), [['https://cliffe.github.io/HacktivityLabSheets/', '_blank', 'noopener']]);
    assert.equal(w.__hacktivityOutside[0].via, 'window');
    // unknown version: also the fallback
    w = playPage('/hacktivities/6/play', { v: '', stub: false });
    w.HacktivityPlatform.openOutside('https://cliffe.github.io/x');
    assert.equal(w.__opened.length, 1);
});

test('openOutside refuses payment paths, in-app paths, userinfo, odd characters and non-https', () => {
    const w = playPage();
    const refused = (url) => w.HacktivityPlatform.openOutside(url);
    for (const path of ['/pricing', '/pricing/3', '/plans', '/subscriptions/1/customer_portal', '/checkout', '/pages/membership', '/play_purchases/intents', '/PRICING']) {
        assert.equal(refused('https://hacktivity.co.uk' + path).reason, 'purchase', path);
        assert.equal(refused('https://hacktivity.test' + path).reason, 'purchase', path);
    }
    assert.equal(refused('https://hacktivity.test/hacktivities/6/challenges/3/vm_sets/4/vms/5/vnc_console').reason, 'in-app');
    assert.equal(refused('/hacktivities/6/play').reason, 'in-app');
    assert.equal(refused('https://user@hacktivity.co.uk/terms').reason, 'invalid-url');
    assert.equal(refused('https://user:pw@hacktivity.co.uk/terms').reason, 'invalid-url');
    assert.equal(refused('https://hacktivity.co.uk\\@evil.example/').reason, 'invalid-url');
    assert.equal(refused('https://hacktivity.co.uk/a b').reason, 'invalid-url');
    assert.equal(refused('https://hacktivity.co.uk/a\nb').reason, 'invalid-url');
    assert.equal(refused('javascript:alert(1)').reason, 'invalid-url');
    assert.equal(refused('http://hacktivity.co.uk/terms').reason, 'invalid-url');
    assert.equal(refused('hacktivity-outside://open?url=x').reason, 'invalid-url');
    assert.equal(refused('https://hacktivity.co.uk/' + 'a'.repeat(3000)).reason, 'invalid-url');
    assert.equal(refused('').reason, 'invalid-url');
    assert.deepEqual(w.__hacktivityOutside, [], 'nothing was sent');
});

test('openOutside allows http only for the page\'s own origin (a debug build)', () => {
    const w = load({
        url: 'http://localhost:8083/hacktivities/6/play', metas: false,
        storage: { 'hacktivity.platform': PLAY({ appPaths: FIXTURE.patterns, v: '2' }) },
        before: (x) => { x.document.head.insertAdjacentHTML('beforeend', APP_METAS(HOOKS)); x.__hacktivityOutside = []; x.__hacktivityStubNavigation = true; },
    });
    assert.equal(w.HacktivityPlatform.openOutside('http://localhost:8083/terms').ok, true);
    assert.equal(w.HacktivityPlatform.openOutside('http://localhost:9999/terms').reason, 'invalid-url');
});

test('openOutside in a plain browser is window.open and does not use the hand-off', () => {
    const w = load({ before: (x) => { x.__opened = []; x.open = (...a) => { x.__opened.push(a); }; } });
    assert.deepEqual(plain(w.HacktivityPlatform.openOutside('https://hacktivity.co.uk/pricing')), { ok: true, via: 'window' });
    assert.deepEqual(plain(w.__opened), [['https://hacktivity.co.uk/pricing', '_blank', 'noopener']]);
});

test('hooks are off without the meta, even with the arrays set', () => {
    const w = playPage('/hacktivities/6/play', { hooks: false, v: '2', stub: true });
    w.HacktivityPlatform.openOutside('https://hacktivity.co.uk/terms');
    assert.deepEqual(plain(w.__hacktivityOutside), []);
});

// ---- link routing ----

function click(w, html, attrs = '') {
    const body = w.document.body;
    body.innerHTML = html;
    const a = body.querySelector('a, button, span');
    const ev = new w.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    a.dispatchEvent(ev);
    return ev;
}
const link = (href, extra = '') => `<a href="${href}" ${extra}><span id="inner">go</span></a>`;

test('Play app: pages outside the in-app paths go out; pages inside stay (real AppPaths + route helpers)', () => {
    for (const [name, p] of Object.entries(FIXTURE.stay)) {
        const w = playPage();
        const ev = click(w, link(p));
        assert.equal(ev.defaultPrevented, false, `stay: ${name} ${p}`);
        assert.deepEqual(w.__hacktivityOutside, [], name);
    }
    for (const [name, p] of Object.entries(FIXTURE.leave)) {
        const w = playPage();
        const ev = click(w, link(p));
        assert.equal(ev.defaultPrevented, true, `leave: ${name} ${p}`);
        // payment pages are refused, everything else is sent
        const sent = w.__hacktivityOutside.length === 1;
        const payment = /pricing|plans|subscriptions/.test(p);
        assert.equal(sent, !payment, `${name} ${p}`);
    }
});

test('Play app: a click on a child of the link counts, and a plans link sends nothing', () => {
    const w = playPage();
    const body = w.document.body;
    body.innerHTML = link('/pricing');
    const ev = new w.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    body.querySelector('#inner').dispatchEvent(ev);
    assert.equal(ev.defaultPrevented, true);
    assert.deepEqual(plain(w.__hacktivityOutside), []);
});

test('Play app: data-outside, off-origin and target=_blank off-app links go out; in-app target=_blank stays', () => {
    let w = playPage();
    assert.equal(click(w, link('https://cliffe.github.io/HacktivityLabSheets/', 'target="_blank" rel="noopener"')).defaultPrevented, true);
    assert.equal(w.__hacktivityOutside[0].url, 'https://cliffe.github.io/HacktivityLabSheets/');
    w = playPage();
    assert.equal(click(w, link('/terms', 'data-outside="true"')).defaultPrevented, true);
    assert.equal(w.__hacktivityOutside[0].url, 'https://hacktivity.test/terms');
    w = playPage();
    const vnc = FIXTURE.stay['vnc console'] + '?token=abc';
    assert.equal(click(w, link(vnc, 'target="_blank" rel="noopener noreferrer"')).defaultPrevented, false);
    assert.deepEqual(plain(w.__hacktivityOutside), []);
    w = playPage();
    assert.equal(click(w, link('/hacktivities/6/play', 'data-outside="true"')).defaultPrevented, false, 'data-outside on an in-app page just navigates');
    assert.deepEqual(plain(w.__hacktivityOutside), []);
});

test('Play app: rails-ujs links, downloads, anchors, mail and forms are left alone', () => {
    const w = playPage();
    for (const html of [
        link('/users/edit', 'data-method="delete"'), link('/users/edit', 'data-remote="true"'), link('/files/a.zip', 'download'),
        link('#top'), link('/hacktivities/6/play#x'), link('mailto:a@b.c'), link('tel:123'), link('javascript:void(0)'),
        '<form action="/pricing" method="post"><button id="b">pay</button></form>',
        '<button id="b2">no link</button>',
    ]) {
        const ev = click(w, html);
        assert.equal(ev.defaultPrevented, false, html);
    }
    assert.deepEqual(plain(w.__hacktivityOutside), []);
});

test('Play app: middle and right clicks, and clicks another handler already took, are left alone', () => {
    const w = playPage();
    w.document.body.innerHTML = link('/terms');
    const a = w.document.querySelector('a');
    const mid = new w.MouseEvent('click', { bubbles: true, cancelable: true, button: 1 });
    a.dispatchEvent(mid);
    assert.equal(mid.defaultPrevented, false);
    assert.deepEqual(plain(w.__hacktivityOutside), []);
});

test('Play app: with no in-app list yet, only data-outside and off-origin links go out', () => {
    const w = load({
        url: 'https://hacktivity.test/users/sign_in', metas: false,
        storage: { 'hacktivity.platform': PLAY({ appPaths: [], v: '2' }) },
        before: (x) => { x.document.head.insertAdjacentHTML('beforeend', `<meta name="hacktivity-test-hooks" content="1">`); x.__hacktivityOutside = []; x.__hacktivityStubNavigation = true; },
    });
    assert.equal(click(w, link('/users/password/new')).defaultPrevented, false);
    assert.equal(click(w, link('/terms')).defaultPrevented, false);
    assert.equal(click(w, link('/terms', 'data-outside')).defaultPrevented, true);
    assert.equal(click(w, link('https://cliffe.github.io/x')).defaultPrevented, true);
});

test('browser and desktop app: links are never touched', () => {
    for (const opts of [{}, { userAgent: 'X HacktivityApp/1.0.0 (game=g; edition=full)' }]) {
        const w = load({ ...opts, before: (x) => { x.__hacktivityOutside = []; x.document.head.insertAdjacentHTML('beforeend', HOOKS); } });
        for (const html of [link('/pricing'), link('/terms', 'data-outside'), link('https://example.com/', 'target="_blank"')]) {
            assert.equal(click(w, html).defaultPrevented, false, html);
        }
        assert.deepEqual(plain(w.__hacktivityOutside), []);
    }
});

// ---- landing guard, remember me ----

test('landing guard: a Play page outside the in-app paths goes home, twice a minute at most', () => {
    const w = playPage('/');
    assert.deepEqual(plain(w.__hacktivityHome), [{ from: '/', to: '/app/licence-to-hack' }]);
    // the same tab again (the guard's own record is in sessionStorage)
    const times = JSON.parse(w.sessionStorage.getItem('hacktivity.landingGuard'));
    assert.equal(times.length, 1);
    const second = load({
        url: 'https://hacktivity.test/terms', metas: false,
        storage: { 'hacktivity.platform': PLAY({ appPaths: FIXTURE.patterns, v: '2' }), 'hacktivity.landingGuard': JSON.stringify([Date.now() - 1000]) },
        before: (x) => { x.document.head.insertAdjacentHTML('beforeend', HOOKS); x.__hacktivityHome = []; x.__hacktivityStubNavigation = true; },
    });
    assert.equal(second.__hacktivityHome.length, 1, 'second in a minute still goes');
    const third = load({
        url: 'https://hacktivity.test/terms', metas: false,
        storage: { 'hacktivity.platform': PLAY({ appPaths: FIXTURE.patterns, v: '2' }), 'hacktivity.landingGuard': JSON.stringify([Date.now() - 1000, Date.now() - 500]) },
        before: (x) => { x.document.head.insertAdjacentHTML('beforeend', HOOKS); x.__hacktivityHome = []; x.__hacktivityStubNavigation = true; },
    });
    assert.deepEqual(plain(third.__hacktivityHome), [], 'third in a minute does not loop');
    const old = load({
        url: 'https://hacktivity.test/terms', metas: false,
        storage: { 'hacktivity.platform': PLAY({ appPaths: FIXTURE.patterns, v: '2' }), 'hacktivity.landingGuard': JSON.stringify([Date.now() - 90000, Date.now() - 80000]) },
        before: (x) => { x.document.head.insertAdjacentHTML('beforeend', HOOKS); x.__hacktivityHome = []; x.__hacktivityStubNavigation = true; },
    });
    assert.equal(old.__hacktivityHome.length, 1, 'records older than a minute do not count');
});

test('landing guard: in-app pages, a missing list, a missing game key, and other windows are left alone', () => {
    for (const p of Object.values(FIXTURE.stay)) assert.deepEqual(plain(playPage(p).__hacktivityHome), [], p);
    const noList = load({
        url: 'https://hacktivity.test/', metas: false,
        storage: { 'hacktivity.platform': PLAY({ appPaths: [] }) },
        before: (x) => { x.document.head.insertAdjacentHTML('beforeend', HOOKS); x.__hacktivityHome = []; x.__hacktivityStubNavigation = true; },
    });
    assert.deepEqual(plain(noList.__hacktivityHome), []);
    const browser = load({ url: 'https://hacktivity.test/', before: (x) => { x.__hacktivityHome = []; } });
    assert.deepEqual(plain(browser.__hacktivityHome), []);
    const desktop = load({ url: 'https://hacktivity.test/', userAgent: 'X HacktivityApp/1.0.0 (game=g; edition=full)', before: (x) => { x.__hacktivityHome = []; } });
    assert.deepEqual(plain(desktop.__hacktivityHome), []);
});

test('landing guard: storage that cannot count does not redirect', () => {
    const w = playPage('/', {
        extra: {},
    });
    // a page whose sessionStorage rejects writes after the first read
    const blocked = load({
        url: 'https://hacktivity.test/', metas: false,
        storage: { 'hacktivity.platform': PLAY({ appPaths: FIXTURE.patterns, v: '2' }) },
        before: (x) => {
            x.document.head.insertAdjacentHTML('beforeend', HOOKS); x.__hacktivityHome = []; x.__hacktivityStubNavigation = true;
            const real = x.Storage.prototype.setItem;
            x.Storage.prototype.setItem = function (k, v) { if (k === 'hacktivity.landingGuard') throw new Error('full'); return real.call(this, k, v); };
        },
    });
    assert.deepEqual(plain(blocked.__hacktivityHome), []);
    assert.equal(w.__hacktivityHome.length, 1);
});

test('sign-in form: Remember me is ticked in the Play app only', async () => {
    const FORM = '<form><input type="checkbox" name="user[remember_me]" id="r"><input type="checkbox" name="other" id="o"></form>';
    const play = load({
        url: 'https://hacktivity.test/users/sign_in', storage: { 'hacktivity.platform': PLAY() },
        before: (x) => { x.document.body.innerHTML = FORM; },
    });
    await new Promise((r) => setTimeout(r, 30)); // jsdom fires DOMContentLoaded after the script
    assert.equal(play.document.getElementById('r').checked, true);
    assert.equal(play.document.getElementById('o').checked, false);
    const web = load({ url: 'https://hacktivity.test/users/sign_in', before: (x) => { x.document.body.innerHTML = FORM; } });
    assert.equal(web.document.getElementById('r').checked, false);
});

test('sign-in form added after load is ticked once the page has loaded', async () => {
    const w = load({ url: 'https://hacktivity.test/users/sign_in', storage: { 'hacktivity.platform': PLAY() } });
    w.document.body.innerHTML = '<input type="checkbox" name="user[remember_me]" id="r">';
    w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
    assert.equal(w.document.getElementById('r').checked, true);
});


// ---- review fixes: purchase pages, encoded paths, hosts, marker params ----

const homes = (w) => plain(w.__hacktivityHome);

test('a payment page always goes home, even when the two-a-minute budget is spent', () => {
    for (const path of ['/pricing', '/plans', '/subscriptions/3', '/checkout', '/pages/membership']) {
        const w = load({
            url: `https://hacktivity.test${path}`, metas: false,
            storage: { 'hacktivity.platform': PLAY({ appPaths: FIXTURE.patterns, v: '2' }),
                'hacktivity.landingGuard': JSON.stringify([Date.now() - 1000, Date.now() - 500]) },
            before: (x) => { x.document.head.insertAdjacentHTML('beforeend', HOOKS); x.__hacktivityHome = []; x.__hacktivityStubNavigation = true; },
        });
        assert.deepEqual(homes(w), [{ from: path, to: '/app/licence-to-hack' }], path);
    }
});

test('a payment page with no in-app list yet still goes home', () => {
    const w = load({
        url: 'https://hacktivity.test/pricing', metas: false,
        storage: { 'hacktivity.platform': PLAY({ appPaths: [] }) },
        before: (x) => { x.document.head.insertAdjacentHTML('beforeend', HOOKS); x.__hacktivityHome = []; x.__hacktivityStubNavigation = true; },
    });
    assert.equal(homes(w).length, 1);
});

test('a payment page that keeps coming back is blanked with a message and a link home', async () => {
    const w = load({
        url: 'https://hacktivity.test/pricing', metas: false,
        storage: { 'hacktivity.platform': PLAY({ appPaths: FIXTURE.patterns, v: '2' }),
            'hacktivity.purchaseGuard': JSON.stringify([1, 2, 3, 4, 5, 6].map((i) => Date.now() - i * 100)) },
        before: (x) => { x.document.head.insertAdjacentHTML('beforeend', HOOKS); x.__hacktivityHome = []; x.__hacktivityStubNavigation = true; x.document.body.innerHTML = '<p id="plans">Subscribe now</p>'; },
    });
    await new Promise((r) => setTimeout(r, 30));
    assert.deepEqual(homes(w), []);
    assert.equal(w.document.getElementById('plans'), null, 'the page is gone');
    assert.match(w.document.body.textContent, /Not available in the app/);
    assert.equal(w.document.querySelector('a').getAttribute('href'), '/app/licence-to-hack');
});

test('a payment page with storage that cannot count is blanked, not looped', async () => {
    const w = load({
        url: 'https://hacktivity.test/pricing', metas: false,
        storage: { 'hacktivity.platform': PLAY({ appPaths: FIXTURE.patterns }) },
        before: (x) => {
            x.document.head.insertAdjacentHTML('beforeend', HOOKS); x.__hacktivityHome = []; x.__hacktivityStubNavigation = true;
            x.document.body.innerHTML = '<p id="plans">Subscribe now</p>';
            const real = x.Storage.prototype.setItem;
            x.Storage.prototype.setItem = function (k, v) { if (k === 'hacktivity.purchaseGuard') throw new Error('full'); return real.call(this, k, v); };
        },
    });
    await new Promise((r) => setTimeout(r, 30));
    assert.deepEqual(homes(w), []);
    assert.match(w.document.body.textContent, /Not available in the app/);
});

test('a payment page is left alone in a browser and in the desktop app', () => {
    for (const opts of [{}, { userAgent: 'X HacktivityApp/1.0.0 (game=g; edition=full)' }]) {
        const w = load({ ...opts, url: 'https://hacktivity.test/pricing', before: (x) => { x.__hacktivityHome = []; x.document.body.innerHTML = '<p id="plans">x</p>'; } });
        assert.ok(w.document.getElementById('plans'));
        assert.deepEqual(homes(w), []);
    }
});

test('percent-encoded letters, ;params and doubled slashes do not get a payment link past openOutside', () => {
    const w = playPage();
    const refused = (path) => w.HacktivityPlatform.openOutside('https://hacktivity.co.uk' + path);
    for (const path of ['/%70lans', '/%50LANS', '/pl%61ns', '/%70ricing', '/subscription%73/1', '/plans;x', '/;/plans', '/pricing;jsessionid=1', '//plans', '/%63heckout']) {
        assert.equal(refused(path).reason, 'purchase', path);
    }
    // the same on the page's own origin, where the in-app list also applies
    assert.equal(w.HacktivityPlatform.openOutside('https://hacktivity.test/%68acktivities/6/play').reason, 'in-app');
    assert.equal(w.HacktivityPlatform.openOutside('https://hacktivity.test/hacktivities/6/pl%61y').reason, 'in-app');
    assert.deepEqual(plain(w.__hacktivityOutside), []);
});

test('an encoded payment path as a link is swallowed, and an encoded payment page goes home', () => {
    const w = playPage();
    assert.equal(click(w, link('/%70lans')).defaultPrevented, true);
    assert.deepEqual(plain(w.__hacktivityOutside), []);
    const page = load({
        url: 'https://hacktivity.test/%70ricing', metas: false,
        storage: { 'hacktivity.platform': PLAY({ appPaths: FIXTURE.patterns, v: '2' }), 'hacktivity.landingGuard': JSON.stringify([Date.now() - 1000, Date.now() - 500]) },
        before: (x) => { x.document.head.insertAdjacentHTML('beforeend', HOOKS); x.__hacktivityHome = []; x.__hacktivityStubNavigation = true; },
    });
    assert.equal(homes(page).length, 1);
});

test('the Play app marker and version are removed from the query of a link sent out', () => {
    const w = playPage();
    w.HacktivityPlatform.openOutside('https://hacktivity.co.uk/contacts/new?source=play&v=2&a=1#x');
    assert.equal(w.__hacktivityOutside[0].url, 'https://hacktivity.co.uk/contacts/new?a=1#x');
    w.HacktivityPlatform.openOutside('https://hacktivity.co.uk/contacts/new?source=other&v=abc');
    assert.equal(w.__hacktivityOutside[1].url, 'https://hacktivity.co.uk/contacts/new?source=other&v=abc');
});

test('a host the hand-off does not open falls back to window.open; allowed hosts use it', () => {
    const page = load({
        url: 'https://hacktivity.test/hacktivities/6/play', metas: false,
        storage: { 'hacktivity.platform': PLAY({ appPaths: FIXTURE.patterns, v: '2', outsideHosts: ['hacktivity.co.uk', 'cliffe.github.io'] }) },
        before: (x) => { x.document.head.insertAdjacentHTML('beforeend', HOOKS); x.__hacktivityOutside = []; x.__opened = []; x.open = (...a) => { x.__opened.push(a); }; },
    });
    page.HacktivityPlatform.openOutside('https://cliffe.github.io/HacktivityLabSheets/');
    page.HacktivityPlatform.openOutside('https://example.com/docs');
    page.HacktivityPlatform.openOutside('https://CLIFFE.github.io/x');
    assert.deepEqual(plain(page.__hacktivityOutside.map((e) => [e.url, e.via])), [
        ['https://cliffe.github.io/HacktivityLabSheets/', 'trampoline'],
        ['https://example.com/docs', 'window'],
        ['https://cliffe.github.io/x', 'trampoline'],
    ]);
    assert.deepEqual(plain(page.__opened.map((a) => a[0])), ['https://example.com/docs'], 'only the refused host is opened here');
});

test('the outside-hosts meta is read and kept for pages without it', async () => {
    const w = load({
        url: 'https://hacktivity.test/app/licence-to-hack?source=play&v=2', referrer: `android-app://${PKG}/`, before: FULLSCREEN,
        metas: true,
    });
    await w.HacktivityPlatform.ready;
    assert.deepEqual(stored(w).outsideHosts, []);
    const withMeta = load({
        url: 'https://hacktivity.test/app/licence-to-hack?source=play&v=2', referrer: `android-app://${PKG}/`, metas: false,
        before: (x) => { FULLSCREEN(x); x.document.head.insertAdjacentHTML('beforeend', APP_METAS('<meta name="hacktivity-outside-hosts" content="Hacktivity.co.uk, cliffe.github.io">')); },
    });
    assert.deepEqual(stored(withMeta).outsideHosts, ['hacktivity.co.uk', 'cliffe.github.io']);
});

test('click router: an off-site link to a host the hand-off refuses is left to the app, an allowed one goes out', () => {
    const w = load({
        url: 'https://hacktivity.test/hacktivities/6/play', metas: false,
        storage: { 'hacktivity.platform': PLAY({ appPaths: FIXTURE.patterns, v: '2', outsideHosts: ['hacktivity.co.uk', 'cliffe.github.io'] }) },
        before: (x) => { x.document.head.insertAdjacentHTML('beforeend', HOOKS); x.__hacktivityOutside = []; x.__hacktivityStubNavigation = true; },
    });
    assert.equal(click(w, link('https://example.com/', 'target="_blank"')).defaultPrevented, false);
    assert.deepEqual(plain(w.__hacktivityOutside), []);
    assert.equal(click(w, link('https://cliffe.github.io/HacktivityLabSheets/', 'target="_blank"')).defaultPrevented, true);
    assert.equal(w.__hacktivityOutside.length, 1);
    // data-outside to a refused host still goes through openOutside, which opens it in the app's own view
    assert.equal(click(w, link('https://example.com/', 'data-outside')).defaultPrevented, true);
    assert.equal(w.__hacktivityOutside[1].via, 'window');
});
