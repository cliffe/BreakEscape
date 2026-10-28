# R1 review, lens: Sonnet dry run (E8 pilot, WP-02 light pass, E11 with ENG-04 light pass)

Reviewer stance: a fresh Sonnet implementer who has only these briefs. Read-only: no git, nothing edited outside this file. Scratch work was done under the session scratchpad only.

Severity scale is `WRITER_BRIEF.md`: B blocker, M major, m minor, t trivial.

## What I ran, and what I could not run

| Check | Result |
|---|---|
| `ls` of every path named in `00_README.md`, `01_PIPELINE.md`, `E08`, `10_CHECK_FORMS.md`, `13_WP02` | All exist, except the files the briefs say to create (`AW/e8/`, `gen_e8_e17_shells.py`, `checks_v2/`). |
| `node --test test/js/social-awareness-fragment-erb-parity.test.mjs test/js/social-awareness-rule-of-thumb.test.mjs` | 8 pass, 0 fail (Node v22.22.0). Works as `00_README` §8.2 says. |
| P0 no-change run of a scratch copy of `gen_e6_e7_shells.py` (REPO patched, `python3 -I`) | Works. Byte-identical to the repo for all 6 shells it writes, so the P0 recipe is sound for a *built* generator. |
| `python3 AW/training_room.py quayholt_insurance` | Works; prints `scenario.lighting`, `startPosition`, `host.position`, `rooms.training_room`. |
| `bundle exec ruby scripts/validate_scenario.rb ...` | **Cannot run here.** `Bundler::GemNotFound` (rails, json-schema and ~60 gems missing). Plain `ruby` stops with "json-schema gem is required". So `--strict-social`, the validator tests and `bin/rails test` are unverifiable in this container. |
| `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json` | Runs (about 2.5 min) but **exits 1 with "Total problems: 4"** on the untouched tree (four `m09_digital_archaeology` phone NPCs). See M6. |
| Bridges (`run-suite.sh`) | **Cannot run here.** `$HOME/.cache/ms-playwright-go/1.57.0/node` is absent; Node is v22.22.0, not 24. `00_README` §8.5 does warn about this. |
| `bin/inklecate`, `scripts/compile-ink.sh` | Present (ELF binary). I did not compile into the repo. |
| `dialoguelint.mjs scenarios/awareness_e5_signin_pages/` | Works. |

## Findings

### B1. E8 check-form items have no workable home (three instructions that cannot all be followed)

- **Files and sections:** `episodes/E08_after_the_click.md` §14; `10_CHECK_FORMS.md` "Recommendation", "Item list: general_v2", "Depends on", "Do not"; `00_README.md` §7.
- **What I would have had to guess:** where E8's check items live.
  - E8 §14 says E8 feeds "the general check-form pair ... `general_form_a`/`general_form_b`" and must supply "an unrequested-reset item and its genuine-IT-notice mirror; a sent-items-you-did-not-write item and an ordinary-sent-item mirror". It says they land "in the general forms or a new topic form".
  - `00_README` §7 and `10` both forbid editing the six built role forms, and `general` is one of the six. So the first reading is out.
  - `10` puts E8's topic in a new pair, `general_v2`. Its ten items contain only `gva_report_thanks / gvb_report_closed` (item 1) and `gva_guide_ack / gvb_survey_real` (item 9) for core_04. Neither is a reset or sent-item item. There is no slot for E8's items.
  - `10` also says "Every scored flag below is an existing id in the `00` library" and "Do not invent flag ids". E8's reset and sent-item items score on `unrequested_reset` and `unexpected_sent_item`, which are not in the library (`CHANNEL_TELLS` in `systems/phish-rules.js` has 12 ids, none of them these). Using them needs ENG-08 shared-list additions (see M2), which `10` says it does not need.
- **Evidence:** `10` lines 45 to 48 and 335 to 336; E8 lines 193; `phish-rules.js` lines 52 to 65.
- **Fix:** pick one. Recommended: add two E8 rows to `general_v2` (replace item 9 and one genuine item, keeping the 5/4/1 difficulty mix and the flag multiset), name their ids, and state that `unrequested_reset` and `unexpected_sent_item` are promoted to the shared list by ENG-08 *because* two sets use them. Then rewrite E8 §14 to point at those rows by id and delete "or a new topic form". Update `10` "Depends on" to say it needs the ENG-08 tell additions.

