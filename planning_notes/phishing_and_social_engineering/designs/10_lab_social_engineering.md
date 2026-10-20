# 10 — Lab: Social Engineering (`lab_social_engineering`)

Status: plan, 2026-10-20. The scenario that proves the suite: it chains 01–07 into one engagement.
Written before 05, 06 and 07 existed in draft; where this doc leans on them it states what it
assumes (see "Dependencies" in section 6) and the assumption should be checked when those land.
Priority update (2026-10-20): this lab is the first shippable SE product and takes the module's one technical-lab slot. It is browser-only for students, with **no VM companion** (the SE VM plan is parked). Its systems later become Eldritch Hacker's core.
R1 fixes applied (2026-10-20): Lord conformed to 00 §1 (Sofia Lord, intern, payroll portal), urgency moved to advisory, Hampshire/metadata strings aligned, `osint_done` aggregation and critical-path order specified, `senderAuth` advisory surfaced, N6 resolved.

## 1. Purpose & audience

**Audience: Cyber Security students.** No VM (user decision, 2026-10-20). The game models the
mechanics, so every judgement is deterministic and every result is explained on screen. This is the
lab that replaces the teaching value of the SecGen `3_phishing.xml` lab without its failure modes
(lost replies, vague rejections, dead-end victims; see `README.md`).

