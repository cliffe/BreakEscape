// Ama Owusu on the player's phone. The "Where next?" hub names the next open step from the
// scenario globals (first unmet wins; the F lines only on the full walk-round). Timed texts
// arrive from eventMappings on ama_phone and open the knots below, which add one short
// follow-up line and then go back to the hub. KEEP the knot names: hint_cake, hint_sign_out,
// hint_open_session, hint_network_view, hint_injector, hint_patch_panel, debrief_ready, hint_ports.
// Phone lines take no speaker prefix for Ama. Text only for now; no {var} in a spoken line.

VAR tour_full = false
VAR seen_julian_rdp = false
VAR has_julian_rdp = false
VAR front_desk_signed_out = false
VAR julian_lost_with_desk = false
VAR julian_back = false
VAR saw_in_use = false
VAR staff_twin_up = false
VAR done_t_kit = false
VAR done_t_drop_box = false
VAR done_t_front_desk = false
VAR done_t_julian_pc = false
VAR done_t_door_controller = false
VAR done_t_server_room = false
VAR done_t_copy_badge = false
VAR done_t_comms = false
VAR done_t_open_session = false
VAR done_t_yasmin_pc = false
VAR done_t_implant = false
VAR done_t_capture_key = false
VAR done_t_staff_wifi = false
VAR done_t_unplug = false
VAR done_t_guest_port = false

=== start ===
Your phone will list what to try next. I'll text if I think of anything.
-> hub

=== hub ===
+ [Where next?]
    -> where_next
+ [Thanks.]
    Any time.
    -> hub

=== where_next ===
{
- not done_t_kit:
    Kit first. Meeting room, just off reception.
- not done_t_drop_box:
    There's a live port by the kit table. Plug the box in before you go anywhere else.
- not done_t_front_desk:
    Delphine's front desk next. Have a look round the screen.
- not has_julian_rdp and seen_julian_rdp:
    You've read Julian's connection file. Now take a copy of it.
- not has_julian_rdp:
    Delphine's desktop had a saved connection on it. Copy it, don't connect from there.
- not front_desk_signed_out and not done_t_julian_pc:
    Sign out of Delphine's PC before you use that file. Leave no trace.
- not done_t_julian_pc:
    Open your keyring and use Julian's saved connection.
- tour_full and julian_lost_with_desk and not julian_back and not done_t_door_controller and not done_t_copy_badge:
    Julian's session went when you signed out at the front desk.
    Connect again from your keyring and it'll go through the box this time, or carry on to Lorna.
- tour_full and not done_t_door_controller:
    With Julian's session up, the box can see further. Open the network view at the box and try the door controller, with Lorna's password.
- tour_full and not done_t_server_room:
    You've got the codes. Server room's at the back of the open plan.
- not done_t_copy_badge:
    Have a word with Lorna by the comms door. Bring the cloner.
- not done_t_comms:
    Lorna's card should open the comms cupboard. Try it.
- not saw_in_use and not done_t_open_session:
    Thandiwe's at her desk in the open plan. Try her laptop, then watch what happens when she gets up.
- tour_full and not done_t_yasmin_pc:
    Next time Yasmin's away from her desk, have a look at her screen. The coffee rota gets people moving.
- tour_full and not done_t_implant:
    Back to the front desk. Delphine's PC has a spare USB port or two.
- tour_full and not staff_twin_up:
    The plants in reception have room for one more gadget.
- tour_full and not done_t_capture_key:
    Give it a moment. Thandiwe's about to check her email. If she's busy, pull the box when you're ready: the Wi-Fi stops still work after.
- tour_full and not done_t_staff_wifi:
    You've got the Staff key. Join the Staff Wi-Fi and compare it with the guest one.
- not done_t_unplug:
    When you've had enough, pull the box out and see what drops.
- tour_full and not done_t_guest_port:
    Take the box to the comms cupboard. Try the managed port, then the patch panel.
- else:
    That's the lot. Come and find me at reception.
}
-> hub

// ---- Timed-text follow-ups: one short line, then back to the hub ----
=== hint_cake ===
Open plan is north of reception. Thandiwe and Yasmin sit there, so that's where it will get them out of their chairs.
-> hub

=== hint_sign_out ===
Do that first and the connection goes through the box instead.
-> hub

=== hint_open_session ===
The cake works too, if you want it done your way. The rota board is the sure way.
-> hub

=== hint_network_view ===
The box sits on the office network now. The view lists what it can see from there.
-> hub

=== hint_injector ===
The injector in your kit presents as a keyboard. The socket by the desk takes it.
-> hub

=== hint_patch_panel ===
The panel has a spare port. Plug in and see where it lands.
-> hub

=== debrief_ready ===
I'll be at reception.
-> hub

=== hint_ports ===
There's a managed port and a patch panel on the cupboard wall. Try both.
-> hub
