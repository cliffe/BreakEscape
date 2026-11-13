// The shell X check (tools/playtest/shell-x-check.mjs) as a merge-batch test. It needs a keyless
// server and a game, so it runs only when SHELL_X_PORT and SHELL_X_GAME are set (the orchestrator
// sets them for a merge batch, with PLAYWRIGHT_CHROMIUM_EXECUTABLE); otherwise it skips.
//   SHELL_X_PORT=3450 SHELL_X_GAME=3084 node --test test/js/shell-x-check.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const port = process.env.SHELL_X_PORT, game = process.env.SHELL_X_GAME;

test('the close X stays in the viewport and clear of scrollbars after the shell scrolls, at three sizes',
    { skip: !(port && game) && 'set SHELL_X_PORT and SHELL_X_GAME to run against a keyless server', timeout: 900000 }, () => {
        const scenes = process.env.SHELL_X_SCENES ? ['--scenes', process.env.SHELL_X_SCENES] : [];
        const r = spawnSync('node', [join(here, '../../tools/playtest/shell-x-check.mjs'), '--port', port, '--game', game, ...scenes], { encoding: 'utf8' });
        assert.equal(r.status, 0, (r.stdout || '').split('\n').filter(l => /FAIL|SHELL-X/.test(l)).join('\n') + (r.stderr || ''));
    });
