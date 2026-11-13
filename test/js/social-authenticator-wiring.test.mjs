// P7-W3 wiring: the `authenticator` scene is registered, its CSS is linked, and
// window.startAuthenticator passes the social overlay flags before construction.
// The starter source is cut out of minigame-starters.js (the file pulls in Phaser-side
// imports) and run against a fake MinigameFramework and the real socialOverlayParams.
// Run with: bundle exec node --test test/js/social-authenticator-wiring.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');
const read = (p) => readFileSync(p, 'utf8');

test('index.js imports, exports and registers the authenticator scene', () => {
    const src = read(join(js, 'minigames/index.js'));
    const path = "'./authenticator/authenticator-minigame.js'";
    assert.match(src, new RegExp(`import \\{ AuthenticatorMinigame \\} from ${path}`));
    assert.match(src, new RegExp(`export \\{ AuthenticatorMinigame \\} from ${path}`));
    assert.match(src, /MinigameFramework\.registerScene\('authenticator', AuthenticatorMinigame\);/);
});

test('show.html.erb links the authenticator stylesheet', () => {
    const erb = read(join(root, 'app/views/break_escape/games/show.html.erb'));
    assert.match(erb, /css\/authenticator-minigame\.css/);
});

test('startAuthenticator sets requiresKeyboardInput and disableClose, caller params kept', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'social-auth-wiring-'));
    writeFileSync(join(dir, 'overlay.mjs'),
        'export ' + read(join(js, 'minigames/framework/social-overlay.js'))
            .match(/function socialOverlayParams[\s\S]*?\n\}/)[0]);
    const src = read(join(js, 'systems/minigame-starters.js'));
    const fn = src.match(/export function startAuthenticator[\s\S]*?\nwindow\.startAuthenticator = startAuthenticator;/)[0];
    writeFileSync(join(dir, 'starter.mjs'), "import { socialOverlayParams } from './overlay.mjs';\n" + fn);

    const calls = [];
    globalThis.window = {
        MinigameFramework: {
            mainGameScene: {},
            startMinigame: (...a) => calls.push(a)
        }
    };
    await import(pathToFileURL(join(dir, 'starter.mjs')).href);
    assert.equal(typeof window.startAuthenticator, 'function');

    let done;
    const pushes = [{ at: '02:14', app: 'Authy', account: 'a', location: 'x', device: 'y' }, { at: '02:15', app: 'Authy', account: 'a', location: 'x', device: 'y' }];
    window.startAuthenticator({ pushes, approvesAt: '02:15', mode: 'attacker', onComplete: (s, r) => { done = [s, r]; } });
    assert.equal(calls.length, 1);
    const [scene, , params] = calls[0];
    assert.equal(scene, 'authenticator');
    assert.equal(params.requiresKeyboardInput, true);
    assert.equal(params.disableClose, true);
    assert.deepEqual(params.pushes, pushes);
    assert.equal(params.approvesAt, '02:15');
    params.onComplete(true, { approvedAt: 1 });
    assert.deepEqual(done, [true, { approvedAt: 1 }]);
});
