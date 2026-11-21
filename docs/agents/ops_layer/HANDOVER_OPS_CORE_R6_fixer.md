# Handover: OPS_CORE_PLAN R6 fixes (2026-11-19)

Worktree: `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/ops-plan`. Nothing
committed (brief said do not commit). Edit tool only, section by section; no review/round words in plans.

Inputs: `docs/agents/ops_layer/reviews/OPS_CORE_R6.md`, the orchestrator's rulings (M1 hover, M2 keyboard-only
displacement, M3 `se_technique` with old key read and info-only; m1 keyboard-only needsSession; m6 log rows;
m7 refused use writes a row).

## Done in `docs/achitechture/OPS_CORE_PLAN.md`

- n1: "section 5.5" -> 5.4 (section 1 item 6).
- m1: section 1 "How it joins": granted session "does not satisfy an implant's `needsSession`".
- n2: section 2 "`technique_card` here".
- M3: 4.3 new bullet "The old pretext key is still read" (`se_technique ?? technique` in pretext-judge.js
  :240/:258/:276 and pretext.rb :290/:418/:497; info only; both keys -> se_technique wins + warning);
  9.1 schema row keeps `technique` declared (socialPretextLine is closed); 9.2 error row removed, both-keys
  warning row added, new "Info" table; section 10 rename row and part 5 (old-key copy and both-keys copy
  must match snapshot); 11.3 `validator-social-pretext-key.test.mjs` row; 12.1 step 9; 12.2 row (also fixed
  wrong path: pretext-judge.js is in `js/systems/`, not `minigames/social/`); section 15 option (a) row and
  the (b) fallout list. Option (b) kept open.
- M1: 5.4 "How it is drawn" new bullet: `sprite.compromiseTint`, local `restTint(obj)` in interactions.js
  replacing the three `clearTint()` calls (:221-223, :246-248, :277-282), no import; ghost stays blue;
  `compromiseMarks()` returns live `tint` (`tintTopLeft`); 11.3 compromise-marks row extended and new
  `interactions-compromise-tint.test.mjs` row.
- m4: 5.4 paragraph under the mark table: `_dropFoothold` emits new `network_foothold_dropped`;
  `compromise-marks.refresh()`; `load()` runs before rooms so syncRoom covers it; test row updated.
- m2: 5.4 "Clicking the PC": reader placed before `heldAtKeyboard` at unlock-system.js:629 (after headless,
  off, offWhen, pcUserAt); in openLoginPc after headless, world sprites only (no `scenarioData.remote`);
  headless hosts in a room keep observations (remote view from the network view only).
- m5: 5.4 frame/line/wipe keyed on `pcSessions.get(pcId)?.via === 'technique'`; keyboard fallback covered.
- m3: 5.4 new "*The remote view's taskbar*" paragraph (Sign out; Switch user only where remoteSignIn not
  false; `canSwitch` in container-minigame.js:1665 and text-file-minigame.js:220; Sign out then keyboard path).
- n4: 11.5 S3 live proof: desktop closed by its Close, then unplug by the real control, then `no_session`.
- M2 (part): 5.4 "One slot per PC", the reader table (new `pcSessions.displaced()` row; `record_borrow_done!`
  row changed to delete only records with neither `foothold` nor `from`), the "new use" list at the
  start of the grant paragraph.

## Status (second fixer, 2026-11-19)

All nine items below are done, the log plan's network rows, EVENTS example and request 3 included,
and the R6 lines are in `OPS_CORE_DECISIONS.md`. Not done: no test_ops_access beat for an NPC
borrow at a carded PC (node and Rails tests cover it). Left alone: the log plan's generic helper
text on `save_limit: false` "noisy refusal" examples (LOG:607, :939, :992), outside the network rows.

## Open at the first handover (now done)

