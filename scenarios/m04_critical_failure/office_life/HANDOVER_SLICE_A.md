# Handover, slice A

Done: scenario.json.erb (presets, cooler, kettle, both NPCs, globals, 16 appended agent_0x99 mappings, credits, blueprint note), two new ink files plus debrief edit, all compiled with `bin/inklecate`, checks in BUILD_LOG.md, SPOKEN_LINES.md.
Open: (1) the 40-character exchange-line rule vs the sample (8 validator errors) needs a user pick: shorten lines, or exempt; (2) `bin/test-js` not completed; (3) `scripts/ink_runtime_check/missions.json` has no entries for the new NPCs (not edited); (4) slice B measures posts, cells, door position, needs ratio.
Gotchas: `lock_key_diff.rb` rewrites `dungeon_graph.html/.md`; revert them with `git checkout` before committing. The temp copy of HEAD scenario was moved to `tmp/delete/zz_base.json.erb`.
