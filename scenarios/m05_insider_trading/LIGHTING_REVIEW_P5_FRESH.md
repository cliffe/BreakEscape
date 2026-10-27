# m05 lighting, pass 5: fresh independent review

Reviewer: independent agent, 2026-10-14, against commit 700cab1f. This is the first review not written by the agent that built the lighting (see the "self-review" note in `LIGHTING_PLAN.md`).

Read: `docs/agents/M05_PASS_BRIEF.md`, `.claude/skills/mission-room-lighting/SKILL.md`, `docs/agents/LIGHTING_LOG.md` (m05 entry), `LIGHTING_PLAN.md` including "Phase art: lighting", and the `lighting` blocks in `scenario.json.erb` (lines 709-1950). Builder evidence checked: `build_evidence/lighting_c5/{base,named,after,live,reload}` and the session logs, with `build_evidence/dressing_c5/` as the unlit baseline.

## My own tours (keyless :3001, every session stopped)

Shots are in the session scratchpad (`m05-lighting-fresh/`), not the repo:

| Tour | Game | Command |
|---|---|---|
| Afternoon | 2407 | `lighting-tour.sh m05_insider_trading <out>/base --close-intro --check` |
| `torres_identified` | 2408 | `... --globals torres_identified=true` |
| `final_choice` set | 2410 | `... --globals torres_identified=true,final_choice=detain` |
| Torres in the vault | 2412 | `... data_center --globals torres_identified=true --show-npc david_torres --player data_center:7,9:up` |
| Reload, named only | 2413 | hand-driven: set `torres_identified`, sync, `location.reload()`, Resume, read lighting state |

`--check` output matched the builder's c5 `tours.log` row for row: same modes, variant indices and lit ambients in all three phases.

Reload, game 2413 (the in-between state the c5 reload test did not cover): before the reload, lobby v0, corridor off/motion/v0, server hallway, server room and vault on/v0, terminal `pc10` on variant 1 (amber). After the reload and Resume, every value was identical and `torres_identified` was still true with `final_choice` still `""`. The c5 test covered both globals set. Reload persistence holds in all three phases.

Dead config check: I matched every emitter key in the m05 blocks against the texture keys placed by its `room_qdc_*` Tiled map. All 20 keys match at least one object (the vault `pc` key matches only `pc10`, and `qdc_hsm` matches two HSMs, which is intended). No dead emitters.

## Judgement against the skill

- **Does the lighting tell the story?** Yes. The evening ambient, the warm break room and the cool lab read as rooms with people still working. The lobby's after-hours drop is clear, not subtle: mean floor brightness goes from 161/161/167 to 121/127/145 RGB in my crops. The corridor turning into a motion corridor is a good after-hours cue, and the terminal goes from screen white to amber to red.
- **Clues readable?** Yes. Every clue room is either lit on arrival (lobby, break room, open office, lab, Patricia's office) or strikes as the player walks in (server hallway, server room, Torres' office, vault). Lit shots show the IT notice, suspects board, Lab Rules, mug, briefcase and the vault papers clearly. No room is `dark`, so nothing is ever left to the torch.
- **False hints?** None found. Torres' desk lamp puts the mug in its pool. The mug is a real clue, the lamp is painted on the desk, and the office strikes as soon as the player enters, so this is a natural light falling on a true clue, not a pointer at a red herring. The coffee machine is the brightest object in the dark after-hours corridor (the engine's vending glow). A lit vending machine in a dark corridor is believable and it is not interactable, so I left it.
- **Blooms over walls?** Only small ones that belong to the signs: the vault and two-person signs in the dark vault, and the violet server sign. Nothing crosses into a neighbouring room.
- **Darkness hiding needed objects?** No. In the dark shots the vault papers and the hallway IT notice are lost, but both rooms are `motion`, so the lights strike before the player can reach either.
- **Flash safety:** the effects are only engine `blink` (rack, no `above`) and `breathe` (terminal). Variants apply with no strike. Nothing new flashes.

## Findings

