// scripts/validate_npc_habits.rb (docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md, 7.2): NPC
// awareness and habits. One fixture for each error, warning and suggestion, a clean fixture
// that raises none, the guessable password's pieces and sources, the screen state mappings,
// the office life keyword and the habits report. No output line may hold a password or a
// word or number part of one.
// Run with: node test/js/validator-npc-habits.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

// Every secret text a fixture uses: none may appear in any output line.
const SECRETS = ['Rex2019!', 'Rex2019.', 'BiscuitRover2019!', 'Jo1987!', 'Jo7!', 'Summer84!', 'Biscuit', 'Rover', 'Rex',
    '2019', '1987', 'Summer', 'Pw-Secret'];

function run(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      data = JSON.parse(STDIN.read)
      copy, report = BreakEscape::NpcHabits.expanded_copy(data)
      out = {
        habits: ValidateNpcHabits.check(data, expanded: copy, report: report),
        lines: ValidateNpcHabits.report_lines(data, expanded: copy, report: report),
        access: check_access_model(data, nil, nil),
        needs: ValidateNpcNeeds.check(data, screen_habits: npc_screen_habits(copy)),
        needsPlain: ValidateNpcNeeds.check(data)
      }
      puts JSON.generate(out)`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout.trim().split('\n').pop());
    for (const line of [...out.habits, ...out.lines]) {
        for (const secret of SECRETS) {
            assert.ok(!new RegExp(`(?<![A-Za-z0-9])${secret.replace(/[.*+?^${}()|[\]\\!]/g, '\\$&')}(?![A-Za-z0-9])`).test(line),
                `output line holds "${secret}": ${line}`);
        }
    }
    return out;
}
const errors = list => list.filter(s => s.startsWith('❌'));
const warnings = list => list.filter(s => s.startsWith('⚠️'));
const suggestions = list => list.filter(s => s.startsWith('💡'));
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n')}`);
const assertLacks = (list, frag) => assert.ok(!has(list, frag), `did not expect "${frag}" in:\n${list.join('\n')}`);

const needs = { coffee: { decayPerMin: 30, urgentAt: 40 } };
function person(id, extra = {}) {
    return { id, displayName: id, npcType: 'person', needs, creds: { username: id, password: `${id}-Pw-Secret` }, ...extra };
}
const loginPc = (id, extra = {}) => ({ id, type: 'pc', name: id, locked: true, lockType: 'login', sprite: 'pc_desktop', ...extra });
const station = (id, extra = {}) => ({ id, type: 'pc', name: id, workstation: true, sprite: 'pc_desktop', ...extra });
const note = (id, text, extra = {}) => ({ id, type: 'notes', name: id, readable: true, text, ...extra });
function scenario({ npcs = [], objects = [], extra = {} } = {}) {
    return { startRoom: 'office', rooms: { office: { type: 'room_office', connections: {}, objects, npcs } }, ...extra };
}

// ── Clean ─────────────────────────────────────────────────────────────────────

test('a clean fixture raises nothing', () => {
    const out = run(scenario({
        npcs: [person('dana', { needsHome: 'dana_pc', role: 'front_desk' }),
            person('ian', { needsHome: 'ian_pc', awareness: 'high' })],
        objects: [loginPc('dana_pc'), loginPc('ian_pc')],
        extra: { roles: { front_desk: { awareness: 'low' } } }
    }));
    assert.deepEqual(out.habits, []);
    assertHas(out.lines, 'dana: level low (level from role front_desk)');
    assertHas(out.lines, 'locksScreen never (preset)');
    assertHas(out.lines, 'screenHabit lockChance 0, read at dana_pc');
    assertHas(out.lines, 'screenHabit lockChance 1, read at ian_pc');
});

test('a scenario with no awareness, habits or roles has no report', () => {
    const out = run(scenario({ npcs: [person('dana', { needsHome: 'dana_pc' })], objects: [loginPc('dana_pc')] }));
    assert.deepEqual(out.habits, []);
    assert.deepEqual(out.lines, []);
});

// ── Errors ────────────────────────────────────────────────────────────────────

