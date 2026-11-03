import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="px-3 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
        title="Install My CSL App (Offline Ready)"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="px-3 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#061825] border border-[#0f354c] p-5 shadow-2xl text-white">
              <div className="flex items-center justify-between pb-3 border-b border-[#0e2c3e]">
                <h3 className="text-sm font-bold text-cyan-300">iPhone / iPad-ൽ ഇൻസ്റ്റാൾ ചെയ്യാം</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed space-y-1.5">
                1. Safari ബ്രൗസറിലെ <strong className="text-white">Share</strong> ബട്ടൺ ടാപ്പ് ചെയ്യുക.<br />
                2. താഴേക്ക് സ്ക്രോൾ ചെയ്ത് <strong className="text-cyan-300">Add to Home Screen (ഹോം സ്ക്രീനിലേക്ക് ചേർക്കുക)</strong> തിരഞ്ഞെടുക്കുക.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-cyan-600 hover:bg-cyan-700 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                മനസ്സിലായി (Close)
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
