// Mail client overlay: the shell (SE design 01 N1 shell, N3, N5, N9, N12 view, N14, N15 inbox seeds).
//
// What is here: the account bar, Inbox and Sent folders over the shared
// MailReader, the contacts panel (contacts appear once their `revealedBy`
// global is true), seeded inbox mail, new-mail arrival, Close/Esc behaviour and
// getTestState(). The account switcher, the Create-account panel and the
// per-mailbox unread counts are P1-L (01 N11, 00 §10a). Registration, the
// starter and the CSS <link> are P1-W's.
//
// Starter params (all optional except where noted; see socialOverlayParams):
//   accountIds       string[]  the accounts this device offers (mail_terminal.minigameData.accountIds)
//   defaultAccount   string    opens on this account instead of the first listed
//   accountId        string    set by returnParams() when the client is reopened
//   mailClient       object    the social.mailClient block; falls back to window.gameScenario.social.mailClient
//   mailState        object    the live mailState (00 §10a); falls back to window.mailState, else a new one
//   globals          object    global variables; falls back to window.gameState.globalVariables
//   now              number    elapsed game ms stamped on seeded mail
//   checklistTiming  string    'onSend' | 'withReply'; falls back to mailClient.checklistTiming
//   onStateChange    function  called with { type, mailbox, id? } after a read flag or arrival changes mailState
//   maxSends         number    episode cap: after this many sends this session Compose is disabled and a
//                              line says the message has gone. Close carries on. Absent means no cap.
//   layout           string    'phone' puts the narrow layout in a phone frame on any viewport (E6)
//   readOnly         boolean   true hides Compose and Contacts (and refuses to open either): a mailbox to
//                              read, not to send from. Absent or false keeps both.
//   sentIds          string[]  set by returnParams() on a reopen: the record ids sent so far
//   onComplete       function  (success, result) as for every minigame
// The close result carries sentIds: this session's sent record ids, oldest first.
// requiresKeyboardInput and disableClose are set by the base class.

import { SocialOverlayScene } from '../framework/social-overlay.js';
import { MailReader } from './mail-reader.js';
import { MailComposer } from './mail-composer.js';
import { registerOpenClient, notifyAccountCreated } from './mail-notification.js';
import { performSend, renderChecklist, rejudgeForChecklist, resolveTarget, applyFactorBias } from './mail-bridge.js';
import { evaluateMessage } from '../../systems/phish-rules.js';
import { writeGlobal } from '../../systems/global-writer.js';
import {
    resolveAccounts, visibleContacts, emptyMailState, ensureMailbox,
    recountUnread, seedMailState, folderMessages,
    pendingCreations, createAccountWrites, contactRecordId
} from './mail-data.js';

const ICON = '/break_escape/assets/icons/';
const NARROW_QUERY = '(max-width: 767px)';

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

export class MailClientMinigame extends SocialOverlayScene {
    // The global that remembers which account the client was last on, so a reload
    // reopens there rather than on the first listed one (lab R1 F11).
    static LAST_ACCOUNT_KEY = 'se_mail_last_account';

    constructor(container, params) {
        super(container, params);
        this.folder = 'inbox';
        this.sentIds = Array.isArray(this.params.sentIds) ? this.params.sentIds.filter((id) => typeof id === 'string') : [];
        this.sentThisSession = this.sentIds.length;
        this.lastSendResult = null;
        this.notice = '';
        this.contactsOpen = false;
        this._popContacts = null;
        this.composeOpen = false;
        this.composer = null;
        this._popCompose = null;
        this.lastComposed = null;
        this._unregister = null;
        this.accounts = [];
        this.account = null;
        this.creatable = [];
        this.createOpen = false;
        this.createPanel = null;
        this.createChoice = null;
        this._popCreate = null;
        this.checklistPanel = null;
        this._popChecklist = null;
        this._claimedFromNoticeShown = false;
    }

    // ── data ─────────────────────────────────────────────────────────────────

    get config() {
        return this.params.mailClient || (typeof window !== 'undefined' && window.gameScenario?.social?.mailClient) || {};
    }

    get globals() {
        return this.params.globals || (typeof window !== 'undefined' && window.gameState?.globalVariables) || {};
    }

    /** The whole social block (people, templates, phishTargets, intelFacts), for the composer. */
    get social() {
        return this.params.social || (typeof window !== 'undefined' && window.gameScenario?.social) || {};
    }

    /** The mail scheduler (P1-F): owns jobs, the sent record and persistence. Falls back to window.mailScheduler. */
    get scheduler() {
        return this.params.scheduler || (typeof window !== 'undefined' ? window.mailScheduler : null) || null;
    }

    /** The live mailState. The scheduler and persistence (P1-F) own the object on window; the shell edits it in place. */
    get mailState() {
        if (this._mailState) return this._mailState;
        if (this.params.mailState) this._mailState = this.params.mailState;
        else if (typeof window !== 'undefined') this._mailState = window.mailState || (window.mailState = emptyMailState());
        else this._mailState = emptyMailState();
        return this._mailState;
    }

    mailboxId() {
        return this.account?.mailbox || null;
    }

    /**
     * Resolve the device's accounts from the live globals (01 N11). `keepId` is the
     * account to stay on across a reload; the first open uses `accountId`
     * (a reopen) or `defaultAccount`, else the first listed.
     */
    _loadAccounts(keepId = null) {
        this.accounts = resolveAccounts(this.config, this.params.accountIds, this.globals);
        this.creatable = pendingCreations(this.config, this.params.accountIds, this.globals);
        // After a reload there is no in-session accountId, so without this the client
        // dropped back to the first listed account (guest) and lost the one the student
        // was working from (lab R1 F11). The last account is persisted to a global, so it
        // rides the save; it is used only when no explicit account was passed.
        const persisted = this.globals[MailClientMinigame.LAST_ACCOUNT_KEY];
        const want = keepId || this.params.accountId || this.params.defaultAccount || persisted;
        this.account = this.accounts.find((a) => a.id === want) || this.accounts[0] || null;
    }

    /** Persist the open account so a reload reopens on it (lab R1 F11). */
    _rememberAccount() {
        const id = this.account?.id;
        if (!id) return;
        writeGlobal(MailClientMinigame.LAST_ACCOUNT_KEY, id, { openChat: false });
        if (this.params.globals && this.params.globals !== window.gameState?.globalVariables) {
            this.params.globals[MailClientMinigame.LAST_ACCOUNT_KEY] = id;
        }
    }

