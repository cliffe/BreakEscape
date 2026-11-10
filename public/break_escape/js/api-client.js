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
      const err = new Error(`API Error: ${response.status} ${response.statusText}`);
      err.status = response.status;
      throw err;
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
      const error = new Error(`API Error: ${response.status}`);
      error.status = response.status;
      throw error;
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

  // Validate unlock attempt. `extra` carries optional fields for some lock types:
  // { card_ids } for an rfid lock with an access list (access model 4.1).
  static async unlock(targetType, targetId, attempt, method, extra = {}) {
    return this.post('/unlock', {
      ...extra,
      targetType,
      targetId,
      attempt,
      method
    });
  }

  // Record a card the card copier saved (access model 4.2). `source` is
  // { npc_id } (copied in a conversation), { object_id } (a held keycard) or
  // { held_card: true } (a held keycard with no id, named by cardId).
  // Answers { success, recorded }; recorded is false when the card is not the
  // source's own card.
  static async cloneCard(source, cardId) {
    return this.post('/clone_card', {
      ...source,
      card_id: cardId
    });
  }

  // Sign in at a sign-in PC (access model 5.3, 6). `fields` is { username, password }
  // (the claim of step 9 sends { claim: "owner", globals } instead). A remote sign-in
  // (slice 9.3a, 4.4) adds { foothold: <footholdId> }; the server then checks the host is
  // reachable through that foothold instead of at the keyboard. Answers
  // { success, npcId, username, displayName, via } (a remote one adds remote, footholdId
  // and host); a refusal throws with err.status (422) and err.body { message,
  // attemptsLeft, lockedOut?, notPermitted?, remoteBlocked? }.
  static async login(pcId, fields = {}) {
    const { foothold, ...rest } = fields || {};
    return this.post('/login', { ...rest, ...(foothold ? { foothold } : {}), pc_id: pcId });
  }

  // Networks (slice 9.3a, ACCESS_MODEL_SLICE_9_3_PLAN.md section 5). Only
  // systems/network-links.js calls these three.
  //
  // Plant a rogue device in a jack. Answers { success, foothold, inventory, first }
  // (or { success, already: true, ... } when a device is in that jack already); a
  // refusal throws with err.status (404 no jack, 403 reason "unreachable", 422 reason
  // "no_device") and err.body.
  static async networkPlant(jackId, deviceId = null) {
    return this.post('/network/plant', { jack_id: jackId, ...(deviceId ? { device_id: deviceId } : {}) });
  }

  // Take the device back out of a jack. Answers { success, inventory, endedPcIds }; a
  // refusal throws (422 reason "not_planted", 403 reason "unreachable", 404).
  static async networkUnplug(jackId) {
    return this.post('/network/unplug', { jack_id: jackId });
  }

  // What a foothold reaches: { footholds: [{ id, via, name, network, hosts }] }, every
  // held foothold, or only `footholdId` when given (404 when it is not held).
  static async network(footholdId = null) {
    return this.get(footholdId ? `/network?foothold=${encodeURIComponent(footholdId)}` : '/network');
  }

  // End the session at a sign-in PC. Answers { success: true }.
  static async logout(pcId) {
    return this.post('/logout', { pc_id: pcId });
  }

  // The account tiles for a sign-in PC's loginPicker, refreshed each time its sign-in
  // screen opens: { pc_id, loginAccounts: [{ username, displayName, portrait, avatar }] }.
  static async loginAccounts(pcId) {
    return this.get(`/login_accounts?pc_id=${encodeURIComponent(pcId)}`);
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
