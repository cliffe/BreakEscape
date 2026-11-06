// minigames/landing-page-builder/landing-page-model.js runtime guard (07 section 1, N6b, model half).
// The model refuses to score any domain that is not on the page's authored menu, or whose host
// does not end `.example`, and reports it blocked so the renderer draws a "blocked" placeholder.
// Three fixtures from N6b:
//   (a) a menu entry injected straight into the model with host `ledgerwell.test` -> blocked;
//   (b) an off-menu domain id, valid in shape but not on the menu -> blocked;
//   (c) the menu domain `ledgerwell-hr.example` -> scored normally.
// The renderer half of N6b (the drawn "blocked" placeholder) lives in P5-B's
// social-landing-page-render test, which needs a DOM.
// Run with: bundle exec node --test test/js/social-landing-page-guard.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-landing-page-guard-'));
writeFileSync(join(dir, 'model.mjs'), readFileSync(join(js, 'minigames/landing-page-builder/landing-page-model.js'), 'utf8'));
const { scorePage, guardDomain } = await import(pathToFileURL(join(dir, 'model.mjs')).href);

// A page whose menu holds one good `.example` domain and one injected `.test` domain (the
// kind the offline lint would reject, but which a hand-edited scenario could slip past it).
const pageDef = {
  id: 'payroll_login', linkText: 'ledgerwell.example/payroll',
  pretext: { brandId: 'ledgerwell', purposeId: 'payslip', tone: 'formal' },
  brands: [{
    id: 'ledgerwell', name: 'Ledgerwell', look: 'generic', realDomain: 'ledgerwell.example',
    realFields: ['email', 'password'],
    domains: [
      { id: 'd_word', domain: 'ledgerwell-hr.example', trick: 'extra-word', tier: 2 },
      { id: 'd_bad_suffix', domain: 'ledgerwell.test', trick: 'extra-word', tier: 2 }  // injected (a)
    ]
  }],
  purposes: [{ id: 'payslip', label: 'Payslip ready' }],
  logos: [{ id: 'crisp' }],
  wordings: [{ id: 'w_formal', match: true, text: 'x' }],
  fields: ['email', 'password'], extraSensitiveFields: ['card_number', 'ni_number'],
  targets: { lord: { linkThreshold: 70, minDomainTier: 2 } }
};
const choices = (domainId) => ({
  brand: 'ledgerwell', purpose: 'payslip', domainId, logo: 'crisp',
  wording: 'w_formal', fields: ['email', 'password'], padlock: true
});

test('(a) a menu domain whose host does not end .example is blocked', () => {
  const g = guardDomain(pageDef, choices('d_bad_suffix'));
  assert.equal(g.blocked, true);
  assert.equal(g.reason, 'bad-suffix');
  assert.deepEqual(scorePage(pageDef, choices('d_bad_suffix'), 'lord'), { blocked: true });
});

test('(b) an off-menu domain id is blocked', () => {
  const g = guardDomain(pageDef, choices('d_not_a_real_id'));
  assert.equal(g.blocked, true);
  assert.equal(g.reason, 'off-menu');
  assert.deepEqual(scorePage(pageDef, choices('d_not_a_real_id'), 'lord'), { blocked: true });
});

test('(c) a real menu .example domain scores normally', () => {
  const g = guardDomain(pageDef, choices('d_word'));
  assert.equal(g.blocked, false);
  assert.equal(g.domain, 'ledgerwell-hr.example');
  const r = scorePage(pageDef, choices('d_word'), 'lord');
  assert.equal(r.blocked, false);
  assert.ok(typeof r.credibility === 'number');
});

test('the guard strips a scheme and a path before the .example check', () => {
  const pd = JSON.parse(JSON.stringify(pageDef));
  pd.brands[0].domains = [{ id: 'd_path', domain: 'ledgerwell-hr.example/payroll', trick: 'extra-word', tier: 2 }];
  assert.equal(guardDomain(pd, choices('d_path')).blocked, false);
  const pd2 = JSON.parse(JSON.stringify(pageDef));
  pd2.brands[0].domains = [{ id: 'd_scheme', domain: 'https://ledgerwell-hr.example/payroll', trick: 'extra-word', tier: 2 }];
  assert.equal(guardDomain(pd2, choices('d_scheme')).blocked, false);
});
