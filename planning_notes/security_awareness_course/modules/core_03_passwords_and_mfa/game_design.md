# core_03 game design: Keys to the Kingdom

core_03 is delivered by the built MFA-fatigue stage inside E3, plus one new episode this plan adds, E9 *passwords and password managers*, designed in the built shape. The E3 stage is described as built, not redesigned. Where a scenario file and this description differ, the scenario file wins.

## Concept

The password and MFA outcomes play out as attack-then-defend episodes in a training room at a client company. The signature idea is the one the attack half produces on its own: a stolen or reused password is the key to everything, and most are not cracked by genius but guessed, reused or phished. In E9 the learner first runs a guessing and reuse rig against a fictional colleague from that colleague's own public details, then flips to their own account under a prompt flood and locks it down: a manager, a unique password for every account, made-up security answers and a passkey. E3 already carries the MFA-fatigue half: the flood, the fake "IT" number, and "if you didn't start it, deny it and report it".

## Setting and cast

The world is the built one: one training room per company, a kiosk and a host, no doors, no combat, no VM. Larkspur Group is retired as a setting, and the old cast (Owain, Ama, Kev, Jas and the rest) does not appear. The host welcomes; the debrief teaches. The night-time bedroom scene, the warehouse walk and the service-desk conversations of the old plan are gone; their content becomes defend cards and concept cards in the built shape.

| Episode | Topic | Company (room) | Role | Host |
|---|---|---|---|---|
| E3 (MFA stage) | MFA fatigue, inside the help-desk episode | Quayholt Insurance | helpdesk | Darren Price |
| E9 (new) | Passwords and password managers | Tarrowby Logistics | all staff (depot flavour) | Nilesh Solanki, IT service-desk analyst |

Tarrowby fits E9: a haulier's depot has shared PCs, sticky notes and warehouse logins, which make the password habits concrete. Any depot colleague who appears (a supervisor who uses one password for everything, a driver who can see a screen from the loading bay) is drawn from the Tarrowby cast in `BRAND_SET.md`, not from the old course cast. All people and companies are fictional; every domain ends `.example`.

## Structure

### The E3 MFA stage: as built, not redesigned

Inside E3 (`research/built_episodes_vs_plan.md` §1.2):

- **Attack half:** an attacker-side push flood in the mock authenticator; the learner chooses how many pushes to send and when (for example late at night), and the debrief explains why fatigue works.
- **Defend half (role swap):** one card is an unrequested push; the right move is deny and report, Verify on.
- This carries C03-LO5. The helpdesk check form includes the push item.

### E9 passwords and password managers (new, built shape)

- **Brief and scope note.** Nilesh Solanki welcomes the learner to the Tarrowby training room: *"Most passwords aren't cracked. They're guessed, reused or handed over. Let's see how, then shut it down."*
- **Attack half (unscored).** The learner plays the authorised red-teamer running a guessing and reuse rig against a fictional depot colleague:
  - In the OSINT browser they collect the colleague's public details as typed intel facts: a pet's name, a football team, the year the firm was founded, a hobby site the colleague once used.
  - They assemble a guess list from a template whose blanks take only those facts (`<team><year>`, `<pet>!`, the company name plus a year), and a guesser ticker strikes each one through as it "lands", starting with the commonest passwords (`123456`, `password`) and the local patterns. It shows the order attackers guess in, never a tool or a method.
  - A reuse step: the colleague's breached hobby-site password is tried on the work account and works. The red-flag meter notes that reuse is the multiplier.
  - A three-random-words passphrase is still being tried when the rig is switched off, to make the length point. Nothing typed is a real password; the guesser is authored data.
- **Flip.** The learner's own account comes under a prompt flood: prompt after prompt at an odd hour, then a fake "IT" message giving a number to type "to make them stop". The flip shows that someone now has a password, which sets up the defend half.
- **Defend half (scored).** Triage in the authenticator demo and on password-practice cards, Verify on:
  - a sign-in push for a service the learner just signed in to (approve), matched with a push they did not start (deny and report), matched with the fake "IT" number (deny and report);
  - a "which passphrase is stronger?" card: three random words against the company name plus a year and a `!` (choose the words);
  - a new supplier-portal sign-up: a unique generated password against "use my usual" (choose generate); a made-up security answer against the true one (choose made-up);
  - a sign-in-method ladder card: passkey, then app with number matching, then text code (choose the strongest offered);
  - a shared-PC card: a depot PC with its password on a sticky note, visible from the loading bay; the move is not to use it but to ask for your own account or the service desk (this remaps the old warehouse scene).
  Each card shows its reasoning at once; the strength meter and guesser show why personal details and swaps add little and another random word adds a lot.