test('awareness or habits on an NPC record that is not a room NPC', () => {
    const out = run({ ...scenario(), phoneNPCs: [{ id: 'ruth', npcType: 'phone', awareness: 'low', habits: { writesDown: true } }] });
    assertHas(errors(out.habits), "'phoneNPCs[0]' has 'awareness'");
    assertHas(errors(out.habits), "'phoneNPCs[0]' has 'habits'");
});

test('an unknown level, habit or value, and a roles level', () => {
    const out = run(scenario({
        npcs: [person('dana', { awareness: 'paranoid', habits: { phishable: true, locksScreen: 'often', holdsDoors: 'no' } })],
        extra: { roles: { staff: { awareness: 'max' } } }
    }));
    const e = errors(out.habits);
    assertHas(e, "awareness 'paranoid'");
    assertHas(e, "unknown habit 'phishable'");
    assertHas(e, "habit 'holdsDoors' has value \"no\"");
    assertLacks(e, "unknown habit 'holdsDoors'");
    assertHas(e, "habit 'locksScreen' has value \"often\"");
    assertHas(e, "roles.staff.awareness 'max'");
});

test('passwordPattern naming no object', () => {
    const out = run(scenario({ npcs: [person('mei', { habits: { password: 'guessable', passwordPattern: 'no_memo' } })] }));
    assertHas(errors(out.habits), "habits.passwordPattern 'no_memo' names no object");
});

// ── locksScreen ───────────────────────────────────────────────────────────────

test('locksScreen by name that does nothing: no workstation, every PC sets a field, an authored screenHabit', () => {
    let out = run(scenario({ npcs: [person('dana', { habits: { locksScreen: 'never' } })] }));
    assertHas(warnings(out.habits), 'owns no workstation');
    assertHas(out.lines, 'no effect: owns no workstation');

    out = run(scenario({ npcs: [person('dana', { needsHome: 'dana_pc', habits: { locksScreen: 'never' } })],
        objects: [loginPc('dana_pc', { lockChance: 1 })] }));
    assertHas(warnings(out.habits), 'sets lockChance or locksScreenOnLeave, which wins');
    assertHas(out.lines, 'dana_pc: the PC sets lockChance, habit not applied there');

    out = run(scenario({ npcs: [person('dana', { needsHome: 'dana_pc', habits: { locksScreen: 'never' }, screenHabit: { lockChance: 1 } })],
        objects: [loginPc('dana_pc')] }));
    assertHas(warnings(out.habits), 'the authored screenHabit wins');
    assertHas(out.lines, 'habit not applied: the NPC sets screenHabit');
});

test('a preset that does nothing draws no warning', () => {
    const out = run(scenario({ npcs: [person('dana', { awareness: 'low' })] }));
    assert.deepEqual(out.habits, []);
});

test('sometimes by name on a sign-in PC: exactly one warning, and nothing from the first slice roll warning', () => {
    const out = run(scenario({ npcs: [person('lena', { needsHome: 'lena_pc', habits: { locksScreen: 'sometimes' } })],
        objects: [loginPc('lena_pc')] }));
    assert.equal(warnings(out.habits).length, 1, out.habits.join('\n'));
    assertHas(warnings(out.habits), "locksScreen 'sometimes' by name");
    assertHas(warnings(out.habits), 'lena_pc');
    assertLacks(out.access, 'seeded roll');
});

test('a preset sometimes (medium) on a sign-in PC: one suggestion and no warning', () => {
    const out = run(scenario({ npcs: [person('lena', { needsHome: 'lena_pc', awareness: 'medium' })], objects: [loginPc('lena_pc')] }));
    assert.equal(warnings(out.habits).length, 0, out.habits.join('\n'));
    assert.equal(suggestions(out.habits).length, 1, out.habits.join('\n'));
    assertHas(suggestions(out.habits), 'medium preset');
});

test('an authored lockChance 0.5 draws the first slice warning only', () => {
    const out = run(scenario({ npcs: [person('lena', { needsHome: 'lena_pc' })], objects: [loginPc('lena_pc', { lockChance: 0.5 })] }));
    assertHas(warnings(out.access), 'lockChance 0.5');
    assert.deepEqual(out.habits, []);
});

test('a workstation with a locksScreen habit and no locked art draws the sprite suggestion', () => {
    const out = run(scenario({ npcs: [person('dana', { needsHome: 'dana_pc', awareness: 'high' })],
        objects: [loginPc('dana_pc', { sprite: 'pc8' })] }));
    assertHas(suggestions(out.habits), 'the lock will sound but not show');
});

