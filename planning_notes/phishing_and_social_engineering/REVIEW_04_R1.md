# Review — 04 Phish rules engine, round 1

Severity: 0 Blocker · 6 Major · 4 Minor

Engine claims all verified against code:
- `systems/` modules are ES modules that `export function` (e.g. `systems/biometrics.js:20`), so a pure
  `systems/phish-rules.js` exporting `evaluateMessage` fits the convention; `systems/` is the right home.
- `onComplete(success, result)` is called from `minigames/framework/minigame-manager.js:204-206`.
- `complete()` emits `minigame_completed { minigameName, success, result }` via `window.eventDispatcher`
  at `minigames/framework/base-minigame.js:84-107`.
- `set_global` patches `gameState.globalVariables` and fires `global_variable_changed:<key>` at
  `systems/apply-actions.js:33-43`. The doc's citation of `apply-actions.js:33` is correct.
- "No new framework hooks — called inside minigames that already use startMinigame/onComplete" holds:
  a pure module called by the new 01/05 minigames needs no manager changes.

## Findings

1. **Major — doc §"Factors" + Scenario schema + worked example.** The no-attachment-when-expected case
   (the SecGen "no-attachment message still 'running the attachment'" flaw this doc is chartered to kill)
   has no factor state. `attachmentPlausible` only passes/fails on "type fits"; there is exactly one authored
   fail string, `attachmentPlausible_fail: "Why would you send me that file type?"`. If the target expects a
   spreadsheet and the player attaches nothing, the engine shows that string — a nonsensical / inverted
   message about a file that was never sent, reproducing the exact SecGen bug. **Fix:** split attachment into
   distinct results (`missing` / `wrong-type` / `implausible`), each with its own authored reply and red-flag
   string, or add an `attachment_missing` factor result; the empty-string lint (N3) does not catch this
   because the string is non-empty, just wrong.

2. **Major — doc §"Factors" (table) vs sibling 05.** The "attack and defence share the same factors" claim
   is not true. 04 defines six factors; 05 ("05_inbox_triage_defender.md" §Step 2, "all seven") drills seven,
   the seventh being the SPF/DKIM/DMARC authentication read (book Ch. 11, a design pillar: "craft a spoofed
   sender → read a Received/SPF header"). 04 has no sender-authentication factor: it never models whether a
   spoof would pass or fail SPF/DMARC, nor the envelope-vs-display-name distinction, the central phishing-auth
   concept the student strand must teach. **Fix:** add a `senderAuth`/alignment factor to 04's model (how the
   spoof fares against SPF/DKIM/DMARC alignment) so the attacker seat mirrors what 05 asks the defender to
   read; otherwise students carry away a model where "typed the trusted address" is the whole of sender trust.

3. **Major — Scenario schema (doc lines 92-124).** The schema concretely supports only four of the six
   factors (the worked example happens to use exactly those four). `addressedTo` has no authored
   accepted-name list (does "Mel"/"Ms Pierce" pass? the engine would have to guess from `displayName`);
   `urgencyCalibrated` has no authored parameters at all (what counts as "overdone"?); `linkCredible` has no
   expected-domain/link field on the target entry; and there is no way to mark a factor **advisory** vs
   **required** — the schema has `requiredFactors` but the factor table promises advisory factors too.
   An author cannot build a hard target that exercises all six. **Fix:** add `addressedAs: [...]`,
   `urgency: { expectedMax, ... }`, `expectedLink: { domain, textClaims }`, and an `advisoryFactors` list
   (or per-factor `{ id, mode }`).

4. **Major — doc §"Layered feedback" pt 2 + §"Engine wiring" + sibling 05 §Step 2/3.** `redFlagStrings` are
   authored **per target** (`<factor>_fail` keys), but 05 renders a fixed chip list of "the round's factor
   names in plain language" and marks Caught/Missed from these strings across a 10-message inbox. Per-target
   phrasings mean ten different labels for "generic greeting", so 05's chip labels are unstable and the
   "attack and defence can never disagree about a tell" guarantee leaks. **Fix:** define a canonical
   **factor-level** red-flag library (one string per factor) that both 04 and 05 import, with the per-target
   `redFlagStrings` as an optional override for diegetic flavour only; OQ3 makes them mandatory but does not
   establish the shared canonical set.