    /** Whether this client shows `mailboxId` (the notifier asks, so any listed account's arrivals append). */
    holdsMailbox(mailboxId) {
        return this.accounts.some((a) => a.mailbox === mailboxId);
    }

    /** Unread inbox count of a mailbox, read without creating the mailbox. */
    unreadOf(mailboxId) {
        const list = this.mailState?.mailboxes?.[mailboxId]?.messages;
        return Array.isArray(list) ? list.filter((m) => m.folder !== 'sent' && m.read !== true).length : 0;
    }

    _changed(change) {
        try { this.params.onStateChange?.(change); } catch (err) { console.error('mail onStateChange failed:', err); }
    }

    // ── lifecycle ────────────────────────────────────────────────────────────

    init() {
        super.init();
        this._loadAccounts();
        seedMailState(this.mailState, this.config, this.params.now ?? 0);
        if (this.account) ensureMailbox(this.mailState, this.account.mailbox);

        const root = el('div', 'mail-client');
        if (this.params.layout === 'phone') root.classList.add('mail-client--phone');
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', 'Mail');
        this.root = root;
        this.gameContainer.appendChild(root);

        this._buildToolbar(root);
        this.noticeEl = el('p', 'mail-notice');
        this.noticeEl.setAttribute('aria-live', 'polite');
        root.appendChild(this.noticeEl);
        this.capEl = el('p', 'mail-cap-note');
        this.capEl.setAttribute('aria-live', 'polite');
        root.appendChild(this.capEl);

        this.reader = new MailReader(root, {
            pushLayer: (close, name) => this.pushLayer(close, name),
            judgedVisible: (rec) => !this._judgePending(rec),
            // Opening a message is the player attending to the inbox, so the arrival
            // notice has served its purpose and is cleared (A11: it lingered).
            onOpen: (rec) => { this._clearNotice(); this._markRead(rec); },
            // Thread follow-ups under the open reply (01 N8): "Choose a reply" or the
            // judged composer, from mailState.threads[key].expects.
            afterBody: (rec, pane) => this._renderFollowups(rec, pane),
            // Highlights (01 N16, 00 §10a): a marked span saves as evidence (grantFact,
            // with the highlight id as the fact source) or, with no grants, to the notepad;
            // any other selection goes to the notepad.
            onHighlight: (highlight) => this._saveHighlight(highlight),
            onSaveSelection: (text) => this._saveSelection(text)
        });
        this._refresh();
    }

    start() {
        super.start();
        this._unregister = registerOpenClient(this);
        // A delivery job that finishes while the client is open (a reply, or a silent job that
        // only reveals the verdict) reveals the Sent verdict at once (01 N17).
        this._offJobs = this.scheduler?.onEvent?.((event, data) => {
            if (event === 'mail_job_done') this._onJobDone(data?.job);
        }) || null;
        // Reopened from the landing-page builder (01 §2): restore the draft into Compose and
        // attach the link if its page is now built.
        if (this.params.reopenCompose) {
            this.params.reopenCompose = false;
            const kitId = this.params.attachLinkKit || null;
            this.params.attachLinkKit = null;
            this.openCompose();
            if (kitId && this.composer) this.composer.attachLinkIfBuilt(kitId);
        }
    }

    /**
     * withReply timing (01 N17): a Sent record's verdict stays hidden while a delivery job for
     * it is still queued. The queue is the truth: the flag the bridge sets on the record is not
     * kept by the scheduler or the server, so it cannot be relied on after a reload.
     */
    _judgePending(rec) {
        if (this._checklistTiming() !== 'withReply' || !rec) return false;
        if (rec.judgePending === true) return true;
        const jobs = Array.isArray(this.mailState?.jobs) ? this.mailState.jobs : [];
        return jobs.some((j) => j && j.msgId === rec.id);
    }

    _onJobDone(job) {
        const sent = (() => {
            if (!job?.msgId) return null;
            const box = this.account ? this.mailState?.mailboxes?.[this.account.mailbox] : null;
            return box?.messages?.find((m) => m.id === job.msgId) || null;
        })();
        if (sent) delete sent.judgePending;
        if (this.root && this.reader) this._refresh();
        // withReply: the reply has been read (or the silent job has run); now show why.
        const held = job?.msgId && this._heldChecklists?.get(job.msgId);
        if (held) {
            this._heldChecklists.delete(job.msgId);
            if (sent) delete sent.pendingMessage;
            this._showChecklist(held);
            return;
        }
        // After a reload the in-memory hold is gone, but the record kept the composed
        // message: rebuild the teaching checklist from it so the verdict is not lost (T2-6).
        if (sent && sent.pendingMessage && this._checklistTiming() === 'withReply') {
            let rebuilt = null;
            try { rebuilt = rejudgeForChecklist(this, sent); } catch (err) { console.error('mail checklist rebuild failed:', err); }
            delete sent.pendingMessage;
            if (rebuilt && rebuilt.result) this._showChecklist(rebuilt);
        }
    }

    cleanup() {
        if (this._unregister) { this._unregister(); this._unregister = null; }
        if (this._offJobs) { this._offJobs(); this._offJobs = null; }
        this.closeCreateAccount(false);
        this._dismissChecklist();
        this.composer?.destroy?.();
        this.composer = null;
        this.reader?.destroy?.();
        super.cleanup();
    }

    _checklistTiming() {
        return this.params.checklistTiming || this.config.checklistTiming || 'onSend';
    }

    /** The bridge reads the active timing through this (01 N17). */
    checklistTiming() {
        return this._checklistTiming();
    }

    // ── chrome ───────────────────────────────────────────────────────────────

