// The IT request form (ops layer S8b, unit 07): a paper form that asks an IT desk to reset a
// password or a sign-in second step. It draws the fields the desk's form lists (a username, a
// choice of what is asked for when the desk does both, one text field per recovery question) and
// sends them through the helpdesk client (`HelpdeskClient.formFor`, `.send`). The server decides;
// this scene only shows the answer.
//
// Params: { deskId, pcId?, deps? } where deps may inject { helpdesk }. `helpdesk` defaults to
// window.helpdeskClient (the way code-device reaches window.mfaClient). A `pcId` is passed on
// when given and left out when not.
//
// A granted password is shown once on this form and held nowhere else here: not in the result,
// the test state, a global or an event. A normal close (so a chat the form was opened from
// returns). Every server or author string reaches the DOM through textContent.

import { SocialOverlayScene } from '../framework/social-overlay.js';
import { registerMinigameStarter } from '../../systems/minigame-registry.js';

export const MAX_FIELD = 64;
/** A send with no answer after this long is given up on (R2-CLIENT2). */
export const SEND_TIMEOUT_MS = 15000;
export const TEXT = Object.freeze({
    title: 'IT request form',
    username: 'Username',
    what: 'Ask for',
    password: 'A password reset',
    mfa: 'A sign-in approval reset',
    send: 'Send',
    grantedPassword: 'Password reset. New password:',
    passwordNote: 'It is saved under Sign-ins in your capture log, and on the sign-in screen.',
    passwordNoteNoLog: 'It is saved on the sign-in screen for this account.',
    sending: 'Sending your request...',
    noAnswer: 'The desk did not answer. Try again.',
    grantedMfa: 'Sign-in approvals now come to your phone.',
    refused: 'The desk could not verify you. Tries left: {n}.',
    blocked: 'The desk is not taking requests for that account. Try again in {n} {minutes}.',
    unavailable: 'The desk cannot take this request now.',
    failed: 'The request could not be sent.'
});

const win = () => (typeof window !== 'undefined' ? window : {});
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
let fieldSeq = 0;
const cut = (s) => Array.from(String(s ?? '')).slice(0, MAX_FIELD).join('');

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
}

/** The line a result shows. `body` is the server answer body; nothing but closed fields is read. */
export function resultLine(result, body) {
    const b = isObj(body) ? body : {};
    if (result === 'granted') {
        if (b.what === 'mfa') return TEXT.grantedMfa;
        return TEXT.grantedPassword;
    }
    if (result === 'refused') {
        const n = Number.isFinite(Number(b.triesLeft)) ? Math.max(0, Math.floor(Number(b.triesLeft))) : 0;
        return TEXT.refused.replace('{n}', String(n));
    }
    if (result === 'blocked') {
        const secs = Number(b.retryIn);
        const n = Number.isFinite(secs) && secs > 0 ? Math.ceil(secs / 60) : 1;
        return TEXT.blocked.replace('{n}', String(n)).replace('{minutes}', n === 1 ? 'minute' : 'minutes');
    }
    if (result === 'unavailable') return TEXT.unavailable;
    if (result === 'no_answer') return TEXT.noAnswer;
    return TEXT.failed;
}

export class HelpdeskRequestMinigame extends SocialOverlayScene {
    static framed = true;

    constructor(container, params) {
        super(container, { title: TEXT.title, ...(params || {}) });
        this.form = null;
        this.fields = {};
        this.answerEls = {};
        this.whatChoice = null;
        this.lastResult = null;
        this._passwordShown = false;
        this._sending = false;
    }

    get client() {
        return this.params.deps?.helpdesk || win().helpdeskClient || null;
    }

