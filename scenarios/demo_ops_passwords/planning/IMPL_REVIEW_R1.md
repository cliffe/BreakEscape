# demo_ops_passwords: implementation review R1

Reviewer: Opus, read-only (only this file written). Tree `/data/be-ops-follow`, branch `ops-follow1`, at fc968e4d9.
Read: SHOWCASE_PLAN.md sections 1 to 4, 6, 8.3 to 8.6 and 9; the wave-1/2 build notes and orchestrator notes; `planning/BUILD_REPORT.md`; `PLAYTEST.md`; `scenario.json.erb`; all seven inks; `test/controllers/break_escape/demo_ops_passwords_scenario_test.rb`; AGENTS.md review rules.

**Verdict: not clean.** 0 blockers, 2 majors, 10 minors.

## Checks run

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb scenarios/demo_ops_passwords/scenario.json.erb` | 0 errors, 30 warnings, the same set BUILD_REPORT lists (27 far-room need targets, `partner_pc` owner never leaves, `printer_admin` accepted by no machine, the `grant_foothold` USB note). The regenerated `dungeon_graph.*` is byte-identical to the committed one (no diff). |
| `./scripts/compile-ink.sh demo_ops_passwords` | 7 of 7 compiled, only the usual `-> END` warnings; the JSON files are unchanged. |
| `dialoguelint.mjs scenarios/demo_ops_passwords/` | 0 ERROR; one CHECK, `crowded-hub` on Ama (the contract's choices, as reported). |
| `flock … bin/rails test test/controllers/break_escape/demo_ops_passwords_scenario_test.rb` | 28 runs, 658 assertions, 0 failures. |
| Password grep (all five passwords, and the photo fact) | Only in `scenario.json.erb` (`creds`, the printer note, the `intelFacts` text) and the test's constants. None in ink, PLAYTEST, runbook, VOICED_LINES, graph or mission.json. |
| Scope | The four commits (a73ca1c1a, 040e91968, 9715041d2, b6d8c0475) touch only `scenarios/demo_ops_passwords/` and the one test file. No shipped scenario touched. |
| Realism | No real advisory id, tool name or module path in the scenario, ink, PLAYTEST, runbook, graph or test. |
| UK English | No US spellings found in ink, PLAYTEST or runbook. Plain writing throughout. |

## What works (checked, not just read)

- Every beat P1 to P9 is reachable by clicking, and each has the plan's lever: coffee (counter, `cooldown: 0`, no condition, `scenario.json.erb:519`), weekend (counter, `:520`), lunch (Graham through a `fireOnlyWhenLoaded` mapping plus a `room_entered` relay, `:786-787`; Julian hidden, `:871-872`) and the day end (`:522,553,601`). Graham has no `act_evening` mapping, so he stays for P9.
- Server beats are proved through real routes: the records as three ready rows (test:189); missing, wrong and right picks all answered at once on the unsalted record (test:205); the run started before the note ending `nomatch` (test:256) and the salted wait (test:286, 300); user against admin level (test:331, 368); printer account refused at every PC (test:346); profile read logged once and refused to a user session (test:368, 387); the override accepted only in an unlocked admin session (test:409-452); log rows (test:456).
- Mappings match contract 8.3.1: `admin_signin` is scoped to `data.username === 'gwhitfield'` (`scenario.json.erb:467`); `usb_refused:desk_usb_port` (`:466`) is the event the plant refusal emits (`interactions.js:1118`); `read_log` ticks through the reader's `completionActions` (`:749-752`).
- The leak scan runs over a whole played run, and a "not blind" case proves the scanner catches a planted password (test:617).

## Findings

### Major

**M1. P5 is weakened: the strong record is never tried with its clues earned.** `test/controllers/break_escape/demo_ops_passwords_scenario_test.rb:313-327` cracks `julian_hash` straight after `take_records`, with no fact earned, no fact picked and no other password held. That only shows that a record with no clues fails, which a guessable record does too. The lesson, and the plan's P5 ("This one will not fall to guessing"), is that a strong password does not fall even when everything a guesser could use is held. The orchestrator's wave-2 notes record this as one of the two checks a builder weakened. `play_whole_run` (test:537-538) does earn the facts first, but it picks none, and it is not the beat's own test.
Fix: earn everything first, pick facts, and assert it still never falls:
```ruby
test 'P5: the strong record never falls, even with both facts earned and picked and the note held' do
  travel_to T0 do
    build
    take_records
    take_photo
    serve_feed_post
    take_note
    assert_equal FACTS.sort, earned.sort
    body = crack('julian_hash', FACTS)
    assert_equal 'nomatch', body['status']
    assert_equal 1, body['runs']
    assert_equal 'infeasible', crack('julian_hash', FACTS)['status']
    assert_equal 'infeasible', crack('julian_hash')['status']
    assert_equal 'infeasible', row('julian_hash')['status']
    assert_nil row('julian_sallow.cracked')
    assert_equal 2, state['crackRuns']['julian_hash']
    refute_includes Array(state['crackedAccounts']), 'julian_sallow'
    refute_includes response.body, JULIAN_PASSWORD
  end
