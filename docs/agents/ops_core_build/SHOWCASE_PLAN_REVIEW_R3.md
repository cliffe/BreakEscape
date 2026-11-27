# Ops showcase plan: review R3

Reviewer: Opus, design review round 3, read-only except this file. Plan: `docs/agents/ops_core_build/SHOWCASE_PLAN.md` at commit bbb3c745f. Kind of game: demo scenario.

Worktrees cited: `[main]` /home/deploy/BreakEscape, `[follow]` /data/be-ops-follow, `[build]` /data/be-ops-build, `[skin]` /data/be-ops-skin, `[logs]` /data/be-ops-logs. Paths without a tag are in `[follow]`.

## Findings

Counts: 0 blockers, 2 majors, 8 minors. Verdict at the end.

### Blockers

None. Every beat in sections 5.4, 6.4, 7.4 and the appends is reachable by clicking, given the forcing levers below (M1 narrows which ones force more than once).

### Majors

**M1. "Send them for coffee" fires once only, but the plan calls it repeatable and leans on the repeat (7.4 M6, 8.5 Run B, 7.6 Gwen).**
Evidence: an ink write of the value a global already has emits nothing (`public/break_escape/js/systems/npc-conversation-state.js:598-604`, "ink re-assigning the current value" returns early; `systems/global-writer.js:18-19`, `global_variable_changed` "only on a change"). Every coffee mapping, including Anjali's new one (7.2), listens on `global_variable_changed:coffee_call`, so the second "Send them for coffee" changes nothing. In the second-step showcase Run A spends the lever on M4, M1 and M8; Run B then says "Send them for coffee (repeat it if the window closes)" for M6, and M7 and 7.6 (Gwen: "Ama's coffee or lunch lever reaches her") rely on it again. `act_midday` is spent by then too, so Gwen's lunch lever is also dead in S8c. The beats stay reachable on natural thirst and caffeine, but ground rule 3 (a lever per beat, deterministic for a test) does not hold, and R2 M4 is closed only for the first press.
Fix: make the coffee lever a counter. Declare `coffee_call` as a number (0); Ama's choice does `~ coffee_call = coffee_call + 1` and stays offered; every coffee mapping is `{ "eventPattern": "global_variable_changed:coffee_call", "cooldown": 0, "needs": { "set": { "<caffeine or thirst>": <below urgentAt> } } }` with no `data.value === true` condition. Say this shape once in section 4 ("The host") and apply it in 5.2, 6.2, 7.2 and 7.6. In 7.6 drop "or lunch" for Gwen (her lever is the coffee counter). Add one S-T assertion or PLAYTEST line: a second press sends Anjali again.

**M2. The S8c leak-scan step asserts zero findings, but the scanner is documented to flag honest lock answers in a scenario that also has PC steps, which `demo_ops_second_step` is.**
Evidence: [skin] `docs/ACCESS_AND_NETWORKS.md` A25 "Leak scanner" limits: "an echo dropped in a scenario that also has PC steps is read as a PC answer ... in a scenario with both PC steps and lock steps the older `mfa_secret` and `mfa_session` rules can flag honest lock answers" (at [skin] HEAD 40f392949). Plan 8.4 step 5 says the test "asserts zero findings" with `lock_step_leak_rules.rb` active for S8c. The S-8c unit would either fail its own Done list or loosen the assertion ad hoc.
Fix: in 8.4 step 5 and the S-8c row of 8.3: run the scanner over the S8c cases first; any `mfa_secret` or `mfa_session` finding on an answer that echoes a lock `targetType`/`targetId` is checked by hand against that documented limit and listed in BUILD_REPORT with the answer route; the test asserts zero findings of every other rule and zero `mfa_*` findings on PC answers (filter by the echo). If the S8c branch has closed that limit by the time it lands, the plain zero-findings assertion stands; the unit records which.

### Minors

**m1. S-T asks for "a sign-in refused while the owner is at the desk"; the server does not know where an NPC is.** Owner presence is decided in the browser (`public/break_escape/js/systems/workstation-state.js:617-629,676-680`; `unlock-system.js:603-618`); no server code checks it (`grep "is using this PC"` over `app` and `lib` finds nothing). A Rails route test cannot produce that refusal. Fix: drop it from the S-T row (8.3); it stays in PLAYTEST Run A, where it already is (8.5).

**m2. Yusuf's share goes to Anjali wherever she is, not to her desk.** `share_login` is a visit `{ npcId: run.with }` (`systems/npc-workarounds.js:149-151`); after the coffee lever Anjali may be at the kitchen cooler. Ama's bark "Yusuf's off to Anjali's desk. Stand close." then sends the player to the wrong place. Fix: bark "Yusuf's off to find Anjali. Stand close."; PLAYTEST Run A says "follow Yusuf to Anjali"; P10's fallback ("place Anjali's desk beside Yusuf's") stays.

