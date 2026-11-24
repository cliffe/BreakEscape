# m09 Digital Archaeology, 60 s trailer outline

## Decided lines (2026-11-23)

The owner's picks. Where the older text below disagrees, this block wins.

- **Ending:** Sorensen's index line. The wording is with the owner ("is filed in this room" as picked, or "was filed in this building" after the review). Not voiced yet.
- **Hook:** Netherton, "We believe ENTROPY keeps its people on paper in that building. Tonight they are burning it." A reword is with the owner.
- "Yours is in tonight's run" is out of the game.
- **Casualty rule (relaxed 2026-11-23):** figures are allowed when they are the stakes, never as an outcome and never a debrief total. This loosens any "Out" or "Off screen" entry below that bars a figure only because it is one.

Planning only. Model: `M03_TRAILER60_V3_PLAN.md`. Every line is "audio: check" until the scout tests the cache. Unfinished: entry-state globals for the cage and tape-room shots were taken from the scenario's comments and mappings, not walked; the scout should confirm them.

## Story

A courier carried one typed sheet to a records archive in Helena, Montana: "Burn Helena before the Publication." Task Force Null lets it arrive. You go in alone, after hours, while the director, Margaret Sorensen, feeds ENTROPY's paper trail into a shredder and a contractor degausses 212 reels of recruitment interviews. You clone a clerk's card, break into the archive's catalogue server, decode the salvage-cage code, and race the shredder for the files.

## Threat

ENTROPY is erasing its own history. The archive holds its recruitment records: who was placed, where, and the planner's own lectures (`ink/m09_phone_recruiter.ink`, HaX: "Her file is her network, all of it. The Alpha tapes are him teaching, recorded."). Sorensen: "Paper was the only thing that could ever have hurt them. So the paper goes." (`ink/m09_sorensen_cage.ink:34`). Once it is ash, the sleepers stay hidden and the bunker stays shut.

## New mechanics

- **Evidence destruction in progress: stop the wipe.** First in m09. A degausser console wiping a rack of reels, "WIPE IN PROGRESS. Series LI... 212 reels", halting to "97 of 212 reels intact" (`scenario.json.erb:1643-1651`); the task `stop_the_tape_wipe` (`:311-313`); the cage shredder running all night (`:2071-2076`) with a clock on the legacy box (`legacy_clock_run`, `:280-281`). **This gets the card.**
- **Vigenère cipher.** First in m09 (no earlier mission mentions it). The salvage cage's password is a Vigenère decode keyed to the bay word on the shelf-mark chart (`scenario.json.erb:2512-2514`, guide `:788`, HaX `:369`). Solved in CyberChef, which m01 already sold; the answer is the code, so the beat can show the chart and the recipe, never the output.
- **Reel tape deck.** A playable recording (`alpha_recording`, `scenario.json.erb:2413-2474`; `ink/m09_alpha_recording.ink`). The voice on it is the end twist: off.
- Two attack servers in one mission (`catalogue_server`, `tomb_beta_server`, `scenario.json.erb:592-594`) and `koImmune` NPCs (`:1125` and others) are also new, but not filmable as a beat.

Card: `Stop the / Wipe`. Second choice if the edit has room for two mechanic cards: `Vigenère / Cipher`.

## Music

Candidates, none used by m01-m03 or pencilled for the whole-game trailer:
1. Noir "Shadow of the Bond Chord".
2. Noir "Midnight Cipher Beta".
3. CutScene "Shadow Code 2" (m03 took Shadow Code 1; check by ear that it is distinct enough).

## Beat sheet (the 46 s between the presets)

Two blocks: the Citadel briefing (indoors, no windows) and then Helena at night. Never cut a Citadel shot into the archive block.

