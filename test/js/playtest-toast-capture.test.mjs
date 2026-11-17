// The playtest harness's `toasts` log (toast-capture.js): a toast is logged once, by element,
// and the hidden measurement clones ui/hud-lanes.js builds are not toasts. Integrator run: one
// warning raised beside an info toast was logged twice, 12 ms apart, with one .notification in
// the DOM; the second entry was hud-lanes' clone in its [data-hud-measure] host.
// Run with: node test/js/playtest-toast-capture.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { installToastCapture } = require(join(root, '.claude/skills/playtest-scenario/scripts/toast-capture.js'));

const tick = () => new Promise((r) => setTimeout(r, 5));

function page() {
  const dom = new JSDOM('<!doctype html><html><body><div id="notification-container"></div></body></html>');
  const { window } = dom;
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.MutationObserver = window.MutationObserver;
  installToastCapture();
  const toast = (type, msg) => {
    const el = window.document.createElement('div');
    el.className = `notification ${type}`;
    el.innerHTML = `<div class="notification-message">${msg}</div>`;
    return el;
  };
  return { window, doc: window.document, toast, box: window.document.getElementById('notification-container') };
}

test('a toast is logged once, with its type and text', async () => {
  const p = page();
  p.box.appendChild(p.toast('warning', 'careful'));
  await tick();
  assert.deepEqual(p.window.__toastLog.map((t) => [t.type, t.message]), [['warning', 'careful']]);
});

test('a hud-lanes measurement clone of a toast is not logged', async () => {
  const p = page();
  const real = p.toast('warning', 'careful');
  p.box.appendChild(real);
  const host = p.doc.createElement('div');
  host.setAttribute('data-hud-measure', '1');
  host.appendChild(real.cloneNode(true));
  p.doc.body.appendChild(host);
  host.remove();
  p.box.appendChild(p.toast('info', 'Task done'));
  await tick();
  assert.deepEqual(p.window.__toastLog.map((t) => [t.type, t.message]), [['warning', 'careful'], ['info', 'Task done']]);
});

test('a toast moved inside the container (lanes reorder errors first) is not logged again', async () => {
  const p = page();
  const a = p.toast('info', 'one');
  const b = p.toast('error', 'two');
  p.box.appendChild(a);
  p.box.appendChild(b);
  await tick();
  p.box.insertBefore(b, a);
  await tick();
  assert.equal(p.window.__toastLog.length, 2);
});

test('a second toast element with the same text is a second toast', async () => {
  const p = page();
  p.box.appendChild(p.toast('info', 'again'));
  await tick();
  p.box.appendChild(p.toast('info', 'again'));
  await tick();
  assert.equal(p.window.__toastLog.length, 2);
});
