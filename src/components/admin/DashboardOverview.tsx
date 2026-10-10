import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/utils";
import { 
  TrendingUp, 
  ShoppingBag, 
  CreditCard, 
  DollarSign, 
  Users, 
  UtensilsCrossed, 
  AlertTriangle, 
  ArrowUpRight, 
  Clock, 
  Layers, 
  RefreshCw,
  Plus,
  Monitor,
  CheckCircle2,
  ChevronRight,
  Receipt
} from "lucide-react";

interface DashboardStats {
  todayRevenue: number;
  ordersCount: number;
  averageCheck: number;
  activeOrdersCount: number;
  totalTables: number;
  occupiedTables: number;
  cashRevenue: number;
  cardRevenue: number;
  onlineRevenue: number;
  topDishes: { name: string; count: number; total: number }[];
  lowStockCount: number;
  recentOrders: any[];
}

interface DashboardOverviewProps {
  cafeId?: string;
  onNavigate: (section: any) => void;
  onGoToPos: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ cafeId = "default", onNavigate, onGoToPos }) => {
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    ordersCount: 0,
    averageCheck: 0,
    activeOrdersCount: 0,
    totalTables: 0,
    occupiedTables: 0,
    cashRevenue: 0,
    cardRevenue: 0,
    onlineRevenue: 0,
    topDishes: [],
    lowStockCount: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/dashboard/stats", {
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Dashboard stats error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Live poll every 10s
    return () => clearInterval(interval);
  }, [cafeId]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0E1013] p-6 lg:p-8 overflow-y-auto custom-scrollbar">
      {/* Top Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Онлайн тизим фаол (Real-time)</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Бошқарув панели (Дашборд)
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Барча савдолар, чеклар ва кўрсаткичлар реал вақтда POS касса билан синхронланади
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { setLoading(true); fetchStats(); }}
            className="p-2.5 rounded-xl bg-[#181A1F] hover:bg-[#20242B] text-gray-300 hover:text-white border border-gray-800 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Маълумотларни янгилаш"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-amber-400" : ""} />
            <span className="hidden sm:inline">Янгилаш</span>
          </button>

          <button
            onClick={onGoToPos}
            className="px-4 py-2.5 rounded-xl bg-[#E74C3C] hover:bg-[#C0392B] text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all active:scale-[0.98]"
          >
            <Monitor size={15} />
            <span>POS Кассага ўтиш</span>
          </button>
        </div>
      </div>

      {/* 4 Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Today Revenue */}
        <div className="bg-[#141619] border border-gray-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400">Бугунги жами тушум</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {formatCurrency(stats.todayRevenue)}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400">
            <span>Ёпилган чеклар:</span>
            <span className="font-bold text-white font-mono">{stats.ordersCount} та</span>
          </div>
        </div>

        {/* Average Check */}
        <div className="bg-[#141619] border border-gray-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400">Ўртача чек миқдори</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Receipt size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {formatCurrency(stats.averageCheck)}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400">
            <span>Фаол столлар:</span>
            <span className="font-bold text-amber-400 font-mono">{stats.occupiedTables} / {stats.totalTables || 12}</span>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-[#141619] border border-gray-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400">Тўловлар тақсимоти</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="space-y-1.5 mt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Нақд:
              </span>
              <span className="font-bold text-white font-mono">{formatCurrency(stats.cashRevenue)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Карта:
              </span>
              <span className="font-bold text-white font-mono">{formatCurrency(stats.cardRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Low Stock & Warnings */}
        <div 
          onClick={() => onNavigate("inventory")}
          className="bg-[#141619] border border-gray-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden cursor-pointer hover:border-orange-500/40 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400">Омбор ва Қолдиқлар</span>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{stats.lowStockCount}</span>
            <span className="text-xs font-bold text-orange-400 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
              Кам қолган
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400">
            <span>Омборни кўриш</span>
            <ChevronRight size={14} className="text-gray-500" />
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns for Top Dishes & Live Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Top Selling Dishes (7 cols) */}
        <div className="lg:col-span-7 bg-[#141619] border border-gray-800/80 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <UtensilsCrossed size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Энг кўп сотилган таомлар (ТОП)</h3>
                <p className="text-[11px] text-gray-400">Бугунги кун давомида мижозлар энг кўп буюртма қилган таомлар</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("menu")}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
            >
              <span>Барчаси</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {stats.topDishes.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              <UtensilsCrossed size={28} className="mx-auto mb-2 opacity-40" />
              <span>Бугун ҳали савдо қилинмади</span>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.topDishes.map((dish, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1D22] border border-gray-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-black/40 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/20">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{dish.name}</h4>
                      <p className="text-[10px] text-gray-400 font-mono">{dish.count} та сотилди</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {formatCurrency(dish.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Recent Orders (5 cols) */}
        <div className="lg:col-span-5 bg-[#141619] border border-gray-800/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Сўнгги ёпилган чеклар</h3>
                  <p className="text-[11px] text-gray-400">Кассадаги сўнгги муваффақиятли тўловлар</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("orders")}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
              >
                <span>Тарих</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {stats.recentOrders.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs">
                <Receipt size={28} className="mx-auto mb-2 opacity-40" />
                <span>Сўнгги чеклар мавжуд эмас</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.recentOrders.map((ord, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-[#1A1D22] border border-gray-800/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 size={14} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Стол {ord.tableNumber}</span>
                          <span className="text-[10px] text-gray-500 font-normal">({ord.waiterName || "Официант"})</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {ord.paymentMethod === "cash" ? "💵 Нақд" : "💳 Карта"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-white font-mono">
                        {formatCurrency(ord.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-gray-800/80 flex items-center justify-between">
            <span className="text-xs text-gray-400">Барча тўлиқ ҳисоботлар</span>
            <button
              onClick={() => onNavigate("reports")}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors"
            >
              Ҳисоботларни очиш
            </button>
          </div>
        </div>
      </div>

      {/* Quick Setup / Synchronization Help Box */}
      <div className="bg-gradient-to-r from-amber-500/10 via-red-500/10 to-blue-500/10 border border-amber-500/20 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">Реал вақтдаги тўлиқ синхронизация (POS & Waiter)</h4>
            <p className="text-xs text-gray-300 mt-0.5">
              Ушбу веб сайтда (онлайн бошқарувда) қўшилган барча меню таомлари, нархлар, ходимлар ва столлар дарҳол планшет ва касса экранларида акс этади.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate("menu")}
            className="px-4 py-2.5 rounded-xl bg-[#F39C12] hover:bg-[#E67E22] text-black font-black text-xs transition-all"
          >
            Таом қўшиш
          </button>
          <button
            onClick={() => onNavigate("employees")}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all"
          >
            Ходим қўшиш
          </button>
        </div>
      </div>
    </div>
  );
};
