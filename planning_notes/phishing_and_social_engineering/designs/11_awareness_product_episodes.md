# 11 — Awareness product: role-based attack-then-defend episodes

Status: plan. The awareness product sits under the separate "Incident Simulations: Critical Cases"
line, not SAFETYNET, and stays on a neutral corporate skin. It is built after the student lab (`10`)
and after Eldritch Hacker's first slice. The role swap (the learner plays the helpdesk agent) is
specified and built in this product's scope (section 6.1, N15), not in the lab or in `06`. The "Mission" column in section 7 means SAFETYNET:
Eldritch Hacker. This is a curriculum and product doc, not a single minigame. It wires the systems in
`01`–`07` into short episodes for non-technical staff. Depth is data (see section 7). Scoring is `05`'s
`awareness` profile, not a scheme of its own; where an episode needs something `05` does not have,
section 6.4 lists it as a request to `05`. The new engine work is the episode wrapper, the
measurement layer, the role swap and the episode-specific surfaces in section 6.1.

## 1. Purpose & audience

**Audience: phishing-awareness learners**, i.e. non-technical staff (finance clerks, HR, helpdesk,
executives, everyone else) in a browser, no install, 10–20 minutes per episode. Not the student lab
(`10`) and not SAFETYNET: Eldritch Hacker, though the same components run underneath.

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

### 3.1 Standard episode shape (about 13 min, plus the pre and post checks)

An episode is rows 1 to 6 and is one shell mission. The pre-check and the post-check are two further
shell missions that bracket whichever episodes an organiser sets between them (section 5.2), so three
episodes cost one pair of checks and not three. Rows 0 and 7 are those two missions, not stages inside
each episode.

| # | Stage | Time | What happens | Components |
|---|-------|------|--------------|------------|
| 0 | Pre-check mission (once per learner) | 4 min | One parallel form of 10 spot-the-phish messages (`05` `awareness` profile, `feedbackMode: "end"`), recorded and exported (section 5.2) | 05 |
| 1 | Brief and consent | 1 min | "You're on an authorised exercise at Brightwell Foods (fictional). Scope: this inbox, these people." Short ethics beat | 03 scope note |
| 2 | Look around | 2–3 min | 3–5 facts on a stripped-down OSINT page; the intel board ticks as they're found | 02, 03 |
| 3 | Write | 3–4 min | Compose one message from templates with one or two blanks filled from the facts just found (or run one call from preset lines with one blank); red-flag meter on, giving escalating guidance before Send; "retry" means editing the draft, because the first Send ends the beat | 01, 04, or 06 |
| 4 | Flip | 30 s | "Your message landed (or not). Now you're the one it lands on." The learner sees what they sent arrive in a defender's inbox with its `tells` (`00` §3) highlighted | 01 read-only; 05 `playerSent` |
| 5 | Defend | 4–6 min | Triage 5–8 messages (or handle a call / page) with the checklist from 04. Report button is always visible | 05 (and 06/07 where noted) |
| 6 | Debrief | 1 min | Per-item reasoning, one "one thing to do on Monday" card, the no-blame line | 04 strings |
| 7 | Post-check mission (once per learner) | 4 min | The other parallel form, same difficulty mix; shows the change from the imported pre-check result | 05 |

An organiser who wants no checks leaves the two check missions out of the event (facilitated mode,
section 5.3).

**Defend-only variant (decided 2026-10-21).** Every episode can be offered to a customer as a defend-only variant
for audiences that object to the "write a phish" beat. It drops the OSINT, write and flip stages, which exist
only to feed the attack, and keeps the brief, defend and debrief (`"variant": "defendOnly"`, section 5.1;
about 8 minutes). The defend set, its scoring and the pre and post check are the same as in the full
episode, so measurement is unchanged. What is lost is the empathy beat of seeing one's own message arrive.
The brief and debrief carry a `defendOnly` string where they refer to the learner's own message. The
variant is a field of the episode definition, so the defend-only version is its own shell mission (its own
`awarenessEpisode`, same `defend.setId`) with **its own id**, the full episode's id plus `_defend` (for
example `e1_invoice_fraud_defend`). That id sets the shell's global prefix
(`episode_e1_invoice_fraud_defend_defend_`) and its `episode_<id>_state` key, so the two shells never share a
global, and every in-episode measurement record carries the `variant` (5.2). The kiosk still carries only
`{ episodeId }`, and the organiser picks the mission when building the event.

Stage 3 is the only
place the learner "attacks"; it is capped at **one attempt producing one artefact** (one message, one
call, one page choice, or one text/QR pretext, depending on the episode) so the episode stays short
and does not become a phishing workshop. The first Send ends the beat (`maxMessages: 1`), so the
failure-driven hint ladder of `04` never runs here; the red-flag meter and its guidance, which are on
throughout, do that work before the learner sends.

### 3.2 Episode list

All companies and people are fictional. Defend items are scored by `05`'s `awareness` profile
(section 4.1), 0 to 100 per message; the last column gives the item mix, not a points total.