    _buildToolbar(root) {
        const bar = el('div', 'mail-toolbar');
        const acct = el('div', 'mail-account');
        const img = el('img', 'mail-icon');
        img.src = `${ICON}mail-account.png`;
        img.alt = '';
        this.accountLabel = el('span', 'mail-account-label');
        // The switcher (01 N11): shown when the device offers more than one account or a
        // pending "Create account"; a lone account is just the label above.
        this.switcher = el('select', 'mail-account-select');
        this.switcher.setAttribute('aria-label', 'Account');
        this.addEventListener(this.switcher, 'change', () => this._onSwitcher());
        acct.append(img, this.accountLabel, this.switcher);

        const tabs = el('div', 'mail-folders');
        tabs.setAttribute('role', 'group');
        tabs.setAttribute('aria-label', 'Folders');
        this.inboxTab = this._folderButton('inbox', 'Inbox', 'mail-inbox');
        this.sentTab = this._folderButton('sent', 'Sent', 'mail-sent');
        tabs.append(this.inboxTab, this.sentTab);

        this.contactsBtn = el('button', 'mail-contacts-btn minigame-button', 'Contacts');
        this.contactsBtn.type = 'button';
        this.addEventListener(this.contactsBtn, 'click', () => this.toggleContacts());

        // Compose (P1-E2): opens the composer panel over the reader.
        this.actions = el('div', 'mail-toolbar-actions');
        this.composeBtn = el('button', 'mail-compose-btn minigame-button', 'Compose');
        this.composeBtn.type = 'button';
        this.addEventListener(this.composeBtn, 'click', () => this.toggleCompose());
        this.actions.appendChild(this.composeBtn);
        // readOnly: the buttons stay in the tree (other code reads them) but are not shown.
        if (this.params.readOnly === true) {
            for (const b of [this.contactsBtn, this.composeBtn]) { b.hidden = true; b.style.display = 'none'; }
        }
        bar.append(acct, tabs, this.contactsBtn, this.actions);
        this.mountCloseControl(bar, 'Close');
        root.appendChild(bar);
        this.toolbar = bar;
    }

    _folderButton(folder, label, iconName) {
        const btn = el('button', 'mail-folder-btn minigame-button');
        btn.type = 'button';
        btn.dataset.folder = folder;
        const img = el('img', 'mail-icon');
        img.src = `${ICON}${iconName}.png`;
        img.alt = '';
        btn.append(img, el('span', 'mail-folder-label', label), el('span', 'mail-folder-count'));
        this.addEventListener(btn, 'click', () => this.setFolder(folder));
        return btn;
    }

    // ── rendering ────────────────────────────────────────────────────────────

    _refresh() {
        const acct = this.account;
        this.accountLabel.textContent = acct ? `${acct.displayName} <${acct.address}>${acct.burned ? ' (reported)' : ''}` : 'No account';
        const unread = acct ? recountUnread(this.mailState, acct.mailbox) : 0;
        this._renderSwitcher();
        for (const [btn, folder] of [[this.inboxTab, 'inbox'], [this.sentTab, 'sent']]) {
            const active = this.folder === folder;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        }
        const count = this.inboxTab.querySelector('.mail-folder-count');
        count.textContent = unread > 0 ? String(unread) : '';
        count.setAttribute('aria-label', unread > 0 ? `${unread} unread` : '');
        this.reader.setMessages(acct ? folderMessages(this.mailState, acct.mailbox, this.folder) : [], this.folder);
        this.noticeEl.textContent = this.notice;
        this._syncCap();
    }

    // ── send cap (episodes) ──────────────────────────────────────────────────────

    /** The send cap from the starter params, or 0 for none. */
    _maxSends() {
        const n = Number(this.params.maxSends);
        return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 0;
    }

    /** Episode options in use: a cap, a phone layout, or ids carried over from an earlier open. */
    _episodeMode() {
        return this._maxSends() > 0 || this.params.layout === 'phone' || Array.isArray(this.params.sentIds);
    }

    /** Whether the cap has been reached this session. */
    _sendCapReached() {
        const max = this._maxSends();
        return max > 0 && this.sentThisSession >= max;
    }

    /** Disable Compose and show the line once the cap is reached. */
    _syncCap() {
        const capped = this._sendCapReached();
        if (this.composeBtn) {
            this.composeBtn.disabled = capped;
            if (capped) this.composeBtn.setAttribute('aria-disabled', 'true'); else this.composeBtn.removeAttribute('aria-disabled');
        }
        if (this.capEl) {
            this.capEl.textContent = capped
                ? (this._maxSends() === 1 ? 'Your message has gone. You cannot send another.' : 'Your messages have gone. You cannot send any more.')
                : '';
        }
    }

    // ── account switcher and Create account (P1-L; 01 N11) ───────────────────────

    _accountOptionText(a) {
        const n = this.unreadOf(a.mailbox);
        return `${a.displayName} <${a.address}>${a.burned ? ' (reported)' : ''}${n > 0 ? ` (${n} unread)` : ''}`;
    }

    _renderSwitcher() {
        const sw = this.switcher;
        if (!sw) return;
        const multi = this.accounts.length > 1 || this.creatable.length > 0;
        sw.hidden = !multi;
        this.accountLabel.hidden = multi;
        if (!multi) return;
        sw.textContent = '';
        for (const a of this.accounts) {
            const opt = el('option', null, this._accountOptionText(a));
            opt.value = a.id;
            if (this.account && a.id === this.account.id) opt.selected = true;
            sw.appendChild(opt);
        }
        for (const c of this.creatable) {
            const opt = el('option', null, this.creatable.length > 1 ? `Create account (${c.id})` : 'Create account');
            opt.value = `create:${c.id}`;
            sw.appendChild(opt);
        }
        if (this.account) sw.value = this.account.id;
    }

    _onSwitcher() {
        const v = this.switcher.value;
        if (v.startsWith('create:')) {
            if (this.account) this.switcher.value = this.account.id;
            this.openCreateAccount(v.slice('create:'.length));
        } else {
            this.switchAccount(v);
        }
    }

    /**
     * Move to another listed account. The open composer is rebuilt for it (its draft
     * is the new account's own), the checklist and the selected message are dropped.
     */
    switchAccount(id) {
        const next = this.accounts.find((a) => a.id === id);
        if (!next || (this.account && next.id === this.account.id)) {
            if (this.switcher && this.account) this.switcher.value = this.account.id;
            return false;
        }
        const hadCompose = this.composeOpen;
        // Keep the unsent draft across accounts where it still fits (R19 F19-1).
        const carry = hadCompose && this.composer?.draft && this.composer.edited ? this.composer.draft() : null;
        if (hadCompose) this.closeCompose(false);
        this._dismissChecklist();
        this.account = next;
        this._rememberAccount();
        ensureMailbox(this.mailState, next.mailbox);
        this.folder = 'inbox';
        this.reader.selectedId = null;
        this.notice = '';
        this._refresh();
        if (hadCompose) this.openCompose({ carryDraft: carry });
        this._changed({ type: 'account', mailbox: next.mailbox, id: next.id });
        return true;
    }

