# 11 — Awareness product: role-based attack-then-defend episodes

Status: plan, 2026-10-20. Audience update (2026-10-20): the awareness product sits under the separate "Incident Simulations: Critical Cases" line, not SAFETYNET, and stays on a neutral corporate skin. The "SAFETYNET" column in section 7 now means the Eldritch Hacker missions, not Licence to Hack m01-m08. Built after the student lab.
R1 fixes applied (REVIEW_11_R1: M1 shared tell ids, M2 scoringProfile "awareness", Ho 1.7% provenance, Chothia softened, 5 minors). Curriculum and product doc, not a single minigame. It wires the systems in
`01`–`07` into short episodes for non-technical staff. Depth is data (see section 7), so nothing here
needs new engine components beyond those docs, apart from the episode wrapper and measurement layer
in section 6.

## 1. Purpose & audience

**Audience: phishing-awareness learners**, i.e. non-technical staff (finance clerks, HR, helpdesk,
executives, everyone else) in a browser, no install, 10–20 minutes per episode. Not the student lab
(`10`) and not the SAFETYNET missions (`12`), though the same components run underneath.

**What it teaches.** Not "never click anything". The aim is a working model of how an attacker thinks
(who they pick, what story they use, what they need you to do) so the learner can see the same
shapes from the other side. Maps to book Ch. 7 (phishing), Ch. 10 (proactive defence), Ch. 11 at
concept level only, and Ch. 1/App. D for the vishing episode.

**The signature structure: ATTACK then DEFEND.**

1. **Attack (about 5–8 min).** The learner plays a junior member of an authorised red team at a
   fictional company and writes a message to a fictional colleague in their own role. They use
   the shallow versions of `01`, `02`, `03`, `04`.
2. **Flip.** A short beat: "Now you're on the receiving end." The learner is placed in the inbox
   of someone in the same role.
3. **Defend (about 5–8 min).** Triage (`05`): sort a realistic inbox, spot the fake(s), report,
   and (in some episodes) handle a call or a login page. They are scored here.

