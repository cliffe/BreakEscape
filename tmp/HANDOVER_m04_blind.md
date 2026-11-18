# m04 blind fixes handover (worktree .claude/worktrees/p-m04-blind, branch fix/m04-blind)

Done (committed): see git log on fix/m04-blind.
- #2 Vance: vance_commits_choices now offers the existing crew topic ("Is anyone working in the halls tonight?" / "Sound the evacuation") right after he becomes ally; debrief: ally + not warned + not ko gets the existing voiced line "Vance had the evacuation alarm on his desk all night." (no new audio). HaX "Vance can still sound the evacuation" mapping was ALREADY gated on vance_is_ally (scenario.json.erb ~1062).
- #1 Static: appended a HaX text mapping at the end of agent_0x99 eventMappings (static hostile, once, text only, no audio).
- #5 Base64 text reworded (no "Base64"; text only).
Findings from reading code:
- Engine already pauses hostile attacks during person-chat (npc-attack-guard.js PAUSING_SCENES; tests npc-attack-pause.test.mjs). Phone and non-chat minigames (e.g. notes) do NOT pause; an in-flight windup lands. The tester's "damage during talk" likely came from reading notes. No engine bug found; do not change.
- Why Static hostile: forced chat on room_entered (once): 3 of 4 options go to static_refuses -> #hostile; only "I'm not here for you..." sets static_stood_aside. After respawn/reload hostile state resets and the once-only entry never refires, hence idle second time. Intended-ish. Consider (not done) a label hint on the three hostile options.
- #3 "Take Voltage alive": there is NO such task. Only briefing/HaX wording ("Voltage alive, if you can", ink/m04_opening_briefing.ink:176,282; phone 769). Task is confront_voltage (completes on confrontation). Suggest no change (voiced lines, overlaps fix/wordy-m04). skipTask exists if wanted.
- #7 credits: m04 wiring identical to m01 (music event on conversation_closed:agent_0x99_debrief, scenario.json.erb ~221, credits inside it). The "MISSION COMPLETE // AUDIO INTEL" screen is the credits/ending screen; the score row stays after credits end. Needs live screenshot during credits to prove.
- #6 fix/dusting-ux exists (3 commits: findable patch with options off, "Print logged" toast). Not duplicated. Resume-loses-progress not covered there: report only.
Open (not started):
- ESD range: object 20x25 sprite, reach = INTERACTION_RANGE 32px measured to sprite.y (interaction-reach.js); option: add "wallMounted": true to esd_pushbutton (clamps y into sprite span) or measure live. Add test.
- Laptop plant_room_pc_1 (type pc, readable text, no desktopUser) gives no-effect; Vance's pc works with observations only. Check live what the player sees; consider type notes-style or desktopUser/ observations. Story fit: armed controller text already in "text".
- Credits line for ally+not warned (optional).
- test/js/m04-blind-fixes.test.mjs (style of m01-debrief-gates.test.mjs): Vance commits_choices offers crew topic; debrief ally line; HaX mapping appended last.
- tagdiff, npc-dialog-review lints (scripts/ink_runtime_check/dialoguelint.mjs scenarios/m04_critical_failure/), validator (restore dungeon_graph files), ruby tools/check_mapping_index_drift.rb main, bin/test-js, wordy-m04 overlap (git diff main fix/wordy-m04 -- <file>; it touches debrief ink, briefing, phone_agent0x99 ink only; my debrief edit is near line 430 - check), live proof on :3206.
New voiced lines: none so far.
