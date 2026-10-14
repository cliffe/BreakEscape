# core_10 game design: Tailgate

## Concept

The module is built as a mirror. In the first half the player sees the building through the eyes of Jo Fairweather, an ethical social engineer whom Larkspur's facilities team has hired to test the place, on an authorised "Red Team Day". In the second half, the next day, the player works the building as themselves, covering reception with Maureen and walking the floor with Precious, and meets the same kinds of weakness Jo exploited, now as things to put right. Seeing how easily Jo gets in makes the small defences feel worth doing, and seeing them work the next day makes the point that security here is ordinary, social and within everyone's reach.

The hook puts the player on the receiving end before they know a test is on. They arrive at the propped side door by the smoking shelter, and a cheerful stranger balancing two coffees and a box asks them to grab the door, "my badge is in my pocket somewhere". Whatever the player does is the baseline. Then the stranger introduces herself: Jo, from Northlight Security, hired by facilities, and she has a signed authorisation letter. "You just let me in. Fancy seeing how the rest of my morning would have gone?" The player steps into her shoes for Red Team Day.

## Setting and cast

- **Rooms:** `room_reception` (badge gate, visitor desk), `room_office` (desks, screens, printer, a whiteboard), `room_break` (canteen, where a badge is left on a table), `room_servers` (the comms room the "inspector" wants), and a small new exterior area for the car park and smoking-shelter side door (shared with core_02 and core_13). `room_security` for the debrief.
- **Jo Fairweather** (ethical social engineer, Northlight Security) leads the attacker view. Authorised test only; she carries and shows her authorisation; she ends every step with what would have stopped her; nothing she does is explained as a how-to.
- **Precious Adeyemi** (Facilities and Building Security Manager, wheelchair user) leads the defender half: badges, visitors, secure areas, clear desk, doors.
- **Maureen Gallagher** (receptionist) covers the desk with the player and models the friendly challenge.
- **Ama Owusu** (mentor) gives the key messages and the reporting route at the end.
- **Kev Sutcliffe** (warehouse supervisor) appears briefly: his team keep propping the side door, and he is sharp about people even though he distrusts computers.
- **New minor character (voice and generic sprite only):** a visitor who claims to be a fire safety inspector; generic contractor sprite.

## Structure

The critical path is marked **(CP)**. Everything else is optional depth.

### 1. Hook: "Could you grab the door?" (1 to 2 minutes)

- **(CP)** The player walks up to the propped side door by the smoking shelter. A stranger with two coffees and a box: *"Oh brilliant, could you grab that for me? Badge is in my pocket somewhere."*
- The player can hold the door, challenge gently ("Can I help? I'll walk you round to reception"), say the door should not be propped, or go and tell someone. The first action is the **baseline** for C10-LO1.
- However they respond, Jo reveals herself: *"Jo Fairweather, Northlight Security. Your facilities team hired me. Here's my letter. You just let me in, by the way, or nearly. Want to see the rest?"* Warm, not a gotcha. If the player challenged her, she grins: *"See, that's all it takes. One of those and I'm done."*
- Into Learn.

### 2. Learn: "Red Team Day" (3 to 4 minutes)

- **(CP)** The player role-switches to shadow Jo (BE-11, EX-06). Three short, light steps, each ending with Jo naming the defence. Kept fun, not a heist.
  1. **Tailgate in.** Walk through the propped side door behind a group coming back from a break. Jo: *"Nobody badges a door that's already open. A wedge like that undoes the whole lock."* (The defence: do not prop the door; everyone badges in.)
  2. **The badge on the table.** In the canteen, a staff badge sits by a cold coffee while its owner is at the counter. Jo reads it with the RFID tool (`rfid` clone mode, EM4100 or weak-defaults, instant and easy, as in m03). Jo: *"I didn't take it. I didn't need to. Don't leave your badge lying about, and tell facilities the second you lose one."* (The defence: keep your badge on you; report a loss.)
  3. **The simple cabinet.** A small unlocked-looking cabinet in a quiet corner; Jo picks it (`lockpicking`, difficulty `easy`, 3 pins) in a few seconds. Jo: *"Cheap lock, no clear desk, nobody about. A proper lock and a tidy desk and I've got nothing."* (The defence: lock things away, clear the desk.)
