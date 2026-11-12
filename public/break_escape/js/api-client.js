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
      // The refusal's reason, as POST carries it (a switched-off PC answers reason "off", q72)
      err.body = typeof response.json === 'function' ? await response.json().catch(() => null) : null;
      throw err;
    }

    return response.json();
  }

  /**
   * POST request
   */
  static async post(endpoint, data = {}, options = {}) {
    const response = await fetch(`${getApiBase()}${endpoint}`, {
      method: 'POST',
      // an AbortSignal, so a caller can bound the request (npc-reports.js, review R2 m2)
      ...(options && options.signal ? { signal: options.signal } : {}),
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
  // { held_card: true } (a held keycard with no id, named by cardId). `card` is the
  // one display card the server stores for the list (SYNC_DELTAS_PLAN P1), sent only when
  // given. Answers { success, recorded, saved }; recorded is false when the card is not the
  // source's own card, saved false when the display card was not stored.
  static async cloneCard(source, cardId, card = null) {
    return this.post('/clone_card', {
      ...source,
      card_id: cardId,
      ...(card ? { card } : {})
    });
  }

  // Slice 9.2 (ACCESS_MODEL_SLICE_9_2_PLAN.md 9.1): NPC failed and met uses,
  // [{ npc_id, event, need, object_id, missing, rearmed }]. Answers { answers: [...] }.
  static async npcFrustration(reports, options = {}) {
    return this.post('/npc_frustration', { reports }, options);
  }

  // Slice 9.2 (plan 6): a workaround performed or dropped, { npc_id, index, hand, dropped }.
  // A refusal throws with err.status: 403 (no such hand-over), 425 (before the dwell).
  static async npcWorkaround(body) {
    return this.post('/npc_workaround', body);
  }

  // Slice 9.2 C (plan 8.3): an NPC's next social media post, after a met use. Answers
  // { index, post, fact: { id, entry } | null, site, person, done } or { post: null, done }.
  // `objectId`: where the use was, null for the NPC's phone (user decision q33)
  static async feedPost(npcId, objectId = null) {
    return this.post('/feed_post', { npc_id: npcId, object_id: typeof objectId === 'string' ? objectId : null });
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
  // Plant a rogue device in a jack. Answers { success, foothold, first, added, removed }
  // (or { success, already: true, ... } when a device is in that jack already); a
  // refusal throws with err.status (404 no jack, 403 reason "unreachable", 422 reason
  // "no_device") and err.body. `delta: true` opts into the added/removed inventory delta
  // (sync deltas P2); an old tab that omits it still gets the whole-inventory echo.
  static async networkPlant(jackId, deviceId = null) {
    return this.post('/network/plant', { jack_id: jackId, delta: true, ...(deviceId ? { device_id: deviceId } : {}) });
  }

  // Take the device back out of a jack. Answers { success, endedPcIds, added, removed }; a
  // refusal throws (422 reason "not_planted", 403 reason "unreachable", 404).
  static async networkUnplug(jackId) {
    return this.post('/network/unplug', { jack_id: jackId, delta: true });
  }

  // A device in a PC (not a jack) grants a foothold (slice 9.3b sub-slice I). `shape` is
  // 'dropped' (an NPC uses a dropped device) or 'session' (a BadUSB the player plugs into a
  // PC they hold a session on); `path` names the declared action when a PC has several.
  // Answers { success, foothold, first, consumedId, added, removed } (or
  // { success, already: true, ... }); a refusal throws (404 reason "no_action", 422 reason
  // "not_ready" or "usb_refused"). `delta: true` opts into the added/removed delta (P2).
  static async networkImplant(pcId, shape, path = null) {
    return this.post('/network/implant', { pc_id: pcId, shape, delta: true, ...(path ? { path } : {}) });
  }

  // Join an in-game Wi-Fi network through an access point (slice 9.3b sub-slice W, 5.3).
  // The key is compared on the server; an open network sends no key. Answers
  // { success, foothold, first, added, removed } (or { success, already: true, ... } when the
  // network is already joined); a refusal throws with err.status (404 no access point,
  // 403 reason "unreachable", 422 reason "wrong_key") and err.body. The key is never echoed.
  // `delta: true` opts into the added/removed delta (P2).
  static async networkJoin(apId, key = null) {
    return this.post('/network/join', { ap_id: apId, delta: true, ...(key != null ? { key } : {}) });
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
  // screen opens: { pc_id, loginAccounts: [{ username, displayName, portrait, avatar }] },
  // plus postitNote ("<username> / <password>") when the owner writes the password down
  // (slice 9.1, 5.3). Sent no-store; never asked for a PC the player is not at.
  static async loginAccounts(pcId) {
    return this.get(`/login_accounts?pc_id=${encodeURIComponent(pcId)}`);
  }

  /**
   * Request TTS audio for NPC dialogue
   * @param {string} npcId - NPC identifier
   * @param {string} text - Dialogue text to synthesize
   * @returns {Promise<Blob|null>} Audio blob or null on failure
   */
  static async getTTS(npcId, text, delivery = null) {
    try {
      // delivery: the line's #delivery: note (tts-delivery.js), sent only when there is one,
      // so an untagged line's request is unchanged
      const body = { npc_id: npcId, text: text };
      if (delivery) body.delivery = delivery;
      const response = await fetch(`${getApiBase()}/tts`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify(body)
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
