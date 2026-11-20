# m06_follow_the_money Pass 2 playtest

Questions answered: (1) plumbing on the intended route, (2) unexpected-order behaviour (Satoshi before flag 4, KO Elena last, reload, re-talk), (3) not attempted (no VM skip hunt).
Step source: scenarios/m06_follow_the_money/TESTING_WALKTHROUGH.md and PASS2_IMPROVEMENTS.md.

Runs (headless, fast):
- Run A, game 1173: session log tools/playtest/m06-pass2-session-A.jsonl, verifier tools/playtest/m06-pass2-verify-A.txt. Route: first call, checklist, guessed passphrase, flags 1-3, Satoshi BEFORE flag 4 ("Not yet"), flag 4, freeze, reload, KO Elena last.
- Run B, game 1174: session log tools/playtest/m06-pass2-session-B.jsonl, verifier tools/playtest/m06-pass2-verify-B.txt. Clean earned route, ending freeze + Elena recruited.
- Screenshots: tools/playtest/m06-pass2-debrief-over-credits.png (A), tools/playtest/m06-pass2-B-debrief-state.png (B).

Both games: status=completed, mission_concluded_at set (A 22:34:08Z, B 22:48:57Z, read from the game record).

## verify-run.rb output
See the two verify files. Both end "VERDICT: progress recorded — 7 rooms beyond the first, 1 objects unlocked, 4 flags submitted."
Note: A's verifier "globals set" omits elena_* until the next flush; the final verify (post-quit) is the one saved.

## Earned-secrets table
| Secret | Value used | In-game source | Obtained at (log line) | Earned? |
|---|---|---|---|---|
| Server room passphrase (run B) | `bitcoin2025` | Elena's wordlist (top entry bitcoin, years appended) + IT checklist "Rev. January 2025" | wordlist B:~L100-256, used B:256 | yes |
| Server room passphrase (run A) | `bitcoin2025` | Checklist only. Wordlist was unobtainable in A (see defect 1) | A:358 | partly: the checklist says "crypto term + year", the term was guessed |
| Data centre PIN (A, B) | `3110` | Door Controller Export, reward of flag 3 (line `DC-02,data centre,pin,3110`, CEO note 31/10) | A:493, B:364 | yes, but only after flag 3 |
| Exec safe PIN (A, B) | `2140` | Framed Press Clipping in executive wing ("Until 2140") | A:527, B:420 | yes |
| Elena wordlist | item | Elena hub, trust >= 15 | B only | yes in B; NOT obtainable in A |
| CTO badge | item | Elena hub "office badge", trust >= 25 (B); relayed copy on KO (A) | B, A:1123 | yes |
| Exec badge | item | Data centre rack, `executive_access_badge` | A, B | yes |
| Recovery keys | item | flag 4 reward | A:~L700, B:443 | via session flag |
| `<flag:1>`..`<flag:4>` | session tokens | none possible in standalone | — | **no**. Prerequisites held (wordlist, passphrase, VM launcher opened, `access_hackme_vm` ticked), flag values not earned. |

Rows marked "no": the VM work (flags 1-4) was exercised, not tested. Flag 3's PIN reward and flag 4's keys were tested as payouts only. Solvability of the VM half is unproven. Also not earned: nothing else; every PIN and the passphrase (run B) came from an in-game source before use.

