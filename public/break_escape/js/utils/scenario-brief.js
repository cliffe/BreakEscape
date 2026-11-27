// When to pop up the Mission Brief (scenario `show_scenario_brief`).
// Kept free of game imports so it can be unit tested (test/js/scenario-brief-once.test.mjs).
//
//   "on_start" (or omitted)  every page load, including every reload
//   "on_resume"              only when resuming a game with progress (an opening
//                            cutscene briefs the player on a fresh start)
//   "once"                   the first time only: shown on the first start, then
//                            recorded in the saved game (player_state
//                            scenarioBriefShown), so a reload doesn't reopen it.
//                            A reload before it ever appeared still shows it.
// The brief is added to the Notepad in every mode.

/** Should the brief popup open on this load? */
export function shouldShowBriefPopup(scenario, config = {}, gameState = {}) {
    if (!scenario) return false;
    const mode = scenario.show_scenario_brief;
    if (mode === 'on_resume') return !!config.hasProgress;
    if (mode === 'once') return !(scenario.scenarioBriefShown || gameState.scenarioBriefShown);
    return true;
}

/**
 * Record that the "once" brief has been shown, so later loads skip it. Sent
 * straight away (and carried by every later state sync), so a reload right
 * after the popup still finds it recorded.
 */
export function recordScenarioBriefShown(win = globalThis.window) {
    if (!win) return null;
    win.gameState = win.gameState || {};
    if (win.gameState.scenarioBriefShown) return null;
    win.gameState.scenarioBriefShown = true;

    const base = win.breakEscapeConfig?.apiBasePath;
    if (!base || typeof win.fetch !== 'function') return null;
    const token = win.breakEscapeConfig?.csrfToken ||
                  win.document?.querySelector?.('meta[name="csrf-token"]')?.content || '';
    return win.fetch(`${base}/sync_state`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({ scenarioBriefShown: true })
    }).catch(error => console.warn('📋 Could not record that the Mission Brief was shown:', error));
}
