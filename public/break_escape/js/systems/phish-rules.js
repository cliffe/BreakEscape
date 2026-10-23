/**
 * Phish-judging rules engine (planning_notes/phishing_and_social_engineering/designs
 * 04 N1, N2, N7-N9, N11 runtime, N12; contract 00 sections 2, 3, 7, 10, 10a, 11a, 13).
 *
 * A PURE module. It touches no DOM, no window and no other global, imports nothing,
 * and never mutates its arguments. The mail client (01) resolves accounts and link
 * info, applies boostIfGlobal / strictIfGlobal to a copy of the target, calls
 * evaluateMessage on send, and renders the result. Nothing here is ever scored on
 * wording: the judge compares value ids only.
 *
 * Exports
 *   evaluateMessage(target, message, ctx) -> EvalResult         (00 section 3)
 *       ctx = { accounts, people, templates, payloadKit?, priorFailures? }
 *         accounts     social.mailClient.accounts (a created account must already
 *                      carry its chosen address)
 *         people       social.people
 *         templates    social.templates
 *         payloadKit   optional payload-kit items [{id,label,kind}] (array or map by id);
 *                      needed to learn an attachment's kind. message.attachmentKind is
 *                      the fallback.
 *         priorFailures  optional count of earlier failed sends to this target, for the
 *                      hint ladder (hintIndex = min(priorFailures - 1, hints.length - 1),
 *                      so the first repeated miss shows the softest rung hints[0]).
 *   preSendGate(target, message, ctx, held) -> { ok, reason, line }   (N11 runtime)
 *       held = { facts: [factId...], options: { <slotId>: <number of held options> } }
 *   dataOnlyReply(target, result) -> { text, landed, firstFail, setGlobal }  (N7)
 *   deriveSenderAuth(target, message, ctx) -> { read, claimedDomain, accountDomain }  (N8)
 *   computeTells(...) is internal; tells are on every EvalResult (N9).
 *   Constants: FACTOR_ORDER, CANONICAL, PRE_SEND_GATE_LINE, ATTACHMENT_STATES.
 *
 * Extra fields beyond 00 section 3 (additive; consumers may ignore them):
 *   result.openLine, result.firstFail, result.failCount, result.attachment, result.link,
 *   result.hintIndex, result.hint (N4: the escalating hint to show after a repeated failure),
 *   and per factor: passLine, line, detail.
 */

export const FACTOR_ORDER = Object.freeze([
  'senderTrust', 'senderAuth', 'addressedTo', 'pretextRelevant',
  'attachmentPlausible', 'urgencyCalibrated', 'linkCredible'
]);

export const PRE_SEND_GATE_LINE = "A blank needs evidence you haven't found yet";

export const ATTACHMENT_STATES = Object.freeze(['pass', 'missing', 'wrong-type']);

// 00 section 2: one canonical red-flag, pass and fail string per factor.
export const CANONICAL = Object.freeze({
  open: Object.freeze({
    pass: '✓ They would open it',
    fail: 'Nothing about the sender or the subject made them open it'
  }),
  senderTrust: Object.freeze({
    pass: '✓ Sender looked trusted',
    fail: "Sorry, who is this? I don't recognise the sender.",
    redFlag: "Sender address doesn't match the display name or a known contact"
  }),
  senderAuth: Object.freeze({
    pass: '✓ Sender authentication would pass',
    fail: "This didn't pass the usual sender checks.",
    redFlag: "Fails sender authentication (SPF/DKIM/DMARC) — the domain didn't really send this"
  }),
  addressedTo: Object.freeze({
    pass: '✓ Addressed by name',
    fail: "This doesn't have my name on it.",
    redFlag: 'Generic greeting, not addressed to the recipient'
  }),
  pretextRelevant: Object.freeze({
    pass: '✓ Relevant to the recipient',
    fail: "I'm not expecting anything like this.",
    redFlag: 'No plausible reason for this message to this person'
  }),
  attachmentPlausible: Object.freeze({
    pass: '✓ The attachment fits the story',
    missing: Object.freeze({
      fail: "You said you'd attach it, but there's nothing here.",
      redFlag: "Claims an attachment that isn't present"
    }),
    'wrong-type': Object.freeze({
      fail: 'Why would you send me that file type?',
      redFlag: "Attachment type doesn't fit the stated purpose"
    })
  }),
  urgencyCalibrated: Object.freeze({
    pass: '✓ The pressure was believable',
    fail: 'That feels rushed.',
    redFlag: 'Unexpected urgency or pressure to act fast'
  }),
  linkCredible: Object.freeze({
    pass: '✓ The link looked right',
    fail: "That link doesn't look right to me.",
    redFlag: "Link destination doesn't match the real site (look-alike domain)",
    missing: Object.freeze({ fail: "There's no page behind that link." })
  })
});

