# core_06 game design: Need to Know

## Built shape and episode mapping

This module is **not built** (`research/built_episodes_vs_plan.md` §2). It is delivered with core_05 as **E11** (new), a **consequence-flip** episode (R3) at the **proposed new company Carrholme Services** (`carrholme.example`; proposed, to add to `BRAND_SET.md`). Handling information has no natural attacker, so the learner mishandles information in a safe sandbox (the bin, the share dialog, the hidden content) and the flip shows what it exposed; the episode then follows the built shape with a scored defend half and the built debrief view and shared "habit to keep". It uses the built inbox-triage defender, awareness-measure records and concept cards, has a defend-only variant, and feeds new items into the check forms with mirror pairs (`assessment.md`).

The detailed "Need to Know" design below is retained as the episode's content, reparented from the retired Larkspur world to Carrholme Services. The "bin audit" attacker view is optional depth, not the episode's signature. The explainer is the episode host (an information security lead), not a recurring course mentor.

## Concept

It's bid week at Carrholme. Carrholme is bidding to keep its biggest contract, cleaning and facilities for Calderbrook Borough Council's schools for the next five years, and the bid goes in on the council's tender portal at 12:00 on Friday. Martin Fletcher, the Sales Director, is leading it and has borrowed the player for the week because they know the sites. The player's job is to help get the bid pack together and in on time.

The information is the prize: the pricing *is* the bid. So every step of the week is a handling decision: what label it gets, who sees it, how it travels, what's hidden inside it and where it ends up. The module opens with an attacker's view. On Monday evening Jo Fairweather of Northlight Security runs Carrholme's annual authorised "bin audit", and the player helps her go through what Carrholme threw away that day. If they put the old pricing drafts in the recycling that morning, Jo finds them whole.

The twist comes mid-week: Carrholme's partner on the bid sends over a rival bidder's price list by mistake, and Martin wants a look. It's the moment people will talk about at lunch, and it teaches the rule most staff have never been told: information you shouldn't have isn't a windfall.

## Setting and cast

- **Rooms:** the Operations floor (`room_office`); the bid room (`room_meeting`, with a whiteboard of site names); the print and archive room (`room_archive_1x2gu`): the photocopier with secure print, an old desk printer by the door, the strip-cut shredder (`shredder1`), blue recycling bins (`bin*`) and a new prop, the locked grey confidential waste console; the bin store at the loading bay (`small_room_storage_1x1gu`, redressed with wheelie bins and recycling sacks) for the audit; the IT service desk (`room_IT`). No new rooms.
- **Martin Fletcher** (Sales Director) runs the bid: charming, impatient, full of shortcuts, and by Friday persuaded.
- **The information security lead** (a Carrholme staff member) is the episode host and explainer; there is no recurring course mentor (the recurring mentor Ama Owusu is retired).
- **Jo Fairweather** (Northlight Security) runs the authorised bin audit and narrates the debrief.
- **Precious Adeyemi** (Facilities and Building Security Manager) owns the confidential waste contract and the printers; she signed Jo's authorisation and appears in the print room.
- **Mei Lin Zhou** (HR Business Partner) owns the printout left in the tray.
- **Owain Jenkins** (IT Service Desk Lead) takes back the old laptop.
- **Tomasz Wiśniewski** (DPO) has one chat message if personal data is involved.
- **Messages only** (minor, new, no art): Nadia Brooks, bid manager at Glassmere Window Cleaning, Carrholme's partner on the bid; a procurement officer at Calderbrook Borough Council (one email, in a consequence scene). Brightwell Facilities, the rival bidder, never appears.

All organisations, people and domains are fictional and are checked as for Carrholme (`DECISIONS_PENDING.md`, D2). Addresses use the reserved `.example` domain in this plan.

## Structure

The critical path is marked **(CP)**. Everything else is optional depth.

**(CP)** Before the hook, the module's title screen (BE-20) carries a one-line content note (`features/accessibility_and_inclusion.md`, 5.3): *"This module includes confidential and personal information being exposed by mistake."*

### 1. Hook: "Clear your desk" (1 minute)

