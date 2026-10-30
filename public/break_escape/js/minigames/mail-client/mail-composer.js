// Mail composer: template parts with blanks, a blank picker fed from held
// evidence, and the pre-send gate (SE design 01 §2 "Compose", N10; contract
// 00 §10 "Composing: templates with blanks" and "Template and slot schema";
// 04 N11 runtime, via systems/phish-rules.js preSendGate). Packet P1-E2.
//
// What is here: the compose view that lets the player pick the To contact, a
// From/greeting/pretext/ask template per part, a subject, and fill each
// template's blanks from the evidence they hold, then builds the `message`
// (00 §3) and reports whether it can be sent. Judging the message, writing the
// sent record and the delivery job, drafts persistence and the Attach control
// for links are the mail bridge (P1-F) / Phase 5; the composer calls onSend
// with the built message and leaves those to the host.
//
// The option-building and gate helpers are pure and exported so the slice and
// the tests can read them without a DOM. A blank offers only what the player
// has found (a stale fact's value included); a blank with nothing held stays
// empty and blocks Send with the neutral pre-send line, which never names the
// missing fact (00 §10).

import { preSendGate, PRE_SEND_GATE_LINE, evaluateMessage, templateFlagLine } from '../../systems/phish-rules.js';

export { PRE_SEND_GATE_LINE };

const PARTS = ['from', 'greeting', 'pretext', 'ask'];
// The payload-kit kinds that attach as a file. `link` is a separate control (_renderLink,
// P5-G): it opens the landing-page builder (00 §1, 01 §2 Attach), not the file menu.
const ATTACHMENT_KINDS = new Set(['spreadsheet', 'document', 'pdf', 'archive', 'image']);
const NAME_SUFFIXES = ['_first', '_short', '_formal', '_full'];
const SE_INTEL_PREFIX = 'se_intel_';

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const arr = (v) => (Array.isArray(v) ? v : []);

/** Person id of a sender-name value id such as baker_full or leeds_baker_full. */
function personOfName(valueId) {
    if (!isStr(valueId)) return null;
    for (const suffix of NAME_SUFFIXES) {
        if (valueId.endsWith(suffix) && valueId.length > suffix.length) {
            return valueId.slice(0, -suffix.length);
        }
    }
    return null;
}

/** An entry's `about` is matched to a slot's `about`; a missing one on either side counts as null. */
function aboutMatches(entryAbout, slotAbout) {
    return (entryAbout ?? null) === (slotAbout ?? null);
}

/**
 * The bare ids of the facts the player holds: the `social.intelFacts` ids whose
 * `se_intel_<id>` global is true (00 §5; docs write bare ids, the engine the
 * prefixed name).
 */
export function heldFactIds(intelFacts, globals = {}) {
    const facts = isObject(intelFacts) ? intelFacts : {};
    return Object.keys(facts).filter((id) => globals[`${SE_INTEL_PREFIX}${id}`] === true);
}

/** Every `provides` entry of the held facts, flattened (each tagged with its factId). */
export function heldProvides(factIds, intelFacts) {
    const facts = isObject(intelFacts) ? intelFacts : {};
    const out = [];
    for (const id of arr(factIds)) {
        for (const p of arr(facts[id] && facts[id].provides)) {
            if (isObject(p) && isStr(p.type)) out.push({ ...p, factId: id });
        }
    }
    return out;
}

/**
 * Address options (00 §1 "an `address` entry carries either a `rule` or a fixed
 * `value`"): a rule entry builds one `<person>_address` option per person the
 * player holds a sender name for, with the address taken from `social.people`;
 * a fixed entry offers its one address. No rule entry held means no built
 * addresses, so `email_pattern` without a sender name builds nothing.
 */
function addressOptions(entries, people) {
    const peopleArr = arr(people);
    const addr = entries.filter((e) => e.type === 'address');
    const out = [];
    const seen = new Set();
    if (addr.some((e) => isStr(e.rule))) {
        for (const n of entries) {
            if (n.type !== 'name' || n.about !== 'sender') continue;
            const person = personOfName(n.value);
            if (!person) continue;
            const value = `${person}_address`;
            if (seen.has(value)) continue;
            const p = peopleArr.find((pp) => pp && pp.id === person);
            if (!p || !isStr(p.address)) continue;
            out.push({ value, label: p.address, kind: n.kind || 'generic' });
            seen.add(value);
        }
    }
    for (const e of addr) {
        if (!isStr(e.value) || seen.has(e.value)) continue;
        out.push({ value: e.value, label: e.label || e.value, kind: e.kind || 'generic' });
        seen.add(e.value);
    }
    return out;
}

/**
 * The options a blank offers: the `provides` entries of held facts whose `type`
 * matches the slot and whose `about` matches the slot's (00 §10 "Template and
 * slot schema", §1 "Filter rule"). Returns [{ value, label, kind }], de-duped
 * by value id. Address slots use the rule above.
 */
export function optionsForSlot(slot, { entries, people } = {}) {
    const held = arr(entries);
    if (!isObject(slot)) return [];
    if (slot.type === 'address') return addressOptions(held, people);
    const out = [];
    const seen = new Set();
    for (const e of held) {
        if (e.type !== slot.type || !aboutMatches(e.about, slot.about)) continue;
        if (!isStr(e.value) || seen.has(e.value)) continue;
        out.push({ value: e.value, label: e.label || e.value, kind: e.kind || 'generic' });
        seen.add(e.value);
    }
    return out;
}

function templateOf(templates, id) {
    return isObject(templates) && isStr(id) && isObject(templates[id]) ? templates[id] : null;
}

/** A subject's `requiresTemplate` as a list of template ids (a string is one id). */
function subjectTemplates(subject) {
    const r = subject && subject.requiresTemplate;
    if (isStr(r)) return [r];
    return Array.isArray(r) ? r.filter(isStr) : [];
}

/** The From template's name/address slots, found by type (robust to slot id naming). */
function fromSlots(template) {
    const slots = arr(template && template.slots);
    return {
        name: slots.find((s) => s.type === 'name') || null,
        address: slots.find((s) => s.type === 'address') || null
    };
}

// ─────────────────────────────────────────────────────────── the compose view

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

// Fonts rule (00 §address): a web/email address reads in the address font (--se-font-address),
// prose in the readable pixel font. The same regex mail-reader._appendBodyText uses, so a composed
// chip's address reads as it does in the inbox (E10 F-E10-9: "operations@quayholt.example" was in
// the pixel font). Nothing is hardcoded; detection is by the value itself.
const ADDRESS_RE = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s@]+@[^\s@]+\.[^\s@]+)/g;

/** Append `text` to `node`, wrapping any web/email address in a `.mail-blank-address` span. */
export function appendWithAddresses(node, text) {
    const s = typeof text === 'string' ? text : '';
    if (!s) return;
    ADDRESS_RE.lastIndex = 0;
    let last = 0;
    let m;
    while ((m = ADDRESS_RE.exec(s)) !== null) {
        let token = m[0];
        const start = m.index;
        const trail = (token.match(/[.,;:!?)\]}>'"]+$/) || [''])[0];
        if (trail) token = token.slice(0, token.length - trail.length);
        if (!token) continue;
        if (start > last) node.appendChild(document.createTextNode(s.slice(last, start)));
        node.appendChild(el('span', 'mail-blank-address', token));
        if (trail) node.appendChild(document.createTextNode(trail));
        last = start + m[0].length;
    }
    if (last === 0) { node.appendChild(document.createTextNode(s)); return; }
    if (last < s.length) node.appendChild(document.createTextNode(s.slice(last)));
}

