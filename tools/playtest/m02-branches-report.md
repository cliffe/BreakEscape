# m02_ransomed_trust — playtest coverage report (refusal branch, KO paths, off-script)

Continuation of a run killed by a spend limit (see `tools/playtest/m02-branches-session.jsonl`,
game 1017, died mid-run just short of the ending). That log and game are left untouched;
this report covers two fresh games run in this session.

**Which questions this covers:** primarily (3) solvability of the refusal branch, earning
every secret in-game — this is the headline deliverable. Also (1) plumbing on three
previously-untested branches, and (2) unexpected behaviour, mostly found by accident while
navigating.

**No scenario or ink files were changed.** Every finding below is either a benign false
positive already documented in `docs/test-bridge.md` (title-mismatch on minigames whose
displayed title differs from the entity name) or a suspected engine-side issue, reported as
suspected, not fixed. `ruby scripts/validate_scenario.rb` and the test suite are unaffected
because nothing was edited.

---

## Game 1019 — abandoned (evidence of a real item-loss bug, not completed)

**Session log:** `tools/playtest/m02-branches2-session.jsonl`
**Flags XML:** `tools/playtest/m02_ransomed_trust-flags-game1019.xml`

Followed the refusal-branch plan exactly as game 1021 below, up to talking to Gary
Whitlock via the leverage route. The ink knot `leverage_payoff` (and `keycard_trusted`
before it) fired correctly — `gave_keycard` global was set, the transcript shows Gary
handing over the card — but **the Server Room Keycard never appeared in inventory**.
Confirmed via `{"cmd":"state"}` immediately after: 6 items, no keycard, where the exact
same conversation in game 1021 produced 7 items including the keycard.

`drainLog()` at the time showed a burst of `console: Failed to load resource: the server
responded with a status of 503 (Service Unavailable)` and a real JS exception
(`Error creating room security_office: TypeError: window.game.scene.getScene is not a
function`) — both consistent with the dev server being briefly overloaded (this session
ran concurrently with another agent's m01 session on the same single-threaded Puma
process).

**Suspected engine issue (not fixed, per instructions not to touch `public/break_escape/js/**`):**
`public/break_escape/js/systems/npc-game-bridge.js` `giveItem()` calls
`await window.addToInventory(tempSprite)`, logs a warning if it returns falsy, but then
**unconditionally continues to `npc.itemsHeld.splice(itemIndex, 1)`** regardless of whether
the add succeeded. If the inventory POST fails (a 503, a dropped connection, anything), the
item is removed from the NPC's held items and never reaches the player — permanently lost,
with no error surfaced to the player. This is a plausible root cause; I did not verify it by
forcing a 503, so it is reported as a strong suspicion with the evidence above, not a
confirmed root cause.

The door to the server room subsequently refused to open (correctly — no keycard, no
unlock), which is what forced abandoning this run rather than a bridge or scenario fault.

Verifier for 1019 (run before abandoning):

```
game            1019  (mission 46)
unlocked rooms  11: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall,
                office_corridor, office_hall_mid, dr_kim_office, office_hall_east,
                it_department, security_office
unlocked objs   1: it_filing_cabinet
inventory       8 items, NO Server Room Keycard
flags submitted 0
VERDICT: progress recorded — 10 rooms beyond the first, 1 objects unlocked, 0 flags submitted.
```

---

## Game 1021 — completed: refusal branch, three new branches, to the ending

**Session log:** `tools/playtest/m02-branches3-session.jsonl` (1164 commands)
**Flags XML:** `tools/playtest/m02_ransomed_trust-flags-game1021.xml`
**Flag policy:** `session` — `<flag:1..4>` substituted from the XML, logged per the skill's
substitution record.

### `verify-run.rb` output (verbatim)

