// ===========================================
// PHONE NPC: Agent HaX (Handler Support)
// Mission 7: The Architect's Gambit
// Progress-gated support hub, delegation + redirect interface,
// five field guides, per-stage VM hints.
// ===========================================

// ---- Mission state (synced from globalVariables at call-open) ----
VAR team_assignment = ""
VAR team_assigned = false
VAR projection_revised = false
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
VAR found_tomb_gamma = false
VAR found_mole_evidence = false
VAR generator_hall_reached = false
VAR vault_entered = false

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
VAR vm1_hint_given = false
VAR vm2_hint_given = false
VAR vm3_hint_given = false
VAR vm4_hint_given = false
VAR vault_hint_given = false

EXTERNAL player_name()

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

Agent HaX: {player_name()}. HaX. I've got your channel and I've got the board.

Agent HaX: I'm running you from the ops room at home and the ops room is covering three continents tonight, so if I go quiet for ten seconds it isn't personal.

Agent HaX: The team's logged for {team_assignment == "fracture": Fracture -- Washington|{team_assignment == "meltdown": Meltdown -- San Francisco|Trojan Horse -- Austin}}. Aircraft's turned, it's on the record, it's done. I'm not going to relitigate it with you.

Agent HaX: What I can't do is be in the other two places. So you're going to be my hands in the one place a person on the ground still changes the ending. Grid control. Get inside.

-> first_call_committed_choices

// PASS 3 (E13): choices-only, so a re-navigation replays nothing.
=== first_call_committed_choices ===
+ [Walk me through the layout.]
    Agent HaX: Checkpoint, ops floor, then the server hall behind a badge reader. North of the server hall is the control room, behind a password. South is the plant: a keyed door, then a keypad down to the cable vault.
    Agent HaX: One of the guards on the checkpoint shift is bought. Assume every reader you touch is logging you. I'll flag the tools as you hit each lock.
    -> hub
