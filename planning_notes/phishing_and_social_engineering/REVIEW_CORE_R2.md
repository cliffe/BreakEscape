# Review — Core cluster (00–04), round 2 (consistency / reconciliation)

Severity count: 0 blockers · 2 majors · 5 minors

Read-only consistency pass over `00_data_contract.md` (new source of truth) and `01`–`04`, checking
that every Round-1 finding was actually closed, that the ids/names/example agree across §1–§7 of 00
and across 01/02/03/04, that the new engine claims added during the fix hold in code, and that the
reconciliation introduced no new contradiction or security-accuracy error. Engine citations were
checked in the live source (paths and lines below).

---

## R1 closure

### REVIEW_01 (1 major, 5 minor) — all closed
- **M1 result schema / `pretextScore`** — CLOSED. 00 §3 defines `EvalResult` and 01's transform
  `{targetId, landed, redFlags, outcome}`; `pretextScore` dropped (01 lines 111–116, 00 §3).
- **minor-2 `minigameName` is class name** — CLOSED (01 lines 104–106; verified
  `base-minigame.js` emits `minigameName: this.constructor.name`).
- **minor-3 set `this.gameResult` before `complete(true)`** — CLOSED (01 lines 102–103; verified
  `complete(success)` takes only `success`, payload is `this.gameResult`).
- **minor-4 flag path** — CLOSED. 01 line 115 gives `POST /break_escape/games/:id/flags`; verified at
  `flag-station-minigame.js:642` (`/break_escape/games/${gameId}/flags`).
- **minor-5 section-4 render example** — CLOSED (01 lines 58–67 show the rendered checklist).
- **minor-6 spoofable / delivery-not-guaranteed** — CLOSED (01 lines 13–15, cross-refs 05 + senderAuth).

### REVIEW_02 (4 major, 5 minor) — all closed
- **F1 own judged rules/feedback** — CLOSED (02 "Its own judged interactions", derive-pattern + search
  with exact right/wrong strings and a worked example).
- **F2 modal-overlay intel feed** — CLOSED. 00 §5 + 02 engine wiring make the persisted
  global the source of truth, `intel_collected` demoted to a live-UI flourish.
- **F3 concrete downstream gate** — CLOSED (02 names `intel_pierce_role` to reveal Pierce +
  `requiresIntelToAttempt`; 00 §5 requires each scenario to state advisory vs gating).
- **F4 flagship chain discoverable** — CLOSED. 02 team page now seeds Jed Baker and a news/"Team
  notes" entry carrying the Friday balance-sheet note (`pierce_expects_balance_sheet`).
- **minor-5 reuse overstated** — CLOSED (02 lines 125–128). **minor-6 "breach-ish"** — CLOSED (layer 4
  relabelled "Search / public mentions", breach called out as a distinct source). **minor-7 metadata
  software** — CLOSED (deck software now "Microsoft Excel"). **minor-8 numbered loop** — CLOSED (02
  "Numbered … 1–7"). **minor-9 set_global mechanism** — CLOSED (`applyActions([{type:'set_global'…}])`).

### REVIEW_03 (2 major, 4 minor) — both majors closed; see new finding 5
- **M1 readiness from prerequisites not craft factors** — CLOSED (00 §4; 03 "Attack-readiness").
- **M2 rule + worked example + no answer-reveal** — CLOSED in substance (03 lines 37–52 worked
  example, intel-gap phrasing, literal "Ready to approach" string). One residual slot-count mismatch
  recorded as new finding 5 (minor).
- **minor-3 numbered walkthrough** — CLOSED (worked example folded in). **minor-4 join key** — CLOSED
  (02 staff carry `id`, 03 joins on it). **minor-5 Ch.12 defender product** — CLOSED ("reduce this"
  notes). **minor-6 "persistent panel" overclaim** — CLOSED (03 line 90: no always-on tab framework).

### REVIEW_04 (6 major, 4 minor) — five majors closed; M5 NOT fully closed
- **M1 attachment missing state** — CLOSED (00 §2 three states `pass`/`missing`/`wrong-type`, keyed
  strings; 04).
- **M2 senderAuth factor** — CLOSED (00 §2 + §7 schema `senderAuth:{domainPublishesAuth,spoofAligns}`;
  04 advisory). See new finding 3 for a wording precision point.
- **M3 complete schema** — CLOSED (00 §7).
- **M4 shared canonical red-flag library** — CLOSED (00 §2 one string per factor, per-target override).
- **M5 salience not count** — **NOT fully closed.** The mechanism section (04 lines 60–64) and 00 §2
  were fixed to require ≥1 high-salience concept, but 04's own worked example still states the old
  rule — see new finding 2.
