/**
 * The push part of the lock second-step pane (ops layer S8c, unit 19).
 *
 * A leaf module with no imports. `mountPush(host, ctx, settle)` fills `host` (a DOM element the
 * pane owns) for the kinds `push` and `push_number_match`. It sends the first request when it
 * mounts, shows the number the gate answer carried, the count sent and "Send again", and, when the
 * player holds the owner's `phone_friendface`, a "Check <owner>'s phone" button that draws the one
 * request for this lock as a card inside the pane.
 *
 * ctx: { subject, npcId, kind, number, ownerName?, lockName?, mfa?, setTimer? }
 *   subject    "object:<id>" or "door:<id>" (the string the multi-factor client takes)
 *   mfa        the multi-factor client (defaults to window.mfaClient)
 *   setTimer   (fn, ms) for the Send again wait (defaults to setTimeout)
 *   ownerName  how the pane names the owner (defaults to a title-cased npcId)
 *   lockName   the lock's name for the card until the phone's own name arrives
 * settle(outcome)  called once with 'passed', 'denied' or 'expired'.
 *
 * Returns { destroy(), getTestState() }. All text reaches the DOM through textContent.
 */

const DEFAULT_WAIT_S = 2;

function mk(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
}

function titleCase(id) {
    const s = String(id || '').replace(/[_-]+/g, ' ').trim();
    return s ? s.replace(/\b\w/g, (c) => c.toUpperCase()) : 'the owner';
}

/** The owner's held `phone_friendface` item (never the player's own phone), or null. */
export function heldOwnerPhone(npcId) {
    const items = typeof window !== 'undefined' ? window.inventory?.items : null;
    if (!npcId || !Array.isArray(items)) return null;
    for (const it of items) {
        const d = it && it.scenarioData ? it.scenarioData : it;
        if (d && d.type === 'phone_friendface' && d.owner === npcId) {
            return { id: d.id ?? null, name: typeof d.name === 'string' && d.name ? d.name : 'phone' };
        }
    }
    return null;
}

