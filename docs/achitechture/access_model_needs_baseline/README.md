# Needs regression baseline for access model step 9

Captures of the three needs scenarios (`test_needs_sims`, `test_npc_needs`, `test_needs_leash`)
taken before and after the step 9 workstation changes (`ACCESS_MODEL_PLAN.md`, step 9, "Needs
regression runs"). `COMPARISON.md` says what changed and whether the plan predicts it.

## Files

| File | What |
|---|---|
| `<scenario>.before.json` | Captured on commit `dc0c4a52` (the step 8 engine plus this capture script), before any step 9 code changed |
| `<scenario>.after.json` | The same capture on the step 9 code |
| `test_needs_sims.after2.json` | A second capture of `test_needs_sims` on the step 9 code, run on its own, to measure run-to-run variance in walking times |
| `COMPARISON.md` | The comparison and its verdict |

## How they were made

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
export PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium
node tools/playtest/needs-baseline-capture.js --scenario test_needs_sims \
  --out docs/achitechture/access_model_needs_baseline/test_needs_sims.before.json
node tools/playtest/needs-baseline-compare.js \
  docs/achitechture/access_model_needs_baseline/test_needs_sims.before.json \
  docs/achitechture/access_model_needs_baseline/test_needs_sims.after.json
```

`needs-baseline-capture.js` creates a game on the keyless server (:3001) with `new-game.rb`,
plays it headless, and writes one JSON file. Its built-in profile per scenario:

| Scenario | Rooms loaded first | Needs-clock span | Knock-out (`debugKO`, exercised) | Probe every |
|---|---|---|---|---|
| `test_needs_sims` | kitchen, office, lounge, office | 240 s | `tom` at 20 s, at his desk | 15 s |
| `test_npc_needs` | none (one room) | 120 s | `finder` at 20 s, at his desk | 5 s |
| `test_needs_leash` | `maya_office`, `store`, `west_corridor`, `ravi_office` | 180 s | none (no workstations) | 15 s |

After the rooms load, the needs system is reset to the scenario's seed
(`window.__test.needs.setSeed`) with the clock on manual, and the clock is stepped one 250 ms tick
at a time with 250 ms of real time between ticks, so NPCs still walk in game time. Each file holds:
`needsLog` (the decision log), `events` (every `npc_*`, `workstation_*`, `pc_*`, task and item
event, and the workstation globals' changes, each with the needs clock), `workstations` (each
workstation's state, then every change), `probes` (what `workstationState.onInteract` answered for
every workstation at each probe time, as a click would; a probe emits `workstation_accessed` or
`workstation_locked_attempt` and sets `<id>_accessed`, the same in both runs), `tasks` (completion
order) and `actions` (the set-up and the knock-out). Games 13 to 20 were made for these captures
and deleted afterwards.

`needs-baseline-compare.js` compares two files by the order of decisions and events per NPC and
per workstation, not by tick numbers: the clock is stepped in real time, and walking times move
with machine load (the before and after captures of the three scenarios each ran three browsers
at once).
