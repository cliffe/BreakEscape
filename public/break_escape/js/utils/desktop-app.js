/**
 * Is the game running inside the Hacktivity desktop app? Its shell appends
 * " HacktivityApp/<version> (game=...; edition=...)" to the user agent. The app is a single
 * window with no tabs: scripts must not close it, and the admin-only /break_escape/missions page
 * is not a way back. The host's "/" sends the app to its game's event page.
 *
 * The Play app (a Trusted Web Activity) is a single window too. It is told apart by the marker
 * client-platform.js keeps in sessionStorage['hacktivity.platform'], so isAppWindow() covers both.
 */
export function isDesktopApp(w = (typeof window !== 'undefined' ? window : undefined)) {
    return /HacktivityApp\//.test(w?.navigator?.userAgent || '');
}

function storedPlayMarker(w) {
    try {
        const v = JSON.parse(w?.sessionStorage?.getItem('hacktivity.platform') || 'null');
        return v && v.appWindow === 'play-app' && v.store === 'play' ? v : null;
    } catch (e) {
        return null;
    }
}

/** Single-window app of either kind (desktop or Play): never window.close(). */
export function isAppWindow(w = (typeof window !== 'undefined' ? window : undefined)) {
    if (isDesktopApp(w)) return true;
    const p = w?.HacktivityPlatform;
    if (p && p.appWindow) return p.appWindow !== 'browser';
    return !!storedPlayMarker(w);
}

/** Where the app goes to leave a mission (the host redirects it to the game's event page). */
export const DESKTOP_APP_HOME = '/';

/** "/" in the desktop app (the server sends it to the game); /app/<gameKey> in the Play app. */
export function appHomeUrl(w = (typeof window !== 'undefined' ? window : undefined)) {
    if (isDesktopApp(w)) return DESKTOP_APP_HOME;
    const p = w?.HacktivityPlatform;
    if (p && p.appWindow === 'play-app' && typeof p.homeUrl === 'function') return p.homeUrl();
    const stored = storedPlayMarker(w);
    if (stored && stored.gameKey) return '/app/' + encodeURIComponent(stored.gameKey);
    return DESKTOP_APP_HOME;
}
