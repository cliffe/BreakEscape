# R3 review: adversarial, round 3

Reviewer: round 3, fresh context. Scope: 00, 01, 02; episodes E08 to E17; 10, 11, 12, 13; against each
other and against the code at `/home/user/BreakEscape` on 2026-10-28. Never ran git for writes; used
`git log`/`git show` read-only to see the round 2 fix commits (d2031373, bea86c71, a0add62b).

## Result

| Severity | Count |
|---|---|
| B (blocker) | 1 |
| M (major) | 3 |
| m (minor) | 6 |
| t (trivial) | 3 |

**Verdict: not clean** (1 B, 3 M).

## Code-truth spot check (requirement: >= 25; done: 40+, all accurate)

Every cited anchor below was opened and matched, weighting the round 2 changes (choice scoring, mistake
wiring, guess state, brief variant, tells reclassification, generators, register_object):

- `episode-model.js`: `STAGE_IDS:27`, `ATTACK_STAGES:28`, `DEFAULT_STAGES:31`, `stagesFor:60`,
  `cleanSent:81`, `readState:129`, `completeStage:153` (flip clears sent at `:160`), `childLaunch:180`
  (build branch `:187`, write/call branch `:204`), `writeKind:166`, `GENERIC_REPORT_ROUTE:426`,
  `REPORT_ROUTE_SLOT:432` (`'slot:customer_report_route'`), `awarenessSettings:454`, `reportRouteFor:471`.
- `episode-runner-minigame.js`: `STAGE_COPY:79`, `_render:327` (launch branch `:335`), `_renderFinished:532`,
  `_flipProps:466`, `_renderFlip:489`, `_launch:548` (build wired `:577`), `_launchCall:629`,
  `cfg.channels.person :640`, `watchCall:760`.
- `awareness.rb`: `STAGES:18` (9 ids), `STAGES_BY_VARIANT:19`, `attack_checks` call `:53` / def `:182`,
  `EPISODE_MESSAGES=(4..8):30`, `CHECK_MESSAGES=10:31`, `full?:88`, `stage_orders:157`, `defend_set:359`
  (err "defend.setId is missing" `:362`), `conclusion_checks:444`, `episode_checks` defend-set group `:57-66`.
- `triage-scoring.js`: `KIND_VERDICT_POINTS:43` (holds `call` only), `VERDICT_POINTS:70`, `verdictPoints:88`,
  `FULL_VERDICT_POINTS=60 :103`, `perMessage` record `:285` (`handledRight` at `:294`).
- `triage-kinds.js`: `NON_EMAIL_KINDS:23`, `VERDICT_ACTIONS:40`, `actionsFor:66`, `page():364`, `call():449`,
  `SURFACES:507`, `renderKindSurface:514`, `kindVerdictLine:93`.
- `triage-flags.js`: `SKILL_NAMES:47`, `chipIdsFor:154`, `KIND_TELL_EXCLUDE:90`, `redFlagString:196`.
- `phish-rules.js` `CHANNEL_TELLS:52` and `triage.rb` `CHANNEL_TELLS:38` each hold the same 12 ids;
  `triage.rb` `FACTORS:35`, `flag_universe:209`.
- loop tests: `social-triage-weakest.test.mjs:201`, `social-gap-triage-flags-comparison.test.mjs:89`
  (both `for (const id of Object.keys(F.CHANNEL_TELLS)) assert.ok(F.SKILL_NAMES[id])`).
- `person-chat-ui.js:264` (`SECURE VIDEO LINK`), `initVideoCallOverlay:255`; `npc-manager.js` video-call at
  `:910-912` and `:1100-1122`.
- `chat-helpers.js` `unlock_door:71`, `trigger_minigame:190`; `npc-game-bridge.js` `unlockDoor:77`
  (`doorProperties.locked=false` at `:117-118`); `apply-actions.js` `unlock_door:102`;
  `pretext-card.js` `callLaunch` person/phone at `:240`; `step-strip.js` `STAGE_LABELS:9` (no mistake/guess).
- `gen_e3_e5_shells.py` `HOSTS['anjali']` (`anjali_rao`, `female_scientist`) present; absent from
  `gen_e6_e7_shells.py` (which has `meta_for`). `register_object.py --wall` edits the five files its
  docstring lists.
