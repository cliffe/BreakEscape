# core_04 game design: The Golden Hour

## Concept

A Thursday afternoon on the Operations floor. The player has an ordinary job to finish: Northfield Council's monthly service report, due at half past two, which means pulling figures from the shared drive, collecting a signed printout from Meeting Room 2, getting Martin's sign-off and sending it through the customer portal. Around that job, small things go wrong, none of them announced: files that won't open, a laptop that isn't where it should be, a sign-in prompt nobody started, a colleague's embarrassed confession.

Each incident has a **blast radius** that grows with game time until someone reports it: more emails sent, more folders locked, a laptop opened somewhere unknown, an email forwarded on. The player never sees a gauge; they see what a colleague would see (a phone ringing again, Finance complaining, Martin looking pale). Reporting freezes the spread, and Kai's team pulls it back. After each report, Kai shares their screen for a few seconds to show how far it had got, on the incident spread map (MG-26). At the end, Kai replays the whole afternoon on that map: when each sign appeared, when it was reported, and what each report let the team do.

The hook (Leo's account) shows the mechanic once with Ama and Kai's help; the Apply beat is the afternoon; the debrief is the reveal. The lunch-table story is the replay: *"I spent four minutes finishing a spreadsheet, and Finance lost their whole shared drive in that time."* The lesson is the module's title. Ama: *"First aiders talk about a golden hour. Incidents have one too, and ours is mostly the first few minutes."*

## Setting and cast

- **The Operations floor** (`room_office`): the player's desk, Leo's desk next to it, Lena's corner, a team screen. The game clock starts at Thursday 13:48 (`gameClock`) and runs at real speed unless the learner has paused or slowed it (BE-04).
- **Meeting Room 2** (`room_meeting`): the team laptop's dock and cable, and the printout the player needs.
- **The Finance office** (`small_office_room3_1x1gu`): Hassan's team; its PCs tint amber as the locked folders spread.
- **Kai's security office** (`room_security`): the response board (`command-board`) and the map screen.
- **The corridor to the comms room** (`hall_1x2gu`, with the `room_servers` door): the optional stranger.
- **Ama Owusu** (mentor) explains, and thanks people.
- **Kai Murray** (security analyst, they/them) shows what happens behind the scenes after every report.
- **Leo Brennan** (desk neighbour) is the hook: his account is sending emails he didn't write.
- **Martin Fletcher** (Sales Director) sent the wrong spreadsheet to a prospective client, and would rather not make a fuss.
- **Tomasz Wiśniewski** (DPO), **Precious Adeyemi** (facilities), **Owain Jenkins** (service desk) and **Hassan Qureshi** (Finance) have a line or two each.
- **Lena Fischer** (the player's manager) appears by chat only and sets the task.
- **The stranger:** a generic contractor sprite in hi-vis with a toolbag; unnamed, one short conversation.
- Off-screen: Brookfield Primary's business manager (who rang Leo), Moorside Care Home (whose residents' contacts Martin sent), Northfield Council (the client). All fictional.

## Structure

The critical path is marked **(CP)**. Everything else is optional depth.

### 1. Hook: "Did you send me something?" (1 to 2 minutes)

- **(CP)** 13:50. The player is at their desk with the council report open. Leo rolls his chair over, phone still in his hand: *"Weird one. The business manager at Brookfield Primary just rang to ask why I'd sent her an invoice link. I haven't sent anyone anything."* He turns his screen: a dozen identical emails in his sent items from the last ten minutes. *"Should I say something, or is that overreacting?"* One of those emails lands in the player's own inbox at the same moment (MG-01, light).
- The player chooses (the baseline, C04-B1):
  - *"Ring the security team now. I'll stay with you."* Leo rings 4444, and the player hears his side of a good report: *"Hi, it's Leo in Operations. My email's sending invoices I didn't write. Started about ten minutes ago. A school's had one. I haven't touched anything."*
  - *"I'll report it. You ring the school back and tell them not to click."* MG-09 opens from Leo's conversation (`#trigger_minigame:incident_report|report_leo`, BE-19).
  - *"Change your password. That should stop it."* Leo does, and nothing else. (A new password doesn't sign out sessions an attacker already has, or remove a rule they've set up, and nobody who can do that has been told.)
  - *"Probably spam pretending to be you. I'd ignore it."* Leo goes back to his desk.
- **The spread runs while they decide** (timers from `inc_leo_started`): at +45 seconds, the emails reach a second batch of customers; at +90 seconds, a school's finance officer types her password into the fake page. If it isn't reported, Leo's phone rings again at +60 seconds: *"Now Brookfield say three parents have had it."* That is a second chance to report, recorded as late. With timers off (BE-04), the spread takes one step each time the conversation ends without a report, so the rating still follows what happened, not how fast the learner reads.
- At about +2 minutes Ama arrives with Kai, who carries a laptop. Reported: *"Thanks for telling us, both of you."* Not reported: *"Leo, Kai's just seen your account emailing half the county. Let's sort it."* Leo reports with them. Nobody is told off.

### 2. Learn: "What two minutes looks like" (3 minutes)

- **(CP)** At the player's desk. Kai turns the laptop round to show the blast radius for Leo's account on MG-26 (BE-08 frames are the stopgap until MG-26 is built): the first email at 13:40, Brookfield's call at 13:49, the report, and the rings in between. Kai's voiced line is chosen by the stage reached, with the exact times and counts on screen only:
  - **Reported before the second batch:** *"Reported inside a couple of minutes. It barely got going, and nobody clicked. That's about as good as it gets."*
  - **Reported later:** *"It got out to a lot of customers, and one school typed their password in. So now we're helping them too."*
- **(CP)** Ama explains (EX-01), stepping through aids in the conversation panel (BE-08):
  1. **What counts.** Aid: five icons (accounts, devices, files, data, people). *"Anything that might put information, systems, money or people at risk. Near misses count. Your own mistakes count."*
  2. **The signs.** Aid: the signs table from the reference card, one row lit at a time. *"You don't have to know what it is. You only have to notice it's odd."*
  3. **How to report here.** Aid: the organisation's routes (BE-05). *"Emails, the Report button. Anything else, ring us or use the form. Nights and weekends, the 24/7 desk."*
  4. **What to include.** Aid: two reports side by side, *"Leo's email is being weird"* and Leo's own call from the hook (or a model call, if he didn't make one). *"What, when, where, who, and what you've done. That's it."*
  5. **What not to do.** Aid: four crossed-out icons. *"Don't investigate. Don't delete. Don't switch it off unless we ask. Don't forward it round the office."*
  6. **No blame.** *"Leo did nothing wrong. And if he had, he'd still get a thank you. Fast and honest is all we ask."*
