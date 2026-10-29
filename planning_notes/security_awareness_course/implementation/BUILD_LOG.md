# Build log: awareness episodes E8 to E20 and the work packages

Started 2026-10-29. Orchestrator: Opus 5.5. Plan: `00_README.md` (work order §4, routing §6, checks §8, done §9). One section per wave; every review round gets a severity table; every decision a line with its reason.

## Routing

- Engine packets (`02_ENGINE_WORK.md`): `general-purpose` Sonnet, each in its own git worktree, merged by the orchestrator. Bridges run on main after the merge (the keyless :3001 server serves the main tree, not a worktree).
- Content (fragments, erb content, ink, items, debrief copy) and content reviews: `opus48`.
- Wiring (P2 skeleton, P4 to P12): Sonnet. Scripted bridge reruns and searches: Haiku; a Sonnet run confirms any failure.
- Review phases after each episode builds, as the built product ran them: design review C1+ (`scenario-design-review`), dialogue review C1+ (`npc-dialog-review`), playtests (Sonnet personas, reload, blind), light puzzle-chain pass where gating changed, rooms/lighting/POV for new rooms only. Fresh reviewer each round; fixer resumed; stop when a round finds nothing above minor (at least 3 rounds, at most 5).

## Wave 1 (2026-10-29)

| Agent | Model | Work | Files it owns |
|---|---|---|---|
| eng-a | Sonnet, worktree | ENG-01, ENG-09b, ENG-09d (+ their ENG-08 rows) | episode runner, debrief, guards |
| eng-b | Sonnet, worktree | ENG-03a, ENG-03b (+ ENG-08 rows) | triage page states, landing-page builder fakeCheck |
| eng-c | Sonnet, worktree | ENG-04 (+ ENG-08 rows) | consequence `mistake` stage, montage flip |
| eng-d | Sonnet, worktree | ENG-09a, ENG-11 (+ ENG-08 rows) | triage `choice` kind, sort drill overlay |
| content-e8 | opus48 | E8 P1 fragments, host ink, full-erb content | `AW/e8/`, E8 ink |
| content-checks | opus48 | `general_v2` 20 items (10_CHECK_FORMS) | the new check fragment |
| content-wp | opus48 | WP-12 Part B (core_17 annual), WP-15 | annual fragment, E3/E6 swap items |

Decisions:
- Four engine agents in parallel rather than serially: the packets are opt-in on separate keys, so conflicts are limited to shared lists (`STAGE_IDS`, schema, validator); the orchestrator resolves them at merge.
- `data_conduct` waits on P5b (Carrholme room); it starts with E11.
