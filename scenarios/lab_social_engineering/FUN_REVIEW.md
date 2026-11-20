# Fun-and-learning review: `lab_social_engineering`

A game-designer pass on the player experience, not correctness. The earlier
reviews (C1–C5 design, the dialogue rounds, R1–R10 playtests) closed the gating,
wording and solvability. This one asks whether the lab is fun to play, where it
sags, where the student feels clever versus where they click through, and whether
the learning outcomes land. Read-only; nothing here is implemented. Limits held
throughout: browser-only, no combat, no VMs, no runtime LLMs.

Sources read: `scenario.json.erb`, `ink/ruth.ink`, `ink/tomasz.ink`,
`ink/fairbairn.ink`, `ink/dev_service_desk.ink`, playtests R8–R10, `DESIGN_LOG.md`,
the implementation plan.

## The top five, one line each

1. **Wake up the pretext call** — the richest mechanic (influence bar, resistance bands, techniques) is used once and runs almost on rails; make the candour repair and the wary/refuse arc reachable so students actually work Dev down. *(data + ink, medium risk)*
2. **The report's controls and the SOC board are the same quiz twice, minutes apart** — four "read a fact, pick one of three fixes" cards right after three more; differentiate the interaction or thin one of them. *(data/ink, low–medium risk)*
3. **The attack→defend reveal is the whole point and it's optional** — "two of those emails were mine" hides behind a Tomasz topic a student can walk past; make the mirror land for everyone. *(ink/data, low risk)*
4. **Report Q1 asks the student to deduce a fact they were never shown** — "no report button" is asserted in the answer, not seen in play; seed it in the results so it's a deduction. *(data only, low risk)*
5. **The three email sends are assembly, not judgement** — the picker only offers held facts, so by send time the thinking is done; let a live wrong option sit in each picker so the send is a decision. *(data, low risk)*

## What already works, and should be protected

- **The narrative frame is genuinely good.** Gareth's "is this going to make my people
  look stupid?", the no-names condition, and the payoff where the woman who nearly
  wired the invoice reads a report that doesn't point at her — that is a real
  emotional through-line, rare in a lab, and it carries the ethics teaching without a
  lecture. The Computer Misuse Act beat sits inside the signing scene
  (`fairbairn.ink:68`) instead of a pop-up. Keep all of it.
- **The difficulty curve across the three targets is the spine of the lab and it is
  well shaped:** an open inbox that trusts anyone (Hampshire, trivial) → a spoof of a
  trusted colleague (Pierce, medium) → a careful intern who needs a look-alike page
  *and* a pretext call *and* the right sender (Lord, hard). Each target forces a new
  technique. This is the best-designed progression in the scenario.
- **The single best "feel clever" moment** is the verification gate on the call: Dev
  asks "who's she? I check the new-starter list" (`dev_service_desk.ink:123`), and the
  student realises they need the name they dug up in recon before Dev will give
  anything. That connective click — recon paying off under pressure — is exactly the
  feeling the whole lab should chase. There is currently only one of it.
- **Triage as the defender mirror** is a strong idea: sorting your own sends from the
  receiving side, with the headers that "had you the whole time". It is the one stage
  with graded, per-skill feedback (R8: "Sender address 1 of 3, Pressure 0 of 1").

## Where it sags or goes flat

- **Front-loaded clicking before any tool.** Authorise (five scope cards + a stop-rule
  question) and Plan (objective + measure) are roughly eight sort/pick actions before
  the student touches a single technique. The framing earns its place, but it is a
  low-agency opening for a 60–90 minute lab, and a struggling student who is here to
  "do phishing" waits a while to do any.
- **The endgame is an MCQ pile-up.** Report (2 questions + 3 findings × cause + control)
  → triage → SOC board (4 facts × mitigation) → debrief. After the "doing" half
  (recon, compose, build, call), the defender half is mostly multiple-choice, and the
  report's control-picking and the SOC board's mitigation-picking are the same
  interaction back to back (finding 2). R10 timed 860s headless, but that is an expert
  agent assembling known answers; a student reading every `why` will feel the
  question-bank stretch.
