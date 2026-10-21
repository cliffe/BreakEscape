/**
 * Pretext / vishing judge (planning_notes/phishing_and_social_engineering/designs
 * 06 N1, sections 4.1-4.4, 4.6, 4.8; contract 00 section 8). Implementation plan P4-A.
 *
 * A PURE module, the same shape as phish-rules.js (04). It touches no DOM, no window
 * and no other global, imports nothing, and never mutates its arguments. It is
 * unit-testable from the scenario JSON alone: given the call spec, the running
 * session and the current influence, it returns the influence entries a line or an
 * ask produces and the resulting band. It does NOT write globals, run threshold
 * effects, apply grants or start a session — the binding (P4-B) does that from the
 * numbers returned here. Nothing is scored on wording: the judge compares value ids.
 *
 * Exports
 *   judgeUtterance(spec, session, utteranceId, blanks, influence)
 *       -> { entries[], influenceAfter, band, reported, reportReason, locked,
 *            opens[], repairs[], verificationCleared[] }
 *   judgeAsk(spec, session, askId, influence)
 *       -> { result, inkResult, entries[], influenceAfter, band, reported,
 *            reportReason, line, floorUsed, verificationNeeded }
 *   bandForInfluence(thresholds, value) -> 0..4            (00 section 8 "Band numbers")
 *   Constants: BAND, GRADE_COST, DEFAULTS, ASK_RESULT.
 *
 * The `spec` is the character's call data merged with its character-level influence
 * config: the `social.pretextNpcs` entry (knows, susceptibility, unverifiableCost,
 * lines, asks, outcomes, tells, tuning) plus the `social.characters` entry's
 * `thresholds[]` and `influence` ({ min, max, start, rearmMargin }). The binding builds
 * it; the judge only reads it. `spec.labels` (optional) maps a value id to a display
 * label for {said}/{actual} in a tell; without it the raw value id is printed.
 *
 * Each entry is { delta, reason, line }:
 *   delta   signed influence points for this factor
 *   reason  a fact id (`manager`), a technique (`urgency`), `candour` for a repair's
 *           candour modifier, or an ask id for an ask's pressure
 *   line    the authored tell string for this factor, resolved for the tuning's
 *           tellDetail ("full" | "category" | "none"); "" when "none"
 *
 * `blanks` is the chosen blank values for this line, keyed by blank name. A value is a
 * value id string, or { value, label } when the picker carries a label.
 *
 * `session` (PretextSession, 06 section 6; the judge reads, never writes):
 *   openMismatches   fact ids the NPC caught wrong and has not seen corrected
 *   refusals         count of soft ask refusals so far
 *   pendingVerification  fact ids an ask is waiting on (set when an ask returned pending)
 *   pendingVerificationAsk  the ask id those facts belong to
 *   verified         { <askId>: true } once an ask's verification has all matched
 */

// Band numbers (00 section 8 "Band numbers"): the integer ink branches on.
export const BAND = Object.freeze({ CALM: 0, WARY: 1, REFUSING: 2, REPORTED: 3, LOCKED: 4 });

// grade -> mismatch cost (00 section 8 / 06 section 4.2).
export const GRADE_COST = Object.freeze({ identity: -30, lesser: -20 });

export const DEFAULTS = Object.freeze({
  unverifiableCost: -10,       // a claim the NPC cannot check (06 section 4.2)
  matchCreditCapPerLine: 10,   // most a line earns from true claims (06 section 4.2)
  maxRefusals: 2,              // soft refusals before the NPC reports (06 section 4.2)
  claimCredit: 10,             // a claim that checks out
  candourCredit: 10,           // repair candour modifier when susceptibility has no candour key
  rearmMargin: 10              // 00 section 8
});

// What judgeAsk returns for `result`, and the matching ink external value
// (EXTERNAL pretext_ask returns 0 refused, 1 granted, 2 needs verification; 06 section 5).
export const ASK_RESULT = Object.freeze({ granted: 1, refused: 0, pending: 2 });

// ------------------------------------------------------------------ helpers

const isStr = (v) => typeof v === 'string';
const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
const arr = (v) => (Array.isArray(v) ? v : []);

