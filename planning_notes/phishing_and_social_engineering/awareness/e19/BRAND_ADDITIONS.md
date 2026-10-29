# E19 brand-set additions (Quayholt Insurance)

For `BRAND_SET.md` (Quayholt Insurance additions from E19). The orchestrator folds these
in; do not edit `BRAND_SET.md` from here (AGENT_RULES_CONTENT.md). All people and
companies are fictional; every address and domain ends `.example`; no homographs.

E19 reuses the existing Quayholt organisation slots from
`modules/core_07_malware_ransomware_and_updates/concepts.md` and adds three new fictional
names plus one reused supplier look-alike.

## New names (each needs the P11 pre-ship web search before ship)

- **TidyDocs** (`tidydocs.example`) — a fictional document app that an email invites the
  learner to connect (defend row 1, `e19_consent_unknown`, the normal-looking "allow this
  app" phish of the consent mirror pair). Invite sent from `invites@tidydocs.example`. No
  cast member, no inbound reply, no art.
- **Leo Brennan** (`leo.brennan@quayholt.example`) — operations colleague, mid 20s, white
  Irish-English; slips, reports fast, is thanked. From the `03_WORLD_AND_CAST.md` no-clash
  pool. Used text-only as the panicking colleague in defend row 3 (`e19_ransom_note`): a
  message, no sender NPC, no art. New to the awareness cast.
- **Fake "Quayholt IT Support"** on the look-alike address `quayholt-it-support.example`
  (defend row 5, `e19_disable_protection`), from `support@quayholt-it-support.example`.
  Reuses the Quayholt look-alike shape pattern established by E5/E8 `_brandAdditions`; not
  a real Quayholt domain. Confirm the exact look-alike spelling matches the E5/E8 Quayholt
  look-alike register when those additions are folded in.

## Reused (existing Quayholt slots or earlier-episode additions; no new name)

- **Quayholt Protect** — the core_07 Quayholt security-software slot (mistake beat
  `security_alert`; concept card; defend rows 5). Existing slot.
- **Quayholt Files** — the core_06/core_07 Quayholt file-store slot, "the file store IT
  rolled out" (defend row 2, `e19_consent_quayholt_files`, the genuine half of the consent
  mirror pair; also the backup location in the montage). Existing slot. The genuine consent
  invite is sent from `apps@quayholt.example` ("Quayholt Apps").
- **Extension 4444 / the "Report an incident" form** — the core_07 Quayholt report-route
  slots (defend row 3; debrief report-route slot). Existing.
- **Fernside Catering** (`fernside.example`), sent from the look-alike
  `fernside-invoices.example` (defend row 4, `e19_enable_content`, the unexpected
  enable-content document). Reused from E10's `_brandAdditions` supplier. **E10 is not yet
  built**, so confirm the look-alike shape against E10's additions once E10 lands: E10's
  OSINT uses the portal shapes `orders.fernside.example` (genuine) and
  `orders-fernside.example` (look-alike). If the invoices look-alike shape clashes with
  E10's chosen register, align E19 to it, or fall back to a generic external supplier on a
  look-alike address (per E19 spec section 5).

## Name-clash grep (across `scenarios planning_notes docs`, run 2026-10-29)

Searched: `TidyDocs`, `tidydocs`, `Leo Brennan`, `leo.brennan`, `Fernside`, `fernside`,
`quayholt-it-support`, `Quayholt Protect`, `Quayholt Files`.

- **TidyDocs / tidydocs** — hits only in `implementation/00_README.md` and the E19 brief
  (`episodes/E19_malware_and_updates.md`). No other entity uses the name; no clash.
- **Leo Brennan / leo.brennan** — hits in `03_WORLD_AND_CAST.md` (the no-clash pool that
  assigns the name), `00_README.md`, the E10 and E19 briefs, and several `modules/*/
  game_design.md` files that draw on the same pool. All are the designated pool name; no
  clash. Leo is not used elsewhere in a built scenario.
- **Fernside / fernside** — hits in the E10 brief and `core_08` game design (the supplier
  this look-alike comes from), plus `00_README.md` and `02_ENGINE_WORK.md`. Expected
  reuse, not a clash. Confirm the look-alike register against E10 at build (above).
- **quayholt-it-support** — hits only in the E19 brief. No clash.
- **Quayholt Protect / Quayholt Files** — existing Quayholt organisation slots, used
  across core_06/core_07 docs. Expected; no new name.

## Pre-ship (P11)

Before ship, web-search **TidyDocs**, **Leo Brennan** and **Quayholt IT Support /
quayholt-it-support** against real businesses and people with the usual check, as for E8's
Marsden Holloway. The repo grep above covers the internal name-clash step only.
