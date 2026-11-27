// Pure mail data helpers shared by the mail client shell and its tests
// (SE design 01 "Own-account resolution", "Scenario-authored data"; contract 00 §10a).
// No DOM here. Nothing in this file writes a global or touches the server.

/** The part of an address after the last '@', lower-cased. Derived, never authored. */
export function domainOf(address) {
    if (typeof address !== 'string') return '';
    const at = address.lastIndexOf('@');
    return at === -1 ? '' : address.slice(at + 1).toLowerCase();
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Resolve the accounts a device offers, in the order the device lists them.
 * A 'given' account is always available. An account with `unlockedBy` is listed
 * only once that global is true. A 'created' account is listed once `acct_<id>`
 * is true, with the address and display name of the createMenu entry named by
 * the string global `acct_<id>_choice`; until then it is left out (the Create
 * account panel offers it, see pendingCreations). `burned` is true while the
 * global `burned_<id>` is (00 §10a). Returns [{ id, address, displayName,
 * domain, kind, person, spoofsFrom, mailbox, burned }].
 */
export function resolveAccounts(config, accountIds, globals = {}) {
    const all = (Array.isArray(config?.accounts) ? config.accounts : []).filter(isObject);
    const byId = new Map(all.map((a) => [a.id, a]));
    const ids = Array.isArray(accountIds) && accountIds.length ? accountIds : all.map((a) => a.id);
    const out = [];
    for (const id of ids) {
        const a = byId.get(id);
        if (!a) continue;
        if (a.unlockedBy && globals[a.unlockedBy] !== true) continue;
        let address = a.address;
        let displayName = a.displayName;
        if (a.kind === 'created') {
            if (globals[`acct_${a.id}`] !== true) continue;
            const choice = (a.createMenu || []).find((m) => m.id === globals[`acct_${a.id}_choice`]);
            if (!choice) continue;
            address = choice.address;
            displayName = choice.displayName;
        }
        if (typeof address !== 'string' || !address) continue;
        out.push({
            id: a.id,
            address,
            displayName: displayName || address,
            domain: domainOf(address),
            kind: a.kind || 'given',
            person: a.person ?? null,
            spoofsFrom: a.spoofsFrom === true,
            mailbox: a.mailbox || a.id,
            burned: globals[`burned_${a.id}`] === true
        });
    }
    return out;
}

/**
 * Contacts that appear in the To list and the contacts panel: those whose
 * `revealedBy` global is true (a contact with no revealedBy is always shown),
 * and, when a contact lists `accountIds`, only for that account.
 */
export function visibleContacts(config, accountId, globals = {}) {
    const all = Array.isArray(config?.contacts) ? config.contacts : [];
    return all.filter((c) => {
        if (!isObject(c)) return false;
        if (c.revealedBy && globals[c.revealedBy] !== true) return false;
        if (Array.isArray(c.accountIds) && c.accountIds.length && !c.accountIds.includes(accountId)) return false;
        return true;
    });
}

/** A fresh, empty mailState (00 §10a). */
export function emptyMailState() {
    return { mailboxes: {}, jobs: [], threads: {}, drafts: {}, metrics: {} };
}

/** The mailbox object for `id`, created when missing. */
export function ensureMailbox(mailState, id) {
    if (!isObject(mailState.mailboxes)) mailState.mailboxes = {};
    let box = mailState.mailboxes[id];
    if (!isObject(box)) box = mailState.mailboxes[id] = { messages: [], unread: 0 };
    if (!Array.isArray(box.messages)) box.messages = [];
    return box;
}

/** Recount a mailbox's unread inbox mail and store it on the mailbox. */
export function recountUnread(mailState, id) {
    const box = ensureMailbox(mailState, id);
    box.unread = box.messages.filter((m) => m.folder !== 'sent' && m.read !== true).length;
    return box.unread;
}

/**
 * Normalise an authored seeded message into the persisted record shape (00 §10a):
 * `read = !unread`, `gameTime` from the clock at load, the inbox/sent defaults.
 * The record is flagged `seeded: true` so it exports as a stub and the server
 * trim never drops it; it is not re-added unflagged if the scheduler already
 * seeded it (P1-C follow-up, P1-S stub rule).
 */
export function normaliseSeeded(seed, now = 0) {
    const from = isObject(seed.from)
        ? { name: String(seed.from.name ?? ''), address: String(seed.from.address ?? '') }
        : { name: String(seed.from ?? ''), address: '' };
    const folder = seed.folder === 'sent' ? 'sent' : 'inbox';
    const rec = {
        id: seed.id,
        thread: seed.thread ?? null,
        mailbox: seed.mailbox,
        folder,
        from,
        to: seed.to ?? '',
        subject: seed.subject ?? '',
        body: seed.body ?? '',
        time: seed.time ?? '',
        gameTime: Number.isFinite(seed.gameTime) ? seed.gameTime : now,
        read: folder === 'sent' ? true : seed.unread !== true,
        tells: [],
        landed: null,
        targetId: null,
        seeded: true
    };
    if (folder === 'sent') rec.fromAccount = seed.fromAccount ?? null;
    if (Array.isArray(seed.links)) rec.links = seed.links;
    if (Array.isArray(seed.attachments)) rec.attachments = seed.attachments;
    if (Array.isArray(seed.highlights)) rec.highlights = seed.highlights;
    return rec;
}

/**
 * Put the scenario's seeded messages into `mailState`. Idempotent: a message
 * whose id is already in its mailbox is left alone, so a restored mailState
 * (with the player's read flags) is never overwritten. Messages with a
 * `deliverAt` are timed mail for the scheduler and are skipped. Returns the
 * ids added.
 */
export function seedMailState(mailState, config, now = 0) {
    const added = [];
    const seeds = Array.isArray(config?.seededMessages) ? config.seededMessages : [];
    for (const seed of seeds) {
        if (!isObject(seed) || !seed.id || !seed.mailbox || seed.deliverAt) continue;
        const box = ensureMailbox(mailState, seed.mailbox);
        if (box.messages.some((m) => m.id === seed.id)) continue;
        box.messages.push(normaliseSeeded(seed, now));
        added.push(seed.id);
    }
    const touched = new Set(seeds.filter((s) => isObject(s) && s.mailbox).map((s) => s.mailbox));
    for (const id of touched) recountUnread(mailState, id);
    return added;
}

/** Messages of one folder in a mailbox, newest first (later gameTime first, then later array position). */
export function folderMessages(mailState, mailboxId, folder) {
    const box = mailState?.mailboxes?.[mailboxId];
    const list = Array.isArray(box?.messages) ? box.messages : [];
    return list
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => (m.folder === 'sent' ? 'sent' : 'inbox') === folder)
        .sort((a, b) => ((b.m.gameTime || 0) - (a.m.gameTime || 0)) || (b.i - a.i))
        .map(({ m }) => m);
}

