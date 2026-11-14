// scripts/validate_scenario.rb check_access_model, phish-evidence rule
// (PHISH_EVIDENCE_SERVER_PLAN.md sections 11 to 13): a landing page whose capture.secret is a
// hard-access value (a password/PIN lock code, an RFID or biometric requires, a Wi-Fi PSK or a
// flag) must be wired through a social.mailClient.payloadKit link kit, so the server can gate the
// reveal on a recorded build and a landed send. Without a link kit the server cannot gate it and a
// tampered client could forge the evidence, so it is an error. A landing secret that opens nothing
// (every awareness page) draws nothing.
// Run with: node test/js/validator-phish-evidence-secret.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';

function issues(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_access_model(JSON.parse(STDIN.read), nil, nil))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const has = (list, frag) => list.some((s) => s.includes(frag));
const errorFrag = "landing page 'payroll_login' carries a capture.secret";

// A scenario with one password-locked room (requires 'Sofia2026!', a hard-access lock code) and a
// landing page whose capture.secret is that same code. `kit` toggles the payloadKit link kit that
// names the page; `secret` and `lockType` let a test break the hard-access match.
function scenario({ kit = true, secret = 'Sofia2026!', lockType = 'password', pageId = 'payroll_login' } = {}) {
    const sc = {
        startRoom: 'lab',
        rooms: {
            lab: { type: 'room_office', locked: true, lockType, requires: 'Sofia2026!' }
        },
        social: {
            landingPages: [{ id: pageId, capture: { secret, address: 'admin@ledgerwell.example' } }],
            mailClient: {}
        }
    };
    if (kit) {
        sc.social.mailClient.payloadKit = [{ id: 'kit_payroll_page', kind: 'link', landingPageId: pageId }];
    }
    return sc;
}

test('a protected landing secret wired through a link kit raises no phish-evidence error', { skip }, () => {
    const out = issues(scenario({ kit: true }));
    assert.ok(!has(out, errorFrag), out.join('\n'));
});

test('a protected landing secret with no link kit is an error', { skip }, () => {
    const out = issues(scenario({ kit: false }));
    assert.ok(out.some((s) => s.startsWith('❌') && s.includes(errorFrag) &&
        s.includes('no social.mailClient.payloadKit link kit names it')), out.join('\n'));
});

test('a link kit naming a different page does not wire this one', { skip }, () => {
    const sc = scenario({ kit: true });
    sc.social.mailClient.payloadKit[0].landingPageId = 'other_page';
    assert.ok(has(issues(sc), errorFrag), issues(sc).join('\n'));
});

test('a non-link kit (kind other than link) does not wire the page', { skip }, () => {
    const sc = scenario({ kit: true });
    sc.social.mailClient.payloadKit[0].kind = 'attachment';
    assert.ok(has(issues(sc), errorFrag), issues(sc).join('\n'));
});

test('a landing secret that opens nothing (awareness page) is not flagged, kit or no kit', { skip }, () => {
    for (const kit of [true, false]) {
        const out = issues(scenario({ kit, secret: 'read-only-note', lockType: 'password' }));
        assert.ok(!has(out, errorFrag), `kit=${kit}:\n${out.join('\n')}`);
    }
});

test('a Wi-Fi PSK behind an unwired phish is an error (hard-access set is not only lock codes)', { skip }, () => {
    const sc = scenario({ kit: false, secret: 'CorpWifi-7781' });
    sc.networks = { corp: { wifi: { psk: 'CorpWifi-7781' } } };
    assert.ok(has(issues(sc), errorFrag), issues(sc).join('\n'));
    // mirror: wire it through a link kit and the error clears
    const wired = scenario({ kit: true, secret: 'CorpWifi-7781' });
    wired.networks = { corp: { wifi: { psk: 'CorpWifi-7781' } } };
    assert.ok(!has(issues(wired), errorFrag), issues(wired).join('\n'));
});
