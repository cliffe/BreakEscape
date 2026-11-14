// scripts/validate_scenario.rb check_access_model, phish-evidence rule
// (PHISH_EVIDENCE_SERVER_PLAN.md sections 11 to 13): a landing page whose capture.secret is a
// hard-access value (a password/PIN lock code, an RFID or biometric requires, a Wi-Fi PSK or a
// flag) must (1) be wired through a social.mailClient.payloadKit link kit, (2) aim at an authored
// phish target so the kit has somewhere to land, and (3) be buildable (some closed-menu choice set
// reaches the aimed target's linkThreshold, checked with the shared PhishScore port). Any of the
// three missing lets a tampered client forge the evidence or leaves honest play unable to produce
// it, so it is an error. A landing secret that opens nothing (every awareness page) draws nothing.
// The NPC-capture warning (Minor 2) is widened from lock codes to the whole hard-access set.
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
// landing page whose capture.secret is that same code. The page is fully built out so that, by
// default, it is wired through a link kit, aims at an authored phish target, and is buildable (a
// best choice set scores 100 >= its linkThreshold of 70). Toggles break one fact at a time:
//   `kit`          the payloadKit link kit that names the page (false -> error 1, no kit)
//   `targetKey`    the key of the page's own targets map; set it to a non-phish id -> error 2
//   `linkThreshold` raise it beyond any reachable score (999) -> error 3, unbuildable
//   `secret`/`lockType` break the hard-access match so the rule does not fire at all
function scenario({ kit = true, secret = 'Sofia2026!', lockType = 'password', pageId = 'payroll_login',
    targetKey = 'lord', linkThreshold = 70 } = {}) {
    const page = {
        id: pageId,
        pretext: { brandId: 'acme', purposeId: 'payslip' },
        fields: ['email', 'password'],
        targets: {},
        brands: [{
            id: 'acme',
            realFields: ['email', 'password'],
            domains: [
                { id: 'd_unrelated', domain: 'acme-unrelated.example', tier: 0 },
                { id: 'd_typo', domain: 'acme-typo.example', tier: 3 }
            ]
        }],
        purposes: [{ id: 'payslip', label: 'Payslip ready', button: 'Sign in' }],
        wordings: [{ id: 'w_match', match: true, text: 'Your payslip is ready. Sign in.' }],
        capture: { secret, address: 'admin@acme.example' }
    };
    page.targets[targetKey] = { linkThreshold, minDomainTier: 2 };
    const sc = {
        startRoom: 'lab',
        rooms: {
            lab: { type: 'room_office', locked: true, lockType, requires: 'Sofia2026!' }
        },
        social: {
            landingPages: [page],
            phishTargets: [{ id: 'lord', address: 's.lord@acme.example', displayName: 'Sofia Lord' }],
            mailClient: {}
        }
    };
    if (kit) {
        sc.social.mailClient.payloadKit = [{ id: 'kit_payroll_page', kind: 'link', landingPageId: pageId }];
    }
    return sc;
}

test('a protected landing secret wired, aimed and buildable raises no phish-evidence error', { skip }, () => {
    const out = issues(scenario({}));
    assert.ok(!has(out, errorFrag), out.join('\n'));
});

test('a protected landing secret with no link kit is an error', { skip }, () => {
    const out = issues(scenario({ kit: false }));
    assert.ok(out.some((s) => s.startsWith('❌') && s.includes(errorFrag) &&
        s.includes('no social.mailClient.payloadKit link kit names it')), out.join('\n'));
});

test('a link kit naming a different page does not wire this one', { skip }, () => {
    const sc = scenario({});
    sc.social.mailClient.payloadKit[0].landingPageId = 'other_page';
    assert.ok(has(issues(sc), errorFrag), issues(sc).join('\n'));
});

test('a non-link kit (kind other than link) does not wire the page', { skip }, () => {
    const sc = scenario({});
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
    // mirror: wire it through a link kit (aimed and buildable) and the error clears
    const wired = scenario({ kit: true, secret: 'CorpWifi-7781' });
    wired.networks = { corp: { wifi: { psk: 'CorpWifi-7781' } } };
    assert.ok(!has(issues(wired), errorFrag), issues(wired).join('\n'));
});

test('a wired page no phish target aims at is an error (kit reachability)', { skip }, () => {
    // kit names the page, but its targets map names 'ghost', which is not an authored phish target
    const out = issues(scenario({ targetKey: 'ghost' }));
    assert.ok(out.some((s) => s.startsWith('❌') && s.includes(errorFrag) &&
        s.includes("no authored social.phishTargets entry is one the page aims at")), out.join('\n'));
});

test('a wired, aimed page no choice set can make convincing is an error (unbuildable)', { skip }, () => {
    // threshold raised past any reachable score (best choice set scores 100)
    const out = issues(scenario({ linkThreshold: 999 }));
    assert.ok(out.some((s) => s.startsWith('❌') && s.includes(errorFrag) &&
        s.includes('no closed-menu choice set reaches its linkThreshold')), out.join('\n'));
});

test('a buildable page clears the solvability check (choice set meets the threshold)', { skip }, () => {
    // same page at a threshold a strong choice set clears
    const out = issues(scenario({ linkThreshold: 70 }));
    assert.ok(!has(out, errorFrag), out.join('\n'));
});

test('a Wi-Fi PSK on a non-account NPC capture with no proof warns (hard-access widening)', { skip }, () => {
    const sc = {
        startRoom: 'lab',
        rooms: {
            lab: {
                type: 'room_office',
                npcs: [{ id: 'guard', name: 'Guard', usePayload: { targetId: 'guard', secret: 'CorpWifi-7781' } }]
            }
        },
        networks: { corp: { wifi: { psk: 'CorpWifi-7781' } } },
        social: {}
    };
    const out = issues(sc);
    assert.ok(out.some((s) => s.startsWith('⚠️') &&
        s.includes('usePayload.secret that is also a hard-access value')), out.join('\n'));
});
