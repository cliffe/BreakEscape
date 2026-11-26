# Showcase tour plan: review R3

Reviewer: design review round 3 (read-only except this file). Plan: `SHOWCASE_TOUR_PLAN.md` at `f2448308b`, checked against the code and scenarios in `/data/be-ops-follow` (main plus the plan). No SecGen XML, realism catalog file or field guide was opened.

**Verdict: not clean.** 1 blocker, 1 major, 5 minors.

N1 and N3 are closed. N2 is closed for the clock, the expiry time and the T1 bark. The way back it added cannot fire, and R2 m4's second tick has the same fault (B1). A second dead end was found in the Terminal showcase: the shared screen's end (M1). Both put T12, the showcase's last beat, out of reach on an ordinary path.

## R2 findings

| R2 | Status | Evidence |
|---|---|---|
| N1 Darren's lock and bark | **Closed** | `autoLockSeconds` sets the idle clock at the leave for an open screen only (`workstation-state.js:85-87`, `_rollScreen` `:400-420`). Using the desktop restarts the clock (`tick` `:595-607`), and the owner coming back clears it (`onReturned` `:580-583`). `_autoLock` emits `workstation_auto_locked` (`:473-479`). The workstation's `setGlobal` emits `global_variable_changed:<k>` with `{ value, oldValue }` and only on a change (`:693-698`), so the new bark's `data.value === true && data.oldValue !== true` is sound whichever way the screen locks. PLAYTEST shows the lunch leave rolls open today (`PLAYTEST.md:98`: "still open at first ... locked by 04:04:55"), so a 50 s idle lock does shorten that wait. The coffee trips (15 to 35 s, `:180`) stay under 50. |
| N2 token clock | **Partly closed** | Correct: the clock starts at the plug-in, `expiresMin: 6`, and the T1 bark says to use the token soon (`credential_keyring.rb:163-167`, `:220-229`). The way back (T3r) cannot fire. See B1. |
| N3 Jun's PC off early | **Closed** | The new P11a gate drops `see_borrow_done`. The hub lever (`ink/ama_owusu.ink:111`, today `not act_evening and not jun_pc_off`) gains `collect_hot_desk_done`. The socket (`scenario.json.erb:558-579`) is covered by the borrow-first branch of P11a, which ticks both collects. The P12 gate stays `collect_hot_desk_done` (`:107`). |
| m1 recon R8c port | Closed, with a remaining gap (see m3 below) | A failed condition does not spend a once-only mapping: once and cooldown are checked first, then the condition, and a miss returns without counting (`npc-manager.js:1561-1592`). So adding `open_share_done` to `:494` in place is safe. |
| m2 socket shape | Closed | Plan line 187. |
| m3 ticks named | Closed | 2.3, 2.4, 2.5, 2.6. `network_device_refused` carries the `pcId` suffix and `reason: 'needs_console'` (`network-links.js:498-500`). `network_foothold_gained` carries the jack suffix (`:467`). |
| m4 T10 after a sign-out | **Not closed** | The `pc_signin_failed` mapping never fires for an expired token the screen already shows greyed. See B1. |
| m5 M12 pointer | Closed | 2.6, M12. |
| m6 base | Closed | Line 5. |
| m7 recap and bark | Accepted | 4.3. |

## Findings

### Blocker

**B1. Terminal: `token_ran_out` hangs on an event the sign-in screen never sends, so the way back is dead and T10 and T12 can be lost for good (2.4 lines 207, 210, 212, 223).**
- The plan has two ways to set `token_ran_out` and tick T10:
  - `pc_signed_out:backup_pc` with reason `token_expired`. This fires only for a session the client still holds (`pc-sessions.js:443-452`, `linkDropped` `:1100-1125`).
  - `pc_signin_failed:backup_pc` with reason `expired`.
- Once the token has run out, the server marks its row `expired: true` with no routes (`credential_keyring.rb:497-505`). The keyring keeps the greyed row on that foothold's screen (`keyring.js:851-854`). The sign-in screen draws it greyed (`password-minigame.js:2489-2496`). A click on it shows the expiry line and returns before any request (`useCredential` `:2577-2581`). So `signInWithCredential` never runs, and `pc_signin_failed` (`pc-sessions.js:813`) is never emitted. It could fire only in a race, with the row drawn live and clicked after the expiry.
- What this breaks:
  - **T3r never shows.** A player who let the first token run out before T3 held no session, so neither event fires. `token_ran_out` is never set, and Ama never offers the spare port. T3 and T11 are lost.
  - **T10 and T12 are lost for a player who signed out.** T3 is played, then T11, then Start > Sign out on the backup PC before the 6 minutes are up. The token runs out with no held session, and "try the token again" only shows the greyed line. T10 never ticks. T12's condition needs `token_expired_done` (line 225), so the last beat is lost too.
  - Line 210's "one who signed out first sees the refusal when trying the token again (T10 tick below)" is true on screen, but no tick comes.
