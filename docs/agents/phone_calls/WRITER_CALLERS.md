# Phone calls: caller writer notes (everyone except HaX)

Part B "Ink" step, written ahead of the engine. Worktree `.claude/worktrees/p-phone-writing`,
branch `build/phone-calls-writing`. Scope: ink plus plan-named text rewords only (no config keys,
no event-mapping changes). Config (`ring`, `call`, `voiced`, `withheld`, mapping edits) is a later
implementer's job; this file lists the config each knot needs so the implementer can wire it.

Order: m09 (M1), m04 (M4), m05 (M5), m07 (M6).

---

## M1 — m09 Nightshade, Torres, Gary (incoming voiced calls)

These were unvoiced text threads that already read as calls (plan 7.2). The ink already reads as
speech, so the writer work was: drop the fake `[Ring back.]` home stubs (the engine now provides a
real missed-call callback / ring-out), mark each `call` knot `// lint: call-knot`, and reword
Gary's `_comment`. No call-VAR openings: the M1 rows do not ask for callback / slow-answer lines on
these one-shot callers, so each has a single opening line.

### Config each knot needs (for the implementer — plan 7.2 M1 row)

- `call_map(...)` for each contact gains a `ring:` keyword; the mapping passes `ring: true` and
  `voiced: true`. Defaults: `onMissed: "callback"`, 20 s ring-out.
  - Nightshade: `scenario.json.erb` `call_map("global_variable_changed:flag1_submitted", ...)`.
  - Torres: the two `call_map`s (box `object_interacted` and `item_unlocked`) plus the reading-found fallback.
  - Gary: `call_map("door_unlock_attempt", "... salvage_cage && m02_gary_protected", "call", delay: 1500, ...)`.
- Gary voice: plan asks to keep Charon aligned to the m10 `gary` style (`m10 scenario.json.erb:498`).
  That is a voice-block / config change, OUTSIDE this writer's scope — NOT done here. Flagged for the
  orchestrator. Audio step must check a Charon clash with Netherton and log for the user.

### Spoken lines table (knot = `call`; all voiced after config)

| Contact | Line | Before | After | Voiced | Note |
|---|---|---|---|---|---|
| Nightshade | opening | (unchanged) | "Agent 0x00. I'd ask how the leave was, but HaX would tell me to get off her line." | yes | content unchanged; knot now voiced |
| Nightshade | last NPC line | (unchanged) | `Agent HaX:` "He's right. I hate that he's right." | yes | co-speaker resolves to `agent_0x99` (phone), correct on a call |
| Torres | opening | (unchanged) | "I gave you this address back in October. It was a line in a list." | yes | content unchanged |
| Torres | last NPC line | (unchanged) | "Safe enough. Please be quick." / "Do not thank me. I was one of them." | yes | two reply branches |
| Gary | opening | (unchanged) | "It's Gary. Whitlock, from St. Catherine's. HaX says you're…" (two branches) | yes | content unchanged |
| Gary | last NPC line | (unchanged) | "Director of Cyber Security, me…" / "Go on, then. Somebody should read an archive properly for once." | yes | two reply branches |

No spoken line text changed; the only ink deletions are the three `[Ring back.]` / "The number rings
out." home-stub lines (never voiced). `start` is now `-> DONE` (resting stub, shows the transcript).

### Config/other-text changes

- Gary `_comment` (ERB): "…Unvoiced. …his call is a text thread" → "…voiced incoming call. Charon
  voice… the audio step checks for a Netherton clash…".

### Variety listing (openings + last lines, side by side)

| Caller | Opening | Last NPC line |
|---|---|---|
| Nightshade | "Agent 0x00. I'd ask how the leave was…" | "He's right. I hate that he's right." (HaX) |
| Torres | "I gave you this address back in October…" | "Safe enough. Please be quick." / "Do not thank me…" |
| Gary | "It's Gary. Whitlock, from St. Catherine's. HaX says you're…" | "Director of Cyber Security, me…" / "Go on, then…" |

