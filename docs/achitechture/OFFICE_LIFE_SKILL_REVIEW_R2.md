# mission-office-life skill, review round 2

Scope: `.claude/skills/mission-office-life/SKILL.md` and `references/*.md` at 166a146c1 (plan/ol-m03), the diff since R1 (`45a7c0273..166a146c1`), the m03 docs and engine on build/ol-m03 (b4b7c5119), AGENTS.md, and the playtest-scenario skill.

Not checked (the round stopped at the context limit):

- whether the client voices eventMapping `bark` lines at all (m3 below rests on the TTS extractor comments, not on the client);
- Stage 6 against the user's "four talk inits first" rule (left to the pixellab-character-pipeline skill);
- a full sweep of AGENTS.md "Asking the user for input" against the approvals page wording.

Counts: 0 blockers, 2 majors, 4 minors, 4 nits.

## R1 findings: all fixed

Each R1 outcome was checked in the text at 166a146c1: M1 (SKILL.md:10, the train 131 landing line and build/ol-m03 cites), M2 (SKILL.md:71, Stage 6 at :219; the three awareness files exist on HEAD, build/ol-m03 and main), M3 (`mapping-patterns.md:44`, `:158`; `checklists.md:173`; `gotchas.md:191`), m1 (SKILL.md:138), m2 (`gotchas.md:110` to `:116`, `measurement-recipes.md:42`), m3 (cites now on build/ol-m03 lines, spot-checked below), m4 (SKILL.md:195 matches `validate_office_life.rb:6` to `:14`), m5 (SKILL.md:226, :229; `checklists.md:203`, `:204`; `gotchas.md:181`), m6 (SKILL.md:113 matches `npc-needs.js:271` to `:293`, `:2996` to `:3004`), n1 to n4. The one stale item is the Outcomes table itself (n2).

## Cites spot-checked against build/ol-m03 (all hold)

`npc-needs.js` :271, :290 to :293, :2996 to :3004, :310 to :314 (and the `needsCompany` use at :5589), :3326, :3358, :3427, :3445, :1023, :1238, :2202, :4619, :4661, :3557, :2954, :3062, :3377; `workstation-state.js:155` to `:157`; `npc-manager.js:1264`; `npc-poses.js:52`, `:56`; `rooms.js:186` to `:193`, `:229`, `:261` (findMatchFor), `:3232`; `player-combat.js:461`; `validate_office_life.rb:13`, `:41`, `:489`, `:743`; `NPC_NEEDS_SYSTEM.md:474`; `SIMS_TIDY_LOG.md:600` to `:612`; m03 `scenario.json.erb:838` to `:840`. One loose cite: n3.

## Majors

### M1. Live proof gives no way to start a keyless server on its own port from a worktree

- Where: SKILL.md:204 to :205, :47; `measurement-recipes.md:7`; `checklists.md:189`.
- Evidence: the skill says "a keyless server from the branch worktree on its own free port" but names no command. The playtest-scenario skill's route is `tools/playtest/start-keyless-server.sh` (SKILL.md:206, :213 there), which is fixed to :3001 and exits 0 with "Already listening" when :3001 is up (`start-keyless-server.sh:10`, `:17` to `:21`); :3001 serves the main checkout, so a builder who follows it runs the live proof on main's code and logs a pass or fail for the wrong build. A hand-written `bin/rails server` misses two things the script does: `env -u GEMINI_API_KEY` (without it every line played is generated and billed) and a `-P` pid file. A worktree also has no `.bundle/config` (none in this worktree), so `bin/rails server`, `bin/rails runner tools/playtest/new-game.rb` and the V6 rake at SKILL.md:47 fail with GemNotFound unless `BUNDLE_PATH` points at the main checkout's `vendor/bundle` (`train-check.sh:42` to `:45` does this). new-game.rb renders the scenario into the game row at save (`new-game.rb:7` to `:9`), so it must run from the worktree too, or the game holds main's scenario.
- Risk: a wasted live round on the wrong code, or TTS spend from a keyed server.
- Fix: in Stage 5 and `measurement-recipes.md` section 1, give the command: from the worktree, `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true BUNDLE_PATH=<main checkout>/vendor/bundle bundle exec rails server -b 127.0.0.1 -p <port> -P tmp/pids/server-<port>.pid`, a free port that is not 3000, 3001, 3002, 3085 or 3086, and stop the PID in that file. Run new-game.rb and the V6 rake from the worktree with the same `BUNDLE_PATH`. Say that `start-keyless-server.sh` is only for main-checkout runs on :3001.

### M2. Plan reviews are told to run past round 5

- Where: SKILL.md:3 ("reviews for 5+ rounds"), :165 ("review R1..R5+" for the plan), :168, :170, :172; `checklists.md:184`.
- Evidence: AGENTS.md:43 says "Plan and design reviews stop at round 5 unless a blocker is still open", and AGENTS.md:41 lists whatever is left as open after round 5. The skill applies one rule to both loops: at least five rounds, then carry on until a round has 0 blockers and 0 majors, with a major after round 5 sending the next round to the stronger tier. For the build loop that matches m03 (R1 to R9). For the plan it adds rounds AGENTS.md says not to run.
- Risk: plan rounds 6 and later on Opus that AGENTS.md rules out.
- Fix: split the two loops. Plan: at least five rounds, stop at round 5, and list any open major as open in the plan (a blocker still open allows round 6). Build: as now.

