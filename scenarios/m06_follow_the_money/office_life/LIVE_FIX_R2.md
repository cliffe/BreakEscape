# m06 office life: live proof after build review R2 fixes

Tip before the proof: `8493e4b6a` (leash on the three floor NPCs). Keyless server from this worktree on :3096 (boot warning confirmed), puma PID 3556521, stopped by PID, port free after. One fresh game per run, headless, `setFPS(20)`, fixed steps on, no globals set from the page. Scratch scripts: build scratchpad `live/r4.mjs` to `r7.mjs`, outputs `live/fix_*.out`. Machine load was high, times are rough.

## M1: leash on a punched extra

| Game | Case | Result |
|---|---|---|
| 8311 | One non-KO punch on seated Lerato, player walks to the checkpoint | Pass. She turned hostile (HP 90), stayed on the trading floor and went back to (243, -251), 17 px from her post (235, -266), still hostile. The player stayed in the checkpoint 3 minutes and was never hurt (HP 90). On the unfixed build (8283) she followed to the lobby edge and knocked the player out in about 20 s. |
| 8322 | Same for Dani | Pass. Hostile (HP 90), at (172, -198) beside his post (160, -191) five checks over 25 s; he did not enter the checkpoint. The player had taken 20 damage before leaving the floor. |

Note: "Gave up the chase" is not logged by the probe; the evidence is position and room, which is the behaviour the leash promises.

## 10.2 item 4: away talk with Dani (games 8327, 8335)

- Queued (8335): chat opens, the trip resumes (`goto_target`, then `using` within 1 s), and he walks home to (160, -191) `atPost` by about 50 s after the talk.
- At the coffee point (8335): chat opens with the trading floor background (`m06_trading_floor_left_blended.png`); after it closes he is still `using`, finishes, `returning`, then home at post within about 35 s.
- Finding (not fixed): the queued talk used `m06_security_checkpoint_left_blended.png`, the wrong room. His queue cells (`dy: 1`, y about -136) fall where the pathfinding room bounds of the floor and the checkpoint overlap, so his behaviour `roomId` reads `security_checkpoint` while queued (the same label drift seen on bodies in REVIEW_BUILD_R2 Observations). The chat background is chosen from that label (`conversationRoomIds`, `person-chat-background.js:118`). It is only the brief queued stage and no line contradicts where he is. Options for the integrator: move the two queue cells north of the overlap, or accept it. No scenario change made.
- Game 8327: both talks reported `chat open` timeouts (chat did not open within 8 s of the interact resolving) and he still resumed and went home. Not reproduced in 8331 (debug run: chat open throughout) or 8335, so it reads as a harness or load flake; recorded, not explained.

## 10.2 item 7: Irina badge clone with staff walking (game 8382; control 8371 with staff at post)

With Dani queued or `using` at the coffee point and Lerato and Tomasz mid-trip: talk to Irina, `meet_irina` completes at the top (status `completed`), the clone option "(Let the cloner read her badge while she talks.)" opens the RFID cloner, Save gives "Saved: CTO Access Badge" and `irina_badge_cloned` becomes true, `irina_trust` 15. Identical to the control with all staff at post. Floor staff finished their trips during and after the chat. Pass.

Harness note: use `clickControl("Save")` by label. Clicking by the index from `getState().controls` hit "Abandon read" and produced "The cloner didn't get a clean read" (a harness error, not a game fault).

## Credits (lerato_ko, tomasz_ko)

No short route to the mission end exists (it needs the VM flags and the whole chain), so this is checked statically. Entries at `scenario.json.erb:275` and `:276` in the music credits list: `LERATO DLAMINI (FLOOR COORDINATOR): Knocked out, had done nothing wrong` with `condition: globalVars.lerato_ko`, and the Tomasz line on `globalVars.tomasz_ko`. Both globals are declared false (`:792`, `:793`) and set by `globalVarOnKO` (`:2044`, `:2084`); KO runs 8296 and 8278 (LIVE R2 probe) saw `lerato_ko` and `tomasz_ko` become true. Not seen on screen.
