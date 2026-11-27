# ca12 "Visitors and tailgating" trailer: video log

Episode ca12 of Cyber Aware. Recipe: `docs/video/recipes/course-trailer.md`. Theme: `docs/video/CA_THEME_TWO_SEATS.md`. Newest at the bottom.

## Round 1 (2026-11-22)

- Review page: https://claude.ai/artifact/5wqSSCKTDe73dkgRsc6vYf
- Edit `tools/video/edits/ca12_trailer45.json` (12 shots, 45.0 s, lint 0 errors); selects `docs/video/edits/CA12_TRAILER45_SELECTS.md`. Renders 16:9, 9:16 and 1:1 under `$HOME/video-takes-local/ca12/renders/`.
- Owner's note, verbatim: "The red/blue concept is good -- use clearer title pages to say what is covered offensive, and then show how the game plays defensive blue".
- Decision for round 2:
  - Chapter cards: a red card says what the attack half covers, a blue card says what the defend half covers.
  - Shorter attack footage (research, build and lands at about 3 s each).
  - A longer defend gameplay section, with a new t11 take of the visitor queue (three cards opened, buttons hovered, nothing pressed).
  - The round-1 layout fixes (stacked DEFENDER tab on ca-open, ca-close tagline sizing, flip tab centred on the seam).
- Dropped from round 2: the "What you'll spot" card and the Lorna L1 shot.
- Still open (the other D335 questions, none answered yet): music (none in the bed; a CA track is to be chosen), whether to mask the pretext lines on t05, 16:9 reliance on the game's subtitle bar, burned captions duplicating the world bubbles on t09 in 9:16 and 1:1, the 9:16 flip crop of the kiosk heading, the Reports/Refuses thresholds visible in the influence meter on t06.

## Round 2, build (2026-11-22)

- Branch `video/ca-trailer-r2`. Edit `tools/video/edits/ca12_trailer_r2.json` (13 shots, 48.1 s, lint 0 errors, 1 warning for the placeholder t11 slot). Selects `docs/video/edits/CA12_TRAILER_R2_SELECTS.md`.
- New component `CaChapter.tsx` (full-frame seat colour, GNF heading, up to three VT323 bullets revealed in turn, seat tab, small CYBER AWARE plate). Lint rules for chapter cards in `tools/video/remotion/scripts/lint-edit.mjs`, tests in `tests/ca-lint.test.mjs`.
- Key-frame stills read in all three aspects. Fixed: ca-close glyph-to-word gap (about 66 px to 22 px on 16:9), ca-close tagline on two lines when stacked, end shot framing (black bars at the top, and at the right on 1:1, because the crop ran outside the game view).
- Not done here: the t11 take itself (placeholder in the edit), no render.
