// ===========================================
// PHONE NPC: Agent HaX (Handler Support)
// Mission 7: The Architect's Gambit
// Progress-gated support hub, delegation + redirect interface,
// five field guides, per-stage VM hints.
// ===========================================

// ---- Mission state (synced from globalVariables at call-open) ----
VAR team_assignment = ""
VAR team_assigned = false // Synced scenario global: a tactical team has been assigned (starts the clocks); also set by m07_opening_briefing and the assign_tactical_team mapping
VAR projection_revised = false // Synced scenario global: the Trojan Horse correction is established; set here by deduce_right and by Elena's revision_beat
VAR team_redirected = false
VAR redirect_window_closed = false

VAR hollis_resolved = ""
VAR elena_outcome = ""
VAR mercer_fate = ""
VAR elena_ko = false
VAR hollis_ko = false
VAR mercer_ko = false
VAR grid_saved = false
VAR countdown_expired = false
VAR redirect_declined = false
VAR found_coordination_traffic = false
VAR decode_read_open = false // Synced scenario global (PASS 5 r2, m3): the decode was read with the window open and the team elsewhere
VAR revision_before_commit = false // Synced scenario global (Phase 4 dialogue C1, D7-12): the correction was stated before the team was committed
VAR decode_before_commit = false // Synced scenario global (PASS 5 puzzle chains r1, C2): the decode was read before the team was committed, and the deduction wasn't made
VAR found_tomb_gamma = false
VAR found_mole_evidence = false
VAR generator_hall_reached = false
VAR vault_entered = false
VAR debrief_requested = false // Synced scenario global: the player has asked to be brought in; also set by HaX's backstop mappings
VAR architect_echo_heard = false
VAR casualty_projection_found = false
VAR park_ko = false
VAR park_resolved = ""
// PASS 4 round 3: synced. Set by HaX's "let it hurt" text (scenario mapping on
// the commit, or on first ops-floor entry); also set by "How do you carry that?".
VAR hurt_line_said = false
// PASS 4 dialogue playtest round: the clock answer and the vault hint read these.
VAR cascade_armed = false
VAR vault_pin_found = false
// PASS 5 scenario design r1 (D1): report_progress reads these. Synced globals.
VAR inside_reached = false
VAR badge_obtained = false
VAR server_hall_reached = false // Synced scenario global (PASS 5 design r1, m1): set by HaX's room_entered:server_room mapping, which also opens the control-room and plant aims
VAR scada_door_reached = false
VAR scada_password_found = false

VAR flag1_submitted = false
VAR flag2_submitted = false
VAR flag3_submitted = false
VAR flag4_submitted = false

VAR rfid_guide_offered = false
VAR rfid_guide_hint_given = false
VAR lockpicking_guide_offered = false
VAR lockpicking_guide_hint_given = false
VAR recon_guide_offered = false
VAR recon_guide_hint_given = false
VAR nfs_guide_offered = false
VAR nfs_guide_hint_given = false
VAR ssh_guide_offered = false
VAR ssh_guide_hint_given = false
VAR vm_terminal_used = false
VAR privesc_guide_offered = false
VAR privesc_guide_hint_given = false

// ---- Local latches (never synced) ----
VAR first_contact = true
VAR delegation_registered = false
VAR moral_discussed = false
VAR redirect_closed_discussed = false
VAR hollis_discussed = false
VAR elena_discussed = false
VAR traffic_discussed = false
VAR mercer_discussed = false
VAR tomb_discussed = false
VAR mole_discussed = false
VAR teacher_discussed = false
VAR m06_architect_identity_found = false // Imported (read-only) from m06 architect_identity_found: the player opened Satoshi's safe and read his guess at the Architect (CARRY_OVER_PLAN.md)
VAR park_hint_given = false
VAR deduce_wrong_count = 0
VAR vm1_hint_given = false
VAR vm2_hint_given = false
VAR vm3_hint_given = false
VAR vm4_hint_given = false
VAR vault_hint_given = false
// Phase 4 dialogue C1 (D7-5): set by the hub choice that opens a sub-menu and
// cleared inside it, so a reopen that re-runs a sub-menu goes to the hub.
VAR submenu_from_hub = false

// ===========================================
// ENTRY POINT
// ===========================================

=== start ===
{first_contact:
    ~ first_contact = false
    -> first_call
}
-> hub

=== first_call ===
{team_assigned:
    -> first_call_committed
- else:
    -> first_call_open
}

=== first_call_committed ===
// The briefing (WP3) already set team_assignment. HaX registers the
// delegation operationally -- this is where the task completes.
{not delegation_registered:
    ~ delegation_registered = true
}
#complete_task:assign_tactical_team

HaX here, Agent. I've got your channel and the board.

// Phase 4 dialogue C1 (D7-31): all four operations are in the US.
The ops room's running four fires tonight. If I go quiet for ten seconds, it isn't personal.

