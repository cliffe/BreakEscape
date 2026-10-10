# m05_insider_trading pass 2: playtest report

Question answered: plumbing, plus unexpected-behaviour probes (out-of-order actions, re-talks, KO fallbacks). Not a solvability pass: the four VM flags were handed over from the session flags XML and cannot be earned in standalone.
Route source: scenarios/m05_insider_trading/TESTING_WALKTHROUGH.md and PASS2_IMPROVEMENTS.md. Headless, `--speed fast`. No scenario, ink or engine file edited.

## Runs and evidence

| Run | Game | Purpose | Session log | Verifier output | Server result |
|---|---|---|---|---|---|
| 1 | 1165 | Patricia route, fight -> KO -> post-KO choice (stay), flag nag, re-talks, Recruiter | tools/playtest/m05-pass2-run1-session.jsonl | tools/playtest/m05-pass2-run1-verify.txt | status=completed, mission_concluded_at 2026-09-30 20:34:16 UTC, final_choice=combat_nonlethal |
| 1b/1c | 1165 | reload of the concluded game (harness wedged, see defects) | m05-pass2-run1b-reload-session.jsonl, m05-pass2-run1c-reload-session.jsonl | n/a | n/a |
| 2 | 1166 | Patricia KO (HaX route), Kevin handling, naming refusals, HaX-route Recruiter (deal taken), turn ending | tools/playtest/m05-pass2-run2-session.jsonl | tools/playtest/m05-pass2-run2-verify.txt | completed, concluded_at 20:54:59 UTC, final_choice=turn_double_agent |
| 2b | 1166 | reload of the concluded game (no debrief replay) | m05-pass2-run2b-reload-session.jsonl | n/a | n/a |
| 3 | 1167 | Patricia-authority route, Kevin KO relay, Recruiter refused, detain ending | tools/playtest/m05-pass2-run3-session.jsonl | tools/playtest/m05-pass2-run3-verify.txt | completed, concluded_at 21:03:51 UTC, final_choice=arrest |

