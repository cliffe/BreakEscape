// scripts/validate_scenario.rb check_revoke_card_globals, re-issue guard (hardening item 2):
// revoked_card_ids is grow-only, so a card handed to the player (give_item or a start item)
// whose card_id a revoke_card action also cancels would be dead once revoked. The validator
// warns so an author re-issuing a card uses a fresh card_id. The existing declared-array error
// still fires. Run with: node test/js/validator-revoked-card-reissue.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';

function issues(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_revoke_card_globals(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const reissueWarn = (list, cid) =>
    list.some(s => s.startsWith('⚠️') && s.includes(`card_id '${cid}'`) && s.includes('fresh card_id'));

// A revoke_card action in some event mapping, plus a declared revoked_card_ids array.
function base(extra = {}) {
    return {
        startRoom: 'office',
        globalVariables: { revoked_card_ids: [] },
        rooms: {
            office: {
                type: 'room_office', connections: {},
                npcs: [{ id: 'clerk', npcType: 'person',
                         eventMappings: [{ event: 'x', actions: [{ type: 'revoke_card', card_id: 'clerk_card' }] }] }],
                objects: []
            }
        },
        ...extra
    };
}

test('a give_item that re-issues a revoked card_id warns', { skip }, () => {
    const sc = base();
    sc.rooms.office.npcs[0].eventMappings.push({
        event: 'y', actions: [{ type: 'give_item', item: { type: 'keycard', id: 'new_card', name: 'New Card', card_id: 'clerk_card' } }]
    });
    const out = issues(sc);
    assert.ok(reissueWarn(out, 'clerk_card'), out.join('\n'));
});

test('a start item with a revoked card_id warns, including a nested rfidCard', { skip }, () => {
    const sc = base({
        startItemsInInventory: [
            { type: 'keycard', id: 'start_badge', name: 'Badge', rfidCard: { name: 'Badge', card_id: 'clerk_card', rfid_protocol: 'EM4100' } }
        ]
    });
    const out = issues(sc);
    assert.ok(reissueWarn(out, 'clerk_card'), out.join('\n'));
});

test('a revoked world-object card the player clones does not warn', { skip }, () => {
    // The intended mechanic: the card lives on a desk (an object), never handed over.
    const sc = base();
    sc.rooms.office.objects.push({ type: 'desk', id: 'desk',
        rfidCard: { name: 'Vault badge', card_id: 'clerk_card', rfid_protocol: 'EM4100' } });
    const out = issues(sc);
    assert.ok(!reissueWarn(out, 'clerk_card'), out.join('\n'));
});

test('a given card that is never revoked does not warn', { skip }, () => {
    const sc = base();
    sc.rooms.office.npcs[0].eventMappings.push({
        event: 'y', actions: [{ type: 'give_item', item: { type: 'keycard', id: 'c2', name: 'C2', card_id: 'other_card' } }]
    });
    const out = issues(sc);
    assert.ok(!reissueWarn(out, 'other_card'), out.join('\n'));
});

test('the declared-array error still fires when revoked_card_ids is missing', { skip }, () => {
    const sc = base();
    delete sc.globalVariables.revoked_card_ids;
    const out = issues(sc);
    assert.ok(out.some(s => s.startsWith('❌') && s.includes('revoked_card_ids')), out.join('\n'));
});

test('no revoke_card action means no checks and no warning', { skip }, () => {
    const sc = { startRoom: 'office', rooms: { office: { type: 'room_office', connections: {}, objects: [],
        npcs: [{ id: 'clerk', npcType: 'person' }] } },
        startItemsInInventory: [{ type: 'keycard', id: 's', name: 'S', card_id: 'clerk_card' }] };
    const out = issues(sc);
    assert.deepEqual(out, []);
});
