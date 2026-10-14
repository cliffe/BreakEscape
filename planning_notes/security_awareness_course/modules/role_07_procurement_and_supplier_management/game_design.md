# role_07 game design: Due Diligence

## Concept

The player is a procurement officer at Larkspur, working with Harjit Gill, the Procurement Lead. Larkspur is replacing the whiteboards, spreadsheets and group texts that schedule its 250 field engineers and cleaning teams with a rostering system. It will hold names, mobile numbers, home postcodes (for route planning), shift patterns and absence types; it will connect to the HR system every night; and the field teams will depend on it every morning. That puts it at the top of every risk question at once. Lena wants it before the winter rotas.

The player runs the purchase and then lives with it: choose a supplier on evidence, write the contract, set up the supplier's access, and then, through two time skips, handle the supplier's breach notice six months later and the end of the contract two years later. The choices made in the first ten minutes decide what happens in the last five. That is the module's hook, and the stories a player takes to lunch: "The glossy one's ISO certificate only covered their sales office." "We read about our supplier's breach in a trade newsletter before they told us, because we'd accepted 'without undue delay'." "Two years on, an engineer who'd left the supplier still had an account."

## Setting and cast

- **Rooms:** the procurement desk in the open-plan office (`room_office`); the meeting room (`room_meeting`) with its screen for the three pitches; Owain's IT office (`room_IT`); the security office (`room_security`) on breach day.
- **The player:** a procurement officer, with their own name and avatar.
- **Harjit Gill** (Procurement Lead) is the co-mentor for procurement: thorough, kind and sceptical of glossy pitches. *"If it says military-grade, ask which military."*
- **Ama Owusu** (Information Security Manager) explains how suppliers create risk, and runs breach day.
- **Tomasz Wiśniewski** (DPO) explains the processor contract terms and owns the decision about notifying the regulator.
- **Owain Jenkins** (IT Service Desk Lead) sets up and removes supplier accounts: *"Ask us first. We'd rather help than clean up."*
- **Kai Murray** reads the supplier accounts' sign-ins on breach day.
- **Lena Fischer** (Operations Manager, the business owner) appears by chat, so she still needs no art: reasonable, under pressure, keen on the discount.
- **Three bidders' representatives** (new; video-call portraits and talk sheets only, no sprites):
  - **Teodora Ilie**, co-founder and technical lead at **Rotafell Ltd**. 30s, Romanian-British, short dark hair, denim shirt; deaf in one ear, so she keeps live captions on during calls; a cat occasionally walks across her keyboard. Plain-spoken: *"We don't have SOC 2. We're fourteen people. Here's our pen test letter instead."*
  - **Jasper Holt**, sales director at **ShiftHarbour**. 30s, white English, quarter-zip, ring light, very confident: *"Military-grade encryption, end to end. You're in safe hands."*
  - **Mariam Haddad**, Head of Customer Trust at **Tidewell Workforce**. 40s, British Lebanese, silver-rimmed glasses, a wall of binders behind her. Precise and friendly, and loyal to her company's standard terms: *"Seventy-two hours is our standard. I can't change it on a call. I can ask."*
- The company names are working names, to be checked for clashes before anything is published.

## Structure

The critical path is marked **(CP)**.

### 1. Hook: "Sign today" (1 to 2 minutes)

- **(CP)** Monday 10:10. Lena's chat on the desk computer (MG-27): *"ShiftHarbour can start on Monday if we sign today, and there's 20% off. Their security answers are all yes. Can you get it signed? Winter rotas won't wait!"* Attached: ShiftHarbour's order form on its standard terms (`notes`), and its completed questionnaire: "Yes" to all forty questions, under a strip of badges: "ISO 27001 certified", "SOC 2 compliant", "GDPR certified", "Military-grade encryption".
- The player can: raise the purchase order and sign; ask Lena what the system will hold and connect to; ask ShiftHarbour for the evidence behind its answers; ask Harjit; or leave it. The response is the **baseline** for R07-B1.
- **Signs it:** the order needs Harjit's countersignature, and he walks over: *"Hang on. What's this going to hold?"* Then: *"Easy to do. Their form's designed to make it feel finished."*
- **Asks questions or asks for evidence:** Harjit, passing: *"Good instinct. Glossy isn't evidence."*
- **Asks Harjit:** *"Right call. Let's do it properly. It needn't take long."*
- In every branch Lena replies: *"Fine, as long as we're live for winter."*