All three distinct in shape and voice; none matches a HaX opening. Each caller has one call, so no
within-caller repeats.

### Voiced-line count

- Voiced lines newly carrying a voice: Nightshade ~7, Torres ~8, Gary ~7 (= the existing call-knot
  lines, now spoken). Re-keyed: 0. No new text, so nothing re-keys.

### Checks run

- Compile: m09_phone_{gary,nightshade,torres} OK.
- dialoguelint `scenarios/m09_digital_archaeology/`: exit 0, no findings.
- validate_scenario m09: passes (0 errors; 6 pre-existing "no behavior" recommended warnings on
  decorative loading_dock NPCs, unrelated).
- Commit: `0bed21506`.

### Open for orchestrator

- Gary voice-style alignment to m10 (config, not done here).
- The `ring:` keyword and `ring:true`/`voiced:true` on the three `call_map`s are config (not done here).

---

## M4 — m04 Robert Vance callable (voiced outgoing call)

Scope here is Vance only. m04's HaX dial-ring (`on_anomaly_confirmed`) and HaX bring-in are the HaX
writer's. The Vance support conversation was a silent text thread that read as spoken SCADA guidance;
it becomes a voiced call the player places from Vance's thread. Vance is a stressed engineer: he picks
up on the first ring, so NO `call_answer_seconds` line; outgoing call, so NO `call_is_callback` line
(plan 3.6).

### Config each knot needs (implementer — plan 7.2 M4 Vance row)

- `robert_vance_phone` record (`scenario.json.erb:1489`) gains:
  - `"call": { "knot": "support_call", "when": "globalVars.vance_is_ally && !globalVars.robert_vance_ko", "unavailable": "no_answer" }`
  - `"callLabel": "Albion ops desk"`
- Voice block is already a phone-line style ("Speaking over a phone line from the control room"), no change.
- The `timedMessages` "…Anything in Hall 1 older than the network, read it." and the bring-in text stay.
- **Current-flow break (documented per brief):** the support hub is now reached ONLY through the
  `support_call` knot. On this writing branch there is no `call` block yet, so opening Vance's thread by
  hand lands on the new silent `start` stub (one "(Close.)" exit) and never reaches the hub. That is the
  intended M4 design; it starts working once the implementer adds the `call` block above. No mapping or
  `targetKnot` referenced the old entry knot `vance_phone_support_start` (renamed to `support_call`), so
  nothing else breaks.

### Ink structure changes

- `start`: was `{robert_vance_ko:…}{not vance_is_ally:…} ~ counter -> vance_phone_support_start`. Now a
  silent home text stub: one `[(Close.)]` exit, no NPC line.
