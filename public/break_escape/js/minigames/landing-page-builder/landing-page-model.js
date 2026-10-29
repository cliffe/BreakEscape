/**
 * Landing-page builder model (planning_notes/phishing_and_social_engineering/designs
 * 07 sections 4, 5, 6; contract 00 section 11a).
 *
 * A PURE module. It touches no DOM, no window and no other global, imports nothing,
 * and never mutates its arguments. The overlay (07 N1, P5-D/P5-E) and the mail client
 * (01) call these functions; the model holds no state.
 *
 * Safety (07 section 1): this component MODELS a credential-harvest page, it is never one.
 * The model scores and describes a page from ids and booleans only. It reads no password
 * value, serialises nothing, and makes no request. No exported identifier names serialise,
 * export or download (tested by social-landing-page-model). The runtime guard half (N6b)
 * refuses any domain not on the page's authored menu, or whose host does not end `.example`,
 * and reports it blocked so the renderer draws a "blocked" placeholder.
 *
 * Exports
 *   scorePage(pageDef, choices, target) -> ScoreResult | { blocked: true }   (section 4, N6b)
 *       pageDef   the page's entry in social.landingPages (00 section 11)
 *       choices   { brand, purpose, domainId, logo, wording, fields, padlock }
 *       target    the 04 target id (string), or { id, firstName } to fill {firstName}
 *     ScoreResult = { credibility, gatesPassed, meetsThreshold, factors[], gates[],
 *                     tells[], verdict, gateLines[], blocked: false }
 *   guardDomain(pageDef, choices) -> { blocked, reason, domain }              (N6b, one source)
 *   resolveDomainOption(pageDef, choices) -> option | null   (shared with the renderer, N6b)
 *   isDomainBlocked(pageDef, choices) -> boolean             (shared with the renderer, N6b)
 *   buildRecord({ pageId, targetId, choices, credibility, gatesPassed, meetsThreshold })
 *                                                     -> closed record (section 5)
 *   applyScore(existing, fresh) -> closed record (merged; keeps victim and tellsFound)  (section 3)
 *   setBuilt(record, built = true) -> closed record (attach / un-attach; closed keys)
 *   linkInfoFor(record, pageDef, kitId) -> linkInfo | { kitId, state: 'missing' }  (section 4, N10)
 *   describeVictimOutcome(record, target, landed) -> { visited, submitted, noticed }  (section 5, N10)
 *   betterVictim(existing, next) -> the higher-ranked victim record            (section 5, N10)
 *   captureGranted(before, after) -> boolean (first submitted only)            (N11)
 *   Constants: FACTOR_ORDER, RECORD_KEYS, CHOICE_KEYS, TELL_IDS, EXAMPLE_SUFFIX,
 *              DEFAULT_POINTS, DEFAULT_STRINGS.
 */

export const FACTOR_ORDER = Object.freeze([
  'brand', 'purpose', 'domain', 'logo', 'wording', 'form', 'padlock'
]);

// Closed record keys (section 5; 00 section 11a). Nothing else is ever emitted.
export const CHOICE_KEYS = Object.freeze([
  'brand', 'purpose', 'domainId', 'logo', 'wording', 'fields', 'padlock'
]);
export const RECORD_KEYS = Object.freeze([
  'pageId', 'targetId', 'choices', 'credibility', 'gatesPassed', 'meetsThreshold',
  'tellsFound', 'victim', 'built'
]);
// tellsFound is any subset of these nine ids (the seven factor ids plus the two page tells).
export const TELL_IDS = Object.freeze([
  'brand', 'purpose', 'domain', 'logo', 'wording', 'form', 'padlock',
  'formOrigin', 'hoverMismatch'
]);

export const EXAMPLE_SUFFIX = '.example';

// Full-value points (section 4); partials are fixed by the doc and derived below.
export const DEFAULT_POINTS = Object.freeze({
  brand: 15, purpose: 10, domain: Object.freeze([0, 10, 22, 35]),
  logo: 10, wording: 10, form: 10, padlock: 10
});

const LOGO_PARTIAL = 4;   // blurry or stretched (section 4: fixed 4)
const FORM_MISSING = 4;   // a real field missing (section 4: fixed 4)