- **(CP)** Monday, 08:45. Martin at the player's desk: *"Morning! Bid room's ours from nine. Can you clear the old pricing drafts off your desk first? We're on version seven now."* The pile is an object on the desk ("Calderbrook pricing, drafts 3 to 6. CONFIDENTIAL").
- In the print room there are three places to put it: the blue paper recycling bin; the strip-cut shredder; the locked grey console labelled "Confidential waste: anything Internal or above". Each uses `triggerOnInteract` with `confirm_action` (*"Put the drafts in the paper recycling?"*) and `set_global`, which the engine supports today.
- The choice is the baseline for C06-B1. Nothing is said about it yet. A poster by the console (EX-04, "Which bin?") is there for anyone who looks first.

### 2. Learn, part 1: "The bin audit" (attacker view, 1.5 minutes)

- **(CP)** A time skip to 19:30 (BE-16) and a role switch (BE-11): the player is a Northlight trainee shadowing Jo at the bin store. Jo's clipboard holds the letter of authorisation Precious signed (a `notes` document). Jo: *"Precious signed this off. Tonight we find out what Carrholme throws away. Gloves on."*
- Three places to search:
  1. **The recycling sacks** (`container`): the player's drafts, whole, if they chose the recycling; otherwise a printed staff phone list and a canteen menu.
  2. **The shredder bag** (`shredded-document`, 12 strips, `allowRotation: true`): one page of pricing to piece together. It is the player's own draft if they used the shredder, otherwise an older draft someone else shredded. The success message: *"Reconstructed: Calderbrook pricing, draft 5. Hourly rates and margin."*
  3. **The grey console** (`examine`): *"Locked. The contractor empties it and shreds it on site. Nothing for us here."*
- Jo's verdict, chosen by what the player did that morning:
  - Recycling: *"Didn't even need the puzzle. A rival bidder would pay a lot for this."*
  - Shredder: *"Twelve minutes and a cup of tea. Strips go back together."*
  - Console: *"Your drafts? Not a sniff. Somebody else's, though."*
- Then, every time: *"What would've stopped me? That grey box. That's all it takes."* The role switches back.

### 3. Learn, part 2: "Four labels" (Ama, 1.5 minutes)

- **(CP)** Tuesday, 08:30, in the bid room. Jo's one-line audit note is on the table. Ama: *"Jo's note was on my desk at seven. Don't worry. She does this every year, and every year we learn something."*
- Ama explains (EX-01) with two visual aids (BE-08):
  1. **Four labels** (45 seconds): four coloured cards with examples. *"The label tells everyone how to handle it, without a meeting."*
  2. **The handling grid** (45 seconds): the four labels against store, send, share, print and dispose. *"Underneath it all is need to know. Named people, only what they need."*
- **Check question** (MG-20, opened from the conversation with `#trigger_minigame:knowledge_check|<configKey>`, BE-19): *"The bid pricing: which label?"* Answer: Confidential, as the grid shows. Feedback on Restricted: *"Close. At Carrholme, Restricted is for things like board papers on a takeover."*
- **Skip:** *"I know the labels."* Ama: *"Then label this for me,"* and the check question runs.
- **Optional topics** in Ama's hub, each under a minute: *"What if there's no label?"*; *"Isn't Bcc enough?"* (*"Not on its own. For big or sensitive mailings, use the bulk email tool."*); *"What about personal data?"* (one line pointing to Personal Effects and Tomasz); *"Why can't I just use my own email?"* (one line pointing to core_13).

### 4. Practise: "Label It" (2.5 minutes)