function clampInfluence(spec, v) {
  const inf = (spec && spec.influence) || {};
  const min = isNum(inf.min) ? inf.min : (isNum(spec && spec.min) ? spec.min : -100);
  const max = isNum(inf.max) ? inf.max : (isNum(spec && spec.max) ? spec.max : 100);
  return Math.max(min, Math.min(max, v));
}

function thresholdsOf(spec) {
  return arr(spec && spec.thresholds);
}

function hasLockoutEffect(t) {
  return arr(t && t.effects).some((e) => e && e.type === 'lockout');
}

// 00 section 8 "Band numbers": rank a threshold by its id, with a lockout effect that
// is not on `reports` also giving 4.
function bandRank(t) {
  if (!t || !isStr(t.id)) return 0;
  if (t.id === 'wary') return 1;
  if (t.id === 'refuses') return 2;
  if (t.id === 'reports') return 3;
  if (t.id === 'lockout') return 4;
  if (hasLockoutEffect(t) && t.id !== 'reports') return 4;
  return 0; // trusts and scenario-specific ids never change the band
}

/**
 * The band at a given influence value: the highest crossed threshold, ranked by id.
 * A "below" threshold (the default) is crossed at or below its `at`; an "above" one
 * at or above. Equality counts (00 section 8).
 */
export function bandForInfluence(thresholds, value) {
  let band = BAND.CALM;
  for (const t of arr(thresholds)) {
    if (!t || !isNum(t.at)) continue;
    const when = t.when || 'below';
    const crossed = when === 'above' ? value >= t.at : value <= t.at;
    if (!crossed) continue;
    const r = bandRank(t);
    if (r > band) band = r;
  }
  return band;
}

function refusesAt(spec) {
  const t = thresholdsOf(spec).find((x) => x && x.id === 'refuses');
  return t && isNum(t.at) ? t.at : null;
}

// A filled blank, keyed the way the judge tests do (`blank:name` -> blanks.name)
// or the way the card stores it (fact id -> { value, label }). 06 §5.
function blankRecord(blanks, name, factId) {
  if (!blanks) return undefined;
  if (name && blanks[name] != null) return blanks[name];
  if (factId && name !== factId && blanks[factId] != null) return blanks[factId];
  return undefined;
}

// The value id a claim points at: a filled blank, or a fixed value in the line.
function claimValue(claim, blanks) {
  if (!claim) return undefined;
  const from = claim.from;
  if (isStr(from) && from.startsWith('blank:')) {
    const name = from.slice('blank:'.length);
    const b = blankRecord(blanks, name, claim.fact);
    return b && typeof b === 'object' ? b.value : b;
  }
  if (from !== undefined && from !== null) return from;
  return claim.value; // a claim may carry its value id directly
}

// Display label for a value id: a blank's own label, or spec.labels, else the id.
function labelFor(spec, valueId, blanks, blankName, factId) {
  const rec = blankRecord(blanks, blankName, factId);
  if (rec && typeof rec === 'object' && isStr(rec.label) && (rec.value === undefined || rec.value === valueId)) {
    return rec.label;
  }
  const map = spec && spec.labels;
  if (map && isStr(map[valueId])) return map[valueId];
  return valueId === undefined || valueId === null ? '' : String(valueId);
}

function fillTell(str, said, actual) {
  if (!isStr(str)) return '';
  return str.replace(/\{said\}/g, said == null ? '' : said)
            .replace(/\{actual\}/g, actual == null ? '' : actual);
}

function tellDetail(spec) {
  const d = spec && spec.tuning && spec.tuning.tellDetail;
  return d === 'category' || d === 'none' ? d : 'full';
}

// The fail tell for a fact, chosen by tellDetail. "none" shows no reason text.
function failTell(spec, fact, said, actual) {
  const t = (spec && spec.tells && spec.tells[fact]) || {};
  const mode = tellDetail(spec);
  if (mode === 'none') return '';
  if (mode === 'category') return isStr(t.failCategory) ? t.failCategory : fillTell(t.fail, said, actual);
  return fillTell(t.fail, said, actual);
}

function passTell(spec, fact) {
  const t = (spec && spec.tells && spec.tells[fact]) || {};
  return tellDetail(spec) === 'none' ? '' : (isStr(t.pass) ? t.pass : '');
}

