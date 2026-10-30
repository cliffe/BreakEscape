// The authored AI-assistant overlay (SE design 11; engine packet ENG-06, for E13).
//
// An approved workplace assistant with AUTHORED replies only. There is NO language model and
// NO network call anywhere: every reply, summary, draft sentence and document is a literal
// string read from the episode's `awarenessEpisode.assistant` block, so the scene is
// deterministic and gives the same reply on repeat (core_15 decision P; E13 §17, §18).
//
// It runs in the flip region of the episode runner (ENG-06): the runner opens it from the
// flip's Continue with launchChild, and on a normal close its returnTo reopens the runner,
// whose onComplete advances the flip stage to defend. The scene reads `params.config`
// (`awarenessEpisode.assistant`) and draws, in a fixed order, only the sections that config
// authors:
//
//   summarise  the "summarise my emails" mode: a button whose authored reply surfaces the
//              planted hidden instruction as a suggestion, plus a "show hidden text" reveal of
//              the white line and a no-blame empathy line (E13 §9.2 beat 1). With `byChoice`
//              (keyed by the sent pretext, params.sentTemplateId) the surfacing follows what the
//              learner actually wrote, falling back per field to the flat reply/empathy/hidden
//              (E13 MA3).
//   paste      the paste-hygiene panel: a source log of lines, each with an information-class
//              tag; the learner strikes lines out, then asks for a themes summary that lists
//              only the lines left in. A secret line left in draws a warning and a one-click
//              report. An optional `feedback` (clean/leftPersonal/leftPassword) confirms the
//              lesson after the summary (E13 §9.2 beat 2, MI2).
//   draft      the output-check panel: an authored draft whose sentences the learner reads, a
//              "Check source" action that opens an authored document, and the "can make
//              mistakes, check important information" disclaimer under the answer (beat 3). An
//              optional `feedback` (caught/missed) lands a verdict: `caught` on Check source,
//              `missed` on an optional "send without checking" button (MI2).
//   exchanges  generic authored question -> answer buttons, each showing the same reply every
//              time it is pressed.
//
// Safety (E13 §18): nothing the learner types is read (there is no text field anywhere); every
// string the learner reads goes in with textContent. No value leaves the scene.
//
// Close and Esc are a NORMAL exit (SocialOverlayScene), so a close never logs minigame_failed.

import { SocialOverlayScene } from '../framework/social-overlay.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const arr = (v) => (Array.isArray(v) ? v : []);

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

export class AssistantChatMinigame extends SocialOverlayScene {
    constructor(container, params) {
        super(container, params);
        this.config = isObj(this.params.config) ? this.params.config : {};
        // The pretext the learner actually sent (state.sent.templateId), so the summarise mode can
        // surface the branch for what they wrote rather than always the injection branch (E13 MA3).
        this.sentTemplateId = isStr(this.params.sentTemplateId) ? this.params.sentTemplateId : null;
    }

    init() {
        super.init();
        this.gameContainer.classList.add('ac-game-container');
        this._build();
    }

    start() {
        super.start();
        this.root?.focus?.();
    }

    get _title() {
        return isStr(this.config.title) ? this.config.title : 'Assistant';
    }

    get _disclaimer() {
        return isStr(this.config.disclaimer) ? this.config.disclaimer : null;
    }

    // ── shell ─────────────────────────────────────────────────────────────────
    _build() {
        const head = h('header', { class: 'ac-head' },
            h('h2', { class: 'ac-title', text: this._title }));
        const close = h('button', { type: 'button', class: 'se-overlay-close minigame-button ac-close',
            text: 'Close', 'aria-label': 'Close' });
        this.addEventListener(close, 'click', (e) => { e.preventDefault?.(); e.stopPropagation?.(); this.requestClose(); });
        this.closeButton = close;
        head.appendChild(h('div', { class: 'ac-head-buttons' }, close));

        this.body = h('div', { class: 'ac-body' });
        this.root = h('div', { class: 'ac-root', tabindex: '-1', role: 'region', 'aria-label': this._title }, head, this.body);
        this.gameContainer.appendChild(this.root);

        if (isStr(this.config.intro)) this.body.appendChild(h('p', { class: 'ac-intro', text: this.config.intro }));
        // E13 B2 finding 10: the window's finished sub-tasks are not kept across a reload (unlike
        // a saved stage), so a reopen starts them again. Warn up front, as the inbox and the write
        // stage do. config.reloadNote: '' suppresses it; a string overrides the default wording.
        const reloadNote = this.config.reloadNote === '' ? ''
            : (isStr(this.config.reloadNote) ? this.config.reloadNote
                : 'If you close or reload this window, these tasks start again.');
        if (reloadNote) this.body.appendChild(h('p', { class: 'ac-reload-note', text: reloadNote }));

        // Fixed section order; only the authored sections appear.
        if (isObj(this.config.summarise)) this._buildSummarise(this.config.summarise);
        if (isObj(this.config.paste)) this._buildPaste(this.config.paste);
        if (isObj(this.config.draft)) this._buildDraft(this.config.draft);
        this._buildExchanges(arr(this.config.exchanges));
    }

