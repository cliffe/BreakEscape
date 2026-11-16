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
 * The incoming-call banner (#phone-ring-layer) is a fixed top-centre strip, above minigames. While
 * a minigame is open it must never cover a control the player needs (a key, a button, an input, the
 * PIN entry display, a title or the close X): ringLayerSpot tries the bottom of the screen, the
 * spot below the minigame's frame, the right-hand end of the notify lane, and only when none is
 * clear the top centre (a covered title costs less than a covered key). It also keeps off the
 * toasts showing in the notify lane (UI backlog item 5d, review R1 M1 and m2).
 *
 * Pure parts (computeLanes, stackMembers, ringLayerSpot, barkSource, arrowDirection, isCompactViewport) are
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
 * Where the incoming-call banner goes while a minigame is open (UI backlog 5d, review R1 M1).
 * `titles` and `controls` are the boxes of the minigame's headings and of everything the player
 * can press or must read (buttons, inputs, the PIN display). Toasts are not obstacles: the banner
 * is placed first and the toasts keep clear of it (toastSpot), so the two never chase each other.
 * Spots, tried in order, the first that touches none of them wins:
 *   1. bottom   the bottom centre (where the tutorial step panel's banner sits, phone-ring.css)
 *   1. bottom   then the bottom right
 *   2. below    just under the minigame's frame (`frame`), kept inside the viewport
 *   3. lane     the right-hand end of the notify lane
 * With none clear, the top centre where it always sat: a covered title costs less than a covered key.
 * With no minigame boxes at all it stays top centre. Boxes are grown by `margin` (default 4px).
 * @param {{vw:number, vh:number, size:{width:number,height:number},
 *          titles?:Array<{left,top,right,bottom}>, controls?:Array<{left,top,right,bottom}>,
 *          frame?:{left,top,right,bottom}|null,
 *          lane?:{top:number,left:number,width:number}, top?:number, edge?:number, margin?:number}} a
 * @returns {{name:'default'|'bottom'|'below'|'lane', top:number, left:number}}
 */
export function ringLayerSpot({ vw, vh = 0, size, titles = [], controls = [], frame = null, lane,
  top = 12, edge = SIDE_GUTTER, margin = 4 } = {}) {
  const w = Math.max(0, size?.width || 0);
  const h = Math.max(0, size?.height || 0);
  const centre = Math.round((vw - w) / 2);
  const blockers = [...titles, ...controls];
  if (!blockers.length) return { name: 'default', top, left: centre };
  const hits = (l, tp) => blockers.some(r => l < r.right + margin && r.left < l + w + margin && tp < r.bottom + margin && r.top < tp + h + margin);
  const tryAt = (name, l, tp) => (hits(l, tp) ? null : { name, top: tp, left: l });
  const fit = (y) => Math.round(vh > 0 ? Math.max(0, Math.min(y, vh - h - edge)) : y);
  const bottom = fit(vh - h - edge);
  const right = Math.round(Math.max(0, vw - w - edge));
  const spots = [tryAt('bottom', centre, bottom), tryAt('bottom', right, bottom)];
  if (frame) spots.push(tryAt('below', centre, fit(frame.bottom + margin + 4)));
  if (lane) {
    const laneLeft = Math.round(Math.max(lane.left, lane.left + lane.width - w));
    spots.push(tryAt('lane', laneLeft, lane.top));
  }
  return spots.find(Boolean) || { name: 'default', top, left: centre };
}

// ------------------------------------------------------------ toasts over an open panel

export const TOAST_SPOT_MARGIN = 4;     // px kept round every blocker
export const TOAST_SPOT_STEP = 8;       // px between the tops tried
export const TOAST_SPOT_EDGE = 8;       // px kept from the viewport's top and bottom
export const TOAST_SPOT_WIDTHS = [480, 360, 240];   // narrower widths tried, times the HUD zoom
export const PANEL_THROTTLE_MS = 100;   // changes inside an open panel re-place at most this often

const overlaps = (l, t, w, h, m) => (r) => l < r.right + m && r.left < l + w + m && t < r.bottom + m && r.top < t + h + m;
const areaOver = (l, t, w, h, r) => Math.max(0, Math.min(l + w, r.right) - Math.max(l, r.left))
  * Math.max(0, Math.min(t + h, r.bottom) - Math.max(t, r.top));

/** Controls that are not inside another control's box (a table row and its cells count once). */
export function outermostBoxes(boxes) {
  return boxes.filter((a, i) => !boxes.some((b, j) => j !== i && b.left <= a.left && b.top <= a.top
    && b.right >= a.right && b.bottom >= a.bottom
    && (b.left < a.left || b.top < a.top || b.right > a.right || b.bottom > a.bottom || j < i)));
}

/**
 * Where the notify lane's toast block goes while a panel (a minigame or a workstation popup) is
 * open. Pure; every number is screen px.
 *
 * Blockers: `titles` (headings and the close X), `xs` (the close X on its own), `controls` (boxes;
 * those with `listRow: true` are rows in a scrolling list and are not avoided), `canvases` (play
 * canvases) and `banner` (the incoming-call banner, or null).
 *   1. the lane, at the lane width, when clear (checked first, so a block that moved comes back)
 *   2. `current`, the block's place now when it is away from the lane, if still clear (no jitter)
 *   3. the nearest clear place: sides right-aligned to the lane, centred, the 16 px left gutter;
 *      on each side the lane width then 480, 360 and 240 times `z` (not wider than the lane); for
 *      each width the tops in 8 px steps, nearest to the lane top first
 *   4. the fallback rungs, over the same places with the lane first; the X and the banner are
 *      never covered: (1) cover a title, (2) the fewest canvas pixels, (3) the fewest outermost
 *      controls (title-free wins a tie), (4) nothing fits whole: the lane column, top just under
 *      any X or banner in it, cut at the viewport bottom
 * `heightAt(w)` is the block's height at width `w`. With `clearOnly` the fallback is not tried and
 * null means no clear place.
 * @returns {{name:'lane'|'current'|'moved'|'fallback', rung:number, side:string, left:number,
 *   top:number, width:number, height:number, maxHeight:number|null, covers?:object}|null}
 */
export function toastSpot({ vw, vh, lane, z = 1, heightAt, titles = [], xs = [], controls = [], canvases = [],
  banner = null, current = null, margin = TOAST_SPOT_MARGIN, step = TOAST_SPOT_STEP, edge = TOAST_SPOT_EDGE,
  gutter = SIDE_GUTTER, clearOnly = false } = {}) {
  const heights = new Map();
  const hAt = (w) => {
    if (!heights.has(w)) { const h = Number(heightAt?.(w)); heights.set(w, Number.isFinite(h) && h > 0 ? Math.ceil(h) : 0); }
    return heights.get(w);
  };
  const ctl = controls.filter(c => !c.listRow);
  const hard = [...xs, ...(banner ? [banner] : [])];
  const fits = (p) => p.left >= 0 && p.left + p.width <= vw && p.top >= edge && p.top + p.height <= vh - edge;
  const clearOf = (p, list) => !list.some(overlaps(p.left, p.top, p.width, p.height, margin));
  const allBlockers = [...titles, ...hard, ...ctl, ...canvases];
  const spot = (name, rung, side, left, top, width, extra = {}) => ({ name, rung, side, left: Math.round(left),
    top: Math.round(top), width, height: hAt(width), maxHeight: null, ...extra });

  const laneW = Math.round(lane.width);
  const laneP = spot('lane', 0, 'lane', lane.left, lane.top, laneW);
  if (laneP.height && fits(laneP) && clearOf(laneP, allBlockers)) return laneP;
  if (current && Number.isFinite(current.top) && Number.isFinite(current.left) && current.width > 0) {
    const cw = Math.round(current.width);
    const cur = spot('current', 0, current.side || 'current', current.left, current.top, cw);
    if (cur.height && fits(cur) && clearOf(cur, allBlockers)) return cur;
  }
  const widths = [laneW];
  for (const base of TOAST_SPOT_WIDTHS) {
    const w = Math.round(base * z);
    if (w <= laneW && !widths.includes(w)) widths.push(w);
  }
  const sides = [['lane-side', w => lane.left + lane.width - w], ['centre', w => (vw - w) / 2], ['left', () => gutter]];
  // Every place in search order, lazily (a clear one usually turns up early)
  function* places() {
    for (const [side, xf] of sides) {
      for (const w of widths) {
        const h = hAt(w);
        if (!h) continue;
        const left = Math.round(xf(w));
        if (left < 0 || left + w > vw) continue;
        const tops = [];
        for (let t = edge; t + h <= vh - edge; t += step) tops.push(t);
        tops.sort((a, b) => Math.abs(a - lane.top) - Math.abs(b - lane.top) || a - b);
        for (const t of tops) yield spot('moved', 0, side, left, t, w);
      }
    }
  }
  for (const p of places()) if (clearOf(p, allBlockers)) return p;
  if (clearOnly) return null;

  // Fallback (2.4): the lane first, then the same places; the X and the banner are hard in every rung
  const all = [laneP, ...places()].filter(p => p.height && fits(p));
  const titleHit = (p) => titles.some(overlaps(p.left, p.top, p.width, p.height, margin));
  const r1 = all.find(p => clearOf(p, [...hard, ...ctl, ...canvases]));
  if (r1) return { ...r1, name: 'fallback', rung: 1, covers: { titles: titles.filter(overlaps(r1.left, r1.top, r1.width, r1.height, margin)).length } };
  if (canvases.length) {
    let best = null;
    for (const p of all) {
      if (!clearOf(p, [...hard, ...ctl])) continue;
      const px = canvases.reduce((a, k) => a + areaOver(p.left, p.top, p.width, p.height, k), 0);
      if (!best || px < best.px) best = { p, px };
    }
    if (best) return { ...best.p, name: 'fallback', rung: 2, covers: { canvasPx: best.px, titles: titleHit(best.p) ? 1 : 0 } };
  }
  const outer = outermostBoxes(ctl);
  let best3 = null;
  all.forEach((p, i) => {
    if (!clearOf(p, hard)) return;
    const n = outer.filter(overlaps(p.left, p.top, p.width, p.height, margin)).length;
    const tt = titleHit(p) ? 1 : 0;
    if (!best3 || n < best3.n || (n === best3.n && tt < best3.tt)) best3 = { p, n, tt, i };
  });
  if (best3) return { ...best3.p, name: 'fallback', rung: 3, covers: { controls: best3.n, titles: best3.tt } };
  // Nothing fits whole: the lane column, starting under any X or banner in it, cut at the bottom
  let top = lane.top;
  for (const r of hard) {
    if (lane.left < r.right + margin && r.left < lane.left + laneW + margin && r.top < vh - edge) {
      top = Math.max(top, Math.ceil(r.bottom + margin));
    }
  }
  if (top > vh - edge - step) top = lane.top;
  return { ...laneP, name: 'fallback', rung: 4, top: Math.round(top), maxHeight: Math.max(0, Math.round(vh - edge - top)) };
}

export const TOAST_WARNING_FLOOR_MS = 1500;   // TOAST_STAGGER_MS in notifications.js
export const TOAST_ERROR_FLOOR_MS = 5000;     // ERROR_TOAST_MIN_MS in notifications.js
export const TOAST_WARNING_WAIT_MS = 5000;    // a warning behind errors waits no longer than this

/**
 * The answer for each toast waiting to show over a panel (warnings and errors). Pure.
 * @param {object} a
 *   block    the toasts showing now, in container order: [{el, type, shownAt, duration}]
 *            (closing ones left out by the caller)
 *   pending  the toasts waiting, in arrival order: [{el, type, arrivedAt}]
 *   now      Date.now()
 *   spotFor  (toasts) => truthy when the block made of these toasts has a clear place
 *   panelOpen  false: every answer is 'stack'
 * @returns {Array<{el, answer:'stack'|'wait'|object}>} queue order (errors first, then warnings);
 *   an element answer means "replace that toast at its floor"
 */
export function pendingAnswers({ block = [], pending = [], now = Date.now(), spotFor = () => true, panelOpen = true } = {}) {
  const errorsFirst = [...pending.filter(p => p.type === 'error'), ...pending.filter(p => p.type !== 'error')];
  if (!panelOpen) return errorsFirst.map(p => ({ el: p.el, answer: 'stack' }));
  const stacked = [];
  const targeted = new Set();
  const out = [];
  const byShown = (a, b) => (a.shownAt || 0) - (b.shownAt || 0);
  for (const p of errorsFirst) {
    let answer;
    const shownNow = [...block, ...stacked];
    if (spotFor([...shownNow, p])) answer = 'stack';
    else {
      const errors = shownNow.filter(t => t.type === 'error');
      if (p.type === 'error') {
        if (errors.length === 0) {
          const warn = block.filter(t => t.type === 'warning').sort(byShown)[0];
          answer = warn ? warn.el : 'stack';
        } else if (errors.length === 1) {
          answer = 'stack';
        } else {
          const target = block.filter(t => t.type === 'error' && t.duration > 0 && !targeted.has(t.el)).sort(byShown)[0];
          if (target) { targeted.add(target.el); answer = target.el; } else answer = 'wait';
        }
      } else {
        const warn = shownNow.filter(t => t.type === 'warning' && !targeted.has(t.el)).sort(byShown)[0];
        if (warn) { targeted.add(warn.el); answer = warn.el; }
        else if (errors.length) {
          const oldest = Math.min(...errors.map(t => (Number.isFinite(t.shownAt) ? t.shownAt : now)));
          answer = (now - oldest >= TOAST_ERROR_FLOOR_MS || now - (p.arrivedAt ?? now) >= TOAST_WARNING_WAIT_MS) ? 'stack' : 'wait';
        } else answer = 'stack';
      }
    }
    if (answer === 'stack') stacked.push({ el: p.el, type: p.type, shownAt: now, duration: p.duration });
    out.push({ el: p.el, answer });
  }
  return out;
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

// The headings of an open minigame the incoming-call banner keeps clear of (item 5d): the console
// window's title bar, the framework header (hidden in a console, so not measured then), a
// scene's own title line (the PIN pad's "Enter PIN: ...") and the close X beside them.
const MINIGAME_TITLES = ['.console-titlebar', '.minigame-header', '[class*="minigame-title"]', '.minigame-close-button'];
// What the player presses or reads inside an open minigame or console window (review R1 M1)
const MINIGAME_CONTROLS = ['button', 'input', 'textarea', 'select', 'a[href]', '[role="button"]', '[onclick]',
  '[tabindex]:not([tabindex="-1"])', '.pin-minigame-display'];

function boxOf(r) { return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; }

// The pointer-cursor scan, cached per element (toast plan 2.8): `cursor` is { map: WeakMap,
// dirty: null | Node[] }; null re-reads everything, otherwise only elements inside a node named
// in the panel's mutation records are read again. Without a cache every element is read.
function pointerCursor(el, cursor) {
  if (!cursor) return gcs(el).cursor === 'pointer';
  const d = cursor.dirty;
  if (d === null || !cursor.map.has(el) || d.some(n => n === el || n.contains?.(el))) {
    cursor.map.set(el, gcs(el).cursor === 'pointer');
  }
  return cursor.map.get(el);
}

// The workstation popups (CyberChef, lab sheets) are plain DOM outside any .minigame-container
const POPUP_ROOTS = ['#laptop-popup', '#lab-popup'];
// A scrolling list counts as one only while its scroller is under this share of the frame's height
export const LIST_FRAME_SHARE = 0.6;

function scrollsY(el) {
  return /(auto|scroll)/.test(gcs(el).overflowY || '') && el.scrollHeight > el.clientHeight + 1;
}

/**
 * A control that is a row in a scrolling list (toasts may cover those, 2.2 of the toast plan):
 * its nearest scrolling ancestor is inside the panel and is not the panel root, the frame or an
 * ancestor of the frame; that scroller is under LIST_FRAME_SHARE of the frame's height; and the
 * control, or an ancestor of it below the scroller, is one of at least 3 siblings with the same
 * tag and class.
 */
function isListRow(el, root, frameEl, frameH) {
  let sc = null;
  for (let q = el.parentElement; q && q !== root.parentElement; q = q.parentElement) {
    if (scrollsY(q)) { sc = q; break; }
  }
  if (!sc || sc === root || sc === frameEl || (frameEl && sc.contains(frameEl))) return false;
  if (!(frameH > 0) || sc.clientHeight >= LIST_FRAME_SHARE * frameH) return false;
  for (let n = el; n && n !== sc; n = n.parentElement) {
    const par = n.parentElement;
    if (!par) break;
    let k = 0;
    for (const c of par.children) if (c.tagName === n.tagName && c.className === n.className && ++k >= 3) return true;
  }
  return false;
}

/**
 * The boxes in the open minigame(s) and the shown workstation popup: headings (`titles`, the close
 * X among them), the close X on its own (`xs`), controls (the listed selectors plus anything with
 * a pointer cursor; each box carries `listRow`, see isListRow), play `canvases` (not the
 * conversation portrait) and the frame to place a banner under. Shown elements only; an element
 * over half the screen (a clickable backdrop) is no control.
 */
export function measureMinigame(doc, win, cursor = null) {
  const titles = [];
  const xs = [];
  const controls = [];
  const canvases = [];
  let frame = null;
  const area = (win.innerWidth || 0) * (win.innerHeight || 0);
  const grow = (fr) => {
    frame = frame ? { left: Math.min(frame.left, fr.left), top: Math.min(frame.top, fr.top), right: Math.max(frame.right, fr.right), bottom: Math.max(frame.bottom, fr.bottom) } : boxOf(fr);
  };
  for (const mg of doc.querySelectorAll('.minigame-container')) {
    if (!shownRect(mg)) continue;
    for (const sel of MINIGAME_TITLES) {
      for (const t of mg.querySelectorAll(sel)) {
        const r = shownRect(t);
        if (!r) continue;
        titles.push(boxOf(r));
        if (sel === '.minigame-close-button') xs.push(boxOf(r));
      }
    }
    const anchor = win.MinigameFramework?.currentMinigame?.closeAnchor?.();
    const frameEl = anchor && mg.contains(anchor) ? anchor : mg.querySelector('.minigame-game-container');
    const fr = shownRect(frameEl);
    const frameH = fr ? fr.height : (shownRect(mg)?.height || 0);
    const seen = new Set();
    const add = (el) => {
      if (seen.has(el) || el.closest?.('#phone-ring-layer')) return;
      seen.add(el);
      const r = shownRect(el);
      if (r && (!area || r.width * r.height <= area / 2)) controls.push({ ...boxOf(r), listRow: isListRow(el, mg, frameEl, frameH) });
    };
    mg.querySelectorAll(MINIGAME_CONTROLS.join(', ')).forEach(add);
    mg.querySelectorAll('*').forEach((el) => { if (!seen.has(el) && pointerCursor(el, cursor)) add(el); });
    for (const c of mg.querySelectorAll('canvas')) {
      if (c.classList.contains('person-chat-portrait')) continue;
      const r = shownRect(c);
      if (r) canvases.push(boxOf(r));
    }
    if (fr) grow(fr);
  }
  for (const sel of POPUP_ROOTS) {
    const pop = doc.querySelector(sel);
    if (!pop || !shownRect(pop)) continue;
    for (const t of pop.querySelectorAll('.title-bar')) { const r = shownRect(t); if (r) titles.push(boxOf(r)); }
    for (const x of pop.querySelectorAll('.minigame-close-button')) {
      const r = shownRect(x);
      if (r) { titles.push(boxOf(r)); xs.push(boxOf(r)); }
    }
    const fr = shownRect(pop.querySelector('.laptop-screen'));
    if (fr) grow(fr);
  }
  return { titles, xs, controls, canvases, frame };
}

function placeRingLayer(doc, win, lanes, measure) {
  const layer = doc.getElementById('phone-ring-layer');
  if (!layer) return null;
  const clear = () => { for (const k of ['top', 'left', 'transform']) if (layer.style[k]) layer.style[k] = ''; };
  // Only a banner over a minigame needs placing; the tutorial step panel has its own spot (CSS)
  if (!shownRect(layer.querySelector('.incoming-call')) || layer.classList.contains('under-tutorial')) { clear(); return null; }
  const mg = measure();
  clear();                                   // measure the banner where the CSS puts it
  const box = layer.getBoundingClientRect();
  const spot = ringLayerSpot({ vw: win.innerWidth, vh: win.innerHeight, size: { width: box.width, height: box.height },
    titles: mg.titles, controls: mg.controls, frame: mg.frame, lane: lanes.notify });
  // The banner's box once placed, for the toasts to keep clear of
  spot.box = spot.name === 'default' ? boxOf(box)
    : { left: spot.left, top: spot.top, right: spot.left + box.width, bottom: spot.top + box.height };
  if (spot.name === 'default') return spot;
  layer.style.transform = 'none';
  setPx(layer, 'top', spot.top);
  setPx(layer, 'left', spot.left);
  return spot;
}

// ------------------------------------------------- the toast block over an open panel

/** A minigame (not ending) or a workstation popup is open: overlay-open.js fullScreenPanelOpen. */
function panelOpenIn(doc, win) {
  const m = win.MinigameFramework?.currentMinigame;
  if (m && !m._ending) return true;
  return POPUP_ROOTS.some((sel) => {
    const el = doc.querySelector(sel);
    return !!el && !!el.style && el.style.display !== '' && el.style.display !== 'none';
  });
}

function phoneOpenIn(doc) {
  return !!shownRect(doc.querySelector('[data-minigame="phone-chat"]'));
}

/**
 * An element's height (screen px) laid out at screen width `w`: a clone inside a hidden host
 * with the zoom `z` of the element's container, so the answer is in screen px as the boxes are.
 * The host goes on `body`, never inside a lane container (it would add to the lane sums).
 */
const MEASURE_HOST_ATTR = 'data-hud-measure';
const isMeasureHost = (n) => n?.nodeType === 1 && n.hasAttribute?.(MEASURE_HOST_ATTR);

function cloneHeightAt(doc, el, w, z, { keepId = false, fontFrom = null } = {}) {
  const body = doc.body;
  if (!body?.appendChild) return 0;
  const host = doc.createElement('div');
  host.style.cssText = 'position: fixed; left: -9000px; top: 0; visibility: hidden; pointer-events: none;';
  host.style.zoom = String(z);
  host.setAttribute(MEASURE_HOST_ATTR, '1');   // the lanes' own body observer ignores it
  if (fontFrom) {
    const cs = gcs(fontFrom);
    for (const k of ['fontFamily', 'fontSize', 'lineHeight', 'letterSpacing']) if (cs[k]) host.style[k] = cs[k];
  }
  const c = el.cloneNode(true);
  if (!keepId) c.removeAttribute?.('id');
  c.classList.remove('toast-pending', 'hud-lane-yield');
  if (c.classList.contains('notification')) c.classList.add('show', 'placed-over-panel');
  Object.assign(c.style, { position: 'static', transform: 'none', transition: 'none', boxSizing: 'border-box',
    width: `${w / z}px`, maxHeight: 'none', top: 'auto', left: 'auto' });
  host.appendChild(c);
  body.appendChild(host);
  try { return Math.ceil(c.getBoundingClientRect().height || 0); } finally { host.remove(); }
}

/** A toast's height at screen width `w`, cached on the toast by width and zoom (its text never changes). */
function toastHeightAt(doc, t, w, z, container) {
  const key = `${w}@${z}@${doc.body?.classList.contains('hud-compact') ? 'c' : 'w'}`;   // compact padding differs
  if (!t._hudLaneH) t._hudLaneH = new Map();
  if (!t._hudLaneH.has(key)) t._hudLaneH.set(key, cloneHeightAt(doc, t, w, z, { fontFrom: container }));
  return t._hudLaneH.get(key);
}

function clearBlockPlacing(el) {
  for (const k of ['top', 'left', 'right', 'bottom', 'width', 'maxHeight']) if (el.style[k]) el.style[k] = '';
}

/**
 * The notify lane's toasts while a panel is open (toast plan 2.3 to 2.6): one block (the toast
 * container, and the phone-text container under it over the phone) placed by toastSpot, the
 * class `placed-over-panel` on each toast in it while it is away from the lane, and an answer
 * (pendingAnswers) for every toast waiting with `toast-pending`. Runs after the banner is
 * placed. `prev` is the last pass's { away, spot }. Returns the new { away, spot }.
 */
function placeNotifyBlock(doc, win, lanes, measure, prev, ringSpot) {
  const el = doc.getElementById('notification-container');
  if (!el) return { away: false, spot: null };
  const n = lanes.notify;
  const phoneEl = doc.getElementById('npc-bark-container');
  const toLane = (members) => {
    for (const m of members) {
      if (!m) continue;
      if (prev.away) { setPx(m, 'top', n.top); setPx(m, 'left', n.left); setPx(m, 'width', n.width); m.style.maxHeight = 'none'; }
    }
  };
  const setClass = (on) => {
    for (const t of el.querySelectorAll('.notification')) {
      const want = on.has(t);
      if (t.classList.contains('placed-over-panel') !== want) t.classList.toggle('placed-over-panel', want);
    }
  };
  const answerAll = (answers) => {
    for (const { el: t, answer } of answers) {
      try { t._onReplace?.(answer); } catch (e) { /* the toast went meanwhile */ }
    }
  };
  try {
    const all = Array.from(el.querySelectorAll('.notification'));
    const shownEls = all.filter(t => !t.classList.contains('toast-pending') && !t._toast?.closing && !t.classList.contains('hud-lane-yield'));
    const pendingEls = all.filter(t => t.classList.contains('toast-pending') && !t._toast?.closing);
    const panelOpen = panelOpenIn(doc, win);
    const phoneOpen = panelOpen && phoneOpenIn(doc) && !!phoneEl;
    const z = zoomOf(el);
    const gapOf = (t) => { const mb = parseFloat(gcs(t).marginBottom); return (Number.isFinite(mb) ? mb : 10) * z; };
    const texts = phoneOpen ? Array.from(phoneEl.querySelectorAll('.npc-bark')).filter(b => !b._removing && !b.classList.contains('hud-lane-yield')) : [];
    // Kept on the phone container across passes: keyed by width, zoom and compact flag, and dropped
    // when what the clone renders changes (review R1 M1). The clone copies every child, so the
    // signature reads every child: its text, whether it is leaving or stepped aside, whether its
    // headshot is showing (unhidden on image load, no text change), and the clear-all button.
    const phoneSig = phoneEl
      ? Array.from(phoneEl.children).map(b => [b.textContent, b._removing ? 'r' : '', b.classList.contains('hud-lane-yield') ? 'y' : '',
        b.querySelector?.('.npc-bark-head')?.hidden === false ? 'h' : '', b.style?.display || ''].join('\u0002')).join('\u0001')
        + `|${doc.body?.classList.contains('hud-compact') ? 'c' : 'w'}`
      : '';
    if (phoneEl && phoneEl._hudLaneSig !== phoneSig) { phoneEl._hudLaneSig = phoneSig; phoneEl._hudLaneH = new Map(); }
    const phoneH = (w) => {
      if (!texts.length) return 0;
      const cache = phoneEl._hudLaneH || (phoneEl._hudLaneH = new Map());
      const key = `${w}@${zoomOf(phoneEl)}`;
      if (!cache.has(key)) {
        if (cache.size >= 8) cache.clear();   // a window drag adds a width per frame (R2 n2)
        cache.set(key, cloneHeightAt(doc, phoneEl, w, zoomOf(phoneEl), { keepId: true, fontFrom: phoneEl }));
      }
      return cache.get(key);
    };
    // The toasts' part: heights plus one gap between each pair; the phone texts start one gap below
    const toastsPart = (list, w) => list.reduce((h, t, i) => h + toastHeightAt(doc, t, w, z, el) + (i ? gapOf(t) : 0), 0);
    const heightFor = (list) => (w) => {
      const tp = toastsPart(list, w);
      const ph = phoneH(w);
      return ph ? tp + (list.length ? gapOf(list[list.length - 1]) : 0) + ph : tp;
    };
    const mg = panelOpen ? measure() : null;
    const banner = ringSpot?.box && shownRect(doc.querySelector('#phone-ring-layer .incoming-call')) ? ringSpot.box : null;
    const spotArgs = mg ? { vw: win.innerWidth, vh: win.innerHeight, lane: n, z, titles: mg.titles, xs: mg.xs,
      controls: mg.controls, canvases: mg.canvases, banner } : null;
    const info = (t) => ({ el: t, type: t._toast?.type, shownAt: t._toast?.shownAt, arrivedAt: t._toast?.arrivedAt, duration: t._toast?.duration });
    const answers = pendingAnswers({ block: shownEls.map(info), pending: pendingEls.map(info), now: Date.now(), panelOpen,
      spotFor: (list) => !!toastSpot({ ...spotArgs, heightAt: heightFor(list.map(x => x.el)), clearOnly: true }) });
    // Two warnings shown over the panel with no clear place for both (a panel opened over
    // them): the older goes once it has been up 1.5 s, the warning rule of plan 2.5
    // A pass where the condition no longer holds (the panel closed, room appeared) cancels it.
    const warns = shownEls.filter(t => t._toast?.type === 'warning');
    const superseded = new Set();
    if (spotArgs && warns.length > 1 && !toastSpot({ ...spotArgs, heightAt: heightFor(shownEls), clearOnly: true })) {
      const newest = warns.reduce((a, b) => ((b._toast.shownAt || 0) >= (a._toast.shownAt || 0) ? b : a));
      for (const t of warns) if (t !== newest) superseded.add(t);
    }
    // Every warning that is not waiting hears it, including one that stepped aside (hud-lane-yield)
    // and so is in neither list, or its timer runs on after the panel closes (R2 m1)
    for (const t of all) {
      if (t._toast?.type !== 'warning' || t._toast.pending || t._toast.closing) continue;
      try { t._onSupersede?.(superseded.has(t)); } catch (e) { /* gone */ }
    }
    const stacked = new Set(answers.filter(a => a.answer === 'stack').map(a => a.el));
    const blockEls = all.filter(t => shownEls.includes(t) || stacked.has(t));
    let res = { away: false, spot: null };
    let placed = false;
    if (panelOpen && (blockEls.length || texts.length)) {
      const spot = toastSpot({ ...spotArgs, heightAt: heightFor(blockEls), current: prev.away ? prev.spot : null });
      if (spot && spot.name !== 'lane') {
        setPx(el, 'top', spot.top);
        setPx(el, 'left', spot.left);
        setPx(el, 'width', spot.width);
        if (spot.maxHeight != null) setPx(el, 'maxHeight', spot.maxHeight); else el.style.maxHeight = 'none';
        if (phoneOpen) {
          const below = blockEls.length ? toastsPart(blockEls, spot.width) + gapOf(blockEls[blockEls.length - 1]) : 0;
          setPx(phoneEl, 'top', spot.top + below);
          setPx(phoneEl, 'left', spot.left);
          setPx(phoneEl, 'width', spot.width);
          phoneEl.style.maxHeight = 'none';
        }
        setClass(new Set(blockEls));
        // A fallback place that is the lane's own box is still the lane: the sums keep counting it (R1 n1)
        const atLane = Math.round(spot.left) === Math.round(n.left) && Math.round(spot.top) === Math.round(n.top) && Math.round(spot.width) === Math.round(n.width);
        res = { away: !atLane, spot };
        placed = true;
      } else res.spot = spot;
    }
    if (!placed) { toLane([el, phoneEl]); setClass(new Set()); }
    answerAll(answers);
    return res;
  } catch (e) {
    // Fail open: the block goes back to the lane and every waiting toast shows (2.6 item 8)
    try { toLane([el, phoneEl]); setClass(new Set()); } catch (e2) { /* nothing more to do */ }
    for (const t of el.querySelectorAll('.notification')) { try { t._onSupersede?.(false); } catch (e3) { /* gone */ } }
    answerAll(Array.from(el.querySelectorAll('.notification.toast-pending')).map(t => ({ el: t, answer: 'stack' })));
    console.debug('[hud-lanes] toast block', e);
    return { away: false, spot: null };
  }
}

/**
 * The relayout itself failed (rAF catch, 2.6 item 8): the toast container goes back to its
 * stylesheet spot at the top right and every waiting toast shows there.
 */
export function failOpenToasts(doc, win) {
  const el = doc.getElementById('notification-container');
  if (win?.__hudLanes) win.__hudLanes.notifyAway = false;
  if (!el) return;
  clearBlockPlacing(el);
  for (const t of el.querySelectorAll('.notification')) {
    t.classList.remove('placed-over-panel');
    if (t.classList.contains('toast-pending')) { try { t._onReplace?.('stack'); } catch (e) { /* gone */ } }
  }
}

/** Place the lane members for one measurement. Exposed for tests and the proof scripts. */
export function applyLanes(doc = document, win = window, { cursor = null } = {}) {
  placeHearts(doc);
  const m = measureHud(doc, win);
  // The toast block placed away from the lane over a panel counts as 0 in the lane sums (toast
  // plan 2.7); the sums run before it is placed, so they read the last pass's answer
  const prevBlock = { away: !!win.__hudLanes?.notifyAway, spot: win.__hudLanes?.notifySpot || null };
  const awayPhone = prevBlock.away && phoneOpenIn(doc);
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
    if (awayPhone) return 0;
    const shown = textH.slice(hidden).filter(h => h > 0);
    return sum(shown) + (shown.length >= 2 && clearAllH ? clearAllH + LANE_GAP : 0);
  };
  const toastH = prevBlock.away ? 0 : contentOf(toastsEl);
  const speechH = contentOf(speechEl);
  m.notifyContent = sum([toastH, phoneSum(0)]);
  m.messageContent = sum([cap.h, speechH]);
  let lanes = computeLanes(m);
  // One at a time when space is short (H1 option A): see laneYields for the order
  const free = Math.max(0, (m.vh - lanes.message.bottom) - lanes.notify.top);
  const budget = Math.floor(free * laneBudgetShare(m));
  const y = laneYields({ caption: cap.h, speech: speechH, toasts: toastH, phone: awayPhone ? [] : textH, phoneExtra: awayPhone ? 0 : clearAllH }, budget);
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
  const toastEls = toastsEl ? Array.from(toastsEl.querySelectorAll('.notification'))
    .filter(el => !el._toast?.closing && !el.classList.contains('toast-pending')) : [];
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
  const nHeights = [toasts && !prevBlock.away ? toasts.scrollHeight * zoomOf(toasts) : 0, 0];
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
  // One measure of the open panel per relayout, shared by the banner and the toast block
  let panel = null;
  const measure = () => (panel ||= measureMinigame(doc, win, cursor));
  const ringSpot = placeRingLayer(doc, win, lanes, measure);
  const block = placeNotifyBlock(doc, win, lanes, measure, prevBlock, ringSpot);
  win.__hudLanes = { measured: m, lanes, ringSpot, notifyAway: block.away, notifySpot: block.spot, toastSpot, pendingAnswers };
  // A changed answer changes the lane sums: one more pass settles them, and a further one changes nothing
  if (block.away !== prevBlock.away) win.__hudLanesStarted?.relayout?.();
  return { measured: m, lanes, block };
}

/**
 * Keep the lanes placed: on resize, whenever a member or an anchor changes size, and when HUD
 * pieces come and go (Block/Punch appear in a fight). Placement waits for the next frame and
 * runs once per frame at most.
 */
export function startHudLanes(doc = document, win = window) {
  if (win.__hudLanesStarted) return win.__hudLanesStarted;
  // `queued` is true exactly while a frame for applyLanes is queued; an explicit call queues one
  // unless one already is. The panel throttle below has its own timer and never touches it.
  let queued = false;
  const cursor = { map: new WeakMap(), dirty: null };
  const perf = win.performance;
  const run = () => {
    queued = false;
    const timing = !!win.__hudLanesTiming && typeof perf?.mark === 'function';
    if (timing) perf.mark('hud-lanes-relayout-start');
    try {
      applyLanes(doc, win, { cursor });
      syncPanelWatch();
    } catch (e) {
      console.debug('[hud-lanes]', e);
      try { failOpenToasts(doc, win); } catch (e2) { /* the toasts' own hard release stands behind this */ }
    }
    // From here only what the panel observers report is read again
    cursor.dirty = watching.length ? [] : null;
    if (timing) {
      try {
        perf.mark('hud-lanes-relayout-end');
        perf.measure('hud-lanes-relayout', 'hud-lanes-relayout-start', 'hud-lanes-relayout-end');
      } catch (e) { /* no user timing */ }
      perf.clearMarks?.('hud-lanes-relayout-start');
      perf.clearMarks?.('hud-lanes-relayout-end');
    }
  };
  const relayout = () => {
    if (queued) return;
    queued = true;
    win.requestAnimationFrame(run);
  };
  win.addEventListener('resize', relayout);
  // Changes inside an open panel re-place the banner and the toasts at most once per
  // PANEL_THROTTLE_MS, with a trailing call so the last state is always placed (toast plan 2.8)
  let thrTimer = null;
  let thrLast = -Infinity;
  const throttled = () => {
    if (thrTimer) return;
    const wait = PANEL_THROTTLE_MS - (Date.now() - thrLast);
    if (wait <= 0) { thrLast = Date.now(); relayout(); return; }
    thrTimer = setTimeout(() => { thrTimer = null; thrLast = Date.now(); relayout(); }, wait);
  };
  // While a toast or the banner shows, every minigame container and the shown popup are watched:
  // anything that appears, moves or changes class inside re-places them. The set is re-checked
  // on every relayout, so a container shown later is picked up; observers are only re-attached
  // when it changes.
  let watching = [];
  const panelMo = typeof win.MutationObserver === 'function' ? new win.MutationObserver((records) => {
    if (cursor.dirty) for (const r of records) cursor.dirty.push(r.target);
    throttled();
  }) : null;
  const panelRo = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(() => { cursor.dirty = null; throttled(); }) : null;
  const syncPanelWatch = () => {
    // Only while a toast or the banner shows over an open panel (review R1 n3): lane toasts with
    // nothing open do not attach observers to hidden scene DOM
    const up = (!!doc.querySelector('#phone-ring-layer .incoming-call') || !!doc.querySelector('#notification-container .notification'))
      && (panelOpenIn(doc, win) || !!doc.querySelector('#phone-ring-layer .incoming-call'));
    const want = up ? [...doc.querySelectorAll('.minigame-container'),
      ...POPUP_ROOTS.map(sel => doc.querySelector(sel)).filter(el => el && shownRect(el))] : [];
    if (want.length === watching.length && want.every((el, i) => el === watching[i])) return;
    panelMo?.disconnect();
    panelRo?.disconnect();
    cursor.dirty = null;
    watching = want;
    for (const el of want) {
      panelMo?.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden', 'disabled'] });
      if (panelRo) {
        panelRo.observe(el);
        const frame = el.querySelector('.minigame-game-container, .laptop-screen');
        if (frame) panelRo.observe(frame);
      }
    }
  };
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
    // The incoming-call banner comes and goes inside its layer (item 5d)
    const ring = doc.getElementById('phone-ring-layer');
    if (ring && !attached.has(ring)) { attached.add(ring); mo.observe(ring, { childList: true, attributes: true, attributeFilter: ['class'] }); }
  };
  mo = new win.MutationObserver((records) => {
    // The measuring hosts come and go on body; that must not queue another pass (review R1 M1)
    const real = records.some(r => ![...r.addedNodes, ...r.removedNodes].every(isMeasureHost) || (!r.addedNodes.length && !r.removedNodes.length));
    if (!real) return;
    watch(); attach(); relayout();
  });
  mo.observe(doc.body, { childList: true });
  watch();
  attach();
  relayout();
  win.__hudLanesStarted = { relayout, stop: () => {
    ro?.disconnect(); mo.disconnect(); panelMo?.disconnect(); panelRo?.disconnect(); watching = [];
    clearTimeout(thrTimer); thrTimer = null;
    win.removeEventListener('resize', relayout); win.__hudLanesStarted = null;
  } };
  win.hudLanesRelayout = relayout;
  return win.__hudLanesStarted;
}