```
game            1021  (mission 46)
created         2026-09-10 00:45:54 UTC
last write      2026-09-10 01:22:34 UTC
played for      2200s of wall clock
current room    "reception_lobby"
unlocked rooms  15: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall,
                office_corridor, office_hall_mid, dr_kim_office, office_hall_east, it_department,
                security_office, server_room, emergency_equipment_storage, office_hall_west,
                conference_room
unlocked objs   3: it_filing_cabinet, entropy_staging_cache, emergency_storage_safe
inventory       12: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Visitor Badge
                (Countersigned), Gary's Email Archive -- Warning 7 of 7, Server Room Keycard,
                Spare Contractor Lanyard, Ghost's Operational Manifesto, Affiliate Handling Note,
                Offline Backup Encryption Keys, Dr. Kim's Signed Statement
NPCs met        17: ... receptionist, dr_sarah_kim, gary_whitlock, security_guard_patrol,
                press_terminal_system, night_security_supervisor, ...
flags submitted 4: flag{..._1_732d8a}, flag{..._2_1e8994}, flag{..._3_ea2d93}, flag{..._4_398855}
globals set     50, including: advised_board_refuse, backdoor_fully_exploited,
                backup_restore_initiated, ghost_deal_accepted, gary_protected,
                insider_asset_escaped, insider_confronted, insider_hostile,
                mission_complete, exposed_hospital, ransom_decision_made,
                offline_keys_recovered, patient_bed4_deceased

VERDICT: progress recorded — 14 rooms beyond the first, 3 objects unlocked, 4 flags submitted.
```

`sync` was sent immediately before `quit`.

### Earned-secrets table

| Secret | Value used | In-game source | Obtained at (seq, this log) | Earned? |
| --- | --- | --- | --- | --- |
| IT Department Override Key | (item) | Bernie Nwosu, reception — `converse`, honest opening line | ~seq 15 | yes |
| Boardroom PIN | `0417` | Dr. Sarah Kim, CTO office — asked "What's the code for the boardroom?" directly in dialogue | ~seq 55 | yes |
| Emergency-storage safe PIN | `1987` | Hospital Founding Plaque, reception lobby, read before anything else | ~seq 5 | yes |
| Server Room Keycard | (item) | Gary Whitlock, IT department — leverage route (`show_the_email` → `leverage_payoff`, opened the filing cabinet and showed him his own Warning 7 of 7 first) | ~seq 210 | yes |
| SSH credential | `Hospital1987` | Gary Whitlock — spoken directly in the same conversation that gave the keycard ("Emma2018, Hospital1987, StCatherines... I'd try the middle one") | ~seq 210 | yes |
| `hospital_backup_server:flag_1..4` | `<flag:1>`…`<flag:4>` | SAFETYNET Drop-Site Terminal, server room, after the SSH credential above and RFID keycard were both earned in-game | prerequisite ~seq 210; submitted ~seq 260–290 | yes — full chain, this is a genuine solvability pass on the flag rows |
| ENTROPY Staging Cache unlock | flag_4 re-entered | Same station's flag 4, required again at the cache's own flag-lock (`Flag Submission Terminal`) — by design, not a bug | ~seq 295 | yes |
| Offline Backup Encryption Keys | (item) | PIN-Locked Safe, Emergency Storage, PIN `1987` above | ~seq 400 | yes |
| Insider evidence (`insider_evidence_partial`) | — | "Ransomware Incorporated Proposal", boardroom conference table, read | ~seq 480 | yes |
| Ransom advice | "Don't pay" | Dr. Sarah Kim, `ransom_decision_input` knot, reached via "Talk me through this board vote" | ~seq 560 | yes (deliberate choice, not a value to "earn") |

**No row marked "no."** Every secret used in this run, including all four flags, was
obtained from its stated in-game source before use. This is a genuine solvability pass for
the refusal branch: nothing downstream of any row above is unproven for having skipped the
source.

**Deliberately not read:** the Night Security Post Log (boardroom) — reading it, combined
with the badge ID from flag 4, sets `insider_identified`. Skipping it on purpose was the
mechanism for reaching `insider_asset_escaped` (see below); it is not a gap in the table,
it is the point of the run.

### Step-by-step, grouped by aim

