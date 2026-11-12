// scripts/validate_phone_calls.rb check_phone_calls (docs/achitechture/PHONE_CALLS_PLAN.md 4.3):
// the `ring` and `call` forms, #place_call, voicemail knots, call-set warnings, the voiced-line
// checks and the "call me" warning. One clean case and one failing fixture per rule. Each test writes
// a scratch scenario folder, compiles its ink with bin/inklecate, and calls the check in-process.
// Run with: node --test test/js/validator-phone-calls.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const inklecate = join(root, 'bin/inklecate');
const env = { ...process.env, LANG: 'C.UTF-8' };

if (ruby.status !== 0 && process.env.CI) {
    test('ruby is available (required under CI)', () => {
        assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
    });
}

const tmpDirs = [];
test.after(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }); });

// Write ink sources (name -> text) under a scratch base dir and compile each.
function buildInk(inks) {
    const base = mkdtempSync(join(tmpdir(), 'pc-'));
    tmpDirs.push(base);
    const dir = join(base, 'scenarios/t/ink');
    mkdirSync(dir, { recursive: true });
    for (const [name, text] of Object.entries(inks)) {
        writeFileSync(join(dir, `${name}.ink`), text);
        const r = spawnSync(inklecate, ['-o', join(dir, `${name}.json`), join(dir, `${name}.ink`)], { encoding: 'utf8' });
        assert.equal(r.status, 0, `ink ${name} failed to compile:\n${r.stdout}\n${r.stderr}`);
        assert.ok(!/ERROR/.test(r.stdout + r.stderr), `ink ${name}:\n${r.stdout}${r.stderr}`);
    }
    return base;
}

function run(scenario, base) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_phone_calls.rb'))}
      puts JSON.generate(check_phone_calls(JSON.parse(STDIN.read), ${JSON.stringify(base)}))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

const errors = list => list.filter(s => s.startsWith('❌'));
const warnings = list => list.filter(s => s.startsWith('⚠️'));
// the shared ink declares the call VARs; cases about other rules drop that warning
const noVar = list => list.filter(s => !s.includes(': VAR call_'));
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n') || '(none)'}`);
const assertNone = (list, frag) => assert.ok(!has(list, frag), `did not expect "${frag}" in:\n${list.join('\n')}`);

const VOICE = { name: 'Aoede', style: 'calm', language: 'en-GB' };

const INK = `VAR call_answer_seconds = 0
VAR call_is_callback = false

=== start ===
Text me when you need me.
+ [Anything new?]
    Not yet.
    -> start

=== ring_call ===
// lint: call-knot
{
- call_is_callback: Thanks for ringing back.
- call_answer_seconds > 10: There you are.
- else: Good, you are there.
}
That is all.
#exit_conversation
-> DONE

=== support_call ===
// lint: call-knot
Support here.
+ [Thanks.]
    Anytime.
    #exit_conversation
    -> DONE

=== vm ===
// lint: call-knot
voice: Leave a message.
-> DONE
`;

// A scenario with one phone contact "hax"; `npc` overrides, `extra` adds top-level keys.
function scenario(npc = {}, extra = {}) {
    return {
        startRoom: 'office',
        startItemsInInventory: [{ type: 'phone', phoneId: 'player_phone', npcIds: ['hax'] }],
        rooms: {
            office: {
                type: 'room_office',
                npcs: [{
                    id: 'hax', displayName: 'HaX', npcType: 'phone', phoneId: 'player_phone', voice: VOICE,
                    storyPath: 'scenarios/t/ink/hax.json', currentKnot: 'start', eventMappings: [], ...npc
                }]
            }
        },
        ...extra
    };
}
const ringMap = (over = {}) => ({ eventPattern: 'go', conversationMode: 'phone-chat', targetKnot: 'ring_call', ring: true, ...over });

function check(npc, inks = { hax: INK }, extra = {}) {
    return run(scenario(npc, extra), buildInk(inks));
}

