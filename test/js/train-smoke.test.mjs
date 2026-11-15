// Pure parts of tools/playtest/train-smoke.mjs: argument parsing, the response filter, and the
// per-game and final summaries. No server or browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, badResponse, judgeGame, formatResult, summarise, DEFAULT_EXE } from '../../tools/playtest/train-smoke.mjs';

test('parseArgs takes a port and repeated or comma separated games', () => {
    const a = parseArgs(['--port', '3081', '--game', '10', '--game', '11,12'], {});
    assert.deepEqual([a.port, a.games], ['3081', ['10', '11', '12']]);
    assert.equal(a.exe, DEFAULT_EXE);
    assert.equal(a.timeoutMs, 120000);
});

test('parseArgs uses PLAYWRIGHT_CHROMIUM_EXECUTABLE and --timeout', () => {
    const a = parseArgs(['--port', '3081', '--game', '1', '--timeout', '30'], { PLAYWRIGHT_CHROMIUM_EXECUTABLE: '/x/chrome' });
    assert.equal(a.exe, '/x/chrome');
    assert.equal(a.timeoutMs, 30000);
});

test('parseArgs rejects bad input, and port 3000', () => {
    for (const argv of [[], ['--port', '3081'], ['--game', '1'], ['--port', 'abc', '--game', '1'],
        ['--port', '3081', '--game', 'x'], ['--port', '3081', '--game', '1', '--bogus'], ['--port', '3000', '--game', '1'],
        ['--port', '3081', '--game', '1', '--timeout', '0']]) {
        assert.ok(parseArgs(argv, {}).error, JSON.stringify(argv));
    }
});

test('badResponse flags 4xx/5xx but lets keyless POST /tts and the favicon through', () => {
    const u = p => `http://127.0.0.1:3081${p}`;
    assert.equal(badResponse({ status: 200, method: 'GET', url: u('/x') }), false);
    assert.equal(badResponse({ status: 304, method: 'GET', url: u('/x') }), false);
    assert.equal(badResponse({ status: 404, method: 'GET', url: u('/break_escape/js/x.js') }), true);
    assert.equal(badResponse({ status: 500, method: 'POST', url: u('/break_escape/games/5/rooms/a') }), true);
    assert.equal(badResponse({ status: 503, method: 'POST', url: u('/break_escape/games/5/tts') }), false);
    assert.equal(badResponse({ status: 503, method: 'GET', url: u('/break_escape/games/5/tts') }), true);
    assert.equal(badResponse({ status: 404, method: 'GET', url: u('/favicon.ico') }), false);
});

test('judgeGame passes a clean boot and names each problem otherwise', () => {
    const ok = judgeGame('7', { player: true, room: 'lobby', roomLoaded: true, pageErrors: [], badResponses: [] });
    assert.equal(ok.ok, true);
    assert.equal(formatResult(ok), 'SMOKE 7 OK room=lobby');
    const bad = judgeGame('8', { player: false, room: null, pageErrors: ['boom'], badResponses: [{ status: 404, method: 'GET', url: 'http://h/x.js' }] });
    assert.equal(bad.ok, false);
    assert.deepEqual(bad.problems, ['page error: boom', 'no player', 'start room not resolved', 'HTTP 404 GET http://h/x.js']);
    assert.match(formatResult(bad), /^SMOKE 8 FAIL /);
    assert.deepEqual(judgeGame('9', { player: true, room: 'a', roomLoaded: false }).problems, ['start room "a" is not loaded']);
    assert.deepEqual(judgeGame('9', { bootError: 'timeout', pageErrors: [] }).problems, ['boot: timeout']);
});

test('summarise prints the final line', () => {
    assert.equal(summarise([{ ok: true }, { ok: false }, { ok: true }]), 'TRAIN-SMOKE 3 games, 1 failed');
    assert.equal(summarise([]), 'TRAIN-SMOKE 0 games, 0 failed');
});
