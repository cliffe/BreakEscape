# Review log: implementation briefs

There are up to five review-improve rounds. Each round runs three reviewers, and each reviewer writes `Rn_<lens>.md` in this folder:

- **engine:** `00`, `01`, `02` against the code.
- **content:** the episodes, `10`, `11`, `12` and `13` against the built content and each other.
- **sonnet:** a dry run as a fresh Sonnet implementer.

After the reviewers, fixers update the briefs. A round closes when the fixers have answered every B and M finding. We stop early when a round reports no B or M findings.

Read `../WRITER_BRIEF.md` for the rules and the severity scale.

## Known cross-document issues to verify in round 1

These were seen by the orchestrator while the briefs were being written. Confirm each one, then report it with a fix.

1. **Flip config names.** E08 proposes `flip.becomeVictim`, but ENG-01 defines `flipAftermath`. ENG-01 wins, so E08 must use its name.
2. **Stage ids.** ENG-04 uses `mistake`; the packet index once said `sandbox`. ENG-05a is a `world` modifier on `write`, not a stage. ENG-06's assistant runs in the flip region, not as an `assistant` stage. Check that every episode spec and `00` agree.
3. **ENG-02 and ENG-09a.** ENG-02 is attack-half only, so E9's defend-only variant needs ENG-09a, not ENG-02. E9 §7 and §13 must change.
4. **ENG-03a.** The three-way browser verdict is a `verdictLabels` change, not a new verdict. E10 §11 must change.
5. **ENG-11 `sortDrill`.** It replaces the bespoke drills in E14, E15 and E17. ENG-12 covers E16's fact-chip report and ENG-13 covers E14's privacy panel. Check that the specs reference these packets.
6. **Check forms disagree.** `10_CHECK_FORMS.md` recommends two new pairs, `general_v2` and `data_conduct`. The E11 and E14 to E17 specs instead name per-topic forms (data, social, shadowit, insider, aup), and E9 and E10 say their cards may need their own form. Settle on one scheme, recommended `10`'s two pairs unless a reviewer finds a reason against, and align all the specs.
7. **Seeded courses.** `10` says the check forms join neither seeded course. Check that this agrees with `00`, `01` and FUN_DECISIONS q_aw7.
8. **E17.** `00` says one defend-only shell joins both courses. The E17 spec ships two identical shells, a full one and a defend-only one. Pick one and align `00`, `01` and E17.
9. **Host names.** E11's host is Tomasz Wiśniewski and E14's is Tomás Carvalho, a near-collision. Also check Oskar Berglund against Dani Fenwick in E14, and every new name against BRAND_SET and the scenarios.
10. **E12 and E13 stage lists.** Check that they fit the stage-order lint after the ENG-08 relaxation.
11. **Dashes.** `02` has 4 em or en dashes; E11, E14, E15, E16 and E17 have 1 or 2 each. Remove them unless they are inside quoted code or existing strings.
12. **E10's colleague.** Leila Nassar is E3's phone NPC. Check that reusing her as E10's IT colleague does not confuse learners who play both.
13. **WP-12 core_00.** It needs a validator variant `"brief"` (ENG-10). Check that `11` points at ENG-10.

## Round 1 results

| Review | B | M | m | t | Verdict |
|---|---|---|---|---|---|
| R1_engine | 1 | 5 | 5 | 3 | not clean |
| R1_content | 2 | 7 | 7 | 2 | not clean |
| R1_sonnet | 2 | 13 | 13 | 3 | not clean |

## Round 1 rulings (orchestrator; fixers apply these, do not reopen)

1. **Check forms.** We adopt `10_CHECK_FORMS.md`'s two new pairs, `general_v2` and `data_conduct`, and drop every per-topic form named in the episode specs. The trade-off to report to the user is that there is no per-topic pre and post figure. Any tell that a check-form item scores must be in the shared library, `CHANNEL_TELLS` in both `phish-rules.js` and `triage.rb` (ENG-08). So `10`'s "existing ids only, no engine packet" changes to "existing ids, or ids that ENG-08 adds to the shared library". E8's reset and sent-item items go into `general_v2` only if they fit its balance. Otherwise they stay as defend-set items only.
2. **E17.** It ships one defend-only shell, listed in both seeded courses, at Tarrowby Logistics with host Nilesh Solanki. `00`, `01` and E17 must all say this.
3. **E8 flip.** We use ENG-01's `flipAftermath` and `stepLabels`, with the signs authored inline. Where E8 needs an intro line or the victim's name, ENG-01 adds optional fields inside `flipAftermath`, such as `intro` (already present) and `victimName`. They do not go in `strings`. A sign may also appear as a defend item, with different ids and an inline copy.
4. **Verdicts and card kinds.** Use only the built verdicts: Trust, Report, Delete and Verify. ENG-03a's `verdictLabels` may relabel them; no new verdict ids. Use only the built card kinds, plus `choice`, and `person` if a spec needs it. An "email in Sent" is an ordinary `email` card from the victim's own address with a clear subject line. The reason text must agree with how the `awareness` profile actually scores, for example where Trust and Report score the same on a genuine item.
5. **Consequence flip validation.** ENG-04 or ENG-08 must relax `awareness.rb` `attack_checks` (line 53) so that a full episode with `mistake` and no `attack` block validates.
6. **E11 room.** "Reuse an existing map" means no new layout. Carrholme gets its branding through P5b's existing scripts: tileset, props, logo, accent and lighting. P5b and E11 must say the same.
7. **Host name clash.** E14's host Tomás Carvalho is renamed to a name that clashes with nothing (check it), so that E11 keeps Tomasz Wiśniewski.
8. **Seeding instructions.** These live in one place, `01` P12, at feature level. Episode specs point to P12 and do not use `awareness_deploy.py`, which only holds the rule of thumb.
9. **`reopencheck` baseline.** On an untouched tree it fails with 4 known problems in `m09_digital_archaeology`. `00` §8 records that as the baseline. A commit must not add new problems.
10. **Generator `REPO`.** P4's generator takes `REPO` from an environment variable or argument, with the repo default and a scratch override, so that P0's scratch regeneration works. `01` gives one consistent procedure.

## Round 1 fixes: E11, E12, E14 to E17

Fixer scope: `episodes/E11_misdirected_data.md`, `E12_visitor_and_tailgater.md`, `E14_social_media.md`,
`E15_shadow_it.md`, `E16_insider_risk.md`, `E17_acceptable_use.md`. No git run; no file edited outside
these six. Each fix was checked against the built files and the code.

### Findings fixed

- **R1_content B2 / R1_sonnet B1, M13 (check-form scheme; ruling 1).** Rewrote §14 of all six specs to
  feed the two shared pairs from `10_CHECK_FORMS.md`: `data_conduct` for E11 (core_05/06), E14 (core_12),
  E16 (core_14) and E17 (core_16); `general_v2` for E15 (core_13) and the one physical-pretext item for
  E12 (core_10). Dropped every per-topic form table (`data_form_*`, `social_form_*`, `shadowit_form_*`,
  `insider_form_*`, `aup_form_*`, E12's "physical-security form") and the bespoke per-topic check shells
  from the §15 file lists and the §17 acceptance checks; the `data_conduct`/`general_v2` shells are built
  by `10`'s generator, and each spec now names only which of `10`'s rows draw on its topic. Noted the
  trade-off (no per-topic pre/post figure). Confirmed the episode scenario-local tells stay out of the
  forms, since a form-scored tell must be in the shared library (ruling 1) and `10`'s items use only
  `00`-library tells.
- **R1_content M4 (ENG-11/12/13; task requirement).** E14 §3/§11/§15 now cite ENG-11's `sortDrill` for
  the "Post or Not?" feed drill and ENG-13's `privacyPanel` for the privacy panel; E15 §3/§11/§15 cite
  ENG-11 `sortDrill` for Swap Shop; E16 §3/§11/§15 cite ENG-12's `concernForm` for "raise a concern";
  E17 §3/§11a/§15 cite ENG-11 `sortDrill` for the "can I?" sort (bins Allowed/Not allowed/Ask first,
  `scored: true`, `answerKeyProfile: "organisation"`, `alwaysScoresBin: "ask"`, locked cards, drawRules).
  Removed every "fold into this episode's engine work or raise a packet" hedge.
- **R1_content M5 (dangling "ENG-09 (check-form needs)").** Removed the ENG-09 check-form dependency from
  §3 of E11/E12/E14/E15/E16/E17 and from each §14 and §4; replaced with a "check forms (no engine
  packet), built per `10`" pointer.
