> **For the build, this design is superseded by `../../implementation/episodes/E11_misdirected_data.md`.** That implementation brief is checked against the code and the built content and wins wherever the two differ (company, host, stages, items, config). This file stays as design background: the intent, the alternatives and the reasoning.

# core_05 game design: Personal Effects

## Built shape and episode mapping

This module is **not built** (`research/built_episodes_vs_plan.md` §2). It is delivered as **E11** (new), a **consequence-flip** episode (R3) shared with core_06, at the **proposed new company Carrholme Services** (`carrholme.example`; proposed, to add to `BRAND_SET.md`). Data protection has no natural attacker, so in place of the attack half the learner makes the everyday mistake in a safe sandbox, and the flip shows where it led. The episode then follows the built shape: a scored defend half (routing requests, complaints, breaches and disclosures), then the built debrief view with the shared "habit to keep". It uses the built inbox-triage defender, the awareness-measure records and the concept cards; it has a defend-only variant and feeds new items into the check forms with mirror pairs (`assessment.md`).

The detailed "Personal Effects" design below is retained as the episode's content, reparented from the retired Larkspur world to Carrholme Services. The explainer is the episode host (a Carrholme DPO), not a recurring course mentor.

## Concept

It is a Tuesday morning at Carrholme. Two of Shauna Campbell's contact centre team are on a training day, so the player is covering the **Care Laundry desk** until 12:30. Care Laundry collects, washes and returns the name-taped clothing of residents at forty care homes; its desk handles lost-item claims from care homes and families, collection changes and the odd invoice query. The player's job is to clear the queue. Almost every item in it is about a person: a resident, a worried son, a Carrholme cleaner, a van driver.

The title is a double meaning. Residents' clothes are their personal effects, and every choice at this desk has an effect on a person. The module's signature is Tomasz's line, *"Behind every row in a spreadsheet is a person"*, made literal: the debrief is a **people board** showing everyone whose data passed through the player's hands that morning, and how each of them fared.

The tests arrive inside the work, unannounced: a caller who wants to know where a cleaner is, a son who wants "everything you've got", an incident report that names other residents, a "detective" in a hurry, a sales director with a marketing idea, and an email that goes to the wrong Sam. The player learns four habits that the law depends on: recognise personal data, share it only on a need-to-know basis, pass requests and complaints to the DPO the same day, and report a breach at once.

## Setting and cast

- **Rooms:** the contact centre floor (`room_office3`, redressed with headset desks, a "Care Laundry" desk sign, a laundry cage trolley and name-taped bags); Tomasz's office next door (`small_office_room1_1x1gu`), with a wall clock and a pinboard; the kitchen (`room_break`) for an optional chat. No new rooms.
- **Tomasz Wiśniewski** (DPO) is the explainer: precise, kind, dry. He is doing his monthly drop-in at the contact centre, so he is at the next desk when the player needs him.
- **Shauna Campbell** (Contact Centre Team Leader) hands over the desk, comes back for her bag after the first call, and sets two of the queue tasks by chat.
- **Martin Fletcher** (Sales Director) appears by chat and in person with a marketing idea.
- **Voices and messages only** (minor, new, no art needed): Carol, a caller who says she is a cleaner's sister; "DC Hendry", a caller who says he is a police officer; Gareth Hale, the son of a resident at Hollinsbrook House care home, by email; Sam Whitfield, manager of Hollinsbrook House, by email; Sam Whitaker, Carrholme Payroll Officer, by email.
- **People in the data** (names on screen only): Edna Hale (87, Hollinsbrook House, Room 12), whose cardigan is missing; Albert Finch and Pauline Grant, residents named in an incident report; Bernadette Lyons, a Carrholme cleaner; Lee Corrigan and Marcus Webb, Care Laundry van drivers; nine contact centre staff on an overtime sheet.

All care homes, people and domains are fictional; names are checked as for Carrholme itself (`DECISIONS_PENDING.md`, D2). Email addresses use the reserved `.example` domain in this plan; the game generates its domains per play, as core_01 does.

## Structure

The critical path is marked **(CP)**. Everything else is optional depth.