function unknownTell(spec, fact) {
  const t = (spec && spec.tells && spec.tells[fact]) || {};
  return tellDetail(spec) === 'none' ? '' : (isStr(t.unknown) ? t.unknown : '');
}

function techniqueTell(spec, tech) {
  const t = (spec && spec.tells && spec.tells.techniques) || {};
  return tellDetail(spec) === 'none' ? '' : (isStr(t[tech]) ? t[tech] : '');
}

function repairTell(spec) {
  const t = spec && spec.tells && spec.tells.repair;
  return tellDetail(spec) === 'none' ? '' : (isStr(t) ? t : '');
}

function askTell(spec, kind) {
  const t = (spec && spec.tells && spec.tells.ask) || {};
  return tellDetail(spec) === 'none' ? '' : (isStr(t[kind]) ? t[kind] : '');
}

function openSet(session) {
  return new Set(arr(session && session.openMismatches));
}

function susceptibility(spec, key) {
  const s = (spec && spec.susceptibility) || {};
  return isNum(s[key]) ? s[key] : 0;
}

// ------------------------------------------------------------------ utterance

/**
 * Judge one spoken line. Returns the influence entries, the resulting band, and the
 * state changes the binding should apply (opens, repairs, verificationCleared). Pure:
 * it reads `session` but never changes it.
 */
export function judgeUtterance(spec, session, utteranceId, blanks, influence) {
  const line = (spec && spec.lines && spec.lines[utteranceId]) || {};
  const tuning = (spec && spec.tuning) || {};
  const cap = isNum(tuning.matchCreditCapPerLine) ? tuning.matchCreditCapPerLine : DEFAULTS.matchCreditCapPerLine;
  const unverifiableCost = isNum(spec && spec.unverifiableCost) ? spec.unverifiableCost : DEFAULTS.unverifiableCost;
  const open = openSet(session);
  const pending = new Set(arr(session && session.pendingVerification));

  const entries = [];
  const opens = [];
  const repairs = [];
  const verificationCleared = [];
  let matchCreditUsed = 0;
  let reported = false;
  let reportReason = null;

  const claims = arr(line.claims).slice();
  const techniques = [];
  if (isStr(line.technique)) techniques.push(line.technique);
  for (const t of arr(line.also)) if (isStr(t)) techniques.push(t);

  // Repair: correcting an open mismatch. Earns the claim credit plus the candour
  // modifier (06 section 4.2), consuming that fact's claim and the line's technique,
  // so a repair line is not triple-counted. Works only while the fact is open.
  if (isStr(line.repairs) && open.has(line.repairs)) {
    const fact = line.repairs;
    const idx = claims.findIndex((c) => c && c.fact === fact);
    if (idx !== -1) claims.splice(idx, 1);
    const candourKey = isStr(line.technique) ? line.technique : 'candour';
    const ti = techniques.indexOf(candourKey);
    if (ti !== -1) techniques.splice(ti, 1);
    entries.push({ delta: DEFAULTS.claimCredit, reason: fact, line: passTell(spec, fact) });
    const candour = susceptibility(spec, candourKey) || DEFAULTS.candourCredit;
    entries.push({ delta: candour, reason: candourKey, line: repairTell(spec) });
    repairs.push(fact);
  }

  // Doubling down on an open mismatch (06 section 4.2): a flat penalty, fact stays open.
  if (isStr(line.doublesDown) && open.has(line.doublesDown)) {
    const fact = line.doublesDown;
    const delta = isNum(line.extra) ? line.extra : -20;
    const said = labelFor(spec, claimValue(claims.find((c) => c && c.fact === fact), blanks), blanks, fact);
    const actual = labelFor(spec, (spec.knows && spec.knows[fact] && spec.knows[fact].value));
    entries.push({ delta, reason: fact, line: failTell(spec, fact, said, actual) });
  }

  // Remaining claims.
  for (const claim of claims) {
    if (!claim || !isStr(claim.fact)) continue;
    const fact = claim.fact;
    const value = claimValue(claim, blanks);
    const known = spec && spec.knows && spec.knows[fact];
    if (!known) {
      // Unverifiable by this NPC (06 section 4.2): a small, uncapped cost.
      entries.push({ delta: unverifiableCost, reason: fact, line: unknownTell(spec, fact) });
      continue;
    }
    const accept = arr(known.accept);
    const matched = value === known.value || accept.includes(value);
    if (matched) {
      const credit = Math.max(0, Math.min(DEFAULTS.claimCredit, cap - matchCreditUsed));
      matchCreditUsed += credit;
      entries.push({ delta: credit, reason: fact, line: passTell(spec, fact) });
      if (pending.has(fact)) verificationCleared.push(fact);
    } else {
      const delta = isNum(GRADE_COST[known.grade]) ? GRADE_COST[known.grade] : GRADE_COST.lesser;
      const blankName = claim.from && isStr(claim.from) && claim.from.startsWith('blank:')
        ? claim.from.slice('blank:'.length) : null;
      const said = labelFor(spec, value, blanks, blankName, fact);
      const actual = labelFor(spec, known.value);
      entries.push({ delta, reason: fact, line: failTell(spec, fact, said, actual) });
      opens.push(fact);
      // A failed verification fact reports the call at once (06 section 4.2, 4.4).
      if (pending.has(fact)) {
        reported = true;
        reportReason = 'verificationFailed';
      }
    }
  }

  // Techniques (06 section 4.2): the NPC's susceptibility value, one entry each.
  for (const tech of techniques) {
    entries.push({ delta: susceptibility(spec, tech), reason: tech, line: techniqueTell(spec, tech) });
  }

  const total = entries.reduce((s, e) => s + (isNum(e.delta) ? e.delta : 0), 0);
  const influenceAfter = clampInfluence(spec, influence + total);
  const band = bandForInfluence(thresholdsOf(spec), influenceAfter);
  if (band >= BAND.REPORTED && !reported) {
    reported = true;
    reportReason = 'threshold';
  }
  const locked = band === BAND.LOCKED;

  return { entries, influenceAfter, band, reported, reportReason, locked, opens, repairs, verificationCleared };
}

