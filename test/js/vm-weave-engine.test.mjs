// VM weave engine fixes (scenarios/VM_INTEGRATION_REVIEW.md, docs/agents/VM_WEAVE_FIX_BRIEF.md):
//  R1  reward labels on the flag station
//  R7  a flag for another station: neutral info styling and a soft sound, no success tick
//  R8  acceptsVmLabels: in-world names on the station's VM badges
//  R9  flag_rejected { stationId, reason } and the owning station named in the refusal
//  R13 NPC AI and attacks pause while the player is on the VM
//  R14 a conclude that never reaches the server shows a not-yet-recorded ending
//  R29 validator: every VM flag a station accepts is load-bearing for the ending
// Run with: node --test test/js/vm-weave-engine.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const repo = join(here, '../..');

globalThis.window = {};
globalThis.document = { querySelector: () => null };

const wording = await import(pathToFileURL(join(js, 'utils/flag-wording.js')).href);
const guard = await import(pathToFileURL(join(js, 'systems/npc-attack-guard.js')).href);
const vmPause = await import(pathToFileURL(join(js, 'systems/vm-context-pause.js')).href);
const conclude = await import(pathToFileURL(join(js, 'music/conclude-mission.js')).href);

// ── Flag station, loaded with stubbed siblings (as flag-station-resubmit.test.mjs) ──
const root = mkdtempSync(join(tmpdir(), 'vm-weave-'));
const mg = join(root, 'minigames');
mkdirSync(join(mg, 'flag-station'), { recursive: true });
mkdirSync(join(mg, 'framework'));
mkdirSync(join(root, 'systems'));
mkdirSync(join(root, 'utils'));
writeFileSync(join(root, 'package.json'), '{"type":"module"}');
writeFileSync(join(mg, 'framework', 'base-minigame.js'), 'export class MinigameScene { constructor() {} }\n');
writeFileSync(join(root, 'systems', 'apply-actions.js'), 'export function applyActions() {}\n');
writeFileSync(join(root, 'utils', 'display-dashes.js'), 'export function displayDashes(s) { return s; }\n');
writeFileSync(join(root, 'utils', 'flag-wording.js'), readFileSync(join(js, 'utils/flag-wording.js'), 'utf8'));
writeFileSync(join(mg, 'flag-station', 'flag-station-minigame.js'),
    readFileSync(join(js, 'minigames/flag-station/flag-station-minigame.js'), 'utf8'));
const { FlagStationMinigame } = await import(pathToFileURL(join(mg, 'flag-station', 'flag-station-minigame.js')).href);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function el() { return { value: '', style: {}, textContent: '', innerHTML: '', className: '', disabled: false }; }

function makeStation(extra = {}) {
    const els = { '#flag-input': el(), '#flag-submit-btn': el(), '#flag-result': el(), '#reward-notification': el() };
    const s = Object.create(FlagStationMinigame.prototype);
    Object.assign(s, {
        gameContainer: { querySelector: (q) => els[q] || null },
        gameId: 1, stationId: 'front_desk', mode: 'standard', submittedFlags: [], isSubmitting: false,
        acceptsVms: [], acceptsVmLabels: {}, params: {},
    }, extra);
    s.updateFlagHistory = () => {};
    s.getCsrfToken = () => 't';
    s.escapeHtml = esc;
    return { s, els };
}

function world() {
    const sounds = [];
    const events = [];
    window.playUISound = (t) => sounds.push(t);
    window.eventDispatcher = { emit: (name, data) => events.push({ name, data }) };
    window.gameState = {};
    return { sounds, events };
}

function respond(status, data) {
    globalThis.fetch = async () => ({ ok: status < 400, status, json: async () => data });
}

