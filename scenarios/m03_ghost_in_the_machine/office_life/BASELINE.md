# m03 office life: stage 0 baseline

- Base commit: b7a4fde4d12a912ab6f3af2762dea2078cb1ddce (branch build/ol-m03)
- Validator (validator_base.txt): 0 errors, 5 warnings (result line: "0 errors (0 known), 5 warnings"). Exit code 0.
- NPC lines in v1_summary_base.txt: 10 (header: "OFFICE-LIFE SUMMARY (V1): 10 NPC(s)")
- Lock nodes in baseline_locks.json: 7 (0 gates)
- TTS (tts_base.txt): 0 cached, 0 uncached. Total 0 office-life clips.
- gameClock: present, `{"start": "Thu 14:55", "rate": 1, anchors: [clone_call_done === true -> 23:00; debrief_played === true -> Fri 08:30]}`
- disableAttacks: absent
- Walkthrough: scenarios/m03_ghost_in_the_machine/TESTING_WALKTHROUGH.md

Notes:
- The info-marker grep for the literal "ℹ️" (with variation selector) matched nothing. The validator prints U+2139 without the selector, so validator_info_lines.txt holds the one line matching that marker (the desk boxes legacy note).
- The validator and the office summary both regenerate dungeon_graph.html and dungeon_graph.md in scenarios/m03_ghost_in_the_machine/. Those tracked files were restored to HEAD and are not part of this commit.
