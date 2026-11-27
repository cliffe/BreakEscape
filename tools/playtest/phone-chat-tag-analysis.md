# phone-chat tag-ordering defect — decision-ready analysis

Static analysis only. No files touched other than this report. HEAD `b5c97bd7`.

## 1. Confirmed mechanism

`public/break_escape/js/minigames/phone-chat/phone-chat-minigame.js`:

- **`handleChoice()`** (lines 724–865): `makeChoice()` runs at line 753, `saveStoryState()`
  immediately after at line 756. Lines 758–799 then drive `continue()` in a loop until choices
  or `END`, pushing every line into `accumulatedMessages` and every tag into `accumulatedTags`
  — so by line 799 the full result of the choice, including every tag, is already known.
  Lines 802–813 animate `accumulatedMessages` (1000ms typing indicator + per-message 400ms gap).
  Line 810 is `if (!this.isConversationActive) return;` — closing the conversation during that
  loop returns **before** line 823's `processGameActionTags(accumulatedTags, this.ui)` ever
  runs. The `shouldExit` check (line 831, `accumulatedTags.some(tag => tag.includes('exit_conversation'))`)
  and its `complete(true)` (line 842) sit after that, so they are skipped too.
- **`continueStory()`** (lines 599–714): identical shape — accumulate-everything loop
  (617–661), then animate (676–687), then `processGameActionTags` at line 698, gated by the
  same `if (!this.isConversationActive) return` at line 684.
- `person-chat-minigame.js` **does not** have this shape: `displayAccumulatedDialogue()`
  (line 952) calls `processGameActionTags(result.tags, this.ui)` at line 965, **before** any
  text is displayed or animated. Confirmed by reading the whole file, not inferred.

**Is the reorder safe?** Mostly yes, with one caveat worth stating precisely rather than
assuming away:

- `processGameActionTags` (`helpers/chat-helpers.js`) touches `window.NPCGameBridge`,
  `window.gameState`, `window.npcManager`, `window.currentConversationNPCId`,
  `window.objectivesManager`, `window.eventDispatcher` — nothing that depends on
  `isConversationActive`, on `this.history`, or on any state the animation loop mutates
  (`history.addMessage`, `saveStoryState`). So moving the *call* earlier introduces no new
  dependency-ordering bug.
- The tag that actually closes the minigame is **not** inside `processGameActionTags` — it's
  the separate `shouldExit`/`complete(true)` block in `handleChoice` (lines 830–844).
  `processGameActionTags`'s `switch` has no `case 'exit_conversation'`; it falls through to
  the `default` (logged as "unknown action"). So the correct, minimal fix — move only the
  `processGameActionTags(accumulatedTags, this.ui)` call above the animation loop, and leave
  the `shouldExit` check and `complete(true)` exactly where they are, after the loop — does
  **not** prematurely close the conversation before trailing farewell text renders. I checked
  this specifically because m01's `support_hub` knot has the pattern
  `#exit_conversation` *then* `Copy that. Call anytime.` *then* `-> support_hub` (lines
  132–135) — i.e. the tag textually precedes the farewell line inside the knot. A blanket
  "process tags, then check exit, then animate" reorder would close the minigame before that
  line ever typed. The narrower fix (tags early, exit-check-and-close unchanged) avoids this.
- No tag in the reviewed ink relies on `give_item`/`set_global`/etc. landing **after** specific
  text has been read — in every case found, the action tag sits at the *top* of the knot,
  before the explanatory text, not interleaved with it. Reordering makes the toast/state change
  appear slightly before its explanatory chat line finishes typing rather than slightly after;
  cosmetic, not functional.
- **Unresolved, flagged not assumed:** the prior findings report (`tools/playtest/
  m02-findings-report.md`) observed a duplicated transcript on reopening a phone-chat
  conversation that had been closed mid-animation, with tags apparently applied once, after the
  duplicate render — mechanism explicitly marked unexplained there. If the reordering fix
  changes when tags run relative to whatever caused that duplication, there is a live risk of
  `give_item` (not idempotent — could duplicate inventory items) firing twice on such a
  reopen. I could not resolve this from static reading; it needs the verification plan in §4,
  specifically the reopen-after-early-close scenario.

## 2. Blast radius — m01_first_contact (DEPLOYED)

Only **one** phone-chat conversation exists in m01: `agent_0x99` (Agent HaX), `npcType: "phone"`,
`storyPath: m01_phone_agent0x99.json` (`scenario.json.erb:583-588`). Sarah, Kevin, and Maya are
`npcType: "person"` and use `person-chat` (already correctly ordered, unaffected). The two
`voice`-only phones (`reception_desk_phone`, `patricia_desk_phone`) are static voicemail text
fields, not Ink conversations — no minigame code runs on them at all.

