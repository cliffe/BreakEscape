# Implementation handover: new awareness episodes E8 to E17

Start here after a context reset. This folder turns the awareness course plan into briefs that a Sonnet agent with a fresh context can carry out without asking questions. Every path, key and command in these files was checked against the repo on 2026-10-27. Where a brief and the code disagree, the code wins: stop and report the difference.

Read this file first, then `01_PIPELINE.md` (how a new episode is built), then the brief for your task.

## 1. Goal

Add ten new episodes, E8 to E17, to the built awareness product **Incident Simulations: Critical Cases**. Build them in the shape E1 to E7 already use: brief, attack (or a consequence sandbox), flip, defend, debrief. Each one also ships a defend-only shell, new check-form items and an entry in both seeded Hacktivity courses. Alongside the episodes, carry out three work packages: WP-12 (the core_00 first-play brief and the core_17 annual edition), WP-15 (the core_02 defend items for the missing channels) and WP-02 (the Hacktivity customer reporting route, as a list of pre-canned options).

The kind of game is the awareness product: short, education-first episodes for non-technical staff on a neutral corporate skin (`ui_theme: "general"`). It has no VMs, no combat, no spy framing and no runtime language model. Put this sentence in every writer's and reviewer's prompt (AGENTS.md, "Kinds of game").

## 2. What is built

In short (full detail in `../04_BUILT_SO_FAR.md` and `../../phishing_and_social_engineering/awareness/HANDOVER.md`):

- **38 scenarios on main.** These are seven hand-authored full episodes (`scenarios/awareness_e{1..7}_*`), seven generated defend-only shells (`*_defend`) and 24 generated check missions (`awareness_{pre,post}_{finance,hr,helpdesk,executive,general,mobile}_{ab,ba}`).
- **One frame.** Each scenario has one training room per company (`room_aw_brightwell`, `room_aw_tarrowby`, `room_aw_quayholt`, `room_aw_merrin_sallow`), a host NPC and a kiosk. The kiosk opens the episode runner (`public/break_escape/js/minigames/episode-runner/`). The runner steps through the stages in `STAGE_IDS` (`episode-model.js`): `brief`, `osint`, `build`, `write`, `mfa`, `flip`, `defend`, `debrief` and `check`.
- **Status.** Most stages are closed. Host character art waits for the PixelLab reset on 3 November. Human timing runs and the one facilitator guide come last. The current status block is at the top of HANDOVER.
- **How the files fit together.** This is HANDOVER §4: the fragments, the hand-authored full erbs, the generators, the parity test, the checks and the model routing. `01_PIPELINE.md` turns it into steps.

## 3. The user's decisions (2026-10-27, build review page) and the defaults taken

Copied from `WRITER_BRIEF.md`. Do not reopen them.

- **Go now:** E8 to E13 in that order, then E14 to E17; WP-12; WP-15; WP-02 as a list of pre-canned options.
- **Dropped:** WP-03, the engine-gaps package. Spy and Hacktivity branding does not matter here. Each small engine fix a specific episode needs is folded into that episode's engine work, for example the hard-coded "SECURE VIDEO LINK" label for E13, a real `#trigger_minigame` for E12, and Unicode names only if an episode needs them.
- **Later:** finishing E1 to E7 (waits on PixelLab), accessibility, role extensions and new roles, drills, and the kids game.
- **Companies:**

  | Episode | Company | Status in `BRAND_SET.md` |
  |---|---|---|
  | E8 after the click | Quayholt Insurance | in the set (E3, E5) |
  | E9 passwords | Tarrowby Logistics | in the set (E2, E6) |
  | E10 downloads and fake checks | Quayholt Insurance | in the set |
  | E11 misdirected data | Carrholme Services (new) | to add; reuses an existing room map with its own branding |
  | E12 visitor and tailgater | Merrin & Sallow Architects | in the set (E4) |
  | E13 AI assistant | Brightwell Foods | in the set (E1, E7) |
  | E14 social media | Merrin & Sallow Architects | named in `modules/core_12_social_media_and_oversharing/README.md` |
  | E15 shadow IT | Tarrowby Logistics | named in `modules/core_13_removable_media_cloud_and_shadow_it/README.md` |
  | E16 insider risk | Quayholt Insurance | named in `modules/core_14_insider_risk/README.md` |
  | E17 acceptable use | Marrowdale Facilities (new) | proposed in `modules/core_16_acceptable_use_and_your_responsibilities/README.md`; to add |

