# role_02 game design: Payment Run

## Concept

This module is two built episodes plus one new episode, in the "Incident Simulations: Critical Cases" frame: a training room at Brightwell Foods with a kiosk and a host, no doors, no combat, no VMs.

- **Built foundation.** The learner is in Brightwell's accounts payable team.
  - **E1 *Invoice and bank-detail fraud*** teaches the core finance skill: a supplier asks to change its bank details, and a change plus a first payment plus a no match is the classic pattern. The learner researches, composes one bank-change email as the supplier, sees it flipped, then defends the payments inbox with Verify on.
  - **E7 *Cloned CEO voice*** teaches the "pay this today, don't wait" pressure from the top, and that a familiar voice is not a check.
  - The **finance check pair** measures both before and after, with each look-alike bank change paired against the real supplier's invoice.
- **New role extension.** One new finance episode in the same built shape covers what E1 and E7 do not: payroll diversion, Confirmation of Payee, a refund to a changed account, and card data by email. Plus concept cards for the first hour after a fraud.

The stories a learner takes away are the built ones: "The voicemail was the chief executive's voice. It wasn't the chief executive." "The account changed on Sunday night, and today was the first payment." "I rang the number from the contract, not the one on the email."

The old Larkspur Payment Run, its thirty-row MG-15 desk, its `dual-auth` two-approver panel and its `command-board` recovery timeline are retired: they would redesign well beyond what the build has. The two-approver run and the recovery timeline are kept in the `features/minigames.md` catalogue (build status "not built") as a later, larger build. The first hour is taught here as a concept card and one defend item.

## Setting and cast

