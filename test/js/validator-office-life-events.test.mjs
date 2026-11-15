// V5's event lists (scripts/validate_office_life.rb OFFICE_LIFE_EVENT_PREFIXES, _EXCLUSIONS and
// _IGNORE) against the engine (OFFICE_LIFE_MISSIONS_PLAN.md section 4). This test is the source of
// truth: it collects every string or template literal in the *.js files under
// public/break_escape/js/ that begins with an office-life stem, whatever call it sits in, strips a
// template's tail at the first ':' (and at a '${' before it), and requires each name to match an
// entry, be an exclusion, or be on the ignore list. It also fails on an entry that no literal
// matches, so a phantom name cannot sit in a list. A new engine event fails here until someone
// decides which list it belongs on.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readdirSync, readFileSync, statSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

const STEMS = ['npc_', 'workstation_', 'desk_phone_', 'magnet_', 'room_tone_', 'object_revealed', 'door_propped', 'item_'];

function jsFiles(dir, out = []) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) jsFiles(p, out);
        else if (name.endsWith('.js')) out.push(p); // skips backups such as npc-behavior.js.bak
    }
    return out;
}

function collect() {
    const names = new Map();
    const re = /(['"`])((?:npc_|workstation_|desk_phone_|magnet_|room_tone_|object_revealed|door_propped|item_)(?:(?!\1)[^\\\n]|\\.)*)\1/g;
    for (const file of jsFiles(join(root, 'public/break_escape/js'))) {
        const src = readFileSync(file, 'utf8');
        for (const m of src.matchAll(re)) {
            let name = m[2];
            if (m[1] === '`') name = name.split('${')[0];
            name = name.split(':')[0];
            if (!STEMS.some(s => name.startsWith(s))) continue;
            if (!names.has(name)) names.set(name, new Set());
            names.get(name).add(file.slice(root.length + 1));
        }
    }
    return names;
}

function lists() {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_office_life.rb'))}
      puts JSON.generate(prefixes: ValidateOfficeLife::OFFICE_LIFE_EVENT_PREFIXES,
        exclusions: ValidateOfficeLife::OFFICE_LIFE_EVENT_EXCLUSIONS, ignore: ValidateOfficeLife::OFFICE_LIFE_EVENT_IGNORE)`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

const matches = (entry, name) => entry.endsWith('_') ? name.startsWith(entry) : name === entry;

test('every engine literal with an office-life stem is on exactly one list', { skip }, () => {
    const { prefixes, exclusions, ignore } = lists();
    const unclassified = [];
    const twice = [];
    const all = collect();
    // the collector itself works: it sees direct emits, helper arguments and templates
    for (const n of ['npc_used', 'npc_used_object', 'item_dropped', 'npc_ko', 'workstation_accessed', 'npc_print_fetched', 'room_tone_started']) {
        assert.ok(all.has(n), `collector missed ${n}`);
    }
    assert.ok(all.size > 60, `only ${all.size} names collected`);
    for (const [name, files] of all) {
        const hits = [prefixes.some(e => matches(e, name)) && !exclusions.includes(name), exclusions.includes(name), ignore.includes(name)].filter(Boolean);
        if (hits.length === 0) unclassified.push(`${name} (${[...files].join(', ')})`);
        if (ignore.includes(name) && exclusions.includes(name)) twice.push(name);
    }
    assert.deepEqual(unclassified, [], 'classify each name in OFFICE_LIFE_EVENT_PREFIXES, _EXCLUSIONS or _IGNORE');
    assert.deepEqual(twice, []);
});

test('every list entry is matched by at least one engine literal (no phantom names)', { skip }, () => {
    const { prefixes, exclusions, ignore } = lists();
    const found = [...collect().keys()];
    const phantom = [...prefixes, ...exclusions, ...ignore].filter(e => !found.some(n => matches(e, n) || n === e));
    assert.deepEqual(phantom, []);
});

test('the match rule: a prefix needs its underscore, an exact name allows only ":" after it', { skip }, () => {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_office_life.rb'))}
      puts JSON.generate(%w[npc_used npc_used:pc npc_used_phone npc_used_object npc_used_object:x npc_use_heard:x npc_ko:x item_dropped:usb item_picked_up npc_usedx].to_h { |n| [n, ValidateOfficeLife.office_life_event?(n)] })`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(JSON.parse(r.stdout.trim()), {
        npc_used: true, 'npc_used:pc': true, npc_used_phone: true, npc_used_object: false, 'npc_used_object:x': false,
        'npc_use_heard:x': true, 'npc_ko:x': false, 'item_dropped:usb': true, item_picked_up: false, npc_usedx: false
    });
});
