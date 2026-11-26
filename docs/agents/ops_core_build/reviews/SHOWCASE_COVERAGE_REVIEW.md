# Showcase coverage review: ops features in the four guided demos

Reviewer: feature coverage. Date: 2026-11-26. Tree: `ops-showcase-review` from main 1.0.27.

Goal (project owner): every new ops feature is showcased, and explained clearly, in a guided demo the owner can play through.

Inputs: the feature inventory and the four showcase digests (scratchpad `showcase_review/`), checked against the scenario files where a cell depended on it. Spot checks made for this review:

- `fixedIf`: no hit in any `scenarios/demo_*` or `office_life_showcase` file; the engine supports it (`app/models/break_escape/network_ops.rb:266-302`, refusal `fixed` at :543).
- Card refusal reasons `no_grant`, `fixed`, `wrong_product`, `wrong_version` (`network_ops.rb:542-586`): no showcase card or finding is set up to produce them. Both showcases' update card is `worksOn` FileHold 4.2 and the only FileHold host runs 4.2.
- Compromise marks (`public/break_escape/js/systems/compromise-marks.js`): the planted jack and a technique-held host are tinted red with a bolt. That happens in recon and terminal, but no line names it.
- `maxAttempts` is `null` on every policy in `demo_ops_passwords` and `demo_access_tour`, so lockout and the merged failure row with a count are never shown.
- `demo_ops_second_step` log source lists `helpdesk_request`, `account_password_reset`, `account_mfa_reenrolled` (scenario.json.erb:90), so those rows do appear at M10, but Thandiwe's pointer (thandiwe_moyo.ink:41-45) names only requests, approvals and the night burst.
- Taskbar Lock exists (`public/break_escape/js/utils/pc-taskbar.js:45`); no showcase beat presses it.
- `demo_access_tour` has Wi-Fi SSIDs, the rogue AP, `networkLinks`, `portSecurity` and a patch panel port, with a proof on the rogue AP plant; it is already voiced and is not part of this review's fixes.
- Built since the plan: P8b (`stick_override`, passwords S:634) and M13b (Priya and the IT line, second step S:122-155, ink/it_line.ink) are in the files.

Short forms: recon = `demo_ops_recon`, term = `demo_ops_terminal`, pw = `demo_ops_passwords`, 2nd = `demo_ops_second_step`, access = `demo_access_tour`. Beat IDs are the PLAYTEST tour tables. "Explained" means the player is told in game what happened and, for a lesson feature, why it matters: **yes**, **weak** (shown or named, but the meaning or the control is left to the player), **no**.

## 1. Coverage table

### A. Network and remote access

