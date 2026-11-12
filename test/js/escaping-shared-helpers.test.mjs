// The shared escape helpers (utils/escape-html.js, utils/author-html.js) and the sinks that
// now use them: the scenario end screen body, the coverage form's outcome quote, the
// vm-launcher panel URL check, toast duplicate checks that compare the render mode, and
// gameDisplay's html mode inserting built HTML as given. Hostile author and server text
// must render as text; the small author formatting set (entities, bare <strong> <em> <b>
// <i> <br>) must still work where scenarios use it.
// The real modules run against jsdom.
// Run with: node test/js/escaping-shared-helpers.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'https://game.example/break_escape/games/7' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const { escapeHtml } = await imp('utils/escape-html.js');
const { authorHtml } = await imp('utils/author-html.js');
const { showEndScreen, safeShellUrl } = await imp('systems/apply-actions.js');
const { CoverageDecisionFormMinigame } = await imp('minigames/coverage-decision-form/coverage-decision-form-minigame.js');
const { VmLauncherMinigame, safeVmPanelUrl, vmPanelUrlWithTitle } = await imp('minigames/vm-launcher/vm-launcher-minigame.js');
const { cleanStyle, clampFontSize } = await imp('minigames/forensic-data-platform/forensic-data-platform-minigame.js');
const T = await imp('systems/notifications.js');

const HOSTILE = 'Ends <img src=x onerror="window.__pwned=1"> <script>window.__pwned=2</script> <a href="javascript:window.__pwned=3">go</a> <u class="x">u</u> & "q" \'s\'';

function fresh() {
    window.__pwned = undefined;
    document.body.innerHTML = '<div id="mg"></div><div id="notification-container"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    window.gameAlert = () => {};
    window.playUISound = () => {};
    window.gameState = { globalVariables: {} };
    delete window.breakEscapeConfig;
    return document.getElementById('mg');
}

function assertNoInjection(root, label) {
    assert.equal(root.querySelector('img, script, a, u, [onerror], [class="x"]'), null, `${label}: nothing injected`);
    assert.equal(window.__pwned, undefined, `${label}: no handler ran`);
}

// ---- utils/escape-html.js -------------------------------------------------------------

test('escapeHtml: all five characters, once; null and undefined are empty; 0 stays 0', () => {
    assert.equal(escapeHtml(`<a href="x" title='y'>&amp;</a>`), '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;amp;&lt;/a&gt;');
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
    assert.equal(escapeHtml(0), '0');
    assert.equal(escapeHtml(false), 'false');
    // Safe inside a quoted attribute: the value reads back as typed and adds no attribute
    const div = document.createElement('div');
    div.innerHTML = `<span title="${escapeHtml(HOSTILE)}" data-b='${escapeHtml(HOSTILE)}'></span>`;
    const span = div.querySelector('span');
    assert.equal(span.getAttribute('title'), HOSTILE);
    assert.equal(span.getAttribute('data-b'), HOSTILE);
    assert.equal(span.attributes.length, 2);
});

