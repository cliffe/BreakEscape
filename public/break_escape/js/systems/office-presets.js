/**
 * Office-life affordance presets (OFFICE_LIFE_PLAN 2.1, slice 4).
 *
 * With "officePresets": true on the scenario, a declared object gets a working needs affordance
 * from its exact `type` (or its `officeType`, a preset id, which wins over `type`). The object's
 * own `affordance` fields win field by field; `affordance: false` opts it out.
 *
 * Never preset: an object with no scenario `id` or with `decor: true` (unreserved Tiled items get
 * a synthetic scenarioData whose type is the image name, so decor `laptop6.png` reads as
 * "laptop"), anything `takeable`, anything with a `lockType`. Presets set no `seat` and never
 * make a workstation (workstation-state.js reads `workstation`/`locksScreenOnLeave`/`lockChance`
 * from the object itself).
 *
 * The table is js/data/office-presets.json, fetched once by loadOfficePresets() before the needs
 * system installs; node tests and the validator read the same file. No imports.
 */

let TABLE = null;     // { presets: { id: { types: [], affordance: {} } } }
let BY_TYPE = null;   // type -> preset id

/** Install a table (node tests pass the parsed JSON). Returns it. */
export function setOfficePresetTable(table) {
    TABLE = table && typeof table === 'object' && table.presets ? table : null;
    BY_TYPE = new Map();
    for (const [id, p] of Object.entries(TABLE?.presets || {})) {
        for (const t of p.types || []) BY_TYPE.set(t, id);
    }
    return TABLE;
}

export function officePresetTable() { return TABLE; }

/** Fetch the table next to this module (js/data). Resolves to the table, or null on failure. */
export async function loadOfficePresets(fetchFn = (typeof fetch === 'function' ? fetch : null)) {
    if (TABLE) return TABLE;
    if (!fetchFn) return null;
    const url = new URL('../data/office-presets.json', import.meta.url);
    const res = await fetchFn(url.href);
    if (!res.ok) throw new Error(`office presets: HTTP ${res.status}`);
    return setOfficePresetTable(await res.json());
}

export function presetsOn(scenario) { return scenario?.officePresets === true; }

/**
 * The preset id an object would get, ignoring the scenario switch; null when excluded or
 * unmatched. An unknown officeType gets none (the validator reports it).
 */
export function presetIdFor(sd, table = TABLE) {
    if (!sd || typeof sd !== 'object' || !table?.presets) return null;
    if (typeof sd.id !== 'string' || !sd.id || sd.decor === true) return null;
    if (sd.affordance === false || sd.takeable === true || sd.lockType) return null;
    if (typeof sd.officeType === 'string') return table.presets[sd.officeType] ? sd.officeType : null;
    const index = table === TABLE ? BY_TYPE : null;
    if (index) return index.get(sd.type) || null;
    for (const [id, p] of Object.entries(table.presets)) if ((p.types || []).includes(sd.type)) return id;
    return null;
}

const copy = v => (Array.isArray(v) ? [...v] : (v && typeof v === 'object' ? { ...v } : v));

/**
 * The affordance an object has: its authored object over its preset (presets on), `false`
 * meaning none. Returns a fresh object, or null.
 */
export function resolveAffordance(sd, scenario, table = TABLE) {
    if (!sd || sd.affordance === false) return null;
    const own = sd.affordance && typeof sd.affordance === 'object' ? sd.affordance : null;
    if (!presetsOn(scenario)) return own;
    const pid = presetIdFor(sd, table);
    if (!pid) return own;
    const out = {};
    for (const [k, v] of Object.entries(table.presets[pid].affordance || {})) out[k] = copy(v);
    if (own) Object.assign(out, own);
    return out;
}

/**
 * resolveAffordance for a live sprite, cached on it (sp._officeAffordance) while the scenario
 * switch, the table and the authored affordance stay the same; cleared when presets are off.
 */
export function spriteAffordance(sp, scenario) {
    const sd = sp?.scenarioData;
    if (!sd) return null;
    if (!presetsOn(scenario)) {
        if (sp._officeAffordance) sp._officeAffordance = null;
        return sd.affordance && typeof sd.affordance === 'object' ? sd.affordance : null;
    }
    const c = sp._officeAffordance;
    if (c && c.sd === sd && c.own === sd.affordance && c.table === TABLE) return c.value;
    const value = resolveAffordance(sd, scenario);
    sp._officeAffordance = { sd, own: sd.affordance, table: TABLE, value, preset: presetIdFor(sd) };
    return value;
}

/** The preset id a live sprite resolved to (presets on), else null. */
export function spritePreset(sp, scenario) {
    if (!presetsOn(scenario)) return null;
    spriteAffordance(sp, scenario);
    return sp?._officeAffordance?.preset || null;
}
