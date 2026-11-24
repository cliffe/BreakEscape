// terminal-grammar.js (Ops S6 unit 09)
// Run with: node test/js/network-terminal-grammar.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fixtureNames, loadFixture } from './support/network-view-harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '../../public/break_escape/js/minigames/network-view');
const file = join(dir, 'terminal-grammar.js');
const G = await import(pathToFileURL(file));
const C = await import(pathToFileURL(join(dir, 'view-controls.js')));
const D = await import(pathToFileURL(join(dir, 'cli-gen/defaults.js')));

const SHELL = Object.freeze({ prompt: 'shell', module: null, technique: null });
const MSF = Object.freeze({ prompt: 'msf', module: null, technique: null });
const clone = (v) => JSON.parse(JSON.stringify(v));

/** A fixture as the scene holds it: the first foothold with the body's held techniques. */
function viewOf(name) {
    const body = loadFixture(name);
    return { ...clone(body.footholds[0]), techniques: clone(body.techniques ?? body.footholds[0].techniques ?? {}) };
}
const offersFor = (view, jack = null) => C.offers(view, { unplugJack: jack });
const p = (line, view, offers, mode = SHELL) => G.parse(line, offers ?? offersFor(view), view, mode);
const sameOffer = (r, offer) => { assert.equal(r.kind, 'offer', JSON.stringify(r)); assert.deepEqual(r.offer, offer); };
const msg = (r) => { assert.equal(r.kind, 'message', JSON.stringify(r)); return r.lines.join('\n'); };

// A hand-built view: one block, two hosts of one service each, one finding each
function build(rows, extra = {}) {
    return {
        id: 'jack_a', via: 'jack', network: { id: 'lab_net', name: 'Lab' }, hosts: rows,
        networks: [{ id: 'lab_net', name: 'Lab', route: 'up', via: null, hosts: rows, swept: true, ops: true, ...(extra.block || {}) }],
        techniques: extra.techniques ?? {}
    };
}
const svc = (name, port, extra = {}) => ({ name, label: name, port, product: 'Prod', version: '1', ...extra });
const finding = (host, service, alias, extra = {}) => ({ id: `${host}.${service}.${alias}x`, alias, hostId: host, service, class: 'unpatched', severity: 'high', summary: `Summary ${alias}.`, status: 'unconfirmed', ...extra });
const hostRow = (id, extra = {}) => ({ id, kind: 'device', name: id, scanned: true, services: [svc('web', 80)], findings: [], ...extra });

test('the module imports only the permitted modules and names no unsafe drawing', () => {
    const text = readFileSync(file, 'utf8');
    const imports = [...text.matchAll(/from\s+'([^']+)'/g)].map(m => m[1]).sort();
    assert.deepEqual(imports, ['./cli-gen/defaults.js', './ops-model.js', './view-controls.js', './view-texts.js']);
    assert.doesNotMatch(text, /\b(document|window|localStorage|fetch)\b|innerHTML|outerHTML|insertAdjacentHTML|\beval\b|new Function/);
});

test('GRAMMAR_TEXT is a frozen list holding every quoted answer', () => {
    assert.ok(Object.isFrozen(G.GRAMMAR_TEXT));
    for (const t of ['One action at a time.', 'One target at a time in this simulation.', 'Pipes and redirects are not part of this simulation.',
        'Still waiting for the last answer.', 'Reading targets from a file is not part of this simulation.',
        '-sn only finds hosts. Use nmap -sV <host> to list its services.', 'Versions are listed per host: nmap -sV <host>.',
        'The version scan lists every service here; -p is ignored.', 'Name a port with -p:', 'Select a module first: use <module>',
        'RHOSTS and RPORT come from the module in this simulation.', 'No such option in this simulation.', 'Not part of this simulation.',
        'Ignored in this simulation: <flag>', '<port> is a <protocol> port here.', 'Set TECHNIQUE first. Held: <ids>']) {
        assert.ok(G.GRAMMAR_TEXT.includes(t), t);
    }
});

// ---------------------------------------------------------------------------------------------
// The round trip
// ---------------------------------------------------------------------------------------------

test('round trip: every offer of every fixture parses back to itself, in both modes, with and without a mark', () => {
    let count = 0;
    for (const name of fixtureNames()) {
        const view = viewOf(name);
        const offers = offersFor(view, name === 'planted_box' ? 'jack_a' : null);
        for (const offer of offers) {
            const line = G.commandFor(offer, view);
            assert.equal(typeof line, 'string', `${name} ${offer.action}`);
            assert.ok(!line.includes(offer.ids.findingId ?? '\u0000'), 'the built finding id is never printed');
            for (const mode of [SHELL, MSF]) {
                // a framework line carries its own mark (msf >); the others may start with $
                for (const mark of line.startsWith('msf') ? [''] : ['', '$ ']) {
                    const r = G.parse(mark + line, offers, view, mode);
                    sameOffer(r, offer);
                    count++;
                }
            }
        }
    }
    assert.ok(count > 100);
});

