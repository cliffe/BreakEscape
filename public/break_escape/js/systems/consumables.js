/**
 * Consumables heal the player (7.1c; m07 E3; user, 2026-10-16: "Make coffee
 * cups and other consumables health boosts"). Out of combat a slow regen
 * (player-regen.js) brings HP back to half; above that only consumables help.
 *
 * Which objects count:
 *   - any object with a positive `healAmount` (the scenario's number wins);
 *     `healAmount: 0` opts an object out;
 *   - any object with `consumable: true` (its type's default, else 15);
 *   - a takeable item whose type is a known consumable (coffee, energy drink,
 *     water bottle, snack, sandwich, first aid kit), once it is in the
 *     inventory;
 *   - a cup of coffee or tea standing in a room (the DRINKABLE_CUPS sprites),
 *     whether it is room-map decor or a scenario object, unless the scenario
 *     gives it a role (a fingerprint, contents, a lock, text, a trigger, a
 *     puzzle-graph entry). m05's fingerprinted mug on Torres' desk stays
 *     evidence: drinking it would lose the only print surface for him. Empty
 *     dirty mugs, coffee machines and water coolers are not cups.
 *
 * Using one heals by its amount (capped at max HP), shows a toast and uses it
 * up: an inventory item leaves the inventory (and the server's copy), a world
 * object leaves the room. At full health a snack or first aid kit is kept.
 *
 * Coffee and tea (user, 2026-10-27: "coffee cups should always be drunk, with
 * a gulp sound, whether or not you're damaged or the mission has combat") are
 * always drunk: a sound, the cup used up, and the heal applied if it helps. In
 * a scenario with "disableAttacks" the message says nothing about health.
 * There is no gulp clip in the assets, so DRINK_SOUND is the closest existing
 * item-interaction sound.
 *
 * Kept free of imports so it can be tested in isolation.
 */

// Default heal per consumable type, matched on the start of the type name.
// A plain mug or cup (often evidence, or empty) is not a consumable unless the
// scenario says so with healAmount or consumable: true.
export const DEFAULT_HEAL_BY_TYPE = [
  [/^(coffee|tea)/, 15],
  [/^(energy|soda|cola|drink_can)/, 20],
  [/^water_bottle/, 10],
  [/^(sandwich|lunch)/, 25],
  [/^(snack|chocolate|biscuit|crisps|apple|banana|donut|doughnut|muffin|cereal_bar)/, 15],
  [/^(first_aid|medkit|bandage)/, 40]
];
export const GENERIC_HEAL = 15;

// No gulp clip exists; this is the short item-interaction sound (sound-manager.js)
export const DRINK_SOUND = 'item_interact_2';

// Cups of coffee or tea in rooms (user, 2026-10-22: "any coffee cups in rooms
// are consumed for health"), by sprite name: what the hover says and the heal.
export const CUP_HEAL = 20;
export const DRINKABLE_CUPS = {
  'office-misc-cup': 'Cup of coffee',
  'office-misc-cup2': 'Mug of coffee',
  'office-misc-cup3': 'Mug of coffee',
  'office-misc-cup4': 'Glass of tea',
  'office-misc-cup5': 'Iced coffees',
  'coffee_cups1': 'Takeaway coffees',
  'mugs_tray1': 'Tray of coffee'
};

/** The hover name of a drinkable cup sprite, or null. */
export function drinkableCupName(type) {
  return DRINKABLE_CUPS[String(type || '')] || null;
}

// Fields that give a scenario object a job beyond being drunk.
const ROLE_FIELDS = ['hasFingerprint', 'fingerprintOwner', 'contents', 'locked', 'lockType',
  'readable', 'text', 'triggerOnInteract', 'puzzle_graph_role', 'puzzle_graph_unlocks',
  'requires', 'interactionGate', 'onInteract'];

/** True when a scenario object has a role (evidence, container, clue...). */
export function hasScenarioRole(data) {
  if (!data) return false;
  return ROLE_FIELDS.some(f => {
    const v = data[f];
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && v !== false && v !== '';
  });
}

// Used-up room-map cups have no server-side object to remove, so their ids
// are kept in this global (synced and restored with the others; undeclared,
// so it never reaches ink).
export const CONSUMED_GLOBAL = '_consumedObjects';

/** True when this object id was drunk before (this session or a saved one). */
export function isObjectConsumed(objectId, globals) {
  const g = globals ?? (typeof window !== 'undefined' ? window.gameState?.globalVariables : null);
  const list = g?.[CONSUMED_GLOBAL];
  return !!objectId && Array.isArray(list) && list.includes(objectId);
}

/** Record an object id as used up. */
export function markObjectConsumed(objectId, globals) {
  const g = globals ?? (typeof window !== 'undefined' ? window.gameState?.globalVariables : null);
  if (!objectId || !g) return;
  const list = Array.isArray(g[CONSUMED_GLOBAL]) ? g[CONSUMED_GLOBAL] : [];
  // A new array, so state-sync sees the key change
  if (!list.includes(objectId)) g[CONSUMED_GLOBAL] = [...list, objectId];
}

/** True for coffee and tea: a cup sprite or a coffee/tea item type. */
export function isDrinkable(data) {
  if (!data) return false;
  return !!drinkableCupName(data.type) || /^(coffee|tea)/.test(String(data.type || '').toLowerCase());
}

/** True when the loaded scenario has combat switched off. */
export function isNoCombat() {
  return typeof window !== 'undefined' && window.gameScenario?.disableAttacks === true;
}

