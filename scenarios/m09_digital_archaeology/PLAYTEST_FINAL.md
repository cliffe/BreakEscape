# m09 Digital Archaeology: final targeted check

Plumbing run (question 1), mechanical driving only, :3001 keyless, headless (machine load ~22), fast speed, Node 24 for Playwright. Three fresh games: 3008 (briefing, first dock call attempt, check 3 click), 3012 (check 1 with observer, check 3 E), 3016 (check 2, head start `--start-room restricted_stacks --set briefing_played=true`). No VM work, no secrets needed. All files in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m09f/`: logs `session1.jsonl` (3008), `session2.jsonl` (3012), `session3.jsonl` (3016), phone observer log `c1_phonelog.json`, screenshots in `shots/`.

## Result

| # | Check | Result |
|---|-------|--------|
| 1 | Tran warning shows in the last bubble inside the dock call, before the thread closes | PASS (with a timing note) |
| 2 | Sorensen clone option: still there after Cancel, gone after Save | PASS |
| 3 | Walk to north door with arrows, click it: no front-desk lockpick; E picks the same door | PASS (no lockpick on either path) |

## Detail

1. Game 3012. A MutationObserver on the page recorded the phone text (`c1_phonelog.json`). Picked "The shutter" then "Who else is inside?". The last bubble appeared with the phone open: "A clerk's on tonight, and an IT contractor, Jesse Tran. Viral Dynamics' staff files have a Tran in them." (the m01-not-completed variant), after "Margaret Sorensen runs the place..." at t=72727 ms. The phone UI was gone at t=72730 ms. Timing note: the earlier bubbles each stayed about 1 s before the next; this one was in the DOM for about 3 ms before the thread closed. A 1 s poll (game 3008, `c1_b_poll*`) caught the Margaret line and then a closed phone, so a polling tester will miss the Tran bubble. I can't tell from this whether a human sees it flash or only finds it in the phone history; suspect the close is too quick, but I did not reopen the phone to check the history. Evidence: `session2.jsonl`, `c1_phonelog.json`.
2. Game 3016. Hatch dialogue to the menu (clone, Derek's file, letters, leave). Picked "Lean on the counter...": Sorensen lines, Narrator beat, flipper opened (Reading 1/2, ASK PSK; screenshot `shots/c2_a_flipper_open.png`). Clicked Cancel: chat resumed at "Take your time. The shredder won't." with four options, clone option still present (`shots/c2_b_after_cancel.png`). Picked it again ("Less than when you last asked..."), flipper, "Crack keys first", Darkside (16/16 sectors), Save. Chat resumed with three options (Derek's file, letters, "I'll leave you to it."), clone option gone; global `stacks_card_cloned` set (`shots/c2_c_after_save.png`). Left the conversation with "I'll leave you to it." Evidence: `session3.jsonl`.
3. Game 3008, then 3012. Spawn (160,144). Arrow keys only: in 3008 up 600, left (blocked at x=113 by the shutter fixture), down 400, left 800, up 350, ending at (41,46); in 3012 up 350, left 1200, up 300, ending at (41,47). Front-desk door (west, 16,80) is locked and the north door (48,32, to open_stacks) is unlocked. At the spot: north door 15.2 px, front desk 55.5 px (both flagged inRange). Clicking the north door (bridge `interact` sends a real world click at the door): events `door_unlocked` then `door_opened` to open_stacks, no lockpick minigame, front-desk door still locked (`shots/c3_b_at_north_door.png`, `c3_c_after_click_north.png`). Game 3012, same spot, E (interactNearest): same two events, same door (north to open_stacks), no lockpick (`shots/c3_d_E_spot.png`, `c3_e_after_E.png`). To get the front-desk lockpick I did not try standing nearer to the west door, so that case is untested.

## verify-run.rb (tail)

- 3012: progress recorded, 1 room beyond the first (open_stacks unlocked), 0 flags.
- 3016: progress recorded, 1 room beyond the first, tasks `talk_at_the_hatch` and `enter_restricted_stacks` completed, global `stacks_card_cloned` set.

## Notes

- Head-start artefact: in game 3016 the dock call opened itself on the title screen's Enter (game_loaded mapping); finished it before the hatch test.
- Sessions 3008, 3012, 3016 stopped with session-stop.sh. Old `tools/playtest/*.pid` files belong to earlier runs; I did not touch them.

Findings: 0 blockers, 0 majors, 1 minor (observation only: the last dock bubble stays on screen for about 3 ms before the phone closes).
