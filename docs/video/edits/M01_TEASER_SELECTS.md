# m01 teaser: selects (orchestrator, stage 3)

Takes: `video_out/m01/takes/<id>.trimmed.mkv`; times are seconds in the trimmed file (markers in `<id>.trimmed.markers.json`). Music: Noir "Midnight Cipher Chase", **window moved to 109.023 s** (was 107.023) so the groove drop lands at 12.0 s of the teaser, on the lights snapping on. The last 2 s run past the track's energy fall at 137 s; keep the 0.9 s fade and check it ends cleanly. 120 BPM, every boundary on a 0.5 s beat.

| # | Teaser time | Shot | Source and in/out | Join in | Framing (16:9) | Audio |
|---|---|---|---|---|---|---|
| 1 | 0.0-2.5 | Logo morph: Hacktivity Cyber Security Labs → Hacktivity Games → BREAK ESCAPE | card | glitch | - | music |
| 2 | 2.5-4.0 | Title screen typing "First Contact" | t01 7.85-9.35 | glitch (out of card) | integer zoom 3 on the typed text (centre of frame) | none (video-only take) |
| 3 | 4.0-8.0 | Agent HaX: "Whatever they're planning, it's active. And it's dangerous." | t02 19.40-23.40 (line 19.60-23.18) | cut | full frame, game's own subtitle bar | voice full, music ducked |
| 4 | 8.0-9.5 | Card "Your Mission / Begins NOW" | card | blur streak | - | music |
| 5 | 9.5-12.5 | Lights snap on: lit reception, door opens, office lights strike | t03 2.63-5.63 (lights-on 5.13 → teaser 12.0, on the drop) | glitch (out of card) | full frame (take is already 3x, HUD hidden) | SFX -6 dB |
| 6 | 12.5-13.5 | Lockpicking, pins setting | t04 9.0-10.0 | cut | integer zoom 3 on the lock panel | SFX -6 dB |
| 7 | 13.5-14.5 | Phone chat with HaX (just after "Got any general advice?") | t05 5.0-6.0 | cut | integer zoom 2 on the phone, upper half | SFX -6 dB |
| 8 | 14.5-15.5 | Keypad, two digits | t06 4.3-5.3 ("19__") | cut | integer zoom 2 or 3 on the keypad | SFX -6 dB |
| 9 | 15.5-16.5 | Lock springs open | t04 13.9-14.9 (lock-open 14.36) | cut | as shot 6 | SFX -6 dB |
| 10 | 16.5-17.5 | Server room, racks glowing | t08 0.5-1.5 | cut | integer zoom 2 on the room | SFX -6 dB |
| 11 | 17.5-18.5 | Drop-site terminal, "flag{" typed | t08 5.6-6.6 | cut | integer zoom 2 on the input field | SFX -6 dB |
| 12 | 18.5-20.0 | Card "And Hold Back / The Entropy!" | card | glitch | - | music |
| 13 | 20.0-27.5 | Derek: "Murder? No. Think of it as... forced education." | t09 18.0-25.5 (line 18.23-25.40) | glitch (out of card) | push-in from full frame to a UI-free close-up on his face, ending around 26.5 | voice full, music ducked |
| 14 | 27.5-30.0 | Card "Play Mission 1 Free!" with "hacktivity.co.uk" | card | glitch | - | music, 0.9 s fade |

Montage shots 6-11 are hard cuts only. Glitch and blur appear only on joins next to a card (lint enforces it).

Dropped, with reasons:
- t07 (IT terminal): visually flat (desktop wallpaper, then a white text log), and the log names Derek three times.
- "Real Hacking" card and the closing logo card: there was no footage that says "real hacking" (no VM here), and two cards 1 s apart read as choppy. The server racks and the flag terminal carry the beat inside the montage. The logo already opens the teaser; the end card names hacktivity.co.uk.

Spoiler check: no code digits (keypad shows 1 and 9, not the real code); no flag value; the phone shot is before the Maya reply; Derek's lines are the antagonist's, as in the existing trailer, with no casualty figures or "Architect" on screen (the take skipped those lines before 18.0 and after 25.5).

Option for the user: t09 also shows "Sixty deaths to save tens of thousands per year. That's not murder. That's optimisation." at about 41.5-43.5 s, the line the existing trailer used, but its audio was skipped in this take. Re-recording t09 to voice it is cheap if the user prefers it to "forced education".
