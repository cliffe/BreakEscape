// How a host (the episode runner) uses the sort drill (ENG-11). Pure.
//
//   drillConfigOf(episode)            episode.sortDrill when it holds usable bins and cards, else null
//   drillPending(episode, state)      true while the defend stage still has the drill to do
//   drillLaunchCopy(episode)          { heading, text, button } for the launch panel before the drill
//   drillLaunchParams(episode, overrides, extra)   the params to start the 'sort-drill' scene with
//
// An episode with no `sortDrill` has no drill step: drillPending is false and the defend stage
// opens the triage set exactly as before.

import { normaliseConfig, sortText, MIN_BINS } from './sort-drill-model.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function drillConfigOf(episode) {
    if (!isObj(episode?.sortDrill)) return null;
    const cfg = normaliseConfig(episode.sortDrill);
    return cfg.bins.length >= MIN_BINS && cfg.cards.length ? episode.sortDrill : null;
}

/** The drill runs once, first in the defend stage; a done drill (state.drill.done) is not run again. */
export function drillPending(episode, state) {
    return !!drillConfigOf(episode) && state?.stage === 'defend' && state?.drill?.done !== true;
}

export function drillLaunchCopy(episode) {
    const cfg = normaliseConfig(episode?.sortDrill);
    return { heading: sortText('launchHeading', cfg), text: sortText('launchText', cfg), button: sortText('launchButton', cfg) };
}

export function drillLaunchParams(episode, overrides = null, extra = {}) {
    return { config: episode.sortDrill, ...(isObj(overrides) ? { overrides } : {}), skin: 'awareness', ...extra };
}
