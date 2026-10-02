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
VAR lore_directive_found = false
VAR victoria_fate = ""
// Pass 4 (fix 8): set here when the player tells HaX what the decoded drive says.
// Gates nothing; the debrief says "you decoded it" only when it is true.
VAR directive_decoded = false
// Playtest round: synced globals so "Where do I stand?" reads the night as it is.
VAR guard_told_safetynet = false
VAR guard_bribed = false
VAR guard_challenged = false
VAR danny_fate = ""
VAR receptionist_ko = false
VAR reception_badge_cloned = false
VAR victoria_card_cloned = false
VAR draft_seen = false
VAR clone_call_done = false

// ---- Field-guide exposure flags (offered synced; given tracked locally) ----
VAR lockpicking_guide_offered = false
VAR netexploit_guide_offered = false
VAR lockpicking_guide_given = false
VAR netexploit_guide_given = false
VAR rfid_guide_given = false
VAR recon_guide_given = false
VAR cyberchef_guide_given = false
VAR proftpd_guide_given = false

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
{player_name()}. What do you need?
-> hub

=== hub ===
+ {night_confrontation_ready} [Sterling's still in the building. How do I play this?]
    -> hint_confrontation
+ {briefing_played and not rfid_guide_given} [Can you send me the RFID cloning guide?]
    -> request_rfid_guide
+ {lockpicking_guide_offered and not lockpicking_guide_given} [Can you send me the lockpicking guide?]
    -> request_lockpicking_guide
+ {netexploit_guide_offered and not recon_guide_given} [Can you send me the recon guide?]
    -> request_recon_guide
+ {netexploit_guide_offered and not netexploit_guide_given} [Can you send me the distcc guide?]
    -> request_netexploit_guide
+ {netexploit_guide_offered and not cyberchef_guide_given} [Can you send me the CyberChef guide?]
    -> request_cyberchef_guide
+ {netexploit_guide_offered and not proftpd_guide_given} [Can you send me the ProFTPD guide?]
    -> request_proftpd_guide
+ {(usb_seen or lore_directive_found) and not directive_decoded} [About the drive from her desk. I've decoded it.]
    -> directive_ask
+ [Where do I stand?]
    -> report_progress
+ [I'm stuck. Can you help?]
    -> provide_hint
+ [Nothing right now]
    Copy. Call anytime, {player_name()}.
    #exit_conversation
    -> DONE

=== hint_confrontation ===
#speaker:agent_0x99
~ hint_confrontation_given = true
{player_name()}. You've got the logs. The case stands whether or not she's in cuffs.
Want the Architect? Offer her a deal, and a cold one. She flips to save herself, not because she's sorry -- don't mistake the two.
Want her off the board? Arrest her. But she came ready to run, so corner her or she walks.
And if the evidence is enough for you, let her go and secure it. Your call. None of them are clean.
{ victoria_fate == "" and not (usb_seen or lore_directive_found):
    If it's the deal you want, bring her something she can't shrug off. The drive in her desk.
}
+ [Understood]
    -> hub

=== request_rfid_guide ===
#speaker:agent_0x99
~ rfid_guide_given = true
#set_variable:rfid_guide_requested:true
#give_item:lab-workstation:m03_rfid_field_guide
RFID cloning guide sent.
Read, crack, emulate. Reception's card is weak defaults -- a dictionary attack is near instant.
Sterling's is custom keys. Read it, then run Darkside. About half a minute.
+ [Received]
    -> hub

=== request_recon_guide ===
#speaker:agent_0x99
~ recon_guide_given = true
#set_variable:recon_guide_requested:true
#give_item:lab-workstation:m03_recon_field_guide
Reconnaissance guide sent.
Map before you touch anything. nmap the subnet, read the versions, then pick your target. The scan flag comes off a clean sweep.
+ [Got it]
    -> hub

=== request_proftpd_guide ===
#speaker:agent_0x99
~ proftpd_guide_given = true
#set_variable:proftpd_guide_requested:true
#give_item:lab-workstation:m03_proftpd_field_guide
ProFTPD guide sent. That's the backdoor that took St. Catherine's down.
Their FTP box runs the trojaned 1.3.3c build. Anonymous login gets you nothing that matters; the backdoor gets you root.
+ [Got it]
    -> hub

=== request_cyberchef_guide ===
#speaker:agent_0x99
~ cyberchef_guide_given = true
#set_variable:cyberchef_guide_requested:true
#give_item:lab-workstation:m03_cyberchef_field_guide
CyberChef guide sent.
ROT13, Base64, hex. If a decode still looks scrambled, it's layered -- decode again. There's no key to find; encoding isn't encryption.
+ [Received]
    -> hub

=== request_lockpicking_guide ===
#speaker:agent_0x99
~ lockpicking_guide_given = true
#set_variable:lockpicking_guide_requested:true
#give_item:lab-workstation:m03_lockpicking_field_guide
Lockpicking guide sent.
Light tension, find the binding pin, set it, repeat.
And only once the guard's turned away. Pick in his sightline and you're made.
+ [Received]
    -> hub

=== request_netexploit_guide ===
#speaker:agent_0x99
~ netexploit_guide_given = true
#set_variable:netexploit_guide_requested:true
#give_item:lab-workstation:m03_netexploit_field_guide
distcc guide sent.
The legacy distcc daemon on 3632 runs jobs for anyone who asks -- CVE-2004-2687. Point the distcc_exec module at it and the operational logs are yours.
+ [Got it]
    -> hub

=== provide_hint ===
#speaker:agent_0x99
What's giving you trouble?
// Pass 4 (fix 16): every topic stays on offer, so a player can ask again.
+ [How do I clone these keycards?]
    -> hint_rfid
+ [How do I get past the locked doors?]
    -> hint_lockpicking
+ [How do I get into Sterling's computer?]
    -> hint_password
+ [How do I read what I've found?]
    -> hint_encoding
+ [Where do I start on their network?]
    -> hint_network
+ [Never mind.]
    -> hub

=== hint_rfid ===
#speaker:agent_0x99
~ hint_rfid_given = true
Two stages. Reception first -- lean in near her desk and the cloner reads her badge.
Weak defaults: read it, crack it, save it. That opens the conference door.
Then Sterling's executive card in the meeting. Custom keys -- read it, then Darkside, half a minute.
Best moment's at the whiteboard. Keep her talking.
+ [Read, crack, emulate. Got it.]
    That order every time. The server room won't open until you emulate her cracked card at the door.
    -> hub

=== hint_lockpicking ===
#speaker:agent_0x99
~ hint_lockpicking_given = true
You've got the pick kit from the start. Sterling's office and the cabinets are keyed -- approach a locked one and interact.
It takes time and it exposes you. Work the lock only when the guard's back is turned.
Get caught at it and that's a detection you don't get back.
+ [Understood]
    -> hub

=== hint_password ===
#speaker:agent_0x99
~ hint_password_given = true
People never change the default. That IT slip on her monitor tells you the format.
The founding year's on the plaque in reception. Put the two together.
The wall safe's a different code. She mails it to the night team from her office. Check what's sitting on her machine unsent.
+ [I'll look]
    -> hub

=== hint_encoding ===
#speaker:agent_0x99
~ hint_encoding_given = true
Take the CyberChef workstation in the server room. Paste anything that looks like nonsense.
ROT13 reads like scrambled English. Base64 is letters, numbers, plus and slash. Hex is pairs of 0-9 and A-F.
And if it's still scrambled after one pass, it's layered. Decode again. The drive in her desk is Base64 over ROT13 -- two passes.
+ [Thanks]
    -> hub

=== hint_network ===
#speaker:agent_0x99
~ hint_network_given = true
The VM terminal in the server room is the only way onto their training network. Scan it first, then work whatever the scan finds.
The FTP box is the ProFTPD backdoor from St. Catherine's. The web host has the price list.
distcc is the one that matters -- that's where the operational logs sit. Submit all four at the drop-site terminal.
+ [Got it]
    -> hub

=== report_progress ===
#speaker:agent_0x99
// Playtest round: reads the player's actual state instead of a fixed status.
{ not clone_call_done:
    { victoria_card_cloned:
        Sterling's card is saved. Walk out with the visitors and come back after dark.
        -> report_end
    }
    { reception_badge_cloned or receptionist_ko:
        You've got the staff badge. Conference room next: Sterling's card, at the whiteboard.
    - else:
        Day one still. Reception's badge first, then Sterling's card in the meeting.
    }
    -> report_end
}
{ night_confrontation_ready:
    { danny_fate == "":
        The case is made. If Danny Foster matters to you, see him before Sterling.
    - else:
        Network's stripped, the case is made, and Danny's dealt with. Sterling's your last move.
    }
    { victoria_fate == "" and not (usb_seen or lore_directive_found):
        And her desk drawer's still got that drive in it, if you want something to bargain with.
    }
    -> report_end
}
{ flag_scan_submitted and flag_ftp_submitted and flag_http_submitted:
    Recon, FTP and pricing are in. Just distcc left -- that's the logs, that's the case.
- else:
    { flag_scan_submitted or flag_ftp_submitted or flag_http_submitted or flag_distcc_submitted:
        Flags are coming in. Keep working the services; the distcc box finishes it.
    - else:
        Nothing in from their network yet. VM terminal's in the server room. Start with a scan.
    }
}
{ (usb_seen or lore_directive_found) and not directive_decoded:
    That drive's still unread. CyberChef workstation, two passes.
}
{ not (draft_seen or roster_seen or usb_seen):
    Sterling's office is still unread, if you want her paper as well as her servers.
}
{ guard_told_safetynet:
    The guard knows who you are. Assume Sterling does too.
- else:
    { guard_bribed:
        The guard's paid for his hour. Don't stretch it.
    - else:
        { guard_detection_count > 0:
            The guard's caught you at a lock. Only pick when he's turned away.
        - else:
            { guard_challenged:
                The guard's had a look at you. He'll be watching now.
            - else:
                The guard hasn't clocked you yet. Keep it that way.
            }
        }
    }
}
-> report_end

=== report_end ===
+ [Thanks.]
    Call if you need me.
    -> hub

=== on_victoria_computer_accessed ===
#speaker:agent_0x99
You're into her machine. Good.
Client roster, transaction records, anything to the Architect.
{ whiteboard_seen:
    And that board in the server room said she mails the night team from in there. Anything she hasn't sent yet is worth a look.
}
-> hub

=== m2_revelation_call ===
#speaker:agent_0x99
{player_name()}, I've got the distcc logs you just submitted.
There it is. The ProFTPD backdoor, line item on invoice ZDS-2024-0847. Twenty-five thousand, part of a package to Ghost.
Target line: St. Catherine's Regional. Sable's sign-off on the approval.
Ghost's logs named Zero Day. Now their own ledger says it back -- timestamped, Sable's approval on it. A case with a name.
-> m2_revelation_choices

// Pass 3c: choices live in text-free knots. When the phone reopens with changed
// globals, the engine re-navigates to the knot owning the current choices and
// replays its text (phone-chat-minigame.js restore), which duplicated this call
// in the history. A choices-only knot replays nothing.
=== m2_revelation_choices ===
* [Direct chain. Zero Day to Ghost to St. Catherine's. That stands up.]
    It does. ENTROPY procurement, in writing. Ironclad.
    -> m2_revelation_impact
* [They charged extra to hit a hospital. That's intent, on an invoice.]
    That's the line a jury remembers. Keep it.
    -> m2_revelation_impact
* [If they invoice one cell like this, they invoice all of them.]
    Which is the whole reason you're in there. Finish it.
    -> m2_revelation_impact

=== m2_revelation_impact ===
#speaker:agent_0x99
{ not (usb_seen or lore_directive_found):
    Pull the rest while you're standing in it. The catalogue, the roster, the drive in her desk.
    And {player_name()} -- the logs point at a Phase 2. Find the directive and we get ahead of it for once.
- else:
    { directive_decoded:
        And it lines up with the directive you read me. Phase 2 has a supplier, and now a ledger.
    - else:
        And the logs point at a Phase 2. That drive from her desk is the directive. Decode it and tell me.
    }
}
-> m2_revelation_impact_choices

=== m2_revelation_impact_choices ===
* [I'll get everything]
    -> m2_revelation_end
* [We take the whole network down]
    One page at a time. Starting tonight.
    -> m2_revelation_end

=== m2_revelation_end ===
#speaker:agent_0x99
// Pass 4 round 2: marks the end of the revelation call, so the all-flags message
// (erb, revelation_heard mappings) waits until the call has played out.
#set_global:revelation_heard:true
Finish up, then Sterling. And be careful -- reasonable as she sounds, she signed that invoice.
-> hub

=== on_exploit_catalog_found ===
#speaker:agent_0x99
The catalogue. Every exploit they sell, with a price and a premium.
The ProFTPD line names Ghost and St. Catherine's outright. That's the sale, in their own filing.
-> hub

=== on_architect_directive_found ===
#speaker:agent_0x99
That drive from her desk. Run it through the CyberChef workstation and tell me what it says.
If it's what I think, it's the Architect talking.
-> directive_answer_choices

// Pass 4 (fix 8): an ungated check on the two-layer decode. A wrong answer costs
// nothing; the right one sets directive_decoded. Choices live in a text-free knot
// so a phone reopen replays nothing (phone-chat rule, E13).
=== directive_ask ===
#speaker:agent_0x99
Go on. What does it say?
-> directive_answer_choices

=== directive_answer_choices ===
+ {not directive_decoded} [Substations first. Then hospital records, once the grid drops. Spring.]
    -> directive_wrong
+ {not directive_decoded} [Grid storage and substations first. Then hospitals, once they're running on generator. Winter.]
    -> directive_right
+ {not directive_decoded} [Grid storage first. Then water treatment, while hospitals run on generator. Before Christmas.]
    -> directive_wrong
+ [I haven't got it to read yet. I'll come back to you.]
    -> directive_later

=== directive_wrong ===
#speaker:agent_0x99
That's not what's on there. You're still a layer down. Run it again.
-> directive_answer_choices

=== directive_later ===
#speaker:agent_0x99
Base64 first, then whatever's under it. Call me when it reads.
-> hub

=== directive_right ===
#speaker:agent_0x99
~ directive_decoded = true
#set_global:directive_decoded:true
...That's the Architect. Zero Day supplies, Critical Mass executes, and St. Catherine's was the rehearsal.
Two layers, and you peeled both. We take it to Command tonight.
-> hub

=== on_victoria_ko_card ===
#speaker:agent_0x99
#give_item:keycard:relayed_executive_keycard
Well. That's one way to end a job interview.
If her card's come loose, leave it where it fell -- it's evidence.
Nightshade lifted its keys from the reader logs and built you a working copy.
It's in your kit now. It opens what hers opens, which means the server room tonight.
-> hub
