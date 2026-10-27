# role_07 game design: Due Diligence

## Concept

role_07 is a new role that extends the built episode E1's supplier impersonation. It is designed in the "Incident Simulations: Critical Cases" shape: a training room at Brightwell Foods with a kiosk and a host, no doors, no combat, no VMs. The learner is in Brightwell's procurement team, which manages a long supplier list for a food manufacturer whose own NHS and council customers ask it for cyber assurance.

- **Attack first (extends E1).** E1 taught that a supplier's message can be impersonated. Here the learner researches a supplier's public details and composes one supplier-impersonation message (new bank details, an engineer who needs access, or "we've had a breach, act now"), sees it flipped, then defends a procurement inbox where genuine supplier messages sit beside impostors.
- **Consequence flip (R3).** The parts of procurement with no live attacker: the learner chooses a supplier on claims, accepts weak clauses, or leaves accounts open at exit in a safe sandbox, and the flip shows where each led, six months and two years on.

The stories a learner takes away: "The glossy one's ISO certificate only covered their sales office." "We read about our supplier's breach in a trade newsletter before they told us, because we'd accepted 'without undue delay'." "Two years on, an engineer who'd left the supplier still had an account."

The old Larkspur Due Diligence, its MG-22 supplier-assessment bid grid and clause step, MG-25, MG-18 and the `log-filter` breach-day view are retired; they would redesign beyond the build. The bid-grid minigame is kept in the `features/minigames.md` catalogue (build status "not built").

## Setting and cast

- **Company:** Brightwell Foods (`brightwellfoods.example`), a food manufacturer in the East Midlands, room `room_aw_brightwell`. Host and co-mentor: **Mei Lin Chau**, procurement buyer (built E1 cast), thorough and sceptical of glossy pitches.
- **Built Brightwell cast** (in `BRAND_SET.md`): **Gwen Pritchard** (IT service desk lead), who sets up and removes supplier access. A Brightwell data protection officer owns the notification decision on breach day. (Where the old plan used Larkspur's Ama Owusu, Tomasz Wiśniewski and Owain Jenkins, this module uses Gwen Pritchard for IT and a Brightwell DPO; any additional name needs the pre-ship web-search and surname-clash check. There is no recurring course mentor; the host carries the welcome.)
- **Three bidders' representatives** (fiction, video-call portraits and talk sheets only, appearing in the consequence-flip episode; names to be checked for clashes before release):
  - **Teodora Ilie** at **Rotafell Ltd**: small, plain-spoken, offers a penetration test letter in place of SOC 2.
  - **Jasper Holt** at **ShiftHarbour**: confident, "military-grade", claims without evidence.
  - **Mariam Haddad** at **Tidewell Workforce**: precise, large, loyal to standard terms.
- Suppliers in the register carry over from E1 and the brand set (Harlow Packaging, Pennine Oat Mills and others); Northbeck Supplies is the dependency example whose mailbox was taken over in E1.

## Structure

### Attack-first episode: the procurement inbox (extends E1)

**Brief and scope note.** Mei Lin welcomes the learner; supplier messages are stacking up and a new system is being bought.

**Attack half (unscored, red-flag meter).** OSINT on a supplier's public details, then compose one supplier-impersonation message from found facts: a "new bank details" email (E1's pattern), a "grant our engineer access" request, or a "we've had a breach, send credentials or payment now" notice. Nothing real is sent.

**Flip.** The learner's own message shown from the procurement inbox, its tells named: a look-alike domain, a change plus urgency, a request that only a verified route can safely satisfy.

**Defend half (scored, Verify on, mirror pairs).** A procurement inbox to triage, each phish with a close genuine twin:

| # | Phish item | Genuine twin | Flags | Verdict that scores |
|---|---|---|---|---|
| 1 | A fake supplier breach notice: "send your credentials to secure your account" | A genuine supplier breach notice asking you to call a number already held | breach pretext, credential lure | Verify, then escalate and Report |
| 2 | A fake "grant our engineer access" request | A genuine access request booked through the IT gateway | access request, no change ticket | Verify; refuse the unapproved route |
| 3 | A bid email full of claims ("military-grade", "ISO certified") with a link to "evidence" | A genuine bid with an evidenced certificate for the service | claims only, link credibility | Report or Delete; ask for evidence |
| 4 | A supplier "new bank details" email, look-alike domain (E1 pattern) | A genuine change confirmed by call-back on the number held | look-alike domain, changed bank details | Verify on the number held |

**Debrief cards.** Per-item reasoning; genuine-item feedback; the team tally; **the habit to keep**, quoted word for word:

> When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do.

An "On Monday" card for procurement: *"Evidence, not claims. Put it in the contract. Close every account at the end."* Concept cards on the four ways a supplier can hurt you and the evidence ladder. Then the reporting-route box and the no-blame line.

### Consequence-flip episode (R3): tiering, evidence, clauses and offboarding

No live attacker, so the learner makes the everyday procurement mistakes in a safe sandbox and the flip shows the consequence, six months and two years on:

