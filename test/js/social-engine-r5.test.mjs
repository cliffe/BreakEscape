import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { JSDOM } from 'jsdom';

// Engine fixer round 5 (P5 playtests of the awareness episodes): the top-band cap on any
// trusted phish, the no-blame line, the neutral thank-you on a reported real item, the subject
// that follows the pretext (subjects[].requiresTemplate), template tells on the meter and the
// flip (templates[].flags), tighter email ticks, the result bar and the player look-alike swap.
// Run with: node --test test/js/social-engine-r5.test.mjs

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-engine-r5-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/inbox-triage/inbox-triage-minigame.js', 'minigames/inbox-triage/triage-scoring.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-flags.js',
    'minigames/inbox-triage/triage-kinds.js', 'minigames/landing-page-builder/landing-page-render.js',
    'minigames/landing-page-builder/landing-page-model.js', 'minigames/inbox-triage/triage-comparison.js',
    'minigames/inbox-triage/header-panel.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'minigames/mail-client/mail-composer.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/phish-rules.js',
    'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js',
    'minigames/episode-runner/debrief-view.js', 'minigames/episode-runner/flip-view.js',
    'utils/npc-lookalike.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body><div id="host"></div></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
console.log = () => {};
console.warn = () => {};
console.error = () => {};
window.MinigameFramework = { currentMinigame: null, endMinigame() {} };
window.gameState = { globalVariables: {} };

const mod = (rel) => import(pathToFileURL(join(dir, rel)));
const { scoreTriage } = await mod('minigames/inbox-triage/triage-scoring.js');
const { chipIdsFor } = await mod('minigames/inbox-triage/triage-flags.js');
const { InboxTriageMinigame } = await mod('minigames/inbox-triage/inbox-triage-minigame.js');
const { renderDebrief } = await mod('minigames/episode-runner/debrief-view.js');
const { evaluateMessage, templateFlagsOf } = await mod('systems/phish-rules.js');
const { MailComposer } = await mod('minigames/mail-client/mail-composer.js');
const { lookalikeSwap, avoidPlayerLookalike } = await mod('utils/npc-lookalike.js');

