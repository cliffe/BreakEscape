# m06 pass 5, struggling run A fixes: browser confirmation (commit fc3c6a86)

Targeted regression check, not blind. Keyless :3001 only, headless, own games only (2374, 2377, 2381). All three sessions stopped; :3000 untouched; no mission or engine files edited. Harness scripts only (`new-game.rb`, `session-start.sh`, `cmd.sh`, `session-stop.sh`, `verify-run.rb`). SecGen XML and the four exploit guides were not opened; no flags were needed or submitted.

Load average was 17-28 the whole time, and each harness command cost one to several seconds. The game clock was fine (patrol dwell and walk timings came out at their configured values), but anything that depends on a player's reaction time is not representative.

## Games and evidence

| Game | Used for | Session log |
| --- | --- | --- |
| 2374 | Items 1, 2, 6 (sight openers) | `tools/playtest/m06-pass5-struggA-fixcheck-A-session.jsonl` |
| 2377 | Items 3, 4, 6 (briefing), reload | `tools/playtest/m06-pass5-struggA-fixcheck-B-session.jsonl` |
| 2381 | Items 5, 6 (talk openers) | `tools/playtest/m06-pass5-struggA-fixcheck-C-session.jsonl` |

Screenshots (session scratchpad `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/`): `B01-standoff.png`, `B02-after-walk.png`, `B03-after-reload.png`, `B04-sitdown.png`, `A01-pick-open.png`. Measurements came from an in-page sampler (200-250 ms) reading Kemal's sprite, his behaviour state and the engine's own `isInLineOfSight` (range 150, angle 120) against the player's centre.

Exercised, not earned: all rooms except Satoshi's office were pre-unlocked in the DB (so no VM flags, no passphrase, no Volkova route). The fund in game 2377 came from the custody console (slot 4471, a known value, not deduced). The pick was completed with `completeLockpick` (assisted; the pick gate and the door unlock are real). In game 2381 I called `playerHealth.heal` on a timer to keep the player alive while watching Kemal. Player teleports (`setPosition`) were used only in failed first attempts at the pick approach; the passing pick run used no teleport.

## Results

| # | Item | Result | Evidence |
| --- | --- | --- | --- |
| 1a | East dwell about 4 s at (6,4) facing east | **PASS** | Sampler: arrive 364.0 s, leave 368.2 s (4.2 s); behaviour direction `right` throughout. Next cycles: 4.0 s. |
| 1b | West dwell about 6 s at (3,4) | **PASS** | Arrive 370.2, leave 376.4 (6.2 s); 6.2 s again the next cycle. Direction `left` (facing the data-centre door). The west dwell does see the west door: a sight chat opened on arrival at the data-centre door. |
| 1c | A window of about 9-10 s to pick Satoshi's door unseen | **PASS, slightly shorter** | With the player at the door (577,-858): unseen from the moment he leaves the east dwell until he is back at x 445 on the return, 382.6 s to 391.4 s = **8.8 s** per loop. At the corridor spot (535,-835) it was 8.2 s. About 8-9 s, not 9-10. |
| 1d | Try the pick in that window | **PASS** | Game 2374: `interact` on the door right after he left the east dwell. The lockpicking minigame opened (no catch conversation, no `lockpick_used_in_view`). It stayed open while he walked back and was in view for about 6 s (the gate only runs at pick start). Completed assisted, `door_unlocked` and `door_opened` fired. Evidence line: log seq 154-160. A pick started while he dwells east is caught ("A hand the size of a shovel...", seen in game 2377). |
| 2a | Hostile Kemal is winnable (75 / 3) | **PASS** | Game 2374, jab mode, 10 punches (10 damage each, 500 ms cooldown) KO'd him in 18 s of fighting; the player lost about 24 HP (49 to 25) in that stretch, one 3-point hit per 2 s (`attackDamage 3`, `attackCooldown 2000`). Chase speed about 70 px/s (435 to 331 in 1.5 s, game 2381), consistent with 75. Won once with real punches, no `debugKO`. The player lost 48 HP before the fight only because my commands were slow. |
| 2b | HaX texts the fight controls on hostile | **PASS** | Phone history (DB, game 2374): "He's coming for you. Q for your fists, then E or click when he's in front of you. He's slow; step back between swings. Or back off." arrived at the moment of the first punch. |
| 3 | Casualty-line stand-off, door unlocked, Kemal leaves, stays hidden after reload | **PASS** | Game 2377 (fund taken from the console; Kemal caught the picks, so `cover_blown` then the stand-off). Choice 1 "(Show him the casualty line on the fund.)" played the narration and three lines. Afterwards `minder_walked` true, sprite `visible:false`, door `locked:false` (B02). After a page reload (Resume, then walking back to the wing) the sprite was still `visible:false`, no sight chat fired, door still unlocked (B03). Satoshi then opened with "I heard the lift. Kemal walked out, didn't he?..." |
| 4 | Satoshi "Sit down. (Make him.)" | **PASS** | Game 2377: "Make me." then the narration "He comes off the desk with his fists up. This is going to be a fight."; HaX text "He's fighting. Q for your fists, then E or click when he's in front of you." arrived (DB phone history). The fight started (player HP 90 on the next read). |
| 5 | D8: does hostile Kemal follow out of the wing | **YES, one room** | See "D8 observation" below. |
| 6a | Repeat openers vary (talk) | **PASS** | Game 2381, four talks: first meeting narration, then "You again. The answer has not changed." / "Still here. Still closed." / "Again? My answer is the same." (cycle of three). |
| 6b | Repeat openers vary (sight) | **PASS** | Game 2374, sight chats: "I told you once. This floor is closed." / "Back again. No." / "You are persistent. I am more so." (all three seen). |
| 6c | Briefing says "Two payments we've traced so far." | **PASS** | Game 2374: "Agent HaX: Two payments we've traced so far. One came in, one went out, and both went through the same exchange." (before the first choice: "Which payments? / Which exchange?"). |

