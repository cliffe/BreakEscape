/**
 * Client platform module. A classic script, loaded in <head> before first paint.
 *
 * Works out two separate things, once per tab:
 *   appWindow  browser | desktop-app | play-app   (is the page in a single-window app?)
 *   store      web | steam | play                 (which store sells the game here?)
 * and publishes them as html[data-app-window] and html[data-store], plus window.HacktivityPlatform.
 *
 * Sources, in order:
 *   1. The desktop app's user agent token
 *        " HacktivityApp/<version> (game=<key>; edition=<full|demo>[; store=<web|steam>])"
 *      with no store field meaning steam, so every built desktop app keeps working.
 *   2. The value stored for this tab in sessionStorage['hacktivity.platform'].
 *   3. The Play app's start URL marker, ?source=play, accepted only when the page is shown as an
 *      installed app (display-mode fullscreen, standalone or minimal-ui) and
 *        - document.referrer starts with android-app://<package>/ for a package listed in
 *          <meta name="hacktivity-play-packages" content="<package>=<game key>,...">, or
 *        - getDigitalGoodsService('https://play.google.com/billing') resolves.
 *      A marker that fails both checks is ignored, so a shared link cannot put a desktop
 *      browser into the app layout. The marker (and the v= beside it) is always removed from
 *      the address bar.
 *      (the version code in v= is kept; a link start has none, so it uses the window.open fallback)
 *   4. No marker, but document.referrer is android-app://<listed package>/ and the page is shown
 *      as an installed app (display-mode fullscreen, standalone or minimal-ui). That is a cold
 *      start from a link (email, chat): the app's VIEW filter claims /app/<game>, so Android opens
 *      the app on it without the marker. The display-mode check keeps a page that a browser opens
 *      with an android-app referrer from becoming the app layout.
 * Any storage error means browser/web. Never throws.
 *
 * Play app only (appWindow 'play-app'):
 *   - Links: one capture-phase click handler sends a link to openOutside() when it has data-outside,
 *     goes to another origin, or goes to a same-origin path outside the in-app paths (the
 *     hacktivity-app-paths meta, kept in the stored value). rails-ujs links (data-method,
 *     data-remote), downloads, #anchors, non-http links and forms are left alone.
 *   - openOutside(url) hands the link to the app's native OpenOutsideActivity with
 *     location.href = "hacktivity-outside://open?url=<url>" (hacktivity-android/native). It does
 *     that only when the app's version code (v=, kept beside the marker) is new enough to have the
 *     activity; older apps get window.open. Payment paths (pricing, plans, subscriptions,
 *     checkout) are never sent anywhere: every buy prompt in the Play app is Google Play's own.
 *     In-app paths (the VM console, which carries a token) are never sent out either.
 *   - Landing guard: a page outside the in-app paths replaces itself with homeUrl(), at most twice
 *     a minute per tab. Sign-out lands on "/", so this returns the player to the game (the in-app
 *     sign-in page, not the title). A payment page (pricing, plans, subscriptions, checkout) always
 *     goes home, with its own larger budget; past that it is blanked with "Not available in the app".
 *   - Path tests read the path as a server would: %XX letters decoded, ";params" dropped.
 *   - Hosts the native hand-off refuses (the hacktivity-outside-hosts meta, kept in the stored value)
 *     are left to the app's own view with a URL bar, not sent to a dead tap.
 *   - The sign-in form's Remember me box is ticked, so the player stays signed in.
 *
 * Page contract (see planning_notes/steam_release/ANDROID_PLAN.md section 1):
 *   metas hacktivity-play-packages, hacktivity-app-event, hacktivity-app-paths (all optional)
 *   window.HacktivityPlatform: appWindow, store, gameKey, eventId, isAppWindow, ready,
 *     homeUrl(), openOutside(url), buy(el), restore()
 */
