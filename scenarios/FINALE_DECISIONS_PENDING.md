# Finale (m09, m10): decisions for the user

Answered items move to `scenarios/FINALE_DEV_LOG.md` (F1–F8 answered 2026-10-20).



## F9. Build and check the SecGen drafts (when convenient)

Files in SecGen (uncommitted): `scenarios/break_escape/safetynet/m09_digital_archaeology.xml`, `m10_full_disclosure.xml`. Checklist for the build: `planning_notes/overall_story_plan/mission_initializations/finale/SECGEN_DRAFT_NOTES.md` (pre-login page empty on Tomb Beta; m10 flag 2 visible only after flag 1; root SSH refused on the two escape boxes; two accounts on the release host). Not blocking the design stages. A Haiku agent can run `review-secgen-module` on the modules listed in the notes first if you want.

When you build m09 (from the opus48 VM wiring, 2026-10-21): confirm the built hostnames are `catalogue_server` and `tomb_beta_server` (Kali `attack_vm`); each machine numbers its flags from 1 (story flag 3 = `tomb_beta_server-flag1`); note the catalogue server's service account name; flags 1–3 submit at the reading-room drop terminal, flag 4 at the tape-room station, both launchers opening the one attack VM. The early peek at Tomb Beta's credential is accepted (your answer); no network restriction needed.

When you build m10 (from the opus48 VM wiring, 2026-10-21): rename the draft systems so the built hostnames are `bunker_monitor`, `release_host`, `core_host` (Kali `attack_vm`); one flag per station (gate terminal, release console, sealed hatch, core terminal); **turn off root SSH login on `release_host` and `core_host`** (the draft enables it, which would let a player skip both climax flags); two operative accounts on `release_host`; the monitoring host keeps exactly two flags so the mission totals four; timed VM run still owed.

m09 build addendum (from the puzzle-chain VM answers, 2026-10-22, `finale/M09_PUZZLE_VM_ANSWERS.md`): seed the ledger body in flag 2's file, and put the H&L file number only there, never on the flag-1 index or a pre-login page. Otherwise Torres's after-the-box ring can be skipped. Optional: check the cage label ("Issued to: Strategy Directorate") reads consistently beside the VM credential.

m09 build addendum 2 (scenario-design R1 VM answers, 2026-10-22, `finale/M09_PUZZLE_VM_ANSWERS.md` D1–D3): seed the catalogue index (flag 1's file) to match the drop screen: Series R, R-114 to R-161, restricted cage bay 10. Confirm Tomb Beta's public page shows no generated text. Tesseract's name sits behind the flag-3 foothold; a fast player can see it before the identity scene, which is the early peek you already accepted.

(F10 and F11 answered 2026-10-22, see FINALE_DEV_LOG.)

m10 build addendum (scenario-design R1 VM answers, 2026-10-22, `finale/FINALE_EDU_VM_LINES.md` Task B):
- Answered (F12): gate each VM step behind information found in the game, so no flag can be taken before it can be submitted. Audit in progress.
- The release host holds no "disarm" file and the core host no unsent notice; both are in-game only. The game side is being worded so it doesn't promise VM content. Answered (F13): seed both on the VM as well.
- Timed VM run still owed (cut order starts with the backdoor task if the VM portion runs over ~34 min).
- m10 build check (puzzle chains R1): the VM's door log (flag 1) and staging schedule (flag 2) should agree with the in-game texts (m10 erb ~2850-2871 and ~3547-3562).

VM gating audit (2026-10-22, `finale/VM_GATING_AUDIT.md`) — three open items for you:

- **How to gate the foothold flags (m09 flags 1/3, m10 flags 1/3/4).** The audit's fix keeps the taught exploit as the foothold but puts the flag in an account whose login password is an in-game find, so you have to read that account with the found password (the exploit shell can't). The alternative is to drop the exploit from the flag route and make the foothold a plain credentialed login — simpler to build, but it loses the exploit lesson on that box. **Recommendation: keep the exploit foothold plus the gated account** (you get both the exploit teaching and the F12 gate). Choose per mission if you prefer.
- **m10 schedule cities (flag 2).** The schedule record names Seattle first (fixed in the finale docs); Austin as second and the third city (a water utility) are my placeholders. **Confirm or replace Austin and the third city** before the schedule text is seeded.
- **m01 spot-check (shipped, not urgent).** m01's flag 1 only works if the in-game "My Passwords" list contains the one password the VM picks at build from its 27-word list (`SecGen .../m01_first_contact.xml:84-114`). Worth confirming once that the two still agree; if the list drifted, flag 1 is unsolvable.
