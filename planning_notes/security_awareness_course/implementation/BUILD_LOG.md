# Build log: awareness episodes E8 to E20 and the work packages

Started 2026-10-29. Orchestrator: Opus 5.5. Plan: `00_README.md` (work order §4, routing §6, checks §8, done §9). One section per wave; every review round gets a severity table; every decision a line with its reason.

## Routing

- Engine packets (`02_ENGINE_WORK.md`): `general-purpose` Sonnet, each in its own git worktree, merged by the orchestrator. Bridges run on main after the merge (the keyless :3001 server serves the main tree, not a worktree).
- Content (fragments, erb content, ink, items, debrief copy) and content reviews: `opus48`.
- Wiring (P2 skeleton, P4 to P12): Sonnet. Scripted bridge reruns and searches: Haiku; a Sonnet run confirms any failure.
- Review phases after each episode builds, as the built product ran them: design review C1+ (`scenario-design-review`), dialogue review C1+ (`npc-dialog-review`), playtests (Sonnet personas, reload, blind), light puzzle-chain pass where gating changed, rooms/lighting/POV for new rooms only. Fresh reviewer each round; fixer resumed; stop when a round finds nothing above minor (at least 3 rounds, at most 5).

## Wave 1 (2026-10-29)

| Agent | Model | Work | Files it owns |
|---|---|---|---|
| eng-a | Sonnet, worktree | ENG-01, ENG-09b, ENG-09d (+ their ENG-08 rows) | episode runner, debrief, guards |
| eng-b | Sonnet, worktree | ENG-03a, ENG-03b (+ ENG-08 rows) | triage page states, landing-page builder fakeCheck |
| eng-c | Sonnet, worktree | ENG-04 (+ ENG-08 rows) | consequence `mistake` stage, montage flip |
| eng-d | Sonnet, worktree | ENG-09a, ENG-11 (+ ENG-08 rows) | triage `choice` kind, sort drill overlay |
| content-e8 | opus48 | E8 P1 fragments, host ink, full-erb content | `AW/e8/`, E8 ink |
| content-checks | opus48 | `general_v2` 20 items (10_CHECK_FORMS) | the new check fragment |
| content-wp | opus48 | WP-12 Part B (core_17 annual), WP-15 | annual fragment, E3/E6 swap items |

Decisions:
- Four engine agents in parallel rather than serially: the packets are opt-in on separate keys, so conflicts are limited to shared lists (`STAGE_IDS`, schema, validator); the orchestrator resolves them at merge.
- `data_conduct` waits on P5b (Carrholme room); it starts with E11.

### eng-b stopped (2026-10-29)

