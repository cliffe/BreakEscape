# Node suite baseline (0.0 a)

Date: 2026-10-21. HEAD: 1f13ee9125f70ef96d9ea15eb4d875c3480ef743 (working tree has an uncommitted `docs/agents/FINALE_BRIEF.md` edit, unrelated). Node: v18.19.1.

Command: `bundle exec node --test test/js/*.test.mjs` from the repo root. Raw output: `node_raw/full_run.txt` (first run), `node_raw/full_run_repeat2.txt`, `node_raw/full_run_repeat3.txt`.

## Headline

| Run | Tests | Pass | Fail | File-level failures |
|---|---|---|---|---|
| Full run 1 | 750 | 748 | 2 | `engine-fixes-pass3.test.mjs`, `engine-fixes-round4.test.mjs` |
| Full run 2 | 749 | 748 | 1 | `engine-fixes-pass3.test.mjs` |
| Full run 3 | 749 | 748 | 1 | `engine-fixes-pass3.test.mjs` |
| Each of the 107 files run alone | 748 | 748 | 0 | none |

The plan expected 1 failure (`engine-fixes-round4`). The failing file in the full run is not stable: `engine-fixes-pass3.test.mjs` failed in all three full runs, and `engine-fixes-round4.test.mjs` failed in the first only. Both fail with the same runner error, not a test assertion:

```
failureType: 'uncaughtException'
error: 'Unable to deserialize cloned data due to invalid or unsupported version.'
(node:internal/test_runner/runner:357 #proccessRawBuffer)
```

Both pass alone (`node_raw/engine-fixes-pass3_alone.txt`: 6 tests, 6 pass; `node_raw/engine-fixes-round4_alone.txt`: 4 tests, 4 pass). Every test inside them passes; the failure is the Node 18 test runner failing to parse a file's result stream. Consequence for the CI quarantine list (plan item 0.7): list `engine-fixes-pass3.test.mjs` as well as `engine-fixes-round4.test.mjs`, and treat the failing file as variable on Node 18.

## Per-file results (each file run alone)

Raw output per file: `node_raw/per_file/<name>.txt`. Sum of the table: 748 tests, 748 pass, 0 fail.

