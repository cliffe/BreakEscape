// R2 nit 2 and m4: the client's SAME_ART map (utils/npc-lookalike.js) matches the
// `copied_from` entries of tools/pixellab_characters.json, both ways, and a scenario NPC
// that wears a copied sprite (no male_/female_ prefix) names its gender, because
// systems/combat-input.js reads the pronoun off the prefix and gender.
// Run with: node --test test/js/same-art-manifest.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const { SAME_ART } = await import(pathToFileURL(join(root, 'public/break_escape/js/utils/npc-lookalike.js')).href);

const manifest = JSON.parse(readFileSync(join(root, 'tools/pixellab_characters.json'), 'utf8'));
const chars = manifest.characters || manifest;
const copies = Object.fromEntries(Object.entries(chars)
    .filter(([, v]) => v && typeof v === 'object' && v.copied_from).map(([k, v]) => [k, v.copied_from]));

test('every copied_from in the manifest is in SAME_ART, and every SAME_ART entry is a copied_from', () => {
    assert.ok(Object.keys(copies).length > 0, 'the manifest has copies');
    assert.deepEqual({ ...SAME_ART }, copies);
});

test('every SAME_ART original is a sprite that exists', () => {
    for (const [copy, original] of Object.entries(SAME_ART)) {
        assert.ok(existsSync(join(root, 'public/break_escape/assets/characters', `${copy}.png`)), `${copy}.png exists`);
        assert.ok(existsSync(join(root, 'public/break_escape/assets/characters', `${original}.png`)), `${original}.png exists`);
    }
});

test('m01 NPCs wearing a copied sprite name their gender (combat messages)', () => {
    const erb = readFileSync(join(root, 'scenarios/m01_first_contact/scenario.json.erb'), 'utf8');
    for (const copy of Object.keys(SAME_ART)) {
        const m = erb.match(new RegExp(`"spriteSheet":\\s*"${copy}",\\s*\\n\\s*"gender":\\s*"(male|female)"`));
        assert.ok(m, `${copy} has a gender next to its spriteSheet`);
    }
});
