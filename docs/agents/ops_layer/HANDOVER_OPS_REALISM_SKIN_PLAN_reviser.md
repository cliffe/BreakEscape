# Handover: OPS_REALISM_SKIN_PLAN reviser, after review round 3

Written 2026-11-19 when the reviser passed its context limit. Nothing is committed. Work in
`.claude/worktrees/ops-plan`.

## Files touched (uncommitted)

- `docs/achitechture/OPS_REALISM_SKIN_PLAN.md`: 1058 lines before, 1123 now.
- `docs/agents/ops_layer/reviews/OPS_REALISM_SKIN_DECISIONS.md`: a "Round 3" section appended.
- This note.

## Done

Every R3 finding has its content edit in the plan (see the Round 3 table in the decisions file
for what was fixed differently):

- M1: pending guard in the scene's `perform` (5.2, "One press, one request"), `pending` on an
  offer, the Terminal's pending line, parity test 10, live double-press check in 11.6.
- M2: parity test 9 rewritten as per-step comparison (result and state) with one extraction
  rule.
- m1: "Unplug goes through the renderer" in 5.2; `UNPLUGGING_TEXT` in section 2, the layouts,
  `TERMINAL_ONLY_TEXT` note and test 9; one `[data-unplug]` per skin.
- m2: the note removed; "Quiet or noisy" paragraph in 5.3; request 1 to core (`noiseNote`).
- m3: `DRAG_EVENTS` exported by the Panels renderer; test 1 and the bridge use it.
- m4: `network.storePick(name)` in 11.5; section 10 check 3 rewritten; no storage-state file.
- m5: section 14 rewritten: an "Agreed with the core" table by section name, four requests.
- m6: `normaliseAnswer` in live run step 3.
- n1 to n5, and the seven trim-list items.
- Coordinator note: thirteen refusal codes read from core's `ops_refusal_codes.json`;
  `no_grant` and `network_only` in the layouts, test 5 and the format test; noise at zero
  ("Noise 0 of N") in the noise line rule, fixtures and beats T3, T4.

## Open

1. **End-to-end read not done.** The plan was edited section by section and never reread
   whole. Read it once in ranges and fix contradictions. Places most likely to disagree:
   - section 7 ("Test 9 of section 11.2 checks both directions", and the noise bullet) against
     the new test 9 and the zero-noise rule;
   - 5.3 quick commands: test 9 expects a quick command to carry the Panels control's `title`;
     5.3 does not yet say the button has one. Add it to the quick-commands bullet;
   - the 11.2 paths table and test 2 against the guard (a `pending` offer has no path);
   - section 3's K1 row, section 10's K1 row and step 2 of section 12 on what K1 changes;
   - 11.4 beats T5 to T9 noise counts (they were right before; T3 and T4 now start at 0 of 3);
   - any leftover "quiet or noisy note" wording (grep `note`), and "request N" numbers (only
     "section 14, request 1" should remain, twice).
2. **Length.** Target under 1000; now 1123. Candidates: section 2's table rows that restate
   core (the six "Core:" rows could cite sections more briefly), the 11.5 "What keeps existing
   playtests working" bullets, 5.2's control-list prose, section 4's order-of-skin notes, and
   test 9's prose.
3. **Overlong prose lines** to reflow: 629, 787, 793, 990.

## Gotchas

- Core is committed at 1693 lines; cite it by section name only.
- `network_only` is treated as reachable from this view only through an `open` on a stale row.
  That is a reading of core 5.4, not something core states about the network view.
- The plan must not mention reviews or rounds. The decisions file may.
- Only the plan and the decisions file are to be written; do not commit.
