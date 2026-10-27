// pwa-install.js: when the title screen's install button, instructions and Play link show. The real
// client-platform.js and pwa-install.js run in jsdom as classic scripts, with the page markup that
// Hacktivity's game_shell/_install partial renders.
// Run with: bin/test-js test/js/pwa-install.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = (f) => readFileSync(join(here, '../../public/break_escape/js', f), 'utf8');
const platformSrc = js('client-platform.js');
const installSrc = js('pwa-install.js');

const CHROME = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36';
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const IPAD_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const MAC_SAFARI = IPAD_DESKTOP;
const MAC_SAFARI_16 = IPAD_DESKTOP.replace('Version/17.4', 'Version/16.6');
const MAC_CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36';
const FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0';
const DESKTOP_APP = 'Mozilla/5.0 Electron/30 HacktivityApp/0.2.0 (game=licence-to-hack; edition=full; store=web)';
const STEAM_APP = 'Mozilla/5.0 Electron/30 HacktivityApp/0.2.0 (game=licence-to-hack; edition=full)';
const PKG = 'uk.co.hacktivity.licencetohack';

const PAGE = (withPlay) => `<!doctype html><html><head>
<meta name="hacktivity-play-packages" content="${PKG}=licence-to-hack"><meta name="hacktivity-app-event" content="42">
</head><body>
<button type="button" data-pwa-install data-store-only="web" aria-expanded="false" style="display: none"><span data-pwa-install-label>Install the app</span></button>
${withPlay ? '<a data-pwa-play href="https://play.google.com/store/apps/details?id=' + PKG + '" style="display: none">Get it on Google Play</a>' : ''}
<div data-pwa-help style="display: none"><p data-pwa-help-for="ios" style="display: none">ios text</p><p data-pwa-help-for="mac" style="display: none">mac text</p></div>
</body></html>`;

// opts: ua, touch, play (page has the Play link), display ('standalone'|'fullscreen'|'browser'), referrer, url, standalone (iOS)
async function load(opts = {}) {
    const dom = new JSDOM(PAGE(opts.play), { url: opts.url || 'https://hacktivity.test/hacktivities/42/play', referrer: opts.referrer, runScripts: 'outside-only', pretendToBeVisual: true });
    const w = dom.window;
    Object.defineProperty(w.navigator, 'userAgent', { value: opts.ua || CHROME });
    if (opts.touch) Object.defineProperty(w.navigator, 'maxTouchPoints', { value: opts.touch });
    if (opts.standalone) Object.defineProperty(w.navigator, 'standalone', { value: true });
    const mode = opts.display || 'browser';
    w.matchMedia = (q) => ({ matches: q.includes(`display-mode: ${mode}`), media: q });
    w.eval(platformSrc);
    w.eval(installSrc);
    await w.HacktivityPlatform.ready;
    await new Promise((r) => w.setTimeout(r, 0));
    return w;
}
const shown = (w, sel) => { const el = w.document.querySelector(sel); return !!el && el.style.display !== 'none'; };
const state = (w) => ({ button: shown(w, '[data-pwa-install]'), play: shown(w, '[data-pwa-play]'), help: shown(w, '[data-pwa-help]') });
const label = (w) => w.document.querySelector('[data-pwa-install-label]').textContent;
// a beforeinstallprompt like Chrome's, with a prompt() the test can count
function offer(w, outcome = 'accepted') {
    const ev = new w.Event('beforeinstallprompt', { cancelable: true });
    ev.prompted = 0;
    ev.prompt = () => { ev.prompted += 1; return Promise.resolve(); };
    ev.userChoice = Promise.resolve({ outcome });
    w.dispatchEvent(ev);
    return ev;
}

test('Chrome desktop: hidden until beforeinstallprompt, then an Install button; default is prevented', async () => {
    const w = await load();
    assert.deepEqual(state(w), { button: false, play: false, help: false });
    const ev = offer(w);
    assert.equal(ev.defaultPrevented, true);
    assert.deepEqual(state(w), { button: true, play: false, help: false });
    assert.equal(label(w), 'Install the app');
});

test('Chrome desktop: a click calls prompt() once and the button goes away', async () => {
    const w = await load();
    const ev = offer(w);
    w.document.querySelector('[data-pwa-install]').click();
    assert.equal(ev.prompted, 1);
    assert.equal(shown(w, '[data-pwa-install]'), false);
    w.document.querySelector('[data-pwa-install]').click();
    assert.equal(ev.prompted, 1, 'a prompt is used once');
});

test('a dismissed prompt leaves no button until the browser offers again', async () => {
    const w = await load();
    offer(w, 'dismissed');
    w.document.querySelector('[data-pwa-install]').click();
    await new Promise((r) => w.setTimeout(r, 0));
    assert.equal(shown(w, '[data-pwa-install]'), false);
    offer(w);
    assert.equal(shown(w, '[data-pwa-install]'), true);
});

test('appinstalled hides everything, and sends a GA4 event when gtag exists', async () => {
    const w = await load();
    const calls = [];
    w.gtag = (...a) => calls.push(a);
    offer(w);
    w.dispatchEvent(new w.Event('appinstalled'));
    assert.deepEqual(state(w), { button: false, play: false, help: false });
    assert.equal(calls[0][1], 'pwa_installed');
    offer(w); // a late prompt after install shows nothing
    assert.equal(shown(w, '[data-pwa-install]'), false);
    // no gtag on the page: nothing breaks
    const bare = await load();
    bare.dispatchEvent(new bare.Event('appinstalled'));
});

