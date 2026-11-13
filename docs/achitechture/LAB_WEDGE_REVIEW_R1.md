# Lab wedge review, round 1

Scope: `build/lab-wedge`, diff a8f74b3b8..02e0f3e4d (q102: the door-wedging NPC moves into `lab_physical_pentest`, with `test_access_work` X2 kept as the minimal copy). Read only. Checks run: validator on both scenarios (0 ❌ each), `inklecate` on `kieran.ink` (compiles, matches the committed `kieran.json`). No server was run, so the two findings marked "confirm live" are taken from the engine code.

Paths are relative to the worktree. `SCN` = `scenarios/lab_physical_pentest/scenario.json.erb`.

## Verdict

No blockers. The beat suits the lab: it is a control failing through convenience, which no other beat in the lab teaches, and P1 held only bonus content. The critical path (records door by tailgate or clone, then the debrief) does not touch P1, and every P1 finding has another source (`floor_printout`, `pierce_printout` both set `kp_doc_disposal`). Two M findings need fixing before merge: Kieran's printer never recovers, so he keeps failing and grumbling for the rest of the game, and the lesson text sits on an object the player probably cannot read from where they see it.

## Findings

### M1. The jam never clears, so Kieran fails and grumbles every half-minute for the rest of the lab (confirm live)
`SCN:749` sets `lw_post_printer_jammed` once and nothing clears it. Kieran works every 20 s (validator: P = 0.33 min), `needsDeferMin: 0.5` (`SCN:1187`) parks a failed need for only 30 s, and a judged failure's grumble ignores the chatter cooldown (`npc-needs.js` `_turnBack`, `ignoreCooldown: true`). After the wedge his tell is 2, so `_failTopic` picks `work_fail_fed_up`, which has one line. The result is "Right. That's it." about once a minute while the player is anywhere near reception or the hall, for 20 to 40 minutes. Reaching level 100 ("settled") only stops the reports to the server; the client still turns back and grumbles. This breaks the spoken-lines rule that short lines must not repeat often, and it wears out the voiced clip. The live proof stopped at 51 s, so it never showed this.
Fix (pick one): (a) clear the jam once he has propped the door, e.g. a `ruth_phone` mapping on `global_variable_changed:lw_post_door_propped` that sets `lw_post_printer_jammed: false` ("he got it going and left the door wedged anyway", which also teaches that a workaround outlives its cause; `prop_door` is in `LASTING_KINDS`, so P1 stays open); or (b) raise `needsDeferMin` to 4 or more and give `work_fail_fed_up` three or four lines. (a) is the better lesson. Then prove it with a 5-minute live run that counts Kieran's barks after the wedge.

### M2. The lesson is on an object the player may not be able to read (confirm live)
`post_door_wedge` (`SCN:1289`) belongs to the hall, but it is drawn at the foot of P1's doorway on the P1 side (shots lab-03, lab-04, lab-05). A player who walks in sees it at their feet inside P1. The same-room rule in `interaction-walls.js` blocks interaction with another room's object, so clicking it from P1 should do nothing. Reading it from the hall was never proved: the live run checked the reveal and the walk-in, not the read. Since this readable carries the whole control lesson (door-held-open alarm, self-closer, fix the nuisance), it has to be readable from where the player stands.
Fix: in the browser, read it from the hall floor and from inside P1. If P1 refuses it, either (a) put the lesson text in the `opt_propped` capture note (`SCN:750`) and the toast, keeping the extinguisher as a picture, or (b) add a P1-side readable for the open door (for example "Post room door, held open") with the lesson, `revealOnGlobal: lw_post_door_propped`.

### m1. Ruth's phone hint and Dev's courier line send the player to a door that is now locked
`ink/ruth_phone.ink:98` ("Try the post room off the corridor…") and `ink/dev.ink:59` ("Post room's down the corridor… Go on through, nobody'll stop you") were written for an open P1. Before the wedge, a player who follows either one meets a badge reader and may decide they need a clone. In practice the wedge usually lands about 50 s after the first hall entry, so the window is short, but the lines now promise something the scenario does not deliver (ink guide, "Dialogue must be supported by the scenario").
Fix: change Ruth's hint to point at the paper on the floor first and mention the badge door, e.g. "The shared printer on the floor, then the post room off the corridor. It's a badge door, but watch who uses it." For Dev, have him hand the courier to Kieran ("Kieran does the post, he'll take it") or drop "Go on through". Both are voiced-line changes, so add them to the TTS list.

