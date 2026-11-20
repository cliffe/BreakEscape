# m07 Architect's Gambit, pass 2 playtest

Question answered: 1 (plumbing) plus 2 (unexpected behaviour). Not a solvability pass: flags were handed over (`<flag:N>`, standalone, no VM).
Source of steps: scenarios/m07_architects_gambit/TESTING_WALKTHROUGH.md and PASS2_IMPROVEMENTS.md.

Session logs (JSONL, one line per command/result):
- Run 1, game 1177, Fracture via briefing, redirect declined, flags 1,2,3,4 in order: tools/playtest/m07-pass2-session.jsonl (1794 lines), reload check: m07-pass2-reload-session.jsonl
- Run 2, game 1178, briefing closed early, Trojan Horse via HaX, badge by PIN 0616, Elena fled, flag 4 before 3: m07-pass2-run2-session.jsonl, then m07-pass2-run2b-session.jsonl (restarted after a page reload)
- Flags XMLs: m07_architects_gambit-flags-game1177.xml, ...game1178.xml

## verify-run.rb, run 1 (game 1177) -- status=completed, mission_concluded_at 2026-10-01 00:26:31 UTC
    game            1177  (mission 51)
    created         2026-10-01 00:10:33 UTC
    last write      2026-10-01 00:26:37 UTC
    played for      964s of wall clock
    current room    "security_checkpoint"
    unlocked rooms  4: security_checkpoint, operations_floor, server_room, scada_control
    unlocked objs   1: crisis_control_system
    inventory       8: Your Phone, Lock Pick Kit, Notepad, Facility Access Badge -- Server Zone, Shift Handover Sheet, Plant Maintenance Key, Listener Capture -- Operator Credentials, Sequence Abort Confirmation
    NPCs met        7: opening_briefing_cutscene, agent_0x99, jake_morrison, the_architect, closing_debrief, elena_rodriguez, james_mercer
    flags submitted 4: flag{m07_architects_gambit_scada_attack_host_1_9c113e}, flag{m07_architects_gambit_scada_attack_host_2_570119}, flag{m07_architects_gambit_scada_attack_host_3_5451ca}, flag{m07_architects_gambit_scada_attack_host_4_76b118}
    globals set     36: architect_contact, architect_signoff_done, architect_signoff_started, architect_t20_played, badge_obtained, badge_pin_found, briefing_played, cascade_armed, debrief_played, debrief_stance, elena_outcome, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_coordination_traffic, grid_saved, mercer_fate, mercer_ko, mercer_stance, mission_complete, morrison_resolved, park_resolved, player_name, privesc_guide_offered, projection_revised, recon_guide_offered, redirect_declined, redirect_window_closed, rfid_guide_offered, scada_password_found, start_debrief_cutscene, team_assigned, team_assignment, vault_pin_found, visitor_log_read
    
    VERDICT: progress recorded — 3 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
    Cross-check the specifics above against the report.

## verify-run.rb, run 2 (game 1178) -- status=completed, mission_concluded_at 2026-10-01 00:45:55 UTC
    game            1178  (mission 51)
    created         2026-10-01 00:33:07 UTC
    last write      2026-10-01 00:46:01 UTC
    played for      774s of wall clock
    current room    "security_checkpoint"
    unlocked rooms  6: security_checkpoint, operations_floor, server_room, generator_room, cable_vault, scada_control
    unlocked objs   2: badge_printer, crisis_control_system
    inventory       8: Your Phone, Lock Pick Kit, Notepad, Shift Handover Sheet, Printed Contractor Badge, Plant Maintenance Key, Listener Capture -- Operator Credentials, Sequence Abort Confirmation
    NPCs met        8: opening_briefing_cutscene, agent_0x99, jake_morrison, the_architect, closing_debrief, elena_rodriguez, thomas_park, james_mercer
    flags submitted 4: flag{m07_architects_gambit_scada_attack_host_1_1b9847}, flag{m07_architects_gambit_scada_attack_host_2_af02a0}, flag{m07_architects_gambit_scada_attack_host_4_6ec980}, flag{m07_architects_gambit_scada_attack_host_3_ee030a}
    globals set     32: architect_contact, architect_signoff_done, architect_signoff_started, badge_obtained, badge_pin_found, briefing_played, debrief_played, debrief_stance, elena_outcome, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, flags_nag_sent, found_coordination_traffic, grid_saved, lockpicking_guide_offered, mercer_fate, mercer_stance, mission_complete, morrison_resolved, park_resolved, player_name, privesc_guide_offered, projection_revised, recon_guide_offered, rfid_guide_offered, scada_password_found, start_debrief_cutscene, team_assigned, team_assignment, vault_pin_found
    
    VERDICT: progress recorded — 5 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
    Cross-check the specifics above against the report.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Server badge, run 1 | item | Jake Morrison, after the visitor log leverage line | before ops floor | yes |
