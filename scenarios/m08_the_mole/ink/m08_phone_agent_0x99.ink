// ================================================
// Mission 8: The Mole - Agent HaX phone hub (THE HUB)
// Speaker: Agent HaX
// Entry knot: start
// Progress-gated support + per-stage VM hints + field guides.
// Mirrors m07's hub. Field guides delivered via #give_item:lab-workstation:<key>.
// ================================================

VAR player_name = "Agent 0x00"
VAR found_gitlist_vuln = false
VAR found_leaked_creds = false
VAR found_architect_comms = false
VAR found_access_logs = false
VAR badge_cloned = false
VAR mole_identified = false // Synced scenario global: set by Netherton's audit check, the flag-4 fallbacks, or hax_read_right here

VAR recon_guide_offered = false
VAR recon_guide_hint_given = false
VAR scanning_guide_offered = false
VAR scanning_guide_hint_given = false
VAR vulnanalysis_guide_offered = false
VAR vulnanalysis_guide_hint_given = false
VAR privesc_guide_offered = false
VAR privesc_guide_hint_given = false
VAR cyberchef_guide_offered = false
VAR cyberchef_guide_hint_given = false
VAR gitsecrets_guide_offered = false
VAR gitsecrets_guide_hint_given = false
VAR found_badge_audit = false
// PASS 5 (puzzle chains C1, F1): synced scenario global, set by HaX's
// server-room entry mapping; opens the box topic.
VAR server_room_entered = false

VAR first_call = true
VAR all_flags_submitted = false
VAR fate_decided = false
VAR netherton_ko = false
// PASS 4 (fixes 1 and 2): the Director's card is cloned, after the interviews.
VAR netherton_card_taken = false
VAR netherton_card_cloned = false
// Playtest round: latched in the scenario when each suspect is interviewed or KO'd.
VAR cipher_seen = false
VAR phantom_seen = false
VAR nightshade_seen = false
// PASS 5 (alignment B1): the naming hint ladder. Synced scenario globals; the
// ladder checks whether each step of the door-audit reading is done, never how.
VAR found_timeline = false
VAR found_access_logs_hint = false
VAR cipher_audit_confirmed = false
VAR nightshade_audit_confirmed = false
VAR cipher_ko = false
VAR nightshade_ko = false
VAR audit_misread = false
VAR audit_closed = false
// PASS 5 (alignment C2, J3, J5): the reading HaX takes when the Director is
// down, and the Director's warning at the second misread.
VAR named_by_hax = false // Synced scenario global: the door audit read to HaX
VAR audit_warned = false // Synced scenario global

// PASS 3 (impl review m5): start prints nothing after the first call, as in
// m07, so a reopen or a reload's preload adds no "Go ahead." message (E10).
=== start ===
{ first_call:
    ~ first_call = false
    -> first_call_text
}
-> hub

=== first_call_text ===
Line's open. Same as Portland, except this time the target has a SAFETYNET lanyard and a name I probably know.
So I'm going to be very professional tonight. Bear with me.
-> hub

=== hub ===
+ [How do I get into the server room?]
    // Round 2: shorter, action first; the cloned branch says how to use the
    // saved card (after a reload the reader opens the cloner's menu).
    // PASS 5 (puzzle chains C1, m5): his card is MIFARE Classic with custom
    // keys (rfidCard), not the EM4100 of m04-m07; the all-three branch says so
    // before the clone, since the cloner needs the darkside attack.
    {
    - netherton_card_cloned:
        Reader's east of the ops floor. Open the cloner, pick his card from Saved, emulate it.
        With the keys cracked, the reader can't tell a copy from his own card. Our top card, and it fell in half a minute.
    - netherton_card_taken or badge_cloned:
        Reader's east of the ops floor. You've already got what it wants.
    - netherton_ko:
        His card's on the floor beside him. Or the visitor printer at reception: a badge behind a facilities PIN. Facilities write PINs down.
    - cipher_seen and phantom_seen and nightshade_seen:
        You've seen all three. Back to the Director, and stand close with the cloner. Or the visitor printer at reception.
        His card isn't the EM4100 you've been reading all year. It's MIFARE Classic with its own keys, so the cloner can't just copy it.
        Run the darkside attack to crack the keys first, then read it. Half a minute beside him.
    - else:
        See all three suspects, then clone the Director's card. Or try the visitor printer at reception. Facilities write their PINs down.
    }
    -> hub
