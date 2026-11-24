# m08 The Mole video log

## 24 Nov 2026: 60 s trailer edit v1 (`tools/video/edits/m08_trailer60.json`, id `m08_trailer60_v1`)

Not rendered. Lint with `BE_CLIPS_DIR=$HOME/video-takes-local/m08/clips ... --takes-dir $HOME/video-takes-local/m08/takes`: 0 errors, 1 expected warning (console clip without `placeholder: true`), 31 shots, 60.00 s. Built from a generator in the scratchpad (`edit-m08/build.py`, m07's shape). Snap false throughout. 16:9 has no burned captions; 9:16 and 1:1 caption every dialogue shot.

### Shot list
| t (s) | shot | source |
|---|---|---|
| 0-6 | open preset | |
| 6.0 | hook, ATHENA "The leak came from inside this building." (UI-free) | t10 6.25-9.85 |
| 9.6 | card Mission 8 / The Mole (on the 9.6 lift) | |
| 11.1 | lobby, player at ATHENA's hologram (2x, inside the room) | t11 3.0-4.0 |
| 12.1 | stakes, ATHENA "Director Netherton has three names, and one of them got two of your colleagues killed." (UI-free) | t10 10.25-15.42 |
| 17.27 | card Interview / Suspects (17.6 lift) | |
| 18.47 | Nightshade "There you are. I wondered when they'd send you." | t12 31.9-34.7 |
| 21.27 | archives motion lights strike (3.25x on the room) | t16 5.8-6.87 |
| 22.33 | Vector, whole alibi line (starts on the 22.4 lift) | t13 19.3-24.47 |
| 27.5 | Phantom "Accuse me properly, or get out of my way and let one of us catch him." (UI-free) | t14 22.2-25.97 |
| 31.27 | the player's strike on Phantom (3x on the interview room) | t14 28.4-29.4 |
| 32.27 | card Real / Hacking, server-room lights fade up, m08 console clip (nmap -sV, two services), CyberChef ROT13 panes | t24 3.8-5.2, `m08_console_recon_clip.mp4` 0.4-2.2, t23 8.2-9.93 |
| 38.4 | card Before They / Vanish (on the 38.4 lift) | |
| 39.9 | crescendo, 12 shots of 16 down to 12 frames: lockpick, Off-Duty Agent, badge pad, LEVEL RED notice, Julian, key lock, cloner progress, Agnieszka, safe pad, Junior Analyst, Access Granted, STAND DOWN board | t17 t19 t22 t18 t20 t25 t21 |
| 45.3 | ending: Netherton wide (J-cut 1.7 s under the crescendo) "There is a mole in SAFETYNET.", hard cut with a hit in the silence (46.79 music hit) to a 3x face crop: "I am reasonably certain they are within a hundred metres of where you are standing." | t15 62.15-68.85 |
| 52-60 | close preset | |

### Music
SpyAction "Emerald Trigger", window start 0.775 s (a downbeat), 150.01 BPM, bar 1.6 s (analysis `tools/video/edits/music/emerald_trigger_60.json`, committed with m04). Why: the only window with a quiet opening (bar rms 0.04) for the title and hook, a lift at 9.6 for the Mission 8 card, a small lift at 17.6 for the Interview card, a big lift at 22.4 where Vector starts, a lift at 38.4 for the Vanish card, and a hit at 46.79 for the ending's hard cut. Steady to the end with no natural close, so a 2 s fade-out as m07. Used by no other trailer. Alternatives in the edit: window 75.972 (analysis best, loud from the first bar), Hybrid Attack 1 at 0.045, and Noir "Shadowline Protocol", which the owner-questions file named (`TRAILER_PICKS_OWNER_QUESTIONS.md`, m08 question 4) and which was not analysed. Not judged by ear.

### Placeholders and compromises
- No marked placeholders. Real Hacking is the m08 console clip, placeholder false.
- `Be Quiet. / Be Quick.` card dropped, as owner question 3 allowed ("drop first").
- Phantom's "catch him": all three suspects (Vector, Phantom, Nightshade) are male in `scenario.json.erb`, so the pronoun does not narrow the mole. Window and clause kept.
- Crops above 2x where the room or panel is smaller than a 2x window: archives 3.25x/3.05x/3.05x (room about 600x363 px), strike room 3.05x/2.9x/2.9x (640x384), PIN pads 3.25x in 16:9 (pad 600 px wide; 9:16 and 1:1 hold 2x), cloner and reader panels 4.65x/1.95x/2.65x (418x565), lock boxes 2.45x in 16:9 and 1.85x in 9:16 (800x602), server room 2.3x/2.1x/2.1x (stops above the analyst's bark bar). Every window was computed from measured bounds; 16:9 crops of the cloner, reader, badge pad, Julian, archives and strike were viewed at full res. 9:16 and 1:1 crops were derived, not viewed.
- The 16:9 cloner and reader crops show the panel's orange border at the right edge (inside the panel).
- No t27 ops walk (analyst crosses the player) and no t26 phone (the phone panel needs about 5x in 16:9).
- Strike and gameplay shots are muted; the strike's sound was not heard.
- Netherton's ending close-up is a 3x crop of his conversation portrait. Face flashes come from the line takes (t17, t22).
- Crescendo lengths sum exactly to the slot, so no shot absorbed a frame fix.

### Open questions (recommendation first)
1. Music: Emerald Trigger from 0.775 s, or the owner's earlier Noir "Shadowline Protocol"? Recommend hearing v1 on Emerald Trigger first (every card sits on a measured lift); if Shadowline is preferred, it needs an analysis and the cards re-fitted.
2. Phantom's strike (1.0 s, 3x on a small room): recommend keep, as it is the one action beat between the interviews; drop it first if the crop looks too soft.
3. Card wording `Interview / Suspects` (the outline's mechanic card): recommend keep; `Hunt the / Mole` if you want story words.
4. Crescendo order follows take availability and alternates panels and faces. Recommend re-order after the first render.
