import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export default function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPopup, setShowIOSPopup] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if device is iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const simulateProgress = () => {
    setIsInstalling(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsInstalling(false), 500); // hide after a moment
          return 100;
        }
        return prev + 15; // 6-7 seconds roughly
      });
    }, 1000);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Native Android/Chrome install
      simulateProgress();
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      } else {
        // user cancelled
        setIsInstalling(false);
      }
    } else if (isIOS || !deferredPrompt) {
      // Show iOS fallback guidelines popup
      setShowIOSPopup(true);
    }
  };

  // Do not show button if already installed (standalone)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  if (isStandalone) return null;

  return (
    <>
      {/* Floating Install Button */}
      <button
        onClick={handleInstallClick}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-600/30 font-bold transition-all animate-bounce"
      >
        <Download size={20} />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {/* Progress Bar Overlay */}
      {isInstalling && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full mx-4 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Installing Hafiz+Pharmacy...</h3>
            <p className="text-xs text-slate-500 mb-6">Please wait while we add the app to your device.</p>
            
            <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs font-bold text-emerald-600 text-right">{Math.min(progress, 100)}%</p>
          </div>
        </div>
      )}

      {/* iOS Guidelines Popup */}
      {showIOSPopup && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative animate-slide-up">
            <button 
              onClick={() => setShowIOSPopup(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"
            >
              <X size={16} />
            </button>

            <div className="p-6 pt-10 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Download size={32} />
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-800 mb-2">Install App</h3>
              <p className="text-sm text-slate-500 mb-6">
                Install Hafiz+Pharmacy on your device for quick access and a better experience.
              </p>

              <div className="space-y-3 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shrink-0 font-bold text-xs text-slate-600">1</div>
                  <p className="text-xs text-slate-600 font-medium pt-1">
                    Tap the <Share size={14} className="inline text-blue-500 mx-1" /> <strong>Share</strong> button at the bottom of your screen.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shrink-0 font-bold text-xs text-slate-600">2</div>
                  <p className="text-xs text-slate-600 font-medium pt-1">
                    Scroll down and tap <PlusSquare size={14} className="inline text-slate-700 mx-1" /> <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowIOSPopup(false);
                  simulateProgress();
                }}
                className="w-full mt-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
