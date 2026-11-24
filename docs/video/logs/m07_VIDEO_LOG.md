# m07 Architect's Gambit video log

## 24 Nov 2026: 60 s trailer edit v1 (`tools/video/edits/m07_trailer60.json`, id `m07_trailer60_v1`)

Not rendered. Lint with `BE_CLIPS_DIR=$HOME/video-takes-local/m07/clips ... --takes-dir $HOME/video-takes-local/m07/takes`: 0 errors, 1 expected warning (final console clip without `placeholder: true`), 35 shots, 60.00 s. Built from a generator in the scratchpad (`edit-m07/build.py`, same shape as m06's).

### Shot list
| t (s) | shot | source |
|---|---|---|
| 0-6 | open preset | |
| 6.0 | hook, Netherton "We are faced with an impossible decision, Agent." (J-cut 0.5 s) | t10 12.95-16.65 |
| 9.7 | card Mission 7 / Architect's / Gambit (on the 10.46 lift) | |
| 11.2 | stakes "Eight point four million people, Agent." (UI-free crop) | t10 30.0-32.77 |
| 14.0 | Hollis torch on the checkpoint map, then "So you're lost, or you're the other thing." | t11b 7.8-8.8, 19.4-23.45 |
| 19.0 | ops floor walk (stand-in) | t28 0.5-1.7 |
| 20.2 | card Withheld / Caller, ring widget (no caller ID), "Don't look for the trace. It isn't there." | t13c 10.3-11.6, 15.7-18.9 |
| 26.2 | Elena, whole line | t14 46.35-50.1 |
| 30.0 | card Real / Hacking, walk to the terminal, m07 console clip (nmap, nine ports) | t21, `m07_console_recon_clip.mp4` 0.4-2.2 |
| 34.2 | armed clock display | t16 |
| 35.7 | card Down into / the Dark, lockpick, Park "Four minutes and I'd have been out. Four.", swing narration | t22, t15, t26b |
| 42.4 | crescendo, 13 shots: badge pad, Mercer face, cloner, Elena, reader, Park, key lock, Hollis, SCADA panel (empty), Netherton, vault pad, clock, ops floor | t17 t25 t14 t18 t15 t23c t11b t20 t10 t24 t16 t28 |
| 47.9 | ending: Architect wide (J-cut 2.55 s under the crescendo), hard cut with a hit at the silence to a 4x crop on the text, "Four fires tonight, and only one of you. I set them so you'd have to choose." | t13c 40.0-44.1 |
| 52-60 | close preset | |

### Music
SpyAction "Shadow Tide", window start 0.05 s (a downbeat), 114.69 BPM, bar 2.092 s (analysis `tools/video/edits/music/shadow_tide_60.json`, run with librosa from `~/video-takes-local/music-pylibs`; the scratch venvs had no packages and python3-venv is missing). Why: of the three windows the analysis offers, this one has the only quiet intro (bar rms 0.07 to 0.10 until 20.9 s) for the title and hook, a lift at 10.46 that lands on the Mission 7 card, a big lift at 20.92 with the strongest hit at 20.72, then steady energy to a 2 s fade-out. Alternatives in the edit: window 69.103 (analysis best, loud from the first bar), window 92.121 (ends on a drop). Not used by m01 to m06. Not judged by ear: add the row to `docs/video/recipes/README.md` when the edit is final.

### Placeholders and compromises
- No marked placeholders. The Real Hacking slot is the real m07 console clip.
- Ops floor: the Adaeze/Gwen exchange take (t12) is not filmed, so a 1.2 s walk across the ops floor (t28) stands in. Swap when t12 lands. t20b (SCADA panel plus flag station) has not run: the SCADA panel comes from t20 (note shot excluded, panel frames only).
- t19c, t23b and t29c are not marked usable in the takes log (t19c 1.02% and t29c 1.68% dropped frames), so t19c and t29c are unused and there is no generator-hall walk. The key-lock crescendo shot uses t23c (0.61%, passed).
- The Architect call is a green terminal text view, not a portrait: the "close-up" is a 4x crop on the typed text.
- Ring crop and the 9:16/1:1 crops were derived, not rendered. Frame-checked at full resolution: ring crop, ending close, call_trace (16:9). Not checked: the clock crop (3x on a small room), 9:16 and 1:1 of the call screens and pads.
- Hollis's torch shot and Park's swing carry no spoken audio (swing is narrator text only; muted).
- Face flashes from line takes: Netherton, Elena, Park, Hollis, Mercer (silent, no hostile route).
- The last crescendo shot (ops floor, 0.73 s) absorbs the 12 frames needed to hit exactly 60.00 s; re-time when t12 or t20b land.

### Open questions (recommendation first)
1. Music by ear: Shadow Tide at 0.05 s. Recommend keep; fall back to window 92.121 if the quiet intro sounds thin under the title.
2. Ring widget shown for 1.3 s on its own: recommend keep (it names the mechanic the card sets up); drop it first if time is needed.
3. Hollis: second sentence only ("So you're lost, or you're the other thing."). Recommend keep; the first sentence ("Building's evacuating.") is cut for time.
4. Face-flash order in the crescendo is by take availability, not story order. Recommend re-order after the first render.
