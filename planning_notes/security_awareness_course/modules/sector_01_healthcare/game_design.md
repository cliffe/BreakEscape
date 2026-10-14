# sector_01 game design: Ward Round

## Concept

The player is the ward clerk on Ward 12, a 28-bed general medical ward at Beckside General Hospital. The hospital belongs to Beckside Hospitals NHS Trust, one of Larkspur's clients: Larkspur's teams clean the wards and maintain the kitchens. The player has been in post for two months. Today's job is the one every ward clerk knows: get three patients home by two o'clock. Book the transport, print the discharge letters, send the discharge summaries to the GP practice and the care home, and keep the bed board right.

Everything the module teaches arrives inside that job. The ward phone never stops. A nurse runs to an emergency and leaves her smartcard in the computer. A phish lands in the ward's shared mailbox. A much-loved television gardener is admitted to the side room and the whole ward wants to know why. The pathology system goes down at lunchtime and a doctor wants the list "on WhatsApp". A man in a hi-vis jacket walks into the staff corridor. And the care home needs to know what changed before its resident comes home. The module's tension is that the ward clerk must protect patients' information from everyone who doesn't need it, while making sure the people who do need it get it quickly, because both failures hurt patients.

The lunchtime talking points: the record that warns "this record is restricted: access is logged", the debrief's audit list showing exactly who opened the famous patient's notes, the "nephew" Mr Fenwick hasn't spoken to in ten years, and the lunchtime outage run on paper.

## Setting and cast

- **Rooms (the existing hospital set):** Ward 12 (`room_hospital_ward`) with the bays and the side room; the ward's front desk (`room_hospital_reception`, redressed with the ward phone, a shared computer with a smartcard reader, the bed board `hospital_chart_board1` and the red downtime box); the ward corridor (`room_hospital_hall_ward`); the staff-only corridor (`room_hospital_hall`); the staff room (`room_hospital_staff`) with a screen for the video; Rodel's office (`room_hospital_office`); the small information governance office (`room_hospital_cto_office`) for the debrief; the relatives' room (`room_hospital_waiting_1x1gu`). No new rooms.
- **New characters at the hospital:**
  - **Dev Kapoor**, the trust's Information Governance Manager and the module's mentor. 30s, British Indian, neat beard and glasses, lanyard, a clipboard for his monthly ward walkabouts and trainers because he walks the whole hospital. Calm, friendly, a little nerdy. His line: "Every look is logged."
  - **Rodel Bautista**, Ward Manager (charge nurse). 50s, Filipino-British, came to the UK as a staff nurse twenty years ago; short greying hair, navy uniform, a fob watch and reading glasses on a cord. Brisk, fair and quick to laugh; sets the morning's work; handles the conversations a ward manager should.
  - **Dr Patrick Mulligan**, consultant physician and the trust's Caldicott Guardian. 60s, white Irish, half-moon glasses, bow tie. Appears in a short video in the staff room and briefly on the ward round.
  - **Joy Okonjo**, staff nurse. 20s, Black British (Nigerian heritage), newly qualified, rushed and kind. Generic sprite `female_nurse2_v2` with a display name.
  - **Kayleigh Rowntree**, healthcare assistant. 20s, white English, chatty and warm; curiosity gets the better of her. Generic sprite `female_nurse1_v2`.
  - **Patients:** **Mr Arthur Fenwick** (84, bed 4, going home today to Brindle House care home) and **Ros Fairbairn** (70s, a television gardener everyone has seen, admitted to side room 2 after a fall). Bed sprites (`bed1` to `bed6`).
  - **Voices only:** a man who says he is Mr Fenwick's nephew; a woman who says she is Ros's agent; **Teresa Varga**, deputy manager at Brindle House; the pathology lab; **Dr Sam Whitlow**, a foundation doctor, by bleep message.
  - **The man in hi-vis:** generic sprite `male_telecom_v2`, no badge, a USB stick in his top pocket.
- **From Larkspur's recurring cast:** **Zainab Hussain** (Field Service Engineer) comes to fix the ward kitchen's water boiler, the model of a contractor who signs in and expects to be checked.
- **Not used:** sis01's Northgate General and its named characters, and m02's hospital and its named characters. This is a different hospital in a different story.

## Structure

The critical path is marked **(CP)**.

### 1. Hook: "Who's asking?" (1 to 2 minutes)

