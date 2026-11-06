/**
 * Keypad titles named after the thing being opened ("Enter PIN: Director's Safe")
 * rather than its engine type ("Enter PIN for item").
 *
 * @module lock-titles
 */

/** The lockable's player-facing name: an object's name, else a door's sign. */
export function lockableName(lockable) {
    const name = lockable?.scenarioData?.name || lockable?.doorProperties?.door_sign;
    return typeof name === 'string' && name.trim() ? name.trim() : null;
}

/**
 * @param {string} prompt - e.g. 'Enter PIN', 'Enter password'
 * @param {object} lockable - sprite (scenarioData) or door (doorProperties)
 * @param {string} type - 'door' or 'item'
 */
export function keypadTitle(prompt, lockable, type) {
    const name = lockableName(lockable);
    if (name) return `${prompt}: ${name}`;
    return type === 'door' ? `${prompt}: Door` : prompt;
}