| Server badge, run 2 | item | Printed Contractor Badge, badge station | after handover sheet | yes |
| Badge station PIN | 0616 | Shift Handover Sheet, ops floor | read before use | yes |
| Plant key | item | ops floor, floor by desk | before generator door | yes |
| Control-room password, run 1 | CascadeWindow19 | Elena (turned) | before use | yes |
| Control-room password, run 2 | CascadeWindow19 | Elena had fled; the flag-2 Listener Capture never reached the player (D1) | -- | **no** |
| Vault PIN, run 1 | 4703 | Elena (turned; vault door not opened in run 1) | -- | yes (held, unused) |
| Vault PIN, run 2 | 4703 | Plant Maintenance Log, generator room | read before use | yes |
| Flags 1-4 (both runs) | <flag:1>..<flag:4> | scada_attack_host VM, not possible standalone | -- | **no, handed over** |

Boundary: the VM work behind all four flags was exercised, not tested. Everything after each flag (rewards, tasks, clock, console, debrief) was exercised for real. Run 2's password use is unearned because D1 broke the only other route.

## Priorities

1. Critical path: PASS both runs (status completed, concluded_at set). Mercer KO in run 1 was debugKO (assisted, combat not played).
2. Console gate: PASS. Before flag 4 the console shows a flag prompt; the real flag-4 value typed there gave "Validation failed" (run 1). After the relay accepted flag 4 the console opened as a container, no prompt, grid_saved and mission_complete set (client-side unlock in run 1, unlocked-on-room-load in run 2).
3. Countdown: PASS. HUD hidden before flag 3, "CASCADE SEQUENCE 14:55" after, ticking; hidden (display none) after the console opened. Run 2: flag 3 submitted after grid saved gave armed=false, no clock. Reload after the win (run 1 game, new session): clock hidden, countdown_expired false, cascade_armed/grid_saved still true. I did not wait 15 minutes, so natural expiry is untested.
4. Architect: PASS with one defect (D2). Phone opened before the ops floor: thread shows "No messages yet", opens to a bare "Hang up." option, no taunt. Entering the ops floor raised the bark; clicking it ran the first call. Sign-off opened as a call when the console container closed.
5. Debrief: PASS. Run 1: debrief played in full, then the bond visualiser. Run 2: grid saved with flag 4 only: no debrief, flags nag sent (flags_nag_sent), no debrief on room entry; submitting flag 3 (the last) opened it as the station closed.
6. Commit/redirect: PASS with defect D3. Briefing commit set team_assigned. Close-early then HaX commit worked (Trojan Horse). On Trojan Horse the HaX hub offered no redirect after flag 1 and the flag-1 message differs. On Fracture the redirect was offered; "No. Leave them where they are." set redirect_declined (true in globals, debrief says "held").
7. NPCs: Morrison (talked round, hides; patrols on clear floor), Elena (turned; fled hidden, visible=false, stays hidden after reload), Park (cable vault, open floor), Mercer (hostile path, walk-out path, hides) all reachable; none inside furniture except Elena (D4). Re-talk with Morrison/Elena/Park/Mercer hubs: no "(End of conversation)". Elena flee: she vanished, no attack seen.
8. Other findings below.

