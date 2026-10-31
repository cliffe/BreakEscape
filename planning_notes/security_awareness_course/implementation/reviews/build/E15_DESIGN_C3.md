# E15 "Shadow IT": design review C3 (+ dialogue)

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no runtime language model. E15 is a
consequence-flip episode (ENG-04): four unscored sandbox choices, a montage flip, then the built
inbox-triage defend half, the unscored Swap Shop sort drill (ENG-11) inside the defend stage, and the
built debrief. Company Tarrowby Logistics; host Nilesh Solanki (IT service desk); module core_13. Method
and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review`/`npc-dialog-review` skills adapted to this
kind, and the C1/C2 reviews plus the P1 persona and B1/B2 blind reports in this folder.

This pass judged the files fresh and paid particular attention to what the engine batches and the blind
fixes changed since C2: E15's replaced Choices beats, the new Swap Shop cards, the critical-miss penalty,
the result breakdown and the confirm prompt. I did **not** run a new bridge this pass; I judged the
screens from the authored data, the erbs and the engine code, and I leaned on the C2 render (game 4858,
27/27) and the B2 blind run (games 5212/5225/5232) for the montage and the defend flow. Where a finding
turns on on-screen behaviour I say so.

Ran (all E15-only, all green):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema and strict-social
  pass; only the generic m01-shaped SUGGESTION noise and the one "no timedConversation" recommended-field
  note every one-room awareness kiosk draws. Nothing social.
- `dialoguelint.mjs` both shells: full `lines=6 median=15 p90=17 max=17`; defend `lines=3 median=25 p90=28
  max=28`. No rule hits; every host line under the 30-word voicing guide.
- `social-awareness-fragment-erb-parity.test.mjs`: **20/20 pass** (E15 included). The erb-only montage
  (`flipMontageByChoice`) carries the new beat ids and matches the fragment byte for byte.
- `social-awareness-rule-of-thumb.test.mjs`: 2/2 pass (rule of thumb byte-identical across the set).
- No em or en dashes in any learner-facing E15 copy. No raw printed variables.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 3 | 1 | 1 | 1 |
| **Total** | **3** | **1** | **1** | **1** |

Episode shape unchanged: full = 5 stages (`brief, mistake, flip, defend, debrief`); defend-only = 3. Defend
set `e15_shortcuts_inbox`, 6 items (4 action-needed, 2 genuine), mirror pair at rows 4/5. Four `mistake`
beats, montage over all four, `flipBeat: personal_email`. The Swap Shop drill (4 cards into 4 bins,
unscored) sits in both shells. Both shells carry the byte-identical rule of thumb.

## C2 and the batch/blind changes since — closure

| Item | What was wrong | Verified now | Status |
|---|---|---|---|
| **C2 D1** (major) | the four unsafe montage lines opened "Your choice.", duplicating the engine's "Your call" tag | the four unsafe lines (frag `full_only.json:89/93/97/101`, erb `:493/497/501/505`) no longer carry the prefix; they open on the consequence. The four safe lines now lead with what happened on the taken road, then the counterfactual ("Through remote access the pack never left the firm... The version where it went to a personal inbox instead..."), which also closes P1 F-E15-8. | **Closed** |
| **C2 D2** (minor) | dead `handoff` ink knot | gone from `ink/nilesh_solanki.ink`; the file is now hub-only (welcome / after / done), no unreachable knot. | **Closed** |
| **Replaced Choices beats** (B2 fix) | the old sandbox reused the defend-set scenarios, telegraphing the answers | the four beats are now `personal_email`, `drivers_chat`, `visitor_stick`, `rota_app` (frag/erb), distinct from the defend set and from the Swap Shop; exactly one `safe:true` per beat; the safe option is placed 1st/2nd/2nd/1st so it is not always first. The montage keys match the new beat and option ids one-for-one. | **Sound** |
| **New Swap Shop cards** | — | four new cards (`sw_partner_computer`→`laptop_remote`, `sw_signed_contract`→`fileshare_link`, `sw_site_photos`→`team_space`, `sw_old_laptop`→`hand_to_it`), each a real bin, each with a sound one-line reason; distinct from the Choices beats so the middle no longer runs the same four scenarios three times. | **Sound** (nit N1) |
| **Critical-miss penalty** (B1 fix) | all four risky items were critical, so a rushed run floored at 0 | `scoring.criticalPenalty: 10`; only `e15_posted_stick.truth.critical` stays true (a plugged-in stick runs code with no further step); the other three risky items are `critical:false`. The `_critical` note documents the call. Proportionate, and B2's struggling run scored 23% (low, not zero). | **Sound** |
| **Result breakdown + de-phish** (P1 F-E15-1/2) | the result named the genuine item as a second mistake and spoke "phish" throughout | `resultCopy.caughtBreakdown:true`, `criticalLead`, `reportedPct`, `noFlags`/`noFlagsLead`; `labels.verdict.*.hint`, `teamBadge`, `teamBadgeTitle`, `phishCaughtLabel` ("Caught in time"), `scoreLine` all reworded for sticks and shortcuts. The engine `teamProtectedCount()` only counts phish items reported/verified (not genuine, not deletes), so the `teamLine` "{n} of the risky ones" is accurate (B2 D6 resolved). | **Closed** |
| **Debrief recap of wrong sandbox picks** (batch 11) | — | the montage ("Where it led") plus the debrief name every miss (B2 timeline + "the debrief names every miss"); no recap string is missing. | **Sound** |
| **Habit-to-keep is the generic phishing line** (P1 F-E15-3 / B2 D3) | — | unchanged, by design: the rule of thumb is byte-identical across all 20 episodes (acceptance §17). The shadow-IT habit is carried by the Monday card and Nilesh's close. Product decision, see Notes. | **Carried (product)** |

## What works

- **The lesson is one a clerk can repeat on Monday, and it tracks core_13.** Found or posted stick to IT
  unplugged; work stays in work places; free is not free (no contract, no control, no off switch); if the
  official way is slow, ask IT; already using a workaround, tell IT, no blame. B2's blind tester left with
  exactly this ("a stick in the post goes to IT, not into my laptop... the approved way exists and IT will
  set it up quickly").
- **The sandbox, montage, defend set and Swap Shop now teach without telegraphing each other.** The B2
  complaint that stages 2 to 4 ran the same four scenarios is answered: the Choices beats, the defend
  items and the Swap Shop cards are three distinct sets that each land a core_13 message. The montage
  still replays the Choices (it must, it is their consequence), and the safe-route line now opens on the
  learner's own road.
- **The critical penalty is well judged.** One critical item (the posted stick, which runs code on a
  trusted-looking delivery), a 10-point penalty, the other risky items non-critical: a careless run reads
  low but not zero, and the no-blame-critical line ("a miss here says more about the pressure than about
  you") lands. B2's 23% run confirms the floor behaves.
- **The mirror pair is clean and the set does not reward refusing everything in teaching terms.** Row 4
  (an "everyone uses it" free-PDF lure, Report/Delete) is followed by row 5 (a genuine share-link from
  `fileshare.tarrowby.example` to a named person with an end date, Trust), and the set ends on the
  quick-yes IT reply (row 6). The genuine items carry `whyFine` and `falseAlarmCost`, so the cost of
  over-reporting is taught in words.
- **No-blame register throughout**, and the Swap Shop reads well cold (B2 defend-only scored 100% with no
  help). The "About that stick" reveal is kind and 54 words. Fictional-world hygiene is clean
  (`.example`, Ofcom drama numbers, `BRAND_ADDITIONS.md` records the web-search check).
- **Both shells validate with no social warnings; parity and the rule-of-thumb suite are green.**

## Findings

### D1 — the defend-only shell promises "never marked down" in the Mission Brief popup but "a real message does take a colleague's time to check" in the kiosk brief. Minor; needs-user (generator) / episode-local (erb).

The B2 D5 fix deliberately replaced the defend-only's "never marked down" with the "a real message does
take a colleague's time to check" line, to match the full episode and to make the Verify-has-a-real-cost
teaching honest. That landed in the fragment and in the kiosk brief: `defend.json` `_defendOnly.brief:292`
and the defend erb's episode brief (`scenarios/awareness_e15_shadow_it_defend/scenario.json.erb:409`) both
now read "...Reporting or checking when you're unsure is always fine, though a real message does take a
colleague's time to check." But the defend-only shell's **top-level `scenario_brief`** (the Mission Brief
popup; same erb `:4`) still reads "...is always fine and never marked down." — the un-updated generator
string `EPISODES['e15']['defend']['brief']` in `gen_e8_e17_shells.py`.

So in the defend-only shell the learner reads "never marked down" in the popup and "takes a colleague's
time" in the kiosk a moment later. The two are reconcilable (never docked in *score*, but a real cost in
*time*), but the whole point of the B2 fix was to stop sending mixed messages, and this is the one copy it
missed. Fix (align the generator string to the fragment, then regenerate the defend-only shell; do not
hand-edit only the erb or the next regenerate reopens it), old -> new in `gen_e8_e17_shells.py`
`EPISODES['e15']['defend']['brief']`:
`"...Reporting or checking when you're unsure is always fine and never marked down."` ->
`"...Reporting or checking when you're unsure is always fine, though a real message does take a colleague's time to check."`
(The full shell is consistent: its `scenario_brief:477` is a different summary that ends "Only the inbox
is scored", and its kiosk brief carries the colleague's-time line.)

### D2 — the confirm-prompt default copy says "Confirm again to move on", which reads as a required second action. Minor; engine (surfaced by E15's `confirmPrompt: true`).

E15 opts into the batch-11 nudge with `set.confirmPrompt: true` (`defend.json:26`, erb `:70`). With no
string supplied, the engine uses its default (`inbox-triage/inbox-triage-minigame.js:894`): "Tick what
made you decide, or choose 'Nothing looks wrong'. Confirm again to move on." B2's blind tester hit this on
a no-tick Confirm (B2 D2) and found a "Next message" button already present, so "Confirm again" read as a
contradiction, and they could not tell whether ticking was required. The engine's own comment
(`:874-877`) flags exactly this shape for the retrospective nudge, but the `confirmPrompt` line was not
given the same retrospective wording. `confirmPrompt` accepts a string, so the cleanest engine-side fix is
to make the default retrospective; failing that, E15 (and the other batch-11 sets) can pass its own
string, e.g. `"confirmPrompt": "Before you move on, it helps to tick what made you decide, or choose 'Nothing looks wrong'."`
Episode-local mitigation, engine root cause; low harm (both paths advance the round). Judged from the
engine code and the B2 report, not from a fresh render.

### D3 — the Swap Shop is four cards into four bins used once each, so the last card is forced. Minor; episode-local (nit-level, unscored).

`sortDrill.drawRules.oneOfEachAnswer:false` but there are exactly four cards each mapping to a distinct
bin, so once three are placed the fourth is deduced by elimination (P1 F-E15-12, B2 pacing note). It is an
unscored teaching drill and each drop still surfaces its reason, so the teaching lands either way;
harmless. Leave as is, or add a fifth bin / a spare card if the drill should feel less mechanical. Not
worth holding anything for.

## Dialogue pass (voiced host lines)

Both shells read as spoken. Nilesh's full-shell lines (welcome "Nilesh, service desk. Ask us first, we'd
rather help than clean up." / "That slow share? Tell us and we'll fix it. We can't mend what we don't know
about." / "Start at the kiosk. Play out the Friday, then sort what's actually waiting.", the completion
pair, and "Any time.") are all calm-colleague register, carry no printed variable, and sit under the guide
(dialoguelint max 17 full, 28 defend). The three defend-only lines run to 28 words, the same ceiling the
other defend-only hosts hug; I would leave them. No spoken line needs a change. D1 and D2 are on-screen
copy, not host lines.

Non-host learner copy read in full (both briefs, scope notes, the set brief, `defendIntro`, the four
sandbox situations and eight option labels, all eight montage lines, the six item bodies with
`perFlagNote`/`ifTrusted`/`reportReply`/`whyFine`/`falseAlarmCost`/`kindLine`/`missLabel`/`factorStrings`,
the Swap Shop cards and strings, the debrief `mondayCard`/`noBlameLine`/`conceptPanel`/`teamLine`/
`defendOnly`, the rule of thumb). UK English throughout, no em/en dashes, register consistent.

## Notes (not findings)

- **The rule of thumb is phishing-flavoured** ("move money, grant access, sign in or read back a code"),
  a loose fit for a shadow-IT episode about sticks and free tools, and it has now been the blind testers'
  top "worst line" at P1, B1 and B2. It is byte-identical across all 20 episodes by design (§17) and must
  not change here; the shadow-IT habit is carried by the Monday card and the host close. Conscious
  product decision, as in the E9/E11/E17 reviews — worth the product owner knowing it keeps drawing the
  same comment.
- **"Refuse everything" still scores well** under `scoringProfile: "awareness"` with `passPercent: 0`,
  met pedagogically by the two genuine items' `falseAlarmCost` and the brief's colleague's-time line.
  Product-wide property of the no-blame profile; real measurement runs through the `general_v2` check
  pair, not this set.
- **Timing over target.** P1 estimated ~16-17 min and B2 ~17-19 min against a 15-minute full budget, and
  both defend-only runs ~9-11 against 8. The sinks are the six-item inbox with feedback and the long
  debrief, same as E14/E16/E17. Not an E15 defect; a product-level pacing note across the wave. No fresh
  timed run this pass.

## Verdict per stage

| Stage | Full | Defend-only |
|---|---|---|
| brief | pass | pass (D1: popup vs kiosk wording) |
| mistake (sandbox) | pass (four beats map cleanly to core_13; one safe option each; order varied; distinct from the defend set) | — |
| flip (montage) | pass (C2 "Your choice." prefix dropped; safe lines lead with the taken road) | — |
| defend | pass (six items fair and matched; mirror pair; critical penalty proportionate; de-phished result; D2 confirm copy) | pass (D2) |
| debrief | pass (cards, concept-panel USB reveal, Monday card, no-blame line, accurate team line, rule of thumb) | pass |

**Ship-ready.** The one change C2 held ship on (the montage "Your choice." prefix) is done, the dead ink
knot is gone, and the batch/blind rework (new Choices beats, new Swap Shop cards, critical penalty,
caughtBreakdown, de-phish) is sound and consistent between fragment and erb. What remains is three minors:
one defend-only brief divergence the B2 fix missed (D1, the cheap one to clear), one shared confirm-prompt
copy wart E15 opts into (D2), and one unscored-drill nicety (D3). None blocks ship.

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 3 minor (1 episode-local, 1 engine, 1 needs-user).
- Closure: C2 D1 (montage "Your choice.") closed; C2 D2 (dead `handoff` knot) closed; replaced Choices
  beats, new Swap Shop cards, critical penalty, caughtBreakdown/de-phish all sound and fragment↔erb
  consistent; teamLine count accurate (B2 D6 resolved).
- Blockers: none.
- Majors: none.
- Minor D1 (needs-user): defend-only popup `scenario_brief` still says "never marked down" while the kiosk
  brief says "a real message does take a colleague's time" — update `EPISODES['e15']['defend']['brief']`
  in `gen_e8_e17_shells.py` and regenerate.
- Minor D2 (engine): `confirmPrompt:true` takes the engine default "Confirm again to move on", which reads
  as a required second step while Next is present (`inbox-triage-minigame.js:894`); make it retrospective
  or pass a string.
- Minor D3 (episode-local, nit): Swap Shop is four cards into four bins used once each, so the last is
  forced; harmless in an unscored drill.
- Verdict: ship-ready. Validators/parity/dialoguelint green; montage + defend flow judged from code and
  the C2 render (4858, 27/27) and B2 blind runs, not a fresh bridge; a timed playtest is still owed for
  the budget check.
