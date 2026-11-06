// titleScreenName is read by the server (show.html.erb) and by the title screen, so the schema and the
// validator's top-level field list must know it (it used to warn "will be ignored by the game engine").
// Run with: node --test test/js/validator-title-screen-name.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('the scenario schema declares titleScreenName as a string of at most 80 characters', () => {
    const schema = JSON.parse(readFileSync(join(root, 'scripts/scenario-schema.json'), 'utf8'));
    const p = schema.properties.titleScreenName;
    assert.equal(p.type, 'string');
    assert.equal(p.maxLength, 80);
});

test('the validator lists titleScreenName among the known top-level fields', () => {
    const rb = readFileSync(join(root, 'scripts/validate_scenario.rb'), 'utf8');
    const list = rb.match(/known_top_level = %w\[([\s\S]*?)\]/)[1].split(/\s+/);
    assert.ok(list.includes('titleScreenName'));
});
