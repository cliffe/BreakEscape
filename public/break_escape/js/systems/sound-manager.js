/**
 * Sound Manager
 * Centralized system for managing audio playback in Break Escape
 * 
 * Uses Phaser's sound system for playback, caching, and effects.
 * Provides convenient methods for playing common game sounds.
 */

class SoundManager {
    constructor(phaserScene) {
        this.scene = phaserScene;
        this.sounds = {};
        this.enabled = true;
        this.masterVolume = 1.0;
        this.currentAmbient = null;
        
        // Sound volume categories (0-1)
        this.volumeSettings = {
            ui: 0.7,
            interactions: 0.8,
            notifications: 0.6,
            effects: 0.85,
            music: 0.5
        };
    }

    /**
     * Load all sound assets into Phaser
     * Called during the preload phase
     */
    preloadSounds() {
        // Lockpicking mini-game sounds
        this.scene.load.audio('lockpick_binding', 'sounds/lockpick_binding.mp3');
        this.scene.load.audio('lockpick_click', 'sounds/lockpick_click.mp3');
        this.scene.load.audio('lockpick_overtension', 'sounds/lockpick_overtension.mp3');
        this.scene.load.audio('lockpick_reset', 'sounds/lockpick_reset.mp3');
        this.scene.load.audio('lockpick_set', 'sounds/lockpick_set.mp3');
        this.scene.load.audio('lockpick_success', 'sounds/lockpick_success.mp3');
        this.scene.load.audio('lockpick_tension', 'sounds/lockpick_tension.mp3');
        this.scene.load.audio('lockpick_wrong', 'sounds/lockpick_wrong.mp3');

        // GASP door sounds
        this.scene.load.audio('door_knock', 'sounds/GASP_Door Knock.mp3');

        // GASP interaction sounds
        this.scene.load.audio('item_interact_1', 'sounds/GASP_Item Interact_1.mp3');
        this.scene.load.audio('item_interact_2', 'sounds/GASP_Item Interact_2.mp3');
        this.scene.load.audio('item_interact_3', 'sounds/GASP_Item Interact_3.mp3');

        // GASP lock interaction sounds
        this.scene.load.audio('lock_interact_1', 'sounds/GASP_Lock Interact_1.mp3');
        this.scene.load.audio('lock_interact_2', 'sounds/GASP_Lock Interact_2.mp3');
        this.scene.load.audio('lock_interact_3', 'sounds/GASP_Lock Interact_3.mp3');
        this.scene.load.audio('lock_interact_4', 'sounds/GASP_Lock Interact_4.mp3');
        this.scene.load.audio('lock_and_load', 'sounds/GASP_Lock and Load.mp3');

        // GASP UI click sounds
        this.scene.load.audio('ui_click_1', 'sounds/GASP_UI_Clicks_1.mp3');
        this.scene.load.audio('ui_click_2', 'sounds/GASP_UI_Clicks_2.mp3');
        this.scene.load.audio('ui_click_3', 'sounds/GASP_UI_Clicks_3.mp3');
        this.scene.load.audio('ui_click_4', 'sounds/GASP_UI_Clicks_4.mp3');
        this.scene.load.audio('ui_click_6', 'sounds/GASP_UI_Clicks_6.mp3');

        // GASP UI alert sounds
        this.scene.load.audio('ui_alert_1', 'sounds/GASP_UI_Alert_1.mp3');
        this.scene.load.audio('ui_alert_2', 'sounds/GASP_UI_Alert_2.mp3');

        // GASP UI confirm sound
        this.scene.load.audio('ui_confirm', 'sounds/GASP_UI_Confirm.mp3');

        // GASP UI notification sounds
        this.scene.load.audio('ui_notification_1', 'sounds/GASP_UI_Notification_1.mp3');
        this.scene.load.audio('ui_notification_2', 'sounds/GASP_UI_Notification_2.mp3');
        this.scene.load.audio('ui_notification_3', 'sounds/GASP_UI_Notification_3.mp3');
        this.scene.load.audio('ui_notification_4', 'sounds/GASP_UI_Notification_4.mp3');
        this.scene.load.audio('ui_notification_5', 'sounds/GASP_UI_Notification_5.mp3');
        this.scene.load.audio('ui_notification_6', 'sounds/GASP_UI_Notification_6.mp3');

        // GASP UI reject sound
        this.scene.load.audio('ui_reject', 'sounds/GASP_UI_Reject.mp3');

        // Game-specific sounds
        this.scene.load.audio('chair_roll', 'sounds/chair_roll.mp3');
        this.scene.load.audio('message_received', 'sounds/message_received.mp3');
        this.scene.load.audio('phone_vibrate', 'sounds/phone_vibrate.mp3');
        this.scene.load.audio('page_turn', 'sounds/page_turn.mp3');
        this.scene.load.audio('message_sent', 'sounds/message_sent.mp3');
        this.scene.load.audio('heartbeat', 'sounds/heartbeat.mp3');
        this.scene.load.audio('footsteps', 'sounds/footsteps.mp3');
        this.scene.load.audio('drawer_open', 'sounds/drawer_open.mp3');
        this.scene.load.audio('rfid_unlock', 'sounds/rfid_unlock.mp3');

        // Combat / KO sounds (CC0 public domain, source: bigsoundbank.com)
        this.scene.load.audio('wilhelm_scream', 'sounds/wilhelm_scream.mp3');
        this.scene.load.audio('body_fall', 'sounds/body_fall.mp3');

        // Interaction sounds (CC0 public domain, source: bigsoundbank.com)
        this.scene.load.audio('keypad_beep', 'sounds/keypad_beep.mp3');
        this.scene.load.audio('hit_impact', 'sounds/hit_impact.mp3');
        this.scene.load.audio('card_scan', 'sounds/card_scan.mp3');

        // Punch swipe sounds (CC0 public domain, source: bigsoundbank.com)
        this.scene.load.audio('punch_swipe_jab', 'sounds/punch_swipe_jab.mp3');
        this.scene.load.audio('punch_swipe_cross', 'sounds/punch_swipe_cross.mp3');

        // Hit grunt sounds (CC0 public domain, source: freesound.org)
        this.scene.load.audio('grunt_male_soft',    'sounds/grunt_male_soft.mp3');
        this.scene.load.audio('grunt_male_heavy',   'sounds/grunt_male_heavy.mp3');
        this.scene.load.audio('grunt_female_soft',  'sounds/grunt_female_soft.mp3');
        this.scene.load.audio('grunt_female_heavy', 'sounds/grunt_female_heavy.mp3');

        // Ambient room sounds (CC0 public domain, source: bigsoundbank.com)
        this.scene.load.audio('server_room_ventilation', 'sounds/server_room_ventilation.mp3');
    }

