EXTERNAL player_name()

// No game-state EXTERNAL getters. The engine binds only player_name; any other
// EXTERNAL throws at runtime. Progress is read from globals synced from
// globalVariables (declared below), exactly as m02's handler does.

// ---- Progress globals (synced from globalVars) ----
VAR briefing_played = false
VAR night_confrontation_ready = false
VAR guard_detection_count = 0
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
// Pass 5 (P1-11/P1-12): extra synced globals the rebuilt hub gates on.
// (flag_distcc_submitted and guard_detection_count are declared above.)
VAR catalogue_seen = false
// Pass 5 (P2-7): set by a wrong answer to the directive check.
VAR directive_guessed = false
VAR exec_wing_entered = false
// Round 2 (P1-25..P1-28, P1-37): premises and retire conditions for the hints.
VAR clone_read_dropped = false
VAR sterling_on_call_seen = false
VAR guard_knocked_out = false
VAR guard_attacking = false
// Pass 5 (P3-7): a day KO of Sterling changes the recap.
VAR victoria_ko = false
// Pass 5 (P3-19): synced, so the hub can re-offer calls whose text the player missed.
VAR revelation_heard = false
VAR pc_call_done = false
// Local: the catalogue and PC calls have been heard.
VAR catalogue_call_heard = false
VAR pc_call_heard = false
VAR exec_office_entered = false

// ---- Field-guide exposure flags (offered synced; given tracked locally) ----
VAR lockpicking_guide_offered = false
VAR netexploit_guide_offered = false
VAR cyberchef_guide_offered = false
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
// Pass 5 (P1-12): one gated hint per stuck point, retired when spent.
VAR hint_sterling_night_given = false
VAR hint_danny_given = false
VAR hint_guard_given = false
VAR hint_safe_given = false
VAR hint_clone_given = false
VAR hint_guard_hostile_given = false

// Root divert. When a conversation has ended (-> DONE), the engine restores only
// its variables on the next talk and continues from the root (npc-conversation-
// state.js restoreNPCState). Without this line the root is empty and the player
// sees "(End of conversation)" instead of the start knot's re-entry routing.
-> start

=== start ===
#speaker:agent_0x99
{player_name()}. What do you need?
-> hub

// Pass 5 (P1-11): m02's progress-gated hub. Topics appear only when they're
// relevant, sit newest-and-most-urgent first, and retire through their own
// "not ..._given" guards. Guides collapse into one "field guides" choice. The
// two fixed choices ("Where do I stand?", exit) sit last, so the hub is never
// empty and a stuck player always has the contextual progress read to fall back on.
=== hub ===
// Pass 5 (P3-19): the four calls now arrive as texts the player clicks; a missed or
// dismissed text would lose the call for good, so the hub offers it again (m02 pattern).
+ {flag_distcc_submitted and not revelation_heard} [You wanted to talk about the distcc logs.]
    -> m2_revelation_call
+ {catalogue_seen and not catalogue_call_heard} [About that catalogue from the safe.]
    -> on_exploit_catalog_found
+ {pc_call_done and not pc_call_heard} [I'm on Sterling's machine. What am I looking for?]
    -> on_victoria_computer_accessed
