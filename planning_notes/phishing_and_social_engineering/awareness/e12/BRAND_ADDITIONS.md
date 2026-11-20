# BRAND_SET additions from E12 visitor and tailgater (2026-10-29)

For folding into `BRAND_SET.md` by the orchestrator (do not edit `BRAND_SET.md` directly). Company:
**Merrin & Sallow Architects** (`merrin_sallow`), already in the §2 roster (E4), reused for E12. Brand
block `{ "name": "Merrin & Sallow Architects", "logoText": "MERRIN & SALLOW", "accent": "#8a5a2b" }`;
domain `merrinsallow.example`; look-alikes `merrin-sallow.example`, `merrinsallow-studio.example`. No
roster row change. E12 adds a second room (`lobby`) and two new M&S cast; the roster "episodes" note
could gain E12 beside E4.

## Cast

Two new Merrin & Sallow front-of-house people (distinct from the E4 M&S cast: Catherine Merrin, Tomás
Carvalho, Yasmin Chaudhry, Julian Sallow, Thandiwe Moyo, Oskar Berglund, Leah Abramson):

- **Delphine Arvanitis** (lobby pretext mark), Front-of-House Coordinator, `reception@merrinsallow.example`.
  50s, Greek-Cypriot British, fifteen years on the desk. The courier talks past her and she buzzes the
  badge door. She carries the person-chat influence conversation (`character: "delphine"`, record
  `delphine_reception`, `npcType: "person"`, `"unlockable": ["training_room"]`). Placeholder sprite
  **female_telecom_v2** (person-chat portrait/talk) until the PixelLab queue produces her art. Her true
  new-character cost is one art set (she cannot reuse, being the pretext mark).
- **Lorna Easton** (studio kiosk host), Reception & Facilities Lead, `lorna.easton@merrinsallow.example`.
  40s, white, north-west England. She welcomes the learner at the kiosk, carries the per-item feedback and
  the debrief, and holds the N16 done-event `eventMappings`. She needs no influence bust, so she **reuses a
  built sprite**: placeholder **female_office_worker_v2** (talk `female_office_worker_talk.png`, visemes
  `female_office_worker_visemes.png`). Confirm the reuse sprite with the art schedule; the name stays.

Red-team persona (brief and debrief framing only, not a world NPC):

- **Jo Fairweather**, Northlight Security, the authorised ethical social engineer who recurs as the
  course's red-team persona across the module `game_design.md` files (consistent use, not a clash). Appears
  only in the seeded brief and strings.

Cast diversity across the mission's named people: Delphine (Greek-Cypriot British, 50s), Lorna (white,
north-west England, 40s), Yasmin Chaudhry (British Pakistani, 40s, named on the expected-client item); the
learner avatar is `female_office_worker_v2`. Catherine Merrin (late 50s, white English) is reused by name
only in the attack-half OSINT and is not met.

## New fictional names E12 introduces

All fictional; every domain ends `.example`; no homographs.

- **Northlight Security**: Jo Fairweather's firm, the authorised red-team supplier. Brief/strings only.
- **Maintenance-contractor firm** (`.example`): the firm named on Merrin & Sallow's service contract.
  Referenced on defend item 3 only (the fire inspector's claimed firm fails to match this one). Invent a
  plain `.example` name (for example `pennine-facilities.example`); it is named, never a sender.
- **Fire-safety firm** (`.example`): the firm the fake fire-safety inspector claims to be from on defend
  item 3. Invent a plain `.example` name (for example `safewardfire.example`); the two names must not match.
- **Badge door / "the studio"**: the design-studio fiction is carried by the room's `door_sign`, not by a
  room id; the kiosk room id stays `training_room` and the attack room is `lobby`.

The retired `core_10` draft name **Maureen Gallagher** is NOT reused; `BRAND_SET.md` bars `Gallagher`.

## Name-clash search (`grep -rn "<name>" scenarios planning_notes docs public/break_escape/js`)

- `Arvanitis`, `Delphine`, `Easton`, `Lorna`: no conflicting hits (clash check done 2026-10-28; `Easton`
  and `Lorna` returned zero hits). All clean for new cast.
- `Northlight Security` / `Fairweather`: recurring red-team persona across the module `game_design.md`
  drafts; intended consistent use, not a clash.
- `Merrin`, `Sallow`, `merrinsallow`: existing E4 Merrin & Sallow roster and fragment; intended reuse.
- `Catherine Merrin`: E4 managing partner; intended reuse by name only (OSINT post).

## Pre-ship web search (required before release, orchestrator to run)

Web-search against real businesses, firms and people, as the usual check:

- **Arvanitis** (as a Merrin & Sallow staff name) and **Easton** (likewise)
- **Northlight Security** (a security firm name)
- the two invented `.example` firm names chosen for defend item 3 (the maintenance contractor and the
  fire-safety firm)

Everyone and every company is fictional; every address and domain ends `.example`.
