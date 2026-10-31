> **For the build, this design is superseded by `../../implementation/11_WP12_FIRST_PLAY_AND_ANNUAL.md (Part A)`.** That implementation brief is checked against the code and the built content and wins wherever the two differ (company, host, stages, items, config). This file stays as design background: the intent, the alternatives and the reasoning.

# core_00 game design: First Play

core_00 is not an episode. It is the first-play "how it works" brief inside the kiosk frame, shown once per learner before their first episode. The old "First Day" morning at Larkspur Group (the walk round the building, the reception scene, the fake payroll email) is retired; the world is now a training room at a client company, and the orientation it needs is short. Where a scenario file and this description differ, the scenario file wins.

## Concept

The first time a learner taps any training kiosk in the "Incident Simulations: Critical Cases" line, a short brief plays inside the kiosk before that episode's own brief. The host welcomes them, says plainly that this is an authorised exercise at a fictional company, walks them through how the stages work, promises that nothing real is ever asked for, says what is recorded and who sees it, and names the one habit the whole product comes back to. It takes two to three minutes and appears once per learner. After it, the learner's first episode begins as normal.

The point the learner should take away: this is practice, it is safe, nobody is caught out, and the one thing to remember is to stop and check an unexpected request through a route they already trust.

## Setting and cast

The world is the built one: one training room per company, a kiosk and a host, no doors, no combat, no VM. Larkspur Group is retired as a setting, and the old cast (Maureen, Precious, Ama, Kai, Owain, Leo, Lena, Gillian, Tomasz and the rest) does not appear. There is no mentor and no building to walk round.

The brief is hosted by **whichever episode's host the learner opens first**, at that company:

- Adaeze Okafor at Brightwell Foods (E1), Fatima Begum at Tarrowby Logistics (E2), Darren Price at Quayholt Insurance (E3), Thandiwe Moyo at Merrin & Sallow Architects (E4), Niamh Doherty at Quayholt (E5), Chidi Okeke at Tarrowby (E6), or any other host, drawn from `BRAND_SET.md`.

All people and companies are fictional. The learner is the player, whose chosen avatar always wins and whose portrait follows it.

## Structure

The brief is a short run of concept cards inside the kiosk, before the first episode's brief. There is no attack, flip or defend half, and nothing is scored.

1. **Welcome and scope note.** The host welcomes the learner and says: an authorised exercise at a fictional company; everything here is practice.
2. **How it works.** A concept card: the runner steps through a brief, an attack half (you build one message from a company's public details), a flip (you meet it in the inbox), a defend half (you sort the post with Trust, Report, Delete and sometimes Verify, and name the tells), and a debrief. The step strip shows where you are. Only the defend half is scored, and the attack half never is.
3. **Nothing real.** A concept card: the product never asks for your real password, bank details or personal information; sign-in pages and forms are models that capture nothing.
4. **What we record, and who sees it.** A concept card and a **Got it** button: what is recorded (the items, your verdicts, the flags, times), that no free text and no identity sit in the record, that results go to the learner and an organiser-only aggregate figure, and that your choices are practice and are never used for discipline. This card appears once per learner for the whole product.
5. **Why you.** A concept card: most attackers are criminals after money, they want what your access opens, and most attacks begin with a message, a call or a stolen password.
6. **The habit to keep.** A concept card quoting the rule of thumb word for word.
7. **Report, and no blame.** A concept card: how to report here (the customer report route), that reporting is never wrong, and that reporting a mistake quickly is thanked, not punished.

Then the learner's first episode brief begins.

## Decisions and consequences

The brief has no scored decisions. Its only interaction is the **Got it** button on the "what we record" card, and the settings the learner can open before any sound plays. Nothing here is a baseline, a pass or a fail: the measurement lives in the episodes' defend halves and the pre and post checks. No option shames the player, because there is no option to get wrong.

## Minigames

| System | Use here |
|---|---|
| Episode runner and kiosk frame | The brief plays inside the kiosk, before the first episode's brief |
| Concept cards | The vehicle for every card of the brief |
| The "what we record" notice | Shown once per learner, with the Got it button |
| Host NPC and scope note | The welcome |

No new minigame is needed; the brief is authored cards in the existing frame. The authorable title and tutorial (BE-20) is the one engine piece, so the opening shows the course's title rather than the platform's.

## Explainers

No mentor NPC and no video. The host welcomes, and the concept cards carry the brief. Text to speech provides the host's lines. There is no produced or engine-recorded video (R9: the build uses hosts, concept cards, feedback strings and text to speech).

## Debrief

The brief has no debrief of its own: it leads straight into the first episode. Every episode's debrief then carries the habit to keep, the "On Monday" card, the customer report route and the no-blame line, so the points made in the brief are met again in context.

**The habit to keep** (identical in all shells, enforced by a test), quoted on its card:

> When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do.

"Pause. Check. Report." is not used.

## Variants

- **Defend-only variant:** not applicable; the brief is not an episode.
- **Text route:** not yet built (BE-03). As the first thing a learner meets, the brief must work by keyboard and as text, with settings reachable before any sound plays (BE-04); this is a gap the plan keeps.
- **Facilitated session:** for an induction group, the facilitator can show the brief on a shared screen before the first episode; the `facilitated` flag exists but no shipped shell sets it.
- **Replay and randomisation:** the brief is shown once per learner and does not randomise; it is refreshed only when a fact changes (for example, a reporting service is renamed).

## Alternative concepts

The old plan's alternative "First Day" games (the bingo scavenger hunt, the Groundhog Morning loop, the Shadow Kai office) assumed a walk-round world that the build does not have. They are retired. The orientation is now a short brief inside the kiosk, because the built product has no building to explore.

## Art and audio

- **Rooms:** whichever company's training room the learner's first episode uses; no new room.
- **Host:** the first episode's host carries the brief; no new character.
- **New UI art:** the course title and the first-play brief cards (BE-20), in the course's own style, in place of the platform title the shell still shows.
- **Voice:** text to speech for the host's lines. No voiced line prints a variable: the organisation's name, counts and the report route are on screen only.
- **No video.**

## Pitfalls

- **Don't rebuild the old morning.** There is no reception, no walk, no building; the brief is short cards in the kiosk.
- **Keep it to two or three minutes.** Everything except the habit and the "what we record" card is one line; the episodes do the teaching.
- **The right tone on screen.** The title and the brief must not show the platform's own branding or offer hooded hackers and spies (BE-20); this is the first impression for staff who may never have played a game.
- **A real reporting route.** The brief is weaker if the customer report route is not set; it comes from the slot, and the deployment setting is pending the user.
- **Promising what the organisation won't deliver.** The no-blame card is only credible if the organisation backs it; the "honest mistakes are not disciplined" statement is an organisation slot.
- **Asking for anything real.** Say on the title and the "nothing real" card that the product never asks for a real password or real details.
- **No claims of effectiveness.**