    openCreateAccount(accountId) {
        const entry = accountId
            ? this.creatable.find((c) => c.id === accountId)
            : this.creatable[0];
        if (!entry || this.createOpen) return false;
        this.closeContacts();
        this.createOpen = true;
        this.createChoice = null;
        const panel = el('div', 'mail-create-panel');
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Create account');
        panel.dataset.account = entry.id;
        panel.appendChild(el('h2', 'mail-create-title', 'Create account'));
        // Name the service so the player knows which provider this account is with (A8):
        // the domain of the addresses on offer (e.g. "freemail.example").
        const service = (() => {
            const addr = (entry.createMenu.find((m) => typeof m.address === 'string' && m.address.includes('@')) || {}).address || '';
            return addr ? addr.slice(addr.indexOf('@') + 1) : '';
        })();
        if (service) panel.appendChild(el('p', 'mail-create-service', `A new address with ${service}.`));
        panel.appendChild(el('p', 'mail-create-help',
            'Pick the address this account will use. You cannot change it afterwards.'));
        const group = el('div', 'mail-create-menu');
        group.setAttribute('role', 'radiogroup');
        group.setAttribute('aria-label', 'Addresses');
        const confirm = el('button', 'mail-create-confirm minigame-button', 'Confirm');
        confirm.type = 'button';
        // Left enabled so a Confirm with nothing picked still gives the student a line
        // rather than a dead button (lab R1 F11); confirmCreateAccount() does the check.
        entry.createMenu.forEach((m, i) => {
            const label = el('label', 'mail-create-option');
            const input = el('input');
            input.type = 'radio';
            input.name = `mail-create-${entry.id}`;
            input.value = m.id;
            label.append(input, document.createTextNode(' '),
                el('span', 'mail-create-name', m.displayName),
                document.createTextNode(' '),
                el('span', 'mail-create-address', `<${m.address}>`));
            this.addEventListener(input, 'change', () => {
                this.createChoice = m.id;
                confirm.disabled = false;
                const err = this.createPanel?.querySelector('.mail-create-error');
                if (err) err.textContent = '';
            });
            group.appendChild(label);
        });
        const bar = el('div', 'mail-create-bar');
        const back = el('button', 'mail-create-back minigame-button', 'Back');
        back.type = 'button';
        this.addEventListener(back, 'click', () => this.closeCreateAccount());
        this.addEventListener(confirm, 'click', () => this.confirmCreateAccount());
        bar.append(back, confirm);
        panel.append(group, bar);
        this.root.appendChild(panel);
        this.createPanel = panel;
        this.createAccountId = entry.id;
        this._popCreate = this.pushLayer(() => this.closeCreateAccount(), 'create-account');
        group.querySelector('input')?.focus?.();
        return true;
    }

    closeCreateAccount(restoreFocus = true) {
        if (!this.createOpen) return;
        this.createOpen = false;
        this.createPanel?.remove?.();
        this.createPanel = null;
        this.createChoice = null;
        if (this._popCreate) { this._popCreate(); this._popCreate = null; }
        if (restoreFocus) this.switcher?.focus?.();
    }

    /** Pick an entry by id (the panel's radio, for keyboard-free callers). */
    chooseCreateEntry(entryId) {
        const input = this.createPanel?.querySelector(`input[value="${entryId}"]`);
        if (!input) return false;
        input.checked = true;
        this.createChoice = entryId;
        const confirm = this.createPanel.querySelector('.mail-create-confirm');
        if (confirm) confirm.disabled = false;
        return true;
    }

    /**
     * Confirm: write `acct_<id>_choice` then `acct_<id>` through the shared writer
     * (00 §10a, S3), reload the accounts and move to the new one. Final for the session.
     */
    confirmCreateAccount() {
        const id = this.createAccountId;
        const choice = this.createChoice;
        // Nothing picked yet: say so inside the panel. An info toast is held while a
        // full-screen panel is open, so it never showed here (R2 F1); write the line
        // into the create panel where the student can see it.
        if (!choice) {
            let err = this.createPanel?.querySelector('.mail-create-error');
            if (!err && this.createPanel) {
                err = el('p', 'mail-create-error');
                err.setAttribute('role', 'alert');
                const bar = this.createPanel.querySelector('.mail-create-bar');
                this.createPanel.insertBefore(err, bar || null);
            }
            if (err) err.textContent = 'Pick an address first.';
            return false;
        }
        const writes = createAccountWrites(this.config, id, choice, this.globals);
        if (!writes) return false;
        for (const [name, value] of writes) {
            writeGlobal(name, value, { emitAlways: true });
            // A params.globals object that is not gameState's own still has to see the write.
            if (this.params.globals && this.params.globals !== window.gameState?.globalVariables) {
                this.params.globals[name] = value;
            }
        }
        this.closeCreateAccount(false);
        this._loadAccounts(id); // the new account now resolves, so this lands on it
        this._rememberAccount();
        if (this.account) ensureMailbox(this.mailState, this.account.mailbox);
        const hadCompose = this.composeOpen;
        if (hadCompose) this.closeCompose(false);
        this._dismissChecklist();
        this.folder = 'inbox';
        this.reader.selectedId = null;
        this.notice = this.account && this.account.id === id ? `Account created: ${this.account.address}` : '';
        this._refresh();
        if (hadCompose) this.openCompose();
        this.switcher?.focus?.();
        this._changed({ type: 'account-created', id, mailbox: this.account?.mailbox });
        try { this.params.onAccountCreated?.(id, choice); } catch (err) { console.error('mail onAccountCreated failed:', err); }
        // Push the new account to any other open client (T2-7).
        try { notifyAccountCreated(id, { source: this }); } catch (err) { console.error('mail notifyAccountCreated failed:', err); }
        return true;
    }

    /**
     * Another open client created `accountId` (T2-7). Re-resolve this device's
     * accounts from the now-updated globals, keeping the account in view, and
     * refresh so a switcher that should now list it does. A client that does not
     * offer the account resolves the same list and nothing changes.
     */
    accountListChanged(accountId) {
        if (!this.root) return;
        const before = this.accounts.length;
        this._loadAccounts(this.account?.id);
        if (this.accounts.length !== before) this._refresh();
    }

    setFolder(folder) {
        const next = folder === 'sent' ? 'sent' : 'inbox';
        if (next === this.folder) return;
        this.folder = next;
        this.reader.selectedId = null;
        this.notice = '';
        this._refresh();
    }

    /** Clear the arrival notice and update its line now (A11: it outstayed its welcome). */
    _clearNotice() {
        if (!this.notice) return;
        this.notice = '';
        if (this.noticeEl) this.noticeEl.textContent = '';
    }

    _markRead(rec) {
        if (this.folder !== 'inbox' || rec.read === true) return;
        rec.read = true;
        recountUnread(this.mailState, rec.mailbox || this.account.mailbox);
        const count = this.inboxTab.querySelector('.mail-folder-count');
        const n = this.mailState.mailboxes[this.account.mailbox].unread;
        count.textContent = n > 0 ? String(n) : '';
        this._renderSwitcher();
        this._changed({ type: 'read', mailbox: rec.mailbox, id: rec.id });
    }

