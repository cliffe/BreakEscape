// t04_desk: the claims phone contact list (50 f, no thread) and the screen rects of the closed Albion Policy Binder and the sealed Fairbridge envelope (the edit crops to them; 50 f each).
// Entry state: tools/video/takes/run-take.sh sis03 t04_desk "--set briefing_played=true" ""      (NO --hide-hud: the phone opens from the inventory tray, as m03 t05_phone)
// After the phone opens the take injects the capture's HUD_CSS (so the tray and badge are gone) plus TOAST_CSS. Only the contact list is shown; no contact is clicked, no thread opened.
// Contact avatars: Whitworth (male_office_worker_headshot) and Hartley (male_spy_headshot) at integer scale; the third (Ngata) is hidden with CSS. The list's "11" unread badge is hidden too.
// Marks: phone-open, contacts (names, avatar rects), hide-applied, text-check, frame:phone_list_t0, frame:phone_list_t3, phone-close, binder-rect / envelope-rect (screen rects, closed objects, player may be
//   in frame: the edit crops), frame:desk_objects, toast-seen / toast-watch-end, end.
import { sleep, prepare, rectOf, textHits, waitSel, narrow, watchToasts, HUD_CSS, TOAST_CSS, objScreenRect } from './_sis03.mjs';

export function build(isNarrow) {
  return async (page, bridge, mark) => {
    await prepare(page, bridge, mark);
    const tw = watchToasts(page, mark, 12000);
    await sleep(800);
    const r = await bridge.openInventoryItem('phone');
    if (!r || !r.ok) throw new Error('phone did not open ' + JSON.stringify(r).slice(0, 200));
    await bridge.waitForMinigame('phone-chat', { timeoutMs: 8000 });
    await waitSel(page, '#contact-list-view', 6000); mark('phone-open'); await sleep(600);
    await page.addStyleTag({ content: HUD_CSS + TOAST_CSS });
    if (isNarrow) await narrow(page, '.phone-chat-container, .phone-minigame-container, .phone-screen');
    const contacts = await page.evaluate(() => [...document.querySelectorAll('#contact-list .contact-item')].map(e => { const r = e.getBoundingClientRect(); const im = e.querySelector('img'); return { text: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 60), img: im ? im.getAttribute('src').slice(-48) : null, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }));
    mark('contacts', { contacts });
    // hide Ngata (any contact whose text names Ngata) and any unread badge on the list
    const hid = await page.evaluate(() => { const out = []; document.querySelectorAll('#contact-list .contact-item').forEach(e => { if (/ngata/i.test(e.textContent)) { e.style.setProperty('display', 'none', 'important'); out.push('ngata'); } });
      document.querySelectorAll('#contact-list-view [class*=badge], #contact-list-view [class*=unread]').forEach(e => e.style.setProperty('display', 'none', 'important')); return out; });
    mark('hide-applied', { hidden: hid });
    mark('rects', { view: await rectOf(page, '#contact-list-view'), header: await rectOf(page, '.contact-list-header'), list: await rectOf(page, '#contact-list'), narrow: isNarrow });
    mark('text-check', { hits: await textHits(page), list: await page.evaluate(() => document.querySelector('#contact-list-view').innerText.replace(/\s+/g, ' ').slice(0, 300)) });
    mark('frame:phone_list_t0'); await sleep(500);
    await sleep(2500); mark('frame:phone_list_t3'); await sleep(500);
    await bridge.minigame.close().catch(() => {}); await sleep(900); mark('phone-close');
    mark('binder-rect', await objScreenRect(page, 'policy_binder'));
    mark('envelope-rect', await objScreenRect(page, 'simon_hartley_report_envelope'));
    mark('frame:desk_objects'); await sleep(500);
    await tw;
    mark('end');
  };
}
export default build(false);
