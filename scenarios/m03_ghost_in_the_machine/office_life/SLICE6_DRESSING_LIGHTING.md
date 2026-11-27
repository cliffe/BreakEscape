# m03 office life slice 6: dressing and lighting check

Branch build/ol-m03, tip f9b80683e. Games 6668 (day) and 6690 (night), port 3091. Screenshots and scripts: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/slice6/ (not in the repo).
No scenario, layout, Tiled or lighting change was made.

## Verdict
Layout and lighting hold as the plan says (no change needed). Two findings: one major (night leftover), one minor (coffee pair ordering). The rest pass.

## Passes
- No duplicate machines: all 7 rooms loaded, one `reception_coffee` (coffee_station1 at 262,189), one `hallway_cooler` (water_cooler1 at 192,-101), one `zainab_laptop`. Evidence: d_dupes.mjs output.
- Declared objects sit on their Tiled props (reception-day-annotated.png, hallway-day-annotated.png). Props are square to the walls.
- Laptop sits on the glass coffee table (x160-184, y278-296 inside table x134-186, y272-302) and reads as an open laptop from above: laptop-table-closeup.png. Nit: it is small and grey on the glass, easy to miss (depth 296.5 is under the table's 302.5, so the glass tints it).
- Use cell (276,244) and queue cells (243,241), (211,241) are clear of the reception north doorway (48,32) and of Ffion (240,126): reception-day-annotated.png. Use cell sits just above the plant canopy, not under it (coffee-seq-04-u2.png).
- Hallway cooler pair flank the cooler at x=198 and x=234 and chat (cooler-seq-03-u2.png). Not inside walls or furniture.
- Lighting by day: reception mode on; hallway motion light on whenever the player is there (hallway-day-player-clean.png).
- Staff lanes to the hallway cross the north doorway only as a doorway walk; nobody was stuck in it.

## Findings
1. MAJOR, reception, night. After the live act-2 transition (clone_call_done true, phase act2_infiltration) a seated head and shoulders figure in Zainab's headscarf is still drawn on the sofa, although her sprite reports vis false and hiddenMap true. Screenshots: night-reception.png, night-reception-laptop.png (game 6690). After a page reload the same room is clean: night-reception-laptop-reload.png. So the hide at the turn leaves something drawn (seat overlay or sprite redraw) until reload. Not found: Yusuf (armchair empty). Fix: needs the engine side of the re-hide at the turn; not attempted (engine, not a scenario field). Next step: in game 6690 style run, list scene children near (150,235) just after the turn, as g_probe.mjs does, but before any reload.
2. MINOR, reception, day. The coffee pair does not always stand at the machine together. 3 runs: once both used (x=240 and 268, coffee-pair-rep0-0.png), twice Zainab used from the west cell (240,244) while Yusuf stood at (220,244) in goto_target for 15 to 20 s with the main cell free, then used after her (coffee-single-rep2-0.png; log in e_coffee2 output). Looks like a queue, no overlap with furniture. Chatter and exchanges need the pair, so a pair is less frequent than intended. Possible cause: besideCell choice in npc-needs.js around line 3394. Fix: engine or leave; no useFrom/queue.cells edit would change it without evidence.
3. NIT, reception. A cream disc appeared on the glass table in some staff-active shots (coffee-seq-03-u1.png) and not at rest. Unidentified (not a scene object found near the table). Likely an effect; check if cheap.
4. NIT. Plan text says coffee_station1 is "at 262,230"; the loaded sprite is 262,189 (centre 275,210). Plan wording only.

## Night check
Staff hidden (hiddenMap true) at the turn and mode idle, no job, no queue: nothing office-life left in the world except finding 1. Hallway at night is mode on with a night ambient and the cooler unattended (night-hallway.png). Ffion's KO'd body in night-reception.png is my test setup.

## Handover
Done: all checks above. Open: finding 1 root cause (engine), finding 3 identity. Server on 3091 stopped by PID.
