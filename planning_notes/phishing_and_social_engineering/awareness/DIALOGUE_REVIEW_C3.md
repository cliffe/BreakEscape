# Awareness dialogue review — formal cycle 3

Fresh reviewer, read-only (`npc-dialog-review` skill). **No files changed, nothing committed.**

Scope: all 7 awareness episodes (full `scenarios/awareness_e*/scenario.json.erb` + ink) and their
defend-only shells, plus the 24 pre/post check forms (`awareness_{pre,post}_*`), and the fragment
sources (`e{1..7}/defend.json`, `attack.json`) and four generators. Covered host ink, episode strings
(brief, flip, debrief, Monday card, defendOnly, no-blame), triage copy (perFlagNote, whyFine, ifTrusted,
reportReply), the E3 call scripts, SMS/QR/push cards and the E4/E7 voicemail transcripts.

**Focus for this cycle** (per the brief): the surfaces added in data rounds 3–6 —
`flipLandedNoTells`, `flipMissed`/`flipMissedHeading`, `failMissed`, `replies.missed`, the `requires`
gating of fact-bearing lines, `flagAlternatives`, and the reworded post-check host lines (item 8, the
only recently-changed **voiced** lines). Judged for voice/tone consistency, no-blame warmth, plain UK
English, accuracy of the security advice, whether feedback matches what the learner did, cross-episode
repetition, the 30-word spoken-line cap, patronising/over-praise, and the "Sound less like AI" rules.

Read first: `DIALOG_REVIEW_C1_A.md`, `DIALOG_REVIEW_C1_B.md`, `DIALOG_REVIEW_C2.md`, `DIALOG_LOG.md`
(rounds 3–6), design `11`.

## Severity counts

| Severity | Count |
|---|---:|
| Blocker | 0 |
| Major | 0 |
| Minor | 5 |
| Trivial | 1 |

**Voiced-line impact: none.** Every finding below is on-screen text (flip narration, briefs,
perFlagNotes). No fix touches an NPC/host spoken line, so none carries a TTS cost. The only voiced lines
changed in rounds 5–6 were the twelve post-check host "that's done" lines (item 8); they read naturally,
sit under the 30-word cap and are **confirmed good — no finding**.

## Phase 1 — compile / lint / validate (clean)

- **Compile:** all seven full-episode ink files compile, `Failed: 0`. The only `-> END` warning is the
  legitimate call hang-up in `leila_servicedesk.ink`.
- **dialoguelint across all 38 shells:** `Totals by rule: none`. No `line-len`, `choice-len`,
  `phone-self-prefix`, `not-x-but-y`, `exit-no-reply`, `blank-reentry`, `choice-fallthrough` or
  `tag-on-narrator`. The longest host line sits at the 30-word cap. The round-5 `requires` gating of the
  E3 pretext choices (`leila_servicedesk.ink`) recompiles clean and, as the log claims, changed
  conditions only — no choice wording moved, so no voiced line changed.
- **Hub structure:** generated host inks keep the `hub_quiet` re-entry pattern with one unconditional
  sticky `+` exit tagged `#exit_conversation`; no starved knots.

## Cycle-2 findings — all confirmed closed

| C2 finding | Status |
|---|---|
| C2-1 `noBlameLine` identical opener in E1/E5/E6/E7 | **Fixed.** All seven openers are now distinct (E1 "Nobody is marked down…", E2 "No one is keeping score…", E3 "Nothing here counts…", E4 "There's no mark against you…", E5 "A miss here is no reflection…", E6 "Being caught by one of these is no fault of yours.", E7 "A familiar voice is hard to doubt…"). |
| C2-2 `defendOnly` verbatim E1≡E6 | **Fixed.** E6 now role-specific ("These landed on a phone between jobs…"); E5 has its own opener ("These pages were built to pass for the real sign-in…"). |
| C2-3 E6 `forms.` called "the name of the page" | **Fixed.** Now "The 'forms.' in front is one of Tarrowby's own services, the same as 'mail.' or 'hr.' would be." (`e6/defend.json:124`). |
| C2-4 E7 brief named "the finance office" not Tom | **Fixed.** Full brief now names "Tom Reilly in accounts payable" (`e7/defend.json:157` tail / erb `:308`). |

## Round 3–6 new surfaces — verified correct

- **`replies.missed`** (full episodes only): in-voice, text-only (no TTS), concrete and varied —
  Adaeze won't change payee details off an email, Hana didn't type her password because the address was
  wrong, Tom won't release off a message and will ring Ravinder back. On-message, warm, no finding.
- **`requires` gating**: fact-bearing subjects/pretext lines (E1 `s_invoice`, E2 WHO-114 subject, E4
  diary subject, E3 `give_manager`/`give_staffid`/`name_drop_director`/`cant_callback`) are now withheld
  until the fact is found. This tightens "feedback matches what the learner did" — a learner who never
  researched a detail is no longer shown a line asserting it. Correct.
- **`flagAlternatives`**: the E6 IT-email (`e6_mfa_scan`) and E7 CEO-email groupings credit the
  equivalent tick; the perFlagNotes read plainly. Correct.
