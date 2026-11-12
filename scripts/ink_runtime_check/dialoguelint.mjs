#!/usr/bin/env node
// Dialogue lint for Break Escape ink files and scenario timed texts.
// Rules come from story_design/universe_bible/09_scenario_design/dialogue_style.md (sections 8-11).
//
//   node scripts/ink_runtime_check/dialoguelint.mjs <mission-dir-or-ink-files>... [--json]
//
// A mission dir is linted as: every ink/*.ink in it, plus the timed texts in its scenario.json.erb.
// Face-to-face lines cap at 30 words, phone lines at 25 (channel is read from the npcType of the
// NPC whose storyPath points at the file; files no NPC uses count as face-to-face).
// Findings have a level: "error" (over a hard cap, or a standing rule broken), "check" (needs a human
// look), "warn" (style tell). Hits excused by an allowlist (VOICED_VARIABLE_ALLOW) go to each file's
// `allowed` list with their reason, not to `findings`.
// Exit code is always 0; this is an editor's aid, not a gate.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CAPS = { person: 30, phone: 25, text: 30, choice: 15 };

// ---------- AI-tell and house-style rules (applied to spoken text, choice text, texts) ----------
const BANNED = ['delve', 'delves', 'delving', 'intricate', 'intricacies', 'tapestry', 'pivotal', 'underscore', 'underscores',
  'underscored', 'landscape', 'foster', 'fosters', 'fostering', 'enhance', 'enhances', 'enhanced', 'enhancing', 'crucial',
  'breathtaking', 'captivate', 'captivating', 'profound', 'profoundly', 'steadfast', 'robust', 'testament', 'vibrant',
  'showcase', 'showcases', 'showcasing', 'garner', 'interplay', 'leverage', 'leveraging', 'leveraged', 'navigate',
  'navigating', 'valuable', 'additionally', 'load-bearing'];
const BANNED_RE = new RegExp(`\\b(${BANNED.join('|')})\\b`, 'gi');