**Why attack first.** This is the Chothia et al. stance (ASE '18; students reported raised awareness, evaluation not yet formal): building a phish teaches how
convincing a good one is. The intended emotional lesson is the one the attack beat produces on its
own: *a well-made phish is hard to spot, so people who fall for one are not stupid.* The episode
closes by saying so out loud (section 4, culture).

**Deliberately modern attack types.** The episodes cover attacks that dominate now and need no
malware to explain: business email compromise (BEC) and invoice fraud (no payload at all),
credential-harvest login pages, MFA fatigue, QR-code phishing ("quishing"), SMS phishing
("smishing"), vishing, and one deepfaked-voice executive episode. Malicious macro attachments get
a short concept note only. Microsoft has blocked macros in Office files from the internet by default
since 2022 (Microsoft Learn, "Macros from the internet are blocked by default in Office"; checked
2026-10-20 by web search, but re-confirm the exact rollout dates and the Trusted Location / admin
override caveats before putting dates in learner copy, (to verify)). Attackers therefore moved to
other containers and to no-payload fraud; the malicious-CV episode (HR) reflects that by leaning on
link-in-document and "enable content" lures rather than a clean macro story.

**Model, don't weaponise.** Everything the learner "builds" is judged by the rules engine against
fictional targets. No real sender spoofing, no real page-cloning, no downloadable kit, no real
credential capture. The payload kit is abstract labels (see `01`).

## 2. Player goal in their own words

"I tried to trick a colleague and learned how it's done. Now I can spot it in my own inbox."

## 3. The loop and the episode set

### 3.1 Standard episode shape (about 15 min)

| # | Stage | Time | What happens | Components |
|---|-------|------|--------------|------------|
| 0 | Pre-check | 2 min | 6 spot-the-phish items, unscored to the learner, recorded (section 6) | 05 (assessment mode) |
| 1 | Brief and consent | 1 min | "You're on an authorised exercise at Brightwell Foods (fictional). Scope: this inbox, these people." Short ethics beat | 03 scope note |
| 2 | Look around | 2–3 min | 3–5 facts on a stripped-down OSINT page; the intel board ticks as they're found | 02, 03 |
| 3 | Write | 3–4 min | Compose one message (or run one call) with guided free-text; red-flag meter on; retry freely, hints escalate | 01, 04, or 06 |
| 4 | Flip | 30 s | "Your message landed (or not). Now you're the one it lands on." The learner sees what they wrote arrive in a defender's inbox with their own red flags highlighted | 01 read-only |
| 5 | Defend | 4–6 min | Triage 6–8 messages (or handle a call / page) with the checklist from 04. Report button is always visible | 05 (and 06/07 where noted) |
| 6 | Debrief | 1 min | Per-item reasoning, one "one thing to do on Monday" card, the no-blame line | 04 strings |
| 7 | Post-check | 2 min | A different six items with the same difficulty mix | 05 |

Stages 0 and 7 can be switched off for a facilitated session (section 5.3). Stage 3 is the only
place the learner "attacks"; it is capped at **one attempt producing one artefact** (one message, one
call, one page choice, or one text/QR pretext, depending on the episode) so the episode stays short
and does not become a phishing workshop.

### 3.2 Episode list

All companies and people are fictional. Scores are defined in section 4.1: a phish item is worth at most 6 points, a genuine item at most 4
(no flags to name); the last column gives each episode's maximum.

| ID | Role | Attack type taught | Attack beat | Defend beat | Red flags surfaced | Scored items (max points, per 4.1) |
|----|------|--------------------|-------------|-------------|--------------------|-------|
| E1 | Finance / accounts payable | Invoice fraud and BEC (no payload, no link) | OSINT: supplier name, the finance manager, a real-looking quarter-end rush. Write an email "from" a known supplier asking to update bank details on an open invoice. Rules (04): `senderTrust`, `pretextRelevant`, `urgencyCalibrated`; no attachment factor | Triage a payments inbox: five items: a genuine invoice, a genuine routine purchase order, a lookalike domain (`brightwel1foods`), a "CEO needs this wired today", and a genuine change-of-bank that is correctly verified by phone. Must pick **verify by a known phone number** over "reply to confirm" | Changed bank details, urgency plus secrecy, display name vs real address, lookalike domain, reply-to differs from From, pressure to skip the normal process | 5 items (2 phish, 3 genuine); includes 1 out-of-band verification. Max 24 |
| E2 | HR / recruitment | Malicious CV (link or "enable content" lure, concept-level) | OSINT: an open vacancy, the recruiter's name, a social post asking people to email CVs (the Chothia example). Write a candidate email with an attachment from the abstract kit | Triage a recruitment inbox: genuine CVs, one with a link to a "portfolio" on an odd domain, one asking to "enable editing to view", one from a recruiter agency with the right domain. Learn: open in a viewer, don't enable content, report to IT. One short concept panel on macros, flagged in the debrief text as "largely blocked now, but the lure still shows up" (to verify wording) | Unexpected link, "enable editing/content" prompt, sender-attachment mismatch, generic greeting, domain age/lookalike | 6 items (2 phish, 4 genuine); includes correct attachment handling. Max 28 |
| E3 | Helpdesk / IT support | Vishing and social-engineered password reset; MFA fatigue as the second beat | `06` pretext call: the learner phones a fictional helpdesk as a "locked-out manager" and tries to get a reset. NPC suspicion model; they see which verification question the NPC skipped. Then a short MFA-fatigue beat: they spam push approvals in a mock authenticator and see the target eventually tap "approve" at 06:50 | Role-swap: the learner is the helpdesk agent. Calls come in via `person-chat`; they must run the verification script (callback to the number on file, manager approval, never read out a reset code). One call is genuine and awkward, to avoid "refuse everything" being the winning move. MFA beat: a stream of unrequested pushes, correct action is deny and report | Urgency and name-dropping, "I'm in a meeting, can't call back", authority pressure, request to bypass verification, unrequested MFA prompt, push at an odd hour | 4 calls (2 impostor, 2 genuine) plus 1 MFA push item. Max 26. Refusing a genuine caller without offering the safe route loses the action points |
| E4 | Executive / PA | Whaling and deepfake voice | OSINT: an exec's public calendar, travel posts, PA name. Write a short "I'm about to board, need this paid" email to the PA | Defend: the exec's PA gets an email, then a voice note and a call that sounds like the exec (TTS voice with a clone-style "effect"). The correct move is the same as in E1: stop and verify through a known channel. A debrief panel explains voice cloning at concept level, nothing about how | Authority, secrecy ("don't tell finance"), travel excuse, new payment details, voice with no verifiable channel, request that breaks process | 5 items (3 phish, 2 genuine), 2 of them voice. Max 26 |
| E5 | General staff: credential pages | Login-page clone via `07` | Build a look-alike "Single Sign-On" page from abstract parts (logo, form, domain choice); the learner picks which domain to send people to. `07` judges the choices (never produces a deployable page) | Triage: a link in an inbox; open it in a mock browser pane; check the address bar, the certificate padlock misconception ("a padlock doesn't mean it's safe"), and decide whether to enter details. One genuine IT page is mixed in | Domain mismatch, subtle misspelling, padlock myth, unexpected "your session expired" prompt, password manager not auto-filling | 5 URL/page items (3 phish, 2 genuine). Max 26 |
| E6 | General staff: mobile | QR-code phishing (quishing) and SMS phishing (smishing) as concept | Short: the learner chooses a pretext and a channel for a fictional office (a "parking permit" poster with a QR code, a "parcel fee" text). Uses a cut-down `01` phone variant on `phone-chat`; no landing page is built | Triage on a phone shell: texts, a QR on a printed notice, a "scan to confirm your MFA" email. Decide: don't scan, report, verify with the named sender through another channel | QR hides the URL, unexpected fee, shortened link, "reply STOP" trick, sender not in contacts, message outside normal channel | 6 items (4 phish, 2 genuine). Max 32 |
| E7 (optional) | Everyone: Voice and the CEO | Deepfake-voice CEO fraud | A cross-role finale reusing E1/E4 content: the learner prepares the fictional "script" for a cloned-voice call (the TTS engine makes it audible), scored only on pretext quality, never on audio realism | Defend: hear 3 voicemails, two real and one cloned. The learner cannot rely on the voice, so the game rewards the verify action, not "ear detection" | Voice alone is not proof, unusual request, urgency, no callback path | 3 voicemail items (1 cloned, 2 real), scored on action not on guess. Max 12 |

Notes on specific episodes:

- **E1 is the flagship.** Invoice fraud and BEC are the highest-loss common attack and need no
  malware, so it is the cleanest demonstration of "the sender's name is not the proof".
- **E3 and E7 depend on `06`** (suspicion dialogue). If `06` slips, E3 falls back to the phone-chat
  shell with a branching script and no suspicion model.
- **E5 is last in build order** because it depends on `07`.
- **E7 is the distinctive episode.** Break Escape already has TTS (the `tts-audio` pipeline), so a
  "cloned" executive voice is a style variant of an existing voice rather than a new capability.
  It must never use a real person's voice; the cast is fictional. Whether to ship it at all is
  Q-A1 below, because audio deepfakes are a sensitive demo.
- **Cast diversity.** Vary age and background across each episode's cast (standing project rule).

## 4. Rules, scoring and culture

### 4.1 What is scored

The score is **defence only**. The attack beat is never scored against other players and never
ranked. Its job is empathy and understanding, so it has feedback (the 04 checklist, shown in full)
but no points. This avoids rewarding "best phisher" and avoids teaching the learner to optimise for
fooling people.

**Ownership.** Triage scoring belongs to `05`, which is parameterised by a `scoringProfile`. The
episodes select `scoringProfile: "awareness"`. Under that profile reporting a genuine message is
**never penalised**: it scores as a safe action with no precision penalty (the student-lab profile
keeps `05`'s small false-alarm cost). So this is configuration, not a fork. The table below is the
awareness profile's shape as this doc needs it; if `05`'s profile defines the numbers differently,
`05` wins and the per-episode maxima are recomputed.

Per defend item the learner earns:

| Component | Points | Rule |
|-----------|--------|------|
| Classification | 2 | Right call: genuine / phish / "not sure, reported" |
| Red flags named | 1 per flag, max 2 | Pick from the game's flag list (not free text), matched against the item's authored flags |
| Right action | 2 | Report / verify by a known channel / delete, per item |

Reporting an uncertain item is **never** penalised: "not sure, reported" scores the action points in
full and half the classification points. Reporting a genuine item as suspicious costs nothing (awareness profile) and
earns the debrief line "Good instinct; here is why this one was safe." Reporting is the win; the aim
is to build the reporting habit, not a hit rate.

A learner can retry a defend item once after seeing the reasoning. The first answer is the one
recorded for measurement (section 5.2); the retry is for learning only.

### 4.2 Worked example (E1, invoice fraud)

Item: email from `accounts@brightwel1foods.example`, display name "Brightwell Foods Accounts",
subject "Updated bank details — please action today", asks to change the payee account on invoice
INV-2217.

- Learner marks **phish** (2), names *lookalike domain* and *changed bank details* (2), chooses
  **verify by phone using the number on file** (2). Total 6/6.
- Learner marks **genuine** (0). Feedback, shown in full: "This one looks right because the
  display name is right. Check the address: `brightwel1foods` has a digit 1 where the l should be.
  And look at what it asks: a bank-detail change on an open invoice is the commonest invoice-fraud
  move. The safe step is to ring the supplier on the number you already hold." The checklist
  strings come straight from `04`'s `redFlagStrings`, so the tells the learner just wrote into
  their own phish in the attack beat are the ones they are told to look for.
- No silent result. Every item shows its reasoning, pass or fail.

### 4.3 Defensive culture

These are product rules, enforced in copy review:

- **No blame language.** The debrief never says "you fell for it". It says "this one was built to
  look right" and explains why.
- **Reporting is a win.** The report button is always visible, never greyed out, and gives a
  positive animation and a short "thank you, this is how real attacks get stopped" line. Each
  episode ends with "what to do on Monday: report it, and how your organisation reports" (a slot
  the customer fills, section 6.3).
- **No individual league tables.** No "best phisher", no names on a leaderboard. Scores are shown
  to the learner only. Any aggregate shown to an organiser is a team or role aggregate with a
  minimum group size (suggested 10 (to verify against privacy advice)).
- **Grounding.** The no-blame stance, valuing report rate over click rate, and no shaming of
  individuals follow UK NCSC guidance on phishing and security culture (NCSC "Phishing attacks:
  defending your organisation" and its security-culture material; cited from memory, check wording and
  current titles before quoting to customers (to verify)).
- **Learn from caught-out moments.** Where a learner misses an item, the follow-up item is a
  *similar* one, not a harder one, so a miss is a teaching moment and not a spiral.
- **"People who fall for these are not stupid."** The line lands after E1's flip beat, when the
  learner sees their own message in a defender's inbox and the defender is *fooled by it* in a
  scripted example. The flip is where the Chothia empathy lesson actually happens.

## 5. Scenario-authored data, measurement and facilitation

### 5.1 Episode definition

An episode is one JSON file that references the component data of `01`–`07`. The wrapper holds only
sequencing, strings and scoring weights.

```jsonc
"awarenessEpisode": {
  "id": "e1_invoice_fraud",
  "role": "finance",
  "company": "brightwell_foods",           // fictional, neutral corporate skin (Q4)
  "durationTargetMin": 15,
  "scopeNote": "Authorised exercise at FICTIONAL Brightwell Foods. In scope: this inbox.",
  "stages": ["precheck","brief","osint","write","flip","defend","debrief","postcheck"],
  "attack": { "mailClient": "...", "osint": "...", "phishTargets": ["..."], "showRedFlagMeter": true,
              "maxMessages": 1, "scored": false },
  "defend": { "items": [ { "id": "i1", "kind": "email", "truth": "phish",
                           "redFlags": ["lookalike_domain","changed_bank_details"],
                           "correctActions": ["verify_known_number","report"] } ],
              "reportAlwaysVisible": true },
  "measurement": { "preBank": "finance_bank_a", "postBank": "finance_bank_b", "itemsPerCheck": 6 },
  "debrief": { "mondayCard": "slot:customer_report_route", "noBlameLine": true },
  "scoringProfile": "awareness",            // owned by 05; reporting genuine mail is never penalised
  "weights": { "classification": 2, "flag": 1, "action": 2 }
}
```

Red-flag ids come from the shared library in `00_data_contract.md` section 2: the seven factor
tells plus the **channel tells** (`lookalike_domain`, `changed_bank_details`, `vish_callback_pressure`,
`unexpected_qr`, `unrequested_mfa_push`, `smish_shortlink_urgency`). The invariant is: every tell that
has both seats (attack and defend) uses one id and one canonical string, so the two cannot disagree.
Defend-only tells (`unexpected_qr`, `unrequested_mfa_push`, `smish_shortlink_urgency`) have no attacker
mirror in these episodes and are flagged as such in `00`. Scenario-local tells are allowed; reusable
ones go into `00`.

### 5.2 Pre/post spot-the-phish measurement (built in from the start)

Evidence of effect is the weak point of this whole product category, so measurement is part of the
core loop and not a later add-on (Q5 default).

- **Item banks.** Each role has two parallel banks (A and B) of about 12 items each, matched on
  difficulty and category mix. A learner gets six items from bank A before and six from bank B
  after, randomised so the order is balanced across learners. Banks must be authored so that the
  items in A and B share the same red-flag categories at the same difficulty.
- **Recorded per item:** item id, bank, learner decision (genuine / phish / not sure), chosen action,
  time to answer, stage (pre/post/in-episode first answer). No free text, no content typed by the
  learner is stored.
- **What we can claim.** A before/after change on matched parallel items for a cohort. We **cannot**
  claim reduced real-world click rates from this alone. The product copy must say so.
- **Calibration.** Because pre and post answers feed straight into the product's own claims, we
  should pilot the item banks to check that A and B are in fact equal in difficulty (small pilot,
  compare means). Open question Q-A3.
- **Evidence context.** Research on awareness training is mixed. A large 2025 study by Ho et al.
  (UC San Diego, IEEE Symposium on Security and Privacy 2025; roughly 19,500 employees at a health
  organisation, 8-month randomised trial, ten simulated phishing campaigns) reported no significant
  relationship between recent training and failing a simulation, with most people spending under a
  minute on the embedded training pages. Confirmed against the primary text by the R1 reviewer. The paper's own Table 2
  caption gives an average absolute difference of 1.7% in simulation failure rate between
  embedded-training groups and control, which the authors present as a very small effect, so it
  supports caution rather than undercutting it. Keep the two arms separate in learner-facing copy:
  annual training (no significant relationship) versus embedded training after a click (1.7%). The
  paper also found most users spend under 30 seconds on embedded material. Our design response: the product does not rely on
  click-through reading but on a 15-minute interactive episode, it measures knowledge on matched
  items, and it does not claim behaviour change that the evidence does not show. The Ho
  study measured embedded training after a click, not an attack-then-defend game, so it does not
  answer whether this format works either; that is for our own pilot to show (section 5.4).
- **Chothia et al. (ASE '18)** report that students universally said the exercise raised their
  awareness, which supports the empathy lesson. They do **not** report a measured learning
  effect: the paper defers formal evaluation to future work, and the only numbers are participation.
  Do not quote an effectiveness figure from it.

### 5.3 Facilitated / workshop mode

Chothia et al. designed their exercise to encourage students to discuss phishing attacks and
anecdotally found the discussion particularly useful. That is a design aim plus an anecdote, not a
measured finding, and formal assessment is left to future work. We borrow the idea as a hypothesis
to test in our pilot (5.4), not as established evidence. A facilitated mode lets us try it:

- Teams of 3–4 share one screen for the attack beat and **discuss** the message before sending.
- A facilitator view (a plain second tab, or a printed card set) gives a prompt at each stage: "What
  would make you suspicious of this?" and "What does the sender want you to do next?"
- The defend beat is done individually on separate devices, then compared in the debrief. This
  keeps individual measurement intact and still gets the discussion.
- Pre/post are optional in this mode; a short whole-group poll replaces them.
- It reuses the same episode JSON. The new work is a `facilitated: true` flag that adds prompts,
  hides the per-learner score from the shared screen, and pauses between stages.

### 5.4 Pilot plan (small, honest)

Run E1 and E5 with a small cohort (staff or students, with consent), pre/post on parallel banks,
plus a no-training control group on the same measurement if feasible. Report effect sizes with
uncertainty. If we see no effect, that is a result and we change the format, not the claim.

## 6. Engine wiring and productisation staging

### 6.1 Wiring

Episodes reuse the minigames and systems of `01`–`07` and add a thin sequencer; the one configuration change is `05`'s `scoringProfile: "awareness"` (N9). The
minigame starter/completion pattern is the same as `01` (`minigame-manager.js:229` registration,
`minigame-starters.js` starters, `minigame_completed` via `base-minigame.js:84-108`,
`set_global` at `apply-actions.js:33`; line numbers as cited in `01`, not re-verified here).

| # | Item | Notes |
|---|------|-------|
| N1 | **Episode runner**: reads `awarenessEpisode` JSON, launches each stage's minigame in order, shows the step strip, carries state between stages (what the learner wrote → shown back in the flip) | New; small. Could be a scenario with an ink/objective chain instead, but a runner keeps authoring in one file |
| N2 | **Flip view**: re-renders the learner's sent message in the read-only mail client with red flags highlighted | Reuses `01` read-only mode and `04` results |
| N3 | **Defend item set** for `05` driven by `defend.items` and `04`/defender red-flag ids | Depends on `05` |
| N4 | **Measurement store**: pre/post/in-episode records per item, local first | New; schema in 5.2. Pseudonymous learner id (section 6.2) |
| N5 | **Facilitated flag** (5.3) | New; small |
| N6 | Phone-chat variant of the mail client for E6 | Already planned in `01` |
| N7 | Deepfake-voice style entry for E7 in the TTS config | Content only, existing TTS pipeline |
| N8 | Neutral corporate skin (Q4): theme file, no spy framing, fictional brand set | Theme/data |
| N9 | `scoringProfile: "awareness"` selected in episode JSON; the profile itself is defined in `05` (reporting genuine mail never penalised) | Config, not new scoring code in 11. `05` carries the `awareness` profile. |
| N10 | Add the channel-tell ids to the red-flag library | Done in `00` section 2; episodes only reference them |

### 6.2 Privacy defaults

- Learner identity is a pseudonymous id, not a name or email, in the measurement store, until a
  customer integration says otherwise.
- No learner-typed free text is retained (only choices and timings). The attack message is held in
  session to feed the flip, then discarded.
- **Real-staff OSINT is out of scope** (Q3 default). Every OSINT page in these episodes describes
  fictional people. No feature takes a real employee's name or email and goes looking for them.
  If a customer ever asks, that is a separate, admin-curated opt-in product walled off from the
  game, and not part of this plan.

### 6.3 Productisation items staged for later (Q4/Q5)

Not built in the first slice. Listed so the data model does not block them.

| Stage | Item | Why later | What to keep open now |
|-------|------|-----------|-----------------------|
| Later | **SCORM / xAPI / LTI export** (xAPI statements per item and episode; SCORM package for older LMSs; LTI launch) | Needs a stable episode and measurement schema first | Store measurement records in a form that maps cleanly to xAPI (actor, verb, object, result) |
| Later | **SSO** (SAML/OIDC) | Customer-specific, depends on hosting model | Keep learner id pluggable |
| Later | **Admin dashboard** (cohort completion, pre/post change, per-flag weak spots) with minimum group size | Needs real data volume | Aggregate only; no individual ranking (4.3) |
| Later | **Corporate skin** (customer logo, colour, "how we report here" slot for the Monday card) | Q4 default is neutral skin first | Theme file and a `customer_report_route` string slot |
| Later | Localisation | Phishing is language-specific; needs native review | Strings in data, not code |
| First slice (baseline) | Core-loop accessibility: keyboard-only play of attack and defend beats, accessible names on report/verdict controls, reduced motion, plain-text alternatives for every item | A workplace-mandated product cannot leave staff out; pixel UI is a real risk | Build into item data and component markup from the start |
| Later | Full accessibility audit and screen-reader polish of the canvas surfaces | Needs a working product to audit | Plain-text alternatives already in item data |

The commercial packaging question (hosted service vs licensed bundle, licence of the pixel-art
assets for commercial use) is Q-A5.

## 7. Reuse across audiences

Awareness is the **shallow setting** of the same components:

| Knob | Awareness | Student lab (`10`) | Mission (`12`) |
|------|-----------|--------------------|----------------|
| Required factors in `04` | 2–3 | 4–6 | 3–4, framed by dialogue |
| Red-flag meter | On in attack, off in defend | Off after first target | Off |
| OSINT depth | 3–5 facts, one page | Multi-site, metadata, search | One or two clues |
| Retries / hints | Unlimited, escalating | Escalating, scored | Hint stages |
| Header / SPF / DKIM / DMARC | Not shown; the words "this domain isn't theirs" only | Full (`05`) | Optional |
| Scoring | Defence only, private | Full rubric | Gate on a global |
| Skin | Neutral corporate | Lab | SAFETYNET |
| Time | 10–20 min | 1–2 h | one stage of a mission |

(Mission column: Eldritch Hacker missions, as of 2026-10-20. The skin row's "SAFETYNET" is kept corporate for awareness.)

Content authored for awareness (item banks, red-flag strings) can be pulled into the lab and
missions, and the reverse, because the red-flag ids are shared.

## 8. Art and audio assets

PixelLab-first, not to be generated now.

- Fictional-company set: three or four small office backgrounds (finance floor, HR office,
  helpdesk, exec suite). 400px person-chat backgrounds per project rule.
- Neutral-skin chrome: logo placeholder, generic badge, step strip.
- Cast: about 10 portraits plus busts across the roles, varied age and background, recurring
  characters (the supplier, the exec, the helpdesk caller) with their own sprite keys.
- Icons: padlock (with "myth" overlay for E5), QR poster, SMS bubble, authenticator push card.
- Audio: TTS lines for E3/E4/E7 via the `tts-audio` pipeline; E7's "cloned" voice is a style
  variant of an in-world voice, never a real person.
- Report button animation and a short positive sting.

## 9. Open questions

Also copied to `QUESTIONS_FOR_USER.md`.

- **Q-A1.** Ship the deepfaked-voice CEO episode (E7)? Default: **yes, as optional**, framed
  around "verify, don't trust the ear", and with no technique detail.
- **Q-A2.** Episode order for the first slice? Default: E1 (finance) first as the flagship,
  then E5 (login page) and E3 (vishing) as the other two core episodes; E2, E4, E6, E7 follow.
- **Q-A3.** Ethical sign-off and a small pilot for pre/post claims before any effectiveness copy
  is written? Default: **yes**, pilot per 5.4, and no effectiveness claims until it reports.
- **Q-A4.** Minimum group size for any aggregate shown to a customer? Default: 10, subject to
  privacy advice (to verify).
- **Q-A5.** Commercial packaging: hosted service vs licensed bundle, and are the pixel-art
  assets (PixelLab-generated) cleared for commercial redistribution? Default: undecided, assume
  hosted; check the PixelLab terms before selling (to verify).
- **Q-A6.** Is the "write a phish" beat acceptable for all customer audiences? Some HR
  departments may object. Default: yes, because it is capped at one message to a fictional
  colleague and judged, not exported. Offer a "defend-only" variant of each episode as a customer
  option, losing the empathy beat but keeping measurement.

### Claims to verify before anything user-facing

- Microsoft's default block on internet-sourced macros: confirmed in outline by web search;
  confirm dates, the exact conditions (Mark of the Web, trusted locations, admin policy) before
  citing in learner copy.
- Ho et al., IEEE S&P 2025: details above from the paper's summary and coverage; the 1.7% figure
  is in the primary text (Table 2 caption), verified in R1.
- Chothia et al.: team discussion is a design aim with anecdotal support only (R1-verified); no
  measured learning effect to quote.
- NCSC guidance titles and wording: cited from memory (to verify).
- Statistics on BEC loss share, quishing and smishing prevalence: none quoted here; any figure
  added later needs a source (e.g. an annual national cyber-crime report) (to verify).

