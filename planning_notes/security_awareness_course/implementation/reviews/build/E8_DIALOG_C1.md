# E8 "After the click": dialogue review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this review file excepted). Method: the
`npc-dialog-review` skill run in full, adapted to the awareness kind, in the manner of
`planning_notes/phishing_and_social_engineering/awareness/DIALOG_REVIEW_C1_A.md` and `DIALOG_REVIEW_C5.md`.
Kind of game: the awareness product "Incident Simulations: Critical Cases", short education-first episodes
for non-technical staff on the neutral corporate skin. No VMs, no combat, no spy framing, no runtime
language model. The bar: correct security advice, a warm no-blame voice, plain UK English, feedback that
matches what the learner did, and host lines (voiced later) that are easy to say aloud with no printed
variables.

"Dialogue" here means every learner-facing string: host ink, brief, scope note, OSINT copy, composed
phish templates and seeded mail, defend-item bodies, per-flag notes, `whyFine`, `ifTrusted`,
`reportReply`, flip and aftermath lines, debrief panels (rule-of-thumb, concept cards, no-blame line,
Monday card, `defendOnly`), and the conclusion screens.

No content files changed. This review file is the only output.

## Where the copy lives (so fixes survive a regenerate)

- **Triage copy and episode strings** (set brief, per-flag notes, `whyFine`, `ifTrusted`, `reportReply`,
  flip strings, concept cards, Monday card, `noBlameLine`, `defendOnly`, `scopeNote`) are authored in
  `planning_notes/phishing_and_social_engineering/awareness/e8/{defend,attack,full_only}.json` and copied
  into the shells. Fix the fragment; the shell inherits it.
- **The full-episode host ink** `awareness_e8_after_the_click/ink/anjali_rao.ink` is hand-authored (no
  generator stamp). Fix the ink directly.
- **The defend-only host ink and the defend-only `defendIntro`/`brief`/`desc`** are written by
  `gen_e8_e17_shells.py` (the ink carries a `// Written by …` stamp). Fix the generator string, or a
  rebuild reverts it.

## Counts

| Severity | Count |
|---|---:|
| Blocker | 0 |
| Major | 0 |
| Minor | 3 |
| Worth considering | 2 |

Voiced-line impact: two host lines proposed for change (both in the full-episode ink); see the list at
the end. Awareness carries no TTS cache, so neither change invalidates recorded audio.

## Phase 1 — compile / lint / validate

- **dialoguelint** `scenarios/awareness_e8_after_the_click/`: person ink lines=6 median=25 p90=30 max=30;
  `Totals by rule: none`. **Clean.**
- **dialoguelint** `scenarios/awareness_e8_after_the_click_defend/`: person ink lines=3 median=24 p90=30
  max=30; `Totals by rule: none`. **Clean.** No `line-len`, `choice-len`, `you-after-choice`,
  `not-x-but-y`, `exit-no-reply`, `blank-reentry`, `choice-fallthrough`, `tag-on-narrator`,
  `phone-self-prefix`. Both host inks sit exactly on the 30-word bubble cap, none over.
- Compile / `validate_scenario.rb` not re-run here (design review C2 ran both the same day: both shells
  validate under `--strict-social --no-graph --skip-ink`, parity 10/10, full bridge 13/13). Skipped per
  brief so no files are rewritten.

## Phase 2 — dialogue review

### 2a. Attribution & narration — OK
Every spoken line in both host inks is prefixed `Anjali Rao:`, which resolves exactly to the NPC
`id: anjali_rao` / `displayName: "Anjali Rao"` in both erbs (full `:820-821`, defend `:367-368`). No
shortened name, no role word, no unresolved prefix. No stage-direction emotes; no narration that needs a
`Narrator:` voice. The hosts are stationary (no `behavior.patrol`) and no line describes movement, so
2a-bis movement/geography contradictions do not arise. The kiosk the briefs point to exists as an object
in both rooms.

