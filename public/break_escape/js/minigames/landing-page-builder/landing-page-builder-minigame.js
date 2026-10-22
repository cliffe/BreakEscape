// The landing-page builder overlay (SE design 07; implementation plan Phase 5, packet P5-D).
//
// The player assembles a fake sign-in page from authored choices, scores it against a target,
// and attaches it to a mail (steps 1 to 5: Pretext, Build, Score, Send/Attach). Step 6
// (Inspect, the defender flip) reopens the sent page as the victim's browser and asks the
// player to find each giveaway — focusable preview hot-spots, the padlock decoy, a "Show the
// link target" button and the closing five-habits card. The inspection model is the pure
// landing-page-inspect.js (packet P5-E, 07 N5).
//
// Safety (07 §1): the component MODELS a credential-harvest page, it is never one. The player
// types nothing — every input is a choice from an authored list, drawn as <button> chips in the
// CHOICE PANEL (buttons are allowed there; the PREVIEW, drawn by landing-page-render.js, holds no
// form control, no <a>, no <button>, no serialise path). No value is read from the page, nothing
// is sent, and no domain off the authored menu (or with a host not ending `.example`) is ever
// scored or drawn — the model's guard (N6b) returns { blocked: true } and the preview draws a
// blocked placeholder.
//
// Data: params.social (default window.gameScenario.social); params.landingPageId names the page
// in social.landingPages, params.targetId is the 04 target id (always a key of the page's
// `targets` map — the workstation starter reads the page's only key, and the composer launches
// the builder only for such targets; the backstop below refuses any other). params.kitId is the
// payload-kit item (kit_payroll_page) when the builder was opened from the mail client's Attach
// menu; it rides back out in gameResult.
//
// Persistence (07 §5; the shape guard and the {} declarations are packet P5-F): the latest
// choices live in se_landing_drafts[pageId] (written on every change and on close); the scored
// record lives in se_landing_pages[pageId] (written on every Score). Both are written through the
// shared global writer and reach the server on the next sync.
//
// Close and Esc are a NORMAL exit (complete(true)), so a close never logs minigame_failed.
// Scenarios react to the landing_<pageId>_built global, never to this scene's event.

import { SocialOverlayScene } from '../framework/social-overlay.js';
import { writeGlobal } from '../../systems/global-writer.js';
import { createConceptCard } from '../osint-browser/concept-card.js';
import { renderLandingPage } from './landing-page-render.js';
import {
    scorePage, applyScore, setBuilt, buildRecord, linkInfoFor, CHOICE_KEYS, TELL_IDS
} from './landing-page-model.js';
import { buildSuspectPage } from './landing-page-inspect.js';

export const PAGES_KEY = 'se_landing_pages';
export const DRAFTS_KEY = 'se_landing_drafts';
const INTEL_PREFIX = 'se_intel_';

// Which choice rows the player edits, by profile (07 §7). The rest are preset to the correct
// value (the handler/awareness set fixes them) and not drawn.
const EDITABLE_BY_PROFILE = {
    student: ['brand', 'purpose', 'domain', 'logo', 'wording', 'form', 'padlock'],
    awareness: ['brand', 'domain', 'padlock'],
    mission: ['domain', 'wording']
};
const PROFILE_RANK = { student: 2, awareness: 1, mission: 1 };

const DEFAULT_LOGOS = [
    { id: 'crisp', label: 'Crisp official' },
    { id: 'blurry', label: 'Blurry copy' },
    { id: 'stretched', label: 'Stretched copy' },
    { id: 'none', label: 'No logo' }
];
const FIELD_LABELS = {
    email: 'Email',
    password: 'Password',
    one_time_code: 'One-time code',
    card_number: 'Card number',
    ni_number: 'National insurance number'
};
const RESULT_WORD = { pass: 'Pass', partial: 'Partly', fail: 'Fail' };

// The step strip. "Inspect" (step 6) is shown but owned by P5-E.
const STEPS = [
    { id: 'pretext', label: 'Pretext' },
    { id: 'build', label: 'Build' },
    { id: 'score', label: 'Score' },
    { id: 'send', label: 'Send' },
    { id: 'inspect', label: 'Inspect' }
];

const PADLOCK_NOTE =
    'A padlock means the connection is private to whoever owns the address. Fake sites can show one too.';
const PRETEXT_NOTE =
    'The page has to match the story the email told. Pick the service, the reason and the wording this ' +
    'person is already expecting, or it will not ring true.';

// The closing five-habits card (07 §3 step 6). Used only when the scenario authors no
// `five-habits` conceptCards text; the lab authors its own (P5-G). Chrome text, no address.
const FIVE_HABITS = [
    '1. Read the address up to the first single slash, then find the ending. The real site is the single name just before that ending. Everything to the left is just labels the owner can set to anything.',
    '2. Do not trust the padlock to mean "safe". It only means the connection is private to whoever owns the address.',
    '3. Hover over a link before clicking and compare it with where the message says it goes.',
    '4. Do not sign in from a mailed link. Open the service from a bookmark or type it yourself.',
    '5. Report it. A password manager that refuses to fill the form is a free warning; believe it.'
].join('\n\n');

function h(tag, props = {}, ...kids) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
        if (v === undefined || v === null || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else node.setAttribute(k, v === true ? '' : String(v));
    }
    for (const kid of kids.flat()) {
        if (kid === undefined || kid === null || kid === false) continue;
        node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    }
    return node;
}

export class LandingPageBuilderMinigame extends SocialOverlayScene {
    constructor(container, params) {
        super(container, params);
        this.pageDef = null;
        this.targetId = null;
        this.profile = 'student';
        this.choices = null;
        this.scored = null;            // the current ScoreResult, or null when stale/unscored
        this.scoredSig = null;         // the choice signature the score was for
        this._openCards = new Set();
        this._attached = false;        // this session attached the page
        this._inspectionComplete = false;
        this._invalid = null;          // a reason string when the page/target is wrong
        this._live = '';
        // ── step 6 (Inspect) state ──
        this._inspecting = false;      // the defender-flip view is open
        this._suspect = null;          // the buildSuspectPage() view for the current choices
        this._found = new Set();        // tell ids the player has found this inspection
        this._linkRevealed = false;    // "Show the link target" used (hoverMismatch)
        this._padlockDecoyShown = false;// the padlock decoy line has been shown
        this._lastFine = '';           // the most recent "what was fine" line
    }

