// Phone chat applies a line's state tags as ink continues, not after the whole batch (F16).
// Before, continueStory / handleChoice collected every line up to the next choices and ran
// the tags afterwards, so a #set_global on an early line had not reached the story's
// variables or the game's globals when a later line of the same batch was evaluated
// (m09 dialogue review R2 m1).
// continueStory, handleChoice and _applyLineTags are lifted out of the source and run on stubs;
// the stub story reads the global at each continue(), as ink does for a conditional.
// Run with: node --test test/js/phone-chat-line-tags.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
const { phoneStepLines } = await import(join(js, 'minigames/phone-chat/phone-chat-speaker.js'));
const { partitionSlowTags } = await import(join(js, 'minigames/person-chat/person-chat-pending-reply.js'));
console.log = () => {};
console.trace = () => {};

const INJECT = ['phoneStepLines', 'processGameActionTags', 'partitionSlowTags'];
function method(name, deps, isAsync = true) {
    const m = src.match(new RegExp(`\\n    ${isAsync ? 'async ' : ''}${name}\\(([^)]*)\\) \\{\\n([\\s\\S]*?)\\n    \\}\\n`));
    assert.ok(m, `${name} found`);
    const factory = new Function(...INJECT, `return ${isAsync ? 'async ' : ''}function (${m[1]}) {\n${m[2]}\n};`);
    return factory(...INJECT.map(k => deps[k]));
}
const tick = () => new Promise(r => setTimeout(r, 0));

// A story whose line 2 depends on the global line 1 set: "(flag ? B : A)"
function story(globals, { lines }) {
    let i = 0;
    // The story's own copy of the variables: it only changes when the minigame pushes into it
    const local = { ...globals };
    return {
        npcId: 'hax',
        engine: { story: { variablesState: new Proxy(local, {
            get: (t, k) => k === 'GlobalVariableExistsWithName' ? (n => n in t) : t[k],
            set: (t, k, v) => { t[k] = v; return true; } }) } },
        continue() {
            const line = lines[i++](local);
            const last = i >= lines.length;
            return { text: line.text, tags: line.tags || [], choices: last ? [{ text: 'ok', index: 0 }] : [], canContinue: !last };
        },
        makeChoice() { return this.continue(); }
    };
}

function harness({ slowDelay = 0 } = {}) {
    const globals = {};
    globalThis.window = { currentConversationNPCId: 'hax', gameState: { globalVariables: globals } };
    const applied = [];
    const deps = {
        phoneStepLines, partitionSlowTags,
        processGameActionTags: async (tags) => {
            for (const tag of tags) {
                const [action, name, value] = tag.split(':');
                if (action === 'give_item') await new Promise(r => setTimeout(r, slowDelay));
                if (action === 'set_global') globals[name] = value === 'true';
                applied.push(tag);
            }
        }
    };
    const mg = {
        conversation: null, isConversationActive: true, currentNPCId: 'hax',
        presented: [], kept: [],
        ui: { elements: { choicesContainer: { querySelectorAll: () => [{ dataset: { text: 'Go' } }] } },
              addMessage() {}, clearChoices() {} },
        history: { addMessage() {} },
        _tagOptions() { return {}; },
        _pretext: null,
        _saveStoryStateFor() {},
        async _presentOutput(messages, tags, last, opts) { this.presented.push({ messages, tags, opts }); },
        _keepOutputAfterTeardown(npcId, conv, messages, tags) { this.kept.push({ messages, tags }); }
    };
    mg._applyLineTags = method('_applyLineTags', deps, false);
    mg._pushSetGlobalsToStory = method('_pushSetGlobalsToStory', deps, false);
    mg.continueStory = method('continueStory', deps);
    mg.handleChoice = method('handleChoice', deps);
    return { mg, globals, applied };
}

test('continueStory: a #set_global on line 1 is in place when line 2 is evaluated', async () => {
    const { mg, globals } = harness();
    globals.primed = false;
    mg.conversation = story(globals, { lines: [
        () => ({ text: 'Opening.', tags: ['set_global:primed:true'] }),
        g => ({ text: g.primed ? 'You are primed.' : 'Not primed.' }),
        g => ({ text: g.primed ? 'Still primed.' : 'Still not.' })
    ] });
    await mg.continueStory();
    assert.deepEqual(mg.presented[0].messages, ['Opening.', 'You are primed.', 'Still primed.']);
    assert.equal(mg.presented[0].opts.tagsApplied, true, 'the batch tags are not run a second time');
});

