# Office Life plan, section 12: adversarial review, round 1

Reviewed: `docs/achitechture/OFFICE_LIFE_PLAN.md` section 12 (slices 16-21) as committed in bd837adb2,
against the working tree at that commit. Read-only; no code or plan edits. Paths are relative to
`public/break_escape/js/` unless they start with `scenarios/`, `scripts/`, `app/` or `docs/`.

**Count: 0 blockers, 9 major, 17 minor.** Verdict at the end.

The plan's line citations are accurate (checked: `decideLocked` 65-74, `install` 86-91, `resetGlobals`
97-116, `onLeft`/`onReturned`, `SoundLimiter` and `playAt` 194-213, `_select` 842-870, `_completeJob`
1485-1531, `_revealOutput` 1556-1570, adapter `listObjects` 2238-2252 and `revealOutput` 2511-2537,
`requiredGlobalsHold` 123-130, `recalculateAmbientVolume` 3166-3205, `game.rb` 820-821 and
`add_item_to_room!`). The one drift: the `want = st.homeFacing` line in `updateNeedsSeat` is
`seating.js:1203`, not 1197. Most of what is wrong comes from code next to the cited lines.

## 1. Claims checked against the code

| Claim (section) | Status | Evidence |
|---|---|---|
| `install` passes only `npcId` to `onLeft`; `expectedAwayMs` never read; no timer (12.1, 12.2) | Holds | `systems/workstation-state.js:87-88, 141-152`; `npc-needs.js:1307-1310` |
| `npc_left_post` fires when the wind-up ends, NPC still at the desk (12.1) | Holds | `npc-needs.js:1286-1290, 1300-1313` |
| Return unlocks "when the owner sits down" (12.2) | Close: it unlocks on arrival at the home cell (`npc_returned_post`), before the seat is taken | `npc-needs.js:694-701` |
| One limiter for every NPC sound, one per second (12.1) | Holds | `systems/npc-office-visuals.js:44-51, 209` |
| `playAt` + a new `ownRoomOnly` (12.2, 12.6) | Workable. Note `hearingLevel` returns 1 for a falsy `roomId`, so `ownRoomOnly` must reject a missing room, not trust hearing alone | `systems/room-hearing.js:12` |
| `triggerOnInteract` with `requiresItem` and `consumesItem` (12.4) | Holds, with two side effects the plan does not mention: the trigger replaces the object's normal interaction on every click, and the hint shows on every click without the item | `systems/interactions.js:797-846` |
| `emit_event` fires a custom event such as `desk_phone_ring:<id>` (12.5) | Holds (payload is `{ source }`); a mapping's `emitEvent` also works | `systems/apply-actions.js:114-118`; `systems/npc-manager.js:842` |
| "a timed message" can ring a phone (12.5) | Wrong as a direct source: timed messages deliver phone texts and knots, they emit no arbitrary event | `systems/npc-manager.js:1711-1737` (m14) |
| The ambient track rides the music volume (12.6, OQ41) | **Wrong** (m1) | `systems/sound-manager.js:304, 392, 446-450`; `music/music-widget.js:67, 186-195` |
| Ambient loop returns at the first room that is the player's or adjacent (12.1, 12.6) | Holds | `core/rooms.js:3170-3200` |
| Seating re-faces a seated needs NPC to `homeFacing` or the talking player (12.1, 12.7) | Holds | `systems/seating.js:1201-1213` |
| Chris and Melanie sit on swivel chairs in the lab (12.10, 12.7) | **Wrong**: they sit on static seats (m2) | `scenarios/lab_physical_pentest/scenario.json.erb:1115-1121`; `core/rooms.js:2539` |
| A hidden `revealOnGlobal` object with an affordance is a use target; none shipped (12.1, 12.4) | Holds. Scan: the lab's and the sims' reveal objects carry no affordance, and only the sims switches presets on, where its reveal objects are `notes1` and `id_badge` (no preset) | `npc-needs.js:2238-2252`; `data/office-presets.json:4-14` |
| Slice 15 exchange machinery reused for one-speaker calls (12.5) | Holds for parsing: an unprefixed line is the owner's. Gaps: stories are preloaded only for NPCs with `exchanges`, and a line such as "Look: it's Tuesday" parses as a speaker prefix and is refused (m8) | `systems/npc-needs-chatter.js:30-34, 61-80, 150-155` |
| Desk-phone preset exists (12.1, 12.5) | Holds, but only through `officeType` with `officePresets: true`; `types` is empty | `data/office-presets.json:14`; `scripts/scenario-schema.json:147, 5043` (m9) |
| `phone1` as the action icon (12.5) | Holds: `{ sprite }` icons draw at native size on a backing, no rescale | `systems/npc-action-icons.js:76, 198-199, 302-305` |
| The cue "reuses the indicator draw path" with a closing ring (12.2) | Partly: the glow texture is a soft radial blob, so there is no ring; a radius tween needs a per-frame `setScale` | `systems/lighting.js:657, 1117` (m5) |
| A copier is heard "because someone is at it" (12.6) | **Wrong** (M9) | `npc-needs.js:1520-1525`; `data/office-presets.json:10` |

