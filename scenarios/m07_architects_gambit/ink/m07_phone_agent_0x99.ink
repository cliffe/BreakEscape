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
VAR park_hint_given = false
VAR deduce_wrong_count = 0
VAR vm1_hint_given = false
VAR vm2_hint_given = false
VAR vm3_hint_given = false
VAR vm4_hint_given = false
VAR vault_hint_given = false

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

The ops room's covering three continents tonight. If I go quiet for ten seconds, it isn't personal.

The team's logged for {team_assignment == "fracture": Fracture -- Washington|{team_assignment == "meltdown": Meltdown -- San Francisco|Trojan Horse -- Austin}}. It's on the record. It'd take something new to move it.

I can't be in the other two places.

You're my hands in the one place where a person on the ground still changes the ending.

Get past the checkpoint to the operations floor.

-> first_call_committed_choices

// PASS 3 (E13): choices-only, so a re-navigation replays nothing.
=== first_call_committed_choices ===
+ [Walk me through the layout.]
    Checkpoint, ops floor, then the server hall behind a badge reader.
    North of the server hall, the control room, on a password. The engineer in the server hall knows it, and their own network leaks it.
    South, the plant: keyed door, then a keypad down to the cable vault.
    One checkpoint guard is bought. Assume every reader logs you.
    -> first_call_committed_choices
