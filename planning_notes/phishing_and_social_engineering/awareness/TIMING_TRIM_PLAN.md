# Timing trim plan: E3 and E5 to 13 minutes

Date: 2026-10-22. Companion to the P1 playtest (`playtests/P1_E3_E5.md`) and the length target in
`../designs/11_awareness_product_episodes.md` (section 3.1, `durationTargetMin: 13`).

Plan only. Nothing here is applied. The E3 and E5 shells are being edited by a dialogue fixer in the
same tree, so every cut gives the line in the fragment (`e3/defend.json`, `e5/defend.json`) **and** the
line in the shell (`scenarios/awareness_*/scenario.json.erb`); expect small drift in the shell line
numbers and match on the quoted text, not the number.

## Method and the re-estimate model

Minutes are reckoned the way the brief asks: reading at **200 words per minute**, plus **5 seconds per
decision**. This is gentler than the playtest's own 30 s per decision, so the baselines below are lower
than the playtest's 21 and 16; the decision term is now small and reading dominates.

Word counts come from the fragments (counted directly, private `_keys` excluded) and, for the attack
beat and on-screen chrome, from the playtest's measured "unique words" totals (2,900 for E3, 2,430 for
E5), which the playtest derived at 200 wpm.

One subtlety drives the whole plan. The playtest's unique-word total counts each piece of feedback
**once**. But in both episodes `feedbackMode` is `immediate`, so the learner reads the full reasoning
for every item as they go (`inbox-triage-minigame.js:590` `_card`), and then the debrief
(`episode-runner/debrief-view.js:134` `renderDebrief`) renders one more card per item from the same
`truth` fields (`perFlagNote`, `whyFine`, `ifTrusted`). The debrief is a second read of text already
shown. The playtest put that second read at 340 words (E3) and 559 (E5). So:

| Episode | Reading once (playtest unique) | Debrief re-read | Decisions | Baseline at 200 wpm + 5 s |
|---|---|---|---|---|
| E3 | 2,900 (14.5 min) | 340 (1.7 min) | ~14 (1.2 min) | **~17.4 min** |
| E5 | 2,430 (12.2 min) | 559 (2.8 min) | ~8 (0.7 min) | **~15.6 min** |

## The cuts

### Cut A — collapse the debrief re-read (both episodes). Biggest win, zero teaching cost.

This is the "prefer repeated feedback over defend items" cut, and it is the only change E5 needs.

The debrief loop renders a full card for **every** answer:

> `debrief-view.js:151-154` — `const answers = …; for (const a of answers) cards.appendChild(buildCard(a, messageFor(set, a.id)));`

`buildCard` (`debrief-view.js:72-116`) reprints the verdict line, each flag's canonical sentence plus
its `perFlagNote`, the `whyFine` lines and `ifTrusted` — the same strings the learner read seconds
earlier in immediate mode. Change the loop to render a card **only for items the learner got wrong**
(wrong verdict, or at least one authored flag missed), and add one "weakest skill" line from
`result.perFactor`. Keep the score summary (`:142-149`), the Monday card (`:161-163`) and the no-blame
line (`:164`).

- **Where:** `public/break_escape/js/minigames/episode-runner/debrief-view.js:151-154`. Code, shared by
  every episode; not authored in the fragment or shell, so there is no fragment/shell line to cite —
  the re-read is assembled at runtime from each item's `truth`.
- **Words saved:** the whole second read for a learner who scored well — up to **340 (E3)** and **559
  (E5)**. A learner who missed two items still re-reads only those two (~150 words).
- **Teaching cost:** none. Every scored tell is still taught at the moment of the item in immediate
  feedback. The "On Monday" close and the no-blame line stay (both required). This also matches section
  4.3's "learn from caught-out moments": the debrief now dwells on what the learner actually missed.
- **No data-only fallback.** The debrief always renders all cards; there is no flag to suppress them,
  so this needs the code change. Trimming the per-item `truth` text instead would also shorten the
  immediate feedback and would cost teaching, so do not do that in place of Cut A.

After Cut A: E5 drops to its single-read figure, **~12.8 min** — on target, no further cuts needed.
E3 drops to **~15.7 min** and needs the cuts below.

### Cut C — E3 queue brief: drop the email-verdict legend (code).

The playtest's "190-word queue brief, half of it email copy" (E3-4) is the authored `set.brief` (78
words, entirely about calls and the prompt — keep it) **plus** a code-generated legend that does not
apply to a call/push queue:

- the header reads "Inbox check: 5 messages" because the episode set has no `stage`, so
  `STAGE_LABEL[undefined] || 'Inbox check'` wins (`inbox-triage-minigame.js:300`); and
- a `<dl>` of Trust / Report / Delete / Verify with email hints — "I'd open it or act on it", "Bin it",
  "ringing a number I already hold" (`VERDICT_HINT`, `:63-68`) — rendered at `:304-307`, directly above
  the per-kind lines ("On a call: …", "On a sign-in prompt: …") at `:309-315` that give the real buttons.

Fix in `_renderBrief`: when every message is a `call` or `push` (no email/page), skip the generic
verdict `<dl>` (`:304-307`) and label the round "Service desk queue" rather than "Inbox check".

- **Where:** `inbox-triage-minigame.js:300` (label) and `:304-307` (the `<dl>`). Code. The authored
  `set.brief` at `e3/defend.json:34` / shell `scenario.json.erb:91` is on-message and is **not** cut.
- **Words saved:** ~45 (the four email hints and labels), plus it removes the mismatch the playtest
  flagged. ~0.2 min.
- **Teaching cost:** none; the per-kind lines already state the actual actions.

### Cut D — E3: drop one defend call, 5 items to 4.

E3's scored set is 1 push + 4 calls (2 impostor, 2 genuine; `11` section 3.2). Drop the **second genuine
caller, `e3_call_new_starter` (Chen Jiayi)**.

- **Where:** `e3/defend.json:576-594` (the object in `awarenessEpisode.defend.calls`) and shell
  `scenarios/awareness_e3_helpdesk_reset/scenario.json.erb:376-411`.
- **Words saved:** 94 (62 read + 32 feedback) and one decision. ~0.55 min.
- **Why this one:** it is the lightest item, and every scored tell survives the drop. The set's four
  tells are `unrequested_mfa_push` (push), `vish_callback_pressure` and `borrowed_authority`
  (`e3_call_gordon_impostor` and `e3_call_on_behalf`) and `secrecy_or_bypass` (`e3_call_on_behalf`).
  `e3_call_new_starter` carries no tell (`"tells": []`, `e3/defend.json:583`). The "don't refuse a real
  caller" lesson that N15 wants from a genuine item is still carried by `e3_call_gordon_real`, which is
  the episode's signature beat (same four facts as the impostor, only the callback tells them apart).
- **Teaching cost:** the cast loses one genuine caller, so the mix becomes 2 impostor + 1 genuine +
  push rather than the 2+2 in the design table. This is a deliberate deviation; if the 2+2 balance is
  held sacred, keep the item and take the extra ~0.5 min out of the attack call instead (see the note
  after the table).
- **Check-form dependency — clear.** The pre/post parallel forms (`helpdesk_form_a` / `helpdesk_form_b`)
  are separate triage sets and share no items with the episode set; the fragment says so explicitly
  (`e3/defend.json:14`, "No item repeats the episode set's calls or push"). Each form keeps its own 4
  phish / 6 genuine mix. The episode set's conclusion gates on `episode_e3_helpdesk_reset_defend_done`
  (set level, not item count) and scores as the mean of its items with `passPercent: 0`, so four items
  score and conclude exactly as five did. Nothing in the forms or the check wiring depends on this call.

### Cut E — E3: trim the per-item feedback that is read once (data).

After Cut A the remaining feedback is read only in immediate mode, so trim the parts that are flavour or
restatement rather than a tell. Target ~250 words across the scored set (feedback is 402 words over the
five items).

- **`reportReply` lines** (shown only on Report; never in the debrief): shorten the two long ones.
  `e3_call_gordon_impostor` — `e3/defend.json:520` / shell `:261`: "Thanks. We rang Gordon's mobile on
  file. He's at the conference and hadn't called. His staff number was on a conference photo, so we've
  asked for it to come down." Cut the last sentence (the conference-photo detail is attack colour, not a
  defence tell): saves ~15 words. Do the same tightening on the push `reportReply`
  (`e3/defend.json:61` / shell `:128`), ~10 words. Keep one positive clause on each so the
  "reporting works" reinforcement (section 4.3) survives.
- **`ifTrusted` lines** that restate the obvious: trim where they repeat the perFlagNote. Keep at least
  the consequence clause.
