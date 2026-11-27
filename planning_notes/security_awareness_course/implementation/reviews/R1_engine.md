# R1 engine review (round 1)

Reviewer: adversarial engine lens. Scope: `00_README.md`, `01_PIPELINE.md`, `02_ENGINE_WORK.md`,
checked against the code in `/home/user/BreakEscape` on 2026-10-28. I did not edit any brief and ran
no git.

## What I could and could not run

- Ran: `node --test test/js/social-awareness-fragment-erb-parity.test.mjs
  test/js/social-awareness-rule-of-thumb.test.mjs` -> both pass (8 subtests). The rule-of-thumb
  test confirms exactly 38 awareness shells today, and the parity allow-lists
  (`STRINGS_VALUE_EXEMPT`, `STRINGS_ERB_ONLY_OK`, `SET_ERB_ONLY_OK`) match what `01` and `02`
  quote.
- Could not run: every jsdom engine test and the whole `bin/test-js` CI job. `node_modules/jsdom`
  is not installed in this container (`ERR_MODULE_NOT_FOUND: Cannot find package 'jsdom'`), so
  `social-episode-*`, `social-triage-*`, `validator-social-*` fail to load for an environment
  reason, not a content one. I also did not run the Ruby validator (`bundle` not exercised) or any
  bridge (Node 24 / keyless server not present). Line and symbol claims below were checked by
  reading the source.

## Verified correct (so the briefs can be trusted on these)

All of the following paths, symbols and line numbers were opened and match the briefs:

- `episode-model.js`: `STAGE_IDS` (:27 = `brief,osint,build,write,mfa,flip,defend,debrief,check`),
  `ATTACK_STAGES` (:28), `DEFAULT_STAGES.full` (:32), `stagesFor` (:60, drops `ATTACK_STAGES` for
  `defendOnly` at :68), `childLaunch` (:180, `build` branch :187, `write`/call branch :204),
  `writeKind` (:166), `completeStage` (:153, clears `sent` on flip at :160), `stateKey` (:41),
  `cleanSent` (:81), `flipPage` (:266). The opt-in guard story (authored ids only, kept if in
  `STAGE_IDS`) is accurate.
- `episode-runner-minigame.js`: `_flipProps` (:466, returns `{message,page,call,missed,landedNoTells}`,
  `missed:true` when `rec.landed===false`), `_stripLabels` (:429, exactly the call-only override
  `02`/ENG-01 quotes), `_renderFlip` (:489), `_renderFinished` (:532, reached from :336),
  `_launch` (:548), `_launchCall` (:629, writes state through `deps.write` at ~:648), `watchCall`
  (:760), `_reopenParams` (:661), `_renderBrief` (:384, single Start button -> `_complete('brief')`),
  `_saveState` (:255), `STAGE_COPY` (:79).
- `flip-view.js`: `renderFlipView` signature (:91), the up-to-three `parts.push` model,
  `renderKindSurface` reuse (:164), `tellSentence` (:85).
- `triage-kinds.js`: `NON_EMAIL_KINDS` (:23 = `sms,voicemail,qr,page,call,push`), `actionsFor` (:66),
  `kindVerdictLine` (:93), `SURFACES` (:507), `renderKindSurface` (:514), `page()` (:364),
  `call()` (:449).
- `triage-flags.js`: `chipIdsFor` (:154, `local()` = flagChips label and not a factor),
  `KIND_TELL_EXCLUDE` (:90), `redFlagString` (:196).
- `phish-rules.js` `CHANNEL_TELLS` (:52, exactly 12 ids). `triage.rb` `CHANNEL_TELLS` (:38, the same
  12), `FACTORS` (:35, exactly 7), `flag_universe` (:209, scenario-local tell allowed when
  `flagChips` labels it and it is not a factor), `NON_EMAIL_KINDS` (:50).
- `awareness.rb`: `STAGES` (:18, 9 ids), `STAGES_BY_VARIANT` (:19, full=`brief,osint,write,flip,
  defend,debrief`), `stage_orders` (:157, base + build-after-osint + mfa-after-write/flip only, so
  `osint->guess->flip` and `brief,write,flip,...` with no osint are genuinely rejected today),
  `MFA_AFTER` (:25), `BUILD_AFTER` (:28), `EPISODE_MESSAGES` (:30 = 4..8), `CHECK_MESSAGES` (:31 = 10),
  `string_checks` (:296), `flip_by_choice_checks` (:334), `call_and_page_checks` (:231). An unknown
  variant is rejected at `stage_checks` (:150), confirming `["brief"]` needs ENG-10's validator work.
