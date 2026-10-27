/**
 * Install button for the game's web app (PWA.md section 9). A classic script, loaded deferred on the
 * game shell's title screen. It only decides what the page's own elements do; it caches nothing and
 * registers no service worker.
 *
 * The page carries (all optional, all hidden with an inline display:none until this script shows them):
 *   [data-pwa-install]         the title-menu button; [data-pwa-install-label] inside it holds its text
 *   [data-pwa-help]            the instructions panel; children [data-pwa-help-for="ios|mac"]
 *   [data-pwa-play]            a "Get it on Google Play" link, present only for a game with a Play app
 *
 * What shows, by window and browser (decide()):
 *   - Never in the desktop app, the Play app or the installed web app itself (HacktivityPlatform.appWindow
 *     must be 'browser') and never where the store is not 'web' (Steam). No HacktivityPlatform: nothing.
 *   - Android: the Play link when the game has a Play app (the install button is never offered there);
 *     otherwise the install button once Chrome has offered the install (beforeinstallprompt).
 *   - iPad (and iPadOS in desktop mode): "How to install", with the Share / Add to Home Screen steps.
 *     iPhone: nothing yet (OFFER_ON_IPHONE), until the phone and touch work in ANDROID.md Q5 is done.
 *   - macOS Safari 17 and later: "How to install", with File / Add to Dock.
 *   - Other browsers: the install button once beforeinstallprompt has fired; else nothing (Firefox).
 * Clicking the button calls the saved prompt() (Chromium) or opens the instructions panel. When the app
 * is installed (appinstalled) everything hides, and a GA4 event "pwa_installed" goes through gtag when the
 * page has it (the game shell loads no analytics today, so nothing is sent from there).
 *
 * window.HacktivityPwaInstall: decide(), classify() (exported for tests).
 */
(function (win) {
    'use strict';
    if (!win || !win.document) return;

    // iPhone waits for the phone and touch work (ANDROID.md Q5); flip to offer the instructions there.
    var OFFER_ON_IPHONE = false;

    var doc = win.document;
    var deferredPrompt = null;
    var installed = false;

    // 'android' | 'iphone' | 'ipad' | 'mac-safari' | 'other'
    function classify() {
        var ua = '', touch = 0;
        try { ua = win.navigator.userAgent || ''; touch = win.navigator.maxTouchPoints || 0; } catch (e) { return 'other'; }
        if (/Android/i.test(ua)) return 'android';
        if (/iPhone|iPod/.test(ua)) return 'iphone';
        if (/iPad/.test(ua)) return 'ipad';
        if (/Macintosh/.test(ua)) {
            if (touch > 1) return 'ipad'; // iPadOS asks for the desktop site and says Macintosh
            var v = /Version\/(\d+)/.exec(ua);
            var engineOther = /Chrome|Chromium|CriOS|FxiOS|Edg|OPR|Firefox/.test(ua);
            if (v && /Safari\//.test(ua) && !engineOther && parseInt(v[1], 10) >= 17) return 'mac-safari';
        }
        return 'other';
    }

    function shownAsApp() {
        try {
            if (win.navigator.standalone === true) return true;
            return !!(win.matchMedia &&
                win.matchMedia('(display-mode: fullscreen), (display-mode: standalone), (display-mode: minimal-ui)').matches);
        } catch (e) { return false; }
    }

    // 'none' | 'prompt' | 'ios' | 'mac' | 'play'
    function decide(hasPlayLink) {
        var p = win.HacktivityPlatform;
        if (!p || p.appWindow !== 'browser' || p.store !== 'web') return 'none';
        if (installed || shownAsApp()) return 'none';
        var kind = classify();
        if (kind === 'android') {
            if (hasPlayLink) return 'play';
            return deferredPrompt ? 'prompt' : 'none';
        }
        if (kind === 'ipad') return 'ios';
        if (kind === 'iphone') return OFFER_ON_IPHONE ? 'ios' : 'none';
        if (kind === 'mac-safari') return 'mac';
        return deferredPrompt ? 'prompt' : 'none';
    }

    function show(el, on) { if (el) el.style.display = on ? '' : 'none'; }

    function render() {
        var btn = doc.querySelector('[data-pwa-install]');
        var help = doc.querySelector('[data-pwa-help]');
        var play = doc.querySelector('[data-pwa-play]');
        var label = btn && btn.querySelector('[data-pwa-install-label]');
        var mode = decide(!!play);
        show(btn, mode === 'prompt' || mode === 'ios' || mode === 'mac');
        show(play, mode === 'play');
        if (label) label.textContent = mode === 'prompt' ? 'Install the app' : 'How to install';
        if (help) {
            var kids = help.querySelectorAll('[data-pwa-help-for]');
            for (var i = 0; i < kids.length; i++) {
                kids[i].style.display = kids[i].getAttribute('data-pwa-help-for') === mode ? '' : 'none';
            }
            if (mode !== 'ios' && mode !== 'mac') show(help, false);
        }
        if (btn) btn.setAttribute('aria-expanded', help && help.style.display !== 'none' && mode !== 'prompt' ? 'true' : 'false');
        return mode;
    }

    function onClick() {
        var mode = decide(!!doc.querySelector('[data-pwa-play]'));
        if (mode === 'prompt' && deferredPrompt) {
            var saved = deferredPrompt;
            deferredPrompt = null; // a prompt can be used once
            try {
                saved.prompt();
                Promise.resolve(saved.userChoice).then(function (choice) {
                    if (!choice || choice.outcome !== 'accepted') render();
                }, render);
            } catch (e) { /* the browser refused: leave the button hidden until it offers again */ }
            render();
            return;
        }
        if (mode === 'ios' || mode === 'mac') {
            var help = doc.querySelector('[data-pwa-help]');
            if (help) show(help, help.style.display === 'none');
            render();
        }
    }

    function onInstalled() {
        installed = true;
        deferredPrompt = null;
        try {
            if (typeof win.gtag === 'function') win.gtag('event', 'pwa_installed', { event_category: 'engagement' });
        } catch (e) { /* analytics must never break the page */ }
        render();
    }

    win.addEventListener('beforeinstallprompt', function (ev) {
        // keep the mini-infobar away on Android; the page's own button asks instead
        try { ev.preventDefault(); } catch (e) { /* ignore */ }
        deferredPrompt = ev;
        render();
    });
    win.addEventListener('appinstalled', onInstalled);

    function start() {
        var btn = doc.querySelector('[data-pwa-install]');
        if (btn) btn.addEventListener('click', onClick);
        var p = win.HacktivityPlatform;
        // the Play checks may still be settling (api.ready); decide after they have
        Promise.resolve(p && p.ready).then(render, render);
    }

    win.HacktivityPwaInstall = { decide: decide, classify: classify, render: render };
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})(typeof window !== 'undefined' ? window : undefined);
