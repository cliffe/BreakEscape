// cli-gen/framework-console.js (Ops S6 unit 11)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import * as AU from './support/cli-authored.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const NV = join(here, '../../public/break_escape/js/minigames/network-view');
const F = await import(pathToFileURL(join(NV, 'cli-gen/framework-console.js')));
const OM = await import(pathToFileURL(join(NV, 'ops-model.js')));
const GOLD = join(here, 'fixtures/network-view/cli-golden/framework');
const fx = (name) => JSON.parse(readFileSync(join(here, 'fixtures/network-view', `${name}.json`), 'utf8'));
const CODES = JSON.parse(readFileSync(join(here, '../fixtures/files/ops_refusal_codes.json'), 'utf8'));

const viewOf = (name) => { const d = fx(name); return { ...d.footholds[0], techniques: d.techniques || fx('techniques').techniques }; };
const states = viewOf('findings_states');
const withCli = structuredClone(states);
for (const r of [...withCli.hosts, ...withCli.networks[0].hosts]) {
    for (const f of r.findings) if (f.alias === 'f2') f.cli = { module: 'training/web/sample_check', title: 'Sample check on web', advisories: ['TRN-0000-0001', 'TRN-0000-0002'] };
}

const show = (lines) => lines.map(l => l.map(s => (s.cls ? `[${s.cls}|${s.text}]` : s.text)).join('')).join('\n') + '\n';
function golden(name, lines) {
    const file = join(GOLD, `${name}.txt`);
    const got = show(lines);
    if (process.env.UPDATE_GOLDEN === '1' && !existsSync(file)) writeFileSync(file, got);
    assert.equal(got, readFileSync(file, 'utf8'), name);
}
const offer = (action, fid, tid) => ({ action, ids: { findingId: fid, ...(tid ? { techniqueId: tid, itemId: `card_${tid}` } : {}) }, target: fid });
const fid = (alias) => OM.findFinding(states, alias).finding.id;
const mode = (alias, technique = null) => ({ prompt: 'msf', module: alias ? fid(alias) : null, technique });

test('banner, search, info, show options, sessions', () => {
    golden('banner', F.banner());
    golden('search.all', F.search(states));
    golden('search.word', F.search(states, 'cosmetic'));
    golden('search.none', F.search(states, 'zzz'));
    golden('search.cli', F.search(withCli, 'sample'));
    golden('info.unconfirmed', F.info(states, mode('f1')));
    golden('info.false', F.info(states, mode('f3')));
    golden('info.cli', F.info(withCli, mode('f2')));
    golden('info.nomodule', F.info(states, mode(null)));
    golden('options.set', F.showOptions(states, mode('f1', 'phish')));
    golden('options.unset', F.showOptions(states, mode('f1')));
    golden('sessions.some', F.sessions(viewOf('technique_session')));
    golden('sessions.none', F.sessions(states));
});

test('show options names exactly three options', () => {
    const lines = show(F.showOptions(states, mode('f1'))).split('\n');
    const names = lines.filter(l => /^(RHOSTS|RPORT|TECHNIQUE)\b/.test(l));
    assert.equal(names.length, 3);
    assert.equal(lines.filter(l => /^[A-Z]{4,}/.test(l) && !names.includes(l) && !/^(Name|Techniques)/.test(l)).length, 0);
});

test('prompt marks', () => {
    assert.equal(F.promptMark({ prompt: 'shell', module: null, technique: null }, states), '$');
    assert.equal(F.promptMark(mode(null), states), 'msf >');
    assert.equal(F.promptMark(mode('f1'), states), `msf (${F.moduleFor(states, 'f1').path}) >`);
});

test('confirm: started and results', () => {
    const o = offer('confirm', fid('f1'));
    golden('confirm.started', F.started(o, states));
    const f2 = OM.findFinding(states, 'f2').finding;
    golden('confirm.confirmed', F.result(offer('confirm', f2.id), { success: true, finding: f2 }, states));
    const fixed = OM.findFinding(states, 'f4').finding;
    golden('confirm.fixed', F.result(offer('confirm', fixed.id), { success: true, finding: fixed }, states));
    const f3 = OM.findFinding(states, 'f3').finding;
    golden('confirm.false', F.result(offer('confirm', f3.id), { success: true, finding: f3 }, states));
    golden('confirm.refused', F.result(o, { success: false, reason: 'not_responding' }, states));
    golden('confirm.null', F.result(o, null, states));
});

test('use: started and each outcome', () => {
    const o = offer('use', fid('f1'), 'phish');
    golden('use.started', F.started(o, states));
    golden('use.session', F.result(o, { success: true, grant: 'session', session: { displayName: 'Sam' } }, states));
    golden('use.session_admin', F.result(o, { success: true, grant: 'session', session: { displayName: 'Sam', access: 'admin' } }, states));
    golden('use.credential', F.result(o, { success: true, grant: 'credential' }, states));
    golden('use.already', F.result(o, { success: true, grant: 'session', already: true, session: { displayName: 'Sam' } }, states));
    golden('use.null', F.result(o, null, states));
    golden('use.refused_need', F.result(o, { success: false, reason: 'need_unmet', need: { label: 'Admin login' } }, states));
    for (const code of CODES) golden(`use.refused.${code}`, F.result(o, { success: false, reason: code }, states));
});

