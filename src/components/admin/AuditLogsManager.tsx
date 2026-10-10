import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Search, 
  RefreshCw, 
  Filter, 
  AlertTriangle, 
  Trash2, 
  LogIn, 
  Users, 
  UserX, 
  ShoppingBag, 
  Clock, 
  Calendar, 
  CheckCircle, 
  Download,
  AlertOctagon,
  Info,
  DollarSign,
  Coffee
} from "lucide-react";

export interface AuditLogItem {
  id: string;
  actionType: string;
  actionTitle: string;
  userName: string;
  userRole?: string;
  details?: string;
  targetId?: string;
  severity: "info" | "warning" | "danger" | string;
  cafeId?: string;
  timestamp: string;
}

interface AuditLogsManagerProps {
  cafeId?: string;
}

export const AuditLogsManager: React.FC<AuditLogsManagerProps> = ({ cafeId = "default" }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (activeFilter !== "all") queryParams.set("actionType", activeFilter);
      if (search.trim()) queryParams.set("search", search.trim());

      const res = await fetch(`/api/audit-logs?${queryParams.toString()}`, {
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [cafeId, activeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  // Filter by severity client-side if selected
  const filteredLogs = logs.filter((log) => {
    if (severityFilter === "all") return true;
    return log.severity === severityFilter;
  });

  // Calculate statistics
  const totalCount = logs.length;
  const deletedOrdersCount = logs.filter((l) => l.actionType === "order_delete" || l.actionType === "order_item_cancel").length;
  const loginsCount = logs.filter((l) => l.actionType === "login").length;
  const dangerCount = logs.filter((l) => l.severity === "danger").length;

  const getActionBadge = (type: string, severity: string) => {
    switch (type) {
      case "order_delete":
        return {
          icon: Trash2,
          color: "bg-red-50 text-red-700 border-red-200",
          iconColor: "text-red-600",
          label: "Buyurtma o'chirildi / bekor"
        };
      case "order_item_cancel":
        return {
          icon: AlertTriangle,
          color: "bg-amber-50 text-amber-700 border-amber-200",
          iconColor: "text-amber-600",
          label: "Chekdan taom o'chirildi"
        };
      case "login":
        return {
          icon: LogIn,
          color: "bg-blue-50 text-blue-700 border-blue-200",
          iconColor: "text-blue-600",
          label: "Tizimga kirish"
        };
      case "client_delete":
        return {
          icon: UserX,
          color: "bg-orange-50 text-orange-700 border-orange-200",
          iconColor: "text-orange-600",
          label: "Mijoz o'chirildi"
        };
      case "employee_delete":
        return {
          icon: Users,
          color: "bg-rose-50 text-rose-700 border-rose-200",
          iconColor: "text-rose-600",
          label: "Xodim o'chirildi"
        };
      case "shift_open":
      case "shift_close":
        return {
          icon: Clock,
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          iconColor: "text-emerald-600",
          label: "Smena amali"
        };
      default:
        return {
          icon: Info,
          color: "bg-gray-50 text-gray-700 border-gray-200",
          iconColor: "text-gray-500",
          label: "Tizim amali"
        };
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "danger":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
            <AlertOctagon size={11} className="text-red-600" />
            <span>Xavfli</span>
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle size={11} className="text-amber-600" />
            <span>Ogohlantirish</span>
          </span>
        );
      case "info":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Info size={11} className="text-blue-500" />
            <span>Oddiy</span>
          </span>
        );
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Vaqt", "Amal", "Foydalanuvchi", "Roli", "Tafsilot", "Daraja"];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.actionTitle,
      l.userName,
      l.userRole || "",
      `"${(l.details || "").replace(/"/g, '""')}"`,
      l.severity
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_log_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] p-6 lg:p-8 overflow-y-auto custom-scrollbar select-none text-[#1E293B]">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert size={22} className="text-red-600" />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Audit loglar & Tizim xavfsizligi
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Tizimga barcha kirishlar, buyurtmalarni o'chirish / bekor qilish holati, chekdan taomlarni qaytarish va xodimlar harakatlari
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLogs}
            className="p-2 rounded-lg bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Yangilash"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-blue-600" : ""} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Download size={15} />
            <span>Eksport (CSV)</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Jami qaydlar
          </div>
          <div className="text-2xl font-black text-gray-900">{totalCount}</div>
          <div className="text-[10px] text-gray-400 mt-1">Barcha amallar jurnali</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200/60 shadow-2xs bg-red-50/20">
          <div className="text-[11px] font-semibold text-red-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Trash2 size={13} />
            <span>Bekor qilingan buyurtmalar</span>
          </div>
          <div className="text-2xl font-black text-red-600">{deletedOrdersCount}</div>
          <div className="text-[10px] text-gray-500 mt-1">O'chirilgan cheklar & taomlar</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200/60 shadow-2xs bg-blue-50/20">
          <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <LogIn size={13} />
            <span>Tizimga kirishlar</span>
          </div>
          <div className="text-2xl font-black text-blue-600">{loginsCount}</div>
          <div className="text-[10px] text-gray-500 mt-1">Admin & ofitsiant kirishlari</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200/60 shadow-2xs bg-amber-50/20">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
            <AlertOctagon size={13} />
            <span>Diqqat talab amallar</span>
          </div>
          <div className="text-2xl font-black text-amber-600">{dangerCount}</div>
          <div className="text-[10px] text-gray-500 mt-1">O'chirish va bekor qilishlar</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs p-4 mb-6 space-y-3">
        {/* Top bar: Search + Severity */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[260px] max-w-md">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidiruv (Foydalanuvchi, amal, stol raqami yoki izoh)..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-blue-600 font-medium"
            />
          </form>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">Xavf darajasi:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-600"
            >
              <option value="all">Barcha darajalar</option>
              <option value="danger">Faqat xavflilar (Danger)</option>
              <option value="warning">Ogohlantirishlar (Warning)</option>
              <option value="info">Oddiy axborotlar (Info)</option>
            </select>
          </div>
        </div>

        {/* Action Type Filters Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          {[
            { id: "all", label: "Barchasi" },
            { id: "order_delete", label: "Buyurtma o'chirilishi" },
            { id: "order_item_cancel", label: "Taom bekor qilinishi" },
            { id: "login", label: "Kirishlar (Logins)" },
            { id: "client_delete", label: "Mijoz o'chirilishi" },
            { id: "employee_delete", label: "Xodim o'chirilishi" },
            { id: "shift_open", label: "Smena amallari" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                activeFilter === tab.id
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">SANA VA VAQT</th>
                <th className="py-3 px-4">AMAL TURI</th>
                <th className="py-3 px-4">FOYDALANUVCHI / XODIM</th>
                <th className="py-3 px-4">TAFSILOTLAR / IZOH</th>
                <th className="py-3 px-4">XAVF DARAJASI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loglar yuklanmoqda...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    Mos keluvchi audit loglari topilmadi.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getActionBadge(log.actionType, log.severity);
                  const BadgeIcon = badge.icon;

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-gray-400" />
                          <span>{log.timestamp}</span>
                        </div>
                      </td>

                      {/* Action Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.color}`}>
                          <BadgeIcon size={13} className={badge.iconColor} />
                          <span>{log.actionTitle}</span>
                        </span>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{log.userName}</div>
                        <div className="text-[10px] text-gray-500 uppercase">{log.userRole || "xodim"}</div>
                      </td>

                      {/* Details / Explanation */}
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="text-xs text-gray-800 font-medium leading-relaxed">
                          {log.details || "-"}
                        </p>
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getSeverityBadge(log.severity)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
