# m08 "The Mole" — QA Walkthrough (PASS 3)

Matches `scenario.json.erb` after the pass-3 puzzle-chains implementation. See
`PUZZLE_CHAINS_PLAN.md` (pass 3) and `PASS2_IMPROVEMENTS.md` (pass 2) for why.

Codes: safe PIN **2407** (the Director's service number; 4719 is Nightshade's
and fails), interrogation suite PIN **5386** (ERB `suite_code`; card in the safe,
or Netherton after the door-audit check), archives password **TrustNoOne**
(break-room post-it only), badge printer PIN **0311**. Flags arrive through the
Evidence Relay Terminal in the server room. Start kit: phone, picks, RFID cloner,
fingerprint kit; no PIN cracker.

Clock (all UTC; the Citadel keeps UTC): plan opened D-2 10:38–11:25. Door audit
CL-1: 07:52 IN 0x3C; 10:15 IN 0x47; 10:24 IN / 10:32 OUT 0x23; 11:43 OUT 0x47.
LIB-2: 10:35 IN 0x23. Phantom airborne 10:09–11:54.

## Critical path

| # | Action | Expected |
|---|---|---|
| 1 | Load the mission | ATHENA's opening cutscene plays once (`briefing_played`) over the cutscene playlist; she logs the kit and says the PIN device is in Technical Analysis. It does not replay on resume. When it closes, the music moves to noir and HaX's first message arrives (~2.5 s). |
| 2 | Go north to the Director's office and talk to Netherton | `brief_with_netherton` completes and `brief_taken` is set on the **first line** of the meeting. The aims `work_the_suspects` and `get_into_the_repo` unlock. Ask for access: you receive "Director's Access Keycard -- All Zones" (`netherton_keycard`; the pickup sets `netherton_card_taken`). If the conversation is closed before the card arrives, "[I'll need access.]" stays in his hub until it does. Close and re-talk: the hub returns, not "(End of conversation)". |
| 3 | Interview Cipher (ops floor), Phantom (intel analysis, north of ops), Nightshade (Crypto Lab, west of the lobby) | `<name>_interviewed` is set on the first line. The interview task completes then if the brief is taken, otherwise the moment it is (brief-gated mappings, lesson 27). Re-talk returns to the hub. | (PASS 3: the interviews are required for the aim "Work The Three Suspects"; a KO of the suspect also completes his interview once the brief is taken.)
| 4 | Ops floor → east: badge the server-room door | `server_room_entered` is set; `breach_server_room` completes (after the brief). HaX offers the recon guide. |
| 5 | Exploit GitList; submit flags 1 and 2 at the relay | One HaX message per flag (flags 1, 2 and 3 each offer a guide; flag 2's is the secrets-in-git-history sheet). Music stays noir (the old flag-2 "tension" cue named a playlist that does not exist; removed in pass 3). `get_into_the_repo` completes. |
| 6 | Log in with the recovered credentials; get root; submit flags 3 and 4 | Flag 4: `mole_identified`, `database_theft_understood`, music → threat. When all four are in, `all_flags_submitted` latches (on `closing_debrief`), HaX sends "That's the whole chain", and the Crypto Lab Nightshade is hidden. |
| 7 | Ops floor: read the personnel printout | Its "Requested by" line gives the Director's service number, 2407. The margin says every safe opens on its owner's service number (it no longer adds "The Director's included"). |
| 8 | Director's office: open the safe with 2407 | Holds the Interrogation Suite Code Card (5386; `suite_code_found` on reading) and the sealed psych evaluation. |
| 9 | Crypto Lab → south: key 5386 into the suite keypad | The door opens. Picks are not offered (PIN lock). |
| 10 | Enter the interrogation room with all four flags in | The confrontation opens (hq2, **cannot be closed**). `confront_nightshade` completes on its first line. |
| 11 | Work the hub; choose the fate | `decide_the_fate` completes at the choice, which sets `fate_decided` plus `nightshade_arrested` XOR `nightshade_triple_agent`. If Tomb Gamma wasn't asked about, he gives it anyway (`tomb_gamma_location_known`). |
| 12 | The confrontation closes | The debrief opens straight away (hq3, cannot be closed). `debrief_played` is set on line 1. `take_the_debrief` completes on the **last** line. Then victory music, credits, and the bond visualiser. |

## The investigation (optional, scored)

| # | Action | Expected |
|---|---|---|
| I1 | Break room: post-it on the coffee machine | Archives password and printer PIN. ATHENA only hints ("near the kettle"). |
| I2 | Break room: the timeline (or the server room's auth excerpt) | `found_timeline` (or `found_access_logs_hint`). Opened D-2 10:38–11:25 UTC. |
| I3 | Break room: talk to the off-duty agent | Testimony: in from before eight; someone at the bench, just gone twenty past ten; "build of the nerdy one, Cipher. Or not." `witness_heard`. On re-talk or after a reload: "Still here…" and a hub option repeats the testimony. |
| I4 | Archives (TrustNoOne): Badge Audit Printout | `found_badge_audit`; `read_the_archives` completes after the brief. |
| I5 | Ask each suspect "where were you" first, then the audit beat | Cipher: "Eight minutes… token cabinet" (`cipher_audit_confirmed`). Nightshade: "I'm always here… Bring me the account." (`nightshade_audit_confirmed`). Phantom: "So it printed." Cipher's and Nightshade's beats need `asked_alibi`; Phantom's doesn't. |
| I6 | Netherton: "[I've been through the door audit, sir.]" | No clock read → "Bring me a clock" (free). Clock but no confirmation → "take it to the people on it" (free). Otherwise: 10:38 → Nightshade → "out of the lab at 10:32" → "The people on it confirm their own rows". `name_the_mole` completes, `named_on_evidence`; he says the code (5386) and points at the safe. "[The suite code again, sir?]" repeats it. |
| I7 | Wrong answers | Each sends you back to the hub with a correction, restarts from the first question, and sets `audit_misread`. The third closes the check (`audit_closed`; the option disappears). "[Let me read it again.]" is free at every step. If Cipher and Nightshade are both KO'd unconfirmed, the check passes in three steps. |
| I8 | Nightshade's locker (break room) | Picks; or ask Nightshade "[Your locker…]" after his audit or Okafor beat (he gives the key); or KO him (key drops). Holds the USB stick (PERSONAL_BACKUP.enc; HaX offers the CyberChef guide), the 'Deep State' brief and the go-bag (flight to Helena, unused). |
| I9 | CyberChef (Crypto Lab) | ROT13, then From Base64: the sent mail from `nightshade_deep_state`. Optional; nothing records it. |

## Order variants (must all work)

- **Suite opened before the flags (code from the safe or Netherton):** the room is empty, the evidence wall reads "Awaiting evidence", and the disposition screen reads "No detainee". The confrontation opens on the first entry after all four flags are in.
- **Netherton's check reopened mid-way:** End Conversation at a step, then re-talk: no question repeats and no misread is added. If flag 4 lands in between, the re-talk lands on the hub.
- **Flag 4 submitted before flags 1–3:** HaX names Nightshade but asks for the rest of the chain. No confrontation yet. HaX hub: "Why isn't he in the interrogation room yet?"
- **Badge printer route:** break room post-it → PIN 0311 → reception printer (a `pc` container) → "Printed Server-Zone Badge". HaX sends the m03 callback line. Opens the server room.
- **Archives:** post-it password only (ATHENA hints). Optional; `read_the_archives` sits in `work_the_suspects`.
- **Nightshade's desk:** a bare `pc` that reads "0x47 -- SESSION LOCKED." and opens no container.
- **"End Conversation" in the confrontation (engine ignores disableClose for that button):** before the choice, HaX nudges you to step out and go back in, and re-entry reopens the scene from the start. After the choice, the outcome (fate, `fate_decided`, Tomb Gamma) is already written, and the debrief opens on the close.
- **Netherton KO'd:** his keycard drops beside him if he hadn't handed it over (KO drops `itemsHeld`). HaX's KO text and her server-room answer say so, then give the printer route; the confrontation's countersign lines change.
- **Reload mid-confrontation (before the choice):** re-entering the interrogation room reopens it. After the choice, it skips to `after_choice`.
- **Reload mid-debrief:** the debrief does not replay. The next room entry completes `take_the_debrief` and sets `debrief_backstop_fired` (backstops on `opening_briefing_cutscene`, gated on `!mission_complete`), which plays the victory track and the same credits as a normal close (PASS 3, playtest E7). The rest of the debrief is not heard.
- **Aim ladder (lesson 27):** do everything you can before seeing Netherton: interview all three, open the archives (post-it password), print a badge and enter the server room. No later aim should appear. After the brief, those tasks tick at once. Residual: a flag *submitted* before the brief still reveals its aim, because `submit_flags` can't be gated.

## Branch variants

- **Fate arrest vs triple agent:** debrief `disposition`, the disposition screen, and credits differ.
- **Accused Cipher and/or Phantom to his face** (`accused_cipher`/`accused_phantom`): debrief `the_hunt` line and credits. After flag 4, each offers an apology beat.
- **suspect_theory** cipher/phantom/nightshade/unset: debrief and credits.
- **Door-audit check:** `named_on_evidence` (± `audit_misread`) or `audit_closed`: debrief `the_hunt`, the confrontation's door-log line, and THE CASE credit.
- **Go-bag read:** HaX in person's line, the confrontation's Montana question, GO-BAG credit.
- **nightshade_suspected:** confrontation opener and debrief line.
- **debrief_stance** defended/owned: debrief and credits.
- **Netherton KO'd:** opening joke in the debrief, plus a credits line.

## Knockout matrix

| KO'd NPC | Expected |
|---|---|
| Director Netherton | `brief_with_netherton` completes (taskOnKO). His keycard drops if not yet given. HaX (`npc_ko:director_netherton`) mentions the card, the printer route and that the name waits. The door-audit check is lost; the safe still gives the suite code. |
| Cipher / Phantom | HaX reacts; the interview and audit beat are lost. The check needs one confirmation (Cipher or Nightshade); if both Cipher and Nightshade are down unconfirmed, it passes in three steps. |
| Nightshade (Crypto Lab) | HaX reacts; his locker key drops; the confrontation opens with "You put me on the floor of my own lab"; credits line. Hidden when all flags are in. |
| HaX in person | `hax_ko`; HaX texts from the floor; credits line. |
| Give → reload → KO (E22) | Netherton's card or Nightshade's key may drop a second copy. Expected and harmless: nothing ticks on pickup and the give isn't re-offered. |
| Nightshade (confrontation) | Hidden through the scene, so it should not be reachable. Safety net: `npc_ko:nightshade_confrontation` sets arrest + `fate_decided` and completes `decide_the_fate`; the debrief's no-coordinates branch covers it. |

## Automated checks

- `ruby scripts/validate_scenario.rb scenarios/m08_the_mole/scenario.json.erb`: 0 errors, 1 warning (the confrontation cutscene is deliberately not onceOnly; see PASS2_IMPROVEMENTS).
- `./scripts/compile-ink.sh m08_the_mole`: 12/12.
- `inkcheck.js` on every entry knot and the re-entry states; `loopcheck.js` on every hub.
- `ruby tools/pass2/render.rb … && python3 tools/pass2/door_align.py …`: 8/8 OK.

## Pass-3 static checks (2026-10-01)

- Validator 0 errors, 1 warning (as pass 2); doors 8/8; ink 12/12; rendered-JSON assertions
  (`scratchpad/m08_assert.py`): times agree, one code source, no "maximum", no narrator verdicts,
  E18 clean. inkcheck/loopcheck over the state matrix in `PUZZLE_CHAINS_PLAN.md` §7.

## Known follow-ups

- SecGen flag order vs a real build (see the approval log, m08 §2). If the build numbers the flags differently, swap the four `flagRewards` descriptions and the task titles; keep `targetFlags`.
- Browser playtest of the pass-3 changes: scripts in the session scratchpad (`m08_playtest_scripts.md`).
- Object placement: the locker (break room, top-left 4.4, 7.45) and the audit (archives, 4.6, 3.4, on the floor between the desks) were checked on template renders with the sprites overlaid (no overlap with furniture, NPCs, walls or doors). Confirm in the live game.