test('handleChoice: the reply batch applies tags line by line, including the first line', async () => {
    const { mg, globals, applied } = harness();
    globals.chosen = false;
    mg.conversation = story(globals, { lines: [
        () => ({ text: 'Done.', tags: ['set_global:chosen:true'] }),
        g => ({ text: g.chosen ? 'Saw it.' : 'Missed it.' }),
        () => ({ text: 'End.', tags: ['set_global:later:true'] })
    ] });
    // handleChoice stops its own typeout loop on the stub ui; we only look at the tag order
    mg.ui.addChoices = () => {};
    mg._showStoryLine = async () => true;
    mg.saveStoryState = () => {};
    mg.complete = () => {};
    mg.isConversationActive = true;
    await mg.handleChoice(0);
    assert.deepEqual(applied, ['set_global:chosen:true', 'set_global:later:true'], 'each tag ran once, in order');
    assert.equal(globals.chosen, true);
});

test('give_item is a slow tag: a set_global after it, on the next line, does not wait', async () => {
    const { mg, globals, applied } = harness({ slowDelay: 20 });
    globals.got = false;
    mg.conversation = story(globals, { lines: [
        () => ({ text: 'Here.', tags: ['give_item:key', 'set_global:got:true'] }),
        g => ({ text: g.got ? 'Got it.' : 'Nothing.' })
    ] });
    await mg.continueStory();
    assert.deepEqual(mg.presented[0].messages, ['Here.', 'Got it.']);
    assert.deepEqual(applied, ['set_global:got:true'], 'give_item still pending');
    await new Promise(r => setTimeout(r, 40));
    assert.deepEqual(applied, ['set_global:got:true', 'give_item:key'], 'then it lands, once');
});

test('a tag that closes the phone mid-batch: the rest of the lines are kept and no tag runs twice', async () => {
    const { mg, globals, applied } = harness();
    const conv = story(globals, { lines: [
        () => { mg.conversation = null; return { text: 'On my way.', tags: ['set_global:cutscene:true'] }; },
        () => ({ text: 'Second.' })
    ] });
    mg.conversation = conv;
    await mg.continueStory();
    assert.equal(mg.presented.length, 0, 'nothing typed into the closed phone');
    assert.deepEqual(mg.kept[0].messages, ['On my way.', 'Second.']);
    assert.deepEqual(mg.kept[0].tags, [], 'tags already applied are not handed over again');
    assert.deepEqual(applied, ['set_global:cutscene:true']);
});

// A preloaded opening (the first text from a contact, read before the thread is opened) is
// a dry run: its tags wait for the first open. Its later lines still have to see them (F16).
test('preload dry run: set_global tags are mirrored into the temp story only', async () => {
    globalThis.window = { npcConversationStateManager: { isReadOnlyGlobal: n => n === 'locked_in' } };
    const { default: PhoneChatConversation } = await import(join(js, 'minigames/phone-chat/phone-chat-conversation.js'));
    const store = { primed: false, count: 0, name: 'a', locked_in: 1 };
    const story = { variablesState: new Proxy(store, {
        get: (t, k) => k === 'GlobalVariableExistsWithName' ? (n => n in t) : t[k],
        set: (t, k, v) => { t[k] = v; return true; }
    }) };
    PhoneChatConversation.mirrorSetGlobalTags(story, [
        'set_global:primed:true', 'set_global:count:3', 'set_global:name:bob',
        'set_global:undeclared:true', 'set_global:locked_in:2', 'speaker:npc', 'give_item:key']);
    assert.deepEqual(store, { primed: true, count: 3, name: 'bob', locked_in: 1 });
    PhoneChatConversation.mirrorSetGlobalTags(null, ['set_global:primed:false']);   // no story: no throw
    PhoneChatConversation.mirrorSetGlobalTags(story, undefined);
    assert.equal(window.gameState, undefined, 'the game globals are not written');
});