    // ── contacts ─────────────────────────────────────────────────────────────

    /**
     * Visible contacts for the open account. A contact with a `character` also carries
     * `recordId`, the Phase 0 headless record the character replies from (00 S8).
     */
    contacts() {
        if (!this.account) return [];
        return visibleContacts(this.config, this.account.id, this.globals).map((c) => {
            const recordId = contactRecordId(this.social, c);
            return recordId ? { ...c, recordId } : c;
        });
    }

    toggleContacts() {
        if (this.contactsOpen) this.closeContacts(); else this.openContacts();
    }

    openContacts() {
        if (this.contactsOpen || this.params.readOnly === true) return;
        this.contactsOpen = true;
        const panel = el('div', 'mail-contacts-panel');
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Contacts');
        panel.appendChild(el('h2', 'mail-contacts-title', 'Contacts'));
        const list = el('ul', 'mail-contacts-list');
        const contacts = this.contacts();
        if (!contacts.length) list.appendChild(el('li', 'mail-empty', 'No contacts yet.'));
        for (const c of contacts) {
            const li = el('li', 'mail-contact');
            li.dataset.id = c.id;
            li.append(el('span', 'mail-contact-name', c.name || c.id));
            if (c.role) li.append(document.createTextNode(' '), el('span', 'mail-contact-role', c.role));
            const addrs = el('span', 'mail-contact-addresses');
            addrs.textContent = (c.addresses || []).join(', ');
            li.appendChild(addrs);
            list.appendChild(li);
        }
        panel.appendChild(list);
        const back = el('button', 'mail-contacts-close minigame-button', 'Back');
        back.type = 'button';
        this.addEventListener(back, 'click', () => this.closeContacts());
        panel.appendChild(back);
        this.root.appendChild(panel);
        this.contactsPanel = panel;
        this._syncCovered();
        this._popContacts = this.pushLayer(() => this.closeContacts(), 'contacts');
        this.contactsBtn.setAttribute('aria-expanded', 'true');
        back.focus?.();
    }

    closeContacts() {
        if (!this.contactsOpen) return;
        this.contactsOpen = false;
        this.contactsPanel?.remove?.();
        this.contactsPanel = null;
        this._syncCovered();
        if (this._popContacts) { this._popContacts(); this._popContacts = null; }
        this.contactsBtn.setAttribute('aria-expanded', 'false');
        this.contactsBtn.focus?.();
    }

    // ── compose (P1-E2) ────────────────────────────────────────────────────────

    /**
     * The Compose button opens the composer. Pressed again while it is open, it keeps the draft
     * on screen and moves focus into it: a second press used to close the pane, so a learner who
     * clicked Compose twice lost the form (F12). The composer's own Close closes it.
     */
    toggleCompose() {
        if (!this.composeOpen) { this.openCompose(); return; }
        const r = this.composer?.root;
        const first = r?.querySelector?.('select, input, textarea, button');
        if (first) first.focus?.();
        else r?.focus?.();
    }

    /**
     * Open the composer. `extra` carries a judged follow-up (01 N8, #compose_reply):
     * `{ forceTargetId, inReplyTo, presetContactId }` fixes the target and recipient and
     * threads the reply. A fresh crafted message passes nothing.
     */
    openCompose(extra = {}) {
        if (this.composeOpen || !this.account || this._sendCapReached() || this.params.readOnly === true) return;
        this.composeOpen = true;
        const social = this.social;
        // A judged follow-up does not reuse the unsent draft of a fresh message.
        const draft = extra.forceTargetId ? null : (this.mailState.drafts && this.mailState.drafts[this.account.id]);
        this.composer = new MailComposer(this.root, {
            people: social.people,
            templates: social.templates,
            phishTargets: social.phishTargets,
            intelFacts: social.intelFacts,
            payloadKit: this.config.payloadKit,
            landingPages: social.landingPages,
            account: this.account,
            accounts: this.accounts,
            onSendAs: (id) => this.switchAccount(id),
            onAttachLink: (kit) => this._launchBuilderForLink(kit),
            contacts: this.contacts(),
            globals: this.globals,
            draft,
            forceTargetId: extra.forceTargetId || null,
            inReplyTo: extra.inReplyTo || '',
            presetContactId: extra.presetContactId || null,
            carryDraft: extra.carryDraft || null,
            meterDefault: this.config.showRedFlagMeter === true,
            // Free-text flavour body (01 §2, 00 §13): the scenario turns the extra box on
            // with mailClient.bodyMode "freeText" or freeTextFlavour; the composer keeps it
            // unscored and unread.
            bodyMode: this.config.bodyMode,
            freeTextFlavour: this.config.freeTextFlavour === true,
            evaluate: (message) => this._liveJudge(message),
            pushLayer: (close, name) => this.pushLayer(close, name),
            onSend: (message, composer) => this._handleComposeSend(message, composer),
            onChange: (d) => this._onDraftChange(d),
            onClose: () => this.closeCompose()
        });
        this.composer.root.classList.add('mail-compose-panel');
        this._syncCovered();
        this._popCompose = this.pushLayer(() => this.closeCompose(), 'compose');
        this.composeBtn.setAttribute('aria-expanded', 'true');
    }

    closeCompose(restoreFocus = true) {
        if (!this.composeOpen) return;
        this.composeOpen = false;
        this._dismissChecklist();
        this.composer?.destroy?.();
        this.composer = null;
        this._syncCovered();
        if (this._popCompose) { this._popCompose(); this._popCompose = null; }
        this.composeBtn.setAttribute('aria-expanded', 'false');
        if (restoreFocus) this.composeBtn.focus?.();
    }

    /**
     * Attach a link whose page is not built yet (01 N4, §2 "Attach a link that has no
     * page"): save the draft, open the landing-page builder on top, and come back here
     * when it closes. The reopened client restores the draft, reopens Compose and attaches
     * the link if the page record is now built (07's Attach / Attach anyway set built: true).
     */
    _launchBuilderForLink(kit) {
        if (!kit || typeof kit.landingPageId !== 'string' || !kit.landingPageId) return;
        this._pendingLinkKit = kit.id;
        const child = this.launchChild('landing-page-builder', {
            landingPageId: kit.landingPageId,
            targetId: this.composer?.target?.id || null,
            kitId: kit.id
        });
        if (!child) {
            // The builder did not start: stay open, clear the pending flag.
            this._pendingLinkKit = null;
            window.gameAlert?.('Page builder unavailable.', 'error', 'Error', 3000);
        }
    }

