// The OSINT browser (SE design 02; implementation plan Phase 2, packet P2-A).
//
// An in-world browser the player uses to research a target company. Nothing in it is typed:
// the player reads, follows a link, picks a block to note, opens a document's properties, or
// picks a lookup from a short authored list. Every paragraph, staff row, post, result and
// metadata field is a button. Selecting one collects the fact it carries (grantFact, the one
// award path, flip-only) or says there is nothing to use.
//
// Data: params.osint (default window.gameScenario.social.osint). Facts, people and concept
// cards come from `params.social` (default window.gameScenario.social); `social` exists so a
// test can hand in a fixture.
//
// Params the scene reads:
//   siteIds   limit to these site ids (a workstation's minigameData)
//   start     location to open at: 'company', 'company.team', 'social.pierce', '~tools'
//             (default: the saved place, else the first site)
//   social, osint   fixtures
//   returnTo  set by the framework when this was opened as a child
//
// Close and Esc are a normal exit (complete(true)), so a close never logs minigame_failed.
// Scenarios drive tasks off the se_intel_* globals, never off this scene's event.
//
// Every authored string is set with textContent and never goes through displayDashes. Text is the
// pixel font (--se-font-readable); domains, addresses and handles are Source Sans 3 (--se-font-address).

import { SocialOverlayScene } from '../framework/social-overlay.js';
import { writeGlobal } from '../../systems/global-writer.js';
import { grantFact, readyToastText, readyToastTitle } from '../../systems/social-intel.js';
import { formatAddress } from './address-bar.js';
import { createConceptCard } from './concept-card.js';
import {
    STATE_KEY, TOOLS_KEY, toolsAllowed, showIfHolds, isHeld, readOsintState, listSites,
    visiblePages, locate, keyOf, visitKeys, resolveLink, listTools
} from './osint-model.js';

const ICON = '/break_escape/assets/icons/';
// Block `src` and concept-card `image` are relative to assets/ (e.g. "social/osint/foo.png"); site `logo` to assets/logos/.
const ASSETS = '/break_escape/assets/';
const LOGOS = '/break_escape/assets/logos/';
const CHARACTERS = '/break_escape/assets/characters/';
const NOTHING = 'Nothing here you can use.';
const HINT_ID = 'ob-hint-add';

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

// An email address or web address inside a sentence is set in the address font, like every other
// address in the game; the words around it keep the readable face (E8 F15).
const ADDRESS_RE = /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|https?:\/\/[^\s,;)]+)/g;
export function addressify(text) {
    return String(text ?? '').split(ADDRESS_RE).map((part, i) => (i % 2 ? h('span', { class: 'ob-address', text: part }) : part)).filter((x) => x !== '');
}

const icon = (name) => h('img', { class: 'ob-icon', src: `${ICON}${name}.png`, alt: '', 'aria-hidden': 'true',
    width: 16, height: 16 });

const fileName = (url) => {
    const s = String(url || '');
    const i = s.lastIndexOf('/');
    return i === -1 ? s : s.slice(i + 1);
};

export class OsintBrowserMinigame extends SocialOverlayScene {
    constructor(container, params) {
        super(container, params);
        this.place = null;              // { view, site, pageId }
        this._sites = [];
        this._feedback = new Map();     // block id -> { outcome, text } (this session)
        this._collected = [];           // fact ids granted by this browser instance
        this._openCards = new Set();
        this._propsOpen = false;
        this._dropProps = null;
        this._toolId = null;
        this._flash = null;
        this._last = null;
        this._liveText = '';
        this._visitedNow = [];
    }

    // ── data ──────────────────────────────────────────────────────────────
    get social() {
        return this.params.social || (typeof window !== 'undefined' ? window.gameScenario?.social : null) || {};
    }

    get osint() {
        return this.params.osint || this.social.osint || {};
    }

    get globals() {
        return (typeof window !== 'undefined' ? window.gameState?.globalVariables : null) || {};
    }

    get profile() {
        return this.osint.profile || null;
    }

    get toolsOn() {
        return toolsAllowed(this.profile) && Array.isArray(this.osint.tools) && this.osint.tools.length > 0;
    }