- **The deepest system is mostly dormant.** The influence service has bands (wary at
  -40, refuses at -50, reports at -70, a two-minute lockout), techniques with
  susceptibilities (urgency -10, borrowed authority -20, candour +10), and a candour
  repair worth a correction. In practice the playtests never reached any of it: R8 F4
  and R9 "not exercised" both record that the wrong-team path isn't offered by the
  held-facts picker, so the repair, the refusal and the lockout are built and unseen.
  The student meets a friendly man who answers two questions once they name Sofia.
- **The sends are assembly.** Because the composer picker only lists held facts, by the
  time a student composes Pierce's spoof they are placing tiles, not deciding. The
  judgement all happened in recon; the compose step is where it should be *tested*.
  Lord's send does better (the Xero trap is a live wrong option), which is exactly the
  model the other two want.

## Does each mechanic earn its place?

| Mechanic | Earns it? | Note |
|---|---|---|
| OSINT browser | Yes | Core. The decoys (Leeds namesake, Xero, 2019 org chart, dead handle lookup) are the real teaching; several are skippable (finding 6). |
| Intel/readiness board | Mostly | Good scaffold, but the `goalString` rows name the exact page and block to click, so a capable student is told where to look rather than working it out. |
| Mail client / composer | Yes | Core loop. Weakened by pickers that only show held facts (finding 5). |
| Influence bar | On Dev, yes; on email, no | On Pierce/Lord it only moves on a reply and has a single wary threshold; in the send loop (binary land/fail) it is close to decorative. |
| Pretext call | Underused | The richest system, run once and nearly on rails (finding 1). |
| Page builder | Yes | Teaches look-alike domains, the padlock myth, hover-the-link. Solid. |
| Inbox triage | Yes | The defender mirror; the one graded stage. |
| Report | Yes, but heavy | Carries the no-blame / control-gap teaching; the MCQ volume is the cost (findings 2, 4). |
| SOC board | Overlaps | Content is distinct from the report, but the interaction is identical and consecutive (finding 2). |

## Payoff, debrief and replay

- **Payoff is strong.** Tomasz's "I'll get budget for one this year, if I'm lucky —
  which would you pick?" (`tomasz.ink:127`) turns the three fixes into a real choice
  with a dry, true-to-the-job answer for each. The credits name roles, not people,
  which is the lab's whole thesis made visible. Keep it.
- **Replay value is low**, which is acceptable for a lab but worth stating. The facts
  are fixed, the pickers show only held facts, the MCQs have fixed correct answers, and
  the score is 100 at the end whatever the student does (triage's percentage is the one
  graded signal and it gates nothing). The genuinely branching, interesting states —
  Dev's lockout, the reported call, the candour repair, the portal-first route — are
  the ones a first (and usually only) run is least likely to see.

## Do the learning outcomes land?

Mostly yes. OSINT-to-pretext, address patterns, metadata leakage, trust-not-identity
in a From line, the padlock myth, no-blame reporting and control-gap thinking all have
a concrete in-game moment. Two outcomes land weakly: **sender authentication**
(SPF/DKIM/DMARC) is explained well in triage but the student never has to *act* on it
to progress — it is advisory on every send; and **the human-resistance side of social
engineering** (reading pressure, backing off, recovering from a slip) is built into the
call system and then not reached (finding 1). Fixing finding 1 is the single biggest
learning win available here.

---

## The changes, ranked by value

### 1. Wake up the pretext call so its depth is actually played
**Value: highest.** The influence call is the most teaching-rich mechanic in the lab
and the one students remember, and right now it is a two-question vending machine. The
machinery for a real scene already exists in the data: a wrong-team opener, a candour
repair worth a correction, and the resistance bands. The block is that the composer
only offers the *correct* held team (Finance), so the "Accounts" opener and its repair
(`dev_service_desk.ink:57`, `repair_team`) are unreachable, and a student never sees Dev
slow down, go wary or flag the call.