// ── R8 ───────────────────────────────────────────────────────────────────────
test('R8: station badges show acceptsVmLabels, falling back to the raw VM id', () => {
    const { s } = makeStation({
        acceptsVms: ['bunker_monitor', 'core_host'],
        acceptsVmLabels: { bunker_monitor: 'Tomb Gamma monitoring host' },
    });
    const html = s.buildStationContent();
    assert.match(html, /<span class="vm-badge">Tomb Gamma monitoring host<\/span>/);
    assert.match(html, /<span class="vm-badge">core_host<\/span>/);
    assert.doesNotMatch(html, /vm-badge">bunker_monitor</);
});

test('R8: the constructor reads acceptsVmLabels and ignores a non-object', () => {
    const a = new FlagStationMinigame(null, { acceptsVms: ['x'], acceptsVmLabels: { x: 'The X' } });
    assert.equal(a.vmLabel('x'), 'The X');
    const b = new FlagStationMinigame(null, { acceptsVms: ['x'], acceptsVmLabels: 'nope' });
    assert.equal(b.vmLabel('x'), 'x');
});

// ── R1 ───────────────────────────────────────────────────────────────────────
test('R1: a reward label replaces "Event triggered" and the raw room id', () => {
    const { s } = makeStation();
    const box = el();
    s.showRewards(box, [
        { type: 'emit_event', event_name: 'flag_1_in', label: 'The gate logs your foothold' },
        { type: 'unlock_door', room_id: 'server_hall', label: 'The server hall door clicks open' },
    ]);
    assert.match(box.innerHTML, /The gate logs your foothold/);
    assert.match(box.innerHTML, /The server hall door clicks open/);
    assert.doesNotMatch(box.innerHTML, /Event triggered|Door unlocked: server_hall/);
});

test('R1: no label keeps the current text', () => {
    const { s } = makeStation();
    const box = el();
    s.showRewards(box, [{ type: 'emit_event', event_name: 'e' }, { type: 'unlock_door', room_id: 'r1' }]);
    assert.match(box.innerHTML, /Event triggered/);
    assert.match(box.innerHTML, /Door unlocked: r1/);
});

test('R1: a labelled set_global reward (previously silent) shows its label', () => {
    const { s } = makeStation();
    const box = el();
    s.showRewards(box, [{ type: 'set_global', key: 'k', value: true, label: 'Evidence filed' }]);
    assert.match(box.innerHTML, /Evidence filed/);
});

// ── R7 ───────────────────────────────────────────────────────────────────────
test('R7: a hint-only response is neutral info with a soft sound, never the success tick', async () => {
    const { sounds, events } = world();
    respond(200, {
        success: true, hint: true, message: 'Flag recognised', flagId: null,
        rewards: [{ type: 'hint', message: 'Launch code validated. Enter it into the launch device.' }],
    });
    const { s, els } = makeStation();
    els['#flag-input'].value = 'flag{launch}';
    await s.submitFlag();
    assert.equal(els['#flag-result'].className, 'flag-result info');
    assert.match(els['#flag-result'].textContent, /^ℹ Launch code validated/);
    assert.doesNotMatch(els['#flag-result'].textContent, /✓/);
    assert.deepEqual(sounds, ['notification']);
    assert.ok(!sounds.includes('confirm'));
    assert.deepEqual(s.submittedFlags, [], 'a hint does not consume the flag');
    assert.equal(els['#reward-notification'].innerHTML, '', 'no "Rewards Unlocked" box');
    assert.deepEqual(events.map(e => e.name), ['flag_rejected']);
    assert.deepEqual(events[0].data, { stationId: 'front_desk', reason: 'wrong_station', hint: true });
});

test('R7: the station stylesheet defines the info style', () => {
    const src = readFileSync(join(js, 'minigames/flag-station/flag-station-minigame.js'), 'utf8');
    assert.match(src, /\.flag-result\.info \{/);
});

// ── R9 ───────────────────────────────────────────────────────────────────────
test('R9: a wrong-station refusal names the owning station and emits flag_rejected', async () => {
    const { sounds, events } = world();
    respond(422, { success: false, message: 'Incorrect flag', reason: 'wrong_station', ownerStationName: 'Drop Site Terminal' });
    const { s, els } = makeStation();
    els['#flag-input'].value = 'flag{drop}';
    await s.submitFlag();
    assert.equal(els['#flag-result'].className, 'flag-result error');
    assert.equal(els['#flag-result'].textContent, '✗ Flag not accepted here. Take it to: Drop Site Terminal.');
    assert.deepEqual(sounds, ['reject']);
    assert.deepEqual(events, [{ name: 'flag_rejected',
        data: { stationId: 'front_desk', reason: 'wrong_station', ownerStationName: 'Drop Site Terminal' } }]);
});

test('R9: an undiscovered owner is not named', async () => {
    const { events } = world();
    respond(422, { success: false, message: 'Incorrect flag', reason: 'wrong_station', ownerStationName: null });
    const { s, els } = makeStation();
    els['#flag-input'].value = 'flag{vault}';
    await s.submitFlag();
    assert.equal(els['#flag-result'].textContent,
        '✗ Flag not accepted here. This station takes flags from a different machine.');
    assert.deepEqual(events[0].data, { stationId: 'front_desk', reason: 'wrong_station' });
});

test('R9: invalid and already_submitted reasons', async () => {
    let w = world();
    respond(422, { success: false, message: 'Invalid flag', reason: 'invalid' });
    let { s, els } = makeStation();
    els['#flag-input'].value = 'flag{typo';
    await s.submitFlag();
    assert.match(els['#flag-result'].textContent, /copied in full/);
    assert.deepEqual(w.events[0].data, { stationId: 'front_desk', reason: 'invalid' });

    w = world();
    respond(422, { success: false, message: 'Flag already submitted', reason: 'already_submitted' });
    ({ s, els } = makeStation());
    els['#flag-input'].value = 'flag{again}';
    await s.submitFlag();
    assert.equal(els['#flag-result'].textContent, '✗ Flag already submitted');
    assert.equal(w.events[0].data.reason, 'already_submitted');
});

test('R9: an older server with no reason still gets the right one from its message', () => {
    assert.equal(wording.flagRejectReason('Incorrect flag'), 'wrong_station');
    assert.equal(wording.flagRejectReason('Flag already submitted'), 'already_submitted');
    assert.equal(wording.flagRejectReason('Invalid flag'), 'invalid');
    assert.equal(wording.flagRejectReason(undefined), 'invalid');
    assert.equal(wording.flagRejectReason('Incorrect flag', 'bogus'), 'wrong_station');
    // the one-argument form keeps its old wording
    assert.equal(wording.flagRefusalLine('Incorrect flag'),
        '✗ Flag not accepted here. This station takes flags from a different machine.');
    assert.equal(wording.flagRefusalLine('Incorrect flag', { ownerName: 'Vault Console.' }),
        '✗ Flag not accepted here. Take it to: Vault Console.');
});

test('R9: a wrong flag at a flag lock (422 thrown by ApiClient) is a refusal, not "Validation failed"', async () => {
    const { sounds, events } = world();
    window.ApiClient = {
        unlock: async () => {
            const err = new Error('Invalid flag');
            err.status = 422;
            err.body = { success: false, message: 'Invalid flag', reason: 'invalid' };
            throw err;
        },
    };
    const { s, els } = makeStation({ mode: 'lock', stationId: 'flag-station', lockObjectId: 'safe_1',
        params: { type: 'item', lockable: { scenarioData: { id: 'safe_1' } } } });
    els['#flag-input'].value = 'flag{wrong}';
    await s.submitFlagForLock();
    assert.match(els['#flag-result'].textContent, /Flag not accepted/);
    assert.deepEqual(sounds, ['reject']);
    assert.deepEqual(events[0], { name: 'flag_rejected', data: { stationId: 'flag-station', reason: 'invalid', objectId: 'safe_1' } });
    delete window.ApiClient;
});

// ── R13 ──────────────────────────────────────────────────────────────────────
test('R13: the VM context is the launcher, a flag station, the VM overlay, a hidden tab or a blurred window', () => {
    const fw = (type) => ({ currentMinigame: type ? { _sceneType: type } : null });
    const base = { vmControlsWidget: null, document: { hidden: false }, blurred: false };
    assert.equal(vmPause.isVmContextActive({ ...base, framework: fw('vm-launcher') }), true);
    assert.equal(vmPause.isVmContextActive({ ...base, framework: fw('flag-station') }), true);
    assert.equal(vmPause.isVmContextActive({ ...base, framework: fw('person-chat') }), false);
    assert.equal(vmPause.isVmContextActive({ ...base, framework: fw(null) }), false);
    assert.equal(vmPause.isVmContextActive({ ...base, framework: { currentMinigame: { _sceneType: 'vm-launcher', _ending: true } } }), false);
    assert.equal(vmPause.isVmContextActive({ ...base, framework: fw(null), vmControlsWidget: { isOpen: true } }), true);
    assert.equal(vmPause.isVmContextActive({ ...base, framework: fw(null), document: { hidden: true } }), true);
    assert.equal(vmPause.isVmContextActive({ ...base, framework: fw(null), blurred: true }), true);
});

test('R13: focus moving into the page\'s own iframe is not a blur; leaving the page is', () => {
    vmPause._resetVmContextPause();
    const handlers = {};
    const win = { addEventListener: (n, f) => { handlers[n] = f; } };
    const doc = { activeElement: null, hidden: false, addEventListener: (n, f) => { handlers['doc:' + n] = f; }, hasFocus: () => true };
    vmPause.initVmContextPause({ window: win, document: doc, defer: (fn) => fn() });
    const active = () => vmPause.isVmContextActive({ framework: null, vmControlsWidget: null, document: doc });

    doc.activeElement = { tagName: 'IFRAME' };
    handlers.blur();
    assert.equal(active(), false, 'clicked into the embedded VM page: the launcher check covers it');

    doc.activeElement = { tagName: 'BODY' };
    handlers.blur();
    assert.equal(active(), true, 'focus left the page (SPICE console, another window)');
    handlers.focus();
    assert.equal(active(), false, 'back: resumes');
    assert.equal(typeof win.isVmContextActive, 'function');
    vmPause._resetVmContextPause();
});

test('R13: no attack starts and no windup lands while on the VM', () => {
    assert.equal(guard.minigameBlocksAttacks({ vmContextActive: true }), true);
    assert.equal(guard.attacksPausedByUI({ vmContextActive: true }), true);
    assert.equal(guard.attacksPausedByUI({ vmContextActive: false, framework: null }), false);
    // through window, as in the game
    window.isVmContextActive = () => true;
    assert.equal(guard.attacksPausedByUI(), true);
    assert.equal(guard.minigameBlocksAttacks(), true);
    window.isVmContextActive = () => false;
    assert.equal(guard.attacksPausedByUI(), false);
    delete window.isVmContextActive;
});

test('R13: NPC behaviour updates stop and NPCs stand still while on the VM, then resume', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'vm-weave-npc-'));
    writeFileSync(join(dir, 'constants-stub.mjs'), 'export const TILE_SIZE = 32;');
    writeFileSync(join(dir, 'pathfinding-stub.mjs'), 'export class NPCPathfindingManager {}');
    writeFileSync(join(dir, 'combat-config.mjs'), readFileSync(join(js, 'config/combat-config.js'), 'utf8'));
    writeFileSync(join(dir, 'npc-chase-leash.mjs'), readFileSync(join(js, 'systems/npc-chase-leash.js'), 'utf8'));
    writeFileSync(join(dir, 'fight-styles.mjs'), readFileSync(join(js, 'systems/fight-styles.js'), 'utf8'));
    writeFileSync(join(dir, 'npc-behavior.mjs'), readFileSync(join(js, 'systems/npc-behavior.js'), 'utf8')
        .replace("'../utils/constants.js'", "'./constants-stub.mjs'")
        .replace("'./npc-pathfinding.js'", "'./pathfinding-stub.mjs'")
        .replace("'../config/combat-config.js'", "'./combat-config.mjs'")
        .replace("'./npc-chase-leash.js'", "'./npc-chase-leash.mjs'")
        .replace("'./fight-styles.js'", "'./fight-styles.mjs'"));
    const log = console.log; console.log = () => {};
    const { default: mod } = await import(pathToFileURL(join(dir, 'npc-behavior.mjs')).href);
    console.log = log;

    const mgr = Object.create(mod.NPCBehaviorManager.prototype);
    const calls = [];
    const guardNpc = {
        npcId: 'guard', direction: 'down', isMoving: true,
        sprite: { body: { setVelocity: (x, y) => calls.push(['vel', x, y]) } },
        playAnimation: (state, dir) => calls.push(['anim', state, dir]),
        update: () => calls.push(['update']),
    };
    Object.assign(mgr, { behaviors: new Map([['guard', guardNpc]]), updateInterval: 50, lastUpdate: 0 });
    window.player = { x: 0, y: 0 };

    let onVm = true;
    window.isVmContextActive = () => onVm;
    mgr.update(1000, 16);
    mgr.update(2000, 16);
    assert.deepEqual(calls, [['vel', 0, 0], ['anim', 'idle', 'down']], 'frozen once, no behaviour update');
    assert.equal(guardNpc.isMoving, false);

    onVm = false;
    calls.length = 0;
    mgr.update(3000, 16);
    assert.deepEqual(calls, [['update']], 'resumes');
    delete window.isVmContextActive;
    delete window.player;
});