// ── Screen state mappings ─────────────────────────────────────────────────────

function mapped(level, pattern, condition, { pcExtra = {}, policy = null, habit = null } = {}) {
    const owner = person('ann', { needsHome: 'ws', eventMappings: [{ eventPattern: pattern, ...(condition ? { condition } : {}), setGlobal: { x: true } }] });
    if (level) owner.habits = { locksScreen: level };
    if (habit) owner.screenHabit = habit;
    const pc = station('ws', pcExtra);
    const extra = {};
    if (policy) { extra.policies = { p: policy }; pc.policy = 'p'; }
    return run(scenario({ npcs: [owner], objects: [pc], extra }));
}
const never = 'never fires';
const some = 'fires on some leaves only';

test('a policy autoLockMin 0 with a never owner and a locked_attempt mapping draws nothing; autoLockMin 5 too', () => {
    assert.deepEqual(warnings(mapped('never', 'workstation_locked_attempt:ws', null, { policy: { autoLockMin: 0 } }).habits), []);
    assert.deepEqual(warnings(mapped('never', 'workstation_locked_attempt:ws', null, { policy: { autoLockMin: 5 } }).habits), []);
});

test('a wasLocked === true mapping: warned at sometimes and never, nothing at always; a bare data.wasLocked alike', () => {
    for (const cond of ['data.wasLocked === true', 'data.wasLocked']) {
        assertHas(warnings(mapped('sometimes', 'workstation_owner_returned:ws', cond).habits), some);
        assertHas(warnings(mapped('never', 'workstation_owner_returned:ws', cond).habits), never);
        assert.deepEqual(warnings(mapped('always', 'workstation_owner_returned:ws', cond).habits), [], cond);
    }
});

test('a wasLocked === false and a workstation_accessed mapping: warned at always and sometimes, not at never', () => {
    for (const [pattern, cond] of [['workstation_owner_returned:ws', 'data.wasLocked === false'],
        ['workstation_owner_returned:ws', '!data.wasLocked'], ['workstation_accessed:ws', null]]) {
        assertHas(warnings(mapped('always', pattern, cond).habits), never);
        assertHas(warnings(mapped('sometimes', pattern, cond).habits), some);
        assert.deepEqual(warnings(mapped('never', pattern, cond).habits), [], `${pattern} ${cond}`);
        assertHas(warnings(mapped('never', pattern, cond, { policy: { autoLockMin: 0 } }).habits), never);
    }
});

test('mappings that need neither state draw nothing', () => {
    assert.deepEqual(warnings(mapped('never', 'workstation_owner_returned:ws', "data.objectId === 'ws'").habits), []);
    assert.deepEqual(warnings(mapped('never', 'workstation_owner_returned', "data.objectId === 'ws' && data.wasLocked").habits), []);
    assert.deepEqual(warnings(mapped('never', 'global_variable_changed:x', null).habits), []);
});

test('no habit: an authored screenHabit decides, and autoLockSeconds silences both', () => {
    assertHas(warnings(mapped(null, 'workstation_owner_returned:ws', 'data.wasLocked === true', { habit: { lockIfAwayOverSeconds: 20 } }).habits), some);
    assertHas(warnings(mapped(null, 'workstation_owner_returned:ws', 'data.wasLocked === true', { habit: { lockChance: 0 } }).habits), never);
    for (const habit of [{ lockIfAwayOverSeconds: 20 }, { lockChance: 0 }]) {
        assert.deepEqual(warnings(mapped(null, 'workstation_owner_returned:ws', 'data.wasLocked === true',
            { habit, pcExtra: { autoLockSeconds: 30 } }).habits), []);
    }
});

test('workstation_screen_changed: never fires at never, nothing at always; how auto needs a late lock', () => {
    assertHas(warnings(mapped('never', 'workstation_screen_changed:ws', null).habits), never);
    assert.deepEqual(warnings(mapped('always', 'workstation_screen_changed:ws', null).habits), []);
    assertHas(warnings(mapped('always', 'workstation_screen_changed:ws', "data.how === 'auto'").habits), never);
    assert.deepEqual(warnings(mapped('always', 'workstation_screen_changed:ws', "data.how === 'auto'",
        { pcExtra: { autoLockSeconds: 30 } }).habits), []);
});

