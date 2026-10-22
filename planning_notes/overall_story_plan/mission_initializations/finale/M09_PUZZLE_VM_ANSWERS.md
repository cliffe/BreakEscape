# m09 puzzle-chain VM questions: answers

2026-10-22. Answers to the two VM questions the m09 puzzle-chains review could not settle game-side (`scenarios/m09_digital_archaeology/PUZZLE_CHAINS_PLAN.md` §11 items 0 and 1). Both are answered at story / game-design level from the VM plan material, not from a built box. Sources: `finale/FINALE_VM_PLAN.md`, `finale/SECGEN_DRAFT_NOTES.md`, `finale/STAGE_8_VM_ANSWERS.md`, and the SecGen draft `SecGen/scenarios/break_escape/safetynet/m09_digital_archaeology.xml`. No exploit or technique detail is given: positions only, as the plan itself states them. Nothing has been built, so anything the build decides is flagged for the user.

---

## Q1. Can the H&L file number be read on the VM before flag 2 is submitted?

**Answer: No.** The H&L box password (the file number) lives in the same file as flag 2 and in the same place, so it cannot be reached before flag 2's work is done.

Where it is settled:
- `FINALE_VM_PLAN.md` §1 flags table, row 2: flag 2 is the Insider Threat Initiative ledger, placed in **root's home on the catalogue server**, reached only after the flag-1 foothold and a privilege step.
- `SECGEN_DRAFT_NOTES.md` m09 table, row 2 and the XML `catalogue_server` block: the ledger file in root's home is where flag 2 sits. Flag 1 (the catalogue index) sits in a service account's home at user level and carries no file number; nothing is exposed before login on the catalogue service.
- So the number and the flag are in one root-level file. A player cannot read the number without having reached the point that yields flag 2. The worry behind §11 item 0 — a first-time player opening the H&L box before flag 2, so Torres' P2 rings never fire — does not arise from the VM: the number is strictly behind flag 2.

