# User decisions, 2026-11-11

Answers to the access model form (https://claude.ai/artifact/PanecaCQBMChKnqsDGa98a). Each line: question, answer, what follows.

- q01 Re-voice the 34 changed lab lines: now.
- q19 Ruth's 6 changed lab lines (9.3a step 9): now (voiced once the lab round 1 fixer has finished editing her ink).
- q20 Chris's new lab password: update the HacktivityLabSheets sheet when the lab sheet pass runs.
- q02 Voice the m02 to m07 stage-direction lines: yes, after merge (merged, so now).
- q03 Lock chime: not tested yet; no change.
- q04 Disguise vest: both a "worn" frame and a no-change-while-seen rule. Queued as an engine build.
- q05 PASS4_BRIEF line 30: aligned with the no-stage-directions rule (done).
- q06 Attribution lines in old pushed commits: leave history alone.
- q07 Second coffee source for Chris: no.
- q08 Gary's keycard and Irina's badge hand-overs: keep delivery notes.
- q09 Playtest-scenario skill sentences from the builders: approved.
- q10 Stage-direction rewrite for m01, m08 to m10, shared ink and test scenarios: yes.
- q11 TTS endpoint lookalike-character issue: fix as its own small build, in parallel.
- q12 and q18 Playtest leftovers in the shared dev database: delete the games (older and today's), keep mission 167.
- q13 Old agent worktrees: remove clean ones whose branch is merged (worktrees only; branches kept).
- q14 9.3b after 9.2 C: carry on into 9.3b.
- q15 m02 Val's radio "Don't.": add a narrator radio beat.
- q16 tts-audio skill wording for delivery notes: apply (the voice tag branch is merged).
- q17 9.2 frustration icon: drop to a fading icon when the cause clears.
- q21 A distinct icon for an NPC doing a workaround: make one with PixelLab, one sheet at a time with the user's feedback (first 16x16 candidate sheet generated; picks on the form).
- q22 Netherton's glasses habit in the shared hubs: go with the reviewer's view (applied).
- q23 TTS endpoint: replace the earlier "keep the fragment looseness" decision; only a scenario's own lines are voiced. Unblocks the lookalike fix's merge.
- q24 The lookalike fix's tts-audio skill wording and the stale note in docs/agents/TTS_38_MIGRATION.md: apply both when the fix merges.
- q25 Shared-ink and test-scenario lines from the stage-direction rewrite: do not voice them.
- q26 Seven m02/m03 phone lines that print the player's name: reword to fixed wording and re-voice (build/phone-names).
- q27 Workaround icon: candidate 56 (an arrow over a striped barrier), now `assets/icons/npc-workaround.png`. Also use the barrier without the arrow as the "getting blocked" action icon, and similar: `npc-barrier.png` (candidate 7, the same barrier drawn plainly; removing 56's arrow would need a redraw). Wiring waits for 9.2 H to merge (shared files).
- q28 The seven m02/m03 phone lines: keep the player's name; build/phone-names dropped (the lines are phone text, never voiced).
- q29 Voice m02 Ghost's 38 video-call lines after the TTS fix merge (lab_tesseract_trials and chat_minigame_demo not voiced).
- q30 Frustration icon: keep the no-entry sign (npc-barrier stays "this attempt failed").
- q31 Agent HaX's new canonical voice style (origin commit 1fd322e67) re-keys about 525 m01 to m03 clips: leave for a separate session. Until then m02 shows 308 and m03 205 HaX clips unrequested, with the same lines missing.
- q32 9.3b plan: all 8 recommended answers accepted (ACCESS_MODEL_SLICE_9_3B_PLAN.md section 13): K and O after 9.2 L and C land; W, P and I in parallel; lab port security later; ids wifi_<net>, implant_<pc>; outages keep sessions; port security refuse-only; 8-path cap; Wi-Fi and implant footholds permanent; sign-out ends onward sessions.
- q33 (2026-11-12) Lockout scope: a lockout stops every use of that PC, social media too ("depends on the nature of the lockout"). Applied as: the lockout locks the account at that PC, so the NPC falls back to its personal phone (its own accounts, unaffected). Follow-up build after 9.2 C merges; a per-lockout scope field (for example a domain account that locks every PC the account signs in to) only if the user wants it.
- q34 (2026-11-12) Friendface posts about frustrations and needs: yes, as a follow-on sub-slice "9.2 C2: reactive posts" after 9.2 C. Authored posts carry a condition (frustration level, a failure cause, a workaround, a need met or unmet) and the server picks them from state it records. The order in which fact posts and reactive posts are fed is configurable: facts first then reactive, reactive first, or mixed.
- q35 (2026-11-12) A lockout for an NPC with work and a `"phone": false` social need: keep counting it once per need it blocks (as `off` does). Also: an NPC that carries a phone holds it in `itemsHeld` as a Friendface phone item; if the player gets it and opens it, it opens Friendface on that NPC's profile. Sprite: the existing phone sprite with its Bluetooth logo replaced by an F like the Friendface logo. Built as build/ff-phone.
- (2026-11-12) Dungeon graph to draw links, outages, Wi-Fi and implants: now (build/graph-net). Lab port security on an unused comms-cupboard port (9.3b plan section 13 item 2): now (build/lab-portsec). Record `npcId` on captured `/feed_post` rows in the playtest skill's response-capture.js: approved (build/capture-npcid).

## Carried out

- q12/q18: deleted dev-database games 1164 to 1200 (36 test and lab playtest games made on 2026-11-11 under the demo user). Games 92, 115, 121, 128, 133, 134, 135 were already gone. Kept: 1160 to 1163 (lab games from 2026-11-08, on no list), 1201 and 1202 (in use by running agents; delete when they finish). Mission 167 is `ca_annual_2027_defend`, not `test_access_work` as the 2026-11-10 handover said; kept as asked. The `test_access_work` mission row is 243.
- q13: removed 58 worktrees that were clean, whose HEAD is in main and that no process was using (84 GB freed). Branches kept. Kept worktrees: BreakEscape-merge, agent-ae40074c527a6f395, orch-merge, r1-fixes, r2-fixes (unmerged commits); agent-ab846af84a003a2d3, sync-merge (uncommitted changes); the active p-* build worktrees.
- q05: done in this commit's parent.
- q12/q18, later: deleted dev-database games 1201 to 1227 (27 playtest games made on 2026-11-11 under the demo user, once no agent was using them).
- q12/q18, 2026-11-12: deleted 50 more playtest games made by this session's agents (missions 243, 245, 246 above id 1227, plus 1283, 1292 to 1294, 1318 and the newer ones from the same runs; all demo user, all after 2026-11-11).
