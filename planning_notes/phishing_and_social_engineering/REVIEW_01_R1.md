# Review — 01 Mail client, round 1

Blockers: 0 · Majors: 1 · Minors: 5

1. **Major — doc §Engine wiring (result schema) vs 04 §Engine wiring.** The doc says the
   `minigame_completed` `result` carries `{ targetId, outcome: 'opened'|'clicked'|'replied',
   pretextScore, redFlags:[…] }`. But the engine it delegates judging to, `phish-rules.js`
   `evaluateMessage(target, message)`, returns `{ landed, factors:[{id, pass, reply, redFlag}],
   hintIndex }` (04 lines 131–136). None of `pretextScore`, the `outcome` enum, or `targetId` is
   produced by 04, and 04 is explicitly pass/fail per factor with *no* aggregate score (its only
   numeric idea is an optional LLM score that is "advice only, never pass/fail", 04 line 50). The
   two paired docs disagree on their data contract, so the field won't exist when the fixer wires
   it. Fix: define 01's `result` as a transform of 04's output — `redFlags` =
   `factors.filter(f => !f.pass).map(f => f.redFlag)`, `targetId` from the chosen target, `outcome`
   from the target's authored landed outcome (04's `outcome.setGlobal`, 04 lines 121/754–756 of
   objectives-manager). Drop `pretextScore` or define where it comes from; there is no deterministic
   score in 04.

2. **Minor — doc §Engine wiring, lines 84–90.** The doc implies a scenario listener keys on
   `minigameName`. The emitted `minigameName` is `this.constructor.name`, i.e. "MailClientMinigame",
   not the registered scene type `'mail-client'` (base-minigame.js:103). Fix: state the event's
   `minigameName` is the class name, and have scenarios react to the bridged global (preferred) or
   match the class name, not `'mail-client'`.

3. **Minor — doc §Engine wiring, line 85.** "On a landed phish it calls `complete(true)`" and
   "`result` carries {…}" skips a step: `complete(success)` takes only `success`; the payload's
   `result` is `this.gameResult` (base-minigame.js:84, 104, 111). Fix: say the minigame sets
   `this.gameResult = {…}` before calling `complete(true)`.

4. **Minor — doc §Engine wiring, line 89.** Flag path is given as `POST /games/:id/flags`; the
   real route is `POST /break_escape/games/:id/flags` (flag-station-minigame.js:642; the comment the
   doc cites is at :18). Fix: correct the path.

5. **Minor — doc §3 "Send → judge → feedback" vs BRIEF section 4.** BRIEF (lines 84–86) wants each
   doc to contain rules/scoring with a worked example and the exact feedback shown. 01 defers all of
   this to 04 and gives no concrete example of what 01 itself renders on landed vs didn't-land.
   Deferring the judging is correct (01 is not the judge), but the doc should discharge section 4 by
   (a) cross-referencing 04's worked example explicitly and (b) showing one concrete render of the
   factor checklist as the composer displays it on a success and on a failure.

6. **Minor — doc §Purpose, lines 9–11, and §1, lines 30–31.** "the sender is trivially spoofable"
   is correct for the From header, but as written risks a student carrying away that a spoofed From
   always reaches the inbox. Modern email authentication (SPF/DKIM/DMARC) frequently blocks or flags
   it; README assigns that layer to 05. Fix: one clause noting delivery isn't guaranteed and
   cross-referencing 05, so the attacker-client lesson and the defender/email-auth lesson line up.

## Verified, not findings
- registerScene pattern (minigame-manager.js:229), the siem-dashboard starter block with
  `params.onComplete(success, result)` and `params.lockable` (minigame-starters.js:659–679),
  `minigame_completed` emission (base-minigame.js:84–108), `set_global` (apply-actions.js:33–40),
  objective `onComplete.setGlobal` (objectives-manager.js:754–756): all accurate.
- Every cited example minigame exists: person-chat, phone-chat, notes, text-file, examine,
  flag-station.
- N2 reload-persistence concern is real: fingerprint W1 (FINGERPRINT_MINIGAME_PLAN.md:19) and the
  `savedNotes` restore path (game.js:1395, games_controller.rb) confirm both the bug class and the
  pattern to copy; the doc correctly books it as new engine work.
- "Model, don't weaponise" is clean: Send is an internal call to the rules engine, no real SMTP or
  recipient, and payloads are abstract labels (lines 38, 99). Does not function as a phishing kit.
- Scenario-authored-data boundary is clean ("The minigame holds no content", concrete JSON).

Verdict: majors remain.