- `vance_phone_support_start` renamed `support_call` (the `call` entry's knot); `~ vance_support_calls += 1`
  moved here from `start`; marked `// lint: call-knot`.
- Removed knots `vance_not_yet_ally` and `vance_no_answer` (engine rings out via `when`/`unavailable`).
- Removed the `{robert_vance_ko: -> vance_no_answer}` guard at the top of `support_hub`.
- `// lint: call-knot` added to all 10 spoken call knots (support_call, support_hub, charge_control_…,
  server_room_guidance, safe_disabling_guidance, priority_guidance, crew_offer, crew_sound,
  urgency_assessment, support_call_end).

### Spoken lines table

No spoken Vance line text was changed. The conversation (~51 NPC lines by the linter, "~65" in the plan)
now carries a voice unchanged. Only deletions were the non-voiced stub/guard lines:

| Line | Before | After | Voiced |
|---|---|---|---|
| `start` routing + `[(He's at the ops desk…)]` + `[(No answer.)]` | fake not-ally/KO stubs | one `[(Close.)]` exit | no (text stub) |
| opening (support_call) | "Vance. What do you need?" / "Banks are isolated…" / "Vance. The hydrogen's still climbing." / "Vance." | unchanged | yes |
| `support_call_end` first line | "Call me if you need it." | unchanged (stays — Vance is callable, 7.3) | yes |

### Variety listing

Vance has one call. Openings (state branches): "Vance. What do you need?" / "Banks are isolated. The
hydrogen's coming down at last." / "Vance. The hydrogen's still climbing." / "Vance." Last line:
"Call me if you need it." + "And hurry." / "I'm not going anywhere." All Vance's own voice; none clash
with HaX's openings or with the m09 callers.

### Voiced-line count

~51–65 lines now carry a voice (the whole Vance support conversation). Re-keyed: 0 (no text changed).

### Checks run

- Compile m04_phone_robert_vance: OK. dialoguelint m04: exit 0, no Vance findings.
- validate_scenario m04: 0 new errors/warnings from this change. Pre-existing (not Vance, not touched):
  5 word-cap lint findings in m04_closing_debrief / m04_phone_agent0x99 / scenario.json.erb:1129, plus
  objective-wiring and cutscene warnings.
- Commit: `eb90b1b36`.

### Open for orchestrator

- The `call` block + `callLabel` config on `robert_vance_phone` (not done here); the hub is unreachable
  from the thread until it lands.

---

## M5 — m05 Recruiter + Patricia (voiced calls); rewords already applied by HaX writer

My M5 scope: Recruiter (first call, ring-back, follow-up), Patricia callable, and the plan-named M5
rewords. The HaX root-flag ring (`topic_architect`) and HaX bring-in are the HaX writer's.

### IMPORTANT — overlap found

The shared files `scenario.json.erb`, `m05_phone_agent_0x99.ink`/`.json` already carry UNCOMMITTED
changes from the HaX writer in this worktree. All six M5 rewords the brief assigned me are ALREADY
applied there (HEAD still says "Call me"; the working tree says "Message me"):

- ERB `:1064` "…Message me if you want to talk it through." (was "Call me…")
- ERB `:1070` "A personal journal. Message me once you've read it."
- ERB `:1457` "…then message me for Security: he swings while you're on your phone."
- ERB `:1484` "…Or get clear and message me for Security."
- `m05_phone_agent_0x99.ink` (now line 915) "…Get out of his reach, then message me." (was "then call me.")
- `m05_phone_agent_0x99.ink` (now line 950) "Message me again if it helps." (was "Call me again if it helps.")

The bring-in "…then call me" lines (research-server finish, vault sweep, report_progress) are correctly
LEFT as "call me" (the bring-in is a real call). I did NOT edit or commit these shared files: they
belong to the HaX writer and contain their uncommitted work (root-flag ring + bring-in). The rewords
will land with the HaX writer's ERB/ink commit. Content verified against plan 7.3; nothing left to do.

### Config each knot needs (implementer — plan 7.2 M5 rows)

- **Recruiter** record (`scenario.json.erb:1503`): replace the three `conversation_closed:{patricia_morgan,
  patricia_phone,agent_0x99_handler}` sendTimedMessage mappings with a `ring` mapping on the same three
  events + condition: `ring: { onMissed: "callback" }`, `targetKnot: "first_call"`,
  `callLabel: "TalentStack Executive Recruiting"`, keep `setGlobal: { recruiter_texted: true }`. Add a
  `phone_call_declined`/`phone_call_missed` mapping sending the old text as her follow-up. Add the
  `call` block `{ knot: "return_contact", when: "!globalVars.recruiter_line_dead", unavailable: "no_answer" }`.
  - **R2 M4:** `recruiter_line_dead` must be **declared** in m05's `globalVariables` (`"recruiter_line_dead":
    false`, next to the other `recruiter_*` globals). The ink sets it with a plain `~`, and the engine syncs
    an ink VAR back only when the name is already a global (`npc-conversation-state.js:522`). Undeclared, the
    `when` is always true and every press of Call after her final word replays `return_contact`. Declare it
    and keep the condition — do not drop it. No ink change (the `~` assignments sync once it is a global).
- **Patricia** record (`:1534`): keep the text intro; add `call: { knot: "phone_call",
  when: "globalVars.patricia_phone_available && !globalVars.patricia_ko", unavailable: "no_answer" }`.
- **Current-flow break (documented):** on this branch (no `call` block yet) both threads open on the new
  silent `start` stub and never reach their hub/pitch. Intended M5 design; starts working with the config.
  No mapping/`targetKnot` referenced the renamed entries (recruiter: the pitch body is now `first_call`,
  not `start`; patricia: hub entry is `phone_call`, not `start`).

### Ink structure — Recruiter (`m05_phone_recruiter.ink`)

- `start`: was the pitch + routing. Now a silent by-hand router (`{not torres_identified: -> not_yet}
  -> idle`), never into a call knot.
- `first_call` (new, call entry, ring targetKnot): the pitch body, Caller-ID narration dropped; keeps the
  playtest-history guards (`final_choice != ""` → post_confrontation; `recruiter_deal_offered` →
  return_contact).
- `return_contact`: marked call entry (`call` knot, dialled by Call button).
- Every call-end: the "The line goes dead." / "She hangs up first." narration dropped, `-> idle`
  replaced by `#exit_conversation -> DONE` (deal_choices, deal_taken, deal_refused, final_statement,
  never_talked_terms, hangs_up, end_contact). `~ recruiter_line_dead = true` kept.