**m3. Fatima's `prop_door` names no `setGlobal`, and the S8b/S8c tasks name no tick event.** README: the prop is "hidden with `revealOnGlobal` on the workaround's `setGlobal`", and a task maps to `door_propped:<roomId>`, never to the setGlobal (`README_scenario_design.md:1361-1366`). 7.6 says `archive_wedge` is hidden on "the workaround's `setGlobal`" but the workaround lists only `do`, `door`, `prop`. Fix: 7.6 workaround `{ "at": <n>, "do": "prop_door", "door": "archive_store", "prop": "archive_wedge", "setGlobal": "archive_door_propped" }` (declared in `globalVariables`); `propped` ticks on `door_propped:archive_store`. Name the tick for each of `reset_password`, `reenrol`, `desk_refuses` (ink on `helpdesk_it_desk_result`, read for the next line only, [build] docs:882) and `door_step`, `safe_step`, `case_step` (for example `mfa_approved:gwen_pritchard` with `data.targetType === 'door'`, or Ama's ink), or say they are ink ticks.

**m4. M15 after M14: with Gwen's phone still held, "a push Gwen does not answer" becomes "Check Gwen's phone", and approving opens the archive store with the step, leaving the prop nothing to skip.** [skin] docs A25 "What the player sees" (a held owner's phone shows "Check <owner>'s phone"). Fix: Run E: at the archive store, close the pane with the X (do not approve), or run M15 before M14; say so in 7.6 M15.

**m5. Evening: the passwords and second-step plans do not say who stays.** P9 needs Graham at his desk and M10 Thandiwe; `office_life_showcase` hides staff on `act_evening` (`scenarios/office_life_showcase/scenario.json.erb:292`). Fix: 6.9 "staff go home except Graham" and 7.9 "except Thandiwe" (recon 5.7 already says Zainab and Graham).

**m6. Settled owner choices are still written as open questions, and the docs line has no owner.** Ground rules 11 and 12 and section 9 Q1 to Q5 still ask; the owner has settled three showcases, not in the Hacktivity catalogue yet, `logSources` allowed in `demo_ops_*`, voice and fob sprite later and never blocking. Fix: record those answers in 2.11, 2.12 and 9; give the docs:858 ("only `test_ops_*` ... for now") edit to one named unit (R-S, its own commit) or leave it to the owner, so no two units edit `docs/ACCESS_AND_NETWORKS.md`.

**m7. M13 should name its username.** The desk stop counts by typed username and a grant clears it ([build] docs:877-878, "playtest order matters"). Three wrong answers for Darren or Yusuf before M11 or M12 stop that account for five minutes. Fix: M13 uses Lorna's username (no beat resets her), after M11 and M12.

**m8. Gwen's phone on the kitchen charger shows only if the kitchen is loaded when she leaves.** Left-behind items are looked up among loaded rooms' objects (`systems/npc-needs.js:6147-6160`, `W().rooms`), and a miss is skipped until the next leave (`:3376`). Fix: Run E enters the kitchen before sending Gwen; or place the charger in the office.

Cosmetic, no tag: 5.3 still carries the R1 fallback ("the builder checks that `accessList` takes both keys at once ... if not, give Agnieszka `role: "print"`"); R2 closed it. Drop the parenthesis.

## Round 2 and R1 findings: closed or not

| Finding | Status | Evidence |
|---|---|---|
| R2 M1 R4 tick | closed | 5.4 R4 four mappings; condition gates the whole mapping (`npc-manager.js:1578-1597`); `globalVars.x === true` parsed (`:61-62,105`); `setGlobal`, `completeTask` keys (`:1515-1516`); confirm suffix is the built id (`view-controls.js:165`, `network-view-minigame.js:1071`) |
| R2 M2 Delphine salted | closed | `salted: false` wins (`crack_difficulty.rb:40`); unsalted guessable answers at once (`ops_cracking.rb:159-185`); `medium` band 2 = two facts (`validate_cracking.rb:347-351`) |
| R2 M3 `printer_svc` everywhere | closed | lists on `delphine_pc`, `jun_pc`, `graham_pc`, `partner_pc`, `hot_desk` (plan 6.1, 6.5); `acl_admits?` (`access_identities.rb:75-87`) admits by `people` or `role` (+`staff`); none names `service`; P-T asserts both |
| R2 M4 Anjali lever | closed for the first press | 7.2 mapping on `coffee_call`; repeat claim wrong: new M1 |
| R2 M5 M15 nothing to skip | closed | `archive_store` own gated door (7.1, 7.6); [skin] `validate_lock_step.rb:172-187` (owner with a phone); [skin] docs:869; new m3, m4 |
| R2 M6 recovery for MFA accounts | closed | owner-only lists (7.1); [build] `validate_mfa.rb:124-136` counts enrolled admitted accounts; `validate_helpdesk.rb:120-148`; Lorna, Darren, Anjali, Yusuf hold both answers |
| R2 m1 to m9 | closed | m1 5.4 R6; m2 6.4 P4, 8.5 Run B; m3 6.3, 7.4 M4; m4 section 4 (no short id left outside the R1 log); m5 7.1; m6 5.4 R7; m7 section 4; m8 6.7; m9 5.4 R5 |
| R1 M8 printer lever props early | closed | Fatima on `records_index` with its own lever (7.6) and her own door |
| R1 M10 slow windows | partly closed | Anjali lever added (7.2); one-shot coffee global (new M1) |