**Aim: Talk Your Way In**
1. Founding plaque read (reception) — PIN 1987 confirmed. PASS.
2. Bernie Nwosu, honest opening line — key given, `bernie_trusts_player` set. PASS.
3. Entered ward via Ward Approach → Ward Link. `assess_the_ward` complete. PASS.

**Aim: Get Into IT**
4. IT department door — unlocked with the earned override key (real `lock` command, key
   route, not a pick). PASS.
5. Infected Terminal (ransomware display) read — `decoded_ransomware_note` set. PASS
   (reports as a benign `mismatch` — see Off-script findings below).
6. IT Filing Cabinet — key lock offered only the wrong key; switched to lockpicking and
   used `completeLockpick`. **PASS (assisted)** — the player genuinely has a lockpick kit,
   this is the documented dexterity exception.
7. Gary Whitlock, leverage route: opened the cabinet, took Warning 7 of 7, then chose
   "Gary. Look at this." → `show_the_email` → `leverage_payoff`. Keycard + SSH credential
   + `gary_protected` + `learn_about_scapegoating` all fired. PASS.

**Aim: Somebody Pulled Your Booking**
8. Cover burn fired automatically on `talk_to_gary` completion. PASS.
9. Entered server room — Val's `on_server_room_access` dialogue (`cover_challenge` state,
   showed her the keycard + Gary's blessing line) walked past without a fight, using the
   already-earned `staff_lanyard_obtained` from Gary's leverage payoff as the actual
   cover-restored route. PASS.

**Aim: Turn Their Backdoor Around**
10. All four flags submitted at the drop-site via `<flag:N>`, each substituted from the
    session's XML. Ghost's ProFTPD call intercepted flag 3's first attempt (closed the
    minigame); flag 3 was resubmitted successfully immediately after. `unmask_db_window`
    and `unmask_ghost_badge` both fired. PASS.
11. ENTROPY Staging Cache — flag-locked, re-submitted flag 4 at its own terminal, took
    Ghost's Operational Manifesto and the Affiliate Handling Note. PASS.

**Aim: Bring The Wards Back**
12. Boardroom unlocked with the earned PIN 0417 (real `lock` command). PASS.
13. Read the Ransomware Incorporated Proposal — `insider_evidence_partial` set,
    `unmask_gather_evidence` complete. Did **not** read the Night Security Post Log
    (deliberate). PASS.
14. Dr. Sarah Kim — "Talk me through this board vote" → "Don't pay. Give me the time and
    I'll bring you the keys myself." → `advised_board_refuse:true`,
    `advised_board_pay:false`. PASS. **This is Task 1's headline result.**
15. Emergency storage safe — PIN 1987 (real `lock` command with the earned code), took the
    Offline Backup Encryption Keys. `crack_safe_pin` complete. PASS.
16. Hospital Recovery Console — selected "Offline Backup Keys (Physical Safe)" (the
    non-ransom source, consistent with the refusal advice), confirmed. `paid_ransom`
    never set true; `backup_recovery_source` reflects the offline path.
    `initiate_backup_recovery` + `make_ransom_decision` complete. PASS.
17. Ghost's Act 3 call fired on the console choice. Chose "Nothing from you is free. What
    do you want?" then "I accept. I'll upload the evidence. Give me the keys." →
    `ghost_deal_accepted:true`. **New branch covered (Task 2).**
18. Boardroom press terminal — chose "I'm transmitting everything," confirmed. Reeves'
    `press_terminal_ambush` fired (never identified) →
    `insider_confronted`, `insider_hostile`, **`insider_asset_escaped:true`**.
    `decide_hospital_exposure` complete, `exposed_hospital:true`, `mission_complete:true`.
    **This is the debrief-worthy ending state for the refusal + never-identified branch.**

### Consequence observed, not a bug

Choosing the offline-keys (12-hour) recovery path and going straight to the press terminal
without returning to Mr Pryce's bed during the countdown resulted in `patient_bed4_deceased`.
This matches the documented Decision-Weight design (offline path = worse outcome unless the
player intervenes) — confirms the consequence chain fires correctly, reported for
completeness, not as a defect.

---