- `idle`: ring-back choices removed (Call button rings her back); just a `[Leave it.]` stub.

### Ink structure — Patricia (`m05_phone_patricia.ink`)

- `start`: new silent text stub (one `[(Close.)]`), no route to hub.
- `phone_call` (new, call entry): the old `start` body (`{patricia_ko}{not available} -> hub`), marked.
- `not_yet` / `no_answer`: fake-ring choices removed; now call-enders (`#exit_conversation -> DONE`)
  used only if Patricia goes unreachable mid-call (the `when` gate keeps her off otherwise).
- All call-ending `#exit_conversation -> hub` → `#exit_conversation -> DONE` (13 sites: the hub
  check-in, wrong-name/wrong-reason ends, halloran accuse, on-my-way, understood). Mid-call loop/guard
  `-> hub` lines (and `{…: -> hub}` redirects) untouched. `hub` marked call-knot.
- Patricia's "Ring me…" lines (7.3 :120/:152/:338/:355) stay — she is callable.

### Variety listing (openings + last NPC lines)

| Caller/knot | Opening | Last NPC line |
|---|---|---|
| Recruiter first_call | "Agent. Or whatever they're calling you this week." | (branch) "…the other forty-seven were never your problem." / final_statement "…didn't stop because you found one of mine." |
| Recruiter return_contact | (mid) "Still deciding? The offer doesn't improve with age, agent." / (post) deal_accepted/refused responses | "…I've built a career on the difference." / final_statement |
| Patricia phone_call | "Go on, then. Who?" / hub re-entry lines | "Whatever you decide in front of him, ring me when it's done." / "Ring me when it's done." |

Recruiter and Patricia voices are distinct from each other and from HaX. Recruiter has two call paths
(first_call, return_contact) with different openings. No call-VAR openings: plan 3.6 — the Recruiter's
slow-answer enjoyment is a "may" (not required by the M5 rows); Patricia and the Recruiter ring-back
are outgoing (no callback line). Kept simple per the M5 rows.

### Voiced-line count

- Recruiter: ~60 lines now carry a voice (first call + ring-back), re-key 0 (deletions were non-voiced
  narration + fake-ring choices).
- Patricia: ~50 lines now carry a voice, re-key 0.
- M5 rewords: 0 audio (text only), and already applied by the HaX writer.

### Checks run

- Compile m05 Recruiter + Patricia: OK. dialoguelint m05: exit 0.
- validate_scenario m05: no new errors in my files. Pre-existing/allowed: recruiter.ink:90 (non-verbal
  choice "allowed"), recruiter.ink:363 "not a defence" WARN (documented intentional villain line, not
  touched). Word-cap ERRORs are in m05_closing_debrief / m05_phone_agent_0x99 (not my files).
