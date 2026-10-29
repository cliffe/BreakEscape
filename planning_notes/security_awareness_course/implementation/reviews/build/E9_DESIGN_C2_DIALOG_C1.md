# E9 "Passwords and password managers": design C2 + dialogue C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. Method and standard: `REVIEWER_BRIEF.md`, the `scenario-design-review` and `npc-dialog-review` skills adapted to the awareness kind, and the E8 pilot reviews for format and bar. Source of truth for facts: `modules/core_03_passwords_and_mfa/concepts.md`; topic boundaries: `00_COURSE_OVERVIEW.md`.

Scope read end to end: both shells (`scenarios/awareness_e9_passwords/` and `_defend/`, scenario + ink); the fragments (`e9/{attack,defend,full_only}.json`, `BRAND_ADDITIONS.md`); E9's block in `gen_e8_e17_shells.py`; the module `concepts.md`; and the engine the findings depend on (`flip-view.js`, `inbox-triage/triage-kinds.js`, `inbox-triage/triage-scoring.js`).

How the screens were judged: this pass **ran the flip**. A keyless `:3001` bridge run (`ONLY="e9-full"`, game 4804) passed 14/14, and a second run (game 4808) captured the flip screen and dumped its rendered nodes. The flip findings below are from that render; the defend-set and debrief copy is judged from the authored data and the scoring code.

Ran (all E9-only, all green):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema passes, no social errors or warnings (only the generic m01-style "add a hostile NPC / puzzle graph / timedConversation" suggestions, which do not apply to an awareness episode).
- `dialoguelint.mjs` both shells: full `lines=8 median=15 p90=28 max=28`; defend `lines=3 median=26 p90=30 max=30`. No rule hits. (The defend-only host line sits exactly on the 30-word ceiling, same as C1.)
- Parity subtest `E9: fragment and full erb share the same learner-facing copy`: pass. Rule-of-thumb suite: 2/2 pass. No em/en dashes anywhere in the E9 files (house style).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 2 | 2 | 0 | 0 |
| **Total** | **2** | **2** | **0** | **0** |

Episode shape unchanged: full = 6 stages (`brief, osint, guess, flip, defend, debrief`); defend-only = 3 (`brief, defend, debrief`). Defend set `e9_lock_it_down`, 8 items: 1 genuine push, 1 real push phish, 1 fake-IT email, 5 password `choice` cards.

## C1 closure

Each C1 finding checked against the live files and, for the flip, the render.

| C1 finding | Claimed fix | Verified | Evidence |
|---|---|---|---|
| **MA1** flip repeats the heading and the closing advice; authored `flipIntro` never renders | data: drop duplicate `flipAftermath.heading`, author `flipGuessIntro`, trim `flipAftermath.line` | **Mostly closed** — heading now shows once, instruction no longer doubled; a descriptive sentence is still doubled back-to-back (see D1) | render: single `h2` "Now it's your phone."; `flipAftermath` has no `heading` (erb:417, full_only:30); `flipGuessIntro` present (erb:446) and renders as the lead |
| **MA2** fake-IT SMS renders empty from "Unknown sender" | engine (aftermath draws non-email `body` + sender fallback) + data (`from` added) | **Closed** | render shows the SMS card headed **"Tarrowby IT"** with the body text visible; `senderName` handles a string `from` (`triage-kinds.js:345`); `flip-view.js` bodyNode draws `r.body`; `fa_it_text` carries `"from": "Tarrowby IT"` (erb:435) |
| **MA3** defend-only feedback names "Colin"/"the attack half"/"the guesser" | data: variant-neutral wording in `e9/defend.json`, re-wired + regenerated | **Closed** | defend shell `:188` "the pattern a guesser tries first"; `:217` "a breach of any site you used into a break-in everywhere you used the same one"; `:245` "the same way they build a guess list in the first place". No "Colin"/"attack half"/"guesser" left in the defend-only shell |
| **MI3** passphrase example missing the core_03 caution | data: add the caution as a second sentence | **Closed** | note now ends "Never use a training example as your real password." (erb:204, defend:182) |
| **MI1** `choice` leaks into the `phishTrusted` band cap | engine, on main | **Closed** | `triage-scoring.js:346` filters `&& !choiceIds.has(m.id)` |
| **MI2** headline tallies undercount an 8-decision round | by-design, noted | Unchanged by design | `debrief-view.js` tallies the 2 real phish; round `percent` reflects all 8 |