test('one escape helper: the minigames that had local copies now import the shared one', () => {
    const files = [
        'minigames/framework/base-minigame.js', 'minigames/network-architecture/network-architecture-minigame.js',
        'minigames/rfid/rfid-ui.js', 'minigames/ncsc-brief/ncsc-brief-minigame.js', 'minigames/text-file/text-file-minigame.js',
        'minigames/ransomware-display/ransomware-display-minigame.js', 'minigames/network-view/network-view-minigame.js',
        'minigames/alarm-panel/alarm-panel-minigame.js', 'minigames/container/container-minigame.js',
        'minigames/coverage-decision-form/coverage-decision-form-minigame.js', 'minigames/password/password-minigame.js',
        'minigames/esd-pushbutton/esd-pushbutton-minigame.js', 'minigames/sis-config-threshold/sis-config-threshold-minigame.js',
        'minigames/bluetooth/bluetooth-scanner-minigame.js', 'minigames/drug-library-integrity/drug-library-integrity-minigame.js',
        'minigames/ble-scanner/ble-scanner-minigame.js', 'minigames/blockchain-explorer/blockchain-explorer-minigame.js',
        'minigames/blockchain-explorer/mixer-match-board.js', 'minigames/examine/examine-minigame.js',
        'minigames/phone-chat/phone-chat-minigame.js', 'minigames/vm-launcher/vm-launcher-minigame.js', 'systems/interactions.js',
        'minigames/forensic-data-platform/forensic-data-platform-minigame.js', 'minigames/lockpicking/lockpicking-game-phaser.js',
        'minigames/network-segmentation-map/network-segmentation-map-minigame.js', 'minigames/phone-chat/phone-chat-ui.js',
        'minigames/flag-station/flag-station-minigame.js'
    ];
    for (const rel of files) {
        const src = readFileSync(join(js, rel), 'utf8');
        assert.match(src, /import \{ escapeHtml( as \w+)? \} from '(\.\.\/)+utils\/escape-html\.js';/, `${rel} imports the shared helper`);
        assert.doesNotMatch(src, /'&': '&amp;'/, `${rel} keeps no local escape table`);
    }
    for (const rel of ['minigames/ncsc-brief/ncsc-brief-minigame.js', 'minigames/coverage-decision-form/coverage-decision-form-minigame.js', 'systems/apply-actions.js']) {
        const src = readFileSync(join(js, rel), 'utf8');
        assert.match(src, /import \{ authorHtml \} from '(\.\.\/)+utils\/author-html\.js';/, `${rel} imports the shared formatter`);
        assert.doesNotMatch(src, /AUTHOR_PAIR/, `${rel} keeps no local copy of the allow-list`);
    }
});

// ---- utils/author-html.js -------------------------------------------------------------

test('authorHtml: entities and bare strong, em, b, i, br survive; dashes are shown first', () => {
    const div = document.createElement('div');
    div.innerHTML = authorHtml('<strong>W-09</strong><br>Read 28.0&deg;C -- <em>flat</em> &ldquo;q&rdquo; <B>x</B> <br/>&#10003;');
    assert.equal(div.querySelector('strong').textContent, 'W-09');
    assert.equal(div.querySelectorAll('br').length, 2);
    assert.equal(div.querySelector('em').textContent, 'flat');
    assert.equal(div.querySelector('b').textContent, 'x', 'upper-case pair restored in lower case');
    assert.ok(div.textContent.includes('28.0°C – flat “q” x ✓'), div.textContent);
});

test('authorHtml: every other tag, any attribute and an entity-encoded tag stay text', () => {
    const div = document.createElement('div');
    div.innerHTML = authorHtml(`${HOSTILE} <strong class="x">s</strong> <b onclick="x()">b</b> &lt;em&gt;lit&lt;/em&gt; <em>open`);
    assertNoInjection(div, 'authorHtml');
    assert.equal(div.querySelector('strong, b, em'), null, 'a tag with an attribute or no partner is not restored');
    assert.ok(div.textContent.includes('<img src=x onerror="window.__pwned=1">'));
    assert.ok(div.textContent.includes('<em>lit</em>'), 'an encoded tag reads as the characters');
    assert.ok(div.textContent.includes('<em>open'));
});

// ---- showEndScreen (systems/apply-actions.js) ------------------------------------------

test('end screen: a hostile title and body render as text', () => {
    fresh();
    showEndScreen({ title: HOSTILE, body: HOSTILE, outcome: 'failure' });
    const screen = document.getElementById('scenario-end-screen');
    assertNoInjection(screen, 'end screen');
    assert.equal(screen.querySelector('h1').textContent, HOSTILE);
    assert.equal(screen.querySelector('p').textContent, HOSTILE);
});

test('end screen: the author formatting set still works in the body', () => {
    fresh();
    showEndScreen({ title: 'SCENARIO ENDED', body: '<strong>EVACUATE</strong><br>Rack 3 at 61&deg;C -- the site is lost.' });
    const p = document.querySelector('#scenario-end-screen p');
    assert.equal(p.querySelector('strong').textContent, 'EVACUATE');
    assert.equal(p.querySelectorAll('br').length, 1);
    assert.equal(p.textContent, 'EVACUATERack 3 at 61°C – the site is lost.');
});

// ---- coverage decision form outcome quote ---------------------------------------------

