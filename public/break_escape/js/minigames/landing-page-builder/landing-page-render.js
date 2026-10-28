// Landing-page builder: the preview renderer (SE design 07 N3, N6b renderer half, N8).
//
// Renders the *preview* only — a tiny fake browser (address bar + page body) — from a
// landing-page record's choices, into two layers (07 §6):
//   - Pixel layer: the brand logo and the padlock icon, as <img> scaled with
//     image-rendering: pixelated (set in the builder CSS, P5-D).
//   - Text layer: the address bar, the page's visible wording and the form-field label
//     boxes, as inert DOM text set with textContent, at native resolution. The address bar
//     is in the readable font; the page's own text is in the pixel font (--se-font-pixel).
//
// Safety (07 §1, enforced by social-landing-page-render.test.mjs, not by convention):
// the preview holds NO <form>, <input>, <textarea>, <select>, <a>, <button>, <iframe>
// or <script> element, and NO contenteditable attribute. Form fields are styled <div>
// boxes with a label, never form controls. The step-6 hot-spots are <div role="button"
// tabindex="0">, which are allowed. Nothing here serialises the page, and no file in the
// builder folder calls fetch, XMLHttpRequest, WebSocket or sendBeacon.
//
// Runtime guard (07 N6b, renderer half): a domain that is not on the page's authored
// menu, or whose host does not end `.example`, is refused — the frame draws with the
// address bar reading "Blocked address" and no page body.
//
// Authored domains and addresses render raw with textContent and are never passed through
// utils/display-dashes.js, so a homograph letter or an `xn--` label shows exactly as typed
// (07 §4, 00 §6). Every element holding an authored domain, address or field label is set
// in var(--se-font-readable) (07 N8).
//
// The N6b guard (resolveDomainOption, isDomainBlocked) is imported from the model
// (landing-page-model.js) so there is one source of the rule: the renderer and the model
// can never drift apart (P5-R single-source). The model is pure (no DOM, no network), so
// importing it here adds no browser coupling; both are re-exported below for callers and
// the renderer's test, which used to read them from this file.
import { resolveDomainOption, isDomainBlocked } from './landing-page-model.js';

export { resolveDomainOption, isDomainBlocked };

const READABLE_FONT = 'var(--se-font-readable)';
const PAGE_FONT = "var(--se-font-pixel, 'GNF', 'Source Sans 3', sans-serif)";
const PADLOCK_ICON = '/break_escape/assets/icons/padlock_32.png';
// Brand logos (LOGO1/LOGO4-6, OBJ/UI rows in ASSETS.md) are not generated yet; the <img>
// points at the settled path and the builder CSS (P5-D) styles the slot so a pending asset
// shows as a labelled box rather than a broken image.
const LOGO_BASE = '/break_escape/assets/social/landing/';

// Logo images that failed to load (a brand with no logo asset, e.g. logo-quayholt.png: P3 N-7).
// A failed logo is hidden rather than drawn as a broken-image box, and the builder drops its
// "Logo" score line, so the scorer never praises a logo the learner cannot see.
const missingLogos = new Set();
/** True once the logo image for this src has failed to load in this session. */
export function logoMissing(src) { return missingLogos.has(src); }
/** The logo src the page uses for a brand. */
export function logoSrc(brand, base = LOGO_BASE) { return `${base}logo-${brand || 'unknown'}.png`; }

// Human labels for the form-field ids a page may ask for (07 §3 step 6, 00 §1).
const FIELD_LABELS = {
    email: 'Email',
    password: 'Password',
    one_time_code: 'One-time code',
    card_number: 'Card number',
    ni_number: 'National insurance number',
};

// --- DOM helpers ----------------------------------------------------------------------

function makeFactory(doc) {
    return function make(tag, className, text) {
        const node = doc.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };
}

// A text node that holds an authored domain/address/label: readable font, set raw.
function readable(node) {
    node.style.fontFamily = READABLE_FONT;
    return node;
}

// Text on the fake page itself: the in-world site's pixel font. The address bar stays readable.
function pageText(node) {
    node.style.fontFamily = PAGE_FONT;
    return node;
}

function brandById(pageDef, id) {
    if (!pageDef || !Array.isArray(pageDef.brands)) return null;
    return pageDef.brands.find((b) => b && b.id === id) || null;
}