/** True when the trimmed value is, in whole, a single web/email address (so it belongs in the
 *  address font): used to style a native <option> whose text is just an address. */
export function isAddressValue(text) {
    const t = String(text == null ? '' : text).trim();
    if (!t) return false;
    ADDRESS_RE.lastIndex = 0;
    const m = ADDRESS_RE.exec(t);
    return !!m && m.index === 0 && m[0].length === t.length;
}

export class MailComposer {
    /**
     * @param {HTMLElement} parent
     * @param {object} opts
     *   people, templates, phishTargets, intelFacts, payloadKit   scenario data (00 §11)
     *   landingPages   social.landingPages, for the `link` kind (01 N4)
     *   account        resolved sending account { id, address, displayName, spoofsFrom, person, burned }
     *   accounts       every resolved account of the device (the "Send as" choices)
     *   onSendAs       (accountId) => void           the player picked another account in "Send as"
     *   onAttachLink   (kit) => void                 a `link` kit was chosen whose page is not built
     *   contacts       visible contacts [{ id, name, addresses, role, targetId, character }]
     *   globals        global variables (held facts, burned_<id>)
     *   pushLayer      (close, name) => remover    the overlay's Esc-layer hook
     *   onSend         (message, composer) => void  called on a gated-open send
     *   onChange       (draft) => void               draft changed (for P1-F persistence)
     *   draft          restored draft to prime the form
     *   onClose        () => void                    the composer's Back control
     */
    constructor(parent, opts = {}) {
        this.opts = opts;
        this.people = arr(opts.people);
        this.templates = isObject(opts.templates) ? opts.templates : {};
        this.targets = new Map(arr(opts.phishTargets).filter((t) => t && isStr(t.id)).map((t) => [t.id, t]));
        this.intelFacts = isObject(opts.intelFacts) ? opts.intelFacts : {};
        this.payloadKit = arr(opts.payloadKit);
        this.landingPages = arr(opts.landingPages);
        this.account = opts.account || null;
        this.accounts = arr(opts.accounts);
        this.contacts = arr(opts.contacts);
        this.globals = isObject(opts.globals) ? opts.globals : {};
        // The live red-flag meter (01 "red-flag meter", 04 N) is per target: the
        // target's `redFlagMeter` boolean, defaulting to mailClient.showRedFlagMeter
        // (passed in as meterDefault). `evaluate` is the shell's live judge (bias +
        // evaluateMessage); absent, the composer judges from phish-rules directly.
        this.meterDefault = opts.meterDefault === true;
        this.evaluate = typeof opts.evaluate === 'function' ? opts.evaluate : null;
        // Free-text flavour body (01 §2 "Body", §N "Free-text flavour"; 00 §10, §13): when
        // the scenario turns it on (mailClient.bodyMode "freeText" or freeTextFlavour true),
        // the composer shows one extra box under the template parts. Whatever the player types
        // rides on the message as `freeText` and is shown in the sent mail, but it is never
        // judged (phish-rules reads only the template slots) and never reaches the ink (the
        // mail runner writes no variable from it), so the templated parts still decide the send.
        this.freeTextEnabled = opts.bodyMode === 'freeText' || opts.freeTextFlavour === true;
        this.freeText = '';

        this.heldIds = heldFactIds(this.intelFacts, this.globals);
        this.entries = heldProvides(this.heldIds, this.intelFacts);

        this.contactId = null;      // selected To contact id
        this.toAddress = '';        // email_to
        this.choice = {};           // part -> template id
        this.slots = {};            // slot id -> value id
        this.attachment = null;     // payload-kit item id
        this.link = null;           // payload-kit `link` item id (a built landing page)
        this.gate = { ok: false, reason: 'empty-blank', line: '' };
        this._picker = null;
        this._popPicker = null;
        this._draftRestored = false;

        this.root = el('div', 'mail-composer');
        this.root.setAttribute('role', 'form');
        this.root.setAttribute('aria-label', 'New message');
        parent.appendChild(this.root);

        this._restoreDraft(opts.draft);
        this._selectDefaultContact();
        // "Send as" changed mid-draft: keep what is still valid for the new account (R19 F19-1).
        // The draft being carried wins over an older unsent one the new account holds (lab R20
        // F20-3); the client passes none when the learner had not touched the form.
        this.carryNotice = '';
        this.edited = false;
        if (isObject(opts.carryDraft)) this._carryOver(opts.carryDraft);
        this.render();
    }

    /**
     * Carry a draft over from another account. A part is kept when the new account offers the
     * same option; otherwise it takes this account's default (or stays unchosen) and is named in
     * a one-line notice. Only the recipient, From, greeting, pretext, ask and subject can differ.
     */
    _carryOver(prev) {
        const cleared = [];
        const contact = this.contacts.find((c) => c && c.id === prev.contactId)
            || this.contacts.find((c) => c && isStr(prev.to) && arr(c.addresses).includes(prev.to));
        // Start clean for whichever recipient this account has, then lay the old choices on top.
        this.contactId = null;
        this._draftRestored = false;
        this.toAddress = '';
        this.choice = {};
        this.slots = {};
        this._subjectId = null;
        if (contact) {
            this.selectContact(contact.id, false);
            if (arr(contact.addresses).includes(prev.to)) this.toAddress = prev.to;
        } else {
            this._selectDefaultContact();
            if (isStr(prev.contactId) || isStr(prev.to)) cleared.push('To');
        }
        if (this.target) {
            const names = { from: 'From', greeting: 'greeting', pretext: 'pretext', ask: 'ask' };
            const was = isObject(prev.templates) ? prev.templates : {};
            for (const part of PARTS) {
                const id = was[part];
                if (!isStr(id)) continue;
                if (this.templateSet(part).includes(id)) {
                    this.choice[part] = id;
                    const tpl = templateOf(this.templates, id);
                    for (const sl of arr(tpl && tpl.slots)) {
                        if (isObject(prev.slots) && isStr(prev.slots[sl.id])) this.slots[sl.id] = prev.slots[sl.id];
                    }
                } else if (this.choice[part] !== id) {
                    cleared.push(names[part]);
                }
            }
            if (isStr(prev.subject)) {
                if (this.visibleSubjects().some((x) => x.id === prev.subject)) this._subjectId = prev.subject;
                else cleared.push('subject');
            }
        }
        if (isStr(prev.attachment)) this.attachment = prev.attachment;
        if (isStr(prev.link)) this.link = prev.link;
        if (isStr(prev.freeText)) this.freeText = prev.freeText;
        this._emitChange();
        if (cleared.length) this.carryNotice = `Cleared for this account: ${cleared.join(', ')}.`;
    }

    // ── state ──────────────────────────────────────────────────────────────

    get target() {
        // A judged follow-up (01 N8 "Write your reply. This one is judged",
        // #compose_reply:<targetId>) forces the target: the thread names a phishTargets
        // entry of the same character, judged like any other send, with inReplyTo set.
        if (isStr(this.opts.forceTargetId)) return this.targets.get(this.opts.forceTargetId) || null;
        const c = this.contacts.find((x) => x && x.id === this.contactId);
        return c && isStr(c.targetId) ? this.targets.get(c.targetId) || null : null;
    }

    get contact() {
        return this.contacts.find((x) => x && x.id === this.contactId) || null;
    }

    /** An account the ink has reported (`burned_<id>`, 00 §10a): shown greyed and cannot send. */
    isBurned(acct) {
        return !!acct && (acct.burned === true || this.globals[`burned_${acct.id}`] === true);
    }

    /** True when some other listed, unreported account may spoof the From (the hint then says Switch account). */
    get anotherSpoofs() {
        return !!this.spoofingAccount;
    }

