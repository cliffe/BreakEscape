# 10 — Lab: Social Engineering (`lab_social_engineering`)

Status: plan. The scenario that proves the suite: it chains 01–07 into one engagement that fits a
single session of about 75 minutes. It is the first shippable SE product and takes the module's one
technical-lab slot. Browser-only, no VMs. Its systems later become the core of SAFETYNET: Eldritch
Hacker (see `README.md`).

`00_data_contract.md` is authoritative for ids, schemas and the engine items (S1 to S14); §13 there
lists the values several docs must match. Where this doc leans on 01 to 07 it cites the section of
00 that settles the value (section 6, "What this doc relies on"). The pretext score is the NPC's
influence (`00` §8), carried across channels (`00` §9). Email replies come from the character's mail
story (`00` §10).

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
| 2 OSINT | Ch. 4–6 | Business, social-media, document and people OSINT; reading a pattern lookup; picking the metadata field that gives something away | OSINT browser (02) → board (03) |
| 3 Spear-phish, two rounds | Ch. 7 | Open inboxes, sender trust, addressing, pretext relevance, attachment fit, sender authentication (advisory) | mail client (01) + rules (04) |
| 4 Landing page | Ch. 8 | How a credential-harvest page convinces, and the tells a defender checks | landing-page builder (07) |
| 5 Pretext call, then the hard phish | Ch. 1, App. D | Pretexting, elicitation, how influence is won and lost; a link-bearing phish | pretext dialogue (06) + mail (01, 04) |
| 6 Metrics & report | Ch. 9 | What to measure, how to report findings without blaming staff | report builder (new, section 6) |
| 7 Defender flip | Ch. 10–12 | Triage, reading authentication results, a short threat-intel profile | triage (05) + board `defender` mode (03) |

**Learning outcomes.** These are what the objectives in section 4 evidence.

1. Define an engagement scope and state why an unauthorised version of the same actions is an offence.
2. Identify a company's email-address convention from public evidence (a staff directory and a
   Hunter-style lookup) and use it to predict an address.
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
framework that automates such modules). The student never runs them; the OSINT browser shows what
their output *looks like* and the lab asks what it means. The landing-page and mail components judge
reasoning, and produce no runnable phishing kit, spoofing recipe or harvesting code.

## 2. Player goal in their own words

"I've been hired to test Ledgerwell's staff. Find out about them, get three people to take the
bait, learn how the staff payroll portal works by phone, write it up, and then switch to the other
side and show the company how they should have caught me."

## 3. The loop (stage by stage)

### Setting and cast (fictional throughout)

The student plays a junior consultant at **Tarnside Assurance**, a security consultancy, on a
contracted engagement for **Ledgerwell Ltd**, a 40-person accountancy software firm. Both are
invented; every person, domain (`ledgerwell.example`) and profile is fictional, and no real staff
are profiled. Cast ids follow `00` §1.

| Who | Role in the lab | How the student meets them |
|-----|-----------------|----------------------------|
| **Ruth Adeyemi** | Tarnside engagement lead: briefs, hands over keys, runs the support hub (progress-gated, as Agent HaX is in Licence to Hack) | Person NPC in the Engagement Office (`ruth`); phone contact `ruth_phone` for hints from any room |
| **Gareth Fairbairn** | Ledgerwell managing director, the signing client | Person NPC in the Engagement Office, one short scene once the sheet is signed |
| **Chris Hampshire** (`hampshire`, Careers/HR) | Target 1, easy: the open `careers@` inbox accepts CVs from anyone | Email only; data-only target (no `character`, no ink story): the reply is a text job from the target's authored `replies` |
| **Melanie Pierce** (`pierce`, finance, new starter) | Target 2, medium: trusts colleague Jed Baker, primed for a Friday balance sheet (the worked example in 04) | Email only; `character: pierce`, mail story `pierce_mail` |
| **Sofia Lord** (`lord`, intern) | Target 3, hard: new to the firm, uses the staff payroll portal, cautious about links | Email only; `character: lord`, mail story `lord_mail` |
| **Dev** (`dev`, service desk) | The pretext-call target (06 §4.8): supports the staff portals | Phone only, record `dev_service_desk`; not an email target |
| **Tomasz** (Ledgerwell security lead) | Defender half only: sets the triage exercise and gives the closing debrief | Person NPC in the Blue Team Room |

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
| **Engagement Office** (start, hub) | Ruth; Fairbairn; three `case-file` objects, one per board mode: the **Rules of Engagement** sheet on the desk (`scope`), the **planning whiteboard** (`plan`) and the **case-file board** (`recon`); the report workstation | 03 board; report builder |
| **Recon Room** | OSINT workstation | 02 |
| **Operations Room** | **Mail workstation** (`mail_terminal`); **page-builder workstation**; a **desk phone** | 01 (+04); 07; 06 |
| **Blue Team Room** | **Triage workstation**; the SOC board (`case-file`, `defender` mode); Tomasz | 05; 03 |

Doors are plain key locks. Each lock carries `keyPins`, and each key item Ruth hands over carries
matching `keyPins` and `opens_lock` (`README_scenario_design.md`, key checklist). Ruth also gives the
player a starting phone item (`startItemsInInventory` with `npcIds: ["ruth_phone"]`), which is how her
hint hub is reachable from every room. Ruth hands over each key (`#give_item`, the
existing pattern) when the previous aim completes, so the objectives enforce the sequence and the
player sees a physical reason to go back to her. The Blue Team door stays locked until the report is
filed (the narrative flip: you leave the red cell and walk into the client's SOC seat).

Every overlay in the lab sets `requiresKeyboardInput: true` and draws its own Close control (`00` §6),
so world keys are suspended while one is open.

### Stage 0 — Authorisation (Engagement Office; Ch. 2)

Ruth briefs. At the RoE sheet (a `case-file` object in `scope` mode) the student reads the
**Rules of Engagement** (the sheet's text is shown first in the mode) and does two things with
deterministic feedback:

- *Sort the scope cards (step `roe_scope_done`).* Five cards: phish named staff by work email (in);
  phish staff at their personal addresses (out); call the published service-desk line (in); tailgate
  into the building (out for this contract, physical is excluded); post to Ledgerwell's real
  customers (out). A wrong placement is explained from the document ("§4 excludes personal
  accounts") and the card goes back.
- *Answer the stop-rule question (step `roe_stoprule_done`).* "What do you do if you find a real
  compromise or a real person in distress?" A question card with one right answer (stop and call the
  emergency contact on the sheet) and a reason for each wrong one.

When both steps are done the mode sets `roe_signed`, Fairbairn's authorisation is "signed", and the
rule is stated once, plainly: "The same actions without this sheet are offences (the Computer Misuse
Act 1990 in the UK, and equivalent laws elsewhere)." **This beat is the ethics gate (book Ch. 2);
it is the first aim and cannot be skipped.**

### Stage 1 — Scope & plan (planning whiteboard, `plan` mode; Ch. 3)

At the planning whiteboard the student turns the brief into a plan with two picks. Both are
single-select (`03`): each list has exactly one right option, and every wrong one carries a reason.

1. **Objective** (step `plan_objective_done`): pick the one objective that fits the brief. The right
   option is "find out how far email and a phone pretext get against Ledgerwell's finance, HR and
   service-desk staff, and report the gaps". Wrong options include "disrupt payroll" (rejected with
   the rules-of-engagement reason) and "collect staff passwords" (the engagement keeps nobody's
   password: a submitted page is simulated, and the sign-in it hands over is a game note).
2. **Success measure** (step `plan_measures_done`): pick the one measure the report will be built
   around. The right option is "how far each attempt gets", which the lab can record: messages sent,
   landed and failed, page visits and submissions, and the call outcome. The wrong options are "which
   named staff fell for it" (a blame measure, rejected with the Ch. 9 reason), "passwords collected"
   (the lab records submissions, not what was submitted) and "did staff report us" (explained as the measure a live test would add
   and this lab cannot observe). The point is that you decide the metrics *before* you send anything.

When both steps are done the mode sets `plan_done`; Ruth gives the Recon Room key. The case-file board
already shows the three target cards with empty readiness slots ("You still don't know ..."), so the
student can see what they must find.

### Stage 2 — OSINT (Recon Room; Ch. 4–6)

At the OSINT workstation (02) the student reads, selects and picks. Nothing is typed. Selecting the
block that carries a fact collects it: `grantFact` sets its `se_intel_<id>` global, adds a note, and
runs `evaluateReadiness` (`00` §4, §5), which sets `target_ready_<id>` and `osint_done` at the moment
the last fact lands, whether or not the board is ever opened. The board is a place to look at the
result, not a step in the chain. The contract facts are in `00` §1: 11 of the 14 are found here, and
the other three (`lord_portal_name`, `lord_payslip_date`, `lord_trusts_portal_sender`) come from the
call in stage 5. Two further facts are stale on purpose.

