import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  Check, 
  UtensilsCrossed, 
  MapPin, 
  Phone, 
  Clock, 
  X, 
  Volume2, 
  VolumeX, 
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Send
} from "lucide-react";
import { DeliveryOrder } from "../../types";
import { formatCurrency } from "../../lib/utils";
import { playDeliveryOrderChime, playOrderAcceptedSound } from "../../services/deliverySound";

interface TopDeliveryNotificationProps {
  incomingOrder: DeliveryOrder | null;
  onAccept: (order: DeliveryOrder) => void;
  onSendToKitchen: (order: DeliveryOrder) => void;
  onDismiss: () => void;
  onViewOrder: (order: DeliveryOrder) => void;
}

export const TopDeliveryNotification: React.FC<TopDeliveryNotificationProps> = ({
  incomingOrder,
  onAccept,
  onSendToKitchen,
  onDismiss,
  onViewOrder
}) => {
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(180); // 3-minute accept timer

  useEffect(() => {
    if (incomingOrder && !isSoundMuted) {
      playDeliveryOrderChime(incomingOrder.aggregator);

      // Repeat chime every 10 seconds if order is still 'new'
      const interval = setInterval(() => {
        if (!isSoundMuted) {
          playDeliveryOrderChime(incomingOrder.aggregator);
        }
      }, 9000);

      return () => clearInterval(interval);
    }
  }, [incomingOrder?.id, isSoundMuted]);

  useEffect(() => {
    if (!incomingOrder) return;
    setSecondsRemaining(180);
    const timer = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [incomingOrder?.id]);

  if (!incomingOrder) return null;

  const isYandex = incomingOrder.aggregator === "yandex_eats";
  const isUzum = incomingOrder.aggregator === "uzum_tezkor";
  const isTelegram = incomingOrder.aggregator === "telegram";

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -120, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -120, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-[300] w-full max-w-3xl px-4 pointer-events-auto"
      >
        <div className={`rounded-2xl p-4 shadow-2xl border-2 backdrop-blur-xl relative overflow-hidden ${
          isYandex 
            ? "bg-[#181508]/95 border-[#FCE000] text-white shadow-[0_10px_35px_rgba(252,224,0,0.3)]" 
            : isUzum 
              ? "bg-[#140D26]/95 border-[#7000FF] text-white shadow-[0_10px_35px_rgba(112,0,255,0.35)]"
              : isTelegram
                ? "bg-[#091829]/95 border-[#229ED9] text-white shadow-[0_10px_35px_rgba(34,158,217,0.35)]"
                : "bg-[#141A24]/95 border-emerald-500 text-white shadow-[0_10px_35px_rgba(16,185,129,0.3)]"
        }`}>
          {/* Glowing pulse bar at the top */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${
            isYandex ? "bg-[#FCE000] animate-pulse" : 
            isUzum ? "bg-[#7000FF] animate-pulse" : 
            isTelegram ? "bg-[#229ED9] animate-pulse" :
            "bg-emerald-500 animate-pulse"
          }`} />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Left side: Aggregator Logo badge + Info */}
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              {/* Animated Aggregator Icon */}
              <div className={`relative shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-black shadow-md ${
                isYandex 
                  ? "bg-[#FCE000] text-black" 
                  : isUzum 
                    ? "bg-[#7000FF] text-[#FCE000]" 
                    : isTelegram
                      ? "bg-[#229ED9] text-white shadow-[0_0_15px_rgba(34,158,217,0.5)]"
                      : "bg-emerald-500 text-white"
              }`}>
                {isYandex ? (
                  <div className="text-center font-black text-xs leading-none">
                    <span className="text-[14px] font-black tracking-tighter">Яндекс</span>
                    <span className="block text-[8px] font-bold uppercase tracking-widest text-black/70">Еда</span>
                  </div>
                ) : isUzum ? (
                  <div className="text-center font-black text-xs leading-none">
                    <span className="text-[14px] font-black">uzum</span>
                    <span className="block text-[8px] font-bold uppercase tracking-widest text-[#FCE000]">tezkor</span>
                  </div>
                ) : isTelegram ? (
                  <div className="text-center flex flex-col items-center justify-center">
                    <Send size={20} className="-rotate-12 translate-x-0.5" />
                    <span className="block text-[7px] font-black uppercase tracking-tighter mt-0.5">Bot</span>
                  </div>
                ) : (
                  <ShoppingBag size={22} />
                )}
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full animate-ping" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider ${
                    isYandex ? "bg-[#FCE000]/20 text-[#FCE000] border border-[#FCE000]/40" :
                    isUzum ? "bg-[#7000FF]/25 text-[#A855F7] border border-[#7000FF]/40" :
                    isTelegram ? "bg-[#229ED9]/25 text-[#54C5FF] border border-[#229ED9]/40" :
                    "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  }`}>
                    {isYandex ? "Yandex Eats" : isUzum ? "Uzum Tezkor" : isTelegram ? "Telegram Bot" : "To'g'ridan-to'g'ri"}
                  </span>

                  <span className="font-mono font-bold text-white text-sm bg-white/10 px-2 py-0.5 rounded">
                    #{incomingOrder.orderNumber}
                  </span>

                  <span className="text-xs text-amber-400 flex items-center gap-1 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <Clock size={12} />
                    Qabul vaqti: {formatTimer(secondsRemaining)}
                  </span>
                </div>

                <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-200">
                  <span className="font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                    {incomingOrder.customerName}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-300 truncate max-w-[180px] sm:max-w-[260px] flex items-center gap-1">
                    <MapPin size={11} className="text-gray-400 shrink-0" />
                    {incomingOrder.deliveryAddress}
                  </span>
                </div>

                {/* Items summary */}
                <div className="mt-1 text-[11px] text-gray-300 truncate flex items-center gap-1.5">
                  <span className="text-gray-400 font-medium">Taomlar:</span>
                  <span className="text-white font-medium">
                    {incomingOrder.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                  </span>
                  <span className="ml-auto font-black text-emerald-400 text-xs shrink-0">
                    {formatCurrency(incomingOrder.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right side: Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
              {/* Sound Toggle */}
              <button
                onClick={() => setIsSoundMuted(!isSoundMuted)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
                title={isSoundMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}
              >
                {isSoundMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-yellow-400 animate-pulse" />}
              </button>

              {/* View details */}
              <button
                onClick={() => onViewOrder(incomingOrder)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-colors"
              >
                Ko'rish
                <ChevronRight size={14} />
              </button>

              {/* Reject / Dismiss */}
              <button
                onClick={onDismiss}
                className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                title="Yopish"
              >
                <X size={16} />
              </button>

              {/* Accept & Send to Kitchen */}
              <button
                onClick={() => {
                  playOrderAcceptedSound();
                  onAccept(incomingOrder);
                }}
                className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-lg transition-all active:scale-95 ${
                  isYandex 
                    ? "bg-[#FCE000] hover:bg-[#ebd000] text-black shadow-[#FCE000]/25" 
                    : isUzum 
                      ? "bg-[#7000FF] hover:bg-[#6000e0] text-white shadow-[#7000FF]/30"
                      : isTelegram
                        ? "bg-[#229ED9] hover:bg-[#1a8bc2] text-white shadow-[#229ED9]/35"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25"
                }`}
              >
                <Check size={16} strokeWidth={3} />
                Qabul qilish
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
