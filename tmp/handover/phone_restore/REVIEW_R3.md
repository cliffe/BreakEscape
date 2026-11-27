# Phone reopen fix: review R3

Commit reviewed: f6a49bfb9 (`git diff c62179973 f6a49bfb9`), handover 867a79ed3.
Counts: B0 M2 m3.

Method: read the diff, the handover and R1/R2; targeted reopen repros on the real compiled inks (scratch harness, real module: walk to a menu, set the flags the ink's own `#set_global` tags would have broadcast, change a synced global, call reopenWithCurrentGlobals with the contact's home knot); a classifying copy of reopencheck.mjs run at f6a49bfb9 and at c62179973, which for every reopen that differs from the old rewind also computes a "replay" yardstick (the previous resting state, today's globals, the same last choice) and records what the new code did; seven hand-made mutants against test/js/phone-reopen-stitch.test.mjs on a scratch copy. The worktree was not changed (module compared byte for byte afterwards).

## 1. R2 M1: closed

Repros at f6a49bfb9 (hour_read_started / ledger_read_heard / ghost_contacted_player set in the story before the save, as the `#set_global` broadcast does in play):
- m09 hour_read mid read-out, resting on "Who gets it first?" / "What's he hiding behind?", schedule_read flips: kept, no re-run. Same for "Analysis had a guess..." / "How many people, HaX?" with memo_read. realisation_choice: re-run as the stitch, same two choices.
- m02 Ghost first menu ("Somebody let you in." / "There is a woman on ECMO..." / "Say nothing..."), flag_proftpd_submitted flips: kept. Also kept with ward_recovering; see m1.
- m09 flag1_read resting on "Got it.", memo_read and flag1_read_done flip: kept "Got it.", no re-ask of "Ledger or stacks first?". Resting on the ask menu itself: re-run from the knot top, same three choices.

One caveat: if the save happens before the tag's broadcast reaches the story (hour_read_started still false in the saved state), the reopen's sync flips it, start's `hax_voiced_scene_pending()` guard newly fires, and the home fallback prints "One moment. Something's come in." with #exit_conversation. chat-helpers.js:589-596 broadcasts to every loaded story, so in play the story already holds it. Not a finding.

## 2. R1 M1 and R1 M2: still closed

- m10 Elena, "Give me a minute." at cut_0, gallery_shutter_cut flips: re-run from cut_0, "The shutter's already dead. You don't need me for this one." then [Right.]. Vance: "Shutter's dead already. You don't need me for that." then [Right.].
- m09 ledger_read resting on "What else is on the entry?" (after the gather): kept. First menu: re-run, same choices. flag1_read and hour_read.body as above.

## 3. The sweep: 168 to 480

Reproduced: reopencheck.mjs reports 480 at f6a49bfb9. My classifying copy passes the contact's home knot (m01/m02 HaX `first_call`, as the minigame does) and counts 516 at f6a49bfb9 and 184 at c62179973 (the random walks drift once behaviour changes, so treat the per-story numbers as rough).

Kinds:
- K1 kept the saved menu, replay agrees (intended).
- K2 kept the saved menu, replay differs (a newly valid choice is missing, or a now-invalid one is still shown).
- K3 kept the saved menu at a call's first menu (no replay yardstick; the R2 Ghost case).
- H1 home fallback taken with no visible new line.
- H2 home fallback taken with new lines (start's guards: m09 voiced scene pending or recruiter's call, m10 jam, m02 Ghost ending, press terminal closed, lab ghost offer).
- R1 re-run of the knot or stitch, replay agrees.

At f6a49bfb9 (516):

| story | H1 | H2 | K1 | K2 | K3 | R1 |
|---|---|---|---|---|---|---|
| lab_tesseract_trials / ghost | 0 | 8 | 0 | 0 | 0 | 0 |
| m01 / agent_0x99 | 0 | 0 | 35 | 0 | 0 | 0 |
| m02 / agent_0x99 | 13 | 0 | 0 | 0 | 0 | 0 |
| m02 / ghost | 0 | 39 | 0 | 0 | 57 | 0 |
| m02 / press_terminal_system | 0 | 8 | 0 | 0 | 0 | 0 |
| m07 / agent_0x99 | 0 | 0 | 198 | 26 | 0 | 0 |
| m09 / agent_0x99 | 0 | 30 | 88 | 0 | 0 | 1 |
| m10 / agent_0x99 | 0 | 4 | 0 | 0 | 0 | 0 |
| sis02 / marcus_webb | 0 | 0 | 9 | 0 | 0 | 0 |

At c62179973 (184): H1 13 (all m02 HaX), H2 55, K1 116; no K2, no K3, and m07 absent.

Reading: the growth is m07 HaX (0 to 224) and m02 Ghost (7 to 96). m07's submenus (people_topics, vault_finds, stuck_topics) carry a self-clearing guard that the R2 fix now treats as "already fired", so they are kept instead of sent to the hub; 198 of those are fine, 26 are stale (M1 below). m02 Ghost's 57 are the first menu kept, as R2 asked. The rest of the growth is drift. Under the replay yardstick no old=right/new=wrong case comes from the R2 change except the m07 K2 rows; the 13 H1 rows (M2) predate it and are unchanged.

Concrete wrong threads: m07 HaX stuck_topics after a VM flag (M1); m02 HaX hint follow-ups after Dr Kim (M2).

## M1. m07 HaX submenus are now kept with stale choices; the ink's design sends a reopened submenu to the hub

phone-chat-conversation.js:724-730 (the override needs the top's OLD baseline to stay in the knot) with scenarios/m07_architects_gambit/ink/m07_phone_agent_0x99.ink:89-91 (`submenu_from_hub`: "set by the hub choice that opens a sub-menu and cleared inside it, so a reopen that re-runs a sub-menu goes to the hub") and 455-500.

The guard `{not submenu_from_hub: -> hub}` already fires under the old globals (the flag is cleared on entry), so it is never "new", no entry reproduces the menu, and the saved choices stay. stuck_topics has choices gated on NOT a global (498-503: `flag2_submitted and not flag3_submitted`, `vault_hint_open()`).

Failure scenario (repro): HaX, "I'm stuck on something.", the menu shows "I've got a username and a password. Now what?" / "Never mind."; the player closes the phone, submits flag 3 on the VM, reopens. f6a49bfb9: the same two choices (the stage-3 hint for a stage already done; taking it plays vm_hint_3 and sets vm3_hint_given). c62179973 and main: the hub. The sweep's 26 K2 rows are all of this shape (people_topics missing "The engineer in the server hall. Elena Rodriguez. She's down." after elena_ko; vault_finds missing "A dossier. Tomb Gamma."; stuck_topics missing the Park pointer). A regression from this commit, on a common path (open the hint list, go and do the step).

Fix (ink, no engine change): move each of the three submenus' choices into a stitch, e.g. `=== stuck_topics ===` guard, `~ submenu_from_hub = false`, `-> menu`, then `= menu` with the choices. The saved first choice then sits in `stuck_topics.menu`, the stitch's old-globals baseline reproduces the menu, and the stitch is re-run under today's globals (stale hint dropped, new topics shown); the top's guard stays "not new", so the player is not thrown to the hub. Update the comment at 89-90. If the hub is still wanted on reopen, say so and the alternative is a top guard that is false while the submenu is open. Add a fixture: a knot whose top guard is cleared on entry and whose menu has a choice gated on `not <global>`, assert the gated choice goes after the global flips.

## M2. The home fallback fires on a step that shows nothing: m02 HaX hint menus drop to the hub with no new line

phone-chat-conversation.js:742 (`if (viaHome && viaHome.fresh > 0) chosen = viaHome;`). `fresh` counts steps, including an empty step that carries only a tag. m02_phone_agent0x99.ink:99-115: first_call's choices knot diverts to support_hub once `dr_kim_met or cover_burned or flag_ssh_submitted`; support_hub (136-137) opens with a tag-only `#speaker:agent_0x99` step, which differs from the old baseline's next step (the first_call_choices menu), so fresh is 1 and no line is visible.

R2 m4 answer: yes. npc-manager.js:322 sets homeKnot from currentKnot (`first_call`, m01 scenario.json.erb:640, m02 scenario.json.erb:747) and phone-chat-minigame.js:693 passes it. m01's first_call is a silent divert to the hub (m01_phone_agent0x99.ink:97-99): baseline and new run match, the fallback never wins (all 35 m01 rows keep the saved menu, replay agrees). m02's does reach the fallback, and with `start` as home the result is the same.

Failure scenario (repro): HaX "Where do I start?", resting on "What about Gary Whitlock?" / "Understood"; the player meets Dr Kim and reopens. Result: renavigated to first_call, messages [], tags [speaker:agent_0x99], choices are the hub ("Any tips for getting into the server room?" ...). The Gary follow-up is gone without a word. Same for the field-guide picker, board_email_reaction, ghost_contact_reaction, hint_pin_safe and others: all 13 H1 rows in both sweeps, all with the replay agreeing with the old (kept) menu. Present since eae5f561a (not caused by the R2 response), a regression on main, which re-ran the menu's own knot and kept it.

Fix: count only visible fresh output for the home fallback, e.g. `viaHome.steps.slice(viaHome.replayed).some(s => phoneStepLines(s.text, s.tags).length > 0)`. Checked as a mutant: all 21 stitch tests still pass, and the sweep loses exactly the 13 H1 rows with no other change (H2 89 to 86 and K3 57 to 56 are walk drift). Add a fixture: home knot whose new-globals path reaches a tag-only step and then a different menu, assert the saved menu stays. Live check for the handover list: m02 HaX resting on a hint follow-up, set dr_kim_met, reopen.

## m1. m02 Ghost: the first menu is kept after the outcome, but a later intro menu jumps to the ending

phone-chat-conversation.js:738-743 (`knot !== home`) with m02_phone_ghost.ink:33-60 and 224-233. The first menu lives in start, which is Ghost's home, so the fallback is never tried there; resting on ghost_introduction, ransom_demand or ghost_philosophy, the home fallback runs start, whose guard goes to return_contact and the post-decision or ending lines.

Failure scenario (repro and sweep): ransom_decision_made or ward_recovering newly true. On the first menu the player still gets the intro and the ransom demand (dialogue only; no globals written until on_recovery_console). One menu later, the same change shows "You did it without me..." and the ending choices. Main showed post_decision via the top for both. Low stakes, inconsistent.

Fix (optional): accept and note it, or move the first contact's lines and menu out of start into its own knot (start then only routes), so the home fallback is tried for it as for the later menus.

## m2. Surviving mutants and test gaps

My mutants against phone-reopen-stitch.test.mjs (21 tests pass unmutated):
- N1 drop `top.baselineKey !== '[]'` (725): survives; equivalent, since an empty baseline has `baselineFirst` '' and fails the next test anyway. The clause can go.
- N2 home fallback needs a visible line (742): survives (it is the M2 fix; no test pins the current behaviour, which is good).
- N3 `split('.')[0] === knot` to `startsWith(knot)` (726): survives; only matters for knot names that prefix others (hour_read / hour_read_resume, cut / cut_0). Keep the split; note only.
- N5 nowLeaves as `top.firstPath !== top.baselineFirst` (728), so the top also wins when its menu merely changes inside the knot: survives the tests, and the sweep is identical, so no campaign ink exercises it today. A fixture where the knot's first menu gains a choice under the new globals while the player rests on a later menu in that knot (expect kept) would pin "leaves the knot" rather than "changes".
- Killed: N4 override only when the top matched (tests 11, 14), N6 `sameChoices = true` (8), N7 no ends arm (14), N8 no leaves arm (11), N9 override ignores the old baseline, i.e. the R2-reviewed code (10, 12, 13).

## m3. Comments out of step

- phone-chat-conversation.js:716-718: "m09 flag1 read-out sent to the hub" is given as a guard that newly fires, but flag1_read_done is set by the knot's own `~` (m09_phone_agent0x99.ink:256), so a reopen never sees it as new; test 10 asserts the opposite. Drop that example.
- test/js/phone-reopen-stitch.test.mjs:1-4: the header still says it "falls back to the thread's `start`"; it is the contact's home knot now.

Fix: edit both comments.

## Not checked

Live browser runs (none done in this round): the m07 stuck_topics case and the m02 HaX follow-up case would make good live proofs after the fixes. The other phone suites were not rerun against the mutants.