- Commit: `b7ef97a7f` (Recruiter + Patricia only; shared ERB/HaX ink left to the HaX writer).

### Open for orchestrator

- The Recruiter ring mapping + follow-up mapping + `call` block, and Patricia's `call` block (config).
- The six M5 rewords are already in the working tree via the HaX writer's uncommitted edits to
  `scenario.json.erb` and `m05_phone_agent_0x99.ink`; they will commit with the HaX writer's work, not
  mine. Flagging the overlap so the orchestrator knows the rewords are covered.
- Plan step-8 M5 note: log for opus48 whether m05's VM companion sheet describes how the call to HaX
  opens, now the bring-in is a placed call. (Not actioned here — sheet work is out of my scope.)

---

## M6 — m07 The Architect (withheld voiced calls + voicemails)

My m07 scope: the Architect's taunts and sign-off as withheld voiced calls (C6), his voicemails, the
`start`/`parked`/`dead_air_choices` router changes, and the narration rewrites. HaX's bring-in
(`m07_phone_agent_0x99.ink`) is the HaX writer's — untouched by me. Only `m07_architect_comms.ink`
(+ .json) changed.

### Config each knot needs (implementer — plan 7.2 m07 rows). CRITICAL: current flow depends on this.

- Each taunt mapping (`scenario.json.erb` ~:1570-1624, 1641-1646) must DROP `sendTimedMessage` and gain
  `conversationMode: "phone-chat"`, `ring: { withheld: true, onMissed: "voicemail", voicemailKnot: "<knot>_vm" }`,
  keeping its event, condition and old `delay` as `delayMs`. Retarget `targetKnot` from `"start"` to the
  specific knot:
  - T-30 (`room_entered:operations_floor`) → `taunt_t30`, vm `taunt_t30_vm`
  - T-20 (`architect_t20_played`) → `taunt_t20`, vm `taunt_t20_vm`
  - the three T-10 rows (`architect_t10_played`) → `taunt_t10`, vm `taunt_t10_vm`
  - T-5 (`architect_t5_played`) → `taunt_t5`, vm `taunt_t5_vm`
  - T-1 (`architect_t1_played`) → `taunt_t1`, vm `taunt_t1_vm`
  - post-countdown (`countdown_expired`, "Seattle first. As scheduled.") → NEW knot `seattle_call`, vm `seattle_call_vm`
  - **R2:** the config step MUST drop the `sendTimedMessage` bark at `scenario.json.erb:1644` ("Seattle
    first. As scheduled."). The `seattle_call` opener covers it; if the bark stayed, the player would be
    told the same thing twice in a row (and it trips a repeated-line validator warning until then).
- Sign-off (the two `minigame_completed`/`minigame_failed` mappings, already `conversationMode: "phone-chat"`,
  `targetKnot: "sign_off"`): ADD `ring: { withheld: true }` and `disableClose: true` (forced, auto-answers,
  no voicemail). Keep `setGlobal: { architect_signoff_started: true }`.
- **Current-flow break (documented):** on this branch the taunt mappings still `targetKnot: "start"`, and
  `start` no longer forwards to the taunt knots (the ringer is meant to). So UNTIL the config retargets each
  mapping to its taunt knot, the taunts will not play. This is the intended M6 design (ringer delivers them).
  The config change and this ink must land together.
- **Timing + gating preserved:** the config keeps each mapping's event/condition/delay (timing T-30…T-1
  intact). `architect_signoff_done` is still set at the top of `sign_off` (line 384) and the debrief still
  waits on it — unchanged. `heard_*` VARs and the `late_first_contact`/`t20_folded`/`t1_first_contact`
  fold logic are preserved inside the taunt knots and mirrored in the `*_vm` knots.

### Ink changes

