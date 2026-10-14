# core_13 game design: Workaround

## Concept

It's Friday, half past three. Martin Fletcher, the Sales Director, needs the quarterly client pack at Westmoor Council by nine on Monday: a report, photos, and a video walk-through of the kitchen Larkspur has just refitted at Elmfield House care home. The player is putting it together, and the team file share has slowed to a crawl: "Syncing: about 2 hours remaining". Martin is charming, in a hurry, and has a shortcut for everything, the same shortcuts half the building uses. Every one of them works, today. The cost turns up months later, somewhere nobody is looking.

The module turns on that gap. The player can take the shortcuts, refuse them and stay late, or find the third way: walk over to Owain, who has the approved version of each shortcut ready in minutes, and who fixes the slow share, which it turns out nobody had told him about. The message is that IT is there to help, and that "it's slow" is worth reporting. Two moments carry the module: a USB stick in the car park that turns out to be part of Jo Fairweather's authorised test, and "Where are they now?", a mock documentary that follows each shortcut six months into the future.

## Setting and cast

- **Rooms:** the car park and smoking shelter (**new**, shared with core_10) for the hook; reception (`room_reception`) if the player hands the stick to Maureen; the Operations office (`room_office`), with the player's desk and Martin's corner; the IT service desk (`room_IT`), with Owain's counter, the "Swap Shop" board, the lost-and-found bowl of handed-in USB sticks (`usb_bowl1`), and a scanning PC on its own, labelled "Not connected to the network".
- **Owain Jenkins** (IT service desk lead) explains, and supplies the quick yes. *"Ask us first. We'd rather help than clean up."*
- **Martin Fletcher** (Sales Director) offers the shortcuts. Likeable, not a villain; he comes round by the end.
- **Kev Sutcliffe** (warehouse supervisor) rings about the delivery rota.
- **Jo Fairweather** (ethical social engineer, Northlight Security) reveals the USB test in the debrief.
- **Maureen Gallagher** (reception) takes the stick if the player brings it to her, and rings Owain straight away.
- **Ama Owusu** (mentor) closes the debrief.
- **Ruth Hollis** (**new minor character**, phone only): facilities officer at Westmoor Council, 50s, white English, brisk and friendly. Needs a voice, not art.
- **Callum Reid** (**off screen**): an agency temp in Kev's team who left in March. He appears only as a name on a sharing list.

## Structure

The critical path is marked **(CP)**.

### 1. Hook: "Salary review 2026" (1 minute)

- **(CP)** 13:55, coming back from lunch across the car park. By the bench in the smoking shelter lies a USB stick with a printed label: **"SALARY REVIEW 2026: CONFIDENTIAL"**. Picking it up opens a choice:
  - Plug it into your laptop to see whose it is.
  - Take it home and look at it on your own laptop.
  - Hand it to Maureen at reception as lost property.
  - Take it to the IT service desk.
  - Leave it where it is, or put it in the bin.
- The choice is the baseline for C13-LO1 (C13-B1). If the player plugs it in, the stick shows one spreadsheet that opens to a single line, *"If found, please return to HR"*, and nothing else visibly happens. That is the point, and the debrief comes back to it.
- Owain picks up the thread, whatever they did:
  - **IT desk:** *"Lovely. Into the bowl it goes. Third this month. Got two minutes?"*
  - **Maureen:** Maureen rings him at once, and he wanders over: *"Maureen says you found a stick and didn't plug it in. Good call. Got two minutes?"*
  - **Plugged in:** *"Saw a new USB stick on your laptop. You're not in trouble. Most people do it to find the owner. Got two minutes?"*
  - **Kept it to look at home, left it, or binned it:** later, passing the desk: *"Someone's mentioned a stick in the car park. Anyway. Got two minutes?"* If the stick is in the player's bag, Owain's third chunk ends *"Got one in your pocket? Pop it in the bowl,"* and handing it over then is recorded as a late hand-in.

### 2. Learn: "The quick yes" (2 minutes)

