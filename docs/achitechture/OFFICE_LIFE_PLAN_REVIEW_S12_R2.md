# Office Life plan, section 12: adversarial review, round 2

Reviewed: `docs/achitechture/OFFICE_LIFE_PLAN.md` section 12 (slices 16-21) and the section 13 change
table, as revised in c1111c266, against the working tree at that commit. Read-only; no code or plan
edits. Paths are relative to `public/break_escape/js/` unless they start with `scenarios/`, `scripts/` or
`docs/`. Finding ids are new to this round; section 4 maps round 1's ids to an outcome.

**Count: 0 blockers, 6 major, 16 minor.**

## 1. Verdict

**Slices 21, 16 and 18a are ready to build with the minors below folded into their briefs. Slice 17 is
ready once M5 is folded in, and slice 20 once M6 is. Slices 18b and 19 are not ready as written: 18b
carries M3 and M4, and 19 carries M1 and M2.** None of the six changes the design. Each is a rule that
the revision added and the code does not support, or a fix that the code next to it undoes. No third
full round is needed; a short check of the 18b and 19 text after the fold-in is enough.

The line citations hold at HEAD (checked: `_free` 783-786, `_select` 842-870 with the guard at 844,
`_park` 1023-1028, `_recheck` and `_turnBack` 1066-1097, `_pickBark` 1147-1160, `_startExchange`
1215-1223, `_advanceJob` 1446-1483, `_completeJob` 1485-1531, adapter `revealOutput` 2511-2537,
`seating.js` `needsStop` 1061-1076, `typingBob` 1095-1100, `updateNeedsSeat` 1185-1222,
`fadeAmbientTo` 360-404, `recalculateAmbientVolume` 3166-3205, the lab lines in 12.10).

## 2. Major findings

### M1. A call in progress when the player opens a chat with the caller is not specified (12.5, slice 19)

OQ39 covers the ring: an owner already talking to the player misses the call. It says nothing about the
reverse, which is the common case, because a player who hears Tom on the phone will walk up and click
him.

- `_tickNpc` freezes an NPC the moment `world.inChatWith(id)` is true and returns before anything else
  runs (`npc-needs.js` 659-671). The call overlay `s.call = { phoneId, until }` runs on the needs clock,
  so `until` keeps passing while Tom is frozen. If the call runner sits in `_tickNpc`, the lines stop
  mid-call; if it sits in the system tick (as exchanges do, 1762-1811), Tom keeps speaking his call
  through `npcChatterVoice.say` over the person-chat's own voiced lines.
- The audience check is "same room, lit, in range, checked every line". A player in a chat with Tom
  passes it, so `heard_<knot>` is set and the objective "Overhear Tom on the phone" completes behind the
  chat window.
- The same applies to a colleague mid-call at someone else's phone.

**Fix.** A call ends when its speaker enters a chat with the player: the remaining lines are dropped,
the speech lock is released, the knot stays unplayed (not `heard_`), and the system emits
`desk_phone_hung_up:<phoneId>` `{ speakerId, reason: "player" }` so a scenario can map a "Sorry, had to
go" beat. Say where the call runner lives (the system tick, beside the exchange runner) so the frozen
check is explicit. Add OQ53 with this default and a node test: a chat opened on the second line leaves
the knot unplayed and fires no `npc_call_heard`.

### M2. The colleague who answers sits in the owner's chair (12.5, slice 19)

The plan says the colleague's job "passes `seat: "stand"`, as 2.2 Part B planned for visits". No job
field `seat` exists: `seatPreference` reads only the target's `affordance.seat` and the NPC's `seated`
(`seating.js` 1110-1120), and 2.2's `seat: "stand"` belongs to routines (slice 9, not chosen). Neither
the `desk_phone` preset nor the written-out affordance sets `seat` (`data/office-presets.json` 14; plan
12.5 authoring), and the phone satisfies nothing, so the preference falls to `near`: sit on a chair
already within 36 px.

The validator now requires the phone within 1.5 tiles of the owner's home approach cell. That puts the
colleague's feet next to the owner's chair, and the "other post" exclusion lets it through: posts within
`NEAR_CHAIR` of the sitter's feet are dropped from the exclusion list (`seating.js` 1240-1242, "unless
this is that spot too"). So Amara walks over and sits in Tom's chair. If Tom walks in while she is
there, he answers on arrival (12.5) beside his own occupied chair.

