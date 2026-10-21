// Mail client overlay: the shell (SE design 01 N1 shell, N3, N5, N9, N12 view, N14, N15 inbox seeds).
//
// What is here: the account bar, Inbox and Sent folders over the shared
// MailReader, the contacts panel (contacts appear once their `revealedBy`
// global is true), seeded inbox mail, new-mail arrival, Close/Esc behaviour and
// getTestState(). What is not: the composer (P1-E2), the account switcher and
// Create-account panel (1b), registration, the starter and the CSS <link> (P1-W).
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
//   onComplete       function  (success, result) as for every minigame
// requiresKeyboardInput and disableClose are set by the base class.

import { SocialOverlayScene } from '../framework/social-overlay.js';
import { MailReader } from './mail-reader.js';
import { MailComposer } from './mail-composer.js';
import { registerOpenClient } from './mail-notification.js';
import { performSend, renderChecklist } from './mail-bridge.js';
import {
    resolveAccounts, visibleContacts, emptyMailState, ensureMailbox,
    recountUnread, seedMailState, folderMessages
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
    constructor(container, params) {
        super(container, params);
        this.folder = 'inbox';
        this.sentThisSession = 0;
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

    _loadAccounts() {
        this.accounts = resolveAccounts(this.config, this.params.accountIds, this.globals);
        const want = this.params.accountId || this.params.defaultAccount;
        this.account = this.accounts.find((a) => a.id === want) || this.accounts[0] || null;
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
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', 'Mail');
        this.root = root;
        this.gameContainer.appendChild(root);

        this._buildToolbar(root);
        this.noticeEl = el('p', 'mail-notice');
        this.noticeEl.setAttribute('aria-live', 'polite');
        root.appendChild(this.noticeEl);

        this.reader = new MailReader(root, {
            pushLayer: (close, name) => this.pushLayer(close, name),
            judgedVisible: (rec) => !(this._checklistTiming() === 'withReply' && rec.judgePending === true),
            onOpen: (rec) => this._markRead(rec)
        });
        this._refresh();
    }

    start() {
        super.start();
        this._unregister = registerOpenClient(this);
    }

    cleanup() {
        if (this._unregister) { this._unregister(); this._unregister = null; }
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
        acct.append(img, this.accountLabel);

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
        this.accountLabel.textContent = acct ? `${acct.displayName} <${acct.address}>` : 'No account';
        const unread = acct ? recountUnread(this.mailState, acct.mailbox) : 0;
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
    }

    setFolder(folder) {
        const next = folder === 'sent' ? 'sent' : 'inbox';
        if (next === this.folder) return;
        this.folder = next;
        this.reader.selectedId = null;
        this._refresh();
    }

    _markRead(rec) {
        if (this.folder !== 'inbox' || rec.read === true) return;
        rec.read = true;
        recountUnread(this.mailState, rec.mailbox || this.account.mailbox);
        const count = this.inboxTab.querySelector('.mail-folder-count');
        const n = this.mailState.mailboxes[this.account.mailbox].unread;
        count.textContent = n > 0 ? String(n) : '';
        this._changed({ type: 'read', mailbox: rec.mailbox, id: rec.id });
    }

    // ── contacts ─────────────────────────────────────────────────────────────

    contacts() {
        return this.account ? visibleContacts(this.config, this.account.id, this.globals) : [];
    }

    toggleContacts() {
        if (this.contactsOpen) this.closeContacts(); else this.openContacts();
    }

    openContacts() {
        if (this.contactsOpen) return;
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
        this._popContacts = this.pushLayer(() => this.closeContacts(), 'contacts');
        this.contactsBtn.setAttribute('aria-expanded', 'true');
        back.focus?.();
    }

    closeContacts() {
        if (!this.contactsOpen) return;
        this.contactsOpen = false;
        this.contactsPanel?.remove?.();
        this.contactsPanel = null;
        if (this._popContacts) { this._popContacts(); this._popContacts = null; }
        this.contactsBtn.setAttribute('aria-expanded', 'false');
        this.contactsBtn.focus?.();
    }

    // ── compose (P1-E2) ────────────────────────────────────────────────────────

    toggleCompose() {
        if (this.composeOpen) this.closeCompose(); else this.openCompose();
    }

    openCompose() {
        if (this.composeOpen || !this.account) return;
        this.composeOpen = true;
        const social = this.social;
        const draft = this.mailState.drafts && this.mailState.drafts[this.account.id];
        this.composer = new MailComposer(this.root, {
            people: social.people,
            templates: social.templates,
            phishTargets: social.phishTargets,
            intelFacts: social.intelFacts,
            payloadKit: this.config.payloadKit,
            account: this.account,
            contacts: this.contacts(),
            globals: this.globals,
            draft,
            pushLayer: (close, name) => this.pushLayer(close, name),
            onSend: (message, composer) => this._handleComposeSend(message, composer),
            onChange: (d) => this._onDraftChange(d),
            onClose: () => this.closeCompose()
        });
        this.composer.root.classList.add('mail-compose-panel');
        this._popCompose = this.pushLayer(() => this.closeCompose(), 'compose');
        this.composeBtn.setAttribute('aria-expanded', 'true');
    }

    closeCompose() {
        if (!this.composeOpen) return;
        this.composeOpen = false;
        this._dismissChecklist();
        this.composer?.destroy?.();
        this.composer = null;
        if (this._popCompose) { this._popCompose(); this._popCompose = null; }
        this.composeBtn.setAttribute('aria-expanded', 'false');
        this.composeBtn.focus?.();
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
     * A gated-open send (01 §3, N6/N17): the bridge judges the message, writes
     * the Sent record and the delivery job, updates metrics and the attempts
     * global, then this shows the checklist in training mode. The overlay stays
     * open so the player can read it and edit/resend (01 §3 "the overlay stays open").
     */
    _handleComposeSend(message, composer) {
        this.lastComposed = message;
        let sendInfo = null;
        try {
            sendInfo = performSend(this, message);
        } catch (err) {
            console.error('mail send failed:', err);
        }
        if (sendInfo) {
            this.recordSend(sendInfo.gameResult);
            // A judged send clears the saved draft so reopening Compose starts fresh,
            // not on the last send's choices (P1-T). The open composer keeps its form
            // in memory for an Edit & resend.
            if (sendInfo.result) this._clearDraft();
            if (sendInfo.result && this._checklistTiming() === 'onSend') {
                this._showChecklist(sendInfo);
            } else {
                this._dismissChecklist();
            }
        }
        try { this.params.onSend?.(message, composer, this, sendInfo); } catch (err) { console.error('mail onSend hook failed:', err); }
    }

    // ── checklist (N17) ────────────────────────────────────────────────────────

    _showChecklist(sendInfo) {
        this._dismissChecklist();
        const showReplyToNote = !!sendInfo.claimedFrom && !this._claimedFromNoticeShown;
        if (showReplyToNote) this._claimedFromNoticeShown = true;
        // A data-only target (no character) has a text job scheduled, so a reply is coming.
        const showReplyPending = !!(sendInfo.target && !sendInfo.target.character
            && sendInfo.result && sendInfo.result.open && sendInfo.result.open.opened !== false);
        const panel = renderChecklist(sendInfo.result, sendInfo.target, {
            claimedFrom: sendInfo.claimedFrom,
            account: this.account,
            showReplyToNote,
            showReplyPending,
            onEdit: () => this._dismissChecklist()
        });
        this.root.appendChild(panel);
        this.checklistPanel = panel;
        this._popChecklist = this.pushLayer(() => this._dismissChecklist(), 'checklist');
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
    }

    // ── arrival (N14) ────────────────────────────────────────────────────────

    /**
     * Append a delivered message (a reply, timed mail) while the client is open.
     * No bark: notifyNewMail() routes here when this client holds the mailbox.
     * The scheduler has already committed the record to mailState; if it has
     * not (the test path), it is added here.
     */
    receiveMessage(record) {
        if (!record || !this.account || record.mailbox !== this.account.mailbox) return false;
        const box = ensureMailbox(this.mailState, record.mailbox);
        if (!box.messages.some((m) => m.id === record.id)) box.messages.push(record);
        recountUnread(this.mailState, record.mailbox);
        const who = record.from?.name || record.from?.address || 'someone';
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

    // ── close, result, return ────────────────────────────────────────────────

    /** The composer calls this after a send with the 01 §3 gameResult transform. */
    recordSend(result) {
        this.sentThisSession += 1;
        this.lastSendResult = result || null;
    }

    /** Close with nothing sent ends as { aborted: true } and records nothing (01 "Closing the client"). */
    get closeMode() {
        return this.sentThisSession > 0 ? 'close' : 'abort';
    }

    closeResult() {
        return this.lastSendResult || { outcome: 'closed' };
    }

    returnParams() {
        return { accountId: this.account?.id || null, suspended: false };
    }

    // ── test bridge ──────────────────────────────────────────────────────────

    getTestState() {
        const acct = this.account;
        const box = acct ? this.mailState?.mailboxes?.[acct.mailbox] : null;
        const reader = this.reader?.getState?.() || null;
        const narrow = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia(NARROW_QUERY).matches : false;
        return {
            ...super.getTestState(),
            mail: {
                account: acct ? { id: acct.id, address: acct.address, displayName: acct.displayName, mailbox: acct.mailbox } : null,
                accounts: this.accounts.map((a) => a.id),
                folder: this.folder,
                unread: box ? box.unread || 0 : 0,
                selectedId: reader?.selectedId ?? null,
                detailsOpen: reader?.detailsOpen ?? false,
                linkNote: reader?.linkNote ?? '',
                messages: reader?.messages ?? [],
                contactsOpen: this.contactsOpen,
                contacts: this.contacts().map((c) => c.id),
                sentThisSession: this.sentThisSession,
                notice: this.notice,
                narrow
            }
        };
    }
}