export function mountPush(host, ctx = {}, settle = () => {}) {
    const mfa = ctx.mfa || (typeof window !== 'undefined' ? window.mfaClient : null);
    const setTimer = typeof ctx.setTimer === 'function' ? ctx.setTimer : (fn, ms) => setTimeout(fn, ms);
    const subject = ctx.subject;
    const npcId = ctx.npcId || '';
    const owner = ctx.ownerName || titleCase(npcId);
    const phone = heldOwnerPhone(npcId);
    const numberMatch = ctx.kind === 'push_number_match';

    let dead = false;
    let settled = false;
    let sending = false;
    let sent = 0;
    let waitToken = 0;
    let card = null; // { name, numbers? }

    const root = mk('div', 'lock-step-push');
    const status = mk('div', 'lock-step-push-status', `A request was sent to ${owner}'s phone.`);
    status.setAttribute('role', 'status');
    const numberEl = mk('div', 'lock-step-push-number');
    numberEl.hidden = true;
    const countEl = mk('div', 'lock-step-push-count');
    countEl.setAttribute('aria-live', 'polite');
    const msgEl = mk('div', 'lock-step-push-message');
    msgEl.setAttribute('role', 'status');
    const actions = mk('div', 'lock-step-push-actions');
    const again = mk('button', 'lock-step-push-btn lock-step-push-again', 'Send again');
    again.type = 'button';
    actions.appendChild(again);
    let check = null;
    if (phone) {
        check = mk('button', 'lock-step-push-btn lock-step-push-check', `Check ${owner}'s phone`);
        check.type = 'button';
        actions.appendChild(check);
    }
    const cardEl = mk('div', 'lock-step-push-card');
    cardEl.hidden = true;
    root.append(status, numberEl, countEl, actions, cardEl, msgEl);
    host.appendChild(root);

    if (ctx.number != null && ctx.number !== '') {
        numberEl.textContent = `Number: ${ctx.number}`;
        numberEl.hidden = false;
    }

    const setMessage = (text) => { msgEl.textContent = text || ''; };
    const drawCount = () => { countEl.textContent = `Requests sent: ${sent}`; };
    drawCount();

    function finish(outcome) {
        if (settled || dead) return;
        settled = true;
        waitToken++;
        again.disabled = true;
        if (check) check.disabled = true;
        for (const b of cardEl.querySelectorAll('button')) b.disabled = true;
        try { settle(outcome); } catch (e) { /* the pane's own problem */ }
    }

    function holdAgain(seconds) {
        const secs = Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_WAIT_S;
        const token = ++waitToken;
        again.disabled = true;
        setTimer(() => {
            if (dead || settled || token !== waitToken) return;
            again.disabled = false;
        }, Math.ceil(secs * 1000));
    }

    // One outcome of a prompt, approve or similar result; true when it ended the step
    function ended(result) {
        if (result && result.ok && result.passed) { finish('passed'); return true; }
        switch (result && result.reason) {
            case 'expired': case 'gone': case 'locked': case 'stale':
                finish('expired'); return true;
            case 'cancelled':
                finish('denied'); return true;
            default: return false;
        }
    }

    async function send() {
        if (dead || settled || sending || !mfa) return;
        sending = true;
        again.disabled = true;
        setMessage('');
        let result;
        try {
            result = await mfa.prompt(subject);
        } catch (e) {
            result = { ok: false, reason: 'error' };
        } finally {
            sending = false;
        }
        if (dead || settled) return;
        if (ended(result)) return;
        if (result.ok && result.waiting) {
            const n = Number(result.body && result.body.promptsSent);
            sent = Number.isFinite(n) && n >= 0 ? n : sent + 1;
            drawCount();
            holdAgain(DEFAULT_WAIT_S);
            return;
        }
        if (result.reason === 'too_soon') {
            holdAgain(result.retryAfterS);
            setMessage('Wait a moment before sending another request.');
            return;
        }
        again.disabled = false;
        setMessage('That did not work. Try again.');
    }

    async function tap(opts) {
        if (dead || settled || !mfa) return;
        for (const b of cardEl.querySelectorAll('button')) b.disabled = true;
        let result;
        try {
            result = await mfa.approve(subject, opts);
        } catch (e) {
            result = { ok: false, reason: 'error' };
        }
        if (dead || settled) return;
        if (ended(result)) return;
        if (result.reason === 'no_phone') {
            card = null;
            cardEl.hidden = true;
            cardEl.textContent = '';
            if (check) check.disabled = true;
            setMessage('You no longer have that phone.');
            return;
        }
        for (const b of cardEl.querySelectorAll('button')) b.disabled = false;
        setMessage('That did not work. Try again.');
    }

    function drawCard(req) {
        cardEl.textContent = '';
        card = { name: String(req.name || ctx.lockName || ''), numbers: Array.isArray(req.numbers) ? req.numbers.slice() : null };
        cardEl.appendChild(mk('div', 'lock-step-push-card-name', card.name));
        const row = mk('div', 'lock-step-push-card-actions');
        if (numberMatch || card.numbers) {
            for (const n of card.numbers || []) {
                const b = mk('button', 'lock-step-push-btn lock-step-push-num', String(n));
                b.type = 'button';
                b.addEventListener('click', () => tap({ number: n }));
                row.appendChild(b);
            }
        } else {
            const ok = mk('button', 'lock-step-push-btn lock-step-push-approve', 'Approve');
            ok.type = 'button';
            ok.addEventListener('click', () => tap({}));
            row.appendChild(ok);
        }
        const deny = mk('button', 'lock-step-push-btn lock-step-push-deny', 'Deny');
        deny.type = 'button';
        deny.addEventListener('click', () => tap({ deny: true }));
        row.appendChild(deny);
        cardEl.appendChild(row);
        cardEl.hidden = false;
    }

    async function checkPhone() {
        if (dead || settled || !mfa) return;
        check.disabled = true;
        setMessage('');
        let res;
        try {
            res = await mfa.lockPhone(subject, { npcId });
        } catch (e) {
            res = { ok: false, reason: 'error' };
        }
        if (dead || settled) return;
        if (!res.ok) {
            setMessage(res.reason === 'no_phone' ? 'You no longer have that phone.' : 'That did not work. Try again.');
            check.disabled = res.reason === 'no_phone';
            return;
        }
        const [kind, ...rest] = String(subject).split(':');
        const id = rest.join(':');
        const req = res.requests.find((r) => r && r.targetType === kind && String(r.targetId) === id);
        check.disabled = false;
        if (!req) {
            cardEl.hidden = true;
            cardEl.textContent = '';
            card = null;
            setMessage('There is no request on this phone.');
            return;
        }
        drawCard(req);
    }

    again.addEventListener('click', send);
    if (check) check.addEventListener('click', checkPhone);

    // The first request goes out when the part mounts
    sent = 0;
    send();

    return {
        destroy() { dead = true; waitToken++; root.remove(); },
        getTestState() {
            return {
                status: status.textContent,
                number: numberEl.hidden ? '' : numberEl.textContent,
                count: sent,
                countLine: countEl.textContent,
                message: msgEl.textContent,
                sendAgainDisabled: again.disabled,
                checkPhone: check ? { label: check.textContent, disabled: check.disabled } : null,
                card: card ? { name: card.name, numbers: card.numbers, buttons: [...cardEl.querySelectorAll('button')].map((b) => b.textContent) } : null,
                settled
            };
        }
    };
}