    /**
     * Draft persistence (01 §2 "Drafts", 00 §10a): one draft per account in
     * mailState, written on every change and before any nested launch. The
     * scheduler owns mailState.drafts; also forward to any params hook.
     */
    _onDraftChange(draft) {
        const id = this.account?.id;
        if (id) {
            if (this.scheduler?.setDraft) this.scheduler.setDraft(id, draft);
            else { (this.mailState.drafts || (this.mailState.drafts = {}))[id] = draft; }
        }
        try { this.params.onDraftChange?.(draft, id); } catch (err) { console.error('mail onDraftChange failed:', err); }
    }

    /**
     * Judge the composer's current draft for the live red-flag meter (01, 04), with the
     * same bias and ctx the send path uses, but no side effects. Returns null when there
     * is no target to judge.
     */
    _liveJudge(message) {
        const social = this.social || {};
        const target = resolveTarget(social, message && message.targetId);
        if (!target) return null;
        const metrics = (this.mailState && this.mailState.metrics) || {};
        const m = metrics[target.id];
        const priorFailures = m && typeof m.failed === 'number' ? m.failed : 0;
        const judged = applyFactorBias(target, this.globals);
        const ctx = { accounts: this.accounts, people: social.people, templates: social.templates,
                      payloadKit: this.config.payloadKit, priorFailures };
        try { return evaluateMessage(judged, message, ctx); } catch (err) { console.error('mail meter judge failed:', err); return null; }
    }

    /**
     * A gated-open send (01 §3, N6/N17): the bridge judges the message, writes
     * the Sent record and the delivery job, updates metrics and the attempts
     * global, then this shows the checklist in training mode. The overlay stays
     * open so the player can read it and edit/resend (01 §3 "the overlay stays open").
     */
    _handleComposeSend(message, composer) {
        if (this._sendCapReached()) return;
        this.lastComposed = message;
        let sendInfo = null;
        try {
            sendInfo = performSend(this, message);
        } catch (err) {
            console.error('mail send failed:', err);
        }
        if (sendInfo && !sendInfo.lockedOut) {
            this.recordSend(sendInfo.gameResult);
            if (typeof sendInfo.record?.id === 'string') this.sentIds.push(sendInfo.record.id);
            // A judged send clears the saved draft so reopening Compose starts fresh,
            // not on the last send's choices (P1-T). The open composer keeps its form
            // in memory for an Edit & resend.
            if (sendInfo.result) this._clearDraft();
            if (sendInfo.result && this._checklistTiming() === 'onSend') {
                this._showChecklist(sendInfo);
            } else if (sendInfo.result && sendInfo.record?.id) {
                // withReply: hold the checklist until the delivery job for this message has run.
                (this._heldChecklists || (this._heldChecklists = new Map())).set(sendInfo.record.id, sendInfo);
                this._dismissChecklist();
            } else {
                this._dismissChecklist();
            }
            // At the cap there is nothing left to edit: a shown checklist closes the composer
            // when dismissed (below), otherwise it closes now.
            if (this._sendCapReached() && !this.checklistPanel) this.closeCompose(false);
            this._syncCap();
        }
        try { this.params.onSend?.(message, composer, this, sendInfo); } catch (err) { console.error('mail onSend hook failed:', err); }
    }

    // ── checklist (N17) ────────────────────────────────────────────────────────

    _showChecklist(sendInfo) {
        this._dismissChecklist();
        // The reply-to note talks about where the reply goes, so it waits for a send that gets a
        // reply (an awareness miss gets none; P3 N-5).
        const showReplyToNote = !!sendInfo.claimedFrom && !this._claimedFromNoticeShown && sendInfo.replyScheduled !== false;
        if (showReplyToNote) this._claimedFromNoticeShown = true;
        // A reply is on its way whenever the send scheduled one (a data-only text job
        // or a character's on_email ink job), so the player is not left at a dead end
        // after closing the client (A13, P1-T T4). performSend reports it.
        const showReplyPending = sendInfo.replyScheduled === true;
        // After a landing there is nothing to resend, so "Done" closes the composer
        // and returns to the inbox rather than dropping back onto a still-sendable
        // form (A11). A failed send keeps the composer for Edit & resend.
        const panel = renderChecklist(sendInfo.result, sendInfo.target, {
            claimedFrom: sendInfo.claimedFrom,
            account: this.account,
            showReplyToNote,
            showReplyPending,
            onEdit: () => { this._dismissChecklist(); if ((sendInfo.result && sendInfo.result.landed) || this._sendCapReached()) this.closeCompose(); }
        });
        // With no resend left, "Edit & resend" would be a lie.
        if (this._sendCapReached()) {
            const edit = panel.querySelector('.mail-checklist-edit');
            if (edit) edit.textContent = 'Done';
        }
        this.root.appendChild(panel);
        this.checklistPanel = panel;
        this._syncCovered();
        // Esc/× on the checklist closes the whole client, the same as the overlay's own Close
        // button, so "Close" means one thing across the three (lab R4 F4/A5). Before, Esc popped
        // the checklist and the composer and left the student on the inbox, needing a second press
        // to leave (lab R1 F11; lab R3 F10 only got it down to the inbox). The explicit
        // "Edit & resend" BUTTON (onEdit above) is still the one path that keeps the composer open
        // to edit a miss. requestClose honours closeMode: after a send (sentThisSession > 0) it is
        // a normal exit with the last result.
        this._popChecklist = this.pushLayer(() => {
            this._dismissChecklist();
            this.requestClose();
        }, 'checklist');
        const action = panel.querySelector('.mail-checklist-edit, .mail-checklist-done');
        action?.focus?.();
    }

    /** Clear the saved draft for the open account (P1-T: a send resets the composer). */
    _clearDraft() {
        const id = this.account?.id;
        if (!id) return;
        if (this.scheduler?.setDraft) this.scheduler.setDraft(id, null);
        else if (this.mailState.drafts) delete this.mailState.drafts[id];
    }

    _dismissChecklist() {
        if (this._popChecklist) { this._popChecklist(); this._popChecklist = null; }
        this.checklistPanel?.remove?.();
        this.checklistPanel = null;
        this._syncCovered();
    }