### B2. E8 §10 asks ENG-01 for keys ENG-01 does not define, and the schema would reject them

- **Files and sections:** `E08` §10, §20 Q2; `02_ENGINE_WORK.md` ENG-01 "Change", ENG-08 "New episode keys"; `scripts/scenario-schema.json` `socialAwarenessEpisode.strings`.
- **What I would have had to guess:** the whole flip configuration. Three readings, none confirmed.
  - E8 §10 proposes `awarenessEpisode.flip = { variant: "becomeVictim", victimTarget, firstSign }` and a `strings.becomeVictimIntro`. It says "ENG-01 defines its exact key".
  - ENG-01 defines something different: `awarenessEpisode.flipAftermath = { heading, intro, items[], line }` and `awarenessEpisode.stepLabels`. It has no `variant`, no `victimTarget`, no `firstSign`, and it does not re-seat the learner. Its items are inline data, not a pointer to a defend-set message.
  - ENG-08 (the schema list) names `flip` as `{ mode }` for ENG-04 and does not list `flipAftermath` or `stepLabels` at all, although ENG-01 says "ENG-08 adds the schema entries in the same change".
  - `strings` is `additionalProperties: false` in the schema (20 listed keys; I checked), so `strings.becomeVictimIntro` fails `--strict-social` even if ENG-01 ships. Even if it were allowed, the parity test would report "present only in the erb (not allow-listed)" or "only in the fragment".
- **Also unprovided:** E8 never writes the `flipAftermath.items` (id, `folder: "sent"`, `to`, `subject`, `time`, `note`) or `line`, which ENG-01 needs. E8 §10 only says `firstSign` names the defend message `e8_sent_invoice`, which ENG-01 cannot do. Nor does E8 give a heading or intro for the aftermath (its `flipHeading` "Now it lands on you" belongs to the older flip).
- **This is README-known item 1** in `REVIEW_LOG.md`, confirmed.
- **Fix:** rewrite E8 §10 to use `flipAftermath` and `stepLabels` only. Quote the full block for E8 (heading, intro, one `email` item with `folder: "sent"`, one `push` item if wanted, `line`). Delete `flip.variant`, `victimTarget`, `firstSign`, `becomeVictimIntro` and the "now you are Ayaan" re-seat (or give ENG-01 an explicit re-seat requirement). Add `flipAftermath` and `stepLabels` to ENG-08's "New episode keys" list. Say where the block lives in the fragments (see m6).

### M1. P0 and P4 contradict each other on `REPO`; a new generator run from the scratch copy reads the wrong tree

- **Files and sections:** `01_PIPELINE.md` P0 steps 1, 2, 6 and P4 "Differences from the template".
- **Guess:** P4 says the new generator derives `REPO = str(Path(__file__).resolve().parents[3])`, "so it needs no patching". P0 says to run every generator from `SCRATCH/tools/`. In the scratch copy, `parents[3]` is a scratchpad folder, not the checkout (path `.../scratchpad/e8-wiring/tools/gen.py` gives `parents[3]` = the session folder). It would then fail to find `AW/e8/defend.json`. From `AW/` it resolves correctly (`/home/user/BreakEscape`), so the two steps cannot both be followed literally.
- **Evidence:** `gen_e6_e7_shells.py` line 30 hard-codes `REPO`; P4 lines 120 to 121.
- **Fix:** have the generator accept `BREAKESCAPE_REPO` from the environment (falling back to `parents[3]`), and say P0 step 2 for the new script is "export `BREAKESCAPE_REPO=<checkout>`, no source edit". Or have it take `--repo`.

### M2. E8's three new tells are not assigned in ENG-08, and E8 hedges three ways

