# P0-T comparison run: lab_scanning (Phase 0 engine, commit 91c1ee03)

Baseline: `build_log/baselines/browser/lab_scanning.md` (run 2815). Same steps, choices and reload point.

## Run facts

| Item | Value |
|---|---|
| Game id | **2839** (mission 40, `lab_scanning`), `new-game.rb`, PREFLIGHT OK, 1 stand-in flag seeded, none submitted |
| Server | keyless :3001 |
| Browser | headless Chromium, harness PID 705725 (quit with `session-stop.sh 2839`, PID confirmed gone) |
| Session log | `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-T-lab/lab_scanning-session.jsonl` |
| Hook | `popup-console-hook.js` installed by `eval` right after the browser opened, and again after the reload |
| Differences in method | Browser start took 45 s, so the timed intro was already open on its second-to-third line when I first looked. The hook was in place before the popup fired, so nothing was missed. I stepped with `mg continue` and read the hook after each line. |

## Comparison

| # | Observation | Baseline | This run | Result |
|---|---|---|---|---|
| 1 | Before anything: rapport / ethics (ink and global) | 0 / 0 | 0 / 0 | SAME |
| 2 | Intro popup 1 text and class | `+ Influence: Reconnaissance Specialist`, `influence-popup influence-increased` | identical | SAME |
| 3 | Popup 1 timing | when "Let me explain how this lab works..." was showing | before reload: fired between "Scanning is a critical stage..." and "First, there's a Lab Sheet..." (I stepped coarsely there, so the exact line was not read); after reload: fired exactly as "Let me explain how this lab works..." showed | SAME (exact on the replay) |
| 4 | Ethics after popup 1 | 0 -> 10, event `global_variable_changed:scanning_ethics` 10 | 0 -> 10, event seen (value 10) | SAME |
| 5 | Rapport after popup 1 | 0 | 0 | SAME |
| 6 | Hub choice 1 popup | 1 popup, on "After establishing a list of live hosts..." ; rapport 0 -> 5 | 2nd popup present on that line; rapport 5 | SAME |
| 7 | Sub-choice 1 popup | 1 popup, rapport 5 -> 10 | 3rd popup; rapport 10 (read on the hub line after the answer) | SAME |
| 8 | Popup total before reload | 3, all the same text | 3, all the same text; hook `infl` log has 3 "Influence increased with Reconnaissance Specialist" lines | SAME |
| 9 | Ethics in ink and global stays 10 | 10 | 10 / 10 | SAME |
| 10 | Hostile state / `influence` field | none, not read | none, not read | SAME |
| 11 | Reload: Resume overlay (Resume / Restart / New Session) over restarted game | present | present (buttons "Resume", "Restart", "New Session") | SAME |
| 12 | Behind overlay: ethics 0, rapport 0, `intro_timed` open on the Lincoln quote | yes | yes (Lincoln quote showing, ethics 0/0, rapport 0) | SAME |
| 13 | Intro replays in full after reload (existing behaviour) | yes, popup 1 again, ethics 0 -> 10, rapport stays 0 | **unchanged**: Welcome / Scanning is critical / This knowledge / Let me explain (popup) ...; ethics 10, rapport 0 | SAME |
| 14 | Pre-reload rapport 10 did not survive | yes | yes (rapport 0 after reload) | SAME |
| 15 | Server record after `sync` | globals set: `engine_tutorial_declined, player_name`; `scanning_ethics` not persisted; Notepad kept | globals set: `engine_tutorial_declined, player_name`; no `scanning_ethics`; Notepad kept | SAME |
| 16 | Tutorial prompt and Mission Brief after conversation close | both appear, block `enter` | both appeared, blocked `enter` (reason `blocking-ui`) until dismissed | SAME |
| 17 | Console: uncaught exceptions or influence/ink errors | none | none; hook `errs` held only `[TTS] API error: 400` warns and one "Cannot disable main game input" warn from the notes minigame | SAME |
| 18 | Console: counts of 400/404 | before reload 21 (19x400, 2x404); after 11 (all 400) | before reload: 18 TTS-400 warns in the hook (the harness `pageErrors` for that stretch was drained once and truncated, so its exact count was not kept); after reload: 12 entries, 11x400 + 1x404 | SAME in kind (known keyless 400s and the known 404), counts differ slightly because the run was shorter |
| 19 | `verify-run.rb` | progress recorded, 2 rooms, globals as above | progress recorded, 2 rooms, same globals | SAME |

Counts: SAME 19, DIFFERENT 0, NOT REACHED 0.

No regression. The influence popup, the rapport and ethics values and the intro replay after reload all match the baseline.

## Earned-secrets table

No secret, key, PIN or flag was used. The flag station and VM launchers were not touched.

## verify-run.rb

Run on game 2839 after `enter vm_lab_room` (my move, as in the baseline). Saved to `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-T-lab/lab_verify.txt`.

```
game            2839  (mission 40)
created         2026-10-21 11:29:35 UTC
last write      2026-10-21 11:32:50 UTC
played for      195s of wall clock
current room    "instruction_room"
unlocked rooms  2: instruction_room, vm_lab_room
unlocked objs   0: 
inventory       1: Notepad
NPCs met        1: reconnaissance_specialist
flags submitted 0: 
globals set     2: engine_tutorial_declined, player_name
tasks           0 in objectivesState, 0 completed
tasks_completed 0
score           0
social scenario false (completed tasks do not count; pass --tasks to count them)

VERDICT: progress recorded — 1 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.
```
