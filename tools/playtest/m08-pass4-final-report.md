# m08 The Mole: pass-4 final confirmation playtest

Question answered: plumbing plus the specific dialogue fixes (not solvability; flags are session-supplied).
Game 1436, keyless :3001, headless (load was about 4), speed fast, one reload. Session log (scratchpad, not in repo): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/129f788c-d240-4d67-b97d-c380ab27daf1/scratchpad/m08-final/session.jsonl`. A MutationObserver (`obs.js` in the same folder) was attached to the document before the briefing and logs every dialogue line, speaker and `#bv-cr-label` change.

Reload: once, after the Netherton clone and before the server-room reader (title screen cleared with `bootstrap resume:"resume" maxSteps:12`; the briefing did not replay).

## verify-run.rb (game 1436)

```
unlocked rooms  8: main_lobby, director_office, operations_floor, intel_analysis, cryptography_lab, break_room, server_room, interrogation_room
unlocked objs   2: nightshade_locker, director_safe
flags submitted 4
globals set     47 (incl. netherton_card_cloned, nightshade_print_lifted, server_room_entered, all_flags_submitted, nightshade_confronted, fate_decided, nightshade_triple_agent, debrief_played, mission_complete, tomb_gamma_location_known; asked_next NOT set)
VERDICT: progress recorded: 7 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
```

## Earned secrets

| Secret | Value | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Director card | clone | Netherton hub, cloner Save | before the reload | yes |
| Locker 0x47 | picks | lockpick minigame, `completeLockpick` assisted | before the stick | no, exercised (dexterity) |
| Print match | Nightshade | locker label 0x47, compare offers two cards; pattern read from the screenshot | after the locker | yes |
| Safe PIN | 2407 | ops-floor Personnel Print Job ("Director M. Netherton (svc no. 2407)", "Every safe ... opens on its owner's service number") | after the printout | yes |
| Suite code | 5386 | Interrogation Suite Code Card in the safe | after the safe | yes |
| Flags 1 to 4 | `<flag:1..4>` | none: no VM in standalone | relay | **no, exercised**. Everything after the relay is proven for plumbing only. |

Not played this run: the door audit, archives and the badge printer route. The confrontation therefore ran on the generic (no named_on_evidence) opening.

