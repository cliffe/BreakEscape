// scripts/validate_scenario.rb check_or_in_global_conditions: '||' in lighting, torch and
// chatBackground conditions (the &&-only conditional-text.js evaluator), m04 L3. Inline fixture.
// Run with: node --test test/js/validator-or-conditions.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);

const scenario = {
  lighting: { enabled: true, variants: [{ condition: 'globalVars.a || globalVars.b', mode: 'dark' }] },
  music: { events: [{ trigger: 'game_loaded', condition: 'globalVars.a || globalVars.b', playlist: 'x' }] },
  rooms: {
    lab: {
      lighting: {
        variants: [{ condition: 'globalVars.a && !globalVars.b', mode: 'on' }],
        emitters: { rack1: [{ condition: '(globalVars.a)', color: '#ff0000' }] }
      },
      chatBackground: [{ condition: 'globalVars.night || globalVars.storm', image: 'x.png' }],
      npcs: [{ id: 'guard', behavior: { torch: { condition: 'globalVars.a || globalVars.c' } },
               eventMappings: [{ eventPattern: 'x', condition: 'value || globalVars.a' }] }],
      objects: [{ id: 'board', minigameData: { timeline: [{ id: 't', text: 'x', condition: 'globalVars.a || globalVars.b' }],
                  statusRows: [{ label: 'L', states: [{ condition: '(globalVars.a)' }] }] },
                  mystery: { condition: 'globalVars.a || globalVars.b' } }]
    }
  }
};

test("'||' is flagged in lighting, torch and chatBackground, not in music or command-board timelines",
  { skip: ruby.status !== 0 && 'ruby not found' }, () => {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_or_in_global_conditions(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const issues = JSON.parse(r.stdout.trim().split('\n').pop());
    const where = issues.map(s => [s.match(/'([^']+)'/)[1], s.startsWith('❌') ? 'error' : 'warn']).sort();
    assert.deepEqual(where, [
      ['lighting/variants[0]', 'error'],
      ['rooms/lab/chatBackground[0]', 'error'],
      ['rooms/lab/lighting/emitters/rack1[0]', 'error'],          // parentheses
      ['rooms/lab/npcs[0]/behavior/torch', 'error'],
      ['rooms/lab/objects[0]/minigameData/statusRows[0]/states[0]', 'warn'], // parentheses only
      ['rooms/lab/objects[0]/mystery', 'warn'],                    // unknown evaluator
    ]);
    // eventMappings are left to check_engine_limits' own message; '&&' lighting conditions pass
  });