- `start`: drops the taunt/sign-off routes; keeps only after_win, dormant, dead_air (plan (1)).
- `parked`, `dead_air_choices`: drop the taunt-pending / sign-off routes (plan (1)).
- `t30_close`…`t1_close`, `signoff_close`, `seattle_close`: end `#exit_conversation` + `-> DONE` instead
  of `-> parked` (plan (2)).
- Six voicemail knots `taunt_t30_vm`…`taunt_t1_vm`, `seattle_call_vm`: each sets the same `heard_*` VARs
  (folds included) its live taunt would, then 1–3 short `voice:` lines (≤25 words each) carrying the
  taunt's point; `taunt_t30_vm` also sets `architect_echo_heard` with the teacher-echo line, so the m06/m07
  teacher thread survives a declined T-30 (plan (3)).
- `seattle_call` (+ `seattle_call_choices`, `seattle_close`): new post-countdown withheld call.
- Narration rewrites (plan (4)): the five first-contact openers ("…already connected, and has been for
  some seconds.") → "No caller ID. The line opens before you speak."; the three "no call in log" lines
  (t30_close, t20_close, signoff_close) → a log that shows a withheld call ("…one call: no number, no
  name." etc.). Judgment: I also reworded two else-branch openers that directly contradicted a ringing
  call ("The handset opens the line without asking." / "…the line is already open.") since "narration
  rewrites" is in my scope; I left `taunt_t20`/`taunt_t10` else openers ("cuts across the facility alarm",
  "screen wakes on its own") — defensible as his style, and the plan scoped only the five. Flagging for the
  reviewer in case all subsequent openers should ring too.
- `// lint: call-knot` on taunt_t30..taunt_t1, sign_off, seattle_call and the six vm knots.
- To clear a validator warning on THIS branch (bark "Seattle first. As scheduled." == my seattle_call
  opening line), the seattle_call / seattle_call_vm openers lead "It's done, then. Seattle first, as
  scheduled." instead of verbatim. (The warning is an old-config artifact; it also clears once the config
  drops the bark.)

### Variety listing — the Architect's calls (one shared voice block, so these MUST differ)

| Call | Opening (first spoken) | Last NPC line |
|---|---|---|
| taunt_t30 | "Don't look for the trace. It isn't there." | "Let it hurt afterwards, not during. I expect you've been told that." |
| taunt_t20 | "You've sent your team." | "Answer honestly… Did you decide with a number, or with your stomach?" |
| taunt_t10 | (branch) "You moved them…" / "You logged in…" / "The beauty of entropy…" | "You still have a door open…" / "Doors close. It's the one thing they reliably do." |
| taunt_t5 | "The man in your control room would give you his figure…" | "…name them? You will have to, eventually, to somebody with a tablet." |
| taunt_t1 | (branch) "Late. I did wonder." / "Closer than the file suggested." | "He hangs up first…" (narration) after "…written every one of them down." |
| seattle_call | "It's done, then. Seattle first, as scheduled." | "No. For you it's barely started." |
| sign_off | "You saved eight point four million people…" / "You saved the rest of it…" | "You'll have the figures too. Then we'll both know the same thing about you." |

Voicemails mirror each taunt's point but are mutually exclusive with the live taunt (answer OR voicemail),
so the shared phrasing is never heard twice. Across different taunts/vms the openings are distinct.

### Voiced-line count (m07, my scope)

- Live taunts + sign-off + seattle_call: ~60 lines now carry a voice.
- Voicemails: ~14 `voice:` lines across six vm knots.
- Re-key: 0 (new voiced content; no existing voiced line's text changed in a way that re-keys — narration
  is not voiced).

### Checks run

- Compile m07_architect_comms: OK. dialoguelint: my file has 0 line-len/voiced-variable errors after
  splitting the voicemail lines; 2 WARN "however" (false positive, "make it however you like" = any way;
  one is pre-existing authored content). Other m07 lint errors (L9xx text-len) are in `m07_phone_agent_0x99`
  / `m07_closing_debrief`, not my file.
