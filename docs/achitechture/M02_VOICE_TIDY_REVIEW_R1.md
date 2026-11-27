# m02 voice tidy: code review, round 1

Branch `build/m02-voice-tidy`, head 86ba7768e (cb832e1c3 and 86ba7768e on top of main c22b8167e). Read only; nothing fixed.

## What was checked

- Ink: `m02_phone_ghost.ink` compiled to a scratch file with `bin/inklecate`; the result is identical to the committed `m02_phone_ghost.json`. No `GHOST PROTOCOL` text is left in the compiled JSON; the narrator line appears four times.
- Every path into the four endings, by reading the knots and the Ghost `eventMappings` (scenario.json.erb 1342 to 1418).
- The four bark edits and every other m02 bark and timed message for leftover starred cues (none left).
- Validator: every object in every scenario whose `minigameData` now matches more than one schema (a scratch script over the rendered ERB), the engine code that reads each layer, and the old and new validator run over all 175 scenarios (results below).
- The new test alone (`node --test test/js/validator-minigame-data-layers.test.mjs`: 1 of 1 pass), and the same test pointed at main's validator (it fails there with the 63-style errors, so it tells the two apart).
- TTS: `bin/rails app:break_escape:tts:wasted[m02_ransomed_trust]` reports 0 of 1087 current-model clips unrequested, 1087 lines expected, so the cache and the ink agree exactly. The three sidecars match the ink text, speaker, voice and style.
- `docs/IDEAS_BACKLOG.md`: three entries removed, all three about what the branch fixed.

## Findings

### Blocker

None.

### Major

**M1. The narrator line says "video window" on a path that is a phone chat.** `scenarios/m02_ransomed_trust/ink/m02_phone_ghost.ink:617` (in `act3_deal_accepted`).

Three of the four endings are reached only from the two video calls (`on_recovery_console` and `on_console_again`, both `conversationMode: "video-call"`). `act3_deal_accepted` is also reached from the terminal device: `mid_mission_contact` offers "Your offer. The keys for the evidence. I'll take it." (line 259) and diverts to `act3_accept` (line 260), which flows into `act3_deal_accepted`. The ink comment at lines 655 to 656 says this route is deliberate. That conversation runs in `phone-chat` with `phoneTheme: "terminal"`.

Failure: a player who said "I need time to think" on the console call, then picks up Ghost's device and accepts there, reads "The video window cuts to black" in a text chat with no video window. The old banner was neutral about the medium; this is the one thing the rewrite made worse.

Fix: word the line so it fits both a video call and the terminal chat, for example `Narrator: The screen cuts to black. One line of text holds: Ghost protocol, closed.` That is one new narrator clip (all four endings share it) and the f823da1dd62931244d6228b9a38ddde6 pair goes. If the user prefers to keep "video window" in the three video-only endings, give `act3_deal_accepted` a neutral line instead and voice both.

### Minor

**m1. The id, lockType and interactionType matches ignore `_dispatch`, and the union now makes that matter.** `scripts/validate_scenario.rb:488`.

Before, the first matching key won, so an id or lockType lookup was only a fallback when the type had no schema. Now every key that names a schema adds its fields and its required list. `_dispatch` in `minigame-data-schemas.json` says which key the engine really dispatches on, but the validator does not read it. So an object whose `id` happens to equal a type-dispatched schema name picks up that schema.

Failure: a `pc` with `"id": "notes"` and `minigameData: { "timerRef": "..." }` passes, though nothing reads `timerRef` on a pc; a `pc` with `"id": "kiosk"` gets a false "missing required field 'episodeId'". No scenario does this today: the only id matches on a non-id schema (`notes`, `alarm_panel`, `sis_config_panel`, `coverage_decision_form`) are objects whose type is the same key, which `uniq` folds. It is latent, and cheap to close.

Fix: take `obj['id']` only for schemas with `"_dispatch": "id"`, and `obj['lockType']` only for schemas with `"_dispatch": "lockType"`; keep `type` and `interactionType` as they are. Add a fixture row to the new test: a pc whose id is a type-dispatched key.