- **M6 LLM advisory scope** — CLOSED (00 §LLM + 04 lines 73–75).
- **minor-7 pass strings** — CLOSED (00 §7 `factorStrings.pass`). **minor-8 urgency downgrade** —
  CLOSED. **minor-9 anti-inversion = keyed mapping not lint** — CLOSED (00 §2 note, 04 lines 95–98).
  **minor-10 assets/goal N/A** — CLOSED (04 lines 10–12).

---

## New findings

1. **Major — 00 §6 engine claim is factually wrong: external functions ARE called in shipped code.**
   00 §6 states "`bindExternalFunction` exists but no shipped code calls it (`ink-engine.js:138`).
   Using external functions (06's `pretext_say`/`pretext_ask`) is a **spike** — prove it or use the
   VAR fallback." Both shipped conversation drivers bind external functions extensively:
   `public/break_escape/js/minigames/person-chat/person-chat-conversation.js:98–131`
   (`player_name`, `current_mission_id`, `npc_location`, `mission_phase`, `operational_stress_level`,
   `equipment_status`) and `public/break_escape/js/minigames/phone-chat/phone-chat-conversation.js:135–169`
   (the same six). The mechanism is proven, not a spike. This over-caution would push the 06 fixer to
   the weaker VAR fallback for no reason. **Fix:** rewrite the bullet to "external functions are a
   known-good pattern (person-chat/phone-chat bind six each); 06 can bind `pretext_say`/`pretext_ask`
   the same way — the only open question is whether an ink→JS call can *return a value mid-knot* for a
   suspicion read, which the existing bindings (all value-returning getters) already demonstrate."

2. **Major — 04 worked example contradicts the salience fix and reintroduces the exact M5 defect.**
   04 lines 104–105: "Required factors: … `pretextRelevant` (**≥2 of** `{balance, sheet, finance,
   profit, loss, account}` as concepts)". This is the count-over-a-broad-set rule REVIEW_04 M5 said to
   remove, including `account` (the word M5 flagged as matching "accounting/accountable"). It
   directly contradicts the same doc's fixed mechanism (04 lines 60–64: "≥1 high-salience concept, not
   any N") and the schema (04 lines 131–135: `salientConcepts:["balance sheet"]` ≥1 +
   `supportingConcepts:["finance","profit","loss"]`) and 00 §2's gate. A reader taking the worked
   example literally builds the gameable version. **Fix:** change the worked-example line to
   "`pretextRelevant` (requires the salient concept **balance sheet**; `finance`/`profit`/`loss` are
   supporting only and can't carry it alone)" and drop `account` from the illustrative set.

3. **Minor — senderAuth SPF/DKIM/DMARC wording is loose on where alignment lives.** 00 §2 passes-when
   = "would pass SPF+DKIM+DMARC **alignment**" and §senderAuth = "survive SPF/DKIM/DMARC alignment".
   Concept-level direction is right (and the honest "a pass is not a human-trust verdict; a spoof can
   still land if delivered" framing is correctly kept, 00 §2 §senderAuth + 01 lines 13–15). But
   "alignment" is specifically a **DMARC** concept: DMARC passes when SPF **or** DKIM passes *and* its
   domain matches the visible `From:` header. SPF on its own checks the envelope/return-path sender,
   not the `From:` header; DKIM checks a `d=` signature. Lumping all three under one "alignment" risks
   a student carrying away that SPF checks the `From:` address. **Fix:** one clause — "SPF authorises
   the envelope sender, DKIM signs with a domain key, and **DMARC alignment** is the check that one of
   those passes *and* matches the visible From domain; a spoofed From that isn't aligned fails DMARC."

4. **Minor — redFlag fallback to the canonical library is implied but not stated, so 01/05 can get
   `null`.** 00 §7 says per-target `factorStrings` "override the §2 canonical red-flag library … the
   canonical set is the default", and 04's Pierce target sets `redFlag:null` on
   senderTrust/addressedTo/pretextRelevant (04 lines 140–142). 01's transform is
   `redFlags = factors.filter(f=>!f.pass).map(f=>f.redFlag)` (00 §3) — if `phish-rules.js` passes the
   raw override through, those are `null`, and 05's chips inherit the hole the shared library was meant
   to close. **Fix:** state in 00 §3/§7 that `evaluateMessage` resolves each factor's `redFlag` to the
   §2 canonical string when the per-target override is null/absent, so `EvalResult.factors[].redFlag`
   is never null and both 01's `redFlags[]` and 05's chips are always populated.

5. **Minor — 03 Pierce card: three slots shown, two authored.** 03 line 37 says "Melanie Pierce's card
   has **three** recon slots" and the rendered example (lines 40–43) shows three ("who she'd open an
   email from", "what she expects to receive", "what file she'd expect"), but the authored
   `readinessSlots` JSON (lines 69–76) defines **two** (`Who she trusts`, `What she expects`), folding
   the attachment expectation into `pierce_expects_balance_sheet`. 00 §4 likewise calls attachment
   "part of pierce_expects_balance_sheet". The display and the author data disagree on slot count.
   **Fix:** reconcile — either drop the third rendered slot (two slots, attachment folded in, matching
   the JSON) or author the third `readinessSlot` explicitly; pick one and make line 37, the example,
   and the JSON agree.

6. **Minor — intel-id set drift between 00 §1 and 02's seed data.** 02's vacancies page seeds
   `"intel": ["tech_stack","hampshire_careers","careers_attachment"]` (02 line 106), but `tech_stack`
   is not in 00 §1's canonical intel table. Conversely 00 §1 lists `lord_intern` and `lord_portal`
   (Sofia Lord), which 02's example `profiles` (only `pierce`) never seeds, though Sofia is used as the
   derive-pattern name. The example JSON is explicitly partial (`"...": "..."`), so this is drift not a
   break. **Fix:** add `tech_stack` to the 00 §1 table (it backs no factor — mark it "lab colour") or
   drop it from 02; and either seed a Sofia social entry carrying `lord_intern`/`lord_portal` or note
   in 00 §1 that those two are reserved for the 07/link strand, not the core-cluster example.

---

## Consistency spot-checks that PASS (recorded so they aren't re-raised)
- Factor ids agree across 00 §2/§7 and 04 (seven: senderTrust, senderAuth, addressedTo,
  pretextRelevant, attachmentPlausible, urgencyCalibrated, linkCredible).
- Intel ids in 03's `readinessSlots` (`pierce_trusts_jed`, `email_pattern`,
  `pierce_expects_balance_sheet`) are all seeded by 02 (team page, social post, "Team notes").
- Globals agree: intel globals `intel_<id>` (00 §5, 02), reveal gate `intel_pierce_role` (00 §5 = 02),
  landed outcome `phish_pierce_landed` (00 §3, 01, 04).
- `username_convention` (00 §1: author `mpierce`, app "Microsoft Excel") matches 02's deck metadata
  exactly; the alias/AD-username teaching split is coherent across 00/02.
- senderAuth mode agrees: advisory on attack (00 §2 table, 04 `advisoryFactors`), `authentication_fail`
  read on defence (00 §2 §senderAuth). Note: 05 was not in the supplied read set, so the 02/05 global
  naming and the `authentication_fail`/`redFlagLibrary` hand-off are asserted-consistent but
  unverified against 05 itself — worth one check when 05 is reconciled.
- EvalResult shape agrees between 00 §3 and 04 engine wiring (`{landed, factors:[{id,pass,state,reply,
  redFlag,mode}], hintIndex, advisory}`).

## Verified engine claims (live source)
- `apply-actions.js:33` `set_global` patches `window.gameState.globalVariables` and emits
  `global_variable_changed:<key>` — exact.
- `base-minigame.js` `complete(success)` emits `minigame_completed {minigameName:this.constructor.name,
  success, result:this.gameResult}` — exact; `minigameName` is the class name as 01 states.
- `flag-station-minigame.js:642` posts to `/break_escape/games/${gameId}/flags` — exact.
- Ink read-only imported globals: `npc-conversation-state.js` `setReadOnlyGlobals` + comment that
  `#set_global`/`#set_variable` are refused (~329); refusals at `chat-helpers.js:466` (set_global) and
  `:561` (set_variable) — exact.
