---
title: "SAFETYNET Field Guide: Lockpicking"
organization: "SAFETYNET"
classification: "OPERATIONAL"
author: ["Agent HaX", "Adapted from SAFETYNET Training Materials"]
source: "scenarios/m01_first_contact/lab_sheet/lockpicking.md"
license: "CC BY-SA 4.0"
---

# Handler Note — Agent HaX

You've got the kit. Now you need to know how to use it.

Lockpicking isn't brute force. It's a diagnostic skill—you're reading the lock by feel and responding to what it tells you. A lock that resists doesn't need more pressure; it needs less.

The technique below is the same whether you're doing a physical security assessment or getting through a door that's blocking your mission. Learn the principle, not just the steps.

— HaX

---

# SAFETYNET Field Guide Extract: Lockpicking

## How Pin Tumbler Locks Work

The majority of locks you'll encounter are **pin tumbler locks**. Understanding the mechanism is the foundation of picking them.

Inside the lock cylinder there are several spring-loaded pin stacks. Each stack has two pins: a **key pin** (bottom) and a **driver pin** (top). When no key is inserted, the driver pins cross the **shear line** — the gap between the rotating plug and the fixed housing — which is what prevents the lock from turning.

When the correct key is inserted, each cut on the key lifts its corresponding pin stack to exactly the right height, aligning all key/driver pin boundaries precisely at the shear line. With all pins aligned, nothing is crossing the shear line, and the plug rotates freely.

**Picking exploits a manufacturing tolerance**: in a real lock, the pin chambers are not perfectly aligned. When you apply rotational pressure, one pin's chamber will bind slightly before the others. That binding pin can be set — lifted to the shear line and held there by friction — while you move on to the next.

---

## The Two-Tool Method

Lockpicking requires two tools working together:

**Tension wrench** — A small L-shaped or curved tool inserted at the bottom of the keyway. You apply light rotational pressure with it, in the direction the key would turn. This creates the binding that lets you set pins one at a time.

**Pick** — Inserted above the tension wrench. You use it to probe, lift, and set individual pins.

The critical variable is **tension**. Too much and the pins can't move. Too little and set pins drop back. The right amount is lighter than you think — enough to feel resistance, not enough to grip.

---

## The Picking Procedure

### Step 1 — Apply tension

Insert the tension wrench into the bottom of the keyway. Apply light rotational pressure in the direction the key would turn. Maintain this throughout. The plug will try to rotate and catch on the first binding pin.

### Step 2 — Locate the binding pin

Insert your pick above the wrench and probe the pins. Most will feel springy and bouncy — they return freely. The binding pin feels stiffer and heavier. That's your target.

### Step 3 — Set the binding pin

Lift the binding pin gently until you feel a faint click and a small rotation of the plug. The pin is now sitting at the shear line, held by friction from your tension. Do not release tension.

### Step 4 — Find the next binding pin

With the first pin set, another pin takes over as the new binding pin. Probe again. It will feel stiffer than the others. Lift and set it the same way.

### Step 5 — Repeat until open

Continue until all pins are set. When the last pin reaches the shear line, nothing is blocking rotation and the plug turns freely — the lock is open.

**If a pin drops**: you applied too much lift, reset the pin above the shear line, or released tension. Ease off tension slightly, let the dropped pin return to its resting position, and continue from that pin.

---

## Tips

- **Tension is everything.** If pins won't set, you're using too much pressure. If set pins keep dropping, you're using too little. Find the minimum that holds.
- **Work the binding pin, not all pins.** Trying to lift every pin simultaneously doesn't work. Find the one that's binding and set it.
- **Slower is faster.** Rushing resets pins. A methodical pass takes less total time than starting over repeatedly.
- **Harder locks have security pins.** Spool and serrated pins give false sets — the plug rotates slightly as if set, then stops. If you get a partial rotation that stalls, treat it as a false set: hold tension, keep probing. Real set pins stay; security pins need an extra nudge over the step.

---

## In the Field

> **[GAMEPLAY NOTE]** The following describes how this technique is simulated in your current operational environment. The underlying principles are the same.

Your kit includes a tension wrench and pick. When you approach a pickable lock:

1. **Click the tension wrench** to engage it. The plug will show a small rotation as tension is applied.

2. **The binding pin is highlighted** — the lock simulation identifies which pin is currently binding based on the plug position. Focus on that pin.

3. **Lift the highlighted pin** until it sets. You'll see it lock at the shear line and hear the click. The plug rotates slightly.

4. **Repeat** for each subsequent binding pin. The highlight will move to the next one.

If you disengage tension at any point, set pins drop and you restart from the current state. Maintain tension throughout each picking pass.

Lock difficulty in the field is determined by the number of pins and whether security pins are present. More pins means more passes; security pins require careful tension management through the false set.

---

**Adapted from**: SAFETYNET Training Materials (Physical Security and Access module)  
**For**: SAFETYNET Operatives  
**Classification**: Field Use
