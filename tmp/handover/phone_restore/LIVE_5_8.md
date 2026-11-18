# Phone reopen live checks 5-8 (branch fix/phone-restore-stitch)

Server: worktree, keyless, 127.0.0.1:3086 (pid 140218, from tmp/p3086.pid), Xvfb :86 (pid 140220). WAYLAND_DISPLAY unset. Both stopped at the end of this run (see Stop).
Harness: tools/playtest/session-start.sh + cmd.sh, `--headless true`, setFPS(20). Helper scripts in the scratchpad (not committed).

## Results

| # | Mission | Game | Check | Result |
|---|---------|------|-------|--------|
| 5 | m02 | 8120 | Ghost reopen after close and state change | PASS (see 5a-5d) |
| 6 | m02 | 8120 | HaX submenu and hub reopen after state change | PASS (see 6a-6b) |
| 7 | m10 | 8154 | Vance reopen | NOT FINISHED (see 7) |
| 8 | m04 | 8155 | phone contact reopen | NOT RUN |
| x | m07 | 8156 | HaX stuck_topics "Never mind" returns to hub | NOT RUN |
| x | m02 | 8120 | Gary Whitlock follow-up after dr_kim_met | NOT RUN |

### 5. m02 Ghost (game 8120)
Setup: the Ghost device (ghost_terminal_device) sits in it_department, which is locked by the open_it_department task. addToInventory is refused server-side ("Room not unlocked"), so I emitted item_picked_up:phone (itemId ghost_terminal_device), then opened the device with MinigameFramework.startMinigame('phone-chat', {phoneId:'ghost_terminal', npcIds:['ghost']}), which is the call the device click makes. Deviation: the device was not physically picked up.
- 5a. Close during the first menu (ghost_introduction, 2 choices): reopen showed the saved menu "That doesn't justify..." / "You're teaching them a lesson?". Expected: saved knot kept. Seen: same. PASS.
- 5b. Advance to ghost_philosophy, close, reopen: saved menu "Nobody elected you..." / "You've built a whole philosophy...". PASS.
- 5c. Advance to ransom_demand, close, reopen: saved 3 choices. PASS.
- 5d. Choose "I've heard enough" (ends with DONE), close. Reopen with no state change showed no choices. Ink DONE, nothing to offer. Not a stale menu, but worth a look.
  Then setg flag_proftpd_submitted=true, ghost_offer_made=true, close, reopen. Expected: mid-mission menu (return_contact) with the new options. Seen: 5 choices: "You want me talking to you", "You'll be in a cell...", "You messaged me. About the exploit.", "I'm not doing this", "Your offer. The keys for the evidence. I'll take it." Flag database option absent (flag not set). PASS.

### 6. m02 HaX (game 8120)
- 6a. Fresh thread: first_call_choices ("Understood." / "What should I know going in?" / "Anything I should be careful of?"). Choose "Understood." lands on the support hub. Choose "Where do I start?" opens hint_start submenu ("What about Gary Whitlock?" / "Understood"). Close, setg dr_kim_met=true, reopen. Expected: stays in hint_start, no hub drop. Seen: same two choices. PASS. Caveat: hint_start choices are static, so the "new choices in the submenu" part was not exercised. The hub change is covered by 6b.
- 6b. Choose "Understood" (back to hub), close, setg cover_burned=true, reopen. Expected: hub, not first_call, with the new choices. Seen: hub with "My booking's been pulled", "Who pulls a consultant's booking", "Any tips for getting into the server room?", "How do I get Gary to cooperate?", plus the older ones. PASS.

### 7. m10 Vance (game 8154): not finished
- Setup: setg m04_vance_is_ally=true, then cut_by_hand=true. The HaX mapping (phone_voice_is_hax) fired first and started an Agent HaX cut_call, not Vance. Set phone_voice_is_hax=false, cut_by_hand=false, then true again. The HaX call still showed when the run stopped. Next: end the HaX call, then reopen Robert Vance (contact vance_phone, phoneId player_phone) and check cut_0 menu ("I'm at it." / "Give me a minute."), close and reopen, then setg gallery_shutter_cut=true and reopen (expect "Shutter's dead already...").

### 8. m04 (game 8155): not run. Game created.
### Extra m07 (game 8156), m02 Gary (game 8120): not run.

## Harness observations
- converse: after one named choice it returned ok, turns 1, and closed the phone, with no stoppedAtChoice. Seen twice (Ghost ghost_introduction and ghost_philosophy). Mid-conversation close is not what the skill describes. Needs a look before relying on converse for phone threads.
- start.sh-style bootstrap: the first attempt timed out "not clear after 90000 ms" (cutscene choices and a welcome dismiss); a second bootstrap settled.
- Game 8154 was started without a flags file: m10 has no VM flag XML (new-game printed no FLAGS_XML).

## Games
- 8120 m02 (flags 4): checks 5 and 6.
- 8154 m10: check 7 (unfinished).
- 8155 m04: created, not played. 8156 m07: created, not played.
- Unused fresh games are left in the shared dev DB; nothing was reset.

## Stop
Server pid 140218 and Xvfb pid 140220 stopped by PID; harness sessions stopped by PID from their pid files. Ports 3000 and 3001 were not touched (3001 was already up, owned by someone else, and not used).