### 2a-ter. Voices — OK (house convention)
Neither E8 shell defines a `voice` block for Anjali. This is the awareness house convention, not a gap:
no built awareness episode (E3, E5, E16, E19 all checked) defines a host voice block — hosts are voiced
later and the course carries no TTS cache (DIALOG_REVIEW_C5). Anjali's register is consistent with her
other appearances (E16 "information security … you're not here to catch anyone"; E19 "I'd rather you
called me about nothing than not called about something"): calm, plain, reassuring, first-person. No two
co-present characters share a voice (she is the only speaker in each room).

### 2b. Player choices are spoken dialogue — OK
The only choice in each host ink is `+ [Thanks, Anjali.]` — first-person, the player's own words, no
`You:` echo, no third-person menu label. The triage decisions (Trust/Report/Delete/Verify) are engine
buttons, not ink choices, and the brief phrases them plainly.

### 2c / 2c-bis. Hub structure & starved knots — OK
`=== start === -> hub`; `=== hub ===` carries the conditional greeting and one unconditional sticky
`+ [Thanks, Anjali.]` tagged `#exit_conversation`, which re-enters `hub`. The m03 `hub_quiet` pattern is
used correctly: the goodbye parks in `hub`, a re-talk resets `hub_quiet` and re-enters. The hub always
presents the sticky exit, so there is no empty choice list and no starved knot on re-entry (confirmed by
the clean `blank-reentry` lint). Exit conversation is one line ("Any time."). No hard `-> END`.

### 2d / 2e. Choices that matter & cross-file state — OK
The host ink sets no state and gates nothing: task completion is driven by the kiosk through
`eventMappings` (`send_takeover_phish` on `phish_takeover_victim_attempts > 0`; `sort_the_signs` /
`sort the signs` on the defend-done global). The ink only *reads* `phish_takeover_victim_attempts` and
`episode_e8_after_the_click_defend_done` (full) / `episode_e8_after_the_click_defend_defend_done`
(defend) for its welcome line, and each is declared in its shell's `globalVariables` (full `:71`, `:79`;
defend `:56`). No `#set_global` in either ink, so no set-but-never-read risk from the dialogue. The one
consequential learner choice (the forged From line) is replayed by the flip, which the fragments wire
correctly. Nothing in the dialogue soft-locks the critical path.

### 2f / 2g / 2h. Influence, syntax, KO — N/A / OK
No influence variable (awareness hosts are pure framing, like every other awareness host — legitimately
none). No markdown bold, no bullet-list dialogue, no stray `*` lines, no apparent loose ends. KO does not
apply to the awareness kind.

