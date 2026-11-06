# m02 60 s trailer: line and shot picks (orchestrator, after the scout)

Source: `docs/video/scout/m02_scout.md` (36 of 36 lines play from the cache). Recipe: `docs/video/recipes/mission-trailer.md`.

## Music

Noir "Steel Shadows in E Minor (Remastered)", 60 s from 50.248 s (a downbeat), 156.01 BPM (beat 0.3846 s, bar 1.538 s). Analysis `tools/video/edits/music/steel_shadows_in_e_minor_remastered_60.json`. The window opens on the track's quiet breakdown (0 to 10.77 s: under the title and HaX's hook), drops at 10.77 s (x2.4 RMS: the lights strike), then lifts every four bars (16.92, 23.08, 29.23, 35.38, 41.54, 47.69, 53.85, 60.0). Picked by analysis, not by ear: a review question. The scout notes m10 uses this track in game as its climax cue; it is in the shared Noir playlist that m02 also plays. Fallbacks: Shadowline Protocol at 82.317 s (124 BPM), Encrypted Shadows at 105.537 s (99 BPM).

## Beat sheet (beats of 0.3846 s; frame = round(beat x 11.538))

| Beats | Time (s) | Shot | Pick |
|---|---|---|---|
| 0 to 16 | 0 to 6.15 | Title | `safetynet-open` preset; HaX J-cuts in under it |
| 16 to 23 | 6.15 to 8.85 | Hook | hax_1 "If they refuse and you're too slow, people die on the ward." (3.94 s) |
| 23 to 27 | 8.85 to 10.38 | Card | Mission 2 / Ransomed Trust |
| 27 to 32 | 10.38 to 12.31 | Drop | `ward_vestibule` lights strike on the 10.77 s drop (0.4 s dark lead-in) |
| 32 to 44 | 12.31 to 16.92 | Montage A | lockpick (`it_filing_cabinet`), ransom screen (`reception_terminal`), HaX phone, keypad (`emergency_storage_safe`, 3 wrong digits), 3 beats each |
| 44 to 48 | 16.92 to 18.46 | Card | Real / Hacking |
| 48 to 53 | 18.46 to 20.38 | Walk to the VM | the SAFETYNET Field Console in `server_room`; out before anything opens |
| 53 to 58 | 20.38 to 22.31 | Real hacking | **placeholder**: m02's own tools (FTP anonymous login, ProFTPD 1.3.3c found, SSH as gary), a terminal recording made for the placeholder. The old trailer has no m02 footage |
| 58 to 60 | 22.31 to 23.08 | Real tool | CyberChef workstation, input pane only |
| 60 to 64 | 23.08 to 24.62 | Card | Uncover / the Mystery |
| 64 to 96 | 24.62 to 36.92 | NPCs | Val "So. Who are you and who says you're allowed?" (4.18 s); Sister Doyle "The machines still run. Nobody's watching them." (3.70 s); Mr Pryce "Forty years I fixed buses." (3.41 s) |
| 96 to 100 | 36.92 to 38.46 | Card | Choices with / Consequences (dissolve) |
| 100 to 108 | 38.46 to 41.54 | Montage B | walk up to Val ("Alright. Stop there a sec." optional), ward walk to the east door knocking the swivel chair, beside Sister Doyle |
| 108 to 112 | 41.54 to 43.08 | Card | Before the / Ward Goes Dark |
| 112 to 118 | 43.08 to 45.38 | Crescendo | ten cuts, 69 frames (15, 15, 7, 7, 7, 7, 3, 3, 3, 2): lockpick, keypad, ransom screen, RFID tap, backup-recovery console, CyberChef (crop), phone, supply cabinet, password screen (crop off the post-it), flag station |
| 118 to 136 | 45.38 to 52.31 | Antagonist | Graham Reeves, "So you did the work." with what follows (**the user's say-so: he is the mystery's answer**; fallback to be offered) |
| 136 to 156 | 52.31 to 60.0 | CTA | `hacktivity-close` preset, 7.69 s |

## Left out

- Gary's password screen uncropped (post-it with login hints), Gary's SSH notes, the reception plaque (the safe code year), the Ghost phone and press terminal (the ransom decision), the ROT note's output, the IT cabinet's contents, the Reeves ambush, the closing debrief.
- The VM launcher screen: needs a SecGen VM.
- The security-office lock (Val catches the pick).
- hax_6 and hax_7 (they hint at the inside route).