const real = (id, subject = `Real ${id}`) => ({ id, from: { name: 'Marsh End', address: 'orders@marshend.example' },
    to: 'you@brightwell.example', subject, time: '09:00', body: 'Thanks for the order.',
    auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' }, truth: { isPhish: false, flags: [], whyFine: { default: 'Known supplier.' } } });
const phish = (id, kind = 'email', extra = {}) => ({ id, kind, from: { name: 'IT', address: 'it@brightwe11.example' },
    to: 'you@brightwell.example', subject: `Phish ${id}`, time: '09:05', body: 'Sign in now.',
    auth: { spf: 'fail', dkim: 'none', dmarc: 'fail' }, truth: { isPhish: true, flags: ['lookalike_domain'] }, ...extra });

// ── E5-E7 P5-3: any trusted phish caps the top band ──────────────────────────

test('P5-3: a trusted phish page (not a critical kind) still keeps the round out of the top band', () => {
    const messages = [phish('p1'), phish('p2'), phish('p3'), phish('page1', 'page'), ...Array.from({ length: 8 }, (_, i) => real(`r${i}`))];
    const answers = [
        ...['p1', 'p2', 'p3'].map((id) => ({ id, verdict: 'report', flags: ['lookalike_domain'] })),
        { id: 'page1', verdict: 'trust', flags: [] },
        ...Array.from({ length: 8 }, (_, i) => ({ id: `r${i}`, verdict: 'trust', flags: [] }))
    ];
    const r = scoreTriage({ messages, answers, profile: 'awareness' });
    assert.ok(r.percent >= 85, `percent ${r.percent} is in the top band's range`);
    assert.deepEqual(r.criticalMisses, []); // a page is not a critical kind
    assert.match(r.headline, /^Getting there/);
    // the same round with the page reported is Sharp
    answers[3] = { id: 'page1', verdict: 'report', flags: ['lookalike_domain'] };
    assert.match(scoreTriage({ messages, answers, profile: 'awareness' }).headline, /^Sharp/);
});

// ── P5-5 / P5-15: when the no-blame line shows, and its critical wording ──────

function debrief(answers, result = {}, strings = {}) {
    const c = document.createElement('div');
    const set = { messages: [real('r1'), phish('p1'), phish('c1', 'call')] };
    const view = renderDebrief(c, { result: { percent: 50, answers, ...result }, set, strings });
    return { c, view };
}

test('P5-15: a missed tick alone (every verdict right) shows no no-blame line', () => {
    const { c, view } = debrief([
        { id: 'r1', verdict: 'trust', score: 100 },
        { id: 'p1', verdict: 'report', flags: [], score: 60, isPhish: true }
    ]);
    assert.ok(c.querySelector('.aw-card')); // the missed tick still gets its card
    assert.equal(c.querySelector('.aw-no-blame'), null);
    assert.equal(view.getState().noBlame, false);
});

test('P5-5: a wrong verdict shows the authored no-blame line; a critical miss swaps in a line that owns the points', () => {
    const strings = { noBlameLine: 'Nobody is marked down for a miss here.' };
    let { c } = debrief([
        { id: 'r1', verdict: 'delete', score: 30 },
        { id: 'p1', verdict: 'report', flags: ['lookalike_domain'], score: 100, isPhish: true }
    ], {}, strings);
    assert.equal(c.querySelector('.aw-no-blame').textContent, 'Nobody is marked down for a miss here.');
    ({ c } = debrief([
        { id: 'r1', verdict: 'trust', score: 100 },
        { id: 'p1', verdict: 'trust', flags: [], score: 0, isPhish: true }
    ], { criticalMisses: ['p1'] }, strings));
    const line = c.querySelector('.aw-no-blame');
    assert.ok(line.classList.contains('aw-no-blame-critical'));
    assert.doesNotMatch(line.textContent, /marked down|keeping score|counts against/i);
    assert.match(line.textContent, /points/);
    // an authored critical line wins
    ({ c } = debrief([{ id: 'p1', verdict: 'trust', flags: [], score: 0, isPhish: true }],
        { criticalMisses: ['p1'] }, { ...strings, noBlameLineCritical: 'Own words.' }));
    assert.equal(c.querySelector('.aw-no-blame').textContent, 'Own words.');
});

// ── P5-6: the thank-you on a reported real item ──────────────────────────────

test('P5-6: reporting a real item gets a neutral thank-you; a phish keeps "That warns everyone else."', () => {
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const set = { id: 's', scoringProfile: 'awareness', feedbackMode: 'immediate', messages: [real('r1'), phish('p1')] };
    const scene = new InboxTriageMinigame(container, { set, social: { triageSets: [set] }, skin: 'awareness' });
    scene._sceneType = 'inbox-triage';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    const $ = (q) => container.querySelector(q);
    const click = (n) => n.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    click($('.tri-start'));
    const act = (id, v) => { click($(`.mail-row[data-id="${id}"]`)); click($(`.tri-verdict[data-action="${v}"]`)); click($('.tri-confirm')); };
    act('r1', 'report');
    assert.equal($('.aw-report-thanks').textContent, 'Thanks for reporting. A colleague will check it and let it through.');
    act('p1', 'report');
    assert.equal($('.aw-report-thanks').textContent, 'Thanks for reporting. That warns everyone else.');
    // P5-1: Finish lives in the result bar, the last child of the scrolling result panel (the
    // stylesheet pins it there)
    click($('.tri-next'));
    const bar = $('.tri-result > .tri-result-bar');
    assert.ok(bar && bar.querySelector('.tri-finish'));
    assert.equal($('.tri-result').lastElementChild, bar);
    scene.cleanup();
});

test('P5-1: the stylesheet pins the result bar to the bottom of the result panel', () => {
    const css = readFileSync(join(root, 'public/break_escape/css/inbox-triage-minigame.css'), 'utf8');
    const rule = /\.tri-result > \.tri-result-bar \{([^}]*)\}/.exec(css);
    assert.ok(rule, 'a .tri-result > .tri-result-bar rule');
    assert.match(rule[1], /position: sticky/);
    assert.match(rule[1], /bottom:/);
    assert.match(rule[1], /background-color:/);
});

// ── P5-10: email ticks only for tells the email could carry ──────────────────

test('P5-10: an email is offered callback pressure, bank details, QR and enable-content only when its words could carry them', () => {
    const set = { channelTells: ['lookalike_domain', 'changed_bank_details', 'unexpected_qr', 'vish_callback_pressure',
        'secrecy_or_bypass', 'borrowed_authority', 'enable_content_prompt', 'reply_to_differs'] };
    const plain = { kind: 'email', subject: 'Printer ticket 4412', body: 'Your printer job has been fixed. Call the desk on 2214 if not.', truth: { isPhish: false, flags: [] } };
    let ids = chipIdsFor(set, 'email', plain);
    for (const gone of ['changed_bank_details', 'unexpected_qr', 'vish_callback_pressure', 'enable_content_prompt']) {
        assert.equal(ids.includes(gone), false, `${gone} offered on a printer ticket`);
    }
    assert.ok(ids.includes('lookalike_domain') && ids.includes('secrecy_or_bypass'));
    const money = { kind: 'email', subject: 'New bank details', body: 'Please update our payee details. I am in meetings all day, so just reply here.',
        attachments: [{ label: 'form.docm' }], truth: { isPhish: false, flags: [] } };
    ids = chipIdsFor(set, 'email', money);
    for (const kept of ['changed_bank_details', 'vish_callback_pressure', 'enable_content_prompt']) assert.ok(ids.includes(kept), kept);
    // an authored flag is never hidden
    ids = chipIdsFor(set, 'email', { ...plain, truth: { isPhish: true, flags: ['unexpected_qr'] } });
    assert.ok(ids.includes('unexpected_qr'));
});

// ── P5-8: template tells (templates[].flags) ─────────────────────────────────

const target = {
    id: 't', address: 'tomas@merrin.example', displayName: 'Tomás', interests: { topics: ['payments'] },
    subjects: [
        { id: 's_quick', text: 'Quick one', topic: 'payments' },
        { id: 's_action', text: 'Action needed: sign in again', topic: 'payments', requiresTemplate: 'pre_expired' },
        { id: 's_news', text: 'Staff newsletter', topic: 'payments', requiresTemplate: ['pre_news'] }
    ],
    templateSets: { from: ['from_own'], greeting: ['greet'], pretext: ['pre_expired', 'pre_news', 'pre_calm'], ask: ['ask_secret', 'ask_plain'] },
    redFlagMeter: true
};
const templates = {
    from_own: { part: 'from', text: '' },
    greet: { part: 'greeting', text: 'Hi,' },
    pre_expired: { part: 'pretext', text: 'Your session has expired.', urgency: 'low' },
    pre_news: { part: 'pretext', text: "Here is this month's newsletter.", urgency: 'low' },
    pre_calm: { part: 'pretext', text: 'When you have a moment.', urgency: 'low' },
    ask_secret: { part: 'ask', text: 'Keep it between us, no need to trouble finance.', urgency: 'low', flags: ['secrecy_or_bypass', 'borrowed_authority'] },
    ask_plain: { part: 'ask', text: 'Settle it this week.', urgency: 'low' }
};

test('P5-8: a template\'s flags join the send\'s tells and the meter lists them in plain words', () => {
    const msg = { fromAccount: 'a', to: target.address, subject: 's_quick', templates: { from: 'from_own', greeting: 'greet', pretext: 'pre_calm', ask: 'ask_secret' }, slots: {} };
    assert.deepEqual(templateFlagsOf({ templates }, msg), ['secrecy_or_bypass', 'borrowed_authority']);
    const r = evaluateMessage(target, msg, { templates, accounts: [{ id: 'a', address: 'x@y.example' }] });
    assert.ok(r.tells.includes('secrecy_or_bypass') && r.tells.includes('borrowed_authority'));
    assert.deepEqual(r.templateFlags, ['secrecy_or_bypass', 'borrowed_authority']);
    const plain = evaluateMessage(target, { ...msg, templates: { ...msg.templates, ask: 'ask_plain' } }, { templates, accounts: [] });
    assert.equal(plain.tells.includes('secrecy_or_bypass'), false);
    // the meter
    const host = document.createElement('div');
    document.body.appendChild(host);
    const c = new MailComposer(host, { templates, phishTargets: [target], account: { id: 'a', address: 'x@y.example', person: null },
        contacts: [{ id: 't', name: 'Tomás', addresses: [target.address], targetId: 't' }], globals: {}, pushLayer: () => () => {} });
    c.chooseTemplate('pretext', 'pre_calm');
    c.chooseTemplate('ask', 'ask_secret');
    const items = [...host.querySelectorAll('.mail-redflag-text')].map((n) => n.textContent);
    assert.ok(items.includes('Asked to keep it secret or to skip the normal process'), items.join(' | '));
    assert.ok(items.includes('Someone senior is invoked to skip a check'), items.join(' | '));
});

// ── P5-7: the subject follows the pretext ────────────────────────────────────

test('P5-7: a subject bound to a pretext is offered only with it, and choosing the pretext picks it', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const c = new MailComposer(host, { templates, phishTargets: [target], account: { id: 'a', address: 'x@y.example', person: null },
        contacts: [{ id: 't', name: 'Tomás', addresses: [target.address], targetId: 't' }], globals: {}, pushLayer: () => () => {} });
    const offered = () => [...host.querySelectorAll('.mail-compose-subject option')].map((o) => o.value);
    assert.deepEqual(offered(), ['s_quick']); // no pretext chosen: only the unbound subject
    c.chooseTemplate('pretext', 'pre_expired');
    assert.deepEqual(offered(), ['s_quick', 's_action']);
    assert.equal(c.subjectId, 's_action');
    c.chooseTemplate('pretext', 'pre_news');
    assert.deepEqual(offered(), ['s_quick', 's_news']);
    assert.equal(c.subjectId, 's_news'); // the action subject went with its pretext
    c.setSubject('s_quick');
    assert.equal(c.buildMessage().subject, 's_quick'); // the learner can still choose the plain one
    c.chooseTemplate('pretext', 'pre_calm');
    assert.deepEqual(offered(), ['s_quick']);
    assert.equal(c.subjectId, 's_quick');
});

