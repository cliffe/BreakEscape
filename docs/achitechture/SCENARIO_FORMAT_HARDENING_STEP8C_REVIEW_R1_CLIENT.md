# Step 8c review, round 1, CLIENT / TEMPLATES / CORPUS (2026-11-13)

Reviewer scope: `public/break_escape/js` readers, `test/js`, the five test scenarios and
`lab_physical_pentest` (templates, PLAYTEST/README, `kim.ink`, `mission.json`),
`README_scenario_design.md`, `tools/playtest`, and the corpus-equivalence and reader-parity tests
(Ruby and JS). The server, transform and validator half is covered by the parallel reviewer.

Tested tip 0305bd1ad, worktree branch build/hard-8c. 8c-only change read as
`git diff build/hard-8b 0305bd1ad`. Read-only review.

## Verdict

**Pass.** No blocker and no major. Two minors, both documentation-only, neither affecting runtime
or test behaviour. The client readers, template rewrites, corpus/parity tests and the deployed
no-op test all hold up, and every test I judged at risk is green.

Blockers: 0. Majors: 0. Minors: 2.

## What I checked and what held

- **Client readers all moved; none looks for a retired key.** `grep -rn "screenHabit|printHabit|usbHabit"`
  over the whole of `public/break_escape` returns nothing. The only two client readers moved cleanly:
  `workstation-state.js:124` (`npc?.habits?.screen`) and `npc-needs.js:973` and `:3351`
  (`rec.habits?.print`). Both use optional chaining and keep the old `&& typeof === 'object' ? ... : {}/null`
  fallback, so when the habit is absent the result is identical to the old reader. No silent default
  changes behaviour when the key moves. The client never reads `habits.usb` (it reaches the browser
  only inside `work.usb`), which matches the ship filter.
- **Template rewrites are clean moves.** Each top-level `screenHabit`/`printHabit`/`usbHabit` becomes
  the same object nested under `habits.screen`/`.print`/`.usb`; no values changed. No NPC in any
  template carries two habit keys, so there is no merge-into-one-`habits`-block collision and no
  duplicate `habits` JSON key (verified: `test_access_social` has 6 old habit keys plus 1 pre-existing
  `habits` password block = 7 new `habits` blocks, all distinct objects; the pre-existing password
  habit at line 697 is untouched and still schema-valid under the extended `habits` block).
- **Corpus equivalence and reader parity compare frozen fixtures on the old side and bite.** Ruby
  `test/unit/format_8c_corpus_test.rb` reads `fixture("#{name}.old.json")` (frozen) and asserts
  `strip_notes(new) == strip_notes(transformed(old))`, idempotency on the new render, and reader
  parity through the live `AccessIdentities.screen_always_locks?` against a verbatim copy of the old
  reader. A dropped `habits.screen` in a new fixture fails the equivalence assertion. JS
  `test/js/format-8c-reader-parity.test.mjs` loads the old `habitOf`/`decideLocked` from base
  `ab14d1926` with `git show`, runs them on the frozen `.old.json` and the live readers on the frozen
  `.new.json`, and asserts the effective lock rule matches per workstation and per borrower, plus a
  direct `deepEqual(newHabit, oldHabit)` on each of the five named precedence owners. `test_needs_sims`
  (Amara/Sanjay own PCs with no `lockChance`) exercises the habit read directly, so a drop there is
  caught even outside the named set. Both have an edit-proof guard that reads the live templates and
  reddens if a retired key returns.
- **README teaches format-3 and leaves no `downIf`.** `grep downIf README_scenario_design.md` is
  empty; `grep screenHabit|printHabit|usbHabit` is empty. "Who decides the lock" step 4, "The careful
  guest", the USB-habit section and the schema-phase paragraph all name `habits.screen`/`.print`/`.usb`.
