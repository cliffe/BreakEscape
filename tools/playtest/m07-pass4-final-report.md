# m07 pass-4 final confirmation playtest

Game 1416, keyless :3001, headless. Session log: tools/playtest/m07-pass4-final-session.jsonl
Question answered: plumbing + words (single run, one reload). Findings appended as I go.

Deviation: `bootstrap` auto-clicked the opening cutscene choices (it does that by design) before I could drive them; the Netherton briefing conversation itself (side-by-side, projections question, commit to Fracture) was driven by hand.

## Findings log

- Briefing: "Where did these projections come from?" now answers "The threat desk, modelling off the intercepted tasking..." then "Read them how you like, Agent. A life, a vote and a decade of our security do not convert into each other." Fits. Commit Fracture; `hurt_line_said` true before the phone is opened. Netherton: "The operations floor is past the security checkpoint, and one guard on that shift is compromised." PASS.
- HaX first thread: "HaX here, Agent. I've got your channel and the board." / "Get past the checkpoint to the operations floor. Call me when you hit something you can't open." / "Team's turned. Two of the three go unanswered tonight. Let it hurt afterwards, not during." No if/if-not line. PASS.
- HaX layout (before any login): "North of the server hall, the control room, on a password. The engineer in the server hall knows it, and their own network leaks it." PASS. Clock before login: "No clock yet. The sequence waits on the host that drives it. The moment you log in there, assume they start it." / "So open the control room door first..." PASS. After the layout the menu (Layout / Clock / Understood) stayed up, so both are readable in one visit. PASS.
- Architect first call (ops floor): bark is "Agent 0x00." only (screenshot m07-final/contacts1.png). Thread opens "Agent 0x00." then narration then "Don't look for the trace. It isn't there." once, no doubling. Narration "Your handset lights without ringing..." renders centred italic, no "Narrator:" prefix (m07-final/arch1.png). PASS.
- Contact-list preview after the call: "Let it hurt afterwards, not during. I ex..." (a spoken line). Dead-air: "The line drops. Your handset reports no call in the log." / [Check the line.] / "A carrier tone on a channel that should not have one. Nobody on it. He calls when he chooses." / [Hang up.]. Reads cleanly. PASS.
- Hang-up loop: after [Hang up.] the contact preview reads "You: Hang up." (the player's own line, not a spoken Architect line), and the thread still cycles [Check the line.] -> "A carrier tone... Nobody on it." -> [Hang up.] -> "The tone stops a half-second before you do." Reads cleanly; the narration lines are centred italic, no prefix (m07-final/arch3.png). Minor: the preview is the player's line once the thread has been hung up on.
- Ops floor: shift handover sheet -> `badge_pin_found`; plant key -> `maintenance_key_found`; badge station PIN 0616 (earned from the sheet) -> badge; server hall opened with the badge. Flag 1 (harness) -> Relay Decode; read it -> HaX "That's their own table. Austin was briefed low on purpose. If the team isn't where it should be, call me while there's still time." Redirect to Trojan Horse -> "Redirecting. Austin confirmed, forty minutes out." / "Done. It's logged under your name." / "The ones you couldn't reach are on ENTROPY." PASS (the "half" line is fixed).
- After the redirect, HaX topic "The share -- four operations running off one schedule." ends "The team's in Austin. That's where this says they should be." No suggestion to move the team. PASS.
- Elena (server hall): "If you're not one of his, you're law." (no longer Hollis's phrase). Mercer topic: "Twenty years at the Department of Energy..." PASS. Her HaX topic is only offered once `elena_outcome` is set, and I left it blank ("I need to keep moving"), so topic_elena after a redirect was not exercised (topic_traffic was).
- Flags 2-3 (harness, not earned). Password CascadeWindow19 read from the Listener Capture and typed at the control room door. After flag 3 the "Remind me" > "What's the clock?" answer: "It's running. Fifteen minutes from your login on their host. Get root, then put the abort in at the control room console." PASS; layout/clock menu still there afterwards.
- Mercer (read the projection first): "I costed the hypothermia column myself. The modeler kept rounding down..." (US spelling). Choice "Call it a submission if you like. It's a spreadsheet of the dead." answers "This is the third submission." No asterisk cues seen in what I read. "On the record" ending chosen.
- Harness note, not a game finding: `mg choose` with a regex on the 8-choice HaX hub reported ok (key "7") but nothing happened; `mg clickText` on the choice text worked. 
- Flag 4 (harness) -> abort at the Cascade Control System; closing it opened the Architect call at once. The thread's top line there is the earlier t-20 bark "You've sent your team." followed by narration "The countdown on the wall stops. Your handset rings anyway." (centred italic, no prefix). Sign-off: "You saved eight point four million people. I'm not being sarcastic." / "...Late, but you moved them." / "You lost tonight." -> "I wasn't playing for tonight." / "You'll have the figures too. Then we'll both know the same thing about you." (fixed). No "Don't look for the trace" at the sign-off. PASS.
- HaX sign-off text: "Grid's held. Netherton wants you. The plant's south of the server hall if you want anything bagged. Call me when ready. Nine minutes from the abort, he's on anyway." PASS (location and nine minutes). "What's the clock?" after the abort: "No clock now. The abort's in and the grid's holding." PASS; layout still reachable from the same menu.
- RELOAD (session restart after the abort and sign-off, `resume`): no briefing replay, inventory and globals kept, Architect and HaX threads restored, narration lines still render centred italic from history (m07-final/arch-reload.png). Minor: the Architect thread shows [Hang up.] again after reload although it was already used (harmless).
- Plant: key opened the generator hall. Before the keypad, HaX hub offered "The vault keypad. Where do I get the code?". Plate read in-game ("ATS-1, S/N 0098-4703") + decode rule -> 4703 (earned). After the keypad opened, HaX text "'Don't write it down,' so they riveted it to the door..." arrived and the vault-keypad choice is gone from the hub. PASS.
- Debrief (played after "Bring me in."): Meltdown line now "Eighty to a hundred and forty patients did not survive that week, waiting for operations the hospitals could no longer schedule." "...saving eight point four million others." Netherton on Mercer: "And you told him he was only there to keep us busy." (matches the choice taken). "What happens to me now?" -> "Regulation requires seventy-two hours of recovery leave..." then "Then you will be read into something I would rather not be opening." / "Anything else?" (no dangling "Ask it."). Editorial narrator line about "different speeds" is gone. All read correctly.

## Possible awkward lines (new, all minor)
- Architect contact preview reads "You: Hang up." once the player has hung up (the last item is the player's own line). Not a spoken Architect line, as it was before the hang-up.
- Architect sign-off thread begins with the stale bark "You've sent your team." (the earlier t-20 bark in the same thread), then the sign-off narration. Reads fine on a redirect save but is old news by then.
- After a reload the Architect thread offers [Hang up.] again though it was already used.
- Netherton in the debrief: "Three briefs. One team." when four operations were on the schedule (three were briefed). Probably intended.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Team commit / redirect | Fracture then Trojan Horse | Briefing choice; decode + HaX hub | briefing, after flag 1 | yes (player choices) |
| Badge station PIN | `0616` | Shift Handover Sheet, ops floor | after reading the sheet | yes |
| Plant Maintenance Key | item | tray, ops floor | ops floor | yes |
| `scada_attack_host:flag_1..4` | `<flag:1>`..`<flag:4>` | none (no VM in standalone) | flags 1-4 | **no, exercised, not earned** |
| Control room password | `CascadeWindow19` | Listener Capture (flag 2 reward) | after flag 2 | yes, but behind an unearned flag |
| Vault keypad | `4703` | ATS-1 plate text "S/N 0098-4703" + rule in the relay decode (flag 1 reward) | generator hall | yes, but behind an unearned flag |

Nothing was set from the console. Everything past the flag rows is exercised, not tested, as far as the VM work goes.

## Summary
Session logs: tools/playtest/m07-pass4-final-session.jsonl (segment 1, to the abort and sign-off), tools/playtest/m07-pass4-final-session-seg2.jsonl (after the reload; segment 1 is also copied to -seg1.jsonl). Screenshots in the scratchpad m07-final/. Every requested confirmation passed. verify-run: "progress recorded - 5 rooms beyond the first, 2 objects unlocked, 4 flags submitted".
