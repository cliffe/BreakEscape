// The validator's known-failures list (SCENARIO_FORMAT_HARDENING_PLAN step 1) and its sign-offs.
// scripts/validator_known_failures.json holds the ❌ lines other tracks have not fixed yet; each
// entry names a dated heading in docs/agents/VALIDATOR_DECISIONS.md whose one json block restates
// the entry's scenario, stage, match and count. This file checks the real list, then the checker
// itself against broken lists. A passed reviewBy warns, and fails when MERGE_BATCH=1.
// Run with: node test/js/validator-known-failures.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readDecisions, signOffProblems, sharedHeadings } from './validator-decisions-reader.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const LIST = join(root, 'scripts/validator_known_failures.json');
const DECISIONS = join(root, 'docs/agents/VALIDATOR_DECISIONS.md');
const EXCEPTIONS = join(root, 'test/fixtures/files/payload_scan_exceptions.json');
const STAGES = ['ink', 'schema', 'common', 'habits', 'work', 'social'];
const UNMATCHABLE = ['could not run', 'stale known failure', 'Result:'];
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const today = () => new Date().toISOString().slice(0, 10);
const validDate = (s) => typeof s === 'string' && ISO.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) &&
  new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

// Checks a known-failures list against a decisions text. Returns { problems, warnings }.
// otherApproved: [label, heading] pairs from the other two lists, for the shared-heading rule.
export function checkKnownFailures(entries, decisionsText, { mergeBatch = false, now = today(), otherApproved = [],
                                                             scenarioExists = (p) => existsSync(join(root, p)) } = {}) {
  const problems = [];
  const warnings = [];
  if (!Array.isArray(entries)) return { problems: ['the list must be a JSON array'], warnings };
  const sections = readDecisions(decisionsText);
  entries.forEach((e, i) => {
    const label = `entry ${i} (${e && e.scenario} ${e && e.stage})`;
    if (!e || typeof e !== 'object') { problems.push(`${label}: not an object`); return; }
    if (typeof e.scenario !== 'string' || !/^scenarios\/[^/]+\/scenario\.json\.erb$/.test(e.scenario)) {
      problems.push(`${label}: scenario must be scenarios/<dir>/scenario.json.erb`);
    } else if (!scenarioExists(e.scenario)) {
      problems.push(`${label}: ${e.scenario} does not exist`);
    }
    if (!STAGES.includes(e.stage)) problems.push(`${label}: stage must be one of ${STAGES.join(', ')}`);
    if (typeof e.match !== 'string' || e.match.trim() === '') problems.push(`${label}: match is empty`);
    else {
      for (const u of UNMATCHABLE) if (e.match.includes(u)) problems.push(`${label}: match contains '${u}', which is never matched`);
      if ('❌ ERROR: '.includes(e.match)) problems.push(`${label}: match '${e.match}' is part of every error line`);
    }
    if (typeof e.owner !== 'string' || e.owner.trim() === '') problems.push(`${label}: owner is empty`);
    if (!Number.isInteger(e.count) || e.count < 1) problems.push(`${label}: count must be a positive whole number`);
    if (!validDate(e.added)) problems.push(`${label}: added '${e.added}' is not an ISO date`);
    else if (e.added > now) problems.push(`${label}: added ${e.added} is in the future`);
    if (!validDate(e.reviewBy)) problems.push(`${label}: reviewBy '${e.reviewBy}' is not an ISO date`);
    else if (e.reviewBy < now) {
      const msg = `${label}: reviewBy ${e.reviewBy} has passed; renew it with the owner or fix the lines`;
      (mergeBatch ? problems : warnings).push(msg);
    }
    problems.push(...signOffProblems(sections, e, ['scenario', 'stage', 'match', 'count'], label));
  });
  const labelled = entries.filter((e) => e && typeof e.approved === 'string')
    .map((e, i) => [`known failure ${i} (${e.scenario})`, e.approved]).concat(otherApproved);
  for (const [heading, labels] of sharedHeadings(labelled)) {
    problems.push(`heading '## ${heading}' backs more than one entry: ${labels.join(', ')}`);
  }
  return { problems, warnings };
}

// The other two lists, once they exist: payload scan exceptions (6a-1) and acknowledgedClues (step 3,
// read from the scenario templates' raw text, as the markers never ship).
function otherApproved() {
  const pairs = [];
  if (existsSync(EXCEPTIONS)) {
    JSON.parse(readFileSync(EXCEPTIONS, 'utf8')).forEach((e, i) => pairs.push([`payload scan exception ${i} (${e.scenario})`, e.approved]));
  }
  return pairs;
}

const entries = JSON.parse(readFileSync(LIST, 'utf8'));
const decisions = readFileSync(DECISIONS, 'utf8');

