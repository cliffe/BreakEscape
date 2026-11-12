// apply-actions.js grant_foothold (slice 9.3b sub-slice I): a device in a PC grants an
// in-game network foothold. The action maps its shape (needsSession -> 'session', else
// 'dropped') and forwards action.pc and action.path to networkLinks.implant, which does the
// POST and the one retry. This covers the shape mapping, the pc/path forwarding and the
// no-networkLinks warning branch (review R1 client m2).
// Run with: bin/test-js test/js/grant-foothold-action.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'grant-foothold-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
mkdirSync(join(dir, 'systems'), { recursive: true });

function dataUrl(src) { return 'data:text/javascript,' + encodeURIComponent(src); }

// apply-actions.js with its static imports stubbed; grant_foothold uses none of them.
const actionsSrc = readFileSync(join(js, 'systems/apply-actions.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal(){}')}'`)
    .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact(){return{granted:false};} export function readyToastText(){return "";} export function readyToastTitle(){return "";}')}'`);
writeFileSync(join(dir, 'systems', 'apply-actions.mjs'), actionsSrc);

const warns = [];
console.warn = (...a) => warns.push(a.join(' '));

let implantCalls;
function freshWindow(withLinks = true) {
    implantCalls = [];
    globalThis.window = {
        gameState: { globalVariables: {} },
        breakEscapeConfig: { gameId: 7 }
    };
    if (withLinks) {
        window.networkLinks = {
            implant: (pc, shape, path) => { implantCalls.push([pc, shape, path]); return Promise.resolve({ action: 'implanted' }); }
        };
    }
    globalThis.document = { querySelector: () => null };
}

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { querySelector: () => null };
const { applyActions } = await import(pathToFileURL(join(dir, 'systems', 'apply-actions.mjs')).href);

test('a needsSession grant_foothold forwards the session shape, the pc and the path', async () => {
    freshWindow();
    applyActions([{ type: 'grant_foothold', pc: 'sam_pc', needsSession: true, needsHeld: 'kit_badusb', path: 'timers.0' }]);
    await new Promise(r => setTimeout(r, 0));
    assert.deepEqual(implantCalls, [['sam_pc', 'session', 'timers.0']]);
});

test('a needsDropped grant_foothold forwards the dropped shape and a null path when none is set', async () => {
    freshWindow();
    applyActions([{ type: 'grant_foothold', pc: 'door_box', needsDropped: 'kit_stick' }]);
    await new Promise(r => setTimeout(r, 0));
    assert.deepEqual(implantCalls, [['door_box', 'dropped', null]]);
});

test('grant_foothold warns and sends nothing when networkLinks is absent', async () => {
    freshWindow(false);
    warns.length = 0;
    applyActions([{ type: 'grant_foothold', pc: 'sam_pc', needsSession: true }]);
    await new Promise(r => setTimeout(r, 0));
    assert.match(warns.join('\n'), /grant_foothold: no networkLinks or pc/);
});

test('grant_foothold warns and sends nothing when no pc is named', async () => {
    freshWindow();
    warns.length = 0;
    applyActions([{ type: 'grant_foothold', needsSession: true }]);
    await new Promise(r => setTimeout(r, 0));
    assert.equal(implantCalls.length, 0, 'no implant without a pc');
    assert.match(warns.join('\n'), /grant_foothold: no networkLinks or pc/);
});