test('commandFor: the table of the brief', () => {
    const view = viewOf('swept_hosts');
    const offers = offersFor(view);
    const by = (a, id) => offers.find(o => o.action === a && (o.ids.hostId === id));
    assert.equal(G.commandFor(by('scan', 'print02'), view), 'nmap -sV print02');
    assert.equal(G.commandFor(by('check', 'print01'), view), 'nmap -sV --script vuln -p 80 print01');
    assert.equal(G.commandFor(by('sign-in', 'desk_pc'), view), 'signin desk_pc');
    const disc = viewOf('discovery_unswept');
    assert.equal(G.commandFor(offersFor(disc)[0], disc), 'nmap -sn lab_net');
    disc.networks[0].range = '10.0.0.0/24';
    assert.equal(G.commandFor(offersFor(disc)[0], disc), 'nmap -sn 10.0.0.0/24');
    const sh = viewOf('shares');
    const so = offersFor(sh);
    assert.equal(G.commandFor(so.find(o => o.action === 'open'), sh), 'open open_share');
    assert.equal(G.commandFor(so.find(o => o.action === 'observe'), sh), 'look queue');
    const pb = viewOf('planted_box');
    assert.equal(G.commandFor(offersFor(pb, 'jack_a')[0], pb), 'unplug');
    const tq = viewOf('techniques');
    const to = offersFor(tq);
    const mod = D.findingCli(tq.hosts[0].findings[0], tq.hosts[0].services[0]).module;
    assert.equal(G.commandFor(to.find(o => o.action === 'use'), tq), `msf > use ${mod}; set TECHNIQUE phish; run`);
    const tu = viewOf('techniques_unconfirmed');
    assert.match(G.commandFor(offersFor(tu).find(o => o.action === 'confirm'), tu), /^msf > use \S+; check$/);
    const udp = build([hostRow('dns1', { services: [svc('dns', 53, { cli: { protocol: 'udp' } })] })]);
    assert.equal(G.commandFor(offersFor(udp).find(o => o.action === 'check'), udp), 'nmap -sV --script vuln -sU -p 53 dns1');
});

// ---------------------------------------------------------------------------------------------
// Verbs, forgiving input, answers
// ---------------------------------------------------------------------------------------------

test('game verbs give the same offer as the scanner form', () => {
    const view = viewOf('swept_hosts');
    const offers = offersFor(view);
    const scan = offers.find(o => o.action === 'scan' && o.ids.hostId === 'print02');
    sameOffer(p('scan print02', view), scan);
    sameOffer(p('nmap -sV print02', view), scan);
    sameOffer(p('nmap print02', view), scan);
    const check = offers.find(o => o.action === 'check');
    sameOffer(p('check print01 web', view), check);
    sameOffer(p('check print01 80', view), check);
    sameOffer(p('check print01', view), check);
    sameOffer(p('nmap --script vuln -p 80 print01', view), check);
    sameOffer(p('nmap -sV --script=vuln print01', view), check);
    const signin = offers.find(o => o.action === 'sign-in');
    for (const v of ['signin', 'login', 'connect']) sameOffer(p(`${v} desk_pc`, view), signin);
});

test('check and run give the same offers as confirm and use', () => {
    const view = viewOf('techniques_unconfirmed');
    const offers = offersFor(view);
    const confirm = offers.find(o => o.action === 'confirm');
    const alias = confirm.ids.findingId && G.modulesOf(view).find(m => m.findingId === confirm.ids.findingId).alias;
    const mod = G.modulesOf(view).find(m => m.alias === alias).module;
    sameOffer(p(`confirm ${alias}`, view), confirm);
    sameOffer(p(`msf > use ${mod}; check`, view), confirm);
    sameOffer(p('check', view, offers, { prompt: 'msf', module: confirm.ids.findingId, technique: null }), confirm);
    const use = offers.find(o => o.action === 'use' && o.ids.findingId === confirm.ids.findingId && o.ids.techniqueId === 'phish');
    sameOffer(p(`use phish on ${alias}`, view), use);
    sameOffer(p(`use phish ${alias}`, view), use);
    sameOffer(p(`run phish on ${alias}`, view), use);
    for (const verb of ['run', 'exploit']) {
        sameOffer(p(verb, view, offers, { prompt: 'msf', module: confirm.ids.findingId, technique: 'phish' }), use);
    }
});

