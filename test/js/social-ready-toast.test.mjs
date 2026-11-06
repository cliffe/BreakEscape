// systems/social-intel.js readyToastText: the body of the "Ready to approach" toast
// (MECHANICS_AUDIT follow-up from M3/M4). It was hard-coded to "write to them from a mail
// terminal"; it now comes from social.intelBoard.readyToast, else from each ready target's
// channels in social.characters (a target with no character entry is a mail target).
//  - the default for a phishTargets-only target is the old line, word for word;
//  - phone and person channels read as such, several channels or targets join with ", or";
//  - readyToast overrides it; a blank readyToast is ignored;
//  - applyActions grant_fact shows it when a fact makes a target ready.
// Run with: bundle exec node --test test/js/social-ready-toast.test.mjs

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-ready-toast-'));
test.after(() => rmSync(dir, { recursive: true, force: true }));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/social-intel.js', 'social-intel.mjs', s => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('utils/display-dashes.js', 'display-dashes.mjs');
copy('systems/apply-actions.js', 'apply-actions.mjs', s => s
    .replace("'../utils/display-dashes.js'", "'./display-dashes.mjs'")
    .replace("'./global-writer.js'", "'./global-writer.mjs'")
    .replace("'./social-intel.js'", "'./social-intel.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
const { readyToastText } = await import(pathToFileURL(join(dir, 'social-intel.mjs')).href);
const { applyActions } = await import(pathToFileURL(join(dir, 'apply-actions.mjs')).href);

const OLD = 'You know enough to approach now — write to them from a mail terminal.';
const social = (extra = {}) => ({
    social: {
        characters: {
            pierce: { channels: { email: 'pierce_mail' } },
            dev: { channels: { phone: 'dev_desk' } },
            ruth: { channels: { person: 'ruth_npc' } },
            sam: { channels: { person: 'sam_npc', email: 'sam_mail' } }
        },
        intelFacts: { dev_desk: { text: 'Dev runs the desk.', subject: 'company' } },
        intelBoard: { people: ['dev'], readinessSlots: { dev: [{ label: 'Desk', needsIntel: ['dev_desk'] }] }, ...extra }
    }
});

test('a mail target (no character entry, or an email channel) keeps the old line', () => {
    assert.equal(readyToastText(['hampshire'], social()), OLD);
    assert.equal(readyToastText(['pierce'], social()), OLD);
    assert.equal(readyToastText([], social()), OLD);
    assert.equal(readyToastText(['hampshire'], { social: {} }), OLD);
});

test('phone and person channels say how to approach', () => {
    assert.equal(readyToastText(['dev'], social()), 'You know enough to approach now — call them.');
    assert.equal(readyToastText(['ruth'], social()), 'You know enough to approach now — go and talk to them in person.');
});

test('several channels or targets join in a fixed order (email, phone, person)', () => {
    assert.equal(readyToastText(['sam'], social()),
        'You know enough to approach now — write to them from a mail terminal, or go and talk to them in person.');
    assert.equal(readyToastText(['ruth', 'dev', 'pierce'], social()),
        'You know enough to approach now — write to them from a mail terminal, or call them, or go and talk to them in person.');
});

test('intelBoard.readyToast overrides the derived text; a blank one is ignored', () => {
    assert.equal(readyToastText(['dev'], social({ readyToast: 'Ring the service desk.' })), 'Ring the service desk.');
    assert.equal(readyToastText(['dev'], social({ readyToast: '   ' })), 'You know enough to approach now — call them.');
});

test('applyActions grant_fact shows the derived text when a fact makes a target ready', () => {
    const toasts = [];
    window.gameState.globalVariables = {};
    window.gameScenario = social();
    window.gameAlert = (...args) => toasts.push(args);
    applyActions([{ type: 'grant_fact', fact: 'dev_desk' }]);
    const ready = toasts.find((t) => t[2] === 'Ready to approach');
    assert.ok(ready, JSON.stringify(toasts));
    assert.equal(ready[0], 'You know enough to approach now — call them.');
    assert.equal(ready[1], 'success');
});

test('the OSINT browser toast uses readyToastText too', () => {
    const src = readFileSync(join(js, 'minigames/osint-browser/osint-browser-minigame.js'), 'utf8');
    assert.match(src, /import \{[^}]*readyToastText[^}]*\} from '\.\.\/\.\.\/systems\/social-intel\.js'/);
    assert.match(src, /gameAlert\?\.\(readyToastText\(newlyReady/);
    assert.doesNotMatch(src, /write to them from a mail terminal/);
});