- **`failMissed`**: E6/E7 `urgencyCalibrated.failMissed` are deliberately `""` (round 6 P4-7) so the
  pressure line is hidden on a miss; the required `pretextRelevant` row carries the reason. Correct.
- **New E7 flag `vish_callback_pressure`**: the perFlagNotes (`e7/defend.json:66,113`) land the
  "a sender who talks you out of the callback is the warning sign" lesson well. (Punctuation nit in
  TRIVIAL-1.)

---

## MINOR

### C3-1 — Flip strings have drifted between the fragments and the shipped full episodes
The flip strings were edited on only one side in rounds 5–6, so the fragment (the stated source of
record) and the shipped full `scenario.json.erb` no longer match. **This is not currently learner-facing:**
the defend-only shells have no composer (`compose:0`), so the flip never fires there, and the full
episodes carry their own correct mirrored copies. But it is exactly the source-of-truth divergence the
house rules warn about — a regenerate of the defend shells, or a maintainer trusting the fragment,
reverts the shipped wording (and, for E7, the retired design). On-screen, **not voiced.**

Divergences (fragment → shipped erb):

- **E2 `flipMissed`** `e2/defend.json:605` still carries the leading sentence "Your application didn't
  land this time, so there's nothing of yours to replay from the other side."; erb `:383` dropped it
  (round-6 P4-7 dedup) and reads "lands in a recruitment inbox" vs the fragment's "arrives in".
- **E2 `flipLandedNoTells`** `e2/defend.json:607` "arrives in a recruitment inbox" vs erb `:385`
  "lands in a recruitment inbox".
- **E4 `flipMissed`** `e4/defend.json:611` keeps the leading sentence; erb `:319` dropped it.
- **E6 `flipMissed`/`flipLandedNoTells`** `e6/defend.json:566,568` "arrives on a Tarrowby work phone" vs
  erb `:325,327` "turns up on a Tarrowby work phone".
- **E7 — the whole flip cluster plus the brief is stale in the fragment.** The shipped full episode now
  frames the red-team task as **writing an email that rides with a cloned-voice call** (erb brief `:308`
  "write the email … the message that would go with a cloned-voice call"; flipIntro `:313` "This is the
  message you wrote, as Tom … would find it"). The fragment still describes the **retired
  voicemail-script** design: `e7/defend.json:157` "write the script for a short voicemail", `:159`
  flipIntro "This is the voicemail you scripted", `:160` flipDefenderLine "in the voice the finance
  office hears every week", `:162` flipMissed / `:164` flipLandedNoTells "the same kind of voicemail
  reaches the finance office's phone, and you're the one **listening**". A maintainer reading the E7
  fragment would rebuild the wrong episode.

**Fix:** bring the fragments into line with the shipped erbs (the erbs are the current, correct
learner-facing text). Concretely —
- E2 `:605`, E4 `:611`: drop the leading "Your [application/email] didn't land this time, so there's
  nothing of yours to replay from the other side." sentence (matching the erb dedup).
- E2 `:605,607`: "arrives" → "lands"; E6 `:566,568`: "arrives on" → "turns up on".
- E7 `:157,159,160,162,164`: replace with the erb's email-design wording (erb `:308,313,314,316,318`),
  so the fragment and erb tell the same story.

(If the project would rather keep the leading sentence, see C3-2 — the cleaner resolution is to delete
it everywhere, not keep it in the fragments.)

### C3-2 — `flipMissed` / `flipLandedNoTells` still echo the `flipMissedHeading` in four episodes
`flipMissedHeading` is "Nothing to replay this time" in all six send episodes. The body then repeats it:
"…so there's nothing of yours to replay from the other side" (flipMissed) and "…so there's nothing to
replay" (flipLandedNoTells). Round 6 (P4-7) deduped only the E2 and E4 **full erbs**; the E1, E5, E6, E7
full erbs and **all** the fragments still echo the heading.

Current (E1 full erb `awareness_e1_invoice_fraud/scenario.json.erb:312`, fragment `e1/defend.json:901`):
> "Your email didn't land this time, so there's nothing of yours to replay from the other side. The
> defence is the same either way: next, the same kind of message turns up in a payments inbox, and
> you're the one reading it."

Proposed (match the E2/E4 dedup — drop the heading-echoing first sentence):
> "The defence is the same either way: next, the same kind of message turns up in a payments inbox, and
> you're the one reading it."

Apply the same cut to E5 (`…_e5_signin_pages:333` / `e5/defend.json:621`), E6 (`…:325` / `e6:566`), E7
(`…:317` / `e7:162`) flipMissed, and to the `flipLandedNoTells` bodies where they repeat "so there's
nothing to replay" directly under the same heading. On-screen, **not voiced**. Low frequency (one flip
branch per playthrough), so minor — but it closes the dedup round 6 started and keeps all six aligned.

