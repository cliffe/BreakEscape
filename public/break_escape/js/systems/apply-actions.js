import { displayDashes } from '../utils/display-dashes.js';

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
 *   emit_event     { event_name }    — fires a raw eventDispatcher event
 *   complete_task  { taskId }        — marks an objective task complete
 *   unlock_object  { objectId }      — unlocks a world object (+ optional server persist)
 *   unlock_door    { room_id }       — adds room_id to gameState.unlockedRooms
 *   give_item      { item }          — adds an item sprite to the player inventory
 *   hint           { message, title? } — shows an informational alert to the player
 *
 * @param {Array}  actions            Array of action descriptor objects.
 * @param {Object} [opts]
 * @param {string} [opts.source]      Label attached to emitted events (e.g. 'flag_reward',
 *                                    'object_interact'). Defaults to 'scenario'.
 * @param {*}      [opts.gameId]      Game ID passed to ApiClient for server-side persists.
 */
export function applyActions(actions, { source = 'scenario', gameId = null } = {}) {
    if (!Array.isArray(actions) || actions.length === 0) return;

    for (const action of actions) {
        switch (action.type) {

            case 'set_global':
                if (action.key !== undefined && window.gameState?.globalVariables) {
                    window.gameState.globalVariables[action.key] = action.value;
                    window.eventDispatcher?.emit(`global_variable_changed:${action.key}`, {
                        name: action.key,
                        value: action.value
                    });
                    console.log(`[applyActions] set_global ${action.key} =`, action.value);
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
                    window.eventDispatcher?.emit('door_unlocked', { roomId: action.room_id, source });
                }
                break;

            case 'hint':
                if (action.message) {
                    window.gameAlert?.(action.message, 'info', action.title || 'Intelligence Received');
                    console.log('[applyActions] hint:', action.message);
                }
                break;

            case 'give_item':
                if (action.item && window.addToInventory) {
                    const itemSprite = {
                        name: action.item.type,
                        objectId: `action_item_${action.item.name}_${Date.now()}`,
                        scenarioData: action.item,
                        texture: { key: action.item.type },
                        keyPins: action.item.keyPins,
                        opens_lock: window.lockRef(action.item) || action.item.keyId,
                        setVisible: function() { return this; }
                    };
                    console.log('[applyActions] give_item:', action.item.name);
                    window.addToInventory(itemSprite);
                }
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
                        applyActions(onConfirm, { source, gameId });
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

            default:
                console.warn('[applyActions] Unknown action type:', action.type, action);
        }
    }
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
        buttonText = 'Return to Missions',
        outcome = 'neutral'
    } = opts;

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
