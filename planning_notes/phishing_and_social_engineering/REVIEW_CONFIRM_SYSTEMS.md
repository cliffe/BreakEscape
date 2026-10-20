# Review — SYSTEMS cluster, confirmation / closure round

Scope: closure + cross-doc consistency over the eight SYSTEMS docs (`00`–`07`) against the prior
review files (`REVIEW_01..07_R1.md`, `REVIEW_CORE_R2.md`) and `BRIEF.md`. Read-only. Engine, security
and weaponisation claims re-checked.

**Severity: 0 blockers · 0 majors · 2 minors.**
**Verdict: CLEAN — nothing above minor. The cluster is ready to build.** Two minor stale lines remain
(a slot-count word in `03`, three stale "04 doesn't carry the lord target" lines in `07`); neither
breaks a contract or a build.

---

## 1. Prior-finding closure

Every finding across all eight prior review files is confirmed present in the doc and resolving its
issue, with two minor exceptions noted below (both leftovers of `REVIEW_CORE_R2` F5-class drift).

**REVIEW_01_R1** (1 major, 5 minor) — all closed. EvalResult transform + `pretextScore` dropped (00
§3, 01 §Engine wiring); `minigameName` = class name; `this.gameResult` before `complete(true)`; flag
path `POST /break_escape/games/:id/flags`; rendered checklist example (01 lines 58–67); delivery-not-
guaranteed clause (01 lines 13–15).

**REVIEW_02_R1** (4 major, 5 minor) — all closed. Own judged interactions with strings + worked
example (02 §top); persisted-global intel feed not a live event (00 §5, 02 §Engine wiring);
`intel_pierce_role` reveal gate + `requiresIntelToAttempt` (02); Jed Baker + Friday balance-sheet note
seeded (02 team page + "Team notes"); reuse softened; "search/public mentions" relabel; deck software
"Microsoft Excel"; numbered loop; `applyActions([{type:'set_global'…}])`.

**REVIEW_03_R1** (2 major, 4 minor) — closed, one residual word (see Minor 1). Readiness from
prerequisites not craft factors (00 §4, 03); worked example + intel-gap phrasing + literal "Ready to
approach" string; join on shared `id`; defender "reduce this" notes; "no always-on tab framework" (03
line 90).

