/**
 * Music Controller Configuration
 *
 * baseURL is resolved in this order:
 *   1. window.breakEscapeConfig.musicBasePath  (set by Rails engine host)
 *   2. window.breakEscapeConfig.assetsPath + '/music' (derived from existing asset config)
 *   3. Hard-coded fallback below
 *
 * To host MP3s somewhere else entirely, set:
 *   window.breakEscapeConfig = { musicBasePath: 'https://cdn.example.com/music' }
 *
 * Playlist shuffle options:
 *   'shuffle'     - random order, no repeats until all tracks played
 *   'sequential'  - always play in defined order
 */

function resolveMusicBaseURL() {
    if (window.breakEscapeConfig?.musicBasePath) {
        return window.breakEscapeConfig.musicBasePath.replace(/\/$/, '');
    }
    if (window.breakEscapeConfig?.assetsPath) {
        return window.breakEscapeConfig.assetsPath.replace(/\/$/, '') + '/music';
    }
    return '/break_escape/assets/music';
}

export const MUSIC_CONFIG = {
    // Resolved at init time so runtime config changes are picked up
    get baseURL() { return resolveMusicBaseURL(); },

    // Global fade duration in milliseconds when switching playlists
    fadeDuration: 2500,

    // Default playlist to start with (null = silent until explicitly switched)
    defaultPlaylist: 'noir',

    // Default volume levels (0.0 – 1.0)
    defaultMusicVolume:  0.3,
    defaultSFXVolume:    1.0,
    defaultVoiceVolume:  1.0,
    defaultMasterVolume: 1.0,

    // Maximum number of decoded AudioBuffers to keep cached in MusicController.
    // Must be ≥ 2 to support crossfade (dying + incoming buffers both pinned).
    // 3 = current + next prefetch + 1 LRU spare. Each buffer is ~10 MB/min of
    // track length, so a long session with many tracks no longer accumulates
    // unbounded decoded PCM in RAM. Set to a very large number to disable LRU.
    bufferCacheSize: 3,

    /**
     * Playlists
     * Each track: { title, file }
     *   - title: display name shown in the widget
     *   - file:  path relative to baseURL (no leading slash)
     */
    playlists: {
        noir: {
            displayName: 'Noir',
            shuffle: 'sequential',
            tracks: [
                { title: 'Midnight Cipher Beta',                  file: 'Noir/Midnight Cipher Beta.mp3' },
                { title: 'Shadow In E Minor',                     file: 'Noir/Shadow In E Minor.mp3' },
                { title: 'Midnight Cipher Chase 1',             file: 'Noir/Midnight Cipher Chase (1).mp3' },
                { title: 'Encrypted Shadows',                     file: 'Noir/Encrypted Shadows.mp3' },
                { title: 'Midnight Surf Cipher 1',                file: 'Noir/Midnight Surf Cipher 1.mp3' },
                { title: 'Shadow of the Bond Chord',              file: 'Noir/Shadow of the Bond Chord.mp3' },
                { title: 'Midnight Cipher Chase 2',             file: 'Noir/Midnight Cipher Chase (2).mp3' },
                { title: 'Shadowline Protocol',                   file: 'Noir/Shadowline Protocol.mp3' },
                { title: 'Shadow In E Minor 1',                 file: 'Noir/Shadow In E Minor (1).mp3' },
                { title: 'Midnight Exit Strategy',                file: 'Noir/Midnight Exit Strategy.mp3' },
                { title: 'Midnight Cipher Chase',                 file: 'Noir/Midnight Cipher Chase.mp3' },
                { title: 'Midnight Cipher Chase 3',             file: 'Noir/Midnight Cipher Chase (3).mp3' },
                { title: 'Midnight Surf Cipher 2',                file: 'Noir/Midnight Surf Cipher 2.mp3' },
                { title: 'Steel Shadows in E Minor', file: 'Noir/Steel Shadows in E Minor (Remastered).mp3' },
            ]
        },

        threat: {
            displayName: 'Threat',
            shuffle: 'shuffle',
            tracks: [
                { title: 'Hybrid Attack 0',              file: 'SpyAgro/Hybrid Attack 0.mp3' },
                { title: 'Action Dub',                   file: 'SpyAgro/Action Dub.mp3' },
                { title: 'Shadow Protocol 0',              file: 'SpyAgro/Shadow Protocol.mp3' },
                { title: 'Hybrid Attack 1',              file: 'SpyAgro/Hybrid Attack 1.mp3' },
                { title: 'Shadow Cipher',                file: 'SpyAgro/Shadow Cipher.mp3' },
                { title: 'Shadow Protocol 1', file: 'SpyAgro/Shadow Protocol (Remastered).mp3' },
                { title: 'Hybrid Attack 2',              file: 'SpyAgro/Hybrid Attack 2.mp3' },
            ]
        },

        'spy-action': {
            displayName: 'Spy Action',
            shuffle: 'shuffle',
            tracks: [
                { title: 'Cold Bond Circuit',   file: 'SpyAction/Cold Bond Circuit.mp3' },
                { title: 'Emerald Trigger',     file: 'SpyAction/Emerald Trigger.mp3' },
                { title: 'Midnight Double Agent', file: 'SpyAction/Midnight Double Agent.mp3' },
                { title: 'Midnight Trigger',    file: 'SpyAction/Midnight Trigger.mp3' },
                { title: 'Shadow Tide',         file: 'SpyAction/Shadow Tide.mp3' },
                { title: 'Shadowline Protocol', file: 'Noir/Shadowline Protocol.mp3' },
                { title: 'Midnight Exit Strategy', file: 'Noir/Midnight Exit Strategy.mp3' },
            ]
        },

        cutscene: {
            displayName: 'Cutscene',
            shuffle: 'sequential',
            tracks: [
                { title: 'Shadow Code 0', file: 'CutScene/Shadow Code 0.mp3' },
                { title: 'Shadow Code 1', file: 'CutScene/Shadow Code 1.mp3' },
                { title: 'Shadow Code 2', file: 'CutScene/Shadow Code 2.mp3' },
            ]
        },

        vocals: {
            displayName: 'Vocals',
            shuffle: 'shuffle',
            tracks: [
                { title: 'Digital Ghost',          file: 'Vocals/Digital Ghost.mp3' },
                { title: 'Digital Leashes',        file: 'Vocals/Digital Leashes.mp3' },
                { title: 'Entropy Failsafe',       file: 'Vocals/Entropy Failsafe.mp3' },
                { title: 'Ghost in the Wire',      file: 'Vocals/Ghost in the Wire.mp3' },
                { title: 'Hacktivity Neon',        file: 'Vocals/Hacktivity Neon (1).mp3' },
                { title: 'Safetynet in the Smoke', file: 'Vocals/Safetynet in the Smoke.mp3' },
            ]
        },

        end: {
            displayName: 'Ending',
            shuffle: 'sequential',
            tracks: [
                { title: 'Steel Shadows in E Minor (Remastered)', file: 'Noir/Steel Shadows in E Minor (Remastered).mp3' },
                { title: 'Shadow Code 2',                         file: 'CutScene/Shadow Code 2.mp3' },
            ]
        },

        // 'victory' — plays when the player completes a mission.
        // Switching to this playlist auto-opens the fullscreen Bond Visualiser.
        // Uses the Vocals playlist so the visualiser plays the vocal tracks.
        victory: {
            displayName: 'Victory',
            shuffle: 'shuffle',
            tracks: [
                { title: 'Cipher Tide',           file: 'Vocals/Cipher Tide.mp3' },
                { title: 'Digital Ghost',          file: 'Vocals/Digital Ghost.mp3' },
                { title: 'Digital Leashes',        file: 'Vocals/Digital Leashes.mp3' },
                { title: 'Entropy Failsafe',       file: 'Vocals/Entropy Failsafe.mp3' },
                { title: 'Ghost in the Wire',      file: 'Vocals/Ghost in the Wire.mp3' },
                { title: 'Hacktivity Neon',        file: 'Vocals/Hacktivity Neon (1).mp3' },
                { title: 'Safetynet in the Smoke', file: 'Vocals/Safetynet in the Smoke.mp3' },
            ]
        },
    }
};