- **R1_content M7 / known issue 8 (ruling 2, E17 shell count).** E17 now ships **one** defend-only shell
  (`awareness_e17_acceptable_use_defend`, id `e17_acceptable_use_defend`, variant `defendOnly`, prefix
  `episode_e17_acceptable_use_defend_defend_` per the built E6 double-suffix pattern), listed in both
  seeded courses. Removed the second "full" shell; rewrote §1, §11b prefix, §13, §15, §16 (one bridge,
  `..._defend_defend_done`), §17, §19 and §20.
- **R1_content m2 (E12 tells framed as an ENG-08 blocker).** E12 §3/§11/§17/§19 now state the four
  scenario-local tells need no ENG-08 library change: the validator accepts a `channelTells` id that
  `flagChips` labels and that is not a factor (`triage.rb` `flag_universe`), so they are declared on the
  set. ENG-08 is still cited for the `world` block, the lobby room type and the locked connection.
- **R1_content m7 / R1_engine m1 / known issue 11 (dashes; ruling 4 style).** Removed every em dash in
  the six files: the L1 titles of E11/E14/E15/E16/E17, the E11 L124 table cell (to `n/a`), E15 L173 and
  E16 L220 (Swap Shop / Raise a concern sentences). Verdicts and card kinds left at the built set (E12's
  Comply/Escalate/Refuse/Ring back and E16's Deny/Approve are the built call and push surfaces, mapping
  to Trust/Report/Delete/Verify).
- **R1_sonnet M10 / ruling 5 (`attack_checks` relaxation).** E11 §10a (the authoritative ENG-04 shape)
  now records that `attack_checks` (`awareness.rb` line 53) must run only when `stages` includes `osint`
  or `write`, with a paired lint that a `mistake` episode has no `attack` block, so a full consequence
  episode validates. Flagged to the 02 fixer (below), since ENG-04 §305 does not yet carry it.
- **R1_sonnet M11 (`flipHeading` erb-only parity).** 02's ENG-04 adds only `flipMontageByChoice` to
  `STRINGS_ERB_ONLY_OK`, so `flipHeading` must live in the fragment. E11 §10/§10a, E15 §10 and E16 §10
  now keep `flipHeading` in `defend.json` `strings` (the defend-only generator pops it; the full erb
  carries the same value, so parity passes) and add only `flipMontageByChoice` to the allow-list.
- **R1_sonnet M12 / ruling 6 (E11 room vs P5b).** E11 §5/§15/§20 now say Carrholme reuses an existing
  training-room layout with no new geometry and gets its branding (tileset, props, logo, accent
  `#4a6b57`, lighting) through 01 P5b's existing scripts; dropped the `apply_training_room.py` mention
  and the "which map to clone" open question.
- **R1_sonnet m11 (sandbox state field).** E11 §10a now names the `mistakeChoices` field and says ENG-04
  adds it to `readState` and clears it in `completeStage` on `flip`, like `sent`.
- **R1_sonnet m12 (Carol not in cast).** Added "Carol" (and the voice-only "DC Hendry") to E11's
  screen-only names list.
- **R1_sonnet m13 (montage framing).** E11 §10a now states the "Your choice" / "taken instead" framing is
  authored into the string text, not applied by the engine, and notes the both-options fallback never
  fires for E11.

### Rulings applied

- **Ruling 1** (two shared pairs): all §14, as above.
- **Ruling 2** (E17 one defend-only shell in both courses): E17, as above.
- **Ruling 4** (built verdicts/card kinds): verified; no change needed in these files.
- **Ruling 6** (E11 room via P5b): E11, as above.
- **Ruling 7** (host name clash): E14's host renamed from the built PA **Tomás Carvalho** to the built
  M&S co-founding partner **Julian Sallow** (`julian.sallow@merrinsallow.example`), which clashes with
  nothing ("Sallow" is only in BRAND_SET per the e4 `nameCheck`; "Julian" does not clash with "Tomasz"),
  saves art (Julian already hosts the E4 executive BA check pair), and is otherwise unused in E14. **E11
  keeps Tomasz Wiśniewski.** E11 §5/§20 and E14 §5/§6/§8/§15/§20 updated.
- **Ruling 8** (seeding via 01 P12): §13 of all six specs (and E12 §15, E17 §13) now seed through 01 P12,
  not `awareness_deploy.py`.

### E12 open question 1 resolved from the code (one NPC or two)

Decided **two front-of-house NPCs**, grounded in the code: an NPC is declared inside one room
(`scenario-schema.json` `rooms[].npcs`), and the `person` pretext target is resolved as a placed world
NPC via `cfg.channels.person` (`episode-runner-minigame.js:640`). The lobby pretext mark and the studio
kiosk host (N16 `eventMappings`) are in different rooms, so one NPC record cannot be both. E12 now uses
**Delphine Arvanitis** as the lobby mark (keeps all the §9.3 influence/ink wiring) and a new M&S
front-of-house colleague **Lorna Easton** (`lorna.easton@merrinsallow.example`; "Lorna"/"Easton" zero
repo hits on 2026-10-28) as the studio kiosk host. Updated E12 §5, §9.1 item 5 (the hand-back is the
settled `watchCall`, no `#trigger_minigame`), §9.3, §15, §19 and §20.1. Confirmed E12 fits ENG-05a (a
`world` modifier on the call `write` stage, handed back via `watchCall`) and the ENG-05b costume,
ENG-05d parcel-sprite and ENG-05c lobby/door/NPC-door packets.

### Requests to the 02 fixer

- **ENG-04 `attack_checks` relaxation (ruling 5).** ENG-04 §305's validator list does not yet relax
  `awareness.rb` `attack_checks` (line 53). Please add to ENG-04 Change 4: `attack_checks` runs only when
  `stages` includes `osint` or `write`, plus a lint that a `mistake` episode has **no** `attack` block,
  so a full E11/E15/E16 (which has `mistake` and no attack block) passes `--strict-social`. E11 §10a
  mirrors this requirement for the content side.

## Round 1 fixes: 00/01/02 (fixer)

Scope: `00_README.md`, `01_PIPELINE.md`, `02_ENGINE_WORK.md` only. No git run. Every B and M touching these three is answered; cheap m and t are fixed too. Findings owned by other files (episode specs, `10`, `11`, `12`, `13`, WRITER_BRIEF) are left to their fixers; where one informed a cross-reference in my files, that cross-reference is corrected.

**00_README.md**
- R1_engine B1 (ENG-10 to ENG-13 absent): **fixed.** §11 count now "ENG-01 to ENG-13"; §5 gains rows for ENG-10 (WP-12), ENG-11 (E14/E15/E17), ENG-12 (E16), ENG-13 (E14), a WP-12-needs-ENG-10 row and split WP-12/WP-15 rows; E14 row now `ENG-09a, ENG-11, ENG-13`, E16 adds ENG-12, E17 is Tarrowby via P5a (no P5b); §4 work order schedules ENG-11/12/13 in the consequence-flip wave and names ENG-10 as WP-12's prerequisite.
- R1_content B2 / R1_sonnet B1 (check-form scheme, ruling 1): **recorded** in §3. Two pairs `general_v2` + `data_conduct`; per-topic forms dropped; trade-off (no per-topic pre/post) stated; rule that any tell scored in a form must be in the shared library.
- R1_content M6 (00 named Marrowdale for E17) and M7 (shell count), ruling 2: **fixed.** §3 company table, shape bullets, §5 and §11 file list now say E17 is one defend-only shell at Tarrowby Logistics, host Nilesh Solanki (verified a genuine built Tarrowby cast member), listed in both courses; Marrowdale removed from 00 entirely.
- R1_sonnet M6 / ruling 9 (reopencheck baseline + environment honesty): **fixed.** §8 step 4 records the 4-problem m09 baseline and ~150s run time; new "The environment, honestly" block covers jsdom, Bundler/json-schema and the Node 24 bridge path, and what to do if each is missing.
- R1_sonnet M5 (Hacktivity repo unnamed): **fixed.** §7 names it as the separate private repo `cliffe/Hacktivity`, attached with `add_repo`, internals still out.
- R1_engine m2 (ENG-05a "stage" wording): **fixed** at 00 §5 ("world-play modifier hand-off (not a new stage)").

