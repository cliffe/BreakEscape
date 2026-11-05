// config-gate.js — complete the one-time character configuration a freshly
// started Hacktivity game puts in front of the play URL.
//
// A brand-new Hacktivity game redirects the play URL
// (/hacktivities/<id>/play/mission/<game_id>) to
// /break_escape/configuration?game_id=<id>: a small form with a code name, a
// sprite radio (input[name="player_preference[selected_sprite]"]) and a submit
// button (input[type=submit].btn-primary). The game and its window.__test
// bridge never load on that page, so a session that navigates straight to the
// play URL and waits for window.__test dies with "window.__test never
// appeared". An already-configured game goes straight to the bridge and never
// lands here, so completing the form is a no-op for it.
//
// Kept in its own module so the browserless unit test
// (test/js/playtest-config-gate.test.mjs) can drive completeConfiguration with
// a stub page, without launching a real browser.

const CONFIG_PATH_RE = /\/break_escape\/configuration(\b|\/|\?|$)/;
const SPRITE_SELECTOR = 'input[name="player_preference[selected_sprite]"]';
const SUBMIT_SELECTOR = 'input[type=submit].btn-primary';

/** True when `url` is the character-configuration page. */
function isConfigurationUrl(url) {
  return typeof url === 'string' && CONFIG_PATH_RE.test(url);
}

/**
 * If the page has landed on the configuration form, complete it (select the
 * first sprite radio, submit the primary button) and return to `gotoUrl`.
 * Idempotent and a no-op when the page is not on the configuration form.
 *
 * @param {object} opts
 * @param {import('playwright').Page} opts.page  the live page (already navigated to gotoUrl)
 * @param {string} opts.gotoUrl                  the play URL (with skip_resume=1) to return to
 * @param {(obj:object)=>void} [opts.emit]       optional structured logger
 * @returns {Promise<boolean>} true if the form was completed, false if nothing to do
 */
async function completeConfiguration({ page, gotoUrl, emit = () => {} }) {
  if (!isConfigurationUrl(page.url())) return false;

  // Select the first offered sprite. Any valid choice lets the form save; the
  // playtest player's appearance does not matter to the walkthrough.
  await page.waitForSelector(SPRITE_SELECTOR, { timeout: 30000 });
  await page.evaluate((sel) => {
    const radio = document.querySelector(sel);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, SPRITE_SELECTOR);

  // Submit, and wait for the save to navigate away from the configuration page.
  await page.waitForSelector(SUBMIT_SELECTOR, { timeout: 30000 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {}),
    page.click(SUBMIT_SELECTOR)
  ]);

  // The save may land anywhere (often the play URL already, sometimes a mission
  // page); force the play URL with skip_resume=1 unless we are already on it, so
  // the caller's window.__test wait runs against the game, exactly as a
  // first-time goto would.
  if (isConfigurationUrl(page.url()) || !/\/play\//.test(page.url())) {
    await page.goto(gotoUrl, { waitUntil: 'domcontentloaded' });
  }

  emit({ ok: true, event: 'configuration-completed', url: page.url() });
  return true;
}

module.exports = { isConfigurationUrl, completeConfiguration, CONFIG_PATH_RE, SPRITE_SELECTOR, SUBMIT_SELECTOR };