Make the stale 2019 org chart do work: it already grants `team: accounts`
(`scenario.json.erb:448` `old_org_chart`). Let a student who read it open with the wrong
team, hit Dev's "we folded Accounts into Finance" (`dev_service_desk.ink:106`), and
recover with the candour line for the +10. That converts a dead decoy into the lab's
best "feel clever" beat and exercises the technique/band system once per run instead of
never. Separately, make the wary/refuse path discoverable — a student who leans on
urgency and borrowed authority should be able to feel Dev harden, not just read about
it in the debrief.
- **Cost:** data + ink. Pretext line/blank wiring in `social.pretextNpcs`
  (`scenario.json.erb:821`–`871`) and the opening choice guards in
  `dev_service_desk.ink:55`–`62`. No engine change — the bands, techniques and
  repair are already implemented.
- **Risk:** medium. The correction and refusal paths have never been exercised in a
  browser (R8 F4, R9 "not exercised"), so this needs a real playtest of the influence
  scoring, the repair credit and the lockout/lift, not just a static check.
- **Where:** `scenario.json.erb:832`–`871` (lines, blanks, asks, tells),
  `dev_service_desk.ink:55`–`109`.

### 2. Stop teaching "pick the mitigation" twice in a row
**Value: high.** The report pairs three attack findings with a cause and a control
(`scenario.json.erb:1224`–`1294`); the SOC board then has the student pick one of three
mitigations for each of four recon exposures (`scenario.json.erb:1296`–`1335`). The
*content* is defensibly different (what the attack exploited versus what recon leaked),
but the *interaction* is identical — read a fact, choose the best of three fixes, read a
`why` — and the two run minutes apart with the report → triage → board sequencing. To a
student it is the same quiz twice, and it is where the endgame drags.

