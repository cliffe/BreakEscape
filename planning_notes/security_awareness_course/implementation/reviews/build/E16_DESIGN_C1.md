# E16 Insider risk — design review, cycle 1

Episode: **E16 "Insider risk"** (Quayholt Insurance; consequence flip plus the "raise a concern" form).
Scope reviewed: `scenarios/awareness_e16_insider_risk/` and `_defend/`,
`planning_notes/phishing_and_social_engineering/awareness/e16/`, the brief
`.../episodes/E16_insider_risk.md`, the module `modules/core_14_insider_risk/concepts.md`, and the
engine surfaces the shells drive (`public/break_escape/js/minigames/concern-form/`,
`.../episode-runner/flip-view.js`, `.../episode-model.js`).

Method: `scenario-design-review` adapted to the awareness product, against `REVIEWER_BRIEF.md`.
Validators run clean: `validate_scenario.rb --strict-social --no-graph --skip-ink` (schema passes; the 22
suggestions are generic mission-type nudges — VM launchers, hostile NPCs, lock variety — that do not
apply to a one-room awareness kiosk), `validate_social.rb` (no output), and
`ink_runtime_check/dialoguelint.mjs` on both shells (no rule hits; host lines median 24, max 30 words).
**Every screen here was judged from code and config, not from a live render.**

## Counts

| | Full shell | Defend-only shell |
|---|---|---|
| Stages | 5 (brief, mistake, flip, defend, debrief) | 3 (brief, defend, debrief) |
| Mistake beats | 5, each 2 options, exactly 1 `safe` | — (dropped) |
| Flip montage lines | 10 (both options × 5 beats), montage mode | — (dropped) |
| Defend items | 6 (sms, email, push, email, email, call) | same set `e16_leaver_week_inbox` |
| …of which genuine (`isPhish:false`) | 1 (item 6, the awkward locked-out call) | 1 |
| Declared `channelTells` | 5 (`insider_offer` local + 4 shared) | 5 |
| Concern-form chips | 6 fact (what×2, when×1, where×1, who×2), 3 conclusion | same |
| Debrief | 2 concept cards + Monday card + no-blame line + rule of thumb | same 2 cards |
| Host ink lines | welcome (3) + done (2) | before/after/choice/reply |
| Target duration | 15 min (brief 1 + mistake 4–5 + flip 1–2 + defend 4–6 + debrief 1–2 ≈ 11–16) | 8 min |

## What works

- **Register holds throughout, and that is the thing that mattered.** No suspicion meter, no snooping
  reward, no "investigate" ask. Every welfare mention is paired with support and privacy: the `samira`
  beat routes a worry to her manager/HR privately; the montage ends on her kind resolution, as the brief
  requires; the "Seen, said, true" card names the facts, the rumour and the truth (father in hospital)
  without ever marking her; the no-blame line and the host's "nobody's a suspect for having a hard week"
  close the loop. Ross is "not a villain", Craig is "not malicious".
- **One clear, repeatable lesson.** "Your login is you. Offers get reported. Concerns go to the right
  person, as facts." The Monday card reduces it to one habit plus one named person.
