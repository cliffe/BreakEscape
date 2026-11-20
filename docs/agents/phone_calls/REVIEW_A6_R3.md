# Review: A6 round 3 (callback and voicemail: the slot list, the thread check)

Reviewer: Opus, 2026-11-12. Reviewed at `b136b4b10` (fix `adc5169de`, proofs and outcomes `b136b4b10`) in a detached temp worktree, since removed. Plan `PHONE_CALLS_PLAN.md` 2.6, 2.7, 4.1, 6 "A6"; `REVIEW_A6_R2.md`, its outcomes, `A2a_NOTES.md` (new slot shape), `proofs/A6_r2/`. No live run: the R2 live proofs already cover the server round trip, and nothing found here needed a browser.

**Verdict: accept.** No major, no minor. Four nits, none blocking. M1 and m1 from round 2 are fixed, and so are n1, n3 and n4.

## Checks

### The voicemail list (R2 M1)

- **Written:** `syncSave` writes `voicemails` whenever the ringer's map has entries, whatever `live` holds. `holdVoicemail` saves on hold and `releaseVoicemail` saves on release (mutations J1, J5 and J6 killed).
- **Resumed in order, quietly:** `_resumePendingCall` runs the list through `runVoicemail` with `quiet: true`. `runVoicemail` chains per contact, so the list runs in saved order, and a live voicemail offer (P1) runs after it through `missedOffline`, which is arrival order. J7 (list skipped), J8 (not quiet) and J9 (reversed) killed.
- **Delivered once:** `npc.pendingCall = null` is set before the runs start. Each run holds itself again, so `refreshSave` writes the slot with the runs still pending, and it clears as they finish. The P2 test reloads twice and gets two Voicemail rows. The `_pendingCallResumed` guard is redundant once `pendingCall` is null (J20 survives as an equivalent mutant).
- **Old saves:** a slot with one held voicemail in `live` still delivers (test; J11 killed). So does the older single record shape, which the gate turns into `{ live }`.
- **Close and credits:** `close()` leaves held voicemails alone. The ending's phone close emits `conversation_closed`, the run goes ahead with no toast (`isClosed`), and the release saves an empty slot. Nothing is lost and nothing toasts over the credits.
- **The callback beside it:** P3 holds (callback in `callback`, restored by `restoreCallback`; J2 and J10 killed). A callback beside a live offer is mostly replaced on the reload anyway: `missedOffline` on the live record either sets the newer callback or, for a voicemail offer, drops it (row 7 semantics). The one case where it matters is n-b below.
- **R2 probe rerun** (`probe_a6r2.mjs` against the head): P1, P2 and P3 pass. Rows after the reload match the committed tests. The probe's line `P1 heard_vm in saved story false` is a false negative in the probe itself: it runs `JSON.stringify` on a string, so the quotes are escaped and the search can't match. Matched on the raw string, `heard_vm` is `true`, and the second voicemail's "I already left one." line confirms it. The committed tests do not use that check.

### Server (`Game#clean_phone_pending_call`, `clean_phone_voicemail`)

- Cap 10 after filtering, with input looked at only up to 40 entries. Knot must match `PHONE_CALL_KNOT` (which rules out control characters, markup and over-long strings). `withheld` only as a boolean. Every other key in an entry is dropped, and so are unknown top-level slot keys (the output is built from the known keys only). `callback` goes through the call-record cleaner (label: no control characters, no `<>`). Non-list `voicemails` and non-hash `callback` give nil.
- **Growth across syncs:** not possible. `merge_phone_state!` replaces each contact's entry with the cleaned one, so each sync is capped on its own, and `MAX_PHONE_STATE_BYTES` bounds the whole state.
- Hostile tests cover types, sizes, control characters, markup, unknown keys, non-lists and the cap. All six server mutations (S1 cap removed, S2 any `withheld`, S3 knot unchecked, S4 old shape gate, S5 raw callback, S6 whole entry kept) are killed: 35 runs at the head, each mutant fails one to three.
- An empty `forced` is dropped by the server, so a server-saved slot can be `{ voicemails }` alone. The client's new gate (`Array.isArray(raw.voicemails) || raw.callback`) is what lets that load. Unit tests never exercise it, because `exportPhoneState` keeps `forced: []` (J13 survives), but the `voicemail_held_two` live proof does: its server slot was `{"forced":[],"voicemails":[...]}` and becomes `{voicemails}` once cleaned, and both voicemails were delivered after the reload.

