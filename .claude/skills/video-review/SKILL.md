---
name: video-review
description: Builds the review page for a SAFETYNET video round: a private artifact with the renders (compressed copies), the stills, the recipe's review questions and a feedback form that saves the user's answers, republished at the same link every round; then reads the feedback, logs decisions, and runs the Google Drive export stage once the user signs off. Final stage of the video family (video-scout, video-takes, video-edit, video-stills, video-review). Trigger when the user asks to "put the trailer on a review page", "send me the video for review", "get my feedback", "publish the render", "read the feedback", "round 2 of the trailer", "export to Drive", "archive the final video", or when a render or stills pack is finished and the user has not seen it.
---

# Video review and export

Every round of every video goes to the user on a **review page**: videos you can play, stills you can look at, a feedback form that saves. This is the user's preferred way to review (AGENTS.md, "Asking the user for input"; the m01 trailer went through four rounds on one page: v1 to v4, with `feedback/m01_v1` to `feedback/m01_v4`). The last stage is **Export** to Google Drive, the permanent home.

Part of the video family. It follows `video-edit` (renders) and `video-stills` (the pack). Read `AGENTS.md` first for how rounds work, then this file.

## Who does this

- **Orchestrator (Opus):** checks the renders before anything is published (contact sheets, loudness numbers, the spoiler checklist from `video-edit`), writes the questions, reads the feedback, decides, logs.
- **Sonnet:** builds or regenerates the page from the orchestrator's brief and encodes review copies. The orchestrator opens the published page itself and looks at it before telling the user the link: "look at the screenshots yourself before calling UI work done".
- **Haiku:** ffmpeg encodes and file listings.

## Step 1: pre-flight (orchestrator)

Nothing reaches the user unchecked. For each render:

- `ffprobe` duration within one frame of the recipe's length; `loudnorm` result -14 LUFS (13.9 to 14.1), true peak under -1 dBTP (the render prints both);
- the contact sheet reviewed by eye (every card, join, minigame panel, title frame, closing frames);
- the spoiler checklist in `video-edit` run shot by shot;
- the `.srt` exists and matches the voiced lines; burned captions are present where the recipe says;
- no "Break Escape" on screen; the call to action says "Play now"; the game title opens and Hacktivity Games signs off at the end;
- the list of placeholders (`lint-edit` prints it) is on the page, so the user sees what is stand-in footage (real hacking until in-game VM capture exists).

If a check fails, fix it before publishing; do not ship a known problem and ask the user to look past it.

## Step 2: encode review copies

The page holds each video as an uploaded asset. **Keep each file under 14 MB** (the m01 review copies were `*_review.mp4`):

```bash
nice -n 19 ffmpeg -v error -y -i video_out/<mission>/renders/<id>_16x9.mp4 \
  -c:v libx264 -crf 26 -preset slow -maxrate 2500k -bufsize 5000k -vf "scale=1280:-2:flags=neighbor" \
  -c:a aac -b:a 128k -movflags +faststart <scratch>/review/<id>_16x9_review.mp4
ls -l <scratch>/review/    # every file under 14 MB; lower the crf or the bitrate if not
```

Review copies are for viewing only; the Drive export (Step 6) uses the full renders. Stills for the page: JPG copies of the pack, pixel art shown at 2x with `image-rendering: pixelated` (review thumbnails only, never a game asset).

## Step 3: build the page

Load `artifact-design` first, and `artifact-capabilities` before passing `capabilities` or writing any `window.claude.*` code. A page that needs uploaded videos and a saved feedback form declares those capabilities (an asset store for the videos and a shared database for the feedback; the capability skill lists the exact names and limits). Write the HTML to a file (scratchpad, or `docs/video/review/<mission>_<kind>.html` if it should be kept), publish with the Artifact tool. **Republish the same file path each round so the link stays the same**; use `url` if the page came from an earlier conversation (read it first).

Page contents, in this order:

1. **Header:** mission, video kind, round (`v3`), date, what changed since the last round (one short list), what is stand-in (placeholders).
2. **The videos:** one player per render (16:9, then 9:16, then 1:1), each with its length, loudness and the `.srt` as a download. For an A/B (glitch against pixel dissolve) put the two side by side with a pick control.
3. **The stills** (if any): a gallery with captions and a "drop this" tick on each.
4. **Questions:** the recipe's "Review questions" first (each recipe ends with them), then the standing ones below. Radio cards with a one-line recommendation per option, marked "suggested"; free text under each. The user makes every pick.
5. **Verdict:** `ship` / `revise` / `rethink`, and "what next" free text.
6. **Feedback form:** saves to the shared database under a per-round document (`feedback/<mission>_<kind>_v<N>`, the convention of `feedback/m01_v4`) so the answers are there when Claude next opens the session and survive a reload. Keep a "Copy answers" box too: each line carries the question as well as the answer (`key (question title): choice - note`), so pasted text makes sense in the log.