// Fake-check mode (ENG-03b). A page on a genuine but compromised site has no look-alike
// domain, so it is scored on four persuasion factors instead of the seven sign-in ones.
// The one tell every fake check carries, however it scores, is fake_check_paste: the page
// must still tell the visitor to paste and run something.
export const CHECK_FACTOR_ORDER = Object.freeze(['borrowedTrust', 'pretext', 'stepWording', 'urgency']);
export const CHECK_DEFAULT_POINTS = Object.freeze({ borrowedTrust: 35, pretext: 25, stepWording: 25, urgency: 15 });
export const CHECK_DEFAULT_STRINGS = Object.freeze({
  verdictLow: 'That wouldn’t fool anyone.',
  verdictMid: 'Some people would pause. Not {firstName}.',
  verdictHigh: 'Convincing enough that {firstName} would follow the steps.',
  borrowedTrustGenuine: '✓ Host: the page sits on the site {firstName} already trusts and has bookmarked.',
  borrowedTrustLookalike: '~ Host: a look-alike site. Convincing, but it is not the address {firstName} knows.',
  borrowedTrustUnrelated: '✗ Host: an unrelated page {firstName} has no reason to trust.',
  pretextPass: '✓ Reason: fits exactly what {firstName} came to do.',
  pretextPartial: '~ Reason: a generic reason that does not match the visit.',
  pretextFail: '✗ Reason: off-topic. It gives {firstName} no reason to act.',
  stepWordingPass: '✓ Steps: worded as a smooth, routine check.',
  stepWordingFail: '✗ Steps: clumsy. The demand to act on the computer stands out.',
  urgencyPass: '✓ Pace: one quiet step, so a careful visitor does not stop to think.',
  urgencyHigh: '~ Pace: heavy pressure makes a careful visitor pause.',
  defFakeCheckPaste: 'However genuine the site, the page still has to tell you to paste and run something. No real check ever does.'
});

// Default feedback strings (section 4 tables). Overridable per scenario via pageDef.strings,
// using only {firstName}, {shown}, {real}, {linkText}. Builder lines are shown in the score
// panel; defender lines are the step-6 lines shown by the builder only.
export const DEFAULT_STRINGS = Object.freeze({
  verdictLow: 'That wouldn’t fool anyone.',
  verdictMid: 'Some people would fall for it. Not {firstName}.',
  verdictHigh: 'Convincing enough for {firstName}.',
  // Over the threshold on looks, but the Brand row fails (a target with brandGate off): the
  // verdict must not call it convincing beside "doesn't use that service" (P4-4).
  verdictHighBrandFail: 'Close enough to pass a quick look, but {firstName} doesn’t use that service.',
  gateBrand: '{firstName} doesn’t use that service. They wouldn’t open it.',
  gateCareful: '{firstName} reads addresses carefully. This one isn’t close enough.',

  brandPass: '✓ Brand: this is the service {firstName} actually uses.',
  brandFail: '✗ Brand: {firstName} doesn’t use that service.',
  brandUnset: '✗ Brand: no service chosen yet. Pick the one {firstName} uses.',
  purposePass: '✓ Page: a payslip notice is what the email promised.',
  purposePartial: '~ Page: a plain sign-in is believable but isn’t what the email promised.',
  purposeFail: '✗ Page: this isn’t what the email said would be here.',
  domainTier3: '✓ Address: very close to the real one. You would need to look twice.',
  domainTier2: '~ Address: close, but the extra part gives it away to anyone who reads it.',
  domainTier1: '~ Address: one letter is wrong. A careful reader will spot it.',
  domainTier0: '✗ Address: nothing like the real service.',
  logoPass: '✓ Logo: sharp and the right shape.',
  logoBlurry: '~ Logo: blurry. Official logos are sharp.',
  logoStretched: '~ Logo: stretched out of proportion.',
  logoFail: '✗ Logo: missing.',
  wordingPass: '✓ Wording: reads like the company’s own notices.',
  wordingPartial: '~ Wording: generic. It has no company voice.',
  wordingFail: '✗ Wording: spelling and grammar slips.',
  formPass: '✓ Form: asks for the same details as the real sign-in.',
  formMissing: '~ Form: the real sign-in also asks for something this one leaves out.',
  formExtra: '~ Form: asks for a field the real sign-in does not use.',
  formFail: '✗ Form: asks for more than a sign-in ever should.',
  padlockPass: '✓ Padlock: shown. (It would be shown on any address with a certificate, real or not.)',
  padlockFail: '✗ Padlock: missing. The browser says “Not secure”.',

  defBrand: 'The page names a service you do not use.',
  defPurposePartial: 'The email promised one thing and the page asks for another.',
  defPurposeFail: 'The page does not match the message that sent you to it.',
  defDomainTier3: 'The address is {shown}, not {real}. Compare every letter.',
  defDomainTier2: 'The address is {shown}, not {real}. Read it from the right.',
  defDomainTier1: 'The address is {shown}, not {real}. One letter is wrong.',
  defDomainTier0: 'The address has no connection to the service it claims to be.',
  defLogoBlurry: 'The logo is blurry or pixelated.',
  defLogoStretched: 'The logo is stretched or the wrong shape.',
  defLogoFail: 'There is no logo, where the real page always has one.',
  defWordingPartial: 'The wording is generic where the real service is specific.',
  defWordingFail: 'Spelling and grammar mistakes in a “professional” page.',
  defFormMissing: 'The sign-in is missing a step the real one has.',
  defFormExtra: 'The sign-in asks for a field the real one does not use.',
  defFormFail: 'A sign-in page asking for card or national insurance numbers.',
  defPadlock: 'The browser warns “Not secure” on a page asking for a password.',

  tellFormOrigin: 'The form belongs to {shown}, not to {real}. Whoever owns that address receives what you type.',
  tellHoverMismatch: 'The link in the email says {linkText} but hovering shows {shown}.',
  padlockDecoy: 'Fine. But a padlock is on the fake page too. It only means the connection is private to whoever owns this address.',
  blockedAddress: 'Blocked address',

  // Builder chrome (landing-page-builder-minigame.js), overridable like the lines above.
  lockedDomainNote: 'You don’t own this. Only the company does.',
  blockBadSuffix: 'This address is not allowed in the lab. Pick one from the list of look-alike addresses.',
  attachLabel: 'Attach to email',
  attachAnywayLabel: 'Attach anyway',
  padlockNote: 'A padlock means the connection is private to whoever owns the address. Fake sites can show one too.',
  pretextNote: 'The page has to match the story the email told. Pick the service, the reason and the wording this ' +
    'person is already expecting, or it will not ring true.'
});

