# E9 "Passwords and password managers": design review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. Method and standard: `planning_notes/security_awareness_course/implementation/REVIEWER_BRIEF.md`, the `scenario-design-review` skill adapted to the awareness kind, and the E8 pilot reviews in this folder (`E8_DESIGN_C1.md`, `E8_DESIGN_C2.md`) for format and bar. Source of truth for facts: `modules/core_03_passwords_and_mfa/concepts.md`; topic boundaries: `00_COURSE_OVERVIEW.md`.

Scope read end to end: the full shell `scenarios/awareness_e9_passwords/{scenario.json.erb, ink/nilesh_solanki.ink}`; the defend-only shell `scenarios/awareness_e9_passwords_defend/{scenario.json.erb, ink/nilesh_solanki.ink}`; the fragments `planning_notes/phishing_and_social_engineering/awareness/e9/{attack.json, defend.json, full_only.json, BRAND_ADDITIONS.md}`; the spec `.../episodes/E09_passwords.md`; the module `modules/core_03_passwords_and_mfa/concepts.md`; and the engine the findings depend on (`flip-view.js`, `inbox-triage/triage-kinds.js`, `inbox-triage/triage-scoring.js`, `episode-runner/debrief-view.js`, `inbox-triage-minigame.js`).

How the screens were judged: from the engine code and the authored data, **not** from a live render (the approach the E8 C2 review used for its engine findings). A bridge (`tools/playtest/se/bridge-e9-full.jsonl`) exists; I did not run it. The flip and results findings below are traced through the render and scoring code, where the path is unambiguous; a render would confirm A and B visually.

Ran:
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema passes, **no social errors or warnings** on either (only the generic m01-style "consider adding a VM launcher / locks / music" suggestions, which do not apply to an awareness episode). Note E9 draws none of the "global set but never read" social warnings the E8 full shell carries.
- `node --test social-awareness-fragment-erb-parity.test.mjs`: E9's own parity subtest (`E9: fragment and full erb share the same learner-facing copy`) **passes**. The suite's one failure (`every full awareness episode ... is registered`) is caused only by `awareness_e14_social_media` (the concurrent E14 work in the tree), confirmed by the diff; **not an E9 issue**.
- `node --test social-awareness-rule-of-thumb.test.mjs`: both E9 shells carry the byte-identical rule of thumb; the two failures are the same `awareness_e14_social_media` registry miss ("expected 63 ... found 64"), **not E9**.
- `dialoguelint.mjs` on both shells: full `lines=8 median=15 p90=28 max=28`; defend `lines=3 median=26 p90=30 max=30`. No rule hits. Host lines are under 30 words (defend-only sits right on 30).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 3 | 2 | 1 | 0 |
| Minor | 3 | 1 | 2 | 0 |
| **Total** | **6** | **3** | **3** | **0** |

Episode shape: full = 6 stages (`brief, osint, guess, flip, defend, debrief`); defend-only = 3 (`brief, defend, debrief`). Defend set `e9_lock_it_down`, **8 items**: 1 genuine push (row 1), 2 real phish (unstarted push, fake-IT email), 5 password `choice` cards (rows 4–8). Both shells carry the byte-identical rule of thumb, the four concept cards (ENG-09b array), the Monday card and the no-blame line.

## What works

