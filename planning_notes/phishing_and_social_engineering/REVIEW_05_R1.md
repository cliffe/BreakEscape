# REVIEW — 05 Inbox triage (defender) — Round 1

Read-only review against `BRIEF.md`, `00_data_contract.md` (source of truth), `01_mail_client.md`,
`04_phish_rules_engine.md`, and the engine code. All engine wiring claims were checked against
source and cited below.

**Severity: 1 blocker, 2 major, 4 minor.** Verdict: **blocker remains.**

The security content (SPF/DKIM/DMARC), the scoring maths, the engine wiring and all nine BRIEF
sections are sound. The blocker is a single root cause: **05 was written against 04's first draft
and never reconciled to `00_data_contract.md`**, so it ships its own factor-id namespace and its own
red-flag strings instead of 00 §2's canonical ones. 00 §2 exists precisely to stop this
("so they can't disagree again"). 05 does not reference 00 anywhere.

---

## 1. (BLOCKER) Divergent factor-id set — 05 does not use 00 §2's canonical ids

05's chip table (lines 126–135) and `redFlagLibrary`/`flagChips` (lines 276–289) key everything on a
`*_fail`-suffixed namespace with a seventh id `authentication_fail`:
`senderTrust_fail, addressedTo_fail, pretextRelevant_fail, attachmentPlausible_fail,
urgencyCalibrated_fail, linkCredible_fail, authentication_fail`.

00 §2 (the source of truth, lines 58–66) defines the canonical seven as **unsuffixed** ids with the
seventh being **`senderAuth`**, not `authentication_fail`:
`senderTrust, senderAuth, addressedTo, pretextRelevant, attachmentPlausible, urgencyCalibrated,
linkCredible`. 04's authored data uses these same unsuffixed ids (`04` lines 137–138:
`requiredFactors`/`advisoryFactors` list `senderTrust`, `senderAuth`, …).

