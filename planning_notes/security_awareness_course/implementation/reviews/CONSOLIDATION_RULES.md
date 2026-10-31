# Round 4: consolidation rules (clean copy, not a rewrite)

The goal is a brief that a fresh Sonnet agent reads once, from top to bottom, and can act on. Keep everything that is true. Remove everything that is history.

1. **Remove the review history.** Delete every reference to rounds, reviewers, findings and rulings, for example "Round 1", "R2_sonnet M4", "ruling 3", "(fixed)", "was X, now Y", "dropped per". `reviews/` keeps that history. Where a ruling decided something, state the outcome as a plain rule: "Tells are local unless a `10` check-form item scores them", not "per round 3 ruling 1".
2. **Give each fact one home.**
   - `02_ENGINE_WORK.md` owns every engine shape: config keys, stage ids, schema and validator changes, the tell table and its rule.
   - `10_CHECK_FORMS.md` owns every check-form item.
   - `01_PIPELINE.md` owns the build steps, seeding (P12), rooms (P5) and generators (P4).
   - `00_README.md` owns the work order, the dependency table, the decisions and the defaults, and the environment.
   - An episode spec owns its content: lines, facts, templates, items, debrief and metadata.

   Where a spec repeats an engine shape, replace the copy with a pointer, for example "the `mistake` block, shape in `02` ENG-04". The one exception is the spec's own filled-in instance of that shape. Keep that, because it is content. Where two files disagree, the owner wins, and the other file is corrected to match.
3. **Preserve verified material byte for byte.** Do not change any JSON snippet, code citation (path, line or symbol), command, id, name, domain or quoted string. The exception is where it contradicts its owner file, or a check you run now proves it wrong. If you do change one, rerun the check: open the code, or run the validator by the method in `R3_sonnet.md`, and say what you ran in your report.
4. **Order every brief for reading.** Use the WRITER_BRIEF section order: the 20-section layout for episodes, and Goal, Read first, Depends on, and so on for the other briefs. Each instruction appears once, in its section. Merge any "addendum", "note" or "update" paragraphs into the section they belong to.
5. **Keep it short where you can, but complete.** Cut repetition and commentary. Never cut content an implementer needs: lines, items, keys, steps or acceptance checks.
6. **Keep the house style.** UK spelling. "cyber security" as two words. No em or en dashes. `.example` domains only. No Hacktivity internals.
7. **Apply the round 3 leftovers in your files:**
   - **E12 and ENG-05a:** the room-move semantics must match exactly: `world.startRoom` = `training_room` = the scenario `startRoom`; `world.room` = `lobby`; the move uses `window.loadRoom`; the learner returns on any outcome. Use the room id `training_room` everywhere. "Studio" may appear only as a narrative description.
   - **Every `§17` in the episode specs:** the validator takes the `scenario.json.erb` file path, not a folder.
   - **`00` §3:** the user's 2026-10-27 decision about `#trigger_minigame` for E12 stays as the recorded decision. Next to it, add the outcome: it is not needed, because `watchCall` is reused.
8. **Report.** List the files you changed, the line counts before and after, every verified item you changed and the check you ran for it, and every contradiction you resolved and which side won.
