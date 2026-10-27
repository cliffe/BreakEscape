/**
 * Play purchase and restore. A classic script loaded right after client-platform.js; it adds
 * buy(el) and restore() to window.HacktivityPlatform (client-platform.js keeps stubs for them).
 *
 * Play app only (HacktivityPlatform.store === 'play'):
 *   - Prices: every [data-play-price] is filled from the store's own price (getDetails).
 *   - Buy: a press on [data-play-buy][data-product-id][data-event-id] creates an intent
 *     (POST /play_purchases/intents), opens the Payment Request sheet, then posts the token
 *     (POST /play_purchases) with the intent id. Never consumes the purchase.
 *   - Restore, once per launch (the tab): list the Google account's purchases and post each token
 *     this tab has not sent. An unlinked purchase (answer "unowned") asks the player first.
 *   web and steam never touch Digital Goods: their buy prompts are plain links the server rendered.
 *
 * Facts about Google's side that are NOT confirmed until the internal test track (P11); each is
 * marked "verify in P11":
 *   - Digital Goods API version: this code uses the v2.0 shape, getDigitalGoodsService(url) then
 *     service.getDetails([ids]) and service.listPurchases(). verify in P11
 *   - The Payment Request response carries the token as response.details.purchaseToken (the v2
 *     name; the older API used another). verify in P11
 *   - Whether the client must acknowledge. This code never acknowledges or consumes: the server
 *     acknowledges after it saves the row, and the 3-day sweep covers a late restore. verify in P11
 *   - Whether listPurchases() returns a pending purchase (it may list completed ones only). A
 *     pending purchase is tried again on the next launch either way. verify in P11
 *   - The price shape from getDetails: { currency, value } with value a string. verify in P11
 *
 * Test hook, only on pages with <meta name="hacktivity-test-hooks" content="1"> (Hacktivity renders
 * it in development and test, never in production): window.__hacktivityFakeDigitalGoods replaces
 * both APIs.
 *   { price: { currency: 'GBP', value: '14.99' },   // default
 *     purchases: [{ itemId, purchaseToken }],       // what listPurchases() returns
 *     nextToken: function (sku) {...},              // default 'fake-ok-<time>-<n>'
 *     rejectService: true,                          // getDigitalGoodsService rejects
 *     noItem: true,                                 // getDetails returns nothing (not on sale)
 *     failPayment: true,                            // the sheet fails (not a cancel)
 *     cancelPayment: true }                         // the player closes the sheet
 * or ?fake_play_billing=1 (remembered for the tab) for the defaults.
 *
 * Page contract: metas csrf-token, hacktivity-signed-in, hacktivity-signed-in-as (the handle shown in
 * the restore prompt), hacktivity-test-hooks.
 */