test('clean: ring true, ring object, call entry and a list all pass with no output', { skip }, () => {
    assert.deepEqual(check({ eventMappings: [ringMap()] }), []);
    assert.deepEqual(check({ eventMappings: [ringMap({ ring: { onMissed: 'voicemail', voicemailKnot: 'vm', withheld: true, untilAnswered: true } })] }), []);
    assert.deepEqual(check({ call: { knot: 'support_call', when: 'globalVars.ally && !globalVars.ko', unavailable: 'hidden' } }), []);
    assert.deepEqual(check({ call: [{ knot: 'support_call', button: false }, { knot: 'ring_call' }] }), []);
    assert.deepEqual(check({ timedConversation: { delay: 1000, targetKnot: 'ring_call', ring: true } }), []);
});

test('error: ring on a non-phone-chat mapping, a video call, a non-phone NPC', { skip }, () => {
    assertHas(errors(check({ eventMappings: [ringMap({ conversationMode: 'person-chat' })] })), 'ring needs conversationMode "phone-chat"');
    assertHas(errors(check({ eventMappings: [ringMap({ conversationMode: 'video-call' })] })), 'not allowed on a video call');
    assertHas(errors(check({ timedConversation: { delay: 0, targetKnot: 'ring_call', videoCall: true, ring: true } })), 'not allowed on a video call');
    assertHas(errors(check({ npcType: 'person', eventMappings: [ringMap()] })), 'non-phone NPC');
    assert.deepEqual(errors(check({ eventMappings: [ringMap({ ring: false })] })), []);
});

test('error: a call entry knot or voicemailKnot that is not in the ink', { skip }, () => {
    assertHas(errors(check({ call: { knot: 'nowhere' } })), 'call.knot "nowhere" is not a knot');
    assertHas(errors(check({ eventMappings: [ringMap({ ring: { onMissed: 'voicemail', voicemailKnot: 'nowhere' } })] })), 'voicemailKnot "nowhere" is not a knot');
    assertHas(errors(check({ eventMappings: [ringMap({ targetKnot: 'nowhere' })] })), 'targetKnot "nowhere" is not a knot');
});

test('error: call knot, ring targetKnot or timed ring on the home knot, unless the contact is voiced', { skip }, () => {
    assertHas(errors(check({ call: { knot: 'start' } })), 'is the contact\'s home knot');
    assertHas(errors(check({ eventMappings: [ringMap({ targetKnot: 'start' })] })), 'is the contact\'s home knot');
    assertHas(errors(check({ timedConversation: { delay: 0, targetKnot: 'start', ring: true } })), 'is the contact\'s home knot');
    assertHas(errors(check({ currentKnot: 'support_call', call: { knot: 'support_call' } })), 'is the contact\'s home knot');
    assert.deepEqual(errors(check({ voiced: true, call: { knot: 'start' } })), []);
});

test('error: ring option values (onMissed, voicemail, withheld, untilAnswered, shape)', { skip }, () => {
    assertHas(errors(check({ eventMappings: [ringMap({ ring: { onMissed: 'voicemail' } })] })), 'needs ring.voicemailKnot');
    assertHas(errors(check({ eventMappings: [ringMap({ ring: { onMissed: 'sms' } })] })), 'onMissed must be');
    assertHas(errors(check({ eventMappings: [ringMap({ ring: { withheld: true } })] })), 'withheld call cannot be rung back');
    assert.deepEqual(errors(check({ eventMappings: [ringMap({ disableClose: true, ring: { withheld: true } })] })), []);
    assertHas(errors(check({ eventMappings: [ringMap({ ring: { withheld: 'yes' } })] })), 'withheld must be true or false');
    assertHas(errors(check({ eventMappings: [ringMap({ ring: { untilAnswered: 'yes' } })] })), 'untilAnswered must be true or false');
    assertHas(errors(check({ eventMappings: [ringMap({ ring: 'yes' })] })), 'ring must be true or an object');
    assertHas(errors(check({ eventMappings: [ringMap({ ring: { voicemailKnot: 3 } })] })), 'voicemailKnot must be a non-empty string');
    assertHas(warnings(check({ eventMappings: [ringMap({ ring: { loud: true } })] })), 'unknown field "loud"');
});

