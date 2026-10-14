# role_05 game design: Joiners, Movers, Leavers

## Concept

The player runs the Schools Facilities team in Larkspur's Operations department: eight people who schedule cleaning, caretaker cover and repairs for sixty schools. It is the busiest week of term. On Monday a graduate apprentice starts. On Wednesday Leo moves to Finance. On Friday Des, who has held the schools' keys and out-of-hours callouts for twenty-two years, retires. Lena wants a remote contractor hired by Monday for the bookings rush, the quarterly access review is due, and at 17:50 on Thursday someone knocks on the door with a mistake she's frightened to admit.

None of it looks like security work, and that is the point. A manager's security decisions arrive as tickets, favours and conversations: "just give her the same as Des", "can I keep my old mailbox?", "he's a star, start him Monday", "please don't tell anyone". The module shows that each small answer either closes a door or leaves it open, and that the way a manager reacts to a confession decides whether the team tells them anything next time.

The lunchtime talking points: the one-click "same as Des" trap, the candidate whose video freezes whenever the question goes off-script, the access list full of ghosts (a contractor who left in March, a summer temp, the Chief Executive's unused admin rights), and the team pulse board on the office whiteboard that moves with every reaction the player has.

## Setting and cast

- **Rooms:** the Operations floor (`room_office`); the player's office (`small_office_room1_1x1gu`) with a PC, a desk phone, the team's key cabinet (`key_cabinet1`) and a whiteboard that becomes the team pulse board; Mei Lin's HR office (`small_office_room3_1x1gu`); the IT service desk (`room_IT`); the kitchen (`room_break`), dressed for Des's leaving do on Friday; the meeting room (`room_meeting`) for an in-person identity check. No new rooms.
- **Mei Lin Zhou** (HR Business Partner): the guide for hiring checks, leavers and HR information. Discreet and firm.
- **Ama Owusu** (Information Security Manager): the mentor for access and culture. Comes back if the player calls the security team about Farida.
- **Owain Jenkins** (IT Service Desk Lead): raises the joiner, mover and leaver tickets and explains what's possible.
- **Leo Brennan:** the mover. Delighted about Finance; would like to keep his old mailbox "just in case".
- **Hassan Qureshi** (Finance Manager), by chat: Leo's new manager, with a well-meant question about Leo's health.
- **Lena Fischer** (Operations Manager), by chat: the player's manager. Wants the contractor hired fast and the team's overdue training "sorted".
- **Tomasz Wiśniewski** (DPO), by chat or in person, on the data Des exported.
- **Kai Murray:** only in the branch where the contractor is hired.
- **New characters:**
  - **Nadia Ferreira**, 23, Portuguese-British, graduate apprentice scheduler; dark curly hair, a bright yellow cardigan, a new lanyard she keeps checking. Keen and a little overwhelmed.
  - **Des Harker**, 64, white English from Bradford, retiring scheduler and former school caretaker; walks with a stick, flat cap on the coat peg, a mug that says "Keys? Ask Des". Warm, proud, a bit sad to go.
  - **Farida Haidari**, 30s, British Afghan, the team's most experienced planner; neat, quick, precise. At her last job, people who clicked a test phish were named in a monthly email.
  - **"Daniel Hartwell"**, the remote candidate: seen only as a polished profile photo and a video face that never quite matches the voice. In the branch where he is hired, **the real Daniel Hartwell** (30s, white English, a web developer in Leeds) phones HR at the end.
  - **Bev Quigley**, a consultant at Brightwell Talent (a fictional recruitment agency): email and phone only. Friendly, persistent, sure "he's a star".
  - **Sol Sorensen**, 40s, Danish-British, an agency temp who covers Des's callouts from Thursday. A generic office sprite.

## Structure

The critical path is marked **(CP)**. The week runs as six short scenes on a planner (BE-18); the clock jumps between them.

### 1. Hook: "Same as Des?" (1 to 2 minutes)

- **(CP)** Monday 08:40. The player's computer (MG-27) shows Owain's ticket: **"New starter: Nadia Ferreira, Schools Facilities. Access: [Copy from user: Des Harker] [Choose from role template]."** Des's access sits beside it: twenty-two years of scheduling admin, the school booking portal admin, the shared `ops-scheduling` login, the key safe code list for sixty schools, timesheet approval, read access to Ledger and the old caretakers' mailbox.
- Nadia appears in the doorway with two coffees: *"Morning! Owain says my logins are waiting on you?"*
- The player chooses in MG-18 request mode: copy Des in one click, build from the role template, or copy then trim. The choice is the **baseline** for R05-LO1.
- Owain rings or walks over, and his line depends on the choice:
  - **Copied Des:** *"Done. Quick one, though: does Nadia need the key safe codes for sixty schools on her first morning?"*
  - **Copied and trimmed:** *"Good instinct, trimming it. The template's quicker next time."*
  - **Template:** *"Nice. Template's the right call. Ama wanted a word about your week anyway."*
- Whatever the choice, Nadia's account works and her day starts. Nothing bad happens yet; the debrief comes back to it.

### 2. Learn: "Access follows the job" (4 minutes)

- **(CP)** Ama and Mei Lin in the player's office (EX-01), with visual aids in the conversation panel (BE-08):
  1. **Ama, least access.** Des's access list beside the role template, the extras highlighted one by one. *"Copying someone's access copies their whole history. Des has twenty-two years of extras."*
  2. **Ama, the lifecycle.** A diagram of day one, move day, last day and the review, with who acts at each. *"Movers lose the old access on move day. Leavers lose everything by home time on their last day."*
  3. **Mei Lin, hiring checks.** The red flags card drawn from the official advisories (inconsistent details, camera refused, equipment to a different address, pay to someone else's account) and the fairness rule. *"A video call isn't an identity check. We see the original document, every candidate, every time."*
  4. **Mei Lin, HR information.** *"Absence dates, yes. Diagnoses, no. That stays with HR."*
  5. **Ama, when someone owns up.** The four-step card: Thank, Act, Support, Learn. *"How you react when someone owns up decides whether the next person does."*
- **Check question** (MG-20, opened from Ama's line with `#trigger_minigame:knowledge_check|<configKey>`, BE-19): *"Leo moves to Finance on Wednesday. When should his Operations access go?"* (On Wednesday; at the next review; when he says he's finished with it; never, in case he needs it.)
- **Skip:** the player can say *"I sort out access all the time."* Ama: *"Then this'll be quick,"* and goes straight to the check question. A wrong answer brings the chunk back.
- **Optional topics** in the hub, each under a minute: *"What about contractors?"*, *"Why can't I look into a worry myself?"*, *"What if the person who made the mistake is senior to me?"*

### 3. Practise: "Access or Excess?" (3 to 4 minutes)

- **(CP)** MG-18 practice mode: eight request cards, one at a time. For each the player chooses **Approve**, **Reduce** or **Query**, with instant feedback and one line of why.
  1. A new cleaning supervisor needs the scheduling app on her work phone. *(Approve: the role needs it.)*
  2. A summer intern asks for admin rights "to save bothering IT". *(Reduce.)*
  3. Someone moving from Sales to Operations wants to keep the customer system "for the handover". *(Reduce: two weeks, with an end date.)*
  4. The Chief Executive's office asks for admin on the scheduling system. *(Query: what for?)*
  5. A contractor asks to use the team's shared login "like everyone else". *(Reduce: a named account.)*
  6. A manager asks to see the absence reasons for their team. *(Reduce: dates and adjustments only.)*
  7. A leaver asks to keep email for a month. *(Reduce: an automatic reply with a personal contact, if they want one.)*
  8. A four-week agency temp needs the scheduling system. *(Approve, with an end date.)*
- Then three **"What do you say?"** cards (MG-20 items shown as dialogue): a team member says *"I sent the rota with home addresses to the wrong school"*, *"I think I approved a sign-in prompt I didn't start"* and *"I left my laptop on the train"*. The best answer each time starts *"Thanks for telling me. Let's report it now, together."*
- Two misses in a row bring a one-line nudge from Ama or Mei Lin, never a lecture.

### 4. Apply: "The week" (11 to 12 minutes)

- **(CP)** The week planner appears (BE-18): **Mon: Nadia starts. Tue: interview the contractor. Wed: Leo moves; access review due. Thu: temp cover starts. Fri: Des's last day.** Each scene is short; the clock jumps between them. The team pulse board on the whiteboard (`alarm-panel`, reskinned) shows eight lamps, one per team member, that brighten or dim with the player's reactions.

**Monday afternoon: time for training (1 minute).**

- Lena's chat: *"Three of your team are overdue on the annual security refresher. Can they click through it this week?"* The player chooses: book twenty minutes in Tuesday's huddle and cover the phones; "do it when you can"; or "just click through it".
- Nadia asks when she should do her induction modules. The player can book Wednesday morning and set her customer-data access to switch on after her training, which the request form allows.

**Tuesday: the remote candidate (3 minutes).**

- Bev emails: *"Daniel's a star. References done, he can start Monday. He'll need the laptop sent to his new flat."* Lena chats: *"Need someone by Monday for the bookings rush."*
- **The interview** (`person-chat` video-call mode). "Daniel" says his camera is broken and shows a profile photo. Asked again, he turns it on: the face is smooth and well lit, but the picture freezes whenever the player asks something unexpected (*"What was the best thing about your last manager?"*), and the voice runs half a second behind the lips. His answers about his last job are fluent and vague. Near the end he asks to be paid through a payments app "in my business partner's name, for tax reasons".
- **The candidate file** (MG-25, or `forensic-data-platform` until it exists): a CV claiming six years at "Northern Data Solutions", a firm with no trace before last year; an ID scan that is a photo of a screen, whose photo doesn't match the video face; a home address in Leeds, while the laptop is to go to "my new flat in Leicester"; two references from free email addresses with internet phone numbers; a professional profile created four weeks ago. The player marks what doesn't match.
- **Decision:**
  - **Offer the job; the agency says checks are done.** The hired branch (below).
  - **Ask Mei Lin to run the standard checks first:** the original passport seen in person or on a live video call, the right to work check, references rung on numbers HR finds itself. Mei Lin invites Daniel to the Leeds office "or a live call with your passport in your hand". He withdraws by email that evening. Mei Lin reports it to Ama and tells the agency. Ama: *"We'll report it. And the agency's other clients will want to know."*
  - **Reject him: something feels off.** Mei Lin: *"You might be right. But a quiet no can't be reported, and we might be wrong about the next one. Same checks as everyone."* The player can still choose the checks.
- **Fairness variant** (drawn from the bank, BE-13): in some plays the candidate is genuine, with a strong regional accent and a juddering picture from rural broadband. The same checks clear her in a day and she's hired. The debrief shows that the checks, not the gut, made the call.
- **The hired branch:** a time skip (BE-16), "Two weeks later". Kai rings: the contractor's account signs in from three countries overnight, and the laptop has a remote desktop tool installed. Owain locks it; Ama reports it. A month later the phone rings again: the real Daniel Hartwell, puzzled, has a tax letter saying he works for Brightwell Talent on a Larkspur contract. *"I've never heard of you. Who's been using my name?"* Mei Lin takes the call. The damage stops at what the account could reach, which is why least access matters even for good hires.

**Wednesday morning: Leo moves to Finance (2 minutes).**

- Owain's mover ticket: Finance access requested by Hassan (raise payments in Ledger, second approver on payment runs); Operations access to remove (scheduling edit, the school booking portal admin, the shared Operations mailbox, raising purchase orders).
- Leo leans round the door: *"Can I keep the Ops mailbox for a month? Schools will still email me."* The player chooses:
  - **Remove it all today, and set an automatic reply and forwarding to the team mailbox.** (Best.)
  - **Keep the mailbox for a month.** (Partly right: the debrief shows him reading customer emails he no longer handles.)
  - **Leave his Operations access as it is.** (The access review later shows a toxic combination: Leo could raise a purchase order and approve its payment.)
- Hassan's chat, the same morning: *"Looking forward to having Leo. Anything I should know? He was off for a while last year, wasn't he?"* The player chooses:
  - *"He's great with suppliers. For anything about absence or health, Mei Lin's the person, or ask Leo."* (Best.)
  - *"He was off six weeks; I can send you the dates."* (Partly right: dates are less sensitive, but they're HR's to share.)
  - *"He had an operation on his back. Keep it to yourself."* (A health disclosure the new manager doesn't need.)

**Wednesday afternoon: the access review (2 minutes).**

- **(CP)** MG-18 opens with twelve rows: a person or account, a system, the access level, when it was last used, and a short note. The player marks each **Keep**, **Reduce**, **Remove** or **Ask the owner**, then submits to Owain.

| Row | What it shows | Right call |
|---|---|---|
| Chris Tremaine, contractor | Scheduling admin; last used in March, when his project ended | Remove |
| Jamie, summer temp | Full access to the shared Operations mailbox; left in September | Remove |
| `ops-scheduling` | A shared admin login whose password the whole team knows | Ask the owner (replace with named accounts, then change the password) |
| `backup-sync` | A service account; runs every night | Ask the owner (don't remove what you don't recognise) |
| Gillian Marsh, Chief Executive | Scheduling admin; never used | Reduce (a polite note to her office) |
| Kev Sutcliffe, warehouse | Scheduling edit; used two days ago to plan deliveries | Keep |
| Leo Brennan | Operations edit and Finance approval, if not removed this morning | Remove the Operations access (toxic combination) |
| Nadia Ferreira | The role template; or, if the hook copied Des, key safe codes and admin | Keep; or Reduce |
| Des Harker | Everything, leaving Friday | Keep until Friday, marked "leaver" |
| Lena Fischer | Scheduling read | Keep |
| Farida Haidari | Team absence calendar (dates only), as deputy | Keep |
| "Daniel Hartwell" | Only in the hired branch: signs in from three countries at night | Remove now and report to security |

- **The odd export.** The review's activity column shows that last Thursday Des's account emailed "School contacts (caretakers).xlsx" (1,400 names and mobile numbers) to a personal address. The player chooses:
  - **Tell Mei Lin and Ama, with the facts.** (Best.) Mei Lin and Tomasz see Des privately on Thursday. He wanted to say goodbye to everyone he'd worked with. Tomasz helps him send a farewell through Larkspur that lets caretakers reply to his personal address if they want to, and Des deletes the spreadsheet. Tomasz: *"Most of the time it's this. We still had to ask."*
  - **Ask Des about it at the leaving do.** (Kind, but public; Des is mortified in front of the team, and the conversation belonged with HR.)
  - **Search his mailbox to see what else he's sent.** (Investigating alone, without a lawful reason or the right people. Mei Lin stops it: *"That's not ours to do."*)
  - **Let it go; he's retiring.** (1,400 people's numbers stay on a personal account nobody controls.)

**Thursday 17:50: Farida (2 minutes).**

- **(CP)** A knock at the door. Farida, coat on, phone in hand: *"Have you got a minute? I've done something stupid. Please don't tell anyone."* She clicked a "your payslip is ready" email at the end of a day covering two people's work, and typed her password into the page.
- The player chooses:
  - *"Thank you for telling me. Let's ring the service desk now; I'll sit with you."* (Best.)
  - *"Don't worry. Change your password and we'll say no more."* (Kind, but slow: the attacker may already be signed in.)
  - *"We did the training last month. How did that get past you?"* (Blame.)
  - *"I'll have to let HR know."* (Turns a security report into a disciplinary matter.)
- **Consequences:**
  - **Thanked and reported:** Owain resets her account in five minutes; Kai finds a forwarding rule the attacker had just set up and removes it. Farida: *"Thank you. At my last place I'd have been in the monthly email."* Her lamp on the pulse board brightens, and so do two others.
  - **Password only:** on Monday, Kai finds invoices sent from her mailbox to four schools over the weekend. Farida: *"I thought it was sorted."* Ama helps contain it; it's a bigger job.
  - **Blame or HR:** Farida goes quiet and reports it herself the next morning, late. Three lamps dim. In the debrief's time skip, "Three months later", a phish reaches the whole team and nobody reports it for two days.
- A follow-up choice for every branch: *"Shall I share what happened at the huddle so others learn?"* The best answer is to ask Farida first, and otherwise share the lesson without her name.

**Friday: Des's last day (2 minutes).**

- **(CP)** The leaver checklist (MG-18 checklist mode, or `notes` with choices): network and email accounts; the school booking portal admin; two supplier portals in Des's name (the lift engineers and the locksmith); laptop, work phone and key fob; badge; the master keys in the key cabinet, checked against the register; **the key safe codes at fourteen schools and the shared `ops-scheduling` password, which Des knows and which must change**; his mobile number on the schools' alarm call lists; his mailbox (automatic reply, delegated access for thirty days, then closure); the work email app on his own phone; and the handover sheet of who to call for what. Des's drawer (`container`) holds a laminated card of key safe codes and a USB stick labelled "photos 2009".
- Des asks: *"Can you leave my email on for a few weeks? I'd like to say goodbye properly."* The player chooses:
  - *"Let's send your goodbye today, and set an automatic reply with your personal email for anyone who wants to stay in touch."* (Best.)
  - *"Go on then, a couple of weeks."* (Access after leaving.)
  - *"Keep the laptop too, it's ancient."* (A device full of school data walks out.)
- The leaving do in the kitchen: cake, bunting, and a card signed by sixty schools. Des: *"Twenty-two years. Never lost a key."* The week ends.
- **If the key safe codes weren't changed:** a time skip in the debrief, "Three months later". A school reports its key safe opened overnight and a laptop trolley gone. The code hadn't changed in six years; Des knew it, and so had every contractor who ever covered his callouts.

### 5. Debrief (2 minutes)

- **(CP)** The debrief screen (BE-02), then Ama and Mei Lin in the player's office (or in the conversation panel on the text route).
- **The team's access on Monday and on Friday,** side by side: who had what, with the player's changes marked as removed, reduced or end-dated, and anything still open in amber.
- **Each decision:** what happened, what the player did, what good looks like and where it led, including any time skip the player triggered.
- **The before and after:** Nadia's access in the hook beside Sol's in Thursday's scene.
- **The team pulse:** the anonymous end-of-quarter pulse survey for the player's team, built from their reactions. *"I'd tell my manager if I made a security mistake: 9 out of 10 agree"* (or 4 out of 10). The numbers are on screen only.
- **Per-outcome results:** Secure, Developing or Not yet (see `assessment.md`).
- **The line to remember:** *"Right access on day one, gone on the last day, and 'thank you' when someone tells you."*

### 6. Check (2 minutes)

- **(CP)** Mei Lin's "manager's spot check" on The Lark (MG-20): six items from the bank in `assessment.md`, at least one per learning outcome.

### 7. Reference

- **(CP)** The manager's card on The Lark (BE-09), showing the organisation's own leaver deadline, screening policy, statement on mistakes and reporting routes (BE-05).

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| Nadia's access (hook) | Role template / copy then trim / copy Des | LO1 (baseline) | Owain's line; Nadia's row in the review; the debrief's access map |
| Training time | Book time and cover / "when you can" / "click through it" | LO5 | Pulse lamps; Lena's reply; completion shown in the debrief |
| The remote candidate | Standard checks first / reject on a feeling / offer now | LO4 | Withdrawal and a report; or the hired branch with Kai's call and the real Daniel's |
| Leo's mailbox | Remove today with forwarding / keep a month / leave everything | LO2 | Leo's row in the review; the toxic combination flag |
| Hassan's question | Point to HR or Leo / share dates / share health details | LO6 | Mei Lin's comment in the debrief; Leo's reaction if details were shared |
| Access review | Twelve rows | LO3, LO2 | Owain's summary; the access map; the hired-branch row |
| Des's export | Tell HR and security / ask him at the party / search his mailbox / let it go | LO6 | Tomasz's quiet resolution; or an embarrassed Des; or Mei Lin stopping the search; or data left loose |
| Farida's confession | Thank and report / password only / blame / HR | LO5 | Contained in minutes, or invoices sent over the weekend; pulse lamps; the "three months later" phish |
| Sol's access | Template with end date / template / copy Des | LO1 (Apply) | Sol's row; the before and after in the debrief |
| Des's last day | Full checklist and goodbye / email left on / laptop kept | LO2 | Codes and lists cleared; or the key safe time skip |

No option shames the player. The worst branches still end with a colleague helping, and the debrief frames them as "this is how it usually happens; this is what would have changed it".

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-18 Access review** | new, built from `warranty-checklist` (`public/break_escape/js/minigames/warranty-checklist/`) | Request mode for the hook and Sol (role template, copy user, end date); practice mode for "Access or Excess?" (one card at a time, instant feedback); review mode for the twelve rows (Keep, Reduce, Remove, Ask the owner); checklist mode for Des's last day. `warranty-checklist` already has rows, verdict buttons, saved state and a gated submit; it needs a configurable title and letterhead, configurable verdict labels, per-row expected verdicts for BE-01, and its hard-coded globals made configurable |
| **MG-25 Document inspector** | new | The candidate file: CV, ID scan, right to work result, references and profile, each with mismatches to mark. Until it exists, `forensic-data-platform` shows the same evidence in tabs with a confirm step |
| **MG-20 Knowledge check** | new | Ama's check question, the "What do you say?" cards and the final spot check |
| **MG-27 Work desktop** | new | The player's computer: Owain's tickets, MG-18, the team chat and The Lark from one launcher |
| `person-chat` video-call mode | existing | The interview with "Daniel"; needs the proposed freeze and lag effects and a configurable call bar label |
| `alarm-panel` | existing | The team pulse board: five lamps bound to globals, title "Team pulse", footer "Anonymous, updated weekly"; needs a whiteboard skin |
| `container` | existing | Des's desk drawer: the key safe code card, the "photos 2009" USB stick, a spare badge |
| `person-chat`, `phone-chat`, `notes` | existing | Conversations, chats with Lena, Hassan and Bev, the access policy and the leaver checklist as documents |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| Access follows the job | Ama (EX-01) | 60 seconds | Des's access list beside the role template, extras highlighted in turn | none |
| Day one, move day, last day | Ama (EX-01) | 45 seconds | The access lifecycle diagram | "When should Leo's Operations access go?" |
| Checking a new hire | Mei Lin (EX-01) | 60 seconds | The red flags card; "same checks for everyone" | none (assessed in Apply) |
| HR information | Mei Lin (EX-01) | 20 seconds | "Dates and adjustments, yes; diagnoses, no" | none |
| When someone owns up | Ama (EX-01) | 45 seconds | The four-step card: Thank, Act, Support, Learn | none (assessed in Apply) |
| Why can't I look into it myself? (optional) | Mei Lin | 30 seconds | Who decides on monitoring: HR, security and the DPO | none |
| What happens to a fake hire (debrief, hired branch) | Kai (EX-05) | 30 seconds | The sign-in map: three countries in one night | none |

## Debrief

Shown on BE-02, then spoken by Ama and Mei Lin:

1. The access map, Monday against Friday.
2. Each decision, its outcome and any time skip it triggered.
3. Nadia's access against Sol's: before and after.
4. Farida's outcome and the team pulse.
5. The candidate: withdrew, cleared, or contained.
6. Per-outcome results.
7. The line to remember.

Spoken lines stay generic (*"Your team's pulse says a lot about this week"*); the counts and percentages are on screen.

## Variants

- **Micro-drill:** none in the catalogue. "Access or Excess?" (eight request cards, BE-07) could become a quarterly drill timed with each access review later (see Open questions in `README.md`).
- **Text route:** the week as a text story (BE-03). The tickets and the access review are accessible tables with radio buttons; the interview is a transcript with the video described ("The picture freezes. The voice carries on for a moment."); the candidate file is a list of documents, each with "Mark a mismatch". The same decisions, chats, time skips and debrief, as text. About 15 minutes.
- **Facilitated session:** a managers' workshop of 45 to 60 minutes (BE-15, HA-13). The week on a shared screen; the room votes at each decision. Pause points: after the hook (*"Who has copied someone's access to save time? Why is it so tempting?"*); after the interview (*"The agency says start Monday. What do you say to your own manager?"*); after Farida (*"What did your best manager say when you got something wrong?"*); after the access review (*"Which account would you be nervous to remove, and who would you ask?"*). HR teams can run it with the HR-only setting (see Open questions in `README.md`).
- **Replay and randomisation:** the candidate is drawn from a bank (BE-13) of three fake profiles and two genuine ones with awkward circumstances (bad broadband, a career break, a strong accent), so the lesson is always "run the checks", never "spot the type". The access review rows are drawn from a bank of about twenty, keeping the shared login, the service account and a senior person's access in every draw. The Thursday confession rotates between a clicked phish, a misdirected email and a lost phone. Des's hidden items vary (supplier portals, alarm lists, a vehicle fuel card). Annual editions can add the year's recruitment scams.

## Alternative concepts

1. **The Leaver's Shadow (attacker view).** Jo Fairweather (Northlight Security) is hired to test Larkspur's leaver process. For five minutes the player plays Jo (EX-06, BE-11), armed only with what a recent leaver still has: an account on a school booking portal nobody remembered, a key safe code on a laminated card, the shared login everyone knows. They see how far it gets her. Then, as the manager, they close each gap with the checklist. It teaches the leaver list by showing why each item is on it; Jo closes with what would have stopped her, and stays at the level of "this is how little I needed".
2. **Manager's In-tray.** A desk game in the style of *Papers, Please*: access requests, leaver forms, interview reports and HR information requests slide onto the desk over a compressed month, and the player stamps them APPROVE, REDUCE or QUERY against the role cards and policy pinned to the wall. Rules are added week by week (end dates, then separation of duties, then the hiring checks). Fast and replayable; good as the text route's backbone or a drill, less good at the human moments.
3. **Team Pulse (workshop).** A facilitated, card-based format for management development days. Five team members each bring the manager a moment (a clicked link, a lost laptop, a misdirected email, a worry about a colleague, a request to skip training); the group chooses a response, and the pulse board reacts live. It puts the culture lesson at the centre and works for leaders who will never touch an access review.

## Art and audio

- **Rooms:** existing office, small offices, IT, kitchen and meeting room. Props: a whiteboard reskin for the pulse board; bunting, a cake and a card for the leaving do (new small props); the key cabinet (`key_cabinet1`) and an ID badge (`id_badge`) exist.
- **Characters:** Ama, Mei Lin, Owain, Leo and Hassan need their recurring-cast art (shared with many modules). New talk sprites for Nadia, Des and Farida (all on screen and speaking). "Daniel" needs a portrait with freeze and blur frames for the video call. Sol, Bev, the real Daniel and Lena need no art (generic sprite, email and phone only).
- **Voice:** about 25 lines for Ama, 25 for Mei Lin, 10 for Owain, 8 for Leo, 12 for Des, 12 for Farida, 6 for Nadia, 12 for "Daniel" and 4 for the real Daniel (two clearly different voices), and a few for Kai and Tomasz. No voiced line prints a variable: never the player's name, the organisation's name, a count or a percentage. The pulse figures and the access counts are on screen only.
- **Music:** the calm workplace set (BE-21); a quiet sting for each time skip.

## Pitfalls

- **Profiling.** The candidate's nationality, accent or appearance must never be the clue. The clues are inconsistencies and refusals, and the genuine-candidate draws make sure "run the checks" is the only rule that always works.
- **Leavers as villains.** Des is loved and honest. The risk is the forgotten access and the codes, not the person. The export scene resolves kindly when it's handled properly.
- **Surveillance training.** The concern scene teaches managers to raise facts with HR and security, not to watch colleagues. Searching a mailbox is stopped in the story, gently.
- **Punishing the click.** Farida's story must end well when the player responds well, and the blame branch shows silence, not drama.
- **Spreadsheet fatigue.** Twelve rows at most in the review, each with a face and a one-line story.
- **Too much law.** Employment and data protection detail stays light and points to HR and the DPO. Rules differ by country and change (the right to work rules changed on 1 October 2026), so the organisation profile carries the local process.
- **A manager-only lens.** HR staff and senior managers take this module too; the debrief says "your team" without assuming a team size or a job title in speech.
