# BRAND_SET additions from E10 downloads and fake checks (2026-10-29)

For folding into `BRAND_SET.md` by the orchestrator (do not edit `BRAND_SET.md` directly). Company: **Quayholt Insurance** (`quayholt_insurance`), already in the §2 roster (E3, E5), reused unchanged for E10. No room, brand block, domain or look-alike changes to the roster row. E10 **extends E5** at the same company and room (`room_aw_quayholt`), with the same host.

## Cast (all reused; E10 introduces no new person)

- **Niamh Doherty** (host), internal communications officer / the room's IT trainer, `niamh.doherty@quayholt.example`. Mid 20s, Northern Irish, quick and friendly. Built Quayholt cast (E5's host). Placeholder sprite `female_telecom` until the PixelLab reset. The only room NPC in E10.
- **Leila Nassar** (the IT explainer, voiced in copy, not placed), Quayholt IT service desk agent, `leila.nassar@quayholt.example`. Mid 20s, Lebanese-British. Built Quayholt cast (the E3 phone NPC; the genuine sender of `ga_laptop_swap` in `e5/defend.json`). She is **not** placed as a room NPC (a second room NPC would change the room layout and the mission NPC block); her three web habits are carried by the concept panel and Niamh's framing lines, attributed to Leila in copy.
- **Leo Brennan** (the attack-half colleague, phish target `order_colleague`), operations colleague, `leo.brennan@quayholt.example`. Mid 20s, white Irish-English. **Already built and in BRAND_SET.md §3** (added by E19, where he is the panicking colleague in `e19_ransom_note`). E10 reuses him as the colleague who places the weekly Fernside order and meets the built fake check in the flip. (attack.json gives his role as "Operations assistant"; align with BRAND_SET's "operations colleague" if the orchestrator prefers one label.)

Cast diversity across the mission's named/speaking people: Niamh (Northern Irish, mid 20s), Leila (Lebanese-British, mid 20s) and Leo (white Irish-English, mid 20s) are all built Quayholt cast; the learner avatar is `female_office_worker_v2`.

## Brands and domains E10 uses (all `.example`; no homographs)

- **Fernside Catering** (`fernside.example`; order portal `orders.fernside.example`): a small family catering supplier Quayholt orders through. **Already in BRAND_SET.md §3** (added by E19, which notes the portal shapes `orders.fernside.example` genuine and `orders-fernside.example` look-alike come "from the E10 plan"). E10 is where those shapes land: the attack-half fake check sits on Fernside's genuine (compromised) portal, and defend rows 1-2 use it. From the core_08 Quayholt slots in `concepts.md`.
- **`hauliernews.example`** (`news.hauliernews.example`): a fictional industry-news site. Defend row 3 is a genuine news page carrying a fake "your browser is out of date" banner. New name; no repo hits.
- **`secure-alert.example`, `addons.example`, `downloads.example`**: throwaway scam / store hosts for defend rows 5 (full-screen alarm), 6 (extension store) and 7 (dangerous download). Not real brands; generic.
- **Software (teaching only, from the core_08/core_07 Quayholt slots):** **Quayholt Apps** (the staff software portal), **Quayholt Protect** (security software), **DocShift** (the approved PDF converter in Quayholt Apps). Report route: the browser Report button, the "Report an incident" form, or the security team on extension 4444.
- **Pagewright** (`pagewright.example`; advert look-alike `pagewright-download.example`) and **Ashby Supplies** (`ashbysupplies.example`; look-alike `ashby-trade-login.example`): named in the core_08 module docs. **Not used in any E10 item**; carried here only so the brand set stays aligned with the module material, and swapped to `.example` (see the domain-swap note). Drop them from the fold if the orchestrator prefers to list only names E10 ships.

## Domain-swap note (open question 2)

The core_08 module docs write real-TLD vendor domains: `pagewright.co.uk` / `pagewright-download.com`, `ashbysupplies.co.uk` / `ashby-trade-login.com`. The awareness product rule is every domain ends `.example`, so all are swapped to `.example` here (`pagewright.example`, `pagewright-download.example`, `ashbysupplies.example`, `ashby-trade-login.example`). **Confirm the swap and run the pre-ship web search** on Pagewright, Fernside Catering and Ashby Supplies.

## Name-clash search (`grep -rn "<name>" scenarios planning_notes docs`, 2026-10-29)

- **Leo Brennan / `leo.brennan@quayholt.example`**: already built in E19 (`awareness_e19_malware_and_updates`) and in BRAND_SET §3. Intended reuse; same address, no disagreement.
- **Fernside / `orders.fernside.example` / `orders-fernside.example`**: hits are E19's fragment and BRAND_SET (which flags them as "from the E10 plan"), plus the core_08 module docs. Intended reuse; E10 lands the portal shapes.
- **`hauliernews`, `secure-alert.example`**: zero hits anywhere. Clean for a new episode.
- **`pagewright-download`, `ashby-trade-login`, `ashbysupplies`**: hits only in the core_08 module docs (real-TLD), swapped to `.example` here.
- **Niamh Doherty, Leila Nassar, Quayholt Apps, Quayholt Protect, DocShift**: existing Quayholt cast and software slots (E3/E5 and the module docs); intended reuse.

## Pre-ship web search (required before release, orchestrator to run)

- **Pagewright** and **pagewright.example** / **pagewright-download.example**
- **Fernside Catering** and **fernside.example**
- **Ashby Supplies** and **ashbysupplies.example**
- **hauliernews.example** (industry-news site name)

Everyone and every company is fictional; every address and domain ends `.example`.