It follows the structure of Joe Gray, *Practical Social Engineering* (Parts I–III), and the
learn-by-doing stance of Chothia et al. (ASE '18): the student does the attacker's work first, then
sits in the defender's chair and reads the same attack from the other side.

| Stage | Book chapter | What the student learns | Component |
|-------|--------------|-------------------------|-----------|
| 0 Authorisation | Ch. 2 | Why scope, consent and a rules-of-engagement sheet come first | board `scopeNote` (03) |
| 1 Scope & plan | Ch. 3 | Objectives, in/out of scope, success measures | intel board (03) |
| 2 OSINT | Ch. 4–6 | Business, social-media, document and people OSINT; deriving the email pattern; reading file metadata | OSINT browser (02) → board (03) |
| 3 Spear-phish ×3 | Ch. 7 | Sender trust, addressing, pretext relevance, attachment fit, link credibility, sender authentication (advisory); escalating target difficulty | mail client (01) + rules (04) |
| 4 Landing page | Ch. 8 | How a credential-harvest page convinces, and the tells a defender checks | landing-page builder (07) |
| 5 Pretext call | Ch. 1, App. D | Pretexting, elicitation, how suspicion builds | pretext dialogue (06) |
| 6 Metrics & report | Ch. 9 | What to measure, how to report findings without blaming staff | reporting beat (new, section 6) |
| 7 Defender flip | Ch. 10–12 | Triage, headers, SPF/DKIM/DMARC, a threat-intel profile | triage (05) + board defender mode (03) |

**Learning outcomes** (these are what section 4's assessment checks):

1. Define an engagement scope and state why an unauthorised version of the same actions is an offence.
2. Derive a company's email-address convention from public evidence and use it to predict an address.
3. Identify what a published document's metadata discloses (author, software, username, path).
4. Explain, for each of three phishing messages, which factors made it land or fail.
5. Distinguish a look-alike domain from the real one and explain what a clone page cannot copy.
6. Describe how a pretext call builds on OSINT and where a call-back policy defeats it.
7. Report an engagement's results with metrics, root causes and fixes, not names to blame.
8. Read `Authentication-Results`, `Received` and the SPF/DKIM/DMARC outcomes on a message and
   decide whether it is trustworthy.
9. Turn scattered findings into a threat-intelligence profile of *the organisation they just attacked*.

**Model, don't weaponise.** Tools are named at concept level only: theHarvester (collects emails,
names and subdomains from public sources), Hunter (shows a domain's email pattern), Recon-ng (a
framework that automates such modules), Maltego (graphs relationships between people, domains and
organisations). The student never runs them; the OSINT browser shows what their output *looks like*
and the lab asks what it means. The landing-page and mail components judge reasoning, and produce no
runnable phishing kit, spoofing recipe or harvesting code.

## 2. Player goal in their own words

"I've been hired to test AccountingNow's staff. Find out about them, get three people to take the
bait, get one set of credentials and one physical-access detail by phone, write it up, and then
switch to the other side and show the company how they should have caught me."

## 3. The loop (stage by stage)

### Setting and cast (fictional throughout)

The student plays a junior consultant at **Northgate Assurance**, a security consultancy, on a
contracted engagement for **AccountingNow Ltd**, a 40-person accountancy software firm. Both are
invented; every person, domain (`accountingnow.example`) and profile is fictional (Q3 default).

| Who | Role in the lab |
|-----|-----------------|
| **Ruth Adeyemi** | Northgate engagement lead. The handler: briefs, hands over passes, debriefs. Hint hub (progress-gated, as in m01/m02). |
| **Gareth Whitlock** | AccountingNow managing director; the signing client. Appears in the authorisation scene and the debrief. |
| **Chris Hampshire** (Careers/HR) | Target 1, easy. Runs the open `careers@` inbox, which accepts CVs from anyone. |
| **Melanie Pierce** (finance, new starter) | Target 2, medium. Trusts colleague Jed Baker; primed for a Friday balance sheet (the worked example in 04). |
| **Sofia Lord** (intern) | Target 3, hard. New to the firm and uses the staff payroll portal (`lord_portal`); she is cautious about links, so the phish only lands with a convincing portal look-alike. |
| **Dev (service desk)** | The pretext-call target (06), who supports the staff portals. Not an email target. |
| **Tomasz** (AccountingNow security lead) | Appears only in the defender half. Receives the report; sets the triage exercise. |

Cast and ids follow `00_data_contract.md` §1 (`pierce`, `baker`, `hampshire`, `lord`); where this doc and 00 differ, 00 wins.

### Rooms and movement (high level)

A hub with three spokes. The spine is linear in order, but the hub keeps the player oriented and
lets them walk back to re-read the board at any time.

```
                 [ Blue Team Room ]   (stage 7; locked until the report is filed)
                         |
 [ Recon Room ] ---- [ Engagement Office ] ---- [ Operations Room ]
   (stage 2)            (start / hub)               (stages 3-5)
```

| Room | Contents | Component |
|------|----------|-----------|
| **Engagement Office** (start, hub) | Ruth; the **Rules of Engagement** document on the desk (authorisation, scope, hours, "stop" contact); the **case-file board**; the report workstation | 03 board; reporting beat |
| **Recon Room** | OSINT workstation; four **concept-card** notes on the wall (theHarvester, Hunter, Recon-ng, Maltego) | 02; `notes` objects |
| **Operations Room** | **Mail workstation**; **page-builder workstation**; a **desk phone** | 01 (+04); 07; 06 |
| **Blue Team Room** | **Triage workstation**; the same case-file board in defender mode | 05; 03 |

Doors are plain key locks. Ruth hands over each key (`#give_item`, the existing pattern) when the
previous aim completes, so the sequence is enforced by the objectives and the player sees a
physical reason to go back to her. The Blue Team door stays locked until the report is filed
(the narrative flip: you leave the red cell and walk into the client's SOC seat).

### Stage 0 — Authorisation (Engagement Office; Ch. 2)

Ruth briefs. The student **reads the Rules of Engagement** (a `notes` object, mandatory read) and
makes two small decisions with deterministic feedback:

- *Is each action in scope?* Five cards: phish named staff by work email (in); phish staff at their
  personal addresses (out); call the published service-desk line (in); tailgate into the building
  (out for this contract, physical is excluded); post to AccountingNow's real customers (out). A
  wrong answer is explained from the document ("§4 excludes personal accounts"), then re-asked.
- *What do you do if you find a real compromise or a real person in distress?* One right answer
  (stop and call the emergency contact on the sheet), with the reasons for the wrong ones.

Then Whitlock's authorisation is "signed" on the board and the lab's rule is stated once, plainly:
"The same actions without this sheet are offences (Computer Misuse Act 1990 in the UK; Computer
Fraud and Abuse Act in the US)." Sets `roe_signed`. **This beat is the ethics gate (book Ch. 2); it
is the first aim and cannot be skipped.**

### Stage 1 — Scope & plan (board; Ch. 3)

At the case-file board the student turns the brief into a plan. Board framing is 03's `scopeNote`
plus Gray's scoping worksheet as three fill-ins:

1. **Objectives** — pick from a list (steal credentials from finance and IT; test the service desk;
   measure reporting rates). Wrong picks (e.g. "disrupt payroll") are rejected with the rules-of-
   engagement reason.
2. **Success measures** — pick which numbers the report will need (messages sent, opened, clicked,
   submitted, reported). Teaches that you decide the metrics *before* you send anything.
3. **Target selection** — the three target cards appear with empty readiness slots ("Expects: ???").
   The student sees now exactly what they must find. This is the plan.

Sets `plan_done`; Ruth gives the Recon Room key.

### Stage 2 — OSINT (Recon Room; Ch. 4–6)

At the OSINT workstation (02) the student works four layers; every fact found drops onto the board
with a "noted" flourish and fills the matching readiness slot.

- **Company site.** Team page, careers page, press. The deliberate **"derive the email pattern"
  task**: the site lists a few staff *with* addresses and a few without. The player sees two
  examples, states the pattern (`first-initial.surname@`), and the board checks it by asking them to
  predict the address of a third person (02 OQ1 default). This is where the concept card for
  **Hunter** is read: the tool shows a domain's pattern and a confidence; the lesson is the
  pattern, not the tool.
- **Careers page.** Names the tech stack (Xero, Office 365; `tech_stack`). Feeds pretext flavour
  and, later, the defender profile.
- **Social media.** Pierce's "first week in finance, Jed's showing me the ropes" post; a photo with a
  visible lanyard; Hampshire's "so many CVs to get through before Friday"; Sofia Lord's "sorting my payslip on the staff portal" (`lord_portal`) and her new-intern profile (`lord_intern`). Teaches how ordinary
  posts become pretext material.
- **Public document.** A published PDF whose **metadata panel** (02 N3) shows author `mpierce`,
  software "Microsoft Excel", and a path under `C:\Users\mpierce\`. The student answers two prompts: what
  username convention does this show, and why does the path matter? (Usernames are guessable from
  names, so a login page asks for something the attacker already has; the path names the machine's
  profile layout.) This is the same idea as reading EXIF/Office properties with a tool like
  `exiftool`, named only at concept level.
- **Search.** A seeded search box models theHarvester/Recon-ng output (names, subdomains, an email
  or two). One result is **ambiguous** on purpose (two "J. Baker" entries; 02 OQ2) so the student
  must use the company site to decide which is Jed, teaching that OSINT is messy and needs
  corroboration. The Maltego card is read here: "this is how you'd draw the links."

Ruth's check-in is a *board* check, not a quiz: when all three targets show "ready", Ruth says so
and hands over the Operations key. Missing a fact never blocks; the board's "still missing" panel
and Ruth's hints point at the source layer.

### Stage 3 — Spear-phish, rounds 1 and 2 (Operations Room; Ch. 7)

At the mail workstation (01) the student composes to **Hampshire**, then **Pierce**. The rules
engine (04) judges each send and returns the full factor checklist, not the first failure.

| Round | Target | Required factors (04) | What escalates |
|-------|--------|-----------------------|----------------|
| 1 | Hampshire | `addressedTo`, `pretextRelevant`, `attachmentPlausible` | Sender can be anyone; a plausible job applicant works. Red-flag meter **on**. |
| 2 | Pierce | `senderTrust`, `addressedTo`, `pretextRelevant`, `attachmentPlausible` | Needs the Jed Baker spoof and the Friday balance-sheet story, both from OSINT. Meter **off**. |

Each success lands as the target's in-character reply plus the checklist, and sets the landed
global. Each failure shows exactly which factor failed and the hint ladder starts after two misses.
Hampshire's first lesson is that **the From field is free text** (and the `senderAuth` advisory line appears from here, see stage 5); Pierce's is that **trust is
borrowed from a known contact**.

### Stage 4 — Landing page (Operations Room; Ch. 8)

At the page-builder workstation (07) the student assembles a credential-harvest *page model* for
Sofia Lord's phish: clone the look-alike of **her staff payroll portal** (`lord_portal`): pick the look-alike domain, the branding, the form fields, the post-submit redirect to the real portal. The
builder judges the choices against rules (domain edit distance and homoglyph tells, branding
match, whether a lock-icon/TLS certificate is present and what it does and does not prove, the
redirect to the real site). **It builds a scored model of a page, never a working page or form
handler** (07 owns that boundary). Feedback names each tell a defender could use, which is stored
for stage 7. Sets `landing_page_built` and records the chosen look-alike domain for reuse in 05.

### Stage 5 — Pretext call, then the hard phish (Operations Room; Ch. 1, App. D)

Sofia is cautious, and the page alone is not enough: a "your payslip is ready" notice only reads
as plausible if it matches how the real portal behaves. The student does not yet know **what the
portal is called, when payslips are released, or how its sign-in notices are worded**. They get
these by calling **Dev on the service desk** from the desk phone (06, built on
`person-chat`/`phone-chat`). The call is a pretext and elicitation exercise, not a way to get her
password.

- The student picks a pretext from the OSINT: "I'm the new intern's buddy, she can't find her first
  payslip on the portal" fits the `lord_intern` and `lord_portal` facts.
- Dev has a visible **suspicion meter**. Elicitation (open questions, a plausible reason, a named
  colleague) lowers it; asking for something he is not allowed to give, or contradicting an earlier
  answer, raises it. The meter, the rule that moved it and the reason are shown after every turn.
- Success unlocks two intel facts that go to the board: the **portal's name and notice wording** and
  the **payslip release date** (this month's date). Sets `pretext_call_done` and the global
  `lord_payslip_date_known`. 04's `lord` target uses `boostIfGlobal: {lord_payslip_date_known:
  "pretextRelevant"}` (00 §7), so the call makes Sofia's phish land more readily, and the date also
  raises the page's brand-fidelity score in 07.
- If suspicion maxes out, Dev ends the call "to check with his manager". No dead end: Ruth notes the
  call was "burned for ten minutes", the phone un-greys after a short in-game beat, and a second
  attempt starts with a stronger hint (06 owns the exact rule). A call-back policy would have
  stopped this; the stage-6 finding and stage-7 mitigation pick that up.

Back at the mail workstation the student composes **round 3 to Sofia Lord** (04's `lord` target).
Required factors: `senderTrust`, `addressedTo`, `pretextRelevant`, `linkCredible`. The link kind in
the payload kit now offers the page built in stage 4 (01 N4); without it `linkCredible` cannot pass
and the checklist says so, which is the hard gate. Advisory only: `urgencyCalibrated` ("this reads
as high-pressure, a defender would clock it") and `senderAuth`. Urgency never fails a send, because
real phishing with heavy pressure still lands; it is taught as a tell in the stage-7 triage, where
the student is the reader.

**Surfacing `senderAuth` on the attacker side.** From round 1, the checklist carries a line under
the factors: for example, "Advisory: the spoofed `j.baker@` address would fail the domain's sender
authentication and may be quarantined before Melanie sees it." It never changes the verdict. It
plants the question stage 7 answers (why was this flagged, and what does DMARC at `p=none` change).

### Stage 6 — Metrics & report (Engagement Office; Ch. 9)

The report workstation shows the **campaign results**, filled from what actually happened (this is
why stage 1 asked for the measures):

- Messages sent, per target; outcome per target (opened / clicked / submitted / replied); attempts
  per target; number of failed sends (framed honestly: "in a live test each failed send is a
  chance for a member of staff to report you"); whether the call succeeded and how many suspicion
  triggers fired.
- **Findings builder.** For each of three findings the student pairs a *root cause* with a *control*
  from authored lists (e.g. finding "Finance clicked a spoofed colleague" -> cause "no external-
  sender banner; DMARC at `p=none`" -> control "banner plus DMARC enforcement"; finding "Service
  desk gave out the portal name and payslip date" -> cause "no verification script" -> control "call-back to a
  number on file"). Wrong pairs are explained; right pairs lock in.
- **Tone check.** One finding offers a "name and shame" wording as an option. Choosing it is not
  punished with a fail but shown why: the report is about processes and controls, and blaming staff
  suppresses future reporting (Ch. 9 and Ch. 10).

Whitlock reads it. Sets `report_filed`; Ruth gives the Blue Team key.

### Stage 7 — Defender flip (Blue Team Room; Ch. 10–12)

Tomasz takes the report and sets a debrief exercise. Same board, relabelled (03 defender mode);
same strings (04 `redFlagStrings` are the tells in 05).

1. **Triage.** An inbox of eight messages at the triage workstation (05): the student's own three
   phishes (seen as the recipients saw them), one real-looking vendor invoice, a genuine
   Jed-to-Pierce balance sheet, a newsletter, and two further attacker messages. Per message:
   *report / delete / ignore / escalate*. Wrong calls are explained with the tell the student
   themselves exploited.
2. **Headers and authentication.** The student opens the raw headers of three messages and answers
   what each header shows. The three are chosen to teach the traps:
   - **Spoofed Jed.** `SPF: fail`, `DKIM: none`, `DMARC: fail`; the `From` display name matches Jed
     but the `Return-Path` and the first external `Received` hop do not.
   - **Look-alike domain** (the student's own stage-4 domain). `SPF: pass`, `DKIM: pass`,
     `DMARC: pass`, **for the look-alike domain**. Authentication passed and the message is still
     malicious: the three checks prove the sending domain is *consistent*, not *trustworthy*. This
     is the lesson students most often get wrong.
   - **Genuine mail via a forwarder.** `SPF: fail` (the forwarding host is not in the sender's SPF
     record), `DKIM: pass`, `DMARC: pass` because DKIM aligns. Teaches why DMARC needs only one
     aligned pass and why SPF alone breaks on forwarding.
   Concept panel (short, correct): **SPF** is a DNS TXT record listing the hosts allowed to send
   for a domain, checked against the envelope sender (`Return-Path`/MAIL FROM). **DKIM** signs
   chosen headers and the body with a private key; receivers fetch the public key from DNS at
   `selector._domainkey.domain`. **DMARC** requires SPF or DKIM to pass *and align* with the
   visible `From` domain, and publishes a policy: `none` (monitor), `quarantine`, or `reject`, with
   reporting addresses.
3. **Fix the policy.** AccountingNow's DMARC is at `p=none`. The student chooses the rollout
   (monitor, then quarantine, then reject, reading aggregate reports between steps) and sees, in a
   simulated before/after, which of their stage-3 and 5 phishes would have been stopped and which
   would not. The look-alike still gets through, which motivates the non-technical controls.
4. **Threat-intel profile (Ch. 12).** The board switches to defender mode: the same facts the
   student collected, now titled "what an attacker can assemble about us". For each fact the
   student chooses a mitigation (remove the staff email list, strip PDF metadata on publish, a
   social-media policy, a call-back procedure) and tags indicators from their own attack: the
   look-alike domain, the lure subject lines, the sender patterns. The output is a one-page profile:
   assets exposed, likely adversary technique, indicators of compromise, recommended controls.

Finishing the profile sets `profile_done` and completes the mission.

## 4. Rules, gating & assessment

### Critical path

```
roe_signed -> plan_done -> osint_done -> phish_hampshire_landed -> phish_pierce_landed
           -> [ landing_page_built  AND  pretext_call_done ]   (parallel, either order)
           -> phish_lord_landed -> report_filed -> triage_done -> headers_done -> policy_done -> profile_done (mission_complete)
```

Everything on it is a deterministic judgement with an explanation. There is no timer, no lose state
and no KO. Every failed attempt can be retried; the hint ladder always ends in a near-explicit
pointer. Stage order matters only where one stage makes another's input (the page and call feed
the Sofia Lord phish; the report feeds the Blue Team door).

Side content (optional aims, not on the path): read all four tool concept cards; find the
metadata username on a second document; spot a second ambiguous search result; "perfect first
send" on any target (landed with no failed factor).

### Objectives (aims and tasks)

Standard aim/task structure (`README_scenario_design.md` Objectives System), each aim unlocked by
the previous (`unlockCondition.aimCompleted`). The tasks that wait on minigame outcomes are
`manual` tasks completed by an `eventMapping` `completeTask` on Ruth, keyed to a global, the pattern
the README already uses for flag bridging.

| Aim | Tasks (type) | Completes on |
|-----|--------------|--------------|
| `authorise` | read RoE (`manual`), scope cards correct (`manual`) | `roe_signed` |
| `plan` | objectives, measures, targets chosen (`manual` x3) | `plan_done` |
| `recon` | email pattern derived; metadata read; three `manual` tasks `ready_hampshire`, `ready_pierce`, `ready_lord`, each completed by Ruth's mapping on `global_variable_changed:target_ready_<id>` | the aim's last task `onComplete.setGlobal` sets `osint_done` (nothing else sets it) |
| `phish_easy` | Hampshire landed; Pierce landed | `phish_pierce_landed` |
| `prepare_hard` | landing page built; pretext call done | both `landing_page_built` and `pretext_call_done`, in either order |
| `phish_hard` | Sofia Lord landed | `phish_lord_landed` |
| `report` | results reviewed; three findings paired; tone check seen | `report_filed` |
| `defend` | triage; headers; policy; profile | `profile_done`; this aim has `missionConclusion: true` |

`enter_room` tasks exist for each room so the HUD tells the student where to go next.

### Global variables

| Global | Set by | Read by |
|--------|--------|---------|
| `roe_signed`, `plan_done`, `report_filed`, `profile_done` | stage UIs via `complete(true)` -> `set_global` | Ruth's ink, aim unlocks, the door-key gives |
| `intel_*` (e.g. `intel_email_pattern`, `intel_pierce_trusts_jed`) and `lord_payslip_date_known` (from the 06 call) | 02 / 06 intel events | 03 readiness, 04 `primedFor` / `boostIfGlobal`, Ruth's hints |
| `target_ready_<id>` (x3) | 03 N3 "target ready" | the three `recon` tasks, which in turn set `osint_done` |
| `phish_hampshire_landed`, `phish_pierce_landed`, `phish_lord_landed` | 04 outcome via 01 | aims, report metrics |
| `landing_page_built`, `landing_domain` | 07 | `linkCredible` (04), the look-alike message in 05 |
| `pretext_call_done`, `pretext_suspicion_peak` | 06 | Sofia's `primedFor` intel; report metrics |
| `metric_sent_<id>`, `metric_failed_<id>` | 01 (new, section 6) | report workstation |
| `triage_done`, `headers_done`, `policy_done` | 05 | Blue Team aim |

All are declared in `globalVariables` (the validator warns on undeclared `set_global` names).

### Hints and no dead ends

- **Ruth is the support hub**, progress-gated like m01/m02's Agent HaX: she says nothing about a
  stage the player hasn't reached, and gives three hint rungs per stage on request.
- **04 hint ladders** per target (nudge, stronger nudge, pointer to the missing fact).
- **The board's "still missing" panel** is the always-on answer to "what do I do next".
- No NPC on the critical path can be knocked out of a needed state: Ruth's conversation is never
  the only completion route (the README's KO rule); the stage UIs complete tasks themselves.
- Reload safety: board facts, inbox contents, sent mail and the report draft persist in game state
  (the fingerprint W1 lesson, repeated in 01 N2 and 03 N2).

### Ethics and authorisation (book Ch. 2)

Carried at four points, none skippable: the stage-0 RoE gate; the board's `scopeNote` on every
visit; the reminder in stage 5 that the call is made to the published service-desk line on the
sheet, with the stop-and-escalate rule; and the stage-6 tone check. Targets are fictional
companies and people, no real staff are used (Q3), and the lab states once that the techniques
are only lawful with written authorisation. Content notes are included for students: a lure about a
bereavement or illness is not offered as a pretext, because the rules engine's concept sets simply
do not include one, and Ruth says why if the player tries (Ch. 2: do not exploit distress).

### Assessment mapping

Marks are produced by the game from the same records the student sees, so there is no hidden
grading. A tutor view reads the persisted game state; Hacktivity can take the mission's completion
flag as it does for other labs.

| Outcome (section 1) | Evidence the game records | Suggested weight |
|---------------------|---------------------------|------------------|
| 1 scope & law | RoE cards correct first time; stop-rule answer | 10% |
| 2, 3 OSINT | email pattern derived and predicted; metadata questions; facts found | 15% |
| 4 spear-phish | factors passed per target; attempts to land; hints used | 20% |
| 5 landing page | tells chosen vs tells present | 10% |
| 6 pretext | call outcome; suspicion peak; whether the call-back lesson was explained | 10% |
| 7 reporting | findings pairs correct; tone check | 10% |
| 8 headers & auth | three header interpretations; the look-alike trap; policy rollout | 15% |
| 9 threat intel | mitigations sensible; indicators tagged | 10% |

Weights are a starting suggestion for the module leader. "Attempts" and "hints used" are shown
to the student but should lower a mark only slightly; the point is to reach the explanation.
Optional follow-on coursework (not in-game): a written reflection of 500 words on what the
look-alike domain taught about authentication, and a one-paragraph awareness note for staff.

**CyBOK mapping** for `mission.json` (to confirm against the CyBOK keyword list when written):
Human Factors (social engineering, phishing, security culture), Adversarial Behaviours (attacker
models, kill chain), Security Operations & Incident Management (phishing detection, threat
intelligence), Network Security (email security).

## 5. Scenario-authored data (what content this scenario needs)

Files, following the existing lab layout (`scenarios/lab_scanning/`): `mission.json`,
`scenario.json.erb`, `ink/`. No `secgen_scenario`, no `vm_object`, no `flags` block, no
`labsheet_vm_steps.md`. `mission.json` uses `"collection"` of the phishing/SE strand (name to be
agreed; `vm_labs` is wrong here) and `difficulty_level` 2.

| Content | Owner doc | Volume |
|---------|-----------|--------|
| `globalVariables`, `objectives`, rooms, doors, keys, NPC placement | this doc | one `scenario.json.erb` |
| `mailClient` (account, contacts, seeded inbox, payload kit) | 01 | ~10 seeded messages (6 benign for realism, plus the triage set) |
| `osint` sites (company, careers, social x3 profiles, PDF with metadata, seeded search) and `intelFacts` | 02 | ~25 facts across 5 sources |
| `intelBoard` (title, `scopeNote`, people, defender-mode relabel text) | 03 | one block, two modes |
| `phishTargets` x3 with concept sets, replies, `redFlagStrings`, hints | 04 | 3 targets, ~12 strings each |
| Landing-page rules, look-alike domain options, tells | 07 | 1 page model, ~6 tells |
| Pretext call: Dev's ink, suspicion rules, outcomes | 06 | 1 conversation, 2-3 pretext routes |
| Triage set (8 messages with raw headers), header questions, DMARC rollout sim | 05 | 8 messages, 3 header analyses |
| RoE document, scope cards, scoping fill-ins, report findings and tone option | this doc | text + 3 findings |
| Ink: Ruth (briefing, hints per stage, debrief), Whitlock, Tomasz, Dev | this doc, 06 | 4 ink files |
| Concept cards (SPF, DKIM, DMARC, 4 tools) | this doc | 7 short `notes` objects |

Authored fragments owned by this doc:

```jsonc
"engagement": {
  "client": "AccountingNow Ltd (fictional)",
  "roe": {
    "inScope":  [ "work email to named staff", "published service-desk phone line", "public OSINT" ],
    "outScope": [ "personal accounts", "physical entry", "real customers", "denial of service" ],
    "stopContact": "Ruth Adeyemi, Northgate duty line",
    "scopeCards": [
      { "id": "personal_mail", "text": "Email a staff member's personal address", "inScope": false,
        "why": "RoE section 4 limits the test to work accounts." }
    ]
  },
  "measures": [ "sent", "opened", "clicked", "submitted", "reported", "callOutcome" ],
  "report": {
    "findings": [
      { "id": "spoofed_colleague", "text": "Finance acted on mail spoofing a colleague",
        "rootCauses": [ { "id": "no_banner_dmarc_none", "correct": true,  "why": "..." },
                        { "id": "staff_carelessness",   "correct": false, "why": "Blames people; the control gap is the cause." } ],
        "controls":   [ { "id": "banner_dmarc_enforce", "correct": true, "why": "..." } ] }
    ],
    "toneChecks": [ { "id": "shame_wording", "text": "Pierce should have known better", "blame": true } ]
  },
  "defender": {
    "dmarcStart": "none",
    "rollout": [ "none", "quarantine", "reject" ],
    "factMitigations": [ { "intel": "email_pattern", "options": [ { "id": "remove_list", "good": true, "why": "..." } ] } ],
    "iocKinds": [ "domain", "subject", "sender-pattern", "url" ]
  }
}
```

All feedback strings are authored and linted for empty interpolation (04 N3). The report and
defender blocks follow the same "right answer plus a reason for each wrong one" shape as the
04 factors, so one validator rule covers them.

**Optional lab sheet.** There is no VM, so the strict VM split in the lab-sheet skill does not
apply. A short "practical"-mode sheet (concept recap per stage, hints) may be published via
`HacktivityLabSheets` and held by Ruth as a `lab-workstation` item, as m02's field guides are. The
game must be completable without it (all learning is in-game).

## 6. Engine wiring

### Components used

| Stage | Component | Start interaction | Completion |
|-------|-----------|-------------------|------------|
| 0, 1, 7d | Intel board (03), plus RoE `notes` object | `case-file` object | `minigame_completed` -> `set_global` |
| 2 | OSINT browser (02) | recon workstation | intel events -> board; `osint_done` when all targets ready |
| 3, 5 | Mail client (01) + rules engine (04) | mail workstation | `minigame_completed {targetId, outcome, pretextScore, redFlags}` (01 N3) -> `phish_<id>_landed` |
| 4 | Landing-page builder (07) | page-builder workstation | `landing_page_built`, `landing_domain` |
| 5 | Pretext dialogue (06) on `person-chat`/`phone-chat` | desk phone | `pretext_call_done` |
| 6 | Report builder (NEW) | report workstation | `report_filed` |
| 7 | Triage (05), board defender mode (03) | triage workstation / case-file | `triage_done`, `headers_done`, `policy_done`, `profile_done` |

Registration, starters and completion follow the existing pattern cited in 01 (the minigame
manager's `registerScene`, a starter in `systems/minigame-starters.js`, `base-minigame.js` emitting
`minigame_completed`, bridging with `set_global` / objective `onComplete.setGlobal`). Ruth's
`eventMappings` listen for `global_variable_changed:<name>` to complete the `manual` tasks and give
keys. The validator rule about NPCs outside the start room missing early events applies: Ruth is
in the start room, so she is the single listener; no other NPC needs a mapping on these globals.

Dependencies: this doc assumes 05 provides a message set with raw headers and an SPF/DKIM/DMARC
interpretation task, that 06 can be driven from a desk phone with a suspicion meter and emits an
outcome, and that 07 emits the chosen domain. If any differs when those docs land, change this
doc, not theirs.

### New engine work specific to this scenario

| # | Item | Notes |
|---|------|-------|
| N1 | **Engagement report builder** (`minigames/engagement-report/`): results panel, findings pairing, tone check, emits `report_filed` | Small; reuses overlay chrome and the right/wrong+why pattern from 04 |
| N2 | **Metrics collection**: 01 records sends, failures and outcomes per target in game state; the report reads them | Prefer extending 01's persisted state over a new store |
| N3 | **RoE scope-card quiz and scoping fill-ins** as a board mode (03) or a small form overlay | Could be a `manual`-task form on the board; decide with 03 |
| N4 | **Defender-mode fact mitigation + IoC tagging** on the board | 03 already lists defender mode; confirm it supports choose-a-mitigation interactions |
| N5 | Door/key gating handled by existing locks and `#give_item`; **no new engine work** | Verified pattern in README (key locks, `give_item`) |
| N6 | **Resolved (R1):** a mission with no `secgen_scenario` is supported (`Mission#requires_vms?`). Only the `collection` label (free text, not `vm_labs`) remains to agree | — |

Nothing here needs a VM, the flag-station or the vm-launcher.

## 7. Reuse and tuning

- **Awareness (11):** the same stages, shortened. Drop stage 0's legal detail to a one-card consent,
  keep one OSINT layer, one easy target, no landing page, no header reading; stage 7 becomes
  spot-the-phish only. Targets, rules and strings are the same files with fewer factors required
  and the meter on throughout.
- **Missions (12):** any single stage is liftable (OSINT -> phish -> call). The lab's `phishTargets`
  and `osint` blocks are the templates.
- **Student tuning knobs:** meter on/off per target; required factors per target; hint verbosity;
  ambiguity in search results; whether stage 7 includes the forwarder header case (the hardest
  concept) or leaves it as an extension.
- **Cohort reuse:** a second fictional company (different pattern, e.g. `firstname.surname@`) swaps
  in as data, so a re-sit or a second cohort does not share answers.

## 8. Assets (PixelLab-first, none generated now)

- Characters (sprite + 400x400 chat background where they speak): Ruth, Whitlock, Tomasz, Dev
  (service desk; phone only, so a portrait and no walk sprite). Targets Chris Hampshire, Melanie Pierce and Sofia Lord
  need portraits for the board cards and reply headers; they do not walk in the scenario. Vary
  ethnicity and age across the cast (standing preference).
- Rooms: Engagement Office, Recon Room, Operations Room, Blue Team Room, orthogonal top-down props:
  desk, workstation, whiteboard/board, desk phone, SOC wall of screens, a visible `lab-workstation`.
- Item sprites: RoE document, three keys (Recon, Operations, Blue Team), concept-card notes.
- UI art owned by 01, 02, 03, 05, 07; this doc adds only the report panel (results table, finding
  cards, tick/cross).
- Audio: voice for Ruth and Dev (Dev's call benefits most). Music reuses an existing office track.

## 9. Open questions

Copied to `QUESTIONS_FOR_USER.md` (Q10 onward). Defaults are taken so nothing blocks.

- OQ1 (Q10): **Retries as rehearsal.** Realistically a failed phish alerts the target. Default:
  retries are free and unlimited, framed as rehearsal reviewed by Ruth, with failed sends counted
  in the report. Alternative: a "heat" limit that forces a hint. Default keeps it fun, not hard.
- OQ2 (Q11): **Assessment weights and tutor view.** The table in section 4 is a suggestion; is a
  per-student tutor report needed, and does Hacktivity take more than the completion flag?
- OQ3 (Q12): **Length target.** Roughly 60-90 minutes is the aim for a lab session. Cut order if it
  runs long: forwarder header case, second ambiguous search, report tone check, optional aims.
- OQ4 (Q13): **Include the forwarder/SPF-breaks case?** Default yes (it is the correct, commonly
  missed nuance); drop for a first-year cohort.
- OQ5 (Q14): **Lab sheet.** Publish an optional practical-mode sheet (default yes, after the game
  exists) or keep it fully in-game.
- OQ6 (Q15): **Legal framing by jurisdiction.** Default names the UK Computer Misuse Act 1990 with a
  generic "equivalent laws elsewhere" line; a module leader may want local wording.
- OQ7 (Q15): **Cast naming.** Cast now follows 00 §1; confirm or rename there only.