## Minors

### m1. Physical-pentest openings are routed to the VM agent type

- Where: SKILL.md:141.
- Evidence: AGENTS.md:111 sends game builds, including office life, to `opus55`, Opus 5.5 or Sonnet "even when the mission is about hacking". Under CVP (AGENTS.md:112, this account since 16 November) `opus48` takes only CTF and VM solve scripts and social-engineering content. "The agent type AGENTS.md names for VM and technical material" points every opening, a breaker lever or an unlocked screen included, at `opus48`, the spend AGENTS.md:111 calls out.
- Fix: "Social-engineering text in an opening (pretexting, phishing) follows AGENTS.md 'Which work goes to `opus48`'; the rest of each opening is an office-life build and stays on `opus55` or Sonnet."

### m2. Delta-review timing and its exceptions

- Where: SKILL.md:171, :174; `checklists.md:179`.
- Evidence: SKILL.md:174 says "later delta rounds run on the cheaper tier" after round 1, which reads as round 2 on. AGENTS.md:43 makes rounds deltas once an Opus round is clean or from round 4, and sends three kinds of delta back to Opus whatever the round: secret handling, what the server serves or access checks, and a new design decision. Office-life deltas often touch what a workstation's text shows when the owner is away (`mapping-patterns.md` section 2), which is in the first kind.
- Fix: in SKILL.md:174 say "from round 4, or after a clean stronger-tier round", and copy the three exceptions, naming the workstation text gate and openings as the usual office-life case.

### m3. Barks fall outside the "no unvoiced lines" check

