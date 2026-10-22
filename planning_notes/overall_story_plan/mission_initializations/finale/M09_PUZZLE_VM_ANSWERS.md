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