- validate_scenario m07: "✓ Validation complete!"; the "Seattle first" repeated-line warning cleared.
- Commit: `2ba59e261`.

### Open for orchestrator

- The taunt/sign-off config retarget + `ring`/`disableClose` keys (above). Taunts do not play until it lands.
- Reviewer call: whether `taunt_t20`/`taunt_t10` else-branch openers ("cuts across the facility alarm",
  "screen wakes on its own") should also be rewritten to ring (I left them per plan scope).
- Audio: the voicemails and the two extra seattle_call openings are new clips (Sadaltager, voice-distortion fx).

---

## Cross-mission variety (my callers)

Nightshade, Torres, Gary, Vance, the Recruiter and Patricia each have their own voice block, so a shared
sentence between two of them is not a shared audio clip; only the Architect reuses one block across his many
calls (listed above, all distinct). No caller of mine reuses a HaX opening. Openings reviewed side by side:
m09 three one-shot calls distinct; m04 Vance's state-branch openings distinct; m05 Recruiter first_call vs
return_contact distinct, Patricia distinct; m07 Architect's seven calls distinct. No repeats to change.

---

## Fix round 1 (callers) — updated counts and variety listings (2026-11-12)

Review `REVIEW_WRITER_CALLERS_R1.md` actioned; see `REVIEW_WRITER_CALLERS_R1_OUTCOMES.md` for each finding.
Commits: m09 `7666e9494`, m04 `a5bc7eb32`, m05 `09df82fcc`, m07 `acc063b4c`.

### Voiced-line count per mission (after the fixes)

| Mission | Caller | Before (writer) | After fix round 1 |
|---|---|---|---|
| m09 | Nightshade, Torres, Gary | ~22 | ~22 (co-speaker reprefix + home stubs, no count change; optional m8 not taken) |
| m04 | Vance | ~51 | ~48 (−3: M5 SCADA cuts; M4 call-end adds no lines) |
| m05 | Recruiter | ~60 | ~49 (B2 −13, m4 +2 call-VAR openers; longest answered path ~17–18) |
| m05 | Patricia | ~50 | ~53 (M2 +3 answer lines, M3 +1 goodbye, m6 −1) |
| m07 | Architect live calls | ~60 | ~59 (M7 +1 ten-minutes; M8 net −1) |
| m07 | Architect voicemails | ~14 | ~16 (M6 whole-line branches; seattle_vm −1) |

### Variety listing — redone after the fixes

**m09 (unchanged in shape):** Nightshade "Agent 0x00. I'd ask how the leave was…" (last line now
`agent_0x99:` "He's right. I hate that he's right."); Torres "I gave you this address back in October…";
Gary "It's Gary. Whitlock, from St. Catherine's…". All distinct, none a HaX opening.

**m04 Vance** (one call): openings "Vance. What do you need?" / "Banks are isolated…" / "Vance. The hydrogen's
still climbing." / "Vance."; last line "Call me if you need it." + "And hurry." / "I'm not going anywhere."
(now ends the call). SCADA guidance no longer repeats between `charge_control` and `safe_disabling`.

**m05 Recruiter** (two call paths):
- `first_call` opening (branch): callback "You rang back. Manners, or curiosity?" / slow answer "Take your
  time. Patience is most of my job." / plain "Agent. Or whatever they're calling you this week." Last line
  (branch): "…the other forty-seven were never your problem." / `recruiter_final_statement` "…didn't stop
  because you found one of mine."
- `return_contact` opening: "Still deciding? The offer doesn't improve with age, agent." /
  `recruiter_deal` "Since you've rung, here's what I wanted. …" (player_rang). Last line as above.
- "Everyone has a price" is said once (in `recruiter_deal`). Casualty projection de-duped against HaX
  (`architect_discussed`).