/** One string: pageDef.strings[key] when it is a non-empty string, else the default. */
export function pageString(pageDef, key) {
  const over = pageDef && isObj(pageDef.strings) ? pageDef.strings[key] : undefined;
  const s = (typeof over === 'string' && over.length) ? over : DEFAULT_STRINGS[key];
  return typeof s === 'string' ? s : '';
}

// ------------------------------------------------------------------ helpers

function isObj(v) { return v != null && typeof v === 'object' && !Array.isArray(v); }
function arr(v) { return Array.isArray(v) ? v : []; }
function half(n) { return Math.round((Number(n) || 0) / 2); }

/**
 * Host part of an address: drop any scheme, take everything before the first host
 * terminator. A path '/', a query '?' or a fragment '#' all end the host, so query or
 * fragment text cannot smuggle a '.example' suffix onto a different host (N6b hardening).
 */
function hostOf(address) {
  let s = String(address == null ? '' : address);
  const scheme = s.indexOf('://');
  if (scheme >= 0) s = s.slice(scheme + 3);
  const end = s.search(/[/?#]/);
  if (end >= 0) s = s.slice(0, end);
  return s;
}

/** Find a domain option by id, in the chosen brand first, then any brand. */
function findDomainOption(pageDef, brandId, domainId) {
  if (!isObj(pageDef) || domainId == null) return null;
  const brands = arr(pageDef.brands);
  const chosen = brands.find((b) => b && b.id === brandId);
  const inBrand = (b) => arr(b && b.domains).find((d) => d && d.id === domainId) || null;
  return (chosen && inBrand(chosen)) || brands.map(inBrand).find(Boolean) || null;
}

function brandById(pageDef, brandId) {
  return arr(pageDef && pageDef.brands).find((b) => b && b.id === brandId) || null;
}

function str(pageDef, key) {
  const over = pageDef && isObj(pageDef.strings) ? pageDef.strings[key] : undefined;
  const s = (typeof over === 'string' && over.length) ? over : DEFAULT_STRINGS[key];
  return typeof s === 'string' ? s : '';
}

function fill(s, ctx) {
  if (typeof s !== 'string') return s;
  return s
    .replace(/\{firstName\}/g, ctx.firstName != null ? ctx.firstName : '{firstName}')
    .replace(/\{shown\}/g, ctx.shown != null ? ctx.shown : '{shown}')
    .replace(/\{real\}/g, ctx.real != null ? ctx.real : '{real}')
    .replace(/\{linkText\}/g, ctx.linkText != null ? ctx.linkText : '{linkText}');
}

function points(pageDef) {
  const p = isObj(pageDef) && isObj(pageDef.points) ? pageDef.points : {};
  return {
    brand: p.brand == null ? DEFAULT_POINTS.brand : p.brand,
    purpose: p.purpose == null ? DEFAULT_POINTS.purpose : p.purpose,
    domain: Array.isArray(p.domain) ? p.domain : DEFAULT_POINTS.domain,
    logo: p.logo == null ? DEFAULT_POINTS.logo : p.logo,
    wording: p.wording == null ? DEFAULT_POINTS.wording : p.wording,
    form: p.form == null ? DEFAULT_POINTS.form : p.form,
    padlock: p.padlock == null ? DEFAULT_POINTS.padlock : p.padlock
  };
}

// --------------------------------------------------------------- guard (N6b)

/**
 * The model/renderer refuse a domain that is not on the page's authored menu, or whose
 * host does not end `.example` (07 section 1, N6b). A suffix and membership check only;
 * it cannot judge brands, which the offline lint (N6) carries.
 */
export function guardDomain(pageDef, choices) {
  const domainId = choices && choices.domainId;
  const option = findDomainOption(pageDef, choices && choices.brand, domainId);
  if (!option) return { blocked: true, reason: 'off-menu', domain: null };
  const host = hostOf(option.domain);
  if (!host.endsWith(EXAMPLE_SUFFIX)) {
    return { blocked: true, reason: 'bad-suffix', domain: option.domain };
  }
  return { blocked: false, reason: null, domain: option.domain };
}

/**
 * The chosen domain option resolved from a record's `choices` (N6b). A thin wrapper over
 * the private findDomainOption, exported so the preview renderer (landing-page-render.js)
 * shares this one resolver instead of keeping its own copy. Returns the option object, or
 * null when the id is not on the authored menu.
 */
export function resolveDomainOption(pageDef, choices) {
  return findDomainOption(pageDef, choices && choices.brand, choices && choices.domainId);
}

/**
 * Boolean form of the N6b guard for the renderer: true when the chosen domain is off the
 * authored menu, or its host does not end `.example`. Same rule and same source as
 * guardDomain, so the model and the renderer can never drift apart (P5-R single-source).
 */
export function isDomainBlocked(pageDef, choices) {
  return guardDomain(pageDef, choices).blocked;
}

// --------------------------------------------------------------- per factor

function scoreBrand(pageDef, choices, p) {
  const pretextBrand = pageDef && isObj(pageDef.pretext) ? pageDef.pretext.brandId : undefined;
  const pass = choices.brand != null && choices.brand === pretextBrand;
  // No pick yet reads as "not chosen", not as the wrong service (lab R9 F11). Same
  // result and points as a wrong pick; only the builder line differs.
  const unset = choices.brand == null;
  return {
    id: 'brand', result: pass ? 'pass' : 'fail', variant: pass ? 'pass' : (unset ? 'unset' : 'fail'),
    points: pass ? p.brand : 0, gateBrand: pass
  };
}

function scorePurpose(pageDef, choices, p) {
  const want = pageDef && isObj(pageDef.pretext) ? pageDef.pretext.purposeId : undefined;
  if (choices.purpose != null && choices.purpose === want) {
    return { id: 'purpose', result: 'pass', variant: 'pass', points: p.purpose };
  }
  if (choices.purpose === 'signin') {
    return { id: 'purpose', result: 'partial', variant: 'partial', points: half(p.purpose) };
  }
  return { id: 'purpose', result: 'fail', variant: 'fail', points: 0 };
}

function scoreDomain(pageDef, choices, p) {
  const option = findDomainOption(pageDef, choices.brand, choices.domainId);
  const tier = option && Number.isInteger(option.tier) ? option.tier : 0;
  const table = p.domain;
  const pts = (tier >= 0 && tier < table.length) ? table[tier] : 0;
  const result = tier >= 3 ? 'pass' : (tier >= 1 ? 'partial' : 'fail');
  return { id: 'domain', result, variant: 'tier' + tier, points: pts, tier };
}

function scoreLogo(pageDef, choices, p) {
  if (choices.logo === 'crisp') return { id: 'logo', result: 'pass', variant: 'pass', points: p.logo };
  if (choices.logo === 'blurry') return { id: 'logo', result: 'partial', variant: 'blurry', points: LOGO_PARTIAL };
  if (choices.logo === 'stretched') return { id: 'logo', result: 'partial', variant: 'stretched', points: LOGO_PARTIAL };
  return { id: 'logo', result: 'fail', variant: 'fail', points: 0 };
}

function scoreWording(pageDef, choices, p) {
  const option = arr(pageDef && pageDef.wordings).find((w) => w && w.id === choices.wording);
  if (option && option.match === true) {
    return { id: 'wording', result: 'pass', variant: 'pass', points: p.wording };
  }
  if (option && option.slips === true) {
    return { id: 'wording', result: 'fail', variant: 'fail', points: 0 };
  }
  // Any other authored (non-matching, non-slips) variant is generic.
  return { id: 'wording', result: 'partial', variant: 'partial', points: half(p.wording) };
}

function scoreForm(pageDef, choices, p) {
  const brand = brandById(pageDef, choices.brand);
  const real = new Set(arr(brand && brand.realFields));
  const sensitive = new Set(arr(pageDef && pageDef.extraSensitiveFields));
  const chosen = arr(choices.fields);
  // 1. any extra sensitive field (beyond the real set) -> 0
  if (chosen.some((f) => sensitive.has(f) && !real.has(f))) {
    return { id: 'form', result: 'fail', variant: 'fail', points: 0 };
  }
  // 2. a real field missing -> 4
  let missing = false;
  real.forEach((f) => { if (!chosen.includes(f)) missing = true; });
  if (missing) return { id: 'form', result: 'partial', variant: 'missing', points: FORM_MISSING };
  // 3. an extra non-sensitive field -> half
  if (chosen.some((f) => !real.has(f))) {
    return { id: 'form', result: 'partial', variant: 'extra', points: half(p.form) };
  }
  // 4. exactly the real fields -> full
  return { id: 'form', result: 'pass', variant: 'pass', points: p.form };
}

function scorePadlock(choices, p) {
  const on = choices.padlock === true;
  return { id: 'padlock', result: on ? 'pass' : 'fail', variant: on ? 'pass' : 'fail', points: on ? p.padlock : 0 };
}

// Builder line and defender line for a scored factor.
const BUILDER_KEY = {
  'brand.pass': 'brandPass', 'brand.fail': 'brandFail', 'brand.unset': 'brandUnset',
  'purpose.pass': 'purposePass', 'purpose.partial': 'purposePartial', 'purpose.fail': 'purposeFail',
  'domain.tier3': 'domainTier3', 'domain.tier2': 'domainTier2', 'domain.tier1': 'domainTier1', 'domain.tier0': 'domainTier0',
  'logo.pass': 'logoPass', 'logo.blurry': 'logoBlurry', 'logo.stretched': 'logoStretched', 'logo.fail': 'logoFail',
  'wording.pass': 'wordingPass', 'wording.partial': 'wordingPartial', 'wording.fail': 'wordingFail',
  'form.pass': 'formPass', 'form.missing': 'formMissing', 'form.extra': 'formExtra', 'form.fail': 'formFail',
  'padlock.pass': 'padlockPass', 'padlock.fail': 'padlockFail'
};
const DEFENDER_KEY = {
  'brand.fail': 'defBrand', 'brand.unset': 'defBrand',
  'purpose.partial': 'defPurposePartial', 'purpose.fail': 'defPurposeFail',
  'domain.tier3': 'defDomainTier3', 'domain.tier2': 'defDomainTier2', 'domain.tier1': 'defDomainTier1', 'domain.tier0': 'defDomainTier0',
  'logo.blurry': 'defLogoBlurry', 'logo.stretched': 'defLogoStretched', 'logo.fail': 'defLogoFail',
  'wording.partial': 'defWordingPartial', 'wording.fail': 'defWordingFail',
  'form.missing': 'defFormMissing', 'form.extra': 'defFormExtra', 'form.fail': 'defFormFail',
  'padlock.fail': 'defPadlock'
};

// ---------------------------------------------------- fake-check scorer (ENG-03b)

/** One fake-check string: pageDef.check.strings[key], else the built default. */
function checkStr(pageDef, key) {
  const s = isObj(pageDef) && isObj(pageDef.check) ? pageDef.check.strings : null;
  const over = isObj(s) ? s[key] : undefined;
  const val = (typeof over === 'string' && over.length) ? over : CHECK_DEFAULT_STRINGS[key];
  return typeof val === 'string' ? val : '';
}

function checkPoints(pageDef) {
  const p = isObj(pageDef) && isObj(pageDef.check) && isObj(pageDef.check.points) ? pageDef.check.points : {};
  const out = {};
  for (const id of CHECK_FACTOR_ORDER) out[id] = p[id] == null ? CHECK_DEFAULT_POINTS[id] : Number(p[id]) || 0;
  return out;
}

function optById(list, id) {
  return arr(list).find((o) => isObj(o) && o.id === id) || null;
}

/**
 * Score a fake "verify you are human" check (ENG-03b). Pure. Same result shape as scorePage.
 * The four factors read the chosen menu entries from choices.check; the host's trust flag and
 * the match/slips flags on the pretext/steps/urgency entries decide full/partial/zero, mirroring
 * how scoreWording reads match/slips. The always-present fake_check_paste tell is appended.
 */
export function scoreFakeCheck(pageDef, choices, target) {
  const def = isObj(pageDef) ? pageDef : {};
  const check = isObj(def.check) ? def.check : {};
  const sel = isObj(choices) && isObj(choices.check) ? choices.check : {};
  const p = checkPoints(def);
  const targetId = isObj(target) ? target.id : target;
  const firstName = isObj(target) ? target.firstName : undefined;
  const cfg = (isObj(def.targets) && isObj(def.targets[targetId])) ? def.targets[targetId] : {};
  const ctx = { firstName };

  // borrowedTrust: the host's authored trust flag (genuine | lookalike | unrelated).
  const hostOpt = optById(check.hosts, sel.hostId);
  const trust = hostOpt && isStrLike(hostOpt.trust) ? hostOpt.trust : 'unrelated';
  const borrowed = trust === 'genuine'
    ? { result: 'pass', points: p.borrowedTrust, line: 'borrowedTrustGenuine' }
    : trust === 'lookalike'
      ? { result: 'partial', points: half(p.borrowedTrust), line: 'borrowedTrustLookalike' }
      : { result: 'fail', points: 0, line: 'borrowedTrustUnrelated' };

  // pretext: match -> full, slips -> 0, else generic half.
  const pretextOpt = optById(check.pretexts, sel.pretextId);
  const pretext = pretextOpt && pretextOpt.match === true
    ? { result: 'pass', points: p.pretext, line: 'pretextPass' }
    : pretextOpt && pretextOpt.slips === true
      ? { result: 'fail', points: 0, line: 'pretextFail' }
      : { result: 'partial', points: half(p.pretext), line: 'pretextPartial' };

  // stepWording: smooth (match) -> full, clumsy (slips or not match) -> 0.
  const stepOpt = optById(check.steps, sel.stepsId);
  const steps = stepOpt && stepOpt.match === true
    ? { result: 'pass', points: p.stepWording, line: 'stepWordingPass' }
    : { result: 'fail', points: 0, line: 'stepWordingFail' };

  // urgency: a calm one-step check (match) -> full; heavy pressure -> half (it makes a careful
  // visitor pause).
  const urgencyOpt = optById(check.urgencies, sel.urgencyId);
  const urgency = urgencyOpt && urgencyOpt.match === true
    ? { result: 'pass', points: p.urgency, line: 'urgencyPass' }
    : { result: 'partial', points: half(p.urgency), line: 'urgencyHigh' };

  const byId = { borrowedTrust: borrowed, pretext, stepWording: steps, urgency };
  let credibility = 0;
  const factors = CHECK_FACTOR_ORDER.map((id) => {
    const f = byId[id];
    credibility += f.points;
    return { id, result: f.result, points: f.points, line: fill(checkStr(def, f.line), ctx), defenderLine: null };
  });

  const threshold = Number(cfg.linkThreshold);
  const meetsThreshold = Number.isFinite(threshold) && credibility >= threshold;

  let verdict;
  if (credibility < 40) verdict = fill(checkStr(def, 'verdictLow'), ctx);
  else if (!meetsThreshold) verdict = fill(checkStr(def, 'verdictMid'), ctx);
  else verdict = fill(checkStr(def, 'verdictHigh'), ctx);

  const tells = [{ id: 'fake_check_paste', line: fill(checkStr(def, 'defFakeCheckPaste'), ctx) }];

  return { credibility, gatesPassed: true, meetsThreshold, factors, gates: [], tells, verdict, gateLines: [], blocked: false };
}

function isStrLike(v) { return typeof v === 'string' && v.length > 0; }

// ------------------------------------------------------------- scorePage (N2)

/**
 * Score a page from its definition and the player's choices (section 4). Pure and
 * deterministic. Returns { blocked: true } when the chosen domain fails the runtime
 * guard (N6b), so the overlay draws a blocked placeholder and never scores an off-menu
 * or non-.example address.
 */
export function scorePage(pageDef, choices, target) {
  // Fake-check mode (ENG-03b): no look-alike domain, so the domain guard does not apply and a
  // parallel four-factor persuasion scorer runs. Same result shape as the sign-in path.
  if (isObj(pageDef) && pageDef.pageType === 'fakeCheck') {
    return scoreFakeCheck(pageDef, choices, target);
  }

  const guard = guardDomain(pageDef, choices);
  if (guard.blocked) return { blocked: true };

  const c = choices || {};
  const p = points(pageDef);
  const targetId = isObj(target) ? target.id : target;
  const firstName = isObj(target) ? target.firstName : undefined;
  const cfg = (pageDef && isObj(pageDef.targets) && isObj(pageDef.targets[targetId]))
    ? pageDef.targets[targetId] : {};

  const brand = brandById(pageDef, c.brand);
  const pretextBrand = brandById(pageDef, pageDef && isObj(pageDef.pretext) ? pageDef.pretext.brandId : undefined);
  const chosenOption = findDomainOption(pageDef, c.brand, c.domainId);
  const ctx = {
    firstName,
    shown: chosenOption ? chosenOption.domain : undefined,
    real: pretextBrand ? pretextBrand.realDomain : (brand ? brand.realDomain : undefined),
    linkText: pageDef ? pageDef.linkText : undefined
  };

  const scored = {
    brand: scoreBrand(pageDef, c, p),
    purpose: scorePurpose(pageDef, c, p),
    domain: scoreDomain(pageDef, c, p),
    logo: scoreLogo(pageDef, c, p),
    wording: scoreWording(pageDef, c, p),
    form: scoreForm(pageDef, c, p),
    padlock: scorePadlock(c, p)
  };

  let credibility = 0;
  const factors = FACTOR_ORDER.map((id) => {
    const f = scored[id];
    credibility += f.points;
    const bKey = BUILDER_KEY[id + '.' + f.variant];
    const dKey = DEFENDER_KEY[id + '.' + f.variant];
    return {
      id, result: f.result, points: f.points,
      line: fill(str(pageDef, bKey), ctx),
      defenderLine: dKey ? fill(str(pageDef, dKey), ctx) : null
    };
  });

  // Gates (section 4). Careful-reader active when minDomainTier is a positive number;
  // brand gate active unless the target turns it off (awareness).
  const gates = [];
  if (cfg.brandGate !== false) {
    const passed = scored.brand.gateBrand === true;
    gates.push({ id: 'brand', passed, line: passed ? null : fill(str(pageDef, 'gateBrand'), ctx) });
  }
  const minTier = Number(cfg.minDomainTier);
  if (Number.isFinite(minTier) && minTier > 0) {
    const passed = scored.domain.tier >= minTier;
    gates.push({ id: 'careful', passed, line: passed ? null : fill(str(pageDef, 'gateCareful'), ctx) });
  }
  const gatesPassed = gates.every((g) => g.passed);
  const threshold = Number(cfg.linkThreshold);
  const meetsThreshold = Number.isFinite(threshold) && credibility >= threshold && gatesPassed;

  // Verdict band (section 4). A failed gate adds its line underneath; it never replaces the band.
  let verdict;
  if (credibility < 40) verdict = fill(str(pageDef, 'verdictLow'), ctx);
  else if (!meetsThreshold) verdict = fill(str(pageDef, 'verdictMid'), ctx);
  else verdict = fill(str(pageDef, scored.brand.result === 'pass' ? 'verdictHigh' : 'verdictHighBrandFail'), ctx);
  const gateLines = gates.filter((g) => !g.passed).map((g) => g.line);

  // Step-6 tells for the current choices: every factor with a defender line (domain always
  // has one), plus the two tells every page carries (section 4). tellsFound subsets these.
  const tells = [];
  factors.forEach((f) => {
    if (f.id === 'domain' || (f.result !== 'pass' && f.defenderLine)) {
      tells.push({ id: f.id, line: f.defenderLine });
    }
  });
  tells.push({ id: 'formOrigin', line: fill(str(pageDef, 'tellFormOrigin'), ctx) });
  tells.push({ id: 'hoverMismatch', line: fill(str(pageDef, 'tellHoverMismatch'), ctx) });

  return { credibility, gatesPassed, meetsThreshold, factors, gates, tells, verdict, gateLines, blocked: false };
}

// ------------------------------------------------------- record shape (section 5)

function normChoices(choices) {
  const c = choices || {};
  const out = {
    brand: c.brand == null ? null : c.brand,
    purpose: c.purpose == null ? null : c.purpose,
    domainId: c.domainId == null ? null : c.domainId,
    logo: c.logo == null ? null : c.logo,
    wording: c.wording == null ? null : c.wording,
    fields: arr(c.fields).slice(),
    padlock: c.padlock === true
  };
  // Fake-check choices (ENG-03b). Emitted ONLY when present, so a sign-in record is byte-
  // identical (no `check` key) and the N2/parity guards are unaffected. The shape is closed to
  // the four menu ids; nothing else is copied.
  if (isObj(c.check)) {
    out.check = {
      hostId: c.check.hostId == null ? null : c.check.hostId,
      pretextId: c.check.pretextId == null ? null : c.check.pretextId,
      urgencyId: c.check.urgencyId == null ? null : c.check.urgencyId,
      stepsId: c.check.stepsId == null ? null : c.check.stepsId
    };
  }
  return out;
}

function normVictim(v) {
  if (!isObj(v)) return null;
  const out = { visited: v.visited === true, submitted: v.submitted === true, noticed: v.noticed === true };
  // The domain the page used on the send that produced this outcome, so the report can name
  // the page that actually landed rather than the last page attached (lab R1 F9 / F8-b).
  if (typeof v.domainId === 'string' && v.domainId) out.domainId = v.domainId;
  return out;
}

function normTellsFound(list) {
  const seen = new Set();
  const out = [];
  arr(list).forEach((id) => {
    if (TELL_IDS.includes(id) && !seen.has(id)) { seen.add(id); out.push(id); }
  });
  return out;
}

/**
 * A fresh page record from a Score (section 5). built is false; victim null; tellsFound []
 * until a send and a step-6 inspection fill them. Only the closed keys are emitted.
 */
export function buildRecord(input) {
  const i = input || {};
  return {
    pageId: i.pageId == null ? null : i.pageId,
    targetId: i.targetId == null ? null : i.targetId,
    choices: normChoices(i.choices),
    credibility: Number(i.credibility) || 0,
    gatesPassed: i.gatesPassed === true,
    meetsThreshold: i.meetsThreshold === true,
    tellsFound: normTellsFound(i.tellsFound),
    victim: normVictim(i.victim),
    built: i.built === true
  };
}

/**
 * Merge a fresh Score (section 3) onto an existing record. Updates choices, credibility,
 * gatesPassed, meetsThreshold, targetId and sets built: false; PRESERVES victim and
 * tellsFound (only betterVictim changes victim, only step 6 changes tellsFound). Only the
 * closed keys are emitted.
 */
export function applyScore(existing, fresh) {
  const f = fresh || {};
  const prev = isObj(existing) ? existing : null;
  return {
    pageId: f.pageId == null ? (prev ? prev.pageId : null) : f.pageId,
    targetId: f.targetId == null ? (prev ? prev.targetId : null) : f.targetId,
    choices: normChoices(f.choices),
    credibility: Number(f.credibility) || 0,
    gatesPassed: f.gatesPassed === true,
    meetsThreshold: f.meetsThreshold === true,
    tellsFound: normTellsFound(prev ? prev.tellsFound : []),
    victim: prev ? normVictim(prev.victim) : null,
    built: false
  };
}

/** Attach (or un-attach) a record (section 4), keeping the closed key set. */
export function setBuilt(record, built) {
  const r = buildRecord(record);
  r.built = built !== false;
  return r;
}

// --------------------------------------------------------- link info (N10)

/**
 * The linkInfo the mail client puts on a message (section 4; 00 section 11a). Returns the
 * missing state when there is no record or its built flag is false, so linkCredible fails
 * with "there's no page behind that link". domain and browserDomain are read from pageDef by
 * the record's domainId.
 */
export function linkInfoFor(record, pageDef, kitId) {
  if (!isObj(record) || record.built !== true) {
    return { kitId: kitId == null ? null : kitId, state: 'missing' };
  }
  // Fake-check page (ENG-03b): no look-alike domain, so there is no domain option to resolve. The
  // page sits on the authored genuine site (check.host), and the chosen host-option id rides back
  // out. E10 sends a link-less lure, so the mail client never reads a link domain from this.
  if (isObj(pageDef) && pageDef.pageType === 'fakeCheck') {
    const check = isObj(pageDef.check) ? pageDef.check : {};
    const sel = record.choices && isObj(record.choices.check) ? record.choices.check : {};
    const out = {
      kitId: kitId == null ? null : kitId,
      pageId: record.pageId,
      pageType: 'fakeCheck',
      host: typeof check.host === 'string' ? check.host : null,
      hostId: sel.hostId == null ? null : sel.hostId,
      credibility: Number(record.credibility) || 0,
      gatesPassed: record.gatesPassed === true,
      meetsThreshold: record.meetsThreshold === true
    };
    return out;
  }
  const option = findDomainOption(pageDef, record.choices && record.choices.brand, record.choices && record.choices.domainId);
  const out = {
    kitId: kitId == null ? null : kitId,
    pageId: record.pageId,
    domainId: record.choices ? record.choices.domainId : null,
    domain: option ? option.domain : null,
    credibility: Number(record.credibility) || 0,
    gatesPassed: record.gatesPassed === true,
    meetsThreshold: record.meetsThreshold === true
  };
  if (option && option.browserDomain != null) out.browserDomain = option.browserDomain;
  // Which service (brand) the page imitates, so a miss can say "that's the wrong service".
  if (record.choices && typeof record.choices.brand === 'string' && record.choices.brand) out.brand = record.choices.brand;
  return out;
}

// ------------------------------------------------------- victim outcome (N10)

/**
 * The deterministic victim outcome for one send that carries the page (section 5 table),
 * from the record's meetsThreshold and whether the email landed. No randomness.
 */
export function describeVictimOutcome(record, target, landed) {
  const meets = isObj(record) && record.meetsThreshold === true;
  const didLand = landed === true;
  // Carry the domain this send used, so betterVictim keeps the landed page's domain with its
  // outcome and the report names that page, not the last one attached (lab R1 F9 / F8-b). Only
  // added when the record names a domain, so an outcome with no domain keeps its three-key shape.
  const domainId = isObj(record) && record.choices && typeof record.choices.domainId === 'string' && record.choices.domainId
    ? { domainId: record.choices.domainId } : null;
  if (meets && didLand) return { visited: true, submitted: true, noticed: false, ...domainId };
  if (!meets) return { visited: true, submitted: false, noticed: true, ...domainId };
  return { visited: false, submitted: false, noticed: false, ...domainId };
}

function victimRank(v) {
  if (!isObj(v)) return 0;
  if (v.submitted === true) return 2;
  if (v.noticed === true) return 1;
  return 0;
}

/**
 * Keep the best victim outcome across sends (section 5): submitted > noticed > nothing.
 * Returns next only when its rank strictly beats the existing rank, otherwise existing. A
 * resend that does not land, or a later below-threshold send, never erases an earlier
 * success; and an equal-rank resend returns the existing record unchanged, so the bridge's
 * `next !== before` write-back is skipped and an identical state is not re-synced (P5-R F1).
 * When there is no existing record yet (null/junk), the send's outcome is written even at
 * rank 0, so a send that carries the page always leaves a victim record and the report's
 * `sent = !!victim` reads true (00 §11a).
 */
export function betterVictim(existing, next) {
  if (!isObj(existing)) return next;
  return victimRank(next) > victimRank(existing) ? next : existing;
}

/**
 * Whether the capture note is added this send (N11): the first time the stored outcome
 * becomes submitted. before and after are the stored victim objects (or null). A repeat or a
 * noticed send adds nothing.
 */
export function captureGranted(before, after) {
  return isObj(after) && after.submitted === true && !(isObj(before) && before.submitted === true);
}

// ── Form-field labels ─────────────────────────────────────────────────────────────
// The labels for the form-field ids a page may ask for (07 §3 step 6, 00 §1). One map for the
// builder's chips, the rendered page and the episode flip. A page overrides any of them with
// pageDef.fieldLabels ({ <fieldId>: label }).

export const FIELD_LABELS = Object.freeze({
    email: 'Email',
    password: 'Password',
    one_time_code: 'One-time code',
    card_number: 'Card number',
    ni_number: 'National insurance number'
});

// The episode flip's text list has always read these two longer. Kept as its own layer so
// the awareness flip shows what it did before; delete it to use the builder's wording there.
export const FLIP_FIELD_LABELS = Object.freeze({
    email: 'Email address',
    ni_number: 'National Insurance number'
});

/** The label for a field id: pageDef.fieldLabels, then (flip only) the flip wording, then the shared map, then the id. */
export function fieldLabel(id, pageDef, { flip = false } = {}) {
    const own = pageDef && pageDef.fieldLabels && typeof pageDef.fieldLabels === 'object' ? pageDef.fieldLabels[id] : null;
    if (typeof own === 'string' && own) return own;
    if (flip && FLIP_FIELD_LABELS[id]) return FLIP_FIELD_LABELS[id];
    return FIELD_LABELS[id] || id;
}
