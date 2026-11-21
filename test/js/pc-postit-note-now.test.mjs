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
const pc = { type: 'pc', postitNoteVariants: [{ condition: COND, value: 'Tarrowby2468' }] };

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
  assert.equal(pcPostitNoteNow({ type: 'pc', postitNote: 'x' }, g), '');
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
