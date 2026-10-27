# core_09 game design: On the Move

## Built shape and episode mapping

This module is a **touch** in the build (`research/built_episodes_vs_plan.md` §2): the built **E6** `awareness_e6_texts_and_qr` (Tarrowby Logistics, mobile) covers phone-borne lures. The rest is delivered either as a **defend-set extension of E6 with new items** (an overlooked-screen item, an overheard-call item, a fake Wi-Fi page, a lost-device report, a home video-call item) or as a **later standalone episode** at Tarrowby. **Do not redesign the built E6 parts.**

Whichever route, it follows the built shape: a consequence half for the topics with no attacker (the overlooked screen, the overheard call) and an attack-first half for the look-alike Wi-Fi page, a flip ("through their eyes"), a scored defend half, then the built debrief view with the shared "habit to keep". It uses the built inbox-triage defender (with SMS, QR and page cards), the awareness-measure records and concept cards, has a defend-only variant, and feeds new mobile check items with mirror pairs (`assessment.md`).

The detailed "On the Move" design below is retained as the episode's content, reparented from the retired Larkspur world to Tarrowby Logistics. The on-the-road explainer is the episode host (Zainab Hussain / Chidi Okeke), not a recurring course mentor.

## Concept

Tarrowby has won the facilities contract for Wrenfield Care, a group of care homes in Haverbridge, two hours away by train. The player, an operations coordinator, goes with field engineer Zainab Hussain to survey the first home and agree the start of the infection-control cleans. That means two days with the job on a laptop and a tablet: the 07:42 train, a café between visits, a night in a hotel, and a morning call from the player's own kitchen table.

The module teaches through the people around you. Every place has bystanders who are ordinary and harmless: a student nurse in the row behind, a friendly illustrator at the next café table, a housekeeper, an eleven-year-old nephew. None of them is a villain, and that is the point: client information reaching people who have no reason to see it is the harm, whoever they are. The debrief shows the two days "through their eyes": what each of them could see and hear because of the player's choices. Alongside them sit the two things that do involve someone with bad intent, and both are handled with a habit rather than fear: a lookalike Wi-Fi network with a page that wants a work password, and a tablet left behind that needs reporting before anyone finds it.

## Setting and cast

**Places** (all four are new rooms; see Art and audio):

- **The 07:42 to Haverbridge** (`room_train_carriage`, proposed, 4x2 GU): tables of four, airline-style rows, a luggage rack, a single seat with its back to the bulkhead, vestibule doors at both ends. A second copy, "Coach C", is the practice carriage.
- **The Bean and Barrow** (`room_cafe`, proposed, 2x2 GU): a café near the client's head office, with a counter, a chalkboard showing the Wi-Fi name, four small tables, a window bar and a sofa.
- **Haverbridge Lodge, room 214** (`room_hotel`, proposed, 1x1 or 2x1 GU; a dressed `small_room_1x1gu` as the cheap option): bed, desk, wardrobe with a room safe, kettle, TV, and a "Do not disturb" hanger on the door.
- **Home** (`room_home_office`, proposed, 2x1 GU): the player's kitchen-diner, with a table desk, a whiteboard on the wall, a shelf with a smart speaker, the router on the windowsill, family photos and a small printer.

