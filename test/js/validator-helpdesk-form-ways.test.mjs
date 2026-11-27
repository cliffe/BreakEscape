// S8b review R1-SERVER7: the validator refuses the two extra ways to open a desk's form that the
// scene's registration would otherwise allow (the `trigger_minigame:helpdesk_form` ink tag and an
// `openMinigame` mapping of that type); a helpdesk_form object outside a sign-in PC is refused in
// validator-helpdesk.test.mjs. A validated scenario has only the three documented ways.
// Run with: node --test test/js/validator-helpdesk-form-ways.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

function rubyJson(script, input) {
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(input), encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const errors = list => list.filter(s => s.startsWith('❌'));

test('an openMinigame mapping of type helpdesk_form is an error', { skip }, () => {
    const j = JSON.parse(readFileSync(join(root, 'scenarios/test_exercise_station/scenario.json.erb'), 'utf8'));
    const npc = j.rooms.hall.npcs[0];
    npc.eventMappings = [...(npc.eventMappings || []), { eventPattern: 'global_changed:x', openMinigame: 'helpdesk_form' }];
    const out = rubyJson(`require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
        puts JSON.generate(ValidateSocial.check(JSON.parse(STDIN.read), repo_root: ${JSON.stringify(root)}))`, j);
    assert.ok(errors(out).some(s => s.includes('openMinigame') && s.includes('"helpdesk_form"') && s.includes('not a minigame type')),
        out.join('\n'));
});

test('a #trigger_minigame:helpdesk_form ink tag is an error', { skip }, () => {
    const repo = mkdtempSync(join(tmpdir(), 'hd-ways-'));
    try {
        mkdirSync(join(repo, 'scenarios/x/ink'), { recursive: true });
        writeFileSync(join(repo, 'scenarios/x/ink/ria.ink'), '=== start ===\nRia: Fill it in.\n# trigger_minigame:helpdesk_form|deskId=it_desk\n-> END\n');
        const sc = { startRoom: 'office', rooms: { office: { type: 'room_office', connections: {}, objects: [],
            npcs: [{ id: 'ria', npcType: 'person', storyPath: 'scenarios/x/ink/ria.json' }] } } };
        const out = rubyJson(`require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
            puts JSON.generate(check_recurring_bugs(JSON.parse(STDIN.read), ${JSON.stringify(repo)}))`, sc);
        assert.ok(errors(out).some(s => s.includes('#trigger_minigame:helpdesk_form') && s.includes('is not a minigame type')),
            out.join('\n'));
    } finally {
        rmSync(repo, { recursive: true, force: true });
    }
});