const DMARC_CLAUSE = Object.freeze({
  none: ' The domain asks receivers to take no action, so it would still be delivered.',
  quarantine: ' The domain asks receivers to quarantine it, so it would likely land in junk.',
  reject: ' The domain asks receivers to reject it, so it would be refused.'
});

const URGENCY_RANK = Object.freeze({ low: 0, medium: 1, high: 2 });
const NAME_SUFFIXES = ['_first', '_short', '_formal', '_full', '_address'];

// ---------------------------------------------------------------- helpers

function isStr(v) { return typeof v === 'string' && v.length > 0; }
function arr(v) { return Array.isArray(v) ? v : []; }

/** The string at an authored path, or the canonical fallback when absent, null or blank. */
function pick(authored, canonical) { return isStr(authored) ? authored : canonical; }

function strings(target, factor) {
  const fs = target && target.factorStrings;
  const e = fs && fs[factor];
  return e && typeof e === 'object' ? e : {};
}

/** Person id of a value id such as pierce_short, baker_address, leeds_baker_full. */
export function personOfValue(valueId) {
  if (!isStr(valueId)) return null;
  for (const suffix of NAME_SUFFIXES) {
    if (valueId.endsWith(suffix) && valueId.length > suffix.length) {
      return valueId.slice(0, -suffix.length);
    }
  }
  return null;
}

function domainOf(address) {
  if (!isStr(address)) return null;
  const at = address.lastIndexOf('@');
  return at >= 0 && at < address.length - 1 ? address.slice(at + 1).toLowerCase() : null;
}

function findAccount(ctx, id) {
  const hit = arr(ctx && ctx.accounts).find((a) => a && a.id === id);
  return hit || { id, person: null, spoofsFrom: false, address: null };
}

function findPerson(ctx, id) {
  return arr(ctx && ctx.people).find((p) => p && p.id === id) || null;
}

function template(ctx, id) {
  const t = ctx && ctx.templates;
  return t && isStr(id) && Object.prototype.hasOwnProperty.call(t, id) ? t[id] : null;
}

function kitItem(ctx, id) {
  const kit = ctx && ctx.payloadKit;
  if (!kit || !isStr(id)) return null;
  if (Array.isArray(kit)) return kit.find((k) => k && k.id === id) || null;
  return Object.prototype.hasOwnProperty.call(kit, id) ? kit[id] : null;
}

/** Slot values chosen in the template of one part, as value ids (free text never appears). */
function slotValues(tpl, message) {
  const slots = (message && message.slots) || {};
  const out = [];
  for (const s of arr(tpl && tpl.slots)) {
    const v = slots[s.id];
    if (isStr(v)) out.push(v);
  }
  return out;
}

function listedMode(target, id) {
  if (Array.isArray(target.factors)) {
    const f = target.factors.find((x) => x && x.id === id);
    if (f) return f.mode === 'required' ? 'required' : 'advisory';
  }
  if (arr(target.requiredFactors).includes(id)) return 'required';
  if (arr(target.advisoryFactors).includes(id)) return 'advisory';
  return null;
}