    _fact(id) {
        return this.social.intelFacts?.[id] || null;
    }

    _card(id) {
        return (this.social.conceptCards || []).find((c) => c?.id === id) || null;
    }

    _person(id) {
        return (this.social.people || []).find((p) => p?.id === id) || null;
    }

    // ── lifecycle ─────────────────────────────────────────────────────────
    init() {
        super.init();
        this.gameContainer.classList.add('osint-browser-game-container');
        this.container.classList.add('osint-browser-container');
        this._sites = listSites(this.osint, { siteIds: this.params.siteIds, profile: this.profile });
        this._buildShell();
        const state = readOsintState(this.globals);
        let place = null;
        // start '@home' opens the first site, ignoring the last page visited (the episode's
        // "Back to research", E1-E4 P4-10).
        const start = this.params.start === '@home' ? this._sites[0]?.id : this.params.start;
        for (const key of [start, this.params.start === '@home' ? null : state.at, this._sites[0]?.id]) {
            if (!key) continue;
            if (key === TOOLS_KEY && !this.toolsOn) continue;
            place = locate(this._sites, key, this.globals);
            if (place) break;
        }
        if (!place && this.toolsOn) place = locate(this._sites, TOOLS_KEY, this.globals);
        this.place = place;
        this._visit(place);
        this._renderStrip();
        this._renderMain();
    }

    start() {
        super.start();
        this.root?.focus?.();
    }

    // ── shell ─────────────────────────────────────────────────────────────
    _buildShell() {
        const social = this.social;
        const title = h('h2', { class: 'ob-title', text: this.osint.title || 'Browser' });
        const buttons = h('div', { class: 'ob-head-buttons' });
        if (social.intelBoard) {
            const caseLabel = social.intelBoard.labels?.caseButton || 'Case file';
            const caseBtn = h('button', { type: 'button', class: 'ob-case minigame-button', text: caseLabel,
                'aria-label': caseLabel });
            this.addEventListener(caseBtn, 'click', (e) => {
                e.preventDefault?.();
                this.openCaseFile();
            });
            buttons.appendChild(caseBtn);
            this.caseButton = caseBtn;
        }
        const close = h('button', { type: 'button', class: 'se-overlay-close minigame-button ob-close',
            text: 'Close', 'aria-label': 'Close' });
        this.addEventListener(close, 'click', (e) => {
            e.preventDefault?.();
            e.stopPropagation?.();
            this.requestClose();
        });
        this.closeButton = close;
        buttons.appendChild(close);

        this.addressText = h('span', { class: 'ob-address-text ob-readable', 'data-address': '' });
        const address = h('div', { class: 'ob-address', role: 'group', 'aria-label': 'Address (display only)' },
            h('span', { class: 'ob-address-label', text: 'Address' }), this.addressText);

        this.strip = h('nav', { class: 'ob-strip', 'aria-label': 'Sites' });
        this.main = h('main', { class: 'ob-main', tabindex: '-1' });
        this.live = h('div', { class: 'ob-live', role: 'status', 'aria-live': 'polite' });
        const hint = h('span', { id: HINT_ID, class: 'ob-sr', text: 'Add to notes' });

        this.root = h('div', { class: 'ob-root', tabindex: '-1' },
            h('header', { class: 'ob-head' }, title, buttons), address, this.strip, this.main, this.live, hint);
        this.gameContainer.appendChild(this.root);
    }

    _renderStrip() {
        this.strip.textContent = '';
        const here = this.place?.site?.id || null;
        for (const site of this._sites) {
            const btn = h('button', { type: 'button', class: `ob-site${here === site.id && this.place.view !== 'tools' ? ' is-current' : ''}`,
                'data-site': site.id, 'aria-current': here === site.id && this.place.view !== 'tools' ? 'page' : false },
                h('span', { class: 'ob-site-name', text: site.name || site.title || site.id }),
                h('span', { class: 'ob-site-url ob-readable', text: site.url || '' }));
            this.addEventListener(btn, 'click', (e) => { e.preventDefault?.(); this.go(site.id); });
            this.strip.appendChild(btn);
        }
        if (this.toolsOn) {
            const on = this.place?.view === 'tools';
            const btn = h('button', { type: 'button', class: `ob-site ob-tools-button${on ? ' is-current' : ''}`,
                'data-site': 'tools', 'aria-current': on ? 'page' : false },
                h('span', { class: 'ob-site-name', text: 'Tools' }),
                h('span', { class: 'ob-site-url ob-site-sub', text: 'Lookups' }));
            this.addEventListener(btn, 'click', (e) => { e.preventDefault?.(); this.go(TOOLS_KEY); });
            this.strip.appendChild(btn);
        }
        this._arrowNav(this.strip, '.ob-site');
    }

