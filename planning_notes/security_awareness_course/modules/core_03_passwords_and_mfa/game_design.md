# core_03 game design: Keys to the Kingdom

## Concept

It is Tuesday, 02:13, and the player's phone lights up on the bedside table: someone is signing in to their Larkspur account, and the authenticator wants a number. Then another prompt, and another, and then a friendly message from "IT Support" with a number to type "to make them stop". Whatever the player does becomes the baseline, and the rest of the module follows from that night.

The next morning, Owain at the service desk explains how the attacker had the right password (an old trade show site was breached, and the password was reused) and fixes the cause with the player, in the player's own tools: a password manager with one good passphrase, a unique password for every account, made-up answers to security questions, and a passkey. Then the player gets on with an ordinary job, collecting stock figures from the warehouse, where the same risks look like shortcuts: a password on a sticky note, a login everyone shares, a supplier portal to sign up to, a sign-in prompt that turns up just when one is expected, and a supervisor who uses one password for everything.

The title is literal by the end. Kev, the warehouse supervisor who distrusts computers, swaps his sticky notes for a security key on his keyring: *"A key. Finally, something that makes sense."*

## Setting and cast

- **The bedroom at night:** a conversation background only (a dark room, a phone glowing on the bedside table, a clock reading 02:13). No room is built; the scene plays in the conversation panel before the player arrives anywhere.
- **The IT service desk** (`room_IT`): Owain's desk with two monitors, a box of security keys and an "Ask us first" poster (EX-04). Learn, Practise and the debrief happen here.
- **Kev's warehouse office:** `small_office_room2_1x1gu`, redressed with hi-vis jackets on hooks, a wall planner, a kettle, and the shared warehouse PC by a window onto the loading bay. If core_07's warehouse floor exists, the office opens off it. `hall_1x2gu` links it to the service desk.
- **Owain Jenkins** (IT Service Desk Lead) explains, fixes and brings Kev his key. *"Ask us first. We'd rather help than clean up."*
- **Ama Owusu** (mentor) passes the service desk in the morning to thank the player, and closes the debrief.
- **Kev Sutcliffe** (Warehouse Supervisor) uses one password for everything "because it's easier", and becomes the warehouse's convert.
- **Lena Fischer** (the player's manager) appears by chat only and sets the task.
- **Jas on the night desk:** a new minor character, the calm voice of Larkspur's outsourced 24/7 service desk; voice and phone only, no art. Fortyish, from Bradford; voice note for the voice bible: unhurried, kind, northern.
- **"IT Support":** the attacker, as text only, from an unknown mobile number with the Larkspur logo as its picture. No art, no voice.

## Structure

The critical path is marked **(CP)**. Everything else is optional depth.

### 1. Hook: "02:13" (1 to 2 minutes)

- **(CP)** Black screen; caption *Tuesday, 02:13*. The bedroom fades in; a caption reads *[phone buzzing]*. The authenticator (MG-07) opens by itself (BE-19): **"Are you trying to sign in? Larkspur account. Rotterdam, Netherlands (approximate). Enter the number shown on your sign-in screen."** with a two-digit field, **Deny** and **Deny and report**. There is no sign-in screen, so there is no number.
- Twenty seconds later, a second prompt. Then a chat message from an unknown number with the Larkspur logo: *"Hi, IT Support here. Sorry for the late one! We're fixing a sync fault on your account tonight, so you'll get a few sign-in prompts. To stop them, just enter 47 in the app. Thanks for your patience!"* The third prompt's number is 47.
- The player can type 47, deny each prompt, deny and report, call the 24/7 service desk from their contacts, reply to "IT Support", or turn the phone face down. Nothing forces a choice: a prompt arrives every 20 seconds up to five, then they stop. The first decisive action is the **baseline** for C03-LO5.
- Outcomes:
  - **Reported** (in the app, or by calling): Jas, on the phone or as a text: *"Thanks for letting us know. Someone's got your password, so I've blocked those sign-ins. Owain will sort you out in the morning. Go back to sleep."*
  - **Denied or ignored:** the prompts stop at 02:19. Nothing else happens tonight.
  - **Typed 47:** *"Approved."* Two minutes later Jas rings: *"Larkspur service desk. We've just seen your account sign in from the Netherlands. Was that you?"* The player can say *"I typed a number IT sent me"* or *"I'm not sure, I was half asleep."* Jas: *"Thanks for telling me. That wasn't us. I'm locking it now."* (The monitoring partner flags the impossible journey; the account is locked within minutes.)
  - **Replied "Is this really IT?":** *"Yes! Ticket INC-4471. Just enter 47 please."* The reply changes nothing; the debrief explains why asking the sender proves nothing.
- Caption: *The next morning.*

### 2. Learn: "How did they get it?" (2 to 3 minutes)

- **(CP)** `room_IT`, 08:45. Owain has made two teas. His first line depends on the night:
  - **Reported:** *"Quarter past two and you hit report. Spot on. They had your password, but they never got in."*
  - **Denied or ignored:** *"Five prompts you didn't start, and you didn't let one through. Good. Next time, report them too. A prompt you didn't start means someone has your password."*
  - **Typed 47:** *"Don't worry about last night. Honestly. It's built to wear you down. You told Jas straight away, and that's what counted."*
- Ama passes with a coffee (multi-speaker). **Reported:** *"Thanks for telling us. At two in the morning, too."* **Denied or ignored:** *"Next time, tell us as well. Someone's always on, even at two."* **Typed 47:** *"Thanks for telling Jas. I fell for a phish in my first security job. Telling someone is the bit that matters."*
- **(CP)** Owain explains (EX-01), with visual aids stepped through in the conversation panel (BE-08):
  1. **What happened.** Aid: two padlocks, "Password: correct" and "MFA: denied" (or "approved, then locked"). *"Someone typed your real password, from a rented server abroad. The only thing in the way was your phone."*
  2. **Where passwords come from.** Aid: four tiles: phished, reused, guessed, stolen by malware. *"Most of the time, it's reuse."*
  3. **The breach.** Aid: the monitoring partner's alert. *"Your work address was on a list from a trade show booking site, breached last spring. Same password there?"* The player answers *Probably*, *I don't think so* or *No idea*; Owain's reply is the same to all three: *"Doesn't matter now. We'll make every one different."*
  4. **The three habits.** Aid: the top of the reference card. *"One: a different password for everything, and a manager remembers them. Two: MFA everywhere, with a passkey if we can. Three: if you didn't start it, don't approve it."*
  5. **The message.** Aid: the 02:13 message, annotated (an unknown number, a number to type, "sorry for the late one"). *"We will never send you a number to type. Nobody genuine will. That number came off their screen."*
- He closes with one check question (MG-20 single item): *"At three in the morning your phone asks you to approve a sign-in you didn't start. What does that tell you?"* (Someone has your password / IT is doing maintenance / Your phone has a glitch / Nothing, if you press Deny.)
- **Skip:** *"I know all this."* Owain: *"Then this'll be quick."* The check question runs; a wrong answer brings the explanation back.
- **Optional topics** in Owain's hub (each under a minute): *"Why not change it every month?"*; *"Is saving passwords in my browser OK?"*; *"Can I write it down?"*; *"What's a passkey, really?"*; and **"The guessing rig"** (EX-06, light): Owain turns his second monitor round. A ticker tries `123456`, `password`, `liverpool`, `ashley`, `Larkspur2026!`, `Summer2026!`, striking each through as guessed; then a three-random-words passphrase that is still being tried when he switches it off. *"Not clever. Just patient. Words beat tricks."* It shows the order attackers guess in, never a tool or a method.

### 3. Practise: "Lock it down" (3 minutes)

- **(CP)** At Owain's desk, on the player's laptop: MG-08, then MG-07. Feedback is immediate, with a one-line comment from Owain.
  1. **The manager's passphrase.** *"The vault needs one good passphrase. Roll some words."* The builder deals three word tiles from the game's word list; the player can re-roll as often as they like or add a fourth word. Then a tempting step, *"Make it more memorable?"*, offers chips: *add your birth year*, *add your dog's name*, *swap o for 0*, *add !*, *add another word*, *no thanks*. The meter and the guesser beside it show what each really adds: personal details and swaps barely move it; another random word moves it a long way. A line stays on screen throughout: *"This game will never ask for a real password. These words are for this game only."*
  2. **Vault health.** The vault opens with the player's (fictional) accounts: work account and email, personal email, a shopping site, a streaming service, the bank, a council parking app. Flags: *Reused on 5 accounts*, *In a known breach (trade show site)*, *Weak*. The player presses **Generate** on each. Before the first, the vault asks *"Which first?"*; email is the answer Owain is hoping for: *"Email first. It can reset everything else."* Ledger, the finance system, is not in the vault, and nobody notices yet.
  3. **Security questions.** The shopping site asks *"Name of your first pet?"* The player can give the true answer, a made-up one the manager generates (`velvet otter crane`), or skip. The made-up answer is stored with the login.
  4. **Sign-in protection** (MG-07 enrolment). *"How do you want to sign in to Larkspur?"* Three cards in ladder order: **Passkey on this laptop** (recommended), **Authenticator app with number matching**, **Text message**. A passkey runs a test sign-in (fingerprint or PIN, pre-filled). Then Owain's twenty-second demo: a lookalike page, `thelark.larkspur-login.co.uk`, asks for the passkey and the laptop answers *"No passkey for this site."* *"That's the point. It only works on the real one."*
  5. **"Approve or Deny?"** (MG-07 practice). Six phone screens with a line of context each, answered **Approve**, **Deny** or **Deny and report**:
     1. You've just pressed Sign in at your desk; the screen shows 38 and the app asks for a number. *(Type 38.)*
     2. You're in a meeting, not signing in to anything; a prompt arrives. *(Deny and report.)*
     3. It's 23:40 and this is the third prompt in a minute. *(Deny and report.)*
     4. You're signing in to the supplier portal; a second prompt arrives at the same moment, for a different service, from abroad. *(Deny and report that one; approve your own.)*
     5. A chat message: *"IT here, type 12 into the app to finish your update."* *(Deny and report.)*
     6. You've signed in on your new work phone; the prompt shows your town and the number on your laptop matches. *(Approve.)*
  Two wrong in a row brings Owain: *"If you didn't start it, it's a no."*

### 4. Apply: "Stock check" (5 minutes)

- **(CP)** Lena's chat: *"Morning! Can you grab this week's stock figures for the care home orders off Kev's PC, and check Northbeck's delivery dates on their new portal? Summary to me by 12, please."* The task bar appears (BE-18): **Get the stock file from the warehouse PC; check delivery dates on Northbeck's portal; send Lena the summary.** The player walks to Kev's office.

| Moment | What happens | What it tests | Best response |
|---|---|---|---|
| **The shared PC** | The warehouse PC is locked (`password`). A sticky note on the monitor reads `WAREHOUSE / Stock2024!`; a second note under the keyboard (`examine`) has three more. Kev is out on the forklift. Through the window, a delivery driver waits at the loading bay with a clear view of the screen | Using someone else's written-down password | Don't type it. Ask Kev to sign in himself, or ring Owain, who puts the stock file in the player's own folder in two minutes |
| **The supplier portal** | Northbeck's ordering portal needs an account. The sign-up form opens in MG-08's fill view: *Use my usual password* (shown as dots) or *Generate (Larkspur Vault)*; *Security question: mother's maiden name*; *Add a passkey? (recommended)* | A unique password, made-up answers, a passkey | Generate; made-up answer; add a passkey |
| **The prompt you were half expecting** | As the player signs in to the portal with their Larkspur account, a second prompt lands at the same moment: **"Approve sign-in to Ledger? Rotterdam, Netherlands."** Ledger, the finance system, still uses the older app with plain Approve and Deny, and its password is the old reused one: the account nobody put in the vault | A prompt they didn't start, arriving when they expect one | Deny and report it. Owain resets Ledger and adds it to the vault |
| **Kev's password** | Kev comes in: *"Same one for everything. Easier. Wife's birthday on the end."* He asks the player to set him up with *"one of these vault things"*. The player advises in dialogue, then Kev builds his passphrase with MG-08's tiles while the player watches | Teaching it back | Three random words, no birthday, the manager for the rest |

- **The shared PC** plays out:
  - **Ask Kev:** he leans out of the forklift. *"It's on the screen. Help yourself."* The player can type it with his blessing, or ask *"Could you sign in for me? I'd rather not use yours."* Kev, wiping his hands: *"You're the first person who's ever asked."* He signs in.
  - **Ring the service desk:** Owain: *"Don't use the note. I'll put the file in your folder. Two minutes."* Then: *"And I'm coming down there."*
  - **Type the note:** the PC unlocks (recorded). Later, Kev: *"Told you. That's what it's there for."* The debrief shows the driver's view of the note, and that the same password opened Kev's email.
- **The Ledger prompt** plays out:
  - **Deny and report:** Owain rings within a minute: *"Ledger. Of course. The one with its own password. I've reset it; let's get it in your vault."* The player adds Ledger to the vault.
  - **Deny, or ignore it:** nothing visible happens now. In the debrief, the monitoring partner's afternoon report shows the attacker kept trying Ledger for an hour before it was found.
  - **Approve:** a minute later Owain rings: *"Ledger's just signed you in from the Netherlands. That you?"* Telling him at once counts as a late report and he locks it. *"No harm done, because you told me."*
- **Owain arrives** with a small box. *"Shared PC first: named accounts for the warehouse by Friday. And this is for you, Kev."* A security key, on a keyring. Kev turns it over: *"A key. Finally, something that makes sense."* The sticky notes go in the confidential waste (the player can put them there, or Kev does).
- **(CP)** The player sends Lena the summary. The task completes whatever they did; the security side shows in the debrief.

### 5. Debrief (1 to 2 minutes)

- **(CP)** Back at the service desk, "that afternoon" (BE-16). The debrief screen (BE-02), then Owain and Ama in the conversation panel.
- **The two prompts side by side:** 02:13 and the Ledger prompt, what the player did each time, and what good looks like. This is the before and after.
- **The breach list.** The trade show site's breach held 14 Larkspur addresses; seven had reused the password at work. Ama's team reset all 14 the morning after the night's prompts, Kev's among them. How early depends on the night: reported at 02:15 means *reset before breakfast*; spotted by the monitoring partner means *reset by mid-morning*. Times and counts are on screen only.
- **The warehouse:** the shared PC (who could read the note from the loading bay), Kev's new passphrase on the meter, his key, named accounts by Friday.
- **The vault:** accounts fixed, email first or not, made-up answers, the method chosen, and Ledger, the account that wasn't in it.
- Per-outcome results: Secure, Developing or Not yet (see `assessment.md`).
- **The line to remember:** *"If you didn't start it, don't approve it. Deny it and report it."*

### 6. Check (2 minutes)

- **(CP)** Owain's spot check on The Lark (MG-20): six items drawn from the bank in `assessment.md`, at least one per learning outcome.

### 7. Reference

- **(CP)** The Lark opens the reference card (BE-09) with the organisation's own manager, sign-in methods and reporting route (BE-05), and a short section, *Three things to do at home tonight* (not recorded): turn on 2-step verification, or a passkey, for your personal email; check your personal email address on a breach-checking site; switch on a password manager and start with your email.

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| The night prompts | Deny and report (in the app or by calling) / deny / turn the phone over / type the "IT" number / reply to "IT" | LO5 (baseline) | Jas's text or call; Owain's opening line; how early the breach list was reset |
| The breach question | Probably / I don't think so / No idea | none (not assessed) | The same reply to all three: no blame for past reuse |
| Making it "memorable" | Another random word / no thanks / a swap or a "!" / a birth year or a pet's name | LO2 | The meter and the guesser, at once |
| Fix order | Email first / anything else first | LO3 | Owain's comment; the debrief |
| Security question | Made-up answer / true answer / skip | LO3 | Stored with the login; the debrief |
| Sign-in protection | Passkey / app with number matching / text message | LO4 | The lookalike demo; how plainly the Ledger prompt stands out in Apply |
| The shared PC | Ask Kev to sign in / ring Owain / ask Kev, then type the note / type the note | LO6 | Kev's line; the loading bay view in the debrief; named accounts by Friday |
| Northbeck sign-up | Generate or "my usual"; made-up or true answer; passkey or not | LO3, LO4 | Vault health; the debrief |
| The Ledger prompt | Deny and report / deny / ignore / approve | LO5 | Owain resets Ledger at once; or an hour of attempts found by monitoring; or Owain's call and a late report |
| Kev's passphrase | *"Three random words, and the vault remembers the rest"* / *"Your dog's name and the year he was born"* / *"Keep the birthday, add a !"* / *"Write it on a new note, somewhere safer"* | LO2, LO3 | Kev's passphrase on the meter; Owain's key |

No option shames the player. Typing the number at 02:13 leads to Jas locking the account and Owain saying it is built to wear people down. Typing the sticky note leads to Kev saying "that's what it's there for", and the debrief shows who else could read it. Approving the Ledger prompt and telling Owain is credited as a report.

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-07 MFA prompts and authenticator** | new (MVP) | The night prompts, enrolment, "Approve or Deny?", the Ledger prompt |
| **MG-08 Password manager and passphrase builder** | new (MVP) | The passphrase, vault health, security questions, the portal sign-up, Kev's setup |
| **MG-20 Knowledge check** | new (MVP) | Owain's check question and the spot check |
| `password` | existing | The shared PC's lock. Its post-it option (`postitNote`, `showPostit`) shows the sticky note; a correct entry unlocks the PC and is recorded as "used the note" |
| `examine` | existing | The note under the keyboard |
| `container` | existing | The shared PC's desktop with the stock file; Owain's copy in the player's own folder |
| `phone-chat` | existing | Lena; "IT Support"; Jas; and, until MG-07 exists, a "Larkspur Authenticator" contact whose prompts are ink choices |
| `person-chat` | existing | Owain, Ama and Kev; the night scene's captions over the bedroom background |
| `notes` | existing | Owain's three-habits card |

### MG-07 build notes (what this module needs)

- A phone-framed authenticator screen that opens by itself (BE-19) or from the phone.
- **Prompt types:** a number-matching push (two-digit field); a plain push (Approve and Deny, for Ledger's older app); a six-digit code; a passkey prompt (device unlock, pre-filled); and the "No passkey for this site" result.
- Every prompt shows the service, the approximate location, the time and the device. **Deny** always offers **Report this**.
- **Sequences from scenario data:** each prompt is `{ id, service, location, type, number, startsOn (a global or event), delayMs, expected }`; a flood is a list with an interval that stops on approve, on report, or after the last prompt. Scenario `timers[]` with `startOnGlobal` and `cancelOnGlobal` can drive it until the minigame has its own scheduler.
- **Enrolment mode:** method cards in ladder order, showing only the methods in the organisation profile (BE-05), and a test sign-in.
- **Practice mode:** a list of situations with a line of context each, three buttons, and immediate feedback.
- **Records:** each prompt's outcome (approved, denied, reported, unanswered) as a global and a BE-01 event, with the time it was shown and answered.
- **Accessibility:** no prompt expires before the player can act (an unanswered prompt waits until the next one arrives); buzzing is a caption; reduced motion removes the shake; every control has a keyboard route and a screen reader label.
- **Never real:** numbers and codes are made up in game; nothing is sent anywhere.

### MG-08 build notes

- **Vault:** a list of fictional accounts with health flags (reused, weak, in a breach); **Generate** replaces a password with a long random one; a fill view for sign-up forms; stored made-up answers to security questions.
- **Passphrase builder:** word tiles from a curated list of common, inoffensive words (screened against names, teams, places and offensive words), re-roll, add a word, a choice of separator, and the "memorable" chips that show what personal details and swaps really add. **No free-text password field anywhere:** the game must never collect a real password, so the tiles are the only input.
- **Meter and guesser:** strength in plain bands (Guessed instantly, Minutes, Days, Years, Centuries), from an established open-source strength estimator that models dictionary words, names, dates and common swaps rather than character-class rules, labelled *Rough guide*. The guesser panel shows a list being tried in order (the commonest passwords, names and teams, the organisation's name plus a year, swaps), striking through any match. It shows the order attackers guess in, never a method or a tool.
- **Breach check:** "Check this address" against an in-game breach list; the result text comes from scenario data.
- **Help mode:** the same builder driven by an NPC (Kev), with the player's advice chosen in dialogue.
- **Records:** the passphrase band and which chips were used; fix order; made-up or true answers; method chosen; whether a passkey was added at sign-up.

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| How did they get it? | Owain (EX-01) | 90 seconds | Two padlocks (password, MFA); four tiles; the breach alert; the three habits | "What does a prompt you didn't start tell you?" |
| The message at 02:13 | Owain (EX-01) | 20 seconds | The message annotated: unknown number, a number to type, "sorry for the late one" | none |
| Why not change it every month? | Owain (optional) | 30 seconds | `Spring2026!` becoming `Summer2026!` becoming `Autumn2026!` | none |
| Browsers, notes and managers | Owain (optional) | 40 seconds | The NCSC's position in three lines | none |
| What's a passkey, really? | Owain (optional) | 40 seconds | The lookalike demo in two steps | none |
| The guessing rig | Owain (EX-06, light, optional) | 45 seconds | The guesser ticker | none |
| Optional video: "Two in the morning" | Recorded in engine (EX-02) | 60 seconds | Plays on the service desk screen (MG-21) | Linked from the reference card |

## Debrief

Shown on BE-02, then spoken by Owain and Ama:

1. The night prompts and the Ledger prompt side by side: what each was, what the player did, what good looks like, and the outcome. This is the before and after.
2. The breach list: how one breached site reached 14 Larkspur accounts, and how early the reset happened because of the night.
3. The warehouse: the sticky note seen from the loading bay, Kev's passphrase and key, named accounts by Friday.
4. The vault: what was fixed, in what order, and Ledger, the forgotten account.
5. Per-outcome results.
6. The line to remember, voiced by Owain: *"If you didn't start it, don't approve it. Deny it and report it."* Ama: *"And thanks for telling us. Whenever it is."*

## Variants

- **Micro-drill: "Approve or Deny?"** (BE-07): eight prompts drawn from the bank (BE-13), each with a line of context, plus two "which is stronger?" password pairs with the meter shown afterwards. About 4 minutes. A new theme each month (a prompt during a meeting, a "new device" prompt, a reset code nobody asked for, a passkey on a lookalike site).
- **Text route:** the night as text (*"Your phone buzzes. Sign-in request: Larkspur account, Rotterdam (approximate), 02:13. Enter the number shown on your sign-in screen."*) with the same actions; the "IT" message as a quoted message; the passphrase builder as *Roll three words*, *Add a word*, *Add your birth year* and so on, with the band given in words; the vault as a list; the shared PC described with the note's wording; the same decisions and the same record (BE-03). About 10 minutes.
- **Facilitated session:** the night scene on a shared screen, phones face down on the table; the team decides each prompt together. Pause points: after the "IT" message (*"Who'd type it? Be honest. Why does it work at two in the morning?"*), after the vault (*"How many of your accounts share a password? Don't say it out loud."*), after the shared PC (*"Where do we have shared logins here?"*). 45 minutes with discussion.
- **Replay and randomisation:** per play, the attacker's location, the prompt times and the "IT" wording (from a bank of six), the breached site, the forgotten account (Ledger, the expenses app or an old file-sharing account), the sticky-note wording and the tile word list. The annual edition refreshes the sign-in ladder as advice moves (the NCSC's passkey advice changed in April 2026) and adds the year's MFA lures, such as fake "re-enrol your authenticator" messages.

## Alternative concepts

1. **Key Ring.** The idea taken literally. Larkspur's systems become locked doors in the building (email, payroll, customer files, the warehouse system), and at the start every lock takes the same key. A thief copies that key at a trade show stand, and the player watches the doors open one by one, using the engine's own locks and keys (`public/break_escape/js/systems/key-lock-system.js`). Then the player rekeys the building: a different key for every door, kept in a key safe (the password manager), and a second lock that needs a fingerprint (MFA). It teaches reuse and MFA by metaphor and is very visual, but transfers less directly to a real screen, so it suits a facilitated warm-up or the micro-drill's opener.
2. **Pattern Spotting with Jo (attacker view).** Jo Fairweather has finished Larkspur's authorised password review and shows the patterns it found across the organisation, anonymised: the company name plus a year, the local football team, the season plus a year, a pet's name and a "!". The player guesses which patterns were commonest, then helps write the poster that kills them off. Jo's candour makes it funny and memorable; it stays at the level of patterns and the game's own made-up percentages, never methods.
3. **The 2am Club (team mode).** A facilitated competition for a security champions' session (HA-13): everyone's in-game phone gets prompts at random during a 20-minute team task; reporting fast scores points, approving scores none, and the board shows each team's report rate. Lively for an event, less suited to the assessed module.

## Art and audio

- **New conversation background:** a bedroom at night (phone glowing, clock at 02:13), not tied to a room.
- **Redressed room:** Kev's warehouse office: hi-vis hooks, wall planner, kettle, the shared PC by a window onto the loading bay with a delivery van outside.
- **Props:** sticky notes (on the monitor and under the keyboard), a box of security keys on Owain's desk, Kev's key on a keyring, an "Ask us first" poster.
- **New UI art:** the authenticator screens (MG-07); the vault, word tiles, meter and guesser (MG-08), in the game's pixel style but legible at small sizes.
- **Characters:** Owain, Ama and Kev (recurring; shared art). Jas is voice only; "IT Support" is text only.
- **Voice:** about 35 lines for Owain, 8 for Ama, 15 for Kev, 4 for Jas. No voiced line prints a variable: the "47", the location and the counts are on screen only, and Owain says "that number came off their screen", never the number.

## Pitfalls

- **Never collect a real password.** Word tiles only; no free-text password field anywhere in MG-08 or the text route; codes and numbers are made up. Say so on screen.
- **No fake precision.** The meter's bands are a rough guide from an established estimator; never print "3.4 billion years".
- **Don't reward complexity rules.** The meter must not score `P@ssw0rd!` as strong for having symbols.
- **Don't blame the player for reuse.** The breach question gets the same answer whatever they say; nearly everyone has reused a password.
- **Keep the night calm.** A dark room and a buzzing phone; no alarms, no red screens. Jas is unhurried.
- **No gotchas.** The Ledger prompt names Ledger and the Netherlands plainly, and "Approve or Deny?" practises reading both.
- **Stay out of core_02.** No calls asking for codes; the only "IT" pressure is the one night-time message the seed asks for.
- **Don't oversell passkeys.** They resist phishing; the device and the account that syncs them still need protecting.
- **Don't make Kev the joke.** He's sharp and practical; he uses one password because nobody gave him a better way, and he ends the module as the warehouse's champion.
