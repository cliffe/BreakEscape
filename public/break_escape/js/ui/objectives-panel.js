/**
 * ObjectivesPanel
 * 
 * HUD element displaying current mission objectives (top-right).
 * Collapsible panel with aim/task hierarchy.
 * Pixel-art aesthetic with sharp corners and 2px borders.
 * 
 * @module objectives-panel
 */
import { displayDashes } from '../utils/display-dashes.js';

// Ids are scenario data: escaped for a quoted attribute (quotes included, no dash display),
// and for a quoted attribute selector when looked up again.
const escapeAttr = (value) => String(value ?? '').replace(/[&<>"']/g, ch => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const selectorValue = (value) => String(value ?? '').replace(/["\\]/g, '\\$&').replace(/\n/g, '\\a ');

// Pixel-art arrow (assets/icons/chevron-down.png), drawn as a mask in the text
// colour; a toggle with .is-collapsed turns it to point right
const CHEVRON = '<i class="obj-chevron" aria-hidden="true"></i>';

export class ObjectivesPanel {
  constructor(objectivesManager) {
    this.manager = objectivesManager;
    this.container = null;
    this.content = null;
    this.isCollapsed = false;
    this.isMinimized = false;
    this.aimCollapsed = {}; // tracks user-toggled collapse state per aimId
    this.aimStatus = {};   // tracks last known status to detect completions

    this.createPanel();
    // Phones (UI decision H1 option A): the panel is a one-line pill in the top bar, the current
    // aim and its count. It never opens by itself; a tap opens it as a sheet with an X.
    this._pillFlashTimer = null;
    this._pillFlash = null;
    this._wasCompact = ObjectivesPanel.compactNow();
    if (this._wasCompact) this.setCollapsed(true);
    this._compactCue = () => {
      const compact = ObjectivesPanel.compactNow();
      if (compact && !this._wasCompact) this.setCollapsed(true);
      this._wasCompact = compact;
      this.container.classList.toggle('objectives-sheet', compact && !this.isCollapsed);
    };
    window.addEventListener?.('resize', this._compactCue);
    this.manager.addListener((aims) => this.render(aims));

    // Initial render
    this.render(this.manager.getActiveAims());
  }
  
  createPanel() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'objectives-panel';
    this.container.className = 'objectives-panel';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'objectives-header';
    header.innerHTML = `
      <span class="objectives-title"><i class="objectives-clipboard" aria-hidden="true"></i><span class="objectives-title-text">Objectives</span></span>
      <span class="objectives-pill-summary" aria-live="polite"></span>
      <div class="objectives-controls">
        <button class="objectives-toggle" aria-label="Toggle objectives" title="Collapse/Expand">${CHEVRON}</button>
      </div>
    `;
    