const lockable = (md) => ({ lockable: { scenarioData: { minigameData: md } } });
function submitCoverage(quote) {
    const md = { headerRef: 'MC-007', outcomeSpeaker: 'Head of Claims', outcomeQuoteSection: 's1',
        outcomeQuotes: { A1: quote }, sections: [{ id: 's1', title: 'S1', options: [{ value: 'A1', label: 'A1' }] }] };
    const mg = new CoverageDecisionFormMinigame(fresh(), lockable(md));
    try { mg.init(); } catch { /* past the form */ }
    const radio = document.querySelector('input[type="radio"]');
    radio.checked = true;
    radio.dispatchEvent(new window.Event('change'));
    document.querySelector('#cdf-submit-btn').click();
    return document.querySelector('#cdf-outcome-text');
}

test('coverage form: the outcome quote shows entities as characters, like the rest of the form', () => {
    const el = submitCoverage('&ldquo;Agreed -- &pound;8.2M.&rdquo; <em>Noted.</em>');
    assert.equal(el.textContent, '“Agreed – £8.2M.” Noted.');
    assert.equal(el.querySelector('em').textContent, 'Noted.');
});

test('coverage form: a hostile outcome quote renders as text', () => {
    const el = submitCoverage(HOSTILE);
    assertNoInjection(el, 'outcome quote');
    assert.equal(el.textContent, HOSTILE);
});

// ---- vm-launcher panel URL ------------------------------------------------------------

test('VM panel URL: only http(s) on the page origin passes, as the parsed href; everything else is refused', () => {
    const base = 'https://game.example/break_escape/games/7';
    const accepted = {
        '/break_escape/games/7/vm_panel': 'https://game.example/break_escape/games/7/vm_panel',
        'vm_panel': 'https://game.example/break_escape/games/vm_panel',
        ' /break_escape/games/7/vm_panel ': 'https://game.example/break_escape/games/7/vm_panel',
        'https://game.example/vm?x=1': 'https://game.example/vm?x=1',
        'HTTPS://GAME.example/x': 'https://game.example/x',
    };
    for (const [ok, href] of Object.entries(accepted)) {
        assert.equal(safeVmPanelUrl(ok, base), href, `accepted: ${ok}`);
    }
    for (const bad of ['javascript:alert(1)', 'JavaScript:alert(1)', ' javascript:alert(1)', 'java\tscript:alert(1)', 'java\nscript:alert(1)',
        'data:text/html,<script>1</script>', 'vbscript:x', 'file:///etc/hosts', '//evil.example/panel', '/\\evil.example/panel',
        '\\\\evil.example/panel', 'ftp://panel.example/', '', '   ', null, undefined, 42, {},
        // Absolute, or reading as relative but resolving to another host
        'http:evil.com', 'http:/evil.com', 'https:/\\evil.com', 'https://evil.com/vm_panel', 'http://panel.example/vm?x=1',
        'http://game.example/vm', 'https://game.example:8443/vm', 'https://game.example.evil.com/vm']) {
        assert.equal(safeVmPanelUrl(bad, base), null, `refused: ${JSON.stringify(bad)}`);
    }
    // With no page origin to compare against, everything is refused
    assert.equal(safeVmPanelUrl('/vm_panel', null), null);
    assert.equal(safeVmPanelUrl('https://game.example/vm', null), null);
});

test('VM panel URL: vm_title goes in the query with ? or &, ahead of any fragment', () => {
    assert.equal(vmPanelUrlWithTitle('https://game.example/vm_panel', 'Kali "box"'), 'https://game.example/vm_panel?vm_title=Kali+%22box%22');
    assert.equal(vmPanelUrlWithTitle('https://game.example/vm_panel?set=3', 'Kali'), 'https://game.example/vm_panel?set=3&vm_title=Kali');
    assert.equal(vmPanelUrlWithTitle('https://game.example/vm_panel?set=3#top', 'K&x=1'), 'https://game.example/vm_panel?set=3&vm_title=K%26x%3D1#top');
    assert.equal(vmPanelUrlWithTitle('https://game.example/vm_panel', ''), 'https://game.example/vm_panel');
});

