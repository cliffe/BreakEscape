// Friendface reactions in the browser feed store (systems/social-feed.js,
// docs/achitechture/FRIENDFACE_REACTIONS_PLAN.md section 6): reactions stored before the post, the
// npc_reacted events and their payload, restore with no event, junk dropped, reactionsFor order,
// no toast, no phone count, and the key set matching AccessWork::REACTION_KEYS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SocialFeed, REACTION_KEYS, REACTION_LABELS } from '../../public/break_escape/js/systems/social-feed.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function harness() {
    const log = [];
    const feed = new SocialFeed({
        send: () => Promise.resolve(null), hasFeed: () => true,
        emit: (name, data) => log.push(['emit', name, data, feed.reactionsFor(data.postId)]),
        toast: (message, title) => log.push(['toast', message, title]),
        siteVisited: () => true, toastsOn: () => true, npcName: () => null, siteName: () => 'Friendface', profileName: () => null
    });
    return { feed, log };
}
const own = (npc, index, seq, id, extra = {}) => ({ index, seq, site: 'friendface', person: npc, post: { id, text: `${id} text` }, done: false, ...extra });
const reply = (npc, index, seq, id, thread, poster, named, extra = {}) => ({
    index, seq, site: 'friendface', person: npc, done: false, post: { id, text: `${id} text`, replyTo: thread },
    replyToNpc: poster, replyToPerson: poster, namedNpc: named, namedPerson: named, ...extra
});
const rx = (postId, npc, key, person = npc) => ({ postId, npc, person, key });

test('the key set matches AccessWork::REACTION_KEYS in lib/break_escape/access_work.rb', () => {
    const src = readFileSync(join(root, 'lib/break_escape/access_work.rb'), 'utf8');
    const m = src.match(/REACTION_KEYS = %w\[([^\]]*)\]/);
    assert.ok(m, 'Ruby constant found');
    assert.deepEqual(REACTION_KEYS, m[1].trim().split(/\s+/));
    assert.deepEqual(Object.keys(REACTION_LABELS), REACTION_KEYS);
});

test('live apply stores reactions before _add, then emits npc_reacted once per new one after npc_posted', () => {
    const { feed, log } = harness();
    feed.apply('ivy', own('ivy', 0, 1, 'ivy_vent'));
    feed.apply('tomasz', reply('tomasz', 0, 2, 'tom_re', 'ivy_vent', 'ivy', 'ivy'));
    log.length = 0;
    // Ivy's answer comes with her like on Tomasz's reply and Tomasz's own like on it (same answer)
    feed.apply('ivy', reply('ivy', 1, 3, 'ivy_answer', 'ivy_vent', 'ivy', 'tomasz',
        { reactions: [rx('tom_re', 'ivy', 'like'), rx('ivy_answer', 'sam', 'sad')] }));
    const emits = log.filter((l) => l[0] === 'emit');
    assert.deepEqual(emits.map((l) => l[1]), ['npc_posted:ivy', 'npc_reacted:ivy', 'npc_reacted:sam']);
    // The npc_posted re-render already sees the reaction on the post it carries
    assert.deepEqual(emits[0][3], [{ key: 'sad', label: 'Sad', people: [{ npcId: 'sam', person: 'sam' }] }]);
    assert.deepEqual(emits[1][2], { npcId: 'ivy', postId: 'tom_re', key: 'like', site: 'friendface', targetNpc: 'tomasz',
        targetPerson: 'tomasz', targetReplyToPerson: 'ivy' });
    assert.deepEqual(emits[2][2], { npcId: 'sam', postId: 'ivy_answer', key: 'sad', site: 'friendface', targetNpc: 'ivy',
        targetPerson: 'ivy', targetReplyToPerson: 'ivy' });
    assert.ok(!log.some((l) => l[0] === 'toast' && /react/i.test(l[1])), 'no toast for a reaction');
    assert.equal(log.filter((l) => l[0] === 'toast').length, 1, 'only the post\'s own toast');
});

test('the npc_posted listener sees reactions on the post just served', () => {
    const { feed } = harness();
    let seen = null;
    feed.deps.emit = (name, data) => { if (name === 'npc_posted:tomasz') seen = feed.reactionsFor(data.postId); };
    feed.apply('tomasz', own('tomasz', 0, 2, 'tom_post', { reactions: [rx('tom_post', 'ivy', 'like')] }));
    assert.deepEqual(seen, [{ key: 'like', label: 'Like', people: [{ npcId: 'ivy', person: 'ivy' }] }]);
});

