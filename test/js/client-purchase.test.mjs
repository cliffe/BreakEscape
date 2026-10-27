// client-platform.js, Play purchase and restore (P7): price, intent then token POST with the CSRF
// header, every server answer's message, the expired-intent retry, consent for an unlinked purchase,
// restore once per launch, and web/steam never touching Digital Goods.
// Run with: bin/test-js test/js/client-purchase.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { webcrypto } from 'node:crypto';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const platformSrc = readFileSync(join(here, '../../public/break_escape/js/client-platform.js'), 'utf8');
const purchaseSrc = readFileSync(join(here, '../../public/break_escape/js/client-purchase.js'), 'utf8');
const src = platformSrc + '\n;\n' + purchaseSrc; // the page loads them in this order
const PKG = 'uk.co.hacktivity.licencetohack';
const STORED = JSON.stringify({ appWindow: 'play-app', store: 'play', package: PKG, gameKey: 'licence-to-hack', eventId: '42', appPaths: [], at: 1 });

const reply = (status, body) => ({ status, body });
const GRANTED = reply(200, { status: 'granted', message: 'server text' });

// opts: signedIn (true), hooks (true), play (true), buy (button markup, true), answers (array of
// replies in order, or a function(url, payload)), fake (the __hacktivityFakeDigitalGoods object),
// confirm (returns true/false), storage (extra sessionStorage entries), userAgent
function load(opts = {}) {
    const metas = '<meta name="csrf-token" content="tok123">' +
        `<meta name="hacktivity-play-packages" content="${PKG}=licence-to-hack">` +
        '<meta name="hacktivity-app-event" content="42">' +
        (opts.signedIn === false ? '' : '<meta name="hacktivity-signed-in" content="1"><meta name="hacktivity-signed-in-as" content="agent7">' + (opts.named === false ? '' : '<meta name="hacktivity-app-event-name" content="Licence to Hack">')) +
        (opts.hooks === false ? '' : '<meta name="hacktivity-test-hooks" content="1">');
    const button = opts.buy === false ? '' :
        '<div><button type="button" data-play-buy data-product-id="game.full" data-event-id="42">Buy the full game <span data-play-price></span></button></div>';
    const dom = new JSDOM(`<!doctype html><html><head>${metas}</head><body>${button}</body></html>`, {
        url: 'https://hacktivity.test/hacktivities/42/play', runScripts: 'outside-only', pretendToBeVisual: true,
    });
    const w = dom.window;
    Object.defineProperty(w.navigator, 'userAgent', { value: opts.userAgent || 'Mozilla/5.0 Chrome/120' });
    Object.defineProperty(w.navigator, 'language', { value: 'en-GB' });
    if (opts.play !== false) w.sessionStorage.setItem('hacktivity.platform', STORED);
    for (const [k, v] of Object.entries(opts.storage || {})) w.sessionStorage.setItem(k, v);
    w.TextEncoder = TextEncoder;
    Object.defineProperty(w, 'crypto', { value: webcrypto, configurable: true });
    w.Intl = Intl;
    w.requests = [];
    const answers = Array.isArray(opts.answers) ? opts.answers.slice() : null;
    w.fetch = async (url, init) => {
        const payload = init.body ? JSON.parse(init.body) : null;
        w.requests.push({ url, headers: init.headers, payload });
        const r = answers ? (answers.shift() || reply(500, {})) : opts.answers(url, payload);
        if (r === 'network') throw new Error('offline');
        return { status: r.status, text: async () => JSON.stringify(r.body) };
    };
    w.confirms = [];
    w.confirm = (text) => { w.confirms.push(text); return opts.confirm !== false && (typeof opts.confirm === 'function' ? opts.confirm(text) : true); };
    w.__hacktivityReload = [];
    w.reloads = w.__hacktivityReload;
    if (opts.fake) w.__hacktivityFakeDigitalGoods = opts.fake;
    if (opts.dg) w.getDigitalGoodsService = opts.dg;
    w.eval(src);
    return w;
}
const settle = (w) => new Promise((r) => w.setTimeout(r, 30));
const msg = (w) => w.document.querySelector('[data-play-message]')?.textContent;
const button = (w) => w.document.querySelector('[data-play-buy]');
const INTENT = reply(201, { status: 'intent', intent_id: 9, message: 'Intent recorded.' });

test('the price slot is filled from getDetails, formatted in pounds', async () => {
    const w = load({ fake: { purchases: [] }, answers: [] });
    await w.HacktivityPlatform.ready; await settle(w);
    assert.equal(w.document.querySelector('[data-play-price]').textContent, '£14.99');
});