**01_PIPELINE.md**
- R1_sonnet M1 / ruling 10 (P0 vs P4 REPO): **fixed.** P0 step 2 and step 6, and the P4 "Differences" bullet, now give one rule: built generators patch their hard-coded REPO in scratch; the new generator reads `BREAKESCAPE_REPO`/`--repo` (falls back to `parents[3]` only from `AW/`), so P0 exports the var when running from scratch and the committed script needs no patching.
- R1_sonnet M12 / ruling 6 (E11 vs P5b room work): **fixed.** P5b heading is Carrholme-only; opening states "reuse an existing map = no new layout", branding via the existing scripts (tileset, props, logo, accent, lighting), inputs = accent hex + two-line wordmark, and that P5b and E11 §5 must say the same. Marrowdale references removed (E17 is P5a Tarrowby).
- Ruling 8 (seeding single home): **fixed.** P12 now states it is the single home of the seeding instructions, that `awareness_deploy.py` holds only the rule of thumb and is not the seed path, and names `cliffe/Hacktivity`; the check pairs join neither seeded course (review-log item 7); E17's one shell listed in both.
- R1_engine t3 (game.js line drift): **fixed** (145 and 241, the merrin_sallow loads).
- R1_sonnet m3 (defend-only flip strings): **fixed.** P4 now lists the exact seven keys `defend_only()` pops and says `flipMissedHeading`/`flipLandedNoTells` carry over, and that `flipAftermath`/`stepLabels`/`flip.mode`/`flipMontageByChoice` are never in the fragment.
- R1_sonnet m4 (P7 "widens n" vs "works as is"): **fixed** in P7 (no code change to the path; ENG-09d only adds rows and updates the count/allow-lists) and tightened in ENG-09d.
- R1_sonnet m6 (where flipAftermath lives): **fixed.** New P1/P2 paragraph: full-episode-only episode keys (incl. `flipAftermath`) are hand-authored into the full erb, never copied by the generator, not compared by parity.
- R1_sonnet m7 (P5a room keys): **fixed** (copy `door_sign` and `connections` from E5 too).
- R1_sonnet M13 (my-file part: two check generators): **fixed** in P4. `gen_e8_e17_shells.py` builds only episode shells; the two check pairs are built by `10`'s own generator from `defend.json` `triageSets`; `PERMUTE`/`CHECK_LINES` belong with that generator. The E11 §14 and `10` naming are the content/`10` fixers' job.
- R1_sonnet M8 (P2 vs E8 copy): **no change needed in 01.** P2's table correctly says a mail write copies E1; the contradiction is inside E8 §15 (content fixer).

**02_ENGINE_WORK.md**
- R1_engine M1 / R1_content B1 / R1_sonnet B2, ruling 3 (ENG-01 vs E08 flip): **fixed.** ENG-01 gains optional `victimName` in the example and a paragraph: all fields authored inline at episode level; E8's "first odd sign" maps onto `items[0]` (`kind:"email"`, `folder:"sent"`, reconstructed from the sent record), never a defend-set id; a sign may also be a defend item with a different id and its own copy. ENG-08's "New episode keys" now lists `flipAftermath` and `stepLabels` (they were missing), with their shapes.
- R1_engine M2, ruling 2-of-tells (ENG-03a vs ENG-08): **fixed** in favour of the ENG-08 table. ENG-03a §3 now says `fake_check_paste`/`fake_update_prompt`/`dangerous_download` are shared, `fake_alarm_callback`/`browser_permission_grab` stay local to E10.
- Ruling 1 + task (E8 tells in ENG-08): **fixed.** Added `unexpected_sent_item`, `unrequested_reset`, `ransomware_note` to the ENG-08 tell table as shared (with the conditional note about `general_v2` balance for the first two, and E13 reuse for the third) and added their canonical strings.
- R1_sonnet M10 / ruling 5 (attack_checks relax): **fixed.** ENG-04 gains a new point 5 and ENG-08 a bullet: `attack_checks` runs only when the stage list holds an attack-artefact stage (`osint`/`build`/`write`/`mfa`/`guess`); a `mistake` episode must have no `attack` block (lint). Verified `awareness.rb:53` guard and `full?`.
- R1_sonnet M3, task point 5 (ENG-09b key form): **fixed.** ENG-09b now decides the single shape (widen `strings.conceptPanel` to also accept an array), deletes the `conceptPanels` alternative, confirms conceptPanel is a single panel today, and notes no new parity allow-list entry is needed.
- R1_engine m2, task point 6 (ENG-05a rename): **fixed.** Heading and packet-index row now say "modifier `world` (not a new stage id)".
- R1_engine m1 / R1_content m7 (em and en dashes): **fixed.** 0 em/en dashes in all three files (verified).
- R1_engine t1 (`VERDICT_ACTIONS` :42): **fixed** to :40 (both references). t2 (`npc-manager` :1251): **fixed** to :911 and :1110. Both verified against the code.
- R1_engine m3 (ENG-04 not self-contained): **fixed.** The normative `mistake`/`flip.mode`/`flipMontageByChoice` config block is now inline in ENG-04 (authoritative), with E11 §10a marked as the content mirror; also named `readState`/`completeStage` as the functions the new `mistakeChoices` patch key must be added to (R1_sonnet m11).
- R1_engine m4 (ENG-02 patternSlots template): **fixed.** Example changed to `"{team}1"`; added that a template interpolates only the slot's own fact, tokens never cross slots.
- R1_engine m5 (ENG-10 variant enum): **fixed.** ENG-10 point 4 now says to extend the schema `variant` enum with `"brief"` and add `STAGES_BY_VARIANT["brief"]`.

**Not fixed, with reason**
- R1_sonnet M11 (E11 `flipHeading` erb-only): left to the E11 fixer; the recommended fix keeps `flipHeading` in `defend.json` (fragment), which is an E11 change, not a parity-test behaviour change. The ENG-04/parity allow-list already covers `flipMontageByChoice` only, which is correct.
- R1_engine M3/M4/M5, R1_content M1-M5/m1-m6, R1_sonnet B1(E8 home)/M4/M7/M9/m1/m2/m5/m8/m9/m10/m12/m13: owned by episode specs, `10`, `11`, `12`, `13` or WRITER_BRIEF. 02 is now the authority for the engine shapes they must align to.

## Round 1 fixes: E8 to E10, E13, 10 to 13

Fixer scope: `episodes/E08_after_the_click.md`, `E09_passwords.md`, `E10_downloads_and_fake_checks.md`,
`E13_ai_assistant.md`, `10_CHECK_FORMS.md`, `11_WP12_FIRST_PLAY_AND_ANNUAL.md`,
`12_WP15_CORE02_ITEMS.md`, `13_WP02_REPORTING_ROUTE.md`. No git run; no file edited outside these eight.
Each fix was checked against the built files and the code, and against the 02 fixer's round-1 edits to
`02_ENGINE_WORK.md` (which had already landed ENG-01 `victimName`, the `flipAftermath`/`stepLabels`
schema keys, E8's three shared tells, the ENG-03a shared/local split, the ENG-02 single-fact template
rule, ENG-09b's array shape, ENG-10's `brief` variant and the `attack_checks`/guess relaxations).

### E8 (R1_content B1 / R1_engine M1 / R1_sonnet B2, M2, M3, M7; t1, t2; rulings 1, 3, 4, 8)

- **Flip (ruling 3, B1/M1/B2).** Rewrote §10 to ENG-01's `flipAftermath` (inline `items[]`, `heading`,
  `victimName`, `intro`, `line`) and `stepLabels: { flip: "The click" }`. Dropped the `flip` block,
  `variant`/`victimTarget`/`firstSign` and `becomeVictimIntro`. The sent-items sign is an inline
  `flipAftermath.items[0]` (`kind: "email"`, `folder: "sent"`, id `fa_sent`), separate from the defend
  row 1 (`e8_sent_invoice`, an inline copy with its own id). §3 adds ENG-01 (flipAftermath/victimName,
  already in 02) and ENG-09b.
