import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle, CloudOff } from "lucide-react";
import { subscribeToSync, syncOfflineOrdersToServer, getOfflineOrdersQueue } from "../utils/offlineSync";
import { useOrder } from "../context/OrderContext";

export const NetworkSyncStatus: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { waiter, linkedCafe } = useOrder();
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState<number>(() => getOfflineOrdersQueue().length);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToSync((status) => {
      setIsOnline(status.isOnline);
      setPendingCount(status.pendingCount);
      setIsSyncing(status.isSyncing);
      if (status.lastSyncTime) {
        setLastSyncTime(status.lastSyncTime);
      }

      if (status.syncedJustNow && status.syncedJustNow > 0) {
        setToastMessage(`✅ ${status.syncedJustNow} ta oflayn buyurtma serverga muvaffaqiyatli yuklandi!`);
        setTimeout(() => setToastMessage(null), 5000);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    if (isSyncing || pendingCount === 0) return;
    const cafeId = linkedCafe?.id || waiter?.cafeId || "default";
    const res = await syncOfflineOrdersToServer(cafeId);
    if (!res.success && res.error) {
      setToastMessage(`⚠️ Sinxronlashda xatolik: ${res.error}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Status Badge */}
        {isOnline ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Wifi size={13} />
            <span className="hidden sm:inline">Onlayn</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-bold animate-pulse">
            <WifiOff size={13} />
            <span>Oflayn Rejim</span>
          </div>
        )}

        {/* Pending Offline Queue Count & Sync Button */}
        {pendingCount > 0 && (
          <button
            onClick={handleManualSync}
            disabled={isSyncing || !isOnline}
            title={isOnline ? "Serverga sinxronlash" : "Internet yo'q, ulanish kutilmoqda..."}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${
              isOnline
                ? "bg-[#E74C3C] text-white hover:bg-[#c0392b] active:scale-95 cursor-pointer"
                : "bg-gray-800 text-amber-400 border border-amber-500/30 cursor-not-allowed opacity-90"
            }`}
          >
            <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
            <span>
              {isSyncing
                ? "Sinxronlanmoqda..."
                : `${pendingCount} ta buyurtma saqlangan`}
            </span>
          </button>
        )}
      </div>

      {/* Floating Auto-Sync Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e2329] border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-md">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <p className="text-xs font-medium text-white">{toastMessage}</p>
        </div>
      )}
    </>
  );
};
