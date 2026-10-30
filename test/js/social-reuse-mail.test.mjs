// Reusability options for the mail client: readOnly (hides Compose and Contacts), the theme hooks
// --se-frame-image and --se-chip-image, and maxSends / layout / readOnly passed through the
// mail_terminal starter from the object's minigameData.
// Run with: bundle exec node --test test/js/social-reuse-mail.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-reuse-mail-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js',
    'systems/phish-rules.js', 'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js', 'systems/mail-scheduler.js',
    'systems/mail-ink.js', 'minigames/mail-client/mail-client-minigame.js', 'minigames/mail-client/mail-reader.js',
    'minigames/mail-client/mail-data.js', 'minigames/mail-client/mail-notification.js',
    'minigames/mail-client/mail-composer.js', 'minigames/mail-client/mail-bridge.js',
    'minigames/landing-page-builder/landing-page-model.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
// The mail starter, cut out of minigame-starters.js (the file pulls in Phaser-side imports).
const starters = readFileSync(join(js, 'systems/minigame-starters.js'), 'utf8');
mkdirSync(join(dir, 'systems'), { recursive: true });
writeFileSync(join(dir, 'systems/mail-starter.js'),
    "import { socialOverlayParams } from '../minigames/framework/social-overlay.js';\n" +
    starters.match(/export function startMailClientMinigame[\s\S]*?\nwindow\.startMailClientMinigame = startMailClientMinigame;/)[0]);

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
console.warn = () => {};

const { MailClientMinigame } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-client-minigame.js')));
const { MailScheduler } = await import(pathToFileURL(join(dir, 'systems/mail-scheduler.js')));