- **Verdicts and card kinds (ruling 4, M7).** §11 rows now use only built kinds and verdicts. Row 1 is
  an `email` card from the victim's own address (`ayaan.warsame@quayholt.example`) with a clear subject,
  `isPhish: true`. Row 3 push: engine verdict Report (the `deny_report` action). Row 5 ransomware note
  is a built `page` card with an authored `page` object (no ENG-03 states). Added `truth.isPhish` per row.
- **Reason text vs scoring (ruling 4).** Verified `triage-scoring.js` `VERDICT_POINTS`: under `awareness`
  a genuine item scores full for Trust and Report (and Verify), 30 for Delete. Reworded row 4 (genuine
  Reuben email): both Trust and Report score full, so "Report is the scored move" was wrong; the teaching
  is to help him report, with no penalty either way. Row 6 similarly notes Trust/Verify/Report all score
  full. Fixed the §10 `flipDefenderLine` self-contradiction (m10): the tell is "the service desk never
  sends sign-in requests by email", not "the sender's real address".
- **Tells (ruling 1; task "shared via ENG-08").** §3/§11 now author `unexpected_sent_item`,
  `unrequested_reset`, `ransomware_note` as shared-library tells; verified the 02 fixer has already added
  all three to ENG-08's tell table with canonical strings, which §11 now quotes verbatim. Removed the
  unused `lookalike_domain` from `channelTells` (m2).
- **Concept panels (M3).** §12 now authors the two concept cards as ENG-09b's array form of
  `strings.conceptPanel`; ENG-09b added to §3.
- **§14 (ruling 1).** E8 feeds `general_v2` (not the built `general`), only where it fits `10`'s balance;
  its reset/sent-item signs stay defend-set items for now (no slot in `general_v2` as balanced). Dropped
  the built `general_form_a/b` and the dangling `ENG-09` reference.
- **§15 seeding (ruling 8).** Points to `01_PIPELINE.md` P12; dropped `awareness_deploy.py`.
- **t1.** §5 drops the false "`ha_vm_locked`" claim (that is Hana Novak; `hb_vm_locked` is Reuben Ofori).
  Verified in `e3/defend.json`: Ayaan is grounded as the E5 flip-line victim (`e5/defend.json`
  `_brandAdditions`), and Reuben (`hb_vm_locked`) is noted as the row-4 colleague.
- **t2.** §11 rows 2 and 6 now use the built `it-servicedesk@quayholt.example`, not a second IT mailbox.
- §16 bridge now describes the `flipAftermath` play and the correct item count (four sign items: rows 1,
  2, 3, 5); §19/§20 updated to the resolved state.

### E9 (R1_content M1, M2, M3; R1_engine M3; known issue 3; ruling 1)

- **`guess` stage (M1).** §6/§7/§9 now use the new `guess` stage id (ENG-02), not a reuse of `build`;
  stage list is `["brief","osint","guess","flip","defend","debrief"]`, with ENG-08's osint-guess-flip
  order noted (no `write`). §9's `awarenessEpisode.guess` config aligned to ENG-02's field names
  (`patternSlots[].factId`, `reuseStep.factId`, `landedGlobal: "guess_e9_landed"`), single fact per slot
  with fixed digits baked into each template (ENG-02 m4), and the slot-pattern prose matched.
- **Password cards are ENG-09a (M2).** §6/§11 rows 4 to 7 are `choice` triage items (ENG-09a), not
  ENG-02; any meter is static authored bands. §11 trailing paragraph and §15 reattributed to ENG-09a.
- **Defend-only needs ENG-09a (M2, known issue 3).** §7/§13 now say the defend-only variant needs
  ENG-09a (not ENG-02), matching ENG-02's own Stop-and-ask. §3 adds ENG-09a and ENG-09b; ENG-08 row names
  the stage-id/order/schema/choice-kind collection.
- **Concept panels (M3).** §12 concept cards now cite ENG-09b's array form.
- **§14 (ruling 1).** Feeds `general_v2` (items 3 and 4 already carry the MFA/password/push content); the
  `choice` password cards are an episode surface, not carried into a form; dropped the "new topic form
  (ENG-09)" hedge. §13 seeding points to P12.

### E10 (R1_content m3; R1_engine M2, M4; known issue 4; ruling 1)

- **Verdict (M4, known issue 4).** §11 states the decided `verdictLabels` relabel (trust->"Carry on",
  report->"Close and report", delete->"Go the trusted way"), ids and scoring unchanged; removed the
  "relabel or new verdict" open question from §19/§20. Verified `VERDICT_POINTS` scoring is label-neutral.
- **Tells shared/local (M2, ENG-08 table).** §3/§11 split the five web tells per ENG-08:
  `fake_check_paste`/`fake_update_prompt`/`dangerous_download` classed shared,
  `fake_alarm_callback`/`browser_permission_grab` scenario-local; E10 lists all five in `channelTells`
  with a `flagChips` label and `redFlag` sentence so it validates either way.
- **Packet names.** Bare `ENG-03` changed to `ENG-03a` (states/verdictLabels) throughout; the optional
  download build page is `ENG-03b`. §3 adds ENG-09b.
- **§14 (ruling 1).** Feeds `general_v2`; its web item uses the built `page` shape (ENG-03a says so), so
  whether general_v2 scores the new web tells is `10`'s balance decision; the local-only screens are not
  form-scored. Dropped the "new topic form (ENG-09)" hedge. §13 seeding points to P12. §12 concept cards
  cite ENG-09b.

### E13 (R1_content m4; known issue 10; ruling 1; task points)

- **Assistant in the flip region (ENG-06).** §7 already runs the assistant beats in the flip region; kept
  and reinforced (no new `STAGE_IDS` stage).
- **ENG-07 label reaches the call card.** §11 already carries the "Brightwell Meet / External" label to
  the scored triage `call` item; kept, and §19/§20.2 note it as resolved.
- **Stage-order relaxation (m4, known issue 10).** §3 ENG-08 row and §7 now state ENG-08 must add the
  osint-optional order `brief write flip defend debrief`, which the lint rejects today.
- **Concept panel.** §12 notes E13 has a single `conceptPanel`, so it uses the built one-panel shape and
  does **not** need ENG-09b (task: "one panel and note it").
- **§14 (ruling 1).** Feeds `general_v2` (its item 6 carries the AI/deepfake topic); the scenario-local
  tells `hidden_instruction`/`deepfake_request` are not form-scored, so they stay E13 defend-set only.
  Dropped the dangling `ENG-09 (check-form needs)` dependency (R1_content M5).
- **t2 (engine).** §2 corrects the `npc-manager.js` video-call citation from `:1251` to `:910-912` and
  `:1100-1122` (verified in the code); `person-chat-ui.js:264` confirmed correct.

### 10 (R1_content B2 / R1_sonnet B1, m9; ruling 1; task)

- **Scheme (B2/B1, ruling 1).** 10 was already on the two-pair scheme. Added the explicit statement that
  `general_v2` and `data_conduct` are the **single home** for every E8 to E17 check item (episodes point
  here, do not define their own forms), with the episode-to-form mapping, and the **per-topic trade-off**
  to put to the user (no per-topic pre/post figure).
- **Shared-library relaxation (ruling 1).** "Depends on" and "Do not" now read "existing ids, or ids that
  ENG-08 adds to the shared library"; a check-form item never scores a scenario-local tell.
- **Verify notes.** Verified against the built shells (2026-10-28): Verify on for finance/helpdesk/
  executive/mobile, off for general/hr (key absent). Added that under `awareness` Verify scores like
  Report (full on genuine and unsafe), so Verify-on never beats the measurement; clarified general_v2
  Verify-off (its page item has no Verify) and data_conduct Verify-on (the item-4 call "ring back").
- **m9.** Fixed "(01 to 09 in this folder)" to `episodes/E08` to `E17`; replaced the non-disjoint PERMUTE
  example with a hand-verified disjoint pair (form A `[1,0,3,2,5,4,7,6,9,8]` -> phish slots {1,3,5,7};
  form B `[0,3,2,1,4,7,6,5,8,9]` -> phish slots {2,4,6,8}), and named the old pair as not disjoint.