    /** The first other listed, unreported account that may spoof the From, or null; the hint names it. */
    get spoofingAccount() {
        return this.accounts.find((a) => a && this.account && a.id !== this.account.id
            && a.spoofsFrom === true && !this.isBurned(a)) || null;
    }

    /** From is forced to the account (no claimed-From blanks) when it cannot spoof (00 §10a, 01 §2). */
    get fromForced() {
        return !(this.account && this.account.spoofsFrom === true);
    }

    /**
     * The default wording for a part the composer fills in for the player (every part but
     * the pretext, which is their deliberate choice). The calmest option wins — the lowest
     * `urgency` authored on the templates, ties broken by the set's order — so a one-click
     * send never lands on a pre-selected urgent line (E6 F3). A set whose templates author no
     * urgency (From, greeting) falls back to the first, as before.
     */
    _defaultTemplate(set) {
        const list = arr(set).filter(isStr);
        if (!list.length) return null;
        const RANK = { low: 0, medium: 1, high: 2 };
        let best = list[0];
        let bestRank = Infinity;
        for (const id of list) {
            const tpl = templateOf(this.templates, id);
            const u = tpl && isStr(tpl.urgency) ? RANK[tpl.urgency] : undefined;
            const rank = Number.isFinite(u) ? u : 0; // no urgency authored reads as calm
            if (rank < bestRank) { best = id; bestRank = rank; }
        }
        return best;
    }

    templateSet(part) {
        const t = this.target;
        const set = (t && isObject(t.templateSets) ? arr(t.templateSets[part]) : []).filter((id) => isStr(id));
        if (part === 'from' && this.fromForced) {
            // An account that cannot spoof forces the From to itself: offer only a
            // blank-free From (from_own, else the first slotless template authored).
            if (set.includes('from_own')) return ['from_own'];
            const slotless = set.find((id) => {
                const tpl = templateOf(this.templates, id);
                return tpl && !arr(tpl.slots).length;
            });
            return slotless ? [slotless] : (set.length ? [set[0]] : ['from_own']);
        }
        return set;
    }

    _selectDefaultContact() {
        if (this.contactId) return;
        // A judged follow-up opens pre-addressed to the character it answers (01 N8):
        // the host passes presetContactId (the contact of the reply's character), so the
        // To line is fixed and the player writes straight back into the thread.
        if (isStr(this.opts.presetContactId)) {
            const preset = this.contacts.find((c) => c && c.id === this.opts.presetContactId);
            if (preset) {
                if (this._draftRestored) {
                    this.contactId = preset.id;
                    if (!this.toAddress) this.toAddress = arr(preset.addresses)[0] || '';
                } else {
                    this.selectContact(preset.id, false);
                }
                return;
            }
        }
        const withTarget = this.contacts.find((c) => c && isStr(c.targetId));
        const first = withTarget || this.contacts[0] || null;
        if (!first) return;
        // A restored draft already chose its parts; binding a default recipient
        // through selectContact would reset choice/slots/attachment, so bind it
        // directly and keep the restored form (D3: the unsent draft must come back).
        if (this._draftRestored) {
            this.contactId = first.id;
            if (!this.toAddress) this.toAddress = arr(first.addresses)[0] || '';
            return;
        }
        this.selectContact(first.id, false);
    }

    selectContact(id, rerender = true) {
        const c = this.contacts.find((x) => x && x.id === id);
        this.contactId = c ? c.id : null;
        this.toAddress = c ? (arr(c.addresses)[0] || '') : '';
        this.choice = {};
        this.slots = {};
        this.attachment = null;
        this.link = null;
        for (const part of PARTS) {
            // The pretext is the player's deliberate choice (01 §2): leave it unchosen so
            // the composer opens with Send disabled until they pick one (P1-T). Every other
            // part is defaulted (From is forced, greeting/ask usually have one option).
            if (part === 'pretext' && this.templateSet(part).length > 1) continue;
            const set = this.templateSet(part);
            if (set.length) this.choice[part] = this._defaultTemplate(set);
        }
        if (rerender) { this._emitChange(); this.render(); }
    }

    chooseTemplate(part, id) {
        const set = this.templateSet(part);
        if (!set.includes(id)) return;
        // Drop slot values that belonged to the template being replaced.
        const old = templateOf(this.templates, this.choice[part]);
        for (const s of arr(old && old.slots)) delete this.slots[s.id];
        this.choice[part] = id;
        // P5-7: a subject bound to the template just chosen becomes the subject, so changing the
        // pretext changes the subject with it. The learner can still pick another offered one.
        const bound = this.visibleSubjects().find((s) => subjectTemplates(s).includes(id));
        if (bound) this._subjectId = bound.id;
        this._emitChange();
        this.render();
    }

    setSlot(slotId, value) {
        if (isStr(value)) this.slots[slotId] = value; else delete this.slots[slotId];
        this._emitChange();
        this.render();
    }

    setAttachment(kitId) {
        this.attachment = isStr(kitId) ? kitId : null;
        this._emitChange();
        this.render();
    }

    /**
     * Update the unscored free-text flavour (01 §2 Body). It changes no gate, no judged
     * factor and no meter, so it does not re-render (that would drop the caret mid-type);
     * it only updates state and saves the draft.
     */
    setFreeText(text) {
        this.freeText = typeof text === 'string' ? text : '';
        this._emitChange();
    }

    /** The landing-page definition for a `link` kit, or null. */
    _pageOf(kit) {
        if (!kit || !isStr(kit.landingPageId)) return null;
        return this.landingPages.find((p) => p && p.id === kit.landingPageId) || null;
    }

    /** The saved page record (se_landing_pages[pageId]) for a `link` kit, or null. */
    _recordOf(kit) {
        if (!kit || !isStr(kit.landingPageId)) return null;
        const pages = isObject(this.globals.se_landing_pages) ? this.globals.se_landing_pages : null;
        return pages && isObject(pages[kit.landingPageId]) ? pages[kit.landingPageId] : null;
    }

    /** The `link` kits offered for the current target: the kit's page lists this target (01 N4). */
    linkKitsForTarget() {
        const t = this.target;
        if (!t) return [];
        return this.payloadKit.filter((k) => {
            if (!k || k.kind !== 'link' || !isStr(k.landingPageId)) return false;
            const page = this._pageOf(k);
            return page && isObject(page.targets) && Object.prototype.hasOwnProperty.call(page.targets, t.id);
        });
    }

    /**
     * Choose a `link` kit (01 N4). A built page attaches at once; an unbuilt one asks the
     * host to open the builder (onAttachLink), which returns here and attaches on close when
     * the page is now built. Choosing the same, already-attached kit detaches it.
     */
    setLink(kit) {
        if (!kit || !isStr(kit.id)) { this.link = null; this._emitChange(); this.render(); return; }
        if (this.link === kit.id) { this.link = null; this._emitChange(); this.render(); return; }
        const rec = this._recordOf(kit);
        if (rec && rec.built === true) {
            this.link = kit.id;
            this._emitChange();
            this.render();
            return;
        }
        // Not built yet: hand off to the host to launch the builder.
        try { this.opts.onAttachLink?.(kit); } catch (err) { console.error('composer onAttachLink failed:', err); }
    }

    /** Called by the host after the builder closes: attach the link if its page is now built. */
    attachLinkIfBuilt(kitId) {
        const kit = this.payloadKit.find((k) => k && k.id === kitId && k.kind === 'link');
        const rec = this._recordOf(kit);
        if (kit && rec && rec.built === true) {
            this.link = kit.id;
            this._emitChange();
        }
        if (this.root) this.render();
    }

