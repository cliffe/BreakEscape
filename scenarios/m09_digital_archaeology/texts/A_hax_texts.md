# m09 texts, group A: Agent HaX (`agent_0x99`)

Stage 9 pastes these as `sendTimedMessage` mappings on `agent_0x99` (unvoiced, no prefix). CONTRACT §2.3. Conditions outside ink are `&&` only, written `globalVars.<name>`, no `||`, no brackets: an "or" is two rows. **Fixed** marks a string copied from the contract; the rest are group A's. Texts from one event go 4–6 s apart (`delayMs` steps of 5000 unless a row says otherwise).

## 1. Door refusals

| # | Text | Trigger (stage 9) | Notes |
|---|---|---|---|
| A3-01 | That reader's on the catalogue server. Get me in there and I'll open it. | `door_unlock_failed`, `data.connectedRoom === 'restricted_stacks'` | `onceOnly`. **Fixed** |
| A3-02 | Her keypad's off the card system. Leave it for now. | `door_unlock_failed`, `data.connectedRoom === 'sorensen_office'` | `onceOnly`. **Fixed** |
| A3-03 | That reader wants a real card. Hers will be somewhere she trusts. | `door_unlock_failed`, `data.connectedRoom === 'tape_room'` | `onceOnly`. **Fixed** |

## 2. The night's beats

