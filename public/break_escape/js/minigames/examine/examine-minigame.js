import { MinigameScene } from '../framework/base-minigame.js';
import { displayDashes } from '../../utils/display-dashes.js';
import { examineDisplaySize } from '../../systems/examine.js';

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Examine: the object's sprite at twice its on-screen room size (whole-number
 * multiple of its pixels, at least 4x; pixelated, never smoothed), its
 * name, then its observations and text. Opened by systems/examine.js for
 * inventory items with no other action and text-only room objects.
 */
export class ExamineMinigame extends MinigameScene {
    init() {
        super.init();
        this.container.classList.add('examine-minigame');

        const p = this.params || {};
        const observations = p.observations ? esc(displayDashes(p.observations)) : '';
        const text = p.text ? esc(displayDashes(p.text)) : '';

        this.gameContainer.innerHTML = `
            <div class="examine-panel">
                <div class="examine-image-box">
                    ${p.imageSrc ? `<img class="examine-sprite" alt="${esc(p.itemName)}">` : ''}
                </div>
                <h3 class="examine-name">${esc(displayDashes(p.itemName || p.title || ''))}</h3>
                ${observations ? `<p class="examine-observations">${observations}</p>` : ''}
                ${text ? `<div class="examine-text">${text}</div>` : ''}
            </div>
        `;

        const img = this.gameContainer.querySelector('.examine-sprite');
        if (img) {
            // Size before the src is set when the frame size is known, so the
            // layout never jumps; otherwise size from the loaded image.
            const applySize = (w, h) => {
                const size = examineDisplaySize(w, h, p.displayScale);
                if (!size.width || !size.height) return;
                img.style.width = `${size.width}px`;
                img.style.height = `${size.height}px`;
                img.dataset.scale = String(size.scale);
            };
            if (p.imageWidth && p.imageHeight) applySize(p.imageWidth, p.imageHeight);
            else img.addEventListener('load', () => applySize(img.naturalWidth, img.naturalHeight), { once: true });
            img.src = p.imageSrc;
        }
    }

    getTestState() {
        const p = this.params || {};
        const img = this.gameContainer?.querySelector('.examine-sprite');
        return {
            ...super.getTestState(),
            examine: {
                itemName: p.itemName || null,
                itemType: p.itemType || null,
                itemId: p.itemId || null,
                observations: p.observations || null,
                text: p.text || null,
                imageWidth: img ? parseInt(img.style.width, 10) || null : null,
                imageHeight: img ? parseInt(img.style.height, 10) || null : null,
                scale: img ? Number(img.dataset.scale) || null : null,
                roomDisplayScale: p.displayScale ?? null
            }
        };
    }
}