    /**
     * Split a string into text nodes with any web/email address in the address font
     * (--se-font-address, class ac-address), the same way mail-reader does (E8 F15, E13 F-14),
     * so a hidden line's address reads as it would in a browser bar rather than in a third
     * typeface. Trailing sentence punctuation is left outside the address span. Returns an array
     * of nodes; a string with no address returns a single text node.
     */
    _addressy(text) {
        const s = typeof text === 'string' ? text : '';
        const nodes = [];
        if (!s) return nodes;
        const re = /(https?:\/\/[^\s]+|www\.[^\s]+|[^\s@]+@[^\s@]+\.[^\s@]+)/g;
        let last = 0, m;
        while ((m = re.exec(s)) !== null) {
            let token = m[0];
            const start = m.index;
            const trail = (token.match(/[.,;:!?)\]}>'"]+$/) || [''])[0];
            if (trail) token = token.slice(0, token.length - trail.length);
            if (!token) continue;
            if (start > last) nodes.push(document.createTextNode(s.slice(last, start)));
            nodes.push(h('span', { class: 'ac-address', text: token }));
            if (trail) nodes.push(document.createTextNode(trail));
            last = start + m[0].length;
        }
        if (last === 0) { nodes.push(document.createTextNode(s)); return nodes; }
        if (last < s.length) nodes.push(document.createTextNode(s.slice(last)));
        return nodes;
    }

    /**
     * Mark a beat's section visibly done once it has produced its result (E13 F-7): a running
     * progress signal so the learner can see a beat is finished and that they may close the
     * window. Idempotent; adds the badge once. Default-safe: a beat with no result shows nothing.
     */
    _markDone(sec) {
        if (!sec || sec.classList?.contains?.('ac-done')) return;
        sec.classList.add('ac-done');
        sec.appendChild(h('p', { class: 'ac-done-badge', role: 'status', 'aria-label': 'Done' }, '✓ Done'));
    }

    /** Bring a newly shown result/verdict into view (E13 F-9). No-op where unsupported (jsdom). */
    _scrollIntoView(node) {
        try { node?.scrollIntoView?.({ block: 'nearest' }); } catch (e) { /* headless */ }
    }

    /** An assistant reply bubble, with the "can make mistakes" disclaimer when authored. */
    _reply(text, cls = 'ac-reply') {
        const bubble = h('div', { class: cls }, h('p', { class: 'ac-reply-text', text }));
        if (this._disclaimer) bubble.appendChild(h('p', { class: 'ac-disclaimer', text: this._disclaimer }));
        return bubble;
    }