| ID | Role | Attack type taught | Attack beat | Defend beat | Red flags surfaced | Defend items (scored per 4.1) |
|----|------|--------------------|-------------|-------------|--------------------|-------|
| E1 | Finance / accounts payable | Invoice fraud and BEC (no payload, no link) | OSINT: supplier name, the finance manager, a real-looking quarter-end rush. Write an email "from" a known supplier asking to update bank details on an open invoice. Required (04): `senderTrust`, `pretextRelevant`; `urgencyCalibrated` is advisory; no attachment factor | Triage a payments inbox: five items: a genuine invoice, a genuine routine purchase order, a lookalike domain (`brightwel1foods`), a "CEO needs this wired today", and a genuine change-of-bank that is correctly verified by phone. The right move for the phish is to report and ring the supplier on the number on file (the debrief says so; the `Verify` verdict is provided by `05`, "Extensions for the awareness episodes") | Changed bank details (`changed_bank_details`), urgency plus secrecy (`secrecy_or_bypass`), display name vs real address, lookalike domain (`lookalike_domain`), reply-to differs from From (`reply_to_differs`), pressure to skip the normal process | 5 items (2 phish, 3 genuine); one genuine item carries a "confirmed by phone" note |
| E2 | HR / recruitment | Malicious CV (link or "enable content" lure, concept-level) | OSINT: an open vacancy, the recruiter's name, a social post asking people to email CVs (the Chothia example). Write a candidate email with an attachment from the abstract kit | Triage a recruitment inbox: genuine CVs, one with a link to a "portfolio" on an odd domain, one asking to "enable editing to view", one from a recruiter agency with the right domain. Learn: open in a viewer, don't enable content, report to IT. One short concept panel on macros, flagged in the debrief text as "largely blocked now, but the lure still shows up" (to verify wording) | Unexpected link, "enable editing/content" prompt, sender-attachment mismatch, generic greeting, domain age/lookalike | 6 items (2 phish, 4 genuine); includes correct attachment handling |
| E3 | Helpdesk / IT support | Vishing and social-engineered password reset; MFA fatigue as the second beat | `06` pretext call: the learner phones a fictional helpdesk as a "locked-out manager" and tries to get a reset. The NPC's influence bar (`00` §8) shows how each line moved it, and the learner sees which verification question the NPC skipped. Then a short MFA-fatigue beat: they spam push approvals in a mock authenticator and see the target eventually tap "approve" at 06:50 | Role swap (N15, built in this product's scope): the learner is the helpdesk agent. Calls come in as `call` cards in the `inbox-triage` scene (N15); they must run the verification script (callback to the number on file, manager approval, never read out a reset code). One call is genuine and awkward, to avoid "refuse everything" being the winning move. MFA beat: a stream of unrequested pushes, correct action is deny and report | Urgency and name-dropping, "I'm in a meeting, can't call back" (`vish_callback_pressure`), authority pressure (`borrowed_authority`), request to bypass verification, unrequested MFA prompt (`unrequested_mfa_push`), push at an odd hour | 4 calls (2 impostor, 2 genuine) plus 1 MFA push item, scored by the role swap's rules (N15) and shown as a percent. Refusing a genuine caller without offering the safe route loses points. Ships only when N15 and N11 exist |
| E4 | Executive / PA | Whaling and deepfake voice | OSINT: an exec's public calendar, travel posts, PA name. Write a short "I'm about to board, need this paid" email to the PA | Defend: the exec's PA gets an email, then a voice note and a call that sounds like the exec (TTS voice with a clone-style "effect"). The correct move is the same as in E1: stop and verify through a known channel. A debrief panel explains voice cloning at concept level, nothing about how | Authority, secrecy ("don't tell finance"), travel excuse, new payment details, voice with no verifiable channel, request that breaks process | 5 items (3 phish, 2 genuine), 2 of them voice (needs N12) |
| E5 | General staff: credential pages | Login-page clone via `07` | Build a look-alike "Single Sign-On" page from abstract parts (brand, domain and padlock choices; the other choices are fixed); the learner picks which domain to send people to. `07` judges the choices (never produces a deployable page). Its brands are invented, each with a `generic` or `parody` look, and it captures nothing (`07` §7) | Triage: a link in an inbox; open it in a mock browser pane; check the address bar, the certificate padlock misconception ("a padlock doesn't mean it's safe"), and decide whether to enter details. One genuine IT page is mixed in | Domain mismatch, subtle misspelling, padlock myth (`padlock_myth`), unexpected "your session expired" prompt, password manager not auto-filling | 5 URL/page items (3 phish, 2 genuine); needs N13 |
| E6 | General staff: mobile | QR-code phishing (quishing) and SMS phishing (smishing) as concept | Short: the learner chooses a pretext and a channel for a fictional office (a "parking permit" poster with a QR code, a "parcel fee" text). Uses `01`'s narrow, phone-shaped layout; no landing page is built | Triage on a phone shell: texts, a QR on a printed notice, a "scan to confirm your MFA" email. Decide: don't scan, report, verify with the named sender through another channel | QR hides the URL (`unexpected_qr`), unexpected fee, shortened link (`smish_shortlink_urgency`), "reply STOP" trick (`reply_stop_trick`), sender not in contacts, message outside normal channel | 6 items (4 phish, 2 genuine); needs N14 |
| E7 (optional) | Everyone: Voice and the CEO | Deepfake-voice CEO fraud | A cross-role finale reusing E1/E4 content: the learner prepares the fictional "script" for a cloned-voice call (the TTS engine makes it audible), no score, checklist only, and never judged on audio realism | Defend: hear 3 voicemails, two real and one cloned, then triage 2 emails reused from E1 and E4 (a genuine payment request that was verified by phone, and a "CEO needs this today" phish). The learner cannot rely on the voice, so the game rewards the verify action, not "ear detection" | Voice alone is not proof, unusual request, urgency, no callback path | 5 items: 3 voicemails (1 cloned, 2 real) and 2 emails (1 phish, 1 genuine), scored on the verdict and not on a guess about the audio (needs N12) |

Notes on specific episodes:

- **E1 is the flagship.** Invoice fraud and BEC are the highest-loss common attack and need no
  malware, so it is the cleanest demonstration of "the sender's name is not the proof".
- **E3 and E7 depend on `06`** (pretext dialogue on the influence score), and E3 also on the role swap
  (N15). If `06` slips, E3 falls back to the phone-chat shell with a branching script and no influence
  bar, and it still needs N15's scripted-caller scoring.
- **First-slice order is E1, then E5, then E3** (decided 2026-10-21). E1 is the flagship and needs no
  new component. E5 follows once the landing-page builder (`07`) and the interactive `page` card (N13) are
  built. E3 follows once the role swap (N15) is built. E2, E4, E6 and E7 come after.
- **E7 is the distinctive episode.** Break Escape already has TTS (the `tts-audio` pipeline), so a
  "cloned" executive voice is a style variant of an existing voice rather than a new capability.
  It must never use a real person's voice; the cast is fictional. E7 ships as an optional episode
  (decided), framed around "verify, don't trust the ear" with no technique detail, because audio
  deepfakes are a sensitive demo.