/** required / advisory / null (not evaluated) for one factor of one send. */
function modeFor(target, id, message) {
  const listed = listedMode(target, id);
  if (id === 'urgencyCalibrated') return listed ? 'advisory' : null; // never gates
  if (id === 'linkCredible') {
    if (target.expectedLink) return listed || 'required';
    if (listed) return isStr(message.link) ? listed : null;
    return isStr(message.link) ? 'advisory' : null;
  }
  return listed;
}

// ------------------------------------------------------------ sender judge

/**
 * The identity the header From shows. A non-spoofing account is forced to its own
 * identity whatever the blanks hold (00 section 10a).
 */
function resolveHeader(message, account) {
  const hf = message.headerFrom || {};
  // `spoofCapable` records whether the sending account could set its own From at all,
  // kept even when `forced` is true: a spoof-capable account that picked the own-From
  // template is forced to its own identity for this send but is NOT the "freemail can
  // only send as itself" case, so the hint must tell them apart (lab R3 F2).
  const spoofCapable = account.spoofsFrom === true;
  const forced = hf.account === true || !spoofCapable;
  if (forced) {
    return { forced: true, spoofCapable, namePerson: account.person || null, addressPerson: account.person || null,
             address: account.address || null, hasName: true, hasAddress: true };
  }
  return {
    forced: false,
    spoofCapable,
    namePerson: personOfValue(hf.name),
    addressPerson: personOfValue(hf.address),
    address: null,
    hasName: isStr(hf.name),
    hasAddress: isStr(hf.address)
  };
}

function judgeSender(target, header) {
  const trusts = arr(target.primedFor && target.primedFor.trusts);
  if (trusts.includes('*')) return { pass: true, state: 'pass', claimedSender: null };
  if (header.forced) {
    const p = header.namePerson;
    if (p && trusts.includes(p)) return { pass: true, state: 'pass', claimedSender: p };
    return { pass: false, state: 'fail', claimedSender: null };
  }
  if (!header.hasName || !header.hasAddress) return { pass: false, state: 'fail', claimedSender: null };
  if (header.namePerson !== header.addressPerson) {
    // One half of the From is wrong: name and address belong to different people.
    const nameTrusted = header.namePerson && trusts.includes(header.namePerson);
    const addrTrusted = header.addressPerson && trusts.includes(header.addressPerson);
    return { pass: false, state: 'mismatch', claimedSender: null,
             detail: nameTrusted ? 'address' : addrTrusted ? 'name' : 'both' };
  }
  if (header.namePerson && trusts.includes(header.namePerson)) {
    return { pass: true, state: 'pass', claimedSender: header.namePerson };
  }
  return { pass: false, state: 'fail', claimedSender: null };
}

// ---------------------------------------------------- senderAuth derivation

/**
 * N8. Account domain = envelope and signing domain; header From domain = visible
 * domain; the claimed domain's policy (target.senderAuth) says whether they align.
 * Equal domains align. A claimed domain with no policy publishes nothing: would-pass.
 * The policy is the target company's, so it applies to the claimed domain only when
 * that is the target's own domain (or the target has no address to compare).
 * target.senderAuth.override ("would-pass" | "would-fail") replaces the derived read.
 */
export function deriveSenderAuth(target, message, ctx) {
  const account = findAccount(ctx, message.fromAccount);
  const header = resolveHeader(message, account);
  const accountDomain = domainOf(account.address);
  let claimedDomain = accountDomain;
  if (!header.forced && header.hasAddress) {
    const person = findPerson(ctx, header.addressPerson);
    claimedDomain = domainOf(person && person.address);
  }
  const policy = target.senderAuth || null;
  let read = 'would-pass';
  if (claimedDomain && accountDomain && claimedDomain !== accountDomain && policy) {
    const targetDomain = domainOf(target.address);
    const applies = !targetDomain || targetDomain === claimedDomain;
    if (applies && policy.domainPublishesAuth && policy.spoofAligns !== true) read = 'would-fail';
  }
  if (policy && (policy.override === 'would-pass' || policy.override === 'would-fail')) read = policy.override;
  return { read, claimedDomain, accountDomain };
}

