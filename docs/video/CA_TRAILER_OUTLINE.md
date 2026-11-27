# Cyber Aware trailers: outline of features, content and infographics

Written 22 Nov 2026 for the CA session. Builds on VID1's brief (`docs/video/CA_TRAILER_BRIEF.md` on the v-trailers-1120 branch) and the CA fun and USP rubric (`tmp/handover/ac0/CA_FUN_USP_RUBRIC.md`). Sources trusted in this order: `scenarios/ca*/mission.json` and `scenario.json.erb`, `office_kits/episodes.json` and the kit files, `tts_cache/<scen>/*.json` sidecars, then Hacktivity `db/seeds/awareness_event.rb` (read only) for the course list.

Nothing here has been scouted in a browser yet. Shot descriptions come from the scenario files and must be confirmed by `video-scout` before any take.

## Ground rules for every CA trailer

- **Separate product line.** Nothing carries over from the SAFETYNET look: no keyhole title, no Licence to Hack opening, no red hex curtain, no Agent HaX. CA uses `ui_theme: "general"` and the `aw-*` tokens.
- **The USP is the attacker's side.** The learner builds the attack before defending against it. Every attack-episode trailer shows the build (research, pretext, lure) and the attack landing before it shows the desk.
- **Spoilers for CA** are the tells (which detail gives an item away), check-form answers, scores, grades, debrief verdicts and "You stopped..." or "You missed..." branch lines. The lure itself and the attack build are the appeal, so show them. A triage card may be on screen only before a verdict is chosen, and never with the tells checklist ticked.
- **Pattern level only.** Shots of the OSINT browser, pretext card, landing-page builder or password guesser show that the step exists. No readable worked lure that could be lifted as a template.
- **Lines must be cached.** Each end line below has a sidecar `.json` with matching text and an `.mp3` in `tts_cache/<scen>/`. New or re-voiced lines need the owner's yes through AC0.
- House rules from `docs/video/recipes/README.md` and `mission-trailer.md` still hold (−14 LUFS, .srt for every line, 30 fps, no empty screens, straight-line walks, frame checks).

## 1. Episode trailer template

Target 45 s for attack episodes, 40 s for consequence-first episodes. A 20 s catalogue cut is taken from the same edit (beats 1, 3, 4, 7).

| # | Beat | Attack episode (14 episodes) | Consequence-first (E11, E15, E16, E19, E20) | Length |
|---|---|---|---|---|
| 1 | Hook | The company room, staff moving on their needs, one voiced ambient line or the in-room request as a question | Same: the room and the ordinary day ("Handovers go out fast when it's busy.") | 4 s |
| 2 | Title card | Episode name and company: **Invoice fraud / Brightwell Foods** | Same | 2 s |
| 3 | Attacker research | OSINT browser on the company's `.example` site or Friendface; a fact goes to the notebook | Replaced by **the everyday choices**: the choice-run cards (a busy morning, a Friday deadline, a leaver's week, a day on the road) | 6 s |
| 4 | Build the attack | Pretext card filling with found facts, or the mail template, landing-page builder, password guesser, assistant brief | Replaced by **where it led**: the "six months on" or "by the end of the day" consequence reveal, shown without the per-choice verdicts | 7 s |
| 5 | The attack lands | The call meter moving and the target giving way, the send, the push approved | Dropped; its time goes to beat 4 | 4 s / 0 s |
| 6 | The flip | The step strip ticking over to Defend; "now take the other seat" line | The step strip moving to the sort | 2 s |
| 7 | Defend at the desk | Triage list with mixed kinds (email, call, visitor, QR, SMS) before any verdict; one verdict button pressed with the result hidden | Same, or the sort drill or concern form | 6 s |
| 8 | Living office | Look up: the room beat, a colleague's request (tier E) or watched chain (tier O) | Same where the tier allows (E15, E16 are E; E11, E19 are O; E20 is T, so use ambient room shots) | 6 s |
| 9 | What you'll spot | Card: one pattern-level line ("Urgent, secret, and paid today"), never the tell list | Same, framed as habit ("Check who it's going to before you send") | 3 s |
| 10 | End line | The best cached line (table below), portrait view with the game's own bar | Same | 4 s |
| 11 | End card | Cyber Aware mark, course name, "15 minutes, in your browser", sign-off brand | Same | 3 s |

