// cpWithin / cpSlice code-point helpers (SYNC_DELTAS_PLAN 2.1). The export clips
// must count and cut strings by code points to mirror the Ruby server exactly
// (Ruby's String#length and [0, n] count code points; JavaScript's length and
// slice count UTF-16 units). The helpers are kept as three module-local copies,
// not a shared module, so no node harness copy list changes: one in
// mail-scheduler.js, one in npc-conversation-state.js, and static methods on
// NPCManager. This one test runs all three copies over the same astral strings
// and expects the same results, so a drift in any copy fails here.
//
// The browser modules are copied to a temp dir as .mjs (the repo has no
// "type": "module"), as in phone-reopen-and-persistence.test.mjs.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'cp-helpers-test-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));

// npc-conversation-state.js: no imports
copy('systems/npc-conversation-state.js', 'npc-conversation-state.mjs');
// mail-scheduler.js imports only global-writer.js
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/mail-scheduler.js', 'mail-scheduler.mjs', s => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
// npc-manager.js imports npc-los.js and phone-chat-speaker.js (both leaf)
copy('systems/npc-los.js', 'npc-los.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/npc-manager.js', 'npc-manager.mjs', s => s.replace("'./npc-los.js'", "'./npc-los.mjs'")
  .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = globalThis.window || {};
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));

const ncc = await import(pathToFileURL(join(dir, 'npc-conversation-state.mjs')).href);
const mail = await import(pathToFileURL(join(dir, 'mail-scheduler.mjs')).href);
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);

// The three copies, named for the assertion messages.
const copies = [
  ['npc-conversation-state', ncc.cpWithin, ncc.cpSlice],
  ['mail-scheduler', mail.cpWithin, mail.cpSlice],
  ['NPCManager', NPCManager.cpWithin.bind(NPCManager), NPCManager.cpSlice.bind(NPCManager)]
];

// Shared strings: ASCII, an emoji straddling the cut, and emoji only.
// '😀' is one code point but two UTF-16 units, so length overcounts it.
const withinCases = [
  ['hello', 5, true],
  ['hello', 4, false],
  ['hello', 6, true],
  ['', 0, true],
  ['ab😀cd', 5, true],   // five code points, length six
  ['ab😀cd', 4, false],
  ['😀😀😀', 3, true],
  ['😀😀😀', 2, false]
];
const sliceCases = [
  ['hello', 5, 'hello'],
  ['hello', 3, 'hel'],
  ['hello', 9, 'hello'],
  ['ab😀cd', 3, 'ab😀'],   // must keep the whole emoji, not half a surrogate pair
  ['ab😀cd', 2, 'ab'],
  ['😀😀😀', 2, '😀😀'],
  ['😀😀😀', 0, '']
];

test('cpWithin agrees across every copy', () => {
  for (const [s, n, expected] of withinCases) {
    for (const [name, cpWithin] of copies) {
      assert.equal(cpWithin(s, n), expected, `${name}.cpWithin(${JSON.stringify(s)}, ${n})`);
    }
  }
});

test('cpSlice agrees across every copy', () => {
  for (const [s, n, expected] of sliceCases) {
    for (const [name, , cpSlice] of copies) {
      assert.equal(cpSlice(s, n), expected, `${name}.cpSlice(${JSON.stringify(s)}, ${n})`);
      // The cut never splits a surrogate pair.
      assert.ok(!/[\uD800-\uDBFF]$/.test(cpSlice(s, n)), `${name}.cpSlice left a lone high surrogate`);
    }
  }
});

test('cpSlice never exceeds n code points', () => {
  for (const [s, n] of sliceCases) {
    for (const [name, , cpSlice] of copies) {
      assert.ok(Array.from(cpSlice(s, n)).length <= n, `${name}.cpSlice returned more than ${n} code points`);
    }
  }
});