test('reactions are kept when _add returns false; a body with no post ignores them', () => {
    const { feed } = harness();
    feed.apply('ivy', own('ivy', 0, 1, 'ivy_vent'));
    assert.equal(feed.apply('ivy', own('ivy', 0, 1, 'ivy_vent', { reactions: [rx('ivy_vent', 'kofi', 'sad')] })), false);
    assert.equal(feed.reactionsFor('ivy_vent').length, 1);
    feed.apply('ivy', { post: null, done: true, reactions: [rx('ivy_vent', 'mei', 'sad')] });
    assert.deepEqual(feed.reactionsFor('ivy_vent')[0].people.map((p) => p.npcId), ['kofi']);
});

test('restore stores reactions and emits nothing; live then restored gives the same list', () => {
    const { feed, log } = harness();
    feed.restore({
        ivy: { site: 'friendface', person: 'ivy', done: true, posts: [
            { index: 0, seq: 1, post: { id: 'ivy_vent', text: 't' }, reactions: [{ npc: 'mei', person: 'mei', key: 'sad' }, { npc: 'kofi', person: 'kofi', key: 'sad' }] }
        ] }
    });
    assert.deepEqual(log, []);
    const restored = feed.reactionsFor('ivy_vent');
    const { feed: live } = harness();
    live.apply('ivy', own('ivy', 0, 1, 'ivy_vent'));
    live.apply('mei', own('mei', 0, 3, 'mei_x', { reactions: [rx('ivy_vent', 'mei', 'sad')] }));
    live.apply('kofi', own('kofi', 0, 2, 'kofi_x', { reactions: [rx('ivy_vent', 'kofi', 'sad')] }));
    assert.deepEqual(live.reactionsFor('ivy_vent'), restored);
    assert.deepEqual(restored, [{ key: 'sad', label: 'Sad', people: [{ npcId: 'kofi', person: 'kofi' }, { npcId: 'mei', person: 'mei' }] }]);
});

test('junk is dropped: unknown key, non-string ids, a second reaction by one NPC on one post', () => {
    const { feed, log } = harness();
    feed.apply('ivy', own('ivy', 0, 1, 'ivy_vent', { reactions: [
        rx('ivy_vent', 'kofi', 'love'), rx(7, 'kofi', 'like'), rx('ivy_vent', null, 'like'), 'nope', null,
        rx('ivy_vent', 'kofi', 'laugh'), rx('ivy_vent', 'kofi', 'angry'), rx('__proto__', 'x', 'like')
    ] }));
    assert.deepEqual(feed.reactionsFor('ivy_vent'), [{ key: 'laugh', label: 'Laugh', people: [{ npcId: 'kofi', person: 'kofi' }] }]);
    assert.equal(log.filter((l) => l[1].startsWith('npc_reacted')).length, 2, 'kofi laugh and the __proto__ one');
    assert.deepEqual(feed.reactionsFor('__proto__')[0].people[0].npcId, 'x');
    assert.equal({}.like, undefined);
});

test('a reaction before its post is kept and drawn once the post arrives; reactionsFor groups in key order', () => {
    const { feed } = harness();
    feed.apply('kofi', own('kofi', 0, 2, 'kofi_x', { reactions: [rx('ivy_vent', 'kofi', 'angry')] }));
    feed.apply('mei', own('mei', 0, 3, 'mei_x', { reactions: [rx('ivy_vent', 'mei', 'like')] }));
    feed.apply('ivy', own('ivy', 0, 1, 'ivy_vent'));
    assert.deepEqual(feed.reactionsFor('ivy_vent').map((g) => g.key), ['like', 'angry']);
});

