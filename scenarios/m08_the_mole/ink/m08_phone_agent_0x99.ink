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
VAR infoleak_guide_offered = false
VAR infoleak_guide_hint_given = false

VAR first_call = true
VAR all_flags_submitted = false
VAR fate_decided = false
VAR netherton_ko = false

=== start ===
{ first_call:
    ~ first_call = false
    Agent HaX: Line's open. Same as Portland, except this time the target's got a SAFETYNET lanyard and a name I probably know. So. Let's be professional about a thing that is not remotely professional.
    -> hub
- else:
    Agent HaX: Go ahead.
    -> hub
}

=== hub ===
+ [How do I get into the server room?]
    { netherton_ko:
        Agent HaX: Badge reader, east side of the ops floor. The Director's in no state to hand you his keycard now, so it's the visitor badge printer at reception. There's a badge in the tray behind a facilities PIN. Facilities write their PINs down. Try the break room, west of the Crypto Lab.
    - else:
        Agent HaX: Badge reader, east side of the ops floor. The Director will give you his keycard if you ask him for access. If he can't, the visitor badge printer at reception has a badge sitting in the tray behind a facilities PIN. Facilities write their PINs down. Try the break room, west of the Crypto Lab.
    }
    -> hub
+ { found_gitlist_vuln } [What am I looking at on this box?]
    Agent HaX: A GitList instance our own team stood up and never patched. It takes a crafted request and hands you code execution with no login at all. That's your first flag and our first national embarrassment.
    -> hub
+ { found_leaked_creds } [I've got credentials. Now what?]
    Agent HaX: Log in properly with them. Whoever committed those to the repo thought no one would ever read that far. Get into the account and let's find out whose it is.
    -> hub
+ { found_architect_comms and not found_access_logs } [The mail's real. How do I make it stick?]
    Agent HaX: You need root. A user shell shows you the mailbox; root shows you the logs, and the logs are what put a body in a chair. There's a sudo rule on that box begging to be abused. Take it.
    -> hub
+ { mole_identified } [How do I get the interrogation room open?]
    Agent HaX: It's south of the Crypto Lab. The Director keeps the key in his office safe, so that using it is a decision, not a habit. The combination is his own service number. Everyone in this building uses theirs, and he signs his on anything he pulls from personnel. There's one of those printouts on the ops floor. Or pick the door; you're carrying a kit.
    -> hub
+ { mole_identified and not all_flags_submitted } [Why isn't he in the interrogation room yet?]
    Agent HaX: Because the Director wants the whole chain through the relay first: all four. If we put half a case in front of Nightshade, he'll take it apart. Get the rest of the box submitted.
    -> hub
+ { mole_identified and not fate_decided } [It's really Nightshade.]
    Agent HaX: Yeah. It's really Nightshade. We did survival training together. He carried me two miles once. Get the interrogation room open. I'll be fine. I'll be fine after.
    -> hub
+ { recon_guide_offered or scanning_guide_offered or vulnanalysis_guide_offered or infoleak_guide_offered or privesc_guide_offered } [I need a field guide.] -> guides
+ [Nothing right now.]
    Agent HaX: I'm here. Always am.
    #exit_conversation
    -> hub

=== guides ===
Agent HaX: Course. Which one.
+ { recon_guide_offered and not recon_guide_hint_given } [Recon and network mapping.]
    Agent HaX: Map before you shoot. #give_item:lab-workstation:m08_recon_field_guide
    ~ recon_guide_hint_given = true
    -> guides
+ { scanning_guide_offered and not scanning_guide_hint_given } [Scanning and exploitation.]
    Agent HaX: Fingerprint the service, then hit the GitList flaw. #give_item:lab-workstation:m08_scanning_field_guide
    ~ scanning_guide_hint_given = true
    -> guides
+ { infoleak_guide_offered and not infoleak_guide_hint_given } [Finding leaked secrets.]
    Agent HaX: Credentials in commit history -- classic, and exactly what he did. #give_item:lab-workstation:m08_infoleak_field_guide
    ~ infoleak_guide_hint_given = true
    -> guides
+ { vulnanalysis_guide_offered and not vulnanalysis_guide_hint_given } [Vulnerability analysis.]
    Agent HaX: Know why the flaw works before you lean on it. #give_item:lab-workstation:m08_vulnanalysis_field_guide
    ~ vulnanalysis_guide_hint_given = true
    -> guides
+ { privesc_guide_offered and not privesc_guide_hint_given } [Privilege escalation.]
    Agent HaX: The sudo route to root. #give_item:lab-workstation:m08_privesc_field_guide
    ~ privesc_guide_hint_given = true
    -> guides
+ [That's all.]
    -> hub
