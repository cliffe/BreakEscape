# Lab: Phishing and Social Engineering — Dialogue review, formal cycle 1

Fresh reviewer, read-only. Scope: the ink for Ruth, Ruth's phone, Fairbairn, Tomasz,
Dev (the pretext call), and the Pierce/Lord mail; plus the player-facing scenario text
(barks, hints, task titles, OSINT/concept cards, the report and SOC/defender copy,
triage and credits). Ran the `npc-dialog-review` skill in full.

Judged as a game for cyber security students: fun, warm, dry, educational, not preachy.

## Verdict and counts

- **Blockers: 0**
- **Majors: 0**
- **Minors: 9** (five of them a single line-length cluster)

This is a polished draft (it has had three ad hoc dialogue cycles already). Nothing blocks
play or breaks a promise. The ink all compiles, no knot starves, every gating global is
declared and read, no critical-path choice soft-locks, and every speaker prefix resolves.
The findings below are tightening and two optional "reward curiosity" ideas.

Cap note for the fixer: the task brief states a 25-word house cap. The ink files' own stated
convention is **25 for phone lines, 30 for person lines** (see each file's header comment).
Phone lines (Dev, Ruth's phone, barks) are all disciplined and under 25. The over-length
findings below are person lines sitting in the 27–31 band — within the files' 30 convention
but over the brief's 25. Confirm which cap governs; tomasz.ink:117 (31w) is over either way.

## Phase 1 — compile, validate, lint

- **Compile: 7 files, 0 failed.** `-> END` warnings on `dev_service_desk.ink` (L69, L76 — a
  phone call that hangs up and restarts via `restartAfterEnd`) and `tomasz.ink` (L143 — the
  closing debrief, a deliberate endpoint into the credits). Both legitimate; no action.
- **No "apparent loose end" warnings.**
- **loopcheck:** all five conversational files pass at `start` with no runtime errors over
  200 steps × 6 strategies (ruth, ruth_phone, fairbairn, tomasz, dev). Also ran ruth_phone at
  `stage3`, `stage5`, `stage7` (the knots the engine resumes a reopened phone at) — all clean.
  No starved knots; every re-enterable hub/stage keeps an unconditional sticky exit.
- **Attribution:** every `Name:` prefix resolves exactly to an NPC id/displayName — Ruth
  Adeyemi, Gareth Fairbairn, Tomasz, Dev, Melanie Pierce, Sofia Lord, plus Narrator. Confirmed
  against `scenario.json.erb`.
- **State integrity:** the six `#set_global`s in the ink (sends_done, engagement_closed,
  fairbairn_condition_heard, fairbairn_payoff_heard, phish_pierce_landed, phish_lord_landed)
  are all declared in `globalVariables` and all read later. `sends_done` gates the report
  workstation (`requiresGlobal`, scenario L1506). No set-but-never-read.
- **Live callback confirmed:** `tomasz.ink:112` reads `phish_pierce_attempts == 1`; the engine
  writes `phish_<id>_attempts` on send (`mail-bridge.js:362`), so the "Melanie first try"
  debrief line genuinely fires for a first-attempt landing. Not a dead callback.

**Lint finding to NOT action (false positive):**
`dialoguelint` reports `fairbairn.ink:68` as `phone-self-prefix` ("drop Ruth Adeyemi:").
Fairbairn is `npcType: "person"`, not a phone contact; the lint misclassified the file as
`[phone]`. The `Ruth Adeyemi:` line is a legitimate second speaker in a person-chat two-hander
(Ruth cuts in during Gareth's signing scene — a nice beat). **Do not drop the prefix.** The
line-length half of the same lint hit is real; see M1.

**Cross-ref to scenario-design-review (not dialogue):** the validator's three
`mutuallyExclusiveGlobals` warnings on Ruth's eventMappings (phish_*_landed indices 10/16,
11/17, 15/18) are the task-complete vs sends_done handlers firing independently — intended,
different effects, not alternatives. Structural, belongs to the design review.

---

## Minors

### M1 — fairbairn.ink:68 — SPOKEN (Ruth) — length + the one preachy beat
Current:
> `Ruth Adeyemi: That signature is the difference between a test and a crime. Without it, this is an offence under the Computer Misuse Act. Most countries have one like it.`

28 words, and "Most countries have one like it." is a flat, teacherly tack-on — the only line
in the whole lab that edges into a lecture. Cutting it fixes the tone and the length together.
Proposed:
> `Ruth Adeyemi: That signature is the difference between a test and a crime. Without it, you're committing an offence under the Computer Misuse Act.`

### M2 — tomasz.ink:117 — SPOKEN (Tomasz) — 31 words, over either cap
Current:
> `Tomasz: Dev reported one of your calls — credit to him — but you rang back and still got what you needed. A call-back rule to a number on file stops both.`

Proposed:
> `Tomasz: Dev reported one of your calls, credit to him. But you rang back and still got it. A call-back rule on file stops both.`

### M3 — ruth.ink:197 — SPOKEN (Ruth) — 29 words
Current:
> `Ruth Adeyemi: Dev's manager rang Gareth about a dodgy call. Gareth promised to look into it, with a straight face. Give the desk a couple of minutes, then ring back softer.`

Proposed:
> `Ruth Adeyemi: Dev's manager rang Gareth about a dodgy call. Gareth kept a straight face. Give the desk a minute, then ring back softer.`

### M4 — tomasz.ink:119 — SPOKEN (Tomasz) — 27 words
Current:
> `Tomasz: Dev gave you what Sofia's email needed, and he reported a call too. Credit for that, but a call-back rule stops it without him noticing a thing.`

Proposed:
> `Tomasz: Dev gave you what Sofia's email needed, and reported a call too. Credit for that. A call-back rule stops it without him noticing.`

### M5 — tomasz.ink:123 — SPOKEN (Tomasz) — 28 words
Current:
> `Tomasz: You had to lean on Dev, but he still gave up the portal and the date. A call-back to a number on file stops every line of that.`

Proposed:
> `Tomasz: You had to lean on Dev, but he still gave up the portal and the date. A call-back on file stops all of it.`

(M2/M4/M5 are three branches of the same debrief block; only one fires per playthrough, so the
shared "call-back … on file" phrasing is not seen as repetition. No action beyond length.)

### M6 — tomasz.ink:131 — player choice label (NOT spoken) — mild ambiguity
Current:
> `+ [DMARC off p=none, and an external-sender banner.]`

"DMARC off p=none" can momentarily read as "turn DMARC off". Tiny, but this is a teaching
beat. Proposed:
> `+ [Move DMARC off p=none, plus an external-sender banner.]`

### M7 — wording continuity for the payoff callback (NOT a bug)
The invoice backstory lands three times, deliberately, and the Fairbairn payoff
(`fairbairn.ink:77`) is a genuinely strong callback to the briefing. They use slightly
different words: briefing `ruth.ink:64` "a spoofed supplier"; payoff `fairbairn.ink:77`
"a fake supplier". Aligning the noun ("spoofed supplier" both times) makes the callback echo
land a touch cleaner. Trivial; optional.

---

## Worth considering (polish / reward curiosity)

### W1 — the briefing choice could seed a debrief callback — ruth.ink:67/70
The opening choice ("It's about the gaps…" vs "nobody will ever know it was them") teaches the
anonymity point well and gives different content per pick (valid — not flat). It sets no state.
A tiny stance flag ("player over-promised anonymity") could let Tomasz's debrief or Gareth's
payoff nod to it ("You nearly promised them nobody'd find out — good thing the report keeps
that true"). Would reward the moment without blocking anyone. Optional.

### W2 — the final mitigation pick is convergent with no stance var — tomasz.ink:128–136
"Which fix would you pick?" gives three distinct replies, then all → `debrief_close`. This is
legitimate stance-convergence (the engagement closes regardless), so it reads fine. Per the
skill it would be cleaner to set a stance var — but it is the last line before credits, so
there is nothing left to pay it back. Flagging only for completeness; low value, likely skip.

---

## What's working (keep)

- Dry, specific humour throughout: Tomasz "me and half a person's budget"; "Gareth wanted your
  whole report pinned up in the kitchen. I've talked him down to the executive summary"; Dev
  "first payslip's always a faff"; Gareth "I think he's enjoying this more than he lets on."
- The `own_mail` reveal (tomasz.ink:80–81, "The headers had you the whole time") is the
  strongest beat — the attacker's own sends become the defender's evidence. Leave it exactly.
- Teaching is accurate and never preachy: SPF/DKIM/DMARC (tomasz.ink:69–70), the padlock card,
  the report/SOC "why" explanations (SPF vs DMARC policy, allow-list vs scanning, forced
  password expiry) all distinguish the near-miss wrong answers cleanly. The "no names, no
  blame" theme is carried by character (Gareth's condition) rather than lecture.
- Layered hints in ruth_phone are correctly rationed: bottom-rung pointers are near-explicit by
  design (PLAN §6), not accidental give-aways.
- Choice/reply matches are clean everywhere, including Dev's technique-aware reactions and the
  stale-org-chart "repair_team" option that only appears once you've claimed Accounts.

## Out of scope this cycle

- Voices/TTS: no `voice` blocks defined; POLISH_PLAN skips audio. When audio is eventually
  done, each person NPC will need a voice block with an explicit accent (Dev's Midlands English,
  Gareth's soft Edinburgh, Tomasz Polish-British are already set up in the file headers). Not a
  dialogue finding.
- Structure/solvability, eventMapping exclusivity, room/geography: owned by
  scenario-design-review and puzzle-chains.