(function (win) {
    'use strict';
    if (!win || !win.document || !win.HacktivityPlatform) return;

    var P = win.HacktivityPlatform;
    var doc = win.document;
    var BILLING_URL = 'https://play.google.com/billing';
    var DG_TIMEOUT_MS = 3000;
    var PLAY_PURCHASES_URL = '/play_purchases';
    var SENT_KEY = 'hacktivity.restoreSent';
    var RESTORE_RAN_KEY = 'hacktivity.restoreRan';
    var FAKE_KEY = 'hacktivity.fakeBilling';
    var fakeCounter = 0;

    var TEXT = {
        signedOut: 'Sign in to buy.',
        sessionEnded: 'You have been signed out. Sign in again to continue.',
        unavailable: 'Purchases aren’t available in this version of the app or on this device.',
        notOnSale: 'This item isn’t on sale in Google Play right now.',
        tryRestore: 'If you’ve already bought it, close and reopen the app to restore it.',
        reload: 'Reload the page and try again.',
        network: 'We couldn’t reach Hacktivity. Check your connection and try again.',
        generic: 'Something went wrong. Please try again.',
        cancelled: 'Purchase cancelled.',
        granted: 'Thank you. The full game is unlocked.',
        owned: 'You already own the full game on this account.',
        pending: 'Purchase pending: it unlocks when Google confirms it.',
        alreadyOwned: 'You already own the full game; this extra purchase will be refunded automatically.',
        claimedElsewhere: 'This purchase is linked to a different Hacktivity account. Contact support to move it.',
        needsSupport: 'We couldn’t link this purchase to this account. Contact Hacktivity support (the Contact page) and tell us roughly when you bought it.'
    };

    function meta(name) {
        try {
            var el = doc.querySelector('meta[name="' + name + '"]');
            return el ? (el.getAttribute('content') || '') : '';
        } catch (e) { return ''; }
    }

    // The game's title (meta hacktivity-app-event-name), or '' when the page has none.
    function gameName() { return meta('hacktivity-app-event-name'); }

    // sessionStorage keys carry the signed-in handle, so a second account in the same tab starts clean
    function keyFor(base) { return base + '.' + (meta('hacktivity-signed-in-as') || ''); }

    function signedIn() { return meta('hacktivity-signed-in') === '1'; }

    function testHooksOn() { return meta('hacktivity-test-hooks') === '1'; }

    function fakeDigitalGoods() {
        if (!testHooksOn()) return null;
        var f = win.__hacktivityFakeDigitalGoods;
        if (!f) {
            var wanted = false;
            try {
                wanted = new win.URL(win.location.href).searchParams.get('fake_play_billing') === '1';
                if (wanted) win.sessionStorage.setItem(FAKE_KEY, '1');
                else wanted = win.sessionStorage.getItem(FAKE_KEY) === '1';
            } catch (e) { /* no storage: the query string alone */ }
            if (!wanted) return null;
            f = win.__hacktivityFakeDigitalGoods = {};
        }
        return f;
    }

    var servicePromise = null;
    function digitalGoods() {
        if (servicePromise) return servicePromise;
        servicePromise = new Promise(function (resolve, reject) {
            var fake = fakeDigitalGoods();
            if (fake) {
                if (fake.rejectService) return reject(new Error('fake: service unavailable'));
                var price = fake.price || { currency: 'GBP', value: '14.99' };
                return resolve({
                    fake: fake,
                    getDetails: function (ids) {
                        return Promise.resolve(fake.noItem ? [] : ids.map(function (id) { return { itemId: id, title: id, price: price }; }));
                    },
                    listPurchases: function () { return Promise.resolve((fake.purchases || []).slice()); }
                });
            }
            if (typeof win.getDigitalGoodsService !== 'function') return reject(new Error('no digital goods'));
            var timer = win.setTimeout(function () { reject(new Error('digital goods timed out')); }, DG_TIMEOUT_MS);
            Promise.resolve(win.getDigitalGoodsService(BILLING_URL)).then(
                function (svc) { win.clearTimeout(timer); if (svc) resolve(svc); else reject(new Error('no service')); },
                function (err) { win.clearTimeout(timer); reject(err); }
            );
        });
        servicePromise.catch(function () { servicePromise = null; }); // a later press may try again
        return servicePromise;
    }

    function formatPrice(price) {
        if (!price) return '';
        var value = Number(price.value);
        if (!isFinite(value)) return '';
        try {
            return new win.Intl.NumberFormat((win.navigator && win.navigator.language) || 'en-GB',
                { style: 'currency', currency: String(price.currency) }).format(value);
        } catch (e) { return String(price.currency || '') + ' ' + price.value; }
    }

    // Fill every [data-play-price] from the store's own price. A failure leaves the slot empty.
    function fillPrices() {
        var buttons = doc.querySelectorAll('[data-play-buy][data-product-id]');
        if (!buttons.length) return Promise.resolve();
        var ids = [];
        for (var i = 0; i < buttons.length; i++) {
            var id = buttons[i].getAttribute('data-product-id');
            if (id && ids.indexOf(id) < 0) ids.push(id);
        }
        return digitalGoods().then(function (svc) { return svc.getDetails(ids); }).then(function (details) {
            var byId = {};
            (details || []).forEach(function (d) { if (d && d.itemId) byId[d.itemId] = formatPrice(d.price); });
            for (var j = 0; j < buttons.length; j++) {
                var slot = buttons[j].querySelector('[data-play-price]');
                var text = byId[buttons[j].getAttribute('data-product-id')];
                if (slot && text) slot.textContent = text;
            }
        }).catch(function () { /* no price: the button still works and says why on a press */ });
    }

    // POST JSON. Resolves { status, body } for any HTTP answer; { status: 0 } when the network failed.
    function postJson(url, payload) {
        return win.fetch(url, {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': meta('csrf-token') },
            body: JSON.stringify(payload)
        }).then(function (res) {
            return res.text().then(function (txt) {
                var body = {};
                try { body = JSON.parse(txt) || {}; } catch (e) { body = {}; }
                return { status: res.status, body: body };
            });
        }, function () { return { status: 0, body: {} }; });
    }

    // Where a message goes: next to the control that asked, else a banner at the top of the page.
    function showMessage(text, near) {
        try {
            var el = null;
            if (near && near.parentNode) {
                el = near.parentNode.querySelector('[data-play-message]');
                if (!el) {
                    el = doc.createElement('span');
                    el.setAttribute('data-play-message', '');
                    el.setAttribute('role', 'status');
                    near.parentNode.insertBefore(el, near.nextSibling);
                }
            } else {
                el = doc.querySelector('[data-play-banner]');
                if (!el && doc.body) {
                    el = doc.createElement('div');
                    el.setAttribute('data-play-banner', '');
                    el.setAttribute('role', 'status');
                    el.setAttribute('style', 'position:fixed;left:0;right:0;top:0;z-index:2147483000;padding:10px 14px;background:#050608;color:#e8e8ee;border-bottom:2px solid #8cf;font:16px sans-serif');
                    doc.body.insertBefore(el, doc.body.firstChild);
                }
            }
            if (el) el.textContent = text;
        } catch (e) { /* the result still returns to the caller */ }
        return text;
    }

    function askConsent() {
        var handle = meta('hacktivity-signed-in-as');
        var name = gameName() || 'this game';
        var text = 'There’s a ' + (gameName() ? name + ' ' : '') + 'purchase on this Google account that isn’t linked to a Hacktivity account. Unlock ' +
            name + ' for ' + (handle || 'this account') + '?';
        try { return !!win.confirm(text); } catch (e) { return false; }
    }

    // Test hook for the reload, same pattern as client-platform.js: with the hooks meta and an array
    // in win.__hacktivityReload the reload is recorded, and skipped when __hacktivityStubNavigation is set.
    function reloadPage() {
        if (testHooksOn() && Array.isArray(win.__hacktivityReload)) {
            win.__hacktivityReload.push({ at: Date.now() });
            if (win.__hacktivityStubNavigation) return;
        }
        try { win.location.reload(); } catch (e) { /* ignore */ }
    }

    // Turn a server answer into { ok, code, message, reload, retryAsRestore, ask }.
    function named(text) {
        var n = gameName();
        return n ? text.replace(/the full game/i, n) : text;
    }

    function readAnswer(r) {
        var code = (r.body && r.body.status) || '';
        var msg = (r.body && r.body.message) || '';
        if (r.status === 0) return { ok: false, code: 'network', message: TEXT.network };
        // the server runs the CSRF check and the sign-in check in an order that can change: handle
        // a 401 signed_out and a 422 csrf at every step
        if (r.status === 401 || code === 'signed_out') return { ok: false, code: 'signed_out', message: TEXT.sessionEnded };
        if (code === 'csrf') return { ok: false, code: 'csrf', message: TEXT.reload };
        if (code === 'granted') return { ok: true, code: code, message: named(TEXT.granted), reload: true };
        if (code === 'owned') return { ok: true, code: code, message: named(TEXT.owned), reload: true };
        if (code === 'pending') return { ok: true, code: code, message: TEXT.pending };
        if (code === 'already_owned') return { ok: true, code: code, message: named(TEXT.alreadyOwned) };
        if (code === 'claimed_elsewhere') return { ok: false, code: code, message: TEXT.claimedElsewhere };
        if (code === 'needs_support') return { ok: false, code: code, message: TEXT.needsSupport };
        if (code === 'unowned') return { ok: false, code: code, message: msg, ask: true };
        if (code === 'intent_invalid') return { ok: false, code: code, message: msg, retryAsRestore: true };
        return { ok: false, code: code || ('http-' + r.status), message: msg || TEXT.generic };
    }

    function claim(eventId, productId, token, extra) {
        var payload = { event_id: eventId, product_id: productId, purchase_token: token, client: 'play-app' };
        for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) payload[k] = extra[k];
        return postJson(PLAY_PURCHASES_URL, payload).then(readAnswer);
    }

    // Post a token and follow the answer: an expired intent becomes a restore (no intent id); an
    // unlinked purchase asks the player before it is claimed. Resolves the final answer.
    function claimAndFollow(eventId, productId, token, intentId) {
        var first = intentId ? { intent_id: intentId } : {};
        return claim(eventId, productId, token, first).then(function (a) {
            if (a.retryAsRestore) return claim(eventId, productId, token, {});
            return a;
        }).then(function (a) {
            if (!a.ask) return a;
            if (!askConsent()) return { ok: false, code: 'declined', message: '', declined: true };
            return claim(eventId, productId, token, { consent: true });
        });
    }

    function sheetToken(svc, productId, price) {
        var fake = svc.fake;
        if (fake) {
            if (fake.failPayment) return Promise.reject(new Error('fake: the sheet failed'));
            if (fake.cancelPayment) { var e = new Error('fake: cancelled'); e.name = 'AbortError'; return Promise.reject(e); }
            var tok = fake.nextToken ? fake.nextToken(productId) : 'fake-ok-' + Date.now().toString(36) + '-' + (++fakeCounter);
            return Promise.resolve(tok);
        }
        var info = price || {};
        var request = new win.PaymentRequest(
            [{ supportedMethods: BILLING_URL, data: { sku: productId } }],
            // total is still required by the Payment Request API; the price here is the store's own
            { total: { label: 'Total', amount: { currency: info.currency || 'GBP', value: info.value || '0' } } }
        );
        return request.show().then(function (response) {
            var token = response && response.details && response.details.purchaseToken; // verify in P11
            // complete() closes the sheet. Never consume: the purchase stays a permanent unlock.
            return Promise.resolve(response.complete('success')).catch(function () {}).then(function () {
                if (!token) throw new Error('no purchase token');
                return token;
            });
        });
    }

    function buy(el) {
        try {
            if (P.store !== 'play') return Promise.resolve({ ok: true, via: 'link' }); // web and steam follow their link
            var near = el && el.getAttribute ? el : null;
            var say = function (code, text, ok) { showMessage(text, near); return { ok: !!ok, code: code, message: text }; };
            if (!signedIn()) return Promise.resolve(say('signed_out', TEXT.signedOut));
            var productId = near && near.getAttribute('data-product-id');
            var eventId = (near && near.getAttribute('data-event-id')) || P.eventId;
            if (!productId || !eventId) return Promise.resolve(say('no_product', TEXT.unavailable));
            if (near) { near.disabled = true; near.setAttribute('aria-busy', 'true'); }
            var done = function (r) { if (near) { near.disabled = false; near.removeAttribute('aria-busy'); } return r; };

            return digitalGoods().then(function (svc) {
                // no item or price from the store: refuse before creating an intent
                return svc.getDetails([productId]).then(function (d) {
                    var item = d && d[0];
                    if (!item || !item.price) return { answer: { ok: false, code: 'not_on_sale', message: TEXT.notOnSale } };
                    return postJson(PLAY_PURCHASES_URL + '/intents', { event_id: eventId }).then(function (res) {
                        var code = (res.body && res.body.status) || '';
                        if (code === 'intent' && res.body.intent_id) return { svc: svc, intentId: res.body.intent_id, price: item.price };
                        // nothing_to_buy: the account already has the game, so treat it as owned
                        if (code === 'nothing_to_buy') return { answer: { ok: true, code: code, message: named(TEXT.owned), reload: true } };
                        return { answer: readAnswer(res) };
                    });
                }, function () {
                    return { answer: { ok: false, code: 'unavailable', message: TEXT.unavailable } };
                });
            }, function () {
                return { answer: { ok: false, code: 'unavailable', message: TEXT.unavailable } };
            }).then(function (step) {
                if (step.answer) {
                    var out = say(step.answer.code, step.answer.message, step.answer.ok);
                    if (step.answer.reload) reloadPage();
                    return out;
                }
                var svc = step.svc;
                return Promise.resolve().then(function () { return sheetToken(svc, productId, step.price); })
                    .then(function (token) {
                        return claimAndFollow(eventId, productId, token, step.intentId).then(function (a) {
                            if (a.declined) return say('declined', '');
                            var out = say(a.code, a.message, a.ok);
                            if (a.reload) reloadPage();
                            return out;
                        });
                    }, function (err) {
                        if (err && err.name === 'AbortError') return say('cancelled', TEXT.cancelled);
                        // the sheet failed for another reason (for example this Google account already owns
                        // the item): look for the purchase and restore it, ignoring the once-per-launch flag
                        return restoreNow(eventId).then(function (r) {
                            var got = r && r.results && r.results.some(function (x) { return x.code === 'granted' || x.code === 'owned'; });
                            if (got) return say('restored', named(TEXT.granted), true);
                            return say('payment_failed', TEXT.tryRestore);
                        });
                    });
            }).then(done, function () { return done(say('error', TEXT.generic)); });
        } catch (e) {
            return Promise.resolve({ ok: false, code: 'error', message: TEXT.generic });
        }
    }

    function sha256Hex(text) {
        try {
            var bytes = new win.TextEncoder().encode(text);
            return win.crypto.subtle.digest('SHA-256', bytes).then(function (buf) {
                var out = '', view = new Uint8Array(buf);
                for (var i = 0; i < view.length; i++) out += ('0' + view[i].toString(16)).slice(-2);
                return out;
            });
        } catch (e) { return Promise.reject(e); }
    }

    function readSent() {
        try { var l = JSON.parse(win.sessionStorage.getItem(keyFor(SENT_KEY)) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; }
    }
    function writeSent(list) {
        try { win.sessionStorage.setItem(keyFor(SENT_KEY), JSON.stringify(list.slice(-50))); } catch (e) { /* ignore */ }
    }

    // Once per launch (the tab), for a signed-in Play app player on a game page: list the account's
    // purchases and post each token this tab has not sent. A token is only remembered when the
    // answer is final; pending and errors are tried again on the next launch.
    function restore() { return restoreRun(false, null); }

    // A forced restore (after a failed sheet) skips the once-per-launch flag.
    function restoreNow(eventId) { return restoreRun(true, eventId); }

    function restoreRun(force, forcedEvent) {
        try {
            if (P.store !== 'play') return Promise.resolve({ ok: false, reason: 'not-play' });
            if (!signedIn()) return Promise.resolve({ ok: false, reason: 'signed-out' });
            var eventId = forcedEvent || P.eventId;
            if (!eventId) return Promise.resolve({ ok: false, reason: 'no-event' });
            try {
                if (!force && win.sessionStorage.getItem(keyFor(RESTORE_RAN_KEY)) === '1') return Promise.resolve({ ok: true, reason: 'already-ran' });
                win.sessionStorage.setItem(keyFor(RESTORE_RAN_KEY), '1');
            } catch (e) { return Promise.resolve({ ok: false, reason: 'no-storage' }); } // cannot count: do not loop
            var results = [];
            return digitalGoods().then(function (svc) { return svc.listPurchases(); }).then(function (list) {
                var sent = readSent(), chain = Promise.resolve(), reload = false;
                (list || []).forEach(function (p) {
                    if (!p || !p.purchaseToken || !p.itemId) return;
                    chain = chain.then(function () {
                        return sha256Hex(String(p.purchaseToken)).then(function (hash) {
                            if (sent.indexOf(hash) >= 0) return null;
                            return claimAndFollow(eventId, p.itemId, p.purchaseToken, null).then(function (a) {
                                var settled = (a.ok && a.code !== 'pending') || a.code === 'claimed_elsewhere' || a.code === 'needs_support' || a.declined;
                                if (settled) { sent.push(hash); writeSent(sent); }
                                results.push({ code: a.code });
                                if (a.code === 'claimed_elsewhere' || a.code === 'needs_support' || a.code === 'pending') showMessage(a.message, null);
                                // only a new grant reloads; an owner who already has the game is not reloaded every launch
                                if (a.code === 'granted') reload = true;
                            });
                        });
                    });
                });
                return chain.then(function () { if (reload) reloadPage(); return { ok: true, results: results }; });
            }).catch(function () { return { ok: false, reason: 'unavailable' }; });
        } catch (e) {
            return Promise.resolve({ ok: false, reason: 'error' });
        }
    }

    function onBuyClick(ev) {
        try {
            if (P.store !== 'play' || ev.defaultPrevented) return;
            var el = ev.target && ev.target.closest ? ev.target.closest('[data-play-buy]') : null;
            if (!el) return;
            ev.preventDefault();
            P.buy(el);
        } catch (e) { /* leave the click alone */ }
    }

    P.buy = buy;
    P.restore = restore;
    doc.addEventListener('click', onBuyClick, true);

    // The platform is settled once P.ready resolves (a Digital Goods check can decide it late).
    Promise.resolve(P.ready).then(function () {
        if (P.store !== 'play') return null;
        var go = function () { return fillPrices().then(function () { return P.restore(); }); };
        if (doc.readyState === 'loading') { doc.addEventListener('DOMContentLoaded', go); return null; }
        return go();
    });
})(typeof window !== 'undefined' ? window : undefined);
