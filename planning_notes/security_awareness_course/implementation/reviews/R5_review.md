# R5 review: final adversarial pass over the consolidated briefs

Reviewer: fresh opus48 adversarial reviewer, round 5. Scope: every brief in
`implementation/` (00, 01, 02, 10, 11, 12, 13 and `episodes/E08` to `E17`).
Worked fresh from the current files. **No git was run** (standing instruction
"Never run git" overrides check #1's `git log`/`git show` suggestion); the
consolidation-loss and pointer checks were done against the current files
instead (pointer chains traced to their target section, not against pre-consolidation
history). Code was read directly to confirm cited facts.

## Method

- Read `WRITER_BRIEF.md` and `reviews/CONSOLIDATION_RULES.md` first, then all
  17 briefs top to bottom.
- Spot-checked **~55 cited code facts** by opening the files (list at the end).
  All were accurate; none is wrong.
- Traced every cross-document pointer the task named (engine shapes against 02,
  items against 10, build steps against 01, order/deps against 00, companies,
  hosts, tells, stage lists, seeding P12, E17 one-shell, core_17 8-message
  `defendOnly`, E12 room flow against ENG-05a).

## Headline

The set is in strong shape. Consolidation did not drop implementer-needed
content, and I found **no blockers**. The pointer chains the task flagged
(E15/E16 -> E11 §10a -> 02 ENG-04) resolve: E11 §10a explicitly says the shape
is "owned by `02_ENGINE_WORK.md` ENG-04", so an implementer is handed on to the
normative packet, not left at a dead end. Every code anchor I checked is live.
The two majors below are genuine contradictions **between owner documents**
(not code-truth errors) that a fresh implementer could act on inconsistently.

## Findings

### M1 (02 ENG-09b vs E13 §12) — ENG-09b still lists E13 as a dependent, but E13 ships a single concept panel and says it does NOT need ENG-09b

- **Evidence.** `02_ENGINE_WORK.md` ENG-09b, "Decision" (line ~748): "E8, E9,
  E10 **and E13** each need more than one short concept card, so ENG-09b is
  required for them." and "Episodes that depend on it. E8, E9, E10, **E13**"
  (line ~761). But `episodes/E13_ai_assistant.md` §12 (line ~282): "`conceptPanel`
  ... E13 has a **single** concept panel, so it uses the built one-panel
  `strings.conceptPanel` and does **not** need ENG-09b (unlike E8, E9 and E10...)".
  E13 §3's depends-on table omits ENG-09b, consistent with E13's own single-panel
  claim. `00_README.md` §5 only names E8 for ENG-09b, so 00 is fine; the stale
  reference is inside 02.
- **Why it matters.** Consolidation rule 2 gives each fact one home and rule for
  disagreements: the episode owns its own content (how many panels it has), so
  E13 is authoritative and 02 is stale. Low build-blast-radius (ENG-09b is
  additive and E13 won't call it), but it is a direct contradiction a reviewer
  must not leave: an engine agent reading ENG-09b's dependent list would expect
  an E13 array panel that never comes.
- **Fix.** In 02 ENG-09b drop E13 from the "Decision" sentence and from
  "Episodes that depend on it" (leave E8, E9, E10). E9 and E10 genuinely need it
  (verified: `E09_passwords.md` §12 and `E10_...md` §12 both author multiple
  concept cards), so keep those.

### M2 (E12 §9.1 item 3 / §15 vs 02 ENG-05c) — the two owner docs disagree on where the badge-door lock is authored and on its keyPins

- **Evidence.** 02 ENG-05c change 2: "Copy the exact lock keys from m02's
  `security_office` room block (`...:3104-3122`) ... **onto the locked room's
  block (`rooms.training_room`)**", keyPins `[40, 30, 55, 35]`. E12 §9.1 item 3:
  "copy `m02_ransomed_trust` `it_department`, `scenario.json.erb:2001-2004` ...
  **on the lobby room's connection to `training_room`**, `"locked": true ...
  "keyPins": [35, 45, 25, 55]`"; and E12 §15 (line ~723): "The **lobby** room
  holds ... the locked badge door to `training_room`".
- **Code truth.** In m02 the lock keys live on the **room block being entered**
  (`security_office` block has `locked/lockType/requires/keyPins/difficulty` at
  `:3104-3122`; `it_department` likewise at `:2001-2004`), beside `connections`,
  not on a connection. To bar a courier in the lobby from the studio, the lock
  belongs on `rooms.training_room` (ENG-05c is mechanically correct). E12's "on
  the lobby room's connection" / "the lobby holds the locked door" would mis-place
  it (locking the lobby, or an object the schema has no slot for).
- **Also disagree.** keyPins `[40,30,55,35]` (ENG-05c) vs `[35,45,25,55]` (E12),
  and which m02 block to copy (`security_office` vs `it_department`). Both cited
  blocks are real and accurately quoted; they are just two different examples.
- **Mitigation.** The door is narrative-only and never gates progress in either
  brief (learner starts in `training_room` = `startRoom`, returns via `loadRoom`
  on any outcome), so the functional blast radius is small; but consolidation
  rule 7 ("E12 and ENG-05a ... must match exactly") and rule 2 (02 owns engine
  shapes) are not met here.
- **Fix.** Align E12 §9.1 item 3 and §15 to ENG-05c: author the lock on
  `rooms.training_room`, keyPins `[40,30,55,35]`, and describe the door as "the
  lock on the studio (`training_room`) that the lobby opens onto", not "the lobby
  holds the door". Keep `requires: "merrin_studio_badge"` (both already agree).

### m1 (E15 §2/§3, E16 §2/§3) — the flip-mechanic pointer frames E11 §10a as "the ENG-04 config shape" when §10a is a worked instance, not the normative shape

- **Evidence.** E15 §2 Read-first: "`E11_misdirected_data.md` section 10a (the
  ENG-04 config shape; required reading, do not re-derive it)"; E16 §2 the same.
  But E11 §10a says the shape is "owned by `02_ENGINE_WORK.md` ENG-04; do not
  redefine them here" and shows only **one** beat with `// ... one object per
  everyday choice`. 02 ENG-04 says: "The normative config shape is in this packet
  (below); E11 §10a mirrors it with worked content."
- **Chain resolves** (so this is not a broken pointer / blocker): E15/E16 both
  list ENG-04 in §3 as the dependency, and E11 §10a hands on to ENG-04. The
  defect is only that §2 calls an example "the config shape", which could lead an
  implementer to treat E11 §10a as authoritative for field semantics (the
  `safe`/`approvedRoute`/`flipBeat` lints, the montage-key lints) that live only
  in ENG-04.
- **Fix.** Reword E15/E16 §2 to "02 ENG-04 (the normative `mistake`/montage
  config shape); E11 §10a is a worked example of it".

### m2 (E16 §11 item 2) — the flag column is self-contradictory, so the implementer cannot tell what `truth.flags` to write

- **Evidence.** `episodes/E16_insider_risk.md` §11, row 2 `e16_shared_login_req`,
  "Tells and flags" cell: "`borrowed_authority` (none, really; a colleague's
  convenience ask)". It both lists `borrowed_authority` and says there is none.
  The row's `isPhish` is also unstated (it is a genuine-colleague bad ask).
- **Fix.** State item 2's `truth.flags` explicitly (likely `[]`) and its
  `isPhish` value; if `borrowed_authority` is not scored, drop it from the cell.

### m3 (E16 §11) — the defend set's `channelTells` is given in two places and must be mentally merged

- **Evidence.** §11 line ~204 lists `channelTells`:
  `["unrequested_mfa_push","secrecy_or_bypass","borrowed_authority"]` + the local
  `insider_offer`; then line ~220 adds "Add `lookalike_domain` to `channelTells`
  for item 5." A fresh implementer must combine the two. (This is the kind of
  "addendum" consolidation rule 4 asks to be merged into its section.)
- **Fix.** Give the final `channelTells` once:
  `["unrequested_mfa_push","secrecy_or_bypass","borrowed_authority","lookalike_domain"]`
  plus the local `insider_offer`.

### m4 (12 WP-15, item 1) — the `senderTrust`-on-SMS justification is imprecise

- **Evidence.** `12_WP15_CORE02_ITEMS.md` item 1 `e6_chat_new_number`:
  "`flags: ["senderTrust", "secrecy_or_bypass"]` (both allowed on `sms`;
  `senderTrust` is **not in the `sms` exclude list**...)". `senderTrust` is a
  **factor**, not a channel tell, so it is never in any `KIND_TELL_EXCLUDE` list;
  and factors are **not** offered on a non-email card by default. It is scorable
  on the SMS only via the N-14 clause in `chipIdsFor` (`triage-flags.js`
  lines ~175-178), which adds a message's **authored** factors to a non-email
  card's chip list. No built E6 SMS item scores a factor, so this would be the
  first. The conclusion (it can be scored) is correct; the reasoning is wrong.
- **Fix.** Replace "not in the sms exclude list" with "an authored factor is
  surfaced on a non-email card by `chipIdsFor`'s N-14 clause (`truth.flags`
  factors are added back), so `senderTrust` is tickable on this SMS item".

### t1 (E17 §19) — wrong section cross-reference

- `episodes/E17_acceptable_use.md` §19: "The 'can I?' sort ... scored by the
  awareness profile ... (this changes **section 11b**)". The sort is §11a; §11b
  is the triage set. §20 uses 11b correctly. **Fix:** 11b -> 11a in §19.

### t2 (E12 §15) — lobby-map path drops the repo prefix

- E12 §15 (line ~731): "Lobby map `assets/rooms/room_aw_merrin_lobby.json` / `.tmj`".
  01 P5b step 2 explicitly warns "there is no top-level `assets/`" (the real path
  is under `public/break_escape/assets/`). The built maps live at
  `public/break_escape/assets/rooms/`. **Fix:** write the full path, or point at
  P5c for the real location (the script fixes it anyway, so this is cosmetic).

### t3 (scope note, not a brief defect) — check #1 done without git

- Per the standing "Never run git" instruction I did not run `git log`/`git show`
  to diff against pre-consolidation versions. I checked instead that every
  cross-reference resolves to a live section/anchor in the current files and that
  no implementer-needed content (lines, items, keys, steps, acceptance checks)
  is missing from the section that now owns it. If a true before/after diff is
  wanted, an agent allowed to run git should run it; nothing I read suggests a
  loss.

## Consolidation-loss check (no git): nothing lost or dangling that I found

- The E15/E16 -> E11 §10a -> ENG-04 chain resolves (M1-adjacent wording aside).
- Every "(no engine packet)" / "01 P12" / "01 P5b" / "01 P5c" / "ENG-0x" pointer
  I followed lands on a real section.
- E17 one-shell is stated identically in 00 §3, 01 P12 and E17 §13.
- core_17 is `defendOnly` with 8 messages: WP-12 Part B matches `EPISODE_MESSAGES
  = (4..8)` (verified in `awareness.rb:30`); 8 is the cap, so it validates.
- E12 room-move semantics match ENG-05a exactly (`world.startRoom` =
  `training_room` = scenario `startRoom`; `world.room` = `lobby`; `window.loadRoom`;
  return on any outcome; "Studio" only as `door_sign`). The only E12/ENG-05
  disagreement is the lock placement (M2), which is ENG-05c, not ENG-05a.

## Cross-document consistency: checked and consistent

- **Companies and hosts** across 00 §3, WRITER_BRIEF and every episode: E8
  Quayholt/Anjali Rao, E9 Tarrowby/Nilesh Solanki, E10 Quayholt/Niamh Doherty,
  E11 Carrholme/Tomasz Wiśniewski, E12 Merrin & Sallow/Lorna Easton (kiosk) +
  Delphine Arvanitis (lobby), E13 Brightwell/Gwen Pritchard, E14 Merrin &
  Sallow/Julian Sallow, E15 Tarrowby/Nilesh, E16 Quayholt/Anjali, E17
  Tarrowby/Nilesh. All consistent; the E15/E17 Nilesh reuse and the E12 two-NPC
  split are both flagged in their specs.
- **Tells (local vs shared):** the ENG-08 table marks all new E8–E17 tells
  local, and each episode's §11 matches it. The load-bearing claim that a
  scenario-local tell bypasses `KIND_TELL_EXCLUDE` is **true** (`chipIdsFor`
  only excludes ids in the per-kind list, which hold shared-library ids only;
  comment at `triage-flags.js:84-86` confirms "A scenario-local tell ... is never
  filtered"). `flag_universe` (`triage.rb:209`) accepts a labelled non-factor
  `channelTells` id, exactly as every episode relies on. `unapproved_tool`
  staying local in both E15 and E17 is consistent in 02 ENG-08, E15 §11 and
  E17 §11b.
- **Check items (10) against the episodes:** E8/E9/E10/E13/E15 + one E12 item ->
  `general_v2`; E11/E14/E16/E17 -> `data_conduct`; every episode §14 points at 10
  and names the right rows (e.g. E14 -> `dca_recruiter_probe`/`dca_comms_ok`;
  E16 -> `dca_login_favour`/`dca_manager_report`). The factor-vs-channel-tell
  rule (`FACTORS` never in `channelTells`) is stated correctly in 10 and
  verified against `triage.rb:35`.
- **Stage lists** against `STAGE_IDS` / `stage_orders`: E8 `brief osint write
  flip defend debrief` (built); E9 `brief osint guess flip defend debrief`
  (ENG-02 + the ENG-08 order); E11/E15/E16 `brief mistake flip defend debrief`
  (ENG-04 + its order + the `attack_checks` relaxation); E12 the built call-attack
  order; E13 `brief write flip defend debrief` (ENG-08's osint-optional order);
  E17 / core_17 `brief defend debrief` (`STAGES_BY_VARIANT['defendOnly']`). Each
  new order is one 02 adds; none removes a built order.
- **E12 room flow vs ENG-05a / ENG-05c:** two-NPC split, `person` NPC resolved
  via `cfg.channels.person` (verified `episode-runner-minigame.js:640`),
  `callLaunch` picks person-chat for a non-phone NPC (`pretext-card.js:240`),
  flip hand-back reuses `watchCall` (`:760`) so no `#trigger_minigame`. All
  accurate.

## Code-truth spot checks (all accurate)

`episode-model.js`: `STAGE_IDS:27`, `ATTACK_STAGES:28`, `DEFAULT_STAGES.full:32`,
`stateKey:41`, `cleanSent:81`, `readState:129`, `completeStage:153`, flip clears
`sent` at `:160`, `writeKind:166`, `childLaunch:180`, build branch `:187`,
write/call branch `:204`. `awareness.rb`: `STAGES:18` (9 ids), `STAGES_BY_VARIANT:19`,
`EPISODE_MESSAGES=(4..8):30`, `CHECK_MESSAGES=10:31`, `attack_checks` guarded by
`full?` at `:53`, `attack_checks:182`, `string_checks:296` + the `conceptPanel`
loop `:305` (confirms ENG-09b's array-would-error claim), `defend_set:359`
(`defend.setId is missing` at `:362`), `conclusion_checks:444`, `stage_orders:157`,
`full?:88`, `check_mission?:83`. `triage-kinds.js`: `NON_EMAIL_KINDS:23`,
`VERDICT_ACTIONS:40`, `actionsFor:66`, `kindVerdictLine:93`, `page():364`,
`call():449`, `SURFACES:507`, `renderKindSurface:514`. `triage-flags.js`:
`SKILL_NAMES:47`, `KIND_TELL_EXCLUDE:90`, `chipIdsFor:154` (+ local-tell and
N-14 logic), `redFlagString:196` (factorStrings -> CANONICAL -> CHANNEL_TELLS ->
id). `phish-rules.js`: `CHANNEL_TELLS:52` = exactly 12 ids. `triage.rb`:
`FACTORS:35` = 7 ids, `CHANNEL_TELLS:38` = 12, `flag_universe:209` (+ the exact
error string 10 quotes), `page.url is missing:395`. `triage-scoring.js`:
`KIND_VERDICT_POINTS:43`, `VERDICT_POINTS:70`, `verdictPoints:88`,
`FULL_VERDICT_POINTS=60:103`, `perMessage` record `:285`. `scenario-schema.json`:
`variant` enum `["full","defendOnly"]:1782`, `conceptPanel:1898`,
`room_aw_merrin_sallow:2610`, page `padlock:1712`. `person-chat-ui.js`:
`initVideoCallOverlay:255`, `SECURE VIDEO LINK:264`. `npc-manager.js` video-call
at `:910-912` and `:1100-1122` (confirms E13's "not :1251" correction).
`rooms.js` `loadRoom:773` + `window.loadRoom:3282`. `player-avatar.js`
`chosenPlayerSprite:26`/`playerTalkPath:41`/`syncScenarioPlayer:55`;
`core/player.js` `updatePlayerSprite:118`. m02 `security_office` lock
`:3104-3122`, `it_department` lock `:2001-2004`, guard `unlockable:3238`.
`social-awareness-rule-of-thumb.test.mjs` asserts 38 shells `:22`; the two
`CHANNEL_TELLS`->`SKILL_NAMES` loop tests at `social-triage-weakest.test.mjs:201`
and `social-gap-triage-flags-comparison.test.mjs:89`. `AWARENESS_RULE_OF_THUMB_TEXT`
in `awareness_deploy.py` is byte-identical to the quote in E8 §12 and WP-12.
All 8 core_17 reused item ids exist in their fragments; WP-12B inks
(`graham_pre.ink`, `chidi_okeke.ink`) exist; WP-15 swap targets
(`e6_fuel_card_offer`, `e3_call_on_behalf`) exist; `check_door_alignment.py`
exists; Anjali's `HOSTS['anjali']` (sprite `female_scientist`) is in
`gen_e3_e5_shells.py:43`.

## Readability (a fresh Sonnet, once, top to bottom)

Good across the board. The 20-section episode layout is followed; each episode
gives its content as final strings/JSON (E8, E12 especially) so a Sonnet invents
nothing. The two residual readability snags are m1 (example framed as the
normative shape) and m3 (a `channelTells` addendum not merged into the list).
Style is clean: UK spelling, "cyber security" two words, `.example` only, no
em/en dashes seen, no Hacktivity internals in the public repo.

## Verdict

**Ship-ready after the two majors are reconciled.** No blockers; no code-truth
errors; no lost or dangling content found. Fix M1 (drop E13 from ENG-09b's
dependents) and M2 (align E12's badge-door lock to ENG-05c: lock on
`rooms.training_room`, pins `[40,30,55,35]`) so two agents cannot build the same
thing two ways. The four minors and three trivials are worth a quick pass but do
not gate the build.

Counts: **B 0 · M 2 · m 4 · t 3.**
