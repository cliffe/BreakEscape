# Handover: OPS_LOG_ROWS_PLAN (S9), planner

Stopped early by the context guard (it reported 150k after about ten tool calls). Nothing is committed.

## Done
- Read in full: `docs/agents/OPS_LAYER_BRIEF.md`, `docs/achitechture/OPS_LAYER_PLAN_OUTLINE.md`, digests D1, D2, D3, D5, D5b (D5b stops at its section 1.6, 86 lines).
- Read `public/break_escape/js/minigames/log-filter/log-filter-minigame.js` lines 1-980 and its method list.
- Created `docs/achitechture/OPS_LOG_ROWS_PLAN.md` with headings only (16 sections: the brief's 15 plus a section 13 for the published helper signature and row-table format).

## Findings so far (verified in code unless marked)
- No server-side event or access log exists anywhere: grep for accessLog, auditLog, eventLog, logRows, badgeLog in app, lib, config, engine JS and the schema finds only log-filter's `audit_log` tab type (`log-filter-minigame.js:359`, `_renderAuditLogTab` at `:1227`, not yet read).
- log-filter is wholly client-side and authored. Columns are hard-coded per `logType` in `LOG_FIELDS` (`:45-63`, only `vpn` and `ics_rdp`), filters in `FILTER_CATEGORIES` (`:65-80`, fixed enum values such as country UK/RO/US/DE/FR). Rows come from `scenarioData.minigameData.logEntries` (`:176-181`) or the synthetic VPN builder (`:93-169`, fixed date 2025-11-03). Built around one authored `anomaly` row to flag (`_isAnomalyEntry` `:885`); the anomaly row gets the class `lf-anomaly-row` (`:663`), so check whether that class is styled visibly (a tell). `stateOverrides` (`:194`, `:250-264`) already mutate rows from globals: the nearest existing hook for "rows that change with play". Command preview prints fake shell lines with hard-coded paths (`:539-603`). Cells use textContent throughout the table (`:666-727`); `displayDashes` on detail values (`:802`). Completion fires scenario actions via `npcManager.setGlobalVariable` (`:1369-1405`), no server call.
- Implication for the design: generated rows need (a) a new `logType` (or a generic column set taken from the row source), (b) filter values derived from the rows rather than fixed enums, (c) a load path from the server (log-filter makes no fetch today), and (d) the anomaly/flag flow must stay optional so a plain "browse the log" use works.
- Storage options to lay out: (1) bounded ring in `player_state` (server-owned key in `ACCESS_STATE_DEFAULTS`, `game.rb:3021-3065`, never in a sync section, cap e.g. 200 like `MAX_NON_ACCOUNT_LOGIN_ENTRIES` `game.rb:3077`); (2) a separate table (new migration: the shared dev DB rule forbids db:migrate without the user, so this is a user question); (3) delivery on request through a new `GET /log_rows?source=&after=` route with a `rev`/cursor like `GET /keyring` (`games_controller.rb:1862-1893`, `rev` digest, `unchanged: true`). Lean: (1) for storage plus (3) for delivery, rows never in the bootstrap, never echoed on write routes.
- Rows should exist only when the scenario declares a log source (new top-level closed block, e.g. `logSources`), so existing scenarios write nothing: proof is a test that a scenario without the block leaves `player_state` byte-identical across the access and network routes.
- Routes that would call the helper (from D1/D2; line numbers must be re-checked in code before citing): `POST /unlock` (`games_controller.rb:1211`, `game.rb:4597 validate_unlock`) for badge swipes at rfid doors; `attempt_login!` success `game.rb:3495-3500` and failure `record_login_failure!` `game.rb:4333-4357`; lockout `add_login_lockout!` `game.rb:4360-4372`; `attempt_credential_login!` `credential_login.rb:22-89`; `claim_login_session!` `game.rb:3527-3585` (claim is physical use of an open screen: decide whether it logs); `logout_session!` `game.rb:3660-3675`; `lock_session!` `game.rb:3836-3858`; plant `network_access.rb:233-288`; unplug `:290-325`; join `:355-398`; implant `:468-548`; `clone_card` `games_controller.rb:1655` (a copy is silent in reality: probably no row). Where possible call the helper in the model method, not the controller, and only on the success or counted-failure branch (never on generic or uncounted refusals, or it becomes an oracle).
- Secrets: a row must never carry a password, a hash, a weakness or finding the player has not got, or a host/network name the player has not reached (networks are server-only, `network_access.rb:18`). Usernames typed by the player on a failed sign-in are player text: plain, capped, escaped.

## Open, in order
1. Read `log-filter-minigame.js:980-1441` (audit_log tab, completion, test state) and `public/break_escape/js/minigames/siem/siem-dashboard-minigame.js` (976 lines; `ALERT_SETS` `:51`, seeded alerts `:80`, localStorage `STATE_KEY` `:5`).
2. Re-verify each helper call site's file:line in code (list above).
3. Check game time: is there a server clock (D4 covers game time; not read). Rows need a time column; if none, use a server sequence number plus the client-reported game minute, marked as display only.
4. Check `docs/IDEAS_BACKLOG.md` "Investigator missions" entry, so nothing blocks it.
5. Fill the plan sections with Edit, one per call.

## Files touched
- `docs/achitechture/OPS_LOG_ROWS_PLAN.md` (new, headings only)
- this note

## Gotchas
- Routes in `with_game_lock` and `set_game` lists (`games_controller.rb:92-108`) conflict on every merge; the helper adds no route of its own except the read route.
- The validator hardcodes server-owned globals in two places (D2 section 2.11); a new state key is not a global, so it should not need that list.
