# Lip-sync: last word gets no mouth movement

Reported: m01 Derek Lawson, "Entropy is inevitable. Trust is a lie. Security through obscurity fails." The mouth stays at rest for "fails".

## Cause
`alignToEnvelope()` in `public/break_escape/js/minigames/person-chat/lip-sync.js` (fit at about line 311 onward; the DP cost and the `e` normalisation at about line 349). Not the tts-manager hand-off (`tts-manager.js:250 _alignLipSync` is fine and the sidecar `tts_cache/m01_first_contact/235d3356...json` holds no timing data, only text/voice metadata).

1. The envelope was normalised linearly to the line's 95th-percentile loudness. The line trails off: "fails" is spoken softly, 0.07-0.25 of the reference level, after a real 0.4 s dip (about 7.1-7.4 s). Against a "rest" cost of `|0 - e|`, quiet speech is nearly as cheap as silence.
2. The line's final "." was a pause unit of weight 4, followed by the closing pause (weight 2). Their prior share of the unvoiced time (everything under 0.08, which includes the soft word) is huge, so the DP gave the pair 6.72 s to 8.72 s (2000 ms of rest) and squeezed all of "Security through obscurity fails" into 5.0-6.7 s.

Result from the real clip (decoded from the cached mp3, 8.72 s): last non-rest viseme ends at 6.72 s; the audio is voiced until about 8.3 s.

## Evidence
- Recorded take `t09_derek.trimmed.mkv`: audio RMS (8 kHz mono, 100 ms windows) is high through 54.4-55.2 s (about 2800 peak at 54.5, 200-480 at 54.9-55.1) and silent from 55.3 s. Stills at 54.0-55.5 s show the mouth closed throughout the last word. Clip audio 7.5-8.3 s lines up with 54.4-55.2 s in the take.
- Re-running the aligner on the cached mp3s of all 592 m01 lines: for 107 (18%) the last mouth shape ends more than 0.3 s before the last voiced audio. Worst cases: 131-char line, mouth stops at 9.10 s, voice to 12.54 s; several 4-6 s lines lose 1.5+ s. So the bug is general (soft or trailing-off final words), not specific to Derek.

## Fix (engine only, no audio regeneration)
In `lip-sync.js`:
- the envelope is square-root compressed before fitting (`Math.sqrt(Math.min(1, v / ref))`), so soft speech is clearly above silence;
- the line's trailing punctuation is dropped from the units (the closing pause replaces it);
- leading and trailing dead air (below 3% of the peak) is trimmed, the line is fitted to the audible part, and the trimmed head/tail is added back as rest. Edge pauses get a small prior (0.25) in the trimmed fit so they cannot absorb a word.

Derek's line now: "fails" is mouthed 7.42-8.34 s (rest during the 7.16-7.42 s dip, rest from 8.34 s). Across the 592 cached lines, lines with a more-than-0.3 s gap between last voiced audio and last open mouth drop from 107 to 2.

## Tests
- New: `test/js/lip-sync.test.mjs` "a quiet last word after a pause still moves the mouth" (synthetic envelope shaped like this line). Fails on the old code (0 ms open), passes now.
- `bin/test-js test/js/lip-sync.test.mjs`: pass.
- Full `bin/test-js`: 227 pass, 68 fail; the failures are the social-*, app-mode, client-*, pwa, success-screen etc. files, none of which import lip-sync or tts-manager (not investigated further, not caused by this change).

## Not changed
Nothing committed. The in-game text-timing fallback (before the decode lands) is untouched. Existing lines in other missions get the improvement automatically since alignment runs client-side at play time.
