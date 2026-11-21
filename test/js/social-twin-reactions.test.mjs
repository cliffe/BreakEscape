// D280: the after-sort colleague reaction for the other defend twins (pattern of ca05, D265). Each
// twin's kit set piece `<ca>_defend_react` patches one ambient colleague with a single
// global_variable_changed:kit_defend_done mapping whose targetKnot `<ca>_react` lives in that
// colleague's shared ambient ink and branches on kit_key_caught alone.
// Guards: the mapping shape, twin-only scope (the full shell is untouched), and, once the knots are
// in the ink, the knot shape and a runtime caught / not-caught branch. A twin whose knot is not yet
// in the ink skips the knot checks (the wiring lands before the spoken lines).
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const readJson = p => JSON.parse(readFileSync(join(root, p), 'utf8'));

// ca -> [shell folder (the twin is <folder>_defend), speaker person]
const TWINS = {
    ca01: ['ca01_invoice_fraud', 'gwen_pritchard'],
    ca02: ['ca02_cv_lures', 'chidi_okeke'],
    ca03: ['ca03_helpdesk_reset', 'anjali_rao'],
    ca04: ['ca04_exec_whaling', 'julian_sallow'],
    ca06: ['ca06_texts_and_qr', 'zainab_hussain'],
    ca07: ['ca07_voice_ceo', 'graham_whitfield'],
    ca08: ['ca08_after_the_click', 'darren_price'],
    ca09: ['ca09_passwords', 'chidi_okeke'],
    ca10: ['ca10_downloads_and_fake_checks', 'darren_price'],
    ca11: ['ca11_misdirected_data', 'yusuf_demir'],
    ca13: ['ca13_ai_assistant', 'graham_whitfield'],
    ca14: ['ca14_social_media', 'delphine_arvanitis'],
    ca15: ['ca15_shadow_it', 'chidi_okeke'],
    ca16: ['ca16_insider_risk', 'darren_price'],
    ca17: ['ca17_acceptable_use', 'fatima_begum'],
    ca18: ['ca18_credential_attacks_at_scale', 'delphine_arvanitis'],
    ca19: ['ca19_malware_and_updates', 'darren_price'],
    ca20: ['ca20_remote_and_mobile_working', 'chidi_okeke'],
};

const mappingsOf = (scPath, person) => {
    const sc = readJson(scPath);
    const npc = sc.rooms.training_room.npcs.find(n => n.id === `kit_${person}`);
    return (npc && npc.eventMappings) || [];
};
const reactMappings = (scPath) => {
    const sc = readJson(scPath);
    return sc.rooms.training_room.npcs.flatMap(n => (n.eventMappings || [])
        .filter(m => m.eventPattern === 'global_variable_changed:kit_defend_done')
        .map(m => ({ npc: n.id, m })));
};

function knotBody(ink, name) {
    const m = ink.match(new RegExp(`^===\\s*${name}\\s*===\\s*$([\\s\\S]*?)(?=^===|(?![\\s\\S]))`, 'm'));
    return m ? m[1] : null;
}
const inkPath = person => `scenarios/_office_kit/ink/${person}_ambient.ink`;

for (const [ca, [folder, person]] of Object.entries(TWINS)) {
    const twin = `scenarios/${folder}_defend/scenario.json.erb`;
    const shell = `scenarios/${folder}/scenario.json.erb`;
    const knot = `${ca}_react`;

    test(`${ca} twin: kit_${person} fires the after-sort reaction bark from ${knot}`, () => {
        const mine = reactMappings(twin);
        assert.equal(mine.length, 1, 'exactly one kit_defend_done mapping in the twin');
        assert.equal(mine[0].npc, `kit_${person}`);
        const m = mine[0].m;
        assert.equal(m.targetKnot, knot);
        assert.equal(m.condition, 'value === true');
        assert.equal(m.onceOnly, true);
        assert.ok(Number(m.delayMs) > 0, 'delayMs must let the kiosk close first');
        assert.ok(!('bark' in m), 'the line comes from the ink, not a literal bark');
        // new mappings go last on the NPC (the server keys eventMappings by index)
        const all = mappingsOf(twin, person);
        assert.equal(all[all.length - 1].targetKnot, knot, 'the reaction mapping must be the last on the NPC');
    });

    test(`${ca} reaction is twin-only: the full shell carries no kit_defend_done reaction`, () => {
        if (!existsSync(join(root, shell))) return;
        assert.deepEqual(reactMappings(shell).filter(x => x.m.targetKnot === knot), []);
    });

    const ink = existsSync(join(root, inkPath(person))) ? readFileSync(join(root, inkPath(person)), 'utf8') : '';
    const body = knotBody(ink, knot);
    const opts = body ? {} : { skip: `${knot} not in ${person}_ambient.ink yet` };

    test(`${knot}: a caught line and a not-caught line, branched on kit_key_caught alone`, opts, () => {
        assert.ok(/\{\s*kit_key_caught\s*:/.test(body), 'does not branch on kit_key_caught');
        const kitReads = [...body.matchAll(/kit_[a-z0-9_]+/g)].map(x => x[0]);
        assert.ok(kitReads.every(r => r === 'kit_key_caught'), `reads other kit globals: ${[...new Set(kitReads)]}`);
        const lines = [...body.matchAll(/^\s*[A-Z][A-Za-z ]+:\s*(.+)$/gm)].map(x => x[1].trim());
        assert.equal(lines.length, 2, `expected two lines, got ${lines.length}`);
        assert.notEqual(lines[0], lines[1]);
        for (const l of lines) {
            assert.ok(/#delivery:/.test(l), `no #delivery note: ${l}`);
            assert.ok(!/[{}]/.test(l.replace(/#.*$/, '')), `spoken text prints a variable: ${l}`);
        }
        assert.ok(/->\s*bye/.test(body), 'does not end on the sticky bye exit');
        assert.ok(/^VAR kit_key_caught\b/m.test(ink), 'kit_key_caught not declared');
    });

    test(`${knot}: synced kit_key_caught takes the right branch at runtime`, opts, async () => {
        globalThis.inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
        const Eng = (await import(pathToFileURL(join(root, 'public/break_escape/js/systems/ink/ink-engine.js')).href)).default;
        const json = readJson(`scenarios/_office_kit/ink/${person}_ambient.json`);
        const line = (caught) => {
            const e = new Eng('t'); e.loadStory(json);
            if (caught !== undefined) e.story.variablesState.kit_key_caught = caught;
            e.goToKnot(knot);
            return e.continue().text.trim();
        };
        const yes = line(true), no = line(false);
        assert.ok(yes && no && yes !== no, 'caught and not-caught first lines must differ');
        assert.equal(line(undefined), no, 'unsynced default is the not-caught line');
    });
}
