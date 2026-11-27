# E14 "Social media and oversharing": design review C3 (+ dialogue)

Date: 2026-10-30. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product
("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the
neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no runtime language model. E14 is the
one attack-first episode in the set: an OSINT-then-write attack half, a built defender-inbox flip keyed by
the chosen pretext, then a defend half (6-item SMS/DM set + the unscored "Post or Not?" sort drill + the
ENG-13 privacy panel). Company Merrin & Sallow Architects; host the co-founder Julian Sallow; module
core_12. Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review`/`npc-dialog-review` skills
adapted to this kind, and the C1/C2 reviews plus the P1 persona report in this folder.

This pass judged the files fresh. I did **not** run a new bridge; I judged the screens from the authored
data, the erbs and the engine code, and I leaned on the C2 render (game 4883, 19/19) for the flip, which
is the one screen that turns on the aw-ux2 replay branch. Where a finding turns on on-screen behaviour I
say so.

Ran (all E14-only, all green):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema and strict-social
  pass. **No SOCIAL warning on either shell** — C2's one live warning (`phish_df_cover_landed` set but
  unread) is gone: the global is now set (full erb `:850`) and read by an eventMapping condition (`:939`),
  so it is wired, not orphaned. Only the generic m01-shaped SUGGESTION noise remains.
- `dialoguelint.mjs` both shells: full `lines=7 median=17 p90=23 max=23`; defend `lines=3 median=28 p90=28
  max=28`. No rule hits; every host line under 30 words.
- `social-awareness-fragment-erb-parity.test.mjs`: **20/20 pass** (E14 included). `social-awareness-
  rule-of-thumb.test.mjs`: 2/2 pass.
- No em/en dashes in learner-facing copy; the only raw tokens are engine sort-drill/triage placeholders
  the engine fills.

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 3 | 2 | 0 | 1 |
| **Total** | **3** | **2** | **0** | **1** |

Queued engine items the C2 brief told me not to re-raise are excluded from the counts and listed at the
end (OSINT pin cue / P1 E14-M1; "Post or Not?" summary marks / P1 E14-M4; handle font on `.tri-phone-number`
/ P1 E14-m1; privacy-panel live-region line / P1 E14-m2). The result headline/sub-line tension (P1 E14-m8)
is also engine and unverified this pass; it is carried as a note, not counted.

## C2 + P1 closure

| Item | What was wrong | Verified now | Status |
|---|---|---|---|
| **C2 D1** (minor) | full panel note "...Tighten Dani's profile first, then do the same on your own" promised a second "your own" panel the single panel never shows | full erb privacyPanel `note` (`:456`) is now "Each change closes a found fact on the board. The same settings are the ones to check on your own profile." — exactly C2's recommended wording; the dangling on-screen step is gone. | **Closed** |
| **C2 D4** (minor) | `phish_df_cover_landed` set but read by nothing; the one live validator warning | now read: full erb `:939` branches an eventMapping on `globalVars.phish_df_cover_landed && !..._defend_done`; validator raises no SOCIAL warning. | **Closed** |
| **C2 D2** (minor) | `full_only.json` docs stale about how the defend-half keys reach the defend-only shell | the `_about` and the privacyPanel `_note_defendOnly` now describe the generator copy (`DEFEND_HALF_KEYS`) and that the full erb's note is hand-authored and intentionally differs; no self-contradiction left. | **Closed** |
| **P1 E14-m3** (minor) | "Leave this off:" prefix on every privacy line read as "don't switch it on" | the panel `strings.leaveOff` is now "Why it matters: " (full erb `:454`, defend erb `:420` carries the self-framed note); the prefix no longer inverts the switch. | **Closed** |
| **C2 / P1 de-phish** | the set spoke "phish" for fake social accounts | `labels.teamBadge` "Fakes stopped for the team: {n}", `teamBadgeTitle`, `phishCaughtLabel` "Fakes caught"; bands "you caught the fakes"; `resultCopy` "fake messages"/"gave a stranger something to work with". Reads as fakes, not phish. | **Closed** |
| **C2 E14-M2** (P1) | the clean landed send dead-ended on "Nothing to replay" | unchanged from C2's render finding: the aw-ux2 branch replays the message and shows the per-choice defender line (`flipDefenderLineByChoice`, full erb `:475-478`, erb-only, parity-allowed); `flipLandedNoTells` stays as the fallback for the catch-up decoy, by design. | **Closed** (per C2 render) |
| **C2 D3** (minor) | catch-up's by-choice flip line is dead content (the decoy never lands) | still authored (`full_only.json:50`, full erb `:478`/`:628`); still harmless. See D2 below. | **Carried** |
| **C2 D5** (minor) | `pp_security_answer` "closes" the pet fact without removing the disclosure | unchanged, defensible (the made-up answer is core_12's durable fix; the pet post is also caught by `pp_posts`). | **Carried (defensible)** |

The two C1 majors and the C2 live warning are genuinely closed; the privacy-panel split C2 judged "the
right call, generator-backed" still holds (full erb keeps the board/Dani note; the generator copies the
self-framed `full_only.json` note into the defend-only shell).

## What works

- **One clear lesson a clerk can repeat on Monday**, matching core_12: public posts add up to a map of
  your firm; small details (a badge, a screen, a named system, a leave countdown, a pet's name) do the
  damage; a real recruiter never needs your systems or org chart; tighten settings and use a made-up
  security answer. P1's persona (Jo) left with exactly this.
- **The flip pays off the attack** (C2 render): a careful, tell-free message that lands replays itself in
  Yasmin's seat and names the facts that made it fit the week, keyed to the chosen pretext. That is the
  lesson's pivot and it fires on the default happy path.
- **The defend set is fair and matched.** 3 report + 3 trust, so refusing everything is not the win; the
  mirror pair is clean (row 1 normal-looking fake recruiter → Report; row 6 suspicious-looking genuine
  former colleague → Trust), and the genuine agency recruiter (row 3) sits right after the fake one as the
  matched genuine item after the likely miss. `recon_request` is the consistent, teachable tell across
  rows 1 and 4; the per-item reasons name it plainly.
- **Advice stays proportionate.** The sort drill is weighted to Tweak/Hold with two clean Post cards (the
  dog photo, the switched-off desk), the privacy panel is "connections only" not "delete everything", and
  the no-blame line says "the fix is a setting and a pause, not shame".
- **No-blame register throughout**, in both briefs, the per-item feedback ("'report everything' is not the
  win"), the `noBlameLine`, and Julian's close. Both shells validate with no warnings; parity and the
  rule-of-thumb suite are green; the defend-only shell is self-contained (no Dani, no board).

## Findings

### D1 — the attack half leans on jargon a non-technical learner will not follow on first read: "red team", "pretext message", "reconnaissance". Minor; needs-user (the spec embraces it) + episode-local wording.

P1 raised this (E14-m4) and it is still live. Learner-facing, episode-authored:
- `scenario_brief` / `strings.brief` (full erb `:4` / `:462`): "First you're on the red team..." and "pin
  what an attacker would use";
- `endGoal` (`:5`): "Write the pretext message..."; the task title (`:33`) "Send the pretext message";
- `perFlagNote`/`ifTrusted` reason text uses "reconnaissance" and "pretext" (`:177`, `:247`, `:249`).

For the stated audience (Jo, 60s receptionist in the P1 run) "red team", "pretext" and "reconnaissance"
are not first-read words. This is **partly inherent** to the one attack-first episode in the set, and the
spec (§8) uses "red team" deliberately, so it is a decision for the user rather than a clear defect; and
P1 shows Jo still extracted the right lesson. But against the brief's "words a non-technical learner
follows on first read" bar it is worth one cheap pass. Smallest fixes that keep the design, old -> new:
- brief "First you're on the red team: look at what one colleague..." -> "First you play the attacker's
  side: look at what one colleague...";
- endGoal / task title "the pretext message" -> "the test message" (or "the pretend message");
- reason text "reconnaissance" -> "working out how to target you" where it appears.
(The composer UI's own "Pretext" field label is engine chrome, not episode copy, so it is out of scope
here; flag to the engine owner if the gloss should reach the control.)

### D2 — the catch-up pretext's by-choice flip line is unreachable dead content. Minor; episode-local. (Carried C2 D3 / MI1.)

`flipDefenderLineByChoice.df_pretext_catchup` ("A catch-up asks for nothing...", `full_only.json:50`, full
erb `:478`) renders only on a landed send; the catch-up fails the required `pretextRelevant` factor, so it
never lands and always takes the did-not-land branch. Dead, harmless (the did-not-land view is the correct
teaching for the decoy). Either accept it, or drop the key so it does not read as live and get voiced by a
later TTS pass. Unchanged since C1; still a tidy-up only.

### D3 — `pp_security_answer` "closes" the pet fact without making the dog's name private. Minor; episode-local, defensible. (Carried C2 D5 / MI3.)

Four of the five privacy settings genuinely close the fact they name; the fifth (made-up security answer,
mapped to `se_intel_df_pet`) neutralises the fact's usefulness rather than hiding the disclosure. The panel
frames every toggle as closing a found fact, a slight stretch for this row. Defensible: core_12 favours the
made-up answer as the durable fix, and the pet post is also covered by `pp_posts`. Logged, not required.

## Dialogue pass (voiced host lines)

Julian's ink reads as spoken in both shells. The full-shell lines (welcome, after-send, both completion
lines, "Any time.") are ≤23 words, calm-colleague register, no printed variables, UK English, no em/en
dashes; the hub-only structure (m03 `hub_quiet` pattern) is clean and the dead handoff-style content that
bit E15 is not present here. The three defend-only lines run to 28 words (the dialoguelint ceiling), the
same borderline the other defend-only hosts sit on; I would leave them. No host line needs a change — D1
is on-screen episode copy, not a spoken line.

Non-host learner copy read in full (both briefs, `defendIntro`, the six item bodies with their
`whyFine`/`perFlagNote`/`ifTrusted`/`reportReply`, the three pretext templates and two ask tails, the
by-choice flip lines, the `mondayCard`, `noBlameLine`, the sort-drill reasons and the privacy note). Apart
from the D1 jargon it reads well on first pass; UK English throughout.

## Notes (not findings)

- **E14 did not adopt the batch-11 result keys** (`confirmPrompt`, `caughtBreakdown`, `criticalPenalty`):
  no social warning follows, and the set is `verifyVerdict:false` so the confirm-prompt flow that bites
  E15 does not apply here. But it means P1's result headline/sub-line tension (E14-m8: "Getting there: a
  few signs slipped past" at 80% while "Fakes caught 3 of 3") is likely still live, since the newer
  breakdown copy that would reconcile it was not wired in. Engine, shared across the pre-batch-11 sets,
  unverified without a render; carried as a note for the engine owner, not an E14 defect.
- **The rule of thumb is phishing-flavoured** and sits loosely on a social-media set with no money/code
  pressure (P1 E14-m7). Byte-identical across the 20 episodes by design (§17); the Monday card carries the
  core_12 habit. Product decision, as elsewhere.
- **Timing over target.** P1 estimated ~18 min full against a 15-minute budget, the two unscored
  activities (feed drafts, privacy panel) before the scored inbox being the main sink. Product-level
  pacing note across the wave; no fresh timed run this pass.
- **Excluded queued engine items** (per the C2 brief): OSINT pin cue (P1 E14-M1), "Post or Not?" summary
  marks (P1 E14-M4), address font on `.tri-phone-number` handles (P1 E14-m1), privacy-panel live-region
  stray text (P1 E14-m2). Still owed to the engine batch, not re-raised here.

## Verdict per stage

| Stage | Full | Defend-only |
|---|---|---|
| brief | pass (D1 jargon, optional) | pass |
| osint | pass (5 facts, each with a reduce note) | — |
| write | pass (3 pretexts + 2 ask tails; catch-up decoy reads as English) | — |
| flip | pass (C2 render: clean landed send replays the message + per-choice defender line + Yasmin's seat) | — |
| defend | pass (6-item set fair and matched; sort drill proportionate; privacy panel self-contained) | pass |
| debrief | pass | pass |

**Ship-ready.** The two C1 majors, C2's live validator warning (D4), C2 D1 (the "your own" panel promise)
and C2 D2 (stale docs) are all closed, plus the P1 "Leave this off:" prefix is fixed and the set is
de-phished. What remains is three minors: the attack-half jargon (D1, a cheap wording pass if the user
wants it, otherwise an accepted design choice), the dead catch-up flip line (D2), and the defensible
security-answer mapping (D3). None blocks ship. Clear D1 and D2 at leisure; D3 accepted.

---

### Return (one line each)

- Counts: 0 blocker, 0 major, 3 minor (2 episode-local, 1 needs-user; 0 engine counted).
- Closure: C2 D1 (panel "your own" promise) closed; C2 D4 (`phish_df_cover_landed`) closed and wired, no
  validator warning; C2 D2 (stale `full_only.json` docs) closed; P1 "Leave this off:" prefix now "Why it
  matters:"; de-phish to "fakes" done; flip payoff holds (C2 render).
- Blockers: none.
- Majors: none.
- Minor D1 (needs-user): "red team" / "pretext message" / "reconnaissance" in the brief, endGoal, task
  title and reason text are not first-read words for the audience — gloss or plain-word if wanted; partly
  inherent to the attack-first design.
- Minor D2 (episode-local): dead `df_pretext_catchup` by-choice flip line — drop it or accept it.
- Minor D3 (episode-local, defensible): `pp_security_answer` neutralises rather than hides the pet fact.
- Verdict: ship-ready. Validators/parity/dialoguelint green; flip judged from the C2 render (4883, 19/19),
  everything else from code and the erbs; a fresh timed playtest is still owed for the budget check.
