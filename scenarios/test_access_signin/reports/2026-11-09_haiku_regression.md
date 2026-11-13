# test_access_signin: Haiku scripted regression, 2026-11-09

Two scripted runs of `PLAYTEST.md` on the keyless server (:3001), each on its own new game, with
`verify-run.rb --access` and `access-leak-check.rb` after every beat. Every beat passed. The
findings below are about task mappings and the run notes, not the beats themselves.

## Run A (game 10): S1 to S4, then a reload

| Beat | Result | Server record |
|---|---|---|
| S1 Account tiles | PASS | `sessions 1: hot_desk = sam (password)`; `signedInPcs` has `hot_desk`; `loginFailures 0` |
| S2 Known people only | PASS | no change |
| S3 Typed username and the access list | PASS | `sessions` adds `ian_pc = ian (password)`; `signedInPcs` gains `ian_pc`; `loginFailures 0` |
| S4 One profile, two PCs, and switching | PASS | `sessions: hot_desk = ian (password); ian_pc = ian (password)`; `loginFailures 0` |
| Reload | PASS | sessions kept after the reload; `sessions` and `signedInPcs` the same as before it |

Leak check: no leaks over all the run's responses.

## Run B (game 9): S5 to S8

| Beat | Result | Server record |
|---|---|---|
| S5 Copy and Move | PASS | `copiedItems 1: ian_rota`; the rota and the VPN notes in the inventory |
| S6 Locked folder and sign out | PASS | `hot_desk` gone from `sessions` (`ian_pc` stays); `ian_archive` unlocked |
| S7 Lockout | PASS | `loginLockouts 2: lockout_pc\|sokafor; lockout_pc\|nobody` (the real and the invented username counted alike); `sessions` has `lockout_pc = ian (password)` |
| S8 Reload | PASS | records identical before and after the reload |

Leak check: no leaks over 85 responses.

## Findings and outcome

| # | Finding | Severity | Outcome |
|---|---|---|---|
| 1 | `s4_switch_user` completed when Ian signed in at `hot_desk` in Run B's set-up, with no switch | medium | Fixed. `pc_signed_in` now carries `previousNpcId` (the account signed in at that PC just before, else null); S4 needs `data.previousNpcId === 'sam'` |
| 2 | `s1_account_tiles` completed when Sam signed in at `hot_desk` in S7 step 5 | low-medium | Fixed. `pc_signed_in` now carries `firstAtPc` (no sign-in at that PC before in this game, `signedInPcs` included); S1 needs `data.firstAtPc === true` |
| 3 | Other mappings checked for the same looseness | | S6 could complete on a Switch user away from Ian after the archive opened: `pc_signed_out` now carries `reason` (`sign_out`, `switch`, `no_session`, `claim_ended`) and S6 needs `reason === 'sign_out'` and `npcId === 'ian'`. S8 now also checks `npcId === 'ian'`. S2, S3, S5 and S7 already complete only from their own beats |
| 4 | `PLAYTEST.md` S8 step 3: Ian's kept session at `lockout_pc` opens his desktop first | doc | Fixed: Switch user before choosing Sam. Also noted that a reload starts the player in the lobby and that `signedInPcs` means "ever signed in at", not "signed in now" |
| 5 | After the reload, `interact` on `ian_pc` went through the interaction menu | | Not a duplicate. The menu listed "Ian's PC" and "Cup of coffee": the room's coffee cup (`office-misc-cup`, 26 px above the PC) is in reach from where the player stood after the reload. Only one `ian_pc` sprite exists. Before the reload `moveToNear` had already reported the cup as a menu candidate; the player stood further south then |

Checked after the fixes on games 11 and 12 (headless, :3001): Ian signing in at `hot_desk` with no
one there left S4 open; after Sign out, Sam's later sign-in there left S1 open; the switch from Sam
to Ian completed S4; on a new game Sam's first sign-in through his tile completed S1. Leak check on
both games: no leaks found.
