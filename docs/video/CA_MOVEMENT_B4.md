# CA trailers batch B4 (ca18, ca11, ca16, ca17): movement opportunities (25 Nov)

Desk survey, same method as `CA_MOVEMENT_B3.md`. Nothing was run (machine reserved): positions come from the scenario tiles (tile = 32 px) and the existing take notes, so every trip length below is an estimate that the take script checks at run time (it throws under 120 px). All four scripts are **not yet dry-run**. Helper: `tools/video/takes/lib/camlib.mjs` (`followNpc`, `triggerNeed`, `waitNpcMoved`, `followPlayer`). Rules kept: trip of at least 120 px; post is the NPC's settled start point; trip forced with `triggerNeed` at take start; `setup()` refuses a wrong entry state; nothing is clicked in the room and the kiosk is never opened.

## What already moves, per episode

| ep | who | what | trigger and timing | notes |
|---|---|---|---|---|
| ca18 (credential attacks at scale) | Delphine (`kit_delphine_arvanitis`) | rest trip to the sofa (`kit_sofa`, 8 s use) | automatic: rest 20/min from 60, urgentAt 50, so about 30 s after load | `kit_ca18_out` suspends her needs and sends her to tile (4.5,4.5), her own post, so she is back at post for the Lorna shot. The sofa has no `position` in the scenario (engine places it), so the sofa location is unknown until a run |
| ca18 | Lorna (`kit_lorna_easton`) | none | at her PC (3.9,6.0), rest 0.01/min never fires | her bark L1 is the end shot, she does not walk |
| ca18 | Ama | none | static (5.5,3.8) | host |
| ca11 (misdirected data) | Yusuf (`kit_yusuf_demir`) | thirst trip to the water cooler (`kit_cooler`, tile 8.2,5.6, 20 s use) | automatic about 30 s after load (thirst 30/min from 65); t01 already notes it | scripted walk after Look up: post (3,7) to the copier tray (3.5,3.7), then (5,4.2); that is the existing `office` shot (t07_printout_beat) |
| ca11 | Tomasz | none | static host (5.5,3.8) | |
| ca16 (insider risk) | Darren (`kit_darren_price`) | thirst trip to the water cooler (8.2,5.6) | automatic about 30 s after load (thirst 30/min from 65); chatter "Just grabbing some water." if `kit_quiet` is false | `kit_ca16_out` suspends his needs |
| ca16 | Niamh (`kit_niamh_doherty`) | scripted walk to the player after Look up | existing `niamh_end` shot (t07_niamh_ask) | rest and another need at 0.01/min never fire |
| ca17 (acceptable use, defend only) | Chidi (`kit_chidi_okeke`) | thirst trip to the drinks machine (`kit_vending`, stands about (237,225)) | automatic, measured in t06: leaves desk 15.8 s, at machine 18.6 s, leaves 38.5 s (thirst 30/min from 60) | the existing `room_end` shot (t06_room_end) is this walk with a fixed camera |
| ca17 | Fatima (`kit_fatima_begum`) | same trip, joins at about 31 s | thirst 30/min from 65 | one pair-chat line, muted in t06 |
| ca17 | Nilesh | none | no needs or chatter pool | |

## Candidates

| course | NPC | route | start post (needsHome) | target | trip estimate | serves | entry state |
|---|---|---|---|---|---|---|---|
| ca18 | Delphine Arvanitis | desk spot to the sofa and back | tile (4.5,4.5) = about (144,144) | `kit_sofa` (position unknown, engine-placed) | **unknown**: 60 to 200 px guess; the take throws under 120 px | no slot in the script; a 3 to 4 s office insert before `lorna_end` (v10 "Then, at Lorna's desk.") so the room is seen alive before the Look up panel | fresh game, `kit_quiet=true`, `kit_ca18_out` not set |
| ca11 | Yusuf Demir | desk (3,7) to the water cooler and back | about (96,224) | cooler use point about (262,219) | about 166 px | office insert before or beside `panel` (v9 "Then Yusuf finds something at the copier"): shows Yusuf as a worker moving about before the printout beat; the printout beat itself already has his walk to the tray | fresh game, `kit_defend_done=true`, `kit_ca11_out` not set |
| ca16 | Darren Price | desk (2.5,7) to the water cooler and back | about (80,224) | cooler use point about (262,219) | about 182 px | insert before `look_up` (v11 "Then Niamh asks you something."), or the opening seconds of `topic` as an alive-office cutaway | fresh game, `kit_quiet=true`, `kit_ca16_out` not set |
| ca17 | Chidi Okeke | desk (3,6) to the drinks machine and back | about (96,192) | `kit_vending` about (237,225) | about 145 px (t06 timing: 2.8 s walk at speed 90 implies roughly 250 px of path) | `room_end` (v9 "Out in the depot, Chidi's back."): the same walk as t06 with the camera following Chidi, timing forced | fresh game, `kit_quiet=true` |

Notes per course:

- ca18: Delphine is the only walker. Her trip is also fine as the hook-adjacent room wide, but the scout's spare ambience line for her is the world chatter "Phone's not stopped ringing.", which is gated on `kit_quiet` false; the take seeds it true and is silent. The decisive unknown is the sofa position: if the first run measures under 120 px the take fails by design, and the fix is a scenario change (a `position` for `kit_sofa` far from (4.5,4.5)), which is a proposal only.
- ca11: record before any Look up (the press sets `kit_ca11_out`, which suspends his needs and sends him to the copier at about (3.5,3.7), 3 tiles from his desk). The natural trip fires about 30 s after load, so a take started late may find him already gone: the script refuses if his settled start is not near home.
- ca16: same pattern as ca11. Darren's cooler is the same machine Niamh's PC scene never uses, so there is no clash with the `niamh_end` walk.
- ca17: t06 already proved the walk and the timing; t07 adds the follow camera and forces the start. Fatima's join at about 31 s is outside the 6 to 7 s the edit needs, so her presence is not a hazard. kit_quiet is seeded true here (t06 left it unset and muted the bark by hand), so nothing needs muting.

## Proposed scenario changes (not made)

1. ca18: give `kit_sofa` an explicit `position` at least 4 tiles from Delphine's post if the first dry run shows a trip under 120 px.
2. ca18: Lorna's rest decay 0.01 to about 6/min would make her visit the sofa too, but her PC is the end-shot set piece (`kit_ca18_pc`, `kit_ca18_out` mappings), so the beat gate needs an office-life review first; not proposed for the trailer.

## Dry-run order (when the machine is free)

One take per run, fresh game each time: ca17 t07 (closest to a proven walk), ca11 t08, ca16 t08, ca18 t06 (the unknown sofa). A failed minimum-trip check is a useful result, not a script bug.