- **(CP)** The classification sorter (MG-10). Ten documents slide in one at a time; the player drops each on a label, and four of them ask a follow-up. Feedback is instant: the right label, and one line of why.
  1. The canteen menu: Internal.
  2. The company brochure: Public.
  3. The council's published tender notice: Public.
  4. Staff CVs for the bid: Confidential. Follow-up: *"Nadia at Glassmere asks for them. Send?"* No: she doesn't need them for her section.
  5. The pricing workbook: Confidential. Follow-up: *"How does it reach the council?"* Through the tender portal, not by email.
  6. A board paper about buying a rival firm: Restricted. Follow-up: *"You need a copy for the meeting. Print it?"* Only if it must be on paper: secure print, collected straight away.
  7. A council site plan marked OFFICIAL-SENSITIVE: Confidential at least, and follow the council's handling instructions.
  8. The internal phone list: Internal.
  9. A spreadsheet of care home residents' laundry care notes: Restricted (special category data).
  10. A notice to 200 care home families about a new collection day: the notice itself is Public (it's approved to go out), but the list of families is Confidential. Follow-up: *"How do you send it?"* The bulk email tool, so each family gets its own email; not To, CC or Bcc.
- **(CP)** Two sharing fixes (MG-11): a method statement shared as "Anyone with the link: can edit" (change it to specific people, can comment, with an end date); and a folder shared with Glassmere that also holds the staff CVs (move the CVs out, or share a narrower folder).
- Two wrong answers in a row bring Ama back with a one-line nudge.

### 5. Apply: "Bid week" (5.5 minutes)

- **(CP)** Wednesday to Friday, compressed. A work task bar (BE-18) lists the bid's steps in order: **Glassmere's section; Pricing sign-off; Final checks; Board pack; Final clear-out; Upload by 12:00 Friday.** The tests sit inside the steps, each drawn from a bank slot (BE-13):

| Step | What happens | What it tests | Best response |
|---|---|---|---|
| **Glassmere's section** (MG-11) | Share the method statement folder with Nadia. The dialog opens on "Anyone with the link: can edit". The "Shared by you" list, under a banner reading "1 link open to anyone", also shows "Bid 2021: CVs", open to anyone with the link for five years | Sharing with names; spotting over-sharing | Nadia only, can comment, ends Friday 17:00; close the old CV link and report it |
| **The wrong attachment** | Nadia's reply carries her section and a second file: "Brightwell_Calderbrook_pricing_FINAL". Martin, reading over the player's shoulder: *"Well, well. Open that."* | Information received by mistake | Don't open it; tell Martin it can't be used; tell Nadia; report it to the security team |
| **Pricing sign-off** (MG-01) | Send the pricing workbook to Martin. Typing "Mar" offers "Martin Fletcher (personal)" first, because Martin emailed himself from home last night, then "Martin Fletcher" | Checking recipients | Pick the work address. The personal one shows "External recipient" and *"This attachment is labelled Confidential"* |
| **Martin's train** | Martin by chat: *"Can you send the whole pack to my home email? I'll finish it on the train. Quicker than the VPN."* | Personal accounts | Say no, nicely, and offer the approved way: his laptop and the VPN, which Owain can sort in five minutes |
| **Final checks** (MG-12, Hidden step) | Before upload: the method statement has a comment (*"we can go to 4% margin if pushed"*), a tracked deletion about a dispute with a former subcontractor, and an appendix where a supervisor's mobile number is covered by a black box. The pricing workbook has a hidden worksheet, "Staff rates (named)" | Hidden content | Find and properly remove all four, then export clean copies |
| **Board pack** | Print the pack for the 15:00 sign-off. The print dialog defaults to the old desk printer ("last used"); the photocopier holds jobs until a badge is tapped. In the old printer's tray sits last night's printout with a cover sheet: "Mei Lin Zhou. CONFIDENTIAL. Disciplinary outcome" | Printing; information found | Print to the photocopier and release with the badge; take Mei Lin's printout to her unread, and make sure it's reported |
| **Final clear-out** | Friday, 11:30: the week's drafts (the counterpart to the hook), and in a drawer the 2021 bid team's old laptop | Disposal | Drafts in the grey console; the laptop to Owain at the service desk |

- **How the tests play out:**
  - **The wrong attachment.** If the player hesitates, Martin argues (the sis01 pattern): *"We didn't hack anyone. It landed in our lap."* The player can answer: *"If the council found out we'd used it, we'd be out. And imagine if it were ours."* Martin, after a beat: *"Fine. I'd be livid if it were ours."* When the player reports it, Ama: *"Thank you. I'll ring Glassmere, and we'll tell the council it reached us and nobody opened it. Then nobody can say otherwise."* If the player opens it, Martin reads the bottom line aloud before anyone can stop him, and the consequence follows. Deleting it quietly protects the bid but leaves Carrholme unable to show it never looked.
  - **Martin's train.** Martin takes no for an answer: *"Fair. The VPN's fine. I'm just lazy on a Wednesday."*
  - **Final checks.** MG-12 lists what it finds, and for each the player picks how to deal with it: delete the comment or leave it; accept the change or leave it tracked; use **Redact and remove** (deletes the text) or **Draw a box** (only covers it); **Delete worksheet** or **Hide worksheet**. A "check the result" view (the file as plain text) is there for players who want to be sure.
  - **Mei Lin's printout.** The player can read it, leave it, put it in the recycling, or take it to Mei Lin unread. Mei Lin: *"Oh no. That went to the wrong printer last night. Thank you for not reading it."* The player then picks: *"Will you tell Tomasz, or shall I?"* Either way it is reported, and Tomasz's chat follows: *"Thanks both. A night in an open tray is worth a note. I'll take it from here."*
  - **The laptop.** Owain: *"Ta. We'll wipe it properly. You'd be amazed what's still on these."*
- **Consequences** play out as short time skips (BE-16), each followed straight away by the fix:
  - **"Anyone with the link":** Friday morning. Nadia forwarded the link to her whole team and a freelance estimator who also prices for Brightwell. The access list shows nine viewers. Martin: *"People we've never heard of have opened our method statement. Who are they?"* The player can still close the link and report it.
  - **The rival's pricing opened:** three weeks later the council's procurement officer emails. Glassmere has told the council where Brightwell's pricing went, and asks whether Carrholme used it. Martin and Ama have an uncomfortable call; the debrief explains that a public body can exclude a supplier that accessed confidential information to gain an advantage.
  - **The pack in Martin's personal email:** Thursday morning. Martin left his own tablet on the train, signed in to his personal email. Owain can't wipe a personal account; all he can do is help Martin change his password.
  - **The comment uploaded:** at clarification the council asks whether Carrholme could "go to 4%". Martin: *"They knew our floor. Lovely."*
  - **The hidden worksheet uploaded:** a month later the council's evaluator rings to ask whether Carrholme meant to send its staff's names and pay rates. Tomasz now has a personal data breach to handle (core_05).
  - **Drafts in the recycling or the shredder again:** Jo's written audit report, a week later, lists them.
- **(CP)** The bid is uploaded at 11:42 whatever the player did; the debrief shows the handling side.

### 6. Debrief: "Jo's haul" (1 minute)

- **(CP)** The debrief screen (BE-02) opens on Jo's clipboard: **"What I could have had this week."** One line per lapse: the drafts in the recycling, the shredded page, nine strangers on an open link, a rival's prices that would need explaining, a Confidential bid in a webmail account, the margin in a comment, named pay rates on a hidden sheet, a disciplinary letter in a tray, an old laptop with the 2021 bid on it. Each line the player prevented is struck through with *"Nothing. Good."*
- The hook and the clear-out side by side: the before and after.
- Per-outcome results (see `assessment.md`).
- **The line to remember:** *"Label it. Share it with names. Check it before it leaves. Bin it in the grey box."*

### 7. Check (2 minutes)

- **(CP)** Ama's spot check on the staff intranet (MG-20): six items from the bank in `assessment.md`, at least one per learning outcome.

### 8. Reference

- **(CP)** The staff intranet opens the handling card (BE-09): the organisation's own labels and handling grid (BE-05), the confidential waste and device return routes, and how to report.

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| The old drafts (hook) | Recycling / strip-cut shredder / locked console | C06-LO5 (baseline) | What Jo finds that evening |
| Sharing with Glassmere | Specific people, comment, end date / specific people with edit and no end / anyone with the link | C06-LO3 | The nine-viewer scene, or nothing |
| The old "Bid 2021: CVs" link | Close it and report it / close it only / leave it | C06-LO3 | Jo's haul; Tomasz's thanks if reported |
| The rival's price list | Leave it unopened, tell Martin no, tell Nadia, report / delete quietly / open it | C06-LO5 | Ama's call to the council; or the procurement officer's email three weeks later |
| Pricing to Martin | Work address / personal address (with the chance to correct it at the warning) | C06-LO2 | The warning chip; Jo's haul |
| Martin's train | No, with the approved way / no / send it | C06-LO2 | Martin agrees; or the tablet left on the train |
| Final checks | Remove all four properly / some / none, or cover and hide rather than remove | C06-LO4 | The council's question about the margin, or about the named pay rates |
| Printing the board pack | Secure print and collect / the old printer | C06-LO5 | Jo's haul |
| Mei Lin's printout | To Mei Lin unread and reported / to Mei Lin only / leave it / recycle it / read it | C06-LO5 | Mei Lin's thanks and Tomasz's note |
| The week's drafts (counterpart to the hook) | Locked console / strip-cut shredder / recycling | C06-LO5 | Jo's audit report a week later |
| The old laptop | Owain at the service desk / keep it / bin it | C06-LO5 | Owain's thanks; or a line on Jo's clipboard |

No option shames the player. Martin is the one with the bad ideas, and he comes round; when the player slips, the consequence scene ends with the fix they can still make (close the link, report it, tell Tomasz), and the debrief frames each line on Jo's clipboard as "this is how little an outsider needs".

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| `shredded-document` | existing | The attacker view: 12 strips from a `content` string, `allowRotation: true`, `stateWrites.onComplete` set to a global the debrief reads. Needs the keyboard fix in `features/minigames.md`, section 4, for BE-04 |
| **MG-27 Work desktop** | new (MVP) | The player's computer: the inbox, the file-sharing service (MG-11), the hidden content check (MG-12) and the staff intranet, with Martin's messages as notifications |
| `container` | existing | The recycling sacks; the drawer with the old laptop |
| `examine` | existing | The locked console; the drafts on the desk; Mei Lin's cover sheet (the sheet only, never the letter) |
| **MG-10 Classification sorter** | new (P2) | "Label It": ten documents, the organisation's labels from BE-05, optional follow-up questions per item, instant feedback |
| **MG-11 Sharing settings** | new (P2) | The share dialog (who, permission, end date); the "Shared by you" list with access counts; two practice items and the Glassmere share |
| **MG-01 Inbox** | new (MVP) | Nadia's reply with two attachments (the second shows only its name and a preview line until opened); compose with autocomplete, the "External recipient" chip, the label prompt and "Send securely" |
| **MG-12 Redaction** | new (MVP) | The Hidden step ("Check for hidden content") on a document and a workbook, with both tools ("Redact and remove", "Draw a box") and the Check step; four findings, each with a right and a wrong way to deal with it; a plain-text "check the result" view |
| MG-20 Knowledge check | new (MVP) | Ama's check question and the final spot check |
| `person-chat` | existing | Martin, Ama, Jo, Precious, Mei Lin and Owain |
| `phone-chat` | existing | Martin's messages, Tomasz's note, the team chat |
| `notes` | existing | Jo's letter of authorisation; the "Which bin?" poster; the bid checklist |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| The bin audit | Jo (EX-06, BE-11) | 90 seconds | The haul laid out on the bin store floor | none (the hook's choice is replayed in the clear-out) |
| Four labels | Ama (EX-01) | 45 seconds | Four coloured cards with examples | none |
| The handling grid | Ama (EX-01) | 45 seconds | The grid: four labels against store, send, share, print, dispose | "The bid pricing: which label?" |
| Optional topics | Ama (EX-01) | under a minute each | none, or one card | none |
| Jo's haul | Jo, then Ama | 60 seconds | The clipboard | The line to remember |
| Optional video: "Is it really gone?" | Recorded in engine (EX-02) | 60 seconds | A document's hidden layers peeled back one by one | Linked from the reference card |

