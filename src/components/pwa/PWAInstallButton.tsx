import React, { useState } from 'react';
import { Download, HelpCircle, X, Check } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg">
        <Check className="w-3.5 h-3.5" />
        <span>App Installed</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstalledNotice(true);
      setTimeout(() => setInstalledNotice(false), 4000);
    }
  };

  return (
    <>
      {isInstallable && (
        <button
          onClick={handleInstallClick}
          className="btn-theme-gradient flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-all active:scale-95"
          title="Install Todo-chan to your desktop or mobile home screen"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      )}

      {isIOS && (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition"
        >
          <HelpCircle className="w-3.5 h-3.5 text-theme" />
          <span>Install on iOS</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-theme"></span>
                Install Todo-chan on iOS
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-300 leading-relaxed">
              <div className="flex items-start gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-theme-soft text-theme text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <span>Tap the <strong>Share</strong> button at the bottom of the Safari screen.</span>
              </div>
              <div className="flex items-start gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-theme-soft text-theme text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <span>Scroll down and select <strong>Add to Home Screen</strong>.</span>
              </div>
              <div className="flex items-start gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-theme-soft text-theme text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <span>Tap <strong>Add</strong> in the top-right corner to enjoy the full PWA experience!</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="btn-theme-primary mt-5 w-full rounded-xl text-white font-semibold py-2.5 text-sm transition"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {installedNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900/90 border border-emerald-500 text-emerald-100 text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          Todo-chan installed successfully!
        </div>
      )}
    </>
  );
};