test('never in the desktop app (web store or steam), even with a prompt', async () => {
    for (const ua of [DESKTOP_APP, STEAM_APP]) {
        const w = await load({ ua });
        offer(w);
        assert.deepEqual(state(w), { button: false, play: false, help: false }, ua);
    }
});

test('never in the Play app: stored value, marker with referrer, cold start', async () => {
    const referrer = `android-app://${PKG}/`;
    for (const opts of [
        { url: 'https://hacktivity.test/app/licence-to-hack?source=play', referrer, display: 'fullscreen', ua: ANDROID },
        { referrer, display: 'standalone', ua: ANDROID },
        { referrer, display: 'standalone', ua: ANDROID, play: true },
    ]) {
        const w = await load(opts);
        assert.equal(w.HacktivityPlatform.appWindow, 'play-app');
        offer(w);
        assert.deepEqual(state(w), { button: false, play: false, help: false });
    }
});

test('never in the installed web app itself', async () => {
    for (const opts of [{ display: 'standalone' }, { display: 'fullscreen' }, { display: 'minimal-ui' }, { ua: IPAD, standalone: true }]) {
        const w = await load(opts);
        assert.equal(w.HacktivityPlatform.appWindow, 'pwa-app', JSON.stringify(opts));
        offer(w);
        assert.deepEqual(state(w), { button: false, play: false, help: false }, JSON.stringify(opts));
    }
});

test('a Play app page whose Play checks fail does not show the button as if it were a browser tab', async () => {
    // marker, standalone, no referrer, no Digital Goods: the page is browser/web (see client-platform.test.mjs),
    // and the display mode says installed, so the install route stays hidden
    const w = await load({ url: 'https://hacktivity.test/app/licence-to-hack?source=play', display: 'standalone', ua: ANDROID });
    assert.equal(w.HacktivityPlatform.appWindow, 'browser');
    offer(w);
    assert.equal(shown(w, '[data-pwa-install]'), false);
});

test('Android with a Play app: the Play link, never the install button', async () => {
    const w = await load({ ua: ANDROID, play: true });
    assert.deepEqual(state(w), { button: false, play: true, help: false });
    offer(w);
    assert.deepEqual(state(w), { button: false, play: true, help: false });
});

test('Android without a Play app: the install button after the prompt', async () => {
    const w = await load({ ua: ANDROID });
    assert.deepEqual(state(w), { button: false, play: false, help: false });
    offer(w);
    assert.deepEqual(state(w), { button: true, play: false, help: false });
});

test('iPad (and iPadOS in desktop mode): a How to install button that opens the iOS steps', async () => {
    for (const w of [await load({ ua: IPAD }), await load({ ua: IPAD_DESKTOP, touch: 5 })]) {
        assert.deepEqual(state(w), { button: true, play: false, help: false });
        assert.equal(label(w), 'How to install');
        w.document.querySelector('[data-pwa-install]').click();
        assert.equal(shown(w, '[data-pwa-help]'), true);
        assert.equal(shown(w, '[data-pwa-help-for="ios"]'), true);
        assert.equal(shown(w, '[data-pwa-help-for="mac"]'), false);
        assert.equal(w.document.querySelector('[data-pwa-install]').getAttribute('aria-expanded'), 'true');
        w.document.querySelector('[data-pwa-install]').click();
        assert.equal(shown(w, '[data-pwa-help]'), false, 'a second click closes it');
    }
});

test('iPhone: nothing yet (until the phone and touch work is done)', async () => {
    const w = await load({ ua: IPHONE, touch: 5 });
    assert.deepEqual(state(w), { button: false, play: false, help: false });
});

test('macOS Safari 17+: How to install with Add to Dock; Safari 16 and Chrome on a Mac do not', async () => {
    const w = await load({ ua: MAC_SAFARI });
    assert.deepEqual(state(w), { button: true, play: false, help: false });
    w.document.querySelector('[data-pwa-install]').click();
    assert.equal(shown(w, '[data-pwa-help-for="mac"]'), true);
    assert.equal(shown(w, '[data-pwa-help-for="ios"]'), false);
    assert.equal(state(await load({ ua: MAC_SAFARI_16 })).button, false);
    const chrome = await load({ ua: MAC_CHROME });
    assert.equal(state(chrome).button, false, 'no prompt yet');
    offer(chrome);
    assert.equal(label(chrome), 'Install the app');
});

test('Firefox: nothing', async () => {
    const w = await load({ ua: FIREFOX });
    assert.deepEqual(state(w), { button: false, play: false, help: false });
});

test('no platform object (client-platform.js missing): nothing shows', async () => {
    const dom = new JSDOM(PAGE(false), { url: 'https://hacktivity.test/hacktivities/42/play', runScripts: 'outside-only' });
    const w = dom.window;
    Object.defineProperty(w.navigator, 'userAgent', { value: CHROME });
    w.eval(installSrc);
    const ev = new w.Event('beforeinstallprompt', { cancelable: true });
    ev.prompt = () => Promise.resolve();
    w.dispatchEvent(ev);
    assert.equal(shown(w, '[data-pwa-install]'), false);
});

test('a page with none of the elements does not throw', async () => {
    const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://hacktivity.test/hacktivities/42/play', runScripts: 'outside-only' });
    const w = dom.window;
    Object.defineProperty(w.navigator, 'userAgent', { value: CHROME });
    w.eval(platformSrc);
    w.eval(installSrc);
    w.dispatchEvent(new w.Event('beforeinstallprompt', { cancelable: true }));
    w.dispatchEvent(new w.Event('appinstalled'));
});
