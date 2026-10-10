# Handler Note — Agent HaX

You've reached the point where intelligence is hidden in plain sight.

Your objective right now is to turn encoded notes into usable operational data quickly and reliably. In this mission, the common patterns are Base64 and shift-style substitution (ROT13).

Do not guess. Identify the pattern, apply the right CyberChef recipe, verify the output, then act on what you recover.

- HaX

---

# SAFETYNET Field Guide Extract: Encoding and Decoding with CyberChef

## Brief Summary: What Encoding Means

Encoding changes how data is represented so it can be stored, transmitted, or processed reliably.

- Encoding is reversible by design.
- Encoding does not require a secret key.
- Encoding is not encryption.

In practical terms:
- If data was encoded, you can decode it with the right method.
- If data was encrypted, you normally need a key/password first.

When you are triaging mission notes, this distinction saves time.

---

## Quick Pattern Identification

Use these checks before touching tools.

### Pattern A: Likely Base64
- Characters are mostly letters, numbers, `+`, `/`
- Often ends with `=` or `==`
- Looks compact and blocky

### Pattern B: Likely ROT13 (shift cipher)
- Spaces and punctuation still look normal
- Word lengths look realistic
- Letters are scrambled but structure looks sentence-like

If uncertain, test both methods in CyberChef. Confirm output quality before using it.

---

## CyberChef Fast Workflow

1. Paste the suspicious text into CyberChef input.
2. Add one recipe only (start simple).
3. Decode and inspect output for human-readable meaning.
4. If output still looks wrong, reset and try alternate method.
5. Save recovered values exactly as shown (respect case, symbols, spacing).

### Recipe for Base64
- Operation: `From Base64`
- Input: encoded string
- Expected result: clear text, credentials, hints, or numeric values

Kali alternative:
```bash
echo "TWVldCBhdCB0aGUgc2VydmVyIHJvb20=" | base64 -d
```

### Recipe for ROT13
- Operation: `ROT13`
- Input: scrambled sentence-like text
- Expected result: readable sentence with intact punctuation/spacing

Kali alternative:
```bash
echo "Qrexr vf gur yrny" | tr 'A-Za-z' 'N-ZA-Mn-za-m'
```

---

## Mission-Relevant Application (M01)

In Mission 1, encoded notes are used to hide key operational details (for example, lock values, reminders, and access clues).

Your process should be:
1. Identify whether note shape fits Base64 or ROT13.
2. Decode using CyberChef.
3. Extract only actionable values (pins, usernames, password hints, or file clues).
4. Re-test values exactly; do not normalize or "improve" them.

This keeps progression fast and avoids lockout from formatting mistakes.

---

## Common Failure Modes and Recovery

- Failure: Tried decoding but output is gibberish.
  Recovery: Check that you used the correct recipe. Base64 text passed through ROT13 (or vice versa) will look wrong.

- Failure: Output contains extra characters or line breaks.
  Recovery: Copy raw output carefully. Remove accidental trailing spaces introduced by clipboard/editor.

- Failure: Value looks right but access still fails.
  Recovery: Re-enter exactly. Check case, punctuation, and digits. Verify you used the decoded value, not the encoded original.

- Failure: Unsure if text is encoding or encryption.
  Recovery: If no key is required and a standard recipe produces meaningful plaintext, treat it as encoding.

---

## Validation Checklist

Before you move on, confirm all items below:

- I identified a likely encoding pattern before decoding.
- I used the simplest matching CyberChef recipe first.
- I got meaningful plaintext output.
- I copied operational values exactly.
- I applied decoded intel to the next objective.

If all five are true, continue mission execution.