// t02_hall_alarm: Hall 1 in the gas alarm, racks pulsing red (hook cut-away, 2.0 s plus 0.5 s; silent shot, Helen's hook audio runs on from t01).
// Entry state: tools/video/takes/run-take.sh sis02 t02_hall_alarm "--start-room battery_hall_1 --set hydrogen_alarm=true --set briefing_played=true --set helen_briefed=true" "--hide-hud --zoom-step 1"
//   --start-room battery_hall_1 makes Helen a not-loaded NPC, so her room_entered mapping cannot fire the "Out of that hall. Now." bark (d09c73). new-game prints a WARNING
//   naming her: expected. The red LEDs come from the hydrogen_alarm global at load; the PULSE is the h2_advisory timer's own action, drawn here by
//   window.applyActions([{type:'tint_objects',roomId:'battery_hall_1',textureKey:'batrack',color:16729122,pulse:true}]) (apply-actions.js).
// MUTE_BARKS + HIDE_BUBBLES are installed as a safety net; bark-check proves nothing spoke or showed.
// Marks: sprite, room (current room), tint-call (the console 'tinted N' line count and return), pulse-alpha (racks' alpha samples over 2 s: the pulse proof), player-pos, bark-check,
//   frame:hall_t+N, end. Player stays at the spawn (at the south door); the edit frames the racks. If the player is in the crop, the edit crops him out.
import { sleep, prepare, sprite, HIDE_BUBBLES, MUTE_BARKS, muteSummary, watchSays } from './_sis02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  const logs = []; page.on('console', m => { const t = m.text(); if (/tint/i.test(t)) logs.push(t.slice(0, 120)); });
  await sprite(page, mark);
  await page.evaluate(HIDE_BUBBLES); await page.evaluate(MUTE_BARKS);
  const says = await watchSays(page, mark);
  const st = await bridge.getState();
  mark('room', { room: st.currentRoom || st.room, player: st.player });
  mark('start-hold'); await sleep(800);
  const r = await page.evaluate(() => { try { return { type: typeof window.applyActions, ret: window.applyActions([{ type: 'tint_objects', roomId: 'battery_hall_1', textureKey: 'batrack', color: 16729122, pulse: true }]) }; } catch (e) { return { err: String(e) }; } });
  mark('tint-call', { r: JSON.stringify(r).slice(0, 200), logs: logs.slice(0, 5) });
  // sample the tinted racks' alpha for 2.5 s: a yoyo between 1.0 and 0.65 is the visible pulse
  const samples = [];
  for (let i = 0; i < 25; i++) {
    samples.push(await page.evaluate(() => { try { const o = Object.values(window.rooms?.battery_hall_1?.objects || {}).filter(x => /batrack/.test(x.texture?.key || '')); return o.length ? +o[0].alpha.toFixed(2) : null; } catch (_) { return -1; } }));
    if (i % 6 === 2) mark('frame:hall_t+' + (i / 10 + 0.0));
    await sleep(100);
  }
  mark('pulse-alpha', { samples, min: Math.min(...samples.filter(x => x != null)), max: Math.max(...samples) });
  await says.drain();
  mark('bark-check', { says: await page.evaluate(() => [...(window.npcWorldBubbles?.says || new Map()).keys()]), mute: await muteSummary(page) });
  await sleep(500); mark('end');
};