### 11 (R1_engine M5 / R1_content m5; known issue 13)

- **Point core_00 at ENG-10.** "Read first" now names ENG-10 and the validator fact (the `full`/
  `defendOnly` orders reject `stages: ["brief"]`). The recommendation, the shell's `awarenessEpisode`
  (`variant: "brief"`, `doneGlobal`, `oncePerLearner`, `strings.briefCards`), the "Completing the
  mission" options (ENG-10 `doneGlobal` is the clean path; the stopgap still needs ENG-10's validator
  allowance), the "Engine gaps" list, the acceptance check and the Stop-and-ask all now route through
  ENG-10. Part B (core_17) had no B/M finding and is unchanged.

### 12 (no B/M finding)

- Reviewed R1_engine/content/sonnet for findings touching `12_WP15`; none raised (the sonnet pass only
  verified E3/E6 shapes in passing). No episode spec reassigns the remote-access or chat-app channel, so
  12's Stop-and-ask is not triggered. Left unchanged.

### 13 (R1_sonnet M5, t3; task: seeding conflict with E8)

- **Seeding conflict with E8.** E8 §15 no longer tells the implementer to seed via `awareness_deploy.py`;
  it points to P12. 13 §7 now adds (feature level, no Hacktivity internals) that episode course
  membership is P12's job, separate from WP-02's reporting-route default, that the two are independent and
  order-free, and that `awareness_deploy.py` is used for neither.
- **t3.** §208 now shows a `</script>` value serialised as `<\/script>` (forward slash escaped by
  `json_escape`); §119 "all fourteen built ... episodes" reworded so it does not go stale as E8+ land.

### Requests to the 02 fixer

- **ENG-08 tell-table reason columns (minor, no behaviour change).** Two reason strings are now inaccurate
  against the content, though the shared classification is harmless: (a) `ransomware_note` is listed as
  used by "E8 (defend), E13 (defend)" but E13 does not use `ransomware_note` (its tells are
  `hidden_instruction`/`deepfake_request`); it is E8-only, still fine to keep shared. (b)
  `fake_check_paste`/`fake_update_prompt`/`dangerous_download` are justified as shared "because general_v2
  scores them", but `10`'s `general_v2` item 2 uses the built `page` shape scoring `lookalike_domain`/
  `padlock_myth` (consistent with ENG-03a's note that general_v2's page item uses the built shape), so
  general_v2 does not currently score them; they are E10-only today. Please reconcile the reason columns
  with ENG-03a and `10` (either keep them shared as a forward-looking pre-registration, noting general_v2
  may adopt them, or reclassify as local). No change needed to E8/E10/10, which validate either way.

## Known items for round 2 (orchestrator)

1. The ENG-08 tell table gives the wrong reason for some rows. `ransomware_note` is used only by E8, not by E13. `fake_check_paste`, `fake_update_prompt` and `dangerous_download` are said to be shared because `general_v2` scores them, but `general_v2` does not score them. Either correct the reason, or reclassify these tells as local.
2. E8's one-off firm `fenwick-brandt.example` has the same surname as E14's subject, Dani Fenwick. Rename one of them.
3. E14's host is now Julian Sallow (built Merrin & Sallow cast, the executive BA check host). E12 adds Lorna Easton as a second front-of-house NPC. Check both for clashes and for art cost.

## Round 2 results

| Review | B | M | m | t | Verdict |
|---|---|---|---|---|---|
| R2_engine | 0 | 0 | 2 | 2 | clean |
| R2_content | 0 | 1 | 3 | 2 | not clean |
| R2_sonnet | 1 | 9 | 13 | 3 | not clean |

## Round 2 rulings (orchestrator)

1. **core_17 annual edition (R2_sonnet B1).** Build it as a `defendOnly` variant whose defend set holds 8 messages. 8 is the `EPISODE_MESSAGES` cap. Take the 8 messages from E1 to E7, include at least one mirror pair, and cover email, call, voicemail, SMS or QR, and push. This shape validates with no new engine packet. The annual sitting is that shell (about 8 to 10 minutes) followed by the learner's existing role post-check (about 9 minutes), so about 17 to 20 minutes in total. Drop the 17-message design.
2. **Tell table reasons (R2_engine m1, R2_content m1).** Reclassify every tell used by only one set today as **local**: `ransomware_note`, `fake_check_paste`, `fake_update_prompt`, `dangerous_download` and `mfa_number_relay`. The exception is any tell that a `10` check item scores, which must be shared (ruling 1 of round 1). Promote a tell to shared only when a second set uses it. A shared tell also needs a `SKILL_NAMES` entry in `triage-flags.js`, and the two tests that loop over `CHANNEL_TELLS` must keep passing (R2_sonnet M7).
3. **`choice` card scoring (R2_engine m2, R2_sonnet M6).** Each option of a `choice` card maps to one of the built verdicts, and it is scored exactly as that verdict is scored under `KIND_VERDICT_POINTS` and `VERDICT_POINTS`. The card's `truth` is the correct verdict. A card holds one decision only, so E9 row 5 is split in two.
4. **Fenwick (round 2 known item 2).** Rename E8's one-off firm `fenwick-brandt.example` to a name that clashes with nothing. Correct E14's "no repo hits" claim, because Arthur Fenwick exists in sector_01.
5. **E8 completeness (R2_sonnet M1, M2).** E8 must list every shell and generator metadata value, plus its attack-fragment skeleton, in full. Copy the shape from the built E5 and `gen_e3_e5_shells.py`, the generator that actually holds Anjali's `HOSTS` entry, and fix P4's "copy the e6/e7 generator" pointer to match. The pilot must need no guessing.

## Round 2 fixes: 11, E11, E12, E14 to E17

Fixer scope: `11_WP12_FIRST_PLAY_AND_ANNUAL.md`, `episodes/E11_misdirected_data.md`,
`E12_visitor_and_tailgater.md`, `E14_social_media.md`, and `E15_shadow_it.md` / `E16_insider_risk.md` /
`E17_acceptable_use.md` only where a round 2 finding touches them. No git run; no file edited outside
these. Every fix checked against the built files, the fragments and `scripts/validate_social/awareness.rb`.

### Findings fixed

- **11 Part B / core_17 (R2_sonnet B1, round 2 ruling 1).** Rewrote Part B from the 17-message `full`
  design to a **`defendOnly` variant with an 8-message combined set**, which validates under
  `--strict-social` with **no new engine packet**. Verified against `awareness.rb`:
  `STAGES_BY_VARIANT['defendOnly']` allows `["brief","defend","debrief"]`; `EPISODE_MESSAGES = (4..8)`
  covers 8; `full?` is `variant == 'full'`, so `attack_checks` never runs and no attack block is needed;
  `id_suffix_checks` is satisfied by id `core_17_annual_2027_defend`; `set_checks` wants
  `outcome.setGlobalPrefix == "episode_core_17_annual_2027_defend_defend_"` (the built double-suffix),
  done global `episode_core_17_annual_2027_defend_defend_done`. **The 8 reuse ids, all grep-confirmed to
  exist 2026-10-28:** `e1_lookalike_bank` (email phish), `e1_bank_confirmed` (email genuine),
  `e3_push_early` (push phish), `e3_call_gordon_impostor` (call phish), `e3_call_gordon_real` (call
  genuine), `e5_sso_lookalike` (page phish), `e6_shift_moved` (sms genuine), `e7_vm_ravinder_cloned`
  (voicemail phish). **Channel coverage:** email, call, voicemail, SMS and push (plus a sign-in page),
  which is the ruling's email / call / voicemail / SMS-or-QR / push. **Mirror pair:** the two Gordon
  calls (impostor normal-looking, real awkward-genuine). **E3 calls reshaped as data only:** both go in
  `messages` as plain triage `call` cards (shape of `ha_call_facilities`: `callerId`, `from`, `time`,
  `transcript`, `truth`), `tells`->`truth.flags`, `claims` dropped, **no `defend.calls` key** so
  `call_checks`/`pretextNpcs` are not pulled in. `channelTells` set to the union of the copied items'
  `00`-library tells (no new tell). Timing rewritten to shell (8 to 10 min) **plus the learner's
  existing role post-check** (about 9 min) = 17 to 20 min; the pre/post-bracket section became a
  post-check-follows note (core_17 is not a check mission, declares no `triage_pre_*`). Acceptance,
  Files, Do-not and Stop-and-ask rewritten to the `defendOnly`/8-item shape and 01 P12 seeding.