test('error: call entry values (shape, unavailable, button, when)', { skip }, () => {
    assertHas(errors(check({ call: 'support_call' })), 'call must be an object or a list of objects');
    assertHas(errors(check({ call: [{ knot: 'support_call' }, 7] })), 'call[1] must be an object');
    assertHas(errors(check({ call: {} })), 'call.knot is required');
    assertHas(errors(check({ call: { knot: 'support_call', unavailable: 'later' } })), 'unavailable must be');
    assertHas(errors(check({ call: { knot: 'support_call', button: 'no' } })), 'button must be true or false');
    assertHas(errors(check({ call: { knot: 'support_call', when: 4 } })), 'when must be a condition string');
    assertHas(warnings(check({ call: { knot: 'support_call', label: 'x' } })), 'unknown field "label"');
    assertHas(errors(check({ npcType: 'person', call: { knot: 'support_call' } })), 'only for phone NPCs');
});

test('error: call.when that uses value, name or data.', { skip }, () => {
    for (const [when, term] of [['value === true', '`value`'], ['name === "x"', '`name`'], ['data.room === "a"', '`data.`']]) {
        assertHas(errors(check({ call: { knot: 'support_call', when } })), term);
    }
    // a global that merely contains the word, and a quoted string, are fine
    assert.deepEqual(errors(check({ call: { knot: 'support_call', when: 'globalVars.value_seen && globalVars.name_ok' } })), []);
    assert.deepEqual(errors(check({ call: { knot: 'support_call', when: 'globalVars.who === "name"' } })), []);
});

test('warn: untilAnswered on a forced call, and a call knot that never reads call_answer_seconds', { skip }, () => {
    assertHas(warnings(check({ eventMappings: [ringMap({ disableClose: true, ring: { untilAnswered: true } })] })), 'has no effect on a forced call');
    const quiet = INK.replace(/\{\n- call_is_callback[\s\S]*?\n\}\n/, 'Good.\n');
    const w = warnings(check({ eventMappings: [ringMap({ ring: { untilAnswered: true } })] }, { hax: quiet }));
    assertHas(w, 'never reads call_answer_seconds');
    assertNone(warnings(check({ eventMappings: [ringMap({ ring: true })] }, { hax: quiet })), 'never reads');
    assertNone(warnings(check({ eventMappings: [ringMap({ ring: { untilAnswered: true } })] })), 'never reads');
});

test('#place_call: a good hub choice passes; wrong knot, no target, a choice line and a missing -> DONE fail', { skip }, () => {
    const hub = (tagLine, after = '    -> DONE') => `${INK.replace('+ [Anything new?]', `+ [Ring them.]\n    ${tagLine}\n${after}\n+ [Anything new?]`)}`;
    const good = hub('#place_call:support_call');
    assert.deepEqual(check({ call: { knot: 'support_call' } }, { hax: good }), []);
    // a bare #place_call dials a pending callback: needs a ring with callback, or a call entry
    assert.deepEqual(check({ eventMappings: [ringMap()] }, { hax: hub('#place_call') }), []);
    assertHas(errors(check({ eventMappings: [ringMap({ ring: { onMissed: 'voicemail', voicemailKnot: 'vm' } })] }, { hax: hub('#place_call') })), 'no call entry and no ring with onMissed "callback"');
    assertHas(errors(check({ call: { knot: 'support_call' } }, { hax: hub('#place_call:ring_call') })), '#place_call:ring_call is not one of the contact\'s call entries');
    assertHas(errors(check({}, { hax: hub('#place_call') })), 'no call entry and no ring');
    const choiceTag = INK.replace('+ [Anything new?]', '+ [Ring them.] #place_call:support_call\n    -> DONE\n+ [Anything new?]');
    assertHas(errors(check({ call: { knot: 'support_call' } }, { hax: choiceTag })), 'on a choice line is never run');
    const noDone = hub('#place_call:support_call', '    -> start');
    assertHas(warnings(check({ call: { knot: 'support_call' } }, { hax: noDone })), 'is not -> DONE');
});

test('VAR types: an error for the wrong default, a warning when nothing can set the VAR', { skip }, () => {
    const badInt = INK.replace('VAR call_answer_seconds = 0', 'VAR call_answer_seconds = 1.5');
    assertHas(errors(check({ eventMappings: [ringMap()] }, { hax: badInt })), 'call_answer_seconds must default to an integer');
    const badBool = INK.replace('VAR call_is_callback = false', 'VAR call_is_callback = 0');
    assertHas(errors(check({ eventMappings: [ringMap()] }, { hax: badBool })), 'call_is_callback must default to true or false');
    const w = warnings(check({}, { hax: INK }));
    assertHas(w, 'VAR call_answer_seconds is declared');
    assertHas(w, 'VAR call_is_callback is declared');
    assert.deepEqual(warnings(check({ eventMappings: [ringMap()] })), []);
    // an old-style voiced contact takes calls already, so the declaration is not flagged
    assert.deepEqual(warnings(check({ voiced: true })), []);
});