| # | Feature | Showcase and beat | Explained |
|---|---|---|---|
| 1 | Drop box at a network jack, foothold | recon R1; term T1 | yes (recon S:494 "The box is your foothold...") |
| 2 | Network view (rows per network, greyed blocks for held sessions now down) | recon R2 on; term all | weak: never told how to open it ("from the network view", A:106); greyed blocks never shown |
| 3 | Sweep of a discovery network | recon R2; term T2 | yes (recon S:509); term gives no why, relies on recon |
| 4 | Hosts with no sign-in (printer, camera) | recon R2-R3 | weak: listed, never said they have no sign-in |
| 5 | Host scan, service tiles | recon R3; term T4 | yes (S:510 "product and version") |
| 6 | Service display fields (banner, address) | recon R6; term T4 | yes (recon A:243-248) |
| 7 | Check a service, findings unconfirmed | recon R4; term T4 | yes |
| 8 | Confirm a finding (needs ticks, decoy reason) | recon R4; term T6 | yes, though recon only ever says "Test" while the button says Confirm |
| 9 | Decoys and why they stay | recon R4, R5d; term T6 | yes (S:511, term S:250) |
| 10 | `fixedIf`, finding shows Fixed | none | no |
| 11 | Finding realism link (scanner write-up, ids) | term T4, T5 | yes (term S:245, ink:223 "invented for training") |
| 12 | Console verbs search, info, use | term T5 | yes for the lesson (ink:148, :152); "module" never defined |
| 13 | Technique cards and the Techniques list | recon R5; term T7 | yes for cards (Z:52, term ink:49); the Techniques heading is never named |
| 14 | Use a card on a finding | recon R5; term T7 | yes |
| 15 | Card refusals: confirm first, false positive, wrong class | recon R5d | yes (engine reason line) |
| 15b | Card refusals: no gain, fixed, wrong product, wrong version, unmet need | none (unmet need: implicit in R7b order only) | no |
| 16 | Technique session, user then administrator | recon R7a-b; term T7 | yes (S:520-521; term S:251-253) |
| 17 | Red frame on the remote desktop | recon R7a | yes (S:520) |
| 17b | Compromise mark in the world (red tint and bolt on jack and host) | recon R1, R7; term T1, T7 (seen, not named) | no |
| 18 | Remote sign-in from a host row (saved connection) | recon R5c; term T3 (token) | yes (A:302, S:519) |
| 19 | Headless host | recon R6; term T3 | yes (file server observation S:714-717) |
| 20 | File share with access list | recon R7c | yes (S:514) |
| 21 | Unplug ends every session through the box | recon R8c; term T12 | yes |
| 22 | Outage at the wall socket; held sessions kept with no route | recon R3b; pw P11b; 2nd M2, M15 | weak: the device goes quiet (S:374), but a held session through a switched-off device is never shown |
| 23 | Device not responding | recon R3b | yes (S:374, S:504) |
| 24 | Keystroke device at a PC socket | term T11; pw P8 | yes |
| 25 | `needs_console` refusal | term T11 | yes (term S:242, ink:256) |
| 26 | Pivot via `networkLinks` | access (not an ops showcase) | yes, in access |
| 27 | Access points, Wi-Fi join, rogue AP | access | yes, in access |
| 28 | Port security | access | yes, in access (S:602 hint, task text :287) |
| 29 | Patch panel | access | yes, in access |

### B. Sessions, privilege and the keyring

| # | Feature | Showcase and beat | Explained |
|---|---|---|---|
| 30 | Sessions: password, claim open screen, Lock, Sign out | sign-in everywhere; claim 2nd M8; sign out pw P6b, P14 (told to do it, not where); Lock: none | weak (sign out), no (Lock) |
| 31 | Workstation locks on leave; open screen to claim | 2nd M8; pw P6 (D:19) | yes |
| 32 | Idle lock (`autoLockSeconds`) and its bark | 2nd M8, lunch, M5 | weak: S:435 and S:459 imply it; nothing says the PC locks itself after a short time away |
| 33 | PC policies (USB, remote, attempts) | pw P6b, P8 | yes for USB; attempts never set |
| 34 | Failed sign-ins merged with a count; lockout | none (`maxAttempts` null everywhere) | no |
| 35 | Admin session | pw P7; recon R7b | yes |
| 36 | Admin opens the owner's profiles | pw P7b | yes (A:272) |
| 37 | Admin override of a keystroke device | pw P8 | yes (S:627) |
| 38 | Admin override of a stick at a governed port | pw P8b | yes (S:634, A:496) |
| 39 | USB policy refuses a stick | pw P6b | yes (S:637) |
| 40 | Relay session (assist invite) | term T9 | yes (S:255, ink:140, :238) |
| 41 | Relayed admin is admin | term T9 | yes (S:255); O1 excluded by plan |
| 42 | Timed sign-in token | term T1, T3, T10 | yes (Z:28, ink:212, S:256) |
| 43 | Keyring | recon R5, R8c; term T3, T10; 2nd (Reset entry) | no: named five times, never said what it is |
| 44 | Greyed expired token row | term T10 | yes |
| 45 | Capture proof | access (rogue AP plant proof) | weak, in access only |
| 46 | Declared grants | implicit (Zainab's card, Ama's cards) | n/a: plumbing, needs no words |
| 47 | Item plants, holders | implicit (records in the bin, cards in the roll) | n/a: plumbing |

### C. Accounts

