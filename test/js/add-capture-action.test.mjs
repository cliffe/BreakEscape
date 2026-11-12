// apply-actions.js add_capture / window.recordSECapture: records a credential or
// foothold into se_captures, reusing captures.js (makeCaptureEntry + mergeCapture),
// first-capture-wins. The physical-pentest lab writes captures this way from an
// npc_used mapping (NPC_NEEDS_SYSTEM.md §13). captures.js is pulled in through a lazy
// dynamic import in apply-actions.js, so it is copied into the temp dir under its real
// name; the static imports are stubbed to data: URLs.
// Run with: bin/test-js test/js/add-capture-action.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'add-capture-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
mkdirSync(join(dir, 'systems'), { recursive: true });

// Real captures.js (pure, no deps): the dynamic import inside apply-actions.js resolves it.
writeFileSync(join(dir, 'systems', 'captures.js'), readFileSync(join(js, 'systems/captures.js'), 'utf8'));

// apply-actions.js with its STATIC imports stubbed (writeGlobal writes straight to gameState).
const actionsSrc = readFileSync(join(js, 'systems/apply-actions.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../utils/escape-html.js'").join(`'${dataUrl('export const escapeHtml = (s) => String(s == null ? "" : s);')}'`)
    .split("'../utils/author-html.js'").join(`'${dataUrl('export const authorHtml = (s) => String(s == null ? "" : s);')}'`)
    .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal(name, value) { if (globalThis.window?.gameState?.globalVariables) globalThis.window.gameState.globalVariables[name] = value; }')}'`)
    .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact(){return{granted:false};} export function readyToastText(){return "";} export function readyToastTitle(){return "";}')}'`);
writeFileSync(join(dir, 'systems', 'apply-actions.mjs'), actionsSrc);

function dataUrl(src) { return 'data:text/javascript,' + encodeURIComponent(src); }

globalThis.window = { gameState: { globalVariables: { se_captures: {} } } };
globalThis.document = { querySelector: () => null };
const { applyActions, recordSECapture } = await import(pathToFileURL(join(dir, 'systems', 'apply-actions.mjs')).href);

const caps = () => globalThis.window.gameState.globalVariables.se_captures;

test('recordSECapture writes a credential entry into se_captures', async () => {
    const ok = await recordSECapture({ targetId: 'dale', roleLabel: 'Reception staff', kind: 'credential', address: 'd.ferreira', secret: 'Calderbank#Spring26', host: 'CM-RECEP-01', note: 'from a keylogger' });
    assert.equal(ok, true);
    const e = caps().dale;
    assert.ok(e, 'dale entry present');
    assert.equal(e.kind, 'credential');
    assert.equal(e.address, 'd.ferreira');
    assert.equal(e.secret, 'Calderbank#Spring26');
    assert.equal(e.host, 'CM-RECEP-01');
    // Only the closed key set survives (captures.js makeCaptureEntry).
    for (const k of Object.keys(e)) assert.ok(['targetId','roleLabel','address','kind','secret','host','note','at'].includes(k), `unexpected key ${k}`);
});

test('first-capture-wins: a second write for the same target does not overwrite', async () => {
    const ok = await recordSECapture({ targetId: 'dale', kind: 'credential', secret: 'DIFFERENT' });
    assert.equal(ok, false, 'second write is a no-op');
    assert.equal(caps().dale.secret, 'Calderbank#Spring26');
});

test('add_capture action records a foothold and a distinct target', async () => {
    applyActions([{ type: 'add_capture', capture: { targetId: 'priya', kind: 'credential', address: 'p.chandra', secret: 'Calderbank#Welcome1' } }]);
    // applyActions does not await; recordSECapture resolves on the microtask queue.
    await new Promise(r => setTimeout(r, 0));
    assert.ok(caps().priya, 'priya entry present');
    assert.equal(caps().priya.address, 'p.chandra');
    // Earlier dale entry is still there (merge, not replace).
    assert.ok(caps().dale, 'dale entry preserved');
});

test('a capture with no targetId is rejected', async () => {
    const before = JSON.stringify(caps());
    const ok = await recordSECapture({ kind: 'credential', secret: 'x' });
    assert.equal(ok, false);
    assert.equal(JSON.stringify(caps()), before);
});
