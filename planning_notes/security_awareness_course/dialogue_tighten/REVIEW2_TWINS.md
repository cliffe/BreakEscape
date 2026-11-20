# Review 2: dialogue tighten, the defend-only twins (ca*_defend)

Second review of commit `2dd2541cb` ("Awareness twins: tighten spoken dialogue in ca*_defend").
Reviewer did not make the edits. Scope checked: the 11 changed spoken lines in context, the
flagged ca14 thesis change, the 18 rejected scan findings, and the stale ca13 generator literal.

Severity: **B** = lost teaching point, wrong fact, or blame introduced. **M** = reads worse,
unnatural, or a convention/fact slip short of B. **m** = minor / optional / consistency.

Sources cross-checked: `SCAN_HAIKU.md` (p-ca-living-office), the full-episode edits and reviews
`EDITS_CA00_CA10.md`, `EDITS_CA11_CA20.md` (b-ca-dialogue), and the twin ink as committed.

## Verdict summary

- 11 changed lines: **all pass.** 0 B, 0 M, 0 m. Every teaching point survives, no fact changed,
  no blame introduced, UK English throughout, no banned word, no new "not X, it's Y", all
  TTS-voiceable, and each line that mirrors a tightened full-episode line matches it.
- 18 rejected findings: **17 upheld, 1 (B44) flagged m** (consistency gap, rejection still defensible).
- ca14 julian:22 thesis change: **KEEP** (reason below).
- ca13 stale generator literal: **optional hygiene only (m)** — do not partial-sync silently; see below.

Totals of findings raised by this review: **B 0, M 0, m 2** (B44 consistency; ca13 literal hygiene).

## The 11 changed lines, in context

All eight single-line twin edits and the three ca13 edits were checked against the hub logic
(the line fires in the `..._defend_complete` closing branch, mutually exclusive with the welcome
branch in one visit; ca13 L65/66 fire in the optional demo reveal).

