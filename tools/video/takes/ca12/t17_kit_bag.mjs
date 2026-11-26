// t17_kit_bag: the kit beat, two shots from one run. Shot a: the player takes Jo's kit bag from its hook and the kit panel (the game's confirm
// dialog "The hi-vis and the letter are in your kit now. Put the hi-vis on?") is up. Shot b: the player puts the hi-vis on and the sprite
// changes to the courier. Script: docs/video/scripts/ca12_trailer_script_r3.md 5, 5.1 (t17). Shot a ends 0.31 s before frame:sprite-changed,
// shot b starts there.
// Kit bag: object ca12_kit_bag in training_room (room_aw_merrin_sallow, 10x10 tiles), scenario position (8.25, 0.875) tiles, elevation 8, on the
// top wall; the player starts at (6, 6.2). The script reads the sprite's live world position and marks it (kit-bag-sprite), so the framing
// is measured, not assumed. The interaction is give_item (letter), give_item (hi-vis) and a confirm_action (Put it on / Leave it off), then the
// wearable's own confirmOn ("Put the courier hi-vis on? ...") with the same two labels. There is no container panel in this scenario.
// Entry state: fresh game with the brief and OSINT done, as the take table says (--set, no inner single quotes: run-take splits unquoted).
// Player avatar so the sprite change reads (as t02): BE_SPRITE=female_office_worker_v2.
//   BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca12_visitor_tailgater t17_kit_bag "--set episode_e12_visitor_tailgater_state={\"done\":[\"brief\",\"osint\"]}" "--hide-hud --zoom-step 1"
// Marks: kit-bag-sprite (world x, y and screen rect of the bag), walk-start, walk-end, interact:ca12_kit_bag, kit-panel-rect (the first
// dialog up: x, y, w, h, text), click:Put it on, frame:wear-confirmed (the wear confirmed: the worn global is set), frame:sprite-changed
// (first poll where the player texture key differs from the start), end.
import { sleep, interactRetry } from './_ca12b.mjs';
import { clearScreen } from '../lib/lib.mjs';

const BAG = 'ca12_kit_bag';

export async function setup(page, bridge) {
  await clearScreen(page, bridge, () => {}); await sleep(500);
  // bridge.getState().globals flattens objects to strings, so read the episode state from the page.
  const done = await page.evaluate(() => window.gameState?.globalVariables?.episode_e12_visitor_tailgater_state);
  if (!done || !(done.done || []).includes('osint')) throw new Error('entry state wrong: brief and osint must be done (--set episode_e12_visitor_tailgater_state=...), got ' + JSON.stringify(done));
}

const playerTexture = (page) => page.evaluate(() => window.player && window.player.texture && window.player.texture.key).catch(() => null);

/** The rect and text of the modal on top of the canvas (the confirm dialog), as the bridge finds blocking UI. */
const dialogRect = (page) => page.evaluate(() => {
  const canvas = document.querySelector('#game-container canvas') || document.querySelector('canvas');
  if (!canvas) return null;
  const c = canvas.getBoundingClientRect();
  const stack = document.elementsFromPoint(c.left + c.width / 2, c.top + c.height / 2);
  if (!stack.length || stack[0] === canvas) return null;
  const panel = stack[0].closest('[class*="modal"], [class*="overlay"], [class*="popup"], [class*="dialog"]') || stack[0];
  const inner = [...panel.querySelectorAll('[class*="dialog"], [class*="content"], [class*="box"]')].filter(e => e.offsetParent && e.getBoundingClientRect().width > 100)[0] || panel;
  const r = inner.getBoundingClientRect();
  return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), text: (panel.innerText || '').trim().slice(0, 140) };
}).catch(() => null);

const bagSprite = (page) => page.evaluate((id) => {
  for (const room of Object.values(window.rooms || {})) for (const s of Object.values(room.objects || {})) {
    if (s && (s.scenarioData?.id === id || s.objectId === id)) {
      const b = s.getBounds(); const cam = window.game?.scene?.scenes?.[0]?.cameras?.main; const cv = document.querySelector('#game-container canvas') || document.querySelector('canvas');
      const cr = cv ? cv.getBoundingClientRect() : { left: 0, top: 0, width: 1, height: 1 };
      const sx = cam ? cr.width / cam.width : 1, sy = cam ? cr.height / cam.height : 1;
      const wv = cam ? cam.worldView : { x: 0, y: 0 };
      return { worldX: Math.round(s.x), worldY: Math.round(s.y), boundsW: Math.round(b.width), boundsH: Math.round(b.height),
               screen: { x: Math.round(cr.left + (b.left - wv.x) * sx), y: Math.round(cr.top + (b.top - wv.y) * sy), w: Math.round(b.width * sx), h: Math.round(b.height * sy) } };
    }
  }
  return null;
}, BAG).catch(() => null);

/** Click a dialog button by its label through the bridge (the real click on the real button). */
// dismissBlockingUi matches a plain lower-case substring (a RegExp stringifies to "/put it on/i" and never matches).
const clickDialog = async (bridge, label) => {
  const r = await bridge.dismissBlockingUi(label);
  if (!r || r.ok === false) throw new Error('could not click "' + label + '": ' + JSON.stringify(r).slice(0, 160));
  return r;
};

export default async (page, bridge, mark) => {
  mark('kit-bag-sprite', await bagSprite(page));
  const tex0 = await playerTexture(page);
  mark('start-hold'); await sleep(1200);
  mark('walk-start');
  await bridge.moveToNear(BAG).catch((e) => { throw new Error('could not walk to the kit bag: ' + String(e).slice(0, 120)); });
  mark('walk-end'); await sleep(600);
  await interactRetry(bridge, BAG, mark, 3, { acceptBlockingUi: true });           // marks interact:ca12_kit_bag
  // shot a: the dialog is up.
  let t0 = Date.now(), rect = null;
  while (Date.now() - t0 < 8000) { rect = await dialogRect(page); if (rect && /kit now|Put the hi-vis on|hi-vis/i.test(rect.text)) break; rect = null; await sleep(100); }
  if (!rect) throw new Error('the kit dialog never came up');
  mark('kit-panel-rect', rect);
  await sleep(2600);                                   // the panel must read on screen (shot a)
  mark('click:Put it on');
  await clickDialog(bridge, 'Put it on');
  // the wearable may ask once more (confirmOn): answer the same way.
  t0 = Date.now();
  let worn = false, changed = false;
  while (Date.now() - t0 < 10000 && !(worn && changed)) {
    const r = await dialogRect(page);
    if (r && /Put the courier hi-vis on/i.test(r.text)) { mark('click:Put it on (confirmOn)'); await clickDialog(bridge, 'Put it on'); await sleep(300); continue; }
    if (!worn) { const g = (await bridge.getState()).globals || {}; if (g.ca12_wearing_hivis) { worn = true; mark('frame:wear-confirmed'); } }
    if (!changed) { const t = await playerTexture(page); if (t && tex0 && t !== tex0) { changed = true; mark('frame:sprite-changed', { from: tex0, to: t }); } }
    await sleep(40);
  }
  if (!worn) throw new Error('the hi-vis was never worn (ca12_wearing_hivis unset)');
  if (!changed) mark('sprite-unchanged', { texture: tex0 });   // the texture key may stay the same: check the frames
  await sleep(2200);                                   // shot b: the player in the hi-vis
  mark('end');
};