| # | Feature | Showcase and beat | Explained |
|---|---|---|---|
| 48 | Identities and creds on NPCs | all, implicit | n/a |
| 49 | Account picker tiles, sticky note | pw P6; 2nd M1 | yes |
| 50 | Account profiles | pw P7b | yes |
| 51 | Local and domain accounts | pw P13, P14 | yes (A:318, A:502); the "Domain: merrin" line is never pointed at |
| 52 | Account-only accounts | pw P13 | yes ("shared desk account") |
| 53 | Shared local administrator opens every PC it is on | pw P13 signs in at one desk only; told in A:508 | weak: told, not shown |
| 54 | Cached accounts | pw P10, P11a, P11c, P12 | yes (A:279) |
| 55 | Borrow workaround adds a cached account | pw P11b-c | yes (S:639, A:304) |
| 56 | Hash records from a held file | pw P1 | yes (S:635) |
| 57 | Cracker from the "Hash collected" toast | pw P11a, P12 | weak: the toast's Crack button is never mentioned (A:208) |
| 58 | Cracker from the tray | pw P3 | yes (A:164) |
| 59 | Intel facts | pw P2a-b, P3 | yes (A:240-242) |
| 60 | Salted wait and countdown | pw P4 | yes (A:169) |
| 61 | Reused and strong passwords | pw P4, P5 | yes (A:256-258, A:265) |
| 62 | Cracked password fills the tile | pw P6 | yes (S:636) |
| 63 | "Nothing new is cached here" and the collect panel | pw P10 | yes |

### D. Second steps, lock steps, helpdesk

| # | Feature | Showcase and beat | Explained |
|---|---|---|---|
| 64 | Six-digit code from a held device | 2nd M6, M16 | yes (S:449) |
| 65 | Push approved when pestered | 2nd M4, M5 | yes (S:447, recap :308) |
| 66 | Push with number match on a held phone | 2nd M7 | yes (S:450) |
| 67 | Number match on a lock | none (plan: same screen as M7) | n/a, accepted exclusion |
| 68 | Exempt account | 2nd M9 | yes (S:451) |
| 69 | Saved connection still asks for the second step | none (plan exclusion, test_ops_mfa) | no |
| 70 | Device in use | 2nd M0 | yes (S:443) |
| 71 | Written-down password and temper note | 2nd M1, M2 | yes |
| 72 | Overheard login | 2nd M3 | yes |
| 73 | Open screen claimed, no step | 2nd M8 | yes (S:448) |
| 74 | Helpdesk in person: reset, re-enrol | 2nd M11, M12 | yes |
| 75 | Helpdesk form on a PC desktop | 2nd M12 (offered, A:135) | weak: offered as an alternative, never required |
| 76 | Re-enrolment to "My phone" | 2nd M12 | yes (S:453) |
| 77 | Desk stops after `maxTries` | 2nd M13 | yes (S:454) |
| 78 | Phone-call helpdesk with call-back | 2nd M13b | yes (S:462, Priya :20) |
| 79 | Old code device "No longer in use" | none (plan exclusion) | n/a, accepted exclusion |
| 80 | Lock step on a door | 2nd M14 | yes (S:455, Gwen :19) |
| 81 | Propped door skips the step | 2nd M15 | yes (S:456) |
| 82 | Lock step on a safe | 2nd M16 | yes (S:457) |
| 83 | Lock step on a carried case | 2nd M17 | yes (S:458) |
| 84 | Lock step pane (number buttons, Approve, Deny, Check phone) | 2nd M14-M17 | weak: engine labels only; Ama says "approve" |
| 85 | Lock step answered from "My phone" | none | no |
| 86 | Lock step device-in-use seam | none (not reachable by a player) | n/a |

### E. Logs