    init() {
        super.init();
        this.container.classList.add('hr-minigame-container');
        const raw = this.client?.formFor?.(this.params.deskId);
        this.form = this._cleanForm(raw);

        const root = el('div', 'hr-root');
        root.setAttribute('role', 'region');
        root.setAttribute('aria-label', TEXT.title);
        this.root = root;
        this.gameContainer.appendChild(root);

        const bar = el('div', 'hr-toolbar');
        bar.appendChild(el('h2', 'hr-title', TEXT.title));
        this.mountCloseControl(bar, 'Close');
        root.appendChild(bar);

        this.stageEl = el('div', 'hr-stage');
        root.appendChild(this.stageEl);
        this.resultEl = el('div', 'hr-result');
        this.resultEl.setAttribute('role', 'status');
        this.resultEl.setAttribute('aria-live', 'polite');
        root.appendChild(this.resultEl);

        if (!this.form) {
            this._showResult('error', {});
            return;
        }
        this._renderForm();
    }

    start() {
        super.start();
        this.fields.username?.focus?.();
    }

    _cleanForm(raw) {
        if (!isObj(raw)) return null;
        const resets = (Array.isArray(raw.resets) ? raw.resets : []).filter((r) => r === 'password' || r === 'mfa');
        if (!resets.length || typeof this.params.deskId !== 'string' || !this.params.deskId) return null;
        const labels = isObj(raw.questionLabels) ? raw.questionLabels : {};
        const questions = Object.entries(labels).filter(([, label]) => typeof label === 'string').map(([id, label]) => ({ id, label }));
        return { resets: [...new Set(resets)], questions };
    }

    _renderForm() {
        const paper = el('form', 'hr-paper');
        paper.noValidate = true;
        this.addEventListener(paper, 'submit', (e) => { e.preventDefault?.(); this._send(); });

        paper.appendChild(this._field('username', TEXT.username, 'hr-username'));

        if (this.form.resets.length > 1) {
            const group = el('fieldset', 'hr-what');
            group.appendChild(el('legend', 'hr-label', TEXT.what));
            this.whatChoice = this.form.resets[0];
            for (const kind of this.form.resets) {
                const row = el('label', 'hr-choice');
                const radio = el('input');
                radio.type = 'radio';
                radio.name = 'hr-what';
                radio.value = kind;
                radio.checked = kind === this.whatChoice;
                this.addEventListener(radio, 'change', () => { if (radio.checked) this.whatChoice = kind; });
                row.append(radio, el('span', 'hr-choice-text', TEXT[kind]));
                group.appendChild(row);
            }
            paper.appendChild(group);
        } else {
            this.whatChoice = this.form.resets[0];
        }

        for (const q of this.form.questions) {
            const row = this._field(`q:${q.id}`, q.label, 'hr-answer');
            row.dataset.question = q.id;
            this.answerEls[q.id] = this.fields[`q:${q.id}`];
            paper.appendChild(row);
        }

        const send = el('button', 'hr-send minigame-button', TEXT.send);
        send.type = 'submit';
        this.sendButton = send;
        paper.appendChild(send);
        this.stageEl.appendChild(paper);
    }

    _field(key, label, cls) {
        const row = el('div', `hr-row ${cls}`);
        const id = `hr-${key.replace(/[^a-z0-9]/gi, '-')}-${++fieldSeq}`;
        const lab = el('label', 'hr-label', label);
        lab.htmlFor = id;
        const input = el('input', 'hr-input');
        input.type = 'text';
        input.id = id;
        input.maxLength = MAX_FIELD;
        input.autocomplete = 'off';
        input.spellcheck = false;
        this.fields[key] = input;
        row.append(lab, input);
        return row;
    }

