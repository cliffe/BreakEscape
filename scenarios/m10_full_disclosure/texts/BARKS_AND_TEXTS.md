# m10 barks and texts

Stage 9 pastes these as JSON: a **bark** is the speaker NPC's `bark` on the event; a **text** is a `sendTimedMessage` mapping on the speaker's phone NPC (unvoiced, no prefix). Created at stage 8 (rulings 14 and 15; m10 review R1 M-5). Every unvoiced string m10 needs outside ink is here; nothing in this file is voiced (CONTRACT §4.5).

Conditions are `&&` only, written `globalVars.<name>`, no `||`, no brackets: an "or" is two rows. Every HaX row also carries `!globalVars.hax_jammed` (OT §5), which the condition column leaves out. **Fixed** marks a string copied from a stage document (source in Notes); the rest are new at stage 8. Texts from one event go about 5 s apart (`delayMs` steps of 5000 unless a row says otherwise). Every row is `onceOnly` unless Notes say "repeats".

Speakers: `agent_0x99` (HaX, phone), `lock_guard` (Sione Fonoti), `monitor_guard`, `nightshade_lock`, `tesseract`, `ghost_phone`, `recruiter_phone`, and the slot voice's phone (`vance_phone`, `elena_phone` or `agent_0x99`).

## 1. Door holding barks

| # | Speaker | Text | Trigger (stage 9) | Notes |
|---|---|---|---|---|
| T-01 | `agent_0x99` | Netherton won't call it till the table's settled. | `door_unlock_failed:blast_tunnel` with `!globalVars.door_scene_done` | repeats. **Fixed** (OT §4.1) |
| T-02 | `agent_0x99` | Their monitoring first. Then we go. | `door_unlock_failed:blast_tunnel` with `!globalVars.flag1_submitted` | repeats. **Fixed** (OT §4.1) |
| T-03 | `agent_0x99` | Arakawa's still on the phone. Quintero's waiting on him. | `door_unlock_failed:blast_tunnel` with `globalVars.flag1_submitted && !globalVars.pair_back && !globalVars.arakawa_ko` | repeats. **Fixed** (OT §4.1). Netherton's and Arakawa's catch-ups hear the same event (OT §6) |
| T-04 | `agent_0x99` | The stair's on their system. Whoever's on that handset has it. | `door_unlock_failed:workshop_floor` with `!globalVars.ghost_call_done` | repeats. **Fixed** (OT §3) |
| T-05 | `agent_0x99` | Someone on that floor carries a card for it. Or there's the fitter's locker upstairs. | `door_unlock_failed:power_room` | **Fixed** (OT §4.8) |
| T-06 | `agent_0x99` | The staging copy first. | `door_unlock_failed:gallery` with `!globalVars.flag2_submitted` | repeats. **Fixed** (OT §4.4) |
| T-07 | `agent_0x99` | The hatch. Get under the release service. | `door_unlock_failed:gallery` with `!globalVars.flag3_submitted` | repeats. **Fixed** (OT §4.4) |
| T-08 | `agent_0x99` | The shutter's still live. Power room. | `door_unlock_failed:gallery` with `!globalVars.gallery_shutter_cut` | repeats. **Fixed** (OT §4.4) |
| T-09 | `lock_guard` | That takes the shift code. It's on my card, and it stays there. | `door_unlock_attempt` with `data.connectedRoom === 'core' && !globalVars.lock_guard_known && !globalVars.fonoti_ko` | **Fixed** (OT §4.5). Stage 8 m-3: never from a knocked-out Fonoti |
| T-10 | `lock_guard` | Who gave out the code? | `door_unlocked` with `data.connectedRoom === 'core' && globalVars.ghost_gift === 'code' && !globalVars.outer_lock_open && !globalVars.fonoti_ko` | **Fixed** (OT §4.5; CONTRACT 10-11) |

## 2. Act 1: the forward post, the tunnel and the security office

