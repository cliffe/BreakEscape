// ================================================
// Mission 1: First Contact - CyberChef Workstation
// Server Room - Encoding/Decoding Tutorial
// Tutorial: Base64 decoding, encoding vs encryption
// ================================================

VAR decoded_whiteboard = false
VAR learned_encoding = false
VAR first_use = true

// External variables
EXTERNAL player_name

// ================================================
// START: CYBERCHEF TERMINAL
// ================================================

=== start ===
{first_use:
    ~ first_use = false
    -> first_access
}
{not first_use:
    -> hub
}

// ================================================
// FIRST ACCESS (Tutorial)
// ================================================

=== first_access ===
CYBERCHEF WORKSTATION
Data Transformation & Analysis Tool

This tool helps decode and analyze data. Perfect for messages that aren't encrypted, just encoded.

+ [What's the difference between encoding and encryption?]
    -> encoding_tutorial
+ [I have something to decode]
    -> hub

// ================================================
// ENCODING VS ENCRYPTION TUTORIAL
// ================================================

=== encoding_tutorial ===
~ learned_encoding = true

ENCODING vs. ENCRYPTION:

Encoding transforms data for compatibility or readability (Base64, URL encoding).

Encryption transforms data for secrecy using keys (AES, RSA).

Key difference: Encoding is reversible by anyone. Encryption requires a key.

+ [So Base64 isn't secure?]
    -> base64_explanation
+ [Got it. Let me decode something]
    -> hub

=== base64_explanation ===
Exactly. Base64 is just a way to represent binary data in ASCII text.

It's used for compatibility, not security. Anyone can decode it instantly.

If you see Base64, it's likely obfuscation, not real encryption.

-> hub

// ================================================
// WORKSTATION HUB
// ================================================

=== hub ===
CYBERCHEF > Select operation

+ {not decoded_whiteboard} [Decode Base64 message from whiteboard]
    -> decode_whiteboard_message
+ {not learned_encoding} [Learn about encoding vs encryption]
    -> encoding_tutorial
+ [Exit workstation]
    #exit_conversation
    Workstation session closed.
    -> hub

// ================================================
// DECODE WHITEBOARD MESSAGE
// ================================================

=== decode_whiteboard_message ===
Enter Base64 string from Derek's whiteboard:

[Player enters: Q2xpZW50IGxpc3QgdXBkYXRlOiBDb29yZGluYXRpbmcgd2l0aCBaRFMgZm9yIHRlY2huaWNhbCBpbmZyYXN0cnVjdHVyZQ==]

+ [Q2xpZW50IGxpc3QgdXBkYXRlOiBDb29yZGluYXRpbmcgd2l0aCBaRFMgZm9yIHRlY2huaWNhbCBpbmZyYXN0cnVjdHVyZQ==]
    -> whiteboard_decoded
+ [Different string]
    -> decode_retry

=== whiteboard_decoded ===
~ decoded_whiteboard = true
#complete_task:decode_whiteboard

DECODING... Base64 → ASCII

DECODED MESSAGE:
"Client list update: Coordinating with ZDS for technical infrastructure"

Analysis: "ZDS" likely refers to Zero Day Syndicate, known ENTROPY cell.

"Technical infrastructure" suggests exploit coordination for disinformation campaign.

#speaker:agent_0x99

Agent 0x99: Good find. Derek's coordinating with Zero Day Syndicate. That's a dangerous partnership.

Agent 0x99: Use this intel to guide your VM investigation. Look for technical infrastructure on the compromised server.

-> hub

=== decode_retry ===
ERROR: Invalid Base64 string

Check Derek's whiteboard carefully. Copy the entire Base64 string exactly as written.

-> hub
