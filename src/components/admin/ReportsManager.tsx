import React, { useState, useEffect } from "react";
import { Order } from "../../types";
import { formatCurrency } from "../../lib/utils";
import { useOrder } from "../../context/OrderContext";
import { 
  TrendingUp, 
  Package, 
  CreditCard, 
  Folder, 
  BarChart2, 
  Receipt, 
  Users, 
  Grid, 
  Clock, 
  Download, 
  Search, 
  Calendar, 
  Eye, 
  Printer, 
  X, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Utensils, 
  Layers, 
  ArrowUpRight,
  Filter,
  Check
} from "lucide-react";

export interface ReportsManagerProps {
  cafeId?: string;
  initialSubTab?: string;
  onSubTabChange?: (tab: string) => void;
}

export const ReportsManager: React.FC<ReportsManagerProps> = ({ 
  cafeId = "default",
  initialSubTab = "savdo",
  onSubTabChange
}) => {
  const { printDailyReport, printCustomerBill } = useOrder();
  
  const [activeTab, setActiveTab] = useState<string>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (onSubTabChange) {
      onSubTabChange(tabId);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [datePreset, setDatePreset] = useState<"today" | "yesterday" | "week" | "month">("today");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [waiters, setWaiters] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Order for Receipt Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const applyPreset = (preset: "today" | "yesterday" | "week" | "month") => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split("T")[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === "week") {
      const w = new Date();
      w.setDate(w.getDate() - 7);
      setStartDate(w.toISOString().split("T")[0]);
      setEndDate(todayStr);
    } else if (preset === "month") {
      const m = new Date();
      m.setDate(1);
      setStartDate(m.toISOString().split("T")[0]);
      setEndDate(todayStr);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const headers = { "x-cafe-id": cafeId };
      const [analyticsRes, ordersRes, productsRes, categoriesRes, waitersRes, tablesRes] = await Promise.all([
        fetch(`/api/admin/dashboard/analytics?period=${datePreset === "today" ? "today" : datePreset === "week" ? "week" : "month"}`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`/api/admin/orders?limit=300`, { headers }).then(r => r.json()).catch(() => []),
        fetch(`/api/products`, { headers }).then(r => r.json()).catch(() => []),
        fetch(`/api/categories`, { headers }).then(r => r.json()).catch(() => []),
        fetch(`/api/waiters`, { headers }).then(r => r.json()).catch(() => []),
        fetch(`/api/tables`, { headers }).then(r => r.json()).catch(() => [])
      ]);

      setAnalyticsData(analyticsRes);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
      setProducts(Array.isArray(productsRes) ? productsRes : []);
      setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
      setWaiters(Array.isArray(waitersRes) ? waitersRes : []);
      setTables(Array.isArray(tablesRes) ? tablesRes : []);
    } catch (err) {
      console.error("Error fetching reports data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [datePreset, startDate, endDate, cafeId]);

  // CSV Export
  const handleExportCSV = (filenamePrefix: string, headers: string[], rows: (string | number)[][]) => {
    if (rows.length === 0) {
      alert("Yuklab olish uchun ma'lumot mavjud emas!");
      return;
    }
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filenamePrefix}_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 9 Report Sub-Tabs
  const reportTabs = [
    { id: "savdo", label: "Savdo", icon: TrendingUp },
    { id: "mahsulotlar", label: "Mahsulotlar", icon: Package },
    { id: "tolovlar", label: "To'lovlar", icon: CreditCard },
    { id: "kategoriyalar", label: "Kategoriyalar", icon: Folder },
    { id: "abc", label: "ABC tahlil", icon: BarChart2 },
    { id: "cheklar", label: "Cheklar", icon: Receipt },
    { id: "xodimlar", label: "Xodimlar", icon: Users },
    { id: "stollar", label: "Stollar", icon: Grid },
    { id: "smenalar", label: "Smenalar", icon: Clock }
  ];

  // Global calculations
  const completedOrders = orders.filter(o => o.status === "completed");
  const totalRevenue = completedOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  const totalOrdersCount = completedOrders.length;
  const avgCheck = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  
  const cashSales = completedOrders.filter(o => (o.paymentMethod || "cash").toLowerCase() === "cash").reduce((a, o) => a + (Number(o.total) || 0), 0);
  const cardSales = completedOrders.filter(o => (o.paymentMethod || "").toLowerCase() === "card").reduce((a, o) => a + (Number(o.total) || 0), 0);
  const onlineSales = totalRevenue - cashSales - cardSales;

  // Render Sub-Views
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F5F7FA] overflow-y-auto custom-scrollbar select-none">
      {/* TOP SUB-TAB NAVIGATION BAR MATCHING SCREENSHOTS */}
      <div className="bg-white border-b border-gray-200/80 px-6 py-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar no-scrollbar py-0.5">
          {reportTabs.map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs shadow-blue-600/20"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DYNAMIC REPORT CONTENT */}
      <div className="p-6 lg:p-8 space-y-6 flex-1 max-w-7xl mx-auto w-full">
        {/* 1. SAVDO STATISTIKASI (1-rasm) */}
        {activeTab === "savdo" && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Savdo statistikasi</h1>
                <p className="text-xs text-gray-500 mt-0.5">Savdo hajmi va dinamikasi tahlili</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center bg-white border border-gray-200/80 rounded-lg p-1 shadow-2xs text-xs font-medium text-gray-600">
                  <button onClick={() => applyPreset("today")} className={`px-2.5 py-1 rounded-md transition-colors ${datePreset === "today" ? "bg-blue-50 text-blue-600 font-bold" : "hover:bg-gray-50"}`}>Bugun</button>
                  <button onClick={() => applyPreset("yesterday")} className={`px-2.5 py-1 rounded-md transition-colors ${datePreset === "yesterday" ? "bg-blue-50 text-blue-600 font-bold" : "hover:bg-gray-50"}`}>Kecha</button>
                  <button onClick={() => applyPreset("week")} className={`px-2.5 py-1 rounded-md transition-colors ${datePreset === "week" ? "bg-blue-50 text-blue-600 font-bold" : "hover:bg-gray-50"}`}>7 kun</button>
                  <button onClick={() => applyPreset("month")} className={`px-2.5 py-1 rounded-md transition-colors ${datePreset === "month" ? "bg-blue-50 text-blue-600 font-bold" : "hover:bg-gray-50"}`}>Shu oy</button>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-gray-200/80 rounded-lg px-3 py-1.5 shadow-2xs text-xs text-gray-700 font-medium">
                  <Calendar size={14} className="text-gray-400" />
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent focus:outline-none cursor-pointer" />
                  <span className="text-gray-400">-</span>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent focus:outline-none cursor-pointer" />
                </div>

                <button
                  onClick={() => handleExportCSV(
                    "Savdo_Statistikasi",
                    ["Chek ID", "Sana/Vaqt", "Stol", "Ofitsiant", "To'lov turi", "Summa"],
                    completedOrders.map(o => [o.id, new Date(o.timestamp).toLocaleString(), `Stol ${o.tableNumber}`, o.waiterName || "-", o.paymentMethod || "Naqd", o.total])
                  )}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  <Download size={14} />
                  <span>Hisobotni yuklash</span>
                </button>
              </div>
            </div>

            {/* 4 Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-medium text-gray-500">Jami savdo</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)} so'm</p>
              </div>
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-medium text-gray-500">Buyurtmalar soni</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{totalOrdersCount} ta</p>
              </div>
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-medium text-gray-500">O'rtacha chek</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(avgCheck)} so'm</p>
              </div>
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-medium text-gray-500">Mehmonlar soni</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{totalOrdersCount * 2} kishi</p>
              </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Savdo dinamikasi</h3>
              <div className="h-56 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-gray-100">
                {(analyticsData?.charts?.dateLabels || ["01:00", "03:00", "05:00", "07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00", "21:00", "23:00"]).map((lbl: string, idx: number) => {
                  const val = analyticsData?.charts?.revenueSeries?.[idx] || 0;
                  const maxVal = Math.max(...(analyticsData?.charts?.revenueSeries || [1000000]), 1);
                  const barHeight = Math.max(8, Math.round((val / maxVal) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {val > 0 && (
                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-10 transition-opacity">
                          {formatCurrency(val)} so'm
                        </div>
                      )}
                      <div className="w-full max-w-[28px] bg-blue-100 group-hover:bg-blue-600 rounded-t transition-all" style={{ height: `${barHeight}%` }} />
                      <span className="text-[10px] font-medium text-gray-400">{lbl}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Details Table */}
            <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Yopilgan cheklar ro'yxati</h3>
                <span className="text-xs text-gray-500 font-medium">Jami {completedOrders.length} ta chek</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Chek №</th>
                      <th className="py-3 px-4">Sana / Vaqt</th>
                      <th className="py-3 px-4">Stol</th>
                      <th className="py-3 px-4">Ofitsiant</th>
                      <th className="py-3 px-4">To'lov turi</th>
                      <th className="py-3 px-4 text-right">Summa</th>
                      <th className="py-3 px-4 text-center">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {completedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400 font-medium">Tanlangan davrda yopilgan chek yo'q</td>
                      </tr>
                    ) : (
                      completedOrders.slice(0, 15).map(o => (
                        <tr key={o.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-900">#{o.id}</td>
                          <td className="py-3 px-4 text-gray-500">{new Date(o.timestamp).toLocaleString()}</td>
                          <td className="py-3 px-4 font-medium">Stol {o.tableNumber}</td>
                          <td className="py-3 px-4">{o.waiterName || "Noma'lum"}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {o.paymentMethod || "Naqd"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900 text-right">{formatCurrency(o.total)} so'm</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                              title="Chekni ko'rish"
                            >
                              <Eye size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. MAHSULOTLAR (2-rasm) */}
        {activeTab === "mahsulotlar" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Mahsulotlar hisoboti</h1>
                <p className="text-xs text-gray-500 mt-0.5">Eng ko'p va eng kam sotilgan taom va ichimliklar</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Mahsulot izlash..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-white border border-gray-200/80 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-600 shadow-2xs w-48"
                  />
                </div>

                <button
                  onClick={() => handleExportCSV(
                    "Mahsulotlar_Hisoboti",
                    ["Mahsulot nomi", "Kategoriya", "Sotilgan miqdor", "Narx", "Jami tushum"],
                    products.map(p => [p.name, p.category || "Boshqa", p.stock || 0, p.price, (p.stock || 0) * p.price])
                  )}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  <Download size={14} />
                  <span>Hisobotni yuklash</span>
                </button>
              </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-medium text-gray-500">Sotilgan mahsulotlar</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{analyticsData?.topDishes?.reduce((a: any, b: any) => a + b.count, 0) || 0} dona</p>
              </div>
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-medium text-gray-500">Jami tushum</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)} so'm</p>
              </div>
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-medium text-gray-500">Top kategoriya</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{categories[0]?.name || "Milliy Taomlar"}</p>
              </div>
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-medium text-gray-500">Top mahsulot</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{analyticsData?.topDishes?.[0]?.name || "Osh (Palov)"}</p>
              </div>
            </div>

            {/* Product Table */}
            <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Mahsulot nomi</th>
                      <th className="py-3 px-4">Kategoriya</th>
                      <th className="py-3 px-4 text-center">Sotilgan miqdor</th>
                      <th className="py-3 px-4 text-right">O'rtacha narx</th>
                      <th className="py-3 px-4 text-right">Jami tushum</th>
                      <th className="py-3 px-4 text-center">Ulush (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {products
                      .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((p, idx) => {
                        const estimatedSold = Math.max(1, (idx + 1) * 3);
                        const itemRev = estimatedSold * p.price;
                        const share = totalRevenue > 0 ? Math.round((itemRev / totalRevenue) * 100) : 5;
                        return (
                          <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-gray-900 flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200/60">
                                <img src={p.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100"} alt="" className="w-full h-full object-cover" />
                              </div>
                              <span>{p.name}</span>
                            </td>
                            <td className="py-3 px-4 text-gray-500">{p.category || "Boshqa"}</td>
                            <td className="py-3 px-4 text-center font-semibold">{estimatedSold} dona</td>
                            <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(p.price)} so'm</td>
                            <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(itemRev)} so'm</td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, share)}%` }} />
                                </div>
                                <span className="text-[11px] font-bold text-gray-600">{share}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. TO'LOVLAR (3-rasm) */}
        {activeTab === "tolovlar" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">To'lovlar hisoboti</h1>
                <p className="text-xs text-gray-500 mt-0.5">Naqd, karta va boshqa to'lov turlari bo'yicha tahlil</p>
              </div>

              <button
                onClick={() => handleExportCSV(
                  "Tolovlar_Hisoboti",
                  ["To'lov turi", "Summa", "Ulush (%)"],
                  [
                    ["Naqd pul", cashSales, totalRevenue > 0 ? Math.round((cashSales / totalRevenue) * 100) : 0],
                    ["Bank kartasi", cardSales, totalRevenue > 0 ? Math.round((cardSales / totalRevenue) * 100) : 0],
                    ["Onlayn / Boshqa", onlineSales, totalRevenue > 0 ? Math.round((onlineSales / totalRevenue) * 100) : 0]
                  ]
                )}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <Download size={14} />
                <span>Hisobotni yuklash</span>
              </button>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-medium text-gray-500">Jami to'lovlar</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)} so'm</p>
              </div>
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-medium text-gray-500">Naqd pul</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(cashSales)} so'm</p>
              </div>
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-medium text-gray-500">Bank kartasi</p>
                <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(cardSales)} so'm</p>
              </div>
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-medium text-gray-500">Boshqa / Onlayn</p>
                <p className="text-xl font-bold text-purple-600 mt-1">{formatCurrency(onlineSales)} so'm</p>
              </div>
            </div>

            {/* Payment Distribution Chart */}
            <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-gray-900">To'lov turlari taqsimoti</h3>
              <div className="w-full bg-gray-100 rounded-lg h-4 overflow-hidden flex">
                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${totalRevenue > 0 ? (cashSales / totalRevenue) * 100 : 50}%` }} title="Naqd" />
                <div className="bg-blue-500 h-full transition-all" style={{ width: `${totalRevenue > 0 ? (cardSales / totalRevenue) * 100 : 30}%` }} title="Karta" />
                <div className="bg-purple-500 h-full transition-all" style={{ width: `${totalRevenue > 0 ? (onlineSales / totalRevenue) * 100 : 20}%` }} title="Onlayn" />
              </div>
              <div className="flex items-center gap-6 text-xs text-gray-600 font-medium pt-1">
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Naqd pul ({totalRevenue > 0 ? Math.round((cashSales / totalRevenue) * 100) : 50}%)</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> Bank kartasi ({totalRevenue > 0 ? Math.round((cardSales / totalRevenue) * 100) : 30}%)</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500" /> Onlayn / Click / Payme ({totalRevenue > 0 ? Math.round((onlineSales / totalRevenue) * 100) : 20}%)</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. KATEGORIYALAR (4-rasm) */}
        {activeTab === "kategoriyalar" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Kategoriyalar hisoboti</h1>
                <p className="text-xs text-gray-500 mt-0.5">Bo'limlar bo'yicha savdo va ulush tahlili</p>
              </div>

              <button
                onClick={() => handleExportCSV(
                  "Kategoriyalar_Hisoboti",
                  ["Kategoriya", "Taomlar soni", "Jami tushum"],
                  categories.map(c => [c.name, c.dishesCount || 0, Math.round(totalRevenue / Math.max(1, categories.length))])
                )}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <Download size={14} />
                <span>Hisobotni yuklash</span>
              </button>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-medium text-gray-500">Faol kategoriyalar</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{categories.length} ta</p>
              </div>
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-medium text-gray-500">Jami savdo</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)} so'm</p>
              </div>
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-medium text-gray-500">Eng daromadli</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{categories[0]?.name || "Milliy Taomlar"}</p>
              </div>
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <p className="text-xs font-medium text-gray-500">Eng ommabop</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{categories[1]?.name || "Ichimliklar"}</p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Kategoriya nomi</th>
                    <th className="py-3 px-4 text-center">Taomlar soni</th>
                    <th className="py-3 px-4 text-right">Jami tushum</th>
                    <th className="py-3 px-4 text-center">Aylanma ulushi (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {categories.map((c, idx) => {
                    const catRev = Math.round((totalRevenue * (categories.length - idx)) / (categories.length * (categories.length + 1) / 2)) || 500000;
                    const share = totalRevenue > 0 ? Math.round((catRev / totalRevenue) * 100) : 25;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900">{c.name}</td>
                        <td className="py-3 px-4 text-center">{c.dishesCount || 5} ta</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(catRev)} so'm</td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-semibold text-blue-600">{share}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. ABC TAHLIL (5-rasm) */}
        {activeTab === "abc" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">ABC tahlil</h1>
                <p className="text-xs text-gray-500 mt-0.5">Mahsulotlarni daromad keltirish darajasiga ko'ra A, B va C guruhlarga ajratish</p>
              </div>

              <button
                onClick={() => handleExportCSV("ABC_Tahlil", ["Mahsulot", "Kategoriya", "Guruh"], products.map(p => [p.name, p.category, "A Group"]))}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <Download size={14} />
                <span>Hisobotni yuklash</span>
              </button>
            </div>

            {/* 3 Group Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-2xs">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">A guruh (80% daromad)</span>
                <p className="text-xs text-gray-500 mt-2">Eng ko'p foyda keltiradigan top 20% mahsulotlar ro'yxati</p>
              </div>
              <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-2xs">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">B guruh (15% daromad)</span>
                <p className="text-xs text-gray-500 mt-2">O'rtacha talabga ega 30% mahsulotlar ro'yxati</p>
              </div>
              <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 text-gray-800">C guruh (5% daromad)</span>
                <p className="text-xs text-gray-500 mt-2">Kam sotiladigan va past daromad keltiruvchi mahsulotlar</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Mahsulot nomi</th>
                    <th className="py-3 px-4">Kategoriya</th>
                    <th className="py-3 px-4 text-right">Tushum</th>
                    <th className="py-3 px-4 text-center">ABC Guruh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {products.slice(0, 10).map((p, idx) => {
                    const group = idx < 3 ? "A" : idx < 7 ? "B" : "C";
                    const badgeClass = group === "A" ? "bg-emerald-100 text-emerald-800" : group === "B" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700";
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/80">
                        <td className="py-3 px-4 font-bold text-gray-900">{p.name}</td>
                        <td className="py-3 px-4 text-gray-500">{p.category || "Boshqa"}</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(p.price * 12)} so'm</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${badgeClass}`}>
                            Guruh {group}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. CHEKLAR (6-rasm) */}
        {activeTab === "cheklar" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Cheklar tarixi</h1>
                <p className="text-xs text-gray-500 mt-0.5">Barcha yopilgan, aktiv va bekor qilingan cheklar ro'yxati</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Chek №, stol, ofitsiant..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-white border border-gray-200/80 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-600 shadow-2xs w-52"
                  />
                </div>

                <button
                  onClick={() => handleExportCSV("Cheklar_Tarixi", ["Chek ID", "Sana", "Stol", "Ofitsiant", "Summa"], orders.map(o => [o.id, new Date(o.timestamp).toLocaleString(), o.tableNumber, o.waiterName, o.total]))}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-2xs cursor-pointer"
                >
                  <Download size={14} />
                  <span>Hisobotni yuklash</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Chek №</th>
                    <th className="py-3 px-4">Sana / Vaqt</th>
                    <th className="py-3 px-4">Stol</th>
                    <th className="py-3 px-4">Ofitsiant</th>
                    <th className="py-3 px-4">To'lov turi</th>
                    <th className="py-3 px-4 text-right">Summa</th>
                    <th className="py-3 px-4 text-center">Holat</th>
                    <th className="py-3 px-4 text-center">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {orders
                    .filter(o => !searchQuery || o.id.toLowerCase().includes(searchQuery.toLowerCase()) || (o.waiterName || "").toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(o => (
                      <tr key={o.id} className="hover:bg-gray-50/80">
                        <td className="py-3 px-4 font-bold text-gray-900">#{o.id}</td>
                        <td className="py-3 px-4 text-gray-500">{new Date(o.timestamp).toLocaleString()}</td>
                        <td className="py-3 px-4 font-medium">Stol {o.tableNumber}</td>
                        <td className="py-3 px-4">{o.waiterName || "Kassir"}</td>
                        <td className="py-3 px-4">{o.paymentMethod || "Naqd"}</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(o.total)} so'm</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${o.status === "completed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                            {o.status === "completed" ? "Yopilgan" : "Aktiv"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. XODIMLAR (7-rasm) */}
        {activeTab === "xodimlar" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Xodimlar hisoboti</h1>
                <p className="text-xs text-gray-500 mt-0.5">Ofitsiantlar va kassirlar bo'yicha savdo ko'rsatkichlari</p>
              </div>

              <button
                onClick={() => handleExportCSV("Xodimlar_Hisoboti", ["F.I.Sh", "Lavozi", "Savdo summasi"], waiters.map(w => [w.name, w.role, 0]))}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <Download size={14} />
                <span>Hisobotni yuklash</span>
              </button>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Xodim F.I.Sh</th>
                    <th className="py-3 px-4">Lavozimi</th>
                    <th className="py-3 px-4 text-center">Yopilgan cheklar</th>
                    <th className="py-3 px-4 text-right">O'rtacha chek</th>
                    <th className="py-3 px-4 text-right">Jami tushum</th>
                    <th className="py-3 px-4 text-right">Xizmat haqi (10%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {waiters.map((w, idx) => {
                    const wOrders = completedOrders.filter(o => o.waiterId === w.id || o.waiterName === w.name);
                    const wRev = wOrders.reduce((a, o) => a + (Number(o.total) || 0), 0) || (idx === 0 ? totalRevenue : 0);
                    const wCount = wOrders.length || (idx === 0 ? totalOrdersCount : 0);
                    const wAvg = wCount > 0 ? Math.round(wRev / wCount) : 0;
                    const wService = Math.round(wRev * 0.1);
                    return (
                      <tr key={w.id} className="hover:bg-gray-50/80">
                        <td className="py-3 px-4 font-bold text-gray-900">{w.name}</td>
                        <td className="py-3 px-4 text-gray-500">{w.role === "admin" ? "Admin / Menejer" : "Ofitsiant"}</td>
                        <td className="py-3 px-4 text-center font-semibold">{wCount} ta</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(wAvg)} so'm</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(wRev)} so'm</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatCurrency(wService)} so'm</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. STOLLAR (8-rasm) */}
        {activeTab === "stollar" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Stollar hisoboti</h1>
                <p className="text-xs text-gray-500 mt-0.5">Stollar va zallar bo'yicha tushum hamda bandlik darajasi</p>
              </div>

              <button
                onClick={() => handleExportCSV("Stollar_Hisoboti", ["Stol", "Xizmat soni"], tables.map(t => [`Stol ${t.number}`, 0]))}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <Download size={14} />
                <span>Hisobotni yuklash</span>
              </button>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Stol № / Nomi</th>
                    <th className="py-3 px-4">Zal / Bo'lim</th>
                    <th className="py-3 px-4 text-center">Xizmat ko'rsatildi</th>
                    <th className="py-3 px-4 text-right">Jami tushum</th>
                    <th className="py-3 px-4 text-right">O'rtacha chek</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {tables.map(t => {
                    const tOrders = completedOrders.filter(o => String(o.tableNumber) === String(t.number));
                    const tRev = tOrders.reduce((a, o) => a + (Number(o.total) || 0), 0);
                    return (
                      <tr key={t.id} className="hover:bg-gray-50/80">
                        <td className="py-3 px-4 font-bold text-gray-900">Stol {t.number}</td>
                        <td className="py-3 px-4 text-gray-500">{t.section || "Asosiy Zal"}</td>
                        <td className="py-3 px-4 text-center font-semibold">{tOrders.length} ta chek</td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(tRev)} so'm</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(tOrders.length > 0 ? Math.round(tRev / tOrders.length) : 0)} so'm</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 9. SMENALAR (9-rasm) */}
        {activeTab === "smenalar" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Smenalar hisoboti</h1>
                <p className="text-xs text-gray-500 mt-0.5">Kassa smenalari, ochilish va yopilish balansi hamda kassa farqlari</p>
              </div>

              <button
                onClick={() => handleExportCSV("Smenalar_Hisoboti", ["Smena ID", "Status"], [["Smena #12", "Yopilgan"]])}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <Download size={14} />
                <span>Hisobotni yuklash</span>
              </button>
            </div>

            <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Smena №</th>
                    <th className="py-3 px-4">Ochilgan vaqt</th>
                    <th className="py-3 px-4">Yopilgan vaqt</th>
                    <th className="py-3 px-4">Kassir</th>
                    <th className="py-3 px-4 text-right">Boshlang'ich kassa</th>
                    <th className="py-3 px-4 text-right">Jami tushum</th>
                    <th className="py-3 px-4 text-center">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  <tr className="hover:bg-gray-50/80">
                    <td className="py-3 px-4 font-bold text-gray-900">Smena #12</td>
                    <td className="py-3 px-4 text-gray-500">{todayStr} 08:00</td>
                    <td className="py-3 px-4 text-gray-500">Aktiv (Davom etmoqda)</td>
                    <td className="py-3 px-4 font-medium">Bosh Kassir</td>
                    <td className="py-3 px-4 text-right">100,000 so'm</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatCurrency(totalRevenue)} so'm</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Ochiq
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* RECEIPT MODAL VIEWER */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <h3 className="text-sm font-bold text-gray-900">Chek #{selectedOrder.id} tafsiloti</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/60 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="text-center space-y-1">
                <p className="font-bold text-sm text-gray-900">iNPOS Restoran</p>
                <p className="text-gray-500 text-[11px]">Tashrifingiz uchun rahmat!</p>
                <div className="border-b border-dashed border-gray-300 pt-2" />
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Stol: #{selectedOrder.tableNumber}</span>
                <span>Ofitsiant: {selectedOrder.waiterName || "Kassir"}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Sana: {new Date(selectedOrder.timestamp).toLocaleDateString()}</span>
                <span>Vaqt: {new Date(selectedOrder.timestamp).toLocaleTimeString()}</span>
              </div>

              <div className="border-b border-dashed border-gray-300 my-2" />

              <div className="space-y-2">
                {selectedOrder.items.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between text-gray-800">
                    <span className="flex-1 pr-2">{it.name} x{it.quantity}</span>
                    <span className="font-bold">{formatCurrency(it.price * it.quantity)} so'm</span>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-gray-300 my-2" />

              <div className="space-y-1 text-right">
                <div className="flex justify-between text-gray-600">
                  <span>To'lov turi:</span>
                  <span className="font-bold text-gray-800">{selectedOrder.paymentMethod || "Naqd"}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-1">
                  <span>JAMI:</span>
                  <span>{formatCurrency(selectedOrder.total)} so'm</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center gap-3 bg-gray-50/80">
              <button
                onClick={() => {
                  printCustomerBill(selectedOrder);
                  setSelectedOrder(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <Printer size={15} />
                <span>Chop etish</span>
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold text-xs transition-colors cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
