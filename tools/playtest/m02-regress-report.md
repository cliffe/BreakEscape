# m02_ransomed_trust regression playtest (uncommitted engine changes)

Date 2026-10-01. Headless, standalone, driven by hand from `TESTING_WALKTHROUGH.md`.

**Questions answered:** plumbing (1) plus unexpected behaviour (2: re-talks, KO order, reload mid-run, "step away" at the press terminal). Not a solvability run: VM flags were seeded stand-ins.

## Games and logs

| Run | Game | Purpose | Session logs (all under `tools/playtest/`) |
| --- | ---- | ------- | ------------------------------------------ |
| A | 1186 | Critical path, re-talks, reload x2, console, ransom + transmit ending, debrief | `m02-regress-session.jsonl` (seq 1-435), `-session-2.jsonl`, `-session-3.jsonl` (ending, seq ~120-248), `-session-4*.jsonl` (post-conclusion reload) |
| B | 1196 | KO Gary, KO Val, Ghost pickup, keep-quiet ending, press terminal "step away" | `m02-regress-session-B.jsonl`, `-B2.jsonl`, `-B3.jsonl` |

Flag XMLs: `m02_ransomed_trust-flags-game1186.xml`, `...game1196.xml`. Screenshots in scratchpad: `rc.png` (cover-burn bark and HaX orientation replayed after reload), `deb.png` (credits visualiser up during debrief), `pt.png` (dead press terminal).

## verify-run.rb output

Game 1186 (run A):
```
unlocked rooms  12: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, staff_room, dr_kim_office, it_department, security_office, server_room, conference_room
unlocked objs   1: entropy_staging_cache
inventory       14: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Visitor Badge (Countersigned), Dr. Kim's Signed Statement, Planted Network Device, Server Room Keycard, Spare Contractor Lanyard, Val's Pocket Notebook, Verified Restore Manifest, ENTROPY Key Material, Ghost's Operational Manifesto, Affiliate Handling Note
flags submitted 4 (…_1_8164c3, _2_823e56, _3_12f9de, _4_28b270)
globals set     54 (incl. mission_complete, paid_ransom, exposed_hospital, insider_asset_arrested, ghost_deal_accepted, gary_protected)
VERDICT: progress recorded — 11 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```
Game 1196 (run B): 10 rooms beyond the first, 1 object unlocked, 4 flags submitted, globals include gary_ko, guard_knocked_out, mission_complete, paid_ransom. VERDICT: progress recorded.

Server record: game 1186 `status=completed`, `mission_concluded_at=2026-10-01 06:33:46 UTC`; game 1196 `status=completed`, `mission_concluded_at=2026-10-01 06:51:52 UTC`. Both timestamps are at the moment the press-terminal choice was confirmed, before the debrief started (see defect 5).

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| ------ | ---------- | -------------- | ----------- | ------- |
| IT Department Override Key | item | Bernie, reception (dialogue reward) | A: converse, early; B: same | yes |
| Boardroom PIN | `0417` | Kim's Desk Diary + Kim's `boardroom_code` knot | A: Kim conversation + diary read before door | yes (A); **no (B)**, typed from knowledge |
| Server Room Keycard | item | Gary (rapport route in A; KO drop in B) | A: IT; B: IT | yes |
| Gary's workstation / sticky note | not used | n/a | n/a | not exercised |
| Emergency safe PIN `1987` | not used | n/a | n/a | not exercised (safe never opened; "Keys In The Safe" aim left active in both runs) |
| Flags 1-4 | `<flag:1>`..`<flag:4>` | VM chain, not possible in standalone | n/a | **no, handed over** (prerequisite SSH credential `Hospital1987` and sticky note not obtained in this run) |

Boundary: flag steps and everything downstream (cache, manifest, console, terminal, ending) were exercised, not proven earned. The escrow keys and the combined/offline recovery paths were not run.

## Check results