1. M2 rest:
   - Add a paragraph after "*Folders.*" in 5.4: "*An NPC at the PC.*" displaced() (pc-sessions.js:742-765)
     returns false with no logout for a copy with `remote === true` (technique and every remote copy);
     relay rule at :746 unchanged; record_borrow_done! (npc_frustration.rb:391-396) deletes only a record
     with neither `foothold` nor `from`. While the NPC is seated: a world click shows today's in-use answer
     (`pcUserAt` runs before the reader); the network view's Open still opens the remote view; an open
     remote desktop stays open and usable; the mark stays. npc_sat_at only fires for borrows
     (npc-needs.js:3639-3641, `job.borrowed`); an owner returning (workstation_owner_returned) ends only
     claims (pc-sessions.js:708-712), unchanged.
   - Comparison table row "An NPC finishes a borrow of the PC" (about line 830): password-through-foothold
     column now "stays (remote)"; technique "stays". Add a row "An NPC sits down at the PC": same.
   - 5.4 mark list "The mark comes off when its source ends: an unplug, an NPC finishing a borrow, ..."
     (about line 775): drop "an NPC finishing a borrow", add the player's Sign out.
   - Tests: `network_technique_session_test.rb` row (about line 1395) replace "an NPC finishing a borrow
     ending it and a repeat use granting it again" with "an NPC finishing a borrow keeping it (record kept,
     guest record written)"; add a Rails test of record_borrow_done! keeping a remote password session too;
     `pc-sessions` node test (add to `pc-sessions-access.test.mjs` row): npc_sat_at / npc_borrowed_session
     on a technique copy and a remote password copy -> no delete, no logout, no pc_signed_out, desktop open;
     on a keyboard password copy and a claim -> as today. compromise-marks test row: drop "an NPC
     finishing a borrow" from the ends list.
   - Section 10 table: add a row for displaced()/record_borrow_done!: no shipped scenario has a remote
     session on a PC an NPC sits at. CHECK RESULT: `borrow_session` workarounds exist only in
     `test_access_social` and `test_access_work`, neither declares `networks`; the eight scenarios with
     `networks` have no borrow at all (grep -i borrow = 0). A remote copy needs a foothold, so none can arise.
   - 12.2 shared files: add `pc-sessions.js` displaced(), `npc_frustration.rb` record_borrow_done!.
2. m3 beat: add test_ops_access beat 17a after 17: use the card on desk01 again; click -> remote view;
   taskbar: Sign out + Switch user on desk01 (allowed), Sign out only on the vault01 remote view (blocked);
   Sign out; click desk01 -> sign-in screen; type password from a note -> keyboard session; use a
   session-type implant item on desk01 -> needsSession met, implant foothold, mark from the implant.
   Add the desk01 password note and the implant device to the test_ops_access description (about line 1520).
3. m1 second half: 12.2 row (about line 1610, "a technique copy is not held at the keyboard, so needsSession
   is not met by it"): replace the reason with NA:498 (`implant_foothold!` requires
   `session['foothold'].blank?`, which a technique record never meets); drop the heldAtKeyboard claim.
   Verify NA:498 first.
4. M1 shared files: add `interactions.js` (restTint) and `network-links.js` (`network_foothold_dropped`
   emit) rows to the 12.2 table; consider the node harness copy lists (memory: new static import ->
   copy lists; restTint adds no import).
5. m6: 13 intro sentence (about line 1660, "The table below is the log plan's own list ... 13.7") ->
   "the log plan's list is to match this table (request 8)". Give the six EVENTS lines in 12.2 or 13 with
   save_limit maps: network_swept {'ok'=>10}, technique_used {'ok'=>10}, technique_refused {'refused'=>10}.
   Fix 12.2 row "six entries ... one line each". Add both `ok` registrations to cross-plan request 8.
   Then edit `docs/achitechture/OPS_LOG_ROWS_PLAN.md` network rows ONLY: LOG:1059 (network_swept
   registration, add save_limit ok 10), LOG:1125 (every sweep, repeats with save_limit), remove LOG:1129
   network_alerted, LOG:1130 no quiet/noisy split (refusals always save_limit), LOG:1131 technique_used
   repeat writes a row with save_limit. Check LOG:794 wording only, do not edit it.
6. m7: 5.4 "Which refusals write" (about line 594): 403 `not_responding` (check 3) writes a
   `technique_refused` row with `reason: not_responding`, `save_limit: true`; only the two 404s write
   nothing. Add `not_responding` to the closed reason list in the 13 table row; tests: network_technique_test
   and network_ops_free_test rows.
7. n3: keep the record key `technique` (finding id); say why in section 0 (it names what granted the
   session, matches `via: "technique"`; earlier decision kept it). Record in DECISIONS.
8. Append "## R6 fixes (2026-11-19)" to `docs/agents/ops_layer/reviews/OPS_CORE_DECISIONS.md`, one line per
   finding (M1-M3, m1-m7, n1-n4). Note: M2 extended to record_borrow_done! (server) beyond the ruling's
   pc-sessions.js change, so client and server agree; m2 headless hosts in a room keep observations
   (review allowed either); M3 also fixed the pretext-judge.js path and kept `technique` in the schema.
9. Final grep of the plan for "borrow", "needsSession", "network_alerted", "quiet", "noisy", "13.7".

## Files touched

- `docs/achitechture/OPS_CORE_PLAN.md` (edited, uncommitted)
- this note
