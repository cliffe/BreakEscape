import { sleep, prepare, toWorldBeatPanel, pressButton } from './_ca15.mjs';
export async function setup(page, bridge) { await prepare(page, bridge); await toWorldBeatPanel(page, bridge); }
export default async (page, bridge, mark) => {
  await pressButton(page, /^Look up/); mark('lookup');
  const t0 = Date.now(); let last = '';
  while (Date.now() - t0 < 40000) {
    const s = await bridge.getState();
    const pos = await page.evaluate(() => { const p = window.player; return p ? [p.x, p.y].map(v => Math.round(v)) : null; });
    const g = s.globals || {};
    const snap = JSON.stringify({ room: s.currentRoom || s.room, dlg: s.dialogue && { sp: s.dialogue.speaker, txt: String(s.dialogue.text || '').slice(0, 70), ch: (s.dialogue.choices || []).map(c => c.text || c.label || c).slice(0, 5), aw: s.dialogue.awaitingChoice }, mg: s.activeMinigame && (s.activeMinigame.type || s.activeMinigame.id), bui: s.blockingUi && String(s.blockingUi.text).slice(0, 50), pos, inv: (s.inventory || []).map(i => i.id || i.name).slice(-4), g: Object.fromEntries(Object.entries(g).filter(([k]) => /ca15_drop/.test(k))) });
    if (snap !== last) { mark('state', JSON.parse(snap)); last = snap; }
    await sleep(500);
  }
};