## Defects (evidence in the logs; I classify none as engine or scenario with certainty)

D1. Flag 2's Listener Capture note never reaches the player. Repro: submit flag 2 at the relay. Server inventory has "Listener Capture -- Operator Credentials" (verify-run output above), `item_removed_from_scene` fires, but the client inventory and notepad never list it, also after a reload. HaX says "the relay's put the capture in your inventory". Suspect cause: public/break_escape/js/systems/inventory.js lines ~501-507 return early for any `notes*`-type item ("belong in the notepad"), but no notepad entry is made for a reward-given note. Effect: the advertised second route to the control-room password does not work for a player who lost Elena. Run 2 used the password unearned for this reason.

D2. Stale T-20 taunt plays after the sign-off. Run 1: the Architect's `architect_t20_played` bark (set by the timer after flag 3) was never clicked, so after the sign-off the `parked` knot routes back to `start` and plays taunt_t20 ("The handset cuts across the facility alarm... You've sent your team... Eighty to a hundred and forty... on your clock") after the win, mid-call, just before the debrief opens. Run 2 (clock never armed) did not show it. Source: m07_architect_comms.ink `signoff_close` -> `parked` (line ~299, ~320).

D3. HaX opens "the board says the team's still uncommitted" after a briefing commit. Run 1: team committed to Fracture in the briefing, yet the HaX thread (preloaded before the commit) says Netherton is holding for the call and ends in the commit menu, selectable. Run 2 (commit via HaX): right after "Passed up and confirmed" the hub still offers "Where the team goes: I'm ready to make the call." until the phone is reopened. Also after a page reload (run 2) HaX replayed its first-call text ("I'm running you from the ops room... Get inside") after the grid was already saved (known reload state loss).

D4. Elena stands inside the server-rack rows (server_room 832,129): sprite overlaps the racks (screenshot elena.png in the session scratch; head shows over the rack row). She is reachable only from x~820,y~145.

D5. Mercer's lines are stale after flag 4. Both runs: "Which you appear to have already reached. Somebody has root on it" is right, but the hostile branch narration says "the sequence is still waiting on a host in the server hall, and that is still where you have to go", and the walk-out line says "The host is in the server hall. That's where tonight gets decided", and he says "When the third submission is declined, agent, somebody does this". All after root.

D6. Sign-off says "The countdown on the wall stops" in run 2, where the clock was never armed (flag 3 not yet submitted).

D7. HaX RFID offer arrives after the reader already opened (run 1, door opened on the badge; "That reader wants a server-zone badge... Want the RFID field guide?" and the lockpicking offer arrive after the door is unlocked).

D8. US/UK wording, US setting (I-5, Portland): "unmarked saloon", "windscreen", "three storeys", "torch" (Morrison, Elena, Park), "ten metres", "metres", "colour". Not UK-wrong for the repo's UK English rule, but odd for a US setting; listed because you asked.

D9. Wording: no line said SAFETYNET arrests anyone. Checked: Morrison "waited for the police", Mercer "into custody at the bottom of the stairs" (police/custody, no agency named). The player line "SAFETYNET. Hands where I can see them." (Elena option 2) is the player threatening, not an arrest.

Harness/geometry notes (not defects): moveToNear often stopped 30-40 px short at the handover sheet, the plant key, and the relay (colliders); keyboard moveTo or walking got there. Server-room relay is reachable only along y~145 from x 782. Page reload while bootstrap is running hangs the harness; I killed it and used a new session. Known issues seen: reload resets room to checkpoint and shows the Mission Brief note; wrong-password not tried.

Not tested: natural clock expiry, Elena KO, fight routes, redirect taken, Morrison fight/evade, each Mercer ending, the other two delegation targets.