## Priority results
1. Critical path to completed: PASS (A and B, status completed, mission_concluded_at set). Passphrase earned in B, PIN 3110 from flag-3 reward, PIN 2140 from press clipping. Caveats: defects 1, 2, 3.
2. Satoshi visible and talkable on entering: PASS (A and B: `visible:true`, conversation opened on first approach).
3. First HaX call: PASS. Phone opens with the first_call bubbles ("you're inside HashChain Exchange. How's the FCA cover holding up?", FCA orientation, three options) and "What should I focus on first?" plays initial_guidance. Log A around L110.
4a. Freeze + Elena turned: PASS for content (B: freeze, Elena recruited, debrief text for both). FAIL for presentation: see defect 2.
4b. Satoshi before flag 4: PASS. Option 5 "Not yet. I'll be back with the recovery keys." ended the conversation politely, `asset_decision_deferred=true`, HaX hub shows "The recovery keys are on the vault account on the backend. That's the last flag. Take the estate, and the drop-site will hand you what you need to freeze that wallet." After flag 4 the freeze option was present on return (A:790).
4c. KO Elena last: PARTIAL. Debrief fired when the relay phone closed (`debrief_played=true`), not over the phone or the drop-site. But the bond visualiser credits opened OVER the phone at the moment of the KO (defect 2). Last-flag-over-drop-site variant not tested.
5. Task ticks: PASS. meet_elena ticked at the first line of Elena's conversation (B and A); question_the_trader ticked on "You must have suspicions" (A); question_the_analyst ticked after the analyst conversation (A); confront_satoshi ticked on entering his conversation (A and B, before any choice).
6. Re-talk: PARTIAL. Elena (pre-fate), trader, analyst, Satoshi (after deciding) all return to a hub or aftermath line, no "(End of conversation)", no replay. Reload after deciding with Satoshi (A): opens on "It's over, Agent. I'm waiting for your police." then the aftermath hub, no replay. Elena re-talk AFTER her fate was not tested in dialogue (A she was KO'd; B the credits overlay and a post-reload world that would not move blocked it). Debrief did not replay on reload in B.
7. Canon: FAIL candidates, human to rule. Quotes below.
8. Other: defects below.

## Defects (observed; classification left to a human)

1. **Elena's wordlist is unreachable if the first hub pick is not an opener.** Repro: talk to Elena for the first time, pick "I'll need to test your password strength" (or any hub option) instead of the three opener choices. The opener lines ("Thank you for making the time", "Let's be efficient", "Thirty-seven papers") are pending choices that fall through into the hub after "Back again. What do you need?" (first-meeting text says "Back again" on a first meeting, and all 7 options appear at once, log B:~70). Picking a hub option discards the openers, trust stays 0. Research gives +10 and paperwork needs `elena_suspicious` (only set by the "Let's be efficient" opener), so trust caps at 10 and the `>= 15` gate never opens. Run A: four attempts refused ("Earn a little trust first"), `obtain_access_tools` never ticked, wordlist never obtained. Evidence A:~L150-230. Source: m06_npc_elena_volkov.ink lines 52-82 (choices inside `{first_meeting:}` without a divert).
2. **Credits open before, and cover, the debrief.** When the last story task (`decide_elena_fate` or `decide_asset_strategy`) completes, `resolve_the_fund` completes and `conclusionScreen: bond_visualiser` (no `disableClose`) opens at once. The debrief person-chat (z-index 1500) then opens underneath; `elementFromPoint` at centre hits `bv-vis-canvas`, screenshots show only the visualiser ("MISSION COMPLETE // AUDIO INTEL", closable:true). A player would see credits, not the debrief. Run A: credits appeared over the open HaX relay phone at the KO (brief showed `missionEnd` and `activeMinigame: phone-chat` together), then the debrief opened on phone close under the credits. Run B: same, at Elena's recruit. The intended post-debrief credits (victory track, `disableClose`) come from a separate music trigger. Evidence: screenshots above, A:~L1123-1200, B:~L941-975.
3. **`find_transaction_records` and `discover_architects_fund` can stay active although the note was read.** The onPickup `setVariable` fires `global_variable_changed` before `item_picked_up`; the HaX mapping calls `completeTask` immediately, the server checks the collection before the collect POST has landed and answers "Insufficient items collected", the task reverts to active, and the later `item_picked_up` is ignored while the task is `completing`. Run A: both tasks stuck (globals `found_*` true, `blockchain_debrief_available`/`fund_debrief_available` true, `currentCount 0`). Run B: blockchain task completed, fund task stuck, aim `map_financial_network` stays active and `breach_executive_wing` stays locked in the HUD until later task completions auto-reveal it. A later manual POST of the task succeeded, so this is a timing race. I did that POST once in run A (a diagnostic, not a player action), so A's `discover_architects_fund` is server-completed by hand. The mission still concluded; the cost is an unticked task and a locked-looking aim. Suspect engine ordering; the walkthrough claims these complete.
4. **Elena hub re-offers handed-over items.** After the wordlist and the badge are given, "test your password strength" and "About your office badge" stay in the hub in the same conversation; picking them replays the full handover text (no duplicate item). On re-talk they are gone. B:~L115-140.
5. **Pathfinder traps the player inside Satoshi's office.** After the conversation, `moveTo` anywhere from the doorway area stalls at (581,-876) (timeouts on every retry, both games). `walk right` then `walk down` frees it. Suspect chair `satoshi_office_chair-white-2-rotate1_155` beside the door. A:~L1040, B:~L1200.
6. **Reload of a concluded game.** Credits re-open on load. The next `bootstrap` took about 7 minutes (headless GPU at 260%) and `brief` then showed `room: null` and a player that could not move, after the overlay was removed from the DOM. Probably harness plus heavy canvas; noted, not chased. B:1266-1271.
7. **Object positions differ between games** (VM launcher at (102,-520) in A, (60,-451) in B; checklist x 283 vs 53; trading-floor Elena y -255 vs -270). Not a defect by itself; interact needed a keyboard approach in B.
8. Minor text: HaX's Elena-KO relay ends "You've still got a job to finish" although it was the last task. Freeze line "Coordinated operations? Cancelled." (player line in the freeze branch) contradicts the debrief's hedge ("the paid ones are still out there"). The exec badge and the harness `moveToNear` short-stop on several objects (known harness behaviour).

## Canon check (priority 7): lines where SAFETYNET detains, holds or hands over
- Player line, Satoshi: "'Satoshi Nakamoto II', I'm detaining you. Money laundering, facilitating terrorism, conspiracy. The police can take it from here."
- Player line, Elena: "You're being detained, Dr. Volkov. Now." and "Dr. Elena Volkov, I'm detaining you for laundering and for facilitating terrorism. The police will take it from here." (ink source)
- Debrief (Satoshi, B): "We detained 'Satoshi Nakamoto II' in his own office and handed him to the police." / "He was talking about financial freedom while they read him his rights." / "With him in custody and the fund frozen, HashChain is finished."
- Debrief (Elena recruited, B): "A cryptographer of her calibre is worth more as an asset than a prisoner."
- Debrief (Elena KO, A): "We had one cryptographer inside ENTROPY's money and now we have a defendant." (police framing, likely fine)
- HaX phone (source, m06_phone_agent_0x99.ink:209): "If she won't turn, detain her and hand her over with the evidence."
- Opening briefing (source, line 146): "Then you detain her and hand her to the police with the evidence. We can't charge anyone. They can."
No line said SAFETYNET arrests, sentences or imprisons. "Detain" plus "custody" and "prisoner" are the candidates for a ruling. Satoshi's own lines ("I'll be convicted", "Call your police", "See you at the trial") are fine.

## Not tested
Debrief opening over the drop-site after a final flag; Elena re-talk after her fate in dialogue; Satoshi KO route (on_satoshi_ko); Elena clone-badge route; the Architect email route to 2140; transaction-server files; wrong-password path (known engine issue); VM-backed flag earning.