- **The mistakes:** sign on claims (ShiftHarbour's unverified badges); accept "without undue delay" instead of a number of hours; accept "trusted partners" instead of a named subcontractor list; set up one shared admin account without MFA; leave the supplier's accounts open at exit.
- **The flip:** six months on, a supplier's own file-transfer provider is breached and the notice arrives nine days late (or on time, if the clause was held); the shared account without MFA has signed in from an unfamiliar country and exported from the HR integration. Two years on, an engineer who left the supplier a year ago still has a live account, and the data has no deletion certificate.
- **Debrief cards:** tiering (what they hold, reach, run, who else); the evidence ladder (who checked it, what did they check, when); the clauses that matter; supplier access from first day to last.

## Decisions and consequences

Every item pairs a threat with a doable action and never shames the player. Signing on claims in the flip is caught by Brightwell's own countersignature control and framed as the form doing its job on a busy person; reporting a supplier approach is always the good outcome.

| Item | Caught by | Learning outcome |
|---|---|---|
| Fake supplier breach notice | Verify on a held number; escalate | LO6 |
| Fake access request | The IT gateway and a change ticket | LO5 |
| Claims-only bid email | Ask for evidence that fits the risk | LO3 |
| Supplier "new bank details" (E1 pattern) | Call back on the number held | LO6 |
| Sign on claims (flip) | Evidence in scope and in date | LO2, LO3 |
| Weak clauses (flip) | Notice within hours, named subcontractors, deletion certificate | LO4 |
| Access left open (flip) | Remove everything at exit; rotate secrets | LO5 |

## Minigames

| System (built) | Use here |
|---|---|
| Episode runner (`minigames/episode-runner/`) | The spine of the attack-first episode and the consequence flip (R3) |
| OSINT browser and intel facts | The research stage |
| Mail client in template mode with the red-flag meter and `systems/phish-rules.js` | Compose the one supplier-impersonation message |
| Inbox triage with the Verify verdict | The procurement inbox, with mirror pairs; E1's look-alike and changed-bank patterns |
| Flip view, debrief view, concept cards | The flip, the debrief and the tiering, evidence and clause cards |
| Awareness measurement and the comparison panel | The new procurement checks |

No new minigame is built. The MG-22 bid grid and clause step, MG-25, MG-18 and the breach-day log view are a later idea in the `features/minigames.md` catalogue (build status "not built").

## Explainers

Concept cards, immediate per-item feedback and the debrief, not a mentor or video (R9):

| Concept card | Shown where | Covers |
|---|---|---|
| Four ways a supplier can hurt you | Attack-first debrief | LO1 |
| The evidence ladder | Consequence-flip episode | LO3 |
| Tiering: what will they touch? | Consequence-flip episode | LO2 |
| The clauses that matter | Consequence-flip debrief | LO4 |
| Supplier access, first day to last | Consequence-flip debrief | LO5 |

No video. If a customer insists on a talking-head, the file marks it optional only and it is not built.

## Debrief

Shown on the built debrief view for each episode: per-item reasoning cards; genuine-item feedback; the team-protected tally; **the habit to keep** (quoted); the "On Monday" card; the reporting-route box; the no-blame line. The consequence-flip debrief shows the contract as a board: each clause held or traded, and what it gave or cost on breach day and at exit.

## Variants

- **Defend-only variant:** the attack-first episode as brief, defend, debrief (about 8 minutes), same defend set.
- **Facilitated session:** the `facilitated` flag on the full episode, played on a shared screen for a procurement-team session, with pause panels (what we'd need to know before signing; which claim nearly got you; which clause our standard terms would miss; how many supplier accounts nobody has looked at this year). The flag hides per-learner scores on the shared screen.
- **Text route:** each message and the consequence-flip choices as accessible text; a gap in the build (BE-03).
- **Spaced practice:** an optional "Claim or Evidence?"-style defend-only shell; the procurement checks repeated each year.
- **Replay:** which supplier carries which gap, the evidence and the incident (a fourth-party file-transfer breach; ransomware that stops the service; a faulty update) are drawn from banks; the three bidders stay the same so their lines can name them.

## Alternative concepts

1. **Supplier Dragons' Den (facilitated).** Pitch day as a facilitated discussion around the evidence ladder; an incident card is drawn and the room sees how each supplier's answers hold up. No bid-grid minigame needed.
2. **The Supply Web (consequence flip).** The suppliers' suppliers on a board; an incident hits a node two steps away and the flip traces which services and data are affected. Teaches fourth parties vividly.
3. **Claim or Evidence (defend-only drill).** A short defend-only shell of supplier statements, scored on telling evidence from claims.

## Art and audio

- **Rooms:** `room_aw_brightwell` (room review cycle 1 done; further cycles and POV backgrounds are later in the build).
- **Characters:** Brightwell's Mei Lin Chau and Gwen Pritchard and a Brightwell DPO use their awareness art; host art is held on PixelLab quota and the user's approval. The three bidders' representatives are video-call portraits for the consequence-flip episode.
- **Voice:** text-to-speech only (no runtime language model). No voiced line prints a variable: amounts, dates and the learner's name stay on screen; lines that depend on the chosen bidder pick between fixed strings, which the voice cache allows.

## Pitfalls

- **Don't make cheap mean bad.** The wrong choice is the one whose claims aren't evidenced, not the cheapest; the expensive bidder can still have weak terms. Judge the reasons and conditions, not a single right answer.
- **Proportionate, not paperwork.** Tiering is the skill; don't teach "send everyone the full questionnaire".
- **No real companies, marks or cases in the game.** Fictional equivalents on screen; the real cases live in `concepts.md`.
- **Keep the law light.** The DPO owns notification decisions; the learner's job is to get the notice there at once.
- **Don't oversell contracts.** A contract gives facts, speed and rights; it doesn't stop a breach. The debrief says so.
- **Be fair to the bidders.** No national or cultural stereotypes; each is competent and believable.
- **Label the time skips clearly** in the consequence flip, and carry the choices forward visibly so the consequences feel earned.
