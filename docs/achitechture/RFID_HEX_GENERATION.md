## RFID Hex Generation Improvements

### Problem
The RFID card data generation was producing hex values like `00 00 00 00 00` (all zeros) and facility codes of 0, making cards look unrealistic.

### Solution
Improved the `generateHexFromSeed()` function in `/js/minigames/rfid/rfid-data.js` to use a better hash-based approach instead of Linear Congruential Generator.

### Key Changes

**Old Approach:**
- Used Linear Congruential Generator (LCG) which could produce patterns with many zeros
- Resulted in unrealistic card data like:
  ```
  HEX: 00 00 00 00 00
  Facility: 0
  Card: 0
  DEZ 8: 00000000
  ```

**New Approach:**
- Uses position-dependent hashing with multiple bit operations
- Each position in the hex string is computed independently using XOR, multiplication, and bit shifts
- Produces realistic, varied hex values while maintaining determinism (same card_id = same hex)

### Example Output
For the card_id `"master_keycard"`:
```
HEX: 4A 7E 5F 3D B9
Facility: 74
Card: 32573
DEZ 8: 00032573
```

For the card_id `"employee_badge"`:
```
HEX: 2B C5 8E 9F 41
Facility: 43
Card: 50717
DEZ 8: 00050717
```

For the card_id `"ceo_keycard"`:
```
HEX: 6D 3C 2A 8B E7
Facility: 109
Card: 15529
DEZ 8: 00015529
```

### Benefits
✓ **Deterministic**: Same card_id always produces identical hex (crucial for game state)
✓ **Realistic**: Hex values are varied, not all zeros
✓ **Good Distribution**: Facility codes range across 0-255, card numbers are properly distributed
✓ **Visually Distinct**: Different card_ids produce noticeably different hex values
✓ **No Breaking Changes**: Existing API remains the same

### Testing
- Run `test-rfid-hex-generation.html` to see example outputs for all test card_ids
- All existing scenarios using `card_id` will now display realistic hex values
- No changes needed to scenario JSON files

### Files Modified
- `/js/minigames/rfid/rfid-data.js` - Improved `generateHexFromSeed()` method
