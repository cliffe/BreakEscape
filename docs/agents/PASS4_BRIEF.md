# Pass 4 — editorial pass (m02–m08): shared brief

Repo: `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape`. Read `AGENTS.md` first: it describes how this work is organised.

## What this pass is

The user wants the best possible story and gameplay across m02–m08. Two stages per mission, both iterative:

1. **Design** — run the `scenario-design-review` skill (`.claude/skills/scenario-design-review/SKILL.md`) in full, fix what it finds, re-review until clean.
2. **Dialogue** — run the `npc-dialog-review` skill (`.claude/skills/npc-dialog-review/SKILL.md`) in full and edit every ink script as a script editor/writer on a spy-thriller TV series would, then apply the humanizer rules (`~/.claude/skills/humanizer/SKILL.md`) to every line. Then a fresh script editor reviews the result.

**m01_first_contact is the example to learn from and is not edited** (its audio is cached). m02 is further on than the others but goes through the full process too.

## References

- Dialogue style guide: `story_design/universe_bible/09_scenario_design/dialogue_style.md` (written at the start of this pass).
- Voice bible: `story_design/universe_bible/04_characters/voice_bible.md` — how each recurring character talks (diction, rhythm, verbal habits, what they never say) and their TTS voice settings. Recurring characters must sound the same in every mission.
- `README_scenario_design.md`, `README_ink_best_practices.md`, `tools/pass2/PASS2_LESSONS.md`, `docs/agents/PASS3_PUZZLE_BRIEF.md` (engine rules learnt in pass 3: phone re-navigation, clone rule, cooldowns, LOS, item names, rename rule — all still apply).
- Each mission's `PUZZLE_CHAINS_PLAN.md` and `dungeon_graph.md`; the canon in `story_design/universe_bible/`.
- Log for this pass: `scenarios/PASS4_EDITORIAL_LOG.md`. PASS3_APPROVAL_LOG.md is closed history, apart from its open items, which this log carries forward.

## Dialogue goals (summary; the style guide has the detail)

- Snappy. Each line does a job: information, character, tension or a laugh. Cut throat-clearing and lines that repeat what the player already knows.
- Key gameplay information lands clearly and early in the exchange (what to do, where, why it matters), and players can find it again (hub, notes, aims).
- Subtext over exposition; people in a spy thriller rarely say exactly what they feel.
- Player choices are the player's own spoken words in first person, distinct in intent, and they matter (`README_ink_best_practices.md`).
- No AI tells: no "it's not X, it's Y", no inflated framing, no stock vocabulary (delve, crucial, pivotal, landscape, testament…), no tidy summarising last lines, no rule-of-three padding. UK English.
- Phone inks: drop the contact's own `Name:` prefix on their lines (the phone strips a matching prefix anyway, and m01's phone ink has none); keep a prefix only when someone else speaks (`Narrator:`, a relayed quote). Person-chat inks keep `Name:` prefixes: they pick the portrait and the TTS voice. A `You:` line in a phone chat now renders as the player's bubble (U3).
- `Narrator:` lines in phone inks render as narration (centred, italic, no prefix) once the engine change lands; use them sparingly. Asterisk stage directions (`*a beat*`) show on screen as written: keep them to m01's density and never inside numbers or key information.
- No `You: …` echo lines after a choice; fold the words into the choice bracket (m01 convention). Only a genuinely non-verbal choice (`[Say nothing.]`) may be followed by a `You:` line.

## Hard rules for edits

- **Tags and logic are load-bearing.** Rewriting a line must not change: `#` tags (give_item, unlock_door, set_global, exit_conversation, speaker, clone_keycard…), knot/stitch names, VAR names and defaults, divert targets, choice conditions and sticky (`+`) vs once-only (`*`) choices, external function calls, END/DONE. If a change is a deliberate improvement, record it in the mission's section of the log with the reason. Run `node scripts/ink_runtime_check/tagdiff.mjs scenarios/<m>/` and explain every difference it reports. Run `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/<m>/` before and after: every `line-len`/`text-len` error and `you-after-choice` check must be resolved or justified, and AI-tell warnings cleared (a villain may keep one rhetorical "not X, Y" per scene, per the style guide).
- After editing ink: recompile with `bin/inklecate` (keep the compiled `.json` in step), then run inkcheck/loopcheck and `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json <mission>`; `ruby scripts/validate_scenario.rb scenarios/<m>/scenario.json.erb`; `python3 scripts/check_door_alignment.py scenarios/<m>/scenario.json.erb`.
- Mission-local changes (the mission's own erb, ink, docs) are approved if they make the mission better and keep it solvable and validator-clean. Engine, shared minigames, shared assets, other missions, SecGen and HacktivityLabSheets: don't change them; write them up for the log.
- Ideas that go beyond the mission (new mechanics, minigame improvements, UI, art, engine features) go in the "Ideas for the backlog" section of your report; the orchestrator files them in `docs/IDEAS_BACKLOG.md`.
- Scratch files: use your own subfolder of the session scratchpad (`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/<session-id>/scratchpad/`, as given in your prompt; never a `scratchpad/` folder in the repo) named `<mission>-<role>/` (e.g. `m02-rereview2/`); never write generic names (lint.txt, matrix.sh) at the scratchpad root, because parallel agents overwrite each other.
- Other agents work in the same tree at the same time: never `git stash`, `git checkout -- <file>` or `git reset`. Compare with `git show HEAD:<path>`.
- Don't touch `.claude/skills/*`. Don't commit. Write long documents section by section with Edit.
- Spoken-line changes cost money once the mission's audio is generated, but m02–m08 audio is being generated after this pass, so rewrite freely. Keep a count of lines changed per mission.
- Keep security detail at citation level ("the step in the m06 lab sheet") rather than restating attack steps.

## Playtests

Sonnet agents, keyless server on :3001 (`PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb <m>`; `tools/playtest/start-keyless-server.sh` if it isn't up). Never stop :3000. Follow `.claude/skills/playtest-scenario/SKILL.md`; short split runs; one with a reload; `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id>` must show progress (plain `ruby` fails).