- `scenario-schema.json`: `socialAwarenessEpisode` and `socialTriageSet` are
  `"additionalProperties": false`; `stages` enum (:1788) and triage `kind` enum (:1173) list exactly
  the current ids; `conceptPanel` (:1898); room `type` enum ends `room_aw_merrin_sallow` (:2610), so
  `01` P5b's "add after merrin_sallow" is right.
- `player-avatar.js`: `chosenPlayerSprite` (:26), `playerTalkPath` (:41), `syncScenarioPlayer` (:55).
  `core/player.js` `updatePlayerSprite` (:118). `npc-game-bridge.js` `unlockDoor` (:77).
  `chat-helpers.js` `unlock_door` (:71), `trigger_minigame` (:190, notification-only today, exactly
  as ENG-05e says).
- `person-chat-ui.js`: `initVideoCallOverlay` (:255), hard-coded `SECURE VIDEO LINK` span (:264).
- `debrief-view.js` `buildPanel` (:202) and single `conceptPanel` render (ENG-09b correct).
- Generators / rooms: `training_room.py`, `awareness_deploy.py`
  (`AWARENESS_RULE_OF_THUMB_TEXT`/`_HEADING` present; E1 erb carries the identical
  `{heading:"The habit to keep", text:...}`), `gen_e6_e7_shells.py`, `apply_training_room.py`,
  `scripts/room_gen/{make_aw_tileset.py (SHEETS :47), make_aw_props.py (COMPANIES :140),
  build_aw_rooms.py (COMPANY_OPS :65, room_uni_seminar skeleton)}`, `generate_rooms.py` room_aw
  comment (:4688, exact), `game.js` merrin_sallow tilemap/image loads.
- Tooling: `run-suite.sh` `JOBS` (e1..e7-full, p7-channels, p7-episode, 6, r4-door all present;
  add-beside-e7 instruction correct), `check-bridge.mjs --expect` behaviour (counts evals, fails on
  non-true or short run), `new-game.rb`, `start-keyless-server.sh`, `check_door_alignment.py`,
  `compile-ink.sh`, `ink_runtime_check/{dialoguelint,reopencheck}.mjs`, `missions.json`.
- Known-issue 10: E12 full stages `["brief","osint","write","flip","defend","debrief"]` is an
  already-allowed order (no relaxation needed); E13 full stages `["brief","write","flip","defend",
  "debrief"]` is rejected today and is exactly what ENG-08's new "osint optional" order adds.
  Consistent.

## Findings

### B1 (blocker) -- `00_README.md` §4, §5, §11: ENG-10 to ENG-13 are absent from the build plan

`02_ENGINE_WORK.md` defines ENG-10 (core_00 brief-only + completion global), ENG-11 (reusable sort
drill for E14/E15/E17), ENG-12 (E16 concern form) and ENG-13 (E14 privacy panel). `00_README.md`
does not know they exist:

- §11 (line 229): "`02_ENGINE_WORK.md` | engine packets **ENG-01 to ENG-09**". Wrong; 02 runs to
  ENG-13. (The WRITER_BRIEF packet table also stops at ENG-09, but that file is out of scope.)
- §5 dependency table lists no ENG-10/11/12/13 row and wires none of them: WP-12 is "their own
  files" (line 103) though it needs ENG-10; `E14 | ENG-09a` (line 90) omits ENG-11 and ENG-13;
  `E11, E15, E16 | ENG-04, ENG-09a` (line 89) omits ENG-12 for E16; `E17 | ENG-09a, P5b` (line 91)
  omits ENG-11.
- §4 work order never schedules the four packets.

Evidence: `00_README.md:103,90,89,91,229` vs `02_ENGINE_WORK.md:740` (ENG-10), `:783` (ENG-11),
`:839` (ENG-12), `:869` (ENG-13). An orchestrator planning from `00`'s table (which `00` presents as
the authoritative dependency graph) would build no sort drill, no concern form, no privacy panel and
no brief-only support, then WP-12 and E14 to E17 fail at wiring/validation (their config keys hit
`additionalProperties:false`). Fix: add ENG-10 to ENG-13 to §11's count, give each its own §5
dependency row with the right "needs/unblocks", add them to the §4 work order, and change the WP-12
row from "their own files" to "ENG-10 + their own files". Confirms known issue 5's root cause.

### M1 (major) -- known issue 1: ENG-01 `flipAftermath` does not match E08's `flip.becomeVictim`

