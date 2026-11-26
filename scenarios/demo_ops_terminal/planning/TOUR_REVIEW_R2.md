# demo_ops_terminal: guided tour review R2 (implementation and dialogue)

Reviewer: Opus, read-only (only this file written). Worktree `/data/be-ops-follow`, branch `ops-showcase-tour`. Delta under review: `1fdf0fd63` (round 1 fixes) on top of `24414fb41`, `c2a661c65`, `e3e0fa54a`. Read: both round 1 reviews, the fixer's report and `planning/BUILD_REPORT.md` "Tour round 1 fixes", the whole delta, the four ink files in full, Ama's barks, `PLAYTEST.md`, `planning/VOICED_LINES.md`, the scenario test, `npc-dialog-review` 2l and the `tts-audio` standing rules, and the engine code cited below.

## Verdicts

- **Implementation: clean.** 0 blockers, 0 majors, 2 minors.
- **Dialogue: signed off.** 0 blockers, 0 majors, 3 minors. Before voicing, apply the three line edits below as written. They are pre-approved word for word and need no further round. After applying them, regenerate `VOICED_LINES.md` from the extractor.

## Checks run

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb scenarios/demo_ops_terminal/scenario.json.erb --no-graph` | 0 errors, 2 warnings (the missing `player` and `timedConversation` recommendations). The two VAR/global sync notices are gone (`Synced scenario global` comments). |
| `./scripts/compile-ink.sh demo_ops_terminal` | 4 compiled, 0 failed. The only warnings are the expected `-> END` notes. The committed JSON is unchanged after the compile. |
| `dialoguelint.mjs scenarios/demo_ops_terminal/` | No findings. It is still blind here (0 lines measured; R1 m13, a lint fix across the series). |
| `loopcheck.js` at `start` on all four, plus Ama with `sweep_done token_ran_out scan_check_done confirm_all_done` and Zainab with `confirm_all_done` | No runtime errors |
| `flock … bin/rails test test/controllers/break_escape/demo_ops_terminal_scenario_test.rb` | **15 runs, 356 assertions, 0 failures, 0 errors** |
| `TtsLineExtractor.for_scenario('demo_ops_terminal').entries` against `VOICED_LINES.md` | Identical: 81 unique lines. The longest is 27 words. No `{var}`, no stage directions, no `;`, `:` or dashes. |

## Round 1 findings: closed?

### Implementation review R1

| Finding | Status | Evidence |
|---|---|---|
| B1 leak scan errors | Closed | The test records no `login` tags (`demo_ops_terminal_scenario_test.rb:408`, `:435`). It asserts that the two sign-in answers carry the host labels `BACKUP-PC` and `IT-PC`, and that `scanner.unused_entries` is empty. The scan finds `[]`. The test passes. |
| M1 beats not played live | Closed, with one gap that is said plainly | All 12 ticks were played live in game 286, with seconds (PLAYTEST "Measured seconds"). The way back (T3r) is marked "Not yet played live". The barks were never captured live; PLAYTEST says so and says how to poll them. See r2-i2. |
| m1 unplug pointer | Closed | `ama_owusu.ink:117`, the task title, the board. The bark names the Terminal's rule (`scenario.json.erb:261`), so it is true whichever way the box comes out. |
| m2 way-back pointers | Closed | `ama_owusu.ink:75-80`, the spare-port bark (`:258`), and the spare line loses "before you used it" (`:194`). |
| m3 T3 and T5 pointers | Closed | "Through the box, sign in …" (`:83`). The console pointer names `help`, `use` and `info` (`:92`). `HELP_MSFCONSOLE` is in the help list (`terminal-grammar.js:108`), and `info` without a selected module prints `SELECT_FIRST_TEXT` (`framework-console.js:22`), so naming `use` is right. |
| m4 "tell Ama" | Closed | The three task titles, the aim description and the board. The remote aim now says that the owner ends the screen. |
| m5 "saved link" | Closed | `ama_owusu.ink:256` |
| m6 "recon day" | Closed | The T7 bark is cut (`:253`), and "This time" is gone (`:71`). |
| m7 id prefix in PLAYTEST | Closed | No `CVE` in PLAYTEST. |
| m8 leak scan coverage | Closed | PLAYTEST `:29` |
| m9 greyed-row client test | Closed | `test/js/keyring-token.test.mjs:350` asserts no POST on a click, and PLAYTEST Known limits names it. |

### Dialogue review R1

| Finding | Status |
|---|---|
| M1 token clock told three times | Closed. The T2 bark is now "… as a table. Next, the backup PC." The T3 pointer is one line. |
| M2 console point twice | Closed. `console_ticked` says only "Now confirm all three." and only when T6 is undone. |
| M3 saved link | Closed |
| m1 "Still here" on first meeting | Closed (Chidi, Zainab) |
| m2 Zainab's card quotes Ama early | Closed. Gated on `confirm_all_done`, declared in her ink. |
| m3 recon assumptions | Closed |
| m4 stale "If" | Closed |
| m5 "keep his screen open" | Closed |
| m6 unplug bark | Closed (reworded to name the rule) |
| m7 console pointer "then … Then" | **Reopened in a new form**, see r2-d1 |
| m8 log pointer | Closed |
| m9 "remote support" ×4 | Closed (Chidi, Graham trimmed) |
| m10 recap with nothing to say | Closed (gated on `sweep_done`) |
| m11 small wording (5 items) | Closed, all five |
| m12 VOICED_LINES behind | Closed. Regenerated from the extractor; my run matches it. |
| m13 lint blind | Open by design (series-wide) |

Graham's code lines changed from "at my PC's sign-in" to "Connect it from your inventory". This departs from R1 on purpose and is right: PLAYTEST harness notes say his PC shows no sign-in on a click, and that the code is used through the inventory's Connect.

## Findings

### Implementation (minor)

**r2-i1. Moving the box to the spare port can tick T12, but PLAYTEST says "Moving the box never ticks T12".** `scenario.json.erb:259-260`
- The unplug mappings check only `token_expired_done && shared_screen_done`.
- On the way back, `token_expired_done` is already true (`token_out` or the T10 mapping sets it).
- So a player who did Graham's screen early can trigger this. Graham's hub is open from the start, and nothing orders T9 after T11. When that player unplugs from `rack_jack` to move the box, T12 ticks and the unplug bark plays mid-tour.
- This is off the guided order, so it is minor.
- Fix: add `&& globalVars.needs_console_done === true` to both unplug conditions. T11 is always undone while the way back is live. Alternatively, soften the PLAYTEST sentence.

**r2-i2. No bark has been seen live, and T3r has not been played.**
- PLAYTEST says both plainly, and the server side is covered by the Rails test.
- The next guided playthrough should read the `isBark` history after each beat, as the harness note says, and let the token lapse once before T3.
- That run checks that the bark is held while the view is open and that the stale drop works, for example the T2 bark when T3 was done in the same view.
- This does not block the implementation verdict. It is the first thing the next live run should prove.

### Dialogue (minor; apply before voicing, wording pre-approved)

**r2-d1. The console pointer stacks "then … Then" again across two lines (P9, mild).** `ama_owusu.ink:92-94`
- Now: `Type help to find the console's command. Search there, choose a module with use, then ask for info.` / `Then tell me what it said.`
- Replace both with one line (24 words): `Type help to find the console's command. Search there, choose a module with use and ask for info, then tell me what it said.`

