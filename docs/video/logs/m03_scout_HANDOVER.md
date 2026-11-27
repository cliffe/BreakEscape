# m03 scout handover (Sonnet 5.5, stopped at about 160k tokens)

Done: `docs/video/scout/m03_scout.md` (lines tested live: 353 of 360 play; rooms, minigames, spoilers, music, recon window), `docs/video/edits/M03_TRAILER60_PICKS.md` (draft beat sheet, take list, 6 questions). Server on :3017 stopped; game 11137 left in the dev DB.
Not done: entry-state flags proved by play, lighting_lookup, 60 s music analysis, per-take avatar check, Ffion day-line duration, minigame action moments, office-life check of the take rooms. An opus pass should read the two docs, play a few entries, and trim the beat sheet to exactly 60 s.
Gotchas: `RBENV_VERSION=$(cat .ruby-version)` and `BUNDLE_PATH=<main>/vendor/bundle` for rails runner in the worktree. Old m03 take t02 shows the launcher login post-it; do not reuse. Never open `scenarios/m03_*/TESTING_WALKTHROUGH.md` for the picks: it contains answers.