| # | Feature | Showcase and beat | Explained |
|---|---|---|---|
| 87 | Ops log write side | recon R8; pw P9; 2nd M10 | yes (G:44, pw G:35, Thandiwe :41) |
| 88 | Ops log reader | same | yes |
| 89 | Network and share rows | recon R8 | weak: "Every sweep, scan and test" (G:44); plug, unplug and share rows never named |
| 90 | Seed rows and the anomaly flag | recon R8; pw P9; 2nd M10 | yes |
| 91 | Terminal log per foothold | recon R6c; term T8 | yes (term ink:172) |
| 92 | Approvals log and second-step rows | 2nd M10 | yes |
| 93 | Helpdesk and account rows | 2nd M10 (rows present) | no: never pointed at |

### F. Panels and the Terminal

| # | Feature | Showcase and beat | Explained |
|---|---|---|---|
| 94 | Panels | recon R2-R5 | weak: the name first appears at A:259 ("Switch to Panels") |
| 95 | Terminal skin and the switch | recon R6; term all | yes (term S:236 "imitates a scanner and a console") |
| 96 | Terminal commands | term T2-T12; recon R6 | weak in recon ("Same moves, typed"); yes in term via `help` |
| 97 | Terminal tables | recon R6; term T2 | yes |
| 98 | Whole verb to end a trip | term T12 | yes (S:261) |
| 99 | Terminal kept for the life of the view | recon R6c; term T8 | yes |
| 100 | Realism text (version table, advisories, console) | term T4, T5 | yes |
| 101 | Header switch button, saved skin choice | recon R6; term T8 | weak: no line says where the switch is |
| 102 | `?net_skin=` preview and `defaultSkin` | term opens in the Terminal (defaultSkin) | yes for defaultSkin (term ink:71); the URL parameter is an author tool, docs only |

### G. Not built (103-108)

Machine accounts, per-lockout scope, server checks for unseenOnly and seenBy, plain `openFor` doors, grant trigger checks, the locked look for an ownerless PC. Not built, so nothing to showcase. No findings.

## 2. Findings

Counts: B 0, M 9, m 12.

No headline feature is missing a showcase, so there is no B. Every headline feature (foothold, sweep, scan, check and confirm, decoys, technique cards and the step up, remote sign-in, unplug, the Terminal and its realism text, tokens, relays, keystroke devices, cracking, cached accounts, admin reach and overrides, local accounts, every second-step kind, the helpdesk, lock steps and the three logs) is shown on a guided beat and explained in Ama's, a bark's or an NPC's words.

### M (major)

**M1. Keyring is never explained (feature 43).** Shown and named in recon R5 and R8c, term T3 and T10, and the 2nd keyring Reset entry. No line says what it is or where to find it.
Fix: recon R5 bark (S:512): after "that link is in your keyring now", add "Your keyring holds every sign-in you've earned, and the network view offers them when you connect." term T3 pointer (ama_owusu.ink:83): add the same sentence after "It's in your keyring.", because term can be played on its own.

**M2. `fixedIf` has no showcase (feature 10).**
Fix: recon R8, Graham's log beat. Put `fixedIf: { requireGlobal: "printer_fixed" }` on `factory_login`. Have Graham's log line set `printer_fixed` and add one Graham line: "I've changed the printer's factory login tonight. Have a look at its admin page now." Then add one bark on the next check of `printer_host`: "Fixed. Once the setting changes, the finding stops being reported, and the card won't take it." This also shows the `fixed` card refusal (see M3). Optional, with no new task.

**M3. Card refusals beyond the first three have no showcase (feature 15b: no gain, fixed, wrong product, wrong version).**
Fix: the `fixed` reason comes from M2. For product and version, add one line to the term T7 pointer (ama_owusu.ink:98): "Each card says which product and version it works on. Read that line before you use it: the wrong version is refused." This explains the rule but does not demonstrate it. Showing it would need a second FileHold host, which is a redesign. Leave no-gain to the Rails tests.

**M4. Compromise mark in the world is shown but never named (feature 17b).** The planted jack and the technique-held file server turn red with a bolt in recon and term.
Fix: recon R1 plug-in bark (S:494 and the kitchen copy S:508). Add "The red tint and the bolt on the port mark something you hold." In the recon R7a bark (S:520), add "and the bolt on the file server" after "The red frame".

