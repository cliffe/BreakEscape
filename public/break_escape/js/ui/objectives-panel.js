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
      <span class="objectives-title">📋 Objectives</span>
      <div class="objectives-controls">
        <span class="objectives-key" title="Tasks marked * are required. Unmarked tasks are optional." hidden><span class="task-required-mark">*</span> required</span>
        <button class="objectives-toggle" aria-label="Toggle objectives" title="Collapse/Expand">▼</button>
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
      const aimHeader = e.target.closest('.aim-header');
      if (!aimHeader) return;
      const aimEl = aimHeader.closest('.objective-aim');
      if (!aimEl) return;
      const aimId = aimEl.dataset.aimId;
      this.aimCollapsed[aimId] = !this.aimCollapsed[aimId];
      aimEl.classList.toggle('aim-collapsed', this.aimCollapsed[aimId]);
      const toggle = aimHeader.querySelector('.aim-toggle');
      if (toggle) toggle.textContent = this.aimCollapsed[aimId] ? '▶' : '▼';
    });

    this.keyEl = header.querySelector('.objectives-key');

    this.container.appendChild(header);
    this.container.appendChild(this.content);
    document.body.appendChild(this.container);
  }
  
  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.container.classList.toggle('collapsed', this.isCollapsed);
    const toggle = this.container.querySelector('.objectives-toggle');
    toggle.textContent = this.isCollapsed ? '▶' : '▼';
    if (window.getTutorialManager) window.getTutorialManager().notifyObjectivesToggled();
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

  /** Show the "* required" key only while a '*' is on screen */
  setKeyVisible(visible) {
    if (this.keyEl) this.keyEl.hidden = !visible;
  }

  render(aims) {
    if (!aims || aims.length === 0) {
      this.content.innerHTML = '<div class="no-objectives">No active objectives</div>';
      this.setKeyVisible(false);
      return;
    }
    
    let html = '';
    let anyMarker = false;
    
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
          const aimEl = this.content.querySelector(`[data-aim-id="${aim.aimId}"]`);
          if (!aimEl) return;
          aimEl.classList.add('aim-collapsed');
          const toggle = aimEl.querySelector('.aim-toggle');
          if (toggle) toggle.textContent = '▶';
        }, 800);
      }
      this.aimStatus[aim.aimId] = aim.status;
      const collapsed = this.aimCollapsed[aim.aimId];
      const toggleIcon = collapsed ? '▶' : '▼';

      html += `
        <div class="objective-aim ${aimClass}${collapsed ? ' aim-collapsed' : ''}" data-aim-id="${aim.aimId}">
          <div class="aim-header">
            <span class="aim-icon">${aimIcon}</span>
            <span class="aim-title">${this.escapeHtml(aim.title)}</span>
            <span class="aim-toggle">${toggleIcon}</span>
          </div>
          <div class="aim-tasks">
      `;
      
      const markedIds = ObjectivesPanel.requiredMarkerTaskIds(aim);
      if (markedIds.size > 0 && !isCompleted) anyMarker = true;

      aim.tasks.forEach(task => {
        if (task.status === 'locked') return; // Don't show locked tasks
        
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
          <div class="objective-task ${taskClass}${optionalClass}" data-task-id="${task.taskId}">
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
    
    this.content.innerHTML = html;
    this.setKeyVisible(anyMarker);
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
    const taskEl = this.content.querySelector(`[data-task-id="${taskId}"]`);
    if (taskEl) {
      taskEl.classList.add('new-task');
      setTimeout(() => taskEl.classList.remove('new-task'), 1000);
    }
  }
  
  /**
   * Highlight a newly completed aim with animation
   */
  highlightAim(aimId) {
    const aimEl = this.content.querySelector(`[data-aim-id="${aimId}"]`);
    if (aimEl) {
      aimEl.classList.add('new-objective');
      setTimeout(() => aimEl.classList.remove('new-objective'), 1000);
    }
  }
  
  show() {
    this.container.style.display = 'block';
  }
  
  hide() {
    this.container.style.display = 'none';
  }
  
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.manager.removeListener(this.render);
  }
}

export default ObjectivesPanel;
