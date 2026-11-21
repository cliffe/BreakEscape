// pcPostitNoteNow (systems/requires-item-hint.js): the sticky note a plain PC shows in the shared
// sign-in view in some states (ca09's Chidi). Run with: node --test test/js/pc-postit-note-now.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pcPostitNoteNow } from '../../public/break_escape/js/systems/requires-item-hint.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const COND = "globalVars.kit_ca09_note_up === true && globalVars.kit_ca09_note_choice !== 'mention'";
const LINE = "You stop before signing in. It isn't your account, but anyone walking past could use it.";
const pc = { type: 'pc', postitNoteVariants: [{ condition: COND, value: 'Tarrowby2468', submitText: LINE }] };

test('the note shows only while it is up and has not been mentioned away', () => {
  assert.equal(pcPostitNoteNow(pc, { kit_ca09_note_up: false, kit_ca09_note_choice: '' }), '');
  assert.equal(pcPostitNoteNow(pc, { kit_ca09_note_up: true, kit_ca09_note_choice: '' }), 'Tarrowby2468');
  assert.equal(pcPostitNoteNow(pc, { kit_ca09_note_up: true, kit_ca09_note_choice: 'fine' }), 'Tarrowby2468');
  assert.equal(pcPostitNoteNow(pc, { kit_ca09_note_up: true, kit_ca09_note_choice: 'mention' }), '');
});

test('only a plain PC with variants counts', () => {
  const g = { kit_ca09_note_up: true, kit_ca09_note_choice: '' };
  assert.equal(pcPostitNoteNow({ ...pc, lockType: 'login' }, g), '');
  assert.equal(pcPostitNoteNow({ ...pc, type: 'notes' }, g), '');
  assert.equal(pcPostitNoteNow({ type: 'pc', postitNote: 'x' }, g), '');   // the base note alone, or beside variants, is not read
  assert.equal(pcPostitNoteNow({ ...pc, postitNote: 'x' }, { kit_ca09_note_up: false }), '');
  assert.equal(pcPostitNoteNow({ ...pc, locked: true }, g), '');
  assert.equal(pcPostitNoteNow(null, g), '');
});

test('ca09 shell and its kit carry the same variants, and the sprite variant matches the note state', () => {
  const erb = JSON.parse(readFileSync(join(root, 'scenarios/ca09_passwords/scenario.json.erb'), 'utf8'));
  const o = erb.rooms.training_room.objects.find((x) => x.id === 'kit_ca09_pc');
  assert.deepEqual(o.postitNoteVariants, pc.postitNoteVariants);
  assert.ok(o.spriteVariants.some((v) => v.value === 'pc1_locked_note' && v.condition === COND));
  assert.ok(!/\{[a-z_]+\}/i.test(o.postitNoteVariants[0].value));
  const kit = JSON.parse(readFileSync(join(root, 'planning_notes/phishing_and_social_engineering/awareness/office_kits/tarrowby_logistics.json'), 'utf8'));
  const ko = kit.setPieces.ca09_note_on_screen.objects.find((x) => x.id === 'kit_ca09_pc');
  assert.deepEqual(ko.postitNoteVariants, o.postitNoteVariants);
});

// submitText: the line a submit shows in the post-it view (pcPostitSubmitText, password-minigame.js)
import { pcPostitSubmitText } from '../../public/break_escape/js/systems/requires-item-hint.js';
const pcSubmit = { type: 'pc', postitNoteVariants: [{ condition: COND, value: 'Tarrowby2468', submitText: LINE }] };
const UP = { kit_ca09_note_up: true, kit_ca09_note_choice: '' };

test('submitText comes from the matching variant only while the note is up', () => {
  assert.equal(pcPostitSubmitText(pcSubmit, UP), LINE);
  assert.equal(pcPostitSubmitText(pcSubmit, { kit_ca09_note_up: false }), '');
  assert.equal(pcPostitSubmitText(pcSubmit, { ...UP, kit_ca09_note_choice: 'mention' }), '');
  const bare = { type: 'pc', postitNoteVariants: [{ condition: COND, value: 'Tarrowby2468' }] };
  assert.equal(pcPostitSubmitText(bare, UP), '');   // a variant without submitText is refused...
  assert.equal(pcPostitNoteNow(bare, UP), '');      // ...note and line alike (the engine falls back)
  assert.equal(pcPostitSubmitText({ type: 'pc', lockType: 'login', postitNoteVariants: pcSubmit.postitNoteVariants }, UP), '');
});