+ [What's the clock?]
    Agent HaX: No clock yet. The sequence is loaded and waiting on the host that drives it. The moment you log in to that host, assume they notice and start it.
    Agent HaX: So get the control room door open before you log in to that host. The console up there is the only place the abort goes in.
    -> hub
+ [Understood. Let's go.]
    Agent HaX: Good. Call me the second you hit something you can't open.
    -> hub

=== first_call_open ===
// PASS 2 playtest D3 (lesson 36): this can run in the phone preload, before
// the briefing commit lands, so it must not claim the team is uncommitted.
// The commit option lives on the hub, gated on the synced team_assigned.
Agent HaX: {player_name()}. HaX. I've got your channel and I've got the board.

Agent HaX: If you've already sent the team, it's logged and I'm on the board with you. If the call's still open, tell me where they go and I'll pass it straight up to the Director.

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
    Agent HaX: Fracture. Passed up and confirmed.
    -> hub
+ [Trojan Horse. Austin.]
    #set_global:team_assignment:trojan_horse
    #set_global:team_assigned:true
    #complete_task:assign_tactical_team
    ~ delegation_registered = true
    ~ team_assigned = true
    ~ team_assignment = "trojan_horse"
    Agent HaX: Trojan Horse. Passed up and confirmed.
    -> hub
+ [Meltdown. San Francisco.]
    #set_global:team_assignment:meltdown
    #set_global:team_assigned:true
    #complete_task:assign_tactical_team
    ~ delegation_registered = true
    ~ team_assigned = true
    ~ team_assignment = "meltdown"
    Agent HaX: Meltdown. Passed up and confirmed.
    -> hub
+ [Not yet.]
    Agent HaX: Quickly. Two operations are waiting on which one you don't pick.
    -> hub

// ===========================================
// SUPPORT HUB -- gated on mission state
// ===========================================

=== hub ===

// PASS 3 (playtest s6): the "Confirm the team's away." option is removed.
// Every commit (briefing commit_menu, HaX commit_team) completes
// assign_tactical_team itself, so it was always redundant once team_assigned.

// --- No team yet (briefing closed early) ---
+ {not team_assigned} [Where the team goes: I'm ready to make the call.]
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

// --- The coordination traffic ---
+ {found_coordination_traffic and not traffic_discussed} [The share -- four operations running off one schedule.]
    -> topic_traffic

// --- Mercer ---
+ {(mercer_fate != "" or mercer_ko) and not mercer_discussed} [I've dealt with Mercer.]
    -> topic_mercer

// --- Tomb Gamma ---
+ {found_tomb_gamma and not tomb_discussed} [I found a dossier down in the vault. Tomb Gamma.]
    -> topic_tomb

// --- The mole ---
+ {found_mole_evidence and not mole_discussed} [The intercept in the vault. They didn't leak the operation. They leaked me.]
    -> topic_mole

// --- PASS 3: stuck at the vault keypad (names the source, never the digits) ---
+ {generator_hall_reached and not vault_entered and not vault_hint_given} [The vault keypad. Where do I get the code?]
    -> vault_hint

// --- Per-stage VM hints ---
+ {vm_terminal_used and not flag1_submitted and not vm1_hint_given} [I'm on the attack host and I don't know where to start.]
    -> vm_hint_1
+ {flag1_submitted and not flag2_submitted and not vm2_hint_given} [I've got the share. What's next on the host?]
    -> vm_hint_2
+ {flag2_submitted and not flag3_submitted and not vm3_hint_given} [I've got a username and a password. Now what?]
    -> vm_hint_3
+ {flag3_submitted and not flag4_submitted and not vm4_hint_given} [I'm in as their operator. How do I stop the cascade?]
    -> vm_hint_4

// --- Field guide requests ---
+ {rfid_guide_offered and not rfid_guide_hint_given} [Send me the RFID cloning field guide.]
    -> guide_rfid
+ {lockpicking_guide_offered and not lockpicking_guide_hint_given} [Send me the lockpicking field guide.]
    -> guide_lockpicking
+ {recon_guide_offered and not recon_guide_hint_given} [Send me the recon and network mapping field guide.]
    -> guide_recon
+ {nfs_guide_offered and not nfs_guide_hint_given} [Send me the NFS and netcat field guide.]
    -> guide_nfs
+ {ssh_guide_offered and not ssh_guide_hint_given} [Send me the SSH field guide.]
    -> guide_ssh
+ {privesc_guide_offered and not privesc_guide_hint_given} [Send me the privilege escalation field guide.]
    -> guide_privesc

// --- Sticky exit ---
+ [I'll call you back.]
    Agent HaX: I'm here. Go.
    #exit_conversation
    -> hub

// ===========================================
// THE REDIRECT
// ===========================================

=== redirect_open ===
Agent HaX: I hear you. And I want to be straight about what you're asking, because I'm not going to dress it up.

Agent HaX: If I move them, they don't teleport. They peel off {team_assignment == "fracture": Fracture|{team_assignment == "meltdown": Meltdown|the current tasking}} and fly to Austin, and they land forty minutes into an injection that's already running. Best case they stop it at a third. Millions of systems still take the backdoor. That's not a save, it's a partial.

Agent HaX: And the place you're pulling them from goes completely dark. Nobody there. Whatever was going to happen there, happens.

Agent HaX: The trade is real: the healthcare and dispatch keys are sequenced late in that manifest, so getting there at all keeps ambulances on the road. But you're paying for it in the operation you abandon. Your call, and it's a hard one.

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
    Agent HaX: Redirecting. Austin confirmed, forty minutes out.
    Narrator: One pin swings across the board to Austin. The pin it left behind goes dark and stays dark.
    Agent HaX: You changed your mind under a clock, on evidence you went and found. Not many can. Live with the half you couldn't reach -- that one's on ENTROPY, not you.
    -> hub

+ [No. Leave them where they are.]
    #set_global:redirect_declined:true
    ~ redirect_declined = true
    Agent HaX: Then they stay. I'll note you weighed it and held. That's a decision too, and a defensible one.
    -> hub

=== redirect_closed ===
~ redirect_closed_discussed = true
Agent HaX: No. I'm sorry -- that window's shut.

Agent HaX: The team's committed on the ground now. I can't turn an aircraft mid-approach on a maybe, and there isn't the fuel or the time to peel them off a live objective and re-task them across the country. If we'd moved them earlier it would have meant something. Now it just strands two operations instead of one.

Agent HaX: You learned the numbers were wrong. That knowledge wasn't wasted -- it goes in the report. But the team's where it is. Finish the part that's still yours to finish.

-> redirect_closed_choices

=== redirect_closed_choices ===
+ [Understood.]
    -> hub

// ===========================================
// MORAL SOUNDING BOARD
// ===========================================

=== moral_soundingboard ===
~ moral_discussed = true
Agent HaX: Yeah. I've been sitting with that since you made the call.

Agent HaX: Two of them we don't answer. Whichever way you'd turned it, that stays true -- there was one team and three fires. That's not a failure of nerve, it's arithmetic, and ENTROPY built the arithmetic on purpose.

-> moral_soundingboard_choices

=== moral_soundingboard_choices ===
+ [How do you carry that?]
    Agent HaX: Badly, if you're any good. You don't get to feel clean about triage. The trick is to let it hurt afterwards and not during, because during is when you make it worse.
    Agent HaX: You saved the one place a body on the ground could reach. Hold onto that. Not as an excuse -- as a fact.
    -> hub

+ [Was there a right answer?]
    Agent HaX: No. That's the whole shape of it. Deaths tonight, an election, or every mission after -- you can't put those on the same scale. Anyone who tells you they'd have known is lying or hasn't read the briefs.
    -> hub

// ===========================================
// NPC / LORE TOPICS
// ===========================================

=== topic_hollis ===
~ hollis_discussed = true
Agent HaX: {hollis_ko: He's down, then. Fine. He made his choice when he took their money.|Hollis, yeah. We cleared him last month -- routine revalidation, clean sheet.}

Agent HaX: Which is the part that should worry you. Somebody inside our vetting signed off a man ENTROPY already owned. That's a small version of a much bigger question, and you're going to meet the big version before the night's out.
-> hub

=== topic_elena ===
~ elena_discussed = true
Agent HaX: {elena_ko: She's not talking now. Shame -- she was the one person in there who'd been lied to as hard as the public had.|She was shown a six-hour demonstration with nobody hurt. What you're standing in is not that.}

Agent HaX: The projections in your brief were ENTROPY's own numbers. They fed them to us as part of the gambit. Elena's the proof they're understated -- if she told you what's on the Austin manifest, that's your redirect evidence. Same thing the coordination traffic on their share will tell you, if you'd rather not take one frightened engineer's word for it.
-> hub

=== topic_traffic ===
~ traffic_discussed = true
Agent HaX: I've read it. Four operations, one schedule, one authority signing the tasking. They're not four cells improvising in parallel. They're one operation wearing four coats.

Agent HaX: And the Trojan Horse parameters are right there in it -- nine-day dormancy, healthcare and dispatch vendors in the manifest. That's your hard confirmation the brief was cooked.
{team_assigned:
    Agent HaX: If the window's open, it's enough to move the team on.
- else:
    Agent HaX: The team's still waiting on your call. If you're making it now, that's where it goes.
}
-> hub

=== topic_mercer ===
~ mercer_discussed = true
Agent HaX: {mercer_ko: On the floor, is he. Doesn't change a thing about the sequence -- the host decides when it runs, and it never needed him conscious.|Blackout himself. Dr James Mercer. Ex-DoE, built cascading-failure models for a living, now he builds them for real and calls it a lesson.}

Agent HaX: He read the casualty projection and signed it. Nobody was ever going to talk him down. What you said to him won't have saved anyone. It changes what he has to live with, that's all.
-> hub

=== topic_tomb ===
~ tomb_discussed = true
Agent HaX: Tomb Gamma. That's the Architect's workshop -- where the whole gambit was assembled. No coordinates on it, you'll notice. Deliberate. He doesn't keep an address.

Agent HaX: Bag it. That dossier is half of what we'll be working from next. The other half's whatever else is down there with you.
-> hub

=== topic_mole ===
~ mole_discussed = true
Narrator: A long pause on the line.

Agent HaX: Say that again slowly, because I want to be sure I'm hearing it.

Agent HaX: He had our deployment before we made it. Not the attack timing -- the agent. Somebody handed ENTROPY you. Which means tonight was never about the grid. It was an experiment to watch how SAFETYNET triages when it can't cover everything, and we just ran it for him in full.

{grid_saved and not countdown_expired:
    Agent HaX: You still saved eight point four million people. That's real, don't let anyone take it off you.
}
{grid_saved and countdown_expired:
    Agent HaX: You still held three states with one step already gone. That's real, don't let anyone take it off you.
}
{not grid_saved:
    Agent HaX: And the grid's still yours to hold, so hold it first.
}
Agent HaX: But we've got a leak, and it's near enough the top to know your tasking. Get that intercept out. It's the first thread of the next one.
-> hub

// ===========================================
// PER-STAGE VM HINTS
// ===========================================

=== vm_hint_1 ===
~ vm1_hint_given = true
Agent HaX: The host driving this is their backup server, and it has an NFS export sitting wide open. Mount it read-only and go through it. The export points at their coordination file, and there's a flag in it.

Agent HaX: showmount to see what's exported, then mount it somewhere local. Read, don't touch. Note any account names you find. You'll want one later.
-> hub

=== vm_hint_2 ===
~ vm2_hint_given = true
Agent HaX: Good. Now scan every port on the host, not just the common ones. Something on a port above 1024 will talk to anyone who connects. Connect to it with netcat and read what it says.

Agent HaX: Submit that flag and the relay hands you the capture. It has the control room door password in it, so you won't need anyone in there to cooperate.
-> hub

=== vm_hint_3 ===
~ vm3_hint_given = true
Agent HaX: The name from the share and the password from the listener are one account. SSH in with them. There's a flag in that account's home directory.

Agent HaX: Before you do: the moment you log in, assume they see you and start the sequence. If the control room door isn't open yet, open it first.
-> hub

=== vm_hint_4 ===
~ vm4_hint_given = true
Agent HaX: A user shell won't kill their job. You need root. sudo -l first: see what this account is allowed to run as root, then ask what each of those programs can be made to run.

Agent HaX: Root flag goes through the relay, and the cascade control system in the control room will take an abort. Go and give it one.
-> hub

// PASS 3: the player is at the vault door without the code. Prints, then the
// hub; owns no choices, so a re-navigation can't land here.
=== vault_hint ===
~ vault_hint_given = true
{found_coordination_traffic:
    Agent HaX: OptiGrid reset it, and their own site notes say how. Read the Portland block in what the relay pulled.
- else:
    {flag1_submitted:
        Agent HaX: The relay's already pulled their notes off the share for you. Read them. The Portland block.
    - else:
        Agent HaX: Their own site notes will say how. Get the share through the relay and read what comes back.
    }
}
-> hub

// ===========================================
// FIELD GUIDES -- delivery half
// ===========================================

=== guide_rfid ===
~ rfid_guide_hint_given = true
#give_item:lab-workstation:m07_rfid_field_guide
Agent HaX: RFID cloning guide's on your terminal.

Agent HaX: The reader only checks what the card says, not who's holding it. That's the whole weakness. Hollis's badge works, and so does anything the badge station behind his desk prints.

-> guide_rfid_choices

// PASS 3 (E13): the #give_item stays in the text half above, so a re-navigation can't replay it.
=== guide_rfid_choices ===
+ [Got it.]
    Agent HaX: Quiet and quick. Go.
    -> hub

=== guide_lockpicking ===
~ lockpicking_guide_hint_given = true
#give_item:lab-workstation:m07_lockpicking_field_guide
Agent HaX: Lockpicking guide uploaded.

Agent HaX: Light tension, find the binding pin, set it, repeat. Read the lock by feel, don't force it. You're carrying picks -- that keyed door doesn't need the key.

-> guide_lockpicking_choices

// PASS 3 (E13): the #give_item stays in the text half above, so a re-navigation can't replay it.
=== guide_lockpicking_choices ===
+ [Received.]
    Agent HaX: Patient hands open any of those. Go.
    -> hub

=== guide_recon ===
~ recon_guide_hint_given = true
#give_item:lab-workstation:m07_recon_field_guide
Agent HaX: Recon and network mapping guide sent.

Agent HaX: Before you exploit anything, know what's there. Sweep the subnet, map the hosts, list the services. The attack host and its backup server both turn up here -- find them before you touch them.

-> guide_recon_choices

// PASS 3 (E13): the #give_item stays in the text half above, so a re-navigation can't replay it.
=== guide_recon_choices ===
+ [Understood.]
    Agent HaX: Map first, act second. Always. Go.
    -> hub

=== guide_nfs ===
~ nfs_guide_hint_given = true
#give_item:lab-workstation:m07_nfs_field_guide
Agent HaX: NFS and netcat guide's on your terminal.

Agent HaX: showmount tells you what the host is sharing and with whom. Mount it read-only and read everything. Then sweep every port, not just the usual ones, and connect to anything that answers. Some services hand over more than a banner.
-> guide_nfs_choices

// PASS 3 (E13): the #give_item stays in the text half above, so a re-navigation can't replay it.
=== guide_nfs_choices ===
+ [Copy.]
    Agent HaX: Read, don't touch. Go.
    -> hub

=== guide_ssh ===
~ ssh_guide_hint_given = true
#give_item:lab-workstation:m07_ssh_field_guide
Agent HaX: SSH guide's on your terminal. Worked example's the hospital job -- skip the Hydra half, you've already got the pair.

Agent HaX: The name from the share, the password from the listener. Check port 22 answers, ssh in with that one account, then look in its home directory. One username, one password: no guessing.

-> guide_ssh_choices

// PASS 3 (E13): the #give_item stays in the text half above, so a re-navigation can't replay it.
=== guide_ssh_choices ===
+ [Copy.]
    Agent HaX: Log in when the control room door's open, not before. Go.
    -> hub

=== guide_privesc ===
~ privesc_guide_hint_given = true
#give_item:lab-workstation:m07_privesc_field_guide
Agent HaX: Privilege escalation guide uploaded.

Agent HaX: sudo -l first, then the smallest step that gets you root. Look for what they misconfigured rather than what you'd have to break. Least noise, most access.

-> guide_privesc_choices

// PASS 3 (E13): the #give_item stays in the text half above, so a re-navigation can't replay it.
=== guide_privesc_choices ===
+ [Received.]
    Agent HaX: Walk through the door they left open. Go.
    -> hub