| # | Shell / line | Judgement |
|---|---|---|
| 1 | ca02 fatima:22 | Pass. Split into two plain sentences; mirrors full ca02 (B03) "A real CV just opens in the viewer. Anything that wants more…". Teaching point (a genuine CV only opens; a demand for more is the tell) kept. Natural. |
| 2 | ca04 thandiwe:22 | Pass. "Money, in a hurry:" fronting matches the full ca04 (B11) fronting. Clipped but the identical construction is used in the full episode, so it is in-voice, not too terse. "or kept from finance" was already absent from the twin's old line, so nothing newly lost. Callback + "ask Yasmin" kept. |
| 3 | ca07 agnieszka:22 | Pass. Imperative "ring back … and that settles it" matches full ca07 (B19) word for word. Reads as speech, not a maxim. Callback-settles-identity point kept. |
| 4 | ca08 anjali:22 | Pass. "Whatever the sign, the move is the same:" matches the full ca08 (B23) opener. Report-every-real-sign point kept. |
| 5 | ca09 nilesh:22 | Pass. Dropped the "that's the whole of it" filler tail; "what"→"anything" aligns with full ca09. All three takeaways (unique password, in a manager, deny what you didn't start) kept. The remaining three-item comma list is a closing line, not stacked padding. |
| 6 | ca10 niamh:22 | Pass. Dropped the "The rule holds every time:" filler opener; the thesis (no honest web page needs you to paste/run/install/call) is untouched. |
| 7 | ca13 gwen:26 | Pass. Cut the salesy "that always works" tag; "a voice or a face can be faked / check another way on a number you already hold" is intact. |
| 8 | ca13 gwen:65 | Pass. "And that was on our own meeting tool. None of it proved who was asking." matches full ca13 L91 (B48). Drops the third face/voice restatement; the "even our own tool doesn't prove identity" point is kept. |
| 9 | ca13 gwen:66 | Pass. "…end it. Ring back … or ask someone, then report it." matches full ca13 L92 (B52). All four actions survive (end, call back, ask, report); only the redundant "pause. End it" is merged. Applied under the match-the-tightened-full-line rule even though the scan did not separately flag the twin instance — correct consistency move. |
| 10 | ca14 julian:22 | Pass. See verdict below. |
| 11 | ca15 nilesh:22 | Pass. Cut "we can't mend what we don't know about", which restated "tell us and we'll fix it" in the same sentence (B63 wordy). Confirmed the removed clause is **not** in this twin's welcome line (welcome: "…Ask us first, we'd rather help than clean up."), so it was the only instance, but its message (report it so we can help) is carried by both the kept clause and the welcome. No teaching loss. |

Nothing in the 11 needs reverting.

## ca14 julian:22 — flagged thesis change: KEEP

- Old: "The tell is always what they ask for, not how friendly they are."
- New: "The tell is always what they ask for, no matter how friendly they seem."

**Keep the new wording.** The lesson — judge a contact by the request, discount the friendliness —
is preserved intact, and no fact is dropped. The change does three things the house conventions want:

1. It removes a "not X" negative parallelism, exactly the construction the full ca14 pass removed
   ("The fix is a setting and a pause, not shame." → "…a setting and a pause.", B57). Leaving the
   twin's "not how friendly they are" while cutting the full episode's parallelism would be inconsistent.
2. "seem" (vs "are") subtly frames the friendliness as a performance, which is the right note for a
   social-engineering episode: attackers *put on* friendliness as a tactic, so "no matter how friendly
   they seem" reads as a warning rather than a neutral statement that friendliness is irrelevant. If
   anything the teaching point is a shade sharper, not weaker.
3. It stays natural for Julian and is cleanly voiceable.

The only nuance shift — old = friendliness is a non-signal; new = don't be swayed by apparent
friendliness — lands the same behaviour. No reason to revert. (The log also notes a first "however"
draft was rejected by dialoguelint as a fake transition; "no matter how" is the correct fix.)

## The 18 rejected findings

Upheld unless noted. The recurring grounds — complete/welcome states are mutually exclusive in one
visit; safe-exercise reassurances are deliberate; strong existing thesis lines are kept and only *new*
negative parallelism is banned — are the established full-episode conventions (REVIEW2/EDITS), applied
correctly here.

Correctly rejected (17):
- **B18** (ca06 complete) — one clean sentence, the episode point, no filler opener. Not wordy.
- **B30** (ca09 welcome "Nothing you type here is real") — safe-exercise reassurance; matches the full-episode B28 keep.
- **B31** (ca09), **B45** (ca12), **B77** (ca18), **B80** (ca19), **B85** (ca20) — complete-vs-welcome "repeats" are mutually exclusive in one play; not one-play repetition. Convention applied correctly.
- **B37** (ca11 DPO list) — "a request, a breach or a complaint" is three short concrete examples of a data matter; informative and voiceable, not padding.
- **B55** (ca13 "nothing is scored"), **B61** (ca14 "authorised exercise"), **B86** (ca20 "Nothing's real") — safe-exercise framing convention; consistent with full B49/B59/B83.
- **B56** (ca13 "You don't need to spot a deepfake. You need to check another way.") — episode thesis, two plain imperatives (not a "not X, it's Y" clause); matches full B51 keep.
- **B64** (ca15 welcome kiosk setup) — task-setup line within the 30-word cap. Slightly telegraphic ("Found sticks, 'quicker way' messages…") but it is scene-setting, not a teaching maxim, and rewording risks the cap. Defensible.
- **B69** (ca16 complete "…as facts, never a verdict on anyone") — "never a verdict on anyone" is the load-bearing no-blame point for insider risk (a concern is not an accusation). Cutting it would lose teaching; the stacked clauses each carry a distinct point. Keep.
- **B70** (ca17 "Ask first … when you're not sure, ask first") — the first "Ask first" is the acceptable-use category label, the second is the behavioural rule; the echo is the intended mnemonic (ca17 is defend-only, no full episode to match). Defensible.
- **B71** (ca17) — complete-vs-welcome, mutually exclusive. **B72** (ca17 "Every rule here has a 'because'") — warm framing, within cap, not wordy.

Flagged (1):
- **B44 (ca12 lorna complete) — m, consistency.** Line: "That's the desk cleared, thanks. The move
  that works for every pushy visitor is the same: check the list, escort them, and report anyone who
  won't be checked." The rejection's stated reason ("matches the full-episode lorna treatment") is not
  quite right: the full ca12 lorna lines are worded differently and were never tightened on this opener,
  so there is no full line to match. More to the point, this opener is the **same template** the editor
  *did* tighten in ca08 ("The one move that works for every real sign is the same:" → "Whatever the sign,
  the move is the same:"). Treating the identical construction two different ways inside the same twin
  pass is the inconsistency. It is a minor wordiness, not a lost teaching point, so **m, not B/M**, and
  the rejection is defensible (no match obligation, and it avoids a further TTS re-voice). If the owner
  wants the pass internally consistent, suggested replacement:
  > That's the desk cleared, thanks. Whatever the visitor, the move is the same: check the list, escort them, and report anyone who won't be checked.

No rejection is clearly *wrong* (no dropped teaching point hides behind one). B44 is the single
consistency flag.

## ca13 stale generator literal — optional hygiene (m), do not silent-partial-sync

The `('e13','defend')` literal in `gen_e8_e17_shells.py` still holds the pre-edit complete line.
The log notes the generator skips ca13 (its ink is hand-kept with extra demo knots the literal cannot
reproduce) and the ink is authoritative. That is correct, and the drift is not a correctness problem:
the literal generates nothing.

Recommendation: **do not** quietly sync just the one complete line. The literal already cannot
regenerate ca13 faithfully (it lacks the demo/reveal knots), so bringing one line into agreement would
make a dead, incomplete literal *look* current and maintained, and could mislead a future maintainer
into pointing the generator back at ca13. Better hygiene is a one-line comment at that literal —
"stale / unused; ca13 ink is hand-kept and authoritative" — than a partial content sync. Either way it
is optional (**m**) and outside this pass's spoken-line scope. Flagged for the owner, not blocking.

## Checks relied on

Verdicts above are from reading the committed ink in context against the scan and the full-episode
edit logs. The editor's own gate (pin test 3/3, regen diff touching only the 8 generated twin ink
files, ink compile 0 failures, validator 0/0, social JS suites green) is recorded in `EDITS_TWINS.md`
and was not re-run here; this review is editorial, not a build re-verification.
