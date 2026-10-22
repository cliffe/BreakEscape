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

import { preSendGate, PRE_SEND_GATE_LINE, evaluateMessage } from '../../systems/phish-rules.js';

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
        this.render();
    }

    // ── state ──────────────────────────────────────────────────────────────

    get target() {
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
        return this.accounts.some((a) => a && this.account && a.id !== this.account.id
            && a.spoofsFrom === true && !this.isBurned(a));
    }

    /** From is forced to the account (no claimed-From blanks) when it cannot spoof (00 §10a, 01 §2). */
    get fromForced() {
        return !(this.account && this.account.spoofsFrom === true);
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
            if (set.length) this.choice[part] = set[0];
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

    /** The red flags the current draft would raise, de-duped (00 §2, §13: failed factors). */
    _meterData() {
        if (!this._meterOn()) return { on: false, flags: [], clean: false, landed: false };
        const result = this._liveResult();
        const flags = [];
        const seen = new Set();
        const push = (s) => { if (isStr(s) && !seen.has(s)) { seen.add(s); flags.push(s); } };
        if (result) {
            if (result.open && result.open.opened === false) push(result.openLine || 'Nothing here would make them open it.');
            for (const f of arr(result.factors)) if (!f.pass && isStr(f.redFlag)) push(f.redFlag);
        }
        return { on: true, flags, clean: flags.length === 0, landed: !!(result && result.landed) };
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
            targetId: this.contact && isStr(this.contact.targetId) ? this.contact.targetId : null,
            subject: this.subjectId || null,
            headerFrom,
            templates: { ...this.choice },
            slots: { ...this.slots },
            attachment: kit ? kit.id : null,
            attachmentKind: kit ? kit.kind : null,
            link: linkKit ? linkKit.id : null,
            linkText: linkPage && isStr(linkPage.linkText) ? linkPage.linkText : null,
            linkInfo: null
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

    get subjectId() {
        const t = this.target;
        const subjects = arr(t && t.subjects);
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
            link: this.link
        };
    }

    _emitChange() {
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
        this._renderTo();
        if (this.contact && !this.target) {
            this.root.appendChild(el('p', 'mail-compose-note',
                'This recipient is not a phishing target: the message is kept in Sent but is not judged and delivers nothing.'));
        }
        if (this.target) {
            this._renderFrom();
            this._renderSubject();
            this._renderBody();
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
        if (this._fromIsOwn()) {
            line.classList.add('mail-compose-from-own');
            if (this.fromForced) {
                line.append(el('span', 'mail-compose-hint', this.anotherSpoofs
                    ? ' You can only send as yourself from this address. Switch account to send as someone else.'
                    : ' You can only send as yourself from this address.'));
            }
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
            const opt = el('option', null, 'No contacts yet — find someone first.');
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
            if (!this.choice.from) this.choice.from = this.templateSet('from')[0] || 'from_own';
            return;
        }
        const row = el('div', 'mail-compose-row mail-compose-part');
        row.appendChild(el('span', 'mail-compose-label', 'From'));
        this._renderPartSelect(row, 'from');
        this.root.appendChild(row);
        this._renderPartBlanks('from');
    }

    _renderSubject() {
        const t = this.target;
        const subjects = arr(t && t.subjects);
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
                row.appendChild(el('p', 'mail-compose-value mail-compose-fixed', only ? this._fillPreview(only) : set[0]));
            } else {
                this._renderPartSelect(row, part);
            }
            this.root.appendChild(row);
            this._renderPartBlanks(part);
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
            const opt = el('option', null, tpl ? this._fillPreview(tpl) : id);
            opt.value = id;
            if (id === this.choice[part]) opt.selected = true;
            select.appendChild(opt);
        }
        select.addEventListener('change', () => this.chooseTemplate(part, select.value));
        row.appendChild(select);
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
            } else {
                btn.textContent = chosenOpt ? `${blankLabel}: ${chosenOpt.label}` : `${blankLabel}: choose…`;
                btn.dataset.chosen = chosen || '';
                btn.setAttribute('aria-haspopup', 'listbox');
                btn.addEventListener('click', () => this.openPicker(slot, btn));
                field.appendChild(btn);
            }
            wrap.appendChild(field);
        }
        this.root.appendChild(wrap);
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
        panel.setAttribute('role', 'status');
        panel.setAttribute('aria-live', 'polite');
        panel.setAttribute('aria-label', 'Red-flag check');
        const head = el('div', 'mail-redflag-head');
        head.appendChild(el('span', 'mail-redflag-title', 'Red flags'));
        head.appendChild(el('span', 'mail-redflag-count', String(data.flags.length)));
        panel.appendChild(head);
        if (data.flags.length) {
            const list = el('ul', 'mail-redflag-list');
            for (const flag of data.flags) {
                const li = el('li', 'mail-redflag-item');
                const img = el('img', 'mail-redflag-mark');
                img.src = '/break_escape/assets/icons/mark-cross.png';
                img.alt = '';
                img.setAttribute('aria-hidden', 'true');
                img.width = 16;
                img.height = 16;
                li.append(img, el('span', 'mail-redflag-text', flag));
                list.appendChild(li);
            }
            panel.appendChild(list);
        } else {
            const ok = el('p', 'mail-redflag-clean');
            const img = el('img', 'mail-redflag-mark');
            img.src = '/break_escape/assets/icons/mark-tick.png';
            img.alt = '';
            img.setAttribute('aria-hidden', 'true');
            img.width = 16;
            img.height = 16;
            ok.append(img, el('span', 'mail-redflag-text',
                'No red flags right now — this reads clean so far.'));
            panel.appendChild(ok);
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
        this.root.appendChild(bar);
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
            // Name where the fact came from, in plain words, without judging which is
            // the better pick (the student should reason from the board, not the label;
            // lab fix round L): a specific detail versus an older one.
            if (opt.kind && opt.kind !== 'generic') {
                const kindText = { distinctive: 'a specific detail', stale: 'an older detail' }[opt.kind] || opt.kind;
                li.append(el('span', `mail-picker-kind kind-${opt.kind}`, kindText));
            }
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