test('R13: the game loop skips sight challenges while on the VM', () => {
    const src = readFileSync(join(js, 'core/game.js'), 'utf8');
    assert.match(src, /if \(!window\.isVmContextActive\?\.\(\)\) \{\s*sightChallengeWatcher\.update/);
    const main = readFileSync(join(js, 'main.js'), 'utf8');
    assert.match(main, /initVmContextPause\(\);/);
});

// ── R14 ──────────────────────────────────────────────────────────────────────
const noWait = { wait: async () => {}, csrf: 't' };

test('R14: a conclude that never reaches the server retries, then resolves offline', async () => {
    let n = 0;
    const r = await conclude.concludeWithRetry(7, { ...noWait, fetch: async () => { n++; throw new Error('offline'); } });
    assert.deepEqual(r, { concluded: true, missing: [], offline: true });
    assert.equal(n, 1 + conclude.CONCLUDE_RETRY_DELAYS_MS.length);
});

test('R14: an HTTP error and a non-JSON 200 are also not an answer', async () => {
    let r = await conclude.concludeWithRetry(7, { ...noWait, fetch: async () => ({ ok: false, status: 500 }) });
    assert.equal(r.offline, true);
    r = await conclude.concludeWithRetry(7, { ...noWait, fetch: async () => ({ ok: true, json: async () => { throw new Error('html'); } }) });
    assert.equal(r.offline, true);
});

test('R14: a retry that gets through is a normal conclusion; a refusal stays a refusal', async () => {
    let n = 0;
    let r = await conclude.concludeWithRetry(7, { ...noWait, fetch: async () => {
        if (n++ === 0) throw new Error('blip');
        return { ok: true, json: async () => ({ success: true }) };
    } });
    assert.deepEqual(r, { concluded: true, missing: [], offline: false });
    r = await conclude.concludeWithRetry(7, { ...noWait, fetch: async () => ({ ok: true, json: async () => ({ success: false, missing: ['submit_flag_2'] }) }) });
    assert.deepEqual(r, { concluded: false, missing: ['submit_flag_2'], offline: false });
});

test('R14: the offline ending says not yet recorded, never the plain MISSION COMPLETE', () => {
    const o = conclude.offlineEndingOptions({
        credits: [{ text: 'MISSION COMPLETE', style: 'title' }, { text: 'AGENT HAX: On the line.', style: 'entry' }],
        headerText: undefined, statusText: undefined, autoStop: true,
    });
    assert.equal(o.headerText, conclude.OFFLINE_HEADER);
    assert.equal(o.statusText, conclude.OFFLINE_STATUS);
    assert.equal(o.autoStop, true);
    assert.equal(o.credits[0].text, conclude.OFFLINE_TITLE);
    assert.equal(o.credits[0].style, 'title');
    assert.match(o.credits[1].text, /will sync/);
    assert.ok(!o.credits.some(c => /^MISSION COMPLETE$/i.test(c.text)));
    assert.doesNotMatch(o.headerText, /^MISSION COMPLETE/);
    // credits with no title line get the note at the top
    const p = conclude.offlineEndingOptions({ credits: [{ text: 'THE END' }], headerText: 'MISSION FAILED // AUDIO INTEL' });
    assert.equal(p.credits[0].text, conclude.OFFLINE_TITLE);
    assert.equal(p.credits[2].text, 'THE END');
    assert.equal(p.headerText, conclude.OFFLINE_HEADER);
});

test('R14: the background retry records the result and stops', async () => {
    const notes = [];
    const listeners = {};
    const win = { addEventListener: (n, f) => { listeners[n] = f; }, removeEventListener: (n) => { delete listeners[n]; } };
    let up = false;
    const q = conclude.queueConcludeRetry(7, {
        window: win, every: 1e9, csrf: 't', sync: async () => {},
        fetch: async () => { if (!up) throw new Error('down'); return { ok: true, json: async () => ({ success: true }) }; },
        notify: (msg, type) => notes.push([msg, type]),
    });
    assert.equal(typeof listeners.online, 'function', 'retries when the browser comes back online');
    let r = await q.attempt();
    assert.equal(r.failed, true);
    assert.deepEqual(notes, []);
    up = true;
    r = await q.attempt();
    assert.equal(r.concluded, true);
    assert.deepEqual(notes, [[conclude.RECORDED_NOTICE, 'success']]);
    assert.equal(listeners.online, undefined, 'stopped');
    assert.equal(await q.attempt(), null);
    q.stop();
});

test('R14: the music event uses the offline ending and queues the retry', () => {
    const src = readFileSync(join(js, 'music/scenario-music-events.js'), 'utf8');
    assert.match(src, /if \(result\.concluded && result\.offline\) \{[\s\S]*?openCredits\(offlineEndingOptions\);[\s\S]*?queueConcludeRetry\(/);
    assert.match(src, /return concludeWithRetry\(gameId\);/);
});

// ── R29 ──────────────────────────────────────────────────────────────────────
const ruby = spawnSync('ruby', ['--version']);
test('R29: the validator warns on a VM flag the ending does not depend on', { skip: ruby.status !== 0 && 'ruby not found' }, () => {
    const scenario = {
        flags: { box: { flag_1: 'flag{a}', flag_2: 'flag{b}', flag_3: 'flag{c}', flag_4: 'flag{d}' } },
        globalVariables: { gate_done: false },
        objectives: [{
            aimId: 'end', missionConclusion: true,
            concludeRequires: { tasksCompleted: ['t1', 't_lock'], globals: ['gate_done'] },
            tasks: [
                { taskId: 't1', type: 'submit_flags', targetFlags: ['drop:box-flag1'], targetCount: 1 },
                { taskId: 't2', type: 'submit_flags', targetFlags: ['drop:box-flag2'], targetCount: 1 },
                { taskId: 't_lock', type: 'submit_flags', targetFlags: ['box:flag_4'], targetCount: 1 },
            ],
        }],
        rooms: {
            r: {
                objects: [
                    { type: 'flag-station', id: 'drop', name: 'Drop', acceptsVms: ['box'], flags: ['box:flag_1', 'box:flag_2'] },
                    { type: 'flag-station', id: 'gate', name: 'Gate', acceptsVms: ['box'], flags: ['box:flag_3'],
                      flagRewards: [{ type: 'set_global', key: 'gate_done', value: true }] },
                    { type: 'safe', id: 'safe', name: 'Safe', locked: true, lockType: 'flag', requires: 'box:flag_4', completesTask: 't_lock' },
                ],
            },
        },
    };
    const script = `require ${JSON.stringify(join(repo, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_vm_flags_load_bearing(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const issues = JSON.parse(r.stdout.trim().split('\n').pop());
    assert.equal(issues.length, 1, issues.join('\n'));
    assert.match(issues[0], /WARNING/);
    assert.match(issues[0], /box:flag_2/);
    assert.match(issues[0], /R29/);

    // the same flag through a gate task is fine
    scenario.objectives[0].concludeRequires.tasksCompleted.push('t2');
    const r2 = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.deepEqual(JSON.parse(r2.stdout.trim().split('\n').pop()), []);
});
