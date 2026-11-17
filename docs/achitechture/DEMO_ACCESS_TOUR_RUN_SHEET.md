# demo_access_tour: presenter run sheet

For the lecturer running the tour live. Companion to DEMO_ACCESS_TOUR_PLAN.md (design) and written from the built scenario and ink on branch build/demo-access-tour. The mission is "Demo: Access tour" (scenario `demo_access_tour`): Merrin & Sallow, a small firm, with Ama Owusu of Fenlow Managed IT at reception.

Stop 12 (Thandiwe leaving her desk): after the coffee rota she is away for about a minute (walk, brew, walk back). Go straight to her laptop once she gets up.

## 1. Setup

1. Start the tour from Hacktivity like any other Break Escape game (the event or course that lists "Demo: Access tour"), or from the standalone missions page on a local install. Start a fresh game for each class.
2. Developers testing locally: run a keyless server on a free port of your own (`tools/playtest/start-keyless-server.sh`, see AGENTS.md for ports) and make a game with `tools/playtest/new-game.rb demo_access_tour`. Nothing is voiced yet, so no TTS is needed.
3. One game per run. Do not reload mid-tour if you can help it (see section 5). Make a spare game before the class so a bad run can be swapped out.
4. Screen: full-screen the browser, zoom so the pixel text reads from the back row. Close the notepad and phone overlays between stops; they cover the map.
5. Audio: nothing is voiced. Mute or ignore. Ama's lines are text only.
6. The Mission Brief pops up at the start. Dismiss it. Ama's briefing starts by itself in reception.
7. Keep Ama's phone thread in reach: inventory, phone, "Ama Owusu", "Where next?". It names the next open step. Ask it out loud at each stop that stalls. It will add "Skip any of that you like, and pull the box out when you're ready." on optional steps. That is intended.

## 2. Pick the route

Ama asks at the end of the briefing.

| Route | Time | Stops | Pick it when |
|---|---|---|---|
| Quick | about 15 min | 1, 2, 3, 5, 6, 9, 10, 11, 12, 17, 19 | a short slot, or a first look |
| Full | about 35 min | all 19 | a lab slot or a keen class |

You can change your mind. Until the box is unplugged, talk to Ama and choose "Actually, show me the full walk-round." Once the box is out, that choice is gone, because most full-route stops need the box in the wall.

Map: reception is the start. North is the open plan (desks, coffee machine). Off the open plan: server room (north), kitchen (west), comms cupboard (east). Off reception: meeting room (east, the kit), partner's office (west, never opened).

## 3. Stop tables

How to read them. "Say" is the security point, in plain words. "Ama/phone" is what the game says. "Snag" is what goes wrong and the fix.

### 3a. Quick route (11 stops, about 15 minutes)