test('warn: a call start knot reachable from the home knot, a shared knot, a divert home', { skip }, () => {
    const reachStart = INK.replace('    Not yet.\n    -> start', '    Not yet.\n    -> support_call');
    assertHas(warnings(check({ call: { knot: 'support_call' } }, { hax: reachStart })), 'is reachable from the home knot');
    assert.deepEqual(warnings(check({ voiced: true, call: { knot: 'support_call' } }, { hax: reachStart })), []);
    const shared = INK.replace('Support here.', 'Support here.\n-> shared')
        .replace('    Not yet.\n    -> start', '    Not yet.\n    -> shared') + '\n=== shared ===\nShared line.\n-> DONE\n';
    assertHas(warnings(check({ call: { knot: 'support_call' } }, { hax: shared })), 'knot "shared" is in the call and also reachable');
    const home = INK.replace('    Anytime.\n    #exit_conversation\n    -> DONE', '    Anytime.\n    -> start');
    assertHas(warnings(check({ call: { knot: 'support_call' } }, { hax: home })), 'diverts to the home knot');
    assert.deepEqual(warnings(check({ call: { knot: 'support_call' } })), []);
});

test('warn: no voice, callId with a call entry, a call contact the phone never lists', { skip }, () => {
    assertHas(warnings(check({ voice: undefined, call: { knot: 'support_call' } })), 'no voice');
    assertNone(warnings(check({ call: { knot: 'support_call' } })), 'no voice');
    assertHas(warnings(check({ callId: 'x', call: { knot: 'support_call' } })), 'has callId and a call entry');
    const unlisted = { startItemsInInventory: [{ type: 'phone', phoneId: 'player_phone', npcIds: ['other'] }] };
    assertHas(warnings(check({ call: { knot: 'support_call' } }, { hax: INK }, unlisted)), 'never appears');
    // history from timedMessages, a sendTimedMessage or a ring means the thread exists
    assertNone(warnings(check({ call: { knot: 'support_call' }, timedMessages: [{ delay: 1, message: 'hi' }] }, { hax: INK }, unlisted)), 'never appears');
    assertNone(warnings(check({ call: { knot: 'support_call' }, eventMappings: [{ eventPattern: 'x', sendTimedMessage: { message: 'hi', delay: 1 } }] }, { hax: INK }, unlisted)), 'never appears');
    assertNone(warnings(check({ call: { knot: 'support_call' }, eventMappings: [ringMap()] }, { hax: INK }, unlisted)), 'never appears');
});

test('voiced-line checks on the call set and voicemail knots: printed variables, stage directions', { skip }, () => {
    const printed = INK.replace('Support here.', 'Support here, {player_name}.');
    assertHas(warnings(check({ call: { knot: 'support_call' } }, { hax: printed.replace('VAR call_is', 'VAR player_name = "x"\nVAR call_is') })), 'prints {player_name}');
    const stage = INK.replace('Support here.', 'Support here. *sighs*');
    assertHas(warnings(check({ call: { knot: 'support_call' } }, { hax: stage })), 'inline stage direction');
    const paren = INK.replace('Support here.', 'Support here. (pauses)');
    assertHas(warnings(check({ call: { knot: 'support_call' } }, { hax: paren })), 'inline stage direction');
    const vm = INK.replace('voice: Leave a message.', 'voice: Message {call_answer_seconds} left. *sighs*');
    const w = warnings(check({ eventMappings: [ringMap({ ring: { onMissed: 'voicemail', voicemailKnot: 'vm' } })] }, { hax: vm }));
    assertHas(w, 'prints {call_answer_seconds}');
    assertHas(w, 'inline stage direction');
    // conditionals, one-word emphasis, a parenthetical aside and narration are fine
    const fine = INK.replace('Support here.', 'Support here, and I *mean* it (and I will bring you in).\nNarrator: *sighs* {call_is_callback: He waits.}');
    assert.deepEqual(warnings(check({ call: { knot: 'support_call' } }, { hax: fine })), []);
    // the text knot is not checked
    const textKnot = INK.replace('Text me when you need me.', 'Text me *sighs* {call_answer_seconds}.');
    assert.deepEqual(warnings(check({ call: { knot: 'support_call' } }, { hax: textKnot })), []);
});