/** Split a body on `{{link:<id>}}` tokens: [{ text } | { link: <id> }]. */
export function splitBody(body) {
    const parts = [];
    const re = /\{\{link:([A-Za-z0-9_-]+)\}\}/g;
    let last = 0;
    let match;
    const text = typeof body === 'string' ? body : '';
    while ((match = re.exec(text)) !== null) {
        if (match.index > last) parts.push({ text: text.slice(last, match.index) });
        parts.push({ link: match[1] });
        last = re.lastIndex;
    }
    if (last < text.length) parts.push({ text: text.slice(last) });
    return parts;
}

/** The real destination of a link record; the authored field names are not fixed in 00, so accept the likely ones. */
export function linkDestination(link) {
    if (!isObject(link)) return '';
    return String(link.destination ?? link.realUrl ?? link.href ?? link.realDomain ?? link.linkText ?? '');
}

// ── Accounts, 1b (01 N11; 00 §10a) ───────────────────────────────────────────

/**
 * The `created` accounts a device offers that the player has not made yet, for
 * the switcher's "Create account" entry. An account is pending while its
 * `acct_<id>` global is not true, it has a non-empty `createMenu`, and its
 * `unlockedBy` (when it names something other than `acct_<id>` itself) is true.
 * Returns [{ id, mailbox, createMenu: [{ id, address, displayName }] }].
 */
export function pendingCreations(config, accountIds, globals = {}) {
    const all = Array.isArray(config?.accounts) ? config.accounts.filter(isObject) : [];
    const ids = Array.isArray(accountIds) && accountIds.length ? accountIds : all.map((a) => a.id);
    const out = [];
    for (const id of ids) {
        const a = all.find((x) => x.id === id);
        if (!a || a.kind !== 'created') continue;
        if (globals[`acct_${a.id}`] === true) continue;
        if (a.unlockedBy && a.unlockedBy !== `acct_${a.id}` && globals[a.unlockedBy] !== true) continue;
        const menu = (Array.isArray(a.createMenu) ? a.createMenu : [])
            .filter((m) => isObject(m) && typeof m.id === 'string' && typeof m.address === 'string' && m.address)
            .map((m) => ({ id: m.id, address: m.address, displayName: m.displayName || m.address }));
        if (!menu.length) continue;
        out.push({ id: a.id, mailbox: a.mailbox || a.id, createMenu: menu });
    }
    return out;
}

/**
 * The two global writes that create an account, in order: the choice first, then
 * `acct_<id>`, so a listener that fires on `acct_<id>` already sees the choice.
 * Returns null for an unknown entry or an account already created.
 */
export function createAccountWrites(config, accountId, entryId, globals = {}) {
    const pending = pendingCreations(config, [accountId], globals)[0];
    if (!pending || !pending.createMenu.some((m) => m.id === entryId)) return null;
    return [[`acct_${accountId}_choice`, entryId], [`acct_${accountId}`, true]];
}

/**
 * The Phase 0 headless record a contact's character replies from (00 S8): the
 * `social.characters.<character>.channels.email` id, when the character has an
 * `emailRecord`. Same rule as systems/scenario-npc-records.js (kept inline so
 * this file stays import-free). Null for a contact with no character.
 */
export function contactRecordId(social, contact) {
    const key = isObject(contact) ? contact.character : null;
    const ch = isObject(social?.characters) && typeof key === 'string' ? social.characters[key] : null;
    if (!isObject(ch) || !isObject(ch.emailRecord)) return null;
    const id = isObject(ch.channels) ? ch.channels.email : null;
    return typeof id === 'string' && id ? id : null;
}
