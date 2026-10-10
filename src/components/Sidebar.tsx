import React, { useState, useEffect } from "react";
import { Home, UtensilsCrossed, ClipboardList, History, Settings, LogOut, Landmark, Bike } from "lucide-react";
import { useOrder } from "../context/OrderContext";
import { cn } from "../lib/utils";
import { InposLogo } from "./common/InposLogo";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const { logout, waiter, receiptConfig, kitchenOrdersCount, activeDeliveryCount } = useOrder();

  const menuItems = [
    { id: "home", icon: Home, label: "Buyurtmalar (POS)" },
    { id: "delivery", icon: Bike, label: "Dostavka (Yandex / Uzum)", badge: activeDeliveryCount, badgeColor: "bg-amber-500" },
    { id: "kitchen", icon: UtensilsCrossed, label: "Oshxona (KDS)", badge: kitchenOrdersCount },
    ...(waiter?.isAdmin ? [
      { id: "menu", icon: ClipboardList, label: "Menyu" },
      { id: "history", icon: History, label: "Hisobotlar & Tarix" },
    ] : [
      { id: "history", icon: History, label: "Tarix" },
    ]),
    { id: "soliq", icon: Landmark, label: "Soliq & Fiskal (OFD)" },
    { id: "settings", icon: Settings, label: "Sozlamalar" },
  ];

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="w-20 bg-[#25292E] flex flex-col items-center py-6 gap-8 border-r border-gray-800 relative">
      {/* Network Status Badge */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
        <span className="text-[8px] font-black uppercase text-gray-500 tracking-widest">{isOnline ? 'Cloud' : 'Local'}</span>
      </div>

      <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-4 cursor-pointer overflow-hidden shadow-lg group p-1.5" onClick={() => onViewChange("home")} title="iNPOS POS">
        {receiptConfig.logoUrl && receiptConfig.logoUrl !== "/inpos-logo.svg" ? (
          <img src={receiptConfig.logoUrl} className="w-full h-full object-contain" alt="Logo" />
        ) : (
          <InposLogo className="w-full h-auto" variant="white" />
        )}
      </div>

      <div className="flex-1 flex flex-col gap-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "p-3 rounded-xl flex items-center justify-center transition-all duration-200 group relative",
              activeView === item.id 
                ? "text-white bg-white/5" 
                : "text-gray-500 hover:text-white"
            )}
          >
            <item.icon size={24} strokeWidth={activeView === item.id ? 2.5 : 2} className={cn(activeView === item.id && "text-[#E74C3C]")} />
            {typeof item.badge === "number" && item.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E74C3C] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg animate-pulse">
                {item.badge}
              </span>
            )}
            <span className="absolute left-16 bg-[#25292E] text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-gray-700">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-auto pb-6">
        <button 
          onClick={logout}
          className="p-3 text-gray-500 hover:text-red-500 transition-all duration-200"
          title="Tizimdan chiqish"
        >
          <LogOut size={24} />
        </button>
      </div>
    </div>
  );
};
