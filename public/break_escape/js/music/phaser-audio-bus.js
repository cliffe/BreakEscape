/**
 * Repatch Phaser 3 WebAudioSoundManager output onto MusicController.sfxGain
 * so the SFX slider affects Phaser-loaded sounds.
 *
 * Phaser wires: masterMuteNode → masterVolumeNode → context.destination
 * After wiring: masterVolumeNode → MusicController.getPhaserSfxInput()
 *
 * Call once per Phaser.Game after the sound manager exists (e.g. game 'ready').
 */

import MusicController from './music-controller.js';

export function wirePhaserGameSoundToBreakEscape(game) {
    const sm = game?.sound;
    if (!sm?.masterVolumeNode || !sm.context) return;
    if (sm.context !== MusicController.context) return;

    try {
        sm.masterVolumeNode.disconnect();
    } catch (_) {
        /* already disconnected */
    }
    try {
        sm.masterVolumeNode.connect(MusicController.getPhaserSfxInput());
    } catch (e) {
        console.warn('[BreakEscape] Failed to wire Phaser sound to SFX bus:', e);
    }
}
