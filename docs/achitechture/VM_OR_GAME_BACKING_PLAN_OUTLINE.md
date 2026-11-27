# VM or game backing: plan outline

Status: outline, 2026-11-19, parked. To be fleshed out and planned later (user, 2026-11-19). Split
out of `OPS_LAYER_PLAN_OUTLINE.md`, whose stage number it keeps (S11).

Source: the user's pick Q3 of 2026-11-18: keep the option of VM-backed or game-backed systems. For
example m01 would have a VM version with its real flags, and could have a game alternative.

## What this plan can rely on

The ops layer outline (S1 to S3) gives a game-backed host its services, weaknesses, findings and
technique cards. Real VMs, the VM launcher and flag submission work as they do in m01 to m10 today.
SecGen and VM work routes to opus48.

## Stage

### S11. VM or game backing — pick Q3
- `backing: "game"` (default) or `backing: { "vm": ..., "flags": [...] }` on a host. A VM-backed
  host shows the VM launcher and its scan, check and technique card steps are replaced by submitting the VM flags; the rest
  of the chain (footholds, sessions, keyring) is shared.
- Pilot: an m01 game alternative alongside its VM version, after release. SecGen work routes to
  opus48.
- **Test:** one host run both ways in `test_ops_backing`. Size M to L.

## Open questions

1. How a VM-backed host's flags map to the effects a game-backed technique card would grant.
2. Whether backing is chosen per host, per scenario or per game event, and who chooses (the author,
   the organiser, or the player).
3. Whether one scenario file serves both versions, or the game version is a variant file.
4. How lab sheets and walkthroughs cover two versions of one mission.
