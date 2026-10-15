/**
 * Error handling utilities for combat system
 */

export function validateNumber(value, name, min = -Infinity, max = Infinity) {
  if (typeof value !== 'number' || isNaN(value)) {
    console.error(`${name} must be a valid number, got:`, value);
    return false;
  }
  if (value < min || value > max) {
    console.error(`${name} must be between ${min} and ${max}, got:`, value);
    return false;
  }
  return true;
}

export function validateNPCId(npcId) {
  if (!npcId || typeof npcId !== 'string') {
    console.error('Invalid NPC ID:', npcId);
    return false;
  }
  return true;
}

export function validateNPCExists(npcId) {
  if (!validateNPCId(npcId)) return false;

  if (!window.npcManager) {
    console.error('NPC Manager not initialized');
    return false;
  }

  const npc = window.npcManager.getNPC(npcId);
  if (!npc) {
    console.error(`NPC not found: ${npcId}`);
    return false;
  }

  return true;
}

export function validateSystem(systemName, windowProperty) {
  if (!window[windowProperty]) {
    console.error(`${systemName} not initialized (window.${windowProperty} is undefined)`);
    return false;
  }
  return true;
}

export function logCombatError(context, error) {
  console.error(`[Combat Error] ${context}:`, error);
}

export function logCombatWarning(context, message) {
  console.warn(`[Combat Warning] ${context}:`, message);
}
