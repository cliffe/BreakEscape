import { getApiBase, getCsrfToken } from './config.js';

/**
 * API Client for BreakEscape server communication
 */
export class ApiClient {
  /**
   * GET request
   */
  static async get(endpoint) {
    const response = await fetch(`${getApiBase()}${endpoint}`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * POST request
   */
  static async post(endpoint, data = {}) {
    const response = await fetch(`${getApiBase()}${endpoint}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-Token': getCsrfToken()
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      const err = new Error(error.error || error.message || `API Error: ${response.status}`);
      // The server answering "no" is not the same as the server being
      // unreachable, and callers must be able to tell them apart. A wrong PIN
      // comes back 422 with a JSON body; without this, every wrong answer was
      // indistinguishable from a dropped connection, so PIN locks reported
      // "Network error", refunded the attempt and never locked out at all.
      err.status = response.status;
      err.body = error;
      throw err;
    }

    return response.json();
  }

  /**
   * PUT request
   */
  static async put(endpoint, data = {}) {
    const response = await fetch(`${getApiBase()}${endpoint}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-Token': getCsrfToken()
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Get scenario JSON (full scenario data)
  static async getScenario() {
    return this.get('/scenario');
  }

  // Get scenario map (minimal layout metadata for navigation)
  static async getScenarioMap() {
    return this.get('/scenario_map');
  }

  // Get NPC script
  static async getNPCScript(npcId) {
    return this.get(`/ink?npc=${npcId}`);
  }

  // Validate unlock attempt
  static async unlock(targetType, targetId, attempt, method) {
    return this.post('/unlock', {
      targetType,
      targetId,
      attempt,
      method
    });
  }

  // Update inventory
  static async updateInventory(action, item) {
    return this.post('/inventory', {
      action,
      item
    });
  }

  // Sync player state
  static async syncState(currentRoom, globalVariables, notes) {
    return this.put('/sync_state', {
      currentRoom,
      globalVariables,
      notes
    });
  }

  /**
   * Request TTS audio for NPC dialogue
   * @param {string} npcId - NPC identifier
   * @param {string} text - Dialogue text to synthesize
   * @returns {Promise<Blob|null>} Audio blob or null on failure
   */
  static async getTTS(npcId, text) {
    try {
      const response = await fetch(`${getApiBase()}/tts`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({ npc_id: npcId, text: text })
      });

      if (!response.ok) {
        console.warn(`[TTS] API error: ${response.status}`);
        return null;
      }

      return await response.blob();
    } catch (error) {
      console.warn('[TTS] Request failed:', error.message);
      return null;
    }
  }
}

// Export for global access
window.ApiClient = ApiClient;
