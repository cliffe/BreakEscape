EXTERNAL player_name()

// No game-state EXTERNAL getters. The engine binds only player_name; any other
// EXTERNAL throws at runtime. Progress is read from globals synced from
// globalVariables (declared below), exactly as m02's handler does.

// ---- Progress globals (synced from globalVars) ----
VAR briefing_played = false
VAR mission_phase = ""
VAR night_confrontation_ready = false
VAR guard_detection_count = 0
VAR player_approach = ""
VAR flag_scan_submitted = false
VAR flag_ftp_submitted = false
VAR flag_http_submitted = false
VAR flag_distcc_submitted = false
VAR whiteboard_seen = false
VAR roster_seen = false
VAR usb_seen = false

// ---- Field-guide exposure flags (offered synced; given tracked locally) ----
VAR lockpicking_guide_offered = false
VAR netexploit_guide_offered = false
VAR lockpicking_guide_given = false
VAR netexploit_guide_given = false
VAR rfid_guide_given = false
VAR recon_guide_given = false
VAR cyberchef_guide_given = false

// ---- Local hint tracking ----
VAR hint_confrontation_given = false
VAR hint_rfid_given = false
VAR hint_lockpicking_given = false
VAR hint_password_given = false
VAR hint_encoding_given = false
VAR hint_network_given = false

// Root divert. When a conversation has ended (-> DONE), the engine restores only
// its variables on the next talk and continues from the root (npc-conversation-
// state.js restoreNPCState). Without this line the root is empty and the player
// sees "(End of conversation)" instead of the start knot's re-entry routing.
-> start

=== start ===
#speaker:agent_0x99
Agent HaX: {player_name()}. What do you need?
-> hub