test('refusal words are the shared ones', () => {
    for (const code of CODES) {
        const text = show(F.result(offer('use', fid('f1'), 'phish'), { success: false, reason: code }, states));
        assert.ok(text.includes(OM.refusalText(code)), code);
    }
});

test('a decoy and a weakness read the same before a confirm', () => {
    const v = structuredClone(states);
    const web = v.hosts[0];
    const mk = (id, alias, status) => ({ id, alias, hostId: web.id, service: 'web', class: 'unpatched', severity: 'low', summary: 'S.', status });
    web.findings = [mk('print01.web.weak', 'f7', 'unconfirmed'), mk('print01.web.decoy', 'f8', 'unconfirmed')];
    v.networks = [];
    const norm = (lines, alias) => show(lines).replace(new RegExp(alias, 'g'), 'fX').replace(/auxiliary\/scanner\/web\/\w+/g, 'MOD');
    for (const [name, fn] of [['info', (a) => F.info(v, { prompt: 'msf', module: a })],
        ['options', (a) => F.showOptions(v, { prompt: 'msf', module: a })]]) {
        assert.equal(norm(fn('f7'), 'f7'), norm(fn('f8'), 'f8'), name);
    }
    const one = (alias) => norm(F.started(offer('confirm', alias), v).concat(F.started(offer('use', alias, 'phish'), v)), alias);
    assert.equal(one('f7'), one('f8'));
    const rows = show(F.search(v)).split('\n').filter(l => /^\d/.test(l)).map(l => l.replace(/f[78]/g, 'fX').replace(/^\d+/, 'N').replace(/auxiliary\/scanner\/web\/\w+/, 'MOD'));
    assert.equal(rows[0], rows[1]);
});

test('every fixed string is listed, pure and safe', () => {
    assert.ok(Object.isFrozen(F.TEMPLATES));
    assert.equal(F.id, 'framework-console');
    assert.deepEqual(F.result(offer('use', fid('f1'), 'phish'), { success: false, reason: 'locked' }, states), F.result(offer('use', fid('f1'), 'phish'), { success: false, reason: 'locked' }, states));
    const src = readFileSync(join(NV, 'cli-gen/framework-console.js'), 'utf8');
    assert.doesNotMatch(src, /\b(window|document|localStorage|Date|Math\.random|innerHTML|outerHTML|eval|setTimeout|setInterval)\b/);
    assert.doesNotMatch(src.replace(/^import[\s\S]*?;\n/gm, ''), /simulated/i);
    const imports = [...src.matchAll(/from '([^']+)'/g)].map(m => m[1]).sort();
    assert.deepEqual(imports, ['../ops-model.js', '../terminal-grammar.js', '../view-texts.js', './defaults.js']);
    for (const t of F.TEMPLATES) assert.equal(typeof t, 'string');
});

test('the built finding id is never printed', () => {
    const all = [F.search(states), F.info(states, mode('f1')), F.started(offer('confirm', fid('f1')), states)].map(show).join('');
    assert.ok(!all.includes(fid('f1')));
});

// ---------------------------------------------------------------------------------------------
// The authored `cli` fixtures (Ops S6 unit 24): golden files over a view with every `cli` field served. A confirm
// and a use are written as the Terminal logs them (the echo, the `started` lines, the result). New files only.
// ---------------------------------------------------------------------------------------------
const authoredSteps = [];
for (const name of AU.AUTHORED) {
    const listing = AU.stageView(name, 'confirm');
    const ans = AU.answers(name);
    const id = (alias) => OM.findFinding(listing, alias).finding.id;
    const confirmed = (alias) => {
        const v = AU.clone(listing);
        for (const r of [...v.hosts, ...v.networks.flatMap(b => b.hosts)]) for (const f of r.findings || []) if (f.alias === alias) { f.status = 'confirmed'; f.needs = []; }
        return v;
    };
    const msf = (alias, technique = null) => ({ prompt: 'msf', module: id(alias), technique });
    authoredSteps.push(
        [name, 'search.all', () => F.search(listing)],
        [name, 'search.word', () => F.search(listing, 'filehold')],
        [name, 'search.address', () => F.search(listing, '10.40.0.4')],
        [name, 'info.f1', () => F.info(listing, msf('f1'))],
        [name, 'info.f2', () => F.info(listing, msf('f2'))],
        [name, 'info.f3', () => F.info(listing, msf('f3'))],
        [name, 'info.f4', () => F.info(listing, msf('f4'))],
        [name, 'info.f1.confirmed', () => F.info(confirmed('f1'), msf('f1'))],
        [name, 'options.f1', () => F.showOptions(listing, msf('f1'))],
        [name, 'options.f1.technique', () => F.showOptions(listing, msf('f1', 'update_notes'))],
        [name, 'options.f4', () => F.showOptions(listing, msf('f4'))],
        [name, 'confirm.f1.confirmed', () => AU.moveLines(listing, AU.confirmOffer(id('f1')), ans.confirm(id('f1')))],
        [name, 'confirm.f2.false', () => AU.moveLines(listing, AU.confirmOffer(id('f2')), ans.confirm(id('f2'), 'false'))],
        [name, 'confirm.f4.confirmed', () => AU.moveLines(listing, AU.confirmOffer(id('f4')), ans.confirm(id('f4')))],
        [name, 'use.f1.session', () => AU.moveLines(confirmed('f1'), AU.useOffer(id('f1'), 'update_notes'), ans.session)],
        [name, 'use.f1.before-confirm', () => AU.moveLines(listing, AU.useOffer(id('f1'), 'update_notes'), { success: false, reason: 'not_confirmed' })],
        [name, 'use.f2.before-confirm', () => AU.moveLines(listing, AU.useOffer(id('f2'), 'update_notes'), { success: false, reason: 'not_confirmed' })]
    );
}