test('VM launcher: a refused panel URL in Hacktivity mode says the panel is unavailable, not the VirtualBox steps', () => {
    const box = fresh();
    window.breakEscapeConfig = { vmPanelUrl: 'https://evil.com/vm_panel' };
    const mg = new VmLauncherMinigame(box, { vm: { title: 'Kali', ip: '10.0.0.5' }, hacktivityMode: true });
    assert.equal(mg.vmPanelUrl, null);
    assert.equal(mg.vmPanelRefused, true);
    box.innerHTML = mg.buildVmDisplay();
    assert.equal(box.querySelector('a'), null, 'no link');
    assert.match(box.textContent, /VM panel unavailable\./);
    assert.doesNotMatch(box.textContent, /VirtualBox|click the console button/);
    assert.equal(box.textContent.includes('evil.com'), false, 'the refused value is not shown');

    // Standalone mode keeps its instructions
    const box2 = fresh();
    const solo = new VmLauncherMinigame(box2, { vm: { title: 'Kali', ip: '10.0.0.5' }, hacktivityMode: false });
    box2.innerHTML = solo.buildVmDisplay();
    assert.match(box2.textContent, /VirtualBox/);
});

test('VM launcher: a javascript: panel URL gives no console link and no iframe', () => {
    const box = fresh();
    window.breakEscapeConfig = { vmPanelUrl: 'javascript:window.__pwned=4' };
    const mg = new VmLauncherMinigame(box, { vm: { title: 'Kali', ip: '10.0.0.5' }, hacktivityMode: true });
    assert.equal(mg.vmPanelUrl, null);
    box.innerHTML = mg.buildVmDisplay();
    assert.equal(box.querySelector('a'), null, 'no link');
    try { mg.buildUI(); } catch { /* the standalone card needs more of the page */ }
    assert.equal(document.querySelector('iframe'), null, 'no iframe');
    assert.equal(window.__pwned, undefined);
});

test('VM launcher: the server path still gives the console link', () => {
    const box = fresh();
    window.breakEscapeConfig = { vmPanelUrl: '/break_escape/games/7/vm_panel' };
    const mg = new VmLauncherMinigame(box, { vm: { title: 'Kali "box"', ip: '10.0.0.5' }, hacktivityMode: true });
    box.innerHTML = mg.buildVmDisplay();
    assert.equal(box.querySelector('a.vm-action-btn').getAttribute('href'), 'https://game.example/break_escape/games/7/vm_panel?vm_title=Kali+%22box%22');
});

// ---- toasts: duplicate checks compare the render mode ---------------------------------

test('a held toast and a new one with the same words but another render mode are not duplicates', () => {
    const q = [['pass -- word', 'info', 'Overheard', 5000, false, { verbatim: true }]];
    assert.equal(T.isQueuedDuplicate(q, 'pass -- word', 'info', 'Overheard', { verbatim: true }), true);
    assert.equal(T.isQueuedDuplicate(q, 'pass -- word', 'info', 'Overheard'), false, 'verbatim vs dashed');
    assert.equal(T.isQueuedDuplicate(q, 'pass -- word', 'info', 'Overheard', { html: true }), false, 'html vs plain');
    // verbatim only means something in plain text: html with or without it is one mode
    const h = [['<em>x</em>', 'info', '', 5000, false, { html: true, verbatim: true }]];
    assert.equal(T.isQueuedDuplicate(h, '<em>x</em>', 'info', '', { html: true }), true);
    // old callers without options still match each other
    assert.equal(T.isQueuedDuplicate([['a', 'info', '', 5000, false, undefined]], 'a', 'info', ''), true);
});

test('an on-screen toast is only reused for the same render mode', () => {
    fresh();
    const a = T.showNotification('pass -- word', 'info', 'Overheard', 0, { verbatim: true });
    const b = T.showNotification('pass -- word', 'info', 'Overheard', 0);
    assert.notEqual(a, b, 'the dashed copy is its own toast');
    assert.equal(a.querySelector('.notification-message').textContent, 'pass -- word', 'verbatim keeps the hyphens');
    assert.equal(b.querySelector('.notification-message').textContent, 'pass – word');
    const c = T.showNotification('pass -- word', 'info', 'Overheard', 0, { verbatim: true });
    assert.equal(c, a, 'the same verbatim toast again reuses the first');
    const container = document.getElementById('notification-container');
    assert.equal(T.findShownDuplicate(container, 'pass -- word', 'info', 'Overheard', { verbatim: true }), a);
    assert.equal(T.findShownDuplicate(container, 'pass -- word', 'info', 'Overheard', { html: true }), null);
});