## 2. Major findings

### M1. The phone is not answered "at the post" (12.5, slice 19)

The plan makes the owner's phone use count as at post by widening `_atOwnPost`, and says the owner stays
seated. Three other paths disagree.

- **Seating has its own copy of the rule, keyed on the home object.** `needsStop` treats a job as
  own-desk only when `ns.job.targetId === homeId` (`seating.js:1067`). A job on `tom_phone` gives the key
  `at:tom_phone` in the `using` phase and `null` before it (`seating.js:1072-1076`), so
  `updateNeedsSeat` unseats the owner (`seating.js:1192-1196`).
- **The job walks.** Every use job goes through `_moveForPhase` to the target's approach cell, and the
  `using` phase starts only on arrival (`npc-needs.js:1458-1475`). The owner gets up and walks to the
  phone's cell. Nothing checks that the phone sits within reach of the post.
- **A desk-phone use lasts no time.** The preset's `useSeconds` is 0 (`office-presets.json:14`), so a use
  completes on the next tick (`npc-needs.js:1474-1475, 1482`). The plan pushes `useUntil` back for an
  owner already in a desk use, but says nothing for an idle owner or for the colleague's "ordinary use
  job", which would hang up at once.

While the owner takes a call during a work use, `typingBob` keeps running (it reads only
`need === 'work'` and `phase === 'using'`, `seating.js:1095-1100`), and the action icon stays on work.

