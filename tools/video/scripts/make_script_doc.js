// usage: node make_script_doc.js <edit.json> <out.md>
const fs = require('fs');
const [editFile, outFile] = process.argv.slice(2);
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
  else screen = s.source.file.replace('.trimmed.mkv', '') + ' ' + s.source.in + '-' + s.source.out + ' s' + (s.seat && s.seat.chip ? ' · tab ' + s.seat.chip : '') + (s.insets ? ' · INFLUENCE inset' : '') + (s.spoiler && s.spoiler.note ? ' · ' + s.spoiler.note.split(' | ')[0] : '');
  rows.push('| ' + a.toFixed(1) + '–' + b.toFixed(1) + ' | ' + s.id + ' | ' + screen + ' | ' + (vo || '—') + ' | ' + (game || '—') + ' |');
  t = b;
}
const md = [
  '# ca12 trailer script (Visitors and tailgating)',
  '',
  'Status: round 3 draft, captions only, not voiced. Edit: `tools/video/edits/ca12_trailer_r3.json` (' + t.toFixed(1) + ' s). Owner card: D341.',
  '',
  'Owner brief (2026-11-22): the trailer must stand alone as a sell for the training; narrator VO about the course throughout; say "you play the attacker" and speak the attack steps over the footage that shows them; open on Camila\'s line; at least one VO line naming the topic over on-screen tailgating; end on a call to action to learn on Hacktivity.co.uk; tagline "Play the attack · Learn to stop it". Spoilers are not an issue for Cyber Aware. No narrator line talks over a character line.',
  '',
  '| Time (s) | Shot | On screen | Narrator (VO) | Game voice |',
  '|---|---|---|---|---|',
  ...rows,
  '',
  'VO pace limit: 3.2 words per second (lint). Every VO line is also a burned caption.',
  '',
].join('\n');
fs.writeFileSync(outFile, md);
console.log(md);