- **(CP)** 08:05. The player sits down at the ward desk; the ward list is on screen. The phone rings (BE-19). A man: *"Morning. I'm Arthur Fenwick's nephew. How's he doing? What's he in with?"*
- The ward list shows bed 4, Mr Fenwick, with his sharing note: updates to his daughter Claire, who has a password. No nephew.
- The player chooses: tell him how Mr Fenwick is and why he's in; confirm he's on the ward but say nothing more; or say they can't confirm who's on the ward and offer to take a name and number for the nurse in charge (asking for the family password is an equally good route). The choice is the **baseline** for S01-LO3.
- Dev Kapoor, on his monthly walkabout, has heard the end of the call:
  - **Took a message:** *"Nicely handled. Mind if I borrow you for five minutes before the round?"*
  - **Confirmed he's here, no details:** *"You didn't say what he's in with. Good. Even saying he's here can matter. Got five minutes?"*
  - **Shared his condition:** *"No harm meant, and we can put it right. Let's tell Rodel, and I'll show you what I'd say next time."* Calm, practical, no blame.

### 2. Learn: "Every look is logged" (4 minutes)

- **(CP)** Dev at the ward desk with his clipboard (EX-01), visual aids in the conversation panel (BE-08):
  1. **Need to know.** The audit screen for a made-up record, listing who looked, at which parts, and when; Caldicott Principle 4 alongside. *"Every look is logged. Not just who: which parts, and when."*
  2. **Your smartcard is you.** A session banner across a screen: "Logged in: J. OKONJO". *"Your card is you. Anything done in your session goes down as yours."*
  3. **Who's asking.** The phone enquiry flow: on the patient's list? password? if not, take a name and number. *"Not on their list? Take a name and number. A short wait never hurt anyone."*
  4. **Report it.** The trust's reporting route and the red downtime box. *"Odd email, odd visitor, odd screen, or your own slip: tell us straight away."*
- Then the staff room screen plays **Dr Mulligan's video** (EX-02, MG-21, 60 seconds, captioned): *"The duty to share information for a patient's care is as important as the duty to protect it. Check who you're sharing with, then share what they need."*
- **Check question** (MG-20, opened from Dev's line with `#trigger_minigame:knowledge_check|<configKey>`): *"A GP surgery rings for Mr Fenwick's new medicines list. What do you do first?"* (Read it out; refuse; **ring the surgery back on the number in the directory, then send it through the approved route**; ask them to email your personal address.)
- **Skip:** the player can say *"I did my data security training in April."* Dev: *"Then this'll take a minute,"* and goes to the check question. A wrong answer brings the chunk back.
- **Optional topics** in Dev's hub: *"What if I've already looked at something I shouldn't have?"* (30 seconds: tell IG now; it's always better coming from you); *"Can I look at my own record?"* (20 seconds); *"Why can't I just WhatsApp the doctor?"* (20 seconds).

### 3. Practise: "Share or Don't?" and the ward sweep (3 minutes)