## What works

- **The flip now reads cleanly.** One heading, the authored "other end: your own phone" recap, a correctly-rendered push-flood card and a fake-IT SMS card that shows the sender and the message. The empty-bubble break is gone. (Judged from the render.)
- **Facts still faithful to core_03.** Passkey first (NCSC, April 2026), the MFA ladder, made-up security answers, three random words over complexity, "no genuine IT asks you to type a number / read back a code / approve a prompt", the HIBP breach check, and the worst-passwords list used as the thing to avoid.
- **The ladder card's "the fake 'IT' message tried" reference is coherent in both variants**, because the scored fake-IT email (`e9_fake_it_number`) is in the defend set itself, not only in the full-episode flip. No MA3-style orphan.
- **No-blame register throughout**, in the brief, the per-item feedback, the `noBlameLine`, and Nilesh's "Nobody's ever in trouble for reporting."
- **Host ink is in good shape** and voices as a calm colleague; no printed variables; within the word limit.

## Findings

### D1 — the flip still says the same thing twice, in two places. Minor, episode-local, dialogue. (Residual of MA1.)

MA1 removed the duplicate *heading* and the duplicate *instruction*. Two *descriptive* repetitions remain, both visible in the render as back-to-back paragraphs:

**D1a — the two leads recap the same beat.** `flipGuessIntro` (erb:446, the paragraph under the heading) and `flipAftermath.intro` (erb:419, the next paragraph) both say "a reused password opened the account" + "the other end / here is yours":
- lead 1: "You watched a reused password open a colleague's account. Here is the other end: your own phone."
- lead 2: "A reused password opened Colin's account in seconds, no clever cracking at all. The other end of that is a phone buzzing in the dark. Here is yours, a few minutes after someone got hold of a password of yours."

Fix (full erb `:419` + `full_only.json:32`): let `flipGuessIntro` carry the recap and cut it from the intro.
old `"A reused password opened Colin's account in seconds, no clever cracking at all. The other end of that is a phone buzzing in the dark. Here is yours, a few minutes after someone got hold of a password of yours."`
-> new `"It opened Colin's account in seconds, no clever cracking at all. A few minutes after someone got hold of a password of yours, this is what your phone shows."`

**D1b — `flipAftermath.line` and `flipDefenderLine` share a verbatim clause.** They render back-to-back at the foot of the flip, both carrying "They can't get past your phone, so they are leaning on it: prompt after prompt, then a message dressed up as IT":
- `flipAftermath.line` (erb:441): "They can't get past your phone, so they are leaning on it: prompt after prompt, then a message dressed up as IT."
- `flipDefenderLine` (erb:448): "Someone has a password of yours... They can't get past your phone, so they are leaning on it: prompt after prompt, then a message dressed up as IT with a number 'to stop the prompts'. The number is on their screen, not IT's. Deny what you didn't start, and report it."

The defender line is the fuller, better version and closes the screen; the aftermath line is a subset said one line earlier. Fix (full erb `:441` + `full_only.json:37`): drop `flipAftermath.line` so the aftermath section ends on its two cards and `flipDefenderLine` carries the takeaway alone. (If a caption is wanted after the cards, make it non-overlapping, e.g. `"Two different pushes, then the 'IT' message, all in the small hours."`)

Not blocking: nothing is broken or wrong, the learner still gets the correct message, and the facts are sound. It is polish against the brief's "the flip teaching rather than restating" and the house rule against uniform, re-stating rhythm. Left unfixed, the flip reads as slightly padded.

