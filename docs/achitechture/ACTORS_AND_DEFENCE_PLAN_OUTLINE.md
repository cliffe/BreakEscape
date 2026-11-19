# Actors and defence: plan outline

Status: outline, 2026-11-19, parked. To be fleshed out and planned later (user, 2026-11-19). Split
out of `OPS_LAYER_PLAN_OUTLINE.md`, whose stage numbers these keep (S0, S10, S12).

Source: the user's picks of 2026-11-18. Pick E1: a rival hacker NPC should be able to play the game
dynamically using the same techniques as the player, which could be the basis for multiplayer
later; and a team of characters (co-op, or all controlled by one player) with different starting
items. Pick E2: an NPC attacker. Pick C5: a defender console, in small steps, starting from how a
player could read and manage the setup the scenario describes. The plan should weigh what works
for the architecture and for play.

## What this plan can rely on

The ops layer outline defines its new moves (scan, check, confirm, technique cards, escalate,
harvest, crack) as data with `needs`, `effects`, `time` and `noise`, behind one server route, for
the player only. This plan opens that registry to other actors and brings the older built moves
into it.

## Stages

### S0. Actors and the full action model — pick E1
- Define a **technique** as data: `needs` (reach, room, held item, credential, privilege, session,
  global), `effects` (foothold, session, credential, finding, global, item), `time` (game minutes on
  the needs clock), `noise` (recorded now, used by a later alert stage).
- Define an **actor**: the player, a teammate (S10) or a rival NPC (S12). Every technique is
  performed by an actor; state that today belongs to "the player" (footholds, sessions, keyring)
  becomes per actor, with the player as the default actor so nothing existing changes.
- Bring three built moves into the ops layer's registry without changing behaviour: plant a drop
  box (N1), remote sign-in (N2), implant (N10). This proves actors against working features.
- **Test:** unit tests of needs and effects evaluation; the N1, N2 and N10 test scenarios and
  `demo_access_tour` pass unchanged. Size M.

### S10. Team of characters — pick E1 (team)
- A scenario can field several player characters, each with a starting kit (lockpicks, a BadUSB,
  a card copier, a laptop). The player switches control; uncontrolled teammates wait or follow.
  Each is an actor (S0), so footholds, sessions and items are per character.
- Co-op with a second human is a later step on the same actor model.
- **Test:** `test_ops_team`: an item only one kit holds is needed to progress; switching keeps
  each character's state across a reload. Size L.

### S12. Defence, in small steps, then the rival — picks C5 (P3), E2 (P2)
- S12a **Read the organisation**: an admin console object that shows the scenario's own setup:
  people and roles, access lists, policies, networks, hosts, weaknesses. Read only.
- S12b **Change it**: the console edits a whitelisted set (grant or revoke a role, toggle a policy
  field, mark a weakness fixed, enable MFA) within a budget. Staff react through the existing
  needs, frustration and workaround systems.
- S12c **Rival NPC** (pick E2): a seeded planner picks techniques whose needs hold, from the same
  registry, and an NPC sprite walks to where the technique happens. In an attack game it races the
  player; in a defence game it attacks the setup the player configured.
- S12d **Working day and debrief**: run the day, then show what the rival reached, what work was
  blocked, and the log rows (S9).
- **Test:** `test_ops_defend`: a fixed seed reaches a known host with default settings and fails
  once one named control is on. Size L overall.

## Open questions

1. Where the rival NPC's planner runs. On the server is authoritative and ready for multiplayer;
   on the client fits how NPC routines run today. A server planner with the client moving the
   sprite is the likely answer.
2. Teammates while not controlled: wait, follow, or run a simple routine.
3. How much of the existing per-player state (footholds, sessions, keyring, inventory) has to move
   to per-actor state, and how saved games migrate.
4. Which of the social engineering and physical moves (pretext call, tailgate, card copy) a rival
   NPC can perform, since those run through ink and client systems today.
