# mission-office-life skill, review round 4 (delta)

Scope: the diff `8163636c9..da7159cea` on plan/ol-m03, the R3 findings and Outcomes table, the touched parts of `.claude/skills/mission-office-life/SKILL.md` and `references/*.md`, AGENTS.md:41 and :43, `config/initializers/break_escape.rb`, `TtsService` key lookup, the `/tts` action, `bin/rails`, `start-keyless-server.sh`, `train-check.sh`, the pixellab-character-pipeline skill, and build/tts-barks at 06ad2e81d. Rails credentials were not opened. No server was run.

Runs on `opus55` because the R3 fix adds a design decision (the bark-voicing route), per AGENTS.md:43 case 3.

Counts: 0 blockers, 0 majors, 3 minors, 4 nits.

## R3 findings

| R3 | State at da7159cea | Evidence |
|---|---|---|
| M1 bark voicing | Fixed. The keyed-server step is gone, both voicing yeses count barks, and every place says agents never start a keyed server or play through. The pre-landing route has a gap (m3). | SKILL.md:128, :156, :230; `gotchas.md:84`; `mapping-patterns.md:156` |
| m1 plan delta rule | Fixed. One paragraph above both loops, exceptions copied correctly from AGENTS.md:43. | SKILL.md:170; `checklists.md:21` |
| m2 stopping rules | Fixed. SKILL.md and `checklists.md` now agree, and the section 12 override is stated. Citation nit in n4. | SKILL.md:168, :174, :180; `checklists.md:26` |
| m3 server recipe | Partly fixed. nohup, log, `-P` and the boot-warning grep are in, but the block does not run as written and the keyless reasoning is wrong (m1, m2). | `measurement-recipes.md:11` to `:19` |
| m4 talk inits | Fixed. Matches the pipeline's `bust` stage (`--variants 4`, about 1 generation each, `pick <name> bust bNN`, review page beside the concept). Cost nit in n3. | SKILL.md:223; pipeline SKILL.md:49, :55, :57 |
| m5 bark check before merge | Fixed. | `checklists.md:46` |
| n1 to n4 | Fixed. n2's 503 wording is slightly too broad (n2 below). | SKILL.md:141, :211; `gotchas.md:84`; `checklists.md:21`, :22 |

## The bark route

Safe. Nothing in the new text lets an agent start a keyed server, play through to voice, or spend without the user's yes: SKILL.md:128 and :230 and `gotchas.md:84` all say so outright, and the yes states a clip count with barks in it. build/tts-barks (06ad2e81d) does what the skill now claims: `tts_line_extractor.rb` lists the event barks (eventMappings `bark`, `sendTimedMessage.message`, `timedMessages`) of `npcType: "person"` NPCs with a `voice`, and `tts_office_lines.rb` counts them, with tests. The only gap is the interim route (m3).

## Minors

### m1. The recipe's `cd` runs in the background subshell, so the grep looks in the wrong directory

- Where: `measurement-recipes.md:11` to `:15`.
- Evidence: `cd <worktree> && mkdir ... && env ... nohup bin/rails server ... > tmp/server-<port>.log 2>&1 &`. The trailing `&` backgrounds the whole `&&` list, so the `cd` happens in a subshell and the caller's directory does not change. The log is written under `<worktree>/tmp/`, but the `grep` on line 15 reads `tmp/server-<port>.log` from wherever the agent started (agent Bash calls reset their directory). Run from anywhere but the worktree root, the grep errors and "keyless" never prints. This fails safe, but the recipe does not work as pasted. The `until curl` loop on line 14 also has no limit: a boot failure (GemNotFound, schema) hangs the call until the tool timeout.
- Fix: put `cd <worktree>` on its own line before the start command (or use `<worktree>/tmp/server-<port>.log` in the grep), and bound the wait, e.g. `for i in $(seq 60); do curl -s -o /dev/null http://127.0.0.1:<port>/ && break; sleep 2; done`, then `tail tmp/server-<port>.log` if it never came up.

### m2. `env -u GEMINI_API_KEY` is not a guarantee, and a failed check has no instruction

- Where: `measurement-recipes.md:15`, `:19`; R3 Outcomes row m3 ("with `env -u GEMINI_API_KEY` as the guarantee"); R3 "Claims checked" ("GEMINI_API_KEY comes only from the environment").
- Evidence: the initializer (`config/initializers/break_escape.rb:12` to `:13`) and `TtsService` (`tts_service.rb:181` to `:182`) both fall back to `Rails.application.credentials.dig(Rails.env.to_sym, :gemini_api_key)`. If the dev credentials hold a key, `env -u` changes nothing and the server is keyed. The R3 claim that the key comes only from the environment was wrong. The grep is the right check: the warning prints only when neither source has a key, so finding it does prove the server keyless from both sources. But line 19 says `env -u` "keeps the server keyless", and line 15 only echoes on success; nothing says what to do when the warning is missing.
- Fix: line 19: "`env -u GEMINI_API_KEY` removes the env key, but the app also reads a key from Rails credentials, so only the boot warning proves keylessness." After line 15: "No `keyless` line: stop that PID at once, play nothing, and report it." Do not add a `/tts` probe as the check: on a keyed server an uncached line is generated and billed on the first request (the 503 at `games_controller.rb:822` comes only when no key is configured and there is no cached clip), so the probe spends the money it is meant to guard.

