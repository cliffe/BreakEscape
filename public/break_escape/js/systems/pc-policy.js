/**
 * (No apostrophes in this file: some node tests inline it as a data: URL inside a quoted import.)
 * The USB policy (ACCESS_MODEL_SLICE_9_2_PLAN.md section 7, sub-slice U). Pure, with no imports,
 * so node tests load it directly. The `policy` of a PC (else the scenario `defaultPolicy`) may say
 * `usb`: `allowed` (the default), `storage_blocked` or `blocked`. An item with `usbClass`
 * (`storage` or `hid`) is subject to it; an item without one is never refused. Only an object that
 * is a workstation by its own fields, or that names a `policy` itself, is governed, so a default
 * policy never makes a tray, a shredder or a printer refuse a memory stick.
 *
 * The module also sets window.pcPolicy to the same functions, which the needs adapter reads
 * (npc-needs.js keeps its rule of no imports).
 */

export const USB_VALUES = Object.freeze(["allowed", "storage_blocked", "blocked"]);
export const USB_CLASSES = Object.freeze(["storage", "hid"]);

export const USB_REFUSAL_LINES = Object.freeze({
    storage_blocked: "USB storage is disabled on this PC.",
    blocked: "USB devices are disabled on this PC."
});

/** workstation-state.js isWorkstation, copied (that module reads window at load). */
function isWorkstationData(data) {
    return !!data && typeof data === "object" && !!data.id &&
        (data.workstation === true || data.locksScreenOnLeave !== undefined || data.lockChance !== undefined ||
         data.lockType === "login");
}

/** The object own policy, else the scenario defaultPolicy, as workstation-state.js policyFor resolves it; none: null. */
export function effectivePolicy(objectData, scenario) {
    const sc = scenario && typeof scenario === "object" ? scenario : {};
    const name = (objectData && typeof objectData.policy === "string" && objectData.policy) || sc.defaultPolicy;
    const p = name && sc.policies && typeof sc.policies === "object" ? sc.policies[name] : null;
    return p && typeof p === "object" ? p : null;
}

/** Whether a usb policy governs this object: a workstation by its own fields, or one naming a policy. */
export function usbGoverned(objectData) {
    if (!objectData || typeof objectData !== "object") return false;
    return isWorkstationData(objectData) || (typeof objectData.policy === "string" && !!objectData.policy);
}

/** The table of section 7: true when `usb` refuses an item of `usbClass`. */
export function usbRefused(usb, usbClass) {
    if (!USB_CLASSES.includes(usbClass)) return false;
    if (usb === "blocked") return true;
    if (usb === "storage_blocked") return usbClass === "storage";
    return false;
}

/** The effective `usb` value for an object ("allowed" when its policy says nothing), or null when not governed. */
export function usbPolicyFor(objectData, scenario) {
    if (!usbGoverned(objectData)) return null;
    const p = effectivePolicy(objectData, scenario);
    const v = p?.usb;
    return USB_VALUES.includes(v) ? v : "allowed";
}

/** The usbClass of a held inventory item (its scenarioData, or the item itself). */
function classOf(item) {
    const d = item?.scenarioData || item || {};
    return typeof d.usbClass === "string" ? d.usbClass : null;
}

/**
 * The plant decision of the player. `heldItems` are the held items that match the object
 * requiresItem, in inventory order. Returns { item, refusal }: the first item the policy of the object
 * accepts and refusal null; or, when every matching item is refused, item null and the refusal
 * line (and `usbClass` of the first refused item). With no items: { item: null, refusal: null }.
 */
export function plantRefusal(heldItems, objectData, scenario, { admin = false } = {}) {
    const list = Array.isArray(heldItems) ? heldItems.filter(Boolean) : [];
    if (!list.length) return { item: null, refusal: null };
    // The server decides the level; only a strict true overrides the policy.
    if (admin === true) return { item: list[0], refusal: null };
    const usb = usbPolicyFor(objectData, scenario);
    if (!usb) return { item: list[0], refusal: null };
    const ok = list.find(it => !usbRefused(usb, classOf(it)));
    if (ok) return { item: ok, refusal: null };
    return { item: null, refusal: USB_REFUSAL_LINES[usb] || USB_REFUSAL_LINES.blocked, usbClass: classOf(list[0]), refusedItem: list[0] };
}

/**
 * The PC a session-shaped device is judged at: the pc of the first grant_foothold with needsSession in
 * the object triggerOnInteract, walked depth-first in list order into confirm_action onConfirm lists.
 * A grant with a condition counts (the walk ignores conditions). None: null. A grant with no usable pc (not a non-empty string) is skipped, as the validator
 * warning (c) does. Mirrors the server session_grant_pc.
 */
function grantPcIn(actions) {
    if (!Array.isArray(actions)) return null;
    for (const action of actions) {
        if (!action || typeof action !== "object") continue;
        if (action.type === "grant_foothold" && action.needsSession && typeof action.pc === "string" && action.pc.trim()) {
            return action.pc;
        }
        if (action.type === "confirm_action") {
            const found = grantPcIn(action.onConfirm);
            if (found) return found;
        }
    }
    return null;
}

export function sessionGrantPc(objectData) {
    if (!objectData || typeof objectData !== "object") return null;
    return grantPcIn(objectData.triggerOnInteract);
}

/** Whether the object policy refuses this item (a gated remove): the same test the plant uses. */
export function gatedRemove(item, objectData, scenario) {
    return usbRefused(usbPolicyFor(objectData, scenario), classOf(item));
}

const pcPolicy = Object.freeze({ effectivePolicy, usbGoverned, usbRefused, usbPolicyFor, plantRefusal, sessionGrantPc, gatedRemove, USB_REFUSAL_LINES });
if (typeof window !== "undefined") window.pcPolicy = pcPolicy;
export default pcPolicy;
