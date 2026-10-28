# R2 review, lens: Sonnet dry run, round 2 (E8 pilot, E11 consequence flip, E9 / WP-12 light pass)

Reviewer stance: a fresh Sonnet implementer holding only these briefs. Read-only: no git, nothing edited outside this file. Severity scale is `WRITER_BRIEF.md`: B blocker, M major, m minor, t trivial. No Hacktivity internals are recorded here.

## What I checked against the repo

| Check | Result |
|---|---|
| Every path in `00_README` §11, `01_PIPELINE`, E08 §2, `10_CHECK_FORMS` "Read first", E11 §2, WP-12 | All exist except E08 §2's `modules/.../03_WORLD_AND_CAST.md` (real file is `security_awareness_course/03_WORLD_AND_CAST.md`; t2 below). |
| `python3 AW/training_room.py quayholt_insurance` | Works. Prints `scenario.lighting`, `startPosition`, `host.position`, `rooms.training_room`. |
| `python3 scripts/room_gen/build_aw_rooms.py --check` (writes to a temp dir only) | Works. Prints `same` for 4 companies (8 lines). P5b's "five maps" is right only after Carrholme is added. |
| `STAGE_IDS`, `ATTACK_STAGES`, `stagesFor`, `cleanSent`, `readState`, `completeStage`, `childLaunch`, `_flipProps`, `_launch`, `_render`, `STAGE_COPY`, `STAGE_LABELS`, `CHANNEL_TELLS` (JS and Ruby), `SKILL_NAMES`, `actionsFor`, `awareness.rb` `stage_orders` / `attack_checks` / `defend_set` / `set_checks` | Read. Line numbers quoted in 02 match. Two things they do not say are findings M4, M5, M7, M8. |
| IDs reused by WP-12 Part B (17 ids), `e3_push_early`, `hb_vm_locked`, `ha_call_printer`, `hb_policy_refresh` | All exist where the briefs say. |
| `10_CHECK_FORMS` arithmetic | Difficulty mix 5/4/1 and the flag multisets add up in both forms. The worked `PERMUTE` pair is disjoint (A phish at 0-based slots 0,2,4,6; B at 1,3,5,7). The R1 fault is gone. |
| Validator, bridges, `bin/test-js` | Not runnable here (no `node_modules`, Node v22, no gems). `00_README` §8 says so honestly. |

## Findings

### B1. WP-12 Part B (core_17 annual) cannot pass `--strict-social` as written, and nothing in 02 relaxes it

- **Files:** `11_WP12` Part B "The shell and the combined set" and "Acceptance"; `02` ENG-08, ENG-04, ENG-10; `scripts/validate_social/awareness.rb`.
- **Evidence (three independent errors):**
  1. `variant: "full"` with `stages: ["brief","defend","debrief"]`. `stage_orders('full', ...)` allows only `brief osint write flip defend debrief` (plus `build`/`mfa`). ENG-08 adds three orders (guess, mistake, write-only); none is this one.
  2. `attack_checks` runs for every `full?` episode and errors "a full episode needs an attack block". ENG-04 change 5 relaxes this, but only as a side effect of the consequence-flip packet. Part B does not depend on ENG-04.
  3. The combined set holds 17 messages. `set_checks` errors outside `EPISODE_MESSAGES = (4..8)`.
- The text says "unlike core_00, this works today because there is a defend set". It does not.
- **Fix:** add an ENG-08 line (or an ENG-10 sibling) for an "annual" shape: a stage order `brief defend debrief` allowed for a full-variant episode with no attack, plus a per-variant message cap (or a flag that lifts the 4..8 cap). Or cut the run to 8 items. Say which. Add the packet to the Part B "Depends on".

### M1. E8 still supplies none of the shell and generator metadata (R1 M4, not fixed)

- **Files:** `E08` §8, §13, §15; `01` P2, P4; `gen_e6_e7_shells.py` (`EPISODES[...]['defend']`, `HOSTS`, `LINES`).
- **What I would have to invent:**
  - For the defend-only shell, `defend.name`, `endGoal`, `aim` (id, title, description), `task` (id, title), `kiosk` (two observation strings), `display`, `desc`, `minutes`, `defendIntro`, `conclusion` (title, body).
  - A `HOSTS['anjali']` entry and `LINES[('e8','defend')]` (before, after, choice, reply). Anjali's entry exists in `gen_e3_e5_shells.py` (`sprite: 'female_scientist'`), not in `gen_e6_e7_shells.py`, which P4 says to copy from.
  - For the full erb, both aims' ids, titles and descriptions, the conclusion task id and title (E08 names only `send_takeover_phish`), the `conclusionScreen` title and body, the kiosk observations and variant, and the `mission.json` `display_name`, `description` and `cybok` keywords.
  - The host's spoken lines for the full shell.