## Claims the revision added, checked

- Mapping condition gates `setGlobal`: true (`npc-manager.js:1578-1597`).
- Crack difficulty and salting: true as written (above).
- `access` on every sign-in PC: true for passwords and second step; recon's `agnieszka_pc` has none, harmless (no service account; the saved connection names Agnieszka).
- Levers per routine wait: present for every beat; coffee repeat false (M1).
- Second gated room: valid per [skin] A25 placements (not the start room, room `secondStep` gates its door) and README `prop_door` rules (`README_scenario_design.md:1363`), apart from m3.
- `creds.recovery` for MFA accounts: true; the form on `darren_pc` is served from the M8 claim, since a claim is an `access_sessions` entry ([build] `game.rb:3751`, `helpdesk_access.rb:167-173`).
- Log event names in all three sources are registered ([follow], [build], [logs] `lib/break_escape/ops_log_events.rb`).
- `usb_refused:*`, `npc_overheard_login:*` wildcards work (`systems/npc-events.js:51-56`).

## Units and files

Disjoint as in 8.3; wave-3 units run one at a time per scenario. Only shared file outside a scenario: `docs/ACCESS_AND_NETWORKS.md` (m6).

## Withdrawn

None.

## Verdict

not clean (0 blockers, 2 majors, 8 minors).

## Check notes (written as the review ran)

- R4 four-mapping shape: condition gates the whole mapping (`public/break_escape/js/systems/npc-manager.js:1578-1597`); `globalVars.<x> === true` is parsed (`npc-manager.js:61-62,105`); `setGlobal` and `completeTask` are mapping keys (`:1515-1516`); confirm emits `network_finding_confirmed` suffixed with the built finding id, not the alias (`minigames/network-view/view-controls.js:165`, `network-view-minigame.js:1071`). Closed.
- Delphine `salted: false` wins over `medium` (`lib/break_escape/crack_difficulty.rb:40`); unsalted guessable answers at once (`app/models/break_escape/ops_cracking.rb:159-185`); `medium` fact band 2 matches two facts (`scripts/validate_cracking.rb:347-351`, no warning). Graham salted 20 s: first press stores `hit:false`, `nomatch` after wait, clears (`ops_cracking.rb:213-223`). Closed.
- Access: `acl_admits?` matches `people` or `roles` against `npc['role']` plus `staff` (`lib/break_escape/access_identities.rb:75-87`). Every passwords and second-step sign-in PC has a list; none names `service` or `staff`. Recon `agnieszka_pc` has none (no service account there; harmless).
- Global levers: an ink write of the same value emits nothing (`systems/npc-conversation-state.js:604`; `systems/global-writer.js:18-19`). A `coffee_call = true` lever fires its mappings once only. Bears on "repeatable" coffee lever (7.4 M6, 8.5 Run B).
- Owner presence is client-only: no server check (`grep "is using this PC"` finds only `unlock-system.js`). Bears on S-T "sign-in refused while the owner is at the desk".
- `share_login` visits the colleague wherever she is (`systems/npc-workarounds.js:149-151`, `{ npcId: run.with }`), not her desk. Bears on Ama's bark "off to Anjali's desk".
- Helpdesk form: a claim makes an `access_sessions` entry with `via: 'claim'` ([build] `game.rb:3751`), and the form needs only an open unlocked session ([build] `app/models/break_escape/helpdesk_access.rb:167-173`): reachable from M8. Sound.
- Helpdesk recovery rule counts enrolled accounts a PC admits ([build] `scripts/validate_mfa.rb:124-136`, `validate_helpdesk.rb:120-148`): with owner-only lists, Lorna, Darren, Anjali, Yusuf. Closed.
- [skin] A25: `secondStep` on a room gates its door; not the start room; push owner needs a phone (`scripts/validate_lock_step.rb:172-187`); propped door skips the step ([skin] docs:869). `archive_store` sound.
- README `prop_door` rules (`README_scenario_design.md:1363`): prop hidden with `revealOnGlobal` on the workaround's `setGlobal`; plan 7.6 names no `setGlobal` on Fatima's workaround and no tick event for S8b/S8c tasks.
