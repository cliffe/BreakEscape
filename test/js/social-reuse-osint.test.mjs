// Reusability options on the OSINT browser: the Case file button label, the toast title, image
// paths relative to assets/ (blocks, concept cards, site logos) and post authors. Defaults keep
// today's behaviour. Real files in a jsdom document.
// Run with: bundle exec node --test test/js/social-reuse-osint.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const fixture = JSON.parse(readFileSync(join(here, 'fixtures/social/osint-browser-social.json'), 'utf8'));
const clone = (o) => JSON.parse(JSON.stringify(o));

const dir = mkdtempSync(join(tmpdir(), 'social-reuse-osint-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const files = readdirSync(join(js, 'minigames/osint-browser')).filter((f) => f.endsWith('.js')).map((f) => `minigames/osint-browser/${f}`);
for (const rel of [...files, 'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/global-writer.js', 'systems/social-intel.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'https://game.example/break_escape/games/1' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
const alerts = [];
window.stateSync = { sync() {} };
window.addNote = () => {};
window.eventDispatcher = { emit() {} };
window.gameAlert = (...a) => { alerts.push(a); };
window.MinigameFramework = { currentMinigame: null, endMinigame() {}, startMinigame() {} };

const { OsintBrowserMinigame } = await import(pathToFileURL(join(dir, 'minigames/osint-browser/osint-browser-minigame.js')));
const { createConceptCard } = await import(pathToFileURL(join(dir, 'minigames/osint-browser/concept-card.js')));

let current = null;
function open(social, params = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    window.gameState = { globalVariables: {} };
    window.gameScenario = { social };
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new OsintBrowserMinigame(container, params);
    scene._sceneType = 'osint-browser';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}

test('Case file button: default text, then intelBoard.labels.caseButton', () => {
    const s = open(clone(fixture));
    assert.equal(s.caseButton.textContent, 'Case file');
    assert.equal(s.caseButton.getAttribute('aria-label'), 'Case file');
    const social = clone(fixture);
    social.intelBoard.labels = { caseButton: 'Dossier' };
    const t = open(social);
    assert.equal(t.caseButton.textContent, 'Dossier');
    assert.equal(t.caseButton.getAttribute('aria-label'), 'Dossier');
});

const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
const pick = (s, id) => click(s.container.querySelector(`.ob-block[data-id="${id}"]`));
const linkTo = (s, label) => [...s.container.querySelectorAll('a.ob-link, a.ob-profile-link')].find((a) => a.textContent.trim().startsWith(label));
const siteButton = (s, id) => s.container.querySelector(`.ob-site[data-site="${id}"]`);

test('toast title: default "Ready to approach", override from intelBoard.labels.toastTitle', () => {
    for (const [labels, want] of [[undefined, 'Ready to approach'], [{ toastTitle: 'Cleared' }, 'Cleared']]) {
        const social = clone(fixture);
        if (labels) social.intelBoard.labels = labels;
        alerts.length = 0;
        const s = open(social);
        pick(s, 'row_pierce');
        click(linkTo(s, 'Read the team notes'));
        pick(s, 'note_q3');
        click(siteButton(s, 'social'));
        click(linkTo(s, 'Melanie Pierce'));
        pick(s, 'post_pierce_jed');
        click(siteButton(s, 'tools'));
        click(s.container.querySelector('.ob-tool[data-tool="hunter"]'));
        pick(s, 'r_pattern');
        assert.equal(window.gameState.globalVariables.target_ready_pierce, true);
        assert.equal(alerts.length, 1);
        assert.equal(alerts[0][2], want);
    }
});

test('image blocks and concept-card images resolve under assets/, site logos under assets/logos/', () => {
    const social = clone(fixture);
    const site = social.osint.sites.find((x) => x.type === 'company-site');
    site.logo = 'ledgerwell.png';
    site.pages[0].blocks.push({ kind: 'image', src: 'social/osint/office.png', alt: 'The office' });
    const s = open(social, { start: site.id });
    assert.equal(s.container.querySelector('.ob-image').getAttribute('src'), '/break_escape/assets/social/osint/office.png');
    assert.equal(s.container.querySelector('.ob-logo').getAttribute('src'), '/break_escape/assets/logos/ledgerwell.png');
    const card = createConceptCard({ id: 'c', title: 'T', text: 'x', image: 'social/osint/card.png' });
    assert.equal(card.el.querySelector('.cc-image').getAttribute('src'), '/break_escape/assets/social/osint/card.png');
});

test('post author: shows the headshot and name of a people id; a post without one is unchanged', () => {
    const social = clone(fixture);
    const profile = social.osint.sites.find((x) => x.type === 'social').profiles[0];
    profile.posts = [
        { id: 'p_plain', kind: 'post', text: 'Plain post.' },
        { id: 'p_by', kind: 'post', text: 'Posted by Jed.', author: 'baker' }
    ];
    const s = open(social, { start: `social.${profile.person}` });
    const plain = s.container.querySelector('.ob-block[data-id="p_plain"]');
    const by = s.container.querySelector('.ob-block[data-id="p_by"]');
    assert.equal(plain.querySelector('.ob-post-author'), null);
    assert.ok(plain.firstElementChild.classList.contains('ob-post-text'));
    const who = by.querySelector('.ob-post-author');
    assert.ok(who.querySelector('img.ob-headshot'));
    assert.equal(who.querySelector('.ob-profile-name').textContent, 'Jed Baker');
    assert.ok(by.firstElementChild.classList.contains('ob-post-author'));
});