## Task 1 — betrayal path (advise refuse, then pay at console)

**Not attempted.** Budget was spent recovering from game 1019's item-loss and on the
navigation issues below; there was no room left in this session to run a third full game.
This is the most interesting untested outcome the brief called out, and it remains
untested.

---

## Task 2 — the three named branches

| Branch | Status | Evidence |
| --- | --- | --- |
| `ghost_deal_accepted` | **Covered** | Game 1021, step 17 above; global confirmed in `verify-run.rb` output |
| `insider_asset_escaped` (never identify Reeves) | **Covered** | Game 1021, step 18; achieved by deliberately never reading the Night Security Post Log, so `insider_identified` never became true, so `press_terminal_ambush` fired on `decide_hospital_exposure` per the NPC's own `eventMappings` condition |
| `gary_protected` | **Covered** | Game 1021, step 7 (Gary's leverage route) — also independently re-set via Kim's `protect_gary` knot later (harmless redundant fire, confirmed by `Dr. Kim's Signed Statement` in the final inventory) |

All three land in the same completed run alongside the refusal advice, so this single game
proves they compose without breaking the ending.

---

## Task 3 — KO paths

**Attempted on Graham Reeves (`night_security_supervisor`), not completed — a real finding.**

`night_security_supervisor` is one of six m02 NPCs declaring `globalVarOnKO`
(`receptionist`, `ward_nurse`, `gary_whitlock`, `dr_sarah_kim`, `night_security_supervisor`,
`security_guard_patrol` / Val). None had ever been KO'd in any prior run. Reeves' hostile
state (`insider_hostile`) fires automatically as part of his scripted `press_terminal_ambush`
knot when the player transmits the evidence without ever having identified him — exactly the
branch this run was already driving toward, so it was the natural candidate.

The moment he went hostile, `getState().nearby` confirmed `hostile: true, ko: false` on him.
`{"cmd":"debugKO","id":"night_security_supervisor"}` was issued immediately and returned:

```json
{"ok": false, "reason": "blocking-ui", "blockingUi": {"blocking": true, "classes": "bv-stage",
 "text": "SIGNAL ANALYSIS ... ATTACK: STOCKHOLM -> BEIJING ...", "buttons": [10 non-functional labels]}}
```

A full-screen decorative overlay (`bv-stage` — a "bond visualiser"-style attack-map
animation, the same family the m01 baseline report names) covers the canvas the instant the
ambush starts. `dismissBlockingUi` was tried and confirmed there is nothing behind the
labelled buttons to click (`blocking-ui-has-no-buttons`). Waiting it out (two separate
30–40 second `waitFor` calls) never cleared it. By the time `drainLog()` was checked, the
player's `hp` had dropped to 0 (`isKO: true`) — Reeves' attack landed while the bridge had no
way to see or act on the fight underneath the overlay.

**I am not classifying this as a confirmed engine bug** — per the reporting rule, only that
I could not complete the KO despite trying the documented exception at the correct moment,
with the NPC confirmed hostile and not yet KO'd. Two things are true regardless of blame:
(1) the `bv-stage` overlay is not itself a modal with real buttons, so it is not something a
human player would need to click through either — it may simply be a visual over a fight a
human plays with real input, in which case this is expected and the bridge genuinely has no
way to intercept it; (2) mission completion is not gated on winning that fight — the run's
`mission_complete: true` was already recorded (read via `state` immediately after the
ambush line appeared, before HP dropped), and the ending state (`insider_asset_escaped`,
`exposed_hospital`, `mission_complete`) survived the player being knocked out afterward.

**The other five KO-capable NPCs were not tested this run.** Bernie, Doyle, Gary and Kim
never went hostile because every conversation in this run used their cooperative routes;
Val's `cover_challenge_options` hostile branch (`#hostile:security_guard_patrol`) was
available but the run's `converse` calls resolved to her lanyard-check branch before a
"Then we're doing this the hard way" pattern could be forced onto that exact turn. None of
these are reported as bugs — they simply were not exercised.

**Net for Task 3:** one genuine attempt, blocked by a UI overlay at the moment of hostility,
suspected but not confirmed as an engine issue; five KO-capable NPCs untested this run.

---

## Task 4 — off-script findings

1. **Benign false "mismatch" reports**, all confirmed harmless by reading `mg getState`
   immediately after: interacting with an `Infected Terminal` (type `ransomware_display`)
   opens a minigame titled "Ransomware Impact Display"; interacting with the
   `emergency_storage_safe` (a PIN safe) opens a minigame titled "Enter PIN for item";
   interacting with `hospital_recovery_console` opens one titled "Backup Recovery Console";
   interacting with `entropy_staging_cache` (a flag-locked container) opens a
   "Flag Submission Terminal" that asks for the flag again before granting access to the
   same container. In every case the entity's own declared lock type matches what opened;
   the bridge's mismatch heuristic compares the clicked entity's *display name* against the
   opened minigame's *title*, and those two fields are allowed to differ by design for these
   minigame types. Not a scenario defect — worth a note for whoever next tunes that
   heuristic, since it produced four false alarms in one run.

2. **Suspected engine issue: `giveItem()` can silently and permanently lose an item on a
   transient server error.** See game 1019 above. Reported as suspected, not confirmed,
   evidenced by a genuine mid-conversation item loss correlated with real 503 responses and
   a JS scene-creation exception in the browser console.

3. **Real navigation friction, likely walk-vs-click pathing, not a wall bug.** Returning
   through several "hall" rooms (`office_hall_east`, `office_hall_west`, `office_hall_mid`,
   `dr_kim_office`, `conference_room`, `office_corridor`, `security_office`) after having
   already crossed once, raw `{"cmd":"walk"}` calls repeatedly stopped 15–40px short of the
   door on the return trip, at consistent x/y values, regardless of direction or duration —
   looking exactly like a wall. In every case, either a `{"cmd":"moveTo", ...}` (real
   pointer click, EasyStar-pathed) at a point a little further into the corridor, or a
   `moveToNear` on any nearby object, broke the deadlock and the room then crossed normally
   on the next `walk`. This consumed a large amount of the session and should be looked at:
   either raw arrow-key movement has a collision edge case these hall-type rooms hit after
   a room reload, or (most likely, given a human always clicks to move) this is purely an
   artifact of using `walk()` instead of `moveTo()`/`moveToNear()` for corridor traversal,
   which the skill's own guidance already prefers. Recorded here because it repeated
   identically across two independent games and cost real time; **not** classified as an
   engine bug — the skill's documented advice (prefer `moveTo`/`moveToNear`, `walk` is
   secondary) would likely have avoided all of it, and a future run should follow that more
   strictly for hall-type rooms specifically.