- Choice tags dropped: `ink/ink-engine.js:69` and `:98` rebuild choices as `{text,index}` — exact.
  `bindExternalFunction` defined at `ink/ink-engine.js:138` — exact, but the "no caller" claim is
  false (finding 1).
- Persistence: `state-sync.js` keeps `globalVariables` in `KEYED_SECTIONS` and syncs to server;
  `core/game.js:1383–1405` restores `savedGlobalVariables` and `savedNotes`; server side at
  `games_controller.rb:292` — all confirmed. (Doc cites "state-sync.js" without a dir; the file is at
  `public/break_escape/js/state-sync.js`, not `systems/` — harmless, no fix needed.)

## Judgement against BRIEF
Deterministic/legible feedback (per-factor keyed strings, no silent fail), model-don't-weaponise
(simulated OSINT, abstract payloads, LLM scoped to the authored target), and fun-not-hard (readiness
nudge, escalating hints, no dead ends) all hold across the cluster. 9-section completeness holds (04
correctly marks goal/loop/assets N/A). Security accuracy is sound except the senderAuth precision
point (finding 3).

## Verdict
Majors remain — the reconciliation is 20 of 21 R1 findings closed, but one wrong engine claim (00 §6
`bindExternalFunction`) and one self-contradicting worked example (04's `pretextRelevant`, reopening
M5) must be fixed before the cluster is clean.
