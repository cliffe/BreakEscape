# E18 "Credential attacks at scale": design review C2 + dialogue review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. E18 is the organisation-scale twin of E9: a six-stage full episode (`brief, osint, guess, flip, defend, debrief`) with the `guess` stage in `mode: "spray"` (ENG-02 + ENG-02b campaign console) and the ENG-01 flip aftermath, plus a three-stage defend-only shell (`brief, defend, debrief`). Company Merrin & Sallow Architects; host Ama Owusu, security lead on the practice's provider Fenlow Managed IT; module core_03 (passwords and MFA). Content rule for this episode: attack content stays at template and psychology level (opened accounts as a count, masked stuffing rows, no working credential, tool, command or threshold); this review is kept at the same level. Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review` and `npc-dialog-review` skills adapted to the awareness kind, and `reviews/build/E11_DESIGN_C2_DIALOG_C1.md` / `E9_DESIGN_C2_DIALOG_C1.md` for format and standard.

Scope read end to end: both shells `scenarios/awareness_e18_credential_attacks_at_scale{,_defend}/{scenario.json.erb, ink/ama_owusu.ink}`; the fragments `planning_notes/phishing_and_social_engineering/awareness/e18/{attack,defend,full_only}.json`; the spec `.../episodes/E18_credential_attacks_at_scale.md`; the module `core_03/concepts.md`; and the engine the findings depend on (`episode-runner/flip-view.js`, `episode-runner/step-strip.js`, `password-guesser/password-guesser-model.js`).

How the screens were judged: this pass **rendered the flip and the campaign console**. A keyless `:3001` bridge run (`ONLY="e18-full"`, game 4857) passed 14/14; a second run (game 4863) stopped at the flip and dumped its DOM. The step strip, the flip heading, the flip subtitle, the defender line, and the spray console (count row, masked stuff rows, passphrase hold-out) are judged from those renders. The six defend cards, the scoring and the debrief panels are judged from the full run's completed triage (percent 100, flagRecall 7/7) and the debrief-panel assertion, plus the authored data. No live human timing run.

Ran, all green:
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema and social pass, no errors or warnings (only the generic m01-style non-awareness suggestions every awareness shell draws).
- `dialoguelint.mjs` on both: full `lines=12 median=18 p90=24 max=25`; defend `lines=3 median=28 p90=28 max=28`. No rule hits.
- Bridge suite `e18-full`: 14/14 PASS, no `pageErrors`; the guess-flip path is taken (`sent.kind: "guess"`), the defend set scores 100% (3 phish caught, 3 genuine trusted, 0 false alarms), the mission concludes.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 4 | 1 | 0 | 3 |
| **Total** | **4** | **1** | **0** | **3** |

## C1 closure

Every C1 finding checked against the live files, and the two majors against the render.

| C1 finding | Claimed fix (commit) | Verified | Status |
|---|---|---|---|
| **MA1** flip step reads "Your message" (E18 writes no message) | add `stepLabels.flip` (c84e33826) | Render (game 4863) shows the strip as **"4 Your inbox"**, current; no "Your message" anywhere. `stepLabels` carries `"flip": "Your inbox"` in the full erb (`:319-322`) and `full_only.json:63`; step-strip default `'Your message'` is overridden. | **Closed (render)** |
| **MA2** flip subtitle shows the generic default; authored line never renders | author `strings.flipGuessIntro` (own-seat), drop dead `flipIntro` (c84e33826) | Render shows the subtitle as the authored own-seat line ("You watched one password open the predictable accounts across the whole practice, and a stolen one open the accounts where it had been reused. Here is the other end: your own seat..."). The generic "...the owner of that account sees next." is gone. `flipGuessIntro` present in erb `:454` and `defend.json:180`; `flipIntro` removed; `flip-view.js:209` renders `flipGuessIntro` on the guess path. | **Closed (render)** |
| **MI2** word list builds 3 slots but spray tries only 2 | add `pass_motto`, `pass_place` so all found slots spray (c84e33826) | `spray.passes` now runs all three slots plus the baked season literal (erb `:372-390`, `full_only.json:30-35`). Render shows four candidate rows, each "tried once on every account", then one aggregate "3 of 5 accounts opened"; opens are never pinned to a candidate, so no "found but skipped" confusion. Reads clearly. | **Closed** |
| **MI1** defend-only welcome is exactly 30 words | trim two words (151ba4c1f) | Defend ink `:24` now 28 words (`dialoguelint max=28`). Under the cap. Reads a touch clipped, see MIN-3. | **Closed (one wording nit, MIN-3)** |

