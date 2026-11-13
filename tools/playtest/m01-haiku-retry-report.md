# m01 First Contact — solvability playtest (Haiku retry)

**Question answered:** solvability — can the mission be completed, earning each secret in-game before using it?

**Game id:** 985 (mission 32) · **Session log:** `tools/playtest/m01-haiku-retry-session.jsonl` · **Wall clock:** 605 seconds  
**Source of truth for steps:** `scenarios/m01_first_contact/SOLUTION_GUIDE.md` (baseline report route)

## verify-run.rb output (verbatim)

```
game            985  (mission 32)
created         2026-09-07 20:53:33 UTC
last write      2026-09-07 21:03:37 UTC
played for      605s of wall clock
current room    "reception_area"
unlocked rooms  1: reception_area
unlocked objs   0: 
inventory       2: Your Phone, Notepad
NPCs met        4: briefing_cutscene, sarah_martinez, agent_0x99, closing_debrief_person
flags submitted 0: 
globals set     7: briefing_played, confrontation_approach, current_task, final_choice, kevin_choice, maya_identity_protected, player_name

VERDICT: BOOTSTRAP ONLY — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
Nothing here could only have come from playing: the player never left
the starting room, opened anything, or submitted a flag. Globals and
encountered NPCs are set by mission setup and the opening cutscene, so
they are not evidence. A report claiming steps is unsupported.
```

Exit code 1.

## Earned-secrets table

**No secrets were earned or used in this run.** The playtest did not progress beyond bootstrap.

## Observation

The playtest failed to progress. Session log analysis shows:
- Bootstrap completed successfully (seq 1–3)
- Movement to Sarah O'Brien succeeded (seq 6–7)
- Interact on Sarah triggered her conversation minigame (seq 8–15)
- Subsequent commands to move or interact were blocked with `minigame-active` reason
- A `converse` command was issued on the wrong target (`reception_desk_phone` instead of `sarah_martinez`), compounding the issue
- Commands continued to send (421 total) but the game remained stuck in reception_area
- No sync was sent before the session ended, though the game appears to have been persisted in an early state

**Blocker:** The command sequence had a sequencing error — after Sarah's conversation minigame opened, the sequence attempted to move to another object (phone) and then call converse on that target. This was wrong: `converse` should have been called on `sarah_martinez` to drive her dialogue to completion and close the minigame. Without that closure, all subsequent world-state commands were refused.

The session harness correctly enforced that main-world input cannot run while a minigame is active. The playtest script had the wrong command order.

## Verdict

**Not solvable from this run.** The mission's solvability is unproven. Every step is unexercised; nothing was tested. The playtest command sequence itself was defective.

To retry: write a corrected command sequence that (1) calls `converse` on the right NPC id immediately after their minigame opens, (2) never attempts world-state commands while a minigame is active, and (3) sends `sync` before `quit` to persist global state.

**Required:** A fresh game and a corrected playtest sequence that successfully exercises the mission route.
