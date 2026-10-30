# Recipe: mission teaser and social cut (15 to 30 s)

Priority 2. A cut-down of a mission trailer for Shorts, Reels, TikTok, LinkedIn and the Hacktivity feed. **9:16 first**, captions burned in, `.srt` always. No edit list exists for the new brand yet: `tools/video/edits/m01_teaser.json` is the old v1 style (Break Escape wordmark, no Veo clips) and must not be copied. Start from `m01_trailer60.json` and cut it down. House rules are in `README.md`.

## Purpose

Stop the scroll in two seconds, show the mission's hook and one real minigame, give one voice and one threat, end on "Play now". It reuses the trailer's takes; it needs new takes only if a shot is not in the trailer's set.

## Length and aspect ratios

| Cut | Length | Where |
|---|---|---|
| Teaser | 30 s (28 to 31) | YouTube Shorts, Reels, TikTok, LinkedIn, Hacktivity feed |
| Short teaser | 15 s | ads, Stories |

Render order: **9:16 (1080x1920)**, then **1:1 (1080x1080)** for LinkedIn, then **16:9** if a page wants it. The edit list carries `framing` for each aspect; the 9:16 and 1:1 framings in `m01_trailer60.json` are the starting values (`cx`, `cy`, `zoom`). Every shot needs a 9:16 framing check on a frame (the panel or the face is whole and centred, nothing cut through a frame, nothing in the top 14% or bottom 20% where the apps put their own interface).

## Beat sheet (30 s, draft; set the times on the music grid at selects)

Music: the same track the mission trailer uses (one track per mission), a window that opens on a lift.

| Time | Dur | Beat | Notes |
|---|---|---|---|
| 0.0 | 3.5 | Title | Veo `spy_into_frame` and the pixel title (16x on 9:16, stacked below the keyhole); a hook must land in the first 2 s: start the clip at once, no hold |
| 3.5 | 3.0 | Hook line | the handler's line, dialogue, captioned |
| 6.5 | 1.5 | Card | **Mission N / <name>** (larger type on 9:16) |
| 8.0 | 6.5 | Drop and montage | the lights strike 1.5 s, then lockpicking 1 s, keypad 1.5 s, phone 1.5 s, a real tool 1 s, hard cuts |
| 14.5 | 1.5 | Card | one threat or choices card, in the mission's own words (optional: drop it for a longer NPC line) |
| 16.0 | 4.0 | One NPC line | the strongest from the trailer's three, captioned |
| 20.0 | 3.0 | Antagonist | the last part of his line as a UI-free close-up, hard cut in (skip the wide half), only if the user allows showing him |
| 23.0 | 7.0 | Call to action | `spy_laptop_out`: **"Play now"**, key press, red hex curtain, Hacktivity Labs morphs to Games, URL |

15 s: hook line, four montage cuts, the antagonist close-up or one NPC line, then the closing logo on the curtain (a short end shot using the `logo_end` card kind: not tested at this length, check in a stills render). No Veo opening; the title card is 1.5 s.

## Captions

- `.srt` always (`make-srt.mjs`, from `lines[]`).
- **Burned in on 9:16 and 1:1:** `"caption": {"9:16": true, "1:1": true}` on every dialogue shot. Press Start 2P, white on a dark panel, the speaker's name above the line, hard on and off (the `Caption` component). The game's own subtitle bar is cropped out of 9:16, so the caption replaces it. On a 16:9 render the game's bar stays and no caption is added.
- Cards are text already (larger type for phone screens, 36 px at 1080 wide for captions).
- Narration over cards (if HaX is voiced over a card) has no caption component yet (gap 6 in `README.md`).

## Must include

- A hook inside the first 2 s, the game title, a mission card, one real minigame, one voiced NPC or handler line with a caption, the call to action "Play now", and the Hacktivity Games sign-off on the curtain.
- Burned captions on every social aspect; a 9:16 check of every shot.
- Every real answer pixelated or avoided; keypad digits that differ from the code, at least three typed.

## Must avoid

- "Break Escape" on screen; "Play Mission N Free"; a long title hold on 9:16 (do not hold 6 s as the 60 s trailer does).
- The real-hacking placeholder in a social cut unless the user wants it (it is marked stand-in footage).
- Gameplay-to-gameplay effects; pixel-dissolve at a hard join; a second subtitle layer over the game's own bar.
- Captions outside the safe area; text smaller than 36 px on 9:16.
- Spoilers: the antagonist line only with the user's say-so, never the ending.

## Inputs

The mission trailer's takes and takes table, its picks file, its edit list, the mission's music row, the user's choice of which NPC line and whether to show the antagonist.

## Stage skills, in order

1. `video-edit` (selects against the trailer's takes; the cut-down edit list `tools/video/edits/<mission>_teaser30.json`; lint `--final`; render 9:16, then 1:1, then 16:9 if wanted, one at a time).
2. `video-takes` only for a shot the trailer lacks (a vertical-friendly close-up, for example).
3. `video-review`: the page with the 9:16 first (in a phone-width player), then the others.

Models: Sonnet edits, Opus selects and reviews.

## Review questions

1. Verdict: ship, revise or rethink?
2. Is the first 2 s strong enough to stop a scroll? What would you show first?
3. The caption size and position on a phone: readable? Too large?
4. Which NPC line is strongest on its own?
5. Should the antagonist appear in the short cuts?
6. 30 s or 15 s for each platform (YouTube Shorts, Reels, TikTok, LinkedIn)?
7. Are any answers or spoilers visible?
8. Is "Play now" clear without sound?