**Fix.** Put `"seat": "stand"` in the `desk_phone` preset and in the written-out affordance
(`affordance.seat` is already read, `seating.js` 1111-1112; seating is outside the decision log, so the
preset parity test is unaffected). The validator errors on a `phoneOwner` object whose resolved
affordance does not stand. Drop the "passes `seat`" sentence and the reference to 2.2 Part B. Live proof:
a screenshot of Amara standing at Tom's phone with his chair empty.

### M3. With the round 1 servings rule, nobody can ever turn back with `gone` (12.4 item 6, slice 18b)

Item 6 makes a magnet free while `claims < min(capacity, servingsLeft)` and takes a serving when `using`
starts. `_claims` counts every non-queued job on the object, walkers and eaters alike (`npc-needs.js`
767-775). An eater has already taken its serving, so at the moment any walker claims, walkers plus
eaters are below the servings left, and every walker who claims gets a serving. The count can reach 0
only through the last walker's own arrival, so there is never anyone on the way when it does.

The plan still relies on `gone` in three places:
- the test "capacity 3 with one serving left and three tempted NPCs: one eats, two turn back with
  `gone`" (under the rule only one can claim; the other two never start a job);
- the player-facing beat "a late arrival turns back: 'Missed it.'";
- the 18b line budget for "the `gone` reason in 18a's check".

The rule also under-admits: with 3 servings, capacity 3, one eater and one walker, a third NPC sees
`claims 2 >= min(3, 2)` and waits though a slice is free.

**Fix.** Pick one, and make the test, the beat and the budget agree with it.
- **Recommended:** free while `claims < capacity && servingsLeft > 0`; a serving is taken at `using`
  start (so the count never goes below 0); a walker whose magnet reaches 0 servings turns back with
  `gone` at once (the 18a check in `_advanceJob`), and one that arrives at 0 never starts `using`. This
  keeps "Missed it" and the R1 test as written, and capacity still limits the crowd.
- Or keep the current rule, drop `gone` from 18b (keep it only for a magnet hidden by a mapping), rewrite
  the test to "one claims, two find nothing and start no job, count 0", and drop the beat.

Also tidy the finish wording: "When the last serving is taken, the eater finishes, then the engine
hides the magnet" should be "when the last serving is taken and every NPC still `using` the magnet has
finished".

### M4. A tempted need that cannot use its magnet floods the log and the leash event (12.4 item 4, slice 18b)

Rule 1 ("a tempted need never parks: a failed tempted selection is simply no option") removes the park,
but not the bookkeeping that runs before it.

- `_useCandidate`'s `nothing()` calls `_noteLeash` and `_notePrivate` (`npc-needs.js` 899-904). They are
  once-per-episode only because `leashNoted`/`privateNoted` stay set while the need is urgent. `_decay`
  clears both flags on every tick that the level is above `urgentAt` (750-758), which is always true of a
  tempted need. So a told NPC whose leash forbids the magnet's room logs `leashed` and emits
  `npc_needs_leashed:<id>` on every select.
- Nothing slows that select: the select back-off applies only when `_reachable` ran
  (`_selectSearched`, 541-544; `_tickNpc` 719-731), and a candidate dropped by the leash never reaches
  it. That is one event per tempted NPC per 250 ms tick, for as long as the magnet is out. The plan's
  own example ("a cake in Maya's private office draws nobody else") does the same through
  `private_skipped`.
- The plan's test "a told, leashed NPC keeps its level and logs no `parked`" passes while this happens.
- The same `_decay` branch clears `mindChanged[need]` (757), so a tempted walker's "turn back once, then
  go anyway" rule (`_recheck` 1075) never holds.
- Item 6 says a walker that turns back with `gone` "falls back or parks". For a tempted walker, rule 1
  forbids the park, and `_turnBack` re-selects through `_select` (1093-1096). The job must record that
  it was tempted (`job.tempted`), because the level may have decayed below `urgentAt` on the way.

