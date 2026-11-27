# m02 lip-sync check (2026-11-21)

Question: the user says lip sync "seems a little off" in the m02 v3 trailer. Is it the game code, the capture, or the edit?

Sign convention: positive = mouth late (audio leads the picture). Film-standard detectability is about +45 ms mouth late (audio leading) and about -125 ms mouth early, so late is the sensitive direction.

## Method

For the three talking shots (t01 HaX, t28 Bernie, t09 Val; Ghost has no mouth) the line text was run through the engine's own `alignToEnvelope` (`lip-sync.js`) on the take's audio envelope, giving the predicted time of every mouth-shape change. The mouth region was cropped from the video (HaX 900,370 140x100; Bernie 1230,260 140x100; Val 1220,280 140x100) and the frames where the crop changed were taken as observed shape changes. The lag that best lines the two up (minimum mean nearest-neighbour distance, 5 ms steps) is the offset. Each curve has one clear minimum (chance level about 30 ms, minimum 10 to 25 ms). Frame quantisation (30 fps, a change shows on the first frame at or after the event) adds a bias of about +17 ms to every figure, so true values are roughly 17 ms lower. Independent check: cross-correlation of the audio envelope with distance-from-rest of the mouth crop.

Scripts (scratchpad, not committed): lip.py, trans.py, pred.mjs, shift.py.

## Results

| Shot | Take (trimmed), best lag | Take, envelope xcorr | Render v3, best lag | Render audio vs take (xcorr) |
|---|---|---|---|---|
| t01 HaX | +55 ms | +35 ms | +5 ms | +1 ms |
| t28 Bernie | +45 ms | +5 ms (corr 0.33, weak) | +5 ms | +11 ms |
| t09 Val | +65 ms | +30 ms (corr 0.76) | +10 ms | +6 ms |

First audible speech vs first mouth change in the take: HaX 12.00 s audio, 12.07 s mouth (+67); Bernie 13.68 / 13.77 (+87 by amplitude gate, shape change +67 from the predictor); Val 6.65 / 6.67 (+17 by gate). Onset figures are single frames (33 ms steps) and noisier than the whole-line fit. Last mouth change trails the last audio by 30 to 80 ms (closing rest after the final word).

## Findings

1. The take carries a mouth-late offset of about +45 to +65 ms raw (about +30 to +50 after removing frame quantisation), roughly 1 to 2 frames, consistent across all three characters. That is at or above the detectable threshold for audio leading.
2. The render (v3) is close to in sync, +5 to +10 ms raw (about 0 after quantisation). The mix is not adding delay: render audio sits within 1 to 11 ms of the take audio at the edit's mapping (adelay rounding plus AAC). The J/L cuts (`pre`/`post`) keep take time exactly.
3. The render improves on the take by accident, not by design. The trimmed takes have a video stream `start_time` of 0.033 s with audio at 0, and the shots' `in` values (12.72, 14.2, 6.85) are not on the 30 fps grid. Remotion shows take frame round(in*30) at the shot start, ignoring the 0.033 s stream start, so the picture comes out about 33 to 47 ms ahead of the take's own timeline while audio is cut exactly. For HaX the shift was measured at -46 ms (take frame 382, pts 12.766, shown at 6.000 s). Because it depends on each shot's `in`, and on whether Remotion ignores start_time, it is luck per shot (a shot with a different `in` can land at 0 to -50 ms shift, so lateness of +0 to +65 ms). The measured shots happen to land near zero. Not verified for the other dialogue-free takes, where it does not matter.
4. check-take.mjs direction is right. `offsetStartMs = audioSlate - videoSlate` is negative (audio early by 35 to 58 ms). The trim then reads audio from `t0 + corr` (corr negative), i.e. earlier, so the audio plays later in the output by that amount. It is applied to the trimmed file (`audioShiftMs` -41/-48/-36 recorded in each check.json), using the mean of start and end offsets; residuals are -10..+10 ms. The raw takes are no longer on disk (only `.trimmed.mkv`), so the direction was verified from the code and the arithmetic, not by re-measuring a raw take. A note: the slate calibrates the capture chain (audio path vs picture path), so what remains in the take is not capture error but the game's own mouth-to-audio timing.
5. Engine (`person-chat-portraits.js` `_getCurrentVisemeColumn`, `tts-manager.js` `_alignLipSync`): no fixed lead or lag. The mouth shape is `visemeAt(timeline, audio.currentTime*1000)`, polled each `requestAnimationFrame`; the timeline is fitted to the decoded 20 ms RMS envelope of the same clip. Two sources of lateness exist in principle: (a) until the async `decodeAudioData` finishes, the portrait uses the text-only timeline stretched over the whole clip (including its leading silence), so the first syllables are mis-timed; (b) `audio.currentTime` and the rAF poll add up to about 17 ms (60 Hz) plus any audio output buffering. Neither is large enough to explain +45 ms on its own, and the cause of the remaining 30 to 50 ms residual in the take was not isolated.

## Conclusion

The offset lives in the game, not the capture or the edit: about +30 to +50 ms mouth late in the recorded takes, after the capture's A/V slate correction. The edit and mix add none (audio exact to within 11 ms), and the render's picture-frame rounding currently cancels most of it for the three measured shots. So v3 should look nearly in sync on these shots; if the user still sees it off, suspects are the viewer (the review page uses a compressed copy; not measured) and per-shot variation in the picture shift (finding 3), and the pre-decode text-timeline fallback on the first syllables.

## Smallest fixes (not applied)

- Edit/render: do not rely on the accident. Either re-encode the trimmed takes with the video stream starting at 0 (so `in` maps cleanly), or add a per-shot `audio.delay` of about +30 ms (hold the audio later) for dialogue shots. Cheapest: a `picture_offset` or `audio.delay_ms` field in mix-audio.mjs (`adelay` is already used there) set to 30 for HaX/Bernie/Val, after pinning the Remotion frame mapping by rendering one test shot.
- Engine (route elsewhere): add a small viseme lead (read `audio.currentTime + 0.03`), and hold the lip-sync until the decoded timeline is ready or fall back to rest during the first 150 ms. This also fixes the in-game feel, which the edit fix does not.
- check-take.mjs needs no sign fix.