// ---------------------------------------------------------------- the judge

function urgencyOf(ctx, message) {
  let top = null;
  const tpls = message.templates || {};
  for (const part of ['pretext', 'ask']) {
    const t = template(ctx, tpls[part]);
    const u = t && t.urgency;
    if (u in URGENCY_RANK && (top === null || URGENCY_RANK[u] > URGENCY_RANK[top])) top = u;
  }
  return top;
}

function subjectTopicOf(target, message) {
  const s = arr(target.subjects).find((x) => x && x.id === message.subject);
  return s && isStr(s.topic) ? s.topic : null;
}

function judgeAddressed(target, message, ctx) {
  const t = template(ctx, (message.templates || {}).greeting);
  const accepted = arr(target.addressedAs);
  return slotValues(t, message).some((v) => accepted.includes(v));
}

function judgePretext(target, message, ctx) {
  const p = target.primedFor || {};
  const t = template(ctx, (message.templates || {}).pretext);
  const chosen = new Set(slotValues(t, message));
  for (const imp of arr(t && t.implies)) if (imp && isStr(imp.value)) chosen.add(imp.value);
  const distinctive = new Set(arr(p.distinctiveValues));
  let n = 0;
  for (const v of chosen) if (distinctive.has(v)) n += 1;
  const need = Number.isInteger(p.minDistinct) && p.minDistinct > 0 ? p.minDistinct : 1;
  return n >= need;
}

function judgeAttachment(target, message, ctx) {
  const expected = target.primedFor && target.primedFor.expectedAttachment;
  if (!isStr(message.attachment)) return expected ? 'missing' : 'pass';
  if (!expected) return 'pass';
  const item = kitItem(ctx, message.attachment);
  const kind = (item && item.kind) || message.attachmentKind || null;
  return kind === expected ? 'pass' : 'wrong-type';
}

function judgeLink(message) {
  if (!isStr(message.link)) return 'missing';
  const info = message.linkInfo;
  if (!info || info.state === 'missing') return 'missing';
  return info.meetsThreshold === true ? 'pass' : 'fail';
}

function entry(target, id, base) {
  // base: { pass, state, mode, detail? } -> a full factors[] entry with strings resolved.
  const cs = CANONICAL[id];
  const ts = strings(target, id);
  const state = base.state;
  const passLine = pick(ts.pass, cs.pass);
  let fail = null;
  let redFlag = null;
  if (!base.pass) {
    const per = ts[state] && typeof ts[state] === 'object' ? ts[state] : null;
    const cper = cs[state] && typeof cs[state] === 'object' ? cs[state] : null;
    fail = pick(per && per.fail, cper ? cper.fail : pick(ts.fail, cs.fail));
    redFlag = pick(per && per.redFlag, pick(ts.redFlag, pick(cper && cper.redFlag, cs.redFlag)));
  }
  const out = {
    id, pass: base.pass, state, reply: fail, redFlag, mode: base.mode,
    passLine, line: base.pass ? passLine : fail
  };
  if (base.detail) out.detail = base.detail;
  return out;
}

function authFailText(target, policy) {
  const ts = strings(target, 'senderAuth');
  if (isStr(ts.fail)) return ts.fail;
  const clause = DMARC_CLAUSE[(policy && policy.dmarcPolicy)] || '';
  return CANONICAL.senderAuth.fail + clause;
}