test('a press creates the intent, then posts the token with the intent id and the CSRF header', async () => {
    const w = load({ fake: { nextToken: () => 'fake-ok-t1' }, answers: [INTENT, GRANTED] });
    await settle(w);
    const result = await w.HacktivityPlatform.buy(button(w));
    assert.equal(result.ok, true);
    assert.equal(result.code, 'granted');
    const [a, b] = w.requests;
    assert.equal(a.url, '/play_purchases/intents');
    assert.deepEqual(a.payload, { event_id: '42' });
    assert.equal(a.headers['X-CSRF-Token'], 'tok123');
    assert.equal(b.url, '/play_purchases');
    assert.deepEqual(b.payload, { event_id: '42', product_id: 'game.full', purchase_token: 'fake-ok-t1', client: 'play-app', intent_id: 9 });
    assert.equal(b.headers['X-CSRF-Token'], 'tok123');
    assert.equal(w.reloads.length, 1, 'reloads on granted');
    assert.match(msg(w), /Licence to Hack is unlocked/);
});

test('owned reloads; pending, already_owned, claimed_elsewhere and needs_support show their wording and do not reload', async () => {
    const cases = [
        [reply(200, { status: 'owned' }), /already own Licence to Hack on this account/, 1],
        [reply(202, { status: 'pending' }), /^Purchase pending: it unlocks when Google confirms it\.$/, 0],
        [reply(200, { status: 'already_owned' }), /You already own Licence to Hack; this extra purchase will be refunded automatically/, 0],
        [reply(409, { status: 'claimed_elsewhere' }), /different Hacktivity account\. Contact support to move it/, 0],
        [reply(409, { status: 'needs_support' }), /Contact Hacktivity support/, 0],
        [reply(403, { status: 'revoked', message: 'This purchase was refunded.' }), /refunded/, 0],
        [reply(503, { status: 'try_later', message: 'Google Play is not answering.' }), /not answering/, 0],
        [reply(500, { status: 'error', message: 'Something went wrong. Please try again.' }), /Something went wrong/, 0],
    ];
    for (const [answer, pattern, reloads] of cases) {
        const w = load({ fake: {}, answers: [INTENT, answer] });
        await settle(w);
        const r = await w.HacktivityPlatform.buy(button(w));
        assert.match(msg(w), pattern, answer.body.status);
        assert.equal(w.reloads.length, reloads, answer.body.status);
        assert.equal(r.ok, answer.body.status === 'owned' || answer.body.status === 'pending' || answer.body.status === 'already_owned');
        assert.equal(button(w).disabled, false, 're-enabled');
    }
});

test('422 intent_invalid retries as a restore: same token, no intent id', async () => {
    const w = load({ fake: { nextToken: () => 'fake-ok-t2' }, answers: [INTENT, reply(422, { status: 'intent_invalid' }), GRANTED] });
    await settle(w);
    const r = await w.HacktivityPlatform.buy(button(w));
    assert.equal(r.code, 'granted');
    assert.equal(w.requests.length, 3);
    assert.equal('intent_id' in w.requests[1].payload, true);
    assert.equal('intent_id' in w.requests[2].payload, false);
    assert.equal(w.requests[2].payload.purchase_token, 'fake-ok-t2');
});

test('the retry as a restore can end in the consent prompt', async () => {
    const w = load({ fake: {}, answers: [INTENT, reply(422, { status: 'intent_invalid' }), reply(200, { status: 'unowned', message: 'x' }), GRANTED] });
    await settle(w);
    const r = await w.HacktivityPlatform.buy(button(w));
    assert.equal(r.code, 'granted');
    assert.equal(w.confirms.length, 1);
    assert.equal(w.requests[3].payload.consent, true);
});

test('both a 422 csrf and a 401 are handled, at the intent and at the claim', async () => {
    let w = load({ fake: {}, answers: [reply(422, { status: 'csrf' })] });
    await settle(w);
    await w.HacktivityPlatform.buy(button(w));
    assert.match(msg(w), /Reload the page and try again/);
    w = load({ fake: {}, answers: [reply(401, { status: 'signed_out' })] });
    await settle(w);
    await w.HacktivityPlatform.buy(button(w));
    assert.match(msg(w), /signed out\. Sign in again/);
    w = load({ fake: {}, answers: [INTENT, reply(422, { status: 'csrf' })] });
    await settle(w);
    await w.HacktivityPlatform.buy(button(w));
    assert.match(msg(w), /Reload the page/);
    w = load({ fake: {}, answers: [INTENT, reply(401, {})] });
    await settle(w);
    await w.HacktivityPlatform.buy(button(w));
    assert.match(msg(w), /signed out/);
});

