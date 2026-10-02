# m08 The Mole — design re-review 1 (pass 4)

Fresh adversarial review of "Changes made (pass 4 design)" in `DESIGN_REVIEW.md`, against the working tree on 2026-10-02 (`git diff HEAD -- scenarios/m08_the_mole/` plus the untracked `PASS4_PLAYTEST.md`). Read-only apart from this file. Line numbers are `scenario.json.erb` (erb) unless another file is named.

## 1. Checks run

All run by this reviewer on 2026-10-02.

- `ruby scripts/validate_scenario.rb scenarios/m08_the_mole/scenario.json.erb`: exit 0, **0 errors, 2 warnings**, both the known intended ones (four brief-gated `onceOnly` handlers on `closing_debrief`; the confrontation cutscene without `onceOnly`). The five new `get_suite_code` handlers raise no co-fire warning. Graph: puzzle 50 nodes / 62 edges, integrated 56 / 71, critical path unchanged (4 hops). (The run regenerated `dungeon_graph.*`, as it always does.)
- `python3 scripts/check_door_alignment.py`: all doors OK.
- `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json m08_the_mole`: 1800 reopens, 0 problems.
- `node scripts/ink_runtime_check/tagdiff.mjs scenarios/m08_the_mole/`: 80 structural differences, the same set `DESIGN_REVIEW.md` lists (Netherton 64, confrontation 8, Cipher 6, HaX phone 2). Every one is explained there; I found none unexplained. Note that `[I'm ready. Let me work.]` lost its card gate (now unconditional), which is what keeps the hub from emptying.
- `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/m08_the_mole/`: line-len 87, choice-len 7, text-len 16, not-x-but-y 2. These belong to the dialogue stage, but pass 4 added to them: HaX texts at 67 words (flag-4 named version), 46 (clone), 34 (printer), and the phone's server-room answers at 60 and 66 words (`m08_phone_agent_0x99.ink:57`, `:59`). See m9.
- Not run: browser playtest (that is `PASS4_PLAYTEST.md`), inkcheck/loopcheck state matrix (the implementer's 37-state run is in `DESIGN_REVIEW.md`; I traced the same paths by hand below).

## 2. Fix-by-fix verification

| Fix | Verified | Evidence / note |
|---|---|---|
| 1 cloner | Yes (static) | `rfidCard` erb:964-968; `#clone_keycard:server_zone_badge` on the throwaway line `m08_director_netherton.ink:146-147`; `clone_debrief` reads `netherton_card_taken` :151; one `card_cloned` mapping erb:731-736, name has no parentheses or apostrophes; physical card still in `itemsHeld` erb:973-985. Full trace in §3a. |
| 1 print | Probably works; unproven | §3b. Global fires on any lift, identified or not (m1). |
| 2 hold the card | Yes | Gate ink:108; `access_request` :123-135; `interviews_done()` :333-334 counts a KO as seen; every VAR it reads is declared in `globalVariables` (erb:1679-1681, :1730-1734). |
| 3 audit question | Yes | Each `audit_cN` = guard, question, choices (ink:217-286). A reopen re-navigates to the choice-owning knot (`person-chat-minigame.js:510-518`) and now prints the question. No misread is added on a reopen. |
| 4 option after the give | Yes | Success branch ends `#exit_conversation` (ink:154); the next talk re-syncs and the gate `not netherton_card_taken` hides both access options. |
| 5 backstop | Yes | erb:556. |
| 6 objectives | Yes, one dead handler | Task erb:435-440; five handlers erb:816-828. The `named_on_evidence` handler can never fire (m4). |
| 7 flag-4 split | Yes | erb:641-654, disjoint on `named_on_evidence`, same `setGlobal`. Handlers are deduped per handler index (`npc-manager.js:566`), so the default 5 s cooldown can't block the sibling. |
| 8 KO all-flags text | Yes | erb:656-667. |
| 9 m07 intercept | Yes | HaX flag-3 text erb:637; case file item 3 erb:1496. |
| 10 accusation cost | Yes | erb:746-751; confrontation ink:66-68. The accusation is gated `not mole_identified` (`m08_suspect_nightshade.ink:92`), so "before you could prove it" is always true. |
| 11 PIN cracker | Yes (lines) | `m08_opening_briefing.ink:15`; confrontation ink:102-106. Consistent with m03-m07 ("on his bench" m03, "lab" m04/m05, "R&D … on the bench" m06, "Analysis still has it in pieces" m07:38). |
| 12 USB encodings | Yes | erb:1618. |
| 13 two Ciphers | Yes | `m08_suspect_cipher.ink:76-80`; "battery hall" matches m04's Battery Hall 1 (`m04_npc_operative_cipher.ink:2`). |
| 14 HaX door-log answer | Yes | `m08_phone_agent_0x99.ink:81`. |
| 15 debrief "vault" | Yes | `m08_closing_debrief.ink:131`. |
| 16 Phantom sprite | Yes (static) | erb:1158-1160; `male_telecom_v2` atlas loaded at `game.js:809`. Not render-checked. |
| 17 stale comments | Partly | Two comments are now stale the other way (m3). |
| 18 mission.json | Yes | |
| 19 guide timing | Yes | erb:617-628 and :769-774. |
| 20 graph | Yes | Validator reads the new links; printer duplicate gone. |
| 21 seat Nightshade | Yes (static) | erb:1468-1478. Opens a new, narrow KO window (m5). |
| Canon | m08 consistent; bible stale | §3c. |

## 3. The three hard questions

### 3a. The Netherton clone flow: works, on the same path as m04/m06

An open person-chat does not hear global broadcasts, but this flow never needs it to. The trace:

1. `InkEngine.continue()` returns one visible line at a time (`ink-engine.js:42-59`), so "He does not look down." arrives with the `clone_keycard` tag, and the story stops **before** `clone_debrief` is evaluated.
2. `displayAccumulatedDialogue` runs the tag first (`person-chat-minigame.js:977-980`). The handler reads Netherton's `rfidCard` through `window.currentConversationNPCId`, sets `pendingConversationReturn` and starts the RFID minigame (`chat-helpers.js:312-381`). Starting it ends the chat, and `cleanup()` saves the full story state mid-flow (`person-chat-minigame.js:1596-1599`). The throwaway line is never seen.
3. **Save:** `card_cloned` is emitted with `cardName: "Director Netherton Keycard"` (`rfid-minigame.js:254`), so the mapping (erb:731-736) sets `netherton_card_taken` at once; the minigame completes 1.5 s later and returns to the chat (`rfid-minigame.js:376-385`, `:430-462`). **Close/Cancel/Esc:** all call `complete(false)` (`base-minigame.js:39-77`), which takes the same return path with nothing set.
4. On return the chat restores the saved state (canContinue, no choices, so not treated as finished, `:483-489`), syncs globals (`:501`, `:532`), and because there are no saved choices it does **not** re-navigate (`:510`). The next `continue()` enters `clone_debrief` with the fresh global: success lines and `#exit_conversation`, or "did not get a clean read" and back to the hub with the clone option still offered (ink:109).

This is the m06 shape exactly (`m06_npc_irina_volkova.ink:313-330`), with one difference: m08's success branch closes the chat. The `#exit_conversation` sits on a tag-only line before `-> hub`, which is the same shape as the existing `done` knot (ink:327-330) and is handled by `person-chat-minigame.js:1238-1259`.

**Hub empty or loop:** no. `[I'm ready. Let me work.]` is unconditional (ink:114). `access_request` is sticky and returns to the hub. After a successful clone both access options are gone and the rest of the hub is unchanged.

**Access on every route:** always reachable. Clone (after three interviews, any of which a KO replaces); the badge printer (no gate; PIN on the break-room post-it; ops floor, intel analysis and the Crypto Lab are unlocked); Netherton's physical card on a KO (pickup sets `netherton_card_taken`, erb:806-810). The cloner is in the start kit and can't be lost. Reload: `access_offered` lives in Netherton's saved ink state, `netherton_card_taken` is a saved global, and the clone opens the reader through the cloner's saved cards, which m06's CTO door already relies on. Playtest step 7 confirms it in the browser.

**Residual risk (low):** `processGameActionTags` is called without `await` (`:980`). If any tag earlier in the same line awaited before `clone_keycard`, the NPC id could already be cleared and the card would fall back to the name `server_zone_badge`, missing the mapping. There is only one tag on that line, so this does not apply. Keep it that way.

### 3b. The print on the USB stick: the code path works on paper; keep the locker as the fallback

Path: inventory click → `handleObjectInteraction(this)` (`inventory.js:581`). No earlier branch catches a `text_file` (the type branches before the print check, `interactions.js:720-1218`, are all other types; the keycard branch is type `keycard` only). The print branch runs **before** the range check (`interactions.js:1231-1249`, range check skipped for inventory items at `:1253`). `collectFingerprint` and the dusting game use only `scenarioData` (`biometrics.js:20-31`, `dusting-game.js:148-156`); nothing needs a world position or a texture. The event slug is `ownerSlug("Nightshade")` = `nightshade` (`biometric-samples.js:22-24`), and the server accepts the sample because `Nightshade` is a `fingerprintOwner` in the scenario (`game.rb:246-268`). "Use normally" sets a one-shot bypass and re-runs the interaction, which reads the file (`biometrics.js:121-128`).

What I can't settle from the code:
- Whether an inventory item **restored after a reload** still carries `hasFingerprint`, `fingerprintOwner` and the candidates. If the saved inventory keeps a trimmed copy, the panel will not open after a reload. Add a reload before step 8's click.
- Reading the stick inside the locker's container view doesn't offer dusting; the player has to take it and click it in the inventory. The observation's "clean thumbprint on the casing" is the only prompt.

So: likely to work, not proven. If step 8 fails in either form, move the print to `nightshade_locker` (a room object, the proven m04 path), keep the same owner, candidates and mapping, and change the observation and credit to "his thumbprint on the locker door". No other change needed.

### 3c. Canon: consistent inside m08 and with m01; the voice bible is behind

Inside m08, every reference now says Nightshade has fifteen years' service and **taught the player's intake**: Netherton ink:100, debrief :116, confrontation :52, :62, :99, :128, :141, the dossier erb:1004, the printout erb:1129, both voice styles erb:1356 and :1451, the lab observation erb:1405. No "cohort", "trained alongside" or "old friend" is left in m08's ink or erb. This fits m01 (the player is new) and the canon file (`insider_threat_initiative.md:75`: recruited in training about fifteen years before m08, left dormant). HaX's "I trained with him" fits her fifteen-plus years (`agent_0x99_haxolottle.md:11`).

Netherton's "I have run field operations for five years" (ink:72) matches `director_netherton.md:56-57` (appointed Director of Field Operations, year -5) and m07's "in twenty years" (`m07_opening_briefing.ink:250`, his whole career).

Out of step (not mission-local): `voice_bible.md:97` still quotes "I have run this agency for eleven years"; `:143` and the drift rows `:357`, `:359` still describe the old cohort and tenure lines as open; the m08 voice-style rows `:163-164` still say "an old training partner" and "an old friend". See m6.

One timeline wobble inside m08, pre-existing but now worth fixing while the canon is being settled: "Then they waited. Fifteen years." (confrontation :99) and "dormant for fifteen years" (credit erb:164) against "the man who's been reading your mail for fifteen years" (:121). See m7.

## 4. Findings

No blockers.

**M1 [major][local] Nothing sends the player back to Netherton once the three interviews are done.** Fix 2 moved the card behind the interviews, but the hand-back is silent. The aim "Get Into The Internal Repository" says only "Get through the server-room badge reader"; HaX has no text on the third interview (no handler on `*_interviewed` except the task completions, erb:1085-1095, :1175-1185, :1383-1393); Netherton's "come back when you've seen all three" is heard only by a player who asked for access first. A player who goes brief → three interviews → server room meets a locked reader with an empty cloner. HaX's phone answer explains it, but only if asked. This is the default route's key step, so it needs a pointer.
Fix: one latched HaX text. On `closing_debrief`, six handlers (`global_variable_changed:` each of `cipher_interviewed`, `phantom_interviewed`, `nightshade_interviewed`, `cipher_ko`, `phantom_ko`, `nightshade_ko`), each `onceOnly`, condition `value === true && globalVars.brief_taken === true && (cipher_interviewed||cipher_ko) && (phantom_interviewed||phantom_ko) && (nightshade_interviewed||nightshade_ko) && !globalVars.netherton_card_taken && !globalVars.badge_cloned && !globalVars.access_nudge_sent`, `setGlobal: { access_nudge_sent: true }`, and a `sendTimedMessage` on `agent_0x99` (or put all six on `agent_0x99`). Declare `access_nudge_sent`. Suggested text (under 25 words): "That's all three. The Director said he'd sort your access once you'd seen them. Go and stand next to him." The `brief_taken` pair isn't needed: the interviews can't all land before the brief in practice, and the latch stops duplicates.

**m1 [minor][local] The print counts on any lift, matched or not.** `fingerprint_collected:<owner>` fires for an unidentified lift too ("Closing after the peel keeps the lift (as unidentified)", `dusting-game.js:650-656`; emit at `biometrics.js:93-96`). The credit "His thumbprint on the casing. Nobody planted the mail." (erb:191) and Nightshade's "And you printed the stick" (confrontation :71) assume the match was made, and the match is the part that teaches.
Fix: set `nightshade_print_lifted` from `fingerprint_identified:nightshade` (emitted on the first identification, `biometrics.js:97-99`). Keep HaX's hedged text ("If it's his…") on `fingerprint_collected:nightshade` without the `setGlobal`. A lift below 0.85 reopens the panel on the next click, so the player can still go back and match.

**m2 [minor][local, playtest] Prove the inventory print path after a reload.** §3b. Add to `PASS4_PLAYTEST.md` step 8: take the stick, reload, then click it. If the panel doesn't open, or `nightshade_print_lifted` doesn't set, apply the locker fallback in §3b.

**m3 [minor][local] Two comments now say the opposite of the code.** erb:668 ("a keycard he had not yet handed over" — he no longer hands it over) and erb:713 ("He is hidden for his whole scene, so this should not fire in normal play" — fix 21 seats him). Update both.

**m4 [minor][local] One `get_suite_code` handler can never fire.** `global_variable_changed:named_on_evidence` with `all_flags_submitted === true` (erb:817): `named_on_evidence` is only set from the audit check, which is hidden once `mole_identified` is set (ink:112), and `all_flags_submitted` implies flag 4 and so `mole_identified`. Harmless. Drop it, or keep it with a comment saying it is belt and braces. The other four cover every route I traced (code card before or after the flags; audit reading then flags; code keyed from memory, via room entry). Docs say "five mappings"; adjust if dropped.

**m5 [minor][local] The seated Nightshade can now be knocked down after the fate.** Before fix 21 he was hidden for the whole scene. Now he is visible from `all_flags_submitted` on. The scene opens on entry and can't be closed, and the debrief opens on its close (erb:884-895), so the window is small, but `globalVarOnKO: nightshade_confront_ko` (erb:1456) is set whatever the fate was, and the credit "Knocked down before he could answer, then handed to the police" (erb:168) and the debrief's KO branch (`m08_closing_debrief.ink:104`) read it. After a triple-agent choice that would print two contradictory fate lines.
Fix: make the "before he could answer" reading depend on the safety net, not the KO: have the `npc_ko:nightshade_confrontation` mapping (erb:714-720, already gated `!fate_decided`) also set `nightshade_ko_before_fate: true`, and use that global in credit erb:167-168 and debrief :104. Alternatively, a `setVisible: false` on `global_variable_changed:fate_decided` puts him back out of reach, but then the room empties as the debrief opens, which fix 21 was meant to avoid.

**m6 [minor][approval: shared doc] Update the voice bible to the new canon.** `voice_bible.md:97` (quote "eleven years" → "I have run field operations for five years"), `:143` (continuity note), `:163-164` (m08 style rows: "an agent he once taught" / "an agent he taught", matching erb:1356, :1451), and close drift rows `:357`, `:359`, `:360` (the CONTRACT already reads Enceladus). Not mission-local, so the orchestrator's call; it's a doc edit only.

**m7 [minor][local] "Dormant fifteen years" against "reading your mail for fifteen years".** If he was left dormant until recently (canon, confrontation :99, credit erb:164), The Architect was not reading SAFETYNET's mail for fifteen years (:121). Change :121 to "…and that's where you'll find the man who put me here fifteen years ago." It reads better against "Then they waited" and doesn't commit to who The Architect is.

**m8 [minor][local, dialogue stage] Netherton's reason for not handing the card over doesn't survive the clone.** "If it goes astray, the mole has every door in the building" (ink:139), followed by him letting the player copy it, which carries exactly that risk. The joke underneath (he wants deniability: "Whatever you are carrying, Agent, I did not see it", :153) is good; the stated reason undercuts it. Suggested: "I am not handing my card to anyone tonight. The mole reads this building's paperwork, and a hand-over is paperwork." Same beat, and it explains why a clone is acceptable.

**m9 [minor][dialogue stage] Pass-4 lines over the length caps.** HaX texts: flag-4 named version 67 words (erb:652), clone 46 (:735), printer 34 (:727); phone server-room answers 60 and 66 words (`m08_phone_agent_0x99.ink:57`, `:59`); Netherton :72 at 39. Hand to the dialogue stage with the rest of the lint list; the phone answers in particular should lead with the action ("Clone the Director's card once you've seen all three, or try the visitor printer.").

## 5. Story editor's view

**Does the finale now pay off the arc?** Mostly, yes, and the clone is the best of it.

- **The kit.** All three tools now do something. Cloning the Director in his own office, with his back turned and his permission implied, is the right scene for the last mission: the cloner the player has carried since m03 is finally pointed at SAFETYNET, which is what m08 is about. The picks open the locker. The print kit is the weakest of the three: optional, behind the locker, and its payoff is one line ("I'd have told you nobody planted it, if you'd asked.") that shrugs the evidence off. That shrug is in character, so keep it, but tie the global to the match (m1) so the credit is earned.
- **The m03 badge line.** Moving "one day it'll be our badge somebody clones" from the printer to the clone was the right call: it now lands on an actual clone. On the printer route HaX gets a plainer line ("Everything we tell clients not to do, in our own lobby"), which suits a badge left in a tray.
- **The PIN-cracker gag.** ATHENA plants it at minute one ("signed out to Agent 0x47"), Netherton tells you who 0x47 is a few minutes later, and the confrontation pays it off. m03 players already heard "Nightshade's still got the one … on his bench", so the plant spoils nothing new. Nightshade's answer ("A careful man asking to keep a device for study is the least suspicious thing in this building") is good: it is the insider-threat lesson in one sentence. It would hit harder if Netherton or HaX reacted to it in the debrief, but that's a nice-to-have.
- **The m07 intercept.** Closed, in HaX's flag-3 text and the case file. A reader who remembers m07 gets the click; nobody else is slowed down.
- **The two Ciphers.** The new option makes Cipher look guiltier, which is what a red herring is for, and his "I'd love to know who told them it was mine" is a quiet pointer at the mole. Good.
- **"Do it quietly".** Now costs something you can feel (HaX's text, Nightshade's "Think about why"), without a soft lock. The right weight for a warning.

**Is it fun?** The shape is better than before. The interviews are now the way to the box rather than optional reading, and the two ways round them (the printer, or knocking the Director down) are both earned and both remembered by the credits. The door-audit check stays the best puzzle in the mission and now resumes properly. The one thing that would make the middle drag is M1: a player who has done everything asked of them and then stands at a locked reader with no idea the Director is waiting for them. Fix that and the investigation-to-box handover is clean.

Considered and left alone: on the printer route the cloner is never used. Letting the clone happen anyway would mean Netherton offering access the player already has, which reads worse than leaving the cloner idle for an impatient player.

## Verdict

**Another round needed** — one major (M1, the missing hand-back to Netherton after the interviews) plus eight minors; after M1, m1, m3 and m5 land, a short confirmation round and the `PASS4_PLAYTEST.md` run (with the reload added to step 8) should be enough.
