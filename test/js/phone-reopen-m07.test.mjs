// The real m07 phone json: the submenu choices sit in `= menu` stitches (R4 m3), and a save
// taken against the pre-restructure json (20a495720) reopens in the new one (R4 m2).
// Run with: node --test test/js/phone-reopen-m07.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'phone-reopen-m07-test-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/npc-los.js', 'npc-los.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs',
    s => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: PhoneChatConversation } = await import(pathToFileURL(join(dir, 'phone-chat-conversation.mjs')).href);

const load = p => JSON.parse(readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const newJson = load(join(here, '../../scenarios/m07_architects_gambit/ink/m07_phone_agent_0x99.json'));
// m07_phone_agent_0x99.json as committed at 20a495720, before the submenu choices moved into `= menu`
const oldJson = load(join(here, 'fixtures/m07_phone_agent_0x99_pre_menu_stitch.json'));

const syncGlobals = story => {
    for (const [k, v] of Object.entries(window.gameState.globalVariables)) {
        if (story.variablesState.GlobalVariableExistsWithName(k)) story.variablesState[k] = v;
    }
};

// ink container: [content..., {named: {...}}]
const named = container => {
    const last = container[container.length - 1];
    return last && typeof last === 'object' && !Array.isArray(last) ? last : {};
};
const countChoices = node => JSON.stringify(node).split('"*":').length - 1;

test('R4 m3: each m07 submenu keeps its choices in a `menu` stitch, not in the knot container', () => {
    for (const knot of ['people_topics', 'vault_finds', 'stuck_topics']) {
        const k = newJson.root[2][knot];
        assert.ok(Array.isArray(k), `${knot} exists`);
        const stitch = named(k).menu;
        assert.ok(Array.isArray(stitch), `${knot} has a menu stitch`);
        assert.ok(countChoices(stitch) >= 2, `${knot}.menu holds the choices`);
        const topLevel = k.slice(0, -1);
        assert.equal(countChoices(topLevel), 0, `${knot} knot top owns no choices`);
    }
});

test('R4 m3: the stuck_topics menu stitch drops a hint once its flag flips', async () => {
    const run = async flag3 => {
        globalThis.window = { gameState: { globalVariables: { flag2_submitted: true, flag3_submitted: flag3 } } };
        const conv = new PhoneChatConversation('hax', { getNPC: () => null }, new InkEngine('hax'));
        await conv.loadStory(newJson);
        syncGlobals(conv.engine.story);
        const story = conv.engine.story;
        story.variablesState.submenu_from_hub = true;
        story.ChoosePathString('stuck_topics');
        while (story.canContinue) story.Continue();
        return story.currentChoices.map(c => c.text);
    };
    const before = await run(false);
    const after = await run(true);
    assert.ok(before.some(t => /Now what\?/.test(t)), `got ${JSON.stringify(before)}`);
    assert.ok(!after.some(t => /Now what\?/.test(t)), `got ${JSON.stringify(after)}`);
});

// The menu each submenu shows with these globals (flag2 only for the save; flag3/hollis_ko on reopen).
const EXPECTED_MENU = {
    stuck_topics: ["I've got a username and a password. Now what?", 'Never mind.'],
    people_topics: ['Never mind.'],
    vault_finds: ['Never mind.'],
};

test('R4 m2: a save taken on an old-layout submenu reopens in the new json without throwing', async () => {
    for (const knot of ['stuck_topics', 'people_topics', 'vault_finds']) {
        globalThis.window = { gameState: { globalVariables: { flag2_submitted: true } } };
        const oldConv = new PhoneChatConversation('hax', { getNPC: () => null }, new InkEngine('hax'));
        await oldConv.loadStory(oldJson);
        syncGlobals(oldConv.engine.story);
        oldConv.engine.story.variablesState.submenu_from_hub = true;
        oldConv.engine.story.ChoosePathString(knot);
        while (oldConv.engine.story.canContinue) oldConv.engine.story.Continue();
        const oldTexts = oldConv.engine.story.currentChoices.map(c => c.text);
        const saved = oldConv.saveState();

        // a global lands, so the reopen has something to re-run for
        globalThis.window = { gameState: { globalVariables: { flag2_submitted: true, flag3_submitted: true, hollis_ko: true } } };
        const conv = new PhoneChatConversation('hax', { getNPC: () => null }, new InkEngine('hax'));
        await conv.loadStory(newJson);
        let out;
        assert.doesNotThrow(() => {
            conv.restoreState(saved);
            out = conv.reopenWithCurrentGlobals(syncGlobals, { homeKnot: 'start' });
        }, `${knot}`);
        assert.ok(out && typeof out.renavigated === 'boolean', `${knot}: ${JSON.stringify(out)}`);
        // the thread must come back on the same visible submenu, not a different knot's menu
        const texts = conv.engine.story.currentChoices.map(c => c.text);
        assert.deepEqual(oldTexts, EXPECTED_MENU[knot], `${knot}: old save menu`);
        assert.deepEqual(texts, EXPECTED_MENU[knot], `${knot}: reopened menu, got ${JSON.stringify(texts)}`);
    }
});
