// Unit tests for the pure parts of tools/playtest/sync-delta-proof.mjs.
// The browser driving is proved by the live run; these cover the record
// classification, summary, table and argv parsing (plan 10.3).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  routeLabel, gameIdOf, summarise, renderTable, hasSavedCards, parseArgs
} from '../../tools/playtest/sync-delta-proof.mjs';

test('routeLabel picks the action after the game id', () => {
  assert.equal(routeLabel('http://127.0.0.1:3112/break_escape/games/42/sync_state'), 'sync_state');
  assert.equal(routeLabel('/break_escape/games/42/network/plant'), 'network/plant');
  assert.equal(routeLabel('/break_escape/games/42/network/join?x=1'), 'network/join');
  assert.equal(routeLabel('/break_escape/games/42/scenario'), 'scenario');
  assert.equal(routeLabel('/break_escape/games/42'), 'page');
  assert.equal(routeLabel('/break_escape/games/42/'), 'page');
});

test('routeLabel ignores non-game routes', () => {
  assert.equal(routeLabel('http://127.0.0.1:3112/assets/app.js'), null);
  assert.equal(routeLabel('/break_escape/missions/3'), null);
  assert.equal(routeLabel('https://example.com/break_escape/games/x/sync_state'), null);
});

test('gameIdOf reads the numeric id', () => {
  assert.equal(gameIdOf('http://127.0.0.1:3112/break_escape/games/1234/sync_state'), 1234);
  assert.equal(gameIdOf('/break_escape/games/7'), 7);
  assert.equal(gameIdOf('/assets/x.js'), null);
});

test('summarise groups by phase, method and route with totals and maxima', () => {
  const recs = [
    { phase: 'postload1', method: 'PUT', route: 'sync_state', reqBytes: 100, respBytes: 50 },
    { phase: 'postload1', method: 'PUT', route: 'sync_state', reqBytes: 300, respBytes: 20 },
    { phase: 'postload1', method: 'POST', route: 'network/plant', reqBytes: 40, respBytes: 9500 },
    { phase: 'load1', method: 'GET', route: 'scenario', reqBytes: 0, respBytes: 80000 }
  ];
  const rows = summarise(recs);
  assert.equal(rows.length, 3);
  const sync = rows.find(r => r.route === 'sync_state');
  assert.equal(sync.count, 2);
  assert.equal(sync.reqBytesTotal, 400);
  assert.equal(sync.maxReqBytes, 300);
  assert.equal(sync.maxRespBytes, 50);
  // sorted by phase first: load1 before postload1
  assert.equal(rows[0].phase, 'load1');
});

test('summarise treats missing byte counts as zero', () => {
  const rows = summarise([{ phase: 'p', method: 'PUT', route: 'sync_state' }]);
  assert.equal(rows[0].reqBytesTotal, 0);
  assert.equal(rows[0].respBytesTotal, 0);
});

test('renderTable prints one row per summary row with a label heading', () => {
  const md = renderTable([
    { phase: 'load', method: 'GET', route: 'scenario', count: 1, reqBytesTotal: 0, respBytesTotal: 80000, maxReqBytes: 0, maxRespBytes: 80000 }
  ], { label: 'base case A' });
  assert.match(md, /### base case A/);
  assert.match(md, /\| load \| GET \| scenario \| 1 \| 0 \| 80000 \| 0 \| 80000 \|/);
  assert.match(md, /\| Phase \| Method \| Route \|/);
});

test('hasSavedCards finds a saved_cards list at any depth', () => {
  assert.equal(hasSavedCards({ inventory: [{ type: 'rfid_cloner', saved_cards: [1, 2] }] }), true);
  assert.equal(hasSavedCards([{ a: { b: { saved_cards: [] } } }]), true);
  assert.equal(hasSavedCards({ success: true, added: [{ id: 'x' }] }), false);
  assert.equal(hasSavedCards(null), false);
  assert.equal(hasSavedCards('saved_cards'), false);
});

test('parseArgs reads --opt value and --opt=value with defaults', () => {
  const a = parseArgs(['--url', 'http://h/break_escape/games/5', '--case', 'A', '--idle', '1000']);
  assert.equal(a.url, 'http://h/break_escape/games/5');
  assert.equal(a.case, 'A');
  assert.equal(a.idle, 1000);
  assert.equal(a.reloads, 2); // default

  const b = parseArgs(['--url=http://h/break_escape/games/9', '--case=bootstrap', '--label=base 6a83']);
  assert.equal(b.url, 'http://h/break_escape/games/9');
  assert.equal(b.case, 'bootstrap');
  assert.equal(b.label, 'base 6a83');

  const c = parseArgs([]);
  assert.equal(c.case, 'bootstrap');
  assert.equal(c.idle, 40000);
});
