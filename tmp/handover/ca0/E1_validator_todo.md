# E1 validator and graph todo (scripts/ is owned by E4)

1. scripts/validate_scenario.rb: remove the side-gate warning (about :8247-8251, "a gate on an east or west door ... stays an ordinary locked door"). A gate on an east/west door now works (door-gates.js groups both sprites by the doorway centre).
2. Widen the gate filter (about :2523) so side gates count as gates in the lock/key and "careless guard" checks. The door-gates-validator.test.mjs cases at :54 ("a gate on an east or west door is a warning"), :306 (careless guard on an east/west gate), :344 and :576 (closeDoor on a side-only gate) encode the old warning; update them with the validator change.
3. `gate.activeIf`: optional string; check with the action-condition grammar (action_condition_problem) and that every `globalVars.<name>` it reads is a declared global. Parse failure is an ERROR (the engine treats an unparsable window as always live).
4. scripts/generate_dungeon_graph.rb: wherever it filters gates, draw an activeIf gate as a gate with a note ("live while <condition>").
5. Known: scenarios/test_side_door_gate validates with 0 errors today (the side-gate warning is among its warnings until item 1).
- scenarios/test_side_door_gate/scenario.json.erb: validator warns 'unknown field activeIf' and the side-gate warning until E4 lands items 1 and 3.
