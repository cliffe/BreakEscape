#!/usr/bin/env node
// Checks the assertions in a playtest-session output.
//
//   node tools/playtest/se/check-bridge.mjs <session-output.jsonl> [--allow-empty] [--expect <script.jsonl>] [--all-sessions]
//
// playtest-session.js has no assert command, so a bridge script asserts with
// {"cmd":"eval","fn":"() => <boolean expression>"} lines. This reads the
// session's output and fails (exit 1) on any eval result that is not exactly
// `true`, including an eval that threw (ok:false). It also fails when the file
// holds no eval result at all, since a script with no assertions proves nothing
// (--allow-empty turns that off).
//
// --expect <script.jsonl> counts the `eval` commands in the bridge script and
// fails when the output has fewer eval results than that, so a session cut short
// (a browser crash, an early quit, a hung waitFor) cannot pass just because the
// evals that did run were all true.
//
// Accepts both shapes the session produces: the log file it writes
// (lines with "dir":"in"/"out", where each eval's fn is shown from its "in"
// line) and plain stdout lines ({"ok":true,"cmd":"eval","result":...}), where
// results are matched to nothing and reported by position. Other failed
// commands (ok:false, such as a waitFor timeout) are listed as warnings and
// do not change the exit status.
//
// playtest-session.js appends to --log, so a reused log path holds every past
// run. Only the last session (from its last session-open line) is scored, and
// the output says how many earlier sessions were skipped; --all-sessions scores
// the whole file as before.
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const allowEmpty = args.includes('--allow-empty');
const allSessions = args.includes('--all-sessions');
const expectIdx = args.indexOf('--expect');
const expectFile = expectIdx !== -1 ? args[expectIdx + 1] : null;
const expectValueIdx = expectIdx === -1 ? -1 : expectIdx + 1;
const positional = args.filter((a, i) => !a.startsWith('--') && i !== expectValueIdx);
const file = positional[0];
if (!file) {
  console.error('usage: check-bridge.mjs <session-output.jsonl> [--allow-empty] [--expect <script.jsonl>] [--all-sessions]');
  process.exit(2);
}

/** Count the eval commands a bridge script holds (for --expect). */
function countExpectedEvals(path) {
  let src;
  try { src = readFileSync(path, 'utf8'); } catch (e) {
    console.error(`cannot read --expect file ${path}: ${e.message}`);
    process.exit(2);
  }
  let count = 0;
  for (const line of src.split('\n')) {
    if (!line.trim()) continue;
    try { if (JSON.parse(line).cmd === 'eval') count++; } catch { /* skip non-JSON */ }
  }
  return count;
}
const expected = expectFile ? countExpectedEvals(expectFile) : null;

let text;
try { text = readFileSync(file, 'utf8'); } catch (e) {
  console.error(`cannot read ${file}: ${e.message}`);
  process.exit(2);
}

const short = s => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > 110 ? t.slice(0, 107) + '...' : t;
};

// Score only the last session in an appended log (see the header).
let lines = text.split('\n');
let skippedSessions = 0, firstLine = 0;
if (!allSessions) {
  const opens = [];
  lines.forEach((line, i) => { if (line.includes('"event":"session-open"')) opens.push(i); });
  if (opens.length > 1) { skippedSessions = opens.length - 1; firstLine = opens[opens.length - 1]; }
}

let pendingFn = null;
let n = 0, passed = 0;
const failures = [];
const warnings = [];
const unparsed = [];

lines.forEach((line, i) => {
  if (i < firstLine || !line.trim()) return;
  let o;
  try { o = JSON.parse(line); } catch { unparsed.push(i + 1); return; }

  if (o.dir === 'in') {
    pendingFn = o.cmd && o.cmd.cmd === 'eval' ? o.cmd.fn : null;
    return;
  }
  if (o.dir && o.dir !== 'out') return;
  if (o.cmd === undefined && o.event) return;            // session-open and similar

  if (o.cmd === 'eval') {
    n++;
    const label = `line ${i + 1}${o.seq ? ` (seq ${o.seq})` : ''}: ${short(pendingFn) || 'eval'}`;
    pendingFn = null;
    if (o.ok === true && o.result === true) passed++;
    else failures.push(`${label} => ${o.ok === false ? `ERROR ${short(o.error ?? JSON.stringify(o.result))}` : short(JSON.stringify(o.result))}`);
  } else if (o.ok === false) {
    warnings.push(`line ${i + 1}: ${o.cmd} failed: ${short(o.error ?? JSON.stringify(o.result))}`);
  }
});

console.log(`check-bridge: ${file}`);
if (skippedSessions) console.log(`note: the log holds ${skippedSessions + 1} sessions (appended runs); scoring only the last, from line ${firstLine + 1} (--all-sessions scores all)`);
console.log(`eval assertions: ${n}, passed: ${passed}, failed: ${failures.length}${expected !== null ? `, expected: ${expected}` : ''}`);
for (const f of failures) console.log(`  FAIL ${f}`);
for (const w of warnings) console.log(`  warn ${w}`);
if (unparsed.length) console.log(`  warn ${unparsed.length} unparseable line(s): ${unparsed.slice(0, 5).join(', ')}`);

if (failures.length) { console.log('RESULT: FAIL'); process.exit(1); }
if (expected !== null && n < expected) {
  console.log(`RESULT: FAIL (ran ${n} of ${expected} eval assertions; the session ended early)`);
  process.exit(1);
}
if (n === 0 && !allowEmpty) { console.log('RESULT: FAIL (no eval results found, so nothing was asserted)'); process.exit(1); }
console.log('RESULT: PASS');