test('case and extra spaces are ignored; prefixes work when unique; exact beats a prefix', () => {
    const view = viewOf('techniques');
    // web beside web01
    const offers = offersFor(view);
    sameOffer(p('  CHECK   WEB   ', view), offers.find(o => o.action === 'check' && o.ids.hostId === 'web'));
    sameOffer(p('chec web01', view), offers.find(o => o.action === 'check' && o.ids.hostId === 'web01'));
    sameOffer(p('check web01 w', view), offers.find(o => o.action === 'check' && o.ids.hostId === 'web01'));
    // f1 beside f10: exact first
    const f = viewOf('alias_out_of_order');
    const fo = offersFor(f);
    const aliasOf = (id) => G.modulesOf(f).find(m => m.findingId === id).alias;
    const c1 = fo.find(o => o.action === 'confirm' && aliasOf(o.ids.findingId) === 'f1');
    sameOffer(p('confirm f1', f), c1);
    sameOffer(p('conf f1', f), c1);
    // f2 is the only unconfirmed beside f1; f is ambiguous
    assert.match(msg(p('confirm f', f)), /Could be: f1, f2|Could be: f2, f1/);
    // ambiguous verb
    assert.match(msg(p('s', f)), /^Could be: /);
});

test('the server\'s alias resolves even when findings arrive out of alias order, and the built id is never accepted', () => {
    const view = viewOf('alias_out_of_order');
    const offers = offersFor(view);
    const f1 = view.hosts[0].findings.find(f => f.alias === 'f1');
    const f2 = view.hosts[0].findings.find(f => f.alias === 'f2');
    sameOffer(p('confirm f1', view), offers.find(o => o.action === 'confirm' && o.ids.findingId === f1.id));
    sameOffer(p('confirm f2', view), offers.find(o => o.action === 'confirm' && o.ids.findingId === f2.id));
    const built = p(`confirm ${f1.id}`, view);
    assert.equal(built.kind, 'message');
    assert.ok(!built.lines.join('\n').includes(f1.id));
    assert.deepEqual(built, p('confirm nothing_here', view));
});

test('unknown verb: the nearest verb; unlisted target: what the verb works on, whether or not the id exists', () => {
    const view = viewOf('swept_hosts');
    assert.equal(msg(p('scna print02', view)), 'Unknown command. Did you mean scan?');
    assert.equal(msg(p('xyzzy', view)), msg(p('xyzzy', view)));
    const a = msg(p('scan nothere', view));
    assert.equal(a, 'scan works on: desk_pc, print02');
    assert.notEqual(a, msg(p('scan print01', view)), 'a listed row with no offer answers its own status');
    assert.equal(msg(p('look nothere', view)), 'Nothing to look here.');
});

test('a listed target with no offer answers the row\'s status text', () => {
    const rows = [
        hostRow('off01', { kind: 'pc', host: 'OFF-01', remoteSignIn: false, scanned: false, services: undefined }),
        hostRow('dead01', { responding: false, scanned: false }),
        hostRow('web02', { scanned: true })
    ];
    const view = build(rows);
    const offers = offersFor(view);
    assert.equal(msg(p('signin off01', view, offers)), 'Remote sign-in off');
    assert.equal(msg(p('scan dead01', view, offers)), 'Powered down');
    assert.equal(msg(p('check dead01', view, offers)), 'Powered down');
    assert.equal(msg(p('nmap -sV dead01', view, offers)), 'Powered down');
    // a block with no route
    const down = build([hostRow('far01', { scanned: false })]);
    down.networks.push({ id: 'far_net', name: 'Far', route: 'down', via: null, hosts: [hostRow('far02', { scanned: false })] });
    assert.equal(msg(p('scan far02', down)), 'No route');
    assert.equal(msg(p('sweep far_net', down)), 'No route');
    // a locked share
    const sh = viewOf('shares');
    assert.match(msg(p('open locked_share', sh)), /Needs an account with access/);
    assert.match(msg(p('look locked_share', sh)), /Needs an account with access/);
    // a settled finding
    const f = viewOf('findings_states');
    const confirmed = G.modulesOf(f).find(m => m.finding.status === 'confirmed');
    assert.equal(msg(p(`confirm ${confirmed.alias}`, f)), 'There is nothing more to find out here.');
    const falsy = G.modulesOf(f).find(m => m.finding.status === 'false');
    assert.equal(msg(p(`confirm ${falsy.alias}`, f)), 'That finding turned out to be false.');
});

test('a pending offer answers that it is waiting', () => {
    const view = viewOf('swept_hosts');
    const offers = C.offers(view, { pending: new Set(['scan:print02']) });
    assert.equal(msg(p('scan print02', view, offers)), 'Still waiting for the last answer.');
    assert.equal(msg(p('nmap -sV print02', view, offers)), 'Still waiting for the last answer.');
});

test('operand counts', () => {
    const view = viewOf('swept_hosts');
    for (const line of ['scan a b', 'signin a b', 'open a b', 'look a b', 'unplug x', 'sweep a b', 'confirm a b', 'check a b c', 'exit now', 'clear x', 'panels x', 'nmap a b']) {
        assert.equal(msg(p(line, view)), 'One target at a time in this simulation.', line);
    }
    assert.equal(msg(p('use a on b c', view)), 'One target at a time in this simulation.');
});

