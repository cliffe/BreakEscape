// scripts/validate_npc_needs.rb: room leash and private objects (OFFICE_LIFE_PLAN 7.2, slice 2a).
// One inline fixture per check. Run with: node test/js/validator-npc-leash.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function check(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}
      puts JSON.generate(ValidateNpcNeeds.check(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const has = (issues, frag) => issues.some(s => s.includes(frag));

const thirst = { thirst: { decayPerMin: 10, urgentAt: 40 } };
const cooler = (id, extra = {}) => ({ id, type: 'water_cooler', affordance: { satisfies: 'thirst', restores: 60, ...extra } });
// kitchen - office - lounge in a row; the home desk is in the office
function office({ npc = {}, rooms = {}, objects = {} } = {}) {
    return {
        rooms: {
            kitchen: { type: 'room_office', connections: { east: 'office' }, objects: objects.kitchen || [cooler('kitchen_cooler')], ...rooms.kitchen },
            office: {
                type: 'room_office', connections: { west: 'kitchen', east: 'lounge' },
                objects: objects.office || [{ id: 'tom_pc', type: 'pc' }],
                npcs: [{ id: 'tom', needsHome: 'tom_pc', needs: thirst, ...npc }, { id: 'rosa', needsHome: { room: 'lounge', x: 3, y: 4 }, needs: thirst }],
                ...rooms.office
            },
            lounge: { type: 'room_office', connections: { west: 'office' }, objects: objects.lounge || [cooler('lounge_cooler')], ...rooms.lounge }
        }
    };
}

test('no leash fields: no leash output', { skip }, () => {
    const i = check(office());
    assert.ok(!i.some(s => /leash|private|needsRooms|needsAvoidRooms|needsPrivateTo/.test(s)), i.join('\n'));
});

test('unknown rooms in needsRooms / needsAvoidRooms and unknown NPCs in needsPrivateTo / owners are errors', { skip }, () => {
    const i = check(office({
        npc: { needsRooms: ['kitchen', 'attic'], needsAvoidRooms: ['cellar'] },
        rooms: { lounge: { needsPrivateTo: ['rosa', 'ghost'] } },
        objects: { kitchen: [cooler('kitchen_cooler', { private: true, owners: ['tom', 'nobody'] })] }
    }));
    assert.ok(has(i, "needsRooms names unknown room 'attic'"));
    assert.ok(has(i, "needsAvoidRooms names unknown room 'cellar'"));
    assert.ok(has(i, "needsPrivateTo names unknown NPC 'ghost'"));
    assert.ok(has(i, "affordance.owners names unknown NPC 'nobody'"));
});

test('the home room forbidden, or the needsHome object private to someone else, is an error', { skip }, () => {
    let i = check(office({ npc: { needsAvoidRooms: ['office'] } }));
    assert.ok(has(i, "needsAvoidRooms lists its own home room 'office'"));
    i = check(office({ rooms: { office: { needsPrivateTo: ['rosa'] } } }));
    assert.ok(has(i, "NPC 'tom' home room 'office' is needsPrivateTo"));
    i = check(office({ objects: { office: [{ id: 'tom_pc', type: 'pc', affordance: { private: true, owners: ['rosa'] } }] } }));
    assert.ok(has(i, "needsHome 'tom_pc' is private to [\"rosa\"]"));
});

test('a need made impossible by the leash is an error naming each rule', { skip }, () => {
    const i = check(office({
        npc: { needsAvoidRooms: ['kitchen'] },
        rooms: { lounge: { needsPrivateTo: ['rosa'] } }
    }));
    const e = i.find(s => s.includes("NPC 'tom' need 'thirst' is impossible"));
    assert.ok(e, i.join('\n'));
    assert.ok(e.includes("'kitchen_cooler' (room 'kitchen' is in needsAvoidRooms)"));
    assert.ok(e.includes("'lounge_cooler' (room 'lounge' is private to [\"rosa\"])"));
    // Rosa may use the lounge: no error for her
    assert.ok(!has(i, "NPC 'rosa' need 'thirst' is impossible"));
});

test('a private object the NPC does not own excludes it; an allow list implies the home room', { skip }, () => {
    const i = check(office({
        npc: { needsRooms: ['kitchen'] },
        objects: { kitchen: [cooler('kitchen_cooler', { private: true, owners: ['rosa'] })], office: [{ id: 'tom_pc', type: 'pc' }, cooler('office_cooler')] }
    }));
    assert.ok(!has(i, "NPC 'tom' need 'thirst' is impossible"), i.join('\n'));
    assert.ok(has(i, "T1 =") && i.some(s => s.includes('NPC needs tom.thirst') && s.includes("via 'office_cooler'")), 'timing via a permitted target');
});

test('a permitted target reachable only through a forbidden room is a warning', { skip }, () => {
    // Rosa lives in the lounge; the office is private to Tom; the kitchen cooler is beyond it
    const sc = office({ rooms: { office: { needsPrivateTo: ['tom'] } }, objects: { lounge: [] } });
    const i = check(sc);
    assert.ok(has(i, "NPC 'rosa' need 'thirst' target 'kitchen_cooler' in room 'kitchen' can only be reached through a room its leash forbids"), i.join('\n'));
});

test('a private object with no owner serves nobody (warning)', { skip }, () => {
    const i = check(office({ objects: { kitchen: [cooler('kitchen_cooler'), cooler('orphan', { private: true })] } }));
    assert.ok(has(i, "object 'orphan' is private but has no owner"));
    const j = check(office({ objects: { office: [{ id: 'tom_pc', type: 'pc', affordance: { private: true } }] } }));
    assert.ok(!has(j, "object 'tom_pc' is private but has no owner"), 'needsHome makes Tom its owner');
});

test('interest: accepting objects all forbidden is an error; noticeRooms naming a forbidden room warns', { skip }, () => {
    const sc = office({
        npc: { needs: undefined, interests: { post: { weight: 2, noticeRooms: ['office', 'lounge'] } }, needsAvoidRooms: ['lounge'] },
        objects: { office: [{ id: 'tom_pc', type: 'pc' }, { id: 'letter', type: 'notes', needsTag: 'post' }], lounge: [{ id: 'tray', type: 'tray', affordance: { accepts: ['post'] } }] }
    });
    const i = check(sc);
    assert.ok(has(i, "interest 'post' is impossible under its room leash"), i.join('\n'));
    assert.ok(has(i, "noticeRooms names room 'lounge', which its leash forbids"));
});

// Access slice 9.2 review R1 m6: a social_media need with "phone": false and no object that
// satisfies it is still an error; with a phone (sub-slice C) it is not
test('social_media: no object satisfies it, an error only with "phone": false', { skip }, () => {
    const social = { social_media: { decayPerMin: 4, urgentAt: 40 } };
    const withPhone = check(office({ npc: { needs: social } }));
    assert.ok(!has(withPhone, "need 'social_media' has no object"), withPhone.join('\n'));
    const noPhone = check(office({ npc: { needs: social, phone: false } }));
    assert.ok(has(noPhone, "need 'social_media' has no object"), noPhone.join('\n'));
});

// q53 (f): interests.<tag>.noticeRadius
const noticeSc = (noticeRadius) => office({
    npc: { needs: undefined, interests: { post: { weight: 2, noticeRadius } } },
    objects: { office: [{ id: 'tom_pc', type: 'pc', affordance: { accepts: ['post'] } }, { id: 'letter', type: 'notes', needsTag: 'post' }] }
});

test('interest noticeRadius: 4 tiles is fine; out of range or not a number is an error; under 2 warns', { skip }, () => {
    let i = check(noticeSc(4));
    assert.ok(!has(i, 'noticeRadius'), i.join('\n'));
    i = check(noticeSc(0));
    assert.ok(has(i, "interest 'post' noticeRadius must be a number of tiles from 0.5 to 100"), i.join('\n'));
    i = check(noticeSc('near'));
    assert.ok(has(i, "noticeRadius must be a number"));
    i = check(noticeSc(1));
    assert.ok(has(i, "noticeRadius 1 is under 2 tiles"), i.join('\n'));
});
