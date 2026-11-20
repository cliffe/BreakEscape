// scripts/validate_wearable.rb check_wearables (docs/achitechture/WEARABLE_BUILD_LOG.md): the
// wearable shape, no other writer of a worn global (actions, mappings, ink), no shared global,
// costume actions beside wearables, and wear / take_off targets. A clean fixture and one per rule.
// Run with: node test/js/validator-wearable.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function issues(scenario, scenarioDir = null) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_wearable.rb'))}
      puts JSON.generate(check_wearables(JSON.parse(STDIN.read), ${scenarioDir ? JSON.stringify(scenarioDir) : 'nil'}))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const errors = list => list.filter(s => s.startsWith('❌'));
const warnings = list => list.filter(s => s.startsWith('⚠️'));
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n')}`);

function clean() {
    return {
        startRoom: 'office',
        disguises: { courier: { sprite: 'courier_hivis' } },
        globalVariables: { vest_on: false },
        rooms: {
            office: {
                type: 'room_office',
                objects: [
                    { id: 'hook', type: 'hook', name: 'Hook', triggerOnInteract: [
                        { type: 'give_item', item: { id: 'vest', type: 'hivis', name: 'Vest',
                            wearable: { costume: 'courier', global: 'vest_on', unseenOnly: true, seenBy: { ignore: ['ruth'] },
                                confirmOn: 'On?', onWear: [{ type: 'hint', message: 'on' }] } } },
                        { type: 'confirm_action', text: 'Wear it?', onConfirm: [{ type: 'wear', itemId: 'vest' }] }
                    ] },
                    { id: 'locker', type: 'locker', name: 'Locker', triggerOnInteract: [{ type: 'take_off', itemId: 'vest' }] }
                ],
                npcs: [{ id: 'ruth', npcType: 'person',
                         eventMappings: [{ eventPattern: 'room_entered:office', condition: 'globalVars.vest_on === true', setGlobal: { seen: true } }] }]
            }
        }
    };
}

test('a clean scenario has no wearable issues', { skip }, () => {
    assert.deepEqual(issues(clean()), []);
});

test('a scenario with no wearables is left alone', { skip }, () => {
    assert.deepEqual(issues({ rooms: { a: { objects: [{ id: 'x', triggerOnInteract: [{ type: 'set_costume', costume: 'a' }] }] } } }), []);
});

test('the shape: costume, global, id, seenBy, unseenOnly', { skip }, () => {
    const s = clean();
    const w = s.rooms.office.objects[0].triggerOnInteract[0].item;
    w.wearable.costume = 'doctor';
    w.wearable.seenBy = { ignore: ['ghost'] };
    w.wearable.extra = 1;
    let list = issues(s);
    assertHas(errors(list), "costume 'doctor' is not a key");
    assertHas(errors(list), "names 'ghost', which is no room NPC");
    assertHas(warnings(list), 'unrecognised key(s): extra');
    const t = clean();
    delete t.globalVariables.vest_on;
    delete t.rooms.office.objects[0].triggerOnInteract[0].item.id;
    t.rooms.office.objects[0].triggerOnInteract[0].item.wearable.unseenOnly = 'yes';
    list = issues(t);
    assertHas(errors(list), "global 'vest_on' is not declared");
    assertHas(errors(list), 'a wearable item needs an id');
    assertHas(errors(list), 'unseenOnly must be true or false');
    const u = clean();
    u.rooms.office.objects[0].triggerOnInteract[0].item.wearable = { costume: 'courier' };
    assertHas(errors(issues(u)), "needs a non-empty 'costume' and 'global'");
});

test('no other writer of the worn global: set_global, setGlobal, ink assignment and tag', { skip }, () => {
    const s = clean();
    s.rooms.office.objects[1].triggerOnInteract.push({ type: 'set_global', key: 'vest_on', value: false });
    s.rooms.office.npcs[0].eventMappings.push({ eventPattern: 'x', setGlobal: { vest_on: true } });
    const dir = mkdtempSync(join(tmpdir(), 'wear-ink-'));
    mkdirSync(join(dir, 'ink'));
    writeFileSync(join(dir, 'ink', 'ruth.ink'), 'VAR vest_on = false\n{ vest_on: worn }\n~ vest_on = true\n~ other = 1\n{ vest_on == true }\nFine. # set_global:vest_on:true\nOk # set_global:other:1\nRight. # set_variable:vest_on=true\nSure # set_variable:vest_on_later=true\nGo # set_variable:vest_on\n');
    const list = errors(issues(s, dir));
    assertHas(list, "triggerOnInteract[1] writes 'vest_on'");
    assertHas(list, "setGlobal writes 'vest_on'");
    assertHas(list, "ink ruth.ink:3 writes 'vest_on'");
    // The set_global tag the chat runners act on is a writer too (review R1, m4)
    assertHas(list, "ink ruth.ink:6 writes 'vest_on'");
    // And the set_variable tag, with a value or alone (review R2, m2)
    assertHas(list, "ink ruth.ink:8 writes 'vest_on'");
    assertHas(list, "ink ruth.ink:10 writes 'vest_on'");
    assert.equal(list.filter(m => m.includes('ruth.ink')).length, 4, 'VAR, reads, other globals and a longer name are not writes');
});

test('two wearables may not share a global', { skip }, () => {
    const s = clean();
    s.rooms.office.objects.push({ id: 'coat', type: 'coat', name: 'Coat', takeable: true,
        wearable: { costume: 'courier', global: 'vest_on' } });
    assertHas(errors(issues(s)), "already the worn global of 'vest'");
});

test('costume actions beside a wearable warn; wear and take_off must name a wearable', { skip }, () => {
    const s = clean();
    s.rooms.office.objects[1].triggerOnInteract.push({ type: 'set_costume', costume: 'courier' },
        { type: 'wear', itemId: 'hook' }, { type: 'wear' }, { type: 'take_off', itemId: 'nope' });
    const list = issues(s);
    assertHas(warnings(list), 'set_costume in a scenario with wearable items');
    assertHas(errors(list), "wear names 'hook', which is no wearable item");
    assertHas(errors(list), 'wear needs an itemId');
    assertHas(errors(list), "take_off names 'nope'");
});
