# Recipe: mission stills pack

Priority 1, with the mission trailer. **Not a video.** The user dropped the slideshow MP4 in the first review ("keep mission stills only"). House rules in `README.md`.

## Purpose

A curated set of screenshots that show the mission to someone choosing whether to play: for Steam, the Hacktivity mission page, the devlog, social posts and the review page. Each still stands alone with a caption.

## Length and aspect ratios

12 to 20 stills (m01's first set had 18; the v2 plan dropped two and added three). **1920x1080 PNG (16:9) is the master.** Optional crops where a platform needs them: 9:16 (1080x1920) and 1:1 (1080x1080), framed on the subject, with a framing check on each. No video, no slideshow, no music.

## Beat sheet (a story order, not a time line)

Number the files in the order a viewer should read them.

| # | Content | Notes |
|---|---|---|
| 1 | Title still | the game's title art (`safetynet_licence_to_hack_social.jpg` composition) or a clean title-screen frame; no "Continue?" prompt |
| 2 to 3 | The briefing | Agent HaX in the portrait view, with the game's subtitle bar; one strong line |
| 4 to 6 | Arrival | the first room (reception), a door, an open-plan office after the lights strike, the cast met first |
| 7 to 11 | The tools | the lockpicking pins, a keypad with three non-answer digits, the phone chat with reply choices, a real tool (CyberChef), a lab or server room with no answer on screen |
| 12 to 15 | The people | one portrait still for each of three or four NPCs with their strongest line visible in the bar; a walking shot with an NPC |
| 16 to 18 | The threat | a dark set piece, the antagonist only if the recipe or the user allows it, a moment that raises the stakes without a reveal |

## Must include

- A spread across cast, rooms and minigames; at least one still per major minigame; the whole minigame panel with a margin.
- A caption per still in `captions.json`: one plain sentence in UK English, no em dashes.
- Pixel-crisp output: nearest-neighbour, integer scales (2x, 3x) for any crop.
- A numbered contact sheet.

## Must avoid

- Any answer: PIN, code, password, flag, a post-it with a login (crop or pixelate), CyberChef inputs that are real mission answers, voicemail subtitles that state a PIN.
- Keypads with real digits or an accepted entry; casualty figures; choice, ending, debrief or credits screens; toasts, objective panels, stray text boxes; "Continue?" or resume prompts.
- "Break Escape" text.
- Dark, murky frames (m01's flag terminal), near-duplicates (m01 14 and 15), mid-transition frames.
- A slideshow video.

## Inputs

- `video_out/<mission>/takes/*.trimmed.mkv` and the takes table; the title art; the mission's answers (from `SOLUTION_GUIDE.md`, to know what to keep off screen).

## Stage skills, in order

1. `video-scout` (light): only if no scout exists; the trailer's scout report is enough when the trailer is done.
2. `video-takes`: only for moments the trailer's takes lack (a lit room with no HUD, an NPC portrait for a character the trailer skips).
3. `video-stills`: candidate frames (Haiku), the orchestrator's picks and spoiler check, crops and captions (Sonnet).
4. `video-review`: a gallery on the page with a "drop this" tick on each still; the Drive export holds the final pack.

Models: Haiku extraction, Opus picks, Sonnet assembly.

## Review questions

1. Which stills would you drop? (a tick on each)
2. Is there a moment missing: a character, a room, a tool?
3. Is any still showing something you would not want a player to see?
4. Are the captions right, and in the right voice?
5. Do you want 9:16 and 1:1 crops for social posts?
6. Is the order the right story?
