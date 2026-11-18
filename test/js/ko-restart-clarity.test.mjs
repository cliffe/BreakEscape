// Honest labels and a stated cause (KO and restart clarity).
//  - The KO screen's button is "Respawn" with a line saying progress is kept.
//  - PLAYER_KO carries the cause (attacker name) and the screen says "Knocked out by <name>.",
//    falling back to "You have been defeated". Set with textContent.
//  - The Resume overlay's "Start over" opens a confirm step; only its Start over POSTs /reset,
//    and X or Keep my progress close it without a POST.
// Real sources against jsdom. Run with: bin/test-js test/js/ko-restart-clarity.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'ko-restart-clarity-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const copy = (rel) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
};
['ui/game-over-screen.js', 'ui/session-restart-confirm.js', 'systems/player-health.js',
 'systems/player-damage-interrupt.js', 'events/combat-events.js', 'config/combat-config.js',
 'utils/desktop-app.js'].forEach(copy);

const dom = new JSDOM('<!doctype html><body></body>');
const emitted = [];
const handlers = {};
globalThis.document = dom.window.document;
globalThis.window = {
    location: { href: 'http://localhost/games/1' },
    eventDispatcher: {
        emit: (name, data) => { emitted.push({ name, data }); (handlers[name] || []).forEach(f => f(data)); },
        on: (name, f) => { (handlers[name] = handlers[name] || []).push(f); }
    },
    addEventListener() {}
};
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { GameOverScreen, knockoutMessage, RESPAWN_LABEL, RESPAWN_NOTE, DEFEATED_TEXT } = await imp('ui/game-over-screen.js');
const { initPlayerHealth, normaliseDamageSource } = await imp('systems/player-health.js');
const { installRestartConfirm } = await imp('ui/session-restart-confirm.js');
const { CombatEvents } = await imp('events/combat-events.js');
const log = console.log; console.log = () => {};

test('KO screen: Respawn button and a line that progress is kept', () => {
    const screen = new GameOverScreen();
    const btn = document.getElementById('game-over-respawn-btn');
    assert.equal(btn.textContent, 'Respawn');
    assert.equal(RESPAWN_LABEL, 'Respawn');
    assert.match(document.getElementById('game-over-respawn-note').textContent, /progress is kept/i);
    assert.match(RESPAWN_NOTE, /start/i);
    const labels = [...document.querySelectorAll('#game-over-screen button')].map(b => b.textContent);
    assert.deepEqual(labels, ['Respawn', 'Main Menu']);
    assert.ok(!labels.includes('Restart'));
    assert.ok(screen.message);
});

test('knockoutMessage: names the cause, else the old text', () => {
    assert.equal(knockoutMessage({ npcId: 'park', name: 'Dr Park' }), 'Knocked out by Dr Park.');
    assert.equal(knockoutMessage(null), DEFEATED_TEXT);
    assert.equal(knockoutMessage({}), 'You have been defeated');
    assert.equal(knockoutMessage({ name: '   ' }), 'You have been defeated');
});

test('PLAYER_KO carries the attacker and the screen shows it via textContent', () => {
    const health = initPlayerHealth();
    health.damage(9999, { npcId: 'hollis', name: '<img src=x onerror=alert(1)>Hollis' });
    const ko = emitted.filter(e => e.name === CombatEvents.PLAYER_KO).pop();
    assert.equal(ko.data.cause.npcId, 'hollis');
    const msg = document.querySelector('#game-over-screen p');
    assert.equal(msg.textContent, 'Knocked out by <img src=x onerror=alert(1)>Hollis.');
    assert.equal(msg.querySelector('img'), null, 'never parsed as HTML');
});

test('PLAYER_KO without a cause keeps "You have been defeated"', () => {
    const health = initPlayerHealth();
    health.damage(9999);
    const ko = emitted.filter(e => e.name === CombatEvents.PLAYER_KO).pop();
    assert.equal(ko.data.cause, null);
    assert.equal(document.querySelector('#game-over-screen p').textContent, 'You have been defeated');
    // an unnamed source is also no cause
    assert.equal(normaliseDamageSource({ npcId: 'x' }), null);
    assert.equal(normaliseDamageSource({ npcId: 'x', name: ' A  B ' }).name, 'A B');
    assert.equal(normaliseDamageSource({ name: 'x'.repeat(200) }).name.length, 60);
});