Known and queued, not re-raised: the defend-only shell carries leftover flip strings (`flipMissedHeading`, `flipLandedNoTells` at `defend/scenario.json.erb:302-303`) and does not carry `flipGuessIntro`; the generator's pass-2 strips flip keys inconsistently. The defend-only shell has no flip stage, so none of these render. Left to the generator fix.

## What works

- **Both C1 majors are closed on the actual flip screen, not just in the data.** The second half now reads as the learner's own seat: step "Your inbox", heading "Now it's your inbox.", and a subtitle that names both halves of the attack (spraying a company word across everyone, and a stolen password reused at work) in the own-seat voice. The MA2 third-person "owner of that account" framing is gone.
- **The four-pass spray reads cleanly (render).** The console lists each candidate as its own "tried once on every account" row, then a single "3 of 5 accounts opened" summary. The count is never attributed to a particular candidate and never to a named colleague, so adding the two missing passes (MI2) made the list fuller without raising "why was that one skipped?". No editable field, no `@`, masked stuff rows (`......`), the reuse-at-work row opens and the used-nowhere-else row holds, and the three-random-words passphrase never lands.
- **Facts track core_03.** Spraying (one password, one try per account, so no single lockout), stuffing (a stolen pair reused at work), the one-habit fix (a different password per account, not a word off the website, in a manager), the breach check that uses the email not the password, Have I Been Pwned, and the organisation controls (lockout, MFA everywhere, banned-word list, breach monitoring) all match the module. The organisation controls are voiced as the provider's ("These are set up for you; you don't have to switch them on"), not as staff duties.
- **The mirror pair is fair and the discriminator is right.** Rows 1/2 (lockout), 3/4 (sign-in) and 5/6 (breach) each pair a genuine notice against a look-alike; "an alert arrived" is never the tell. The real line throughout is "a genuine notice never needs you to type a password to unlock or check", stated in the brief, the defend intro and every fake's per-flag note. The genuine breach notice (row 6) follows the trickiest fake (row 5 breach checker), which is the "similar genuine item after a likely miss" the brief asks for.
- **No-blame register is clean** across the brief, every `whyFine`/`falseAlarmCost`/`ifTrusted`, the `noBlameLine`, the Monday card, both host completion lines and the "Nobody's ever in trouble for reporting." line. The render confirms a cautious learner who reports a genuine notice still scores full.
- **Host ink voices as a calm colleague** in both shells; no printed variables, under the word cap (full max 25), UK English, no em/en dashes. "a few bad tries" / "a run of bad sign-ins" carry the lockout idea without a threshold number, honouring the content rule.

## Findings

### MIN-1 — the spec's §10 still documents the pre-MA2 flip, so a rebuild from it would reintroduce MA2. Minor, needs-user (doc). No shipped file is wrong.