- **Company site.** The team page lists every staff member with their published address; seeing the
  addresses grants nothing. Selecting Melanie Pierce's row gives `pierce_role` and selecting Sofia
  Lord's row gives `lord_intern`. A team note ("Jed: I'll send Mel the Q3 balance sheet on Friday")
  gives `pierce_expects_balance_sheet`. The careers pages give `hampshire_careers`, `tech_stack` and
  `careers_attachment` (".odt and .docx only"). An archived org chart on the company site's archive
  page is out of date (it dates from 2019): it shows Jed Baker as the manager and seats interns
  under Accounts. Selecting it gives the stale fact `old_org_chart` (shown under "Old or unverified"
  on the board's company panel), which offers a wrong manager and a wrong team later.
- **Tools panel.** The student picks lookups from a short list; nothing is typed. The Hunter lookup
  on `ledgerwell.example` returns the pattern (`first-initial.surname@`) and grants
  `email_pattern`. A name search for "J. Baker" returns two entries, Jed Baker of Ledgerwell and a
  plumber in Leeds. Choosing the right one grants nothing and says why it matched; choosing the
  namesake grants the stale fact `baker_namesake` (also under "Old or unverified"), a sender name Pierce does not trust. The four in-browser concept
  cards sit beside what they model: `tool_hunter` (the Hunter lookup), `tool_harvester` (the name
  search), `tool_recon` and `tool_exiftool` (the document properties panel).
- **Social media.** Pierce's "first week in finance, Jed's showing me the ropes" (`pierce_trusts_jed`);
  Hampshire's "so many CVs to get through before Friday" (`hampshire_cv_backlog`, visible once the
  careers inbox block on the careers page has been selected, because the post's `showIf` reads the fact
  `hampshire_careers` that selecting the block grants; a student who only reads the page never sees it,
  so Ruth's hint rungs for this stage point back at the careers inbox); Sofia Lord's "sorting my payslip on the staff portal" (`lord_portal`:
  she uses *a* staff portal, no name). Teaches how ordinary posts become pretext material.
- **Public documents.** A published PDF with a **properties panel**. The student selects the field
  that gives something away: the author field, `mpierce`, grants `username_convention`, and the
  panel says why it matters (usernames are guessable from names, so a login page asks for something
  the attacker already has; the path names the machine's profile layout). Selecting the software or
  path rows explains what each discloses and grants nothing.

Ruth's check-in is a *board* check, not a quiz. When `osint_done` is set and the student has also
found the document's username convention, Ruth says so and hands over the Operations key. (The
metadata is not in any target's readiness slot, so Ruth asks for it herself: it is learning outcome 3
and a required task.) Readiness follows `00` §4: Pierce needs her role, who she trusts plus the
pattern, and what she expects; Hampshire needs the open inbox, the file type and the backlog; Lord
needs only `lord_portal` and `lord_intern`. The portal name, the portal sender and the payslip date
arrive in stage 5 and are send-time prerequisites for her phish, never a reason to wait at this door.
Missing a fact never blocks anything but the door; the board's "still missing" panel and Ruth's hints
point at the source layer.

### Stage 3 — Spear-phish, rounds 1 and 2 (Operations Room; Ch. 7)

At the mail workstation (01) the student composes to **Hampshire**, then **Pierce**, from templates
with blanks (`00` §10). Every blank is filled from a fact the student holds, so a blank offers only
what they have found, plus the occasional `stale` entry. The rules engine (04) judges each send and
returns the full factor checklist, not the first failure. The mail client does not complete on a
send: the overlay stays open for the checklist, and it completes only when the player closes it. The
reply arrives into the mailbox after the target's reply delay (15 seconds for each of the three lab targets, Hampshire included), and
every task keys on `phish_<id>_landed`, never on the client closing.

The mail client has two accounts here (`00` §10a):

| Account | Kind | Use |
|---------|------|-----|
| `guest` ("Operator", `guest@workstation.example`) | given | Rounds 2 and 3: the target offers `from_named`, so the From blanks are free and the student can claim to be Jed or the portal |
| `freemail` | created, `unlockedBy: acct_freemail` | Round 1, where Hampshire offers only `from_own`, so the From is forced to the account's own name and address and nothing is spoofed: the student picks one of two authored addresses from the `createMenu` (which sets `acct_freemail_choice` and `acct_freemail`) |

The lab declares exactly these two accounts. It defines no `found` account: `jed_pc` and its `jed`
mailbox are Eldritch Hacker data (`00` §10a), so the lab's `playerSentAuth` has a row for `guest`, a row
for `freemail` and one for each of the six menu domains, and no others. `freemail` is declared with
`spoofsFrom: false` in the lab, so its From is always its own name and address; only `guest` can claim to
be Jed or the portal, which is why rounds 2 and 3 are sent from `guest`. A `freemail` send can still
raise the account-independent tells (for Lord, `urgencyCalibrated`, and `linkCredible` when a page is
attached), but never the spoof tells `senderTrust` and `senderAuth`. Stage 7 replays the latest record
to the target whose tells include `senderTrust` or `senderAuth` (and only if none does, the latest with
any tell), so it is the student's `guest` send even if a later `freemail` retry exists (05 "Source").

| Round | Target | Account | Required factors (04) | What the round teaches |
|-------|--------|---------|-----------------------|------------------------|
| 1 | Hampshire | `freemail` | `senderTrust`, `pretextRelevant`, `attachmentPlausible` | An open inbox trusts any sender (`trusts: ["*"]`). The From part is the blank-free `from_own` template, so the header From is the account's own name and address whichever account is used. She has no `addressedAs` and the greeting is the generic one, so `addressedTo` is not a factor. Her pretext part offers two templates: an applicant pretext (`pretext_apply`, which implies the document `cv`; `careers_attachment` provides it) and a general enquiry (`pretext_enquiry`), which is the credible wrong one for an application desk and fails `pretextRelevant` with her authored line. The applicant pretext and a CV from the kit (kind `document`) are what land. Red-flag meter **on** |
| 2 | Pierce | `guest` | `senderTrust`, `addressedTo`, `pretextRelevant`, `attachmentPlausible` | The From line is only a label: the student pairs a display name with an address (`baker_full`, `baker_address`), and nothing but the checklist says whether they belong together. Trust is borrowed from a known contact. Needs the Jed spoof and the Friday balance-sheet story, both from OSINT. Her `addressedAs` forms come from `pierce_role` (first, formal) and the Q3 note (short). Meter **off** |

Hampshire has no ink story, so her reply is a **text job** (`00` §10 "Timing and delivery"): after the
delay the engine appends her authored `replies.landed` (or the canonical fail line for the first
failed factor) to the mailbox of the account used, and sets `phish_hampshire_landed` only when the
message landed. Pierce's reply is written by `pierce_mail` (its `on_email` knot), which sets
`phish_pierce_landed`; one owner per target, never both. The checklist shows at once for both.
Each failure shows exactly which factor failed, a failed send costs Pierce or Lord 10 influence (04;
Hampshire has no character, so nothing moves for her), and the hint ladder starts after two misses.
Where a blank needs evidence the student has not found, the blank is empty and Send is blocked with a
neutral line ("A blank needs evidence you haven't found yet", defined in 04, used by 01). The line never
names or hints at the missing value, so the judged checklist never reports a missing-evidence gap; the
hint ladder and the board's "still missing" panel do that work. Pierce's and Lord's influence is bounded at -40
and carries no report or lockout (section 5, "Influence"), so a run of bad sends only moves the bar.

**Opening, subject and retries.** The composer's Subject pick matters because a target has to open the
message first (`00` §2). A trusted-looking sender gets it opened (the rounds 2 and 3 spoofs do); a
`freemail` retry to Pierce or Lord is a stranger, so it opens only if the subject's topic is one the
target cares about (Pierce `finance`, Lord `payroll`). The checklist's first row says whether the
message would be opened, and the character's reply, when there is one, says in their own words why
they did not trust it, which is the clue to who this person is. Each closed target also has a
plausible wrong template in the pretext part (Pierce's overdue supplier invoice, Lord's password
notice), so a send is not guaranteed to land. Hampshire's open inbox excuses her from the subject
rule only; she too offers a wrong pretext (the general enquiry), so the pretext part is a choice in
every round. **Retries are free and unlimited**, framed as rehearsal
that Ruth reviews. A failed send moves the bar and nothing else, failed sends are counted in the report,
and there is no heat limit. The lab runs in training mode (`checklistTiming: "onSend"`).

**The wrong-account turn.** The student creates `freemail` for round 1, so it is live when rounds 2
and 3 start, and a send to Pierce or Lord from it cannot land (it cannot spoof, so `senderTrust`
fails). The composer's read-only From line for such an account names the way out ("This account can
only send as itself. Switch account to send as someone else"), and the last rung of Pierce's and
Lord's hint ladders (04 `hints`) and of Ruth's stage 3 hub rungs says the same: "This account can
only send as itself. The Operator account lets you choose the sender." The ladder therefore ends in
a near-explicit pointer for the most likely wrong turn.

**Reply features not used.** The lab's mail stories end each reply with no choices, no
`#compose_reply` and no `#mail_later`, and a thread's `expects` is never set, so no judged reply task
exists beyond the 22 listed and the budget holds. Those features belong to Eldritch Hacker and the
awareness product.

**`senderAuth` on the attacker side.** From round 1 the checklist carries an advisory line under the
factors. In round 1 it says "Sent as your own address, so there is nothing to spoof and nothing to
fail" (the line is account-neutral, because Hampshire is mailed from whichever account is chosen). In round 2 Pierce's authored `factorStrings.senderAuth` line
says the spoofed `j.baker@` address fails the domain's alignment check and that, because
Ledgerwell publishes its DMARC policy as `p=none`, it is still delivered. It never changes the
verdict. It plants the question stage 7 answers: why was this flagged, and why can a message pass all
three checks and still be a phish.

### Stage 4 — Landing page (Operations Room; Ch. 8)

At the page-builder workstation (07, `landingPageId: payroll_login`) the student assembles a
credential-harvest *page model* for Sofia Lord's phish: a look-alike of **her staff payroll portal**.
They pick the look-alike domain from the authored six-domain menu (`d_unrelated`, `d_letter`,
`d_word`, `d_sub`, `d_vv`, `d_homo`), the logo, the wording, the form fields and the padlock (07's
seven choices). The builder judges the choices against rules (domain tier and homoglyph tells, brand
and wording match, whether a padlock is shown and what it does and does not prove). **It builds a
scored model of a page, never a working page or form handler** (07 owns that boundary). Feedback
names each tell a defender could use. A page that falls short of the threshold can still be
attached ("attach anyway"), and `linkCredible` then fails at send time with the reason.

On attach the builder saves the page record in `se_landing_pages.payroll_login` (`00` §11a) and sets
`landing_payroll_login_built` and `landing_payroll_login_domain` (the chosen domain id). The link
the mail client offers is the payload-kit item `kit_payroll_page`, and only for targets in the page's
`targets` map: the lab's page lists `lord` alone, so the composer offers "build/attach page" for Sofia
and never for Hampshire or Pierce.

If Sofia signs in on a page that meets its threshold and her email landed, the mail client adds the page's
authored note to the notes: a note that Sofia's staff portal sign-in was captured (the account name only; no
password value; `07` §5, N11). Nothing in the lab depends on it, because
the lab ships no found accounts (`00` §10a).