// ---------------------------------------------------------------------------------------------
// Sweep
// ---------------------------------------------------------------------------------------------

test('sweep: the one block, a named block, and a block with no sweep on offer', () => {
    const view = viewOf('discovery_unswept');
    const offers = offersFor(view);
    sameOffer(p('sweep', view), offers[0]);
    sameOffer(p('sweep lab_net', view), offers[0]);
    sameOffer(p('nmap -sn lab_net', view), offers[0]);
    const ranged = clone(view);
    ranged.networks[0].range = '10.20.0.0/24';
    const ro = offersFor(ranged);
    sameOffer(p('nmap -sn 10.20.0.0/24', ranged), ro[0]);
    sameOffer(p('sweep 10.20.0.0/24', ranged), ro[0]);
    // addresses and ranges match whole only
    assert.equal(msg(p('sweep 10.20.0', ranged)), 'sweep works on: lab_net');

    const swept = viewOf('swept_hosts');
    for (const line of ['sweep lab_net', 'sweep', 'nmap -sn lab_net', 'nmap lab_net']) {
        const r = p(line, swept);
        assert.equal(r.kind, 'local', line);
        assert.equal(r.name, 'sweep.listed');
        assert.equal(r.args.networkId, 'lab_net');
        assert.ok(Array.isArray(r.args.rows) && r.args.rows.length === 3);
    }
});

test('sweep with several blocks on offer asks which', () => {
    const view = viewOf('discovery_unswept');
    view.networks.push({ id: 'other_net', name: 'Other', route: 'up', via: null, hosts: [], swept: false });
    const offers = offersFor(view);
    assert.equal(msg(p('sweep', view, offers)), 'Name a network: lab_net, other_net');
});

// ---------------------------------------------------------------------------------------------
// The scanner form
// ---------------------------------------------------------------------------------------------

test('scanner form: notes, value flags, known flags, and the answers', () => {
    const view = viewOf('swept_hosts');
    const offers = offersFor(view);
    const scan = offers.find(o => o.action === 'scan' && o.ids.hostId === 'print02');
    const r = G.parse('nmap -sS -T4 -Pn -n -v -vv -sC -A -O -oN out.txt --top-ports 20 --min-rate 5 --max-retries 2 -e eth0 print02', offers, view, SHELL);
    sameOffer(r, scan);
    assert.deepEqual(r.notes, []);
    const ignored = G.parse('nmap --badflag -z print02', offers, view, SHELL);
    sameOffer(ignored, scan);
    assert.deepEqual(ignored.notes, ['Ignored in this simulation: --badflag', 'Ignored in this simulation: -z']);
    assert.equal(msg(p('nmap -iL targets.txt', view)), 'Reading targets from a file is not part of this simulation.');
    assert.equal(msg(p('nmap -sn print02', view)), '-sn only finds hosts. Use nmap -sV <host> to list its services.');
    const withP = G.parse('nmap -sV -p 80 print02', offers, view, SHELL);
    sameOffer(withP, scan);
    assert.deepEqual(withP.notes, ['The version scan lists every service here; -p is ignored.']);
    // a value flag's value is never the target
    sameOffer(p('nmap -oN print02 print02', view), scan);
    // network targets
    const disc = viewOf('discovery_unswept');
    const sw = G.parse('nmap -sV lab_net', offersFor(disc), disc, SHELL);
    sameOffer(sw, offersFor(disc)[0]);
    assert.deepEqual(sw.notes, ['Versions are listed per host: nmap -sV <host>.']);
    assert.deepEqual(G.parse('nmap -sn lab_net', offersFor(disc), disc, SHELL).notes, []);
});

test('scanner form: the check names its service by port', () => {
    const rows = [hostRow('multi', { services: [svc('web', 80), svc('ssh', 22)] })];
    const view = build(rows);
    const offers = offersFor(view);
    assert.equal(offers.filter(o => o.action === 'check').length, 2);
    const web = offers.find(o => o.action === 'check' && o.ids.service === 'web');
    sameOffer(p('nmap --script vuln -p 80 multi', view, offers), web);
    assert.equal(msg(p('nmap --script vuln multi', view, offers)), 'Name a port with -p: 80, 22');
    assert.equal(msg(p('nmap --script vuln -p 99 multi', view, offers)), 'Name a port with -p: 80, 22');
    // a protocol that disagrees: the check still goes, with a note
    const r = G.parse('nmap --script vuln -sU -p 80 multi', offers, view, SHELL);
    sameOffer(r, web);
    assert.deepEqual(r.notes, ['80 is a tcp port here.']);
    const udp = build([hostRow('dns1', { services: [svc('dns', 53, { cli: { protocol: 'udp' } })] })]);
    const ur = G.parse('nmap --script vuln -p 53 dns1', offersFor(udp), udp, SHELL);
    assert.deepEqual(ur.notes, ['53 is a udp port here.']);
    assert.deepEqual(G.parse('nmap --script vuln -sU -p 53 dns1', offersFor(udp), udp, SHELL).notes, []);
    // game form names the service
    assert.match(msg(p('check multi', view, offers)), /^Name a service or port: web \(80\), ssh \(22\)$/);
    sameOffer(p('check multi ssh', view, offers), offers.find(o => o.ids.service === 'ssh'));
    sameOffer(p('check multi 22', view, offers), offers.find(o => o.ids.service === 'ssh'));
});