| id | sev | room | finding | evidence | fix |
|---|---|---|---|---|---|
| F1 | minor | server_hallway, server_room, data_center | The beat at the naming where "his badge just went through the hallway and the vault's logged him in", and the server side lights come on, is invisible on most routes. These are `motion` rooms with no `offAfter`, so once the player has struck them they stay on. Nearly every player uses the server room (VM launcher) before the naming. Players who prove exfil through the vault documents (`found_manifest`/`found_upload_schedule`, erb:30, 1083) have also struck the vault. The c5 live check named Torres in a fresh game, so the rooms had never been struck. Nothing breaks: the rooms are just already lit. `LIGHTING_PLAN.md` §1 claims more for this beat than most players will see. | config erb:1554-1572, 1588-1612, 1919-1946; `lighting_c5/live/` (fresh game, no prior visit) | Add `"offAfter": 60` to the base (pre-naming) block of `server_hallway`, `server_room` and `data_center`. The `torres_identified` variants already set `mode: "on"`, which overrides it. The rooms then go dark again after the player leaves, and are found lit after the naming. If the replayed strike is unwanted in the server room, apply it to the server hallway and vault only. Otherwise, soften the §1 claim in the plan. |
| F2 | minor | data_center | The steady red "stopped" state is the weakest of the terminal's three states. In a lit vault it reads as a faint pink halo, weaker than the amber "running" glow at a mid-breathe frame. It does differ from amber, and the player sees it only briefly before the ending, so this is polish. | my `after/data_center-a.png` vs `named/data_center-a.png` (crop compared side by side); erb:1937 | Raise the red variant's `floorTint` from 0.45 to about 0.6 and `intensity` from 0.9 to 1.0 so it matches amber's weight. Keep `effect: null`, since steady is right for a dead transfer. |
| F3 | minor | main_corridor (doc only) | `LIGHTING_PLAN.md` §3 gives the corridor's lit ambient as "scenario", but its named variant sets `"ambient": "#b8bfce"` (erb:1422). `--check` confirms `lit=#b8bfce` after the naming, and the `LIGHTING_LOG.md` m05 entry leaves it out too. The config is fine. The record is incomplete. | erb:1420-1424; my `named.log` | §3 row: "scenario; named: motion, `offAfter` 75, `#b8bfce`, dark `#161c30`". Add the same to the LIGHTING_LOG m05 line. |
| F4 | minor | data_center | The upload terminal's phase glows are keyed on the texture prefix `pc`. Today that matches only `pc10`, but a later dressing change that adds any other `pc*` texture to the vault (a second PC, a `pc_tower`) would also turn amber and then red. That would point at the wrong object, which is the false-hint risk the skill warns about. | erb:1935-1938; map check (`room_qdc_vault.json` has one `pc*` object) | Narrow the key to `pc10` (the longest-prefix match is already supported, `lighting.js:468`), or give the terminal an `id` and key on that. Variants match on object id first. |

Counts: **0 blockers, 0 majors, 4 minors** (3 config, 1 doc).

## Noted, not findings

- Torres stands at tile (5,7), just south of the terminal desk and facing the door, not at the terminal the confrontation describes ("alone at a terminal"). The amber glow does not wash over him (game 2412). This is a placement question for room dressing, not lighting.
- I watched no full breathe cycle and did not test the corridor's 75-second switch-off. I did not try these myself, and the builder lists them as not exercised either.
- D16 (LEDs for `qdc_*` racks and HSMs) is still an engine proposal. The single soft rack glow carries the dark server room well enough without it.

## Can lighting stay closed?

Yes. No finding rises above minor, every clue is readable, reload holds in all three phases, and there is no dead config. F1 and F2 are worthwhile polish. F3 is a doc fix. F4 guards against a future dressing change. None of them needs a new review cycle, and the POV-background stage (D17) can go ahead on the lighting as it stands. If F1's `offAfter` is applied, re-run one named tour and one live walk through the server hallway to confirm the strike and the variant override.
