# Slice 5 R4 delta review: demo_access_tour (structure and dialogue)

Scope: the R3 fixes, `git diff c098bfb1e 1c3c483be -- scenarios/demo_access_tour/ink docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md` (commits 760fae2f7, c04d0840f). Read at 1c3c483be. Nothing edited. Runtime evidence: inkjs drivers (public/break_escape/assets/vendor/ink.js) on the compiled ama_phone.json and ama.json as committed (grep confirms the new lines are in the JSON, so it matches the .ink). The phone driver ran these sets, each with repeat asks: fresh, short, full, full unplugged before the AP, lost via Desktop Connect with Lorna done (no copy, and after copying), lost via Copy, desk-held, all done, four asks at Yasmin, three asks at W15, W15 after another ask. It also ran a full-route walk (ask, then complete each step, kit to guest port). The ama.json driver ran the briefing (both routes), mid-tour hub (short, full, switch), and the debrief and recap (full, short, lost, look-round twice).

Counts: B0 / M0 / m1 / n3

## Findings

### m1. The twin step of W14 reads as "stuck", so the skip line comes back right after progress
`scenarios/demo_access_tour/ink/ama_phone.ink:104-111`

Both W14 variants set `w = 14`. In the full-route walk, the ask before hiding the AP gives "Hide the access point..." with no skip line (already told). The player plants it, asks again, and `ap_planted` switches the answer to "The access point's in. Open its console..." but `w == last_w` (14 == 14), so the skip line is appended. The player moved on a step, so this is not a stuck signal. The same happens when W6b flips from the no-copy variant to the copy variant (both w = 6, driver "lost via Desktop Connect after copy"). Harm is small: the line is true, it is only a repeat. It will not break a demo.
Fix: give the second W14 variant its own number, `~ w = 17` at :111, and note "0 to 17" in plan:385 and the handover. W6b can stay as is (the skip line is told by then).

## Notes

### n1. W6b copy variant: "Sign out there if you're back on it" is a little clumsy as a phone text
`ama_phone.ink:70`
"It" has to be read back to the front desk two lines up, and the sentence conditions on something the ink cannot see. R3 m1 itself is resolved: the line no longer promises the box route to a player who is still signed in at the desk (driver: both Copy and "after copy" give the three lines plus the skip line). Optional rewrite (no match in scenarios/):
```
    If you're signed in at the front desk again, sign out. Then connect from your keyring.
```
Then keep :71 as is. It is 16 words, under the 25-word phone cap. Four phone texts (three plus the skip line) is the longest answer on the phone; it only occurs on this branch.

### n2. Stuck asks repeat the same two lines word for word
`ama_phone.ink:131-134`
Four asks at Yasmin give the Yasmin line plus the skip line each time (driver). This is the intended rule (R3 M1) and visibly resolves the old dead end. A presenter waiting on the coffee rota will see an identical reply each time. Not worth changing at R4. If wanted later: `{ stopping: ... }` style variation on the skip line.

### n3. Plan 2.9 wording still says the tail is set by "W6b, W7, W8, W11 to W14, W16" and the rule line says `last_w` is "0 to 16"
`docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md:385`
Accurate to the build as it stands. Only needs to change with m1 (0 to 17). The plan's W table (:363-382) matches the ink in order, conditions and text, including the W6b three-line copy variant, W7, W8 (`done_t_door_controller` and not `done_t_server_room`), W4 and W5.

## Checks that pass

- R3 M1 (skip line): resolved. `told_skip` is a bool and `last_w` an int set to `w` after every ask (0 on required lines, so any required ask resets it). It stays bounded; neither grows or is re-sent beyond a changed scalar. Driver results: first optional answer gets the line (short at W11, full at W7, desk-held at W13, Copy at W6b); W15 first ask clean, second and third ask give it (W15_two); four asks at Yasmin all give it; a walk where every stop completes first time shows the line once (W7) and then only once more on the false-stuck in m1. Nothing after the unplug shows it (the condition has `not done_t_unplug`, and "unplug before AP" never shows it). All done gives W19 with no skip line. Fresh gives W1 twice, no leak.
- R3 m1 (W6b Copy variant): resolved, see n1 for wording. R3 m2 (plan drift): resolved. 2.9, 2.10 P0/P4/P5a and 2.13 match the built ink and scenario.json.erb:579 (P0 "Before you use that, sign out of Delphine's PC."), and "keep you right" is gone from the plan and scenarios/.
- R3 m3: switch reply is now "Go on then. There's plenty more to see." (driver, mid short: M1 then switch reply, no doubled phone pointer). R3 n2 ("I'll be right here when you're done.") and n3 ("Ask me where next when you need it.", followed by "Any time." on Thanks) read correctly. R3 n4: no change, agreed.
- No regression in the briefing, mid-tour hub or debrief. D2 look-round loops back to D1 variant ("Anything else, or shall we talk it through?"). Recap D5a, D5b and D5c all read correctly under full, short and lost sets.
- Dialogue bar for the new and changed lines: no em or en dashes in either ink file (grep); UK spelling; Ama's in-person lines ("There's plenty more to see.", "Have a proper look. I'll be right here when you're done.") are plain London and southern English, with no `{var}` or inline direction, so TTS-ready. Each changed line grepped across scenarios/ for word-for-word repeats: one match per file (its own .ink and compiled .json) only.
