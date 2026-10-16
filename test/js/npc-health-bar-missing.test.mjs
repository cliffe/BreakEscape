// m07 blind M4: Park fought with no health bar over him. The bar was only made
// on the hostile event, and was lost when the sprite wasn't found then or was
// rebuilt. update() now gives any hostile, standing NPC without a bar its bar.
// Run with: node --test test/js/npc-health-bar-missing.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const read = (rel) => readFileSync(join(js, rel), 'utf8');
globalThis.window = {};
const src = read('ui/npc-health-bars.js')
    .split("'../config/combat-config.js'").join(`'${dataUrl('export const COMBAT_CONFIG = { ui: {} };')}'`)
    .split("'../utils/constants.js'").join(`'${dataUrl('export const overlayDepth = (d) => d;')}'`)
    .split("'../events/combat-events.js'").join(`'${dataUrl('export const CombatEvents = {};')}'`);
const { NPCHealthBars } = await import(dataUrl(src));

test('hostile NPCs without a bar are found; calm, KO and barred ones are not', () => {
    const record = {
        park: { hostile: true, ko: false },
        hollis: { hostile: true, ko: true },
        elena: { hostile: false, ko: false },
        mercer: { hostile: true, ko: false }
    };
    assert.deepEqual(NPCHealthBars.missingBars(record, new Map([['mercer', {}]])), ['park']);
    assert.deepEqual(NPCHealthBars.missingBars(null, new Map()), []);
});
