# Lab: Phishing and Social Engineering — Dialogue review, formal cycle 4

Fresh reviewer, read-only. No ink or scenario file edited; nothing committed.
Scope: the ink for Ruth, Ruth's phone, Fairbairn, Tomasz, Dev (the pretext call),
and the Pierce/Lord/Hampshire mail; plus the player-facing scenario text (barks,
hints, task titles, OSINT/concept cards, the report, the SOC/defender copy, triage
and credits). Ran the `npc-dialog-review` skill in full, then read the whole lab
through in order, as a student meets it (Ruth's opening → the credits).

Judged as a game for cyber security students: fun, warm, dry, educational, not preachy.
Caps applied (this brief): 30 words in person, 25 by phone.

## Verdict and counts

- **Blockers: 0**
- **Majors: 0**
- **Minors: 2** (both repetition across the run; neither is a regression; one is gate-free prose, one is a bark)
- **Worth considering: 3**

Cycle 3 (committed in `7e862a2db`) holds and broke nothing. The three cycle-3 changes
are verified below. The two minors are small cross-stage echoes that three cycles of
separate edits never touched — they are visible only on a full read-through, which is
what this cycle was asked to do. Everything else reads clean; the voice is consistent
and the humour still lands.

## Phase 1 — compile, validate, lint, runtime

- **Compile: 7/7, 0 failed.** Only warnings are the expected `-> END`s: `tomasz.ink:147`
  (closing debrief → credits) and `dev_service_desk.ink:69/76` (hang-up / ring-back
  endpoints). All legitimate. No action.
- **No "apparent loose end" warnings.**
- **Validator (`--skip-ink --no-graph`):** schema passes; room geometry and door
  alignment OK; no errors, no missing recommended fields. Everything surfaced is a
  SAFETYNET-mission suggestion (VM launchers, PIN/RFID locks, hostile NPCs) that does not
  apply to a social-engineering lab, plus the two "good practice" notes. Nothing
  dialogue-facing.
- **dialoguelint:** one finding only — `phone-self-prefix` on `fairbairn.ink:69`, the
  known false positive (the lint misclassifies Fairbairn, an `npcType: "person"`, as a
  phone contact; the `Ruth Adeyemi:` prefix is a legitimate second speaker in the signing
  two-hander). **Do not drop it.** No line-length errors. Per-file maxima: ruth 25,
  tomasz 28, fairbairn 25, ruth_phone 23, dev 22 — all within 30-person / 25-phone.
- **loopcheck (200 steps × 6 strategies):** clean on every conversational/stage entry knot —
  `ruth@start`, `ruth@hub`, `ruth_phone@hub/stage3/stage4/stage5`, `fairbairn@start`,
  `fairbairn@hub`, `tomasz@start`, `dev_service_desk@start`. No starved knots; no runtime
  errors. (dev ends cleanly on 5/6 strategies — correct for a hang-up call.)
- **Committed state:** `git diff --stat HEAD` on the lab ink and `scenario.json.erb` is
  empty, so this is a review of the committed cycle-3 state. No `tagdiff` of a rewrite needed.

## Cycle-3 changes — all three hold, nothing broke

### 1. Lockout line clears once either Dev fact is in — CORRECT
- Person: `ruth.ink:200` gates `pretext_call_reported and not se_intel_lord_portal_name and
  not se_intel_lord_payslip_date`. Phone: `ruth_phone.ink:155` carries the identical gate.
  The line shows only when Dev was reported **and neither** Lord fact is held, and clears
  the instant either lands. Confirmed against the gate, not just the log.
- No `else`-gap on the common sub-case: `pretext_call_done` is set **only** on a granting
  ask (`scenario.json.erb:849,851`), so holding one fact implies `pretext_call_done` is
  true, which means a specific steer always catches the player after the lockout clears —
  `ruth.ink:202` ("Call's done. Now the page") if the page isn't built, or
  `ruth.ink:208/:210` ("ring him back for the portal / the date") if it is. The fixer's
  feared drop-to-`else` cannot occur. Spoken text unchanged; no re-voice.

### 2. Phone stage-3 opener is conditional on any landing — CORRECT
- `ruth_phone.ink:130` wraps the door/key opener in `not (phish_hampshire_landed or
  phish_pierce_landed or phish_lord_landed)`, with an `else` steer ("The rest still have to
  act in Operations before there's a report.", L133). The backward-reading "if that door's
  locked" now shows only at true first entry to Operations; once anything has landed, the
  else steer takes over — fixing the Sofia-first edge route M-C3-2 named.

### 3. The unreachable "reported, not got_it" branch kept as a commented safety net — CORRECT
- `tomasz.ink:118-121` carries the `//` comment and `scenario.json.erb:174` the matching
  `<%# %>` ERB comment, both recording that the branch is a deliberate safety net
  (`got_it` is sticky, so reaching the debrief forces the `got_it` branch above it). The ERB
  renders and the JSON parses (validator clean). Dead-but-correct text, as intended.

## Whole-lab read-through — voice, humour, warmth

Read in player order: Ruth's briefing and the sign scene, the Recon/OSINT stage, the two
easy sends, the page-and-call stage, the Sofia send, the report, the defender flip, and
Tomasz's close into the credits.

- **Voice is consistent across the run.** Ruth stays the boss who cares about the client
  and the sheet (never a quizmaster); Gareth soft, formal, protective of his floor; Tomasz
  dry and under-budget; Dev bright and chatty; Melanie sharp (the career-changer); Sofia
  young and eager. Nothing drifts.
- **The jokes still land and don't crowd each other** — Tomasz "me and half a person's
  budget" / "talked him down to the executive summary"; Dev "first payslip's always a
  faff"; Gareth "enjoying this more than he lets on"; the OSINT flavour ("The kettle in
  Careers has died. Send help."; Sofia's "Grown up now."); the own-send report replies
  ("Sent from a workstation in our own Operations Room, funnily enough"; "Good page, that.
  Shame about the address"); Ruth's "Still here. Earning my fee."
- **The warmth lands.** Gareth's "If someone clicks, that's my training's fault, not
  theirs" and the no-names payoff (and the extra over-promised-anonymity callback) are the
  emotional spine, and they read as earned rather than preachy.
- **The invoice through-line bookends cleanly** — briefing (`ruth.ink:63`) to payoff
  (`fairbairn.ink:78`) and the triage `supplier_bank_change` ("how Ledgerwell nearly lost a
  month's billing", `scenario.json.erb:986`). See W-C4-1 for the one place it sits a touch
  close.
- **Teaching stays accurate and in-character:** SPF/DKIM/DMARC (`tomasz.ink:69-70`), the
  list-mail "DKIM survives, SPF fails" note (`fwd_balance_sheet`, erb:1022/1028), the
  padlock card, and every `blame: true` wrong answer explained as the control gap it hides
  (report `why` strings). Earned facts (LedgerPay, the portal name/date) still come only
  from Dev, never leaked by a hint.

---

## Minors

### M-C4-1 — scenario.json.erb:1453/1455 (bark) vs ruth.ink:156 — SPOKEN — the Recon key is confirmed twice, near-verbatim
The phone bark that fires when the plan and the signature are both in, and Ruth's in-person
key hand-over, open with almost the same clause:

> *(phone bark, erb:1453 and :1455, SPOKEN)* `Plan's good and Gareth's signed. The Recon key's ready for you.`
> *(in person, ruth.ink:156, SPOKEN)* `Ruth Adeyemi: Plan holds up, and Gareth's signed. Here's the Recon key. Open-source intelligence only: what anyone could find, nothing behind a login.`

This is the skill's "a bark and the line it opens" pattern (§2i): the player reads the text,
walks over, and hears "Plan('s good / holds up), and Gareth's signed" again. The in-person
line carries a teaching rider the bark doesn't, so it isn't pure duplication, but the shared
opening clause is the tell. Keep the content on Ruth's line and make the bark a plain
nudge-to-collect. Both are within the phone cap.
> **Proposed (erb:1453 and :1455, keep them identical):** `Plan's signed off. Come and grab the Recon key when you're ready.`

(The two barks are a paired-but-exclusive pattern — only one fires per run — so they must
stay the same text as each other; change both.) The Operations and Blue-Team barks are a
milder case of the same thing: `erb:1461` "Report's filed. The Blue Team key's ready…"
opens with the same two words as `ruth.ink:168/170` "Report's filed, and Gareth's read it…".
The Recon pair is the one worth fixing; the Blue-Team echo is borderline and can be left.

### M-C4-2 — ruth_phone.ink:113 and ruth_phone.ink:131 — SPOKEN (Ruth, phone) — the same door-pointer clause on two consecutive stages
Stage 2 and stage 3 open with an identical "if that door's locked" clause:

> *(stage2, L113)* `Recon's next. If that door's locked, I've got the key — come and see me. The OSINT workstation's through it.`
> *(stage3, L131)* `Operations now. If that door's locked, I've got the key — come and see me.`

The door-pointer is deliberate scaffolding (the file header: each stage names the next key
to collect), but a student moving stage 2 → stage 3 hears the clause "If that door's locked,
I've got the key — come and see me." word-for-word twice in a row. Vary stage 3's phrasing
so the two don't rhyme; the pointer stays.
> **Proposed (ruth_phone.ink:131):** `Operations next, if you've not been in. The key's with me whenever the door won't open.`

(Within the 25-word phone cap. Stage 3's `else` steer and choices are unchanged.)

---

## Worth considering

### W-C4-1 — ruth.ink:63 (briefing) and fairbairn.ink:92 (why topic) — the invoice story twice in the opening phase
The briefing's "nearly wired a five-figure invoice to a spoofed supplier" (`ruth.ink:63`)
and Gareth's optional `why` reply "one of mine nearly wired away a month's billing, and I'd
rather learn it from you than a thief" (`fairbairn.ink:92`) are both in the opening phase,
so a curious player who asks Gareth "Why bring in a firm…?" right after the briefing hears
the same incident within a minute. It's opt-in (the player chose to dig), and the payoff at
the end needs the setup, so this is low value — but if a polish cycle wants it, Gareth's
`why` could give a different angle (the fear, not the incident), e.g. *"Because next time it
won't be caught, and I'd rather learn that from you than a thief."* Optional.

### W-C4-2 — scenario.json.erb:709 — Chris Hampshire's landed reply is flatter than Melanie's and Sofia's
On a full read the three landings sit together, and Chris's is the plainest:

> Hampshire (erb:709, NOT spoken — mail-UI reply): `Thanks, I'll get to this CV before Friday.`
> Pierce (pierce_mail.ink:36, NOT spoken): `Thanks Jed — that's the one I was chasing. Opening it now.`
> Lord (lord_mail.ink:34, NOT spoken): `Oh, my first payslip! I've been waiting for this. Logging in now.`

This is defensible — the careers inbox "takes anything", so an impersonal auto-reply fits
the lesson — but it ties neatly to the recon fact the player found (Chris racing CVs before
Friday), so it already has a small callback. Leave as-is unless a cycle wants one more beat
of character; if so, lean on the backlog: *"Cheers — straight onto the Friday pile with the
rest."* Optional, UI text (not voiced).

### W-C4-3 — reward-curiosity note (no change) — the OSINT decoy yields nothing
`handle_decoy` ("Handle search: @mpierce_official", erb:640) returns an empty `results`
array. As a teaching beat (not every lead pays off) that's fine and probably intended, but a
one-line "no match / parked account" result card would reward the click and still teach the
lesson. Noted only; not a dialogue defect.

---

## What's working (keep)

- All five cycle-1/2 re-gated conditions and the three cycle-3 changes fire on exactly their
  routes; the hub ordering stays specific-before-general. `pretext_call_done` implying ≥1
  Lord fact means every "You've got the portal / the date" steer (person `:208/:210`, phone
  stage5 `:181-186`) is always true on its route — no stale assertion.
- Choice/reply matches are clean everywhere; every spoken exit choice has a one-line NPC
  reply; the point-of-no-return warning (`tomasz.ink:96-108`) honours the "warn before the
  ending" rule; barks are paired-but-exclusive, so no double-bark.
- The over-promised-anonymity callback (`fairbairn.ink:79-81`) still reads naturally and
  fires only on its route.
- The own-send reveal (`tomasz.ink:80-81`, "The headers had you the whole time") and the
  triage `own_pierce`/`own_lord` report replies remain the strongest beats — the attacker's
  own sends become the defender's evidence. Leave exactly.

## Out of scope this cycle

- Voices/TTS: no `voice` blocks defined; POLISH_PLAN skips audio. The spoken-line tags above
  are for the TTS list if the two minors are actioned. Not a dialogue finding.
- Structure/solvability, the pre-existing `mutuallyExclusiveGlobals` behaviour on Ruth's
  phish_*_landed eventMappings, outcome/sticky mechanics, room/geography: owned by
  `scenario-design-review` and `mission-puzzle-chains`.