    // ── data ──────────────────────────────────────────────────────────────
    get social() {
        return this.params.social || (typeof window !== 'undefined' ? window.gameScenario?.social : null) || {};
    }

    get globals() {
        return (typeof window !== 'undefined' ? window.gameState?.globalVariables : null) || {};
    }

    get pageId() {
        return this.pageDef ? this.pageDef.id : (this.params.landingPageId || null);
    }

    _pages() {
        const raw = this.globals[PAGES_KEY];
        return raw && typeof raw === 'object' ? raw : {};
    }

    _drafts() {
        const raw = this.globals[DRAFTS_KEY];
        return raw && typeof raw === 'object' ? raw : {};
    }

    _record() {
        const r = this._pages()[this.pageId];
        return r && typeof r === 'object' ? r : null;
    }

    _targetCfg() {
        const t = this.pageDef && this.pageDef.targets;
        return t && typeof t === 'object' ? t[this.targetId] : undefined;
    }

    _card(id) {
        return (this.social.conceptCards || []).find((c) => c && c.id === id) || null;
    }

    _held(factId) {
        return this.globals[INTEL_PREFIX + factId] === true;
    }

    _firstName() {
        const people = Array.isArray(this.social.people) ? this.social.people : [];
        const person = people.find((p) => p && p.id === this.targetId);
        const forms = person && person.forms ? person.forms : null;
        if (forms && forms.first) return forms.first;
        if (forms && forms.short) return forms.short;
        if (forms && forms.full) return String(forms.full).split(/\s+/)[0];
        const targets = Array.isArray(this.social.phishTargets) ? this.social.phishTargets : [];
        const pt = targets.find((t) => t && t.id === this.targetId);
        if (pt && pt.firstName) return pt.firstName;
        if (pt && pt.displayName) return String(pt.displayName).split(/\s+/)[0];
        return this.targetId || '';
    }

    _target() {
        return { id: this.targetId, firstName: this._firstName() };
    }

    _profileRank(p) {
        return PROFILE_RANK[p] || PROFILE_RANK.student;
    }

    _profileAllows(minProfile) {
        if (!minProfile) return true;
        return this._profileRank(this.profile) >= this._profileRank(minProfile);
    }

    _editableRows() {
        return EDITABLE_BY_PROFILE[this.profile] || EDITABLE_BY_PROFILE.student;
    }

    _isEditable(row) {
        return this._editableRows().includes(row);
    }

    // ── choice model ────────────────────────────────────────────────────────
    _defaults() {
        return { brand: null, purpose: null, domainId: null, logo: null, wording: null, fields: [], padlock: false };
    }

    _matchingWordingId() {
        const w = (this.pageDef.wordings || []).find((x) => x && x.match === true);
        return w ? w.id : null;
    }

    _pretextBrand() {
        return this.pageDef.pretext ? this.pageDef.pretext.brandId : null;
    }

    /** The correct value for a row, used to preset rows the current profile does not edit (07 §7). */
    _presetValue(row) {
        const pt = this.pageDef.pretext || {};
        if (row === 'brand') return pt.brandId ?? null;
        if (row === 'purpose') return pt.purposeId ?? null;
        if (row === 'logo') return 'crisp';
        if (row === 'wording') return this._matchingWordingId();
        if (row === 'form') {
            const brand = this._brandById(pt.brandId);
            return Array.isArray(brand && brand.realFields) ? brand.realFields.slice() : [];
        }
        if (row === 'padlock') return true;
        return null;
    }

    _brandById(id) {
        return (this.pageDef.brands || []).find((b) => b && b.id === id) || null;
    }

    _activeBrandId() {
        return this.choices.brand || this._pretextBrand() || (this.pageDef.brands || [])[0]?.id || null;
    }

    _visibleDomains(brand) {
        const list = Array.isArray(brand && brand.domains) ? brand.domains : [];
        return list.filter((d) => d && this._profileAllows(d.minProfile));
    }

    /** A stable signature of the current choices, for staleness checks. */
    _sig(choices = this.choices) {
        const c = choices || {};
        return JSON.stringify([
            c.brand ?? null, c.purpose ?? null, c.domainId ?? null, c.logo ?? null,
            c.wording ?? null, (Array.isArray(c.fields) ? c.fields.slice().sort() : []), c.padlock === true
        ]);
    }

    _pick7(choices) {
        const out = {};
        for (const k of CHOICE_KEYS) {
            if (k === 'fields') out.fields = Array.isArray(choices.fields) ? choices.fields.slice() : [];
            else if (k === 'padlock') out.padlock = choices.padlock === true;
            else out[k] = choices[k] ?? null;
        }
        return out;
    }

