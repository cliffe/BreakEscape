/**
 * GENERATOR REGISTRY (Ops S6 unit 13)
 * ===================================
 * Which generator writes the Terminal's text for each action that has one: the scanner for
 * `sweep`, `scan` and `check`, the framework console for `confirm` and `use`. Every other
 * action (sign-in, open, observe, unplug) has no entry: its text is the plain layout in
 * terminal-format.js. Pure: no DOM, storage, clock or random source.
 */
import * as scanner from './scanner-output.js';
import * as framework from './framework-console.js';

/** Action to generator (a module with `id`, `started`, `result` and `TEMPLATES`). */
export const GENERATORS = Object.freeze({
    sweep: scanner,
    scan: scanner,
    check: scanner,
    confirm: framework,
    use: framework
});

/** The generator for an action, or null when the action has none. */
export function generatorFor(action) {
    return typeof action === 'string' && Object.prototype.hasOwnProperty.call(GENERATORS, action) ? GENERATORS[action] : null;
}