// ── P5-4 (E5-E7): an NPC wearing the player's chosen sprite swaps to a look-alike-free one ──

test('P5-4: an NPC whose sprite is the player\'s swaps to another of the same set, with its stock portrait and visemes', () => {
    const npc = { id: 'agnieszka', npcType: 'person', spriteSheet: 'female_blowse_v2',
        spriteTalk: 'assets/characters/female_blowse_talk.png', spriteVisemes: 'assets/characters/female_blowse_visemes.png' };
    const other = { id: 'tom', npcType: 'person', spriteSheet: 'male_office_worker_v2' };
    const used = ['female_blowse_v2', 'female_office_worker_v2', 'male_office_worker_v2'];
    const swap = lookalikeSwap(npc, 'female_blowse_v2', used);
    assert.equal(swap.spriteSheet, 'female_telecom_v2'); // same-sex, not the player's, not used elsewhere
    assert.equal(swap.spriteTalk, 'assets/characters/female_telecom_talk.png');
    assert.equal(swap.spriteVisemes, 'assets/characters/female_telecom_visemes.png');
    assert.equal(lookalikeSwap(other, 'female_blowse_v2', used), null); // no clash, no change
    // a legacy saved key counts as its _v2
    assert.ok(lookalikeSwap(npc, 'female_blowse', used));
    // a custom portrait stays: only the stock one follows the sprite
    const custom = lookalikeSwap({ ...npc, spriteTalk: 'assets/characters/agnieszka_talk.png', spriteVisemes: 'assets/characters/agnieszka_visemes.png' }, 'female_blowse_v2', used);
    assert.equal(custom.spriteSheet, 'female_telecom_v2');
    assert.equal('spriteTalk' in custom, false);
    assert.equal('spriteVisemes' in custom, false);
    // applied in place, remembering the authored sprite
    const list = [{ ...npc }, { ...other }];
    const changed = avoidPlayerLookalike(list, 'female_blowse_v2', used);
    assert.deepEqual(changed, ['agnieszka']);
    assert.equal(list[0].spriteSheet, 'female_telecom_v2');
    assert.equal(list[0].authoredSpriteSheet, 'female_blowse_v2');
    assert.equal(list[1].spriteSheet, 'male_office_worker_v2');
    // a phone-only NPC has no world sprite: left alone
    const phone = [{ ...npc, npcType: 'phone' }];
    assert.deepEqual(avoidPlayerLookalike(phone, 'female_blowse_v2', used), []);
});

