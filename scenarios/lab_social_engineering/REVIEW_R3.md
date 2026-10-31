# Review round 3 (confirmation): `lab_social_engineering` PLAN.md

Reviewer: Opus, round 3 (fresh). Packet P6-A. Read-only review of
`scenarios/lab_social_engineering/PLAN.md` against `designs/10_lab_social_engineering.md` (`10`),
`designs/00_data_contract.md` (`00`), `IMPLEMENTATION_PLAN.md`, `SE_BUILD_LOG.md`, and the engine at HEAD
on 2026-10-21. Rounds 1 and 2 with their outcomes are in `REVIEW_R1.md` and `REVIEW_R2.md`. Kind of game:
a lab game, education first, browser-only, no VMs, no combat. Brief: `docs/agents/SE_BUILD_BRIEF.md`.

This round confirms every round-1 and round-2 finding is really closed in the current plan, checks the
round-2 fixes did not break the plan's internal consistency (task counts, cut maths, playtest rows, the
rewritten opening's ink and gating, the meter's graceful fallback), re-verifies the load-bearing engine
claims those fixes rest on, and gives a final build-readiness judgement.

## Part 1: are all 15 earlier findings really closed?

### Round 1 (2 major, 8 minor)

| R1 id | fix claimed | confirmed in current plan |
|-------|-------------|---------------------------|
| R1-M1 | `test_account` a settled §4 row, counts to 23 | Yes. §4 table carries `test_account` (aim `phish_easy`, manual, completes on `acct_freemail`, "first active non-entry task"); §4 prose "eight aims and 23 tasks"; §9 cut maths against 23; §14 Q1 marked settled |
| R1-M2 | open-inbox edge legible, no hard block, F14 | Yes. §4 block "`test_account` and the open-inbox edge" (open task names the fix, Ruth's rung repeats it, composer one click away, Hampshire `trusts: ["*"]` kept); §5 stage 3 cue; §10 F14 |
| R1-m1 | §5 opening to `timedConversation` | Yes. §5 "Opening" uses `timedConversation` + `waitForEvent: "game_loaded"` / `skipIfGlobal: "briefing_heard"` / `setGlobalOnStart: "briefing_heard"`, "not a music event"; §6 and §7 match; §14 Q3 settled. No "music event" contradiction remains |
| R1-m2 | §1 landing row to "Partly built" | Yes. §1 row: model (P5-A), renderer (P5-B), full lint (P5-C) exist; scene/registration/branch/persistence still Phase-5/P6-W |
| R1-m3 | §8 notes Fairbairn voiced per decision Z | Yes. §8 "Audio" cites README decision Z superseding `10` §8 and ASSETS VO5; flagged for P8-B |
| R1-m4 | reply delay follows `00` placement | Yes. §4 "Reply delay": char for Pierce/Lord, target for Hampshire, cites `mail-scheduler.js:346-352` |
| R1-m5 | mappings carry `condition: "value === true"` | Yes. §4 "How a task completes, and who listens" |
| R1-m6 | goalStrings name where to look | Yes. §4 "No dead ends"; §2; §5 stage 2; §13 risk row; F15 |
| R1-m7 | playtest coverage of task + two traps | Yes. §10 L3 assertion, F14, F15 |
| R1-m8 | triage domain from authored `social.landingPages` | Yes. §7 "Mail records feed the report and the triage" |

### Round 2 (1 major, 4 minor)

| R2 id | fix claimed | confirmed in current plan |
|-------|-------------|---------------------------|
| R2-M1 | meter recorded unbuilt, owned by P6-M, checklist fallback named | Yes. §1 mail row records the live red-flag meter unbuilt (grep empty, not in mail scope, `01`/`10` call it optional) and names the built `onSend` checklist on-ramp; §1 "UI debt carried in (P6-M)" adds the meter to P6-M's scope and states the solvability-neutral fallback; §5 stage 3 softened to match |
| R2-m1 | in-voice Hampshire fail replies required | Yes. §3 guards bullet requires P6-E author in-voice `reply` for `attachmentPlausible` and `senderTrust` at least, cites `mail-bridge.js:353-356` |
| R2-m2 | metadata gate named in task + rung, F16 | Yes. §4 "The metadata gate has no board signal"; §5 stage 2 next-step cue names the PDF properties panel; §10 F16 |
| R2-m3 | "see Ruth for the key" on locked door + first rung, F17 | Yes. §5 stage 1 next-step cue (all three doors); §10 F17 |
| R2-m4 | opening carries a reveal + real choice; front sharpened | Yes. §5 "Opening" (Fairbairn's near-miss reveal, the "will this make my staff look stupid" choice seeding through-line 1); §4 "Sharpening the low-agency front" targets ~5 min, keeps `10`'s figures for cut maths |

All 15 confirmed closed. No earlier finding re-opens under a fresh read.

## Part 2: did the round-2 fixes break anything?

| Check | Result |
|-------|--------|
| **Task count** | §4 table sums to 23 (authorise 2, plan 2, recon 6, phish_easy 4, prepare_hard 2, phish_hard 1, report 2, defend 4). Matches "eight aims and 23 tasks". `osint_done` correctly excluded (engine-set, not a task). Consistent |
| **Cut maths** | Baseline 23. Cut 1 drops `profile_done` → 22 (table + prose agree). Cut 2 drops `test_account` + `hampshire_landed` + `ready_hampshire` (freemail/createMenu/Hampshire round removed) → 20, or 19 with cut 1 → table "20 (19 with cut 1)" and prose "23 → 20, or 19" agree. Cuts 3 and 4 leave the count unchanged (correct: they swap data sets, remove no task). Consistent |
| **Playtest rows** | §10 intro says "F14 to F17"; body defines F14 (guest-lands-Hampshire recovery, asserts `test_account` completes), F15 (careers-inbox `showIf` recovery), F16 (all-green-board/metadata-locked recovery), F17 (key-gate return). L3 asserts `test_account` on `acct_freemail`. All four present, each maps to the finding it closes. Consistent |
| **Opening ink + gating** | §5/§6/§7/§14 Q3 all describe one mechanism: `timedConversation` on Ruth's record, `waitForEvent: "game_loaded"`, `skipIfGlobal`/`setGlobalOnStart: "briefing_heard"`, not a music event. No residual "music event" wording. The in-prose Ruth line and the Fairbairn choice set no gate and cost no time (as stated), so they do not alter the critical path. Consistent |
| **Meter graceful fallback** | Degrade path is honest and real: if P6-M does not land the meter, the `onSend` checklist (built, verified below) carries the on-ramp for every send, and §5 stage 3's "meter on/off" difficulty step degrades to "checklist for everyone" with no solvability effect. No stage depends on the meter existing |

No round-2 fix introduced a new contradiction.

## Part 3: engine claims re-verified this round (held)

| Claim relied on | Evidence (HEAD, 2026-10-21) |
|-----------------|------------------------------|
| Live red-flag meter unbuilt | `grep -rni "redFlagMeter\|showRedFlagMeter" public/break_escape/js test/js` returns nothing. R2-M1's premise holds; the meter is vapour and the plan treats it so |
| `onSend` checklist fallback is real | `redFlagsOf` (`mail-bridge.js:219`), `renderChecklist` (`:436`). The solvability-neutral fallback genuinely exists |
| Empty/missing-intel blank blocks Send with a neutral line | `PRE_SEND_GATE_LINE` (`phish-rules.js:41`) returned for `empty-blank` (`:465`) and `missing-intel` (`:470`), never naming the blank. Stage 5 "the aim can complete with the date unknown, Send stays blocked, Ruth points at Dev" is sound |
| Tesseract opening pattern | `timedConversation` with `waitForEvent: "game_loaded"`, `skipIfGlobal`, `setGlobalOnStart` present (`lab_tesseract_trials/scenario.json.erb`, ~413-419; line pointer shifted from the plan's 409-416 but the shape is intact) |
| Mapping `condition: "value === true"` | Present on `global_variable_changed:*` mappings in the Tesseract (e.g. `megan_file_read`, `megan_choice_made`). R1-m5 pattern confirmed |
| Lockout scope | `channel = effect.scope === 'character' ? 'all' : (this._channelFor(...) || 'all')` (`social-influence.js:631`). The §13 pinned note (author Dev's lockout `scope: "channel"`, never `"character"`) is correct: a character scope locks all channels and would close the email route to Lord; any non-`character` scope is channel-local |
| Data-only fail reply | `dataOnlyText` returns `first.reply \|\| first.line \|\| ''` (`mail-bridge.js:353-356`). Without an authored `reply` the generic canonical `line` shows. R2-m1 basis confirmed; §3's requirement to author in-voice replies is the right fix |
| `pretext_call_done` not engine-written | `finalisePretext` docstring: "`pretext_call_done` is NOT written here: it comes from a granting ask's own `grants`" (`person-chat-pretext.js:~334`). §4 wiring (each ask's `grants.setGlobal`) is required and correct |

## Findings

| id | severity | section | finding | evidence | suggested change |
|----|----------|---------|---------|----------|------------------|
| — | — | — | None. No blocker, major or minor raised this round. | — | — |

## Observations (not findings, no change required)

- **Line-number drift.** The Tesseract opening pattern now sits ~4 lines below the plan's cited
  `409-416` (other sessions edit the shared tree). The plan already states line numbers are pointers to
  be re-read before editing (preamble, and the brief), so this is expected, not a defect. P6-E/P6-F
  should re-grep the pattern rather than trust the exact line.
- **Opening global name.** The plan names its opening-skip global `briefing_heard`; the Tesseract uses
  `briefing_played`. Different names are fine (each scenario declares its own in `globalVariables`); the
  plan is internally consistent on `briefing_heard`. P6-E must declare it.
- **Q2 (title) and Q4 (cut-variant ENV switch) remain open** but neither gates the build: Q2 is a label
  the module leader confirms before the lab sheet/index work, Q4 is a P6-U concern with a stated constant
  fallback. Both are correctly parked in §14, not in the build-critical path.

## Verdict

**Counts: 0 blocker, 0 major, 0 minor.**

**Ready to build.** All 15 round-1 and round-2 findings are genuinely closed in the current plan. The
round-2 fixes are internally consistent — the 23-task baseline, the cut maths (22 / 20 / 19), the F14–F17
playtest rows, the rewritten `timedConversation` opening and its gating, and the meter's checklist
fallback all hold together. Every load-bearing engine claim the fixes rest on is verified against the
code at HEAD. The plan is a buildable spec for P6-E (rooms and data) and P6-F (ink): the objectives
table, the global owners, the hand-off seams and the hint/recovery wiring are all pinned to the engine as
it stands, and the design is solvable with no hard dead ends.

Per the brief's §11 gate ("no blocker or major open before the build starts"), the gate is met. P6-E and
P6-F can start; the remaining open questions (Q2 title, Q4 cut switch) ride into their later packets.