/**
 * H2/H3. The hint keyed to the factor that failed, when the target authors `hintsByFactor`
 * (an opt-in map of factor id -> hint string, or a per-factor object of variants). Two
 * factors read a variant object rather than a bare string:
 *   senderTrust: { spoof, ownFrom, forced } — picked by how the From came to be wrong
 *     (00 section 10a; lab R3 F2). `forced` is only for an account that CANNOT spoof
 *     (freemail): "switch account". A spoof-capable account that left From as itself gets
 *     `ownFrom` ("set the From line to someone she trusts"), not the switch-account advice.
 *     A spoof-capable account that named the wrong person gets `spoof`.
 *   linkCredible: { missing, wrong } — picked by whether a page is attached at all
 *     (state 'missing') or a page with the wrong address is (lab R3 F4).
 * `fail` is the failed factor's EvalResult entry ({ id, state }); `header` is the resolved
 * From. Returns a string, or null to fall back to the miss-count ladder.
 */
function selectFactorHint(target, fail, header) {
  const byFactor = target && target.hintsByFactor;
  const factorId = fail && fail.id;
  if (!byFactor || typeof byFactor !== 'object' || !isStr(factorId)) return null;
  if (!Object.prototype.hasOwnProperty.call(byFactor, factorId)) return null;
  let h = byFactor[factorId];
  if (h && typeof h === 'object' && !Array.isArray(h)) {
    if (factorId === 'senderTrust') {
      if (!header || !header.forced) h = h.spoof;
      else h = header.spoofCapable ? (isStr(h.ownFrom) ? h.ownFrom : h.spoof) : h.forced;
    } else if (factorId === 'linkCredible') {
      h = fail.state === 'missing' ? (isStr(h.missing) ? h.missing : h.wrong) : (isStr(h.wrong) ? h.wrong : h.missing);
    } else {
      h = h.spoof || h.forced || null;
    }
  }
  return isStr(h) ? h : null;
}

/**
 * evaluateMessage(target, message, ctx) -> EvalResult (00 section 3).
 */