    // Toggle collapse on header click
    header.querySelector('.objectives-toggle').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleCollapse();
    });
    
    // Also allow clicking the header itself
    header.addEventListener('click', () => {
      this.toggleCollapse();
    });
    
    // Create content area
    this.content = document.createElement('div');
    this.content.className = 'objectives-content';
    
    // Delegate aim header clicks to toggle individual aim collapse
    this.content.addEventListener('click', (e) => {
      // A postponed ending (systems/ending-check.js): "End the mission" finishes it
      if (e.target.closest('.objectives-end-button')) {
        window.endingCheck?.endHeld?.();
        return;
      }
      const aimHeader = e.target.closest('.aim-header');
      if (!aimHeader) return;
      const aimEl = aimHeader.closest('.objective-aim');
      if (!aimEl) return;
      const aimId = aimEl.dataset.aimId;
      this.aimCollapsed[aimId] = !this.aimCollapsed[aimId];
      aimEl.classList.toggle('aim-collapsed', this.aimCollapsed[aimId]);
      const toggle = aimHeader.querySelector('.aim-toggle');
      if (toggle) toggle.classList.toggle('is-collapsed', this.aimCollapsed[aimId]);
    });

    this.container.appendChild(header);
    this.container.appendChild(this.content);
    document.body.appendChild(this.container);

    // The "more below" cue follows the list as it scrolls, folds and resizes
    const cue = () => this.updateMoreBelow();
    this._moreBelowCue = cue;
    this.content.addEventListener('scroll', cue, { passive: true });
    this.content.addEventListener('transitionend', cue);   // an aim folding open or shut
    window.addEventListener?.('resize', cue);
    if (typeof ResizeObserver === 'function') {
      this._moreBelowObserver = new ResizeObserver(cue);
      this._moreBelowObserver.observe(this.content);
    }
    // A late web font changes the list's height with no resize of the list's own box
    document.fonts?.ready?.then?.(cue).catch?.(() => {});
  }

  /** Watch the rendered list too: an aim folding inside it changes its height, not the panel's (review m3). */
  _observeListBody() {
    const first = this.content?.firstElementChild;
    if (!this._moreBelowObserver || !first || first === this._observedBody) return;
    if (this._observedBody) this._moreBelowObserver.unobserve(this._observedBody);
    this._observedBody = first;
    this._moreBelowObserver.observe(first);
  }

  /**
   * Whether the list goes on below what can be seen. The scrollbar was the only sign,
   * and a long list ended mid-line at the panel's edge (lab playtest round 2). A pixel
   * or two of rounding (a zoomed HUD) is not more below.
   */
  static hasMoreBelow({ scrollTop = 0, scrollHeight = 0, clientHeight = 0 } = {}) {
    return scrollHeight - scrollTop - clientHeight > 2;
  }

  /** Show or hide the fade and arrow at the panel's bottom edge (css/objectives.css). */
  updateMoreBelow() {
    this._observeListBody();
    const c = this.content;
    const panel = this.container;
    if (!c || !panel?.classList) return;
    const more = !this.isCollapsed && ObjectivesPanel.hasMoreBelow(c);
    panel.classList.toggle('has-more-below', more);
  }
  
  toggleCollapse() {
    this.setCollapsed(!this.isCollapsed);
    if (window.getTutorialManager) window.getTutorialManager().notifyObjectivesToggled();
  }

  setCollapsed(collapsed) {
    this.isCollapsed = !!collapsed;
    this.container.classList.toggle('collapsed', this.isCollapsed);
    // Opened on a phone it is a sheet over the map, closed by its X (the toggle)
    this.container.classList.toggle('objectives-sheet', ObjectivesPanel.compactNow() && !this.isCollapsed);
    this.updateMoreBelow();
    const toggle = this.container.querySelector('.objectives-toggle');
    toggle?.classList.toggle('is-collapsed', this.isCollapsed);
    toggle?.setAttribute('aria-label', this.isCollapsed ? 'Open objectives' : 'Close objectives');
  }

  /** The phone layout (ui/hud-lanes.js isCompactViewport: under 900 px wide or 500 px tall). */
  static compactNow(win = (typeof window !== 'undefined' ? window : null)) {
    if (!win || !win.innerWidth) return false;
    return win.innerWidth < 900 || win.innerHeight <= 500;
  }

  /**
   * The pill's line: the first active aim and how many of its visible tasks are done, as
   * { title, done, total }, or null with no active aim. Pure; tested.
   */
  static pillSummary(aims) {
    const aim = (aims || []).find(a => a && a.status !== 'completed' && a.status !== 'locked') || null;
    if (!aim) return null;
    const visible = (aim.tasks || []).filter(t => t.status !== 'locked');
    const done = visible.filter(t => t.status === 'completed' || t.status === 'skipped').length;
    return { title: aim.title || '', done, total: visible.length };
  }

  /** Write the pill's line (the flash, while one shows, else the current aim). */
  updatePill(aims = this._lastAims) {
    const el = this.container?.querySelector('.objectives-pill-summary');
    if (!el) return;
    if (this._pillFlash) { el.textContent = this._pillFlash; return; }
    const sum = ObjectivesPanel.pillSummary(aims);
    el.textContent = sum ? (sum.total ? `${sum.title} ${sum.done}/${sum.total}` : sum.title) : '';
  }

  /**
   * On a phone an objective toast (task complete, new task, aim complete, new aim) folds into
   * the pill: it pulses and shows the news for a few seconds instead of a toast over the room
   * (H1 option A). Returns true when it folded, so the caller skips the toast.
   */
  foldToast(title, message, ms = ObjectivesPanel.PILL_FLASH_MS) {
    if (!ObjectivesPanel.compactNow() || !this.container || this.container.classList.contains('hidden')) return false;
    if (document.body?.classList?.contains('minigame-active')) return false;   // pill hidden: keep the toast
    this._pillFlash = `${title}: ${message}`;
    this.updatePill();
    this.container.classList.remove('pill-pulse');
    void this.container.offsetWidth;   // restart the pulse
    this.container.classList.add('pill-pulse');
    clearTimeout(this._pillFlashTimer);
    this._pillFlashTimer = setTimeout(() => {
      this._pillFlash = null;
      this.container.classList.remove('pill-pulse');
      this.updatePill();
    }, ms);
    return true;
  }
  
  /**
   * Required tasks get a '*' only in an aim that has at least one visible
   * optional task, so aims (and missions) without optional tasks look as they
   * always did. Only open tasks carry it: a completed or skipped task is
   * settled. Purely presentational; task.title is never changed.
   */
  static requiredMarkerTaskIds(aim) {
    const visible = (aim.tasks || []).filter(t => t.status !== 'locked');
    if (!visible.some(t => t.optional === true)) return new Set();
    return new Set(visible
      .filter(t => t.optional !== true && t.status !== 'completed' && t.status !== 'skipped')
      .map(t => t.taskId));
  }

  /**
   * The "* required" key sits in the header of each aim that shows a '*', not
   * in the panel header: a panel-wide key read as if unmarked tasks were
   * optional in every aim, including aims with no optional tasks (m08 E1).
   */
  static requiredKeyHtml() {
    return '<span class="aim-required-key" title="In this aim, tasks marked * are required; unmarked tasks are optional.">'
      + '<span class="task-required-mark" aria-hidden="true">*</span> required</span>';
  }

  render(aims) {
    this._lastAims = aims;
    this.updatePill(aims);
    if (!aims || aims.length === 0) {
      this.content.innerHTML = '<div class="no-objectives">No active objectives</div>';
      this.updateMoreBelow();
      return;
    }
    
    let html = '';
    // Aims that appear after the first render (a "New Objective") are scrolled into
    // view below: a long list hid the new Debrief aim under the fold (lab playtest E9)
    const newAimIds = ObjectivesPanel.newAimIds(aims, this.aimStatus);
    
    aims.forEach(aim => {
      const isCompleted = aim.status === 'completed';
      const aimClass = isCompleted ? 'aim-completed' : 'aim-active';
      const aimIcon = isCompleted ? '✓' : '◆';

      // Auto-collapse: on first encounter collapse if already completed;
      // also collapse when an aim transitions to completed mid-game.
      const wasCompleted = this.aimStatus[aim.aimId] === 'completed';
      if (!(aim.aimId in this.aimCollapsed)) {
        this.aimCollapsed[aim.aimId] = isCompleted;
      } else if (isCompleted && !wasCompleted) {
        // Aim just became completed — animate collapse after a short delay
        // so the completion flash plays first, then it folds away.
        this.aimCollapsed[aim.aimId] = true;
        setTimeout(() => {
          const aimEl = this.content.querySelector(`[data-aim-id="${selectorValue(aim.aimId)}"]`);
          if (!aimEl) return;
          aimEl.classList.add('aim-collapsed');
          const toggle = aimEl.querySelector('.aim-toggle');
          if (toggle) toggle.classList.add('is-collapsed');
        }, 800);
      }
      this.aimStatus[aim.aimId] = aim.status;
      const collapsed = this.aimCollapsed[aim.aimId];
      const markedIds = ObjectivesPanel.requiredMarkerTaskIds(aim);
      const requiredKey = markedIds.size > 0 && !isCompleted ? ObjectivesPanel.requiredKeyHtml() : '';

      html += `
        <div class="objective-aim ${aimClass}${collapsed ? ' aim-collapsed' : ''}" data-aim-id="${escapeAttr(aim.aimId)}">
          <div class="aim-header">
            <span class="aim-icon">${aimIcon}</span>
            <span class="aim-title">${this.escapeHtml(aim.title)}</span>${requiredKey}
            <span class="aim-toggle${collapsed ? ' is-collapsed' : ''}">${CHEVRON}</span>
          </div>
          <div class="aim-tasks">
      `;
      
      // An aim whose one visible task carries the aim's own title would print the same line twice
      // (P3 F11: "Check the work phone" under "Check the work phone"). The aim line already says it
      // and ticks when the task does, so that task row is left out.
      const norm = (t) => String(t || '').trim().toLowerCase();
      const visible = aim.tasks.filter(t => t.status !== 'locked');
      const echoTaskId = visible.length === 1 && norm(visible[0].title) === norm(aim.title) ? visible[0].taskId : null;

      aim.tasks.forEach(task => {
        if (task.status === 'locked') return; // Don't show locked tasks
        if (task.taskId === echoTaskId) return;
        
        // Skipped: the story closed it off. Greyed and struck through with a
        // label, never a tick (it doesn't count as done; see skipTask)
        const skipped = task.status === 'skipped';
        const taskClass = task.status === 'completed' ? 'task-completed' : (skipped ? 'task-skipped' : 'task-active');
        const taskIcon = task.status === 'completed' ? '✓' : (skipped ? '–' : '○');

        let progressText = '';
        if (task.showProgress && (task.type === 'collect_items' || task.type === 'submit_flags') && task.status !== 'completed' && !skipped) {
          progressText = ` <span class="task-progress">(${task.currentCount || 0}/${task.targetCount})</span>`;
        }
        const skippedLabel = skipped ? '<span class="task-skipped-label">skipped</span>' : '';
        const optionalClass = task.optional === true ? ' task-optional' : '';
        const requiredMark = markedIds.has(task.taskId)
          ? '<span class="task-required-mark" aria-label="required">*</span>' : '';
        
        html += `
          <div class="objective-task ${taskClass}${optionalClass}" data-task-id="${escapeAttr(task.taskId)}">
            <span class="task-icon">${taskIcon}</span>
            <span class="task-title">${this.escapeHtml(task.title)}${requiredMark}${progressText}</span>${skippedLabel}
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    });
    
    if (window.endingCheck?.hasHeld?.()) {
      html += '<div class="objectives-end-held"><button type="button" class="objectives-end-button" '
        + 'title="Some optional objectives are still open">End the mission</button></div>';
    }
    this.content.innerHTML = html;
    if (newAimIds.length) this.revealAim(this.aimToReveal(newAimIds, aims));
    this.updateMoreBelow();
  }

  /**
   * Which aim to bring into view when new ones arrive. Normally the first new one.
   * Aims that unlock together arrive in separate renders a moment apart (one per
   * unlock), and revealing each in turn left the list on the last of them: in
   * lab_physical_pentest the three core aims and the optional list unlock at once,
   * and the player was shown the optional list with the core aims scrolled off the
   * top. So within REVEAL_BURST_MS of a reveal, the aim revealed first is kept in
   * view while it is still listed.
   */
  aimToReveal(newAimIds, aims, now = Date.now()) {
    const last = this._lastReveal;
    const listed = (id) => (aims || []).some(a => a.aimId === id);
    if (last && now - last.at < ObjectivesPanel.REVEAL_BURST_MS && listed(last.id)) {
      last.at = now;
      return last.id;
    }
    this._lastReveal = { id: newAimIds[0], at: now };
    return newAimIds[0];
  }

  /** Reveals this close together (ms) are one burst: the first-revealed aim stays in view. */
  static REVEAL_BURST_MS = 1500;

  /**
   * Ids of aims not shown before. Empty on the first render (nothing has been shown
   * yet, so nothing is new: a reload must not jump the list).
   */
  static newAimIds(aims, seenStatus) {
    if (!seenStatus || Object.keys(seenStatus).length === 0) return [];
    return (aims || []).filter(a => !(a.aimId in seenStatus)).map(a => a.aimId);
  }

  /**
   * Where the list should scroll so a block is fully in view, moving as little as
   * possible; a block taller than the view shows its top. All numbers in px, the
   * block's top measured from the top of the list's content.
   */
  static scrollTopToReveal({ scrollTop, viewHeight, top, height }) {
    if (height >= viewHeight || top < scrollTop) return Math.max(0, top);
    if (top + height > scrollTop + viewHeight) return top + height - viewHeight;
    return scrollTop;
  }

  /** Scroll the list (never the page) so an aim and its tasks can be seen. */
  revealAim(aimId) {
    const c = this.content;
    const el = c?.querySelector?.(`[data-aim-id="${selectorValue(aimId)}"]`);
    if (!el || !el.getBoundingClientRect) return;
    const box = el.getBoundingClientRect();
    const view = c.getBoundingClientRect();
    // The HUD is zoomed on large monitors (css/hud.css --hud-zoom, 1.5 at 1440p, 2 at
    // 4K). Rectangles come back in zoomed, on-screen pixels; scrollTop and clientHeight
    // are in the list's own. k converts one to the other, and is 1 without a zoom.
    const k = c.offsetHeight && view.height ? view.height / c.offsetHeight : 1;
    c.scrollTop = ObjectivesPanel.scrollTopToReveal({
      scrollTop: c.scrollTop,
      viewHeight: c.clientHeight,
      top: (box.top - view.top) / k + c.scrollTop,
      height: box.height / k
    });
  }
  
  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = displayDashes(text);
    return div.innerHTML;
  }
  
  /**
   * Highlight a newly completed task with animation
   */
  highlightTask(taskId) {
    const taskEl = this.content.querySelector(`[data-task-id="${selectorValue(taskId)}"]`);
    if (taskEl) {
      taskEl.classList.add('new-task');
      setTimeout(() => taskEl.classList.remove('new-task'), 1000);
    }
  }
  
  /**
   * Highlight a newly completed aim with animation
   */
  highlightAim(aimId) {
    const aimEl = this.content.querySelector(`[data-aim-id="${selectorValue(aimId)}"]`);
    if (aimEl) {
      aimEl.classList.add('new-objective');
      setTimeout(() => aimEl.classList.remove('new-objective'), 1000);
    }
  }
  
  show() {
    this.container.style.display = '';   // back to the stylesheet's flex column
  }
  
  hide() {
    this.container.style.display = 'none';
  }
  
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    if (this._moreBelowCue) window.removeEventListener?.('resize', this._moreBelowCue);
    if (this._compactCue) window.removeEventListener?.('resize', this._compactCue);
    clearTimeout(this._pillFlashTimer);
    this._moreBelowObserver?.disconnect();
    this._moreBelowObserver = null;
    this.manager.removeListener(this.render);
  }
}

ObjectivesPanel.PILL_FLASH_MS = 4000;

export default ObjectivesPanel;
