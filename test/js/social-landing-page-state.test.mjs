// Landing-page persistence and the state-sync shape guard (07 N4, §5; 00 §11, §11a).
// state-sync.js keeps the two landing-page globals to their closed shapes before they are
// synced or flushed, as a defence in depth behind the overlay's own closed-key writes:
//  - se_landing_pages and se_landing_drafts default to {} when present as a non-object;
//  - a key outside the closed record set is dropped, on the overlay's write (buildRecord)
//    and again on sync (the guard);
//  - a tellsFound id outside the nine is dropped, likewise on write and on sync;
//  - a draft key outside the seven choice keys is dropped;
//  - the guard's closed sets stay in step with landing-page-model.js's exported constants;
//  - a full record for all six domain ids fits inside the 60 KB pagehide flush share;
//  - a mission with no landing state is left byte-for-byte unchanged (behaviour identical).
// Run with: bundle exec node --test test/js/social-landing-page-state.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-landing-page-state-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
const toMjs = s => s.replace(/'\.\/(api-client|config)\.js'/g, "'./$1.mjs'");
copy('config.js', 'config.mjs');
copy('api-client.js', 'api-client.mjs', toMjs);
copy('state-sync.js', 'state-sync.mjs', toMjs);
copy('minigames/landing-page-builder/landing-page-model.js', 'model.mjs');