## Debrief

Shown on the built debrief view, then spoken by the host (with Jo, in the optional attacker-view version):

1. The "what an outsider could have had" board: each lapse as one line, struck through if the player prevented it.
2. The before and after: the hook's bin choice against the clear-out.
3. The rival's price list: what reporting it did for the company (the council heard it from them first).
4. Per-outcome results.
5. The shared **habit to keep**, quoted word for word as in every awareness debrief: *"When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."*
6. The "On Monday" card and this module's line: *"Label it. Share it with names. Check it before it leaves. Bin it in the grey box."*, then the reporting route and the no-blame line.

## Variants

- **Micro-drill:** "Label It" on its own (BE-07): eight documents from a bank of about fifty, each with a label and a quick "how would you send, share or bin it?", plus one link to fix or one file to check for hidden content. About 4 minutes; each month swaps in the season's documents (year-end accounts, a restructure, a tender).
- **Text route:** each document as a short description with its label choices; the share dialog as a form; the hidden content check as a list of what the file contains, with "remove" or "leave" for each; the bin audit as Jo's narration with the shredded page as strips to put in order by keyboard. The same decisions and the same haul list (BE-03).
- **Facilitated session:** the bid week on a shared screen; the team votes. Pause points: after the bin audit (*"What's in our recycling right now?"*); after the rival's price list (*"What would you have done if your manager said 'open it'?"*); after the final checks (*"Who here has ever sent a file with comments still in it?"*). A print room sweep (BE-10) can run as a team challenge. About 45 minutes with discussion.
- **Replay and randomisation:** each step draws from a bank (BE-13): what is in the bins; which file the partner sends by mistake (a rival's prices, someone's personal data, another client's contract); the hidden content (different comments, a hidden column instead of a worksheet, metadata showing an earlier client's name); the printout in the tray (HR, payroll, a medical note); the device in the drawer (a laptop, a phone, a USB stick). The annual edition can move the bid to another sector.