The page does not depend on the call, and the call does not change the page's score: 07 reads no
globals. Ruth suggests calling Dev first because what he says sharpens the wording the student will
want, but either order completes the aim. After the round 3 send the student can reopen the page at
the builder as the victim (07's step 6, "Inspect your own page") and find the giveaways. Per 07, Inspect is
available once any send is recorded, and a below-threshold page gives a victim record of visited and
noticed whether or not the email lands, so Inspect is reachable even after "attach anyway" on a page that
then failed `linkCredible`. The step is
not a required task; Ruth points to it, and stage 7's triage covers the same tells from the reader's
side.

### Stage 5 — Pretext call, then the hard phish (Operations Room; Ch. 1, App. D)

Sofia is cautious, and the page alone is not enough: a "your payslip is ready" notice is only
plausible if the student knows what the real portal is called, who its notices come from, and when
payslips are released. The social post gave only "a staff portal". The student gets the rest by
calling **Dev on the service desk** from the desk phone (`callId: service_desk_call`). The call is
`pretextNpcs[service_desk_call]` (06 §4.8) and runs on `phone-chat` with `pretext-prep` before it and
the debrief screen after it.

- **Pretext card.** The student picks the opening line from templates: "I'm the new intern's buddy,
  she can't find her first payslip on the portal" (blanks: the intern's name from `lord_intern`, the
  team from `lord_intern`). Dev checks the intern's name and team (identity grade). He accepts either
  name form (`lord_first` or `lord_full`) and the team `finance`. The stale org chart offers the
  team `accounts`, which Dev catches.
- **Dev's influence bar** (`00` §8) is in the phone-chat header, with threshold icons for wary (-40),
  refuses (-50) and reports (-70). Dev starts at -10 (`dev_influence`). Claims he can check and that
  hold raise it, and claims he can check and that are wrong lower it a lot (06's mechanics; Dev's
  authored data is one opening line, `open_buddy`, plus the two asks). The tells panel shows the delta,
  the reason and the line after every turn.
- **Two asks.** `portal_name` (floor -30, no verification) grants `lord_portal_name` and
  `lord_trusts_portal_sender`: the portal's name, how its notices read and who they come from.
  `payslip_date` (pressure -10, floor -20, verification: the intern's name) grants
  `lord_payslip_date`. Grants set `se_intel_*` through the shared writer, so the board and 04 see
  them at once.
- **Outputs.** `pretext_call_done` is set by the first granted ask, because both asks carry
  `setGlobal: { pretext_call_done: true }` in their `grants` (06 §4.8). It is therefore true however
  the call ends (granted then closed, granted then reported, granted then walked away), and it stays
  set. The outcome global only records how the latest call ended. `pretext_call_reported` is set when
  a call ends in a report. The desk phone can start a new call after
  any outcome while asks remain: each call begins at Dev's current influence, asks whose facts the
  student already holds are not offered again, per-ask grants accumulate, and
  `pretext_service_desk_call_outcome` and `_lowest` are overwritten by the latest call (06). The engine
  also writes `_state`; the `reports` threshold sets `dev_reported`, which stays set. All are declared in
  `globalVariables`, none imported.
- **A failed call never dead-ends the path.** Dev's `reports` threshold has three effects: it sets
  `dev_reported`, ends the call "to check with his manager", and starts a channel-scoped lockout of
  two real minutes (`00` §8: the clock is real elapsed time, not scaled by any game rate, and it
  survives a reload). A forced report, from the refusal limit or a failed verification, runs the same
  effects at whatever influence Dev has reached, so the lockout and the reset always follow a report.
  When the two minutes pass the engine sets him back to `recoverTo` -30 and clears the latch. The rule
  (`00` §8) is that `recoverTo` is at least the highest effect threshold's `at` plus `rearmMargin`: his
  highest is wary at -40 and the margin is 10, so -30 satisfies it exactly. His threshold flags
  (`dev_wary`, `dev_refusing`) are recomputed on every influence change and cleared once influence
  reaches `at` plus the margin or above, so after the reset he is not wary and not refusing; Dev's ink
  branches on the band it is passed rather than reading a stale flag. Ruth says the call was "burned for a couple of minutes", which is that expiry spoken in
  character, and the student has the page builder to use meanwhile. No object is greyed and no
  mission beat is needed. At -30 the date ask (floor -20) needs a few matched claims first, so the
  second attempt is harder but open; the hint ladder (06 §4.5) starts then. The lockout is
  channel-scoped, so the email route to Sofia stays open. A call-back policy would have stopped this;
  the stage 6 finding and the stage 7 mitigation pick that up.

Because `pretext_call_done` needs one granted ask and Sofia's phish needs all three facts, the
`prepare_hard` aim can complete with the date still unknown. Lord's `when` blank offers only the
payslip date from `lord_payslip_date` (her `when` blank is filtered to the release date, so the
generic `friday` Pierce uses is never offered, 04), so with the date unknown the blank is empty and Send is blocked with the neutral pre-send line; nothing is judged
and the checklist does not name the gap. Ruth's hint rungs point back at Dev. This is by design: the phone reopens for a second call
(asks whose facts are held are not offered again), so a student who got only the portal name on the
first call makes a second call for the date.

Back at the mail workstation the student composes **round 3 to Sofia Lord** from `guest`, with the
portal's notification sender in the From blanks (`portal_full` and `portal_address`, both provided by
`lord_trusts_portal_sender`; Lord's `trusts` is `["portal"]`), a named greeting (`lord_first`, which
`lord_intern` provides as a greeting value, and the only form her `addressedAs` accepts), a payslip
pretext carrying the portal name and the date (`minDistinct: 2`), and the page built in stage 4 as
the link (`kit_payroll_page`). Required factors: `senderTrust`, `addressedTo`, `pretextRelevant`,
`linkCredible`. Lord lists `linkCredible` in `requiredFactors` and has an `expectedLink`, so a send
with no link at all fails it with state `missing` ("There's no page behind that link"), exactly as a
send whose page is not built does; a page below the threshold fails with its credibility reason. Lord
therefore cannot land without the stage 4 page. That is the hard gate, checked at send time and not on
the board (`00` §2, §4; 04 "Link"). Because the page must be attached for the phish to land, the page
record always has a `victim` by the time the report reads it. Advisory only:
`urgencyCalibrated` ("this reads as high-pressure, a defender would clock it") and `senderAuth`
(sent from `guest`, so the claimed domain would fail alignment). Urgency never fails a send, because
real phishing with heavy pressure still lands; it is taught as a tell in the stage 7 triage, where the
student is the reader.

### Stage 6 — Metrics & report (Engagement Office; Ch. 9)

The report workstation shows the **campaign results**, filled only from records the other components
keep:

- **Mail.** Per target, from `mailState.metrics[targetId]` (`00` §10a): messages sent, failed sends,
  landed, and whether the first send landed. Failed sends are framed honestly: "in a live test each
  failed send is a chance for a member of staff to report you". The reply received is the landed
  outcome; the lab records no "opened" or "clicked" for mail.
- **Page.** From the persisted page record `se_landing_pages.payroll_login.victim` (`00` §11a, 07
  step 5), written for every send with a page attached, landed or not (a below-threshold page reads visited, not
  submitted): the line reads "Visited: yes · Submitted: yes (simulated)", the same two outcomes as the
  builder's metrics line (`07` §5). They are a best-outcome flag, not a count of visits. The record keeps its best outcome, so a later
  send that does not land never erases an earlier success; the report reads the same. If `victim` is
  absent (no send has carried the page) the panel says "no page sent".
- **Call.** From the pretext globals: whether any ask was granted (`pretext_call_done`), whether Dev
  reported at any point (`dev_reported`), and the latest call's outcome and lowest influence
  (`pretext_service_desk_call_outcome`, `_lowest`, which the latest call overwrites).
- It says once that this test cannot see whether staff reported the attempts, and that a live
  engagement would add it.