- Fix (inside U4's files; no engine work):
  - Keep the `pc_signed_out ... token_expired` mapping.
  - Drop the `pc_signin_failed` mapping, or keep it only as a harmless extra.
  - Set `token_ran_out` from Ama's ink by self-report. Offer "My token's greyed out." when `use_token_done and needs_console_done` is not true and `scan_check_done` is (or after any later beat), and again after T9b when `not token_expired_done`.
  - That choice sets `token_ran_out` and ticks T10. When T3 or T11 is still undone, the reply is the T3r pointer.
  - The engine does not check a self-report, the same as the hot desk collects (2.5). Say so in 4.2.
  - Optionally word T3r so it can be offered with no clock at all: "If your token's greyed out before you used it, ...".
  - U4's Rails or JS test should cover the greyed row: no request and no `pc_signin_failed`.

### Major

**M1. Terminal: the shared screen ticks only if the player still holds Graham's session when the lever fires, so T9b and then T12 can be lost for good (2.4 T9b, lines 191, 205, 222).**
- `shared_screen` ticks on `pc_signed_out:graham_pc` with reason `relay_ended`. `_relayEnded` skips any PC with no held session (`pc-sessions.js:1148-1153`, `if (!previous) continue;`).
- Two ordinary paths lose the tick:
  - The player has seen Graham's screen, chooses Start > Sign out, then walks to Ama and asks for it to be ended.
  - The player pulls the lever ("Ask Graham to end the shared screen.", ungated in the plan) before connecting at all.
- On either path `graham_assist_ended` is set for good. The invite ends (`endsOnGlobal`, as `uma_assist`), no `relay_ended` sign-out ever comes, and `shared_screen` never ticks. T12's condition needs `shared_screen_done`, so the last beat goes too.
- Fix:
  - Gate the lever on `relay_seen and not shared_screen_done`. Before that, Ama says "Connect to his screen first."
  - Tick `shared_screen` in the lever's ink knot, and say the T9b line there.
  - Keep the `relay_ended` mapping only for a bark when the desktop was open, or drop it.
  - Word the T9 pointer so the player stays connected: "Keep his screen open, then ask me to have Graham end it."

### Minor

**m1. Second step: the lunch lever is not gated on the temper note, so a lunch pressed early leaves M5 waiting on a routine.**
- "Send them to lunch." is gated only on `not act_midday` and `kitchen_seen` (`ink/ama_owusu.ink:62`, `:210-215`). PLAYTEST says Darren's note must come first (`PLAYTEST.md:94`).
- After an early lunch, the only way back to Darren's lunch is the `room_entered:office` mapping. It sets his hunger again with a 300 s cooldown (`scenario.json.erb:796`). That means leaving the Office and coming back about 5 minutes later.
- Fix: give the lever a "Not yet. Watch Darren's temper first." line until `see_temper_note_done` (the 2.1.4 pattern), or write the way back into PLAYTEST.

**m2. Terminal: two network ports in one room make the T1 pointer ambiguous.**
- The pointer says "the server room port", but `spare_jack` stands by the rack.
- A box planted there first does not tick T1 (that mapping is on `rack_jack` only). It also starts the spare token's clock early (`start_token_clocks!`), so the way back is spent before it is needed.
- Fix: keep `spare_jack` out of the map until T3r. For example, give it `revealOnGlobal` set by the T3r knot. Or name the rack port in the pointer and give the spare port a plain observation.

**m3. Recon: `box_at_kitchen` records only the first plug-in.**
- Both `plug_in` mappings are `onceOnly` (`scenario.json.erb:485`, `:499`). A box first planted in the kitchen and later moved to the hot desk keeps `box_at_kitchen` true, so the R8c pointer names the wrong port.
- Ink reads the global only if it is a scenario global (`npc-conversation-state.js:593-596`, `isGlobalVariable`).
- Fix:
  - Append two mappings with no once limit: `network_foothold_gained:kitchen_jack` sets the global true, and `:hotdesk_jack` sets it false.
  - Declare `box_at_kitchen: false` in `globalVariables` as well as in the ink `VAR`.

**m4. Passwords: the borrow probe should also cover a dropped borrow.**
- If Jun's borrow is dropped (for example, the player holds the hot desk), `see_borrow`, P11c and Jun's cached record wait on his next frustration hand.
- Workarounds are started once for each (npc, index, hand) (`npc-workarounds.js:26-28`).
- Add to the probe: whether switching his PC on, then off again, brings the borrow back. Write the way back into PLAYTEST.

**m5. Text.**
- Line 189 runs two sentences together ("T10 still comes well inside the 12 minutes and `graham_assist` (...)"), so the `graham_assist` credential reads as part of the clock sentence. Split them.
- Line 223's "a retry after a sign-out" and line 478's m4 outcome should change with B1.

## Holds (checked this round)

- Once-only plus condition: a condition miss never spends the record (`npc-manager.js:1561-1592`). Recon R8c and Terminal T12 can be retried by plugging in and unplugging again.
- P8b: `delphine_pc` admits `roles: ["it"]` (`demo_ops_passwords/scenario.json.erb:381`). Graham is a domain admin (`:981`), so his sign-in there is allowed. The coffee lever can be pulled again if her short trip (about 28 s, `PLAYTEST.md:68`) closes the window.
- Passwords lunch: Julian leaves for good (`PLAYTEST.md:59`), so P7 and P8 are not lost to a short lunch.
- Token expiry with a held session: the client timer ends it with `pc_signed_out` reason `token_expired` and the expiry line (`pc-sessions.js:443-452`, `:1112-1125`). T10 for a player who stays signed in is sound.
