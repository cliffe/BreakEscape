/**
 * Is the game running inside the Hacktivity desktop app? Its shell appends
 * " HacktivityApp/<version> (game=...; edition=...)" to the user agent. The app is a single
 * window with no tabs: scripts must not close it, and the admin-only /break_escape/missions page
 * is not a way back. The host's "/" sends the app to its game's event page.
 */
export function isDesktopApp(w = (typeof window !== 'undefined' ? window : undefined)) {
    return /HacktivityApp\//.test(w?.navigator?.userAgent || '');
}

/** Where the app goes to leave a mission (the host redirects it to the game's event page). */
export const DESKTOP_APP_HOME = '/';
