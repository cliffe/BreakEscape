# Actors and defence: plan outline

Status: outline, 2026-11-19, parked. To be fleshed out and planned later (user, 2026-11-19). Split
out of `OPS_LAYER_PLAN_OUTLINE.md`, whose stage numbers these keep (S0, S4, S10, S12).

Source: the user's picks of 2026-11-18. Pick E1: a rival hacker NPC should be able to play the game
dynamically using the same techniques as the player, which could be the basis for multiplayer
later; and a team of characters (co-op, or all controlled by one player) with different starting
items. Pick E2: an NPC attacker. Pick C5: a defender console, in small steps, starting from how a
player could read and manage the setup the scenario describes. The plan should weigh what works
for the architecture and for play.

## What this plan can rely on

The ops layer outline builds scan, check, technique cards, privilege, cracking and MFA as separate
features with their own server routes, for the player only, with no shared model of moves (user,
2026-11-19). The game has not treated actions as a separate idea so far. This plan is where that
idea would come in, if a rival NPC or a team needs it: S0 below would define moves as data and
bring both the ops layer features and the older built moves under it. Whether that is the right
shape is the first thing for this plan to decide.

## Stages

### S0. Actors and the full action model — pick E1
- Define a **technique** as data: `needs` (reach, room, held item, credential, privilege, session,
  global), `effects` (foothold, session, credential, finding, global, item), `time` (game minutes on
  the needs clock), `noise` (recorded now, used by a later alert stage).
- Define an **actor**: the player, a teammate (S10) or a rival NPC (S12). Every technique is
  performed by an actor; state that today belongs to "the player" (footholds, sessions, keyring)
  becomes per actor, with the player as the default actor so nothing existing changes.
- Bring three built moves under the new model without changing behaviour: plant a drop
  box (N1), remote sign-in (N2), implant (N10). This proves actors against working features.
- **Test:** unit tests of needs and effects evaluation; the N1, N2 and N10 test scenarios and
  `demo_access_tour` pass unchanged. Size M.

### S4. Patch windows from office life — pick B4
- Parked here (user, 2026-11-19) because it belongs with the defence work: it is one case of the
  organisation's defensive position being updated and changed during play, which S12b does from
  the player's side. Plan the two together, so a patch by a staff routine and a fix made at the
  defender console are the same change.
- An IT admin NPC routine sets a weakness's `fixedIf` global on a schedule (needs clock). Patched
  weaknesses stop granting; held sessions are kept (as outages do, N7).
- **Test:** extend `test_ops_access` with a timed patch; office-life regression on the needs
  scenarios. Size S.

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

### Unsettled ideas handed over from the ops layer (user, 2026-11-19)

Not yet designed. The ops layer only logs these actions (its log rows plan, S9) and nothing
reacts to them.

- **Staff and defenders react to what the player does** (ops picks SHARED-1): collecting a
  cached sign-in or using admin rights risks detection; a careful account owner reacts to
  repeated approval prompts on their phone; an owner reacts after the helpdesk resets their
  account.
- **A cost for the scan, check, confirm and use loop** (ops pick CORE-4): in the ops layer,
  confirming a finding and trying a technique card are free but logged. A later version could add
  evidence that settles a finding quietly, a noise count per network, a noisy "probe" for a
  confirm without evidence, and an alert flag at a network's limit that the scenario acts on.
  This fits with S12's defender console and the rival.

## Open questions

1. Where the rival NPC's planner runs. On the server is authoritative and ready for multiplayer;
   on the client fits how NPC routines run today. A server planner with the client moving the
   sprite is the likely answer.
2. Teammates while not controlled: wait, follow, or run a simple routine.
3. How much of the existing per-player state (footholds, sessions, keyring, inventory) has to move
   to per-actor state, and how saved games migrate.
4. Which of the social engineering and physical moves (pretext call, tailgate, card copy) a rival
   NPC can perform, since those run through ink and client systems today.