A safety classifier stopped eng-b (ENG-03a/03b) while it was still reading code: "Your response above was stopped by a safety classifier — this is not a tool or API error. The rest of it was withheld, and tool calls in it that had not finished did not run. Do not produce that content again, even reworded." No code written; worktree branch `worktree-agent-ae74dcc1fb6ce7fc5` clean. Per AGENTS.md, a retry of the same prompt on `sonnet-cvp` or Haiku goes to the user. Its code-reading notes, kept for the retry: verdict relabel already exists via `set.labels.verdict.*` (add `verdictLabels` as shorthand); pages without `url` need handling in `page()`, `defaultWho` and `triage.rb`; the fakeCheck mode also needs a builder-minigame branch (rows, `_sig`/`_pick7`, inspect step, `closeResult`/`linkInfoFor`, an `attach()` host-id equivalent), not only model, renderer and flip.
- User (2026-10-29): retry the stopped ENG-03 task on opus48 (same prompt plus the first attempt's code notes); if it needs escalating, Haiku gathers the game context first and cvp (metered) gets only the narrow residue. Running as eng-b2 (opus48, worktree).

### Wave 1 results so far

- eng-a (ENG-01, 09b, 09d): merged. Episode-level `stepLabels` added on top of the built `strings.stepLabels`; ENG-09d became registry guards (`FULL_EPISODES`, `CHECK_ROLES`, parity `EPISODES`), so each new shell needs one line. `bundle exec` leaks bundler env into child ruby in a worktree: run `bin/test-js` without it there.
- eng-c (ENG-04): merged (6acf291c6). Conflicts in `episode-runner-minigame.js` (imports, `_stripLabels`) and `flip-view.js` (signature) resolved keeping both packets. The stage advances only on `finished: true`. Open: beat choices not recorded for measurement; sandbox options are in authored order (authors must not list the safe option first: content reviewers check this). E16's "end on Samira" holds only if `samira` is authored last.
- After the merge: `bin/test-js` 296/298; the two failures are the new registry guards flagging the in-progress `awareness_e8_after_the_click` folder (expected until E8 wiring registers it).
- content-checks (`general_v2`, 06e691349): 20 items, both forms validate in scratch shells, balance lint clean with a positive control. Queued for design review C1: item 8 scores `reply_to_differs`, a header tell that the built forms stopped scoring (C2-M6); consider a visible tell instead.
- Running: bridge regression on main (Haiku), `general_v2` generator and shells (Sonnet), eng-d, eng-b2, content-e8, content-wp.
- WP-15 (b7068b712) and annual content (a25b403ce, fragment at `awareness/annual/defend.json`): E6 swaps `e6_fuel_card_offer` for `e6_chat_new_number`; E3 swaps `e3_call_on_behalf` for `e3_call_remote_access` (Vanteq Systems, Marcus Hale). New cast Dermot Lynch. Regen of the two defend-only shells and the annual shell: Sonnet (wire-wp).
- `general_v2` shells (07a744f1a, 149dafc44): 4 shells validate; reopencheck at baseline. Orchestrator looked at the triage screenshot. Queued for design review C1: (a) the inbox list row for a `page` card prints the look-alike domain `quayho1t-check.example` in the pixel font, not the address font, so the 1/l swap is harder to read than in the reader; (b) the AB pre-check title reads "Everyday threats check (part two)"; (c) "Marcus" used twice (Marcus Webb in general_v2, Marcus Hale in E3).
- WP-15 shells regenerated (7b87f2315; only the E3 and E6 defend-only erbs changed across all 16 generated shells); annual shell (a0108e0c3, `STANDALONE_SHELLS` guard list); `bridge-e6-full` now plays `e6_chat_new_number` (8c608ee5b). e3-full 22/22, e6-full 15/15.
- E8 wired (bb1eecb5a, 61eab210e, pilot notes b8e109908): bridge e8-full 13/13; 298/298 JS files. New bridges need `BREAK_ESCAPE_STANDALONE=true bin/rails db:seed` first (now in P9).
- Bridge regression after the ENG-01/09b/09d and ENG-04 merges: 11/11 PASS (e1-e7 full, p7-channels, p7-episode, 6, r4-door).
- ENG-09a/ENG-11 merged (2f91651d4); conflicts in `episode-model.js` (cleanMistake vs drill helpers, readState, completeStage) and the runner import resolved keeping both. 300/300 JS files. Accepted engine choices (user may overrule): a choice card scores on a 100 scale; choice cards stay out of phish/report tallies; the sort drill runs before the inbox inside the defend stage; a scored drill scores against each card's own `answer` (2/1/0 points).
- Design review C1 running: E8 (opus48) and checks/WP-15/annual (opus48), into `reviews/build/`.

## Wave 2 (2026-10-29, user: "parallelise further")

Shared rules: `AGENT_RULES_ENGINE.md`, `AGENT_RULES_CONTENT.md`. Content agents write ink to `AW/eN/ink/` (not `scenarios/`, which trips the registry guards for everyone) and brand entries to `AW/eN/BRAND_ADDITIONS.md` (the orchestrator folds them into BRAND_SET).

| Agent | Model | Work |
|---|---|---|
| eng-02 | Sonnet, worktree | ENG-02 `guess` stage (E9; leaves room for ENG-02b) |
| eng-10 | Sonnet, worktree | ENG-10 brief-only episode (core_00) |
| eng-12 | Sonnet, worktree | ENG-12 raise-a-concern form (E16) |
| eng-13 | Sonnet, worktree | ENG-13 privacy panel (E14) |
| eng-0607 | Sonnet, worktree | ENG-06 assistant, ENG-07 call label (E13) |
| eng-05ab | Sonnet, worktree | ENG-05a world play, ENG-05b costume (E12) |
| rooms | Sonnet, worktree | P5b Carrholme room, P5c Merrin lobby |
| c-e9, c-e11, c-e13, c-e14, c-e15, c-e16, c-e17, c-e19 | opus48 | episode content |

Held back: E12 content (after ENG-05a/b and the lobby land), E18 (after ENG-02b), E20 (after ENG-14, which follows ENG-03a), core_00 content (after ENG-10), `data_conduct` (after the Carrholme room).
- eng-0607 (Sonnet) stopped by a safety classifier before writing code (likely the E13 subject matter; not reworded). Retried on opus48 (eng-0607b, worktree) per the user's 2026-10-29 rule, with the first attempt's code seams; the stopped agent was stopped by TaskStop so it cannot resume and duplicate.

## E8 design review

| Cycle | Blocker | Major | Minor | Notes |
|---|---:|---:|---:|---|
| C1 | 0 | 3 | 8 | `reviews/build/E8_DESIGN_C1.md`; fixing: content (opus48 fix-e8), engine MA3/MI2 + triage list address font (Sonnet eng-fix1, worktree) |

Rulings: MI3 cut the parcel item (six items, the target); MI8 withdrawn (the defend-only shell keeps `flipMissedHeading`/`flipLandedNoTells` by the generator's documented rule, as the built episodes do). By design, not a finding: under the awareness scoring profile, reporting a genuine item still scores full, so the awkward-genuine lesson is carried by feedback.

### Wave 2 merges (2026-10-29)

Merges now happen in the orchestrator's own worktree (`.claude/worktrees/orch-merge`, branch `orch-merge`) and main is fast-forwarded, because a conflicted merge in the shared tree blocked other agents' commits (E17's content agent could not commit mid-merge).

- ENG-10 brief-only episode (9893d6a79), ENG-12 concern form (75e41464d), rooms P5b Carrholme + P5c Merrin lobby (merged clean), ENG-13 privacy panel (d2d2eef59), ENG-05a/05b world play + costume, eng-fix1 display fixes (flip aftermath contrast, address fonts in aftermath and triage list rows), ENG-03a/03b (opus48 retry, 5bd0623e9). Validator conflicts resolved by union via diff3; runner import lists combined. Merge worktree: 310/311 JS files (the one failure, `event-mapping-unlock-door`, fails only under the parallel runner's IPC on Node 22 and passes standalone 4/4); validator sweep over all awareness, lab and test_social shells: no FAIL.
- Defend-stage order when several are authored: sort drill, then concern form, then privacy panel, then the inbox.
- Rooms: orchestrator looked at both renders. For the room-dressing review: the lobby's coffee table overlaps the sofa; Carrholme's floor is sparse. Registering the Carrholme wall props added two tile entries to the shared embedded tileset, so all four existing `room_aw_*` maps were rebuilt (14 lines each, only those entries).
- ENG-03b left open: the builder minigame's fakeCheck UI branch and the CSS for the new page states. Running as eng-03c (opus48, worktree).
- E9 content committed (823382f2a; 8 defend items, 5 of them `choice` cards; `guess` config in `full_only.json`; guess tokens as `provides[0].type: "guessToken"`, to be confirmed against ENG-02). E17 content committed (183e5c1ef; sortDrill drawCount 9).
- Started: ENG-14 Wi-Fi list (Sonnet), content E10, E12, E20, core_00 + data_conduct (opus48).
- E19 content committed (sandbox of 4 beats, safe option position varied; 6 defend items; 4 local tells). Rulings: the brief's "module line" and org-slot line (no debrief slot exists) are folded into the Monday card by the wiring agent, as E17 folded its plain line into `strings.defendOnly`; a dedicated `strings.moduleLine` slot is filed as an idea, not built now. The Fernside look-alike (`fernside-invoices.example`) is aligned with E10's shapes when E10's content lands.
- E8 C1 fixed (fb4690af9, outcomes 6c49bf7c7): MA1, MA2, MI1, MI3 (six items), MI4, MI6, MI7 fixed; MI5 kept (E1 and E5 keep the same unread landed global; bridges read it); MI8 withdrawn; MA3/MI2 fixed by the engine display fix (merged). Spoken host lines changed: 3 (listed in the C1 outcomes). Bridge e8-full 13/13. E8 design C2 running.
- ENG-02 merged (bc7144995): `guess` stage, `password-guesser` scene; a pattern slot needs a `word`. 311/312 JS files (the known Node 22 IPC flake). Content committed: E11 (full-only fragment named `mistake.json`; DC Hendry renamed DC Rowley to avoid a built genuine colleague's surname), E13 (no osint, so the pretext is the one send-gating choice; drop address hard-coded), E15 (sortDrill in defend.json so both shells carry it), E16 (03d1cd26d).
- Running: wiring E17+E19, E9+E16, E11+E15 (Sonnet); ENG-02b (Sonnet); ENG-06/07 (opus48); fakeCheck builder UI (opus48); ENG-14 (Sonnet); content E10, E12, E14, E20, core_00 + data_conduct (opus48); W1 design C1 fixes (opus48).

### Wave 1 checks/WP-15/annual design review

| Cycle | Blocker | Major | Minor | Notes |
|---|---:|---:|---:|---|
| C1 | 0 | 1 | 8 | `reviews/build/WAVE1_DESIGN_C1.md`; fixed edf453778 (item 8 scores senderTrust only, per the built forms' C2-M6; retitled "Everyday threats check"; Marcus Webb -> Wesley Tan; E6 unused chip dropped; annual "Caller" restored, brief reworded); P1-m2 fixed by the engine display fix; P3-m2 withdrawn (built E5 item) |

- ENG-14 Wi-Fi list merged. Every SSID uses the address font, so the look-alike is not singled out (ruling: keep). E14 content committed (7bc4ae036); E14 wiring started.
- E8 design C2 (`reviews/build/E8_DESIGN_C2.md`): 0/0/1. All C1 findings closed except MI5 (kept by design). New N1 (minor): the defend-only `defendIntro` still gives "leave the device as it is" as the universal move; goes to the dialogue fixer. A design C3 confirmation follows the dialogue fixes. E8 dialogue review C1 running (opus48).
- E14 wiring (Sonnet) stopped by a safety classifier mid-run, with two content gaps the validator found (no ask template; no pretext decoy). Handed to opus48 to finish both wiring and content (wire-e14b), per the user's rule.

### Wave 3 (2026-10-29)

- Merged to main: ENG-06/07 (assistant overlay, video-call label; opus48 retry), ENG-02b (spray/stuff). 314-315 of 317 JS files; failures are the known Node 22 IPC flake plus the two registry guards reacting to E14/E16 ink folders committed before their shells (resolves when their wiring lands).
- Wired: E17 + E19 (45012d5fe; bridges e17-defend 14/14, e19-full 15/15). The generator now carries `sortDrill`/`concernForm`/`privacyPanel` into defend-only shells. E9 wired (fec29ec20). Content committed: E10 (5dd8bf749), E12 (3ca56d43a), E20 (dbfeed9f7), data_conduct (b64a5ad3e).
- E8 dialogue C1 (`reviews/build/E8_DIALOG_C1.md`): 0/0/3; fixing (Sonnet fix-e8d) with the sort-drill summary live-region glitch.
- Rulings: E20 host stays Zainab Hussain on a placeholder sprite (whether to reuse a built host instead is for the user, with the art schedule); E10's fifth concept card carries its module line (fine; the same pattern as E11 and E20); E12's costume is a stock placeholder until art is approved.
- Running: wiring E9+E16 (finishing E16), E11+E15, E14 (opus48), E13 (opus48), E12, E20; fakeCheck builder UI (opus48); content E18, core_00 (opus48); E8 dialogue fixes.
- Merged ENG-03c (fakeCheck builder UI + CSS for the seven page states). Every engine packet is now on main. Open from it: fake_check_paste inspect "found" state is session-only (persisting it needs a shared TELL_IDS/state-sync change; not needed for E10's flip).
- Wired E11 + E15 (bridges 20/20, 27/27; the generator's defend-half carry now also reads `defend.json`). E8 dialogue C1 fixed (9e4105698; 3 spoken lines changed, listed in the review), sort-drill live region hidden (9e4d15b53).
- Content committed: core_00 (c11af986c), data_conduct (b64a5ad3e).
- **Incident:** the core_00/data_conduct agent committed without a pathspec (sweeping two staged 0-byte ink renames into b64a5ad3e) and then ran `git reset --soft HEAD~1`, which dropped another agent's commit a22a3e639 from main. It restored the change as df1778caa; the orchestrator checked every added line of a22a3e639 is in main's `01_PIPELINE.md` and every main reflog commit since is reachable. Wiring prompts now say "never commit without a pathspec" explicitly.
- **Routing change:** Sonnet agents were stopped by the safety classifier four times on awareness work that touches attack halves (ENG-03, ENG-06/07, E14 wiring, E12 wiring); opus48 finished each. From now on, wiring of an episode with an attack half goes to opus48; Sonnet keeps engine-only, consequence-flip and check-form wiring, and playtests.
- Running: wiring E10, E12 (retry), E13, E14 (opus48), E20 (Sonnet), core_00 + data_conduct shells (Sonnet); E8 confirmation review C3 (opus48) and E8 persona playtest P1 (Sonnet); content E18 (opus48).
- Findings parked for each episode's design review: E15's "that stick in the post was ours" reveal has no home (no fragment or debrief slot); E15's defendIntro shows only after the drill.

## E8 stage status

| Stage | Cycles | Result |
|---|---|---|
| Design | C1 0/3/8, C2 0/0/1, C3 0/0/0 | closed (MI5 kept by design) |
| Dialogue | C1 0/0/3, C2 0/0/0 | closed (WC-1, WC-2 optional, not taken) |
| Playtest | P1 persona + reload running | |

- Wired E9 + E16 (bridges 14/14, 17/17). E9 got an `attack` block (validator requires it), slot `word`s and `stepLabels.flip`; E16's concern-form keys were reshaped to the schema. Design C1 now running for E9, E11, E15, E16, E17, E19 (opus48, one each; shared `REVIEWER_BRIEF.md`).