So the attacker seat authors `senderAuth` on a target, and the defender seat asks the student to tick
`authentication_fail` — two different identifiers for the same tell. The `truth.flags` arrays 05
writes (e.g. line 321 `["senderTrust_fail","linkCredible_fail","urgencyCalibrated_fail"]`) cannot be
compared to 04's factor ids without a translation layer that 00 was created to make unnecessary. This
directly breaks the contract the BRIEF names as mandatory ("attack and defence can never disagree
about a tell"). 05 even labels the column "Factor id (from `04`)" (line 126) — these ids are not
from 04.

**Fix:** adopt 00 §2's ids verbatim as the single id set. The chips are plain-language *labels*
mapped to those ids (the `flagChips` map is the right place for that), not a parallel id scheme. The
seventh chip's id is **`senderAuth`**. Reference 00 §2 at the top of 05 as 01/04 do, and drop
"(from `04`)".

## 2. (MAJOR) 05 redefines the shared red-flag library with divergent strings

05 claims "The strings are `04`'s `redFlagStrings`, not new text" (lines 124–125) and "`04` and `05`
read one source" (line 273), then supplies its own `redFlagLibrary` (lines 276–284) whose text
diverges from 00 §2's canonical strings:

| id | 05's string | 00 §2 canonical string |
|----|-------------|------------------------|
| urgencyCalibrated | "Pressure to act now, or a threat if you don't" | "Unexpected urgency or pressure to act fast" |
| linkCredible | "The link goes somewhere other than where its text says" | "Link destination doesn't match the real site (look-alike domain)" |
| authentication / senderAuth | "SPF/DKIM/DMARC failed, or passed for a domain that isn't the one it claims" | "Fails sender authentication (SPF/DKIM/DMARC) — the domain didn't really send this" |

(senderTrust also differs trivially: "/ known contact" vs "or a known contact".) 00 §2 is already the
one shared library; 05 duplicating it with different wording recreates exactly the drift 00 was
written to end.

**Fix:** delete 05's `redFlagLibrary` block; reference 00 §2's library as the source. Keep only
what is legitimately 05's: the plain-language `flagChips` labels and the per-message `perFlagNote`
/ `whyFine` diegetic text. (If 05's authentication phrasing is preferred because it captures the
look-alike-that-passes case, raise that as a proposed edit to 00 §2's `senderAuth` string, not a
second definition here.)

## 3. (MAJOR) Stale senderAuth status — 05 contradicts 00 §2 on the seventh factor

05 says `authentication_fail` "has no attacker-side twin in `04` today" and proposes adding it via
engine work N3 ("add `authentication_fail` to `04`'s factor list", line 418) and open question OQ2
("Is `authentication_fail` a shared factor?", lines 476–478, default "defender-only").

00 §2 already resolved all of this: `senderAuth` is the **shared** seventh factor, present on both
seats (00 §2 lines 79–87: "One model, both seats" — advisory on attack, scored on defence), and 04
already carries it (`04` lines 42–46, 138). OQ2's "alt means attack and defence disagree about one
tell" is the outcome 00 chose against. N3 and OQ2 describe work that is done.

**Fix:** delete OQ2 and the N3 "add to 04" item; state that `senderAuth` exists in 00 §2 with
attack-advisory / defence-scored modes, and that 05 reads its defence-side (header-panel) outcome.
Remove the "(**new**, defender-only)" and "no attacker-side twin" lines (134, 137–138).

## 4. (MINOR) Worked-example skill line omits the `addressedTo` factor

The per-factor line at line 259 reads "Links: 1 of 1. Sender address: 2 of 2. Pressure: 0 of 1.
Attachments: 0 of 1." Across the four authored messages the phish flags are msg2
{senderTrust, linkCredible, urgencyCalibrated} and msg3 {senderTrust, addressedTo,
attachmentPlausible}. The player caught msg3's greeting (ticked "generic greeting"), so
`addressedTo` should read **Greeting: 1 of 1** and is missing from the breakdown. The other four
counts are correct.

**Fix:** add the greeting/`addressedTo` line (1 of 1) so the breakdown covers every authored factor.

## 5. (MINOR) "Mailing list" is the wrong vehicle for the SPF-fail / DKIM-pass example

Message 4 (lines 231, 254, 338–343) is "forwarded via a list: SPF fail, DKIM pass, DMARC pass". The
header panel itself correctly states "mailing lists often break DKIM" (line 214) because lists
rewrite the subject/body and often re-sign under the list's own (non-aligned) domain. A list is
therefore the weakest example of DKIM *surviving*. A plain **forward** is the clean canonical case:
the forwarding server breaks SPF (not in the origin domain's record) while the unmodified body keeps
DKIM valid and aligned, so DMARC passes. The doc contradicts itself by picking a list.

**Fix:** change msg4 to a plain forward ("forwarded by a colleague"), keep the "forwards/lists often
break SPF" feedback line. Security concept is otherwise accurate (see note below).

## 6. (MINOR) N6 hedges on global persistence that is already verified

N6 (line 421) says "whether globals survive a reload is unverified; check against the `01` N2
persistence work". It is verified: `set_global` patches `gameState.globalVariables`
(`apply-actions.js:33-43`), which is serialised by `state-sync.js:77` and merged back from the
server on load (`core/game.js:1384-1387`, `savedGlobalVariables` takes precedence). 00 §5 already
records this as "confirmed robust in REVIEW_03".

**Fix:** cite that persistence and drop the "unverified" hedge; the local-global path is sound for
lab and missions, leaving only the server-side *awareness-product* record as genuine open work (OQ1).

## 7. (MINOR) "First attempt only counts" is asserted but has no enforcement mechanism

The reuse table (line 438) and the Result step (line 114) require the pre/post measurement to count
only the first attempt, which is the backbone of the evidence-of-effect claim. Nothing in the rules
or wiring states how a replay is prevented from overwriting `triage_pre_percent`. The `outcome`
writes a `<prefix>done` global (line 304), which is the obvious guard but is never used as one.

**Fix:** specify that the starter's `onComplete` checks `<prefix>done`; if already set it records the
run as practice and does not overwrite `percent`/`reportRate`. State this in §Rules and N6.

---

## Confirmations (no change needed)

- **Security accuracy (RFC 7208 SPF / 6376 DKIM / 7489 DMARC, concept level):** correct as written.
  SPF checks the envelope/return-path domain's published senders and not the visible From (lines
  201–204); DKIM is a signature over selected message parts, pass = valid and unchanged (205–207);
  DMARC requires SPF *or* DKIM to pass **and** align with the visible From, with policy
  none/quarantine/reject (208–210). The three load-bearing lessons are right and a student would
  carry them away correctly: **a pass is not a trust verdict** (an attacker who owns the look-alike
  domain authenticates it legitimately, 211–213), **a fail is a clue not proof** (forwarding breaks
  SPF, 214–215), **none is not safe** (216). The look-alike-that-passes case is taught in msg2
  (229, 244, 327). Only the list-vs-forward nuance (finding 5) needs fixing.
- **model, don't weaponise:** compliant. Header panel is fictional authored literals (184, 366),
  never computed from player input, and the doc explicitly refuses to teach forging, domain setup or
  receiver bypass (217–220). No pathway from this data to a working spoof.
- **Scoring is deterministic and the worked example holds arithmetically.** `scoreTriage` is a pure
  function (119, 372). Verified: msg1 60+40=**100**; msg2 60 + 40×(2−1)/3=13 = **73**;
  msg3 30 + 40×2/3=27 = **57**; msg4 20 + 20 = **40**; mean 270/4 = 67.5 → **68%** "Getting there"
  (60–84 band). Headline numbers all correct: phishCaught 2/2, reportRate 1/2, falseAlarms 1,
  flagRecall 4/6 (= 0.67). The verdict table (phish: Report 60 / Delete 30 / Trust 0; real: Trust 60
  / Report 20 / Delete 0) and the per-item Caught/Missed/false-flag feedback are legible.
- **Pre/post banks** are sound: `pre_a`/`post_b` matched on size, phish count, per-factor counts and
  at least one pass-but-bad + one fail-but-fine, with different people, validator-checked (N5, lines
  354–360); `feedbackMode:"end"` keeps earlier answers from helping later ones (90–92). The only gap
  is enforcement of first-attempt-only (finding 7).
- **Engine wiring — all claims verified against code:**
  - `registerScene('inbox-triage', …)` — `minigame-manager.js:229`. ✓
  - starter modelled on the siem block (framework check, `init` if `mainGameScene` missing,
    `lockable?.scenarioData?.minigameData`, `showCancel`, `onComplete`, `result.aborted` →
    record nothing) — `minigame-starters.js:659-679`. ✓
  - `minigameName` is the class name `this.constructor.name` — `base-minigame.js:102`; emitted in
    `minigame_completed` by `complete(true)` — `base-minigame.js:84-108`. ✓
  - `this.gameResult` set before `complete` — `base-minigame.js:12`, passed to `endMinigame` at 111. ✓
  - bridge via `applyActions([{type:'set_global',…}])` — `apply-actions.js:33-42`. ✓
  - objectives react to globals via `onComplete.setGlobal` — `objectives-manager.js:754-762`. ✓
  - global persistence/restore — `state-sync.js:77`, `core/game.js:1384-1387`. ✓
  - lab flags via `POST /break_escape/games/:id/flags` — `flag-station-minigame.js:642`. ✓
- **All nine BRIEF sections present and concrete:** purpose/audience, player goal, numbered loop
  (Steps 1–4), rules/scoring with worked example and SecGen-failure-avoided, scenario-authored data,
  engine wiring with file:line + new-work table, reuse-across-audiences, assets, open questions.

---

## Verdict

**Blocker remains.** One blocker (finding 1: divergent factor-id namespace, seventh factor must be
`senderAuth` not `authentication_fail`) and two majors (findings 2–3: duplicated/divergent red-flag
strings, and stale senderAuth status) all trace to 05 never being reconciled to
`00_data_contract.md`. Resolving them is mostly deletion plus a reference to 00 §2, not a redesign.
The four minors are quick fixes. The security content, scoring maths and engine wiring are sound.
