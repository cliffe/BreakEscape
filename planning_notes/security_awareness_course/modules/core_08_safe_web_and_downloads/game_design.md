> **For the build, this design is superseded by `../../implementation/episodes/E10_downloads_and_fake_checks.md`.** That implementation brief is checked against the code and the built content and wins wherever the two differ (company, host, stages, items, config). This file stays as design background: the intent, the alternatives and the reasoning.

# core_08 game design: The Download

## Built shape and episode mapping

This module is **part built** (`research/built_episodes_vs_plan.md` §2). Reading a web address, look-alike domains and the padlock myth (C08-LO2) are the built **E5** `awareness_e5_signin_pages` (Quayholt Insurance, general) and its page-triage defend set and general checks. **Do not redesign the built E5 parts.** The rest, the signature of this module, is delivered by **E10** (new, with core_07): fake downloads, the "verify you are human" clipboard trick, browser warnings and extensions. E10 **extends E5**: it reuses the E5 mock browser and page-build model.

E10 follows the built shape: an attack half that builds and reveals a fake page (never a working one), a flip, then a scored defend half of browser-screen triage, then the built debrief view with the shared "habit to keep". It uses the built landing-page model, inbox triage, awareness-measure records and concept cards, has a defend-only variant, and feeds new check items with mirror pairs (`assessment.md`).

The detailed "The Download" design below is retained as the E10 content, reparented from the retired Larkspur world to Quayholt (the software portal is Quayholt Apps). The explainer is the episode host (Niamh Doherty and a Quayholt IT staff member), not a recurring course mentor.

## Concept

It's a Wednesday morning in Operations, and Lena needs the monthly supplier report by 12:00. One supplier, Fernside Catering, has sent its new price list only as a PDF, so the player has to get it into the spreadsheet; the report also needs two suppliers' current delivery charges and Fernside's new catalogue. Every one of those jobs sends the player onto the web, and the web is where this module's threats live: the top search result that is an advert for a copy of the real site, the familiar supplier site that has been hacked and now asks visitors to "verify you are human" by pasting something, the handy free extension that wants to read everything, the news page that turns into a full-screen alarm with a number to call.

None of these arrive by email, so there's no sender to check and no suspicious message to forward. The module teaches the three habits that work on the web: start from a place you trust, never let a page make you do things to your computer, and report. The hook a player will talk about at lunch is the clipboard: when a "verify you are human" box asks you to press three keys, the game can show you what it had quietly copied, and what pasting it would have done.

## Setting and cast