function social() {
    return {
        people: [], intelFacts: {}, templates: {}, phishTargets: [],
        mailClient: {
            accounts: [{ id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', kind: 'given', person: null, mailbox: 'guest' }],
            mailboxes: [{ id: 'guest' }],
            contacts: [{ id: 'c1', person: null, name: 'Chris', addresses: ['chris@ledgerwell.example'], role: 'Careers', revealedBy: null, targetId: null }],
            payloadKit: [],
            checklistTiming: 'onSend'
        }
    };
}

function openClient(extra = {}) {
    const sc = social();
    window.gameScenario = { social: sc };
    window.gameState = { globalVariables: {} };
    const scheduler = new MailScheduler({ now: () => 0 });
    scheduler.init({ scenario: window.gameScenario, saved: null });
    const host = document.getElementById('host');
    host.textContent = '';
    const scene = new MailClientMinigame(host, {
        social: sc, mailClient: sc.mailClient, accountIds: ['guest'],
        scheduler, mailState: scheduler.state, globals: window.gameState.globalVariables, ...extra
    });
    window.MinigameFramework = { currentMinigame: scene, endMinigame() {} };
    scene.init();
    scene.start();
    return { scene, host };
}
const shown = (node) => !node.hidden && node.style.display !== 'none';

test('readOnly absent or false: Compose and Contacts are shown and open', () => {
    for (const extra of [{}, { readOnly: false }]) {
        const { scene, host } = openClient(extra);
        assert.equal(shown(host.querySelector('.mail-compose-btn')), true);
        assert.equal(shown(host.querySelector('.mail-contacts-btn')), true);
        scene.openContacts();
        assert.equal(scene.contactsOpen, true);
        scene.closeContacts();
        scene.openCompose();
        assert.equal(scene.composeOpen, true);
        scene.cleanup();
    }
});

test('readOnly: Compose and Contacts are hidden and neither will open; the inbox still works', () => {
    const { scene, host } = openClient({ readOnly: true });
    assert.equal(shown(host.querySelector('.mail-compose-btn')), false);
    assert.equal(shown(host.querySelector('.mail-contacts-btn')), false);
    scene.openCompose();
    assert.equal(scene.composeOpen, false);
    scene.openContacts();
    assert.equal(scene.contactsOpen, false);
    assert.ok(host.querySelector('.mail-inbox, .mail-folders'), 'the folder tabs are still there');
    scene.cleanup();
});

test('readOnly closes normally (no abort, no failure); a plain empty client still aborts', () => {
    for (const [extra, mode] of [[{ readOnly: true }, 'close'], [{ readOnly: false }, 'abort'], [{}, 'abort']]) {
        const { scene } = openClient(extra);
        assert.equal(scene.closeMode, mode, JSON.stringify(extra));
        const calls = [];
        scene.abort = () => calls.push('abort');
        scene.close = () => calls.push('close');
        scene.requestClose();
        assert.deepEqual(calls, [mode], JSON.stringify(extra));
        scene.cleanup();
    }
});

// ---- the theme hooks (item 7) -----------------------------------------------------------------

const css = readFileSync(join(root, 'public/break_escape/css/mail-client-minigame.css'), 'utf8');

test('the frame and chip art read a theme variable and fall back to the shipped images', () => {
    assert.match(css, /border-image: var\(--se-frame-image, url\('\/break_escape\/assets\/ui\/social\/mail-frame\.png'\)\) 8 fill \/ 16px stretch;/);
    assert.match(css, /border-image: var\(--se-chip-image, url\('\/break_escape\/assets\/ui\/social\/mail-chip-attachment\.png'\)\) 4 fill \/ 8px stretch;/);
    // no bare url() border-image is left to bypass the hook
    assert.doesNotMatch(css, /border-image: url\(/);
});

// ---- the starter (item 8) ------------------------------------------------------------------------

test('startMailClientMinigame passes maxSends, layout and readOnly from minigameData, and omits them otherwise', async () => {
    const calls = [];
    window.MinigameFramework = { mainGameScene: {}, startMinigame: (...a) => calls.push(a) };
    await import(pathToFileURL(join(dir, 'systems/mail-starter.js')));
    const sprite = (minigameData) => ({ scenarioData: { name: 'Desk PC', type: 'mail_terminal', minigameData } });

    window.startMailClientMinigame(sprite({ accountIds: ['guest'], defaultAccount: 'guest', maxSends: 2, layout: 'phone', readOnly: true }));
    const p = calls.at(-1)[2];
    assert.equal(calls.at(-1)[0], 'mail-client');
    assert.deepEqual(p.accountIds, ['guest']);
    assert.equal(p.maxSends, 2);
    assert.equal(p.layout, 'phone');
    assert.equal(p.readOnly, true);
    assert.equal(p.requiresKeyboardInput, true);

    window.startMailClientMinigame(sprite({ accountIds: ['guest'] }));
    const q = calls.at(-1)[2];
    assert.equal(q.maxSends, undefined);
    assert.equal(q.layout, undefined);
    assert.equal(q.readOnly, undefined);

    // an episode's options still win over the object's
    window.startMailClientMinigame(sprite({ accountIds: ['guest'], maxSends: 5 }), { maxSends: 1 });
    assert.equal(calls.at(-1)[2].maxSends, 1);
});

test('a client opened with the starter params behaves as the object says', () => {
    const { scene, host } = openClient({ maxSends: 1, layout: 'phone', readOnly: undefined });
    assert.ok(host.querySelector('.mail-client--phone'));
    assert.equal(scene._maxSends(), 1);
    assert.equal(shown(host.querySelector('.mail-compose-btn')), true, 'an undefined readOnly is the default');
    scene.cleanup();
});

// ---- validator and schema -------------------------------------------------------------------------

const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
function lint(md) {
    const json = { social: social(), rooms: { r: { objects: [{ type: 'mail_terminal', name: 'PC', minigameData: md }] } } };
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    json = JSON.parse(${JSON.stringify(JSON.stringify(json))})
    ctx = ValidateSocial::Context.new(json: json, repo_root: '.', social: json['social'], imports: [])
    puts JSON.generate(ValidateSocial::Mail.mail_terminals(ctx))`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

test('validator: mail_terminal maxSends, layout and readOnly are checked and declared in the schema', { skip }, () => {
    assert.deepEqual(lint({ accountIds: ['guest'] }), []);
    assert.deepEqual(lint({ accountIds: ['guest'], maxSends: 2, layout: 'phone', readOnly: true }), []);
    const bad = lint({ accountIds: ['guest'], maxSends: 0, layout: 'tablet', readOnly: 'yes' });
    for (const re of [/maxSends must be a whole number/, /layout is "tablet"/, /readOnly must be true or false/]) {
        assert.equal(bad.filter((s) => re.test(s)).length, 1, `${re}\n${bad.join('\n')}`);
    }
    const schema = JSON.parse(readFileSync(join(root, 'scripts/minigame-data-schemas.json'), 'utf8'));
    for (const k of ['maxSends', 'layout', 'readOnly']) assert.ok(schema.mail_terminal.optional.includes(k), k);
});