    /** Every slot across the chosen templates, as [{ part, slot }]. */
    activeSlots() {
        const out = [];
        for (const part of PARTS) {
            const tpl = templateOf(this.templates, this.choice[part]);
            for (const s of arr(tpl && tpl.slots)) out.push({ part, slot: s });
        }
        return out;
    }

    optionsFor(slot) {
        return optionsForSlot(slot, { entries: this.entries, people: this.people });
    }

    /**
     * A template's text with its blanks shown filled in rather than as raw
     * `{placeholders}` (A4). A chosen blank reads as its evidence label; an unfilled
     * blank reads as its slot label in brackets ("[name to greet them by]"), never a
     * value the player has not found; account tokens read as the sending account.
     */
    _fillPreview(tpl) {
        if (!isObject(tpl) || !isStr(tpl.text)) return tpl && isStr(tpl.text) ? tpl.text : '';
        const slotById = {};
        for (const s of arr(tpl.slots)) if (s && isStr(s.id)) slotById[s.id] = s;
        return String(tpl.text).replace(/\{([a-zA-Z0-9_]+)\}/g, (whole, key) => {
            if (key === 'account_name') return this.account ? (this.account.displayName || this.account.address || '') : '';
            if (key === 'account_address') return this.account ? (this.account.address || '') : '';
            const slot = slotById[key];
            const chosen = this.slots[key];
            if (isStr(chosen)) {
                const opt = slot ? this.optionsFor(slot).find((o) => o.value === chosen) : null;
                if (opt) return opt.label;
                const e = this.entries.find((x) => x.value === chosen);
                return e ? (e.label || e.value) : chosen;
            }
            const label = slot && isStr(slot.label) ? slot.label : key;
            return `[${label}]`;
        });
    }

    /** Whether the live red-flag meter shows for the current target (01, 04). */
    _meterOn() {
        const t = this.target;
        if (!t) return false;
        return typeof t.redFlagMeter === 'boolean' ? t.redFlagMeter : this.meterDefault;
    }

    /** Judge the current draft for the meter: the shell's bias-aware judge, else phish-rules direct. */
    _liveResult() {
        const target = this.target;
        if (!target) return null;
        const message = this.buildMessage();
        try {
            if (this.evaluate) return this.evaluate(message) || null;
            const ctx = { accounts: this.accounts, people: this.people, templates: this.templates, payloadKit: this.payloadKit };
            return evaluateMessage(target, message, ctx);
        } catch (err) {
            console.error('composer meter judge failed:', err);
            return null;
        }
    }

    /**
     * Whether the forged sender in the From line is still a placeholder, so the forged-From
     * warning would name a name and address the player has not chosen yet (E6/E7 F1). A From
     * forced to the sending account is not a placeholder; a spoofable From with its name or
     * address blank is.
     */
    _senderUnset() {
        if (this.fromForced) return false;
        const fromTpl = templateOf(this.templates, this.choice.from);
        const fs = fromSlots(fromTpl);
        if (fs.name && !isStr(this.slots[fs.name.id])) return true;
        if (fs.address && !isStr(this.slots[fs.address.id])) return true;
        return false;
    }

    /**
     * The line the meter shows as advice once a forged, trusted sender is chosen: the target's
     * own senderTrust redFlag text (which describes the forgery and why it reads as trusted),
     * or a plain fallback. Presented as advice, not a fault (E6/E7 F1).
     */
    _forgedFromAdvice() {
        const t = this.target;
        const fs = t && isObject(t.factorStrings) ? t.factorStrings.senderTrust : null;
        if (fs && isStr(fs.redFlag)) return fs.redFlag;
        return 'The From line is forged to show a name and address they trust — that is what makes this land.';
    }

    /**
     * The red flags the current draft would raise, de-duped (00 §2, §13: failed factors), plus
     * any advice (E6/E7 F1). The forged-From warning is held back while the sender is still a
     * placeholder, and returns as advice — not a counted fault — once a trusted sender is forged,
     * so the meter agrees with the flip and debrief instead of ending at "reads clean".
     */
    /**
     * batch-12 item 11: the meter's "fewer flags means harder to spot" line says nothing for a
     * hidden-line brief, which scores zero visible flags on purpose (E13 F-6). A template may set
     * its own `meterHint` (or '' to drop it), and a chosen template that carries a hidden line
     * (`hiddenText`) drops the default line too. An explicit opts.meterHint still wins.
     */
    _meterHint() {
        for (const part of PARTS) {
            const tpl = templateOf(this.templates, this.choice[part]);
            if (tpl && typeof tpl.meterHint === 'string') return tpl.meterHint;
        }
        if (typeof this.opts.meterHint === 'string') return this.opts.meterHint;
        const hidesLine = PARTS.some((part) => {
            const tpl = templateOf(this.templates, this.choice[part]);
            return tpl && isStr(tpl.hiddenText);
        });
        return hidesLine ? '' : 'Fewer flags means harder to spot.';
    }

    _meterData() {
        if (!this._meterOn()) return { on: false, flags: [], advice: [], clean: false, landed: false };
        const result = this._liveResult();
        const senderUnset = this._senderUnset();
        const flags = [];
        const seen = new Set();
        const push = (s) => { if (isStr(s) && !seen.has(s)) { seen.add(s); flags.push(s); } };
        if (result) {
            if (result.open && result.open.opened === false) push(result.openLine || 'Nothing here would make them open it.');
            for (const f of arr(result.factors)) {
                if (f.pass || !isStr(f.redFlag)) continue;
                // Hold back the forged-From warning while no sender has been picked: it would
                // name an address the player has not chosen. It returns below as advice.
                if (f.id === 'senderTrust' && senderUnset) continue;
                push(f.redFlag);
            }
            // P5-8: the tells the chosen wording carries (templates[].flags: secrecy, borrowed
            // authority), so the meter names what the flip and the defend card name.
            for (const id of arr(result.templateFlags)) push(templateFlagLine(id, this.target));
        }
        const advice = [];
        if (result && arr(result.tells).includes('senderTrust')) {
            const line = this._forgedFromAdvice();
            if (isStr(line)) advice.push(line);
        }
        return { on: true, flags, advice, clean: flags.length === 0 && advice.length === 0, landed: !!(result && result.landed) };
    }

    /** The composed message (00 §3). */
    buildMessage() {
        const fromTpl = templateOf(this.templates, this.choice.from);
        const fs = fromSlots(fromTpl);
        let headerFrom;
        if (!fromTpl || !fs.name) {
            headerFrom = { account: true };
        } else {
            headerFrom = {
                name: this.slots[fs.name.id] || null,
                address: fs.address ? (this.slots[fs.address.id] || null) : null
            };
        }
        const kit = this.payloadKit.find((k) => k && k.id === this.attachment) || null;
        // The link is a kitId string (01 N4); the bridge fills linkInfo from the saved
        // page record before judging. linkText comes from the page the kit names.
        const linkKit = isStr(this.link) ? this.payloadKit.find((k) => k && k.id === this.link && k.kind === 'link') : null;
        const linkPage = linkKit ? this._pageOf(linkKit) : null;
        return {
            fromAccount: this.account ? this.account.id : null,
            to: this.toAddress || '',
            targetId: isStr(this.opts.forceTargetId)
                ? this.opts.forceTargetId
                : (this.contact && isStr(this.contact.targetId) ? this.contact.targetId : null),
            subject: this.subjectId || null,
            headerFrom,
            templates: { ...this.choice },
            slots: { ...this.slots },
            attachment: kit ? kit.id : null,
            attachmentKind: kit ? kit.kind : null,
            link: linkKit ? linkKit.id : null,
            linkText: linkPage && isStr(linkPage.linkText) ? linkPage.linkText : null,
            linkInfo: null,
            // Unscored flavour (01 §2 Body, 00 §13): carried so the sent mail shows it, read by
            // neither the judge nor the ink. Only present when the scenario enabled the box.
            freeText: this.freeTextEnabled && isStr(this.freeText) ? this.freeText : null,
            // A judged follow-up carries the id of the reply it answers (00 §10,
            // email_in_reply_to); empty for a fresh crafted message.
            inReplyTo: isStr(this.opts.inReplyTo) ? this.opts.inReplyTo : ''
        };
    }

