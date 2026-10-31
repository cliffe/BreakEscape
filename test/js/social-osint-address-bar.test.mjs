// The OSINT browser's address bar and its links (SE design 02 N9, packet P2-B).
//   1. formatAddress is a pure function: it returns the authored host as typed. An `xn--` label
//      and any non-ASCII letter come back unchanged and are never converted either way.
//   2. Clicking a page link inside the real overlay leaves window.location unchanged and switches
//      the displayed page; the bar shows the authored url as typed (jsdom).
// Run with: bundle exec node --test test/js/social-osint-address-bar.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

// ---- the overlay (needs the DOM) ----------------------------------------------------------

const overlayDir = join(js, 'minigames/osint-browser');
const overlay = join(overlayDir, 'osint-browser-minigame.js');
const fixture = JSON.parse(readFileSync(join(here, 'fixtures/social/osint-browser-social.json'), 'utf8'));
const skip = !existsSync(overlay) && 'the OSINT browser overlay is not in the tree';

let dom;
let current = null;
let OsintBrowserMinigame;
// The real files, copied with their relative layout into an ESM folder (public/.../js has no package.json).
const dir = mkdtempSync(join(tmpdir(), 'social-osint-address-bar-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const copy = (rel) => {
  mkdirSync(dirname(join(dir, rel)), { recursive: true });
  writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
};
copy('minigames/osint-browser/address-bar.js');
const { formatAddress } = await import(pathToFileURL(join(dir, 'minigames/osint-browser/address-bar.js')));
if (!skip) {
  for (const f of readdirSync(overlayDir)) if (f.endsWith('.js')) copy(`minigames/osint-browser/${f}`);
  for (const rel of ['minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/global-writer.js', 'systems/social-intel.js']) copy(rel);

  dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'https://game.test/break_escape/games/42' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  window.stateSync = { sync: () => {} };
  window.MinigameFramework = { currentMinigame: null, endMinigame() {} };
  ({ OsintBrowserMinigame } = await import(pathToFileURL(join(dir, 'minigames/osint-browser/osint-browser-minigame.js'))));
}

// ---- the formatter ------------------------------------------------------------------------

test('the authored url comes back as typed', () => {
  assert.equal(formatAddress({ url: 'ledgerwell.example' }), 'ledgerwell.example');
  assert.equal(formatAddress({ url: 'ledgerwell.example/Q3.pdf' }), 'ledgerwell.example/Q3.pdf');
  assert.equal(formatAddress({ url: 'friendface.example' }, { id: 'pierce' }), 'friendface.example');
});

test('an xn-- label stays punycode and is never decoded', () => {
  const punycode = 'xn--ledgerwll-m0h.example';
  assert.equal(formatAddress({ url: punycode }), punycode);
  assert.equal(formatAddress({ url: `${punycode}/login` }), `${punycode}/login`);
  assert.ok(formatAddress({ url: punycode }).includes('--'), 'the double hyphen survives');
});

test('a non-ASCII letter stays as it is and is never encoded', () => {
  const cyr = 'ledgerw\u0435ll.example'; // Cyrillic small ie, a look-alike of Latin e
  const out = formatAddress({ url: cyr });
  assert.equal(out, cyr);
  assert.ok(!out.includes('xn--'), 'not converted to punycode');
  assert.equal(out.codePointAt(7), 0x0435, 'the Cyrillic code point is intact');
  assert.equal(formatAddress({ url: '\u00e9cole.example' }), '\u00e9cole.example');
});

test('nothing is trimmed, case-folded, normalised or run through displayDashes', () => {
  assert.equal(formatAddress({ url: 'Ledgerwell.Example/A--B' }), 'Ledgerwell.Example/A--B');
  assert.equal(formatAddress({ url: 'a\u2014b.example' }), 'a\u2014b.example');
  // a decomposed letter is not recomposed
  assert.equal(formatAddress({ url: 'e\u0301.example' }), 'e\u0301.example');
});

test('a page may carry its own url or a path; a missing site gives an empty bar', () => {
  assert.equal(formatAddress({ url: 'ledgerwell.example' }, { url: 'ledgerwell.example/team' }), 'ledgerwell.example/team');
  assert.equal(formatAddress({ url: 'ledgerwell.example' }, { path: '/team' }), 'ledgerwell.example/team');
  assert.equal(formatAddress(null), '');
  assert.equal(formatAddress({}), '');
});

function open(osint, params = {}) {
  current?.cleanup();
  window.gameState = { globalVariables: { se_osint_state: {} } };
  window.gameScenario = { social: fixture };
  document.body.innerHTML = '';
  const container = document.createElement('div');
  document.body.appendChild(container);
  const scene = new OsintBrowserMinigame(container, { osint, social: fixture, ...params });
  scene._sceneType = 'osint-browser';
  window.MinigameFramework.currentMinigame = scene;
  scene.init();
  scene.start();
  current = scene;
  return scene;
}

const bar = (scene) => scene.container.querySelector('[data-address]').textContent;
const links = (scene) => [...scene.container.querySelectorAll('.ob-main a')];

test('clicking a page link leaves window.location unchanged and switches the page', { skip }, () => {
  const before = window.location.href;
  const scene = open(fixture.osint, { start: 'company.team' });
  const navLinks = links(scene).filter((a) => a.matches('.ob-pagenav a, .ob-link'));
  assert.ok(navLinks.length > 1, 'the company site offers page links');
  const first = scene.container.querySelector('.ob-main').textContent;
  const target = navLinks.find((a) => a.getAttribute('aria-current') !== 'page');
  assert.ok(target, 'a link to another page exists');
  let prevented = false;
  target.addEventListener('click', (e) => { prevented = e.defaultPrevented; });
  target.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.equal(window.location.href, before, 'window.location is untouched');
  assert.equal(window.location.hash, '', 'not even the # of an href');
  assert.ok(prevented, 'the click was default-prevented');
  const second = scene.container.querySelector('.ob-main').textContent;
  assert.notEqual(second, first, 'a different page is shown');
  assert.equal(scene.place.pageId !== null, true, 'the scene now sits on a page');
  assert.equal(document.body.querySelectorAll('.ob-root').length, 1, 'still one overlay');
});

test('no link carries the authored url as an href', { skip }, () => {
  const scene = open(fixture.osint, { start: 'company.team' });
  for (const a of scene.container.querySelectorAll('a')) {
    const href = a.getAttribute('href');
    assert.ok(href === null || href === '#', `href is "${href}"`);
  }
  for (const s of fixture.osint.sites) {
    const text = scene.container.innerHTML;
    assert.ok(!text.includes(`href="${s.url}`) && !text.includes(`href="https://${s.url}`), `${s.url} is display text only`);
  }
});

test('the address bar shows the authored url as typed, including look-alikes', { skip }, () => {
  const osint = {
    profile: 'student',
    sites: [
      { id: 'a', url: 'xn--ledgerwll-m0h.example', type: 'company-site', pages: [{ id: 'home', title: 'Home', blocks: [{ id: 'b1', kind: 'p', text: 'Hello.' }] }] },
      { id: 'b', url: 'ledgerw\u0435ll.example', type: 'company-site', pages: [{ id: 'home', title: 'Home', blocks: [{ id: 'b2', kind: 'p', text: 'Hello.' }] }] },
      { id: 'c', url: 'ledgerwell.example/Q3--final.pdf', type: 'document', fields: [] }
    ]
  };
  let scene = open(osint, { start: 'a' });
  assert.equal(bar(scene), 'xn--ledgerwll-m0h.example');
  scene = open(osint, { start: 'b' });
  assert.equal(bar(scene), 'ledgerw\u0435ll.example');
  scene = open(osint, { start: 'c' });
  assert.equal(bar(scene), 'ledgerwell.example/Q3--final.pdf');
  assert.equal(window.location.href, 'https://game.test/break_escape/games/42');
});

test.after(() => { current?.cleanup?.(); });
