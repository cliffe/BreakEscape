/**
 * R13: while the player is working on the VM, hostile NPCs and NPC AI hold still.
 *
 * "On the VM" means any of:
 *  - the VM launcher is open. In Hacktivity it holds the embedded VM page, and the
 *    browser (VNC) console opens inside that page, so the player works in it here;
 *  - a flag station is open (the player is pasting a flag copied off the VM);
 *  - the HUD's VM Controls overlay is open (vm-controls-widget.js, the same
 *    Hacktivity page in an overlay);
 *  - the game's tab is hidden (the console popped out to its own tab);
 *  - the game's window lost focus to something outside the page (the SPICE desktop
 *    console, or a VNC console in a separate window). Focus moving into one of the
 *    page's own iframes (the embedded VM page) is not counted here: the launcher or
 *    overlay check above covers that case.
 *
 * Hacktivity sends Break Escape no "console open" event (its embedded page only
 * posts vmSetState for the activation badge), so these are the signals the page can
 * see. While paused (npc-behavior.js, npc-attack-guard.js, game.js update): NPC behaviour updates and sight challenges stop, NPCs are
 * stood still, no attack starts and a windup already running does not land. Mission
 * timers, phone messages and the clock carry on.
 *
 * Kept free of imports so it can be tested in isolation.
 */

// Minigames that are the player's VM context
export const VM_CONTEXT_SCENES = new Set(['vm-launcher', 'flag-station']);

let windowBlurred = false;
let listening = false;

/**
 * True while the player is in the VM context (see above).
 * @param {object} [deps] - overridable for tests: framework, vmControlsWidget, document, blurred
 * @returns {boolean}
 */
export function isVmContextActive(deps = {}) {
  const w = typeof window !== 'undefined' ? window : {};
  const framework = 'framework' in deps ? deps.framework : w.MinigameFramework;
  const current = framework?.currentMinigame;
  if (current && !current._ending && VM_CONTEXT_SCENES.has(current._sceneType)) return true;

  const widget = 'vmControlsWidget' in deps ? deps.vmControlsWidget : w.vmControlsWidget;
  if (widget && (widget.isOpen === true || widget._overlayOpen === true)) return true;

  const doc = 'document' in deps ? deps.document : (typeof document !== 'undefined' ? document : null);
  if (doc && doc.hidden === true) return true;

  const blurred = 'blurred' in deps ? deps.blurred : windowBlurred;
  return blurred === true;
}

/**
 * Watch window focus and tab visibility. Safe to call more than once.
 * @param {object} [deps] - overridable for tests: window, document, defer
 */
export function initVmContextPause(deps = {}) {
  const w = deps.window ?? (typeof window !== 'undefined' ? window : null);
  const doc = deps.document ?? (typeof document !== 'undefined' ? document : null);
  if (!w || !doc || (listening && !deps.window)) return;
  listening = true;
  const defer = deps.defer ?? ((fn) => setTimeout(fn, 0));

  w.addEventListener('blur', () => {
    // activeElement is only up to date after the blur has finished
    defer(() => {
      const active = doc.activeElement;
      windowBlurred = !(active && String(active.tagName).toUpperCase() === 'IFRAME');
    });
  });
  w.addEventListener('focus', () => { windowBlurred = false; });
  doc.addEventListener?.('visibilitychange', () => {
    if (!doc.hidden && doc.hasFocus?.()) windowBlurred = false;
  });

  w.isVmContextActive = () => isVmContextActive();
}

/** For tests: forget the focus state. */
export function _resetVmContextPause() {
  windowBlurred = false;
  listening = false;
}
