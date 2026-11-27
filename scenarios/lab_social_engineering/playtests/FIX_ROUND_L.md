# Lab fix round 2: playtest findings L1–L6

Sources: L1.md to L6.md in this folder. Each item names the runs that found it. Fix the blockers and majors. Fix the minors where the fix is small. Note in the log any minor you leave.

## Blockers

- **B1 (L1–L6): Ruth only hands over a door key on the first open after a page load.**
  - On a reopen, the chat resumes at `hub`, so the `keys`/`recheck` checks in `ruth.ink` never run.
  - Fix this in the ink, so `hub` itself runs the key checks. Make sure each key is given exactly once and survives a reload.
  - Check the Recon, Operations and Blue Team keys.
  - Add a Node test that drives the story through hub reopens.
- **B2 (L2): the Recon key opens the Operations door.**
  - The key pins sit within the lock tolerance.
  - Separate all three lab key/lock pin sets so that no key opens another door. Check against `pin-management.js` tolerance.
  - Add a validator or Node check if that is cheap.
- **B3 (L4–L6): the `payroll_login` landing page cannot pass its gates.**
  - The lab's `social.landingPages.payroll_login` lacks the `pretext` object and the field data that the slice's page has (`scenarios/test_social_slice/scenario.json.erb`, around lines 619–625).
  - Add them, consistent with the lab's facts and Lord's mail.
  - Confirm the builder's "What Sofia is expecting" panel fills after the Dev call.
  - Have the validator flag a landing page with no `pretext` under `--strict-social`.
- **B4 (L4): Ruth's phone hint thread is stuck at `stage0`.** It loops to itself and never returns to `hub`, so no later hint rung is reachable. The hints should follow the current stage, and should no longer tell the student to collect keys in person once B1 is fixed.

## Majors

- **M1 (L6): no end screen.** The `defend` aim has no `conclusionScreen`. Add one, following `lab_tesseract_trials`.
- **M2 (L4–L6): the first-turn call choices show empty blanks**, for example "I'm helping , your new starter in .". The menu renders before the story variables are written, and the first sent line stays blank in the history. Set the variables before the first render.
- **M3 (L5, L6): Dev's "pending" reply on the payslip-date ask is a dead end.**
  - Signpost the name check inside the call.
  - Make the recovery clear.
  - Stop `open_buddy` giving +10 on every repeat.
  - Decide whether influence should carry over between calls, and log the decision.
  - The date ask should not come back pending if the name was given as the opener (L4).
- **M4 (L1, L3, L5): the red-flag meter lists urgency or "feels rushed" on Hampshire's plain CV mail in the lab data.** The slice fix did not reach the lab.

## Minors

- **No locked-door line pointing to Ruth** for the key (L1).
- **The PDF Path field shows the username but grants nothing**, and "Section 4" is not on the sheet (L1/L2, see those reports).
- **Fairbairn:**
  - The blame bounce is not in Fairbairn's voice.
  - His answer is never reflected later.
  - The right plan picks are both listed first (L1/L2).
- **Reply timestamps read 00:4x against seeded mail at 08:xx** (L3, L5, L6).
- **The mail workstation reopens on guest after a reload** (L1, L3).
- **The blank picker labels give the answer away** ("a specific, insider detail" against "may be out of date") (L3–L5). Make the labels neutral.
- **Mail client:**
  - Create-account Confirm with nothing picked is silent (L3).
  - Account creation is hidden in the account drop-down (L4).
  - The Create-account panel stays mounted under the composer, and Close needs several presses after a send (L6).
- **Engagement report:**
  - The call line prints a raw id (`got_it`).
  - The target rows reorder after a reload (L5).
- **Name status:** the defender board and the prep card say "name not given" once the name is held (L4, L6).
- **Board timing:** the board shows Sofia as "Ready to approach" before the portal name is known (L4).
- **Dev never says the portal name or address** (L4). Decide whether he should.
- **Page-first order:** with the page built before the call, nothing points the student to the call (L4). Add a hint row.
- **Triage replay:** the `own_lord` replay's sender and auth don't match what the student actually sent (L6).
- **`cv_portfolio`** gives no way to check its link target (L6).
- **Tomasz says "no fuss" in the debrief after a messy call** (L6).
- **Nothing outside the checklist tells the student a reply is coming** (L3).

## Harness (tools/playtest/se)

- `clickControl "Send"` matches by substring ("sender's name").
- `lock` picks the first key on the ring.
- `bootstrap` cannot leave Ruth's opening chat.

## Done when

- The Node suite, the validator (all shipped scenarios unchanged) and `--strict-social` on the lab are green.
- A bridge or Node check shows that Ruth hands over each key in one session with no reload, and that Lord lands with the right page on the lab data.
- The results are logged in `SE_BUILD_LOG.md`.
- You report the files you touched (only this round's files).
