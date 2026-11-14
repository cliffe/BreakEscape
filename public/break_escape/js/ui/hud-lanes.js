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
// Shares of the free height between the top bar and the dock. The rest stays world view.
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
 */
export function barkSource({ npcType = null, channel = null, hasClickHandler = false } = {}) {
  if (channel === 'phone' || channel === 'speech') return channel;
  if (npcType === 'phone') return 'phone';
  if (hasClickHandler) return 'phone';
  if (npcType === 'person') return 'speech';
  return 'phone';
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
 * @returns {{ notify: {top,left,width,maxHeight}, message: {bottom,left,width,maxHeight}, world: {top,bottom} }}
 */
export function computeLanes({ vw, vh, compact, topBarBottom = 0, dockTop = null, leftPanelRight = 0,
  notifyWidth = 600, messageWidth = 720, notifyTopMin = 0 } = {}) {
  const dock = Number.isFinite(dockTop) ? Math.min(dockTop, vh) : vh;
  const notifyTop = Math.round(Math.max(topBarBottom, notifyTopMin) + LANE_GAP);
  const messageBottomY = Math.round(dock - LANE_GAP);            // the lane's lower edge, as a y
  const free = Math.max(0, messageBottomY - notifyTop);
  const share = compact ? 'compact' : 'wide';
  const notifyMax = Math.floor(free * NOTIFY_SHARE[share]);
  const messageMax = Math.floor(free * MESSAGE_SHARE[share]);

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
const DOCK = ['#inventory-container', '#player-hud-buttons', '#combat-buttons'];

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
  // The notify lane starts where it always did on a wide screen (86 px below the top, zoomed),
  // under the music and VM buttons even before they draw
  const z = parseFloat(gcs(doc.documentElement).getPropertyValue('--hud-zoom')) || 1;
  return { vw, vh, compact, topBarBottom, dockTop, leftPanelRight, notifyWidth: 600 * z, messageWidth: 720 * z,
    notifyTopMin: compact ? 0 : 78 * z };
}

function setPx(el, prop, screenPx) {
  el.style[prop] = `${Math.round(screenPx / zoomOf(el))}px`;
}

function heightOf(el) {
  const r = shownRect(el);
  return r ? r.height : 0;
}

/** Place the lane members for one measurement. Exposed for tests and the proof scripts. */
export function applyLanes(doc = document, win = window) {
  const m = measureHud(doc, win);
  const lanes = computeLanes(m);
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
  const capShown = caption && caption.classList.contains('visible') ? heightOf(caption) : 0;
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
