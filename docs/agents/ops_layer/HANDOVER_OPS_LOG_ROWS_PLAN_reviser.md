# Handover: OPS_LOG_ROWS_PLAN R2 revision (part done)

Worktree `.claude/worktrees/ops-plan`. Plan `docs/achitechture/OPS_LOG_ROWS_PLAN.md`. Findings
`docs/agents/ops_layer/reviews/OPS_LOG_ROWS_R2.md`. Nothing committed (brief: do not commit). The
plan must read as written once: no review or finding references.

## Done (sections edited)

- 3: stages L1a (helper + event list, no call sites, S), L1b (own rows, M), L2a, L2b, L3 (net rows +
  share_file_read). P2, P3 closed.
- 4.1 maxRows run-time clamp; 4.2 anomaly is seed rows only, settled (old question 5 gone from
  body; still listed in 15, remove it); 4.3 share rows via `where.places`.
- 5.1: Writing paragraph; clock stamp in three places (seed in `initialize_player_state`, sync line
  gated on `player_state.key?('opsLogClockAt')`, bootstrap writer in `prepare_bootstrap_state!`) (F2,
  F4); L1b call sites with per-site save rules (A2, F3, F5, B5, ruling 4); L3 call sites with saves
  and `share_file_read` on `/container` share branch, `once: true`, save only on append (B2,
  ruling 3).
- 5.2: sprite/lighting mapping (V2); container launch path traced: stand-in sprite has
  `objectId: temp_<time>`, so use `scenarioData.id`; `sourceExtras()` gains `sourceRoute` (V1 gap).
- 6: reach check = extracted `container_reach_refusal(located)` shared with `/container` (V1);
  route takes foothold/from; session-gated readers stop answering when the session ends.
- 7: account and typed names render the same normalised form (F5); `-` for unresolved kinds (A3);
  reader minigameData fields reach browser, best effort (V3).
- 8: storage settled in body (G1, ruling 5): row 400 B, typed username 32 chars and 96 B JSON,
  `cut: true` shown `~`, ids >64 = malformed, `MAX_OPS_LOG_BYTES` 128 KB with eviction.
- 9: schema name pattern, validator reads `lib/break_escape/ops_log_events.rb` (A3); share reader
  error removed.
- 10, 11: rewritten (alternation test, merge_limit, once, secret guard walk, clock controller test
  through PUT /sync_state that fails on old design, re-read game in call-site tests, share tests,
  reach tests, verify-run --ops-log in L1a, access-leak-check extended) (P1, A1).

## To do

1. **12 Build steps** (line ~750): rename L1 to L1a/L1b; L1a: `lib/break_escape/ops_log_events.rb`,
   `ops_log.rb`, clock seed/sync/bootstrap, `WITHHELD_SCENARIO_KEYS`, schema/validator, secret
   guard, verify-run; L1b: call sites, `rfid_requires_card`, `already_open` for every rfid,
   `test_ops_logs`; L2a: add `container_reach_refusal` extraction, `sourceRoute` in
   container-minigame.js, game.js:905 texture, lighting.js:434; L3: `/container` share branch.
2. **13.1 helper contract** (line ~801). Rewrite signature:
   `write_log_row!(event, as:, where:, result: 'ok', detail: nil, once: false, merge_limit: nil)`
   returning a `Result` (`appended?`, `merged?`, `stored?` = appended or n raised) or nil. Caller
   rule: a site with no save of its own saves `if r&.stored?`. This answers the privilege plan's
   request (profile read saves at most once: use `once: true`; no separate lookup needed). Comment
   says "in the request that holds the game lock", not "model method" (A5). Detail rule types (A1,
   drop `:text`): closed list (Array of codes), `:integer` (only for counts: register `count`,
   `hashes`), `{ id: kind }` (value must resolve to a known thing of that kind via `KINDS`,
   at most 64 chars and 64 B; shown by name), `{ alias: 'finding' }` (server-made `^[a-z][0-9]{1,3}$`).
   `as`: `{ account: }` must resolve to a declared account; `{ npc: }`/`{ card: }` must resolve;
   `{ typed: }` capped as in section 8 and marked typed. A value that does not resolve = malformed.
   Size: worst row with three 64-char ids about 370 B < 400, so `from` (64-char foothold id) fits:
   keep it on `network_swept`/`host_scanned`.
3. **13.2 steps**: step 2 add secret guard: in test/dev, `OpsLog.secret_values(game)` (passwords,
   PINs, credential values, hashes, MFA answers, lock `requires`; reuse the list builder in
   `tools/playtest/access-leak-check.rb`) scanned against the built row, raise on hit. Step 3 cite
   `login_scope_of` at `game.rb:3182` not `:324` (A5). Step 5 merge (F1): merge into the newest row
   in the source with the same event, `as`, `where`, `result`, `detail` among the newest 10 rows,
   not only the very newest; `merge_limit` stops `n`; `once:` searches the whole source. Step 6
   eviction by class: first evict oldest merged-refusal repeats (rows with result not ok/granted
   and n>1), then oldest other refusals except the first row of each event (first-of-kind kept),
   then oldest ok rows; seed rows never evicted (they are not stored in opsLog). Step 7 byte caps.
   Step 8: never saves, returns Result.
