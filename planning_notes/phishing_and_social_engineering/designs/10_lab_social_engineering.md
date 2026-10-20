# 10 — Lab: Social Engineering (`lab_social_engineering`)

Status: plan. The scenario that proves the suite: it chains 01–07 into one engagement that fits a
single session of about 75 minutes. It is the first shippable SE product and takes the module's one
technical-lab slot. Browser-only, no VMs. Its systems later become the core of SAFETYNET: Eldritch
Hacker (see `README.md`).

`00_data_contract.md` is authoritative for ids, schemas and the engine items (S1 to S11). Where this
doc leans on 01 to 07 it says what it assumes (section 6, "Requests of other docs"); when those docs
change, change the request, not their text. The pretext score is the NPC's influence (`00` §8),
carried across channels (`00` §9). Email replies come from the character's mail story (`00` §10).

## 1. Purpose & audience

**Audience: Cyber Security students.** Browser-only, no VMs. The game models the mechanics, so every
judgement is deterministic and every result is explained on screen: no lost replies, no vague
rejections, no dead-end victims.

It follows the structure of Joe Gray, *Practical Social Engineering* (Parts I–III), and the
learn-by-doing stance of Chothia et al. (ASE '18): the student does the attacker's work first, then
sits in the defender's chair and reads the same attack from the other side.

| Stage | Book chapter | What the student learns | Component |
|-------|--------------|-------------------------|-----------|
| 0 Authorisation | Ch. 2 | Why scope, consent and a rules-of-engagement sheet come first | intel board, `scope` mode (03) |
| 1 Scope & plan | Ch. 3 | Objectives and success measures; what the targets will need | intel board, `plan` mode (03) |
| 2 OSINT | Ch. 4–6 | Business, social-media, document and people OSINT; deriving the email pattern; reading file metadata | OSINT browser (02) → board (03) |
| 3 Spear-phish, two rounds | Ch. 7 | Open inboxes, sender trust, addressing, pretext relevance, attachment fit, sender authentication (advisory) | mail client (01) + rules (04) |
| 4 Landing page | Ch. 8 | How a credential-harvest page convinces, and the tells a defender checks | landing-page builder (07) |
| 5 Pretext call, then the hard phish | Ch. 1, App. D | Pretexting, elicitation, how influence is won and lost; a link-bearing phish | pretext dialogue (06) + mail (01, 04) |
| 6 Metrics & report | Ch. 9 | What to measure, how to report findings without blaming staff | report builder (new, section 6) |
| 7 Defender flip | Ch. 10–12 | Triage, reading authentication results, a short threat-intel profile | triage (05) + board `defender` mode (03) |

**Learning outcomes.** These are what the objectives in section 4 evidence.

1. Define an engagement scope and state why an unauthorised version of the same actions is an offence.
2. Derive a company's email-address convention from public evidence and use it to predict an address.
3. Identify what a published document's metadata discloses (author, software, username, path).
4. Explain, for each phishing message sent, which factors made it land or fail.
5. Distinguish a look-alike domain from the real one and explain what a clone page cannot copy.
6. Describe how a pretext call builds on OSINT and where a call-back policy defeats it.
7. Report an engagement's results with metrics, root causes and fixes, not names to blame.
8. Read the SPF, DKIM and DMARC results on a message and decide whether it is trustworthy, including
   the case where all three pass for a look-alike domain and the case where SPF fails for a genuine
   forwarded message.
9. Turn scattered findings into mitigations for *the organisation they just attacked*.

**Model, don't weaponise.** Tools are named at concept level only: theHarvester (collects emails,
names and subdomains from public sources), Hunter (shows a domain's email pattern), Recon-ng (a
framework that automates such modules), exiftool (reads file properties). The student never runs
them; the OSINT browser shows what their output *looks like* and the lab asks what it means. The
landing-page and mail components judge reasoning, and produce no runnable phishing kit, spoofing
recipe or harvesting code.

## 2. Player goal in their own words

"I've been hired to test AccountingNow's staff. Find out about them, get three people to take the
bait, learn how the staff payroll portal works by phone, write it up, and then switch to the other
side and show the company how they should have caught me."

## 3. The loop (stage by stage)

### Setting and cast (fictional throughout)

The student plays a junior consultant at **Northgate Assurance**, a security consultancy, on a
contracted engagement for **AccountingNow Ltd**, a 40-person accountancy software firm. Both are
invented; every person, domain (`accountingnow.example`) and profile is fictional, and no real staff
are profiled. Cast ids follow `00` §1; where this doc and 00 differ, 00 wins.

| Who | Role in the lab | How the student meets them |
|-----|-----------------|----------------------------|
| **Ruth Adeyemi** | Northgate engagement lead: briefs, hands over keys, runs the support hub (progress-gated, as Agent HaX is in Licence to Hack) | Person NPC in the Engagement Office (`ruth`); phone contact `ruth_phone` for hints from any room |
| **Gareth Whitlock** | AccountingNow managing director, the signing client | Person NPC in the Engagement Office, one short scene once the sheet is signed |
| **Chris Hampshire** (`hampshire`, Careers/HR) | Target 1, easy: the open `careers@` inbox accepts CVs from anyone | Email only; replies come from the target's authored `replies` (no ink story) |
| **Melanie Pierce** (`pierce`, finance, new starter) | Target 2, medium: trusts colleague Jed Baker, primed for a Friday balance sheet (the worked example in 04) | Email only; `character: pierce`, mail story `pierce_mail` |
| **Sofia Lord** (`lord`, intern) | Target 3, hard: new to the firm, uses the staff payroll portal, cautious about links | Email only; `character: lord`, mail story `lord_mail` |
| **Dev** (`dev`, service desk) | The pretext-call target (06 §4.8): supports the staff portals | Phone only, record `dev_service_desk`; not an email target |
| **Tomasz** (AccountingNow security lead) | Defender half only: sets the triage exercise and gives the closing debrief | Person NPC in the Blue Team Room |

### Rooms and movement (high level)

A hub with three spokes. The spine is linear in order, but the hub lets the player walk back to
re-read the board at any time.

```
                 [ Blue Team Room ]   (stage 7; locked until the report is filed)
                         |
 [ Recon Room ] ---- [ Engagement Office ] ---- [ Operations Room ]
   (stage 2)            (start / hub)               (stages 3-5)
```

