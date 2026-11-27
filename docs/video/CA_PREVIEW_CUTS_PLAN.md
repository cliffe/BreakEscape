# Cyber Aware catalogue preview cuts (placement D)

Hacktivity's catalogue tiles play a short muted loop per episode (placement D, picked by the owner on 24 Nov 2026; A and B use the full trailers). This note plans those loops. They are built after the current trailer batches, as an edit pass over shots that already exist; nothing new is filmed or voiced.

## What each preview is

- About 20 s, muted (no audio track at all), loops cleanly.
- One 16:9 file (1280x720). Hacktivity crops it with CSS to fit each tile, so keep the action near the centre of the frame: a shot whose subject sits at an edge gets cut off on narrow tiles.
- No narrator, no captions, no title or end card: the tile already shows the episode name, and a captioned crop collided with "Register for free" on phones.
- Small: aim for under 1.5 MB (H.264, CRF about 30, no audio, faststart).
- Name: `<mission>_preview.mp4`, using the full Break Escape mission name (for example `ca03_helpdesk_reset_preview.mp4`). Hacktivity reads exactly that file (`TrailerMedia.preview_for`, HT 4da7caca), as `app/assets/videos/<mission>_preview.mp4`. In hacktivity-videos it sits beside the episode's trailer files. When a trailer is re-cut, its preview is regenerated in the same commit.
- A course tile plays the first episode, in slot order, that is listed in Hacktivity's `config/trailer_media.yml` and has a preview file.

## Shot choice

Each preview is generated from the episode's approved 16:9 trailer edit (`caNN_trailer_r1.json`, or the pilot episodes' own edit), so it uses the same takes and the same spoiler judgements. A script, `tools/video/scripts/make_preview_edit.py`, writes `caNN_preview.json`:

1. Keep only `gameplay` shots. Drop `card`, `ca-open` and `ca-close` shots, and the cold-open `hook`.
2. Take the story in order, attacker side then defender side, about four shots: the build or attack shot, the moment it lands, then one defend shot (queue, drill or panel). Typical cut: 5 + 4 + 5 + 5 s.
3. Turn captions off on every shot (`caption` false) and drop `lines`, `vo`, `music` and `audio`.
4. Trim each shot to its busiest part: the source in/out points stay inside the trailer's own, so nothing the trailer hid becomes visible.
5. Loop join: the last 0.4 s cross-fades into the first frame of shot 1, so the tile does not jump when it restarts.

The orchestrator checks each generated list against the trailer's contact sheet before rendering, and swaps a shot by hand where the automatic choice is dull (a static menu, a mostly empty room).

## Render and checks

- Render with `scripts/render.mjs` only (the silent Remotion step of `render.sh`); skip the audio mix, loudness and `.srt` steps. Then encode the small copy with ffmpeg (`-an`, scale to 1280x720).
- Check: duration 18 to 22 s; no audio stream (`ffprobe`); file size; a contact sheet looked at by eye; the loop point played twice.
- One machine block per batch, booked with VID1 like the trailer renders, after the trailer batches are signed off.

## Order

Episodes as they are approved, starting with the exported finals (ca03, ca04, ca14; then ca07 after its take pick), then B1 (ca00, ca05, ca08, ca09), then ca01, ca12 and ca15. Previews go on the batch review pages as their own tab before export, because a 20 s silent loop is easy to judge in one look.
