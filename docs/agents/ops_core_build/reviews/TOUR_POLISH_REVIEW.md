# Showcase tour polish: review

Scope: every commit in `47d5b6c49..HEAD` on `ops-showcase-tour` (7 commits: 9d8e5d717, bc5e5503d, a4b4629fe, 1ac98e181, 3668cc25d, a8e70d4ff, b9d8914fa).

Verdict: **not clean. 0 B, 1 M, 5 m.** The one major is a red test, and the fix is small (refresh 5 saved snapshots). No server answer, access check or secret changed. After the M is fixed, a short Sonnet delta review is enough.

## Tests run (once, from the tree)

- JS, passing: network-terminal-grammar, network-terminal-format, network-skin-parity, network-skin-parity-runner, network-view-panels, network-view-ops, ui-rules-audit-ops-view, notepad-restore-add-to-notes, inventory-server-items, inventory-resume-same-name.
- JS, **failing**: `test/js/network-view-panels-same.test.mjs`, 15 pass and 5 fail (see M1).
- Validator: demo_ops_recon 0 errors, 28 warnings; demo_ops_second_step 0 errors, 38 warnings. One recon warning is new (m2).
- Rails: none run. No Rails file or test changed. The fixers report 84 recon Rails tests and 47 second_step scenario runs passing.

## Major

**M1. The Panels snapshot test is red after 9d8e5d717.** The commit adds `<span class="network-technique-type">Type: <id></span>` to every technique card in the Panels skin. `network-view-panels-same.test.mjs` compares the mounted DOM with saved snapshots, and 5 variants now differ: alias_out_of_order, cli_authored_bare, cli_authored_entries, techniques, techniques_unconfirmed. The only difference in each is the new span. The fixer ran the grammar, format and provenance tests but not this one. Fix: check that the new span is the only difference, then refresh those 5 snapshots through the harness (`test/js/support/network-view-harness.mjs`). Leave the `unchanged/` snapshots of existing scenarios as they are. They still pass, which shows no other scenario's DOM changed.

## Minor

**m1. The named Check button (a8e70d4ff) has no test, and no fixture covers it.** None of the network-view fixtures has a host with more than one service shown with Check, so `network-view-panels-same` never renders "Check <service>" (and still passes on that part). Add a fixture or a `network-view-panels` case with two services on one host that checks each label. Note also that a busy button falls back to the bare busy text without the service name. That is acceptable, but nothing records it.

**m2. New validator warning on `coffee_pending` (b9d8914fa).** `ama_owusu.ink:15` assigns a VAR that is also a scenario global set by Jun's mapping. The sharing is intended (the ink sets it, Jun's return clears it), so add the comment the validator asks for (for example `// Synced scenario global: Jun's return clears it`) on the VAR's line or the line above.

**m3. `coffee_pending` outlives a reload.** Globals survive a reload, but NPC needs reset to their initial values and Jun starts at his desk, so the `npc_returned_post:jun_watanabe` that clears the flag never comes from that run. The lever then answers "That's already on its way" until Jun next leaves and comes back on his own. That is roughly 3 minutes (caffeine starts at 70, decays 10 a minute, urgent at 40), or less if Chidi's coffee trip sets his caffeine first. It recovers by itself and is not a lock. A cheap fix would also clear the flag on load, or on `npc_left_post:jun_watanabe`. That matches the old meaning ("pending until he goes") rather than the new one ("pending until he is back"), so it is a design call. Not tested live.

**m4. The second_step guide no longer matches M14.** 3668cc25d drops "Send again" and the reopen from M14, but the "Server:" line (PLAYTEST.md line 185) still expects "several `mfa_prompt_sent`" at `records_room`. With one code entry and no resend, expect one row, or say "one or more". The claim that the phone "does not come back until another coffee round" was not checked against the engine here.

**m5. The recon guide (R4) says "On the admin page tile, Check."** The printer host has two services, so the buttons now read "Check print" and "Check Admin page". The step is still clear, but "press Check Admin page" would match the new label, and a scripted run would find the button by its new text.

## Checked and fine

- **Server answers, access, secrets:** none of the 7 commits touches a controller, model, serializer or anything the server sends. `use <card name>` is joined to the card id on the client (`joinCardName`) and then goes through the same `useOfferFor` path, so the server checks are unchanged. Inside msfconsole, `use` still selects a module.
- **Engine change in `restoreNoteFromSave` (1ac98e181):** a reload now skips notes marked `addToNotes:false`. This matches what `interactions.js` already does when a note is first read, so every scenario now behaves the same before and after a reload. 48 scenario files use the flag, including campaign missions. None is edited, and for them the change only removes a Notepad page that appeared after a reload and was never there before it. The second_step note now reaches the Notepad on read, which is what the fixer intended. It carries the safe PIN that the player has just read, so nothing new is disclosed.
- **Voiced line:** "That's already on its way. Give them a minute." has no variable and no stage direction. The clip's metadata text matches the line, it uses Ama's voice and style, and the compiled ink JSON contains the new knot.
- **Grammar change:** `TECHNIQUES_HELD` is used only by the wrong-technique answer. A multi-word head that is not a card name now gets "Not a card you hold. Type one of these words: ..." where it used to get "One target at a time". The new test covers both cases.
- **Comment-only commit bc5e5503d** and the passwords guide commit a4b4629fe match the code and the ink (`tell_crack_reused` is two bubbles).

## Left open by the fixers (not findings, listed so they are not lost)

- Recon item 1 (barks dropped while the network view is open): this needs an engine decision about held barks.
- Terminal items 2 (second toast, suspected held-notification replay) and 3: skipped.
- Second_step: Darren's PC reopening, and the minor items: skipped.
- Passwords: reopening as someone walks past. The fixer found no engine path for it apart from a click within one tile. A live check is still needed.
- No live check was run on any of the fixes, including the coffee lever clearing when Jun returns.
