# core_12 game design: Open Book

## Concept

This is the shortest and most playful of the three attacker-view modules, and the one where the player does the attacker's work with their own hands. Jo Fairweather, on an authorised test, sits the player down at a corkboard and asks them to find out everything they can about one colleague, Leo, using only his public posts. Pin by pin, string by string, an ordinary, likeable person becomes a target: his employer, his manager, the new finance system, next week's holiday, his dog. Then the board becomes a script, as Jo shows how those scraps make a pretext call that would probably work. The turn comes halfway through: the same board that built the attack becomes the checklist for taking it apart, as the player locks down Leo's profile and their own, and then handles a "recruiter" trying the same trick live.

The emotional arc matters. The player should feel the small thrill of the detective board, then the slight chill of realising how little it took, then the satisfaction of cutting each string by changing a setting or removing a post. Leo is in on it (Jo's test is authorised, and he is thanked in the debrief), so nobody is humiliated, and the lesson lands on habits, not on blame.

## Setting and cast

- **Rooms:** `room_office` (the player's desk), `room_break` (Leo, cheerful and oversharing), `room_security` (Jo's board and the debrief). The feeds and the OSINT board are full-screen overlays (MG-13), so the module needs no new rooms.
- **Jo Fairweather** (ethical social engineer, Northlight Security) runs the OSINT build. Authorised test only; everything she pins was already public; she closes with what would have stopped her; nothing is a how-to.
- **Leo Brennan** (the player's desk neighbour) is the subject: friendly, posts everything, and the course's role model for owning a mistake and fixing it fast.
- **Ama Owusu** (mentor) gives the key messages and the reporting route.
- **New minor character (chat only):** "Ryan Decker", a fake recruiter whose profile is thin and new; generic avatar.
- **Gillian Marsh** (Chief Executive) appears as an impersonated profile in the Apply beat.

## Structure

The critical path is marked **(CP)**. Everything else is optional depth.

### 1. Hook: "First day with the new kit!" (1 minute)

- **(CP)** A notification: Leo has posted a cheery photo to a public feed, "First day with the new starter kit!", showing his lanyard and badge, his monitor with an email open, and a whiteboard behind him reading "Ledger go-live Dec". The player can like it, scroll past, flag it to Leo, or report it. The first action is the **baseline** for C12-LO2.
- Whatever they do, Jo messages: *"Saw Leo's post. Facilities have me testing you lot this week. Come and see what I can do with that one photo."* Into Learn.

### 2. Learn: "Building the board" (3 to 4 minutes)

- **(CP)** The player role-switches to work alongside Jo (BE-11, EX-06) at the OSINT board (MG-13). Jo asks the player to pin Leo's public posts and draw the string between them. Each pin is something Leo actually posted:
  1. His professional-network profile: employer, role, team, and his manager's name.
  2. A company job advert he shared: it names the new finance system, "Ledger".
  3. The "first day" photo from the hook: the badge and the whiteboard confirm Ledger and his access.
  4. A holiday countdown: he is away next week.
  5. A photo of his dog, "Biscuit", captioned as the answer to a "name a pet" meme.
- As the strings connect, Jo narrates the picture forming, then turns the board into a pretext. She reads out (fixed script, EX-05) the call she could make to Leo's covering colleague while he is away: *"Hi, I'm helping Leo with the Ledger access before he's back from Portugal, he said you'd be the one to ask..."* She stops there. *"I'm not going to make that call. But you can see I wouldn't need much. Every word of it came from his own posts."*
- Jo's "What would have stopped me" list builds: a locked-down profile, no badge or whiteboard in the photo, not naming the system, a private holiday, a made-up pet answer, and a colleague who checks back (core_02).
- Check question (MG-20): *"Which of Leo's posts gave away the most, and why?"*
- **Skip:** experienced players can speed through Jo's narration; the board and the list still appear.

### 3. Practise: "Post or Not?" (2 to 3 minutes)

- **(CP)** A quick drill (MG-13 feed mode and BE-10). A feed of draft posts and photos scrolls by; for each the player chooses **Post**, **Tweak** (crop out the badge, blur the screen, drop the system name, hide the location), or **Don't post**. Feedback is immediate, one line each.
- The items, getting subtler:
  1. A selfie with a lanyard clearly visible (Tweak: crop or remove the badge).
  2. "Loving the new [named security tool], so much better" (Tweak or Don't: do not name internal tools).
  3. A team photo with a whiteboard of client names behind (Tweak: no whiteboard).
  4. "Off to Spain for two weeks, house-sitter sorted!" (Tweak or Don't: do not broadcast an empty home or office).
  5. A genuinely fine post: a pet photo with no work detail and tight privacy (Post).
  6. "First day at [employer]! Here's my desk" with a screen in shot (Tweak: no screen).
  7. A child's first-day-of-school photo tagging the school by name (Tweak: a reminder that this answers a common security question).
- Over-caution (marking the harmless pet photo as "don't post") gets a gentle "that one's fine; here's what made it safe".

### 4. Apply: "Cutting the strings" (3 to 4 minutes)

- **(CP)** The player returns to themselves. Ama: *"Right, Jo's shown us the problem. Let's close the gaps, Leo's and yours."*
- **Lock down Leo's profile** (with his say-so) using MG-13's privacy side: set posts to connections only, hide the connections list, turn off location tags, remove or crop the risky posts, and change the pet-name security answer to a made-up one kept in the manager. Each change visibly cuts a string on Jo's board.
- **Lock down the player's own profile:** the same settings, on their account, so the lesson is personal, not just about Leo.
- **The fake recruiter (live):** "Ryan Decker" sends a chat (MG-05): a flattering role, then "to tailor the application, could you send over an overview of your company's systems and who runs IT?" The player chooses:
  - *"I'm not able to share that. Thanks anyway."* then reports the profile. (Best.)
  - Share a little "to seem keen". (Developing: the debrief shows what it gave away.)
  - Share the overview and the IT lead's name. (Not yet: the debrief shows the pretext it enables, no blame.)
- **An impersonation twist:** a profile in the CEO's name (Gillian) requests to connect with the player and several colleagues. The player can report it; the debrief notes that a fake senior profile lends weight to later scams.
- **Consequences** (no blame):
  - Each setting changed or post removed cuts a string on the board, shown live.
  - If the recruiter is fed information, a short scene shows a later pretext call using exactly that detail, then Ama's calm "this is why we hold it back".
  - Leo appears at the end, thanked for being a good sport: *"Honestly, I had no idea the whiteboard was in shot. Changing all that now."* He models owning it and fixing it.

### 5. Debrief (1 to 2 minutes)

- **(CP)** The debrief screen (BE-02), then Jo and Ama.
- Jo's board shown again, most strings now cut, each annotated with the setting or post that cut it.
- The hook (Leo's post) and its safe version side by side.
- The recruiter handled or not, and what it would have given away.
- Per-outcome results: Secure, Developing, Not yet.
- **The line to remember:** *"Before you post about work, ask what a stranger could do with it."*

### 6. Check (1 to 2 minutes)

- **(CP)** Ama's spot check on The Lark (MG-20): five items from the bank in `assessment.md`, covering every learning outcome.

### 7. Reference

- **(CP)** The Lark reference card (BE-09): think before you post, the privacy-settings checklist, security-question answers, who speaks for the organisation, and the reporting route (BE-05).

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| Hook: Leo's post | Flag to Leo or report / scroll past / like it | LO2 (baseline) | Jo uses the post; the debrief shows the safe version |
| Building the board | (guided) which posts give away most | LO1 | Jo's pretext forms from the pins |
| "Post or Not?" items | Post / Tweak / Don't | LO2 | Immediate feedback; the safe choices modelled |
| Lock down Leo's profile | Apply each setting / skip some | LO3 | Strings cut on the board as settings change |
| Lock down own profile | Apply each setting / skip some | LO3 | A personal before-and-after |
| The fake recruiter | Decline and report / share a little / share it all | LO4 | Reported; or a later pretext call using the detail |
| CEO impersonation | Report it / accept the connection | LO4 | A note on how a fake senior profile boosts later scams |

No option shames the player. The worst branch (feeding the recruiter) ends with Ama explaining, not blaming, and Leo models that owning an overshare and fixing it is the right move.

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-13 Social media profile and OSINT board** | new | The heart of the module: a corkboard-and-string board to build the picture of Leo (attacker side), a feed to mark in "Post or Not?", and a privacy-settings panel to lock down a profile (defender side) |
| **BE-10 Spot-the-risk** | new (feature) | "Post or Not?" feed marking |
| **MG-20 Knowledge check** | new | Jo's check question and the final spot check |
| MG-05 Messaging apps | new (shared with core_02) | The recruiter's direct message; a `phone-chat` chat skin until MG-05 exists |
| `person-chat` | existing | Jo, Ama, Leo |
| `notes` / `text-file` | existing | The job advert and the privacy checklist as in-world documents |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| Building the board | Jo (EX-06, BE-11, MG-13) | 3 to 4 minutes | The corkboard filling with Leo's posts and string; the "what would have stopped me" list | "Which post gave away the most, and why?" |
| Think before you post | Ama (EX-01) | 45 seconds | A photo with the badge, screen and whiteboard highlighted | none |
| Privacy in five minutes | Ama (EX-01) | 45 seconds | The settings checklist (who sees posts, tags, connections, location, old posts) | none |
| The fake recruiter | Jo (EX-05 scene) | 30 seconds | The thin, new profile with its warning signs ringed | none |

## Debrief

Shown on BE-02, then spoken by Jo and Ama:

1. The board, most strings cut, each annotated with what cut it.
2. Leo's post against its safe version.
3. The recruiter: handled or fed, and what that enabled.
4. Per-outcome results and the line to remember.

## Variants

- **Micro-drill:** "Post or Not?" on its own (BE-07, BE-10): six draft posts and photos, Post, Tweak or Don't, a fresh set each month (a conference selfie season, a summer-holiday run). About 3 minutes.
- **Text route:** Leo's posts and the board described as text with connections drawn as a list; "Post or Not?" as described posts to judge; the privacy settings as a checklist to toggle. Same decisions and debrief (BE-03).
- **Facilitated session:** the board on a shared screen; the team builds Leo's profile together, then locks it down. Pause points: after the board ("What could we find about our own team in ten minutes?"), after "Post or Not?" ("Where's the line between a normal life online and a gift to an attacker?"), after the recruiter ("Who would we check with before answering a message like that?"). About 30 minutes.
- **Replay and randomisation:** the subject's posts and the "Post or Not?" feed are drawn from a bank, and the recruiter's pitch changes per game, so colleagues cannot pass on answers. The annual edition swaps in current platform features and scam styles.

## Alternative concepts

1. **Two profiles (compare and fix).** The player is shown an oversharing profile and a careful one, side by side, lists the differences, then fixes the oversharing one. Simpler to build than the full board, and good for a facilitated "what does good look like?" session, but less of a hook than the detective board.
2. **The scammer's shopping list.** The player plays the attacker with a checklist ("find the manager's name, a system, a holiday, a security answer") and ticks each off from a feed, then sees the finished pretext, then flips to defence. A tighter, gamier version of the board that keeps the attacker view very short.
3. **Your own footprint.** The module helps the player search for and tidy their own public footprint (guided, private, nothing stored), making the lesson entirely personal. Powerful, but harder to assess consistently and to keep private, so better offered as an optional extra after the main module.

## Art and audio

- **Rooms:** existing office, break room and security office. No new rooms.
- **Characters:** Jo, Ama and Leo need their own art (shared across modules). The recruiter and the CEO impersonation use generic avatars.
- **New UI art:** MG-13 the corkboard with pinnable posts and string, the generic social feed, and the privacy-settings panel; the "cut string" animation when a setting changes.
- **Voice:** about 20 lines for Jo, 10 for Ama, 8 for Leo. No voiced line prints a variable: the subject's name and details appear on the board and in chat text, not in speech. Jo's pretext script is fixed and non-instructional (she never completes the call).

## Pitfalls

- **Keep the attacker view at "already public".** Jo only ever pins what the subject posted, and never demonstrates scraping tools or techniques; the lesson is how little public detail it takes, with the defence always named.
- **Protect the subject.** The board is built on the fictional Leo, with consent in the story, never on a real person or the player's real accounts during the attacker view. The "your own footprint" idea is an optional, private extra, not the core.
- **No blame, no shame.** Leo is likeable and owns his overshare; the player who feeds the recruiter gets an explanation, not a telling-off. Oversharing is framed as normal and fixable.
- **Do not teach unreliable "tells".** Fake-profile signs are hints, not proof; the reliable move is to share nothing sensitive and report, not to try to judge a photo as real or fake.
- **Mind the boundaries.** Phishing is core_01, pretext calls are core_02, being recruited against your employer is core_14, password and MFA setup is core_03. Keep each light and signpost it.
- **Keep it short and current.** At twelve minutes this is a light module; use a generic feed so it does not date, and refresh the scam styles in the annual edition.
