// lab_physical_pentest: no client eventMapping writes the tailgate credit any more
// (GATED_DOOR_SERVER_CHECK_PLAN.md §6, §7, Chunk D). The credit globals (kp_badge_tailgated,
// kp_records_cloned) and the credited task (tailgate_in) are set by the records door gate's
// server-owned creditOnPass; a client eventMapping that wrote them would be a half-done migration
// (the server now drops a sync write to a credit global and refuses a client completion of a
// server-completed-only task, so such a mapping could only misfire or be rejected).
// Run with: node --test test/js/lab-gated-credit-scan.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const src = readFileSync(join(root, 'scenarios/lab_physical_pentest/scenario.json.erb'), 'utf8');
const lines = src.split('\n');

// An eventMapping is one JSON object per line carrying "eventPattern". The gate's creditOnPass
// blocks (viaPass/viaCredential) carry no "eventPattern", so scanning only eventMapping lines
// isolates the client writers from the allowed server credit.
const mappingLines = lines.filter((l) => /"eventPattern"\s*:/.test(l));

// A credit global written as a key inside this mapping's own setGlobal object (not merely named in
// a condition string, as the kept kp_tailgate_cue / kp_len_held_cue cues do).
const setGlobalCredit = /"setGlobal"\s*:\s*\{[^}]*\b(kp_badge_tailgated|kp_records_cloned)\b[^}]*\}/;
const completesTailgate = /"completeTask"\s*:\s*"tailgate_in"/;

test('no client eventMapping writes a tailgate credit global', () => {
    const offenders = mappingLines.filter((l) => setGlobalCredit.test(l));
    assert.equal(offenders.length, 0,
        `client setGlobal writer(s) of a credit global remain:\n${offenders.join('\n')}`);
});

test('no client eventMapping completes tailgate_in', () => {
    const offenders = mappingLines.filter((l) => completesTailgate.test(l));
    assert.equal(offenders.length, 0,
        `client completeTask tailgate_in mapping(s) remain:\n${offenders.join('\n')}`);
});

test('the records door gate declares creditOnPass for both routes', () => {
    // The gate is the one allowed place the credit globals and tailgate_in are set, server-side.
    assert.match(src, /"creditOnPass"\s*:/, 'the gate carries creditOnPass');
    assert.match(src, /"viaPass"[\s\S]{0,120}"kp_badge_tailgated"\s*:\s*true[\s\S]{0,60}"completeTask"\s*:\s*"tailgate_in"/,
        'viaPass sets kp_badge_tailgated and completes tailgate_in');
    assert.match(src, /"viaCredential"[\s\S]{0,120}"kp_records_cloned"\s*:\s*true[\s\S]{0,60}"completeTask"\s*:\s*"tailgate_in"/,
        'viaCredential sets kp_records_cloned and completes tailgate_in');
});