4. **13.3**: rewrite "Bounded" bullet to say what merging bounds and what eviction protects (F1);
   "No secret" bullet points to the mechanical guard; rename the "Not from a sync merge" bullet ok.
5. **13.5**: move `EVENTS` to `lib/break_escape/ops_log_events.rb`; add `OpsLog::KINDS` (kind ->
   display-name lookup and room lookup, filled by owning plan in its stage, fallback `-`) (A3);
   remove `:text`; `mfa_prompt_sent` example has no detail; one line per event registration.
6. **13.7 mapping** (snake_case everywhere, ruling 2). Core (committed, section 13 and request 8):
   `network_swept` (network, `from` id), `host_scanned`, `service_checked` (`service` as
   `{ id: 'service' }`, must resolve, shown by name), `finding_confirmed` (`finding` alias, `status`
   confirmed/false, `how` quiet/probe), `network_alerted` (network, no detail, once per network),
   `technique_refused` (`finding` alias, `technique` id, `reason` closed list; merged; route saves),
   `technique_used` (`finding`, `technique`, `grant` session/credential, `access` user/admin). All
   host-kind events take `pc` too. All core routes save. Privilege (section 13, being revised):
   `admin.profile_read` -> `admin_profile_read` (`{ account: }`, pc, detail `profile` id;
   `GET /container` profile branch has no save: `once: true`, save on `stored?`); `usb.override` ->
   `usb_override` (detail `device` closed list; implant saves, `network_access.rb:535`);
   `credentials.collected` -> `credentials_collected` (detail `count`, `hashes` integers; collect
   saves; repeat writes nothing); `signin.refused` -> dropped, folded into this plan's
   `signin_denied` with optional detail `kind` (`local`, `domain`) registered by the privilege plan.
   No `hash_obtained`, no `domain_account_locked_out` (remove). MFA (committed section 13): read it
   first; accepted rulings: `mfa_code_ok`, `mfa_code_wrong`, `mfa_prompt_sent` with no detail
   (merges into a count), `mfa_challenge` route code only (no credential key), `mfa_prompt_approved`
   `by` owner/held_phone/own_phone, `mfa_expired` detail prompts/codes, `helpdesk_request` `as` may
   be nil, `account_password_reset`, `account_mfa_reenrolled`. State per row whether its route saves
   (S8's new POST routes save). Cracking (S7) writes no rows; ignore its draft list. Skin (S6): none.
   Explain B4 `from` difference: a sweep's source is what a network log records; a sign-in row
   does not hold the route.
7. **13.8 table**: update with save column per row (see 5.1), `signin_denied` blocked = `{ typed: }`
   with `merge_limit: 1`, badge denied `merge_limit: 10`, add `share_file_read` row (L3, `/container`
   share branch, `as` session account, `where` share, detail `file` `{ id: 'file' }`, once, saves on
   append). Remove `hash_obtained` route text.
8. **14 Cross-plan requests**: request 1 (all plans call `assert_ops_log_holds_no_secret` in their
   `test_ops_*` tests; a `logSources` block there needs a `gameClock`); request 2 L1a before all
   first stages, L1b before S3/S5a/S5c/S8 sign-in edits; core: accepted its four points; privilege:
   drop `signin.refused`, register `kind`, use `once:` for profile reads, closed `device` list;
   MFA: request 8 answered (no `request` detail, run merges); cracking: section 13 stale, writes none;
   remove old request 5 ("whichever plan owns share reads").
9. **15 Open questions**: keep Q1 copied card (option d), Q4 NPC/office-life rows (short). Remove
   Q2 storage (settled in 8), Q3 refused sign-ins (settled: save cost known and small, 5.1), Q5
   play-row anomaly (settled no, 4.2). Renumber and fix references to "question 1" in 5.1 and 7
   (still question 1) and any "question 3/5" left (grep).
10. Grep plan for `L1 ` / `(L2)` / `hash_obtained` / `question 2|3|5` / `:text` / `object_unlocked`
    leftovers; check section 2 line 84 badge refusal range and line 140-area text.
11. **Decisions file** `docs/agents/ops_layer/reviews/OPS_LOG_ROWS_DECISIONS.md` (append): F1 option
    "evict non-ok first" taken in a modified form (first-of-kind protected, merge window 10) — not
    declined; nothing declined so far. A4's "stored as given" partly declined: typed text is
    stripped of control characters and cut, because escaped control characters bloat rows.
12. Report: 0 blockers; 7 majors and 14 minors acted on; nits A5, F6 citations fixed; line count.