test('the Friendface phone listens to npc_posted only: no listener matches npc_reacted', () => {
    const src = readFileSync(join(root, 'public/break_escape/js/systems/friendface-phone.js'), 'utf8');
    assert.ok(!src.includes('npc_reacted'));
    const names = [...src.matchAll(/['"`](npc_[a-z_]*)[:*'"`]/g)].map((m) => m[1]);
    assert.ok(names.every((n) => !'npc_reacted'.startsWith(n) || n === ''), names.join(','));
});

// ── Pixel-art UI rule for the reaction chips (plan sections 4 and 11) ─────────────────────────
function reactionRules() {
    const css = readFileSync(join(root, 'public/break_escape/css/osint-browser-minigame.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const rules = [];
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const sels = m[1].split(',').map((x) => x.trim()).filter(Boolean);
        if (!sels.some((x) => x.includes('.ob-reaction'))) continue;
        const decls = {};
        for (const d of m[2].split(';')) {
            const i = d.indexOf(':');
            if (i > 0) decls[d.slice(0, i).trim()] = d.slice(i + 1).trim();
        }
        rules.push({ sels, decls });
    }
    return rules;
}
const ruleFor = (rules, sel) => rules.find((r) => r.sels.includes(sel));

test('CSS: the .ob-reaction* rules follow the pixel-art UI rule', () => {
    const rules = reactionRules();
    assert.ok(rules.length >= 5, 'rules found');
    const fontOk = /^var\(--(se-font-[a-z-]+|ui-heading-font)(, *('GNF'|'Press Start 2P'|'VT323'))?, *monospace\)$|^('GNF'|'Press Start 2P'|'VT323')(, *monospace)?$/;
    for (const { sels, decls } of rules) {
        const where = sels.join(', ');
        for (const [prop, val] of Object.entries(decls)) {
            if (prop === 'border-radius') assert.match(val, /^0(px)?$/, `${where} ${prop}`);
            if (prop === 'box-shadow') assert.equal(val, 'none', `${where} has a box-shadow`);
            assert.ok(!/gradient/.test(val), `${where} ${prop} has a gradient`);
            assert.notEqual(prop, 'border-image', `${where} has a border-image`);
            if (/^(border(-(top|right|bottom|left))?|outline)$/.test(prop) && !/^(none|0)$/.test(val)) {
                assert.match(val, /^2px solid /, `${where} ${prop}: 2px solid`);
            }
            if (/^(border(-(top|right|bottom|left))?-width|outline-width)$/.test(prop)) assert.match(val, /^(0|2px)$/, `${where} ${prop}`);
            if (prop === 'font-family') assert.match(val, fontOk, `${where} font-family ${val}`);
            if (prop === 'font') assert.fail(`${where} uses the font shorthand`);
        }
    }
    const focus = ruleFor(rules, '.ob-reaction:focus-visible');
    assert.ok(focus, 'a :focus-visible rule');
    assert.match(focus.decls.outline, /^2px solid var\(--ui-accent/);
    const icon = ruleFor(rules, '.ob-reaction-icon');
    assert.equal(icon.decls['image-rendering'], 'pixelated');
    assert.equal(icon.decls.width, '32px');
    assert.equal(icon.decls.height, '32px');
    const open = ruleFor(rules, '.ob-reaction[data-open]');
    assert.ok(open, '.ob-reaction[data-open] exists');
    assert.match(open.decls.border, /^2px solid var\(--ui-accent/);
    assert.ok(!open.decls['box-shadow'] || open.decls['box-shadow'] === 'none');
    const chip = ruleFor(rules, '.ob-reaction');
    assert.equal(chip.decls['min-width'], '40px');
    assert.equal(chip.decls['min-height'], '40px');
    const line = ruleFor(rules, '.ob-reaction-names');
    assert.ok(line.decls['min-height'], 'one line reserved');
    for (const p of ['height', 'max-height']) assert.equal(line.decls[p], undefined, `no ${p} on the names line`);
    assert.notEqual(line.decls.overflow, 'hidden');
    assert.notEqual(line.decls['white-space'], 'nowrap');
});

// q80 (user, 2026-11-12): the 16x16 icons show at a whole 2x, so never below 32px
test('CSS: no rule draws a reaction icon below 32px or at a scale that is not a whole multiple of 16px', () => {
    const rules = reactionRules().filter((r) => r.sels.some((x) => /\.ob-reaction-icon|\.ob-reaction\b.*\bimg\b/.test(x)));
    assert.ok(rules.length >= 1, 'an icon rule');
    for (const { sels, decls } of rules) {
        const where = sels.join(', ');
        for (const prop of ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height']) {
            if (decls[prop] === undefined || decls[prop] === 'none') continue;
            const m = /^(\d+)px$/.exec(decls[prop]);
            assert.ok(m, `${where} ${prop}: ${decls[prop]} must be whole px`);
            assert.ok(Number(m[1]) >= 32, `${where} ${prop}: ${decls[prop]} is below 32px`);
            assert.equal(Number(m[1]) % 16, 0, `${where} ${prop}: ${decls[prop]} is not a whole scale of 16px`);
        }
        for (const prop of ['transform', 'zoom', 'scale']) assert.equal(decls[prop], undefined, `${where} has ${prop}`);
        if (decls.flex !== undefined) assert.equal(decls.flex, 'none', `${where} flex lets the icon shrink`);
        if (decls['flex-shrink'] !== undefined) assert.equal(decls['flex-shrink'], '0', `${where} flex-shrink`);
    }
    // the chip fits the icon: 32px plus 2px padding and a 2px border on each side
    const chip = ruleFor(reactionRules(), '.ob-reaction');
    const pad = chip.decls.padding.split(/\s+/).map((v) => parseInt(v, 10));
    assert.ok(parseInt(chip.decls['min-height'], 10) >= 32 + 2 * pad[0] + 2 * 2, 'chip min-height fits the icon');
    assert.equal(chip.decls['box-sizing'], 'border-box');
    // the PNGs stay 16x16 (never resampled): read the IHDR
    for (const key of ['like', 'laugh', 'sad', 'angry']) {
        const png = readFileSync(join(root, `public/break_escape/assets/icons/reaction-${key}.png`));
        assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [16, 16], `reaction-${key}.png is 16x16`);
    }
});