- `scenario-schema.json`: `socialTriageMessage:1569`; `truth` object `:1623` is `additionalProperties:false`
  `:1638` and has no `correct`/`whyRight`/`ifWrong`.
- core_17 reuse ids all exist (grep-confirmed): `e1_lookalike_bank`, `e1_bank_confirmed`, `e3_push_early`,
  `e3_call_gordon_impostor`, `e3_call_gordon_real` (the two under `defend.calls:491`), `e5_sso_lookalike`,
  `e6_shift_moved`, `e7_vm_ravinder_cloned`. Graham Whitfield in BRAND_SET.
- WP-02 symbols: `AWARENESS_TEXT_MAX=600`, `AWARENESS_HEADING_MAX=80`, `break_escape_awareness_config:15`,
  `be_plain:36`, `AWARENESS_INVISIBLE:10`; `break_escape.rb` `awareness_settings`; `debrief-view.js`
  `textBox:279`, `.aw-report-route` after `.aw-monday` `:366-372`.
- E5 attack fragment: `quayholt_sso_portal` + `blk_sso` exist (so E8's deletion instruction is accurate);
  `quayholt_it_desk`/`quayholt_sso_migration`/`quayholt_staff_claims` exist; `sso_staff` = Hana Novak
  (confirms E8 §5's reason for using Ayaan, not Hana).

No cited code fact was found wrong (the only drift is a 2-line offset, finding t2).

---

## Findings

### B1 — E8 tells contradict the round 2 `02` tell table; set would not validate as written
- **Severity:** B
- **File / section:** `episodes/E08_after_the_click.md` §3, §11, §12, §19, and the §20 "resolved" note.
- **Evidence:** E8 §3 says `unexpected_sent_item`, `unrequested_reset`, `ransomware_note` are "in the
  **shared library** ... append only to `CHANNEL_TELLS` in both `phish-rules.js` and `triage.rb`". §11
  says "Use ENG-08's canonical strings verbatim as the library entries" and §19's Stop-and-ask says if
  ENG-08 has not added them to the shared `CHANNEL_TELLS` then "the full and defend-only sets cannot score
  them". But the round 2 `02` fixer reclassified all three as **local** (`02_ENGINE_WORK.md` ENG-08 tell
  table lines 634-636: each "local ... no library change and no `SKILL_NAMES` change today"), and the
  round 3 known-item 1 flags exactly this. The two documents now disagree on a load-bearing engine
  decision. Worse: E8 never authors a set-level `flagChips` label for the three ids (it relies on their
  being in `CHANNEL_TELLS`); E9/E10/E12/E13 all do declare `flagChips` for their local tells. Under `02`'s
  local decision these three ids are not in `CHANNEL_TELLS`, so `triage.rb` `flag_universe:217` requires a
  `flagChips` label for each, which E8 does not provide. So E8's set fails `--strict-social`, or an
  implementer who follows E8 instead appends three ids + three `SKILL_NAMES` entries that `02` explicitly
  says not to add. Either path is wrong. (`factorStrings.<id>.redFlag` in E8 §11 is per-message and does
  not satisfy the set-level `flagChips` requirement.)
- **Fix:** Rewrite E8 §3/§11/§19 and the §20 resolved note to match `02`: declare all three as
  **scenario-local to E8's set**, with a `flagChips` label and a `factorStrings.<id>.redFlag` sentence per
  flagging message, and **no** append to `CHANNEL_TELLS`/`SKILL_NAMES` — exactly the pattern E9 §3/§11,
  E10 §11 and E12 §11 use. §19's Stop-and-ask should read as E10 §19 does (local with `flagChips` is the
  settled home; promote only if a `10` item later scores one).

### M1 — E12 world-modifier config shape disagrees with `02` ENG-05a (costume under `attack`)
- **Severity:** M
- **File / section:** `episodes/E12_visitor_and_tailgater.md` §9.1 item 1 (and the loose `startRoom`/room
  keys in items 1 and 3).