The consequence-first episodes have no attacker to play, so their seeded brief says so. Their trailers must not claim the learner plays the attacker. Their USP card reads as "see where the shortcut led" in place of "play the attacker".

Tier S and T episodes (ca00, ca04, ca17, ca20) have no step-away beat; beat 8 becomes a 3 s ambient room shot.

## 2. Per episode

Companies: BF Brightwell Foods, MS Merrin & Sallow Architects, TL Tarrowby Logistics, QI Quayholt Insurance, CS Carrholme Services. Tier from `episodes.json`. "Spot afterwards" is pattern level and stays clear of the per-item tells.

| Ep | Topic (min) | Co / tier | Signature attacker shot | Signature defend shot | Living-office moment | End line (cached; speaker) | What you'll spot afterwards |
|---|---|---|---|---|---|---|---|
| ca00 | How it works (5) | QI / S | none (onboarding) | kiosk step strip, brief cards | Anjali greets; ambient staff | "Start your first episode whenever you're ready, and report anything that doesn't sit right." (anjali_rao) | how the course works, what is recorded |
| ca01 | Invoice fraud (15) | BF / O | mail template filling a lookalike invoice from found facts | payments inbox triage | the recall notice on the board (`ca01_recall`) | "A customer rang asking why we'd been in touch. Nobody here had." (kit_agnieszka_duda) | bank-detail changes that ask to skip a call-back |
| ca02 | CV lures (15) | TL / E | applying for the open vacancy with a CV attached | recruitment inbox | Chidi's blank CV asks for a click (`ca02_enable_editing`) | "Chidi, IT have just cut your machine off. The driver applications are all on there." (fatima_begum) | attachments that ask for more than opening |
| ca03 | Help desk resets (15) | QI / O | ringing the service desk as a locked-out manager; the push stream wearing an account down | service desk queue | people locked out (`ca03_people_locked_out`) | "I came over to use the spare and it's on the sign-in screen, asking for everything again. Darren, is it doing this to everyone?" (kit_anjali_rao) | callers whose proof is only public facts; prompts nobody started |
| ca04 | Executive impersonation (15) | MS / T | the "while I'm travelling" email to the PA | PA inbox with a copied-voice voicemail | none (tier T); ambient studio | "The partner came back knowing nothing about any payment. Awful moment." (kit_lorna_easton) | urgency plus secrecy from someone senior and away |
| ca05 | Fake sign-in pages (15) | QI / E | landing-page builder making a look-alike page (a model, never working) | pages behind links | Darren's phone asks him to approve (`ca05_signin_prompt`) | "Password's in, and now my phone wants me to approve it. Fine to say yes?" (kit_darren_price) | where a page really lives, whatever it looks like |
| ca06 | Texts and QR codes (16) | TL / E | the lookalike parking message | the work phone, SMS and QR cards | the new parking notice (`ca06_notice`) | "This one says my parking permit needs renewing. Is it one of ours?" (kit_zainab_hussain) | codes and texts that skip the app you already use |
| ca07 | Cloned voices (16) | BF / E | the email in the chief executive's name pushing a release | finance phone and inbox | Graham has "Ravinder" on hold (`ca07_call_on_hold`) | "Sounds just like him. Ashcarr Haulage have changed bank, and he wants them paid today. Go ahead?" (kit_graham_whitfield) | a familiar voice or caller ID is not proof |
| ca08 | After the click (15) | QI / O | the email dressed as the IT service desk | the clicked colleague's account, signs that follow | a machine goes out (`ca08_machine_out`) | "To whoever's inside, a trusted account is one its own colleagues won't question, and the quiet between the click and the report is when they spend it." (anjali_rao) | signs an account is being used by someone else |
| ca09 | Passwords (15) | TL / E | the guess list from a colleague's public details, then the reused password opening the account | own account under attack, lock-down | Chidi's new password on a sticky note (`ca09_note_on_screen`) | "Right, sorted. New one's on a sticky note on my screen so I don't forget it. Owt I should flag?" (kit_chidi_okeke). Hook: trim "Most passwords aren't cracked. They're guessed, reused or handed over." from Nilesh's welcome clip | reuse and guessable passwords |
| ca10 | Fake downloads and checks (15) | QI / E | building a fake "verify you are human" check on a supplier's site | a morning of web pages | Darren's bookmarked portal asks for keys and a paste (`ca10_paste_check`) | "Supplier portal's asking me to prove I'm human now." (kit_darren_price) | pages that try to drive your computer |
| ca11 | Misdirected data (15) | CS / O | none: the busy morning's choices at the Care Laundry desk | the desk inbox | Yusuf finds a printout that isn't theirs (`ca11_stray_printout`) | "This printout isn't ours. It's a care home's resident list, with health notes on it. Someone sent it here by mistake." (kit_yusuf_demir) | checking the recipient before sending |
| ca12 | Visitors and tailgating (15) | MS / E | the courier in hi-vis on the call with Delphine, influence meter moving | the reception seat, visitors at the desk | Thandiwe's open screen, then Camila at the studio door (`ca12_visitor`) | "Hi, I'm Camila, here for Yasmin Chaudhry. She said to come straight up." (kit_camila_ospina). Attack payoff: "Go on then, I'll buzz you through." (delphine_reception) | visitors whose story stands in for being checked |
| ca13 | AI assistant (15) | BF / E | writing a supplier brief for the assistant to read | the assistant used for real; email, voicemail, video call | Graham's assistant drafts a reply sending the customer list (`ca13_summary_says_send`) | "It's Gwen, on Brightwell Meet. Quick one: read me the six-digit code on your phone so I can clear your assistant access." (gwen_pritchard) | an assistant passes on what it read |
| ca14 | Social media (15) | MS / E | pinning what one colleague's posts give away | the feed and inbox; privacy panel closing gaps | Lorna's team photo for the studio page (`ca14_team_photo`) | "It's all of us at our desks. Fine to post?" (kit_lorna_easton) | how much a stranger can build from public posts |
| ca15 | Shadow IT (15) | TL / E | none: the Friday deadline choices | sort of found sticks and shortcut messages | Fatima finds a memory stick (`ca15_found_stick`) | "No name on it, nothing. What do you reckon I do with it?" (kit_fatima_begum) | shortcuts round the approved way |
| ca16 | Insider risk (15) | QI / E | none: a leaver's week of ordinary calls | the message set and the concern form | Niamh asks to borrow a login (`ca16_borrowed_login`) | "It won't take my password at all. Could I borrow your login for an hour?" (kit_niamh_doherty) | requests to share a sign-in; raising facts, not verdicts |
| ca17 | Acceptable use, spot it only (12) | TL / S | none (defend only) | Allowed / Not allowed / Ask first sort | twin reaction line only | "Every rule here has a 'because'." (nilesh_solanki; trim from the intro clip) | where the line sits, and asking first |
| ca18 | Password guessing at scale (15) | MS / E | the staff list and word list from public pages, one password sprayed across every account | own seat: real alerts versus fakes | Lorna's reset password with the season moved on (`ca18_reset_password`) | "Kept my old one, changed the season. One less thing to remember. That'll do, won't it?" (kit_lorna_easton) | predictable passwords; alerts that ask for a sign-in |
| ca19 | Malware and updates (15) | QI / O | none: a busy afternoon's everyday calls | the desk inbox | one desk isolated beside the rest still running (`ca19_isolated_beside_running`) | "IT have taken mine offline while they rebuild it, so I'm on pen and paper for the afternoon." (kit_niamh_doherty) | restart prompts, and files that run with your access |
| ca20 | Working away (15) | TL / T | none: two days on the road (train, café, hotel, home) | real networks versus look-alikes | none (tier T); ambient depot | "A screen someone reads, a call someone hears, a bag left for a minute, a password typed into the wrong Wi-Fi page." (zainab_hussain) | public networks and screens in public |