- **(CP)** Owain at his counter (EX-01), with visual aids in the conversation panel (BE-08):
  1. **Why workarounds happen.** A drawing of Martin's monitor covered in sticky notes: "too slow", "too big", "need it tonight". *"Nobody uses a workaround to be naughty. They use it because our way was slow. So tell us it's slow."*
  2. **The four "no"s.** A card: no contract, no control, no backup, no off switch. *"Free tools aren't free. You pay with control."*
  3. **Found a stick?** The bowl. *"Don't plug it in. Not here, not at home. Bring it to us. We'll find the owner without risking anything."*
  4. **The quick yes.** The Swap Shop board, each shortcut next to its approved swap. *"Tell me what you need, not what tool you want. I've usually got one."*
- Check question (MG-20): *"Martin wants to email the client pack to his personal address to finish at home. What's the better option?"* (The work laptop with remote access, or ask IT.)
- **Skip:** *"I've heard this one."* Owain: *"Then you'll fly through this,"* and the check question follows; a wrong answer brings chunks 2 and 4 back.

### 3. Practise: "Swap Shop" (1.5 minutes)

- **(CP)** At Owain's counter, eight shortcut cards (MG-20 single-choice items, styled as cards on the board). For each, the player picks the approved swap from three. Feedback is immediate, with one line of why:
  1. "Email it to my personal address to finish at home." (The work laptop and remote access.)
  2. "Use a free transfer site for a big file." (A link from the file-sharing service, to named people, with an end date.)
  3. "Keep the team rota in a free app on someone's personal account." (A shared space in the company workspace.)
  4. "Found a USB stick." (Hand it to IT.)
  5. "Put the photos on my own USB stick for the meeting." (Open them from Larkspur Files on the meeting room screen.)
  6. "Run the team chat on a personal messaging group." (The company chat tool and its phone app.)
  7. "Use a free online form to collect parents' details for the school open day." (Ask IT for the approved forms tool; personal data is core_05.)
  8. "Sync the shared drive to my personal cloud so I can see it on my tablet." (The company's own app on an approved device, or ask IT.)
- The bank (BE-13) holds more: a supplier's free USB stick at a trade show, forwarding a customer complaint to a personal account to read on the bus, a free AI note-taker for a client call (the answer points to core_15's approved tools).
- Two wrong in a row brings Owain back with a one-line nudge.

### 4. Apply: "The Monday pack" (4.5 minutes)

- **(CP)** 15:30, Friday. Martin, by chat and then at the desk: *"Pack to Westmoor by nine Monday, yeah? Report, photos and the kitchen video. You're a star."* The work task bar (BE-18) shows **Finish the pack**, **Get the video to the council** and **Add the council's new delivery slots to the rota**. Opening the pack folder shows the share's sync bar: **"Syncing: about 2 hours remaining"**.
- Four interruptions arrive while the player works, about a minute apart:

| When | What arrives | What it tests | Best response |
|---|---|---|---|
| 15:35 | Martin: *"Share's dying again. Email it to your personal address and finish it on the sofa. Everyone does. I do."* The compose window (MG-01) offers "Me (personal)" in autocomplete | Personal email | Ask Owain for a way to work from home |
| 15:45 | The kitchen video is 2.4GB, too big for email. Martin: *"Use BoxBounce. Free, no sign-up, two minutes."* | A free transfer site | Ask Owain; share it from Larkspur Files (MG-11) with Ruth by name and an end date |
| 16:00 | A padded envelope on the desk: "From Westmoor Council: survey results for your report. Please add them to the pack." Inside, a USB stick and a compliments slip with a phone number | Posted removable media, and checking another way | Don't plug it in. Call Ruth on the number in the client directory (not the slip), then give the stick to Owain |
| 16:10 | Kev rings: *"Need the council's new slots on the rota. It's on that TallyGrid thing Callum set up. The temp. Left in March. Still works, mind."* The rota opens in a free spreadsheet app; its sharing panel (MG-11) shows the owner "callum.r (personal)" and "Anyone with the link can edit". The rota has drivers' names and mobile numbers and two schools' gate codes | Shadow IT already in use; access that never ends | Add nothing there. Tell Kev it needs moving into the team space, and ask Owain to move it and deal with Callum's access |

