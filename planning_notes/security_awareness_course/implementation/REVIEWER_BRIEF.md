# Reviewer brief (awareness E8 to E20 build)

Kind of game: the awareness product "Incident Simulations: Critical Cases", short education-first episodes for non-technical staff on a neutral corporate skin. No VMs, no combat, no spy framing, no runtime language model.

Judge on:
- one clear lesson a clerk can repeat on Monday;
- a defend set that is fair and matched to the lesson, with an awkward genuine item so refusing everything doesn't win, and a similar genuine item after a likely miss;
- a no-blame register;
- facts matching the module `concepts.md` (source of truth) and topic boundaries in `../00_COURSE_OVERVIEW.md`;
- about 15 minutes full, about 8 defend-only;
- the attack (or consequence sandbox), flip and debrief teaching rather than restating;
- words a non-technical learner follows on first read; host lines that sound like a calm colleague and are easy to voice (no printed variables, under 30 words);
- every template × fact combination reading as English;
- addresses, domains and handles in the address font, other text in the pixel font, nothing below 13px.

Method: the `scenario-design-review` skill (design) or `npc-dialog-review` skill (dialogue), adapted to this kind of game, as the built episodes were reviewed (`planning_notes/phishing_and_social_engineering/awareness/DESIGN_REVIEW_C1.md`, `DIALOG_REVIEW_C5.md`). The E8 pilot reviews in `reviews/build/` show the format and the bar.

Read-only: edit nothing but your review file. Run the validator only with `--strict-social --no-graph --skip-ink`, and `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/<folder>/`. A bridge run on the keyless :3001 server is allowed if you want to see a screen (`export NODE=$HOME/.cache/ms-playwright-go/1.57.0/node; ONLY="<job>" tools/playtest/se/run-suite.sh <scratch>/...`), never :3000; say whether you judged a screen from a render or from code.

Write the review section by section with Edit: counts table; what works; findings tagged blocker / major / minor with file:line, each marked episode-local, engine or needs-user, with a concrete fix (old -> new for wording); verdict. UK English, plain writing.

Return: counts, blockers and majors in one line each, verdict.