**r2-d2. The recap says the sweep made the table, but the sweep prints no table (truth, mild).** `ama_owusu.ink:210`
- The sweep prints only "-- network changed. show lists it again --" (PLAYTEST harness notes `:55`; `CHANGE_LINE_TEXT`, `terminal-format.js:33`). The table comes from `show`.
- Now: `The sweep listed the machines that answer, as a table.`
- Replace with: `Show listed the machines that answered the sweep, as a table.`
- The T2 bark ("The same list Panels would show, as a table.") is held until the view closes. By then the pointer has sent the player to `show`, so it can stay.

**r2-d3. Graham's hub line repeats after his first greeting and after he hands over the code.** `graham_whitfield.ink:19`
- A first meeting runs "Now then. You'll be the visitor Ama mentioned." straight into "Go on, then."
- After the code it runs "… Don't be long." then "Go on, then." This is the same shape R1 m1 fixed for Chidi and Zainab.
- Fix: move `Go on, then.` into the `met_graham` re-talk branch of `start`, and make `hub` begin at `- (choices)`. The line keeps its text, so its clip key is unchanged.

## Concision (2l) on every line to be voiced

- **Mannerisms.** Ama is a warm, practical host: full check. Graham is unhurried West Yorkshire ("Now then", "Aye", "Right you are"), which is kept and is not padding. Chidi and Zainab are terse: already short.
- **Counts.**
  - P9 ×1 (mild, r2-d1)
  - P2 ×0 strong. The token clock is now told by the T1 bark, the on-demand T3 pointer and the T3 bark (the payoff). Recaps that repeat their bark are the reading-back layer, which plan 4.3 accepts.
  - P6 ×0
  - P13 ×0
  - Factual ×1 (r2-d2)
  - No monologue of four or more lines. The longest run is `short_version`, three lines given on request.
  - No line over 30 words.
- **tts-audio rules.** No printed variables. Ama's `{&…}` greeting is a fixed sequence, and each branch is its own clip. No inline stage directions and no `#delivery:` tags. Voices are unchanged from R1: four distinct voices, and each style names its accent with "consistent … throughout".
