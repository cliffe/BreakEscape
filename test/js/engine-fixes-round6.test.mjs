// Engine fixes, round 6 (2026-10-18), from the m06 and m08 round-4 confirmation runs:
// the phone hit notice over the KO screen (m06 M1), a bark repeating the open thread
// (m06 M2), a choice that closes the phone offered again on reopen (m06 M3), the Add to
// Notepad icon (m08), and a KO'd NPC restored facing down (m08).
// Run with: node --test test/js/engine-fixes-round6.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../../public/break_escape');
const js = join(pub, 'js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const read = (rel) => readFileSync(join(js, rel), 'utf8');

// One method of a class body (4-space or 2-space indent) as [params, body]
function methodParts(src, name, indent = '    ') {
    const re = new RegExp(`\\n${indent}(?:async )?${name}\\(((?:[^()]|\\([^()]*\\))*)\\) \\{\\n([\\s\\S]*?)\\n${indent}\\}\\n`);
    const m = src.match(re);
    assert.ok(m, `${name} found`);
    const params = m[1].split(',').map(s => s.split('=')[0].trim()).filter(Boolean);
    return [params, m[2]];
}

// ---------------------------------------------------------------- m06 M1

const interrupt = await import(dataUrl(read('systems/player-damage-interrupt.js')));

function toastStub() {
    const parent = { removed: [], removeChild(el) { this.removed.push(el); el.parentNode = null; } };
    const el = { parentNode: parent, classes: new Set(['show']) };
    el.classList = { remove: (c) => el.classes.delete(c) };
    return { el, parent };
}
const phone = () => ({ currentMinigame: { _sceneType: 'phone-chat', params: {}, complete() {} } });
const wait = (ms) => new Promise(r => setTimeout(r, ms));

test('m06 M1: the knockout hit takes the phone hit notice down', async () => {
    const { el, parent } = toastStub();
    interrupt.closeMinigameOnDamage(5, { framework: phone(), notify: () => el, hp: 1, maxHP: 100 });
    assert.equal(parent.removed.length, 0, 'an ordinary hit leaves the notice up');
    interrupt.closeMinigameOnDamage(5, { framework: phone(), notify: () => null, ko: true });
    assert.equal(el.classes.has('show'), false, 'slides out at once');
    await wait(350);
    assert.deepEqual(parent.removed, [el]);
});

test('m06 M1: the KO screen and a phone closed by Esc take the notice down too', async () => {
    let t = toastStub();
    interrupt.closeMinigameOnDamage(5, { framework: phone(), notify: () => t.el, hp: 40, maxHP: 100 });
    interrupt.closeMinigameForKnockout({ framework: { currentMinigame: null } });
    await wait(350);
    assert.deepEqual(t.parent.removed, [t.el], 'KO screen with nothing open');

    t = toastStub();
    interrupt.closeMinigameOnDamage(5, { framework: phone(), notify: () => t.el, hp: 40, maxHP: 100 });
    assert.equal(interrupt.dismissPhoneHitNotice(), true);
    assert.equal(interrupt.dismissPhoneHitNotice(), false, 'nothing left to take down');
    await wait(350);
    assert.deepEqual(t.parent.removed, [t.el]);

    // The phone's cleanup (Esc, the KO close, a cutscene) calls it
    const cleanup = methodParts(read('minigames/phone-chat/phone-chat-minigame.js'), 'cleanup')[1];
    assert.match(cleanup, /window\.dismissPhoneHitNotice\?\.\(\)/);
});

// ---------------------------------------------------------------- m06 M2

const overlay = await import(dataUrl(read('utils/overlay-open.js')));
const { partitionSlowTags } = await import(dataUrl(read('minigames/person-chat/person-chat-pending-reply.js')));

function threadWin(npcId, lines, view = 'conversation') {
    const els = lines.map(t => ({ textContent: t }));
    return {
        MinigameFramework: { currentMinigame: {
            _sceneType: 'phone-chat', currentNPCId: npcId,
            ui: { getCurrentView: () => view, elements: { messagesContainer: { querySelectorAll: () => els } } }
        } }
    };
}

test('m06 M2: openPhoneThread reads the drawn lines of the open thread only', () => {
    const w = threadWin('hax', ["He's coming for you — Q for fists."]);
    const t = overlay.openPhoneThread(w, null);
    assert.equal(t.npcId, 'hax');
    assert.ok(t.keys.has(overlay.threadTextKey("He's coming for you -- Q for fists.")), 'dashes and quotes ignored');
    assert.equal(overlay.openPhoneThread(threadWin('hax', ['x'], 'contact-list'), null), null);
    assert.equal(overlay.openPhoneThread({ MinigameFramework: { currentMinigame: { _sceneType: 'person-chat' } } }, null), null);
});

// The bark system's two new methods, run on a stub with their imports supplied
const barksSrc = read('systems/npc-barks.js');
const shownParts = methodParts(barksSrc, '_shownInOpenThread', '  ');
const dismissParts = methodParts(barksSrc, 'dismissBarksForOpenThread', '  ');
function barkSystem(win, barks) {
    const openPhoneThread = () => overlay.openPhoneThread(win, null);
    const phoneBarkText = (text, contact) => String(text).replace(new RegExp(`^${contact.displayName}:\\s*`), '');
    const make = (parts) => new Function('openPhoneThread', 'threadTextKey', 'phoneBarkText',
        `return function(${parts[0].join(',')}) { if (arguments.length < 2 && ${parts[0].includes('thread')}) thread = openPhoneThread(); ${parts[1]} }`
    )(openPhoneThread, overlay.threadTextKey, phoneBarkText);
    const removed = [];
    const sys = {
        npcManager: { getNPC: (id) => ({ id, displayName: id === 'hax' ? 'Agent HaX' : id }) },
        container: { querySelectorAll: () => barks },
        _removeBark: (el) => { removed.push(el); el._removing = true; }
    };
    sys._shownInOpenThread = make(shownParts);
    sys.dismissBarksForOpenThread = make(dismissParts);
    return { sys, removed };
}

test('m06 M2: a bark already on screen goes when its contact\'s thread opens', () => {
    const fight = { _npcId: 'hax', _barkText: "He's coming for you, and he won't wait while you read this." };
    const other = { _npcId: 'irina', _barkText: 'Meet me on the trading floor.' };
    const echo = { _npcId: 'netherton', _barkText: 'Car is round the back.' };
    const win = threadWin('hax', ["He's coming for you, and he won't wait while you read this.", 'Car is round the back.']);
    const { sys, removed } = barkSystem(win, [fight, other, echo]);
    assert.equal(sys.dismissBarksForOpenThread(), 2);
    assert.deepEqual(removed, [fight, echo], 'same contact, and a line the thread shows; others stay');
});

test('m06 M2: a bark repeating a line the open thread shows is not shown', () => {
    const win = threadWin('hax', ["He's coming for you, and he won't wait while you read this."]);
    const { sys } = barkSystem(win, []);
    assert.equal(sys._shownInOpenThread({ npcId: 'hax', text: "He's coming for you, and he won't wait while you read this." }), true);
    assert.equal(sys._shownInOpenThread({ npcId: 'hax', text: 'Agent HaX: He’s coming for you, and he won’t wait while you read this.' }), true);
    assert.equal(sys._shownInOpenThread({ npcId: 'irina', text: 'Something new.' }), false);
    // Wired: checked on arrival and again at render; the phone calls the dismissal on open
    assert.match(barksSrc.slice(barksSrc.indexOf('  showBark('), barksSrc.indexOf('_shouldDefer(payload)')), /_shownInOpenThread\(payload\)/);
    assert.match(barksSrc.slice(barksSrc.indexOf('async _renderBark('), barksSrc.indexOf('_startAutoClose(el, ms)')), /_shownInOpenThread\(payload\)/);
    const open = methodParts(read('minigames/phone-chat/phone-chat-minigame.js'), 'openConversation')[1];
    assert.match(open, /barkSystem\?\.dismissBarksForOpenThread\?\.\(\)/);
});

// ---------------------------------------------------------------- m06 M3

const phoneSrc = read('minigames/phone-chat/phone-chat-minigame.js');

function phoneUnderTest({ closeDuringChoice }) {
    const [params, body] = methodParts(phoneSrc, 'handleChoice');
    const tagsRun = [];
    const processGameActionTags = (tags, ui) => { tagsRun.push({ tags, ui }); };
    const phoneStepLines = (text) => (text ? [text] : []);
    const handleChoice = new Function('processGameActionTags', 'phoneStepLines', 'delay',
        `return (async function(${params.join(',')}) { ${body} });`);
    const npc = { id: 'hax', storyState: 'BEFORE' };
    const history = [];
    let position = 'extract_confirm';
    const conversation = {
        makeChoice() {
            position = 'hub';
            // ~ start_debrief_cutscene = true: the global's mapping opens the debrief and
            // the phone is torn down before makeChoice returns
            if (closeDuringChoice) self.cleanup();
            return { text: 'See you at HQ.', tags: ['complete_task:call_in_after_sweep'], canContinue: false, choices: [{ text: 'hub' }] };
        },
        continue() { throw new Error('not reached'); },
        saveState: () => `AT:${position}`,
        engine: {}
    };
    const button = { dataset: { text: 'On my way.' } };
    const self = {
        conversation, currentNPCId: 'hax', isConversationActive: true, phoneId: 'player_phone',
        npcManager: { getNPC: () => npc, addMessage: (id, type, text) => history.push({ id, type, text }) },
        history: { addMessage() {} },
        ui: {
            elements: { choicesContainer: { querySelectorAll: () => [button] } },
            addMessage() {}, clearChoices() {}, addChoices() {}, showNotification() {}
        },
        cleanup() { this.conversation = null; this.isConversationActive = false; this.ui = { elements: {} }; },
        _showStoryLine: async () => true,
        saveStoryState() { this._saveStoryStateFor(this.currentNPCId, this.conversation); },
        complete() {}
    };
    // handleChoice applies each line's tags through _applyLineTags (F16), which uses
    // partitionSlowTags and _pushSetGlobalsToStory
    for (const name of ['_saveStoryStateFor', '_keepOutputAfterTeardown', '_tagOptions', '_applyLineTags', '_pushSetGlobalsToStory']) {
        const [p, b] = methodParts(phoneSrc, name);
        self[name] = new Function('processGameActionTags', 'partitionSlowTags', `return function(${p.join(',')}) { ${b} }`)(processGameActionTags, partitionSlowTags);
    }
    return { self, npc, history, tagsRun, run: (i) => handleChoice(processGameActionTags, phoneStepLines, () => Promise.resolve()).call(self, i) };
}

test('m06 M3: a choice whose own output closes the phone is saved as taken', async () => {
    globalThis.window = {};
    const t = phoneUnderTest({ closeDuringChoice: true });
    await t.run(0);
    assert.equal(t.npc.storyState, 'AT:hub', 'the story position after the choice, not before it');
    assert.deepEqual(t.history, [{ id: 'hax', type: 'npc', text: 'See you at HQ.' }], 'the reply goes to the thread');
    assert.deepEqual(t.tagsRun, [{ tags: ['complete_task:call_in_after_sweep'], ui: null }], 'its tags still run');
});

test('m06 M3: an ordinary choice is unchanged', async () => {
    globalThis.window = {};
    const t = phoneUnderTest({ closeDuringChoice: false });
    await t.run(0);
    assert.equal(t.npc.storyState, 'AT:hub');
    assert.deepEqual(t.history, [], 'typed into the open thread, not added behind it');
    assert.equal(t.tagsRun.length, 1);
    assert.notEqual(t.tagsRun[0].ui, null);
});

// ---------------------------------------------------------------- m08 icon

test('m08: Add to Notepad uses the 16 px notes icon, drawn at its own size', () => {
    for (const rel of ['minigames/text-file/text-file-minigame.js', 'minigames/phone-chat/phone-chat-minigame.js',
        'minigames/container/container-minigame.js', 'minigames/password/password-minigame.js',
        'minigames/vm-launcher/vm-launcher-minigame.js']) {
        const src = read(rel);
        assert.ok(!src.includes('notes-sm.png'), `${rel}: no 9 px icon blown up to a white square`);
        assert.match(src, /icons\/notes\.png" alt="Notepad" class="icon-small/);
    }
    // notes.png is 16x16, and .icon-small draws at 16x16
    const png = readFileSync(join(pub, 'assets/icons/notes.png'));
    assert.equal(png.readUInt32BE(16), 16);
    assert.equal(png.readUInt32BE(20), 16);
    assert.match(readFileSync(join(pub, 'css/utilities.css'), 'utf8'), /\.icon-small \{\s*width: 16px;\s*height: 16px;/);
});

// ---------------------------------------------------------------- m08 KO facing

test('m08: a KO saves the facing it fell in and a reload restores it', async () => {
    globalThis.window = { eventDispatcher: { emit() {} }, gameState: { globalVariables: {} } };
    const configUrl = dataUrl(read('config/combat-config.js'));
    const eventsUrl = dataUrl(read('events/combat-events.js'));
    const src = read('systems/npc-hostile.js')
        .split("'../config/combat-config.js'").join(`'${configUrl}'`)
        .split("'../events/combat-events.js'").join(`'${eventsUrl}'`)
        .split("'./npc-sprites.js'").join(`'${dataUrl('export const getNPCDirection = () => "down-right";')}'`);
    const fresh = async () => (await import(dataUrl(src + `\n// ${Math.random()}`))).initNPCHostileSystem();

    const sys = await fresh();
    const sprite = { anims: { isPlaying: false, stop() {} }, scene: { anims: { exists: () => false } }, body: null,
        on() {}, once() {}, setVisible() {} };
    window.npcManager = { getNPC: () => ({ id: 'athena', _sprite: sprite }) };
    sys.setNPCHostile('athena', true);
    sys.damageNPC('athena', 10_000);
    assert.deepEqual(sys.exportHostility().athena, { hostile: true, ko: true, facing: 'down-right' });
    assert.equal(sys.getKOFacing('athena'), 'down-right');

    const after = await fresh();
    after.restoreHostility({ athena: { hostile: true, ko: true, facing: 'down-right' },
        old_save: { hostile: true, ko: true }, junk: { hostile: true, ko: true, facing: 'sideways' } });
    assert.equal(after.getKOFacing('athena'), 'down-right');
    assert.equal(after.getKOFacing('old_save'), null, 'a save from before this has no facing');
    assert.equal(after.getKOFacing('junk'), null);

    // npc-sprites.js lays a restored KO in the saved facing before reading the sprite
    assert.match(read('systems/npc-sprites.js'), /getKOFacing\?\.\(npc\.id\) \|\| getNPCDirection\(npc\.id, sprite\)/);
});
