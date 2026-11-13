# E16 brand-set additions (Quayholt Insurance)

For `awareness/BRAND_SET.md` (the orchestrator folds these into the Quayholt cast; do not edit
`BRAND_SET.md` directly). E16 is a consequence-flip-plus-defend episode at the built **Quayholt
Insurance** brand (`quayholt_insurance`, `quayholt.example`, wordmark `QUAYHOLT`, accent `#6b4c9a`),
host **Anjali Rao**. All people, companies and domains are fictional; every address ends `.example`.

## New cast (three)

| Person | Role | Age, background | Address | Used in |
|--------|------|-----------------|---------|---------|
| Ross Garside | Senior account manager (leaver) | 50s, white, north-east England | `ross.garside@quayholt.example` | The leaver; the favour and last-day login beats; defend row 4 (`e16_leaver_favour`). Liked, passed over last spring, joining a competitor; "they're my contacts". Not a villain. |
| Samira Nawaz | Account handler (the false lead) | 40s, British Pakistani | `samira.nawaz@quayholt.example` | The colleague the office whispers about; innocent. Her father is in hospital this week. The `samira` sandbox beat and the montage's final, kind resolution; the debrief "seen, said, true" row. Never marked as a failure for being suspected. |
| Craig Pickering | Account handler (the rumour) | 30s, white, Bristol | `craig.pickering@quayholt.example` | The lunch-room theory (`rumour` sandbox beat). Likeable and ordinary, not malicious. |

**Samira surname:** Nawaz, **not** the `core_14/game_design.md` default "Haddad". "Haddad" clashes with a
character in the deduction sidecar fixture B and appears widely in the SAFETYNET scenarios (m09/m10 and
others); an in-repo grep on 2026-10-29 confirmed the clash. If the orchestrator prefers Haddad, the
deduction fixture must be checked first (E16 section 19/20).

## People reused (built Quayholt cast, no addition)

- **Anjali Rao**, information security analyst (`anjali.rao@quayholt.example`), the host (BRAND_SET §3).
- **Reuben Ofori**, claims handler (`reuben.ofori@quayholt.example`), defend row 2, the genuine colleague
  who makes the borrow-a-login ask (built in E3, reused in E8).
- **Hana Novak**, claims handler (`hana.novak@quayholt.example`), defend row 6, the genuine, slightly
  pushy locked-out caller of the mirror pair (built Quayholt cast, the E5 target).

## Non-cast fictional handle (one, not in the roster)

- **"Opportunities"** — the unknown messaging contact behind the outside offer (defend row 1 `e16_offer`
  and the `outside_offer` sandbox beat). A stock-style avatar, **text only, never voiced, never a real
  brand**, and deliberately kept distinct from E14's "Jordan Vale". It is a messaging handle, not a
  person in the roster and not an email address.

## Domains

- No new company domains. E16 uses Quayholt's own `quayholt.example` and the **built** look-alike
  `quayholt-support.example` (BRAND_SET §3; defend row 5 `e16_it_approve`, the normal-looking phish half of
  the mirror pair). No new look-alike is added.

## Diversity note

The three new cast span 30s to 50s and mix white north-east English (Ross Garside), British Pakistani
(Samira Nawaz) and white Bristol (Craig Pickering), beside the built Quayholt cast already in the brand:
Lebanese-British (Leila Nassar), white Bristol (Darren Price), Scottish (Gordon McLeish), Indian (Anjali
Rao), Czech-British (Hana Novak), plus Reuben Ofori. The episode takes care that the whispered-about
colleague (Samira Nawaz) is innocent and easily cleared with a kind word, so suspicion does not track a
stereotype.

## Name-clash grep (2026-10-29)

`grep -rIl` across `scenarios planning_notes docs` for "Ross Garside", "Garside", "Samira Nawaz",
"Nawaz", "Craig Pickering" and "Pickering": the only hits are the E16 planning documents themselves
(`implementation/00_README.md`, `modules/core_14_insider_risk/game_design.md`). No collision with other
scenarios, other new episodes or the check forms, including the names those use (Marcus Webb, Marcus
Hale, Dermot Lynch, Ayaan Warsame, Reuben Ofori).

## Pre-ship (owed)

Web-search "Ross Garside", "Samira Nawaz" and "Craig Pickering" against real businesses and public
figures, with the usual check, before ship. Not done here (flagged for the orchestrator).