`E18_credential_attacks_at_scale.md:449-452` still describes the flip as it was before C1:
- `:449-451` names **`strings.flipIntro`** with the shorter pre-fix wording ("...across the whole practice. Here is the other end..."). The shipped key is `strings.flipGuessIntro` with the fuller spraying-and-reuse wording; `flipIntro` is the key the guess-flip path does **not** read (that was MA2). A later edition rebuilding E18 from this spec would re-key the line wrong and re-open MA2.
- `:452` says `victimName` **null**; the shipped `flipAftermath.victimName` is `"you"` (ENG-08 requires a string here; the deviation is documented in `full_only.json`'s notes).
- §10 does not mention `stepLabels.flip` at all (the MA1 fix).

Fix (doc only): correct §10 to the shipped `flipGuessIntro` key and wording, change `victimName` to `"you"`, and note `stepLabels.flip: "Your inbox"`. This is the companion to the C1 doc tidy and mirrors E11's D3.

### MIN-2 — the flip lead and the aftermath heading both say "a few minutes later", back to back. Minor, episode-local, dialogue. Judged from the render.

On the flip screen the authored subtitle ends "...your own seat, **a few minutes later**, with the alerts starting to arrive." (`flipGuessIntro`), and the very next line is the aftermath heading "**A few minutes later**, at your desk." The exact phrase repeats in adjacent lines, and "your own seat" / "at your desk" restate the same relocation. The fuller `flipDefenderLine` lower down also closes on "Now the alerts are arriving, and some are fakes", so "the alerts arriving" lands three times on one screen. Nothing is wrong; it reads as light padding against the brief's "the flip teaching rather than restating". Smallest fix: let the aftermath heading carry the timing and trim it from the lead.
- `strings.flipGuessIntro` (full erb `:454`, `e18/defend.json:180`) old → new:
  old `"...Here is the other end: your own seat, a few minutes later, with the alerts starting to arrive."`
  → new `"...Here is the other end: your own seat, with the alerts starting to arrive."`

(This is on-screen flip text, not a voiced host line. The defend-only shell never shows `flipGuessIntro`, so only the full shell is affected.)

### MIN-3 — the trimmed defend-only welcome reads slightly clipped. Minor, needs-user (generator-owned). Optional.

The MI1 trim dropped "and fast" from "thick and fast", leaving `scenarios/awareness_e18_credential_attacks_at_scale_defend/ink/ama_owusu.ink:24`: "...After a sweep **the alerts come thick**, some real, some fakes...". "come thick" on its own is non-idiomatic (the set phrase is "thick and fast"). Harmless, but a shade awkward to voice. The line is generated by `gen_e8_e17_shells.py` (`LINES[('e18','defend')]`), which the Do-not list says not to hand-edit, so this is a user/generator call. Optional fix that stays at 28 words:
old `"Your own seat now. After a sweep the alerts come thick, some real, some fakes. Report the fakes, and never type a password to unlock or check anything."`
→ new `"Your own seat now. After a sweep the alerts come fast, some real, some fakes. Report the fakes, and never type a password to unlock or check anything."`

### MIN-4 — timing not verified live. Minor, needs-user.

The ~15-minute full / ~8-minute defend budgets rest on the spec's per-stage table and the scripted render, not a timed human run (the scripted bridge races through). The OSINT stage collects five facts across five pages and the campaign console is new (ENG-02b); worth one timed full-episode playtest to confirm 15 minutes holds before ship. Carried from C1 MI3; no change implied if it holds.

## Voiced host lines I would change

Only one, and it is optional: the **defend-only welcome** (MIN-3), "the alerts come thick" → "the alerts come fast", for a smoother read; and it is generator-owned, so a user call. Every other host line in both shells (the full welcome, the after-campaign recap, both completion lines, the defend-only completion line, and the "Thanks, Ama." / "Any time." exchange) voices as a calm colleague, is within the word cap, and carries no printed variable; I would leave them. (The MIN-2 "a few minutes later" change is on-screen flip text, not a voiced line.)

## Verdict per stage

| Stage | Full | Defend-only |
|---|---|---|
| brief | pass | pass |
| osint | pass (five facts reduce correctly; render collected all five) | — |
| guess (spray console) | pass (render: four candidate rows, "3 of 5 accounts opened", masked stuff, passphrase holds) | — |
| flip | pass with optional polish (MIN-2) | — |
| defend | pass (render: 100%, 3/3 phish, 3/3 genuine, 0 false alarms, flagRecall 7/7) | pass |
| debrief | pass (four concept panels render, named correctly) | pass |

**Ship-ready.** Both C1 majors (MA1 step label, MA2 flip subtitle) are closed and confirmed on an actual flip render, MI2 is closed and the four-pass console reads clearly, and MI1 is closed (28 words). The four remaining items are polish: one episode-local flip-wording dedup (MIN-2), a doc drift in §10 that should be corrected so no rebuild re-opens MA2 (MIN-1), an optional smoother defend welcome (MIN-3), and the outstanding timing check (MIN-4). No blocker, no major, no content-rule slip.

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 4 minor (1 episode-local, 3 needs-user).
- C1 closure: MA1 closed (render: strip "4 Your inbox"), MA2 closed (render: own-seat `flipGuessIntro`, generic default gone), MI2 closed (four passes read clearly), MI1 closed (28 words; one wording nit MIN-3).
- Blockers: none.
- Majors: none.
- MIN-2 (minor, episode-local, dialogue): flip lead and aftermath heading both say "a few minutes later" back to back — trim it from `flipGuessIntro` (full erb `:454`, `e18/defend.json:180`).
- Voiced host line I would change: only the defend-only welcome (MIN-3, optional, generator-owned) "come thick" → "come fast".
- Verdict: ship-ready; apply MIN-2 if a cheap wording pass is on, correct §10 (MIN-1) so a rebuild can't re-open MA2, and run one timed full-episode playtest.
