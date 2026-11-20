// t01_title: the in-game title screen (logo, then the mission name typed out "First Contact").
// Entry state: fresh game: PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m01_first_contact
// Record: run-take.sh t01_title "" "--title-take"   (recording starts on a black page BEFORE the game loads)
// Slate workaround: the AudioContext cannot run before the title's click, so the START slate is video-only (white frames, no tone);
// the end slate (after the trusted click) has the tone. check-take --video-only trims on picture. No usable audio on this take (video-only).
// For the edit: marks give the typing start/end; use ~1.5 s ending on the full text.
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
export default async (page, _bridge, mark) => {
  await page.waitForSelector('.title-screen-container', { timeout: 60000 });
  mark('title-logo-start');
  await page.waitForFunction(() => { const t = document.querySelector('.title-screen-title'); return t && getComputedStyle(t).visibility === 'visible'; }, null, { timeout: 20000 });
  mark('title-typing-start');
  await page.waitForFunction(() => { const e = document.querySelector('.title-screen-typed-text'); const n = window.breakEscapeConfig && window.breakEscapeConfig.missionDisplayName; return e && n && e.textContent === n; }, null, { timeout: 20000 });
  mark('title-typed', { text: await page.evaluate(() => document.querySelector('.title-screen-typed-text').textContent) });
  await sleep(1800);   // linger on the full title with the prompt
  mark('title-linger-end');
};
