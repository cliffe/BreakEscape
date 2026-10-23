/**
 * Slow HP regeneration out of combat (m04 playtest, m07 blind run A: a player
 * who won one fight at low HP walked into the next one nearly dead).
 *
 * Once nothing has hurt the player for `delayMs`, HP goes up by `hpPerTick`
 * every `tickMs`, but only up to `capFraction` of max HP. Above the cap only
 * consumables (coffee, snacks, first aid kits) heal, so they still matter.
 *
 * Defaults are COMBAT_CONFIG.player.regen. A scenario overrides any of them
 * with a top-level `playerRegen` object, or turns regen off with
 * `"playerRegen": false` (or `enabled: false`).
 *
 * The rules are pure functions so they can be tested without the game.
 */

/**
 * Merge the scenario's playerRegen over the defaults.
 * @returns {object|null} the settings, or null when regen is off
 */
export function resolveRegenConfig(scenarioRegen, defaults) {
  if (scenarioRegen === false) return null;
  const out = { ...defaults };
  if (scenarioRegen && typeof scenarioRegen === 'object') {
    if (scenarioRegen.enabled === false) return null;
    for (const k of ['delayMs', 'tickMs', 'hpPerTick', 'capFraction']) {
      const v = scenarioRegen[k];
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[k] = v;
    }
  }
  if (!(out.tickMs > 0) || !(out.hpPerTick > 0) || !(out.capFraction > 0)) return null;
  out.capFraction = Math.min(1, out.capFraction);
  return out;
}

/**
 * HP to add on this tick (0 for none).
 * @param {object} p
 * @param {number} p.hp
 * @param {number} p.maxHP
 * @param {boolean} p.ko
 * @param {number} p.now - ms
 * @param {number} p.lastHitAt - ms of the last damage
 * @param {object} p.config - from resolveRegenConfig
 */
export function regenAmount({ hp, maxHP, ko, now, lastHitAt, config }) {
  if (!config || ko || !(hp > 0) || !(maxHP > 0)) return 0;
  if (now - (lastHitAt || 0) < config.delayMs) return 0;
  const cap = Math.floor(maxHP * config.capFraction);
  if (hp >= cap) return 0;
  return Math.min(config.hpPerTick, cap - hp);
}

/**
 * Start the regen timer. Damage (a PLAYER_HP_CHANGED with a negative delta)
 * restarts the out-of-combat delay. Ticks are skipped while the tab is hidden.
 * @returns {{stop: Function, config: object|null, lastHitAt: Function}}
 */
export function startPlayerRegen({ scenario, defaults, eventDispatcher, hpEvent, getHealth }) {
  const config = resolveRegenConfig(scenario?.playerRegen, defaults);
  let lastHitAt = Date.now();
  const onHP = (data) => { if (data && data.delta < 0) lastHitAt = Date.now(); };
  eventDispatcher?.on?.(hpEvent, onHP);
  let timer = null;
  if (config) {
    timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const health = getHealth();
      if (!health) return;
      const add = regenAmount({
        hp: health.getHP(), maxHP: health.getMaxHP(), ko: health.isKO(),
        now: Date.now(), lastHitAt, config
      });
      if (add > 0) health.heal(add);
    }, config.tickMs);
  }
  return {
    config,
    lastHitAt: () => lastHitAt,
    stop: () => {
      if (timer) clearInterval(timer);
      eventDispatcher?.off?.(hpEvent, onHP);
    }
  };
}