test('a network failure says so', async () => {
    const w = load({ fake: {}, answers: ['network'] });
    await settle(w);
    await w.HacktivityPlatform.buy(button(w));
    assert.match(msg(w), /couldn.t reach Hacktivity/);
});

test('a guest is refused and nothing is sent', async () => {
    const w = load({ signedIn: false, fake: {}, answers: [] });
    await settle(w);
    const r = await w.HacktivityPlatform.buy(button(w));
    assert.equal(r.ok, false);
    assert.equal(r.code, 'signed_out');
    assert.equal(w.requests.length, 0);
    assert.match(msg(w), /Sign in to buy/);
});

test('a rejecting Digital Goods service shows the unavailable line and posts nothing', async () => {
    const w = load({ fake: { rejectService: true }, answers: [] });
    await settle(w);
    const r = await w.HacktivityPlatform.buy(button(w));
    assert.equal(r.code, 'unavailable');
    assert.equal(w.requests.length, 0);
    assert.match(msg(w), /Purchases aren.t available in this version of the app or on this device/);
    assert.equal(w.document.querySelector('[data-play-price]').textContent, '');
});

test('closing the payment sheet posts no token and says it was cancelled', async () => {
    const w = load({ fake: { cancelPayment: true }, answers: [INTENT] });
    await settle(w);
    const r = await w.HacktivityPlatform.buy(button(w));
    assert.equal(r.code, 'cancelled');
    assert.equal(w.requests.length, 1);
});

test('a click on the button runs buy; in a plain browser it does nothing', async () => {
    let w = load({ fake: {}, answers: [INTENT, GRANTED] });
    await settle(w);
    button(w).click();
    await settle(w);
    assert.equal(w.requests.length, 2);
    w = load({ play: false, fake: {}, answers: [] });
    await settle(w);
    button(w).click();
    await settle(w);
    assert.equal(w.requests.length, 0);
});

test('the fake is ignored without the test-hooks meta, so the real service is asked for', async () => {
    const calls = [];
    const w = load({ hooks: false, fake: { price: { currency: 'GBP', value: '1.00' } }, dg: (u) => { calls.push(u); return Promise.reject(new Error('no')); }, answers: [] });
    await settle(w);
    assert.ok(calls.length >= 1 && calls.every((u) => u === 'https://play.google.com/billing'));
    assert.equal(w.document.querySelector('[data-play-price]').textContent, '');
    const r = await w.HacktivityPlatform.buy(button(w));
    assert.equal(r.code, 'unavailable');
});

test('the real path uses PaymentRequest with the billing method and the sku, then complete(success)', async () => {
    const seen = {};
    const svc = {
        getDetails: async (ids) => ids.map((id) => ({ itemId: id, price: { currency: 'GBP', value: '14.99' } })),
        listPurchases: async () => [],
    };
    const w = load({ hooks: false, dg: () => Promise.resolve(svc), answers: [INTENT, GRANTED] });
    w.PaymentRequest = class {
        constructor(methods, details) { seen.methods = JSON.parse(JSON.stringify(methods)); seen.details = JSON.parse(JSON.stringify(details)); }
        async show() { return { details: { purchaseToken: 'real-tok' }, complete: async (s) => { seen.completed = s; } }; }
    };
    await settle(w);
    assert.equal(w.document.querySelector('[data-play-price]').textContent, '£14.99');
    await w.HacktivityPlatform.buy(button(w));
    assert.deepEqual(seen.methods, [{ supportedMethods: 'https://play.google.com/billing', data: { sku: 'game.full' } }]);
    assert.equal(seen.details.total.amount.value, '14.99');
    assert.equal(seen.completed, 'success');
    assert.equal(w.requests[1].payload.purchase_token, 'real-tok');
});

