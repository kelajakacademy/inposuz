import React, { useState, useEffect } from "react";
import { useOrder } from "../context/OrderContext";
import { Order, CartItem } from "../types";
import { formatCurrency } from "../lib/utils";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  ChevronRight, 
  Printer, 
  Search, 
  TrendingUp, 
  CreditCard, 
  Banknote, 
  RotateCw,
  ShoppingBag,
  FileText,
  Filter,
  CheckCircle2,
  Clock,
  UtensilsCrossed
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const HistoryView = () => {
  const { printCustomerBill, printKitchenTicket, printDailyReport, waiter, linkedCafe, receiptConfig } = useOrder();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date and filter states
  const [dateFilter, setDateFilter] = useState<"today" | "yesterday" | "week" | "all">("today");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedWaiter, setSelectedWaiter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const activeCafeId = waiter?.cafeId || linkedCafe?.id || "default";

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/history", {
        headers: { "x-cafe-id": activeCafeId }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeCafeId]);

  // Filter orders based on date, waiter, and search query
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.timestamp).toISOString().split('T')[0];
    
    // Date filter
    if (dateFilter === "today" && orderDate !== todayStr) return false;
    if (dateFilter === "yesterday" && orderDate !== yesterdayStr) return false;
    if (dateFilter === "week") {
      const diffDays = (new Date().getTime() - new Date(order.timestamp).getTime()) / (1000 * 3600 * 24);
      if (diffDays > 7) return false;
    }

    // Waiter filter
    if (selectedWaiter !== "all" && (order.waiterName || "").trim().toLowerCase() !== selectedWaiter.trim().toLowerCase()) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTable = order.tableNumber.toLowerCase().includes(query);
      const matchWaiter = (order.waiterName || "").toLowerCase().includes(query);
      const matchId = order.id.toLowerCase().includes(query);
      const matchItem = order.items.some(it => it.name.toLowerCase().includes(query));
      if (!matchTable && !matchWaiter && !matchId && !matchItem) {
        return false;
      }
    }

    return true;
  });

  // Analytics calculation for the active filter set
  const completedOrders = filteredOrders.filter(o => o.status === "completed");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrdersCount = completedOrders.length;
  const avgCheck = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  const cashTotal = completedOrders
    .filter(o => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.total, 0);

  const cardTotal = completedOrders
    .filter(o => o.paymentMethod === 'card')
    .reduce((sum, o) => sum + o.total, 0);

  // Waiters breakdown calculation
  const waiterStats: Record<string, { waiterName: string; orderCount: number; totalRevenue: number }> = {};
  for (const o of completedOrders) {
    const w = o.waiterName || "Noma'lum ofitsiant";
    if (!waiterStats[w]) {
      waiterStats[w] = { waiterName: w, orderCount: 0, totalRevenue: 0 };
    }
    waiterStats[w].orderCount += 1;
    waiterStats[w].totalRevenue += o.total;
  }
  const waiterList = Object.values(waiterStats).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Top products calculation
  const productStats: Record<string, { name: string; count: number; sum: number }> = {};
  for (const o of completedOrders) {
    for (const it of o.items) {
      if (!productStats[it.name]) {
        productStats[it.name] = { name: it.name, count: 0, sum: 0 };
      }
      productStats[it.name].count += it.quantity;
      productStats[it.name].sum += (it.price * it.quantity);
    }
  }
  const topProducts = Object.values(productStats).sort((a, b) => b.count - a.count).slice(0, 5);

  const handlePrintDailyReport = () => {
    printDailyReport({
      date: dateFilter === "today" ? todayStr : dateFilter === "yesterday" ? yesterdayStr : "Hisobot",
      totalSales: totalRevenue,
      totalOrdersCount: totalOrdersCount,
      cashSales: cashTotal,
      cardSales: cardTotal,
      mixedSales: totalRevenue - cashTotal - cardTotal,
      waiters: waiterList,
      topProducts: topProducts
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#16181B] p-6 lg:p-8 overflow-hidden">
      {/* Top Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-wide flex items-center gap-3">
            <span>Admin & Kunlik Hisobot</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {filteredOrders.length} Buyurtma
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Barcha berilgan buyurtmalar, ofitsiantlar faoliyati va kunlik kassa umumiy hisobi
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Print Daily Z-Report Button */}
          <button
            onClick={handlePrintDailyReport}
            className="px-4 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-[0.98]"
          >
            <Printer size={16} />
            Kunlik Z-Hisobotni chop etish
          </button>

          {/* Refresh Button */}
          <button 
            onClick={fetchHistory}
            className="p-2.5 rounded-xl bg-[#25292E] border border-gray-800 text-gray-400 hover:text-white transition-all hover:bg-white/5"
            title="Yangilash"
          >
            <RotateCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* KPI Cards (Kunlik hisob ko'rsatkichlari) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#20242A] p-4 rounded-2xl border border-gray-800 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {dateFilter === "today" ? "Kunlik Tushum" : "Jami Tushum"}
            </p>
            <p className="text-xl lg:text-2xl font-black text-emerald-400 mt-1">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
              {completedOrders.length} ta yakunlangan hisob
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-[#20242A] p-4 rounded-2xl border border-gray-800 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Naqd Pul (Cash)</p>
            <p className="text-xl lg:text-2xl font-black text-white mt-1">
              {formatCurrency(cashTotal)}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
              {totalRevenue > 0 ? `${Math.round((cashTotal / totalRevenue) * 100)}% ulush` : "0%"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
            <Banknote size={24} />
          </div>
        </div>

        <div className="bg-[#20242A] p-4 rounded-2xl border border-gray-800 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Plastik Karta (Card)</p>
            <p className="text-xl lg:text-2xl font-black text-white mt-1">
              {formatCurrency(cardTotal)}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
              {totalRevenue > 0 ? `${Math.round((cardTotal / totalRevenue) * 100)}% ulush` : "0%"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="bg-[#20242A] p-4 rounded-2xl border border-gray-800 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">O'rtacha Chek</p>
            <p className="text-xl lg:text-2xl font-black text-amber-400 mt-1">
              {formatCurrency(avgCheck)}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
              Har bir buyurtma uchun
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#20242A] p-3 rounded-2xl border border-gray-800 mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* Date Filter Tabs */}
        <div className="flex bg-[#16181B] p-1 rounded-xl border border-gray-800 text-xs font-bold">
          <button
            onClick={() => setDateFilter("today")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              dateFilter === "today" ? "bg-white text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            Bugun
          </button>
          <button
            onClick={() => setDateFilter("yesterday")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              dateFilter === "yesterday" ? "bg-white text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            Kecha
          </button>
          <button
            onClick={() => setDateFilter("week")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              dateFilter === "week" ? "bg-white text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            Oxirgi 7 kun
          </button>
          <button
            onClick={() => setDateFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              dateFilter === "all" ? "bg-white text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            Barchasi
          </button>
        </div>

        {/* Waiter Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold hidden sm:inline">Ofitsiant:</span>
          <select
            value={selectedWaiter}
            onChange={(e) => setSelectedWaiter(e.target.value)}
            className="bg-[#16181B] border border-gray-700 text-white rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-[#E74C3C]"
          >
            <option value="all">Barcha ofitsiantlar</option>
            {waiterList.map(w => (
              <option key={w.waiterName} value={w.waiterName}>
                {w.waiterName} ({w.orderCount} ta)
              </option>
            ))}
          </select>
        </div>

        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Stol, ofitsiant yoki taom nomi..."
            className="w-full bg-[#16181B] border border-gray-800 text-white pl-9 pr-3 py-1.5 rounded-xl text-xs placeholder-gray-500 focus:outline-none focus:border-[#E74C3C]"
          />
        </div>
      </div>

      {/* Waiters summary chips */}
      {waiterList.length > 0 && (
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 text-xs custom-scrollbar">
          <span className="text-gray-500 font-bold text-[11px] uppercase tracking-wider shrink-0">Ofitsiantlar:</span>
          {waiterList.map((w) => (
            <button
              key={w.waiterName}
              onClick={() => setSelectedWaiter(selectedWaiter === w.waiterName ? "all" : w.waiterName)}
              className={`px-3 py-1 rounded-xl border shrink-0 transition-all font-medium flex items-center gap-2 ${
                selectedWaiter === w.waiterName
                  ? "bg-[#E74C3C] text-white border-[#E74C3C]"
                  : "bg-[#20242A] text-gray-300 border-gray-800 hover:border-gray-700"
              }`}
            >
              <span>{w.waiterName}</span>
              <span className="px-1.5 py-0.2 bg-black/30 rounded text-[10px] font-black">
                {w.orderCount} ta
              </span>
              <span className="font-bold text-emerald-400">
                {formatCurrency(w.totalRevenue)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Content Area (Orders List + Order Receipt Preview) */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Orders List */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 py-12">
              <ShoppingBag size={48} strokeWidth={1} className="mb-3 opacity-40" />
              <p className="text-sm font-bold text-gray-400">Hech qanday buyurtma topilmadi</p>
              <p className="text-xs text-gray-600 mt-1">Belgilangan filterlar bo'yicha ma'lumot mavjud emas</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = selectedOrder?.id === order.id;
              const isCompleted = order.status === "completed";

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 ${
                    isSelected 
                      ? "bg-[#2A2F37] border-[#E74C3C] shadow-lg shadow-[#E74C3C]/5" 
                      : "bg-[#20242A] border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-white text-base">
                        #{order.tableNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-white">
                            Stol #{order.tableNumber}
                          </h3>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                            isCompleted 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {isCompleted ? "Yakunlangan" : "Faol"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          <span className="flex items-center gap-1 font-semibold text-gray-300">
                            <Users size={12} className="text-[#E74C3C]" />
                            Ofitsiant: {order.waiterName || "Noma'lum"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-black text-emerald-400">
                        {formatCurrency(order.total)}
                      </p>
                      {order.paymentMethod && (
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border inline-block mt-0.5 ${
                          order.paymentMethod === 'cash' ? "bg-green-500/10 border-green-500/30 text-green-400" :
                          order.paymentMethod === 'card' ? "bg-blue-500/10 border-blue-500/30 text-blue-400" :
                          "bg-purple-500/10 border-purple-500/30 text-purple-400"
                        }`}>
                          {order.paymentMethod === 'cash' ? "Naqd" : order.paymentMethod === 'card' ? "Karta" : "Aralash"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items list preview */}
                  <div className="border-t border-gray-800/80 pt-2 flex flex-wrap items-center gap-1.5 text-xs text-gray-300">
                    <span className="text-gray-500 font-bold text-[10px] uppercase mr-1">Buyurtma:</span>
                    {order.items.map((it, idx) => (
                      <span key={idx} className="bg-black/30 px-2 py-0.5 rounded-md border border-white/5 text-[11px]">
                        <span className="font-black text-[#E74C3C] mr-1">{it.quantity}x</span>
                        <span>{it.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Drawer: Selected Order Receipt Details */}
        {selectedOrder ? (
          <div className="w-80 lg:w-96 bg-[#20242A] rounded-3xl p-6 border border-gray-800 flex flex-col shadow-2xl shrink-0">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <div>
                <h2 className="text-lg font-black text-white">Chek Tafsilotlari</h2>
                <p className="text-xs text-gray-400">
                  Stol #{selectedOrder.tableNumber} • ID: #{selectedOrder.id.slice(-6)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Receipt Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4 font-mono text-xs">
              <div className="bg-[#16181B] p-3 rounded-xl border border-gray-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Ofitsiant:</span>
                  <span className="font-bold text-white">{selectedOrder.waiterName || "Noma'lum"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sana:</span>
                  <span className="text-gray-300">{new Date(selectedOrder.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vaqt:</span>
                  <span className="text-gray-300">{new Date(selectedOrder.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">To'lov turi:</span>
                  <span className="font-black text-emerald-400 uppercase">{selectedOrder.paymentMethod || "Naqd"}</span>
                </div>
              </div>

              {/* Items in the order */}
              <div className="space-y-2">
                <p className="font-bold text-gray-400 text-[10px] uppercase tracking-wider font-sans">
                  Buyurtma qilingan taomlar ({selectedOrder.items.length}):
                </p>
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start py-1 border-b border-gray-800/50">
                    <div className="pr-2 min-w-0">
                      <p className="font-bold text-white truncate">{it.name}</p>
                      <p className="text-[10px] text-gray-500">
                        {it.quantity} x {formatCurrency(it.price)}
                      </p>
                    </div>
                    <span className="font-bold text-white shrink-0">
                      {formatCurrency(it.price * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-dashed border-gray-700 pt-3 space-y-1.5">
                <div className="flex justify-between text-gray-400">
                  <span>Oraliq hisob (Subtotal):</span>
                  <span>{formatCurrency(selectedOrder.subtotal || (selectedOrder.total / 1.1))}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Xizmat / Soliq (10%):</span>
                  <span>{formatCurrency(selectedOrder.tax || (selectedOrder.total - (selectedOrder.total / 1.1)))}</span>
                </div>
                <div className="flex justify-between font-black text-base text-[#E74C3C] pt-2 border-t border-gray-800">
                  <span>JAMI SUMMA:</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Print action buttons */}
            <div className="mt-4 pt-4 border-t border-gray-800 flex flex-col gap-2">
              <button
                onClick={() => printCustomerBill(selectedOrder)}
                className="w-full py-3 bg-white text-black hover:bg-gray-200 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Printer size={15} />
                Kassa Chekini Chop Etish (Kassa)
              </button>

              <button
                onClick={() => printKitchenTicket(selectedOrder, selectedOrder.items)}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-gray-800"
              >
                <UtensilsCrossed size={15} />
                Oshxona Chekini Chop Etish (KOT)
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex w-80 lg:w-96 bg-[#20242A]/40 rounded-3xl border border-dashed border-gray-800 flex-col items-center justify-center p-8 text-center text-gray-500">
            <FileText size={40} className="mb-3 opacity-30" />
            <p className="font-bold text-sm text-gray-400">Chekni ko'rish uchun buyurtmani tanlang</p>
            <p className="text-xs text-gray-600 mt-1">
              Barcha taomlar, ofitsiant ma'lumoti va to'lov hisobini ko'rishingiz mumkin
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