- **How each one plays out in the moment:**
  - **Personal email.** Sending it works instantly, and Martin says *"See? Done."* Asking Owain: *"Take the laptop home. Remote access gets you onto the share from your kitchen table. And let me look at that sync."* Staying late also works, slowly, and the share stays slow for everyone else.
  - **BoxBounce.** Uploading works and gives a public link that never expires. With Owain's help the player shares it from Larkspur Files: Ruth by name, a seven-day end date, a notice when she opens it. Leaving the link open to "anyone with the link" is possible, and the debrief notices.
  - **The posted stick.** Plugging it in: Larkspur Protect blocks something on the stick and Owain rings, calm as ever. Calling the number on the slip: a pleasant voice says *"Yes, that's from us"*, which proves nothing (the debrief shows why, pointing to core_02). Calling Ruth on the directory number: *"We didn't post anything. We'd email it, wouldn't we?"* Owain puts the stick into the scanning PC: *"Ooh. Not survey results."*
  - **The rota.** Owain: *"Give me ten minutes. I'll move it into a team space so Kev can carry on, and we'll take the link down."* Adding the slots to the free app works, and nothing visible happens. Copying the rota into the player's own account "to be safe" makes one more copy nobody controls.
- **(CP) The quick yes.** If the player went to Owain at any point, he also looks at the share: *"Fixed, by the way. A sync job had stuck. Nobody told us."* Martin, reading over the player's shoulder: *"Right. Why did nobody tell me it was this easy?"* Owain: *"We did. In an email. You forwarded it to your personal account."* If the player never went to Owain, Martin is cheerful (*"Told you. Done by five."*) and the consequences wait for the time skip.
- **(CP)** The pack goes, by whatever route; the task completes.
- **(CP) "Where are they now?"** (BE-16, 45 seconds). A title card in the style of a TV documentary: **SIX MONTHS LATER**. A calm narrator, with captions, follows each shortcut. Every player sees all four: the ones they took are marked "your choice", and the ones they didn't are shown as "the Larkspur where Martin did it instead".
  - **The personal inbox.** In August, a personal email account with the client pack in its sent items was broken into using a password reused from an old breach (core_03). Westmoor received a very convincing invoice (core_11).
  - **BoxBounce.** The free site was breached in July. Old public links, including the kitchen video with two Elmfield House residents in the background, turned up in search results.
  - **The posted stick.** The same envelope reached four other suppliers to the council. One plugged it in, and its systems were down for nine days (core_07).
  - **The rota.** Anyone with the link could still edit it, and so could Callum. In September the free app closed Callum's unused account, and the rota went with it, the week before half-term deliveries.
  - For each approved route the player took, the calm version: *"The secure link expired after seven days. There was nothing to find."* *"The rota lives in the team space. Kev added the half-term slots in October."*

### 5. Debrief (1.5 minutes)

- **(CP) Jo's reveal.** Jo Fairweather at Owain's counter with a tablet: *"That stick in the car park was mine. Authorised test. Ten sticks, one car park."* *"Four were plugged in. Three were handed in. Three are still out there."* *"Most people who plugged one in were trying to find the owner. That's kind. Handing it in is kinder."* The player's own stick is shown on screen as handed in, plugged in or not returned; nobody else is named.
- **(CP)** The debrief screen (BE-02): each decision, the approved swap, and what it led to; the before and after (the car park stick against the posted stick); per-outcome results (`assessment.md`).
- Ama closes: *"Every shortcut today had a proper version, and Owain had them all ready. The trick is walking over."*
- **The line to remember:** *"If the official way is slow, tell IT. Don't build your own way round."*

### 6. Check (1 minute)

- **(CP)** Owain's spot check on The Lark (MG-20): five items from the bank in `assessment.md`, at least one per learning outcome.