Differentiate the board's interaction from the report's, or thin it. Options, cheapest
first: cut the board to the two exposures the report does not already cover (the address
pattern and the username leak are pure recon-hygiene findings with no report equivalent;
the social-post and open-inbox cards echo the report's page and desk findings), or change
the board's job from "pick a fix" to something the report doesn't do — e.g. ranking the
four exposures by how much they helped the attack, which ties the defender view straight
back to what the student actually used.
- **Cost:** data/ink if thinning (`engagement.defender.factMitigations`); data + a small
  board-mode change if re-casting the interaction.
- **Risk:** low if thinning; medium if the board gains a new interaction mode (new UI
  path, needs a playtest).
- **Where:** `scenario.json.erb:1296`–`1335` (board) against `:1224`–`1294` (report
  findings).

### 3. Make the attack→defend mirror land for every player
**Value: high.** The structural payoff of the whole lab is reading your own phish from
the blue-team side. That reveal currently lives in an optional Tomasz topic, "Two of
those emails were mine" (`tomasz.ink:64`, `own_mail` at `:78`), which a student who just
clicks "Debrief me" never sees. The triage already carries the player's own sends as
`playerSent` cards with authored notes (`scenario.json.erb:911`–`941`), so the material
is there; it just isn't foregrounded.

Surface it in the mandatory flow: flag the player's own two messages in the triage
result screen ("you sent these"), or move Tomasz's reveal out of the optional topic and
into the debrief proper so the "the headers had you the whole time" line is guaranteed.
- **Cost:** ink (promote `own_mail` into `debrief`/`hub` flow) and/or a line of triage
  result data; no engine change.
- **Risk:** low.
- **Where:** `tomasz.ink:62`–`83` and the triage `playerSent` notes at
  `scenario.json.erb:911`–`941`.

### 4. Make report Q1 a deduction, not an assertion
**Value: medium-high (learning correctness).** Q1 asks what the results *cannot* tell
Gareth; the right answer is "whether anyone reported the emails", and its `why` explains
"the only report this test can see is a call the desk flags"
(`scenario.json.erb:1202`). Three playtests flagged that the student was never shown
there is no report channel — it reads as a fact the answer supplies (R9 F8, R10 item 8
"reads fairly" but still sourced only from the answer). The plan stage *does* state it in
one measure's `why` (`:1182`, `did_staff_report`), but a student who picked the correct
measure never reads the wrong one's rationale.

Seed it where the student is looking: add a results-table line ("Reports received: none —
no reporting channel exists") so the deduction is drawn from the data on screen, the way
the cycle-3 rewrite of the `why` was trying to argue. Then Q1 rewards reading the table,
which is the skill.
- **Cost:** data only (a results-table row or a short visible note in the report model's
  results view).
- **Risk:** low.
- **Where:** `scenario.json.erb:1194`–`1209` (the `unseen_measure` item and the results
  presentation).

### 5. Give the sends a decision, not just an assembly
**Value: medium-high.** For Pierce and Hampshire the composer offers only held facts, so
once recon is done the send is placing the right tiles — the judgement happened earlier
and isn't tested at the point of action. Lord's send already does it right: the Xero
trap is a plausible wrong portal the student holds, so choosing LedgerPay over Xero is a
real decision (R9 item 5). Extend that pattern so each target has at least one live wrong
option in the picker at compose time — the student already holds the decoys (the Leeds
`j.baker@` namesake for Pierce, confirmed offered in R9 item 2; the stale org-chart role).
Lean on them so the send asks "which of these do I use?", not "drop in the one I have".
- **Cost:** data (ensure each `phishTarget`'s picker surfaces a held decoy; the Pierce
  namesake already appears, so this is mostly confirming and extending, not building).
- **Risk:** low. Watch that the decoy fails for a *teachable* reason with a clear
  `senderTrust.mismatch`/hint string, which the Pierce and Lord mismatch lines already
  provide (`:739`, `:798`).
- **Where:** `scenario.json.erb:672`–`818` (phishTargets, templates, factorStrings).

### 6. Let the first look at a target be the student's, not the board's
**Value: medium.** The readiness board's `goalString` rows name the exact page and block
to click ("Open the careers page and select its careers inbox line",
`scenario.json.erb:654`). That is the right safety net for a stuck student (and matches
the layered-hint rule in the project memory), but as the *first* thing shown it removes
the detective step for a capable one — recon becomes following directions. Keep the
explicit pointer, but gate it behind a "stuck?" reveal so the first state names only the
gap ("You still don't know who she trusts"), not the click. This preserves the floor for
struggling students while giving the rest a moment to think.
- **Cost:** data if the board already supports a two-stage hint; small engine/UI change
  if it does not.
- **Risk:** medium (do not strip the net — a blind playtest with a struggling-player
  persona should confirm a stuck student still recovers).
- **Where:** `scenario.json.erb:641`–`669` (`intelBoard.readinessSlots`).

### 7. Lighten the low-agency opening
**Value: medium.** Authorise + plan are ~8 sort/pick actions before the student touches a
technique. The ethics framing is worth keeping, but the start is a lot of multiple-choice
before any doing. Consider folding the stop-rule question into the signing scene (so
authorise is "sort the scope, Gareth signs"), or letting the student step into the Recon
room to look around while the plan is still open, so the first five minutes have a tool in
them. The goal is to shorten the gap between "start" and "do something", not to cut the
teaching.
- **Cost:** data/ink (objective gating and the scope/plan overlays).
- **Risk:** low–medium — changing the aim gating touches the key hand-over order
  (`ruth.ink:150`), so it needs a solvability re-check and a short playtest.
- **Where:** objectives `authorise`/`plan` (`scenario.json.erb:27`–`51`), the
  `engagement.scope`/`engagement.plan` blocks, and the key gate in `ruth.ink:150`–`172`.

## Noticed, not raised as a change

- The influence bar on the email targets (Pierce, Lord) is near-decorative in the send
  loop — it has a single wary threshold and moves on replies, not on the binary
  land/fail of a send. Either make repeated failed sends visibly raise the bar, or drop
  the bar from the email UI to cut noise. Lower confidence (I did not read
  `pierce_mail.ink`/`lord_mail.ink`); flagging for whoever owns the mail reply logic.
- The small stale-line snags the playtests keep catching (Ruth's stage-blind "How do I
  reach Sofia?" topic R9 F2, the partial-call debrief wording R10 F3/F4, "payslip date"
  raw-id R9 F4) are polish, not fun/learning, and are already tracked in the playtest
  logs.
- No scoring stakes: a student can trust the wrong mail and still pass triage at 60% and
  finish on score 100. Fine for a formative lab; worth a deliberate decision rather than
  a default if replay or self-assessment ever matters.
