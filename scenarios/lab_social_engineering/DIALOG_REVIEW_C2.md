# Lab: Phishing and Social Engineering — Dialogue review, formal cycle 2

Fresh reviewer, read-only. No ink or scenario file edited; nothing committed.
Scope: the ink for Ruth, Ruth's phone, Fairbairn, Tomasz, Dev (the pretext call),
and the Pierce/Lord/Hampshire mail; plus the player-facing scenario text (barks,
hints, task titles, OSINT/concept cards, the report, the SOC/defender copy, triage
and credits). Ran the `npc-dialog-review` skill in full.

Judged as a game for cyber security students: fun, warm, dry, educational, not preachy.
Caps applied (C2 brief): 30 words in person, 25 by phone.

## Verdict and counts

- **Blockers: 0**
- **Majors: 0**
- **Minors: 2** (both repetition, both polish-grade)
- **Worth considering: 1**

Cycle 1 landed cleanly. All seven cycle-1 fixes hold in the committed ink, the new
over-promised-anonymity callback reads naturally and fires only on its route, and the
`greeted`-after-the-opening reload replay produces no repeated or odd lines. The two
minors below are small intra-turn repetitions, not regressions. This draft is close to
done at the dialogue layer.

## Phase 1 — compile, validate, lint

- **Compile: 7/7, 0 failed.** The only warning is the expected `-> END` on
  `tomasz.ink:143` (the closing debrief that rolls the credits). Legitimate; no action.
  (dev_service_desk's two `-> END`s are the hang-up/ring-back endpoints; not flagged this
  run, unchanged, legitimate.)
- **No "apparent loose end" warnings.**
- **Validator (`--skip-ink --no-graph`):** only the three pre-existing
  `mutuallyExclusiveGlobals` warnings on Ruth's phish_*_landed eventMappings (indices
  10/16, 11/17, 15/18). As C1 recorded, these are the task-complete vs sends_done handlers
  firing independently — intended, different effects. Structural, belongs to
  scenario-design-review. No new validator findings; `overpromised_anonymity` triggers nothing.
- **dialoguelint:** one finding, `phone-self-prefix` on `fairbairn.ink:69` — the known
  false positive (the lint misclassifies Fairbairn, an `npcType: "person"`, as a phone
  contact; the `Ruth Adeyemi:` prefix is a legitimate second speaker in the signing
  two-hander). **Do not drop it.** No line-length errors. Per-file word maxima: ruth 25,
  tomasz 28, fairbairn 25, ruth_phone 23, dev 22 — all within 30-person / 25-phone.
- **loopcheck (200 steps × 6 strategies):** clean on every conversational file —
  `ruth@start`, `ruth@hub`, `fairbairn@start`, `fairbairn@hub`, `tomasz@start`,
  `ruth_phone@hub/stage3/stage5/stage7`, `dev@start`. No starved knots; no runtime errors.

## Cycle-1 fixes — all hold

Verified against the committed ink (commit `1a562122`):

| C1 id | Where (now) | State |
|----|----|----|
| M1 (CMA tack-on cut) | fairbairn.ink:69 | Holds — "Without it, you're committing an offence under the Computer Misuse Act." No "Most countries…" |
| M2 (Tomasz tighten) | tomasz.ink:117 | Holds — 24 words |
| M3 (Ruth tighten) | ruth.ink:199 | Holds — "Gareth kept a straight face. Give the desk a minute…" |
| M4 (Tomasz tighten) | tomasz.ink:119 | Holds |
| M6 (DMARC label) | tomasz.ink:131 | Holds — "[Move DMARC off p=none, plus an external-sender banner.]" |
| M7 (spoofed supplier) | fairbairn.ink:78 | Holds — "spoofed supplier", matching the briefing noun ruth.ink:64 |
| W1 (anonymity callback) | ruth.ink:72 setter / fairbairn.ink:79-81 reader | Holds — see below |

## The new callback — reads naturally, fires only on its route

- **Set** only by the second opening choice, `[Don't worry, nobody will ever know it was
  them.]` → `#set_global:overpromised_anonymity:true` (ruth.ink:72). The straight answer
  sets nothing.
- **Read** in Gareth's `payoff` knot, gated `{ overpromised_anonymity: … }`
  (fairbairn.ink:79-81). Declared in `globalVariables` (scenario L189) and `VAR`-declared
  in fairbairn.ink:14; ruth.ink sets but doesn't read it, so no `VAR` there (same pattern
  as `sends_done`). Not a dead set-global.
- **Fires only on its route:** the payoff runs once `report_filed`; the opening choice is
  on the forced critical path (the briefing can only be left through one of the two choices),
  so the flag is deterministically set-or-not before the payoff is ever reached. A player
  who picked the straight answer never sees the extra line.
