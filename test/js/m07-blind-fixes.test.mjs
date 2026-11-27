// m07 blind playtest fixes: Adaeze no longer names the PIN, Park hints at the paper,
// Mercer's task ticks at the resolution, Ray's step-back ticks his task.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '../../scenarios/m07_architects_gambit/ink');
const ink = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const src = (n) => readFileSync(join(dir, n), 'utf8');
const json = (n) => readFileSync(join(dir, n), 'utf8');

test('Adaeze points at the sheet but does not name the PIN', () => {
  assert.ok(!/PIN/.test(src('m07_npc_adaeze_okafor.ink').split('\n').filter(l => l.includes('Adaeze Okafor:')).join('\n')));
  assert.ok(!/PIN for the badge/.test(json('m07_npc_adaeze_okafor.json')));
});

test('Mercer task ticks in the four endings, not at start', () => {
  const t = src('m07_npc_james_mercer.ink');
  assert.equal((t.match(/#complete_task:confront_mercer/g) || []).length, 4);
  const start = t.slice(t.indexOf('=== start ==='), t.indexOf('=== hub ==='));
  assert.ok(!start.includes('complete_task'));
});

test('Park repeats hint at the signed number until the projection is read', () => {
  const s = new ink.Story(json('m07_npc_thomas_park.json'));
  const run = (found) => {
    const st = new ink.Story(json('m07_npc_thomas_park.json'));
    st.variablesState['casualty_projection_found'] = found;
    st.ChoosePathString('refuse'); st.Continue(); while (st.canContinue) st.Continue();
    st.ChoosePathString('refuse');
    let o = ''; while (st.canContinue) o += st.Continue();
    return o;
  };
  assert.ok(s);
  assert.match(run(false), /number on it/);
  assert.doesNotMatch(run(true), /number on it/);
});

test('Ray step-back choice ticks clear_the_checkpoint', () => {
  const t = src('m07_npc_ray_hollis.ink');
  const i = t.indexOf("I'm stepping back. Look at me");
  assert.match(t.slice(i, i + 300), /#complete_task:clear_the_checkpoint/);
});