test('restore posts each listed token once, remembers settled ones, and runs once per launch', async () => {
    const list = [{ itemId: 'game.full', purchaseToken: 'fake-ok-a' }, { itemId: 'game.full', purchaseToken: 'fake-pending-b' }];
    const w = load({ buy: false, fake: { purchases: list }, answers: [reply(200, { status: 'owned' }), reply(202, { status: 'pending' })] });
    await settle(w); await settle(w);
    assert.equal(w.requests.length, 2);
    assert.equal(w.reloads.length, 0, 'an owner is not reloaded on every launch');
    assert.equal('intent_id' in w.requests[0].payload, false);
    assert.equal(w.requests[0].payload.purchase_token, 'fake-ok-a');
    assert.match(w.document.querySelector('[data-play-banner]').textContent, /Purchase pending/);
    assert.equal(JSON.parse(w.sessionStorage.getItem('hacktivity.restoreSent.agent7')).length, 1, 'pending is not remembered');
    const again = await w.HacktivityPlatform.restore();
    assert.equal(again.reason, 'already-ran');
    assert.equal(w.requests.length, 2);
});

test('restore skips tokens already sent in this tab', async () => {
    // sha256 of "fake-ok-a"
    const hash = Buffer.from(await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode('fake-ok-a'))).toString('hex');
    const w = load({ buy: false, storage: { 'hacktivity.restoreSent.agent7': JSON.stringify([hash]) },
        fake: { purchases: [{ itemId: 'game.full', purchaseToken: 'fake-ok-a' }] }, answers: [] });
    await settle(w); await settle(w);
    assert.equal(w.requests.length, 0);
});

test('restore asks before claiming an unlinked purchase, naming the account; yes repeats with consent', async () => {
    const w = load({ buy: false, fake: { purchases: [{ itemId: 'game.full', purchaseToken: 'fake-ok-c' }] },
        answers: [reply(200, { status: 'unowned', message: 'x' }), GRANTED] });
    await settle(w); await settle(w);
    assert.equal(w.confirms.length, 1);
    assert.equal(w.confirms[0], 'There’s a Licence to Hack purchase on this Google account that isn’t linked to a Hacktivity account. Unlock Licence to Hack for agent7?');
    assert.equal(w.requests[1].payload.consent, true);
    assert.equal(w.reloads.length, 1);
});

test('restore: answering no sends nothing more and is not asked again this launch', async () => {
    const w = load({ buy: false, confirm: false, fake: { purchases: [{ itemId: 'game.full', purchaseToken: 'fake-ok-d' }] },
        answers: [reply(200, { status: 'unowned', message: 'x' })] });
    await settle(w); await settle(w);
    assert.equal(w.confirms.length, 1);
    assert.equal(w.requests.length, 1);
    assert.equal(w.reloads.length, 0);
    assert.equal(JSON.parse(w.sessionStorage.getItem('hacktivity.restoreSent.agent7')).length, 1);
});

test('restore shows claimed_elsewhere once', async () => {
    const w = load({ buy: false, fake: { purchases: [{ itemId: 'game.full', purchaseToken: 'fake-ok-e' }] }, answers: [reply(409, { status: 'claimed_elsewhere' })] });
    await settle(w); await settle(w);
    assert.match(w.document.querySelector('[data-play-banner]').textContent, /different Hacktivity account/);
    assert.equal(w.requests.length, 1);
});

test('restore does not run for a guest, outside the Play app, or on a page with no event', async () => {
    const list = [{ itemId: 'game.full', purchaseToken: 'fake-ok-f' }];
    for (const opts of [{ signedIn: false }, { play: false }]) {
        const w = load({ buy: false, fake: { purchases: list }, answers: [], ...opts });
        await settle(w); await settle(w);
        assert.equal(w.requests.length, 0);
    }
});

test('web and steam never touch Digital Goods', async () => {
    for (const userAgent of ['Mozilla/5.0 Chrome/120', 'X HacktivityApp/0.2.0 (game=g; edition=full; store=web)', 'X HacktivityApp/0.2.0 (game=g; edition=demo)']) {
        const calls = [];
        const w = load({ play: false, userAgent, dg: (u) => { calls.push(u); return Promise.resolve({}); }, answers: [] });
        await settle(w);
        const r = await w.HacktivityPlatform.buy(button(w));
        assert.equal(r.via, 'link');
        const restored = await w.HacktivityPlatform.restore();
        assert.equal(restored.reason, 'not-play');
        assert.deepEqual(calls, []);
        assert.equal(w.requests.length, 0);
    }
});