=== hub ===
+ {night_confrontation_ready and not hint_confrontation_given} [Sterling's still in the building. How do I play this?]
    -> hint_confrontation
+ {briefing_played and not rfid_guide_given} [Send me the RFID cloning field guide]
    -> request_rfid_guide
+ {lockpicking_guide_offered and not lockpicking_guide_given} [Send me the lockpicking field guide]
    -> request_lockpicking_guide
+ {netexploit_guide_offered and not recon_guide_given} [Send me the reconnaissance field guide]
    -> request_recon_guide
+ {netexploit_guide_offered and not netexploit_guide_given} [Send me the distcc exploitation field guide]
    -> request_netexploit_guide
+ {netexploit_guide_offered and not cyberchef_guide_given} [Send me the CyberChef decoding field guide]
    -> request_cyberchef_guide
+ [Where do I stand?]
    -> report_progress
+ [I need a hint]
    -> provide_hint
+ [Nothing right now]
    Agent HaX: Copy. Call anytime, {player_name()}.
    #exit_conversation
    -> DONE

=== hint_confrontation ===
#speaker:agent_0x99
~ hint_confrontation_given = true
Agent HaX: Listen carefully. You've got the logs. The case stands whether or not she's in cuffs.
Agent HaX: Want the Architect? Offer her a deal, and a cold one. She flips to save herself, not because she's sorry -- don't mistake the two.
Agent HaX: Want her off the board? Arrest her. But she came ready to run, so corner her or she walks.
Agent HaX: And if the evidence is enough for you, let her go and secure it. Your call. None of them are clean.
+ [Understood]
    -> hub

=== request_rfid_guide ===
#speaker:agent_0x99
~ rfid_guide_given = true
#set_variable:rfid_guide_requested:true
#give_item:lab-workstation:m03_rfid_field_guide
Agent HaX: RFID cloning guide sent.
Agent HaX: Read, crack, emulate. Reception's card is weak defaults -- near instant. Sterling's is custom keys, so the crack grinds. Stay in range until it finishes.
+ [Received]
    -> hub

=== request_recon_guide ===
#speaker:agent_0x99
~ recon_guide_given = true
#set_variable:recon_guide_requested:true
#give_item:lab-workstation:m03_recon_field_guide
Agent HaX: Reconnaissance guide sent.
Agent HaX: Map before you touch anything. nmap the subnet, read the versions, then pick your target. The scan flag comes off a clean sweep.
+ [Got it]
    -> hub

=== request_cyberchef_guide ===
#speaker:agent_0x99
~ cyberchef_guide_given = true
#set_variable:cyberchef_guide_requested:true
#give_item:lab-workstation:m03_cyberchef_field_guide
Agent HaX: CyberChef guide sent.
Agent HaX: ROT13, Base64, hex. If a decode still looks scrambled, it's layered -- decode again. There's no key to find; encoding isn't encryption.
+ [Received]
    -> hub

=== request_lockpicking_guide ===
#speaker:agent_0x99
~ lockpicking_guide_given = true
#set_variable:lockpicking_guide_requested:true
#give_item:lab-workstation:m03_lockpicking_field_guide
Agent HaX: Lockpicking guide sent.
Agent HaX: Light tension, find the binding pin, set it, repeat -- and only when the guard's at the far end of his patrol. Pick in his sightline and you're made.
+ [Received]
    -> hub

=== request_netexploit_guide ===
#speaker:agent_0x99
~ netexploit_guide_given = true
#set_variable:netexploit_guide_requested:true
#give_item:lab-workstation:m03_netexploit_field_guide
Agent HaX: distcc guide sent.
Agent HaX: The legacy distcc daemon on 3632 runs jobs for anyone who asks -- CVE-2004-2687. Point the distcc_exec module at it and the operational logs are yours.
+ [Got it]
    -> hub

=== provide_hint ===
#speaker:agent_0x99
Agent HaX: What's giving you trouble?
+ {not hint_rfid_given} [Cloning the keycards]
    -> hint_rfid
+ {not hint_lockpicking_given} [The locked doors and cabinets]
    -> hint_lockpicking
+ {not hint_password_given} [Sterling's computer password]
    -> hint_password
+ {not hint_encoding_given} [Decoding what I've found]
    -> hint_encoding
+ {not hint_network_given} [The training network]
    -> hint_network
+ [Never mind]
    -> hub

=== hint_rfid ===
#speaker:agent_0x99
~ hint_rfid_given = true
Agent HaX: Two stages. Reception first -- lean in near her desk and the cloner picks the MIFARE signal off her lanyard. Weak defaults, so it cracks near instantly and opens the conference door.
Agent HaX: Then Sterling's executive card in the meeting. Custom keys, so the crack takes about half a minute. Best moment is when you're both at the whiteboard. Keep her talking through it.
+ [Read, crack, emulate. Got it.]
    Agent HaX: That order every time. The server room won't open until you emulate her cracked card at the door.
    -> hub

=== hint_lockpicking ===
#speaker:agent_0x99
~ hint_lockpicking_given = true
Agent HaX: You've got the pick kit from the start. Sterling's office and the cabinets are keyed -- approach a locked one and interact.
Agent HaX: It takes time and it exposes you. Watch the guard's loop and only work the lock when his back's turned. If he catches you at it, that's a detection you don't get back.
+ [Understood]
    -> hub

=== hint_password ===
#speaker:agent_0x99
~ hint_password_given = true
Agent HaX: People reuse what they can't forget. The post-it on her monitor reads "VS / founding year".
Agent HaX: The founding year's on the plaque in reception -- 2010. Her initials, then the year. That's her login.
Agent HaX: The wall safe's a different code. She keeps that one in her drafts, not on the post-it.
+ [I'll look]
    -> hub

=== hint_encoding ===
#speaker:agent_0x99
~ hint_encoding_given = true
Agent HaX: Take the laptop in the server room -- it's loaded with CyberChef. Paste anything that looks like nonsense.
Agent HaX: ROT13 reads like scrambled English. Base64 is letters, numbers, plus and slash. Hex is pairs of 0-9 and A-F.
Agent HaX: And if it's still scrambled after one pass, it's layered. Decode again. The drive in her desk is Base64 over ROT13 -- two passes.
+ [Thanks]
    -> hub

=== hint_network ===
#speaker:agent_0x99
~ hint_network_given = true
Agent HaX: The VM terminal in the server room reaches 192.168.100.0/24. Scan first, then work the services.
Agent HaX: FTP and the web host give you the client and pricing flags. distcc is the one that matters -- that's where the operational logs are. Submit all four at the drop-site.
+ [Got it]
    -> hub

=== report_progress ===
#speaker:agent_0x99
{ not (mission_phase == "act2_infiltration"):
    Agent HaX: Day one still. Get Sterling's card cloned -- everything after that depends on server room access.
    -> report_end
}
{ night_confrontation_ready:
    Agent HaX: Network's stripped and the case is made. Sterling's your last move. Take Danny Foster's office first if you want a say in his end.
    -> report_end
}
Agent HaX: You're in after hours. Status:
{ flag_scan_submitted and flag_ftp_submitted and flag_http_submitted:
    Agent HaX: Recon, FTP and pricing flags are in. Just distcc left -- that's the logs, that's the case.
- else:
    Agent HaX: Flags going in. Keep working the services. The distcc box is the one that finishes it.
}
{ guard_detection_count == 0:
    Agent HaX: And the guard hasn't so much as looked at you. Stay that way.
}
{ guard_detection_count > 0:
    Agent HaX: The guard's clocked you at least once. Tighten up -- pick locks only when he's turned away.
}
-> report_end

=== report_end ===
+ [Continue]
    Agent HaX: Call if you need me.
    -> hub

=== on_rfid_clone_success ===
#speaker:agent_0x99
Agent HaX: Crack complete. Sterling's card is in the cloner.
Agent HaX: Sit tight until the place clears out, then the server room door. Emulate her card there. That's when the real work starts.
-> hub

=== on_victoria_computer_accessed ===
#speaker:agent_0x99
Agent HaX: You're into her machine. Good.
Agent HaX: Client roster, transaction records, anything to the Architect. And her drafts -- the wall-safe code lives in there.
-> hub

=== m2_revelation_call ===
#speaker:agent_0x99
Agent HaX: {player_name()}, I've got the distcc logs you just submitted.
Agent HaX: There it is. The ProFTPD backdoor. Line item on invoice ZDS-2024-0847: twenty-five thousand, priced in US dollars like everything else on that market, part of a package to Ghost.
Agent HaX: Target line: St. Catherine's Regional. Sable's sign-off on the approval.
Agent HaX: This is the thing we couldn't prove at the hospital. Zero Day armed Ghost. It's on the record now, timestamped and attributed.
* [We can prosecute this]
    You: Direct chain. Zero Day to Ghost to St. Catherine's. That stands up.
    Agent HaX: It does. ENTROPY procurement, in writing. Ironclad.
    -> m2_revelation_impact
* [The healthcare premium is the intent]
    You: They charged extra to attack a hospital. That's not negligence, that's a pricing decision.
    Agent HaX: That's the line a jury remembers. Keep it.
    -> m2_revelation_impact
* [This is bigger than one sale]
    You: If they invoice one cell like this, they invoice all of them.
    Agent HaX: Which is the whole reason you're in there. Finish it.
    -> m2_revelation_impact

=== m2_revelation_impact ===
#speaker:agent_0x99
Agent HaX: Pull the rest while you're standing in it. The catalogue, the roster, the drive in her desk. Every page is another cell we can name.
Agent HaX: And {player_name()} -- the logs point at a Phase 2. Bigger than a hospital. If you find the directive, we get ahead of it for once.
* [I'll get everything]
    Agent HaX: I know you will. Go.
    -> m2_revelation_end
* [We take the whole network down]
    Agent HaX: One page at a time. Starting tonight.
    -> m2_revelation_end

=== m2_revelation_end ===
#speaker:agent_0x99
Agent HaX: Finish up, then Sterling. And be careful -- reasonable as she sounds, she signed that invoice.
-> hub

=== on_exploit_catalog_found ===
#speaker:agent_0x99
Agent HaX: The catalogue. Every exploit they sell, with a price and a premium.
Agent HaX: The ProFTPD line names Ghost and St. Catherine's outright. That's the sale, in their own filing.
-> hub

=== on_architect_directive_found ===
#speaker:agent_0x99
Agent HaX: That drive from her desk. Run it through the laptop -- Base64, then ROT13 -- and tell me what it says.
Agent HaX: If it's what I think, it's the Architect talking. We take it to Command tonight.
-> hub

=== on_victoria_ko_card ===
#speaker:agent_0x99
#give_item:keycard:relayed_executive_keycard
Agent HaX: Well. That's one way to end a job interview.
Agent HaX: Her card's still on her lanyard, and I'm not having you rifle a CEO's pockets on camera. Nightshade has lifted its keys from the reader logs and built you a working copy.
Agent HaX: It's in your kit now. It opens what hers opens, which means the server room tonight.
+ [Understood]
        -> hub