The student reads the results and presses Confirm under the table (a `confirm` item carrying
`step: "results"`, authored in `engagement.report.items`; it is done when pressed, which sets
`report_results_done`) and then builds the **findings** (step `findings`, global `report_findings_done`, done when every finding has a correct cause and control
chosen). For each of three findings the student pairs a *root cause* with a *control* from authored lists. Finding 1, "Finance acted on mail spoofing a
colleague": cause "no external-sender banner; DMARC at `p=none`", control "banner plus DMARC
enforcement". Finding 2, "The service desk gave out the portal name and payslip date": cause "no
verification script", control "call-back to a number on file". Finding 3, "A look-alike portal page
would convince staff": cause "staff have no easy way to check the address or report it", control
"bookmarked portal plus a report button". Wrong pairs are explained; right pairs lock in.

**Tone is part of the pairing.** One wrong root-cause option per finding is a blame wording
("Pierce should have known better"). Choosing it is not punished with a fail but shown why: the
report is about processes and controls, and blaming staff suppresses future reporting (Ch. 9 and
Ch. 10).

When both steps are done the report builder sets `report_filed`; Ruth reads it and gives the Blue Team
key.

### Stage 7 — Defender flip (Blue Team Room; Ch. 10–12)

Tomasz takes the report and sets a debrief exercise. The same strings serve both seats (04
`factorStrings` red flags are the tells in 05).