- Jo's running list, "What would have stopped me", builds on screen as she goes. It becomes the debrief checklist.
- The player switches back to themselves. Ama meets them: *"Tomorrow you're on the other side of that. Let's see if we can give Jo a worse day."*
- **Skip:** experienced players can fast-forward Jo's narration; the "what would have stopped me" list still shows.

### 3. Practise: "Spot the way in" (2 to 3 minutes)

- **(CP)** A spot-the-risk drill (BE-10) in one scene, the open-plan office at lunchtime. The player marks the risks: a propped fire door, a badge left on a desk, two unlocked screens, a confidential printout in the tray, a whiteboard with a client's name and a go-live date, an unlocked cabinet, a visitor with no escort. Each mark gives one line of feedback and the fix. A found-and-missed summary at the end, no timer by default (BE-04 can add one as an option).

### 4. Apply: "Covering the floor" (5 to 6 minutes)

- **(CP)** The next day. Precious: *"Cover reception with Maureen for the morning, then walk the floor with me. If something's not right, you don't have to tackle it; just help, or tell me."* A light work task bar (BE-18): **Welcome the day's visitors and do a floor walk.** The day's expected-visitors list is on the desk (a `notes` document).
- Moments arrive as interruptions (BE-18), drawn from the bank (BE-13). Each is a decision; none can fail the task.

| Moment | What happens | What it tests | Best response |
|---|---|---|---|
| **The tailgater** | Someone slips in behind a badge-holder at the gate and heads for the stairs. | A friendly challenge | "Can I help you find someone? I'll walk you to reception." Escort or report |
| **The unescorted visitor** | A signed-in visitor is wandering the corridor alone. | The escort rule | Walk them back to their host or reception; mention it to Precious |
| **The "fire safety inspector"** | A visitor wants into the comms room "for the annual check". MG-25: his work order and ID do not match the day's list or the service contract. | Verify a contractor before access | Check the list and contract, do not grant access, escort to reception, report |
| **Unlocked screens** | Two empty desks with screens left unlocked. | Clear screen | Lock them (BE-10 action); a word to the owners later |
| **Confidential printout** | A customer list sits in the printer tray. | Clear desk and printing | Collect it, hand it back or secure it (points to core_06) |
| **The lost badge** | A colleague cannot find their badge and asks to borrow the player's "just for today". | Badge rules | Say no kindly, help them report it and get a temporary pass |
| **The propped fire door** | The side door is wedged again with a fire extinguisher. | Fire doors | Unprop it and report it; Kev admits his team did it and agrees to stop |