Lines not to use: every "You stopped...", "You kept...", "You caught..." and "That payment went out..." branch line (they are grades), and kit praise lines that name the item caught ("Good spot on that bank-details email").

## 3. Shot-reuse matrix

Record each once per company room or shared minigame, then reuse across episodes. "Best source" is where the shot is richest or already proven live.

| Shot | Used by | Best source | Note |
|---|---|---|---|
| Kiosk step strip (Brief, Research, Write, The call, Defend, Debrief) | all | ca12 (screenshot exists) | re-record per company colours: one take per company |
| The flip (strip ticks to Defend, "take the other seat" line) | all attack episodes | ca12; ca01 for email | each host has a cached "Now take the other seat" line |
| OSINT browser with a fact noted | ca01–ca10, ca12, ca14, ca18 | ca12 (Friendface post, noted) | crop so no full worked lure shows |
| Pretext card filling | call and email episodes | ca12 | "Use only details you have found" heading is the USP in one frame |
| Call with influence meter | ca03, ca12 | ca12 (Delphine) | the meter moving is the action beat |
| Mail template and send | ca01, ca02, ca04, ca05, ca07, ca08, ca10 | ca01 | `maxSends 1` makes a clean single send |
| Landing-page builder | ca05, ca10 | ca05 | show it as a model; no working page |
| Password guesser (target, spray) | ca09, ca18 | ca18 spray (scale reads well) | never show a guess that matches a real-world password |
| Assistant chat | ca13 | ca13 | |
| MFA push stream | ca03, ca05, ca09, ca18 | ca03 | |
| Choice-run and consequence reveal | ca11, ca15, ca16, ca19, ca20 | ca15 ("six months on") | hide per-choice verdict marks |
| Triage list, before verdict | all | ca12 (mixed kinds); ca06 for phone cards | no tells checklist on screen |
| Sort drill, concern form, privacy panel | ca14, ca15, ca16, ca17 | ca17 (sort), ca16 (concern form) | |
| Step-away panel (Look up / Carry on) | tier O and E | ca12 (screenshot exists) | |
| Room beat and request | tier E | ca12, ca07, ca13 | one per episode, episode-specific |
| Debrief answer cards | all | any | blur or skip: verdicts are spoilers; use only the layer 1 cost panel heading |
| Host recap in portrait | all | ca12 (Lorna) | pick the shared-close line, not the catch or miss line |
| Ambient room wide, staff on needs | all | one per company: BF ca01, MS ca12, TL ca06, QI ca05, CS ca11 | five takes cover every episode's establishing shot |
| Coffee or cooler trip | all | BF ca01 (coffee and cooler) | |