    // ── beat 1: summarise my emails (injection surfacing) ───────────────────────
    _buildSummarise(cfg) {
        // E13 MA3: key the surfacing on the pretext the learner sent. byChoice[sentTemplateId] wins
        // per field; any field it omits (and the whole block, if the learner's branch is absent)
        // falls back to the flat summarise reply/empathy/hidden, so a single-reply episode is
        // unchanged. A learner who left the brief plain reads their own "nothing to action" summary
        // instead of the injection branch, matching the flip's by-choice defender line.
        const byChoice = isObj(cfg.byChoice) ? cfg.byChoice : null;
        const chosen = byChoice && isStr(this.sentTemplateId) && isObj(byChoice[this.sentTemplateId])
            ? byChoice[this.sentTemplateId] : null;
        const reply = chosen && isStr(chosen.reply) ? chosen.reply : cfg.reply;
        const empathy = chosen && isStr(chosen.empathy) ? chosen.empathy : cfg.empathy;
        const hidden = chosen && isObj(chosen.hidden) ? chosen.hidden : cfg.hidden;

        const sec = h('section', { class: 'ac-section ac-summarise', 'aria-label': 'Summarise my emails' });
        const btn = h('button', { type: 'button', class: 'minigame-button ac-summarise-btn',
            text: isStr(cfg.button) ? cfg.button : 'Summarise my emails' });
        const out = h('div', { class: 'ac-summarise-out', 'aria-live': 'polite' });
        this.addEventListener(btn, 'click', (e) => {
            e.preventDefault?.();
            out.textContent = '';
            // Authored suggestion for the sent pretext (same reply every press).
            if (isStr(reply)) out.appendChild(this._reply(reply, 'ac-reply ac-summary-reply'));
            if (isStr(empathy)) out.appendChild(h('p', { class: 'ac-empathy', text: empathy }));
            const hid = isObj(hidden) ? hidden : null;
            if (hid && isStr(hid.text)) {
                const hbtn = h('button', { type: 'button', class: 'minigame-button ac-hidden-btn',
                    text: isStr(hid.button) ? hid.button : 'Show hidden text', 'aria-expanded': 'false' });
                const htext = h('p', { class: 'ac-hidden-text', hidden: true }, ...this._addressy(hid.text));
                this.addEventListener(hbtn, 'click', (ev) => {
                    ev.preventDefault?.();
                    htext.hidden = false;
                    hbtn.setAttribute('aria-expanded', 'true');
                });
                out.append(hbtn, htext);
            }
            this._markDone(sec);
            this._scrollIntoView(out);
        });
        sec.append(btn, out);
        this.body.appendChild(sec);
    }

    // ── beat 2: what is safe to paste ───────────────────────────────────────────
    _buildPaste(cfg) {
        const sec = h('section', { class: 'ac-section ac-paste', 'aria-label': isStr(cfg.heading) ? cfg.heading : 'Paste into the assistant' });
        if (isStr(cfg.heading)) sec.appendChild(h('h3', { class: 'ac-paste-heading', text: cfg.heading }));
        if (isStr(cfg.task)) sec.appendChild(h('p', { class: 'ac-paste-task', text: cfg.task }));

        const struck = new Set();           // ids of lines the learner has struck out
        const lines = arr(cfg.lines).filter((l) => isObj(l) && isStr(l.id) && isStr(l.text));
        const list = h('ul', { class: 'ac-paste-lines' });
        for (const line of lines) {
            const li = h('li', { class: 'ac-paste-line', 'data-id': line.id });
            li.appendChild(h('span', { class: 'ac-paste-line-text', text: line.text }));
            if (isStr(line.classLabel)) li.appendChild(h('span', { class: 'ac-class-tag', text: line.classLabel }));
            // E13 F-8: every line offers a strike-out toggle, not only the lines that do not belong
            // (a strike button only on the unsafe lines gave the answer away). The learner judges
            // which to take out; the summary is built from whatever is left in, and the verdict
            // still keys off whether a secret / personal line was left in.
            const strike = h('button', { type: 'button', class: 'minigame-button ac-strike-btn',
                text: 'Strike out', 'aria-pressed': 'false' });
            this.addEventListener(strike, 'click', (e) => {
                e.preventDefault?.();
                const on = !struck.has(line.id);
                if (on) struck.add(line.id); else struck.delete(line.id);
                li.classList.toggle('ac-struck', on);
                strike.setAttribute('aria-pressed', on ? 'true' : 'false');
                strike.textContent = on ? 'Put back' : 'Strike out';
            });
            li.appendChild(strike);
            list.appendChild(li);
        }
        sec.appendChild(list);

        const out = h('div', { class: 'ac-paste-out', 'aria-live': 'polite' });
        const sumBtn = h('button', { type: 'button', class: 'minigame-button ac-paste-summarise',
            text: isStr(cfg.summaryButton) ? cfg.summaryButton : 'Summarise' });
        this.addEventListener(sumBtn, 'click', (e) => {
            e.preventDefault?.();
            out.textContent = '';
            const kept = lines.filter((l) => !struck.has(l.id));
            const summary = h('div', { class: 'ac-paste-summary' });
            if (isStr(cfg.summaryHeading)) summary.appendChild(h('p', { class: 'ac-paste-summary-heading', text: cfg.summaryHeading }));
            const ul = h('ul', { class: 'ac-paste-summary-list' });
            // The summary is built from the lines left in: a struck line is omitted.
            for (const l of kept) ul.appendChild(h('li', { class: 'ac-paste-summary-line', 'data-id': l.id, text: l.text }));
            summary.appendChild(ul);
            out.appendChild(summary);
            // E13 MI2: a feedback slot so the beat confirms the lesson. `clean` when every line that
            // does not belong was struck out, `leftPersonal` when a personal detail slipped through,
            // `leftPassword` when a secret did (the strongest). Opt-in on cfg.feedback; absent, the
            // beat is exactly as before.
            const fb = isObj(cfg.feedback) ? cfg.feedback : null;
            if (fb) {
                const secretLeft = lines.some((l) => l.secret === true && !struck.has(l.id));
                const personalLeft = lines.some((l) => l.safe !== true && l.secret !== true && !struck.has(l.id));
                const verdict = secretLeft ? 'leftPassword' : (personalLeft ? 'leftPersonal' : 'clean');
                if (isStr(fb[verdict])) out.appendChild(h('p', { class: 'ac-paste-feedback', 'data-verdict': verdict, text: fb[verdict] }));
            }
            // A line flagged secret left in: warn and offer a one-click report.
            const secretLeftIn = lines.some((l) => l.secret === true && !struck.has(l.id));
            if (secretLeftIn && isStr(cfg.secretWarning)) {
                out.appendChild(h('p', { class: 'ac-paste-warning', text: cfg.secretWarning }));
                if (isStr(cfg.reportButton)) {
                    const rep = h('button', { type: 'button', class: 'minigame-button ac-paste-report',
                        text: cfg.reportButton });
                    const rout = h('p', { class: 'ac-paste-report-reply', hidden: true });
                    if (isStr(cfg.reportReply)) rout.textContent = cfg.reportReply;
                    this.addEventListener(rep, 'click', (ev) => { ev.preventDefault?.(); rout.hidden = false; rep.disabled = true; });
                    out.append(rep, rout);
                }
            }
            this._markDone(sec);
            // Scroll the verdict (or the summary) into view: it sits below the line list and the
            // learner otherwise could not tell anything happened (E13 F-9).
            this._scrollIntoView(out.querySelector('.ac-paste-feedback') || out.querySelector('.ac-paste-warning') || out);
        });
        sec.append(sumBtn, out);
        this.body.appendChild(sec);
    }

