# Slice 5 R2 delta review: demo_access_tour (structure and dialogue)

Scope: `git diff be2019f57 54a158ba4 -- scenarios/demo_access_tour docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md`, files read at 4f472e45e. No scenario edits. Runtime evidence: an inkjs driver on scratch copies of ama_phone.json and ama.json (where_next and recap under about ten flag sets), and loopcheck on both from `start` (no errors). Line numbers are at 4f472e45e.

Counts: B0 / M2 / m4 / n4

## Findings

### M1. The unplug guards on W14a, W14b, W15 and W16 hide Wi-Fi stops that still work after the unplug (regression)
`scenarios/demo_access_tour/ink/ama_phone.ink:84, 87, 90, 94`

The fix hid W14 to W16 once `done_t_unplug` is set. Plan stop 17 (plan:296) says "The implant, Wi-Fi and keyboard sessions stay", and the rogue AP, its console and the Staff join do not touch meeting_jack (the AP is a hideable kit item, plant-hiding.js; staff_ap is an `unlock_object` on the captured key). R1 S-m1 listed them as box-dependent; R1 D-M5 had it right. W15 itself tells the player "If she doesn't, carry on. The Wi-Fi stops still work after the box comes out." A player who does exactly that loses the W16 pointer the moment they unplug. Driver, full route with the door, desks and implant done, AP not planted, box out: the hub jumps straight to W18 ("Take the box to the comms cupboard...") and never mentions the AP or Staff Wi-Fi again, while the ending check will list them as open. The quick-route look-round reply ("anything that needed it in the wall is done for today. The rest is still there.", ama.ink:96) is correct; the phone now contradicts it on the full route.

Fix: drop `and not done_t_unplug` from W14a, W14b and W16. Split W15 so its second line only shows while the box is in:
```
- tour_full and not ap_planted:
    Hide the access point in one of the reception plants, then open its console and copy the Staff Wi-Fi.
    ~ tail = true
- tour_full and not staff_twin_up:
    The access point's in. Open its console from the plant and copy the Staff Wi-Fi.
    ~ tail = true
- tour_full and not done_t_capture_key:
    Give it a moment. Thandiwe's about to check her email, and her laptop should join your copy.
    { not done_t_unplug:
        If she doesn't, carry on. The Wi-Fi stops still work after the box comes out.
    - else:
        If she doesn't, carry on to the comms cupboard and come back.
    }
- tour_full and not done_t_staff_wifi:
    You've got the Staff key. Join the Staff Wi-Fi and compare it with the guest one.
    ~ tail = true
```
(W15 sets no `tail`; see m1.) Update the plan note at plan:385 to say only W6b and W7 are hidden after the unplug.

### M2. W6b now reaches the Desktop Connect player but tells them to use a keyring that is empty, and it still sits ahead of the required Lorna step
`scenarios/demo_access_tour/ink/ama_phone.ink:61-63`

The R1 M1 reach fix works: driver with `done_t_julian_pc`, `julian_lost_with_desk`, `has_julian_rdp` false and `tour_full` prints W6b. But the main way to be "lost" is plan:618's Desktop Connect then sign-out, and that player never chose Copy, so `has_julian_rdp` is false and nothing is on the keyring (the keyring's `held` proof reads the stored inventory, game.rb:1893-1899). "Connect again from your keyring" sends them to an empty list. Two smaller points on the same line: W6b is optional and still hides W9 (it names Lorna, but not where she is or the cloner); and once `done_t_copy_badge` is set the line goes, W7 is also off (lost and not back), so a lost player who did Lorna first never hears how to get the door controller back (driver case "lost_after_badge_full" goes straight to W11).

Fix: move W6b below W10 with the other optional lines, drop `not done_t_copy_badge`, and split on the keyring:
```
- tour_full and julian_lost_with_desk and not julian_back and not done_t_door_controller and not done_t_unplug and has_julian_rdp:
    Julian's session went when you signed out at the front desk.
    Connect again from your keyring and it'll go through the box this time. You'll need it for the door controller.
    ~ tail = true
- tour_full and julian_lost_with_desk and not julian_back and not done_t_door_controller and not done_t_unplug:
    Julian's session went when you signed out at the front desk.
    To get it back through the box, sign in there, copy his connection file, sign out, then connect from your keyring.
    ~ tail = true
```
It must stay above W7, whose `(not julian_lost_with_desk or julian_back)` guard then needs no change.

### m1. The tail line repeats on almost every "Where next?" of a full walk-round, and doubles up on W15 (question 3)
`scenarios/demo_access_tour/ink/ama_phone.ink:104-106`, with `:91-92`

On the full route the tail follows W7, W8, W11, W12, W13, W14a, W14b, W15 and W16: up to nine asks in a row end with the same sentence. In a live demo, where the presenter asks the phone at each stop, the room will notice it by the third time, and it reads as nagging to pull the box when the full route is meant to be the long tour. On W15 it sits straight after "The Wi-Fi stops still work after the box comes out", so the box comes up twice in two lines. On the quick route it only ever follows W11, which is fine.

