# m04 office life: build review R3

**Counts: 0 blockers, 0 majors, 6 minors.**

Planning-tier round (F1 changes when a line is heard). Scope: `git diff 8724fd90b..HEAD` on `build/ol-m04` (HEAD acedfdaa0 at the end of the review: R2 minors, routes r41 and r42, `LIVE_PROOF_5.md`, `LIVE_PROOF_6.md` with F1, `VANCE_CALL_RECHECK.md`, `REGRESSION.md` re-run). Engine paths are under `public/break_escape/js/`. Read-only; no game or server driven.

## Re-run by the reviewer

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb` | 0 errors, 33 warnings (same as R2; V4 still warns on both newcomers). Compiled JSON unchanged by the recompile, so the committed `.json` files match the `.ink`. Graph files restored |
| `dialoguelint.mjs scenarios/m04_critical_failure/` | line-len 1, blank-reentry 2, none in the newcomer files (unchanged) |
| `lock_key_diff.rb` vs `baseline_locks.json` | empty |
| routes r41, r42 | both `all expectations met` |
| `inkcheck.js` / `loopcheck.js` on both newcomer files at `start` | **RUNAWAY** on every strategy (see m1) |
| Offline inkjs simulation of the engine's one-visible-line `continue()` (`systems/ink/ink-engine.js:34`) with save, reload and `aes_staff_off` flipped | one line per talk; curt line once the flag is true; saved state constant at 455 bytes over 30 talks |

## F1 judgement: sound

- **No loop on screen.** `InkEngine.continue()` stops at the first visible line, so `-> start` never runs away in the engine. Traced: talk 1 shows the line with no tag; the "get next line" read (`person-chat-minigame.js:1576`) returns the same line again carrying `exit_conversation` (an own-line tag attaches to the next line, which the loop makes the repeated line), and that branch closes without displaying it (`:1579` to `:1597`). Talks 2 onward: the restored story is mid-knot (`canContinue` true, `:530` to `:545` take "Continuing"), the next read runs tag, divert and the conditional and returns one line with the tag, shown then closed (`:1533`). Globals are synced before that read (`:582` to `:602`), so `aes_staff_off` is current.
- **Robust to save timing.** Whether the state is saved after line A or after the silent repeat, the next talk still yields exactly one line with the tag (checked both offline).
- **No leak into the exchanges.** Exchanges run on a separate inkjs `Story` (`systems/npc-needs-chatter.js:189` to `:194`, `exchangeLinesFromStory` at `:64`), entered by `ChoosePathString`, ending `-> DONE`, with a 200-step guard. They never touch the person-chat saved state. Offline: all three knots still print their 4/4/3 lines from a looped saved state.
- **No other runner hits the loop.** `resolveEntryKnot` (`phone-chat-conversation.js:229`) skips `currentKnot: "start"` (both NPCs, `scenario.json.erb:1668`, `:1708`); `collectSteps` (limit 500) and the phone read loops are phone-only; neither newcomer is a phone contact.
- **Reload:** live case c (games 8042) plus the offline restore. **Player-KO Restart:** `ui/game-over-screen.js:161` resets health and hostiles, saves, reloads: the same restore path as case c, with `aes_staff_off` still true, so the curt line is expected. Not proven live (m3).
- **Exactly one line:** yes in every case above. Spoken words unchanged, so cached audio keys are unaffected.

## Minors

### m1. inkcheck and loopcheck now report RUNAWAY on both newcomer files, unrecorded
`ink/m04_npc_ibrahim_diallo.ink:31`, `ink/m04_npc_joanne_pell.ink:22`; the skill's checklist (`references/checklists.md:8`, SKILL.md:242) requires both tools, and `LIVE_PROOF_6.md:56` lists only the validator and dialoguelint. The tools run `Continue()` with no stop on `#exit_conversation`, so a choiceless loop is a runaway to them. It is a false positive for the engine but will trip every future sweep. Fix: add a line to `BUILD_LOG.md` recording the result as an accepted tool limit, with the reason (engine stops at the first visible line; state size constant). Optional, via AC0: teach both tools to stop at `exit_conversation`.

### m2. Talk 1 reads the line twice (the second silently)
`ink/m04_npc_ibrahim_diallo.ink:22` to `:31`, same in Joanne's file; engine `person-chat-minigame.js:1576`. Harmless today, but any later hook on `continue()` output (transcript, heard tracking, prefetch) sees the line twice. Cleaner fix, checked offline with `bin/inklecate`: put the tag on each spoken line (`Joanne Pell: Hiya, duck. ... #exit_conversation`) inside both branches, drop the own-line tag, keep `-> start`. Every talk then returns one line with the tag in one read, no duplicate. If not taken, add one sentence to the ink comment saying the first talk reads the line twice and the close path drops the second.

