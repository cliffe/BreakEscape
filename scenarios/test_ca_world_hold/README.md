# test_ca_world_hold (E2: world hold, plus E5 on the call flip)

Start room: `ep_room` (kiosk at the top, east door to `lobby`). Stub content; all lines are test text.
`world.holdUntil` is `tcw_world_done`, `holdMaxMs` is 20000 (20 s, shortened for the test).

What to click:

1. Kiosk: Begin the brief, then the osint stage (close the browser, nothing is required), then the write stage.
2. Make the call. The learner is moved into the lobby (Desk Clerk at the left, Guard at the right). Press Begin on the prep card, choose "Say hello", then "Ask for the door to be opened". Expected outcome: got_it.
3. Close the phone chat. Expected: the learner stays in the lobby. The runner does not reopen (this is the hold).
4. Hold ends on the done global: click the Guard, then "Done here." Expected: `tcw_world_done` and `tcw_guard_spoke` go true and the runner hands back to the kiosk and opens the flip. The flip's defender line reads "Test line: the hold ended when the guard conversation closed." under the heading "Test heading: guard" (E5, first match).
5. Hold ends on the cap: repeat steps 1 to 3 in a fresh game and do nothing. After 20 s `tcw_world_done` is written true by the engine and the flip opens. The defender line reads "Test line: the hold ended at the 20 s cap." (E5, second entry; `tcw_guard_spoke` stays false).
6. Optional checks: talk to the Guard while the chat is the last thing open at the 20 s mark (the hand-back should wait for the chat to close); reload during the hold (the hold settles and the next kiosk open goes on to the flip); choose "Never mind" in the phone chat (walked_away, which also holds).

Status: validated only (0 errors). Not yet run in a browser.