### m2. The debrief names the post room for a finding that may have come from the open-plan printer, and it says nothing about the propped door
`ink/ruth_debrief.ink:180` speaks of "The post room: uncollected payslips in the tray…" whenever `kp_doc_disposal` is true. The open-plan printer and Melanie's tray printout set the same global. This mismatch was already there, but with P1 locked for part of the game more players will now get the finding on the floor. The new `kp_propped_door` finding gets a capture and a credits line but no word from Ruth, unlike every other extra in that passage.
Fix: soften line 180 so it holds for any source ("Payslips and client paper left in printer trays and open recycling…"), and add one line in the same passage, e.g. `{ kp_propped_door: Ruth Adeyemi: And a badge door wedged open with a fire extinguisher. Door-held-open alarms, and fix whatever made the door a chore. }`, with `VAR kp_propped_door = false`. The builder held this back to save a voiced line; see "For the user".

### m3. The toast and the task title do the noticing for the player
The toast at `SCN:452` says what happened, what it means and what to do. The task title at `SCN:414` has been visible in the bonus list since the start and says in advance that someone will wedge the door. The lab's other toasts are just as direct (Len, Melanie), so this is consistent with house style. But this beat's lesson is noticing a control quietly defeated, and the toast spells that out for the player.
Fix: cut the toast to a nudge and leave the lesson to the readable (once M2 is fixed): title "Post room door", message "Kieran has just come back from the post room without his badge in his hand. Worth a look." (or "The post room door is standing open."). Retitle the task "Optional: find a badge door that staff no longer use properly". Keep "note it for the report" out of the toast; the capture already logs it.

### m4. Kieran's bark pools are scenario-wide, and "twenty times" is said three times
`SCN:48`–`50` add `work_fail_printer`, `work_fail_fed_up` and `wk_prop_door` to the top-level `chatter`, which any voiced NPC may draw from. Today only Kieran has `workNeeds`, so nothing breaks, but the next NPC given a work need in this lab would grumble "Right. That's it." in their own voice. "Twenty times" appears in `ink/kieran.ink:27`, `kieran.ink:30` and the `wk_prop_door` bark.
Fix: move the three pools into Kieran's own `"chatter"` on his NPC record (`ScenarioBarkValidator` reads NPC pools too, so TTS still covers them). Reword one of the two ink lines, e.g. line 27 "…Some mornings I'm in and out of there all day."

### m5. Kieran's choices only give information, and the header promises a courier mix-up that no line delivers
`ink/kieran.ink`: the three hub choices give flavour and do not change state. That is acceptable for an optional side NPC (the guide allows information-only choices), but it is the weak end of the scale, and the header (line 6, "He takes the player for a courier") describes something that never happens. The courier hi-vis (`courier_ready`) is already part of the lab, and P1's own readable says "a real courier delivery ends at this hatch".
Fix (optional, voiced cost): add `+ { courier_ready and not lw_post_door_propped } [Parcel for the post room. Can you let me in?]`. Kieran answers "Hatch is in there, I'll badge you through", sets a global and the player follows him in. That gives a second honest route into P1 and a choice with a consequence. If you do not want new lines, delete the courier sentence from the header comment instead.

### m6. The jam trigger is untested and adds a validator warning
The trigger is on `ruth_phone` (`SCN:749`), a phone NPC registered with the start room. `game.js` always loads `gameScenario.startRoom` first, resumes included, so in real play it is reliable. It is missed only when a tool overrides the start room, which is the case the builder hit. No room-entry trigger exists in the schema, and the existing `player_on_floor` mappings already use this pattern, so a new trigger type would be engine work out of proportion to the gain. Two loose ends remain:
- `lab_physical_pentest_wedge_test.rb` sets `lw_post_printer_jammed` by hand in `setup` (line 19), so no test proves that the mapping exists. Fix: add an assertion that `ruth_phone`'s `eventMappings` hold `room_entered:hall` with `onceOnly` and `setGlobal.lw_post_printer_jammed == true`.
- The validator now warns that `ruth_phone` has two `room_entered:hall` mappings, one onceOnly, that can fire together. Firing together is intended. Fix: say so in the ERB comment above `SCN:749` and in the build log, so the merge-batch check does not chase it.