// ── The office life keyword ───────────────────────────────────────────────────

test('the office life autoLockSeconds check sees the filled habit; called without the keyword it is unchanged', () => {
    const msg = 'autoLockSeconds never applies';
    const low = run(scenario({ npcs: [person('ann', { needsHome: 'ws', awareness: 'low' })], objects: [station('ws', { autoLockSeconds: 30 })] }));
    assertLacks(low.needs, msg);
    assertHas(low.needsPlain, msg);
    const none = run(scenario({ npcs: [person('ann', { needsHome: 'ws' })], objects: [station('ws', { autoLockSeconds: 30 })] }));
    assertHas(none.needs, msg);
    assert.deepEqual(none.needs, none.needsPlain);
});

// ── Ids ───────────────────────────────────────────────────────────────────────

test('an owned workstation with no authored id draws the id warning and is listed with its fill', () => {
    const out = run(scenario({
        npcs: [person('ann', { awareness: 'low' }), person('bob', { needsHome: 'office_pc_1', awareness: 'high' })],
        objects: [{ type: 'pc', name: 'Ann PC', workstation: true, sprite: 'pc_desktop', screenOwner: 'ann' },
            { type: 'pc', name: 'Bob PC', workstation: true, sprite: 'pc_desktop' }]
    }));
    assertHas(warnings(out.habits), "give the object the id 'office_pc_0'");
    assertHas(warnings(out.habits), "give the object the id 'office_pc_1'");
    assertHas(out.lines, 'screenHabit lockChance 0, read at office_pc_0');
    assertHas(out.lines, 'screenHabit lockChance 1, read at office_pc_1');
});

// ── writesDown ────────────────────────────────────────────────────────────────

test('writesDown: no account, no sign-in PC, every PC authors its own note', () => {
    let out = run(scenario({ npcs: [{ id: 'len', npcType: 'person', habits: { writesDown: true } }] }));
    assertHas(warnings(out.habits), 'writesDown but no account');
    out = run(scenario({ npcs: [person('omar', { needsHome: 'ws', habits: { writesDown: true } })], objects: [station('ws')] }));
    assertHas(warnings(out.habits), 'owns no sign-in PC');
    out = run(scenario({ npcs: [person('omar', { needsHome: 'omar_pc', habits: { writesDown: true } })],
        objects: [loginPc('omar_pc', { postitNote: 'Printer 4410' }), loginPc('omar_pc2', { screenOwner: 'omar', showPostit: false })] }));
    assertHas(warnings(out.habits), 'authors its own postitNote or sets showPostit: false');
});

test('writesDown: the report names the note and a chain that stops', () => {
    const out = run(scenario({
        npcs: [person('omar', { needsHome: 'omar_pc', habits: { writesDown: true } })],
        objects: [loginPc('omar_pc', { access: { people: ['omar'] } })]
    }));
    assert.deepEqual(out.habits, []);
    assertHas(out.lines, 'writesDown true (by name)');
    assertHas(out.lines, 'sticky note at omar_pc');
    assertHas(out.lines, 'opens only its own PC');
});

// ── password ──────────────────────────────────────────────────────────────────

function mei(password, habits, objects, extra = {}) {
    const npc = person('mei', { needsHome: 'mei_pc', habits });
    npc.creds.password = password;
    return run(scenario({ npcs: [npc], objects: [loginPc('mei_pc'), ...objects], extra }));
}
const MEMO = note('password_memo', 'IT notice: your pet name with a capital first letter, then the year, end with !');
const photo = (caption = 'Rex on the beach') => note('photo', caption);
const calendar = (text = 'Calendar: May 2019') => note('calendar', text);
const guessable = { password: 'guessable', passwordPattern: 'password_memo' };
const notBacked = 'is not backed';

test('password with no account, and passwordPattern without guessable', () => {
    let out = run(scenario({ npcs: [{ id: 'len', npcType: 'person', habits: { password: 'strong' } }] }));
    assertHas(warnings(out.habits), "password 'strong' but no account");
    out = mei('Rex2019!', { password: 'strong', passwordPattern: 'password_memo' }, [MEMO]);
    assertHas(warnings(out.habits), 'passwordPattern without password: "guessable"');
});