    // ── beat 3: checking the answers ────────────────────────────────────────────
    _buildDraft(cfg) {
        const sec = h('section', { class: 'ac-section ac-draft', 'aria-label': isStr(cfg.heading) ? cfg.heading : 'Draft' });
        const btn = h('button', { type: 'button', class: 'minigame-button ac-draft-btn',
            text: isStr(cfg.button) ? cfg.button : 'Ask for a draft' });
        const out = h('div', { class: 'ac-draft-out', 'aria-live': 'polite' });
        const docs = arr(this.config.documents).filter((d) => isObj(d) && isStr(d.id));
        this.addEventListener(btn, 'click', (e) => {
            e.preventDefault?.();
            out.textContent = '';
            const answer = h('div', { class: 'ac-reply ac-draft-answer' });
            if (isStr(cfg.heading)) answer.appendChild(h('p', { class: 'ac-draft-answer-heading', text: cfg.heading }));
            for (const s of arr(cfg.sentences)) {
                if (!isObj(s) || !isStr(s.text)) continue;
                answer.appendChild(h('p', { class: 'ac-draft-sentence' + (s.wrong === true ? ' ac-draft-wrong' : ''),
                    'data-wrong': s.wrong === true ? 'true' : 'false', text: s.text }));
            }
            if (this._disclaimer) answer.appendChild(h('p', { class: 'ac-disclaimer', text: this._disclaimer }));
            out.appendChild(answer);
            // E13 MI2: a verdict slot so the beat lands its point. Opt-in on cfg.feedback; absent, the
            // beat is exactly as before (Check source opens the document, no verdict). `caught` fires
            // when the learner checks the source (the right move); `missed` when they send it without
            // checking, via an optional "send without checking" button.
            const fb = isObj(cfg.feedback) ? cfg.feedback : null;
            const verdict = fb ? h('p', { class: 'ac-draft-verdict', 'aria-live': 'polite' }) : null;
            let sendBtn = null;
            // "Check source" opens the authored document, never a live one.
            const cs = isObj(cfg.checkSource) ? cfg.checkSource : null;
            const doc = cs && isStr(cs.documentId) ? docs.find((d) => d.id === cs.documentId) : null;
            if (doc) {
                const csBtn = h('button', { type: 'button', class: 'minigame-button ac-checksource-btn',
                    text: isStr(cs.button) ? cs.button : 'Check source', 'aria-expanded': 'false' });
                const docPanel = h('div', { class: 'ac-document', hidden: true },
                    isStr(doc.title) ? h('h4', { class: 'ac-document-title', text: doc.title }) : null,
                    h('p', { class: 'ac-document-body', text: isStr(doc.body) ? doc.body : '' }));
                this.addEventListener(csBtn, 'click', (ev) => {
                    ev.preventDefault?.();
                    docPanel.hidden = false;
                    csBtn.setAttribute('aria-expanded', 'true');
                    if (verdict && isStr(fb.caught)) { verdict.textContent = fb.caught; verdict.dataset.verdict = 'caught'; this._scrollIntoView(verdict); }
                    if (sendBtn) sendBtn.disabled = true; // checked, so "send without checking" no longer applies
                });
                out.append(csBtn, docPanel);
            }
            if (fb && isStr(fb.missed)) {
                sendBtn = h('button', { type: 'button', class: 'minigame-button ac-draft-send',
                    text: isStr(cfg.sendButton) ? cfg.sendButton : 'Send without checking' });
                this.addEventListener(sendBtn, 'click', (ev) => {
                    ev.preventDefault?.();
                    verdict.textContent = fb.missed;
                    verdict.dataset.verdict = 'missed';
                    sendBtn.disabled = true;
                    this._scrollIntoView(verdict);
                });
                out.appendChild(sendBtn);
            }
            if (verdict) out.appendChild(verdict);
            this._markDone(sec);
            this._scrollIntoView(out);
        });
        sec.append(btn, out);
        this.body.appendChild(sec);
    }