5. **Major — doc §"Matching that doesn't cheat".** The `pretextRelevant` mechanic scores on concept/keyword
   count while the factor table claims to teach "relevance, not keywords, is what persuades" — the mechanic
   contradicts its own lesson. With `minConcepts: 2` over a six-word synonym set, and sets containing common
   English words ({`role`, `position`, `application`} for a CV; `account` matching "accounting/accountable"),
   `pretextRelevant` over-matches, and the coherence gate (greeting + ask + reason booleans) is too weak to
   stop keyword-dumping ("Hi Melanie, please — balance sheet, profit, thanks" passes). **Fix:** weight or
   mark the distinctive concepts (require at least one high-salience concept, not any N), tighten over-broad
   sets, and make the coherence gate do real work (e.g. require the ask to reference the matched concept),
   not just detect a greeting. Keep OQ2's lenient default but close the gaming hole.

6. **Major — doc §"Matching" coherence gate + N5 / OQ1.** The optional LLM advisory score is scoped only as
   "advisory on plausibility" over guided **free-text** body. An LLM that rates "how convincing is this
   phishing message" and feeds that back to improve it is a phishing-quality optimiser — it edges into the
   brief's blocker line ("a design that would function as real attack tooling"). It is saved here only by
   being optional, default-off and aimed at fictional in-game targets. **Fix:** constrain the advisory call
   to "does this match **this authored scenario target's** `primedFor` facts", never a general quality score,
   and never emit improvement suggestions that would transfer to a real target. State that scope in the doc
   so the fixer builds the narrow version. (Not a Blocker as written because it is gated and advice-only;
   tighten the scope or it becomes one.)

7. **Minor — Scenario schema (`replies` object, lines 106-112).** Only `<factor>_fail` and `landed` strings
   are authored. The checklist's pass-side lines ("✓ Sender looked trusted", "✓ Attachment type fit the
   story", doc lines 61-64) have no schema home, so they would be hardcoded in the engine — content in the
   minigame, which the brief forbids ("Keep content out of the minigame code"). **Fix:** add `<factor>_pass`
   strings (or a `factorStrings: { <factor>: { pass, fail, redFlag } }` block) to the target schema.

8. **Minor — doc §"Factors", `urgencyCalibrated`.** "Overdone pressure backfires" as a *landing* factor is a
   shaky real-world claim — in practice overdone urgency still lands often. Teaching it as pass/fail risks a
   wrong takeaway (students optimise urgency to a sweet spot). **Fix:** keep urgency as a red-flag lesson
   (urgency is a tell the defender reads) rather than a factor whose over-use fails the send; or cite a source
   for the backfire claim.

9. **Minor — doc §"Layered feedback" lines 71-72.** The text says the empty-string lint "kills the SecGen
   'I can only open files' inverted-message bug". The lint only catches *blank* interpolation; inversion is a
   wrong-but-non-empty string. The actual anti-inversion mechanism is the per-factor-keyed reply/redFlag
   mapping — state that as the fix and reserve the lint claim for blank output. (Reinforces finding 1.)

10. **Minor — doc structure vs BRIEF §"What a design doc must contain".** The doc omits the brief's sections
    2 (player goal in one sentence), 3 (numbered loop) and 8 (art/audio assets) with no note. For a
    system-not-a-screen most are legitimately N/A, but the doc should say so explicitly the way 01 does
    ("No character art of its own"). **Fix:** add a one-line "assets: none of its own — the checklist ✓/✗
    chrome is rendered by 01/05" and a note that goal/loop live in the calling minigames.

## Verdict

Majors remain — the engine is well-targeted and its wiring claims all check out, but it must add a
sender-authentication factor, cover the no-attachment case it is chartered to kill, complete the schema for
all six factors, and share a factor-level red-flag library with 05 before it is sound.