- **Evidence:** `02_ENGINE_WORK.md` ENG-05a change 1 (line 384) defines one new block,
  `awarenessEpisode.world = { room, costume, startRoom }`, and ENG-05a change 3 / ENG-08 (line 614) add
  `awarenessEpisode.world` to the schema. E12's own §3 dependency table and §17 acceptance both say the
  costume lives in `awarenessEpisode.world` ("Accept the `awarenessEpisode.world` block (`room`,
  `startRoom`, `costume`)"). But the one concrete config snippet, §9.1 item 1, authors
  `"attack": { ..., "costume": { "sprite": "aw_hivis_courier_v2", "talk": "..." } }` — costume under the
  `attack` block, not `world`. For a call attack E12's `attack` block is `{ callId }`; the schema has no
  `costume` key on `attack`, so an implementer copying the snippet authors an invalid shape. §9.1 item 3
  likewise presents `startRoom` as a loose key rather than `world.startRoom`.
- **Fix:** In §9.1, show the single `awarenessEpisode.world` block
  `{ "room": "lobby", "startRoom": "lobby", "costume": { "sprite": "aw_hivis_courier_v2", "talk": "..." } }`,
  matching `02` ENG-05a and E12 §3/§17. Do not put `costume` or `startRoom` under `attack`.

### M2 — E9 `choice` card JSON uses fields not in `02` ENG-09a; `truth` is `additionalProperties:false`
- **Severity:** M
- **File / section:** `episodes/E09_passwords.md` §11 (the worked message JSON, lines ~176-195, and the
  per-row `rec.choice` description with `correct: "<id>"`).
- **Evidence:** `02` ENG-09a (lines 684-688) fixes the shapes: `rec.choice = { prompt, options[{id,label,
  verdict}], note? }` (no `correct`), and the card's correctness lives in `truth.correct` (a verdict) plus
  each option's `verdict`. The schema `truth` object (`scenario-schema.json:1623-1638`) is
  `additionalProperties:false` and ENG-09a adds only `truth.correct`. E9's worked card authors
  `choice.correct: "words"` (an option id), `truth.whyRight` and `truth.ifWrong`. None of those three is in
  the ENG-09a shape, and `truth` rejects unknown keys, so a card authored from E9's worked example fails
  `--strict-social`. The `choice.correct` option-id is also redundant (ENG-09a derives the right option
  from `truth.correct` + option verdicts, and lints "exactly one option's verdict equals `truth.correct`").
- **Fix:** Drop `choice.correct` from the E9 `choice` objects. Carry the "why right / if wrong" copy in
  schema-legal `truth` keys (for example `perFlagNote`/`ifTrusted`, or move them to the reason text), or
  have `02` ENG-09a add `truth.whyRight`/`truth.ifWrong` to the schema explicitly and say so. The option-to-
  verdict mapping prose in E9 §11 is correct and matches ruling 3; only the drafted field names are wrong.

### M3 — `unapproved_tool` is used by two sets (E15 and E17) but kept local; ruling 2 not applied, and it is absent from the `02` tell table
- **Severity:** M
- **File / section:** `episodes/E15_shadow_it.md` §11, `episodes/E17_acceptable_use.md` §11b,
  `02_ENGINE_WORK.md` ENG-08 tell table (lines 632-648) and its header claim line 630.
- **Evidence:** Round 2 ruling 2: "Promote a tell to shared only when a second set uses it." `unapproved_tool`
  is declared scenario-local in both E15's set (`e15_shortcuts_inbox`) and E17's set
  (`e17_acceptable_use_inbox`) — two sets. By the ruling's literal criterion it should be promoted to the
  shared library (append to both `CHANNEL_TELLS` plus a `SKILL_NAMES` entry). The `02` tell table does not
  list `unapproved_tool` at all, yet its header claims "Every new tell the specs use, assigned." The REVIEW_LOG
  round 2 note rationalises keeping it local ("independent sets that are never merged"), which is defensible
  and works in practice (each set validates as a labelled local), but that exception is not recorded in the
  ruling or in the authoritative `02` table, so an ENG-08 implementer reading ruling 2 could reasonably
  promote it and diverge from the specs.
- **Fix:** Record the decision in `02`'s ENG-08 tell table: add a row for `unapproved_tool` (used by E15 and
  E17) stating it stays **local in each set** because the two sets are never merged and no `10` item scores
  it, with an explicit carve-out note to ruling 2. (If instead the orchestrator wants ruling 2 applied
  literally, promote it and add the `SKILL_NAMES` entry, and change E15/E17 §11 accordingly.) Either way the
  two documents must stop disagreeing.