Fix: say it at most twice, and never after W15 (the M1 rewrite already removes W15's `tail`). Add `VAR told_skip = 0` and:
```
{ tail and not done_t_unplug and told_skip < 2:
    ~ told_skip = told_skip + 1
    Skip any of that you like, and pull the box out when you're ready.
}
```
The required unplug stays visible: the objectives panel lists t_unplug under aim_network, and W17 shows whenever the optional lines run out.

### m2. The new D2 full-route reply is word for word another mission's line
`scenarios/demo_access_tour/ink/ama.ink:94`
> Ama Owusu: Take your time. I'm not going anywhere.

Identical to m08_phone_agent_0x99.ink:243 and lab_social_engineering/ink/tomasz.ink:81 (the R1 m10 fix swapped one repeat for another).
Rewrite: `Ama Owusu: Have a proper look. I'll be in reception when you're done.` (no match in scenarios/).

### m3. The first meeting now points at the phone three times in a row
`scenarios/demo_access_tour/ink/ama.ink:42, 55`; `ama_phone.ink:34`
> I'll stay here. If you're stuck, check your phone. I'll text if I think of anything.
> The full walk-round, then. Your phone will tell you where next.
> Ask me where next whenever you're stuck.

On the full route a player hears A4, the route reply and the phone opener within a minute: "check your phone", "your phone will tell you", "whenever you're stuck" (with "stuck" twice). M1's "Your phone's got the list" (ama.ink:66) is also slightly off, since the phone names one step at a time, not a list.
Rewrites:
- route reply (ama.ink:55): `Ama Owusu: The full walk-round, then. Most people only see half of it.`
- phone opener (ama_phone.ink:34): `Ask me where next any time.`
- M1 (ama.ink:66): `Ama Owusu: Still going? Your phone will tell you where next.`

### m4. W13 says "Sign in again" to a player who never signed out
`scenarios/demo_access_tour/ink/ama_phone.ink:82`

The desk-held route (plan:617, no sign-out at stop 5) is a supported route, and that player is still signed in at reception_pc.
Fix:
```
- tour_full and not done_t_implant and front_desk_signed_out:
    Back to the front desk. Sign in again, then see what Delphine's USB ports will take.
    ~ tail = true
- tour_full and not done_t_implant:
    Back to the front desk. See what Delphine's USB ports will take.
    ~ tail = true
```

## Notes

### n1. The `ap_planted` mapping is sound, with one edge
`scenarios/demo_access_tour/scenario.json.erb:574`. The event is real: plant-hiding.js:504 emits `device_hidden` with `itemId` as the suffix (`_emit`, :412-416), so `device_hidden:kit_rogue_ap` matches with no payload condition needed. No onceOnly is correct: it is a setGlobal mapping, which persists nothing (R1 n3), and it cannot fire twice because the item leaves the inventory and there is no retrieve path. ama_phone registers with reception, where the plants are. Edge: the `already_hidden` path (:509-512, a retry after a lost response) does not emit, so `ap_planted` can stay false and W14a shows once more until the console sets `staff_twin_up`. Harmless; no change.

### n2. hint_open_session says "they" after a timed text about one person
`scenarios/demo_access_tour/ink/ama_phone.ink:119`. The P text before it is about Thandiwe ("She's signed in... watch her go").
Rewrite: `The cake might do it too, if she's hungry. The rota board always works.`

### n3. D5a's add-on says "stayed up" for a foothold made after the unplug
`scenarios/demo_access_tour/ink/ama.ink:110`. If the implant or Staff Wi-Fi came after the box was out, nothing "stayed up" through the unplug.
Rewrite: `Ama Owusu: Anything you'd reached another way didn't need the box.` (no match in scenarios/).

### n4. The plan's phone and debrief tables still carry the old wording
`docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md:369-381` (W6b, W7, W13 to W15) and `:466` (D2 replies). Only the order note at :385 was added. Update the table rows to the built text so the next writer does not restore the old lines.

## Checks that pass

- R1 S-M1 reach: W4a and W4b gain `not done_t_julian_pc`; the lost player reaches W6b (see M2 for its text).
- R1 S-M2 order: kit, drop box, front desk, Julian's PC, Lorna and comms all sit above every optional line on both routes; only the unplug sits below them, now signposted by the tail. After a skipped door controller on the full route, or a skipped Thandiwe stop on the quick route, the player still reaches W17. Remaining exception: W6b (M2).
- R1 S-m1, D-M3, D-M4: W6b, W7 and the ama.ink mid-tour switch (ama.ink:68) are hidden once `done_t_unplug`; `done_t_unplug` comes from t_unplug's `onComplete.setGlobal` via the unplug mapping. The over-reach to W14 to W16 is M1.
- W7: `(not julian_lost_with_desk or julian_back)` is right; W8 needing `done_t_door_controller` is right (the PIN is only in the door controller's file). W7's wording matches plan:320 (any held office_lan session puts server_lan in reach; Julian's is the one used).
- D3 and D4 hold on every route: t_julian_pc is required and both ways in (Copy then keyring, or Desktop Connect) use the saved connection from the front desk; the partner door has no reachable key (plan:190, 556).
- D5 by driver: unplugged through the box gives D5a (plus the add-on when implant, Staff Wi-Fi or Yasmin is done); lost and not back gives D5c; desk-held gives D5b; lost, back through the box and unplugged gives D5a. The fallback is unreachable because `wrap_open()` requires `done_t_julian_pc`.
- Ama `koImmune: true` replaces `taskOnKO`; the engine reads it from the NPC record (npc-hostile.js:317-328, player-combat.js:437, test bridge :1713), the same form m09 and m10 use. t_debrief can now complete only through the debrief tags.
- The P5a and P4 follow-ups are removed cleanly: no `targetKnot` points at a deleted knot, and the header comment's knot list matches.
- Credits line (scenario.json.erb:277) is accurate to plan:286 and facilities.txt (:320-325).
- New lines: no em or en dashes, UK spelling, no `{var}` in spoken lines, Ama's in-person lines read as plain London and southern English (no "keep you right"); TTS-ready apart from m2's repeat. loopcheck clean on both files.
