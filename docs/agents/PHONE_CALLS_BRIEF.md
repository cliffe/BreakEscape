# Phone calls: brief for every agent on this track

Started 2026-11-11. Log: `docs/agents/PHONE_CALLS_LOG.md`. Plan (once written): `docs/achitechture/PHONE_CALLS_PLAN.md`. Inputs: `docs/agents/phone_calls/`.

## The goal (user, 2026-11-11)

Get every phone, call and remote conversation in the game into a great state. Rewrites and new voicing are fine.

The engine can show a phone conversation in five ways:

1. a silent text thread (phone-chat);
2. a voiced phone call (phone-chat with `voiced: true`, drawn as a call screen by `phone-call-ui.js`);
3. a video call (person-chat framed as a call: `conversationMode: "video-call"` or `timedConversation.videoCall`);
4. an in-person conversation (person-chat);
5. a voicemail, recorded message or phone object with a voice script (`type: "phone"` objects with `voice` and `ttsVoice`).

Phones used to be text only. Voiced calls were added for the finale (m09, m10: F17, F20) and for the social engineering lab's pretext desk-phone calls (`lab_social_engineering`, contact-level `voiced: true` plus `callLabel`, opened through `pretext-card.js` `callLaunch`). **The handset itself has no real call flow.** No incoming call rings with answer and decline. The player can't start a call from a contact in the phone. There's no missed call, call back or call log, and each mission has invented its own approach. A voiced call only happens when an event mapping forces one open.

**The aim is immersion and variety** (user, 2026-11-11). The phone should feel like a real handset in a spy thriller: calls that ring at the right moment, contacts you can ring, texts that read as texts, and a mix across each mission (call, text, video, voicemail, in person) rather than one mode everywhere. Updating dialogue and tweaking minigames (the phone, person-chat, pretext card) is allowed where it serves that.

**Walkthrough lab sheets stay correct** (user, 2026-11-11). When a change alters what the player does or sees (a text becomes a call, a contact becomes callable, a knot moves), update that mission's walkthrough lab sheet in the same piece of work. The sheets live only in the HacktivityLabSheets repo (`/home/cliffe/Files/Projects/Code/HacktivityLabSheets/_labs/<category>/`; `mission.json` `lab_sheet_url` gives the published page; see the `mission-lab-sheet` skill, which is stale on BreakEscape-side copies). Never open or edit the VM technical companion (`labsheet_vm_steps.md`): if a change touches it, note it in the log for the opus48 agent.

The work, in order (mechanics before polish):

1. **Engine: calls on the handset.** Design and build how a call works in a mission: incoming (ringing, answer, decline, missed, call back), outgoing (calling a contact from the phone, and which contacts and knots can be called), how it sits alongside texts from the same contact, voicemail where it earns its place, save and reload, and forced calls (`disableClose`). It needs a scenario schema that missions can use simply, and it must be backward compatible.
2. **Missions: use the right mode everywhere.** Every conversation is written for the mode it is shown in. Text-configured ink that reads as a call becomes a call (or gets rewritten as texts). In-person HaX speakers get an in-person voice style, not the phone one. List every spoken line that changes.
3. **Docs.** README_scenario_design.md "Voiced phone calls" (updated 2026-11-11 with the contact-level form; update it again for the new flow), README_ink_best_practices.md where the ink rules change, and the tts-audio skill only if extraction rules change. A skills update goes in the log for the user (don't edit `.claude/skills/*` unless the plan names it).
4. **Audio.** Voice the new and changed call lines (`tts-audio` skill). Cost is approved for this track (user, 2026-11-11), but report the line count first.

## Hard constraints

- **`lab_social_engineering` is deployed and must work exactly as it does now**: Dev's and Ruth's calls, the pretext card flow, the call screen, the cached audio keys. Prove that with its existing tests plus a live browser run before and after.
- Existing voiced calls keep working, and keep their cache keys unless the plan says otherwise: m09 HaX/Recruiter, m10 HaX/Victoria/Vance/Elena/Ghost, m02 Ghost video calls, lab_tesseract_trials video call.
- Kinds of game: m01–m10 are a TV spy thriller (HaX the handler, ENTROPY the enemy). sis01–03 are serious games, education first, with no spy framing. Labs are short and focused. Judge the writing against the kind.
- No printed variables in voiced lines. No inline stage directions in voiced lines: use `#delivery:` (note that voiced phone calls drop delivery notes today: `docs/handover/2026-11-10_ACCESS_MODEL_HANDOVER.md` line 39).
- New engine features need unit tests (`test/js/`, and Rails tests where the server changes), a focused test or demo scenario, and live browser proof on a real game. A helper test passing is not proof.
- A new static import in an engine JS module must be added to each test harness copy list, or the node tests fail with ERR_MODULE_NOT_FOUND.

## Where to work

- **Worktree** `.claude/worktrees/p-phone-calls`, branch `build/phone-calls`. Work and commit there, never in the main checkout.
- Environment: `export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6`. Worktrees have no `.bundle/config`, so set `BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle` and use `bundle exec`.
- Browser proof: run your own keyless server on **port 3023** (`env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true BUNDLE_PATH=... bundle exec rails server -b 127.0.0.1 -p 3023`, or `tools/playtest/start-keyless-server.sh`), create games with `bundle exec rails runner tools/playtest/new-game.rb <scenario>`, and drive with `.claude/skills/playtest-scenario/scripts/playtest-session.js`. Headless only. Stop the server when done. Never touch :3000 or another track's port (3018–3022 are in use).
- **The Postgres dev DB is shared, with no backup.** Never run db:create, db:schema:load, db:migrate, db:reset, db:drop or db:setup. If the server fails for a schema reason, stop and report.
- Full Rails and JS suites share the test DB with other tracks: run them under `flock /tmp/be-test-suite.lock`.
- **Commit with explicit paths**: `git commit -m "..." -- <path> <path>`. Check `git diff --cached --stat` first. Never `git stash`, `git reset` or `git checkout -- <file>`.
- Don't open SecGen XML or the exploit-detail field guides. VM claims go to the orchestrator.

## Handover rule

When your context passes about 150k tokens (roughly 80 tool calls, fewer with many screenshots or big files), finish the step you're on, commit, and write a handover note to `docs/agents/phone_calls/HANDOVER_<role>.md` (done, open, in progress, files touched, commits, gotchas). Then report back and stop. The report back is at most 15 lines: status, commits, counts, paths, questions. Point to content by file:line rather than quoting.

## Writing style for docs

UK English, plain words. Write "Cyber Security" with a space. No AI filler ("crucial", "robust", "seamless" and similar), and don't summarise what you just said.
