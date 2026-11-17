// Ama Owusu on the player's phone. The "Where next?" hub names the next open step from the
// scenario globals (first unmet wins; the F lines only on the full walk-round). Required steps (Lorna, comms cupboard, the unplug) sit ahead of the optional ones, and W6b and W7 are hidden once the box is unplugged. Timed texts
// arrive from eventMappings on ama_phone and open the knots below, which add one short
// follow-up line and then go back to the hub. KEEP the knot names: hint_cake, hint_sign_out,
// hint_open_session, hint_network_view, hint_injector, hint_ports.
// Phone lines take no speaker prefix for Ama. Text only for now; no {var} in a spoken line.

VAR tour_full = false
VAR seen_julian_rdp = false
VAR has_julian_rdp = false
VAR front_desk_signed_out = false
VAR julian_lost_with_desk = false
VAR julian_back = false
VAR saw_in_use = false
VAR staff_twin_up = false
VAR ap_planted = false
VAR told_skip = false
VAR last_w = 0
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
Ask me where next when you need it.
-> hub

=== hub ===
+ [Where next?]
    -> where_next
+ [Thanks.]
    Any time.
    -> hub

=== where_next ===
~ temp tail = false
~ temp w = 0
{
- not done_t_kit:
    Kit first. Meeting room, just off reception.
- not done_t_drop_box:
    There's a live port by the kit table. Plug the box in before you go anywhere else.
- not done_t_front_desk:
    Delphine's front desk next. Have a look round the screen.
- not has_julian_rdp and seen_julian_rdp and not done_t_julian_pc:
    You've read Julian's connection file. Now take a copy of it.
- not has_julian_rdp and not done_t_julian_pc:
    Delphine's desktop had a saved connection on it. Copy it, don't connect from there.
- not front_desk_signed_out and not done_t_julian_pc:
    Sign out of Delphine's PC before you use that file, so the connection has to go through the box.
- not done_t_julian_pc:
    Open your keyring and use Julian's saved connection.
- not done_t_copy_badge:
    Have a word with Lorna by the comms door. Bring the cloner.
- not done_t_comms:
    Your copy of Lorna's card should open the comms cupboard. Try it.
- tour_full and julian_lost_with_desk and not julian_back and not done_t_door_controller and not done_t_unplug and has_julian_rdp:
    Julian's session went when you signed out at the front desk.
    If you're signed in at the front desk again, sign out. Then connect from your keyring.
    It goes through the box that way, and you'll need it for the door controller.
    ~ tail = true
    ~ w = 6
- tour_full and julian_lost_with_desk and not julian_back and not done_t_door_controller and not done_t_unplug:
    Julian's session went when you signed out at the front desk.
    To get it back through the box, sign in there, copy his connection file, sign out, then connect from your keyring.
    ~ tail = true
    ~ w = 6
- tour_full and not done_t_door_controller and not done_t_unplug and (not julian_lost_with_desk or julian_back):
    With Julian's session up, his PC can reach the server network.
    Open the network view at the box and try the door controller, with Lorna's password from facilities.txt.
    ~ tail = true
    ~ w = 7
- tour_full and done_t_door_controller and not done_t_server_room:
    You've got the codes. Server room's at the back of the open plan.
    ~ tail = true
    ~ w = 8
- not saw_in_use and not done_t_open_session:
    Thandiwe's at her desk in the open plan. Try her laptop, then watch what happens when she gets up.
    ~ tail = true
    ~ w = 11
- tour_full and not done_t_yasmin_pc:
    Next time Yasmin's away from her desk, have a look at her screen. The coffee rota gets people moving.
    ~ tail = true
    ~ w = 12
- tour_full and not done_t_implant and front_desk_signed_out:
    Back to the front desk. Sign in again, then see what Delphine's USB ports will take.
    ~ tail = true
    ~ w = 13
- tour_full and not done_t_implant:
    Back to the front desk. See what Delphine's USB ports will take.
    ~ tail = true
    ~ w = 13
- tour_full and not ap_planted:
    Hide the access point in one of the reception plants, then open its console and copy the Staff Wi-Fi.
    ~ tail = true
    ~ w = 14
- tour_full and not staff_twin_up:
    The access point's in. Open its console from the plant and copy the Staff Wi-Fi.
    ~ tail = true
    ~ w = 17
- tour_full and not done_t_capture_key:
    Give it a moment. Thandiwe's about to check her email. Walk into the open plan and her laptop should join your copy.
    { not done_t_unplug:
        If she doesn't, carry on. The Wi-Fi stops still work after the box comes out.
    - else:
        If she doesn't, carry on to the comms cupboard and come back.
    }
    ~ w = 15
- tour_full and not done_t_staff_wifi:
    You've got the Staff key. Join the Staff Wi-Fi and compare it with the guest one.
    ~ tail = true
    ~ w = 16
- not done_t_unplug:
    When you've had enough, pull the box out and see what drops.
- tour_full and not done_t_guest_port:
    Take the box to the comms cupboard. Try the managed port, then the patch panel.
- else:
    That's the lot. Come and find me at reception.
}
{ not done_t_unplug and w > 0 and ((tail and not told_skip) or w == last_w):
    ~ told_skip = true
    Skip any of that you like, and pull the box out when you're ready.
}
~ last_w = w
-> hub

// ---- Timed-text follow-ups: one short line, then back to the hub ----
=== hint_cake ===
Open plan is north of reception. Thandiwe and Yasmin sit there, so that's where it will get them out of their chairs.
-> hub

=== hint_sign_out ===
Do that first and the connection goes through the box instead.
-> hub

=== hint_open_session ===
The cake might do it too, if she's hungry. The rota board always works.
-> hub

=== hint_network_view ===
The box sits on the office network now. The view lists what it can see from there.
-> hub

=== hint_injector ===
The injector in your kit presents as a keyboard. The socket by the desk takes it.
-> hub

=== hint_ports ===
There's a managed port and a patch panel on the cupboard wall. Try both.
-> hub