- **Cast diversity.** Vary age and background across each episode's cast (standing project rule).

## 4. Rules, scoring and culture

### 4.1 What is scored

The score is **defence only**. The attack beat is never scored against other players and never
ranked. Its job is empathy and understanding, so it has feedback (the 04 checklist, shown in full)
but no points. This avoids rewarding "best phisher" and avoids teaching the learner to optimise for
fooling people.

**Ownership.** Triage scoring belongs to `05`. Episodes select `scoringProfile: "awareness"` and
define no points of their own. Under that profile (`05` "Scoring profiles") each message is worth 100:
60 for the verdict (Trust, Report or Delete) and 40 for naming the real flags from the closed chip
list. In sets that enable **Verify** (E1, E3 and E4), Verify scores as Report in the table below; it
is not counted in `reportRate`, and the result carries `verifyCount`, which the debrief quotes (`05`).

| Message is | Report | Delete | Trust |
|------------|-------:|-------:|------:|
| A phish | 60 | 30 | 0 |
| Real mail | 60 | 30 | 60 |

Reasons points: for a phish with *F* authored flags, `40 × clamp(caught / F, 0, 1)`; for real mail, 40
always. Reporting a genuine message is **never penalised**, so the Report verdict is also the "I'm not
sure" path: an unsure learner who reports loses nothing and the debrief says "Good instinct; here is
why this one was safe." The episode score is the mean of its messages' percents, with `05`'s bands for
the headline word. The result screen's `reportRate` and `perFactor` are what the debrief and the
pre/post comparison quote. If `05`'s numbers change, this doc changes with them, because it holds none.

The reporting habit is the aim, not a hit rate. A learner who sees the reasoning for a missed item
meets a *similar* item next (section 4.3), not a retry of the same one: `05` locks a verdict on
confirm, and the first answer is the one recorded for measurement (section 5.2).

### 4.2 Worked example (E1, invoice fraud)

Item: email from `accounts@brightwel1foods.example`, display name "Brightwell Foods Accounts",
subject "Updated bank details — please action today", asks to change the payee account on invoice
INV-2217. Authored flags (F = 3): `senderTrust`, `lookalike_domain` and `changed_bank_details` (cycle 1
added `senderTrust` so that a learner who ticks "the address doesn't match" is not marked down, C1 M3).

- Learner chooses **Report** (60), ticks all three flags (`40 × 3/3` = 40). Message score **100**.
- Learner chooses **Report** and ticks only *lookalike domain* (`40 × 1/3` ≈ 13). Score **73**, and the
  card names the missed flags.
- Learner chooses **Delete** and ticks all three flags (30 + 40). Score **70**, with the line "Safe, but not
  reported. Deleting protects you; reporting warns everyone else."
- Learner chooses **Trust** (0) and ticks nothing. Score **0**. Feedback, shown in full: "This one
  looks right because the display name is right. Check the address: `brightwel1foods` has a digit 1
  where the l should be. And look at what it asks: a bank-detail change on an open invoice is the
  commonest invoice-fraud move. The safe step is to ring the supplier on the number you already hold."
  The checklist strings come straight from the target's `factorStrings` (`04`) and the `00` §2 canonical library, so the tells the
  learner just wrote into their own phish in the attack beat are the ones they are told to look for.
- No silent result. Every item shows its reasoning, pass or fail.

### 4.3 Defensive culture

These are product rules, enforced in copy review:

- **No blame language.** The debrief never says "you fell for it". It says "this one was built to
  look right" and explains why.
- **Reporting is a win.** The report button is always visible, never greyed out, and gives a
  positive animation and a short "thank you, this is how real attacks get stopped" line. Each
  episode ends with "what to do on Monday: report it, and how your organisation reports" (a slot
  the customer fills, section 6.3).
- **No individual league tables (a product goal that depends on the host, section 6.2).** No "best
  phisher", no names on a leaderboard. Scores are shown to the learner only. An aggregate view for
  organisers is out of scope for now (A4); if one is built later it is a team or role aggregate with a
  minimum group size, set then. Hacktivity broadcasts a per-user score to event channels, so this holds only in a
  standalone host or after Hacktivity changes (hosting and privacy are out of scope for now, A7).
- **Grounding.** The no-blame stance, valuing report rate over click rate, and no shaming of
  individuals follow UK NCSC guidance on phishing and security culture (NCSC "Phishing attacks:
  defending your organisation" and its security-culture material; cited from memory, check wording and
  current titles before quoting to customers (to verify)).
- **Learn from caught-out moments.** Where a learner misses an item, the follow-up item is a
  *similar* one, not a harder one, so a miss is a teaching moment and not a spiral. This is an
  authoring rule (the author places a similar item after each likely miss), not an adaptive engine.
- **"People who fall for these are not stupid."** The line lands after E1's flip beat, when the
  learner sees their own message in a defender's inbox and the defender is *fooled by it* in a
  scripted example. The flip is where the Chothia empathy lesson actually happens. A defend-only
  episode has no flip, so there the line moves to the debrief, as part of its `defendOnly` string.

## 5. Scenario-authored data, measurement and facilitation

### 5.1 Episode definition

An episode is one JSON object that points at the component data of `01`–`07`. The wrapper holds only
sequencing and strings. It lives at `social.awarenessEpisode` (`00` §11). Defend items are not inlined: they are a `05` `triageSets` entry, whose
`truth.flags` are the authored flags, so one definition of truth serves scoring and feedback.