function labelFromList(list, id) {
    if (!Array.isArray(list)) return '';
    const hit = list.find((x) => x && x.id === id);
    return hit && typeof hit.label === 'string' ? hit.label : '';
}

// The drawn submit button's words. A purpose is a page heading ("Session expired"), so it is
// never the button face; `purposes[].button` sets the face, and "Sign in" is the default.
function buttonFromPurposes(list, id) {
    const hit = Array.isArray(list) ? list.find((x) => x && x.id === id) : null;
    return hit && typeof hit.button === 'string' && hit.button.trim() ? hit.button : 'Sign in';
}

function wordingText(pageDef, id) {
    if (!pageDef || !Array.isArray(pageDef.wordings)) return '';
    const hit = pageDef.wordings.find((w) => w && w.id === id);
    return hit && typeof hit.text === 'string' ? hit.text : '';
}

// --- Rendering ------------------------------------------------------------------------

/**
 * Render the preview for a page record.
 *
 * @param {object}   options
 * @param {object}   options.pageDef   the social.landingPages entry (brands, purposes, wordings, fields)
 * @param {object}   options.choices   record.choices { brand, purpose, domainId, logo, wording, fields, padlock }
 * @param {string}   [options.mode]    'build' | 'score' | 'inspect' (default 'build')
 * @param {object}   [options.target]  optional { firstName } used only in the aria description
 * @param {Document} [options.doc]     the DOM document (tests pass jsdom's; defaults to the global)
 * @param {string}   [options.logoBase] override the logo asset base (tests)
 * @returns {{ root: HTMLElement, blocked: boolean, regions: object }}
 *          `regions` holds the five region elements ({ addressBar, padlock, logo, wording, form });
 *          in 'inspect' mode each is a focusable <div role="button" tabindex="0"> hot-spot.
 */