for (const [name, step, make] of authoredSteps) {
    test(`golden ${name}.${step}`, () => {
        const file = join(GOLD, `${name}.${step}.txt`);
        const got = AU.show(make());
        if (process.env.UPDATE_GOLDEN === '1' && !existsSync(file)) writeFileSync(file, got);
        assert.equal(got, readFileSync(file, 'utf8'), `${name}.${step}`);
        assert.equal(AU.show(make()), got, 'called twice, equal lines');
    });
}

test('authored fixtures: the address, the references and the module reach the lines', () => {
    const v = AU.stageView('cli_authored_entries', 'confirm');
    const f = (a) => OM.findFinding(v, a).finding;
    const info = show(F.info(v, { prompt: 'msf', module: f('f1').id }));
    assert.match(info, /files01 \(10\.20\.0\.10\), port 445, filehold/);
    assert.match(info, /References:/);
    assert.match(info, /TRN-0000-0101/);
    assert.match(info, /training\/filehold\/update_lag/);
    assert.match(show(F.showOptions(v, { prompt: 'msf', module: f('f1').id })), /RHOSTS\s+10\.20\.0\.10/);
    assert.match(show(F.showOptions(v, { prompt: 'msf', module: f('f4').id })), /RHOSTS\s+10\.40\.0\.4/);
    const lines = AU.show(AU.moveLines(v, AU.confirmOffer(f('f1').id), AU.answers('cli_authored_entries').confirm(f('f1').id)));
    assert.match(lines, /\[note\|\[\*\]\] Checking 10\.20\.0\.10:445/);
    assert.match(lines, /\[ok\|\[\+\]\] 10\.20\.0\.10:445 - The target appears to be vulnerable\./);
    const bare = show(F.info(AU.stageView('cli_authored_bare', 'confirm'), { prompt: 'msf', module: f('f1').id }));
    assert.doesNotMatch(bare, /References:/);
});

test('authored fixtures: a decoy and a weakness with entries of equal form read the same before a confirm', () => {
    for (const name of AU.AUTHORED) {
        const v = AU.stageView(name, 'confirm');
        const ans = AU.answers(name);
        const a = OM.findFinding(v, 'f1').finding;
        const d = OM.findFinding(v, 'f2').finding;
        assert.equal(a.class, d.class);
        assert.equal(a.severity, d.severity);
        assert.equal(a.status, d.status);
        assert.deepEqual(Object.keys(a.cli), Object.keys(d.cli), 'the entries have the same form');
        assert.equal((a.cli.advisories || []).length, (d.cli.advisories || []).length);
        assert.equal((a.cli.output || []).length, (d.cli.output || []).length);
        // one placeholder for every text an entry carries (and the summary, which is also the entry's)
        const flat = (f) => (text) => {
            let out = text;
            for (const t of [...AU.entryTexts(f), f.summary].sort((x, y) => y.length - x.length)) out = out.split(t).join('TEXT');
            return out.replace(new RegExp(`\\b${f.alias}\\b`, 'g'), 'fX').replace(/^\d+ /gm, 'N ').replace(/[ ]+/g, ' ');
        };
        const lines = (f) => {
            const m = (technique) => ({ prompt: 'msf', module: f.id, technique });
            const offerC = AU.confirmOffer(f.id);
            const offerU = AU.useOffer(f.id, 'update_notes');
            return {
                info: show(F.info(v, m(null))),
                options: show(F.showOptions(v, m('update_notes'))),
                confirmStarted: show(F.started(offerC, v)),
                useStarted: show(F.started(offerU, v)),
                useBefore: AU.show(AU.moveLines(v, offerU, { success: false, reason: 'not_confirmed' })),
                row: show(F.search(v, f.cli.module)).split('\n').filter(l => /^\d/.test(l)).join('\n')
            };
        };
        const x = lines(a), y = lines(d);
        for (const key of Object.keys(x)) {
            assert.notEqual(x[key].length, 0, key);
            assert.equal(flat(a)(x[key]), flat(d)(y[key]), `${name} ${key}`);
        }
        assert.ok(ans);
    }
});
