// Session-resume overlay keys (ui/session-resume-keys.js, games/show.html.erb). User decision
// 2026-10-17: while the overlay shows, Enter (and numpad Enter) resumes and every other key
// does nothing, reaching neither the title screen nor the game underneath. Clicks are untouched.
// Run with: node --test test/js/session-resume-keys.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'session-resume-keys-'));
writeFileSync(join(dir, 'session-resume-keys.mjs'), readFileSync(join(here, '../../public/break_escape/js/ui/session-resume-keys.js'), 'utf8'));
const { installResumeKeyGuard, isResumeKey, isBrowserShortcut } = await import(pathToFileURL(join(dir, 'session-resume-keys.mjs')).href);

// A window stand-in: capture listeners run first, then the page's own listeners (the
// title screen on document, Phaser on window) unless an earlier one stopped the event.
function fakeWindow() {
  const capture = {};
  const page = [];
  return {
    addEventListener(type, fn, useCapture) { if (useCapture) (capture[type] ||= []).push(fn); else page.push({ type, fn }); },
    removeEventListener(type, fn, useCapture) { if (useCapture) capture[type] = (capture[type] || []).filter(f => f !== fn); },
    pageListen(type, fn) { page.push({ type, fn }); },
    dispatch(type, init = {}) {
      const e = { type, key: '', code: '', repeat: false, ctrlKey: false, altKey: false, metaKey: false, ...init,
        stopped: false, prevented: false,
        stopImmediatePropagation() { this.stopped = true; },
        preventDefault() { this.prevented = true; } };
      for (const fn of capture[type] || []) { fn(e); if (e.stopped) return e; }
      for (const l of page) if (l.type === type) l.fn(e);
      return e;
    },
  };
}

function setup() {
  const win = fakeWindow();
  const state = { showing: true, resumed: 0, titleKeys: [] };
  win.pageListen('keydown', (e) => state.titleKeys.push(e.key));
  const remove = installResumeKeyGuard({
    target: win,
    isShowing: () => state.showing,
    onResume: () => { state.resumed++; state.showing = false; },
  });
  return { win, state, remove };
}

test('isResumeKey: Enter and numpad Enter only', () => {
  assert.ok(isResumeKey({ key: 'Enter', code: 'Enter' }));
  assert.ok(isResumeKey({ key: 'Enter', code: 'NumpadEnter' }));
  assert.ok(isResumeKey({ key: '', code: 'NumpadEnter' }));
  assert.ok(!isResumeKey({ key: ' ', code: 'Space' }));
  assert.ok(!isResumeKey({ key: 'Escape', code: 'Escape' }));
});

test('Enter resumes once and never reaches the title screen, keyup and keypress included', () => {
  const { win, state } = setup();
  const down = win.dispatch('keydown', { key: 'Enter', code: 'Enter' });
  assert.equal(state.resumed, 1);
  assert.ok(down.stopped && down.prevented);
  win.dispatch('keypress', { key: 'Enter', code: 'Enter' });
  win.dispatch('keydown', { key: 'Enter', code: 'Enter', repeat: true });
  win.dispatch('keyup', { key: 'Enter', code: 'Enter' });
  assert.deepEqual(state.titleKeys, [], 'the title screen saw nothing from the resuming press');
  // The next, fresh press is the player's own, after the overlay: it goes through.
  win.dispatch('keydown', { key: 'Enter', code: 'Enter' });
  assert.deepEqual(state.titleKeys, ['Enter']);
  assert.equal(state.resumed, 1);
});

test('numpad Enter resumes too', () => {
  const { win, state } = setup();
  win.dispatch('keydown', { key: 'Enter', code: 'NumpadEnter' });
  assert.equal(state.resumed, 1);
});

test('other keys do nothing while the overlay shows', () => {
  const { win, state } = setup();
  for (const [key, code] of [[' ', 'Space'], ['Escape', 'Escape'], ['w', 'KeyW'], ['ArrowUp', 'ArrowUp'], ['Tab', 'Tab'], ['e', 'KeyE']]) {
    const e = win.dispatch('keydown', { key, code });
    assert.ok(e.stopped, `${key} stopped`);
    assert.ok(e.prevented, `${key} default prevented`);
    win.dispatch('keyup', { key, code });
  }
  assert.equal(state.resumed, 0);
  assert.equal(state.showing, true);
  assert.deepEqual(state.titleKeys, []);
});

test('browser shortcuts keep their default but still do not reach the game', () => {
  const { win, state } = setup();
  for (const init of [{ key: 'r', code: 'KeyR', ctrlKey: true }, { key: 'F5', code: 'F5' }, { key: 'F12', code: 'F12' }, { key: 'Enter', code: 'Enter', altKey: true }]) {
    const e = win.dispatch('keydown', init);
    assert.ok(e.stopped);
    assert.ok(!e.prevented, `${init.key} keeps its browser default`);
  }
  assert.equal(state.resumed, 0, 'Alt+Enter is a shortcut, not Resume');
  assert.ok(isBrowserShortcut({ key: 'F1' }) && !isBrowserShortcut({ key: 'f' }));
});

test('a held Enter repeating does not resume twice', () => {
  const { win, state } = setup();
  state.showing = true;
  win.dispatch('keydown', { key: 'Enter', code: 'Enter', repeat: true });
  assert.equal(state.resumed, 0, 'a repeat from a press that began before the overlay is ignored');
  win.dispatch('keydown', { key: 'Enter', code: 'Enter' });
  assert.equal(state.resumed, 1);
});

test('with the overlay gone, keys pass straight through; the guard can be removed', () => {
  const { win, state, remove } = setup();
  state.showing = false;
  win.dispatch('keydown', { key: ' ', code: 'Space' });
  assert.deepEqual(state.titleKeys, [' ']);
  state.showing = true;
  remove();
  win.dispatch('keydown', { key: 'x', code: 'KeyX' });
  assert.deepEqual(state.titleKeys, [' ', 'x']);
});

test('show.html.erb loads the guard as a module before the overlay script and resumes through the button', () => {
  const erb = readFileSync(join(here, '../../app/views/break_escape/games/show.html.erb'), 'utf8');
  const mod = erb.indexOf("type=\"module\" src=\"<%= be_asset_path('/break_escape/js/ui/session-resume-keys.js') %>\"");
  const overlayScript = erb.indexOf("getElementById('session-resume-overlay')", erb.indexOf('<script', mod + 1));
  assert.ok(mod > 0, 'module tag present');
  assert.ok(overlayScript > mod, 'module comes before the overlay script');
  assert.match(erb, /installResumeKeyGuard\(\{[\s\S]*?resumeBtn\.click\(\)/);
});