Five company-room takes plus about twelve shared minigame takes cover beats 1, 3, 4, 6, 7 and 8 for most episodes. Only the attack-lands beat, the room request and the end line are episode-specific.

## 4. Course trailers (the 12 seeded courses)

Each course trailer is 60 s: a course card, two or three 12 s episode segments cut from the episode trailers (beats 3–5 and 8), a 6 s "before and after check" card, the course habit line as text, and the end card. Habits are quoted from the seed.

| # | Course | Episodes | Assembly | Course-specific cards |
|---|---|---|---|---|
| 1 | Introduction to cyber threats | ca00, E5, E8, E1, E9 | ca00 kiosk open, then a 10 s segment of each | "Your first hour"; "Four episodes, four kinds of trick" |
| 2 | Payment fraud | E1, E4, E7 | invoice build, PA email, voice on hold | "Send the fake invoice yourself"; finance role check card |
| 3 | Social engineering | E3, E12, E14 | desk call, front-door call, posts mined | "Talk your way in, then hold the door" |
| 4 | Phishing and fake messages | E2, E5, E8 | CV, look-alike page, after the click | "Build the lure, then spot the fakes" |
| 5 | AI and new scams | E6, E10, E13 | QR notice, verify box, assistant | "Voices, faces and QR codes can all be faked" |
| 6 | Passwords and accounts | E9, E18 | guess list, then the spray | "Guess one. Spray a whole firm." |
| 7 | Handling data and conduct | E11, E16, E17 | consequence-first only | "No attacker to play: see where the data went" |
| 8 | Devices and working away | E15, E19, E20 | consequence-first only | "The shortcuts anyone takes, and where they led" |
| 9 | Complete programme | all 19 plus E17 and the year-end review | this is the programme trailer's long cut (section 5) | "Twenty topics, one year" |
| 10 | Refresher drills | 20 spot-it twins | triage montage across all five companies; twin reaction lines | "Twenty drills, any order, under 15 minutes each" |
| 11 | Annual refresher | year-end review plus check | 30 s only: triage montage, check card | "This year's tricks in one short run" |
| 12 | Incident simulations | sis01–sis03 | out of CA scope: Critical Cases branding; needs its own brief | none here |

Courses 7 and 8 must not show or claim an attack half.

## 5. The whole-programme trailer