The verifier (`verify-run.rb`) does not print status or mission_concluded_at, so those were read with a short runner script (Game#status, #mission_concluded_at). Verifier output, run 1 (full text in the .txt files):

```
game 1165 (mission 49)  unlocked rooms 10  unlocked objs 1 (torres_briefcase)
flags submitted 4   globals set 37 (incl. debrief_played, final_choice, torres_ko, flag1..4_submitted)
VERDICT: progress recorded — 9 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

Runs 2 and 3 likewise returned "progress recorded", 4 flags submitted each.

## Earned-secrets table (run 1 unless stated)

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Visitor badge | item `id_badge` | Patricia, provide_access (run1 log ~seq 549) | run1 step 2 | yes |
| Server-room password | `quantum2024` | Kevin's sticky note, opened before use (also named by Kevin in dialogue) | run1, note read before the hallway | yes |
| Server-hallway badge | Cloned Staff Badge | Kevin, "I need a badge..." | run1 step 5 | yes |
| Torres office keycard | Torres Office Keycard | Kevin, "I need into David Torres' office" (run 1: no Patricia authority, Kevin gave it anyway; run 3: Patricia authority first; run 2: HaX relay) | run1 step 5 | yes |
| Lockpick | Lockpick Set | Kevin | run1 step 5 | yes |
| Briefcase lock | pins 35/60/45/30 | picked with the Kevin lockpick; `completeLockpick` used | run1 | yes (assisted) |
| Flags 1-4 | `<flag:1>`..`<flag:4>` | Bludit terminal opened (vm-launcher minigame) and drop-site reached; the VM work itself is impossible in standalone | flags at run1 after the server room | **no: prerequisites held (server room, Bludit terminal, drop-site), flags not earned** |

Everything downstream of the flag rows (aim 4 flag tasks, `architect_approval_confirmed`, the debrief's "Architect's signature" line) was exercised, not tested. Flags not earned: all four, in all three runs. The cloned badge/keycard/lockpick were all earned from Kevin; Dr Chen's optional badge was never offered on the branch I took (see note 7).

## Priorities

| # | Result | Evidence |
|---|---|---|
| 1 Critical path to completed | PASS (flags handed over) | three games reached status=completed with mission_concluded_at set, see table. All four `flag_station_evidence:qdc_research_server-flagN` tasks completed. |
| 2 Phone / Recruiter | PARTIAL | First phone open (runs 1, 2, 3 checked in 1 and 2): only Agent HaX listed, no Recruiter, no call. After naming, her call arrives: run 2 (HaX route: text, then ring back gives the full intro and the deal) and run 3 (Patricia route: call opens at the end of Patricia's conversation, full intro and deal) both correct. Debrief reflects the answer: run 2 took deal -> "She offered me a deal" confession branch; run 3 refused -> "you turned her down". **Run 1 defect D2**: the Patricia-route call opened on the "Still deciding?" knot, the deal was never offered (`recruiter_deal_offered` false) and the debrief had no deal line. |
| 3 Evidence gates | PASS | Nudge fired once on motive + exfil: run 1 via flag3 (`case_ready_notified`), run 2 and 3 via upload schedule. HaX text "That's both halves..." present once. Motive only (journal) and no evidence: HaX refused ("You've got why. I need proof..."). Flag nag: confronted Torres with flag 4 missing in runs 1 and 3; `flags_nag_sent` true, HaX text "finish the job on that research server", debrief did not fire until the last flag, then fired. Keycard pickups: `server_badge_obtained`, `office_card_obtained` set (runs 1, 3). Debrief also fires on Torres conversation close when flags are already in (run 2). |
| 4 Endings | PASS | Fight: Torres hostile, player hp 100 -> 60, KO by `debugKO` (PASS assisted, combat not played), post-KO choice opened; Escape key and the X both left it open (`stillOpen:true`), choice made (`combat_nonlethal`). Safety-net path not exercised because the scene could not be closed. Turn (run 2) and detain with treatment deal (run 3) both ran through to the credits. Expose not run. |
| 5 KO Patricia | PASS | Run 2: `debugKO patricia_morgan` (assisted) -> HaX phone cutscene, inventory gained "Contractor Pass", `patricia_authorised_office` true. Kevin then handed over the office card and Torres' office opened; naming done to HaX. |
| 6 Aims reveal in order | PARTIAL | Aim 2 revealed after talk_to_kevin, aim 3 on entering Torres' office, aim 4 on entering the server room, aim 5 on naming Torres. None popped open early, but aims 1 and 2 never completed (D1), so later aims opened through auto-reveal rather than the intended ladder. |
| 7 Re-talk | PASS | Kevin, Lisa, Dr Chen, Patricia re-talked in-session: each returns to the hub with only the remaining options (Lisa, Chen, Kevin: one closing line; Patricia: 6-option hub, no intro). No "(End of conversation)" and no replayed intros. Debrief after reload (run 2b): credits re-show, Mission Brief note opens, no `conversation_*` events, `debrief_played` persisted true. |
| 8 Canon | PASS | No spoken line says SAFETYNET arrests anyone or arranges sentencing. Nearest lines: "I'm not police, David. I can't arrest you", "What a court does with you is not mine to promise", "That's for a court. Not me", "We don't get to walk into their interview rooms". Internal variable names (`torres_arrested`, `final_choice == "arrest"`) only. Patricia's line "no prosecution if it can be avoided" (m05_npc_patricia_morgan.ink:195) is the closest to sentencing talk and is hers, not SAFETYNET's. |
| 9 Anything unexpected | see defects | |

## Defects and observations

**D1 (high). Ten collect_items tasks can never complete.** `obtain_security_badge`, `obtain_server_badge`, `obtain_torres_keycard`, `find_lockpick`, `find_server_password`, `find_vetting_file`, `find_entropy_pamphlet`, `find_journal`, `find_medical_bills`, `find_upload_schedule` have no `targetCount` in scenario.json.erb (a scan of the collect_items task objects finds none; m02's has `"targetCount": 1`). Observed: `item_picked_up:id_badge` fired (run 1 log seq 549) and the task stayed `active`; the dev log shows `PUT /objectives/tasks/obtain_security_badge` with `progress=1` (test/dummy/log/development.log ~line 3431244) and no completion. All ten stayed active/blank in the persisted state at the end of run 1 (st.rb output) even though every item was held. Suspect cause: `handleItemPickup` compares `currentCount >= task.targetCount` with `targetCount` undefined (objectives-manager.js ~359/373), so it only syncs progress. Consequence: aims 1 and 2 never complete, `openTasks` lists them to the end. Mission still concludes because `concludeRequires` is the four flags.
Repro: new game, talk to Patricia, read `getState().objectives`: `obtain_security_badge` active while the inventory holds the Visitor Badge.

**D2 (medium, intermittent). Recruiter's first call skipped the intro and the deal (run 1).** After naming Torres to Patricia, the phone call opened at "The Recruiter: Still deciding? The offer doesn't improve with age, agent." with choices "I already told you. No deal." `recruiter_contacted_player` was true before the call's first line; `recruiter_deal_offered` stayed false; ringing back gave the same knot; the debrief then had no deal line and no confession choice. Same route in run 3 worked. Differences in run 1: phone opened and HaX thread read at the start, Patricia talked to twice before naming, and `conversation_closed:patricia_morgan` was logged twice (log events seq 1197 and 1198, see drain in run 1). Not reproduced in 1 of 2 Patricia-route runs; cause not established. Evidence: run 1 session log, phone `getState` after the naming conversation.

**D3 (low). HaX's case-ready text and Torres still point at Patricia when she is KO'd.** Run 2: HaX "Take it to Patricia and name him. She won't move on anything less." and Torres "I know you're there. Patricia sent you." after Patricia was knocked out.

**D4 (low, unconfirmed). Opening briefing did not play in run 3.** Bootstrap trace was just "close title-screen, close notes, dismiss tutorial" (run 3 log seq 3), `briefing_played` true but `receive_mission_briefing` stayed active; runs 1 and 2 played the cutscene. Could be harness timing; report, not chased.

**D5 (low). `conversation_closed:patricia_morgan` emitted twice** in run 1 (see D2).

**D6 (note). Doorway handling.** `enter` returned `did-not-cross` for unlocked, still-closed doors until `interact` on the door was sent, then walking through. Patricia's office door (west) does not appear in `room` doors, so `enter` back to reception reports no known doorway; walking west works. Harness, not scenario.

**D7 (note). Dr Chen never offered her research badge** on the branch taken ("Help me understand...", "Tell me about your team", "David Torres", "That's all"). The hallway was opened with Kevin's badge instead, so the optional Chen route is untested.

**D8 (harness). Reloading a concluded game wedges the session** (bootstrap/eval never return, run 1b/1c). Session with `?skip_resume=1` worked for a read-only check (run 2b). Also two background `session-stop/start` processes had to be killed by hand.

**D9 (note). Flag-station typing.** `mg type` with `clear:true` once left a value missing its first characters ("ag{...") and the submit was rejected as invalid (run 1). Retyping worked. Probably harness.

**Other unexpected things looked for, none found:** no blocked doorways on the route (server hallway and all other doors passable), no NPC out of reach (Patricia, Kevin, Lisa, Chen, Torres all interactable; Torres visible only after naming), no barks over conversations seen, all aim 3/4/5 non-collect tasks ticked.

## Step log (abridged; all line references in the run logs)

- Run 1: bootstrap, close opening briefing; open phone (HaX only); Patricia talk (badge); incident log; Kevin talk (badge, card, lockpick); sticky note; Torres office (card), journal, briefcase (assisted pick), medical bills; server hallway, server room (`quantum2024`), Bludit terminal, drop-site flags 1-3 (`case_ready_notified`), data centre items (schedule, manifest, envelope); Lisa, leaflet, Dr Chen; Kevin and Dr Chen and Lisa re-talk; Patricia vetting file and naming; Recruiter call (D2); Torres, fight choice, `debugKO`, Escape/X refused, stay; HaX nag confirmed; flag 4 -> debrief -> credits; sync, verify, status query.
- Run 2: Patricia KO at once; HaX relay; Kevin (Patricia-down lines); HaX refuses no evidence, refuses motive only; upload schedule -> nudge; HaX naming; Recruiter text -> call -> deal taken; 4 flags; Torres turn ending; debrief confession branch; credits.
- Run 3: Patricia asked for office access (authority); Kevin KO (HaX relay, relayed badge and card worked); naming to Patricia, Recruiter refused; Torres detain with treatment deal; 4 flags after the confrontation; debrief; credits.

## Not tested

Expose ending; Lisa/Chen KO; real combat; the post-KO safety net (Escape did not close the scene); Dr Chen's badge route; the filing cabinet; the lockpicking/Bludit guide calls; SecGen flag order on a real VM build; reload in mid-game.