## D8 observation (hostile Kemal and room changes), game 2381

Setup: Kemal hostile (punched in jab mode, then back to interact mode), later (after a KO, Restart and Resume, which kept `minder_hostile`) a clean pass through the rooms. Times are the sampler's seconds; "P" is the player, "K.beh" is Kemal's behaviour `roomId`, "K.npc" is `npcManager.npcs.get(...).roomId`.

First fight, game 2381: the player walked wing, west door, data centre while hostile Kemal was adjacent. The player left the wing at about 100.8 s; at 110.5 s Kemal's behaviour room was `data_center`, sprite at (302,-844), still `chase`; at 118 s `nearby` listed him in the data centre and the player was KO'd (HP 0) at 289,-846. HP loss was inflated by harness latency.

Clean pass after Restart and Resume (the player starts in `reception_lobby`; he stays `hostile` but the wing's sprite does not exist until the wing is entered):

| Time (s) | Event |
| --- | --- |
| 50.0 | P enters `executive_wing`. K.beh executive_wing, `patrol` at (512,-799), east dwell. |
| 53.6 | K starts `chase` (P at x 366, about 150 px). |
| 54.0 | P enters `data_center` (P (308,-847)). K still in the wing, chasing at about 70 px/s. |
| 56.5 | K reaches the wing's west doorway (331,-851). It stalls there. |
| 62.3-62.5 | K.beh flips to `data_center` (316,-846), `chase` (8.5 s after P entered the data centre; about 6 s of that was the stall at the doorway). K.npc still reads `executive_wing`. |
| 62.5-81.2 | K chases inside the data centre next to P until P leaves. |
| 81.2 | P enters `server_room`. K.beh `data_center` at (278,-792), state `patrol` (not chase). |
| 82.6 | K.beh back to `executive_wing` at (330,-793), `patrol`. He does not follow into `server_room`. |
| 109 onward | P in `trading_floor`, then `security_checkpoint`, then `reception_lobby`: K stays at (334,-794) in the wing, state `patrol`, `hostile` true, never moves again while the player is away. |

Answer: a hostile Kemal does cross one door and follow the player into the adjacent room (the data centre). The engine intends this: `npc-behavior.js:615` ("This allows hostile NPCs to chase across rooms"). He stops once the player moves on a further room: he switches to patrol, returns to wing coordinates, and parks near the wing's west door. Not covered: walking the player through the data centre and out the far door while he is mid-chase (my harness latency made that impractical). Timing numbers above are from a loaded machine, so the crossing delay may be shorter on a quiet one. The mission does not need a change for D8 to be called answered; whether hostile NPCs should cross rooms is still the orchestrator's decision.

Related: after KO, Restart and Resume the player respawns in `reception_lobby` with `minder_hostile` still true (this is S2, already in the backlog). Kemal does not come looking for the player; he is only active once the wing is loaded.

## New findings

| # | Sev. | Finding |
| --- | --- | --- |
| N1 | minor | **Ghost vision cone.** After Kemal walks out (`minder_walked`, sprite `visible:false`) the LOS cone and range circle (`los.visualize: true`) are still drawn in the wing, both straight after the walk-out and after a reload (B02, B03). A player sees a green cone with nobody in it. Likely fix (not applied): hide or skip the cone for a hidden NPC (a mission-side `los.visualize` toggle cannot be switched at runtime, so this probably needs the engine or the hide handler). |
| N2 | minor | **Combat mode swallows pointer movement.** While in fists mode (Q), clicking to walk does not move the player. With the player at 471,-772 three `enter` attempts left the feet unchanged until the mode was set back to `interact`. HaX's text says "Or back off" but never says to press Q again first. A struggling player who wants to run (the hint's own advice) may click, swing and take hits. Observed through the harness's pointer-based movement, not a human; keyboard movement was not tried. Suggest adding "Q again to put your fists away" to the "He's coming for you" text, or confirming that keyboard movement works in combat mode. |
| N3 | minor | The pick window measured 8.2-8.8 s, not 9-10 s (comment in `scenario.json.erb` and the log say 9-10 s). Cosmetic; adjust the wording or leave it. |
| N4 | minor | **Reaching the door unseen on foot is tight.** From the data-centre door the first stretch is in his cone whenever he is walking west or dwelling west, and at the east dwell the door itself is in his cone. In this run the player stood at the door when the window opened (setup shortcut for the approach) and every walking approach in the wrong phase triggered his sight chat. The only approach spot I found that stays unseen across his turn was about (494,-850), 15-20 px west of his east dwell, which a player would not find by accident. It is workable (a sight chat is dismissable, and the 20 s cooldown after it lets the player act in the window) but "when he walks back to the data-centre end" assumes the player is already beside the door. Decision for the orchestrator: fine as is, or have HaX name where to wait. |
| N5 | minor | A player who gets caught picking (game 2377) and then talks to him reaches the stand-off with the casualty line available only after the fund is found, as designed. No issue; recorded because the route from "caught picking" to "stand-off" worked first time. |

No blockers and no majors found in this check. The Kemal fix list S1, S6, S7 and S8 behaved as written.

Needs checking against SecGen by the user: nothing new (no VM content touched).
