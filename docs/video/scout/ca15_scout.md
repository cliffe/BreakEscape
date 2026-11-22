# ca15 Shadow IT: trailer scout (PARTIAL, 22 Nov 2026)

Consequence-first pilot (40 s form). Scouted headless on a keyless server, port 3448, games 12123 and 12124 plus later fresh ones (made with `tools/playtest/new-game.sh`). Nothing recorded, no avatar change, no repo file changed apart from the docs. **Not finished:** the inbox triage (S6), the step-away and the stick room beat (S7, S8) were not driven. See `CA_SCOUT2_HANDOVER` notes at the end.

## Why ca15 (and not ca03)

The outline's order of work (section 9) schedules the consequence-first pilot ca15 straight after ca12, then company batches starting with QI (ca03, ca05, ca08, ca10). ca03 would repeat ca12's call-with-influence-meter set piece, so the second episode is chosen for difference, not order (see the ca01 note in the handover).

## Headline

- Strip is **five steps**: Brief, Choices, Where it led, Defend, Debrief (Tarrowby blue tab). It differs from ca12 (six steps).
- Lines: the cache folder `tts_cache/ca15_shadow_it/` has 65 clips (130 files). Live test on :3448: **51 of 65 returned 200**, control line refused 403. The 14 non-200 are lines of other Tarrowby episodes (ca02, ca06, ca09, ca20 reactions, 503, no clip in this game's scope) plus three `fatima_begum` (no kit_ prefix) ids that are 404 (wrong npc id for this game, not a gap).
- **Best end line:** Fatima, "No name on it, nothing. What do you reckon I do with it?" (3.98 s, 200). Bark before it: "Hang on, someone's dropped a memory stick over here." (3.22 s, 200).
- **Best hook candidates (ambient, 200):** Chidi "Depot's heaving today." (2.18 s), "Fleet's all out today." (2.02 s), Nilesh "Start at the kiosk. Play out the Friday, then sort what's actually waiting." (5.38 s), Nilesh "Nobody's in trouble for a workaround." (2.57 s, tone line, not a grade).
- No uncached line is needed for the 40 s cut with the above. Uncached for ca15 in its own scope: none found among the 65 sidecars; the kit's `ca15` branch lines (Fatima "Good call on that stick...", "Someone found a USB stick...") exist in the cache but sit behind `kit_key_caught` (a verdict) and are kept off.

## Set pieces (browser-verified unless marked)

| # | Set piece | Entry state | Result |
|---|---|---|---|
| S1 | Ambient depot room | fresh game, Skip tutorial, close Brief, `--hide-hud --zoom-step 1` | seen (Fatima and Chidi seated at the table, vending machine, TARROWBY LOGISTICS sign). Not shot-checked for bubbles |
| S2 | Kiosk Brief | `__test.interact('training_kiosk')` (first try worked) | confirmed, `s2_kiosk_brief.png` (blue TARROWBY tab, five-step strip, Start) |
| S3 | Choices (the everyday choices, 4 beats) | Start, button `Make the choices` | confirmed, `s3_choice_card.png`. Navy window, one card per beat, two radio-style options, **no marks before Next**. Options are clicked as elements (not buttons): `H.pressEl(page, /^Plug the visitor/)`. `Next choice`, last is `See where they led`. Safe to show: the beat text and options. |
| S4 | Six months later (the reveal) | after S3 | confirmed, `s4_six_months_later.png`. **Spoiler hazard:** each card carries "Your call" (amber) or "Your call: the safe route" (green), which is the verdict, and the safe-route text names the unsafe version. Hide every "Your call..." label and neutralise the green/amber left borders; show the consequence line of one card (the surveyor's stick, the pack in the personal inbox) |
| S5 | Swap Shop (sort drill, 4 cards, 4 bins) | after S4 `Continue`, button `Open the Swap Shop`, `Start` | confirmed, `s5_swap_shop_card1.png`: card text plus four bins, nothing marked. **The reason shows straight after a pick** ("That's the one..."): stop before the first pick. After the 4 cards: "You sorted 4 cards; 1 went to the suggested place" (a score line) is off |
| S6 | Inbox triage (6 messages, Trust/Report/Delete/Verify) | after S5 `Done`, `Continue`, `Open the inbox`, `Start` | reached the brief screen (4-verb legend, "You'll get feedback after each message"); the six-row list was **not driven** |
| S7 | Step-away panel and room beat (Fatima's stick) | not driven | expected from the scenario: `kit_ca15_out` bark at ~"Hang on...", ask with the three-way choice (hand in, lost property, leave), 45 s default `leave`; the choice menu is an outcome menu: cut before it |
| S8 | Debrief | not driven | off (verdicts) |

`--set` shortcuts: **not tested** for ca15. The ca12 recipe (episode state JSON plus `episode_e15_shadow_it_defend_complete`, `kit_defend_done`, `kit_attack_done`) is the thing to try first. Note: a game that has been through the kiosk saves its stage, so re-running a driver on the same game id opens at the saved step. Make a new game per run.

Minigame types: episode runner (kiosk), choice run, consequence reveal, Swap Shop sort drill, inbox triage, step-away. No locks, keypads, call meter, OSINT browser or VM.

## Spoiler judgements

- Show: S3 card before Next, S4 consequence text with labels hidden, S5 card 1 before any pick, S6 list before any verdict, the Fatima bark and ask line.
- Off: "Your call" labels, any green or amber verdict border, the Swap Shop reason panel and score line, the triage after-verdict panel, "Only the inbox is scored" is fine.
- Pattern level: the lure here is a found or offered stick and shortcut messages (no lifted template risk).
- Hazard: the S3/S5 windows are navy SAFETYNET-style chrome (as in ca12); frame as footage.

## Avatar window

None needed. Player `female_office_worker_v2` is already the scenario's avatar (no hooded hacker). Only a walking shot (S1 or the stick beat) shows the player.

## Not verified

S1 bubbles, S6 list, S7, S8, `--set` shortcuts, ca01 (not scouted at all).