export function evaluateMessage(target, message, ctx) {
  if (!target || typeof target !== 'object') throw new TypeError('evaluateMessage: target required');
  if (!message || typeof message !== 'object') throw new TypeError('evaluateMessage: message required');
  const account = findAccount(ctx, message.fromAccount);
  const header = resolveHeader(message, account);
  const sender = judgeSender(target, header);
  const auth = deriveSenderAuth(target, message, ctx);
  const policy = target.senderAuth || null;

  // The open check (00 section 2): sender trust, else the subject's topic.
  const subjectTopic = subjectTopicOf(target, message);
  const topics = arr(target.interests && target.interests.topics);
  let via = 'none';
  if (sender.pass) via = 'sender';
  else if (subjectTopic !== null && topics.includes(subjectTopic)) via = 'subject';
  const open = { opened: via !== 'none', via, subjectTopic };
  const ots = strings(target, 'open');
  const openLine = open.opened ? pick(ots.pass, CANONICAL.open.pass) : pick(ots.fail, CANONICAL.open.fail);

  const urgencyRead = urgencyOf(ctx, message);
  const maxU = target.urgency && target.urgency.advisoryMax;
  const urgencyOver = !!(maxU in URGENCY_RANK && urgencyRead !== null &&
    URGENCY_RANK[urgencyRead] > URGENCY_RANK[maxU]);

  const factors = [];
  let attachmentState = 'none';
  let linkState = 'none';
  for (const id of FACTOR_ORDER) {
    const mode = modeFor(target, id, message);
    if (!mode) continue;
    if (id === 'senderTrust') {
      factors.push(entry(target, id, { pass: sender.pass, state: sender.state, mode, detail: sender.detail }));
    } else if (id === 'senderAuth') {
      const ts = strings(target, id);
      const pass = auth.read === 'would-pass';
      const e = entry(target, id, { pass, state: auth.read, mode });
      if (!pass) { e.reply = authFailText(target, policy); e.line = e.reply; }
      else e.passLine = e.line = pick(ts.pass, CANONICAL.senderAuth.pass);
      factors.push(e);
    } else if (id === 'addressedTo') {
      const pass = judgeAddressed(target, message, ctx);
      factors.push(entry(target, id, { pass, state: pass ? 'pass' : 'fail', mode }));
    } else if (id === 'pretextRelevant') {
      const pass = judgePretext(target, message, ctx);
      factors.push(entry(target, id, { pass, state: pass ? 'pass' : 'fail', mode }));
    } else if (id === 'attachmentPlausible') {
      const state = judgeAttachment(target, message, ctx);
      attachmentState = isStr(message.attachment) || state === 'missing' ? state : 'none';
      factors.push(entry(target, id, { pass: state === 'pass', state, mode }));
    } else if (id === 'urgencyCalibrated') {
      factors.push(entry(target, id, { pass: !urgencyOver, state: urgencyOver ? 'overdone' : 'pass', mode: 'advisory' }));
    } else if (id === 'linkCredible') {
      const state = judgeLink(message);
      // result.link (the ink's email_link) distinguishes no page at all from a wrong one, so a
      // victim can say "there's no link here" vs "that link isn't our portal" (lab R4 F7).
      // judgeLink returns 'missing' when no link/page is attached; the factor entry keeps that
      // state (the missing/wrong hint reads it), but email_link reports it as 'none'.
      linkState = state === 'pass' ? 'pass' : state === 'fail' ? 'fail' : 'none';
      factors.push(entry(target, id, { pass: state === 'pass', state, mode }));
    }
  }

  const failedRequired = factors.filter((f) => f.mode === 'required' && !f.pass);
  const landed = open.opened && failedRequired.length === 0;

  const tells = [];
  if (sender.claimedSender && account.person !== sender.claimedSender) tells.push('senderTrust');
  if (auth.read === 'would-fail') tells.push('senderAuth');
  const info = message.linkInfo;
  if (isStr(message.link) && info && isStr(info.domain) && target.expectedLink &&
      info.domain !== target.expectedLink.realDomain) tells.push('linkCredible');
  if (urgencyOver) tells.push('urgencyCalibrated');

  const hints = arr(target.hints);
  const prior = Number.isInteger(ctx && ctx.priorFailures) && ctx.priorFailures > 0 ? ctx.priorFailures : 0;
  // N4, feedback layer 3: an escalating hint after repeated failures on the same target
  // (04 "Layered, legible feedback", worked example "Hint after the second try"). Shown only
  // on a send that did not land and only once at least one earlier send to this target failed
  // (prior >= 1), so a first miss is not pre-empted. The bridge renders result.hint.
  //
  // H1: the ladder's softest rung is hints[0], shown on the first repeated miss (prior === 1);
  // the index is prior - 1 (not prior), or the ladder's last rung never reaches hints[0].
  const hintIndex = hints.length ? Math.min(Math.max(prior - 1, 0), hints.length - 1) : 0;
  // H1/H2/H3 (lab R3 F3): the first repeated miss (prior === 1) shows the softest ladder rung,
  // hints[0] — a gentle nudge before any specific advice. From the second repeated miss
  // (prior >= 2) a hint keyed to the factor that actually failed takes over, so the advice
  // names the real fault. Without this, every required factor of Pierce and Lord carries a
  // keyed hint, so the keyed hint fired from the first repeated miss and hints[0] was dead
  // content. The ladder (hints[hintIndex]) is still the fallback for a factor with no keyed
  // hint, and for a send that only failed the open check (no required factor to key on).
  const firstFail = failedRequired.length ? failedRequired[0] : null;
  // H3b (lab R4 D6/A3): hints[0] is authored about the first required factor (for Lord,
  // "only trusts the portal's own notices" — senderTrust). On the first repeated miss it is
  // the gentle nudge, but only when the first required factor is the one that failed. If an
  // earlier factor passed and a later one failed (Lord's sender passes, the link fails), the
  // softest rung describes the wrong fault, so show the factor-keyed hint from the first
  // repeated miss instead. When the failing factor has no keyed hint, the ladder still applies.
  const firstRequired = factors.find((f) => f.mode === 'required');
  const firstFactorFailed = !!(firstFail && firstRequired && firstFail.id === firstRequired.id);
  let hint = null;
  if (!landed && prior >= 1) {
    const useKeyed = prior >= 2 || (prior === 1 && !firstFactorFailed);
    const keyed = useKeyed ? selectFactorHint(target, firstFail, header) : null;
    if (isStr(keyed)) hint = keyed;
    else if (hints.length) hint = hints[hintIndex];
  }

  return {
    landed,
    open,
    openLine,
    factors,
    claimedSender: sender.claimedSender,
    fromAccount: message.fromAccount,
    hintIndex,
    hint,
    advisory: { urgency: urgencyRead || 'low', senderAuth: auth.read },
    tells,
    firstFail: failedRequired.length ? failedRequired[0].id : '',
    failCount: failedRequired.length,
    attachment: attachmentState,
    link: linkState
  };
}