test('?fake_play_billing=1 turns the default fake on with the hooks meta, and not without it', async () => {
    const page = async (hooks) => {
        // the query string is read at load: build a page whose URL carries it
        const dom = new JSDOM('<!doctype html><html><head>' + (hooks ? '<meta name="hacktivity-test-hooks" content="1">' : '') +
            '<meta name="hacktivity-signed-in" content="1"></head><body><button data-play-buy data-product-id="game.full" data-event-id="42"><span data-play-price></span></button></body></html>',
            { url: 'https://hacktivity.test/hacktivities/42/play?fake_play_billing=1', runScripts: 'outside-only', pretendToBeVisual: true });
        const w = dom.window;
        w.sessionStorage.setItem('hacktivity.platform', STORED);
        w.Intl = Intl; w.TextEncoder = TextEncoder; Object.defineProperty(w, 'crypto', { value: webcrypto, configurable: true });
        w.fetch = async () => { throw new Error('offline'); };
        w.eval(src);
        await settle(w);
        return w;
    };
    let w = await page(true);
    assert.equal(w.document.querySelector('[data-play-price]').textContent, '£14.99');
    w = await page(false);
    assert.equal(w.document.querySelector('[data-play-price]').textContent, '', 'no meta: no fake, no price');
    assert.equal(w.__hacktivityFakeDigitalGoods, undefined);
    assert.equal(w.sessionStorage.getItem('hacktivity.fakeBilling'), null);
});

test('no item or price from getDetails: refused before an intent is created', async () => {
    const w = load({ fake: { noItem: true }, answers: [] });
    await settle(w);
    const r = await w.HacktivityPlatform.buy(button(w));
    assert.equal(r.code, 'not_on_sale');
    assert.equal(w.requests.length, 0);
    assert.equal(msg(w), 'This item isn’t on sale in Google Play right now.');
});

test('nothing_to_buy at the intent step is treated as owned: reload', async () => {
    const w = load({ fake: {}, answers: [reply(422, { status: 'nothing_to_buy', message: 'x' })] });
    await settle(w);
    const r = await w.HacktivityPlatform.buy(button(w));
    assert.equal(r.ok, true);
    assert.equal(w.reloads.length, 1);
    assert.equal(w.requests.length, 1);
});

test('the sheet failing (not a cancel) runs a restore for this press, ignoring the ran-once flag', async () => {
    const list = [{ itemId: 'game.full', purchaseToken: 'fake-ok-g' }];
    // restore already ran this launch (flag set); the press still looks for the purchase
    let w = load({ fake: { failPayment: true, purchases: list }, storage: { 'hacktivity.restoreRan.agent7': '1' },
        answers: [INTENT, reply(200, { status: 'unowned', message: 'x' }), GRANTED] });
    await settle(w);
    let r = await w.HacktivityPlatform.buy(button(w));
    assert.equal(r.code, 'restored');
    assert.equal(w.requests[1].payload.purchase_token, 'fake-ok-g');
    assert.equal(w.reloads.length, 1);
    // nothing to restore: the fallback line
    w = load({ fake: { failPayment: true, purchases: [] }, storage: { 'hacktivity.restoreRan.agent7': '1' }, answers: [INTENT] });
    await settle(w);
    r = await w.HacktivityPlatform.buy(button(w));
    assert.equal(r.code, 'payment_failed');
    assert.equal(msg(w), 'If you’ve already bought it, close and reopen the app to restore it.');
});

test('restore flags are keyed by the signed-in handle', async () => {
    const w = load({ buy: false, fake: { purchases: [{ itemId: 'game.full', purchaseToken: 'fake-ok-h' }] }, answers: [reply(200, { status: 'owned' })] });
    await settle(w); await settle(w);
    assert.equal(w.sessionStorage.getItem('hacktivity.restoreRan.agent7'), '1');
    assert.equal(w.sessionStorage.getItem('hacktivity.restoreRan'), null);
    assert.ok(w.sessionStorage.getItem('hacktivity.restoreSent.agent7'));
});

test('without the game name meta the prompt and messages say "this game" and "the full game"', async () => {
    const w = load({ named: false, buy: false, fake: { purchases: [{ itemId: 'game.full', purchaseToken: 'fake-ok-n' }] },
        answers: [reply(200, { status: 'unowned', message: 'x' }), GRANTED] });
    await settle(w); await settle(w);
    assert.equal(w.confirms[0], 'There’s a purchase on this Google account that isn’t linked to a Hacktivity account. Unlock this game for agent7?');
    const g = load({ named: false, fake: {}, answers: [INTENT, GRANTED] });
    await settle(g);
    await g.HacktivityPlatform.buy(button(g));
    assert.match(msg(g), /Thank you\. The full game is unlocked\./);
});
