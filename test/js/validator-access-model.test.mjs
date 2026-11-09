// scripts/validate_scenario.rb check_access_model (ACCESS_MODEL_PLAN.md, section 8 step 4):
// roles and sign-in details on NPCs, access lists, profiles, policies and sign-in PCs.
// One fixture per error and warning, and a clean fixture that raises none.
// Run with: node --test test/js/validator-access-model.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

const PASSWORD = 'Biscuit2019';

// repoRoot enables the ink checks (storyPath is resolved against it).
function issues(scenario, repoRoot = null) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_access_model(JSON.parse(STDIN.read), ${repoRoot ? JSON.stringify(repoRoot) : 'nil'}, nil))`;
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

// Jake (finance, an account, owns jake_pc), Dana (it, an account), Len (a card only).
// finance_office: a role-list rfid door. A staff profile, one policy.
function clean() {
    return {
        startRoom: 'lobby',
        policies: { lax: { autoLockMin: null, maxAttempts: null } },
        defaultPolicy: 'lax',
        accountProfiles: {
            staff_desktop: { for: { roles: ['staff'] }, contents: [{ id: 'staff_handbook', type: 'text_file', name: 'Handbook', text: 'x' }] },
            jake_files: { for: { people: ['jake'] }, contents: [{ id: 'jake_budget', type: 'text_file', name: 'Budget', text: 'y' }] }
        },
        rooms: {
            lobby: {
                type: 'room_office', connections: { north: 'finance_office' },
                objects: [
                    { id: 'jake_pc', type: 'pc', name: "Jake's PC", locked: true, lockType: 'login', access: { roles: ['staff'] }, lockChance: 0 },
                    { id: 'hot_desk', type: 'pc', name: 'Hot desk', locked: true, lockType: 'login' },
                    { id: 'jake_badge_copy', type: 'keycard', name: 'Badge', card_id: '4F00A1C2', identity: 'jake' }
                ],
                npcs: [
                    {
                        id: 'jake', displayName: 'Jake Brooks', npcType: 'person', role: 'finance', needsHome: 'jake_pc',
                        needs: { thirst: { decayPerMin: 10, urgentAt: 40 } },
                        creds: { username: 'jbrooks', password: PASSWORD, card: { name: "Jake's badge", card_id: '4F00A1C2', rfid_protocol: 'EM4100' } }
                    },
                    { id: 'dana', displayName: 'Dana Smith', npcType: 'person', role: ['it'], creds: { username: 'dsmith', password: 'Tulip!88' } },
                    { id: 'len', displayName: 'Len', npcType: 'person', rfidCard: { name: "Len's card", card_id: 'LEN-01', rfid_protocol: 'EM4100' } }
                ]
            },
            finance_office: {
                type: 'room_office', connections: { south: 'lobby' },
                locked: true, lockType: 'rfid', access: { roles: ['finance'] }
            }
        }
    };
}
const lobby = sc => sc.rooms.lobby;
const npc = (sc, id) => lobby(sc).npcs.find(n => n.id === id);
const obj = (sc, id) => lobby(sc).objects.find(o => o.id === id);

test('the clean fixture raises no error or warning', { skip }, () => {
    const out = issues(clean());
    assert.deepEqual(errors(out).concat(warnings(out)), []);
});

test('identity reach lists the doors and PCs each card and account opens', { skip }, () => {
    const out = issues(clean());
    assertHas(out, "ℹ️ Identity reach: card '4F00A1C2' (jake) opens door 'finance_office'");
    assertHas(out, "ℹ️ Identity reach: card 'LEN-01' (len) opens nothing");
    assertHas(out, "ℹ️ Identity reach: account 'jbrooks' (jake) signs in at 'jake_pc', 'hot_desk'");
    assertHas(out, "ℹ️ Identity reach: account 'dsmith' (dana) signs in at 'jake_pc', 'hot_desk'");
});

test('a scenario without access model fields gets no reach lines', { skip }, () => {
    const out = issues({ rooms: { hall: { type: 'room_office', npcs: [{ id: 'g', rfidCard: { card_id: 'G1' } }], objects: [] } } });
    assert.deepEqual(out, []);
});

// ---- errors ----

test('unresolved person, policy and card references are errors', { skip }, () => {
    const sc = clean();
    sc.rooms.finance_office.access.people = ['ghost'];
    sc.accountProfiles.jake_files.for.people = ['nobody'];
    obj(sc, 'jake_pc').policy = 'strict';
    sc.defaultPolicy = 'missing';
    sc.rooms.finance_office.requires = ['NO-SUCH-CARD'];
    const out = errors(issues(sc));
    assertHas(out, "'rooms/finance_office' names unknown person 'ghost'");
    assertHas(out, "'accountProfiles/jake_files/for' names unknown person 'nobody'");
    assertHas(out, "policy 'strict' names no entry in 'policies'");
    assertHas(out, "defaultPolicy 'missing' names no entry in 'policies'");
    assertHas(out, "requires card 'NO-SUCH-CARD', which no NPC or keycard carries");
});

test('a screenOwner naming no room NPC is an error on a sign-in PC', { skip }, () => {
    const sc = clean();
    obj(sc, 'hot_desk').screenOwner = 'ghost';
    assertHas(errors(issues(sc)), "sign-in PC 'hot_desk' screenOwner 'ghost' names unknown person");
});

test('a profile item id shared with another profile item or a room object is an error', { skip }, () => {
    const sc = clean();
    sc.accountProfiles.jake_files.contents.push({ id: 'staff_handbook', type: 'text_file', name: 'Dup', text: 'z' });
    sc.accountProfiles.staff_desktop.contents.push({ id: 'jake_pc', type: 'text_file', name: 'Clash', text: 'z' });
    const out = errors(issues(sc));
    assertHas(out, "profile item id 'staff_handbook' is used twice");
    assertHas(out, "profile item id 'jake_pc' at 'accountProfiles/staff_desktop/contents[1]' is also a room object's id");
});

test('role or creds on an NPC record other than a room NPC is an error', { skip }, () => {
    const sc = clean();
    sc.npcs = [{ id: 'top', role: 'finance' }];
    sc.phoneNPCs = [{ id: 'caller', creds: { username: 'c', password: 'p' } }];
    sc.social = { characters: { boss: { channels: { email: 'boss_mail' }, emailRecord: { storyPath: 'scenarios/x/ink/b.json', role: 'it' } } } };
    const out = errors(issues(sc));
    assertHas(out, "'npcs[0]' has 'role'");
    assertHas(out, "'phoneNPCs[0]' has 'creds'");
    assertHas(out, "'social/characters/boss/emailRecord' has 'role'");
});

test('a username with no password, and two accounts with the same username, are errors', { skip }, () => {
    let sc = clean();
    delete npc(sc, 'dana').creds.password;
    assertHas(errors(issues(sc)), "NPC 'dana' has creds.username 'dsmith' but no creds.password");
    sc = clean();
    npc(sc, 'dana').creds.username = '  JBrooks ';
    assertHas(errors(issues(sc)), "accounts 'jake', 'dana' share the username 'jbrooks'");
});

test('a keycard identity naming no NPC carrying its card_id is an error', { skip }, () => {
    const sc = clean();
    obj(sc, 'jake_badge_copy').identity = 'dana';
    assertHas(errors(issues(sc)), "identity 'dana' names no NPC carrying its card_id '4F00A1C2'");
});

test('an account password in a compiled ink file is an error, and the message never quotes it', { skip }, () => {
    const dir = mkdtempSync(join(tmpdir(), 'access-ink-'));
    try {
        mkdirSync(join(dir, 'scenarios/t/ink'), { recursive: true });
        writeFileSync(join(dir, 'scenarios/t/ink/dana.json'), JSON.stringify({ root: [`^It is ${PASSWORD}, I think.`, 'done'] }));
        const sc = clean();
        npc(sc, 'dana').storyPath = 'scenarios/t/ink/dana.json';
        const out = issues(sc, dir);
        assertHas(errors(out), "NPC 'jake' creds.password appears in ink file 'scenarios/t/ink/dana.json'");
        assert.ok(!out.some(s => s.includes(PASSWORD)), 'no message quotes the password');
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test('an account holder with a differing usePayload or any addCapture secret is an error', { skip }, () => {
    const sc = clean();
    const jake = npc(sc, 'jake');
    jake.usePayload = { address: 'jake.b', secret: 'other', host: 'mail' };
    jake.eventMappings = [
        { eventPattern: 'a', addCapture: { address: 'JBROOKS', secret: '4471' } },
        { eventPattern: 'b', addCapture: { address: 'someone' } }
    ];
    sc.social = { captures: { revealSecret: true } };
    const out = errors(issues(sc));
    assertHas(out, "usePayload.address 'jake.b', which differs from creds.username 'jbrooks'");
    assertHas(out, 'has a usePayload.secret that differs from creds.password');
    assertHas(out, "eventMappings[0].addCapture has a 'secret'");
    assert.ok(!has(out, "eventMappings[0].addCapture.address"), 'a case-only difference in the address is fine');
    assertHas(out, "eventMappings[1].addCapture.address 'someone' differs from creds.username 'jbrooks'");
});

test('an rfid lock with neither access nor requires, and access on a gate door, are errors', { skip }, () => {
    let sc = clean();
    lobby(sc).objects.push({ id: 'cabinet', type: 'safe', name: 'Cabinet', locked: true, lockType: 'rfid' });
    assertHas(errors(issues(sc)), "'rooms/lobby/objects[3]' is an rfid lock with neither 'requires' nor 'access'");
    sc = clean();
    lobby(sc).doors = [{ connectedRoom: 'finance_office', direction: 'north', gate: { openFor: ['jake'] } }];
    assertHas(errors(issues(sc)), "'rooms/lobby/doors[0]' is a gate door into 'finance_office' with an 'access' list");
    lobby(sc).doors[0].gate.enabled = false;
    assert.ok(!has(issues(sc), 'is a gate door'), 'a disabled gate is not a gate');
});

test('an NPC unlockable list or an unlock_object flag reward naming a sign-in PC is an error', { skip }, () => {
    const sc = clean();
    npc(sc, 'dana').unlockable = ['jake_pc'];
    lobby(sc).objects.push({ id: 'station', type: 'pc', name: 'Flags', flagRewards: [{ type: 'unlock_object', objectId: 'hot_desk' }] });
    const out = errors(issues(sc));
    assertHas(out, "NPC 'dana' lists sign-in PC 'jake_pc' in 'unlockable'");
    assertHas(out, "an unlock_object flag reward names sign-in PC 'hot_desk'");
});

test('triggerOnInteract on a sign-in PC, and a sign-in PC id with "|", are errors', { skip }, () => {
    const sc = clean();
    obj(sc, 'hot_desk').triggerOnInteract = [{ type: 'set_global', name: 'x', value: true }];
    lobby(sc).objects.push({ id: 'odd|pc', type: 'pc', name: 'Odd', locked: true, lockType: 'login' });
    const out = errors(issues(sc));
    assertHas(out, "sign-in PC 'hot_desk' has triggerOnInteract");
    assertHas(out, "sign-in PC 'odd|pc' id contains '|'");
});

// ---- warnings ----

test('an access role no NPC holds is a warning, as is a profile that admits nobody', { skip }, () => {
    const sc = clean();
    sc.rooms.finance_office.access.roles.push('auditor');
    sc.accountProfiles.empty = { contents: [] };
    const out = warnings(issues(sc));
    assertHas(out, "'rooms/finance_office' admits role 'auditor', which no NPC holds");
    assertHas(out, "profile 'accountProfiles/empty' has no 'for' roles or people");
    assert.deepEqual(errors(issues(sc)), []);
});

test('an account whose needsHome sign-in PC does not admit it is a warning', { skip }, () => {
    const sc = clean();
    obj(sc, 'jake_pc').access = { roles: ['it'] };
    assertHas(warnings(issues(sc)), "account 'jake' has needsHome 'jake_pc', a sign-in PC whose access list does not admit it");
});

test('an owned sign-in PC with lockChance between 0 and 1 is a warning; 0 and 1 are not', { skip }, () => {
    const sc = clean();
    obj(sc, 'jake_pc').lockChance = 0.5;
    assertHas(warnings(issues(sc)), "sign-in PC 'jake_pc' has lockChance 0.5");
    obj(sc, 'jake_pc').lockChance = 1;
    assert.ok(!has(issues(sc), 'has lockChance'));
});

test('an owned sign-in PC whose owner has no valid needs or interests is a warning', { skip }, () => {
    const sc = clean();
    npc(sc, 'jake').needs = { thirst: { decayPerMin: 0, urgentAt: 40 } };
    assertHas(warnings(issues(sc)), "sign-in PC 'jake_pc' is owned by 'jake', who has no valid needs or interests entry");
    delete npc(sc, 'jake').needs;
    npc(sc, 'jake').interests = { post: { weight: 2 } };
    assert.ok(!has(issues(sc), 'no valid needs or interests'), 'an interest counts');
});

test('an owner placed in a different room from its workstation is a warning', { skip }, () => {
    const sc = clean();
    const jake = npc(sc, 'jake');
    lobby(sc).npcs = lobby(sc).npcs.filter(n => n.id !== 'jake');
    sc.rooms.finance_office.npcs = [jake];
    // a plain workstation owned through screenOwner counts too
    sc.rooms.finance_office.objects = [{ id: 'dana_ws', type: 'pc', name: 'Dana desk', workstation: true, screenOwner: 'dana' }];
    const out = warnings(issues(sc));
    assertHas(out, "NPC 'jake' owns workstation 'jake_pc' in room 'lobby' but is placed in room 'finance_office'");
    assertHas(out, "NPC 'dana' owns workstation 'dana_ws' in room 'finance_office' but is placed in room 'lobby'");
});

test('a sign-in PC under a policy with maxAttempts is a warning', { skip }, () => {
    const sc = clean();
    sc.policies.corp = { maxAttempts: 5 };
    obj(sc, 'hot_desk').policy = 'corp';
    const out = warnings(issues(sc));
    assertHas(out, "sign-in PC 'hot_desk' is under a policy with maxAttempts 5");
    assert.ok(!has(out, "sign-in PC 'jake_pc' is under a policy"), 'the default policy has no limit');
});

test('a capture route on an account holder without revealSecret is a warning', { skip }, () => {
    const sc = clean();
    npc(sc, 'jake').usePayload = { host: 'mail' };
    assertHas(warnings(issues(sc)), "NPC 'jake' has a capture route");
    sc.social = { captures: { revealSecret: true } };
    assert.ok(!has(issues(sc), 'has a capture route'));
});

test("a #clone_keycard tag naming another NPC's card is a warning", { skip }, () => {
    const dir = mkdtempSync(join(tmpdir(), 'access-clone-'));
    try {
        mkdirSync(join(dir, 'scenarios/t/ink'), { recursive: true });
        writeFileSync(join(dir, 'scenarios/t/ink/dana.ink'), '=== start ===\nLet me see that.\n#clone_keycard:4F00A1C2\n-> END\n');
        writeFileSync(join(dir, 'scenarios/t/ink/jake.ink'), '=== start ===\n#clone_keycard:4F00A1C2\nHere.\n-> END\n');
        const sc = clean();
        npc(sc, 'dana').storyPath = 'scenarios/t/ink/dana.json';
        npc(sc, 'jake').storyPath = 'scenarios/t/ink/jake.json';
        const out = warnings(issues(sc, dir));
        assertHas(out, "'scenarios/t/ink/dana.json' has #clone_keycard:4F00A1C2, which is 'jake''s card, not the speaking NPC's ('dana')");
        assert.ok(!has(out, "'scenarios/t/ink/jake.json' has #clone_keycard"), "the speaker's own card is fine");
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test('a card carried by several NPCs and used at an access lock is a warning', { skip }, () => {
    const sc = clean();
    npc(sc, 'dana').creds.card = { name: 'Shared', card_id: '4F00A1C2' };
    const out = issues(sc);
    assertHas(warnings(out), "card '4F00A1C2' is carried by 'jake', 'dana' and is used at access lock(s) 'finance_office'");
    assertHas(out, "ℹ️ Identity reach: card '4F00A1C2' (jake, dana) opens door 'finance_office'");
});

// check_lock_credentials (step 7): a keycard carrying an NPC's card opens every access lock
// that admits that NPC, so it is not "a credential that opens nothing".
function lockCredentialIssues(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_lock_credentials(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

test('a keycard opening an access lock through its holder is not reported as opening nothing', { skip }, () => {
    const sc = clean();
    assert.ok(!has(lockCredentialIssues(sc), "credential '4F00A1C2'"), 'Jake\'s badge copy opens finance_office');
    // a keycard whose card no access lock admits is still reported
    lobby(sc).objects.push({ id: 'len_copy', type: 'keycard', name: "Len's spare", card_id: 'LEN-01' });
    assertHas(lockCredentialIssues(sc), "credential 'LEN-01', but no rfid lock 'requires' it");
});