    /** Recompute the pre-send gate (04 N11 via phish-rules.preSendGate). */
    evaluateGate() {
        if (this.isBurned(this.account)) {
            this.gate = { ok: false, reason: 'account-burned',
                line: 'This address has been reported. Send as another account.' };
            return this.gate;
        }
        const target = this.target;
        if (!target) {
            // A non-target contact can be written to but is never judged (01 §2 To).
            this.gate = { ok: !!this.contactId, reason: this.contactId ? null : 'no-recipient',
                line: this.contactId ? '' : 'Pick someone to write to.' };
            return this.gate;
        }
        // The pretext is chosen deliberately: block Send until the player picks one, so a
        // single click never lands on the default wording (P1-T). preSendGate does not
        // see an unchosen part, so the composer gates it here.
        if (this.templateSet('pretext').length > 1 && !isStr(this.choice.pretext)) {
            this.gate = { ok: false, reason: 'pretext-unchosen', line: 'Choose how to word your message.' };
            return this.gate;
        }
        const options = {};
        for (const { slot } of this.activeSlots()) options[slot.id] = this.optionsFor(slot).length;
        const held = { facts: this.heldIds, options };
        const message = this.buildMessage();
        const ctx = { templates: this.templates };
        this.gate = preSendGate(target, message, ctx, held);
        return this.gate;
    }

    /**
     * The target's subjects the player may use: a subject with `requires` (intel fact ids) is
     * offered only once every one is held, so a subject naming a detail (E1's "Invoice
     * INV-2217") is not handed over before it is found (P3 N15). If that would leave none, the
     * full list stands, so a target always has a subject.
     */
    visibleSubjects() {
        const t = this.target;
        const all = arr(t && t.subjects);
        const held = arr(this.heldIds);
        const intelOk = (s) => !Array.isArray(s?.requires) || s.requires.every((id) => held.includes(id));
        // P5-7: a subject with `requiresTemplate` (template ids) is offered only while one of
        // those templates is chosen, so the subject follows the pretext ("Action needed: sign
        // in again" never goes out on the newsletter pretext). If that would leave none, the
        // template binding is dropped first, then the intel one.
        const chosen = Object.values(this.choice || {}).filter(isStr);
        const tplOk = (s) => {
            const need = subjectTemplates(s);
            return !need.length || need.some((id) => chosen.includes(id));
        };
        const ok = all.filter((s) => intelOk(s) && tplOk(s));
        if (ok.length) return ok;
        const intelOnly = all.filter(intelOk);
        return intelOnly.length ? intelOnly : all;
    }

    get subjectId() {
        const subjects = this.visibleSubjects();
        if (!subjects.length) return null;
        if (this._subjectId && subjects.some((s) => s.id === this._subjectId)) return this._subjectId;
        return subjects[0].id;
    }

    setSubject(id) {
        this._subjectId = id;
        this._emitChange();
        this.render();
    }

    _restoreDraft(draft) {
        if (!isObject(draft)) return;
        if (isStr(draft.to)) this.toAddress = draft.to;
        if (isStr(draft.subject)) this._subjectId = draft.subject;
        if (isObject(draft.templates)) this.choice = { ...draft.templates };
        if (isObject(draft.slots)) this.slots = { ...draft.slots };
        if (isStr(draft.attachment)) this.attachment = draft.attachment;
        if (isStr(draft.link)) this.link = draft.link;
        if (isStr(draft.freeText)) this.freeText = draft.freeText;
        if (isStr(draft.contactId)) this.contactId = draft.contactId;
        // A draft saved before contactId was persisted (or a non-target one)
        // still names its recipient by address: recover it from `to` (D3).
        else if (isStr(draft.to)) {
            const c = this.contacts.find((x) => x && arr(x.addresses).includes(draft.to));
            if (c) this.contactId = c.id;
        }
        // Mark the form as restored so _selectDefaultContact does not reset it.
        this._draftRestored = isStr(draft.to) || isStr(draft.contactId) ||
            (isObject(draft.templates) && Object.keys(draft.templates).length > 0) ||
            isStr(draft.attachment) || isStr(draft.link) || (isObject(draft.slots) && Object.keys(draft.slots).length > 0);
    }

    draft() {
        return {
            contactId: this.contactId,
            to: this.toAddress,
            subject: this.subjectId,
            templates: { ...this.choice },
            slots: { ...this.slots },
            attachment: this.attachment,
            link: this.link,
            freeText: this.freeTextEnabled && isStr(this.freeText) ? this.freeText : ''
        };
    }

    _emitChange() {
        this.carryNotice = '';
        this.edited = true;
        try { this.opts.onChange?.(this.draft()); } catch (err) { console.error('composer onChange failed:', err); }
    }

    send() {
        const gate = this.evaluateGate();
        if (!gate.ok) { this.render(); return false; }
        const message = this.buildMessage();
        try { this.opts.onSend?.(message, this); } catch (err) { console.error('composer onSend failed:', err); }
        return true;
    }

    // ── rendering ────────────────────────────────────────────────────────────

    /** A selector that finds the control again after render() rebuilds the form, or null. */
    _focusKey() {
        const a = typeof document !== 'undefined' ? document.activeElement : null;
        if (!a || !this.root.contains?.(a) || a === this.root) return null;
        if (a.id) return `#${a.id}`;
        if (a.classList.contains('mail-blank') && a.dataset.slot) return `.mail-blank[data-slot="${a.dataset.slot}"]`;
        if (a.classList.contains('mail-compose-template') && a.dataset.part) return `.mail-compose-template[data-part="${a.dataset.part}"]`;
        for (const c of ['mail-compose-send', 'mail-compose-back']) if (a.classList.contains(c)) return `.${c}`;
        return null;
    }

    render() {
        const focusKey = this._focusKey();
        this._closePicker();
        this.evaluateGate();
        this.root.textContent = '';
        this.root.appendChild(el('h2', 'mail-compose-title', 'New message'));
        this._renderSendAs();
        if (this.carryNotice) this.root.appendChild(el('p', 'mail-compose-hint mail-compose-carry', this.carryNotice));
        this._renderTo();
        if (this.contact && !this.target) {
            this.root.appendChild(el('p', 'mail-compose-note',
                'This recipient is not a phishing target: the message is kept in Sent but is not judged and delivers nothing.'));
        }
        if (this.target) {
            this._renderFrom();
            this._renderSubject();
            this._renderBody();
            this._renderFreeText();
            this._renderAttach();
            this._renderLink();
            this._renderMeter();
        }
        this._renderSend();
        // Rebuilding the form drops focus to the page; put it back where the player was.
        if (focusKey) {
            const again = this.root.querySelector(focusKey);
            if (again && !again.disabled) again.focus?.();
        }
    }