| File | Tests | Pass | Fail | Exit |
|---|---|---|---|---|
| backup-recovery-when-available.test.mjs | 3 | 3 | 0 | 0 |
| bark-lifetime.test.mjs | 7 | 7 | 0 | 0 |
| bark-release-policy.test.mjs | 12 | 12 | 0 | 0 |
| biometric-lock.test.mjs | 7 | 7 | 0 | 0 |
| biometric-samples.test.mjs | 9 | 9 | 0 | 0 |
| character-textures.test.mjs | 13 | 13 | 0 | 0 |
| combat-input.test.mjs | 5 | 5 | 0 | 0 |
| consumables.test.mjs | 8 | 8 | 0 | 0 |
| credits-theme.test.mjs | 8 | 8 | 0 | 0 |
| credits-visualiser-fit.test.mjs | 2 | 2 | 0 | 0 |
| crypto-workstation-persist.test.mjs | 3 | 3 | 0 | 0 |
| dialoguelint.test.mjs | 27 | 27 | 0 | 0 |
| dialoguelint-voiced-variable.test.mjs | 5 | 5 | 0 | 0 |
| dungeon-graph-story-gates.test.mjs | 1 | 1 | 0 | 0 |
| dusting-compare-fit.test.mjs | 2 | 2 | 0 | 0 |
| dusting-model.test.mjs | 13 | 13 | 0 | 0 |
| engine-fixes-engine-a.test.mjs | 6 | 6 | 0 | 0 |
| engine-fixes-pass3.test.mjs | 6 | 6 | 0 | 0 |
| engine-fixes-pass4b.test.mjs | 10 | 10 | 0 | 0 |
| engine-fixes-pass4c.test.mjs | 19 | 19 | 0 | 0 |
| engine-fixes-pass4.test.mjs | 13 | 13 | 0 | 0 |
| engine-fixes-round3.test.mjs | 5 | 5 | 0 | 0 |
| engine-fixes-round4.test.mjs | 4 | 4 | 0 | 0 |
| engine-fixes-round6.test.mjs | 9 | 9 | 0 | 0 |
| examine-minigame.test.mjs | 14 | 14 | 0 | 0 |
| fingerprint-art.test.mjs | 2 | 2 | 0 | 0 |
| fingerprint-generator.test.mjs | 7 | 7 | 0 | 0 |
| fingerprint-reader.test.mjs | 7 | 7 | 0 | 0 |
| flag-lock-remote.test.mjs | 3 | 3 | 0 | 0 |
| flag-station-resubmit.test.mjs | 3 | 3 | 0 | 0 |
| forced-minigame-guard.test.mjs | 5 | 5 | 0 | 0 |
| forensic-data-platform-tabs.test.mjs | 5 | 5 | 0 | 0 |
| game-clock-rate.test.mjs | 8 | 8 | 0 | 0 |
| global-sync-declared.test.mjs | 20 | 20 | 0 | 0 |
| hud-caption-wrap.test.mjs | 2 | 2 | 0 | 0 |
| ink-tagdiff.test.mjs | 10 | 10 | 0 | 0 |
| keypad-title.test.mjs | 6 | 6 | 0 | 0 |
| knockback-room-clamp.test.mjs | 6 | 6 | 0 | 0 |
| lighting-emitter-leds.test.mjs | 4 | 4 | 0 | 0 |
| lighting-fire-effect.test.mjs | 6 | 6 | 0 | 0 |
| lighting-npc-torch.test.mjs | 3 | 3 | 0 | 0 |
| lighting-room-variants.test.mjs | 7 | 7 | 0 | 0 |
| lip-sync.test.mjs | 18 | 18 | 0 | 0 |
| lockpick-catch.test.mjs | 6 | 6 | 0 | 0 |
| log-filter-selected-row.test.mjs | 7 | 7 | 0 | 0 |
| log-filter-wording.test.mjs | 3 | 3 | 0 | 0 |
| los-visual-suppressed.test.mjs | 6 | 6 | 0 | 0 |
| modal-stack-escape.test.mjs | 5 | 5 | 0 | 0 |
| note-markdown.test.mjs | 7 | 7 | 0 | 0 |
| npc-attack-guard.test.mjs | 4 | 4 | 0 | 0 |
| npc-attack-pause.test.mjs | 5 | 5 | 0 | 0 |
| npc-chase-close-in.test.mjs | 5 | 5 | 0 | 0 |
| npc-chase-leash.test.mjs | 9 | 9 | 0 | 0 |
| npc-condition-dotted-paths.test.mjs | 5 | 5 | 0 | 0 |
| npc-health-bar-missing.test.mjs | 1 | 1 | 0 | 0 |
| npc-hostile-config.test.mjs | 5 | 5 | 0 | 0 |
| npc-hostility-persistence.test.mjs | 8 | 8 | 0 | 0 |
| npc-ink-variables.test.mjs | 6 | 6 | 0 | 0 |
| npc-ko-restore-pose.test.mjs | 4 | 4 | 0 | 0 |
| npc-manager-triggers.test.mjs | 11 | 11 | 0 | 0 |
| npc-mapping-delay.test.mjs | 7 | 7 | 0 | 0 |
| npc-respawn-reset.test.mjs | 4 | 4 | 0 | 0 |
| npc-scripted-move.test.mjs | 5 | 5 | 0 | 0 |
| npc-sight-challenge.test.mjs | 12 | 12 | 0 | 0 |
| npc-sprite-style.test.mjs | 7 | 7 | 0 | 0 |
| objectives-all-optional-aim.test.mjs | 3 | 3 | 0 | 0 |
| objectives-required-marker.test.mjs | 9 | 9 | 0 | 0 |
| objectives-reveal.test.mjs | 12 | 12 | 0 | 0 |
| objectives-skip.test.mjs | 6 | 6 | 0 | 0 |
| password-case-hint.test.mjs | 5 | 5 | 0 | 0 |
| password-minigame-submit.test.mjs | 2 | 2 | 0 | 0 |
| path-doorways.test.mjs | 9 | 9 | 0 | 0 |
| person-chat-background.test.mjs | 18 | 18 | 0 | 0 |
| person-chat-reopen.test.mjs | 4 | 4 | 0 | 0 |
| phone-chat-bottom-pin.test.mjs | 7 | 7 | 0 | 0 |
| phone-chat-choice-keys.test.mjs | 6 | 6 | 0 | 0 |
| phone-intro-once-and-notepad-raw.test.mjs | 12 | 12 | 0 | 0 |
| phone-message-times.test.mjs | 6 | 6 | 0 | 0 |
| phone-player-lines.test.mjs | 22 | 22 | 0 | 0 |
| phone-reopen-and-persistence.test.mjs | 23 | 23 | 0 | 0 |
| pin-cracker-feedback.test.mjs | 6 | 6 | 0 | 0 |
| pin-minigame-enter.test.mjs | 2 | 2 | 0 | 0 |
| player-damage-interrupt.test.mjs | 11 | 11 | 0 | 0 |
| player-health-persistence.test.mjs | 8 | 8 | 0 | 0 |
| playtest-brief-tasks.test.mjs | 2 | 2 | 0 | 0 |
| portrait-variants.test.mjs | 10 | 10 | 0 | 0 |
| punch-cone.test.mjs | 4 | 4 | 0 | 0 |
| rfid-cloner-click-guard.test.mjs | 4 | 4 | 0 | 0 |
| rfid-denial-hold.test.mjs | 10 | 10 | 0 | 0 |
| rfid-dictionary-attack.test.mjs | 3 | 3 | 0 | 0 |
| rfid-flipper-back.test.mjs | 3 | 3 | 0 | 0 |
| rfid-keycard-click-guard.test.mjs | 5 | 5 | 0 | 0 |
| scada-historian-data.test.mjs | 8 | 8 | 0 | 0 |
| scenario-brief-once.test.mjs | 4 | 4 | 0 | 0 |
| scenario-timer-countdown.test.mjs | 4 | 4 | 0 | 0 |
| session-overlay-pause.test.mjs | 6 | 6 | 0 | 0 |
| session-resume-keys.test.mjs | 8 | 8 | 0 | 0 |
| sight-challenge-tutorial-prompt.test.mjs | 5 | 5 | 0 | 0 |
| state-sync.test.mjs | 12 | 12 | 0 | 0 |
| title-screen-input.test.mjs | 6 | 6 | 0 | 0 |
| toast-hold-over-panels.test.mjs | 6 | 6 | 0 | 0 |
| validator-behavior-fields.test.mjs | 1 | 1 | 0 | 0 |
| validator-carry-over.test.mjs | 2 | 2 | 0 | 0 |
| validator-ink-global-collision.test.mjs | 1 | 1 | 0 | 0 |
| validator-or-conditions.test.mjs | 1 | 1 | 0 | 0 |
| validator-portrait-variants.test.mjs | 3 | 3 | 0 | 0 |
| variants-in-lock-panels.test.mjs | 4 | 4 | 0 | 0 |