test('an address names its host, exactly only', () => {
    const rows = [hostRow('srv1', { address: '10.1.2.3', scanned: false, services: undefined })];
    const view = build(rows);
    const offers = offersFor(view);
    const scan = offers.find(o => o.action === 'scan');
    sameOffer(p('nmap -sV 10.1.2.3', view, offers), scan);
    sameOffer(p('scan 10.1.2.3', view, offers), scan);
    assert.match(msg(p('scan 10.1.2', view, offers)), /^scan works on: srv1$/);
});

// ---------------------------------------------------------------------------------------------
// Both-matches answers
// ---------------------------------------------------------------------------------------------

test('hand-built fixtures: two services on one port, one address on two hosts, a network id equal to a host id', () => {
    const same = build([hostRow('dup', { services: [svc('web', 80), svc('alt', 80)] })]);
    const so = offersFor(same);
    for (const line of ['nmap --script vuln -p 80 dup', 'check dup 80']) {
        const r = p(line, same, so);
        assert.equal(r.kind, 'message', line);
        assert.match(r.lines[0], /^More than one matches: /);
    }
    const addr = build([hostRow('h1', { address: '10.9.9.9', scanned: false, services: undefined }), hostRow('h2', { address: '10.9.9.9', scanned: false, services: undefined })]);
    const ao = offersFor(addr);
    assert.equal(msg(p('scan 10.9.9.9', addr, ao)), 'More than one matches: scan h1, scan h2');
    assert.equal(msg(p('nmap 10.9.9.9', addr, ao)), 'More than one matches: scan h1, scan h2');
    const clash = build([hostRow('lab_net', { scanned: false, services: undefined })], { block: { swept: false } });
    const co = offersFor(clash);
    assert.equal(co.filter(o => o.action === 'sweep' || o.action === 'scan').length, 2);
    const r = p('nmap lab_net', clash, co);
    assert.equal(r.kind, 'message');
    assert.equal(r.lines[0], 'More than one matches: sweep lab_net, scan lab_net');
    // each game verb still works alone
    sameOffer(p('sweep lab_net', clash, co), co.find(o => o.action === 'sweep'));
    sameOffer(p('scan lab_net', clash, co), co.find(o => o.action === 'scan'));
});

// ---------------------------------------------------------------------------------------------
// Line rules
// ---------------------------------------------------------------------------------------------

test('line rules: ; splits, one request per line, a failing command stops the rest, pipes, empty', () => {
    const view = viewOf('swept_hosts');
    const offers = offersFor(view);
    assert.equal(msg(p('scan print02; signin desk_pc', view, offers)), 'One action at a time.');
    assert.equal(msg(p('scan print02; scan print02', view, offers)), 'One action at a time.');
    // a local before an offer
    const r = p('help; scan print02', view, offers);
    sameOffer(r, offers.find(o => o.action === 'scan' && o.ids.hostId === 'print02'));
    assert.equal(r.before[0].name, 'help');
    // a failing command stops the rest
    assert.equal(msg(p('look nothere; scan print02', view, offers)), 'Nothing to look here.');
    // locals only
    const l = p('help; show', view, offers);
    assert.equal(l.kind, 'local');
    assert.equal(l.name, 'show');
    assert.equal(l.before[0].name, 'help');
    for (const line of ['scan a | cat', 'show > out', 'show >> out', 'show < in', 'help |']) {
        assert.equal(msg(p(line, view, offers)), 'Pipes and redirects are not part of this simulation.', line);
    }
    assert.deepEqual(p('', view, offers), { kind: 'message', lines: [] });
    assert.deepEqual(p('   ;  ; ', view, offers), { kind: 'message', lines: [] });
});

