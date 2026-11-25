// B7: the validator warns about a container with contents and no `locked` key, and about a
// nested container the player cannot open. Run with: node --test test/js/validator-unopenable-containers.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';

function check(objects, extra = {}) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_unopenable_containers(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify({ rooms: { r1: { objects } }, ...extra }), encoding: 'utf8',
        env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const item = { id: 'n1', type: 'text_file', name: 'Note', text: 'x' };
const cabinet = (o = {}) => ({ id: 'c', type: 'filing_cabinet', name: 'Cabinet', contents: [item], ...o });

test('no locked key: a folder and a filing cabinet warn', { skip }, () => {
    const out = check([cabinet(), { id: 'f', type: 'folder', name: 'Docs', contents: [item] }]);
    assert.equal(out.length, 2, out.join('\n'));
    assert.ok(out.every(s => s.startsWith('⚠️ WARNING:')));
    assert.ok(out[0].includes("rooms/r1/objects[0]") && out[0].includes('(Cabinet)'));
    assert.ok(out[0].includes('"locked": false'));
});

test('nested archive of a type that does not open warns', { skip }, () => {
    const out = check([cabinet({ locked: false, contents: [{ id: 'a', type: 'archive', name: 'Old archive', locked: false, contents: [item] }] })]);
    assert.equal(out.length, 1, out.join('\n'));
    assert.ok(out[0].includes('(Old archive)') && out[0].includes('cannot open'));
});

test('account profile contents are walked', { skip }, () => {
    const out = check([], { accountProfiles: { p: { contents: [{ id: 'a', type: 'archive', name: 'Zip', locked: false, contents: [item] }] } } });
    assert.equal(out.length, 1, out.join('\n'));
    assert.ok(out[0].includes('accountProfiles/p/contents[0]'));
});

test('no warning for the clean shapes', { skip }, () => {
    const clean = [
        cabinet({ locked: false }),
        cabinet({ locked: true, lockType: 'key' }),
        cabinet({ locked: false, contents: [{ id: 'f', type: 'folder', name: 'F', locked: false, contents: [item] }] }),
        cabinet({ locked: false, contents: [{ id: 'z', type: 'archive', name: 'Z', locked: true, lockType: 'password', contents: [item] }] }),
        { id: 'pc', type: 'pc', name: 'PC', lockType: 'login', locked: true, contents: [item] },
        { id: 'pc2', type: 'pc', name: 'PC2', lockType: 'login', contents: [item] },
        { id: 'u', type: 'usb', name: 'Stick', contents: [item] },
        cabinet({ contents: [] }),
        { id: 'cn', type: 'filing_cabinet', name: 'None' }
    ];
    assert.deepEqual(check(clean), []);
});

test('one of the seven error types is left to the existing error', { skip }, () => {
    assert.deepEqual(check([{ id: 's', type: 'safe', name: 'Safe', contents: [item] }]), []);
});

test('R1-B2: a type that opens its own screen warns with that reason, not the locked-key advice', { skip }, () => {
    const out = check([{ id: 'b', type: 'backup_recovery', name: 'Console', contents: [item] }]);
    assert.equal(out.length, 1, out.join('\n'));
    assert.ok(out[0].includes('opens its own screen'), out[0]);
    assert.ok(out[0].includes('out of contents'), out[0]);
    assert.ok(!out[0].includes('"locked": false'), out[0]);
    // with "locked": false it still warns: the report stays out of reach
    const out2 = check([{ id: 'b', type: 'backup_recovery', name: 'Console', locked: false, contents: [item] }]);
    assert.equal(out2.length, 1, out2.join('\n'));
    assert.ok(out2[0].includes('opens its own screen'), out2[0]);
});

test('R1-B3: a nested briefcase with no locked key warns', { skip }, () => {
    const out = check([cabinet({ locked: false, contents: [{ id: 'br', type: 'briefcase', name: 'Case', takeable: true, contents: [item] }] })]);
    assert.equal(out.length, 1, out.join('\n'));
    assert.ok(out[0].includes('contents[0]') && out[0].includes('(Case)'), out[0]);
});

test('R2-2: every type interactions.js dispatches to its own screen is in OWN_SCREEN_TYPES', { skip }, () => {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(OWN_SCREEN_TYPES)`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const listed = new Set(JSON.parse(r.stdout.trim().split('\n').pop()));
    for (const t of ['cms_terminal', 'warranty_checklist', 'shredder', 'flag-station', 'network_segmentation_map',
        'sis_config_panel', 'ops_log_terminal', 'workstation', 'notepad', 'siem_dashboard', 'case-file', 'rogue-ap']) {
        assert.ok(listed.has(t), `${t} listed`);
    }
    for (const t of ['mail_terminal', 'keycard', 'rfid_cloner', 'briefcase', 'folder']) assert.ok(!listed.has(t), `${t} not listed`);
    // independent derivation: every `type === 'x'` between the workstation and lockpick branches
    const src = readFileSync(join(root, 'public/break_escape/js/systems/interactions.js'), 'utf8');
    const seg = src.slice(src.search(/scenarioData\.type === ["']workstation["']/), src.search(/scenarioData\.type === ["']lockpick["']/));
    const inventoryOnly = new Set(['ble_scanner', 'bluetooth_scanner', 'fingerprint_kit', 'rfid_cloner', 'keycard']);
    for (const m of seg.matchAll(/scenarioData\.type === ["']([^"']+)["']/g)) {
        if (!inventoryOnly.has(m[1])) assert.ok(listed.has(m[1]), `${m[1]} dispatches to a screen but is not listed`);
    }
    const reg = readFileSync(join(root, 'public/break_escape/js/systems/minigame-registry.js'), 'utf8');
    for (const m of reg.match(/const BUILT_IN = \{[\s\S]*?\n\};/)[0].matchAll(/^\s*'([^']+)':\s*\{/gm)) {
        if (m[1] !== 'mail_terminal') assert.ok(listed.has(m[1]), `registry type ${m[1]} not listed`);
    }
    const out = check([{ id: 'c', type: 'cms_terminal', name: 'CMS', contents: [item] }]);
    assert.equal(out.length, 1);
    assert.ok(out[0].includes('opens its own screen'), out[0]);
});
