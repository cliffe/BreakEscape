'use strict';
/**
 * What bootstrap (playtest-session.js) should deal with next, decided from one
 * reading of the page. Kept apart from the browser so it can be tested.
 *
 * Order matters (lab_physical_pentest playtests, findings E8):
 *
 * 1. The session-resume overlay comes first. The world loads underneath it and an
 *    opening briefing can open there, paused. Handling the minigame first either
 *    reported briefingPending behind the overlay or, with autoBrief, pressed
 *    Continue on a paused dialogue until the deadline. An Enter on the title card
 *    under the overlay also means Resume, whatever `resume` asked for.
 * 2. Then a minigame, then any other blocking UI: as before.
 * 3. Nothing open is only "clear" once the world has loaded (a room is current) and
 *    no opening conversation is still to come. On a slow machine the title card
 *    closed before the world existed: bootstrap returned settled with room null and
 *    the briefing opened a moment later, with no briefingPending in the reply.
 *    The wait for an opening conversation is bounded (OPENING_WAIT_MS) so one that
 *    never starts cannot hold a run up.
 */
const OPENING_WAIT_MS = 20000;

function nextBootstrapTarget({ overlayUp = false, mg = null, bl = null, worldReady = true,
                               openingPending = false, openingWaitedMs = 0 } = {}) {
  if (overlayUp) return bl ? 'session-overlay' : 'wait-overlay';
  if (mg) return 'minigame';
  if (bl) return 'blocking';
  if (!worldReady) return 'wait-world';
  if (openingPending && openingWaitedMs < OPENING_WAIT_MS) return 'wait-opening';
  return 'clear';
}

/** Runs in the page: the facts nextBootstrapTarget needs, never throwing. */
function readBootstrapFacts() {
  const out = { overlayUp: false, mg: null, bl: null, worldReady: false, openingPending: false };
  try { out.overlayUp = window.breakEscapeSessionOverlayShowing === true; } catch (e) { /* not loaded */ }
  try {
    const s = window.__test.getState();
    out.mg = s.activeMinigame || null;
    out.bl = s.blockingUi || null;
    out.worldReady = !!s.room;
  } catch (e) { /* bridge not ready: nothing open, world not ready */ }
  try { out.openingPending = !!window.npcManager?.hasPendingOpeningConversation?.(); } catch (e) { /* none */ }
  return out;
}

module.exports = { nextBootstrapTarget, readBootstrapFacts, OPENING_WAIT_MS };