- **Files and sections:** `E08` §3, §11 (tells paragraph), §20 Q3; `02_ENGINE_WORK.md` ENG-08 "New tells" table.
- **Guess:** are `unexpected_sent_item`, `unrequested_reset`, `ransomware_note` shared or scenario-local?
  - E08 §3 says maybe ENG-08 "to register the three new ids"; §11 says add to the shared library, "or" author in-scenario "and flag the choice"; §20 Q3 says shared is better for `ransomware_note`.
  - ENG-08's rule: a tell used by two or more sets is shared. Its table lists every new tell for E9 to E13 and does not list E8's three. By its own rule, the reset and sent-item tells are used by an E8 set and a check-form item, so they are shared.
  - Whichever is chosen, E08 gives one string per tell ("canonical string"). For a local tell the set needs a `flagChips` label *and* a `factorStrings.<id>.redFlag` sentence on every message that flags it (ENG-08 lines 580 to 582). For a shared tell the sentence goes in `CHANNEL_TELLS` in two files. E08 does not say which role its string plays.
- **Evidence:** `triage.rb` lines 38 to 41 (12 ids, none of the three); ENG-08 lines 584 to 599.
- **Fix:** add the three ids to ENG-08's table as **shared** (reason: E8 defend set plus `general_v2`), append-only, with the exact sentence from E08 §11. Add `perFlagNote` text per item to E08 so the "reason" column is also the `perFlagNote`. Delete the "if the validator will accept" paragraph.

### M3. ENG-09b leaves the key name open, and E8 does not say where the two concept cards sit

- **Files and sections:** `02_ENGINE_WORK.md` ENG-09b "Change"; `00_README.md` §5 row "E8"; `E08` §12 items 2 and 3.
- **Guess:** ENG-09b says "an array of `{heading?, text}` for `strings.conceptPanel` (or a new `strings.conceptPanels`)". E8 needs to write one of them. README makes ENG-09b a prerequisite only "(if two panels)", and E8 has two. Also: the two cards are full-episode and defend-only relevant; `conceptPanel` is exempt in `STRINGS_VALUE_EXEMPT` and `STRINGS_ERB_ONLY_OK`, but `defend_only()` copies `EP['strings']` wholesale, so if the cards sit in the fragment they appear in the defend-only shell too. E8 does not say if they should.
- **Fix:** ENG-09b: decide "array form of `conceptPanel`" and delete the alternative. README row: "ENG-09b (required)". E08 §12/§13: say the two cards go in `defend.json` `strings.conceptPanel` (shared, shown in both shells) or erb-only, and quote the final JSON.

### M4. E8 never supplies the shell metadata and defend-only text the generator and the erb need

- **Files and sections:** `E08` §8, §13, §15; `01_PIPELINE.md` P2, P4; `gen_e6_e7_shells.py` `EPISODES['e6']['defend']`, `defend_only()`, `LINES`.
- **Guess:** the generator reads, per episode: `name`, `brief`, `endGoal`, `aim` (id, title, description), `task` (id, title), `kiosk` (two observation strings), `display`, `desc`, `minutes`, `defendIntro`, `conclusion` (title, body), plus `LINES[(eN,'defend')]` (before, after, choice, reply) and a `HOSTS` entry. E08 gives none of these for the defend-only shell (only the brief and scope note). For the full erb, P2 needs the two aims' ids, titles and descriptions, the first task's title, the conclusion screen, the kiosk `observations` and the `observationVariants` text, and the mission `description`. E08 names only one task id (`send_takeover_phish`), not the conclusion task id, either aim id, nor the `display_name`. `strings.noBlameLine`, `defendIntro`, the flip lines "in the E5 voice" and the hub welcome lines for the "done" and "sent" states are also left to the implementer. `flipNoSend`, `flipMissed`, `flipMissedHeading` and `flipLandedNoTells` are described, not written.
- **Fix:** add an E08 "§8b metadata" table with every one of those fields as final JSON strings, and write out the flip strings. If the intent is that the `opus48` content writer authors them (P1), say so in E08 §4 and make "P1 content complete" an explicit gate before a Sonnet starts P2 to P9.

### M5. E8 §15 names the wrong tool for course seeding, and no brief says where the Hacktivity repo is