const PATTERN_RULES = [
  { rule: 'not-x-but-y', re: /\b(?:not just|not only|more than just)\b[^.!?]{0,80}\bbut\b/gi },
  { rule: 'not-x-but-y', re: /\b(?:it|that|this|there)\s?(?:'s|’s| is| was)\s+not\b[^.!?]{0,80}?[,;:.—-]+\s*(?:it|that|this|but)\b/gi },
  { rule: 'not-x-but-y', re: /\b(?:it|that|this)\s?(?:isn't|isn’t|wasn't|wasn’t)\b[^.!?]{0,80}?[,;:.—-]+\s*(?:it|that|this|but)\b/gi },
  { rule: 'not-x-but-y', re: /\b(?:isn't|isn’t|wasn't|wasn’t|not)\s+about\b/gi },
  // pass 4 (m04 script editor): the two-sentence and pronoun forms the rules above missed.
  // "Not doubt. Irritation." / "She is not startled. She has been waiting." / "like a line he was given, and not one he checked"
  { rule: 'not-x-but-y', re: /(?:^|[.!?]\s+)Not (?!yet\b|now\b|here\b|me\b|tonight\b|today\b|really\b|quite\b|exactly\b|always\b|again\b|anymore\b|any more\b|a chance\b|on\b|with\b|in\b|from\b|for\b|if\b|until\b|unless\b|without\b|that\b|this\b|one\b|ever\b|even\b|much\b|long\b|bad\b|sure\b|likely\b|everyone\b|everything\b|all\b)[\w'’-]+(?: [\w'’-]+){0,2}[.!]\s+[A-Z][\w'’-]*(?: [\w'’-]+){0,2}[.!]/g },
  { rule: 'not-x-but-y', re: /\b(?:he|she|they)\s+(?:is|was|are|were)\s+not\s+[^.;!?]{1,40}[.;]\s+(?:he|she|they)\s+(?:is|was|are|were|has|had)\b/gi },
  { rule: 'not-x-but-y', re: /\blike [^.!?]{2,40}, and not\b/gi },
  { rule: 'inflated', re: /\b(?:a pivotal|stands as|a testament|marks a turning point|turning point|lasting legacy|plays? an? (?:significant|key|vital|crucial) role|deeply rooted|watershed|solidif(?:y|ies|ied|ying)|it'?s important to note|it'?s worth (?:mentioning|noting)|the thing is|here'?s the thing|great question|i hope that helps|let me know if you need anything)\b/gi },
  { rule: 'transition', re: /\b(?:moreover|furthermore|however|on the other hand|that said|in addition|in conclusion|in summary|overall)\b/gi },
  { rule: 'ing-tail', re: /,\s*(?:ensuring|highlighting|showcasing|underscoring|reflecting|demonstrating|emphasi[sz]ing|fostering|cementing|symboli[sz]ing|contributing|improving|enabling|allowing|making sure|reminding)\b[^.!?]*[.!?]?$/gi },
  { rule: 'fake-range', re: /\bfrom [^.!?,]{2,40} to [^.!?,]{2,40}\b(?=[^.!?]*[.!?])/gi, off: true },
];
const US_SPELLINGS = ['color', 'colors', 'colored', 'center', 'centers', 'centered', 'organize', 'organizes', 'organized', 'organizing',
  'organization', 'organizations', 'realize', 'realized', 'recognize', 'recognized', 'analyze', 'analyzed', 'defense', 'defenses',
  'license', 'licenses', 'gray', 'favorite', 'neighbor', 'neighbors', 'behavior', 'behaviors', 'traveling', 'traveler', 'skeptical',
  'apologize', 'minimize', 'prioritize', 'authorize', 'authorized', 'categorize', 'summarize', 'emphasize', 'specialize', 'normalize',
  'criticize', 'paralyze', 'catalog', 'jewelry', 'aluminum', 'mom', 'honor', 'labor', 'harbor', 'neighborhood', 'fulfill', 'enrollment',
  'practiced', 'theater', 'meter', 'liter', 'offense', 'pretense', 'artifact', 'artefact'].filter(w => w !== 'artifact' && w !== 'artefact' && w !== 'meter');
const US_RE = new RegExp(`\\b(${US_SPELLINGS.join('|')})\\b`, 'gi');
const PROGRAM_RE = /\b(?:TV|training|exchange|rehab|recovery|loyalty|rehabilitation|education|reward|scholarship)\s+program\b/gi;
const CYBER_RE = /\b(cyber[ -]?security|Cyber[ -]?security|cyber Security|Cyber-Security|CyberSecurity)\b/g;

function sentenceHits(text, rules) {
  const hits = [];
  for (const { rule, re, off } of rules) {
    if (off) continue;
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) { hits.push({ rule, match: m[0].trim() }); if (m.index === re.lastIndex) re.lastIndex++; }
  }
  return hits;
}

export function tellHits(text) {
  const hits = [];
  let m;
  BANNED_RE.lastIndex = 0;
  while ((m = BANNED_RE.exec(text))) {
    // A capitalised hit mid-sentence is a proper noun (e.g. the surname "Foster"), not the banned word.
    const before = text.slice(0, m.index).trimEnd();
    const sentenceStart = before === '' || /[.!?:"“(—-]$/.test(before);
    if (/^[A-Z]/.test(m[0]) && !sentenceStart) continue;
    hits.push({ rule: 'banned-word', match: m[0] });
  }
  hits.push(...sentenceHits(text, PATTERN_RULES));
  US_RE.lastIndex = 0;
  while ((m = US_RE.exec(text))) hits.push({ rule: 'us-spelling', match: m[0] });
  PROGRAM_RE.lastIndex = 0;
  while ((m = PROGRAM_RE.exec(text))) hits.push({ rule: 'us-spelling', match: m[0] });
  CYBER_RE.lastIndex = 0;
  while ((m = CYBER_RE.exec(text))) if (m[0] !== 'Cyber Security') hits.push({ rule: 'cyber-security', match: m[0] });
  // dedupe identical rule+match
  const seen = new Set();
  return hits.filter(h => { const k = h.rule + '|' + h.match.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
}

export function countWords(text) {
  const t = text.replace(/\*[^*]*\*/g, ' ').replace(/\s--\s|\s—\s/g, ' ').trim();
  return t ? t.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length : 0;
}

// ---------- ink text cleaning ----------
function stripBraces(s) {
  let prev;
  do {
    prev = s;
    s = s.replace(/\{([^{}]*)\}/g, (_, inner) => {
      if (/^[\w.]+$/.test(inner.trim())) return 'X';           // variable interpolation
      let body = inner;
      const c = inner.indexOf(':');
      if (c >= 0 && !/^\s*\w+\s*\(/.test(inner)) body = inner.slice(c + 1);
      else if (/^\s*(?:~|&|!)/.test(inner)) return '';
      const parts = body.split('|').map(x => x.trim());
      return parts.sort((a, b) => b.length - a.length)[0] || '';
    });
  } while (s !== prev);
  return s;
}

export function cleanInkText(raw) {
  let s = raw.replace(/(^|\s)\/\/.*$/, '$1');
  s = s.replace(/\s+#[A-Za-z_][\w]*(?::.*)?$/, '');                 // trailing tags
  while (/\s#[A-Za-z_]/.test(s)) s = s.replace(/\s+#[A-Za-z_].*$/, '');
  s = s.replace(/\s*->\s*\S+\s*$/, '').replace(/<>/g, '');
  s = stripBraces(s).replace(/\\/g, '');
  return s.replace(/\s+/g, ' ').trim();
}

const NONVERBAL = /^\[?\s*(?:say nothing|stay silent|silence|nod|shrug|wait|stand|walk|leave|stare|look|hold|keep|let|don'?t|do nothing|hand|give|take|put|step|turn|smile|sigh|pause|say nowt)/i;


// ---------- call writing in a text knot (call-in-text-thread) ----------
// Plan 4.4. Phrases that only make sense when the player is on a call. "ring <Name> back", "call me",
// "I'll ring" and choice text (the brackets) are not matched.
const CALL_IN_TEXT = [
  /\b(?:you|she|he)\s+picked up\b/i,
  /\bon (?:this|the|my|her|his) line\b/i,
  /\bget off (?:her|my|his) line\b/i,
  /\bhang(?:s|ing)? up\b/i,
  /\bthe line (?:drops|goes dead|is dead)\b/i,
  /\byour handset (?:rings|lights)\b/i,
  /\brings out\b/i,
  /\bcaller id\b/i,
];

export function callInTextHits(body) {
  const out = [];
  for (const re of CALL_IN_TEXT) {
    const m = body.match(re);
    if (m) out.push(m[0]);
  }
  return out;
}

// Knots marked `// lint: call-knot` directly under their heading (comment and blank lines may sit
// between the heading and the marker). `lines` is parseInkLines output.
export function callKnotSet(lines) {
  const set = new Set();
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].kind !== 'knot') continue;
    for (let j = i + 1; j < lines.length; j++) {
      const L = lines[j];
      if (L.kind === 'blank') continue;
      if (L.kind !== 'comment') break;
      if (/^\/\/\s*lint:\s*call-knot\b/i.test(L.t)) { set.add(lines[i].name); break; }
    }
  }
  return set;
}

// ---------- ink parser ----------
export function lintInk(text, { channel = 'person', names = [], file = '' } = {}) {
  const cap = channel === 'phone' ? CAPS.phone : CAPS.person;
  const lines = text.split(/\r?\n/);
  const findings = [];
  const lengths = [];
  const parsed = channel === 'phone' ? parseInkLines(text) : null;
  const callKnots = parsed ? callKnotSet(parsed) : null;
  const callInText = (i, body, speaker) => {
    if (!parsed || callKnots.has(parsed[i].knot) || PLAYER_LINE.test(speaker || '')) return;
    for (const hit of callInTextHits(body)) {
      findings.push({ level: 'warn', rule: 'call-in-text-thread', line: i + 1, match: hit, speaker, text: body,
        note: `"${hit}" reads as a call in a text thread: rewrite it as a text, or move it to a call knot and mark the knot \`// lint: call-knot\`` });
    }
  };
  let afterChoice = null; // { line, text }
  const SPEAKER = /^((?:Narrator|[A-Z][\w.'’()-]*(?: [\w.'’()-]+){0,3})):\s+(\S.*)$/;
  for (let i = 0; i < lines.length; i++) {
    const n = i + 1;
    const rawLine = lines[i];
    const line = rawLine.trim();
    if (!line || line.startsWith('//')) continue;
    if (/^(?:VAR|CONST|EXTERNAL|INCLUDE|LIST|=|~|->|<-|\{?\s*(?:not\s|else)|\}|\/\*)/.test(line) || /^-\s*else/.test(line)) { if (!/^->/.test(line)) { /* logic line keeps pending state */ } continue; }
    if (/^#/.test(line)) continue;                       // tag-only line
    if (/^\{[^}]*$/.test(line) || /^\{[^{}]*:\s*$/.test(line) || /^-\s+[^A-Z"'][^:]*:\s*$/.test(line)) continue; // multi-line condition opener or branch
    // choice
    const cm = line.match(/^(?:[*+]\s*)+(?:\(\w+\)\s*)?(.*)$/);
    if (cm) {
      let body = cm[1];
      body = body.replace(/^(?:\{[^{}]*\}\s*)+/, '');
      let label = '';
      const br = body.match(/^([^\[]*)\[([^\]]*)\](.*)$/);
      let shown;
      if (br) { label = br[2]; shown = (br[1] + ' ' + br[2] + ' ' + br[3]); } else shown = body;
      const outside = br ? (br[1] + ' ' + br[3]) : body;
      const clean = cleanInkText(shown);
      const cleanOutside = cleanInkText(outside);
      if (clean) {
        const w = countWords(clean);
        if (w > CAPS.choice) findings.push({ level: 'warn', rule: 'choice-len', line: n, words: w, text: clean });
        for (const h of tellHits(clean)) findings.push({ level: h.rule === 'us-spelling' || h.rule === 'cyber-security' ? 'warn' : 'warn', rule: h.rule, line: n, match: h.match, text: clean });
      }
      // a choice with text outside the brackets is voiced by the player; that text is a spoken line
      afterChoice = { line: n, text: clean, nonverbal: NONVERBAL.test(label || clean) && !cleanOutside };
      continue;
    }
    const gm = line.match(/^-\s+(?!>)(?:\(\w+\)\s*)?(.*)$/);
    const content = gm ? gm[1] : line;
    const sm = content.match(SPEAKER);
    if (sm) {
      const speaker = sm[1];
      const body = cleanInkText(sm[2]);
      if (afterChoice && /^(?:You|Player)$/.test(speaker)) {
        findings.push({ level: 'check', rule: 'you-after-choice', line: n, choiceLine: afterChoice.line,
          text: body, note: afterChoice.nonverbal ? 'choice looks non-verbal; allowed' : 'choice is verbal; fold the words into the choice' });
      }
      afterChoice = null;
      if (!body) continue;
      if (speaker !== 'Narrator') {
        const w = countWords(body);
        lengths.push(w);
        if (w > cap) findings.push({ level: 'error', rule: 'line-len', line: n, words: w, cap, speaker, text: body });
      }
      for (const h of tellHits(body)) findings.push({ level: 'warn', rule: h.rule, line: n, match: h.match, speaker, text: body });
      callInText(i, body, speaker);
      continue;
    }
    // other prose (narration without prefix etc.): check tells only, no spoken-line pending reset for logic
    const body = cleanInkText(content);
    if (body && /[A-Za-z]/.test(body) && !/^[=~]/.test(body)) {
      afterChoice = null;
      // Phone inks drop the contact's own "Name:" prefix (PASS4_BRIEF), so an unprefixed prose line
      // there is the contact's spoken line: measure it. Person-chat unprefixed lines stay narration.
      if (channel === 'phone') {
        const w = countWords(body);
        lengths.push(w);
        if (w > cap) findings.push({ level: 'error', rule: 'line-len', line: n, words: w, cap, speaker: 'contact', text: body });
      }
      for (const h of tellHits(body)) findings.push({ level: 'warn', rule: h.rule, line: n, match: h.match, text: body });
      callInText(i, body, null);
    }
  }
  findings.push(...structureFindings(text, { channel, names }));
  const vv = voicedVariableFindings(text, { channel, file });
  findings.push(...vv.filter(f => f.level !== 'allowed'));
  const allowed = vv.filter(f => f.level === 'allowed');
  return { findings, allowed, lengths, stats: stats(lengths) };
}

// ---------- structural rules (pass-4 recurring bugs) ----------
// Each rule here is a bug class that turned up in more than one mission's pass-4 review or playtest.
// See README_ink_best_practices.md "Common ink bugs" for the rule and a worked example of each.
//
//   choice-fallthrough  (check) choices inside a {cond: ...} block, followed by more text or a divert.
//                       Ink doesn't stop at choices: it runs on, prints the next content and merges its
//                       choices too (m06 Dani: first meeting fell into "Hi again" + the hub).
//   blank-reentry       (check, person-chat) #exit_conversation parks the story in a knot that prints
//                       nothing before its choices. A re-talk re-enters that knot (person-chat-minigame.js
//                       re-navigates to the knot, not the stitch, of the first saved choice), so the
//                       player gets the buttons with no fresh line (m03 receptionist/Victoria, m04 Vance,
//                       m08 Netherton). The engine may fall back to re-showing the last line; a re-entry
//                       line still gives better context.
//   tag-on-narrator     (check) an influence tag on its own line just before a divert attaches to the
//                       first line of the target knot; when that's a Narrator line, the "+ Influence"
//                       popup lands on narration (m06 Irina evidence scene).
//   phone-self-prefix   (warn, phone) the contact's own "Name:" prefix in a phone ink (m03, m04, m08).
//   exit-no-reply       (warn, person-chat) a spoken choice that goes straight to #exit_conversation or
//                       -> END/DONE: the player's words show as their own bubble, waiting for a click,
//                       and the chat closes with no answer (m03 receptionist, m06 Priya, m08 Off-Duty
//                       Agent and Netherton).
//   stage-cue-in-info   (check) an *asterisk cue* on a line that carries a number (m07 Park, Mercer).
//   stage-cue-density   (warn) more asterisk cues per spoken line than m01 uses (about 1 in 37).
//   inline-direction    (warn, person-chat) an *asterisk cue* in a voiced line. Voiced lines hold only
//                       spoken words (user, 2026-11-10): a performance note goes in the line's
//                       #delivery: tag, which the voice reads and the player never sees. Skips the
//                       player's lines, narration, choices, and emphasis between two words ("I *never*
//                       said"). Phone inks are checked only in knots marked `// lint: call-knot`.
//   delivery-unread     (warn, person-chat) a #delivery: note the server cannot read for its line, so the
//                       line plays untagged: a note on (or directly above) a glued line (<>) or a line
//                       that prints a variable or expression, or a note on its own line with no spoken
//                       line after it in the same knot (it is followed by a choice, the knot's end, or a
//                       divert to END/DONE or to a knot that starts with a choice).
//   delivery-note       (warn) a #delivery: note the voice will not get as written: over 200 characters
//                       (TtsService::MAX_DELIVERY_LENGTH, dropped), with no ASCII letter or digit
//                       ("...", dropped), or with {braces} (the server cannot read
//                       what they print, so the line plays untagged). Also a tag whose name is
//                       printed (`#{t}`): it may be a #delivery: tag, so the server drops every
//                       note before it on the line. Also a tag inside an inline conditional or sequence
//                       (`{cond: text #delivery: note}`): the server's walker skips that line.
//   call-in-text-thread (warn, phone) a text knot written as a call: "she picked up", "on the line",
//                       "hangs up", "the line goes dead", "rings out", "caller ID" (phone-calls plan 4.4).
//                       A call knot carries `// lint: call-knot` directly under its `=== knot ===` line;
//                       that suppresses this rule there and turns the #delivery: target checks on for it.
//   crowded-hub         (check) a knot whose choice block offers more than 10 choices at once (sticky,
//                       once-only and conditional all count). Passes when every conditional choice is
//                       retired by a "not ..." guard and the unconditional ones sit last, which is how
//                       m01's handler hub (m01_phone_agent0x99.ink, knot support_hub) keeps 15 declared
//                       choices to a handful on screen.
const NUMBER_WORD = /\b(?:\d[\d,.:]*|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion)\b/i;
// Choices that are actions rather than words (a fight, a cutscene "Continue", a "(He's gone.)"
// description): no reply expected. A body that turns the NPC #hostile is skipped too.
const ACTION_CHOICE = /^(?:\(|\s*(?:attack|tackle|brace|continue|back off|move on|run|fight|punch|grab|hit|knock|close|hang up|listen|end|go\b|get out|slip|sneak|walk away|\.\.\.))/i;
const HUB_MAX = 10;
const CUE_RE = /\*[^*\s][^*]{0,60}\*/g;
// Words that are stage business when they stand alone between asterisks (*sighs*, *pause*).
const STAGE_VERB = /^(?:sigh|laugh|pause|nod|shrug|cough|exhale|inhale|smile|grin|wink|chuckle|snort|groan|gasp|sniff|frown|scoff|smirk|yawn|whistle|mutter|whisper|wince|blink|glance|cry|sob|giggle|shudder|gulp|swallow|hesitate|beat|beep|grunt|huff|tut|clap|squint)(?:s|es|ed|d|ing)?$/i;
// Emphasis or a stage direction? A single-word cue is emphasis ("I *never* said", "It was *yours*.",
// "That was *really* Bad.") when it follows a word, a digit or a comma, or when it opens the spoken
// text capitalised ("*Never* again."), and a letter, digit, space or punctuation follows it; unless
// the word is stage business (*sighs*, *pause*). A lower-case cue that opens the text
// ("*quietly* Keep your head down") and any cue of more than one word are directions.
// `start` is where the spoken words begin (after any "Name: " prefix).
function isEmphasis(line, index, cue, start = 0) {
  const word = cue.slice(1, -1).trim();
  if (/\s/.test(word) || STAGE_VERB.test(word.replace(/[^A-Za-z]/g, ''))) return false;
  const lead = line.slice(start, index);
  const opens = !lead.trim();
  const before = lead.replace(/ $/, '').slice(-1);
  const after = line.slice(index + cue.length).slice(0, 1);
  const okAfter = after === '' || /[A-Za-z0-9\s.,!?;:'’"”)…-]/.test(after);
  if (opens) return /^[A-Z]/.test(word) && okAfter;
  return /[A-Za-z0-9,]/.test(before) && okAfter;
}
const PLAYER_LINE = /^(?:You|Player)$/i;
const PLAYER_TAG = /#\s*(?:speaker\s*:\s*player|player)\b/i;

function braceDelta(s) {
  const t = s.replace(/(^|\s)\/\/.*$/, '');
  let d = 0;
  for (const c of t) { if (c === '{') d++; else if (c === '}') d--; }
  return d;
}

// Classify every source line once; knots/stitches give each line its container.
export function parseInkLines(text) {
  const raw = text.split(/\r?\n/);
  const out = [];
  let inBlockComment = false;
  let knot = null;
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i];
    let t = r.trim();
    const L = { n: i + 1, raw: r, t, indent: r.length - r.trimStart().length, knot };
    if (inBlockComment) { L.kind = 'comment'; if (t.includes('*/')) inBlockComment = false; out.push(L); continue; }
    if (t.startsWith('/*')) { L.kind = 'comment'; if (!t.includes('*/')) inBlockComment = true; out.push(L); continue; }
    if (!t) L.kind = 'blank';
    else if (t.startsWith('//')) L.kind = 'comment';
    else if (/^={2,}\s*(?:function\s+)?\w+/.test(t)) { knot = t.match(/^={2,}\s*(?:function\s+)?(\w+)/)[1]; L.kind = 'knot'; L.knot = knot; L.name = knot; }
    else if (/^=\s*\w+/.test(t)) { L.kind = 'stitch'; L.name = t.match(/^=\s*(\w+)/)[1]; }
    else if (/^(?:VAR|CONST|EXTERNAL|INCLUDE|LIST)\b/.test(t)) L.kind = 'decl';
    else if (t.startsWith('~')) L.kind = 'logic';
    else if (t.startsWith('#')) L.kind = 'tag';
    else if (/^[*+]/.test(t)) L.kind = 'choice';
    else if (t.startsWith('<-')) L.kind = 'thread';
    else if (t.startsWith('->')) L.kind = 'divert';
    else if (/^-(?!>)/.test(t)) L.kind = /:\s*$/.test(t) || /^-\s*else\s*:/.test(t) ? 'branch' : 'gather';
    else L.kind = 'text';
    L.delta = ['comment', 'blank', 'decl'].includes(L.kind) ? 0 : braceDelta(t);
    if (L.kind === 'text' && L.delta > 0) L.kind = 'open';
    else if (L.kind === 'text' && L.delta < 0 && /^\}/.test(t)) L.kind = 'close';
    // a one-line text that is only a conditional divert, e.g. {x: -> hub}
    if (L.kind === 'text' && L.delta === 0 && /^\{/.test(t) && /->/.test(t) && !cleanInkText(t)) L.kind = 'conddivert';
    // (a knot may take arguments: `-> knot(1)`, `-> knot(1) ->`)
    const dm = t.match(/->\s*([\w.]+)\s*(?:\([^()]*\))?\s*$/);
    if (dm) L.divert = dm[1];
    // a tunnel call, `-> knot ->` (or `-> knot -> onward`): flow enters knot first
    const tm = t.match(/^->\s*([\w.]+)\s*(?:\([^()]*\))?\s*->/);
    if (L.kind === 'divert' && tm) L.tunnel = tm[1];
    // a tunnel's return, `->->`
    if (L.kind === 'divert' && /^->\s*->/.test(t)) L.tunnelReturn = true;
    if (L.kind === 'thread') { const th = t.match(/^<-\s*([\w.]+)/); if (th) L.thread = th[1]; }
    L.exit = /#\s*exit_conversation\b/.test(t);
    if (L.kind === 'text') {
      const body = cleanInkText(t);
      L.printable = !!body && /[A-Za-z0-9]/.test(body);
      const sm = t.match(/^((?:Narrator|[A-Z][\w.'’()]*(?: [\w.'’()]+){0,3})):\s+\S/);
      L.speaker = sm ? sm[1] : null;
      L.body = body;
    }
    out.push(L);
  }
  return out;
}

function knotIndex(lines) {
  const idx = {};
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].kind === 'knot') { if (cur) cur.end = i; cur = { name: lines[i].name, start: i, end: lines.length }; idx[cur.name] = cur; }
    else if (lines[i].kind === 'stitch' && cur) idx[`${cur.name}.${lines[i].name}`] = { name: `${cur.name}.${lines[i].name}`, start: i, end: cur.end, stitch: true };
  }
  if (cur) cur.end = lines.length;
  // stitch ranges end at the next stitch or the knot end
  for (const k of Object.values(idx)) if (k.stitch) {
    for (let j = k.start + 1; j < lines.length && j < k.end; j++) if (lines[j].kind === 'stitch' || lines[j].kind === 'knot') { k.end = j; break; }
  }
  return idx;
}

function resolveKnot(idx, target, fromKnot) {
  if (!target || /^(?:DONE|END)$/.test(target)) return null;
  return idx[target] || (fromKnot && idx[`${fromKnot}.${target}`]) || null;
}

// First line a knot prints before it offers choices, following top-level diverts and tunnels,
// and a knot with only stitches into its first stitch (ink diverts there).
// Returns { line } for a printed line, { none: 'choices' } if choices come first,
// { none: 'conditional' } if a multi-line conditional or a conditional divert comes first
// (the server cannot follow a note into one), { none: 'return' } for a tunnel that returns
// first, { none: 'thread' } for a thread, or null if unknown. `met` collects the #delivery:
// tag lines passed on the way.
function firstPrint(lines, idx, name, fromKnot, depth = 0, met = []) {
  const k = resolveKnot(idx, name, fromKnot);
  if (!k || depth > 3) return null;
  let d = 0, content = false;
  for (let j = k.start + 1; j < k.end; j++) {
    const L = lines[j];
    if (L.kind === 'stitch' && !k.stitch && !content) return firstPrint(lines, idx, `${k.name}.${L.name}`, null, depth + 1, met);
    if (L.kind === 'knot' || (L.kind === 'stitch' && !k.stitch)) break;
    // (a tag line is content: ink diverts to the first stitch only when the knot has none)
    if (!['blank', 'comment'].includes(L.kind)) content = true;
    if (L.kind === 'tag' && deliveryNotes(L.t).length) met.push(L);
    if (L.kind === 'choice') return { none: 'choices', line: L };
    if (d === 0 && L.kind === 'thread') return { none: 'thread', line: L };
    if (d === 0 && L.tunnelReturn) return { none: 'return', line: L };
    if (d === 0 && (L.kind === 'open' || L.kind === 'conddivert' || (L.kind === 'text' && /^\{/.test(L.t) && /->/.test(L.t)))) {
      return { none: 'conditional', line: L };
    }
    if (L.kind === 'text' && L.printable) return { line: L };
    if (L.kind === 'divert' && d === 0) {
      if (/^(?:DONE|END)$/.test(L.divert || '')) return { none: 'end', line: L };
      return firstPrint(lines, idx, L.tunnel || L.divert, k.name.split('.')[0], depth + 1, met);
    }
    d += L.delta || 0;
  }
  return { none: 'empty' };
}

// Lines that belong to a choice's body: until the next choice/gather at the same or a shallower
// indent, a knot/stitch header, or a block close that ends the enclosing block.
function choiceBody(lines, i) {
  const c = lines[i];
  const body = [];
  let d = 0;
  for (let j = i + 1; j < lines.length; j++) {
    const L = lines[j];
    if (L.kind === 'knot' || L.kind === 'stitch') break;
    if ((L.kind === 'choice' || L.kind === 'gather' || L.kind === 'branch') && d <= 0 && L.indent <= c.indent) break;
    if (L.kind === 'close' && d <= 0) break;
    d += L.delta || 0;
    body.push(L);
  }
  return body;
}


export function structureFindings(text, { channel = 'person', names = [] } = {}) {
  const lines = parseInkLines(text);
  const idx = knotIndex(lines);
  const F = [];
  const sig = L => !['blank', 'comment', 'logic', 'tag', 'decl'].includes(L.kind);

  // choice-fallthrough
  {
    let d = 0, start = null, hadChoice = false, assigned = new Set();
    // A later conditional block counts only if its condition reads a variable this block assigned
    // (m06 Dani: {first_meeting: ~ first_meeting = false ...} then {not first_meeting: ...}).
    // Otherwise sibling blocks are taken to be mutually exclusive by design (m01 debrief score bands).
    const condVars = t => { const c = t.match(/^\{([^:{}]*):/); return c ? (c[1].match(/[A-Za-z_]\w*/g) || []).filter(w => !/^(?:not|and|or|true|false)$/.test(w)) : null; };
    const dependsOnBlock = t => { const v = condVars(t); return v === null || v.some(x => assigned.has(x)); };
    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      if (L.kind === 'knot' || L.kind === 'stitch') { d = 0; start = null; hadChoice = false; continue; }
      const before = d;
      d = Math.max(0, d + (L.delta || 0));
      if (before === 0 && d > 0) { start = L; hadChoice = false; assigned = new Set(); continue; }
      if (before > 0 && L.kind === 'choice') hadChoice = true;
      if (before > 0 && L.kind === 'logic') { const a = L.t.match(/^~\s*(\w+)\s*(?:=|\+\+|--|\+=|-=)/); if (a) assigned.add(a[1]); }
      if (before > 0 && d === 0 && start && hadChoice) {
        // what does ink run into after the block closes?
        let culprit = null;
        for (let j = i + 1; j < lines.length; j++) {
          const N = lines[j];
          if (!sig(N)) continue;
          if (['knot', 'stitch', 'choice', 'gather', 'thread'].includes(N.kind)) break;
          if (N.kind === 'divert') { if (!/^(?:DONE|END)$/.test(N.divert || '')) culprit = N; break; }
          if (N.kind === 'text' && !N.printable) continue;
          if (N.kind === 'text' || N.kind === 'conddivert') { if (N.kind === 'text' || dependsOnBlock(N.t)) culprit = N; break; }
          if (N.kind === 'open') {
            if (!dependsOnBlock(N.t)) break;
            // a following block: fine if it only holds choices (a conditional choice group)
            let dd = 0, inChoice = false, prints = null, end = j;
            for (let k = j; k < lines.length; k++) {
              const M = lines[k];
              const b = dd;
              dd += M.delta || 0;
              if (k > j && M.kind === 'branch') inChoice = false;
              if (M.kind === 'choice') inChoice = true;
              else if (!inChoice && k > j && ((M.kind === 'text' && M.printable) || M.kind === 'conddivert' ||
                (M.kind === 'divert' && !/^(?:DONE|END)$/.test(M.divert || '')))) { prints = prints || M; }
              if (k === j && /\S:\s*\S/.test(M.t.replace(/^\{[^:]*:/, 'x:')) && cleanInkText(M.t)) prints = prints || M; // "{cond: text" on the opener line
              if (b > 0 && dd <= 0) { end = k; break; }
            }
            if (prints) { culprit = prints; break; }
            j = end;
            continue;
          }
          break;
        }
        if (culprit) {
          F.push({ level: 'check', rule: 'choice-fallthrough', line: start.n, text: culprit.body || culprit.t,
            note: `choices in the {…} block at L${start.n} don't end the flow: ink runs on to L${culprit.n} and shows it before the choices, merging both sets. Divert out of the block, or use "- else:" inside it.` });
        }
        start = null; hadChoice = false;
      }
    }
  }

  // blank-reentry (person-chat only) and exit-no-reply
  if (channel !== 'phone') {
    const parked = new Map();
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].exit) continue;
      for (let j = i; j < Math.min(lines.length, i + 12); j++) {
        const N = lines[j];
        if (j > i && ['knot', 'stitch', 'choice', 'gather'].includes(N.kind)) break;
        if (N.divert && (N.kind === 'divert' || j === i)) {
          if (!/^(?:DONE|END)$/.test(N.divert)) {
            const fromKnot = (lines[i].knot || '');
            const k = resolveKnot(idx, N.divert, fromKnot);
            // The engine re-navigates to the KNOT of the first saved choice (sourcePath.split('.')[0]),
            // so a park inside a stitch reopens at the top of its knot (m06 checkpoint guard -> start).
            const knotName = k && k.name.split('.')[0];
            if (knotName && !parked.has(knotName)) parked.set(knotName, { exitLine: lines[i].n, fromKnot });
          }
          break;
        }
      }
    }
    for (const [name, { exitLine, fromKnot }] of parked) {
      const fp = firstPrint(lines, idx, name, fromKnot);
      if (fp && fp.none === 'choices') {
        F.push({ level: 'check', rule: 'blank-reentry', line: exitLine, text: `-> ${name}`,
          note: `the chat parks at "${name}" and a re-talk re-enters it, but it prints nothing before its choices. Add a re-entry line for better context, skipped once after a goodbye (m03 receptionist "hub_quiet").` });
      }
    }
  }
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (L.kind !== 'choice') continue;
    const m = L.t.match(/^(?:[*+]\s*)+(?:\(\w+\)\s*)?(?:\{[^{}]*\}\s*)*(.*)$/);
    const shown = cleanInkText((m ? m[1] : '').replace(/[[\]]/g, ' '));
    const body = choiceBody(lines, i);
    const all = [L, ...body];
    // an exit is #exit_conversation, or the body running into -> END / -> DONE
    const exitAt = all.findIndex(x => x.exit || (x.kind === 'divert' && /^(?:DONE|END)$/.test(x.divert || '')) || (x === L && /->\s*(?:DONE|END)\s*$/.test(x.t)));
    const printed = body.filter(x => x.kind === 'text' && x.printable);
    // (a divert before the exit leaves the body first, so the exit isn't reached from here)
    if (channel !== 'phone' && exitAt >= 0 && printed.length === 0 && shown && !NONVERBAL.test(shown) && !ACTION_CHOICE.test(shown) &&
        !all.slice(0, exitAt).some(x => x.divert && x.kind === 'divert') && !all.some(x => /#\s*hostile\b/.test(x.t))) {
      F.push({ level: 'warn', rule: 'exit-no-reply', line: L.n, text: shown,
        note: 'the player\'s words show as their own bubble and the chat closes with no answer; give the NPC a one-line reply before the exit' });
    }
  }

  // tag-on-narrator: an influence tag on its own line, then a divert
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (L.kind !== 'tag' || !/#\s*influence_(?:increased|decreased)\b/.test(L.t)) continue;
    let N = null;
    for (let j = i + 1; j < lines.length; j++) { if (sig(lines[j])) { N = lines[j]; break; } }
    if (!N || N.kind !== 'divert' || /^(?:DONE|END)$/.test(N.divert || '')) continue;
    const fp = firstPrint(lines, idx, N.divert, L.knot);
    if (!fp) continue;
    if (fp.line && fp.line.kind === 'text' && fp.line.speaker === 'Narrator') {
      F.push({ level: 'check', rule: 'tag-on-narrator', line: L.n, text: fp.line.body,
        note: `the popup attaches to the first line of "${N.divert}" (L${fp.line.n}), a Narrator line; put the tag above a line the NPC speaks` });
    }
  }

  // phone-self-prefix
  if (channel === 'phone' && names.length) {
    const own = new Set(names.filter(Boolean).map(s => s.toLowerCase()));
    for (const L of lines) {
      if (L.kind !== 'text' || !L.speaker) continue;
      if (own.has(L.speaker.toLowerCase())) {
        F.push({ level: 'warn', rule: 'phone-self-prefix', line: L.n, text: L.body,
          note: `drop "${L.speaker}:" — a phone contact's own lines take no prefix (PASS4_BRIEF; m01's phone ink has none)` });
      }
    }
  }

  // ending-check-after-bracket: `#ending_check` after a choice's bracket belongs to what follows
  // the choice, so ink has already moved on when the popup asks. "Keep going" only skips the
  // rest of that line's tags: with no other tag there to skip and a divert into more dialogue,
  // the debrief carries on whatever the player answers (lab_physical_pentest, user feedback
  // 2026-11-10). Inside the brackets the chat asks before the choice is taken.
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (L.kind !== 'choice') continue;
    const close = L.t.lastIndexOf(']');
    if (close < 0) continue;
    const after = L.t.slice(close + 1).replace(/(^|\s)\/\/.*$/, '');
    if (!/#\s*ending_check\b/.test(after)) continue;
    const body = choiceBody(lines, i);
    // tags on the choice line after the bracket, and tag-only lines straight after it, are one tag set
    const tags = [...after.matchAll(/#\s*([^#]+)/g)].map(m => m[1].replace(/->.*$/, '').trim());
    for (const B of body) { if (B.kind === 'tag') tags.push(...[...B.t.matchAll(/#\s*([^#]+)/g)].map(m => m[1].trim())); else if (B.kind !== 'comment' && B.kind !== 'blank') break; }
    if (tags.some(t => !/^ending_check\b/.test(t))) continue;
    const onward = (L.divert && !/^(?:DONE|END)$/.test(L.divert)) ||
      body.some(B => (B.kind === 'divert' && B.divert && !/^(?:DONE|END)$/.test(B.divert)) || (B.kind === 'text' && B.printable));
    if (!onward) continue;
    F.push({ level: 'check', rule: 'ending-check-after-bracket', line: L.n, text: cleanInkText(L.t),
      note: 'Keep going cannot stop this debrief; put the tag inside the choice\'s brackets.' });
  }

  // emote-as-choice: a line starting "*word" is parsed by ink as a choice, not an emote
  // (seen in m02 after phone prefixes were stripped from lines like "Ghost: *leans in* ...")
  for (const L of lines) {
    const raw = (L.t || '').trimStart();
    if (/^\*[A-Za-z]/.test(raw)) {
      F.push({ level: 'error', rule: 'emote-as-choice', line: L.n, text: raw,
        note: 'a line starting with "*" is a choice in ink; move the stage cue mid-line or put a speaker/text before it' });
    }
  }

  // crowded-hub: more than HUB_MAX choices in one knot's choice block
  {
    const ranges = Object.values(idx).filter(k => !k.stitch).map(k => {
      // a knot's own block stops where its first stitch starts; each stitch is its own block
      let end = k.end;
      for (let j = k.start + 1; j < k.end; j++) if (lines[j].kind === 'stitch') { end = j; break; }
      return { name: k.name, start: k.start, end };
    });
    for (const k of Object.values(idx)) if (k.stitch) ranges.push({ name: k.name, start: k.start, end: k.end });
    for (const r of ranges) {
      const cs = [];
      for (let j = r.start + 1; j < r.end; j++) {
        const L = lines[j];
        if (L.kind !== 'choice') continue;
        const marks = L.t.match(/^((?:[*+]\s*)+)/)[1].replace(/\s/g, '').length;
        const rest = L.t.replace(/^(?:[*+]\s*)+(?:\(\w+\)\s*)?/, '');
        if (/^->/.test(rest)) continue;                       // invisible fallback choice
        const cond = (rest.match(/^(?:\{[^{}]*\}\s*)+/) || [''])[0];
        cs.push({ n: L.n, marks, cond, text: cleanInkText(rest.replace(/^(?:\{[^{}]*\}\s*)+/, '').replace(/[[\]]/g, ' ')) });
      }
      if (cs.length <= HUB_MAX) continue;
      const top = Math.min(...cs.map(c => c.marks));
      // split into blocks at gathers and branches that sit between top-level choices
      const breaks = [];
      for (let j = r.start + 1; j < r.end; j++) if ((lines[j].kind === 'gather' || lines[j].kind === 'branch') && (lines[j].delta || 0) <= 0) breaks.push(lines[j].n);
      const blocks = [];
      let cur = [];
      let bi = 0;
      for (const c of cs.filter(x => x.marks === top)) {
        while (bi < breaks.length && breaks[bi] < c.n) { if (cur.length) blocks.push(cur); cur = []; bi++; }
        cur.push(c);
      }
      if (cur.length) blocks.push(cur);
      for (const b of blocks) {
        if (b.length <= HUB_MAX) continue;
        const conditional = b.filter(c => c.cond);
        const retired = conditional.filter(c => /\bnot\b|!/.test(c.cond)).length >= 0.75 * conditional.length; // most topics retire once used
        const lastCond = b.map(c => !!c.cond).lastIndexOf(true);
        const fixedLast = b.slice(lastCond + 1).every(c => !c.cond) && b.slice(0, lastCond + 1).every(c => !!c.cond);
        if (conditional.length >= b.length - 3 && retired && fixedLast) continue; // the m01 support_hub pattern
        F.push({ level: 'check', rule: 'crowded-hub', line: b[0].n, text: b[0].text || r.name, count: b.length,
          note: `knot "${r.name}" can offer ${b.length} choices at once (more than ${HUB_MAX}; ${conditional.length} conditional). ` +
            'Fix: order by relevance — topics that arrive later in the mission go first in the ink, so the newest, most relevant choices sit at the top ' +
            '(see m01\'s handler hub, m01_phone_agent0x99.ink, knot support_hub); retire spent topics.' });
      }
    }
  }

  // stage cues: inside key information, and density per file
  let cues = 0, spoken = 0;
  for (const L of lines) {
    if (L.kind !== 'text' || !L.printable) continue;
    if (L.speaker === 'Narrator') continue;
    spoken++;
    const code = L.t.replace(/(^|\s)\/\/.*$/, '');
    const found = code.match(CUE_RE) || [];
    if (!found.length) continue;
    cues += found.length;
    if (channel !== 'phone' && !PLAYER_LINE.test(L.speaker || '') && !PLAYER_TAG.test(code)) {
      const said = code.replace(/(?<!\\)#.*$/, '');
      const start = L.speaker ? (said.match(/^[^:]*:\s*/) || [''])[0].length : 0;
      const direction = [...said.matchAll(CUE_RE)].find(m => !isEmphasis(said, m.index, m[0], start));
      if (direction) {
        F.push({ level: 'warn', rule: 'inline-direction', line: L.n, text: L.body,
          note: `voiced lines hold only spoken words: move ${direction[0]} to a tag on the line (#delivery: ${direction[0].slice(1, -1).trim()}) if it tells the voice how to speak, else cut it` });
      }
    }
    // The speaker prefix ("Agent 0x47 'Nightshade':") and agent handles in the text ("Agent 0x00") are names,
    // not figures. The prefix regex above misses a quoted codename, so strip it here too.
    const rest = L.body.replace(CUE_RE, ' ')
      .replace(/^[A-Z][\w.'’()-]*(?: [\w.'’()-]+){0,3}(?: ['‘"“][^'’"”:]{1,30}['’"”])?:\s+/, '')
      .replace(/\bAgent 0x[0-9a-f]+\b/gi, ' ');
    // a digit, or two or more number words ("Two hundred and forty"); "no one", "two kids" pass
    const numWords = (rest.match(new RegExp(NUMBER_WORD.source, 'gi')) || []).filter(w => !/^one$/i.test(w));
    if (/\d/.test(rest) || numWords.length >= 2) {
      F.push({ level: 'check', rule: 'stage-cue-in-info', line: L.n, text: L.body,
        note: `${found[0]} sits on a line that carries a number; cues show on screen as written, so keep them off key information` });
    }
  }
  if (cues >= 5 && cues / Math.max(1, spoken) > 1 / 15) {
    F.push({ level: 'warn', rule: 'stage-cue-density', line: 1, text: `${cues} cues in ${spoken} spoken lines`,
      note: 'm01 uses about one asterisk cue per 37 spoken lines; cut the ones the words already carry' });
  }
  F.push(...deliveryFindings(lines, idx, channel));
  return F;
}

// ---------- #delivery: notes (delivery-unread, delivery-note) ----------
// TtsService::MAX_DELIVERY_LENGTH and tts-delivery.js MAX_DELIVERY_LENGTH
export const MAX_DELIVERY_LENGTH = 200;
const DELIVERY_IN_LINE = /(?<!\\)#\s*delivery\s*:([^#]*)/gi;

// A tag whose name is printed (`#{t}`, t = "delivery: shout"): inkjs may send it as a note.
const PRINTED_TAG = /(?<!\\)#\s*\{/;

// A tag inside an inline conditional or sequence, `{flag: text #delivery: note}`. inklecate opens the
// tag in the branch and closes it after the braces; inkjs reads it, but the server's walker cannot
// (it skips the line, logged), so the line is voiced untagged and its co-speaker request is refused.
const TAG_IN_BRACES = /\{[^{}]*(?<!\\)#[^{}]*\}/;

function deliveryNotes(code) {
  return [...code.matchAll(DELIVERY_IN_LINE)].map(m => m[1].replace(/(^|\s)\/\/.*$/, '').replace(/\s+/g, ' ').trim());
}

// Why the walker cannot read a note on this text line, or null.
function unreadReason(lines, i) {
  const L = lines[i];
  const code = L.t.replace(/(^|\s)\/\/.*$/, '');
  if (code.includes('<>')) return 'is glued (<>) to the line after it';
  for (let j = i - 1; j >= 0; j--) {
    const P = lines[j];
    if (P.kind === 'blank' || P.kind === 'comment' || P.kind === 'tag') continue;
    if (P.t.replace(/(^|\s)\/\/.*$/, '').replace(/(?<!\\)#.*$/, '').trimEnd().endsWith('<>')) return 'has the line above glued onto it (<>)';
    break;
  }
  const said = code.replace(/(?<!\\)#.*$/, '');
  const consts = new Set(lines.filter(x => x.kind === 'decl' && /^CONST\s/.test(x.t)).map(x => x.t.split(/\s+/)[1]));
  const printed = printedExpressions(said, consts);
  if (printed.length) return `prints {${printed[0]}}`;
  return null;
}

// A one-line conditional with no else, `{flag: Kevin Park: Hello.}`: it may print nothing, and
// then the note goes on to the next line.
const MAY_PRINT_NOTHING = /^\{[^{}|]*:[^{}|]*\}\s*(?:#.*)?$/;
// A line opening with a conditional that holds another {...} (`{f: {"x"}|...}`): the server
// cannot read it, and drops the note.
const NESTED_CONDITIONAL = /^\{[^{}]*:[^}]*\{/;

// The divert, tunnel or thread met after line j before any other line ({ shown, n }), or null.
function crossing(lines, j) {
  for (let k = j + 1; k < lines.length; k++) {
    const L = lines[k];
    if (['blank', 'comment', 'tag', 'logic'].includes(L.kind)) continue;
    if (L.kind === 'thread' && L.thread) return { shown: `<- ${L.thread}`, n: L.n };
    if (L.kind === 'divert' && (L.tunnel || L.divert)) {
      return { shown: L.tunnel ? `-> ${L.tunnel} ->` : `-> ${L.divert}`, n: L.n };
    }
    return null;
  }
  return null;
}

// Where a carried note goes once it reaches spoken line j: { line } | { reason } | null.
function landOn(lines, idx, j, met, depth) {
  const L = lines[j];
  if (NESTED_CONDITIONAL.test(L.t)) return { reason: `the line it lands on (line ${L.n}) opens with a conditional the server cannot read` };
  if (!MAY_PRINT_NOTHING.test(L.t) || depth > 3) return { line: j };
  const next = noteTarget(lines, idx, j, met, depth + 1);
  const nothing = `the line it lands on (line ${L.n}) may print nothing (a conditional with no else), and then`;
  if (!next) return null;
  if (next.none) return { reason: `${nothing} no spoken line follows (${next.none})` };
  if (next.reason) return { reason: `${nothing} ${next.reason}` };
  // The server keeps such a line's note for the next line in the same knot only (review R4 m1)
  const jump = crossing(lines, j);
  if (jump) return { reason: `${nothing} the note is not followed across ${jump.shown} (line ${jump.n}) to the line after it` };
  const r = unreadReason(lines, next.line);
  if (r) return { reason: `${nothing} the line after it (line ${lines[next.line].n}) ${r}` };
  return { line: j };
}

// The spoken line an own-line #delivery: tag lands on, following plain diverts and tunnels as
// the client does: { line: index } | { none: why } | { reason: full reason } | null (unknown).
// `met` collects the other #delivery: tag lines passed on the way.
function noteTarget(lines, idx, i, met = [], depth = 0) {
  for (let j = i + 1; j < lines.length; j++) {
    const L = lines[j];
    if (L.kind === 'tag' && deliveryNotes(L.t).length) met.push(L);
    if (['blank', 'comment', 'tag', 'logic'].includes(L.kind)) continue;
    if (L.kind === 'knot' || L.kind === 'stitch') return { none: 'the knot ends' };
    if (L.kind === 'choice') return { none: 'a choice comes next' };
    if (L.kind === 'open') {
      return { reason: 'a multi-line conditional comes next, so a line inside it plays untagged (the server gives the note only to the line after the block)' };
    }
    if (L.kind === 'text') return L.printable ? landOn(lines, idx, j, met, depth) : null;
    if (L.tunnelReturn) {
      return { reason: `the tunnel returns (->->, line ${L.n}) before a spoken line, and the note is not kept for the line after it returns` };
    }
    if (L.kind === 'thread') {
      if (!L.thread) return null;
      const fp = firstPrint(lines, idx, L.thread, L.knot, 0, met);
      if (fp && fp.line && !fp.none) return landOn(lines, idx, lines.indexOf(fp.line), met, depth);
      return { reason: `<- ${L.thread} has no first line the server can find, and the note is not kept for the line after the thread` };
    }
    if (L.kind === 'divert') {
      if (/^(?:DONE|END)$/.test(L.divert || '') && !L.tunnel) return { none: `-> ${L.divert} comes next` };
      const name = L.tunnel || L.divert;
      const shown = L.tunnel ? `-> ${name} ->` : `-> ${name}`;
      const fp = firstPrint(lines, idx, name, L.knot, 0, met);
      if (fp && fp.line && !fp.none) return landOn(lines, idx, lines.indexOf(fp.line), met, depth);
      const into = fp && fp.none === 'choices' ? 'a choice' : fp && fp.none === 'end' ? 'the end of the story' : null;
      if (into && L.tunnel) return { reason: `${shown} leads to ${into}, and the note is not kept for the line after the tunnel returns` };
      if (into) return { none: `${shown} leads to ${into}` };
      if (fp && fp.none === 'conditional') {
        const what = fp.line.kind === 'open' ? 'a multi-line conditional' : 'a conditional divert';
        return { reason: `${shown} opens with ${what} (line ${fp.line.n}), which the server cannot follow a note into` };
      }
      if (fp && fp.none === 'return') {
        return { reason: `${shown} reaches a tunnel return (->->, line ${fp.line.n}) before a spoken line, and the note is not kept for the line after it returns` };
      }
      if (fp && fp.none === 'thread') {
        return { reason: `${shown} opens with a thread (line ${fp.line.n}), which the server cannot follow a note past` };
      }
      if (fp && fp.none) return { reason: `the server cannot follow ${shown} to a spoken line` };
      return null;
    }
    return null;
  }
  return { none: 'the story ends' };
}

function deliveryFindings(lines, idx, channel) {
  const F = [];
  const callKnots = callKnotSet(lines);
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (!['text', 'tag', 'open', 'close', 'gather', 'branch', 'choice'].includes(L.kind)) continue;
    const code = L.t.replace(/(^|\s)\/\/.*$/, '');
    if (PRINTED_TAG.test(code)) {
      // review R5 m1: the walker reads such a tag as a note it cannot match
      F.push({ level: 'warn', rule: 'delivery-note', line: L.n, text: cleanInkText(L.t) || L.t,
        note: 'a tag opens with {braces}, so its name is printed: it may be a #delivery: note the server cannot read, so the line plays untagged and any note before it is dropped; write the tag name out, or \\# for a # in the line' });
    }
    if (TAG_IN_BRACES.test(code) && !PRINTED_TAG.test(code)) {
      F.push({ level: 'warn', rule: 'delivery-note', line: L.n, text: cleanInkText(L.t) || L.t,
        note: 'a tag sits inside an inline conditional or sequence ({cond: text #tag}), which the server cannot read: the line is skipped and plays untagged. Put the tag after the closing brace, {cond: text} #tag, or use a multi-line block' });
    }
    const notes = deliveryNotes(code);
    if (!notes.length) continue;
    for (const note of notes) {
      const why = [...note].length > MAX_DELIVERY_LENGTH ? `is over ${MAX_DELIVERY_LENGTH} characters`
        : note.includes('{') || note.includes('}') ? 'has {braces}: the server cannot read what they print (the line plays untagged, and any note before it is dropped)'
        : !/[A-Za-z0-9]/.test(note) ? 'has no ASCII letter or digit'
        : null;
      if (why) F.push({ level: 'warn', rule: 'delivery-note', line: L.n, text: cleanInkText(L.t) || L.t,
        note: `the #delivery: note ${why}, so the voice does not get it as written; use a short note in plain words` });
    }
    // Voiced phone calls send notes since A1. The linter tells a call knot from a text knot by the
    // `// lint: call-knot` marker (plan 4.4): the target checks below run for call knots only.
    if (channel === 'phone' && !callKnots.has(L.knot)) continue;
    let target = null, reason = null;
    if (L.kind === 'text' && L.printable) {
      target = i;
      const jump = MAY_PRINT_NOTHING.test(code.trim()) && crossing(lines, i);
      if (jump) reason = `the line may print nothing (a conditional with no else), and then the note is not followed across ${jump.shown} (line ${jump.n}) to the line after it`;
    } else if (L.kind === 'tag') {
      const met = [];
      const t = noteTarget(lines, idx, i, met);
      if (t && t.none) reason = `no spoken line follows it in the same knot (${t.none})`;
      else if (t && t.reason) reason = t.reason;
      else if (t) target = t.line;
      // inkjs joins the notes on the way and the last one wins
      const later = met.find(x => x !== L) || (target !== null && deliveryNotes(lines[target].t.replace(/(^|\s)\/\/.*$/, '')).length ? lines[target] : null);
      if (!reason && later) {
        F.push({ level: 'warn', rule: 'delivery-unread', line: L.n, text: cleanInkText(L.t) || L.t,
          note: `this #delivery: note is replaced by another (line ${later.n}) before the spoken line, so that one plays instead; keep one note per line` });
        continue;
      }
    }
    if (target !== null) {
      const r = unreadReason(lines, target);
      if (r) reason = target === i ? `the line ${r}` : `the line it lands on (line ${lines[target].n}) ${r}`;
    }
    if (reason) F.push({ level: 'warn', rule: 'delivery-unread', line: L.n, text: cleanInkText(L.t) || L.t,
      note: `this #delivery: note is not read, so the line plays untagged: ${reason}. Put the note at the end of a plain spoken line` });
  }
  return F;
}

// ---------- voiced-variable (AGENTS.md standing rule, user 2026-10-04) ----------
// A voiced line that prints a variable or a function's value ({player_name()}, {count}) gives
// different text per player, so its TTS (cached on text + voice) can never be cached.
// Voiced lines: every person-chat text line except the player's own ("You:"/"Player:" or
// #speaker:player; choices are the player's too), and phone lines that start "voice:".
// Inline alternatives and conditionals that choose between fixed strings ({&a|b}, {c: a|b}) are
// fine; anything printed inside one of their branches is still checked.
// Allowed exceptions, keyed by ink file basename and the printed expression, with the reason:
export const VOICED_VARIABLE_ALLOW = [
  { file: 'm08_director_netherton.ink', expr: 'suite_code',
    reason: 'user-approved (2026-10-05): the suite code is per-game and must be heard; accepted as uncached' },
];

// Split s at top-level occurrences of `sep` (outside braces, parentheses and quotes).
function splitTop(s, sep) {
  const parts = [];
  let d = 0, q = false, cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\') { cur += c + (s[i + 1] ?? ''); i++; continue; }
    if (c === '"') q = !q;
    else if (!q && (c === '{' || c === '(')) d++;
    else if (!q && (c === '}' || c === ')')) d--;
    if (!q && d === 0 && c === sep) { parts.push(cur); cur = ''; continue; }
    cur += c;
  }
  parts.push(cur);
  return parts;
}

// Printed expressions in one line of ink text: each {expr} that isn't an alternative or a
// conditional, recursing into the branches of the ones that are. An unclosed "{cond:" opener
// (a multi-line conditional) is skipped up to its colon.
export function printedExpressions(text, consts = new Set()) {
  const out = [];
  const scan = s => {
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '\\') { i++; continue; }
      if (c !== '{') continue;
      let d = 0, q = false, end = -1;
      for (let j = i; j < s.length; j++) {
        const x = s[j];
        if (x === '\\') { j++; continue; }
        if (x === '"') q = !q;
        else if (!q && x === '{') d++;
        else if (!q && x === '}' && --d === 0) { end = j; break; }
      }
      if (end < 0) { const k = splitTop(s.slice(i + 1), ':'); if (k.length > 1) i += k[0].length + 1; continue; }
      inner(s.slice(i + 1, end));
      i = end;
    }
  };
  const inner = body => {
    const t = body.trim();
    if (!t) return;
    if (/^[&~!]/.test(t)) { splitTop(t.slice(1), '|').forEach(scan); return; }   // cycle / shuffle / once-only
    const colon = splitTop(t, ':');
    if (colon.length > 1) { splitTop(colon.slice(1).join(':'), '|').forEach(scan); return; } // conditional
    const alts = splitTop(t, '|');
    if (alts.length > 1) { alts.forEach(scan); return; }                         // sequence
    if (/^"(?:[^"\\]|\\.)*"$/.test(t)) return;                                   // a string literal
    if (/^\w+$/.test(t) && consts.has(t)) return;                                 // a CONST is fixed text
    if (!/[A-Za-z_]/.test(t)) return;                                             // a bare number
    out.push(t);
  };
  scan(text);
  return out;
}

export function voicedVariableFindings(text, { channel = 'person', file = '' } = {}) {
  const F = [];
  const consts = new Set([...text.matchAll(/^\s*CONST\s+(\w+)/gm)].map(m => m[1]));
  const allow = VOICED_VARIABLE_ALLOW.filter(a => a.file === basename(file || ''));
  for (const L of parseInkLines(text)) {
    if (!['text', 'open', 'close', 'gather', 'branch'].includes(L.kind)) continue;
    let s = L.t.replace(/(^|\s)\/\/.*$/, '$1');
    s = s.replace(/\s+#[A-Za-z_].*$/, '');                                          // trailing tags
    if (/#\s*speaker\s*:\s*player\b/i.test(L.t)) continue;
    s = s.replace(/^-\s*(?:\(\w+\)\s*)?/, '').replace(/^\}\s*/, '');                  // gather / block close
    if (L.kind === 'branch' || /^(?:else\s*)?:/.test(s)) s = s.replace(/^[^:]*:/, ''); // "- cond:" branch head
    s = s.trim();
    const sm = s.match(/^((?:Narrator|[A-Z][\w.'’()]*(?: [\w.'’()]+){0,3})):\s+(.*)$/);
    const speaker = sm ? sm[1] : null;
    let body = sm ? sm[2] : s;
    if (speaker && /^(?:You|Player)$/i.test(speaker)) continue;
    if (channel === 'phone') {
      if (!/^voice:/i.test(body)) continue;
      body = body.replace(/^voice:\s*/i, '');
    }
    for (const expr of printedExpressions(body, consts)) {
      const name = (expr.match(/^[\w.]+/) || [''])[0];
      const ok = allow.find(a => a.expr === expr || a.expr === name);
      F.push({ level: ok ? 'allowed' : 'error', rule: 'voiced-variable', line: L.n, match: `{${expr}}`, text: cleanInkText(L.t),
        note: ok ? `allowed: ${ok.reason}` : `prints {${expr}} in a voiced line, so the TTS can't be cached (AGENTS.md: no printed variables in voiced lines); use fixed wording, or choose between fixed strings with {cond: a|b}` });
    }
  }
  return F;
}

export function stats(arr) {
  if (!arr.length) return { lines: 0, median: 0, p90: 0, max: 0 };
  const a = [...arr].sort((x, y) => x - y);
  return { lines: a.length, median: a[Math.floor(a.length / 2)], p90: a[Math.min(a.length - 1, Math.floor(a.length * 0.9))], max: a[a.length - 1] };
}

// ---------- scenario.json.erb ----------
function matchBracket(s, start) {
  const open = s[start], close = open === '{' ? '}' : ']';
  let depth = 0, inStr = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (c === '\\') i++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close && --depth === 0) return i;
  }
  return -1;
}
const lineOf = (s, idx) => s.slice(0, idx).split('\n').length;
const MSG_RE = /"message"\s*:\s*"((?:[^"\\]|\\.)*)"/g;

export function scenarioInfo(erb) {
  // npc channel by storyPath
  const channels = {};
  const names = {};
  const spRe = /"storyPath"\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = spRe.exec(erb))) {
    const objStart = erb.lastIndexOf('{', erb.lastIndexOf('"id"', m.index) >= 0 ? m.index : m.index);
    // walk outwards to the enclosing NPC object: find the nearest earlier "npcType" within the same object
    const before = erb.slice(Math.max(0, m.index - 1500), m.index);
    const after = erb.slice(m.index, m.index + 1500);
    const bt = [...before.matchAll(/"npcType"\s*:\s*"(\w+)"/g)].pop();
    const at = after.match(/"npcType"\s*:\s*"(\w+)"/);
    const btDist = bt ? before.length - bt.index : Infinity;
    const atDist = at ? at.index : Infinity;
    const type = btDist <= atDist ? bt?.[1] : at?.[1];
    channels[basename(m[1])] = type || 'person';
    // the NPC's own names (displayName and id), for the phone-self-prefix rule
    const bd = [...before.matchAll(/"displayName"\s*:\s*"([^"]+)"/g)].pop();
    const ad = after.match(/"displayName"\s*:\s*"([^"]+)"/);
    const useBefore = bd && (!ad || before.length - bd.index <= ad.index);
    const dn = useBefore ? bd : ad;
    const nm = [];
    if (dn) {
      nm.push(dn[1]);
      const upto = useBefore ? before.slice(0, bd.index) : erb.slice(Math.max(0, m.index - 1500), m.index + ad.index);
      const id = [...upto.matchAll(/"id"\s*:\s*"([^"]+)"/g)].pop();
      if (id) nm.push(id[1]);
    }
    names[basename(m[1])] = nm;
    void objStart;
  }
  // timed texts
  const texts = [];
  const push = (from, to) => {
    const seg = erb.slice(from, to);
    MSG_RE.lastIndex = 0;
    let mm;
    while ((mm = MSG_RE.exec(seg))) {
      const msg = mm[1].replace(/<%.*?%>/g, 'X').replace(/\\"/g, '"').replace(/\\n/g, ' ');
      texts.push({ line: lineOf(erb, from + mm.index), text: msg });
    }
  };
  const tm = /"timedMessages"\s*:\s*\[/g;
  while ((m = tm.exec(erb))) { const e = matchBracket(erb, m.index + m[0].length - 1); if (e > 0) push(m.index, e); }
  const sm = /"sendTimedMessage"\s*:\s*\{/g;
  while ((m = sm.exec(erb))) { const e = matchBracket(erb, m.index + m[0].length - 1); if (e > 0) push(m.index, e); }
  return { channels, names, texts };
}

export function lintTexts(texts) {
  const findings = [];
  const lengths = [];
  for (const t of texts) {
    const w = countWords(t.text);
    lengths.push(w);
    if (w > CAPS.text) findings.push({ level: 'error', rule: 'text-len', line: t.line, words: w, cap: CAPS.text, text: t.text });
    for (const h of tellHits(t.text)) findings.push({ level: 'warn', rule: h.rule, line: t.line, match: h.match, text: t.text });
  }
  return { findings, stats: stats(lengths) };
}

// ---------- driver ----------
function expandTargets(args) {
  const files = [];
  const scenarios = new Set();
  for (const a of args) {
    const p = resolve(a);
    if (!existsSync(p)) { console.error(`not found: ${a}`); continue; }
    if (statSync(p).isDirectory()) {
      const inkDir = existsSync(join(p, 'ink')) ? join(p, 'ink') : p;
      for (const f of readdirSync(inkDir).sort()) if (f.endsWith('.ink')) files.push(join(inkDir, f));
      if (existsSync(join(p, 'scenario.json.erb'))) scenarios.add(join(p, 'scenario.json.erb'));
    } else {
      files.push(p);
      const sc = join(dirname(dirname(p)), 'scenario.json.erb');
      if (p.endsWith('.ink') && existsSync(sc)) scenarios.add(sc);
    }
  }
  return { files, scenarios: [...scenarios] };
}

export function lintTargets(args) {
  const { files, scenarios } = expandTargets(args);
  const channels = {};
  const names = {};
  const report = { files: [], texts: [] };
  for (const sc of scenarios) {
    const info = scenarioInfo(readFileSync(sc, 'utf8'));
    Object.assign(channels, info.channels);
    Object.assign(names, info.names);
    const r = lintTexts(info.texts);
    report.texts.push({ file: sc, ...r, count: info.texts.length });
  }
  for (const f of files) {
    const channel = channels[basename(f).replace(/\.ink$/, '.json')] || 'person';
    const r = lintInk(readFileSync(f, 'utf8'), { channel, names: names[basename(f).replace(/\.ink$/, '.json')] || [], file: f });
    report.files.push({ file: f, channel, known: (basename(f).replace(/\.ink$/, '.json')) in channels, ...r });
  }
  return report;
}

export function countsByRule(report) {
  const c = {};
  for (const x of [...report.files, ...report.texts]) for (const f of x.findings) c[f.rule] = (c[f.rule] || 0) + 1;
  return c;
}

function printHuman(report) {
  const rel = p => p.replace(process.cwd() + '/', '');
  for (const x of report.files) {
    const s = x.stats;
    console.log(`\n${rel(x.file)}  [${x.channel}${x.known ? '' : ', unmapped'}]  lines=${s.lines} median=${s.median} p90=${s.p90} max=${s.max}`);
    for (const f of x.findings) console.log('  ' + fmt(f));
    for (const f of x.allowed || []) console.log('  ' + fmt(f));
  }
  for (const x of report.texts) {
    const s = x.stats;
    console.log(`\n${rel(x.file)}  [timed texts]  texts=${s.lines} median=${s.median} p90=${s.p90} max=${s.max}`);
    for (const f of x.findings) console.log('  ' + fmt(f));
  }
  const c = countsByRule(report);
  console.log('\nTotals by rule: ' + (Object.keys(c).length ? Object.entries(c).map(([k, v]) => `${k}=${v}`).join(' ') : 'none'));
}
function fmt(f) {
  const t = f.text.length > 110 ? f.text.slice(0, 107) + '...' : f.text;
  const extra = f.rule === 'line-len' || f.rule === 'text-len' || f.rule === 'choice-len' ? `${f.words} words (cap ${f.cap ?? CAPS.choice})`
    : f.rule === 'you-after-choice' ? `after choice at line ${f.choiceLine} (${f.note})`
    : f.match === undefined && f.note ? f.note
    : `"${f.match}"`;
  return `${f.level.toUpperCase().padEnd(5)} L${f.line} ${f.rule}: ${extra}  | ${t}`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const targets = args.filter(a => !a.startsWith('--'));
  if (!targets.length) { console.error('usage: dialoguelint.mjs <mission-dir-or-ink-files>... [--json]'); process.exit(2); }
  const report = lintTargets(targets);
  if (json) console.log(JSON.stringify({ ...report, counts: countsByRule(report) }, null, 2));
  else printHuman(report);
}