end
```
(`ops_cracking.rb:161-163` answers a strong record before the fact branch, so this passes; it is the check that keeps a later change from making a strong record fall to facts.)

**M2. Free play: repeated failed sign-ins are no longer shown to be counted.** `test/...:396-407` asserts that four wrong passwords at `graham_pc` leave one `signin_fail` row, but not that the row counts them. A merge that dropped the count would still pass. The merged row keeps the count in `n` (`app/models/break_escape/ops_log.rb:786`), and the reader prints it as ` xN` (`:511`). PLAYTEST free play (line 108) and the plan's free exploration (6.4: "the failures merge into one row with a count") both rest on it. This is the second check the orchestrator notes record as weakened.
Fix, after the `3.times` loop (four failures in all):
```ruby
assert_equal 1, rows('signin_fail').size, 'the failures merge into one row'
assert_equal 4, rows('signin_fail').first['n'].to_i, 'the merged row counts every failure'
```
(or `>= 2` if `MAX_N` or the merge window might change.) Assert it again in `play_whole_run`, which sends two printer-account failures (test:555-556), if those two land on the same PC.

### Minor

**m1. The log has two night failures, and only one can be flagged.** Seed rows `s2` (Tue 02:10, `administrator`) and `s3` (Tue 02:12, `backup`) are both failed sign-ins on `graham_pc` in the small hours (`scenario.json.erb:221-222`). The objective says "the one entry that does not belong" (`:266`) and Graham says "look at the small hours. One row doesn't belong." (`graham_whitfield.ink:34`). But only `s2` is the anomaly (`:746`), and a wrong pick does nothing (`ops-log-minigame.js:472-476`). A teacher who flags `s3` gets no answer. Seed rows carry no `n` (`ops_log.rb:448-458`), so the burst cannot be one counted row.
Fix: remove `s3`, or make it an ordinary daytime row, so that 02:10 is the only night failure.

**m2. `user_signin` ticks on anyone's sign-in at Delphine's PC.** `scenario.json.erb:465` has no condition, so Graham signing in at `delphine_pc` (allowed in free play, since desks admit IT) ticks "Sign in at Delphine's PC with her password". It is recorded in BUILD_REPORT, but the task then reads as done for the wrong lesson (an admin, not a user).
Fix: add `"condition": "data.username === 'darvanitis'"`, as `admin_signin` does.

**m3. `tell_facts` can be claimed with nothing earned.** `ama_owusu.ink:41` offers "Here's what I learnt about Delphine." whenever `earn_facts_done` is false. The engine already sets `se_intel_delphine_dog_name` and `se_intel_delphine_dog_year` (both declared, `scenario.json.erb:41-42`; the client reads `se_intel_<fact>`, `password-guesser-model.js:22`). The other ink ticks have no such global and stay as the plan allows.
Fix: declare both as ink `VAR ... = false` and gate the choice: `{ not earn_facts_done and se_intel_delphine_dog_name and se_intel_delphine_dog_year }`.

**m4. Delphine's screen habit is missing, and two texts describe it.** Plan 6.2 gives her `habits.screen.lockIfAwayOverSeconds` 10. The scenario has no `habits.screen` (`scenario.json.erb:487`), so her screen locks on every leave (`workstation-state.js:149`: no habit means it locks). The beat works, and better than the plan's threshold would (a 10 s threshold leaves a short trip open). But her line "If I'm away for more than ten seconds, it locks itself." (`delphine_arvanitis.ink:19`) and PLAYTEST:65 "locks itself 10 seconds after she leaves" describe a habit that does not exist, and BUILD_REPORT does not record the change.
Fix: keep the scenario as it is, and reword both: "It locks itself as soon as I get up." / "Delphine's screen locks when she leaves." Add a line to BUILD_REPORT.

**m5. PLAYTEST misstates the lunch turn.** PLAYTEST:79 quotes Ama's bark as "Graham and Jun are both out…", but the scenario says "Graham and Julian" (`scenario.json.erb:464`). It also says "Delphine and Niamh stay at their desks", but both get `hunger: 20` on `act_midday` (`:521`, `:600`), so they go to lunch too. Also, Graham leaves only once the IT room is loaded (`:786-787`), so the bark comes before he goes if the player has not been in there yet.
Fix: correct the quote and the "stay at their desks" line, and add "Graham leaves a few seconds after you enter the IT room, if you had not been there before".

**m6. The desk port's confirm can never run.** `desk_usb_port` has a `triggerOnInteract` confirm that removes the stick, with the line "The stick is in the desk port." (`scenario.json.erb:343-354`). The plant refusal answers first and returns (`interactions.js:1114-1121`), and an admin can never pass it because the port has no session PC (plan 6.4 note, O3). So the confirm is dead text that suggests the stick can go in. PLAYTEST P6b ("answer 'Plug it in' if asked") follows it.
Fix: remove the `triggerOnInteract` block (keep `requiresItem` and `requiresItemHint`), and drop "if asked" from PLAYTEST:95.

**m7. The USB port and the keystroke socket are offered to staff as places to work.** Both are `type: "pc"` with no `affordance` (`scenario.json.erb:333-341`, `:831-837`). The office presets make them `work` targets: the validator lists `desk_usb_port` and `partner_pc_socket` as work targets for Delphine, Jun and Graham (warnings 34, 43, 57, 59). A member of staff could walk off to "work" at a socket.
Fix: add `"affordance": false` to both, as `niamh_laptop` has (`:319`).

**m8. The notice board leaves out the override beat.** "Things to try" (`scenario.json.erb:442`) lists P1 to P7 and P9, but not P8 (the keystroke device). A teacher working from the board would miss it.
Fix: after the partner's-office line, add "- Still signed in there, try the keystroke device in the socket beside the PC." (This follows the wording rule: no control named.)

**m9. Two plan items for the P-T test are only partly covered.** (a) The plan's P-T line asks for "Graham's PC accepting the note's password typed for Graham". test:404 signs in with `GRAHAM`, not the printer account's password from the note. The two are equal, so it passes, but it does not show the reuse done by hand. Use `PRINTER[1]` (better still, read it from the note's `text` in the scenario). (b) "The feed post and its fact (via the lever's need value)" is not asserted. Add a shape check that Delphine's `ask_weekend` and `coffee_call` mappings have `cooldown: 0`, no `condition`, and set `social_media` and `caffeine` below that need's `urgentAt` (`scenario.json.erb:519-520`, against `:492-493`). That is section 4's counter rule.

**m10. The leak scan filter: allowed for now, and due to go.** `without_held_item` (test:587-615) strips only `heldItem` from hash rows in keyring answers. It asserts that the raw run flags no rule but `crack_row`, that `heldItem` holds only the three file ids, and that nothing is flagged once the key is stripped. That is narrow and honest, and it is the filter the orchestrator's notes allow until Track A's scanner fix lands. In this tree the fix is present but not committed: `tools/playtest/lib/access_leak_scanner.rb:3576` now lists `heldItem` in `CRACK_ROW_KEYS` (uncommitted working-tree change). Once that commit lands, the follow-up must delete `without_held_item`, the `- ['crack_row']` allowance and the `held` assertion, then assert `scan_run(captured)` is empty. The "not blind" case (test:622) should scan the raw copy too.

## Notes (not findings)

- The year fact is earned when Delphine's post is served (test:247-252; the server grants it on `/feed_post`), and with `social_media` at 50 against `urgentAt` 40 that happens about 30 s into the game (validator work report). The "Ask Delphine about her weekend" lever mostly brings later posts that carry no fact. This is engine behaviour (A11) and the plan accepts it. PLAYTEST:76 already says so.
- Ama barks on only three beats (the post, lunch, the foothold), against section 4's "first sight of each beat". The budget allows more (onceOnly 1/10), but no beat needs them.
- Plan 6.2's cake request from Ama is not in her ink. It is colour, so not a finding.
