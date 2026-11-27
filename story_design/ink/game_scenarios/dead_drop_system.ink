// ENTROPY Dead Drop Communication System
// Reusable explanation for game scenarios

=== haxolottle_explains_dead_drops ===
Haxolottle: Let me tell you about ENTROPY's communication method, little axolotl.

Haxolottle: They don't use email or phones - too easy to intercept. Instead, they use "dead drops."

Haxolottle: They hide encoded messages in compromised systems as flag strings.

Haxolottle: When you see flag{distcc_backdoor_active}, that's not just a trophy. It's a signal.

Haxolottle: It tells the next operative: "This system is compromised and ready for the next phase."

+ [So flags are coordination signals?]
    Haxolottle: Exactly! And here's the beautiful part - they're hiding in plain sight.
    Haxolottle: To most people, flag{...} looks like a CTF artifact, test data, developer placeholder.
    Haxolottle: But to ENTROPY, it's operational communication.
    -> explain_extraction

= explain_extraction
Haxolottle: Your job is to intercept these dead drops before the next ENTROPY operative finds them.

Haxolottle: Extract the flag, and their coordination breaks down.

Haxolottle: Plus, we can analyze the message format to understand their operational timeline.

+ [I'll intercept every message.]
    Haxolottle: That's the spirit! Break their communication chain.
    -> DONE