**M5. Lockout and the merged failure row have no showcase (feature 34).**
Fix: pw, free-play beat 27 (A:231-235). Give `graham_pc` a policy with `maxAttempts: 3`. Extend Ama's line: "Get it wrong three times and it locks you out. The sign-in log keeps your tries on one row with a count." That PC is on no guided step, so the lockout cannot block the route. Check `signin_lockout` appears in P9 (it is already in the log's events, S:294).

**M6. Session Lock has no showcase, and Sign out is asked for but never located (feature 30).**
Fix: 2nd M8 bark (S:448). Add "Press Lock on his taskbar before you go, the way he should have." pw P14 pointer (A:216-218): change "sign out at Julian's PC" to "use Sign out on the taskbar at Julian's PC".

**M7. Helpdesk and account rows are in the approvals log but never pointed at (feature 93).**
Fix: 2nd M10, Thandiwe's pointer (thandiwe_moyo.ink:43). Add "Your resets are in there too, each with the form that asked for it."

**M8. A shared local administrator opening every PC it is on is told but not shown (feature 53).**
Fix: pw P13 pointer (A:213-215). Add "Then try it at the hot desk too." The `local_account` tick stays as it is, and A:508 then describes what the player has just seen.

**M9. Lock step answered from the player's own phone has no showcase (feature 85).** Re-enrolment to "My phone" is shown on a sign-in (M12) but never on a lock.
Fix: 2nd M17 (the carried case). Add one optional Ama line once `reenrol` is done: "Yusuf's approvals come to your phone now. If his locker asked, you'd approve it yourself." This only works if a Yusuf-owned lock exists. If none does, explain it in the recap instead (one line under A:332) and accept that it is not demonstrated. Do not add a room.

### m (minor)

- m1. Confirm vs "Test" (feature 8). In recon A:96, write "Check the admin page and Confirm both reports. That's the test that shows which is real."
- m2. Network view, how to open it (feature 2). In the recon R2 pointer A:86, add "Open the drop box in your inventory. That's the network view, in Panels." This also names Panels (feature 94).
- m3. The header switch is never located (feature 101). In the recon R6 pointer A:109, add "The switch is at the top of the view."
- m4. "Module" undefined (feature 12). In the term T5 pointer ink:92, add "A module is the console's write-up of one known weakness."
- m5. Hosts with no sign-in (feature 4). In the recon S:510 bark, add "The printer has no sign-in of its own. You learn about it only from what it offers."
- m6. Outage with a held session (feature 22). This is shown only in docs and tests. Accept it, or in term, after T3, add an optional Ama aside on switching the backup PC off while the token session is held. Only do that if the PC already has a wall socket; do not add one.
- m7. Idle lock (feature 32). In the 2nd S:435 bark, add "...his screen stays open. Longer than that, it locks itself."
- m8. Cracker from the toast (feature 57). In the pw P11a pointer A:199-201, add "The Hash collected note has its own Crack button."
- m9. Domain line (feature 51). In the pw P14 pointer A:216-218, add "Look at the Domain line under the name."
- m10. Network and share rows in the log (feature 89). In recon G:44, change to "Every sweep, scan, test, plug and share you opened is a row."
- m11. Lock step pane controls (feature 84). In the 2nd M14 pointer (A:150-154), add "The door's pane has a Check phone button. Use it with Gwen's phone in hand."
- m12. Accepted exclusions, docs and tests only: saved connection still asking for the step (69), number match on a lock (67), old code device (79), the relay that never feeds a step up (O1, 41), the lock-step device-in-use seam (86) and the `?net_skin=` preview (102). The plan gives reasons for each, and a player cannot reach the seam. No change.

## 3. Length check

Every M and m fix above is one line or one clause added to an existing pointer, bark or NPC line. M2 also adds one global and one `fixedIf` field. M5 adds one policy field. No fix adds a task, a room or an NPC, so each showcase keeps its present length (recon 10 tasks, term 12, pw 19, 2nd 17). The new barks for M2 and M4 need TTS top-ups for Ama, Graham and the bark lines.
