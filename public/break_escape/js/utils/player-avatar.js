/**
 * The learner's avatar (aw9, user 2026-10-23): the player's chosen avatar always wins, and the
 * portrait follows it.
 *
 * The chosen avatar is `window.breakEscapeConfig.playerSprite` (the saved player preference,
 * which games#show requires before a game starts). A scenario's `player.spriteSheet` is only the
 * fallback for a page with no chosen avatar (standalone pages, tests), and its `player.spriteTalk`
 * is used only when it belongs to the sprite actually played: a scenario written for one
 * character (the awareness shells name female_office_worker_v2) must not leave that
 * character's talk portrait on a learner who chose someone else.
 *
 * Pure apart from the defaults, which read window when it exists.
 */

export const FALLBACK_PLAYER_SPRITE = 'male_hacker_hood_v2';

// Legacy sprites use hyphen naming; all others follow {sprite}_talk.png.
const LEGACY_TALK = Object.freeze({
    hacker: 'assets/characters/hacker-talk.png',
    'hacker-red': 'assets/characters/hacker-red-talk.png'
});

const win = () => (typeof window !== 'undefined' ? window : {});

/** The sprite the player is shown as: the chosen avatar, else the scenario's, else the fallback. */
export function chosenPlayerSprite(config = win().breakEscapeConfig, scenario = win().gameScenario) {
    return config?.playerSprite || scenario?.player?.spriteSheet || FALLBACK_PLAYER_SPRITE;
}

/** The character a talk image belongs to: its file stem without `_talk`/`-talk` and `_v2`. */
function talkStem(path) {
    return (String(path).split('/').pop() || '').replace(/\.\w+$/, '').replace(/[_-]talk$/, '').replace(/_v2$/, '');
}

/**
 * The talk portrait for `sprite`. A configured `spriteTalk` is kept only when it is the same
 * character (a `<key>_v2` sprite matches `<key>_talk.png`); otherwise the path is derived from
 * the sprite. The person-chat renderer falls back from `<key>_v2_talk.png` to `<key>_talk.png`
 * and then to the headshot, so a derived path is always safe to hand it.
 */
export function playerTalkPath(sprite, configuredTalk) {
    const key = typeof sprite === 'string' && sprite ? sprite : FALLBACK_PLAYER_SPRITE;
    if (typeof configuredTalk === 'string' && configuredTalk) {
        const stem = talkStem(configuredTalk);
        if (stem && stem === key.replace(/_v2$/, '')) return configuredTalk;
    }
    return LEGACY_TALK[key] || `assets/characters/${key}_talk.png`;
}

/**
 * Point the scenario's player block at the sprite played, so every reader of
 * `gameScenario.player` (person-chat's self-view, the HUD) sees one consistent avatar.
 * Returns the player block.
 */
export function syncScenarioPlayer(scenario, sprite) {
    if (!scenario || typeof scenario !== 'object') return null;
    scenario.player = scenario.player && typeof scenario.player === 'object' ? scenario.player : {};
    const p = scenario.player;
    const key = typeof sprite === 'string' && sprite ? sprite : chosenPlayerSprite(undefined, scenario);
    const talk = playerTalkPath(key, p.spriteTalk);
    p.spriteSheet = key;
    p.spriteTalk = talk;
    return p;
}