## Alternative concepts

1. **The Leak (detective).** The bid has lost: the rival undercut Carrholme by exactly 1%, and Martin is sure there's a mole. The player investigates on a detective board and finds there was no mole, just four small leaks: drafts in the recycling, an open link forwarded by a partner, a comment left in a document, and pricing in a personal webmail account. Strong whodunnit energy and a satisfying twist; weaker on practising the right moves, so it would need a "fix the four" ending.
2. **Clear-Out Day (sort and dispose).** Carrholme is moving floors and the player packs up a department: every object (files, drawers, whiteboards, old laptops, USB sticks, sticky notes, archive boxes past their retention date) must go to the right place: the archive, the confidential waste, IT, recycling or kept. Physical, quick and funny (what *is* in the bottom drawer?), and it fits the 2D world; it covers disposal and retention well but sending and sharing only lightly.
3. **Paper Trail (one document's life).** The player follows one board paper from creation to destruction across the building as a board-game path: labelled, stored, shared, emailed, printed, read in a meeting, archived, destroyed. At each square a choice; each mishandling spawns a copy that walks off and turns up on Jo's clipboard. Excellent for facilitated sessions; less like real work.

## Art and audio

- **Rooms:** existing; the print and archive room needs dressing as a print room, and the bin store needs wheelie bins and sacks.
- **Characters:** Martin, Ama, Jo, Precious, Mei Lin, Owain and Tomasz all use their recurring art (shared with other modules).
- **New props:** the locked grey confidential waste console, with a slot and a label; a secure print release panel on the photocopier; recycling sacks; a cover sheet for the printout; the "Which bin?" poster; Jo's clipboard.
- **New UI art:** the classification sorter cards in the four label colours (with text labels as well as colour, for accessibility); the share dialog; the hidden content check view.
- **Voice:** about 30 lines for Ama, 15 for Jo, 15 for Martin, and a few each for Precious, Mei Lin and Owain. No voiced line prints a variable: the nine viewers, the 4% margin and file names appear on screen; Martin's voiced line about the link says "people", not a number.

## Pitfalls

- **Teaching the attacker's technique.** The bin audit shows how little an outsider needs, not how to raid bins: it is authorised, framed by Precious's letter, and ends with what would have stopped Jo.
- **Making labels feel like bureaucracy.** Ama ties every label to a real harm (a lost contract, a burglar's map, a person's privacy), and the module warns against over-labelling.
- **Blaming the player for following Martin.** Martin is the one under pressure; the player is never punished for his ideas, and saying no nicely is modelled with exact words.
- **Gotchas.** The autocomplete shows "(personal)" and the warning chip; the hidden content check lists what it finds; the drafts' label is on the cover. Everything is catchable with what Practise taught.
- **Too many steps.** Seven steps in 5.5 minutes is tight. If playtests run long, move the old CV link and the printout in the tray to the bank as alternatives rather than fixtures. The Friday deadline can't be failed, and BE-23 lets players pause or slow it.
- **Overstating shredders.** The point is "use the locked console for Confidential paper", not "shredders are useless"; the default lets strip-cut shredders take Internal paper.
- **Contradicting core_05 or core_13.** Breach wording and the reporting route must match core_05; personal accounts get one line here and the full treatment in core_13.
- **Accessibility.** `shredded-document` is drag-and-drop only today; it needs the keyboard fix in `features/minigames.md`, section 4, before this module ships.