| # | Section | Shot | Entry state | Line (speaker), audio: check |
|---|---|---|---|---|
| 1 | Hook (J-cut under the title) | Netherton in Task Force Null's room, portrait | fresh game, briefing cutscene | Director Magnus Netherton: "Last night a courier in Helena, Montana, carried this to a records archive. We read it. Then we let it go on." (cut before "If it had not arrived") |
| 2 | Card | `Mission 9 / Digital / Archaeology` (three lines, as m03) | | |
| 3 | Briefing | Quintero across the table | same briefing, `the raid team` beat | Agent 0x2D 'Anchor': "One agent, no cover, in a building that's burning paper." (first sentence) |
| 4 | Night: arrival | loading dock, then a straight walk to Noor at the front desk | `loading_dock` then `front_desk` | Noor Haddad: "Peg's been in the cage since before I got here. She never feeds the shredder herself, and tonight she's sent me home twice." |
| 5 | Card | `Stop the / Wipe` (new mechanic) | | |
| 6 | Mechanic, about 4 s | the degausser console reading WIPE IN PROGRESS, Jesse Tran at it, his line, then the panel reading WIPE HALTED | `server_closet`, `flag1_submitted` false for the first frame; `tran_outcome` set off `left` for the halt | Jesse Tran: "Paper. You people break into buildings at night for paper." Payoff line, Jesse Tran: "Fine. I kill the wipe, I walk out that door, and nobody hears from me but one number." |
| 7 | Card | `Real / Hacking` | | |
| 8 | Hacking | field laptop in the reading room, walk to the launcher, console clip on the catalogue server; Vigenère recipe in CyberChef with the output pane cropped | `reading_room`, laptop set up | none |
| 9 | Card | `Burn Helena` (the courier's own words, `ink/m09_briefing.ink`, "Burn Helena before the Publication.") | | |
| 10 | Action | Lyle Dillard, the contract guard, catches the player in the open stacks and comes for them | `open_stacks` (motion lights, dark until entry, `scenario.json.erb:1399`); guard patrol `:1442-1460` | Lyle Dillard: "Dillard, Statewide Security. Stay where you are." |
| 11 | Card | `Before It's / All Ash` (objective text, `scenario.json.erb:833`: "before it's all ash") | | |
| 12 | Crescendo | every minigame (RFID clone at Noor's belt, PIN cracker, lockpick, key lock, biometric on Sorensen's office, password, the shelf-mark chart, phone chat, flag stations, notes) and flashes of Cody Old Coyote, Malhotra, Kowalczyk, Arakawa | various | none |
| 13 | Ending | Sorensen at the shredder, wide, then the 3x close | `restricted_cage` open, Sorensen at the feed | see Ending |

## Cards

- `Mission 9 / Digital / Archaeology`
- `Stop the / Wipe`
- `Real / Hacking`
- `Burn Helena`
- `Before It's / All Ash`

## Ending

1. Margaret Sorensen: "It's only paper. The people are where they've always been, at their desks, doing what they were placed to do." (`ink/m09_sorensen_cage.ink:33`). The threat in her own voice: the sleepers are still out there. Calm and kind, which is the menace.
2. Margaret Sorensen: "You're not here for my shredder. You're the one the Architect writes about." (`ink/m09_sorensen_hatch.ink:109`). A confrontation line that turns the mission on the player. It needs the hatch route with no cover story taken.
3. Margaret Sorensen: "Take your time. The shredder won't." (`ink/m09_sorensen_hatch.ink:133`). Short and sharp; a good button but less story.

## Spoiler notes

- **The Architect's identity.** The reel deck's voice (`ink/m09_alpha_recording.ink`, gated on `identity_scene_done`) and the identity scene are the mission's end twist. No tape playback with its subtitle, no HaX "I know whose voice that is."
- The sleeper's name (`sleeper_named`, `sleeper_shortlist`) and WREN.
- The salvage keypad code and its Vigenère output, the catalogue login, PIN-cracker results, flag values.
- Choice screens: the Recruiter's offer, which file to save from the bin (`bin_chosen`), Jesse's deal menu, Sorensen's fate; the debrief and the closing card.
- Carry-over lines that name m08's mole (`ink/m09_briefing.ink:44-58`): the m08 twist. Use the `else` branch or cut around them.

## Risks

- **The wipe beat** has two states (in progress, halted) in one shot; the halt needs Jesse talked into stopping, and his deal menu must not be filmed. Two takes cut together may be easier.
- **Dillard's line** is one line; the cached read may be flat for an action beat. His hostility trigger was not checked (ask the scout: on sight or on challenge?).
- **Sorensen behind the mesh** is `koImmune` and static at the hatch (`scenario.json.erb:1840`); the cage Sorensen at the shredder (`:1951`) is the better frame but needs `cage_opened`.
- **Motion lights** in the open stacks, Sorensen's office, tape room and cage: the dark lead-in must be in the take.
- **Briefing lines vary on carry-over globals**; a fresh game with no carry-over gives the `else` branch.
- Every NPC needs a frame: Gary, Torres and Nightshade are phone-only; the crescendo can use their phone contact cards.

## New lines (proposed, 2026-11-22)

Proposals only: no ink edited, nothing voiced. Each needs the user's pick, an `npc-dialog-review` and the user's yes through AC0 before TTS. Sorensen's menace is her courtesy: she calls the player "dear" (`m09_sorensen_cage.ink:64`) and talks like a clerk keeping records. Neither line touches the Architect's identity, WREN or the sleeper's name.

**Ending**

1. **Pick.** Margaret Sorensen: "Yours is in tonight's run, dear. I saved it for last." (11 words, about 3.5 s)
   - Insertion: `ink/m09_sorensen_hatch.ink`, knot `recognition`, **added** after the closing brace at `:112` (just after "You're the one the Architect writes about.", `:107-111`), before HaX's "...She's got a file on you." (`:113`). HaX's line becomes her reaction to it.
   - `#delivery: mild and pleasant, like a librarian mentioning an overdue book`
   - State: first visit to the hatch (`hatch_met` false); either opening choice. It plays on every route through `recognition`.
   - Why: "It's only paper" undersells the threat and needs context. This line is a quiet threat aimed at the player, in eleven words.
2. Margaret Sorensen: "They're all still at their desks, dear. By morning, nobody will know which ones." (14 words, about 4.5 s)
   - Insertion: `ink/m09_sorensen_cage.ink:33`, knot `start`. **Replaces** "It's only paper. The people are where they've always been, at their desks, doing what they were placed to do." Before it: "She feeds another sheaf into the shredder and doesn't turn round." After it: "Paper was the only thing that could ever have hurt them. So the paper goes." ("them" still refers to the placed people.)
   - `#delivery: gentle, almost kind, without looking up from the feed`
   - State: `cage_opened`, first talk with the cage Sorensen at the shredder (`cage_met` false).
   - Why: it keeps the current line's idea (the sleepers stay hidden) but adds a deadline and a loss, and it is half the length.

**Hook** (the current one sets up a mystery but states no stakes)

- **Pick.** Director Magnus Netherton: "We believe ENTROPY keeps its people on paper in that building. Tonight they are burning it." (16 words, about 5 s)
  - Insertion: `ink/m09_briefing.ink`, knot `start`, **added** after `:61` ("The label named the building. Mountain States Records & Retention, a commercial archive on the edge of Helena."). It is unconditional, so it plays on a fresh game. After it come the carry-over conditionals (silent on a fresh game) and HaX's first line.
  - `#delivery: level and grave`
  - State: fresh game, the briefing cutscene.
  - Why: it says what is in the building and what is happening to it, which the courier line leaves out. It also sets up the `Stop the / Wipe` and `Before It's / All Ash` cards.

## Handover: m09_trailer60.json v1 (24 Nov, edit agent stopped at its context limit)

Done: read the skill, recipe, picks, owner questions, takes_m09.md (all three runs) and m08/m05/m07 edits. Music analysed (60 s windows, committed): `tools/video/edits/music/action_dub_60.json`, `hybrid_attack_0_60.json`, `shadow_protocol_60.json`, `hybrid_attack_2_60.json`. librosa runs with `PYTHONPATH=~/video-takes-local/music-pylibs python3` (python3-venv is missing, so setup-venv.sh fails). Not started: `tools/video/edits/m09_trailer60.json` (no file yet), frame checks, lint, README music row.

**Music decision: SpyAgro "Action Dub"** (120 BPM, period 0.5001 s, so 15 frames a beat), window **start 0.0** (track start, its own intro). Window times = track times: quiet bars 0-10.7 (rms 13, 1, 6, 12, 2), lift 6.7, near-silent bar 8.7-10.7, **lift + hit 10.7 = Mission 9 card**, drop 18.7, lift 20.7, hit 24.02, lift 24.7, drops 28.7/32.7, lift 42.7, quiet bar 48.7-50.7 (under Sorensen), hits 50.69 (close-up cut), 52.69, 54.02, 54.7 (strongest) and 56.69 under the CTA. No natural end at 60: fade_out 2. Alternatives for the `alternatives` list: Action Dub 0.695 (lift 10.0, CTA hits exactly at 52/54, but the hook voice would need pre 3.7); Hybrid Attack 0 at 21.895 (analysis best, flat energy); Shadow Protocol (original) at 84.687 (close to m04's Remastered by ear, so avoid). Hybrid Attack 2 is m10's fallback; Hybrid Attack 1 is pencilled for m10: both avoided. Add the README row for m09 (and the missing m05 Midnight Double Agent 47.992, m07 Shadow Tide 0.05, m08 Shadowline Protocol 109.406, m01 now Emerald Trigger 85.571, all read from the edit JSONs).

**Time plan (snap false, frame-aligned boundaries, as m08):**
- 0-6 `safetynet-open` preset.
- 6.0-9.7 `hook_netherton` t10, source in 7.4 out 11.1, `audio.pre` 3.1 (audio from 4.3, voice 4.39 starts at timeline 2.9), `audio.post` 1.0 (L-cut: "Tonight they are burning it." runs over the team flash; mix-audio supports `post`). Line 4.39-12.08. Check the skipped-line audio at 4.0-4.39.
- 9.7-10.7 team flash, 4 x 0.25 s, t11: Anchor 18.7-19.6, Malhotra 22.2-23.0, Arakawa 25.7-26.5, Lantern 28.3-29.0, each a face crop with the subtitle bar OFF (Lantern's bar names Nightshade: crop it out in every aspect). Muted.
- 10.7-12.2 card `Mission 9 / Digital / Archaeology` (glitch).
- 12.2-13.7 drop t21 (strike at 5.3-6.0; about in 4.6 out 6.1, frames to check).
- Noor: t12 walk 1.5-2.1 then line 3.2-7.1 (about 4.5 s).
- card `Stop the / Wipe` 1.2; wipe beat: t13 console 3.2-4.4, Jesse t13 line 19.3-23.7 (or J-cut his voice under the console), t14 halted 2.8-5.3 (about 1.2 s). Cone overlay and speech bubble on t13 map frames: use the panel and portrait only.
- card `Vigenère / Cipher` 1.2; t15 password screen with hint 9.9-12.9 (about 2 s; never 2.9-5.3).
- card `Real / Hacking` 1.2; no walk to the VM (t30 laptop failed). Clip `m09_console_msfrun_clip.mp4` (2.6 s, 78 frames) in 0.3-0.4 to about 2.4, `placeholder: false` as m05/m07/m08, framing as m08 (9:16 cx 0.281 zoom 0.5625). Note: two spliced strips, `set CMD` lines cut out so `run` follows PAYLOAD (owner question). Then t16 CyberChef 4-10 window, about 1 s, muted, no line.
- card `Burn Helena` 1.2; Dillard t17 about 13.6-19.65 (lights strike 13.9, line 15.28-19.60).
- card `Before It's / All Ash` 1.2 only if it fits (drop first).
- crescendo about 2.5-3 s, hard cuts, muted: t20 cloner 1.6-7.0 and reader 12.0-17.9, t23 lockpick 2.0-11.0 (never past 11.8), t19 key lock 15.0-21.3 and note 3.4-6.3, t25 PIN pad 3.2-9.4, t22 H&L password 5.0-8.9 and Cody 13.4-15.8 (face, bar off), t24 dusting 12-21 and hatch Sorensen 25.2-27.3, t26 biometric reader 12.8-16.0, t27 flag station 2.8-5.6 (crop in), t30 closet 4.0-8.3 if a walk is wanted. No t28, t29, failed t30 walks, no safe dial (none in m09).
- Sorensen: t18 line 10.13-19.90 whole; J-cut about 3 s under the crescendo, wide (or t26 wide 2.6-9.4 UI-free under the J-cut), then 3-frame `hit` to a 3x close-up at the pause after "dear." (silencedetect found no gap: find it with ebur128 or by waveform). Close-up cut near the 50.69 hit; picture ends at 52.0.
- 52-60 `hacktivity-close` preset.
Estimated sum between presets about 43 s of 46: slack for the All Ash card and a longer crescendo.

Owner questions to carry: the spliced console strips (suggest: keep, it reads as one scroll); hook L-cut over the team faces (suggest: keep); Action Dub by ear (suggest: keep, 120 BPM fits the m01 grid pattern); no walk-to-VM shot (suggest: fine, re-take t30 laptop later if wanted).

Next agent: write the JSON from m08's structure, check frames at every in and out (`ffmpeg -ss <t> -i <take> -frames:v 1`), run the lint line from the brief until 0 errors, add the README row, commit with explicit paths.

## Handover: m09_trailer60.json v1 written (24 Nov, second edit agent, stopped at the context limit)

Done: `tools/video/edits/m09_trailer60.json` (id `m09_trailer60_v1`, 36 shots, 60.00 s, lint 0 errors, 1 expected warning for `placeholder: false` on the console clip, as m08). Generated by a scratchpad script (not kept); edit the JSON directly now.

Time plan as written (output seconds): open 0-6; hook t10 7.4 (6.0-9.7, pre 2.9, post 0.8); team flash 9.7-10.7 (8,7,8,7 frames); Mission 9 card 10.7-12.2; Drop t21 12.2-13.7; Noor t12 3.1-7.3 (13.7-17.9, reply menu appears 7.7); Stop the Wipe card 17.9-19.1; console t13 3.2 (19.1-20.3); Jesse t13 19.25-23.65 (20.3-24.7); halted t14 2.8 (24.7-25.9); Vigenere card 25.9-27.1; password screen t15 9.9-11.9 (27.1-29.1); Real Hacking card 29.1-30.3; console clip 0.4-2.4 (30.3-32.3); CyberChef t16 8.5-9.5 (32.3-33.3); Burn Helena card 33.3-34.5; Dillard t17 13.6-19.6 (34.5-40.5); All Ash card 40.5-41.7; crescendo 41.7-45.0 (99 frames, 12 cuts, muted); Sorensen wide t18 12.45-16.15 (45.0-48.7, voice J-cut pre 2.1); close-up t18 16.15-19.45 (48.7-52.0, 3x face, hit); close preset 52-60.

Departures from the plan: (1) Sorensen close-up cuts on "By morning" at 48.7 (the quiet bar), not at the 50.69 hit, because the line is 9.8 s and a 50.69 cut would run her voice 1.6 s into the CTA preset; (2) the PIN pad shot uses the empty pad (t25 4.3-4.6): from 5.9 it shows typed digits; (3) Noor 4.2 s not 4.5 (menu at 7.7); (4) notes shot uses the Incident Log (t19 note marks are 4.54-7.68, the takes table's 3.4-6.3 is about 1 s early); (5) Vigenere card kept (fits).

Frames checked (16:9, 9:16, 1:1 crops at in and out): hook, four team faces, drop. Team crops fixed: Arakawa cx .45 and Lantern cx .46 (faces were off the edge of the 9:16 crop; re-check after the change). Drop 9:16 and 1:1 crops are small (map is a narrow strip, camera scrolls). NOT yet checked: noor, wipe, jesse, password, console clip, cyberchef, dillard, all 12 crescendo shots, wide, close. Check script idea: crop each in/out frame per aspect with the shot's framing (9:16 scale = 1.7778 x zoom, crop = 1080/scale wide; 1:1 crop = 1080/zoom) and tile. Things to look for: menus, toasts, Shelf Marks chart, crate contents panel, typed digits, Lantern's bar.

Open: README music table rows (m01 Emerald Trigger 85.571 under review, m05 Midnight Double Agent 47.992, m07 Shadow Tide 0.05, m08 Shadowline Protocol 109.406, m09 Action Dub 0.0, 120 BPM, 2 s fade-out, analysis `action_dub_60.json`) not yet added to `docs/video/recipes/README.md` (replace the "m05, m07, m08 | unassigned" row). Not rendered.