    /**
     * True when the From line only repeats the sending account, so the account row
     * carries it and no separate From row is drawn: the From is forced to the
     * account, or there is a single wording with no blanks to fill. A single
     * wording that HAS blanks must still be drawn, so those blanks appear on screen
     * and the pre-send gate (which counts them) and the screen agree (F-1).
     */
    _fromIsOwn() {
        if (!this.target) return false;
        if (this.fromForced) return true;
        const set = this.templateSet('from');
        if (set.length > 1) return false;
        const tpl = templateOf(this.templates, this.choice.from || set[0]);
        return !arr(tpl && tpl.slots).length;
    }

    _renderSendAs() {
        const row = el('div', 'mail-compose-row mail-compose-sendas');
        row.appendChild(el('span', 'mail-compose-label', 'Send as'));
        const acct = this.account;
        const burned = this.isBurned(acct);
        const text = (a) => `${a.displayName || a.address} <${a.address}>${this.isBurned(a) ? ' (this address has been reported)' : ''}`;
        const line = el('span', 'mail-compose-value',
            acct ? `${acct.displayName || acct.address} <${acct.address}>` : 'No account');
        if (burned) { line.classList.add('mail-burned'); line.append(' — this address has been reported'); }
        const hasSelect = this.accounts.length > 1 && !!acct;
        if (hasSelect) {
            // Several accounts on this device (P1-L): a select. A reported one stays listed but cannot be picked.
            const select = el('select', 'mail-compose-sendas-select');
            select.id = 'mail-compose-sendas';
            select.setAttribute('aria-label', 'Send as');
            for (const a of this.accounts) {
                const opt = el('option', null, text(a));
                opt.value = a.id;
                if (this.isBurned(a) && a.id !== acct.id) opt.disabled = true;
                if (a.id === acct.id) opt.selected = true;
                select.appendChild(opt);
            }
            select.addEventListener('change', () => {
                if (select.value === acct.id) return;
                try { this.opts.onSendAs?.(select.value); } catch (err) { console.error('composer onSendAs failed:', err); }
            });
            if (burned) select.classList.add('mail-burned');
            row.appendChild(select);
            line.textContent = '';
            line.className = 'mail-compose-value';
        }
        // One row for the address: when the From is just this account, the account row carries it.
        if (this._fromIsOwn()) line.classList.add('mail-compose-from-own');
        // The hint shows as soon as the account is chosen, even before a recipient is picked (R18 F-b).
        if (this.fromForced) {
            const other = this.spoofingAccount;
            line.append(el('span', 'mail-compose-hint', other
                ? ` You can only send as yourself from this address. Switch to the ${other.displayName || other.address} account to send as someone else.`
                : ' You can only send as yourself from this address.'));
        }
        if (!hasSelect || line.textContent) row.appendChild(line);
        this.root.appendChild(row);
    }

    _renderTo() {
        const row = el('div', 'mail-compose-row');
        const id = 'mail-compose-to';
        const label = el('label', 'mail-compose-label', 'To');
        label.htmlFor = id;
        const select = el('select', 'mail-compose-to');
        select.id = id;
        if (!this.contacts.length) {
            const opt = el('option', null, 'Nobody to write to yet — find who to send it to first.');
            opt.value = '';
            select.append(opt);
            select.disabled = true;
        }
        for (const c of this.contacts) {
            const opt = el('option', null, `${c.name || c.id}${c.role ? ` (${c.role})` : ''}`);
            opt.value = c.id;
            if (c.id === this.contactId) opt.selected = true;
            select.appendChild(opt);
        }
        select.addEventListener('change', () => this.selectContact(select.value));
        row.append(label, select);
        this.root.appendChild(row);
    }

    _renderFrom() {
        if (this._fromIsOwn()) {
            // The address is already on the "Send as" row; record the chosen wording and show no second row.
            if (!this.choice.from) this.choice.from = this._defaultTemplate(this.templateSet('from')) || 'from_own';
            return;
        }
        const row = el('div', 'mail-compose-row mail-compose-part');
        row.appendChild(el('span', 'mail-compose-label', 'From'));
        this._renderPartSelect(row, 'from');
        this.root.appendChild(row);
        this._renderPartBlanks('from');
    }

    _renderSubject() {
        const subjects = this.visibleSubjects();
        if (!subjects.length) return;
        const row = el('div', 'mail-compose-row');
        const id = 'mail-compose-subject';
        const label = el('label', 'mail-compose-label', 'Subject');
        label.htmlFor = id;
        const select = el('select', 'mail-compose-subject');
        select.id = id;
        for (const s of subjects) {
            const opt = el('option', null, s.text || s.id);
            opt.value = s.id;
            if (s.id === this.subjectId) opt.selected = true;
            select.appendChild(opt);
        }
        select.addEventListener('change', () => this.setSubject(select.value));
        row.append(label, select);
        this.root.appendChild(row);
    }

    _renderBody() {
        for (const part of ['greeting', 'pretext', 'ask']) {
            const set = this.templateSet(part);
            if (!set.length) continue;
            const row = el('div', 'mail-compose-row mail-compose-part');
            row.dataset.part = part;
            const label = part.charAt(0).toUpperCase() + part.slice(1);
            row.appendChild(el('span', 'mail-compose-label', label));
            if (set.length <= 1) {
                // A single option is not a choice: show the wording as plain text and
                // record it, not a greyed-out disabled control (P1-T).
                if (!this.choice[part]) this.choice[part] = set[0];
                const only = templateOf(this.templates, set[0]);
                // An address in a single-option fixed value (a lone From sender, a reply-to) reads
                // in the address font too, like the chosen-blank and select cases (E10 F-E10-9).
                const fixed = el('p', 'mail-compose-value mail-compose-fixed');
                appendWithAddresses(fixed, String(only ? this._fillPreview(only) : set[0]));
                row.appendChild(fixed);
            } else {
                this._renderPartSelect(row, part);
            }
            this.root.appendChild(row);
            this._renderPartBlanks(part);
            // E13 B2 finding 12: a template may carry a line in white text "for the assistant"
            // (hiddenText). It is invisible to the reader by design, so choosing the hidden-line
            // pretext changed nothing in the preview. Show it as a labelled, visually distinct
            // "hidden from the reader" line so the learner sees what their choice plants. Nothing
            // renders for a template without hiddenText (every existing one), so defaults hold.
            const chosenTpl = templateOf(this.templates, this.choice[part]);
            if (chosenTpl && isStr(chosenTpl.hiddenText) && chosenTpl.hiddenText.trim()) {
                const hid = el('div', 'mail-compose-hidden');
                hid.dataset.part = part;
                hid.appendChild(el('span', 'mail-compose-hidden-label', 'Hidden from the reader'));
                const body = el('p', 'mail-compose-hidden-text');
                appendWithAddresses(body, chosenTpl.hiddenText);
                hid.appendChild(body);
                this.root.appendChild(hid);
            }
        }
    }

    _renderPartSelect(row, part) {
        const set = this.templateSet(part);
        const select = el('select', 'mail-compose-template');
        select.dataset.part = part;
        select.setAttribute('aria-label', `${part} wording`);
        if (!isStr(this.choice[part])) {
            // No option chosen yet (the pretext): a placeholder the player must act on.
            const ph = el('option', null, 'Choose how to word this…');
            ph.value = '';
            ph.disabled = true;
            ph.selected = true;
            select.appendChild(ph);
        }
        for (const id of set) {
            const tpl = templateOf(this.templates, id);
            // batch-12 item 9: a template may name its own `optionLabel` for the dropdown, so the
            // chooser can read as a short choice while the body stays full prose (and the label text
            // never leaks into the sent body). Default: the filled preview, as before.
            const preview = tpl && isStr(tpl.optionLabel) ? tpl.optionLabel : (tpl ? this._fillPreview(tpl) : id);
            const opt = el('option', null, preview);
            opt.value = id;
            // A native <option> cannot split fonts, but one whose whole text is an address (a
            // From sender address) should read in the address font, not the pixel font (E10 F-E10-9).
            if (isAddressValue(preview)) {
                opt.classList.add('mail-compose-template-address');
                opt.style.fontFamily = 'var(--se-font-address)';
            }
            if (id === this.choice[part]) {
                opt.selected = true;
                // Reflect the selected option's face on the closed select box.
                select.style.fontFamily = isAddressValue(preview) ? 'var(--se-font-address)' : '';
            }
            select.appendChild(opt);
        }
        select.addEventListener('change', () => this.chooseTemplate(part, select.value));
        row.appendChild(select);
    }