## Step table

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Reopen Netherton and the Off-Duty Agent in the same session shows a line | PASS | Netherton: "Go. Whoever it is was one of us this morning..." (s01), after a second exit "Go. ..." again, and after the reload "Agent. What do you need?". Off-Duty Agent: "Mind the door." (s02). Speaker caption and hub both present. |
| 2 | Exit choices get an NPC reply | PASS | "I'll leave you to it." -> "Mind the door."; "Understood, Director." -> "Go." (s06); "I'm ready. Let me work." -> "Go. Whoever it is...". The player echo bubble still shows first, but an NPC line always follows. The brief's bracketed wording is stale: the choices now carry no brackets. |
| 3 | HaX "How do I get into the server room?" changes after all three suspects | PASS | "You've seen all three. Back to the Director, and stand close with the cloner. Or the visitor printer at reception." (not asked before the third interview, so the "before" text is not re-observed) |
| 4 | Print step points at the locker's owner | PASS | Stick observation ends "worth checking against the locker's owner."; HaX: "Check it against the locker's owner." |
| 5 | Nightshade's Montana line points at the right question | PASS | "Montana. Work out what Portland was really for, and where it went, and you'll have your Montana." The hub then offers "The four attacks were cover for something else. Weren't they?" |
| 6 | Hub ends on the database reveal and the Architect; closing line lands | PASS | Order on screen: why, when, PIN cracker, Netherton, Montana, database, "Then where did it go? Where's The Architect?" (coordinates and bunker), then only "Enough". Closing: "And 0x00. Let it hurt afterwards, not during." follows the countersignature narration. It is still a bare parting line with no stated referent, but sits after "Tomb Gamma won't wait for you to grieve me" so it reads as a teacher's last lesson. Opening recital captured (below). |
| 7 | Tomb Gamma hook plays without asking "Then what now" | PASS | Observer: "Montana in seventy-two hours, Agent. Tomb Gamma." then "Go home, Agent 0x00..." after "Nothing more, sir."; `asked_next` not set. |
| 8a | Worst lines read cleanly | PASS | Netherton: "There may be others in this service, recruited the same way and still waiting." / "I shall spend the rest of my career reading our own files." / "I shall carry it regardless. Thank you." Phantom: "The other two on your list..." and "When the logs back me, tell the Director I was right to look." HaX in person: "Don't make me say a name." Nightshade: "I've been grieving a long time, 0x00. Longer than nine days. It wears smooth." Off-Duty Agent: "Phantom's stopped being charming. Nightshade's the same as ever." HaX first call: "So I'm going to be very professional tonight. Bear with me." Not seen this run: "Don't rule anyone out because they wrote the list", "The truth clears people, properly examined...", Cipher's second and third exit variants. |
| 8b | Dashes show as " – ", not "--" | **PARTIAL FAIL** | Dialogue and credits are clean: 100 observer entries, none contain "--"; credits show "Coordinates given up in the interrogation room – Montana". A literal " -- " remains in object and item names and note bodies: "Staff Locker -- 0x47" (s03), "USB Stick -- PERSONAL_BACKUP.enc" (also in the fingerprint panel header, s05), "Go-Bag -- Locker 0x47", "Insider Threat Initiative -- 'Deep State' Brief", "Personnel Print Job -- Director's Investigation Request" and its body ("SAFETYNET PERSONNEL SUMMARY -- INVESTIGATION COPY", "(POLICY VIOLATION -- flagged...)"), "Sealed Psych Evaluation -- Agent 0x47" and body ("CLASSIFIED -- PSYCHOLOGICAL EVALUATION", "[SEALED BY ORDER OF THE DIRECTOR -- M.N.]"), "INTERROGATION SUITE -- DOOR CODE" and "-- M.N.", the safe description ("tonight -- biometrics are logged"), door name "Server Room -- Restr...". All come from scenario.json.erb strings, which the dialogue-side conversion does not touch. |
| Reload | One reload | PASS | Inventory and globals persisted, briefing did not replay. |
| Credits | Read via #bv-cr-label observer | PASS | Full text below. |

## Opening recital (captured on entering the suite, before any input)

1. Narrator: "The interrogation room records everything. Nightshade stands at the table with both hands flat on it. He doesn't sit."
2. "You found it. Forty-seven minutes on the Portland plan, two days before you deployed. My account, my terminal, my mail."
3. "The name they stripped off that intercept in the cable vault was mine."
4. "I could have scrubbed every trace years ago. You're wondering why I didn't."
5. "Because you'd already decided. I watched you do it, across my desk in the lab."
6. "Some part of me wanted it to be you who closed the loop. My student. You never did trust the quiet."
7. "And you printed the stick. Of course you did. I'd have told you nobody planted it, if you'd asked."

It auto-played with no input; the single choice then appeared ("It's over, Nightshade. Tell me why.").

## Credits (from #bv-cr-label, complete)

MISSION COMPLETE / THE MOLE / THE LEAK: Agent 0x47 'Nightshade', placed by ENTROPY during training and dormant for fifteen years / THE FATE: NIGHTSHADE: Left in place as a triple agent, on the Director's signature / TOMB GAMMA: Coordinates given up in the interrogation room – Montana / THE SUSPECTS: CIPHER: Cleared on the evidence. His post-quantum work goes on. / PHANTOM: Cleared. His off-book hunt pointed the right way. / RECOVERED: SEALED PSYCH EVALUATION: Read. The warning was in writing a year ago. / GO-BAG: Packed nine days ago. Never used. / THE USB STICK: His thumbprint on the casing. Nobody planted the mail. / THE SERVER ROOM: The Director's card, cloned off his lanyard while he studied the maps / GLOBAL THREAT DATABASE: Confirmed stolen during the four-site night / ON THE RECORD: AGENT 0x00 TO THE DIRECTOR: He's the crime, not you / THE ARCHITECT: At large, with every weakness SAFETYNET ever catalogued. / ENTROPY: Still operational.