- **Reads naturally.** SPOKEN (Gareth), fairbairn.ink:80: *"You nearly promised nobody'd
  ever know, that first morning. I asked for the promise we could keep. You kept it."* —
  20 words, warm and dry, in Gareth's voice. "that first morning" lands because Ruth opens
  with "Morning." Gareth was present for the choice (he's the one being answered), so his
  remembering it is right. It rewards the moment without blaming the player.

## The reload replay of Ruth's opening — no repeated or odd lines

- `greeted` is now set in `brief_close` (commit `9d6a7fba`), after the opening choice,
  not in `start`. `start` opens with `{ greeted: -> hub }`.
- **First load / mid-opening reload:** the timed conversation auto-opens at `start` and
  sets `briefing_heard` on start, so the auto-play does not re-trigger on a later reload;
  but if the player Escs out before choosing, `greeted` is still false, so walking back to
  Ruth replays the briefing — the intended safety net, no lost opening.
- **After the opening choice:** engine resumes Ruth at her `currentKnot` ("start"); `start`
  sees `greeted` true and diverts straight to `hub`. No briefing repeat.
- **No double-speak on the hand-off into hub:** `brief_close` sets `quiet = true`, so the
  first `hub` pass consumes `quiet` and prints no status line under the just-spoken briefing;
  the next reopen (quiet already false) prints a fresh, state-correct status line.
- loopcheck confirms `ruth@start` and `ruth@hub` run 200 steps × 6 strategies with no
  runtime error. The invoice/"nearly wired" through-line still lands across the four
  deliberate beats (ruth.ink:64 briefing, fairbairn why:92, fairbairn payoff:78, triage
  supplier_bank_change) — designed repetition, different speakers/moments, not a finding.

---

## Minors

### m-C2-1 — ruth.ink:67 — SPOKEN (Gareth) — "properly" echoes the next line (route 1 only)
On the first opening route, Gareth's reply and Ruth's shared `brief_close` line sit
back to back and both carry the instruction to read the sheet "properly":

> Gareth Fairbairn: Good answer. Show me you've read that sheet properly and I'll put my name to it. *(ruth.ink:67)*
> *(→ brief_close)* Ruth Adeyemi: Read the rules of engagement. The sheet on the table. Properly. Gareth will be watching you do it. *(ruth.ink:78)*

"read that sheet properly" → "The sheet on the table. Properly." is a mild same-instruction-
twice-in-a-row across two speakers. The second route doesn't have it (Gareth says "Then
promise me that one."). `brief_close` is shared, so fix it on Gareth's route-1 line — keep
his put-my-name-to-it condition, drop the re-instruction:
> **Proposed (ruth.ink:67):** `Gareth Fairbairn: Good answer. Get it right and I'll put my name to it.`

### m-C2-2 — ruth.ink:213 — SPOKEN (Ruth) — "all three" twice in one turn (optional)
> Ruth Adeyemi: Sofia checked the sender, the portal's name and the date. All three were right. Her own service desk gave us all three. That's your finding.

25 words (within cap). The double "all three" is slightly clunky, though the symmetry is
partly intentional (the three facts Sofia checked are exactly the three her own desk handed
over — the lesson). Low value; tighten only if it reads better:
> **Proposed (ruth.ink:213):** `Ruth Adeyemi: Sofia checked the sender, the portal's name and the date. All three were right — and her own service desk handed us every one. That's your finding.`

---

## Worth considering (polish / memorability)

### w-C2-1 — ruth.ink:221 — Ruth's catch-all hub fallback is flatter than her castmates'
> Ruth Adeyemi: {&Need me?|Something else?|Still here. Good.}

Fairbairn's ("I'm just watching, carry on.") and Tomasz's ("Take your time. I'm not going
anywhere.") idle/fallback lines carry a bit of character; Ruth's three are functional. If a
cycle wants one more dry beat, one of these could carry her boss-but-fond voice (e.g.
"Still here. Earning my fee."). Entirely optional — it only shows in the `else` fallback.

The humour is already strong and doesn't want padding: Tomasz "me and half a person's
budget" and "talked him down to the executive summary"; Dev "first payslip's always a
faff"; Gareth "enjoying this more than he lets on"; the own-send report replies ("Sent from
a workstation in our own Operations Room, funnily enough"; "Good page, that. Shame about
the address"); the OSINT flavour ("The kettle in Careers has died. Send help."; Sofia's
"Grown up now."). Leave these as they are.

## What's working (keep)

- Choice/reply matches are clean throughout, including the two opening choices, Dev's
  technique-aware reactions, and Tomasz's `own_mail`/`dev_finding` topics.
- The no-blame theme is carried by character and by the report/defender "why" strings, not
  by lecture: every `blame: true` wrong answer is explained in terms of the control gap it
  hides. Teaching stays accurate and never gives away earned facts (LedgerPay is never named
  by Ruth's hints; it comes from Dev).
- All player choices are first-person spoken lines; no menu-label or `You:`-echo phrasing.
- Barks are paired-but-exclusive (only one of each pair can fire per playthrough), so no
  double-bark; the credits/closing card keep the no-names sentiment.

## Out of scope this cycle

- Voices/TTS: no `voice` blocks defined; POLISH_PLAN skips audio. Not a dialogue finding.
- Structure/solvability, eventMapping exclusivity, room/geography: scenario-design-review
  and puzzle-chains own these.