    // ── generic authored exchanges ──────────────────────────────────────────────
    _buildExchanges(exchanges) {
        const list = exchanges.filter((x) => isObj(x) && isStr(x.id) && isStr(x.prompt) && isStr(x.reply));
        if (!list.length) return;
        const sec = h('section', { class: 'ac-section ac-exchanges', 'aria-label': 'Ask the assistant' });
        const out = h('div', { class: 'ac-exchange-out', 'aria-live': 'polite' });
        const row = h('div', { class: 'ac-exchange-buttons' });
        for (const x of list) {
            const btn = h('button', { type: 'button', class: 'minigame-button ac-exchange-btn', 'data-id': x.id, text: x.prompt });
            this.addEventListener(btn, 'click', (e) => {
                e.preventDefault?.();
                // The same authored reply every press: deterministic, no model, no network.
                out.textContent = '';
                out.appendChild(h('p', { class: 'ac-exchange-prompt', text: x.prompt }));
                out.appendChild(this._reply(x.reply));
            });
            row.appendChild(btn);
        }
        sec.append(row, out);
        this.body.appendChild(sec);
    }

    /** The section's own heading, else its aria-label, else a fallback, as the recap situation. */
    _sectionSituation(sec, fallback) {
        if (!sec) return fallback;
        const head = sec.querySelector('.ac-paste-heading, .ac-draft-answer-heading');
        if (head && isStr(head.textContent)) return head.textContent;
        const label = sec.getAttribute('aria-label');
        return isStr(label) ? label : fallback;
    }

    /**
     * batch 11 (E13 B2 finding 11): hand the runner a recap of the wrong outcomes in this window,
     * built from its final state, so the debrief can look back at the assistant stage. A wrong
     * outcome is a personal detail or a password left in when summarising, or the invented figures
     * sent without checking the source. The reason reuses the beat's own feedback text; `recap` is
     * omitted entirely when nothing went wrong (so a clean run adds no debrief section).
     */
    closeResult() {
        const recap = [];
        const pasteFb = this.body?.querySelector?.('.ac-paste-feedback[data-verdict="leftPassword"], .ac-paste-feedback[data-verdict="leftPersonal"]');
        if (pasteFb) {
            recap.push({ situation: this._sectionSituation(pasteFb.closest('.ac-paste'), 'Pasting into the assistant'),
                reason: pasteFb.textContent || '' });
        }
        const draftFb = this.body?.querySelector?.('.ac-draft-verdict[data-verdict="missed"]');
        if (draftFb) {
            recap.push({ situation: this._sectionSituation(draftFb.closest('.ac-draft'), 'Checking the assistant’s figures'),
                reason: draftFb.textContent || '' });
        }
        return { episodeId: this.params.episodeId ?? null, ...(recap.length ? { recap } : {}) };
    }

    getTestState() {
        return {
            ...super.getTestState(),
            assistant: {
                title: this._title,
                sections: [...this.body.querySelectorAll('.ac-section')].map((s) => s.className.replace('ac-section ', ''))
            }
        };
    }
}
