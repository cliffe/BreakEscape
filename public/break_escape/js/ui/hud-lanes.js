/**
 * HUD lanes (UI decisions H1 and B2, option A of each, 2026-11-14).
 *
 * Every HUD message type has a lane of its own, so toasts, barks, the caption, the objectives
 * and the tray never land on each other:
 *
 *   1. top bar      objectives (a one-line pill on phones) at the left, menu buttons at the right
 *   2. notify lane  system toasts first, then phone texts under them (a phone contact's message)
 *   3.              (the world view)
 *   4. message lane speech from someone in the building who is out of view, above the caption
 *   5. bottom dock  avatar and hearts, the tray, Block and Punch
 *
 * The top bar and the dock are measured; the two lanes between them split the free height,
 * and each lane's members are placed one after another inside it, each limited to what is left.
 * So two lanes never meet, and two members of one lane never meet.
 *
 * Pure parts (computeLanes, stackMembers, barkSource, arrowDirection, isCompactViewport) are
 * unit tested; startHudLanes() measures and applies them in the browser.
 */

export const LANE_GAP = 8;          // px between a lane and its neighbours, and between members
export const SIDE_GUTTER = 16;      // px either side of a lane on a phone
export const DESKTOP_RIGHT = 20;    // px from the right edge to the notify lane on a wide screen
// The free height between the top bar and the dock: the two lanes together may use at most this
// share of it, so the rest always stays world view. Space no message needs is split in the
// ratio of the shares below; when the messages need more than the budget, it is split by need.
// Phones held sideways (500 px tall or less) have so little height that the lanes may use
// nearly all of it for the few seconds a message shows.
export const LANE_BUDGET = { compact: 0.75, short: 0.95, wide: 0.8 };

/** The budget share for a measurement. */
export function laneBudgetShare({ compact, vh }) {
  if (compact && vh <= 500) return LANE_BUDGET.short;
  return compact ? LANE_BUDGET.compact : LANE_BUDGET.wide;
}

/**
 * Which lane members step aside (are hidden until there is room) when the messages need more
 * than the budget, in this order: the caption first (it comes back on the next hover or tap),
 * then the phone texts one at a time, oldest first (they are kept in the phone thread, with the
 * unread badge, and their countdown waits while they are hidden). Speech is voiced and toasts
 * explain a refusal, so they never step aside; they share what is left.
 * @param {{caption:number, speech:number, toasts:number, phone:number|number[], phoneExtra?:number}} h
 *   heights (0 = none); phone is one height or each text's height, oldest first; phoneExtra is
 *   the "Clear all" button, counted while two or more texts show (it hides with fewer)
 * @returns {{caption:boolean, phone:boolean, phoneHidden:number}} phone is true when every text
 *   stepped aside; phoneHidden is how many did (the oldest ones)
 */
export function laneYields(h, budget, gap = LANE_GAP) {
  const texts = (Array.isArray(h.phone) ? h.phone : [h.phone]).map(x => Math.max(0, x || 0)).filter(x => x > 0);
  const extra = Math.max(0, h.phoneExtra || 0);
  const sum = (list) => list.filter(x => x > 0).reduce((a, x) => a + x + gap, 0);
  const need = (cap, hidden) => {
    const shown = texts.slice(hidden);
    return sum([cap, h.speech, h.toasts]) + sum(shown) + (shown.length >= 2 && extra ? extra + gap : 0);
  };
  const out = { caption: false, phone: false, phoneHidden: 0 };
  if (need(h.caption, 0) <= budget) return out;
  if (h.caption > 0 && (h.speech > 0 || h.toasts > 0 || texts.length > 0)) out.caption = true;
  const cap = out.caption ? 0 : h.caption;
  if (need(cap, 0) <= budget) return out;
  // Texts make way for speech or a toast; among themselves the newest always shows
  const keep = (h.speech > 0 || h.toasts > 0) ? 0 : 1;
  let n = 0;
  while (n < texts.length - keep && need(cap, n) > budget) n++;
  out.phoneHidden = n;
  out.phone = n > 0 && n === texts.length;
  return out;
}
export const NOTIFY_SHARE = { compact: 0.4, wide: 0.5 };
export const MESSAGE_SHARE = { compact: 0.3, wide: 0.3 };

