# mission-office-life skill, review round 5 (final delta)

Scope: the diff `69b31b7a3..ecafe3acd` on plan/ol-m03, the R4 findings and Outcomes table, AGENTS.md, `config/initializers/break_escape.rb:11` to `:20`, `tts_service.rb:180` to `:185`, `bin/rails`, `tools/playtest/start-keyless-server.sh`, and a grep of the whole skill for `/tts`, credentials, keyed servers and bark voicing. build/tts-barks is not an ancestor of main (checked). No server was run and Rails credentials were not opened.

Counts: 0 blockers, 0 majors, 1 minor, 3 nits.

## 1. R4 findings

| R4 | State at ecafe3acd | Evidence |
|---|---|---|
| m1 `cd` and unbounded wait | Fixed. `cd <worktree>` is on its own line; the wait is 60 tries at 2 s; the failure line prints a log tail; the grep reads the absolute log. | `measurement-recipes.md:14`, `:18` to `:20` |
| m2 `env -u` not a guarantee | Fixed. States the credentials fallback with correct cites, quotes the warning, says stop the PID, play nothing and report, and forbids a `/tts` probe and reading credentials. | `measurement-recipes.md:24` |
| m3 interim bark route | Fixed for the three places it targeted. Two nearby lines still use the present tense (m1 below). | `gotchas.md:84`; SKILL.md:128, :230 |
| n1 pid path | Fixed. Absolute `-P`, `mkdir` gone, note says a relative path lands in `test/dummy/tmp/pids/` (true: `bin/rails:5` and `:7` put the Rails root in the dummy app). | `measurement-recipes.md:17`, `:25` |
| n2 503 wording | Fixed ("for an uncached line (a cached bark still plays)"). | `gotchas.md:84` |
| n3 Stage 6 spend | Fixed. 15 generations per character, about 6 for a blink, the yes at about 20, and the 2x2 sheet is still made. | SKILL.md:223 |
| n4 stopping-rule citation | Mostly fixed (n1 below). | SKILL.md:168 |

## 2. The server recipe, worked through as shell

Pasted as one call after filling the three placeholders:

- Block one: `ss -ltn | grep ':<port>'` prints nothing on a free port and exits 1. That is expected and harmless; it is a separate fenced block, so a `set -e` paste does not carry it into block two.
- `cd <worktree>` on its own line, so the later lines run there.
- `env -u GEMINI_API_KEY RBENV_VERSION=... BUNDLE_PATH=<main checkout>/vendor/bundle PLAYTEST_PORT=<port> BREAK_ESCAPE_STANDALONE=true nohup bin/rails server -b 127.0.0.1 -p <port> -P <worktree>/tmp/server-<port>.pid > <worktree>/tmp/server-<port>.log 2>&1 &`. The backslash continuation is correct, `env` runs `nohup`, and the redirection applies to the whole backgrounded command. `<worktree>/tmp/` exists (tracked files live there), so the redirect and the absolute pid file open. `>` truncates the log, so the grep only sees this run. The `<main checkout>` placeholder holds a space, so a filled path must not contain one (same as the earlier recipe).
- `up=0; for i in $(seq 60); do curl -s -o /dev/null http://127.0.0.1:<port>/ && up=1 && break; sleep 2; done`: connection refused returns non-zero, so the loop sleeps; any HTTP answer, including a 500, counts as up. Correct. The worst case is 120 s plus curl time, as the note says (n2 below).
- `[ "$up" = 1 ] || { echo ...; tail -n 30 <worktree>/tmp/server-<port>.log; }`: valid brace group with a trailing semicolon.
- `grep -q 'GEMINI_API_KEY environment variable is not set' <worktree>/tmp/server-<port>.log && echo keyless`. The initializer at `break_escape.rb:15` builds `'[BreakEscape] Warning: GEMINI_API_KEY environment variable is not set. '` and `puts` it at `:18`, so stdout carries it into the log, and the fixed substring matches. `tools/playtest/start-keyless-server.sh:31` runs the same grep against the same kind of redirected log, so stdout buffering is not a problem in practice. The quoted text in the note at `:24` matches the source, including the trailing `...`.
- `ss -ltnp | grep ':<port>'` shows the puma PID.

The recipe works as written. The quoting, the absolute paths, the capped wait, the grep path and the warning text all hold.

## 3. Nothing probes /tts, reads credentials, starts a keyed server or voices barks early

Clean. A grep of SKILL.md and `references/*.md` finds `/tts` only in `gotchas.md:84` (describing the client path and a ban on probing, and in `measurement-recipes.md:24` as a ban), credentials only in `measurement-recipes.md:24` ("Never read Rails credentials"), and no instruction anywhere to start a keyed server. The interim route in `gotchas.md:84` has the batch skip barks until build/tts-barks lands, tells agents to count them by hand and hold them and the release, and leaves any earlier route to the user. `checklists.md:46` agrees (committed clip, or on the decisions page awaiting the yes). No spend path is open to an agent.

## Minors

### m1. Two present-tense bark lines lack the interim pointer

- Where: SKILL.md:156 ("voicing spend (the V6 clip count, barks included)") and `references/mapping-patterns.md:156` ("Barks are extracted by the normal tts-audio batch and counted by V6").
- Evidence: R4 m3 fixed SKILL.md:128 and :230 and `checklists.md:46`, but these two lines say the same thing without "once build/tts-barks is on main". Until it lands V6 does not count barks (SKILL.md:47 says so). A builder who writes the approval page from :156 alone states a clip count that leaves barks out, and the user approves a spend that is short.
- Fix: SKILL.md:156: "(the V6 clip count, with barks included once build/tts-barks is on main; before it lands add the hand count from `gotchas.md`, Voicing)". `mapping-patterns.md:156`: add "once build/tts-barks is on main" after "counted by V6".

## Nits

- n1. SKILL.md:168 cites the memory note "Full rounds until zero" for the build-loop rule. R4 n4 asked for the rule's date, and a repo skill points at a private note a subagent may not see. Give the date or restate the rule in one clause ("at least 5 rounds, minors only after round 5") so the file stands alone.
- n2. `measurement-recipes.md:18` to `:19`: `curl` has no `--max-time`, so a half-open listener could stall one iteration; and after a timeout the recipe says nothing about stopping a still-booting process (the grep and `ss` lines run on regardless). Add `--max-time 2` and "if it did not come up and `ss` shows a listener, stop that PID".
- n3. `measurement-recipes.md:24` cites `break_escape.rb:12`; the credentials fallback is on `:13` (`:12` is the `gemini_key =` line, and the `unless` is `:14`). Cite `:12` to `:13`.

## Verdict

Accept. 0 blockers and 0 majors; every R4 finding is fixed, the server recipe pastes and runs as written, and the skill never directs an agent to probe `/tts`, read credentials, start a keyed server or voice barks before build/tts-barks lands. Fix m1 (two short edits) before the skill is used on a mission; the nits are optional. No further review round is needed.

## Outcomes

All fixed in 9f43e1886: m1 (barks qualifier in SKILL.md approval item and mapping-patterns.md), the rule date in SKILL.md, the curl `--max-time 5` and the stop-the-PID failure message in measurement-recipes.md, and the `:12` to `:13` cite. The review loop for the skill ends here.
