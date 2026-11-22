# ca15 Shadow IT: trailer scout (PARTIAL, 22 Nov 2026)

Consequence-first pilot (40 s form). Scouted headless on a keyless server, port 3448, games 12123 and 12124 plus later fresh ones (made with `tools/playtest/new-game.sh`). Nothing recorded, no avatar change, no repo file changed apart from the docs. Finished 23 Nov: S6, S7 and the `--set` shortcuts are verified; S1 depot bubbles are not; S8 (debrief) is deliberately not used.

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
| S6 | Inbox triage (6 messages, Trust/Report/Delete/Verify) | `--set` state `done` brief/mistake/flip (see below) opens the kiosk on the Swap Shop panel; then Swap Shop (4 picks), `Done`, `Open the inbox`, `Start` | **verified (23 Nov, :3448).** List shows six unread rows: Tarrowby Reception 13:20 "A padded envelope came in for you, marked from the client"; Chuckbox 11:48 "Too big for email? Upload it here, free"; Benmoor Packaging 09:30 "Great to meet you at the Expo, here's our catalogue on a USB"; PDFmangle Free 10:05 "Edit any PDF free, everyone's using it"; Tarrowby File Share 14:10 "Shauna Lofthouse shared 'Monday pack, final' with you"; Nilesh Solanki 11:15 "The approved PDF editor is on the software portal". Header "0 of 6 sorted" and a green badge "Risky shortcuts stopped for the team: 0" (neutral at 0, hide it anyway). Right pane "Select a message to read it." **No verdict, mark or tell is shown before a pick.** Clicking a row (`.mail-row`) opens the message with the four verb buttons and still no verdict (row 1, the stick, reads well). Stop before pressing a verb: the after-verdict panel is off |
| S7 | Step-away panel and room beat (Fatima's stick) | `--set` list below; open kiosk, panel shows `Look up` / `Carry on` | **verified (23 Nov, :3448, game 12129).** Panel text: "Before the debrief. Look up from the kiosk and carry on in the room for a minute. Someone may ask you something. Your place is saved." Timings after pressing `Look up` (t=0): bark "Hang on, someone's dropped a memory stick over here." bubble starts **1.7 s**; the stick appears on the floor at Fatima's feet (left of the table) and she walks to it; end line bubble "No name on it, nothing. What do you reckon I do with it?" starts **7.4 s** and is still up at 8.0 s; an amber "!" ask cue sits over her head from about 16 s (until a choice). The choice menu does NOT open on its own: it needs the player to talk to her. Left alone, the default `leave` fires at about **53 to 56 s** (45 s after the ask), then Chidi walks over and says "Whose is this, then? I'll take it to Nilesh." (starts **57 s**), Nilesh answers "Ta, Chidi. That's sat on the floor all afternoon. Anyone could've pocketed it first." (starts **62 s**, ends about 66 s). Those last two are a consequence, off. Bubble end times were logged without timestamps, so only starts are timed; the end line bubble lasts under 9 s |
| S8 | Debrief | entry: stage 5 after the step-away panel (`Carry on` or after the room beat) | **not driven by design.** Spoiler-only (verdicts); avoid it |

`--set` shortcuts: **verified in a real browser (23 Nov, :3448).** The ca12 pattern works for ca15 with these ids: for the step-away, `--set 'episode_e15_shadow_it_state={"done":["brief","mistake","flip","defend"]}' --set episode_e15_shadow_it_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e15_shadow_it_defend_percent=60` (the kiosk then opens straight on the step-away panel). Keep `_defend_percent` under 85: 85 and over sets `kit_caught` (a verdict flag the ambient lines read). `--set 'episode_e15_shadow_it_state={"done":["brief","mistake","flip"]}'` alone opens the kiosk on the Swap Shop panel (Open the Swap Shop). The stage ids are `brief`, `mistake`, `flip`, `defend`, `debrief` (the strip labels are Brief, Choices, Where it led, Defend, Debrief). Note: `kit_quiet` is false at start with `--set` (events do not fire on a `--set`), yet the Fatima bark still fired, so no extra flag is needed. A game that has been through the kiosk saves its stage, so make a new game per run.

Depot bubbles (S1): **NOT verified.** Chidi's chatter pool is "Fleet's all out today." / "Parched after that yard run."; the scenario-level pool has "Depot's heaving today." Both need `kit_quiet` false and a 5-minute cooldown. A 240 s hold of a fresh game showed no bubble, and forcing one with `npcNeedsSystem.world.speak('kit_chidi_okeke', ...)` did nothing (Chidi and Fatima start seated at the table). Do not plan the hook around a Chidi bubble: use the depot wide with no line, or the Fatima bark. Hazard: both lines are random if ever caught.

Minigame types: episode runner (kiosk), choice run, consequence reveal, Swap Shop sort drill, inbox triage, step-away. No locks, keypads, call meter, OSINT browser or VM.

## Spoiler judgements

- Show: S3 card before Next, S4 consequence text with labels hidden, S5 card 1 before any pick, S6 list before any verdict, the Fatima bark and ask line.
- Off: "Your call" labels, any green or amber verdict border, the Swap Shop reason panel and score line, the triage after-verdict panel, "Only the inbox is scored" is fine.
- Pattern level: the lure here is a found or offered stick and shortcut messages (no lifted template risk).
- Hazard: the S3/S5 windows are navy SAFETYNET-style chrome (as in ca12); frame as footage.

## Avatar window

None needed. Player `female_office_worker_v2` is already the scenario's avatar (no hooded hacker). Only a walking shot (S1 or the stick beat) shows the player.

## CSS hides and hazards for the takes

- Six months later (S4): hide every "Your call" and "Your call: the safe route" label; neutralise the amber and green left borders of the cards (set `border-left-color` to one neutral navy); keep one consequence line.
- Swap Shop (S5): stop before the first pick (the reason shows straight after one); hide the score line "You sorted 4 cards; 1 went to the suggested place".
- Inbox (S6): hide the green badge "Risky shortcuts stopped for the team: N" and the tick on step 1 if the frame is tight; never press a verb.
- Step-away room: the amber "!" ask cue is a cue, fine; cut before the player talks to Fatima (the choice menu). Cut the take before about 53 s (Chidi, Nilesh consequence).
- Avatar hazard: in this headless run the player in the depot was the hooded black-hoodie sprite, not `female_office_worker_v2` as noted above. Check the avatar for the take run (not changed here).
- Port 3448 server stopped at the end of the scout.

## Not verified

S1 bubbles (Chidi chatter), S8 debrief (avoid).
