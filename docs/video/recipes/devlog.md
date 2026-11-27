# Recipe: devlog or demo

Priority 3. A short video showing what changed in the game or one feature at work, for YouTube, the Hacktivity pages, LinkedIn and Steam news. House rules in `README.md`. No edit list or take set exists for it yet; build from the mission trailer's parts. This is a draft: the first devlog should be shown to the user at the beat-sheet stage before any footage is recorded.

## Purpose

Tell players and followers one thing that is new, show it working in the real game, and point them at "Play now". Examples: a new minigame, a lit and re-dressed mission, a new character with a talk animation, a lab scenario for a security topic, a release note for a mission.

## Length and aspect ratios

| Kind | Length | Ratios |
|---|---|---|
| Devlog | 90 s to 4 min, one topic | 16:9 first (YouTube, Hacktivity pages, Steam news); a 30 s 9:16 and 1:1 cut with burned captions for social |
| Demo of one feature | 30 to 90 s | 16:9, 9:16 cut optional |

Captions: `.srt` always, burned in on the social cut. No fixed beat grid is needed for a talk-led cut, but the edit tooling wants a music block and `beat.period`: use the mission's track (one track per mission), or the game's own track for an engine feature, and say which in the music table in `README.md`.

## Beat sheet (90 s draft)

| Time | Dur | Beat | Notes |
|---|---|---|---|
| 0 | 4 | Title | the game title; Veo opening if the clip fits (see `title-launch-clips.md`), else the title card alone |
| 4 | 6 | What is new | one card, plain words: the topic in six words or fewer |
| 10 | 45 | The feature, in the game | takes of the real game, 8 to 15 s each, one idea per take; on-screen captions that say what to look at |
| 55 | 15 | Before and after | the same shot on the previous build and on this one, if there is one (a take recorded on an older branch is a new capture: say which commit) |
| 70 | 10 | What it means for players | one voiced line from a character, or a caption card, no jargon |
| 80 | 10 | Call to action | the Veo launch clip, **"Play now"**, the curtain, the Games logo and URL |

## Voice and captions

- Narration, if any, is **Agent HaX's TTS voice**. A new line costs money: list the exact lines with a count and ask the user each time. A line is only playable if it exists in the ink for that NPC (gap 11 in `README.md`), so a devlog with narration needs HaX ink lines first. The default is **no narration**: captions, cards and game audio under the music.
- Captions are text on screen and an `.srt` with the same words. Keep them one short sentence each.
- Game audio is live from the take (`--music 0` on capture, the edit supplies the music).

## Must include

- The game title first and Hacktivity Games last; "Play now".
- Real footage of the real feature, from takes recorded at 30 fps with the checks in `video-takes`.
- A one-line statement of what is new, a one-line statement of what to try.
- Spoiler discipline: show mechanics, hide answers; a feature from a mission that is not released yet needs the user's go-ahead.

## Must avoid

- "Break Escape" on screen; claims the game cannot back up; roadmap promises with dates.
- Real answers on screen; unreleased content without the user's go-ahead; mockups shown as footage (say "concept" if it is one).
- Narration with printed variables; narration the user has not agreed to pay for.
- Hard-coded mission text from shared minigames that may appear wrong on camera (the backlog lists several): check the frame.

## Inputs

- A one-paragraph brief from the user or the orchestrator: what changed, where to find it (mission, room, object id or a lab scenario), the commit or release.
- The scenario or lab scenario and its entry state (`new-game.rb` flags), the engine feature's bridge commands if one exists (`docs/test-bridge.md`).
- The game's Veo pair and the music table.

## Stage skills, in order

1. `video-scout`: find the cheapest route to the feature on camera (Haiku), with the spoiler column.
2. `video-takes`: record each idea as a take (Sonnet); for an engine feature use the nearest lab scenario.
3. `video-edit`: the edit list from `m01_trailer60.json` (cards, gameplay shots, a clip CTA), with longer gameplay shots and caption text; lint `--final`; render 16:9, then the social cut (Sonnet).
4. `video-review`: page with the render and the questions.

Gaps the first devlog will hit (none built): no on-screen callout component (arrows, highlights), no chapter markers, no side-by-side before/after layout, no voice-over track in the edit list (narration would have to be a take or an added audio source). Ask the user which are worth building before committing to a design that needs them.

## Review questions

1. Verdict: ship, revise or rethink?
2. Is it clear what is new in the first 10 s?
3. Is the feature shown well enough? What should be longer?
4. Voice-over or captions only? (A narrated version costs TTS lines: how many are you willing to pay for?)
5. Is anything shown that is not released, or any answer visible?
6. Which platform first, and is the 30 s social cut wanted?