### 7. Reference

- **(CP)** The Lark opens the reference card (BE-09): the four steps, the organisation's approved swaps by name (BE-05), and the "Request a tool" link.

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| The car park stick | IT / reception / plug in / take home / leave or bin | LO1 (baseline) | Owain's opening line; Jo's reveal shows the player's own result |
| Personal email | Ask Owain / stay late / send to personal | LO2, LO4 | The personal-inbox vignette; or remote access and a fixed share |
| Free transfer site | Larkspur Files to a named person with an end date / Larkspur Files left open to anyone / the free site | LO3, LO4 | The breach vignette, or "the link expired, nothing to find" |
| Posted stick | Directory call and IT / straight to IT / call the slip's number / plug it in | LO1 | Ruth's "we didn't post anything"; the scanning PC; the four-suppliers vignette |
| Kev's rota | Ask Owain to move it and remove access / refuse but say nothing / add the slots there / copy it to a personal account | LO3, LO5 | Owain's ten-minute move; or the vanished-rota vignette |
| Telling IT about the slow share | Mentions it to Owain / never does | LO4 | The fixed sync job, and Martin's line |

No option shames the player or Martin. Martin's shortcuts are what most offices do; the montage shows what they cost without making anyone a fool, and Martin is the one who asks *"why did nobody tell me it was this easy?"*

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-01 Inbox** | new | Composing the pack email, with "Me (personal)" in autocomplete |
| **MG-11 Sharing settings** | new | The Larkspur Files share (recipient, end date, notice when opened); the free app's sharing panel, with a departed owner and "anyone with the link" |
| **MG-20 Knowledge check** | new | The Swap Shop cards, Owain's check question and the final spot check |
| **MG-27 Work desktop** | new | The player's laptop: the pack folder with its sync bar, the compose window, and messages arriving as notifications |
| **MG-02 Web browser** | new | BoxBounce's upload page and the free app's rota page, if the player opens them |
| `examine` | existing | The car park stick's label; the envelope and compliments slip |
| `person-chat` | existing | Owain, Martin, Jo, Maureen, Ama |
| `phone-chat` | existing | Kev's call, Martin's messages, Ruth on the directory number (MG-04 later) |
| `notes` | existing | The client directory with Ruth's number; the Swap Shop board text |
| `container` | existing | The pack folder on the share, with its sync bar shown as a status note, until MG-27 (which extends it) exists |

Minigames that open without the player clicking an object (Owain's check question, the Swap Shop, the compose window from Martin's message) use BE-19's `#trigger_minigame:<minigame>|<configKey>` tag.

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| Why workarounds happen | Owain (EX-01) | 30 seconds | Martin's monitor of sticky notes | none |
| The four "no"s | Owain (EX-01) | 30 seconds | The four-box card | none |
| Found a stick? | Owain (EX-01) | 20 seconds | The lost-and-found bowl | none |
| The quick yes | Owain (EX-01) | 30 seconds | The Swap Shop board | "What's better than emailing it to his personal address?" |
| Where are they now? | Narrator (EX-05) | 45 seconds | Documentary title cards | none |
| The stick was mine | Jo Fairweather | 20 seconds | Jo's tablet: the test's results | none |

## Debrief

Shown on BE-02, then spoken by Jo, Owain and Ama:

1. Jo's reveal and the player's own stick.
2. Each shortcut, the approved swap, and what each led to six months on.
3. The before and after: the car park stick and the posted stick.
4. Whether the player told IT about the slow share, and what that fixed for everyone.
5. Per-outcome results.
6. The line to remember: *"If the official way is slow, tell IT. Don't build your own way round."*

## Variants

