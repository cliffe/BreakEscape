// scripts/validate_helpdesk.rb check_helpdesk (MFA plan S8b, unit 05): errors, warnings and information
// lines, the schema entries, and the S8a lock-for-good rule made an error where nothing goes round.
// Run with: node test/js/validator-helpdesk.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function rubyRun(scenario, call) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      data = JSON.parse(STDIN.read)
      puts JSON.generate(${call})`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const issues = (sc, repo = null, dir = null) =>
    rubyRun(sc, `check_helpdesk(data, ${repo ? JSON.stringify(repo) : 'nil'}, ${dir ? JSON.stringify(dir) : 'nil'})`);
const mfaIssues = sc => rubyRun(sc, 'check_mfa(data)');
const errors = list => list.filter(s => s.startsWith('❌'));
const warnings = list => list.filter(s => s.startsWith('⚠️'));
const infos = list => list.filter(s => s.startsWith('ℹ️'));
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n')}`);

// Omar signs in at desk_pc; Ria runs the desk; a note on the desk holds the two answers.
function base() {
    return {
        startRoom: 'office',
        rooms: {
            office: {
                type: 'room_office', connections: {},
                objects: [
                    { id: 'desk_pc', type: 'pc', name: 'Desk PC', lockType: 'login', locked: true, owner: 'omar',
                      contents: [{ id: 'req_form', type: 'helpdesk_form', name: 'IT request form', desk: 'it_desk' }] },
                    { id: 'staff_note', type: 'notes', name: 'Staff list', readable: true, text: 'Omar Kane, staff 4417, reports to Dee Marsh' }
                ],
                npcs: [
                    { id: 'omar', npcType: 'person',
                      creds: { username: 'omar.k', password: 'Omar-Pass-1', resetPassword: 'Fresh-Pass-9',
                               recovery: { staff_no: '4417', manager: 'Dee Marsh' } } },
                    { id: 'ria', npcType: 'person' }
                ]
            }
        },
        helpdesks: {
            it_desk: { npc: 'ria', verify: 'questions', questions: ['staff_no', 'manager'], minCorrect: 2, maxTries: 3,
                       resets: ['password'], questionLabels: { staff_no: 'Staff number', manager: 'Line manager' } }
        }
    };
}
const room = sc => sc.rooms.office;
const omar = sc => room(sc).npcs[0];
const desk = sc => sc.helpdesks.it_desk;

test('a scenario with none of the fields gets no line', { skip }, () => {
    const sc = base();
    delete sc.helpdesks;
    room(sc).objects = [room(sc).objects[1]];
    delete omar(sc).creds.recovery; delete omar(sc).creds.resetPassword;
    assert.deepEqual(issues(sc), []);
});

test('a clean desk has no error or warning and one information line', { skip }, () => {
    const out = issues(base());
    assert.deepEqual(errors(out), []);
    assert.deepEqual(warnings(out), []);
    assertHas(infos(out), "helpdesk 'it_desk' (NPC 'ria'): rule questions (2 of 2), resets password; covers omar (password)");
});

test('no information line quotes an answer or a password', { skip }, () => {
    const text = issues(base()).join('\n');
    for (const secret of ['4417', 'Dee Marsh', 'Fresh-Pass-9', 'Omar-Pass-1']) assert.ok(!text.includes(secret), secret);
});

test('errors: the desk NPC', { skip }, () => {
    let sc = base();
    desk(sc).npc = 'nobody';
    assertHas(errors(issues(sc)), "npc \"nobody\" is not a room NPC");
    sc = base();
    sc.helpdesks.second = { ...desk(sc) };
    assertHas(errors(issues(sc)), "NPC 'ria' serves 2 desks");
});

