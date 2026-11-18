# Return stall reviews

Review rounds, outcomes and the diagnosis for the NPC return-stall fix (branch fix/needs-return-npc-stall, on main from Train 220).

The live-run driver scripts that the reviews and scenarios/m08_the_mole/office_life/LIVE_RETURN_STALL.md refer to as `drivers/` were taken out of the tree after the merge. They held local paths and game ids and only ran in a scratch layout. To read one, use git: `git show 48e4627ad:docs/achitechture/reviews/return-stall/drivers/<file>` (trip.js to trip4.js, diag.js, rundiag.sh, runtrip2.sh to runtrip4.sh, game2.sh to game4.sh, setup2.sh, c.sh, ng.sh).
