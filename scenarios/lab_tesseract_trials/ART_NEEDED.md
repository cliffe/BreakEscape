# The Keyholder Trials: art needed

**Status 2026-10-06:** the room and object art is done (`ROOMS_PLAN.md` Phases 0-4: hand-drawn props and five PixelLab batches, 100 generations; picks in `build_evidence/rooms/pixellab/`). The character art below is still open. Per the brief and the user's standing rule, images are made one at a time with the user's go-ahead, PixelLab first, at target size (never downscaled). Until then the scenario uses the placeholders listed. Priorities: **P1** = the game looks wrong without it; **P2** = noticeably better with it; **P3** = nice to have.

## Characters

Real academics appear with the user's approval (brief). Their likenesses still need the user's sign-off before any portrait is made.

| Character | Needed | Placeholder | Priority | Notes |
|---|---|---|---|---|
| Dr Z. Cliffe Schreuders | 8-direction walk sheet (v2, six standard animations), talk portrait, viseme sheet, headshot | `male_nerd_v2` (+ its talk/visemes/headshot) | P1 | Workshop look: sleeves up, a soldering iron or a laptop. Ask the user for a reference photo and how he wants to look. |
| Dr Tom Shaw | same set | `male_office_worker_v2` | P1 | Approachable lecturer, lanyard. Reference photo from the user. |
| Dr Sidhu Selvarajan | same set | `male_scientist_v2` | P1 | Office academic, smart casual. Reference photo from the user. |
| Dr Oleg Illiashenko | same set (8-direction walk sheet, talk portrait, viseme sheet, headshot); portrait art being made separately | `male_telecom_v2` (+ its talk/visemes/headshot): the only unused male v2 sheet with talk and visemes; the hi-vis jacket is a stopgap, not his look | P1 | Real colleague. Office academic. Reference photo from the user. Swap `spriteSheet`, `spriteTalk`, `spriteVisemes` and `avatar` on `oleg_illiashenko` when the art lands. |
| Jordan Pike | **done (user, 2026-10-06): reuse `male_hacker_hood_down_v2`** (walk, talk, visemes, headshot) | - | - | No new art. |
| Megan Oyelaran | **done (user, 2026-10-06): reuse `female_hacker_hood_down_v2`** (walk, talk, visemes, headshot) | - | - | No new art. Same outfit family as the player (`female_hacker_hood_v2`, hood up). |
| Agent HaX | none | `female_spy_v2` (m01/m02) | - | Reuse. |
| Ghost | none | `male_hacker_hood_talk.png`, `assets/npc/avatars/npc_hacker.png` (m02) | - | Reuse, so returning players recognise the hood. |

Portrait facing: all character art faces one way; the engine flips per speaker (user memory, "Portrait facing convention").

## Objects

All rooms now use the university maps (`room_uni_*`), so the object rows below describe what each map draws.

| Object | Needed | Now | Priority | Notes |
|---|---|---|---|---|
| Byte Wall | Wall-mounted 1970s computer front panel with a row of eight lamps and toggle switches | **done:** `alarm_panel2` (PixelLab P3, lamps hand-set to 01001101) | - | The `alarm_panel` minigame still draws the lamps; only the room sprite changed. |
| Punched paper tape | A strip of paper tape in a display case | `notes2` on the display table, beside a glass case of old tapes (`display_case1`) | P3 | Still the generic notes sprite. |
| Keyholder device | A small matte-black handheld terminal, CryptoSecure logo | `phone` | P2 | **Open.** Shown in inventory and the phone UI frame; not a room sprite. |
| CryptoSecure stand | Pop-up banner and table | **done:** `cryptosecure_banner1` (hand-drawn) beside `desk1` | - | The table stays `desk1`: the lockbox and laptop need its width to sit 32 px apart. |
| Pigeonholes | | `pigeonholes1` | - | |
| Ledger whiteboard | | `whiteboard1`, seminar room | - | |
| Cliffe's build screen | | `smartscreen` slot with the `info_screen1` texture | - | |
| Heritage display case | Glass-topped display cabinet | **done:** `display_case1` (PixelLab P1), beside the display table | - | Decor next to the table rather than replacing it, so the ASCII chart and paper tape stay 32 px apart. |
| CryptoSecure drop box | Branded steel post box with a slot | **done:** `drop_box1` (hand-drawn, wall-mounted, with a keypad) | - | |
| Trial V poster | A3 recruitment poster with Base64 | `notes6`, pinned on the corridor noticeboard | P3 | Still the generic sheet. |
| Library returns trolley | Book trolley with returned books | **done:** `book_trolley1` (PixelLab P0) | - | The slip and book sit on the issue desk; the trolley is decor. |
| Lab and library lamp stands | (map change) | **done:** gone with the new maps | - | |
| University rooms | crest sign, projector screen, lockers, directory, door card, library and Special Collections signs, timetable, six posters, lecture ledges | **done:** hand-drawn (`make_uni_props.py`) | - | |
| Maker space and campus props | lectern, seat rows, sofa, plan chest, display cabinet, pegboard, laser cutter, oscilloscope cart, electronics bench, parts drawers, robot arm, bean bags, stanchions, CNC mill, 3D printer, banker's lamp, journals, Pi cluster, soldering iron | **done:** PixelLab P0-P3 | - | Registered but not placed yet: `scope_cart1`, `robot_arm1`, `stanchions1`, `pi_cluster1`, `soldering_iron1`, `beanbag1` (split into `beanbag_teal1` and `beanbag_orange1`). |

## Exhibit (optional, needs approval)

| Item | What | How it would be made | Placeholder | Priority |
|---|---|---|---|---|
| ECB vs CBC logo | Two small images side by side: the CryptoSecure logo with its raw pixels encrypted in AES-ECB (outline still visible) and in AES-CBC (noise). For the workshop, "LockStock v1, the version that got caught". | Not an image generator: a short script encrypts the pixel bytes of a flat logo block by block with a fixed key and leaves the header alone. Needs a flat source logo first (which would itself be new art). | `chart` with a text description | P3 |

## Backgrounds

Done (backgrounds round, commit 8926df10): the briefing and the normal debrief use `hq4.png` (the field HQ); the sent-ending debrief uses `hq5.png` (the fallback site); the campus transition at the end of the briefing uses `miskatonic_campus.png`. This lab uses none of hq1-hq3, which belong to other missions. Ghost's video call uses the m02 presentation.