/** Phones and small windows: narrower than 900 px, or 500 px tall or less (phones sideways). */
export function isCompactViewport(vw, vh) {
  return vw < 900 || vh <= 500;
}

/**
 * Where a bark goes when it is not a speech bubble (B2 option A):
 *   'phone'  a text from a phone contact: phone notification in the notify lane, tap opens the thread
 *   'speech' a person in the building, out of view: a line in the message lane, not clickable
 * payload.channel ('phone' or 'speech') wins when a caller knows; a timed message with a phone id
 * is a text whoever sends it. A caller's own click handler keeps the bark clickable (phone).
 * Phone contacts are registered when the game starts, so any other sender (a person, or an NPC
 * whose room has not loaded and so is not registered yet) is speech (review R1 M4).
 */
export function barkSource({ npcType = null, channel = null, hasClickHandler = false } = {}) {
  if (channel === 'phone' || channel === 'speech') return channel;
  if (npcType === 'phone') return 'phone';
  if (hasClickHandler) return 'phone';
  return 'speech';
}

// Dialogs and modals the bark lanes sit under (css/npc-barks.css) and hold new barks for
// (npc-barks.js _shouldDefer), review R1 M1. Minigames and conversations have their own hold.
// The tutorial's step panel holds them too while it shows (review R2 M3): it covers the notify lane.
export const DIALOG_SELECTORS = ['.tutorial-prompt-overlay', '.tutorial-overlay .tutorial-panel', '.game-confirm-overlay', '#game-menu-overlay.visible',
  '#password-modal', '#player-preferences-modal', '.ending-check-overlay', '.success-screen-overlay'];

