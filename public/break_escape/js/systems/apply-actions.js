import { displayDashes } from '../utils/display-dashes.js';
import { writeGlobal } from './global-writer.js';
import { grantFact, readyToastText, readyToastTitle } from './social-intel.js';

/**
 * Record a Social-Engineering/physical capture into se_captures (captures.js),
 * first-capture-wins. Kept off the static import graph on purpose: apply-actions.js
 * is copied by several node test harnesses that stub only its known imports, so the
 * captures module is pulled in lazily the first time a capture is actually written.
 *
 * `input` names the target and the AUTHORED fiction (credential address/secret, or a
 * foothold host/note) — never anything the player typed. The physical pentest lab
 * builds this input by merging an NPC's own `usePayload` (the per-NPC credential that
 * rides on `npc_used`) over a static template, so the object that was "used" never
 * holds the secret; see NPC_NEEDS_SYSTEM.md §13.
 */
let _capturesPromise = null;
function capturesModule() {
    if (!_capturesPromise) _capturesPromise = import('./captures.js').catch(() => null);
    return _capturesPromise;
}

export async function recordSECapture(input) {
    const globals = (typeof window !== 'undefined') ? window.gameState?.globalVariables : null;
    if (!globals) return false;
    const mod = await capturesModule();
    if (!mod) return false;
    const { CAPTURES_KEY, makeCaptureEntry, mergeCapture, readCaptures } = mod;
    const at = (input && Number.isFinite(input.at)) ? input.at : Date.now();
    const entry = makeCaptureEntry({ ...input, at });
    if (!entry) return false;
    const base = readCaptures(globals);
    const next = mergeCapture(base, entry);
    if (next === base) return false; // already captured: first-capture-wins, no redundant write
    writeGlobal(CAPTURES_KEY, next, { openChat: false });
    if (typeof window !== 'undefined') window.stateSync?.sync?.();
    console.log('[applyActions] add_capture:', entry.targetId, entry.kind);
    return true;
}

if (typeof window !== 'undefined') window.recordSECapture = recordSECapture;

/**
 * Tell the server an item has left the inventory (POST /inventory, action_type remove).
 * `usedOn` names the object the item was used on (its scenario id): the server then records
 * a plant when that object takes the item (engine plan section 6, capture proofs). Awaits the
 * answer and retries once on a network error or a 5xx; a refusal is logged and not retried.
 * Resolves true when the server accepted the removal.
 */
export async function sendInventoryRemove(id, { usedOn = null, gameId = null } = {}) {
    const gid = gameId || (typeof window !== 'undefined' ? window.breakEscapeConfig?.gameId : null);
    if (!id || !gid) return false;
    const body = { action_type: 'remove', item: { id } };
    if (typeof usedOn === 'string' && usedOn) body.used_on = usedOn;
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const resp = await fetch(`/break_escape/games/${gid}/inventory`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: JSON.stringify(body)
            });
            if (resp?.ok !== false) return true;
            if (resp.status >= 500 && attempt === 1) continue;
            console.warn('[applyActions] the server refused an inventory remove:', id, resp.status);
            return false;
        } catch (err) {
            if (attempt === 1) continue;
            console.error('[applyActions] inventory remove sync failed:', id, err);
            return false;
        }
    }
    return false;
}
if (typeof window !== 'undefined') window.sendInventoryRemove = sendInventoryRemove;

/**
 * Card revocation (the left-card consequence, NPC_NEEDS_SYSTEM.md §3.3b).
 *
 * When the owner of a left-behind access card returns and finds it gone, the
 * card is cancelled: neither the physical keycard nor any saved clone of the
 * same `card_id` opens doors any more. The cancelled ids live in the global
 * `revoked_card_ids` (an array, persisted and synced like any other global), so
 * the state survives a reload. The RFID unlock path reads it through
 * `window.isCardRevoked` (unlock-system.js `evaluateRfidCredential` and the
 * cloner's tap/emulate paths), with no static import either way.
 */
export function isCardRevoked(cardId) {
    if (cardId == null) return false;
    const list = (typeof window !== 'undefined' && window.gameState?.globalVariables?.revoked_card_ids) || [];
    return Array.isArray(list) && list.includes(cardId);
}
if (typeof window !== 'undefined') window.isCardRevoked = isCardRevoked;