```jsonc
"awarenessEpisode": {
  "id": "e1_invoice_fraud",
  "role": "finance",
  "company": "brightwell_foods",           // fictional, neutral corporate skin
  "durationTargetMin": 13,
  "variant": "full",                         // or "defendOnly": stages become ["brief","defend","debrief"], durationTargetMin about 8, no attack block read (section 3.1)
  "scopeNote": "Authorised exercise at FICTIONAL Brightwell Foods. In scope: this inbox.",
  "stages": ["brief","osint","write","flip","defend","debrief"],   // the pre- and post-check are missions of their own (5.2)
  "attack": { "target": "supplier_contact",       // a 04 phishTargets id; its templateSets (one or two blanks) are inline there
              "siteIds": ["brightwell_site","brightwell_social"],   // ids from social.osint.sites, passed to the OSINT browser
              "accountIds": ["analyst"], "defaultAccount": "analyst",   // ids from social.mailClient.accounts, passed to the mail client as a mail_terminal would
              "showRedFlagMeter": true, "maxMessages": 1, "scored": false },
  "defend": { "setId": "e1_payments_inbox",       // a 05 triageSets entry, scoringProfile "awareness", 5 to 8 messages
              "reportAlwaysVisible": true },
  "debrief": { "mondayCard": "slot:customer_report_route", "noBlameLine": true }
}
```

The mail client takes its accounts from the launching object (`mail_terminal`'s `accountIds` and
`defaultAccount`, `01`), and the episode kiosk carries only `{ episodeId }`, so the runner passes the
`attack` block's `accountIds` and `defaultAccount` through. The episode's
`social.mailClient.contacts` entry for the attack target uses a `revealedBy` fact that the episode's
`osint` stage grants, so the contact appears only once the learner has found it.

A check mission (the pre-check and post-check, 5.2) uses the same wrapper with `"stages": ["check"]`
and a `defend.setId` naming a parallel form; it has no attack, flip or debrief beyond the result
screen. Each check mission has one aim with `missionConclusion: true`, whose only task completes on
`triage_pre_done` (post: `triage_post_done`), and the aim declares `concludeRequires: { "globals":
["triage_pre_done"] }` (post: `triage_post_done`). These done globals are specific to the check (the
pre mission's `triage_pre_` prefix and the post mission's `triage_post_` prefix), so neither
mission's own names collide with the other's imports. The conclusion is what sets
`mission_concluded_at`, which `CarryOver` reads; without it the pre-check game would never count as
concluded. Gating on the done global also stops a pre-check that ends without a finished round from
exporting the declared defaults as if they were a result.

Three pieces make that conclusion reachable:

- **A host NPC.** `eventMappings` live on NPC records, and a global cannot complete a task by
  itself (a kiosk object has no mappings). Every check shell and every episode shell
  therefore includes one host NPC beside the kiosk (a receptionist or proctor in the one-room map).
  She says one line of welcome, and her record carries the `global_variable_changed:<done global>`
  mapping with `completeTask`, so the task completes when the global changes.
- **A flushed gate (sync, then emit).** `concludeRequires.globals` is read from the server's copy of
  the player's state, which the client syncs every 30 seconds, and the host's mapping fires on
  `global_variable_changed:<done global>` the moment the shared writer emits it. The triage starter
  therefore writes its globals (`percent`, `reportRate`, `pass`, `done`) through the shared writer
  with `deferEmit` set (`00` S3), so no event is emitted yet; it awaits `window.stateSync.syncConfirmed()`, which retries with back-off up to a capped number of attempts and stops on a 403 (`00` S3
  and §11, "Sync, then emit"; `sync()` resolves the same way whether or not the server confirmed, so it
  cannot be used here); and only then emits the `global_variable_changed` events and its done event.
  If the connection never returns, nothing is emitted and the result screen shows a saving notice. If
  the tab closes after the timer or `pagehide` flush has carried the done global but before the emit,
  the next reopen finds the done global set and the conclusion task (`conclusionTaskId`) incomplete, and
  re-emits after a confirmed sync (`00` §11 "Reopen re-emits"). The mapping's task completion then finds
  the gate met and the exported values current (`05` N6; `00` §11, "Missions that carry a score").
- **Validator-clean globals.** Check sets author `passPercent: 0`, so a task keyed on `<prefix>done`
  does not trip the `05` warning about `done` with a non-zero pass mark. The pre mission declares
  `triage_pre_percent`, `triage_pre_reportRate`, `triage_pre_done` and `triage_pre_pass` in its own
  `globalVariables` (the export and the `concludeRequires` check both need them declared). The post
  mission declares only its own `triage_post_*` names and imports the three `triage_pre_*` names, so
  the starter's auto-declaration covers the stage the kiosk launches and skips names the mission
  imports (`05` N5).

An **episode shell** has the same host NPC and one `missionConclusion` aim with one task, which
completes on the episode's defend-set done global (the set's `setGlobalPrefix` is
`episode_<id>_defend_`, so the global is `episode_<id>_defend_done`) through the host's mapping, with
the same sync-then-emit order and the aim's `concludeRequires` on that global. Without it an
episode shell would have no tasks, Hacktivity's task and aim share would be zero and no concluded run
would exist. The episode set also authors `passPercent: 0`.

Red-flag ids come from the shared library in `00_data_contract.md` section 2: the seven factor
tells plus the **channel tells** (`lookalike_domain`, `changed_bank_details`, `vish_callback_pressure`,
`secrecy_or_bypass`, `borrowed_authority`, and the defend-only `unexpected_qr`, `unrequested_mfa_push`,
`smish_shortlink_urgency`, `reply_to_differs`, `reply_stop_trick`, `padlock_myth`). The invariant is:
every tell that has both seats (attack and defend) uses one id and one canonical string, so the two
cannot disagree. Defend-only tells have no attacker mirror in these episodes and are marked so in
`00`. Scenario-local tells are allowed; reusable ones go into `00`.

### 5.2 Pre/post spot-the-phish measurement (built in from the start)

Evidence of effect is the weak point of this whole product category, so measurement is part of the
core loop and not a later add-on (the default is to measure from the start and stage integrations later).

