# Bug Fix: Event Cooldown Zero Bug

## The Problem

When setting `"cooldown": 0` in an event mapping, the event would be treated as if cooldown was undefined and default to 5000ms (5 seconds). This prevented events from firing immediately.

**Console output showed:**
```
⏸️ Event lockpick_used_in_view on cooldown (2904ms remaining)
```

Even though the scenario JSON had:
```json
{
  "eventMappings": [
    {
      "eventPattern": "lockpick_used_in_view",
      "targetKnot": "on_lockpick_used",
      "conversationMode": "person-chat",
      "cooldown": 0  // ← This should mean NO COOLDOWN
    }
  ]
}
```

## Root Cause

**File:** `js/systems/npc-manager.js`, line 359

**Original code:**
```javascript
const cooldown = config.cooldown || 5000;
```

**The Issue:**
In JavaScript, `0` is a **falsy value**. So when `config.cooldown` is `0`:
- `0 || 5000` evaluates to `5000` (the `||` operator returns the first truthy value)
- This is called the "falsy coercion bug"

## The Solution

**Fixed code:**
```javascript
const cooldown = config.cooldown !== undefined && config.cooldown !== null ? config.cooldown : 5000;
```

**How it works:**
- Explicitly check if `config.cooldown` is defined and not null
- If it is defined (including `0`), use that value
- Only use the default `5000` if cooldown is actually undefined or null

## Why This Matters

The `||` operator works well for string/object defaults but fails for numeric falsy values like:
- `0` (zero)
- `false`
- Empty string `""`

**Best practice:** When dealing with numeric configs, always check explicitly for undefined/null:
```javascript
// ❌ BAD - Won't work for 0, false, ""
const value = config.value || defaultValue;

// ✅ GOOD - Works for all values including 0
const value = config.value !== undefined ? config.value : defaultValue;

// ✅ GOOD - Modern JavaScript nullish coalescing
const value = config.value ?? defaultValue;
```

## Affected Functionality

This bug affected:
- Event cooldown: 0 settings (immediate events)
- Any numeric config that could legitimately be 0

## Testing

**Before fix:**
```
cooldown: 0 in JSON → Event fires with 5000ms delay ❌
```

**After fix:**
```
cooldown: 0 in JSON → Event fires immediately ✅
```

To test:
1. Set `"cooldown": 0` in eventMappings
2. Trigger the event multiple times rapidly
3. Should fire every time (no cooldown)

## Related Code Locations

- **Bug location:** `js/systems/npc-manager.js:359`
- **Usage:** Event mapping cooldown handling
- **Similar patterns:** Check for other `||` uses with numeric values

## Lesson Learned

When providing numeric configuration values in JSON, always use explicit null/undefined checks rather than truthy coercion operators (`||`). Consider using modern JavaScript nullish coalescing (`??`) operator instead.

---

**Fixed:** 2025-11-14
**Commit:** Fix cooldown: 0 bug - explicit null/undefined check
