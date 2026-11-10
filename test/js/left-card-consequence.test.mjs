// left-card-consequence.js: when npc_left_item_gone:<owner> fires for an item the
// player took, run that object's onOwnerNoticesMissing through applyActions. The
// server strips object defs from the client scenario, so the config is cached from
// the live sprite (at install and at object_revealed) before the item is taken.
// No static imports — stub window and import directly.
// Run with: bin/test-js test/js/left-card-consequence.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const mod = join(here, '../../public/break_escape/js/systems/left-card-consequence.js');

// Minimal event dispatcher supporting `event:*` wildcard listeners.
function makeDispatcher() {
    const exact = new Map();
    const prefix = [];
    return {
        on(name, cb) {
            if (name.endsWith(':*')) prefix.push({ p: name.slice(0, -1), cb });
            else (exact.get(name) || exact.set(name, []).get(name)).push(cb);
        },
        emit(name, data) {
            (exact.get(name) || []).forEach(cb => cb(data));
            for (const { p, cb } of prefix) if (name.startsWith(p)) cb(data);
        }
    };
}

const { installLeftCardConsequence } = await import(pathToFileURL(mod).href);

function setup(cardSprite) {
    const applied = [];
    globalThis.window = {
        eventDispatcher: makeDispatcher(),
        applyActions: (list, opts) => applied.push({ list, opts }),
        rooms: { office: { objects: cardSprite ? { clerk_card_item: cardSprite } : {} } }
    };
    installLeftCardConsequence();
    return applied;
}

const cardWithConfig = () => ({ scenarioData: { id: 'clerk_card_item', onOwnerNoticesMissing: [{ type: 'revoke_card', card_id: 'clerk_card' }] } });

test('owner notices a taken card: runs onOwnerNoticesMissing cached at install', () => {
    const applied = setup(cardWithConfig());
    // Item is taken, then the owner returns and notices it gone.
    delete window.rooms.office.objects.clerk_card_item;
    window.eventDispatcher.emit('npc_left_item_gone:clerk', { npcId: 'clerk', itemId: 'clerk_card_item' });
    assert.equal(applied.length, 1);
    assert.deepEqual(applied[0].list, [{ type: 'revoke_card', card_id: 'clerk_card' }]);
    assert.equal(applied[0].opts.source, 'owner_notices_missing');
});

test('config cached from a later object_revealed when not loaded at install', () => {
    const applied = setup(null); // nothing loaded at install
    // Reveal brings the sprite in; cache it.
    window.rooms.office.objects.clerk_card_item = cardWithConfig();
    window.eventDispatcher.emit('object_revealed:clerk_card_item', { objectId: 'clerk_card_item', leftBehindBy: 'clerk' });
    delete window.rooms.office.objects.clerk_card_item; // player takes it
    window.eventDispatcher.emit('npc_left_item_gone:clerk', { npcId: 'clerk', itemId: 'clerk_card_item' });
    assert.equal(applied.length, 1);
    assert.equal(applied[0].list[0].card_id, 'clerk_card');
});

test('only fires once per item', () => {
    const applied = setup(cardWithConfig());
    window.eventDispatcher.emit('npc_left_item_gone:clerk', { npcId: 'clerk', itemId: 'clerk_card_item' });
    window.eventDispatcher.emit('npc_left_item_gone:clerk', { npcId: 'clerk', itemId: 'clerk_card_item' });
    assert.equal(applied.length, 1);
});

test('no config on the object: nothing runs', () => {
    const applied = setup({ scenarioData: { id: 'clerk_card_item' } });
    window.eventDispatcher.emit('npc_left_item_gone:clerk', { npcId: 'clerk', itemId: 'clerk_card_item' });
    assert.equal(applied.length, 0);
});

test('a different item id does not trigger an unrelated config', () => {
    const applied = setup(cardWithConfig());
    window.eventDispatcher.emit('npc_left_item_gone:clerk', { npcId: 'clerk', itemId: 'some_other_item' });
    assert.equal(applied.length, 0);
});
