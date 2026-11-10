// Office life slice 15 fix: one bubble per spoken chatter line. The press-to-talk icon
// (interactions.js sprite.interactionIndicator, talk.png, drawn at overlay depth) of the speaker
// and its partner used to stay up while the speech bubble showed and read as a second, empty
// bubble over the line (game 694 frames). Covers an exchange line, a bag bark (no partner) and a
// picture-chat bubble, and that the talk icon comes back when the line ends.
// Run with: bin/test-js test/js/npc-chatter-one-bubble.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { NpcWorldBubbles } from '../../public/break_escape/js/systems/npc-world-bubbles.js';

function mk(scene) {
    const o = { x: 0, y: 0, visible: true, data: {}, scene, text: '', width: 60, height: 12,
        setOrigin() { return o; }, setVisible(v) { o.visible = v; return o; }, setPosition(x, y) { o.x = x; o.y = y; return o; },
        setTexture(k) { o.textureKey = k; return o; }, setText(t) { o.text = t; return o; }, setDepth() { return o; },
        setData(k, v) { o.data[k] = v; return o; }, getData(k) { return o.data[k]; },
        clear() { return o; }, fillStyle() { return o; }, lineStyle() { return o; }, fillRoundedRect() { return o; },
        strokeRoundedRect() { return o; }, fillTriangle() { return o; }, lineBetween() { return o; } };
    return o;
}

/** Rosa and Sanjay at the cooler, the player in talk range of both (both talk icons up). */
function rig() {
    const scene = { add: {}, textures: { exists: () => true }, load: { image() {}, once() {}, isLoading: () => true, start() {} } };
    for (const k of ['text', 'image', 'graphics']) scene.add[k] = () => mk(scene);
    scene.add.container = () => mk(scene);
    const npc = (x) => {
        const s = { x, y: 240, active: true, visible: true, destroyed: false, scene, texture: { key: 'none' }, frame: null,
            getTopCenter() { return { x: this.x, y: this.y - 40 }; } };
        s.interactionIndicator = mk(scene); s.interactionIndicator.textureKey = 'talk';
        s.talkIconVisible = true;
        return s;
    };
    const sprites = { rosa: npc(-276), sanjay: npc(-244) };
    const talking = new Map();
    globalThis.window = {
        gameScenario: {}, currentPlayerRoom: 'kitchen', rooms: {}, player: { x: -250, y: 210 },
        MinigameFramework: { currentMinigame: null },
        npcNeedsSystem: { states: new Map([['rosa', {}], ['sanjay', {}]]), getState: id => ({ talking: talking.get(id) || null }) },
        npcBehaviorManager: { getBehavior: id => (sprites[id] ? { sprite: sprites[id], roomId: 'kitchen' } : null) }
    };
    return { sprites, talking };
}

/** Every bubble-shaped thing on screen over the pair: world speech bubbles and talk icons. */
function onScreen(speech, sprites) {
    const out = [];
    for (const [id, bb] of speech.bubbles) {
        if (!bb.box.visible) continue;
        out.push({ kind: 'speech', id, text: bb.text.text, icon: bb.img.visible });
    }
    for (const [id, s] of Object.entries(sprites)) {
        if (s.interactionIndicator.visible) out.push({ kind: 'talk', id, text: '', icon: false });
    }
    return out;
}

function assertOneBubble(shown, label) {
    assert.equal(shown.length, 1, `${label}: exactly one bubble, got ${JSON.stringify(shown)}`);
    for (const b of shown) assert.ok((b.text && b.text.trim()) || b.icon, `${label}: a bubble with neither text nor an icon: ${JSON.stringify(b)}`);
}

test('exchange line: one bubble, the partner\'s talk icon hidden while it shows and back after', () => {
    try {
        const { sprites, talking } = rig();
        const speech = new NpcWorldBubbles();
        talking.set('rosa', { line: 'I wrote it. Is something wrong with it?', knot: 'exchange_rosa_rota', partnerId: 'sanjay', topic: 'cooler' });
        speech.update();
        assertOneBubble(onScreen(speech, sprites), 'exchange');
        assert.equal(speech.bubbles.get('rosa').text.text, 'I wrote it. Is something wrong with it?');
        // Next line: the other speaker
        talking.delete('rosa');
        talking.set('sanjay', { line: "I'm on fridge duty two weeks running.", knot: 'exchange_rosa_rota', partnerId: 'rosa', topic: 'cooler' });
        speech.update();
        assertOneBubble(onScreen(speech, sprites), 'exchange reply');
        // Line over: both talk icons back (the player is still in range)
        talking.clear();
        speech.update();
        const after = onScreen(speech, sprites);
        assert.deepEqual(after.map(b => b.kind + ':' + b.id).sort(), ['talk:rosa', 'talk:sanjay']);
    } finally { delete globalThis.window; }
});

test('bag bark with no partner: one bubble; picture chat: one bubble holding the icon', () => {
    try {
        const { sprites, talking } = rig();
        sprites.rosa.talkIconVisible = false; sprites.rosa.interactionIndicator.setVisible(false);  // out of range
        const speech = new NpcWorldBubbles();
        talking.set('sanjay', { line: 'Have you seen the new kitchen rota?', partnerId: null, topic: 'grumble' });
        speech.update();
        assertOneBubble(onScreen(speech, sprites), 'bark');
        talking.set('sanjay', { line: null, picture: 'thirst', partnerId: 'rosa', topic: 'cooler' });
        speech.update();
        const pic = onScreen(speech, sprites);
        assertOneBubble(pic, 'picture');
        assert.equal(pic[0].icon, true);
        assert.equal(speech.bubbles.get('sanjay').img.textureKey, 'icon:npc-thirst');
        talking.clear();
        speech.update();
        assert.equal(sprites.sanjay.interactionIndicator.visible, true, 'talk icon back after the line');
        assert.equal(sprites.rosa.interactionIndicator.visible, false, 'never shows a talk icon that was not up');
    } finally { delete globalThis.window; }
});