/**
 * Shared action executor for scenario-defined action descriptors.
 *
 * The same descriptor format is used by flag-station `flagRewards`,
 * object `triggerOnInteract`, and any other source that needs to produce
 * side-effects in the game world without duplicating the dispatch logic.
 *
 * Supported action types:
 *   set_global     { key, value }    — patches gameState.globalVariables and fires
 *                                      global_variable_changed:<key>
 *   grant_fact     { fact }          — grants an intel fact once (note, readiness) and
 *                                      toasts "Noted: <fact label>" (00 S15)
 *   emit_event     { event_name }    — fires a raw eventDispatcher event
 *   complete_task  { taskId }        — marks an objective task complete
 *   unlock_object  { objectId }      — unlocks a world object (+ optional server persist)
 *   unlock_door    { room_id }       — adds room_id to gameState.unlockedRooms
 *   give_item      { item }          — adds an item sprite to the player inventory
 *   remove_item    { item }          — removes a named item (type/id/name, or an
 *                                      array of them) from inventory + the server copy
 *   add_capture    { capture }       — records a credential/foothold into se_captures
 *   set_costume    { costume }       — swaps the player sprite to scenario.disguises[costume]
 *   clear_costume  {}                — restores the chosen avatar
 *   wear           { itemId }:       puts a held wearable item on (wearables.js)
 *   take_off       { itemId? }:      takes the worn item off
 *   hint           { message, title? }: shows an informational alert to the player, for a time set by its length
 *   lighting_dip   { level?, ms? }   — one slow brownout dip of the room lights
 *
 * Any action may carry a `condition` on the globals, in the syntax of timers and text
 * variants plus `||` ("!globalVars.a && globalVars.b === true"). It is read when the
 * action is reached, so an earlier action in the list can change the answer; an action
 * whose condition does not hold is skipped. With it one click can say one thing per
 * state (lab_physical_pentest's ledger shelves). The evaluation is strict
 * (utils/global-condition.js evaluateActionCondition, the grammar the validator
 * checks): a condition that is not a string, is empty or is not in the grammar does
 * not hold, so a typing slip skips the action and never runs it by mistake. The same
 * goes where the evaluator is not loaded. Only an absent key means "always". The
 * client alone reads it: the server applies flag rewards and declared give_item grants
 * whatever the condition says, so the validator refuses it on a flag reward.
 *
 * @param {Array}  actions            Array of action descriptor objects.
 * @param {Object} [opts]
 * @param {string} [opts.source]      Label attached to emitted events (e.g. 'flag_reward',
 *                                    'object_interact'). Defaults to 'scenario'.
 * @param {*}      [opts.gameId]      Game ID passed to ApiClient for server-side persists.
 */