test('the local verbs and their names', () => {
    const view = viewOf('techniques');
    const offers = offersFor(view);
    assert.deepEqual(p('help', view, offers), { kind: 'local', name: 'help', args: { verb: null } });
    assert.deepEqual(p('help scan', view, offers), { kind: 'local', name: 'help', args: { verb: 'scan' } });
    assert.deepEqual(p('help nmap', view, offers), { kind: 'local', name: 'help', args: { verb: 'nmap' } });
    for (const w of ['show', 'ls']) assert.deepEqual(p(w, view, offers), { kind: 'local', name: 'show', args: {} });
    assert.deepEqual(p('clear', view, offers), { kind: 'local', name: 'clear', args: {} });
    assert.deepEqual(p('panels', view, offers), { kind: 'local', name: 'panels', args: {} });
    for (const w of ['exit', 'quit']) assert.deepEqual(p(w, view, offers), { kind: 'local', name: 'exit', args: {} });
    assert.deepEqual(p('msfconsole', view, offers), { kind: 'local', name: 'msfconsole', args: {}, mode: MSF });
    assert.equal(msg(p('help bogus', view, offers)).startsWith('Unknown command'), true);
});

// ---------------------------------------------------------------------------------------------
// The framework form
// ---------------------------------------------------------------------------------------------

test('framework: use, set, unset, back, exit, sessions, search, info, show options', () => {
    const view = viewOf('techniques');
    const offers = offersFor(view);
    const mods = G.modulesOf(view);
    assert.deepEqual(mods.map(m => m.number), [1, 2]);
    const m1 = mods[0];
    const u = p(`use ${m1.module}`, view, offers, MSF);
    assert.equal(u.name, 'msf.use');
    assert.deepEqual(u.args, { findingId: m1.findingId, alias: m1.alias, module: m1.module });
    assert.deepEqual(u.mode, { prompt: 'msf', module: m1.findingId, technique: null });
    // by alias and by search number
    assert.deepEqual(p(`use ${m1.alias}`, view, offers, MSF).args, u.args);
    assert.deepEqual(p('use 1', view, offers, MSF).args, u.args);
    assert.equal(msg(p('use nothing', view, offers, MSF)), 'No such module. Try search.');
    assert.equal(msg(p(`use ${m1.findingId}`, view, offers, MSF)), 'No such module. Try search.');
    assert.equal(msg(p('use', view, offers, MSF)), 'Select a module first: use <module>');

    const sel = { prompt: 'msf', module: m1.findingId, technique: null };
    const s = p('set TECHNIQUE phish', view, offers, sel);
    assert.deepEqual([s.name, s.args], ['msf.set', { name: 'TECHNIQUE', value: 'phish' }]);
    assert.deepEqual(s.mode, { ...sel, technique: 'phish' });
    assert.deepEqual(p('set technique phish_s', view, offers, sel).args.value, 'phish_sms');
    assert.match(msg(p('set TECHNIQUE nothing', view, offers, sel)), /^TECHNIQUE must be one you hold: phish, phish_sms$/);
    const un = p('unset TECHNIQUE', view, offers, { ...sel, technique: 'phish' });
    assert.deepEqual([un.name, un.mode], ['msf.unset', sel]);
    assert.equal(msg(p('set RHOSTS 192.0.2.4', view, offers, sel)), 'RHOSTS and RPORT come from the module in this simulation.');
    assert.equal(msg(p('set RPORT 80', view, offers, sel)), 'RHOSTS and RPORT come from the module in this simulation.');
    assert.equal(msg(p('set LHOST x', view, offers, sel)), 'No such option in this simulation.');
    assert.equal(msg(p('show payloads', view, offers, sel)), 'Not part of this simulation.');
    assert.equal(msg(p('show', view, offers, sel)), 'Not part of this simulation.');
    assert.equal(p('show options', view, offers, sel).name, 'msf.options');
    assert.equal(p('info', view, offers, sel).name, 'msf.info');
    assert.deepEqual(p('sessions', view, offers, sel), { kind: 'local', name: 'msf.sessions', args: {} });
    assert.deepEqual(p('search web', view, offers, sel), { kind: 'local', name: 'msf.search', args: { word: 'web' } });
    assert.deepEqual(p('search', view, offers, sel).args, { word: '' });
    assert.deepEqual(p('back', view, offers, { ...sel, technique: 'phish' }).mode, { prompt: 'msf', module: null, technique: 'phish' });
    for (const w of ['exit', 'quit']) assert.deepEqual(p(w, view, offers, sel), { kind: 'local', name: 'exit', args: {}, mode: SHELL });
});

test('framework: no module, no technique, and the game verbs still work', () => {
    const view = viewOf('techniques');
    const offers = offersFor(view);
    for (const w of ['check', 'run', 'exploit', 'info', 'show options']) {
        assert.equal(msg(p(w, view, offers, MSF)), 'Select a module first: use <module>', w);
    }
    const m1 = G.modulesOf(view)[0];
    assert.equal(msg(p('run', view, offers, { prompt: 'msf', module: m1.findingId, technique: null })), 'Set TECHNIQUE first. Held: phish, phish_sms');
    const none = viewOf('plain');
    assert.equal(msg(G.parse('run', [], { ...none, ...{ hosts: view.hosts, networks: view.networks } }, { prompt: 'msf', module: m1.findingId, technique: null })), 'Set TECHNIQUE first. Held: none');
    // the game verbs work in framework mode; help names both meanings of check
    const check = offers.find(o => o.action === 'check' && o.ids.hostId === 'web');
    sameOffer(p('nmap --script vuln -p 80 web', view, offers, MSF), check);
    assert.match(G.helpFor('check', SHELL).join(' '), /check <host>/);
    assert.match(G.helpFor('check', MSF).join(' '), /selected module/);
    assert.match(G.helpFor('check', SHELL).join(' '), /msfconsole/);
    assert.match(G.helpFor('check', MSF).join(' '), /Outside msfconsole/);
});

