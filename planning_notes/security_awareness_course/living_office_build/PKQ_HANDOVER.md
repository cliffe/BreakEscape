# P-KQ handover (Quayholt Insurance kit)

Branch `feat/ca-living-office-w2`, worktree `.claude/worktrees/b-ca-lo-w2`. Stopped at the 200k
context hard limit. Model for any awareness-text edits: opus48.

## Done (committed)

Commit **542b1b495** (swept byte-identical into integrator commit **9df9d0c05** — do not re-add,
just build on HEAD):
- `AW/office_kits/quayholt_insurance.json` — cooler `kit_cooler` (water_cooler1) at explicit
  position (8.2,5.6), useFrom south, capacity 2, chatter "pool"; pool `kit_quayholt` (3 lines);
  Darren/Niamh/Anjali each thirst need + coordinate needsHome + 2 chatterLines. Voices Orus/Leda/Kore.
- `scenarios/_office_kit/ink/{darren_price,niamh_doherty,anjali_rao}_ambient.{ink,json}` — `start`
  (diverts on kit_defend_done + kit_ep), ca00 hello knots (Darren, Niamh, open directly), episode
  knots ca03/05/08/10/16/19 branching on `kit_key_caught` only, sticky exits. Compiled with bin/inklecate.

This commit (lines + gate + this note), explicit paths only:
- `living_office_build/W2_LINES_quayholt.md` — full new-lines table, 26/26 lines (shared 12, stub 14).
- `living_office_build/GATE_D_quayholt.md` — offline results + proof-11 static geometry + live procedure.

Offline checks pass: test_office_kit.py 74 OK; office-kit-quiet-and-stub 1 pass; word cap ≤30; no {var}.

## Open / in progress

1. **Gate D live proofs (3, 4, 11) NOT run** — route to Haiku on :3003 per GATE_D_quayholt.md
   procedure (throwaway `x-w2-kq` detached worktree, fixture row pointing at room_aw_quayholt).
   Static geometry already confirms the cooler footprint (8,5)/(8,6)/(8,7) is free floor and homes/
   path are clear; the only live unknown is the south useFrom stand cell against the east wall —
   if a walker lands in the footprint, move the cooler west (rows 5–7) and record it.
2. **npc-dialog-review (opus48)** — only a self-check done (0/0/0 in W2_LINES_quayholt.md). Formal
   review runs on the whole batch at I step 8.
3. **Voicing** — all lines marked `voiced`; waits for owner yes via AC0 (O2), after the batch review.

## Gotchas

- Shared index race: a sibling `git add` + the integrator's commit swept my staged files. Commit
  with `git commit -m "..." -- <explicit paths>` to avoid it. My files landed intact.
- QS test treats every `caNN` knot (ca00 included) as a `start` divert target — Darren/Niamh need
  `{ kit_ep == "ca00": -> ca00 }` even though ca00 opens directly via currentKnot.
- Line counting (brief 4.1): per person = 1 start + 2 chatter = 3 shared (P-KT convention), NOT 3
  chatterLines. Pool 3. Total shared 12.
- Ink staleness test currently fails on ca02–ca08 host inks — those are sibling H-package files in
  the shared working tree, not Quayholt's; my _office_kit files are in sync.
- Pairs (PLAN 8.3 L461): ca00/08/16/19 Darren+Niamh; ca03 Anjali+Niamh; ca05/10 Anjali+Darren.