### m3. L8 player-KO Restart clause still unproven (rest of R2 M3)
`PLAN.md:299` L8 last clause. Code reading says it works (above), but F1 made this case depend on the restored story. Fix: one live run: strike a newcomer, get KO'd, Restart, talk to the struck newcomer: calm, seated, curt line once. The five-try counts R2 M3 named for L1, L2/L7, the phone evacuation and the seated attack are also still short (2, 2, 2, 1); record them as accepted at that count or top them up in the playthroughs.

### m4. Stale line references and handover after F1
- `SPOKEN_LINES.md:11` to `:13` and `:22`: exchange knots now sit at `ink/m04_npc_ibrahim_diallo.ink:34` to `:37`, `:41` to `:44`, `:48` to `:50` (F1 added three lines). The normal (non-curt) talk lines (`:25`, Joanne `:16`) are not listed at all; add them if they are new and unvoiced.
- `HANDOVER.md` "Open" items 1 and 2 still describe F1 and the Vance call stall as open; both are closed (`LIVE_PROOF_6.md` F1, `VANCE_CALL_RECHECK.md`: a `converse` harness artefact). Item 1 also points at m05's cleaner as a pattern, no longer needed.
- `PLAN.md:296` L4 still names only the north door lane; R2 M1 asked to add "no door lane of the machine's room", which LP6 check 1 now supports.

### m5. F1's cause statement is not reproduced offline
`LIVE_PROOF_6.md:52` says the pre-fix save left `-> DONE` unread (`canContinue` true). An offline run of the pre-fix JSON (8724fd90b) through the engine's read rule ends with `canContinue` false after the tag read, which would have taken `restartAfterEnd`. The live trace in game 8039 may reflect a save point the offline run does not model; the fix is proven live either way. Fix: add "save point not pinned down" to the note. If the cause is an engine save before the tag is read, every one-line NPC ending `#exit_conversation` then `-> DONE` across missions may have the same re-talk bug; pass that to AC0 as a cross-mission check rather than fixing it here.

### m6. R2 minors still open
- **m2 pair render**: looked at `screenshots/lp5_c6_pair_before.png` for this review. Joanne and Ibrahim stand shoulder to shoulder at the counter under the kettle with a bubble ("Proper brew, none of that cooler stuff."); it reads as two people making tea, the player parked behind them. The hover tag "Ibrahim Diallo" sits beside the lower figure near the desks, which looks like a cursor tag, not the sprite: confirm, then close m2.
- **m3** deviation recorded; the user's yes via AC0 is still to be asked.
- **m4** sofa re-shoot still open.
- **m5** recorded for the integrator; the probe-library id guard is not built (fine to leave as a tooling note).

## R2 outcomes: reasonable?

| R2 finding | Outcome | View |
|---|---|---|
| M1 SCADA door | `LIVE_PROOF_6.md` check 1: 5/5 fresh games, no stall, closest 18 px, door timings normal | Closed. Only the L4 wording is left (m4) |
| M2 no end-to-end run | Running in parallel | Known-open, not counted |
| M3 probes and L checks | LP5 checks 1 to 4 and 6 pass; the bark gate seen held with Joanne KO'd (7971); L8 curt line and "past talking" pass (LP6); credits after a newcomer KO covered by r41/r42 | Mostly closed. L6 vent/hydrogen running in parallel (known-open); L8 Restart and five-try counts left (m3) |
| m1 Q7 record | Re-measured on the new cells (LP5 check 6) | Closed |
| m2 pair render | Screenshot exists | Nearly closed (m6) |
| m3 `--set` deviation | Recorded | Open until the user's yes |
| m4 sofa shot | Correction note added | Open (re-shoot) |
| m5 foreign games | Ids passed to the integrator | Reasonable |
| m6 cooler-lane stall | Accepted; LP5 did not reproduce it | Reasonable |
| m7 docs and routes | Fixed; r41/r42 pass | Closed, but F1 re-staled SPOKEN_LINES (m4) |

## Known-open (running elsewhere, not counted)

Full playthroughs on the clone and KO routes (R2 M2), the L6 vent and hydrogen-alarm cases, and the two renders.

## Not findings

- `VANCE_CALL_RECHECK.md`: the evidence (picks, still-open-after-close, game 8037 by `mg` steps reaching "Sound it") supports "harness, not game". The driving recipe is a useful gotcha for the playthroughs.
- Untracked screenshots in the worktree (`lp6_c2_talk_*.png`, `lp7_a1_at_vent.png`, `pt_clone_01_reception_sofa.png`) belong to runs in progress.