ENG-01 (`02_ENGINE_WORK.md:82-99`) defines an episode-level `awarenessEpisode.flipAftermath`
(`heading`, `intro`, `items[]` authored inline as sent-row/push surfaces, `line`), deliberately kept
out of `strings`. E08 (`episodes/E08_after_the_click.md:134-135,206,236`) depends on a different
shape: `awarenessEpisode.flip = { variant:"becomeVictim", victimTarget:"takeover_victim",
firstSign:"e8_sent_invoice" }` plus a `becomeVictimIntro` string. ENG-01 provides no `variant`,
`victimTarget` or `firstSign`, and no `becomeVictim*` string. In particular E08's `firstSign` names a
**defend-set message** to show as the opening sign, which has no home in `flipAftermath.items`.
Known issue 1 says "ENG-01 wins", and E08 line 236 defers key names to ENG-01, but the mismatch is
structural, not just naming, so an E08 implementer reading both would guess. Fix: in ENG-01, add one
sentence mapping E08's "first odd sign" onto a `flipAftermath.items[0]` of `kind:"email",
folder:"sent"` (reconstructed from the sent record, not a defend-set id), and tell the E08 writer to
rewrite §9/§10/§16 to `flipAftermath` with inline items and drop `firstSign`/`becomeVictimIntro`.

### M2 (major) -- `02` ENG-03a vs ENG-08 disagree on where two web tells live

ENG-03a §3 (`02_ENGINE_WORK.md:230`) states the five new web tells -- `fake_check_paste`,
`fake_update_prompt`, `fake_alarm_callback`, `browser_permission_grab`, `dangerous_download` -- "are
added to the **shared library**". ENG-08's tell table (`02_ENGINE_WORK.md:592-593`) classifies
`fake_alarm_callback` and `browser_permission_grab` as **local** ("one set uses it ... keep separate
as a local chip"), i.e. declared only in E10's `channelTells`/`flagChips` with no edit to
`phish-rules.js`/`triage.rb`. An implementer cannot follow both: shared means append to
`CHANNEL_TELLS` in both files, local means do not touch them. Fix: make ENG-03a §3 say "three of
these (`fake_check_paste`, `fake_update_prompt`, `dangerous_download`) go in the shared library per
ENG-08; `fake_alarm_callback` and `browser_permission_grab` stay local to E10's set", matching
ENG-08's table (which is the correct one, since only one set uses the two local ids today).

### M3 (major) -- known issue 3 confirmed: E09 leans on ENG-02 for work ENG-02 disowns

E09 (`episodes/E09_passwords.md:27,69,74,144`) makes ENG-02 own both the attack guesser **and** the
defend-half password-practice cards, proposes running the guesser in the built `build` stage
(line 69), an attack half ending `osint -> build -> flip` with no `write` (line 70), and says "the
defend-only variant still needs ENG-02" (line 74). ENG-02 contradicts every part: it creates a new
`guess` stage because reusing `build` "would open the wrong child" (`02:130-132`), its scope line
disowns the defend cards ("delivered by the `choice` triage kind in ENG-09a, not here ... This
packet does not touch the triage defender", `02:136`), and its Stop-and-ask already rules "E9 §7's
'the defend-only variant still needs ENG-02' should read 'needs ENG-09a'" (`02:189,197`). `00`'s
dependency table is right (`E9 | ENG-01, ENG-02, ENG-09a`, line 83). 02 is internally correct; the
fix lands in E09 §7/§9/§11/§13: author the password cards as ENG-09a `choice` items, drop the
`build`-reuse proposal in favour of ENG-02's `guess` stage, and make the defend-only dependency
ENG-09a not ENG-02.

### M4 (major) -- known issue 4 confirmed: E10 leaves the browser verdict open; ENG-03a has settled it

E10 (`episodes/E10_downloads_and_fake_checks.md:29,98,194,205`) still frames the three-way browser
verdict as an unresolved "label change or a new verdict? confirm with ENG-03" question. ENG-03a has
decided: it is a `verdictLabels` relabel of the existing `trust/report/delete` ids, with no scorer
change (`02:217,250`), and ENG-03a explicitly says "E10 §11 must change to state that the browser
verdict is a label change, not a new verdict." 02 is correct and the guard is real (I confirmed
`VERDICT_ACTIONS` ids and scoring are untouched by a label pass). Fix: rewrite E10 §9/§11/§19 and
open-question 1 to state the decided `verdictLabels` mapping (`trust->Carry on`, `report->Close and
report`, `delete->Go the trusted way`) and remove the "new verdict" option.

### M5 (major) -- known issue 13 confirmed: `11` ships a stage list the validator rejects and never cites ENG-10

`11_WP12_FIRST_PLAY_AND_ANNUAL.md:79-80` ships core_00 with `variant:"full"`, `stages:["brief"]`,
and line 39 asserts "`stagesFor(episode)` keeps any authored stage id in `STAGE_IDS`, so
`stages:["brief"]` runs...". The runner model does accept it, but the **validator** does not:
`awareness.rb` `stage_checks` (:143) only accepts the `full`/`defendOnly` stage orders, so a `full`
episode with `["brief"]` fails, and `11`'s own acceptance runs
`validate_scenario.rb ... --strict-social` (line 151) which would exit 1. ENG-10 (`02:740`, esp.
point 4 at `:764`) adds the needed validator allowance (prefer a new `variant:"brief"`), but `11`
never references ENG-10 anywhere (grep: no match). Fix: add ENG-10 to `11`'s "Depends on", change
core_00 to the ENG-10 `brief` variant with `doneGlobal`, and note the validator work is ENG-10's,
not an existing capability. (Pairs with B1: `00` must also list ENG-10 as the WP-12 dependency.)

### m1 (minor) -- known issue 11: four em dashes in `02`

`02_ENGINE_WORK.md:189,787,788,789` each contain a prose em dash ("--" rendered as the dash char),
against the "no em or en dashes" style rule (`00` §7, WRITER_BRIEF). None are inside quoted code or
existing strings. Fix: replace with a colon, comma, or re-phrase.

### m2 (minor) -- known issue 2: ENG-05a is titled and indexed as a "stage" although it is a modifier

ENG-05a's heading "World-play attack **stage** `world`" (`02:323`) and the packet-index row
"ENG-05a world **stage** `world`" (`02` index), and `00` §5's "ENG-05a world **stage** hand-off"
(`00:92`), all read as if `world` were a new `STAGE_IDS` entry. The body corrects this
(`02:340`: "Name the modifier `world` rather than a new stage ... not a new `STAGE_IDS` entry"), but
a Sonnet implementer who acts on the heading/index first could add `world` to `STAGE_IDS`/
`ATTACK_STAGES` (as ENG-02/ENG-04 legitimately do for real stages), breaking the frozen order and
E12's lint. Fix: retitle to "World-play attack **modifier** `world`" in the heading, the packet
index and `00:92`.

### m3 (minor) -- ENG-04 is not self-contained: its config shape lives in a content spec

ENG-04 says the config is "**defined once in E11 §10a** ... required, do not redefine" (`02:286,288`)
and the engine implementer must open `episodes/E11_misdirected_data.md` (§10a confirmed to exist) for
the authoritative `mistake`/`beats`/`flipBeat`/`flipMontageByChoice` shape, while ENG-04 only
sketches it. This breaks WRITER_BRIEF's "each packet is self-contained and sized for one Sonnet run",
and if E11 §10a and ENG-04's sketch ever diverge the shape is ambiguous. Fix: copy the full
normative shape into ENG-04 (with E11 §10a marked as the mirror), so the engine agent needs no
content file.

### m4 (minor) -- ENG-02 `patternSlots` template is ambiguous

The ENG-02 config example (`02:155-170`) has `patternSlots:[{ id:"team", factId:"...",
template:"{team}{year}" }, { id:"pet", ... }]`: the `team` slot's template references `{year}`, but
each slot resolves a single `factId`, and nothing says how a template token (`{year}`) that is not
this slot's fact is filled. An implementer would guess whether tokens cross slots or each template
uses only its own fact. Fix: state that a template interpolates only the slot's own fact value (and
give a one-fact example), or add the `year` fact/slot the example needs.

### m5 (minor) -- ENG-10 does not spell out the schema `variant` enum change

ENG-10 point 4 (`02:764`) says "Allow `stages:["brief"]` for a new `variant:"brief"`" and "Add
`doneGlobal`, `oncePerLearner` and `strings.briefCards`... to the schema", but does not mention that
the schema `variant` enum (`scenario-schema.json`, currently `["full","defendOnly"]`) must gain
`"brief"`, or the schema will reject the new variant before the validator sees it. Fix: add "extend
the `variant` enum with `brief`" to ENG-10's schema list.

### t1 (trivial) -- ENG-03a cites `VERDICT_ACTIONS (:42)`; it is at `triage-kinds.js:40`.

### t2 (trivial) -- ENG-07 cites `npc-manager.js` `conversationMode:"video-call"` "around :1251"; the actual video-call handling is around `:911` and `:1110` (no match near 1251).

### t3 (trivial) -- `01` P5b cites `game.js` "around lines 142 and 238" for the merrin_sallow map/tile loads; they are at :145 and :241 (author already hedged "around").

## Verdict

not clean