**Fix.** Treat a tempted selection as a quiet look: when the need is above `urgentAt`, `_useCandidate`
skips `_noteLeash`, `_notePrivate` and `s.giveUp`, and returns null. Record `job.tempted` at job start;
a tempted job that turns back neither parks nor grumbles twice. Keep a static validator warning for a
magnet that a told NPC can never reach. Tests: a told, leashed NPC over 2 minutes of needs clock logs no
`leashed`, `private_skipped` or `parked` and emits no `npc_needs_leashed`; a tempted walker turned back
with `gone` does not park.

### M5. The print errand comes home without the return path (12.3, slice 17)

The errand is a carry whose target is the owner's `needsHome` object. A carry is not `_atOwnPost`
(that needs `kind === 'use'`, `npc-needs.js` 1295-1298), so on the way back Tom's mode stays `job`, and
at his desk he goes into `using` on `tom_pc` for its `useSeconds`: 10 s from the `desk_pc` preset,
seated, because `needsStop` makes a `using` stop on the home object a post stop with seat `fetch`
(`seating.js` 1072-1076, 1119). Only after that does `_completeJob` send him `returning`
(`npc-needs.js` 1526-1529), and only then do the two return-path checks run:
- `_checkCaught` runs only in `returning` mode (691), so `npc_caught_at_post` fires about 10 s after
  Tom has sat down;
- `npc_returned_post` (and with it the workstation unlock and the wake flash, 12.2) fires after that.

The plan's own lever triggers this. "Send a print job" fires on `workstation_accessed:tom_pc`, so the
player is at Tom's PC, often still in its minigame, when Tom carries the printout back. He sits down
beside the player at his own screen, which still reads "owner away", and nothing notices the player for
10 s. In the lab, where `npc_caught_at_post` matters, this would be a visible fault. Amara's existing
deliveries to her own PC already behave this way, which is why it went unnoticed.