test('guessable: one word part of three sourced is not backed, the others named by position and kind', () => {
    const out = mei('Rex2019!', guessable, [photo(), note('calendar', 'Calendar: May'), note('password_memo', 'Pet name, capital first letter.')]);
    assertHas(warnings(out.habits), notBacked);
    assertHas(out.lines, 'piece 1 of 3, word: photo');
    assertHas(out.lines, 'piece 2 of 3, number: no source');
    assertHas(out.lines, 'piece 3 of 3, symbol: no source');
});

test('guessable: Rex2019! with nothing that holds the word Rex is not backed', () => {
    const out = mei('Rex2019!', guessable, [photo('A dog on the beach'), calendar(), MEMO]);
    assertHas(warnings(out.habits), notBacked);
    assertHas(out.lines, 'piece 1 of 3, word: no source');
});

test('guessable: Rex2019! with a photo captioned Rex and a calendar with 2019 is backed', () => {
    const out = mei('Rex2019!', guessable, [photo(), calendar(), MEMO]);
    assert.deepEqual(warnings(out.habits), []);
    assertHas(out.lines, 'backed');
    assertHas(out.lines, 'piece 1 of 3, word: photo');
    assertHas(out.lines, 'piece 2 of 3, number: calendar');
    assertHas(out.lines, 'piece 3 of 3, symbol: in the pattern clue');
    assertHas(out.lines, 'pattern clue at password_memo');
    assertHas(out.lines, 'the pattern clue must cover: 1 capital, 1 symbol, 3 pieces in order');
    assertLacks(out.lines, 'passwordPattern');
});

test('guessable: BiscuitRover2019! with each word in a readable text is backed, counting 2 capitals and 4 pieces', () => {
    const out = mei('BiscuitRover2019!', guessable,
        [note('dog_photo', 'Biscuit asleep'), note('cat_photo', 'Rover the cat'), calendar(),
            note('password_memo', 'Both pets, each with a capital, then the year, end with !')]);
    assert.deepEqual(warnings(out.habits), []);
    assertHas(out.lines, 'the pattern clue must cover: 2 capitals, 1 symbol, 4 pieces in order');
});

test('guessable: a fixed piece only counts in the clue, with its case', () => {
    const jo = (memo) => mei('Jo1987!', guessable, [calendar('Calendar 1987'), note('password_memo', memo)],
        {});
    let out = run(scenario({
        npcs: [Object.assign(person('mei', { needsHome: 'mei_pc', habits: guessable }), { creds: { username: 'mei', password: 'Jo1987!' } }),
            { id: 'jo', displayName: 'Jo Marsh', npcType: 'person' }],
        objects: [loginPc('mei_pc'), calendar('Calendar 1987'), note('password_memo', 'Year then a !'), note('sign', 'Jo was here')]
    }));
    assertHas(warnings(out.habits), notBacked);
    assertHas(out.lines, 'piece 1 of 3, fixed: no source');
    out = jo('starts with jo, then the year, end with !');
    assertHas(warnings(out.habits), notBacked);
    out = jo('starts with Jo, then the year, end with !');
    assert.deepEqual(warnings(out.habits), []);
});

test('guessable: no passwordPattern, a clue without the symbol, a clue with it', () => {
    let out = mei('Rex2019!', { password: 'guessable' }, [photo(), calendar()]);
    assertHas(warnings(out.habits), 'no pattern clue');
    out = mei('Rex2019!', guessable, [photo(), calendar(), note('password_memo', 'Pet name with a capital, then the year')]);
    assertHas(warnings(out.habits), notBacked);
    out = mei('Rex2019!', guessable, [photo(), calendar(), MEMO]);
    assert.deepEqual(warnings(out.habits), []);
});

test('guessable: a password ending in . with a clue holding . only at a sentence end is backed and marked', () => {
    const out = mei('Rex2019.', guessable, [photo(), calendar(), note('password_memo', 'Pet name with a capital, then the year.')]);
    assert.deepEqual(warnings(out.habits), []);
    assertHas(out.lines, 'common punctuation: check the clue states it');
});

