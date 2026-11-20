# Office Life plan, section 12: adversarial review, round 3

Reviewed: `docs/achitechture/OFFICE_LIFE_PLAN.md` sections 12, 13 and 13b as revised in 32c1122b2,
against the working tree at that commit. Read-only; no code or plan edits. Paths are relative to
`public/break_escape/js/` unless they start with `scenarios/`, `scripts/`, `test/` or `docs/`. Finding ids
are new to this round; section 4 maps round 2's ids to an outcome.

**Count: 0 blockers, 3 major, 17 minor.**

## 1. Verdict

**Slices 21, 16 and 18a are ready to build, with the minors below folded into their briefs. Slice 17 is
not ready: M1 (the return-leg rule reaches the lab) and M3 (owned prints and a full slot pool) change its
design text. Slices 18b, 19 and 20 are ready once M2 and their minors are folded in.** None of the three
majors changes the design. M1 is a rule written wider than the problem it fixes. M2 is a rule that the
text half-states and the tests do not pin. M3 is a failure path that the showcase's own lever walks into.

Round 2's six majors are fixed in the text apart from M5, whose fix over-reaches (M1 here). Most of the
code citations hold at HEAD. `core/rooms.js` moved by three lines in ba1a4fa51 (m17). No fourth full round
is needed: a check of the 17 text and of 12.5's selection rule after the fold-in is enough.

How this was checked: every round 2 fix was read against the functions it names. The sims day was run
(`runSimsDay`, 15 minutes, `test/js/fixtures/needs-sims-world.mjs`) to see which rows the return-leg
rule touches. The lab's scenario was read for carries to an own `needsHome`, for `maxUnmetMin`, and for
`npc_caught_at_post` mappings.

## 2. Major findings

### M1. The return-leg rule changes the lab's USB foothold and the sims-day golden log (12.3, slice 17)

12.3 says: "on a carry whose target is the NPC's own `needsHome`, the last leg counts as the return ...
on arrival the item is placed with no PC dwell (a dwell of 0-1 s, not `useSeconds`)". It is written for
every carry to an own `needsHome`, not only the print errand. Two existing carries take that path.

- **The lab's foothold.** Sofia (`lord`) has `needsHome: "usb_target_pc"` and interests in the four
  dropped devices (`scenarios/lab_physical_pentest/scenario.json.erb` 732, 744-749). `usb_target_pc`
  accepts them with an authored `"useSeconds": 6` (987). Each foothold is a carry to her own
  `needsHome`. The four `npc_used:usb_target_pc` mappings carry the foothold globals, a capture,
  `completeTask: "usb_foothold"` and the "I'll just plug it in" barks (766-799). Under the rule the 6 s
  plug-in at her desk becomes 0-1 s, the barks and captures fire about 5 s earlier, and a plain item
  (the devices are not reveal slots) has no "place" outcome in `_completeJob` (1505-1517), so "placed"
  is undefined for it. This is the lab's central beat, and "the lab must not regress" is a standing rule.