**Fix.** On a carry whose target is the NPC's own `needsHome`, treat the last leg as the return: run
`_checkCaught` while that leg is in the home room, and on arrival place the item and finish at once (a
`placeSeconds`-style dwell of 0-1 s, not the PC's `useSeconds`), then go through the normal
`returning` arrival so `npc_returned_post` fires before he sits. Node test: an errand back to the post
emits `npc_caught_at_post` when the stub reports the player in a minigame on the home object, and
`npc_returned_post` comes before the next `work` use. Live: the lever with the player still in Tom's
minigame.

### M6. North and south doorways stop the bed, so the crossfade does not remove the gap (12.6, slice 20)

`updatePlayerRoom` finds the room whose floor holds the player's feet, and a room's top two tile rows
are wall, outside its floor (`core/rooms.js` 3074-3103). Walking through a north or south door, the feet
cross that band and no room matches, so `detectedRoom` is null. The function still calls
`recalculateAmbientVolume(null)` before its "keep previous" return (3113-3117), and with a null room no
room is the player's or adjacent, so the loop ends in `fadeAmbientTo(current, 0)` (3206-3207). The bed
fades out in the doorway and the next one fades in after it. The plan's crossfade in `fadeAmbientTo`
never sees a key change here; it sees a fade to 0 and then a start.

The showcase hides this: its rooms join east to west (`scenarios/test_needs_sims/scenario.json.erb` 96,
480, 533), where the side walls lie inside the room's width. m01's server room, the one regression room
for slice 20, joins `it_room` to the north (`scenarios/m01_first_contact/scenario.json.erb` 2067-2071),
so the "unchanged apart from the crossfade" check will show a dip there today and after the slice.

**Fix.** In `recalculateAmbientVolume`, return without change when `playerRoom` is null (keep the
current bed), as the comment at 3116 already intends for events. Five lines in the "own room first" fix.
Live proof: the doorway recording through one east-west and one north-south door (add a north-south
pair to the showcase, or record on m01 with `roomTone` on in a local copy). Note that this recording,
and every slice 20 playback proof, needs at least one approved bed file; until then the proof is the
play log and the fade calls, not audio.

## 3. Minor findings

- **m1. The call overlay needs more plumbing than the file list says.** `getState` copies named fields
  only (`npc-needs.js` 2046-2066), so seating's `needsStop`/`typingBob` and the action icons cannot see
  `s.call` until it is added there. The phone action icon is drawn by `npc-action-icons.js`, which is
  not in slice 19's file list. Add both (about 8 lines).
- **m2. The owner walks in while a colleague is on the way.** The phone keeps ringing while an answerer
  holds a claim, and the owner "answers on arrival" while it rings, so both answer. Rule: the owner's
  answer turns the colleague back with reason `answered` (no grumble, no park); or the owner does not
  answer while a colleague holds a claim. Recommended: the owner wins. Add `playerNearby` and
  `playerDistance` to `desk_phone_answered`, as every other NPC event carries; the "spot the risk" mode
  (12.11) wants it.
- **m3. The call's speech lock.** "With the player in earshot the call holds the speech lock for its
  whole length" does not say when earshot is judged. The lock is global (`_speechUntil`, 1138-1166), so a
  call of five or six lines with 1.5-3 s gaps (30-50 s) silences every bark and exchange in the
  building, and turns a waiting announce (18b, 30 s cap) into a picture. Hold the lock through a gap only
  while the per-line audience check passes; release it when the player leaves.
- **m4. The `phone` pool in the authoring example.** A scenario-level pool is merged into every NPC's
  pool (`chatterPool`, `npc-needs.js` 110-119), so Amara answering Tom's phone may say "Hello, Tom
  speaking." Put owner lines on the NPC (`chatter.phone` on Tom) and give answerers a separate topic
  (`phone_message`), or keep scenario-level lines speaker-neutral; the validator warns on a scenario-level
  `phone` line that contains an NPC's display name.
- **m5. Grumbles are not per reason.** 18a's `off` and 18b's `gone` use the NPC's `grumble` pool. The
  lab's scenario-level pool is "Sofia's there. I'll come back later." and "Not while she's on about
  sailing." (`scenarios/lab_physical_pentest/scenario.json.erb` 43-45), so a coffee machine switched off
  at the wall gets a line about Sofia. "Missed it." (18b) is in no pool. Read `grumble_<reason>` first,
  falling back to `grumble`; the showcase adds `grumble_gone` and `grumble_off`.
- **m6. `lockCues` is not independent of `officeVisuals`.** `installNpcOfficeVisuals` returns null when
  `officeVisuals` is false (`npc-office-visuals.js` 233-235), and the cue's listener, glyph and chimes live
  in that module. A scenario with `"officeVisuals": false` and lock cues on gets none. Install the module
  when either switch is on, and gate each layer by its own switch.
- **m7. No event at `using` start, and cosmetic prints are silent.** `startSound` needs one: the needs
  system emits `npc_used` at completion only, and nothing when `using` begins (`npc-needs.js` 1475-1478;
  the full list of `_emit` calls has no such event). Add `npc_use_started:<objectId>` in `_advanceJob`
  (slice 20 then touches `npc-needs.js`, which its file list omits; 18b can reuse the event for servings).
  The adapter emits `object_revealed` only for a real slot, not a cosmetic copy (2525-2534), so once
  forgotten prints fill the pool (12.3 risks) the copier stops sounding. Play `outputSound` for cosmetic
  copies too.
- **m8. The duck fires on speech nobody hears.** `_speak` takes the lock for every bark, heard or not
  (1163-1167), so the office bed ducks when an NPC two rooms away grumbles. Duck only while a line with
  `overheard: true` (the info `_speak` already passes) is playing, or a chat minigame is open.
- **m9. The chime gating proof cannot be captured before approval.** `playAt` logs every attempt,
  including "not loaded" (`npc-office-visuals.js` 194-212), which makes the file sounds provable while
  silent. The run-time chimes skip `playAt`, so an unapproved chime leaves no trace and slice 16's "play
  log from inside the office and from the kitchen doorway" shows nothing. Log the chime attempt with its
  volume and `reason: "unapproved"` until the user approves it, and record a short sample for that
  approval.
- **m10. When telling happens, and to whom.** "Learns it at that moment, whatever is shown" can be read
  as the arrival or as the moment the line or picture shows, up to 30 s later. Recommended: the hearers
  are the compatible, unknowing NPCs in range when the line or picture shows, so a player sees the
  line before anyone gets up. Skip the announce, with no line and no TTS request, when nobody in range
  would learn (an empty office, or Marek, whom nobody listens to).
- **m11. Slice 18a's showcase objective has a narrow window.** It fires only on `npc_turned_back` with
  `reason === "off"`, which needs Tom or Sanjay to be walking or queued at the moment of the click.
  Sanjay's caffeine decays 1 point a minute (`scenarios/test_needs_sims/scenario.json.erb` 433), so in
  practice only Tom can do it. A player who switches it off while Tom sits at his desk never sees the
  objective complete, though Tom later takes the kitchen. Add a second mapping: `npc_used:kitchen_coffee`
  with `globalVars.office_coffee_off`. The socket's `set_global` emits on every click (`apply-actions.js`
  81-89): wake parked needs only on a real change of value, and give the socket an
  `observationVariants`-style hint once it is off, rather than repeating "You switch the coffee machine
  off".