### Nit

**n1. Unrelated re-indent in the validator commit.** `scripts/validate_scenario.rb:6450`. The `end` closing `compiled_text = if ...` moved from column 24 to column 6. Both are valid Ruby; it is noise in a commit about minigameData schemas. Fix: revert that line, or leave it and say so in the commit message next time.

**n2. Noticed, not caused by the branch: `requiresGlobal` and `lockedMessage` are read on every object.** `public/break_escape/js/systems/interactions.js:1664` gates any object whose `minigameData` sets `requiresGlobal`, but only the `pc` and `report-workstation` schemas declare the two fields. A gated `infusion_pump` (or any other typed object) would get two false "undeclared field" errors. Fix, separately: add both to the validator's always-known set next to `_comment`, and drop them from the individual schemas.

## The validator change in detail

The objects that now match two schemas are all `type: "pc"` plus one other layer:

| Scenario | Objects | Second schema |
|---|---|---|
| m02 | 7 ransom-screen pcs (reception_terminal, both kiosks, ehr_terminal_ward, infected_terminal, kim_office_terminal, security_desk_terminal) | `ransomware_display` (lockType) |
| sis01 | ward_monitoring_station and one unnamed pc | `ransomware_display` |
| sis01 | ehr_terminal | `ehr_terminal` (id) |
| sis03 | claims_management_system | `claims_management_system` (id) |
| m06, test-blockchain-explorer | transaction_server, chain_terminal | `blockchain_explorer` (interactionType) |

Each second layer does read `minigameData` from the object (`ransomware-display-minigame.js:97,129`; the id dispatch at `interactions.js:1316` and 1363; the interactionType dispatch). All nine ransom-screen objects are `locked: true`, so the ransom fields are never dead weight on an unlocked pc. The pc schema contributes only two optional fields, both of which the generic gate at `interactions.js:1664` really reads on these objects. So in today's scenarios the union adds no field a layer would not read, and no new required field. The new test covers a typo in a layered field (still an error), a missing required ransom field (still an error) and a plain pc carrying a ransom field (still an error), which are the cases that matter.

Old and new validator over all 175 `scenarios/*/scenario.json.erb` (main's `scripts/` against the branch's, same scenario files, `--no-graph`). Error and warning lines were compared per scenario, ignoring the absolute-versus-relative path prefix that comes from running main's copy from a scratch folder. Only four scenarios change, and only by losing the false "undeclared field" errors:

| Scenario | Errors before | Errors after | Removed |
|---|---|---|---|
| m02_ransomed_trust | 63 | 0 | 63 (seven ransom-screen pcs) |
| m06_follow_the_money | 11 | 0 | 11 (transaction_server, blockchain fields) |
| sis01_healthcare | 17 | 1 | 16 (two ransom pcs, ehr_terminal); the 1 left is an `interactionWarning` shape error in ehr_terminal's patient data, unrelated |
| sis03_cyber_insurance | 12 | 8 | 4 (claims_management_system); the 8 left are word-cap lint |

That is 94 removed (63 plus 31, as the commit says), no error or warning added anywhere, and warning counts unchanged in every scenario.

## Ink and barks in context

The narrator line works at the three video-call endings: Ghost's last spoken line ("We'll be watching.", "Even if you never agree.", "This device reaches me if you change your mind.", "It can wait a few more minutes.") lands, then the narrator closes the picture. The banner carried two things, the cut and the "Ghost protocol, closed" sign-off; the line keeps both. In a video call it is voiced as the narrator (Algenib), which is what the stage-direction rule asks for. The one problem is the phone path in M1.

The barks read well without cues. The ellipses already carry the breathlessness ("Nurse... the machine...", "...it's harder... to see the numbers, love.", "...there's me screen. There it is."), and "...ta." works as a weak thank-you after the nurse arrives. No starred cue is left in any m02 bark or timed message.

## Verdict

Not ready as it stands, because of M1: one wording change and one clip. The validator change, the test, the barks, the cache and the backlog edits are sound. m1 is worth taking in the same round since it is a two-line change; n1 and n2 can wait.
