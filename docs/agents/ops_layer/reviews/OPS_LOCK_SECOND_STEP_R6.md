# OPS_LOCK_SECOND_STEP_PLAN.md, review round 6 (delta)

Reviewer: Sonnet 5.5, 2026-11-19. Delta 8f88a8588 read in full, plus plan sections 9 (484-530),
10 (538-556), 11 (558-640). Code read: `social_feed.rb:190-221, 255-273`,
`access_work.rb:150-185`, `game.rb:1999-2062` (`npc_defeated?`, `npc_ko_claimable?`,
`ko_claimable_room_npc_ids`), `owner_claim.rb:70-76`, `player-combat.js:13-17`,
`npc-hostile.js:334-345`; MFA plan 403, 766-777, 841.

Counts: 0 blocker, 0 major, 1 minor, 2 nit. Nothing above minor. R5 M1 and m1 are closed.

## R5 closure

- **M1**: closed in substance. Headless records and declared grants are gone from the walk,
  with the reason; `itemsHeld` is gated by offer or not-`koImmune`; the unit test is turned
  round (562-565); Dana is `koImmune` with no give (616-617); B10 states the warning and the
  dashed edge (638). Dana, B10 and `dana_cabinet` appear at 499-500, 616-620 and 638 only, and
  all agree: `push_number_match`, off the critical path, so no task needs it and the finding
  is a warning, not an error (525-526 "only a warning"), which is what B10 says.
- **m1**: closed in text (545-552); see n1 below for what stays loose.
- Nits (rewrap, name `dana_cabinet`): `dana_cabinet` named. Rewrap only partly done (n2).

## Minor

### m1. "Counts a device exactly when the game lets the player hold it" over-counts two cases

Plan 502-508 ties "not `koImmune`" to the MFA plan's "nobody can get" test. The server's own
gate for an NPC's `itemsHeld` is "story offers it, or `npc_defeated?`" (MFA plan 403), and
`npc_defeated?` needs `npc_ko_claimable?` (`game.rb:1999-2003`), which needs the NPC in
`ko_claimable_room_npc_ids`: a room NPC that is not `koImmune` **and not `npcType: "phone"`**
(`game.rb:2050`, `:2059`, comment at `:2026`: "a phone NPC listed in a room, such as m03's
handler holding a keycard, has no sprite to fight"). The game also cannot punch anybody when
the scenario sets `disableAttacks: true` (`player-combat.js:13-17`;
`owner_claim.rb:73-74` already treats it as "no knock-out"). The plan's rule has neither
exclusion, so:

- a `phone_friendface` or `code_device` in a phone NPC's `itemsHeld`, no offer, not
  `koImmune`: plan says takeable, server refuses the add (no KO claim possible);
- the same in a scenario with `disableAttacks: true` (the SIS serious games set it): plan
  says takeable, the player cannot knock anybody out; only a crafted post gets it, which the
  server accepts after a forged KO record for a non-`koImmune` NPC.

Both errors are in the safe direction for the author (a lock that never passes is missed, so
no warning or dashed edge is shown), and neither touches Dana, the worked example. "Exactly"
is the overstatement. The MFA plan's validator row (841) has the same gap, so this is a
shared-helper question, not only this plan's.

**Fix.** Either soften 502-503 to "as the server's gate does" and name the `npcType: "phone"`
exclusion in the rule (the helper reads `ko_claimable_room_npc_ids`'s test: `koImmune != true`
and `npcType != 'phone'`), treating `disableAttacks` as a deliberate server-side blind spot;
or also read `disableAttacks`, as `OwnerClaim.precise_route` does. Add one unit case for the
phone-NPC `itemsHeld` with no offer ("never passes"). If the helper lives in the MFA plan,
list the widening in section 14.

## Nit

- **n1.** Golden script (545-552). "Room-walk order from the start room" is not defined for
  the script: the `generate_dungeon_graph.rb` walk, `rooms` hash order and `doors[]` order can
  each give a different sequence, and the order matters once the posts change stored state
  (`unlockedObjects`, doors opened). Both sides run the same script so a mismatch cannot hide a
  regression, but a spec that cannot say which order it used is hard to rebuild. Add "rooms
  breadth-first from `startRoom` through `doors[]` in file order, objects in `objects[]` order,
  `contents` after their container". Also say what happens to descendants of a refused
  ancestor (posted anyway and recorded refused, or skipped). The fixtures themselves are
  buildable: all five scenarios exist, `test_simple_success` has no locks (the text now says
  so), none uses `rand`, `shuffle` or `SecureRandom`, and the right answer for `key`, `rfid`
  and `lockpick` locks is fixed by the `requires` item the test places.
- **n2.** Two delta lines are still over the wrap width of the rest of the file: 542 (139
  chars, "...(2) The shared mechanism of the core plan's section 10: this plan adds") and 620 (149
  chars, the `dana_cabinet` / G2 `records_room` line). Rewrap both. Also 503-504 says the
  offer is read from the NPC's "story"; `npc_offers_item?` reads the story plus the NPC's JSON
  record minus `itemsHeld` (`access_work.rb:176-186`), so "its story or record offers" is
  exact.

## Elsewhere in the plan

Nothing broken. Section numbers and cross-references are intact (205 "section 9", 576
"section 9", 651 "section 10", 703 "section 9", headings 1 to 15 unchanged). File is 745
lines, as the cap says. Lines 211 and 463-465 still list headless records and declared grants
for `second_step_ids` and the validator walk; that is a different walk (every authored home,
whatever the player holds) and is right to keep them. The unit-test statement at 562-565
matches the rule at 502-508 (offering NPC takeable, `koImmune` NPC with no offer never,
headless record and declared grant never).

## Verdict

Stop. One minor (text edit or a one-line rule addition) and two nits; no further round needed.