- **One clear, repeatable lesson.** "A different password for every account, kept in a manager, and deny what you didn't start" lands in the host ink, the concept cards and the Monday card, and the attack half earns it (the reuse step opens Colin's account with no cracking). A clerk can repeat it on Monday. The Monday card gives three concrete home actions (2SV/passkey on personal email first, a breach check, a manager) that match `concepts.md` exactly.
- **Facts match core_03.** Passkey as first choice (NCSC, April 2026), the MFA ladder (passkey > app with number matching > text code, text still better than a password alone), made-up security answers, three random words beating complexity rules, "no genuine IT asks you to type a number / read back a code / approve a prompt", and the HIBP breach check are all faithful to `concepts.md`. The `123456 / password / qwerty` list and the `Tarrowby2026!` pattern are used the way the module uses them (the worst passwords and the worst pattern, named so the learner avoids them).
- **The mirror pair is clean.** Rows 1 and 2 are the same app and account, one started by the learner (Approve), one not (Deny and report), so "a prompt arrived" is not itself the tell. Per-item feedback is calm and specific.
- **No-blame register throughout.** The no-blame line, the "reporting when unsure is never marked down" framing in the brief, and Nilesh's "Nobody's ever in trouble for reporting" are all present and in a colleague's voice.
- **Topic boundaries respected.** The one fake-"IT" message (row 3 plus the flip SMS) stays within the core_03 allowance; no cold caller asking for codes (that would be core_02). The sticky-note/shared-login card (row 8) is core_03's own "written-down passwords at work", not colleague credential-sharing (core_14).
- **Validators, parity and dialoguelint are clean for E9.** The guess, choice and flipAftermath keys all validate under `--strict-social`.

## Findings

### MA1 — the flip screen repeats itself: the heading shows twice and the closing advice is said twice. Major, episode-local (with an engine note).
On the landed-guess path the flip renders (`flip-view.js:172, 203, 293, 311, 316`), in order:
1. `h2` from `strings.flipHeading` = "Now it's your phone." (`scenario.json.erb:445`)
2. `p` from `strings.flipGuessIntro` — **not authored**, so the generic engine default shows: "One reused password was enough. This is what the owner of that account sees next." (`flip-view.js:53, 203`)
3. `h3` from `flipAftermath.heading` = "Now it's your phone" (`scenario.json.erb:419`) — **the same heading again**, one default line later
4. `p` `flipAftermath.intro`, then the items, then `flipAftermath.line` = "They can't get past your phone, so they lean on it. Deny what you didn't start, report it, and let the service desk change the password." (`:441`)
5. `p` `flipDefenderLine` = "...They can't get past your phone, so they are leaning on it... Deny what you didn't start, and report it." (`:447`)

Two problems the learner sees: the heading "Now it's your phone" appears twice (steps 1 and 3), and steps 4 and 5 are near-duplicate "they can't get past your phone / deny what you didn't start / report it" paragraphs back to back. Separately, the carefully written `strings.flipIntro` ("You watched a reused password open a colleague's account. Here is the other end...", `:446`) is **never shown** on this path — the guess flip uses `flipGuessIntro`, so a generic default stands in for authored copy.

Fix (all episode-local, in the full shell and `full_only.json`):
- Drop the duplicate `flipAftermath.heading` (the engine renders the `h3` only when the key is present, `flip-view.js:293`): remove `"heading": "Now it's your phone",` at `scenario.json.erb:419` and `full_only.json:30`. If a subheading is wanted, make it distinct, e.g. `"Your phone, a few minutes later"`.
- Author `flipGuessIntro` so the generic default is replaced; the existing `flipIntro` copy is the natural fit. Add `"flipGuessIntro": "You watched a reused password open a colleague's account. Here is the other end: your own phone."` to `strings` (and you can then drop the unused `flipIntro`).
- Differentiate steps 4 and 5. Keep `flipDefenderLine` as the instruction and trim `flipAftermath.line` to the description only, e.g. `:441` old `"They can't get past your phone, so they lean on it. Deny what you didn't start, report it, and let the service desk change the password."` -> new `"They can't get past your phone, so they are leaning on it: prompt after prompt, then a message dressed up as IT."` (letting `flipDefenderLine` carry "Deny what you didn't start, and report it.").

Engine note (ENG-01, not blocking): the guess flip has no way to show an authored `flipIntro`; it is `flipGuessIntro` or the default. If that is intended, the spec/full_only note should say so, so authors don't write a `flipIntro` that never renders.

### MA2 — the fake-"IT" text in the flip aftermath renders as "Unknown sender" with an empty message bubble. Major, engine + episode-local.
`flipAftermath.items[1]` (`fa_it_text`, `full_only.json:35` / `scenario.json.erb:433–439`) is `kind: "sms"` with an authored `body` ("We can see the failed sign-ins. Read back the number on your screen and we'll stop the prompts.") and no `from`. In the aftermath loop the engine draws a non-email item with `renderKindSurface(it, { ... bodyNode: () => el('div') })` (`flip-view.js:305`). Two consequences:
- the SMS card's sender heading is `senderName(rec) || 'Unknown sender'`, and `senderName` reads `rec.from` (`triage-kinds.js:344, 357`); `fa_it_text` has no `from`, so it shows **"Unknown sender"**;
- the SMS body comes from `h.bodyNode(rec)`, which the flip hard-codes to an empty `<div>` (`triage-kinds.js:370`; `flip-view.js:305`), so the **message bubble is empty** — the authored `body` never appears.

So the beat meant to show "a message dressed up as IT" instead shows an empty phone bubble from "Unknown sender"; only the narrator `note` beneath it conveys the content. This looks broken and undercuts the flip's setup for the scored fake-IT email in the defend half. (An `email` aftermath item is header-only by design, `flip-view.js:106`, but SMS has no header to fall back on — its whole content is the body.)

Fix (pick one):
- Episode-local, simplest for ship: drop `fa_it_text` from `flipAftermath.items` and fold its one line into `flipAftermath.intro`/`line` (the fake-IT email, `e9_fake_it_number`, is the scored teaching; the flip only needs to foreshadow it). `flipAftermath` then shows the push flood item, which renders correctly.
- Engine (ENG-01), if the SMS is to stay: in the aftermath loop render `it.body` for non-email kinds (a real `bodyNode`) and give the SMS a sender fallback other than "Unknown sender", or require a `from` on an SMS aftermath item.

### MA3 — in the defend-only variant, three feedback lines refer to "Colin", "the attack half" and "the guesser", which that learner never saw. Major, episode-local.
The defend-only shell has no osint/guess/flip stage, so the learner never meets Colin and never runs the guesser. But three `choice`-card feedback strings (shared from `e9/defend.json`, so carried into the defend-only shell) still name them:
- `scenarios/awareness_e9_passwords_defend/scenario.json.erb:188` (`e9_passphrase.reportReply`): "...near the top of every guess list, exactly the pattern **the guesser tried on Colin**."
- `:217` (`e9_signup_password.ifTrusted`): "Reusing your usual password is what **the attack half exploited on Colin**: one breach of a small site..."
- `:245` (`e9_security_answer.ifTrusted`): "...the same way **it built Colin's guess list**."

A defend-only learner reads about a colleague and an attack they have no memory of — the "lock the account down" brief introduces neither. (In the full episode these references land, because the learner did watch the guesser run on Colin; the problem is purely the shared string serving both variants.)

Fix (episode-local, in `e9/defend.json`; this is the single source for both shells — change there, then re-wire the full shell and regenerate the defend-only shell):
- `defend.json:113` old "...exactly the pattern the guesser tried on Colin." -> new "...exactly the pattern a guesser tries first."
- `defend.json:135` old "Reusing your usual password is what the attack half exploited on Colin: one breach of a small site, and the work account opened with no cracking at all." -> new "Reusing your usual password is the one habit that turns a breach of any site you used into a break-in everywhere you used the same one."
- `defend.json:156` old "...the same way it built Colin's guess list." -> new "...the same way a guesser builds a list from someone's public posts."

Variant-neutral wording keeps the defend-only variant coherent and loses nothing in the full episode. (If the full-episode reinforcement of Colin is wanted, it needs per-variant strings, which is engine work; variant-neutral is the cheaper fix and reads fine in both.)

### MI1 — a weaker-but-legitimate password pick is scored as "trusting a phish" for the band, which can contradict the "Phish caught" line. Minor, engine.
The `choice` cards use `truth.isPhish: true` purely as a scoring vehicle (safe option -> `report` = full, unsafe -> `trust` = 0). The scoring deliberately keeps `choice` cards out of `phishTotal`, `phishCaught`, `reportRate` and the team tally (`triage-scoring.js:285, 310–313`), which is correct — a password pick is not a phish caught. **But** the band cap on `phishTrusted` does **not** exclude `choice` (`triage-scoring.js:340, 343–348`): any item with `isPhish && verdict === 'trust'` caps the round below the top band. So a learner who catches both real phish but picks, say, the authenticator app over a passkey on the ladder card (row 7) is recorded as having "trusted a phish" for band purposes, and the results screen can show "Phish caught: 2 of 2" (`debrief-view.js:336`) **and** a sub-top headline at the same time. A wrong `choice` is correctly not a critical miss (`CRITICAL_KINDS` is `push, call, email`, `triage-scoring.js:53, 113`), so there is no 15-point penalty; the percent drop from the zero-scored item is legitimate. Only the band/headline is inconsistent, and `passPercent` is 0 so pass/fail is unaffected.
Fix (engine, shared): exclude `choice` from the `phishTrusted` count, mirroring the exclusion at `:313`, e.g. `triage-scoring.js:340` old `perMessage.filter((m) => m.answered && m.isPhish && m.verdict === 'trust')` -> add `&& !choiceIds.has(m.id)`. Needs the engine owner, since it touches shared scoring and affects every episode that uses `choice` cards.

### MI2 — the headline tallies ("Phish caught: 2 of 2", "Phish stopped for the team: 2") undercount an 8-decision round. Minor, engine / by-design.
With only 2 real phish in the set, a learner who handles all 8 items well sees "Phish caught: 2 of 2" (`debrief-view.js:336`) and "Phish stopped for the team: 2" (`inbox-triage-minigame.js:472, 481`), even though they made 5 further decisions. This is the documented design (a password pick is not a phish), the round `percent` does reflect all 8 items, and the debrief reviews any missed `choice` card, so the learner is not told their choices "did not count". Judged: mildly confusing but not misleading, and not worth special engine work on its own. Worth a line in the episode notes so it is not re-raised. If it is ever to be addressed, the cleanest route is a second small tally for decisions (the set already distinguishes `choice`, `inbox-triage-minigame.js:249, 370`), which is an engine change for the whole product, not an E9 fix.

### MI3 — the example passphrase and the common-password list are safe to show, but add the one on-screen caution core_03 asks for. Minor, episode-local.
Judged on "teaches or harms": showing `123456 / password / qwerty / tarrowby` as "the obvious tried first" (`scenario.json.erb:368–373`, concept card `:458`) **teaches and does not harm** — these are the published worst passwords that `concepts.md` itself names (line 174), and nobody adopts "123456" because a trainer listed it. The `Tarrowby2026!` pattern is the bad pattern being argued against, on a fictional company, so it is fine. The one gap: `concepts.md` line 40 is explicit that a training example passphrase must carry "never use an example from training as your real password", and the example `otter-ladder-crimson` (`:196`, and the attack-half demo) is shown without that caution. The passphrase card note already says "no real password is typed or stored"; extend it.
Fix (episode-local): `scenario.json.erb:204` / `defend.json:107`, old `"note": "These are made up for the exercise; no real password is typed or stored."` -> new `"note": "These are made up for the exercise; no real password is typed or stored — and never use a training example as your real password."`

## Notes (not findings)

- **One genuine item, and "refusing everything" still scores full.** The set has a single genuine item (row 1, the started prompt), and it is first, so the brief's "a similar genuine item after a likely miss" pattern is not really present. Under `scoringProfile: "awareness"` a genuine push scores full whether Approved, Denied or Reported, so refusing/reporting everything is not numerically punished. This is the same by-design limitation the E8 C2 review recorded for the whole built set, not an E9-specific defect; the measurement that matters runs through the `general_v2` check pair (spec §14), not this episode set. Flagged only so it is a conscious choice.
- **Timing unverified.** No run was timed. Six stages with an 8-item defend half is plausible for ~15 minutes full / ~8 defend, but a timed playtest is the honest way to confirm the budgets.
- **`mfa_number_relay` is wired correctly.** It is declared scenario-local in `channelTells` with a `flagChips` label and a set-level `skillNames` entry (`scenario.json.erb:92–102`), and `factorStrings.mfa_number_relay.redFlag` sits on the one card that flags it (`:167`). The validator accepts it; it is not appended to the shared library.
- **Host ink is in good shape.** The hub pattern gives a line that fits each moment (welcome, after the guesser lands, after lock-down), stays in a colleague's voice, and is under the word limit.
- **The two failing JS tests are not E9.** Both the parity and rule-of-thumb suites fail only because `awareness_e14_social_media` (concurrent work in the tree) is not registered; E9 is registered and passes its own subtests.

## Verdict

**Not yet ship-ready; close MA1–MA3 first, then one timed playtest.** The episode teaches a single, repeatable lesson, the facts are faithful to core_03, the register is no-blame, and both shells validate clean with parity, rule-of-thumb and dialoguelint green for E9. The three majors are all concrete and cheap: the flip repeats its heading and its closing advice and buries authored copy behind a generic default (MA1, episode-local); the fake-IT text in the flip aftermath renders as an empty "Unknown sender" bubble (MA2, engine + episode-local, with a clean episode-local workaround); and the defend-only variant's feedback names "Colin" and "the attack half" that a defend-only learner never saw (MA3, episode-local wording). The two scoring minors (MI1 band-cap leak, MI2 undercount) are shared-engine and low impact under `passPercent: 0`, and MI3 is a one-clause caution. Recommend fixing MA1–MA3 and MI3 in the episode files, raising MI1 with the engine owner, and running one timed full-episode playtest, after which a C2 confirm pass should clear it.

---

### Return (one line each)

- Counts: 0 blocker, 3 major, 3 minor (6 total; 3 episode-local, 3 engine, 0 needs-user).
- MA1 (episode-local): the flip shows the heading "Now it's your phone" twice and says "they can't get past your phone / deny what you didn't start" twice, while the authored `flipIntro` never renders (a generic default shows instead) — `scenario.json.erb:419/441/445–447`.
- MA2 (engine + episode-local): the fake-"IT" SMS in the flip aftermath renders as an empty bubble from "Unknown sender" because the aftermath passes an empty body node and the item has no `from` — `flip-view.js:305`, `triage-kinds.js:344/357/370`, `scenario.json.erb:433–439`.
- MA3 (episode-local): three defend-card feedback lines name "Colin"/"the attack half"/"the guesser" that the defend-only learner never saw — `awareness_e9_passwords_defend/scenario.json.erb:188/217/245` (source `e9/defend.json:113/135/156`).
- Verdict: not yet ship-ready; fix MA1–MA3 (and MI3), raise MI1 with the engine owner, run one timed playtest, then a C2 confirm.