// PASS 5 (puzzle chains C1, F1): the VM ladder shows only the current step.
// The box topic opens on entering the server room and closes at flag 1; the
// flag-2 topic covers the gap between flags 1 and 2. Wording follows the
// in-game framing (launcher, flag texts, guides): needs checking against
// SecGen by the user.
+ { server_room_entered and not found_gitlist_vuln } [What am I looking at on this box?]
    A GitList instance our own team stood up and never patched.
    One crafted request gets you code execution with no login at all. Get that working and it's your first flag.
    And our first national embarrassment.
    -> hub
+ { found_gitlist_vuln and not found_leaked_creds } [I'm on the box. Where do I look?]
    Read the history, not just the files. Then the stash: git keeps what people meant to throw away.
    Whoever's account it is, they committed something they shouldn't have. Git secrets guide's yours if you want it.
    -> hub
+ { found_leaked_creds and not found_architect_comms } [I've got credentials. Now what?]
    Log in properly with them. Whoever committed those thought no one would ever read that far.
    Get into the account and let's find out whose it is.
    -> hub
+ { found_architect_comms and not found_access_logs } [The mail's real. How do I make it stick?]
    You need root. A user shell shows you the mailbox. Root shows you the logs, and logs put an account at a terminal.
    There's a sudo rule on that box begging to be abused. Take it.
    -> hub
// PASS 3 (P4, R2-m3, R3-m12): the suite is a keypad. Before flag 4 HaX
// points at the safe without spelling out how it opens; after, the full method.
+ { not mole_identified } [How do I get into the interrogation suite?]
    Keypad, south of the Crypto Lab. The code's in the Director's safe.
    How his safe opens is the building's worst-kept secret. Ask ATHENA, or look at what he signs.
    -> hub
+ { mole_identified } [How do I get into the interrogation suite?]
    Keypad, south of the Crypto Lab. The code's in the Director's office safe.
    The safe combination is his service number. Everyone in this building uses their own.
    He signs it on anything he pulls from personnel. There's one of those printouts in the ops-floor tray.
    -> hub
// PASS 3 (P5): the door audit and the lab's single door.
+ { not found_badge_audit } [Where would the door logs be?]
    Security Archives, south of the ops floor. Facilities set the passphrase, and facilities write things down. Kettle.
    The lab's got one door. Whatever that door saw, it saw everyone.
    -> hub
// PASS 5 (B1): progress-gated ladder for the naming. Each tier is the first
// step not yet done: the audit, a clock, a confirmed row, then the reading.
+ { not mole_identified and not audit_closed } [What does the Director need from me?]
    {
    - netherton_ko and not found_badge_audit:
        He's on his floor, so it's me you read it to. Doors before faces. The archives keep the door audits.
    // PASS 5 (alignment C3, K2): the KO reading needs a clock source too.
    - netherton_ko and not (found_timeline or found_access_logs_hint or found_access_logs):
        You've got the door. Now the clock: when was the plan opened? Somebody in this building wrote it down.
    - netherton_ko:
        He's on his floor, so it's me you read it to. Tell me you can name the leak, and I'll ask you what he would.
    - not found_badge_audit:
        A name he can stand behind, and you haven't got one yet. Doors before faces. The archives keep the door audits.
    - not (found_timeline or found_access_logs_hint or found_access_logs):
        You've got the door. Now you need the clock: when was the plan opened? Somebody in this building wrote it down.
    - not (cipher_audit_confirmed or nightshade_audit_confirmed or (cipher_ko and nightshade_ko)):
        Door and clock. He'll want someone on that audit to stand behind their own row. Ask the men who badge through the lab door.
    - audit_warned:
        He's warned you. One more miss and {found_access_logs:he reads it himself|he takes it off you, and the floor will know}. Every row against the minute. Who stayed inside?
    - audit_misread:
        He's said no once. Three misses and {found_access_logs:he reads it himself|he takes it off you, and the floor will know}. Every row against the minute. Who stayed inside?
    - else:
        Door, clock, a confirmed row. Take it to him. Read the door against the minute, not the man.
    }
    -> hub
// PASS 5 (alignment C2, J3): with the Director down, HaX hears the reading.
// Two of his four steps (the minute, the man); question and choices share a
// knot so a reopen asks the question again. Free to retry, as his are not:
// the KO is the cost (credits, debrief). Alignment C3 (K2): needs a clock
// source as well as the door, as the Director's reading does.
// Alignment C3 (K5): the audit-off-me reply is stale once he's down.
+ { netherton_ko and found_badge_audit and (found_timeline or found_access_logs_hint or found_access_logs) and not mole_identified } [I can name the leak.] -> hax_read_1
+ { audit_closed and not netherton_ko and not mole_identified } [The Director's taken the audit off me.]
    He has. He'll put the name to it himself once the box gives him the account. Get root.
    And he's asking questions on the floor now, so don't expect anyone to stay surprised.
    -> hub
+ { mole_identified and not all_flags_submitted } [Why isn't he in the interrogation room yet?]
    The Director wants all four flags through the relay first. Give Nightshade half a case and he'll take it apart.
    Get the rest of the box submitted.
    -> hub
+ { mole_identified and not fate_decided } [It's really Nightshade.]
    Yeah. It's really Nightshade.
    We did survival training together. He carried me two miles once.
    Get the interrogation room open. I'll be fine. I'll be fine after.
    -> hub
// Round 2 (playtest): only while there is a guide on offer and not yet taken.
+ { (recon_guide_offered and not recon_guide_hint_given) or (scanning_guide_offered and not scanning_guide_hint_given) or (vulnanalysis_guide_offered and not vulnanalysis_guide_hint_given) or (cyberchef_guide_offered and not cyberchef_guide_hint_given) or (gitsecrets_guide_offered and not gitsecrets_guide_hint_given) or (privesc_guide_offered and not privesc_guide_hint_given) } [I need a field guide.] -> guides
+ [Nothing right now.]
    I'm here. Always am.
    #exit_conversation
    -> hub

=== hax_read_1 ===
{ mole_identified: -> hub }
Two questions, the ones he'd ask. When was the plan opened?
+ [10:15 UTC.] -> hax_read_wrong_time
+ [10:32 UTC.] -> hax_read_wrong_time
+ [10:38 UTC.] -> hax_read_2
+ [11:25 UTC.] -> hax_read_wrong_time
+ [Let me read it again.] -> hub

=== hax_read_wrong_time ===
That's a door moving or the file closing. When did it open? Read it again and call me back.
-> hub

=== hax_read_2 ===
{ mole_identified: -> hub }
Who was behind the lab door at 10:38, and still inside?
+ [Cipher.] -> hax_read_wrong_who
+ [Nightshade.] -> hax_read_right
+ [Phantom.] -> hax_read_wrong_who
+ [None of them.] -> hax_read_wrong_who
+ [Let me read it again.] -> hub

=== hax_read_wrong_who ===
Read the door against the minute, not the man. Who was still inside at 10:38? Call me back.
-> hub

=== hax_read_right ===
~ mole_identified = true
~ named_by_hax = true
#complete_task:name_the_mole
#set_global:named_by_hax:true
#set_global:mole_identified:true
In at 10:15, out at 11:43. Cipher was gone by 10:32, and Phantom was on a plane.
Nightshade. I trained with him.
I'll put it in front of the Director when he can stand. You finish the chain.
-> hub

// PASS 3 (P1): text knot, then a choices-only knot, so a phone re-navigation
// (which lands on the knot that owns the choices, E10/E13) replays nothing.
=== guides ===
Course. Which one.
-> guides_menu

=== guides_menu ===
+ { recon_guide_offered and not recon_guide_hint_given } [Recon and network mapping.]
    Map before you shoot. #give_item:lab-workstation:m08_recon_field_guide
    ~ recon_guide_hint_given = true
    -> guides_menu
+ { scanning_guide_offered and not scanning_guide_hint_given } [Scanning and exploitation.]
    Fingerprint the service, then hit the GitList flaw. #give_item:lab-workstation:m08_scanning_field_guide
    ~ scanning_guide_hint_given = true
    -> guides_menu
+ { gitsecrets_guide_offered and not gitsecrets_guide_hint_given } [Secrets in git history.]
    Credentials in commit history -- classic, and exactly what he did. Read the log, then check the stash. #give_item:lab-workstation:m08_gitsecrets_field_guide
    ~ gitsecrets_guide_hint_given = true
    -> guides_menu
+ { cyberchef_guide_offered and not cyberchef_guide_hint_given } [Decoding with CyberChef.]
    Last layer first. You know this one. #give_item:lab-workstation:m08_cyberchef_field_guide
    ~ cyberchef_guide_hint_given = true
    -> guides_menu
+ { vulnanalysis_guide_offered and not vulnanalysis_guide_hint_given } [Vulnerability analysis.]
    Know why the flaw works before you lean on it. #give_item:lab-workstation:m08_vulnanalysis_field_guide
    ~ vulnanalysis_guide_hint_given = true
    -> guides_menu
+ { privesc_guide_offered and not privesc_guide_hint_given } [Privilege escalation.]
    The sudo route to root. #give_item:lab-workstation:m08_privesc_field_guide
    ~ privesc_guide_hint_given = true
    -> guides_menu
+ [That's all.]
    -> hub
