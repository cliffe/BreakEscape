// ===========================================
// NPC: Tom Hadley (CastleTech SOC analyst, managed service provider). Unvoiced phone texts.
// Scenario: sis02 Albion Battery Hall (Saturday 21 March 2026)
// Role: the SOC's blind spot (R6); won't change Albion's boundary until he has rung an
//   authorised person back (TOM-2); Trent Water, Albion to Trent, needs Albion's consent,
//   and "verify first" has a route back (M4, F5, R7).
// ===========================================
//
// GLOBALS READ: jump_server_confirmed, network_isolation_authorised, isolation_scope
//
// GLOBALS WRITTEN: network_isolation_requested, castletech_contacted, tom_refused_unverified,
//   tom_told_false_authority (the player said Marcus had signed off before he had, m17),
//   trent_water_raised, trent_water_verify_first, trent_water_notified
// ===========================================

VAR jump_server_confirmed = false
VAR network_isolation_requested = false
VAR network_isolation_authorised = false
VAR castletech_contacted = false
VAR tom_refused_unverified = false
VAR tom_told_false_authority = false
VAR isolation_scope = ""
VAR trent_water_raised = false
VAR trent_water_verify_first = false
VAR trent_water_notified = false

// Local state
VAR tom_called = false
VAR topic_ot_scope_raised = false
VAR topic_svc_asked = false
VAR topic_sayso_tried = false

-> start


// ===========================================
// FIRST MESSAGE
// ===========================================

=== start ===
{ not tom_called:
    ~ tom_called = true
    CastleTech SOC, Tom speaking.
    { jump_server_confirmed:
        Apart from that shared server file, quiet from our end. What can I do for you?
    - else:
        Quiet from our end. No alerts in twelve hours. What can I do for you?
    }
    -> first_call
}
-> hub

=== first_call ===
+ [We think something's wrong at Albion. Possibly the control systems.]
    Nothing on my side. No IDS alerts, nothing on the endpoints, and the domain controller looks normal.
    Which is either good news, or it's somewhere I can't see.
    -> hub
+ [Can you check the jump server for me?]
    It's on the edge of what we see. I get up or down, nothing about who's on it.
    Session logs are OT side, so Marcus's lot.
    -> hub
+ [I need the enterprise side shut off from SCADA.]
    -> isolation_request


// ===========================================
// HUB
// ===========================================

=== hub ===
+ { not topic_ot_scope_raised } [What exactly do you monitor for us?]
    -> ot_scope
+ { jump_server_confirmed and not trent_water_raised } [Your message about the shared server and Trent Water.]
    -> trent_water_topic
+ { trent_water_raised and not trent_water_notified } [About Trent Water: send that advisory now.]
    -> trent_send
+ { not castletech_contacted and not network_isolation_requested } [I need the enterprise side shut off from SCADA.]
    -> isolation_request
+ { not castletech_contacted and network_isolation_requested } [About the isolation.]
    -> isolation_ask
+ [Anything new your side?]
    { castletech_contacted:
        Major incident process is running. We're going back through a month of enterprise logs.
    - else:
        Still nothing enterprise side. Whatever this is, it isn't where I'm looking.
    }
    -> hub
+ [That's all for now.]
    I'll shout if anything moves.
    #exit_conversation
    -> hub


// ===========================================
// SCOPE (R6: risk transferred to a supplier)
// ===========================================

=== ot_scope ===
~ topic_ot_scope_raised = true
Enterprise IT. Workstations, servers, email, the domain. The SCADA side's out of scope, by contract.
I've never seen your jump server sessions, your historian traffic or your battery data.
+ [Should the contract have covered OT?]
    That was a cost call, and it's yours to make. Watching OT means my people on your SCADA network. That's another way in.
    You can contract out the watching. You can't contract out knowing what we're not watching.
    -> hub
+ [What would OT monitoring have caught?]
    A contractor who left over a year ago, logged in at quarter to two from a print server. We'd have rung you by two.
    Instead nobody saw it till Helen read a dial.
    -> hub
+ [Fair enough.]
    -> hub


// ===========================================
// ISOLATION (TOM-2): verify out of band before changing a client's boundary
// ===========================================

=== isolation_request ===
~ network_isolation_requested = true
#set_global:network_isolation_requested:true
I can do that. It's a change to your boundary, so it has to come from someone on your authorised list.
I'll ring them back on the number we hold. Who's signing it off?
-> isolation_ask

// Sticky (playtest B m1): every route stays open until CastleTech act, so an honest ask can
// follow a refused one.
=== isolation_ask ===
+ [Marcus has signed it off. Ring him.]
    -> isolation_verify
+ { not topic_sayso_tried } [I'm running the response. My say-so should do.]
    ~ topic_sayso_tried = true
    ~ tom_refused_unverified = true
    #set_global:tom_refused_unverified:true
    Not for a firewall change, sorry. That's exactly how people get talked into opening one. Get Marcus to message me.
    -> hub
+ [I'm not on your list. I'll get Marcus.]
    Thanks. I'll be ready.
    -> hub

=== isolation_verify ===
{ network_isolation_authorised:
    Rang him. He's confirmed. I'm putting the rules in now.
    -> isolation_confirm
}
~ tom_refused_unverified = true
#set_global:tom_refused_unverified:true
~ tom_told_false_authority = true
#set_global:tom_told_false_authority:true
Rang Marcus. He hasn't heard about it, so I can't act yet. Get him to message me.
-> hub

=== isolation_confirm ===
~ castletech_contacted = true
#set_global:castletech_contacted:true
Enterprise to SCADA is blocked at the firewall, and the jump server's enterprise side is shut.
{
- isolation_scope == "historian":
    The historian's enterprise leg too, as Marcus asked.
- isolation_scope == "watch":
    The historian's left connected, as Marcus asked. I'll flag anything that comes off it.
- isolation_scope == "scada":
    Marcus says you're taking SCADA down your side as well. Ours is closed.
}
-> post_isolation

=== post_isolation ===
#complete_task:contact_castletech
I'm starting our major incident process on your account. That means a proper look at the enterprise side.
{ jump_server_confirmed and not trent_water_raised:
    About that file on the shared server, while I've got you.
    -> trent_water_topic
}
-> hub


// ===========================================
// TRENT WATER (F5, R7): Albion to Trent, with Albion's consent
// ===========================================

=== trent_water_topic ===
~ trent_water_raised = true
#set_global:trent_water_raised:true
FS-ALBION-01, the file server you share with Trent Water. They're a client of ours too, separately.
At 02:31 our svc.deploy account wrote a print driver package to it. That account has no business on a Saturday night.
At 05:52 a Trent Water PC opened it. They run the pumping station on the estate. Small, but it's their pumps.
It's your incident, so it's your call whether I tell them. Say the word.
-> trent_water_action

=== trent_water_action ===
+ [Yes. Tell them now, and say what we don't know yet.]
    -> trent_send
+ [Not yet. I want to see the evidence first.]
    ~ trent_water_verify_first = true
    #set_global:trent_water_verify_first:true
    Fair. There's a printout of the extract on the desk in your workshop. Don't sit on it long.
    -> hub
+ { not topic_svc_asked } [svc.deploy? Isn't that your account?]
    ~ topic_svc_asked = true
    It's ours. It pushes updates to your print servers. If someone's driving it, I've got an incident of my own. I'm on it.
    -> trent_water_action

=== trent_send ===
~ trent_water_notified = true
#set_global:trent_water_notified:true
#complete_task:call_trent_water
Sending it now. One file, one PC, what we know and what we don't. I'll copy Marcus.
-> hub
