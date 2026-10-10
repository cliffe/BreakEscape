// API configuration from server
// GAME_ID and ASSETS_PATH are stable after page load — read once.
export const GAME_ID       = window.breakEscapeConfig?.gameId;
export const ASSETS_PATH   = window.breakEscapeConfig?.assetsPath || '/break_escape/assets';
export const ASSETS_VERSION = window.breakEscapeConfig?.assetsVersion || '1';

// API_BASE and CSRF_TOKEN are read lazily so they always reflect the live
// window.breakEscapeConfig value, even if the module was evaluated before the
// inline config script ran (e.g. cached module in some browsers).
export function getApiBase() {
  return window.breakEscapeConfig?.apiBasePath || '';
}
export function getCsrfToken() {
  return window.breakEscapeConfig?.csrfToken ||
         document.querySelector('meta[name="csrf-token"]')?.content;
}

// Keep named exports for backwards-compatibility with any direct imports.
// These resolve once at module-evaluation time; prefer getApiBase()/getCsrfToken()
// for call-site use.
export const API_BASE   = window.breakEscapeConfig?.apiBasePath || '';
export const CSRF_TOKEN = window.breakEscapeConfig?.csrfToken ||
                          document.querySelector('meta[name="csrf-token"]')?.content;

// Verify critical config loaded
if (!GAME_ID) {
  console.error('❌ CRITICAL: Game ID not configured! Check window.breakEscapeConfig');
  console.error('Expected window.breakEscapeConfig.gameId to be set by server');
}

if (!CSRF_TOKEN) {
  console.error('❌ CRITICAL: CSRF token not found!');
  console.error('This will cause all POST/PUT requests to fail with 422 status');
  console.error('Checked:');
  console.error('  1. window.breakEscapeConfig.csrfToken');
  console.error('  2. meta[name="csrf-token"] tag');
  console.error('');
  console.error('Solutions:');
  console.error('  - If using Hacktivity layout: Ensure layout has <%= csrf_meta_tags %>');
  console.error('  - If standalone: Add <%= csrf_meta_tags %> to layout OR');
  console.error('  - Set window.breakEscapeConfig.csrfToken in view');
}

// Log config for debugging
if (window.breakEscapeConfig?.debug || !CSRF_TOKEN) {
  console.log('✓ BreakEscape config validated:', {
    gameId: GAME_ID,
    apiBasePath: API_BASE,
    assetsPath: ASSETS_PATH,
    csrfToken: CSRF_TOKEN ? `${CSRF_TOKEN.substring(0, 10)}...` : '❌ MISSING',
    csrfTokenSource: window.breakEscapeConfig?.csrfToken ? 'config object' :
                     (document.querySelector('meta[name="csrf-token"]') ? 'meta tag' : 'NOT FOUND'),
    debug: window.breakEscapeConfig?.debug || false
  });
}