**Fix.** Model the owner's answer as a call overlay on the NPC state, not a job: `s.call = { phoneId,
until }`, set when the owner is idle at its post or in an own-desk use. It holds `useUntil` (or holds
selection while idle), stays seated with no move, suppresses the typing bob, and sets the phone icon. The
colleague's answer stays a real use job, with `useUntil` set to the call's length the way `_startExchange`
extends a pair's uses (`npc-needs.js:1215-1223`). Validator: the phone's position is within 1.5 tiles of
the owner's home approach cell (error). Add `seating.js` (`needsStop` and the bob, about 10 lines) to the
slice's file list. Node test: an owner answering stays seated (`needsStop` key unchanged across the call).

### M2. `_select` returns before temptation or a print errand is looked at (12.3, 12.4; slices 17, 18)

`_select` starts with `if (this.tickCache && !Object.keys(s.interests).length && !this._anyUrgent(s))
return null;` (`npc-needs.js:844`), and `_anyUrgent` knows only `level <= urgentAt` and starvation
(`npc-needs.js:830-835`). A tempted need sits above `urgentAt` by design, and Tom, the print showcase's
owner, has no interests (`scenarios/test_needs_sims/scenario.json.erb:374-381`). With `tickCache` on (the
live default since slice 1) neither feature ever fires. The plan's line budgets ("temptation in `_select`
35", "the errand candidate in `_select`") do not mention the early return, and the node stub may run
without `tickCache`, so tests could pass while the live game does nothing.

**Fix.** Widen the guard: return early only when nothing is urgent, there are no interests, the NPC knows
no live magnet that satisfies one of its needs within the tempt band, and it has no due print errand.
Run the slice 17 and 18 node tests with `tickCache: true` as well as false.

### M3. Temptation and parking work against each other (12.4 item 4, slice 14)

`_select` parks a need whenever `_useCandidate` comes back empty with a give-up reason
(`npc-needs.js:857-858`), and `_park` sets the level to `urgentAt + 1` (`npc-needs.js:1023-1028`).
Under temptation, candidates are the known magnets only. If the only known magnet is unacceptable
(someone avoided stands at it, it is in a forbidden room, a story need excluded it), the tempted need
parks:

- a need at 65 is **lowered** to 41, so the NPC is now hungrier than before it heard of the pizza;
- a parked need at `urgentAt + 1` is inside the tempt band (`urgentAt + tempt`), so the same need is
  selected again while parked, which the current code never does (it skips anything above `urgentAt`,
  `npc-needs.js:852`). The plan does not say whether parked needs are tempted.

Telling an NPC that its leash forbids the magnet's room is the common case (word of mouth ignores the
leash), so this will happen in any leashed scenario, the lab included if it adopts a magnet.

**Fix.** Three rules, each a line or two:
1. a tempted need (level above `urgentAt`) never parks: a failed tempted selection is just no option;
2. a parked need is not tempted;
3. learning of a magnet (sight or word) and a magnet appearing wake the parked needs it satisfies
   (`_wakeParked` for that NPC and need), so a hungry NPC that gave up on the fridge hears about the pizza.

The validator's "magnet's room forbidden to every NPC with the need" warning stays; add a node test that
a told, leashed NPC keeps its level and logs no `parked`.

### M4. Servings are counted at completion, but three people eat at once (12.4 item 5)

"Each completed use takes one" with `capacity: 3`. `_free` admits up to `capacity` claims
(`npc-needs.js:783-786`) whatever the servings left. With one serving left, three NPCs can walk to the
pizza, all three eat, and the count goes to -2; or the first completion hides the magnet while two are
mid-use, and their completion then targets a hidden object. "Anyone still on the way turns back with
`gone`" covers walkers, not eaters.

A second, smaller effect: a tempted NPC refills to at most `level + restores`. Starting at 25 with
`restores: 40`, it ends at 65, still inside the band of 70, so it eats again at once and one person can
clear the box.

**Fix.** Free means `claims < min(capacity, servingsLeft)`, and a serving is taken when the `using`
phase starts (the count is then never below zero and nobody eats a slice that is not there). Add
`magnet.perPerson` (default 1): an NPC that has eaten from this magnet is no longer tempted by it (a plain
urgent need may still use it). Node test: capacity 3, one serving left, three tempted NPCs: one eats, two
turn back with `gone`, the count ends at 0.

### M5. Delivering a printout to the owner's desk prints again (12.3, slice 17)

The `onUse` hook fires on every completed job at that object, carries included (`npc-needs.js:1520-1525`;
handover section 7, "onUse fires for any finished use ... whether the job was a need or a carry"). The
errand's target is the owner's `needsHome` object, which is the same `tom_pc` that carries the print hook
(`onUse: { "tom_pc": { "revealOutput": ..., "chance": 0.4 } }`). Every fetched printout put on Tom's desk
rolls another print, so with `chance: 0.4` and `forgetChance: 0.5` the errands chain. The roll
`'print:' + useCount` would count deliveries as uses too.

`s.job.prints` (the "printing" action icon) is set at job start for any use of a hooked object
(`npc-needs.js:1268`), so with `chance` below 1 the icon promises a print that the roll at completion may
not give.

**Fix.** Print hooks fire only for a need use (`job.need && !job.carrying`); say so for `setGlobal` and
`emitEvent` hooks too, or leave those as they are and document it. Roll `chance` at job start, store it on
the job, and set `prints` from it. Node test: the errand's delivery prints nothing.

### M6. Word of mouth can fail without a trace (12.4 item 3)

The announcement goes through `_pickBark`, which speaks only when the pool has lines, the speaker is off
its 5-minute bark cooldown and the speech lock is free (`npc-needs.js:1147-1160`;
`CHATTER_COOLDOWN_MIN = 5`, line 64). Otherwise it returns picture chat, and for a topic like
`news_pizza` the picture is the default `social` icon (`PICTURE_DEFAULT`, line 75), which says nothing
about food. With `"chatter": false` it returns null. The plan says "each knower announces once per
magnet" but not whether telling depends on the line being spoken.

The showcase's own story hits this: Grace learns of the pizza at the water cooler, whose preset carries a
`cooler` chatter pool (`office-presets.json:6`) and Grace has cooler lines
(`scenario.json.erb:400`); if she chats there, she is on cooldown when she gets back to her desk.

**Fix.** Telling is a state change, not a line: hearers learn on the announce whatever is shown.
The announce ignores the bark cooldown (it is news, not chatter) and waits for the speech lock
(`waitForLock: true`, already supported) with a retry until spoken or 30 s pass; then it falls back to a
picture. Add a `news` picture topic (the food icon from the section 9 set) to `PICTURE_CHATTER`. Node test:
a knower on cooldown still tells its neighbours.

### M7. The lock cue disappears without lighting (12.2, slice 16)

All three visual layers go through the lighting system: the dots, and now the flash. `initLighting`
returns null unless the scenario opts in, the browser runs WebGL, and the player has not turned lighting
off (`systems/lighting.js:1428-1440`, `lightingDisabledByPlayer()`). The sound layer waits for approval.
So for a player on the Canvas renderer (common in browser VMs without GPU acceleration) or with lighting
off, or in any scenario without `lighting`, the user's requirement ("some visual or audio cue ... so
players can pick up on this") is not met at all. Slice 5 accepted this for the steady dots; slice 16 is
the slice whose purpose is the cue.

**Fix.** A fallback that does not need the light map: when `window.lightingSystem` is null, show a
one-second padlock or open-padlock glyph above the screen through the action-icon layer, which already
draws text stand-ins until art exists (`npc-action-icons.js:190-199`). A 16x16 `npc-lock` icon is an
**[approval]** item for the batch in OQ42. Live proof: one strip with lighting off.

### M8. One ambient track cannot carry a bed per room (12.6, slice 20)

- **No bleed.** With `roomTone` on, every profiled room has a bed. After the planned "player's room
  first" fix, `recalculateAmbientVolume` always returns at the player's own room (`core/rooms.js:3174-
  3177`), so the neighbour's bed is never heard. "The bed's usual bleed through an open door" (12.6, "What
  the player hears") only happens from a room with no profile.
- **Hard cuts.** `fadeAmbientTo` stops the old sound at once when the key changes
  (`systems/sound-manager.js:367-372`) and fades the new one in over 400 ms. Today that happens only at a
  server-room door. With beds everywhere, every doorway between an office and a kitchen cuts the hum dead.

**Fix.** Crossfade in `fadeAmbientTo` (keep the outgoing sound and tween it to 0 over the same duration;
about 15 lines in `sound-manager.js`, shared code, named in the slice report). Drop the bleed sentence, or
add a second, quieter neighbour channel if the user wants bleed; the default should be no bleed. Live
proof: a recorded walk through two doorways with no gap.

### M9. "Activity first" spot sounds do not fire as described (12.6)

- **Nobody uses the copier.** The print comes from the PC's `onUse.revealOutput` hook
  (`npc-needs.js:1524`); the copier preset has no `satisfies` and no NPC job targets it
  (`office-presets.json:10`; the showcase's own comment, `scenario.json.erb:216`). A `useSound` on the
  copier preset plays on `npc_used:<copier>` (`npc-office-visuals.js:216-230, 242`), which never fires.
- **One `useSound` per affordance, at completion.** "`coffee_machine` ... (`drink_gulp` stays at the end
  of a use)" needs two sounds on one affordance; the code plays one, on completion. The coffee preset
  already names `drink_gulp` (`office-presets.json:5`), and `kettle1` is in the coffee preset's types, so a
  kettle and a coffee machine cannot have different sounds without a new preset or an object override.

**Fix.** Play the producer's sound on `object_revealed:<slot>` at the producer (the adapter already emits
it with `producerId`, `npc-needs.js:2531`), as a new `affordance.outputSound`. Add `affordance.startSound`,
played when the `using` phase starts. Split `kettle` from `coffee` in the preset table, or put
`startSound` on the kettle objects. About 15 more lines than the slice counts.

## 3. Minor findings

- **m1. The ambient bed does not ride the music slider.** `volumeSettings.music` is a constant 0.5 that
  nothing changes: `setCategoryVolume` has no caller (`sound-manager.js:446-450`; grep over `js/` and
  `app/`). The music widget's Music slider drives its own WebAudio gain, and Phaser sounds, ambient
  included, go through the SFX bus (`music/music-widget.js:67, 76, 186-195`). So "players who mute music
  lose the bed" is false, and a new `ambient` category changes nothing a player can reach. Drop the
  category and OQ41, or add a slider on purpose. The m01 check for "every mission's ambient level" then
  goes away.
- **m2. The lab's staff never swivel.** Their chairs are static seats; only Tiled map items become
  swivels (`lab_physical_pentest/scenario.json.erb:1115-1121`; `core/rooms.js:2539`). Correct 12.10 and
  the slice 21 lab check: the lab is unaffected, which lowers the risk. Check the showcase's office
  chairs are Tiled swivels before writing the objective.
- **m3. The coffee switch is easy to hit by accident and cannot be undone.** `triggerOnInteract` replaces
  the object's normal interaction on every click (`interactions.js:844-846`), so a player clicking the
  machine to read its observations turns it off for the rest of the game, and the hint repeats on each
  click. Put the switch on its own small object (a wall socket), or guard it with a choice; keep the
  machine's observations reachable. Say what an NPC already `using` the machine does when it goes off
  (recommended: finishes).
- **m4. Auto-lock runs under the player.** The timer counts from the owner's leave whatever the player
  does. "Get to Sanjay's screen before it locks itself" reads as winning a race, but the screen then locks
  while the player is on it. Real auto-lock is idle-based: reset the clock on `workstation_accessed` and
  hold it while a minigame is open on the object. Add it as an open question with that default.
- **m5. The flash.** The glow is a radial blob scaled once per variant change (`lighting.js:657`); only
  ransom glows are rescaled per frame (1117). Describe the lock flash as a shrinking glow, not a ring, and
  keep flashes in a side map keyed by object id, drawn after the emitters, because `buildEmitters`
  discards every record when a room's texture signature changes (604-631). 35 lines is about right.
- **m6. `off` and `gone` cannot ride `_recheck`.** `_recheck` returns at once for an NPC without
  avoidance (`_avoidRadius(s) <= 0`) or a job without a need (`npc-needs.js:1066-1069`). The new checks
  need their own call in `_advanceJob` before it. `_turnBack` sets `mindChanged[need]`
  (`npc-needs.js:1083`), so after an `off` turn-back the same need no longer turns back for avoidance;
  say whether that is intended (recommended: only `avoid` sets it). Wake parked needs when an `offWhen`
  global changes.
- **m7. Phone timing.** Four rings at 3 s end at 12 s; a colleague who starts at ring 2 has a 0.7 s
  wind-up (`npc-needs.js:2201`) and a walk, so a stall or a long room lets the phone ring out while it is
  on the way. Keep ringing while an answerer holds a claim. Say the ring cadence runs on the needs clock
  (pauses with a VM). Say what an owner in its wind-up does (recommended: misses, it has already decided
  to go). The answerer's `expectedAwayMs` uses the phone's `useSeconds` of 0 (`npc-needs.js:1376-1377`), so
  lock habits judge a call as a short dash; pass the call's planned length.
- **m8. Call plumbing.** `preload()` loads only NPCs with `exchanges` (`npc-needs-chatter.js:150-155`):
  add `phoneCalls`, or the first call finds no lines. The speech lock is free during the listening gaps,
  so another NPC's bark can land mid-call; hold the lock for the call (gaps included) when the player is
  in earshot. Validator: a call line matching `splitPrefix` (`npc-needs-chatter.js:30-34`) is refused at
  run time; flag it (error).
- **m9. Desk phones need presets or an authored affordance.** The `desk_phone` preset has no types and
  applies only with `officePresets: true` (schema 147). The lab does not switch presets on, so its front
  desk phone needs `affordance: { useSeconds: 0, capacity: 1 }` written out; say so in 12.10, and have the
  validator error on a `phoneOwner` object with no resolved affordance.
- **m10. The `phone_vibrate` stand-in is the player's own phone.** It is in the `notifications`
  category with `message_received` (`sound-manager.js:87, 184`); players hearing it will open their phone.
  12.6 restates OQ16 ("never placeholders that read as something else"), which this breaks. Until a ring
  is approved, the ring is the amber flash and the rattle only.
- **m11. Swivel cost and side effects.** The listening check, as written, calls `getState()` for nearby
  NPCs, and `getState` builds a large object with `_pressing`, `_queuers` and more
  (`npc-needs.js:2046-2068`); per frame for every seated NPC that is n² allocations. Compute a speakers
  list once per needs tick and read it in seating. Turning the chair sets `behavior.direction`
  (`seating.js:1211`), which is what LOS cones read (`npc-los.js:241-262`); no seated needs NPC has `los`
  today, but skip swivel for an NPC with `los.enabled` or have the validator warn.
- **m12. Showcase timing.**
  - Tom's own hunger (65, 10/min, `urgentAt` 40) goes urgent in about 2.5 minutes and sends him to the
    kitchen, where he sees the pizza himself. Grace's thirst (79, 15/min, 40) reaches the cooler at about
    2.6 minutes (`scenario.json.erb:378-384, 408-412`), so the `npc_told:tom` objective is a coin toss.
    Put the objective on Sanjay or on any `npc_told:*` through a mapping per NPC, and have the
    player-facing text say who goes.
  - Tom's work use comes about every 7.5 minutes, so at `chance: 0.4` and `forgetChance: 0.5` the
    "uncollected" beat takes about 40 minutes. Give the showcase a second lever (reading a note) that
    prints as Tom with `forget: true`.
  - Kitchen coffee for Amara estimates close to her 20 s threshold; the build note covers it.
- **m13. Ducking misses the loud speech.** `_speechUntil` covers needs barks, exchanges and calls, not a
  voiced person-chat or a voiced phone conversation with the player. Duck the bed while any chat minigame
  is open too. Hold the duck as a multiplier inside `sound-manager.js`, or the next
  `recalculateAmbientVolume` call (room change, door event, `core/rooms.js:3110, 3161`) undoes it.
- **m14. "A timed message" is not a ring source.** Timed messages deliver texts and knots
  (`npc-manager.js:1711-1737`). Drop it from the list, or say it needs a mapping on the delivery.
- **m15. Habit precedence in the lab and the showcase.**
  - Because an object's lock field wins, 12.10's option "an NPC `screenHabit` would make lock habits a
    property of the person" does nothing while `staff_pc` keeps `locksScreenOnLeave: true` and
    `staff_pc_2` keeps `false`; say the object field must go.
  - Name the habit roll's salt (for example `habit:<objectId>:<leaves>`), distinct from the object's
    `screen:<id>:<leaves>`, so adding a habit never shifts another roll.
  - 12.2 "When each sits back down, the dot flashes white": the wake flash fires only if the screen was
    locked; Amara's short trips leave it open, so there is no flash.
- **m16. Magnet discoverability and reuse.**
  - `requiresItemHint` shows only when the player clicks without the item, so a player holding the pizza
    has no prompt to try the kitchen table. Put the hint on the item's description and the table's
    observations.
  - After the magnet finishes, a second pizza deployed at the same spot would show a magnet with 0
    servings. The validator should allow one deployable item per spot, or the deploy resets the servings
    global.
- **m17. Lock cues on by default everywhere, with a coarse off switch.** `"officeVisuals": false` also
  hides carried items and use sounds (`npc-office-visuals.js:17-19, 235`). Give the cue its own switch
  (`"lockCues": false`) and let the lab session decide before slice 16 lands, since the lab is not this
  session's.

## 4. The cake answer and the placement

**The answer is right.** Needs belong to people and objects advertise; a magnet lowers the threshold for
needs it satisfies, only for NPCs that know of it. It matches `NPC_NEEDS_SYSTEM.md` 3.1 (an item's presence
makes an option), it explains why Marek and Grace ignore it, and it gives social compatibility a role
through word of mouth. Two refinements belong in the answer: temptation never lowers a level (M3), and one
person takes one serving by default (M4). Note for the showcase: Tom's and Sanjay's hunger start at 65 and
64, already inside a band of 70, so "temptation" there reads as "goes at once"; that is fine for a
showcase, and the README should say so.

**Option B (deploy at a declared spot) is the best of the three.** It needs no server or interaction-code
change, it is saved through one global, and the validator can check approach cells, leash and the announce
pool. The keylogger already proves `requiresItem` plus `consumesItem` end to end in the lab. Its two costs
are discoverability (m16) and the trigger taking over the table's normal click, which is acceptable for a
table. A drop (A) should stay unsupported, as planned.

## 5. Open questions 27-46

| OQ | Default | Comment |
|---|---|---|
| 27 | Sound, with a change | Own switch for the cue, and the lab session's agreement (m17) |
| 28 | Sound | Name the salt (m15) |
| 29 | Sound | |
| 30 | Sound | |
| 31 | Sound | Option B (section 4) |
| 32 | Sound | Saved through the 30 s sync and the pagehide flush (`state-sync.js:126-148`); fine |
| 33 | Sound | Add: telling does not depend on the line being spoken (M6) |
| 34 | Sound | |
| 35 | Change | Add "a tempted need never parks and a parked need is never tempted" (M3) |
| 36 | Sound | With `perPerson` (M4) |
| 37 | Sound | Add: the phone keeps ringing while the answerer is on the way (m7) |
| 38 | Sound | |
| 39 | Sound | |
| 40 | Sound | |
| 41 | **Withdraw** | Premise wrong (m1) |
| 42 | Sound, with changes | Ten files is right by the table; see section 7 for licences, loop format and runtime chimes |
| 43 | Change | Put the switch on its own object (m3) |
| 44 | Sound | Detect "hidden" by the reveal global being false, not by `visible`, which other code toggles |
| 45 | Sound | The lab is unaffected (m2) |
| 46 | Sound | `phone1` at native size works (section 1) |

Missing, with recommended defaults:
- **OQ47. Does auto-lock reset when the player uses the screen?** Yes, idle-based (m4).
- **OQ48. What does an owner do when the phone rings during its wind-up?** It misses the call (m7).
- **OQ49. Ring cadence on the needs clock?** Yes: it pauses with a VM, like every other timer.
- **OQ50. One serving per person?** Yes, `perPerson: 1` (M4).
- **OQ51. Do print hooks fire on deliveries?** No, need uses only (M5).
- **OQ52. Does an announcement need the voice line?** No: telling happens on the announce, whatever is
  shown (M6).

## 6. Sizes and slice order

- **Slice 16** (~165): about right; add the no-lighting fallback (M7, ~20) and the idle reset (m4, ~10).
- **Slice 17** (~150): add the hook rule and the start-time roll (M5, ~10) and the early-return change
  (M2, shared with 18).
- **Slice 18** (~320, L) is two features with one shared turn-back reason. Split it:
  - **18a, coffee off** (`offWhen`, the `off` turn-back outside `_recheck`, the wake on the global, the
    switch object): about 70 lines, S. It reuses slice 14 directly and makes a good early lever.
  - **18b, magnets**: about 300 with M2, M3, M4 and M6, L.
- **Slice 19** (~250): the file list omits `seating.js` (M1); about 270.
- **Slice 20** (~170): add the crossfade, `outputSound` and `startSound` (M8, M9, ~30), and remove the
  `ambient` category (m1, -5); about 195.
- **Slice 21** (~45): right; add the per-tick speakers list (m11).

Total about 1,200 lines. Recommended order:
1. **21**: no dependencies, no approvals, smallest.
2. **16**.
3. **18a**.
4. **17**.
5. **18b**.
6. **19**.
7. **20** last, because nothing in it is heard until the files are approved, and it should go after the
   lab's room dressing settles if the lab adopts it.

## 7. Sound and art sourcing

- **Freesound CC0** is fine; filter by licence, because Freesound also hosts CC-BY and CC-BY-NC files
  that would not do.
- **The Sonniss GDC bundles** allow use in games without attribution, but their licence forbids
  redistributing the files as sound assets in their own right. The repo has a GitHub remote
  (`github.com/cliffe/BreakEscape`); raw mp3s served from a public repository are arguably that. Prefer
  CC0 for anything committed, and ask the user before using a Sonniss file.
- **Credits.** The existing convention is a comment above each `load.audio` line naming the licence and
  source (`sound-manager.js:63, 72, 91`), and the validator reads the same file. Keep to it rather than
  starting a separate credits file, or do both.
- **Loop format.** MP3 adds encoder padding that leaves a short gap at the loop point in browsers. For the
  beds and the typing loop, ship OGG (Phaser takes a list of URLs) or trim and check the seam live, not
  in an editor.
- **Chimes without a file.** The fluorescent tube's tink is synthesised at run time with WebAudio and no
  asset (`lighting.js` `playStrikeClick`, from 787). The lock and unlock chimes can be made the same way:
  no file and no licence, though still **[approval]** as a sound.
- **Stand-ins.** `phone_vibrate` should not stand in (m10). `phone1` and `pizza_boxes1` are workable at
  native size. No art is rescaled anywhere in the section.

## 8. Verdict

**Not ready to build as written; ready after the nine majors are folded in.** None of them changes the
section's design. Each is a rule or a hook that the code needs and the text missed.

| Slice | Must fold in first |
|---|---|
| 16 | M7 (fallback cue), m4, m5, m15, m17 |
| 17 | M2, M5, m12 (second lever) |
| 18 (split 18a/18b) | M2, M3, M4, M6; m3, m6, m16 |
| 19 | M1; m7, m8, m9, m10 |
| 20 | M8, M9; m1, m13; section 7 |
| 21 | m2, m11 |

A round-2 review should look at slices 18b and 19 only, since those two carry six of the nine majors.
Slices 16, 17, 20 and 21 can take their fixes into the build brief without another round.