### 2i. Teaching content & consistency — mostly OK, three minors
- The lesson is single and repeated cleanly: report fast, the report answers five questions, and for
  account-takeover signs change your password on the real site while for device/malware signs leave the
  device as it is. The two concept cards, the rule-of-thumb and the Monday card are correct and match
  core_04 / core_01 LO6. The Monday card pairs both moves correctly ("report it straight away, change
  your password on the real site, and leave the device as it is").
- Per-item copy is concrete, plain and no-blame; `reportReply` lines close the loop ("You caught it from
  the Sent folder, which is exactly the sign"). The genuine items (Reuben's own slip, planned
  maintenance) are the calibration mirror so "anything about IT is bad" does not win.
- UK English throughout; "Cyber Security" term does not arise. Addresses all `.example`.
- Three wording findings below.

---

## MINOR

### MINOR-1 (carried from design C2 N1) — defend-only `defendIntro` frames "leave the device as it is" as the one universal move
`scenarios/awareness_e8_after_the_click_defend/scenario.json.erb:306`; source `gen_e8_e17_shells.py:271`.

> "… the one move that works for every real sign is to report it and **leave the device as it is**. Take
> them at your own pace."

For the account-takeover signs that dominate this very set (row 1 unexpected sent item, row 2 unrequested
reset, row 3 MFA push) the first move is report **and change your password on the real site** —
"leave the device as it is" fits only the row-5 ransom-note/device sign. The C1 fixes already widened the
host completion lines and the defend host after-line to "report it and **let the team act**"
(`anjali_rao.ink:22`), and the Monday card pairs both moves. This `defendIntro` is now the lone string
still asserting the device move as universal, and it shows only to defend-only learners (the full shell
has no `defendIntro`), which is why it slipped the earlier passes. Fix in the generator source and
regenerate, not the shell by hand:

- `gen_e8_e17_shells.py:271` (and shell `:306`)
  - old: `… the one move that works for every real sign is to report it and leave the device as it is. Take them at your own pace.`
  - new: `… the one move that works for every real sign is to report it and let the team act. Take them at your own pace.`

Per-item feedback already carries "leave the device as it is" on the ransom-note row, so nothing is lost.

### MINOR-2 — full-episode host landed-greeting "fell for it" clashes with the no-blame register
`scenarios/awareness_e8_after_the_click/ink/anjali_rao.ink:31` (hand-authored ink; edit directly). Voiced
host line.

> "Good. The email's gone, and your colleague **fell for it**, the way most people eventually do. Now
> take their seat and see what someone else is doing with their account."

Everywhere else the course says "clicks" / "signed in" and treats the victim gently — the same colleague
in the defend set "owns up to his own mistake" and is "doing exactly the right thing", and the flip says
"this time he signed in". "Fell for it" is the one blame-tinged phrase in Anjali's mouth; the "the way
most people eventually do" softener does not fully offset it, and it reads oddly just before the learner
sits in that colleague's seat. Align to the flip's own verb:

- `anjali_rao.ink:31`
  - old: `Good. The email's gone, and your colleague fell for it, the way most people eventually do. Now take their seat and see what someone else is doing with their account.`
  - new: `Good. The email's gone, and your colleague signed in, the way most people eventually do. Now take their seat and see what someone else is doing with their account.`

### MINOR-3 — full-episode host completion line uses a comma splice where the defend ink uses a colon
`scenarios/awareness_e8_after_the_click/ink/anjali_rao.ink:28` (hand-authored ink). Voiced host line;
punctuation only, so no effect on the spoken take, but the printed bubble shows it and the defend ink
renders the same sentence correctly.

> "The one move that works for every real sign is the same**,** report it and let the team act. Nobody's
> ever in trouble for reporting."

The defend ink (`awareness_e8_after_the_click_defend/ink/anjali_rao.ink:22`) writes the identical idea as
"… is the same**:** report it and let the team act." Normalise the full ink to the colon:

- `anjali_rao.ink:28`
  - old: `The one move that works for every real sign is the same, report it and let the team act. Nobody's ever in trouble for reporting.`
  - new: `The one move that works for every real sign is the same: report it and let the team act. Nobody's ever in trouble for reporting.`

---

## WORTH CONSIDERING (polish, optional)

### WC-1 — flip aftermath intro carries the "not carelessness" negative-parallelism shape
`planning_notes/phishing_and_social_engineering/awareness/e8/full_only.json:14` (flipAftermath.intro;
shipped at full erb `:349`-region).

> "… So he did. That **was not carelessness: it was** built to pass for the notice he acts on. …"

This is the "not X, Y" shape the project style guide flags, and DIALOG_REVIEW_C1_A MINOR-6 and
DIALOG_REVIEW_C5 both noted the "built carefully … is not carelessness" empathy beat recurring across
episodes. Here it is a single instance and it earns its keep (the empathy beat is the point), so this is
optional. If smoothed, e.g. "So he did. It was built to pass for the notice he acts on — anyone on a busy
claims desk would have done the same." Low priority.

### WC-2 — per-flag note end punctuation (pre-existing, cosmetic)
The `perFlagNote` strings in `e8/defend.json` consistently omit a closing full stop, while `ifTrusted`,
`whyFine` and `reportReply` carry one. This is internally consistent *within* the per-flag field and
matches the mixed-but-pre-existing pattern DIALOG_REVIEW_C5 recorded as C5-T2 across the whole built set,
so it is not an E8 defect. Worth a one-pass normalisation only if an editor is already in these fields;
not to act on under the stop rule.

---

## Voiced host lines proposed for change

Both are in `scenarios/awareness_e8_after_the_click/ink/anjali_rao.ink` (hand-authored; voiced later, no
TTS cache to invalidate):

1. `:31` — "… your colleague **fell for it** …" → "… your colleague **signed in** …" (MINOR-2).
2. `:28` — "… is the same**,** report it …" → "… is the same**:** report it …" (MINOR-3, punctuation).

The `defendIntro` fix (MINOR-1) is a triage-panel string, not a voiced host line, and is fixed in the
generator source.

## Verdict

**Dialogue is ship-worthy as the pilot; no blocker, no major.** Phase 1 is clean on both shells
(dialoguelint `Totals by rule: none`, both host inks within the 30-word cap). Attribution resolves
exactly, the hub/sticky-exit/`hub_quiet` structure is correct with no starved knot, the one player choice
is first-person spoken, all globals the ink reads are declared, and the teaching content is single,
correct and no-blame in plain UK English. Three minors remain: MINOR-1 is the carried design-C2 N1 (widen
the defend-only `defendIntro` to "let the team act", via the generator), and MINOR-2 / MINOR-3 are two
small full-episode host-line edits (one register, one punctuation). Fixing MINOR-1 and MINOR-2 is
recommended before close; MINOR-3 and the two polish items are optional.

## C1 outcomes (2026-10-29)

- MINOR-1 fixed in `gen_e8_e17_shells.py` (defendIntro now "report it and let the team act"); only E8's defend-only `scenario.json.erb` was regenerated and copied in. Other episodes' generated output matched the repo.
- MINOR-2 fixed: `anjali_rao.ink` "your colleague fell for it" -> "your colleague signed in".
- MINOR-3 fixed: `anjali_rao.ink` "is the same, report it" -> "is the same: report it".
- Ink recompiled; tagdiff reports structure unchanged; dialoguelint `Totals by rule: none`; both E8 erbs validate under `--strict-social --no-graph --skip-ink`.
- Keyless :3001 bridge e8-full 13/13 PASS.
- WC-1 and WC-2 left alone (optional polish).