test('guessable: digits unsourced, a word only in the own profile, a word behind a locked container, only fixed pieces', () => {
    let out = mei('Summer84!', guessable, [note('poster', 'Summer party'), note('password_memo', 'A season, two digits, end with !')]);
    assertHas(warnings(out.habits), notBacked);

    out = mei('Rex2019!', guessable, [calendar(), MEMO], {
        accountProfiles: { mei_files: { for: { people: ['mei'] }, contents: [note('pet_file', 'Rex')] } }
    });
    assertHas(warnings(out.habits), notBacked);
    assertHas(out.lines, 'piece 1 of 3, word: no source');

    out = mei('Rex2019!', guessable, [{ id: 'drawer', type: 'safe', name: 'Drawer', locked: true, lockType: 'key', requires: 'k1', contents: [photo()] },
        calendar(), MEMO]);
    assert.deepEqual(warnings(out.habits), []);
    assertHas(out.lines, 'piece 1 of 3, word: photo (behind lock drawer)');

    out = mei('Jo7!', guessable, [note('password_memo', 'Jo then 7 then !')]);
    assertHas(warnings(out.habits), 'no word or number part has a source outside the pattern clue');
});

test('guessable: only PCs under a policy with maxAttempts', () => {
    const out = mei('Rex2019!', guessable, [photo(), calendar(), MEMO], { policies: { strict: { maxAttempts: 3 } }, defaultPolicy: 'strict' });
    assertHas(warnings(out.habits), 'only at PCs under a policy with maxAttempts');
});

test('reused: no other secret equals it; a lock and another account', () => {
    let out = mei('Rex2019!', { password: 'reused' }, []);
    assertHas(warnings(out.habits), 'no other secret in the scenario equals it');

    out = run(scenario({
        npcs: [Object.assign(person('tom', { needsHome: 'tom_pc', habits: { password: 'reused' } }), { creds: { username: 'tom', password: 'Rex2019!' } }),
            Object.assign(person('sam'), { creds: { username: 'sam', password: 'Rex2019!' } })],
        objects: [loginPc('tom_pc'), { id: 'tom_locker', type: 'safe', name: 'Locker', locked: true, lockType: 'password', requires: 'Rex2019!' },
            note('locker_note', 'Locker: Rex2019!')]
    }));
    assert.deepEqual(warnings(out.habits), []);
    assertHas(out.lines, 'same password as tom_locker');
    assertHas(out.lines, 'shared with sam');
    assertHas(out.lines, 'written in full at locker_note');
});

test('strong: one word part sourced draws nothing; every part sourced, or reused, draws the warning', () => {
    let out = mei('Rex2019!', { password: 'strong' }, [photo()]);
    assert.deepEqual(warnings(out.habits), []);
    out = mei('Rex2019!', { password: 'strong' }, [photo(), calendar()]);
    assertHas(warnings(out.habits), 'every word and number part of it can be read');
    out = mei('Rex2019!', { password: 'strong' }, [{ id: 'safe', type: 'safe', name: 'Safe', locked: true, lockType: 'password', requires: 'Rex2019!' }]);
    assertHas(warnings(out.habits), 'another secret in the scenario equals it');
});

test('the report: preset and by name, the level from a role, pattern clue line and no passwordPattern habit line', () => {
    const npc = person('mei', { needsHome: 'mei_pc', role: 'finance', habits: guessable });
    npc.creds.password = 'Rex2019!';
    const out = run(scenario({ npcs: [npc], objects: [loginPc('mei_pc'), photo(), calendar(), MEMO],
        extra: { roles: { finance: { awareness: 'high' } } } }));
    assertHas(out.lines, 'mei: level high (level from role finance)');
    assertHas(out.lines, 'locksScreen always (preset)');
    assertHas(out.lines, 'password guessable (by name)');
    assertHas(out.lines, 'pattern clue at password_memo');
    assert.ok(!out.lines.some(l => /^\s*- passwordPattern/.test(l)), out.lines.join('\n'));
});

// ── holdsDoors (step 5) ───────────────────────────────────────────────────────