- **Rooms:** the player's desk in the Operations area (`room_office`) and the IT service desk (`room_IT`). No new rooms; most of the module happens inside the browser (MG-02).
- **Owain Jenkins** (IT service desk lead) is the explainer for this module: software, the portal and the web are his patch. *"Ask us first. We'd rather help than clean up."*
- **Niamh Doherty** (the E5 host) passes the desk and asks the check question, and returns for the debrief; there is no recurring course mentor (the recurring mentor Ama Owusu is retired).
- **Leo Brennan** (desk neighbour) recommends an extension he's used for ages, and later pastes something he shouldn't have and asks what to do.
- **Kai Murray** (security analyst) shows what the reports achieved.
- **Lena Fischer** (the player's manager) sets the task by chat only.
- Fictional suppliers and vendor: Fernside Catering, Ashby Cleaning Supplies, and Pagewright, a PDF software vendor. All domains are placeholders to be checked as unregistered before build.

## Structure

The critical path is marked **(CP)**.

### 1. Hook: "Just need a converter" (1.5 minutes)

- **(CP)** Lena's chat: *"Supplier report by 12, please. Fernside's price list only came as a PDF; you'll need it in the spreadsheet."* The browser (MG-02) opens on the staff intranet's home page, with a bookmarks bar that includes **Quayholt Apps**. The player can search, or not.
- A search for a converter shows:
  1. **Sponsored:** "Pagewright PDF Converter: official free download", `pagewright-download.com`.
  2. "Pagewright: PDF tools for business", `pagewright.co.uk` (the real vendor).
  3. "Free online PDF to spreadsheet: no sign-up", `convert-it-now.net` (an upload site).
- Whatever the player does is the baseline for C08-LO1 (C08-B1):
  - **Downloads from the advert and runs "PagewrightSetup.exe":** Quayholt Protect blocks it (core_07's alert). Owain rings: *"Saw the alert. No harm done, it was caught. Pop over and I'll get you one that doesn't bite."*
  - **Downloads from the real vendor:** the installer asks for an administrator. Owain: *"Right idea checking the address. Wrong shop, though. Come and see ours."*
  - **Uploads the price list to the free converter:** it works. Owain, passing: *"That works. It also gave a stranger Fernside's prices. Come and see what we use."* (One line; the data side is core_13.)
  - **Uses Quayholt Apps or messages the service desk:** Owain: *"You found the portal. Most people never do. The converter's in there. Two clicks."*

### 2. Learn: "Owain's three habits" (3 minutes)

- **(CP)** Owain at the service desk (EX-01), with visual aids in the conversation panel (BE-08):
  1. **Where software comes from.** The hook's search page, annotated: the "Sponsored" label, the lookalike domain, the real vendor, and Quayholt Apps. *"Rule one: software comes from the portal, not from adverts. If it isn't there, ask. We're quick."*
  2. **Read the address.** An address bar with the domain highlighted from the right-hand end (core_01's method), and the site information icon. *"A padlock means nobody can listen in. It doesn't mean the site is honest."*
  3. **Four tricks.** A two-by-two card: the fake check, the fake update, the fake alarm, the fake permission, each with its giveaway circled (the instruction, the download, the phone number, the Allow button). *"No real website needs you to paste anything into your computer. Not to prove you're human. Not to fix an error. Ever."*
  4. **If you slipped.** *"Tell us straight away. Don't restart, don't clear anything, don't run a scan you found online. We'd rather know in a minute than find out in a month."*
- Ama, passing, asks the check question (MG-20, opened from her conversation by BE-19's `#trigger_minigame:<minigame>|<configKey>`): a "verify you are human" box with its three-step instructions. *"What do you do with this one?"* (Close it and report it.)
- **Skip:** *"I know this stuff."* Owain: *"Go on then,"* and Ama's question follows; a wrong answer brings chunk 3 back.
- **Optional topics** in Owain's hub, each under a minute: *"Why can't I just install things?"* (checked, licensed, updated, and the advert problem); *"Are free online tools OK?"* (two risks, one line each, pointing to core_13); *"What about my phone?"* (official app store only).

### 3. Practise: "Real or Rigged?" (2.5 minutes)

- **(CP)** MG-02 in practice mode: ten browser screens, one at a time. For each the player chooses **Carry on**, **Close and report**, or **Go the trusted way** (bookmark, portal or service desk). Feedback is immediate: the giveaway highlighted and one line of why. The ten get harder:
  1. A search results page with a sponsored lookalike above the real supplier. (Go the trusted way: bookmark.)
  2. Address: `https://fernside.co.uk.price-update.net/` (MG-03 inline: the real domain is `price-update.net`).
  3. A genuine CAPTCHA: "I'm not a robot" tick box and a grid of pictures. (Carry on: real checks happen on the page.)
  4. "Verify you are human: press these three keys." (Close and report.)
  5. A video page: "Click Allow to keep watching." (Close: choose Block.)
  6. The browser's own menu: "Relaunch to update." (Carry on: that one is genuine.)
  7. A banner on a news page: "Your browser is out of date. Download the update." (Close and report.)
  8. Address: `https://www.ashby-supplies.co.uk/trade` against the bookmark `ashbysupplies.co.uk` (MG-03 inline: a lookalike).
  9. A red "Deceptive site ahead" page. (Go back.)
  10. A download bar: "Fernside_pricelist.pdf.exe". (Close and report: a program pretending to be a document.)
- The bank (BE-13) holds more: an extension asking for all-site access, a "Your connection is not private" warning, a fake error with a "Fix it" button, a full-screen alarm, a third MG-03 address.
- Three wrong in a row brings Owain back with a one-line nudge.

### 4. Apply: "The 12:00 report" (5 minutes)

- **(CP)** Back at the desk with DocShift installed from Quayholt Apps, the player converts the price list: one satisfying click. The work task bar (BE-18) shows four steps: **Convert Fernside's price list** (done), **Check Ashby's and Fernside's delivery charges**, **Download Fernside's new catalogue**, **Send the report**. Four threats arrive inside the work, one from each slot (BE-13 draws the variant):

| Slot | What happens | What it tests | Best response |
|---|---|---|---|
| **Fake source** | The player needs Ashby's delivery charges. the staff intranet's bookmarks have Ashby's trade site; a search shows a sponsored "Ashby Supplies: trade login" at `ashby-trade-login.com`, with a sign-in page (pre-filled with the in-game account; never a real password) | Starting from a trusted place; reading the address | Use the bookmark, or skip the advert and check the address of the genuine result |
| **Fake check** | Fernside's real site, reached from the bookmark, has been hacked. Clicking "Download catalogue" brings up "Verify you are human: 1. Press Windows + R. 2. Press Ctrl + V. 3. Press Enter.", shown as text with MG-02's Follow the instructions, Close the page and Report buttons | Never doing what a page says to your computer, even on a site you trust | Close the page and report it (the browser's Report button) |
| **Permission grab** | Leo, leaning over: *"Use Free PDF Tools. It's an extension, does it all in the browser. I've had it for ages."* The store page shows 4.8 stars and "2 million users"; Add brings up "It can: Read and change all your data on all websites. Read your browsing history." (The notification variant: a page that says "Click Allow to continue reading") | Judging a permission request | Cancel and use the portal tool, or ask IT about the extension; for notifications, Block |
| **Fake alarm** | Lena: *"Saw this about Ashby being bought out. Worth a mention?"* The news page loads, then an advert takes over: full screen, with an alarm that is silent by default (the caption reads "This page is trying to play a loud alarm"); with sound on, a calm robotic voice says *"Warning. Your computer has been locked. Do not turn it off. Call support now."* The page shows the organisation's own logo and name, copied from its website (on screen only, from BE-05), and an 0800 number. The close button reopens it | Not calling; finding the safe way out | Press Esc, close the tab or the browser; if it won't close, call the service desk on the number from the staff intranet; report it |

- **The clipboard reveal.** On the fake check, the browser's own interface (not the scam page) offers **"What did this page copy?"** It opens MG-02's clipboard view: a single line, **"A hidden command that would run a program on your computer."** The command itself is never shown. The player can still choose Follow the instructions: the game then says in words what would have happened (*"The command would have downloaded a program and run it. Nothing would have appeared on screen."*), which is the point. If the player hasn't reported it within two game-minutes, Kai rings: *"Did you just run something from a website? You're not in trouble. Leave the laptop on, unplug the cable, and I'll be over."* (core_07's isolation instruction, voiced in the version the organisation profile picks.)
- **Escaping the alarm.** The full-screen page is a tiny escape room with no clock: the in-page close button reopens the window; Esc leaves full screen; then the tab's close button works. If the player is stuck for 30 seconds, an on-screen hint appears (*"Try Esc"*), and after another 30, Owain's chat: *"Stuck on a pop-up? Ring me, not them."* If the player calls the 0800 number, a friendly "support agent" asks them to install a remote access tool "so I can fix it for you". They can hang up and report (the call itself is core_02's subject).
- **Leo's slip.** About two-thirds of the way through, Leo: *"Did that 'verify you're human' thing on Fernside's site. Pasted it, hit Enter. Then thought, hang on. Do I ring someone or just restart?"* The player chooses:
  - *"Ring the security team now. Don't restart or clear anything."* (Best: Leo is on the phone within the minute.)
  - *"Keep an eye on it and mention it to Owain later."* (Leo mentions it at 16:00.)
  - *"Restart and clear your history. You'll be fine."* (Leo does, then reports the next morning when an MFA prompt wakes him at 02:00.)
- **(CP)** The player sends the report. The task completes whatever happened with the threats.
- **What your reports did** (BE-16, 30 seconds, "That afternoon"). Kai's board, as on-screen text: the fake check on Fernside's site, reported by the player and by Leo, blocked for everyone at 11:20; Fernside told their site had been hacked; the site reported to the NCSC. If the player didn't report it, the board shows it reported by a colleague in Finance two hours later, and three more people who'd seen the box in between. If Leo wasn't told to ring straight away, Kai: *"We caught it at the MFA prompt. Would've been nicer at the paste."*

### 5. Debrief (1.5 minutes)

- **(CP)** The debrief screen (BE-02), then Owain and Ama at the service desk.
- For each trap: a thumbnail of the page, the giveaway (the instruction, the address, the phone number, the permission), what the player did, and the trusted route.
- The before and after: where the player got the converter in the hook, against where they got Ashby's site in Apply.
- Kai's board: what each report blocked, and how fast.
- Per-outcome results: Secure, Developing or Not yet (`assessment.md`).
- **The line to remember:** *"Start from a place you trust. Never let a web page drive your computer. If in doubt, close it and report it."*

### 6. Check (1.5 minutes)

- **(CP)** Kai's spot check on the staff intranet (MG-20): six items from the bank in `assessment.md`, at least one per learning outcome.

### 7. Reference

- **(CP)** The staff intranet opens the reference card (BE-09): the five steps, a link to the software portal, and how to report a website, all with the organisation's own names (BE-05).

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| Hook converter | Advert download / real vendor / free upload site / the portal | LO1 (baseline) | Owain's opening line differs; the blocked download shows core_07's alert |
| Fake source | Bookmark / genuine result after checking / the advert, then leave / sign in on the lookalike | LO1, LO2 | The lookalike's sign-in leads to core_01's "if you typed a password" steps with Owain; no account is harmed if reported at once |
| Fake check | Close and report / close only / follow the steps | LO3, LO6 | Kai's call; the board shows how many others saw the box before the first report |
| Permission grab | Cancel and use the portal / ask IT / add it | LO5 | Added: Owain removes it the next day and explains what it could read; asked: Owain checks Leo's copy too |
| Fake alarm | Escape and report / escape only / call the number | LO3, LO6 | The call: the "support agent" asks for remote access; hanging up and reporting still ends well |
| Leo's slip | Ring now / mention it later / restart and clear history | LO6 | Leo's outcome on Kai's board, from "blocked in a minute" to "caught at 02:00" |

No option shames the player or Leo. The worst branches still end with a report and Kai's help, and the debrief frames them as *"this is what the first minute is for."*

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-02 Web browser** | new | The whole module: the search page with adverts, the vendor and supplier sites, the extension store, the news page and the full-screen alarm, the fake check with its clipboard view and buttons, the download bar, browser warnings, the toolbar Report button |
| **MG-27 Work desktop** | new | The player's laptop: the browser, chat and the staff intranet open from it, and Lena's and Owain's messages arrive as notifications |
| **MG-03 Link and domain drill** | new | Inline in three Practise screens |
| **MG-20 Knowledge check** | new | Ama's check question and Kai's spot check |
| `lab-workstation` | existing | A first version of the fake sites as hosted pages in the iframe, before MG-02 exists |
| `text-file` | existing | A first version of the clipboard viewer |
| `notes` | existing | the staff intranet's bookmarks list; the "Paste nothing" notice |
| `person-chat` | existing | Owain, Ama and Leo |
| `phone-chat` | existing | Lena's chat, Owain's messages, Kai's calls (MG-04 later) |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| Where software comes from | Owain (EX-01) | 40 seconds | The hook's search page, annotated | none |
| Read the address | Owain (EX-01) | 40 seconds | An address bar with the domain highlighted; the site information icon | none |
| Four tricks | Owain (EX-01) | 60 seconds | A two-by-two card of the tricks with each giveaway circled | Ama: "What do you do with this one?" |
| If you slipped | Owain (EX-01) | 30 seconds | The five steps from the reference card | none |
| What your reports did | Kai (EX-05) | 30 seconds | Kai's board | none |
| Optional video: "What's on your clipboard?" | Recorded in engine (EX-02) | 60 seconds | Plays on the meeting room screen (MG-21) | Linked from the reference card |

## Debrief

Shown on the built debrief view, then spoken by the host:

1. The hook and the four Apply threats, each with the giveaway, what the player did and the trusted route.
2. The before and after: the hook's converter against Ashby's site.
3. Leo's outcome, and why the first minute mattered more than the paste.
4. Kai's board.
5. Per-outcome results.
6. The shared **habit to keep**, quoted word for word as in every awareness debrief: *"When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."*
7. The "On Monday" card and this module's line: *"Start from a place you trust. Never let a web page drive your computer. If in doubt, close it and report it."*, then how to report a website and the no-blame line.

## Variants

- **Micro-drill:** "Real or Rigged?" on its own (BE-07): eight screens drawn from the bank, including at least one fake check and one domain item. About 4 minutes. A new lure each month (BE-13, HA-21), following whatever variant of the fake check is current.
- **Text route:** each page described as text, with its address shown in full and a "what does this page want me to do?" action; the clipboard reveal as text; the full-screen alarm described, with the same choices. The same decisions, the same record (BE-03).
- **Facilitated session:** the browser on a shared screen; the team votes on each page. Pause points: after the hook (*"Where would you have got the converter? Be honest."*), at the fake check (*"Who's seen one of these? What did it ask?"*), after the alarm (*"What would you do if it wouldn't close?"*), after Leo's slip (*"What would make you ring in the first minute?"*). About 45 minutes.
- **Replay and randomisation:** the bank holds variants for each slot (a lookalike software site, a lookalike supplier login, a fake converter; three styles of fake check including a fake error and a fake download page; extension or notification permission; an alarm with or without a voice). Domains are generated per game. The annual edition updates the fake check to the year's current form.

## Alternative concepts

1. **The Rabbit Hole.** One browsing session in which every click can lead somewhere worse: a search advert, a lookalike site, a fake check, a scam alarm. After any slip, a "rewind" shows the exact click where the safe exit was, and the player replays from there. Strong for repeated micro-drills and easy to extend each year; it has less of a work task around it.
2. **Fake Shop (attacker view, EX-06).** Jo Fairweather is setting up Quayholt's authorised web-habits test, using pages that only record a click. The player helps choose which harmless test page goes in front of which team (a fake converter, a fake update, a fake check) and sees how little a convincing copy takes: an advert, a lookalike address, a logo copied from a website. Then the test runs and the player sees the results board. Shows how cheap the trick is, never how to build it.
3. **Escape the Pop-up.** An arcade-style micro-drill with no timer: each level is a browser taken over by a different trick (full screen, a fake close button, notification spam, a download that keeps restarting), and the player finds the safe exit and reports. Quick and replayable, good for a monthly drill; too narrow for the full module.

## Art and audio

- **No new rooms.** The office desk and the service desk.
- **UI art:** the browser (MG-02) in a generic, brand-free style; page templates for a software vendor, two suppliers, a news site, an extension store, the Quayholt Apps portal, the fake check, the full-screen alarm and the browser warning pages; the clipboard view.
- **Characters:** Owain, Ama, Leo and Kai have their own art (shared across modules). Lena appears by chat only.
- **Voice:** about 25 lines for Owain, 12 for Ama, 8 for Leo, 6 for Kai, and two for the scam page's robotic voice (a generic TTS voice, not a cast voice, heard only when the player turns the page's sound on; captioned either way). No voiced line prints a variable: report times, counts and domains appear only on screen.
- **Sound:** the scam page's audio is calm and short, never a siren, and can be muted (BE-04).

## Pitfalls

- **Never ask learners to press real system shortcuts, and never write to their real clipboard.** The fake check's instructions are text with in-game buttons, and the clipboard view holds a harmless description.
- **Never show a working command.** The clipboard view describes the command and never shows it; nothing on screen could be copied and used.
- **No real brands or domains.** Every domain in the bank must be checked as unregistered or reserved, and links must not work outside the game.
- **Don't teach the padlock as a safety sign,** or "the store is official so it's safe".
- **Don't make the alarm frightening.** No sirens or flashing, always a way out, hints after 30 seconds, nothing timed.
- **Don't teach people to ignore warnings.** Every browser warning in the game is a true warning; the "occasionally wrong" point is made in words, with "ask IT" as the action.
- **No gotchas.** The fake check on a familiar site is the hardest item, and it is taught explicitly in Learn and practised in Practise before it appears.
- **The task can't fail.** The report always goes; the debrief shows the security side.