- **Parallel forms.** Each role has two forms, A and B, of 10 messages each (`05`'s `awareness`
  sets, `pairedWith`), matched on the number of phish, the count of each factor and the difficulty
  mix. A learner takes one form before the episodes and the other after them. Four sets per role
  exist (`pre_a`, `post_b`, `pre_b`, `post_a`), and counterbalancing is done by mission pair: an "AB"
  pair (pre uses A, post uses B) and a "BA" pair. The organiser puts half the cohort on each pair, so
  no launch-time assignment is needed in the first slice (assigning by learner id is a later request
  to `05`, R3). The first slice uses fixed forms with no random draw from a larger bank; a seeded draw
  from a bank of about 12 per form is a later request to `05` (R4).
- **How pre and post cross missions.** Every episode is its own mission, so its own game with its own
  `globalVariables`, and `05`'s first-attempt guard (`<prefix>done`, `05` N6) lives inside one game.
  The two checks are therefore shell missions of their own, per role and pairing
  (`awareness_pre_finance_ab`, `awareness_post_finance_ab` and so on), each one kiosk that opens one
  triage set. The pre-check mission lists `exportGlobals` for `triage_pre_percent`,
  `triage_pre_reportRate` and `triage_pre_done`. The post-check mission lists `importGlobals` for the
  same three, each with `as` equal to its own name (`triage_pre_percent` and so on, so `05`'s
  comparison reader works unchanged, and no name clashes with the post mission's own `triage_post_`
  prefix), a default, and `{ "from": "<pre mission>", "completed": "pre_check_completed" }`. The
  post screen shows a baseline only when both `pre_check_completed` and the imported `triage_pre_done`
  are true. The triage starter writes the exported `triage_pre_*` names from JS, so the validator's
  "exported global is never written in this mission" warning is expected for them until `05` N5 makes
  the validator treat `setGlobalPrefix` names as written. The platform's `CarryOver` (`app/models/break_escape/carry_over.rb`) fixes
  those values when the post-check game is created, from the learner's newest concluded run of the pre
  mission, read-only, so the comparison needs no server work of our own. Consequences, stated rather
  than hidden:
  - Only scalar globals cross (a value is kept only when its JSON type matches the default). The
    first slice compares `percent` and `reportRate`; a per-factor comparison is not planned.
  - The platform does not order missions. The organiser places the pre-check first and the post-check
    last in the event; if the pre-check was never concluded, `pre_check_completed` is false and the
    post screen says there is no baseline.
  - "Once per learner" holds inside a game (the guard) and across the event only as far as the host
    gives one game per learner per mission. A second game of the pre mission replaces the baseline,
    because the newest concluded run counts. Product copy does not claim stricter than that; the hosting
    question is out of scope for now (A7) and the ordering question is settled as A8 below.
  - A role-specific pair covers a learner's primary role. Episodes from other roles are extras with no
    check of their own.
- **Recorded per item:** item id, form, learner verdict (Trust, Report, Delete), the chips ticked, the
  item score, stage (pre, post, in-episode first answer), the episode `variant` (`full` or `defendOnly`)
  for in-episode answers, and time to answer in milliseconds (`05` records `answers[].ms`;
  the time is never shown to the learner and `05` has no timer, so it measures nothing the learner is
  judged on). The attack beat stores a template id
  plus blank ids, held in session to feed the flip, then discarded. No free text exists in the scored
  path.
- **What we can claim.** A before/after change on matched parallel items for a cohort. We **cannot**
  claim reduced real-world click rates from this alone. The product copy must say so.
- **Calibration.** Because pre and post answers feed straight into the product's own claims, the
  forms are written to be equal in difficulty and checked in internal playtest. No pilot is planned
  (A3), so the copy claims no equivalence between the forms and no effect.
- **Evidence context.** Research on awareness training is mixed. A large 2025 study by Ho et al.
  (UC San Diego, IEEE Symposium on Security and Privacy 2025; roughly 19,500 employees at a health
  organisation, 8-month randomised trial, ten simulated phishing campaigns) reported no significant
  relationship between recent training and failing a simulation, with most people spending under a
  minute on the embedded training pages. Checked against the primary text. The paper's own Table 2
  caption gives an average absolute difference of 1.7% in simulation failure rate between
  embedded-training groups and control, which the authors present as a very small effect, so it
  supports caution rather than undercutting it. Keep the two arms separate in learner-facing copy:
  annual training (no significant relationship) versus embedded training after a click (1.7%). The
  paper also found most users spend under 30 seconds on embedded material. Our design response: the product does not rely on
  click-through reading but on a 15-minute interactive episode, it measures knowledge on matched
  items, and it does not claim behaviour change that the evidence does not show. The Ho
  study measured embedded training after a click, not an attack-then-defend game, so it does not
  answer whether this format works either; that is not established, and no pilot is planned, so the
  copy makes no effectiveness claim (section 5.4).