- **Company:** Brightwell Foods (`brightwellfoods.example`), a food manufacturer in the East Midlands, room `room_aw_brightwell`. Hosts: **Adaeze Okafor** (finance manager, E1) and **Agnieszka Duda** (payroll officer, E7).
- **The learner:** an accounts payable analyst at Brightwell (`displayName: "Learner"`, the built default), with their chosen avatar.
- **Built Brightwell cast** (already set in `BRAND_SET.md`): **Tom Reilly** (AP clerk, the colleague fooled in E1's flip), **Ravinder Sandhu** (chief executive, impersonated in E1 and E7), **Mei Lin Chau** (procurement buyer), **Gwen Pritchard** (IT service desk lead). Suppliers: Harlow Packaging, Pennine Oat Mills, Castell Fruit Co., Dunmore Dairy and others; the genuine bank is Calderbrook Bank, and Fernhill Business Bank and Merrow Logistics are names that have no reason to send.
- The old Larkspur cast (Eleni Markou, Bea Thornton, Hassan Qureshi, Kev Sutcliffe) is retired as a recurring workplace. Where the new finance episode needs a payroll victim or a second preparer, it uses the Brightwell cast: Agnieszka in payroll, Tom in accounts payable. Any additional name needs the pre-ship web-search and surname-clash check.

## Structure

### Built foundation: E1, E7 and the finance checks

Already built; summarised so this module reads whole. Each episode follows brief and scope note, attack half (OSINT then one templated message, unscored, red-flag meter), flip (the learner's message in the inbox, tells named), defend half (triage with Verify on and mirror pairs, scored), and debrief (per-item cards, genuine-item feedback, the team tally, the habit, an "On Monday" card, the reporting route, no blame).

- **E1** defends the payments inbox (6 emails, 3 phish): a look-alike bank change on INV-2217, a chief executive wire on freemail, and genuine items including the "confirmed by phone" bank change that models the safe version of the same request. Evidences R02-LO1 and LO2 in part.
- **E7** defends the finance line (3 voicemails and 2 emails, 2 phish) with the voice concept panel. Evidences R02-LO3 in part.
- The **finance AB and BA checks** bracket the episodes. Do not redesign any of this.

### New episode: finance deep (payroll, Confirmation of Payee, the first hour)

In the built shape at Brightwell:

**Brief and scope note.** Agnieszka welcomes the learner; it is month end and payroll is close to a cut-off.

**Attack half (unscored, red-flag meter).** OSINT on Brightwell's public pages and a staff member's public posts, then compose one "new bank, please update my salary before payday" email in a colleague's name, from templates filled by found facts. This extends E1's supplier impersonation to the payroll channel. Nothing real is sent.

**Flip.** The learner's own message lands in payroll's inbox with its tells named: a personal sending address, urgency around payday, a change that skips the HR system.

**Defend half (scored, Verify on, mirror pairs).** A payroll and payments inbox to triage, each phish with a close genuine twin:

| # | Phish item | Genuine twin | Flags | Verdict that scores |
|---|---|---|---|---|
| 1 | "New bank, update my salary before payday", personal address | A genuine HR-system change notification | personal sender, urgency, bypasses the route | Report; the real change goes through HR |
| 2 | A refund request "to our new account" | A genuine refund back to the original account | changed bank details | Verify, then refund the way the money came |
| 3 | A supplier bank change with a no match on Confirmation of Payee | A genuine change with a match, confirmed by phone | changed bank details, no match | Verify on the number from the contract |
| 4 | A card photo emailed to pay an overdue invoice | A genuine payment through the secure link | card data by email | Delete by the card procedure; reply with the link |

**Debrief cards.** Per-item reasoning; genuine-item feedback; the team tally; **the habit to keep**, quoted word for word:

> When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do.

An "On Monday" card for finance: *"Check the change, not the paperwork. Two people, both checking."* A concept card on **the first hour** (ring the bank's fraud line first, keep the evidence, tell security and the DPO where staff data changed, make sure the person is paid, report to Report Fraud). A concept card on **Confirmation of Payee** (a no-match is a reason to check, not to retype the name). Then the reporting-route box and the no-blame line.

## Decisions and consequences

Every scored item pairs a threat with a doable action and never shames the player. No option about a colleague's honest slip is framed as blame: the debrief thanks anyone who owns up quickly, and treats a reported mistake as a good outcome (the build's no-blame line).

| Item | Caught by | Learning outcome |
|---|---|---|
| Payroll "new bank before payday" | The HR-system route and direct confirmation | LO4 |
| Refund to a changed account | Refund the way the money came | LO4 |
| Supplier change, no match | Verify on the number from the contract | LO1 |
| Card photo by email | The card procedure and the secure link | LO6 |
| E7 voicemail (built) | Check the chief executive another way; the two-approver process still applies | LO3 |

## Minigames

| System (built) | Use here |
|---|---|
| Episode runner (`minigames/episode-runner/`) | The spine of E1, E7 and the new finance episode |
| OSINT browser and intel facts | The research stage |
| Mail client in template mode with the red-flag meter and `systems/phish-rules.js` | Compose the one templated message |
| Flip view | The learner's message seen from the inbox |
| Inbox triage with the Verify verdict, the `voicemail` kind (E7) and the header panel | The defend sets, with mirror pairs |
| Debrief view | Per-item cards, the habit, the On Monday card, the reporting route, no blame |
| Concept cards and the voice panel | Confirmation of Payee, the first hour, card data; "voices can be faked" (E7) |
| Awareness measurement and the comparison panel | The finance checks |

No new minigame is built. The MG-15 payment-run desk, the `dual-auth` rework, MG-25 document inspector and the `command-board` recovery timeline are a later, larger idea in the `features/minigames.md` catalogue (build status "not built").

## Explainers

Concept cards, the voice panel, immediate per-item feedback and the debrief, not a mentor or video (R9):

| Concept card | Shown where | Covers |
|---|---|---|
| Check the change, not the paperwork | E1 debrief | LO1 |
| Confirmation of Payee | The new episode's defend half | LO1 |
| Voices can be faked | E7 voice panel | LO3 |
| The first hour | The new episode's debrief | LO5 |
| Card data: do and don't | The new episode's debrief | LO6 |

No video. If a customer insists on a talking-head, the file marks it optional only and it is not built.

## Debrief

Shown on the built debrief view for each episode:

1. A per-item reasoning card for each defend item.
2. Detailed feedback on the genuine items (which the learner trusted, checked or flagged).
3. The team-protected tally.
4. **The habit to keep** (quoted above).
5. The "On Monday" card: *"Check the change, not the paperwork. Two people, both checking."*
6. The reporting-route box and the no-blame line.

## Variants

- **Defend-only variant:** each episode as brief, defend, debrief (about 8 minutes), same defend set, for customers who object to the "write a phish" beat.
- **Facilitated session:** the `facilitated` flag on the full episode, played on a shared screen with a pause panel between stages for team discussion (would we text a colleague off sick; which row would we have missed; who here has access they no longer need). The build's facilitated flag hides per-learner scores on the shared screen.
- **Text route:** each stage as text with the same options and the same records; a gap in the build (BE-03).
- **Spaced practice:** the defend-only shell as a monthly "run review" drill; the finance checks repeated each year.
- **Replay:** the supplier carrying each look-alike, the amounts and the names vary; the attack half is never scored or ranked.

## Alternative concepts

1. **The month-end run (consequence flip).** If a two-approver run desk is ever built, a consequence-flip episode (R3) could let the learner release a bad row in a safe sandbox and show where it led, with no live attacker. Kept in the backlog.
2. **Run Review (defend-only drill).** A short defend-only shell of changed-account, duplicate and odd-set-up items, drawn from the finance pool, as a monthly micro-drill.
3. **Red Team Finance (attacker-first, built shape).** The attack half already shows how little a fraudster needs: councils' published spending, a supplier's public contacts, an out-of-office that names who covers payments. This is the built attack stage, not a separate red-team mentor; the awareness product has no runtime attacker guide.

## Art and audio

- **Rooms:** `room_aw_brightwell` (training-room review cycles C1 to C3 are closed and the POV conversation backgrounds are made, wired and approved).
- **Characters:** Brightwell's Adaeze Okafor, Agnieszka Duda, Tom Reilly, Ravinder Sandhu and Mei Lin Chau use their awareness art; host art follows the PixelLab reset (3 Nov), with all 19 concepts approved.
- **Voice:** text-to-speech only (no runtime language model). E7's voicemail uses the chief executive's own course voice, lightly phone-filtered: the lesson is that it sounds exactly like them. No voiced line prints a variable: amounts, payee names, account details and the learner's name stay on screen, so the voice cache stays keyed on exact text.
- **Props:** the card photo in any item is a plainly fictional design with most digits masked; never a real or published test card number.

## Pitfalls

- **Never use real card or bank numbers,** including published test card numbers.
- **Keep the defend sets fair, not a slog.** Mirror pairs mean every phish has a close genuine twin, so the learner practises the difference, not a surface cue.
- **Late is a good outcome.** Holding a payment is never treated as a failure; reporting is never penalised.
- **No blame.** A reported mistake is a good outcome; the debrief thanks anyone who owns up.
- **Don't teach voice-spotting.** E7's voicemail is meant to sound right; the lesson is the process (core_15 covers deepfakes).
- **Get the recovery facts right:** the paying organisation's bank starts a recall; the employee's bank can't; any recovery figure is illustrative, never a statistic.
- **Card data at awareness level:** the organisation's procedure, not a QSA's checklist; phone card payments belong to role_06.
- **Fictional names only in the game:** Brightwell and its suppliers are invented; real cases appear only in `concepts.md`.
