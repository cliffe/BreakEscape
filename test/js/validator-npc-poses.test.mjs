// scripts/validate_npc_needs.rb: NPC pose warnings (docs/achitechture/NPC_POSES.md).
// Run with: node test/js/validator-npc-poses.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function check(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}
      puts JSON.generate(ValidateNpcNeeds.check(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const poseIssues = (issues) => issues.filter(s => /poses|affordance\.pose/.test(s));
const thirst = { thirst: { decayPerMin: 10, urgentAt: 40 } };
const scenario = (npc, objects = []) => ({
    rooms: { office: { type: 'room_office', objects: [{ id: 'cooler', type: 'water_cooler', affordance: { satisfies: 'thirst', restores: 60 } }, ...objects], npcs: [npc] } }
});

test('poses on an NPC with no needs: warning', { skip }, () => {
    const issues = poseIssues(check(scenario({ id: 'ana', poses: ['drink'] })));
    assert.ok(issues.some(s => s.includes("NPC 'ana' sets poses but has no needs")), issues.join('\n'));
});

test('a listed pose the atlas lacks: warning; one it has: none', { skip }, () => {
    const lacks = poseIssues(check(scenario({ id: 'ana', needs: thirst, spriteSheet: 'female_office_worker', poses: ['drink'] })));
    assert.ok(lacks.some(s => s.includes('no pose_drink frames')), lacks.join('\n'));
    const hasIt = poseIssues(check(scenario({ id: 'ana', needs: thirst, spriteSheet: 'male_office_worker_v2', poses: ['drink', 'phone'] })));
    assert.deepEqual(hasIt, []);
    assert.deepEqual(poseIssues(check(scenario({ id: 'ana', needs: thirst, spriteSheet: 'female_office_worker', poses: false }))), []);
});

test('affordance.pose or machine on an object that satisfies no need: warning', { skip }, () => {
    const issues = poseIssues(check(scenario({ id: 'ana', needs: thirst }, [{ id: 'crate1', type: 'crate', affordance: { pose: 'use' } }])));
    assert.ok(issues.some(s => s.includes("object 'crate1' sets affordance.pose/machine")), issues.join('\n'));
    assert.deepEqual(poseIssues(check(scenario({ id: 'ana', needs: thirst }, [{ id: 'k', type: 'kettle', affordance: { satisfies: 'caffeine', machine: true } }]))), []);
});