### `_threadOpenOn` without `isConversationActive` (R2 m1)

- **Loading thread** (`openConversation` sets `this.conversation` before `loadStory`): held, and its close emits. **Ended thread** (`hasEnded` keeps `this.conversation`): held, close emits. **Another contact:** not held (test). **Second window** reopened in the same tick as the first one's close: held again, since the `isBlocked` recheck runs just before the write (test). J14 (old clause back) and J15 (`_ending` ignored) killed.
- One window is new: nit n-a.

### n3 and n4

- n3: no toast once `isClosed()` or `isSuspended()`. The test only covers `close()`, so J17 (suspend ignored) survives; see n-c.
- n4: `console.warn` names the knot and the contact (J18 killed). The test title is wrong; see n-d.

### Lab SE

`adc5169de` and `b136b4b10` touch no scenario file. Dev and Ruth have no `ring` and no voicemail knot, so none of the new code reaches them, and the R2 `sha256_noseed` values match A6 R1 and merge_main_1. Unchanged.

### Tests and mutations

At `b136b4b10`: `phone-voicemail-hold` 20/20, `phone-voicemail-run` 10/10, `phone-callback-dom` 20/20, `phone-callback-ui` 4/4, `phone-callback-ringer` 19/19, `phone-ringer` 122/122. Rails `game_phone_calls_state_test.rb` 35 runs, 0 failures.

Mutations (26, run against those files; script kept at `scratchpad/mut_a6r3.py`, not committed): 21 killed. Five survive: J3 (n-b), J12 (`withheld` dropped from the resume: equivalent, because the Voicemail row text ignores `withheld` and the run is quiet), J13 (covered live only, above), J17 (n-c), J20 (equivalent, above).

## Nits

- **n-a. A phone-chat on the contact that ends before it has a conversation holds the voicemail with nothing to release it.** The constructor sets `currentNPCId` from `params.npcId` straight away, but `this.conversation` stays null through `preloadIntroMessages()` and through an outgoing dial (until `_connectOutgoing`). `_threadOpenOn` is now true in that window. `_emitConversationClosed` returns early when `!this.conversation`, so if that phone-chat is torn down without opening a conversation (a dial that rings out, a quick open and close, another minigame replacing it during the preload), `conversation_closed` never fires. The voicemail, and every later voicemail of that contact queued behind it in the chain, waits until the contact's thread next opens and closes, or until a reload. Probe (`scratchpad/probe_a6r3_preload.mjs`, harness model of that teardown): `ran after teardown: false`, and the slot still has `voicemails: [ring_vm]`, so it is delayed, not lost. To hit it, a voicemail run has to reach its wait or its recheck during those few seconds, so I found no realistic mission path. Fix: add `&& !!open.conversation` to `_threadOpenOn`. That holds exactly in the states whose close emits. The loading and ended windows keep their hold (both have a conversation), and the preload and dial windows draw nothing of the thread yet, which the `isBlocked` recheck already protects.
- **n-b. A callback beside a live offer has no test** (J3: dropping it survives). It only matters when the live offer is withheld and has no voicemail, because then `leaveMissed` leaves nothing and the restored callback should stand. A unit test of that case would pin it.
- **n-c. n3's suspended branch has no test** (J17). One test with `ringer.suspend(true)` would cover it.
- **n-d. The n4 test title says "the voicemail stays in the slot"**, but the code releases it after the warning (as the outcomes and plan 2.6 say) and the test doesn't check the slot. Rename it, or assert that the slot is cleared.

## For the record

Nothing here needs another round. n-a is a one-line change with one test (a fake phone-chat with `conversation: null` that is torn down without the event). n-b to n-d are test additions. Any of them can ride with the next A6-adjacent commit.
