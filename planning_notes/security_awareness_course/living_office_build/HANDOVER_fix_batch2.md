# Handover: fix batch 2 (partial)

Branch feat/ca-living-office-build, base 79fefb260. One commit with the work below.

## Done
1. Chain bark stale fix: stillValid (npc-manager.js _barkStillValid) re-runs the mapping condition against live globals every 250 ms (npc-world-bubbles _tickSays) and on release. Agnieszka's arrival condition is now `data.owner !== 'needs' && globalVars.{out} === true && globalVars.kit_quiet === true`; kit_ca01_walk is cleared in a separate mapping on kit_ca01_agn_there. Adaeze's mapping gains `globalVars.{out} === true` (m1). Set piece ca01_recall in office_kits/brightwell_foods.json; test_ca01_panel regenerated (--kit to scratch, needed --allow-drop test_ca01_panel because the guard sees the dropped walk key). Tests: JS conformance "a bark's condition never reads a global its own mapping sets"; validator V3b warning (scripts/validate_office_life.rb) with tests; V3 now accepts the owner filter (m9).
2. m2: --allow-drop <shell> (repeatable, bare flag refused, unknown shell refused); prints every dropped item per shell to stderr.
3. m3: chose a WARNING, not a refusal (a kit-data edit also changes records, so refusing would always trip): office_kit.reverts() lists per-field changes to kept kit records; printed by kit_text. Module docstring states conditions/fields are kit-owned.
4. m4: kit_text filters old kit_ entries from messageGlobals before merging.
5a. ca01 + panel debrief: "The call back in this exercise is what breaks that chain" (not in e1 fragment; twin untouched; debrief text not voiced).
5b. Overlay text is the scenario's conclusionScreen body in the erb (not engine): now "That's this episode finished. The debrief stays on the kiosk if you want another look." (ca01 + panel). The twin and other generators still say "The debrief goes through each one" (left).
6. kitShellNames widened to test_ca*, skips ERB-only fixtures; new chain tests (fields allow-list, barks <=2 with quiet+out gates, step-away on host only, arrival filter/onceOnly, suspend/resume, timers, no interactionWarning, layer 0 present, no ambient names in social, stub diverts, no chain without stepAway). Fixture test_ca_office_kit is exempt (uses targetKnot).

## Done in the follow-up (commits d7d14571a, 1ac349bce)
- 7 M4 twin tier S: row ca01_invoice_fraud_defend in episodes.json (tier S, no set piece, no step-away); twin regenerated. Cause of the 6 failures + 3 errors: not strip_kit. The tests built their input with gen_e1_shells.defend_only(), which looks up the twin's episodes.json row, so once the row existed the "bare" input already carried the kit and the equality tests compared a kitted shell with its stripped self. Fix: defend_only(bare=False) takes bare=True (row ignored, tier none) and test twin_shell() uses it. New test: strip_kit(kitted twin) == bare twin, plus "kit, no chain". gen_e1_shells output and `apply_training_room.py --kit` output agree byte for byte for the twin; the four check shells are byte-identical. JS twin test now "kit, no chain". No twin host line written (new spoken content; orchestrator).
- Python tests for per-shell --allow-drop (bare flag, flag followed by a flag, unknown shell, check shell, repeatable, drop list printed) and the reverts() warning.
- Layer 1 pointer: lives in social.awarenessEpisode.strings.conceptPanel.text (an object, so a string search of strings.* missed it). The conformance test now asserts the chain (panel) shells omit "have a word with" and ca01_invoice_fraud keeps it.
- Live proof: scratchpad ca01_live/fix_batch2/RESULTS.md (a, b, d and the twin all PASS; Agnieszka bark 9.8 s, Adaeze 8.6 s in npcWorldBubbles.says).

## Not done
- Twin host layer-2 line (needs new spoken content; plan 5 asks for it).
- CA01_BUILD.md still says chain mappings cannot go in the set piece (M6 part).
- tts_cache: debrief/overlay strings have no audio (not voiced).