| Room | Contents | Component |
|------|----------|-----------|
| **Engagement Office** (start, hub) | Ruth; Whitlock; the **Rules of Engagement** (RoE) sheet on the desk; the **case-file board**; the report workstation | 03 board (`scope`, `plan`, `recon` modes); report builder |
| **Recon Room** | OSINT workstation; three **concept-card** notes on the wall (Hunter, theHarvester and Recon-ng, exiftool) | 02; `notes` objects |
| **Operations Room** | **Mail workstation**; **page-builder workstation**; a **desk phone** | 01 (+04); 07; 06 |
| **Blue Team Room** | **Triage workstation**; the SOC board in `defender` mode; Tomasz | 05; 03 |

Doors are plain key locks (each lock carries `keyPins`). Ruth hands over each key (`#give_item`, the
existing pattern) when the previous aim completes, so the objectives enforce the sequence and the
player sees a physical reason to go back to her. The Blue Team door stays locked until the report is
filed (the narrative flip: you leave the red cell and walk into the client's SOC seat).

### Stage 0 — Authorisation (Engagement Office; Ch. 2)

Ruth briefs. At the case-file board in `scope` mode the student reads the **Rules of Engagement**
(the sheet's text is shown first in the mode) and makes two small decisions with deterministic
feedback:

- *Is each action in scope?* Five cards: phish named staff by work email (in); phish staff at their
  personal addresses (out); call the published service-desk line (in); tailgate into the building
  (out for this contract, physical is excluded); post to AccountingNow's real customers (out). A
  wrong answer is explained from the document ("§4 excludes personal accounts"), then re-asked.
- *What do you do if you find a real compromise or a real person in distress?* One right answer
  (stop and call the emergency contact on the sheet), with the reasons for the wrong ones.

Then Whitlock's authorisation is "signed" on the board and the rule is stated once, plainly: "The
same actions without this sheet are offences (Computer Misuse Act 1990 in the UK; Computer Fraud and
Abuse Act in the US)." Sets `roe_signed`. **This beat is the ethics gate (book Ch. 2); it is the
first aim and cannot be skipped.**

### Stage 1 — Scope & plan (board, `plan` mode; Ch. 3)

At the same board the student turns the brief into a plan with two picks:

1. **Objectives**: pick from a list (test finance and HR staff by email; test the service desk by
   phone; measure reporting rates). Wrong picks (e.g. "disrupt payroll") are rejected with the
   rules-of-engagement reason.
2. **Success measures**: pick which numbers the report will need (messages sent, opened, clicked,
   submitted, reported). Teaches that you decide the metrics *before* you send anything.

When the plan is accepted the three target cards appear with empty readiness slots ("You still
don't know ..."), so the student sees what they must find. Sets `plan_done`; Ruth gives the Recon
Room key.

### Stage 2 — OSINT (Recon Room; Ch. 4–6)

At the OSINT workstation (02) the student works three layers and a short search list. Every fact
found drops onto the board with a "noted" flourish, sets its `se_intel_<id>` global (`00` §5) and
fills the matching readiness slot. The contract facts are in `00` §1; 11 of the 14 are found here
and the other three (`lord_portal_name`, `lord_payslip_date`, `lord_trusts_portal_sender`) come from
the call in stage 5.

- **Company site and careers page.** The team page lists some staff *with* addresses and some
  without. The deliberate **derive-the-pattern step**: the student sees two examples and **picks the
  pattern** (`first-initial.surname@`), and the board checks it by asking them to **pick the address
  of a third person from a short list of candidates** (02 OQ1). Typing is never judged. Gives
  `email_pattern`, `pierce_role`, `hampshire_careers`, `careers_attachment` and `tech_stack`
  (Xero, Office 365), and Jed's note about the Friday balance sheet (`pierce_expects_balance_sheet`).
  The Hunter concept card is read here: the tool shows a domain's pattern and a confidence; the
  lesson is the pattern, not the tool.
- **Social media.** Pierce's "first week in finance, Jed's showing me the ropes" (`pierce_trusts_jed`);
  Hampshire's "so many CVs to get through before Friday" (`hampshire_cv_backlog`); Sofia Lord's
  "sorting my payslip on the staff portal" (`lord_portal`: she uses *a* staff portal, no name) and her
  new-intern profile (`lord_intern`). Teaches how ordinary posts become pretext material.
- **Public documents.** A published PDF whose **metadata panel** (02 N3) shows author `mpierce`,
  software "Microsoft Excel" and a path under `C:\Users\mpierce\` (`username_convention`). The student
  answers two picked-answer prompts: what username convention does this show, and why does the path
  matter? (Usernames are guessable from names, so a login page asks for something the attacker
  already has; the path names the machine's profile layout.) An archived org chart on the same page
  is out of date (`old_org_chart`, a `stale` fact): a person who left in spring is listed as the
  finance lead. A student who spoofs that name in stage 3 fails `senderTrust` and learns why source
  quality matters.
- **Search list.** A short list of found names and handles to pick from, modelling theHarvester or
  Recon-ng output. The student picks entries to open; nothing is typed.

Ruth's check-in is a *board* check, not a quiz. When all three target cards show "Ready to approach",
Ruth says so and hands over the Operations key. Readiness follows `00` §4: Lord's card needs only
`lord_portal` and `lord_intern`. The portal name, the portal sender and the payslip date arrive in
stage 5 and are send-time prerequisites for her phish, never a reason to wait at this door. Missing a
fact never blocks; the board's "still missing" panel and Ruth's hints point at the source layer.

### Stage 3 — Spear-phish, rounds 1 and 2 (Operations Room; Ch. 7)

At the mail workstation (01) the student composes to **Hampshire**, then **Pierce**, from templates
with blanks (`00` §10). Every blank is filled from a fact the student holds, so a blank offers only
what they have found, plus the occasional `stale` entry. The rules engine (04) judges each send and
returns the full factor checklist, not the first failure.

The mail client has two accounts here (`00` §10a):

| Account | Kind | Use |
|---------|------|-----|
| `guest` ("Operator") | given, `spoofsFrom: true` | Rounds 2 and 3: the From blanks are free, so the student can claim to be Jed |
| `freemail` | created, `unlockedBy: acct_freemail` | Round 1: the student picks an address from a short authored menu; header From is forced equal to it |

A `found` account is part of the model but this lab does not use one.

| Round | Target | Account | Required factors (04) | What the round teaches |
|-------|--------|---------|-----------------------|------------------------|
| 1 | Hampshire | `freemail` | `addressedTo`, `pretextRelevant`, `attachmentPlausible` | An open inbox trusts any sender. The From part is a fixed "own account" template with no blanks; an applicant pretext (`pretext_apply`, implying the document `cv`) and a CV from the kit are what land. Red-flag meter **on** |
| 2 | Pierce | `guest` | `senderTrust`, `addressedTo`, `pretextRelevant`, `attachmentPlausible` | The From line is only a label: the student pairs a display name with an address (`baker_full`, `baker_address`), and nothing but the checklist says whether they belong together. Trust is borrowed from a known contact. Needs the Jed spoof and the Friday balance-sheet story, both from OSINT. Meter **off** |

Each success lands as the target's in-character reply plus the checklist and sets the landed global.
Hampshire's reply is authored data; Pierce's is written by `pierce_mail` (its `on_email` knot) after
the delay in `00` §10, and the checklist does not wait for it. Each failure shows exactly which factor
failed, and the hint ladder starts after two misses.

**`senderAuth` on the attacker side.** From round 1 (this stage) the checklist carries an advisory
line under the factors. In round 1 it says the message is sent as the student's own outside address,
so there is nothing to spoof and nothing to fail. In round 2 it says, for example, "the spoofed
`j.baker@` address would fail the domain's sender authentication and may be quarantined before
Melanie sees it". It never changes the verdict. It plants the question stage 7 answers: why was this
flagged, and why can a message pass all three checks and still be a phish.

### Stage 4 — Landing page (Operations Room; Ch. 8)

At the page-builder workstation (07) the student assembles a credential-harvest *page model* for
Sofia Lord's phish: a look-alike of **her staff payroll portal**. They pick the look-alike domain
from the authored menu (`d_word`, `d_sub`, `d_vv`, `d_homo`), the logo, the wording, the form fields
and the padlock (07's seven choices). The builder judges the choices against rules (domain tier and
homoglyph tells, brand and wording match, whether a padlock is shown and what it does and does not
prove). **It builds a scored model of a page, never a working page or form handler** (07 owns that
boundary). Feedback names each tell a defender could use. The page record (page id `payroll_login`,
the chosen domain id and the choices) is persisted by 07 and sets `landing_payroll_login_built`.

The page does not depend on the call, and the call does not change the page's score: 07 has no input
from globals. Ruth suggests calling Dev first because what he says sharpens the wording the student
will want, but either order completes the aim.

### Stage 5 — Pretext call, then the hard phish (Operations Room; Ch. 1, App. D)

Sofia is cautious, and the page alone is not enough: a "your payslip is ready" notice is only
plausible if the student knows what the real portal is called, who its notices come from, and when
payslips are released. The social post gave only "a staff portal". The student gets the rest by
calling **Dev on the service desk** from the desk phone. The call is `pretextNpcs[service_desk_call]`
(06 §4.8) and runs on `phone-chat` with `pretext-prep` before it and the debrief after it.

- **Pretext card.** The student picks the opening line from templates: "I'm the new intern's buddy,
  she can't find her first payslip on the portal" (blanks: the intern's name from `lord_intern`, the
  team from `pierce_role`). Some held values are stale. Dev checks the intern's name and team
  (identity grade).
- **Dev's influence bar** (`00` §8) is in the phone-chat header, with threshold icons for wary
  (-40), refuses (-50), reports (-70) and the channel lockout (-90). Dev starts at -10
  (`dev_influence`). Claims he can check and that hold raise it; claims he can check and that are
  wrong lower it a lot; urgency and borrowed authority lower it; owning a slip early recovers it. The
  tells panel shows the delta, the reason and the line after every turn.
- **Two asks.** `portal_name` (floor -30, no verification) grants `lord_portal_name` and
  `lord_trusts_portal_sender`: the portal's name, how its notices read and who they come from.
  `payslip_date` (pressure -10, floor -20, verification: the intern's name) grants
  `lord_payslip_date`. Grants set `se_intel_*` through the shared writer, so the board and 04 see
  them at once.
- **Outputs.** `pretext_call_done` is set when the call ends with at least one ask granted. The
  engine writes `pretext_service_desk_call_outcome` and `pretext_service_desk_call_lowest`; a report
  sets `dev_reported`. All are declared in `globalVariables`, none imported.
- **A failed call never dead-ends the path.** If Dev reaches his `reports` threshold he ends the call
  "to check with his manager", and a channel-scoped lockout keeps the phone from him for ten game
  minutes, after which the engine sets him back to -30 (06 §4.8; `00` §8). Ruth says the call was
  "burned for ten minutes", which is that expiry spoken in character. No object is greyed and no
  mission beat is needed. At -30 the date ask (floor -20) needs a few matched claims first, so the
  second attempt is harder but open; the hint ladder (06 §4.5) starts then. The lockout is
  channel-scoped, so the email route to Sofia stays open. A call-back policy would have stopped this;
  the stage 6 finding and the stage 7 mitigation pick that up.

Because `pretext_call_done` needs one ask and Sofia's phish needs all three facts, the `prepare_hard`
aim can complete with the date still unknown. The round 3 checklist then names the gap as an intel
gap ("you still don't know when payslips are released") and Ruth's hint rungs point at Dev. This is
by design: the phone stays open for another call.

Back at the mail workstation the student composes **round 3 to Sofia Lord** from `guest`, with the
portal's notification sender in the From blanks (`lord_trusts_portal_sender` provides the name and
address values), a named greeting, a payslip pretext carrying the date, and the page built in
stage 4 as the link. Required factors: `senderTrust`, `addressedTo`, `pretextRelevant`,
`linkCredible`. Without the built page `linkCredible` cannot pass and the checklist says so; that is
the hard gate, checked at send time and not on the board (`00` §4). Advisory only: `urgencyCalibrated`
("this reads as high-pressure, a defender would clock it") and `senderAuth`. Urgency never fails a
send, because real phishing with heavy pressure still lands; it is taught as a tell in the stage 7
triage, where the student is the reader.

### Stage 6 — Metrics & report (Engagement Office; Ch. 9)

The report workstation shows the **campaign results**, filled from what actually happened (this is
why stage 1 asked for the measures):

- Messages sent per target; outcome per target (opened, clicked, submitted, replied); attempts per
  target; failed sends (framed honestly: "in a live test each failed send is a chance for a member of
  staff to report you"); whether the call succeeded, the lowest influence Dev reached and which
  triggers moved it.
- **Findings builder.** For each of three findings the student pairs a *root cause* with a *control*
  from authored lists. Finding 1, "Finance acted on mail spoofing a colleague": cause "no
  external-sender banner; DMARC at `p=none`", control "banner plus DMARC enforcement". Finding 2,
  "The service desk gave out the portal name and payslip date": cause "no verification script",
  control "call-back to a number on file". Finding 3, "A look-alike portal page would convince
  staff": cause "staff have no easy way to check the address or report it", control "bookmarked
  portal plus a report button". Wrong pairs are explained; right pairs lock in.
- **Tone is part of the pairing.** One wrong root-cause option per finding is a blame wording
  ("Pierce should have known better"). Choosing it is not punished with a fail but shown why: the
  report is about processes and controls, and blaming staff suppresses future reporting (Ch. 9 and
  Ch. 10).

Ruth reads it. Sets `report_filed`; Ruth gives the Blue Team key.

### Stage 7 — Defender flip (Blue Team Room; Ch. 10–12)

Tomasz takes the report and sets a debrief exercise. The same strings serve both seats (04
`redFlagStrings` are the tells in 05).

1. **Triage and headers.** An inbox of eight messages at the triage workstation (05), scored under
   the `analyst` profile with the header panel and glossary open. Per message: *trust / report /
   delete* (05's three verdicts), then the chips for why. Wrong calls are explained with the tell the
   student themselves exploited. Reading headers is part of this step, not a separate quiz: each
   message's authentication results carry a `headerNote`. Five messages are phish and three are
   genuine:
   - **Student's Pierce phish** (`playerSent`): the display name is Jed's, the real account is not
     (`tells`: `senderTrust`, `senderAuth` would-fail). SPF fail, DKIM none, DMARC fail; the
     `Return-Path` and the first external hop do not match the name.
   - **Student's Lord phish** (`playerSent`): `tells`: `senderTrust`, `linkCredible`, plus the
     advisory urgency read.
   - **Look-alike payroll notice** (authored): all three checks pass, **for the look-alike domain**,
     and the sending domain is the student's own stage 4 choice (`domainFrom` substitution, section
     6). Authentication proves the sending domain is *consistent*, not *trustworthy*; this is the
     lesson students most often get wrong.
   - **Parcel notice with a zip** (authored phish) and **CV with an odd portfolio link to the careers
     inbox** (authored phish; the defender's view of stage 3 round 1).
   - **Genuine mail via a forwarder** (authored): Jed to Pierce, Friday balance sheet. SPF fail
     (the forwarding host is not in the sender's SPF record), DKIM pass, DMARC pass because DKIM
     aligns. Teaches why DMARC needs only one aligned pass and why SPF alone breaks on forwarding.
   - **A vendor invoice** and **a staff newsletter** (authored, genuine).

   The concept panel (SPF, DKIM, DMARC; the 05 glossary) is short and follows 05's definitions: SPF
   lists the hosts allowed to send for the envelope domain; DKIM signs chosen headers and the body;
   DMARC requires SPF or DKIM to pass *and align* with the visible `From` domain, and publishes a
   policy (`none`, `quarantine`, `reject`). The consequence of AccountingNow's `p=none` is taught in
   the stage 6 finding and in the `headerNote` on the student's own Pierce phish ("a policy of `none`
   monitors but does not stop this").
2. **Threat-intel profile (Ch. 12).** The board switches to `defender` mode: the facts the student
   collected, titled "what an attacker can assemble about us". For each of four exposed facts (the
   email pattern, the document metadata, the Lord social post, the careers inbox) the student picks
   one mitigation from an authored list (remove the staff email list, strip PDF metadata on publish,
   a social-media policy, a call-back procedure), each with a reason. The chosen mitigations make up
   the profile. There is no indicator tagging in this slice.

Finishing the profile sets `profile_done`.

### Closing debrief (Blue Team Room)

Tomasz gives a short in-person debrief once `profile_done` is set: what the exercise showed, what
AccountingNow will change, and the no-blame line. Branches are gated on globals (the call went well
or was reported; a first-try land on Pierce) and use fixed strings, so voiced lines print no
variables. The conversation ends with `#complete_task:closing_debrief` and `#exit_conversation`,
which completes the mission-conclusion aim and opens the conclusion screen.

## 4. Rules, gating & assessment

### Critical path

```
roe_signed -> plan_done -> osint_done -> phish_hampshire_landed -> phish_pierce_landed
           -> [ landing_payroll_login_built  AND  pretext_call_done ]   (either order)
           -> phish_lord_landed -> report_filed -> triage_done -> profile_done -> closing_debrief (mission complete)
```

Everything on it is a deterministic judgement with an explanation. There is no timer, no lose state
and no KO (`disableAttacks: true`). Every failed attempt can be retried; the hint ladder always ends
in a near-explicit pointer. Stage order matters only where one stage makes another's input (the page
and call feed the Sofia Lord phish; the report feeds the Blue Team door).

### Time budget (target 75 minutes; accepted range 60 to 90)

A first-time student, including walking, reading and dialogue. The figures are estimates until the
timed blind playtest in section 9 replaces them.

| Stage | Minutes | What is in it |
|-------|--------:|---------------|
| 0 Authorisation | 5 | Brief, five scope cards, one stop-rule question, Whitlock's line |
| 1 Scope & plan | 4 | Two picks; target cards appear |
| 2 OSINT | 11 | Three layers, derive-the-pattern pick, two metadata picks, search list, 11 facts |
| 3 Phish rounds 1 and 2 | 11 | Freemail account (1), Hampshire (3), Pierce (7) with two to three attempts each |
| 4 Landing page | 6 | Seven choices, the tells feedback |
| 5 Call and round 3 | 11 | Pretext card and call (7), Sofia's phish (4) |
| 6 Report | 6 | Results, three findings paired |
| 7 Triage and profile | 13 | Eight messages (9), four mitigations (4) |
| Closing debrief | 3 | Tomasz |
| Walking, doors, Ruth's hand-overs | 5 | Spread across the stages |
| **Total** | **75** | |

Reply delays are short in-game waits that overlap with the next action, so they add no time. The
Tesseract lab estimated 45 to 60 and ran 60 to 75 with real students (`scenarios/lab_tesseract_trials/DESIGN.md`),
so expect this lab to run past 75 for a slow cohort. Cut order, with the minutes each saves, if the
playtest runs long:

1. Drop the stage 7 profile and end on the triage (4).
2. Drop Hampshire's round and start the phishing at Pierce (3), moving the open-inbox lesson to a
   triage message.
3. Reduce the triage to six messages (3).
4. Reduce the report to two findings (2).

The things that are already cut for time, and where each would return in an extension: the
stand-alone header-interpretation quiz, the DMARC rollout simulation, indicator tagging in the
profile, a second ambiguous search result and the fourth tool concept card.

### Objectives (aims and tasks)

Standard aim/task structure (`README_scenario_design.md`, Objectives System), each aim unlocked by
the previous (`unlockCondition.aimCompleted`). Every task is required: the platform score counts
optional tasks in the total (see "Assessment"), so the lab has none. Tasks that wait on minigame
outcomes are `manual` tasks completed by an `eventMapping` `completeTask` on Ruth (she is in the
start room, so she is the single listener), keyed to `global_variable_changed:<name>`. Tasks in later
aims ship `status: "active"` because `unlockAim` activates only the first task of an aim. Each
`enter_room` task sits first in its aim.

| Aim | Tasks (type) | Completes on |
|-----|--------------|--------------|
| `authorise` | `scope_cards` (`manual`), `stop_rule` (`manual`) | `roe_signed` |
| `plan` | `pick_objectives` (`manual`), `pick_measures` (`manual`) | `plan_done` |
| `recon` | `enter_recon` (`enter_room`), `email_pattern_derived` (`manual`), `metadata_read` (`manual`), `ready_hampshire`, `ready_pierce`, `ready_lord` (`manual`, each completed by Ruth's mapping on `target_ready_<id>`) | the last task's `onComplete.setGlobal` sets `osint_done` (nothing else sets it) |
| `phish_easy` | `enter_operations` (`enter_room`), `hampshire_landed` (`manual`), `pierce_landed` (`manual`) | `phish_pierce_landed` |
| `prepare_hard` | `landing_page_built` (`manual`), `call_dev` (`manual`) | both `landing_payroll_login_built` and `pretext_call_done`, either order |
| `phish_hard` | `lord_landed` (`manual`) | `phish_lord_landed` |
| `report` | `results_reviewed` (`manual`), `findings_paired` (`manual`) | `report_filed` |
| `defend` | `enter_blue_team` (`enter_room`), `triage_done` (`manual`), `profile_done` (`manual`), `closing_debrief` (`manual`, completed by Tomasz's `#complete_task`) | `closing_debrief`; the aim has `missionConclusion: true` |

That is eight aims and 22 tasks.

### Global variables

All are declared in `globalVariables` (the validator warns on undeclared `set_global` names).
`se_intel_<id>` is derived from `social.intelFacts` (`00` §5).

| Global | Set by | Read by |
|--------|--------|---------|
| `roe_signed`, `plan_done`, `report_filed`, `profile_done` | stage UIs via `complete(true)` → `set_global` | Ruth's ink, aim unlocks, key hand-overs |
| `se_intel_<id>` (14 contract facts, plus `se_intel_old_org_chart`) | 02 collects; 06 `grants.intel` for the three call facts | 03 readiness, 04, composers, Ruth's hints |
| `target_ready_hampshire`, `target_ready_pierce`, `target_ready_lord` | 03 readiness | the three `recon` tasks, which set `osint_done` |
| `phish_hampshire_landed`, `phish_pierce_landed`, `phish_lord_landed` | the target's outcome (set by the mail story where the target has a `character`, by `outcome.setGlobal` for Hampshire; one or the other, never both) | aims, report metrics |
| `acct_freemail` | the mail client's account creation | `social.mailClient.accounts` |
| `landing_payroll_login_built` | 07 (`landing_<id>_built`; the chosen domain is in the persisted page record, not a global) | `linkCredible` (04), the look-alike message in 05 |
| `pretext_call_done`, `dev_reported`, `dev_influence`, `dev_latched`, `pretext_service_desk_call_outcome`, `pretext_service_desk_call_lowest`, `pretext_service_desk_call_state` | 06 (§4.8, §6) | aims, report metrics, Ruth and Tomasz |
| `pierce_influence`, `lord_influence` (and `_latched`) | the mail stories, via `se_influence` (`00` §8) | 04 `strictIfGlobal` hooks if authored, the bar in the mail pane |
| `metric_sent_<id>`, `metric_failed_<id>` | 01 send log (names to agree with 01) | report workstation |
| `triage_done`, `triage_percent`, `triage_reportRate` | 05 (`setGlobalPrefix: "triage_"`) | `defend` aim, Tomasz's debrief |

### Hints and no dead ends

- **Ruth is the support hub**, progress-gated. The hint hub is her phone contact (`ruth_phone`),
  reachable from any room as Agent HaX is in Licence to Hack, because a person NPC in one room cannot
  answer from another. The hub shows only the current stage's rungs (a visible nudge, then a stronger
  nudge, then a near-explicit pointer), stays under ten choices at once, and keeps its hint choices
  sticky.
- **04 hint ladders** per target (nudge, stronger nudge, pointer to the missing fact).
- **The board's "still missing" panel** is the always-on answer to "what do I do next".
- **No KO.** `disableAttacks: true` turns off punching and tells the validator to skip its
  KO-resilience check. Ruth hands over keys in person, which is safe because nobody can be knocked
  out.
- **Reload safety.** Board facts, mail state (sent messages, mailboxes, schedulers), the landing page
  record, the pretext session and the report draft persist in game state (`00` §5, §9, §10; 01 N2,
  03 N2; 06 `PretextSession`).

### Ethics and authorisation (book Ch. 2)

Carried at four points, none skippable: the stage 0 RoE gate; the board's `scopeNote` on every visit;
the reminder in stage 5 that the call is made to the published service-desk line on the sheet, with
the stop-and-escalate rule; and the stage 6 blame option. Targets are fictional companies and people
and the lab states once that the techniques are only lawful with written authorisation. A lure about
a bereavement or illness is not offered as a pretext, because the authored template library and the
blank-value lists contain no bereavement or illness option, and Ruth says why if the player looks for
one (Ch. 2: do not exploit distress).

### Assessment

**What the platform records today.** Hacktivity records one number per game: the share of tasks and
aims completed. BreakEscape computes it in `Game#calculate_task_score`
(`app/models/break_escape/game.rb`, lines 50 to 58): `tasks_completed / total_tasks * 70` plus
`objectives_completed / total_aims * 30`. `total_tasks` counts every task, optional ones included, so
skipping an optional task lowers the ceiling. For a VM-free mission Hacktivity's `GameScoringJob`
(`app/jobs/game_scoring_job.rb`, lines 21 to 29) takes that value as the game's score, recalculates
the event result and broadcasts it. There is no per-outcome mark, hint count, attempt count or tutor
view. `merge_global_variables!` (`game.rb` lines 240 to 262) persists any declared global the client
sends, so the lab can store counters, but nothing reads them.

**What the lab can evidence with that.** The lab has no optional tasks and 22 required ones, so the
score is a completion share and a completed run scores 100. Each learning outcome is evidenced by the
tasks that can only complete once the student has done the thing. A task completes only when the
underlying judgement is right: wrong scope cards, wrong findings pairs and wrong triage verdicts are
explained and re-asked, so a student can finish with mistakes made on the way.

| Outcome (section 1) | Tasks that evidence it |
|---------------------|------------------------|
| 1 scope & law | `scope_cards`, `stop_rule` |
| 2, 3 OSINT | `email_pattern_derived`, `metadata_read`, `ready_hampshire`, `ready_pierce`, `ready_lord` |
| 4 spear-phish | `hampshire_landed`, `pierce_landed`, `lord_landed` |
| 5 landing page | `landing_page_built` |
| 6 pretext | `call_dev` |
| 7 reporting | `results_reviewed`, `findings_paired` |
| 8 authentication | `triage_done` |
| 9 mitigations | `profile_done` |

The in-game records the student sees (attempts, failed factors, hints used, the lowest influence Dev
reached) are for the student and the closing debrief. They do not reach Hacktivity.

**Open (needs Hacktivity work, not decided here).** A weighted rubric would need per-outcome marks and
a tutor view. Two options, neither chosen: (a) keep the platform score as the completion share and give
the module leader a hand-applied rubric; (b) have the game write counters into `globalVariables`
(`hints_used_<stage>`, `attempts_<target>`, `roe_first_try`, `metric_*`) and build a per-student report
in Hacktivity that reads them. Option (b) changes `game_scoring_job.rb` and adds a tutor view. This is
open question OQ2 in section 9. Optional follow-on coursework (not in-game): a 500-word reflection on
what the look-alike domain taught about authentication, and a one-paragraph awareness note for staff.

**CyBOK mapping** for `mission.json`, using keywords from `docs/CyBOKList.md`. The list has no
"social engineering" keyword and lists "phishing" only under Web and Mobile (client-side).

| `ka` | Topic | Keywords |
|------|-------|----------|
| `HF` | Awareness and Education; Positive Security | `mental models of cyber risks and defences`, `people are not the weakest link` |
| `LR` | Introductory Principles of Legal Research | `criminal law` (Computer Misuse Act beat, stage 0) |
| `ADV` | Models | `kill chains` |
| `SOIM` | Knowledge: Intelligence and Analysis | `cyber-threat intelligence` |
| `WM` | Client | `Side Vulnerabilities and Mitigations-phishing` |

## 5. Scenario-authored data (what content this scenario needs)

### Files and platform configuration

This is a non-VM lab, so the layout reference is `scenarios/lab_tesseract_trials/` (`secgen_scenario:
null`), with `scenarios/sis01_healthcare/` for `creditsTheme`. `lab_scanning` is a VM lab and is not
the model. Files: `mission.json`, `scenario.json.erb`, `ink/`. No VM fields, no `flags` block and no
VM companion sheet.

```jsonc
// mission.json
{
  "display_name": "Phishing and Social Engineering",     // working title
  "description": "...",                                  // required by the validator
  "difficulty_level": 2,                                 // required
  "secgen_scenario": null,
  "collection": "escape_room",                          // see OQ8; seeds.rb defaults to 'default'
  "ui_theme": "secops",                                  // valid in Mission::UI_THEMES
  "lab_sheet_url": "...",                                // once the optional sheet is published
  "cybok": [ { "ka": "HF", "topic": "Awareness and Education", "keywords": ["..."] } ]   // table in section 4
}
```

In the scenario: `"disableAttacks": true`, `"creditsTheme": "cyber"`, a `missionConclusion` aim
(`defend`) with `"conclusionScreen": { "type": "end_screen" }` and `"concludeRequires": {}` (declared
deliberately: the lab has no large technical work to verify server-side).

### Scenario schema: where each block lives

Everything lives under the one top-level `social` key (`00` §11), so the validator learns one name
and the browser reads one object. Objects carry only a pointer in `minigameData`.

| Block (`social.*`) | Owner doc | Object pointer (`minigameData`) |
|--------------------|-----------|---------------------------------|
| `intelFacts`, `templates` | 00 | none |
| `characters` (`pierce`, `lord`, `dev`) | 00 §8, §9 | none; channel records are ordinary NPC records |
| `mailClient` (accounts, mailboxes, contacts, seeded inbox, payload kit) | 01 | mail workstation: `mailboxId`, `accountIds` |
| `osint` | 02 | OSINT workstation: the site set id |
| `intelBoard` (`readinessSlots`, `scopeNote`, people, defender relabel) | 03 | case-file board and SOC board: `boardMode` |
| `phishTargets` (`hampshire`, `pierce`, `lord`) | 04 | none; selected by the mail UI |
| `triageSets` | 05 | triage workstation: `triageSetId` |
| `landingPages` | 07 | page-builder workstation: `landingPageId` |
| `pretextNpcs` (`service_desk_call`) | 06 | desk phone: `callId` |
| `engagement` | 10 | report workstation: none (reads `social.engagement`) |

New NPC fields (`social.characters` entries, `channels`, `syncedVars`, `thresholds`, headless email
records) are 00's. The validator work this implies is in section 6.

### Data volume

| Content | Owner doc | Volume |
|---------|-----------|--------|
| `globalVariables`, `objectives`, rooms, doors, keys, NPC placement | this doc | one `scenario.json.erb` |
| `mailClient` (two accounts, contacts, seeded inbox, payload kit) | 01 | ~6 benign seeded messages for realism, plus the triage set |
| `osint` sites (company, careers, three social profiles, a PDF with metadata, an archived org chart, a search list) and `intelFacts` | 02, 00 §1 | 14 contract facts (11 found by browsing, 3 granted by the call) plus 1 stale |
| `intelBoard` (title, `scopeNote`, people, readiness slots, defender relabel text) | 03 | one block, four modes |
| `templates` and `phishTargets` ×3 | 04, 00 §10 | 3 targets, about 4 to 6 templates per target in `templateSets`, blank-value lists tagged distinctive or generic, replies, `redFlagStrings`, hints |
| Landing-page rules, look-alike domain options, tells | 07 | 1 page model, ~6 tells |
| Pretext call: `pretextNpcs[service_desk_call]` and Dev's phone story | 06 §4.8 | 1 call, 2 asks, 2 to 3 pretext lines |
| Triage set (8 messages with auth results, 2 of them `playerSent`) | 05 | 6 authored messages |
| RoE sheet text, scope cards, plan picks, report findings, defender mitigations | this doc | text + 3 findings + 4 mitigation blocks |
| Ink | this doc, 06, 00 §10 | 7 files (below) |
| Concept cards | this doc | 3 tool `notes` objects (the SPF/DKIM/DMARC explainers are 05's glossary) |

**Ink files** (the mail stories need `on_email` knots and the `email_*` and `<character>_influence`
VARs, `00` §10; each declares its `se_intel_*` and synced VARs, `00` §5, §9):

| File | Channel | Content |
|------|---------|---------|
| `ruth.ink` | person | Briefing, key hand-overs (`#give_item`), stage check-ins, debrief on the report |
| `ruth_phone.ink` | phone | Hint hub: three rungs per stage, gated on progress globals |
| `whitlock.ink` | person | The short authorisation scene |
| `tomasz.ink` | person | Triage briefing and the closing debrief |
| `dev_service_desk.ink` | phone | The pretext call (06 §4.8), `pretext_say` and `pretext_ask` |
| `pierce_mail.ink` | email, headless | `on_email`: Pierce's reply and influence changes |
| `lord_mail.ink` | email, headless | `on_email`: Sofia's reply and influence changes |

Hampshire replies from her target's authored `replies` (no ink story, no `character`).

### Authored fragments owned by this doc

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
  "plan": {
    "objectives": [ { "id": "disrupt_payroll", "correct": false, "why": "RoE section 3 bars disruption." } ],
    "measures":   [ "sent", "opened", "clicked", "submitted", "reported", "callOutcome" ]
  },
  "report": {
    "findings": [
      { "id": "spoofed_colleague", "text": "Finance acted on mail spoofing a colleague",
        "rootCauses": [ { "id": "no_banner_dmarc_none", "correct": true,  "why": "..." },
                        { "id": "staff_carelessness",   "correct": false, "blame": true,
                          "why": "Blames people; the control gap is the cause." } ],
        "controls":   [ { "id": "banner_dmarc_enforce", "correct": true, "why": "..." } ] }
    ]
  },
  "defender": {
    "factMitigations": [ { "intel": "email_pattern",
                           "options": [ { "id": "remove_list", "good": true, "why": "..." } ] } ]
  }
}
```

All feedback strings are authored and linted for empty interpolation (04 N3). The `report` and
`defender` blocks follow the "right answer plus a reason for each wrong one" shape of the 04
factors, so one validator rule covers them (section 6, N7).

**Optional lab sheet.** A short "practical"-mode sheet (concept recap per stage, hints) may be
published via `HacktivityLabSheets` and linked from `mission.json`. The game must be completable
without it (all learning is in-game).

## 6. Engine wiring

### Components used

| Stage | Component | Start interaction | Completion |
|-------|-----------|-------------------|------------|
| 0, 1 | Intel board (03), `scope` then `plan` mode | `case-file` object | `minigame_completed` → `set_global` (`roe_signed`, `plan_done`) |
| 2 | OSINT browser (02) | recon workstation | intel globals → board; `osint_done` when all three targets are ready |
| 3, 5 | Mail client (01) + rules engine (04) | mail workstation | `minigame_completed {targetId, landed, outcome, redFlags, tells}` (`00` §3) → the target's `phish_<id>_landed` |
| 4 | Landing-page builder (07) | page-builder workstation | `landing_payroll_login_built` |
| 5 | Pretext dialogue (06) on `phone-chat` | desk phone (`callId`) | `pretext_call_done` and the per-call globals (06 §6) |
| 6 | Report builder (new, N1) | report workstation | `report_filed` |
| 7 | Triage (05); board `defender` mode (03) | triage workstation; SOC board | `triage_done`; `profile_done` |

Registration, starters and completion follow the pattern cited in 01 (`registerScene` in
`minigames/index.js`, a starter in `systems/minigame-starters.js`, `base-minigame.js` emitting
`minigame_completed`, bridging with `set_global` or an objective's `onComplete.setGlobal`). Ruth's
`eventMappings` on `global_variable_changed:<name>` complete the `manual` tasks and give keys. A
global cannot complete a task by itself; only the mapping does (README engine table).

### Requests of other docs

This doc assumes the following. Each is a request, so a later change in that doc is reconciled here.

| Doc | Request |
|-----|---------|
| `00` | (1) Add the stale fact `old_org_chart` (subject `company`, source the archived org chart on the public documents page) providing a `stale` name value for the departed finance lead, and list `se_intel_old_org_chart`. (2) `lord_trusts_portal_sender` provides a `name` and an `address` value for the portal's notification sender, and `lord`'s `primedFor.trusts` names that sender. (3) Confirm the `hampshire` and `lord` target records listed under `04` |
| `01` | Accounts `guest` (given, spoofing) and `freemail` (created, with the authored address menu). A persisted send log with the counts the report needs, and the fixed "own account" From template (no blanks) used when the account cannot spoof |
| `02` | The derive step is a pick of the pattern then a pick of a third address from candidates; two metadata prompts as picked answers; the archived org chart; a search list to pick from, with no typed query and no ambiguous result; three concept cards |
| `03` | Modes `scope`, `plan`, `recon`, `defender` on `intelBoard`, one completion payload per mode: `scope` → `roe_signed`, `plan` → `plan_done`, `defender` → `profile_done`, `recon` is a viewer that sets `target_ready_<id>`. The case-file board advances `scope` → `plan` → `recon` from the progress globals, so one object serves three stages. `defender` mode supports a choose-one-mitigation interaction per exposed fact, with a reason |
| `04` | A `hampshire` record (open inbox, `trusts: ["*"]`, distinctive `cv`, expected attachment `document`, `replies` only, no `character`); `pierce` and `lord` with `character`; `lord`'s `trusts` entry for the portal sender; `templateSets` per target; the lab does not use `lord_payslip_date_known`, because the date is an ordinary fact (`se_intel_lord_payslip_date`) |
| `05` | A lab set of eight messages under `analyst` with `setGlobalPrefix: "triage_"` (so `triage_done` is written); header panel and glossary open; a message kind `playerSent` that reads the persisted sent record (`fromAccount`, `headerFrom`, `tells`) and takes truth from `tells`, included only when `tells` is non-empty so F is at least 1; a `domainFrom: "landing_page"` substitution on an authored message, with an authored `auth` result for each of the four menu domains (all pass); parallel-form balance checks (05 N5) skip `playerSent` messages. The lab uses no header quiz and no rollout simulation |
| `06` | Matches §4.8: character `dev`, record `dev_service_desk`, call `service_desk_call`, outputs as in stage 5. Spoken reactions are fixed strings per held value (06 §4.4), so the audio plan voices only fixed lines |
| `07` | Page id `payroll_login`, global `landing_payroll_login_built` (`landing_<id>_built`); the persisted page record exposes the chosen domain id for 05; the four menu domains each carry an authored `auth` row for 05; no input from globals to the page score |

### New engine work specific to this scenario

| # | Item | Notes |
|---|------|-------|
| N1 | **Engagement report builder** (`minigames/engagement-report/`): results panel, findings pairing with the blame option, emits `report_filed` | Small; reuses overlay chrome and the right/wrong+why pattern from 04. Reads `social.engagement.report` and the counts from 01's send log |
| N2 | **Metrics collection**: 01 records sends, failures and outcomes per target in `mailState`; the report reads them | Extend 01's persisted state rather than add a store |
| N3 | **Board modes** `scope` and `plan` with the `engagement` data (scope cards, objective and measure picks) | Owned by 03; this doc supplies the data shapes in section 5 |
| N4 | **Defender-mode mitigation picks** | Owned by 03; no indicator tagging in this slice |
| N5 | Door and key gating use existing locks and `#give_item`; **no new engine work** | Key locks carry `keyPins` |
| N6 | Non-VM mission configuration: `secgen_scenario: null` and a `collection` label | `Mission#requires_vms?` already supports it; `db/seeds.rb` lines 67 to 71 read `secgen_scenario` and `collection` |
| N7 | **Validator work** (`scripts/validate_scenario.rb`, `scripts/scenario-schema.json`, `scripts/minigame-data-schemas.json`) | `known_top_level` (lines 246 to 251) gains `social`; `known_npc_fields` and `known_behavior_fields` gain only what 00 §8 and §9 add; `minigame-data-schemas.json` gains an entry per new object type (`boardMode`, `mailboxId` and `accountIds`, `triageSetId`, `landingPageId`, `callId`); each new object type needs an `assets/objects/<type>.png` sprite (the validator's sprite-per-type check); a lint that `engagement.report` and `engagement.defender` use the right-answer-plus-reason shape; the promised lints from 00 §12 S11, 04 N3, 05 N5, 06 N10 and 07 |
| N8 | **Ink externals** (`se_influence`, `pretext_say`, `pretext_ask`) bind in `InkEngine` (`00` S1) | The authoring guide says "use synced-global `VAR`s, not `EXTERNAL` functions" because the engine binds only six read-only externals and an unbound one throws (`ink-engine.js` catches only the bind failure). When S1 lands, amend that rule in `README_scenario_design.md`. Also needed: bind in person-chat, phone-chat and the headless mail runner; add stubs to `scripts/ink_runtime_check/voicelines.mjs`, `inkcheck.js` and `reopencheck.mjs`; a validator rule that every `EXTERNAL` a story declares is bound for every channel the character supports |

The other engine items the lab depends on (S1 to S11 in `00` §12, the OSINT, board, mail, pretext,
triage and landing-page work in 01 to 07, the bundled sans-serif) are in the README's consolidated
table. Nothing here needs a VM, the flag-station or the vm-launcher.

## 7. Reuse and tuning

- **Awareness (11):** the same data, shortened. Drop stage 0's legal detail to a one-card consent,
  keep one OSINT layer, one easy target, no landing page, no header reading; defend becomes
  spot-the-phish only. Targets, rules and strings are the same files with fewer factors required and
  the meter on throughout.
- **Eldritch Hacker:** any single stage is liftable (OSINT → phish → call). The lab's `phishTargets`
  and `osint` blocks are the templates. A `found` account and phone identities (`00` §10a) belong
  there, not here.
- **Student tuning knobs:** red-flag meter on or off per target; required factors per target; hint
  verbosity; whether the triage includes the forwarder case (the hardest concept) or leaves it out;
  which of the cut-order items to restore for a longer slot.
- **Cohort reuse:** a second fictional company (different pattern, e.g. `firstname.surname@`) swaps
  in as data, so a re-sit or a second cohort does not share answers.

## 8. Assets (PixelLab-first, none generated now)

- Characters needing the full set (sprite, 400x400 chat background, `spriteTalk`, `spriteVisemes`,
  `avatar`, per the v2 sheet rule in `README_scenario_design.md`): Ruth, Whitlock, Tomasz, and Dev
  (phone only, so portrait and visemes with no walk sprite). Targets Chris Hampshire, Melanie Pierce
  and Sofia Lord speak only in email text, so an `avatar` is enough for the board cards and reply
  headers; they do not walk. Vary ethnicity and age across the cast (standing preference).
- Rooms: Engagement Office, Recon Room, Operations Room, Blue Team Room; orthogonal top-down props:
  desk, workstation, whiteboard/board, desk phone, SOC wall of screens.
- Item sprites: RoE sheet, three keys (Recon, Operations, Blue Team), concept-card notes.
- UI art owned by 01, 02, 03, 05, 07; this doc adds only the report panel (results table, finding
  cards, tick and cross).
- Audio: voice for Ruth, Dev and Tomasz, fixed lines only (the TTS cache is keyed on text, so no
  printed variables in a voiced line; Dev's reactions are fixed strings per held value, 06 §4.4).
  Music reuses an existing office track.

## 9. Open questions

Defaults are taken so nothing blocks; the same list is in `README.md`.

- OQ1: **Retries as rehearsal.** Realistically a failed phish alerts the target. Default: retries are
  free and unlimited, framed as rehearsal reviewed by Ruth, with failed sends counted in the report.
  Alternative: a "heat" limit that forces a hint.
- OQ2: **Assessment and Hacktivity scoring (open, not decided).** The platform records only the
  task/aim completion share (section 4). A weighted rubric by outcome, hint and attempt counts and a
  tutor view need Hacktivity work: either a hand-applied rubric over the completion share, or a
  per-student report built from `globalVariables` counters. Which, and who builds it?
- OQ3: **Length.** Target one session of about 75 minutes (decided; section 4 gives the budget and cut
  order). Run a timed blind playtest, as the Tesseract lab did, before fixing the figures.
- OQ4: **Include the forwarder/SPF-breaks message?** Default yes (it is the correct, commonly missed
  nuance); drop it for a first-year cohort.
- OQ5: **Lab sheet.** Publish an optional practical-mode sheet (default yes, after the game exists)
  or keep it fully in-game.
- OQ6: **Legal framing by jurisdiction.** Default names the UK Computer Misuse Act 1990 with a generic
  "equivalent laws elsewhere" line; a module leader may want local wording.
- OQ7: **Cast naming.** Cast follows `00` §1; confirm or rename there only.
- OQ8: **`collection` label.** Default: reuse `escape_room`, the non-VM lab precedent
  (`lab_tesseract_trials`), so no platform change. Alternative: add a collection for this strand.
- OQ9: **Extension content.** If the playtest shows spare time, restore in this order: indicator
  tagging in the profile, a stand-alone header quiz, the DMARC rollout simulation. Each needs its
  data shape specified in 05 or 03 first; none is built in this slice.
