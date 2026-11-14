// Parity for the landing-page scorer (docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md
// section 4). This JS half asserts scorePage / scoreFakeCheck in landing-page-model.js produce
// each shared fixture's recorded `expected`; the Ruby half
// (test/models/break_escape/phish_score_parity_test.rb) asserts BreakEscape::PhishScore.score
// produces the same. Both read test/fixtures/files/phish_score_parity/fixtures.json, so a change
// to either scorer that is not mirrored in the fixtures fails a red test.
// Run with: node --test test/js/social-phish-score-parity.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-phish-score-parity-'));
writeFileSync(join(dir, 'model.mjs'), readFileSync(join(js, 'minigames/landing-page-builder/landing-page-model.js'), 'utf8'));
const { scorePage } = await import(pathToFileURL(join(dir, 'model.mjs')).href);

const fixtures = JSON.parse(readFileSync(join(here, '../fixtures/files/phish_score_parity/fixtures.json'), 'utf8'));

for (const kase of fixtures.cases) {
  test('JS scorer matches recorded result: ' + kase.name, () => {
    const page = fixtures.pages[kase.page];
    const result = scorePage(page, kase.choices, kase.target);
    const expected = kase.expected;

    assert.equal(result.blocked, expected.blocked === true, 'blocked');
    if (expected.blocked) {
      // scorePage returns { blocked: true } with no credibility for a blocked page.
      assert.equal(result.credibility, undefined, 'credibility on a blocked page');
      return;
    }
    assert.equal(result.credibility, expected.credibility, 'credibility');
    assert.equal(result.gatesPassed, expected.gatesPassed, 'gatesPassed');
    assert.equal(result.meetsThreshold, expected.meetsThreshold, 'meetsThreshold');
  });
}