// ── validator: subjects[].requiresTemplate and templates[].flags ─────────────

const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
function lintMail(social) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    json = JSON.parse(${JSON.stringify(JSON.stringify({ social }))})
    ctx = ValidateSocial::Context.new(json: json, repo_root: '.', social: json['social'], imports: nil)
    t = json['social']['phishTargets'][0]
    out = ValidateSocial::Mail.target_subjects(t, 'T', {}) + ValidateSocial::Mail.target_templates(t, json['social']['templates'], 'T')
    puts JSON.generate(out)`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop()).map((i) => (typeof i === 'string' ? i : i.message || JSON.stringify(i)));
}

test('validator: requiresTemplate must name a template the target offers; templates[].flags must be channel tells', { skip }, () => {
    const good = { templates, phishTargets: [target] };
    let issues = lintMail(good);
    assert.equal(issues.filter((m) => /requiresTemplate|\.flags/.test(m)).length, 0, issues.join('\n'));
    const bad = JSON.parse(JSON.stringify(good));
    bad.phishTargets[0].subjects[1].requiresTemplate = 'pre_missing';
    bad.templates.ask_secret.flags = ['secrecy_or_bypass', 'made_up'];
    issues = lintMail(bad);
    assert.ok(issues.some((m) => /requiresTemplate 'pre_missing' is not in this target's templateSets/.test(m)), issues.join('\n'));
    assert.ok(issues.some((m) => /'ask_secret'\.flags 'made_up' is not a channel tell/.test(m)), issues.join('\n'));
});

// ── P5-9: each why-fine sentence once ────────────────────────────────────────

test('P5-9: a why-fine sentence said twice (even reworded "This one" / "It") is shown once', async () => {
    const { dedupeSentences } = await mod('minigames/inbox-triage/triage-scoring.js');
    const lines = [
        "A QR code is fine when you'd expect one, and it goes to Tarrowby's own domain. This one asks for no password and no card.",
        'forms.tarrowby.example ends in tarrowby.example, Tarrowby\'s own domain.',
        "Printed table cards in the canteen, put up by the facilities manager you know. It asks for no password and no card."
    ];
    const out = dedupeSentences(lines);
    assert.equal(out.length, 3);
    assert.equal(out.join(' ').match(/no password and no card/g).length, 1);
    assert.equal(out[2], 'Printed table cards in the canteen, put up by the facilities manager you know.');
    // a line already shown elsewhere on the card is dropped whole
    assert.deepEqual(dedupeSentences(['Same.', 'Other.'], ['Same.']), ['Other.']);
});