/** True while one of DIALOG_SELECTORS shows, or the tutorial prompt is due (it counts from the call). */
export function dialogLayerOpen(doc = (typeof document !== 'undefined' ? document : null),
  win = (typeof window !== 'undefined' ? window : null)) {
  try { if (win?.getTutorialManager?.()?.isPromptOpen?.()) return true; } catch (e) { /* no tutorial */ }
  if (!doc?.querySelectorAll) return false;
  for (const el of doc.querySelectorAll(DIALOG_SELECTORS.join(', '))) {
    if (el.style && el.style.display === 'none') continue;
    const cs = gcs(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    return true;
  }
  return false;
}

/**
 * The lane rectangles in screen pixels.
 * @param {object} m
 *   vw, vh          window size
 *   compact         phone layout (isCompactViewport)
 *   topBarBottom    lowest bottom edge of the top bar's pieces (objectives, menu buttons)
 *   dockTop         highest top edge of the dock's pieces (tray, avatar, Block/Punch)
 *   leftPanelRight  right edge of a wide screen's objectives panel (the notify lane keeps clear)
 *   notifyWidth     wide screens: the notify lane's preferred width (600 at zoom 1)
 *   messageWidth    the message lane's preferred width (720 at zoom 1)
 *   notifyFloor     height the notify lane must have whole (a finished-task line, review R2 M4):
 *                   it may take the world view's reserve, and the message lane keeps what is left
 * @returns {{ notify: {top,left,width,maxHeight}, message: {bottom,left,width,maxHeight}, world: {top,bottom} }}
 */
export function computeLanes({ vw, vh, compact, topBarBottom = 0, dockTop = null, leftPanelRight = 0,
  notifyWidth = 600, messageWidth = 720, notifyTopMin = 0, notifyContent = 0, messageContent = 0, notifyFloor = 0 } = {}) {
  const dock = Number.isFinite(dockTop) ? Math.min(dockTop, vh) : vh;
  const notifyTop = Math.round(Math.max(topBarBottom, notifyTopMin) + LANE_GAP);
  const messageBottomY = Math.round(dock - LANE_GAP);            // the lane's lower edge, as a y
  const free = Math.max(0, messageBottomY - notifyTop);
  const share = compact ? 'compact' : 'wide';
  const budget = Math.floor(free * laneBudgetShare({ compact, vh }));
  const needN = Math.max(0, notifyContent || 0);
  const needM = Math.max(0, messageContent || 0);
  let notifyMax;
  let messageMax;
  if (needN + needM <= budget) {
    const spare = budget - needN - needM;
    const k = NOTIFY_SHARE[share] / (NOTIFY_SHARE[share] + MESSAGE_SHARE[share]);
    notifyMax = Math.floor(needN + spare * k);
    messageMax = budget - notifyMax;
  } else {
    notifyMax = Math.floor(budget * needN / (needN + needM));
    messageMax = budget - notifyMax;
  }
  // A finished task or aim is never cut: it may use the reserve, and the message lane keeps
  // what is left of the free height (the lanes still never meet)
  const floor = Math.ceil(Math.max(0, notifyFloor || 0));
  if (floor > notifyMax) {
    notifyMax = Math.min(floor, free);
    messageMax = Math.max(0, Math.min(Math.max(messageMax, needM), free - notifyMax - LANE_GAP));
  }

  let nLeft;
  let nWidth;
  if (compact) {
    nLeft = SIDE_GUTTER;
    nWidth = vw - 2 * SIDE_GUTTER;
  } else {
    const clearLeft = Math.max(SIDE_GUTTER, leftPanelRight + SIDE_GUTTER);
    nWidth = Math.max(0, Math.min(notifyWidth, vw - DESKTOP_RIGHT - clearLeft));
    nLeft = vw - DESKTOP_RIGHT - nWidth;
  }
  const mWidth = Math.min(messageWidth, vw - 2 * SIDE_GUTTER);
  const mLeft = Math.round((vw - mWidth) / 2);
  return {
    notify: { top: notifyTop, left: Math.round(nLeft), width: Math.round(nWidth), maxHeight: notifyMax },
    message: { bottom: Math.round(vh - messageBottomY), left: mLeft, width: Math.round(mWidth), maxHeight: messageMax },
    world: { top: notifyTop + notifyMax, bottom: messageBottomY - messageMax }
  };
}

/**
 * Members of one lane, in order from the lane's anchored edge: each starts after the ones before
 * it (plus a gap, if they show) and may use only the height left. Heights are screen px; an empty
 * member (height 0) takes no gap.
 * @returns {Array<{offset:number, maxHeight:number}>}
 */
export function stackMembers(heights, laneMax, gap = LANE_GAP) {
  let used = 0;
  return heights.map((h) => {
    const offset = used;
    const maxHeight = Math.max(0, laneMax - used);
    const shown = Math.min(Math.max(0, h || 0), maxHeight);
    if (shown > 0) used += shown + gap;
    return { offset, maxHeight };
  });
}

/**
 * The arrow pointing from the player towards an off-screen speaker: one of eight compass points
 * ('n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'), or null when either position is unknown or they
 * are on the same spot. Screen y grows downwards.
 */
export function arrowDirection(from, to) {
  if (!from || !to) return null;
  const dx = Number(to.x) - Number(from.x);
  const dy = Number(to.y) - Number(from.y);
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || (Math.abs(dx) < 1 && Math.abs(dy) < 1)) return null;
  const deg = (Math.atan2(-dy, dx) * 180 / Math.PI + 360) % 360;   // 0 = east, counter-clockwise
  const points = ['e', 'ne', 'n', 'nw', 'w', 'sw', 's', 'se'];
  return points[Math.round(deg / 45) % 8];
}

// ---------------------------------------------------------------- browser side

function gcs(el) {
  const w = el?.ownerDocument?.defaultView || (typeof window !== 'undefined' ? window : null);
  return w && w.getComputedStyle ? w.getComputedStyle(el) : { zoom: '1', display: '', visibility: '', getPropertyValue: () => '' };
}