- **Deployed no-op test drives the real transform.** `test/controllers/break_escape/format_8c_deployed_noop_test.rb`
  renders each of m01, sis01, sis02 and lab_social_engineering through the real `Mission::ScenarioBinding`,
  calls `FormatUpgrade::STEP_8C[:scenario]` and the full `FormatUpgrade.upgrade!` (not a stub),
  asserts no habit key or `awareness`/`habits.locksScreen` is present, the transform is a no-op, and
  the full upgrade changes nothing but the `formatVersion` stamp to 3. It reddens if a deployed
  scenario later gains a habit key.
- **Old-tab `X-Break-Escape-Format` path is server-only.** The header is set in
  `application_controller.rb:62` from `FormatUpgrade.current` (line not touched by 8c), and no client
  JS reads it; the 409 old-tab proof is in build-log chunk 6 (games 3318/3334). Nothing in the client
  half to change.
- **tools/playtest.** `access_leak_scanner.rb` now allow-lists only `screen` and `print` in a shipped
  `habits` block and flags any other key (including `usb`) as a `withheld_key` leak, which matches the
  ship filter. `verify-run.rb` reads `habits.screen` and filters `screen`/`print`/`usb` out of the
  values line; its NPC selection (`n['habits'].is_a?(Hash)`) is nil-safe.

## Tests run (node, at-risk files only; no full suites)

All green:
`format-8c-reader-parity`, `validator-retired-keys`, `workstation-state`, `npc-office-visuals`,
`npc-print-forget`, `npc-printer-power`, `validator-usb-habit`, `validator-npc-habits`,
`validator-strict-keys`, `validator-access-work`, `validator-access-model`, `playtest-verify-run-access`
(12 files, 12 passed, 0 failed).

## Findings

### Minor 1 - README drops the exact `affordance.offWhen` path for a station outage

`README_scenario_design.md:1100` (in the 8c diff, the "Outages, failed uses and the kick" paragraph).
The line was rewritten from "a resource's `downIf`, or a station's `affordance.offWhen`" to "a
resource's `offWhen`, or a station's `offWhen`". The resource half is the correct 8a-leftover cleanup,
but the station half lost the exact path. A station's out-of-order field is `affordance.offWhen` (an
object affordance block), as line 990 still spells out ("While the PC's `affordance.offWhen` holds");
the bare "station's `offWhen`" form does appear already at lines 1104 and 1195 (pre-8c, office-life
text), so the edit is internally defensible, but it reduces precision in a sentence 8c touched only
to clear `downIf`.

- Failure scenario: an author reads line 1100, writes a top-level `offWhen` on a station object, and
  the out-of-order never fires (objects are an open block, so the validator only warns). The adjacent
  lines 990/1104/1195 still point them right, so the risk is small.
- Fix: restore "a station's `affordance.offWhen`" at line 1100 (one token), leaving the resource
  cleanup as is. Confidence this is worth changing: low; acceptable to leave if the loose form is the
  house style for this section.

### Minor 2 - em dashes in 8c-authored fixture README

`test/fixtures/format_8c/README.md:10, :11, :26` use em dashes ("`<scenario>.old.json` — the
format-2 render", and two more). This is prose 8c wrote, so it falls under the standing rule of no em
or en dashes in repo text changed here. (The 39 em dashes in `lab_physical_pentest.old.loaded.json`
are frozen render data that mirrors the live scenario's own text and must stay byte-faithful for the
corpus test, so they are not a finding.)

- Failure scenario: none functional; style-rule violation only.
- Fix: replace the three em dashes with a colon or comma, for example
  "`<scenario>.old.json`: the format-2 render".

## Note for the parallel reviewer (out of my half, flagged in passing)

The extended `habits` schema block (`scripts/scenario-schema.json`) now holds `locksScreen`,
`writesDown`, `password`, `passwordPattern`, `holdsDoors`, `screen`, `print`, `usb` and `_comment`
with `additionalProperties: false`. `test_access_social` relies on the pre-existing
`habits.password`/`passwordPattern` co-existing with the new sub-blocks; it still validates, but the
schema half is the parallel reviewer's call.
