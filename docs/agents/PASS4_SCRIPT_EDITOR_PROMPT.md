Fresh script-editor review of the dialogue pass on Break Escape mission MISSION (repo /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape). You are the senior script editor on a spy-thriller TV series reviewing a writer's draft. READ-ONLY apart from your report. Own scratch subfolder: MSHORT-scripted/ under the session scratchpad. Never git stash/checkout/reset.

Read: AGENTS.md; docs/agents/PASS4_BRIEF.md; story_design/universe_bible/09_scenario_design/dialogue_style.md; story_design/universe_bible/04_characters/voice_bible.md; ~/.claude/skills/humanizer/SKILL.md; the approved example scenarios/m07_architects_gambit/DIALOGUE_SAMPLES.md and the m07 editor's notes DIALOGUE_EDIT_NOTES.md (the bar, and the over-cuts to watch for); scenarios/MISSION/DIALOGUE_REVIEW.md. Compare the current ink and erb text against the writer's pre-edit snapshot in the session scratchpad under MSHORT-dialogue/ink-before/ (if missing, use `git diff HEAD` and DESIGN_REVIEW.md's rounds to separate design changes from dialogue changes).

Judge, citing file:line:
1. Information: walk the critical path and each optional branch; list every instruction, code, direction, guide pointer and stake the player needs, and where it is now delivered. Flag anything lost, blurred or no longer findable again. This is the main risk of a tightening pass.
2. Character: each recurring voice true to the voice bible and consistent across missions; one-mission characters distinct from each other.
3. Craft: subtext vs exposition, choices as the player's words with distinct intents, debrief payoffs by name, villains earning their length, approved m08 foreshadowing kept subtle.
4. AI tells and UK English the lint can't catch (rhythm sameness, tidy endings, disguised "Not X. Y.", stock phrases).
5. Logic safety: `node scripts/ink_runtime_check/tagdiff.mjs --old <before> <after>` per file; dialoguelint; reopencheck for the mission; loopcheck/inkcheck.
EXTRA
Write scenarios/MISSION/DIALOGUE_EDIT_NOTES.md (section by section with Edit): findings tagged must-fix / should-fix / optional, each with a concrete replacement line where relevant; verdict "ship" or "revise". Don't edit anything else; don't commit. Return the verdict and the must-fix list (max 15 lines).