### m1 — `02` ENG-08 tell table claims completeness but omits five local tells
- **Severity:** m
- **File / section:** `02_ENGINE_WORK.md` ENG-08, line 630 ("Every new tell the specs use, assigned").
- **Evidence:** The table omits `fake_profile` and `recon_request` (E14 §11), `found_media` and
  `unapproved_tool` (E15 §11), and `insider_offer` (E16 §11). All are declared scenario-local on their sets
  with `flagChips` and need no engine change, so nothing breaks, but the "every new tell ... assigned" claim
  is inaccurate and could mislead a reviewer into thinking the table is exhaustive.
- **Fix:** Either add these five as explicit local rows, or soften the header to "the tells whose
  shared/local decision was debated; purely-local tells declared with `flagChips` on one set are not listed".

### m2 — 00 lists E14 as depending on ENG-09a, but E14 uses no `choice` card
- **Severity:** m
- **File / section:** `00_README.md` §4 (line 64: E14 "shares the new defend card kinds (ENG-09a)") and §5
  (line 93: "E14 | ENG-09a, ENG-11, ENG-13").
- **Evidence:** E14's scored defend set (§11 rows 1-6) is ordinary inbox-triage items with Report/Trust
  verdicts; its teaching drills are ENG-11 `sortDrill` and ENG-13 `privacyPanel`. E14 §3 does not list
  ENG-09a and authors no `choice` triage card. So the ENG-09a dependency in 00 is spurious (harmless since
  ENG-09a is built for E9, but the dependency table is wrong).
- **Fix:** Remove ENG-09a from E14's row in 00 §5 and from the §4 sentence; E14 depends on ENG-11, ENG-13
  and the built triage only. (Separately, E14 §11 describes item kinds "DM" and "connection request", which
  are not built triage kinds; confirm these are authored as the built `email` kind, since E14 §3 states no
  new kind packet.)

### m3 — E11 states the `attack_checks` relaxation condition more narrowly than `02`
- **Severity:** m
- **File / section:** `episodes/E11_misdirected_data.md` §10a (lines 337-343).
- **Evidence:** E11 says `attack_checks` must run "only when `stages` includes `osint` or `write`", and
  frames it as still owed ("If 02 has not yet added it ... requested of the 02 fixer"). `02` ENG-04 point 5
  (line 350) and ENG-08 (line 610) have already added it, with the broader list "`osint`, `build`, `write`,
  `mfa` or `guess`". The two conditions are equivalent for E11/E15/E16 (none of those stages present) but
  differ for episodes with `build`/`mfa`/`guess`, and E11's "still owed" framing is stale.
- **Fix:** Align E11 §10a to `02`'s attack-artefact-stage list and note the relaxation is landed in `02`
  ENG-04 point 5, not outstanding.

### m4 — E13 (and `02` ENG-06) imply an engine change is needed to "accept" two local tells
- **Severity:** m
- **File / section:** `episodes/E13_ai_assistant.md` §11 (lines 242-243), `02_ENGINE_WORK.md` ENG-06 change 3
  (line 546).
- **Evidence:** E13 §11 says `hidden_instruction`/`deepfake_request` are scenario-local but "ENG-08 must let
  the validator accept them", and lists them under "Register canonical strings"; `02` ENG-06 similarly says
  the validator must "accept the scenario-local tells". As E9/E10/E12 correctly state, a local tell needs
  only a set-level `flagChips` label (`triage.rb` `flag_universe` already accepts a labelled non-factor) and
  no library or validator change. E13 does not explicitly say to declare `flagChips` labels, and the
  "register canonical strings" wording reads like shared-library registration.
- **Fix:** Reword E13 §11 (and `02` ENG-06) to say the two tells are declared on E13's set with `flagChips`
  labels and `factorStrings.<id>.redFlag` sentences, needing no ENG-08 library or validator change (the
  pattern E9/E10/E12 use).

