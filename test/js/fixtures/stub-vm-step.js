#!/usr/bin/env node
// Stand-in for Hacktivity's script/dev/vm_step.rb (the real one needs Rails, a game and a VM).
// Same interface: --game ID --step NAME [--args-json -] | --list | --flag-value REF; one JSON line.
// Behaviour by step name: ok (default), slow (0.3 s), fail (exit 1), refuse (exit 2), noisy (warning
// line before the JSON), echoargs (reports the arg names it read on stdin, never the values).
const a = process.argv.slice(2);
const get = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : undefined; };
const say = (o, code = 0) => { process.stdout.write(JSON.stringify(o) + '\n'); process.exit(code); };
const game = get('--game');
if (!game) say({ ok: false, refused: '--game ID is required' }, 2);
if (a.includes('--list')) say({ ok: true, mission: 'stub', steps: [{ step: 'recon', vm: 'kali', requires: [], filmable: true }, { step: 'foothold', vm: 'kali', requires: ['recon'], filmable: false }] });
if (get('--flag-value')) {
  const ref = get('--flag-value');
  if (ref === 'stub:flag_1') say({ ok: true, ref, value: 'flag{stub-one}' });
  if (ref === 'stub:flag_2') say({ ok: true, ref, value: 'flag{stub-two}' });
  say({ ok: false, refused: `flag ref ${ref} does not resolve for this game` }, 2);
}
const step = get('--step');
let stdin = '';
const finish = () => {
  const args = stdin ? JSON.parse(stdin) : {};
  switch (step) {
    case 'fail': say({ ok: false, step, exit: 3, seconds: 0.1, flags: [], facts_used: [], summary: 'no match' }, 1);
    case 'refuse': say({ ok: false, refused: 'step requires recon' }, 2);
    case 'noisy': process.stdout.write('WARNING: something from Rails\n'); say({ ok: true, step, exit: 0, seconds: 0.1, flags: ['stub:flag_1'], facts_used: [], summary: 'ok' });
    case 'echoargs': say({ ok: true, step, exit: 0, seconds: 0.1, flags: [], facts_used: Object.keys(args), summary: 'args read' });
    case 'slow': setTimeout(() => say({ ok: true, step, exit: 0, seconds: 0.3, flags: ['stub:flag_1', 'stub:flag_2'], facts_used: [], summary: 'slow done' }), 300); return;
    default: say({ ok: true, step, exit: 0, seconds: 0.1, flags: [], facts_used: [], summary: 'ok' });
  }
};
if (a.includes('--args-json')) { process.stdin.on('data', d => { stdin += d; }); process.stdin.on('end', finish); }
else finish();
