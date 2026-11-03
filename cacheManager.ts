/**
 * CSL Portal Cache & Version Manager
 * Ensures that when an application update is deployed, the old page cache
 * (Service Worker, CacheStorage, and stale assets) is automatically cleared
 * without losing the employee's saved credentials, punches, or notes.
 */

export const APP_CURRENT_VERSION = '2026.11.01.2';

// Keys in localStorage that must NEVER be deleted when clearing cache (user data)
const PRESERVED_STORAGE_KEYS = [
  'csl_employee_profile',
  'csl_employee_signed_in',
  'csl_attendance_daily_logs_v2',
  'csl_attendance_daily_logs_2026_9',
  'csl_calendar_leave_records_2026_9',
  'csl_calendar_day_notes_2026',
  'csl_shift_rotations_2026',
  'csl_language_pref',
  'csl_selected_category',
  'csl_tax_deductions_2026',
  'csl_salary_calc_history',
  'csl_admin_unlocked',
  'csl_money_management_data_v2',
  'csl_cache_cleared_for_version',
  'csl_cache_cleared_base_version',
  'csl_cache_cleared_build_time',
];

/**
 * Completely purges all browser CacheStorage, updates/reloads service workers,
 * and clears obsolete caches while preserving employee data.
 */
export async function clearAllAppCaches(options?: {
  unregisterServiceWorkers?: boolean;
  targetVersion?: string;
  targetBuildTime?: number;
}): Promise<void> {
  try {
    // 1. Purge all CacheStorage entries
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          try {
            await caches.delete(cacheName);
          } catch (e) {
            console.warn('Failed to delete cache:', cacheName, e);
          }
        })
      );
    }

    // 2. Clear or update Service Worker registrations
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        try {
          if (options?.unregisterServiceWorkers) {
            await registration.unregister();
          } else {
            await registration.update();
          }
        } catch (e) {
          console.warn('Failed to update service worker:', e);
        }
      }
    }

    // 3. Clean only obsolete cache-related localStorage entries (never touch user data or version state)
    try {
      const allKeys = Object.keys(localStorage);
      for (const key of allKeys) {
        if (
          !PRESERVED_STORAGE_KEYS.includes(key) &&
          (key.startsWith('workbox-') ||
            key.startsWith('vite-') ||
            key.startsWith('cached_page_'))
        ) {
          localStorage.removeItem(key);
        }
      }
    } catch {}

    // 4. Record the cleared version so it never triggers an infinite refresh loop
    try {
      const finalVersion =
        options?.targetVersion ||
        sessionStorage.getItem('csl_pending_update_version') ||
        localStorage.getItem('csl_last_installed_version') ||
        APP_CURRENT_VERSION;
      localStorage.setItem('csl_last_installed_version', finalVersion);
      localStorage.setItem('csl_cache_cleared_for_version', finalVersion);
      localStorage.setItem('csl_cache_cleared_base_version', APP_CURRENT_VERSION);
      if (options?.targetBuildTime) {
        localStorage.setItem('csl_last_build_time', String(options.targetBuildTime));
        localStorage.setItem('csl_cache_cleared_build_time', String(options.targetBuildTime));
      } else {
        const pendingBuild = sessionStorage.getItem('csl_pending_update_build_time');
        if (pendingBuild) {
          localStorage.setItem('csl_last_build_time', pendingBuild);
          localStorage.setItem('csl_cache_cleared_build_time', pendingBuild);
        }
      }
      localStorage.setItem('csl_last_cache_clear', new Date().toISOString());
      sessionStorage.setItem('csl_cache_cleared_this_session', 'true');
      sessionStorage.setItem('csl_startup_update_checked', 'true');
      sessionStorage.removeItem('csl_pending_update_version');
      sessionStorage.removeItem('csl_pending_update_build_time');
    } catch {}

    console.info(`[CSL CacheManager] App cache cleared once for version ${APP_CURRENT_VERSION}`);
  } catch (err) {
    console.error('[CSL CacheManager] Error clearing cache:', err);
  }
}

/**
 * Manually force clear cache once and reload cleanly while showing a confirmation toast after reload
 */