- **Files and sections:** `E08` §4, §15 (bullet "The two seeded Hacktivity courses"); `01_PIPELINE.md` P12; `00_README.md` §5 last row.
- **Guess:** E08 says add E8 to the courses "through the built deploy path (`awareness_deploy.py`), not by hand-editing Hacktivity". I opened `awareness_deploy.py`: it holds only `AWARENESS_RULE_OF_THUMB_TEXT`, the heading and `awareness_block()`. It has no course logic. P12 says the opposite: do it in Hacktivity, copying how E6 and E7 were seeded. `13_WP02` also says "do not touch `awareness_deploy.py`". Neither P12 nor 13 names the Hacktivity repository (owner/name), only "the Hacktivity repository" and a short commit id in HANDOVER (`f8b4ad9e`), so a fresh implementer cannot tell which repo to attach with `add_repo`.
- **Fix:** delete the `awareness_deploy.py` clause from E08 §15 and replace it with "see P12". In P12 and 13 add one line giving the repo's `owner/name` (this is not an internal path), and say the implementer attaches it before starting.

### M6. `00_README` §8 "Expected: reopencheck passes" is false on the current tree; and §8 has no fallback when Bundler is missing

- **Files and sections:** `00_README.md` §8 steps 1, 3, 4; `01_PIPELINE.md` P3.
- **Evidence:** I ran `reopencheck.mjs missions.json` on the untouched tree. It prints "Total problems: 4" and exits 1 (the four are `m09_digital_archaeology` phone NPCs: recruiter, nightshade_phone, torres_phone, gary_phone). So a Sonnet who runs the standard check after E8 sees a red result unrelated to its work, with no way to know that. Also it takes about 150 s, past the default 120 s tool timeout. `bundle exec` fails here (gems not installed) and `ruby scripts/validate_scenario.rb` without Bundler says it needs `json-schema`.
- **Fix:** record the baseline in §8 ("on 2026-10-27 the baseline is N problems in m09; compare, do not expect zero") or fix m09 first. Add the run time. Add "if `bundle exec` fails, `gem install json-schema` and run `ruby scripts/validate_scenario.rb` directly; if even that fails stop and report".

### M7. E8 defend items use verdict words and a card kind the engine does not have

