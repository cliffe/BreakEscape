// Cross-side sanitiser behaviour (SYNC_DELTAS_PLAN 2.1, 3.7 "Behaviour").
// The committed fixture test/fixtures/files/sync_bodies/sanitiser_cases.json holds
// inputs that trip every clip/sanitiser rule and the output the server stores for
// each. This node test runs the client clips (clipMailMessage, clipMailThread,
// clipMailDrafts, the phone export and exportNpcInkVariables) over those inputs and
// asserts the same stored output by stableJson. The Rails unit test
// (test/models/break_escape/sanitiser_cases_test.rb) runs the server sanitisers over
// the same inputs and asserts the same outputs. Neither test writes the fixture;
// scratchpad/gen_sanitiser_fixture.rb generated it once from the server.
// Run with: node --test test/js/sanitiser-cases.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'sanitiser-cases-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('config.js', 'config.mjs');
copy('api-client.js', 'api-client.mjs', s => s.replace(/'\.\/config\.js'/g, "'./config.mjs'"));
copy('state-sync.js', 'state-sync.mjs', s => s.replace(/'\.\/(api-client|config)\.js'/g, "'./$1.mjs'"));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/mail-scheduler.js', 'mail-scheduler.mjs', s => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('systems/npc-conversation-state.js', 'npc-conversation-state.mjs');
copy('systems/npc-los.js', 'npc-los.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/npc-manager.js', 'npc-manager.mjs', s => s.replace("'./npc-los.js'", "'./npc-los.mjs'")
  .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { querySelector: () => null };

const { clipMailMessage, clipMailThread, clipMailDrafts } = await import(pathToFileURL(join(dir, 'mail-scheduler.mjs')).href);
const { stableJson } = await import(pathToFileURL(join(dir, 'state-sync.mjs')).href);
const { default: npcConversationState } = await import(pathToFileURL(join(dir, 'npc-conversation-state.mjs')).href);
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);

const fixture = JSON.parse(readFileSync(
  join(here, '../fixtures/files/sync_bodies/sanitiser_cases.json'), 'utf8'));

const eq = (a, b, msg) => assert.equal(stableJson(a), stableJson(b), msg);

test('mail messages: clipMailMessage matches the server-stored form', () => {
  for (const c of fixture.mailMessages) {
    const got = clipMailMessage(c.key, c.input);
    if (c.notStored) assert.equal(got, undefined, `${c.name}: not stored`);
    else eq(got, c.stored, c.name);
  }
});

test('mail threads: clipMailThread matches the server-stored form', () => {
  for (const c of fixture.mailThreads) {
    const got = clipMailThread(c.key, c.input);
    if (c.notStored) assert.equal(got, undefined, `${c.name}: not stored`);
    else eq(got, c.stored, c.name);
  }
});

test('mail drafts: clipMailDrafts matches the server-stored form', () => {
  for (const c of fixture.mailDrafts) {
    eq(clipMailDrafts(c.input), c.stored, c.name);
  }
});

test('ink variables: exportNpcInkVariables matches merge_npc_ink_variables!', () => {
  for (const c of fixture.inkVariables) {
    // isGlobalVariable reads no globals here, so a plain var name is kept.
    npcConversationState.conversationStates = new Map();
    npcConversationState.declaredGlobalNames = null;
    for (const [npcId, vars] of Object.entries(c.input)) {
      npcConversationState.conversationStates.set(npcId, { variables: { ...vars } });
    }
    eq(npcConversationState.exportNpcInkVariables(), c.stored, c.name);
  }
});

test('phone entries: exportPhoneState matches sanitize_phone_state_entry', () => {
  for (const c of fixture.phoneEntries) {
    const mgr = Object.create(NPCManager.prototype);
    mgr.npcs = new Map();
    mgr.conversationHistory = new Map();
    mgr._savedPhoneState = new Map();
    mgr._phoneStateSent = new Map();
    const e = c.input;
    const npc = {
      id: c.npcId, npcType: 'phone',
      storyState: e.storyState, storyPath: e.storyPath,
      currentKnot: e.currentKnot, lastEnteredKnot: e.lastEnteredKnot, preloadedKnot: e.preloadedKnot,
      deferredTags: e.deferredTags, deferredGlobals: e.deferredGlobals, deferredGlobalsBase: e.deferredGlobalsBase
    };
    mgr.npcs.set(c.npcId, npc);
    mgr.conversationHistory.set(c.npcId, Array.isArray(e.history) ? e.history : []);
    const out = mgr.exportPhoneState();
    if (c.notStored) assert.equal(c.npcId in out, false, `${c.name}: not exported`);
    else eq(out[c.npcId], c.stored, c.name);
  }
});
