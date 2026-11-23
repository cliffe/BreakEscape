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