// ------------------------------------------------------------------ ask

/**
 * Judge an ask. The pressure is applied first, then the floor is tested against the
 * result (06 section 4.2). An ask with verification that is not yet satisfied returns
 * `pending`; once the session shows it verified, it returns `granted`. An ask below its
 * floor is refused softly and counts toward maxRefusals; reaching the limit reports.
 * An ask with no floor is tested against the refuses threshold. Pure.
 */
export function judgeAsk(spec, session, askId, influence) {
  const ask = (spec && spec.asks && spec.asks[askId]) || {};
  const tuning = (spec && spec.tuning) || {};
  const maxRefusals = isNum(tuning.maxRefusals) ? tuning.maxRefusals : DEFAULTS.maxRefusals;

  const entries = [];
  const pressure = isNum(ask.pressure) ? ask.pressure : 0;
  if (pressure !== 0) entries.push({ delta: pressure, reason: askId, line: '' });
  const influenceAfter = clampInfluence(spec, influence + pressure);
  const band = bandForInfluence(thresholdsOf(spec), influenceAfter);

  let floorUsed = isNum(ask.floor) ? ask.floor : refusesAt(spec);
  if (!isNum(floorUsed)) floorUsed = -Infinity; // no floor and no refuses threshold: nothing blocks it

  const verification = arr(ask.verification);
  const verified = verification.length === 0
    || !!(session && session.verified && session.verified[askId] === true);

  let result;
  let inkResult;
  let reported = false;
  let reportReason = null;
  let line;

  if (influenceAfter >= floorUsed) {
    if (verification.length && !verified) {
      result = 'pending';
      inkResult = ASK_RESULT.pending;
      line = askTell(spec, 'pending');
    } else {
      result = 'granted';
      inkResult = ASK_RESULT.granted;
      line = askTell(spec, 'accepted');
    }
  } else {
    result = 'refused';
    inkResult = ASK_RESULT.refused;
    line = askTell(spec, 'refused');
    const refusalsAfter = (isNum(session && session.refusals) ? session.refusals : 0) + 1;
    if (refusalsAfter >= maxRefusals) {
      reported = true;
      reportReason = 'maxRefusals';
    }
  }

  return {
    result,
    inkResult,
    entries,
    influenceAfter,
    band,
    reported,
    reportReason,
    line,
    floorUsed: floorUsed === -Infinity ? null : floorUsed,
    verificationNeeded: verification.slice()
  };
}
