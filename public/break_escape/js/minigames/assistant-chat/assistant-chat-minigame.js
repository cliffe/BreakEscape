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
//              the white line and a no-blame empathy line (E13 §9.2 beat 1).
//   paste      the paste-hygiene panel: a source log of lines, each with an information-class
//              tag; the learner strikes lines out, then asks for a themes summary that lists
//              only the lines left in. A secret line left in draws a warning and a one-click
//              report (E13 §9.2 beat 2).
//   draft      the output-check panel: an authored draft whose sentences the learner reads, a
//              "Check source" action that opens an authored document, and the "can make
//              mistakes, check important information" disclaimer under the answer (beat 3).
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

        // Fixed section order; only the authored sections appear.
        if (isObj(this.config.summarise)) this._buildSummarise(this.config.summarise);
        if (isObj(this.config.paste)) this._buildPaste(this.config.paste);
        if (isObj(this.config.draft)) this._buildDraft(this.config.draft);
        this._buildExchanges(arr(this.config.exchanges));
    }

    /** An assistant reply bubble, with the "can make mistakes" disclaimer when authored. */
    _reply(text, cls = 'ac-reply') {
        const bubble = h('div', { class: cls }, h('p', { class: 'ac-reply-text', text }));
        if (this._disclaimer) bubble.appendChild(h('p', { class: 'ac-disclaimer', text: this._disclaimer }));
        return bubble;
    }

    // ── beat 1: summarise my emails (injection surfacing) ───────────────────────
    _buildSummarise(cfg) {
        const sec = h('section', { class: 'ac-section ac-summarise', 'aria-label': 'Summarise my emails' });
        const btn = h('button', { type: 'button', class: 'minigame-button ac-summarise-btn',
            text: isStr(cfg.button) ? cfg.button : 'Summarise my emails' });
        const out = h('div', { class: 'ac-summarise-out', 'aria-live': 'polite' });
        this.addEventListener(btn, 'click', (e) => {
            e.preventDefault?.();
            out.textContent = '';
            // Authored suggestion that carries the planted line (same reply every press).
            if (isStr(cfg.reply)) out.appendChild(this._reply(cfg.reply, 'ac-reply ac-summary-reply'));
            if (isStr(cfg.empathy)) out.appendChild(h('p', { class: 'ac-empathy', text: cfg.empathy }));
            const hid = isObj(cfg.hidden) ? cfg.hidden : null;
            if (hid && isStr(hid.text)) {
                const hbtn = h('button', { type: 'button', class: 'minigame-button ac-hidden-btn',
                    text: isStr(hid.button) ? hid.button : 'Show hidden text', 'aria-expanded': 'false' });
                const htext = h('p', { class: 'ac-hidden-text', text: hid.text, hidden: true });
                this.addEventListener(hbtn, 'click', (ev) => {
                    ev.preventDefault?.();
                    htext.hidden = false;
                    hbtn.setAttribute('aria-expanded', 'true');
                });
                out.append(hbtn, htext);
            }
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
            // Only lines that do not belong offer a strike-out toggle.
            if (line.safe !== true) {
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
            }
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
                });
                out.append(csBtn, docPanel);
            }
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

    closeResult() {
        return { episodeId: this.params.episodeId ?? null };
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
