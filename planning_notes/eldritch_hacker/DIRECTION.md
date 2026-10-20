# SAFETYNET: Eldritch Hacker — direction (decisions so far)

Status: agreed with the user, 2026-10-20. Every planning session for the second game, the Season 1
finale and the universe bible update reads this first. Change it only when the user changes a
decision, and date the change.

> **PROVISIONAL: narrative specifics await a universe-bible pass (decided 2026-10-20).**
> The shared universe bible (`story_design/universe_bible/`) needs further iteration before final
> narrative decisions are made. Until that pass is done, everything below about the antagonist cell
> (the Quantum Cabal / Tesseract Research Institute is only the current candidate), the cast, the
> mission list, the wording of the Architect's reveal, and how real the monsters are against the
> bible's current "ambiguous supernatural" rule (`01_universe_overview/setting.md` ~L195-203) is
> **provisional**. Do not treat any of it as canon, and do not write final mission scripts, cast or
> bestiary entries from it. The firm decisions are the structural ones: two games, Eldritch Hacker
> is browser-only social engineering, build order, and what sits where. Do not edit the bible from
> this folder; the bible pass is the first work item (see "Open").

## The two games

| | SAFETYNET: Licence to Hack (game 1) | SAFETYNET: Eldritch Hacker (game 2) |
|---|---|---|
| Focus | Narrative + real exploitation on VMs | Social engineering: OSINT, phishing, pretexting, infiltration |
| Missions | m01–m08 near final; m09–m10 finish the story. Ship this game first | New mission set (count to be planned, provisional) |
| VMs | Required: every mission needs its VM flags | None: browser-only, no required VM flags (the "missions require VM flags" rule belongs to Licence to Hack, not the franchise). No VM side operations are planned |
| Antagonist | ENTROPY and its cells, the Architect | Provisional: the Quantum Cabal (ENTROPY cell), its front the Tesseract Research Institute, and what they serve |
| Tone | Spy thriller | Pulp cosmic horror (Dunwich Horror, Arkham Horror) where the player can prevail |

## Eldritch Hacker: what the game is

- **Grounded in real cyber security.** Social engineering techniques and their defences are modelled
  accurately and judged openly (the phishing/SE systems in `planning_notes/phishing_and_social_engineering/`).
  Model, don't weaponise: teach reasoning and red flags, never working attack tooling.
- **Mission objectives** revolve around identifying cult members, investigating the cult, and
  joining it undercover; disrupting rituals; and ultimately stopping Cthulhu from awakening.
- **Mechanics:** the SE suite (OSINT browser, intel board, phishing rules engine, mail/DM client,
  pretext calls with an NPC suspicion meter, landing-page builder, inbox-triage defender), plus the
  physical kit from m01–m08 reintroduced through the game: lockpicking, PIN cracker, RFID cloning,
  fingerprint dusting and spoofing, and the others the engine already has.
- **Two layers of the Cabal:** the Tesseract Research Institute is a corporate front (staff email,
  sender authentication, payloads, sign-in pages — the corporate SE material fits here); the cult
  itself is social (members' posts, forums and direct messages, a membership gatekeeper, forged
  invitations, rituals).
- **Monsters are real** in this game: Lovecraftian creatures including Star Spawn (essentially
  Cthulhu at a scale that fits a room). The player can win — pulp, not nihilist.
- **Narrator voice:** more Lovecraftian in wording (dread, the ancient, the unnameable), but pulpy and
  readable, never purple to the point of obscuring a clue. Same SAFETYNET universe and cast — Agent
  HaX and the others continue.
- **No retrofit into Licence to Hack m01–m08.** The phishing/SE systems are not added to those
  missions. The optional m01 "Soft Entry" fold-in in `phishing_and_social_engineering/designs/12`
  is shelved and marked superseded there.
- **Fun and educational, not hard** (standing rule). Engaging puzzles and narrative, same design
  approaches and skills as game 1, with universe differences.

## Season 1 finale (m09–m10) as the bridge

- m09–m10 resolve Licence to Hack with **player success**: the player stops the ENTROPY Architect
  and a number of cells.
- They also **reveal the eldritch aspects** that become the basis of game 2. The Architect reveals
  that they don't need him to continue their work.
- m09–m10 are Licence to Hack missions, so they keep that game's rules (VM flags required).
- A single phishing/pretext stage in m09 or m10 can debut the SE systems as the Cabal teaser
  (preferred over retrofitting m01, which stays frozen). This is optional, and only worth doing if
  the SE systems exist by then (see build order).
- The Architect's reveal wording is provisional until the bible pass.

## Positioning

- Hacktivity Games is the studio; SAFETYNET is the franchise.
- Licence to Hack is the VM-backed flagship ("real hacking on real VMs"). Eldritch Hacker is
  "real social engineering, practised for real": browser-only, built for Steam and a broad audience.
- The serious line, Incident Simulations: Critical Cases, is separate and stays corporate; the
  phishing-awareness product belongs there, not in the SAFETYNET games.

## Build order and product lines (decided 2026-10-20)

1. Ship Licence to Hack m01–m08, then m09–m10.
2. Build the SE systems (`phishing_and_social_engineering/designs/00`–`07`) through the
   browser-only student lab (`designs/10`), the first shippable SE product. The module has one
   slot for a technical lab; the browser-only lab takes it, with no VM companion.
3. The same systems then become Eldritch Hacker's core and the awareness product.
4. The awareness product sits under the separate "Incident Simulations: Critical Cases" line, not
   SAFETYNET, and stays corporate-skinned.

## Design-level fit of the SE systems to a cult setting (review, 2026-10-20)

- Re-skin well: OSINT browser, pretext call (suspicion meter), intel board, rules engine.
- Need a DM/feed variant: mail client and inbox triage.
- `senderAuth` is email-only, so it belongs to the Institute layer; cult-world tells must sit
  beside it.
- The landing-page builder needs its weaponisation check repeated for any new skin.
- Suggested structure: the Institute as a corporate layer (email, sender auth); the cult as the
  social layer (members' posts, gatekeeper, forum/DM).

## Open (not yet decided)

- **First: the universe-bible pass** (do this before any final narrative decision; edits go in
  `story_design/universe_bible/`, not here). Questions it must settle:
  1. Is the Quantum Cabal / Tesseract Research Institute the antagonist cell for game 2, or does
     another cell or a new one fit better?
  2. How real are the monsters? The bible says eldritch elements are ambiguous and never confirmed
     (`01_universe_overview/setting.md` ~L195-203); game 2 wants them real. Options: ambiguous
     through Season 1 and confirmed by the m10 reveal, or another reconciliation.
  3. The wording and staging of the Architect's reveal in m09-m10 (they don't need him to continue).
  4. The cast for game 2 and which Season 1 characters return.
  5. Timeline placement of game 2 after the Season 1 finale, and the narrator voice rules.
  6. A bestiary (Star Spawn at room scale up to Cthulhu) and the cult's structure and vetting,
     which drive the social engineering missions.
  Mission list and mission count follow this pass.
- Mission count and structure of Eldritch Hacker (after the bible pass).
- Monster encounter mechanics (what "prevailing" over a Star Spawn looks like in this engine).
- VM side operations: none planned (decided 2026-10-20). The SE VM plan
  (`planning_notes/MAYBE-LATER-phishing_and_social_engineering_secgen/`) is parked and out of scope,
  kept for reference. If ever revisited, C6 (campaign forensics, existing modules, no victim bot) is
  the cheapest candidate.