- **11 Part A (R2_sonnet m12).** Settled the one-panel-vs-seven-cards contradiction in favour of
  **ENG-10's `strings.briefCards`**: retitled "The brief panel content" to "The seven cards", stated
  each of the seven beats is one `briefCards` entry (not one `strings.brief` panel), and kept the single
  rich `strings.brief` panel only as the ENG-10-not-ready stopgap. Now agrees with "Recommendation" and
  "The shell".
- **E11 (R2_sonnet M9).** Added section 15a, the full objective design for a `mistake` episode with
  **no `phish_*` target**: the recommended **one-aim** design (a single `missionConclusion: true` defend
  aim concluded on `episode_e11_misdirected_data_defend_done`, quoted `conclusionScreen`,
  `conclusionTaskId: "sort_desk_inbox"`, the host NPC `eventMappings` on the done global), the full
  `globalVariables` list (no `phish_*` and no attack-landed global), and the defend-only double-suffix
  globals. Stated that P2's "first aim `manual` / `phish_<targetId>_attempts`" does **not** apply to
  E11, and documented the optional two-aim variant as needing ENG-04 to write a global when `mistake`
  completes (flagged, not assumed). Shape copied from `awareness_e6_texts_and_qr_defend` (one aim) and
  `awareness_e4_exec_whaling` (two aims).
- **E11 §17 (R2_sonnet m6).** Fixed: the validator takes the `scenario.json.erb` **file path** per
  shell, not the folder (README 8.3); and E11 does not own "four check shells": `10`'s generator builds
  **eight** shells across both shared pairs (`awareness_{pre,post}_{general_v2,data_conduct}_{ab,ba}`),
  validated as `10`'s acceptance.
- **E12 (R2_content t1).** Added an explicit **art-load tally** to section 5: the hi-vis courier costume
  `aw_hivis_courier_v2` (parcel baked into `walk`/`breathing-idle`) plus its talk portrait, two new M&S
  NPCs (Delphine Arvanitis, Lorna Easton), and the new lobby map `room_aw_merrin_lobby`, noted as a
  larger budget than a one-NPC episode. Stated that **Lorna Easton can reuse an existing built sprite**
  (the kiosk host needs only a world sprite and a talk portrait, no influence bust), saving one full
  character art set; only Delphine (the pretext mark) needs a new person-chat portrait, so the true new
  art cost is one set plus the costume, not two.
- **E14 (round 2 ruling 4 / R2_content m2).** Corrected the false "'Fenwick' had no repo hits" line:
  **Arthur Fenwick** exists as a bed-sprite-only background patient in the **unbuilt**
  `modules/sector_01_healthcare/game_design.md` and `03_WORLD_AND_CAST.md`. **Kept Dani Fenwick** (a
  different first name, a different company, a different and unbuilt sector module, never met in the same
  course), stating the clash on the record rather than hiding it; acceptable because the two are in
  separate modules. Noted that the other half of ruling 4 is already resolved on the E8 side (the E8
  fixer renamed `fenwick-brandt.example` to `Marsden Holloway`), so no awareness-episode Fenwick clash
  remains.

### Findings that do not touch E15, E16 or E17 (no edit; checked)

- **No round 2 B/M/m/t finding targets E15, E16 or E17.** R2_content, R2_sonnet and R2_engine mention
  them only in passing or as round-1 items already fixed / spot-checks that passed.
