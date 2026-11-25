# Preview samples

## ca14 samples (25 Nov, render queued)

Two sample preview formats for the ca14 course (Social media and oversharing), for the owner to compare. Built and linted only; nothing rendered or encoded (another session is rendering). Edit lists are in `tools/video/edits/`. Takes are in `~/video-takes-local/ca14/takes`.

| sample | edit lists | take windows | length |
|---|---|---|---|
| A card loop, silent, no text | `ca14_sample_loop.json` (16:9), `ca14_sample_loop_1x1.json` | 16:9 `t03_attack_run` 14.2 to 19.8 s; 1:1 `t03b_attack_run_narrow` 14.0 to 19.6 s (both: Dani's Friendface profile, two Pin clicks, "Noted" lines appear) | 5.6 s, 5.2 s after the loop crossfade |
| C spot the tell, 9:16 and 1:1 | `ca14_sample_tell.json` (9:16), `ca14_sample_tell_1x1.json` | `t11_risky_card_narrow` (not yet run; in/out TODO from its marks: list-up to tell-visible, then the last frame held 3.0 s with `freezeAt`), then end plate 5.8 s ("Play to find out" / "Social media and oversharing") | 15.0 s |

Caption "What gives it away?" is a `vo` cue with no file (burned caption, 4.3 to 9.2 s, no voice). Music bed: PeaceFolk "Gently Decaying Again" from 102.341 s, gain -12 dB, fade in 0.5 s, out 2.0 s.

### Known problems (read before rendering)

1. **C needs the t11 capture.** `t11_risky_card_narrow` opens Jordan Vale's fake-recruiter DM (tell: "[New account, created last week, no other posts.]" and a request for the firm's systems and who runs IT). It has not been run (machine reserved for captures); the edit lists point at it with placeholder times marked TODO. Replace them from the logged marks after capture. End-plate check: no verdict or answer is shown, only the message.
2. **A cannot match its ends.** The pins accumulate, so the first frame (no pins) and last (two pins) differ. The 0.4 s crossfade covers the state change. No take window fixes that.
3. A 1:1 (and C) crop framings are copied from `ca14_trailer_r1_narrow.json`, not yet checked on a render.

### Render commands

Run one at a time, after the other session's render finishes (`pgrep -af 'remotion|render.mjs|render.sh'`; `free -g`).

```bash
cd /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/b-ca-trailers-next
export T=$HOME/video-takes-local/ca14/takes; export R=$PWD/tools/video/remotion; O=$PWD/video_out/ca14/renders; mkdir -p $O
cd $R && nice -n 19 node scripts/sync-assets.mjs --takes-dir $T

# Sample A (silent loop, then 0.4 s crossfade of the end into the opening frames, no audio stream)
loopx() { # edit aspect out
  nice -n 19 node scripts/render.mjs $PWD/../edits/$1.json $2 /tmp/$1.silent.mp4
  L=$(ffprobe -v error -show_entries format=duration -of csv=p=0 /tmp/$1.silent.mp4); X=0.4
  OFF=$(awk -v l=$L -v x=$X 'BEGIN{printf "%.3f", l-2*x}')
  nice -n 19 ffmpeg -nostdin -v error -y -i /tmp/$1.silent.mp4 -an -filter_complex "[0:v]split[x][y];[x]trim=start=$X,setpts=PTS-STARTPTS[a];[y]trim=end=$X,setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=$X:offset=$OFF,format=yuv420p[o]" -map "[o]" -c:v libx264 -crf 24 -preset slow -movflags +faststart $3
}
loopx ca14_sample_loop 16:9 $O/ca14_sample_loop_16x9.mp4
loopx ca14_sample_loop_1x1 1:1 $O/ca14_sample_loop_1x1.mp4

# Sample C (full mix: music, loudnorm, burned caption; scratch folders are deleted on success)
cd ../.. 
export BE_VIDEO_SCRATCH=/tmp/render-ca14_sample_tell-9x16; nice -n 19 tools/video/remotion/render.sh tools/video/edits/ca14_sample_tell.json 9:16
export BE_VIDEO_SCRATCH=/tmp/render-ca14_sample_tell-1x1;  nice -n 19 tools/video/remotion/render.sh tools/video/edits/ca14_sample_tell_1x1.json 1:1
```

(Run the loop commands from `tools/video/remotion`, as `$PWD/../edits` assumes.) Outputs: `video_out/ca14/renders/ca14_sample_*`.

### Spoiler check (per sample, by frame)

- **A:** step through every frame of both renders: no card, title or added text; the only words are the game's own Friendface page and "Noted" lines. `ffprobe` shows no audio stream. Play the loop point twice: the crossfade is the only jump. 1:1: the whole panel (560 px) inside the square, no clipped edge.
- **C:** every frame of both renders: no verdict, no grade, no Trust/Report/Delete result, no debrief or "Result" tab content, no highlighted tell, no "Noted" or reason line; the three buttons may show, none pressed or hovered. The caption is the only added text before the plate. The first plate frame reads "Play to find out" and the course title, nothing else. Check the held frame is the card frame, not a later one. Audio: music only, no voice (`ffmpeg -af ebur128`: -14 LUFS, peak under -1 dBTP). Resolve known problem 1 first.