**m05 Patricia** (one call): opening (new, state-varied) "Morgan. Where is he?" / "Morgan. Is it over?" /
"Morgan."; last line "Whatever you decide in front of him, ring me when it's done." / "I'll be on the vault
log." / "That's all for now." → "Right." (plain goodbye after a topic). "[Just checking in.]" shows only when
no topic was taken on the call.

**m07 Architect** (shared voice block — all distinct):
| Call | Opening (first spoken) | Last NPC line |
|---|---|---|
| taunt_t30 | "Don't look for the trace. It isn't there." | "Let it hurt afterwards, not during…" |
| taunt_t20 | "You've sent your team." | "Did you decide with a number, or with your stomach?" |
| taunt_t10 | (branch) "Ten minutes before your team is too committed to move. You moved them…" / "You logged in…" / "The beauty of entropy…" | "You still have a door open…" / "Doors close…" |
| taunt_t5 | "The man in your control room would give you his figure…" | "…name them? You will have to, eventually, to somebody with a tablet." |
| taunt_t1 | (branch) "Late. I did wonder." / "Closer than the file suggested." | after "…written every one of them down." |
| seattle_call | "Seattle first. Exactly as scheduled." | "No. That's rather why I rang." |
| sign_off | "You saved eight point four million people…" / "You saved the rest of it…" | "You'll have the figures too. Then we'll both know the same thing about you." |

Voicemails (`taunt_*_vm`, `seattle_call_vm`) mirror each taunt's point, mutually exclusive with the live
taunt; T-30 and T-20 carry an opener in his voice ("You let it ring. Sensible." / "Busy. Of course.").

---

## Fix round 2 (callers) — updated counts and variety listings (2026-11-12)

Review `REVIEW_WRITER_CALLERS_R2.md` actioned; see `REVIEW_WRITER_CALLERS_R2_OUTCOMES.md` for each
finding. Commits: m04 `4ed621179`, m05 `e1a63d819`, m07 `e57d6fb94`. m09 untouched. Config follow-ups
(recruiter_line_dead declaration; m07 ERB :1644 bark drop) added to the M5 and M6 config lists above.

### Voiced-line count per mission (after round 2)

| Mission | Caller | After fix round 1 | After fix round 2 |
|---|---|---|---|
| m09 | Nightshade, Torres, Gary | ~22 | ~22 (untouched) |
| m04 | Vance | ~48 | ~48 (comment-only; no spoken line changed) |
| m05 | Recruiter | ~49 | ~47 (−2: M1 orphan cut, m2 refusal tail cut) |
| m05 | Patricia | ~53 | ~50 (−3: m3 opener reuse −2, m4 badge-log reuse −1; M2/M5 reword, 0) |
| m07 | Architect live calls | ~59 | ~59 (M7 drop + M8 split are 0 net on live lines) |
| m07 | Architect voicemails | ~16 | ~11 (−5: m6 voicemails reuse live strings; M3 reword 0) |

### Variety listing — changed lines only

**m05 Recruiter:** `recruiter_introduction` now opens "Torres took debt relief and a standing consultancy
retainer…" (the "only variable is currency" line is gone). Casualty projection `architect_discussed`
branch now reads "…get us the schedule". `recruiter_deal_refused` ends on "You won't reach all of them
before I've closed on a few more."

**m05 Patricia:** opener (state-varied) now "Morgan. Have you got him?" / "Morgan. I've been watching the
vault log." / "Morgan."; the `has_motive() and has_exfil()` "why" openers reuse "Again? Fine. Convince me
this time." / "David. Why?"; the badge-log reply reuses the two `phone_case_why` lines.

**m07 Architect:** `seattle_call_vm` last line now "Three to go, and you let it ring." `taunt_t10`
`team_redirected` opener drops the spent "Ten minutes…" line. Voicemails `taunt_t30_vm`, `taunt_t10_vm`,
`taunt_t1_vm` reuse the live taunts' exact strings (same voice block → shared audio); `taunt_t1_vm` now
runs the countdown alternatives as two short lines each. All still mutually exclusive with the live taunt.