test('warn: "call me" / "ring me" in a timed text, a bark, a message or a text knot of a contact who cannot be called', { skip }, () => {
    const txt = 'Call me when you are done.';
    assertHas(warnings(check({ timedMessages: [{ delay: 1, message: txt }] })), 'timedMessages[0]');
    assertHas(warnings(check({ eventMappings: [{ eventPattern: 'x', sendTimedMessage: { message: 'Then RING ME.', delay: 1 } }] })), 'sendTimedMessage');
    assertHas(warnings(check({ eventMappings: [{ eventPattern: 'x', bark: { message: txt } }] })), 'bark');
    assertHas(warnings(check({ eventMappings: [{ eventPattern: 'x', bark: txt }] })), 'bark');
    const inkLine = INK.replace('Not yet.', 'Ring me when it matters.');
    assertHas(warnings(check({}, { hax: inkLine })), 'hax.ink:7');
    // one warning for the same text on several mappings, with a count; an in-person NPC is not checked
    const dup = check({ eventMappings: [1, 2, 3].map(n => ({ eventPattern: `e${n}`, sendTimedMessage: { message: txt, delay: 1 } })) });
    assert.equal(warnings(dup).filter(w => w.includes('says "Call me')).length, 1);
    assertHas(dup, 'and 2 more with the same text');
    assert.deepEqual(noVar(warnings(check({ npcType: 'person', timedMessages: [{ delay: 1, message: txt }] }, { hax: inkLine }))), []);
    // "Bring me in", player choices and comments do not match
    const quiet = INK.replace('Not yet.', 'Bring me a coffee.\n    // call me later\n') + '\n=== extra ===\n+ [Call me back.]\n    Fine.\n    -> DONE\n';
    assertNone(warnings(check({ timedMessages: [{ delay: 1, message: 'Bring me in.' }] }, { hax: quiet })), "can't call");
    assert.deepEqual(noVar(warnings(check({}, { hax: quiet }))), []);
    // a call entry, a ring or an old-style voiced form makes the same text fine
    assert.deepEqual(warnings(check({ call: { knot: 'support_call' }, timedMessages: [{ delay: 1, message: txt }] }, { hax: inkLine })), []);
    assert.deepEqual(warnings(check({ eventMappings: [ringMap()], timedMessages: [{ delay: 1, message: txt }] }, { hax: inkLine })), []);
    assert.deepEqual(warnings(check({ voiced: true, timedMessages: [{ delay: 1, message: txt }] }, { hax: inkLine })), []);
});