// objectId: the scenario id of the object whose interaction runs these actions (its
// triggerOnInteract, directly or through a confirm_action); remove_item sends it as used_on.
export function applyActions(actions, { source = 'scenario', gameId = null, objectId = null } = {}) {
    // The addToInventory promises started for give_item actions, in order, so a caller
    // (the timer dispatcher) can retry a give lost to the network. Each carries the action
    // it ran as `.action`: a give skipped by its condition starts no promise, so the list
    // does not line up with the list's give_item entries by position. Other callers ignore it.
    const gives = [];
    if (!Array.isArray(actions) || actions.length === 0) return gives;

    for (const action of actions) {
        if (action && action.condition !== undefined) {
            const holds = window.evaluateActionCondition;
            if (typeof holds !== 'function' || holds(action.condition, window.gameState?.globalVariables || {}) !== true) continue;
        }
        switch (action.type) {

            case 'set_global':
                if (action.key !== undefined && window.gameState?.globalVariables) {
                    // The shared writer (00 S3). emitAlways: set_global emits on every
                    // call, same value or not, as it always has (some mappings re-set a
                    // value to re-fire). The only new behaviour is the broadcast to
                    // cached stories that declare the name; the open chat's story is
                    // left as before (openChat: false).
                    writeGlobal(action.key, action.value, { emitAlways: true, openChat: false });
                    console.log(`[applyActions] set_global ${action.key} =`, action.value);
                }
                break;

            case 'grant_fact':
                if (action.fact) {
                    // Flip-only (social-intel.js): a repeat grant does nothing, so the
                    // toast shows once, beside the note the grant adds.
                    const granted = grantFact(action.fact, { source });
                    if (granted.granted) {
                        // Title "Noted", body the fact label: the toast reads "Noted: <label>"
                        // once, not doubled (P1-T T5).
                        window.gameAlert?.(granted.label, 'info', 'Noted', 4000);
                        // If this fact just made a target ready, point the player at the
                        // place to act on it (P1-T T8): the target's channel, or the
                        // scenario's intelBoard.readyToast.
                        const newlyReady = granted.readiness?.newlyReady || [];
                        if (newlyReady.length) {
                            window.gameAlert?.(readyToastText(newlyReady),
                                'success', readyToastTitle(), 6000);
                        }
                    }
                }
                break;

            case 'emit_event':
                if (action.event_name && window.eventDispatcher) {
                    window.eventDispatcher.emit(action.event_name, { source });
                }
                break;

            case 'complete_task':
                if (action.taskId) {
                    if (window.objectivesManager) {
                        window.objectivesManager.completeTask(action.taskId);
                        console.log('[applyActions] Completed task:', action.taskId);
                    } else {
                        console.warn('[applyActions] objectivesManager not available');
                    }
                }
                break;

            case 'unlock_object':
                if (action.objectId) {
                    window.eventDispatcher?.emit('object_remotely_unlocked', {
                        objectId: action.objectId,
                        source
                    });
                    const apiClient = window.ApiClient || window.APIClient;
                    if (apiClient && gameId) {
                        apiClient.unlock('object', action.objectId, null, source).catch(err =>
                            console.warn('[applyActions] Failed to persist object unlock:', err)
                        );
                    }
                }
                break;

            case 'unlock_door':
                if (action.room_id) {
                    if (window.gameState?.unlockedRooms && !window.gameState.unlockedRooms.includes(action.room_id)) {
                        window.gameState.unlockedRooms.push(action.room_id);
                    }
                    // A flag reward has already unlocked the room on the server: open the
                    // door sprites to it now, as NPCGameBridge.unlockDoor does, or the door
                    // asks for its lock until the next reload (F18). Other sources are
                    // client-only, and the server would refuse the room, so they don't.
                    if (source === 'flag_reward') {
                        Object.values(window.rooms || {}).forEach(room => (room?.doorSprites || []).forEach(door => {
                            if (door?.doorProperties?.connectedRoom === action.room_id) door.doorProperties.locked = false;
                        }));
                        if (window.gameScenario?.rooms?.[action.room_id]) window.gameScenario.rooms[action.room_id].locked = false;
                        if (window.rooms?.[action.room_id]) window.rooms[action.room_id].locked = false;
                    }
                    // connectedRoom is the room unlocked, as in unlock-system.js's door_unlocked:
                    // objectives-manager and eventMapping conditions (data.connectedRoom) read it
                    window.eventDispatcher?.emit('door_unlocked', { roomId: action.room_id, connectedRoom: action.room_id, source });
                }
                break;

            case 'hint':
                if (action.message) {
                    // A hint is a sentence or two to read, so it lasts by length like the
                    // refusal hints (utils/locked-hint.js hintToastMs: 300 ms a word, 6 to
                    // 12 s). It used to last 5 s whatever its length, and a 21 word pointer
                    // was gone before it could be read (lab_physical_pentest playtest N11).
                    // Where the rule is not loaded the toast keeps its default duration.
                    const hintMs = window.hintToastMs?.(action.message);
                    if (Number.isFinite(hintMs)) window.gameAlert?.(action.message, 'info', action.title || 'Intelligence Received', hintMs);
                    else window.gameAlert?.(action.message, 'info', action.title || 'Intelligence Received');
                    console.log('[applyActions] hint:', action.message);
                }
                break;

            case 'give_item':
                if (action.item && window.addToInventory) {
                    const itemSprite = {
                        name: action.item.type,
                        objectId: `action_item_${action.item.name}_${Date.now()}`,
                        scenarioData: action.item,
                        texture: { key: (typeof action.item.sprite === 'string' && action.item.sprite) || action.item.type },
                        keyPins: action.item.keyPins,
                        opens_lock: window.lockRef(action.item) || action.item.keyId,
                        setVisible: function() { return this; }
                    };
                    console.log('[applyActions] give_item:', action.item.name);
                    const give = Promise.resolve(window.addToInventory(itemSprite));
                    give.action = action;
                    gives.push(give);
                }
                break;

            // Remove a named item from the player inventory (and the server copy): the
            // counterpart to give_item. `item` names the kit by type, id or name, or an
            // array of any of those (first held match wins). Its intended use is inside a
            // confirm_action's onConfirm, so a required-but-not-consumed item (an object
            // with interactions.js `requiresItem` and NO `consumesItem`) is only taken once
            // the player COMMITS to the dialog — cancelling keeps the kit (the engine consumes
            // a `consumesItem` item when the confirm merely OPENS). No-op if the item isn't held.
            // action: { type: 'remove_item', item: '<type|id|name>' | [ ... ] }
            case 'remove_item': {
                const wanted = Array.isArray(action.item) ? action.item : [action.item];
                const held = (window.inventory?.items || []).find(it => {
                    const d = it?.scenarioData || {};
                    return wanted.includes(d.type) || wanted.includes(d.id) || wanted.includes(d.name);
                });
                if (!held) {
                    console.log('[applyActions] remove_item: not held, no-op:', action.item);
                    break;
                }
                try {
                    window.removeFromInventory?.(held);
                    const id = held?.scenarioData?.id;
                    // From an object (its triggerOnInteract, or a confirm_action there) the
                    // request names that object, so the server can record the plant.
                    if (id) sendInventoryRemove(id, { usedOn: objectId, gameId });
                    console.log('[applyActions] remove_item:', id || action.item);
                } catch (err) {
                    console.warn('[applyActions] remove_item failed:', err);
                }
                break;
            }

            // Cancel an access card: the physical keycard and any saved clone of this
            // `card_id` stop opening RFID doors (left-card consequence, §3.3b). Intended
            // for an object's `onOwnerNoticesMissing` list, fired by left-card-consequence.js
            // when npc_left_item_gone:<owner> says the card was taken.
            // action: { type: 'revoke_card', card_id: '<id>' | ['<id>', ...] }
            case 'revoke_card': {
                const ids = Array.isArray(action.card_id) ? action.card_id
                          : (action.card_id != null ? [action.card_id] : []);
                if (ids.length && window.gameState?.globalVariables) {
                    const cur = window.gameState.globalVariables.revoked_card_ids;
                    const next = Array.isArray(cur) ? cur.slice() : [];
                    let changed = false;
                    for (const id of ids) {
                        if (id != null && !next.includes(id)) { next.push(id); changed = true; }
                    }
                    if (changed) {
                        writeGlobal('revoked_card_ids', next, { emitAlways: true, openChat: false });
                        if (typeof window !== 'undefined') window.stateSync?.sync?.();
                    }
                    ids.forEach(id => window.eventDispatcher?.emit?.('card_revoked', { cardId: id, source }));
                    console.log('[applyActions] revoke_card:', ids.join(', '));
                }
                break;
            }

            case 'add_capture':
                // Static-descriptor capture (timers, triggerOnInteract). An NPC-used capture that
                // reads the per-NPC usePayload goes through window.recordSECapture from npc-manager.
                if (action.capture && typeof action.capture === 'object') {
                    recordSECapture(action.capture);
                }
                break;

            // Costume swap (costume-actions.js, lazy so test harnesses need no extra file).
            // action: { type: 'set_costume', costume: '<id>' }  or  { type: 'clear_costume' }
            // The id is looked up in the scenario-level `disguises` map; the choice persists
            // in the global pp_disguise and is re-applied on load.
            case 'set_costume': {
                const id = action.costume ?? action.id ?? action.value;
                if (typeof id === 'string' && id) {
                    import('./costume-actions.js').then(m => m.setCostume(id)).catch(e =>
                        console.warn('[applyActions] set_costume failed:', e));
                }
                break;
            }

            // Wearable items (wearables.js, reached through window): put a held wearable on, or
            // take the worn one off. No confirm (the action is the author's choice); unseenOnly
            // still applies. A wear right after a give_item in the same list waits for the give.
            // action: { type: 'wear', itemId }  or  { type: 'take_off', itemId? }
            case 'wear': {
                const pending = gives.slice();
                Promise.all(pending).then(() => window.wearables?.putOn?.(action.itemId, { waitMs: 3000 }))
                    .catch(e => console.warn('[applyActions] wear failed:', e));
                break;
            }

            case 'take_off':
                Promise.resolve(window.wearables?.takeOff?.(action.itemId || null))
                    .catch(e => console.warn('[applyActions] take_off failed:', e));
                break;

            case 'clear_costume':
                import('./costume-actions.js').then(m => m.clearCostume()).catch(e =>
                    console.warn('[applyActions] clear_costume failed:', e));
                break;

            // Tint all sprites of a given texture key in a room — used for environmental hazard cues
            // (e.g. battery racks glowing red during H₂ advisory phase).
            // action: { type, roomId, textureKey, color (hex int, default 0xFF4422), pulse (bool, default true) }
            case 'tint_objects': {
                const { roomId, textureKey, color = 0xFF4422, pulse = true } = action;
                const room = window.rooms?.[roomId];
                if (!room?.objects) {
                    console.warn(`[applyActions] tint_objects: room '${roomId}' not loaded or has no objects`);
                    break;
                }
                let tinted = 0;
                for (const sprite of Object.values(room.objects)) {
                    if (!sprite?.active || typeof sprite.setTint !== 'function') continue;
                    if (sprite.texture?.key !== textureKey) continue;
                    sprite.setTint(color);
                    if (pulse && sprite.scene) {
                        sprite.scene.tweens.add({
                            targets: sprite,
                            alpha: { from: 1.0, to: 0.65 },
                            duration: 900,
                            yoyo: true,
                            repeat: -1
                        });
                    }
                    tinted++;
                }
                console.log(`[applyActions] tint_objects: tinted ${tinted} '${textureKey}' sprite(s) in room '${roomId}' with color 0x${color.toString(16).padStart(6, '0').toUpperCase()}`);
                break;
            }

            // Brownout: one slow dip of every room's lights (systems/lighting.js dip()).
            // action: { type: 'lighting_dip', level (0.2-1, default 0.5), ms (default 1600) }
            // Does nothing without lighting or under prefers-reduced-motion.
            case 'lighting_dip': {
                window.lightingSystem?.dip?.({ level: action.level, ms: action.ms });
                break;
            }

            // Show confirmation dialog, then execute nested actions if confirmed
            // action: { type: 'confirm_action', text, onConfirm: [...actions] }
            case 'confirm_action': {
                if (!window.gameConfirm) {
                    console.warn('[applyActions] gameConfirm not available');
                    break;
                }
                const { text, onConfirm } = action;
                window.gameConfirm(text).then(confirmed => {
                    if (confirmed && Array.isArray(onConfirm)) {
                        applyActions(onConfirm, { source, gameId, objectId });
                    }
                });
                break;
            }

            // Show a full-screen scenario end overlay — used for failure states (e.g. thermal runaway evacuation).
            // Disables player movement. Not dismissible; player must click through to missions.
            // action: { type, outcome ('failure'|'success'|'neutral'), title, body (HTML), buttonText }
            case 'show_end_screen': {
                showEndScreen(action);
                const { title = 'SCENARIO ENDED', outcome = 'neutral' } = action;
                console.log(`[applyActions] show_end_screen: '${title}' (${outcome})`);
                break;
            }

            // A device in a PC grants a foothold (slice 9.3b sub-slice I). Either shape runs
            // through here: a dropped-device action fired by an NPC beat (needsDropped), or a
            // BadUSB the player plugs into a PC they hold a session on (needsSession). The
            // server reads the shape's preconditions from its own records; this only asks it
            // to try. networkLinks.implant retries once (a timer is saved fired, 5.5).
            case 'grant_foothold': {
                const pc = action.pc;
                const shape = action.needsSession ? 'session' : 'dropped';
                const links = window.networkLinks;
                if (pc && links?.implant) {
                    Promise.resolve(links.implant(pc, shape, action.path || null))
                        .catch(e => console.warn('[applyActions] grant_foothold failed:', e));
                } else {
                    console.warn('[applyActions] grant_foothold: no networkLinks or pc', action);
                }
                break;
            }

            default:
                console.warn('[applyActions] Unknown action type:', action.type, action);
        }
    }
    return gives;
}

