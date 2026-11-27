# E18 brand additions (credential attacks at scale, Merrin & Sallow Architects)

P11 brand-set entry for E18. The orchestrator folds this into `BRAND_SET.md`; do not edit `BRAND_SET.md`
here. E18 is the organisation-scale twin of E9, set at the built **Merrin & Sallow Architects**
(`merrin_sallow`, `merrinsallow.example`, wordmark `MERRIN & SALLOW`, accent `#8a5a2b`), reusing the built
E4 room `room_aw_merrin_sallow`. Everyone and every company is fictional; every address and domain ends
`.example`; no homographs.

## Company and room

No new company. Merrin & Sallow Architects and its room are built (E4). E18 reuses the brand block exactly:
`{ "name": "Merrin & Sallow Architects", "logoText": "MERRIN & SALLOW", "accent": "#8a5a2b" }`, domain
`merrinsallow.example`, built look-alikes `merrin-sallow.example` and `merrinsallow-studio.example`.

## Cast

### New named character (one, one new art set)

| Person | Role | Age, background | Address | Used in |
|--------|------|-----------------|---------|---------|
| Ama Owusu (host) | Security lead on Merrin & Sallow's outsourced IT and security provider, Fenlow Managed IT | 40s, Black British (Ghanaian heritage); warm, practical | `ama.owusu@fenlow.example` (spoken of as the provider's security contact) | Host; welcome, per-item feedback and debrief; voices the organisation's controls as the provider's (role_03). Genuine sender in defend rows 1 and 6 (as Fenlow Managed IT). Placeholder sprite `female_scientist` (talk `female_scientist_talk.png`, visemes `female_scientist_visemes.png`) until the PixelLab reset. |

Ama Owusu is drawn from the `03_WORLD_AND_CAST.md` no-clash name pool ("Ama Owusu, information security
manager; 40s, Black British, Ghanaian heritage; warm, practical"), the retired Larkspur mentor now kept only
as a reusable name (`core_15` explicitly retires/remaps the old Larkspur cast). She is new to the **built**
cast and is the practice's first IT/security host, which is why role_03's organisation-scale controls have a
natural voice. The user may overrule this and reuse **Lorna Easton** (E12 facilities lead, zero new art) with
the controls voiced as "what our IT provider has set up", or **Julian Sallow** (E4/E14 host, art exists); see
E18 section 20.

### Roster reused by name only (no new cast, no art)

The harvested staff list is the built Merrin & Sallow cast, used by name only and assembled into
`firstname.lastname@merrinsallow.example` addresses by the attack half's harvester. No new cast, no art.

- **Catherine Merrin** (Managing Partner), **Julian Sallow** (Partner), **Yasmin Chaudhry** (Finance
  Controller), **Thandiwe Moyo** (Studio Manager): built E4 cast.
- **Dani Fenwick** (Junior Architect): built E14 cast (late 20s, mixed British/Filipino heritage; he/him).

The accounts that "open" in the spray and stuffing panels are shown as a **count**, never pinned on a named
colleague (no-blame).

## New companies and fictional words (all fictional, all `.example`, pre-ship web search owed)

| Name | Domain / form | Used for |
|------|---------------|----------|
| Fenlow Managed IT | `fenlow.example` | The practice's managed IT and security provider; Ama's employer. Genuine sender of the precautionary lockout notice (defend row 1) and the breach-monitoring notice (defend row 6). (If the user prefers reusing **Northlight Security**, the E12 red-team firm, to avoid a new company name, note Northlight is a testing firm rather than a managed IT provider; see E18 section 20.) |
| (free breach-checker scam) | `breach-check-now.example` | The scam host shown as the `page.url` of the fake breach-checker page (defend row 5). No cast, no inbound mail; learnable added-word/hyphen shape. |
| Calderbank Mills | website word | A fictional current project; word-list token `project` (`Calderbank` -> `Calderbank2026`). |
| Elmgate Pavilion | website word | A second fictional project named on the Projects page (texture; not a word-list token). |
| "Design that lasts" | website word | The practice's strapline; word-list token `motto` (`DesignThatLasts` -> `DesignThatLasts1`). |
| Verrow Street | website word | The studio's street; word-list token `place` (`Verrow` -> `Verrow!`). |

The word-list season/year literal `Autumn2026` is a baked game string, not a name. Passphrase-demo game words
(`harbour`, `ladder`, `crimson`) are game words, not a credential and not names.

## Name-clash search (`grep -rIl "<name>" scenarios planning_notes docs`, 2026-10-29)

- **Ama Owusu / Owusu:** hits only in the awareness planning docs: `03_WORLD_AND_CAST.md` (the pool),
  `04_BUILT_SO_FAR.md` and `research/built_episodes_vs_plan.md` (the retired Larkspur world),
  `implementation/00_README.md` (the E18 pre-ship list) and
  `modules/core_15_generative_ai_and_deepfakes/game_design.md` (the note retiring the Larkspur cast,
  including Ama Owusu). **No built scenario, ink or engine file.** Clean for a new host.
- **Fenlow, Calderbank, Elmgate Pavilion, Verrow, "Design that lasts", breach-check-now:** hits only in
  `implementation/00_README.md` (the E18 pre-ship list) and E18's own files. **No built scenario.** Clean.
- **Dani Fenwick / Fenwick:** built E14 cast; expected hits only (E14 files and the healthcare module's
  unrelated Arthur Fenwick). Intended reuse.
- **Catherine Merrin, Julian Sallow, Yasmin Chaudhry, Thandiwe Moyo:** built E4 cast; intended reuse. (Note
  the pre-existing Moyo near-miss: E2 has Tendai Moyo, E4/E18 has Thandiwe Moyo; different companies, already
  recorded in BRAND_SET.)

## Pre-ship web search (required before release, orchestrator to run)

Web-search against real businesses, projects and people, with the usual check:

- **Ama Owusu**, **Fenlow Managed IT** (and `fenlow.example`), **breach-check-now.example**
- **Calderbank Mills**, **Elmgate Pavilion**, the strapline **"Design that lasts"**, **Verrow Street** (the
  projects and strapline especially, as they read as names)

Everyone and every company is fictional; every address and domain ends `.example`.
