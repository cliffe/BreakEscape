# Showcase leak findings (games 325 and 326)

Two leak-check findings from the showcase review runs. Both are scanner false positives. The game sent nothing the player had not earned. Each scanner fix is narrow and has tamper tests showing that a real leak of the same kind is still caught.

## (a) demo_ops_recon, game 326: `ops_string` (3 findings)

- Where: `responses-326.jsonl` lines 145 and 147 (GET /ink for Graham, `log_offer`, a `VAR?`), and line 164 (GET /scenario, a `savedGlobalVariables` key).
- What it was: the name of the `fixedIf` global `printer_fixed`. Commit 414fd31dd added the printer-fixed beat. Graham's ink sets that global with `#set_global:printer_fixed:true` after the card is used.
- Rule: a global named in `fixedIf` or `needs.global` must never reach the browser, except a name that is room text (a switch that sets it). In that case the name is judged only inside finding rows.
- Verdict: **false positive.** An ink setter works like a switch. The client has to hold the name to send the write, and the ink line next to it ("I've changed the printer's factory login tonight") already says what it does. The scanner's exception only read room text, so it missed setters in ink.
- Fix: `tools/playtest/lib/access_leak_scanner.rb` `collect_ops_globals` now also treats a name as public when a room NPC's compiled ink (its `storyPath` JSON) writes it with a `set_global:<name>:` tag (`ink_set_global_names`). If the ink only reads the global, the name stays secret. The name is still judged inside finding rows. The report notes "set by an NPC ink".
- Test: `test/controllers/break_escape/access_leak_scanner_ops_ink_global_test.rb`. An ink that writes the global is clear in both rows. Tamper cases: an ink that only reads it, or no ink file at all, is still reported in the ink answer and in the saved globals. The name stays a gating global for the finding-row rule.

## (b) demo_ops_second_step, game 325: `helpdesk_grant` and `helpdesk_secret` (response 203, seq 582)

- What it was: a second password grant for `darren_price` from `it_desk`. It carried the same reset password as the credited first grant (line 160).
- Why it fired: the refusals at lines 173 to 178 stopped the desk for another name. The game state shows `helpdeskTries` `it_desk lorna_easton count 3`. The server keeps a stop per desk and typed username, so the grant for Darren was honest. The recorder's refusal rows name no username, so the scanner holds any stop against every name (documented LIMIT 1). The grant was therefore not credited, and the password in it then counted as unearned.
- Verdict: **false positive.** A repeat grant sends only a value the run already holds (it is also in the keyring entry), and the server drops nothing for it.
- Fix: `tools/playtest/lib/helpdesk_leak_rules.rb` `hd_repeat_password?`. When an earlier credited grant in the capture already earned the account's password, a repeat password grant skips the stop test. The desk-covers check, the account check and the value check all still apply.
- Test: `test/controllers/break_escape/access_leak_scanner_helpdesk_repeat_grant_test.rb`. A repeat grant inside the stop is clean. Tamper cases that are still flagged: a first grant inside the stop, a repeat whose first grant was itself inside the stop, a repeat carrying another account's value, and a second-step grant inside the stop.

## Re-run

`access-leak-check.rb` on both captures and on the earlier tour captures:

| Game | Capture | Verdict |
|---|---|---|
| 326 | showcase-review-demo_ops_recon | no leaks found |
| 325 | showcase-review-demo_ops_second_step | no leaks found |
| 304, 305, 306, 307 | tour-*-final | no leaks found |
| 303 | tour-terminal-final | 5 `credential_unheld` (`zainab_token`), already in that capture's own earlier report (`leak-check-303.txt`); not touched by these changes and not looked into here |

Tests: the two new files, plus the existing ops-real and helpdesk scanner tests (callback stop, real, r1, r1b, r2, base). 143 runs, 0 failures.
