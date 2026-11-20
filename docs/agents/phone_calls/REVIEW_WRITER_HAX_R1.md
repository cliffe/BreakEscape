# Review: HaX call writing, round 1

Reviewer: dialogue review (npc-dialog-review skill, sections 2j and 2k especially), 2026-11-12.
Branch `build/phone-calls-writing`, commits 2ace2c1cd (m01), 5ab9b7e78 (m03), 4b42c7765 (m04), 9c47c1f84 (m05), bd327f2d5 (m06, m08), 1bbeac2a6 (m07 bring-in), feefae2bb (variety pass), df92687d7 (m07 text rewords). Notes: `docs/agents/phone_calls/WRITER_HAX_CALLS.md`.

## Verdict: revise

Most of the writing is good. The bring-ins are short, each one is tied to its own mission, none ends "See you at HQ.", and the `[Bring me in.]` replies all differ. Every call knot ends `#exit_conversation` / `-> DONE`, no text knot diverts into a call knot, and there are no printed variables or inline stage directions in voiced lines. One merge gate (B1) and six wording or state problems (M1 to M6) need fixing before round 2. Two of the M findings (M1, M4) come from errors in the plan itself, and the writer followed the plan.

Counts: B 1, M 6, m 8.

## Checks run

- `bin/inklecate`: all seven changed inks compile with no warnings; each committed `.json` matches a fresh compile.
- `dialoguelint`: no findings on changed lines. The remaining line-length errors (m03 :230 and :354, m04 :258, m05 :1077, m06 :238, m08 :190) and m07's crowded-hub check (:228) were there before this branch.
- `loopcheck` on every new or changed call knot (m01 `first_ring` and `closing_debrief`, m03 `m2_revelation_call` and `extract_call`, m04 `on_anomaly_confirmed` and `extract_call`, m05 `topic_architect` and `extract_call`, m06 `on_architects_fund_discovered` and `extract_call`, m07 `bring_me_in`, m08 `hax_read_1`) and on m01 and m03 `start`: no runtime errors; every call reaches a clean end.
- Validator: only the expected `call_answer_seconds` / `call_is_callback` "read but never set" warnings (m01, m03, m04, m05), plus m06's `transaction_server` schema errors, which were there before this branch. The writer's notes describe both correctly.
- Whole-line TTS collisions: no new or now-voiced call line matches a whole line in any other ink (grep over `scenarios/*/ink/*.ink`).
- Tag placement (inkjs walk): `#complete_task:call_in_after_sweep` lands on an empty Continue after the `[Bring me in.]` reply, before `[On my way. #ending_check]` is shown. `#exit_conversation` lines are handled the same way, so this works. m01's `#ending_check` / `#set_global` ride on the last line as planned.

## Findings

### B1. Hub choices now dead-end until A5 and each mission's config land, and the notes flag only m01

Files: m01 `m01_phone_agent0x99.ink:142-144`; m03 `m03_phone_agent0x99.ink:115-122`; m04 `m04_phone_agent0x99.ink:145-151`; m05 `m05_phone_agent_0x99.ink:185-187, 219-221`; m06 `m06_phone_agent_0x99.ink:161-163, 173-176`; m07 `m07_phone_agent_0x99.ink:228-230`; m08 `m08_phone_agent_0x99.ink:92-94`.

On today's engine, `#place_call:<knot>` is an unknown tag and `-> DONE` ends the story, so each of these choices plays nothing. Affected: every bring-in (the way out of m01 and m03 to m06), m08's door-audit read (the only way to name the mole when Netherton is down or hostile), m06's fund call, m04's dial and m05's root-flag topics. m07 survives only because its fallback timer also sets `debrief_requested`. The two text mappings that still open call knots by `targetKnot` (m03 ERB `:1016` to `m2_revelation_call`, m04 ERB `:898` to `on_anomaly_confirmed`) now close the thread with `#exit_conversation` / `-> DONE` instead of returning to the hub.