export async function forceClearCacheAndReload(): Promise<void> {
  let latestServerVersion =
    sessionStorage.getItem('csl_pending_update_version') ||
    localStorage.getItem('csl_last_installed_version') ||
    APP_CURRENT_VERSION;
  let latestBuildTime = Number(
    sessionStorage.getItem('csl_pending_update_build_time') ||
      localStorage.getItem('csl_last_build_time') ||
      0
  );

  try {
    const res = await fetch(`/api/version?_t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.version) latestServerVersion = data.version;
      if (data.buildTime) latestBuildTime = Number(data.buildTime);
    }
  } catch {}

  await clearAllAppCaches({
    unregisterServiceWorkers: true,
    targetVersion: latestServerVersion,
    targetBuildTime: latestBuildTime,
  });

  try {
    localStorage.setItem('csl_last_installed_version', latestServerVersion);
    localStorage.setItem('csl_cache_cleared_for_version', latestServerVersion);
    localStorage.setItem('csl_cache_cleared_base_version', APP_CURRENT_VERSION);
    if (latestBuildTime) {
      localStorage.setItem('csl_last_build_time', String(latestBuildTime));
      localStorage.setItem('csl_cache_cleared_build_time', String(latestBuildTime));
    }
    sessionStorage.setItem('csl_cache_cleared_this_session', 'true');
    sessionStorage.setItem('csl_startup_update_checked', 'true');
    sessionStorage.setItem('csl_show_cache_cleared_toast', 'true');
  } catch {}

  // Reload to clean URL (without leaving stale query params)
  const url = new URL(window.location.href);
  url.searchParams.delete('_csl_refresh');
  window.location.replace(url.toString());
}

/**
 * Checks with the backend server ONLY ONCE on app startup if a newer version/update is available.
 * If an update is detected, it does NOT auto-dismiss the notification — it returns { hasUpdate: true }
 * so the user sees the Clear Cache notification and can clear cache once.
 */
export async function checkServerForUpdate(options?: { onlyOnStartup?: boolean }): Promise<{
  hasUpdate: boolean;
  newVersion?: string;
}> {
  try {
    // If already cleared in this session, do not prompt again
    if (sessionStorage.getItem('csl_cache_cleared_this_session') === 'true') {
      return { hasUpdate: false };
    }

    // If a pending update was already detected on this startup and not yet cleared/dismissed, keep showing it
    const existingPending = sessionStorage.getItem('csl_pending_update_version');
    if (existingPending) {
      return { hasUpdate: true, newVersion: existingPending };
    }

    if (options?.onlyOnStartup && sessionStorage.getItem('csl_startup_update_checked') === 'true') {
      return { hasUpdate: false };
    }

    sessionStorage.setItem('csl_startup_update_checked', 'true');

    const res = await fetch(`/api/version?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (!res.ok) {
      // Fallback: check if client APP_CURRENT_VERSION changed compared to localStorage
      const clearedBase = localStorage.getItem('csl_cache_cleared_base_version');
      if (clearedBase !== APP_CURRENT_VERSION) {
        sessionStorage.setItem('csl_pending_update_version', APP_CURRENT_VERSION);
        return { hasUpdate: true, newVersion: APP_CURRENT_VERSION };
      }
      return { hasUpdate: false };
    }

    const data = await res.json();
    const serverVersion: string = data.version || APP_CURRENT_VERSION;
    const serverBuildTime: number = Number(data.buildTime || 0);

    const clearedForVersion = localStorage.getItem('csl_cache_cleared_for_version');
    const clearedBaseVersion = localStorage.getItem('csl_cache_cleared_base_version');

    // Trigger notification whenever the server code version or base version differs from what the user last cleared
    const isUpdateAvailable =
      clearedForVersion !== serverVersion || clearedBaseVersion !== APP_CURRENT_VERSION;

    if (isUpdateAvailable) {
      // Pre-clean stale CacheStorage in background, but DO NOT mark csl_cache_cleared_this_session = 'true'
      // until the user clicks "Clear Cache" or dismisses the banner!
      try {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name).catch(() => {})));
        }
      } catch {}

      sessionStorage.setItem('csl_pending_update_version', serverVersion);
      if (serverBuildTime) {
        sessionStorage.setItem('csl_pending_update_build_time', String(serverBuildTime));
      }

      return { hasUpdate: true, newVersion: serverVersion };
    }

    return { hasUpdate: false };
  } catch {
    const clearedBase = localStorage.getItem('csl_cache_cleared_base_version');
    if (clearedBase !== APP_CURRENT_VERSION) {
      sessionStorage.setItem('csl_pending_update_version', APP_CURRENT_VERSION);
      return { hasUpdate: true, newVersion: APP_CURRENT_VERSION };
    }
    return { hasUpdate: false };
  }
}

/**
 * Initialize startup cache check:
 * Cleans up any leftover URL query parameter without prematurely marking new updates as cleared.
 */
export function initStartupCacheCheck(): void {
  try {
    // Clean up any leftover _csl_refresh query param from URL bar
    if (typeof window !== 'undefined' && window.location.search.includes('_csl_refresh')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('_csl_refresh');
      window.history.replaceState({}, '', url.toString());
    }
  } catch (e) {
    console.warn('[CSL CacheManager] Startup check error:', e);
  }
}

/**
 * Signs out the current employee and resets all personal data (attendance, punch history, leave records, personal notes)
 * so that when the app is given to another person or reopened, it is completely fresh and ready for their own profile.
 */
export function signOutAndResetEmployeeData(): void {
  const keysToRemove = [
    'csl_employee_profile',
    'csl_employee_signed_in',
    'csl_calendar_present_days_2026_9',
    'csl_calendar_day_shifts_2026_9',
    'csl_attendance_daily_logs_v2',
    'csl_attendance_daily_logs_2026_9',
    'csl_calendar_leave_records_2026_9',
    'csl_calendar_leave_days_2026_9',
    'csl_calendar_day_notes_2026',
    'csl_leave_balances_v2',
    'csl_today_punched_date',
    'csl_actual_punched_today',
    'csl_punch_state',
    'csl_last_punch_time',
    'csl_today_punch_in_time',
    'csl_today_punch_out_time',
    'csl_punch_in_ts',
    'csl_completed_duty_summary',
    'csl_shift_swaps_overrides',
    'csl_tax_deductions_2026',
    'csl_salary_calc_history',
  ];
  keysToRemove.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });
  window.dispatchEvent(new CustomEvent('csl-employee-signed-out'));
}