### m3. The interim bark route hands voicing to the integrator with no sanctioned way to do it

- Where: `gotchas.md:84` ("ask the integrator to voice them"); SKILL.md:128 and :230 state the batch behaviour in the present tense with no pointer to the interim rule.
- Evidence: until build/tts-barks is on main, the batch skips barks, so the only ways to make a bark clip are playing on a keyed server or a direct `/tts` POST on one. The integrator is an agent session, and the same sentence says agents never start a keyed server or play through. The instruction asks the integrator to do what the rule forbids, or leaves it to guess. SKILL.md:230 says "the tooling counts and generates them in the normal batch", which is false on main today; a builder reading only SKILL.md would trust V6 and miss the barks.
- Fix: `gotchas.md:84`: "Before build/tts-barks is on main, count barks by hand in the voicing yes and hold them (and the release) until it lands, then voice them with the batch; if the user wants them sooner, it is the user's call how." SKILL.md:128 and :230: add "(from build/tts-barks; before it lands see `gotchas.md`, Voicing)".

## Nits

- n1. `measurement-recipes.md:11`, `:19`: `rails server` changes to the Rails root before writing the pid, so a relative `-P` lands at `test/dummy/tmp/pids/server-<port>.pid` (`bin/rails:7`; the comment at `start-keyless-server.sh:13` says the same). The `mkdir -p tmp/pids` at the worktree root is not the pid directory. Say where the pid file is, or drop the `mkdir`; the `ss -ltnp` PID is still correct.
- n2. `gotchas.md:84`: "On a keyless server the endpoint answers 503" holds only for an uncached line (`games_controller.rb:822`); a cached bark plays. Add "for an uncached line".
- n3. SKILL.md:223: step (2) runs `visemes --from-talk` (15 generations per character, pipeline SKILL.md:87, plus about 6 for an inpaint blink on a new character, :91) with no spend line. The pipeline asks for a yes at about 20 generations (:29), and several characters pass that. Add the per-character count to the approval item. The pipeline also still makes the 2x2 talk sheet as the fallback (:27); "keep the 2x2 talk sheet only as the fallback" can read as "skip it".
- n4. SKILL.md:168 says the skill "follows AGENTS.md 'Iterating'", but AGENTS.md:41 caps rounds at 5, and the build loop runs at least five and can go past 5 (SKILL.md:180). Say the build count follows the user's standing rule on full rounds and departs from AGENTS.md:41, and cite the rule's date.

## Checked and found correct

- Delta wording against AGENTS.md:43: the trigger (round 4, or after a clean stronger-tier round, whichever first), the cheaper tier, and all three exceptions, including the `opus48` case for secret, server and access deltas on a non-CVP account, match in SKILL.md:170 and `checklists.md:21`.
- Plan loop against AGENTS.md:43 "Plan and design reviews stop at round 5 unless a blocker is still open": SKILL.md:174 and `checklists.md:26` match.
- `start-keyless-server.sh` reasons at SKILL.md:211 and `measurement-recipes.md:22`: fixed to :3001, exits 0 when up, `bundle exec` without `BUNDLE_PATH`. Hold.
- The puma PID from `ss -ltnp`, never `pkill -f`: unchanged and correct.
- n2 of R3 (person NPC with a `voice`; beep only for a toast): matches `npc-barks.js:470` and the build/tts-barks extractor comment.

## Verdict

Accept with minors. No blocker or major remains. m1 and m2 are short text fixes to the server recipe; m3 needs one line on the interim bark route. The R5 delta can run on the cheaper tier, unless the m3 fix chooses a new route, which would be a design decision.

## Outcomes

| Finding | Outcome | Where |
|---|---|---|
| m1 recipe `cd` and unbounded wait | Fixed. `cd <worktree>` on its own line, nohup with absolute log and pid paths, 60 tries at 2 s, failure message with the log tail, grep on the absolute log path. | `measurement-recipes.md` section 1 |
| m2 `env -u` not a guarantee | Fixed. Says the key can also come from Rails credentials (initializer :12, `tts_service.rb:181`), quotes the warning text, and says that without it the agent stops the PID, plays nothing and reports. No `/tts` probe, no credentials read, no 503 check. | `measurement-recipes.md` section 1 |
| m3 interim bark route | Fixed. Barks wait for build/tts-barks to land (or the user's call); no agent voices them another way. SKILL.md describes the batch as handling barks "once build/tts-barks is on main" and points to `gotchas.md`, "Voicing". | `gotchas.md` Voicing; SKILL.md :128, :230 |
| n1 pid path | Fixed. Absolute `-P` path; the note says a relative one lands in `test/dummy/tmp/pids/`; the `mkdir` is gone. | `measurement-recipes.md` section 1 |
| n2 503 wording | Fixed. 503 only for an uncached line; a cached bark still plays. | `gotchas.md` Voicing |
| n3 Stage 6 spend | Fixed. States 15 generations per character plus about 6 for a blink, the yes at about 20, and that the talk sheet is still made as the fallback. | SKILL.md Stage 6 |
| n4 stopping-rule citation | Fixed. Plan rounds cite AGENTS.md "Iterating"; the build loop cites the standing full-rounds rule and notes it departs from AGENTS.md:41. | SKILL.md :168 |