90 s, built around **"Play the attacker, then hold the line."**

1. **Cold open (8 s).** Delphine: "Go on then, I'll buzz you through." The door opens. Card: *You just got in.*
2. **The claim (6 s).** Card: *Cyber Aware. Play the attacker, then hold the line.*
3. **Play the attacker (24 s).** Fast cuts of the build across companies: OSINT note (ca12), pretext card, invoice template (ca01), look-alike page builder (ca05), spray across a staff list (ca18), assistant brief (ca13). Card: *Build the attack from what's public.*
4. **The flip (4 s).** Step strip ticks to Defend. "Now take the other seat."
5. **Hold the line (16 s).** Triage across kinds: email, call, visitor, QR, push. Card: *Then it lands on your desk.*
6. **The office (16 s).** Three room requests as questions: Graham (ca07), Darren (ca05), Lorna (ca18). Card: *In an office that notices.*
7. **The offer (10 s).** Cards: *20 topics · 5 companies · 15 minutes each*, then *Before-and-after checks, no free text recorded*, then *In the browser. No installs.*
8. **End (6 s).** Camila: "She said to come straight up." Cut to end card.

Social cuts: 30 s (beats 1, 2, 3 short, 5, 8) and a 15 s (beats 1, 2, 8).

## 6. Infographics and short animated explainers

"In map" means an SVG of it is already in the Cyber Aware Feature Map artifact.

| Graphic | Purpose | Content | Where used | Data source | In map |
|---|---|---|---|---|---|
| Episode flow | explain one session | brief, research, write or call, flip, defend, step away, office beat, recap, debrief | course pages, organiser pack, trailer beat 6 | `episode-model.js` STAGE_IDS; ca12 shape | yes (flow SVG) |
| Attack → flip → defend | the USP in one frame | three panels: build it, it lands, catch it | programme trailer, course page header | stages lists in each `scenario.json.erb` | partly (steps 2–5 of the flow) |
| Course map | which course has which episodes | 11 CA courses as rows, episodes as chips, checks at each end | Hacktivity catalogue, organiser pack | `awareness_event.rb` | no |
| 20 topics grid | breadth | 20 tiles: topic, company colour, attack or consequence-first marker | programme trailer beat 7, catalogue | `mission.json` display names | partly (tier map has the 21 tiles) |
| Five companies | the recurring world | five cards: sector, room still, two staff portraits, episodes set there | course pages, trailer end of segment | kit files, `episodes.json` company | no |
| Pre and post checks | what is measured | pre check, episodes, post check; AB/BA forms; "no pass mark"; first course is the measure | organiser pack, course page | `awareness_event.rb` CHECK_ORGANISER_NOTE; `ca_pre_*` | no |
| Living-office tier map | where the office plays a scene | E, O, T, S per episode | organiser pack, devlog | `episodes.json` tier | yes (tier grid) |
| What organisers see | trust and privacy | what is recorded (item ids, verdicts, times), what is not (free text, identity), what organisers see (completion and the before-and-after pair). Confirm the organiser view in Hacktivity before drawing; the discrimination figure is stored but shown to nobody | organiser pack, procurement | Hacktivity app views (check), ca00 brief | no |
| No VMs, no LLMs, browser only | remove buying objections | three icons and one line each | course page footer, trailer end card | footer of the feature map; mission descriptions | text only |
| Kit plus shell | how the office is built | kit, episode row, generator, shell | devlog and internal only | `apply_training_room.py` | yes (kit SVG) |
| The influence meter (animated, 10 s) | explain the call mechanic | the meter moving through Wary, Refuses, Reports | ca12 and ca03 trailers, Social engineering course page | `social-influence.js` thresholds | screenshot only |
| No-blame reporting (animated, 8 s) | tone | "Report, even after a slip": a wrong verdict followed by the no-blame line | all course pages | debrief no-blame line | no |

## 7. Theme options

Three directions, described in words only. A review page with stills comes after the owner picks a shortlist.

**A. Office daylight.** Palette: warm white, slate ink, one teal accent; each company keeps its own colour as a stripe. Type: a pixel display face (Pixelify Sans) for card titles, IBM Plex Sans for body. Opening: the kiosk screen wakes in a lit training room, the step strip draws across. Closing: the strip ticks its last step, the Cyber Aware mark settles on the kiosk. Cards: flat panels with a 2 px border, like the in-game kiosk. Music: light, mid-tempo electronic with a plucked lead. Reads as workplace training done well.