    /** The collapsed "Stuck?" disclosure naming where to look, never the value. */
    _stuckPointer(text) {
        const stuck = el('details', 'mail-blank-stuck');
        stuck.append(el('summary', 'mail-blank-stuck-summary', 'Stuck? Show me where to look'),
            el('span', 'mail-blank-stuck-text', text));
        return stuck;
    }

    _renderPartBlanks(part) {
        const tpl = templateOf(this.templates, this.choice[part]);
        const slots = arr(tpl && tpl.slots);
        if (!slots.length) return;
        const wrap = el('div', 'mail-compose-blanks');
        wrap.dataset.part = part;
        for (const slot of slots) {
            const options = this.optionsFor(slot);
            const blankLabel = isStr(slot.label) ? slot.label : slot.id;
            const field = el('div', 'mail-blank-field');
            field.dataset.slot = slot.id;
            const btn = el('button', 'mail-blank minigame-button');
            btn.type = 'button';
            btn.dataset.slot = slot.id;
            const chosen = this.slots[slot.id];
            const chosenOpt = options.find((o) => o.value === chosen);
            if (!options.length) {
                btn.textContent = `${blankLabel}: no evidence yet`;
                btn.disabled = true;
                btn.dataset.empty = 'true';
                field.appendChild(btn);
                // The neutral pre-send line, beside the empty blank, naming nothing (00 §10).
                field.appendChild(el('p', 'mail-blank-gate', PRE_SEND_GATE_LINE));
                // Optional where-to-look pointer from the template slot (lab R15 N5), behind
                // the same "Stuck?" disclosure the Case file board uses. It names a source,
                // never the value, so the gate line itself stays neutral.
                if (isStr(slot.stuck) && slot.stuck.trim()) field.appendChild(this._stuckPointer(slot.stuck));
            } else {
                if (chosenOpt) {
                    // The label prefix stays in the readable pixel font; an address in the chosen
                    // value (a From sender address, a reply-to) renders in the address font.
                    btn.appendChild(document.createTextNode(`${blankLabel}: `));
                    appendWithAddresses(btn, String(chosenOpt.label ?? ''));
                } else {
                    btn.textContent = `${blankLabel}: choose…`;
                }
                btn.dataset.chosen = chosen || '';
                btn.setAttribute('aria-haspopup', 'listbox');
                btn.addEventListener('click', () => this.openPicker(slot, btn));
                field.appendChild(btn);
                // A blank that already offers only the wrong options (lab R16 N9): the slot's
                // stuckUntil { target, value, text } shows a pointer for that target until the
                // option that earns the right sender is held.
                const su = slot.stuckUntil;
                if (isObject(su) && isStr(su.text) && su.text.trim() && isStr(su.value)
                    && (!isStr(su.target) || (this.target && this.target.id === su.target))
                    && !options.some((o) => o.value === su.value)) {
                    field.appendChild(this._stuckPointer(su.text));
                }
            }
            wrap.appendChild(field);
        }
        this.root.appendChild(wrap);
    }

    /**
     * The unscored free-text flavour box (01 §2 Body). Shown only when the scenario enabled it.
     * A label and help line say plainly that it is not checked, so the player never mistakes it
     * for a judged part. Typing updates state without a re-render, so the caret stays put.
     */
    _renderFreeText() {
        if (!this.freeTextEnabled) return;
        const row = el('div', 'mail-compose-row mail-compose-freetext-row');
        const id = 'mail-compose-freetext';
        const label = el('label', 'mail-compose-label', 'Your own words');
        label.htmlFor = id;
        const field = el('div', 'mail-compose-freetext-field');
        const area = el('textarea', 'mail-compose-freetext');
        area.id = id;
        area.rows = 3;
        area.placeholder = 'Add anything in your own words (optional).';
        area.value = isStr(this.freeText) ? this.freeText : '';
        const help = el('p', 'mail-compose-freetext-help',
            'Flavour only. This is shown in the message but is not checked, and the recipient never reads it to decide.');
        help.id = 'mail-compose-freetext-help';
        area.setAttribute('aria-describedby', help.id);
        area.addEventListener('input', () => this.setFreeText(area.value));
        field.append(area, help);
        row.append(label, field);
        this.root.appendChild(row);
    }

    _renderAttach() {
        const items = this.payloadKit.filter((k) => k && ATTACHMENT_KINDS.has(k.kind));
        if (!items.length) return;
        const row = el('div', 'mail-compose-row');
        const id = 'mail-compose-attach';
        const label = el('label', 'mail-compose-label', 'Attach');
        label.htmlFor = id;
        const select = el('select', 'mail-compose-attach');
        select.id = id;
        const none = el('option', null, 'No attachment');
        none.value = '';
        select.appendChild(none);
        for (const k of items) {
            const opt = el('option', null, `${k.label || k.id} (${k.kind})`);
            opt.value = k.id;
            if (k.id === this.attachment) opt.selected = true;
            select.appendChild(opt);
        }
        select.addEventListener('change', () => this.setAttachment(select.value));
        row.append(label, select);
        this.root.appendChild(row);
    }

    /**
     * The `link` kind (01 N4): a button per landing-page link offered for this target. A built
     * page attaches at once; an unbuilt one opens the builder through the host (onAttachLink).
     * The link is never a blank and never a real URL.
     */
    _renderLink() {
        const kits = this.linkKitsForTarget();
        if (!kits.length) return;
        const row = el('div', 'mail-compose-row mail-compose-link-row');
        row.append(el('span', 'mail-compose-label', 'Link'));
        for (const k of kits) {
            const rec = this._recordOf(k);
            const built = !!(rec && rec.built === true);
            const attached = this.link === k.id;
            const btn = el('button', 'mail-compose-link minigame-button');
            btn.type = 'button';
            btn.dataset.kit = k.id;
            btn.setAttribute('aria-pressed', attached ? 'true' : 'false');
            const base = k.label || k.id;
            btn.textContent = attached ? `${base} — attached (tap to remove)`
                : built ? `Attach ${base}` : `Build & attach ${base}`;
            btn.addEventListener('click', () => this.setLink(k));
            row.appendChild(btn);
        }
        this.root.appendChild(row);
    }