// ---- gameDisplay html mode -----------------------------------------------------------

test('gameDisplay html mode inserts the built HTML as given, newlines as <br>', async () => {
    fresh();
    const done = T.gameDisplay('<em data-k="a--b">note</em>\nline -- two', 'T &amp; C', { html: true });
    const dlg = document.querySelector('.game-display-dialog');
    assert.equal(dlg.querySelector('.game-display-body em').getAttribute('data-k'), 'a--b', 'no dash display inside markup');
    assert.ok(dlg.querySelector('.game-display-body').innerHTML.includes('line -- two'), 'the caller applies the dash display, not gameDisplay');
    assert.equal(dlg.querySelector('.game-display-title').textContent, 'T & C');
    dlg.querySelector('.game-confirm-ok').click();
    await done;
});

test('gameDisplay plain mode still shows hostile text as text with the dash display', async () => {
    fresh();
    const done = T.gameDisplay(HOSTILE + '\nA -- B', HOSTILE);
    const dlg = document.querySelector('.game-display-dialog');
    assertNoInjection(dlg, 'gameDisplay');
    assert.ok(dlg.querySelector('.game-display-body').textContent.includes('A – B'));
    dlg.querySelector('.game-confirm-ok').click();
    await done;
});

// ---- end screen host links ------------------------------------------------------------

test('end screen host links: http(s) on the game origin only, as the parsed href; no user:pass@', () => {
    const base = 'https://game.example/break_escape/games/7';
    assert.equal(safeShellUrl('/events/7/play/operations/3/debrief', base), 'https://game.example/events/7/play/operations/3/debrief');
    assert.equal(safeShellUrl('https://game.example/events/7/menu', base), 'https://game.example/events/7/menu');
    for (const bad of ['javascript:window.__pwned=5', ' JavaScript:x', 'java\tscript:x', 'data:text/html,x', 'vbscript:x',
        '//evil.com/x', '/\\evil.com/x', '\\\\evil.com', 'http:evil.com', 'https:/\\evil.com', 'ftp://x.example/', '', ' ', null, 7,
        'https://hub.example/debrief', 'http://hub.example/debrief', 'https://evil.example/', 'https://user:pw@evil.example/',
        'https://game.example@evil.example/', 'https://user:pw@game.example/x', 'https://user@game.example/x', 'http://game.example/x']) {
        assert.equal(safeShellUrl(bad, base), null, `refused: ${JSON.stringify(bad)}`);
    }
    assert.equal(safeShellUrl('/debrief', null), null, 'no page origin: refused');
    // The VM panel check refuses user:pass@ too
    assert.equal(safeVmPanelUrl('https://u:p@game.example/vm', base), null);
});

test('end screen button: a refused return link does not take the shell label', () => {
    fresh();
    window.breakEscapeConfig = { shellReturnUrl: 'javascript:window.__pwned=6', shellReturnLabel: 'Debrief' };
    showEndScreen({ title: 'Done', buttonText: 'Custom' });
    assert.equal(document.querySelector('#scenario-end-screen button').textContent, 'Custom');
    document.getElementById('scenario-end-screen').remove();
    assert.equal(window.__pwned, undefined);
});

// ---- forensic data platform font sizes ------------------------------------------------

test('forensic cleanStyle: font sizes are px or rem in a readable range; compounding units and calc() go', () => {
    assert.equal(clampFontSize('11px'), '11px');
    assert.equal(clampFontSize('9999px'), '48px');
    assert.equal(clampFontSize('1px'), '8px');
    assert.equal(clampFontSize('10rem'), '3rem');
    assert.equal(clampFontSize('0.1REM'), '0.5rem');
    // Units that compound through nested elements, and everything else, are dropped
    for (const bad of ['3em', '0.5em', '900%', 'larger', 'smaller', 'Large', 'calc(100vw)', '100vw', '50vh', '12', '-5px', '12 px', '1e3px']) {
        assert.equal(clampFontSize(bad), null, `dropped: ${bad}`);
    }
    assert.equal(cleanStyle('font-size:9999px;color:#f00'), 'font-size:48px;color:#f00');
    assert.equal(cleanStyle('font-size:calc(100vw);font-weight:bold'), 'font-weight:bold');
    assert.equal(cleanStyle('font-size: 12px'), 'font-size:12px');
});