Enumerated every action tag in `m01_phone_agent0x99.ink`:

| Tag | Knot | Preceded by (same batch) | Currently, on early close | After reorder |
|---|---|---|---|---|
| `set_variable:lockpicking_guide_requested` + `give_item:...lockpicking` | `request_lockpicking_guide` | 0 lines before tag, 2 lines of explanation after | **Never fires** if closed before ~2-line typeout finishes — field guide silently lost | Fires immediately; guide always received |
| `set_variable:field_guide_requested` + `give_item:...ssh_basics` | `request_field_guide` | same shape, 3 lines after | Same — never fires on early close | Fires immediately |
| `set_variable:priv_esc_guide_requested` + `give_item:...priv_escalation` | `request_priv_esc_guide` | same shape, 3 lines after | Same | Fires immediately |
| `set_variable:cyberchef_guide_requested` + `give_item:...cyberchef` | `request_cyberchef_guide` | same shape, 2 lines after | Same | Fires immediately |
| `unlock_task:inform_safetynet_operation_shatter` | `report_operation_shatter` | 1 short line after | Never fires on early close — the "report Operation Shatter" task never unlocks | Fires immediately |
| `complete_task:inform_safetynet_operation_shatter` | `mission_commitment` | 0 before, **3 lines** of debrief text after | Never fires on early close — a real quest-progression task stays incomplete. This is the same class of live defect as the dedup-key bug that silently killed an m01 task; this is a second, independent path to that same symptom. | Fires immediately |
| `set_variable:framing_evidence_seen=true` | inside a choice branch (~line 632) | short trailing text | Never fires on early close | Fires immediately |
| `set_variable:kevin_choice=warn/evidence/ignore`, `kevin_protected=true/false` | inside choice branches (652–697) | short trailing text | Never fires on early close — **this one matters most**: `kevin_choice` almost certainly gates a moral-choice consequence downstream (kevin_protected). Closing early during this exchange would silently default the player into whichever behaviour the *absence* of these globals produces. | Fires immediately |
| `set_global:start_debrief_cutscene:true` | `closing_debrief`, "On my way" choice | no text follows in that branch | Already fires immediately today (no messages to animate through) — no change | No change |
| `exit_conversation` (~20 occurrences) | throughout, mostly `+[choice] #exit_conversation <optional short text> -> ...` | varies | Handled separately from `processGameActionTags` (see §1) — behaviour unchanged by the minimal fix | Unchanged |

**Every one of the give_item/complete_task/unlock_task/set_variable cases above is a "never
fires today" case, not a "merely earlier" case**, whenever the player closes the phone during
the typing animation that follows them. This is a real, currently-live gap in the **deployed**
mission: a player who asks Agent HaX for a field guide and closes the phone before the
reply finishes typing does not receive the guide; a player who reports Operation Shatter and
closes early does not get the follow-up task unlocked or completed; a player mid–Kevin-choice
who closes early gets no `kevin_choice`/`kevin_protected` set at all (silently falls through to
whatever the unset-variable default does downstream — I did not trace that default, flag as
unresolved). None of these require an unusual play pattern — closing the phone to go act on
what was just said (get the guide, go pick the lock) is the natural next move, and 400ms+ per
line of animation is enough real time for that.

The fix does not introduce any *new* miss in m01 — I found no m01 tag whose current (buggy)
late timing is incidentally required for correctness. The reorder converts every one of the
rows above from "silently dropped on early close" to "fires immediately," which is strictly a
fix, not a new risk, in m01's case specifically.

## 3. m02, and m03–m08 (drafts)

**m02_ransomed_trust** — already documented in `tools/playtest/m02-findings-report.md`
(Finding A, game 993, confirmed from live logs, not just source reading): `do_upload` in
`m02_object_press_terminal.ink` accumulates ~14 lines / ~1300 chars with `#complete_task`,
`#set_global:exposed_hospital`, `#set_global:mission_complete`, `#exit_conversation` all at the
end, giving a 35+s window where closing the phone leaves the mission one tag short of complete.
Same defect, same fix, already independently verified in a real run.

**m03–m08** — enumeration only, not analysed for consequence (drafts, not deployed):

