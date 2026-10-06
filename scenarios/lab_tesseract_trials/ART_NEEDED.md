# The Keyholder Trials: art needed

Nothing here has been generated. Per the brief and the user's standing rule, images are made one at a time with the user's go-ahead, PixelLab first, at target size (never downscaled). Until then the scenario uses the placeholders listed. Priorities: **P1** = the game looks wrong without it; **P2** = noticeably better with it; **P3** = nice to have.

## Characters

Real academics appear with the user's approval (brief). Their likenesses still need the user's sign-off before any portrait is made.

| Character | Needed | Placeholder | Priority | Notes |
|---|---|---|---|---|
| Dr Z. Cliffe Schreuders | 8-direction walk sheet (v2, six standard animations), talk portrait, viseme sheet, headshot | `male_nerd_v2` (+ its talk/visemes/headshot) | P1 | Workshop look: sleeves up, a soldering iron or a laptop. Ask the user for a reference photo and how he wants to look. |
| Dr Tom Shaw | same set | `male_office_worker_v2` | P1 | Approachable lecturer, lanyard. Reference photo from the user. |
| Dr Sidhu Selvarajan | same set | `male_scientist_v2` | P1 | Office academic, smart casual. Reference photo from the user. |
| Jordan Pike | same set | `male_telecom_v2` | P2 | Third-year in a branded CryptoSecure fleece. |
| Megan Oyelaran | same set | `female_office_worker_v2` | P2 | First-year, rucksack, tired. |
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
| Cliffe's build screen | | `smartscreen` exists | - | Already in the assets; the content is described in text. |

## Exhibit (optional, needs approval)

| Item | What | How it would be made | Placeholder | Priority |
|---|---|---|---|---|
| ECB vs CBC logo | Two small images side by side: the CryptoSecure logo with its raw pixels encrypted in AES-ECB (outline still visible) and in AES-CBC (noise). For the workshop, "LockStock v1, the version that got caught". | Not an image generator: a short script encrypts the pixel bytes of a flat logo block by block with a fixed key and leaves the header alone. Needs a flat source logo first (which would itself be new art). | `chart` with a text description | P3 |

## Backgrounds

None needed: HaX's briefing and debrief use `assets/backgrounds/hq1.png` as m01 does; Ghost's video call uses the m02 presentation.
