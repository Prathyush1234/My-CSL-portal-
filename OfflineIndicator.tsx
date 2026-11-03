import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, X } from 'lucide-react';
import {
  APP_CURRENT_VERSION,
  checkServerForUpdate,
  forceClearCacheAndReload,
} from '../utils/cacheManager';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [showCacheClearedToast, setShowCacheClearedToast] = useState(false);

  useEffect(() => {
    // 1. If the user just clicked "Clear Cache", show the confirmation notification toast once after reload
    try {
      if (sessionStorage.getItem('csl_show_cache_cleared_toast') === 'true') {
        sessionStorage.removeItem('csl_show_cache_cleared_toast');
        setShowCacheClearedToast(true);
        setTimeout(() => setShowCacheClearedToast(false), 5000);
      }
    } catch {}

    // 2. Check ONCE when opening the app if a new update is available.
    // Once cleared once for that update, it will not repeatedly pop up while using the app.
    const alreadyClearedThisSession =
      sessionStorage.getItem('csl_cache_cleared_this_session') === 'true';

    if (!alreadyClearedThisSession) {
      checkServerForUpdate({ onlyOnStartup: true }).then((res) => {
        if (
          res.hasUpdate &&
          sessionStorage.getItem('csl_cache_cleared_this_session') !== 'true'
        ) {
          setUpdateAvailable(true);
        }
      });
    }

    // Online reconnect handler (network status toast only — no repeated cache popup)
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedToast(true);
      setTimeout(() => setShowReconnectedToast(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Custom update event from CacheManager (only honored if not already cleared)
    const handleAppUpdated = () => {
      if (sessionStorage.getItem('csl_cache_cleared_this_session') !== 'true') {
        setUpdateAvailable(true);
      }
    };
    window.addEventListener('csl_app_update_detected', handleAppUpdated);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('csl_app_update_detected', handleAppUpdated);
    };
  }, []);

  const handleRefresh = async () => {
    setIsClearingCache(true);
    await forceClearCacheAndReload();
  };

  const handleDismissUpdate = () => {
    try {
      const pendingVer =
        sessionStorage.getItem('csl_pending_update_version') || APP_CURRENT_VERSION;
      const pendingBuild = sessionStorage.getItem('csl_pending_update_build_time');
      sessionStorage.setItem('csl_cache_cleared_this_session', 'true');
      localStorage.setItem('csl_cache_cleared_for_version', pendingVer);
      localStorage.setItem('csl_cache_cleared_base_version', APP_CURRENT_VERSION);
      localStorage.setItem('csl_last_installed_version', pendingVer);
      if (pendingBuild) {
        localStorage.setItem('csl_cache_cleared_build_time', pendingBuild);
        localStorage.setItem('csl_last_build_time', pendingBuild);
      }
      sessionStorage.removeItem('csl_pending_update_version');
      sessionStorage.removeItem('csl_pending_update_build_time');
    } catch {}
    setUpdateAvailable(false);
  };

  return (
    <>
      {/* Offline Status Badge Banner */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900/95 border border-amber-500/60 px-3.5 py-2 text-xs font-semibold text-amber-300 shadow-2xl backdrop-blur-md animate-in fade-in">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold">ഓഫ്‌ലൈൻ മോഡ് (Offline Mode)</span>
            <span className="text-[10px] text-slate-300">ക്ലോക്കും പഞ്ചിംഗും ഓഫ്‌ലൈനിലും കൃത്യമായി പ്രവർത്തിക്കും</span>
          </div>
        </div>
      )}

      {/* Online Reconnected Auto-Sync Toast */}
      {showReconnectedToast && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900/95 border border-emerald-500/60 px-3.5 py-2 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in">
          <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold">ഇന്റർനെറ്റ് കണക്റ്റായി (Online)</span>
            <span className="text-[10px] text-slate-300">ഓൺലൈൻ കണക്ഷൻ പുനഃസ്ഥാപിച്ചു</span>
          </div>
        </div>
      )}

      {/* Cache Cleared Success Confirmation Notification Toast */}
      {showCacheClearedToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-xl bg-emerald-950/95 border-2 border-emerald-400 px-4 py-3 text-xs font-bold text-white shadow-2xl animate-in slide-in-from-top-3 backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-emerald-300 font-black">
              ✅ കാഷെ ക്ലിയർ ചെയ്തു! (Cache Cleared Successfully)
            </span>
            <span className="text-[11px] text-slate-200">
              ആപ്പിന്റെ ഏറ്റവും പുതിയ അപ്‌ഡേറ്റ് ഇപ്പോൾ സജ്ജമാണ്.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowCacheClearedToast(false)}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Update Available -> Clear Cache Prompt Notification Banner (Appears once on startup when an update exists) */}
      {updateAvailable && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-xl bg-[#032b38] border-2 border-emerald-400/90 px-4 py-3 text-xs font-bold text-white shadow-2xl animate-in slide-in-from-top-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 text-emerald-300 ${isClearingCache ? 'animate-spin' : ''}`} />
            <div className="flex flex-col">
              <span className="text-emerald-300 font-extrabold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                പുതിയ അപ്‌ഡേറ്റ് വന്നു! കാഷെ ക്ലിയർ ചെയ്യാം (Clear Cache)
              </span>
              <span className="text-[11px] text-slate-200">
                പുതിയ മാറ്റങ്ങൾ പൂർണ്ണമായി ലഭിക്കാൻ കാഷെ ക്ലിയർ ചെയ്ത് റീഫ്രഷ് ചെയ്യുക.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isClearingCache}
            className="ml-2 px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black cursor-pointer text-xs shadow-md active:scale-95 transition-transform shrink-0"
          >
            {isClearingCache ? 'ക്ലിയർ ചെയ്യുന്നു...' : '🧹 കാഷെ ക്ലിയർ & റീഫ്രഷ്'}
          </button>
          <button
            type="button"
            onClick={handleDismissUpdate}
            title="ഒഴിവാക്കുക (Dismiss)"
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};

