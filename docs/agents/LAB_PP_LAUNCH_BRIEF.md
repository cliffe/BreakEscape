# Lab physical pentest launch: shared brief for subagents

Kind of game: a lab scenario (`scenarios/lab_physical_pentest`, Ledgerwell Ltd). It is a short,
focused physical penetration test lab for students: tailgating, badge cloning, lock picking, clear
desk, a planted keylogger and drop box, BadUSB, rogue AP, then Ruth's debrief and the credits. Keep
it short and focused on that topic. Judge against that aim, not the spy campaign.

Branch `build/lab-pp-launch`, worktree
`/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-lab-pp-launch`.
Log: `scenarios/lab_physical_pentest/IMPROVEMENT_LOOP_LOG.md` (the orchestrator writes it).

## Rules (every agent)

- Work only in the worktree you were given. Never commit on main. The main checkout is a shared tree.
- Keyless ports 3060 to 3065 only, and only the one your brief names. Never :3000 or :3001.
  Start a keyless server with `tools/playtest/start-keyless-server.sh` from your worktree (read it
  for the port variable); if bundler cannot find gems, set
  `BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle`.
- Drive only game ids that `tools/playtest/new-game.rb` printed for your own run. Never edit stored
  game records (no SQL or console writes to a game's scenario or state).
- Headless under Xvfb with WAYLAND_DISPLAY unset. Phaser: `setFPS(20)` with fixed steps ON; never
  `fixedStep=false`.
- Stop processes by PID, never `pkill -f`. Never a bare `git stash`, `git checkout -- <file>` or
  `git reset`. Never run any `db:` task.
- Stage explicit paths, check `git diff --cached --stat`, commit with
  `git commit -m "..." -- <path> <path>`.
- Repo text: UK English, no em or en dashes, no attribution lines, no model names in repo files.
- Spoken (voiced) lines: list every one you change as old -> new in your report. Never generate TTS.
- Do not decide these open items (being triaged for the user): N5 id parity, the RoE nudge, Len
  holding up at the door, the device pitch, the drop box staying in inventory, an open challenge
  chat blocking interaction. If a finding touches one, report it and leave it.
- Do not edit room types shared with test_seating: `room_lw_office`, `room_lw_reception`,
  `room_se_engagement`.
- PixelLab costs money: do not call it. List what you would generate and its cost instead.
  Gemini concepts through `tools/agy_image.sh` are free and allowed where your brief says so.
- Do not open SecGen XML or the exploit-detail field guides.
- Context limit: when your context passes about 150k tokens (roughly 80 tool calls, fewer with many
  screenshots), finish the step you are on, commit, write a handover note to the path your brief
  names, report back and stop.
- Report back in at most 15 lines: status, commits, counts, file paths, game ids. No long quotes.