// A hall with a north gate into store_a and a south gate into store_b.
function gateScenario({ npcs, gateA = { openFor: ['gary'] }, gateB = { openFor: ['sara'] } }) {
    return {
        startRoom: 'hall',
        rooms: {
            hall: {
                type: 'room_office', connections: { north: 'store_a', south: 'store_b' }, npcs,
                doors: [{ connectedRoom: 'store_a', direction: 'north', gate: gateA },
                    { connectedRoom: 'store_b', direction: 'south', gate: gateB }]
            },
            store_a: { type: 'room_office', connections: { south: 'hall' }, locked: true },
            store_b: { type: 'room_office', connections: { north: 'hall' }, locked: true }
        }
    };
}
const guard = (id, extra = {}) => ({ id, displayName: id, npcType: 'person', ...extra });

test('holdsDoors from presets: no warning, and the report names the gates', () => {
    const out = run(gateScenario({ npcs: [guard('gary', { awareness: 'low' }), guard('sara', { awareness: 'high' })] }));
    assert.deepEqual(out.habits, []);
    assertHas(out.lines, 'holdsDoors false (preset)');
    assertHas(out.lines, 'gate.noHold at rooms/hall/doors/1 (into store_b)');
    assertHas(out.lines, 'holdsDoors true (preset)');
    assertHas(out.lines, 'holds the gate at rooms/hall/doors/0 (into store_a)');
});

test('holdsDoors false by name on an NPC no gate opens for', () => {
    const out = run(gateScenario({ npcs: [guard('una', { habits: { holdsDoors: false } })] }));
    assertHas(warnings(out.habits), "NPC 'una' has holdsDoors false but no gate opens for it");
    assertHas(out.lines, 'no effect: no gate opens for it');
    // A preset that does nothing draws no warning
    const quiet = run(gateScenario({ npcs: [guard('una', { awareness: 'high' })] }));
    assert.deepEqual(quiet.habits, []);
});

test('holdsDoors false by name whose every gate has playerMayPassIf or an authored noHold', () => {
    const out = run(gateScenario({
        npcs: [guard('sara', { habits: { holdsDoors: false } })],
        gateA: { openFor: ['sara'], playerMayPassIf: 'disguised' },
        gateB: { openFor: ['sara'], noHold: [] }
    }));
    assertHas(warnings(out.habits), "NPC 'sara' has holdsDoors false but every gate that opens for it (rooms/hall/doors/0, rooms/hall/doors/1)");
    assertHas(out.lines, 'rooms/hall/doors/0 (into store_a): the gate sets playerMayPassIf, habit not applied there');
    assertHas(out.lines, 'rooms/hall/doors/1 (into store_b): the gate sets noHold, habit not applied there');
    // One gate where it applies: no warning
    const one = run(gateScenario({
        npcs: [guard('sara', { habits: { holdsDoors: false } })],
        gateA: { openFor: ['sara'], playerMayPassIf: 'disguised' },
        gateB: { openFor: 'sara' }
    }));
    assertLacks(warnings(one.habits), 'holdsDoors false');
});

test('an authored gate.noHold naming an id not in its openFor', () => {
    const out = run(gateScenario({ npcs: [guard('sara')], gateB: { openFor: ['sara'], noHold: ['sara', 'len'] } }));
    assertHas(warnings(out.habits), "rooms/hall/doors/1 gate.noHold names 'len', who is not in its openFor");
    assertLacks(warnings(out.habits), "names 'sara'");
});

function schemaErrors(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(validate_json(JSON.parse(STDIN.read), ${JSON.stringify(join(root, 'scripts/scenario-schema.json'))}))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

test('the schema takes habits.holdsDoors (a boolean) and gate.noHold (a list of ids)', () => {
    const ok = gateScenario({ npcs: [guard('sara', { habits: { holdsDoors: false } })], gateB: { openFor: ['sara'], noHold: ['sara'] } });
    assert.deepEqual(schemaErrors(ok).filter(e => /holdsDoors|noHold/.test(e)), []);
    const bad = gateScenario({ npcs: [guard('sara', { habits: { holdsDoors: 'no' } })], gateB: { openFor: ['sara'], noHold: 'sara' } });
    const errs = schemaErrors(bad);
    assert.ok(errs.some(e => e.includes('holdsDoors')), errs.join('\n'));
    assert.ok(errs.some(e => e.includes('noHold')), errs.join('\n'));
});
