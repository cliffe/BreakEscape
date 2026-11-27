// Which objects are computers, for the screens that draw one (code review R1 m3).
// One keyword list for both checks:
// - the container's desktop mode (container-minigame.js shouldUseDesktopMode) looks for a
//   keyword anywhere in the object's name, type and sprite name, so "IT Monitoring
//   Station" and "cctv_monitors1" open as desktops;
// - the password screen (password-minigame.js passwordScreenKind) reads the type and the
//   sprite name only, and a keyword must be a whole segment (pc3, mail_terminal,
//   security_console), so a door named "Server Room" or a room type "room_servers" keeps
//   the plain panel.
export const COMPUTER_KEYWORDS = Object.freeze([
    'computer', 'pc', 'laptop', 'desktop', 'terminal', 'workstation',
    'tablet', 'ipad', 'surface', 'monitor', 'screen', 'display',
    'server', 'mainframe', 'console', 'kiosk', 'smartboard', 'smartscreen'
]);

/** True when any keyword appears anywhere in the text (the desktop-mode test). */
export function mentionsComputer(text) {
    const t = String(text || '').toLowerCase();
    return COMPUTER_KEYWORDS.some((k) => t.includes(k));
}

// A keyword as a whole segment between start, end, _, - or a space, trailing digits allowed.
const SEGMENT = new RegExp(`(^|[_\\-\\s])(${COMPUTER_KEYWORDS.join('|')})\\d*($|[_\\-\\s])`);

/** True when a type or sprite name has a keyword as a whole segment (the password-screen test). */
export function isComputerType(text) {
    return SEGMENT.test(String(text || '').toLowerCase());
}
