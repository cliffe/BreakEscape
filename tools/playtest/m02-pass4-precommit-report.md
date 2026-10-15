# m02 pass 4 pre-commit check

**Question answered:** plumbing and wording only (six targeted checks from `scenarios/m02_ransomed_trust/DIALOGUE_REVIEW.md` section 6). Not a solvability pass.
**Headless**, keyless server :3001 (load average about 1). :3000 not touched. Screenshots and helper scripts: scratchpad `m02-precommit/`.

| Game | What it covered | Session log |
|---|---|---|
| 1450 (A) | Real route: Bernie, Kim, Val (pre-burn), Gary (burn fired by his talk), page reload, HaX phone, Val challenge via the lanyard | `tools/playtest/m02-pass4-precommit-A-session.jsonl` (831 commands) |
| 1451 (B) | Bernie reopen, Val pre-burn, burn set from the console (exercised), Val challenge via "Ring Bernie", re-ask, notebook | `tools/playtest/m02-pass4-precommit-B-session.jsonl` (411 commands) |

verify-run: `m02-pass4-precommit-verify-1450.txt` (9 rooms beyond the first, 0 flags) and `m02-pass4-precommit-verify-1451.txt` (6 rooms beyond the first, 0 flags). No flags were submitted; none are needed for these checks.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| IT override key | (item) | Bernie, dialogue reward | A, reception | yes |
| Server room keycard, spare lanyard | (items) | Gary, dialogue (rapport route) | A, IT | yes |
| `cover_burned` in game B | global | Normally set by finishing Gary's talk; set from the console in B | B | **no, exercised** (console, mirrors the bridge's own set + broadcast + emit) |

Nothing else was typed or set. The B burn is the only console help used.

## Results

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Burned cover, Val's challenge: lanyard and Ring Bernie send HaX only "That'll hold" | **PASS** | A (lanyard): `getConversationHistory('agent_0x99')` went 15 to 16 entries; the only new one, read about 4 s after the choice, is "That'll hold. Now -- whoever made that call is still in the building...". No "Bernie's put her name against yours". B (Ring Bernie, no lanyard held): 8 to 9 entries, same single "That'll hold" text. In B `bernie_vouched` ended true (Val's knot sets it after `cover_restored`) and the hook still did not fire. |
| 2 | HaX phone after a reload (past the front desk) | **PASS** | A, after sync, reload, Resume click through the DOM, title click: phone opened on the full history then the hub only, 7 hub choices ("My booking's been pulled...", "Remind me where we are.", "Send me a field guide.", ...). No "Understood." / "What should I know going in?" / "Anything I should be careful of?" and no "Where do I start?" (`hax-reload.png`). "Understood." was never offered, so its reply could not be exercised in this state. |
| 3 | Val's notebook handed over once | **PASS** | A: taken via "You've got all this written down?" before the burn; notes list then holds one "Val's Pocket Notebook" (checked by listing `gameState.notes`). The choice is gone from Val's hub on reopen. After the reload and the burned challenge the choice was still not offered, and the notes list still had one notebook. B: taken once, notes list one notebook, not offered again on reopen. Not tested: re-offering within a half-finished conversation, because the choice vanishes once taken. |
| 4 | Visitor log shows the bracketed note, no `~~` | **PASS** | Notes viewer text: "01:02  EXTERNAL SECURITY CONSULTANT -- emergency response -- auth: DR S. KIM  [struck through, different pen, no initials]" (rendered with en dashes in the viewer). No tildes in the viewer text or the stored note. |
| 5 | Drill/Reeves asked twice: second time a one-line recap | **PASS (in one session)** | B, no reload: Val's first Reeves speech (5 lines) via "Is there anyone...", then after the burn "Ring Bernie" then "Whoever rang control..." gave "Reeves. Same as I told you. Not on my rota, never signs Bernie's book, and I've been told twice to drop it." followed by the follow-up choices. See the finding below for the reload case. |
| 6 | Reopen Val, Bernie and Gary: one line each, not blank, not doubled | **PASS** | Bernie (B): "Back already. What's broken now?" plus one choice, screenshot `bernie-reopen.png`. Gary (A): "Any joy?" plus two choices, DOM text read directly (screenshot `gary-reopen.png`). Val (A, B): "Alright." / "Still with us, then." plus two choices, `val-reopen.png`, `val-reopen2.png`. The dialogue panel's text was single in every case. Bernie was reopened in game B and Val and Gary in game A, so not all three in one session. |

## Findings outside the six checks

- **Reload resets ink variables and visit counts (check 5 caveat).** In A, Val's Reeves speech and her drill answer were played before the reload. After the reload, "Six weeks. Tell me about that." replayed the full five-line speech and "Anything odd on nights lately?" was offered again, so `discuss_reeves` visit counts and `asked_about_drill` do not survive a reload; only the synced globals (`val_notebook_given`) do. This is why the notebook is correctly not re-offered but the speech is replayed. Expected given how the engine persists ink state, not something this pass changed. Say if it should be fixed.
- Harness: the reload overlay needs the DOM Resume click, then the title screen needs a click on `.title-screen-prompt`'s parent; `mg close` then closes the "Mission Brief" note it opens, which adds a "Mission Brief" note to the notepad. The saved room after reload is reception_lobby at (160,144), as in earlier reports.
- Harness: `enter` often needs two calls (first returns `did-not-cross`), and walking back through a vanished door needs `moveTo` and `walk`. Not game findings.
- Val's pre-burn hub in B offered "About Reeves. Have you got any of that written down?" and in A the in-conversation "You've got all this written down?"; both are the same notebook gate.

Nothing in the repo besides this report, the two session logs and the two verify files was written. No scenario, ink or engine file was edited, nothing committed.