1. **Triage and headers.** An inbox of eight messages at the triage workstation (05,
   `triageSetId`), scored under the `analyst` profile with the header panel and glossary open and
   immediate feedback: six authored messages and two `playerSent` (`00` §13). Only `playerSent` entries
   carry `domainFrom`; the authored messages have literal auth rows. Per message: *trust /
   report / delete* (05's three verdicts), then the chips for why. Wrong calls are explained with the
   tell the student themselves exploited. Reading headers is part of this step, not a separate quiz:
   each message's authentication results carry a `headerNote`. Five messages are phish and three are
   genuine:
   - **Student's Pierce phish** (`playerSent`, the latest sent record to `pierce` whose tells include `senderTrust` or `senderAuth`,
     landed or not): the display name is Jed's, the real account is not (`tells`: `senderTrust`,
     `senderAuth` would-fail). SPF fail, DKIM none, DMARC fail; the `Return-Path` and the first external hop do not
     match the name.
   - **Student's Lord phish** (`playerSent`, `domainFrom: "landing_domain"`, so the link shows the
     domain the student picked in stage 4): `tells`: `senderTrust`, `senderAuth`, `linkCredible` and the
     advisory urgency read are stored, and the replay lists the flags without `senderAuth` (the
     header panel shows a pass for the look-alike domain, so `senderAuth` is not a flag there). The
     record is the latest to `lord` whose tells include `senderTrust` or `senderAuth`, so a later
     `freemail` retry does not replace it. Its auth result comes from 05's `playerSentAuth` table, which has a row for each of
     the six menu domains and for the lab's two accounts (`guest`, `freemail`).
   - **Look-alike payroll notice** (authored, fixed look-alike domain): all three checks pass, **for
     the look-alike domain**. Authentication proves the sending domain is *consistent*, not
     *trustworthy*; this is the lesson students most often get wrong.
   - **Parcel notice with a zip** (authored phish) and **CV with an odd portfolio link to the careers
     inbox** (authored phish; the defender's view of stage 3 round 1).
   - **Genuine mail via a forwarder** (authored): Jed to Pierce, Friday balance sheet. SPF fail
     (the forwarding host is not in the sender's SPF record), DKIM pass, DMARC pass because DKIM
     aligns. Teaches why DMARC needs only one aligned pass and why SPF alone breaks on forwarding. It
     stays in the lab. To keep it clear, the message shows a "Forwarded by a colleague" banner, each
     check reads as a word as well as a colour, and a plain caption under the three results says what
     they add up to (05, "The header panel"). It is the sixth of the eight, after the look-alike
     notice.
   - **A vendor invoice** and **a staff newsletter** (authored, genuine).

   The student passes the step when the round's percent reaches the set's `passPercent` (60): the
   triage starter writes `triage_pass` (`setGlobalPrefix: "triage_"`), and a round below it can be run
   again from the result screen's "Try again" (mission-stage sets have no first-attempt guard, 05).
   Ruth's `eventMappings` entry listens for `triage_pass` and completes `triage_passed`; Tomasz only
   reads it. The concept panel (SPF, DKIM, DMARC;
   the 05 glossary) is short and follows 05's definitions: SPF lists the hosts allowed to send for the
   envelope domain; DKIM signs chosen headers and the body; DMARC requires SPF or DKIM to pass *and
   align* with the visible `From` domain, and publishes a policy (`none`, `quarantine`, `reject`). The
   consequence of Ledgerwell's `p=none` is taught in the stage 6 finding and in the `headerNote` on
   the student's own Pierce phish ("a policy of `none` monitors but does not stop this").
2. **Threat-intel profile (Ch. 12).** The SOC board switches to `defender` mode: the facts the student
   collected, titled "what an attacker can assemble about us". The mode lists only facts that carry a `reduceNote`. For each of the four (the
   email pattern, the document metadata, Lord's social post, the careers inbox) the student picks
   one mitigation from an authored list (remove the staff email list, strip PDF metadata on publish,
   a social-media policy, filter and scan the careers inbox), each with a reason. Each of the four facts carries a
   `reduceNote` in `00` §1, which 03's validator requires of any fact used in `factMitigations`. The chosen mitigations make up
   the profile. There is no indicator tagging in this slice (the mode's indicators step is off unless
   authored).

When every fact has a good mitigation chosen the mode sets `profile_done`.

### Closing debrief (Blue Team Room)

Tomasz gives a short in-person debrief once every required completion global is set, `triage_pass`
and `profile_done` (both are synced VARs in `tomasz.ink`; until both are true he says "come back when
you have finished the exercise"). The SOC `case-file` stays usable before the triage, so the gate is on
Tomasz and not on the object. What the exercise showed, what
Ledgerwell will change, and the no-blame line. Branches are gated on globals (`dev_reported` and the latest call's
`pretext_service_desk_call_outcome` for the call; `phish_pierce_attempts` equal to 1 for a first-try
land on Pierce) and use fixed strings, so voiced lines print no variables. The conversation ends with
`#complete_task:closing_debrief` and `#exit_conversation`, which completes the mission-conclusion aim
and opens the conclusion screen.

## 4. Rules, gating & assessment

### Critical path

```
roe_signed -> plan_done -> osint_done (+ username convention) -> phish_hampshire_landed -> phish_pierce_landed
           -> [ landing_payroll_login_built  AND  pretext_call_done ]   (either order)
           -> phish_lord_landed -> report_filed -> triage_pass + profile_done (either order) -> closing_debrief (mission complete)
```

Everything on it is a deterministic judgement with an explanation. There is no timer, no lose state
and no KO (`disableAttacks: true`). Every failed attempt can be retried; the hint ladder always ends
in a near-explicit pointer. Stage order matters only where one stage makes another's input (the page
and call feed the Sofia Lord phish; the report feeds the Blue Team door).

### Time budget (target 75 minutes; accepted range 60 to 90)

A first-time student, including walking, reading and dialogue. The figures are estimates until the
timed blind playtest in section 9 replaces them. The budget has no slack line: the accepted range is
the slack, and the cut order below is applied if the playtest runs long.

| Stage | Minutes | What is in it |
|-------|--------:|---------------|
| 0 Authorisation | 5 | Brief, five scope cards, one stop-rule question, Fairbairn's line |
| 1 Scope & plan | 4 | Objective and measure picks |
| 2 OSINT | 10 | Team page, Hunter lookup, name search, three social profiles, the document's properties panel, the archived chart; 11 facts |
| 3 Phish rounds 1 and 2 | 11 | Freemail account (1), Hampshire (3), Pierce (7) with two to three attempts each; the 15-second reply waits overlap with reading the checklist |
| 4 Landing page | 7 | Seven choices and the tells feedback (5); the optional inspection after round 3 (2) |
| 5 Call and round 3 | 11 | Pretext card, call and debrief screen (7), Sofia's phish (4) |
| 6 Report | 6 | Results table, three findings paired |
| 7 Triage and profile | 12 | Eight messages (9), four mitigations (3) |
| Closing debrief | 3 | Tomasz |
| Walking, doors, Ruth's hand-overs | 6 | About eight door trips and five conversations with Ruth, spread across the stages |
| **Total** | **75** | |

If Dev's lockout fires, the two minutes are spent on the page builder, so it adds no time unless the
page is already built. The Tesseract lab's design records an estimate of 60 to 75 minutes that the user
accepted (`scenarios/lab_tesseract_trials/DESIGN.md`, D3); there is no measured figure from real
students for either lab. Expect this lab to run past 75 for a slow cohort.
Cut order, with the minutes each saves, if the playtest runs long:

Each cut is authored as a data variant before the playtest, so applying one is a data change and not a
rewrite. What each one edits:

1. Drop the stage 7 profile and end on the triage (3). Remove the `profile_done` task (21 tasks) and its
   mention in the `defend` aim; the SOC `case-file` object and `engagement.defender` go; Tomasz's debrief
   gate (`triage_pass` and `profile_done`) drops to `triage_pass` alone, and he stops declaring `profile_done`; the four-mitigation
   row of the time budget goes. Learning outcome 9 is then taught in the debrief only: the assessment
   table drops that row and the outcome has no evidencing task.
2. Drop Hampshire's round and start the phishing at Pierce (4), moving the open-inbox lesson to a
   triage message (the CV message stays). Remove the `ready_hampshire` and `hampshire_landed` tasks (20
   tasks, or 19 with cut 1), the `hampshire` entry from `intelBoard.people` (so `osint_done` and Ruth's
   Operations-key condition then wait on Pierce and Lord only) and from `phishTargets`, the `freemail`
   account with its `createMenu` and from `mail_terminal.accountIds` (leaving `["guest"]`), the
   `phish_hampshire_landed`, `phish_hampshire_attempts`, `target_ready_hampshire`, `acct_freemail` and
   `acct_freemail_choice` globals, the `freemail` row of `playerSentAuth`, the four browse-found facts that only the Hampshire round or the careers page
   supplies (`hampshire_careers`, `hampshire_cv_backlog`, `careers_attachment` and `tech_stack`, which
   `careers_stack` grants on that page), which leaves 10 contract facts (7 found by browsing, 3 granted by the call) plus the 2 stale, and the careers
   mitigation from the defender list (three remain). It also removes what points at those facts: the
   `hampshire` entry in `social.intelBoard.readinessSlots` (its `needsIntel` ids would be undeclared
   facts and its key would no longer be a target, which 03 N6 rejects), any `VAR` or `eventMappings`
   entry in `ruth.ink`, `ruth_phone.ink` or `tomasz.ink` that names a removed global
   (`phish_hampshire_landed`, `target_ready_hampshire`, and the Hampshire hint rungs), the `hampshire`
   entry in `mailClient.contacts` (its `revealedBy` names `hampshire_careers`, so leaving
   it fails the contact check in `00` §11), the careers-page and Hampshire social-post elements in
   `social.osint` (an element whose `fact` is undeclared fails 02's lint), the `kit_cv` payload item,
   and the Hampshire-only templates (`pretext_apply`, `pretext_enquiry`, `ask_review_cv`, and `greet_generic` if no other
   target's `templateSets` uses it).
3. Reduce the triage to six messages, four authored and the two `playerSent` (2): drop the parcel
   notice and the staff newsletter. This needs a six-message variant of the set (the contract size for
   the lab is eight, `00` §13), so author it with the set; the stage 7 time-budget row drops by 2 (the two dropped messages are the quick ones, so the nine minutes for eight messages fall to seven for six; the total becomes 73 for this cut) and the pass mark stays 60. The slow items stay: the two `playerSent` messages and the forwarder, which becomes the fourth of the six, after the look-alike notice.
4. Reduce the report to two findings (2): drop finding 3, the look-alike portal page, from
   `engagement.report.findings` and its cause and control lists, and update the stage 6 text and the
   time-budget row. No task changes.

Already left out for time, and where each would return in an extension: the stand-alone
header-interpretation quiz, the DMARC rollout simulation and indicator tagging in the profile.

### Objectives (aims and tasks)

Standard aim/task structure (`README_scenario_design.md`, Objectives System), each aim unlocked by
the previous (`unlockCondition.aimCompleted`). Every task is required: the platform score counts
optional tasks in the total (see "Assessment"), so the lab has none. Tasks that wait on minigame
outcomes are `manual` tasks completed by an `eventMapping` `completeTask` on Ruth's NPC record
(`eventMappings` live on NPC records, and she is in the start room, so she is the single listener;
the engine registers only start-room NPCs at game start, so her record must stay in the start room, or
become a headless record per `00` S8, and no one should move the listener to a lazily loaded room),
keyed to `global_variable_changed:<name>`. The mappings are once-only, because the writers can set a
global more than once. Ruth's check-in knots also re-issue `#complete_task` for any completing global
that is already true, so a student who works out of order, or a task that was not yet active when its
global changed, loses nothing. Tasks in later aims ship `status: "active"` because `unlockAim`
activates only the first task of an aim. Each `enter_room` task sits first in its aim.

**Each task has its own completing global.** The board modes and the report builder set a step
global per step and a block global when every step is done (`00` §11, "Engagement mode blocks").

| Aim | Task (type) | Completes on | Hand-over or unlock |
|-----|-------------|--------------|---------------------|
| `authorise` | `scope_cards` (`manual`) | `roe_scope_done` | |
| | `stop_rule` (`manual`) | `roe_stoprule_done` | `roe_signed` (block): Fairbairn's scene |
| `plan` | `pick_objectives` (`manual`) | `plan_objective_done` | |
| | `pick_measures` (`manual`) | `plan_measures_done` | `plan_done` (block): Recon key |
| `recon` | `enter_recon` (`enter_room`) | entering the room | |
| | `email_pattern_found` (`manual`) | `se_intel_email_pattern` | |
| | `metadata_read` (`manual`) | `se_intel_username_convention` | |
| | `ready_hampshire` (`manual`) | `target_ready_hampshire` | |
| | `ready_pierce` (`manual`) | `target_ready_pierce` | |
| | `ready_lord` (`manual`) | `target_ready_lord` | `osint_done` plus `se_intel_username_convention`: Operations key |
| `phish_easy` | `enter_operations` (`enter_room`) | entering the room | |
| | `hampshire_landed` (`manual`) | `phish_hampshire_landed` | |
| | `pierce_landed` (`manual`) | `phish_pierce_landed` | |
| `prepare_hard` | `payroll_page_attached` (`manual`; the host mapping on `global_variable_changed:landing_payroll_login_built` runs `completeTask`) | `landing_payroll_login_built` | |
| | `call_dev` (`manual`) | `pretext_call_done` | aim ends when both are done, either order |
| `phish_hard` | `lord_landed` (`manual`) | `phish_lord_landed` | |
| `report` | `results_reviewed` (`manual`) | `report_results_done` | |
| | `findings_paired` (`manual`) | `report_findings_done` | `report_filed` (block): Blue Team key |
| `defend` | `enter_blue_team` (`enter_room`) | entering the room | |
| | `triage_passed` (`manual`) | `triage_pass` | |
| | `profile_done` (`manual`) | `profile_done` | |
| | `closing_debrief` (`manual`) | Tomasz's `#complete_task` | the aim has `missionConclusion: true` |

That is eight aims and 22 tasks. `osint_done` is not set by a task: `evaluateReadiness` sets it from
`grantFact` when every card in `intelBoard.people` is ready (`00` §4), whatever order the tasks
complete in.

### Global variables

All are declared in `globalVariables` (the validator warns on undeclared `set_global` names).
`se_intel_<id>` is derived from `social.intelFacts` (`00` §5). Writers set globals through the shared
writer (`00` S3).

| Global | Set by | Read by |
|--------|--------|---------|
| `roe_scope_done`, `roe_stoprule_done`, `roe_signed` | the `scope` mode (03) | `authorise` tasks, Ruth, Fairbairn |
| `plan_objective_done`, `plan_measures_done`, `plan_done` | the `plan` mode | `plan` tasks, Ruth |
| `profile_done` | the `defender` mode (no steps) | the `defend` task, Tomasz (his debrief needs this and `triage_pass`) |
| `report_results_done`, `report_findings_done`, `report_filed` | the report builder (N1) | `report` tasks, Ruth |
| `se_report_state` | the report builder (N1; object, default `{}`, ids only: the Confirm press and the finding pairings chosen so far; saved with `stateSync.sync()` as the board does) | the report builder, on reopen |
| `se_intel_<id>`: the 14 contract facts plus `se_intel_baker_namesake` and `se_intel_old_org_chart` | `grantFact`: 02 for browsing finds, 06 `grants.intel` for the three call facts | 03 readiness, 04, composers, Ruth's hints, the `recon` tasks |
| `target_ready_hampshire`, `target_ready_pierce`, `target_ready_lord`, `osint_done` | `evaluateReadiness`, run from `grantFact` | the `ready_*` tasks, Ruth |
| `phish_hampshire_landed` | the text job at reply delivery | `hampshire_landed`, aims |
| `phish_pierce_landed`, `phish_lord_landed` | the target's `on_email` ink at reply delivery | `pierce_landed`, `lord_landed`, aims |
| `phish_hampshire_attempts`, `phish_pierce_attempts`, `phish_lord_attempts` | the mail client, on each send | Tomasz's debrief |
| `acct_freemail`, `acct_freemail_choice` | the `freemail` account's `createMenu` | `social.mailClient.accounts` |
| `landing_payroll_login_built`, `landing_payroll_login_domain` | 07, on attach (`landing_<pageId>_built`, `_domain`) | the `prepare_hard` task; `linkCredible` reads the page record |
| `se_landing_pages` | 07 (object, default `{}`) | the mail client (`linkInfo`), the report, 05's `domainFrom` |
| `se_osint_state`, `se_board_state` | 02, 03 (objects, default `{}`) | their own minigames |
| `pretext_call_done`, `pretext_call_reported` | 06 call outcomes | the `call_dev` task, Ruth |
| `pretext_service_desk_call_outcome`, `_lowest`, `_state` | the pretext session (06); the latest call overwrites `_outcome` and `_lowest` | the report, Tomasz |
| `dev_influence`, `dev_latched`, `dev_wary`, `dev_refusing`, `dev_reported`, `dev_lockout_until`, `dev_lockout_channel` | the influence service (`00` §8), Dev's ink; `dev_wary` and `dev_refusing` are recomputed on every influence change | the bar, Ruth, the report |
| `pierce_influence`, `pierce_latched`, `pierce_wary`; `lord_influence`, `lord_latched`, `lord_wary` | the mail stories and the influence service | the bar in the mail pane |
| `triage_percent`, `triage_reportRate`, `triage_done`, `triage_pass` | the triage starter (`setGlobalPrefix: "triage_"`, `passPercent: 60`, 05) | Ruth's mapping, which completes `triage_passed` on `triage_pass`; Tomasz's briefing |

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
- **Reload safety.** Board facts, mail state (sent messages, mailboxes, jobs, drafts, metrics), the
  landing page record, the pretext session and Dev's lockout deadline persist in game state (`00` §5,
  §8, §9, §10a; 03 N2; 06 `PretextSession`). The report draft persists in `se_report_state` (N1).

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
(`app/jobs/game_scoring_job.rb`) recomputes the same formula in its own `calculate_task_completion_score`
(lines 116 to 123); when the game has a `game_slot` it also recalculates the event result and
broadcasts it (lines 29 to 36). There is no per-outcome mark, hint count, attempt count or tutor
view. `merge_global_variables!` (`game.rb`, from line 242) persists every global key the client sends
except imported ones, so the lab can store counters, but nothing reads them. The server does not check
names against `globalVariables`; only the ink sync checks that a name is declared.

**What the lab can evidence with that.** The lab has no optional tasks and 22 required ones, so the
score is a completion share and a completed run scores 100. Each learning outcome is evidenced by the
tasks that complete once the student has done the thing. Completion is client-attested (the completing
globals and the `manual` tasks are set by the browser, `00` §5), which is acceptable for a formative lab
and means a summative mark would need server-side checks. A task completes only when the
underlying judgement is right: wrong scope cards, wrong findings pairs and a low triage round are
explained and re-done, so a student can finish with mistakes made on the way.

| Outcome (section 1) | Tasks that evidence it |
|---------------------|------------------------|
| 1 scope & law | `scope_cards`, `stop_rule` |
| 2, 3 OSINT | `email_pattern_found`, `metadata_read`, `ready_hampshire`, `ready_pierce`, `ready_lord` |
| 4 spear-phish | `hampshire_landed`, `pierce_landed`, `lord_landed` |
| 5 landing page | `lord_landed` (needs a page that meets the threshold, because `linkCredible` is required); `landing_payroll_login_built` (task `payroll_page_attached`) records only that a page was attached, since "attach anyway" is allowed below the threshold |
| 6 pretext | `call_dev` |
| 7 reporting | `results_reviewed`, `findings_paired`, `pick_objectives`, `pick_measures` |
| 8 authentication | `triage_passed` (a round at or above the pass mark; a failed round is re-run) |
| 9 mitigations | `profile_done` |

The in-game records that exist (attempts per target, sent, failed and landed counts, the page's best
`victim` outcome, the call outcome, the lowest influence Dev reached, and the checklist shown on screen
at send time) are for the student, the report and the closing debrief. They do not reach Hacktivity.
The game does not record which factors failed or how many hints were shown.

**Richer assessment is out of scope for now.** The lab is scored by the platform's completion share
and nothing else is built for assessment. A weighted rubric, per-student reports or a tutor view
would need Hacktivity work (for example counters in `globalVariables` read by `game_scoring_job.rb`,
and new fields such as `failedFactors` on the sent record and `hintsShown` in `mailState.metrics`);
none of that is part of this plan. Optional follow-on coursework (not in-game): a 500-word reflection on
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
null`). `lab_scanning` is a VM lab and is not the model. Files: `mission.json`, `scenario.json.erb`,
`ink/`. No VM fields, no `flags` block and no VM companion sheet.

```jsonc
// mission.json
{
  "display_name": "Phishing and Social Engineering",     // working title
  "description": "...",                                  // required by the validator
  "difficulty_level": 2,                                 // required
  "secgen_scenario": null,
  "collection": "lab_games",                            // a new strand label (N6); seeds.rb defaults to 'default'
  "ui_theme": "secops",                                  // valid in Mission::UI_THEMES
  "lab_sheet_url": "...",                                // added at the end of the project, once the sheet exists (section 5)
  "cybok": [ { "ka": "HF", "topic": "Awareness and Education", "keywords": ["..."] } ]   // table in section 4
}
```

In the scenario: `"disableAttacks": true`, a `missionConclusion` aim (`defend`) with
`"conclusionScreen": { "type": "end_screen" }` and `"concludeRequires": {}` (declared deliberately:
the lab has no large technical work to verify server-side). The lab sets no `creditsTheme`: the credits
visualiser opens from a `music.events` entry with `credits` (as in `sis01_healthcare`), which this
lab does not author, and `end_screen` draws only a plain overlay.

### Scenario schema: where each block lives

Everything lives under the one top-level `social` key (`00` §11), so the validator learns one name
and the browser reads one object. Objects carry only a pointer in `minigameData`.

| Block (`social.*`) | Owner doc | Object pointer (`minigameData`) |
|--------------------|-----------|---------------------------------|
| `intelFacts`, `people`, `templates` | 00 | none |
| `characters` (`pierce`, `lord`, `dev`) | 00 §8, §9 | none; channel records are ordinary NPC records, and the two mail records are headless (`emailRecord`) |
| `mailClient` (accounts, mailboxes, contacts, seeded inbox, payload kit) | 01 | `mail_terminal`: `{ accountIds }` |
| `osint` | 02 | `osint-workstation`: `{ siteIds }` |
| `intelBoard` (`readinessSlots`, title, `people`) | 03 | `case-file`: `{ mode }`, one object per mode |
| `phishTargets` (`hampshire`, `pierce`, `lord`) | 04 | none; selected by the mail UI |
| `triageSets` | 05 | `triage-workstation`: `{ triageSetId }` |
| `landingPages` | 07 | `page-builder`: `{ landingPageId }` |
| `pretextNpcs` (`service_desk_call`) | 06 | desk phone: `{ callId }` |
| `engagement` (scope, plan, report, defender, `scopeNote`) | 10 | `report-workstation`: none (reads `social.engagement`) |

New NPC fields (`social.characters` entries, `channels`, `syncedVars`, `thresholds`, headless email
records) are 00's. The validator work this implies is in section 6.

### Influence (`social.characters`)

The three characters are the table in `00` §8 ("Characters of the student lab"); the values are:

| Character | Channels | Start, range | Thresholds | Reply delay |
|-----------|----------|--------------|------------|-------------|
| `pierce` | email (`pierce_mail`) | 0, -40 to 100 | `wary` at -30 sets `pierce_wary`; nothing else | 15 s |
| `lord` | email (`lord_mail`) | 0, -40 to 100 | `wary` at -30 sets `lord_wary`; nothing else | 15 s |
| `dev` | phone (`dev_service_desk`) | -10, -100 to 100 | `wary` -40 sets `dev_wary`; `refuses` -50 sets `dev_refusing`; `reports` -70 sets `dev_reported`, ends the conversation and starts a 2-minute channel lockout that resets him to -30 | none |

Pierce and Lord are reachable only by mail and are on the critical path, so they have no `refuses`,
`reports` or `lockout`, and the -40 floor means failed sends (-10 each) only move the bar. Dev is the
only lab character with a lockout, and it sits on `reports` so that a forced report lifts too. Hampshire
has no character entry (no ink story, no bar). Ruth, Fairbairn and Tomasz are ordinary story NPCs with
no entry and no bar. No lab character uses `combatHostile`.

### Object types (wiring checklist)

Each new object type has one entry in `scripts/minigame-data-schemas.json`, a sprite
`assets/objects/<type>.png` (the validator's sprite-per-type check), the texture's preload line in `core/game.js` `preload()` (without it the object renders as Phaser's missing-texture box, and the validator's sprite check does not catch that), a branch in
`systems/interactions.js`, a registered scene, a starter in `systems/minigame-starters.js` and a
stylesheet linked in `show.html.erb` (README Conventions).

| Object type | Room | `minigameData` | Opens | Interaction branch |
|-------------|------|----------------|-------|--------------------|
| `case-file` (three in the Engagement Office, one in the Blue Team Room) | both | `{ mode }`: `scope`, `plan`, `recon`, `defender` | `intel-board` (03) | `case-file` |
| `osint-workstation` | Recon | `{ siteIds }` | `osint-browser` (02) | `osint-workstation` |
| `mail_terminal` | Operations | `{ accountIds: ["guest","freemail"] }` | `mail-client` (01) | `mail_terminal` |
| `page-builder` | Operations | `{ landingPageId: "payroll_login" }` | `landing-page-builder` (07) | `page-builder` |
| desk phone (engine type `phone`; no new sprite) | Operations | `{ callId: "service_desk_call" }` | `phone-chat` with `pretext-prep` (06) | the `phone` branch, with a `callId` check before the `text`/`npcIds` branch |
| `report-workstation` | Engagement | none | `engagement-report` (N1) | `report-workstation` |
| `triage-workstation` | Blue Team | `{ triageSetId }` | `inbox-triage` (05) | `triage-workstation` |

### Data volume

| Content | Owner doc | Volume |
|---------|-----------|--------|
| `globalVariables`, `objectives`, rooms, doors, keys, NPC placement | this doc | one `scenario.json.erb` |
| `mailClient` (two accounts, contacts, seeded inbox, payload kit) | 01 | ~6 benign seeded messages for realism; the triage set is separate |
| `osint` sites (company with an archive page, careers, three social profiles, a PDF with properties, a tools panel) and `intelFacts` | 02, 00 §1 | 14 contract facts (11 found by browsing, 3 granted by the call) plus 2 stale |
| `intelBoard` (title, `people`, readiness slots) | 03 | one block, four modes |
| `templates` and `phishTargets` ×3 | 04, 00 §10 | 3 targets, 4 to 8 templates per target in `templateSets` (Hampshire 5, Pierce 8, Lord 5), blank-value lists tagged distinctive or generic, replies, `factorStrings`, hints |
| Landing-page rules, six look-alike domain options, tells | 07 | 1 page model, ~6 tells |
| Pretext call: `pretextNpcs[service_desk_call]` and Dev's phone story | 06 §4.8 | 1 call, 2 asks, one opening pretext line (`open_buddy`) |
| Triage set (8 messages with auth results, 2 of them `playerSent`) | 05 | 6 authored messages, 2 `playerSent`, `playerSentAuth` rows for six domains and two accounts |
| RoE sheet text, scope and question cards, plan picks, report findings, defender mitigations | this doc | text + 3 findings + 4 mitigation blocks |
| Ink | this doc, 06, 00 §10 | 7 files (below) |
| Concept cards | 02, 07 | `social.conceptCards` (`00` §11): ten cards in all. 02's four tool cards (`tool_hunter`, `tool_harvester`, `tool_recon`, `tool_exiftool`) and 07's six page cards (`typo-squat`, `homograph`, `padlock`, `hover-link`, `right-to-left`, `five-habits`), which the landing page references and 07 N6 requires to resolve; the SPF/DKIM/DMARC explainers are 05's glossary |

**Ink files** (the mail stories need `on_email` knots and the `email_*` and `<character>_influence`
VARs, `00` §10; each declares its `se_intel_*` and synced VARs, `00` §5, §9):

| File | Channel | Content |
|------|---------|---------|
| `ruth.ink` | person | Briefing, key hand-overs (`#give_item`), stage check-ins that re-issue `#complete_task` for completed steps, debrief on the report |
| `ruth_phone.ink` | phone | Hint hub: three rungs per stage, gated on progress globals |
| `fairbairn.ink` | person | The short authorisation scene |
| `tomasz.ink` | person | Triage briefing and the closing debrief |
| `dev_service_desk.ink` | phone | The pretext call (06 §4.8), `pretext_say` and `pretext_ask` |
| `pierce_mail.ink` | email, headless | `on_email`: Pierce's reply and influence changes |
| `lord_mail.ink` | email, headless | `on_email`: Sofia's reply and influence changes |

Hampshire's reply is a text job from her target's authored `replies` (no ink story, no `character`).

### Authored fragments owned by this doc

```jsonc
"engagement": {
  "client": "Ledgerwell Ltd (fictional)",
  "scopeNote": "Authorised exercise for Ledgerwell Ltd (fictional). In scope: work email to named staff, the published service-desk line, public OSINT.",
  "roe": {
    "inScope":  [ "work email to named staff", "published service-desk phone line", "public OSINT" ],
    "outScope": [ "personal accounts", "physical entry", "real customers", "denial of service" ],
    "stopContact": "Ruth Adeyemi, Tarnside duty line"
  },
  "scope": {
    "onCompleteGlobal": "roe_signed",
    "steps": [ { "id": "scope",    "onCompleteGlobal": "roe_scope_done" },
               { "id": "stoprule", "onCompleteGlobal": "roe_stoprule_done" } ],
    "cards": [
      { "id": "personal_mail", "kind": "sort", "step": "scope", "text": "Email a staff member's personal address",
        "inScope": false, "why": "RoE section 4 limits the test to work accounts." },
      { "id": "real_compromise", "kind": "question", "step": "stoprule",
        "text": "You find a real compromise. What do you do?",
        "options": [ { "id": "stop_call", "text": "Stop and call the emergency contact", "correct": true,  "why": "..." },
                     { "id": "carry_on",  "text": "Note it and carry on",               "correct": false, "why": "..." } ] }
    ]
  },
  "plan": {
    "onCompleteGlobal": "plan_done",
    "steps": [ { "id": "objective",  "onCompleteGlobal": "plan_objective_done" },
               { "id": "measures",   "onCompleteGlobal": "plan_measures_done" } ],
    // single-select picks (03): one option per pick has correct: true
    "objectives": [ { "id": "how_far_gaps",     "step": "objective", "correct": true,  "why": "..." },
                    { "id": "disrupt_payroll",  "step": "objective", "correct": false, "why": "RoE section 3 bars disruption." } ],
    "measures":   [ { "id": "how_far",  "step": "measures", "correct": true,  "why": "..." },
                    { "id": "names",    "step": "measures", "correct": false, "blame": true, "why": "..." } ]
  },
  "report": {
    "onCompleteGlobal": "report_filed",
    "steps": [ { "id": "results",  "onCompleteGlobal": "report_results_done" },
               { "id": "findings", "onCompleteGlobal": "report_findings_done" } ],
    "items": [ { "kind": "confirm", "step": "results", "text": "I have read the campaign results" } ],
    // every finding carries step "findings" (03 N6 lint); the other two are authored the same way
    "findings": [
      { "id": "spoofed_colleague", "step": "findings", "text": "Finance acted on mail spoofing a colleague",
        "rootCauses": [ { "id": "no_banner_dmarc_none", "correct": true,  "why": "..." },
                        { "id": "staff_carelessness",   "correct": false, "blame": true,
                          "why": "Blames people; the control gap is the cause." } ],
        "controls":   [ { "id": "banner_dmarc_enforce", "correct": true, "why": "..." } ] }
    ]
  },
  "defender": {
    "onCompleteGlobal": "profile_done",
    "factMitigations": [ { "intel": "email_pattern",
                           "options": [ { "id": "remove_list", "text": "Remove the staff email list", "good": true, "why": "..." } ] } ]
  }
}
```

The mode blocks follow `00` §11 ("Engagement mode blocks"); `factMitigations` lives only here. Every
card, question and pick carries `step: <stepId>`, and a step's global is set when all items with that
step are answered correctly (`00` §11, 03). All feedback strings are authored and linted for empty interpolation (04 N3). The
`scope`, `plan`, `report` and `defender` items follow the "right answer plus a reason for each wrong
one" shape of the 04 factors, so one validator rule covers them (section 6, N7).

**Lab sheet, written last.** Lab sheets and walkthroughs for all labs and game scenarios are written
as the final step, after practically everything else is complete. This lab's sheet is a short
"practical"-mode one (concept recap per stage, hints), published via `HacktivityLabSheets` and linked
from `mission.json` then. The game must be completable without it (all learning is in-game).

## 6. Engine wiring

### Components used

| Stage | Component | Start interaction | Completion |
|-------|-----------|-------------------|------------|
| 0 | Intel board (03), `scope` mode | `case-file`, `{ mode: "scope" }` | `roe_scope_done`, `roe_stoprule_done`, then `roe_signed` |
| 1 | Intel board, `plan` mode | `case-file`, `{ mode: "plan" }` | `plan_objective_done`, `plan_measures_done`, then `plan_done` |
| 2 | OSINT browser (02) | `osint-workstation` | `grantFact` → `evaluateReadiness` sets `target_ready_<id>` and `osint_done`; the `recon` board (`{ mode: "recon" }`) is a viewer |
| 3, 5 | Mail client (01) + rules engine (04) | `mail_terminal` | none on send; the reply delivery (ink job or text job) sets `phish_<id>_landed` (`00` §3, §10) |
| 4 | Landing-page builder (07) | `page-builder` | `landing_payroll_login_built` and `_domain` on attach |
| 5 | Pretext dialogue (06) on `phone-chat` | desk phone (`callId`) | `pretext_call_done` and the per-call globals (06 §6) |
| 6 | Report builder (new, N1) | `report-workstation` | `report_results_done`, `report_findings_done`, then `report_filed` |
| 7 | Triage (05); board `defender` mode (03) | `triage-workstation`; SOC `case-file` | `triage_pass`; `profile_done` |

Registration, starters and completion follow the pattern in `01` and the README Conventions
(`registerScene` in `minigames/index.js`, a starter in `systems/minigame-starters.js`,
`base-minigame.js` emitting `minigame_completed`, bridging with `set_global` or an objective's
`onComplete.setGlobal`). Ruth's `eventMappings` on `global_variable_changed:<name>` complete the
`manual` tasks and give keys. A global cannot complete a task by itself; only the mapping does
(README engine table).

### What this doc relies on

Every value below is settled in `00`; 10 builds on it and cites the section.

| Doc | What the lab uses | Settled in |
|-----|-------------------|------------|
| `00` | Facts and `provides` (including `old_org_chart`, `baker_namesake`, the portal sender, Lord's greeting forms), readiness and `osint_done`, characters, `createMenu`, sent record and `mailState.metrics`, pointers, engagement mode blocks, Source Sans 3 | §1, §4, §8, §10a, §11, §13 |
| `01` | Accounts `guest` and `freemail`; the fixed `from_own` template; text-job replies for Hampshire; `kit_payroll_page`; per-target `phish_<id>_attempts` | `00` §10, §10a, §11a |
| `02` | Hunter result `r_pattern` grants `email_pattern`; the field-selection panel grants `username_convention`; the J. Baker search keeps its ambiguous result; the archived chart `org_old_chart` grants `old_org_chart`; no typed input | `00` §1; 02 "Picked lookups" |
| `03` | Four modes by `minigameData.mode`, one object per mode; mode blocks with `onCompleteGlobal`; question cards; defender mode has no indicators step unless authored | `00` §11 |
| `04` | `hampshire` (`from_own`, `trusts: ["*"]`, `senderTrust`, `pretextRelevant`, `attachmentPlausible`, no `addressedAs`), `pierce`, `lord` (`trusts: ["portal"]`, `minDistinct: 2`, `addressedAs: ["lord_first"]`, `expectedLink { brandId, realDomain }`) | `00` §7, §13 |
| `05` | A lab set of 8 (6 authored, 2 `playerSent`) under `analyst`, `setGlobalPrefix: "triage_"`, `passPercent`; `domainFrom: "landing_domain"` on `playerSent` entries only; `playerSentAuth` rows for the six domain ids and each account id; the free retry on mission-stage sets | `00` §10a, §13 |
| `06` | Character `dev`, record `dev_service_desk`, call `service_desk_call`; the `reports` threshold with the lockout; a forced report runs the `reports` effects | `00` §8; 06 §4.8 |
| `07` | Page `payroll_login`, the six-domain menu, the persisted record with `victim`, the two globals, no input from globals to the page score | `00` §11a, §13 |

### New engine work specific to this scenario

| # | Item | Notes |
|---|------|-------|
| N1 | **Engagement report builder** (`minigames/engagement-report/`): results panel, findings pairing with the blame option, sets `report_results_done`, `report_findings_done` and `report_filed` | Small; reuses overlay chrome and the right/wrong+why pattern from 04. Reads `social.engagement.report`, `mailState.metrics`, `se_landing_pages` and the pretext globals; saves its in-progress choices in the object global `se_report_state` and calls `stateSync.sync()` as the board does. It shows "no page sent" when the page record has no `victim`. The Confirm button for the `results` step is a `confirm` item in `engagement.report.items` (an item kind `00` §11 and 03 N6 must list, so the "every declared step has items" lint holds) Follows the full wiring checklist in README Conventions: scene, starter, interaction branch, stylesheet, schema entry, sprite and its preload line in `core/game.js` `preload()`, `requiresKeyboardInput`, its own Close |
| N2 | **Report data**: the report reads what 01, 07 and 06 already record (`mailState.metrics`, the page record's `victim`, the call globals) | No store of its own |
| N3 | **Board modes** `scope` and `plan` with the `engagement` data (scope and question cards, objective and measure picks) | Owned by 03; this doc supplies the data shapes in section 5 |
| N4 | **Defender-mode mitigation picks** | Owned by 03; `engagement.defender.factMitigations`; no indicator tagging in this slice |
| N5 | Door and key gating use existing locks and `#give_item`; **no new engine work** | Key locks and the key items both carry `keyPins`; the key items also carry `opens_lock`. Ruth's phone is a starting item (`startItemsInInventory`, `npcIds: ["ruth_phone"]`) |
| N6 | Non-VM mission configuration: `secgen_scenario: null` and the new `collection` label `lab_games`. `lab_tesseract_trials` is the same kind of game, so its `mission.json` moves to `lab_games` too (a one-line content change). The three Tesseract documents that name `escape_room` (`DESIGN.md`, Q10; `SOLUTION_GUIDE.md`; `ALIGNMENT_PLAN.md`) are updated to match, and `db:seed` is re-run on deployed instances so the stored label changes | `Mission#requires_vms?` already supports it; `db/seeds.rb` lines 67 to 71 read `secgen_scenario` and `collection`; the missions index builds its filter and headings from `Mission.collections` and titleizes the label (`app/views/break_escape/missions/index.html.erb`, lines 114 to 125), so it shows as "Lab Games" with no code change |
| N7 | **Validator work** (`scripts/validate_scenario.rb` for `known_top_level` and the `--strict-social` option; the social lints in `scripts/validate_social/*`, with the lab-level ones in `lab.rb`; `scripts/scenario-schema.json`, `scripts/minigame-data-schemas.json`) | `known_top_level` (lines 246 to 251) gains `social`; `known_npc_fields` and `known_behavior_fields` gain only what 00 §8 and §9 add; `minigame-data-schemas.json` gains an entry per object type in the table above; each type needs its `assets/objects/<type>.png` sprite; every `engagement` item with a `correct` or `good` flag carries a `why`; every completing global in the objectives table is declared; the promised lints from 00 §12 S11, 04 N3, 05 N5, 06 N10 and 07 |
| N8 | **Ink externals** (`se_influence`, `pretext_say`, `pretext_ask`): `InkEngine.loadStory` turns on `allowExternalFunctionFallbacks` and each external has an ink-side fallback function (`00` S1) | The authoring guide says "use synced-global `VAR`s, not `EXTERNAL` functions" because the engine binds only six read-only externals and an unbound one throws (`ink-engine.js` catches only the bind failure). When S1 lands, amend that rule in `README_scenario_design.md` to "an `EXTERNAL` needs an ink fallback function". Also needed: the pretext session and the headless mail runner bind the real functions; the ink tooling (`scripts/ink_runtime_check/voicelines.mjs`, `inkcheck.js`, `reopencheck.mjs`) sets the same flag; a lint rule that every `EXTERNAL` a social story declares has a fallback function |

The other engine items the lab depends on (S1 to S14 in `00` §12, the OSINT, board, mail, pretext,
triage and landing-page work in 01 to 07, the bundled Source Sans 3 font) are in the README's
consolidated table. Nothing here needs a VM, the flag-station or the vm-launcher.

## 7. Reuse and tuning

- **Awareness (11):** the same data, shortened. Drop stage 0's legal detail to a one-card consent,
  keep one OSINT layer, one easy target, no landing page in most episodes, no header reading; defend
  becomes spot-the-phish only. Targets, rules and strings are the same files with fewer factors
  required and the meter on throughout.
- **Eldritch Hacker:** any single stage is liftable (OSINT → phish → call). The lab's `phishTargets`
  and `osint` blocks are the templates. A `found` account (`jed_pc` and its mailbox), found laptops with
  mail history, a personal client in inventory and phone identities (`00` §10a) belong there, not here.
- **Student tuning knobs:** red-flag meter on or off per target; required factors per target; hint
  verbosity; whether the triage set keeps the forwarder message (it does; a facilitator can remove it
  for a first-year cohort); which of the cut-order items to restore for a longer slot.
- **Cohort reuse:** a second fictional company (different pattern, e.g. `firstname.surname@`) swaps
  in as data, so a re-sit or a second cohort does not share answers.

## 8. Assets (PixelLab-first, none generated now)

- Characters needing the full set (sprite, 400x400 chat background, `spriteTalk`, `spriteVisemes`,
  `avatar`, per the v2 sheet rule in `README_scenario_design.md`): Ruth, Fairbairn, Tomasz, and Dev
  (phone only, so portrait and visemes with no walk sprite). Targets Chris Hampshire, Melanie Pierce
  and Sofia Lord speak only in email text, and Jed Baker appears only on pages and sender cards, so all
  four are headshot-only: a 32x32 headshot (the `avatar`) made at that size, with a headshot asset id and
  no sprite key or walk sheet, for the board cards, OSINT pages and reply headers (`02` N6). Vary ethnicity and age across the cast (standing preference).
- Rooms: Engagement Office, Recon Room, Operations Room, Blue Team Room; orthogonal top-down props:
  desk, workstation, whiteboard/board, desk phone, SOC wall of screens.
- Object sprites, one per new type (`case-file`, `osint-workstation`, `mail_terminal`, `page-builder`,
  `report-workstation`, `triage-workstation`), plus item sprites: RoE sheet, three keys (Recon,
  Operations, Blue Team).
- UI art owned by 01, 02, 03, 05, 07; this doc adds only the report panel (results table, finding
  cards, tick and cross). All text the player reads or compares uses Source Sans 3 (`00` §6), whose Latin and Cyrillic subsets let the homograph option in the domain menu show as typed, with the punycode form as a teaching contrast.
- Audio: voice for Ruth, Dev and Tomasz, fixed lines only (the TTS cache is keyed on text, so no
  printed variables in a voiced line; Dev's reactions are fixed strings per held value, 06 §4.4).
  Music reuses an existing office track.

## 9. Open questions

Every question below is decided; none is open.

- OQ1: Retries are free and unlimited, framed as rehearsal (decided; stage 3).
- OQ2: Richer assessment and Hacktivity scoring are out of scope for now (decided; section 4).
- OQ3: **Length.** Target one session of about 75 minutes (decided; section 4 gives the budget and cut
  order). Run a timed blind playtest, as the Tesseract lab did, before fixing the figures.
- OQ4: The forwarder/SPF message is included, with the clarity aids in stage 7 (decided).
- OQ5: The lab sheet is written last, with the sheets for all labs and scenarios (decided; section 5).
- OQ6: Legal framing names the UK Computer Misuse Act 1990 with a generic "equivalent laws elsewhere"
  line, and the cast surnames Pierce, Lord and Hampshire stay (decided). A module leader may want local
  wording.
- OQ7: Cast follows `00` §1; confirm or rename there only.
- OQ8: The `collection` label is the new `lab_games` (decided; N6).
- OQ9: **Extension content.** If the playtest shows spare time, restore content that puts the core
  mechanisms and the new minigames to work first, in this order: (1) a second triage round: author a
  second 8-message set (mission stage, same `playerSentAuth`) and offer it from the result screen
  (new authoring, not data already present; 05's "Try the other set" is a training-only button), (2) indicator tagging in the profile
  (`engagement.defender.indicators`, board `defender` mode), (3) a stand-alone header quiz, (4) the
  DMARC rollout simulation. The last two do not exercise the core systems, so they come last. Items
  (2) to (4) need their data shape specified in 05 or 03 first; none is built in this slice.