/**
 * Show the full-screen scenario end overlay.
 *
 * In Hacktivity mode (game opened in a new tab from the event page), the
 * button closes the game tab and returns focus to the opener tab.
 * In standalone mode the button navigates to /break_escape/missions.
 *
 * Exposed as window.showEndScreen so objectives-manager.js can trigger it
 * when the server confirms missionConcluded:true without a duplicate overlay
 * being created if triggerOnInteract already called it.
 *
 * @param {Object} opts
 * @param {string} [opts.title]      Heading text. Defaults to 'MISSION COMPLETE'.
 * @param {string} [opts.body]       HTML body text.
 * @param {string} [opts.buttonText] Button label. Defaults to 'Return to Missions'.
 * @param {string} [opts.outcome]    'success' | 'failure' | 'neutral'.
 */
export function showEndScreen(opts = {}) {
    // Prevent duplicate overlays (e.g. triggerOnInteract + handleMissionConcluded both fire)
    if (document.getElementById('scenario-end-screen')) return;

    const {
        title = 'MISSION COMPLETE',
        body = '',
        outcome = 'neutral'
    } = opts;
    // A host game shell sends the player to its own page (the debrief), so it names the button.
    const cfg = window.breakEscapeConfig;
    const buttonText = (cfg?.shellReturnUrl && cfg.shellReturnLabel) || opts.buttonText || 'Return to Missions';

    if (window.player) window.player.disableMovement = true;

    const overlay = document.createElement('div');
    overlay.id = 'scenario-end-screen';
    overlay.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
        'background:rgba(0,0,0,0.93)',
        'display:flex', 'justify-content:center', 'align-items:center',
        'z-index:10000', 'flex-direction:column', 'gap:20px',
        'font-family:"Press Start 2P",monospace'
    ].join(';');

    const titleEl = document.createElement('h1');
    titleEl.textContent = displayDashes(title);
    titleEl.style.cssText = [
        `color:${outcome === 'failure' ? '#ff2222' : '#22ff88'}`,
        'font-size:26px', 'font-weight:normal', 'margin:0',
        'text-align:center', 'max-width:820px', 'line-height:1.6',
        'text-shadow:0 0 24px rgba(255,34,34,0.55)'
    ].join(';');

    const bodyEl = document.createElement('p');
    bodyEl.innerHTML = displayDashes(body);
    bodyEl.style.cssText = [
        'color:#cccccc', 'font-size:20px', 'font-family:"VT323",monospace',
        'margin:0', 'text-align:center', 'max-width:680px', 'line-height:1.7'
    ].join(';');

    const btn = document.createElement('button');
    btn.textContent = buttonText;
    btn.style.cssText = [
        'padding:12px 32px', 'font-size:14px', 'font-family:"Press Start 2P",monospace',
        'background:#333', 'color:#dddddd',
        'border:2px solid #666',
        'cursor:pointer', 'margin-top:12px'
    ].join(';');
    btn.onmouseover = () => { btn.style.background = '#555'; btn.style.borderColor = '#aaa'; };
    btn.onmouseout  = () => { btn.style.background = '#333'; btn.style.borderColor = '#666'; };
    btn.onclick = () => {
        // A host game shell opened the game in its own tab and names where to go back to.
        const shellUrl = window.breakEscapeConfig?.shellReturnUrl || window.breakEscapeConfig?.shellMenuUrl;
        if (shellUrl) {
            window.location.href = shellUrl;
            return;
        }
        // The Hacktivity desktop app is one window: closing it would quit the app. Go to the
        // host's root, which sends the app to its game's event page. (The same test as
        // utils/desktop-app.js; kept inline because tests load this file on its own.)
        // The Play app is one window too: its tab carries the marker client-platform.js stores.
        let appHome = /HacktivityApp\//.test(window.navigator?.userAgent || '') ? '/' : null;
        if (!appHome) {
            try {
                const m = JSON.parse(window.sessionStorage?.getItem('hacktivity.platform') || 'null');
                if (m && m.appWindow === 'play-app') appHome = m.gameKey ? '/app/' + encodeURIComponent(m.gameKey) : '/';
            } catch (e) { /* storage blocked: treat as a browser */ }
        }
        if (appHome) {
            window.location.href = appHome;
            return;
        }
        // Always close the game tab. In Hacktivity mode, also restore focus to the opener.
        // In standalone mode window.close() works when the tab was opened via a link.
        if (window.breakEscapeConfig?.hacktivityMode) {
            window.opener?.focus();
        }
        window.close();
    };

    overlay.appendChild(titleEl);
    if (body) overlay.appendChild(bodyEl);
    overlay.appendChild(btn);
    document.body.appendChild(overlay);
}

// Expose for objectives-manager.js (module boundary)
window.showEndScreen = showEndScreen;

// Expose applyActions so dynamically-loaded helpers (action-menu.js,
// left-card-consequence.js) run scenario action lists without a static import.
if (typeof window !== 'undefined') window.applyActions = applyActions;