test('errors: verify, resets, maxTries, minCorrect', { skip }, () => {
    let sc = base();
    desk(sc).verify = 'sms';
    assertHas(errors(issues(sc)), 'verify "sms"');
    sc = base();
    desk(sc).resets = ['password', 'pin'];
    assertHas(errors(issues(sc)), 'resets has "pin"');
    sc = base();
    desk(sc).maxTries = 10;
    assertHas(errors(issues(sc)), 'maxTries must be a whole number from 1 to 9');
    sc = base();
    desk(sc).maxTries = 0;
    assertHas(errors(issues(sc)), 'maxTries must be');
    sc = base();
    desk(sc).minCorrect = 3;
    assertHas(errors(issues(sc)), 'minCorrect is 3 but the desk asks 2 questions');
    sc = base();
    desk(sc).minCorrect = 0;
    assertHas(errors(issues(sc)), 'minCorrect must be');
});

test('errors: questions rule with no questions, a question with no label, a long label', { skip }, () => {
    let sc = base();
    desk(sc).questions = []; delete desk(sc).minCorrect;
    assertHas(errors(issues(sc)), 'asks no question');
    sc = base();
    delete desk(sc).questionLabels.manager;
    assertHas(errors(issues(sc)), "question 'manager' has no questionLabels entry");
    sc = base();
    desk(sc).questionLabels.manager = 'x'.repeat(41);
    assertHas(errors(issues(sc)), "label for question 'manager' is 41 characters");
});

test('errors: recovery values and missing recovery', { skip }, () => {
    let sc = base();
    omar(sc).creds.recovery.manager = 'y'.repeat(65);
    assertHas(errors(issues(sc)), 'creds.recovery.manager is 65 characters');
    sc = base();
    delete omar(sc).creds.recovery.manager;
    assertHas(errors(issues(sc)), "question 'manager' is not in creds.recovery of NPC 'omar'");
});

test('errors: resets password with no resetPassword anywhere; resetPassword equal to password', { skip }, () => {
    let sc = base();
    delete omar(sc).creds.resetPassword;
    assertHas(errors(issues(sc)), 'no account has a creds.resetPassword');
    sc = base();
    omar(sc).creds.resetPassword = 'Omar-Pass-1';
    assertHas(errors(issues(sc)), 'creds.resetPassword is the same as creds.password');
});

test('errors: a pretext ask, an item and an ink tag naming a desk that does not exist', { skip }, () => {
    const sc = base();
    sc.social = { pretextNpcs: [{ id: 'c', asks: { a: { helpdesk: 'ghost' }, b: { helpdesk: 'it_desk' } } }] };
    room(sc).objects[0].contents[0].desk = 'ghost';
    const out = errors(issues(sc));
    assertHas(out, 'asks.a: helpdesk "ghost" is not a desk');
    assert.ok(!has(out, 'asks.b'));
    assertHas(out, "helpdesk_form 'req_form': desk \"ghost\" is not a desk");
});

test('error: a helpdesk_form item outside a sign-in PC', { skip }, () => {
    const sc = base();
    room(sc).objects.push({ id: 'loose_form', type: 'helpdesk_form', name: 'Form', desk: 'it_desk' });
    assertHas(errors(issues(sc)), "helpdesk_form 'loose_form' is not in a sign-in PC's contents");
});

test('ink: the tag must be in the desk NPC story; a reset password never sits in ink', { skip }, () => {
    const repo = mkdtempSync(join(tmpdir(), 'hd-validate-'));
    try {
        const dir = join(repo, 'scenarios', 'x');
        mkdirSync(join(dir, 'ink'), { recursive: true });
        const ink = lines => JSON.stringify({ inkVersion: 21, root: [[...lines.map(l => `^${l}`), ['done', null]], 'done', null] });
        writeFileSync(join(dir, 'ink', 'ria.json'), ink(['Hello.', '#helpdesk_request:it_desk']));
        writeFileSync(join(dir, 'ink', 'omar.json'), ink(['Hi.', '#helpdesk_request:it_desk']));
        writeFileSync(join(dir, 'ink', 'ghost.json'), ink(['#helpdesk_request:ghost']));
        const sc = base();
        room(sc).npcs[1].storyPath = 'scenarios/x/ink/ria.json';
        omar(sc).storyPath = 'scenarios/x/ink/omar.json';
        let out = errors(issues(sc, repo, dir));
        assertHas(out, "ink file 'scenarios/x/ink/omar.json' has #helpdesk_request:it_desk, but it is not NPC 'ria''s story");
        assertHas(out, "#helpdesk_request:ghost, which is not a desk");
        assert.ok(!has(out, 'ink/ria.json'), out.join('\n'));
        writeFileSync(join(dir, 'ink', 'ria.json'), ink(['The new one is Fresh-Pass-9.']));
        out = errors(issues(sc, repo, dir));
        assertHas(out, "NPC 'omar' creds.resetPassword appears in ink file 'scenarios/x/ink/ria.json'");
        assert.ok(!out.join('\n').includes('Fresh-Pass-9'));
    } finally {
        rmSync(repo, { recursive: true, force: true });
    }
});

