// The shared concept-card renderer (SE design 02 N1; 07 N7 reuses it).
//
// A card is { id, title, text, image? } from social.conceptCards. It shows behind a visible
// "What is this?" button (never hover only). Everything authored is set with textContent;
// the image is a pixel-art file, path relative to assets/ (alt text is the card title, or empty and
// aria-hidden when the card says it is decorative).
//
//   const c = createConceptCard(card, { onToggle });
//   parent.appendChild(c.el);   c.toggle(); c.isOpen();

const IMAGE_BASE = '/break_escape/assets/';

export function createConceptCard(card, { doc = null, open = false, onToggle = null, buttonLabel = 'What is this?', imageBase = IMAGE_BASE } = {}) {
    const d = doc || document;
    const make = (tag, cls, text) => {
        const n = d.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined) n.textContent = text;
        return n;
    };
    const el = make('div', 'cc-card');
    el.setAttribute('data-card', card?.id || '');
    const panelId = `cc-panel-${String(card?.id || 'x').replace(/[^A-Za-z0-9_-]/g, '_')}-${++createConceptCard._n}`;

    const button = make('button', 'cc-button minigame-button', buttonLabel);
    button.type = 'button';
    button.setAttribute('aria-controls', panelId);
    button.setAttribute('aria-expanded', 'false');

    const panel = make('div', 'cc-panel');
    panel.id = panelId;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', card?.title || 'Explanation');
    panel.appendChild(make('h4', 'cc-title', card?.title || ''));
    if (card?.image && typeof card.image === 'string') {
        const img = d.createElement('img');
        img.className = 'cc-image';
        img.src = imageBase + card.image.replace(/^\/+/, '');
        img.alt = card.imageAlt || '';
        if (!card.imageAlt) img.setAttribute('aria-hidden', 'true');
        panel.appendChild(img);
    }
    for (const para of String(card?.text || '').split(/\n{2,}/)) {
        if (para.trim()) panel.appendChild(make('p', 'cc-text', para.trim()));
    }

    let isOpen = false;
    const apply = (v) => {
        isOpen = !!v;
        button.setAttribute('aria-expanded', String(isOpen));
        panel.hidden = !isOpen;
        el.classList.toggle('is-open', isOpen);
    };
    apply(open);
    button.addEventListener('click', (e) => {
        e.preventDefault();
        apply(!isOpen);
        if (onToggle) onToggle(card?.id, isOpen);
    });

    el.appendChild(button);
    el.appendChild(panel);
    return { el, button, panel, isOpen: () => isOpen, toggle: (force) => apply(force === undefined ? !isOpen : force) };
}
createConceptCard._n = 0;