- **Chothia et al. (ASE '18)** report that students universally said the exercise raised their
  awareness, which supports the empathy lesson. They do **not** report a measured learning
  effect: the paper defers formal evaluation to future work, and the only numbers are participation.
  Do not quote an effectiveness figure from it.

### 5.3 Facilitated / workshop mode

Chothia et al. designed their exercise to encourage students to discuss phishing attacks and
anecdotally found the discussion particularly useful. That is a design aim plus an anecdote, not a
measured finding, and formal assessment is left to future work. We borrow the idea as a hypothesis
as a design choice, not as established evidence (5.4). A facilitated mode lets us try it:

- Teams of 3–4 share one screen for the attack beat and **discuss** the message before sending.
- A facilitator view (a plain second tab, or a printed card set) gives a prompt at each stage: "What
  would make you suspicious of this?" and "What does the sender want you to do next?"
- The defend beat is done individually on separate devices, then compared in the debrief. This
  keeps individual measurement intact and still gets the discussion.
- Pre/post are optional in this mode; a short whole-group poll replaces them.
- It reuses the same episode JSON. The new work is a `facilitated: true` flag that adds prompts,
  hides the per-learner score from the shared screen, and pauses between stages.

### 5.4 No pilot (decided)

No pilot of the pre/post measurement is planned. The measurement is built in from the start because
the data is cheap to keep, but product copy makes no effectiveness claim and quotes no effect size.
A pilot with ethical sign-off would be a separate decision, taken if the product ever needs to make
such a claim.

## 6. Engine wiring and productisation staging

### 6.1 Wiring

Episodes reuse the minigames and systems of `01`–`07` and add a thin sequencer; the one configuration
change is `05`'s `scoringProfile: "awareness"` (N9). The minigame starter and completion pattern is
the same as `01` (`minigame-manager.js:229` registration, `minigame-starters.js` starters,
`minigame_completed` via `base-minigame.js:84-108`, `set_global` at `apply-actions.js:33`).

**Reply delay.** The attack target of each episode authors its own `emailReplyDelay` of 5 to 8
seconds (`00` §10 recommends that range for episodes; the engine default is 20 seconds, which an
episode would otherwise inherit), for example 6 on `supplier_contact`. The flip beat does not wait for the in-character reply: it replays the
checklist and the stored `tells`, which are available at once.

**Mission wrapper.** The platform loads missions only from `scenarios/<name>/scenario.json.erb` plus
`mission.json` (`app/models/break_escape/mission.rb:46-50, 124-135`; `db/seeds.rb:50-60`), and a game
needs a map and a player. A JSON-only episode has no way into it. Decision: **one shell mission per
episode**, each a one-room kiosk map with `ui_theme: "general"`, a host NPC (5.1) and a single `kiosk` object
whose `minigameData` is `{ episodeId }` (`00` §11). Hacktivity then lists up to seven episode missions and
their defend-only shells, plus the check missions of 5.2 (the `collection` label is an open question in the
README; the existing `training` may fit), and an
organiser puts the chosen ones in an event. The episode data lives in each shell's
`social.awarenessEpisode`.

| # | Item | Notes |
|---|------|-------|
| N1 | **Episode runner**: a scene started by the kiosk that reads `awarenessEpisode`, starts each stage's minigame in turn, shows the step strip, and carries state between stages (what the learner sent → shown back in the flip) in a declared global `episode_<id>_state` | New; small. Only one minigame is open at a time, so it relies on the return-to work in the README engine list. An objectives chain of kiosk objects is the fallback if that slips. Like every overlay here it sets `requiresKeyboardInput: true`, draws its own Close, binds Esc, and gets a Space/E bridge test (`00` §6) |
| N2 | **Flip view**: re-renders the learner's sent message in the read-only mail client with its `tells` highlighted | Reuses `01` read-only mode and `05`'s `playerSent` message kind, which replays the latest sent record and reads its stored `tells` (`00` §10a), not `redFlags` (a landed message has none) |
| N3 | **Defend sets** for `05` as `triageSets` entries, with `truth.flags` ids from `00` §2 and the channel tells | Depends on `05`. Non-email items need the surfaces in N11 to N14 |
| N4 | **Measurement store**: pre, post and in-episode records per item, local first | New; schema in 5.2. Learner id: see 6.2 |
| N5 | **Facilitated flag** (5.3) | New; small |
| N6 | Narrow, phone-shaped layout of the mail client for E6 | One component with a narrow layout (`01` N1); no second client |
| N7 | Deepfake-voice style entry for E7 in the TTS config | Content only, existing TTS pipeline |
| N8 | Neutral corporate look: fictional brand set, logo placeholder, step strip | `ui_theme: "general"` (and `secops`) already exist in `Mission::UI_THEMES` (`mission.rb:69`), so no theme file is missing; the work is the brand art and strings |
| N9 | `scoringProfile: "awareness"` selected on the `05` sets; the profile is defined in `05` | Config, not new scoring code in 11 |
| N10 | Channel-tell ids in the red-flag library | Done in `00` §2; episodes only reference them |
| N11 | **Mock authenticator and push stream** (E3): a phone-shaped screen showing unrequested approve/deny prompts on a timeline, with the odd-hour push | New; not in `01` to `07`. Overlay rules as N1: `requiresKeyboardInput: true`, own Close and Esc, bridge test |
| N12 | **Voicemail player** (E4, E7): plays a fixed TTS clip per item and takes a `05` verdict | New; the cloned-voice clip is a style variant of an existing voice (N7). Overlay rules as N1 |
| N13 | **Interactive `page` card** (E5): the per-kind surface for `05`'s existing `page` kind, with a clickable address bar and certificate padlock check | `05` already defines the `page` kind; the interactive address-bar and padlock behaviour, and its art, are the new part. `02`'s browser is a navigation shell and `07`'s padlock is a canvas decoy; neither is a triage item. `07` N5 (defender inspection items) is proposed as a change request to `05` and is not accepted yet. Overlay rules as N1 |
| N14 | **Art and layout for the `qr` and `sms` card surfaces** (E6): a printed QR poster and a phone-shaped SMS thread | `05` already defines the `qr` and `sms` kinds; this is the per-kind surface and art each needs |
| N15 | **Role swap** (E3): the learner is the helpdesk agent and takes scripted calls. Each call in the episode's `defend.calls[]` is `{ id, genuine, claims: [{ fact, value }], tells: [...] }`, with the claims drawn from the same `06` `knows` and `lines` data the attacker call used, so the facts the learner exploited are the ones they now check. For each call the agent picks `comply`, `verify_callback` (ring the number on file), `escalate` or `refuse`. The right action for an impostor is `verify_callback` or `escalate`; a genuine awkward caller is also served by `verify_callback`, and refusing one without offering the safe route loses points. Scoring reuses `05`'s scorer through `05`'s `call` message kind, with the call's `tells` as the flags (`vish_callback_pressure`, `borrowed_authority`, `secrecy_or_bypass`) | Specified here and built here, before E3 ships; the lab and `06` do not need it. The role swap runs inside the `inbox-triage` scene: `defend.calls[]` are authored as `call` messages in the episode's `05` triage set, so the existing triage starter writes `episode_<id>_defend_done` with sync-then-emit (N16) and no second writer exists. `person-chat` is not used for the defend beat. New: the `call` kind's surface in `05` and the conversion of `defend.calls[]` into `call` messages |
| N16 | **Shell host NPC and flushed done event**: one visible NPC per check and episode shell whose `eventMappings` complete the conclusion task, and a triage starter that writes its globals with `deferEmit`, awaits `window.stateSync.syncConfirmed()` (back-off, capped attempts, 403 final; `00` §11), then emits the change events and its done event (5.1); on a reopen with the done global set and the `conclusionTaskId` task incomplete it re-emits. E3's role-swap calls run in that same starter (N15), so it is the only writer of `episode_<id>_defend_done` | Small. The ordering is the `05` N6 change and the `deferEmit` option is the shared writer's (`00` S3); the NPC is authored content. Validator: every shell has at least one aim and task, and a `concludeRequires` global that its set writes |

### 6.2 Privacy defaults and hosting

- **Hosting and learner privacy are out of scope for now (A7), and the answer decides what privacy claims can be made.** (a) A standalone host with
  no Hacktivity hook would need a new customer store for measurement, and could offer a pseudonymous
  learner id and private scores. (b) Inside Hacktivity, every game belongs to a user
  (`game.player`); `GameScoringJob` (`app/jobs/game_scoring_job.rb`) records the task and aim
  completion share as the game's score and broadcasts `game_progress` with `user_handle`, `score` and
  `mission_scoreboard_url` to the user, team and event channels (lines 173 to 192). There is no
  pseudonymous id and no hook to suppress the scoreboard. In (b) the product can promise only task and
  aim share (each shell has the one conclusion aim and task of 5.1, so the share is 0 or 100), and
  `05`'s percent lives in `globalVariables` for whoever reads it. The "pseudonymous
  learner id" and "no league table" goals in this doc hold in (a), or in (b) after Hacktivity changes.
  Until A7 is settled they are goals, not claims, and product copy must not make them.
- No free text is retained: the scored path holds only choices, template ids, blank ids and timings.
- **Real-staff OSINT is out of scope** (default: fictional targets only). Every OSINT page in these
  episodes describes fictional people. No feature takes a real employee's name or email and goes
  looking for them. If a customer ever asks, that is a separate, admin-curated opt-in product walled off
  from the game, and not part of this plan.

### 6.3 Productisation items staged for later

Not built in the first slice. Listed so the data model does not block them.

| Stage | Item | Why later | What to keep open now |
|-------|------|-----------|-----------------------|
| Later | **SCORM / xAPI / LTI export** (xAPI statements per item and episode; SCORM package for older LMSs; LTI launch) | Needs a stable episode and measurement schema first | Store measurement records in a form that maps cleanly to xAPI (actor, verb, object, result) |
| Later | **SSO** (SAML/OIDC) | Customer-specific, depends on hosting model | Keep learner id pluggable |
| Later | **Admin dashboard** (cohort completion, pre/post change, per-flag weak spots) with minimum group size | Out of scope for now (A4); needs real data volume | Aggregate only; no individual ranking (4.3) |
| Later | **Corporate skin** (customer logo, colour, "how we report here" slot for the Monday card) | Neutral skin first | Theme file and a `customer_report_route` string slot |
| Later | Localisation | Phishing is language-specific; needs native review | Strings in data, not code |
| First slice (baseline) | Core-loop accessibility: keyboard-only play of attack and defend beats, accessible names on report/verdict controls, reduced motion, plain-text alternatives for every item | A workplace-mandated product cannot leave staff out; pixel UI is a real risk | Build into item data and component markup from the start |
| Later | Full accessibility audit and screen-reader polish of the canvas surfaces | Needs a working product to audit | Plain-text alternatives already in item data |

The product is a **hosted service sold commercially** (decided, A5). The PixelLab-generated art is
taken as usable for that under the project's subscription; the terms text is checked once before
release (see "Claims to verify").

### 6.4 Requests of other docs

Episodes rely on `00` §10a, §11 and §13 for `playerSent` (the latest sent record whose tells include `senderTrust` or `senderAuth`, else the
latest with any tell, with the stored `tells` and the rendered body), the triage sizes (awareness pre/post 10, episode defend
sets 5 to 8), the `kiosk` pointer `{ episodeId }` and the `awarenessEpisode` key.

`05` already provides, in its "Extensions for the awareness episodes" and N1, N7, N9 to N11: the
`Verify` verdict (E1 and E4), the non-email message kinds `voicemail`, `sms`, `qr`, `page`, `push` (Approve is Trust, Deny is Delete, Deny and report is Report; tell `unrequested_mfa_push`) and `call`
(the `call` kind maps its four actions onto Trust, Report, Delete and Verify, with no scoring row of
its own), the `stage` launch parameter, `answers[].ms`, and the comparison screen on the post-check
(percent and report rate only, no per-factor comparison; it reads the imported `triage_pre_percent` and `triage_pre_reportRate` beside the post mission's own
`triage_post_` values, and shows "no baseline" unless `pre_check_completed` and `triage_pre_done` are
both true). The requests below are what `05` does not provide. Each is a request, so a later change in
that doc is reconciled here.

| # | Doc | Request |
|---|-----|---------|
| R3 | `05` | Later: let the stage (`pre` or `post`) of a parallel form be assigned at launch from the learner id. The first slice counterbalances by mission pair (5.2) and does not need it |
| R4 | `05` | A larger bank per form with a seeded draw. Not needed for the first slice (fixed forms) |


## 7. Reuse across audiences

Awareness is the **shallow setting** of the same components:

| Knob | Awareness | Student lab (`10`) | Mission (Eldritch Hacker) |
|------|-----------|--------------------|----------------|
| Required factors in `04` | 2–3 | 3–4 (plus 2 advisory) | 3–4, framed by dialogue |
| Red-flag meter | On in attack, off in defend | Off after first target | Off |
| OSINT depth | 3–5 facts, one page | Multi-site, metadata, search | One or two clues |
| Retries / hints | Attack beat: one send, meter guidance before it; defend: first answer recorded, a similar item follows | Unlimited, escalating, not scored (completion share only, `10` §4) | Hint stages |
| Header / SPF / DKIM / DMARC | Collapsed behind "Show details" (pre/post) or off (episodes); no jargon, only "this domain isn't theirs" | Read inside the triage, panel open (`05`); no separate quiz | Optional |
| Scoring | Defence only, `05` `awareness` profile; private only in a standalone host (A7) | `analyst` profile in triage; Hacktivity records task and aim share, richer rubric out of scope for now (`10` section 4) | Gate on a global |
| Skin | Neutral corporate | Lab | Eldritch Hacker |
| Time | about 13 min per episode, plus one pair of checks | about 75 min, one session | one stage of a mission |

Content authored for awareness (parallel forms, red-flag strings) can be pulled into the lab and
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

The same list is in `README.md`.

- **A1 (decided).** E7, the deepfaked-voice CEO episode, ships as an optional episode, framed around
  "verify, don't trust the ear", with no technique detail.
- **A2 (decided 2026-10-21).** First-slice episode order: E1 (finance) first as the flagship, then E5
  (login page, after N13), then E3 (vishing) once the role swap (N15) is built; E2, E4, E6, E7
  follow. The role swap is in this product's build scope (N15) and not the lab's.
- **A3 (decided).** No pilot of the pre/post measurement; no effectiveness claims (5.4).
- **A4 (out of scope for now).** The minimum group size for aggregates shown to a customer is not set
  until an aggregate view is built.
- **A5 (decided).** Hosted service, sold commercially; the PixelLab art is taken as cleared for that
  (6.3).
- **A7 (out of scope for now).** Standalone host or inside Hacktivity (6.2). Hacktivity's scoreboard
  and `game.player` identify the learner, so product copy promises no pseudonymous id, private scores
  or "no league table" until this is decided.
- **A8 (decided 2026-10-21).** Pre/post ordering and strictness (5.2). The platform does not order missions
  or stop a learner opening a second game of the pre-check, and `CarryOver` uses the newest concluded run.
  The organiser sequences the check missions by hand, a missing baseline is shown as such, and product
  copy claims nothing stricter. A stricter rule would need a Hacktivity event setting (one game per
  learner per mission, order enforced); that is out of scope for now.
- **A6 (decided 2026-10-21).** The "write a phish" beat is capped at one message to a fictional colleague
  and judged, not exported. Every episode also has a defend-only variant as a customer option (3.1, 5.1),
  which loses the empathy beat and keeps measurement.

### Claims to verify before anything user-facing

- Microsoft's default block on internet-sourced macros: confirmed in outline by web search;
  confirm dates, the exact conditions (Mark of the Web, trusted locations, admin policy) before
  citing in learner copy.
- Ho et al., IEEE S&P 2025: details above from the paper's summary and coverage; the 1.7% figure
  is in the primary text (Table 2 caption), verified.
- Chothia et al.: team discussion is a design aim with anecdotal support only (verified); no
  measured learning effect to quote.
- NCSC guidance titles and wording: cited from memory (to verify).
- PixelLab's terms on commercial use of generated art in a hosted, sold product: read the current terms
  text once before release.
- Statistics on BEC loss share, quishing and smishing prevalence: none quoted here; any figure
  added later needs a source (e.g. an annual national cyber-crime report) (to verify).


## 10. Built note (2026-10-22)

The engine and authoring side of this design is built; the plan above is otherwise unchanged. The author
documentation is README_scenario_design.md "Awareness episodes", and the contract additions are in
`00_data_contract.md` §11 ("The awareness episode block and its mail option").

**Built.**

- N1 the episode runner (`episode-runner` scene, `systems/episode-starter.js`, state in `episode_<id>_state`,
  resume on reopen), N2 the flip view, the debrief and the step strip, N8's skin half (CSS wordmark from
  `brand`, no image).