## Session

Log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/129f788c-d240-4d67-b97d-c380ab27daf1/scratchpad/m08-final/session.jsonl` (1334 lines, 1333 commands), screenshots s01 to s06 in the same folder. Session stopped with sync then session-stop.sh. The headless Chromium processes still running on the machine belong to another run (game 1438, m02), not this one; left alone.

## Findings as I go (working notes)

- Brief wording says the exit choices are "[I'll leave you to it.]" and "[Understood, Director.]". Per DIALOGUE_REVIEW the rewritten text is now "Mind the door." (Off-Duty Agent) and "Go." (Netherton), so I tested whichever exit choice the hub actually shows.
- Step 1a: Netherton reopened after "I'm ready. Let me work." shows "Go. Whoever it is was one of us this morning. Bring me a name I can prove." with speaker caption and the hub below (screenshot s01-netherton-reopen.png). Not blank. PASS.
- Exit "I'm ready" gives an NPC reply ("Go. Whoever it is...") before closing; observer shows no lone demo_player bubble.
- Cipher, Phantom, Nightshade interviews read cleanly. Phantom: "The other two on your list. I'm not putting a name to either until I've seen a door log." and exit "Go and get onto that repo. When the logs back me, tell the Director I was right to look." Nightshade: "I've been grieving a long time, 0x00. Longer than nine days. It wears smooth." "It's a discipline. I could teach it to you..." No " -- " seen.
- Step 3: after all three interviews, HaX "How do I get into the server room?" answers "You've seen all three. Back to the Director, and stand close with the cloner. Or the visitor printer at reception." PASS (I did not ask before the third interview, so the "before" state is taken from the previous report, not re-observed).
- Step 1b: Off-Duty Agent reopened after "I'll leave you to it." shows "Mind the door." with speaker caption and the three-option hub (s02-offduty-reopen.png). Not blank. PASS.
- Step 2a: Off-Duty Agent exit choice is now "I'll leave you to it." (no brackets) and gets "Mind the door." from the NPC; no lone demo_player bubble. PASS. Netherton's exit "I'm ready. Let me work." gets "Go. Whoever it is was one of us this morning. Bring me a name I can prove." PASS. The clone-path "[Understood, Director.]" is tested below.
- HaX in person (break room): "Don't make me say a name." / "I used to envy one of them for how calm he is. Tonight I don't. Go and prove it, so I don't have to guess." Reads cleanly, no name.
- Step 4: USB stick observation (shown in the dusting panel header) ends "There is a clean thumbprint on the casing, worth checking against the locker's owner." HaX's lift text: "A print off the stick. Check it against the locker's owner. If it's his, nobody slipped that mail into his locker. He held it himself." Locker is 0x47; compare offers Netherton or Nightshade, I picked Nightshade from the locker label. `nightshade_print_lifted` true. PASS. (Locker opened with `completeLockpick`, assisted, exercised not earned. Print pattern read by eye from the screenshot, a whorl; s05-compare.png.)
- FAIL (item 8, dashes): a literal " -- " still shows in object names: locker title "Staff Locker -- 0x47" (s03-locker.png), contents "USB Stick -- PERSONAL_BACKUP.enc", "Insider Threat Initiative -- 'Deep State' Brief", "Go-Bag -- Locker 0x47", and the USB stick in the dusting panel header (s05-compare.png). These come from the scenario's item and object `name` strings, not from dialogue, so the dialogue-side dash conversion does not touch them. Dialogue lines read so far show no "--".
