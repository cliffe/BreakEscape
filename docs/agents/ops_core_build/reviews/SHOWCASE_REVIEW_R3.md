# Showcase review, round 3

Reviewer: re-review of the round 2 fixes and the leak verdicts. Date: 2026-11-26. Tree: `/data/be-ops-follow`, branch `ops-showcase-review`. Commits reviewed (`git log 59dcb6b6f..HEAD`): 0a865b66d and 30d59ca3e (terminal), c3765d86e and e9963df7a (recon, engine opening line), 772c36ed9 (passwords), d09be42bc and 366272693 (second step), fb4590b4a (leak findings).

Inputs: `SHOWCASE_REVIEW_R2.md`, `SHOWCASE_LEAK_FINDINGS.md`, and the diffs of each commit.

## Verdict

**Not ready to merge: B 0, M 1, m 3.** R2 B1 and M1 are closed in the game. The eventMappings are append-only, the leak verdicts are right, and no server answer, access check or secret changed. One new major: the Terminal's new opening line says every name in the console is invented, but the console uses the real tool names `nmap` and `msfconsole`. The fix is one string and its test.

## Checks run

| Check | Result |
|---|---|
| Rails: the four `demo_ops_*_scenario_test.rb`, every `access_leak_scanner_helpdesk_*` and `access_leak_scanner_ops_*` file (under flock) | 339 runs, 0 failures, 0 errors |
| `ruby tools/check_mapping_index_drift.rb` | 4 scenarios, 0 failures |
| Mapping order compared with `main`, entry by entry | Recon: the "Fixed." entry is now the last of Ama's list. Passwords and terminal: no change in this range. Second step: the reenrol entry keeps its index (condition changed only), and two entries are appended at the end of Ama's list |
| Validator, all four | 0 errors. The recon `fixedIf` warning remains, and PLAYTEST.md now records why it is accepted (R2 m6) |
| JS: `network-terminal-format`, `network-terminal-grammar`, `helpdesk-client` | All pass |
| New clips | 6 clips, one per new or changed spoken line, and each clip's text matches its line. The moved cake line keeps its text, so it keeps its clip |
| Exploit content | None |
| Leak probes I wrote myself (temporary test files, deleted after the run) | See "Leak verdicts" |

## R2 findings

- **B1 closed.** The recon `network_service_checked` bark is now the last entry in Ama's list and is otherwise unchanged. The drift test passes.
- **M1 closed.** Second step: a once-only `read_log_done` bark ("That's the day done. Come back to reception and ask me for the short version.") is appended, with its clip and a test that pins its position.
- **m1 closed.** The recon hub choice now reads "I've scanned the file server."
- **m3 closed.** Both missions now say "from Start". The open-screen bark is clearer: "He should have used Lock or Sign out from Start."
- **m4 closed.** The cake line plays once, in the free-play block (`crack_reused_done and act_midday and not act_evening`).
- **m5 half closed.** The notice board now says "within six minutes of plugging in". Barks held while the view is open still need a live check, as PLAYTEST.md says.
- **m6 closed.** The reason for accepting the warning is in PLAYTEST.md.
- **m2 (recon polish lines) is still open.** It is optional.

Other fixes checked in the game text:
- Terminal: `signin <host>` prints "Opening the sign-in screen for <host>..." only for a sign-in offer. Plain `use` prints the form line, then the usable words or "You hold no techniques."
- Passwords: the capture log pointer is now "A stolen record can be guessed offline, with no lockout." This is accurate and is not exploit detail.
- Second step: the password-reset tick now comes from the desk's granted answer. The client copies `what` from the server's answer, which the shared answer-shape fixture `helpdesk_answer_shapes.json` already carries, so the server is unchanged. Reenrol now needs `what` `mfa`. Before this change, a second password grant could tick it. The Thandiwe ink still ticks the task on Continue as well. That is harmless, because both paths are guarded by `reset_password_done`. The new mapping does not check the account, and neither did the ink path it replaces, so nothing gets looser. The log terminal's examine text now says what flagging does.

## Leak verdicts

Both verdicts are right. Neither scanner change hides a leak of a value the player has not earned.

- **(a) Ink-set `fixedIf` global (game 326).** `printer_fixed` is written by `#set_global:printer_fixed:true` in `graham_whitfield.ink`. The client must hold the name to send that write. Probe: with the real recon scenario, `ink_set_global_names` returns `printer_fixed` (plus the act and told globals), and `printer_fixed` is not a secret name. I renamed the `fixedIf` to a global that no ink writes, and the scanner registered it as a secret name again. The committed tamper tests cover a read-only ink and a missing ink file.
- **(b) Repeat password grant inside another name's stop (game 325).** Probe: Hana's password is earned, then a stop, then a repeat grant for Hana carrying a value the scenario does not know. The scanner still reports `helpdesk_grant`. The honest repeat is clean. The committed tamper tests cover a first grant inside the stop, a repeat of an uncredited grant, another account's value, and an mfa grant.

## Major

### M1. The Terminal's opening line says every name is invented, but the console uses real tool names
- Where: `public/break_escape/js/minigames/network-view/terminal-format.js`, `OPENING_TEXT` (commit e9963df7a). This is an engine change, so every mission's Terminal shows the line at first use.
- Problem: "This console is made up: every product and name in it is invented." The same console offers `nmap` and `msfconsole` by name (`terminal-grammar.js` `HELP_NMAP` and `HELP_MSFCONSOLE`) and shows the `msf >` prompt. These are real tools. The line tells students something untrue, in the place they are learning what is real.
- Fix: say what is actually invented, for example "Type help, or pick a command below. This console is a practice copy: its hosts, products and findings are invented." Update the three assertions in `test/js/network-terminal-format.test.mjs` and the line in `scenarios/demo_ops_recon/PLAYTEST.md`. The line is not spoken, so no clip is needed.

## Minor

- **m1. Second step, repeat coffee reply leaves out Gwen.** "Lorna, Darren and Yusuf should be up for coffee within a couple of minutes." Gwen Pritchard, also in the office, has a caffeine need, and her desk matters for the safe step. She answers `coffee_call` the same way (`needs.set caffeine 10`). Either name her, which needs a new clip, or accept the line as naming the people the tasks need. The clip matches the line as written.
- **m2. The repeat-grant exception weakens one check.** `hd_repeat_password?` skips the stop test for any repeat password grant of an account the run has already earned. That includes a stop on that same name. If the server ever granted a repeat reset during that name's own stop, the scanner would no longer report it. No secret moves, because the value is already held, so this is not a leak. But that lockout check now depends on the server's own helpdesk tests. Accept it and note this in the scanner comment, or keep the stop test whenever a refusal row names the same desk and account.
- **m3. Ink-set names count as public from the start of the run.** `ink_set_global_names` reads every room NPC's compiled ink, whether that ink has been served yet or not. So the name is cleared in a `/scenario` answer sent before that ink is fetched. Only a gate name is involved, never a value, so accept it.

## What a fixer should touch

M1: one string in `terminal-format.js`, its JS test and one PLAYTEST line. The minors are optional. No server, access or secret change is needed.