- N4 the measurement store, `systems/awareness-measure.js`, global `se_awareness_records` (an array).
- N5 `facilitated`, N6 the mail client's `maxSends`, `layout: "phone"` and `sentIds`, N11 the authenticator
  (`mfa` stage), N15 the role swap (`defend.calls`), N13's page certificate and autofill fields, and
  N16's kiosk object, host NPC rule and lints (`scripts/validate_social/awareness.rb`).
- Shells under `scenarios/awareness_*`: E1 full and defend-only, defend-only shells for E2 to E7, and the
  pre and post check pairs (AB and BA) for six roles. E3 and E5 full shells were in the working tree, not yet
  committed, when this note was written.

**Where the build differs from the sketch in §5.1.**

- `stages` gained `build` (E5, the landing-page builder, after `osint`) and `mfa` (E3, after `write` or `flip`),
  and the call attack of E3 is the `write` stage with `attack.callId` set. The push stream is `awarenessEpisode.mfa`,
  not `attack.pushStream`.
- `conclusionTaskId` is required: the host NPC's mapping on the done global completes it, and the starter
  re-emits on a reopen.
- `strings` is a closed list (the keys are in `00` §11), and `facilitator`, `conceptPanel` and `voicePanel` were
  added to it. `role`, `company`, `durationTargetMin`, `debrief`, `defend.reportAlwaysVisible`,
  `attack.showRedFlagMeter` and `attack.maxMessages` are accepted and not read by the runner (the runner passes
  `maxSends: 1` itself; `maxMessages` is only linted).
- A defend-only episode's set prefix is `episode_<id>_defend_defend_` because its id already ends `_defend`.
- The flip needs `playerSentAuth.accounts.<account>` on the defend set, and falls back to `flipMissed` without it
  or when the send raised no tell. No lint catches a missing row.

**Still held or open.** N7 (the cloned-voice TTS style) and the audio half of N12 wait for the user, so voicemail
items are transcripts. PixelLab art is not made (CSS wordmark and placeholder sprites). The E7 full shell waits for
the audio decision. The measurement records are written and nothing reads them back yet; `toXapi` is unused.

**Reload on the debrief.** A reload while the debrief is on screen keeps the numeric summary (it lives in
`state.defend`) but not the per-message review cards, because the answers are not persisted. This is by design:
no free text or per-message detail is stored, and the mission has already concluded by this point.