- **(CP)** Eight requests, one at a time (MG-20 items). For each: **Share**, **Check first, then share**, or **Don't share: pass it on**. Instant feedback, one line of why.
  1. Mr Fenwick's daughter Claire gives the password and asks how he slept. *(Share a general update.)*
  2. A neighbour asks whether Mr Fenwick is "still in". *(Don't confirm; offer to pass a message on.)*
  3. Brindle House needs his discharge time. *(Check first: ring back through the directory.)*
  4. A police officer at the desk asks for a patient's home address. *(Pass it to the nurse in charge; the formal route unless a life is at risk.)*
  5. A nurse from another ward asks whether her neighbour is on Ward 12. *(Don't.)*
  6. The GP practice asks for the discharge summary. *(Check first, then the approved route.)*
  7. A caller from a newspaper "just wants to confirm a name". *(Don't: the press office.)*
  8. A patient asks for a copy of his own records. *(Pass it to the trust's subject access route.)*
- **The ward sweep** (BE-10, 60 seconds, as part of Dev's walkabout): before the consultant's round, the player spots five risks at the desk: a screen left unlocked facing the corridor; a smartcard in a reader with nobody there; a printed patient list on the counter; the whiteboard showing diagnoses where visitors can read them; an open confidential waste sack. A found and missed summary follows.
- Two misses in a row bring Dev's one-line nudge.

### 4. Apply: "Home by two" (7 to 8 minutes)

- **(CP)** Rodel at the desk: *"Three going home today. Bed 4 back to Brindle House, beds 9 and 15 to their families. Can you get them out by two?"* A work task bar appears (BE-18) with four steps: **book transport; print discharge letters; send discharge summaries; update the bed board.** The ward computer (MG-27) launches the record viewer, the ward's shared mailbox and the intranet.

**10:05, Joy's smartcard.**

- Joy is printing a letter at the ward computer when a monitor alarms in bay 2. She runs, leaving her smartcard in the reader and a patient's record open. The player needs to print Mr Fenwick's letter now.
- The player chooses:
  - **Take Joy's card out, lock the screen, keep the card safe, and print using their own login.** (Best.)
  - **Leave it all as it is and use the other computer.** (Their own work is fine, but an open session sits on a public desk.)
  - **Print the letter quickly in Joy's session.** (The letter goes on the record as Joy's work.)
- Joy comes back ten minutes later. If the player kept her card: *"Thank you. That's the third time this month. I'm asking Rodel about those tap-in readers."* The debrief picks this up: fix the system, not just the person.

**10:20, the shared mailbox.**

- An email in the ward's shared mailbox (MG-01, showing "seen by 14 people"): **"Smartcard certificate expires today. Renew now to keep your access."** The link goes to a lookalike sign-in page (pre-filled, never real details).
- The player can report it through the trust's route and post a warning in the ward chat, delete it, click it, or leave it. Kayleigh: *"Oh, I got that. I just deleted it."* Reporting it is what tells the IG and security teams it got through. If the player clicked and signed in, Dev rings within a minute: *"Saw that. No harm done if we move now."* (core_01's "if you clicked" steps, in one breath.)

**10:30, Zainab.**

- Zainab Hussain arrives to fix the kitchen's water boiler. She signs in at the desk, shows her Larkspur badge and her job sheet, and says: *"Ring our helpdesk if you want to check me. Number's on your contract sheet, not on my sheet."* Checking her politely, or simply signing her in and pointing her to the kitchen, are both fine. She is the contrast for 12:50.

**10:40, the famous patient.**

- Ros Fairbairn arrives in side room 2 after a fall. The whole ward recognises her. Kayleigh leans on the desk: *"You'll never guess who's in side room 2. Look her up. What's she in for?"*
- The player needs Ros's name, date of birth, hospital number and bed for the bed board: the **admin view**. Opening the **clinical notes** brings up the record viewer's warning: **"This record is restricted. Every access is logged and audited. Reason for access: [Direct care] [Cancel]."**
- The player chooses: update the bed board from the admin view and tell Kayleigh why not (*"It's not our business, and it's logged."*); update the bed board and say nothing; or open the clinical notes.
- Kayleigh then admits: *"I already had a little look. Is that bad?"* The player chooses: encourage her to tell Rodel or Dev now and offer to go with her (*"It's better coming from you, and sooner."*); tell Rodel themselves; or keep it to themselves.

**11:00, "Ros's agent".**

- A crisp, friendly woman: *"I'm Ros Fairbairn's agent. How is she, and when's she likely to go home? I need to manage the diary."* This is the **Apply counterpart to the hook**: the same skill, under more pressure.
- The player chooses: don't confirm anything and pass her to the press office (best); confirm Ros is on the ward but say nothing else; or share how she is and when she might go home. Rodel, if told, rings the press office: the "agent" was a reporter.

**11:30, Mr Fenwick's letter.**

- The player takes Mr Fenwick his discharge letter. In passing: *"Somebody rang about me? My nephew? I haven't spoken to him in ten years. Don't tell him a thing."* If the hook went well, this lands as quiet confirmation. If the player shared at the hook, Rodel tells Mr Fenwick what happened, apologises, and logs it with IG; nobody shouts.

**12:30, pathology goes down.**

- A banner on every screen: **"Pathology results system unavailable. Use downtime procedure DP-3: results by phone with read-back."** The record viewer's results tab shows the offline message (the `ehr_status` global; `customMessage`).
- Rodel opens the red downtime box at the desk: paper request forms, the last printed patient list, DP-3.
- Three moments, quickly:
  - Dr Whitlow's bleep message: *"System's down. Can you WhatsApp me the list of who needs bloods?"* Best: print or write the list on the downtime form and take it to him. Sending it on a messaging app or photographing the whiteboard are the unsafe workarounds.
  - The lab rings with a result for bed 6. Best: put the call through to the nurse in charge and fetch the DP-3 form; results are taken and read back by a nurse. (The clerk's job is to route the call, not to take the result.)
  - Kayleigh, phone dead: *"Can I charge my phone off the monitor in bay 3? It's got a USB port."* Best: no, use the charger in the staff room. Never plug anything into medical devices.

**12:50, the staff corridor.**

- A man in a hi-vis jacket follows someone through the staff-only door and heads for the ward office, where the spare computers are. *"IT. Here to sort the system out."* No badge; a USB stick in his top pocket.
- The player chooses: a polite challenge (*"Can I help you? Have you got your ID? I'll just ring IT to let them know you're here."*), then a call to IT through the switchboard (best; IT has sent nobody, and security walks him out); or call security straight away without speaking to him (also good); or let him into the office because "the system is down, after all"; or ignore him.

**13:15, Brindle House.**

- Teresa Varga, deputy manager at Brindle House: *"Arthur's coming back to us today. Can you tell me what's changed with his tablets, and when transport's coming? Our email's playing up, so use my personal address."*
- The player chooses:
  - **Ring Brindle House back on the number in the directory, then send the discharge summary through the approved secure route to the home's registered address, and give the transport time on the call.** (Best: the duty to share, done safely.)
  - **"I can't share anything over the phone."** (Safe for the data, unsafe for Mr Fenwick: Teresa's team won't know his new tablets tonight.)
  - **Read the medicines list out straight away.** (She is genuine, but it wasn't checked.)
  - **Email it to her personal address.** (Health data on an account nobody controls.)

**14:00, home by two.**

- **(CP)** The discharges are done; the task completes whatever happened along the way, and the debrief shows the information side.

### 5. Debrief (2 minutes)

- **(CP)** In the IG office, Dev opens the audit for Ros Fairbairn's record (`forensic-data-platform` table, EX-05, 30 seconds): seven accesses this morning. Three by her care team (clinical notes, fine); one by the ward clerk (admin view, fine); one by Kayleigh (clinical notes, no care role: flagged); two by staff on other wards (flagged). If the player opened the clinical notes, their own line is there too, and Dev asks calmly: *"Was that for her care?"* The player can tell him then (recorded as a late self-report).
- **Dev:** *"Every look is logged. We check famous patients' records every day they're here."* (On-screen text names the hospital's policy, BE-05.)
- **The debrief screen** (BE-02): each moment, what the player did, what good looks like, and what happened: the nephew and Mr Fenwick; the agent who was a reporter; Joy's card and her request for tap-in readers; the phish (reported or not, and how many others clicked); Kayleigh's conversation with Rodel; the outage; the man in hi-vis; Brindle House and Mr Fenwick's tablets.
- **The before and after:** the nephew call beside the agent call.
- **Per-outcome results:** Secure, Developing or Not yet (see `assessment.md`).
- **The line to remember:** *"Look only at what you need. Share what care needs. Check who's asking. Report anything odd."*

### 6. Check (2 minutes)

- **(CP)** Dev's "IG spot check" on the intranet (MG-20): six items from the bank in `assessment.md`, at least one per learning outcome.

### 7. Reference

- **(CP)** The ward card on the intranet (BE-09), with the organisation's own phone enquiry rules, reporting route, downtime procedure and contacts (BE-05).

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| The nephew (hook) | Take a message or ask for the password / confirm only / share | LO3 (baseline) | Dev's line; Mr Fenwick at 11:30 |
| Joy's smartcard | Card out, lock, own login / leave it / use her session | LO2 | Joy's thanks and her tap-in request; or a letter on record as Joy's work |
| Shared mailbox phish | Report and warn / delete / click / ignore | LO6 | IG's count of clicks on the ward; or Dev's call |
| Ros's record | Admin view only, explain to Kayleigh / admin view, silent / clinical notes | LO1 | The audit list in the debrief |
| Kayleigh's admission | Encourage her to tell, offer to go with her / tell Rodel yourself / keep quiet | LO1, LO6 | Kayleigh's conversation with Rodel; or her name alone on the audit with no explanation |
| The agent | Press office / confirm only / share | LO3 | The press office's call back: it was a reporter |
| The bloods list | Downtime form / messaging app / photo | LO5 | The paper list arrives; or a ward list on a personal phone noted in the debrief |
| The lab's call | Put through to the nurse in charge / take it yourself | LO5 | The read-back done properly by the nurse |
| Phone charging | No, use the staff room / yes | LO5 | Dev's one line in the debrief |
| The man in hi-vis | Challenge and check / call security / let him in / ignore | LO6 | Security walks him out; or he's found at a computer with his USB stick |
| Brindle House | Ring back, then the secure route / refuse / read it out / personal email | LO4 | Mr Fenwick's evening at Brindle House with the right tablets; or a missed dose noted by Teresa next day (BE-16) |

No option shames the player. Where a choice goes wrong, a colleague helps put it right, and the debrief frames it as "this is how it usually happens; this is what would have changed it".

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **Patient record viewer** (proposed, from `ehr-terminal`) | existing base, needs work | Patient list, search, admin view and clinical notes view, the restricted-record warning with a reason, the session banner, and the offline mode for downtime. `ehr-terminal` (`public/break_escape/js/minigames/ehr-terminal/`) already has the list, the record panel, the offline mode driven by `ehr_status` and a configurable `customMessage`; it needs a configurable title (its "NORTHGATE TRUST" header is sis01's), per-record open events for BE-01, search, the two views and the warning |
| **MG-27 Work desktop** | new | The ward computer: one launcher for the record viewer, the shared mailbox and the intranet, with the logged-in name across the top |
| **MG-01 Inbox** | new | The ward's shared mailbox, with "seen by" counts and the Report button |
| **MG-04 Voice calls** | new (P2) | The ward phone, transfers to the nurse in charge, and the directory for call-backs. Until it exists, calls run as `phone-chat` phone NPCs |
| **MG-20 Knowledge check** | new | Dev's check question, "Share or Don't?" and the final check |
| **BE-10 Spot-the-risk** | new | The ward sweep |
| `forensic-data-platform` | existing | The record access audit in the debrief (a table with flags, then a confirm step to close it) |
| `notes`, `examine`, `person-chat`, `phone-chat` | existing | The downtime procedure DP-3 and the phone enquiry sheet; the smartcard in the reader and the USB stick; conversations; bleep messages |
| **MG-17** single-call mode | optional | A "Who's asking?" checklist beside the ward phone, if the desk is built for role_03 and role_06 |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| Need to know; every look is logged | Dev (EX-01) | 45 seconds | The audit screen; Caldicott Principle 4 | none |
| Your smartcard is you | Dev (EX-01) | 30 seconds | The session banner | none |
| Who's asking? | Dev (EX-01) | 30 seconds | The phone enquiry flow | none |
| Report it | Dev (EX-01) | 20 seconds | The reporting route; the downtime box | none |
| The duty to share | Dr Mulligan (EX-02 video on MG-21) | 60 seconds | Caldicott Principle 7 on screen, captions and transcript | "What do you do first?" (the GP call) |
| What if I've already looked? (optional) | Dev | 30 seconds | "Tell IG now" | none |
| Every look is logged (debrief) | Dev (EX-05) | 30 seconds | The audit table for Ros's record | none |

## Debrief

Shown on BE-02, then spoken by Dev and Rodel:

1. The audit list for Ros's record.
2. Each moment, its outcome and any time skip.
3. The nephew against the agent: before and after.
4. Joy's request for tap-in readers: the system fix.
5. Per-outcome results.
6. The line to remember.

Spoken lines say "the hospital" and "the ward", never the organisation's name, so BE-05 can rename it on screen. Counts are on screen only.

## Variants

- **Micro-drill:** "Share or Don't?" (BE-07): eight requests drawn from a bank of about forty, plus one ward sweep picture. Monthly through the year (HA-21), with a new kind of caller each quarter (BE-13). About 4 minutes.
- **Text route:** the shift as a text story (BE-03). The record viewer as an accessible table with "Open admin view" and "Open clinical notes" buttons and the same warning; calls as transcripts; the ward sweep as a list of described items to mark; the same decisions, audit and debrief. About 12 minutes.
- **Facilitated session:** a ward team huddle of 30 to 45 minutes (BE-15, HA-13), good for a protected learning afternoon. Pause points: after the hook (*"Who do we give updates to on this ward, and how do we know?"*); after the famous patient (*"What would you say to a colleague who says 'just a quick look'?"*); after the outage (*"Where is our downtime box? When did we last open it?"*); after Brindle House (*"When has not sharing caused a problem here?"*).
- **Replay and randomisation:** the callers, the phish lure, the system that fails (the patient record, pathology, e-prescribing) and the stranger's story (IT, estates, "a new locum") are drawn from banks (BE-13). The well-known patient varies: a footballer, a local MP, a soap actor, and (the commonest real temptation) a colleague admitted as a patient.
- **Editions** (later, BE-13): a GP practice reception and a care home, which also serve DSPT categories 3 and 4.

## Alternative concepts

1. **The Audit Trail (detective).** The player is an information governance officer the morning after a famous patient's admission. The audit shows nine people opened the record. Using rotas, care team lists and short interviews, the player works out which accesses were for care and which weren't, and applies fairness before blame (was there a system reason, such as a shared login or a mislabelled list?). Built on `forensic-data-platform`. It teaches need-to-know and just culture from the other side of the screen, and suits managers and IG leads.
2. **Paper Day (business continuity).** A whole module set during a 24-hour outage after a fictional supplier attack (inspired by, not copying, Synnovis). The ward keeps going on paper; at each step the player chooses between the downtime procedure and a tempting workaround, and a time skip shows the recovery and what each workaround cost. Strong for clinical staff; lighter on phone enquiries and curiosity.
3. **Mystery Caller.** The trust has hired Northlight Security, and Jo Fairweather has spent a week ringing wards as relatives, journalists and "the police" (EX-06). The player listens to five of her recordings, marks where each ward clerk held or slipped, then takes three calls of their own. Funny, memorable and quick; best for receptionists and ward clerks, less so for clinicians.

## Art and audio

- **Rooms:** the existing hospital set, lightly redressed: the ward desk (phone, computer with a smartcard reader, bed board), a "Side room 2" door sign, the red downtime box.
- **New props:** a smartcard in a reader (small), the downtime box, a phone charger in the staff room.
- **Characters:** Dev Kapoor (the mentor: new dialogue bust, talk sheet or visemes, eight-direction walk) and Rodel Bautista (new art, on screen and speaking). Dr Mulligan needs a portrait and talk sheet for the video (a walk sprite only if his ward round cameo stays). Joy and Kayleigh use the generic nurse sprites with their existing talk and viseme sheets; the man in hi-vis uses `male_telecom_v2`; Zainab uses her recurring-cast art; patients use bed sprites.
- **Conversation backgrounds:** reuse m02's ward backgrounds if they carry no m02 signage; otherwise new ones through the `room-pov-background` skill after dressing.
- **Voice:** about 30 lines for Dev, 12 for Rodel, 8 for Dr Mulligan, 10 for Kayleigh, 6 for Joy, 4 for Zainab, and about 20 across the callers. No voiced line prints a variable: never the player's name, the organisation's name, a count or a ward number that changes per play.
- **Sound:** the calm workplace set (BE-21) with soft ward ambience (monitors, trolleys, a distant call bell), kept low and optional (BE-04).

## Pitfalls

- **Over-caution.** Refusing to share is assessed as a gap, not a pass. The Brindle House call exists so that "say nothing to anyone" is visibly wrong.
- **Clinical accuracy.** The ward clerk routes clinical calls and doesn't take results or make clinical decisions. A nurse and a ward clerk review the script before the build.
- **Fear.** The audit is shown plainly, with consequences stated, not staged. No dismissals or police on screen.
- **Blaming Joy.** A card left in a reader is often a system problem (too few terminals, slow logins). The debrief says so.
- **Jargon.** Smartcard, IG, Caldicott Guardian and downtime are explained the first time they come up.
- **Going out of date.** The DSPT changes every year and NHSmail's reporting route changes too; both are organisation slots, reviewed with each DSPT release.
- **Real people.** Ros Fairbairn is fictional and must not resemble a real presenter or any real case of record snooping.
- **Teaching the wrong thing by showing it.** Unsafe workarounds are offered as choices but never shown in detail (no realistic patient list on a phone screen).
- **Mixing canons.** No Northgate, no infusion pumps, no SIS crisis framing: the outage is an ordinary, frustrating lunchtime on a ward.