- **Micro-drill:** "Swap Shop" on its own (BE-07): six shortcut cards from the bank and one found-media item. About 3 minutes. A new shortcut each month (BE-13, HA-21), drawn from what the organisation's own IT team sees most.
- **Text route:** the car park described in words, with the same choices; Martin's messages and Kev's call as dialogue; the sharing panels as text lists ("Owner: callum.r (personal). Anyone with the link can edit."); the montage as four short paragraphs. The same decisions, the same record (BE-03).
- **Facilitated session:** the team plays together and votes on each shortcut. Pause points: after the hook (*"Be honest: what would you have done with the stick?"*), after Martin's first shortcut (*"Which of our tools is slow enough that people work round it? Has IT heard?"*), after the rota (*"What's living in someone's personal account here?"*), after the montage (*"Which of these could happen to us?"*). About 40 minutes, with IT invited to answer the "has IT heard?" question live.
- **Replay and randomisation:** the bank holds variants for each interruption (personal cloud sync in place of email; a free form builder in place of the transfer site; a giveaway stick from a trade show in place of the posted one; a team messaging group in place of the rota app) and for the label on the car park stick ("Redundancies Q3", "Bonus payments", "Photos: Christmas party"). The annual edition updates the montage to the year's common failures.

## Alternative concepts

1. **Shadow Hunt.** A spot-the-risk walk round the office (BE-10): a personal storage drive under a desk, a router someone brought from home, a sticky note with a link to a personal share, a team chat group on a wall screen. Each find opens a short conversation with its owner to uncover the need behind it, and the player matches it to the approved swap. The point is curiosity rather than blame. Good for a facilitated session; less pressure from a deadline than the main concept.
2. **Lost Property.** The player covers Owain's counter over lunch. A stream of found items and requests arrives (USB sticks, a phone left in a meeting room, a laptop in the kitchen, "can we use this app?", "the share's slow again"), each needing the right response and the right swap. Quick and replayable; close to the role_03 service desk shift, so it would need care to stay all-staff.
3. **The Leaver, played backwards.** The module starts on Callum's last day and runs forward through the months he worked at Larkspur: every personal share, forwarded email and free account he set up to get his job done is a thread the player finds and closes before it becomes a problem. Strong on "access that never ends"; overlaps with role_05 and core_14, so best as a spotlight edition.

## Art and audio

- **New room:** the car park and smoking shelter (shared with core_10).
- **Props:** a USB stick with a printed label (item sprite); a padded envelope with a stick and a compliments slip; the lost-and-found bowl (`usb_bowl1`); the Swap Shop board (`notice_board1`, redressed); the scanning PC on its own little desk with its "Not connected to the network" sign.
- **UI:** MG-01 compose; MG-11 for the Larkspur Files share and for the free app's sharing panel; the sync bar; the documentary title cards.
- **Characters:** Owain, Martin, Kev, Jo, Maureen and Ama have their own art (shared across modules). Ruth Hollis is phone only (voice, no art); Callum Reid never appears.
- **Voice:** about 22 lines for Owain, 12 for Martin, 6 each for Kev and Jo, 3 for Maureen, 4 for Ama, 3 for Ruth, and 8 for the documentary narrator (a neutral voice, captioned). No voiced line prints a variable: Jo's test figures are fixed in the script, and the player's own result appears only on screen.

## Pitfalls

- **Don't make IT the villain or a scold.** Owain is quick, kind and funny; asking him is always the easiest option in the game, which is the point.
- **Don't shame anyone for a workaround.** Martin is likeable and right that the share was slow. The montage shows consequences, not idiots.
- **Keep the USB reveal kind.** Show only the player's own result; never name colleagues; say why people plug sticks in.
- **No real brands.** BoxBounce and TallyGrid are fictional; check every name and domain before build.
- **Don't teach "delete it and it's gone".** The montage and the concepts say copies persist and IT should handle it.
- **Stay in lane.** AI tools are core_15, downloads core_08, device security core_09, deliberate data theft core_14. Each gets one line and a pointer.
- **The calling-the-slip branch isn't a trap.** The player still didn't plug the stick in, so it is rated Developing, and the debrief explains why the directory number is the one to use.
- **The task can't fail.** The pack always reaches the council; the security side is what the debrief shows.
