# Lab: Phishing and Social Engineering — Dialogue review, formal cycle 5 (final)

Fresh reviewer, read-only. No ink, scenario or test file edited; nothing committed.
Scope: the ink for Ruth, Ruth's phone, Fairbairn, Tomasz, Dev (the pretext call),
and the Pierce/Lord/Hampshire mail; plus the player-facing scenario text (barks,
hints, OSINT/recon cards, mail replies, the report, triage, the SOC/defender copy
and the credits). Ran the `npc-dialog-review` skill in full, then read the whole lab
through in player order (Ruth's briefing → the credits) as a first-time student.

Judged as a game for cyber security students: fun, warm, dry, educational, not preachy.
Caps applied (this brief): 30 words in person, 25 by phone. This is the fifth and last
planned cycle (POLISH_PLAN.md order step 3).

## Verdict and counts

- **Blockers: 0**
- **Majors: 0**
- **Minors: 0 new** (the two C4 minors are both fixed and verified below)
- **Worth considering: 2**, both already judged "leave" in C4 and reaffirmed here — neither blocks closure.

**Verdict: close the dialogue stage.** Cycle 4 (committed in `2c8fab10c`) holds and broke
nothing; all five of its edits are in place and verified against the ink, the barks, the mail
and the runtime. The whole-run read turns up nothing above worth-considering, and the two
worth-considering items are the ones C4 deliberately left. Per AGENTS.md / POLISH_PLAN
("stop when a cycle finds nothing above minor"), this cycle clears that bar: it found nothing
new above minor. A fifth design pass is not earning its keep — the voice is consistent, the
humour lands, the teaching is accurate, and the cross-stage echoes that three earlier cycles
could not see on piecemeal edits are now resolved. Hand off to the playtest loop.

## Phase 1 — compile, validate, lint, runtime

- **Compile: 7/7, 0 failed.** The only warning is the expected `-> END` at `tomasz.ink:147`
  (closing debrief → credits) — a legitimate endpoint. `dev_service_desk.ink` ends cleanly at
  its hang-up/ring-back knots. No action.
- **No "apparent loose end" warnings.**
- **Validator (`--skip-ink --no-graph`):** no errors, no missing recommended fields. The only
  warnings are the three pre-existing `mutuallyExclusiveGlobals` notes on Ruth's
  `phish_*_landed` eventMappings (indices 10/16, 11/17, 15/18) — left alone across every cycle
  per the brief; owned by `scenario-design-review`, not dialogue-facing. The Recon-bark
  mappings are **not** among them (see the fire-once check below).
- **dialoguelint:** one finding only — `phone-self-prefix` on `fairbairn.ink:69`, the known
  false positive (the lint reads Fairbairn, an `npcType: "person"`, as a phone contact; the
  `Ruth Adeyemi:` prefix is a legitimate second speaker in the signing two-hander). **Do not
  drop it.** No line-length errors. Per-file maxima: ruth 25, tomasz 28, fairbairn 25,
  ruth_phone 23, dev 22 — all within 30-person / 25-phone.
- **loopcheck (200 steps × 6 strategies):** clean on every conversational/stage entry knot —
  `ruth@start`, `ruth@hub`, `ruth_phone@hub/stage3/stage4/stage5`, `fairbairn@start`,
  `fairbairn@hub`, `tomasz@start`, `tomasz@hub`, `dev_service_desk@start`. No starved knots, no
  runtime errors. (Dev ends cleanly on 5/6 strategies — correct for a hang-up call.)
- **Committed state:** `git diff --stat HEAD` on the lab ink and `scenario.json.erb` is empty,
  so this reviews the committed cycle-4 state (`2c8fab10c`). No `tagdiff` of a rewrite needed.

## Cycle-4 changes — all five hold, nothing broke

1. **Both Recon barks are a plain nudge — CORRECT.** `scenario.json.erb:1454` and `:1456` both
   read `Plan's signed off. Come and grab the Recon key when you're ready.` No longer share the
   opening clause with Ruth's in-person hand-over (`ruth.ink:156`, "Plan holds up, and Gareth's
   signed. Here's the Recon key..."). The teaching rider ("Open-source intelligence only...")
   stays only on Ruth's line, as intended.
2. **Phone stage-3 door line varied — CORRECT.** `ruth_phone.ink:131` now reads `Operations
   next, if you've not been in. The key's with me whenever the door won't open.` — no longer
   rhymes word-for-word with stage 2's "If that door's locked, I've got the key — come and see
   me." (`ruth_phone.ink:113`). Still points the student back to Ruth for the key. The `else`
   steer (`:133`) and the choices are unchanged.
3. **Gareth's `why` no longer retells the invoice — CORRECT.** `fairbairn.ink:92` now reads
   `Because next time it won't be caught, and I'd rather learn that from you than a thief.` The
   old version re-told the invoice incident that the briefing (`ruth.ink:63`) already gives.
4. **Hampshire's reply has character — CORRECT.** `scenario.json.erb:710` reads `Cheers,
   straight onto the Friday pile with the rest.` — verified as a clean callback to the recon
   fact `hampshire_cv_backlog` (`post_hampshire_cvs`, erb:615, "So many CVs to get through
   before Friday"; doneString erb:671). Mail-UI text, not voiced.
5. **handle_decoy returns a dry dead end — CORRECT.** `scenario.json.erb:643` now returns one
   result, `@mpierce_official: parked account, no posts since the day it was made. Not Melanie —
   anyone can register an official-looking handle.` It grants no `fact`, so it remains a true
   dead end (no gating change) while teaching the lesson and rewarding the click.

### The two checks the brief called out

- **The paired Recon barks still fire exactly once.** Two mappings (`erb:1454`, `:1456`) are a
  paired-but-exclusive pattern: one fires on `plan_done` changing when `fairbairn_condition_heard`
  is already true, the other on `fairbairn_condition_heard` changing when `plan_done` is already
  true. Each global changes exactly once, so whichever is set **last** satisfies its mapping's
  `condition` and fires; the other mapping's trigger already passed earlier, while its AND-partner
  was still false, and never re-triggers. Exactly one bark fires regardless of order, and
  independently of `onceOnly` consumption semantics. Confirmed against the two conditions and the
  single-write nature of both globals. (The validator's `mutuallyExclusiveGlobals` warnings are on
  the `phish_*_landed` mappings, a different set — not these barks.)
- **The payoff still has its briefing setup now that `why` is trimmed.** Gareth's payoff
  (`fairbairn.ink:78`, "the one who nearly wired that invoice to a spoofed supplier last quarter")
  is paid off by the **briefing** (`ruth.ink:63`, "Last quarter one of Gareth's team nearly wired
  a five-figure invoice to a spoofed supplier"), which every player hears on load and which is
  unchanged. The `why` topic was never the setup — it was a redundant second telling of the same
  incident. Trimming it removes the redundancy and leaves the payoff's setup intact. Confirmed.

## Whole-lab read-through — voice, humour, warmth

Read in player order: Ruth's briefing and the sign scene, Recon/OSINT, the two easy sends, the
page-and-call stage, the Sofia send, the report, the defender flip, and Tomasz's close into the
credits.

- **Voice stays consistent across the run.** Ruth the boss who cares about the client and the
  sheet (never a quizmaster); Gareth soft, formal, protective of his floor; Tomasz dry and
  under-budget; Dev bright and chatty; Melanie sharp (the career-changer); Sofia young and
  eager. Nothing drifts.
- **The jokes still land and don't crowd each other** — Tomasz "me and half a person's budget" /
  "talked him down to the executive summary"; Dev "first payslip's always a faff"; Gareth
  "enjoying this more than he lets on"; the OSINT flavour (the dead kettle in Careers; Sofia's
  "Grown up now."); the own-send report replies; Ruth's "Still here. Earning my fee."
- **The warmth lands.** Gareth's "If someone clicks, that's my training's fault, not theirs",
  the no-names payoff and the over-promised-anonymity callback read as earned, not preachy.
- **The invoice through-line now bookends without a near-repeat.** Briefing (`ruth.ink:63`) →
  payoff (`fairbairn.ink:78`) → triage `supplier_bank_change`. The C4 worry (the `why` topic
  re-telling the incident mid-briefing) is gone.
- **Teaching stays accurate and in character** — SPF/DKIM/DMARC (`tomasz.ink:69-70`), the
  padlock card, the report `why` strings explaining each wrong answer as the control gap it
  hides. Earned facts (LedgerPay, the portal name/date) come only from Dev, never leaked by a
  hint; the own-send reveal (`tomasz.ink:80-81`) remains the strongest beat.
- **The two cycle-4 ink edits introduce no new echo** on a full read, with one note below (WC-5-1).

## Worth considering (no change recommended; recorded so a later reader doesn't "fix" them)

### WC-5-1 — `fairbairn.ink:92` (why) echoes the briefing's "next one" fear — LEAVE
The reworked `why`, "Because next time it won't be caught...", restates the fear Ruth voices in
the briefing (`ruth.ink:64`, "He's scared the next one gets through"). This is intentional and
reads as a confirming beat, not a copy: a different speaker, different phrasing, and it's opt-in
(the player chose to ask Gareth directly). Gareth owning in his own words the fear Ruth described
strengthens the scene. It is a far milder overlap than the concrete invoice anecdote the C4 fix
removed. No change — recorded only so a future cycle doesn't flip it back or over-correct.

### WC-5-2 — Blue-Team bark vs Ruth's hand-over share "Report's filed" — LEAVE (as C4)
`scenario.json.erb:1462` ("Report's filed. The Blue Team key's ready, and Gareth wants a word.")
opens with the same two words as `ruth.ink:168/170` ("Report's filed, and Gareth's read it..."
/ "Report's filed. Gareth's reading it now..."). C4 judged this borderline and left it; it is a
two-word factual overlap, the bark carries distinct information (key ready + Gareth wants a
word), and a reword risks implying a false "first" ordering. Reaffirmed: leave.

## What's working (keep)

- All five cycle-1/2 re-gated conditions and the three cycle-3 changes fire on exactly their
  routes; hub ordering stays specific-before-general. `pretext_call_done` implying ≥1 Lord fact
  means every "you've got the portal / the date" steer is always true on its route — no stale
  assertion.
- Choice/reply matches are clean; every spoken exit choice has a one-line NPC reply; the
  point-of-no-return warning (`tomasz.ink:96-108`) honours "warn before the ending".
- The over-promised-anonymity callback (`fairbairn.ink:79-81`) and the own-send reveal
  (`tomasz.ink:80-81`) remain the strongest beats. Leave exactly.

## Spoken lines changed across cycles 1–4 — the TTS re-voice list

TTS is skipped this pass (POLISH_PLAN), so this is the forward record for whenever audio runs.
Taken from DIALOG_LOG.md and **checked line-by-line against the current committed ink/erb**
(every entry below was found at the cited location with the exact NEW text). All are fixed
strings with no printed variables, so each is cacheable. 14 distinct changed spoken texts:

**fairbairn.ink — Gareth Fairbairn and Ruth Adeyemi (the two-hander sign scene + payoff/why)**
1. `fairbairn.ink:69` (Ruth, C1 M1): `That signature is the difference between a test and a crime. Without it, you're committing an offence under the Computer Misuse Act.`
2. `fairbairn.ink:78` (Gareth, C1 M7): `She'll read it too, the one who nearly wired that invoice to a spoofed supplier last quarter. Nothing in it points at her. Thank you.`
3. `fairbairn.ink:80` (Gareth, C1 W1 — NEW conditional line): `You nearly promised nobody'd ever know, that first morning. I asked for the promise we could keep. You kept it.`
4. `fairbairn.ink:92` (Gareth, C4 W-C4-1): `Because next time it won't be caught, and I'd rather learn that from you than a thief.`

**ruth.ink — Gareth Fairbairn and Ruth Adeyemi (briefing + hub)**
5. `ruth.ink:67` (Gareth, C2 m-C2-1): `Good answer. Get it right and I'll put my name to it.`
6. `ruth.ink:195` (Ruth, C2 R11 F5 — NEW hub line): `Sofia's in, but the report needs all three. Whoever's left still has to act before you can write it up.`
7. `ruth.ink:201` (Ruth, C1 M3): `Dev's manager rang Gareth about a dodgy call. Gareth kept a straight face. Give the desk a minute, then ring back softer.`
8. `ruth.ink:215` (Ruth, C2 m-C2-2): `Sofia checked the sender, the portal's name and the date. All three were right. Her own service desk handed us every one. That's your finding.`
9. `ruth.ink:222` (Ruth, C2 w-C2-1 — third alternation only): `Still here. Earning my fee.` (within `{&Need me?|Something else?|Still here. Earning my fee.}`)
10. `ruth.ink:263` (Ruth, C2 R11 F4 — split line a): `Chris's careers inbox takes anything.`
11. `ruth.ink:266` (Ruth, C2 R11 F4 — split line b): `Melanie's trickier — you'll have to work out what gets past her.`

**ruth_phone.ink — Ruth Adeyemi (phone hint hub)**
12. `ruth_phone.ink:131` (Ruth, C4 M-C4-2): `Operations next, if you've not been in. The key's with me whenever the door won't open.`
13. `ruth_phone.ink:133` (Ruth, C3 M-C3-2 — NEW stage-3 else line): `The rest still have to act in Operations before there's a report.`

**scenario.json.erb — Ruth phone bark**
14. `scenario.json.erb:1454` and `:1456` (Ruth bark, C4 M-C4-1 — identical text, both instances): `Plan's signed off. Come and grab the Recon key when you're ready.`

**Not in the TTS list (not voiced):** the C1 M6 and C2 F4/C4 player-choice labels; the Hampshire
mail reply (`erb:710`) and the handle_decoy result card (`erb:643`), both UI text. The lockout
lines whose **gate** changed in C2/C3 (`ruth.ink:201` is listed above for its C1 text; the
`ruth_phone.ink` stage-4 lockout text was never changed, only re-gated — no re-voice).

## Out of scope this cycle

- Voices/TTS: no `voice` blocks defined; audio skipped this pass. The list above is the forward
  re-voice record, not a dialogue finding.
- Structure/solvability, the `mutuallyExclusiveGlobals` behaviour on Ruth's `phish_*_landed`
  mappings, outcome/sticky mechanics, room/geography: owned by `scenario-design-review` and
  `mission-puzzle-chains`.