test('warnings: a none desk, an unfindable answer, a mfa reset with no MFA policy', { skip }, () => {
    let sc = base();
    desk(sc).verify = 'none';
    assertHas(warnings(issues(sc)), "helpdesk 'it_desk' grants to anyone who asks");
    sc = base();
    room(sc).objects[1].text = 'Nothing useful here';
    const out = warnings(issues(sc));
    assertHas(out, "cannot find the answer to question 'staff_no' for NPC 'omar'");
    assertHas(out, "cannot find the answer to question 'manager' for NPC 'omar'");
    assert.ok(!out.join('\n').includes('4417'));
    sc = base();
    desk(sc).resets = ['password', 'mfa'];
    assertHas(warnings(issues(sc)), "resets mfa, but no account is under an MFA policy");
});

test('warning: a callback nobody can take; none when the owner phone lies in the room', { skip }, () => {
    let sc = base();
    desk(sc).verify = 'callback'; delete desk(sc).questions; delete desk(sc).minCorrect;
    assertHas(warnings(issues(sc)), "player can never hold NPC 'omar''s phone");
    room(sc).objects.push({ id: 'omar_phone', type: 'phone_friendface', name: 'Phone', owner: 'omar', takeable: true });
    assert.ok(!has(warnings(issues(sc)), 'never hold'));
});

function codeScenario() {
    const sc = base();
    sc.defaultPolicy = 'strict';
    sc.policies = { strict: { mfa: 'code', maxAttempts: 3 } };
    room(sc).objects.push({ id: 'omar_fob', type: 'code_device', name: 'Fob', owner: 'omar', takeable: true });
    desk(sc).resets = ['password', 'mfa'];
    return sc;
}

test('lock for good: covered by a password desk is clean; the mfa warning of S8a is skipped', { skip }, () => {
    const sc = codeScenario();
    assert.deepEqual(errors(issues(sc)), []);
    assert.ok(!has(warnings(issues(sc)), 'lock the sign-in for good'));
    assert.ok(!has(mfaIssues(sc), 'lock the sign-in for good'), 'S8a warning skipped with helpdesks');
    delete sc.helpdesks;
    assert.ok(has(mfaIssues(sc), 'lock the sign-in for good'), 'S8a warning stands without helpdesks');
});

test('lock for good: an uncovered account is a warning, an error when it is the only one with no way round', { skip }, () => {
    let sc = codeScenario();
    desk(sc).resets = ['mfa'];
    delete omar(sc).creds.resetPassword;
    let out = issues(sc);
    assertHas(errors(out), "NPC 'omar' is the only account that can pass it");
    // a second admitted account makes it a warning
    sc = codeScenario();
    desk(sc).resets = ['mfa'];
    delete omar(sc).creds.resetPassword;
    room(sc).npcs.push({ id: 'pia', npcType: 'person', creds: { username: 'pia.l', password: 'Pia-Pass-2', recovery: { staff_no: '1', manager: 'x' } } });
    out = issues(sc);
    assert.deepEqual(errors(out).filter(m => m.includes('only account')), []);
    assertHas(warnings(out), "no desk resets the password of NPC 'omar'");
});