    /**
     * Initialize sound objects after preload
     * Called during scene creation
     */
    initializeSounds() {
        // Create all sound objects
        const soundNames = [
            // Lockpicking
            'lockpick_binding', 'lockpick_click', 'lockpick_overtension',
            'lockpick_reset', 'lockpick_set', 'lockpick_success',
            'lockpick_tension', 'lockpick_wrong',
            // Door
            'door_knock',
            // Interactions
            'item_interact_1', 'item_interact_2', 'item_interact_3',
            'lock_interact_1', 'lock_interact_2', 'lock_interact_3', 'lock_interact_4', 'lock_and_load',
            // UI clicks
            'ui_click_1', 'ui_click_2', 'ui_click_3', 'ui_click_4', 'ui_click_6',
            // UI alerts
            'ui_alert_1', 'ui_alert_2',
            // UI confirm
            'ui_confirm',
            // UI notifications
            'ui_notification_1', 'ui_notification_2', 'ui_notification_3',
            'ui_notification_4', 'ui_notification_5', 'ui_notification_6',
            // UI reject
            'ui_reject',
            // Game sounds
            'chair_roll', 'message_received', 'phone_vibrate', 'page_turn', 'message_sent', 'heartbeat', 'footsteps', 'drawer_open', 'rfid_unlock',
            // Combat / KO sounds
            'wilhelm_scream', 'body_fall',
            // Interaction sounds
            'keypad_beep', 'hit_impact', 'card_scan',
            // Punch swipe sounds
            'punch_swipe_jab', 'punch_swipe_cross',
            // Hit grunt sounds
            'grunt_male_soft', 'grunt_male_heavy', 'grunt_female_soft', 'grunt_female_heavy',
            // Ambient room sounds
            'server_room_ventilation'
        ];

        for (const soundName of soundNames) {
            try {
                this.sounds[soundName] = this.scene.sound.add(soundName, {
                    volume: this.getVolumeForSound(soundName)
                });
            } catch (error) {
                console.warn(`Failed to initialize sound: ${soundName}`, error);
            }
        }
    }