What is still for the user at build time:
- **The ledger text is not yet seeded.** `SECGEN_DRAFT_NOTES.md` ("Story text not written into the scenarios") records that flag 2's file currently carries only the flag string; the ledger body (23 placements, 47 candidates, WREN's day-10 entry, and the H&L file number itself) is not written in. The build must place the file number **inside flag 2's file in root's home** and nowhere reachable earlier — not on the flag-1 catalogue index (user level) and not on any pre-login catalogue page. If it were placed earlier, the box could open before flag 2 and the answer above would flip.
- **One in-game sequencing window remains, and it is already covered.** Reading the ledger hands the player the number and the flag string at the same instant; there is a brief window where a player holds the number but has not yet walked back to submit flag 2 at the station. That is a game-side ordering matter, not a VM one, and P7 (Torres' `room_exited` fallback) is the plan's catch for exactly that player.

---

## Q2. Do any physical clues in the salvage cage feed flag 3 on the VM?

**Answer: No.** Flag 3's path is entirely VM-side. Nothing the player finds in the in-game salvage cage (the "Issued to: Strategy Directorate" property label, the enrolment binder) is needed to reach flag 3. The game treats those as story only, and the VM expects nothing brought from the room.

Where it is settled:
- `FINALE_VM_PLAN.md` §1 flags table, row 3: flag 3 is the owner's credential on **Tomb Beta's server**, in the web service account's home, proving who owns the machine. It is reached by working that machine.
- `SECGEN_DRAFT_NOTES.md` m09 table, row 3, and the XML `tomb_beta_server` block: the credential (naming Dr Adrian Tesseract), the enrolment record and the flag all sit together in the web service account's home, seeded **on the VM**. Flag 3 reads no input from the game; it is self-contained.
- So the plan places flag 3 wholly behind the VM work on Tomb Beta's machine, independent of the salvage cage. §11 item 1's conditional — "if the VM expects the player to bring something from the room, HaX's flag-3 steer should say so" — does not apply, because the VM expects nothing from the room.

What is still for the user at build time:
- **Nothing structural.** The seed content (credential, memo, vendor notice) is drafted into the XML already; the build just confirms it lands in the web service account's home beside flag 3.
- **Optional story-consistency note (not a VM dependency).** The cage's physical label reads "Issued to: Strategy Directorate"; the VM credential reads "Issued to: Dr Adrian Tesseract". They are different records (a property tag versus a staff credential) and need not match, but the user may want to confirm they don't read as contradictory when both appear in one mission. No VM step hangs on it.

---

## Five-line summary (story level)

1. Q1: No — the H&L file number sits in flag 2's own file in root's home on the catalogue server, so it cannot be read before flag 2's work is done; the §11 fear does not arise from the VM.
2. Q1 settled by FINALE_VM_PLAN §1 (flag 2 = ledger in root's home), SECGEN_DRAFT_NOTES m09 table, and the XML `catalogue_server` block.
3. Q1 open for the user: the ledger body (including the file number) is not yet seeded — the build must place it inside flag 2's root-home file only, never on the flag-1 index or any pre-login page; P7 already covers the in-game submit-later window.
4. Q2: No — flag 3 is reached entirely on Tomb Beta's server (credential in the web service account's home); no salvage-cage clue feeds it, so HaX's flag-3 steer needs no "bring something" line.
5. Q2 settled by FINALE_VM_PLAN §1 (flag 3 row), SECGEN_DRAFT_NOTES m09 table, and the XML `tomb_beta_server` block; only an optional label-vs-credential consistency check is left, with no VM step depending on it.

---

# Scenario-design-review R1 VM questions: answers

2026-10-22. Answers to the three VM questions in `scenarios/m09_digital_archaeology/SCENARIO_DESIGN_REVIEW_R1.md` ("For the user", items 1-3), which the game-side reviewers cannot settle. Answered at story / game-design level from the finale VM plan material and the SecGen draft, with positions only — no exploit or technique detail. Sources: `finale/FINALE_VM_PLAN.md`, `finale/SECGEN_DRAFT_NOTES.md`, `finale/STAGE_8_VM_ANSWERS.md`, and `SecGen/scenarios/break_escape/safetynet/m09_digital_archaeology.xml`. Nothing has been built, so anything the build decides is flagged for the user.

## D1. Does anything on `tomb_beta_server` show Tesseract's name before flag 3 is submitted?

**Answer: Unsettled, and leaning on a build check.** The plan places the credential that names Dr Adrian Tesseract behind flag 3 (same account home, user level), and intends nothing to show on a pre-login page. But reading the name only needs the foothold that yields flag 3, and that foothold can be reached before flag 3 is *submitted* at the station — and, for a fast player, before the identity scene.

Where it is settled:
- `FINALE_VM_PLAN.md` §1 flags table (row 3) and §3 R1: the staff credential, with Tesseract's name in its text, sits in the web service account's home on `tomb_beta_server`, beside flag 3. The flag string itself carries no name.
- `SECGEN_DRAFT_NOTES.md` m09 table (row 3) and the XML `tomb_beta_server` block: the credential (`enrolment_record`, naming "Dr Adrian Tesseract") is placed at user level in that account's home, beside flag 3, and `strings_to_pre_leak` is set empty so that no generated text is meant to appear on the public, pre-login page.
- `STAGE_8_VM_ANSWERS.md` m09 Q1 already raised the same concern and is the prior ruling: both server IPs are on the single attack box from the start, so the station enforces submission order but cannot stop a quick player from reaching `tomb_beta_server` early.

What is still for the user at build time:
- **Reachability, not placement, is the exposure.** The name is placed strictly behind the flag-3 foothold, so it is never on a pre-login page by design. The risk is that a fast player reaches that foothold before the story sends them (both IPs are live from Act 1) and reads the name before the identity scene plays it. Decide at the build: either restrict reachability of `tomb_beta_server` until the story sends the player there, or accept the early peek.
- **Story safeguard already holds.** The identity scene remains the first place the name is *spoken and explained* (the game's HaX hub stops just before the name, phone:381-384). If the early peek is accepted, the story docs should stop treating the name as a reveal gated only by the station.
- **Build verification owed.** `SECGEN_DRAFT_NOTES.md` ("Not verified without a build") flags that it is unconfirmed whether the empty `strings_to_pre_leak` actually overrides the module default; if it does not, a generated message shows pre-login. The build must confirm the public page shows no generated text (the name is not in that default text, but confirm it regardless).

## D2. Does any VM step involve recovering old or deleted material?

**Answer: No recovery step; the "archaeology" is thematic, carried by old and abandoned material already present on the boxes.** None of the four flags is reached by recovering deleted data. The title's archaeology comes from excavating a forgotten machine and reading old records, not from an undelete or forensic-recovery mechanic.

Where it is settled:
- `FINALE_VM_PLAN.md` §1 and the XML description (lines 12, 25): `tomb_beta_server` is "Tomb Beta's last server", one of the Architect's closed workshops; it holds a nine-year-old memo on the Albion flaw, an enrolment credential under a web service account that was never revoked, and an unsent vendor notice. The catalogue's ledger (flag 2) includes a "legacy section" with WREN's day-10 entry.
- `SECGEN_DRAFT_NOTES.md` m09 table: every flag sits in an account home as a readable file; the old memo and vendor notice sit beside flag 3. No placement is a deleted-file recovery.
- So the plan supplies the past as old/legacy/abandoned material sitting on the machines, which is where "digging up the past" comes from. There is no recovery mechanic in the plan.

What is still for the user at build time:
- **A story-reading call, not a VM fault.** If the title is meant to promise literal recovery of deleted data, the plan does not provide it; decide whether reading an abandoned machine and its old/legacy records satisfies "archaeology", or add a recovery step (not currently planned, and a larger change).
- The Nosferatu source's pre-login encoded message is being **removed**, not recovered (`SECGEN_DRAFT_NOTES.md` "Changes from the source scenarios"); it is not a recovery step either.

## D3. Does flag 1's catalogue output match the in-game drop screen's text (Series R, R-114 to R-161, bay 10)?

**Answer: Unsettled — they cannot match yet, because the VM carries no catalogue text at all.** The game's drop-screen text is fixed and confirmed; the VM's flag-1 file carries only the flag string. The build must seed the catalogue index on the VM to agree with the drop screen.

Where it is settled (game side):
- The drop screen is the `drop_terminal_screen` object in `scenarios/m09_digital_archaeology/scenario.json.erb`. Its `flag1_submitted` text variant (erb:1545) reads: "LIVE CAPTURE -- FULL CATALOGUE / Series R, restricted: R-114 to R-161. Location: restricted cage, bay 10. / Unindexed entry: …". So the in-game text is **Series R, R-114 to R-161, restricted cage, bay 10** — exactly the question's values.

Where it is open (VM side):
- `SECGEN_DRAFT_NOTES.md` m09 table and "Story text not written into the scenarios": flag 1's file (`catalogue_index`) carries the flag string only; the index text is not seeded. The XML confirms it: flag 1's `strings_to_leak` is a `flag_generator` with no index body (XML `catalogue_server` block).
- So right now the two do not match: the game drop screen prints the Series R / bay 10 detail, and the VM's flag-1 index has no catalogue content beside the flag.

What is still for the user at build time:
- **Seed the catalogue index to match the drop screen.** Place catalogue-index text in flag 1's file on `catalogue_server` that agrees with the drop screen (Series R, R-114 to R-161, restricted cage, bay 10), or the two surfaces read inconsistently. This is story-text seeding only; no technique is implied.

## Five-line summary (story level)

1. D1 (Tesseract's name before flag 3): Unsettled — the name is placed strictly behind the flag-3 foothold and off any pre-login page, but a player can reach that foothold before submitting flag 3, and a fast player before the identity scene; settled by FINALE_VM_PLAN §1/§3 R1, SECGEN_DRAFT_NOTES m09 row 3 and the XML, with STAGE_8_VM_ANSWERS m09 Q1 as the prior ruling.
2. D1 for the user: decide whether to restrict reachability of `tomb_beta_server` until the story sends the player, or accept the early peek (the identity scene already stays the first place the name is spoken); and confirm at build that the public page shows no generated text.
3. D2 (recovery of old/deleted material): No recovery or undelete step — the archaeology is thematic, carried by Tomb Beta's abandoned "last server", a nine-year-old memo, an unrevoked credential and the ledger's legacy section; settled by FINALE_VM_PLAN §1, the XML description and SECGEN_DRAFT_NOTES.
4. D2 for the user: a story-reading call — decide whether reading an abandoned machine and its old records satisfies the title, or add a recovery step (not planned); the Nosferatu pre-login message is removed, not recovered.
5. D3 (flag 1 vs drop screen): Unsettled — the game drop screen (`drop_terminal_screen`, erb:1545) prints Series R, R-114 to R-161, bay 10, but the VM's flag-1 index carries only the flag string and no catalogue text, so the build must seed the catalogue index to match (SECGEN_DRAFT_NOTES "Story text not written"; XML `catalogue_server` block).