(function (win) {
    'use strict';
    if (!win || !win.document) return;

    var STORAGE_KEY = 'hacktivity.platform';
    var GUARD_KEY = 'hacktivity.landingGuard';
    var BILLING_URL = 'https://play.google.com/billing';
    var DG_TIMEOUT_MS = 3000;
    var OUTSIDE_URL = 'hacktivity-outside://open?url=';
    var OUTSIDE_MIN_VERSION = 2; // first app version code with native/OpenOutsideActivity
    var GUARD_WINDOW_MS = 60000;
    var GUARD_MAX = 2;
    var PURCHASE_GUARD_KEY = 'hacktivity.purchaseGuard';
    var PURCHASE_GUARD_MAX = 6;
    // Paths that sell something. In the Play app every buy prompt is Google Play's own purchase.
    var PURCHASE_PATH = /(^|\/)(pricing|plans|subscriptions|checkout|membership|billing|customer_portal|play_purchases)(\/|$)/;
    var doc = win.document;

    var state = { appWindow: 'browser', store: 'web', gameKey: '', eventId: '', package: '', appPaths: [], outsideHosts: [], v: '' };

    function meta(name) {
        try {
            var el = doc.querySelector('meta[name="' + name + '"]');
            return el ? (el.getAttribute('content') || '') : '';
        } catch (e) { return ''; }
    }

    // "pkg=key, pkg2=key2" (comma, semicolon or whitespace separated) -> { pkg: key }
    function playPackages() {
        var out = {};
        meta('hacktivity-play-packages').split(/[\s,;]+/).forEach(function (pair) {
            var i = pair.indexOf('=');
            if (i > 0) out[pair.slice(0, i)] = pair.slice(i + 1);
            else if (pair) out[pair] = '';
        });
        return out;
    }

    function appPathsFromMeta() {
        var raw = meta('hacktivity-app-paths');
        if (!raw) return null;
        try {
            var list = JSON.parse(raw);
            return Array.isArray(list) ? list.filter(function (p) { return typeof p === 'string'; }) : null;
        } catch (e) { return null; }
    }

    function userAgentPlatform() {
        var ua = '';
        try { ua = win.navigator.userAgent || ''; } catch (e) { return null; }
        if (!/HacktivityApp\//.test(ua)) return null;
        var m = /HacktivityApp\/[^\s(]*\s*\(([^)]*)\)/.exec(ua);
        var store = 'steam';
        if (m) {
            var s = /(?:^|[;\s])store=(web|steam)(?=$|[;\s])/.exec(m[1]);
            if (s) store = s[1];
        }
        return { appWindow: 'desktop-app', store: store };
    }

    function readStored() {
        try {
            var raw = win.sessionStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var v = JSON.parse(raw);
            if (v && v.appWindow === 'play-app' && v.store === 'play') return v;
        } catch (e) { /* storage blocked or corrupt: treat as nothing stored */ }
        return null;
    }

    function writeStored() {
        try {
            win.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
                appWindow: 'play-app', store: 'play', package: state.package, gameKey: state.gameKey,
                eventId: state.eventId, appPaths: state.appPaths, outsideHosts: state.outsideHosts, v: state.v, at: Date.now()
            }));
        } catch (e) { /* storage blocked: the page works for this load only */ }
    }

    function cleanVersion(v) {
        return typeof v === 'string' && /^\d{1,9}$/.test(v) ? v : '';
    }

    // v=<app version code> beside the marker in the start URL
    function versionInUrl() {
        try { return cleanVersion(new win.URL(win.location.href).searchParams.get('v') || ''); } catch (e) { return ''; }
    }

    function markerInUrl() {
        try {
            return new win.URL(win.location.href).searchParams.get('source') === 'play';
        } catch (e) { return false; }
    }

    function stripMarker() {
        try {
            var url = new win.URL(win.location.href);
            if (url.searchParams.get('source') !== 'play') return;
            url.searchParams.delete('source');
            url.searchParams.delete('v');
            win.history.replaceState(win.history.state, '', url.pathname + url.search + url.hash);
        } catch (e) { /* leave the address as it is */ }
    }

    function referrerPackage() {
        var ref = '';
        try { ref = doc.referrer || ''; } catch (e) { return ''; }
        var m = /^android-app:\/\/([^\/?#]+)\//.exec(ref);
        return m ? m[1] : '';
    }

    // Is the page shown as an installed app (a TWA is fullscreen or standalone), not in a browser tab?
    function shownAsApp() {
        try {
            return !!(win.matchMedia &&
                win.matchMedia('(display-mode: fullscreen), (display-mode: standalone), (display-mode: minimal-ui)').matches);
        } catch (e) { return false; }
    }

    function gameKeyFromPath() {
        var m = /^\/app\/([a-z0-9-]+)\/?$/.exec(win.location.pathname || '');
        return m ? m[1] : '';
    }

    // Fill gameKey, eventId and appPaths from this page's metas and the package list.
    // gameKey can stay '' on an engine page: engine pages carry no metas and rely on the value
    // stored when the tab entered through /app/<key>.
    function readPageFacts() {
        var key = (state.package && playPackages()[state.package]) || gameKeyFromPath();
        if (!key) {
            var pkgs = playPackages(), names = Object.keys(pkgs);
            if (names.length === 1) key = pkgs[names[0]];
        }
        if (key) state.gameKey = key;
        var ev = meta('hacktivity-app-event');
        if (ev) state.eventId = ev;
        var paths = appPathsFromMeta();
        if (paths) state.appPaths = paths;
        var hosts = meta('hacktivity-outside-hosts');
        if (hosts) state.outsideHosts = hosts.toLowerCase().split(/[\s,;]+/).filter(Boolean);
    }

    function publish() {
        var root = doc.documentElement;
        if (root) {
            root.setAttribute('data-app-window', state.appWindow);
            root.setAttribute('data-store', state.store);
        }
        api.appWindow = state.appWindow;
        api.store = state.store;
        api.gameKey = state.gameKey;
        api.eventId = state.eventId;
        api.isAppWindow = state.appWindow !== 'browser';
    }

    function becomePlay(pkg) {
        state.appWindow = 'play-app';
        state.store = 'play';
        state.package = pkg || state.package;
        readPageFacts();
        writeStored();
        publish();
    }

    function digitalGoodsResolves() {
        return new Promise(function (resolve) {
            var done = false;
            function finish(v) { if (!done) { done = true; resolve(v); } }
            try {
                if (typeof win.getDigitalGoodsService !== 'function') return finish(false);
                var timer = win.setTimeout(function () { finish(false); }, DG_TIMEOUT_MS);
                Promise.resolve(win.getDigitalGoodsService(BILLING_URL)).then(
                    function (svc) { win.clearTimeout(timer); finish(!!svc); },
                    function () { win.clearTimeout(timer); finish(false); }
                );
            } catch (e) { finish(false); }
        });
    }

    // ---- in-app paths, outside links, landing guard ----

    var compiledFor = null;
    var compiled = [];

    function inAppPaths() {
        if (compiledFor !== state.appPaths) {
            compiledFor = state.appPaths;
            compiled = [];
            state.appPaths.forEach(function (source) {
                try { compiled.push(new win.RegExp(source)); } catch (e) { /* skip a pattern that does not compile */ }
            });
        }
        return compiled;
    }

    // The path as the server reads it: letters written as %XX decoded (/%70lans is /plans), ";params"
    // dropped from each segment, slashes collapsed. Used for every path test, never for navigation.
    function canonicalPath(pathname) {
        var p = String(pathname || '').replace(/%([0-9a-fA-F]{2})/g, function (m, hex) {
            var c = String.fromCharCode(parseInt(hex, 16));
            return /[A-Za-z0-9\-._~]/.test(c) ? c : m;
        });
        var out = p.split('/').map(function (seg) { var i = seg.indexOf(';'); return i >= 0 ? seg.slice(0, i) : seg; })
            .filter(function (seg) { return seg !== ''; });
        return '/' + out.join('/');
    }

    function isPurchasePath(pathname) { return PURCHASE_PATH.test(canonicalPath(pathname).toLowerCase()); }

    function pathInApp(pathname) {
        var list = inAppPaths();
        var canonical = canonicalPath(pathname);
        for (var i = 0; i < list.length; i++) if (list[i].test(pathname) || list[i].test(canonical)) return true;
        return false;
    }

    // true when this host is one the browser hand-off opens (this page's own host always is)
    function hostAllowed(u) {
        if (u.origin === win.location.origin) return true;
        if (!state.outsideHosts.length) return true; // no list known: the native side decides
        return state.outsideHosts.indexOf(u.hostname.toLowerCase()) >= 0;
    }

    // the Play app's own marker and version never travel to a page in the browser
    function withoutAppParams(u) {
        try {
            var c = new win.URL(u.href);
            if (c.searchParams.get('source') === 'play') c.searchParams.delete('source');
            var v = c.searchParams.get('v');
            if (v !== null && /^\d{1,9}$/.test(v)) c.searchParams.delete('v');
            return c;
        } catch (e) { return u; }
    }

    // Test hook, only on pages that carry <meta name="hacktivity-test-hooks" content="1"> (Hacktivity
    // emits it in development and test): records a navigation in win[name] when that is an array, and
    // returns true (skip the real navigation) when win.__hacktivityStubNavigation is set.
    function hook(name, entry) {
        if (meta('hacktivity-test-hooks') !== '1' || !Array.isArray(win[name])) return false;
        win[name].push(entry);
        return !!win.__hacktivityStubNavigation;
    }

    function trampolineAvailable() {
        return !!state.v && parseInt(state.v, 10) >= OUTSIDE_MIN_VERSION;
    }

    function openOutside(url) {
        var raw = String(url == null ? '' : url);
        if (!raw || /[\u0000-\u0020\u007f\\]/.test(raw) || raw.length > 2048) return { ok: false, reason: 'invalid-url' };
        var u;
        try { u = new win.URL(raw, win.location.href); } catch (e) { return { ok: false, reason: 'invalid-url' }; }
        var sameOrigin = u.origin === win.location.origin;
        if (u.protocol !== 'https:' && !(u.protocol === 'http:' && sameOrigin)) return { ok: false, reason: 'invalid-url' };
        if (u.username || u.password) return { ok: false, reason: 'invalid-url' };

        if (state.appWindow === 'play-app') {
            if (isPurchasePath(u.pathname)) return { ok: false, reason: 'purchase' };
            if (sameOrigin && pathInApp(u.pathname)) return { ok: false, reason: 'in-app' };
            u = withoutAppParams(u);
        }
        // a host the hand-off will not open gets a plain window.open (the app's own view, with a URL bar)
        var via = state.appWindow === 'play-app' && trampolineAvailable() && hostAllowed(u) ? 'trampoline' : 'window';
        var target = via === 'trampoline' ? OUTSIDE_URL + encodeURIComponent(u.href) : u.href;
        if (hook('__hacktivityOutside', { url: u.href, via: via, target: target })) return { ok: true, via: 'stub' };
        try {
            if (via === 'trampoline') win.location.href = target;
            else win.open(u.href, '_blank', 'noopener');
        } catch (e) { return { ok: false, reason: 'failed' }; }
        return { ok: true, via: via };
    }

    function wantsOutside(a, u) {
        if (a.hasAttribute('data-outside')) return true;
        if (u.origin !== win.location.origin) return hostAllowed(u); // a host the hand-off refuses opens in the app's own view
        if (!state.appPaths.length) return false; // no list yet: do not guess
        return !pathInApp(u.pathname);
    }

    function onClick(ev) {
        try {
            if (state.appWindow !== 'play-app' || ev.defaultPrevented) return;
            if (typeof ev.button === 'number' && ev.button !== 0) return;
            var el = ev.target;
            var a = el && el.closest ? el.closest('a[href], area[href]') : null;
            if (!a) return;
            if (a.hasAttribute('data-method') || a.hasAttribute('data-remote') || a.hasAttribute('download')) return;
            var u = new win.URL(a.getAttribute('href'), win.location.href);
            if (u.protocol !== 'https:' && u.protocol !== 'http:') return;
            if (u.origin === win.location.origin && u.pathname === win.location.pathname && u.search === win.location.search && u.hash) return;
            if (!wantsOutside(a, u)) return;
            var result = api.openOutside(u.href);
            // an in-app target with data-outside just navigates; everything else stays where it is
            if (result.reason === 'in-app') return;
            ev.preventDefault();
        } catch (e) { /* leave the click alone */ }
    }

    // A page that sells something never shows in the Play app. Unlike the general guard this has no
    // "twice a minute" limit, because the target is an in-app page; if the page keeps coming back
    // (6 times in a minute, or no game to go home to) it is replaced with a short message instead.
    function blankPurchasePage() {
        function run() {
            var body = doc.body;
            if (!body) return;
            body.textContent = '';
            body.setAttribute('style', 'margin:0;padding:24px;background:#050608;color:#e8e8ee;font:18px sans-serif');
            var p = doc.createElement('p');
            p.textContent = 'Not available in the app.';
            body.appendChild(p);
            if (state.gameKey) {
                var a = doc.createElement('a');
                a.setAttribute('href', api.homeUrl());
                a.setAttribute('style', 'color:#8cf');
                a.textContent = 'Back to the game';
                body.appendChild(a);
            }
        }
        if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', run); else run();
    }

    function recentTimes(key) {
        var now = Date.now(), times = [];
        try { times = JSON.parse(win.sessionStorage.getItem(key) || '[]'); } catch (e) { times = []; }
        return (Array.isArray(times) ? times : []).filter(function (t) { return typeof t === 'number' && now - t < GUARD_WINDOW_MS; });
    }

    function landingGuard() {
        try {
            if (state.appWindow !== 'play-app') return;
            var path = win.location.pathname;
            if (pathInApp(path)) return;
            var purchase = isPurchasePath(path);
            if (!purchase && (!state.gameKey || !state.appPaths.length)) return;
            var key = purchase ? PURCHASE_GUARD_KEY : GUARD_KEY;
            var max = purchase ? PURCHASE_GUARD_MAX : GUARD_MAX;
            var times = recentTimes(key);
            if (times.length >= max || (purchase && !state.gameKey)) {
                if (purchase) blankPurchasePage();
                return;
            }
            times.push(Date.now());
            try { win.sessionStorage.setItem(key, JSON.stringify(times)); } catch (e) {
                if (purchase) blankPurchasePage();
                return; // cannot count: do not loop
            }
            if (hook('__hacktivityHome', { from: path, to: api.homeUrl() })) return;
            win.location.replace(api.homeUrl());
        } catch (e) { /* stay on the page */ }
    }

    // The server only forces Remember me for the desktop app, so the Play app ticks it.
    function tickRememberMe() {
        try {
            var boxes = doc.querySelectorAll('input[type="checkbox"][name="user[remember_me]"]');
            for (var i = 0; i < boxes.length; i++) boxes[i].checked = true;
        } catch (e) { /* ignore */ }
    }

    function whenPlay() {
        if (state.appWindow !== 'play-app') return;
        landingGuard();
        if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', tickRememberMe);
        else tickRememberMe();
    }

    var api = {
        appWindow: 'browser',
        store: 'web',
        gameKey: '',
        eventId: '',
        isAppWindow: false,
        ready: Promise.resolve(),
        /** Where the app goes to leave a mission. */
        homeUrl: function () {
            if (state.appWindow === 'play-app' && state.gameKey) return '/app/' + encodeURIComponent(state.gameKey);
            return '/';
        },
        /**
         * Open a link in the player's own browser. Returns { ok, via, reason }.
         * Play app: the native hand-off (see the header); refuses payment paths, in-app paths,
         * userinfo, odd characters and anything that is not https (http only for this page's own
         * origin, which a debug build needs). Other windows keep a plain window.open.
         */
        openOutside: function (url) { return openOutside(url); },
        /** Stub: P7 adds the Play purchase flow, P2b the web and Steam routes. */
        buy: function () { return Promise.resolve({ ok: false, reason: 'not-implemented' }); },
        /** Stub: P7 adds restore. */
        restore: function () { return Promise.resolve({ ok: false, reason: 'not-implemented' }); }
    };

    function detect() {
        try {
            var fromUa = userAgentPlatform();
            if (fromUa) {
                state.appWindow = fromUa.appWindow;
                state.store = fromUa.store;
                if (markerInUrl()) stripMarker();
                return null;
            }
            var stored = readStored();
            var marker = markerInUrl();
            if (stored) {
                state.appWindow = 'play-app';
                state.store = 'play';
                state.package = stored.package || '';
                state.gameKey = stored.gameKey || '';
                state.eventId = stored.eventId || '';
                state.appPaths = Array.isArray(stored.appPaths) ? stored.appPaths : [];
                state.outsideHosts = Array.isArray(stored.outsideHosts) ? stored.outsideHosts : [];
                state.v = cleanVersion(stored.v);
                if (marker && versionInUrl()) state.v = versionInUrl();
                readPageFacts();
                writeStored(); // pages carry newer facts as the player moves about
                if (marker) stripMarker();
                return null;
            }
            var pkg = referrerPackage();
            var listed = !!pkg && Object.prototype.hasOwnProperty.call(playPackages(), pkg);
            if (!marker) {
                // a cold start from a link: no marker, but Android opened the app and Chrome says so
                // (no version code on a link, so this start uses the plain window.open fallback)
                if (listed && shownAsApp()) becomePlay(pkg);
                return null;
            }
            var launchVersion = versionInUrl();
            stripMarker();
            // the marker alone is not enough: the page must also be shown as an installed app, so a
            // browser tab that is handed the marker and an android-app referrer stays the website
            if (!shownAsApp()) return null;
            if (listed) {
                state.v = launchVersion;
                becomePlay(pkg);
                return null;
            }
            return digitalGoodsResolves().then(function (ok) {
                if (!ok) return;
                state.v = launchVersion;
                becomePlay(pkg);
            });
        } catch (e) {
            state.appWindow = 'browser';
            state.store = 'web';
            return null;
        }
    }

    var pending = detect();
    publish();
    win.HacktivityPlatform = api;
    doc.addEventListener('click', onClick, true);
    if (pending) api.ready = pending.then(whenPlay);
    else whenPlay();
})(typeof window !== 'undefined' ? window : undefined);
