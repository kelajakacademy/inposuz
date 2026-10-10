import React from "react";
import { useOrder } from "../context/OrderContext";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { Users } from "lucide-react";
import { InposLogo } from "./common/InposLogo";

export const TableSelection = () => {
  const { tables, selectTable, waiter } = useOrder();

  return (
    <div className="flex-1 p-8 bg-[#1A1D21] overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <InposLogo className="h-7 w-auto" variant="white" />
              <span className="text-xs font-bold uppercase tracking-widest text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                {waiter?.cafeName || "iNPOS"}
              </span>
              <span className="text-xs text-gray-400">Ofitsiant: <b className="text-white">{waiter?.name}</b></span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1.5">Stolni tanlang</h1>
            <p className="text-gray-400 text-sm">Buyurtma olish yoki faol sessiyani davom ettirish uchun bo'sh stolni tanlang.</p>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {tables.map((table) => {
            const isOccupied = table.status === "occupied";
            const isOccupiedByMe = isOccupied && (
              table.activeWaiterId === waiter?.id ||
              (Boolean(table.activeWaiterName && waiter?.name) && table.activeWaiterName.trim().toLowerCase() === waiter.name.trim().toLowerCase()) ||
              waiter?.role === "admin" ||
              waiter?.isAdmin
            );
            const isOccupiedByAnother = isOccupied && !isOccupiedByMe;

            return (
              <motion.button
                key={table.id}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectTable(table.id)}
                className={cn(
                  "aspect-square rounded-3xl border-2 p-6 flex flex-col items-center justify-center transition-all relative overflow-hidden group cursor-pointer",
                  table.status === "available" && "bg-[#25292E] border-gray-800 hover:border-[#E74C3C]/50",
                  isOccupiedByMe && "bg-[#E74C3C]/10 border-[#E74C3C] shadow-lg shadow-[#E74C3C]/10",
                  isOccupiedByAnother && "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60"
                )}
              >
                <div className={cn(
                  "p-3 rounded-2xl mb-4 transition-colors",
                  table.status === "available" && "bg-white/5 text-gray-400 group-hover:text-white",
                  isOccupiedByMe && "bg-[#E74C3C] text-white",
                  isOccupiedByAnother && "bg-amber-500/20 text-amber-400"
                )}>
                  <Users size={28} />
                </div>
                
                <span className={cn(
                  "text-2xl font-black mb-1",
                  table.status === "available" && "text-white",
                  isOccupiedByMe && "text-[#E74C3C]",
                  isOccupiedByAnother && "text-amber-400"
                )}>
                  #{table.number}
                </span>

                <span className="text-[10px] font-bold uppercase tracking-widest text-center">
                  {isOccupiedByMe ? (
                    <span className="text-[#E74C3C] font-black">Xizmatda (Siz)</span>
                  ) : isOccupiedByAnother ? (
                    <span className="text-amber-400/90">{table.activeWaiterName || "Boshqa xodim"}</span>
                  ) : (
                    <span className="text-gray-400">Bo'sh</span>
                  )}
                </span>

                {isOccupied && (
                   <div className={cn(
                     "absolute top-3 right-3 w-2.5 h-2.5 rounded-full animate-pulse",
                     isOccupiedByMe ? "bg-[#E74C3C]" : "bg-amber-400"
                   )} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
