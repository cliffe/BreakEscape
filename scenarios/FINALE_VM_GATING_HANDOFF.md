# VM gating: game-side hand-offs (concept level)

Extracted from the opus48 VM gating audit (2026-10-22), which lives with the VM plan and must not be opened by Opus 5.5 agents. These sections contain no VM or technique detail. User rulings F12/F13 (FINALE_DEV_LOG.md, 2026-10-22): each VM step needs an in-game find; story artefacts live on the VM too; a player must never hold a flag they can't yet submit. F13 supersedes the Educational R1 removal of the disarm/notice references.

### A5. Game-side hand-off for m09 (concept level — no VM/technique detail)

For the game builders. Add two in-game finds and one line; no exploit, command or technique:

1. **Catalogue account password (gates flag 1).** Put a **sticky note / login slip in the reading-room drop-desk drawer** holding the catalogue service account's name and password. Gate its readability behind the existing reading-room access (Noor's card / front desk) so it is a found object, not free. The **drop-screen hint and HaX's flag-1 steer should name the account** so the player knows which login the note is for. (Mirrors the user's own example.)
2. **Tomb Beta account password (gates flag 3, fixes the name-peek).** On the **enrolment binder already in the salvage-cage crate** (S:2395-2425), add the web service account's name and password as a readable line. HaX's flag-3 steer should point the player at "the enrolment record in the cage" for the login. Because the cage is the end of the long chain, this guarantees flag 3 cannot be taken before the identity scene.
3. Keep HaX's steers conceptual (as they already are). No change to the memo/notice tasks.

---

### B5. Game-side hand-off for m10 (concept level — no VM/technique detail)

For the game builders. Four in-game finds and a decision to surface to the user:

1. **Monitoring login (gates flag 1).** Add a **maintenance tag/credential at the gate console** in the forward post naming the monitoring account. HaX's monitoring steer should name the account.
2. **Release-host credential (gates flag 3).** Add an **operative credential object in the server hall or workshop** (behind the power-room card). HaX's hatch steer should point at it.
3. **Core-host access key (gates flag 4).** Add a **core access key in the gallery** (or have Tesseract hand it at the core door), available only after the gallery stair. HaX's core steer should point at it.
4. **Re-add the two VM-artefact references (F13).** The Educational R1 pass removed the lines that said the **disarm** is on the release host and the **unsent notice** is on the core host. F13 (2026-10-22) asks for both to be seeded on the VM, so the game needs a story reference again — e.g. HaX's hatch steer naming the disarm on the release host, and Tesseract/HaX naming the notice as sitting on the core host. **Flag this conflict to the user/orchestrator before the game edit:** F13 reverses an Educational R1 decision, and the wording should be chosen so it reads as "found on the box" without becoming an exploit hint. **(Resolved for the release host in B6 below.)**

### B6. m10 puzzle-chains R3 answers: the disarm wording and flag 2 (concept level)

Two R3 questions (`scenarios/m10_full_disclosure/PUZZLE_CHAINS_REVIEW_R3.md` m2 and §5), answered so the game and VM agree.

**1. The disarm conflict.** In the game, the disarm *action* happens at Tesseract's core console. So the release host must not hold "the disarm" itself. Story resolution: the release-host artefact is the release service's **kill / arming configuration** — how the six o'clock release is armed and what would stop it. The player recovers it on the release host; only the core console can act on it. This keeps an F13 artefact on the release host and matches the game.

- **File + knot:** `scenarios/m10_full_disclosure/ink/m10_phone_agent0x99.ink`, knot `hatch_topic`. Replace the single line `His disarm sits on that box.` (currently the F13-restored line) with the wording below. Keep the surrounding lines (the container line, and the duty-card find line) as they are. Leave it **unvoiced**, like the rest of the support-hub lines — no new TTS.
- **HaX replacement line (24 words, HaX's voice):**

  > The release's kill config is on it — how six o'clock is armed, and what stops it. The switch itself is on his console, upstairs.

  (So the full hatch topic reads: "…Get out of the container onto that host. The release's kill config is on it — how six o'clock is armed, and what stops it. The switch itself is on his console, upstairs. One of his operators dropped a duty card by the east racks. The login's on it.")
- No change to `box_topic` or to Tesseract's lines; the core-host notice reference is handled there and stays.

**2. Flag 2 has no in-game find.** Correct, and it needs none. Flag 2 (the staging schedule) sits on the same monitoring host as flag 1, behind the same `secmon` login, so it is **gated by flag 1's find** (VM-internal, the way m01 flags 2–4 chain off flag 1's foothold). The build requirement that makes this true: the threat-data store must sit **behind the monitoring login**, not on a public/pre-login page. No new in-game object. HaX's existing flag-2 steer (the hall-console guide offer) is enough. **(Superseded by B7 — flag 2 now gets its own find.)**

### B7. m10 flag 2 gets its own find (concept level) — reverses B6 item 2

Puzzle-chains R4 (`scenarios/m10_full_disclosure/PUZZLE_CHAINS_REVIEW_R4.md` M1) found that B6's VM-internal gating still breaks F12: because flag 2 sits behind flag 1's login on the same machine, a player can take it at the forward post (flag 1's room) and carry it through five rooms to the release console (depth 5). Fix: **flag 2 needs its own in-game find, near the release console.**

- **Game-side find (the builder places it).** Add one found object in the **server hall, by the release console** (flag 2's submit station) — e.g. the release console's **staging / schedule-copy log-in card**, or a note in the hall's release area — holding the account the player uses to pull the staging copy. HaX's existing flag-2 steer (the hall-console guide offer) should point at it. Because the find is in the submit room, flag 2 can no longer be obtained early.
- **What the login opens, at story level:** the staging copy of the release schedule, held on the bunker's monitoring host. (So the game label can say so.)
- **VM-side (in the plan / draft notes).** A separate account **`staging`** on the monitoring host, fixed password **`Staging!Copy25`**, with the staging copy of the schedule in its `0600` home; not readable by the other accounts or a pre-login page. Flag 1's login no longer gates flag 2.

---