    async _send() {
        if (this._sending || !this.form) return;
        const username = cut(this.fields.username.value).trim();
        if (!username) { this.fields.username.focus?.(); return; }
        const client = this.client;
        if (typeof client?.send !== 'function') { this._showResult('error', {}); return; }
        const answers = {};
        for (const q of this.form.questions) answers[q.id] = cut(this.answerEls[q.id].value);
        const request = { deskId: this.params.deskId, username, what: this.whatChoice, answers };
        if (typeof this.params.pcId === 'string' && this.params.pcId) request.pcId = this.params.pcId;

        this._sending = true;
        this._passwordShown = false;
        if (this.sendButton) this.sendButton.disabled = true;
        // Held while the desk is answering, so a granted password is never dropped unseen
        // (S8b R1-CLIENT4); given up on after SEND_TIMEOUT_MS (R2-CLIENT2)
        this.closeButton?.setAttribute?.('aria-disabled', 'true');
        this.resultEl.textContent = '';
        this.resultEl.dataset.result = 'sending';
        this.resultEl.appendChild(el('p', 'hr-result-line', TEXT.sending));
        let out = null;
        let timer = null;
        const timedOut = Symbol('timed out');
        let asked;
        try { asked = Promise.resolve(client.send(request)); } catch (err) { asked = Promise.reject(err); }
        asked.catch(() => {});
        try {
            out = await Promise.race([asked, new Promise((resolve) => { timer = setTimeout(() => resolve(timedOut), SEND_TIMEOUT_MS); })]);
        } catch {
            out = null;
        }
        clearTimeout(timer);
        this._sending = false;
        if (this.sendButton) this.sendButton.disabled = false;
        this.closeButton?.removeAttribute?.('aria-disabled');
        if (this._closed) return;
        // A late answer for a request given up on is dropped here: the promise above is not read again
        const result = out === timedOut ? 'no_answer' : (isObj(out) && typeof out.result === 'string' ? out.result : 'error');
        this._showResult(result, isObj(out?.body) ? out.body : {});
    }

    _showResult(result, body) {
        this.lastResult = result;
        this._passwordShown = false;
        this.resultEl.textContent = '';
        this.resultEl.dataset.result = result;
        this.resultEl.appendChild(el('p', 'hr-result-line', resultLine(result, body)));
        if (result === 'granted' && body.what !== 'mfa' && typeof body.password === 'string' && body.password) {
            this.resultEl.appendChild(el('p', 'hr-password', body.password));
            this.resultEl.appendChild(el('p', 'hr-note', this._holdsCaptureLog() ? TEXT.passwordNote : TEXT.passwordNoteNoLog));
            this._passwordShown = true;
        }
        if (result === 'granted') {
            for (const q of this.form?.questions || []) this.answerEls[q.id].value = '';
        }
    }

    // The same test as keyring.js heldCaptureLog (this scene imports nothing from the keyring)
    _holdsCaptureLog() {
        const items = Array.isArray(win().inventory?.items) ? win().inventory.items : [];
        return items.some((it) => it?.scenarioData?.type === 'capture_log' && it.scenarioData.holds?.captures === true);
    }

    // Close and Escape wait for the answer of a send in flight
    requestClose() {
        if (this._sending) return;
        super.requestClose();
    }

    // Close is a normal exit; the result carries no typed text and never the password.
    closeResult() {
        return { deskId: this.params.deskId ?? null, result: this.lastResult };
    }

    cleanup() {
        this._closed = true;
        if (this.resultEl) this.resultEl.textContent = '';
        super.cleanup?.();
    }

    getTestState() {
        return {
            ...super.getTestState(),
            helpdeskRequest: {
                deskId: this.params.deskId ?? null,
                hasForm: !!this.form,
                resets: this.form?.resets || [],
                what: this.whatChoice,
                questionIds: (this.form?.questions || []).map((q) => q.id),
                result: this.lastResult,
                passwordShown: this._passwordShown,
                sending: this._sending
            }
        };
    }
}

// Opened by object type `helpdesk_form` (an object, an ink tag or an event mapping) and by
// window.startHelpdeskRequest in minigame-starters.js, which looks this entry up by name.
registerMinigameStarter('helpdesk_form', { fn: 'startHelpdeskRequest', unavailable: 'Request form unavailable.' });

export default HelpdeskRequestMinigame;