| # | Speaker | Text | Trigger (stage 9) | Notes |
|---|---|---|---|---|
| T-11 | `agent_0x99` | The gate terminal's yours. Get me their monitoring. | `global_variable_changed:door_scene_done` with `value === true && !globalVars.flag1_submitted` | `delayMs: 3000`. **Fixed** (OT §3). The aside's last two lines (ink, `aside_end`) already point at the table and the gate console |
| T-12 | `agent_0x99` | Whoever's in the power room runs your lights. | `global_variable_changed:flag1_submitted` with `value === true` | `delayMs: 2500`. **Fixed** (OT §5, said unprompted at flag 1; the hub topic repeats it) |
| T-13 | `agent_0x99` | The office keeps a door log. Their desk will read it now. | `global_variable_changed:flag1_submitted` with `value === true && globalVars.whodunit_live` | `delayMs: 7500`. **Fixed** (OT §3) |
| T-14a | `agent_0x99` | Ten past two, the core's service door opened to one of our badges. | `global_variable_changed:clue_door_log` with `value === true && globalVars.whodunit_live && !globalVars.door_log_given` | The same mapping also `setGlobal door_log_given: true` (OT §16, B2-01; m10 R1 W-12). Wording from the hub topic `door_log` |
| T-14b | `agent_0x99` | The log says Malhotra's badge. Malhotra was on with me at ten past. | as T-14a | `delayMs: 5000` |
| T-15 | `agent_0x99` | Duty line. The handset on the desk is ringing. | `room_entered:security_office` with `!globalVars.ghost_call_done` | repeats on every entry (OT §4.2). **Fixed** |
| T-16a | `agent_0x99` | That's Ghost on the handset. They want one last sale before they leave. Make it not worth it. | first `object_interacted` on the Duty Handset (`data.objectName === 'Duty Handset'`) with `!globalVars.ghost_call_done && !globalVars.m02_ghost_deal_accepted && !globalVars.m02_ghost_deal_refused` | `delayMs: 4000`, so it lands as the call opens, not before (playtest full 1 m-5: on room entry it came before the player had heard of Ghost, and "Ghost … Ghost" tripped). Reworded at stage 9; trigger is the builder's call |
| T-16b | `agent_0x99` | (T-16a's string) | as T-16a with `globalVars.m02_ghost_deal_accepted && !globalVars.m02_exposed_hospital` in place of the two deal tests | the broken branch; as T-16a |
| T-17 | `ghost_phone` | Left at the stairs. I can see you, and so can they. | `global_variable_changed:ghost_watch_on_route` with `value === true` | a held toast during the call (OT §13). **Fixed** (SE §3.5) |
| T-18a | `agent_0x99` | Reeves. From the hospital. He's theirs full time now. | first read of `tunnel_rota` with `globalVars.m02_completed && globalVars.m02_reeves_fate === 'escaped'` | FA row 21 (ruling 14). **Fixed** (SE §3.1) |
| T-18b | `agent_0x99` | (T-18a's string) | as T-18a with `globalVars.m02_reeves_fate === 'missed'` | |
| T-18c | `agent_0x99` | (T-18a's string) | as T-18a with `globalVars.m02_reeves_fate === '' && globalVars.m02_insider_asset_escaped` | FA row 22's read rule for runs finished before the export |
| T-18d | `agent_0x99` | G. Reeves. St. Catherine's night security. We never knew. | as T-18a with `globalVars.m02_reeves_fate === 'unnoticed'` | m02 never identified him on this value (stage 8 SC 9) |
| T-19a | `agent_0x99` | Helena's plans didn't have him. Nightshade's would have. | `room_entered:blast_tunnel` with `globalVars.m08_nightshade_triple_agent && !globalVars.m09_nightshade_shown_file && !globalVars.nightshade_map_used` | the not-shown branch on Helena's plans; the post is manned (RL §2.2). **Fixed** (MC §3.1) |
| T-19b | `agent_0x99` | (T-19a's string) | `room_entered:blast_tunnel` with `globalVars.m08_nightshade_arrested && !globalVars.m08_nightshade_ko_before_fate && !globalVars.nightshade_map_used` | the arrested branch, deal refused |
| T-20a | `agent_0x99` | Still on their payroll. Two kids. I hope he stays in the hut. | first read of `duty_board` with `globalVars.m07_hollis_resolved === 'evaded' && !globalVars.m06_assets_seized` | **Fixed** (FA row 92) |
| T-20b | `agent_0x99` | Stood down for the budget. Your freeze kept him home tonight. | first read of `duty_board` with `globalVars.m07_hollis_resolved === 'evaded' && globalVars.m06_assets_seized` | **Fixed** (CONTRACT 10-14; S6-09) |
| T-21 | `agent_0x99` | Finance want to know about five hundred pounds and a security guard in Cardiff. I've never been so pleased to fill in a form. | `global_variable_changed:arakawa_call_done` with `value === true && globalVars.m03_guard_bribed && !globalVars.breach_open` | `delayMs: 4000`: the lull while the pair walk back. 24 words. FA row 38 (rulings 14, 15; m10 R1 m-13: the import is kept). **Fixed** (SE §3.1) |
| T-22 | `agent_0x99` | Sheriff's asking who the road's closed for. Netherton's told him to wait. | `room_entered` with `globalVars.officer_out === 'arakawa'` | the first room entry after Arakawa is sent back (CONTRACT 10-11; reworded at stage 8 so it is HaX's own text, reporting Netherton) |
| T-58a | `agent_0x99` | Field console by the gate first. Start it, then the terminal. | `global_variable_changed:door_scene_done` with `value === true && !globalVars.gate_console_used` | `delayMs: 8000`. Skipped once the field console has been used. Stage 9 (builder) |
| T-58b | `agent_0x99` | Not the terminal yet. The field console beside it. | first use of the Gate Terminal with `!globalVars.gate_console_used` | skipped once the field console has been used. Stage 9 (builder) |

## 3. Act 2: the workshop, the power room and the server hall

| # | Speaker | Text | Trigger (stage 9) | Notes |
|---|---|---|---|---|
| T-23 | `agent_0x99` | That's his sheet. Read it. | `room_entered:workshop_floor` with `!globalVars.casualty_sheet_read` | `delayMs: 4000`. **Fixed** (OT §3) |
| T-24a | `agent_0x99` | There's something written in the margin. Not plain English. | `global_variable_changed:casualty_sheet_read` with `value === true && !globalVars.margin_note_read` | `delayMs: 2500`. **Fixed** (OT §3; Imran may say it first) |
| T-24b | `agent_0x99` | Copy just the code. | as T-24a | `delayMs: 7500`. **Fixed** (S6-22) |
| T-25a | `vance_phone` | He doesn't know. Tell him, and he'll want to warn somebody. Their switchboard will hear it. | first `room_entered:power_room` with `!globalVars.m04_voltage_captured && !globalVars.m04_voltage_escaped && globalVars.m04_vance_is_ally` | before Wendell's menu (OT §4.9). **Fixed** |
| T-25b | `elena_phone` | (T-25a's string) | as T-25a with `globalVars.m04_vance_is_ally !== true && globalVars.m07_elena_outcome === 'turned'` | |
| T-25c | `agent_0x99` | (T-25a's string) | as T-25a with `globalVars.m04_vance_is_ally !== true && globalVars.m07_elena_outcome !== 'turned'` | |
| T-26 | `agent_0x99` | I rang Vance. He said no. He said you'd know why. | first `room_entered:power_room` with `globalVars.m04_robert_vance_ko && !globalVars.m04_voltage_captured` | `delayMs: 6000`, after T-25. FA row 51 (ruling 14). **Fixed** (arc §7.3) |
| T-27 | `agent_0x99` | Static got out of Albion on his own. That's his. | first read of `static_kit` (on `m04_static_left_alone`) | FA row 46 (ruling 14). **Fixed** (FA row 46) |
| T-28a | `agent_0x99` | Shutter's dead. The hall's next. | `global_variable_changed:gallery_shutter_cut` with `value === true && !globalVars.cut_by_hand` | `delayMs: 2500`. **Fixed** (OT §3, reworded at stage 8 m-2: "dead, never down") |
| T-28b | `agent_0x99` | (T-28a's string) | as T-28a with `globalVars.cut_by_hand && !globalVars.phone_voice_is_hax` | not when HaX talked the cut through: her `cut_call` already ends "That's the shutter. It's dead." |
| T-29 | `agent_0x99` | That console takes what you pull from the staging copy. | `room_entered:server_hall` | `delayMs: 2000`. **Fixed** (OT §3) |
| T-30 | `agent_0x99` | You walked past his sheet. It's worth the minute. | `room_entered:server_hall` with `!globalVars.casualty_sheet_read` | `delayMs: 7000`. **Fixed** (OT §3) |
| T-31 | `agent_0x99` | Mercer drew us this room from memory. He got it right. | `room_entered:server_hall` with `globalVars.m07_completed && globalVars.m07_mercer_fate === 'arrested' && !globalVars.m07_mercer_ko` | `delayMs: 12000`. FA row 88; Netherton's briefing line sets it up (`briefing_team`). New |
| T-32 | `agent_0x99` | Lost you up there. I'm back. | `global_variable_changed:hax_jammed` with `value === false && !globalVars.outer_lock_open` | **Fixed** (OT §5) |
| T-33a | `agent_0x99` | It's set for four. It goes when the outer lock opens. | `global_variable_changed:flag2_submitted` with `value === true` | `delayMs: 2500`. **Fixed** (OT §6) |
| T-33b | `agent_0x99` | Infusion pumps, a hospital group. Dispatch software, a whole county. A water utility's controllers. | as T-33a | `delayMs: 7500`. **Fixed** (SE §3.1, the schedule's three entries) |
| T-33c | `agent_0x99` | That's enough of that. You've got the rest on screen. | as T-33a | `delayMs: 12500`. **Fixed** (SE §3.1) |
| T-34 | `agent_0x99` | That's the hatch. The release service runs on the host under it. | first use of `sealed_hatch` with `!globalVars.flag3_submitted` | story level only, from the hub topic `hatch_topic`. The same mapping offers guide 3 (OT §16, stage 8 m-7). New |
| T-35 | `agent_0x99` | That's a cloner in our own breaching kit. The case's sign-out sheet is on the table up here. Want the names? | `global_variable_changed:clue_bench_log` with `value === true && globalVars.whodunit_live` | 21 words. **Fixed** (OT §3; SE §3.1) |
| T-36a | `agent_0x99` | That's three things that point somewhere. Your call, and you don't have to make it. | `global_variable_changed:clue_bench_log` with `value === true && globalVars.clue_door_log && globalVars.clue_alibi && globalVars.whodunit_live && globalVars.accused === ''` | `delayMs: 6000`. **Fixed** (OT §3). Three rows, one per clue global, so it fires on whichever comes third |
| T-36b | `agent_0x99` | (T-36a's string) | as T-36a on `global_variable_changed:clue_alibi` (with `clue_door_log && clue_bench_log`) | |
| T-36c | `agent_0x99` | (T-36a's string) | as T-36a on `global_variable_changed:clue_door_log` (with `clue_alibi && clue_bench_log`) | |
| T-37 | `agent_0x99` | Tran's handler is on that rota. He's in the Helena letters. | first read of `uplink_printer` with `globalVars.m09_cage_bin === 'letters'` | "D. Varga" on the rota (CONTRACT 10-14). **Fixed** (CONTRACT 10-11; SR minor 9) |
| T-37b | `agent_0x99` | Tran's handler is on that rota. Tran gave us the name himself, in Helena. | first read of `uplink_printer` with `globalVars.m09_cage_bin === 'letters' && globalVars.m09_completed && globalVars.m09_tran_outcome === 'talked'` | in place of T-37 on this value (T-37 then needs `globalVars.m09_tran_outcome !== 'talked'`). m09 A1. New |
| T-38 | `agent_0x99` | There's the reply Netherton was waiting for. They've named the unit, and you. | first read of `uplink_printer` with `globalVars.m05_entropy_program_exposed` | `delayMs: 5000` after T-37. FA row 66 (ruling 14), on the prop's variants 1 and 3. New |
| T-39 | `agent_0x99` | It isn't going out from here. Nothing I can stop from this end. | first read of `uplink_printer` with `globalVars.m07_completed && globalVars.m07_team_assignment !== 'fracture'` | `delayMs: 10000`. **Fixed** (FA row 84: Fracture uncovered, the story runs from outside) |

Voltage's print match ("I told you it'd be waiting. It was.") and the Alpha tapes line ("The best lock there is. Tape two.") are ink (`m10_voltage.ink`, `breach_call`), not rows here.

## 4. The gallery (HaX is jammed; the guards speak)

| # | Speaker | Text | Trigger (stage 9) | Notes |
|---|---|---|---|---|
| T-40 | `monitor_guard` | Camera's dead again. I'll go and look. | `room_entered:gallery` with `globalVars.gallery_camera_blinded` | then he hides himself (RL §2.7). **Fixed** (MC §3.5) |
| T-41a | `monitor_guard` | Where's Farah? She was on till six. | `room_entered:gallery` with `globalVars.imran_outcome === 'talked_round' && !globalVars.gallery_camera_blinded` | `delayMs: 4000`. Her coat on the empty chair. **Fixed** (MC §3.5) |
| T-41b | `lock_guard` | (T-41a's string) | `room_entered:gallery` with `globalVars.imran_outcome === 'talked_round' && globalVars.gallery_camera_blinded && !globalVars.fonoti_ko` | the monitor guard has gone to look at the camera |
| T-42 | `nightshade_lock` | Go on. I've got the door. | `global_variable_changed:outer_lock_open` with `value === true && globalVars.nightshade_taken_in` | his voice on the lock's intercom. **Fixed** (MC §3.5) |
| T-43 | `nightshade_lock` | That's far enough. Back down the stair, all of you. | `conversation_closed:victoria_gallery` with `globalVars.victoria_gallery === 'trusted' && globalVars.share_zero_day !== 'stopped' && globalVars.nightshade_taken_in` | his voice on the lock's intercom, in place of the reinforcements (RL §2.7; condition per stage 8 M-1). Rewritten at stage 9 (IMPL_REVIEW_R1_TEXTS item 2): a bark can't carry narration, so the old "Boots on the stair…" line is now his own |

## 5. The core

| # | Speaker | Text | Trigger (stage 9) | Notes |
|---|---|---|---|---|
| T-44 | `tesseract` | The long way. It's also the right one. | first `object_interacted` on `core_console_vm` with `globalVars.core_greeted && !globalVars.flag4_submitted` | his idle lines, on events the game sees (S2-17). **Fixed** (SE §2.4). Cut order: these go first, down to one (OT §8) |
| T-45 | `tesseract` | Your reports say thorough. I didn't believe them. | `global_variable_changed:guide4_given` with `value === true && !globalVars.flag4_submitted` | **Fixed** (SE §2.4) |
| ~~T-46~~ | `tesseract` | Nearly there. You'll want to sit down for what comes after. You won't, I expect. | a failed flag submission at `core_host_terminal` (stage 9 names the event) with `!globalVars.flag4_submitted` | **Fixed** (SE §2.4) **Cut at stage 9** (no event for a failed submission). |

## 6. 06:00 and after

Alignment A2 (2026-10-22): the 06:00 rows T-47 to T-55 also play inside the scene now (`m10_six_oclock.ink` `phone_beat`, read by the narrator), T-56 inside `executed_close` and T-57 inside the Citadel's opening. Since R2-m10 they are skipped on `six_open` / `citadel_open`, so T-47 to T-56 never deliver (R3-m3: inert by design, or delete them); T-57 can still toast on Join (R3-m4).

Ghost's, the Recruiter's and HaX's executed texts arrive as the 06:00 scene closes: trigger `global_variable_changed:six_done` with `value === true` (sent during the scene, they land in the thread as it closes; SE §3.5, S5-6). `six_done` is never set on Join.

| # | Speaker | Text | Condition (with `six_done`) | Notes |
|---|---|---|---|---|
| T-47 | `ghost_phone` | Neither was this. Clean exit. | `globalVars.ghost_answer === 'not_why'` | kept. **Fixed** (MC §3.2) **Cut** (alignment R3-m3: the closing scene carries it; the mapping is deleted) |
| T-48 | `ghost_phone` | Mine will be too. Clean exit. | `globalVars.ghost_answer === 'card_unsigned'` | kept. **Fixed** **Cut** (alignment R3-m3: the closing scene carries it; the mapping is deleted) |
| T-49 | `ghost_phone` | I did. They didn't know who I was. Clean exit. | `globalVars.ghost_answer === 'ask_them'` | kept. **Fixed** **Cut** (alignment R3-m3: the closing scene carries it; the mapping is deleted) |
| T-50 | `ghost_phone` | Clean. I noticed. | `globalVars.ghost_answer === 'hospitals'` | refused, the code. **Fixed** **Cut** (alignment R3-m3: the closing scene carries it; the mapping is deleted) |
| T-51 | `ghost_phone` | You checked. Most don't. | `globalVars.ghost_answer === 'trust'` | refused, the card. **Fixed** **Cut** (alignment R3-m3: the closing scene carries it; the mapping is deleted) |
| T-52 | `ghost_phone` | Left on a quiet day, as you asked. First sale I ever turned down. Clean exit. | `globalVars.ghost_sale === 'stopped' && globalVars.ghost_answer === ''` | the selling branches, talked out. New (m10 R1 M-5) **Cut** (alignment R3-m3: the closing scene carries it; the mapping is deleted) |
| T-53 | `ghost_phone` | Five buyers paid for nothing, and you have their names. I kept the money. Clean exit. | `globalVars.ghost_sale === 'bait' && globalVars.head_start_killed === 'ghost'` | the bait, resale killed at the console. New (M-5) **Cut** (alignment R3-m3: the closing scene carries it; the mapping is deleted) |
| T-54 | `ghost_phone` | Sold. You watched who bought it. I hope the names were worth it. Clean exit. | `globalVars.ghost_sale === 'bait' && globalVars.head_start_killed !== 'ghost'` | the bait, the resale went out. New (M-5) **Cut** (alignment R3-m3: the closing scene carries it; the mapping is deleted) |
| T-55 | `recruiter_phone` | I'll remember the shape of you. | `globalVars.m09_recruiter_offer === 'double_crossed'` | `delayMs: 5000`. **Fixed** (SE §3.5; `m10_recruiter_phone.ink` exists only to carry it) **Cut** (alignment R3-m3: the closing scene carries it; the mapping is deleted) |
| T-56 | `agent_0x99` | I'll be at the board. I don't know what I'll say. | `globalVars.ending === 'executed'` | `delayMs: 30000`: "later, a message" (SE §3.1). **Fixed** **Cut** (alignment R3-m3: the closing scene carries it; the mapping is deleted) |
| T-57 | `agent_0x99` | 0x00. | `global_variable_changed:ending` with `value === 'joined'` (not on `six_done`) | `delayMs: 3000`. Her designation, nothing else, unanswered (SE §3.1; FA §4.6 Join row). The credit reads "Handler. Her last message to 0x00 went unanswered." (ruling 9) Alignment R3-m4: `skipIfGlobal: "console_choice"`, so the text never arrives; the Citadel narrates it. |

## 7. Not placed here

- "The readers take our badges. He loaded every SAFETYNET credential he stole. That door was told to want yours." (SE §3.1 "On the way down") has no trigger in OT; the breach call's "It's read your badge." carries the beat. Stage 9 may add it on the first read of `wanted_photo` if wanted.
- "Two posts empty. That's your freeze. He couldn't make payroll." is HaX's hub topic `fence` (ink), and Tesseract now says the other half in his case ("You froze my bank…", FA row 72).
- HaX's pointers that live in ink (the aside's table and gate-console lines, the Ghost menu line, Imran's and Gary's, the console, the gallery warnings) are not repeated here.