- **MG-25 Document inspector** carries the inspector moment: the player compares the work order and ID against the expected-visitors list and the maintenance contract and marks the mismatches (wrong firm name, a date that does not match, no entry on today's list).
- **Optional terminal-tampering beat** (where the organisation takes card payments): the reception card reader has an odd extra attachment; the player reports it and does not use it (PCI DSS 9.5.1.3). Light and skippable.
- **Consequences** (no blame):
  - Each good challenge or fix gets a quiet "nice one" from Precious or Maureen, and a note of what it prevented.
  - If the "inspector" is let through unchallenged, a short time skip (BE-16) shows him alone in the comms room with a phone out; Precious catches it on CCTV and the debrief explains, without blaming the player, what a challenge would have changed.
  - If the player lends their badge, the debrief shows the access record now points at them for someone else's movements.
- **(CP)** The morning ends with a clear-desk sweep of the player's own area before they leave (BE-10), tying the habit back to the player's own desk.

### 5. Debrief (2 minutes)

- **(CP)** The debrief screen (BE-02), then Precious and Jo.
- Jo's "What would have stopped me" list from Red Team Day is shown again, with each item now ticked or crossed by what the player did the next day: the propped door (unpropped or not), the badge (reported or lent), the cabinet and desk (cleared or not), the challenge (made or missed).
- Each moment replayed: what it was, the clue, what the player did, the fix.
- The hook (holding the door) and its counterpart (the tailgater at the gate) shown as before and after.
- Per-outcome results: Secure, Developing, Not yet.
- **The line to remember:** *"If you don't know them, help them: 'Can I help you find someone? I'll walk you to reception.'"*

### 6. Check (2 minutes)

- **(CP)** Precious's spot check on The Lark (MG-20): six items from the bank in `assessment.md`, at least one per learning outcome.

### 7. Reference

- **(CP)** The Lark reference card (BE-09): challenge, badge, clear desk and screen, doors, report, with the organisation's own badge rule, reporting route and secure areas (BE-05).

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| Hook: the propped door | Hold it / challenge gently / say it should not be propped and report | LO1, LO5 (baseline) | Jo reveals the test; a challenge earns her "that's all it takes" |
| The tailgater | Challenge and escort / report to Precious / let them go | LO1 | A "nice one" and what it prevented; or they reach the stairs and the debrief notes it |
| The inspector | Verify and refuse, escort, report / grant access / send away rudely | LO2, LO6 | Caught at reception; or the comms-room time skip |
| Unlocked screens | Lock them / leave them | LO4 | Locked and noted; or the debrief shows what was on show |
| The lost badge | Say no and help report it / lend the badge | LO3 | A temporary pass sorted; or the access record points at the player |
| The propped fire door | Unprop and report / leave it | LO5 | Kev agrees to stop; or the fire-risk note in the debrief |
| Clear-desk sweep | Secure everything / miss items | LO4 | Found-and-missed summary |

No option shames the player. Missing a challenge leads to a calm "here is what that let through", never a telling-off, and a colleague who admits a slip (Kev, the badge-loser) is thanked for saying so.

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| `rfid` | existing | Red Team Day: Jo reads a badge left on the canteen table (clone mode, EM4100 or `MIFARE_Classic_Weak_Defaults`, instant and easy). The lesson is "don't leave your badge lying around", not the mechanics |
| `lockpicking` | existing | Red Team Day: a simple cabinet, difficulty `easy` (3 pins). Kept quick and light |
| `pin` | existing | Optional: a shoulder-surfed door code the player is asked not to share or reuse |
| **MG-25 Document inspector** | new | The "fire safety inspector": compare work order and ID with the expected-visitors list and the contract, mark the mismatches |
| **BE-10 Spot-the-risk** | new (feature) | "Spot the way in" drill and the final clear-desk sweep |
| **MG-20 Knowledge check** | new | The final spot check |
| `person-chat` | existing | Jo, Precious, Maureen, Ama, Kev, the inspector |
| `notes` / `text-file` | existing | The expected-visitors list, the maintenance contract, the "Do not prop doors" notice |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| Red Team Day | Jo (EX-06, BE-11) | 3 to 4 minutes across three steps | The propped door; the badge on the table; the cabinet; the "what would have stopped me" list | none (assessed in Apply) |
| Badges, doors and desks | Precious (EX-01) | 60 seconds | A badge (inside and outside); a locked screen; a wedged fire door with a red cross | "A visitor wants into the comms room: what do you check?" |
| The friendly challenge | Maureen (EX-01) | 30 seconds | The model line on screen | none |
| Report and no blame | Ama (EX-01) | 30 seconds | The reporting route | none |

## Debrief

Shown on BE-02, then spoken by Precious and Jo:

1. Jo's "what would have stopped me" list, ticked or crossed by the player's day.
2. Each moment: what it was, the clue, what the player did, the fix.
3. The hook (held door) against the tailgater, as before and after.
4. Per-outcome results and the line to remember.

## Variants

- **Micro-drill:** "Clear the Floor" (BE-07, BE-10): one office scene, find and fix the physical risks against an optional timer, a new layout each month. About 3 to 4 minutes.
- **Text route:** Red Team Day as narrated choices (hold the door or not, and so on); the Apply moments as described situations with the same decisions; the spot-the-risk scenes as a list of items to mark. Same debrief (BE-03).
- **Facilitated session:** the floor walk on a shared screen; the team decides each moment. Pause points: after the hook ("Would you have held the door? What would you actually say?"), after Red Team Day ("Which of Jo's three would work here right now?"), after the inspector ("Who in this room has let a contractor past without checking?"). About 40 minutes.
- **Replay and randomisation:** the bank varies which moments appear and in what order, the inspector's firm and paperwork change per game, and the spot-the-risk layouts are drawn from a set, so colleagues cannot pass on answers.

## Alternative concepts

1. **The Walkthrough (Jo narrates a report).** Instead of shadowing Jo live, the player reviews Jo's written test report after the fact, clip by clip, and for each clip chooses the fix, then applies the fixes the next day. Lighter to build (no role switch), but less fun than being in Jo's shoes.
2. **Reception for a day.** The whole module is the reception desk: a queue of arrivals (visitors, contractors, deliveries, a tailgater, a colleague who forgot their badge), each verified with MG-25 and the expected-visitors list. A tighter, role_06-flavoured take that drills verification hard, at the cost of the clear-desk and secure-area material.
3. **Two buildings (compare).** The player tours a well-run site and a sloppy one and marks the differences (propped doors, badges on show, screens unlocked), then fixes the sloppy one. Good for a facilitated "what does good look like?" discussion, but thinner on decisions under pressure.

## Art and audio

- **Rooms:** existing reception, office, canteen, comms room and security office, plus a small new exterior set for the car park and smoking shelter (shared with core_02 and core_13). The exterior set is the main new art; propose it as one tile set.
- **Characters:** Jo, Precious, Maureen, Ama and Kev need their own art (shared across modules). Precious is a wheelchair user, 40s, Black British (Nigerian heritage); her desk and the routes must suit that (an accessibility point the art and room layout should respect). The inspector is a generic contractor sprite.
- **New UI art:** MG-25 the document inspector (work order, ID, list side by side with "mark the mismatch"); the spot-the-risk markers and summary.
- **Voice:** about 25 lines for Jo, 20 for Precious, 10 for Maureen, 8 for Ama, a few for Kev and the inspector. No voiced line prints a variable: the "what it prevented" counts and the inspector's details are on-screen text. Jo's Red Team Day narration is a fixed, non-instructional script.

## Pitfalls

- **Keep the attacker view light and non-instructional.** Red Team Day shows how little Jo needs and always names the defence; it never teaches how to clone a card or pick a lock beyond the existing game mechanics. Jo's authorisation is shown, every time, so the frame is "authorised test", never "how to break in".
- **Do not make challenging feel aggressive.** The model line is friendly and offers help. Reward the polite version; never punish a player for checking; make clear that reporting instead of confronting is fine.
- **No blame and no gotcha.** A missed challenge leads to "here is what that let through", not a score drop presented as failure. Kev and the badge-loser are likeable people who own their slips.
- **Respect accessibility in the fiction and the art.** Precious leads the module from a wheelchair; routes, desks and the reception layout must work for her, which is itself a quiet inclusion message.
- **Mind the boundaries.** Phone and text pretexting is core_02; printing and disposal detail is core_06; devices off-site are core_09; the badge-cloning point stays at "don't leave it lying around", not a cloning tutorial.
- **Keep the RFID and lockpicking fun.** Easy settings, quick wins, used to make a teaching point, never as a difficulty wall (the standing rule: minigames should be fun and educational, not hard).
