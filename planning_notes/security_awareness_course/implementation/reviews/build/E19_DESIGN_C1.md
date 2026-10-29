# E19 "Malware, ransomware and updates": design review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language
model. Method and standard: `REVIEWER_BRIEF.md`, the `scenario-design-review` skill adapted to the
awareness kind, and the E8 pilot reviews in `reviews/build/` for format and bar. E19 is a
**consequence-flip** episode (ENG-04): no attack half, no phish target; the sandbox afternoon is the one
"attack artefact", and the flip shows where each choice led.

Scope read end to end: the full shell `scenarios/awareness_e19_malware_and_updates/{scenario.json.erb,
mission.json, ink/anjali_rao.ink}`; the defend-only shell `scenarios/awareness_e19_malware_and_updates_defend/`
(same files); the fragments `planning_notes/phishing_and_social_engineering/awareness/e19/{defend.json,
full_only.json, BRAND_ADDITIONS.md}`; the spec `.../episodes/E19_malware_and_updates.md`; the module
`modules/core_07_malware_ransomware_and_updates/concepts.md` (source of truth); the topic boundaries in
`00_COURSE_OVERVIEW.md`; and the overlap files E8 (`awareness/e8/defend.json`, the `e8_locked_files`
ransom item) and E10 (`awareness/e10/{defend.json,attack.json,BRAND_ADDITIONS.md}`, the Fernside shapes).