**(CP)** Before the hook, the module's title screen (BE-20) carries a one-line content note, as `features/accessibility_and_inclusion.md` (5.3) asks: *"This module includes personal information, including health information, being shared by mistake."* The reference card gives the organisation's own support route (BE-05).

### 1. Hook: "Where's Bernadette?" (1 minute)

- **(CP)** Shauna hands over at the desk: *"Queue's on screen, phones come to you. I'm in the meeting room till half twelve. Shout if you need me."* The cleaners' rota is open on the second monitor (a `notes` document): Bernadette Lyons, Ashgrove Primary, 06:30 to 15:00.
- The desk phone rings (a phone NPC conversation in `phone-chat` until MG-04 exists). Carol: *"Hiya love. I'm Bernadette's sister. She cleans at one of your schools? It's her fiftieth on Saturday and I want to surprise her."* Then: *"Which school is she at today, and what time does she finish?"*
- The player chooses (the baseline for C05-B1):
  - *"She's at Ashgrove Primary till three."*
  - *"I can't give that out, but I can pass a message to her."*
  - *"Can I check with my team leader and ring you back?"*
  - *"Sorry, I can't help with that."*
- Shauna comes back for her bag and hears the end of the call. Her response depends on the choice, and it is never a telling-off:
  - **Gave the details:** *"Ah. We never give out where people are working. Bernadette's asked us not to, and she'll have her reasons. Let's ring her now so she knows."* The player and Shauna call Bernadette, who is calm and grateful to be told. Shauna: *"And Tomasz needs to hear about it. He's at the next desk."* (Giving a person's whereabouts to a stranger is a disclosure of personal data, so it is reported.)
  - **Offered a message:** *"Perfect. A message, not the details. That's exactly it."*
  - **Checked first:** *"Good call to check. The answer's always the same: take a message."*
  - **Refused:** *"Right not to give it out. Next time offer to pass a message on. Kinder, and just as safe."*
- Whatever happened, Tomasz leans over from the next desk: *"I couldn't help overhearing. Have you got five minutes? I'll make it four."*

### 2. Learn: "You, after one week" (3 to 4 minutes)

- **(CP)** Tomasz explains at the desk (EX-01) in four chunks, each with one visual aid in the conversation panel (BE-08).
  1. **Your file (60 seconds).** He opens a tabbed viewer (`forensic-data-platform`) titled "Carrholme file: new starter": HR (address, bank details, emergency contact, a health form note "asthma: inhaler in desk drawer"), Building (this week's badge swipes, a CCTV still of the player at reception), IT (sign-in times), Email (Lena's message calling the new coordinator "a quick learner"), Kitchen (an order slip: "oat milk"). *"All of that is personal data about you. Even the oat milk."* Then the identifiable idea: *"No name needed. Badge swipes and a desk number would find you just as well."* **Check question** (MG-20, one item): *"Which of these is special category data?"* bank details / the asthma note / badge swipes / the CCTV still. Answer: the asthma note (health). Feedback on bank details: *"Worth protecting, but not on the special category list."*
  2. **Five habits (45 seconds).** Five cards: use it for the reason we have it; use only what's needed; keep it right; keep it only as long as needed; keep it safe. *"Seven principles in the law. At a desk, they come down to five habits."* Then this module's line, carried on the "On Monday" card: *"Behind every row in a spreadsheet is a person."* (The shared rule of thumb, "the habit to keep", is quoted in the debrief as in every awareness episode.)
  3. **Requests come in all shapes (45 seconds).** A collage: an email ("send me everything"), a phone note ("she wants to know what we've written about her"), a social media post, a solicitor's letter, "please stop emailing me", "I'm not happy you gave my number to the care home". *"None of these says 'subject access request'. All of them come to me the same day."* / *"The law gives us about a month, and the clock starts when it reaches anyone here."*
  4. **When it goes wrong (60 seconds).** A strip of four pictures (wrong recipient, papers on a bus, a folder open to everyone, a locked claims system), then a 72-hour clock: *you notice, you report, I assess, the ICO if needed*. *"Most breaches aren't hackers. They're Tuesday mornings. Every hour you wait comes off my seventy-two."* **Check question** (MG-20, multi-select): which are personal data breaches? A claims list emailed to the wrong care home; a route sheet with residents' names left on a bus; ransomware locks the claims system for a day; an email to the right person with the right file. Answer: the first three.
- **Skip:** the player can say *"I've done GDPR training before."* Tomasz: *"Splendid. Then two questions and you're free."* Both check questions still run; a wrong answer brings back that chunk.
- **Optional topics** in Tomasz's hub, each under a minute: *"What is the ICO?"*; *"Could I be fined?"* (no for an honest mistake; deliberate misuse is different); *"What about people who've died?"*; *"Redacting something?"* (one line pointing to core_06: *"Use the redaction tool, never a black box. Need to Know shows you why."*); *"Whose data is it, ours or the care home's?"* (*"Sometimes ours, sometimes theirs. Working that out is my job. Getting it to me is yours."*).

### 3. Practise (3 minutes)

- **(CP) "Down to One"** (about 60 seconds; **proposed** board). A grid of sixteen Carrholme staff faces (generic office sprites) and one spreadsheet row with the name column deleted: *Wakefield depot | van driver | started 2019 | nights | five-a-side captain*. Each detail the player reveals flips down the faces it rules out, until one face is left. Tomasz: *"No name. Still one person. That's personal data."* A faster second round uses sixty field staff and just two details (home postcode district and year of birth) and lands on one person again. The clues are ordinary work facts, never health or other special category details.
- **(CP) "Pass It On?"** (about 2 minutes; MG-20 in practice mode, instant feedback). Ten short situations, one at a time. For each the player picks a route: **Handle it now**, **Pass to the DPO today**, **Report it now**, or **Check who's asking first**. Feedback shows the right route and one line of why.
  1. A family member asks to update their phone number on a claim. (Handle it now: correcting data is a right, and here it's normal work.)
  2. A post on Carrholme's social media page: "I want copies of every recording of my calls with you." (Pass to the DPO: a valid request.)
  3. "Please stop sending me your newsletter." (Handle it now: stop the marketing straight away, the usual way.)
  4. A laundry route sheet with residents' names is missing from a van. (Report it now.)
  5. A caller "from the council" wants a list of residents at a care home. (Check who's asking: take details, pass it to the DPO.)
  6. "I'm not happy you gave my number to the care home." (Pass to the DPO: a complaint about how we used their data.)
  7. A shared folder of claims, including residents' care notes, turns out to be open to all staff. (Report it now: a possible breach, or at least a near miss.)
  8. A driver asks for a resident's room number to return a found cardigan. (Handle it now: they need it for the job.)
  9. A solicitor's letter asks for all data about their client. (Pass to the DPO.)
  10. The right file went to the right person, but it had an extra worksheet with other customers' details. (Report it now.)
- Items 1, 3 and 8 are there so the player learns that data protection is not a reason to stop helping. Two wrong answers in a row bring Tomasz back for a one-line nudge.

### 4. Apply: "Clear the queue by 12:30" (6 to 7 minutes)

- **(CP)** A work task bar (BE-18) shows **Care Laundry queue: 0 of 9** and the game clock (`gameClock` from 10:40). The queue is the inbox (MG-01) with a "Cases" folder, plus the phone. Four items are ordinary work: a collection day change for Wychbourne Court, a school's invoice copy, a found-items list, and Hollinsbrook House reporting that Edna Hale's cardigan has turned up in another resident's bag. Five are tests, each drawn from its bank slot (BE-13):

| Slot | What arrives | What it tests | Best response |
|---|---|---|---|
| **The request** | Gareth Hale emails: "Mum's cardigan has gone missing for the third time. I want everything you've got on Mum and me. Every note, every email, every call." | Recognising a request in ordinary words, inside a complaint | Pass the request to Tomasz now, send the holding reply, and carry on with the cardigan complaint as normal work |
| **The redaction** | Shauna's chat: "Can you send Mr Hale a copy of the incident report for his complaint?" The report (MG-12) names Edna's item and the date (fine to send), but also Albert Finch, Room 14, whose bag the cardigan went into, with a note about his continence care; Pauline Grant, Room 9; and driver Marcus Webb's personal mobile number | Data minimisation and special category data | Remove the other residents, the care note and the mobile number; send the rest |
| **The "detective"** | A call: "DC Hendry, North Pennine Police. I need Lee Corrigan's mobile number and his route this afternoon. Road traffic matter. It's urgent." | Disclosure to an official-sounding caller | Give nothing; take his name, collar number and force switchboard number; say the DPO handles police requests and will be quick; pass it to Tomasz |
| **The marketing idea** | Martin by chat, then at the desk: "We're launching Carrholme Home, cleaning for families. Export the family contacts from the claims system and I'll send them a discount." | Purpose limitation | "Those were given to sort out claims. Let's ask Tomasz first." |
| **The breach** | Shauna's chat: "Can you send this month's overtime sheet to Sam in Payroll?" The sheet lists nine staff, their hours and a notes column ("hospital appointment", "back injury", "union meeting"). In compose (MG-01), typing "Sam" offers **Sam Whitfield (Hollinsbrook House)** first, because the player emailed her an hour ago, and **Sam Whitaker (Payroll)** second. Choosing the external one shows an "External recipient" chip | Reporting a breach, including your own | Check the address before sending. If it went to the wrong Sam: report it now and ask her to delete it, as Tomasz advises |

- **How the tests play out:**
  - **The request.** The player can pass it to Tomasz (forward to the DPO mailbox, or walk to the next desk), reply with the claim notes themselves, forward it to Shauna, or reply asking why he wants it. Passing it on opens the holding-reply template (a `notes` document the player can send as it is). Tomasz, when it reaches him: *"Thank you. Some of that is ours and some is the care home's. I'll sort out which. His cardigan complaint is still yours."*
  - **The redaction.** MG-12 shows the one-page report. The player selects what to remove; the tool removes it properly (this module doesn't test the black-box trap; core_06 does). Feedback is held back until the debrief, so the player isn't corrected mid-task.
  - **The "detective".** If the player hesitates, he presses: *"This is urgent. Are you refusing to help the police?"* The model answer is offered as a choice: *"I'm not refusing. Our Data Protection Officer handles police requests, and can do it quickly."* If the player asks for proof, he reads out a "warrant number"; the debrief explains that a number on the phone proves nothing, and that real police expect organisations to check and usually put requests in writing.
  - **The marketing idea.** Martin argues: *"We're not selling the list. They know us. Everyone loves a discount."* The player can push back with what Tomasz taught (the sis01 pattern): *"They gave us their details to sort out a lost cardigan, not to hear about offers."* Martin, after a beat: *"Fair. Ask him. If it's a no, we'll put a sign-up box on the claim form and do it properly."* If the player exports the list, Martin thanks them and the consequence comes later.
  - **The breach, if the player sends it to the wrong Sam.** Two game-minutes later Sam Whitfield replies: *"Hi, I think this was meant for someone else? It's your staff's overtime with some health notes. I haven't opened it further or forwarded it."* The player chooses: report it now (ext 4444, the "Report an incident" form on the staff intranet (MG-09), or Tomasz at the next desk all count); reply "Sorry, please delete it" and carry on; recall the message and say nothing; or leave it until the queue is clear. Tomasz, after a quick report: *"Thank you. That was quick, and quick is everything."* He asks the player to write to Sam asking her to delete it and confirm, then says: *"I'll record it. I doubt the ICO needs telling. That's my call, and I can only make it because you told me."*
  - **The breach, if the player picks the right Sam.** Nothing is said at the time. Five game-minutes later the breach slot fills with its other form: Wychbourne Court care home emails the week's laundry list, but the attachment is its full residents' care summary (names, conditions, medicines). The best response: don't open it further or forward it; tell the sender; report it to Tomasz; delete it when he says so. Tomasz: *"Their mistake, our problem too. We're holding data we shouldn't. Thank you."*
- **Consequences** play out inside the module as short time skips (BE-16), each followed straight away by what would have prevented it:
  - **Wrong Sam, not reported:** "Thursday". Hollinsbrook's manager mentions the email in passing to Carrholme's account manager, and Tomasz hears about it two days late. *"It ended well: she'd deleted it. But I found out on Thursday. If she'd been the wrong person, Thursday would have been far too late."*
  - **The "detective" given the details:** "Two weeks later". Lee tells Shauna a man was waiting for him at his last drop: a debt collector who had told us he was police. Tomasz: *"Police requests come to me, and I check where they really came from. Every time."*
  - **The family contacts exported:** "A month later". Three families complain and one writes to the ICO. Martin, sheepish: *"Turns out people don't love a discount the week they've lost their mum's cardigan."*
  - **The request not passed on:** "Five weeks later". Gareth complains to the ICO that he has heard nothing; Tomasz apologises and rushes the response. *"It came in on a Tuesday. I heard about it from the regulator."*
  - **Redaction missed:** the debrief shows the sent copy with what was left in, and Tomasz treats it as a breach to report, with the player.
- **(CP)** The player clears the queue. The task completes whatever they did; the debrief shows the data protection side.

### 5. Debrief: "The people board" (2 minutes)

- **(CP)** The debrief screen (BE-02) opens on Tomasz's pinboard, the **people board** (proposed BE-02 panel): one card for each person or group whose data passed through the player's hands. Bernadette; Gareth and Edna; Albert Finch and Pauline Grant; Lee; the families on the claims list; the nine staff on the overtime sheet (or the Wychbourne Court residents). Each card is green (protected), amber (exposed but reported fast and contained) or red (exposed, found late), with one line on what the player did and what good looks like.
- The hook and the "detective" shown side by side as the before and after: the same behaviour (giving out a person's whereabouts) under a friendly voice and an official one.
- Per-outcome results: Secure, Developing or Not yet (see `assessment.md`).
- **The line to remember:** *"Behind every row is a person. If it goes wrong, tell me straight away."*

### 6. Check (2 minutes)

- **(CP)** Tomasz's "two-minute quiz" on the staff intranet (MG-20): six items drawn from the bank in `assessment.md`, at least one per learning outcome.

### 7. Reference

- **(CP)** The staff intranet opens the personal data reference card (BE-09) with the organisation's own DPO, reporting route and request route (BE-05), and asks for the data protection policy acknowledgement if the organisation has attached one (HA-07).

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| Carol asks where Bernadette is working (hook) | Give the school and time / offer to pass a message / check with Shauna first / refuse | C05-LO4 (baseline) | Shauna's response; if details were given, a call to Bernadette and a report to Tomasz |
| Tomasz's check questions | One answer / multi-select | C05-LO1, C05-LO5 | A wrong answer replays that chunk |
| Gareth's "everything" email | Pass to the DPO with the holding reply / reply with the notes yourself / forward to Shauna / ask why he wants it | C05-LO3 | Tomasz's thanks; or the ICO complaint five weeks later |
| The incident report for Gareth | Remove the other residents, the care note and the mobile number / miss some / send it as it is | C05-LO1, C05-LO2 | The debrief shows what was sent; anything left in is reported as a breach with Tomasz |
| "DC Hendry" | Give nothing, take details, refer to the DPO / give the details / ask for proof, then give them / hang up | C05-LO4 | Tomasz's thanks; or Lee and the debt collector two weeks later |
| Martin's marketing idea | Ask Tomasz first / export the list / export "just the happy ones" | C05-LO2 | Martin agrees to a sign-up box; or complaints a month later |
| The overtime sheet | Check the address and send to Payroll / send to the wrong Sam | C05-LO5 (prevention, recorded but not assessed as a failure: see `assessment.md`) | Thanked on the people board; or Sam's reply |
| Sam's reply, or the Wychbourne Court attachment | Report now / ask for deletion only / recall and say nothing / leave it until later | C05-LO5 | Tomasz records it in minutes; or he hears on Thursday |

No option shames the player. A player who gives out Bernadette's whereabouts helps put it right straight away; a player who sends the email to the wrong Sam and reports it is thanked as warmly as one who never slipped. The debrief frames every red card as "this is how real breaches start, and this is what reporting changes".

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-01 Inbox** | new (MVP) | The queue as a "Cases" folder; Gareth's email; compose with recipient autocomplete, the "External recipient" chip and attachments; Sam's reply; the Wychbourne Court attachment (opening it shows a "this looks like it isn't meant for us" preview, not the full file) |
| **MG-12 Redaction** | new (MVP) | Tools `mark` and `remove` only, no Hidden step: a one-page incident report (`kind: record`) with eight spans (four `mustRedact`, four `mayKeep`). Opened from the case with `#trigger_minigame` (BE-19). The tool removes text properly; scoring is held back to the debrief |
| **MG-20 Knowledge check** | new (MVP) | Tomasz's two check questions, opened from his conversation with `#trigger_minigame:knowledge_check\|<configKey>` (BE-19), his next line branching on the result; "Pass It On?" in practice mode as sort-into-groups items (instant feedback, the four routes as the groups); the final six-item check |
| **MG-09 Incident report form** | new (MVP) | One of three ways to report the breach, with "personal data involved?" set to yes; scores completeness and speed |
| **"Down to One" board** | **proposed** | Round one: a 4 by 4 grid of faces with clue cards that flip faces down. Round two: sixty small faces and a shrinking count. No score, just the reveal |
| **MG-27 Work desktop** | new (MVP) | The Care Laundry desk computer: the inbox, the rota, the claims notes and the staff intranet, with queue arrivals as notifications |
| `forensic-data-platform` | existing | "Carrholme file: new starter", five tabs using `log-table` and `document-excerpt` blocks; no confirm step needed |
| `phone-chat` | existing | Team chat with Shauna and Martin; the two calls as phone NPC conversations until MG-04 |
| `person-chat` | existing | Tomasz at the desk, Shauna at handover, Martin at the desk |
| `notes`, `text-file` | existing | The cleaners' rota, the claim notes, the holding-reply template, the retention schedule extract |
| MG-04 Voice calls | new (P2) | Carol and "DC Hendry" as real incoming calls, with hold (to ask Shauna) |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| Your file | Tomasz (EX-01) | 60 seconds | The tabbed "your file" viewer, with one tab highlighted at a time | "Which of these is special category data?" |
| Five habits | Tomasz (EX-01) | 45 seconds | Five cards | none (assessed in Apply) |
| Requests come in all shapes | Tomasz (EX-01) | 45 seconds | The request collage | none (assessed in Practise and Apply) |
| When it goes wrong | Tomasz (EX-01) | 60 seconds | Four breach pictures; the 72-hour clock | "Which are personal data breaches?" |
| Optional topics | Tomasz (EX-01) | under a minute each | none, or one card | none |
| Optional video: "Behind every row" | Recorded in engine (EX-02) | 60 seconds | Plays on the staff intranet (MG-21) | Linked from the reference card |

## Debrief

Shown on BE-02, then spoken by Tomasz at his pinboard:

1. The people board: each person or group, the card's colour, what the player did, and what good looks like.
2. The before and after: Carol and "DC Hendry" side by side.
3. The breach: how long it took from the slip (or the arrival) to the DPO, and what that time bought him.
4. Per-outcome results.
5. The shared **habit to keep**, quoted word for word as in every awareness debrief: *"When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."*
6. The "On Monday" card and this module's line: *"Behind every row is a person. If it goes wrong, tell me straight away."*, then the reporting route and the no-blame line.

## Variants

- **Micro-drill:** "Pass It On?" on its own (BE-07): one "Down to One" round, then eight situations drawn from a bank of about forty (requests in odd wordings, complaints, breaches, near misses, callers, and calibration items where the right answer is to help). About 4 minutes. Monthly editions add the year's new forms (a request by chat app, a breach by AI tool).
- **Text route:** the calls and conversations as dialogue; the emails, rota and reports as accessible text; the redaction as a list of sentences with "keep" or "remove" for each; "Down to One" as a list of sixteen staff descriptions that the player narrows down with each clue. The same decisions, the same people board as a list, the same record (BE-03).
- **Facilitated session:** the desk on a shared screen; the team votes on each decision. Pause points: after the hook (*"Would you have told Carol? Why do we want to help?"*); after "Down to One" (*"What 'anonymous' data do we hold that isn't?"*); after "DC Hendry" (*"How would you know it's really the police?"*); after the wrong Sam (*"What stops people here reporting a misdirected email?"*). About 45 minutes with discussion.
- **Replay and randomisation:** each slot draws from a bank (BE-13): callers (a sister, an old school friend, a "solicitor", a "bailiff", a "council officer"); request wordings and channels; redaction documents (an incident report, a complaint file, a CCTV request form); marketing ideas (a newsletter, a survey, a partner offer); breach forms (wrong Sam, an extra worksheet, an inbound attachment, a lost route sheet). Names and domains are generated per play. The annual edition reflects changes in the law (the complaints duty arrived in June 2026; check for more).

## Alternative concepts

1. **Everything About Edna (data hunt).** Tomasz asks the player to help find every copy of one resident's data for a subject access request. The player explores the building: the claims system, emails, a printed route sheet in a van, a photo of a name-tagged bag in the drivers' chat group, a 2019 spreadsheet on the shared drive that should have been deleted, a sticky note on the laundry cage. Each find teaches something (minimisation, retention, unofficial copies, the right to see notes written about you). The lunchtime line is "we found her in eleven places". Strong on exploration and the 2D world; weaker on breaches.
2. **The Other Side of the Desk (data subject view).** The player starts as Gareth (BE-11 role switch), trying to find out what a company knows about his mother: he is fobbed off, asked why he wants it, and finally sent someone else's data. Then the player switches back to Carrholme staff and handles the same request properly. Builds empathy for the person behind the request; needs two sets of locations.
3. **72 Hours (behind the scenes).** The player sits with Tomasz for a compressed three days while staff reports land on his desk: a misdirected email on Friday at 16:50, a lost phone, a folder open to everyone, a report that arrives two days late. A wall clock shows how much of each 72 hours is left when the report reaches him. Teaches why fast reporting matters by showing the DPO's side. Best as a facilitated session or for role_05 and sector_01.

## Art and audio

- **Rooms:** existing; the contact centre floor needs headset desks and the Care Laundry dressing.
- **Characters:** Tomasz, Shauna and Martin need their recurring art (shared with core_06, role_06 and others). Callers and email senders need no art; email avatars use initials.
- **New props:** a laundry cage trolley; name-taped laundry bags (reusing `bag*` sprites with a tag overlay); a "Care Laundry" desk sign; Tomasz's pinboard for the people board.
- **New UI art:** the "Down to One" board (portrait grid, flip animation with a reduced-motion option); the people board cards.
- **Voice:** about 45 lines for Tomasz, 12 for Shauna, 8 for Martin, and about 12 for the two callers (generic voices). No voiced line prints a variable: counts (nine staff, sixty field staff, the number of family contacts) appear on screen only, and Tomasz's reaction to a fast report is one fixed line, not a spoken time.

## Pitfalls

- **Teaching law instead of behaviour.** Keep article numbers out of the game. Staff need four habits, not the UK GDPR.
- **Making staff afraid to share.** Over-cautious staff refuse reasonable help and block safeguarding. The calibration items (a driver needs a room number, a family member updates a phone number) are marked as correct when the player helps.
- **Blaming the player for the wrong Sam.** The autocomplete is visible and catchable, but the module treats a reported slip as a good outcome, with the same warmth as a catch.
- **Gotchas.** Every test must be catchable with what Learn and Practise taught: the request wording echoes the collage, the "detective" echoes "Check who's asking", and the autocomplete shows the organisation name in grey.
- **Sensitive settings.** Care homes, dementia, continence and debt are real parts of people's lives. Show them with dignity; humour comes from Tomasz's dryness and Martin's enthusiasm, never from residents or families.
- **Implying police can't be trusted.** The lesson is "check through the DPO", not "don't help the police". Tomasz says real requests are dealt with quickly.
- **Staff deciding breaches.** The game never asks the player whether a breach is "serious enough". That is the DPO's judgement; the player's job is to report.
- **A clock that stresses.** The 12:30 deadline adds realism, not pressure: the queue can't be failed, and BE-23 lets players pause or slow the clock.
- **Law changes.** The Data (Use and Access) Act 2025 changed details through 2026. Re-check `concepts.md` before each annual edition.
- **Real data.** All names, rotas and records are generated; nothing comes from a real organisation.