- **Files and sections:** `E08` §11 items table rows 1, 3, 5; §20 Q5.
- **Guess:**
  - Row 1 is "email (in Sent)" from "You". The email kind has no sent-folder rendering. `playerSent` is a different kind (the learner's own sent record, validator requires `targetId` and a set-level `playerSentAuth`), so using it would be wrong. Do I use `kind: "email"` with `from: {name: "You"...}`, and what does `auth` say?
  - Row 3 verdict is "Deny and report". That is a push *action* (`deny_report`, scoring as Report). Row 5 verdict is "Report and leave it". There is no such action; the verdicts are Trust, Report, Delete, Verify. The brief never says "score as Report".
  - Row 5 kind is "page/notice". The `page` kind reads `rec.page`; E08 gives no page fields (title, host, body) and says "No ransom amount, no countdown, no pay button".
  - Row 4 says "Report ... is the scored move" on a genuine item. Under the awareness profile a genuine item gets full marks for Trust or Report (`triage-scoring.js` "Report is full marks under awareness"), so the sentence is wrong, and the learner can still pass by trusting it.
  - Rows 2, 6, 7 have no body text, `auth` block or `time`. Only the reason column is written.
- **Fix:** add a column "engine verdict" (Report, Report, Report (deny_report), Report, Report, Trust or Verify, Trust) and a column "kind". Give the sent-items row's exact shape, and the page row's `page` object. Reword row 4. Provide one worked JSON message per kind, or point to the exact built message to copy (`e3_push_early` for row 3 is already named).

### M8. P2/E8 disagree on which built episode to copy; host ink source differs too

- **Files and sections:** `01_PIPELINE.md` P2 table row 1 and P3 bullet 1; `E08` §2, §7, §8, §15.
- **Guess:** P2 says a mail write (E8) copies `awareness_e1_invoice_fraud`. E08 §7 says the stage list equals E1's, but §15 says "wired like `awareness_e5_signin_pages`", §8 says the host ink follows "the E5 `niamh_doherty.ink` pattern", and §9 says copy E5's templates, targets and `eventMappings`. P3 says copy `adaeze_okafor.ink`. E5 has `build`, `landingPageId`, `se_landing_pages` and `landing_*` globals, `conceptCards`, `landingPages`; copying E5 wholesale would carry those and the validator warns (`attack.landingPageId` / `build`). The two ink files are structurally identical, so that part is harmless, but the shell is not.
- **Fix:** E08 §15: "copy E1 for the frame (P2) and take only the Quayholt names, sites and templates from E5". Delete "wired like E5". Say the ink is E1's structure with E5's company text (or either).

### M9. E8 §9 under-specifies the attack fragment (OSINT pages, contacts, kit, auth)

- **Files and sections:** `E08` §9; `AW/e5/attack.json`.
- **Guess:** E08 says "reuse the E5 sites" but E5's `quayholt_site` has Hana's `blk_staff` and a `blk_sso` block whose `fact` is `quayholt_sso_portal`; E8's four facts do not include `quayholt_sso_portal`, so copying E5's site unchanged leaves a dangling fact reference. E8 gives `blk_staff` for Ayaan but not the block (role, address, `fact`), nor the social profile (`post_ayaan` text and its `fact` link: E5's only post has no `fact`; E1's does). `mailClient.contacts` needs `ayaan` with `revealedBy: se_intel_quayholt_staff_claims` and `targetId: takeover_victim`; `payloadKit` (E5 has `kit_sso_page`) must be dropped (E8 says no link) and the `analyst@quayholt.example` account kept. `phishTarget`: E5 has `senderAuth` and `expectedLink`; E8 says "drop the link factor" but not those two keys (E1 has neither). `quayholt_staff_claims` exists in E5 as Hana's fact with the same id and different text; E8 reuses the id for Ayaan (fine in a separate scenario, but unstated). `reduceNote` is supplied "verbatim from E5" for two facts but not for the other two. Calm pretext urgency: E5 `medium`, E8 `low`.
- **Fix:** include a full `attack.json` skeleton in E08 (or a diff against E5 listing each line to drop, change or add), including the two `reduceNote`s and the post text.

### M10. ENG-04/ENG-08 do not relax `attack_checks`, so a consequence-flip full episode (E11, E15, E16) cannot validate

- **Files and sections:** `02_ENGINE_WORK.md` ENG-04 "Change" 4 and ENG-08 "New stage ids"; `E11` §10a, §15; `scripts/validate_social/awareness.rb` line 53.
- **Evidence:** `issues.concat(attack_checks(ctx, ep)) if full?(ep)`. `attack_checks` errors "a full episode needs an attack block (target, siteIds, accountIds)" and demands `maxMessages 1`, `scored false`, a real `phishTargets` target. E11 §9 says "no attack half and no 04 phish target", and `defendOnly`-only lints are all ENG-04/08 lists. Neither packet lists "skip `attack_checks` when the stage list has no `osint` or `write`".
- **Fix:** add to ENG-04 Change 4: "`attack_checks` runs only when `stages` includes `osint` or `write`; for a `mistake` episode the `attack` block must be absent (lint)". Also add the lint "`mistake` present when stages includes `mistake`" from E11 §10a, which ENG-04's own lint list omits.

### M11. E11 puts `flipHeading` erb-only; the parity test allows only `flipMontageByChoice`

- **Files and sections:** `E11` §10 last paragraph and §10a; `02_ENGINE_WORK.md` ENG-04/ENG-09d; `test/js/social-awareness-fragment-erb-parity.test.mjs` `STRINGS_ERB_ONLY_OK`.
- **Evidence:** the test allows erb-only for `conceptPanel, flipCallIntro, flipPageIntro, voicePanel, defendIntro, flipDefenderLineByChoice` and adds `flipMontageByChoice` per ENG-04. `flipHeading` is not allowed erb-only. E11 declares `flipHeading` "erb-only (not in the fragment)". The test would report `strings.flipHeading present only in the erb (not allow-listed)`. Same for any other flip string E11 leaves out of its fragment. (E8 puts them in the fragment, which parity accepts.)
- **Fix:** E11: keep `flipHeading` in `defend.json` `strings` (the generator already pops it for the defend-only shell). Say so. Or add `flipHeading` to the allow-list, with a reason, in ENG-04/ENG-09d.

### M12. E11 and P5b disagree on how much room work "Carrholme" needs

- **Files and sections:** `E11` §5 "Room", §15 last bullet, §20 third bullet; `01_PIPELINE.md` P5b steps 1 to 9.
- **Guess:** E11 says reskin an existing map, "register ... in `training_room.py`, `apply_training_room.py`; do not hand-draw a new map", and lists which map to clone as an open question. P5b requires a new tileset sheet (`make_aw_tileset.py`), logo and poster props (`make_aw_props.py`), a new `COMPANY_OPS` list in `build_aw_rooms.py`, `game.js` preload lines, a schema enum entry, a `generate_rooms.py` comment, a lighting entry and `ROOMS`. P5b step 9 says `apply_training_room.py` needs nothing. E11 also does not give the accent hex for the tileset (it does: `#4a6b57` in its BRAND_SET table) or the two-line wordmark rules. E11's "do not hand-draw" and P5b's new PNGs conflict in effort and in which files the implementer touches.
- **Fix:** E11 §5 and §15: "follow P5b exactly"; delete the `apply_training_room.py` mention and the open question; add `carrholme` accent and wordmark pair to the P5b inputs.

### M13. E11 §14 builds a `data_form_a/b` pair; `10_CHECK_FORMS.md` builds `data_conduct`, with different ids and size

- **Files and sections:** `E11` §14, §15; `10_CHECK_FORMS.md` "Item list: data_conduct"; `REVIEW_LOG.md` item 6.
- **Evidence:** E11 names `data_form_a/b`, ids `da_*` / `db_*`, six rows, and shells `awareness_pre_data_ab` etc. 10 names `data_conduct_form_a/b`, ids `dca_*` / `dcb_*`, ten rows, shells `awareness_pre_data_conduct_ab` etc., one separate generator `gen_checks_v2_shells.py`. 01 P4 says check shells come from `gen_e8_e17_shells.py` (`forms`, `check_hosts`, `check` fields). So there are two generators and two form names for the same shells. E11 also adds a `mistake.json` fragment, a shape P1 does not define (P1 says an engine packet gives the fragment shape; ENG-04 gives none).
- **Fix:** adopt `10`'s scheme in E11 §14/§15 and P4 (one check generator, say which). State E11's contribution as specific `dca_*`/`dcb_*` rows of `10`. Give ENG-04 a fragment shape for the `mistake` block, or say it goes in `defend.json` under `awarenessEpisode.mistake`.

### m1. E8 cast facts are partly wrong or unsupported

- **Files and sections:** `E08` §5, §11 rows 1 and 4.
- Evidence:
  - E08 says Ayaan is "named in BRAND_SET" and the "genuine caller `ha_vm_locked`". `BRAND_SET.md` has no Ayaan line; Ayaan is only in `AW/e5/defend.json` `_brandAdditions` and `AW/e3/defend.json`. `ha_vm_locked` is Hana Novak; Ayaan's is `hb_vm_locked`.
  - E08 says Ayaan is "the colleague fooled in the E5 flip line". The E5 erb flip line names Hana Novak, not Ayaan (the `_brandAdditions` note is stale). So the "avoid phishing Hana twice" reasoning rests on a wrong premise.
  - Row 1's client address `claims-client@ashcombelaw.example`: `e5/defend.json` says Ashcombe Solicitors is "a firm Quayholt staff have no matter with", which contradicts a claims client.
  - Row 4: Reuben Ofori is the helpdesk-form-B voicemail caller (ext 4423), "claims handler". Reuse in E8 is fine but unstated.
- **Fix:** correct the two ids and the "fooled" sentence; use a new `.example` domain for the client or confirm Ashcombe; note Reuben's earlier role.

### m2. E8 `channelTells` lists a tell no item uses

- `E08` §11: `channelTells` includes `lookalike_domain`, but no row's flags use it (rows use `unexpected_sent_item`, `secrecy_or_bypass`, `unrequested_reset`, `unrequested_mfa_push`, `ransomware_note`). The validator may warn on an offered-but-unused chip. **Fix:** remove it, or add the item that scores it.

### m3. P4 says the defend-only shell "drops the flip strings"; the generator drops only seven keys

- `01_PIPELINE.md` P4 vs `gen_e6_e7_shells.py` lines 357 to 360: it pops `flipHeading, flipIntro, flipDefenderLine, flipNoSend, flipMissed, flipPageIntro, flipCallIntro` only. `flipMissedHeading` and `flipLandedNoTells` stay. E08 §13 ("the flip strings are simply never shown") is not the same as "dropped". **Fix:** list the exact keys in P4, or add the two to the pop list in the new generator and say so.

### m4. P7: ENG-09d "widens `n`" versus "works as is"

- `01_PIPELINE.md` P7 says "ENG-09d widens `n` to cover E10 to E17. It works as is, because `e${n}` gives `e10`." Both cannot be the instruction. ENG-09d's own "Change" is also vague ("a count assertion that fails if a new shell is not registered") and does not say what replaces the bare `38`. **Fix:** one sentence in P6/P7 saying which test lines change; give ENG-09d the concrete new assertion.

### m5. P9 and E08 §16: the defend-only bridge has no recipe

- E08 §16 says add "a defend-only bridge". P9 covers `bridge-eN-full.jsonl` only; `run-suite.sh` `JOBS` has only `*-full` entries and no defend-only entry exists for E1 to E7. README §9 requires a Sonnet playtest of the defend-only shell but not a bridge. **Fix:** either drop the defend-only bridge from E08 §16 or define its filename, JOBS key and skeleton in P9. Also the E08 bridge outline says "Report the five phish/sign items" but the set has four phish or sign rows (1, 2, 3, 5) plus a genuine-report row 4; state the exact verdict plan as `[messageId, verdict, flags]`.

### m6. Where `flipAftermath` lives in the fragments is unspecified

- `01_PIPELINE.md` P1/P2, `ENG-01`, `E08` §15. `flipAftermath` is episode-level (not in `strings`), so `defend.json` `awarenessEpisode` is the only fragment home and the generator's `defend_only()` builds `ep` from named fields (so it will not copy it). Nobody says "put it in `defend.json` `awarenessEpisode.flipAftermath`, erb only copy". Parity does not compare it. **Fix:** one line in P1 and E08 §15.

### m7. P5a prints only part of `rooms.training_room`

- `01_PIPELINE.md` P5a: `training_room.py` prints `type`, `chatBackground`, `lighting`. The E5 room also has `door_sign: "Training Room"` and `connections: {}`; neither is mentioned. **Fix:** list them in P2, or say "copy the room's remaining keys from E5".

### m8. Host sprite keys for Anjali Rao are not given

- P2 lists `spriteSheet`, `spriteTalk`, `spriteVisemes` for the host; E08 §5 gives none. Anjali already hosts the helpdesk checks with `spriteSheet: "female_scientist_v2"` (`awareness_pre_helpdesk_ab`). **Fix:** E08 §5: state the three paths or "copy from `awareness_pre_helpdesk_ab` npcs[0]". Also `10` §Hosts says to reuse sprite keys from `gen_e3_e5_shells.py`.

### m9. `10_CHECK_FORMS.md` internal faults

- "(01 to 09 in this folder)" points at files that are in `episodes/` as `E08` to `E17`.
- The example `PERMUTE` arrays are not disjoint: with phish at original indices 1, 3, 5, 7, `[2,0,1,4,3,6,5,9,7,8]` puts phish in slots {2,4,6,8} and `[7,3,0,6,1,8,5,2,9,4]` in {0,1,4,6}; slots 4 and 6 collide. The brief does say to run the check and adjust, but an example that fails the rule it demonstrates invites copying.
- "No engine packet is required" conflicts with `00_README` §5 (Check forms need ENG-03a, ENG-09a, ENG-09c), and with item 2 (a `page` card with a "Verify you are human" look-alike, which ENG-03a states for E10) and item 4 (a push, built). **Fix:** correct the references, give a verified disjoint pair, align the dependency statement.

### m10. E8 §11 `flipDefenderLine` contradicts itself

- Draft says the service desk's own address was on the email and "the one thing that gave it away was the sender's real address". But the premise is that the From was forged to carry the real desk address. Reads as a learner-facing error. **Fix:** "the one thing that gave it away was where the sign-in link actually went" is not available either (E8 has no link), so give the actual tell (the service desk never sends sign-in requests by email).

### t1. `BRAND_SET.md` §7 says defend-only `strings` is "closed to the eight pinned keys"

- E08 §13 cites it. The schema's `strings` lists 20 keys, and the generator copies more. The statement is stale; no action needed beyond not relying on "eight".

### t2. `00_README` §1 and each brief say every path and key "was checked on 2026-10-27"

- Several were not (m1, M5 `awareness_deploy.py`, M6 reopencheck). Soften or re-date after fixes.

### t3. `13_WP02` line 208: "`</script>` escaped as `</script>`"

- The two strings are identical; the escape form (probably `</script>`) was lost. Also "all fourteen built full and defend-only episodes" (line 119) goes stale as soon as E8 lands.

## Lighter pass: 13_WP02_REPORTING_ROUTE.md (as the Hacktivity implementer)

Everything Break Escape side checks out: `Configuration#awareness_settings`, `break_escape_awareness_config`, `be_plain`, `AWARENESS_TEXT_MAX 600`, `AWARENESS_HEADING_MAX 80`, `AWARENESS_INVISIBLE`, the view lines 216 and 239, `GENERIC_REPORT_ROUTE`, `REPORT_ROUTE_SLOT`, `reportRouteFor`, `textBox` at line 279, `awareness_config_test.rb`, the `aw1` test titles and the `host()`, `set()`, `slotEpisode` helpers in `test/js/social-fun-engine.test.mjs`, `README_scenario_design.md` line 3089, `npm run test:social`, and the DECISIONS_PENDING row. The seeded default composes to 180 characters (checked by hand). Step 8's test is writeable as given.

What I would have to guess or choose:

- **Which repository** (M5). Hacktivity is never named by owner/name. I would have to ask.
- **Step 1 depends on an "earlier, uncommitted pass"** that may or may not be in the checkout; the brief handles both cases, which is good, but "start fresh, following the same shape" leaves the storage shape open ("one structured settings value"), which is acceptable at feature level.
- **No-JS form:** "show all seven options as checkboxes with their blanks and an order number" while the rule is "at most four options". It does not say how a fifth checkbox is refused, or how order numbers are validated (duplicates, gaps). Minor.
- **Contradiction with E8 §15:** this brief says not to touch `awareness_deploy.py`; E8 tells the implementer to use it for seeding (M5).
- **Step 7 vs P12:** WP-02 seeds a route default on the two existing courses; P12 adds each new episode to those courses. Compatible, but nothing says which runs first or that the one-off task must also cover courses that gain E8 later. Minor.
- Item t3 above.

No Hacktivity paths or internals appear in this review.

## Lighter pass: E11_misdirected_data.md with ENG-04

Covered in M10 to M13, and:

- **m11.** ENG-04 states the chosen option goes "into `episode_<id>_state` ... and ... a parallel `mistakeChoices` field cleared the same way", and E11 §10a says it goes into the state "where the built `write` stage keeps its sent-template id". `completeStage` accepts only `sent` and `defend` patch keys and `readState` is the filter, so a new field must be added to `readState`/`completeStage` (ENG-04 implies it but never names `readState`). Name the functions.
- **m12.** E11 §9 names a caller "Carol" ("Carol rings") who is not in the §5 cast table; Add Carol to the screen-only list (Pauline Grant, Albert Finch, Lee Corrigan and Marcus Webb are already there; "DC Hendry" is a caller name only in the item table).
- **m13.** ENG-04 montage lookup says "the learner's own option when it has a line, else the beat's unsafe option"; E11 supplies a line for *both* options of every beat, so the fallback never fires, and the "Your choice" / "the version where ..." framing is hard-coded in the strings (so the engine does no framing). E11 §10 says the option taken "is framed 'Your choice'"; that reads as engine behaviour. Say it is text.
- **E11 §11:** the item set is internally consistent (6 items, one mirror pair, flags drawn from the library, genuine `Report` accepted as full marks). The "known limitation" paragraph is accurate against `triage-scoring.js`.
- **E11 name clash** (Tomasz vs Tomás Carvalho) is flagged by the writer but left unresolved; the orchestrator should decide before ship (known issue 9).

## Summary counts

| Severity | Count |
|---|---|
| B | 2 |
| M | 13 |
| m | 13 (m1 to m13) |
| t | 3 |

## Verdict

**not clean**

Could I start E8 tomorrow with these briefs alone? **No**: the engine side (ENG-01 vs E8 §10) and the check-form side (E8 §14 vs `10_CHECK_FORMS.md`) contradict each other, and the shell, defend-only and fragment content I would need to write is not all supplied; the defend-only shell and its ink could be started now, the full variant could not.