test('mode words: a leading $ reads in shell mode, msf > in framework mode against a module local to the line', () => {
    const view = viewOf('techniques');
    const offers = offersFor(view);
    const m1 = G.modulesOf(view)[0];
    const use = offers.find(o => o.action === 'use' && o.ids.findingId === m1.findingId && o.ids.techniqueId === 'phish');
    sameOffer(p(`msf (${m1.module}) > set TECHNIQUE phish; run`, view, offers), use);
    sameOffer(p(`msf > use ${m1.module}; set TECHNIQUE phish; run`, view, offers, SHELL), use);
    sameOffer(p('$ use phish on ' + m1.alias, view, offers, MSF), use);
    // a prefixed line never changes the terminal's mode
    assert.equal('mode' in p(`msf > use ${m1.module}`, view, offers, SHELL), false);
    assert.equal(msg(p(`msf (nothing) > check`, view, offers)), 'No such module. Try search.');
    // an unprefixed line in framework mode keeps its changes
    const r = p(`use ${m1.module}; set TECHNIQUE phish; run`, view, offers, MSF);
    sameOffer(r, use);
    assert.deepEqual(r.mode, { prompt: 'msf', module: m1.findingId, technique: 'phish' });
});

// ---------------------------------------------------------------------------------------------
// complete
// ---------------------------------------------------------------------------------------------

test('complete: verbs, targets and the longest common prefix', () => {
    const view = viewOf('swept_hosts');
    const offers = offersFor(view);
    const c = (line, mode = SHELL) => G.complete(line, offers, view, mode);
    assert.deepEqual(c('sca'), { completed: 'scan ', matches: ['scan'] });
    assert.deepEqual(c('si').matches, ['signin']);
    assert.deepEqual(c('s').matches.sort(), ['scan', 'show', 'signin', 'sweep']);
    assert.equal(c('s').completed, 's');
    assert.deepEqual(c('scan pri').matches, ['print02']);
    assert.equal(c('scan pri').completed, 'scan print02 ');
    assert.deepEqual(c('check print').matches, ['print01']);
    assert.deepEqual(c('check print01 w').matches, ['web']);
    assert.deepEqual(c('scan nothing'), { completed: 'scan nothing', matches: [] });
    assert.deepEqual(c('help sw').matches, ['sweep']);
    assert.deepEqual(c('nmap -s').matches.slice(0, 3), ['-sC', '-sS', '-sT']);
    const tq = viewOf('techniques');
    const to = offersFor(tq);
    const cm = G.complete('use phi', to, tq, SHELL);
    assert.deepEqual(cm.matches, ['phish', 'phish_sms']);
    assert.equal(cm.completed, 'use phish');
    assert.deepEqual(G.complete('set TECHNIQUE ', to, tq, MSF).matches, ['phish', 'phish_sms']);
    assert.deepEqual(G.complete('show o', to, tq, MSF).matches, ['options']);
    assert.ok(G.complete('use ', to, tq, MSF).matches.some(m => m === G.modulesOf(tq)[0].module));
});

// ---------------------------------------------------------------------------------------------
// Hostile input
// ---------------------------------------------------------------------------------------------