test('NPC combat passes the attacker (display name) to the health system', () => {
    const src = readFileSync(join(js, 'systems/npc-combat.js'), 'utf8');
    assert.equal((src.match(/playerHealth\.damage\([a-z]+, attackerSource\(npcId\)\)/g) || []).length, 2);
    assert.match(src, /npc\?\.displayName/);
});

// The Resume overlay -----------------------------------------------------------------

function overlay() {
    const d = new JSDOM(`<!doctype html><body>
      <div id="session-main-row" style="display:flex">
        <button id="session-resume-btn">Resume</button>
        <button id="session-restart-btn">Start over</button>
        <button id="session-new-btn">New Session</button>
      </div>
      <div id="session-restart-confirm" style="display:none">
        <button id="session-restart-close-btn" aria-label="Close">X</button>
        <button id="session-restart-keep-btn">Keep my progress</button>
        <button id="session-restart-confirm-btn">Start over</button>
      </div>
      <p id="session-restart-status" style="display:none"></p></body>`).window.document;
    const calls = []; let reloads = 0;
    const ctl = installRestartConfirm({
        doc: d, apiBasePath: '/break_escape/games/7', csrfToken: 'tok',
        fetchFn: (url, opts) => { calls.push({ url, opts }); return Promise.resolve({ json: () => Promise.resolve({ success: true }) }); },
        reload: () => { reloads++; }
    });
    return { d, calls, ctl, reloads: () => reloads };
}
const shown = (el) => el.style.display !== 'none';
const tick = () => new Promise(r => setTimeout(r, 0));

test('overlay: Start over opens the confirm step and sends nothing', () => {
    const { d, calls } = overlay();
    d.getElementById('session-restart-btn').click();
    assert.ok(shown(d.getElementById('session-restart-confirm')));
    assert.ok(!shown(d.getElementById('session-main-row')));
    assert.equal(calls.length, 0);
});

test('overlay: confirm Start over POSTs /reset then reloads', async () => {
    const { d, calls, reloads } = overlay();
    d.getElementById('session-restart-btn').click();
    d.getElementById('session-restart-confirm-btn').click();
    await tick(); await tick(); await tick();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, '/break_escape/games/7/reset');
    assert.equal(calls[0].opts.method, 'POST');
    assert.equal(calls[0].opts.headers['X-CSRF-Token'], 'tok');
    assert.equal(reloads(), 1);
});

test('overlay: X and Keep my progress close the step without a POST', async () => {
    for (const id of ['session-restart-close-btn', 'session-restart-keep-btn']) {
        const { d, calls, ctl, reloads } = overlay();
        d.getElementById('session-restart-btn').click();
        assert.equal(ctl.isConfirming(), true);
        d.getElementById(id).click();
        await tick();
        assert.equal(ctl.isConfirming(), false);
        assert.ok(shown(d.getElementById('session-main-row')));
        assert.ok(!shown(d.getElementById('session-restart-confirm')));
        assert.equal(calls.length, 0);
        assert.equal(reloads(), 0);
    }
});

test('overlay: a failed reset shows the error and re-enables the buttons', async () => {
    const d = overlay().d;
    installRestartConfirm({ doc: d, fetchFn: () => Promise.resolve({ json: () => Promise.resolve({ success: false, error: 'No' }) }), reload() { throw new Error('no reload'); } });
    d.getElementById('session-restart-btn').click();
    d.getElementById('session-restart-confirm-btn').click();
    await tick(); await tick(); await tick();
    assert.equal(d.getElementById('session-restart-status').textContent, 'Error: No');
    assert.equal(d.getElementById('session-restart-confirm-btn').disabled, false);
});

test('the view labels the button Start over and loads the confirm module', () => {
    const erb = readFileSync(join(here, '../../app/views/break_escape/games/show.html.erb'), 'utf8');
    assert.match(erb, /id="session-restart-btn"[^>]*>Start over<\/button>/);
    assert.match(erb, /session-restart-confirm\.js/);
    assert.match(erb, /aria-label="Close"[^>]*>X<\/button>/);
    assert.match(erb, /Keep my progress/);
    assert.doesNotMatch(erb, />Restart<\/button>/);
});
