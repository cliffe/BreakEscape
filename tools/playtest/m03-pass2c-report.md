# m03 pass 2c: short confirmation (game 1160)

Fresh game 1160, headless, session log `tools/playtest/m03-pass2c-session.jsonl` (1237 lines). Flags handed over (`<flag:N>`), VM work unproven.
Verifier: `tools/playtest/m03-pass2c-verify-game1160.txt` (4 flags submitted, 5 rooms beyond the first, `victoria_escaped`, `victoria_fate`, `clone_call_done`). Server: `status=completed`, `mission_concluded_at=2026-09-30 16:54:13 UTC`.

Secrets this run: reception badge and Victoria's card cloned in-game (earned); the flags were handed over. 5829 was not used.

| # | Item | Result | Evidence |
|---|---|---|---|
| 1 | Receptionist same-session re-talk | **PASS.** Day: after leaving via "I should head to the conference room" (line 67), talking again lands on the hub (Ask about Victoria / employees / history / Lean across / End). After the clone she goes to a hub without the Lean option. Night (after Victoria's clone): "Oh! You're still here? I'm just shutting down for the night." (closing_up), then re-talk without reload shows a single option "You're still here? It's late." No "(End of conversation)". The first closing_up line was read after the page reload in step 5, the re-talk was same-session. | lines 67-90, ~700-760 |
| 2 | Victoria clone, no RFID loop | **PASS.** Save on the Read screen returned to the conversation, which ran to its end ("I'll have my assistant send you the enrolment details"). Talking again in the same session gives one option "Thank her for her time" (idle, reply "We covered the main points"). No RFID loop. After the flags, re-talk played the night confrontation ("Victoria is standing by the window... Who are you with?"), not via a separate "Sterling. We need to talk." option; I saw none. Escape fate played, `victoria_escaped`, debrief, `status=completed`. | lines 557-560, ~1100-1140 |
| 3 | Danny re-talk | **PASS.** Chose "leave" (`james_fate=left`). Re-talk shows one option "Danny's still staring at the phone. Leave him." and his line "I'm still deciding. Let me." No "(End of conversation)". | lines 917-918 |
| 4 | Guard at night | **PASS.** After the cover story and "Leave conversation", re-talk shows "Talk to the guard", then "You again. I'm keeping my eye on you." with the five guard_idle options. | lines 789-790 |
| 5 | Reload after the clone, enter main_hallway | **PASS.** Reload at line 640, then entering `main_hallway` opened no phone chat. `clone_call_done` is set (line 611, 633). The call had fired on the first hallway entry before the reload. | lines 611-660 |
| 6 | Finish to completed | **PASS.** Four flags, Victoria escape ending, `status=completed`. |

Notes, none blocking:
- Keyboard walking out of the conference room stops at (-41,-90); a pointer click on the doorway crosses (same as before). Repeated "no-known-doorway" replies from `enter` are harness state, not the game.
- The HaX phone hub repeats after "Nothing right now"; the Close button exits. Minor.
- The clone Save now ran without the empty `.minigame-container` this time (the emulate at the server door also completed directly). D4 not reproduced in this run; one run is not proof.