    /** Arrow keys move focus along a row or list of buttons; Tab still reaches every one. */
    _arrowNav(root, selector) {
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
        });
    }

    // ── navigation ────────────────────────────────────────────────────────
    /** Move to a location string. Returns false if it names nothing shown. */
    go(key, { focus = true } = {}) {
        const place = locate(this._sites, key, this.globals);
        if (key === TOOLS_KEY ? !this.toolsOn : !place) return false;
        this._dropProperties();
        // The status line belongs to the page where the note was made (R19 F19-2).
        if (this._hereKey() !== (key === TOOLS_KEY ? TOOLS_KEY : keyOf(place))) {
            this._liveText = '';
            if (this.live) this.live.textContent = '';
        }
        this.place = place;
        this._visit(place);
        this._renderStrip();
        this._renderMain();
        if (focus) this.main.focus?.();
        return true;
    }

    _visit(place) {
        if (!place) return;
        const keys = visitKeys(place);
        const state = readOsintState(this.globals);
        const at = place.view === 'tools' ? state.at : keyOf(place);
        const merged = [...new Set([...state.visited, ...keys])];
        if (merged.length === state.visited.length && at === state.at) return;
        this._visitedNow = merged;
        const raw = this.globals[STATE_KEY];
        const next = { ...(raw && typeof raw === 'object' ? raw : {}), visited: merged };
        if (at) next.at = at;
        writeGlobal(STATE_KEY, next, { openChat: false });
        window.stateSync?.sync?.();
    }

    get address() {
        if (this.place?.view === 'tools') return '';
        const site = this.place?.site;
        if (!site) return '';
        const page = this.place.view === 'page' ? (site.pages || []).find((p) => p.id === this.place.pageId) : null;
        return formatAddress(site, page);
    }

    // ── drawing ───────────────────────────────────────────────────────────
    _renderMain() {
        const keepFocus = this._focusKey();
        this.addressText.textContent = this.address;
        this.main.textContent = '';
        this.main.setAttribute('aria-label', this._mainLabel());
        const p = this.place;
        if (!p) {
            this.main.appendChild(h('p', { class: 'ob-empty', text: 'There is nothing to browse here.' }));
        } else if (p.view === 'tools') {
            this.main.appendChild(this._toolsView());
        } else if (p.view === 'document') {
            this.main.appendChild(this._documentView(p.site));
        } else if (p.view === 'social') {
            this.main.appendChild(this._socialView(p.site, p.pageId));
        } else {
            this.main.appendChild(this._pageView(p.site, p.pageId));
        }
        this._flash = null;
        this._restoreFocus(keepFocus);
    }

    _mainLabel() {
        const p = this.place;
        if (!p) return 'Browser';
        if (p.view === 'tools') return 'Tools';
        return p.site?.name || p.site?.title || p.site?.id || 'Page';
    }

    _focusKey() {
        const a = document.activeElement;
        if (!a || !this.main?.contains?.(a)) return null;
        return a.getAttribute('data-focus') || null;
    }

    _restoreFocus(key) {
        if (!key) return;
        const el = this.main.querySelector(`[data-focus="${key.replace(/"/g, '\\"')}"]`);
        el?.focus?.();
    }

    _siteHeader(site) {
        const head = h('div', { class: 'ob-site-head' });
        if (site.logo) {
            head.appendChild(h('img', { class: 'ob-logo', src: LOGOS + String(site.logo).replace(/^\/+/, ''),
                alt: site.logoAlt || '', 'aria-hidden': site.logoAlt ? false : 'true' }));
        }
        // A logo with alt text is the site's wordmark, so it stands in for the title.
        if (!(site.logo && site.logoAlt)) {
            head.appendChild(h('p', { class: 'ob-site-title', text: site.name || site.title || site.id }));
        }
        return head;
    }

    _link(text, key, extra = {}) {
        const a = h('a', { href: '#', class: `ob-link${extra.class ? ' ' + extra.class : ''}`, 'data-focus': `link:${key}`, text });
        if (extra.current) a.setAttribute('aria-current', 'page');
        this.addEventListener(a, 'click', (e) => {
            e.preventDefault?.();
            this.go(key);
        });
        return a;
    }

    _pageView(site, pageId) {
        const wrap = h('article', { class: 'ob-page', 'data-site': site.id });
        wrap.appendChild(this._siteHeader(site));
        const pages = visiblePages(site, this.globals);
        const nav = pages.filter((p) => p.id !== 'archive');
        if (nav.length > 1) {
            const ul = h('ul', { class: 'ob-pagenav', 'aria-label': 'Pages' });
            for (const pg of nav) {
                ul.appendChild(h('li', {}, this._link(pg.title || pg.id, `${site.id}.${pg.id}`, { current: pg.id === pageId })));
            }
            wrap.appendChild(ul);
        }
        const page = pages.find((p) => p.id === pageId);
        if (!page) {
            wrap.appendChild(h('p', { class: 'ob-empty', text: 'This site has no pages yet.' }));
            return wrap;
        }
        wrap.appendChild(h('h3', { class: 'ob-page-title', tabindex: '-1', text: page.title || page.id }));
        const body = h('div', { class: 'ob-blocks' });
        for (const b of page.blocks || []) this._addBlock(body, b, site);
        wrap.appendChild(body);
        if (pages.some((p) => p.id === 'archive') && pageId !== 'archive') {
            wrap.appendChild(h('footer', { class: 'ob-footer' }, this._link('Archive', `${site.id}.archive`)));
        }
        return wrap;
    }

    _socialView(site, personId) {
        const wrap = h('article', { class: 'ob-page ob-social', 'data-site': site.id });
        wrap.appendChild(this._siteHeader(site));
        const pages = visiblePages(site, this.globals);
        if (!personId) {
            wrap.appendChild(h('h3', { class: 'ob-page-title', tabindex: '-1', text: 'People' }));
            const ul = h('ul', { class: 'ob-profiles', 'aria-label': 'Profiles' });
            for (const pg of pages) ul.appendChild(h('li', { class: 'ob-profile-item' }, this._profileLink(pg.profile)));
            if (!pages.length) ul.appendChild(h('li', { class: 'ob-empty', text: 'No profiles to show yet.' }));
            wrap.appendChild(ul);
            return wrap;
        }
        const profile = pages.find((p) => p.id === personId)?.profile;
        wrap.appendChild(h('p', { class: 'ob-back' }, this._link('All profiles', site.id)));
        wrap.appendChild(this._profileHeader(profile));
        const body = h('div', { class: 'ob-blocks' });
        for (const post of profile.posts || []) this._addBlock(body, { kind: 'post', ...post }, site);
        for (const b of profile.blocks || []) this._addBlock(body, b, site);
        wrap.appendChild(body);
        return wrap;
    }

    _profileName(profile) {
        const person = this._person(profile.person);
        return profile.name || person?.forms?.full || person?.name || profile.person;
    }

    _headshot(profile) {
        const person = this._person(profile.person);
        const raw = profile.avatar || person?.avatar;
        // No avatar: fall back to the default person icon, as 00 says the board's people
        // card and the mail reader do (never nothing). A named avatar that fails to load
        // is swapped for the same default.
        if (!raw) return this._defaultHeadshot();
        const key = String(raw).replace(/\.png$/, '');
        const img = h('img', { class: 'ob-headshot', src: `${CHARACTERS}${key}.png`, alt: '', 'aria-hidden': 'true',
            width: 32, height: 32 });
        img.addEventListener('error', () => { img.replaceWith(this._defaultHeadshot()); });
        return img;
    }

    /** A post's poster (`author`, a social.people id): headshot and name, or nothing. */
    _postAuthor(block) {
        if (!block.author) return null;
        return h('span', { class: 'ob-line ob-post-author' }, this._headshot({ person: block.author }),
            h('span', { class: 'ob-profile-name', text: this._profileName({ person: block.author }) }));
    }

    _defaultHeadshot() {
        return h('img', { class: 'ob-headshot ob-headshot-default', src: `${ICON}mail-account.png`, alt: '',
            'aria-hidden': 'true', width: 32, height: 32 });
    }

    _profileLink(profile) {
        const a = h('a', { href: '#', class: 'ob-profile-link', 'data-focus': `profile:${profile.person}` },
            this._headshot(profile),
            h('span', { class: 'ob-profile-name', text: this._profileName(profile) }),
            profile.handle ? h('span', { class: 'ob-handle ob-readable', text: profile.handle }) : null);
        this.addEventListener(a, 'click', (e) => {
            e.preventDefault?.();
            this.go(`${this.place.site.id}.${profile.person}`);
        });
        return a;
    }

    _profileHeader(profile) {
        return h('header', { class: 'ob-profile-head' },
            this._headshot(profile),
            h('div', { class: 'ob-profile-who' },
                h('h3', { class: 'ob-page-title', tabindex: '-1', text: this._profileName(profile) }),
                profile.handle ? h('span', { class: 'ob-handle ob-readable', text: profile.handle }) : null,
                profile.bio ? h('p', { class: 'ob-bio ob-readable', text: profile.bio }) : null));
    }

    _documentView(site) {
        const wrap = h('article', { class: 'ob-page ob-document', 'data-site': site.id });
        wrap.appendChild(h('h3', { class: 'ob-page-title ob-readable', tabindex: '-1', text: fileName(site.url) || site.id }));
        const body = h('div', { class: 'ob-blocks' });
        for (const b of site.blocks || []) this._addBlock(body, b, site);
        wrap.appendChild(body);
        if (!this._propsOpen) {
            const open = h('button', { type: 'button', class: 'ob-props-open minigame-button', 'data-focus': 'props-open',
                text: 'Document properties', 'aria-haspopup': 'dialog' });
            this.addEventListener(open, 'click', (e) => { e.preventDefault?.(); this.openProperties(); });
            wrap.appendChild(open);
        } else {
            wrap.appendChild(this._propertiesPanel(site));
        }
        return wrap;
    }

    _propertiesPanel(site) {
        const panel = h('section', { class: 'ob-props', role: 'dialog', 'aria-label': 'Document properties', tabindex: '-1',
            'data-focus': 'props-panel' });
        panel.appendChild(h('h4', { class: 'ob-props-title', text: 'Document properties' }));
        if (site.card) panel.appendChild(this._cardEl(site.card));
        const list = h('ul', { class: 'ob-fields', 'aria-label': 'Properties' });
        for (const f of site.fields || []) {
            list.appendChild(h('li', { class: 'ob-field-item' }, this._selectable({ ...f, kind: 'field' }, site)));
        }
        panel.appendChild(list);
        const done = h('button', { type: 'button', class: 'ob-props-close minigame-button', text: 'Close properties',
            'data-focus': 'props-close' });
        this.addEventListener(done, 'click', (e) => { e.preventDefault?.(); this.closeProperties(); });
        panel.appendChild(done);
        this._arrowNav(list, '.ob-block');
        return panel;
    }

    openProperties() {
        if (this._propsOpen || this.place?.view !== 'document') return;
        this._propsOpen = true;
        this._dropProps = this.pushLayer(() => this.closeProperties(), 'document-properties');
        this._renderMain();
        this.main.querySelector('.ob-props')?.focus?.();
    }

    closeProperties() {
        if (!this._propsOpen) return;
        this._dropProperties();
        this._renderMain();
        this.main.querySelector('[data-focus="props-open"]')?.focus?.();
    }

    _dropProperties() {
        this._propsOpen = false;
        if (this._dropProps) { this._dropProps(); this._dropProps = null; }
    }

    // ── tools panel ───────────────────────────────────────────────────────
    _toolsView() {
        const state = readOsintState(this.globals);
        const { available, locked } = listTools(this.osint, state.visited, this.globals);
        this._toolState = { available: available.map((t) => t.id), locked: locked.map((t) => t.id) };
        const wrap = h('section', { class: 'ob-page ob-tools', 'aria-label': 'Tools' });
        wrap.appendChild(h('h3', { class: 'ob-page-title', tabindex: '-1', text: 'Tools' }));
        wrap.appendChild(h('p', { class: 'ob-tools-note',
            text: 'These show what a lookup would return. Nothing here is typed or sent anywhere.' }));
        if (!available.length) {
            wrap.appendChild(h('p', { class: 'ob-empty', text: 'Nothing to look up yet. Read some pages first.' }));
            return wrap;
        }
        if (!available.some((t) => t.id === this._toolId)) this._toolId = null;
        const list = h('ul', { class: 'ob-tool-list', 'aria-label': 'Lookups' });
        for (const tool of available) {
            const picked = tool.id === this._toolId;
            const btn = h('button', { type: 'button', class: `ob-tool${picked ? ' is-picked' : ''}`, 'data-focus': `tool:${tool.id}`,
                'data-tool': tool.id, 'aria-pressed': String(picked) },
                h('span', { class: 'ob-tool-label ob-readable', text: tool.label || tool.id }));
            this.addEventListener(btn, 'click', (e) => {
                e.preventDefault?.();
                this._toolId = this._toolId === tool.id ? null : tool.id;
                this._renderMain();
            });
            list.appendChild(h('li', { class: 'ob-tool-item' }, btn, tool.card ? this._cardEl(tool.card) : null));
        }
        wrap.appendChild(list);
        this._arrowNav(list, '.ob-tool');
        const tool = available.find((t) => t.id === this._toolId);
        if (tool) {
            const results = h('section', { class: 'ob-results', 'aria-label': `Results: ${tool.label || tool.id}` },
                h('h4', { class: 'ob-results-title ob-readable', text: tool.label || tool.id }));
            const items = Array.isArray(tool.results) ? tool.results : [];
            if (!items.length) {
                results.appendChild(h('p', { class: 'ob-empty', text: tool.emptyText || 'No public results.' }));
            } else {
                const ul = h('ul', { class: 'ob-result-list' });
                for (const r of items) ul.appendChild(h('li', {}, this._selectable({ ...r, kind: 'result' }, null)));
                results.appendChild(ul);
                this._arrowNav(ul, '.ob-block');
            }
            wrap.appendChild(results);
        }
        return wrap;
    }

    _cardEl(cardId) {
        const card = this._card(cardId);
        if (!card) return null;
        const c = createConceptCard(card, {
            open: this._openCards.has(card.id),
            onToggle: (id, open) => { if (open) this._openCards.add(id); else this._openCards.delete(id); },
            imageBase: ASSETS
        });
        c.button.setAttribute('data-focus', `card:${card.id}`);
        return c.el;
    }

    // ── blocks ────────────────────────────────────────────────────────────
    _addBlock(parent, block, site) {
        if (!block || !showIfHolds(block.showIf, this.globals)) return;
        const kind = block.kind || 'p';
        if (kind === 'h' || kind === 'heading') {
            parent.appendChild(h('h4', { class: 'ob-heading', text: block.text || '' }));
        } else if (kind === 'link') {
            const to = resolveLink(this._sites, site?.id, block.to, this.globals);
            parent.appendChild(to ? h('p', { class: 'ob-linkline' }, this._link(block.text || block.to, to))
                : h('p', { class: 'ob-linkline ob-dead', text: block.text || '' }));
        } else if (kind === 'image') {
            parent.appendChild(h('img', { class: 'ob-image', src: ASSETS + String(block.src || '').replace(/^\/+/, ''),
                alt: block.alt || '', 'aria-hidden': block.alt ? false : 'true' }));
        } else if (kind === 'list') {
            const ul = h('ul', { class: 'ob-list' });
            for (const item of block.items || []) {
                if (typeof item === 'string') ul.appendChild(h('li', { class: 'ob-list-item', text: item }));
                else ul.appendChild(h('li', { class: 'ob-list-item' }, this._selectable({ ...item, kind: 'item' }, site)));
            }
            parent.appendChild(ul);
        } else if (block.id) {
            parent.appendChild(this._selectable(block, site));
        } else if (kind === 'post' && block.author) {
            parent.appendChild(h('div', { class: 'ob-item ob-post' }, this._postAuthor(block),
                h('p', { class: 'ob-text', text: block.text || '' })));
        } else {
            parent.appendChild(h('p', { class: 'ob-text', text: block.text || '' }));
        }
    }

    /** The lines a selectable block shows: spans, with domains and handles in the readable face. */
    _lines(block) {
        const k = block.kind;
        if (k === 'staff') {
            return [h('span', { class: 'ob-line ob-staff-name', text: block.name || '' }),
                block.role ? h('span', { class: 'ob-line ob-staff-role', text: block.role }) : null,
                block.address ? h('span', { class: 'ob-line ob-staff-address ob-readable', text: block.address }) : null];
        }
        if (k === 'field') {
            const hasLabel = typeof block.label === 'string' && block.label.length > 0;
            const hasValue = block.value !== undefined && block.value !== null && String(block.value).length > 0;
            // A field authored with only `text` (no label/value) would otherwise render as an
            // empty dashed box, hiding the noteable fact behind a blank control (E5-1). Show its
            // text so there is something to read and click.
            if (!hasLabel && !hasValue && typeof block.text === 'string' && block.text.length > 0) {
                return [h('span', { class: 'ob-line ob-field-value ob-readable', text: block.text })];
            }
            return [h('span', { class: 'ob-line ob-field-label', text: block.label || '' }),
                h('span', { class: 'ob-line ob-field-value ob-readable', text: block.value ?? '' })];
        }
        if (k === 'post') {
            return [...(block.author ? [this._postAuthor(block)] : []),
                h('span', { class: 'ob-line ob-post-text ob-readable', text: block.text || '' }),
                block.date ? h('span', { class: 'ob-line ob-post-date', text: block.date }) : null];
        }
        return [h('span', { class: 'ob-line ob-block-text ob-readable', text: block.text || '' })];
    }

    _selectable(block, site) {
        const id = block.id;
        const fact = block.fact || null;
        const held = fact ? isHeld(this.globals, fact) : false;
        const fb = this._feedback.get(id);
        const item = h('div', { class: `ob-item ob-${block.kind || 'p'}${this._flash === id ? ' just-noted' : ''}`, 'data-id': id });
        // A visible "pin" affordance (opt-in: osint.pinHints) so it is clear a block can be
        // selected to add it to notes; the 1px screen-reader hint alone left keyboard and sighted
        // users with no cue (E14-M1). The block button is already the control, so the label on it
        // is reachable. Default off keeps every other deployment unchanged.
        const pin = this.osint.pinHints === true && !held
            ? h('span', { class: 'ob-pin' }, icon('pin'),
                h('span', { class: 'ob-pin-word', text: this.osint.pinLabel || 'Pin' }))
            : null;
        const btn = h('button', { type: 'button', class: `ob-block${held ? ' is-noted' : ''}`, 'data-id': id,
            'data-kind': block.kind || 'p', 'data-fact': fact, 'data-focus': `block:${id}`, 'aria-describedby': HINT_ID },
            ...this._lines(block),
            held ? h('span', { class: 'ob-badge' }, icon('mark-tick'), h('span', { class: 'ob-badge-word', text: 'Noted' })) : pin);
        this.addEventListener(btn, 'click', (e) => {
            e.preventDefault?.();
            this.selectBlock(block);
        });
        item.appendChild(btn);
        if (fb) {
            const mark = fb.outcome === 'nothing' ? 'mark-question' : 'mark-tick';
            item.appendChild(h('div', { class: `ob-feedback is-${fb.outcome}`, 'data-for': id },
                icon(mark), h('span', { class: 'ob-feedback-text' }, addressify(fb.text))));
        }
        return item;
    }

    /**
     * Select a block (a click, or the test bridge). Collects its fact through grantFact, which
     * is flip-only, or says why nothing happened.
     */
    selectBlock(block) {
        if (!block?.id) return null;
        let outcome;
        let text;
        const fact = block.fact || null;
        const note = typeof block.note === 'string' && block.note ? block.note : null;
        if (fact) {
            const info = this._fact(fact);
            const factText = info?.text || block.text || fact;
            const res = grantFact(fact, { scenario: this.params.social ? { social: this.params.social } : null, source: 'osint' });
            if (res.granted) {
                outcome = 'noted';
                text = `Noted: ${factText}`;
                this._collected.push(fact);
                this._flash = block.id;
                // The grant_fact action toasts this; the browser calls grantFact
                // itself, so the same line has to fire here (P2-T F4).
                const newlyReady = res.readiness?.newlyReady || [];
                if (newlyReady.length) {
                    window.gameAlert?.(readyToastText(newlyReady, this.params.social ? { social: this.params.social } : null),
                        'success', readyToastTitle(this.params.social ? { social: this.params.social } : null), 6000);
                }
            } else if (isHeld(this.globals, fact)) {
                outcome = 'already';
                text = `Already noted: ${factText}`;
            } else {
                outcome = 'nothing';
                text = NOTHING;
            }
            if (note && outcome !== 'nothing') text = `${text} ${note}`;
        } else if (note) {
            outcome = 'info';
            text = note;
        } else {
            outcome = 'nothing';
            text = NOTHING;
        }
        this._feedback.set(block.id, { outcome, text });
        this._last = { blockId: block.id, fact, outcome };
        this._liveText = text;
        this.live.textContent = text;
        this._renderMain();
        return this._last;
    }

    // ── case file and exit ────────────────────────────────────────────────
    /** Open the intel board on top; its close reopens this browser at the same place. */
    openCaseFile() {
        const params = { mode: 'recon' };
        if (this.params.social) params.social = this.params.social;
        return this.launchChild('intel-board', params);
    }

    _hereKey() {
        if (this.place?.view === 'tools') return TOOLS_KEY;
        return keyOf(this.place);
    }

    saveDraft() {
        // Visits and facts are written as they happen; remember the place for a reopen.
        const state = readOsintState(this.globals);
        const here = this.place?.view === 'tools' ? state.at : keyOf(this.place);
        if (here && here !== state.at) {
            const raw = this.globals[STATE_KEY];
            writeGlobal(STATE_KEY, { ...(raw && typeof raw === 'object' ? raw : {}), visited: state.visited, at: here }, { openChat: false });
            window.stateSync?.sync?.();
        }
    }

    returnParams() {
        const start = this._hereKey();
        return start ? { start } : {};
    }

    closeResult() {
        return { collected: [...this._collected], visited: readOsintState(this.globals).visited };
    }

    // ── test bridge ───────────────────────────────────────────────────────
    getTestState() {
        const state = readOsintState(this.globals);
        const place = this.place;
        const main = this.main;
        const blocks = main ? [...main.querySelectorAll('.ob-block')].map((el) => ({
            id: el.getAttribute('data-id'),
            kind: el.getAttribute('data-kind'),
            fact: el.getAttribute('data-fact') || null,
            noted: el.classList.contains('is-noted')
        })) : [];
        const tools = place?.view === 'tools' && this._toolState ? this._toolState : { available: [], locked: [] };
        return {
            ...super.getTestState(),
            osint: {
                profile: this.profile,
                view: place?.view || null,
                location: this._hereKey(),
                siteId: place?.site?.id || null,
                pageId: place?.pageId || null,
                address: this.address,
                sites: this._sites.map((s) => ({ id: s.id, type: s.type, url: s.url || '' })),
                pages: place?.site ? visiblePages(place.site, this.globals).map((p) => p.id) : [],
                visited: state.visited,
                at: state.at,
                blocks,
                collected: [...this._collected],
                held: Object.keys(this.social.intelFacts || {}).filter((f) => isHeld(this.globals, f)),
                propertiesOpen: this._propsOpen,
                openCards: [...this._openCards],
                tools: { ...tools, picked: this._toolId, toolsOn: this.toolsOn },
                last: this._last,
                live: this._liveText,
                caseFile: !!this.caseButton,
                typedInputs: this.container.querySelectorAll('input, textarea, select, [contenteditable="true"]').length
            }
        };
    }

    cleanup() {
        this._dropProps = null;
        this.root = null;
        this.main = null;
        super.cleanup();
    }
}

export default OsintBrowserMinigame;
