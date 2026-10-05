// ===========================================
// PHONE NPC: Agent HaX (Handler Support)
// Mission 2: Ransomed Trust
// Break Escape - Remote Support, Tutorial Guide, Moral Sounding Board
// ===========================================

// ---- Local hint tracking (never synced to globalVars) ----
VAR hint_start_given = false
VAR hint_lockpick_given = false
VAR hint_password_given = false
VAR hint_vm_given = false
VAR hint_encoding_given = false
VAR hint_pin_given = false
VAR hint_ransom_given = false
VAR lockpicking_guide_hint_given = false
VAR ssh_guide_hint_given = false
VAR privesc_guide_hint_given = false
VAR scanning_guide_hint_given = false
VAR vulnerability_guide_hint_given = false
VAR exploitation_guide_hint_given = false
VAR scanning_exploitation_guide_hint_given = false
VAR infoleak_note_hint_given = false
VAR cyberchef_guide_hint_given = false
VAR ghost_reaction_discussed = false
VAR ghost_deal_discussed = false
VAR board_email_discussed = false
VAR ideology_discussed = false
VAR first_contact = true

// ---- Mission state vars (synced from globalVars by engine at call-open) ----
VAR dr_kim_met = false
VAR flag_ssh_submitted = false
VAR flag_proftpd_submitted = false
VAR flag_database_submitted = false
VAR flag_ghost_log_submitted = false
VAR offline_keys_recovered = false
VAR restore_manifest_obtained = false
VAR ghost_key_material_obtained = false
VAR lockpicking_guide_offered = false
VAR ssh_guide_offered = false
VAR privesc_guide_offered = false
VAR scanning_guide_offered = false
VAR vulnerability_guide_offered = false
VAR exploitation_guide_offered = false
VAR scanning_exploitation_guide_offered = false
VAR infoleak_note_offered = false
VAR board_coverup_email_found = false
VAR ransom_decision_made = false
VAR ghost_deal_accepted = false
VAR ghost_contacted_player = false
VAR mission_complete = false
VAR cover_burned = false
VAR cover_restored = false
VAR bernie_trusts_player = false
VAR staff_lanyard_obtained = false
VAR insider_identified = false
VAR insider_evidence_partial = false
VAR insider_badge_id_found = false
VAR reached_security_office = false
VAR ghost_offer_made = false
VAR cyberchef_guide_offered = false
VAR inspected_asset_post = false
VAR slow_path_window_open = false
VAR bed4_manually_stabilised = false
VAR patient_bed4_deceased = false
VAR val_opened_office = false
VAR ghost_keys_used = false
// Playtest loop round 1 (A10): what the player has read, for the naming reasons and nudges.
VAR read_handover_board = false
VAR read_night_rota = false
VAR reeves_known = false
// Round 2 (BS1/CF-G): the server-room card is in hand.
VAR keycard_held = false
// Round 3 (struggle M4)
VAR attacked_guard = false
VAR guard_knocked_out = false
VAR found_boardroom_code = false

// Local
VAR cover_advice_given = false
VAR named_suspect = ""
VAR insider_advice_given = false
VAR doors_asks = 0
VAR doors_tier = 0

EXTERNAL player_name()

// ===========================================
// ENTRY POINT
// ===========================================

=== start ===
{first_contact:
    ~ first_contact = false
    -> first_call
}
-> support_hub

=== first_call ===
#speaker:agent_0x99

{player_name()}. You're in. Good.

Forty-seven on generators, twelve hours of fuel, and a board vote in four.

Front desk first. Get into their paper log, because the electronic one no longer exists.
Then Dr. Kim. Past the ward, up through the handover room. She called us in.
-> first_call_choices

// Playtest round: the opening menu rests in its own choices-only knot. After a reload
// (or once the player is past the front desk) it hands straight over to the hub.
=== first_call_choices ===
{dr_kim_met or cover_burned or flag_ssh_submitted:
    -> support_hub
}
+ [Understood.]
    Copy. Call when you need me.
    -> support_hub

+ [What should I know going in?]
    One thing above all. Nobody in that building can grant you access to anything.
    Their access control server is encrypted with the rest of it. Kim can authorise you until she's hoarse and no reader will care.
    Every door in there is a person, a mechanical key, or your picks. Assume a badge saves you and you'll waste an hour.
    -> support_hub

+ [Anything I should be careful of?]
    The failure in there will make you angry. Gary Whitlock warned them seven times and got told to stop escalating. Feel it later.
    And be careful who you're rude to. You'll need one of them to vouch for you tonight, and you won't know which until too late.
    -> support_hub