globalThis.window = { breakEscapeConfig: { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' } };
globalThis.document = { querySelector: () => null };
const { StateSync } = await import(pathToFileURL(join(dir, 'state-sync.mjs')).href);
const { RECORD_KEYS, CHOICE_KEYS, TELL_IDS, buildRecord } = await import(pathToFileURL(join(dir, 'model.mjs')).href);

// The 60 KB keepalive body limit from state-sync.js (KEEPALIVE_BODY_LIMIT, not exported).
const KEEPALIVE_BODY_LIMIT = 60000;

// A game holding only the given globals; everything else a mission may export is absent.
function gameWith(globalVariables) {
  globalThis.window.gameState = { globalVariables, notes: [] };
  globalThis.window.currentRoom = { name: 'lobby' };
  return new StateSync();
}

// What state-sync would send for globalVariables (the sync path and the flush path both
// run through buildSharedSections, so this is the value the server would ever receive).
const synced = sync => sync.buildSharedSections().globalVariables;

// ---- defaults ------------------------------------------------------------------------

test('se_landing_pages and se_landing_drafts default to {} when present as a non-object', () => {
  for (const junk of [null, 'x', 7, true, ['a']]) {
    const g = synced(gameWith({ se_landing_pages: junk, se_landing_drafts: junk }));
    assert.deepEqual(g.se_landing_pages, {}, `pages from ${JSON.stringify(junk)}`);
    assert.deepEqual(g.se_landing_drafts, {}, `drafts from ${JSON.stringify(junk)}`);
  }
  // A page or draft whose value is not an object also collapses to {}
  const g = synced(gameWith({ se_landing_pages: { p1: 'nope', p2: ['a'] }, se_landing_drafts: { p1: 5 } }));
  assert.deepEqual(g.se_landing_pages, { p1: {}, p2: {} });
  assert.deepEqual(g.se_landing_drafts, { p1: {} });
});

// ---- record keys dropped on write and on sync ----------------------------------------

test('a key outside the closed record set is dropped on write (buildRecord) and on sync', () => {
  // On write: buildRecord already emits only the closed keys (P5-A).
  const written = buildRecord({ pageId: 'payroll_login', targetId: 'lord', credibility: 87 });
  assert.deepEqual(Object.keys(written).sort(), [...RECORD_KEYS].sort());

  // On sync: a save that somehow carries extra keys has them stripped.
  const dirty = {
    pageId: 'payroll_login', targetId: 'lord',
    choices: { brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_word', logo: 'crisp', wording: 'w_formal', fields: ['email', 'password'], padlock: true, injected: 'x' },
    credibility: 87, gatesPassed: true, meetsThreshold: true,
    tellsFound: ['formOrigin', 'hoverMismatch'],
    victim: { visited: true, submitted: true, noticed: false, extra: 1 },
    built: true,
    serialize: 'DROP ME', __proto__hack: true, password: 'secret'
  };
  const g = synced(gameWith({ se_landing_pages: { payroll_login: dirty } }));
  const rec = g.se_landing_pages.payroll_login;
  assert.deepEqual(Object.keys(rec).sort(), Object.keys(dirty).filter(k => RECORD_KEYS.includes(k)).sort());
  assert.ok(!('serialize' in rec) && !('password' in rec));
  assert.deepEqual(Object.keys(rec.choices).sort(), [...CHOICE_KEYS].sort(), 'inner choices closed too');
  assert.ok(!('injected' in rec.choices));
  assert.deepEqual(Object.keys(rec.victim).sort(), ['noticed', 'submitted', 'visited']);
  assert.ok(!('extra' in rec.victim));
});

test('a tellsFound id outside the nine is dropped on write and on sync', () => {
  const written = buildRecord({ pageId: 'p', tellsFound: ['domain', 'formOrigin', 'not_a_tell', 'serialize'] });
  assert.deepEqual(written.tellsFound, ['domain', 'formOrigin']);

  const g = synced(gameWith({ se_landing_pages: { p: { pageId: 'p', tellsFound: ['domain', 'formOrigin', 'hoverMismatch', 'bogus', 123] } } }));
  assert.deepEqual(g.se_landing_pages.p.tellsFound, ['domain', 'formOrigin', 'hoverMismatch']);
  // Every id the guard keeps is one of the model's nine.
  assert.ok(g.se_landing_pages.p.tellsFound.every(id => TELL_IDS.includes(id)));
});

// ---- draft keys ----------------------------------------------------------------------

test('a draft key outside the seven choice keys is dropped on sync', () => {
  const draft = { brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_word', logo: 'crisp', wording: 'w_formal', fields: ['email', 'password'], padlock: true, credibility: 99, injected: 'x' };
  const g = synced(gameWith({ se_landing_drafts: { payroll_login: draft } }));
  const kept = g.se_landing_drafts.payroll_login;
  assert.deepEqual(Object.keys(kept).sort(), [...CHOICE_KEYS].sort());
  assert.ok(!('credibility' in kept) && !('injected' in kept));
});

// ---- single source of truth ----------------------------------------------------------

test('a record and draft built from the model pass the guard unchanged (closed sets in step)', () => {
  const record = buildRecord({
    pageId: 'payroll_login', targetId: 'lord',
    choices: { brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_word', logo: 'crisp', wording: 'w_formal', fields: ['email', 'password'], padlock: true },
    credibility: 87, gatesPassed: true, meetsThreshold: true,
    tellsFound: TELL_IDS.slice(), victim: { visited: true, submitted: true, noticed: false }, built: true
  });
  const draft = {}; for (const k of CHOICE_KEYS) draft[k] = k === 'fields' ? ['email'] : k === 'padlock' ? true : 'v';
  const g = synced(gameWith({ se_landing_pages: { payroll_login: record }, se_landing_drafts: { payroll_login: draft } }));
  assert.deepEqual(g.se_landing_pages.payroll_login, record, 'model record survives the guard intact');
  assert.deepEqual(g.se_landing_drafts.payroll_login, draft, 'model-shaped draft survives the guard intact');
});

// ---- flush size ----------------------------------------------------------------------

test('a full record for all six domain ids fits inside the 60 KB pagehide flush share', () => {
  const domainIds = ['d_word', 'd_sub', 'd_letter', 'd_vv', 'd_homoglyph', 'd_rtl'];
  const pages = {};
  const drafts = {};
  domainIds.forEach((domainId, i) => {
    const pageId = `page_${i}`;
    pages[pageId] = buildRecord({
      pageId, targetId: 'lord',
      choices: { brand: 'ledgerwell', purpose: 'payslip', domainId, logo: 'crisp', wording: 'w_formal', fields: ['email', 'password'], padlock: true },
      credibility: 100, gatesPassed: true, meetsThreshold: true,
      tellsFound: TELL_IDS.slice(), victim: { visited: true, submitted: true, noticed: false }, built: true
    });
    drafts[pageId] = pages[pageId].choices;
  });
  const sync = gameWith({ se_landing_pages: pages, se_landing_drafts: drafts });
  const changes = sync.buildChanges({ forceClock: true });
  const body = JSON.stringify({ ...changes.body, clientTs: 1 });
  assert.ok(body.length < KEEPALIVE_BODY_LIMIT, `flush body ${body.length} bytes is under ${KEEPALIVE_BODY_LIMIT}`);
  // It is in fact tiny: six id-and-boolean records leave the whole budget almost untouched.
  assert.ok(body.length < 4000, `six records are small (${body.length} bytes)`);
});

// ---- no landing state: behaviour identical -------------------------------------------

test('a mission with no landing state is left unchanged (neither global added or altered)', () => {
  const globals = { mission_phase: 'day', briefing_seen: true, se_board_state: { defender: {} } };
  const g = synced(gameWith({ ...globals }));
  assert.ok(!('se_landing_pages' in g), 'no se_landing_pages key invented');
  assert.ok(!('se_landing_drafts' in g), 'no se_landing_drafts key invented');
  assert.deepEqual(g, globals, 'the globals are copied through untouched');
});

test('the guard replaces, never mutates, the live gameState globals', () => {
  const live = { payroll_login: { pageId: 'payroll_login', injected: 'x' } };
  const sync = gameWith({ se_landing_pages: live });
  const g = synced(sync);
  assert.ok(!('injected' in g.se_landing_pages.payroll_login), 'the synced copy is cleaned');
  assert.equal(window.gameState.globalVariables.se_landing_pages.payroll_login.injected, 'x', 'the live global is untouched');
});