The notes say "else the branch flow is broken" only under m01. The other missions list their config but not the breakage, and none of them says the engine side (A5's `#place_call` and `call` entries) has to land as well as the config.

Fix: no ink change. Add one line at the top of the notes: this branch must not merge into `build/phone-calls` or `main` until A5 is in and each mission's `call` entries and ring mappings are added in the same merge. The implementer's checklist for each mission should name its dead-end choices.

### M1. m06 bring-in last line contradicts the state: the money is already decided

`m06_phone_agent_0x99.ink:634` "We'll decide about the money at HQ, not on a phone."

The bring-in choice needs `ready_to_extract`. That is set only when `assets_decided` and `irina_fate_decided` are true and all four flags are in (ERB `:1621-1634`; ink comment at `:159-160`). So on every route the player has already frozen or watched the wallet. The line comes from plan 7.6 (and 7.5's "fund decision still open"), which got this wrong. Flag that to the plan owner.

Rewrite: "We'll talk about the money at HQ, not on a phone." The debrief reviews the choice in person (7.5), so this defers the conversation without implying the choice is still open.

### M2. m05 root-flag call: the plain opening is an instruction, and the Architect is never named

`m05_phone_agent_0x99.ink:331-335`.

The ring replaces the text "Root flag in. The Architect's authorisation, casualty projection and all." Nothing spoken in the call now says whose authorisation it is. The body never names the Architect, and the planned decline text ("Root flag's in. Ring me back. You need to hear this.") doesn't either. So a fact the text carried is lost (2k). On a quick answer, which has no opener branch, the first thing the player hears on a ringing call is "Read it twice." That sounds like an order to read a document they haven't been sent. After the callback line it clashes: "Thank you. Listen. Read it twice."

Rewrite line 335 (shared by all three paths, and it works whether she rang or the player did): "The Architect's own authorisation. I've read it twice: a casualty projection, reviewed, and signed off as an acceptable cost."

### M3. m04 dial call says the same thing two or three times in a row

`m04_phone_agent0x99.ink:514-520`.

- Callback path: "You rang. Good. Nightshade's read it." followed by "Nightshade's got your reading." The planned decline text (7.2) is also "Nightshade's got your reading. Ring me back." So on the callback route the player gets that fact three times.
- Plain path: "Sixty-one. You were right not to trust their screens." followed by "Sixty-one degrees on the Hall 1 battery thermometer…" and then "The screens lie because ENTROPY feed them." That is the number twice and the screens point twice, in four lines.
- Slow path: "That dial won't wait." followed by "they won't wait for 0800" in the next line but one.

The notes call the "Sixty-one" echo deliberate. Read aloud on a call, it sounds like a stammer.

Rewrite (the plain opener stays as plan 7.2 gives it):
- callback (:514): "You rang. Good. Straight to it."
- slow (:515): "There you are. No time for hello."
- body (:518): "Nightshade's had a look at your reading. Thirty-three degrees over what the screens show."
- body (:520): "ENTROPY feed those screens. That dial isn't on their network."
- decline text (config, for the implementer): "Got your reading. Ring me back."

### M4. m06 "Call me" lines sit in a text topic

`m06_phone_agent_0x99.ink:588` "…Call me when you've opened it." and `:593` "…Call me when you have them."

Plan 7.3 keeps these lines because it says they are "inside the fund call; the hub choice dials it again". In fact they are in `satoshi_ko_choice`, reached from the text-topic hub choice `[About the fund. I'm ready to decide.]` (`:166-167`) and the `on_satoshi_ko` text mappings (ERB `:1328`, `:1335`). That contact has no `call` entry for this beat, so under 3.5 the line should say "message me". The plan's line references are stale (`:579`/`:584`); flag that to the plan owner.

Rewrite: "The custody console in the data centre. Message me when you've opened it." and "They're on the vault account on the backend. Last flag. Message me when you have them." These are text lines, so there is no audio cost.

### M5. Hanging up early loses a call's content for good

The latch that hides each hub choice is set before the player has heard the call. The End button is always there on a placed or unforced call, and once the call ends the story resets to the home knot.

- m06 `:174`: `~ reacted_fund = true` runs in the text thread before dialling. If the player hangs up on "I've got it in front of me." (or the call can't open, 2.5 row 19), the fund call and HaX's recommendation are gone. Plan 7.2 says to keep the latch on the hub choice; this is the consequence.
- m04 `:512`: `~ anomaly_call_heard = true` is the first line of the call. Hanging up after the opener loses Nightshade's read and the "where do I start" pointer. A call that was answered gets no callback.
- m05 `:330`: `~ architect_discussed = true` has the same problem.

Fix: move each latch to the call's last beat, so the hub choice stays until the call has played. For m06, set `~ reacted_fund = true` on both exits (`critical_choice_choices` "[Let me think about it.]" and `handler_recommendation`). For m04, set it in each `on_anomaly_confirmed_choices` reply. For m05, set it in each `topic_architect_choices` reply. Before moving `anomaly_call_heard`, check whether any mapping reads it as a global; if one does, keep the `#set_global` with the move.

### M6. m01 first ring: the reason for texting doesn't fit the player's cover

`m01_phone_agent0x99.ink:114, 117`.

The player is in as an IT contractor auditing the network (`m01_opening_briefing.ink:119`), so a contractor's voice in the corridor is normal. The risk is being overheard talking to a handler, not being heard at all. "Someone hears one where there shouldn't be" doesn't hold up, and this line is the reason the call exists (7.2: it "gives the texts a reason"). Also, "before you go dark" at :114 reads oddly when the next line says she'll keep texting.

Rewrite:
- :114 (plain): "You're in. One test call before it's texts only."
- :117: "A contractor on the phone is nothing. A contractor overheard talking to me is the end of your cover."

### m1. m01 first ring: the callback and slow branches drop the reason for the call, and one choice closes on the player's line

`m01_phone_agent0x99.ink:111-127`. On the callback and slow paths, the "line test" reason (:114) never plays, so the call jumps from "Took your time…" straight to the corridor line. Option: shorten the plain branch to "You're in." and add a shared line after the conditional, "One test call before it's texts only." (moving it out of M6's :114). Separately, `[Understood. Texts it is.]` (:121) hangs up on the player's own words. Give it a short reply, e.g. "Good. Off you go."

### m2. m03 revelation opener repeats the text and says "just" when it may be late

`m03_phone_agent0x99.ink:475-477`. The text that comes before the call already says "Got the distcc logs." The plain opener then says "Your distcc flag just landed…" on the player-placed path (the common one, possibly much later) and on the two-minute fallback ring. All three branches restate the flag landing. Option for the plain branch: "Logs are up on my side. Open your copy and read along." The callback and slow branches can keep their greetings and drop "Your distcc flag landed".

### m3. m03 revelation choices are once-only inside a call that can be redialled

`m03_phone_agent0x99.ink:491-499, 518-520` use `*` choices. Each call that ends after a `m2_revelation_choices` pick but before `m2_revelation_end` uses up one of the three choices. A fourth call would find no choices and raise "ran out of content". Hanging up is now one tap, so this edge case is easier to reach than when it was a text thread. Make both sets `+`.

### m4. A bring-in redialled after "Not yet" replays its opening word for word

m03 `extract_call`, m04 `extract_offer_text`, m05 `extract_call`, m06 `extract_call`. The second call opens exactly like the first. In m06 the line also goes stale: "Police are twenty minutes out" (:607) after she said "A few minutes. The police won't give you more." (:620). Option: a short repeat opener on a visit count (`{extract_call > 1: …}`), e.g. m06 "Police are close now. Ready?". That is one new clip per mission, and each must differ from the others.

### m5. m08 door audit: "Let me read it again" hangs up without a reply, and a redial replays the full opener

`m08_phone_agent0x99.ink:237, 258` end the call on the player's line. Give them a short reply, e.g. "Go on. I'm not going anywhere." A redial after a wrong answer opens again with "Two questions, the ones he'd ask." (:232). On a repeat call, "Again, then. When was the plan opened?" would sound like a person who remembers the last call.

### m6. m08 now-voiced line uses an inline conditional

`m08_phone_agent0x99.ink:277` `{netherton_ko:…|…} You finish the chain.` Plan 3.6 asks for whole-line conditionals in voiced lines. Split it into a `{ - netherton_ko: … - else: … }` block, with "You finish the chain." as its own line, so the extractor sees two clean lines. Check `voicelines.mjs` / the extractor key diff for this line when the slice runs its checks.

### m7. m04 hub choice quotes a call that hasn't happened yet

`m04_phone_agent0x99.ink:149` `[You wanted to talk about the dial reading.]` shows as soon as `anomaly_detected` is set. With the ring on a 6 s `delayMs` and the text removed, a player who opens the thread inside those six seconds is answering something HaX hasn't said yet (2i). It is brief and low cost. Option: "[About the dial reading.]", which also still fits after a declined ring.

### m8. Notes: the variety listing will need updating

The listing's note about m01 and m04 sharing the "You rang… Good" cadence no longer applies if M3's m04 callback rewrite is taken. Update the listing with round 2's lines.

## Variety (3.6), checked side by side

- Callback openers: m01 "You rang back. Good habit.", m03 "Knew you'd get back to me…", m04 "You rang. Good…" (see M3), m05 "Thank you. Listen." All are separate sentences. Only m01 and m04 share a cadence.
- Slow-answer openers: m01 "Took your time…", m03 "Thought I'd lost you…", m04 "There you are…", m05 "Finally. Sit down for this." Each fits the mission and the stakes, and none names a number.
- Bring-in openings, replies, "Not yet" replies and last lines all differ across m01 and m03 to m07. m03 and m05 both open with "Once you're out", which the plan allows. The m07 one-line hand-off ("Putting you through. He's waiting.") lands because the call is that short.
- Within each mission, no two calls open with the same kind of line.

## Plan errata to pass on

- 7.6 / 7.5 m06: the "fund decision still open" premise is wrong, because the bring-in needs `assets_decided` (M1).
- 7.3 m06 `:579` / `:584`: these lines are in `satoshi_ko_choice`, a text topic, not in the fund call (M4).
- 7.2 m06: keeping `~ reacted_fund = true` on the hub choice loses the call on an early hang-up (M5).