test('ca09 shell and kit carry the submitText', () => {
  const erb = JSON.parse(readFileSync(join(root, 'scenarios/ca09_passwords/scenario.json.erb'), 'utf8'));
  const o = erb.rooms.training_room.objects.find((x) => x.id === 'kit_ca09_pc');
  assert.equal(o.postitNoteVariants[0].submitText, LINE);
});

async function loadMinigame() {
  globalThis.window = globalThis.window || { breakEscapeConfig: { gameId: 1 } };
  globalThis.document = globalThis.document || { addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; }, head: { appendChild() {} }, body: { appendChild() {} }, createElement() { return { style: {}, appendChild() {}, setAttribute() {}, addEventListener() {} }; } };
  const mod = await import('../../public/break_escape/js/minigames/password/password-minigame.js');
  return mod.PasswordMinigame;
}

function fakeView(PM, gameData) {
  const shown = [];
  const kinds = [];
  const calls = { validate: 0 };
  const view = {
    gameState: { isActive: true }, gameData, lockKey: null, passwordField: { value: 'Tarrowby2468' },
    showScreenMessage: (t, o) => { shown.push(t); kinds.push(o?.kind); }, validatePasswordWithServer: async () => { calls.validate++; },
    passwordIncorrect() { calls.validate++; }, _saveLock() { calls.validate++; },
  };
  return { view, shown, kinds, calls, run: () => PM.prototype._submitPasswordOnce.call(view) };
}

test('a submit with submitText shows the line, makes no server request and counts no attempt', async (t) => {
  const PM = await loadMinigame();
  let fetched = 0; const realFetch = globalThis.fetch; globalThis.fetch = async () => { fetched++; return { ok: true, json: async () => ({}) }; };
  try {
    const f = fakeView(PM, { attempts: 0, maxAttempts: 3, submitText: LINE });
    await f.run();
    assert.deepEqual(f.shown, [LINE]);
    assert.deepEqual(f.kinds, ['info']);
    assert.equal(f.calls.validate, 0);
    assert.equal(f.view.gameData.attempts, 0);
    assert.equal(fetched, 0);
  } finally { globalThis.fetch = realFetch; }
});

test('a variant without submitText keeps today\'s behaviour: the attempt counts and the server is asked', async (t) => {
  const PM = await loadMinigame();
  globalThis.window.ApiClient = {};
  const f = fakeView(PM, { attempts: 0, maxAttempts: 3, submitText: '' });
  await f.run();
  assert.equal(f.view.gameData.attempts, 1);
  assert.ok(f.calls.validate >= 1);
});

test('a submit with an empty field and a submitText does nothing: no line, no request, no attempt', async () => {
  const PM = await loadMinigame();
  const f = fakeView(PM, { attempts: 0, maxAttempts: 3, submitText: LINE });
  f.view.passwordField.value = '  ';
  await f.run();
  assert.deepEqual(f.shown, []);
  assert.equal(f.calls.validate, 0);
  assert.equal(f.view.gameData.attempts, 0);
});

// hideNotepadButton: start the view (init, the plain-password path) with a stubbed document and
// record the buttons it puts in the controls row. The base scene's init is stubbed: it only
// builds the frame markup.
async function startedButtons(gameData) {
  const PM = await loadMinigame();
  const { MinigameScene } = await import('../../public/break_escape/js/minigames/framework/base-minigame.js');
  const realBase = MinigameScene.prototype.init;
  MinigameScene.prototype.init = function () {};
  const realCreate = globalThis.document.createElement;
  globalThis.document.createElement = () => ({ style: {}, className: '', id: '', innerHTML: '', appendChild() {}, setAttribute() {}, addEventListener() {} });
  const row = [];
  const view = {
    params: {}, gameData, signIn: null, join: null,
    headerElement: { innerHTML: '' }, gameContainer: { innerHTML: '', querySelector: () => null },
    isPcScreen: () => false, wrapInFrame() {}, mountMonitor() {}, setupPasswordInterface() {}, setupEventListeners() {},
    ensureControlsRow: () => ({ appendChild: (el) => row.push(el) }),
    addEventListener() {}, pcMonitor: null,
  };
  try { PM.prototype.init.call(view); } finally {
    MinigameScene.prototype.init = realBase;
    globalThis.document.createElement = realCreate;
  }
  return row.map((el) => el.id);
}

test('hideNotepadButton true leaves the Add to Notepad button out; without it the button is there', async () => {
  const base = { showPostit: true, postitNote: 'Tarrowby2468' };
  assert.deepEqual(await startedButtons({ ...base, hideNotepadButton: true }), []);
  assert.deepEqual(await startedButtons({ ...base }), ['minigame-notebook-postit']);
  assert.deepEqual(await startedButtons({ ...base, hideNotepadButton: false }), ['minigame-notebook-postit']);
});
