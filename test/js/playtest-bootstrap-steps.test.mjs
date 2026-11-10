// bootstrap's ordering (.claude/skills/playtest-scenario/scripts/bootstrap-steps.js).
// lab_physical_pentest playtests, finding E8: (a) after a reload the opening briefing
// opened under the session-resume overlay and bootstrap dealt with the briefing first,
// so it either reported briefingPending behind the overlay or stalled on a paused
// dialogue; (b) on a slow machine bootstrap returned settled before the world had
// loaded (room null), and the briefing opened one call later.
// Run with: bin/test-js test/js/playtest-bootstrap-steps.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(import.meta.url);
const scripts = join(root, '.claude/skills/playtest-scenario/scripts');
const { nextBootstrapTarget, readBootstrapFacts, OPENING_WAIT_MS } = require(join(scripts, 'bootstrap-steps.js'));

const chat = { id: 'person-chat' };
const overlay = { id: 'session-resume-overlay', text: 'RESUME SESSION?', buttons: [{ label: 'Resume' }] };

test('the session overlay is handled before a minigame open underneath it', () => {
    assert.equal(nextBootstrapTarget({ overlayUp: true, mg: chat, bl: overlay, worldReady: true }), 'session-overlay');
    assert.equal(nextBootstrapTarget({ overlayUp: true, mg: { id: 'title-screen' }, bl: overlay }), 'session-overlay');
    assert.equal(nextBootstrapTarget({ overlayUp: true, mg: chat, bl: null }), 'wait-overlay', 'buttons not readable yet');
});

test('without the overlay: minigame, then other blocking UI', () => {
    assert.equal(nextBootstrapTarget({ mg: chat, bl: null }), 'minigame');
    assert.equal(nextBootstrapTarget({ mg: null, bl: { classes: 'tutorial-prompt-modal' } }), 'blocking');
});

test('nothing open is not clear until the world has loaded', () => {
    assert.equal(nextBootstrapTarget({ worldReady: false }), 'wait-world');
    assert.equal(nextBootstrapTarget({ worldReady: true }), 'clear');
});

test('a pending opening conversation is waited for, for a bounded time', () => {
    assert.equal(nextBootstrapTarget({ worldReady: true, openingPending: true, openingWaitedMs: 0 }), 'wait-opening');
    assert.equal(nextBootstrapTarget({ worldReady: true, openingPending: true, openingWaitedMs: OPENING_WAIT_MS }), 'clear');
});

test('readBootstrapFacts reads the page and never throws', () => {
    const saved = globalThis.window;
    try {
        globalThis.window = {};
        assert.deepEqual(readBootstrapFacts(), { overlayUp: false, mg: null, bl: null, worldReady: false, openingPending: false });
        globalThis.window = {
            breakEscapeSessionOverlayShowing: true,
            __test: { getState: () => ({ activeMinigame: chat, blockingUi: overlay, room: 'briefing_room' }) },
            npcManager: { hasPendingOpeningConversation: () => true },
        };
        assert.deepEqual(readBootstrapFacts(), { overlayUp: true, mg: chat, bl: overlay, worldReady: true, openingPending: true });
    } finally { globalThis.window = saved; }
});

test('the session script uses the ordering, and the bridge reports the overlay over a minigame', () => {
    const session = readFileSync(join(scripts, 'playtest-session.js'), 'utf8');
    assert.match(session, /const target = nextBootstrapTarget\(/);
    assert.match(session, /const mg = target === 'session-overlay' \? null : facts\.mg;/);
    const state = readFileSync(join(root, 'public/break_escape/js/systems/test-bridge/state.js'), 'utf8');
    assert.match(state, /blockingUi: \(mg && !sessionOverlayShowing\(\)\) \? null : detectBlockingUi\(\),/);
});
