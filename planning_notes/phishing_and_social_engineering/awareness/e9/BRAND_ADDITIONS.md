# BRAND_SET additions from E9 passwords (2026-10-29)

For folding into `BRAND_SET.md` by the orchestrator (do not edit `BRAND_SET.md` directly). Company: **Tarrowby Logistics** (`tarrowby_logistics`), already in the §2 roster (E2, E6), reused unchanged for E9. No room, brand block, domain or look-alike changes to the roster row.

## Cast

No new cast. E9 reuses two built Tarrowby people:

- **Nilesh Solanki** (host), IT service desk analyst, `nilesh.solanki@tarrowby.example`. 30s, Gujarati-British, grew up in Leicester. Built Tarrowby cast (renamed from Dev Mistry in the E6 defend build). Placeholder sprite `male_telecom` until the PixelLab reset.
- **Colin Mather** (attack target, the colleague the guesser runs against), warehouse manager, `colin.mather@tarrowby.example`. Late 50s, white, West Yorkshire. Built Tarrowby cast (the hiring manager whose vacancy is public in E2; a genuine and impersonated sender in the E6 mobile forms). He fits the game design's "supervisor who uses one password for everything".

Cast diversity across the mission's speaking/named people: Nilesh (Gujarati-British, 30s) and Colin (white, late 50s) differ in ethnicity and age; the learner avatar is `female_office_worker_v2`.

## New fictional names E9 introduces (attack half only)

All fictional; every domain ends `.example`; no homographs.

- **RiverReach Angling** (`riverreachangling.example`): a hobby angling forum Colin used for years, breached, whose password he reused at work. Used only in the attack half (`attack.json` fact `tarrowby_mather_forum` and the `guess` block `reuseStep`). No inbound mail, no cast member.
- **Pennington Rangers**: a fictional amateur football club Colin supports. Used only in `attack.json` fact `tarrowby_mather_team` and as the guess-list token "Pennington".
- **Bramble**: Colin's dog. Used only in `attack.json` fact `tarrowby_mather_pet` and as the guess-list token "Bramble".
- Passphrase game words used in the demo and in defend row 4: `otter`, `ladder`, `crimson`. Game words, not a credential; the attack-half passphrase demo and the row-4 "three random words" option share them.

## Reused third-party brand

- **Fuelr** (`fuelr.example`): the new supplier portal in defend rows 5 and 6. Reused from E6's third-party list. **Note for the orchestrator:** E6 only ever used the scam look-alike `fuelr-rewards.example` (now an unused leftover brand); `fuelr.example` is Fuelr's legitimate domain and is introduced here for the genuine portal sign-up. Fuelr is already on the Tarrowby pre-ship web-search list.

## Name-clash search (`grep -rn "<name>" scenarios planning_notes docs`, 2026-10-29)

- `RiverReach`, `riverreachangling`, `Pennington`, `Bramble`: zero hits anywhere except the E9 implementation briefs (`planning_notes/security_awareness_course/implementation/`, which are these specs). Clean for a new episode.
- `Fuelr` / `fuelr`: existing hits are the E6 fragment and BRAND_SET only (the reuse is intended).
- `Nilesh` / `Solanki`, `Colin Mather`: existing Tarrowby cast (E6); intended reuse.
- `otter`, `crimson`: appear as ordinary words in unrelated mission scenarios (e.g. `m04`, `m05`, `m10`, `sis02`); they are game words here, not names, so no clash.

## Pre-ship web search (required before release, orchestrator to run)

Web-search against real businesses, clubs and products, as the usual check:

- **RiverReach Angling** and **riverreachangling.example**
- **Pennington Rangers** (an amateur football club name)
- **Fuelr** (already on the Tarrowby pre-ship list)

Everyone and every company is fictional; every address and domain ends `.example`.
