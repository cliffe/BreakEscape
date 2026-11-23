// t03_notification: the incident notification note (claim_file), trimmed in the DOM to "ESTIMATED TOTAL LOSS" and the first three cost lines (cost beat, 186 f). Silent shot.
// Entry state: tools/video/takes/run-take.sh sis03 t03_notification "--set briefing_played=true" "--hide-hud --zoom-step 1"
// The note is DOM text (one text node inside .note-md-text, newline separated). The take REWRITES that text node: it keeps PART 2's "ESTIMATED TOTAL LOSS" line and the first three cost lines,
//   and cuts "; lost frequency response and trading revenue, NESO non-delivery charges" out of the business interruption line (it names NESO). PART 1 (SIS, ESD, cable times, Ofgem, NCSC, NESO),
//   the 4th/5th cost lines (SIS revalidation) and the closing Note are removed, not just scrolled away. Nothing is clicked; the note's "reviewed" mapping completes a task (harmless).
// Marks: panel-open, original-lines (count and the kept lines), rects (notepad, content-area, text, crop box = the text block), text-check (BAD_WORDS in visible text: must be none),
//   toast-seen / toast-watch-end, frame:notes_t0, frame:notes_t4, end.
import { sleep, prepare, interact, rectOf, textHits, waitSel, narrow, watchToasts } from './_sis03.mjs';

export function build(isNarrow) {
  return async (page, bridge, mark) => {
    await prepare(page, bridge, mark);
    const tw = watchToasts(page, mark, 12000);
    await interact(bridge, mark, 'claim_file');
    if (!(await waitSel(page, '.notes-minigame-text', 8000))) throw new Error('notes did not open');
    mark('panel-open'); await sleep(600);
    if (isNarrow) await narrow(page, '.notes-minigame-notepad');
    const trim = await page.evaluate(() => {
      const el = document.querySelector('.note-md-text') || document.querySelector('.notes-minigame-text');
      const lines = el.innerText.split('\n');
      const i = lines.findIndex(l => /^ESTIMATED TOTAL LOSS/.test(l.trim()));
      if (i < 0) return { err: 'no ESTIMATED TOTAL LOSS line', n: lines.length };
      const keep = lines.slice(i, i + 4).map(l => l.replace(/;\s*lost frequency response[^)]*\)/i, ')'));
      el.textContent = keep.join('\n');
      const sc = document.querySelector('.notes-minigame-content-area'); if (sc) sc.scrollTop = 0;
      return { n: lines.length, kept: keep };
    });
    mark('original-lines', trim);
    if (trim.err) throw new Error(trim.err);
    await sleep(300);
    const text = await rectOf(page, '.notes-minigame-text');
    mark('rects', { notepad: await rectOf(page, '.notes-minigame-notepad'), content: await rectOf(page, '.notes-minigame-content-area'), text, narrow: isNarrow });
    mark('text-check', { hits: await textHits(page), visible: await page.evaluate(() => document.querySelector('.notes-minigame-text').innerText) });
    mark('frame:notes_t0'); await sleep(500);
    await sleep(3500); mark('frame:notes_t4'); await sleep(500);
    await tw;
    mark('end');
  };
}
export default build(false);
