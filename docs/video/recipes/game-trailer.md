# Recipe: game trailer (SAFETYNET: Licence to Hack, 90 to 120 s)

Priority 2. The whole-game trailer: one beat per mission arc, the recurring cast, the ENTROPY threat. **Build it after several mission trailers exist**, because it reuses their takes and the scout reports (GUIDELINES: "Build after several mission teasers exist; reuse their takes"). House rules in `README.md`.

## Purpose

Show a player what the whole game is: a spy thriller with real hacking, choices that matter, a handler (Agent HaX) and an enemy (ENTROPY), across missions m01 to m08 (m09 and later only if released). One trailer for the game, on its own track.

## Length and aspect ratios

90 to 120 s (aim for 100 s). **16:9** for YouTube, the Hacktivity pages and Steam (Steam's store trailer is the main use). A 30 s and a 15 s social cut come from it later (`mission-teaser.md` shape), 9:16 and 1:1 with burned captions. `.srt` always.

## Beat sheet (draft; there is no edit list yet)

Cards between movements, as the old 1:15 reference trailer and the m01 trailer do. Times assume a 100 s cut on a 120 BPM or similar grid; set them at selects on the chosen track's lifts.

| Time | Dur | Movement | Content |
|---|---|---|---|
| 0 | 8 | Title | Veo opening and the game title. The handler's line J-cuts in under it |
| 8 | 12 | The job | Agent HaX at the briefing, one line; a card such as **Your Mission** is a suggestion here (the user's objection to it was about a trailer for one named mission; confirm on the review page); the first office, the lights strike |
| 20 | 10 | Real Hacking | the real-hacking slot (placeholder until in-game VM capture exists), then real tools from the missions that show them (a lock pick, a keypad, CyberChef, later RFID, fingerprint, network tools) |
| 30 | 30 | One beat per mission | six to eight short beats, 4 to 5 s each: **one signature moment per mission arc**, chosen from each mission's own trailer takes. Each beat is one setting, one tool and one voiced line or a strong silent shot; hard cuts between them, a glitch on the card only |
| 60 | 10 | Choices with Consequences | three NPC lines from different missions, portrait view, with their captions |
| 70 | 10 | The enemy | ENTROPY: a series of threat lines and the antagonists the user allows (no culprit reveals from any mission); a card in the game's own words |
| 80 | 10 | Build to the drop | a fast montage of cuts on the beat across missions (every join a hard cut) |
| 90 | 10 | Call to action | the Veo launch clip, **"Play now"**, the red hex curtain, the Hacktivity Games logo and the URL |

**Beat per mission** means: a different room and tool each time, a variety of NPC faces (the cast is deliberately diverse), cumulative kit shown as it grows (kit is cumulative across missions: lockpick from m01, RFID cloner from m03, fingerprint kit from m04). If a mission has no trailer takes yet, record its signature shot first (a mission trailer pass), not a one-off.

## Must include

- The game's title first; Hacktivity Games sign-off last, on the curtain; "Play now".
- Agent HaX and ENTROPY (the recurring through-line); at least one shot from every released mission, or a stated reason.
- Real hacking: the placeholder slot, marked, until real capture exists.
- A track of the game's own that is **not** a mission track (see the table in `README.md`), mixed to -14 LUFS, true peak under -1 dBTP.

## Must avoid

- "Break Escape" on screen; any mission-specific "Play Mission N".
- Reveals: who the traitors or culprits are, endings, casualty figures, answers, flag values, mission debriefs. Do not carry m01's "naming Derek is fine" over: that was the user's decision for the m01 trailer only. Decide any other character with the user.
- Reusing a mission's music track.
- Re-recording what a mission trailer already has. Reuse takes by id and keep their spoiler notes.
- Gameplay-to-gameplay effects (hard cuts only).

## Inputs

- The mission trailers' scout reports (`docs/video/scout/<mission>_scout.md`), picks, takes tables and takes (`video_out/<mission>/takes/`), kept in the hacktivity-videos export if the local copies are gone.
- A signature-moment list, one per mission, proposed by the orchestrator and approved by the user (a short question on the review page).
- The game's Veo pair, brand art, the music table.
- The user's answers: who is shown, which missions are in.

## Stage skills, in order

1. `video-scout`: only to fill gaps (a mission with no scout yet). Otherwise read the existing reports.
2. `video-takes`: only for missing signature shots, per mission.
3. `video-edit`: selects across missions (the orchestrator, using frames), music analysis for a new track, an edit list built from several missions' takes (the takes folder gap in `README.md` item 1 matters most here: take ids must carry the mission prefix), lint `--final`, render 16:9, then the cut-downs.
4. `video-review`: page with the render and the signature list; export to hacktivity-videos.

Models: Haiku for gathering, Sonnet for takes and the edit, Opus for the signature list, selects and reviews.

## Review questions

1. Verdict: ship, revise or rethink?
2. The signature moment for each mission: right choice? Which would you swap?
3. Which characters may be shown? Which must stay hidden?
4. Is the enemy's moment strong enough, and is it spoiler-free in your eyes?
5. Pace: where does it sag?
6. The track: right for the whole game? (It is not a mission's track.)
7. The real-hacking section: placeholder acceptable, or wait for real VM capture?
8. Anything on screen you would not want a viewer to see?