| # | Do | Say | Ama / phone | Snag and fix |
|---|---|---|---|---|
| 1 | Let Ama brief you. Choose "Quick version." | "Someone asked for a walk-round access test. The visitor badge and a bag of kit is all we get." | "The partners want to know how far someone gets with a visitor badge and a bag of kit." Mentions the cake. Reply: "Quick it is. Doors, a desk, the box, and back to me." | Choice screen closes fast after you click. Fine. |
| 2 | Pick up the visitor card (reception sign-in table). Try the partner's office door (west): refused. Go to the meeting room (east): opens. Take the kit from the table. | "A badge opens the doors it was issued for. Julian's door is on a named list, so the visitor card does nothing there." | Door text: "Julian's office. His card only." Kit: cloner, drop box, injector, USB stick, rogue AP. | The capture tablet is not a pickup; it opens a viewer. Close it. The card is small; look on the table by Delphine. |
| 3 | Click the live wall port (`meeting_jack`) with the drop box. Confirm "Plug it in". The network view opens. | "A device on a live wall port is on the office network. No password was asked." | Phone, a few seconds later: "Box is talking. Have a look at the network view before you sign in anywhere." | Click the jack only with the box held. Without it the click is refused. |
| 5 | Reception PC. The login screen shows Delphine. Add her sticky note to the notepad, read it, type the password. Open `facilities.txt` (names Lorna's login). On `julian.rdp` choose Copy (not Connect). Start, Sign out. | "A password on a sticky note is a password anyone at the desk has." | Phone, 4 s after the copy: "Before you use that, sign out of Delphine's PC." Toast: "Lorna Easton's password is in facilities.txt." | Closing the notepad can also close the password screen; click the PC again. Choose Copy, not Connect (see section 4, off-route). |
| 6 | Open the keyring, use Julian's saved connection. Julian's PC opens as "Remote session through Drop box". Show Start, Lock. | "That connection file skipped the partner's office door. The door never came into it." | Toast: "Saved connection found: julian.rdp for Julian Sallow on MS-PARTNER-01." | If you stayed signed in at the front desk, the connection rides that desk and dies with the sign-out. Sign out first. |
| 9 | Talk to Lorna by the comms door. Choose the option that holds the cloner near her card. When the read hits 100 percent click Save (not "Abandon read"). | "Her card was copied while she stood there. The reader only checks the card number." | Toast: "Card copied: Lorna Easton FAC card is saved on your RFID cloner." Then "Just passing through, thanks." | The Save and Abandon buttons sit close. A mis-click means redo the read. The clone choice stays available if you first talk to her without the cloner. |
| 10 | Click the comms cupboard door. Choose "Emulate Lorna Easton FAC card". Walk in. Look round. | "Copy Lorna's card and you are Lorna, as far as the reader is concerned." | "Access Granted: Opened with your copy of Lorna Easton FAC card." | First click on the door opens the reader; the emulate button is its only control. |
| 11 | Open plan. Click Thandiwe's laptop while she sits. | "Her session is up on screen and she is two feet away." | Toast: "Thandiwe Moyo is using this PC." Phone: "She's signed in and sitting right there. Read the coffee rota on the wall, then try her laptop while she's away." | The first click can say "Someone's in the way." The laptop overlaps the desk and her chair. Click again in range. Engine quirk, not a fault. |
| 12 | Read the coffee rota on the wall (the reliable nudge). Watch her leave and the laptop stay signed in. Optional. | "She left a signed-in laptop. A walk to the kettle is all it took." | Phone after the first laptop click: see stop 11. | She is back in about a minute; if you miss it, read the rota again later or use the skip below. |
| 17 | Back to the meeting room. Click the drop box in the wall port and pull it. | "Pulling the box ends what ran through it. Anything reached another way stays up." | Phone, 6 s later: "Box is out. Have a last look if you like, then come back to reception." | Clicking "Unplug" in the network view pulls it at once (no confirm). The box returns to your bag. Required task. |
| 19 | Reception, talk to Ama. If she only asks "Still going?", a required step is open: ask the phone. Then "I'm done, let's talk." | See Ama's recap below. | Debrief, then the credits. | Credits end the mission. Read section 5 first. |

### 3b. Full route (19 stops, about 35 minutes)

Stops 1, 2, 3, 5, 6, 9, 10, 11, 12, 17, 19 are as in 3a (choose "The full walk-round." at stop 1; Ama replies "The full walk-round, then. Most people only see half of it."). The extras, and the extra detail at stop 6:

| # | Do | Say | Ama / phone | Snag and fix |
|---|---|---|---|---|
| 4 | After stop 3, still in the network view with only the box, try the Finance share. | "A plugged-in box gets the network, not the finance team's files." | Share shows "Needs account". No task. | Do it before any session with the role exists. After stop 6 the answer changes. |
| 6 (extra) | Full route only: from Julian's desktop open the Finance share (`q3_accounts.txt`). | "Now we are a partner, so the Finance share opens." | Start panel shows Lock. | Show the Lock button again if the class missed it. |
| 7 | With Julian's session held, open the network view at the box. A server network now lists MS-DOOR-01. Sign in with Lorna's password from `facilities.txt` (read it from the file). Open the door codes file. | "One foothold got us to a second network. The door controller trusts anyone already inside." | Phone (full route): "With Julian's session up, his PC can reach the server network." | Open the network view at the box, not from another link: the session then ends cleanly at the unplug. |
| 8 | Server room keypad (north of the open plan). Enter the code from the codes file. | "The code was in a file on a box nobody guards." | `t_server_room` completes. | Four digits auto-submit on the fourth. A mis-type costs an attempt; the keypad counts them down. Codes are random per game: read yours. |
| 13 | While both staff are away, click Yasmin's PC. It is locked but her sticky note gets you back in. | "Yasmin does the right thing and locks her screen. Her note undoes it." | Phone: "Next time Yasmin's away from her desk, have a look at her screen. The coffee rota gets people moving." | Same coffee run as stop 12; Yasmin queues behind Thandiwe. Her absence is the story, not a lock. |
| 14 | Back to reception. Sign in at the front desk keyboard again. Try the USB stick at the hub: refused. Use the injector at the implant socket. | "Storage is blocked. A keyboard is not storage, so the injector gets through." | Hub refusal is the engine's own storage line. Phone: "Storage is blocked on that hub. A keyboard isn't storage." | Sign in at the keyboard FIRST. See "Silent implant not_ready". |
| 15 | Hide the rogue AP in a reception plant, open its console, copy the Staff Wi-Fi. | "A copy of the Staff network name. Phones and laptops pick the strongest one they know." | Phone: "Hide the access point in one of the reception plants..." then "Give it a moment. Thandiwe's about to check her email. Walk into the open plan and her laptop should join your copy." | The Clone screen starts on Guest: click Staff, then Start. Thandiwe only joins once you walk into the open plan (her room has to be loaded); she joins within about 30 s of you entering. If she does not join, carry on. |
| 16 | Open the capture tablet in the meeting room. Read the Staff key. Join Staff Wi-Fi at the Staff access point in reception. Compare with open Guest Wi-Fi (it reaches nothing). | "Staff has a key and Guest has none. The twin picked up the real key anyway." | Phone: "You've got the Staff key. Join the Staff Wi-Fi and compare it with the guest one." | The Wi-Fi stops still work after the box is out. |
| 18 | Take the box to the comms cupboard. The managed port refuses it. The patch panel's spare port takes it and lands on the guest network. | "Port security knows which device belongs. The patch panel's spare port landed it on guest: nothing of the firm's." | Phone, 4 s after the refusal: "That port knows what's meant to be plugged into it. Try the patch panel, see where its spare port goes." | Only after the unplug; the box is back in your bag by then. The managed port answers "Port security: this device is not the one registered to this port." The spare port on the patch panel is G02 ("Plug it in"). |

Full order of the extras in the walk: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19. Order is free apart from the two hard rules in section 4.

## 4. Notes

### NPC-timing stops: Thandiwe and Yasmin leaving their posts (stops 12 and 13)

No required task depends on either staff member leaving. Both stops are optional.

- The sure nudge is the coffee rota board in the open plan. Reading it sets each person's caffeine need low (the code sets it to 10). They head for a coffee machine. There is one in the open plan and one in the kitchen; capacity is one, so the second queues behind the first. Rota board has a 30 second cooldown between uses.
- The cake is the soft nudge. It starts in your bag. Drop it in the open plan ("Drop here"), not elsewhere: if you drop it in another room the phone says "Take the cake through to the open plan, where the desks are." Two servings, one each. They notice it by sight. It may not move Thandiwe: a person mid-task, or one whose coffee need pulls first, will not walk over. Say that plainly.
- Waiting also works. Caffeine alone sends Thandiwe about 15 minutes in and Yasmin about 20.
- Yasmin's screen locks when she leaves; Thandiwe's does not. That contrast is the point.
- When Thandiwe returns and sits, your session on her laptop ends. Take what you need first.
- If stop 12 does not move (for example you missed the minute she was away): say "she has stayed put, which is also a result", then go on. Skip stops 12 and 13. Nothing required is lost. The phone will keep naming the unplug as the next step.

### Silent implant `not_ready` (stop 14)

If you plug the injector into the implant socket and nothing happens, you have no signed-in keyboard session at the front desk PC. The server answers `not_ready` and the client shows no message. The injector stays in your bag. Fix: sign in at the front desk keyboard first (Delphine's note again), then use the socket. Holding only the USB stick also answers `not_ready`: use the injector. Say it to the room as a feature: "the implant needs an account to ride." (An engine toast for this is on the ideas backlog.)

### Unplugging early

You can pull the box any time after stop 3. Once it is out:

- Everything that ran through the box ends: Julian's remote session and the door controller session, when the box was the route. Say that is the lesson.
- Sessions you opened another way stay: the implant, Staff Wi-Fi, and any keyboard session at a desk.
- The task `t_unplug` completes, and Ama's mid-tour switch to the full route is gone. If you planned the full route, choose it before you pull the box.
- The phone stops offering the box stops: the door controller line (W7) and Julian's recovery (W6b) disappear. The Wi-Fi stops still work. The ports at stop 18 need the box and wait for you.
- Pulling it before stop 6 means you must plant it again; you will have to carry it back.

### Off-route (what to say if it happens)

- Connect instead of Copy at stop 5, or still signed in at the front desk when you Connect at stop 6: Julian's session rides Delphine's desk. Signing out there drops it; the phone says so (full route) and Ama's debrief names it. The other way round: with that desk still held, the unplug leaves Julian's session up. Both are talking points: the box is not the only way in, and pulling it does not undo what was done from a desk. Connect again from the keyring after signing out.
- A rare case: a front-desk session that itself rode the box, with Julian connected from it, can show the "lost with the desk" wording after an unplug. The debrief takes the unplug branch first.
- Julian's door (partner's office) is never opened on either route. No card the player can get opens it.

### Hard rules of order

1. Plant the box (stop 3) before the pivot (stop 7) and Julian (stop 6).
2. Sign out of the front desk (stop 5) before the keyring Connect (stop 6), so Julian rides the box.

### Phone answers

The "Where next?" line picks the next open required step first, then optional ones on the full route. It repeats the skip line when you ask twice at the same stop. Four asks at Yasmin give the same reply. That is fine; use it as a cue to say "the rota is the lever".

## 5. The ending

- Ama opens the debrief only when the eight required tasks are done (meet Ama, kit, front desk, copy badge, comms cupboard, drop box, Julian's PC, unplug). Until then she says "Still going? Your phone will tell you where next."
- At the debrief, Ama asks "Anything else you want to try?". Choose "I'll have another look round." to go back. Choose "I'm done, let's talk." to finish.
- "I'm done, let's talk." raises the "Before the mission ends" panel, which lists every open optional task. On the quick route that list is what the full walk-round adds.
- Credits end the mission. After you click through, you cannot go back to the optional stops. Finish everything you want to show first. This is intended.
- Ama's recap names what happened: Lorna's card copy, Julian reached by a saved connection, then one of three endings: everything through the box went with it; Julian dropped when you signed out of the front desk; or Julian's session survived the unplug.
- Her last line is "Thanks. I'll write it up for the partners."
- A reload after the debrief shows Ama saying "It's all written up. Thanks again." Do not read that as a fault.
- A reload before the debrief puts you back at reception and shows the Mission Brief again. Both are intended. Reload costs you the dropped cake position and the open stops; avoid it mid-tour. (A reload check on the dropped cake was incomplete in the last live run.)
- To run it again, make a new game (section 1).

## 6. Last checks before the class

- The new game opens at reception with Ama talking.
- The phone has "Ask me where next when you need it." and answers "Where next?".
- You know which route you are on and where your spare game is.
- Stop 12: practise the rota-then-laptop timing once before the class.