test('the real list: every entry is well formed and signed off under its own dated heading', () => {
  const { problems, warnings } = checkKnownFailures(entries, decisions, {
    mergeBatch: process.env.MERGE_BATCH === '1', otherApproved: otherApproved()
  });
  for (const w of warnings) console.warn(`WARNING: ${w}`);
  assert.deepEqual(problems, []);
});

// ── the checker against broken lists ─────────────────────────────────────────────────────────

const good = {
  scenario: 'scenarios/lab_exploitation/scenario.json.erb', stage: 'ink', match: "contains '//'", count: 2,
  owner: 'labs track', added: '2026-11-12', reviewBy: '2026-12-10', approved: '2026-11-12: lab slashes', note: ''
};
const block = (o) => '```json\n' + JSON.stringify(o, null, 2) + '\n```\n';
const doc = (heading, ...blocks) => `# Validator decisions\n\n## ${heading}\n\n${blocks.join('\n')}\nprose\n`;
const ids = (e) => ({ scenario: e.scenario, stage: e.stage, match: e.match, count: e.count });
const opts = { now: '2026-11-12', scenarioExists: () => true };
const check = (list, text, extra = {}) => checkKnownFailures(list, text, { ...opts, ...extra });

test('a well-formed entry with a matching block passes', () => {
  assert.deepEqual(check([good], doc(good.approved, block(ids(good)))), { problems: [], warnings: [] });
});

test('an approved heading missing from the decisions file fails', () => {
  const { problems } = check([good], doc('2026-11-12: something else', block(ids(good))));
  assert.match(problems.join('\n'), /is not in VALIDATOR_DECISIONS\.md/);
});

test('a block holding a different count or match fails', () => {
  assert.match(check([good], doc(good.approved, block({ ...ids(good), count: 3 }))).problems.join('\n'), /'count' is 2/);
  assert.match(check([good], doc(good.approved, block({ ...ids(good), match: 'other' }))).problems.join('\n'), /'match' is/);
});

test('a section with no json block, or with two, fails', () => {
  assert.match(check([good], doc(good.approved)).problems.join('\n'), /exactly one json block, found 0/);
  assert.match(check([good], doc(good.approved, block(ids(good)), block(ids(good)))).problems.join('\n'), /exactly one json block, found 2/);
});

test('an undated heading fails', () => {
  const e = { ...good, approved: 'lab slashes' };
  assert.match(check([e], doc(e.approved, block(ids(e)))).problems.join('\n'), /does not start with a date/);
});

test('two entries naming one heading fail, across lists too', () => {
  const second = { ...good, scenario: 'scenarios/lab_feeling_blu/scenario.json.erb' };
  const text = doc(good.approved, block(ids(good)));
  assert.match(check([good, second], text).problems.join('\n'), /backs more than one entry/);
  assert.match(check([good], text, { otherApproved: [['payload scan exception 0', good.approved]] }).problems.join('\n'),
    /backs more than one entry/);
});

test("a match of '❌ ERROR:' or one holding 'could not run', 'stale known failure' or 'Result:' fails", () => {
  for (const match of ['❌ ERROR:', 'ERROR', '❌', 'check_pin_locks could not run', 'stale known failure', 'Result:']) {
    const e = { ...good, match };
    const { problems } = check([e], doc(e.approved, block(ids(e))));
    assert.ok(problems.some((p) => /never matched|part of every error line/.test(p)), `${match}: ${problems.join('\n')}`);
  }
});

test('bad fields: stage, owner, count, dates, scenario path', () => {
  const cases = [
    [{ stage: 'lint' }, /stage must be one of/],
    [{ owner: ' ' }, /owner is empty/],
    [{ count: 0 }, /count must be a positive/],
    [{ count: 1.5 }, /count must be a positive/],
    [{ added: '2026-13-01' }, /added .* is not an ISO date/],
    [{ added: '2026-11-13' }, /is in the future/],
    [{ reviewBy: 'soon' }, /reviewBy .* is not an ISO date/],
    [{ scenario: 'lab_exploitation' }, /scenario must be scenarios/]
  ];
  for (const [patch, re] of cases) {
    const e = { ...good, ...patch };
    assert.match(check([e], doc(e.approved, block(ids(e)))).problems.join('\n'), re, JSON.stringify(patch));
  }
  const missing = checkKnownFailures([good], doc(good.approved, block(ids(good))), { now: '2026-11-12', scenarioExists: () => false });
  assert.match(missing.problems.join('\n'), /does not exist/);
});

test('a passed reviewBy warns, and fails with MERGE_BATCH=1', () => {
  const e = { ...good, reviewBy: '2026-11-11' };
  const text = doc(e.approved, block(ids(e)));
  const plain = check([e], text);
  assert.deepEqual(plain.problems, []);
  assert.match(plain.warnings.join('\n'), /reviewBy 2026-11-11 has passed/);
  assert.match(check([e], text, { mergeBatch: true }).problems.join('\n'), /reviewBy 2026-11-11 has passed/);
});
