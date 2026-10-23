# Lab fix round 3: re-run R1 and review R2 findings

Sources: `R1.md` in this folder and `../IMPL_REVIEW_R2.md`.

## Major

- **M2 (still failing) — the first Dev call menu has empty blanks.**
  - It reads "I'm helping , your new starter in .", and the first sent line is stored blank in the history.
  - The ink VARs are already correct at render, and from turn 2 the choices fill. The `fillVars()` re-asserts from round 2 have no effect.
  - Find the real cause: R1 suspects the first choices are baked by an earlier continue, before `attachPretext` sets `_pretext`.
  - Fix it, and prove the fix with a Node test or a bridge check that renders the first menu of a fresh pretext call.
  - Remove the round-2 re-asserts if they turn out to be dead code.

## Minors

- **Dev's lockout `recoverTo: -30` is now dead config** (R2 #1). A fresh call resets Dev to his start value. Drop the setting, or floor the reset at it, and keep the logged decision consistent.
- **Dev's influence economy** (R1): he starts at -10, and a pending ask costs another -10. Check that the start value and the pending cost read fairly to a student who does nothing wrong.
- **The desk phone gives no feedback once the call is done.** Add a short line.
- **Ruth's phone Recon rung** still says "come and see me for the key" when the key is already held, and "The door's still locked." gets no visible reply.
- **Tomasz's first hub line** still says "Two jobs for you" when both jobs are done.
- **Triage:** the `own_lord` replay shows the look-alike sender, not what the student actually sent. The Lord send advisory also says "freemail-style account" when the send was from guest. Make both reflect the real send.
- **The report's landing-page row** shows `ledgerwell.example`, not the look-alike domain the student used.
- **The SOC/defender board and the prep card** still say "name not given" once the name is held.
- **Mail client:**
  - Create-account Confirm is silent when nothing is picked.
  - Close needs three presses after a send.
  - The client reopens on guest after a reload.
- **The `cv_portfolio` link target** only shows when the student clicks the chip. Consider making that discoverable.
- **Harness, deferred from round 2** (`tools/playtest/se`):
  - `clickControl` matches by substring.
  - `lock` picks the first key on the ring.
  - `bootstrap` can't leave Ruth's opening chat.

## Left from earlier, fix if small

- Reply timestamps (02:0x against seeded mail at 08:xx).
- Dev never says the portal name or the sender address. The logged decision says no change; leave it unless R1 changes the case.

## Done when

- The Node suite and the validator are green, with all shipped scenarios unchanged.
- The lab passes `--strict-social`.
- The M2 proof is in place.
- The results are logged in `SE_BUILD_LOG.md`.
- You report the files you touched.
