# The Keyholder Trials: art needed

Nothing here has been generated. Per the brief and the user's standing rule, images are made one at a time with the user's go-ahead, PixelLab first, at target size (never downscaled). Until then the scenario uses the placeholders listed. Priorities: **P1** = the game looks wrong without it; **P2** = noticeably better with it; **P3** = nice to have.

## Characters

Real academics appear with the user's approval (brief). Their likenesses still need the user's sign-off before any portrait is made.

| Character | Needed | Placeholder | Priority | Notes |
|---|---|---|---|---|
| Dr Z. Cliffe Schreuders | 8-direction walk sheet (v2, six standard animations), talk portrait, viseme sheet, headshot | `male_nerd_v2` (+ its talk/visemes/headshot) | P1 | Workshop look: sleeves up, a soldering iron or a laptop. Ask the user for a reference photo and how he wants to look. |
| Dr Tom Shaw | same set | `male_office_worker_v2` | P1 | Approachable lecturer, lanyard. Reference photo from the user. |
| Dr Sidhu Selvarajan | same set | `male_scientist_v2` | P1 | Office academic, smart casual. Reference photo from the user. |
| Jordan Pike | **done (user, 2026-10-06): reuse `male_hacker_hood_down_v2`** (walk, talk, visemes, headshot) | - | - | No new art. |
| Megan Oyelaran | **done (user, 2026-10-06): reuse `female_hacker_hood_down_v2`** (walk, talk, visemes, headshot) | - | - | No new art. Same outfit family as the player (`female_hacker_hood_v2`, hood up). |
| Agent HaX | none | `female_spy_v2` (m01/m02) | - | Reuse. |
| Ghost | none | `male_hacker_hood_talk.png`, `assets/npc/avatars/npc_hacker.png` (m02) | - | Reuse, so returning players recognise the hood. |

Portrait facing: all character art faces one way; the engine flips per speaker (user memory, "Portrait facing convention").

## Objects

| Object | Needed | Placeholder | Priority | Notes |
|---|---|---|---|---|
| Byte Wall | Wall-mounted 1970s computer front panel with a row of eight lamps and toggle switches | `alarm_panel` | P2 | The `alarm_panel` minigame draws the lamps, so only the room sprite changes. |
| Punched paper tape | A strip of paper tape in a display case | `notes2` | P3 | |
| Keyholder device | A small matte-black handheld terminal, CryptoSecure logo | `phone` | P2 | Shown in inventory and the phone UI frame. |
| CryptoSecure stand | Pop-up banner and table | `picture1` + the reception desk | P3 | |
| Pigeonholes | | `pigeonholes1` exists | - | Already in the assets. |
| Ledger whiteboard | | `whiteboard1` exists | - | Already in the assets. |
| Cliffe's build screen | | `smartscreen` exists | - | Already in the assets; the content is described in text. Since the room-dressing pass it takes the map's `smartscreen` slot with the `info_screen1` texture. |
| Heritage display case | Low glass-topped display cabinet, about 78x40, for the paper tape and the ASCII handouts | `desk1` as a scenario table (room-dressing pass) | P3 | Would replace the plain desk in the foyer. Needs to be a table-type sprite so it gets a collision box. |
| CryptoSecure drop box | Small branded steel post box with a slot, floor-standing, about 24x28 | `briefcase11` (map slot) | P3 | The same briefcase is also the lockbox in the foyer, so the two read alike. |
| Trial V poster | A3 recruitment poster with a block of Base64 on it, wall-mounted, about 16x22 | `notes6` | P3 | Pinned on the corridor's back wall. |
| Library returns trolley | Book trolley with a few returned books, about 32x30 | the returned book and slip sit on top of a front-row bookcase | P3 | Would make the "returns shelf" in the slip's text literal. |
| Lab and library lamp stands | (map change, not new art) | `lamp-stand3`/`lamp-stand4` in `room_lab` and `room_library_1x2gu` | P3 | Garden-style lamp posts in a teaching lab and a library. Removing them is a map edit in shared room types, so it was left out of a scenario-only pass. |

## Exhibit (optional, needs approval)

| Item | What | How it would be made | Placeholder | Priority |
|---|---|---|---|---|
| ECB vs CBC logo | Two small images side by side: the CryptoSecure logo with its raw pixels encrypted in AES-ECB (outline still visible) and in AES-CBC (noise). For the workshop, "LockStock v1, the version that got caught". | Not an image generator: a short script encrypts the pixel bytes of a flat logo block by block with a fixed key and leaves the header alone. Needs a flat source logo first (which would itself be new art). | `chart` with a text description | P3 |

## Backgrounds

Done (backgrounds round, commit 8926df10): the briefing and the normal debrief use `hq4.png` (the field HQ); the sent-ending debrief uses `hq5.png` (the fallback site); the campus transition at the end of the briefing uses `miskatonic_campus.png`. This lab uses none of hq1-hq3, which belong to other missions. Ghost's video call uses the m02 presentation.