| # | Check | Result |
| - | ----- | ------ |
| 1 | Critical path to completed + concluded_at, one ransom ending | PASS. A: ransom + transmit + arrest Reeves + debrief. B: ransom + keep quiet + arrest. Both `status=completed`, `mission_concluded_at` set. Credits-before-debrief ordering noted in defect 5. |
| 2a | KO Gary | PASS (B, seq in `-B.jsonl`). `gary_ko` fired; `talk_to_gary` and `obtain_password_hints` completed; one HaX message: "Gary is down -- you won't be getting those password hints out of him now. Doesn't matter: he wrote them on a sticky note by his monitor. Grab it. Same weak credentials unlock the backup server over SSH." Sent once. Card dropped and was picked up. Cover-burn texts followed as designed. |
| 2b | KO guard | PASS (B). `guard_knocked_out` -> `cover_restored` true, `regain_freedom_of_movement` completed, one message: "You've put a hospital security officer on the floor. That solves your corridor problem and creates about four others. Move fast -- when she's found, this building locks down." Fired once. Mission still completed. But see defect 3. |
| 3 | Aims | PASS. Reception `#unlock_aim:access_it_systems` made the aim active immediately and it was still active after reload. Locked aims with early-complete tasks (`unmask_inside_asset` after the handover board, `recover_offline_keys` after Doyle/snag list) were absent from the HUD (checked HUD text) while locked, then appeared active with that task already ticked once `cover_compromised` completed (A, after server-room entry). No aim failed to appear and no stall. `objectives/unlock` route exists; no 404 evidence, persistence across two reloads worked. |
| 4 | Re-talks | PASS with defect 4. Kim (restart after her story ended opened at the hub, no intro; Signed Statement count stayed 1), Gary (hub, one card, one lanyard), Val (hub; notebook once), Doyle (hub, only "I'll let you work" left). Press terminal after a decision: reopening shows the log, `ended:true`, no choices, so the decision cannot be changed (run B, keep-quiet; run A could not be reopened because the credits overlay blocks input). |
| 5 | Ghost contact | PARTIAL / FAIL on first message. Before pickup `ghost_contacted_player` false and Ghost history empty (B). On pickup of the Planted Network Device the auto-opened phone set the global at once and the thread shows the return-contact text ("Still at it. Good -- I'd have thought less of you...", twice) not the opening ("You found it."). See defect 1. Flow after that works: ProFTPD and backup-located messages arrive at the flag submissions. |
| 6 | Reload | FAIL in parts. Aims, notes, inventory, manifest and key-material slots, door unlocks and `ward_recovering` persisted. Replays seen: defects 1 and 2. |
| 7 | Console, cache, debrief, credits | PASS with notes. Before flag 3 not tested. After flags: manifest `[x]` from inventory, key material `[x]` after cache take (survives reload), Ghost video call fires, `backup_restore_initiated` and `make_ransom_decision` complete. Staging cache opened after flag 4; Manifesto and Handling Note reached the notepad. Debrief played to the end (A: 108-115 turns). Credits showed, see defect 5. |

## Defects (observations; I am not ruling on cause)

1. **Ghost's opening is consumed unseen, and the Ghost phone re-opens on every reload.** Repro: pick up `ghost_terminal_device`. Log (game 1186, `m02-regress-session.jsonl` drain, seq 575-579; game 1196 via a hooked dispatcher): `item_picked_up:phone` -> `global_variable_changed:ghost_contacted_player` (no oldValue) -> same again with oldValue true -> `conversation_closed:ghost`. The open thread is `[ENCRYPTED CHANNEL - GHOST]`, "Still at it. Good...", "I've been reading their estates paperwork...", with the last two duplicated; no "You found it." Suspect the deferred-globals path in `phone-chat-minigame.js` applies `ghost_contacted_player` before the opening runs. Also, after any page reload the Ghost phone opens by itself (bootstrap trace "close phone-chat" on 1186 and 1196 reloads); the `item_picked_up:phone` event mapping seems to re-fire when the inventory is restored. Not seen on the first reload before the device was held.
2. **Event handlers replay after reload.** After reloading with the device and cover burned, entering the server room replayed Val's `on_server_room_access` cutscene (identical text, player had passed it before reload), and the screenshot `rc.png` shows Val's "Control just rang. Says there's no consultant booked." bark and HaX's server-room orientation message on screen again. `onceOnly` state for event mappings does not appear to survive reload. Persisted: briefing (did not replay), Bernie, Kim, Gary.
3. **KO'd Val still runs her server-room cutscene** (run B: `debugKO` on Val, then entered the server room; person-chat with Val appeared with the full challenge text). The invariants list guards nurse/patient/Kim/Gary on `*_ko` but not Val here.
4. **Press terminal "I'll step away" kills the terminal for the rest of the page session.** Repro (B): open terminal, choose "I'll step away from the terminal for now", close, reopen, open the contact: no choices ever appear (waited 15 s, screenshot `pt.png`). Cause suspected: `restartOnRetalk:false` plus `-> DONE` on that choice. Reloading the page restores the choices. A player who steps away cannot make the decision, so `mission_complete`/debrief cannot fire until they reload. Likely the most serious item.
5. **Credits visualiser (bv-stage) is up before and during the closing debrief**, not after it. Both runs: `mission_concluded`/aim completion fires at the terminal confirm, `status=completed` is written then, the visualiser appears about 1 s later, and the debrief person-chat opens underneath. Screenshot `deb.png` taken while the debrief was active shows only the visualiser. The walkthrough says the debrief plays and its close triggers the credits. Needs a human to judge whether the debrief is readable. A concluded game reloaded goes straight to the visualiser.
6. Harness notes, not game defects: `location.reload()` from inside a session leaves `bootstrap` hanging (three times; killing and restarting the session worked); `enter` frequently returns `did-not-cross` on the ward door and needs `moveTo (160,-200)` then `walk left`; the recovery console needs the player within about 32 px.

## Regression call

I cannot compare with a pre-change build. Items 1, 2 and 4 involve code paths in the uncommitted diff (phone preload/deferred globals, `restartOnRetalk`, saved ink variables), so treat them as suspects for regressions. Nothing that previously worked was observed to stop working in the KO, aim, hub, flag-reward note and console flows.

## Assumptions

- Assumption: the debrief and ending order is judged from event timing and one screenshot, not from watching a headed run.
- Assumption: "restartOnRetalk" cause in defect 4 is inferred from the ink and config, not from instrumenting the engine.
- Assumption: run B's Boardroom PIN and all flags count as unearned.