    /**
     * The contacts panel, composer and checklist are opaque panels over the toolbar and reader.
     * While one is up, what is under it is inert so Tab never lands on a control the player
     * cannot see (01 "Narrow screens": every control reachable in order).
     */
    _syncCovered() {
        const covered = !!(this.contactsOpen || this.composeOpen || this.checklistPanel);
        for (const node of [this.toolbar, this.reader?.root]) {
            if (!node) continue;
            if (covered) node.setAttribute('inert', ''); else node.removeAttribute('inert');
        }
        // The checklist covers the composer too, so Tab can't reach the sent form's Send under it
        // and send the same message again (lab R20 F20-4). Edit & resend lifts this.
        const form = this.composer?.root;
        if (form) {
            if (this.checklistPanel) form.setAttribute('inert', ''); else form.removeAttribute('inert');
        }
    }

    // ── arrival (N14) ────────────────────────────────────────────────────────

    /**
     * Append a delivered message (a reply, timed mail) while the client is open.
     * No bark: notifyNewMail() routes here when this client holds the mailbox.
     * The scheduler has already committed the record to mailState; if it has
     * not (the test path), it is added here.
     */
    receiveMessage(record) {
        if (!record || !this.account || !this.holdsMailbox(record.mailbox)) return false;
        const box = ensureMailbox(this.mailState, record.mailbox);
        if (!box.messages.some((m) => m.id === record.id)) box.messages.push(record);
        recountUnread(this.mailState, record.mailbox);
        const who = record.from?.name || record.from?.address || 'someone';
        if (record.mailbox !== this.account.mailbox) {
            // Another of this device's accounts: only its unread count in the switcher moves.
            const owner = this.accounts.find((a) => a.mailbox === record.mailbox);
            this.notice = `New message for ${owner ? owner.address : record.mailbox} from ${who}: ${record.subject || '(no subject)'}`;
            this._refresh();
            this._changed({ type: 'arrival', mailbox: record.mailbox, id: record.id });
            return true;
        }
        this.notice = `New message from ${who}: ${record.subject || '(no subject)'}`;
        const keep = this.reader.selectedId;
        this._refresh();
        if (keep && this.reader.records.some((r) => r.id === keep)) this.reader.selectedId = keep;
        this._changed({ type: 'arrival', mailbox: record.mailbox, id: record.id });
        return true;
    }

    /** Re-read the folder after another module (the composer) wrote a sent record. */
    refresh() {
        this._refresh();
    }

    // ── thread follow-ups (N8) ────────────────────────────────────────────────

    /** The thread record and key for the open message. */
    _threadFor(rec) {
        const key = rec && typeof rec.thread === 'string' ? rec.thread : null;
        return { key, thread: key ? (this.mailState?.threads?.[key] || null) : null };
    }

    /** Is `rec` the newest inbox message of its thread, so a pending follow-up belongs to it? */
    _isLatestInThread(rec) {
        const key = rec && rec.thread;
        if (!key || !this.account) return false;
        const list = this.mailState?.mailboxes?.[this.account.mailbox]?.messages;
        if (!Array.isArray(list)) return false;
        let latest = null;
        for (const m of list) {
            if (m.folder === 'sent' || m.thread !== key) continue;
            if (!latest || (m.gameTime || 0) >= (latest.gameTime || 0)) latest = m;
        }
        return !!latest && latest.id === rec.id;
    }

    /**
     * The one follow-up control under an open inbox reply (01 N8, 00 §10): "Choose a
     * reply" lists the ink's options, or "Write your reply. This one is judged" opens
     * the judged composer for a #compose_reply target. Exactly one, from
     * threads[key].expects, only on the newest reply of the thread.
     */
    _renderFollowups(rec, pane) {
        if (!rec || rec.folder === 'sent' || rec.kind === 'quickReply') return;
        const { key, thread } = this._threadFor(rec);
        const expects = thread && thread.expects;
        if (!key || !expects || !this._isLatestInThread(rec)) return;

        const wrap = el('div', 'mail-followup');
        if (expects.mode === 'compose' && typeof expects.targetId === 'string') {
            const btn = el('button', 'mail-followup-compose minigame-button', 'Write your reply. This one is judged');
            btn.type = 'button';
            this.addEventListener(btn, 'click', () => this.openComposeReply(expects.targetId, rec.id));
            wrap.appendChild(btn);
        } else if (expects.mode === 'choices' && Array.isArray(expects.options) && expects.options.length) {
            wrap.appendChild(el('p', 'mail-followup-label', 'Choose a reply'));
            const list = el('div', 'mail-followup-options');
            list.setAttribute('role', 'group');
            list.setAttribute('aria-label', 'Choose a reply');
            expects.options.forEach((text, i) => {
                const opt = el('button', 'mail-followup-option minigame-button', text);
                opt.type = 'button';
                opt.dataset.choice = String(i);
                this.addEventListener(opt, 'click', () => this.pickReplyOption(key, i, rec));
                list.appendChild(opt);
            });
            wrap.appendChild(list);
        } else {
            return;
        }
        pane.appendChild(wrap);
    }

    /**
     * The player picks an unscored ink reply option (01 N8). Writes a quickReply Sent
     * record, queues the continuation ink job (the runner loads the stored position and
     * ChooseChoiceIndex) after the reply delay, and clears the expectation while keeping
     * the stored position, so the control does not linger; the continuation sets a fresh
     * expectation on its own reply.
     */
    pickReplyOption(threadKey, index, rec) {
        const thread = this.mailState?.threads?.[threadKey];
        const options = thread && thread.expects && Array.isArray(thread.expects.options) ? thread.expects.options : [];
        const text = options[index];
        if (typeof text !== 'string') return false;

        const account = this.account;
        const quick = {
            kind: 'quickReply',
            thread: threadKey,
            folder: 'sent',
            fromAccount: account ? account.id : null,
            from: { name: account ? (account.displayName || account.address || '') : '', address: account ? (account.address || '') : '' },
            to: (rec && rec.from && rec.from.address) ? rec.from.address : '',
            targetId: null,
            subject: (rec && rec.subject) ? (/^re:/i.test(rec.subject) ? rec.subject : `Re: ${rec.subject}`) : '',
            templates: {}, slots: {}, body: text,
            attachment: null, link: null, landed: null, tells: [], read: true
        };
        if (this.scheduler?.addMessage) this.scheduler.addMessage(account ? account.mailbox : null, quick);

        if (this.scheduler?.setThread) {
            const kept = {};
            if (thread && typeof thread.position === 'string') kept.position = thread.position;
            if (thread && Array.isArray(thread.choices)) kept.choices = thread.choices;
            this.scheduler.setThread(threadKey, Object.keys(kept).length ? kept : null);
        }

        // Lazy import keeps the runner (and its ink engine) off the shell's static graph.
        import('../../systems/mail-runner.js').then((m) => {
            try {
                m.scheduleChoiceReply(this.scheduler, {
                    threadKey, choiceIndex: index, msgId: rec ? rec.id : null, scenario: { social: this.social }
                });
            } catch (err) { console.error('mail scheduleChoiceReply failed:', err); }
        }).catch((err) => console.error('mail could not load mail-runner:', err));

        this._refresh();
        this._changed({ type: 'quickReply', mailbox: account ? account.mailbox : null, id: quick.id });
        return true;
    }