**B. Two seats.** Palette: split screen, red-brown for the attacker's half and blue for the defender's, neutral grey between, matching the map's `atk` and `def` tokens. Type: IBM Plex Mono for cards, pixel face for the title only. Opening: the screen splits; the left half types a pretext, the right half is an inbox; they swap at the flip. Closing: the halves close together into the mark. Cards: tab-like labels "ATTACKER" and "DEFENDER" on every card. Music: two motifs, a tense pulse for the attack and a steadier one for the defence, joining at the end. Sells the USP hardest.

**C. Case file.** Palette: manila, ink black, a highlighter yellow for the one word that matters. Type: a typewriter-style mono for cards, pixel face for titles. Opening: a case folder opens on a desk with the company name on the tab. Closing: the folder is stamped "Reported" and closes. Cards: index-card style with a pinned corner. Music: low-key, plucked bass, building at the flip. Fits consequence-first episodes well.

Recommendation: B for the programme and attack-episode trailers, with A's room footage underneath. Ask before committing.

## 8. Questions for the owner

1. **Which videos?** (a) all 20 episodes, then courses, then programme; (b) programme and 11 courses only; (c) one pilot episode, then decide. Recommend (c), then (a); episode-first is already your lean and its shots feed the rest.
2. **Length?** (a) 60 s episodes; (b) 45 s episodes and 60 s courses; (c) 30 s for everything. Recommend (b), with a 20 s catalogue cut from each.
3. **Narrator?** (a) none: game voices and cards only; (b) one CA host voice from the cast (Anjali, Lorna or Nilesh) across all trailers; (c) a new narrator voice. Recommend (a) for episodes, (b) for the programme trailer. (c) needs new TTS and your yes.
4. **Sign-off brand?** (a) Hacktivity; (b) a Cyber Aware mark, then Hacktivity small; (c) Cyber Aware only. Recommend (b).
5. **Platforms first?** (a) Hacktivity course pages, 16:9 silent with burned captions; (b) LinkedIn 1:1 and 9:16; (c) YouTube 16:9 with sound. Recommend (a), then (b); buyers browse with sound off.
6. **Theme?** (a) Office daylight; (b) Two seats; (c) Case file. Recommend (b), see section 7.
7. **Show attacker tools by name?** (a) name the tool on a card ("Look-alike page builder"); (b) show it with no label. Recommend (a), matching the SAFETYNET rule that a signature activity gets its own card.
8. **Consequence-first episodes: same template or their own?** (a) same template with the swapped beats; (b) bundle them only into courses 7 and 8. Recommend (a).
9. **Music?** (a) one CA track for every trailer; (b) one per company; (c) one per course. Recommend (a) with two cuts (attack pulse, defence), cheaper and more recognisable.
10. **Show debrief cost panels?** (a) the layer 1 cost line as text; (b) no debrief at all. Recommend (b) for episodes (verdict risk), (a) for the programme trailer with a generic line.

## 9. Order of work

1. Owner answers questions 1–6 on a review page with three theme stills per option.
2. Write `docs/video/recipes/course-trailer.md` as a variant of `mission-trailer.md` with the template above.
3. **Pilot: ca12, Visitors and tailgating.** It is the flagship (Gate C passed), tier E, and has the most cached lines (74). It shows every template beat in one run: the OSINT post, the pretext card, the call meter with a voiced target who gives way, the flip, reception triage, the step-away panel, the open screen and a visitor at the door, and a voiced recap. Screenshots of most beats already exist. Its room (Merrin & Sallow) also serves ca04, ca14 and ca18.
4. Scout ca12 (`video-scout`), record, edit, review through the loop.
5. Record the five company-room takes and the shared minigame takes from section 3.
6. One consequence-first pilot: ca15 (tier E, found stick request).
7. The other attack episodes in company batches (QI: ca03, ca05, ca08, ca10; BF: ca01, ca07, ca13; TL: ca02, ca06, ca09; MS: ca04, ca14, ca18), then the remaining consequence-first ones.
8. Course trailers from the episode edits; then the programme trailer.
9. Infographics in parallel once the theme is fixed: course map, five companies, pre and post checks, what organisers see.