test('hostile input returns no offer and never throws; a typed line never yields an offer outside the list', () => {
    const view = viewOf('techniques');
    const offers = offersFor(view);
    const lines = [
        '<img src=x onerror=alert(1)>', 'scan <script>', '"; DROP TABLE', '\u0000\u0001\u001b[31mscan web', 'scan\tweb\u0007',
        'x'.repeat(10000), `scan ${'a'.repeat(10000)}`, 'scan web '.repeat(2000), '‮scan web', ';;;;', '$', 'msf >', 'msf () >',
        'msf (', '{}', '__proto__', 'constructor', 'toString', 'scan __proto__', 'use constructor on toString', 'nmap -p', 'nmap --script',
        'nmap -', 'set', 'unset', 'help help help', 'use on on on', 'check ;', '|'
    ];
    for (const mode of [SHELL, MSF, { prompt: 'msf', module: 'nothing', technique: 'nothing' }, null, undefined, { prompt: 5 }]) {
        for (const line of lines) {
            let r;
            assert.doesNotThrow(() => { r = G.parse(line, offers, view, mode); }, line.slice(0, 20));
            if (r.kind === 'offer') assert.ok(offers.some(o => o === r.offer), `an offer outside the list: ${line.slice(0, 30)}`);
            if (/^x{100}|^scan a{100}|^scan web scan/.test(line)) assert.notEqual(r.kind, 'offer');
            assert.doesNotThrow(() => G.complete(line, offers, view, mode));
        }
    }
    for (const bad of [null, undefined, 5, {}, []]) {
        assert.doesNotThrow(() => G.parse('scan web', bad, bad, bad));
        assert.doesNotThrow(() => G.parse(bad, bad, bad, bad));
        assert.doesNotThrow(() => G.commandFor(bad, bad));
    }
    assert.equal(msg(p('x'.repeat(10000), view, offers)), 'That line is too long.');
    // the typed word is never echoed unsafely: a flag is cut and made printable
    const sw = viewOf('swept_hosts');
    const r = G.parse('nmap -\u202e' + 'z'.repeat(50) + ' print02', offersFor(sw), sw, SHELL);
    assert.equal(r.kind, 'offer');
    for (const n of r.notes) assert.match(n, /^Ignored in this simulation: [ -~]{1,20}$/);
});

test('parse is pure: a second call gives an equal answer and the inputs are not changed', () => {
    const view = viewOf('techniques');
    const offers = offersFor(view);
    const before = JSON.stringify({ view, offers });
    for (const line of ['scan web', 'check web', 'msfconsole', 'help', 'use phish on f1', 'nmap -sV web']) {
        assert.deepEqual(G.parse(line, offers, view, SHELL), G.parse(line, offers, view, SHELL));
    }
    assert.equal(JSON.stringify({ view, offers }), before);
});

test('R1-C3: two findings with one authored module path, and two services on one port, still read back to their offers', () => {
    // the same weakness on two hosts: one authored module path, two aliases
    const rows = [
        hostRow('web1', { findings: [finding('web1', 'web', 'a1', { cli: { module: 'exploit/training/shared_flaw' } })] }),
        hostRow('web2', { findings: [finding('web2', 'web', 'b1', { cli: { module: 'exploit/training/shared_flaw' } })] })
    ];
    for (const r of rows) r.findings[0].cli = { module: 'exploit/training/shared_flaw' };
    const view = build(rows, { techniques: { tk: { id: 'tk', name: 'Tk', held: true } } });
    const offers = offersFor(view);
    const confirms = offers.filter(o => o.action === 'confirm');
    assert.equal(confirms.length, 2);
    for (const offer of confirms) sameOffer(p(G.commandFor(offer, view), view, offers), offer);
    assert.notEqual(G.commandFor(confirms[0], view), G.commandFor(confirms[1], view));
    // two services of one host on one port number, one of them udp
    const dual = build([hostRow('print01', { services: [svc('print', 80), svc('printu', 80, { cli: { protocol: 'udp' } })], findings: [] })]);
    const dOffers = offersFor(dual);
    const checks = dOffers.filter(o => o.action === 'check');
    assert.equal(checks.length, 2);
    for (const offer of checks) {
        const line = G.commandFor(offer, dual);
        sameOffer(p(line, dual, dOffers), offer);
    }
});

test('a short form of a move that ends the trip is refused at both prompts; whole verbs resolve as before', () => {
    const view = viewOf('planted_box');
    const offers = offersFor(view, 'jack_a');
    assert.ok(offers.some(o => o.action === 'unplug'), 'an unplug offer is present');
    const unplug = offers.find(o => o.action === 'unplug');
    const exitLocal = (r) => { assert.equal(r.kind, 'local', JSON.stringify(r)); assert.equal(r.name, 'exit'); };
    for (const mode of [SHELL, MSF]) {
        for (const [line, verb] of [['un', 'unplug'], ['unplu', 'unplug'], ['ex', 'exit'], ['q', 'exit'], ['qui', 'exit']]) {
            const r = p(line, view, offers, mode);
            // In the msf prompt `un` also fits unset and `ex` also fits exploit: several verbs answer Could be as before.
            if (mode === MSF && (line === 'ex' || line === 'un')) { assert.match(msg(r), /^Could be: /); continue; }
            assert.equal(msg(r), `Unknown command. Did you mean ${verb}?`, `${mode.prompt} ${line}`);
            assert.match(msg(p(`${line}; look`, view, offers, mode)), /Did you mean/);
        }
        for (const line of ['unplug', 'UNPLUG', '  unplug  ']) sameOffer(p(line, view, offers, mode), unplug);
        for (const line of ['exit', 'quit', 'EXIT', '  quit  ']) exitLocal(p(line, view, offers, mode));
    }
    assert.equal(G.complete('un', offers, view, SHELL).completed, 'unplug ');
});
