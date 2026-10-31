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
 *     this tab has not sent. An unlinked purchase (answer "unowned") asks the player first, in an
 *     in-page dialog (focus trapped, Escape cancels). A "no" is remembered for that account and
 *     purchase (localStorage, keyed by an opaque per-user value from the server, never the handle), so the launch restore does not ask
 *     again; a buy, or an explicit restore (P.restoreNow(), or a press on [data-play-restore]),
 *     ignores the memory. An account that already has the game (any source) is told so once.
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
 * the restore prompt), hacktivity-user-key (opaque, keys the localStorage memory), hacktivity-test-hooks.
 * Only Hacktivity's own pages load this script today; engine pages do not.
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
    var DECLINED_KEY = 'hacktivity.restoreDeclined';     // localStorage: hashes of tokens the player said no to
    var OWNED_SHOWN_KEY = 'hacktivity.restoreOwnedShown'; // localStorage: hashes already told "you own it"
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
        restoreOwned: 'You already own the full game on this account, so there’s nothing to restore.',
        restoreNone: 'We didn’t find a purchase on this Google account to restore.',
        restoreDone: 'Purchases checked.',
        consentTitle: 'Unlock your purchase?',
        consentYes: 'Unlock',
        consentNo: 'Not now',
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

    // The consent question as an in-page dialog. Resolves true (Unlock), false (Not now, Escape) or
    // null (it could not be shown: no page body; that is not a "no" and is never remembered).
    // One question at a time, one per purchase: a second purchase waits its turn and gets its own
    // answer, and a repeat question for the same token shares the first one's answer.
    // Modal: Tab stays inside, every other key is swallowed at the window, focus returns to where it
    // was. First focus is on "Not now", repeats are ignored and the buttons ignore the first 300 ms,
    // because the dialog appears on its own at launch and a key the player is already pressing must
    // not consent. Inline styles only, with the game shell's pixel font (GNF) first, so it needs no
    // stylesheet; it scrolls inside itself on a short phone landscape.
    var consentChain = Promise.resolve();
    var consentByToken = {};
    var ACTIVATE_AFTER_MS = 300;
    function askConsent(token) {
        var key = String(token || '');
        if (consentByToken[key]) return consentByToken[key];
        var p = consentChain.then(showConsent);
        consentChain = p.then(function () {}, function () {});
        consentByToken[key] = p;
        var forget = function () { if (consentByToken[key] === p) delete consentByToken[key]; };
        p.then(forget, forget);
        return p;
    }

    function showConsent() {
        var handle = meta('hacktivity-signed-in-as');
        var name = gameName() || 'this game';
        var text = 'There’s a purchase ' + (gameName() ? 'of ' + name + ' ' : '') + 'on this Google account that isn’t linked to a Hacktivity account. Unlock ' +
            name + ' for ' + (handle || 'this account') + '?';
        if (!doc.body) return Promise.resolve(null);
        return new Promise(function (resolve) {
            var before = doc.activeElement;
            var openedAt = Date.now();
            var uid = 'play-consent-' + openedAt.toString(36);
            var font = "'GNF','Courier New',system-ui,sans-serif";
            var overlay = doc.createElement('div');
            overlay.setAttribute('data-play-consent', '');
            overlay.setAttribute('style', 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;' +
                'box-sizing:border-box;padding:12px;background:rgba(0,0,0,0.72);overflow:auto');
            var box = doc.createElement('div');
            box.setAttribute('role', 'dialog');
            box.setAttribute('aria-modal', 'true');
            box.setAttribute('aria-labelledby', uid + '-t');
            box.setAttribute('aria-describedby', uid + '-d');
            box.setAttribute('style', 'box-sizing:border-box;width:100%;max-width:440px;max-height:100%;overflow:auto;margin:auto;padding:16px 18px;' +
                'background:#0b0d12;color:#e8e8ee;border:2px solid #8cf;border-radius:4px;box-shadow:0 8px 32px rgba(0,0,0,0.6);' +
                'font:20.5px/1.3 ' + font + ';text-align:left');
            var title = doc.createElement('h2');
            title.id = uid + '-t';
            title.textContent = TEXT.consentTitle;
            title.setAttribute('style', 'margin:0 0 8px;font:20.5px/1.3 ' + font + ';color:#fff;text-transform:uppercase;letter-spacing:0.04em');
            var body = doc.createElement('p');
            body.id = uid + '-d';
            body.textContent = text;
            body.setAttribute('style', 'margin:0 0 14px');
            var row = doc.createElement('div');
            row.setAttribute('style', 'display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end');
            var btnStyle = 'min-height:44px;min-width:96px;padding:6px 16px;font:20.5px/1 ' + font + ';border-radius:4px;cursor:pointer;';
            var no = doc.createElement('button');
            no.type = 'button';
            no.setAttribute('data-play-consent-no', '');
            no.textContent = TEXT.consentNo;
            no.setAttribute('style', btnStyle + 'background:transparent;color:#e8e8ee;border:2px solid #8a8fa0');
            var yes = doc.createElement('button');
            yes.type = 'button';
            yes.setAttribute('data-play-consent-yes', '');
            yes.textContent = TEXT.consentYes;
            yes.setAttribute('style', btnStyle + 'background:#8cf;color:#050608;border:2px solid #8cf');
            row.appendChild(no); row.appendChild(yes);
            box.appendChild(title); box.appendChild(body); box.appendChild(row);
            overlay.appendChild(box);

            var finished = false;
            function finish(answer) {
                if (finished) return;
                finished = true;
                ['keydown', 'keyup', 'keypress'].forEach(function (t) { win.removeEventListener(t, onKey, true); });
                doc.removeEventListener('focusin', onFocusIn, true);
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                try { if (before && before.focus && doc.contains(before)) before.focus(); } catch (e) { /* ignore */ }
                resolve(answer);
            }
            // Window capture, first in line: nothing but this dialog sees a key while it is open.
            function onKey(ev) {
                ev.stopImmediatePropagation();
                if (ev.type !== 'keydown') return;
                if (ev.repeat) { ev.preventDefault(); return; } // a held key must not activate a button
                if (ev.key === 'Escape' || ev.key === 'Esc') {
                    ev.preventDefault(); finish(false);
                } else if (ev.key === 'Tab') {
                    var active = doc.activeElement;
                    if (!box.contains(active)) { ev.preventDefault(); (ev.shiftKey ? yes : no).focus(); }
                    else if (ev.shiftKey && active === no) { ev.preventDefault(); yes.focus(); }
                    else if (!ev.shiftKey && active === yes) { ev.preventDefault(); no.focus(); }
                }
            }
            function onFocusIn(ev) { if (!box.contains(ev.target)) no.focus(); }
            function answer(value) { return function (ev) {
                if (Date.now() - openedAt < ACTIVATE_AFTER_MS) { if (ev && ev.preventDefault) ev.preventDefault(); return; }
                finish(value);
            }; }
            // a press on the backdrop keeps focus in the dialog instead of dropping it to the page
            overlay.addEventListener('mousedown', function (ev) { if (!box.contains(ev.target)) { ev.preventDefault(); no.focus(); } });
            no.addEventListener('click', answer(false));
            yes.addEventListener('click', answer(true));
            ['keydown', 'keyup', 'keypress'].forEach(function (t) { win.addEventListener(t, onKey, true); });
            doc.addEventListener('focusin', onFocusIn, true);
            doc.body.appendChild(overlay);
            no.focus();
        });
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
            return askConsent(token).then(function (yes) {
                if (yes === null) return { ok: false, code: 'not_asked', message: '', notAsked: true }; // could not ask: not a no
                if (!yes) return rememberDeclined(token).then(function () { return { ok: false, code: 'declined', message: '', declined: true }; });
                return forgetDeclined(token).then(function () { return claim(eventId, productId, token, { consent: true }); });
            });
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
    // Per-account memory in localStorage (the server has no per-user spot for this without a migration).
    // Lists of token hashes; every access is guarded.
    // The key is the server's opaque per-user value (meta hacktivity-user-key), never the handle; a page
    // without it remembers nothing. A signed-out page clears both lists (see the end of the file).
    function lsKey(base) { var k = meta('hacktivity-user-key'); return k ? base + '.' + k : null; }
    function lsRead(base) {
        if (!lsKey(base)) return [];
        try { var v = JSON.parse(win.localStorage.getItem(lsKey(base)) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
    }
    function lsWrite(base, list) {
        if (!lsKey(base)) return;
        try { win.localStorage.setItem(lsKey(base), JSON.stringify(list.slice(-50))); } catch (e) { /* not remembered */ }
    }
    function rememberDeclined(token) {
        return sha256Hex(String(token)).then(function (h) {
            var l = lsRead(DECLINED_KEY);
            if (l.indexOf(h) < 0) { l.push(h); lsWrite(DECLINED_KEY, l); }
        }, function () {});
    }
    function forgetDeclined(token) {
        return sha256Hex(String(token)).then(function (h) {
            var l = lsRead(DECLINED_KEY), at = l.indexOf(h);
            if (at >= 0) { l.splice(at, 1); lsWrite(DECLINED_KEY, l); }
        }, function () {});
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

    // The player asked for it (a "Restore purchases" control): ignores the once-per-launch flag and
    // any remembered "not now", and always says what it found.
    function restoreExplicit(near) { return restoreRun(true, null, near || true); }

    function restoreRun(force, forcedEvent, explicit) {
        try {
            if (P.store !== 'play') return Promise.resolve({ ok: false, reason: 'not-play' });
            if (!signedIn()) return Promise.resolve({ ok: false, reason: 'signed-out' });
            var eventId = forcedEvent || P.eventId;
            if (!eventId) return Promise.resolve({ ok: false, reason: 'no-event' });
            try {
                if (!force && win.sessionStorage.getItem(keyFor(RESTORE_RAN_KEY)) === '1') return Promise.resolve({ ok: true, reason: 'already-ran' });
                win.sessionStorage.setItem(keyFor(RESTORE_RAN_KEY), '1');
            } catch (e) { return Promise.resolve({ ok: false, reason: 'no-storage' }); } // cannot count: do not loop
            var results = [], told = false;
            var say = function (text) { if (explicit && explicit !== true) showMessage(text, explicit); else showMessage(text, null); };
            return digitalGoods().then(function (svc) { return svc.listPurchases(); }).then(function (list) {
                var sent = readSent(), chain = Promise.resolve(), reload = false;
                var declined = lsRead(DECLINED_KEY), shown = lsRead(OWNED_SHOWN_KEY);
                (list || []).forEach(function (p) {
                    if (!p || !p.purchaseToken || !p.itemId) return;
                    chain = chain.then(function () {
                        return sha256Hex(String(p.purchaseToken)).then(function (hash) {
                            if (!explicit && sent.indexOf(hash) >= 0) return null;
                            // a "not now" is remembered for this account; only the player asking again (or a buy) overrides
                            if (!force && declined.indexOf(hash) >= 0) { results.push({ code: 'declined-before' }); return null; }
                            return claimAndFollow(eventId, p.itemId, p.purchaseToken, null).then(function (a) {
                                var settled = (a.ok && a.code !== 'pending') || a.code === 'claimed_elsewhere' || a.code === 'needs_support' || a.declined;
                                if (settled) { sent.push(hash); writeSent(sent); }
                                results.push({ code: a.code });
                                if (a.code === 'claimed_elsewhere' || a.code === 'needs_support' || a.code === 'pending') { say(a.message); told = true; }
                                // the account already has the game (any source): say so, once per purchase on a launch restore
                                if (a.code === 'already_owned' || (explicit && a.code === 'owned')) {
                                    if (explicit || shown.indexOf(hash) < 0) { say(named(TEXT.restoreOwned)); told = true; }
                                    if (shown.indexOf(hash) < 0) { shown.push(hash); lsWrite(OWNED_SHOWN_KEY, shown); }
                                }
                                // only a new grant reloads; an owner who already has the game is not reloaded every launch
                                if (a.code === 'granted') reload = true;
                            });
                        });
                    });
                });
                return chain.then(function () {
                    if (explicit && !told && !reload) say(list && list.length ? TEXT.restoreDone : TEXT.restoreNone);
                    if (reload) reloadPage();
                    return { ok: true, results: results };
                });
            }).catch(function () {
                if (explicit) say(TEXT.unavailable);
                return { ok: false, reason: 'unavailable' };
            });
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

    // a "Restore purchases" control: any element with data-play-restore
    function onRestoreClick(ev) {
        try {
            if (P.store !== 'play' || ev.defaultPrevented) return;
            var el = ev.target && ev.target.closest ? ev.target.closest('[data-play-restore]') : null;
            if (!el) return;
            ev.preventDefault();
            restoreExplicit(el);
        } catch (e) { /* leave the click alone */ }
    }

    // Signed out: forget what this device remembered for any account (shared-device privacy).
    function clearMemory() {
        try {
            for (var i = win.localStorage.length - 1; i >= 0; i--) {
                var k = win.localStorage.key(i);
                if (k && (k.indexOf(DECLINED_KEY + '.') === 0 || k.indexOf(OWNED_SHOWN_KEY + '.') === 0)) win.localStorage.removeItem(k);
            }
        } catch (e) { /* ignore */ }
    }
    if (!signedIn()) clearMemory();

    if (testHooksOn()) P._askConsent = askConsent; // for the tests only
    P.buy = buy;
    P.restore = restore;
    P.restoreNow = function (near) { return restoreExplicit(near); };
    doc.addEventListener('click', onRestoreClick, true);
    doc.addEventListener('click', onBuyClick, true);

    // The platform is settled once P.ready resolves (a Digital Goods check can decide it late).
    Promise.resolve(P.ready).then(function () {
        if (P.store !== 'play') return null;
        var go = function () { return fillPrices().then(function () { return P.restore(); }); };
        if (doc.readyState === 'loading') { doc.addEventListener('DOMContentLoaded', go); return null; }
        return go();
    });
})(typeof window !== 'undefined' ? window : undefined);
