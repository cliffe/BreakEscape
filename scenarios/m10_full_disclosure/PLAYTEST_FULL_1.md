# m10 Full Disclosure: full-route playtest 1 (cold start to ARREST)

Browser run, 2026-10-22, keyless :3001, headless Chromium, Node 24. Game 3304, created with `new-game.rb m10_full_disclosure --imports=none` (no head start options at all). Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10_full/session.jsonl` (1745 commands). Scratch, transcripts and screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10_full/` (call it `$S`). `verify-run.rb 3304`: "progress recorded, 7 rooms beyond the first, 4 flags submitted", 25 tasks completed.

Counts: 0 blockers, 0 majors, 7 minors, 2 notes.

Head-start tool: not needed. The four flag stations accept the scenario's own fallback values (`flag{m10_monitoring_foothold}`, `flag{m10_staging_schedule}`, `flag{m10_container_escape}`, `flag{m10_core_host}`) with no VM, so every flag went in at its real terminal and fired its real events. Only the "Flag accepted / Event triggered" path was exercised, not a VM.

## Route played

Briefing (no bootstrap, driven by hand), table scene (brought Nightshade up), gate console, flag 1 at the gate terminal, blast tunnel, security office (Kowalczyk, Quintero, door log), duty handset (Ghost: "Sell it"), stair, workshop (Imran: "Go home. Keep your phone."; casualty sheet, margin, bench log read), power room (Wendell told, shutter cut), server hall (hall guard waved past, Asante, field console, flag 2, flag 3, release console controls: "Kill Zero Day's"), gallery (Vos: "No."; Fonoti not engaged), outer lock by the PIN cracker (6083, solved from the lights), core (Tesseract's arrival, flag 4, three exchanges, "Stop it", coordinated disclosure, "You're under arrest", "Hold fire"), 06:00 scene (Quintero, Kowalczyk, Wendell, Netherton), card, credits, close button. One reload in the server hall (see m-1).

## Earned-secrets table

| Secret | Value | In-game source | Earned? |
|---|---|---|---|
| Flags 1 to 4 | the four `flag{m10_*}` values above | none in-game (VM-sourced; typed from the scenario file) | Exercised, not earned |
| Outer lock PIN | 6083 | PIN cracker lights (counts only), 7 guesses | Earned by the cracker; the door log's "shift code" line was read first |
| Power room door | none | Imran's "Power room's open" after "Go home" | Earned by conversation |

## Checks asked for

| Check | Result |
|---|---|
| New portraits show | PASS. Netherton, Imran, Tesseract and HaX person-chat busts all render (`$S/01_briefing.png`, `08_imran.png`, `19_tess_arrive.png`, `20_hax_quietly.png`). HaX and the phone avatars render too (`14_flags23.png`). Backgrounds are plain black on every person-chat cutscene (known: validator's "no background" warnings), see n-1. |
| "IN THIS OPERATION" matches the run | PASS, 14 of 14 lines (list below). One adjacent contradiction, m-2. |
| Lines read true | Mostly. m-2 to m-5. |
| Always know what to do next | PASS on the route. HaX texts and toasts named the next step every time. Gap after a reload, m-1. |
| Nothing overlaps | One card overlap, m-6. Objectives panel and toasts stack cleanly (`02_post.png`, `07_workshop.png`). |
| Reload once mid-run | Done in the server hall with flags 1 and the cut in. Progress and tasks kept, no scene replayed, no stray call. m-1. |
| Lighting oddities (not chased) | None worth noting. Rooms lit and readable (security office, workshop, power room, hall, core). Gallery dark with a green sight cone, as intended. |

Credits as played (`$S/credits_raw.txt`, 35 labels, MISSION COMPLETE and FULL DISCLOSURE once each). Card: "Dr Adrian Tesseract: in a cell, awaiting trial. / The database: with the vendors. Forty have answered. The fixes are ninety days out. / Someone's buyers have it. Not Zero Day's. / One cell broken: Jennifer Walsh's people. / In Billings, a girl turns nine on Saturday. Her father is bringing a telescope."

- Netherton "Signed for all of it": coordinated disclosure, yes.
- HaX "Killed his feed in time. Testifying.": matches "Feed's dead" and her van line.
- Nightshade "Said 'Manual.' and turned the crank.": his phone line at the breach; I brought him up.
- Quintero "Took a shoulder wound at the core.": "Shoulder. Leave it." yes.
- Kowalczyk "Came through the service door for the key. Stopped. Never accused.": yes. Her 06:00 line "When did you know?" fits my "Not till you came through his door".
- Malhotra "Ran comms all night. His badge didn't.": matches the door log and HaX's "Malhotra was on with me".
- Arakawa "Held the blast door all night beside Nightshade.": matches the tether choice.
- Ghost "Sold in plain view. The share went out.": I chose "Sell it" and killed Zero Day's feed, so the resale went. OK.
- Imran "Went home. So did a friend.": matches "Go home" and his friend on the gallery shift.
- Wendell "Rang his mate Dale. Dale stayed home.": matches the told branch and his 06:00 "Dale stayed home".
- Asante "Arrested at the release console she wrote.", Vos "Named. Arrested on the walkway, waiting for a delivery." (I refused his deal), Fonoti "Swept up at six": plausible; I did not meet Fonoti, so nothing to check against.
- Tesseract "Held out his wrists before anyone asked.": yes.
- Elsewhere "Three water utilities: on manual till spring": matches Netherton and HaX at 06:00.
- Kowalczyk, 'WREN': "Badge cancelled at six.": consistent with Quintero pinning her.

## Findings

### Blockers

None.

### Majors

None.

### Minors

**m-1. A reload puts the player back at the forward post.** Steps: after flags 1 and the shutter cut, standing in the server hall, `sync`, `location.reload()`, Resume, press Enter at "Full Disclosure / Continue?". The player spawns at the forward post (160,144), the Mission Brief note opens again, and the objective list still reads "Take the staging schedule..." with no pointer back down. All doors stay open and no scene replays, so the walk back is five `enter` calls, but a real player gets five rooms of backtracking and no hint that they are in the wrong place. (Could be engine-wide start-room spawn; I did not compare with another mission.) Shots: `$S/12_after_reload.png`, `$S/13_post_after_reload.png`.

**m-2. Zero Day reads as unaffected after I killed its share.** Steps: release console controls, "Kill Zero Day's." (HaX: "Zero Day's share is dead. Nobody follows it now."). Then Vos at the gallery: "Then find another way through. I will wait for my delivery." Credits: "Zero Day: still trading. Its broker, Pieter Vos, named." Netherton at 06:00: "Zero Day got nothing." The credit reads against Netherton's line, and Vos waits for a delivery that no longer exists. Suggest a killed-share arm for both, or "still trading, minus one delivery".

**m-3. "There's a third way." gets a reply about wiping.** `m10_tesseract.ink:884-887`: both options ("And if I wipe both copies?" and "There's a third way.") fall through to the same HaX line, "If both copies die, this room purges itself." The player says there is a third way and is answered about the wipe. Two choices, one outcome. Transcript: `$S/tess_flag4.txt`.

**m-4. Imran's reply presupposes a sheet the player has not read.** Imran: "Read what's pinned over my bench. Then tell me which side's worse." The only option is "Whatever that sheet says, it's people. You'd be building it." The player is stepping past the sheet they were just told to read. Minor; the HaX toast "That's his sheet. Read it." arrives after. Shot: `$S/08_imran.png`.

**m-5. HaX's Ghost line lands before the call and is awkward.** Entering the security office pops the toast "Ghost leaves when Ghost has been paid. Make it not worth it." about 30 s before the duty handset rings, and it repeats in her text thread after the call. The player has not heard of a Ghost yet. The phrasing ("Ghost ... Ghost") also trips. Shot: `$S/04_security.png`.

**m-6. The card's lines overlap the visualiser's side panels.** On the card (`$S/23_after_closing.png`) the longer lines ("The database: ...", "In Billings, a girl ...") run past the central map into the left COMMS INTEL and right panels, over their text, and "out." wraps onto a line by itself.

**m-7. The flag station lists flags from other stations.** At the release console, SUBMITTED FLAGS shows flag 1 (submitted at the gate terminal). Probably engine-wide, and harmless, but a player may read it as "already done here".

### Notes (not findings)

- **n-1.** All person-chat cutscenes here have a black background. Known from the validator; the portraits themselves look right.
- **n-2.** `*pause*` and `*quietly*` appear raw in the harness transcript (Wendell, HaX). They are the TTS style cue used across missions; the one on-screen line I captured (`$S/20_hax_quietly.png`) was not one of them, so I did not check whether the display strips them.

## Not covered

Other endings, the whodunit routes (WREN was never investigated; the WREN beat at the core ran by itself and the objective "Name the sleeper, or decide not to" showed ticked), Fonoti, Victoria and the cloner routes, Nightshade and Arakawa face to face, any import-driven arm (run used `--imports=none`, so the default arms played), audio.