    /** Open the composer for a judged follow-up (#compose_reply target), pre-addressed to the thread. */
    openComposeReply(targetId, inReplyToId) {
        const target = resolveTarget(this.social, targetId);
        if (!target) return false;
        const character = target.character;
        const contact = this.contacts().find((c) => c && (c.targetId === targetId || c.character === character)) || null;
        if (this.composeOpen) this.closeCompose(false);
        this.openCompose({ forceTargetId: targetId, inReplyTo: inReplyToId || '', presetContactId: contact ? contact.id : null });
        return true;
    }

    // ── highlights (N16) ──────────────────────────────────────────────────────

    /** Save a highlighted span: grant its fact (source = highlight id), else save its text to the notepad. */
    _saveHighlight(highlight) {
        if (!highlight) return;
        if (typeof highlight.grants === 'string' && highlight.grants) {
            // Lazy import keeps social-intel off the shell's static graph (as the runner is).
            import('../../systems/social-intel.js').then((m) => {
                try { m.grantFact(highlight.grants, { source: highlight.id || 'highlight' }); this._refresh(); }
                catch (err) { console.error('mail grantFact failed:', err); }
            }).catch((err) => console.error('mail could not load social-intel:', err));
        } else if (typeof highlight.text === 'string') {
            this._saveSelection(highlight.text);
            this._refresh();
        }
    }

    /** Send a free selection to the notepad (01 N16). */
    _saveSelection(text) {
        if (typeof text !== 'string' || !text) return;
        if (typeof window !== 'undefined' && typeof window.addNote === 'function') {
            try { window.addNote('Note', text, false); } catch (err) { console.error('mail addNote failed:', err); }
        }
    }

    // ── close, result, return ────────────────────────────────────────────────

    /** The composer calls this after a send with the 01 §3 gameResult transform. */
    recordSend(result) {
        this.sentThisSession += 1;
        this.lastSendResult = result || null;
    }

    /**
     * Close with nothing sent ends as { aborted: true } and records nothing (01 "Closing the
     * client"). An episode child is the exception: it closes normally so its returnTo reopens
     * the episode runner on the write step, instead of aborting all the way out to the game
     * world (P1 m6/F12, E5-11). closeResult carries an empty sentIds, so the runner sees nothing
     * was sent and stays on write rather than advancing to the flip.
     */
    get closeMode() {
        // A read-only mailbox can never send, so leaving it is a normal exit, not a failed run.
        if (this.params.readOnly === true) return 'close';
        if (this.sentThisSession > 0) return 'close';
        if (this._episodeMode() && this.params.returnTo) return 'close';
        return 'abort';
    }

    closeResult() {
        const base = this.lastSendResult || { outcome: 'closed' };
        // sentIds only in episode mode (a cap or a reopen carrying ids), so a plain client's result is as before.
        return this._episodeMode() ? { ...base, sentIds: [...this.sentIds] } : base;
    }

    returnParams() {
        const params = { accountId: this.account?.id || null, suspended: false };
        if (this._episodeMode()) params.sentIds = [...this.sentIds];
        // Coming back from the landing-page builder: reopen Compose and attach the link if
        // its page is now built (01 §2 "Attach a link that has no page").
        if (this._pendingLinkKit) {
            params.reopenCompose = true;
            params.attachLinkKit = this._pendingLinkKit;
            this._pendingLinkKit = null;
        }
        return params;
    }

    // ── test bridge ──────────────────────────────────────────────────────────

    getTestState() {
        const acct = this.account;
        const box = acct ? this.mailState?.mailboxes?.[acct.mailbox] : null;
        const reader = this.reader?.getState?.() || null;
        const narrow = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia(NARROW_QUERY).matches : false;
        const phone = this.params.layout === 'phone';
        // The open reply's one follow-up expectation (01 N8), for the bridge check.
        const selRec = this.reader?.selected?.() || null;
        const ft = selRec ? this._threadFor(selRec) : { thread: null };
        const followup = (selRec && ft.thread && ft.thread.expects && this._isLatestInThread(selRec)) ? ft.thread.expects : null;
        return {
            ...super.getTestState(),
            mail: {
                account: acct ? { id: acct.id, address: acct.address, displayName: acct.displayName, mailbox: acct.mailbox } : null,
                accounts: this.accounts.map((a) => a.id),
                switcher: {
                    visible: !!this.switcher && !this.switcher.hidden,
                    options: this.switcher ? [...this.switcher.options].map((o) => ({ value: o.value, text: o.textContent })) : [],
                    value: this.switcher ? this.switcher.value : null
                },
                unreadByAccount: Object.fromEntries(this.accounts.map((a) => [a.id, this.unreadOf(a.mailbox)])),
                burned: this.accounts.filter((a) => a.burned).map((a) => a.id),
                creatable: this.creatable.map((c) => c.id),
                createOpen: this.createOpen,
                createMenu: this.createOpen
                    ? [...this.createPanel.querySelectorAll('input')].map((i) => ({ id: i.value, checked: i.checked }))
                    : [],
                createChoice: this.createChoice,
                contactRecords: Object.fromEntries(this.contacts().filter((c) => c.recordId).map((c) => [c.id, c.recordId])),
                folder: this.folder,
                unread: box ? box.unread || 0 : 0,
                selectedId: reader?.selectedId ?? null,
                detailsOpen: reader?.detailsOpen ?? false,
                linkNote: reader?.linkNote ?? '',
                messages: reader?.messages ?? [],
                highlights: reader?.highlights ?? [],
                followup,
                contactsOpen: this.contactsOpen,
                contacts: this.contacts().map((c) => c.id),
                sentThisSession: this.sentThisSession,
                ...(this._episodeMode() ? {
                    sentIds: [...this.sentIds],
                    maxSends: this._maxSends() || null,
                    sendCapReached: this._sendCapReached(),
                    layout: phone ? 'phone' : null
                } : {}),
                notice: this.notice,
                narrow: narrow || phone
            }
        };
    }
}
