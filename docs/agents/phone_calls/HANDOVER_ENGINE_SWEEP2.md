# Handover: engine sweep part 2

Branch `build/phone-calls`, worktree `.claude/worktrees/p-phone-calls`. Stopped at the handover
threshold. All implementation, unit tests and the suites are done and committed. The remaining work is
live browser proofs plus the lab SE sha256 check.

## Done and committed
- `88862563c` — item 8 self-latch fix (M5 R2 blocker). Live-proven on m05 (Recruiter rings) and m09
  (Nightshade still rings): `proofs/ENGINE_SWEEP/PROOF.md`.
- `40a15667c` — items 9 (tutorial hold limit), 10 (terminal read beat), 11 (phoneTheme verify + docs),
  7b (callbackWhen reload recovery). Unit tests for each. Full record in `ENGINE_SWEEP.md`.
- Full JS suite 567/0 and Rails 2137/0/0 (1 skip), both under `flock /tmp/be-test-suite.lock`.
- `README_scenario_design.md` "Voiced phone calls" updated (tutorial-hold table row, call look /
  `phoneTheme`, the `callbackWhen` reload line).

## Open work — live proofs (server: keyless :3027 only)
Start the server with a **separate pidfile** (the shared `test/dummy/tmp/pids/server.pid` is used by other
agents' servers): `... rails server -b 127.0.0.1 -p 3027 -P tmp/pids/server3027.pid`. Stop it when done.

1. **Part A, owed from part 1 (items 1, 2, 4).** On `test_phone_calls` (`guard_off`) and m04 or m09:
   count `conversation_closed:<npc>` emissions after an answered call and after a displaced thread
   (expect one per contact, item 1); prove "(Close.)" posts no bubble (item 2); prove a refused dial
   shows the "Can't call right now" toast (item 4). Routes under `tools/phone_calls/routes/`
   (`m04_live.sh`, `m09_m1_live.sh`, `call_probe.sh`).
2. **Item 9 live on m01.** Accept the tutorial, leave it idle: the ring comes at about 20 s, with the
   banner clear of SKIP TUTORIAL and the step counter (it carries `#phone-ring-layer.under-tutorial`).
3. **Item 10 live on m07.** The last line of an Architect taunt stays readable (TERMINAL_CALL_END_READ_MS
   = 2600 ms) rather than flashing by. m07's fixer must have set the Architect's `phoneTheme: "terminal"`.
4. **lab_social_engineering unchanged.** Its tests plus the `sha256_noseed` check (Dev `ffe4c083…`, Ruth
   `52c50b7a…`), after the call and after reload, equal to before part 1. Scenario source is already
   byte-identical to 9ca867ac2 (`git diff` empty); this is the runtime proof. Route `se_dev.sh`.

## Decision flagged for the orchestrator (item 11)
The call/thread look is resolved once per phone session in `PhoneChatMinigame.init()`. So a contact's
`phoneTheme: "terminal"` makes its **call** terminal and a phone **opened directly on its thread**
terminal, but a thread opened by tapping the contact **within an already-open device-look session** stays
in the device look ("the look belongs to the device", review M6 R1 m2). Making the device list normal and
his thread terminal **in one session** would be a per-thread re-theme — a larger change that needs render
verification (the terminal class styles the whole `.phone-messages-container`). Not done here. If the
orchestrator wants it, it is an engine change to `openConversation` / the UI shell theming, not config.

## Gotchas
- Item 10 is gated on `this.params?.theme === 'terminal'`, not on `showCallEnded()` being false — a
  non-terminal call with no call screen (and the stubbed test harnesses) still closes at once. The first
  attempt that gated only on `showCallEnded()` broke `phone-outgoing-call.test.mjs` (11 fails).
- The stubbed-import minigame test harnesses (`phone-chat-closing-for-call`, `phone-outgoing-call`,
  `phone-call-terminal-beat`) must destructure `TERMINAL_CALL_END_READ_MS` in their header, or the method
  throws `ReferenceError` at call time.
- No new static import, so no harness copy-list change (item 10 only adds a named export to the
  already-imported `phone-call-lock.js`).