- **(CP)** Kai (EX-05, 30 seconds), with the response board on the laptop: *"Here's what a report lets me do. Lock the account. Sign out every session. Pull the emails out of every inbox. Warn the customers."*
- Ama closes with one check question (MG-20 single item): *"Which of these reports helps Kai most?"* (four sample reports; the right one has what, when, where, who and what's been done).
- **Skip:** *"I've done this before."* Ama: *"Then you'll ace this."* The check question runs; a wrong answer brings the explanation back.
- **Optional topics** in Ama's hub (each under a minute): *"What if I'm wrong?"*; *"What if it's the middle of the night?"*; *"What happens to the person who made the mistake?"*; *"Why can't I just fix it myself?"*; and *"Why is it called the golden hour?"*

### 3. Practise: "Report it or not?" (3 minutes)

- **(CP)** On the player's PC, MG-09 in practice mode. Feedback is immediate; Ama adds a one-line comment.
  1. **Report it or not?** Eight situations, each answered *Report it now* or *Deal with it the normal way*:
     1. A password reset email you didn't ask for. *(Report.)*
     2. The printer says "paper jam". *(Normal. If reported: "Fine to check. That one's a normal ticket.")*
     3. You left your work phone on the bus this morning. *(Report now: it can be locked remotely.)*
     4. A colleague's laptop shows a security warning they've closed twice. *(Report.)*
     5. You sent a list of staff names to the wrong colleague, who deleted it straight away. *(Report: a near miss, and the DPO decides.)*
     6. Your laptop asks to restart for updates. *(Normal: restart it. See core_07.)*
     7. A visitor without a badge is alone in the Finance office. *(Report.)*
     8. A supplier emails asking you to update their bank details. *(Report the email with the Report button. See core_11.)*
     Over-reporting is never marked wrong.
  2. **Two practice reports** on the full form, with each field marked after sending and the ideal report shown alongside:
     - *A USB stick labelled "Payroll" on the car park floor. You've picked it up but not plugged it in.*
     - *The team's shared mailbox has a rule forwarding everything to an outside address nobody recognises. You haven't changed anything.*
     Typical feedback: *"You didn't say where. The team would have to ring you back first."* / *"Good: you said you hadn't changed anything."*
  3. **First moves** (one ordering item): *"Your screen fills with files you can't open and a note asking for payment."* Put in order: leave everything as it is; ring the security team; tell them what you see and what you've done; follow their instructions (such as unplugging the network cable).

### 4. Apply: "The golden hour" (5 to 6 minutes)

- **(CP)** Lena's chat at about 14:00: *"Northfield's monthly report is due at half two. Figures are on the shared drive, the signed printout's in Meeting Room 2, and Martin needs to sign it off before it goes. Thanks!"* The task bar appears (BE-18): **Get the figures from the shared drive; collect the printout from Meeting Room 2; get Martin's sign-off; send it through the customer portal.**
- Four incidents start on a schedule (whether or not the player is looking) and a fifth waits in the corridor. Each is met through the task, has a second sign for anyone who missed the first, and spreads until it is reported. The default order is below; BE-13 shuffles order, timing and details between plays.

| Incident | Starts | First sign (how the player meets it) | Second sign, if not yet reported | Best response | It spreads to (a stage about every minute of game time, or at each task step when timers are off) | What a report lets the team do |
|---|---|---|---|---|---|---|
| **A. Files that won't open** | +15 s | Opening the Northfield folder on the shared drive (`container`): half the files are renamed `.lkd` and won't open, and a new file, `READ_ME_NOW.txt` (`text-file`), says the files are locked | Hassan from Finance, in the team chat: *"Is the shared drive being weird for anyone else?"* Finance's PCs tint amber | Report now; don't retry, restart or delete; use the copy of the figures Lena emailed yesterday | The Finance folder; the HR folder; the customer reports archive | Kai cuts off the Finance laptop that is locking the files (`network-segmentation-map`); the spread stops; files are back from last night's backup by 17:00 |
| **B. The missing laptop** | +60 s | Meeting Room 2: the printout is there, but the team laptop, signed in to the shared mailbox and the customer portal, has gone. Only its cable and dock are left (`examine`) | Lena: *"Has anyone seen the team laptop from MR2?"* | Report it missing now, even though it might have been borrowed | Switched on outside the building; the shared mailbox opened; customer portal files downloaded | Owain locks it remotely, signs out its sessions and wipes it when it next connects |
| **C. A prompt nobody started** | +150 s | The player's phone (MG-07): *"Are you trying to sign in? Larkspur account. Enter the number shown on your sign-in screen."* | A second prompt, then a text with a sign-in code | Deny and report (core_03) | The same password tried on three colleagues; one approves; their mailbox is opened | Owain resets the password and checks where it leaked from; the three colleagues are warned |
| **D. Martin's wrong attachment** | +210 s | Martin, at the player's desk to sign off the report: *"Quick question. If someone had sent the wrong spreadsheet to a prospective client... the Moorside residents' contact list, say, instead of the summary... they could just ask him to delete it, couldn't they?"* | Martin in chat, ten minutes on: *"He's opened it. He said thanks."* | *"Let's report it now, together. I'll open the form."* | Opened; forwarded to the client's sales team; synced to their phones; Moorside hears about it from someone else | Tomasz asks the recipient to delete it and confirm, tells Moorside (whose data it is), and decides with them whether to tell the Information Commission (the ICO); Martin is thanked |
| **E. The stranger by the comms room** (optional) | When the player enters the corridor | The comms room door propped open with a fire extinguisher, and a person in hi-vis with a toolbag: *"Just here for the Wi-Fi survey, mate. They said I could let myself in."* | none | Report it (a polite *"Let me just check with Precious. Would you mind waiting at reception?"* first, if they're comfortable) | Inside the comms room; a small box plugged into a network socket; the box connecting out | Precious finds no booking and walks them out; Owain removes the box |

- **How each plays.** A decision opens at the first sign: a short narrated choice in the conversation panel (`person-chat` with `Narrator:` lines) for A and B, MG-07 for C, and the conversations themselves for D and E.
  - **A:** *Report it now* / *Try opening a file again* / *Restart the PC* / *Delete the READ_ME file* / *Ask Leo if his is the same* / *Use Lena's copy and get on with it*. Retrying, restarting and deleting are recorded (`inc_files_retried`, `inc_files_restarted`, `inc_files_note_deleted`), are never blocked, and are honest material for the report's "what have you done" question.
  - **B:** *Report it missing now* / *Ask in the team chat if anyone's got it* / *Assume someone borrowed it* / *Take the printout and carry on*. Asking first is reasonable for a minute, but the report shouldn't wait for the answer.
  - **C:** *Deny and report* / *Deny* / *Leave it*. There is no number to type, so it can't be approved.
  - **D:** *"Let's report it now, together. I'll open the form."* (Martin fills it in with the player: he owns it) / *"Ask him to delete it, then report it."* (the delay is the problem: Tomasz handles the recipient) / *"I'll report it for you later."* / *"Ask him to delete it. No need to make a thing of it."* (Martin keeps quiet.)
  - **E:** *"Let me check with Precious. Would you wait at reception?"* then report / report it straight away / *"Fair enough, carry on."*
- **Reporting** works from three places: the **Report an incident** tile on The Lark, on the player's work desktop (MG-27), the phone (the form, or the 4444 contact, whose ink asks the same five questions), or in person in Kai's office (Kai asks the five questions). All three set the same globals.
- **After each report,** Kai's acknowledgement arrives in chat with the stage reached, for example *"Got it, thanks. It hadn't left Operations. Locking it down now."*, and an optional *See it* link that opens Kai's screen share of that incident on MG-26 (20 seconds; `open_minigame` from the chat, BE-19). For incident A, Kai adds: *"Found the laptop doing it. Pop in if you want to watch me cut it off."* In Kai's office the player can open the relabelled `network-segmentation-map`; Kai talks them through clicking the orange line to see what it carries, then pressing **Cut off** on Kai's screen: *"At your own desk, the version of this is pulling the cable when we ask. Same idea."*
- Incidents keep spreading while the player writes another report. That is realistic, and the debrief judges each report by what happened between the player noticing that sign and reporting it, not by the order of the reports or by how far the incident had got before the player ever saw it.
- **(CP)** The report goes to the council whatever happened; the task cannot be failed. At about 14:07, Lena: *"Got it, thanks! Bit of an afternoon, wasn't it?"*

### 5. Debrief: "Kai's replay" (2 minutes)

- **(CP)** A time skip to 17:30 (BE-16), Kai's office. The debrief screen (BE-02), then Kai and Ama at the response board.
- **The replay.** The whole afternoon on the incident spread map (MG-26), stepped through with **Next** in about 30 seconds: each incident appears at its first sign, its rings grow, each report freezes them and containment pulls them back. Beside it, a row per incident: **Seen**, **Reported**, **Contained**, **Closed** (times from the board, on screen), and one line on what the report let the team do. An incident the player didn't report shows how far it went and who found it in the end (the monitoring partner, a customer, the end-of-day checks).
- **Before and after:** Leo's account and Martin's attachment, side by side: a colleague's incident each time, and how fast it got reported.
- **Martin.** If he reported, The Lark's news panel shows Ama's message to all staff: *"Thank you to a colleague in Sales who reported a misdirected email within minutes, and helped us put it right. That's exactly how it should go."* If he didn't, Kai shows Moorside's manager's email at 16:30, and Martin, in the doorway: *"I thought I could fix it myself."* Ama: *"You'd have been thanked. Now it's a bigger job, and we'll do it together."*
- **The reports themselves:** each of the player's reports next to the ideal, with what was missing.
- Per-outcome results: Secure, Developing or Not yet (see `assessment.md`).
- **The line to remember** (Ama, voiced): *"If something seems wrong, report it now. You don't need to be sure."*

### 6. Check (2 minutes)

- **(CP)** Kai's spot check on The Lark (MG-20): six items from the bank in `assessment.md`, at least one per learning outcome.

### 7. Reference

- **(CP)** The Lark opens the reference card (BE-09): the six steps, the organisation's own routes and numbers (BE-05), and the five questions a good report answers.

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| Leo's account (hook) | Tell Leo to ring now / report it yourself / "change your password" / "ignore it" | LO2, LO5 (baseline) | Leo's call or the form; his phone ringing again; Kai's map in Learn, at the stage it reached |
| Files that won't open | Report now / retry / restart / delete the note / ask Leo / carry on with Lena's copy | LO1, LO2, LO4 | Finance's PCs tint and Hassan's chat; Kai's acknowledgement and the isolation; the replay shows which folders were lost and restored |
| The missing laptop | Report now / ask in chat first / assume it was borrowed / carry on | LO1, LO2 | Lena's chat; Owain's remote lock; the replay shows whether the mailbox was opened |
| The prompt nobody started | Deny and report / deny / leave it | LO1, LO2 | Owain's reset and his warning to three colleagues; or the replay showing a colleague's mailbox opened |
| Martin's attachment | Report it together now / ask him to request deletion, then report / report it later / "no need to make a thing of it" | LO5 | Martin's thank-you on The Lark; or Moorside's email at 16:30 and Martin in the doorway |
| The stranger (optional) | Polite check, then report / report straight away / let them carry on | LO1, LO2 | Precious walks them out; or the replay shows the box connecting out |
| Every report | Which facts to include, and whether to say honestly what was done | LO3, LO4 | The receipt and Kai's one follow-up question; the debrief puts each report beside the ideal |

No option shames the player. Restarting the PC or deleting the note is common, and the form asks what they did so they can say so; saying so is credited. Martin is never the villain: he is charming, embarrassed and, once he reports, thanked in front of everyone. An incident the player missed is shown calmly in the replay, with who found it and what a report would have changed.

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-09 Incident report form** | new (MVP) | Every report, in practice and in the afternoon. Build notes below |
| **MG-26 Incident spread map** | new (MVP) | Kai's screen share after each report, and the debrief replay. core_04's configuration below |
| **MG-27 Work desktop** | new (MVP) | The player's PC: The Lark's **Report an incident** tile, the inbox, the shared drive and chat in one place |
| **MG-20 Knowledge check** | new (MVP) | Ama's check question and Kai's spot check |
| MG-01 Inbox (light) | new (MVP) | Leo's odd email arriving in the hook; the Report button |
| MG-07 MFA prompts (light) | new (MVP) | Incident C, the prompt nobody started (from core_03) |
| `command-board` | existing | Kai's response board, configured as below |
| `network-segmentation-map` | existing | Kai cutting off the laptop that is locking files; MG-26 extends it |
| `alarm-panel` | existing | Interim spread board for the debrief until MG-26 exists: one multi-state lamp per incident, showing the furthest stage reached |
| `container`, `text-file`, `examine` | existing | The shared drive's folder, the note the locked files leave, the empty laptop dock |
| `phone-chat`, `person-chat` | existing | Team chat, Lena, Kai's acknowledgements, the 4444 line; Leo, Martin, Ama, Kai, the stranger, and the narrated choices |

### The spread: how it is built

Every incident uses the same set of globals, so the board, the map, the debrief and BE-01 all read one source. For an incident `<id>` (`leo`, `files`, `laptop`, `prompt`, `martin`, `stranger`): `inc_<id>_started`, `inc_<id>_seen` (the player met the first sign), `inc_<id>_stage1` to `inc_<id>_stage3`, `inc_<id>_reported`, `inc_<id>_contained` and `inc_<id>_found_late`, plus action globals such as `inc_files_restarted` and `inc_files_note_deleted`.

| Piece | Built with | Exists today? |
|---|---|---|
| Start | A timer from the Apply beat's start (`startOnGlobal: "apply_started"`), or BE-18's interruption schedule | Yes |
| Seen | An event mapping on the first sign (`room_entered:meeting_room_2`, the folder opened, the prompt shown, Martin's conversation) that sets `inc_<id>_seen` | Yes |
| Spread | Three timers per incident with `startOnGlobal: "inc_<id>_started"`, `cancelOnGlobal: "inc_<id>_reported"`, `delayMs` of about 60, 135 and 210 seconds of game time, and `setGlobal` for each stage | Yes (`ui/scenario-timer-dispatcher.js`; precedent: sis02's hydrogen timers) |
| Spread with timers off | Event mappings on `objective_task_completed:<step>` that advance any started, unreported incident by one stage, with the condition `globalVars.timers_off`; BE-18 already orders interruptions by task steps when timers are off | Mappings yes; `timers_off` comes from BE-04 |
| In-world signs | Event mappings on `global_variable_changed:inc_<id>_stage1` with `bark` or `sendTimedMessage`; `tint_objects` on the Finance PCs | Yes |
| Report | MG-09 (or the 4444 ink, or Kai in person) sets `inc_<id>_reported` | MG-09 new; the ink route works today with `#set_global` |
| Containment | Timers starting on `inc_<id>_reported` (20 and 45 seconds) that set `inc_<id>_contained`, and Kai's chat through `sendTimedMessage` | Yes |
| Found late | A timer on `apply_ended` with `condition: "!globalVars.inc_<id>_reported"` that sets `inc_<id>_found_late` | Yes |
| Kai's board | A `command_board` object in Kai's office with a `commandBoard` block (below) | Yes |
| The map | MG-26; the interim is `alarm-panel` in the debrief | Interim yes |

Incident A's first stage, as scenario data:

```json
{
  "id": "files_stage1",
  "startOnGlobal": "inc_files_started",
  "cancelOnGlobal": "inc_files_reported",
  "delayMs": 60000,
  "setGlobal": { "inc_files_stage1": true },
  "showCountdown": false,
  "actions": [
    { "type": "tint_objects", "roomId": "finance_office", "textureKey": "<the Finance PC sprite>", "color": 16756736, "pulse": false }
  ]
}
```

Fairness rules (principle 5 in `features/minigames.md`, and the accessibility plan's section 4.8):

- **Nothing is scored on minutes.** How soon a report came is judged by story events: whether it arrived before the next story event after the player noticed the sign (that incident's next stage, or the afternoon's next interruption). So BE-04's time scale and "timers off" keep every rating fair, and a player who meets a sign late, because they did the task in a different order, isn't marked down for it.
- **No countdown is ever shown.** `showCountdown` stays false; the deadline for the council report is soft (BE-18).
- **The clock waits for the learner** where BE-04's "pause while reading" is on: filling in the form or reading a conversation doesn't advance the spread.
- **Every incident has a second sign**, so someone who missed the first gets another chance.
- **Mappings live on start-room or phone NPCs** (Leo, Lena, Kai's phone contact), because an NPC in a room the player hasn't visited hears no events (`README_scenario_design.md`, "An NPC outside the start room only hears events once its room has loaded").

Kai's board shows only what the security team knows, so it never gives away an unreported incident. A slice of its configuration:

```json
"commandBoard": {
  "title": "LARKSPUR SECURITY: RESPONSE BOARD",
  "subtitle": "WHAT WE KNOW, AND WHEN WE KNEW IT",
  "timeline": [
    { "id": "files_reported", "condition": "globalVars.inc_files_reported === true", "text": "REPORTED: shared drive files renamed and unreadable", "type": "decision" },
    { "id": "files_contained", "condition": "globalVars.inc_files_contained === true", "text": "CONTAINED: laptop FIN-07 cut off; spread stopped", "type": "response" }
  ],
  "statusRows": [
    { "label": "SHARED DRIVE",
      "states": [ { "condition": "globalVars.inc_files_contained", "state": "CONTAINED", "label": "CONTAINED" },
                  { "condition": "globalVars.inc_files_reported", "state": "REPORTED", "label": "REPORTED" } ],
      "default": { "state": "QUIET", "label": "NO REPORTS" } }
  ]
}
```

The recorder stamps each entry with the game time it became true, even while the board is closed, which gives the debrief its Reported and Contained times. The Seen times come from BE-01.

### MG-26 Incident spread map: core_04's configuration

MG-26 extends `network-segmentation-map`, which already draws four zones, the links between them, attack-path arrows and a cut-off action. What core_04 needs on top:

- **Every label from scenario data.** Today the badge ("ACTIVE INCIDENT"), the legend, the intro text and the confirm dialog are written for sis01's hospital, with clinical zones and a dual-authorisation step. The dual-authorisation block becomes optional.
- **Live state.** Each device and link takes its state (quiet, spreading, contained) from global conditions and redraws when they change, as `alarm-panel` already does.
- **Reveal rules.** An incident appears only once it is reported or the debrief has begun, so the map never shows the player something they haven't reported.
- **Replay.** In the debrief, a **Next** button steps through the afternoon in time order, from the board's stamps and BE-01's Seen times. Under reduced motion it shows the final state with a list of events.
- **Text first.** Each device has a text state ("Finance folder: locked, then contained at 14:06"), with a pattern as well as a colour, and the whole map has a list view for screen readers and the text route.

The four fixed slots are relabelled for an office: `external` is **Customers and suppliers**, `enterprise` is **Head office: people and mailboxes**, `clinical` is **Shared drives and systems**, and `legacy` is **Devices away from the office**. One device and one link, in the shape proposed for MG-26's configuration:

```json
{
  "slot": "clinical", "label": "Shared drives and systems",
  "devices": [
    { "label": "Finance folder", "incident": "files",
      "states": [
        { "if": "globalVars.inc_files_contained", "state": "contained", "text": "Locked, then contained" },
        { "if": "globalVars.inc_files_stage1", "state": "spreading", "text": "Locked" } ],
      "default": { "state": "quiet", "text": "Fine" } }
  ],
  "links": [
    { "id": "fin07_drives", "from": "enterprise", "to": "clinical", "label": "Laptop FIN-07 to the shared drives",
      "activeIf": "globalVars.inc_files_started && !globalVars.files_isolated", "cutVar": "files_isolated" }
  ],
  "revealIf": "globalVars.inc_files_reported || globalVars.debrief_started"
}
```

**Cut off** (the existing sever action, relabelled) sets `files_isolated`, which ends the link's spreading state. If the player doesn't come to watch, a containment timer sets it 45 seconds after the report, and Kai does it off-screen.

### MG-09 Incident report form: build notes

**Purpose.** A short, friendly form anyone can fill in within a minute. It records what the learner reported, how complete it was, how soon it came after the sign (in story events), and whether they said honestly what they had done. core_04 is its main user; core_05, core_07, core_09, core_10 and core_14 reuse it with their own categories.

**Ways in:** the **Report an incident** tile on The Lark, on the work desktop (MG-27); the phone's Report app; Kai in person, whose ink asks the same questions; and from a conversation with `#trigger_minigame:incident_report|<configKey>` (BE-19), as when Leo says *"You report it"* or Martin agrees to do it together. Ringing 4444 counts as a report too: the form is for completeness, not the only route.

**The form,** one page on a desktop, one card at a time on a phone, headed *Report an incident*, with the organisation's urgent route beneath (BE-05: *"Urgent? Ring the security team on 4444. Out of hours: the 24/7 service desk."*):

1. **What happened?** A category, one choice, in plain words grouped under five headings: **Accounts and messages** (emails sent that someone didn't send; a sign-in prompt or code nobody asked for; a password reset nobody asked for; I clicked a link or typed my password somewhere odd; an account doing things nobody set up), **Devices** (lost or stolen; a security warning or odd behaviour; something plugged in that shouldn't be), **Files and systems** (files renamed, locked or missing; a message demanding payment; a system stopped working), **Data and mistakes** (information sent or shown to the wrong person; information left somewhere it shouldn't be), **People and places** (someone I don't recognise in a secure area; a secure door or cabinet left open; a lost badge), and **Something else**.
2. **What did you notice?** Evidence chips: facts the player actually saw in play, each shown only if its `showIf` condition holds (*"Half the Northfield files end in .lkd"*, *"A note called READ_ME_NOW.txt appeared"*, *"The team laptop's dock in Meeting Room 2 is empty"*). This keeps the form honest and needs no typing.
3. **Where?** The place (Operations floor, Meeting Room 2, Finance office, comms room corridor, warehouse, away from the office) and the device or system (email, shared drive, a laptop or PC, a phone, the customer portal, paper, not sure).
4. **When did you notice it?** Filled in from the game clock, with a switch for *It may have started earlier*. Not scored.
5. **Who's involved?** Several choices: me, the colleagues in the scene, someone I don't know, not sure.
6. **What have you done so far?** Several choices, including things not to do, so the form itself teaches: nothing yet; told the person involved; unplugged it from the network; switched it off; restarted it; deleted something; forwarded it; tried to open or fix it; changed my password; contacted someone outside Larkspur.
7. **Could personal information be involved?** Yes / No / Not sure. *Yes* and *Not sure* also route it to the DPO (BE-05), with a line saying so.
8. **Anything else?** Optional free text, off by default; if an organisation turns it on, it is never scored and never leaves the browser.
9. **Your details:** filled in with the in-game name and extension.

**Send** works as soon as *What happened?* has an answer, because a quick report beats a complete one. The receipt gives a reference (*INC-3107*) and the organisation's instruction for devices. Then, in a mission, Kai (or Tomasz, for personal data) rings back with **one** question about the most important missing piece (*"Thanks. Where is it?"*), answered with one tap, the way a real security team calls back.

**Which incident is it about?** Every incident in the scenario lists its expected answers. On Send, the form scores each incident that has started and isn't yet reported: 2 points if the category matches, 1 each for a matching evidence chip, place or system, and person. The highest score of 2 or more wins. A tie brings Kai's call-back: *"Thanks. Is this about the shared drive or the laptop?"* A report that matches nothing is recorded as a report of something else, thanked, and never marked wrong.

**Completeness** (0 to 5), one point each: **what** (the category matches, or a matching evidence chip); **where** (place or system matches); **who** (includes the expected person, or *Not sure* where nobody is known); **what you've done** (the ticked items match what the game knows the player did, from globals such as `inc_files_restarted`, or *Nothing yet* when they did nothing); **personal information** (any answer where the expected answer is *Not sure*; *Yes* or *Not sure* where it is yes).

**How soon,** in story events: the minigame counts the story events (that incident's stages and BE-18's interruptions) between the incident's `noticedOn` event and Send, and reports `before_next_event` or `later`; the end-of-Apply timer reports `found_late` for anything never reported. Because stages and interruptions follow the BE-04 clock or, with timers off, the work task's steps, this is fair at every time scale. The stage reached is still recorded, for Kai's lines and the replay.

**Modes:** *practice* marks each field after Send with a one-line comment and shows the ideal report alongside; *mission* shows only the receipt, the call-back and Kai's acknowledgement, and saves the feedback for the debrief; *drill* (BE-07) runs one incident with its spread.

**Configuration,** using the catalogue's keys (`categories`, `fields`, `evidenceChips`, `completeness`, `routes`, `noticedOn`, `followUps`, `assess`) plus `incidents` for matching:

```json
{
  "mode": "mission",
  "routes": { "personalData": "dpo" },
  "evidenceChips": [
    { "id": "lkd_files", "text": "Half the Northfield files end in .lkd", "showIf": "globalVars.inc_files_seen" },
    { "id": "read_me", "text": "A note called READ_ME_NOW.txt appeared", "showIf": "globalVars.inc_files_seen" }
  ],
  "incidents": [
    {
      "id": "files", "activeIf": "globalVars.inc_files_started && !globalVars.inc_files_reported",
      "expect": { "category": "files_locked", "chips": ["lkd_files", "read_me"], "place": "operations_floor",
                  "system": "shared_drive", "people": ["not_sure"], "personalData": "not_sure" },
      "didFrom": { "restarted": "inc_files_restarted", "deleted": "inc_files_note_deleted", "tried_to_fix": "inc_files_retried" },
      "noticedOn": "global_variable_changed:inc_files_seen",
      "stageVars": ["inc_files_stage1", "inc_files_stage2", "inc_files_stage3"],
      "reportedVar": "inc_files_reported",
      "followUps": { "where": "Thanks. Which folder is it?" },
      "assess": { "behaviour": "C04-B2" }
    }
  ]
}
```

**Events and records:** `incident_report_opened`, `incident_report_submitted:<category>` and `incident_report_cancelled`, with the payload `{ incident, category, completeness, eventsSinceNoticed, stageAtReport, route, mode }`. Each submission sends BE-01 an **option** for the incident's behaviour (`before_next_event`, `later`, or `found_late` from the timer) and one for C04-B7 (the completeness score); the module's assessment map turns options into ratings. No free text and no personal data are recorded.

**Accessibility:** native controls with labels and fieldsets; chips are buttons in labelled groups; an error summary at the top; no time limit; a draft survives closing; large touch targets; the accessible mode is the same form in plain HTML for the text route.

**Build route:** generalise `coverage-decision-form` (sections of options, a submit gate, completion actions that write globals) rather than starting again: remove its hard-coded "Meridian Cyber Insurance" header, add multi-choice sections and chips, make sections optional, then add the matching, scoring and call-back, kept in a DOM-free module with node tests (matching ties, honesty checks against globals, scoring at each stage). The catalogue's size, S, holds on that route.

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| What two minutes looks like | Kai (EX-05) | 30 seconds | Leo's incident on the map (MG-26), at the stage it reached | none |
| What counts, and how to report | Ama (EX-01) | 2 minutes | Five icons; the signs table; the organisation's routes; two reports side by side; four crossed-out "don'ts" | "Which of these reports helps Kai most?" |
| What a report lets us do | Kai (EX-05) | 30 seconds | The response board: lock, sign out, pull, warn | none |
| Why "the golden hour"? | Ama (optional) | 20 seconds | none | none |
| What happens to the person who made the mistake? | Ama (optional) | 30 seconds | A quote from the NCSC's culture principles: "learn and improve, not to blame" | none |
| Optional video: "Sixty seconds that matter" | Recorded in engine (EX-02) | 60 seconds | Plays on the Operations team screen (MG-21) | Linked from the reference card |

## Debrief

Shown on BE-02, then spoken by Kai and Ama in Kai's office:

1. **The replay** (MG-26): the afternoon on one map, in order, with Seen, Reported, Contained and Closed for each incident, and one line on what each report let the team do.
2. **Before and after:** Leo's account (hook) and Martin's attachment (Apply), and how quickly each got reported.
3. **Martin:** the thank-you on The Lark, or what happened at 16:30 and what a report would have changed.
4. **The reports:** each one beside the ideal, with the missing piece named.
5. **Per-outcome results.**
6. **The line to remember,** voiced by Ama: *"If something seems wrong, report it now. You don't need to be sure."* Kai: *"And tell us what you did. We're never cross about that."*

Kai's voiced lines are chosen from fixed alternatives by the stage reached (*"It never left the building"*, *"It got out, but not far"*, *"That one ran for a while"*). Exact times and counts are on the board and the map only.

## Variants

- **Micro-drill: "Report it or not?"** (BE-07, about 3 minutes): six quick situations from the bank (BE-13), then one live incident with its spread and a report on MG-09 in drill mode, with feedback. A new incident type each month (a lost badge, a password reset nobody asked for, a parcel of documents left in reception, a supplier's odd invoice).
- **Text route:** the afternoon as a sequence of short scenes. Signs arrive as text; the spread appears as one line between scenes (*"Ten minutes later: Hassan says Finance can't open anything either"*); stages follow the order of the player's choices rather than the clock; the report form is the same in plain HTML; Kai's map is a table. The same decisions and the same record (BE-03). About 10 minutes.
- **Facilitated session:** the map on the big screen. The facilitator starts each incident; tables decide what to do and who reports; a "reporter" from each table fills in the form for the room. Pause points: after the hook (*"Would you have said something? What stops people here?"*), after Martin (*"How would you want a colleague to handle your mistake?"*), and during the replay (*"Which of these would we have missed?"*). 45 minutes with discussion; it also works as a short tabletop exercise for a team.
- **Replay and randomisation:** BE-13 draws the order, the timing, the colleague involved and the details of each sign from an incident bank (a lost badge, a password reset email, a mail rule nobody set up, post delivered to the wrong client, a USB stick in the car park, a printer left with payroll printouts), so colleagues can't pass on the afternoon. The annual edition adds the year's common signs.

## Alternative concepts

1. **Night Shift (the receiving end).** The player sits with Kai for a shift, taking reports from around Larkspur: a vague *"my computer's being weird"*, a perfect report from Leo, a panicky call from Martin. They triage each, ask the questions a good report would have answered, and watch how much time a vague report costs. It teaches what to include by experience, and shows the security team as people who want to hear from you, but gives less practice at noticing.
2. **The Golden Hour board game (team mode).** A facilitated tabletop version for a security champions' session (HA-13): the Larkspur map as a board, incidents as cards that spread a ring each round, and teams spending "report" tokens to freeze them, in the cooperative style of a pandemic board game. Lively and good for discussion, less good as individual evidence.
3. **Cold Case.** A breach was found on Monday; the player and Kai rebuild the previous Friday on a detective board from small clues nobody reported (a mail rule, an empty laptop dock in a photo, a grumpy chat message about the shared drive), working out the moment one report would have stopped it. Strong on signs and reflection; no live reporting, so better as a follow-up or a facilitated session.

## Art and audio

- **Rooms:** all existing (`room_office`, `room_meeting`, `room_security`, `small_office_room3_1x1gu`, `hall_1x2gu`, `room_servers`).
- **Props:** an empty laptop dock with its cable; a PC screen showing renamed files and a `READ_ME_NOW` note (plain, no skulls, no countdown); the comms room door propped open with a fire extinguisher; a toolbag; a small box with a blinking light in a network socket.
- **UI:** MG-09 in The Lark's style; MG-26 in the game's pixel style with patterns and text as well as colour; Kai's board titled *Larkspur Security: Response Board*.
- **Characters:** Ama, Kai, Leo and Martin (recurring, shared art); Tomasz, Precious, Hassan and Owain have a line or two each. The stranger uses a generic contractor sprite.
- **Voice:** about 30 lines for Ama, 25 for Kai, 12 for Leo, 12 for Martin, 3 each for Tomasz and Precious, and two or three barks for Hassan. No voiced line prints a variable: times, counts and reference numbers are on screen only.

## Pitfalls

- **Showing what nobody reported.** A live gauge of unreported incidents would test watching, not noticing. The map reveals an incident only after a report or in the debrief.
- **Turning it into a race.** No countdowns, no seconds on screen, no rating on minutes; stages follow BE-04's clock, which can be slowed or stopped, and the task steps when timers are off.
- **Fear without action.** Every spread is paired with the one thing to do, and the debrief shows what the report changed, not just what went wrong.
- **Blame.** Leo and Martin are likeable and competent, and both are thanked when they report. Nobody "caused" incident A: it came from a laptop in Finance, and the debrief says it doesn't matter who opened what, only how fast it was reported.
- **Punishing over-reporting.** Reporting the printer jam in practice is "fine to check"; a report that matches no incident is thanked.
- **Teaching investigation.** Kai's isolation is shown, not explained in network terms; the player's own version is "unplug the cable if we ask".
- **Too much at once.** Four incidents, staggered, each with a second sign; at most one interruption every 30 to 45 seconds of game time (BE-18).
- **Straying into core_07.** No ransom amounts, no countdown on the note, no "pay" button; the note says the files are locked and gives a contact, and the module stops at "report it and leave it".
- **A form that demands perfection.** Send works with one answer; the call-back asks for the rest.