### 2. Learn: "What will they touch?" (3 minutes)

- **(CP)** Harjit and Ama at the procurement desk (EX-01), with visual aids stepped through (BE-08):
  1. **Four ways a supplier can hurt you,** as fictional stories (the real cases are named in the field guide): they hold your data (a payroll firm's file-transfer tool was broken into, and its customers' staff details were taken); they connect to you (an IT support firm's management tool was used to push ransomware to its customers); you depend on them (a lab's systems were down for months, and hospitals couldn't get test results); and sometimes nobody attacks at all (a faulty update from a trusted security product crashed millions of computers in a morning). Ama: *"Every one of those was somebody's trusted supplier."*
  2. **The four questions** (hold, reach, run, who else) and the tier grid. The rostering system lands in "high" on all four.
  3. **The evidence ladder:** a claim ("we're secure"), then a document ("here's our certificate"), then evidence that is independent, in scope and in date. Harjit: *"Who checked it, what did they check, and when?"*
  4. **The clause cards:** the eight from `concepts.md`.
  5. **Supplier access:** named, MFA, least privilege, time-limited, logged; and removed at the end.
- **Check question** (MG-20, opened with `#trigger_minigame:knowledge_check|r07_q_scope`): *"A bidder's ISO 27001 certificate covers 'sales and customer success, London office'. You're buying their cloud rostering service. What does the certificate tell you about the service?"* Not much: ask for evidence that covers the service / that it's secure / that their staff are trained.
- **Skip:** *"I've run tenders for years."* Harjit: *"Then you'll spot the scope trick in seconds,"* and goes straight to the check question.
- **Optional topics:** Tomasz on *"What does the law make us put in the contract?"* (UK GDPR Article 28 in plain words); *"Cyber Essentials or Plus?"*; *"What's a SOC 2 report?"*; *"Why do our NHS customers ask us for Cyber Essentials?"* (PPN 014).

### 3. Practise: "Claim or Evidence?" (3 minutes)

- **(CP)** MG-22 practice mode (from Harjit's conversation by BE-19; available as an optional BE-07 drill). Eight supplier statements, some with evidence attached. For each the player chooses **Evidenced**, **Claimed only**, **A gap** or **A red flag**, with immediate feedback.
  1. "Your data is protected by military-grade encryption." *Claimed only: ask what encryption, where, and who holds the keys.*
  2. A Cyber Essentials Plus certificate: the right company, issued last month, listed on IASME's certificate search. *Evidenced, for its five controls.*
  3. An ISO 27001 certificate whose scope is "sales and customer success, London office". *A red flag for this purchase: it doesn't cover the service.*
  4. "SOC 2 compliant: report available after signature." *Claimed only: ask for the report before signing.*
  5. A SOC 2 Type 2 report for the service, covering the last twelve months, with one exception (leavers' access removed late) and the fix. *Evidenced, with a follow-up question about the fix.*
  6. "We use a major cloud provider, so we're secure." *Claimed only: the provider secures its platform, not what the supplier builds on it.*
  7. "We'll notify you of breaches without undue delay." *A gap: ask for a number of hours.*
  8. "Subprocessors: our trusted partners." *A gap: ask for the named list and approval of changes.*
- Two wrong answers in a row bring Harjit's nudge: *"Who checked it, what did they check, and when?"*

### 4. Apply: "From tender to exit" (8 to 9 minutes)

**A. The bids** (MG-22, about 3 minutes). **(CP)** Three bidders, six questions each. The player opens each piece of evidence (tabs in `forensic-data-platform`; a certificate's scope checked in MG-25) and gives each answer a verdict.

| Question | Rotafell Ltd | ShiftHarbour | Tidewell Workforce |
|---|---|---|---|
| Who they are | Fourteen people, founded by two former NHS rota managers; mid price | The cheapest by 20%; glossy; can start Monday | Large and established; the most expensive |
| Certification | Cyber Essentials Plus, current, the right company (evidenced) | "ISO 27001 certified", but the scope is its London sales office (red flag); its Cyber Essentials certificate expired fourteen months ago on IASME's search (red flag) | ISO 27001 covering the product, and Cyber Essentials Plus (evidenced) |
| Independent assurance | A penetration test summary from three months ago, high findings fixed (evidenced); no SOC 2, which is reasonable for its size given the test | "SOC 2 compliant", report after signature (claimed only) | A SOC 2 Type 2 report for twelve months, one exception with its fix (evidenced) |
| Where data is held, and subcontractors | UK hosting with one named provider (evidenced) | "Trusted partners" (a gap) | UK storage, but support from an unnamed overseas affiliate with remote access (a gap) |
| Supplier access | Named accounts with MFA (evidenced) | One shared admin login for "our support team" (red flag) | Named accounts with MFA (evidenced) |
| Breach notice | Within 24 hours, in its standard terms (evidenced) | "Without undue delay" (a gap) | Within 72 hours (a gap) |
| At exit | "Data returned on request", with no deletion or certificate (a gap) | Not answered (a gap) | "Backups retained for seven years" (a gap) |

**B. The recommendation** (about 30 seconds). **(CP)** In conversation with Harjit, with Lena on chat (*"ShiftHarbour's cheaper, though?"*), the player recommends one bidder and picks a reason: *"Rotafell: good evidence for the price, with conditions on exit"* / *"Tidewell: the strongest assurance, with conditions on notice, the affiliate and backups"* / *"ShiftHarbour: cheapest, and they said yes to everything."* A model answer for Lena: *"Cheaper isn't the problem. Unproven is: their certificate doesn't cover the service."*

**C. The clauses** (MG-22's clause step and a short video call, about 2 minutes). **(CP)** The player picks the clauses to ask for from the eight cards, then the chosen bidder's representative answers on a call (`person-chat` video-call mode) and counters on three or four. The player holds or trades each.

- **Teodora (Rotafell)** accepts most: *"Fair. We'd want the same from our hosting provider."* She asks to swap an on-site audit for the yearly penetration test summary (a good trade), and asks for backups to roll off on their normal 90-day cycle rather than within 30 days (also fine, with a deletion certificate).
- **Mariam (Tidewell)** holds 72 hours (*"I can ask legal"*), is reluctant to name the affiliate, and holds the seven-year backups. Holding firm, with Harjit's backing, wins 48 hours and a named affiliate with approval of changes; the backups need Tomasz.
- **Jasper (ShiftHarbour)**, if chosen: *"Nobody signs twenty-four hours. Military-grade, remember?"* He offers "a world-class partner network" instead of a list, and the shared login stays "for your convenience".
- Assessed: whether the player held the five that matter most (notice within hours, named subcontractors with approval, return and deletion with a certificate, supplier access rules, yearly independent assurance). On-site audits, the exact backup cycle and the insurance wording are fair trades.

**D. Supplier access** (about 1 minute). **(CP)** The supplier's integration engineer emails: *"Please create one admin account for our support team. MFA breaks our tools. Make it permanent so we can help any time."* With Owain in the IT office, the player chooses: named accounts for the two named engineers, MFA, access to the HR integration only, switched on for agreed windows, logged / one shared account, but with MFA / as asked.

**E. "Six months later"** (BE-16, about 1.5 minutes). **(CP)** The chosen supplier's own file-transfer provider (a fourth party) is broken into.

- **If the contract has a notice within hours:** Tuesday at 09:20 the supplier emails: *"On Monday evening our file-transfer provider told us of unauthorised access to its service. Files we exchange with some customers, including staff names, mobile numbers and shift patterns, may have been copied. We'll update you every 24 hours."*
- **If it says "without undue delay":** on Thursday Harjit drops a trade newsletter on the desk: "Rostering supplier caught up in file-transfer breach." The supplier's own notice arrives nine days after the event.
- The player chooses: **forward it to Ama and Tomasz now** and send the supplier the five questions (what happened and when; whose data and which of our systems; what they've done; what we need to do; when the next update comes) / reply to the supplier for the full report first, then tell security / wait for the supplier's full report before telling anyone.
- Tomasz: *"Our own clock may already be running. Thank you for bringing it straight to me."* He decides whether to notify the ICO and when; the player's job is to get it to him at once.
- Kai checks the supplier's accounts in Larkspur's systems (`log-filter`, `vpn` log type). Named accounts with MFA: a sign-in attempt on one engineer's account at 03:12 from an unfamiliar country, *MFA denied*. A shared account without MFA: a successful sign-in at 03:12 and an export from the HR integration, so Larkspur now has a breach of its own.
- If the contract has assurance and incident audit rights, Ama: *"The schedule says updates every 24 hours, and an audit after a serious incident. Let's use both."*

**F. "Two years later"** (BE-16, about 1 minute). **(CP)** Larkspur is moving to a new system. Owain's access review (MG-18) lists what the supplier still has: two named engineer accounts (one engineer left the supplier a year ago and is still enabled), the API key for the HR integration, a VPN profile, and a shared mailbox delegation from go-live. The player removes them all, rotates the API secret, asks for the deletion certificate and updates the supplier register. The certificate arrives in 30 days if the clause was held; with "backups retained for seven years", Tomasz has a negotiation ahead. Harjit: *"The contract ends on paper. Access ends when someone removes it."*

### 5. Debrief: "Your contract against what happened" (2 minutes)

- **(CP)** The debrief screen (BE-02) shows the contract as a board: each clause the player held or traded, and what it gave or cost on breach day and at exit. Then Harjit, Ama and Tomasz speak.
- The bid review: gaps found and missed, with the two that matter most (ShiftHarbour's certificate scope and Tidewell's unnamed affiliate).
- **Before and after:** the hook's "sign today" beside the player's recommendation.
- The access choice beside Kai's sign-in log; the exit list.
- Per-outcome results, and **the line to remember:** *"Evidence, not claims. Put it in the contract. Close every account at the end."*

### 6. Check (2 minutes)

- **(CP)** Kai's "spot check" on The Lark (MG-20): six items from the bank in `assessment.md`, one per learning outcome.

### 7. Reference

- **(CP)** The supplier security checklist on The Lark (BE-09): the procedure from `concepts.md`, with the organisation's own tiers, required evidence, standard clauses and sign-off route (BE-05).

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| "Sign today" (hook) | Ask what it will hold and reach / ask for evidence / ask Harjit / sign / leave it | R07-LO2, R07-LO3 (baseline) | Harjit's line; a signed order is caught at countersignature |
| The bid verdicts | Evidenced / claimed only / a gap / a red flag, per answer | R07-LO3 | MG-22's summary per bidder; the debrief lists gaps found and missed |
| The recommendation | Rotafell or Tidewell with conditions / either without conditions / ShiftHarbour | R07-LO2, R07-LO3 | The bidder you live with for the rest of the module |
| The clauses | Hold or trade each of the eight against the counter-offer | R07-LO4 | Breach day (notice within hours or a trade newsletter first) and exit (a certificate or a negotiation) |
| Supplier access | Named, MFA, least privilege, time-limited, logged / shared with MFA / as asked | R07-LO1, R07-LO5 | Kai's log on breach day: MFA denied, or Larkspur's own breach |
| The breach notice | Escalate now and ask the five questions / ask the supplier first / wait for the full report | R07-LO1, R07-LO6 | Tomasz's clock; Ama using the contract |
| Contract end | Remove everything and get the certificate / remove some / close the contract only | R07-LO5 | The leaver's live account; the certificate or the negotiation |

No option shames the player. Signing in the hook is caught by Larkspur's own countersignature control, and Harjit treats it as the form doing its job on a busy person. The worst outcomes are shown as what a real contract would have given, and Tomasz and Ama handle breach day calmly whatever the player chose.

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-22 Supplier assessment** | new (P3, S) | The bid grid, the four verdicts, the evidence documents, the recommendation and the clause step. Configuration from its catalogue entry (`questions[]`, `bidders[]` with `answers{}` holding text, evidence and verdict, `documents{}`, `clauses[]`, `assess`), plus `counterOffers{}` per bidder and clause for the video call. Practice mode for "Claim or Evidence?". Built from `warranty-checklist` once its sis03 labels and globals come from data |
| **MG-25 Document inspector** | new (P2) | A certificate (organisation, scope, issuer, valid until) against what is being bought (the service and its sites); marks the scope that doesn't fit |
| **MG-18 Access review** | new (P3, S) | Contract end: the supplier's accounts, the API key, the VPN profile and the mailbox delegation, each kept or removed with a reason |
| **MG-27 Work desktop** | new (MVP) | The procurement desk computer: Lena's chat, the order form, the questionnaire, the register |
| **MG-20 Knowledge check** | new | Harjit's check question and the final check |
| `log-filter` | existing | Breach day, `logType: "vpn"`: the supplier accounts' sign-ins with the 03:12 entry as the anomaly (MFA denied, or a successful sign-in without MFA, depending on the access choice), `accountHistory` for the engineers' accounts, and `flagActionLabel` "Flag it to Kai" |
| `forensic-data-platform` | existing | Each bidder's evidence pack as tabs; the breach pack ("The notice", "Our contract", "Their access") with `confirmGateTab` on the contract tab and `confirmLabel` "Send to security and the DPO" |
| `person-chat` | existing | Harjit, Ama, Tomasz, Owain and Kai in person; video-call mode for the three bidders (the "SECURE VIDEO LINK" label needs to come from data) |
| `notes` / `text-file` | existing | The order form, the questionnaire summary, the trade newsletter, the supplier register |
| `phone-chat` | existing | Lena's chat |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| Four ways a supplier can hurt you | Ama (EX-01) | 60 seconds | Four illustrated cards (holds data, connects in, we depend on it, no attacker at all) | none |
| What will they touch? | Harjit (EX-01) | 45 seconds | The four questions and the tier grid | none |
| The evidence ladder | Harjit | 45 seconds | Claim, document, independent evidence; a certificate with its scope highlighted | "What does this certificate tell you?" |
| The clauses that matter | Harjit and Tomasz | 45 seconds | Eight clause cards; Article 28 in plain words | Apply part C |
| Supplier access | Ama | 30 seconds | Named, MFA, least privilege, time-limited, logged; removed at the end | Apply parts D and F |
| Optional video: "Your supplier's supplier" | Recorded in engine (EX-02) | 60 seconds | Plays on the meeting room screen (MG-21) | Linked from the reference card |

## Debrief

Shown on BE-02, then spoken by Harjit, Ama and Tomasz:

1. The contract board: each clause held or traded, and what it gave or cost on breach day and at exit.
2. The bid review: gaps found and missed.
3. The before and after: "sign today" against the recommendation.
4. Supplier access against Kai's log, and the exit list.
5. Per-outcome results, and the line to remember: *"Evidence, not claims. Put it in the contract. Close every account at the end."*

## Variants

- **Micro-drill:** none in the catalogue. "Claim or Evidence?" can run as an optional BE-07 drill (eight statements from the bank, about 4 minutes) for procurement teams that want one.
- **Text route:** the bid grid as an accessible table with a verdict radio group per answer; evidence documents as text; the counter-offers as dialogue; the sign-in log as a table; the exit review as a checklist (BE-03).
- **Facilitated session:** a procurement or contract owners' session on a shared screen. Pause points: after the hook (*"What would we need to know before signing anything like this?"*), after the bids (*"Which claim nearly got you, and what told you?"*), after the clauses (*"Which of these would our standard terms have missed?"*), after breach day (*"Who here would get that supplier's email first, and what would they do with it?"*), after exit (*"How many supplier accounts do we have that nobody has looked at this year?"*). About 50 minutes.
- **Replay and randomisation:** BE-13 draws which bidder carries which gap, the evidence documents, the incident (a fourth-party file-transfer breach; ransomware at the supplier that stops the service but takes no data; a faulty update that takes the service down with no attacker) and the exit findings. The three bidders and their representatives stay the same, so their voiced lines can name them.

## Alternative concepts

1. **Supplier Dragons' Den.** Pitch day as a panel show: Harjit, Ama, Tomasz and the player question three suppliers live, and each answer moves a "claim or evidence" meter on the meeting room screen. Then an incident card is drawn and the panel sees how each supplier's answers hold up. Lively and good for facilitated sessions; less about the contract's whole life.
2. **The Supply Web.** Larkspur's suppliers, and their suppliers, on a corkboard (MG-13's board). An incident hits a node two steps away and the player traces which services and data are affected, then decides which contracts most need strengthening. Teaches fourth parties and dependency (the MOVEit and CrowdStrike lessons) vividly, but practises negotiating and offboarding less.
3. **Contract Poker.** A facilitated card game for a procurement team day (HA-13): clauses are cards, teams negotiate against a supplier deck run by the facilitator, and incident cards then test each team's contract. Social and memorable, but needs a facilitator.

## Art and audio

- **Rooms:** existing office, meeting room, IT office and security office.
- **Characters:** Harjit, Ama, Tomasz, Owain and Kai need their own art (shared across modules). Lena stays on chat. The three bidders' representatives are new, as video-call portraits with talk sheets only; Teodora's call shows live captions.
- **Props and screens:** a questionnaire screen; generic certificates and report extracts with no real certification marks (scheme names as text only); a contract schedule; the supplier register; a trade newsletter front page.
- **Voice:** about 30 lines for Harjit, 10 for Ama, 6 for Tomasz, 6 for Owain, 4 for Kai, and 6 for each bidder. No voiced line prints a variable: amounts, dates and the player's name stay on screen. Lines that depend on the player's choice of bidder choose between fixed strings, which the voice cache allows.

## Pitfalls

- **Don't make cheap mean bad.** ShiftHarbour is the wrong choice because its claims aren't evidenced, not because it is cheapest; Tidewell is expensive and still has weak terms; Rotafell is small and proportionate. Assess the reasons and conditions, not a single right answer.
- **Proportionate, not paperwork.** Don't teach "send everyone the full questionnaire". Tiering is the skill.
- **No real companies, marks or cases in the game.** Fictional equivalents on screen; the real cases live in the field guide.
- **Keep the law light.** Tomasz owns notification decisions; the player's job is to get the notice to him at once.
- **Don't oversell contracts.** A contract gives facts, speed and rights; it doesn't stop a breach. The debrief says so.
- **Be fair to the bidders.** No national or cultural stereotypes in the representatives; each is competent and believable, including Jasper.
- **Label the time skips clearly** ("Six months later", "Two years later"), and carry the contract's choices forward visibly so the consequences feel earned, not random.