+ [What's the clock?]
    {grid_saved:
        No clock now. The abort's in and the grid's holding.
    - else:
        // PASS 5 scenario design r1 (D2): the clock can run out; say what's
        // left. Root already in means the console is the next step.
        {
        - countdown_expired and flag4_submitted:
            Step one ran. Seattle's dark. Steps two to four wait on the abort, and the console in the control room will take it now.
        - countdown_expired:
            Step one ran. The rest waits on the abort. Root first, then the console.
        - cascade_armed and flag4_submitted:
            It's running, and root's in. The console in the control room takes the abort now.
        - cascade_armed:
            It's running. Fifteen minutes from your login on their host. Get root, then put the abort in at the control room console.
        - else:
            No clock yet. The sequence waits on the host that drives it. The moment you log in there, assume they start it.
            So open the control room door first. The console in there is the only place the abort goes in.
        }
    }
    -> first_call_committed_choices
+ [Understood. Let's go.]
    Call me the second you hit something you can't open.
    -> hub

=== first_call_open ===
// PASS 2 playtest D3 (lesson 36): this can run in the phone preload, before
// the briefing commit lands, so it must not claim the team is uncommitted.
// The commit option lives on the hub, gated on the synced team_assigned.
HaX here, Agent. I've got your channel and the board.

Get past the checkpoint to the operations floor. Call me when you hit something you can't open.

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
+ {projection_revised and team_assigned and team_assignment != "trojan_horse" and not team_redirected and redirect_window_closed and not redirect_closed_discussed} [Can I still move the team to Trojan Horse?]
    -> redirect_closed

// --- Moral sounding board ---
+ {team_assigned and not moral_discussed} [Talk to me about the two we're not covering.]
    -> moral_soundingboard

// --- Hollis ---
+ {(hollis_resolved != "" or hollis_ko) and not hollis_discussed} [The guard on the checkpoint -- Hollis. He was dirty.]
    -> topic_hollis

// --- Elena ---
+ {elena_outcome != "" and not elena_discussed} [Elena's numbers don't match the brief.]
    -> topic_elena
+ {elena_ko and elena_outcome == "" and not elena_discussed} [The engineer in the server hall. Elena Rodriguez. She's down.]
    -> topic_elena

// --- PASS 5 alignment r1 (M2): the deduction. The decode no longer sets
// projection_revised and nobody names the row; the player says which operation
// and what's wrong. Checks what's done (the decode read), not how.
+ {found_coordination_traffic and not projection_revised} [Their schedule doesn't match our brief.]
    -> deduce_schedule

// --- The coordination traffic (the player already has the correction, from
// Elena; deduce_right covers the same ground and sets traffic_discussed) ---
+ {found_coordination_traffic and projection_revised and not traffic_discussed} [The share -- four operations running off one schedule.]
    -> topic_traffic

// --- Mercer ---
+ {(mercer_fate != "" or mercer_ko) and not mercer_discussed} [I've dealt with Mercer.]
    -> topic_mercer

// --- Tomb Gamma ---
+ {found_tomb_gamma and not tomb_discussed} [I found a dossier down in the vault. Tomb Gamma.]
    -> topic_tomb

// --- PASS 4 (user decision P6): the Architect used HaX's own line ---
+ {architect_echo_heard and not teacher_discussed} [He used your line. "Let it hurt afterwards."]
    -> topic_teacher

// --- The mole ---
+ {found_mole_evidence and not mole_discussed} [The intercept in the vault. They didn't leak the operation. They leaked me.]
    -> topic_mole

// --- PASS 4 round 2 (playtest note 5): the Park pointer, findable again ---
+ {vault_entered and not casualty_projection_found and not park_ko and park_resolved != "talked" and park_resolved != "ko" and not park_hint_given} [The man in the vault won't stop. What would reach him?]
    -> topic_park

// --- PASS 3: stuck at the vault keypad (names the source, never the digits) ---
+ {generator_hall_reached and not vault_entered and not vault_pin_found and not vault_hint_given} [The vault keypad. Where do I get the code?]
    -> vault_hint

// --- Per-stage VM hints ---
+ {vm_terminal_used and not flag1_submitted and not vm1_hint_given} [I'm on the Kali box. Where do I start on their host?]
    -> vm_hint_1
+ {flag1_submitted and not flag2_submitted and not vm2_hint_given} [I've got the share. What's next on the host?]
    -> vm_hint_2
+ {flag2_submitted and not flag3_submitted and not vm3_hint_given} [I've got a username and a password. Now what?]
    -> vm_hint_3
+ {flag3_submitted and not flag4_submitted and not vm4_hint_given} [I'm in as their operator. How do I stop the cascade?]
    -> vm_hint_4

// --- Field guide requests ---
// PASS 5 scenario design r1 (m15): one choice, m04's pattern; the guides are
// on a choices-only sub-menu (field_guides).
+ {guide_waiting()} [Send me a field guide.]
    -> field_guides

// --- PASS 5 scenario design r1 (D1): progress-aware status, m04's pattern ---
+ [Where do I stand?]
    -> report_progress

// --- PASS 4 dialogue (script edit S2): the preload lands in first_call_open, so the
// layout and clock answers were unreachable. This sticky choice reaches them.
+ [Remind me of the layout and the clock.]
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
{
- grid_saved and debrief_requested and flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted:
    It's done. Netherton's waiting. Next door you go through, he's on the link.
- grid_saved and flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted:
    It's done. The grid's holding. Sweep what you want, then tell me to bring you in.
- grid_saved:
    Grid's held. Some of what you took off their host hasn't gone through the relay. Submit the rest, then call me.
- not team_assigned:
    The team's still waiting on your call. Make it first. Tell me where it goes and I'll pass it up.
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
    {scada_password_found: You've got the password.|Elena knows the password, and their listener gives it out.}
- not flag3_submitted:
    One SSH login: the name from the share, the password from the listener. The flag's in its home directory. The moment you log in, the clock starts.
    {projection_revised and team_assigned and team_assignment != "trojan_horse" and not team_redirected and not redirect_window_closed:
        If you mean to move the team, do it before you log in.
    }
- not flag4_submitted:
    {countdown_expired:
        Step one ran. Steps two to four haven't.
    }
    Get root on their host and put the root flag through the relay. The console opens itself after.
    {not scada_door_reached:
        And you'll need the control room door open for the abort.
    }
- else:
    Root's in. Put the abort in at the console in the control room.
}
{not vault_entered and server_hall_reached:
    The plant's south of the server hall, if you want to see how they got in. That part's optional.
}
-> hub

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

And it's now or never. Once you log in on their host, the team stays where it is.

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
    Redirecting. Austin confirmed, forty minutes out.
    Narrator: One pin swings across the board to Austin. The pin it left behind goes dark and stays dark.
    Done. It's logged under your name.
    The ones you couldn't reach are on ENTROPY.
    -> hub

+ [No. Leave them where they are.]
    #set_global:redirect_declined:true
    ~ redirect_declined = true
    Then they stay. I'll log that you weighed it and held. That's a decision too.
    -> hub

=== redirect_closed ===
~ redirect_closed_discussed = true
No. I'm sorry -- that window's shut.

The team's on the ground on a live objective. Pull them now and we strand two operations instead of one.

{grid_saved:
    You found the numbers were wrong. That goes in the report. The part that was yours is finished.
- else:
    You found the numbers were wrong. That goes in the report. Now finish the part that's still yours.
}

-> redirect_closed_choices

=== redirect_closed_choices ===
+ [Understood.]
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
    No. That was the design.
    Anyone who says they'd have known is lying, or didn't read the briefs.
    -> hub

// ===========================================
// NPC / LORE TOPICS
// ===========================================

=== topic_hollis ===
~ hollis_discussed = true
{hollis_ko: He's down, then. He made his choice when he took their money.|Hollis. We cleared him last month. Routine revalidation, clean sheet.}

That should worry you. Our vetting signed off a man ENTROPY already owned.

It's a small version of a bigger question. You'll meet the big one tonight.
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

What you said is his to live with now.
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
I didn't make it up. Somebody taught it to me, a long time ago. Somebody who taught a lot of us.
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
    You still held three states with one step gone.
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
You've got a name from the share and a password from the listener. That's one SSH login. The flag's in its home directory.

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
// ===========================================

=== guide_rfid ===
~ rfid_guide_hint_given = true
#give_item:lab-workstation:m07_rfid_field_guide
RFID cloning guide's on your terminal.

The reader trusts the card and never asks who's holding it.

Hollis's badge works, and so does a copy: stand close while he talks and the cloner reads it. Or the badge station behind his desk.

-> guide_rfid_choices

// PASS 3 (E13): the #give_item stays in the text half above, so a re-navigation can't replay it.
=== guide_rfid_choices ===
+ [Got it.]
    Quiet and quick. Go.
    -> hub

=== guide_lockpicking ===
~ lockpicking_guide_hint_given = true
#give_item:lab-workstation:m07_lockpicking_field_guide
Lockpicking guide uploaded.

Light tension, find the binding pin, set it, repeat. Don't force it.

You're carrying picks. That keyed door doesn't need its key.

-> guide_lockpicking_choices

// PASS 3 (E13): the #give_item stays in the text half above, so a re-navigation can't replay it.
=== guide_lockpicking_choices ===
+ [Received.]
    Patient hands open any of those.
    -> hub

=== guide_recon ===
~ recon_guide_hint_given = true
#give_item:lab-workstation:m07_recon_field_guide
Recon and network mapping guide sent.

Know what's on the network before you touch anything.

Their host turns up in a sweep. Find it first.

-> guide_recon_choices

// PASS 3 (E13): the #give_item stays in the text half above, so a re-navigation can't replay it.
=== guide_recon_choices ===
+ [Understood.]
    Go.
    -> hub

=== guide_nfs ===
~ nfs_guide_hint_given = true
#give_item:lab-workstation:m07_nfs_field_guide
NFS and netcat guide's on your terminal.

Read what the host shares, without changing it.

Then scan every port, not just the usual ones, and connect to anything that answers. Some services hand over more than a banner.
-> guide_nfs_choices

// PASS 3 (E13): the #give_item stays in the text half above, so a re-navigation can't replay it.
=== guide_nfs_choices ===
+ [Copy.]
    Read, don't touch. Go.
    -> hub

=== guide_ssh ===
~ ssh_guide_hint_given = true
#give_item:lab-workstation:m07_ssh_field_guide
SSH guide's on your terminal. The worked example's the hospital job. Skip the Hydra half; you already have the pair.

You've got a name from the share and a password from the listener. That's one login. Use it and look in the home directory.

-> guide_ssh_choices

// PASS 3 (E13): the #give_item stays in the text half above, so a re-navigation can't replay it.
=== guide_ssh_choices ===
+ [Copy.]
    Log in when the control room door's open, not before. Go.
    -> hub

=== guide_privesc ===
~ privesc_guide_hint_given = true
#give_item:lab-workstation:m07_privesc_field_guide
Privilege escalation guide uploaded.

Look for what they misconfigured before you think about breaking anything. The smallest step to root is the quietest.

-> guide_privesc_choices

// PASS 3 (E13): the #give_item stays in the text half above, so a re-navigation can't replay it.
=== guide_privesc_choices ===
+ [Received.]
    Walk through the door they left open. Go.
    -> hub