| # | Text | Trigger (stage 9) | Notes |
|---|---|---|---|
| A3-04 | Tran's just sent the guard to your door. | `conversation_closed:agent_0x99` with `globalVars.flag1_submitted && globalVars.m01_maya_ko` | `onceOnly`, `delayMs: 3000`, so it lands after `flag1_read` closes. **Fixed** |
| A3-05 | That cabinet takes a print. She stamps everything. | `room_entered:restricted_cage` | `onceOnly`, `delayMs: 2000`. **Fixed** |
| A3-06a | That box behind her is the last of the night. The legacy files. | `global_variable_changed:cage_opened` with `value === true && !globalVars.m05_found_pipeline_list` | `onceOnly`. Script edit R1 A-18: the contract's one 37-word text split in two, 5 s apart (revised fixed string). Two rows per text for the "not warned in time" arm, because `!(a && !b)` is `!a` or `b` |
| A3-06b | She gets to it when you pass her for the cabinet, or leave the cage. She won't stop for asking. | as A3-06a | `onceOnly`, `delayMs: 5000` |
| A3-06c | (A3-06a's string) | `global_variable_changed:cage_opened` with `value === true && globalVars.m05_found_pipeline_list && globalVars.m05_recruiter_deal_accepted` | `onceOnly` |
| A3-06d | (A3-06b's string) | as A3-06c | `onceOnly`, `delayMs: 5000` |
| A3-06e | The legacy files are under Noor's desk. Let her shred the rest. | `global_variable_changed:cage_opened` with `value === true && globalVars.m05_found_pipeline_list && !globalVars.m05_recruiter_deal_accepted` | `onceOnly`. **Fixed** |
| A3-07 | Hold his file next to the notebook scan in my case file. Then tell me what you see. | `global_variable_changed:nightshade_file_held` with `value === true && !globalVars.flag3_submitted` | `onceOnly`. **Fixed** |
| A3-08 | She's still feeding it. | `room_entered` with `globalVars.flag2_submitted && !globalVars.hatch_talked` | `onceOnly`. **Fixed** |
| A3-09 | She's sixty-six. | `npc_ko:sorensen` | `onceOnly`. **Fixed** |
| A3-10 | She's done with that box. | `npc_ko:sorensen` with `globalVars.legacy_clock_run` | `onceOnly`, `delayMs: 5000` (after A3-09). **Fixed** |
| A3-11 | Her cracker. Use it anyway. | first `room_entered:sorensen_office` with `globalVars.sleeper_named` | `onceOnly`, before the safe. **Fixed** |
| A3-12 | Safe's open. Kowalczyk will want to hear about her toy. | the safe's unlock (`director_safe`) with `!globalVars.sleeper_named` | `onceOnly`. **Fixed** |
| A3-13a | Sale. WREN. To Agent 0x00. Consideration, one deck. Booked. | `global_variable_changed:office_entered` with `globalVars.recruiter_offer === 'taken'` | `onceOnly`, `delayMs: 20000`; sets `invoice_booked` (S4 §6.6). **Fixed** |
| A3-13b | She's booked you. You're in her ledger now. | as A3-13a | `delayMs: 25000`. **Fixed** |
| A3-13c / d | (A3-13a and A3-13b again) | `global_variable_changed:office_entered` with `globalVars.recruiter_offer === 'double_crossed'` | the second mapping for `double_crossed`, same delays |
| A3-14 | Bring me his file. Then we say it. | `global_variable_changed:flag3_submitted` with `value === true && !globalVars.nightshade_file_held` | `onceOnly`, `delayMs: 2500`. **Fixed** |
| A3-15 | His file first. Then the rest of his box. | `global_variable_changed:flag4_submitted` with `value === true && !globalVars.identity_scene_started && !globalVars.nightshade_file_held` | `delayMs: 1500`. **Fixed** |
| A3-16 | Owner first. Get me flag three, then we read the rest of his box. | `global_variable_changed:flag4_submitted` with `value === true && !globalVars.identity_scene_started && globalVars.nightshade_file_held && !globalVars.flag3_submitted` | `delayMs: 1500`. The owner-first text (A-7, M9-15) |

## 3. Field-guide offers (A-7)

No raid team, no WREN, no VM detail. Each mapping also sets its `<x>_guide_offered` (S4 §7.2); the text names the button, "[I need a field guide.]", in plain words.

| # | Text | Trigger (stage 9) | Notes |
|---|---|---|---|
| A3-17 | There's a field guide for the catalogue server if you want it. Ask me. | `object_interacted` with `data.objectType === 'vm-launcher' && data.roomId === 'reading_room'` | `onceOnly`; sets `catalogue_guide_offered` |
| A3-18 | I've a field guide for the ledger, if you want it. Ask me. | `global_variable_changed:flag1_submitted` with `value === true` | `onceOnly`; sets `ledger_guide_offered`; `delayMs` long enough to land after `flag1_read` closes and Nightshade's call (if any): 15000 |
| A3-19 | Field guide for his box is ready. Say the word. | `room_entered:salvage_cage` | `onceOnly`; sets `tomb_beta_guide_offered` |
| A3-20 | If the cipher's new to you, there's an archive-code field guide. Ask me. | `global_variable_changed:salvage_keypad_seen` with `value === true && !globalVars.m02_gary_protected` | `onceOnly`; sets `archive_code_guide_offered`. On Gary's branch set the global with no text (his call covers it), so his ring and this text never land together |

## 4. Document remarks (A-8; S6 §1 "HaX (ink)")

Each fires once on its document's read or pickup. The read latches (`rent_ledger_read`, `refit_ledger_read`, `danny_sheet_read`, `case_file_read`, `legacy_box_read`) are CONTRACT §5.5's proposals for stage 9: an `onRead` `setVariable` on each `notes` object. `lease_file` and `derek_file` key on `item_picked_up:notes` with `data.itemId` (check at stage 9 that a `#give_item` from `sorensen_hatch` / `sorensen_door` emits `item_picked_up` for `derek_file`; if not, key it on `global_variable_changed:cage_bin`).

| # | Text | Trigger (stage 9) | Notes |
|---|---|---|---|
| A3-21 | There it is. Tomb Gamma has an address. | `item_picked_up:notes`, `data.itemId === 'lease_file'`, with `!globalVars.m08_tomb_gamma_location_known` | `onceOnly`. **Fixed**. Script edit R1 ruling 5: cold starts get this line too (the cold briefing has Nightshade in custody saying nothing) |
| A3-22 | Same site Nightshade gave us. Now it has a lease. | as A3-21, with `globalVars.m08_tomb_gamma_location_known` | `onceOnly`. **Fixed** |
| A3-23a | Big Sky was on Zero Day's client list. Sterling's keys opened it after Cardiff. | as A3-21, with `globalVars.m03_victoria_fate === 'arrested'` | `delayMs: 5000` after A3-21 or A3-22. **Fixed** |
| A3-23b | (same string as A3-23a) | as A3-21, with `globalVars.m03_victoria_fate === 'ko'` | `delayMs: 5000`. **Fixed** |
| A3-24 | Irina's account paid for this. Tell her it bought us the deed. | `global_variable_changed:rent_ledger_read` with `value === true && globalVars.m06_irina_recruited` | `onceOnly`. **Fixed** |
| A3-25 | St. Catherine's money. It bought the blast door. | `global_variable_changed:refit_ledger_read` with `value === true && globalVars.m02_paid_ransom` | `onceOnly`. **Fixed** |
| A3-26a | Danny's statement just became evidence. | `global_variable_changed:danny_sheet_read` with `value === true && globalVars.m03_danny_fate === 'protected' && !globalVars.m03_danny_ko` | `onceOnly`. FA row 36 |
| A3-26b | (same string as A3-26a) | as A3-26a with `globalVars.m03_danny_fate === 'exposed' && !globalVars.m03_danny_ko` | `onceOnly` |
| A3-26c | Danny asked again last week. I didn't have an answer. Tonight I might. | as A3-26a with `globalVars.m03_danny_fate === 'protected' && globalVars.m03_victoria_fate === 'recruited' && !globalVars.m03_danny_ko` | `delayMs: 5000` after A3-26a. FA row 36: he was told Sterling would answer for it, and she hasn't |
| A3-26d | (same string as A3-26c) | as A3-26c with `globalVars.m03_victoria_fate === 'escaped'` in place of `'recruited'` | `delayMs: 5000` |
| A3-26e | "Loose end, resolved." I rang. He's alive, and still hiding from them. Good. | as A3-26a with `globalVars.m03_danny_fate === 'left' && !globalVars.m03_danny_ko` | `onceOnly`. Keeps the document's first words first (S6 C-23). A knock-out or never played: no text |
| A3-27a | Nobody of ours in here. Ours are on her tape, by codename. | `global_variable_changed:legacy_box_read` with `value === true` | `onceOnly`. **Fixed**. `legacy_box_read` latches on both `feed_table_box` and `noor_desk_box` (the same Series L sheets) |
| A3-28a | There's your why. He was told to. | `item_picked_up:notes`, `data.itemId === 'derek_file'`, with `globalVars.m01_final_choice === 'surrender'` | `onceOnly`. **Fixed** |
| A3-28b | He wanted your headlines. | as A3-28a with `globalVars.m01_final_choice === 'expose'` | `onceOnly`. **Fixed** |
| A3-28c | "Will not stop when they tell him to." He didn't. | as A3-28a with `globalVars.m01_final_choice === 'fight'` | `onceOnly`. A's call (A-8): the page's own forecast, paid by the fight. Keeps the quoted words first |
| A3-28d | He believed this more than the man who wrote it. You turned him anyway. | as A3-28a with `globalVars.m01_final_choice === 'recruit'` | `onceOnly`. A's call (A-8) |
| – | (no text) | `m01_final_choice === 'arrest'` or never played | A's call: on `arrest` the page's standing order ("put the device down and wait") already reads as what happened; a line would repeat it |
| A3-29a | After Quantum Dynamics we checked everyone TalentStack ever touched. Harwick & Lowe shut before TalentStack opened. | `global_variable_changed:sleeper_shortlist` with `value === true` | `onceOnly`. **Fixed** |
| A3-29b | You took her side at the briefing. Keep it. Don't take her word. | as A3-29a with `globalVars.raid_team_answer === 'quintero'` | `delayMs: 5000` after A3-29a. **Fixed** |
| A3-30 | Your tags, from HashChain. Someone's paying rent on a building in Montana that isn't this one. | `global_variable_changed:case_file_read` with `value === true && globalVars.m06_monitoring_enabled` | `onceOnly`. **Fixed** |

## 5. Notes for stage 9

- A3-06a–d replace the contract's single 37-word text: two texts (script edit R1 A-18), each on two mappings, because the negation of `m05_found_pipeline_list && !m05_recruiter_deal_accepted` is an "or".
- A3-04 keys on HaX's thread closing so the text can't land inside `flag1_read`; if stage 9 prefers `global_variable_changed:flag1_submitted` with a long delay, 12000 ms clears the 2500 ms ring and a short read.
- Every text is under 30 words; none starts with `*`, `-`, `+`, `=` or `#`.
- New read latch for stage 9 (script edit R1 A-05): `alpha_annotations_read`, an `onRead` `setVariable` on `alpha_annotations` (readable only after the identity scene, S6). HaX's hub topic 3b, "[His annotation sheets, with the tapes.]", is gated on it; `alpha_clip_played` is no longer read by A1.