- **Debrief.** Reasoning cards, genuine-item feedback, the team-protected tally, the habit to keep, the "On Monday" card as *three things to do at home tonight* (turn on 2-step verification or a passkey for personal email; check your personal email on a breach-checking site; switch on a password manager, email first), the customer report route and the no-blame line.

E9 has a defend-only variant (brief, defend, debrief) and feeds items into the general or mobile check forms (the push item is already in the helpdesk form from E3).

## Decisions and consequences

The attack half is authored choices (which found fact to guess with, which reused credential to try), judged by the authored guesser and never scored against other learners. The defend half carries the score through the verdict, the flags and the password choices. No option shames the player: approving a flood prompt, or keeping a weak passphrase, ends with the debrief showing why on the meter, with no blame for past reuse.

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| A sign-in prompt | approve your own / deny and report one you didn't start | LO5 | Reasoning card; the flood and fake "IT" number as the mirror |
| The fake "IT" number | type it / deny and report | LO5 | Reasoning card: the number came off the attacker's screen |
| Passphrase strength | three random words / company plus year plus `!` | LO2 | The meter and guesser, at once |
| New sign-up password | generate unique / reuse the usual | LO1, LO3 | Vault health; the reuse rig from the attack half as the mirror |
| Security question | made-up answer / true answer | LO3 | Stored with the login; the reasoning card |
| Sign-in method | passkey / app / text code | LO4 | The look-alike passkey test (only works on the real site) |
| Shared PC sticky note | ask for your own account / use the note | LO6 | The loading-bay view; the reasoning card |

## Minigames

Built and reused, plus one new surface:

| System | Status | Use here |
|---|---|---|
| Episode runner and step strip | built | The wrapper for E3 and E9 |
| MFA authenticator demo | built | The E3 flood; E9's flood, practice prompts and look-alike passkey test |
| OSINT browser and intel facts | built | E9's guess-list attack |
| Inbox-triage defender | built | E9's prompt and sign-up cards (`push` kind), Verify on |
| Flip view, concept cards, debrief view, awareness-measure records | built | As across the product |
| Password-manager and passphrase surface | new | E9's word tiles, strength meter, guesser, vault health and sign-up fill test, with no free-text password field |

## Explainers

No mentor NPC and no video. The host welcomes; the debrief teaches. Concept cards carry the short points (how passwords are stolen; the sign-in ladder; browsers, notes and managers; what a passkey is). Text to speech provides the host and voice lines. The "guessing rig" is the attack half, not a tester's demo.

## Debrief

The built debrief view: a reasoning card per item, genuine-item feedback, the team-protected tally, the habit to keep (quoted word for word), the "On Monday" card (three things to do at home tonight), the customer report route and the no-blame line.

**The habit to keep:**

> When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do.

## Variants

- **Defend-only variant:** E9 has one (about 8 minutes): brief, defend, debrief, same defend set.
- **Text route:** not yet built (BE-03), kept as a gap. The password surface records the same rows as the text route when built.
- **Facilitated session:** the `facilitated` flag exists; no shipped shell sets it.
- **Replay and randomisation:** matched items with disjoint slots across the A and B check forms; the guesser's examples, the breached site and the shared-PC wording vary per play; the sign-in ladder is refreshed as advice moves (the NCSC's passkey advice changed in April 2026).

## Alternative concepts

The built shape is settled. The old plan's "Key Ring" metaphor level, the "Pattern Spotting with Jo" workshop and the "2am Club" team mode are closed: the attack half (the guesser and the reuse rig) and the flip (the flood) deliver the attacker view and the pressure, and Jo Fairweather is dropped.

## Art and audio

- **Rooms:** the Quayholt (E3) and Tarrowby (E9) awareness rooms, dressed per company.
- **Hosts:** Darren Price (E3), Nilesh Solanki (E9).
- **New UI art:** the authenticator screens (built); the password surface (word tiles, meter, guesser) in the game's pixel style, legible at small sizes.
- **Voice:** text to speech for the host lines. No voiced line prints a variable or a real password: the guesses, the numbers and the counts are on screen only, and the word tiles are game words.
- **No video.**

## Pitfalls

- **Never collect a real password.** Word tiles only; no free-text password field anywhere; codes and numbers are made up. Say so on screen.
- **No fake precision.** The meter's bands are a rough guide from an established estimator; never print "3.4 billion years".
- **Don't reward complexity rules.** The meter must not score `P@ssw0rd!` as strong for having symbols.
- **Don't blame the player for reuse.** The reuse step is shown as ordinary and common, never as the learner's fault.
- **Keep the flood calm.** No alarms, no red screens; the authenticator demo waits for an answer, and under reduced motion the phone does not shake.
- **Stay out of core_02.** No cold calls asking for codes in E9; the only "IT" pressure is the one flood message, as in E3's build.
- **Don't oversell passkeys.** They resist phishing; the device and the account that syncs them still need protecting.
- **No claims of effectiveness.**