- **m12. Swivel during a call, and a listening proof with nobody to turn.** An owner on a call is "idle
  at its post", so 21's idle swivel would turn it mid-call; skip swivel while `s.call` holds (and face
  the phone if a facing is wanted). The live proof "a listening turn at the cooler" cannot be captured:
  the cooler is in the kitchen (`scenario.json.erb` 478-511) and no needs NPC has a post there, so no
  seated NPC is within four tiles. Use the office coffee queue's chatter, which is in Tom's room.
- **m13. Habit edge cases.** Say that `lockIfAwayOverSeconds` alone implies `lockChance: 1` for a long
  trip (Amara's showcase relies on it). `_expectedAwayMs` can return null (no approach cell,
  `npc-needs.js` 1363-1371); say what a habit does then (recommended: treat it as long). A station
  found after its owner left takes its state in `onInteract` through `decideLocked` alone
  (`workstation-state.js` 173-174); it must use the habit too, with the `expectedAwayMs` stored at the
  leave, and its auto-lock clock must start from the leave, not from discovery.
- **m14. Uncollected can fire for a print that will be fetched.** The showcase's `fetchAfterSeconds:
  [30, 120]` runs past the producer's default `uncollectedAfterSeconds: 60`, so
  `npc_print_uncollected:tom` (an objective) fires for a print Tom will still fetch about half the
  time. Either intend it and say so (the payload's `forgotten` flag tells them apart), or set the
  showcase copier's `uncollectedAfterSeconds` above 120.
- **m15. The approval list is incomplete.** Section 12 asks for eight files and the `npc-lock` icon as
  one batch (OQ42), plus a socket sprite and optional cake and `npc-phone` art (OQ46). Not on any list:
  the ringing-phone glyph for a ring without lighting (12.5, new art even as a 16×16 icon); the fact that
  `npc-lock` is two icons (closed and open); and the two chimes, which cannot be approved from a
  description (m9). Put all of them in one approval page. The room-tones profiles name seven room types
  but only two beds; say which bed each profile uses (reception, IT and CEO office: `office_tone` at a
  lower level? meeting room: none?).
- **m16. Small spec gaps in 18b.**
  - The `news` picture is the hunger icon whatever the magnet satisfies; take the icon from the magnet's
    first `satisfies` (`npc-hunger`, `npc-social`), falling back to `social`.
  - Say whether an NPC that learns of a magnet mid-job retargets. Recommended: no (Tom at the fridge
    finishes his fridge use; 12.4's "What the player sees" already assumes it).
  - "Learning ... wakes the parked needs it satisfies for that NPC": `_wakeParked()` today wakes every
    parked need of every NPC (`npc-needs.js` 1046-1060). A per-NPC, per-need variant is needed; it fits
    the "wake on learning 10" budget, but name it.

## 4. Round 1 findings

| R1 | Outcome | Notes |
|---|---|---|
| M1 phone not answered at the post | **Partly fixed** | The overlay, `needsStop` and the bob are right. The colleague's standing answer relies on a job `seat` that does not exist (M2); the call during a player chat (M1), the owner-colleague race (m2) and `getState` exposure (m1) are open |
| M2 `_select` early return | Fixed | Guard widened in 12.3 and 18b item 5; tests with the cache on and off |
| M3 temptation versus parking | **Partly fixed** | The three rules are in; the bookkeeping before the park still runs every tick, and `mindChanged` is cleared (M4) |
| M4 servings | **Partly fixed** | No negative count and no phantom slice; the new free rule makes `gone` unreachable, contradicting its own test and beat (M3) |
| M5 deliveries print again | Fixed | Need-use rule and start-time roll are right; the errand's return leg is a separate, new problem (M5 here) |
| M6 word of mouth fails silently | Fixed | Telling time and empty-room announces need a sentence (m10) |
| M7 cue without lighting | Fixed | The glyph's module is not installed with `officeVisuals: false` (m6, which is R1 m17's remainder) |
| M8 one ambient track | **Partly fixed** | The crossfade is right for east-west doors; north-south doors still drop to silence (M6) |
| M9 spot sounds | **Partly fixed** | `outputSound` and the kettle preset are right; `startSound` has no event to hang on, and cosmetic prints are silent (m7) |
| m1 music slider | Fixed | |
| m2 lab chairs | Fixed | |
| m3 coffee switch | Fixed | Repeated hint and wake on every click (m11) |
| m4 auto-lock under the player | Fixed | Late-discovered stations (m13) |
| m5 flash | Fixed | |
| m6 `off`/`gone` outside `_recheck` | Fixed | |
| m7 phone timing | Fixed | |
| m8 call plumbing | **Partly fixed** | `preload` and the prefix check are in; when the held lock is judged is not (m3) |
| m9 desk-phone affordance | Fixed | Add `seat: "stand"` to it (M2) |
| m10 `phone_vibrate` | Fixed | |
| m11 swivel cost, LOS | Fixed | |
| m12 showcase timing | Fixed | |
| m13 ducking | **Partly fixed** | Covers chats; ducks on unheard speech (m8) |
| m14 timed message | Fixed | |
| m15 habit precedence | Fixed | |
| m16 discoverability, redeploy | Fixed | |
| m17 `lockCues` | **Partly fixed** | The switch exists; the module it lives in is not installed when `officeVisuals` is false (m6) |

## 5. Slices, order and the rest of the section

- **Order and dependencies** (12.8) are right: 21, 16, 18a, 17, 18b, 19, 20. 18b's dependency on 17
  and 18a is real (the shared guard and the turn-back check). If M3's recommended fix is taken, the
  `gone` check moves into 18b's budget unchanged.
- **Sizes.** 16 (~195) gains about 10 for m6, m9 and m13. 17 (~160) gains about 15 for M5. 18b (~310)
  gains about 15 for M3 and M4. 19 (~270) gains about 35 for M1, M2, m1-m4. 20 (~205) gains about 15
  for M6, m7 and m8. 21 is unchanged apart from the call check (m12). Total about 1,350 lines.
- **Byte-identical decision logs where features are off** hold as planned. The habit roll goes through
  `roll`, which is stateless (`npc-needs.js` 153-155, 268-270), so it shifts no other roll; `s.rng` is
  drawn only on need completions (1493), which a phone answer by a colleague (no need) does not add;
  `afterTick`, the speakers list and seating write nothing to the log; only `avoid` sets `mindChanged`
  today, so 18a's rule changes no existing log.
- **Open questions 27-52.** Defaults are sound apart from: OQ35, add "a tempted selection logs nothing"
  (M4); OQ32/OQ50, restate after M3's choice; OQ37, add "the owner arriving wins" (m2); OQ42, widen the
  batch (m15). Add OQ53 (a call when the player opens a chat with the speaker: it ends, knot unplayed,
  M1) and OQ54 (grumble lines per reason, m5).
- **Lab impact** (12.10) is accurate. Two additions for the lab session's notes: if it adopts 18a, its
  scenario-level grumble pool names Sofia (m5); if it adopts 17, M5 matters there because its staff PCs
  are the caught-at-post beats.
- **Notes for the later m01-m10 skill** (12.11) are sound. Add: a mission with north-south doors and
  `ambientSound` is where M6 shows; and an approval page for all new sounds and icons comes before any
  mission adopts slices 16, 19 or 20.
- **Pixel art.** Nothing in the section rescales art. `phone1` (20×17) and `pizza_boxes1` (23×22) are
  drawn at native size; `notes_postit1` (9×9) is the socket stand-in. A 9×9 post-it labelled "Wall
  socket" reads as a note; mark it with a `_comment` as a stand-in so the room-dressing skill replaces
  it.