Ran: `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells (both exit 0, no social
errors or warnings; only the generic m01 spy-mission suggestions, which every awareness shell draws);
`dialoguelint.mjs` on both (full lines=6 max=29, defend lines=3 max=28, no rule hits, no printed
variables); the parity and rule-of-thumb JS guards (E19's own subtests pass, see below); and the full
bridge `ONLY="e19-full"` on the keyless :3001 server, **15/15 PASS** (game 4765). I judged the defend,
montage-flip and debrief **screens from the live bridge DOM assertions** (stage order, the four-beat
montage with exactly one `restart_prompt` headline, the six-item triage with the planned verdicts and
chips, the debrief's Monday card and four concept panels in order, the records array and the conclusion
global), and the **wording from the file read**. No static screenshot was captured (the suite has none).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 4 | 1 | 0 | 3 |
| **Total** | **4** | **1** | **0** | **3** |

Episode shape: full = 5 stages (`brief, mistake, flip, defend, debrief`); defend-only = 3 (`brief,
defend, debrief`, with `mistake`/`flip` dropped as `ATTACK_STAGES`). Defend set `e19_lock_the_doors`,
**6 items**: 4 "sign to report" (consent grab, ransom-note heads-up, enable-content document,
disable-protection fake IT) and 2 genuine (Quayholt Files consent, device update). One mirror pair
(rows 1/2). Four scenario-local tells (`app_consent_grab`, `ransomware_note`, `macro_enable_content`,
`disable_security_software`) declared with `flagChips` labels and per-message `factorStrings.<id>.redFlag`;
`secrecy_or_bypass` is the one shared-library tell. Both shells carry the byte-identical rule of thumb.

## JS guard note (not an E19 defect)

`social-awareness-rule-of-thumb.test.mjs` and `...-fragment-erb-parity.test.mjs` report 3 failures between
them, but **all three name only E12/E13/E14** shells that are on disk and not yet registered in the guards'
`FULL_EPISODES` lists (`awareness_e12_visitor_tailgater`, `awareness_e13_ai_assistant`,
`awareness_e14_social_media[_defend]`; "expected 63 shells, found 67"). E19 is registered in both guards
(rule-of-thumb line 41; parity line 57), its parity subtest passes ("E19: fragment and full erb share the
same learner-facing copy"), and its rule-of-thumb text is byte-identical to E8's in both shells. The guard
failures belong to those sibling episodes, not E19, and are outside this review's scope.

## What works

- **The engine path is real, not just valid.** The full bridge drives brief -> four sandbox beats (taking
  the unsafe `postpone_again` so the montage "your choice" branch fires) -> the montage (4 beats,
  `restart_prompt` the single headline, every beat with a line) -> the 6-item defend set (Report 1/3/4/5,
  Trust 2/6, with the right chips, result `pass: true`) -> the debrief (Monday card, four concept panels
  in the exact spec order, a records entry) -> `episode_e19_malware_and_updates_defend_done = true` and the
  episode closed with no `minigame_failed`. ENG-04's `mistake`/montage additions work for E19.
- **The lesson has a spine.** core_07 is a broad module (updates, ransomware, security software, backups,
  app consent), yet the episode holds one repeatable line through all of it: a program, file or app you did
  not start runs with your access, so if you did not expect it, do not open the door, report it. It is in
  the set brief (`:64`), the "It runs with your access" concept card (`:400`), the host lines, the
  `defendIntro` (`:433`) and the montage, and it is the honest through-line a clerk can carry to Monday.
- **The mirror pair and calibration are well built.** Row 1 (unknown-app consent phish) is immediately
  followed by row 2 (the genuine Quayholt Files consent that looks the same), so a learner who over-reports
  the shape meets the "a box appeared is not the tell; whether you or IT started it is" lesson at once
  (`feedbackMode: "immediate"`). Row 6 (the genuine device update) is the calibration after the run of
  phish, with a `falseAlarmCost` spelling out what reporting it would cost. This meets the brief's
  "awkward genuine so refusing everything doesn't win" and "a similar genuine item after a likely miss"
  squarely.
- **Facts match `concepts.md`.** Extension 4444, "unplug the network cable and leave it switched on",
  "don't pay, don't contact, don't try to fix it", restart the same day / self-restart at 19:00, macro =
  "small program inside the file", backup kept separate from the computer, "a web page offering an update
  is never genuine (E10)" — all trace to the module slots and key messages. No effectiveness claims, no
  case-study figures in learner copy.
- **Topic boundaries respected.** E19 owns core_07, so it carries the fuller ransomware procedure that
  E8's `e8_locked_files` deliberately stops short of; the two use the same local `ransomware_note` tell
  without conflict. The device-update card cross-references E10's web fake updates rather than repeating
  them (core_08's territory). No repeat of E2's recruiter-macro cards.
- **No-blame register is clean.** The `noBlameLine` ("this is how most incidents start, not a sign anyone
  was careless... Nobody at Quayholt is in trouble for reporting, including their own slip") is strong, and
  it neutralises the firm "Your choice." framing in the montage, which is consequence teaching, not blame.
- **The Monday-card fold reads well** (the first known item). The spec's module line is folded as "At work:
  restart when it asks, save where it's backed up, and if something looks wrong, report it straight away
  using the route in the box below" and the org-slot line as the closing "Quayholt keeps backups the
  attacker can't reach and runs Quayholt Protect, so a reported incident can be recovered" (`:395`, defend
  `:315`). Both read naturally in place; the card is dense (three-at-home list + at-work line + org line)
  but follows the core_07 "three things at home" design and stays legible. See MI4 for the dense-read note.
- **Host lines, fonts.** Anjali's ink is under 30 words throughout (dialoguelint max 29/28), warm and easy
  to voice, with no printed variables. No raw addresses appear in any message body, so nothing forces an
  address string into the pixel font; the reason texts say "the address is a look-alike of the supplier's"
  without printing the domain.

## Findings

**MI1. The spec's content-warning note (section 8) has no home and was dropped.** Minor, needs-user (engine).
Spec §8 (lines 220-221) calls for a brief "Content note (shown on the brief): 'This episode shows a
ransomware message on a colleague's screen. There are no alarms or flashing screens.'" There is **no
`contentNote` field anywhere** in the engine, schema or any built episode (grep across
`public/break_escape/js`, `scripts`, `scenarios`, the fragments: 0 hits), so it was left out. Impact is
low: the brief and `scopeNote` already say "nothing here is real malware", the ransom note is plain email
text, and the montage is deliberately calm (the bridge confirms no alarm/countdown DOM; the montage lines
carry no skulls or timers). But the spec writer flagged the warning as worth showing, and today it is
simply absent. Fix (user choice): accept the drop as covered by the brief/scopeNote; **or** fold a short
clause into the full brief, e.g. append to `strings.brief` (`:392`) "This one shows a ransomware message
on a colleague's screen; there are no alarms or flashing screens." (the defend-only brief already names
"a colleague whose screen has just locked", so it needs nothing); **or** raise a tiny `strings.contentNote`
slot with the `02` engine owner. Not a ship blocker.

**MI2. The Fernside look-alike `fernside-invoices.example` is a second, distinct shape from E10's now-built
register, and the "align when E10 lands" promise is unmet.** Minor, needs-user (brand register). The known
item said this address "must match E10's shapes". E10 is now built and its Fernside register is:
`fernside.example` (genuine), `orders.fernside.example` (genuine portal), `orders-fernside.example`
(look-alike portal) (`e10/defend.json:56,75,194`, `e10/BRAND_ADDITIONS.md`). E19 uses a fourth shape,
`accounts@fernside-invoices.example` (`e19_enable_content`: erb `:192,:202-203`; fragment `e19/defend.json:99,104`),
and both `BRAND_SET.md:284` and the fragment note (`e19/defend.json:98`) still say to align it with E10
"when it lands". They do **not** clash in a learner-facing way: E19 never reuses the genuine `fernside.example`
as a phish, and `fernside-invoices.example` reads clearly as a separate registrable look-alike (and the
scored tells on that card are `macro_enable_content`/`secrecy_or_bypass`, not the domain, so a learner who
misses the address still catches the card). The only issue is housekeeping: two different Fernside
look-alikes now exist across the course with a stale "to be aligned" note. Fix (user choice): accept it as
a deliberate second look-alike (an order-portal shape like `orders-fernside.example` would not fit an
invoice-email sender, so a distinct invoice look-alike is arguably the better choice) and update
`BRAND_SET.md:284` and `e19/defend.json:98` to record it as intended rather than pending; **or** re-point
E19 to an E10-derived shape. I lean to accept-and-record. Non-shipping text either way.

**MI3. The folded `_moduleLine` / `_orgSlotLine` notes are now stale in the fragment.** Minor, needs-user
(doc hygiene). `e19/defend.json:183-184` still carry the two long `_`-prefixed notes describing the module
line and org-slot line as un-placed ("held here as final text for the orchestrator to place"), but both
were folded into the Monday card (confirmed in MI1's "what works" entry and `BUILD_LOG.md:84`). The notes
are `_`-prefixed planning text, stripped from the shipped erb, so there is no learner or runtime impact;
they are only misleading to the next reader of the fragment. The ruling to fold is already logged in
`BUILD_LOG.md`. Fix: when the fragment is next touched, shorten both notes to "folded into the Monday card
(BUILD_LOG 2026-10-29)". Outside my read-only remit; flagged for the user.

**MI4. "infostealer" is unglossed jargon on a non-technical first read in the montage.** Minor,
episode-local. The `security_alert` montage lines (`:425-426`) use the bare noun: "Allowing it let an
infostealer run, quietly..." and "an infostealer would have run unseen and copied your saved passwords."
The word is immediately explained by what it does in both lines, and the montage is unscored flip content,
so it is survivable, but a clerk meets the term cold (it is not in any concept card, and the glossary is
`closed`). Fix (optional): soften to a description, old "Allowing it let an infostealer run, quietly."
-> new "Allowing it let a hidden program run, quietly, one built to copy your saved passwords." and old
"an infostealer would have run unseen and copied your saved passwords" -> new "a hidden program would have
run unseen and copied your saved passwords". Keeps the teaching, drops the cold noun. Low impact.

## Notes (not findings)

- **Awareness-profile scoring.** As with the whole built set and flagged in E8_DESIGN_C2, under
  `scoringProfile: "awareness"` a genuine item scores full whether Trusted or Reported, so refusing
  everything still scores 100%. The brief's "refusing everything doesn't win" is met pedagogically here
  (the row 1/2 mirror, the row 6 calibration, immediate feedback, the two `falseAlarmCost` lines), not
  through the number. Not an E19 defect.
- **Safe-option position varies by beat** (`restart_prompt` safe@1, `enable_content` safe@0,
  `security_alert` safe@1, `save_location` safe@0), so the sandbox cannot be gamed by always picking the
  same slot. Good, and matches the `BUILD_LOG` ruling.
- **Breadth.** core_07 is near the top of what one 15-minute episode can hold (five sub-topics, four
  concept cards, a multi-clause Monday card). The spine in "What works" carries it, but this is the episode
  most reliant on that spine; a timed full-episode playtest is the honest way to confirm the 15-minute
  budget, which the bridge does not measure.
- **Both genuine items carry `whyFine` and `falseAlarmCost`**, and item 3's `isPhish: true` is the scoring
  vehicle for a sign-of-compromise (the E8/E9/E18 convention), correctly documented in the fragment `_note`.

## Verdict

**Ship-worthy as the pilot, pending the user's call on two housekeeping items.** No blockers, no majors.
Both shells validate clean under `--strict-social --no-graph --skip-ink`, dialoguelint and E19's own
parity/rule-of-thumb subtests pass, and the full bridge is 15/15 with the mistake sandbox, the montage
(single `restart_prompt` headline, all four beats), the six-item defend set, the four-card debrief and the
conclusion global all rendering and firing as designed. The lesson has a clear spine, the facts match
core_07's `concepts.md`, the E8/E10 boundaries are respected, the mirror pair and calibration are strong,
and the no-blame register is clean. The Monday-card fold (the first known item) reads well. The four minors
are all low-impact: a dropped content-warning line with no engine slot (MI1), a brand-register decision on
the second Fernside look-alike now that E10 is built (MI2), two stale `_`-notes in the fragment (MI3), and
one cold "infostealer" in the montage (MI4). None blocks ship. Recommend the user decide MI1 and MI2,
fold MI3/MI4 into the next fragment touch, and run one timed full-episode playtest to confirm the budget.
