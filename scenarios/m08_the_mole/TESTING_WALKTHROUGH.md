# m08 "The Mole" — QA Walkthrough (PASS 2)

Matches the shipped `scenario.json.erb` after pass 2. See `PASS2_IMPROVEMENTS.md`
for why each step works the way it does.

Codes: safe PIN **2407** (the Director's service number), archives password
**TrustNoOne**, badge printer PIN **0311**. Flags arrive through the Evidence
Relay Terminal in the server room.

## Critical path

| # | Action | Expected |
|---|---|---|
| 1 | Load the mission | ATHENA's opening cutscene plays once (`briefing_played`). It does not replay on resume. When it closes, HaX's first message arrives (~2.5 s). |
| 2 | Go north to the Director's office and talk to Netherton | `brief_with_netherton` completes and `brief_taken` is set on the **first line** of the meeting. The aims `work_the_suspects` and `get_into_the_repo` unlock. Ask for access: you receive "Director's Access Keycard -- All Zones" (`netherton_keycard`). Close and re-talk: the hub returns, not "(End of conversation)". |
| 3 | (optional) Interview Cipher (ops floor), Phantom (intel analysis, north of ops), Nightshade (Crypto Lab, west of the lobby) | `<name>_interviewed` is set on the first line. The interview task completes then if the brief is taken, otherwise the moment it is (brief-gated mappings, lesson 27). Re-talk returns to the hub. |
| 4 | Ops floor → east: badge the server-room door | `server_room_entered` is set; `breach_server_room` completes (after the brief). HaX offers the recon guide. |
| 5 | Exploit GitList; submit flags 1 and 2 at the relay | One HaX message per flag, each with its guide offer. Music → tension on flag 2. `get_into_the_repo` completes. |
| 6 | Log in with the recovered credentials; get root; submit flags 3 and 4 | Flag 4: `mole_identified`, `database_theft_understood`, music → threat. When all four are in, `all_flags_submitted` latches (on `closing_debrief`), HaX sends "That's the whole chain", and the Crypto Lab Nightshade is hidden. |
| 7 | Ops floor: read the personnel printout | Its "Requested by" line gives the Director's service number, 2407. The margin note says everyone uses their service number on their safe. |
| 8 | Director's office: open the safe with 2407 | Holds the interrogation key and the sealed psych evaluation. |
| 9 | Crypto Lab → south: open the interrogation room (key, or lockpick) | The door opens. No task (the old `open_interrogation_room` revealed the confrontation aim at minute one via the lockpick). |
| 10 | Enter the interrogation room with all four flags in | The confrontation opens (hq2, **cannot be closed**). `confront_nightshade` completes on its first line. |
| 11 | Work the hub; choose the fate | `decide_the_fate` completes at the choice, which sets `fate_decided` plus `nightshade_arrested` XOR `nightshade_triple_agent`. If Tomb Gamma wasn't asked about, he gives it anyway (`tomb_gamma_location_known`). |
| 12 | The confrontation closes | The debrief opens straight away (hq3, cannot be closed). `debrief_played` is set on line 1. `take_the_debrief` completes on the **last** line. Then victory music, credits, and the bond visualiser. |

## Order variants (must all work)

- **Interrogation room picked before the flags:** the room is empty, the evidence wall reads "Awaiting evidence", and the disposition screen reads "No detainee". The confrontation opens on the first entry after all four flags are in.
- **Flag 4 submitted before flags 1–3:** HaX names Nightshade but asks for the rest of the chain. No confrontation yet. HaX hub: "Why isn't he in the interrogation room yet?"
- **Badge printer route:** break room post-it → PIN 0311 → reception printer (a `pc` container) → "Printed Server-Zone Badge". HaX sends the m03 callback line. Opens the server room.
- **Archives:** post-it password, or ATHENA's "Ask about the Security Archives". Optional; `read_the_archives` now sits in `work_the_suspects`.
- **CyberChef:** Nightshade's desk → PERSONAL_BACKUP.enc. Decode with ROT13, then From Base64, at the Crypto Lab workstation. Optional colour.
- **"End Conversation" in the confrontation (engine ignores disableClose for that button):** before the choice, HaX nudges you to step out and go back in, and re-entry reopens the scene from the start. After the choice, the outcome (fate, `fate_decided`, Tomb Gamma) is already written, and the debrief opens on the close.
- **Netherton KO'd:** HaX's server-room answer gives only the printer route; the confrontation's countersign lines change.
- **Reload mid-confrontation (before the choice):** re-entering the interrogation room reopens it. After the choice, it skips to `after_choice`.
- **Reload mid-debrief:** the debrief does not replay; the next room entry completes `take_the_debrief` (backstops on `opening_briefing_cutscene`). The mission concludes **without** the victory track and credits, which are keyed on the debrief closing. This is accepted m06/m07 behaviour.
- **Aim ladder (lesson 27):** do everything you can before seeing Netherton: interview all three, open the archives (ATHENA's password), print a badge and enter the server room. No later aim should appear. After the brief, those tasks tick at once. Residual: a flag *submitted* before the brief still reveals its aim, because `submit_flags` can't be gated.

## Branch variants

- **Fate arrest vs triple agent:** debrief `disposition`, the disposition screen, and credits differ.
- **Accused Cipher and/or Phantom to his face** (`accused_cipher`/`accused_phantom`): debrief `the_hunt` line and credits. After flag 4, each offers an apology beat.
- **suspect_theory** cipher/phantom/nightshade/unset: debrief and credits.
- **nightshade_suspected:** confrontation opener and debrief line.
- **debrief_stance** defended/owned: debrief and credits.
- **Netherton KO'd:** opening joke in the debrief, plus a credits line.

## Knockout matrix

| KO'd NPC | Expected |
|---|---|
| Director Netherton | `brief_with_netherton` completes (taskOnKO). HaX (`npc_ko:director_netherton`) points to the badge printer and its break-room PIN. The safe needs no NPC. |
| Cipher / Phantom | HaX reacts; the interview is optional; the case is unaffected. |
| Nightshade (Crypto Lab) | HaX reacts; the confrontation still opens from the evidence; the body is hidden when all flags are in. |
| Nightshade (confrontation) | Hidden through the scene, so it should not be reachable. Safety net: `npc_ko:nightshade_confrontation` sets arrest + `fate_decided` and completes `decide_the_fate`; the debrief's no-coordinates branch covers it. |

## Automated checks

- `ruby scripts/validate_scenario.rb scenarios/m08_the_mole/scenario.json.erb`: 0 errors, 1 warning (the confrontation cutscene is deliberately not onceOnly; see PASS2_IMPROVEMENTS).
- `./scripts/compile-ink.sh m08_the_mole`: 12/12.
- `inkcheck.js` on every entry knot and the re-entry states; `loopcheck.js` on every hub.
- `ruby tools/pass2/render.rb … && python3 tools/pass2/door_align.py …`: 8/8 OK.

## Known follow-ups

- SecGen flag order vs a real build (see the approval log, m08 §2). If the build numbers the flags differently, swap the four `flagRewards` descriptions and the task titles; keep `targetFlags`.
- Browser playtest: none yet. See PASS2_IMPROVEMENTS "Unverified".