    /**
     * Determine volume level based on sound category
     */
    getVolumeForSound(soundName) {
        let category = 'effects';
        if (soundName.includes('ui_click') || soundName.includes('ui_confirm')) category = 'ui';
        else if (soundName.includes('ui_alert') || soundName.includes('ui_notification') || soundName.includes('ui_reject')) category = 'notifications';
        else if (soundName.includes('lockpick') || soundName.includes('chair') || soundName.includes('wilhelm') || soundName.includes('body_fall') || soundName.includes('hit_impact') || soundName.includes('punch_swipe') || soundName.includes('grunt_')) category = 'effects';
        else if (soundName.includes('keypad_beep') || soundName.includes('card_scan')) category = 'interactions';
        else if (soundName.includes('item_interact') || soundName.includes('lock_interact') || soundName.includes('door_knock')) category = 'interactions';
        else if (soundName.includes('message_received') || soundName.includes('phone_vibrate') || soundName.includes('message_sent')) category = 'notifications';
        else if (soundName.includes('page_turn')) category = 'interactions';

        return this.volumeSettings[category] * this.masterVolume;
    }

    /**
     * Play a sound by name
     * @param {string} soundName - Name of the sound to play
     * @param {Object} options - Optional: { volume, loop, delay }
     */
    play(soundName, options = {}) {
        if (!this.enabled) return;

        // console log
        console.log(`🔊 Playing sound: ${soundName}`);

        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound not found: ${soundName}`);
            return;
        }

        // Set volume if specified
        if (options.volume !== undefined) {
            sound.setVolume(options.volume * this.masterVolume);
        } else {
            sound.setVolume(this.getVolumeForSound(soundName));
        }

        // Set loop if specified
        if (options.loop !== undefined) {
            sound.setLoop(options.loop);
        }

        // Set delay if specified
        if (options.delay !== undefined) {
            this.scene.time.delayedCall(options.delay, () => {
                if (sound && !sound.isPlaying) {
                    sound.play();
                }
            });
        } else {
            sound.play();
        }
    }

    /**
     * Stop a sound by name
     */
    stop(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.stop();
        }
    }

    /**
     * Stop all sounds
     */
    stopAll() {
        for (const sound of Object.values(this.sounds)) {
            if (sound && sound.isPlaying) {
                sound.stop();
            }
        }
    }

    /**
     * Play a random UI click sound
     */
    playUIClick() {
        const clicks = ['ui_click_1', 'ui_click_2', 'ui_click_3', 'ui_click_4', 'ui_click_6'];
        const randomClick = clicks[Math.floor(Math.random() * clicks.length)];
        this.play(randomClick);
    }

    /**
     * Play a random UI notification sound
     */
    playUINotification() {
        const notifications = ['ui_notification_1', 'ui_notification_2', 'ui_notification_3', 'ui_notification_4', 'ui_notification_5', 'ui_notification_6'];
        const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
        this.play(randomNotification);
    }

    /**
     * Play a random item interaction sound
     */
    playItemInteract() {
        const sounds = ['item_interact_1', 'item_interact_2', 'item_interact_3'];
        const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
        this.play(randomSound);
    }

    /**
     * Play a random lock interaction sound
     */
    playLockInteract() {
        const sounds = ['lock_interact_1', 'lock_interact_2', 'lock_interact_3', 'lock_interact_4'];
        const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
        this.play(randomSound);
    }

    /**
     * Play an ambient looping sound with fade-in
     * @param {string} soundName - Key of the ambient sound
     * @param {number} fadeInDuration - Fade-in duration in milliseconds (default 2000)
     */
    playAmbient(soundName, fadeInDuration = 2000) {
        if (!this.enabled) return;

        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Ambient sound not found: ${soundName}`);
            return;
        }

        if (sound.isPlaying) return;

        const targetVolume = this.volumeSettings.music * this.masterVolume;
        sound.setVolume(0);
        sound.setLoop(true);
        sound.play();

        this.scene.tweens.addCounter({
            from: 0,
            to: targetVolume,
            duration: fadeInDuration,
            ease: 'Linear',
            onUpdate: (tween) => {
                sound.setVolume(tween.getValue());
            }
        });

        this.currentAmbient = soundName;
        console.log(`🎵 Ambient sound started: ${soundName}`);
    }

    /**
     * Stop the current ambient sound with fade-out
     * @param {number} fadeOutDuration - Fade-out duration in milliseconds (default 2000)
     */
    stopAmbient(fadeOutDuration = 2000) {
        if (!this.currentAmbient) return;

        const soundName = this.currentAmbient;
        const sound = this.sounds[soundName];
        this.currentAmbient = null;

        if (!sound || !sound.isPlaying) return;

        const startVolume = sound.volume;
        this.scene.tweens.addCounter({
            from: startVolume,
            to: 0,
            duration: fadeOutDuration,
            ease: 'Linear',
            onUpdate: (tween) => {
                sound.setVolume(tween.getValue());
            },
            onComplete: () => {
                if (sound.isPlaying) sound.stop();
            }
        });

        console.log(`🎵 Ambient sound stopping: ${soundName}`);
    }

    /**
     * Fade ambient sound to a target normalized volume (0–1).
     * Handles starting, volume transitions, and stopping in one method.
     * @param {string} soundName - Key of the ambient sound
     * @param {number} normalizedVolume - Target multiplier: 0 = stop, 0.25/0.5/1.0 = zone levels
     * @param {number} duration - Fade duration in ms (default 400)
     */
    fadeAmbientTo(soundName, normalizedVolume, duration = 400) {
        if (!this.enabled) return;

        // Switch to a different sound — stop current immediately
        if (this.currentAmbient && this.currentAmbient !== soundName) {
            const oldSound = this.sounds[this.currentAmbient];
            if (oldSound?.isPlaying) oldSound.stop();
            this.currentAmbient = null;
            if (this._ambientTween) { this._ambientTween.stop(); this._ambientTween = null; }
        }

        if (normalizedVolume === 0) {
            if (!this.currentAmbient) return;
            const sound = this.sounds[this.currentAmbient];
            this.currentAmbient = null;
            if (this._ambientTween) { this._ambientTween.stop(); this._ambientTween = null; }
            if (!sound?.isPlaying) return;
            const startVol = sound.volume;
            this._ambientTween = this.scene.tweens.addCounter({
                from: startVol,
                to: 0,
                duration,
                ease: 'Linear',
                onUpdate: (tween) => sound.setVolume(tween.getValue()),
                onComplete: () => { if (sound.isPlaying) sound.stop(); this._ambientTween = null; }
            });
            return;
        }

        const targetVolume = this.volumeSettings.music * this.masterVolume * normalizedVolume;
        const sound = this.sounds[soundName];
        if (!sound) { console.warn(`Ambient sound not found: ${soundName}`); return; }

        if (!sound.isPlaying) {
            // Set volume to 0 before play() to avoid a spike from the configured base volume
            sound.setVolume(0);
            sound.play({ loop: true });
            console.log(`🎵 Ambient sound started: ${soundName}`);
        }

        // Always keep currentAmbient in sync (may have been cleared by a fade-out tween)
        this.currentAmbient = soundName;

        if (this._ambientTween) { this._ambientTween.stop(); this._ambientTween = null; }
        const startVol = sound.volume;
        this._ambientTween = this.scene.tweens.addCounter({
            from: startVol,
            to: targetVolume,
            duration,
            ease: 'Linear',
            onUpdate: (tween) => sound.setVolume(tween.getValue()),
            onComplete: () => { this._ambientTween = null; }
        });
    }

    /**
     * Set master volume (0-1)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        // Update all active sounds
        for (const sound of Object.values(this.sounds)) {
            if (sound) {
                sound.setVolume(this.getVolumeForSound(sound.key));
            }
        }
    }

    /**
     * Set category volume
     */
    setCategoryVolume(category, volume) {
        if (this.volumeSettings[category] !== undefined) {
            this.volumeSettings[category] = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Toggle sound on/off
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * Set enabled/disabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Check if sounds are enabled
     */
    isEnabled() {
        return this.enabled;
    }
}

export default SoundManager;