test('a contact with no phone-call features, and a non-object scenario, produce nothing', { skip }, () => {
    assert.deepEqual(noVar(check({})), []);
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_phone_calls.rb'))}
      puts JSON.generate(check_phone_calls([], '/tmp'))`;
    assert.equal(spawnSync('ruby', ['-e', script], { encoding: 'utf8' }).stdout.trim(), '[]');
});

test('the CLI: test_phone_calls is clean, lab_social_engineering has no phone-call output, ring and call are known fields', { skip, timeout: 120000 }, () => {
    for (const name of ['test_phone_calls', 'lab_social_engineering']) {
        const r = spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), join(root, `scenarios/${name}/scenario.json.erb`), '--no-graph', '--no-lint'],
            { encoding: 'utf8', env, cwd: root });
        assert.equal(r.status, 0, r.stdout + r.stderr);
        assert.ok(!/phone calls:/.test(r.stdout), `${name}:\n${r.stdout.split('\n').filter(l => /phone calls:/.test(l)).join('\n')}`);
        assert.ok(!/unknown field\(s\)[\s\S]{0,400}\b(ring|call)\b'/.test(r.stdout.split('Checking ink')[0]), `${name}: ring/call flagged as unknown`);
        assert.ok(!/VAR call_(?:answer_seconds|is_callback) is read but never set/.test(r.stdout), `${name}: engine VAR flagged`);
    }
});

// ---- A7a review round 1 fixes ----

test('M1: a ring with no targetKnot is an error unless the contact is voiced', { skip }, () => {
    const noTarget = { eventPattern: 'go', conversationMode: 'phone-chat', ring: true };
    assertHas(errors(check({ eventMappings: [noTarget] })), 'ring needs a targetKnot');
    assertHas(errors(check({ eventMappings: [{ ...noTarget, ring: { onMissed: 'callback' } }] })), 'ring needs a targetKnot');
    assertHas(errors(check({ timedConversation: { delay: 0, ring: true } })), 'ring needs a targetKnot');
    assertNone(errors(check({ eventMappings: [ringMap()] })), 'ring needs a targetKnot');
    assertNone(errors(check({ eventMappings: [{ ...noTarget, knot: 'ring_call' }] })), 'ring needs a targetKnot');
    assertNone(errors(check({ voiced: true, eventMappings: [noTarget] })), 'ring needs a targetKnot');
});

test('M3: an ink function used by the thread and the call is not a shared knot', { skip }, () => {
    const withFn = INK.replace('    Not yet.\n    -> start', '    Not yet. {both()}\n    -> start')
        .replace('Support here.', 'Support here. {both()}') + '\n=== function both() ===\n~ return 1\n';
    assertNone(warnings(check({ call: { knot: 'support_call' } }, { hax: withFn })), 'knot "both"');
    // a real shared knot still warns
    const shared = INK.replace('Support here.', 'Support here.\n-> shared')
        .replace('    Not yet.\n    -> start', '    Not yet.\n    -> shared') + '\n=== shared ===\nShared line.\n-> DONE\n';
    assertHas(warnings(check({ call: { knot: 'support_call' } }, { hax: shared })), 'knot "shared"');
});

test('m2: the call-me exemption is for a contact-level voiced contact only', { skip }, () => {
    const inkLine = INK.replace('Not yet.', 'Ring me when it matters.');
    assert.deepEqual(warnings(check({ voiced: true }, { hax: inkLine })), []);
    const mapped = { eventPattern: 'x', conversationMode: 'phone-chat', voiced: true, targetKnot: 'ring_call' };
    assertHas(warnings(check({ eventMappings: [mapped] }, { hax: inkLine })), 'hax.ink:7');
    assertHas(warnings(check({ timedConversation: { delay: 1, targetKnot: 'ring_call', voiced: true } }, { hax: inkLine })), 'hax.ink:7');
});

test('m3: a phoneId that names no phone item is skipped, not warned', { skip }, () => {
    assertNone(warnings(check({ phoneId: 'no_such_phone', call: { knot: 'support_call' } })), 'never appears');
});

test('m6: a plain phone-chat mapping gives the thread history', { skip }, () => {
    const unlisted = { startItemsInInventory: [{ type: 'phone', phoneId: 'player_phone', npcIds: ['other'] }] };
    assertNone(warnings(check({ call: { knot: 'support_call' }, eventMappings: [{ eventPattern: 'x', conversationMode: 'phone-chat', targetKnot: 'start' }] }, { hax: INK }, unlisted)), 'never appears');
});

test('nit: ring.onMissed "voicemail" on a forced call warns', { skip }, () => {
    const w = warnings(check({ eventMappings: [ringMap({ disableClose: true, ring: { onMissed: 'voicemail', voicemailKnot: 'vm' } })] }));
    assertHas(w, 'cannot be missed');
    assertNone(warnings(check({ eventMappings: [ringMap({ ring: { onMissed: 'voicemail', voicemailKnot: 'vm' } })] })), 'cannot be missed');
});

test('m5: the CLI lint finds no call-in-text-thread on test_phone_calls or lab_social_engineering', { skip, timeout: 120000 }, () => {
    for (const name of ['test_phone_calls', 'lab_social_engineering']) {
        const r = spawnSync('node', [join(root, 'scripts/ink_runtime_check/dialoguelint.mjs'), join(root, `scenarios/${name}`), '--json'], { encoding: 'utf8', env, cwd: root });
        assert.equal(r.status, 0, r.stderr);
        const out = JSON.parse(r.stdout);
        const hits = out.files.flatMap(f => f.findings.filter(x => x.rule === 'call-in-text-thread').map(x => `${f.file}:${x.line}`));
        assert.deepEqual(hits, [], name);
    }
});