export function renderLandingPage(options = {}) {
    const { pageDef = {}, choices = {}, mode = 'build', target = null, logoBase = LOGO_BASE } = options;
    const doc = options.doc || (typeof document !== 'undefined' ? document : null);
    if (!doc) throw new Error('renderLandingPage needs a DOM document');
    const make = makeFactory(doc);
    const inspect = mode === 'inspect';

    const root = make('div', 'lpb-preview');
    root.setAttribute('data-mode', mode);

    const blocked = isDomainBlocked(pageDef, choices);
    const opt = resolveDomainOption(pageDef, choices);
    const domain = opt && typeof opt.domain === 'string' ? opt.domain : '';
    const browserDomain = opt && typeof opt.browserDomain === 'string' ? opt.browserDomain : '';

    // In build/score the preview is one labelled figure (role="img") so a screen reader
    // hears a description. In step 6 it becomes a role="group" so the hot-spots are
    // exposed as buttons (07 §8a).
    root.setAttribute('role', inspect ? 'group' : 'img');
    root.setAttribute('aria-label', buildAriaLabel(pageDef, choices, { blocked, domain, target }));

    // Mark a region as a focusable hot-spot in inspect mode (07 §6: div role="button").
    const asRegion = (el, hotspot) => {
        el.setAttribute('data-region', hotspot);
        if (inspect) {
            el.setAttribute('role', 'button');
            el.setAttribute('tabindex', '0');
            el.classList.add('lpb-hotspot');
        }
        return el;
    };

    // Chrome: the address bar, with the padlock / "Not secure" indicator.
    const chrome = make('div', 'lpb-chrome');
    const padlockOn = choices.padlock === true;

    const padlock = make('div', 'lpb-padlock');
    if (padlockOn) {
        const img = make('img', 'lpb-padlock-icon');
        img.src = PADLOCK_ICON;
        img.alt = 'Padlock: secure connection';
        padlock.appendChild(img);
    } else {
        // "Not secure" badge. UI22's badge art is pending, so the badge is a text chip the
        // builder CSS styles; the words are always present (07 §8a: never a mark alone).
        padlock.appendChild(make('span', 'lpb-not-secure', 'Not secure'));
    }
    chrome.appendChild(asRegion(padlock, 'padlock'));

    const addressBar = make('div', 'lpb-address');
    if (blocked) {
        addressBar.appendChild(readable(make('span', 'lpb-address-text', 'Blocked address')));
    } else {
        addressBar.appendChild(readable(make('span', 'lpb-address-text', domain)));
        if (browserDomain) {
            // The punycode form a browser would show, as a teaching contrast (07 §4). Raw
            // textContent: the `xn--` double hyphen must survive, so it never goes through
            // displayDashes.
            const alt = readable(make('span', 'lpb-address-alt', `Some browsers show it as ${browserDomain}`));
            addressBar.appendChild(alt);
        }
    }
    chrome.appendChild(asRegion(addressBar, 'address'));
    root.appendChild(chrome);

    const regions = { padlock, addressBar, logo: null, wording: null, form: null };

    // A blocked address draws the frame only, with no page body (07 N6b).
    if (blocked) {
        root.classList.add('is-blocked');
        return { root, blocked: true, regions };
    }

    const body = make('div', 'lpb-body');

    // Logo (pixel layer). The blurry/stretched looks are drawn from one crisp source by a
    // CSS class, never downscaled (ASSETS.md house rule). "none" draws no logo.
    const logo = make('div', 'lpb-logo');
    if (choices.logo && choices.logo !== 'none') {
        const brand = brandById(pageDef, choices.brand);
        const src = logoSrc(choices.brand, logoBase);
        if (missingLogos.has(src)) {
            logo.classList.add('is-unavailable');
        } else {
            const img = make('img', 'lpb-logo-img');
            img.alt = brand && brand.name ? brand.name : '';
            if (choices.logo === 'blurry') img.classList.add('is-blurry');
            else if (choices.logo === 'stretched') img.classList.add('is-stretched');
            img.addEventListener('error', () => {
                const first = !missingLogos.has(src);
                missingLogos.add(src);
                img.remove();
                logo.classList.add('is-unavailable');
                // Tell the builder (if any) so it can drop the Logo line from its score panel.
                const CE = (logo.ownerDocument && logo.ownerDocument.defaultView && logo.ownerDocument.defaultView.CustomEvent) || globalThis.CustomEvent;
                if (first && CE) logo.dispatchEvent(new CE('lpb-logo-missing', { bubbles: true, detail: { src } }));
            });
            img.src = src;
            logo.appendChild(img);
        }
    } else {
        logo.classList.add('is-missing');
    }
    body.appendChild(asRegion(logo, 'logo'));
    regions.logo = logo;

    // Purpose heading + wording (text layer).
    const purposeLabel = labelFromList(pageDef.purposes, choices.purpose);
    const wording = make('div', 'lpb-wording');
    if (purposeLabel) wording.appendChild(pageText(make('h3', 'lpb-purpose', purposeLabel)));
    const copy = wordingText(pageDef, choices.wording);
    if (copy) wording.appendChild(pageText(make('p', 'lpb-copy', copy)));
    body.appendChild(asRegion(wording, 'wording'));
    regions.wording = wording;

    // Form fields as inert styled boxes, never controls (07 §1).
    const form = make('div', 'lpb-form');
    const fields = Array.isArray(choices.fields) ? choices.fields : [];
    for (const field of fields) {
        const box = make('div', 'lpb-field');
        box.setAttribute('data-field', field);
        box.appendChild(pageText(make('span', 'lpb-field-label', FIELD_LABELS[field] || field)));
        // The input line is a plain, empty div — no <input>, nothing to type into.
        box.appendChild(make('div', 'lpb-field-input'));
        form.appendChild(box);
    }
    const submit = make('div', 'lpb-submit', buttonFromPurposes(pageDef.purposes, choices.purpose));
    submit.setAttribute('aria-hidden', 'true'); // a drawn button face, not a control
    form.appendChild(submit);
    body.appendChild(asRegion(form, 'form'));
    regions.form = form;

    root.appendChild(body);
    return { root, blocked: false, regions };
}

function buildAriaLabel(pageDef, choices, { blocked, domain, target }) {
    if (blocked) return 'Blocked address: this page cannot be shown.';
    const brand = brandById(pageDef, choices.brand);
    const brandName = brand && brand.name ? brand.name : 'a service';
    const purposeLabel = labelFromList(pageDef.purposes, choices.purpose) || 'Sign in';
    const who = target && target.firstName ? ` for ${target.firstName}` : '';
    const lock = choices.padlock === true ? 'padlock shown' : 'marked Not secure';
    const addr = domain ? ` at ${domain}` : '';
    return `Preview of a ${purposeLabel} page imitating ${brandName}${addr}${who}, ${lock}.`;
}