- **Ruling 2 (tell reclassification) does not reach them.** The five reclassified tells
  (`ransomware_note`, `fake_check_paste`, `fake_update_prompt`, `dangerous_download`,
  `mfa_number_relay`) are not used by any of E15/E16/E17 (grep-confirmed). Their new tells
  (`found_media`, `unapproved_tool`, `insider_offer`) are already declared scenario-local via
  `flagChips`, which the validator accepts; none is promoted to the shared library, so no `SKILL_NAMES`
  entry or `CHANNEL_TELLS` change is implied. (`unapproved_tool` appears in E15 and E17, each as its own
  scenario-local declaration on independent sets that are never merged; no review flagged it and it is
  not one of ruling 2's five tells.)
- **Ruling 3 (`choice` card scoring) does not reach them.** None of E15/E16/E17 uses a scored triage
  `choice` card (grep-confirmed). Their sort activities are ENG-11 `sortDrill` surfaces and ENG-12
  `concernForm`, and the `mistake`-sandbox beats are unscored ENG-04 `beats[].options`, none of which is
  the `choice` triage kind that ruling 3 governs.

### Note to the 02 fixer (unchanged by me)

- E11's optional two-aim objective design would need ENG-04 to write a global when the `mistake` stage
  completes (none today; the chosen options live in `episode_<id>_state`, cleared on `flip`). E11 ships
  the one-aim design and flags the two-aim variant as ENG-04 scope; raise it with 02 only if that design
  is wanted.

## Round 2 fixes: E8, E9, E10, E13

Fixer scope: `episodes/E08_after_the_click.md`, `E09_passwords.md`, `E10_downloads_and_fake_checks.md`,
`E13_ai_assistant.md`. No git run; no file edited outside these four. Every fix was checked against the
built E5 fragment (`awareness/e5/attack.json`), the E5 scenario erb and `mission.json`,
`gen_e3_e5_shells.py`, `triage-scoring.js` (`VERDICT_POINTS`/`KIND_VERDICT_POINTS`), and the Round 2
rulings.

### E8 (R2_sonnet M1, M2; Round 2 rulings 4 and 5; R1_sonnet m5, m8, t1, t2, M8)

- **Shell and generator metadata, in full (ruling 5 / R2_sonnet M1 / R1_sonnet M4, m8).** Added a new
  **§8b** giving every value as a final string: the full-erb two-aim `objectives` (ids, titles,
  descriptions, tasks, `concludeRequires`, `conclusionScreen`), the training-kiosk `observations` and
  `observationVariants`, the `mission.json` (`display_name`, `description`, `cybok` keywords), the
  top-level erb strings, the generator `EPISODES['e8']` entry and `LINES[('e8','defend')]` tuple
  (Anjali's voice), and the host spoken lines for the full shell. Shapes copied from the built E5 erb
  and `gen_e3_e5_shells.py`.
- **Anjali's `HOSTS` entry and sprite (m8).** §8b quotes `HOSTS['anjali']` verbatim from
  `gen_e3_e5_shells.py` (`sprite: 'female_scientist'`, verified) and gives the in-scenario host NPC
  sprite keys `female_scientist_v2` / `female_scientist_talk.png` / `female_scientist_visemes.png`
  (the E5 host-NPC shape) plus the learner avatar. Noted that 01 P4's "copy the e6/e7 generator"
  pointer should be corrected to `gen_e3_e5_shells.py` for the Anjali/Quayholt helpers (a request to
  the 01 fixer, out of this file's scope).
- **Attack-fragment skeleton, in full (ruling 5 / R2_sonnet M2).** Added an "Attack fragment skeleton"
  subsection to §9 listing the exact changes against `e5/attack.json`: the Ayaan/`itdesk` `people`
  rows, the four `intelFacts` (two copied verbatim from E5, two Ayaan facts), the three-page
  `osint.sites` with every block's `fact` present, the `post_ayaan` social post, the `mailClient`
  `contacts` row (`revealedBy: se_intel_quayholt_staff_claims`, `targetId: takeover_victim`), and the
  `playerSentAuth` block (copied from E5, `envelopeFrom: bounce.quayholt.example`). **The dangling
  `quayholt_sso_portal` fact and its `blk_sso` block are explicitly deleted** (E8 has no page), which
  resolves R2_sonnet M2's dangling reference; `landingPages`/`payloadKit`/`conceptCards` are dropped.
- **Gate (R2_sonnet M1).** Added a sentence to §4 making §8b, §9's skeleton, §10 and §11 a content gate
  the `opus48` writer completes before P2 wiring starts.
- **Fenwick rename (ruling 4).** Renamed the one-off client firm `fenwick-brandt.example` to **Marsden
  Holloway** (`marsden-holloway.example`) throughout §10, §11 and §15. "Marsden" and "Holloway" each
  return zero repo hits (checked 2026-10-28); the §15 note records the rename and that the old name
  clashed with E14's Dani Fenwick and sector_01's Arthur Fenwick. (E14's "no repo hits" claim is the
  E14 fixer's; flagged there.)
- **"Wired like E5" vs "copy E1" (R1_sonnet M8 / R2_sonnet m3).** §15 now says: frame from E1 (01 P2),
  host ink is E1's `adaeze_okafor.ink` structure with Anjali's lines, and take only the Quayholt names,
  sites, templates and the Quayholt globals/`eventMappings` shape from E5; do not copy E5's
  `se_landing_pages`/`landing_*` globals (E8 has no build stage).
- **Defend-only bridge (R1_sonnet m5 / R2_sonnet m1).** §16 drops the defend-only bridge: `run-suite.sh`
  `JOBS` has only `*-full` entries and no defend-only bridge exists to copy. Only `bridge-e8-full.jsonl`
  is added.
- **"Eight pinned strings" (R1_sonnet t1 / R2_sonnet t1).** §13 reworded to the `_defendOnly`
  pinned-strings convention with no reliance on a count of eight (the schema `strings` carries about
  twenty keys).
- **§2 path and §5 reason (R2_sonnet t2).** §2's `modules/.../03_WORLD_AND_CAST.md` corrected to
  `planning_notes/security_awareness_course/03_WORLD_AND_CAST.md`. §5's "the colleague fooled in the E5
  flip line" reason corrected: the shipped E5 flip strings name Hana Novak, so the E5 `_brandAdditions`
  note is stale; E8 uses Ayaan only because he is an established Quayholt claims handler (the genuine
  `ha_call_printer` caller in E3, a `call` not a voicemail). Verified `hb_vm_locked` is Reuben Ofori in
  the actual E3 data (an authoring comment in `e3/defend.json` mislabels it, but the card is Reuben).

### E9 (Round 2 rulings 2 and 3; R2_content m3; R2_sonnet m13)

- **`choice` card scoring and `truth` (ruling 3 / R2_sonnet M6).** §11 now defines the mapping once:
  each `choice` option maps to a built verdict and is scored exactly as that verdict under
  `VERDICT_POINTS`; the card's `truth` carries `correct` (the right verdict) and `isPhish`. Every E9
  choice card uses `truth.isPhish: true` with the safe option -> `report` (60, full) and the unsafe
  option -> `trust` (0, a miss), `truth.correct: "report"`, no Verify button. Added a worked message
  JSON for row 4. Verified against `triage-scoring.js` (`phish` column: report 60, trust 0).
- **Split row 5 (ruling 3).** The old two-part sign-up card (unique-vs-reuse plus true-vs-made-up
  security answer) is split into row 5 (`e9_signup_password`) and row 6 (`e9_security_answer`), so each
  card holds one decision. Rows renumbered to 8 cards; the ladder and shared-PC cards are now rows 7 and
  8. Updated all stale "rows 4 to 7" -> "rows 4 to 8", "about 6 to 7" -> "about 6 to 8", the cut note
  ("cut row 7 or row 8"), and §20 open question 5's count (eight decisions).
- **`mfa_number_relay` local (ruling 2).** §3 and §11 reclassify `mfa_number_relay` as scenario-local to
  E9 (only E9 scores it today; the shipped E3 set does not carry it; no `10` item scores it), declared
  in `channelTells` with a `flagChips` label, no shared-library append. §17 acceptance updated.
- **Stale open question 4 (R2_content m3).** §20 open question 4 replaced with the Round 1 resolution
  (E9 feeds `general_v2`; the `choice` cards are an episode surface, not a check-form item).
- **"Wired like E6" (R2_sonnet m13).** §15 reworded: frame from E1 (01 P2), Tarrowby room from P5a,
  `guess` block from ENG-02; E6 is the reference only for the built Tarrowby room and cast, not the
  stage shape.

### E10 (R2_content M1; Round 2 ruling 2)

- **§15 seeding (R2_content M1 / ruling 8).** §15 no longer seeds the two courses "through
  `awareness_deploy.py`"; it now follows `01_PIPELINE.md` P12 and says not to use `awareness_deploy.py`
  for course seeding, matching E10's own §13 and the other specs.
- **Tells local (ruling 2).** §3, §11, §14, §17 reclassify all five of E10's web tells
  (`fake_check_paste`, `fake_update_prompt`, `dangerous_download`, `fake_alarm_callback`,
  `browser_permission_grab`) as scenario-local: none is scored by a `10` check item (`general_v2` item 2
  scores `lookalike_domain`/`padlock_myth` on the built `page` shape), so under ruling 2 every one stays
  local, declared in `channelTells` with a `flagChips` label; a single id moves to the shared library
  (with a `SKILL_NAMES` entry) only if `general_v2` is later balanced to score it.

### E13 (R2_content t2)

- **§15 seeding cites P12 (R2_content t2).** The "Hacktivity course seeds" line now follows
  `01_PIPELINE.md` P12 (ruling 8) and says not to use `awareness_deploy.py`, for parity with E8 to E17.

### Not fixed, with reason

- **R2_content m1 / R2_sonnet m2 (ENG-08 tell-table reason columns):** owned by `02_ENGINE_WORK.md`
  (the 02 fixer), not editable here. The E8/E9/E10/E13 content is consistent with ruling 2 as written
  (all single-set tells are now declared scenario-local), so no change is needed in these four files.
- **01 P4 "copy the e6/e7 generator" pointer (ruling 5):** flagged to the 01 fixer in E8 §8b; 01 is out
  of this file's scope.

## Round 2 fixes: 00/01/02 (fixer)

Scope: `00_README.md`, `01_PIPELINE.md`, `02_ENGINE_WORK.md` only. No git run; no file edited outside
these three. Each fix was checked against the code in `/home/user/BreakEscape` on 2026-10-28.

**02_ENGINE_WORK.md**
- **R2_engine m1 / R2_sonnet m2 (tell-table reasons; ruling 2):** rewrote the ENG-08 tell table. Every
  E8 to E17 tell is used by exactly one set today, so **all are reclassified local** (`unexpected_sent_item`,
  `unrequested_reset`, `ransomware_note`, `mfa_number_relay`, `fake_check_paste`, `fake_update_prompt`,
  `dangerous_download`, plus the already-local E10/E12/E13 ids). Verified against `10_CHECK_FORMS.md` that
  `general_v2` (scores `lookalike_domain`, `padlock_myth`, `unrequested_mfa_push`, `senderTrust`,
  `linkCredible`, `reply_to_differs`) and `data_conduct` (scores `senderTrust`, `pretextRelevant`,
  `secrecy_or_bypass`, `vish_callback_pressure`, `reply_to_differs`) score none of them, so the ruling-1
  exception does not apply and nothing is promoted to shared. Corrected the false "E13 uses `ransomware_note`"
  and "E3 uses `mfa_number_relay`" claims. Deleted the "canonical strings to register for the shared ids"
  append list (now zero shared additions) and recast it as suggested local `factorStrings.<id>.redFlag`
  wording. Result: no `CHANNEL_TELLS` append this round, so the lab and the 38 shells are untouched.
- **R2_sonnet M7 (`SKILL_NAMES` + the two loop tests):** verified both tests loop
  `Object.keys(F.CHANNEL_TELLS)` asserting `F.SKILL_NAMES[id]` (`social-triage-weakest.test.mjs:201`,
  `social-gap-triage-flags-comparison.test.mjs:89`) and `SKILL_NAMES` is at `triage-flags.js:47`. Added the
  rule to ENG-08: a promotion to shared must add a `SKILL_NAMES` entry in the same change or both tests fail;
  stated that this round promotes nothing, so no `SKILL_NAMES` change and both tests pass unchanged; added
  them to the ENG-08 acceptance note. Aligned ENG-03a point 3 (the three download tells are now local too).
- **R2_sonnet M4 (ENG-04 runner wiring for `mistake`):** verified `_render:335` draws a launch panel only
  when `STAGE_COPY[stage]` exists (else `_renderFinished:336`), `STAGE_COPY:79` and `step-strip.js`
  `STAGE_LABELS:9` have no `mistake`, and `_launch:548` has a per-`spec.kind` chain. Added a new Change 2a:
  add `STAGE_COPY.mistake` (so `_render` draws the panel), `STAGE_LABELS.mistake` (overridable via
  `stepLabels`), and a `_launch` `mistake` branch calling `_completeWhileAway('mistake', { mistakeChoices })`,
  wired like `build` at `:577`. Added a test line (a full consequence episode at stage `mistake` shows a
  button, not "Finished") and the symbols to ENG-04 Read-first.
- **R2_sonnet M5 (ENG-02 flip branch vs `cleanSent`):** verified `cleanSent:81` keeps only a `call` or mail
  record and `readState:129` runs it on every read, so a `{ kind: 'guess' }` record is dropped. Added to
  ENG-02 Change 4: add a `kind === 'guess'` branch to `cleanSent` returning `{ kind: 'guess' }`, write it with
  `_completeWhileAway('guess', { sent: { kind: 'guess' } })`, and test `readState` keeps it. Noted the flip
  already clears `sent` at `:160`, so no extra patch-key change is needed for `guess`.
- **R2_engine m2 / R2_sonnet M6 (ENG-09a choice scoring; ruling 3):** verified `VERDICT_POINTS:70`,
  `KIND_VERDICT_POINTS:43` (holds `call` only), `verdictPoints:88` and the `perMessage` record at `:285`.
  Rewrote ENG-09a's Change: each `choice` option carries one of the four built verdicts; the card has a
  `truth` (`isPhish`, `correct`); the chosen verdict is scored through the shared `verdictPoints`/`scoreTriage`
  path under `awareness` (falls through to `VERDICT_POINTS` as `choice` has no `KIND_VERDICT_POINTS` entry);
  gave the exact `se_awareness_records` record shape (flagPoints 0, empty flag arrays); stated the
  one-decision-per-card rule and its lint; updated the schema lints and the tests-to-add; added the symbols
  to Read-first. (E9 row 5's split is the E9 fixer's job.)
- **R2_sonnet M8 (ENG-10 skip `defend_set` for `variant: brief`):** verified `episode_checks:44` always runs
  the defend-set group `:57-66` and `defend_set` errors "defend.setId is missing" at `:362`. Rewrote ENG-10
  Change 4 to gate that whole group on `!brief?(ep)` (new `brief?` helper beside `full?`), and to add a
  brief-only conclusion lint that the `missionConclusion` aim's `concludeRequires.globals` names `doneGlobal`.
  Added the symbols to ENG-10 Read-first.
- **core_17 needs no packet (ruling 1):** ENG-10 "Episodes that depend on it" now states core_17 is a
  `defendOnly` 8-message shell that validates on the built path with no `brief` variant and no packet; only
  core_00 needs ENG-10.
- **The garbled ENG-02 dependency paragraph (R2_sonnet m11):** replaced with "E9 (attack half only). The
  defend-only variant needs ENG-09a, not ENG-02", with the reason (`guess` is an `ATTACK_STAGES` id dropped
  from a `defendOnly` shell; the password cards are ENG-09a).
- **R2_sonnet t3 (stale "checked" claim):** softened 02's line 3 to name the 2026-10-28 round-2 re-read.
- No em or en dashes introduced (verified at byte level).

**01_PIPELINE.md**
- **R2_sonnet M3 (P5b object registration):** verified `scripts/room_gen/register_object.py` exists with
  `--wall` and `--dry-run`, and that `--wall` edits `catalog.json`, `tilesets_ref.json`,
  `objects_hospital_extras.tsx`, `game.js` (the `this.load.image` block) and `generate_rooms.py`
  `WALL_MOUNTED_EXTRAS`. Added P5b step 3a: run `register_object.py --wall aw_logo_carrholme1
  aw_poster_report_carrholme1` (with `--dry-run` first), listed all five files it touches and the `grep`
  check that confirms it ran; clarified step 5 that the object-image loads are made here, not in step 5
  (which does only the tilemap and tile-sheet loads).
- **P4 pointer to `gen_e3_e5_shells.py` for Anjali (ruling 5 / R2_sonnet M1):** verified `HOSTS['anjali']`
  (`'id': 'anjali_rao'`, `'sprite': 'female_scientist'`) is in `gen_e3_e5_shells.py` and absent from
  `gen_e6_e7_shells.py`, and that the two generators differ (`gen_e6_e7` has `meta_for`, `gen_e3_e5` has
  `success_screen`). Kept the helper scaffolding on `gen_e6_e7_shells.py` (its shape matches the field list)
  but added that E8's host entry and line shape are copied from `gen_e3_e5_shells.py` with sprite
  `female_scientist`, not looked for in `gen_e6_e7`; updated the `HOSTS` bullet to match. (The full E8 §8b
  metadata table is the E8 fixer's job; this fix only corrects the generator pointer, per task scope.)
- **R2_sonnet m9 (P5b details):** step 2 now gives an actionable in-place check (record and compare md5sums
  of the existing `room_aw_*` PNGs, since `make_aw_tileset.py` has a fixed `OUT_DIR`); step 7 now says to
  drop Quayholt's `aw_quayholt_queue` light emitter from the Carrholme lighting entry, since Carrholme's
  `COMPANY_OPS` drops that prop.

**00_README.md**
- **R2_sonnet m5 (E8 row ENG-09b):** §5 E8 row now reads "ENG-01, ENG-09b (E8 has two concept panels),
  ENG-08 (schema keys; E8's tells are scenario-local), ENG-09d", dropping the conditional "(if two panels)".
- **R2_sonnet m4 (Check-forms engine deps):** §5 Check-forms row now says no engine packet is needed (every
  item kind is built; every scored flag is an existing shared-library id; a form-scored tell must be shared
  per ENG-08, which the two pairs already satisfy), replacing the "ENG-03a, ENG-09a" claim.
- **R2_engine t1 (stale E14/ENG-04 hedge):** §4 now says E14 does **not** use ENG-04 (uses built
  `osint`/`write`); §5 ENG-04 row drops "(E14 optional)".
- **R2_engine t2 (ENG-05d parcel art):** §5 ENG-05d row now states the parcel sprite is not a wiring
  prerequisite; E12 is wired and bridged with the stock costume sprite and gets the baked-in parcel after
  the reset; only ENG-05a to ENG-05c and ENG-09c must land before E12 is wired.
- **core_17 needs no packet (ruling 1):** §4 "Alongside" and the §5 WP-12 row now split WP-12: core_00 needs
  ENG-10, core_17 needs no packet (a `defendOnly` 8-message shell).
- **R2_sonnet t3 (stale "checked on 2026-10-27" claim):** §1 softened to note the round-2 re-check on
  2026-10-28 and that lines need a quick re-check at point of use.

**Not fixed, with reason**
- **R2_sonnet m1 (E8 §16 defend-only bridge with no recipe; touches P9):** the live decision is whether to
  drop the defend-only bridge from E8 §16 or define its file name, `JOBS` key and skeleton; E8 §16 is the
  content fixer's. P9 is left as the authority for `eN-full` only; flagged here for the E8 fixer.
- **R2_sonnet B1 content side (core_17 message design), M1/M2 (E8 §8b/§9), m3/m6/m7/m8/m10/m12/m13, t1/t2;
  R2_content M-level items:** owned by the episode specs, `10`, `11`, `12`, `13`. The engine side of each is
  settled in `02`, which the content fixers align to; core_17's engine side (needs no packet) and P4's
  Anjali pointer are fixed above.

## Known items for round 3 (orchestrator)

1. The round 2 `02` fixer reclassified every new tell as local, including E8's `unexpected_sent_item`, `unrequested_reset` and `ransomware_note`. In round 1, E8 was written to author them as shared. Check that E8 and every other spec agree with the `02` tell table.
2. The E8 defend-only bridge (R2_sonnet m1) is still open. Either define it (the file, the run-suite JOBS entry and a skeleton), or drop it from E8 §16.
3. The E11 two-aim variant needs ENG-04 to write a global when `mistake` completes. Either add that, or confirm that E11 ships the one-aim design.
