// The shell X check (tools/playtest/shell-x-check.mjs) as a merge-batch test. It needs a keyless
// server and a game, so it runs when SHELL_X_PORT and SHELL_X_GAME are set (with
// PLAYWRIGHT_CHROMIUM_EXECUTABLE). Without them it skips on a plain run and FAILS under
// MERGE_BATCH=1, so a merge batch cannot pass by skipping it. The commands are in
// docs/achitechture/UI_SHELL_BUILD_LOG.md, section "Review round 2 fixes".
// tools/playtest/train-check.sh runs the check once per train itself, beside the Rails suite, and sets
// SHELL_X_SEPARATE=1 for the batch; it records the result in its summary and fails the train on it.
//   SHELL_X_PORT=3450 SHELL_X_GAME=3084 node --test test/js/shell-x-check.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const port = process.env.SHELL_X_PORT, game = process.env.SHELL_X_GAME;
const mergeBatch = process.env.MERGE_BATCH === '1';
const runSeparately = process.env.SHELL_X_SEPARATE === '1';

if (mergeBatch && !runSeparately && !(port && game)) {
    test('shell X check is configured for the merge batch', () => {
        assert.fail('MERGE_BATCH=1 needs SHELL_X_PORT (a keyless server port) and SHELL_X_GAME (a game id on it), plus PLAYWRIGHT_CHROMIUM_EXECUTABLE. Start the server with tools/playtest/start-keyless-server.sh (or by hand on a free port), make a game, then set the variables. See "Review round 2 fixes" in docs/achitechture/UI_SHELL_BUILD_LOG.md.');
    });
}

test('the close X stays in the viewport, inside its frame, clickable and clear of scrollbars after the shell scrolls, at four sizes',
    { skip: (runSeparately && 'train-check.sh runs the shell X check once, outside the batch') || (!(port && game) && 'set SHELL_X_PORT and SHELL_X_GAME to run against a keyless server'), timeout: 900000 }, () => {
        const scenes = process.env.SHELL_X_SCENES ? ['--scenes', process.env.SHELL_X_SCENES] : [];
        const r = spawnSync('node', [join(here, '../../tools/playtest/shell-x-check.mjs'), '--port', port, '--game', game, ...scenes], { encoding: 'utf8' });
        assert.equal(r.status, 0, (r.stdout || '').split('\n').filter(l => /FAIL|SHELL-X/.test(l)).join('\n') + (r.stderr || ''));
    });