- **Shape:**
  - The consequence flip is used for E11 and for shadow IT (E15). E16's module design is also a consequence flip (`modules/core_14_insider_risk/game_design.md`). E17 is defend-only.
  - There is no tagline. The built rule of thumb is quoted word for word.
  - Every new episode ships a full version and a defend-only version, and joins both seeded Hacktivity courses (the defend-only course and the both-versions course).
  - **E17 default taken:** E17 has no attack half, so it ships one shell, `awareness_e17_<slug>_defend` (variant `defendOnly`), and that one shell joins both courses. The user can overrule this. A "full" E17 would then be the same shell with a consequence sandbox (ENG-04) added.
- **E12 notes from the user:**
  - In the attack half, the player's avatar is swapped for a hi-vis one to gain influence. It must be a costume that is given back afterwards, because aw9 says the chosen avatar always wins.
  - Carrying a package can be a PixelLab sprite state.
  - An NPC opening a door is a small addition, because NPCs can already trigger events and unlock doors.
  - E12 breaks the one-room, no-doors frame. It needs a lobby and a door, and an attack half played in the game world.
- **Defaults taken** (the user can overrule):
  - The six built role check forms are left exactly as they are, because they are the measured baseline.
  - New topics get new check forms. Do not edit the existing role forms.
  - Each episode is held to about 15 minutes: one attack artefact and a defend set of about six items, as in E1 and E2.
  - Pilot with E8 first. It is the only episode that nearly fits the existing runner stages, and it proves the new-episode pipeline end to end.

## 4. Work order

1. **E8 pilot.** Run the whole pipeline once (`01_PIPELINE.md`) with ENG-01. Write down every place where the pipeline was wrong, and fix `01_PIPELINE.md` before E9 starts.
2. **E9 with E10.** These are two episodes in parallel, each with its own engine packets (ENG-02, ENG-03a, ENG-03b) and ENG-09a, which both need.
3. **The consequence-flip stage.** ENG-04 is built once, then E11, E14, E15, E16 and E17 are written against it. E17 is defend-only and needs no sandbox. E14's module design uses the built `osint` and `write` stages, so it needs ENG-04 only if its brief adds a sandbox beat. It is scheduled in this wave because it shares the new defend card kinds (ENG-09a).
4. **E12.** It needs ENG-05a to ENG-05e and ENG-09c, plus host and costume art after the PixelLab reset. Build it after the consequence-flip wave, so that the riskiest engine work does not hold the others up.
5. **E13.** It needs ENG-06 and ENG-07.

**Alongside, at any point:** WP-12 (`11_WP12_FIRST_PLAY_AND_ANNUAL.md`), WP-15 (`12_WP15_CORE02_ITEMS.md`), the new check forms (`10_CHECK_FORMS.md`) and WP-02 (`13_WP02_REPORTING_ROUTE.md`). Episodes are pipelined, as in the AGENTS.md mission loop: one episode's playtests can run while the next is being written.

## 5. Dependencies

ENG ids are packets in `02_ENGINE_WORK.md`. P ids are steps in `01_PIPELINE.md`.

