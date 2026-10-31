// Sprite selection UI:
// - Grid of static headshot images (HTML)
// - 160x160 Phaser canvas showing breathing-idle of selected sprite

const PREVIEW_SIZE = 160;
// The sprite frames are 80px, so the preview is drawn at a whole-number scale of them. The default
// is 2x in a 160px canvas; a host page can ask for a bigger one with the CSS custom property
// --pk-preview-scale on the container (a whole number), and sizes the container to match.
const FRAME_SIZE = 80;
let previewSize = PREVIEW_SIZE;

function previewSizeFor(containerId) {
  const el = document.getElementById(containerId);
  const scale = el ? parseInt(getComputedStyle(el).getPropertyValue('--pk-preview-scale'), 10) : NaN;
  return scale >= 1 && scale <= 8 ? scale * FRAME_SIZE : PREVIEW_SIZE;
}

function atlasFilename(spriteKey) {
  return spriteKey;
}

let phaserGame = null;
let currentPreviewSprite = null;
let initialSelectedSprite = null;

export function initializeSpritePreview(sprites, selectedSprite, containerIdOverride = null) {
  console.log('🎨 Initializing sprite preview...', { sprites: sprites.length, selectedSprite, containerIdOverride });
  initialSelectedSprite = selectedSprite || null;

  // Destroy previous Phaser game instance to avoid stacking canvases
  if (phaserGame) {
    phaserGame.destroy(true);
    phaserGame = null;
    currentPreviewSprite = null;
  }

  // Use custom container ID if provided, otherwise use default
  const containerId = containerIdOverride || 'sprite-preview-canvas-container';
  previewSize = previewSizeFor(containerId);
  const formId = containerIdOverride === 'sprite-preview-canvas-container-modal'
    ? 'preference-form-modal'
    : 'preference-form';

  class PreviewScene extends Phaser.Scene {
    constructor() {
      super({ key: 'Preview' });
    }

    create() {
      if (initialSelectedSprite) {
        loadAndShowSprite(this, initialSelectedSprite);
      }
      // Listen for radio changes
      const form = document.getElementById(formId);
      if (form) {
        const radios = form.querySelectorAll('input[type="radio"][name*="selected_sprite"]');
        radios.forEach(radio => {
          radio.addEventListener('change', (e) => {
            const sprite = e.target.value;
            loadAndShowSprite(this, sprite);
          });
        });
      }
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: containerId,
    width: previewSize,
    height: previewSize,
    transparent: true,
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.NONE
    },
    scene: [PreviewScene]
  };

  phaserGame = new Phaser.Game(config);
}

function loadAndShowSprite(scene, spriteKey) {
  const filename = atlasFilename(spriteKey);
  const atlasPath = `/break_escape/assets/characters/${filename}.png`;
  const jsonPath = `/break_escape/assets/characters/${filename}.json`;

  // Remove previous preview sprite
  if (currentPreviewSprite) {
    currentPreviewSprite.destroy();
    currentPreviewSprite = null;
  }

  if (scene.textures.exists(spriteKey)) {
    showSpriteInPreview(scene, spriteKey);
    return;
  }

  scene.load.atlas(spriteKey, atlasPath, jsonPath);
  scene.load.once('complete', () => {
    showSpriteInPreview(scene, spriteKey);
  });
  scene.load.start();
}

function showSpriteInPreview(scene, spriteKey) {
  if (currentPreviewSprite) {
    currentPreviewSprite.destroy();
  }

  const x = previewSize / 2;
  const y = previewSize / 2;

  currentPreviewSprite = scene.add.sprite(x, y, spriteKey);
  currentPreviewSprite.setScale(previewSize / FRAME_SIZE);

  const animKey = `${spriteKey}-preview-south`;
  if (!scene.anims.exists(animKey)) {
    const texture = scene.textures.get(spriteKey);
    const frameNames = texture.getFrameNames();

    // Prefer breathing-idle_south; fallback to walk_south (e.g. male_office_worker has no breathing-idle)
    const prefixes = ['breathing-idle_south_frame_', 'walk_south_frame_'];
    let frames = [];
    for (const prefix of prefixes) {
      frames = frameNames.filter(f => f.startsWith(prefix));
      if (frames.length > 0) break;
    }

    if (frames.length > 0) {
      frames.sort((a, b) => {
        const aNum = parseInt(a.match(/frame_(\d+)/)?.[1] || '0');
        const bNum = parseInt(b.match(/frame_(\d+)/)?.[1] || '0');
        return aNum - bNum;
      });

      scene.anims.create({
        key: animKey,
        frames: frames.map(frameName => ({ key: spriteKey, frame: frameName })),
        frameRate: 8,
        repeat: -1
      });

      currentPreviewSprite.play(animKey);
    } else {
      // No south animation (e.g. some atlases use different naming) – show first frame
      const firstFrame = frameNames[0];
      if (firstFrame) currentPreviewSprite.setFrame(firstFrame);
    }
  } else {
    currentPreviewSprite.play(animKey);
  }

  console.log('✓ Preview updated:', spriteKey);
}
