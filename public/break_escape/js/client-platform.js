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
 *   3. The Play app's start URL marker, ?source=play, accepted only when
 *        - document.referrer starts with android-app://<package>/ for a package listed in
 *          <meta name="hacktivity-play-packages" content="<package>=<game key>,...">, or
 *        - getDigitalGoodsService('https://play.google.com/billing') resolves.
 *      A marker that fails both checks is ignored, so a shared link cannot put a desktop
 *      browser into the app layout. The marker is always removed from the address bar.
 * Any storage error means browser/web. Never throws.
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
    var BILLING_URL = 'https://play.google.com/billing';
    var DG_TIMEOUT_MS = 3000;
    var doc = win.document;

    var state = { appWindow: 'browser', store: 'web', gameKey: '', eventId: '', package: '', appPaths: [] };

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
                eventId: state.eventId, appPaths: state.appPaths, at: Date.now()
            }));
        } catch (e) { /* storage blocked: the page works for this load only */ }
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
            win.history.replaceState(win.history.state, '', url.pathname + url.search + url.hash);
        } catch (e) { /* leave the address as it is */ }
    }

    function referrerPackage() {
        var ref = '';
        try { ref = doc.referrer || ''; } catch (e) { return ''; }
        var m = /^android-app:\/\/([^\/?#]+)\//.exec(ref);
        return m ? m[1] : '';
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
        /** Stub: P5 makes the Play app send the link out by the mechanism P0 proves. */
        openOutside: function (url) {
            try { win.open(url, '_blank', 'noopener'); } catch (e) { /* ignore */ }
        },
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
                readPageFacts();
                writeStored(); // pages carry newer facts as the player moves about
                if (marker) stripMarker();
                return null;
            }
            if (!marker) return null;
            stripMarker();
            var pkg = referrerPackage();
            if (pkg && Object.prototype.hasOwnProperty.call(playPackages(), pkg)) {
                becomePlay(pkg);
                return null;
            }
            return digitalGoodsResolves().then(function (ok) { if (ok) becomePlay(pkg); });
        } catch (e) {
            state.appWindow = 'browser';
            state.store = 'web';
            return null;
        }
    }

    var pending = detect();
    publish();
    if (pending) api.ready = pending.then(function () { /* becomePlay already published */ });
    win.HacktivityPlatform = api;
})(typeof window !== 'undefined' ? window : undefined);
