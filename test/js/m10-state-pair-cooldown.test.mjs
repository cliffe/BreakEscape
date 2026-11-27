// m10 state-pair mappings: a room_entered/room_exited pair that sets and undoes a state
// (a reveal and a hide, a jam and its clear, at_keypad on and off) must carry cooldown 0.
// The default 5 s cooldown lets a step out and back within 5 s skip one side and leave the
// state wrong (hall-team sibling sweep S0-S3). Renders the real scenario through Ruby.
// Run with: node test/js/m10-state-pair-cooldown.test.mjs

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
// A command-line -r (or -rjson) loads before the -rbundler/setup that `bundle exec` puts in
// RUBYOPT, so it activates the default json gem and Bundler then refuses the locked one
// (Gem::LoadError, CI node-tests). These children need only stdlib: run them without Bundler.
const PLAIN_RUBY_ENV = { ...process.env, RUBYOPT: (process.env.RUBYOPT || '').replace(/-r\S*bundler\/setup\S*/g, '').trim() };
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function render() {
    const r = spawnSync('ruby', ['-I', join(root, 'lib'), '-rjson', '-e',
        `require "break_escape/scenario_binding"; puts BreakEscape::ScenarioBinding.render(File.read(ARGV[0]), {})`,
        join(root, 'scenarios/m10_full_disclosure/scenario.json.erb')], { env: PLAIN_RUBY_ENV, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout);
}

// Every mapping with the id of the NPC that carries it ('' when not inside an NPC).
function mappings(node, out = [], npc = '') {
    if (Array.isArray(node)) node.forEach((n) => mappings(n, out, npc));
    else if (node && typeof node === 'object') {
        const here = node.npcType && node.id ? node.id : npc;
        if (typeof node.eventPattern === 'string') out.push({ ...node, npc: here });
        Object.values(node).forEach((v) => mappings(v, out, here));
    }
    return out;
}

const isRoomPair = (m) => /^room_(entered|exited)/.test(m.eventPattern);

test('m10 state pairs carry cooldown 0', { skip }, () => {
    const all = mappings(render()).filter(isRoomPair);

    // S0: every raid copy reveal (setVisible true on room_entered) and hide (room_exited).
    // S1: vector_so reveal on room_entered:security_office and hide on room_exited.
    // Only the pair: reveals on room_entered and hides on room_exited (one-way after-ending hides are not pairs).
    const visible = all.filter((m) => /^(vector_so|(kowalczyk|arakawa|quintero)_(so|ws|pr|hall))$/.test(m.npc))
        .filter((m) => (m.setVisible === true && m.eventPattern.startsWith('room_entered'))
        || (m.setVisible === false && m.eventPattern === 'room_exited'));
    assert.ok(visible.some((m) => m.npc === 'vector_so'), 'vector_so pair missing');
    assert.ok(visible.length >= 20, `expected the raid copies and vector_so, found ${visible.length}`);
    for (const m of visible) assert.equal(m.cooldown, 0, `setVisible ${m.setVisible} on ${m.eventPattern} (${m.condition})`);

    // S2: hax_jammed set on gallery entry, cleared on every other room's entry.
    const jam = all.filter((m) => m.setGlobal && 'hax_jammed' in m.setGlobal);
    assert.ok(jam.length >= 5, `expected the jam and its clears, found ${jam.length}`);
    assert.ok(jam.some((m) => m.setGlobal.hax_jammed === true) && jam.some((m) => m.setGlobal.hax_jammed === false));
    for (const m of jam) assert.equal(m.cooldown, 0, `hax_jammed on ${m.eventPattern}`);

    // S3: at_keypad cleared on leaving or entering the gallery.
    const keypad = all.filter((m) => m.setGlobal && m.setGlobal.at_keypad === false);
    assert.equal(keypad.length, 2);
    for (const m of keypad) assert.equal(m.cooldown, 0, `at_keypad on ${m.eventPattern}`);
});
