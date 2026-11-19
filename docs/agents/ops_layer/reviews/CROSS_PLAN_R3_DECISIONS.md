## Cross-plan R3 fixes (2026-11-19)

- Y1: the unchanged-scenario helper, folder and capture rake task (`ops:unchanged:capture`) move to LOG L1a (build step 8); CORE step 1 uses them; PRIV, LOCK and the brief point to LOG.
- Y2: LOG L1a owns the helper spec (strips empty `ACCESS_STATE_DEFAULTS` keys, freezes the clock); PRIV and CORE point to it.
- Y3: MFA uses the full knock-out test (not `koImmune`, not `npcType: "phone"`, no `disableAttacks`); MFA and LOCK say the server gate (`game.rb:2045-2059`) reads the first two and `disableAttacks` is the client refusal mirrored in `owner_claim.rb:73-74`.
- Y4: MFA drops the "declared grant is too easy" warning; grants never count as held.
- Y5: MFA M1a owns `MfaModel.held_item_sources`; MFA checks and LOCK call it; its unit cases moved to MFA tests; LOCK adds only `lock_step_never_passes?`.
- Nits: Y6 and Y7 applied in LOG, Y8 in SKIN (snapshot path named).

## R3 remaining checks (Y9 to Y15)

- Y9: MFA gives `POST /helpdesk/request` a closed `{ success: false, reason }` list (`bad_request`, `not_found`, `unavailable`, `blocked`, `refused`); the `/mfa/*` boolean style stays and its stated reason now names only those routes.
- Y10: PRIV names `#container` (profile branch, after the reach check passes and contents are served) as the `admin_profile_read` site and lists it; LOG says `container_reach_refusal` writes no rows, so `/log_rows` never writes it.
- Y11: LOCK's closed-step guard runs before L1b's refused `badge_swipe` row, so no row is written below a closed step; LOG's refused bullet notes the S8c guard.
- Y12: MFA M1a's lockout-key site list adds `record_login_failure!` and `add_login_lockout!`.
- Y13: MFA states the 403 and 404 bodies of `/mfa/device` and `/mfa/phone` in the `{ success: false, error }` style; LOCK points to them.
- Y14: no change (nit; nothing conflicts).
- Y15: LOG L1a capture spec and LOCK golden script: answers come through real routes, test setup may seed the inventory directly, identically on main and branch.