const TOP_BAR = ['.objectives-panel', '#music-widget-btn-anchor', '#toggle-buttons-container', '#scenario-timer-display'];
// The hearts sit inside #player-hud-buttons but outside its box (themed HUD), so they are measured
// on their own: without Block/Punch they are the dock's top (review R1 M6)
const DOCK = ['#inventory-container', '#player-hud-buttons', '#combat-buttons', '#health-ui-container'];
// The open phone (a wide screen): the notify lane keeps clear of its right edge (m06 F3, R1 M5)
const PHONE_FRAME = '[data-minigame="phone-chat"] .phone-messages-container';

function shownRect(el) {
  if (!el || !el.getBoundingClientRect) return null;
  const r = el.getBoundingClientRect();
  if (!r || r.width <= 0 || r.height <= 0) return null;
  const cs = gcs(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return null;
  return r;
}

function zoomOf(el) {
  const z = parseFloat(gcs(el).zoom);
  return Number.isFinite(z) && z > 0 ? z : 1;
}

/** Read the top bar and dock from the page. */
export function measureHud(doc = document, win = window) {
  const vw = win.innerWidth;
  const vh = win.innerHeight;
  const compact = isCompactViewport(vw, vh);
  let topBarBottom = 0;
  let leftPanelRight = 0;
  for (const sel of TOP_BAR) {
    const r = shownRect(doc.querySelector(sel));
    if (!r || r.top > vh / 2) continue;
    // Wide screens: the objectives panel is a column at the left, beside the notify lane, not above it
    if (!compact && sel === '.objectives-panel') { leftPanelRight = r.right; continue; }
    topBarBottom = Math.max(topBarBottom, r.bottom);
  }
  let dockTop = vh;
  for (const sel of DOCK) {
    const r = shownRect(doc.querySelector(sel));
    if (r && r.top > vh / 2) dockTop = Math.min(dockTop, r.top);
  }
  // A wide screen with the phone open: toasts and phone texts stay right of the phone, clear of
  // its header and unread badge (m06 F3); the lane's inline width replaced the CSS rule for it
  if (!compact) {
    const ph = shownRect(doc.querySelector(PHONE_FRAME));
    if (ph) leftPanelRight = Math.max(leftPanelRight, ph.right);
  }
  // Room for the objectives pill on a phone: up to 8 px short of the menu buttons
  let menuLeft = vw;
  for (const sel of ['#music-widget-btn-anchor', '#toggle-buttons-container']) {
    const r = shownRect(doc.querySelector(sel));
    if (r && r.top < vh / 2 && r.left > vw / 2) menuLeft = Math.min(menuLeft, r.left);
  }
  // The notify lane starts where it always did on a wide screen (86 px below the top, zoomed),
  // under the music and VM buttons even before they draw
  const z = parseFloat(gcs(doc.documentElement).getPropertyValue('--hud-zoom')) || 1;
  return { vw, vh, compact, topBarBottom, dockTop, leftPanelRight, notifyWidth: 600 * z, messageWidth: 720 * z,
    notifyTopMin: compact ? 0 : 78 * z, menuLeft };
}

function setPx(el, prop, screenPx) {
  el.style[prop] = `${Math.round(screenPx / zoomOf(el))}px`;
}

function heightOf(el) {
  const r = shownRect(el);
  return r ? r.height : 0;
}

/** A shown element's height with its bottom margin (toasts are spaced by margin), screen px. */
function outerHeightOf(el) {
  const h = heightOf(el);
  if (!h) return 0;
  const mb = parseFloat(gcs(el).marginBottom);
  return h + (Number.isFinite(mb) ? mb * zoomOf(el) : 0);
}

/**
 * How far (screen px) to lift the hearts so they never meet Block/Punch. Both are boxes
 * {left, top, right, bottom}; the lift is zero unless they overlap or sit closer than gap on
 * both axes, and then the hearts' bottom ends gap above the buttons' top.
 */
export function heartsLift(hearts, combat, gap = LANE_GAP) {
  if (!hearts || !combat) return 0;
  const near = hearts.left < combat.right + gap && combat.left < hearts.right + gap
    && hearts.top < combat.bottom + gap && combat.top < hearts.bottom + gap;
  return near ? Math.max(0, Math.round(hearts.bottom - (combat.top - gap))) : 0;
}

// On a narrow phone the hearts (fixed at the left, above the avatar) and Block/Punch (fixed at the
// right, above the strip) can reach each other (360 px wide: 4 px, 320 px: 44 px). The hearts rise
// above the buttons; CSS reads --hearts-lift only in its narrow-phone rule. Measured with the lift
// cleared so the answer does not depend on the last one.
function placeHearts(doc) {
  const el = doc.getElementById('health-ui-container');
  if (!el) return;
  const prev = el.style.getPropertyValue('--hearts-lift');
  if (prev) el.style.removeProperty('--hearts-lift');
  const h = shownRect(el);
  const c = shownRect(doc.getElementById('combat-buttons'));
  const lift = h && c ? heartsLift(h, c) : 0;
  if (lift > 0) el.style.setProperty('--hearts-lift', `${Math.round(lift / zoomOf(el))}px`);
}

/** Place the lane members for one measurement. Exposed for tests and the proof scripts. */
export function applyLanes(doc = document, win = window) {
  placeHearts(doc);
  const m = measureHud(doc, win);
  const toastsEl = doc.getElementById('notification-container');
  const phoneEl = doc.getElementById('npc-bark-container');
  const captionEl = doc.getElementById('hud-info-label');
  const speechEl = doc.getElementById('npc-speech-container');
  const contentOf = (el) => (el ? el.scrollHeight * zoomOf(el) : 0);
  const capOf = (el) => (el && el.classList.contains('visible') ? heightOf(el) : 0);
  const sum = (hs) => hs.filter(h => h > 0).reduce((a, h) => a + h + LANE_GAP, 0);
  // A member that has stepped aside counts at the height it had when it last showed. Classes
  // are only written when they change, so placing the lanes never sets off another placing.
  const yieldable = (el, h) => {
    if (!el) return { h: 0, was: false };
    const was = el.classList.contains('hud-lane-yield');
    if (!was && h > 0) el._laneH = h;
    return { h: was ? (el._laneH || 0) : h, was };
  };
  const visibleCap = !!captionEl?.classList.contains('visible');
  const cap = yieldable(captionEl, visibleCap ? capOf(captionEl) : 0);
  if (!visibleCap) cap.h = 0;
  // Phone texts step aside one at a time, oldest first (review R1 m1): each is measured on its own
  const texts = phoneEl ? Array.from(phoneEl.querySelectorAll('.npc-bark')).filter(el => !el._removing) : [];
  const textH = texts.map(el => yieldable(el, heightOf(el)).h);
  const clearAllEl = phoneEl?.querySelector('.npc-bark-clear-all');
  // Its height as last seen: CSS hides it while fewer than two texts show, and a height that
  // came and went with it would make the placing flip between two answers
  const seenClearAll = clearAllEl ? heightOf(clearAllEl) : 0;
  if (clearAllEl && seenClearAll > 0) clearAllEl._laneH = seenClearAll;
  const clearAllH = clearAllEl ? (seenClearAll || clearAllEl._laneH || 0) : 0;
  const phoneSum = (hidden) => {
    const shown = textH.slice(hidden).filter(h => h > 0);
    return sum(shown) + (shown.length >= 2 && clearAllH ? clearAllH + LANE_GAP : 0);
  };
  const toastH = contentOf(toastsEl);
  const speechH = contentOf(speechEl);
  m.notifyContent = sum([toastH, phoneSum(0)]);
  m.messageContent = sum([cap.h, speechH]);
  let lanes = computeLanes(m);
  // One at a time when space is short (H1 option A): see laneYields for the order
  const free = Math.max(0, (m.vh - lanes.message.bottom) - lanes.notify.top);
  const budget = Math.floor(free * laneBudgetShare(m));
  const y = laneYields({ caption: cap.h, speech: speechH, toasts: toastH, phone: textH, phoneExtra: clearAllH }, budget);
  if (captionEl && y.caption !== cap.was) captionEl.classList.toggle('hud-lane-yield', y.caption);
  // Hidden texts are the oldest y.phoneHidden (empty heights are not counted by laneYields)
  let toHide = y.phoneHidden;
  texts.forEach((el) => {
    const hide = toHide > 0;
    if (hide) toHide--;
    const was = el.classList.contains('hud-lane-yield');
    if (hide === was) return;
    el.classList.toggle('hud-lane-yield', hide);
    // The bark system pauses a hidden text's countdown and resumes it when it shows again
    try { el._onLaneYield?.(hide); } catch (e) { /* the bark closed meanwhile */ }
  });
  // The container itself no longer steps aside as a whole
  if (phoneEl?.classList.contains('hud-lane-yield')) phoneEl.classList.remove('hud-lane-yield');
  if (y.caption || y.phoneHidden) {
    m.notifyContent = sum([toastH, phoneSum(y.phoneHidden)]);
    m.messageContent = sum([y.caption ? 0 : cap.h, speechH]);
    lanes = computeLanes(m);
  }
  // A finished task or aim (a brief toast) is never cut (review R2 M4). The caption and texts
  // have stepped aside above; next the other toasts step aside, oldest first (their countdown
  // waits, notifications.js), and they stay aside while a brief line shows. Then the notify lane
  // gets the brief line's height whole (notifyFloor). With no brief line they all come back.
  const toastEls = toastsEl ? Array.from(toastsEl.querySelectorAll('.notification')).filter(el => !el._toast?.closing) : [];
  const yieldToast = (el, hide) => {
    if (el.classList.contains('hud-lane-yield') === hide) return;
    el.classList.toggle('hud-lane-yield', hide);
    try { el._onLaneYield?.(hide); } catch (e) { /* the toast closed meanwhile */ }
  };
  if (toastEls.some(el => el.classList.contains('brief'))) {
    let tH = toastH;
    for (const el of toastEls) {
      if (tH <= lanes.notify.maxHeight) break;
      if (el.classList.contains('brief') || el.classList.contains('hud-lane-yield')) continue;
      const oh = outerHeightOf(el);
      if (oh > 0) el._laneH = oh;
      tH = Math.max(0, tH - oh);
      yieldToast(el, true);
      m.notifyContent = sum([tH, phoneSum(y.phoneHidden)]);
      lanes = computeLanes(m);
    }
    if (tH > lanes.notify.maxHeight) {
      m.notifyFloor = tH;
      lanes = computeLanes(m);
    }
  } else {
    // With no brief line the toasts come back oldest first, each only when it fits whole next to
    // what shows (as texts do): until then it stays aside with its countdown paused, and shows
    // when the speech line or text that needed the room ends (review R3 m1). A toast with
    // nothing else to share the lanes with always comes back.
    let tH = toastH;
    for (const el of toastEls) {
      if (!el.classList.contains('hud-lane-yield')) continue;
      const back = el._laneH || 0;
      const others = phoneSum(y.phoneHidden) + m.messageContent;
      const fits = sum([tH + back, phoneSum(y.phoneHidden)]) + m.messageContent <= budget;
      if (!fits && (tH > 0 || others > 0)) break;
      yieldToast(el, false);
      tH += back;
      m.notifyContent = sum([tH, phoneSum(y.phoneHidden)]);
      lanes = computeLanes(m);
    }
  }
  // The objectives pill on a phone may use the width up to the menu buttons (review R1 M2)
  const pill = doc.querySelector('.objectives-panel');
  if (pill && m.compact) {
    const pr = shownRect(pill);
    if (pr && Number.isFinite(m.menuLeft) && m.menuLeft < m.vw) {
      const room = `${Math.max(120, Math.floor((m.menuLeft - 8 - pr.left) / zoomOf(pill)))}px`;
      if (doc.documentElement.style.getPropertyValue('--hud-pill-room') !== room) {
        doc.documentElement.style.setProperty('--hud-pill-room', room);
      }
    }
  }
  const body = doc.body;
  if (body) {
    body.classList.toggle('hud-compact', m.compact);
    body.dataset.hudLanes = 'on';
  }

  // Notify lane: toasts, then phone texts
  const toasts = doc.getElementById('notification-container');
  const phone = doc.getElementById('npc-bark-container');
  const n = lanes.notify;
  const nHeights = [toasts ? toasts.scrollHeight * zoomOf(toasts) : 0, 0];
  const nStack = stackMembers(nHeights, n.maxHeight);
  [toasts, phone].forEach((el, i) => {
    if (!el) return;
    el.style.position = 'fixed';
    setPx(el, 'top', n.top + nStack[i].offset);
    el.style.bottom = 'auto';
    el.style.right = 'auto';
    setPx(el, 'left', n.left);
    setPx(el, 'width', n.width);
    el.style.maxWidth = 'none';
    setPx(el, 'maxHeight', nStack[i].maxHeight);
    el.style.overflow = 'hidden';
    el.dataset.lane = 'notify';
  });
  if (phone) phone.style.flexDirection = 'column';

  // Message lane, from the dock upwards: the caption, then speech
  const caption = doc.getElementById('hud-info-label');
  const speech = doc.getElementById('npc-speech-container');
  const g = lanes.message;
  const capShown = caption && caption.classList.contains('visible') && !caption.classList.contains('hud-lane-yield') ? heightOf(caption) : 0;
  const mStack = stackMembers([capShown, 0], g.maxHeight);
  if (caption) {
    setPx(caption, 'bottom', g.bottom + mStack[0].offset);
    setPx(caption, 'maxHeight', mStack[0].maxHeight);
    caption.style.overflow = 'hidden';
    caption.dataset.lane = 'message';
  }
  if (speech) {
    speech.style.position = 'fixed';
    setPx(speech, 'bottom', g.bottom + mStack[1].offset);
    speech.style.top = 'auto';
    setPx(speech, 'left', g.left);
    setPx(speech, 'width', g.width);
    setPx(speech, 'maxHeight', mStack[1].maxHeight);
    speech.style.overflow = 'hidden';
    speech.dataset.lane = 'message';
  }
  win.__hudLanes = { measured: m, lanes };
  return { measured: m, lanes };
}

/**
 * Keep the lanes placed: on resize, whenever a member or an anchor changes size, and when HUD
 * pieces come and go (Block/Punch appear in a fight). Placement waits for the next frame and
 * runs once per frame at most.
 */
export function startHudLanes(doc = document, win = window) {
  if (win.__hudLanesStarted) return win.__hudLanesStarted;
  let queued = false;
  const relayout = () => {
    if (queued) return;
    queued = true;
    win.requestAnimationFrame(() => { queued = false; try { applyLanes(doc, win); } catch (e) { console.debug('[hud-lanes]', e); } });
  };
  win.addEventListener('resize', relayout);
  const ro = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(relayout) : null;
  const watched = new Set();
  const watch = () => {
    if (!ro) return;
    for (const sel of [...TOP_BAR, ...DOCK, '#notification-container', '#hud-info-label', '#npc-bark-container', '#npc-speech-container']) {
      const el = doc.querySelector(sel);
      if (el && !watched.has(el)) { watched.add(el); ro.observe(el); }
    }
  };
  // Pieces added later (the objectives panel, Block/Punch), caption show/hide, toasts in and out
  const attached = new Set();
  let mo = null;
  const attach = () => {
    const cap = doc.getElementById('hud-info-label');
    if (cap && !attached.has(cap)) { attached.add(cap); mo.observe(cap, { attributes: true, attributeFilter: ['class'] }); }
    const toasts = doc.getElementById('notification-container');
    if (toasts && !attached.has(toasts)) { attached.add(toasts); mo.observe(toasts, { childList: true }); }
  };
  mo = new win.MutationObserver(() => { watch(); attach(); relayout(); });
  mo.observe(doc.body, { childList: true });
  watch();
  attach();
  relayout();
  win.__hudLanesStarted = { relayout, stop: () => { ro?.disconnect(); mo.disconnect(); win.removeEventListener('resize', relayout); win.__hudLanesStarted = null; } };
  win.hudLanesRelayout = relayout;
  return win.__hudLanesStarted;
}