// Phase 4 dialogue C1 (D7-42): commas, not double hyphens.
The team's logged for {team_assignment == "fracture": Fracture, Washington|{team_assignment == "meltdown": Meltdown, San Francisco|Trojan Horse, Austin}}. It's on the record. It'd take something new to move it.

// Phase 4 dialogue C1 (D7-32): "the one place a person on the ground" line cut
// (Netherton says it twice in the briefing). (D7-30): a late first call.
{inside_reached: You're past the checkpoint. Ask me where you stand and I'll give you the next step.|Get past the checkpoint to the operations floor.}

-> first_call_committed_choices

// PASS 3 (E13): choices-only, so a re-navigation replays nothing.
=== first_call_committed_choices ===
+ [Walk me through the layout.]
    Checkpoint, ops floor, then the server hall behind a badge reader.
    North of the server hall, the control room, on a password. The engineer in the server hall knows it, and their own network leaks it.
    South, the plant: keyed door, then a keypad down to the cable vault.
    One checkpoint guard is bought. Assume every reader logs you.
    // PASS 5 design r2 (browser N2): back to the hub, so a reopened thread
    // lands on "Where do I stand?" and not on this sub-menu.
    -> hub
+ [What's the clock?]
    {grid_saved:
        No clock now. The abort's in and the grid's holding.
    - else:
        // PASS 5 scenario design r1 (D2): the clock can run out; say what's
        // left. Root already in means the console is the next step.
        {
        - countdown_expired and flag4_submitted:
            Step one ran. Seattle's dark. Steps two to four wait on the abort, and the console in the control room will take it now.
            -> door_line ->
        - countdown_expired:
            Step one ran. The rest waits on the abort. Root first, then the console.
        - cascade_armed and flag4_submitted:
            It's running, and root's in. The console in the control room takes the abort now.
            -> door_line ->
        - cascade_armed:
            It's running. Fifteen minutes from your login on their host. Get root, then put the abort in at the control room console.
        - else:
            No clock yet. The sequence waits on the host that drives it. The moment you log in there, assume they start it.
            So open the control room door first. The console in there is the only place the abort goes in.
        }
    }
    -> hub
+ [Understood. Let's go.]
    Call me the second you hit something you can't open.
    -> hub

=== first_call_open ===
// PASS 2 playtest D3 (lesson 36): this can run in the phone preload, before
// the briefing commit lands, so it must not claim the team is uncommitted.
// The commit option lives on the hub, gated on the synced team_assigned.
HaX here, Agent. I've got your channel and the board.

// Phase 4 dialogue C1 (D7-30): a first call opened late.
{inside_reached: You're past the checkpoint. Ask me where you stand and I'll give you the next step.|Get past the checkpoint to the operations floor. Call me when you hit something you can't open.}

-> hub

// PASS 2: the briefing can be closed before the call is made and never
// replays (setGlobalOnStart), so the commit lives here as well.
=== commit_team ===
// PASS 3 (E10): a reopen re-navigates here; if the team was committed since, go to the hub.
{team_assigned:
    -> hub
}
+ [Fracture. Washington.]
    #set_global:team_assignment:fracture
    #set_global:team_assigned:true
    #complete_task:assign_tactical_team
    ~ delegation_registered = true
    ~ team_assigned = true
    ~ team_assignment = "fracture"
    Fracture. Passed up and confirmed.
    -> hub
+ [Trojan Horse. Austin.]
    #set_global:team_assignment:trojan_horse
    #set_global:team_assigned:true
    #complete_task:assign_tactical_team
    ~ delegation_registered = true
    ~ team_assigned = true
    ~ team_assignment = "trojan_horse"
    Trojan Horse. Passed up and confirmed.
    -> hub
+ [Meltdown. San Francisco.]
    #set_global:team_assignment:meltdown
    #set_global:team_assigned:true
    #complete_task:assign_tactical_team
    ~ delegation_registered = true
    ~ team_assigned = true
    ~ team_assignment = "meltdown"
    Meltdown. Passed up and confirmed.
    -> hub
+ [Not yet.]
    Quickly. Two operations are waiting on which one you don't pick.
    -> hub

// ===========================================
// SUPPORT HUB -- gated on mission state
// ===========================================

=== hub ===

// --- PASS 4 (design review fix 1): the debrief waits for the player, so the
// plant and the vault stay open after the abort. The fallback timer sets
// debrief_requested too, which hides this.
+ {grid_saved and not debrief_requested} [Bring me in.]
    -> bring_me_in

// PASS 3 (playtest s6): the "Confirm the team's away." option is removed.
// Every commit (briefing commit_menu, HaX commit_team) completes
// assign_tactical_team itself, so it was always redundant once team_assigned.

// --- No team yet (briefing closed early) ---
// PASS 5 scenario design r1 (m12): not after the abort; the night is over.
// A commit after the login stays allowed (HaX's uncommitted flag-3 text invites it).
+ {not team_assigned and not grid_saved} [Where the team goes: I'm ready to make the call.]
    -> commit_team

// --- The redirect window: open (never when the team is already there) ---
+ {projection_revised and team_assigned and team_assignment != "trojan_horse" and not team_redirected and not redirect_window_closed} [Those numbers were understated. I want the team moved to Trojan Horse.]
    -> redirect_open

// --- The redirect window: closed, refused out loud ---
// Phase 4 dialogue C1 (D7-5): not after the abort. deduce_right already tells a
// late finder the window is shut, and the hub has to fit in nine.
+ {projection_revised and team_assigned and team_assignment != "trojan_horse" and not team_redirected and redirect_window_closed and not redirect_closed_discussed and not grid_saved} [Can I still move the team to Trojan Horse?]
    -> redirect_closed

// --- Moral sounding board ---
+ {team_assigned and not moral_discussed} [Talk to me about the two we're not covering.]
    -> moral_soundingboard

// --- PASS 5 alignment r1 (M2): the deduction. The decode no longer sets
// projection_revised and nobody names the row; the player says which operation
// and what's wrong. Checks what's done (the decode read), not how.
+ {found_coordination_traffic and not projection_revised and not grid_saved} [Their schedule doesn't match our brief.]
    -> deduce_schedule

// --- The coordination traffic (the player already has the correction, from
// Elena; deduce_right covers the same ground and sets traffic_discussed) ---
// Phase 4 dialogue C1 (D7-42): a full stop, not a double hyphen.
+ {found_coordination_traffic and projection_revised and not traffic_discussed} [The share. Four operations running off one schedule.]
    -> topic_traffic

// Phase 4 dialogue C1 (D7-5): the hub could show 15 choices. Hollis, Elena,
// Mercer and the Park pointer sit on one sub-menu; Tomb Gamma and the mole on
// another; the vault keypad, the VM hints and the field guides on a third.
// Each is choices-only and returns to the hub.
+ {people_news()} [About the people in here.]
    ~ submenu_from_hub = true
    -> people_topics

+ {vault_news()} [What I found in the vault.]
    ~ submenu_from_hub = true
    -> vault_finds

// --- PASS 4 (user decision P6): the Architect used HaX's own line ---
+ {architect_echo_heard and not teacher_discussed} [He used your line. "Let it hurt afterwards."]
    -> topic_teacher

// Blind run A fixes (m4): a line on the pick, so the sub-menu doesn't look like nothing happened.
+ {stuck_news()} [I'm stuck on something.]
    Tell me where.
    ~ submenu_from_hub = true
    -> stuck_topics

// --- PASS 5 scenario design r1 (D1): progress-aware status, m04's pattern ---
+ [Where do I stand?]
    -> report_progress

// --- PASS 4 dialogue (script edit S2): the preload lands in first_call_open, so the
// layout and clock answers were unreachable. This sticky choice reaches them.
// Phase 4 dialogue C1 (D7-5): only until the server hall; after that "Where do
// I stand?" carries the clock.
+ {not server_hall_reached} [Remind me of the layout and the clock.]
    -> first_call_committed_choices

// --- Sticky exit ---
+ [I'll call you back.]
    I'm here. Go.
    #exit_conversation
    -> hub

// ===========================================
// PASS 5 scenario design r1 (D1): WHERE DO I STAND?
// Names the first step not yet done, in mission order. Each test asks whether a
// step is done, never how (Hollis, the badge station or the clone; Elena or the
// capture). Text only, then the hub; owns no choices, so a reopen can't land here.
// ===========================================
=== report_progress ===
// PASS 5 design r2 (N4): the commit is a prefix, not a stop; the first
// unfinished progress step still follows (the commit isn't in concludeRequires).
{not team_assigned and not grid_saved:
    The team's still waiting on your call. Make it first, then:
}
// Phase 4 dialogue C1 (D7-5): "Remind me of the layout and the clock" goes
// once the server hall is reached, so the clock lives here.
{cascade_armed and not grid_saved:
    {countdown_expired:
        Step one ran. Seattle's dark. Steps two to four wait on the abort.
    - else:
        The clock's running. Fifteen minutes from your login on their host.
    }
    // Root in with an earlier flag still missing: the ladder below stops at
    // that flag, so the abort is named here.
    {flag4_submitted and not (flag1_submitted and flag2_submitted and flag3_submitted):
        Root's in, so the console in the control room takes the abort now.
        -> door_line ->
    }
}
{
- grid_saved and debrief_requested and flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted:
    It's done. Netherton's waiting. Next door you go through, he's on the link.
- grid_saved and flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted:
    It's done. The grid's holding. Sweep what you want, then tell me to bring you in.
// PASS 5 design r2 (N2b): once the debrief is requested (Bring me in, or the
// fallback timer) "Bring me in" is gone and the debrief opens on the last flag.
- grid_saved and debrief_requested:
    Grid's held. Put the rest of what you took through the relay and he's on straight after.
- grid_saved:
    Grid's held. Some of what you took off their host hasn't gone through the relay. Submit the rest, then call me.
- not server_hall_reached:
    {
    - badge_obtained:
        You've got a badge. The server hall reader's on the far side of the ops floor.
    - not inside_reached:
        Get past the checkpoint to the ops floor. The server hall beyond it wants a badge.
    - hollis_ko:
        The server hall reader wants a zone badge. Hollis's should be on the floor by him.
        Or print one at the badge station behind his desk.
    - else:
        The server hall reader wants a zone badge. Hollis wears one, and the cloner copies it if you stand close.
        Or print one at the badge station behind his desk.
    }
- not vm_terminal_used and not flag1_submitted:
    The Kali box in the server hall is your way onto their network. Start there.
- not flag1_submitted:
    Their host has an NFS share open to anyone. Read it from the Kali box and put its flag through the relay.
- not flag2_submitted:
    Scan every port on their host. Something answers whoever connects. Its flag goes through the relay.
- not scada_door_reached and not flag3_submitted:
    Open the control room door, north of the server hall, before you log in on their host.
    -> password_line ->
- not flag3_submitted:
    One login: the name from the share, the password from the listener. That account holds the next flag. The moment you log in, the clock starts.
    {projection_revised and team_assigned and team_assignment != "trojan_horse" and not team_redirected and not redirect_window_closed:
        If you mean to move the team, do it before you log in.
    }
- not flag4_submitted:
    Get root on their host and put the root flag through the relay. The console opens itself after.
    {not scada_door_reached:
        And you'll need the control room door open for the abort.
    }
- else:
    Root's in. Put the abort in at the console in the control room.
    -> door_line ->
}
// PASS 5 design r2 (N2a, browser O2): not after the abort. The plant aim says
// the building is the police's once the debrief is called, and the sweep line
// already offers the rest of the building.
{not vault_entered and server_hall_reached and not grid_saved and not debrief_requested:
    The plant's south of the server hall, if you want to see how they got in. That part's optional.
}
-> hub

// PASS 5 design r2 (N3): root in, control room never entered. Tunnel, text only.
=== door_line ===
{not scada_door_reached:
    The door's north of the server hall.
    -> password_line ->
}
->->

// PASS 5 design r2 (browser N3): "You've got the password." keyed on where the
// player actually has it. scada_password_found is set by flag 2 before the
// capture is opened, so that branch points at the capture instead.
=== password_line ===
{
- elena_outcome == "turned":
    Elena gave you the password.
- scada_password_found:
    The password's in the listener capture in your inventory.
- else:
    Elena knows the password, and their listener gives it out.
}
->->

// PASS 5 scenario design r1 (m15): is any field guide offered and not yet sent?
=== function guide_waiting() ===
~ return (rfid_guide_offered and not rfid_guide_hint_given) or (lockpicking_guide_offered and not lockpicking_guide_hint_given) or (recon_guide_offered and not recon_guide_hint_given) or (nfs_guide_offered and not nfs_guide_hint_given) or (ssh_guide_offered and not ssh_guide_hint_given) or (privesc_guide_offered and not privesc_guide_hint_given)

// PASS 5 scenario design r1 (m15): choices-only, so a reopen replays nothing.
// "Never mind." is sticky, so the menu is never empty.
=== field_guides ===
+ {rfid_guide_offered and not rfid_guide_hint_given} [The RFID cloning guide.]
    -> guide_rfid
+ {lockpicking_guide_offered and not lockpicking_guide_hint_given} [The lockpicking guide.]
    -> guide_lockpicking
+ {recon_guide_offered and not recon_guide_hint_given} [The recon and network mapping guide.]
    -> guide_recon
+ {nfs_guide_offered and not nfs_guide_hint_given} [The NFS and netcat guide.]
    -> guide_nfs
+ {ssh_guide_offered and not ssh_guide_hint_given} [The SSH guide.]
    -> guide_ssh
+ {privesc_guide_offered and not privesc_guide_hint_given} [The privilege escalation guide.]
    -> guide_privesc
+ [Never mind.]
    -> hub

// ===========================================
// Phase 4 dialogue C1 (D7-5): THE HUB'S SUB-MENUS
// Choices-only, each with a sticky "Never mind." so it is never empty. The
// choices are the old hub choices word for word. A reopen that re-runs one
// (globals changed) goes to the hub, so "Where do I stand?" is in view.
// ===========================================

=== function people_news() ===
~ return ((hollis_resolved != "" or hollis_ko) and not hollis_discussed) or (elena_outcome != "" and not elena_discussed) or (elena_ko and elena_outcome == "" and not elena_discussed) or ((mercer_fate != "" or mercer_ko) and not mercer_discussed)

=== function park_pointer_open() ===
~ return vault_entered and not casualty_projection_found and not park_ko and park_resolved != "talked" and park_resolved != "ko" and not park_hint_given

=== function vault_news() ===
~ return (found_tomb_gamma and not tomb_discussed) or (found_mole_evidence and not mole_discussed)

=== function stuck_news() ===
~ return vault_hint_open() or (vm_terminal_used and not flag1_submitted and not vm1_hint_given) or (flag1_submitted and not flag2_submitted and not vm2_hint_given) or (flag2_submitted and not flag3_submitted and not vm3_hint_given) or (flag3_submitted and not flag4_submitted and not vm4_hint_given) or guide_waiting() or park_pointer_open()

=== function vault_hint_open() ===
~ return generator_hall_reached and not vault_entered and not vault_pin_found and not vault_hint_given

=== people_topics ===
{not submenu_from_hub:
    -> hub
}
~ submenu_from_hub = false
+ {(hollis_resolved != "" or hollis_ko) and not hollis_discussed} [The guard on the checkpoint, Hollis. He was dirty.]
    -> topic_hollis
+ {elena_outcome != "" and not elena_discussed} [Elena's numbers don't match the brief.]
    -> topic_elena
+ {elena_ko and elena_outcome == "" and not elena_discussed} [The engineer in the server hall. Elena Rodriguez. She's down.]
    -> topic_elena
+ {(mercer_fate != "" or mercer_ko) and not mercer_discussed} [I've dealt with Mercer.]
    -> topic_mercer
+ [Never mind.]
    -> hub

=== vault_finds ===
{not submenu_from_hub:
    -> hub
}
~ submenu_from_hub = false
+ {found_tomb_gamma and not tomb_discussed} [A dossier. Tomb Gamma.]
    -> topic_tomb
+ {found_mole_evidence and not mole_discussed} [An intercept. They didn't leak the operation. They leaked me.]
    -> topic_mole
+ [Never mind.]
    -> hub

=== stuck_topics ===
{not submenu_from_hub:
    -> hub
}
~ submenu_from_hub = false
// PASS 4 round 2 (playtest note 5): the Park pointer, findable again.
// Phase 4 dialogue C2 (D7C2-9): filed under "stuck", where a player in the vault looks.
+ {park_pointer_open()} [The man in the vault won't stop. What would reach him?]
    -> topic_park
// PASS 3: stuck at the vault keypad (names the source, never the digits)
+ {vault_hint_open()} [The vault keypad. Where do I get the code?]
    -> vault_hint
// Per-stage VM hints
+ {vm_terminal_used and not flag1_submitted and not vm1_hint_given} [I'm on the Kali box. Where do I start on their host?]
    -> vm_hint_1
+ {flag1_submitted and not flag2_submitted and not vm2_hint_given} [I've got the share. What's next on the host?]
    -> vm_hint_2
+ {flag2_submitted and not flag3_submitted and not vm3_hint_given} [I've got a username and a password. Now what?]
    -> vm_hint_3
+ {flag3_submitted and not flag4_submitted and not vm4_hint_given} [I'm in as their operator. How do I stop the cascade?]
    -> vm_hint_4
// PASS 5 scenario design r1 (m15): the guides' own sub-menu
+ {guide_waiting()} [Send me a field guide.]
    -> field_guides
+ [Never mind.]
    -> hub

// PASS 4 (design review fix 1): prints, exits, parks on the hub; owns no
// choices, so a re-navigation can't land here. The assignment is above the
// lines so an early close still records it (the global observer writes it
// through). The debrief opens on the next room entry
// or closed screen once all four flags are in (closing_debrief mappings).
=== bring_me_in ===
~ debrief_requested = true
{flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted:
    Putting you through. He's waiting.
- else:
    Not yet. Put the rest of the flags through the relay and he's on straight after.
}
#exit_conversation
-> hub

// ===========================================
// PASS 5 alignment r1 (M2): THE DEDUCTION
// The player names the operation, then what's wrong with it. A wrong pick
// costs nothing: HaX says so and the hub comes back. Text knots print, then
// divert to choices-only knots, so a reopen replays nothing (E13). The
// choices knots re-check projection_revised, so a reopen after Elena has
// given it goes to the hub.
// ===========================================

=== deduce_schedule ===
Go on. Which operation?
-> deduce_op_choices

=== deduce_op_choices ===
{projection_revised:
    -> hub
}
+ [Fracture. Washington.]
    -> deduce_wrong
+ [Trojan Horse. Austin.]
    -> deduce_what
+ [Meltdown. San Francisco.]
    -> deduce_wrong
+ [Never mind. I'll read it again.]
    -> hub

=== deduce_what ===
Austin. What's wrong with it?
-> deduce_what_choices

=== deduce_what_choices ===
{projection_revised:
    -> hub
}
// PASS 5 alignment r2 (m4): the choices name the field, not the value, so
// the player has to have read the rows. deduce_right says the values back.
// Key count and site are wrong: both documents say 840 and Austin/TechForge.
+ [The dormancy.]
    -> deduce_right
+ [The manifest.]
    -> deduce_right
+ [The key count.]
    -> deduce_wrong
+ [The site.]
    -> deduce_wrong
+ [Never mind. I'll read it again.]
    -> hub

=== deduce_wrong ===
~ deduce_wrong_count += 1
{deduce_wrong_count > 1:
    Still not what I'm reading. Put their rows next to the desk summary, line by line.
- else:
    That isn't what I'm reading. Look again.
}
-> hub

// The tags sit above the lines, so an early close still records them.
// verdict_sent stops Elena's verdict text repeating this.
=== deduce_right ===
#set_global:projection_revised:true
#set_global:verdict_sent:true
~ projection_revised = true
~ traffic_discussed = true
Yes. Nine days, and dispatch keys on the manifest. Austin was briefed low on purpose.
One authority signing for all four. One operation wearing four coats.
{team_redirected or team_assignment == "trojan_horse":
    The team's already in Austin. You picked the one that was worse than the brief said.
- else:
    {
    - redirect_window_closed and team_assigned and (decode_read_open or decode_before_commit):
        The window's shut. You had their schedule while it was open. It goes in the report as late.
    - redirect_window_closed and team_assigned:
        The window's shut. It goes in the report as found, not as ignored.
    - else:
        {team_assigned:
            That's grounds to move the team. The window's open until they're too committed, or until you log in on their host. Whichever comes first.
        - else:
            The team's still waiting on your call. If you're making it now, that's where it goes.
        }
    }
}
-> hub

// ===========================================
// THE REDIRECT
// ===========================================

=== redirect_open ===
I hear you. Here's the cost, straight.

They peel off {team_assignment == "fracture": Fracture|{team_assignment == "meltdown": Meltdown|the current tasking}} and land in Austin forty minutes late, with the injection already running.

Best case, they stop it at a third. Call it a partial.

And the place you pull them from goes dark. Whatever was going to happen there, happens.

Health record and dispatch keys are late in the Austin run. Even a late team keeps ambulances on the road.

You pay for it with the operation you abandon. Your call.

// Engine regression fixes (2026-10-17, blind A M2): "now or never" read as
// "decide before you read anything". The window shuts on the operator login
// (flag 3) or the forty-minute timer, so say which.
The window stays open until you log in as their operator, or the timer on screen runs out. Then the team stays put.

-> redirect_open_choices

// PASS 3 (E10/E13): choices-only, and re-checks the window, so a reopen after it
// shut (flag 3 or the 40-minute timer) can't offer the move.
=== redirect_open_choices ===
{team_redirected or redirect_window_closed or team_assignment == "trojan_horse":
    -> hub
}
+ [Move them. Trojan Horse. Now.]
    #set_global:team_redirected:true
    #set_global:team_assignment:trojan_horse
    ~ team_redirected = true
    ~ team_assignment = "trojan_horse"
    // Blind A m7: a decline followed by a move leaves only the move on record.
    #set_global:redirect_declined:false
    ~ redirect_declined = false
    Redirecting. Austin confirmed, forty minutes out.
    Narrator: One pin swings across the board to Austin. The pin it left behind goes dark and stays dark.
    // Phase 4 dialogue C1 (D7-33): no absolution after "logged under your name".
    Done. It's logged under your name.
    -> hub

+ [No. Leave them where they are.]
    #set_global:redirect_declined:true
    ~ redirect_declined = true
    Then they stay. I'll log that you weighed it and held. If that changes before you log in as their operator, tell me.
    -> hub

=== redirect_closed ===
~ redirect_closed_discussed = true
// Phase 4 dialogue C1 (D7-42): a full stop, not a double hyphen.
No. I'm sorry. That window's shut.

// Phase 4 dialogue C1 (D7-12): a player who had the correction before the
// commit isn't told the team has been on the ground for a while.
{revision_before_commit: You made that call with the numbers in hand. It stands.|The team's on the ground on a live objective. Pull them now and we strand two operations instead of one.}

// Phase 4 dialogue C1 (D7-5): no longer offered after the abort, so the
// grid_saved branch here is gone.
{not revision_before_commit: You found the numbers were wrong. That goes in the report. }Now finish the part that's still yours.

-> hub

// ===========================================
// MORAL SOUNDING BOARD
// ===========================================

=== moral_soundingboard ===
~ moral_discussed = true
Yeah. I've been sitting with that since you made the call.

Whichever way you turned it, two went unanswered. One team, three fires.

ENTROPY built that arithmetic on purpose.

-> moral_soundingboard_choices

=== moral_soundingboard_choices ===
+ [How do you carry that?]
    ~ hurt_line_said = true
    Badly, if you're any good. Nobody comes out of triage clean.
    Let it hurt afterwards, not during. During is when you make it worse.
    You're in the one place a person on the ground could reach. Hold onto that.
    -> hub

+ [Was there a right answer?]
    // Phase 4 dialogue C1 (D7-34): after the correction, one brief was his lie.
    {projection_revised: Not on the brief we gave you. He wrote the brief.|No. That was the design.}
    {not projection_revised:
        Anyone who says they'd have known is lying, or didn't read the briefs.
    }
    -> hub

// ===========================================
// NPC / LORE TOPICS
// ===========================================

=== topic_hollis ===
~ hollis_discussed = true
{hollis_ko: He's down, then. He made his choice when he took their money.|Hollis. We cleared him last month. Routine revalidation, clean sheet.}

That should worry you. Our vetting signed off a man ENTROPY already owned.

// Phase 4 dialogue C1 (D7-35): HaX can't promise the vault.
If it missed him, I want to know what else it missed.
-> hub

=== topic_elena ===
~ elena_discussed = true
{elena_ko: She's not talking now. Shame. She'd been lied to as hard as anyone.|She was sold a six-hour demonstration with nobody hurt. Look around you.}

{team_redirected or team_assignment == "trojan_horse":
    If she told you what's on the Austin manifest, the team's already where it should be.
- else:
    {redirect_window_closed:
        If she told you what's on the Austin manifest, it goes in the report. The window's shut.
    - else:
        If she told you what's on the Austin manifest, that's grounds to move the team.
        The traffic on their share says the same, if you'd rather not rest it on one frightened engineer.
    }
}
-> hub

=== topic_traffic ===
~ traffic_discussed = true
I've read it. One authority signing for all four. One operation wearing four coats.

And the Austin row says nine days, not ninety. The brief was cooked.
{team_redirected or team_assignment == "trojan_horse":
    The team's in Austin. That's where this says they should be.
- else:
    {redirect_window_closed:
        The window's shut. It goes in the report.
    - else:
        {team_assigned:
            While the window's open, it's enough to move the team on.
        - else:
            The team's still waiting on your call. If you're making it now, that's where it goes.
        }
    }
}
-> hub

=== topic_mercer ===
~ mercer_discussed = true
{mercer_ko: On the floor, is he. The sequence never needed him awake. The host decides.|Blackout himself. James Mercer, twenty years a Department of Energy grid engineer. Then he built the failure he'd warned about.}

He read the projection and signed it. Nobody was talking him down.

// Phase 4 dialogue C1 (D7-36): by fate; a silent KO said nothing to him.
{mercer_fate == "arrested": Good. He's waited twenty years for a room that has to listen.|{mercer_fate == "escaped": You let him walk. That's in the log, in your words.|{mercer_ko: He never got to say his piece. He'll mind that more than the cell.|He came at you instead of saying his piece. Wherever he is, he's still writing it.}}}
-> hub

=== topic_tomb ===
~ tomb_discussed = true
Tomb Gamma. The Architect's workshop, where tonight was put together. No coordinates. He doesn't keep an address.

Bag it. That's what we work from next.
-> hub

// PASS 4 (user decision P6, the Tesseract thread). Works with or without
// m06: a player who read Satoshi's file knows who taught her; one who didn't
// learns only that the Architect knows something about SAFETYNET's own people.
// No name. m08 and later can build on it.
// Carry-over (2026-10-17): a player whose finished m06 run opened Satoshi's
// safe is told so; the else branch is the original line, word for word.
=== topic_teacher ===
~ teacher_discussed = true
...Read me that again.
Narrator: You read it back to her. The line stays quiet for longer than she usually lets it.
// PASS 4 round 2 (re-review F1): branch on whether the player actually heard
// her say it (first call, or "How do you carry that?").
{hurt_line_said:
    You've heard me say it. I say it to every agent I run.
- else:
    That's something I say. To every agent I run.
}
{m06_architect_identity_found:
    I didn't make it up. You opened Satoshi's safe, so you've read the name. The man it names taught it to me.
- else:
    I didn't make it up. Somebody taught it to me, a long time ago. Somebody who taught a lot of us.
}
Leave it with me. And keep it out of your notes for now.
-> hub

=== topic_mole ===
~ mole_discussed = true
Narrator: A long pause on the line.

Slowly. I want to be sure I'm hearing this.

He had your deployment before the order went out. Somebody handed ENTROPY you, by name.

I'll tell Netherton myself. Not on this line.

{grid_saved and not countdown_expired:
    You still saved eight point four million people.
}
{grid_saved and countdown_expired:
    // Phase 4 dialogue C1 (D7-38): Seattle went dark.
    You still held most of three states, with Seattle gone for a while.
}
{not grid_saved:
    And the grid's still yours to hold, so hold it first.
}
Get that intercept out of the building. It's the first thread of whatever comes next.
-> hub

// ===========================================
// PER-STAGE VM HINTS
// ===========================================

=== vm_hint_1 ===
~ vm1_hint_given = true
Start with their backup server. It has an NFS share open to anyone. Read it, don't change it.

It points at their coordination file, and there's a flag in it. Note any account name. You'll want it later.

The NFS and netcat guide has the commands.
-> hub

=== vm_hint_2 ===
~ vm2_hint_given = true
Scan every port on the host, not just the common ones. The recon guide has the step.

Something up there talks to anyone who connects. Read what it says.

Submit its flag and the relay hands you the capture. The control room password's in it, so you won't need anyone's help with that door.
-> hub

=== vm_hint_3 ===
~ vm3_hint_given = true
You've got a name from the share and a password from the listener. That's one login, and that account holds the next flag.

But open the control room door first. The moment you log in, assume they see you and start the clock.
{projection_revised and team_assigned and team_assignment != "trojan_horse" and not team_redirected and not redirect_window_closed:
    And if you mean to move the team, do it before you log in. Once they see you, it stays where it is.
}
-> hub

=== vm_hint_4 ===
~ vm4_hint_given = true
A user shell can't kill their job. You need root.

Start with what this account may run. The privilege escalation guide covers the rest.

Put the root flag through the relay, then give the console in the control room its abort.
-> hub

// PASS 4 round 2: prints, then the hub; owns no choices.
=== topic_park ===
~ park_hint_given = true
They told him about a building. Mercer's signed projection is on the console in the control room.
Put the number in front of him.
He won't wait for a third look. Have it in your hand when you go back down.
-> hub

// PASS 3: the player is at the vault door without the code. Prints, then the
// hub; owns no choices, so a re-navigation can't land here.
=== vault_hint ===
~ vault_hint_given = true
// PASS 5 puzzle chains r1 (F4): Hollis (talk route) and a turned Elena both
// give the rule already.
{hollis_resolved == "talked" or elena_outcome == "turned":
    You've been told already. The plate on the transfer switch, in this hall. Last four of the serial.
    -> hub
}
{found_coordination_traffic:
    OptiGrid reset it, and their site notes say how. Read the Portland block in what the relay pulled.
- else:
    {flag1_submitted:
        The relay's already pulled their notes off the share for you. Read them. The Portland block.
    - else:
        Their own site notes will say how. Get the share through the relay and read what comes back.
    }
}
-> hub

// ===========================================
// FIELD GUIDES -- delivery half
// PASS 5 design r2 (browser N2): each hand-over prints and goes to the hub, as
// m04's do. The one-choice "Got it." knots are gone: a player who closed the
// phone on one reopened to that single choice, not the hub. The give_item
// stays safe because the story now rests on the hub, never in this knot.
// ===========================================

=== guide_rfid ===
~ rfid_guide_hint_given = true
#give_item:lab-workstation:m07_rfid_field_guide
RFID cloning guide's in your kit.

The reader trusts the card and never asks who's holding it.

Hollis's badge works, and so does a copy: stand close while he talks and the cloner reads it. Or the badge station behind his desk.

Quiet and quick. Go.
-> hub

=== guide_lockpicking ===
~ lockpicking_guide_hint_given = true
#give_item:lab-workstation:m07_lockpicking_field_guide
Lockpicking guide uploaded.

Light tension, find the binding pin, set it, repeat. Don't force it.

You're carrying picks. That keyed door doesn't need its key.

Patient hands open any of those.
-> hub

=== guide_recon ===
~ recon_guide_hint_given = true
#give_item:lab-workstation:m07_recon_field_guide
Recon and network mapping guide sent.

Know what's on the network before you touch anything.

Their host turns up in a sweep. Find it first.

Go.
-> hub

=== guide_nfs ===
~ nfs_guide_hint_given = true
#give_item:lab-workstation:m07_nfs_field_guide
NFS and netcat guide's in your kit.

Read what the host shares, without changing it.

Then scan every port, not just the usual ones, and connect to anything that answers. Some services hand over more than a banner.
Read, don't touch. Go.
-> hub

=== guide_ssh ===
~ ssh_guide_hint_given = true
#give_item:lab-workstation:m07_ssh_field_guide
SSH guide's in your kit. The worked example's the hospital job. Skip the Hydra half; you already have the pair.

You've got a name from the share and a password from the listener. That's one login. Use it and look through what that account holds.

Log in when the control room door's open, not before. Go.
-> hub

=== guide_privesc ===
~ privesc_guide_hint_given = true
#give_item:lab-workstation:m07_privesc_field_guide
Privilege escalation guide uploaded.

Look for what they misconfigured before you think about breaking anything. The smallest step to root is the quietest.

Walk through the door they left open. Go.
-> hub
