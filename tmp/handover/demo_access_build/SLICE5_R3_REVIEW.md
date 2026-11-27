# Slice 5 R3 delta review: demo_access_tour (structure and dialogue)

Scope: the R2 fixes, `git diff fb3ca4751 af843e03e -- scenarios/demo_access_tour/ink docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md`. Files were read at 71159cc50, and line numbers are at that commit. Nothing was edited. Runtime evidence: an inkjs driver (public/break_escape/assets/vendor/ink.js) on scratch copies of ama_phone.json and ama.json. It asked `where_next` step by step, carrying `told_skip` across asks, under these sets: fresh, short, full, full unplugged before the AP, lost via Desktop Connect (before and after Lorna), lost via Copy, lost on the short route, desk-held, all done, and stuck at Yasmin with four repeat asks. It also ran Ama's briefing, mid-tour hub, D2 and recap under five sets. The compiled JSON contains every new line (grep), so it matches the .ink.

Counts: B0 / M1 / m3 / n4

## Findings

### M1. The skip line is used up on W7 and W8, so the required unplug has no signpost through the stops where the full route stalls
`scenarios/demo_access_tour/ink/ama_phone.ink:116-119` (with W7 to W16, :74-108)

Brief item "no required step is hidden by an optional one": this does not hold in practice on the full route. W17 (the required unplug) still sits below every full-route optional line, and the only pointer to it is the skip line. R2 m1's cap of two is now spent on the first two asks after the comms cupboard. In the driver's full walk these were W7 (door controller) and W8 (server room), both at told_skip 1 and 2. From W11 onwards the phone never mentions the box again until all six optional stops are done. Those later stops are the ones that wait on NPC timing: W11 (Thandiwe gets up), W12 (Yasmin and the coffee rota) and W15 (Thandiwe's laptop joins the copy). Driver case "stuck at Yasmin": four asks in a row give the same W12 line with no way forward. Each optional line also hides every later one, so the presenter cannot learn about W13 to W16 from the phone either. In a live demo, a stalled NPC leaves the phone repeating one line to the room.

Fix: drop the fixed cap. Say the skip line the first time a tail line comes up, and again whenever the player asks twice at the same stop, because that is the "stuck" signal. Both variables stay bounded scalars:
```
VAR told_skip = false
VAR last_w = 0
...
=== where_next ===
~ temp tail = false
~ temp w = 0
{
...
- tour_full and julian_lost_with_desk and ... has_julian_rdp:
    ...
    ~ tail = true
    ~ w = 6
...   (W6b second variant w = 6, W7 w = 7, W8 w = 8, W11 w = 11, W12 w = 12, W13 both w = 13, W14 both w = 14, W16 w = 16)
- tour_full and not done_t_capture_key:
    ...   (unchanged text)
    ~ w = 15
...
}
{ not done_t_unplug and w > 0 and ((tail and not told_skip) or w == last_w):
    ~ told_skip = true
    Skip any of that you like, and pull the box out when you're ready.
}
~ last_w = w
-> hub
```
W15 gets `w` but not `tail`, so its first answer stays clean (R2 m1's double box mention) and a repeat ask at W15 does give the skip line. The skip line then comes back only when the player is stuck, and never on a walk where every stop goes through first time. Update plan:385 to match ("shows on the first optional answer, and again on a repeat ask at the same stop").

### m1. W6b's Copy variant says "it'll go through the box this time" to a player who may still be signed in at the front desk
`scenarios/demo_access_tour/ink/ama_phone.ink:66-69`

The keyring prefers a desk route to the box. connectRoute (keyring.js:75-86) returns a `from` route whenever the server offers one, and _connect opens through it (keyring.js:630-641). So a player still signed in at reception_pc reconnects through the desk again, not through the box. Driver case "lost via Desktop Connect, Lorna done": the phone gives the second variant, "sign in there, copy his connection file, sign out, then connect from your keyring". The moment the player copies the file, `has_julian_rdp` becomes true and the next ask switches to the first variant. They have not signed out yet, and that variant drops the sign-out step. A presenter who checks the phone between steps is told to connect now, and the session goes through the desk again. The fallout is small (`julian_back` becomes true, W7 still works, and D5b reads correctly), but the line states a route that is false for that player. The same applies to a Copy player who signed back in at the desk for any reason. `front_desk_signed_out` latches, so the ink cannot tell.
Rewrite (no match in scenarios/):
```
    Julian's session went when you signed out at the front desk.
    Sign out there if you're back on it, then connect from your keyring. It goes through the box that way, and you'll need it for the door controller.
```

### m2. The plan still carries old lines outside the W table, including the "keep you right" line that was taken out of the ink
`docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md:451-471, 413, 417-418, 363-382`

R2 n4 asked for the tables to match the build. The W table and the D2 row now do, but section 2.13 and the 2.10 timed texts do not:
- M1 (plan:459) "Not done yet. Your phone's got the list. I'll be here." The built line is "Still going? Your phone will tell you where next." (ama.ink:66).
- M2 reply (plan:460) "Go on then. Your phone will keep you right." The built line is "Go on then. Ask your phone where next." (ama.ink:70). "Keep you right" is the Scots phrase that earlier rounds removed from Ama, and a writer copying from the plan would put it back.
- A3b, A5, D3, D4, the D5a add-on ("The desks you'd sat at stayed signed in.") and D5b differ from ama.ink:41, 47, 104, 105, 110 and 115. The full-route reply "The full walk-round, then. Most people only see half of it." (ama.ink:55) has no row.
- P0 (plan:413) still says "Before you use that: sign out of Delphine's PC. Leave no trace." The built text is "Before you use that, sign out of Delphine's PC." (scenario.json.erb:579). P4 and P5a (plan:417-418) still name `hint_patch_panel` and `debrief_ready`, which do not exist. The built mappings send no targetKnot (scenario.json.erb:586-591).
- The W table rows are not in built order: W7 and W8 sit above W9 and W10, although the text above the table says "in this order (first unmet wins)". The W4 and W8 conditions also leave out `not done_t_julian_pc` and `done_t_door_controller`, which only appear in the note at :385.

Fix: copy the built text into 2.13 and the P0, P4 and P5a rows. Reorder the W rows to W1 to W6, W9, W10, W6b, W7, W8, W11 to W19, and put the extra W4 and W8 conditions in their rows.

### m3. Picking the mid-tour switch gives two "phone, where next" lines back to back
`scenarios/demo_access_tour/ink/ama.ink:66, 70`

R2 m3 changed M1 to "Still going? Your phone will tell you where next." A short-route player who then picks "Actually, show me the full walk-round." hears "Go on then. Ask your phone where next." straight after it (driver, mid-tour hub). Ama says the same thing twice in one exchange, aloud.
Rewrite of the switch reply (no match in scenarios/): `Ama Owusu: Go on then. There's plenty more to see.`

## Notes

### n1. `told_skip` cannot grow player_state
`ama_phone.ink:17, 116-117`. It is NPC-local (not in globalVariables, scenario.json.erb:132-163). It is exported as a plain scalar per NPC (npc-conversation-state.js:243-262) and is sent only when it changes. The guard `told_skip < 2` stops it at 2 (driver: it stays at 2 over every later ask). The M1 rewrite keeps the same property, with a boolean and an int between 0 and 16.

### n2. Ama says "I'll be in reception" while standing in reception
`ama.ink:94`. Ama is placed in reception (scenario.json.erb:293, 516), so "Have a proper look. I'll be in reception when you're done." sounds as if she is leaving. This is cosmetic, but the room will hear it.
Rewrite (no match in scenarios/): `Ama Owusu: Have a proper look. I'll be right here when you're done.`

### n3. The phone opener and the "Thanks." reply both say "any time"
`ama_phone.ink:35, 42`. "Ask me where next any time." is followed by "Any time." if the player taps Thanks.
Rewrite of the opener (no match in scenarios/): `Ask me where next when you need it.`

### n4. A dropped julian.rdp leaves `has_julian_rdp` true and the keyring empty
`scenario.json.erb:332, 336`. The file is `droppable`, and `onPickup` latches the global. A player who copies the file and then drops it is sent to an empty keyring by W6 and by W6b's first variant. This predates R2 and is unlikely in a demo. No change.

## Checks that pass

- R2 M1 (Wi-Fi hints after the unplug): resolved. Driver case "full unplugged before AP": after the unplug the phone gives W14a, then W14b, W15 with the box-out line "If she doesn't, carry on to the comms cupboard and come back." (no skip line), W16 and W18. W6b and W7 alone are hidden after the unplug. ama.ink:96's look-round reply agrees.
- R2 M2 (W6b): resolved. W6b sits below W10 and above W7, so Lorna and the comms cupboard are never hidden. Driver case "lost DC, before Lorna": the phone gives W9. With the comms cupboard done it gives W6b. "Lost via Copy" gets the keyring variant. The scenario objects that the Desktop Connect variant names all exist and do what it says: reception_pc is a login PC that the player has already signed in to with Delphine's sticky note (scenario.json.erb:273, 303-320). julian_rdp_file is on its desktop and is `takeable` with `onPickup` setting `has_julian_rdp` (:329-336). The credential is `saved_connection` with `proof: held` (:123-128). Signing out first leaves only the box foothold route, so the keyring connects through the box. The `pc_signed_in:julian_pc` mapping then sets `julian_back` (:553-554), and W7 takes over (driver). P0 does not fire on the re-copy, because `skipIfGlobal: done_t_julian_pc` holds (:578-579). The one wording gap is m1.
- R2 m1 (tail): implemented as specified, with the cap at two and none on W15. The outcome is M1.
- R2 m2, m3 and n3: the new lines are in place. The full-route briefing now reads A4, "Most people only see half of it.", then the phone opener, with no triple phone pointer.
- R2 m4 (W13): the split is right. On the desk-held route (`front_desk_signed_out` false) the phone gives "Back to the front desk. See what Delphine's USB ports will take." (driver). Every route that signs out gets "Sign in again". The implant needs a session at reception_pc (`needsSession`, scenario.json.erb:457), so the instruction is accurate. A player who signed out and then signed back in hears "Sign in again" while already signed in, which is cosmetic.
- R2 n2: hint_open_session says "she". It follows P1, which is about Thandiwe.
- Short route: W9, W10, then W11 (with the skip line twice), then W17 and W19. No full-route line leaks into it. A player lost on the short route gets W11 and is not sent back to Julian. All done gives W19.
- D2 and the recap by driver: the full-route reply reads as planned. D5a with the implant gives the new add-on. Lost gives D5c, and desk-held gives D5b.
- Dialogue bar for the new lines: no em or en dashes, UK spelling throughout. Ama's in-person lines ("Most people only see half of it.", "Have a proper look...", "Still going?...", "Anything you'd reached another way didn't need the box.") are plain London and southern English, with no regionalisms from elsewhere. They contain no `{var}` or inline direction, so they are TTS-ready. Every new line was grepped across scenarios/ and matched only its own file. Security accuracy, checked against the plan and the scenario only: W15 (a laptop joining the copied SSID), W13 (USB ports at the front desk) and the D5a add-on (the implant and the Yasmin and Staff Wi-Fi footholds do not run through meeting_jack) are accurate. The W6b keyring claim is m1.
- Plan W table and note (plan:363-385): the text of W5, W6b, W7, W10, W13, W14 and W15, the skip-line note, "only W6b and W7 hidden" and the julian_back note all match the ink. The remaining drift is in m2.