### D2 — the full-episode wrap-up line is a mouthful to voice. Minor, episode-local, dialogue (voiced host line).

`ink/nilesh_solanki.ink:25`, the "both sides done" line: "A different password for every account, kept in a manager, three random words where you must remember one, and deny what you didn't start." Spoken, the four-item comma stack runs long and "three random words where you must remember one" is awkward to parse aloud (it means "for the one or two you still have to remember by heart").
Fix: old `"...kept in a manager, three random words where you must remember one, and deny what you didn't start."` -> new `"...kept in a manager, three random words for the few you must remember by heart, and deny what you didn't start."`

## Dialogue pass (voiced host lines)

Every host line read as spoken. Only D2 above would I change. For completeness, the lines judged fine:
- Full welcome: "Welcome to the Tarrowby exercise. Most passwords aren't cracked. They're guessed, reused or handed over." / "Start at the kiosk..." / "Nothing you touch here is a real password." — natural, calm.
- Full after-guess: "Good. One reused password opened his account, no clever cracking at all." / "Now it's your turn in the seat: your phone's buzzing, and someone has a password of yours." — good.
- Full close: the "both sides done" line (D2) + "Nobody's ever in trouble for reporting." — fine once D2 is applied.
- Defend-only open/close: "Your own account now: prompts coming in..." (30 words, on the ceiling) / "That's it locked down, thanks..." — both voice well.

## Notes (not findings)

- **One genuine item, "refuse everything" still scores full.** Carried from C1: the set has one genuine item (the started prompt), it is first, and under `scoringProfile: "awareness"` with `passPercent: 0` reporting/denying everything is not punished. By-design for the product; the real measurement runs through the `general_v2` check pair, not this set. Conscious choice, not an E9 defect.
- **Defend-only global prefix is `episode_e9_passwords_defend_defend_`** (double "defend", from episode id `e9_passwords_defend` + the generator's `_defend_` suffix). Internal only; consistent across `globalVariables`, `outcome.setGlobalPrefix`, `concludeRequires` and the event mapping. Not learner-facing; same pattern the generator produces for other defend-only shells. Not a defect.
- **Timing still unverified.** No timed playtest has been run (C1 flagged the same). Six stages with an 8-item defend half is plausible for the ~15 min full / ~8 min defend budgets, but a timed run is the honest way to confirm.

## Verdict per stage

| Stage | Full | Defend-only |
|---|---|---|
| brief | pass | pass |
| osint | pass (sites/posts read naturally; facts reduce correctly) | — |
| guess | pass (render: 9 rows, lands on the reuse step, demo passphrase never lands) | — |
| flip | pass with optional polish (D1) | — |
| defend | pass | pass |
| debrief | pass | pass |

**Ship-ready.** All three C1 majors and both episode-local minors are genuinely closed in the files, confirmed engine-side for MA2/MI1 and confirmed on-screen for MA1/MA2 by the render. What remains is two minor polish items (D1 flip repetition, D2 a smoother spoken line), neither blocking. Recommend applying D1/D2 if a wording pass is cheap, and running one timed full-episode playtest to close the outstanding budget check; no further confirm pass is needed for correctness.

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 2 minor (2 total; both episode-local, both dialogue).
- C1 closure: MA1 mostly closed (heading + instruction dedup done; one descriptive sentence still doubled, D1), MA2 closed (render shows "Tarrowby IT" + body), MA3 closed, MI3 closed, MI1 closed in engine, MI2 by-design.
- D1 (minor, episode-local): the flip's two leads recap the same beat, and `flipAftermath.line` repeats a clause from `flipDefenderLine` back-to-back — `scenario.json.erb:419/441/446/448`, `full_only.json:32/37`.
- D2 (minor, episode-local): the full-episode "both sides done" host line is a mouthful to voice — `ink/nilesh_solanki.ink:25`.
- Verdict: ship-ready; apply D1/D2 if a cheap wording pass is on, run one timed playtest, no correctness confirm needed.