- **Facts match `concepts.md`.** All five key messages are represented (login is you; report offers; deny
  unrequested prompts; notice/note/pass fairly; unusual isn't wrong). "Taking data to a new job can be a
  crime" (s170 DPA), deny-all-and-ring-any-hour for the prompt storm, and "the same message goes to
  several people, one report warns everyone" are all faithful to the source.
- **Fair defend set.** The mirror pair (item 5 look-alike phish priming MFA approval → Report; item 6
  genuine, pushy locked-out colleague → Verify-not-refuse) gives a similar genuine item right after the
  likely miss. Items 2 and 4 model the hard case — a genuine colleague making an unsafe ask — with the
  nuance carried in the feedback, not a trap. Every declared tell is used by an item.
- **Shells are structurally sound.** Full and defend-only prefixes, globals, objective/eventMapping
  wiring and `conclusionTaskId` match the E11 one-aim shape; the defend-only shell correctly drops
  mistake/flip, keeps the concern form and both concept cards, and carries no stray flip strings.

## Findings

### Blockers

None. The tone rules in section 18 are met.

### Majors

**MAJOR-1 — concern form renders the feedback twice on screen (engine / needs-user).**
`public/break_escape/js/minigames/concern-form/concern-form-minigame.js:242` announces the feedback into
the visible `.cf-live` paragraph, and `:216` renders the *same* string again in `.cf-feedback-line` just
below. Unlike the sort drill's live region, `.cf-live` is **not** visually hidden:
`css/concern-form-minigame.css:37-38` styles it as an ordinary 13px dim paragraph (hidden only when
empty), whereas `css/sort-drill-minigame.css:39` clips `.sd-live` off-screen. So after "Check my report"
the learner sees the feedback sentence twice. This is the same class of glitch the orchestrator noted for
`sd-live`, carried into the new ENG-12 surface, and it affects every episode that uses the concern form.
Fix (engine, route to the ENG-12 owner): make `.cf-live` a visually-hidden live region using the
`.sd-live` clip pattern, so the screen-reader announcement no longer prints on screen.

**MAJOR-2 — three concern-form verdict tones flattened into one line, losing the fair, affirming
register (episode-local).**
The model (`concern-form-model.js:52-55`) grades the feedback: `feedbackFactsVerdict` (good facts *plus* a
verdict) is meant to affirm the facts first ("Your facts are what matter here. Leave the conclusion
out…"), while `feedbackVerdictOnly` and `feedbackThinVerdict` steer harder. E16 overrides all three with
one identical sentence (`e16/full_only.json:106-108`; full erb `:428-430`; defend erb `:353-355`):
"That's a conclusion, not something you saw…". For the learner who did the right thing — picked several
real facts and added one conclusion chip — "not something you saw" is both inaccurate (they *did* include
facts) and colder than the surface's no-blame register warrants. It tells someone who mostly got it right
that they got it wrong.
Fix (episode-local wording): give `feedbackFactsVerdict` its own affirming line and keep the firmer line
only for the no-facts/thin cases. Suggested:
- `feedbackFactsVerdict` → "Your facts are exactly what's needed. Just leave the conclusion out, and let
  whoever looks into it reach their own — that's fairer to everyone."
- `feedbackVerdictOnly` / `feedbackThinVerdict` → keep the current "That's a conclusion, not something you
  saw…" line (it fits a report that is *only* a verdict).

### Minors

**MINOR-1 — "the lender's record" reads as a financial lender at an insurer (episode-local).**
Montage line `shared_login / service_desk` (`e16/full_only.json:69`; full erb `:456`): "The version where
a login was shared: whatever was opened went on the lender's record." "Lender" is meant as "the colleague
who lent their login", but at Quayholt *Insurance* it reads first as a lending institution, and it does
not match the sibling line's clearer "under your name, on the record" (`:68`).
Fix: old → "whatever was opened went on the lender's record"; new → "whatever was opened went on the
record of whoever's login it was".

**MINOR-2 — the concern-form guidance paragraph is shown twice (engine / needs-user).**
`concern-form-minigame.js:109` prints the long "Who to tell:…" routing paragraph on the intro step, and
`:217` prints the whole paragraph again under *every* feedback check in the build step. The routing text
is a dense five-route sentence; repeating it in full after each "Check my report" is clutter rather than
help. Fix (engine, ENG-12 owner): show the guidance once — on intro, or persistently in the build step —
rather than re-appending it inside the feedback block.

**MINOR-3 — stale `_notes` in `e16/full_only.json` about the generator carrying `concernForm`
(episode-local / housekeeping).**
`full_only.json:9` (`_notes.concernForm`) and the `:4` `_about` both say the concern form is "KEPT IN
BOTH VARIANTS … but `gen_e8_e17_shells.py` `defend_only()` … does not copy `concernForm` today", and flag
it as an open wiring question. That is no longer true: `gen_e8_e17_shells.py:456` lists `concernForm` in
`DEFEND_HALF_KEYS` and `:464` (`defend_half_keys`, called at `:523`) copies it from `full_only.json`, and
the generated defend-only erb already carries the full concern form (`_defend/scenario.json.erb:301-357`).
The note describes a problem that has been solved and should be updated or removed so it does not re-open a
closed question.

## Verified, not a defect

- **The montage has no `flipDefenderLine`.** Confirmed: `flip-view.js:149` appends a defender line only
  when `strings.flipDefenderLine` is authored, and E16 authors none. This is correct and deliberate, not a
  gap. The worked example E11 also omits it, and the brief (section 10) requires the montage to **end on
  Samira's resolution** as the last thing seen; because a defender line renders *after* all beats, adding
  one would displace Samira's kind outcome from the final position. The no-blame reassurance it would
  carry is already present in the `outside_offer/report` beat ("You are not in trouble for being
  approached"), the Samira beat, and the debrief `noBlameLine`. Do not add one.

## Verdict

**Revise and re-review (cycle 2).** No blockers; the register — the load-bearing thing for this episode —
holds cleanly, the facts track the module, and the shells are structurally sound. The two engine majors
(MAJOR-1, and the related MINOR-2) are shared ENG-12 defects, not E16 content, and should go to the engine
owner. The one content major (MAJOR-2) and MINOR-1 are small wording fixes in the episode files; MINOR-3
is a doc tidy. Once MAJOR-2 and the two minors are applied and the engine majors are tracked, E16 is ready
to ship.

---
Pre-ship still owed (from BRAND_ADDITIONS.md, not a review finding): web-search of the three new names
(Ross Garside, Samira Nawaz, Craig Pickering).