// ===========================================
// SUPPORT HUB  --  gated by mission state
// Options only appear when they're relevant
// ===========================================

=== support_hub ===
#speaker:agent_0x99

// Round 3 (pass 4 crowded-hub): m01's pattern. Topics that arrive later in the
// mission sit first, so the newest and most relevant choices are at the top; spent
// topics retire through their "not ..._given/_discussed" guards; the two fixed
// choices ("Remind me where we are", exit) sit last. Bed 4 stays on top because its
// window is timed and a patient's breathing depends on it. Follow-ups that go stale
// sit in choices-only knots that re-check their own state (PASS3 phone rule).

+ {slow_path_window_open and not bed4_manually_stabilised and not patient_bed4_deceased} [Bed 4. What do I do?]
    -> bed4_help

+ {ransom_decision_made and not mission_complete} [I've made the recovery decision  --  what's left?]
    -> hint_press_terminal

+ {ghost_deal_accepted and ransom_decision_made and not ghost_deal_discussed} [I took Ghost's deal  --  free keys for publishing the evidence]
    -> ghost_deal_reaction

+ {restore_manifest_obtained and not ransom_decision_made and not hint_ransom_given} [Can you help me think through the ransom decision?]
    -> hint_ransom_decision

+ {ghost_deal_accepted and not ransom_decision_made} [I have Ghost's decryption keys  --  does that change things?]
    -> ghost_deal_recovery_advice

+ {cover_burned and insider_badge_id_found and not insider_identified} [I know whose badge SC-4471 is.]
    -> name_the_badge

+ {flag_ghost_log_submitted and not ideology_discussed} [ENTROPY's ideology  --  how do we fight true believers?]
    -> discuss_ideology

+ {flag_database_submitted and not offline_keys_recovered and not hint_pin_given} [I need the offline backup keys]
    -> hint_pin_safe

+ {board_coverup_email_found and not board_email_discussed} [I found the board's cover-up email]
    -> board_email_reaction

+ {flag_ssh_submitted and not flag_proftpd_submitted and not hint_vm_given} [I need help with the ProFTPD exploitation.]
    -> hint_vm

+ {flag_ssh_submitted and not hint_encoding_given} [I need help with encoding and decoding.]
    -> hint_encoding

+ {cover_burned and not cover_restored and not reached_security_office and not cover_advice_given} [My booking's been pulled. What are my options?]
    -> cover_burned_advice

+ {cover_burned and not insider_advice_given} [Who pulls a consultant's booking in the middle of a ransomware incident?]
    -> cover_burned_who

+ {ghost_contacted_player and not ghost_reaction_discussed} [Ghost just reached out to me]
    -> ghost_contact_reaction

+ {(lockpicking_guide_offered and not lockpicking_guide_hint_given) or (scanning_guide_offered and not scanning_guide_hint_given) or (ssh_guide_offered and not ssh_guide_hint_given) or (vulnerability_guide_offered and not vulnerability_guide_hint_given) or (scanning_exploitation_guide_offered and not scanning_exploitation_guide_hint_given) or (exploitation_guide_offered and not exploitation_guide_hint_given) or (privesc_guide_offered and not privesc_guide_hint_given) or (cyberchef_guide_offered and not cyberchef_guide_hint_given) or (infoleak_note_offered and not infoleak_note_hint_given)} [Send me a field guide.]
    -> field_guides

+ {dr_kim_met and not flag_ssh_submitted and not hint_lockpick_given} [Any tips for getting into the server room?]
    -> hint_lockpick

+ {dr_kim_met and not flag_ssh_submitted and not hint_password_given} [How do I get Gary to cooperate?]
    -> hint_password

+ {not dr_kim_met and not hint_start_given and not cover_burned and not flag_ssh_submitted} [Where do I start?]
    -> hint_start

+ [Remind me where we are.]
    -> general_advice

+ [I'm good for now]
    Copy that. Call anytime, {player_name()}.
    #exit_conversation
    -> DONE

// Choices-only: the guides on offer and not yet sent.
=== field_guides ===
+ {lockpicking_guide_offered and not lockpicking_guide_hint_given} [The lockpicking guide.]
    -> request_lockpicking_guide
+ {scanning_guide_offered and not scanning_guide_hint_given} [The recon and network mapping guide.]
    -> request_scanning_guide
+ {ssh_guide_offered and not ssh_guide_hint_given} [The SSH access guide.]
    -> request_ssh_guide
+ {scanning_exploitation_guide_offered and not scanning_exploitation_guide_hint_given} [The scanning-to-exploitation guide.]
    -> request_scanning_exploitation_guide
+ {vulnerability_guide_offered and not vulnerability_guide_hint_given} [The vulnerability analysis guide.]
    -> request_vulnerability_guide
+ {exploitation_guide_offered and not exploitation_guide_hint_given} [The ProFTPD exploitation guide.]
    -> request_exploitation_guide
+ {privesc_guide_offered and not privesc_guide_hint_given} [The privilege escalation guide.]
    -> request_privesc_guide
+ {cyberchef_guide_offered and not cyberchef_guide_hint_given} [The CyberChef guide.]
    -> request_cyberchef_guide
+ {infoleak_note_offered and not infoleak_note_hint_given} [The note on the PIN oracle.]
    -> request_infoleak_note
+ [Not now.]
    -> support_hub

=== bed4_help ===
#speaker:agent_0x99
Patient ward, Bed 4, Mr Pryce. His ventilator's out of sync and nothing carries the alarm to the desk.
There's a hand bag clipped to the bed frame. Come at him from the side or the foot.
Breathe for him until a nurse can take over.
Nurse Raval will be heading to him too. If she's there first, take the bag from her. Go now.
-> support_hub

// ===========================================
// COVER BURN SUPPORT
// The handler does not solve it for the player -- she lays out the routes
// and lets them choose which relationship to spend.
// ===========================================

=== cover_burned_advice ===
#speaker:agent_0x99
~ cover_advice_given = true

Right. This is recoverable.

You haven't lost access. You never had any. You've lost the benefit of the doubt.
Everything you've opened tonight, you opened because somebody chose to believe you.

So go and get that back from somebody who has a reason to give it.
-> cover_burned_advice_choices

=== cover_burned_advice_choices ===
{cover_restored or reached_security_office:
    -> support_hub
}
+ [Give me the options.]
    Val Okonkwo on the main corridor has the only key to her office, and her office is the only way to the server room.
    So it comes down to her.
    Show her a real hospital lanyard.
    Gary has blank contractor passes, the ward keeps agency ones, and there was a spare in the handover room.
    Or get Bernie on reception to log a correction under her own staff number.
    That beats an anonymous phone call, because control have actually met her.
    Or give Val a reason. She is not an idiot, and she has her own suspicions about somebody in that building.
    Or pick her door while her back is turned. If she catches you at it, you will have made her point for her.
    -> support_hub

+ [And if none of them will help me?]
    Then you watch her beat, and you pick that door the moment she walks away from it.
    It costs you the one person on that corridor who might have backed you.
    {staff_lanyard_obtained: You already have a pass, though. Use it.|I would start with IT. Gary has every reason to want you in that server room.}
    -> support_hub

+ [Understood. I'll sort it.]
    Good. Quickly, please.
    -> support_hub

=== cover_burned_who ===
#speaker:agent_0x99
~ insider_advice_given = true

Somebody who knew exactly which lever to pull.

Think what that call required. Knowing you existed. Knowing your booking was informal. Knowing the access system was down so nobody could check.
And knowing security would challenge rather than assume.

If Ghost wanted you stopped, Ghost had cleaner ways.
This is somebody standing in the building with a telephone and a working knowledge of the procedures.

{insider_evidence_partial:
    And you've already found that an ENTROPY affiliate is embedded in that staff. Stop treating those as two problems. They're one.
- else:
    Which means when Ghost tells you they had help inside -- and they will -- take it seriously.
}

+ [So I'm looking for staff, not an intruder.]
    You're looking for somebody with standing. Someone the night staff wave through without asking.
    Whoever burned you did it because you were about to reach something. Work out what, and you will have worked out who.
    -> support_hub

+ [Noted. I'll keep pulling.]
    -> support_hub

// ===========================================
// GHOST REACTIONS
// ===========================================

=== ghost_contact_reaction ===
#speaker:agent_0x99
~ ghost_reaction_discussed = true

Ghost's watching the network. They've been on it since before you arrived.

They know which rooms you've opened, and they can cut your line to me for a few seconds.

That's pressure, nothing more. They can't stop you from there.

+ [Ghost seems to think they're justified]
    They do. ENTROPY cells are ideological -- they've convinced themselves that calculated harm is acceptable if it changes the system.
    Ghost's right about St. Catherine's. Ghost also costed the dead first.
    Their logic is their problem. Your job is those 47 patients.
    -> support_hub

+ [Ghost cut my SAFETYNET connection briefly]
    Noted. Network-level access. We knew they had it.
    Don't rely on me for anything time-critical from here on. What you're doing has to be done in the field.
    -> support_hub

+ [Understood. Staying focused.]
    -> support_hub

=== ghost_deal_reaction ===
#speaker:agent_0x99
~ ghost_deal_discussed = true

You made a deal with Ghost.

Free decryption keys. No ransom payment. Faster recovery, ENTROPY denied the money.

In exchange: you publish the board's negligence from the press terminal.

#speaker:narrator
Narrator: A pause.

#speaker:agent_0x99
Ghost gets exactly what they wanted without spending £150,000.

You're still the one making the final choice at that terminal. Ghost's deal doesn't override your judgement.

+ [Is it wrong to have taken it?]
    I don't know. You took a terrorist's keys to save lives, and kept the money off them.
    The ethics depend entirely on what you do at the press terminal. Don't let Ghost own that decision.
    -> support_hub

+ [I'm going to honour it]
    Then publish everything. Make it count.
    -> support_hub

+ [I might not honour it]
    That's your call. Ghost will notice the breach. So will I.
    -> support_hub

=== board_email_reaction ===
#speaker:agent_0x99
~ board_email_discussed = true

The board was going to sack Gary and bury his warnings before anyone asked questions.

That's a deliberate cover-up of what created this crisis.

That email will matter at the press terminal.

+ [This changes how I see the exposure decision]
    It should. Publishing just the budget decisions is one thing. Publishing the cover-up is another.
    The hospital made two distinct failures. You'll decide which gets the full public record.
    -> support_hub

+ [Gary had no idea the board was planning this]
    Probably not. He warned them in good faith.
    If you want his vindication to be public, the press terminal is the mechanism.
    -> support_hub

+ [Noted]
    -> support_hub

// ===========================================
// CONTEXTUAL HINTS
// ===========================================

=== hint_start ===
#speaker:agent_0x99
~ hint_start_given = true

Front desk, then through the ward to the offices.

The night coordinator on reception has every mechanical override key on a hook behind her. Estates dumped them on her this morning.
That includes IT. The first lock tonight is a person.

Then Dr. Kim, the CTO. She called us in and she is out of options, which makes her useful and slightly unpredictable.

+ [What about Gary Whitlock?]
    IT administrator. Off the night handover room, behind that override lock.
    He warned them about this exact weakness seven times and got told to stop escalating.
    He's furious, and he holds the only working credential in the building.
    Desk first, Kim second, Gary third. The order buys you goodwill you will want later.
    -> support_hub

+ [Understood]
    -> support_hub

=== hint_lockpick ===
#speaker:agent_0x99
~ hint_lockpick_given = true

The server room is the one door in that hospital where picks and charm are both useless.

RFID, on a standalone offline controller. That's why it still works.
It only takes a card that already exists, and no new card can be issued, because the machine that issues them is encrypted.

Gary has one. That's the entire route.
Get it from him, or take it off him. There's no other way past that reader.

+ [And the IT department door itself?]
    Standard pin tumbler on a mechanical override. Reception has the key, and your picks will do it if she won't.
    The security office is the same kind of lock, and Val Okonkwo walks the corridor in front of it.
    Pick that one with her watching and you will be explaining yourself.
    -> support_hub

+ [What if Gary won't play?]
    Then give him a reason. He has a locked filing cabinet in there full of the warnings nobody read.
    Put one of those in front of him and you stop being another person who wants something from him.
    -> support_hub

+ [Got it]
    -> support_hub

=== hint_password ===
#speaker:agent_0x99
~ hint_password_given = true

Gary has spent six months being treated as an overhead. Don't be the fifth person tonight to walk in and treat him as one.

He does not want sympathy, he wants somebody to acknowledge he was right in writing. Give him that and he'll open every drawer he owns.

And whatever you do, don't ask how he let this happen. He'll hand you the card and be no further use.

+ [What am I actually after from him?]
    The server room card, and the credentials on the backup box. Shared admin login, never rotated -- Emma2018, Hospital1987, StCatherines.
    He'll tell you if he trusts you. If not, it's on a sticky note on his monitor, which tells you everything about that department.
    -> support_hub

+ [Understood]
    -> support_hub

=== hint_vm ===
#speaker:agent_0x99
~ hint_vm_given = true

The ProFTPD 1.3.3c backdoor. Remote code execution via a backdoor planted in the source code itself.

A clean release shipped days later, back in 2010. St. Catherine's is still running the poisoned build. Your target.

The exploit gets you root on the backup server. Ghost's deployment log is in there.

+ [What's the full exploit chain?]
    Four flags. Gary's login gets the first. The backdoor gets root and the second.
    Anonymous FTP holds the other two: a server notice, and Ghost's encoded log. Decode that one.
    Each flag goes in at the drop-site terminal.
    -> support_hub

+ [Got it]
    -> support_hub

=== request_lockpicking_guide ===
#speaker:agent_0x99
~ lockpicking_guide_hint_given = true
#give_item:lab-workstation:m02_lockpicking_field_guide

Lockpicking guide uploaded to your terminal.

Light tension, find the binding pin, set it, repeat. Read the lock by feel -- don't force it.

+ [Received]
    Quiet and patient gets you through any of those doors. Go.
    -> support_hub

=== request_cyberchef_guide ===
#speaker:agent_0x99
~ cyberchef_guide_hint_given = true
#give_item:lab-workstation:m02_cyberchef_field_guide

CyberChef guide's on your terminal.

Look at the shape before you reach for a tool. Letters swapped but word lengths kept is a rotation.
A long run of letters, digits and the odd equals sign at the end is Base64. Pairs of 0-9 and a-f are hex.

+ [Received]
    And remember it's encoding, not encryption. Anybody can undo it. That's the point of finding it.
    -> support_hub

// ===========================================
// NAMING THE BADGE (pass 4)
// The player makes the deduction; HaX only pushes back on a wrong name. Choices
// sit in their own knot so a phone re-navigation replays no text, and it re-checks
// insider_identified because the player can also name him to his face.
// ===========================================

=== name_the_badge ===
#speaker:agent_0x99
{insider_identified:
    -> support_hub
}
Go on. Whose is it?
-> name_the_badge_choices

// Round 2/3 (re-review M1): plain names, the right one not first, and every name
// goes through the same reason step, so picking a name gives nothing away. Wrong
// names and wrong reasons get pushback and cost nothing. named_suspect is local.
=== name_the_badge_choices ===
{insider_identified:
    -> support_hub
}
+ [Val Okonkwo.]
    ~ named_suspect = "val"
    -> badge_reason
+ [Gary Whitlock.]
    ~ named_suspect = "gary"
    -> badge_reason
+ [Dr Kim.]
    ~ named_suspect = "kim"
    -> badge_reason
// Round 1 (D7): only once the player has met or heard of him.
+ {reeves_known} [Graham Reeves.]
    ~ named_suspect = "reeves"
    -> badge_reason
+ [I'm not sure yet.]
    -> doors_nudge ->
    -> support_hub

=== badge_reason ===
#speaker:agent_0x99
{insider_identified:
    -> support_hub
}
{named_suspect == "val":Val|}{named_suspect == "gary":Gary|}{named_suspect == "reeves":Reeves|}{named_suspect == "kim":Kim|}. Show me how you got there.
-> badge_reason_choices

=== badge_reason_choices ===
{insider_identified:
    -> support_hub
}
+ [They're on nobody's rota.]
    {named_suspect == "reeves":
        That makes him odd. It doesn't make him SC-4471. What ties the badge to him?
    - else:
        That's not evidence either way. What ties the badge to anyone?
    }
    -> badge_reason_choices
+ [They had the access and the motive.]
    So did half the building tonight. What ties that badge to one person?
    -> badge_reason_choices
+ {read_handover_board} [The drill ran on a security override, and they're security.]
    {named_suspect == "val" or named_suspect == "reeves":
        Two people in that building call themselves security tonight. Which one carries 4471?
    - else:
        They aren't security. Try again.
    }
    -> name_the_badge_choices
+ {read_night_rota and named_suspect == "val"} [Her rota number isn't 4471.]
    Then you've just cleared her. Who's left?
    -> name_the_badge_choices
+ {inspected_asset_post} [Ghost's badge is the badge on the boardroom post log.]
    {named_suspect == "reeves":
        -> badge_named_reeves
    }
    That's the boardroom post. Is it theirs? Who stands it?
    -> name_the_badge_choices
+ [I'll come back with proof.]
    Do. A post log beats a hunch.
    -> support_hub

=== badge_named_reeves ===
#speaker:agent_0x99
~ insider_identified = true
#set_global:insider_identified:true
#complete_task:unmask_identify
That's how I read it.
Badge SC-4471, the boardroom comms post, a man on nobody's rota. And the call that pulled your booking came from the phone on his post.
He's still standing next to that terminal. Your call how you handle him.
-> support_hub

=== request_ssh_guide ===
#speaker:agent_0x99
~ ssh_guide_hint_given = true
#give_item:lab-workstation:m02_ssh_bruteforce_field_guide

SSH access and bruteforce guide sent.

Confirm the port's open, test a sensible username against a focused wordlist with Hydra, then connect. Foothold first, exploitation after.

+ [Got it]
    Start small on the wordlist and expand only if you need to. Move.
    -> support_hub

=== request_privesc_guide ===
#speaker:agent_0x99
~ privesc_guide_hint_given = true
#give_item:lab-workstation:m02_privilege_escalation_field_guide

Privilege escalation guide uploaded.

Enumerate with sudo -l first, then take the smallest step that reaches the files you need. Read with sudo cat where you can.

+ [Understood]
    Least intrusive path that works. Don't kick down doors you can walk through.
    -> support_hub

=== request_infoleak_note ===
#speaker:agent_0x99
~ infoleak_note_hint_given = true
#give_item:lab-workstation:m02_infoleak_field_note

Field note's on your terminal.

Clamp the cracker on and read the lights. Greens are the right digit in the right slot, ambers the right digit in the wrong slot.
Each guess, the lights rule out combinations. Four or five rows and the code has nowhere to hide.

Take the lesson past one safe. Any system that tells an attacker how close they got is leaking. A wrong answer should say only "wrong".

+ [Received]
    Their tool, their safe, their keys. I do enjoy the symmetry. Go.
    -> support_hub

=== request_scanning_guide ===
#speaker:agent_0x99
~ scanning_guide_hint_given = true
#give_item:lab-workstation:m02_scanning_field_guide

Uploading the recon guide now.

Use it to find what's alive on that network and what the backup server's running. Then decide how you go in.

+ [Received]
    Good. Map first, then move.
    -> support_hub

=== request_vulnerability_guide ===
#speaker:agent_0x99
~ vulnerability_guide_hint_given = true
#give_item:lab-workstation:m02_vulnerability_field_guide

Sending vulnerability analysis guide.

You're in. This one helps you work out which of those services will actually give.

+ [Got it]
    Go for what's open now. Ignore the noise.
    -> support_hub

=== request_scanning_exploitation_guide ===
#speaker:agent_0x99
~ scanning_exploitation_guide_hint_given = true
#give_item:lab-workstation:m02_scanning_exploitation_field_guide

Scanning and exploitation guide uploaded.

It runs the whole chain. Nmap fingerprint, research the CVE, feed the scan into Metasploit, set the exploit and payload, validate the shell.
Work it top to bottom and you won't miss a step.

+ [Got it.]
    Scan first, match the version exactly, and don't improvise until you've got a stable session.
    -> support_hub

=== request_exploitation_guide ===
#speaker:agent_0x99
~ exploitation_guide_hint_given = true
#give_item:lab-workstation:m02_exploitation_field_guide

ProFTPD exploitation workflow uploaded.

Module, payload, listener, and what to check once you're in. It's all there.

+ [Got it.]
    Adapt it to whatever the box gives you.
    -> support_hub

=== hint_encoding ===
#speaker:agent_0x99
~ hint_encoding_given = true

Encoding isn't encryption.

Encoding -- Base64, ROT13, hex -- transforms data for storage or transit. No secret key. Reversible by anyone with the right tool.

Encryption requires a key. Without it, the data is meaningless.

ENTROPY uses encoding for obfuscation and encryption for actual security. When you find something encoded, use CyberChef.

+ [How do I use CyberChef for Base64?]
    Workstation in the server room. Open CyberChef, drag "From Base64" into the recipe, paste your text. Instant decode.
    For ROT13, same process -- drag the ROT13 operation in.
    -> support_hub

+ [Understood]
    -> support_hub

=== hint_pin_safe ===
#speaker:agent_0x99
~ hint_pin_given = true

Gary's backup procedures say the offline keys are in a physical PIN safe. Emergency equipment store, far end of the ward.

Four-digit code. Hospitals use institutional dates -- founding years, significant administrative anniversaries.

The answer's somewhere in the building. Check plaques, framed documents, administrative notices.

+ [I've already found a clue]
    Trust it. Hospitals are consistent about this kind of thing.
    -> support_hub

+ [What if I can't find the PIN?]
    Then the noisy way. There's a sealed case behind the rack in the server room. Not hospital kit, no key for it anywhere.
    Pick the latch; your picks will do it. Whoever left it there wanted that safe as badly as you do.
    -> support_hub

+ [Got it]
    -> support_hub

=== hint_ransom_decision ===
#speaker:agent_0x99
~ hint_ransom_given = true

{offline_keys_recovered and ghost_key_material_obtained:
    You have both key sets. Independent recovery is genuinely on the table, which it wasn't an hour ago.
- else:
    {offline_keys_recovered:
        You have the escrow set. That's twelve hours on its own. Ghost's key material out of the staging cache would make it four.
    - else:
        Right now the console takes a restore manifest and a ransom payment, and that's all.
    The escrow keys in the storage safe are what give you a choice.
    }
}

Ghost will have given you numbers. Deaths per hour, one figure for paying and a worse one for not.
Put them down.

Nobody can tell you how many a six-hour delay kills on a specific ward on a specific night.
The person offering to is selling something.

What's true is smaller and harder. Paying is faster, and it pays them. Doing it yourself is slower, and it doesn't.
Everything past that is a guess wearing a decimal point.
-> hint_ransom_decision_choices

=== hint_ransom_decision_choices ===
{ransom_decision_made:
    -> support_hub
}
+ [What would you choose?]
    I'm not going to answer that.
    What I'll say: don't let Ghost's framing decide it for you. They designed this dilemma. Don't let them own your answer.
    -> support_hub

+ [Is there a third option?]
    {ghost_offer_made:
        Ghost offered you one. Free keys in exchange for publishing the evidence.
        It's a real option. Fastest of the lot, no funding -- but Ghost's keys stay Ghost's.
        Whatever they unlock, Ghost can reach again. And Ghost's lesson lands publicly.
        It's your call whether to engage with that.
        -> support_hub
    }
    Not through official channels. The recovery console has the options available to you.
    -> support_hub

+ [I'll make the call]
    Good. Recovery console in the server room. Take the decision you can live with.
    -> support_hub

=== ghost_deal_recovery_advice ===
#speaker:agent_0x99

If Ghost's keys are legitimate, that's your fastest path.

No ransom paid. No ENTROPY funding. Recovery in under an hour.

The cost is twofold. You publish the evidence at the press terminal.
And the keys are Ghost's, so whatever they unlock, Ghost can reach again. We'd be weeks getting them out of that network.

Make sure you understand what you're agreeing to before you initiate recovery.
-> ghost_deal_recovery_advice_choices

=== ghost_deal_recovery_advice_choices ===
{ransom_decision_made:
    -> support_hub
}
+ [The keys are real  --  Ghost transmitted them]
    Then use them. And follow through at the press terminal.
    Or don't. You're the one who has to decide what that means.
    -> support_hub

+ [I haven't decided what to do with Ghost's deal yet]
    Then decide before you walk into the recovery console. Don't go in uncertain.
    -> support_hub

=== discuss_ideology ===
#speaker:agent_0x99
~ ideology_discussed = true

You've read Ghost's calculations. They projected deaths before the operation started and proceeded anyway.

This is what ENTROPY looks like across every cell we've uncovered. True believers, with risk models.

+ [How do you fight that?]
    Evidence and consequences, long term.
    True believers lose credibility when their predicted outcomes don't materialise.
    If hospitals sector-wide improve security after this -- and attacks drop -- Ghost's ideology loses its proof of concept.
    -> support_hub

+ [Ghost's diagnosis is hard to argue with]
    I know. Institutional negligence is real. The board's decisions were genuinely bad.
    The diagnosis is accurate. The question is whether you can count deaths as acceptable costs, carry on, and still be the good guys.
    Ghost crossed it. That's why we're here.
    -> support_hub

+ [Understood. Staying focused.]
    -> support_hub

=== hint_press_terminal ===
#speaker:agent_0x99

Conference room. Hospital communications terminal.

The board liability email. Gary's six months of warnings. The full budget record.

Transmit and it's public record within the hour. Don't transmit and it stays internal.

That's the last decision of this mission.
-> hint_press_terminal_choices

=== hint_press_terminal_choices ===
{mission_complete:
    -> support_hub
}
+ [What's the right choice here?]
    Public exposure forces sector-wide change. Forty-three other hospitals on ENTROPY's reconnaissance list might patch before someone teaches them the same lesson.
    Quiet resolution protects St. Catherine's. Gary's vindication stays an internal matter.
    I'm not going to tell you which is right.
    -> support_hub

+ {ghost_deal_accepted} [I agreed to publish as part of Ghost's deal]
    Then you know what you need to do. The question is whether you're honouring it.
    -> support_hub

+ [Got it. Conference room.]
    -> support_hub

// ===========================================
// GENERAL ADVICE (state-aware fallback)
// ===========================================

// Playtest loop round 1 (A10): graded nudges for a stuck player. Never names him.
// Tier from what the player has read; second and later asks are more specific.
=== doors_nudge ===
~ temp tier = 5
{
- not insider_badge_id_found and not read_handover_board:
    ~ tier = 1
- not insider_badge_id_found:
    ~ tier = 2
- not read_night_rota and not inspected_asset_post:
    ~ tier = 3
- not inspected_asset_post:
    ~ tier = 4
}
{tier != doors_tier:
    ~ doors_tier = tier
    ~ doors_asks = 0
}
~ doors_asks = doors_asks + 1
{
- tier == 1:
    {doors_asks > 1:The handover room keeps a board. Read Friday's line.|Somebody authorised that drill. Drills get written up somewhere.}
- tier == 2:
    {doors_asks > 1:Ghost's own log on the backup server should name the badge. Keep working the box.|A security override held those doors. Who calls themselves security tonight?}
- tier == 3:
    {doors_asks > 1:Both carry badge numbers. Read them and find 4471.|SC-4471. Security keeps a rota, and every post keeps a log.}
- tier == 4:
    {doors_asks > 1:Every post keeps a log. The boardroom is a post too. Kim has the keypad code.|The rota accounts for Val and her number. It isn't 4471.}
- else:
    {doors_asks > 1:Same badge. Who stands the boardroom post all night?|Put Ghost's badge number next to the boardroom post log.}
}
->->

=== general_advice ===
#speaker:agent_0x99

{slow_path_window_open and not bed4_manually_stabilised and not patient_bed4_deceased:
    Bed 4 is alarming and nobody's coming for him. Patient ward, now -- talk to Mr Pryce and bag him by hand.
    -> support_hub
}
// Round 3 (struggle M4): after a fight Val won't talk; say what's left.
{attacked_guard and not guard_knocked_out and not reached_security_office:
    Val won't deal with you now. Pick her office door while she's walking away from it. That's still the way to the server room.
    -> support_hub
}
{cover_burned and not reached_security_office and not cover_restored:
    One thing at a time. Get past Val and through her office to the server room. Everything else can wait.
    // Round 2 confirmation (F1): say where, once the card's in hand.
    {keycard_held: Her Security Office is at the west end of the main corridor. The server-room door is inside it.}
    -> support_hub
}
{cover_burned and not reached_security_office and cover_restored and not val_opened_office:
    Bernie's word is on the log. Val will have heard. Ask her to open her office.
    -> support_hub
}
// Round 2 (BS1/CF-G, F1): with the card in hand, say where the door is. Ahead of the
// insider nudge, so it isn't shadowed.
{keycard_held and not scanning_guide_offered and not flag_ssh_submitted:
    Server room's through Val's Security Office, west end of the main corridor. Gary's card opens the door at the back.
    -> support_hub
}
{cover_burned and not insider_identified and not mission_complete:
    -> doors_nudge ->
}
{scanning_guide_offered and not flag_ssh_submitted:
    You're in the server room. Map the backup server from the Kali terminal, then get an SSH session with Gary's shared credential.
    Each flag goes in the drop-site.
    -> support_hub
}
{not dr_kim_met:
    Reception first, then Kim. You want the override key and you want somebody who has met you willing to say so.
    -> support_hub
}
{dr_kim_met and not flag_ssh_submitted:
    Gary is your route to the server room, and cooperation gets you three things where theft only gets you one.
    -> support_hub
}
{flag_ssh_submitted and not restore_manifest_obtained:
    Two tracks. Keep working the backup server. The database backup on it is the restore point the console needs, and it won't restore without one.
    And the safe in emergency storage has the offline keys. You want both to recover on your own.
    -> support_hub
}
{restore_manifest_obtained and not ransom_decision_made and not offline_keys_recovered:
    The console has its restore point. The escrow keys in the emergency storage safe are what stop the ransom being your only way through it.
    -> support_hub
}
{restore_manifest_obtained and not ransom_decision_made and offline_keys_recovered and not ghost_key_material_obtained and not flag_ghost_log_submitted:
    Escrow plus manifest is twelve hours. Ghost's key material makes it four. It's in the locked rack cache. Ghost's log flag opens it.
    -> support_hub
}
{restore_manifest_obtained and not ransom_decision_made and offline_keys_recovered and not ghost_key_material_obtained and flag_ghost_log_submitted:
    Escrow keys and a restore point is twelve hours. Ghost's key material is in the staging cache. Take it and you've got four.
    -> support_hub
}
{restore_manifest_obtained and not ransom_decision_made and offline_keys_recovered:
    You have what the console needs to restore without paying. Recovery console in the server room.
    Take the decision you can live with. But remember the clock.
    -> support_hub
}
{ransom_decision_made:
    Conference room. Press terminal. That's the last step.
    {not found_boardroom_code: Keypad code's in Kim's desk diary, if you didn't ask her.}
    -> support_hub
}
You know what you're doing. Go.
-> support_hub