### C3-3 — `flipLandedNoTells` opens with the identical sentence in all six send episodes
`e1:903, e2:607, e4:613, e5:623, e6:568, e7:164` (and the mirrored erbs) all open verbatim:
> "It got through, but there was nothing in it to pick apart this time, so there's nothing to replay."

Same anti-pattern C1 MINOR-2 / C2-2 flagged for `noBlameLine` and `defendOnly`, which were since varied.
A learner stacking the general/mobile/voice cluster who lands a clean send in more than one episode reads
the same sentence twice. Each episode's second sentence already varies by role; only this opener repeats.
On-screen, **not voiced.**

**Proposed:** give each a role-tinted opener, e.g.
- E1 (payments): "It landed, and there was nothing in it to catch — so there's nothing to replay."
- E5 (pages): "The page passed without a slip this time, so there's nothing to pull apart."
- E6 (phone): "It landed clean on the phone this time, so there's nothing to replay."
- E7 (voice): "Nothing in it tripped a check this time, so there's nothing to pick over."

### C3-4 — E7 full brief is hard to parse in one read (learner-facing)
`scenarios/awareness_e7_voice_ceo/scenario.json.erb:308` (and the matching fragment once synced):
> "First you're on the red team: write the email in the name of Brightwell's chief executive, Ravinder
> Sandhu, the message that would go with a cloned-voice call to accounts payable, asking for something he
> would never ask for."

Three appositives stacked on one sentence ("in the name of… , the message that would go with… , asking
for…") make the ask ("write the email") hard to find. On-screen (not a spoken bubble, so no word cap),
but it is the first thing the learner reads. **Not voiced.**

**Proposed:**
> "First you're on the red team: write an email in the chief executive Ravinder Sandhu's name — the one
> that would land alongside a cloned-voice call to accounts payable — asking for something he'd never ask
> for."

### C3-5 — Flip reassurance repeats the "built this carefully/well … is not carelessness" shape
`e1/defend.json:899` "Acting on a message built this carefully is not carelessness"; `e2:603` "Being
taken in by a message built this carefully is not carelessness"; `e4:609` "Being fooled by something
built this well is not a sign of carelessness"; `e5:619` "That isn't carelessness: the page was built to
pass for the real sign-in". This is the C1 MINOR-2 family, partly addressed (E3/E6/E7 vary it) but still
near-identical across four episodes, and it leans on the "not X" shape the style guide flags. A learner
doing the finance/recruitment/exec run meets the same reassurance three times. On-screen, **not voiced.**

**Proposed:** vary the closer per role, e.g. E2 "Forty CVs deep, anyone opens the next one." / E4 "When a
message fits the week and sounds like the boss, acting on it is the ordinary thing to do." / E5 keep as
is (it already names the concrete tell). Lowest priority of the five.

---

## TRIVIAL

### C3-T1 — Two E7 perFlagNotes lack a terminal full stop; one is mild negative-parallelism
`e7/defend.json:66` ends "…The borrowed phone is the excuse" and `:113` ends "…is the warning sign, not
the reassurance" — both without a closing full stop, where the surrounding perFlagNotes end with one.
`:113` also uses the "is Y, not X" shape (optional; it draws a useful distinction and reads fine). Add
the full stops; the parallelism can stay. On-screen, not voiced.

---

## Strengths (no change needed)

- **Teaching is correct and consistent across all seven episodes and both variants.** The core lessons —
  "the sender's name is not the proof", "findable facts prove nothing on a call, the callback is the
  check", "read the address bar, a padlock proves nothing", "a voice you know is not proof, ring back on
  a number you hold" — are phrased the same way everywhere and tied to the password-manager and
  callback signals. The subdomain-vs-lookalike idea is now taught correctly in E5 and E6 alike.
- **Warm and non-blaming throughout.** Every `noBlameLine`, `defendOnly` and flip line lands the "built
  to look right, anyone can be caught" message without ever saying "you fell for it", and the new
  `replies.missed` lines model the right habit in the target's own voice rather than scolding.
- **The round 5–6 data work is sound where it is learner-facing.** The `requires` gating, the
  `flagAlternatives` credit, the empty `failMissed`, the new `vish_callback_pressure` flag and the twelve
  reworded post-check host lines are all correct and in-voice. The only residue is the fragment↔erb
  hygiene (C3-1) and the half-finished heading dedup (C3-2).

## Notes for the fixer

- **Where each fix lands:** C3-1/C3-2/C3-3/C3-5 are in the fragments `e{1,2,4,5,6,7}/defend.json` **and**
  the mirrored full erbs (apply to both, per the DIALOG_LOG convention). C3-4 is the E7 full erb brief
  (and the fragment once synced). C3-T1 is `e7/defend.json` only. None is a generated check-shell string,
  so no generator needs re-running for these; but after editing a fragment that a defend-only shell draws
  from, regenerate that shell so the (dead-but-stored) copy stays in sync.
- **Nothing here is voiced.** Fixes are free of TTS cost. The post-check host voiced lines were reviewed
  and need no change.
- Design `11` §3.2 (E3 "4 calls") remains stale vs the shipped 3-call cut, as C2 noted; not re-flagged.