Standing questions for every round:

- Verdict, and what is the single biggest change you want?
- Pace: anything too fast or too slow? Which shot would you cut or lengthen?
- Is anything on screen you would not want a viewer to see (an answer, a name, a place)?
- The line choices and the music: keep or change?
- The call to action and end card: right?
- Which platform is this for first (YouTube, Hacktivity page, Steam, LinkedIn, Shorts/Reels/TikTok)?

Do not use a long page of prose. Videos and the form carry the page.

## Step 4: tell the user

Give the link, a three-line summary of what changed, the open questions, and the stand-in footage. Say **what was checked and how**: a render check is not a viewing; say "contact sheets and numbers checked by me, not watched in full". End with one line of assumptions the user might want to challenge (AGENTS.md).

Carry on with independent work while waiting. Pause any paid step that depends on the answers (new TTS lines, a Veo generation the user would make): those wait for the user's go, with a line count for TTS.

## Step 5: read the feedback and log it

When the user says they have answered, read the feedback document (the `ArtifactData` tool reads the page's database; load it first via the tool search if it is deferred), or take the pasted "Copy answers" text. Then:

1. Write each answer and the decision into the mission's video log (`docs/video/logs/<mission>_VIDEO_LOG.md`, newest at the bottom, as `docs/video/TRIAL_LOG.md` does), with the date, the page link and the round.
2. Turn each note into a task for the stage that owns it (takes, edit, effects, brand, music) and run the next round.
3. **Lessons that apply beyond this video** go into `docs/video/GUIDELINES.md` or the recipe's "Must avoid", so the next mission does not rediscover them. The m01 trial's rule of thumb: if the user corrected the same thing twice, it is a house rule.
4. Do not edit the user's feedback document. Record decisions in the log, not on the page.

Stop rounds when the verdict is `ship`, or when two rounds in a row find only taste notes (say so and ask).

## Step 6: EXPORT to Google Drive (stage, mechanism not settled)

> **This is the only stage that depends on how Drive access works.** The user has said Google Drive is the permanent home and that the mechanism is still being settled. Do not guess it. When the user signs off ("ship"), tell them export is ready, ask which mechanism to use (a first-party Drive connector, a synced folder, a script), and rewrite only this section once decided. Nothing else in the family depends on it.

What to export, whatever the mechanism. `video_out/` is git-ignored, so Drive is the only permanent copy:

```
Hacktivity Games / SAFETYNET Licence to Hack / <mission> /
  <kind>_<version>/                      for example trailer_v4_final
    <edit id>_16x9.mp4  _9x16.mp4  _1x1.mp4       full renders, not the review copies
    <edit id>.srt
    stills/  (PNG pack + captions.json + contact.png)         if a stills pack was made
    sources/  edit list JSON, selects note, takes table, music record line, EXPORT_MANIFEST.md
```

`EXPORT_MANIFEST.md`: the commit hash of the repo at render, the edit id, the music track and window, the list of takes (id, entry state), the placeholders still in the cut, the date, the review page link and the verdict. Also add the mission-to-music row in `docs/video/recipes/README.md` if it is not there.

Checks: file sizes match local; each file opens; the folder is shared the way the user said; the link goes in the video log. Only after the user agrees to the mechanism and the folder.

If the Google Drive tools are attached in the session, load them with the tool search (names begin `mcp__Google_Drive__`) and read the `google-workspace` skill first, but this draft does not assume they can carry large video files: check the file size limit with one small test file before uploading anything real, and tell the user if they cannot.

## Gates

| Gate | Pass when |
|---|---|
| Pre-flight | every check in Step 1 done by the orchestrator and logged |
| Page | opens, plays every video, the form saves and reloads with its answers, tested by the orchestrator |
| Size | review copies under 14 MB each |
| Link | same URL across rounds |
| Log | feedback and decisions recorded before the next round starts |
| Export | only after sign-off and an agreed mechanism; the manifest is written |

## Traps

- Do not publish a page that imitates a real organisation, person or record in a way that could mislead; this one is the studio's own video and is private by default. Share only if the user says so.
- A review copy must not be the only copy of anything.
- Re-encoding review copies is CPU heavy: do not run it during a capture, and do it one at a time next to a render.
- If a render changed between rounds but the page was not republished, the user is reviewing the old one: name the round on the page and in the filename.

## Related

`video-edit`, `video-stills`, `video-takes`, `video-scout`, `docs/video/recipes/README.md`, `AGENTS.md`, `artifact-design`, `artifact-capabilities`.