- Where: SKILL.md:128, :226; `gotchas.md:167`; `mapping-patterns.md:155` to `:156`; `checklists.md:204`.
- Evidence: V6 leaves out eventMapping barks (`tts_office_lines.rb:9` to `:10`), and the extractor does not voice them in the batch (`tts_line_extractor.rb:13`). Stage 7 says V6 must show 0 uncached clips and "no release carries unvoiced office-life lines", so a mission with a new bark (m03 added Yusuf's) passes the check while the bark has no clip. "Voiced by hand" names no tool or step.
- Fix: say that V6 does not cover barks; list every new bark in `SPOKEN_LINES.md` with how it is voiced (or that it is text only, if the client does not voice barks), and add a by-hand check of each bark to Stage 7 and Before merge.

### m4. A hidden plain sitter does not sit again when shown

- Where: `gotchas.md:136` ("show the NPC again and confirm it re-sits within about a second", for every mission with seated staff who vanish); `measurement-recipes.md:69`.
- Evidence: `SOFA_FIX.md:52`: "A plain seated NPC is marked `_seatTried`, so it reappears standing and stays standing." Only a needs sitter re-sits (`SOFA_FIX.md:68`, `:74`).
- Risk: a builder logs a false bug for a seated story NPC who is hidden and shown again.
- Fix: "A needs NPC re-sits within about a second; a plain seated NPC comes back standing, which is intended."

## Nits

- n1. SKILL.md:213: the Gotchas section sits between Stage 5 and Stage 6. Move it after Stage 7 and 8. SKILL.md:39 lists `STAGE4_LIVE*.md` and `STAGE5_LIVE*.md` (m02's stage names), which now clash with Stage 4 being implementation; name them `LIVE_*.md` or say they follow m02's numbering.
- n2. `OFFICE_LIFE_SKILL_REVIEW_R1.md:95`: the m2 row says the IDEAS_BACKLOG line was added on this branch; 166a146c1 removed it as a duplicate of build/ol-m03 `docs/IDEAS_BACKLOG.md:284`. Update the row.
- n3. `mapping-patterns.md:153`: `npc-needs.js:3011` is `_startExchange` setting `startedAt`; the heard write is `:3062` and the read `:2954`. Drop `:3011` or cite `_startExchange` by name.
- n4. `measurement-recipes.md:13`, `gotchas.md:196`, `checklists.md:198`: "remove the link" for the `node_modules` symlink. Removing a symlink is not deleting a file, but the standing rule is to move deletions into `tmp/delete/`; say `unlink node_modules` so no one reaches for `rm -r`.

## Round 2 scope R1 left open

- `SOFA_FIX.md`, `R2_FIX_HANDOVER.md`, `R3_FIX_HANDOVER.md` line by line: consistent with the skill (breathing image cause and DUMP1 to DUMP3, chair release on hide, needs re-sit gate, suites one after the other, the 20 px seated offset, flags XML left alone, node_modules symlink, merge main with no rebase and stop on conflict, PID stops), apart from m4.
- Port and PID wording against playtest-scenario: see M1.
- Form against sibling skills: same front matter and checklist style as mission-room-lighting, mission-room-dressing and mission-puzzle-chains; longer (230 lines against 104 to 151) but the detail is in `references/`, which suits it. n1 is the only layout point.
- AGENTS.md contradictions: rounds (M2), routing (m1, m2), spoken lines as data (rule 5 holds; m3 is about voicing), art and PixelLab approvals (rule 7 and Stage 6 hold), ports and PIDs (M1), game rows (SKILL.md:205 to :206 match AGENTS.md:236 and the no-game-record-edits rule), delete by moving to tmp (n4).

## Verdict

Revise. Both majors are text changes: give the worktree server command, and stop plan reviews at round 5. Round 3 should go back to the stronger tier per AGENTS.md:43, since this round found majors, and should cover the unchecked items listed at the top.

## Outcomes

Fixes are in `.claude/skills/mission-office-life/`. The three scope items R2 left unchecked were checked in the fix pass (last three rows).

| Finding | Outcome | Where |
|---|---|---|
| M1 no worktree server recipe | Fixed. Copyable keyless command with `env -u GEMINI_API_KEY`, `RBENV_VERSION`, `BUNDLE_PATH`, `PLAYTEST_PORT`; same env for new-game.rb and the V6 rake; free port checked with `ss -ltn`, never 3000, 3001, 3085 or 3086; PID from `ss -ltnp`; `start-keyless-server.sh` ruled out for worktrees. | `measurement-recipes.md` section 1; SKILL.md Stage 0 (V6) and Stage 5; `checklists.md` Per live check |
| M2 plan reviews past round 5 | Fixed. Stage 3 split into a plan loop (stop at round 5, leftovers listed open, a blocker allows round 6) and a build loop (this skill's own longer rule, with the reason logged). Description, flow line and checklists agree. | SKILL.md description, Stage 3; `checklists.md` Per review round |
| m1 openings routed to the VM agent type | Fixed. Quotes AGENTS.md: under the Cyber Verification Program `opus55` or the cheaper tier take office-life builds and openings; `opus48` takes only social-engineering text and CTF or VM solve scripts; a safeguard stop is retried once on `opus48`. | SKILL.md Stage 2 (security windows) and Stage 4 |
| m2 delta timing and exceptions | Fixed. Deltas start from round 4 or after a clean stronger-tier round; the three AGENTS.md exceptions copied, with the workstation away-owner text gate and new levers or openings named as the usual cases. | SKILL.md Stage 3; `checklists.md` |
| m3 barks outside V6 | Fixed after checking the client. `npc-barks.js` `_speakBark` calls `TTSManager.play`, so barks are voiced through `/tts`, and the endpoint accepts bark texts; the batch (`tts_line_extractor.rb:13`) and V6 (`tts_office_lines.rb:9` to `:10`) skip them. The tts-audio skill has no bark step; the skill now gives the generic route (play once on a keyed server after the user's yes, commit the clip) and adds a by-hand check to Stage 7. | SKILL.md Stage 0, Stage 2, Stage 7; `gotchas.md` Voicing; `mapping-patterns.md` section 6 |
| m4 plain sitter re-sit | Fixed. A needs NPC re-sits through its routine; a plain seated NPC comes back standing, which is intended (`SOFA_FIX.md:52` on build/ol-m03). | `gotchas.md` Hiding a seated NPC; `measurement-recipes.md` section 6 |
| n1 Gotchas placement, stage file names | Fixed. Gotchas section moved to the end; `STAGE4_LIVE*.md` and `STAGE5_LIVE*.md` replaced by `LIVE_*.md` with a note on m02's names. | SKILL.md |
| n2 stale R1 Outcomes row | Fixed. The m2 row now says the line is on build/ol-m03 (`docs/IDEAS_BACKLOG.md:284`) and the copy here was removed in 166a146c1. | `OFFICE_LIFE_SKILL_REVIEW_R1.md` Outcomes |
| n3 loose `heard` cite | Fixed. `:3011` dropped; `_exchangeHeard` read `:2954`, write `:3062`. | `mapping-patterns.md` section 6 |
| n4 `node_modules` removal | Fixed. `unlink node_modules`, never `rm -r`. | `measurement-recipes.md` section 1; `gotchas.md`; `checklists.md` |
| Unchecked: bark voicing in the client | Checked (see m3). | as m3 |
| Unchecked: Stage 6 and "four talk inits first" | Gap found and fixed. The pixellab-character-pipeline skill does not state the rule; Stage 6 now orders it: 4 alternative talk inits on a picks page, wait for the pick, then `visemes --from-talk` for every NPC. Not changed in that skill, which is outside this task. | SKILL.md Stage 6 |
| Unchecked: AGENTS.md "Asking the user for input" | Checked. Stage 2 (costs and approvals), Stage 6 and Stage 7 already send picks and the voicing yes through the decisions page with Copy picks and saved inputs; Stage 6 now says the talk-init page carries the concept and bust beside the options. No other gap. | SKILL.md Stages 2, 6, 7 |
