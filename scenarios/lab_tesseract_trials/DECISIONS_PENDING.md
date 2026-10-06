# The Tesseract Trials: decisions pending

(D2, D3 resolved 2026-10-06; see DECISIONS_LOG.md)

## Deferred engine items (for the user later, not blocking)

- **E1. Phone intro shows twice when a phone device is picked up** with `currentKnot` set: `inventory.js:582` preloads the intro, then `npc-manager.js:1033` passes the knot and `phone-chat-minigame.js:352-357,493-506` appends it again. m02's Ghost device is set up the same way, so m02 may show it too (not checked). Workaround here: omit `currentKnot` / `targetKnot` (probe game 1570). Source: `scenarios/test-tesseract-probes/PROBE_RESULTS.md`.
- **E2. Terminal theme doubles the prompt:** ink `> DEVICE ACTIVE` shows `> > DEVICE ACTIVE` (m02 too). Workaround: don't start terminal lines with `>`.

- **E3. Task `onComplete.setGlobal` is applied only on the client** (review R2-A N-m11; DESIGN R26). If the client update is lost, the global never reaches the server. Scenario-side cover in DESIGN v3; the engine fix is for later.
- **E4. A page reload loses the CyberChef recipe and input** (PLAYTEST_P1 finding 3). The iframe state isn't saved. A possible fix is to keep CyberChef's URL hash in localStorage and restore it on first open. Mitigation here: the notepad scratch pad for keys and IVs.
- **E5. A page reload puts the player back at the start position** (PLAYTEST_P1 finding 4, P3 m5), though rooms, inventory and tasks are restored. It affects every mission.
- **E6. "Add to Notepad" on a text_file wraps the content** in a header and footer ("Text File: … FILE CONTENTS: … End of File") (PLAYTEST_P2B B3). Copying that note into a cipher like Vigenère garbles the decode. Possible fix: store the raw content, with the source in the note's title. Mitigation here: the observations and field notes say to use the Copy button for ciphertext.
