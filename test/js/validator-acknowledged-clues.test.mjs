// acknowledgedClues markers (SCENARIO_FORMAT_HARDENING_PLAN step 3) and their sign-offs. Each
// marker in a scenario template names a dated heading in docs/agents/VALIDATOR_DECISIONS.md whose
// one json block restates its lock, in and reason. This file checks the real markers against the
// decisions file with the same shared reader the known-failures test uses, enforces the
// one-heading-per-entry rule across the lists that exist on this branch (known failures and
// acknowledgedClues; the payload-scan-exception list lands with build/hard-6a1), then exercises
// the checker against broken input.
// Run with: node test/js/validator-acknowledged-clues.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readDecisions, signOffProblems, sharedHeadings } from './validator-decisions-reader.mjs';
import { readAcknowledgedClues, acknowledgedApproved, markersInText } from './validator-acknowledged-clues-reader.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DECISIONS = join(root, 'docs/agents/VALIDATOR_DECISIONS.md');
const LIST = join(root, 'scripts/validator_known_failures.json');
const EXCEPTIONS = join(root, 'test/fixtures/files/payload_scan_exceptions.json');

// Problems with the acknowledged-clues markers against a decisions text. otherApproved carries the
// other lists' [label, heading] pairs for the shared-heading rule.
export function checkAcknowledgedClues(markers, decisionsText, { otherApproved = [] } = {}) {
  const problems = [];
  const sections = readDecisions(decisionsText);
  markers.forEach(({ scenario, index, entry }) => {
    const label = `acknowledged clue ${index} (${scenario})`;
    if (!entry || typeof entry !== 'object') { problems.push(`${label}: not an object`); return; }
    for (const f of ['lock', 'in', 'reason', 'approved']) {
      if (typeof entry[f] !== 'string' || entry[f].trim() === '') problems.push(`${label}: ${f} is empty`);
    }
    problems.push(...signOffProblems(sections, entry, ['lock', 'in', 'reason'], label));
  });
  const labelled = markers
    .filter(({ entry }) => entry && typeof entry.approved === 'string')
    .map(({ scenario, index, entry }) => [`acknowledged clue ${index} (${scenario})`, entry.approved])
    .concat(otherApproved);
  for (const [heading, labels] of sharedHeadings(labelled)) {
    problems.push(`heading '## ${heading}' backs more than one entry: ${labels.join(', ')}`);
  }
  return problems;
}

// The other lists' [label, heading] pairs for the shared-heading rule, from whichever lists this
// branch carries: the known-failures list (always) and the payload-scan-exception list (6a-1).
function otherApproved() {
  const pairs = [];
  if (existsSync(LIST)) {
    JSON.parse(readFileSync(LIST, 'utf8')).filter((e) => e && typeof e.approved === 'string')
      .forEach((e, i) => pairs.push([`known failure ${i} (${e.scenario})`, e.approved]));
  }
  if (existsSync(EXCEPTIONS)) {
    JSON.parse(readFileSync(EXCEPTIONS, 'utf8')).filter((e) => e && typeof e.approved === 'string')
      .forEach((e, i) => pairs.push([`payload scan exception ${i} (${e.scenario})`, e.approved]));
  }
  return pairs;
}

const markers = readAcknowledgedClues(root);
const decisions = readFileSync(DECISIONS, 'utf8');

test('the corpus has markers to check', () => {
  // m06 and m08 carry one each on this branch; the test is meaningless if the reader finds none.
  assert.ok(markers.length >= 2, `expected at least the m06 and m08 markers, found ${markers.length}`);
});

test('every real marker is signed off under its own dated heading, no heading shared', () => {
  assert.deepEqual(checkAcknowledgedClues(markers, decisions, { otherApproved: otherApproved() }), []);
});

test('acknowledgedApproved returns a [label, heading] pair per signed marker', () => {
  const pairs = acknowledgedApproved(root);
  assert.equal(pairs.length, markers.filter(({ entry }) => entry && entry.approved).length);
  for (const [label, heading] of pairs) {
    assert.match(label, /^acknowledged clue \d+ \(scenarios\//);
    assert.equal(typeof heading, 'string');
  }
});

// ── the reader ───────────────────────────────────────────────────────────────────────────────

test('markersInText bracket-matches the array and ignores a bracket inside a string', () => {
  const text = `{\n  "acknowledgedClues": [\n    { "lock": "a", "in": "b]x", "reason": "r [not a close]", "approved": "h" }\n  ],\n  "rooms": {}\n}`;
  assert.deepEqual(markersInText(text), [{ lock: 'a', in: 'b]x', reason: 'r [not a close]', approved: 'h' }]);
  assert.deepEqual(markersInText('{ "rooms": {} }'), []);
});

// ── the checker against broken input ──────────────────────────────────────────────────────────

const good = { lock: 'console', in: 'server', reason: 'the slots are the deduction', approved: '2026-11-14: a clue' };
const marker = (entry, scenario = 'scenarios/mXX/scenario.json.erb', index = 0) => ({ scenario, index, entry });
const block = (o) => '```json\n' + JSON.stringify(o, null, 2) + '\n```\n';
const doc = (heading, ...blocks) => `# Validator decisions\n\n## ${heading}\n\n${blocks.join('\n')}\nprose\n`;
const ids = (e) => ({ lock: e.lock, in: e.in, reason: e.reason });

test('a well-formed marker with a matching block passes', () => {
  assert.deepEqual(checkAcknowledgedClues([marker(good)], doc(good.approved, block(ids(good)))), []);
});

test('a marker with no approved heading fails', () => {
  const e = { ...good, approved: undefined };
  const problems = checkAcknowledgedClues([marker(e)], doc(good.approved, block(ids(good))));
  assert.match(problems.join('\n'), /approved is empty|no 'approved' heading/);
});

test('an approved heading whose block names another lock fails', () => {
  const problems = checkAcknowledgedClues([marker(good)], doc(good.approved, block({ ...ids(good), lock: 'other_lock' })));
  assert.match(problems.join('\n'), /'lock' is "console" but the json block/);
});

test('an empty lock, in or reason fails', () => {
  for (const f of ['lock', 'in', 'reason']) {
    const e = { ...good, [f]: '  ' };
    assert.match(checkAcknowledgedClues([marker(e)], doc(e.approved, block(ids(e)))).join('\n'), new RegExp(`${f} is empty`));
  }
});

test('two markers naming one heading fail', () => {
  const a = marker(good, 'scenarios/m06/scenario.json.erb', 0);
  const b = marker({ ...good, lock: 'other', in: 'x', reason: 'y' }, 'scenarios/m08/scenario.json.erb', 0);
  const text = doc(good.approved, block(ids(good)));
  assert.match(checkAcknowledgedClues([a, b], text).join('\n'), /backs more than one entry/);
});

test('a marker sharing a heading with another list fails', () => {
  const text = doc(good.approved, block(ids(good)));
  const problems = checkAcknowledgedClues([marker(good)], text,
    { otherApproved: [['known failure 0 (scenarios/x/scenario.json.erb)', good.approved]] });
  assert.match(problems.join('\n'), /backs more than one entry/);
});
