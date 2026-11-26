// t01b_h2_chat_framing: framing run for the 9:16 / 1:1 cuts of t01 (Helen's hydrogen line). The person-chat is full-bleed DOM and ignores a width cap, so there is NO narrowing here:
//   the narrow edit crops the 1920x1080 take. This run records where Helen sits so the crop can be placed: portrait box, the opaque pixel extent of her portrait canvas, the bar and
//   the 9:16 crop window (607 px wide, full 1080 high) centred on her, and checks (a) her head is in the upper two thirds of the crop band y 20..890, (b) no bar text inside the crop.
// Entry state: tools/video/takes/run-take.sh sis02 t01b_h2_chat_framing "--set hydrogen_alarm=true --set briefing_played=true --set helen_briefed=true" "--hide-hud --zoom-step 1"
// Same actions as t01 (talk to helen_marsh, pick "hydrogen alarm", let 46aae3 play, close at its end). Frames at 0.3, 2.0 and 3.9 s are the ones to look at.
// Marks: bar-rect, portrait-extent (x0,x1,y0,y1 of non-transparent pixels, or null), crop-916 (x,y,w,h and checks), choices-before-line (must be []), hook_start/hook_end, frame:hook_t+N, tts, chat-closed, end.
import { sleep, watchVoice, prepare, sprite, watchTts, playLine, openChat, markChatRects, visibleChoices, pickChoice, awaitChoice } from './_sis02.mjs';

export async function setup(page, bridge) { await prepare(page, bridge, () => {}); }

export default async (page, bridge, mark) => {
  watchTts(page, mark);
  await sprite(page, mark);
  const vw = await watchVoice(page, mark);
  mark('start-hold'); await sleep(1200);
  await openChat(bridge, mark, 'helen_marsh');
  await awaitChoice(bridge, 30000);
  await pickChoice(bridge, /hydrogen alarm/i);
  await sleep(150);
  mark('choices-before-line', await visibleChoices(page));
  await markChatRects(page, mark, 'bar-rect');
  const ext = await page.evaluate(() => {
    try {
      const c = [...document.querySelectorAll('.person-chat-portrait-canvas-container canvas, [class*=portrait] canvas')].find(x => x.offsetParent !== null); if (!c) return null;
      const w = c.width, h = c.height, d = c.getContext('2d').getImageData(0, 0, w, h).data; let x0 = w, x1 = -1, y0 = h, y1 = -1;
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (d[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const r = c.getBoundingClientRect(), sx = r.width / w, sy = r.height / h;
      return { x0: Math.round(r.x + x0 * sx), x1: Math.round(r.x + x1 * sx), y0: Math.round(r.y + y0 * sy), y1: Math.round(r.y + y1 * sy) };
    } catch (e) { return { error: String(e).slice(0, 80) }; }
  });
  mark('portrait-extent', ext);
  const cx = ext && ext.x1 > ext.x0 ? Math.round((ext.x0 + ext.x1) / 2) : 1370;   // fallback: Helen sits at x about 0.70 of the frame
  const w = 608, x = Math.max(0, Math.min(1920 - w, cx - Math.round(w / 2)));
  const band = { y0: 20, y1: 890 }, head = ext && ext.y0;
  mark('crop-916', { x, y: 0, w, h: 1080, cx, headTop: head, headInUpperTwoThirds: head == null ? null : head < band.y0 + (band.y1 - band.y0) * 2 / 3, barTop: 895, note: 'crop the picture to y 20..890 so the bar text is outside; burn the caption' });
  await playLine(page, mark, vw, /Hydrogen's at one per cent/i, 'hook', [0.3, 2.0, 3.9]);
  await bridge.minigame.close().catch(() => {}); mark('chat-closed');
  await vw.stop(); await sleep(400); mark('end');
};
