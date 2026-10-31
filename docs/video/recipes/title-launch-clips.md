# Recipe: title and launch clips (Veo pair, one per game)

Priority 2 (the game trailer and every mission trailer need the pair) and 3 (the Hacktivity shell's title intro and start clips). The pair is **per game**, not per mission: SAFETYNET: Licence to Hack has `spy_into_frame` and `spy_laptop_out`, and every mission trailer reuses them. **The user generates the clips in Veo.** This recipe prepares the prompts and start frames, conforms the results, wires them into the edit and into the shell. House rules in `README.md`.

## Purpose

- **Opening clip:** the agent walks into the keyhole and the shot ends on the title art. Under it, the pixel title assembles on the right (`title` shot with a `clip`). In the shell it is the title screen's intro (`<title_image>_intro`).
- **Launch clip:** the agent opens a laptop and the screen glows; the hand lands on the keys at about 3.0 s and a red cascade of hex digits falls from the top and covers the screen. In the trailer it is the call to action (`cta` shot) and ends on the Hacktivity Games logo. In the shell it plays on the launch button (`<title_image>_start`), the curtain after the key press.

## Length and aspect ratios

Each clip 4 s (m01: video 3.93 s, sound 4.03 s). Source from Veo: 16:9, 1280x720, 24 fps, painted look, with sound. **Do not** ask Veo for text or logos. The edit conforms the clip to 1920x1080 at 30 fps; the shell uses 1280x720 files of 210 to 290 KB each. The 9:16 and 1:1 trailer renders crop the 16:9 clip in the edit (the m01 edit's `framing` and `text_box` values are the start).

## Beat sheet

| Clip | Seconds | What happens | Why it matters in the edit |
|---|---|---|---|
| Opening | 0 to 3 | the agent (seen from behind or in profile) walks toward the keyhole through dim, rainy noir light | the title assembles on the right once the agent has stepped in |
| Opening | 3 to 3.9 | the agent steps into the keyhole's glow; the shot settles on the final composition (the keyhole centre-left, clear space on the right) | the last frame must **match the static title art** (the shell holds on it; the trailer freezes on it) |
| Launch | 0 to 2.5 | the agent sits in a dark room and lifts the laptop lid; the glow lights the face | the call to action text sits beside the spy, on the right half |
| Launch | about 3.0 | the hand lands on the keys, the screen glow steps up | **the red hex curtain must start only now** (m01: clip frame 90 = 3.0 s, curtain from 3.2 s) |
| Launch | 3 to 3.9 | typing, glow; the clip then freezes on its last frame under the curtain | the curtain covers the screen by about 5.1 s |

## Draft Veo prompts and start frames

The prompts the user used for the m01 pair were not saved (only the outputs and URLs are in `tools/video/assets/clips/README.md`). These are drafts: put whatever is finally used into that README next to each clip, with the seed and the source URL. Neither prompt names a film, a brand or a real person.

**Start and end frames.** Use Veo's image input if the interface has one. Prepare these stills (1280x720 or larger, 16:9, painted style, matched to the game's capsule art `marketing/capsule_concepts/c1_keyhole_hookpick6.png`, 1376x768):

- Opening **end frame:** the capsule art itself, with the right-hand third left empty for the title (the Remotion title sits at `pos.x` 0.583). If Veo accepts only a first frame, use the art as the first frame of a separate shot and ask the user how they want to join them.
- Opening **start frame:** the same room and keyhole, a long shot of the agent at a distance.
- Launch **start frame:** the agent at a desk, laptop closed, the same painted palette (navy, violet, a warm rim light).

**Opening prompt (draft):**

> Painterly noir illustration, hand-painted look, matching the reference artwork. A lone spy in a dark suit, seen from behind, walks through rainy dim light toward a huge glowing keyhole that fills the frame. Slow camera push-in. The spy steps into the keyhole's warm glow and the shot settles on the final composition: keyhole left of centre, clear dark space on the right. No text, no logos, no subtitles. Soft synth drone, footsteps on wet ground. 4 seconds.

**Launch prompt (draft):**

> Same painted noir style and palette. A spy in a dark room lifts the lid of a laptop; the screen glow lights their face and the room. After about three seconds their hands settle on the keys and the glow brightens. Slow push-in, subject on the left, clear space on the right half of the frame. No text on screen, no logos. Soft keyboard clicks, a low electronic hum. 4 seconds.

The red falling hex digits are **not** in the Veo prompt: they come from the curtain in the edit (`HexRain.tsx`, a port of the shell's curtain), so they can start on the key press.

## Conform (after the user supplies the files)

Keep the originals in `video_out/source_<game>/` (git-ignored). Conform for the edit, as `tools/video/assets/clips/README.md` records:

```bash
ffmpeg -i <src>.mp4 -vf "scale=1920:1080:flags=lanczos,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1,format=yuv420p" \
  -c:v libx264 -crf 20 -preset slow -r 30 -c:a aac -b:a 128k -ar 48000 -movflags +faststart <name>.mp4
```

Smooth scaling is right here because the clips are painted (the one exception to nearest-neighbour). Find the key-press frame of the launch clip by a luminance step on the face and put it in the `cta` shot (`curtain.start` about 6 frames after it; `clip.audio.gain_db` -4). Update `tools/video/assets/clips/README.md` with source URLs, prompts and the frame numbers.

## The shell convention (Hacktivity repo)

The shell picks the clips up by file name beside the title art in the Hacktivity repo, with no code change per game:

```
app/assets/images/event_titles/<title_image>_intro.webm   and  .mp4
app/assets/images/event_titles/<title_image>_start.webm   and  .mp4
(beside <title_image>.svg and <title_image>_social.jpg, the static art)
```

`<title_image>` is the event's title image name (`safetynet_licence_to_hack`). `Event#title_intro_sources` and `#title_start_sources` (`app/models/event.rb`) return `{content type => asset path}` for the files that exist (WebM first) or nothing, so an event without clips is unchanged; `gs_intro_video` in `app/helpers/game_shell_helper.rb` renders the intro. Names: `<title_image>_intro` for the title screen and `<title_image>_start` for the launch.

Rules from the m01 work (Sonnet agent, `/home/user/hacktivity`, branch `claude/break-escape-video-creation-wk365q`, commit 309acff when last checked; confirm its status and the user's review before relying on it):

- WebM (VP9, with Opus) and MP4 (H.264, with AAC), 1280x720, 24 fps, 4 s, **210 to 290 KB each**; encode small.
- The intro's last frame is registered to the static title art (residual under 0.5 px at six sizes), so the shell can hold on the still.
- The launch clip's red hex curtain starts after the key press, on the shell's launch buttons.
- Tests ran on a throwaway Postgres and Redis with stub credentials. Desktop-app audio and Safari were untested.
- The shell is the Hacktivity repo's code, not this repo's: shell changes need the user's review first ("Shell: changes first").

## Must include

A walk-in that ends on the matching title art; a launch clip with a clear key press; clip audio that sits under the music (gain -4 dB in the edit); the prompts and frames recorded in the clips README.

## Must avoid

Text, logos or the words "Break Escape" in either clip; the red cascade inside the Veo generation (it must be timed in the edit); a different art style from the capsule art; real people or film references in a prompt; a clip that ends on a frame that does not match the title art.

## Inputs

The capsule art, the title SVG, the game's palette, a Veo account (the user's), the previous pair (`tools/video/assets/clips/`) as the style reference.

## Stage skills, in order

1. **This recipe** (Claude): prepare the prompts and start or end frames (`tools/video/assets/clips/<game>_prompts.md` if the user wants them kept), give them to the user.
2. **The user** generates the clips in Veo and supplies the files or URLs.
3. `video-edit`: conform, register, find the key-press frame, set the `title` clip and the `cta` shot.
4. `video-review`: the page shows the opening and the call to action, and asks the questions below.
5. The shell files: a separate task in the Hacktivity repo (Sonnet), reviewed by the user.

## Review questions

1. Does the opening end exactly on the title art? Does the title land well?
2. Does the curtain start on the key press?
3. Do the clips match the painted style of the game's capsule art?
4. Is the clip audio right under the music?
5. Is the shell version wanted on the title screen and the launch button (it changes the Hacktivity shell)?
