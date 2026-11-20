# Slice 5 dialogue review (npc-dialog-review)

Commit reviewed: e82f7079b (ink from 4b882dc59). Scope: Ama in person (A1 to A5, route replies, M1, M2, D1 to D6, written_up), Ama on the phone (start, W1 to W19, follow-up knots), timed texts P0 to P5b, Lorna's intro fix.

**Counts: B 0 / M 7 / m 14 / n 4**

## Step 1: compile, validator, lint, runtime

- inklecate on all seven files (compiled to a scratch folder): no errors and no loose-end warnings.
- validate_scenario.rb with `--skip-ink --no-graph`: 0 errors, 11 warnings. None of the warnings is about dialogue (pinned-object spacing, needs targets in the kitchen, access-model notes, plant LED emitter).
- dialoguelint: clean (ama.ink max 30 words, ama_phone.ink max 25, timed texts max 24). tagdiff: structure unchanged.
- loopcheck: ama.json @ start with fresh state, with tour_full, with all eight required done_ flags, and with met + julian_ended_by_unplug + tour_full; ama_phone.json @ start with and without tour_full. No runtime errors and no starved knots. The debrief reaches a clean END as intended.
- No em or en dashes. No US spellings. No `{var}` in a spoken line. No inline stage directions. Every tag sits on its own line.

## Findings

### Major

**M1. The route choice gives the player nothing to choose on.** `scenarios/demo_access_tour/ink/ama.ink:44`
> Ama Owusu: The quick version, or the full walk-round?

This is the one choice that changes the tour's shape (phone hints, P5a or P5b, the D2 reply, D5a). A colleague watching the demo cannot tell what either option means. The plan has the numbers (about 15 and 35 minutes).
Rewrite: `Ama Owusu: The quick version's about fifteen minutes. The full walk-round is nearer forty, every room and every gadget. Which?`
Then the full reply can drop its repeat: `Ama Owusu: The full walk-round, then. Your phone will tell you where next.` (ama.ink:52)

**M2. D4 claims the box route on every path, which contradicts D5b and D5c.** `ama.ink:102`
> Ama Owusu: The box got you onto the network, and Julian's saved connection did the rest. His door never came into it.