| Task | Needs first | Unblocks | Owner (see §6) |
|---|---|---|---|
| ENG-01 flip aftermath (victim's seat) | nothing | E8, E9 | engine |
| ENG-08 schema and validator | is written with each packet that adds a key | every packet's acceptance | engine |
| ENG-09a authored-choice triage kind | nothing | E9, E11, E14 to E17, check forms | engine |
| ENG-09b debrief panel list | nothing | E8 (two concept cards), and any episode with more than one panel | engine |
| ENG-09d shell-count and parity-list guards | nothing | every episode's P6 and P7 | engine |
| E8 | ENG-01, ENG-09b (if two panels), ENG-09d | proves `01_PIPELINE.md` | content, then playtest |
| ENG-02 password guessing stage | ENG-01 | E9 | engine |
| E9 | ENG-01, ENG-02, ENG-09a | - | content |
| ENG-03a triage page states | nothing | E10, check forms | engine |
| ENG-03b check-page builder | ENG-03a (shared render strings) | E10 attack half | engine |
| E10 | ENG-03a, ENG-03b | - | content |
| New brand rooms (P5b) | nothing | E11 (Carrholme), E17 (Marrowdale) | engine (room scripts) |
| ENG-04 consequence sandbox stage | ENG-09a (for the defend items only) | E11, E15, E16 (E14 optional) | engine |
| E11, E15, E16 | ENG-04, ENG-09a; E11 also P5b | - | content |
| E14 | ENG-09a | - | content |
| E17 (defend-only) | ENG-09a, P5b | - | content |
| ENG-05a world stage hand-off | nothing | E12 | engine |
| ENG-05b costume | ENG-05a | E12 | engine |
| ENG-05c lobby, door and NPC door opening | ENG-05a | E12 | engine plus content |
| ENG-05d package-carry sprite state | PixelLab reset (3 Nov) and the user's approval of art scope | E12 polish (E12 can ship a first pass without it) | art |
| ENG-05e real `#trigger_minigame` | nothing | E12 if its brief needs it | engine |
| ENG-09c in-person triage card | ENG-09a | E12 defend set, physical check items | engine |
| E12 | ENG-05a to ENG-05c, ENG-09c (ENG-05d and ENG-05e as its brief says) | - | content |
| ENG-06 authored assistant stage | ENG-01 (shares the flip part) | E13 | engine |
| ENG-07 video-call label | nothing | E13 | engine |
| E13 | ENG-06, ENG-07 | - | content |
| Check forms (`10_CHECK_FORMS.md`) | the card kinds their items use (ENG-03a, ENG-09a, ENG-09c) | post-checks for the new topics | content |
| WP-12, WP-15 | their own files | - | content |
| WP-02 | the user's explicit go-ahead for any Hacktivity edit | the debrief route box (aw1) | Hacktivity implementer |

## 6. Model routing

From AGENTS.md ("Choosing a model") and HANDOVER §4 ("Model routing"). Set `model` on every Agent call. A `general-purpose` agent launched without a model inherits Opus.

| Task type | Agent | Why |
|---|---|---|
| Episode content: fragments, full erb content, ink, defend items, debrief copy, check-form items | `opus48` agent type (launch with no `model` override) | HANDOVER §4: the default Opus safeguard over-flags phishing and social-engineering material |
| Content review: design review, dialogue review, script edit | `opus48`, fresh agent each round | as above |
| Engine packets in `02_ENGINE_WORK.md` | `general-purpose` with `model: "sonnet"` (each packet is sized for one Sonnet run) | AGENTS.md: well-specified implementation goes to Sonnet |
| Engine design questions a packet leaves open, or an engine review | `general-purpose` with `model: "opus"` | AGENTS.md: engine design is Opus work |
| Generators, room scripts, shell wiring, test-list edits | `general-purpose` with `model: "sonnet"` | mechanical, with exact checks |
| Browser playtests, persona and blind runs, and checking a "stuck" claim | Sonnet | HANDOVER §4; AGENTS.md "Verifying work" |
| Scripted bridge reruns and file searches | Haiku is acceptable for a rerun of a passing bridge; a Sonnet run confirms any failure before it counts | AGENTS.md |
| Hacktivity edits (course seeding, WP-02) | `general-purpose` with `model: "sonnet"`, working in the Hacktivity repo, and only after the user's go-ahead | public repo: feature level here |

If a safety classifier stops an `opus48` task, follow AGENTS.md: report the exact message and offer the user a `sonnet-cvp` or Haiku retry of the same task with the same prompt. Do not reword the task.

## 7. Global "do not" rules

- **Never run a generator into the repo.** Regenerate into a scratch folder, confirm that a no-change regeneration is byte-identical first, then copy in only the files that changed (`01_PIPELINE.md` §0).
- **Never run `git stash`, `git checkout -- <file>` or `git reset`.** Other agents share the tree. To compare with the last commit, use `git show HEAD:<path>`. To restore a file you churned, use `git show HEAD:<path> > <path>`. The orchestrator commits. Commits carry no attribution lines.
- **Do not edit the six built role check forms** (the `*_form_a` and `*_form_b` sets in `planning_notes/phishing_and_social_engineering/awareness/e*/defend.json` and the 24 check shells). New topics get new forms.
- **Do not change the rule of thumb.** Quote it word for word from `awareness_deploy.py` (`AWARENESS_RULE_OF_THUMB_TEXT`). No tagline.
- **Do not change E1 to E7 content** unless a packet says so and its acceptance check proves the existing shells are byte-identical or deliberately changed.
- **Do not break other games.** The triage, person-chat, mail-client, landing-page and door code is shared with `lab_social_engineering`, the `test_social_*` scenarios and the SAFETYNET missions (m02 uses video calls and NPC door unlocks). Every engine change is opt-in on a new key and keeps the old path unchanged when the key is absent.
- **No real brands. Use `.example` domains only. No working payloads, commands or tooling steps.** Attack content stays at the level of templates, pretexts and psychology. A "copied command" is described in words, never shown.
- **Hacktivity at feature level only** in this public repo: no internal file paths, endpoints, credentials or weaknesses. The implementer reads the Hacktivity code directly. No Hacktivity edit happens without the user's explicit go-ahead.
- **Playtests use the keyless server on :3001 only.** Never stop the user's server on :3000.
- **No TTS** unless the user asks. No printed variables in voiced lines.
- **No image generation** without the user's approval of the scope. PixelLab is preferred, after the reset on 3 November. Sprite hand edits go in `tools/pixellab_overrides/`, never straight onto `assets/characters/<key>.png`.
- **Do not edit `scripts/validate_scenario.rb`** without checking who else has it open. Social lints go in `scripts/validate_social/*.rb`.
- **Shared files** (`scripts/ink_runtime_check/missions.json`, `BRAND_SET.md`, `tools/playtest/se/run-suite.sh`, the parity and rule-of-thumb tests): edit only your own block, re-read the file just before editing, and never reformat the whole file.
- **Do not write a test that compares live content with HEAD.** Test against fixtures.
- **Style:** UK spelling, "cyber security" as two words, no em or en dashes, plain English, no effectiveness claims.

## 8. Standard checks (every commit)

Run these from the repo root (`/home/user/BreakEscape` here, `REPO` on the user's machine). Record the pass counts before you start, so that a drop is visible.

1. **Node tests (social and validator).** This is the CI job:

   ```
   bundle exec bin/test-js -j 4 test/js/validator-*.test.mjs test/js/social-*.test.mjs
   ```

   Expected: every file passes (HANDOVER recorded 1810 passing tests at hand-over). The validator tests spawn Ruby and need the `json-schema` gem, hence `bundle exec`. Without Bundler, `node --test test/js/social-*.test.mjs` runs the engine half alone.

2. **Parity and rule of thumb** (they are in the run above, but run them by name after any fragment or erb edit):

   ```
   node --test test/js/social-awareness-fragment-erb-parity.test.mjs test/js/social-awareness-rule-of-thumb.test.mjs
   ```

   Expected: one parity test per listed episode passes, and the shell-count test passes with the current total (see `01_PIPELINE.md` P6).

3. **Validator on every awareness shell:**

   ```
   for f in scenarios/awareness_*/scenario.json.erb; do
     bundle exec ruby scripts/validate_scenario.rb "$f" --strict-social --no-graph --skip-ink >/dev/null || echo "FAIL $f"
   done
   ```

   Expected: no `FAIL` line. `--no-graph --skip-ink` keeps the run from rewriting `dungeon_graph.*` and compiled ink. For a shell you own, also run it once without those flags, so that the ink compiles and the graph is refreshed.

4. **Ink** for each new or changed ink file: `./scripts/compile-ink.sh <scenario_dir_name>`, then `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/<scenario_dir_name>/` and `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json`. Expected: compiles clean, no unexplained lint finding, reopencheck passes with the new shells' entries in `missions.json`.

5. **Bridges, one at a time, on the keyless server on :3001 with Node 24:**

   ```
   tools/playtest/start-keyless-server.sh
   export NODE=$HOME/.cache/ms-playwright-go/1.57.0/node   # "$NODE" --version must print v24.x
   for b in e1-full e2-full e3-full e4-full e5-full e6-full e7-full p7-channels; do
     ONLY="$b" tools/playtest/se/run-suite.sh tmp/se-$b
   done
   ```

   Add each new episode's `eN-full` to the list once its bridge exists (`01_PIPELINE.md` P9). Expected: each run's `table.md` shows `PASS`. One retry is acceptable under heavy load. `run-suite.sh` makes a fresh game per bridge with `tools/playtest/new-game.rb` and scores it with `check-bridge.mjs --expect`. With `ONLY` set to one name it runs exactly one bridge. Node 24 at that path is the user's machine (HANDOVER §4). It is not present in every container, so confirm the version first.

6. **Engine commits also run** `bundle exec bin/test-js -j 4` (the whole suite), `bin/rails test`, the reopencheck above and the lab bridges `ONLY="6"`, `ONLY="r4-door"` and `ONLY="p7-episode"`, one at a time (AGENTS.md "Verifying work"). This proves the lab and the episode test scenario still work.

7. **Tree hygiene.** `git status --porcelain` shows only the files you meant to touch. Restore any `dungeon_graph.*` churn on files you do not own with `git show HEAD:<path> > <path>`.

## 9. Definition of done for an episode

An episode is done when all of these hold, with the evidence in its log:

- the fragments `planning_notes/phishing_and_social_engineering/awareness/eN/{attack,defend}.json` exist and the full erb matches them (the parity test lists the episode and passes);
- the full shell `scenarios/awareness_eN_<slug>/` and the defend-only shell `scenarios/awareness_eN_<slug>_defend/` exist, each with `scenario.json.erb`, `mission.json` and compiled ink. E17 has the defend-only shell only (§3);
- every check in §8 passes, with the new shells included;
- its `bridge-eN-full.jsonl` passes on :3001 and is listed in `run-suite.sh`;
- the episode's new check items are in their new forms (`10_CHECK_FORMS.md`) and those check shells validate;
- a design review and a dialogue review (opus48) end with no blocker or major open, and a Sonnet playtest of the full and defend-only shells (with one mid-episode reload) finds no blocker or major (`01_PIPELINE.md` P13);
- the brand-set entry, the host and any new cast are in `BRAND_SET.md`, with the name-clash search recorded;
- `missions.json` has entries for the new shells, and the new shells are listed for both seeded Hacktivity courses (the edit itself only with the user's go-ahead);
- the timing estimate is about 15 minutes for the full episode and about 8 for the defend-only shell, from an agent run, marked as an estimate;
- TTS is not done unless the user has asked. Host art is placeholder sprites until PixelLab.

## 10. Reporting progress

Use the AGENTS.md stage format ("Reporting progress by stage"), one block per track, in a fenced code block:

```
Stage             Progress    B/M/m open  Status
Engine packets    ██████░░░░  0/1/2       ENG-01 done; ENG-09a review running
E8 content        ████░░░░░░  0/0/3       cycle 2 of 5; dialogue review next
E8 playtest       ░░░░░░░░░░  -           after content
Check forms       ██░░░░░░░░  -           E8 items drafted
```

- The bar has ten blocks: cycles done out of planned, or a fair judgement.
- B/M/m counts open blockers, majors and minors from the latest review or playtest. Fixed but unconfirmed counts as open, with "fixing" in the status. Use `-` where no review has run.
- After the blocks, give a short table of the rounds done this session, a numbered "what's left" list and anything waiting on the user.
- Take the counts from the review files and logs, not from memory.
- Keep the course's resume note (`docs/agents/RESUME.md`, the awareness block) and the episode log up to date after every significant step.

## 11. Files in this folder

| File | What it holds |
|---|---|
| `WRITER_BRIEF.md` | the brief for the writers and reviewers of these files, and the user's decisions |
| `00_README.md` | this index |
| `01_PIPELINE.md` | the step-by-step new-episode pipeline, derived from how E1 to E7 were built |
| `02_ENGINE_WORK.md` | engine packets ENG-01 to ENG-09, each self-contained |
| `10_CHECK_FORMS.md` | the new check forms for the new topics |
| `11_WP12_FIRST_PLAY_AND_ANNUAL.md` | WP-12: the core_00 first-play brief and the core_17 annual edition |
| `12_WP15_CORE02_ITEMS.md` | WP-15: the core_02 defend items for the missing channels |
| `13_WP02_REPORTING_ROUTE.md` | WP-02: the Hacktivity customer reporting route, as pre-canned options |
| `episodes/E08_after_the_click.md` | E8 brief (Quayholt Insurance) |
| `episodes/E09_passwords.md` | E9 brief (Tarrowby Logistics) |
| `episodes/E10_downloads_and_fake_checks.md` | E10 brief (Quayholt Insurance) |
| `episodes/E11_misdirected_data.md` | E11 brief (Carrholme Services, consequence flip) |
| `episodes/E12_visitor_and_tailgater.md` | E12 brief (Merrin & Sallow Architects, world-play attack) |
| `episodes/E13_ai_assistant.md` | E13 brief (Brightwell Foods, authored assistant) |
| `episodes/E14_social_media.md` | E14 brief (Merrin & Sallow Architects) |
| `episodes/E15_shadow_it.md` | E15 brief (Tarrowby Logistics, consequence flip) |
| `episodes/E16_insider_risk.md` | E16 brief (Quayholt Insurance, consequence flip) |
| `episodes/E17_acceptable_use.md` | E17 brief (Marrowdale Facilities, defend-only) |

Scenario folder names and episode ids are fixed in each episode brief. Follow the built pattern: folder `awareness_eN_<slug>`, episode id `eN_<slug>`, defend-only id `eN_<slug>_defend`.