### m5 — E12 §20.2 attributes the per-set action relabel to ENG-07, but that is ENG-03a's `verdictLabels`
- **Severity:** m
- **File / section:** `episodes/E12_visitor_and_tailgater.md` §20 open question 2.
- **Evidence:** §20.2 says "ENG-07's configurable labels could relabel per set" for the reception call
  actions. ENG-07 (`02` line 564) is only the person-chat/triage `call` **video-call bar label**. The per-set
  verdict/action relabel is ENG-03a's `triageSet.verdictLabels` (`02` line 223/235). E12 ships without the
  relabel either way, so this is cosmetic, but the packet is misnamed.
- **Fix:** Change the reference in §20.2 from ENG-07 to ENG-03a's `verdictLabels`.

### m6 — E17 declares `lookalike_domain` in `channelTells` but no item flags it
- **Severity:** m
- **File / section:** `episodes/E17_acceptable_use.md` §11b (line 174).
- **Evidence:** §11b sets `channelTells: ["lookalike_domain", "secrecy_or_bypass"]` plus `unapproved_tool`,
  but the six items (§11b table) flag only `unapproved_tool` and `secrecy_or_bypass`; none flags
  `lookalike_domain`. E8 §11 deliberately omits a tell no item flags ("`lookalike_domain` is not listed: no
  item in this set flags it"), so this is an inconsistency of convention. `lookalike_domain` is a shared
  library id so it is harmless, but the declaration is unused.
- **Fix:** Either drop `lookalike_domain` from E17 §11b `channelTells`, or add it as a flag on a suitable
  item (for example a look-alike sender on item 1 or 6), to match E8's convention.

### t1 — Repo-name casing differs between 00/01 and the REVIEW_LOG
- **Severity:** t
- **File / section:** `00_README.md` §7 (line 137) and `01_PIPELINE.md` P12 (line 234): `cliffe/hacktivity`;
  REVIEW_LOG round 1/round 1-fix notes: `cliffe/Hacktivity`.
- **Evidence:** 00 and 01 agree with each other (lowercase) but the REVIEW_LOG uses capital `Hacktivity`.
  Case can matter for a repository slug.
- **Fix:** Pick one casing and use it in 00 and 01 (confirm the real slug with the user).

### t2 — E12 and `02` cite the door-unlock line as 112/119; the code is 117-118
- **Severity:** t
- **File / section:** `episodes/E12_visitor_and_tailgater.md` §9.1 item 4, `02_ENGINE_WORK.md` ENG-05c.
- **Evidence:** Both say `npc-game-bridge.js` "clears `doorProperties.locked` ... (lines 112,119)". The
  actual lines are `:117` (`if (doorSprite.doorProperties)`) and `:118` (`.locked = false`). Minor drift; the
  symbol and behaviour are correct.
- **Fix:** Update both to `:117-118` (or drop the exact line numbers).

### t3 — E8 reuses the E5 fact id `quayholt_staff_claims` repointed to a different person
- **Severity:** t
- **File / section:** `episodes/E08_after_the_click.md` §9 OSINT fact table.
- **Evidence:** E5's `quayholt_staff_claims` identifies Hana Novak (`e5/attack.json`); E8 §9 reuses the same
  fact id for Ayaan Warsame. Because `e8/attack.json` is a separate fragment and the `se_intel_*` globals
  live in separate scenario `globalVariables` blocks, there is no collision, but reusing a built fact id for
  a different subject invites confusion when the two are read side by side.
- **Fix:** Optional: rename E8's fact to `quayholt_ayaan_claims` to avoid the id reuse. Harmless as is.

---

## Checks that passed (no finding)

- **Known item 1 (E8 tells):** raised as B1 above.
- **Known item 2 (round 3): E11 two-aim variant.** E11 §15a ships the **one-aim** design and marks the
  two-aim variant as optional ENG-04 scope "do not assume it". Resolved.
- **Known item 3 was round 2's; round 3 known item 3 = E11 two-aim:** covered above.
- **Stage lists vs ENG-08's relaxed orders.** All match: E9 `brief osint guess flip defend debrief`;
  E11/E15/E16 `brief mistake flip defend debrief`; E13 `brief write flip defend debrief` (osint optional);
  E8/E10/E12/E14 the built orders; E17/core_17 `brief defend debrief`; core_00 `["brief"]` (`variant:brief`).
  `02` ENG-08 (lines 605-610) adds exactly these.
- **Config key names vs 02.** `flipAftermath`/`stepLabels`/`victimName`, `guess`, `mistake`/`flip.mode`/
  `flipMontageByChoice`, `world`/`costume` (except M1), `assistant`, `doneGlobal`/`oncePerLearner`/
  `briefCards`, `sortDrill`, `concernForm`, `privacyPanel`, `verdictLabels`, `page.state`, `choice` (except
  M2) all align with `02` ENG-08's key list (line 614).
- **Check-form rows vs 10 and the episode §14s.** `general_v2` scored flags (`lookalike_domain`,
  `padlock_myth`, `unrequested_mfa_push`, `senderTrust`, `linkCredible`, `reply_to_differs`) and
  `data_conduct` scored flags (`senderTrust`, `pretextRelevant`, `secrecy_or_bypass`,
  `vish_callback_pressure`, `reply_to_differs`) match 10 §296/§326 and `02` ENG-08 line 560 exactly. Episode
  mapping is consistent: `general_v2` ← E8, E9, E10, E12 (one item), E13, E15; `data_conduct` ← E11, E14,
  E16, E17. Each §14 agrees; all scenario-local tells kept out of the forms (ruling 1).
- **Companies and hosts vs BRAND_SET / 03_WORLD_AND_CAST.** Hosts verified where cited: Anjali Rao
  (`HOSTS['anjali']` in `gen_e3_e5_shells.py`), Graham Whitfield (BRAND_SET). Ruling 7 applied: E14 host is
  Julian Sallow, E11 keeps Tomasz Wiśniewski. Ruling 4 applied: E8 renamed `fenwick-brandt.example` to
  Marsden Holloway, E14 keeps Dani Fenwick with the Arthur-Fenwick/sector_01 clash recorded. Deliberate host
  reuse (Nilesh at E9/E15/E17; Anjali at E8/E16) is flagged in the specs and acceptable.
- **Seeding everything points to P12.** E8-E17 §13/§15, E12 §15, E17 §13, 11 and 13 all route course
  seeding through `01_PIPELINE.md` P12 and say not to use `awareness_deploy.py` (ruling 8). 13 §7 keeps the
  reporting-route default independent of P12 membership. 10 keeps the check pairs out of both courses
  (review-log item 7).
- **E17 is one shell.** E17 §13/§20 and 00 §3 (line 48) and 01 P5b/P12 all say one defend-only shell at
  Tarrowby, host Nilesh Solanki, in both courses (ruling 2). Consistent.
- **core_17 is defend-only with 8 messages.** 11 Part B: `variant: defendOnly`, 8-message set within
  `EPISODE_MESSAGES=(4..8)`, no engine packet, mirror pair (Gordon calls), channels email/call/voicemail/
  SMS/push/page across three companies. All 8 reuse ids grep-confirmed to exist. `02` ENG-10 (line 832) and
  00 §4 agree core_17 needs no packet. Consistent.
- **Timing totals.** All episodes sum to ~15 min (E8, E9, E10, E12, E13 land exactly 15; E11/E14/E15/E16
  land in-range by the per-stage ranges). core_00 = 5; core_17 = 8-10 shell + ~9 post-check = 17-20. No
  finding.
- **Rulings 1-10 (round 1) and 1-5 (round 2).** All applied where they apply, except as called out in B1
  (ruling 1 "shared only if a form scores it" / ruling-2 reclassification not carried into E8) and M3
  (ruling 2 "second set -> shared" not applied to `unapproved_tool`). Ruling 3 (choice scoring) is applied
  in E9 §11 (prose correct; drafted field names wrong, M2). Ruling 5 (`attack_checks` relaxation) landed in
  `02` ENG-04 point 5 and ENG-08 (m3 is only a stale wording in E11). Ruling 2 (E17 one shell), ruling 7
  (host rename), ruling 8 (P12 seeding) all applied.
- **Style.** No em or en dashes found in 00/01/02 or any episode/10/11/12/13 (checked). UK spelling and
  "cyber security" observed. `.example` domains throughout. No Hacktivity internal paths/endpoints/
  credentials in any file; 13 keeps Hacktivity at feature level and explicitly forbids recording internals.