function defaultHealForType(type) {
  const t = String(type || '').toLowerCase();
  const hit = DEFAULT_HEAL_BY_TYPE.find(([re]) => re.test(t));
  return hit ? hit[1] : 0;
}

/**
 * How much an object heals when used, or 0 if it isn't a consumable.
 * @param {object} data - the object's scenarioData
 * @param {{inInventory?: boolean}} [opts]
 */
export function consumableHealAmount(data, { inInventory = false } = {}) {
  if (!data || data.consumed === true) return 0;
  if (typeof data.healAmount === 'number' && Number.isFinite(data.healAmount)) {
    return Math.max(0, Math.round(data.healAmount));
  }
  if (data.consumable === true) return defaultHealForType(data.type) || GENERIC_HEAL;
  if (data.consumable === false) return 0;
  const cup = drinkableCupName(data.type) && !hasScenarioRole(data) ? CUP_HEAL : 0;
  if (inInventory || data.takeable === true) return defaultHealForType(data.type) || cup;
  return cup;
}

/**
 * True when interacting with this sprite should consume it now: a consumable
 * in the inventory, or a consumable world object that can't be picked up (a
 * takeable one is picked up first, then used from the inventory).
 */
export function shouldConsumeOnInteract(sprite, inventoryItems = []) {
  const data = sprite?.scenarioData;
  if (!data) return false;
  const inInventory = Array.isArray(inventoryItems) && inventoryItems.includes(sprite);
  if (consumableHealAmount(data, { inInventory }) <= 0) return false;
  return inInventory || data.takeable !== true;
}

/**
 * Use a consumable: heal, toast, and use it up.
 * @param {object} sprite - inventory item or world object sprite
 * @param {object} [deps] - overridable for tests
 * @returns {number} HP healed (0 if nothing healed; a drink is still used up)
 */
export function useConsumable(sprite, deps = {}) {
  const w = typeof window !== 'undefined' ? window : {};
  const health = deps.playerHealth ?? w.playerHealth;
  const notify = deps.notify ?? w.showNotification ?? (() => {});
  const inventoryItems = deps.inventoryItems ?? w.inventory?.items ?? [];
  const data = sprite?.scenarioData;
  if (!data || health?.isKO?.()) return 0;

  const inInventory = inventoryItems.includes(sprite);
  const amount = consumableHealAmount(data, { inInventory });
  if (amount <= 0) return 0;
  const drink = isDrinkable(data);
  if (!health && !drink) return 0;

  const hp = health ? health.getHP() : 0;
  const maxHP = health ? health.getMaxHP() : 0;
  const name = data.name || 'It';
  const noCombat = deps.noCombat ?? isNoCombat();
  const hurt = !!health && hp < maxHP;
  if (!hurt && !drink) {
    notify(`You're not hurt. Keep the ${name.toLowerCase()} for later.`, 'info', '', 2500);
    return 0;
  }

  const healed = hurt ? Math.min(amount, maxHP - hp) : 0;
  if (hurt) health.heal(amount);
  if (drink) {
    const playSound = deps.playSound ?? ((n) => w.soundManager?.play?.(n));
    try { playSound(DRINK_SOUND); } catch (err) { console.warn('Could not play drink sound:', err); }
  }
  if (noCombat || (drink && !healed)) {
    notify(`You drink the ${name.toLowerCase()}.`, 'success', '', 2500);
  } else {
    notify(`${name}: +${healed} HP`, 'success', '', 2500);
  }
  // A green +N over the player and a green flash on the sprite (combat only)
  const player = w.player;
  if (player && healed > 0 && !noCombat) {
    w.damageNumbers?.show?.(player.x, player.y - 30, healed, 'heal');
    w.spriteEffects?.flashTint?.(player, 0x66ff66, 300);
  }
  w.eventDispatcher?.emit?.('item_consumed', {
    itemId: data.id || null, itemType: data.type, itemName: data.name, healed
  });

  const useUp = deps.useUp ?? (inInventory ? removeInventoryConsumable : removeWorldConsumable);
  try {
    useUp(sprite);
  } catch (err) {
    console.warn('Could not use up consumable:', err);
  }
  return healed;
}

function removeInventoryConsumable(sprite) {
  const w = window;
  w.removeFromInventory?.(sprite);
  const id = sprite.scenarioData?.id;
  const gameId = w.breakEscapeConfig?.gameId;
  if (id && gameId) {
    fetch(`/break_escape/games/${gameId}/inventory`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({ action_type: 'remove', item: { id } })
    }).catch(err => console.error('Failed to sync consumed item:', err));
  }
}

function removeWorldConsumable(sprite) {
  const w = window;
  const roomId = sprite.roomId || w.currentPlayerRoom;
  sprite.scenarioData.consumed = true;
  markObjectConsumed(sprite.objectId);
  if (typeof sprite.setVisible === 'function') sprite.setVisible(false);
  sprite.active = false;
  sprite.isHighlighted = false;
  if (sprite.proximityGhost) {
    sprite.proximityGhost.destroy();
    delete sprite.proximityGhost;
  }
  w.eventDispatcher?.emit?.('item_removed_from_scene', { sprite });
  // Room-map decor isn't a server room object: the global above keeps it gone
  if (roomId && sprite.objectId && !sprite.scenarioData.decor && w.RoomStateSync?.removeItemFromRoom) {
    w.RoomStateSync.removeItemFromRoom(roomId, sprite.objectId)
      .catch(err => console.error('Failed to sync consumed object:', err));
  }
}