| Mission | Phone ink | `exit_conversation` count | Other action-tag count |
|---|---|---|---|
| m02 | `m02_phone_agent0x99.ink` | 1 | 16 |
| m02 | `m02_phone_ghost.ink` | 10 | 3 |
| m02 | `m02_object_press_terminal.ink` | 5 | 6 (confirmed defect, above) |
| m03 | `m03_phone_agent0x99.ink` | 12 | 10 |
| m04 | `m04_phone_agent0x99.ink` | 6 | 7 |
| m04 | `m04_phone_robert_vance.ink` | 4 | 0 |
| m05 | `m05_phone_agent_0x99.ink` | 1 | 4 |
| m05 | `m05_phone_recruiter.ink` | 5 | 4 |
| m06 | `m06_phone_agent_0x99.ink` | 11 | 14 |
| m07 | `m07_phone_agent_0x99.ink` | 1 | 9 |
| m08 | `m08_phone_agent_0x99.ink` | 1 | 6 |

Every mission's Agent 0x99 hub follows the same "field guide / task tag at top of a multi-line
knot" pattern seen in m01, so the same live "never fires on early close" risk should be assumed
present in all of them until each is played. I have not traced individual knots in m03–m08 —
that would need per-mission review, out of scope for this pass.

## 4. Verification plan

**Proving the fix makes tags fire on early close (needs a playtest, cannot be done statically):**

1. Drive to a phone-chat knot with a multi-line reply and a `give_item`/`complete_task` tag at
   its head (m01: ask Agent HaX for the lockpicking guide, or report Operation Shatter).
   Immediately after selecting the choice (before the first typing indicator finishes — call
   `closeConversation()`/close the phone via the bridge as fast as the harness allows, ideally
   under 1s).
   - **Before fix:** item/task should be missing (reproduces the existing defect — do this
     first, unfixed, to confirm the harness can actually trigger the race).
   - **After fix:** item/task should be present immediately.
2. Repeat with m02's `do_upload` (the originally reported case) using the existing
   `m02-run3-session.jsonl`-style close-mid-animation pattern; confirm `mission_complete`
   flips to `true` without waiting out the 35s.
3. **Reopen-after-early-close check** (targets the unresolved duplication risk in §1): close
   mid-animation, then reopen the same NPC's conversation. Confirm inventory does not contain a
   duplicate `give_item` result, and confirm the transcript-duplication behaviour noted in the
   m02 findings report either no longer occurs or, if it does, still only applies tags once.
4. **A cheap deterministic check that does not need a full playtest:** a unit test around
   `processGameActionTags` isn't representative of the bug (the bug is about *when* it's called,
   not what it does) — better to add a small Jest/node-side test that stubs `this.conversation`,
   `this.ui`, `this.isConversationActive`, drives `handleChoice()`/`continueStory()` with a
   fake multi-line `continue()` result carrying a tag, flips `isConversationActive = false`
   partway through the animation loop (simulating close), and asserts
   `window.NPCGameBridge`/`processGameActionTags`'s target call happened before that flip took
   effect. That is deterministic, fast, and exercises exactly the reordering — no browser or
   Rails server needed.

**Proving m01 is unaffected on the normal (non-interrupted) path:** play the existing m01
walkthrough (`tools/playtest` / `walkthrough-scenario` skill) end to end with no early closes,
confirm every field guide is received, `report_operation_shatter` → `mission_commitment`
sequence completes both tasks, Kevin's choice variables end up set as expected, and the closing
debrief cutscene still triggers — i.e. the reorder changes *when* things happen but not *what*
happens on the path that's already tested.

## 5. Recommendation

**Reorder unconditionally** (move `processGameActionTags(accumulatedTags, this.ui)` above the
animation loop in both `handleChoice` and `continueStory`; leave the `shouldExit`/`complete()`
gate where it is). Do **not** make it opt-in.

Reasoning:

- The current behaviour is not "sometimes tags land late," it's "tags land late for everyone,
  always, deterministically, as a function of message count/length" — there is no scenario
  author or player-facing use case where the *current* order is the intended behaviour to
  preserve behind a flag. A flag would mean some phone-chat conversations keep the bug on
  purpose, with no way to tell from reading the ink which mode a given knot is in — exactly the
  "field whose presence silently changes behaviour" trap the user has already rejected once for
  a comparable engine defect. This is the same class of problem, not a milder one.
- The reorder is provably a fix, not a trade-off, in every m01 case checked (§2): it converts
  "silently dropped" into "fires," with no case found where the old late timing was
  load-bearing. m02's already-verified live incident (game 993) is exactly this pattern.
- The one real hazard identified (§1, exit-before-farewell-text) is avoided by the *narrow*
  version of the fix — moving only the tag-processing call, not the exit/close logic — so
  "reorder unconditionally" here means that narrow, specific change, not a wholesale
  restructure of `handleChoice`/`continueStory`.
- The one genuinely open question (§1, §4.3 — possible double-fire of non-idempotent tags like
  `give_item` on a reopen-after-early-close) is not a reason to withhold the fix; it's a reason
  the verification plan includes a specific reopen check before calling this done.
