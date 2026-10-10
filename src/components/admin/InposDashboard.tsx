import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/utils";
import { 
  Banknote, 
  Receipt, 
  Wallet, 
  Grid, 
  Clock, 
  RefreshCw, 
  Info,
  TrendingUp,
  Package,
  CreditCard,
  Folder,
  BarChart2,
  Users,
  Calendar,
  Layers
} from "lucide-react";

export interface InposDashboardProps {
  cafeId?: string;
  restaurantName: string;
  onNavigateTab: (tab: string, subTab?: string) => void;
}

export type BarPosDashboardProps = InposDashboardProps;

export const InposDashboard: React.FC<InposDashboardProps> = ({ 
  cafeId = "default", 
  restaurantName,
  onNavigateTab 
}) => {
  const [loading, setLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState("");
  const [todayDateStr, setTodayDateStr] = useState("");

  const [stats, setStats] = useState({
    todayRevenue: 0,
    ordersCount: 0,
    averageCheck: 0,
    activeOrdersCount: 0,
    totalTables: 15,
    occupiedTablesCount: 0,
    unpaidOrdersSum: 0,
    shiftOpen: false,
    topDishes: [] as { name: string; count: number; total: number; category?: string }[],
    hourlyRevenue: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // 01:00 to 23:00
  });

  const fetchLiveAnalytics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      setLastRefreshTime(now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      setTodayDateStr(`${yyyy}-${mm}-${dd}`);

      const [reportsRes, tablesRes] = await Promise.all([
        fetch("/api/admin/reports", { headers: { "x-cafe-id": cafeId } }),
        fetch("/api/tables", { headers: { "x-cafe-id": cafeId } })
      ]);

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        const allOrders: any[] = reportsData.orders || [];
        const tablesData: any[] = tablesRes.ok ? await tablesRes.json() : [];

        // Today's completed & active orders
        const todayCutoff = new Date();
        todayCutoff.setHours(0, 0, 0, 0);

        const todayCompleted = allOrders.filter(o => {
          if (o.status !== 'completed') return false;
          if (!o.timestamp) return true;
          return new Date(o.timestamp) >= todayCutoff;
        });

        const activeOrders = allOrders.filter(o => o.status === 'active');

        let totalRev = 0;
        const dishCountMap: Record<string, { name: string; count: number; total: number; category?: string }> = {};
        const hourlyBuckets = new Array(12).fill(0); // 01:00, 03:00, 05:00, 07:00, 09:00, 11:00, 13:00, 15:00, 17:00, 19:00, 21:00, 23:00

        for (const ord of todayCompleted) {
          const tot = Number(ord.total) || 0;
          totalRev += tot;

          // Bucket by hour
          if (ord.timestamp) {
            const hr = new Date(ord.timestamp).getHours();
            const idx = Math.min(11, Math.max(0, Math.floor(hr / 2)));
            hourlyBuckets[idx] += tot;
          }

          // Top selling items
          const items = Array.isArray(ord.items) ? ord.items : (typeof ord.items === "string" ? JSON.parse(ord.items || "[]") : []);
          for (const item of items) {
            const iName = item.name || "Taom";
            const iQty = Number(item.quantity) || 1;
            const iPrice = Number(item.price) || 0;

            if (!dishCountMap[iName]) {
              dishCountMap[iName] = { name: iName, count: 0, total: 0, category: item.category || "Oshxona" };
            }
            dishCountMap[iName].count += iQty;
            dishCountMap[iName].total += (iPrice * iQty);
          }
        }

        const avgCheck = todayCompleted.length > 0 ? Math.round(totalRev / todayCompleted.length) : 0;
        const unpaidSum = activeOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);
        const top5Dishes = Object.values(dishCountMap).sort((a, b) => b.count - a.count).slice(0, 5);

        // Occupied tables count
        const occupiedCount = activeOrders.length;

        setStats({
          todayRevenue: totalRev,
          ordersCount: todayCompleted.length,
          averageCheck: avgCheck,
          activeOrdersCount: activeOrders.length,
          totalTables: tablesData.length || 15,
          occupiedTablesCount: occupiedCount,
          unpaidOrdersSum: unpaidSum,
          shiftOpen: false, // Default false as shown in screenshot ("Smena ochilmagan")
          topDishes: top5Dishes,
          hourlyRevenue: hourlyBuckets
        });
      }
    } catch (e) {
      console.error("Failed to fetch dashboard analytics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveAnalytics();
    const interval = setInterval(fetchLiveAnalytics, 10000);
    return () => clearInterval(interval);
  }, [cafeId]);

  const hourlyTimeLabels = [
    "01:00", "03:00", "05:00", "07:00", "09:00", "11:00", 
    "13:00", "15:00", "17:00", "19:00", "21:00", "23:00"
  ];

  // SVG Chart calculation
  const maxHourly = Math.max(...stats.hourlyRevenue, 0);
  const chartMaxY = maxHourly === 0 ? 4 : Math.ceil(maxHourly * 1.2);

  return (
    <div className="flex-1 bg-[#F5F7FA] text-[#1E293B] overflow-y-auto font-sans p-6 space-y-6 select-none">
      {/* 1. TOP TITLE BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
            Boshqaruv paneli
          </h1>
          <p className="text-xs font-medium text-gray-500 mt-0.5">
            Bugun ({todayDateStr || "2026-10-08"})
          </p>
        </div>

        <button
          onClick={fetchLiveAnalytics}
          className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-blue-600" : "text-gray-500"} />
          <span>Yangilash</span>
        </button>
      </div>

      {/* 2. TOP 4 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Bugungi tushum */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500">Bugungi tushum</span>
              <div className="text-2xl font-bold text-gray-900 mt-1 font-mono tracking-tight">
                {stats.todayRevenue > 0 ? `${stats.todayRevenue.toLocaleString()} so'm` : "0 so'm"}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Banknote size={18} />
            </div>
          </div>
          <div className="text-[11px] font-medium text-gray-400 mt-4">
            Kechagiga nisbatan 0%
          </div>
        </div>

        {/* Card 2: Cheklar */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500">Cheklar</span>
              <div className="text-2xl font-bold text-gray-900 mt-1 font-mono tracking-tight">
                {stats.ordersCount}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Receipt size={18} />
            </div>
          </div>
          <div className="text-[11px] font-medium text-gray-400 mt-4">
            Kechagiga nisbatan 0%
          </div>
        </div>

        {/* Card 3: O'rtacha chek */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500">O'rtacha chek</span>
              <div className="text-2xl font-bold text-gray-900 mt-1 font-mono tracking-tight">
                {stats.averageCheck > 0 ? `${stats.averageCheck.toLocaleString()} so'm` : "0 so'm"}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Wallet size={18} />
            </div>
          </div>
          <div className="text-[11px] font-medium text-gray-400 mt-4">
            Bugungi to'langan cheklar bo'yicha
          </div>
        </div>

        {/* Card 4: Stol aylanmasi */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500">Stol aylanmasi</span>
              <div className="text-2xl font-bold text-gray-900 mt-1 font-mono tracking-tight">
                {stats.occupiedTablesCount}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Grid size={18} />
            </div>
          </div>
          <div className="text-[11px] font-medium text-gray-400 mt-4">
            Bugun band bo'lgan stollar soni
          </div>
        </div>
      </div>

      {/* 3. MIDDLE SECTION: SOATLIK TUSHUM & JORIY SMENA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width): Soatlik tushum Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200/80 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Soatlik tushum</h3>
            <p className="text-xs font-medium text-gray-400 mt-0.5">Bugungi kun, 00:00 dan 23:00 gacha</p>
          </div>

          {/* SVG Line / Area Graph */}
          <div className="mt-6 w-full overflow-x-auto">
            <svg viewBox="0 0 700 200" className="w-full h-48 select-none">
              {/* Y Axis Grid Lines & Scale (0, 1, 2, 3, 4) */}
              {[0, 1, 2, 3, 4].map((gridVal, i) => {
                const y = 160 - (i * 35);
                return (
                  <g key={i}>
                    <line x1="45" y1={y} x2="680" y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="35" y={y + 4} textAnchor="end" className="text-[11px] fill-gray-400 font-sans font-medium">
                      {chartMaxY > 4 ? Math.round((chartMaxY / 4) * gridVal) : gridVal}
                    </text>
                  </g>
                );
              })}

              {/* Chart Plot Line */}
              {(() => {
                const points = stats.hourlyRevenue.map((val, idx) => {
                  const x = 55 + idx * (610 / 11);
                  const y = 160 - (val / (chartMaxY || 1)) * 140;
                  return { x, y, val };
                });

                let pathD = `M ${points[0].x} ${points[0].y}`;
                for (let i = 0; i < points.length - 1; i++) {
                  const p0 = points[i];
                  const p1 = points[i + 1];
                  const cx = (p0.x + p1.x) / 2;
                  pathD += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
                }

                return (
                  <g>
                    <path d={pathD} fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                    {points.map((p, idx) => (
                      <circle 
                        key={idx} 
                        cx={p.x} 
                        cy={p.y} 
                        r={p.val > 0 ? 4 : 2} 
                        fill={p.val > 0 ? "#2563EB" : "#94A3B8"} 
                        stroke="#ffffff" 
                        strokeWidth="1.5" 
                      />
                    ))}
                  </g>
                );
              })()}

              {/* X Axis Time Labels */}
              {hourlyTimeLabels.map((time, idx) => {
                const x = 55 + idx * (610 / 11);
                return (
                  <text key={idx} x={x} y="185" textAnchor="middle" className="text-[11px] fill-gray-400 font-sans font-medium">
                    {time}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Column (1/3 width): Joriy smena */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Joriy smena</h3>
            <p className="text-xs font-medium text-gray-400 mt-0.5">Smena ochilganidan hozirgacha</p>

            {/* Dotted Inner Box */}
            <div className="mt-6 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/50 flex flex-col items-center justify-center min-h-[150px]">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                <Clock size={20} />
              </div>
              <h4 className="text-sm font-bold text-gray-800">Smena ochilmagan</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
                Kassada smena ochilgandan keyin joriy tushum shu yerda ko'rinadi.
              </p>
            </div>
          </div>

          {/* Bottom Metrics Row */}
          <div className="mt-6 pt-4 border-t border-gray-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Ochiq stollar</span>
              <span className="font-bold text-gray-900 font-mono">{stats.activeOrdersCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">To'lanmagan cheklar</span>
              <span className="font-bold text-gray-900 font-mono">{stats.unpaidOrdersSum > 0 ? `${stats.unpaidOrdersSum.toLocaleString()} so'm` : "0"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM SECTION: ENG KO'P SOTILGAN 5 TA MAHSULOT */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-gray-900">Eng ko'p sotilgan 5 ta mahsulot</h3>
          <p className="text-xs font-medium text-gray-400 mt-0.5">Bugungi savdo bo'yicha</p>
        </div>

        <div className="mt-8 py-8 text-center min-h-[100px] flex items-center justify-center">
          {stats.topDishes.length === 0 ? (
            <span className="text-xs font-medium text-gray-400">
              Bugun hali savdo bo'lmagan
            </span>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold pb-2">
                    <th className="py-2 px-3">№</th>
                    <th className="py-2 px-3">Mahsulot nomi</th>
                    <th className="py-2 px-3">Kategoriya</th>
                    <th className="py-2 px-3 text-center">Sotilgan soni</th>
                    <th className="py-2 px-3 text-right">Jami summa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.topDishes.map((dish, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-gray-900">{dish.name}</td>
                      <td className="py-3 px-3 text-gray-500">{dish.category || "Oshxona"}</td>
                      <td className="py-3 px-3 text-center font-bold text-blue-600 font-mono">{dish.count} dona</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 font-mono">{dish.total.toLocaleString()} so'm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
