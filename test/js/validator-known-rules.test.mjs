// Three validator rules that were over-strict (triage of scripts/validator_known_failures.json, 2026-11-18):
//  1. a #give_item:<type> inside a {has_<type>: ...} ink branch is not checked against itemsHeld
//     (the branch only renders when itemsHeld holds the type), except keycard and rfid_cloner,
//     whose has_ variable the engine also sets from the player's inventory;
//  2. two capture writers for one targetId are not a duplicate when their mapping conditions
//     are mutually exclusive;
//  3. the missing-keyPins rule is unchanged (a key and a lock without keyPins do not match).
// Run with: node --test test/js/validator-known-rules.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function rubyJson(body, input) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      input = JSON.parse(STDIN.read)
      puts JSON.generate(begin; ${body}; end)`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(input), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

// Which #give_item lines the ink check would skip.
function skippedGiveItems(ink) {
    const lines = ink.split('\n');
    return rubyJson(`lines = input.map { |l| l + "\\n" }
      br = ink_has_item_branches(lines)
      out = []
      lines.each_with_index do |l, i|
        s = l.strip
        next unless s.start_with?('#give_item:')
        t = s.sub('#give_item:', '').split(/[|:]/).first
        out << [i + 1, give_item_guarded_by_has_branch?(br[i], t)]
      end
      out`, lines);
}

test('give_item inside {has_<type>:} is skipped', { skip }, () => {
    assert.deepEqual(skippedGiveItems([
        '{has_lockpick:',
        '  * [I will take the lockpick]',
        '    #give_item:lockpick',
        '    -> hub',
        '}'
    ].join('\n')), [[3, true]]);
});

test('give_item outside any has_ branch, or in a branch for another type, is still checked', { skip }, () => {
    assert.deepEqual(skippedGiveItems([
        '#give_item:lockpick',
        '{has_phone:',
        '  #give_item:lockpick',
        '}',
        '{has_lockpick:',
        '}',
        '#give_item:lockpick',
        '{not has_lockpick:',
        '  #give_item:lockpick',
        '}',
        '{has_lockpick or has_phone:',
        '  #give_item:lockpick',
        '}'
    ].join('\n')), [[1, false], [3, false], [7, false], [9, false], [12, false]]);
});

test('keycard stays checked: the engine sets has_keycard from the player inventory', { skip }, () => {
    assert.deepEqual(skippedGiveItems([
        '{has_keycard:',
        '  #give_item:keycard',
        '}'
    ].join('\n')), [[2, false]]);
});

function captureErrors(mappings) {
    return rubyJson(`check_capture_log(input).select { |m| m.include?('two capture routes') }`, {
        rooms: { r: { npcs: [{ id: 'n', eventMappings: mappings }] } }
    });
}
const cap = (condition) => ({
    eventPattern: 'pc_signed_in:x', ...(condition ? { condition } : {}),
    addCapture: { targetId: 'door_admin', roleLabel: 'r', kind: 'foothold' }
});

test('two writers of one targetId with exclusive conditions are not a duplicate', { skip }, () => {
    assert.deepEqual(captureErrors([
        cap("data.footholdId === 'jack_network_port'"),
        cap("data.footholdId === 'wifi_office_lan'")
    ]), []);
});

test('two writers of one targetId whose conditions can both hold are still an error', { skip }, () => {
    assert.equal(captureErrors([cap("data.footholdId === 'a'"), cap("data.other === 'b'")]).length, 1);
    assert.equal(captureErrors([cap(null), cap("data.footholdId === 'b'")]).length, 1);
    assert.equal(captureErrors([cap(null), cap(null)]).length, 1);
});

test('three writers: a clash with any earlier one is reported', { skip }, () => {
    assert.equal(captureErrors([
        cap("data.footholdId === 'a'"), cap("data.footholdId === 'b'"), cap("data.footholdId === 'a'")
    ]).length, 1);
});

test('the missing-keyPins rule is still an error: a lock and key without keyPins do not match in the engine', { skip }, () => {
    const issues = rubyJson(`check_common_issues(input).select { |m| m.include?("keyPins") }`, {
        startRoom: 'a',
        rooms: { a: { type: 'room_office', connections: {}, objects: [
            { type: 'suitcase', name: 'Case', locked: true, lockType: 'key', requires: 'k1' },
            { type: 'key', name: 'Key', key_id: 'k1' }
        ] } }
    });
    assert.equal(issues.length, 2);
    assert.ok(issues.every(m => m.includes('ERROR')));
});
