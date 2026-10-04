// Release policy for barks held behind a minigame (bark-release-policy.js).
// Run with: node --test test/js/bark-release-policy.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '../../public/break_escape/js/systems/bark-release-policy.js');
const dir = mkdtempSync(join(tmpdir(), 'bark-release-'));
writeFileSync(join(dir, 'policy.mjs'), readFileSync(src, 'utf8'));
const { releaseHeldBarks, HELD_BARK_GAP_MS, HELD_BARK_CAP } =
  await import(pathToFileURL(join(dir, 'policy.mjs')).href);

const bark = (text, extra = {}) => ({ npcId: 'n', text, ...extra });
function harness({ hold = () => false, persistent = () => false } = {}) {
  const shown = [], sleeps = [], logs = [];
  return {
    shown, sleeps, logs,
    opts: {
      shouldHold: hold,
      render: async (p) => { shown.push(p.text); },
      sleep: async (ms) => { sleeps.push(ms); },
      hasPersistentCopy: persistent,
      log: (...a) => logs.push(a.join(' '))
    }
  };
}

test('FIFO: barks show in the order they were held', async () => {
  const h = harness();
  await releaseHeldBarks([bark('a'), bark('b'), bark('c')], h.opts);
  assert.deepEqual(h.shown, ['a', 'b', 'c']);
});

test('a stale bark is dropped at release and logged; a still-valid one shows', async () => {
  let restored = false;
  const h = harness();
  const q = [bark('next is the restore', { stillValid: () => !restored }), bark('warning', { stillValid: () => true })];
  restored = true;
  await releaseHeldBarks(q, h.opts);
  assert.deepEqual(h.shown, ['warning']);
  assert.ok(h.logs.some(l => l.includes('stale') && l.includes('next is the restore')));
});

test('a bark that goes stale mid-release is dropped just before it would show', async () => {
  let flag = true;
  const h = harness();
  h.opts.render = async (p) => { h.shown.push(p.text); flag = false; };
  await releaseHeldBarks([bark('a'), bark('b', { stillValid: () => flag })], h.opts);
  assert.deepEqual(h.shown, ['a']);
  assert.ok(h.logs.some(l => l.includes('stale')));
});

test('an unconditioned bark is kept', async () => {
  const h = harness();
  await releaseHeldBarks([bark('plain')], h.opts);
  assert.deepEqual(h.shown, ['plain']);
  assert.equal(h.logs.length, 0);
});

test('spacing: one at a time, a gap between barks and none after the last', async () => {
  const h = harness();
  const order = [];
  h.opts.render = async (p) => { order.push(`show ${p.text}`); };
  h.opts.sleep = async (ms) => { order.push(`wait ${ms}`); };
  await releaseHeldBarks([bark('a'), bark('b'), bark('c')], h.opts);
  assert.deepEqual(order, ['show a', `wait ${HELD_BARK_GAP_MS}`, 'show b', `wait ${HELD_BARK_GAP_MS}`, 'show c']);
  assert.equal(HELD_BARK_GAP_MS, 2500);
});

test('re-hold: a minigame opening mid-release leaves the rest queued; they release later', async () => {
  let open = false;
  const h = harness({ hold: () => open });
  h.opts.sleep = async () => { open = true; };      // opens during the first gap
  const q = [bark('a'), bark('b'), bark('c')];
  await releaseHeldBarks(q, h.opts);
  assert.deepEqual(h.shown, ['a']);
  assert.deepEqual(q.map(p => p.text), ['b', 'c']);
  open = false; h.opts.sleep = async () => {};
  await releaseHeldBarks(q, h.opts);
  assert.deepEqual(h.shown, ['a', 'b', 'c']);
});

test('nothing is released while a minigame is still open', async () => {
  const h = harness({ hold: () => true });
  const q = [bark('a')];
  assert.equal(await releaseHeldBarks(q, h.opts), 0);
  assert.equal(q.length, 1);
});

test('cap: over 3 waiting, only the oldest ones with a persistent copy are dropped', async () => {
  const keep = new Set(['no-copy-1', 'no-copy-2']);
  const h = harness({ persistent: p => !keep.has(p.text) });
  const q = ['no-copy-1', 'p2', 'no-copy-2', 'p4', 'p5', 'p6'].map(t => bark(t));
  await releaseHeldBarks(q, h.opts);
  // 6 waiting, cap 3: drop the 3 oldest-first persistent ones (p2, p4, p5); p6 is newest-but-fine
  assert.deepEqual(h.shown, ['no-copy-1', 'no-copy-2', 'p6']);
  assert.equal(h.logs.filter(l => l.includes('capped')).length, 3);
});

test('cap: barks with no persistent copy are never dropped, however many', async () => {
  const h = harness();
  const q = Array.from({ length: 8 }, (_, i) => bark(`b${i}`));
  await releaseHeldBarks(q, h.opts);
  assert.equal(h.shown.length, 8);
  assert.equal(HELD_BARK_CAP, 3);
});

test('stale barks do not count towards the cap', async () => {
  const h = harness({ persistent: () => true });
  const q = [bark('a'), bark('b'), bark('s1', { stillValid: () => false }), bark('s2', { stillValid: () => false }), bark('c')];
  await releaseHeldBarks(q, h.opts);
  assert.deepEqual(h.shown, ['a', 'b', 'c']);
});

test('wiring: npc-barks.js uses the policy and the manager passes stillValid', () => {
  const barks = readFileSync(join(here, '../../public/break_escape/js/systems/npc-barks.js'), 'utf8');
  const mgr = readFileSync(join(here, '../../public/break_escape/js/systems/npc-manager.js'), 'utf8');
  assert.match(barks, /releaseHeldBarks\(this\.deferredBarkQueue/);
  assert.equal((mgr.match(/stillValid/g) || []).length >= 3, true);
});

test('wiring: the persistent-copy check finds the NPC manager although main.js never links it', () => {
  // main.js does `new NPCBarkSystem()` with no manager; without a fallback the cap never fired
  const barks = readFileSync(join(here, '../../public/break_escape/js/systems/npc-barks.js'), 'utf8');
  const body = barks.slice(barks.indexOf('_hasPersistentCopy(payload) {'));
  assert.match(body.slice(0, 600), /this\.npcManager \|\| \(typeof window !== 'undefined' \? window\.npcManager : null\)/);
});