**Cast** (Tarrowby staff; the plan's names are reused as company staff, not as a single recurring workplace, and there is no recurring course mentor):

- **Zainab Hussain** (Field Service Engineer): the on-the-road explainer. Eight years of working from vans, cafés and trains, and full of practical tricks. She once left a tablet on a train herself and says so.
- **An information security colleague** (the retired recurring mentor Ama Owusu is dropped; use a Tarrowby security staff member): one chat message on the train, then on the video call from home and in the debrief.
- **Owain Jenkins** (IT Service Desk Lead): on call on the hotel night; locks and wipes the tablet.
- **Lena Fischer** (Operations Manager): sets the work by chat.
- **Kai Murray** (security analyst): a chat message if the player signs in on the fake Wi-Fi page.

**New characters:**

| Id | Name | Who | Age and look | Appears |
|---|---|---|---|---|
| `jerome_bell` | Jerome Bell | Student nurse on placement, the passenger in the row behind | 20s, Black British, earbuds round his neck, NHS lanyard tucked away, rucksack | Train (person-chat and walk sprite) |
| `bryony_walsh` | Bryony Walsh | Freelance illustrator at the next café table | 30s, white English, short purple hair, sketchbook | Café |
| `grace_mwangi` | Grace Mwangi | Estates Manager, Wrenfield Care (the client) | 50s, Black British (Kenyan heritage), glasses pushed up on her head, client lanyard | Phone call and video call |
| `ellis` | Ellis | The player's nephew, staying for half-term | 11, white and South Asian heritage, glasses, football shirt, uses a hearing aid | Home |

Extras use the generic v2 office sprites: passengers, a trolley attendant, a barista, a couple at the café, a hotel housekeeper. Names for the client, the city, the café and the hotel are fictional and need a clash check before release.

## Structure

The critical path is marked **(CP)**. Everything else is optional depth.

### 1. Hook: "The 07:42" (1.5 minutes)

- **(CP)** Title card: *Tuesday, 07:42. Train to Haverbridge.* The player boards with Zainab, who drops into a window seat at a table of four. Two seats are free: **seat A**, the aisle seat at Zainab's table, and **seat B**, a single seat with its back to the bulkhead by the luggage rack. Jerome sits in the row behind seat A, across the aisle, facing forward: his sight cone (`los`, range 140, angle 90) covers seat A's screen at an angle.
- Lena's chat arrives (`phone-chat`): *"Morning both! Wrenfield have sent the updated residents list for the infection-control cleans. Could you give the survey a once-over before you get there? Ta. L"*
- The laptop (the MG-27 work desktop, or today's `container` desktop until it exists) shows two files: **Wrenfield survey: rooms and schedule (INTERNAL)** and **Wrenfield residents: infection control notes (CONFIDENTIAL)**, which lists residents by name and room with notes such as "barrier clean". A privacy screen sits in the laptop bag (an inventory item; using it sets `privacy_screen_on`).
- **Baseline (C09-B1):** nothing tells the player what to do. If they open the Confidential file in seat A without the privacy screen, the overlooked check fires (proposed feature; until it exists, `challengeOnSight` with `requireGlobal: "confidential_on_screen"` and `skipIfGlobal: "privacy_screen_on"`). When the document view closes, Jerome leans forward:
  - Jerome: *"Sorry, not being nosy. Is that Wrenfield House? My gran's in there."*
  - Jerome: *"Is she on that list? What's a barrier clean?"*
  - The player chooses a reply: *"Sorry, I can't talk about that."* (right, and recorded) or *"It's just for the cleaning rota."* (says more than it should).
- If the player opens only the Internal file, sits in seat B, or uses the privacy screen first, Jerome stays in his music and Zainab notices.

### 2. Learn: "Zainab's road rules" (2 minutes)

- **(CP)** Zainab across the table (EX-01, `person-chat` with the train background). Her opening depends on the hook:
  - Seen: *"Don't worry. I did exactly that on this train, years ago. Here's what I do now."*
  - Not seen: *"You saved the residents list for later. Good instinct. Here's the rest."*
- Four rules, about 25 seconds each, with a visual aid each (BE-08):
  1. **Screens.** The proposed sight-line toggle shows the real cones in the carriage for ten seconds. *"That's what he could see. Back to a wall, privacy screen on, Confidential waits. Look away, lock it."*
  2. **Voices.** A speech bubble over the carriage. *"On the phone in public: no names, no codes, no addresses. 'I'll call you back' is a full sentence."*
  3. **Networks.** Two Wi-Fi pages side by side: one asks you to accept terms, one asks for your work email and password. *"Ask staff for the network's name. Wait for the padlock. If a Wi-Fi page wants your password, it isn't the café. Use your hotspot."*
  4. **Devices.** *"It's with you, or it's locked away. Look round before you leave. Lose something? Ring the service desk straight away. Any hour."*
- Ama's chat message follows, as on-screen text: *"Zainab's right about lost devices. Ring the service desk any time, day or night. Nobody's ever in trouble for reporting one. A."* The organisation's number appears with it (BE-05).
- Check question (MG-20 hotspot on the carriage diagram, opened from Zainab's conversation with `#trigger_minigame:knowledge_check|c09_q_safe_seat`, BE-19): *"Where could you open the residents list without anyone reading it?"*
- **Skip:** *"I'm on trains all the time."* Zainab: *"Then this'll be quick."* Straight to the check question; a wrong answer brings the rules back.
- **Optional topics** in Zainab's hub, each under a minute: *"Can I charge my phone on the train?"* (your own plug; say no if it asks to trust a device), *"The train Wi-Fi wants me to sign in"* (accept the terms, nothing more), *"Before you travel"* (a 30-second device check in MG-23: screen lock, find my device, updates waiting).

### 3. Practise: "Who's Watching?" (2.5 minutes)

- **(CP)** Zainab: *"Coach C's got the free seats. Let's play a game."* Three short rounds with instant feedback; Zainab comments in one line each.
- **Round 1, "Find a seat"** (sight cones). Coach C has five passengers whose cones are visible (`los.visualize: true`) and a trolley attendant walking the aisle on a patrol route. The player walks to any free seat and chooses *Sit here*. Feedback: *"Seen by 2 people"* or *"Nobody can read your screen here."* Two goes. It is spatial and quick, and it makes the point that where you sit decides most of it.
- **Round 2, "Spot the risks"** (BE-10). A café table snapshot with five risks and two harmless details. Risks: an unlocked laptop showing an inbox while its owner queues at the counter; a phone face-up with a text preview showing a door code; a lanyard and badge lying on the table; a printout with names half under a coffee cup; a bag hanging off the chair back into the aisle. Harmless: a charger in the wall socket with its own plug; a paperback. Find four of five; no timer by default.
- **Round 3, "Pick a network"** (MG-14). Four situations, one at a time:
  1. The café: *BeanAndBarrow_Guest*, *Bean&Barrow Guest* and *BeanAndBarrow-FREE*. The chalkboard says *BeanAndBarrow_Guest*. Pick it, accept the terms, wait for the VPN padlock.
  2. The station: *Haverbridge Station WiFi* with a page that asks only to accept the terms. Fine with the VPN on.
  3. A hotel: the page asks for "your work email and password to continue". Close it, use the hotspot, report it.
  4. A client's car park: only *FreePublicWiFi*, no venue named, and the VPN won't connect. Use the hotspot.
- Two wrong answers in a row bring Zainab back with one line, never a lecture: *"Ask yourself who runs it. If you can't say, hotspot."*

### 4. Apply: "Two days in Haverbridge" (6 minutes)

**(CP)** A work task bar appears (BE-18) with four steps: **1. Upload the survey photos. 2. Agree the deep-clean start date with Grace. 3. Check in at the hotel. 4. Wednesday 09:15 call with Grace and Ama.** The threats arrive inside these tasks. Nothing announces them.

#### 4a. The café, 12:40 (2.5 minutes)

- **(CP)** Time skip (BE-16): *"The site visit went well. 12:40, The Bean and Barrow."* Zainab goes to order. The player's laptop and the survey tablet are on the table as world objects (takeable).
- **Network (C09-B2).** Opening the laptop opens MG-14 (BE-19). Two networks: *BeanAndBarrow_Guest* (real, on the chalkboard) and *Bean&Barrow Guest* (fake, stronger signal). The fake one's page says *"Sign in with your work account to get free Wi-Fi"*, with the in-game account already filled in.
  - Real network, terms accepted, VPN connected, or the phone's hotspot: the photos upload and the task ticks.
  - Fake network, page closed without signing in: Zainab, back with the coffees: *"Good call. I'll tell the barista. Kai'll want it too."* A Report button sends it to Kai.
  - Fake network, signed in: nothing visible happens yet (see consequences).
- **The call (C09-B3).** Grace rings: *"Hiya, it's Grace at Wrenfield. The agency team's here early. Can you read me the side-door code, and which rooms need the barrier clean?"* Bryony, a couple and the barista are within earshot. The player chooses:
  - *"Let me step outside and call you straight back."*
  - *"I'll put the code and the room list in the client portal now. Two minutes."*
  - *"Rooms four, nine and twelve. And the code is..."* (the code appears on screen as the player's line; it is never spoken by a voiced character)
  - *"I'll give you the rooms now, and the code goes in the portal."*
- **Minding the laptop (C09-B4).** If the player steps outside, or later goes to the counter, Bryony offers: *"Want me to keep an eye on your stuff?"* The player chooses: *"That's kind, but it comes with me"* (packs the laptop and tablet into the bag), *"Thanks"* after locking the screen, or *"Thanks, back in a sec"* with the screen unlocked. Nothing is taken either way: Bryony is lovely. Zainab, if the laptop was left: *"Bryony's lovely. Bryony's also a stranger."*
- **Leaving (C09-B5).** Zainab: *"Right. Hotel."* If the player walks out without picking up the tablet, `tablet_left_at_cafe` is set. Nothing is said yet.

#### 4b. The hotel, 19:20 (1.5 minutes)

- **(CP)** Time skip: *"19:20. Haverbridge Lodge, room 214."* The printed residents list that Grace handed over at the site is in the player's bag. Zainab knocks: *"Dinner in ten? The curry place round the corner."*
- **Leaving the room (C09-B6).** A quick BE-10 look round before going out, then a choice for the laptop: take it in the bag; shut it down and lock it in the room safe with the printout; leave it locked on the desk; or leave it open on the bed.
- Time skip (BE-16): *"20:05. Turndown service."* A housekeeper comes in, turns down the bed and leaves. The scene shows whatever was in view. Nothing happens to it; the debrief uses the shot.
- **The missing tablet (C09-B7).** Back in the room at 21:00:
  - If `tablet_left_at_cafe`: the player unpacks. No tablet.
  - Otherwise Zainab messages: *"Have you seen my tablet? I think I left it on the café table. I'm an idiot."*
  - The player chooses: *"Ring the service desk now"*, *"Ring the café first, and the service desk if they haven't got it"* (the café closed at six; the time skip passes the evening), or *"It's locked. Report it in the morning."*
  - Ringing the service desk (MG-04, or a `phone-chat` contact until then) reaches Owain on call; the service desk's online form (MG-09, opened from the laptop) is the other route, and the one the text route uses. He asks what it was, when and where it was last seen, and what's on it; the player picks the answers. Owain: *"Locked. If the café hasn't got it by nine, I'll wipe it. Thanks for ringing tonight."*

#### 4c. Home, Wednesday 08:50 (2 minutes)

- **(CP)** Time skip: *"Wednesday, 08:50. Working from home."* The task bar shows the 09:15 call with Grace and Ama.
- **Ellis (C09-B8).** Ellis: *"Can I use your laptop for my maths? Mine's flat. Please? It's only the times-tables game."* The player chooses: *"Not this one, it's for work. Have my old tablet."*; *"Go on, but I'll log you in and stay with you"*; or *"Five minutes while I make a brew."*
- **The camera check (C09-B9, the counterpart of the hook).** Before joining, the camera preview (BE-10) shows the room behind the player: the whiteboard with yesterday's planning (*WRENFIELD side door* and a code, and three room numbers, generated per game); the smart speaker on the shelf; the residents printout pinned to the wall; Ellis's half-term planner (harmless); a family photo (harmless). Fixes: wipe or turn the whiteboard, unpin the printout, switch on blur, mute the speaker, close the door.
- **The call** (`person-chat` video-call mode with the workplace skin). Ama and Grace join. Grace: *"Morning! Could you share the survey so we can go through it?"* The player chooses *Share the survey window* or *Share my whole screen* (which shows a chat pop-up from Leo and the residents list in the window behind).
  - If the whiteboard is still in shot, Grace, kindly: *"Just so you know, I can see a door code on your whiteboard."* Ama: *"Thanks, Grace. We'll get that code changed today."*
- **(CP)** The call ends with Ama: *"Right. Shall we look at the last two days?"*

### 5. Debrief: "Through their eyes" (1.5 minutes)

- **(CP)** The debrief screen (BE-02), then Ama and Zainab on the call (or in the conversation panel for the text route). See Debrief, below.

### 6. Check (2 minutes)

- **(CP)** Ama's spot check on the staff intranet (MG-20): six items drawn from the bank in `assessment.md`, at least one per learning outcome.

### 7. Reference

- **(CP)** The staff intranet opens the reference card (BE-09) with the organisation's lost-device number, VPN name and Wi-Fi rule (BE-05).

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| Hook: the residents list on the train (C09-B1) | Open it in seat A / open only the Internal file / move to seat B / privacy screen first | C09-LO1 (baseline) | Jerome asks about his gran, or doesn't; Zainab's opening line differs; the debrief shows Jerome's view |
| Café network (C09-B2) | Real network and VPN / hotspot / fake network, page closed / fake network, signed in | C09-LO3 | Photos upload; or at 15:10 Kai's chat: *"Someone signed in to your account from a network in Haverbridge at 12:46. Was that you? We've reset your password and signed you out everywhere."* The player can still report, and the debrief credits it |
| Grace's call (C09-B3) | Call back from outside / send through the portal / rooms now and code in the portal / read it all out | C09-LO2 | If read out, the debrief's earshot panel shows who heard; Wrenfield changes the side-door code on Wednesday and every agency cleaner needs the new one |
| Minding the laptop (C09-B4) | Take it / lock it and leave it with Bryony / leave it open | C09-LO4, C09-LO1 | Nothing is taken; the debrief shows the inbox the couple at the next table could read while the player was out |
| Leaving the café (C09-B5) | Pick up the tablet / leave it | C09-LO4 | Whose tablet goes missing at the hotel |
| Leaving the hotel room (C09-B6) | Take the laptop / safe and shut down / locked on the desk / open on the bed | C09-LO4 | The 20:05 turndown shot shows what was in view |
| The missing tablet (C09-B7) | Ring the service desk now / ring the café first / report in the morning | C09-LO5 | Owain's device console: lock sent at 21:04, wipe at 09:00, then the café finds it behind a sofa cushion at 10:30 and it's re-enrolled. Reported in the morning, the console shows the hours it sat signed in to the survey app |
| Ellis and the laptop (C09-B8) | Offer another device / log him in and watch / five minutes alone | C09-LO4 | If the work laptop was used: a "free maths games" site asked to install a helper and Ellis clicked yes; the security software blocked it and Owain asks *"Something tried to install on your laptop at 09:02. Was that you?"* The player explains; Owain thanks them |
| Camera check (C09-B9) | Fixes found before joining (whiteboard, printout, speaker, door) | C09-LO6, C09-LO1 | Grace sees the code, or doesn't; Wrenfield changes the code; the debrief shows the camera's view |
| Screen share (C09-B10) | Share the survey window / share the whole screen | C09-LO6 | Whole screen shows Leo's chat pop-up and, in the window behind, another client's price list |

No option shames the player. Bystanders are never shown stealing or misusing anything; the harm is shown as client information reaching people who had no reason to see it, and as the work it causes (a door code changed, a password reset, a tablet wiped). The worst branch for the tablet still ends with Owain thanking the player for ringing.

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-14 Wi-Fi and VPN picker** | new (P2), a panel of MG-23 | Practise round 3 and the café. Config per situation, following its spec: `networks[] {ssid, secured, genuine, signal, page}` (the page is "terms only", "terms and email", "asks for work password" or none), `hotspot`, `vpn {required, label}` (Tarrowby's connects by itself), and `askNpc` (the barista knows the real name; the chalkboard shows it too). Events `wifi_joined:<ssid>`, `wifi_hotspot_used`, `wifi_vpn_on` and `wifi_page_signin:<pageId>` set C09-B2; anything typed is pre-filled, never real. A Report button sends the fake network to Kai |
| **BE-10 Spot-the-risk** | new | Practise round 2 (café table), the hotel room before dinner, and the camera preview before the video call. Each has risks, harmless details and a found and missed summary; timer off by default |
| **Sight cones** (`systems/npc-los.js`) | existing | The hook (Jerome's cone, via the sight challenge or the proposed overlooked check) and Coach C (`los.visualize: true`, a patrolling trolley attendant) |
| `person-chat` | existing | Zainab, Jerome, Bryony, Ellis; the video call in its video-call mode with the proposed workplace skin |
| `phone-chat` | existing | Lena, Ama, Kai, Zainab's message about her tablet; Grace's call and the service desk until MG-04 exists |
| **MG-27 Work desktop** (`container` and `text-file` until it exists) | new (MVP) | The laptop: the survey files, network settings (MG-23 and MG-14), chat and the staff intranet from one desktop, with notifications that can show over the player's shoulder |
| **MG-04 Voice calls** | new (P2) | Grace's call (with the call-back option) and ringing the service desk |
| **MG-09 Incident report form** | new (MVP) | The lost-device report through the service desk's online form: category "lost or stolen device", evidence chips (last seen at the café at 13:10; signed in to the survey app), the time noticed |
| **MG-23 Device settings** | new (P2) | The optional pre-trip check; the micro-drill |
| **MG-20 Knowledge check** | new | The Learn check question and the final spot check |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| Zainab's road rules | Zainab (EX-01) | 2 minutes | The carriage with real sight cones (proposed toggle); a speech bubble over the carriage; the two Wi-Fi pages; the reference card | Hotspot: where could you open the residents list? |
| Lost devices, any hour | Ama (chat text) | 10 seconds | The organisation's number | none |
| Charging on the move | Zainab (optional) | 20 seconds | none | none |
| Before you travel | Zainab (optional) with MG-23 | 30 seconds | The device settings panel | none |
| What happens when you report a lost device | Owain (EX-05 scene) | 30 seconds | The device console: lock, locate, wipe | none |
| Optional video: "Sixty seconds on the move" | Recorded in engine (EX-02) | 60 seconds | Linked from the reference card (MG-21) | none |

## Debrief

Shown on the built debrief view, then talked through by the host:

1. **Through their eyes.** One panel per place, drawn from the bystander's position with their cone or earshot shown: what the passenger could read on the train, what the café heard and saw, what the housekeeper saw at 20:05, what the family member did, what the client could see behind the player. Each panel says what good looked like.
2. **The tablet.** The device console: when it was last used, when it was reported, when it was locked and wiped, and the gap between them.
3. **Before and after.** The hook (who could read the residents list on the train) beside the camera check (who could see client details behind the player).
4. **Per-outcome results.**
5. The shared **habit to keep**, quoted word for word as in every awareness debrief: *"When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."*
6. The "On Monday" card and this module's line: *"Out of sight, out of earshot, never out of reach. Lost it? Report it now."*, then the lost-device route and the no-blame line.

## Variants

- **Micro-drill:** "Who's Watching?" (BE-07): one new place each month (an airport gate, a client's reception, a GP waiting room, a hot desk at a client's office), with three quick decisions each: seat or screen, a call, a network. About 4 minutes, drawn from a bank (BE-13, HA-21).
- **Text route:** each place is a short description with an "Around you" list that gives positions in words ("a man in the row behind, to your left, facing your way; he can see your screen"). Seat choices are described, and the overlooked check is worked out from the same data. The camera preview becomes a list of what is in shot. The same decisions, the same record (BE-03).
- **Facilitated session:** the team plays on one screen and votes at each decision. Pause points: after the hook (*"Have you ever read something over someone's shoulder? What was it?"*), after Grace's call (*"What would you say to a client who wants a code read out?"*), after the tablet (*"What stops people ringing the service desk at nine at night?"*), after the camera check (*"Turn round. What's behind you right now?"*). About 45 minutes with discussion.
- **Replay and randomisation:** seat layouts and passengers vary; network names, codes and room numbers are generated per game; the lost item varies (tablet, phone, the printout); the home scene's risks come from a bank (whiteboard, wall planner, a delivery note with a client's address, a smart speaker, a family member walking in). Annual editions add a new place (travel abroad, a client site, a co-working space).

## Alternative concepts

1. **Jo's Commute (attacker view).** Jo Fairweather, Tarrowby's hired ethical tester, rides the 07:42 on an authorised test to see how much she can learn about Tarrowby in one journey without touching anything: a screen in the row in front, a phone call on the platform, a badge on a lanyard, a laptop left at the café while its owner queued. The player rides with her and simply notices what she notices, building a picture of the company in twenty minutes (EX-06, BE-11). Then the player makes the same journey as themselves the next day. It teaches by showing how little effort it takes, with no technique beyond looking and listening.
2. **Lost Property (rewind).** The module opens at the end: a survey tablet in a café's lost property box, with a sticky note saying *found 13:15*. The player rewinds the day in chapters (BE-16 in reverse), finding each moment where things could have gone differently: who saw the screen, who heard the call, when the tablet was left, and how long until anyone reported it. Each rewind lets the player try the other choice and watch the ending change. A strong shape for a facilitated session.
3. **Field Desk (advising others).** The player is back at head office, covering the field team's support chat. Four engineers message from the road (MG-05): *"The hotel Wi-Fi wants my work password"*, *"I left my phone on the bus"*, *"The client wants the door code read out over the phone"*, *"My son's laptop is broken, can he borrow mine for homework?"* The player gives advice against a gentle clock, and each engineer's day plays out from it. Teaching others is a strong way to learn, and it suits the micro-drill.

## Art and audio

- **New rooms:** the train carriage (with seat collision so cones and seats line up), the café, the hotel room and the home office, each with a conversation background (`room-pov-background`, after room dressing and lighting). The train needs a lighting pass for morning light; the hotel an evening one (`mission-room-lighting`).
- **New props:** a privacy screen (inventory icon), the survey tablet, the café chalkboard with a readable Wi-Fi name, a hotel bed (today's beds are hospital beds), a "Do not disturb" hanger, a smart speaker, a home router, a wall whiteboard with two states (written and wiped), a train seat set and a luggage rack. Existing: suitcases, laptops, phones, room safes, the coffee station, cups, kettle, plants and sofas.
- **Characters:** Zainab, Ama, Owain and Grace need dialogue busts and talk sheets (Grace appears on the video call); Jerome needs a walk sprite and a bust; Bryony can use a generic v2 sprite with her own bust; Ellis needs a new child sprite (none exists). Extras use generic sprites.
- **Voice:** about 30 lines for Zainab, 6 for Jerome, 4 for Bryony, 8 for Grace, 5 for Ellis, 6 for Ama and 5 for Owain. No voiced line prints a variable: codes, network names, room numbers, times and counts are on-screen text only, and the player's own lines (including any code they read out) are shown, not spoken.
- **Ambience** (BE-21): train rumble and announcements, café chatter and the coffee machine, a quiet hotel corridor, a kitchen radio.

## Pitfalls

- **Don't frighten people off public Wi-Fi.** The advice is proportionate and follows the organisation's setting; the fake network is caught by what its page asks for, not by fear of all Wi-Fi.
- **Don't make bystanders villains.** Jerome, Bryony and the housekeeper are kind and ordinary. The harm is where the information went.
- **No gotchas.** The hook is a baseline. Everything in Apply was taught in Learn and practised in Practise. The tablet goes missing through the player's own play or through Zainab's, so everyone meets the reporting decision fairly.
- **Spatial play needs an equal alternative.** The seat round and the cones must work by keyboard, and the text route describes positions in words (BE-04, BE-03). Colour is never the only cue in the cones.
- **Don't assume a private home office.** Many people work at a kitchen table or in a shared flat; the module offers headphones, blur and timing as answers, not "get a study".
- **Don't over-teach.** Working in public is normal and allowed. Public charging stays a one-line habit, not a scare (the FBI and FCC issued advisories in 2023, but neither cited a documented case).
- **Never ask for real credentials.** The fake Wi-Fi page is pre-filled with the in-game account.
- **Keep each place tight.** Four places in six minutes means one or two decisions each; anything more goes to the micro-drill bank.