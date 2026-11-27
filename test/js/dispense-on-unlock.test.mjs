// A badge printer ("dispenses": true) hands its badge over the moment the PIN is accepted,
// instead of opening a container screen and waiting for a click on the badge (m07 and m08).
// The module is loaded with injected deps; unlock-system.js is checked as source for the wiring.
// Run with: node --test test/js/dispense-on-unlock.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const js = join(root, 'public/break_escape/js');
const { wantsDispense, dispenseContents, afterContainerUnlock, isDispensing } = await import(join(js, 'utils/dispense-on-unlock.js'));

const badge = { type: 'keycard', id: 'printed_contractor_badge', name: 'Printed Contractor Badge', takeable: true };
function deps({ contents = [badge], ok = true, addOk = true } = {}) {
    const added = [], alerts = [], sounds = [], urls = [];
    return {
        added, alerts, sounds, urls,
        gameId: 7,
        imageKey: (i) => i.type,
        fetchFn: async (url) => { urls.push(url); return { ok, json: async () => ({ contents }) }; },
        addToInventory: async (sprite) => { added.push(sprite.scenarioData.id); return { ok: addOk }; },
        alert: (msg, kind) => alerts.push({ msg, kind }),
        sound: (n) => sounds.push(n),
    };
}

test('only a container marked dispenses hands its contents over', () => {
    assert.equal(wantsDispense({ dispenses: true, contents: [badge] }), true);
    assert.equal(wantsDispense({ dispenses: true, hasContents: true }), true);
    assert.equal(wantsDispense({ contents: [badge] }), false);
    assert.equal(wantsDispense(null), false);
});

test('the badge goes into the inventory in one step, through the server-checked path', async () => {
    const d = deps();
    const data = { id: 'badge_printer', name: 'Contractor Badge Station', dispenses: true };
    const r = await dispenseContents(data, d);
    assert.equal(r.ok, true);
    assert.deepEqual(d.added, ['printed_contractor_badge']);
    assert.match(d.urls[0], /\/break_escape\/games\/7\/container\/badge_printer$/);
    assert.equal(d.alerts.length, 1);
    assert.equal(d.alerts[0].kind, 'success');
    assert.deepEqual(data.contents, []);
});

test('a refused item is not reported as printed, and the caller falls back to the container screen', async () => {
    const d = deps({ addOk: false });
    const r = await dispenseContents({ id: 'badge_printer', name: 'x', dispenses: true }, d);
    assert.equal(r.ok, false);
    assert.deepEqual(d.alerts, []);
    assert.ok(d.sounds.includes('reject'));
});

test('a server refusal or an empty tray hands nothing over', async () => {
    assert.equal((await dispenseContents({ id: 'badge_printer', dispenses: true }, deps({ ok: false }))).ok, false);
    const d = deps({ contents: [] });
    assert.equal((await dispenseContents({ id: 'badge_printer', dispenses: true }, d)).ok, false);
    assert.deepEqual(d.added, []);
});

test('unlock-system.js is a thin caller of afterContainerUnlock, with the screen as the fallback', () => {
    const src = readFileSync(join(js, 'systems/unlock-system.js'), 'utf8');
    assert.match(src, /import \{ afterContainerUnlock \} from '..\/utils\/dispense-on-unlock.js'/);
    const a = src.indexOf('afterContainerUnlock(lockable.scenarioData');
    assert.ok(a > 0);
    assert.match(src.slice(a, a + 500), /openScreen:[\s\S]*window\.handleContainerInteraction\(lockable\)/);
});

function screenCounter() { const c = { n: 0, open: () => { c.n++; } }; return c; }
const printer = (extra = {}) => ({ id: 'badge_printer', name: 'Badge Station', ...extra });

test('no dispenses flag: the container screen opens once and nothing is fetched', async () => {
    const d = deps(); const c = screenCounter();
    assert.equal(await afterContainerUnlock(printer({ contents: [badge] }), { openScreen: c.open }, d), 'screen');
    assert.equal(c.n, 1);
    assert.deepEqual(d.urls, []);
});

test('flag plus success: the screen is not opened', async () => {
    const d = deps(); const c = screenCounter();
    assert.equal(await afterContainerUnlock(printer({ dispenses: true, contents: [badge] }), { openScreen: c.open }, d), 'dispensed');
    assert.equal(c.n, 0);
    assert.deepEqual(d.added, ['printed_contractor_badge']);
});

test('flag plus failure: the screen is opened once', async () => {
    const d = deps({ addOk: false }); const c = screenCounter();
    assert.equal(await afterContainerUnlock(printer({ dispenses: true, contents: [badge] }), { openScreen: c.open }, d), 'screen');
    assert.equal(c.n, 1);
});

test('autoOpen false does nothing at all', async () => {
    const d = deps(); const c = screenCounter();
    assert.equal(await afterContainerUnlock(printer({ dispenses: true, contents: [badge] }), { autoOpen: false, openScreen: c.open }, d), 'skipped');
    assert.equal(c.n, 0);
    assert.deepEqual(d.urls, []);
});

