// usage: node make_script_doc.js <edit.json> <out.md> [round]
const fs = require('fs');
const [editFile, outFile, round = '?'] = process.argv.slice(2);
const e = JSON.parse(fs.readFileSync(editFile, 'utf8'));
let t = 0;
const rows = [];
for (const s of e.shots) {
  const d = s.duration ?? (s.preset === 'ca-open' ? 2 : 3);
  const a = t, b = t + d;
  const vo = (e.vo || []).filter((v) => v.start < b && v.start >= a).map((v) => '**' + v.id + '** "' + v.text + '"').join('<br>');
  const game = (s.lines || []).map((l) => l.speaker + ': "' + l.text + '"').join('<br>');
  let screen;
  if (s.preset === 'ca-open') screen = 'Title: ' + s.ca.title + ' / ' + s.ca.company;
  else if (s.preset === 'ca-close') screen = 'End card: ' + s.ca.name + ' / ' + s.ca.tagline + ' / plate "' + s.ca.cta + '"';
  else if (s.type === 'card') screen = s.chapter + ' card: "' + s.text[0] + '"';
  else screen = s.source.file.replace('.trimmed.mkv', '') + ' ' + s.source.in + '-' + s.source.out + ' s' + (s.seat && s.seat.chip ? ' · tab ' + s.seat.chip : '') + (s.insets ? ' · ' + s.insets.map((x) => x.label || 'magnified').join(', ') + ' inset' : '') + (s.spoiler && s.spoiler.note ? ' · ' + s.spoiler.note.split(' | ')[0] : '') + (s.placeholder ? ' · **pending take**' : '');
  rows.push('| ' + a.toFixed(1) + '–' + b.toFixed(1) + ' | ' + s.id + ' | ' + screen + ' | ' + (vo || '—') + ' | ' + (game || '—') + ' |');
  t = b;
}
// Header text: the edit's optional "script" block ({ heading, owner_card, brief, pace?, open_questions? }); without one, the ca12 text this tool was written for.
const sc = e.script || {
  heading: 'ca12 trailer script (Visitors and tailgating)',
  owner_card: 'D341',
  brief: 'Owner brief (2026-11-22): the trailer must stand alone as a sell for the training; narrator VO about the course throughout; say "you play the attacker" and speak the attack steps over the footage that shows them; open on Camila\'s line; at least one VO line naming the topic over on-screen tailgating; end on a call to action to learn on Hacktivity.co.uk; tagline "Play the attack · Learn to stop it". Spoilers are not an issue for Cyber Aware. No narrator line talks over a character line.',
};
const md = [
  '# ' + sc.heading,
  '',
  'Status: script round ' + round + ', captions only, not voiced. Edit: `' + (e.script ? editFile : 'tools/video/edits/ca12_trailer_r3.json') + '` (' + t.toFixed(1) + ' s). Owner card: ' + sc.owner_card + '.',
  '',
  sc.brief,
  '',
  '| Time (s) | Shot | On screen | Narrator (VO) | Game voice |',
  '|---|---|---|---|---|',
  ...rows,
  '',
  sc.pace || 'VO pace limit: 3.0 words per second (lint). Every VO line is also a burned caption.',
  '',
  ...(sc.open_questions ? ['## Open questions for the owner', '', ...sc.open_questions.map((q) => '- ' + q), ''] : []),
].join('\n');
fs.writeFileSync(outFile, md);
console.log(md);