    /**
     * The live red-flag meter (01, 04): a side panel that, for a target with the meter
     * on, shows the red flags the current draft would raise and clears them as the draft
     * improves. A teaching aid for the first target; it reads the message as a defender
     * would and never names a fact the player has not found.
     */
    _renderMeter() {
        const data = this._meterData();
        if (!data.on) return;
        const panel = el('aside', 'mail-redflag-meter');
        panel.dataset.count = String(data.flags.length);
        panel.dataset.advice = String(arr(data.advice).length);
        panel.setAttribute('role', 'status');
        panel.setAttribute('aria-live', 'polite');
        panel.setAttribute('aria-label', 'Red-flag check');
        const head = el('div', 'mail-redflag-head');
        head.appendChild(el('span', 'mail-redflag-title', 'Red flags'));
        head.appendChild(el('span', 'mail-redflag-count', String(data.flags.length)));
        panel.appendChild(head);
        // In the red-team seat a lower count is better, so the meter needs one line to say so, or
        // "Red flags 1" reads as a mistake to fix and 0 looks like nothing matters (E8 F8). Authored
        // override: opts.meterHint; '' hides it.
        const hint = this._meterHint();
        if (hint) panel.appendChild(el('p', 'mail-redflag-sub', hint));
        const mark = (cls, src) => {
            const img = el('img', cls);
            img.src = src;
            img.alt = '';
            img.setAttribute('aria-hidden', 'true');
            img.width = 16;
            img.height = 16;
            return img;
        };
        if (data.flags.length) {
            const list = el('ul', 'mail-redflag-list');
            for (const flag of data.flags) {
                const li = el('li', 'mail-redflag-item');
                li.append(mark('mail-redflag-mark', '/break_escape/assets/icons/mark-cross.png'),
                    el('span', 'mail-redflag-text', flag));
                list.appendChild(li);
            }
            panel.appendChild(list);
        } else if (!arr(data.advice).length) {
            const ok = el('p', 'mail-redflag-clean');
            ok.append(mark('mail-redflag-mark', '/break_escape/assets/icons/mark-tick.png'),
                el('span', 'mail-redflag-text', 'No red flags right now — this reads clean so far.'));
            panel.appendChild(ok);
        }
        // Advice (E6/E7 F1): the forged From is what makes the message land, shown as a note
        // rather than a counted fault, so the meter agrees with the flip and debrief.
        for (const line of arr(data.advice)) {
            const item = el('p', 'mail-redflag-advice');
            item.append(mark('mail-redflag-mark mail-redflag-advice-mark', '/break_escape/assets/icons/mark-exclamation.png'),
                el('span', 'mail-redflag-text', line));
            panel.appendChild(item);
        }
        this.root.appendChild(panel);
    }

    _renderSend() {
        const bar = el('div', 'mail-compose-send-bar');
        const back = el('button', 'mail-compose-back minigame-button', 'Back');
        back.type = 'button';
        back.addEventListener('click', () => { try { this.opts.onClose?.(); } catch (e) { /* host owns close */ } });
        const send = el('button', 'mail-compose-send minigame-button', 'Send');
        send.type = 'button';
        send.disabled = !this.gate.ok;
        send.addEventListener('click', () => this.send());
        const line = el('p', 'mail-compose-gate');
        line.setAttribute('aria-live', 'polite');
        line.textContent = this.gate.ok ? '' : (this.gate.line || '');
        if (!this.gate.ok && this.gate.line) send.setAttribute('aria-describedby', 'mail-compose-gate-line');
        line.id = 'mail-compose-gate-line';
        bar.append(back, send, line);
        this.sendButton = send;
        this.gateLineEl = line;
        // With the red-flag meter on, the meter and the Send bar share one footer pinned to the foot
        // of the panel, so the hints are always on screen beside Send (E8 F2), however tall the form.
        const meter = this.root.querySelector?.('.mail-redflag-meter');
        if (meter) {
            const foot = el('div', 'mail-compose-foot');
            foot.append(meter, bar);
            this.root.appendChild(foot);
        } else {
            this.root.appendChild(bar);
        }
    }

    // ── the blank picker (a listbox; arrow keys, Enter/click, Esc) ────────────

    openPicker(slot, anchor) {
        this._closePicker();
        const options = this.optionsFor(slot);
        if (!options.length) return;
        const panel = el('div', 'mail-picker');
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', `Choose ${isStr(slot.label) ? slot.label : slot.id}`);
        const list = el('ul', 'mail-picker-list');
        list.setAttribute('role', 'listbox');
        list.setAttribute('aria-label', `${isStr(slot.label) ? slot.label : slot.id} options`);
        list.tabIndex = 0;
        const chosen = this.slots[slot.id];
        let active = Math.max(0, options.findIndex((o) => o.value === chosen));
        const items = [];
        options.forEach((opt, i) => {
            const li = el('li', 'mail-picker-option');
            li.setAttribute('role', 'option');
            li.dataset.value = opt.value;
            li.id = `mail-picker-opt-${i}`;
            li.append(el('span', 'mail-picker-label', opt.label));
            // No kind tag on the option (lab R14 m1, R15 N4): "an older detail" marked the
            // stale decoy and "a specific detail" marked every right answer, since only true
            // facts are distinctive. The student reasons from the board, not the label.
            li.setAttribute('aria-selected', opt.value === chosen ? 'true' : 'false');
            li.addEventListener('click', () => this._pick(slot, opt.value));
            items.push(li);
            list.appendChild(li);
        });
        const setActive = (i) => {
            active = (i + items.length) % items.length;
            items.forEach((li, j) => li.classList.toggle('active', j === active));
            list.setAttribute('aria-activedescendant', items[active].id);
        };
        list.addEventListener('keydown', (e) => {
            // Tab stays in the open picker; Esc (the layer) and a choice are the ways out.
            if (e.key === 'Tab') e.preventDefault();
            else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
            else if (e.key === 'End') { e.preventDefault(); setActive(items.length - 1); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
            else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this._pick(slot, options[active].value);
            }
        });
        panel.appendChild(list);
        this.root.appendChild(panel);
        this._picker = { panel, slot, anchor };
        this._popPicker = this.opts.pushLayer?.(() => this._closePicker(true), 'blank-picker') || null;
        setActive(active);
        list.focus?.();
    }

    /** A choice made in the picker: close it, set the blank, and return focus to that blank's button. */
    _pick(slot, value) {
        this._closePicker();
        this.setSlot(slot.id, value);
        this.root.querySelector?.(`.mail-blank[data-slot="${slot.id}"]`)?.focus?.();
    }

    _closePicker(focusAnchor = false) {
        if (this._popPicker) { this._popPicker(); this._popPicker = null; }
        if (this._picker) {
            const anchor = this._picker.anchor;
            this._picker.panel.remove?.();
            this._picker = null;
            if (focusAnchor) anchor?.focus?.();
        }
    }

    get pickerOpen() {
        return !!this._picker;
    }

    getState() {
        const picker = this._picker
            ? {
                slot: this._picker.slot.id,
                options: this.optionsFor(this._picker.slot).map((o) => ({ value: o.value, label: o.label, kind: o.kind }))
            }
            : null;
        const blanks = this.activeSlots().map(({ part, slot }) => ({
            part,
            slot: slot.id,
            options: this.optionsFor(slot).map((o) => o.value),
            chosen: this.slots[slot.id] || null
        }));
        return {
            contactId: this.contactId,
            to: this.toAddress,
            targetId: this.target ? this.target.id : null,
            subject: this.subjectId,
            templates: { ...this.choice },
            slots: { ...this.slots },
            attachment: this.attachment,
            link: this.link,
            freeTextEnabled: this.freeTextEnabled,
            freeText: this.freeTextEnabled && isStr(this.freeText) ? this.freeText : '',
            linkKits: this.linkKitsForTarget().map((k) => ({ id: k.id, built: !!(this._recordOf(k) && this._recordOf(k).built === true) })),
            blanks,
            picker,
            account: this.account ? this.account.id : null,
            sendAs: this.accounts.map((a) => ({ id: a.id, burned: this.isBurned(a) })),
            sendEnabled: this.gate.ok,
            gateLine: this.gate.ok ? '' : (this.gate.line || ''),
            gateReason: this.gate.reason || null,
            redFlagMeter: this._meterData()
        };
    }

    destroy() {
        this._closePicker();
        this.root.remove?.();
    }
}
