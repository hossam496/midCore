import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

/**
 * PWA Install Banner
 * Shows a subtle banner prompting users to install MedCore as a native app.
 * Respects the beforeinstallprompt browser event — only shows when installable.
 */
const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if user already dismissed this session
    const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
    if (dismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowBanner(false);
    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    }
    setInstalling(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-banner-dismissed', '1');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      id="pwa-install-banner"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md"
      style={{ animation: 'slideUpFade 0.3s ease-out' }}
    >
      <div className="bg-[#0a1628] text-white rounded-2xl shadow-2xl shadow-black/30 px-5 py-4 flex items-center gap-4 border border-white/10">
        {/* Icon */}
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Smartphone size={20} className="text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">تثبيت ميدكور</p>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
            ثبّت التطبيق على جهازك للوصول السريع والإشعارات الفورية
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-60"
          >
            <Download size={13} />
            {installing ? '...' : 'تثبيت'}
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-white/10"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
};

export default PWAInstallBanner;
