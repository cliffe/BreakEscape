# Handover: ca02 lesson, Option A with Option C's Chidi wording

Written 26 Nov 2026 at the 150k context mark. Worktree `.claude/worktrees/b-ca-trailers-next`, branch `video/ca-trailers-15-01`. The original brief came from AC0; this note holds everything the next agent needs from it.

## State

- **No scenario, ink or fragment file has been edited yet.** All the edits are written as one exact-replacement script: `tmp/handover/ca0/ca02_optA_apply.py` (committed with this note). It asserts each match count, checks the JSON parses, and only writes files when every replacement has matched, so a failed run leaves the tree untouched.
- The last run stopped on one assertion: in `planning_notes/.../awareness/e2/defend.json` the string `Why 'enable content' matters` occurs twice (a `_note`-style block near line 33 also holds it, besides `conceptPanel[0].heading` near line 619). **Fix:** for FRAG, replace only the `"heading": "Why 'enable content' matters"` form (e.g. call `rep(FRAG, '"heading": "' + OLD_CP_HEAD + '"', ...)`), and check whether `OLD_CP1` also appears twice in the fragment (line 33's `text` starts "Why 'enable content' matters. Office documents ..."; it is a planning note: either leave it or update it too, and adjust the count). Then re-run. Other replacements may fail after that; fix each count the same way and re-run.
- Unrelated changes by other sessions are in the tree (`test/js/door-gates*.test.mjs`, `test/js/lab-ux-ui.test.mjs`, `scenarios/test_side_door_gate_east_start/`, the `dungeon_graph.*` files). Don't stage them.

## What the script does (decisions already made)

Read first: `planning_notes/phishing_and_social_engineering/awareness/CA02_LESSON_OPTIONS.md` lines 7-36 (state and accuracy), 57-116 (Option A), 186-194 (Option C's Chidi bullets).

Defend set (`e2_recruitment_inbox`), in the attack erb, the `_defend` twin erb and the fragment (fragment's set only; the hr_form_a/b check forms keep their old chip and redFlag text because they ship in `ca_pre_hr_*`/`ca_post_hr_*`, outside scope):
- chip `enable_content_prompt` text: "It wants a second step before I can see it".
- `e2_enable_content`: redFlag, perFlagNote and `whyFine.attachmentPlausible` say "stays blank until you switch content on". Body and label untouched (label `.doc` was done in 5bbf15f71).
- `e2_cv_docx` (Darius) `whyFine.enable_content_prompt`: Protected View, yellow Enable Editing bar, read it without pressing it.
- New message `e2_cv_password_zip` (Ana Moraru, mailgrove.example, 11:05, inserted before Colin's), a password zip naming Fatima and the role; flag `enable_content_prompt` only. Name checked unused in scenarios/planning_notes/docs.
- Brief "Six messages" becomes "Seven" in the set brief, the twin's scenario_brief, endGoal, conclusion body, defendOnly brief, kiosk observation, twin `mission.json`, the twin Fatima ink line (voiced) and the generator `gen_e2_e4_shells.py`.
- `conceptPanel[0]` heading "Why a CV that wants a second step matters"; text says Office has blocked internet macros by default since mid-2022 (red bar), attackers now need one more step (content on, password zip, "view my CV" link and sign-in), and a real CV just opens in the viewer or Protected View. Attack erb paragraph 2-3 reworded to "second step". Mondaycard left alone (done in 5bbf15f71).

Chidi (Option C wording), attack erb and `scenarios/_office_kit/ink/chidi_okeke_ambient.ink`:
- Bark 2 (erb, 2 places) and ink line 97: "Microsoft's blocked it. He's sent steps to get round it. Do I?"
- Choice line 106: "Follow his steps. It's only a CV." (report choice and "Grand. Clicked it." kept).
- PC hint (`kit_ca02_pc` `requiresItemHintVariants`, out===true): red bar quoting Microsoft's message, "Beside it, the candidate's email says how to get round that." Report variant: "The CV is closed, still blocked, and reported."
- Debrief: "Reporting it" says Office blocked it and it needed Chidi to switch the protection off; both "What Enable let in" panels become "What one more step let in", Chidi "followed the candidate's steps and switched Office's protection off himself", ending "The gap was one step: Office had blocked the file, and the email talked him round the block."
- `ca02_react` lines (126, 128) left as they are; they still fit.

Attack seat (engine judges only by kit kind, so no per-wrapper engine work): kit_cv label stays "CV (Word document)" (no t02 attach retake); `kit_portfolio_zip` label becomes "CV (password-protected zip)" (id kept); `attachmentPlausible` pass and wrong-type lines, hint 3, the missed reply and the seeded red-team brief now name the default macro block and the extra step. No link wrapper (needs a landing page); the concept panel names the link form. `e2/attack.json` was not updated (outside the listed scope): say so in the report.

## Still to do (the original brief's steps)

1. Fix the script's FRAG counts, run it, review `git diff` (UK English, no em/en dashes in spoken lines, no stage directions in voiced lines).
2. Compile ink: chidi_okeke_ambient (office kit) and `scenarios/ca02_cv_lures_defend/ink/fatima_begum.ink`.
3. Commit own files first with explicit paths: `git add <paths>`, `git diff --cached --stat`, `git commit -m "..." -- <paths>`. Never amend, stash, reset or rm.
4. Checks: validator on both seats (`ruby scripts/validate_scenario.rb`, both erbs); `node --test test/js/social-awareness-fragment-erb-parity.test.mjs`; `bin/test-js` full suite (a test may count six e2 messages: fix it); every ca02 ink route (look for an mXX_routes-style routes file for ca02/office kit, else drive every Chidi `ca02_cv` branch and the defend Fatima hub with inkjs, maxRun 9) and list the routes; `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/ca02_cv_lures/` (and the defend twin).
5. npc-dialog-review skill on new/changed lines only; fix findings.
6. Voicing is pre-approved once the review is clean: tts-audio skill batch for ca02 (Chidi bark 2 and choice line, twin Fatima "Seven messages" line); then `tts:wasted`; move orphan clips to `tmp/delete/`, stage the removals; commit clips with the ink and scenario change.
7. Trailer impact: read `docs/video/takes_ca02.md` and `tools/video/edits/ca02*`. Known so far: v8a "Six messages wait in the inbox." (`tools/video/edits/ca02_trailer_r1.json:729`, `_narrow.json:729`) needs re-voicing as "Seven"; inbox takes `t05_inbox_list_runA/B` and `t05n_inbox_narrow` show six rows; `t02_attack_run` / `t02n_attack_run_narrow` may show the renamed zip label in the Attach picker and the new pass line on the result panel (HIDE_MAIL hides some lines: check); `t07_chidi_prompt` shows bark 2 and possibly the PC hint. Don't capture.
8. Report to AC0 under 150 words: hashes, before/after lines, check results with routes, review findings, clips voiced, retake list, assumption lines.

## Update 26 Nov (second agent): done

Commits: d2fe4ddb4 (Option A edits), bb189ab97 (Fatima defend debrief and Chidi react wording), 76b2f831c (11 new clips, 11 orphans moved to tmp/delete/tts_ca02/). Validator 0 errors both seats; fragment parity 20/20; dialoguelint clean; routes driven with inkjs (maxRun 9): Chidi ca02_cv report/follow/silent/after-report/moved, ca02_react caught/missed, defend Fatima fresh/done+missed/done+caught, attack Fatima start. No routes file exists for ca02.
`e2/attack.json` not updated (out of scope).

### Trailer VO
v8a "Seven messages wait in the inbox." generated with tools/video/scripts/narrate.rb (Sulafat, style from the old v8a.json) then trim_vo.py: `~/video-takes-local/ca02/vo/Sulafat_seven_v2/trim/v8a.mp3`, 2.52 s against the old 2.328 s slot (47.4 to 49.728): the edit list (not edited) still points at the old clip; point it at the new path and widen the slot by 0.19 s (or trim), and change text/caption to "Seven". Same for `_narrow.json`.

### Retakes (not captured)
- t05_inbox_list_runA and runB: list now has seven rows ("0 of 7 sorted", Ana Moraru row at 11:05), chip text changed.
- t05n_inbox_narrow: same, card chip and red-flag wording.
- t02_attack_run and t02n_attack_run_narrow: only if the Attach picker or result panel shows the "CV (password-protected zip)" label or the new pass/wrong-type lines (check frames first; the Word CV label is unchanged).
- t07_chidi_prompt: Chidi bark 2 text and audio changed ("Microsoft's blocked it. He's sent steps to get round it. Do I?"), PC hint red-bar wording changed.
- t04_fatima_flip: F1 line unchanged on the attack side; no retake unless it shows "Six".
- Panels: concept panel and debrief panels changed text; any take or still showing them needs a retake.
