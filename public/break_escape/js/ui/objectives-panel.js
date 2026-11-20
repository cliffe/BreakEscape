/**
 * ObjectivesPanel
 * 
 * HUD element displaying current mission objectives (top-left).
 * Collapsible panel with aim/task hierarchy.
 * Pixel-art aesthetic with sharp corners and 2px borders.
 * 
 * @module objectives-panel
 */
import { displayDashes } from '../utils/display-dashes.js';
import { openModalCount } from './modal-stack.js';
import { isCompactViewport } from './hud-lanes.js';

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
    this._wasCompact = ObjectivesPanel.compactNow();
    if (this._wasCompact) this.setCollapsed(true);
    this._compactCue = () => {
      const compact = ObjectivesPanel.compactNow();
      if (compact && !this._wasCompact) this.setCollapsed(true);
      this._wasCompact = compact;
      this.updatePill();
      this.container.classList.toggle('objectives-sheet', compact && !this.isCollapsed);
    };
    window.addEventListener?.('resize', this._compactCue);
    // Esc closes the open sheet before the game's Esc opens the pause menu, as Esc closes any
    // pop-up first (review R1 M3). Capture phase on window, so it runs before game-menu.js.
    this._escCue = (e) => {
      if (e.key !== 'Escape' || !this.container?.classList.contains('objectives-sheet')) return;
      // A pop-up over the sheet (a read note, a confirm) takes the Esc first; modal-stack closes it
      if (openModalCount() > 0) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      this.setCollapsed(true);
    };
    window.addEventListener?.('keydown', this._escCue, true);
    this._onAims = (aims) => this.render(aims);
    this.manager.addListener(this._onAims);

    // Desktop: the open list covered a third of the view at mission start (m08 and m09 blind
    // runs). It stays open for AUTO_COLLAPSE_MS of time it is actually on screen (a minigame, the
    // briefing or a hidden tab do not count), so a new player reads it, then folds to a one-line
    // summary unless the player has used it.
    this._autoCollapseTimer = null;
    this._autoCollapseDone = false;
    this._autoFolded = false;      // folded by the timer, not by the player
    this._visibleMs = 0;           // on-screen time counted toward the fold
    this._hadHeld = false;
    this._userTouched = false;
    this._hovering = false;
    this.container.addEventListener?.('mouseenter', () => { this._hovering = true; this._graceSteps = 0; });
    this._graceSteps = 0;          // fold steps to wait after the pointer leaves (review R2 n3)
    this.container.addEventListener?.('mouseleave', () => {
      this._hovering = false;
      this._graceSteps = ObjectivesPanel.HOVER_GRACE_STEPS;
    });

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
      <span class="objectives-pill-summary" aria-live="polite"><span class="objectives-pill-count"></span><span class="objectives-pill-text"></span></span>
      <div class="objectives-controls">
        <button type="button" class="objectives-toggle" aria-label="Close objectives" aria-expanded="true" aria-controls="objectives-content" title="Collapse/Expand">${CHEVRON}</button>
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

    // The themed frame is a border (8px on a phone pill) outside the padding box, where the
    // toggle's hit pseudo-element cannot reach (overflow clips it); a tap there lands on the
    // panel itself, so a folded panel opens from it too. Header taps bubble with a different target.
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container && this.isCollapsed) this.toggleCollapse();
    });
    
    // Create content area
    this.content = document.createElement('div');
    this.content.className = 'objectives-content';
    this.content.id = 'objectives-content';
    
    // A postponed ending's button sits in a footer under the list, so a long list never scrolls it
    // out of sight (review R2 m1)
    this.footer = document.createElement('div');
    this.footer.className = 'objectives-footer';
    this.footer.hidden = true;
    this.footer.addEventListener('click', (e) => {
      // A postponed ending (systems/ending-check.js): "End the mission" finishes it
      if (e.target.closest('.objectives-end-button')) window.endingCheck?.endHeld?.();
    });

    // Delegate aim header clicks to toggle individual aim collapse
    this.content.addEventListener('click', (e) => {
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
    this.container.appendChild(this.footer);
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
  
  /**
   * Whether the one-off desktop auto-fold should happen now. Pure; tested. Never on a phone
   * (the pill is already collapsed), after the player has used the panel, or while it is
   * collapsed, hovered or has keyboard focus inside.
   */
  static shouldAutoCollapse({ compact, collapsed, userTouched, hovering, focusInside, done }) {
    return !(compact || collapsed || userTouched || hovering || focusInside || done);
  }

  /** Whether the panel can be seen now: no minigame over it, not hidden by code, tab in front. */
  _onScreen() {
    if (!this.container?.classList) return false;
    if (typeof document !== 'undefined' && document.hidden) return false;
    if (document.body?.classList?.contains('minigame-active')) return false;
    // A minigame (the opening briefing's person chat, the title screen) is drawn over the HUD
    if (window.MinigameFramework?.currentMinigame) return false;
    return !(this.container.classList.contains('hidden') || this.container.style.display === 'none');
  }

  /**
   * Start the auto-fold clock once, when the first aims have been shown. It steps every
   * AUTO_COLLAPSE_STEP_MS and counts a step only while the panel is on screen, so the opening
   * briefing (a minigame that hides the panel) does not use up the reading time. In use (hover,
   * focus) or holding an ending's button, the count keeps going but the fold waits.
   */
  _startAutoCollapse() {
    if (this._autoCollapseDone || this._autoCollapseTimer || this._userTouched) return;
    const step = () => {
      this._autoCollapseTimer = null;
      if (!this.container?.classList) return;
      if (this._autoCollapseDone) return;   // a held ending opened it for good   // torn down, or a test's stand-in panel
      if (this._onScreen()) {
        this._visibleMs += ObjectivesPanel.AUTO_COLLAPSE_STEP_MS;
      } else {
        this._hovering = false;   // a hover cannot be ended while the panel is hidden
      }
      const focusInside = !!this.container?.contains?.(document.activeElement);
      const held = !!window.endingCheck?.hasHeld?.();
      const grace = !this._hovering && this._graceSteps > 0;
      if (grace) this._graceSteps -= 1;   // the pointer just left: a moment before it folds
      if (this._visibleMs >= ObjectivesPanel.AUTO_COLLAPSE_MS && this._onScreen() && !this._hovering && !grace && !focusInside && !held) {
        if (ObjectivesPanel.shouldAutoCollapse({
          compact: ObjectivesPanel.compactNow(), collapsed: this.isCollapsed,
          userTouched: this._userTouched, hovering: false, focusInside: false, done: this._autoCollapseDone
        })) { this.setCollapsed(true); this._autoFolded = true; }
        this._autoCollapseDone = true;
        return;
      }
      this._autoCollapseTimer = setTimeout(step, ObjectivesPanel.AUTO_COLLAPSE_STEP_MS);
      this._autoCollapseTimer?.unref?.();
    };
    this._autoCollapseTimer = setTimeout(step, ObjectivesPanel.AUTO_COLLAPSE_STEP_MS);
    this._autoCollapseTimer?.unref?.();   // node: never keeps a test process alive
  }

  /** Give the fold a fresh AUTO_COLLAPSE_MS of visible time. */
  _rearmAutoCollapse() {
    clearTimeout(this._autoCollapseTimer);
    this._autoCollapseTimer = null;
    this._autoCollapseDone = false;
    this._visibleMs = 0;
  }

  toggleCollapse() {
    this._userTouched = true;
    clearTimeout(this._autoCollapseTimer);
    this._autoCollapseTimer = null;
    this._autoFolded = false;
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
    toggle?.setAttribute('aria-expanded', String(!this.isCollapsed));
  }

  /** The phone layout (ui/hud-lanes.js isCompactViewport: under 900 px wide or 500 px tall). */
  static compactNow(win = (typeof window !== 'undefined' ? window : null)) {
    if (!win || !win.innerWidth) return false;
    return isCompactViewport(win.innerWidth, win.innerHeight);
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

  /** Title of the first open task of the pill's aim, or ''. Pure; tested. */
  static nextTaskTitle(aims) {
    const aim = (aims || []).find(a => a && a.status !== 'completed' && a.status !== 'locked');
    const open = (aim?.tasks || []).filter(x => x.status !== 'locked' && x.status !== 'completed' && x.status !== 'skipped');
    // A required task first; an optional one only when nothing required is open (review R2 m3)
    const t = open.find(x => x.optional !== true) || open[0];
    return t?.title || '';
  }

  /**
   * Write the pill's line: the count first, in a box of its own that never shrinks, then the
   * current aim, cut with an ellipsis; the whole line is the pill's title (review R1 M2).
   */
  updatePill(aims = this._lastAims) {
    const el = this.container?.querySelector('.objectives-pill-summary');
    if (!el) return;
    const sum = ObjectivesPanel.pillSummary(aims);
    const count = sum && sum.total ? `${sum.done}/${sum.total}` : '';
    const countEl = el.querySelector('.objectives-pill-count');
    const textEl = el.querySelector('.objectives-pill-text');
    if (countEl) { countEl.textContent = count; countEl.hidden = !count; }
    // A held ending says so; a desktop folded line names the next task (the aim title is too long to
    // finish a sentence in it); a phone pill shows the aim
    const held = !!window.endingCheck?.hasHeld?.();
    const compact = ObjectivesPanel.compactNow();
    const next = compact ? '' : ObjectivesPanel.nextTaskTitle(aims);
    if (textEl) textEl.textContent = held ? 'Open to end the mission' : (sum ? (next || sum.title) : '');
    // The desktop toast carries the news aloud; only the phone pill announces itself
    el.setAttribute('aria-live', compact ? 'polite' : 'off');
    const header = this.container.querySelector('.objectives-header');
    let full = sum ? (count ? `${sum.title} (${count})` : sum.title) : 'Objectives';
    if (sum && next && next !== sum.title) full += `: ${next}`;
    if (held) full += ' (the mission can be ended)';
    if (header) header.title = full;
  }

  /** Blink the folded panel's outline (restarts a running pulse). */
  _pulse(ms = ObjectivesPanel.PILL_FLASH_MS) {
    if (!this.container) return;
    this.container.classList.remove('pill-pulse');
    void this.container.offsetWidth;   // restart the pulse
    this.container.classList.add('pill-pulse');
    clearTimeout(this._pillFlashTimer);
    this._pillFlashTimer = setTimeout(() => this.container?.classList.remove('pill-pulse'), ms);
  }

  /**
   * On a phone the pill blinks for an objective's news (task complete, new task, aim complete,
   * new aim). It shows no text of its own, so the count stays readable: a new task or aim shows
   * in the pill's line and sheet; a finished task or aim also gets a short line in the notify
   * lane (objectives-manager.js), since the pill moves on from it (review R1 M2). Returns true
   * on the phone layout with the pill showing.
   */
  foldToast(title, message, ms = ObjectivesPanel.PILL_FLASH_MS) {
    // Desktop, folded to its summary line: blink it for news, and let the toast show as usual
    if (!ObjectivesPanel.compactNow() && this.isCollapsed && this.container && !this.container.classList.contains('hidden')
      && !document.body?.classList?.contains('minigame-active')) {
      this._pulse(ms);
      return false;
    }
    if (!ObjectivesPanel.compactNow() || !this.container || this.container.classList.contains('hidden')) return false;
    if (document.body?.classList?.contains('minigame-active')) return false;   // pill hidden: keep the toast
    this._pulse(ms);
    return true;
  }

  /**
   * Required tasks get a '*' only in an aim that has at least one visible
   * optional task, so aims (and missions) without optional tasks look as they
   * always did. Only open tasks carry it: a completed or skipped task is
   * settled. Purely presentational; task.title is never changed.
   * An aim flagged `"optional": true` is optional as a whole: none of its tasks
   * gets a '*', even the one that completes it (lab blind playtest finding 1:
   * a starred task inside "Wireless (optional)" read as required). How the aim
   * completes is unchanged.
   */
  static requiredMarkerTaskIds(aim) {
    if (aim?.optional === true) return new Set();
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
        // Every task of an optional aim is shown as optional (dimmer), like optional tasks elsewhere.
        const optionalClass = (task.optional === true || aim.optional === true) ? ' task-optional' : '';
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
    
    const heldNow = !!window.endingCheck?.hasHeld?.();
    if (this.footer) {   // (a test's stand-in panel has none)
      this.footer.innerHTML = heldNow
        ? '<div class="objectives-end-held"><button type="button" class="objectives-end-button" '
          + 'title="Some optional objectives are still open">End the mission</button></div>'
        : '';
      this.footer.hidden = !heldNow;
    }
    this.container?.classList?.toggle?.('has-end-footer', heldNow);
    this.content.innerHTML = html;
    // A new aim lengthens the list: if the player has not taken the panel over, it gets another
    // AUTO_COLLAPSE_MS of visible time to be read before it folds again (m08 part 2: three aims, a
    // third of the view). One that the timer folded opens again for it.
    if (newAimIds.length && !this._userTouched) {
      if (this.isCollapsed && this._autoFolded && !ObjectivesPanel.compactNow()) {
        this.setCollapsed(false);
        this._autoFolded = false;
      }
      if (!this.isCollapsed) this._rearmAutoCollapse();
    }
    // A held ending's button lives in the list: when it first appears the panel opens (desktop) so
    // the way out is in view, and stays open while it is there. If the player folded the panel
    // themselves, or on a phone, the folded line says so and blinks.
    const hasHeld = !!window.endingCheck?.hasHeld?.();
    if (hasHeld && !this._hadHeld) {
      if (!this._userTouched && !ObjectivesPanel.compactNow()) {
        this.setCollapsed(false);
        this._autoFolded = false;
        this._autoCollapseDone = true;   // it stays open while held: stop the clock (review R2 n2)
      } else if (this.isCollapsed) {
        this._pulse();
      }
    }
    this._hadHeld = hasHeld;
    if (hasHeld) this.updatePill(aims);
    this._startAutoCollapse();
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
    if (this._escCue) window.removeEventListener?.('keydown', this._escCue, true);
    clearTimeout(this._pillFlashTimer);
    clearTimeout(this._autoCollapseTimer);
    this._moreBelowObserver?.disconnect();
    this._moreBelowObserver = null;
    this.manager.removeListener(this._onAims);
  }
}

ObjectivesPanel.PILL_FLASH_MS = 4000;
/** Desktop: how long (ms of visible time) the list stays open at mission start before it folds, and the clock's step. */
ObjectivesPanel.AUTO_COLLAPSE_MS = 25000;
/** The fold clock steps this often, counting only the steps taken with the panel on screen. */
ObjectivesPanel.AUTO_COLLAPSE_STEP_MS = 1000;
ObjectivesPanel.HOVER_GRACE_STEPS = 2;   // 2 s after the pointer leaves

export default ObjectivesPanel;
