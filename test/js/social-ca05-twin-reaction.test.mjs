// D265: the ca05 defend twin's after-sort colleague reaction. A blind persona playtest found the
// twin felt flat once the sort was done: nobody in the office reacts. The twin generator now wires
// one proactive bark on kit_darren_price, spoken from the shared ambient ink's ca05_react knot,
// which reads only kit_key_caught and is true on every path (trust, delete, report or leave).
// This guards the wiring, the twin-only scope, and the knot's shape. The runtime ink-loading of
// darren_price_ambient is already exercised by office-kit-quiet-and-stub.test.mjs.
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const readJson = p => JSON.parse(readFileSync(join(root, p), 'utf8'));

const TWIN = 'scenarios/ca05_signin_pages_defend/scenario.json.erb';
const SHELL = 'scenarios/ca05_signin_pages/scenario.json.erb';
const INK = 'scenarios/_office_kit/ink/darren_price_ambient.ink';

function darrenMappings(scPath) {
    const sc = readJson(scPath);
    const npc = sc.rooms.training_room.npcs.find(n => n.id === 'kit_darren_price');
    return (npc && npc.eventMappings) || [];
}

test('ca05 twin: kit_darren_price fires the after-sort reaction bark from ca05_react', () => {
    const m = darrenMappings(TWIN).find(x => x.targetKnot === 'ca05_react');
    assert.ok(m, 'no targetKnot ca05_react mapping on kit_darren_price');
    assert.equal(m.eventPattern, 'global_variable_changed:kit_defend_done');
    assert.equal(m.condition, 'value === true');
    assert.equal(m.onceOnly, true);
    // a delay lets the delayed-mapping runner wait for the kiosk to close, so the bark lands after the sort
    assert.ok(Number(m.delayMs) > 0, 'delayMs must let the kiosk close first');
    // no literal bark: the spoken line comes from the ink knot, so it is voiceable and branches on state
    assert.ok(!('bark' in m), 'the reaction must read its line from the ink, not a literal bark string');
});

test('ca05 twin reaction is twin-only: the full ca05 shell Darren carries no ca05_react mapping', () => {
    assert.ok(!darrenMappings(SHELL).some(x => x.targetKnot === 'ca05_react'),
        'the full shell Darren must be untouched');
});

function knotBody(ink, name) {
    const m = ink.match(new RegExp(`^===\\s*${name}\\s*===\\s*$([\\s\\S]*?)(?=^===|(?![\\s\\S]))`, 'm'));
    return m ? m[1] : null;
}

test('ca05_react: a caught line and a not-caught line, branched on kit_key_caught alone', () => {
    const ink = readFileSync(join(root, INK), 'utf8');
    const body = knotBody(ink, 'ca05_react');
    assert.ok(body, 'no ca05_react knot in darren_price_ambient.ink');
    assert.ok(/\{\s*kit_key_caught\s*:/.test(body), 'does not branch on kit_key_caught');
    // only kit_key_caught may be read: no other kit_ global
    const kitReads = [...body.matchAll(/kit_[a-z0-9_]+/g)].map(x => x[0]);
    assert.ok(kitReads.length > 0 && kitReads.every(r => r === 'kit_key_caught'),
        `ca05_react reads kit globals other than kit_key_caught: ${[...new Set(kitReads)]}`);

    const lines = [...body.matchAll(/^\s*Darren Price:\s*(.+)$/gm)].map(x => x[1].trim());
    assert.equal(lines.length, 2, `expected one caught and one not-caught line, got ${lines.length}`);
    const [a, b] = lines;
    assert.ok(a && b && a !== b, 'the caught and not-caught lines must differ and be non-empty');
    for (const l of lines) {
        assert.ok(/#delivery:/.test(l), `line carries no #delivery voicing note: ${l}`);
        const spoken = l.replace(/#.*$/, '');
        assert.ok(!/[{}]/.test(spoken), `the spoken text prints a variable: ${l}`);
    }
    assert.ok(/->\s*bye/.test(body), 'ca05_react does not end on the sticky bye exit');
});

// Live proof found the caught branch never played: a knot bark reads the cached ink engine without a
// conversation, so kit_key_caught stayed at its ink default (false). _showBarkFromKnot now runs the
// conversation-start global sync (syncGlobalVariablesToStory) before goToKnot.
test('knot bark: synced kit_key_caught makes ca05_react take the right branch', async () => {
    globalThis.inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
    const Eng = (await import(pathToFileURL(join(root, 'public/break_escape/js/systems/ink/ink-engine.js')).href)).default;
    const json = readJson('scenarios/_office_kit/ink/darren_price_ambient.json');
    const line = (caught) => {
        const e = new Eng('t'); e.loadStory(json);
        if (caught !== undefined) e.story.variablesState.kit_key_caught = caught;
        e.goToKnot('ca05_react');
        return e.continue().text.trim();
    };
    assert.match(line(true), /clock that lookalike/);
    assert.match(line(false), /catching folk out/);
    assert.match(line(undefined), /catching folk out/); // unsynced: the ink default (the bug)
    const mgr = readFileSync(join(root, 'public/break_escape/js/systems/npc-manager.js'), 'utf8');
    const sync = mgr.indexOf('window.npcConversationStateManager?.syncGlobalVariablesToStory(inkEngine.story)');
    const go = mgr.indexOf('inkEngine.goToKnot(knotName)', sync);
    assert.ok(sync > 0 && go > sync && go - sync < 200, '_showBarkFromKnot must sync globals before goToKnot');
});
