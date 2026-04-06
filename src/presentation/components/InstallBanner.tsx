import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function InstallBanner() {
  const { showBanner, isIOS, triggerInstall, dismiss } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (!showBanner) return null;

  return (
    <>
      {/* Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
        <img src="pwa-192x192.png" alt="icon" className="w-10 h-10 rounded-xl shrink-0 shadow-sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-900">ติดตั้ง BadCost บนมือถือ</p>
          <p className="text-xs text-blue-600 mt-0.5">เปิดได้เหมือนแอปปกติ ไม่ต้องใช้บราวเซอร์</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={isIOS ? () => setShowIOSGuide(true) : triggerInstall}
            className="h-8 px-3 bg-blue-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform"
          >
            ติดตั้ง
          </button>
          <button
            onClick={dismiss}
            className="w-7 h-7 flex items-center justify-center text-blue-400 hover:text-blue-600 rounded-lg"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>
      </div>

      {/* iOS instruction modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="bg-white w-full rounded-t-3xl px-5 pt-5 pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <h2 className="text-lg font-bold text-slate-900 mb-4">วิธีติดตั้งบน iPhone / iPad</h2>

            <ol className="space-y-4 mb-6">
              <li className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">แตะปุ่ม Share</p>
                  <p className="text-xs text-slate-500 mt-0.5">แถบล่างของ Safari กดปุ่ม <span className="font-bold">□↑</span></p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">เลือก "Add to Home Screen"</p>
                  <p className="text-xs text-slate-500 mt-0.5">เลื่อนหาในเมนูแล้วแตะ <span className="font-bold">+ Add to Home Screen</span></p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">กด Add</p>
                  <p className="text-xs text-slate-500 mt-0.5">ไอคอน BadCost จะปรากฏบน Home Screen</p>
                </div>
              </li>
            </ol>

            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2 mb-4">
              ⚠️ ต้องใช้ Safari เท่านั้น (Chrome และบราวเซอร์อื่นไม่รองรับ)
            </p>

            <button
              onClick={() => { setShowIOSGuide(false); dismiss(); }}
              className="w-full h-12 bg-slate-100 text-slate-700 font-semibold rounded-2xl active:scale-95 transition-transform mb-2"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </>
  );
}
