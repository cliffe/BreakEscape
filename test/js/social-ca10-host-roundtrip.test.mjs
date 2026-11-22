// ca10 fake-check host survives the sync boundary. The builder stores choices.check.hostId in
// se_landing_pages[pageId] (buildRecord/applyScore/setBuilt); state-sync then sends the globals
// to the server, and a reload reads them back. state-sync's closed landing-record shape once
// dropped `check`, so after a reload flipPage saw no hostId and showed the genuine host.
// This runs the builder's own record functions -> StateSync.buildSharedSections -> a JSON round
// trip (the server copy) -> flipPage. No choices are built by hand for flipPage.
// Run with: node test/js/social-ca10-host-roundtrip.test.mjs
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-ca10-host-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
  'config.js', 'api-client.js', 'state-sync.js',
  'minigames/landing-page-builder/landing-page-model.js',
  'minigames/episode-runner/episode-model.js'
]) {
  mkdirSync(dirname(join(dir, rel)), { recursive: true });
  writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
globalThis.window = { breakEscapeConfig: { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' } };
globalThis.document = { querySelector: () => null };
const mod = rel => import(pathToFileURL(join(dir, rel)).href);
const { StateSync } = await mod('state-sync.js');
const { buildRecord, applyScore, setBuilt } = await mod('minigames/landing-page-builder/landing-page-model.js');
const { flipPage } = await mod('minigames/episode-runner/episode-model.js');

const PAGE = 'ca10_check';
const def = {
  id: PAGE, pageType: 'fakeCheck',
  check: {
    host: 'orders.fernside.example', heading: 'Verify you are human',
    hosts: [
      { id: 'genuine', label: 'Real portal', trust: 'genuine' },
      { id: 'lookalike', label: 'Look-alike', trust: 'lookalike', host: 'orders-fernside.example' }
    ]
  }
};
const episode = { attack: { landingPageId: PAGE }, stages: ['build'] };
const social = { landingPages: [def] };

// What the builder writes for a built page, then what the server holds after a sync.
function builtGlobals(hostId) {
  const choices = { check: { hostId, pretextId: 'fits', urgencyId: 'calm', stepsId: 'smooth' } };
  let rec = applyScore(null, { pageId: PAGE, targetId: 'visitor', choices, credibility: 90, gatesPassed: true, meetsThreshold: true });
  rec = setBuilt(rec, true);
  return { se_landing_pages: { [PAGE]: rec }, [`landing_${PAGE}_built`]: true };
}
function afterSync(globals) {
  globalThis.window.gameState = { globalVariables: globals, notes: [] };
  globalThis.window.currentRoom = { name: 'lobby' };
  const sent = new StateSync().buildSharedSections().globalVariables;
  return JSON.parse(JSON.stringify(sent)); // the server copy a reload reads back
}

for (const [hostId, expectUrl] of [['lookalike', 'https://orders-fernside.example/'], ['genuine', 'https://orders.fernside.example/']]) {
  test(`${hostId} host: flipPage shows it from the in-memory record and after sync + reload`, () => {
    const g = builtGlobals(hostId);
    assert.equal(flipPage(episode, social, g).hostId, hostId);
    const reloaded = { ...g, ...afterSync(g) };
    const page = flipPage(episode, social, reloaded);
    assert.equal(page.hostId, hostId, 'hostId survives the sync boundary');
    assert.equal(page.url, expectUrl);
    assert.equal(reloaded.se_landing_pages[PAGE].choices.check.hostId, hostId);
  });
}

test('drafts keep the closed check block too; extra check keys are still dropped', () => {
  const g = { se_landing_drafts: { [PAGE]: { check: { hostId: 'lookalike', pretextId: null, urgencyId: null, stepsId: null, EXTRA: 'x' } } } };
  const out = afterSync(g);
  assert.deepEqual(out.se_landing_drafts[PAGE].check, { hostId: 'lookalike', pretextId: null, urgencyId: null, stepsId: null });
});

test('a sign-in record still carries no check key after sync', () => {
  const rec = buildRecord({ pageId: 'p', targetId: 't', choices: { brand: 'b', domainId: 'd' } });
  const out = afterSync({ se_landing_pages: { p: rec } });
  assert.ok(!('check' in out.se_landing_pages.p.choices));
});