test('two items, one refused: the other is kept, the refused one stays in contents, the screen opens', async () => {
    const second = { type: 'lockpick', id: 'second', name: 'Second', takeable: true };
    const d = deps({ contents: [badge, second] });
    d.addToInventory = async (sprite) => { d.added.push(sprite.scenarioData.id); return { ok: sprite.scenarioData.id !== 'second' }; };
    const data = printer({ dispenses: true, contents: [badge, second] });
    const c = screenCounter();
    assert.equal(await afterContainerUnlock(data, { openScreen: c.open }, d), 'screen');
    assert.equal(c.n, 1);
    assert.deepEqual(data.contents.map(i => i.id), ['second']);
    const r = await dispenseContents({ ...data }, deps({ contents: [badge, second], addOk: true }));
    assert.equal(r.ok, true);
});

test('a second dispense while the first is in flight adds one item and gives no fallback', async () => {
    let release; const gate = new Promise(r => { release = r; });
    const d = deps();
    const slow = d.fetchFn;
    d.fetchFn = async (u) => { await gate; return slow(u); };
    const data = printer({ dispenses: true, contents: [badge] });
    const first = dispenseContents(data, d);
    assert.equal(isDispensing(data), true);
    const second = dispenseContents(data, d);
    release();
    const [r1, r2] = await Promise.all([first, second]);
    assert.equal(r1.ok, true);
    assert.equal(r2.ok, true);
    assert.equal(d.added.length, 1);
    assert.equal(d.alerts.length, 1);
    assert.equal(d.urls.length, 1);
    assert.equal(isDispensing(data), false);
});

test('the unlock timer does nothing while a dispense is in flight', async () => {
    let release; const gate = new Promise(r => { release = r; });
    const d = deps(); const slow = d.fetchFn;
    d.fetchFn = async (u) => { await gate; return slow(u); };
    const data = printer({ dispenses: true, contents: [badge] });
    const c = screenCounter();
    const first = afterContainerUnlock(data, { openScreen: c.open }, d);
    assert.equal(await afterContainerUnlock(data, { openScreen: c.open }, d), 'skipped');
    release();
    assert.equal(await first, 'dispensed');
    assert.equal(c.n, 0);
    assert.equal(d.added.length, 1);
});

test('an emptied tray is not fetched again on a reopen', async () => {
    assert.equal(wantsDispense({ dispenses: true, contents: [] }), false);
    const d = deps(); const c = screenCounter();
    assert.equal(await afterContainerUnlock(printer({ dispenses: true, contents: [] }), { openScreen: c.open }, d), 'screen');
    assert.deepEqual(d.urls, []);
});

test('a non-takeable or notes-family item sends the whole container to the screen, dispensing nothing', async () => {
    for (const bad of [{ type: 'suitcase', id: 'fixture', name: 'Fixture', takeable: false },
                       { type: 'notes2', id: 'memo', name: 'Memo', takeable: true, readable: true, text: 'x' }]) {
        const d = deps({ contents: [badge, bad] }); const c = screenCounter();
        assert.equal(await afterContainerUnlock(printer({ dispenses: true, contents: [badge, bad] }), { openScreen: c.open }, d), 'screen');
        assert.deepEqual(d.added, []);
        assert.equal(c.n, 1);
    }
});

test('the toast shows the item name the way the container screen does (double hyphen as a dash)', async () => {
    const d = deps({ contents: [{ ...badge, name: 'Badge -- Server' }] });
    await dispenseContents(printer({ dispenses: true, contents: [badge] }), d);
    assert.ok(!d.alerts[0].msg.includes('--'));
});

test('the test scenario carries a PIN, a password and a fallback dispenser', () => {
    const src = readFileSync(join(root, 'scenarios/test_dispense_on_unlock/scenario.json.erb'), 'utf8');
    const j = JSON.parse(src);
    const objs = j.rooms.lobby.objects.filter(o => o.dispenses);
    assert.deepEqual(objs.map(o => [o.lockType, o.contents.length]), [['pin', 1], ['password', 2], ['pin', 2]]);
});

test('the m07 and m08 badge printers are marked dispenses and still hold a takeable keycard server-side', () => {
    for (const [file, id] of [['m07_architects_gambit', 'printed_contractor_badge'], ['m08_the_mole', 'printed_server_badge']]) {
        const src = readFileSync(join(root, 'scenarios', file, 'scenario.json.erb'), 'utf8');
        const at = src.indexOf('"id": "badge_printer"');
        const block = src.slice(at, src.indexOf('"id": "' + id + '"', at) + 200);
        assert.match(block, /"lockType": "pin"/, file);
        assert.match(block, /"dispenses": true/, file);
        assert.match(block, /"requires":/, file);
    }
});