- **The sims-day golden.** Amara's parcel delivery is a carry to her own `amara_pc` (`accepts: ["post",
  "printout"]`, `scenarios/test_needs_sims/scenario.json.erb` 110). In the 15-minute sims day it runs
  `job_start` at tick 451, `using` at 453 and `used` at 493: the 10 s `desk_pc` dwell. The rule removes
  those 40 ticks, so `GOLDEN_SIMS_DAY` (`test/js/npc-needs-slots.test.mjs` 19-26) changes. Slice 17's
  own test, "the sims-day log is byte-identical for NPCs without `printHabit`", fails on Amara, who
  has no `printHabit`.
- **Three texts say otherwise.** 12.8's behaviour-change list says 17 changes `revealOutput` timing
  "and nothing else unless an NPC has `printHabit` or a hook has `chance`". 12.10 says "The lab has no
  `revealOutput` hook, so the need-use rule changes nothing there. The return-leg rule matters if the lab
  adopts print errands: its staff PCs carry the `npc_caught_at_post` beats". The lab has no
  `npc_caught_at_post` mapping at all (a grep of the scenario finds none; the only one in any scenario is
  the showcase's Tom, `test_needs_sims` 384). The lab's carry is Sofia's, and it is already there.
- **The mechanism is unsafe as phrased.** "Then the normal `returning` arrival runs" and "`_checkCaught`
  runs while that leg is in the home room" invite switching the NPC to `returning` for the leg, since
  `_checkCaught` runs only in that mode (`npc-needs.js` 691). But `_tickNpc` runs `_select` for an
  idle **or returning** NPC (717-724), so an urgent need on the last leg would start a new job while the
  item is still in hand.

**Fix.** Scope the rule to the print errand only: a job flag `job.errand`, set when the errand is
started, and the rule reads it. Amara's deliveries and Sofia's footholds keep today's path and timing.
The golden digest and the lab's log stay unchanged, and 12.8 and 12.10 become true. Say how it runs: the
NPC stays in `job` mode on the leg, and `_advanceJob` calls `_checkCaught` while `job.errand` and the NPC
is in its home room. On arrival the slot is placed (the errand always carries a slot), then
`_goHome({ stayPut })` gives the `returning` arrival on the next tick, so `npc_returned_post` fires
before the next `work` use. Correct 12.10: no lab mapping uses `npc_caught_at_post`; Sofia's footholds
are carries to her own `needsHome` and are untouched by 17. If the user later wants Amara's 10 s dwell
gone too, make it an opt-in (`affordance.deliverSeconds` on the target), not a rule. Add a node test: the
lab-shaped fixture (a carry with an authored `useSeconds` to an own `needsHome`) keeps its dwell.

### M2. Nothing stops an owner on a call from starting a job (12.5, slice 19, with 17 and 18b)

12.5 sets `s.call` on an owner "idle at its post or in an own-desk use", and says in a parenthesis that
"an idle owner simply selects nothing". Nothing in the engine budget or the tests makes that true.
`_tickNpc` runs `_select` for every idle NPC that is not frozen, KO, hostile or script-suspended
(`npc-needs.js` 659-731). An idle owner on a call is none of those. Slices 17 and 18b each add a reason
to select from idle:

- a due print errand (17), which the widened guard in `_select` lets through even with nothing urgent;
- a told NPC's tempted magnet (18b). Tom's and Sanjay's hunger starts at 65 and 64, inside a band of 70
  (12.4 showcase), so a pizza announce in the office tempts them at once;
- and any need that turns urgent during a 30-50 s call.

Any of these starts a job: a wind-up (`s.atPost && !_atOwnPost`, 1284), `npc_left_post`, then a walk.
The overlay is still set, so seating sees a non-post stop and stands Tom up (`needsStop` returns null
for a walking job, `seating.js` 1061-1076). The call runner goes on voicing his half from the corridor,
with the phone icon above him. The same gap applies to the own-desk case once the extended work use ends
early through a hang-up.

**Fix.** Say it as a rule and budget it: while `s.call` holds, `_tickNpc` returns after `_decay` and the
return-path checks, before selection, as it does for `scriptSuspended`. Decay continues; a need that
turns urgent waits for the call to end, then selects as usual. A due errand stays due. A told NPC stays
told and tempted after the call. Node tests: an urgent need during a call starts no job until the call
ends; a due print errand waits; a tempted magnet waits; after the call each starts on the next select.
Add OQ55 with this default.

### M3. Owned prints fall back to cosmetic copies once the slot pool fills, and the showcase fills it (12.3, slice 17)

`revealOutput` shows the first free slot by id; with none free it makes a cosmetic copy that nobody can
take (`npc-needs.js` 2511-2535, `_revealOutput` 1556-1570). 12.3 stamps an owner on a **slot** and
reserves it until it is fetched, shared or reloaded; a forgotten print "lies on the tray until a reload".
A cosmetic copy has no slot, so it has no owner, no errand and no uncollected timer. Three things follow.

- **The lever fails silently.** Once the pool is full of forgotten prints, the print-job lever (the
  `print` command on `workstation_accessed:tom_pc`) produces a cosmetic copy. Tom never gets up, the
  objective "Send a print job from Tom's open screen and watch him fetch it" can no longer complete, and
  nothing tells the player why. The job-start `chance` roll has set `s.job.prints` (the printing icon),
  so the icon promises a fetch that will not happen.
- **The showcase fills its own pool.** The second lever, reading a note in the office, prints as Tom
  with `forget: true` on every read. It has no `onceOnly` or cooldown in the text. Tom's own
  `forgetChance: 0.5` adds more. The showcase pool is five slots (`copier_out_a`-`c`, `test_needs_sims`
  29-31 and 216-261, plus the new `d` and `e`). Five note reads, or a long session, end the beat.
- **`d` and `e` do not protect Sanjay's beat as stated.** Slots are taken lowest id first, so Tom's
  forgotten prints take `copier_out_a`, `b` and `c` (the takeable ones) before `d` and `e`. Sanjay's
  later prints land on the read-in-place slots. That keeps Amara's delivery working, since NPCs can carry
  them (`pickable` ignores `takeable`, 2117), but the player loses the takeable printouts first.

**Fix.** (1) The note lever is `onceOnly: true`. (2) An owned print with no free slot recycles the
oldest **forgotten** reserved slot of that producer: it is stowed (filed, as a reload would), logged
`recycled`, and the new print takes the slot. A pool with no forgotten slot falls back to the cosmetic
copy as today, logs `print_no_slot`, and clears `s.job.prints` for the icon. (3) State that slots are
filled by id, and either give the read-in-place slots ids that sort first (`copier_out_0a`, `0b`) if the
intent is to keep the takeable ones free for the player, or drop the claim that they protect Sanjay's
beat. Node tests: a full pool with one forgotten print recycles it and the lever's print gets an errand;
a full pool with no forgotten print makes a cosmetic copy, no errand, and no printing icon.

## 3. Minor findings

- **m1. `grumble_<reason>` cannot fall back through `_pickBark`.** `_pickBark` returns a **picture**,
  not null, for a topic with no lines whenever pictures are allowed (`npc-needs.js` 1147-1160;
  `chatterPool` sets `pictures: scenarioChatter !== false`, 110-121). A naive "try `grumble_off`, else
  `grumble`" turns every existing grumble into a `social` picture (`pictureIcons` falls to
  `PICTURE_DEFAULT`, 75-83). In the lab that replaces Sofia's two spoken grumbles (43-45), a lab
  regression. **Fix:** choose the topic before the call, `chatterPool('grumble_' + reason, ...).lines.length
  ? 'grumble_' + reason : 'grumble'`; add `grumble_off` and `grumble_gone` to `PICTURE_CHATTER` with the
  grumble icon, so a speaker on cooldown shows the right picture; `_grumble` gains a `reason` argument
  (today `_grumble(s, objectId)`, 1103). Node test: a scenario with only a `grumble` pool grumbles a line
  for `off`, as today for `avoid`.
- **m2. `_turnBack` needs a per-reason table.** It always sets `mindChanged[need]`, grumbles, re-selects
  with an exclude and goes home (1080-1097). The plan gives four reasons with different effects:
  `avoid` (all of these), `off` and `gone` (no `mindChanged`; grumble by reason; fallback select; park
  only if untempted), and `answered` (the colleague's phone job has `need: null`: no grumble, no
  `mindChanged`, no fallback select, straight home). Put the table in 12.4 and 12.5 so one builder writes
  one function.
- **m3. A hang-up leaves the current line playing and the colleague standing.** `npcChatterVoice.say`
  queues clips with no way to stop one (`npc-needs-chatter.js` 214-235), so the line in flight plays over
  the opening of the person-chat. A colleague frozen mid-call has stored `useRemaining` at the call's
  remainder (`npc-needs.js` 663), which the next unfreeze restores (676), so after the chat she stands at
  the phone in silence for the rest of the call. And a colleague frozen on the way still "holds a claim",
  so the phone rings for the whole chat. **Fix:** add `cancel(npcId)` to the voice (stop `mgr.audio`,
  drop that NPC's queued lines; about 10 lines, in 19's file list); the hang-up sets
  `job.useRemaining = 0`; a frozen answerer does not keep the phone ringing.
- **m4. The colleague's `expectedAwayMs` needs the call's length before the call is chosen.**
  `npc_left_post` fires at the end of the wind-up (`_leavePost`, 1300-1313), before the colleague
  reaches the phone, but the plan fetches the knot's lines (or falls to the `phone_message` pool or a
  picture) at the answer. The story may still be loading (`exchangeLines` returns null). **Fix:** choose
  the call (knot, pool or picture) and its length when the colleague claims the phone; a pending story
  falls to the pool for this call. The 12.2 lock habit then reads a real length.
- **m5. The socket's and the table's observations are never shown, and a trigger action has no
  condition.** `triggerOnInteract` returns before the observation step (`interactions.js` 820-846), and
  the examine view skips trigger objects (`examine.js` 6-12). So 18a's "the socket's
  `observationVariants` entry ... says so" and 18b's "the table's observations" are unreachable. "The
  hint action is gated by a mapping condition" cannot be built: `applyActions` has no per-action
  condition (`apply-actions.js` 78-280). **Fix:** 18a's hint moves to a scenario mapping on
  `global_variable_changed:office_coffee_off` with `onceOnly: true`; the trigger only sets the global.
  18b's table hint lives in `requiresItemHint` (which does show), and 18b accepts that clicking the table
  after the pizza is out shows that hint again, or the spot's trigger is removed by a mapping once the
  global is true.
- **m6. Bed resolution with authored neighbours is unspecified.** "An authored `ambientSound` always
  wins" does not say against what. With own room first and a profile bed in every office, m01's
  `it_room` (`room_it`, profile bed) would play `office_tone` and lose today's 0.125 bleed of the server
  room's ventilation (`m01_first_contact/scenario.json.erb` 2067-2071); the m01 copy used for the north-south
  proof will sound different for that reason, not because of the slice's faults. **Fix:** write the order:
  own room's authored loop, then own room's profile bed, then an adjacent room's **authored** loop at
  today's 0.125/0.01, then nothing. Profile beds never bleed (the "no bleed" default).
- **m7. Unapproved and unknown bed keys cut the current loop.** `fadeAmbientTo` stops the current loop
  on a key change **before** it checks the new key exists (`sound-manager.js` 366-372 against 393). So a
  profile bed that is not yet approved (every one but `server_room_ventilation`) would silence the room
  the player came from instead of leaving the bed playing. sis01 already authors two keys that are not
  loaded, `office_ambient` and `hospital_ambient` (`scenarios/sis01_healthcare/scenario.json.erb` 727,
  2133): entering those rooms cuts any ambient today, and under "authored wins" they would beat a
  profile. **Fix:** the resolver treats a key missing from the audio cache as "no bed" and skips it; the
  validator checks authored `ambientSound` keys against `loaded_sounds` (warning); the "profile sounds
  loaded" check is info-level until the approval list clears, or every `roomTone` scenario warns.
  Consider naming the office bed `office_ambient`, so sis01's meeting room picks it up when approved.
- **m8. `server_room_ventilation` is an MP3 loop from BigSoundBank.** It exists
  (`assets/sounds/server_room_ventilation.mp3`, credited CC0 BigSoundBank at `sound-manager.js` 116-117).
  m01 (0.4), m04 (2 rooms), sis01, sis02 (2) use it as the server-room bed, and m09 uses it as a
  stand-in for a shredder loop in non-server rooms. 12.6's own rule says loops ship as OGG because MP3
  padding gaps at the loop point. **Fix:** say it stays an MP3 (no new approval) and add it to the live
  seam check; note that the `server` profile's 0.6 applies only where a scenario authors nothing (m01's
  authored 0.4 wins).
- **m9. Preset start and output sounds are not behind `roomTone`.** `startSound` and `outputSound` sit in
  the `coffee`, `kettle` and `copier` presets and are played by the office visuals on
  `npc_use_started` and `object_revealed`, not by the room-tone module. Once the files are approved, every
  presets-on scenario hears them with `roomTone` off, against 12.8's "20 is opt-in". `object_revealed`
  also fires for left-behind items (`npc-needs.js` 2571, no `producerId`) and for any core reveal (the
  pizza). **Fix:** play both only when `roomTone` is on, or change 12.8 to say presets bring them; play
  `outputSound` only when the payload has a `producerId`.
- **m10. Two existing files the preset changes must touch.** `office-presets.test.mjs` 21-25 asserts
  `presetIdFor({ type: 'kettle1' }) === 'coffee'`, which the `kettle` split breaks. `office-presets.json`'s
  `_comment` says "Presets set no seat", which `desk_phone`'s `seat: "stand"` contradicts. List both in
  the 19 and 20 briefs (the parity run itself is unaffected, as the plan says).
- **m11. The quiet look is keyed on "above `urgentAt`", which also catches starved needs.** `_select`
  acts on a starved need at any level (852-853). The lab's Chris and Melanie have `maxUnmetMin: 6`
  (`lab_physical_pentest/scenario.json.erb` 683, 901), and a starved need that cannot be met today
  notes the leash and parks. Rare at their decay rates, but the rule should name its case. A quiet look
  also skips the select back-off, so a told NPC that cannot reach a full magnet runs a full `_select`
  every 250 ms. **Fix:** "tempted" means `urgentAt < level <= urgentAt + tempt` and not starved; a quiet
  look that found nothing sets `selectRetryAt` as a searched select does (`SELECT_BACKOFF_TICKS`).
- **m12. A late-discovered station would cue at the player's click.** `onInteract` decides the lock for a
  station first seen after its owner left (`workstation-state.js` 173-174). If that counts as a change,
  `workstation_screen_changed` fires and the flash or chime plays as the player clicks, as if the owner
  had just locked it. **Fix:** a late decision publishes the state with no cue (or `how: "late"`, which
  the visuals ignore); test it.
- **m13. Swivel during a pairing.** 21 lists the cases with no swivel, but not "paired at a chatter
  object" or "saying a line". A seated NPC at a shared object (capacity 2, `chatter`) would idly turn
  away during an exchange. **Fix:** no idle swivel while `_chatPartner(id)` or `_talking(id)` is set;
  the speakers list includes call speakers, so colleagues look round at Tom on the phone.
- **m14. "Pulsing" must not mean scaling.** The no-lighting ring shows `phone1` "pulsing" over the phone.
  A scale tween rescales pixel art, which is a standing rule. **Fix:** alpha pulse only, at native size.
- **m15. The phone's approach cell may be the owner's chair spot.** The phone sits within 1.5 tiles of
  the owner's home approach cell, and a desk phone beside a PC shares its approach cell unless `useFrom`
  says otherwise. That cell is where the owner's swivel chair was slid (`slideChairFootTo`,
  `seating.js` 1246-1247). A standing colleague routed onto it may stall against the chair and time out
  (`_failJob('timeout')` after the 20 s floor, `npc-needs.js` 1437, 1459). **Fix:** validator warning when the
  phone's approach cell is within `NEAR_CHAIR` of the owner's home approach cell; author `useFrom` to the
  side, as the showcase example should.
- **m16. Sizes do not add up.** 17's parts sum to 160 (npc-needs 95, adapter 10, validator 35, schema 20),
  not 175. 18b's sum to 355 (npc-needs 245, adapter 15, validator 65, schema 30), not 325. With M1-M3 the
  total is about 1,390, not 1,355. 18b is now the largest slice by far; split it into 18b-i (magnet,
  sight, temptation, servings, hidden objects; about 230) and 18b-ii (word of mouth, announce, `news`
  picture; about 125), each with its own live proof.
- **m17. Stale text.** 12's status line still says "Revised after review round 1". "Line numbers are from
  the working tree at 12a3732f5" is stale; `core/rooms.js` moved by three lines in ba1a4fa51
  (`updatePlayerRoom`'s ambient call 3113, the null return 3115-3117, `recalculateAmbientVolume`
  3169-3208, the fade to 0 at 3207). OQ38 says calls fall back to "the `phone` pool", but 12.5 gives
  answerers `phone_message`. `npc_use_started` through `_emit` drops the per-tick object cache
  (`_emit` calls `_worldChanged`, 480-483); check the tick-cost bound `objectScans <= ticks + 40`
  (`test/js/npc-needs-tick-cost.test.mjs` 95) or emit through `world.emit` directly.

## 4. Round 2 findings

| R2 | Outcome | Notes |
|---|---|---|
| M1 call during a player chat | Fixed | Runner in the system tick, hang-up on a chat, OQ53, node test. The voice in flight and the frozen colleague's remainder are new minors (m3) |
| M2 colleague sits in the owner's chair | Fixed | `seatPreference` returns `stand` for `affordance.seat === 'stand'` (`seating.js` 1110-1112); preset and written-out affordance both carry it. Comment and test edits (m10); approach-cell stall (m15) |
| M3 `gone` unreachable | Fixed | `claims < capacity && servingsLeft > 0`, serving at `using` start, `gone` for walkers at 0; test, beat and budget agree |
| M4 tempted log flood | Fixed | Quiet look and `job.tempted`; the condition should exclude starved needs and back off (m11) |
| M5 errand return path | **Partly fixed** | The return leg is specified, but for every carry to an own `needsHome`: it changes the lab's foothold and the sims golden (M1) |
| M6 north-south doorways | Fixed | Null room keeps the bed. Checked side effects: start room (first detection always recalculates, `currentPlayerRoom` starts `''`, `core/rooms.js` 891-892); scenario change (`initializeRooms` resets it); the credits (`ambienceSuppressed`); door events (no-op while null). None regress. Unapproved keys cut the loop through another path (m7) |
| m1 call plumbing | Fixed | `getState().call`, `npc-action-icons.js` in the file list |
| m2 owner and colleague race | Fixed | `answered` turn-back needs its own `_turnBack` branch (m2 here) |
| m3 call lock | Fixed | |
| m4 `phone` pool | Fixed | OQ38 not updated (m17) |
| m5 grumbles per reason | **Partly fixed** | The rule is right; the fallback through `_pickBark` gives pictures and would regress the lab (m1 here) |
| m6 `lockCues` independent | Fixed | |
| m7 `npc_use_started`, cosmetic sound | Fixed | Filter `object_revealed` by `producerId`; gating by `roomTone` (m9) |
| m8 duck on unheard speech | Fixed | |
| m9 chime proof before approval | Fixed | |
| m10 when telling happens | Fixed | |
| m11 18a window and repeats | **Partly fixed** | Third mapping and real-change wake are in; the socket's observation variant is unreachable and a trigger action cannot be gated (m5 here) |
| m12 swivel during a call, listening proof | Fixed | Pairings not covered (m13) |
| m13 habit edge cases | Fixed | The late decision's cue (m12 here) |
| m14 uncollected timing | Fixed | |
| m15 approval list, beds per type | Fixed | The table is consistent with 12.6 and OQ42/OQ46 (eight files, one derived; two chimes; two required icons; one required sprite). `server_room_ventilation` exists and stays MP3 (m8) |
| m16 18b gaps | Fixed | |
| Socket stand-in `_comment` | Fixed | |

## 5. Cross-slice interactions checked

| Interaction | Result |
|---|---|
| Call overlay plus a tempted job, a due errand or an urgent need | Not covered: M2 |
| Magnet in a leashed or private room | Covered by the quiet look and the validator warning; back-off missing (m11) |
| Coffee off while people are queued | Covered: the 18a check runs for `queued`; the front user finishes; queue chats end through `_queuedFront` (`npc-needs.js` 1742) |
| Print errand while the printer makes cosmetic copies | Not covered: M3 |
| Lock cues during a call | No interaction: the owner never leaves; the colleague's leave locks by its habit, which needs the call's length at the claim (m4) |
| Swivel during a queue or exchange | Queuers stand; seated pairings not covered (m13) |
| Reload mid-feature | 16: away clocks and globals reset as today. 17: reservations dropped, slots filed. 18a: the global persists. 18b: servings and the reveal global persist, knowledge and eaters do not (stated). 19: ring and call are client-only, `heard_<knot>` only on a finished call. 21: pure function. No gap found |
| Call ended by a chat, then the colleague | m3 |

## 6. Byte-identical where features are off

- **Sims-day golden** (`GOLDEN_SIMS_DAY`): unchanged by 21, 16, 18a, 18b and 19 as written; changed by
  17's return-leg rule (Amara's parcel, ticks 451-494). M1's scoping restores it.
- **Lab decision log:** unchanged by 21 (static seats), 16 (object lock fields win; the habit roll is
  stateless, `npc-needs.js` 268-270), 18a (only `_recheck` calls `_turnBack`, 1076, so "only `avoid` sets
  `mindChanged`" changes nothing), 19 and 20 (no phones, no `roomTone`). Changed by 17 as written
  (Sofia's foothold dwell, M1). At risk from 18a's grumble fallback if built naively (m1) and, rarely,
  from 18b's quiet look on starved needs (m11). Visual-only change by default: lock cues on Chris's PC
  (the lab session's call, OQ27).
- **Shipped missions:** only the crossfade, own room first and the null-room keep, as 12.8 says; all three
  only where `ambientSound` is authored. sis01's unloaded keys are an existing fault (m7).

## 7. Buildability

- **21, 16, 18a**: each brief can be handed over as written, with m13 and m14 (21), m12 (16), m1, m2 and
  m5 (18a). Live proofs are capturable: 16's chime proof is the play log with `reason: "unapproved"`.
- **17**: not until M1 and M3 are in the text. The live proof "the lever with the player still in Tom's
  minigame" is capturable; it fires the showcase's existing `npc_caught_at_post:tom` mapping (384), whose
  30 s cooldown should be noted in the proof.
- **18b**: buildable after 17; split as m16 suggests. The announce proof is the `/tts` request on keyless
  :3001, as slice 15.
- **19**: buildable with M2, m2-m4 and m15. "A chat opened with Tom mid-call" is capturable with the
  `window.__test` bridge.
- **20**: buildable with m6-m9. Until a bed is approved the north-south proof is fade calls and the play
  log; with m7's resolver those calls show "no bed", so the proof also needs the one loaded bed
  (`server_room_ventilation`) on one side of the door, which the m01 copy gives.

## 8. Open questions 27-54 and the approval table

Consistent with the text apart from: **OQ38** (the colleague's fallback is `phone_message`, m17);
**OQ32/OQ50** (consistent, but say a serving is never taken by an arrival at 0); **OQ51** (add "the
return leg applies to the print errand only", M1). Add **OQ55** (no selection during a call, M2) and
**OQ56** (an owned print with a full pool recycles the oldest forgotten slot, M3). The approval table in
12.8 matches 12.6, OQ42 and OQ46; `distant_phone` is derived from `desk_phone_ring`, so it is seven
downloads and one ffmpeg derivative, which the page should say so the user is not asked to judge it
twice.