// ----------------------------------------------------------- pre-send gate

/**
 * N11 runtime half. Judging starts only on a sendable message. Two blocks, one
 * fixed neutral line (PRE_SEND_GATE_LINE) that never names the blank, value or
 * source: a blank with no held option, or a requiresIntelToAttempt fact not held.
 * A blank that has options but none chosen gets the ordinary "Choose an option".
 * A message blocked here is not judged: nothing is counted or recorded.
 */
export function preSendGate(target, message, ctx, held) {
  const facts = new Set(arr(held && held.facts));
  const options = (held && held.options) || {};
  const slots = (message && message.slots) || {};
  let unchosen = null;
  const parts = ['from', 'greeting', 'pretext', 'ask'];
  const chosenTemplates = (message && message.templates) || {};
  for (const part of parts) {
    const t = template(ctx, chosenTemplates[part]);
    for (const s of arr(t && t.slots)) {
      if (isStr(slots[s.id])) continue;
      const count = Number.isInteger(options[s.id]) ? options[s.id] : 0;
      if (count === 0) return { ok: false, reason: 'empty-blank', line: PRE_SEND_GATE_LINE };
      if (!unchosen) unchosen = s;
    }
  }
  for (const f of arr(target && target.requiresIntelToAttempt)) {
    if (!facts.has(f)) return { ok: false, reason: 'missing-intel', line: PRE_SEND_GATE_LINE };
  }
  if (unchosen) {
    const label = isStr(unchosen.label) ? unchosen.label : unchosen.id;
    return { ok: false, reason: 'unchosen', line: 'Choose an option for the ' + label + ' blank' };
  }
  return { ok: true, reason: null, line: null };
}

// ------------------------------------------------------ data-only reply (N7)

/**
 * The reply for a target with no character (00 section 10, "Timing and delivery"):
 * replies.landed when the message landed, otherwise the fail line of the first failed
 * required factor in library order (the open line when only the open check failed).
 * setGlobal is the target's outcome.setGlobal, to apply on delivery, only on a landing.
 * A target with a character returns text null: its ink writes the reply.
 */
export function dataOnlyReply(target, result) {
  if (target && isStr(target.character)) {
    return { text: null, landed: !!result.landed, firstFail: result.firstFail, setGlobal: null };
  }
  let text;
  if (result.landed) {
    text = pick(target && target.replies && target.replies.landed, 'Thanks, received.');
  } else if (target && target.replies && isStr(target.replies.missed)) {
    text = target.replies.missed; // an in-voice decline, in place of the factor's line (P3 N4)
  } else {
    const first = result.factors.find((f) => f.mode === 'required' && !f.pass);
    text = first ? first.reply : result.openLine;
  }
  const og = target && target.outcome && target.outcome.setGlobal;
  return {
    text,
    landed: !!result.landed,
    firstFail: result.firstFail,
    setGlobal: result.landed && og ? { ...og } : null
  };
}