    // ── lifecycle ─────────────────────────────────────────────────────────
    init() {
        super.init();
        this.container.classList.add('lpb-container');
        this.gameContainer.classList.add('lpb-game-container');

        const pages = Array.isArray(this.social.landingPages) ? this.social.landingPages : [];
        this.pageDef = pages.find((p) => p && p.id === this.params.landingPageId) || null;
        this.targetId = this.params.targetId || null;

        if (!this.pageDef) {
            this._invalid = 'This page is not available.';
        } else {
            this.profile = this.pageDef.profile || 'student';
            const targets = this.pageDef.targets && typeof this.pageDef.targets === 'object' ? this.pageDef.targets : {};
            if (!this.targetId && Object.keys(targets).length === 1) this.targetId = Object.keys(targets)[0];
            if (!this.targetId || !Object.prototype.hasOwnProperty.call(targets, this.targetId)) {
                this._invalid = 'This page isn’t for this person.';
            }
        }

        if (this._invalid) { this._buildInvalid(); return; }

        // Restore: defaults, then the draft or the scored record, then presets for rows this
        // profile does not edit (07 §5, §7).
        const restored = this._drafts()[this.pageId] || (this._record() ? this._record().choices : null) || {};
        this.choices = { ...this._defaults(), ...this._pick7({ ...this._defaults(), ...restored }) };
        for (const row of ['brand', 'purpose', 'domain', 'logo', 'wording', 'form', 'padlock']) {
            if (this._isEditable(row)) continue;
            const v = this._presetValue(row);
            if (row === 'domain') { if (v != null) this.choices.domainId = v; continue; }
            if (row === 'form') { this.choices.fields = Array.isArray(v) ? v : []; continue; }
            this.choices[row] = v;
        }

        // A reload after a real Score restores the panel: the record's choices match ours and it
        // carries a credibility (a stale change writes credibility 0, so it never restores).
        const rec = this._record();
        if (rec && rec.credibility > 0 && this._sig(this._pick7(rec.choices)) === this._sig()) {
            this._runScore({ persist: false });
        }

        // A reload after step 6 finished: if every giveaway the current choices carry is
        // already in the stored tellsFound, the inspection is complete (07 §3, reload
        // restores its state). This does not re-open the inspect view; the player re-enters
        // it from the action bar, with the found tells restored.
        if (this._canInspect()) {
            const suspect = buildSuspectPage(this.pageDef, { ...this._record(), choices: this.choices }, this._target());
            if (suspect.allFound) this._inspectionComplete = true;
        }

        this._buildShell();
        this._renderAll();
    }

    start() {
        super.start();
        this.root?.focus?.();
    }

    // ── shell ─────────────────────────────────────────────────────────────
    _buildInvalid() {
        const wrap = h('div', { class: 'lpb-root lpb-invalid', tabindex: '-1' },
            h('p', { class: 'lpb-invalid-text', text: this._invalid }),
            h('button', { type: 'button', class: 'se-overlay-close minigame-button', text: 'Close' }));
        this.addEventListener(wrap.querySelector('button'), 'click', (e) => {
            e.preventDefault?.(); this.requestClose();
        });
        this.root = wrap;
        this.gameContainer.appendChild(wrap);
    }

    _buildShell() {
        const title = h('h2', { class: 'lpb-title', text: this.pageDef.title || 'Build a page' });
        const close = h('button', { type: 'button', class: 'se-overlay-close minigame-button lpb-close',
            text: 'Close', 'aria-label': 'Close' });
        this.addEventListener(close, 'click', (e) => {
            e.preventDefault?.(); e.stopPropagation?.(); this.requestClose();
        });
        this.closeButton = close;
        const head = h('header', { class: 'lpb-head' }, title, h('div', { class: 'lpb-head-buttons' }, close));

        this.stepStrip = h('ol', { class: 'lpb-steps', 'aria-label': 'Steps' });
        this.previewPane = h('div', { class: 'lpb-preview-pane' });
        this.panel = h('div', { class: 'lpb-panel', tabindex: '-1' });
        this.live = h('div', { class: 'lpb-live', role: 'status', 'aria-live': 'polite' });

        const body = h('div', { class: 'lpb-body' }, this.previewPane, this.panel);
        this.root = h('div', { class: 'lpb-root', tabindex: '-1' }, head, this.stepStrip, body, this.live);
        this.gameContainer.appendChild(this.root);
    }

    // ── rendering ───────────────────────────────────────────────────────────
    _renderAll() {
        this._renderSteps();
        this._renderPreview();
        this._renderPanel();
    }

    _currentStep() {
        if (this._inspecting) return 'inspect';
        if (this._canInspect() && this._inspectionComplete) return 'inspect';
        if (this.scored && !this._stale()) return 'send';
        if (this.scored) return 'score';
        return 'build';
    }

    _renderSteps() {
        this.stepStrip.textContent = '';
        const current = this._currentStep();
        for (const step of STEPS) {
            const li = h('li', { class: `lpb-step${step.id === current ? ' is-current' : ''}`,
                'data-step': step.id, 'aria-current': step.id === current ? 'step' : false },
                h('span', { class: 'lpb-step-label', text: step.label }));
            this.stepStrip.appendChild(li);
        }
    }

    _renderPreview() {
        this.previewPane.textContent = '';
        const mode = this._inspecting ? 'inspect' : 'build';
        const { root, regions } = renderLandingPage({
            pageDef: this.pageDef, choices: this.choices, mode, target: this._target()
        });
        this.previewPane.appendChild(root);
        if (this._inspecting && regions) this._wireHotspots(regions);
    }