On the D5c route (Connect from Delphine's desktop) and the D5b route (connected from a held desk), the box never carried Julian's session. Ama then says the opposite two lines later.
Rewrite: `Ama Owusu: A saved connection on the front desk got you into Julian's PC. His door never came into it.`

**M3. The mid-tour switch to the full route is still offered after the unplug.** `ama.ink:65`
> + { not tour_full } [Actually, show me the full walk-round.]

Plan 2.12 step 5 says there is no mid-tour switch after the unplug. A quick-route player who has pulled the box but not yet done, say, the comms cupboard can still switch. The phone then sends them to W7 ("Open the network view at the box") with the box in their bag.
Fix: `+ { not tour_full and not done_t_unplug } [Actually, show me the full walk-round.]`

**M4. W6b and W7 go stale once the box is out (full route).** `ama_phone.ink:59-63`
> Connect again from your keyring and it'll go through the box this time, or carry on to Lorna.
> With Julian's session up, the box can see further. Open the network view at the box and try the door controller, with Lorna's password.

The player can unplug at any point, and W15 even invites it. After that, both lines send the player to a box that is not in the wall (2i, stale status answers).
Fix: add a branch above W6b:
```
- tour_full and done_t_unplug and not done_t_door_controller:
    The box is out, so the door controller's out of reach. Plug it back in and reconnect to Julian if you want it.
```

**M5. The quick-route look-round reply is wrong about the network stops.** `ama.ink:93`
> Ama Owusu: The box is out, so the network stops are done for today. The doors and desks are all still there if you want them.

The implant, the rogue AP, Staff Wi-Fi and the guest port do not need the box in the meeting-room jack, and the guest port needs it out. The ending-check panel will list them as open tasks right after Ama says they are closed.
Rewrite: `Ama Owusu: Go on. The box is out, so anything that needed it in the wall is done for today. The rest is still there.`

**M6. W13 leaves out signing back in at the front desk.** `ama_phone.ink:75`
> Back to the front desk. Delphine's PC has a spare USB port or two.

The player signed out at stop 5 (W5 told them to). Stop 14 needs a keyboard session on reception_pc again, and the implant's foothold depends on it (plan 2.7, stop 7 note).
Rewrite: `Back to the front desk. Sign in again, then see what Delphine's USB ports will take.`

**M7. W14 does not change after the AP is planted.** `ama_phone.ink:77`
> The plants in reception have room for one more gadget.

The line holds until `staff_twin_up`, which the console sets, not the planting. A player who has planted the AP and asks "Where next?" gets the same line again. "One more" also suggests something is already hidden there.
Rewrite: `Hide the access point in one of the reception plants, then open its console and copy the Staff Wi-Fi.`

### Minor

**m1. A3b promises the cake works.** `ama.ink:38`
> Ama Owusu: And there's a cake in your bag. Put it down in the open plan when you want people away from their desks.

Plan 2.6: the cake is best effort, and the tour "says plainly that the cake may or may not move her". The rota board is the sure lever.
Rewrite: `Ama Owusu: And there's a cake in your bag. Put it down in the open plan and see if it gets anyone away from their desk.`

**m2. "Leave no trace" gives the wrong reason, and W5 and P0 say the same thing.** `ama_phone.ink:56`; `scenario.json.erb:577`
> Sign out of Delphine's PC before you use that file. Leave no trace.
> Before you use that: sign out of Delphine's PC. Leave no trace.

Signing out does not remove the sign-in from the record. The real reason is the route (a held desk session makes the keyring use the desk), and only hint_sign_out says so. P0 followed by W5 also reads as the same text twice.
Rewrite W5: `Sign out of Delphine's PC before you use that file, so the connection has to go through the box.`
Rewrite P0: `Before you use that, sign out of Delphine's PC.` (hint_sign_out then supplies the why).

**m3. W7 says the box can see further, when the reach comes through Julian's PC.** `ama_phone.ink:63`
The validator's link reach shows the pivot as office_lan to server_lan through the office hosts. The box's own view is unchanged. The player also has no pointer to where Lorna's password came from.
Rewrite: `With Julian's session up, his PC can reach the server network. Open the network view at the box and try the door controller with Lorna's password from facilities.txt.`

**m4. W10 calls the copy "Lorna's card".** `ama_phone.ink:69`
> Lorna's card should open the comms cupboard. Try it.

Rewrite: `Your copy of Lorna's card should open the comms cupboard. Try it.`

**m5. hint_open_session is unclear and goes against A3b.** `ama_phone.ink:101`
> The cake works too, if you want it done your way. The rota board is the sure way.

"Done your way" has no referent.
Rewrite: `The cake might do it too, if they're hungry. The rota board always works.`

**m6. W15 is muddled.** `ama_phone.ink:79`
> Give it a moment. Thandiwe's about to check her email. If she's busy, pull the box when you're ready: the Wi-Fi stops still work after.

"If she's busy, pull the box" joins two unrelated ideas. Also, while the capture is pending, W15 stays first unmet, so W18 never shows after an unplug (P5b carries it instead).
Rewrite: `Give it a moment. Thandiwe's about to check her email, and her laptop should join your copy. If she doesn't, carry on. The Wi-Fi stops still work after the box comes out.`

**m7. The same fact twice: P5a then debrief_ready.** `ama_phone.ink:117`
> (P5a) ...then come back to reception. / I'll be at reception.

Rewrite debrief_ready: `No rush. Bring the box back with you.`

**m8. The same fact twice: P4 then hint_patch_panel.** `ama_phone.ink:113`
> (P4) Try the patch panel, see where its spare port goes. / The panel has a spare port. Plug in and see where it lands.

Rewrite hint_patch_panel: `Plug in and open the network view. See what's on the other side, and what isn't.`

**m9. The phone opener repeats A4 word for word and reads oddly from Ama.** `ama_phone.ink:33` (and `ama.ink:39`)
> Your phone will list what to try next. I'll text if I think of anything.

A player who opens the thread straight after the briefing hears "I'll text if I think of anything" twice in a row. "Your phone will list" sounds wrong when Ama is the one texting on that phone.
Rewrite: `Ask me where next whenever you're stuck.`

**m10. "I'll be here" three times, and one line matches m09 word for word.** `ama.ink:39`, `ama.ink:63`, `ama.ink:91`
A4 says "I'll stay here", M1 says "I'll be here", and the full-route D2 reply "Go on. I'll be here." is identical to m09_phone_agent0x99.ink:1147. M1 as a statement ("Not done yet.") also sounds like Ama scolding.
Rewrite M1: `Ama Owusu: Still going? Your phone's got the list if you need it.`
Rewrite the D2 full reply: `Ama Owusu: Take your time. I'm not going anywhere.`

**m11. "Keep you right" doesn't match Ama's voice.** `ama.ink:67`
> Ama Owusu: Go on then. Your phone will keep you right.

"Keep you right" is a Scots and Northern idiom. Ama's existing voice (ca18 scenario.json.erb:797-799) is warm, practical London and southern English.
Rewrite: `Ama Owusu: Go on then. Ask your phone where next.`

**m12. D3's last sentence is ambiguous when spoken.** `ama.ink:101`
> ...Julian's held because nobody copied his.

Heard aloud, "Julian's held" can sound like Julian has been detained.
Rewrite: `Ama Owusu: The doors only ever checked the card. Copy Lorna's and you're Lorna, as far as the reader's concerned. Julian's door held only because nobody copied his card.`

**m13. The D5a full-route line describes things the player may not have done.** `ama.ink:107`
> Ama Owusu: The desks you'd sat at stayed signed in.

It hangs on `tour_full`, not on the player having held a desk. It also leaves out the implant and Staff Wi-Fi footholds that stop 17 shows staying up.
Fix: condition it on `done_t_implant or done_t_staff_wifi or done_t_yasmin_pc`, and rewrite as `Ama Owusu: Anything you'd reached another way stayed up.`

**m14. D5b is the fallback, so it asserts the desk route whenever the other two branches miss.** `ama.ink:112`
> Ama Owusu: Julian's session stayed up when the box came out. You'd connected from a desk you were signed in at, so it never needed the box. That's the bit people miss.

It also catches cases nobody planned for: the player signs out of Julian's PC before unplugging, or the unplug happens before Julian was ever reached through the box. It is also the longest voiced line in the slice.
Rewrite, which stays true in those cases: `Ama Owusu: Julian's session didn't go with the box. Connect from a desk you're signed in at and it never needs the box. That's the bit people miss.`

### Notes

**n1. Ama has no `voice` block yet.** For D101, reuse ca18's block for the same character (Autonoe, the London and southern English style) so she sounds the same across the course and the tour.

**n2. Wrong role in a comment.** The header comment in ama.ink:1 calls Ama "Merrin & Sallow's practice manager". The plan (2.1) and ca18 have her at Fenlow Managed IT, looking after the practice's security. It is a comment, not a spoken line, but the next writer will read it.

**n3. Outside scope: a credits line makes a wrong claim.** The credits line "Door controller: its login read off the network from the box" (scenario.json.erb, music credits) is wrong. The login came from facilities.txt, and the reach came through Julian's PC.
Suggest: `Door controller: reached through Julian's PC, signed in with Lorna's password from the front desk`.

**n4. Lorna's intro fix is correct.** Setting `hub_quiet` before the first `-> hub` (lorna.ink:13) stops "Anything I can help with?" following her intro on first meeting. The slice-2 clone choices (lorna.ink:22, 29) are stage-direction brackets rather than spoken words. They are outside this slice, so I left them.

## What works

- The route choice, the M2 switch and both D2 options all change state that is read later. None of the choices is flat.
- The P3 and hint_injector pair is accurate (a storage-class USB block does not stop a device that presents as a keyboard) and points at the next step without giving away the patter. P2, P4, W4 and W11 work the same way.
- Short, plain lines throughout. The person lines are ready for TTS once the points above are fixed.
- No line repeats another mission's line word for word, apart from m10 and stock phrases ("Good luck.", "Any time.").