- **Verbose `perFlagNote`**: the tell stays, the examples tighten — e.g. `e3_call_gordon_impostor`'s
  `vish_callback_pressure` note (`e3/defend.json:516` / shell `:255`) runs two clauses; one carries the
  tell.
- **Words saved:** ~250 across the set. ~1.25 min.
- **Teaching cost:** none to the tells (each is kept with one clear sentence); some loss of narrative
  colour in the Report acknowledgements.

### Cut F — E3: tighten three once-read strings (data).

- `strings.brief` (88 words, `e3/defend.json:599` / shell `:416`): the finance-style preamble can lose
  ~30 words without losing the attack-then-defend framing.
- `strings.flipDefenderLine` (73 words, `e3/defend.json:602` / shell `:419`): trim to ~50.
- `strings.flipMissed` (31 words, `e3/defend.json:604` / shell `:421`) nearly duplicates
  `flipNoSend` (`:603` / shell `:420`); hold one shorter version. (These show only on a failed call, so
  this is marginal for a typical run.)
- **Words saved:** ~85. ~0.4 min. **Teaching cost:** none.

## Re-estimate at 200 wpm + 5 s per decision

| | E3 | E5 |
|---|---|---|
| Baseline (debrief re-read read in full) | 17.4 | 15.6 |
| Cut A — collapse debrief re-read | −1.7 → 15.7 | **−2.8 → 12.8 ✓** |
| Cut C — drop email legend (E3) | −0.2 → 15.5 | — |
| Cut D — drop one call, 5→4 (E3) | −0.55 → 15.0 | — |
| Cut E — trim per-item feedback (E3) | −1.25 → 13.7 | — |
| Cut F — tighten three strings (E3) | −0.4 → **13.3** | — |

E5 reaches the target on Cut A alone; keep all five pages (3 phish, 2 genuine, all tells taught) and,
if a buffer is wanted, hold the redundant `e5/defend.json:621` `flipMissed` against `flipNoSend`
(`:620`) to shave ~0.3 min to ~12.5.

E3 lands at **~13.3 min**, within rounding of 13 and down from ~21. To reach a clean 13.0 without
leaning harder on the defend feedback, take the last ~0.4 min from the **attack pretext call**
(`e3/attack.json` `pretextNpcs`, 430 words): it is the top of the 5–8 min attack band the design allows,
and losing one or two caller lines there costs no scored teaching. That is the alternative to Cut D if
the 2-impostor/2-genuine balance is to be kept.

## Word-count check: E1, E2, E4, E6, E7 against the target

Defend-portion word counts, as they stand (scored episode set plus the debrief re-read it generates):

| Ep | Scored items | Read | Feedback | Debrief re-read | setBrief | Strings |
|---|---|---|---|---|---|---|
| E1 | 5 | 263 | 370 | 330 | 45 | 346 |
| E2 | 6 | 262 | 447 | 399 | 40 | 322 |
| E4 | 5 | 302 | 471 | 401 | 71 | 340 |
| E6 | 6 | 161 | 560 | 462 | 77 | 332 |
| E7 | 5 | 349 | 505 | 452 | 90 | 338 |
| (E3) | 5 | 342 | 402 | 334 | 78 | 420 |
| (E5) | 5 | 118 | 368 | 311 | 68 | 405 |

These five currently ship only as **defend-only** shells (brief + defend + debrief, ~8 min target; the
full E2/E4/E6/E7 shells are not built yet, per `11` section 10). As defend-only, each lands roughly
within its ~8 min target at 200 wpm + 5 s per decision — E1 ~6.1, E2 ~6.9, E4 ~7.3, E6 ~7.5, E7 ~8.1 —
with the debrief re-read the single largest removable block in each (E6 462 words, E7 452).

When E2/E4/E6/E7 are built as **full** episodes they gain an attack beat (~5–8 min) on top of that
defend portion, so without Cut A several would land where E3/E5 did, 14–16 min. The heavy ones are
**E6** (six items, 560 words of feedback) and **E7** (voicemail transcripts, 349 read + 505 feedback);
**E1** is the lightest and the most likely to sit near 13 unaided. Recommendation: apply **Cut A to all
episodes** — it is one shared code change in `debrief-view.js`, costs no teaching anywhere, and removes
300–560 words of re-read from each. After that, hold the per-item discipline of Cut E (one clear
sentence per tell, flavour trimmed) on E6 and E7 specifically, and re-measure each full shell with a
playtest before calling it done; these are word-count estimates, not timed runs.