+ {night_confrontation_ready and victoria_fate == "" and not hint_confrontation_given} [Sterling's still in the building. How do I play this?]
    -> hint_confrontation
+ {(usb_seen or lore_directive_found) and not directive_decoded} [About the drive from her desk. I've decoded it.]
    -> directive_ask
+ {sterling_on_call_seen and not night_confrontation_ready and not hint_sterling_night_given} [Sterling's here tonight but she won't engage. What now?]
    -> hint_sterling_night
+ {clone_call_done and not night_confrontation_ready and danny_fate == "" and not hint_danny_given} [Is there anyone else in the building tonight?]
    -> hint_danny
+ {guard_attacking and not guard_knocked_out and not hint_guard_hostile_given} [The guard's coming for me. What do I do?]
    -> hint_guard_hostile
+ {(guard_detection_count > 0 or guard_challenged) and not guard_attacking and not guard_knocked_out and not guard_told_safetynet and not guard_bribed and not hint_guard_given} [The guard keeps catching me. How do I get past him?]
    -> hint_guard
+ {clone_call_done and whiteboard_seen and not catalogue_seen and not hint_safe_given} [I can't get the server room wall safe open.]
    -> hint_safe
+ {clone_read_dropped and not victoria_card_cloned and not clone_call_done and not hint_clone_given} [I can't get a clean read on Sterling's card. She keeps stepping away.]
    -> hint_clone
+ {(briefing_played and not rfid_guide_given) or (cyberchef_guide_offered and not cyberchef_guide_given) or (netexploit_guide_offered and not recon_guide_given) or (flag_scan_submitted and not netexploit_guide_given) or (flag_scan_submitted and not proftpd_guide_given) or (lockpicking_guide_offered and not lockpicking_guide_given)} [Send me a field guide.]
    -> field_guides
+ {briefing_played and not victoria_card_cloned and not clone_call_done and not hint_rfid_given} [How do I clone these keycards?]
    -> hint_rfid
+ {exec_wing_entered and not exec_office_entered and not hint_lockpicking_given} [How do I get past the locked doors?]
    -> hint_lockpicking
+ {exec_office_entered and not (draft_seen or roster_seen) and not hint_password_given} [How do I get into Sterling's computer?]
    -> hint_password
+ {(cyberchef_guide_offered or netexploit_guide_offered) and not directive_decoded and not hint_encoding_given} [How do I read what I've found?]
    -> hint_encoding
+ {netexploit_guide_offered and not flag_distcc_submitted and not hint_network_given} [Where do I start on their network?]
    -> hint_network
+ [Where do I stand?]
    -> report_progress
+ [Nothing right now]
    Copy. Call anytime, {player_name()}.
    #exit_conversation
    -> DONE

// Choices-only: the guides on offer and not yet sent (m02 field_guides pattern).
=== field_guides ===
+ {briefing_played and not rfid_guide_given} [The RFID cloning guide.]
    -> request_rfid_guide
+ {cyberchef_guide_offered and not cyberchef_guide_given} [The CyberChef guide.]
    -> request_cyberchef_guide
+ {netexploit_guide_offered and not recon_guide_given} [The recon and network mapping guide.]
    -> request_recon_guide
+ {flag_scan_submitted and not proftpd_guide_given} [The ProFTPD exploitation guide.]
    -> request_proftpd_guide
+ {flag_scan_submitted and not netexploit_guide_given} [The distcc exploitation guide.]
    -> request_netexploit_guide
+ {lockpicking_guide_offered and not lockpicking_guide_given} [The lockpicking guide.]
    -> request_lockpicking_guide
+ [Not now.]
    -> hub

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
#set_global:cloner_explained:true
#give_item:lab-workstation:m03_rfid_field_guide
RFID cloning guide sent.
Read, crack, emulate. Reception's card is weak defaults -- a dictionary attack is near instant.
Sterling's is custom keys. Read it, then run Darkside. About half a minute.
+ [Received]
    -> hub

=== request_recon_guide ===
#speaker:agent_0x99
~ recon_guide_given = true
#give_item:lab-workstation:m03_recon_field_guide
Reconnaissance guide sent.
Map before you touch anything. nmap the subnet and read the versions. The scan flag's in what the services say when you connect.
+ [Got it]
    -> hub

=== request_proftpd_guide ===
#speaker:agent_0x99
~ proftpd_guide_given = true
#give_item:lab-workstation:m03_proftpd_field_guide
ProFTPD guide sent. That's the backdoor that took St. Catherine's down.
Their FTP box runs the trojaned 1.3.3c build. Anonymous login gets you nothing that matters; the backdoor gets you root.
+ [Got it]
    -> hub

=== request_cyberchef_guide ===
#speaker:agent_0x99
~ cyberchef_guide_given = true
#give_item:lab-workstation:m03_cyberchef_field_guide
CyberChef guide sent.
ROT13, Base64, hex. If a decode still looks scrambled, it's layered -- decode again. There's no key to find; encoding isn't encryption.
+ [Received]
    -> hub

=== request_lockpicking_guide ===
#speaker:agent_0x99
~ lockpicking_guide_given = true
#give_item:lab-workstation:m03_lockpicking_field_guide
Lockpicking guide sent.
Light tension, find the binding pin, set it, repeat.
And only once the guard's turned away. Pick in his sightline and you're made.
+ [Received]
    -> hub

=== request_netexploit_guide ===
#speaker:agent_0x99
~ netexploit_guide_given = true
#give_item:lab-workstation:m03_netexploit_field_guide
distcc guide sent.
The legacy distcc daemon on 3632 runs jobs for anyone who asks -- CVE-2004-2687. Point the distcc_exec module at it and the operational logs are yours.
+ [Got it]
    -> hub

// Pass 5 (P1-12): one gated hint per stuck point, offered in the hub only when
// the player is actually at that point, and retired once given.

=== hint_sterling_night ===
#speaker:agent_0x99
~ hint_sterling_night_given = true
She's on a call, back to the door, and she won't deal with you until you put something in front of her.
Finish the network first: recon, the services, the distcc box. Once the case is made she'll turn round.
+ [Understood]
    -> hub

=== hint_danny ===
#speaker:agent_0x99
~ hint_danny_given = true
One. Danny Foster, a consultant, in the south office off the executive wing. He drew the recon that made the hospital job possible.
Whether he answers for that or gets a way out is partly your call. See him before you settle with Sterling.
+ [Got it]
    -> hub

=== hint_guard ===
#speaker:agent_0x99
~ hint_guard_given = true
Never work a lock in his sightline. Watch his loop, wait for his back to turn, then pick.
If he's already looking, break off. Step out to the main hallway or into Danny's office until he's moved on.
{ clone_call_done:
    You can talk your way past him, or pay him, but then he knows your face. Clean is better.
}
+ [Understood]
    -> hub

=== hint_guard_hostile ===
#speaker:agent_0x99
~ hint_guard_hostile_given = true
He's hostile now. Keep moving and stay out of his reach, or stand and fight.
He goes down if you fight him, but it goes on the record and it ends any claim to a quiet night.
+ [Understood]
    -> hub

=== hint_safe ===
#speaker:agent_0x99
~ hint_safe_given = true
The code isn't on the board. The board says Sable re-coded the safe and mailed the night team the new one.
So it's on her office machine, an unsent message saved as raw source. Decode it at the CyberChef workstation for the four digits.
+ [I'll look]
    -> hub

=== hint_clone ===
#speaker:agent_0x99
~ hint_clone_given = true
Her card's custom keys. It takes about half a minute to read, and she steps away when she's wary.
Stand at the whiteboard, keep her talking about the lab, and don't ask the question that makes her suspicious.
If the read drops, walk the suspicion back first, then drift to the board again.
+ [Got it]
    -> hub

=== hint_rfid ===
#speaker:agent_0x99
~ hint_rfid_given = true
// Pass 5 (P2-16): asking HaX opens the receptionist's clone choice.
#set_global:cloner_explained:true
Two stages. Reception first. Talk to her and lean in by her lanyard, and the cloner reads her badge.
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
{whiteboard_seen or clone_call_done:
    The wall safe's a different code. She mails it to the night team from her office. Check what's sitting on her machine unsent.
}
+ [I'll look]
    -> hub

=== hint_encoding ===
#speaker:agent_0x99
~ hint_encoding_given = true
Take the CyberChef workstation in the server room. Paste anything that looks like nonsense.
ROT13 reads like scrambled English. Base64 is letters, numbers, plus and slash. Hex is pairs of 0-9 and A-F.
And if it's still scrambled after one pass, it's layered. Decode again.
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
    { victoria_ko:
        Nightshade's copy of her card is in your kit. Walk out and come back after dark.
        -> report_end
    }
    { reception_badge_cloned or receptionist_ko:
        You've got the staff badge. Conference room next: Sterling's card, at the whiteboard.
    - else:
        Day one still. Get through the conference reader to reach Sterling. Stuck on the reader? Ask me how to clone a card.
    }
    -> report_end
}
{ night_confrontation_ready:
    { danny_fate == "":
        The case is made. If Danny Foster matters to you, see him before Sterling.
    - else:
        Network's stripped, the case is made, and Danny's dealt with. Sterling's your last move.
    }
    { victoria_ko:
        Sterling's still in the conference room where you left her. Go and settle it.
    - else:
        Sterling's in the conference room.
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
    That drive's still unread. The CyberChef workstation's in the server room.
}
{ not (draft_seen or roster_seen or usb_seen):
    Sterling's office is still unread, if you want her paper as well as her servers.
}
{ guard_knocked_out:
    The guard's out cold. The wing's yours, but it's on the record.
    -> report_end
}
{ guard_attacking:
    The guard's after you. Keep out of his reach.
    -> report_end
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
// Pass 5 (P3-27): a lingering toast clicked after a hub replay goes straight to the hub.
{ pc_call_heard:
    -> hub
}
~ pc_call_heard = true
You're into her machine. Good.
Client roster, transaction records, anything to the Architect.
{ whiteboard_seen:
    If that board in the server room says what I think, she mails the night team from in there.
    Anything she hasn't sent yet is worth a look.
}
-> hub

=== m2_revelation_call ===
#speaker:agent_0x99
{ revelation_heard:
    -> hub
}
{player_name()}, I've got the distcc logs you just submitted.
There it is. The ProFTPD backdoor, line item on invoice ZDS-2024-0847. Twenty-five thousand, part of a package to Ghost.
Target line: St. Catherine's Regional. Sable's sign-off on the approval.
St. Catherine's gave us the buyer's invoice. This is the seller's own ledger, saying the same thing. A case with a name.
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
~ revelation_heard = true
Finish up, then Sterling. And be careful -- reasonable as she sounds, she signed that invoice.
-> hub

=== on_exploit_catalog_found ===
#speaker:agent_0x99
{ catalogue_call_heard:
    -> hub
}
~ catalogue_call_heard = true
The internal catalogue. Not the price list off their web host: this one has the buyers.
The ProFTPD sale names Ghost and St. Catherine's outright. And there's stock held back for Critical Mass. Phase 2 has a shopping list.
-> hub

=== on_architect_directive_found ===
#speaker:agent_0x99
That drive from her desk. Run it through the CyberChef workstation in the server room{not clone_call_done: tonight} and tell me what it says.
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
// Pass 5 (P2-7): a wrong answer marks the decode as a guess. The loop stays, so
// the optional task can still complete; the credit and debrief line don't.
~ directive_guessed = true
#set_global:directive_guessed:true
That's not what's on there. I'm logging that one as a guess. Run it again.
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
{ directive_guessed:
    That's it, after a couple of goes. We take it to Command tonight.
- else:
    Two layers, and you peeled both. We take it to Command tonight.
}
-> hub

=== on_victoria_ko_card ===
#speaker:agent_0x99
#give_item:keycard:relayed_executive_keycard
Well. That's one way to end a job interview.
If her card's come loose, leave it where it fell -- it's evidence.
Nightshade lifted its keys from the reader logs and built you a working copy.
It's in your kit now. It opens what hers opens, which means the server room tonight.
-> hub
