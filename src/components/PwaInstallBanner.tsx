import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Dismissed before?
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) return;

    if (ios) {
      // Show iOS guide after 3 seconds
      setTimeout(() => setShowBanner(true), 3000);
    } else {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setTimeout(() => setShowBanner(true), 3000);
      });
    }
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', '1');
  };

  if (isInstalled) return null;

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            className="pwa-banner"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                <img src="/icon-512.png" alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="pwa-banner-text">
                ثبِّت <span>MASTER Y</span> على جهازك للوصول السريع
              </div>
            </div>
            <div className="pwa-banner-actions">
              <button className="pwa-install-btn" onClick={handleInstall}>
                <Download size={14} style={{ display: 'inline', marginLeft: 4 }} />
                تثبيت
              </button>
              <button className="pwa-dismiss-btn" onClick={handleDismiss}>
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS install guide modal */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              padding: '0 0 20px'
            }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowGuide(false)}
          >
            <motion.div
              style={{ background: '#fff', borderRadius: '20px 20px 16px 16px', width: '100%', maxWidth: 480, overflow: 'hidden' }}
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ background: '#0d2b20', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Smartphone size={20} color="#00b5a3" />
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: 'Tajawal, sans-serif' }}>تثبيت التطبيق على iPhone / iPad</span>
                <button onClick={() => setShowGuide(false)} style={{ marginRight: 'auto', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <div className="android-guide">
                <div className="android-step">
                  <div className="step-num">1</div>
                  <div className="step-text">اضغط على زر <strong>المشاركة</strong> (Share) في أسفل شاشة Safari ↑</div>
                </div>
                <div className="android-step">
                  <div className="step-num">2</div>
                  <div className="step-text">اختر <strong>"إضافة إلى الشاشة الرئيسية"</strong> (Add to Home Screen)</div>
                </div>
                <div className="android-step">
                  <div className="step-num">3</div>
                  <div className="step-text">اضغط <strong>"إضافة"</strong> وسيظهر التطبيق على شاشتك الرئيسية</div>
                </div>
                <div style={{ background: '#f4f3ee', borderRadius: 10, padding: '12px 14px', marginTop: 8, fontSize: 13, color: '#555', fontFamily: 'Tajawal, sans-serif' }}>
                  💡 يعمل التطبيق بدون إنترنت بعد التثبيت
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Android guide — shown when no native prompt available */}
      <AnimatePresence>
        {showBanner && !deferredPrompt && !isIOS && (
          <div style={{ display: 'none' }} />
        )}
      </AnimatePresence>
    </>
  );
}
