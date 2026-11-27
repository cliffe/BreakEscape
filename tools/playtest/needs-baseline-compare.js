#!/usr/bin/env node
/**
 * needs-baseline-compare.js: compare two needs-baseline-capture.js outputs by the ORDER of
 * decisions and events for each NPC and workstation, not by tick numbers (the clock is stepped in
 * real time and machine load moves walking times), as ACCESS_MODEL_PLAN.md step 9 asks.
 *
 *   node tools/playtest/needs-baseline-compare.js before.json after.json [--json]
 *
 * Sequences compared, each per subject:
 *   needs      the decision log per NPC: ev, need or tag, target, item
 *   events     npc_* / workstation_* / pc_* / task_* events per subject (the id after the colon,
 *              else data.npcId or data.objectId), keeping only stable data fields (screenLocked,
 *              reason, need, targetId, ownerId); positions, distances and timings are dropped,
 *              and npc_sat / npc_stood / npc_moved (chairs and steps) are left out
 *   globals    the workstation globals' changes (<id>_screen_locked, _owner_away, _accessed)
 *   stations   each workstation's state changes (owner away, leaves, screenLocked, lockAt set)
 *   probes     onInteract answers per workstation, in probe order
 *   tasks      the order tasks completed in
 * Prints each difference as a unified diff of that subject's sequence; exit 0 always.
 */

const fs = require('fs');

const [aPath, bPath] = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!aPath || !bPath) {
  console.error('usage: needs-baseline-compare.js before.json after.json [--json]');
  process.exit(2);
}
const A = JSON.parse(fs.readFileSync(aPath, 'utf8'));
const B = JSON.parse(fs.readFileSync(bPath, 'utf8'));

const SKIP_EVENTS = /^(npc_sat|npc_stood|npc_moved|npc_action_windup)$/;
const KEEP_FIELDS = ['screenLocked', 'reason', 'need', 'targetId', 'ownerId', 'via', 'isHostile', 'tag', 'itemId'];

function groupBy(list, keyFn, valFn) {
  const out = {};
  for (const x of list) {
    const k = keyFn(x);
    if (k === null || k === undefined) continue;
    (out[k] = out[k] || []).push(valFn(x));
  }
  return out;
}

function sequences(d) {
  const needs = groupBy(d.needsLog || [], e => e.npc, e =>
    [e.ev, e.need || e.tag || '', e.target || '', e.item || ''].filter((v, i) => i === 0 || v).join(' '));
  const evs = (d.events || []).filter(e => !e.event.startsWith('global_variable_changed:'));
  const events = groupBy(evs.filter(e => !SKIP_EVENTS.test(e.event.split(':')[0])), e => {
    const parts = e.event.split(':');
    return parts[1] || e.data?.npcId || e.data?.objectId || parts[0];
  }, e => {
    const kept = KEEP_FIELDS.filter(k => e.data && e.data[k] !== undefined && e.data[k] !== null)
      .map(k => `${k}=${JSON.stringify(e.data[k])}`);
    return [e.event.split(':')[0], ...kept].join(' ');
  });
  const globals = groupBy((d.events || []).filter(e => e.event.startsWith('global_variable_changed:')),
    e => e.event.split(':')[1].replace(/_(screen_locked|owner_away|accessed)$/, ''),
    e => `${e.event.split(':')[1]}=${JSON.stringify(e.data?.value)}`);
  const stations = groupBy(d.workstations || [], w => w.id, w =>
    `present=${w.present} away=${w.away} leaves=${w.leaves} screenLocked=${w.screenLocked} lockAt=${w.lockAt === null ? 'none' : 'set'} globals=${+w.screen_locked}${+w.owner_away}${+w.accessed}`);
  const probes = groupBy(d.probes || [], p => p.id, p => p.answer);
  const tasks = { order: (d.tasks || []).map(t => t.taskId) };
  return { needs, events, globals, stations, probes, tasks };
}

// Longest-common-subsequence diff, enough for sequences of a few hundred lines.
function diff(a, b) {
  const n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  }
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push('  ' + a[i]); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) { out.push('- ' + a[i]); i++; }
    else { out.push('+ ' + b[j]); j++; }
  }
  while (i < n) out.push('- ' + a[i++]);
  while (j < m) out.push('+ ' + b[j++]);
  return out;
}

const sa = sequences(A), sb = sequences(B);
const report = { scenario: A.scenario, before: { gitRev: A.gitRev, jsDirty: A.jsDirty, gameId: A.gameId }, after: { gitRev: B.gitRev, jsDirty: B.jsDirty, gameId: B.gameId }, differences: [] };
for (const kind of Object.keys(sa)) {
  const subjects = [...new Set([...Object.keys(sa[kind]), ...Object.keys(sb[kind])])].sort();
  for (const subject of subjects) {
    const x = sa[kind][subject] || [], y = sb[kind][subject] || [];
    if (JSON.stringify(x) === JSON.stringify(y)) continue;
    report.differences.push({ kind, subject, diff: diff(x, y).filter((l, idx, arr) => l[0] !== ' ' || (arr[idx - 1] && arr[idx - 1][0] !== ' ') || (arr[idx + 1] && arr[idx + 1][0] !== ' ')) });
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 1));
} else {
  console.log(`# ${report.scenario}: ${report.differences.length} subject(s) differ`);
  for (const d of report.differences) {
    console.log(`\n## ${d.kind} / ${d.subject}`);
    for (const l of d.diff) console.log(l);
  }
}