    /** In step 6 the preview regions are focusable hot-spots (07 §6); wire each to a pick. */
    _wireHotspots(regions) {
        const map = {
            address: regions.addressBar, padlock: regions.padlock,
            logo: regions.logo, wording: regions.wording, form: regions.form
        };
        const s = this._suspect;
        for (const [name, el] of Object.entries(map)) {
            if (!el) continue;
            const regionTells = (s && s.byRegion[name]) || [];
            if (regionTells.some((t) => this._found.has(t.id))) el.classList.add('is-found');
            this.addEventListener(el, 'click', (e) => { e.preventDefault?.(); this._pickRegion(name); });
            this.addEventListener(el, 'keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                    e.preventDefault?.(); this._pickRegion(name);
                }
            });
        }
    }

    _renderPanel() {
        const keep = this._focusKey();
        this.panel.textContent = '';
        if (this._inspecting) {
            this._renderInspectPanel();
            this._restoreFocus(keep);
            return;
        }
        this.panel.appendChild(this._pretextCard());
        if (this._editableRows().length) {
            const rows = h('div', { class: 'lpb-rows' });
            if (this._isEditable('brand')) rows.appendChild(this._brandRow());
            if (this._isEditable('purpose')) rows.appendChild(this._purposeRow());
            if (this._isEditable('domain')) rows.appendChild(this._domainRow());
            if (this._isEditable('logo')) rows.appendChild(this._logoRow());
            if (this._isEditable('wording')) rows.appendChild(this._wordingRow());
            if (this._isEditable('form')) rows.appendChild(this._formRow());
            if (this._isEditable('padlock')) rows.appendChild(this._padlockRow());
            this.panel.appendChild(rows);
        }
        if (this.pageDef.tellCounter === true) this.panel.appendChild(this._tellCounter());
        this.panel.appendChild(this._scorePanel());
        this.panel.appendChild(this._actionBar());
        this._restoreFocus(keep);
    }

    _focusKey() {
        const a = document.activeElement;
        if (!a || !this.panel?.contains?.(a)) return null;
        return a.getAttribute('data-focus') || null;
    }

    _restoreFocus(key) {
        if (!key) return;
        const el = this.panel.querySelector(`[data-focus="${key.replace(/"/g, '\\"')}"]`);
        el?.focus?.();
    }

    // ── step 1: pretext card ─────────────────────────────────────────────────
    _pretextCard() {
        const card = h('section', { class: 'lpb-pretext', 'aria-label': 'What this person expects' });
        card.appendChild(h('h3', { class: 'lpb-pretext-title', text: 'What ' + this._firstName() + ' is expecting' }));

        const factIds = Array.isArray(this.pageDef.pretext && this.pageDef.pretext.facts)
            ? this.pageDef.pretext.facts : [];
        const held = factIds.filter((f) => this._held(f));
        if (held.length) {
            const ul = h('ul', { class: 'lpb-facts' });
            const facts = this.social.intelFacts || {};
            for (const id of held) {
                const txt = (facts[id] && facts[id].text) || id;
                ul.appendChild(h('li', { class: 'lpb-fact', text: txt }));
            }
            card.appendChild(ul);
        } else {
            card.appendChild(h('p', { class: 'lpb-pretext-empty',
                text: 'You haven’t found out what ' + this._firstName() + ' would expect to see yet.' }));
            if (this.social.intelBoard) {
                const caseBtn = h('button', { type: 'button', class: 'lpb-case minigame-button',
                    'data-focus': 'case-file', text: 'Case file' });
                this.addEventListener(caseBtn, 'click', (e) => { e.preventDefault?.(); this._openCaseFile(); });
                card.appendChild(caseBtn);
            }
        }
        card.appendChild(this._builtInNote('why-match', 'Why the page must match the story', PRETEXT_NOTE));
        return card;
    }

    // ── step 2: build rows ────────────────────────────────────────────────────
    _row(id, label, body, cards = []) {
        const row = h('section', { class: 'lpb-row', 'data-row': id, 'aria-label': label });
        const head = h('div', { class: 'lpb-row-head' }, h('h4', { class: 'lpb-row-label', text: label }));
        row.appendChild(head);
        row.appendChild(body);
        for (const c of cards) if (c) row.appendChild(c);
        return row;
    }

    _radioGroup(name, options, value, onPick, { readable = false } = {}) {
        const group = h('div', { class: 'lpb-chips', role: 'radiogroup', 'aria-label': name });
        for (const opt of options) {
            const checked = opt.value === value;
            const chip = h('button', { type: 'button',
                class: `lpb-chip${checked ? ' is-selected' : ''}${readable ? ' lpb-readable' : ''}`,
                role: 'radio', 'aria-checked': String(checked),
                'data-value': opt.value, 'data-focus': `${name}:${opt.value}`,
                tabindex: checked || (value == null && options.indexOf(opt) === 0) ? '0' : '-1' },
                ...(Array.isArray(opt.lines) ? opt.lines : [h('span', { class: 'lpb-chip-text', text: opt.label })]));
            this.addEventListener(chip, 'click', (e) => { e.preventDefault?.(); onPick(opt.value); });
            group.appendChild(chip);
        }
        this._arrowNav(group, '.lpb-chip', (el) => el.click());
        return group;
    }

    _brandRow() {
        const opts = (this.pageDef.brands || []).map((b) => ({ value: b.id, label: b.name || b.id }));
        const body = this._radioGroup('brand', opts, this.choices.brand, (v) => this._set('brand', v));
        return this._row('brand', 'Which service?', body, this._cardsFor([]));
    }

    _purposeRow() {
        const opts = (this.pageDef.purposes || []).map((p) => ({ value: p.id, label: p.label || p.id }));
        const body = this._radioGroup('purpose', opts, this.choices.purpose, (v) => this._set('purpose', v));
        return this._row('purpose', 'What does the page say it is for?', body);
    }

    _domainRow() {
        const brand = this._brandById(this._activeBrandId());
        const domains = this._visibleDomains(brand);
        const opts = domains.map((d) => ({
            value: d.id,
            lines: [
                h('span', { class: 'lpb-chip-text lpb-readable', text: d.domain }),
                d.browserDomain ? h('span', { class: 'lpb-chip-alt lpb-readable',
                    text: 'Some browsers show it as ' + d.browserDomain }) : null
            ].filter(Boolean)
        }));
        const body = this._radioGroup('domain', opts, this.choices.domainId, (v) => this._set('domainId', v), { readable: true });
        // The real domain is shown but locked: the lesson is that the attacker can never own it.
        if (brand && brand.realDomain) {
            const locked = h('div', { class: 'lpb-domain-locked' },
                h('span', { class: 'lpb-readable lpb-locked-domain', text: brand.realDomain }),
                h('span', { class: 'lpb-locked-note', text: 'You don’t own this. Only the company does.' }));
            body.appendChild(locked);
        }
        return this._row('domain', 'The address', body, this._cardsFor(['typo-squat', 'homograph', 'right-to-left', 'hover-link']));
    }

    _logoRow() {
        const list = Array.isArray(this.pageDef.logos) && this.pageDef.logos.length
            ? this.pageDef.logos.map((l) => ({ value: l.id, label: l.label || l.id }))
            : DEFAULT_LOGOS.map((l) => ({ value: l.id, label: l.label }));
        const body = this._radioGroup('logo', list, this.choices.logo, (v) => this._set('logo', v));
        return this._row('logo', 'Logo', body);
    }

    _wordingRow() {
        const opts = (this.pageDef.wordings || []).map((w) => ({
            value: w.id,
            lines: [h('span', { class: 'lpb-chip-text lpb-readable', text: w.text || w.id })]
        }));
        const body = this._radioGroup('wording', opts, this.choices.wording, (v) => this._set('wording', v), { readable: true });
        return this._row('wording', 'The wording', body);
    }

    _formRow() {
        const fields = Array.isArray(this.pageDef.fields) ? this.pageDef.fields : Object.keys(FIELD_LABELS);
        const chosen = new Set(this.choices.fields || []);
        const group = h('div', { class: 'lpb-chips lpb-checks', role: 'group', 'aria-label': 'Form fields' });
        for (const f of fields) {
            const on = chosen.has(f);
            const chip = h('button', { type: 'button', class: `lpb-chip lpb-check${on ? ' is-selected' : ''}`,
                role: 'checkbox', 'aria-checked': String(on), 'data-value': f, 'data-focus': `form:${f}` },
                h('span', { class: 'lpb-chip-text', text: FIELD_LABELS[f] || f }));
            this.addEventListener(chip, 'click', (e) => { e.preventDefault?.(); this._toggleField(f); });
            group.appendChild(chip);
        }
        this._arrowNav(group, '.lpb-chip', (el) => el.click());
        return this._row('form', 'Which details does it ask for?', group);
    }

    _padlockRow() {
        const opts = [
            { value: 'on', label: 'Show a secure padlock' },
            { value: 'off', label: 'No padlock' }
        ];
        const body = this._radioGroup('padlock', opts, this.choices.padlock ? 'on' : 'off',
            (v) => this._set('padlock', v === 'on'));
        const note = h('p', { class: 'lpb-note', text: PADLOCK_NOTE });
        return this._row('padlock', 'Padlock', body, [note, ...this._cardsFor(['padlock'])]);
    }

    /** Concept cards for a row: the page's authored cards, in the given order, five-habits reserved
     *  for step 6 (P5-E). Each renders behind its own "What is this?" button (07 N7). */
    _cardsFor(ids) {
        const pageCards = Array.isArray(this.pageDef.conceptCards) ? this.pageDef.conceptCards : [];
        const out = [];
        for (const id of ids) {
            if (id === 'five-habits') continue;
            if (!pageCards.includes(id)) continue;
            const card = this._card(id);
            if (!card) continue;
            out.push(this._cardEl(card));
        }
        return out;
    }

    _cardEl(card) {
        const c = createConceptCard(card, {
            open: this._openCards.has(card.id),
            // Several of these sit on one screen, so each button names its own topic rather than
            // reading an identical "What is this?" (E5-12).
            buttonLabel: card && card.title ? `What is this? (${card.title})` : 'What is this?',
            onToggle: (id, open) => { if (open) this._openCards.add(id); else this._openCards.delete(id); }
        });
        c.button.setAttribute('data-focus', `card:${card.id}`);
        return c.el;
    }

    /** A short built-in teaching note (chrome text, no authored address), behind a "?" button. */
    _builtInNote(id, title, text) {
        const c = createConceptCard({ id, title, text }, {
            open: this._openCards.has(id),
            buttonLabel: title ? `What is this? (${title})` : 'What is this?',
            onToggle: (cid, open) => { if (open) this._openCards.add(cid); else this._openCards.delete(cid); }
        });
        c.button.setAttribute('data-focus', `card:${id}`);
        return c.el;
    }

    // ── step 3: score ─────────────────────────────────────────────────────────
    _tellCounter() {
        const n = this.scored ? this.scored.tells.length : 0;
        return h('p', { class: 'lpb-tell-counter',
            text: this.scored ? `This page has ${n} giveaway${n === 1 ? '' : 's'}.` : 'Score the page to count its giveaways.' });
    }

    _scorePanel() {
        const panel = h('section', { class: `lpb-score${this._stale() ? ' is-stale' : ''}`, 'aria-label': 'Score' });
        if (!this.scored) {
            panel.appendChild(h('p', { class: 'lpb-score-prompt', text: 'Press Score to see how convincing this page is.' }));
            return panel;
        }
        const s = this.scored;
        const cfg = this._targetCfg() || {};
        const threshold = Number(cfg.linkThreshold);
        const pct = Math.max(0, Math.min(100, s.credibility));

        const meter = h('div', { class: 'lpb-meter', role: 'img',
            'aria-label': `Credibility ${s.credibility} out of 100` +
                (Number.isFinite(threshold) ? `, threshold ${threshold}` : '') });
        meter.appendChild(h('div', { class: 'lpb-meter-fill', style: `width:${pct}%` }));
        if (Number.isFinite(threshold)) {
            meter.appendChild(h('div', { class: 'lpb-meter-threshold', style: `left:${Math.max(0, Math.min(100, threshold))}%` }));
        }
        panel.appendChild(meter);
        panel.appendChild(h('p', { class: 'lpb-credibility', text: `Credibility: ${s.credibility} / 100` }));
        panel.appendChild(h('p', { class: 'lpb-verdict lpb-readable', text: s.verdict }));
        for (const line of s.gateLines) panel.appendChild(h('p', { class: 'lpb-gate-line lpb-readable', text: line }));

        const list = h('ul', { class: 'lpb-checklist', 'aria-label': 'Per-factor result' });
        for (const f of s.factors) {
            list.appendChild(h('li', { class: `lpb-check-item is-${f.result}`, 'data-factor': f.id },
                h('span', { class: 'lpb-check-word', text: RESULT_WORD[f.result] || f.result }),
                h('span', { class: 'lpb-check-line lpb-readable', text: f.line })));
        }
        panel.appendChild(list);
        if (this._stale()) panel.appendChild(h('p', { class: 'lpb-stale-note', text: 'Score again — a choice changed.' }));
        return panel;
    }

    // ── step 4: send / attach ────────────────────────────────────────────────
    _actionBar() {
        const bar = h('div', { class: 'lpb-actions' });
        const scoreBtn = h('button', { type: 'button', class: 'lpb-score-btn minigame-button', 'data-focus': 'score',
            text: this.scored && !this._stale() ? 'Score again' : 'Score' });
        this.addEventListener(scoreBtn, 'click', (e) => { e.preventDefault?.(); this.score(); });
        bar.appendChild(scoreBtn);

        // Attach appears only with a current (non-stale) Score (07 §3, §4).
        if (this.scored && !this._stale()) {
            const canReach = this.scored.meetsThreshold === true;
            const attach = h('button', { type: 'button', class: 'lpb-attach-btn minigame-button', 'data-focus': 'attach',
                text: canReach ? 'Attach to email' : 'Attach anyway' });
            this.addEventListener(attach, 'click', (e) => { e.preventDefault?.(); this.attach(); });
            bar.appendChild(attach);
        }

        if (this._canInspect()) {
            const inspect = h('button', { type: 'button', class: 'lpb-inspect-btn minigame-button', 'data-focus': 'inspect',
                text: 'Inspect as the victim' });
            this.addEventListener(inspect, 'click', (e) => { e.preventDefault?.(); this._enterInspect(); });
            bar.appendChild(inspect);
        }
        return bar;
    }

    // ── interaction ───────────────────────────────────────────────────────────
    _set(key, value) {
        // Re-picking the value that is already selected is a no-op: it must not clear a Score
        // or rewrite the record as unscored (07 §3; a radio click on the current choice).
        if (key === 'brand' ? this.choices.brand === value : this.choices[key] === value) return;
        if (key === 'brand') {
            // A new brand may offer a different domain menu; drop a domain that is not on it.
            this.choices.brand = value;
            const brand = this._brandById(this._activeBrandId());
            const ids = this._visibleDomains(brand).map((d) => d.id);
            if (this.choices.domainId && !ids.includes(this.choices.domainId)) this.choices.domainId = null;
        } else {
            this.choices[key] = value;
        }
        this._onChoiceChanged();
    }

    _toggleField(field) {
        const set = new Set(this.choices.fields || []);
        if (set.has(field)) set.delete(field); else set.add(field);
        this.choices.fields = Array.from(set);
        this._onChoiceChanged();
    }

    _stale() {
        return this.scored != null && this.scoredSig !== this._sig();
    }

    /** Every change writes the draft; a change after a Score greys it and rewrites the record as
     *  unscored (meetsThreshold/built false, credibility 0), so new choices never pair with an old
     *  score (07 §3). */
    _onChoiceChanged() {
        this._writeDraft();
        if (this.scored) {
            this.scored = null;
            this.scoredSig = null;
            const existing = this._record();
            const stale = applyScore(existing, {
                pageId: this.pageId, targetId: this.targetId,
                choices: this.choices, credibility: 0, gatesPassed: false, meetsThreshold: false
            });
            this._writeRecord(stale);
        }
        this._renderAll();
    }

    score() {
        this._runScore({ persist: true });
        this._announce(this.scored ? this.scored.verdict : 'This page cannot be scored.');
        this._renderAll();
    }

    _runScore({ persist }) {
        const result = scorePage(this.pageDef, this.choices, this._target());
        if (result.blocked) { this.scored = null; this.scoredSig = null; return; }
        this.scored = result;
        this.scoredSig = this._sig();
        if (persist) {
            const existing = this._record();
            const record = applyScore(existing, {
                pageId: this.pageId, targetId: this.targetId, choices: this.choices,
                credibility: result.credibility, gatesPassed: result.gatesPassed, meetsThreshold: result.meetsThreshold
            });
            this._writeRecord(record);
        }
    }

    attach() {
        if (!this.scored || this._stale()) return;
        const existing = this._record();
        const scoredRecord = existing
            ? buildRecord({ ...existing, choices: this.choices, credibility: this.scored.credibility,
                gatesPassed: this.scored.gatesPassed, meetsThreshold: this.scored.meetsThreshold })
            : buildRecord({ pageId: this.pageId, targetId: this.targetId, choices: this.choices,
                credibility: this.scored.credibility, gatesPassed: this.scored.gatesPassed,
                meetsThreshold: this.scored.meetsThreshold });
        const record = setBuilt(scoredRecord, true);
        this._writeRecord(record);

        // Bridge to the scenario globals (07 §5, §6; 00 S3). A global alone opens no lock.
        writeGlobal(`landing_${this.pageId}_built`, true);
        writeGlobal(`landing_${this.pageId}_domain`, this.choices.domainId || '');
        this._attached = true;
        this._announce('Page attached.');
        this.gameResult = this.closeResult();
        this.complete(true);
    }

    // ── nested launch, exit ────────────────────────────────────────────────────
    /** Open the intel board (recon) on top; its close reopens the builder with the draft kept. */
    _openCaseFile() {
        const params = { mode: 'recon' };
        if (this.params.social) params.social = this.params.social;
        return this.launchChild('intel-board', params);
    }

    // ── step 6: inspect (the defender flip, 07 §3 step 6, §4, §6) ───────────────
    /** Open the inspect view: the sent page as the victim's browser, with focusable
     *  hot-spots. Tells are recomputed from the current choices; the stored tellsFound that
     *  still apply are pre-marked (07 §3). */
    _enterInspect() {
        if (!this._canInspect()) return;
        this._inspecting = true;
        this._buildSuspect();
        this._announce('Find the giveaways on your own page, as ' + this._firstName() + ' would see it.');
        this._renderAll();
        this.previewPane.querySelector('.lpb-hotspot')?.focus?.();
    }

    _buildSuspect() {
        this._suspect = buildSuspectPage(this.pageDef, { ...this._record(), choices: this.choices }, this._target());
        this._found = new Set(this._suspect.found);
        this._linkRevealed = this._found.has('hoverMismatch');
        if (this._suspect.allFound) this._inspectionComplete = true;
    }

    /** A pick on a preview region: reveal the giveaway(s) there, show the padlock decoy, or
     *  say what was fine (07 §6). */
    _pickRegion(name) {
        const s = this._suspect;
        if (!s || s.blocked) return;
        // The padlock is a decoy when it is shown: a padlock does not mean safe (07 §4).
        if (name === 'padlock' && s.padlockOn) {
            this._padlockDecoyShown = true;
            this._lastFine = '';
            this._announce(s.padlockDecoyLine);
            this._renderPanel();
            return;
        }
        const present = (s.byRegion[name] || []).filter((t) => s.presentIds.includes(t.id));
        if (!present.length) {
            this._lastFine = s.fineLines[name] || s.fineFallback;
            this._announce(this._lastFine);
            this._renderPanel();
            return;
        }
        let newly = false;
        for (const t of present) if (!this._found.has(t.id)) { this._found.add(t.id); newly = true; }
        this._lastFine = '';
        if (newly) this._afterFind(name);
        else this._renderPanel();
    }

    /** "Show the link target" reveals the hover mismatch, which has no preview element
     *  (07 §4, §6: the link tell is behind a button, not in the inert preview). */
    _showLinkTarget() {
        const s = this._suspect;
        if (!s || s.blocked || !s.tellsById.hoverMismatch) return;
        this._linkRevealed = true;
        if (!this._found.has('hoverMismatch')) {
            this._found.add('hoverMismatch');
            this._afterFind('link');
        } else {
            this._renderPanel();
        }
    }

    /** "Show me": reveal every giveaway and end the step (07 §6). */
    _showMe() {
        const s = this._suspect;
        if (!s || s.blocked) return;
        for (const id of s.presentIds) this._found.add(id);
        this._linkRevealed = true;
        this._inspectionComplete = true;
        this._lastFine = '';
        this._persistFound();
        this._renderAll();
        this._focusAfterInspect(null);
        this._announce('Every giveaway shown.');
    }

    _afterFind(focusRegion) {
        this._persistFound();
        this._playFoundCue();
        const total = this._suspect.presentIds.length;
        const n = this._found.size;
        if (n >= total) this._inspectionComplete = true;
        this._renderAll();
        this._focusAfterInspect(focusRegion);
        this._announce(this._inspectionComplete
            ? 'Every giveaway found. ' + n + ' of ' + total + '.'
            : 'Found ' + n + ' of ' + total + ' giveaways.');
    }

    /** Keep the keyboard in a sensible place after a re-render: the region's hot-spot (it was
     *  recreated), or, when the step has just finished, the Done button. */
    _focusAfterInspect(focusRegion) {
        if (this._inspectionComplete) {
            (this.panel.querySelector('[data-focus="done"]') ||
                this.panel.querySelector('[data-focus="show-me"]'))?.focus?.();
            return;
        }
        if (focusRegion && focusRegion !== 'link') {
            this.previewPane.querySelector(`[data-region="${focusRegion}"]`)?.focus?.();
        } else if (focusRegion === 'link') {
            (this.panel.querySelector('[data-focus="show-me"]') ||
                this.panel.querySelector('[data-focus="show-link"]'))?.focus?.();
        }
    }

    /** Persist the found tells into the record, keeping victim and the closed key set
     *  (07 §3, §5; N4 drops any id outside the nine). */
    _persistFound() {
        const existing = this._record();
        if (!existing) return;
        const found = [...this._found].filter((id) => TELL_IDS.includes(id));
        this._writeRecord(buildRecord({ ...existing, tellsFound: found }));
    }

    /** A soft "found it" cue reusing an existing UI click (07 §8); a no-op without sound. */
    _playFoundCue() {
        try { window.soundManager?.play?.('ui_click_1'); } catch (_e) { /* optional */ }
    }

    _renderInspectPanel() {
        const s = this._suspect;
        const panel = this.panel;
        panel.appendChild(h('section', { class: 'lpb-inspect-intro' },
            h('h3', { class: 'lpb-inspect-title', text: 'Find the giveaways' }),
            h('p', { class: 'lpb-inspect-help',
                text: 'This is your page as ' + this._firstName() + ' would see it. Select each part that gives it away.' })));

        if (!s || s.blocked) {
            panel.appendChild(h('p', { class: 'lpb-inspect-blocked', text: 'This page cannot be inspected.' }));
            return;
        }

        const total = s.presentIds.length;
        panel.appendChild(h('p', { class: 'lpb-inspect-progress', 'aria-live': 'polite',
            text: 'Found ' + this._found.size + ' of ' + total + ' giveaways.' }));

        const list = h('ul', { class: 'lpb-inspect-findings', 'aria-label': 'Giveaways found' });
        for (const t of s.tells) {
            if (!this._found.has(t.id)) continue;
            list.appendChild(h('li', { class: 'lpb-finding lpb-readable', 'data-tell': t.id, text: t.line }));
        }
        panel.appendChild(list);

        if (this._padlockDecoyShown) {
            panel.appendChild(h('p', { class: 'lpb-decoy-line', 'data-decoy': 'padlock', text: s.padlockDecoyLine }));
        }
        if (this._lastFine) {
            panel.appendChild(h('p', { class: 'lpb-fine-line', text: this._lastFine }));
        }

        const linkFound = this._found.has('hoverMismatch');
        const linkBtn = h('button', { type: 'button', class: 'lpb-link-btn minigame-button',
            'data-focus': 'show-link', disabled: linkFound ? true : undefined,
            text: linkFound ? 'Link target shown' : 'Show the link target' });
        if (!linkFound) this.addEventListener(linkBtn, 'click', (e) => { e.preventDefault?.(); this._showLinkTarget(); });
        panel.appendChild(linkBtn);

        const bar = h('div', { class: 'lpb-inspect-actions' });
        if (!this._inspectionComplete) {
            const showMe = h('button', { type: 'button', class: 'lpb-showme-btn minigame-button',
                'data-focus': 'show-me', text: 'Show me' });
            this.addEventListener(showMe, 'click', (e) => { e.preventDefault?.(); this._showMe(); });
            bar.appendChild(showMe);
        }
        panel.appendChild(bar);

        if (this._inspectionComplete) {
            panel.appendChild(this._closingCard());
            const done = h('button', { type: 'button', class: 'lpb-done-btn minigame-button',
                'data-focus': 'done', text: 'Done' });
            this.addEventListener(done, 'click', (e) => { e.preventDefault?.(); this.requestClose(); });
            panel.appendChild(done);
        }
    }

    /** The closing five-habits card (07 §3 step 6): the authored social.conceptCards entry,
     *  shown open. Falls back to the built-in five habits when the scenario authors none. */
    _closingCard() {
        const authored = this._card('five-habits');
        const card = authored && (authored.text || authored.image) ? authored
            : { id: 'five-habits', title: (authored && authored.title) || 'Five habits that beat this', text: FIVE_HABITS };
        const c = createConceptCard(card, {
            open: true, buttonLabel: 'The five habits that beat this',
            onToggle: (id, open) => { if (open) this._openCards.add(id); else this._openCards.delete(id); }
        });
        c.el.classList.add('lpb-closing-card');
        c.button.setAttribute('data-focus', 'card:five-habits');
        return c.el;
    }

    _canInspect() {
        const rec = this._record();
        return !!(rec && rec.victim);
    }

    _writeDraft() {
        const next = { ...this._drafts(), [this.pageId]: this._pick7(this.choices) };
        writeGlobal(DRAFTS_KEY, next, { openChat: false });
        window.stateSync?.sync?.();
    }

    _writeRecord(record) {
        const next = { ...this._pages(), [this.pageId]: record };
        writeGlobal(PAGES_KEY, next, { openChat: false });
        window.stateSync?.sync?.();
    }

    _announce(text) {
        this._live = text;
        if (this.live) this.live.textContent = text;
    }

    saveDraft() {
        if (this._invalid) return;
        this._writeDraft();
    }

    returnParams() {
        const p = { landingPageId: this.params.landingPageId, targetId: this.targetId };
        if (this.params.kitId) p.kitId = this.params.kitId;
        return p;
    }

    /** Close saves the draft first (07 §5: written on every change and on close). */
    close() {
        if (!this.gameState.isActive) return;
        this.saveDraft();
        super.close();
    }

    closeResult() {
        const rec = this._record();
        const info = linkInfoFor(rec, this.pageDef, this.params.kitId || null);
        return { ...info, saved: this._attached, inspectionComplete: this._inspectionComplete };
    }

    // ── keyboard ────────────────────────────────────────────────────────────
    _arrowNav(root, selector, onActivate = null) {
        this.addEventListener(root, 'keydown', (e) => {
            const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown';
            const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
            if (!fwd && !back) return;
            const items = [...root.querySelectorAll(selector)];
            const i = items.indexOf(document.activeElement);
            if (i === -1) return;
            const next = items[(i + (fwd ? 1 : items.length - 1)) % items.length];
            e.preventDefault?.();
            next?.focus?.();
            if (onActivate && next && next.getAttribute('role') === 'radio') onActivate(next);
        });
    }

    // ── test bridge ───────────────────────────────────────────────────────────
    getTestState() {
        const rec = this._record();
        const g = this.globals;
        const builtName = `landing_${this.pageId}_built`;
        const domainName = `landing_${this.pageId}_domain`;
        const forbidden = this.previewPane
            ? this.previewPane.querySelectorAll('a, form, input, textarea, select, button, iframe, script, [contenteditable]').length
            : 0;
        return {
            ...super.getTestState(),
            builder: {
                pageId: this.pageId,
                targetId: this.targetId,
                firstName: this._firstName(),
                profile: this.profile,
                invalid: this._invalid,
                step: this._currentStep(),
                editableRows: this._editableRows(),
                choices: this.choices ? this._pick7(this.choices) : null,
                scored: this.scored
                    ? { credibility: this.scored.credibility, meetsThreshold: this.scored.meetsThreshold,
                        gatesPassed: this.scored.gatesPassed, verdict: this.scored.verdict,
                        tells: this.scored.tells.length }
                    : null,
                stale: this._stale(),
                attachAvailable: !!(this.scored && !this._stale()),
                attachLabel: this.scored && !this._stale()
                    ? (this.scored.meetsThreshold ? 'Attach to email' : 'Attach anyway') : null,
                attached: this._attached,
                canInspect: this._canInspect(),
                inspecting: this._inspecting,
                inspectionComplete: this._inspectionComplete,
                inspect: this._inspecting ? {
                    found: [...this._found],
                    foundCount: this._found.size,
                    totalTells: this._suspect ? this._suspect.presentIds.length : 0,
                    presentIds: this._suspect ? this._suspect.presentIds.slice() : [],
                    linkRevealed: this._linkRevealed,
                    padlockDecoyShown: this._padlockDecoyShown,
                    complete: this._inspectionComplete,
                    blocked: this._suspect ? this._suspect.blocked : false
                } : null,
                recordBuilt: rec ? rec.built === true : false,
                recordCredibility: rec ? rec.credibility : null,
                recordTellsFound: rec && Array.isArray(rec.tellsFound) ? rec.tellsFound.slice() : null,
                builtGlobal: g[builtName] === true,
                domainGlobal: g[domainName] ?? null,
                openCards: [...this._openCards],
                live: this._live,
                previewForbidden: forbidden,
                typedInputs: this.container.querySelectorAll('input, textarea, select, [contenteditable="true"]').length
            }
        };
    }

    cleanup() {
        this.root = null;
        this.panel = null;
        this.previewPane = null;
        this._suspect = null;
        super.cleanup();
    }
}

export default LandingPageBuilderMinigame;