test('lock for good: a way round (the owner leaves the screen open) lowers it to a warning', { skip }, () => {
    const sc = codeScenario();
    desk(sc).resets = ['mfa'];
    delete omar(sc).creds.resetPassword;
    omar(sc).habits = { screen: { lockIfAwayOverSeconds: 60 } };
    const out = issues(sc);
    assert.deepEqual(errors(out), []);
    assertHas(warnings(out), "no desk resets the password of NPC 'omar'");
});

test('a desk that resets mfa adds a way to the MFA information line', { skip }, () => {
    const sc = codeScenario();
    assertHas(infos(mfaIssues(sc)), 'a helpdesk that resets mfa');
});

test('schema: the new keys are known, closed and server-only', { skip }, () => {
    const schema = JSON.parse(spawnSync('cat', [join(root, 'scripts/scenario-schema.json')], { encoding: 'utf8' }).stdout);
    const hd = schema.properties.helpdesks;
    assert.equal(hd['x-serverOnly'], true);
    assert.equal(hd['x-servedBy'], 'bootstrap helpdeskForms');
    assert.equal(hd.additionalProperties.additionalProperties, false);
    assert.equal(hd.additionalProperties.properties.npc['x-ref'], 'npc');
    const creds = schema.definitions.npc.properties.creds.properties;
    assert.equal(creds.recovery['x-serverOnly'], true);
    assert.equal(creds.resetPassword['x-serverOnly'], true);
    assert.ok(schema.definitions.socialPretextAsk.properties.helpdesk);
    assert.ok(schema.definitions.item.properties.desk);
});

test('the rendered scenario passes the schema and the S8b fields are no longer refused', { skip }, () => {
    const sc = base();
    sc.social = { pretextNpcs: [{ id: 'c', asks: { a: { helpdesk: 'it_desk' } } }] };
    assert.ok(!has(mfaIssues(sc), 'not built yet'));
    assert.deepEqual(errors(issues(sc)), []);
});

// A people desk never resets an account-only or a local account.
test('errors: recovery or resetPassword on an account-only account', { skip }, () => {
    for (const key of ['recovery', 'resetPassword']) {
        const sc = base();
        room(sc).npcs.push({ id: 'svc', displayName: 'Service account', accountOnly: true, staff: true,
                             creds: { username: 'svc.batch', password: 'Svc-Pass-3', [key]: key === 'recovery' ? { staff_no: '1' } : 'Svc-Reset-4' } });
        assertHas(errors(issues(sc)), `NPC 'svc': creds.${key} is on an account-only account; a people desk never resets it`);
    }
});

test('errors: recovery or resetPassword on a local account', { skip }, () => {
    for (const key of ['recovery', 'resetPassword']) {
        const sc = base();
        omar(sc).creds.accountKind = 'local';
        omar(sc).creds.localTo = ['desk_pc'];
        const creds = omar(sc).creds;
        if (key === 'recovery') delete creds.resetPassword; else delete creds.recovery;
        assertHas(errors(issues(sc)), `NPC 'omar': creds.${key} is on a local account; a people desk never resets it`);
    }
});

test('an account-only or local account is left out of the desk checks and the information line', { skip }, () => {
    const sc = base();
    room(sc).npcs.push({ id: 'svc', displayName: 'Service account', accountOnly: true, staff: true,
                         creds: { username: 'svc.batch', password: 'Svc-Pass-3' } });
    const out = issues(sc);
    assert.deepEqual(errors(out), []);
    assertHas(infos(out), 'covers omar (password)');
    assert.ok(!has(infos(out), 'svc'));
});

test('errors: a desk run by an account-only NPC', { skip }, () => {
    const sc = base();
    room(sc).npcs[1] = { id: 'ria', displayName: 'Ria', accountOnly: true, staff: true, creds: { username: 'ria.svc', password: 'Ria-Pass-2' } };
    assertHas(errors(issues(sc)), "npc 'ria' is an account-only NPC; a desk is a person who answers the phone");
});
