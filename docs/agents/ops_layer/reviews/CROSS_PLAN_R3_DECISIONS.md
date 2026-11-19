## Cross-plan R3 fixes (2026-11-19)

- Y1: the unchanged-scenario helper, folder and capture rake task (`ops:unchanged:capture`) move to LOG L1a (build step 8); CORE step 1 uses them; PRIV, LOCK and the brief point to LOG.
- Y2: LOG L1a owns the helper spec (strips empty `ACCESS_STATE_DEFAULTS` keys, freezes the clock); PRIV and CORE point to it.
- Y3: MFA uses the full knock-out test (not `koImmune`, not `npcType: "phone"`, no `disableAttacks`); MFA and LOCK say the server gate (`game.rb:2045-2059`) reads the first two and `disableAttacks` is the client refusal mirrored in `owner_claim.rb:73-74`.
- Y4: MFA drops the "declared grant is too easy" warning; grants never count as held.
- Y5: MFA M1a owns `MfaModel.held_item_sources`; MFA checks and LOCK call it; its unit cases moved to MFA tests; LOCK adds only `lock_step_never_passes?`.
- Nits: Y6 and Y7 applied in LOG, Y8 in SKIN (snapshot path named).
