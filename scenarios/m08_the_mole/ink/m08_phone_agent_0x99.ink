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
VAR mole_identified = false

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
    {
    - netherton_card_cloned:
        Reader's east of the ops floor. Open the cloner, pick his card from Saved, emulate it. EM4100 has no crypto; the reader can't tell.
    - netherton_card_taken or badge_cloned:
        Reader's east of the ops floor. You've already got what it wants.
    - netherton_ko:
        His card's on the floor beside him. Or the visitor printer at reception: a badge behind a facilities PIN. Facilities write PINs down.
    - cipher_seen and phantom_seen and nightshade_seen:
        You've seen all three. Back to the Director, and stand close with the cloner. Or the visitor printer at reception.
    - else:
        See all three suspects, then clone the Director's card. Or try the visitor printer at reception. Facilities write their PINs down.
    }
    -> hub
+ { found_gitlist_vuln } [What am I looking at on this box?]
    A GitList instance our own team stood up and never patched.
    One crafted request gets you code execution with no login at all. That's your first flag.
    And our first national embarrassment.
    -> hub
+ { found_leaked_creds } [I've got credentials. Now what?]
    Log in properly with them. Whoever committed those thought no one would ever read that far.
    Get into the account and let's find out whose it is.
    -> hub
+ { found_architect_comms and not found_access_logs } [The mail's real. How do I make it stick?]
    You need root. A user shell shows you the mailbox. Root shows you the logs, and logs put a body in a chair.
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