4. **`patient_bed4_deceased` fired correctly** under the offline-keys slow path when the
   player never returned to intervene — confirms the Decision-Weight consequence chain
   works, not a finding against the scenario.

No scenario or ink defect was found or fixed this session.

---

## Summary of game IDs and verdicts

| Game | Verdict | Purpose |
| --- | --- | --- |
| 1017 | Died mid-run (prior session, spend limit) | Untouched, evidence only — 20 tasks, 4 flags, `advised_board_refuse:true`, did not reach the ending |
| 1019 | Abandoned after ~11 rooms, 0 flags | Evidence of the suspected `giveItem` item-loss bug; server room permanently unreachable in this run because the keycard never arrived |
| **1021** | **Completed to the ending** — 14 rooms, 3 objects unlocked, 4 flags submitted, `mission_complete:true` | **Refusal branch solvability pass** (Task 1, minus the betrayal variant) + `ghost_deal_accepted` + `insider_asset_escaped` + `gary_protected` (Task 2) + one KO attempt on Reeves, blocked by a UI overlay (Task 3, partial) |

**Not completed this session:** the betrayal variant of Task 1 (advise refuse, pay anyway);
KO of the other five capable NPCs (Bernie, Doyle, Gary, Kim, Val); confirming the `giveItem`
suspicion by deliberately reproducing a 503 rather than relying on one that happened to
occur.