### m7. The narrowed "withheld" tests stopped checking the printer's display name
`test/controllers/break_escape/lab_physical_pentest_network_test.rb:91` and `test/models/break_escape/lab_physical_pentest_secrets_test.rb:703` now select resources by `r['network']`. The id exclusion is correct: `AccessWork.plan` serves resource ids by design. But that plan never serves a display name ("ids, kinds and global names, never a display name"), so "Post-room printer" should still be withheld, and the test no longer checks it. The property filter also drops any later resource that misses its `network` key through a typo, without anyone noticing. Nothing leaks today, so this weakens the check rather than the security.
Fix: build the hidden list from every resource's `name`, `host` and `observations`, and from the ids of networked resources only, and exclude ids by name (`except('lw_post_printer')`) rather than by property:
```ruby
all = @game.scenario_data['resources']
hidden = ['Ledgerwell office LAN'] + all.except('lw_post_printer').keys +
         all.values.flat_map { |r| [r['name'], r['host'], r['observations']] }.compact
```

### m8. Placement: the extinguisher appears from nowhere, and there is no door leaf to wedge
On question 6: the extinguisher stands at the doorway's left jamb, overlapping the left half of the opening, with its base at P1's floor line (lab-04). It reads as "in the doorway, on the post-room side", which is the only place it can be seen. A base on the hall side is hidden under P1's back wall, as the builder found. The walk-behind convention allows this. Two things weaken the picture:
- The hall has no extinguisher before the prop, so the "corridor's own extinguisher" appears out of nowhere. The engine has `revealOnGlobal` but no hide-on-global, so a bracket extinguisher cannot vanish when this one appears. Fix: add an empty extinguisher bracket or a "fire point" sign on the hall wall near P1 (non-interactable), so the observant player sees where it came from. Alternatively, accept this and say so in the log.
- No open door leaf is drawn, so the wedge stands in a black opening (main3-17 asked for it to stand against the open leaf). Engine door art is out of scope here; log it in `docs/IDEAS_BACKLOG.md` against the door-sprite work.

### m9. Other ways into P1: a bonus, but untested and partly guessed
On question 1's side point: a staff card opening P1 by role is consistent with the access model and with the cheat-resistance policy (the server checks the role against the card). It also gives a player with a pocketed card an honest second way in. P1 holds only optional findings, so nothing is skipped. The records door needs `cm_records_badge` and the riser needs `lw_comms_card`, so `LW-FAC-0417` opens nothing else. `opt_propped` still needs a later walk-in after the wedge, which is correct (`SCN:750` condition). It is a bonus, not a problem.
But the build log's claim that "a clone of Kieran's badge would also open it" is untested. Kieran has `creds.card`, not `rfidCard`, and his ink has no clone tag, so a conversation clone may not be on offer at all. Fix: test it once in the browser and correct the log line either way. Also check that the `card_cloned` mappings stay name-gated if it does work (they are, at `SCN:775`, `SCN:895` and Len's).

### m10. Reload after the wedge is proven only in the test copy
The build log runs X4 (reload mid-walk and after the prop) on `test_access_work` only. In the lab the prop, the open P1, the toast timer and `opt_propped` all depend on saved globals plus `unlockedRooms`. Fix: one lab reload after `lw_post_door_propped` in the next live run. Check that the extinguisher shows, the door draws open, the toast does not refire and Kieran does not walk again.

## Counts

B 0, M 2, m 10.

## For the user

1. **Kieran's art (question 4).** He is the only lab NPC on a generic sprite (`male_nerd_v2`, also used in nine test scenarios), with the generic `male_nerd_visemes.png`. The cast-diversity note says named characters get their own sprite key, and the visemes note says every NPC gets `visemes --from-talk`. His look (white, Irish, early twenties, red shirt) does add to the cast's range of age and background. Options: the full character pipeline for `kieran_doyle` (concept, bust, talk, visemes, walk set), or keep the generic sprite while he stays a minor NPC.
2. **Clear the jam after the wedge (M1 option a).** This is a small story change: the printer works again and the door stays wedged. I recommend it.
3. **Voiced lines.** The builder's list is 9 ink lines and 4 chatter lines. All are in TTS-voiceable places (ink with a `Kieran Doyle:` prefix matching `displayName`, scenario chatter read by `ScenarioBarkValidator`), with no printed variables. m1, m2 and m5 would add about 3 to 5 more lines (Ruth's hint, Dev, a debrief line, an optional courier exchange). Decide which you want before the TTS pass.
4. **Toast style (m3).** Keep the lab's direct pointer style for this beat, or make it a nudge so the player does the noticing.
