// Shared step strip for the SE awareness minigames (C-X7, review note n5).
//
// episode-runner, inbox-triage and landing-page-builder each drew the same idea with
// their own render function: an ordered list of numbered steps with the current one
// marked. This is their shared core. Each caller keeps its own class names and per-item
// shape through `config`, so the DOM and look are unchanged; only the duplicated build
// and state logic is pulled out here.
//
// Every string goes in with textContent.

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

/**
 * Fill `list` (an <ol>/<ul>, cleared first) with one <li> per step and return a
 * Map of step id -> <li>.
 *
 * steps: array of { id, label }
 * config:
 *   stepClass   class for each <li>
 *   dataKey     dataset key for the step id, e.g. 'stage' or 'step' (optional)
 *   numClass    optional: a leading <span class=numClass> holding the 1-based number
 *   label       where the label goes:
 *                 { as: 'text' }            as the <li>'s own text node
 *                 { as: 'span', class }     wrapped in a <span class=...>
 *                 { as: 'none' }            omitted
 *               (default: { as: 'span' })
 */
export function buildStepItems(list, steps, config = {}) {
    list.textContent = '';
    const items = new Map();
    const label = config.label || { as: 'span' };
    steps.forEach((step, i) => {
        const li = el('li', config.stepClass);
        if (config.dataKey) li.dataset[config.dataKey] = step.id;
        if (config.numClass) li.appendChild(el('span', config.numClass, String(i + 1)));
        if (label.as === 'text') li.appendChild(document.createTextNode(step.label));
        else if (label.as !== 'none') li.appendChild(el('span', label.class, step.label));
        list.appendChild(li);
        items.set(step.id, li);
    });
    return items;
}

/**
 * Toggle the state classes, aria-current and screen-reader suffix on the built items.
 *
 * items: the Map from buildStepItems
 * steps: the same { id, label } array
 * config:
 *   currentClass   class for the current step
 *   doneClass      optional: class for a finished step
 *   skippedClass   optional: class for a passed-over step
 *   srClass        optional: class for a visually hidden status suffix span
 *   srDone         optional: suffix text for a done step (needs srClass)
 *   srSkipped      optional: suffix text for a skipped step (needs srClass)
 * resolve(step, index) -> { current, done, skipped } booleans, already de-conflicted
 *   by the caller (a step is at most one of them for display purposes).
 */
export function applyStepStates(items, steps, config, resolve) {
    steps.forEach((step, i) => {
        const li = items.get(step.id);
        if (!li) return;
        const state = resolve(step, i) || {};
        if (config.currentClass) li.classList.toggle(config.currentClass, !!state.current);
        if (config.doneClass) li.classList.toggle(config.doneClass, !!state.done);
        if (config.skippedClass) li.classList.toggle(config.skippedClass, !!state.skipped);
        if (state.current) li.setAttribute('aria-current', 'step');
        else li.removeAttribute('aria-current');
        if (config.srClass) {
            const old = li.querySelector('.' + config.srClass);
            if (old) old.remove();
            if (state.done && config.srDone) li.appendChild(el('span', config.srClass, config.srDone));
            else if (state.skipped && config.srSkipped) li.appendChild(el('span', config.srClass, config.srSkipped));
        }
    });
}