**REVIEW_04_R1** (6 major, 4 minor) — all closed. Attachment three-state keyed mapping; `senderAuth`
added; complete §7 schema; shared canonical red-flag library; **M5 salience now also fixed in the
worked example** (04 lines 104–105 say "the salient concept `balance sheet` … not a count of common
finance words", the exact thing `REVIEW_CORE_R2` F2 reopened); LLM scope narrowed; pass strings,
urgency downgrade, keyed-mapping anti-inversion, assets/goal N/A.

**REVIEW_CORE_R2** (2 major, 5 minor) — closed, one residual word (Minor 1). 00 §6
`bindExternalFunction` now "used in shipped code" (F1); 04 worked example no longer count-based (F2);
senderAuth alignment wording now locates alignment at DMARC (00 §2, F3); null-redFlag resolves to
canonical string (00 §2 "Red-flag resolution", F4); `tech_stack` now in 00 §1 and Sofia's
`lord_intern`/`lord_portal` now seeded in 02 (F6). **F5 (Pierce slot count) only partly closed** — the
rendered example and the JSON are two slots, but 03 line 37 still says "three recon slots" (Minor 1).

**REVIEW_05_R1** (1 blocker, 2 major, 4 minor) — all closed. Factor ids are now 00 §2's unsuffixed set
with `senderAuth` as the seventh (05 §"The factors"); no second red-flag library (05 owns only
`flagChips` labels + per-message notes); OQ2 struck and the "add to 04" N-item removed; greeting line
restored in the skill breakdown (05 line 293); msg 4 is a plain forward; N6 cites verified
persistence; first-attempt `<prefix>done` guard specified (05 N6).

**REVIEW_06_R1** (3 major, 4 minor) — all closed. Session under
`globalVariables['pretext_<callId>_state']` (STATE_KEY pattern); turn-4 arithmetic now −2 → 0/10 and
the result reads "finishing at 0/10"; `lookaheadSafe` handled by one-arg idempotent-per-step functions
+ the dropped-3rd-arg caveat (06 §6, 00 §6); `ASK PENDING` row added; `boostIfGlobal`/`strictIfGlobal`
registered in 00 §7; defender note names the OSINT-discoverable verification facts.

**REVIEW_07_R1** (3 major, 2 minor) — closed, three stale lines remain (Minor 2). Real-brand denylist
added to the N6 lint (07 §1, §5, N6); URL-reading habit rewritten to the registrable-domain concept
with a `.co.uk` example (habit 1); worked example rebuilt on Sofia Lord + AccountingNow payroll portal;
gate line shown underneath the band, not replacing it; "05 is a complete draft" with `buildSuspectPage`
framed as a change request.

---

## 2. Cross-doc consistency (the point of this round)

All verified consistent across the eight docs:

- **Factor ids + canonical red-flag strings + channel tells (00 §2).** The seven ids (`senderTrust`,
  `senderAuth`, `addressedTo`, `pretextRelevant`, `attachmentPlausible`, `urgencyCalibrated`,
  `linkCredible`) are used verbatim in 04 (`requiredFactors`/`advisoryFactors`) and 05 (chip table).
  The six channel tells (`lookalike_domain`, `changed_bank_details`, `unexpected_qr`,
  `unrequested_mfa_push`, `smish_shortlink_urgency`, `vish_callback_pressure`) with their defend-only
  flags match between 00 §2 and 05 §"Channel tells".
- **EvalResult shape + 01 transform (00 §3, 01, 04).** `{landed, factors:[{id,pass,state,reply,
  redFlag,mode}], hintIndex, advisory}` agrees between 00 §3 and 04 §Engine wiring; 01 renders the
  `{targetId, landed, redFlags, outcome}` transform and no aggregate score.
- **Intel ids + globals (00 §1/§5, 02, 03).** All ten canonical intel ids are seeded in 02; the
  readiness slots in 03 cite only ids 02 seeds; globals `intel_<id>`, `phish_pierce_landed`,
  `phish_lord_landed` agree.
- **Readiness map (00 §4, 03).** Three recon-fed factors in 00 §4 map to the two authored Pierce
  slots (attachment folded into `pierce_expects_balance_sheet`); `addressedTo`/`urgencyCalibrated`/
  `senderAuth` correctly excluded from the tracker. (Prose word mismatch only — Minor 1.)
- **Pierce worked example — end to end.** Finance; trusts Jed Baker (`j.baker@accountingnow.example`);
  expects a Q3 balance sheet on Fridays; attachment = spreadsheet. Identical across 00 §1, 02 (team
  page + "Team notes" + social), 03 (card), 04 (target).
- **Lord worked example — end to end.** Intern; `s.lord@accountingnow.example`; staff payroll portal
  (`lord_portal`); `linkCredible` required with `expectedLink`. 04's `lord` target (lines 150–166) and
  07's worked example/JSON (Sofia Lord, AccountingNow payroll portal, `linkThreshold` 70,
  `minDomainTier` 2, keyed `lord`) line up. Brands/domains consistent on `.example`. (Three stale "04
  doesn't carry this target" lines in 07 — Minor 2.)
- **scoringProfile contract.** 05 defines both profiles (the analyst/awareness table, §"Scoring
  profiles"), states "11 selects awareness, the lab (10) selects analyst". 05 owns both, as required.
- **Ink/engine constraints + boostIfGlobal/strictIfGlobal (00 §6/§7, 06).** The five §6 constraints are
  honoured by 06; the two hooks are defined in 00 §7 and referenced (not reinvented) by 06. The
  illustrative global names differ across docs (00 §7 `reset_granted_pierce`; 06 `reset_granted_okafor`
  for its mark Sam Okafor; 04 `lord_payslip_date_known`) but all instantiate the same documented
  `boostIfGlobal`/`strictIfGlobal` pattern — examples, not a contract mismatch.

---

## 3. Engine-claim spot-check (new/changed claims)

All re-confirmed against live source:

- **Persistence.** `set_global` patches `gameState.globalVariables` and emits
  `global_variable_changed:<key>` (`apply-actions.js:33-43`); serialised by `state-sync.js` and
  restored on load (`core/game.js:~1385`). STATE_KEY nesting used by 06's session is the
  `siem-dashboard`/`command-board` pattern. All cited correctly.
- **External functions** proven in shipped code: `person-chat-conversation.js:98-131` and
  `phone-chat-conversation.js:135-169` each bind six via `bindExternalFunction` (`ink-engine.js:138`);
  the wrapper drops the third arg at `:142` (so 06's one-arg idempotent design is the right response).
- **Ink constraints.** Choice tags rebuilt as `{text,index}` (`ink-engine.js:69,98`); `#set_global`
  refused for imported globals (`npc-conversation-state.js` guard, `chat-helpers.js:466,561`), splits
  on `:`. Cited correctly across 00 §6 and 06 §6.
- **Flag path** `POST /break_escape/games/:id/flags` (`flag-station-minigame.js:642`) — correct in 01
  and 05.

(These lines were verified in earlier rounds against the same source; the citations in the current docs
match. No fresh code read contradicted them.)

---

## 4. Security accuracy (re-check)

- **SPF/DKIM/DMARC (00 §2, 05).** Correct and consistent. SPF authorises the envelope/return-path
  sender (not the visible From); DKIM is a domain signature over message parts; DMARC alignment is the
  step that ties a passing SPF or DKIM to the visible From domain. The three load-bearing lessons are
  stated right in both 00 §2 and 05 §"header panel": a pass proves which domain sent it, not that it
  is honest (the attacker who owns `accountingnow-hr.example` passes all three); a fail is a clue, not
  proof (forwarding breaks SPF, lists break DKIM); none means no one is vouching. The look-alike-passes-
  auth case is taught in 05 msg 2.
- **07 padlock/cert.** Correct: a padlock means the connection is private to whoever owns that domain,
  not that the owner is legitimate; the ✓ string and the step-6 decoy both state this.
- **07 weaponisation — still PASS.** No HTML/CSS/JS authoring, no export/download/copy/preview/new-tab;
  the renderer draws shapes and text to a canvas; a "submit" flips a boolean and prints a line with no
  field read, stored or sent; no network; domains are strings. The N6 denylist now closes the real-
  brand hole the `.example` suffix alone left open (`paypal.example` is rejected), checking the whole
  `name`/domain string against a validator-level list, not a per-scenario field. Concept-card
  typosquat/homograph material is recognition-level with an explicit no-operational-how-to rule. No
  runnable artifact or capture path.

---

## 5. New findings (introduced or left by the fixes)

### Minor 1 — 03 says "three recon slots"; everything else says two

`03_intel_board.md:37` reads "Melanie Pierce's card has **three** recon slots", but the rendered
example (lines 40–43), the parenthetical at line 44 ("**Two slots**, matching the two authored
`readinessSlots` below"), and the authored JSON (lines 69–79, two slots) all say two. This is the
residue of `REVIEW_CORE_R2` finding 5: the example and JSON were reconciled to two, the intro sentence
was not. No build impact; the JSON is authoritative. **Fix:** change "three recon slots" to "two recon
slots" on line 37.

### Minor 2 — 07 says 04 does not carry the `lord` target; 04 now does

Three lines in `07_landing_page_builder.md` still say the `lord` target with `linkCredible` +
`expectedLink` is absent from 04 and the orchestrator must add it: line 240 ("`04` does not define that
entry today; the orchestrator adds it"), lines 352–353 ("the orchestrator adds that entry to `04`"),
line 413 ("is new to `04`; the orchestrator adds it"). 04 now defines the `lord` target with
`linkCredible` required and an `expectedLink` (`04_phish_rules_engine.md:150-166`). The statements are
stale — they claim work that is already done, which could lead an implementer to add a duplicate.
Secondary nit on the same lines: 07 says "04's `lord` target points back at this record by
`landingPageId`", but 04's `expectedLink` carries only `{brand, domainClaims}` and no `landingPageId`;
the real join is by target id `lord` (which 07's `targets` block already uses correctly). No build
impact. **Fix:** reword the three lines to "04 carries the `lord` target with `linkCredible` +
`expectedLink` (04 lines 150–166); this doc supplies the page-side numbers keyed by the `lord` target
id", and drop the "points back by `landingPageId`" phrasing (the join is by target id).

---

## 6. Verdict

**CLEAN.** 0 blockers, 0 majors, 2 minors. All blocker/major/minor findings from the eight prior
review files are closed in the docs. The seven-factor library, the red-flag strings, the channel
tells, the EvalResult/transform, the intel ids and globals, the readiness map, the Pierce and Lord
end-to-end examples, the scoringProfile contract and the ink/engine hooks are all consistent across
00–07. Security content (SPF/DKIM/DMARC, padlock/cert) is accurate; 07 still passes weaponisation with
the denylist in place. The two remaining items are stale one-line statements (03's slot count, 07's
"04 doesn't carry lord") that contradict the authoritative data beside them; fix at leisure, neither
blocks a build.