- E08 §4 says `opus48` does "content writing" but never makes "P1 content complete, including these fields" a gate before a Sonnet starts P2.
- **Fix:** add an E08 "§8b metadata" table with every field above as final strings, or add one sentence to E08 §4 and 01 P1 that the `opus48` writer must fill them before wiring starts. Say Anjali's sprite is `female_scientist` and her `HOSTS` entry is copied from `gen_e3_e5_shells.py`.

### M2. E8 §9 still gives no attack fragment skeleton (R1 M9, not fixed)

- **Files:** `E08` §9; `AW/e5/attack.json`.
- **Evidence:** E5's `quayholt_site` has `blk_staff` for Hana and a `blk_sso` block with `"fact": "quayholt_sso_portal"`. E8's four facts do not include that fact, so copying E5 unchanged leaves a dangling fact reference. E8 gives no block for Ayaan (role, address, `fact`), no `post_ayaan` post with its `fact`, no `people` entries as JSON, no `mailClient.contacts` row (Ayaan, `revealedBy`, `targetId: takeover_victim`), no account block, and no `playerSentAuth` value (copy E5's `bounce.quayholt.example` row; P2 only says "add `playerSentAuth`").
- E08 does now give the phishTarget, templates and fact table, so about 60 per cent is there.
- **Fix:** list each change against `e5/attack.json` (drop `blk_sso` fact and the `sso_portal` fact, replace `blk_staff` and the profile, add `post_ayaan` with `fact: quayholt_ayaan_busy`, contacts row, `playerSentAuth` row), or quote a full `attack.json`.

### M3. P5b cannot produce a working Carrholme room: the object registration step is missing

- **Files:** `01` P5b steps 3 and 4; `scripts/room_gen/register_object.py`; `build_aw_rooms.py` SKELETON; `room_edit.py` `ensure_sprite`.
- **Evidence:** the skeleton does `("add","items","aw_logo_{co}1",...)` and `aw_poster_report_{co}1`. `make_aw_props.py` only writes the PNGs ("they are registered with `register_object.py --wall`", its own docstring). Registration touches five places: `catalog.json`, `tilesets_ref.json`, `objects_hospital_extras.tsx`, `game.js` (the `this.load.image('aw_logo_*1', ...)` block around lines 1478 to 1485), and `generate_rooms.py` `WALL_MOUNTED_EXTRAS`. Without it, step 4's `build_aw_rooms.py carrholme` fails in `ensure_sprite` (the tile is not in the reference tilesets), and even if forced the objects never preload in the game.
- P5b step 5 lists only the tilemap and tile-sheet loads in `game.js`.
- **Fix:** insert after step 3: "Run `python3 scripts/room_gen/register_object.py --wall aw_logo_carrholme1 aw_poster_report_carrholme1`. Expected: it edits `catalog.json`, `tilesets_ref.json`, `objects_hospital_extras.tsx`, `game.js` and `WALL_MOUNTED_EXTRAS`. Use `--dry-run` first." Note it also edits `game.js` and `generate_rooms.py`, so step 5 and step 6 are not the only touches.

### M4. ENG-04 leaves the runner wiring for `mistake` unspecified, so the stage would render "Finished"

- **Files:** `02` ENG-04 Change 1 to 3; `episode-runner-minigame.js` `_render` (line 335), `_launch` (548), `STAGE_COPY` (79); `step-strip.js` `STAGE_LABELS`.
- **Evidence:** `_render` draws a launch panel only `if (stage && STAGE_COPY[stage])`, otherwise `_renderFinished()`. `STAGE_COPY` and `STAGE_LABELS` have no `mistake`. `_launch` has an explicit branch per `spec.kind` (osint, mail, build, mfa, call, triage); an unlisted `mistake` kind does nothing. ENG-04 adds `childLaunch` and a "consequence-sandbox" module, but never says: add `STAGE_COPY.mistake` (heading, text, button), add a `_launch` `mistake` branch with `_completeWhileAway('mistake')`, label the strip step (`stepLabels` or `STAGE_LABELS`), or whether the sandbox is a registered child scene (`launchChild`) or an inline view. ENG-02 does name `STAGE_COPY` and the `_launch` branch for `guess`; ENG-04 should match.
- **Fix:** add those four items to ENG-04 Change, and a test line "a full consequence episode at stage `mistake` shows a launch panel with a button, not 'Finished'".

### M5. ENG-02's flip branch reads `sent.kind === 'guess'`, but `cleanSent` discards it

- **Files:** `02` ENG-02 Change 4; `episode-model.js` `cleanSent` (line 81), `readState` (line 129).
- **Evidence:** `cleanSent` keeps only `{kind:'call', callId, outcome}` or a mail record `{recordId, targetId, templateId, blankIds}`. `readState` runs `sent` through it on every read, so `kind: 'guess'` is dropped and the `_flipProps` branch never fires; the flip would fall into the mail path with an empty record. ENG-02 does not touch `cleanSent`. (ENG-04 does remember the `readState`/`completeStage` allow-list for `mistakeChoices`.)
- **Fix:** ENG-02 Change: "add a `kind === 'guess'` branch to `cleanSent` returning `{ kind: 'guess' }`, write it from the guesser's `_completeWhileAway('guess', { sent })`, and test that `readState` keeps it."

### M6. ENG-09a does not say how a `choice` card is scored, and E9 row 5 contradicts its lint

- **Files:** `02` ENG-09a; `E09` §11 rows 4 to 7 (esp. row 5); `triage-kinds.js` `actionsFor`; `triage-scoring.js`.
- **Evidence:** the scorer works on verdicts (trust, report, delete, verify). ENG-09a says the chosen option "maps to a verdict-equivalent (correct = a scored 'right move')" without saying which verdict, what `truth` the card carries (`isPhish`, `flags`, `whyFine`, `ifTrusted`, `reportReply`), whether the Verify button shows, or how the mirror-pair and balance lint (`triage.rb` `balance`) count it. Row 5 of E9 is "(a) generate vs usual; (b) made-up security answer vs true: choose generate; choose the made-up answer", two decisions in a card whose schema allows one `correct`.
- **Fix:** define the mapping once (for example correct = records `report`-equivalent full marks, wrong = `trust`-equivalent miss, no Verify button, `truth.isPhish` false for all `choice` cards) and give one worked message JSON. Split row 5 into two cards or drop (b); renumber the "6 to 7" count.

### M7. ENG-08's "append to `CHANNEL_TELLS`" is incomplete: two existing tests also need `SKILL_NAMES`

- **Files:** `02` ENG-08 "New tells"; `triage-flags.js` `SKILL_NAMES` (line 47); `test/js/social-triage-weakest.test.mjs` line 201, `test/js/social-gap-triage-flags-comparison.test.mjs` line 89.
- **Evidence:** both tests loop `Object.keys(F.CHANNEL_TELLS)` and assert `F.SKILL_NAMES[id]`. ENG-08 says to append the id and sentence to `phish-rules.js` and the id to `triage.rb` only. The seven shared ids would fail those tests (and the weakest-skill chip name on screen would fall back to the raw id).
- **Fix:** add "and a short skill name for each shared id to `SKILL_NAMES` in `triage-flags.js`" with proposed names (for example `unexpected_sent_item: 'Sent items'`), and list the two tests in ENG-08 acceptance.

### M8. ENG-10 / WP-12 Part A: the validator still errors for a brief-only episode with no `defend` block

- **Files:** `02` ENG-10 Change 4; `11_WP12` Part A ("No `defend` block"); `awareness.rb` `defend_set` (line 359), `conclusion_checks`.
- **Evidence:** `defend_set` returns `err('defend.setId is missing')` for any episode without `defend.setId`. ENG-10 adds only `STAGES_BY_VARIANT['brief']`, the schema variant enum, and lints for `doneGlobal` and `briefCards`. It does not say to skip `defend_set`, `set_checks`, `result_global_checks` and `player_sent_auth_checks` for `brief`, or to run a conclusion check against `doneGlobal` (today `conclusion_checks` runs only `if done`, and `done` comes from the set). So `scenarios/awareness_core_00_first_play` fails `--strict-social`, which WP-12's acceptance requires to pass, and the "objective concludes on `doneGlobal`" is never linted.
- **Fix:** ENG-10: "for `variant: 'brief'`, skip the defend-set group of checks, and add a conclusion check that the `missionConclusion` aim's `concludeRequires.globals` names `doneGlobal`." Check also that the runner's `defendSet` getter is never touched on a brief-only run (I could not confirm it from the packet).

### M9. E11 has no objectives, globals or first-aim trigger, and P2 assumes a phish target

- **Files:** `E11` §5, §15; `01` P2 ("`objectives`: two aims ... first aim `manual`, completed by the host's event mapping"; "`phish_<targetId>_attempts`").
- **Evidence:** E11 has no attack and no `phish_*` globals. It names no aim ids or titles, no task ids, no conclusion screen, no kiosk observations, and no `globalVariables` list. ENG-04 writes nothing a host mapping can listen to when the sandbox ends (the beats live inside `episode_<id>_state`). A Sonnet must decide between one aim (the validator needs exactly one `missionConclusion`, nothing needs a first aim) and two, and invent the trigger.
- **Fix:** E11 §15: state the objective design. Simplest is one aim, task completed on `episode_e11_misdirected_data_defend_done`, with the conclusion screen text quoted. If two aims are wanted, ENG-04 must define a global written when `mistake` completes.

### m1. E8 §16 still asks for a defend-only bridge with no recipe (R1 m5, not fixed)

- `run-suite.sh` `JOBS` has only `*-full` entries and no defend-only bridge exists to copy. P9 covers `eN-full` only; README §9 requires only `bridge-eN-full`. E08 §16 says "and a defend-only bridge". **Fix:** drop it from E08 §16, or define the file name, JOBS key and skeleton (brief, `.tri-start`, plan, defend_done, debrief) in P9.

### m2. ENG-08 tell table reasons are still wrong for five rows (known item 1 in REVIEW_LOG; confirmed)

- `ransomware_note` is "used by E8 and E13" but E13 §11 does not list it (grep: no `ransomware` in E13). `fake_check_paste`, `fake_update_prompt`, `dangerous_download` are "shared because `general_v2` item 2 / 8 scores them" but `10` items 2 and 8 score `lookalike_domain`, `padlock_myth`, `senderTrust`, `reply_to_differs`. `unexpected_sent_item` and `unrequested_reset` say "`general_v2` check item" but `10` has none. By ENG-08's own rule ("one set only is local") eight of nine would be local. The table's verdict (shared) is what E8 and E10 follow, so building still works; the text is just false.
- **Fix:** either correct the reasons ("shared by orchestrator decision so a later check item can score it") or reclassify.

### m3. E8 host and room "wired like E5" versus the P2 table "copy E1" (R1 M8, downgraded)

- E08 §8 ("E5 `niamh_doherty.ink` pattern") and §15 ("wired like `awareness_e5_signin_pages`", "copy the E5 `eventMappings`") still conflict with P2 row 1 and P3 (copy E1, `adaeze_okafor.ink`). §15 now lists the exact globals to declare, which defuses most of the risk (E5 has `se_landing_pages` and `landing_sso_login_*`). **Fix:** one sentence in E08 §15: "frame from E1; take only Quayholt names, sites and templates from E5; host ink is E1's structure with Anjali's lines".

### m4. README §5 and `10_CHECK_FORMS` disagree on engine dependencies

- README row "Check forms | the card kinds their items use (ENG-03a, ENG-09a)". `10` says no engine packet is needed, and every item is email, `page` (built), `push` (built) or `call` (built). **Fix:** change the README row to "nothing; every kind is built; any scored tell must be shared (ENG-08)".

### m5. README §5 row E8 says ENG-09b "(if two panels)"; E8 has two, and the defend-only shell shares them

- E08 §12 puts the concept cards in shared `strings.conceptPanel` (array), so the schema must accept the array for the defend-only shell too. E08 §13's "defend-only ... can ship first" and "needs no ENG-01" is true but it still needs ENG-09b. **Fix:** README row "ENG-01, ENG-09b, ENG-08 tells, ENG-09d"; E08 §13 add "(it does need ENG-09b and ENG-08)".

### m6. E11 §17 and §15 have stale or wrong commands and file names

- §17 runs `validate_scenario.rb ... scenarios/awareness_e11_misdirected_data` (a folder; the validator takes the `scenario.json.erb` file, as README §8.3 does) and says "the four check shells" (there are eight, built by `10`'s generator, not E11's).
- §15 creates `e11/mistake.json`, a fragment name P1 does not know (P1: `attack.json` and `defend.json`; a packet-added shape "takes the fragment shape that packet gives", and ENG-04 gives none). **Fix:** say "hand-author the `mistake` block into the full erb, and record it under `defend.json` `awarenessEpisode.mistake`", as P1 says for the other full-only keys.

### m7. E11 §9 table gives option ids only for `overtime_sheet`

- The other three beats' option ids (`give_details`/`take_message`, `export_list`/`ask_dpo`, `send_as_is`/`redact_first`) appear only in the §10 montage keys, and the unsafe/safe pairing must be inferred. **Fix:** add an "option ids" column to the §9 table.

### m8. E11 item 2 kind is ambiguous

- §11 row 2 says "call" in the table and "uses the `voicemail`/`call` kind with a transcript" in the shape note. A `call` card's actions are Comply / Escalate / Refuse / Ring back (verdicts trust, report, delete, verify), not "Verify or Report" in the words used. **Fix:** say `kind: "call"`, copy `ha_call_printer`'s shape (`callerId`, `from`, `time`, `transcript`), and name the correct action ("Ring back" or "Escalate").

### m9. P5b details

- Step 7: a `carrholme_services` lighting entry "shaped like `quayholt_insurance`'s" would carry the `aw_quayholt_queue` emitter for a prop Carrholme lacks (step 4 drops it). Say to drop it.
- Steps 2 and 3: `make_aw_tileset.py` and `make_aw_props.py` rewrite every company's output in place (fixed `OUT_DIR`, no `--out`). "Run on a scratch copy if you can" is not actionable without a copy of the whole tree; say "run it, then check that only the Carrholme files changed (compare checksums of the four existing PNGs before and after)". I did not run them, so I cannot confirm they regenerate byte-identically.

### m10. E8 row shapes: auth and recipient fields (R1 M7, mostly fixed)

- Verdict and kind columns were added, which fixes the main R1 point. Still absent: the `auth` block for the genuine IT and reception emails (copy `e5` genuine rows), the `to` field for row 1, and one worked JSON for the `page` row. **Fix:** "for rows 2, 4, 6, 7 copy the `auth` block of `hb_policy_refresh`".

### m11. ENG-02's "Episodes that depend on it" paragraph is garbled and still says E9 §7 is wrong

- Text: "both the full and defend-only variants need ENG-02, because ... E9 §7 is wrong that only the full variant needs it (see Stop and ask)". E9 §7 now already says the defend-only variant needs ENG-09a, not ENG-02, which is what the "Stop and ask" line says. **Fix:** replace with "E9 (attack half only). The defend-only variant needs ENG-09a, not ENG-02."

### m12. WP-12 Part A contradicts itself on the brief content

- "Recommendation" and "The shell" say seven `strings.briefCards`; the section "The brief panel content" says "One panel, `strings.brief`". **Fix:** retitle that section "The seven cards" and say each beat is one entry of `strings.briefCards`.

### m13. E9 "wired like E6"

- E9 §15 says the full shell is "wired like E6 (Tarrowby room)". E6 has a defend-only shell and a phone full erb, not a guess stage; P2's table says copy E1 for the frame plus the packet block. Same class as m3. **Fix:** "frame from E1 (P2), Tarrowby room from P5a".

### t1. E8 §13 still cites "the eight pinned-strings rule, BRAND_SET §7" (R1 t1); the schema `strings` has about 20 keys. No action beyond not relying on "eight".

### t2. E08 §2 path `modules/.../03_WORLD_AND_CAST.md` should be `security_awareness_course/03_WORLD_AND_CAST.md`. E08 §5 also still says Ayaan is "the colleague fooled in the E5 flip line": the shipped E5 flip line names Hana Novak (the `_brandAdditions` note is stale). The decision to use Ayaan stands; the stated reason is wrong. Ayaan is the caller of `ha_call_printer` in E3 (a call, so "not a voicemail caller" is true).

### t3. `00_README` §1 still says every path, key and command "was checked against the repo on 2026-10-27". M3, M4, M5 and M7 show it was not. Soften it, or re-date after the fixes. `10_CHECK_FORMS` says "confirmed ... 2026-10-28" in one place.

## R1_sonnet findings: status

| R1 id | Now | Note |
|---|---|---|
| B1 E8 check items home | Fixed | E8 §14 points at `general_v2` item 1; `10` agrees. Stale reasons remain in ENG-08 (m2 here). |
| B2 flip keys ENG-01 lacks | Fixed | E8 §10 quotes a full `flipAftermath` and `stepLabels`; ENG-01 defines them. |
| M1 REPO in P0/P4 | Fixed | `BREAKESCAPE_REPO` / `--repo`, stated in P0 step 2 and P4. |
| M2 three tells unassigned | Fixed | In ENG-08 table with canonical strings. Reasons are stale (m2). |
| M3 ENG-09b key name | Partly | Decided (array form of `conceptPanel`). README row still "if two panels" (m5). |
| M4 E8 metadata | **Not fixed** | M1 here. |
| M5 seeding tool / repo name | Fixed | E08 §15 points at P12; P12 names the repo and says to attach it. |
| M6 reopencheck baseline, no-bundler fallback | Fixed | README §8 step 4 and the environment notes. |
| M7 verdict words and kinds | Mostly fixed | Columns added. Worked JSON and `auth` still missing (m10). |
| M8 copy-from E1 vs E5 | **Not fixed** (now m) | m3 here. |
| M9 attack fragment under-specified | **Not fixed** | M2 here. |
| M10 `attack_checks` for consequence flip | Fixed | ENG-04 change 5 and ENG-08. |
| M11 `flipHeading` erb-only | Fixed | E11 §10 keeps it in the fragment. |
| M12 E11 vs P5b room work | Fixed in the text | E11 and P5b now agree. P5b itself is missing a step (M3 here). |
| M13 `data_form` vs `data_conduct` | Fixed | E11 §14 uses `10`. E11 §17 still says "four check shells" (m6). |
| m1 cast facts | Partly | Ids fixed, firm renamed to `fenwick-brandt.example` (but REVIEW_LOG known item 2 says it clashes with E14's Fenwick). The "fooled in the E5 flip line" claim remains (t2). |
| m2 unused `lookalike_domain` | Fixed | Removed from `channelTells`. |
| m3 seven flip keys popped | Fixed | P4 lists the exact seven and the two that stay. |
| m4 ENG-09d `n` | Fixed | P7 and ENG-09d agree. |
| m5 defend-only bridge | **Not fixed** | m1 here. |
| m6 `flipAftermath` fragment home | Fixed | P1 says hand-authored into the erb. |
| m7 P5a partial room | Fixed | P5a says copy `door_sign` and `connections`. |
| m8 Anjali sprite keys | **Not fixed** | In M1 here. |
| m9 `10` internal faults | Mostly fixed | Paths and disjoint `PERMUTE` pair fixed and checked. README still lists ENG-03a/09a (m4). |
| m10 `flipDefenderLine` contradiction | Fixed | Now "the service desk never sends sign-in requests by email". |
| m11 to m13 (E11 lighter pass) | Fixed | `mistakeChoices` allow-list in ENG-04; Carol in the cast; montage fallback documented. |
| t1 "eight pinned keys" | Not fixed | t1 here. |
| t2 "checked" claim | Not fixed | t3 here. |
| t3 `</script>` escape | Fixed | Now `<\/script>`. |

## Dry run summaries

### E8 pilot, step by step

1. **P0.** Clear. The new generator reads `BREAKESCAPE_REPO`; the no-change run is only possible for a built generator, which P0 step 3 says to use. Expected: no `DIFF` line.
2. **P1 fragments** `AW/e8/defend.json`, `attack.json`. Copy `AW/e1/defend.json` and `AW/e5/attack.json`. The defend half is workable (E08 §11 gives all seven items). The attack half needs M2. The `awarenessEpisode` keys match the real E1/E5 fragments.
3. **P2 full erb.** Copy `scenarios/awareness_e1_invoice_fraud/` and `mission.json`. Blocked on M1 for aims, tasks, kiosk text, conclusion screen. Host sprite is `female_scientist_v2` / `_talk` / `_visemes` (not stated).
4. **P3 ink.** Copy `adaeze_okafor.ink` to `ink/anjali_rao.ink`. Needs Anjali's lines (M1). `./scripts/compile-ink.sh awareness_e8_after_the_click` and `missions.json` copy of the E1 block are clear and real.
5. **P4 generator.** Copy helpers from `gen_e6_e7_shells.py`; `EPISODES['e8']` needs M1 data; `HOSTS['anjali']` from `gen_e3_e5_shells.py`. The defend-only shell drops exactly the seven flip keys; `conceptPanel` array flows through from the fragment.
6. **P5a.** Works as written.
7. **P6, P7.** Count 38 to 40; parity row `{ n: 8, dir: 'awareness_e8_after_the_click' }`. Clear. ENG-09d is a tests-only packet.
8. **P8 validator.** Needs ENG-01, ENG-08 (tells, `SKILL_NAMES`, M7), ENG-09b. Stage order is the E1 order, so it is valid today.
9. **P9 bridge.** Copy `bridge-e1-full.jsonl`. Selectors for `flipAftermath` (`.aw-flip-aftermath`, `.aw-aftermath-item[data-id]`) come from ENG-01. Add `e8-full:awareness_e8_after_the_click` to `JOBS`. The defend-only bridge is unspecified (m1).
10. **P11, P12, P13.** Clear. Brand additions need no new cast.

**ENG-01 and ENG-08 read against the code:** `flip-view.js` `renderFlipView`, `_flipProps`, `_stripLabels`, `STAGE_LABELS` merge (`step-strip.js` already accepts `opts.labels`), and the raw `awarenessEpisode` pass-through (`episode-runner-minigame.js` `get episode`) all match the packet. ENG-01 is implementable as written. ENG-08 needs M7.

### E11 consequence flip, step by step

1. **P5b room.** Steps 1 to 9 match the repo (SHEETS, COMPANIES, COMPANY_OPS, `game.js` lines 145 and 241, schema enum near line 2610, `generate_rooms.py` line 4688) except the missing registration step (M3).
2. **Brand set (P11)** and the Carrholme cast: complete and consistent with E11 §5.
3. **ENG-04.** Config shape, validator lints and `attack_checks` relaxation are now consistent between 02 and E11. Runner wiring is the gap (M4).
4. **Fragments and erb.** Content for beats, montage lines and the six defend items is complete. Missing: objectives and globals (M9), option ids (m7), call card shape (m8), fragment name (m6).
5. **data_conduct** items for E11's topic: concrete, counts check out. The generator `gen_checks_v2_shells.py` is a copy of `gen_e3_e5_shells.py` cut down; the brief says what to keep.

### Lighter pass: E9 with ENG-02 and ENG-09a

A Sonnet could build the OSINT facts, guesser config and the three push/fake-IT cards without guessing. It would have to guess at the `guess` flip hand-off (M5), the `choice` card's scoring and truth shape (M6), and row 5's two decisions. ENG-02's config shape and validator lints are otherwise precise.

### Lighter pass: WP-12 with ENG-10

Part A: content and card list are clear; the validator gap (M8) and the "one panel" wording (m12) would stop a Sonnet. Part B: cannot validate as written (B1). The 17 reused ids all exist; the E3 call reshape instructions are concrete.

## Counts

| Severity | Count |
|---|---|
| B | 1 |
| M | 9 |
| m | 13 |
| t | 3 |

## Verdict

**Not clean, but much closer.** Round 1's two blockers and most majors are gone. The pilot's engine packets (ENG-01, ENG-09b, ENG-09d) and the E11 consequence-flip design are consistent with the code. What remains is mostly omitted wiring detail (runner stage copy, `cleanSent`, `SKILL_NAMES`, object registration) and E8/E11 shell metadata that nobody has written, plus one real design hole (core_17 cannot validate). A third round on 02 (ENG-02, ENG-04, ENG-08, ENG-09a, ENG-10), P5b, E8 §8b/§9 and WP-12 Part B should clear it.

**Could I start E8 tomorrow with these briefs alone?** Not quite: I could build ENG-01, ENG-08 (after adding `SKILL_NAMES`), ENG-09b and ENG-09d and write the defend set and flip, but I could not wire the shells (aims, tasks, kiosk and host text, attack site blocks, Anjali's lines) without the `opus48` content step or guessing.
