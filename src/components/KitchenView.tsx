import React, { useState, useEffect } from "react";
import { useOrder } from "../context/OrderContext";
import { Order, CartItem } from "../types";
import { 
  UtensilsCrossed, 
  Clock, 
  User, 
  Printer, 
  CheckCircle, 
  Flame, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Check, 
  BellRing,
  AlertTriangle,
  Maximize,
  Minimize,
  Tv
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface KitchenViewProps {
  isStandaloneTvMode?: boolean;
}

export const KitchenView: React.FC<KitchenViewProps> = ({ isStandaloneTvMode = false }) => {
  const { printKitchenTicket, waiter, linkedCafe } = useOrder();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "preparing" | "ready">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [previousOrderCount, setPreviousOrderCount] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeCafeId = waiter?.cafeId || linkedCafe?.id || "default";

  // Live TV Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const fetchKitchenOrders = async () => {
    try {
      const res = await fetch("/api/orders/kitchen/active", {
        headers: { "x-cafe-id": activeCafeId }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        // Play sound if new order arrived and sound enabled
        if (soundEnabled && previousOrderCount > 0 && data.length > previousOrderCount) {
          playOrderChime();
        }
        setPreviousOrderCount(data.length);
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch kitchen orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const playOrderChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio might be blocked until user gesture
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 4000);
    return () => clearInterval(interval);
  }, [soundEnabled, previousOrderCount, activeCafeId]);

  const updateOrderStatus = async (orderId: string, kitchenStatus: 'pending' | 'preparing' | 'ready' | 'served') => {
    try {
      const res = await fetch("/api/orders/kitchen/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, kitchenStatus })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, kitchenStatus } : o));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const toggleItemCheck = (orderId: string, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getMinutesAgo = (dateStr: string) => {
    const orderTime = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffMins = Math.floor((now - orderTime) / (1000 * 60));
    return isNaN(diffMins) ? 0 : Math.max(0, diffMins);
  };

  const filteredOrders = orders.filter(o => {
    if (filter === "all") return true;
    const st = o.kitchenStatus || "pending";
    return st === filter;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#141619] p-6 lg:p-8 overflow-hidden">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E74C3C]/10 text-[#E74C3C] flex items-center justify-center border border-[#E74C3C]/20">
            <UtensilsCrossed size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-wide">
                Oshxona Ekrani (KDS)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#E74C3C] text-white">
                {orders.length} Faol
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Oshpazlar uchun buyurtmalarni tayyorlash va printer monitoringi
            </p>
          </div>
        </div>

        {/* Filter and controls */}
        <div className="flex items-center gap-2.5">
          {/* Live Clock for Kitchen TV */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-gray-800 text-white font-mono text-sm font-black shadow-inner">
            <Clock size={14} className="text-amber-400" />
            <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>

          {/* Status filters */}
          <div className="flex bg-[#1E2227] p-1 rounded-xl border border-gray-800 text-xs font-bold">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "all" ? "bg-[#2A2F36] text-white shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Barchasi ({orders.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "pending" ? "bg-amber-500/20 text-amber-300 shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Kutilmoqda
            </button>
            <button
              onClick={() => setFilter("preparing")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "preparing" ? "bg-blue-500/20 text-blue-300 shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Pishirilmoqda
            </button>
            <button
              onClick={() => setFilter("ready")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "ready" ? "bg-emerald-500/20 text-emerald-300 shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Tayyor
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playOrderChime();
            }}
            className={`p-2.5 rounded-xl border transition-colors ${
              soundEnabled 
                ? "bg-white/5 border-gray-700 text-emerald-400 hover:bg-white/10" 
                : "bg-white/5 border-gray-800 text-gray-500 hover:text-gray-300"
            }`}
            title={soundEnabled ? "Ovozli signal yoqilgan" : "Ovoz o'chirilgan"}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* TV Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-white/5 border border-gray-800 text-amber-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
            title={isFullscreen ? "Kichraytirish" : "TV To'liq ekran (Fullscreen)"}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            <span className="text-xs font-bold hidden lg:inline">TV Ekran</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchKitchenOrders}
            className="p-2.5 rounded-xl bg-white/5 border border-gray-800 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Yangilash"
          >
            <RotateCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 py-16">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-600">
              <CheckCircle size={36} />
            </div>
            <p className="text-base font-bold text-gray-400">Oshxonada faol buyurtmalar yo'q</p>
            <p className="text-xs text-gray-600 mt-1">Ofitsiantlar yangi taom yuborganida bu yerda darhol aks etadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-6">
            <AnimatePresence>
              {filteredOrders.map((order) => {
                const minsAgo = getMinutesAgo(order.timestamp);
                const status = order.kitchenStatus || "pending";
                const isUrgent = minsAgo >= 15;

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-[#1E2227] rounded-2xl border flex flex-col overflow-hidden shadow-xl transition-all ${
                      status === "ready" 
                        ? "border-emerald-500/50 ring-1 ring-emerald-500/20" 
                        : status === "preparing" 
                        ? "border-blue-500/50" 
                        : isUrgent 
                        ? "border-red-500/80 ring-1 ring-red-500/30" 
                        : "border-gray-800"
                    }`}
                  >
                    {/* Ticket Header */}
                    <div className={`p-4 border-b flex items-center justify-between ${
                      status === "ready" 
                        ? "bg-emerald-950/30 border-emerald-500/20" 
                        : status === "preparing" 
                        ? "bg-blue-950/30 border-blue-500/20" 
                        : isUrgent 
                        ? "bg-red-950/30 border-red-500/30" 
                        : "bg-[#25292F] border-gray-800"
                    }`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-white">
                            Stol #{order.tableNumber}
                          </span>
                          {isUrgent && status !== "ready" && (
                            <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                              <AlertTriangle size={10} />
                              Shoshilinch
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 font-medium">
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {order.waiterName || "Ofitsiant"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {minsAgo} daq oldin
                          </span>
                        </div>
                      </div>

                      {/* Print Ticket Button */}
                      <button
                        onClick={() => printKitchenTicket(order, order.items)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
                        title="Oshxona chekini chiqarish (KOT)"
                      >
                        <Printer size={16} />
                      </button>
                    </div>

                    {/* Order Items List */}
                    <div className="p-4 flex-1 overflow-y-auto space-y-2.5 max-h-[280px] custom-scrollbar">
                      {order.items.map((item: CartItem, idx: number) => {
                        const isDone = checkedItems[`${order.id}-${idx}`];
                        return (
                          <div
                            key={item.cartId || idx}
                            onClick={() => toggleItemCheck(order.id, idx)}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isDone 
                                ? "bg-white/[0.02] border-gray-800/50 opacity-40 line-through" 
                                : "bg-[#25292F]/60 border-gray-800 hover:border-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                isDone 
                                  ? "bg-emerald-500 border-emerald-500 text-black" 
                                  : "border-gray-600 bg-black/20"
                              }`}>
                                {isDone && <Check size={12} strokeWidth={3} />}
                              </div>
                              <div className="min-w-0">
                                <p className={`text-sm font-bold text-white truncate ${isDone ? "line-through text-gray-500" : ""}`}>
                                  {item.name}
                                </p>
                                {item.extras && item.extras.length > 0 && (
                                  <p className="text-[10px] text-amber-400/90 italic">
                                    + {item.extras.join(", ")}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-base font-black px-2 py-0.5 rounded-lg bg-black/40 text-[#E74C3C] border border-white/5 shrink-0">
                              x{item.quantity}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Bar */}
                    <div className="p-3 bg-[#171A1E] border-t border-gray-800 flex items-center gap-2">
                      {status === "pending" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "preparing")}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                          <Flame size={14} />
                          Pishirishni boshlash
                        </button>
                      )}

                      {status === "preparing" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "ready")}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                        >
                          <CheckCircle size={14} />
                          Tayyor deb belgilash
                        </button>
                      )}

                      {status === "ready" && (
                        <div className="flex-1 flex items-center gap-2">
                          <span className="flex-1 text-center py-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            ✓ Tayyor (Kutilmoqda)
                          </span>
                          <button
                            onClick={() => updateOrderStatus(order.id, "served")}
                            className="py-2 px-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold transition-colors"
                            title="Ofitsiantga topshirildi"
                          >
                            Topshirildi
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
