// Awareness episodes: the step strip and the wordmark (11 N2/N8, packet P7-B).
//
// renderStepStrip(container, { stages, current, done, labels, brand }) -> { update, destroy }
//
// A numbered list of the episode's stages with the current one marked. Every string goes in
// with textContent. `brand` is optional: it sets --aw-accent on the container (only a plain
// hex colour is accepted) and draws a wordmark from brand.logoText in CSS, no image.

export const STAGE_LABELS = Object.freeze({
    brief: 'Brief', osint: 'Research', write: 'Write', flip: 'Your message', defend: 'Defend',
    debrief: 'Debrief', check: 'Check', mfa: 'Prompts', build: 'Build', mistake: 'Choices', guess: 'Guess list'
});

const HEX = /^#[0-9a-f]{3,8}$/i;

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

/** Set the brand accent on an element. Anything but a hex colour is ignored. */
export function applyBrand(node, brand) {
    if (node && brand && typeof brand.accent === 'string' && HEX.test(brand.accent)) {
        node.style.setProperty('--aw-accent', brand.accent);
    }
}

/** A wordmark drawn in CSS from the brand's logoText (else its name). Null when neither is set. */
export function renderWordmark(brand) {
    const text = typeof brand?.logoText === 'string' && brand.logoText ? brand.logoText
        : (typeof brand?.name === 'string' ? brand.name : '');
    if (!text) return null;
    const mark = el('span', 'aw-wordmark', text);
    if (typeof brand.name === 'string' && brand.name) mark.setAttribute('aria-label', brand.name);
    return mark;
}

export function renderStepStrip(container, opts = {}) {
    const stages = Array.isArray(opts.stages) ? opts.stages.filter((s) => typeof s === 'string') : [];
    const labels = { ...STAGE_LABELS, ...(opts.labels && typeof opts.labels === 'object' ? opts.labels : {}) };
    const root = el('nav', 'aw-strip');
    root.setAttribute('aria-label', 'Progress');
    applyBrand(root, opts.brand);
    const mark = renderWordmark(opts.brand);
    if (mark) root.appendChild(mark);
    const list = el('ol', 'aw-steps');
    root.appendChild(list);
    const items = new Map();
    stages.forEach((id, i) => {
        const li = el('li', 'aw-step');
        li.dataset.stage = id;
        li.append(el('span', 'aw-step-num', String(i + 1)), el('span', 'aw-step-label',
            typeof labels[id] === 'string' ? labels[id] : id));
        list.appendChild(li);
        items.set(id, li);
    });

    function update({ current, done, skipped } = {}) {
        const doneSet = new Set(Array.isArray(done) ? done : []);
        const skipSet = new Set(Array.isArray(skipped) ? skipped : []);
        for (const [id, li] of items) {
            // A skipped stage was passed over (never run), so it is shown as skipped, not done:
            // ticking it "done" claimed the learner did something they did not (E3-6).
            const isSkipped = skipSet.has(id) && id !== current;
            const isDone = doneSet.has(id) && id !== current && !isSkipped;
            li.classList.toggle('aw-step-current', id === current);
            li.classList.toggle('aw-step-done', isDone);
            li.classList.toggle('aw-step-skipped', isSkipped);
            if (id === current) li.setAttribute('aria-current', 'step');
            else li.removeAttribute('aria-current');
            const old = li.querySelector('.aw-step-sr');
            if (old) old.remove();
            if (isDone) li.appendChild(el('span', 'aw-step-sr', ' (done)'));
            else if (isSkipped) li.appendChild(el('span', 'aw-step-sr', ' (skipped)'));
        }
    }
    update(opts);
    container.appendChild(root);
    return { update, destroy() { root.remove(); } };
}
