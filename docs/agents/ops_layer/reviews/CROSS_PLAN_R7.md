# Ops layer plans: cross-plan delta check, round 7

Scope: `git diff 3c3970c31 HEAD -- docs/achitechture/` (seven plans, 73 added lines) against
`CROSS_PLAN_R6.md` and `CROSS_PLAN_R6_DECISIONS.md`. Short names as in R6. No plan was edited.

Counts: 0 blockers, 0 majors, 2 minors, 3 nits. Verdict: **settled** (the minors are wording, not
contradictions; fix them with the next plan edit).

## R6 findings closed

- **M1 (saved connection at an MFA PC).** CORE:1974-1978 (request 4) and MFA:952 (test row) now say
  422 `typeToSignIn: "second_step"`, no session, no pending record, then the typed password answers
  `mfaRequired`. MFA:371-374 (rule), :954, :1008 (F15) and M1a's done-when say the same. PRIV, LOCK,
  CRACK, LOG and SKIN do not mention `mfaRequired` or the saved-connection refusal, so nothing in
  them can disagree. Closed.
- **m1 (refusal-code file).** Count is 12 (CORE:1181, network routes) + 2 (CRACK:497-499, S7) + 3
  (PRIV:745-748, S5b) = 17. "seventeen" appears nowhere, which is fine; every stated number is
  twelve, scoped to the network routes: CORE:1181-1186, CORE:2006 (skin-request parenthesis), SKIN:135.
  No "fourteen" remains (CRACK:842-845 now points at CORE's paragraph). SKIN:630, :1183, :1275,
  :1519 say "each code in the file". PRIV has the collect panel read `REFUSAL_TEXT`. LOG:614's
  "twelve" is an unrelated attempt count. Closed.
- **m2.** CRACK:360-366 names the sources exactly and excludes `<npcId>.reset`; S8b-time test row at
  CRACK:650-653. Closed (see n1 for two stale phrases).
- **m3.** PRIV:780-781 says `keyring_for_client(...)[:rev]` with the equals-next-`GET /keyring` test.
  Closed (see n2).
- **m4.** MFA:529-532 and :1146-1147 now say the crack reads `creds.password` and the collect yields
  no password; agrees with PRIV:803, :1329, :1357. Closed (see m-a for a misattribution).
- **m5.** PRIV:279-282 and CRACK:204-207, :611, :884 agree: habit enum is `strong guessable reused`;
  `common` is recipe-only. Closed in both plans.
- **m6.** PRIV:888-892 area now defers to CRACK's "class resolves" rule; no duplicate rule left.
  Closed.
- **m7.** PRIV:1275-1280 adds the `kind` detail; row tests added. See judgement call below.
- **m8.** LOCK:1167 row names CRACK C2; LOCK:1164 lists the co-editors; PRIV:1245 names `#container`
  (with L3 and the lock plan); MFA:1044 names L1a for `WITHHELD_SCENARIO_KEYS`. CRACK:779-780 and
  :850-851 agree on the additive `FORGEABLE_ITEM_FIELDS`. See judgement call below.
- **n1-n10.** Present in the diff as listed in the decisions file; no new contradiction found.

## Judgement calls

- **m7: "`account_kind_admits?` runs first".** Confirmed. PRIV:591-592 (S5c): "called first by both
  definitions of `pc_admits_account?`", and the PC's `access` list "still applies afterwards".
  So a false from it is the kind refusal and an `access` refusal comes later. Accepted. The
  mechanism the sign-in caller uses to know which one refused is not stated (see m-b).
- **m8: CRACK->LOCK row folded into LOCK's `item_identity.rb` row.** Confirmed.
  `FORGEABLE_ITEM_FIELDS` lives at `lib/break_escape/item_identity.rb:28`; `game.rb:1215` and
  `games_controller.rb:3305` only read it. LOCK's row (one file, G3 edit, "also edited by" CRACK C2)
  is the right place.

## Findings

### Minor

**m-a. MFA misattributes the crack to the privilege plan.** MFA:530-531 reads "the privilege plan's
crack of a collected hash". The crack is the cracking plan's (S7); PRIV:173, :587, :803 say so.
The R6 fix introduced the phrase while correcting m4. Fix: MFA:530 "the cracking plan's crack".

**m-b. PRIV does not say how the sign-in caller tells a kind refusal from an `access` refusal.**
PRIV:1278-1281 says the row passes `kind` "only when `account_kind_admits?` is what refused", but
S5c (PRIV:591-593) makes `pc_admits_account?` a single boolean call, and the typed and keyring
paths see only that boolean. Fix: PRIV:1278 says the sign-in caller calls
`AccessIdentities.account_kind_admits?` itself once `pc_admits_account?` has returned false (a
second, pure call), and the row test at PRIV:1280-1283 covers both the typed and keyring paths.

### Nit

**n1. CRACK:419 and :720 still say "from any source".** CRACK:360-366 now names the sources and
excludes the reset entry. Fix: "from a source listed in `password_held_for?`".

**n2. PRIV's controller test list (PRIV:1075-1078) omits the new keyring-rev test.** The test is
stated at PRIV:780-781 only. Fix: add "`keyringRev` equals the next `GET /keyring` rev" to the
`harvest_credentials_test.rb` list.

**n3. CORE:2005 "the thirteenth refusal code `network_only`".** With 17 codes in the file, "thirteenth"
reads oddly beside "the codes are twelve" two lines later. Fix: "a refusal code `network_only`
beyond the twelve".

## Changed-lines hygiene

No added line mentions a review, a round, a finding id or the fixer. (A grep hit on "finding" at
SKIN:135 is the game term.)
