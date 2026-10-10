import React, { useState, useEffect } from "react";
import { Table } from "../../types";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  RefreshCw, 
  Users, 
  LayoutGrid, 
  UserCheck, 
  AlertCircle,
  Building,
  Percent,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { DeleteConfirmationModal } from "../common/DeleteConfirmationModal";
import { saveOfflineMutation } from "../../utils/offlineSync";

interface Hall {
  id: string;
  name: string;
  servicePercent: number;
  status: "active" | "inactive" | string;
}

interface TablesManagerProps {
  cafeId?: string;
}

export const TablesManager: React.FC<TablesManagerProps> = ({ cafeId = "default" }) => {
  // States
  const [halls, setHalls] = useState<Hall[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHall, setSelectedHall] = useState<string>("all");

  // Add/Edit Hall Modal state
  const [isHallModalOpen, setIsHallModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);
  const [hallName, setHallName] = useState("");
  const [hallServicePercent, setHallServicePercent] = useState("10");
  const [hallStatus, setHallStatus] = useState<"active" | "inactive">("active");
  const [isSavingHall, setIsSavingHall] = useState(false);
  const [hallModalError, setHallModalError] = useState("");

  // Add/Edit Table Modal state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [tableCapacity, setTableCapacity] = useState("4");
  const [tableHall, setTableHall] = useState("Asosiy zal");
  const [isSavingTable, setIsSavingTable] = useState(false);
  const [tableModalError, setTableModalError] = useState("");

  // Fetch Halls & Tables
  const fetchData = async () => {
    setLoading(true);
    try {
      const [hallsRes, tablesRes] = await Promise.all([
        fetch("/api/halls", { headers: { "x-cafe-id": cafeId } }),
        fetch("/api/tables", { headers: { "x-cafe-id": cafeId } })
      ]);

      if (hallsRes.ok) {
        const hData = await hallsRes.json();
        setHalls(hData);
      }
      if (tablesRes.ok) {
        const tData = await tablesRes.json();
        setTables(tData);
      }
    } catch (e) {
      console.error("Fetch halls/tables error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cafeId]);

  // ------------ HALL HANDLERS ------------
  const handleOpenAddHallModal = () => {
    setEditingHall(null);
    setHallName("");
    setHallServicePercent("10");
    setHallStatus("active");
    setHallModalError("");
    setIsHallModalOpen(true);
  };

  const handleOpenEditHallModal = (h: Hall) => {
    setEditingHall(h);
    setHallName(h.name);
    setHallServicePercent(String(h.servicePercent ?? 10));
    setHallStatus(h.status === "inactive" ? "inactive" : "active");
    setHallModalError("");
    setIsHallModalOpen(true);
  };

  const handleSaveHall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hallName.trim()) {
      setHallModalError("Zal nomini kiriting");
      return;
    }

    setIsSavingHall(true);
    setHallModalError("");

    const hallId = editingHall ? editingHall.id : `hall-${Date.now()}`;
    const payload = {
      id: hallId,
      name: hallName.trim(),
      servicePercent: Number(hallServicePercent) || 0,
      status: hallStatus
    };

    // 1. Optimistic state update
    setHalls(prev => {
      const idx = prev.findIndex(h => h.id === hallId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = payload;
        return copy;
      }
      return [...prev, payload];
    });

    try {
      const stored = JSON.parse(localStorage.getItem("inpos_halls") || "[]");
      const filtered = stored.filter((h: any) => h.id !== hallId);
      localStorage.setItem("inpos_halls", JSON.stringify([...filtered, payload]));
    } catch (e) {}

    setIsHallModalOpen(false);
    setIsSavingHall(false);

    // 2. Queue offline mutation / background sync
    saveOfflineMutation("hall" as any, "upsert", hallId, payload);

    try {
      const url = editingHall ? `/api/halls/${editingHall.id}` : "/api/halls";
      const method = editingHall ? "PUT" : "POST";
      fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
        body: JSON.stringify(payload)
      }).then(() => fetchData()).catch(console.warn);
    } catch (err) {
      console.warn("Hall saved locally in offline queue:", err);
    }
  };

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "hall" | "table";
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: "hall",
    id: "",
    name: ""
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteHall = (h: Hall) => {
    setDeleteModal({
      isOpen: true,
      type: "hall",
      id: h.id,
      name: h.name
    });
  };

  const openDeleteTable = (t: Table) => {
    setDeleteModal({
      isOpen: true,
      type: "table",
      id: t.id,
      name: `Stol ${t.number}`
    });
  };

  const handleExecuteDelete = async () => {
    if (!deleteModal.id) return;
    const targetId = deleteModal.id;
    const type = deleteModal.type;
    setDeleteModal({ isOpen: false, type: "hall", id: "", name: "" });
    setIsDeleting(false);

    if (type === "hall") {
      setHalls(prev => prev.filter(h => h.id !== targetId));
      try {
        const stored = JSON.parse(localStorage.getItem("inpos_halls") || "[]");
        localStorage.setItem("inpos_halls", JSON.stringify(stored.filter((h: any) => h.id !== targetId)));
      } catch (e) {}

      saveOfflineMutation("hall" as any, "delete", targetId);

      try {
        fetch(`/api/halls/${targetId}`, {
          method: "DELETE",
          headers: { "x-cafe-id": cafeId }
        }).then(() => fetchData()).catch(console.warn);
      } catch (e) {
        console.error(e);
      }
    } else {
      setTables(prev => prev.filter(t => t.id !== targetId));
      try {
        const stored = JSON.parse(localStorage.getItem("inpos_offline_tables_cache") || "[]");
        localStorage.setItem("inpos_offline_tables_cache", JSON.stringify(stored.filter((t: any) => t.id !== targetId)));
      } catch (e) {}

      saveOfflineMutation("table" as any, "delete", targetId);

      try {
        fetch(`/api/tables/${targetId}`, {
          method: "DELETE",
          headers: { "x-cafe-id": cafeId }
        }).then(() => fetchData()).catch(console.warn);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // ------------ TABLE HANDLERS ------------
  const handleOpenAddTableModal = () => {
    setEditingTable(null);
    setTableNumber("");
    setTableCapacity("4");
    setTableHall(halls[0]?.name || "Asosiy zal");
    setTableModalError("");
    setIsTableModalOpen(true);
  };

  const handleOpenEditTableModal = (tbl: Table) => {
    setEditingTable(tbl);
    setTableNumber(tbl.number);
    setTableCapacity(String(tbl.capacity || 4));
    setTableHall((tbl as any).hall || halls[0]?.name || "Asosiy zal");
    setTableModalError("");
    setIsTableModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setTableModalError("Stol raqami yoki nomini kiriting");
      return;
    }

    setIsSavingTable(true);
    setTableModalError("");

    try {
      const payload = {
        number: tableNumber.trim(),
        capacity: Number(tableCapacity) || 4,
        hall: tableHall
      };

      if (editingTable) {
        const res = await fetch(`/api/tables/${editingTable.id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "x-cafe-id": cafeId
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setIsTableModalOpen(false);
          fetchData();
        } else {
          setTableModalError("Stolni saqlashda xatolik yuz berdi");
        }
      } else {
        const res = await fetch("/api/tables", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-cafe-id": cafeId
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setIsTableModalOpen(false);
          fetchData();
        } else {
          setTableModalError("Stol qo'shishda xatolik yuz berdi");
        }
      }
    } catch (err) {
      setTableModalError("Serverga ulanishda xatolik");
    } finally {
      setIsSavingTable(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm("Ushbu stolni o'chirishni tasdiqlaysizmi?")) return;
    try {
      const res = await fetch(`/api/tables/${id}`, {
        method: "DELETE",
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTables = tables.filter((t) => {
    if (selectedHall === "all") return true;
    const hallName = (t as any).hall || "Asosiy zal";
    return hallName === selectedHall;
  });

  return (
    <div className="flex-1 bg-[#F8FAFC] p-6 lg:p-8 overflow-y-auto custom-scrollbar select-none text-[#1E293B]">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Zallar va stollar
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Restoran zallari ro'yxati, servis foizi va stollar joylashuvi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Yangilash"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-blue-600" : ""} />
          </button>

          <button
            onClick={handleOpenAddHallModal}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Zal qo'shish</span>
          </button>

          <button
            onClick={handleOpenAddTableModal}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Stol qo'shish</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: ZALLAR RO'YXATI (MATCHING SCREENSHOT 2) */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs mb-8 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Building size={18} className="text-blue-600" />
            <h2 className="text-sm font-bold text-gray-900">Zallar ro'yxati</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/60">
              {halls.length} ta zal
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">NOMI</th>
                <th className="py-3 px-4">SERVIS FOIZI</th>
                <th className="py-3 px-4">HOLAT</th>
                <th className="py-3 px-4 text-right">AMALLAR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800 font-medium">
              {halls.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    Zallar mavjud emas. Yangi zal qo'shish tugmasini bosing.
                  </td>
                </tr>
              ) : (
                halls.map((h) => {
                  const isAct = h.status === "active";
                  return (
                    <tr key={h.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>{h.name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-700">
                        {h.servicePercent ?? 10}%
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isAct
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {isAct ? (
                            <>
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>Faol</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={12} className="text-gray-400" />
                              <span>Infaol</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditHallModal(h)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => openDeleteHall(h)}
                          className="p-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                          title="Zalni o'chirish"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: STOLLAR HARITASI VA GRID */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <LayoutGrid size={18} className="text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900">Stollar joylashuvi</h2>
          </div>

          {/* Hall Tabs Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setSelectedHall("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedHall === "all"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              Barchasi ({tables.length})
            </button>
            {halls.map((h) => {
              const count = tables.filter((t) => ((t as any).hall || "Asosiy zal") === h.name).length;
              return (
                <button
                  key={h.id}
                  onClick={() => setSelectedHall(h.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    selectedHall === h.name
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  <span>{h.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-black/10 rounded font-mono">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tables Grid */}
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />
            <span>Stollar yuklanmoqda...</span>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl p-6 border border-dashed border-gray-200">
            <LayoutGrid size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-xs font-bold text-gray-700">Ushbu zalda stollar mavjud emas</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Yangi stol qo'shish tugmasini bosib birinchi stolni ro'yxatga oling</p>
            <button
              onClick={handleOpenAddTableModal}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} />
              <span>Stol qo'shish</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
            {filteredTables.map((tbl) => {
              const isOccupied = tbl.status === "occupied";
              const hall = (tbl as any).hall || "Asosiy zal";

              return (
                <div
                  key={tbl.id}
                  className={`border rounded-xl p-3.5 bg-white shadow-2xs flex flex-col justify-between transition-all hover:border-blue-400 ${
                    isOccupied ? "border-amber-400 bg-amber-50/20" : "border-gray-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {hall}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOccupied
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isOccupied ? "Band" : "Bo'sh"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 my-1">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                          isOccupied ? "bg-amber-500 text-white" : "bg-blue-600 text-white"
                        }`}
                      >
                        {tbl.number}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-gray-900 leading-tight">
                          Stol {tbl.number}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                          <Users size={12} />
                          <span>{tbl.capacity || 4} kishilik</span>
                        </div>
                      </div>
                    </div>

                    {tbl.activeWaiterName && (
                      <div className="mt-2 p-1.5 rounded-md bg-gray-100 flex items-center gap-1.5 text-[10px] text-gray-700 font-medium">
                        <UserCheck size={12} className="text-blue-600" />
                        <span className="truncate">{tbl.activeWaiterName}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleOpenEditTableModal(tbl)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                      title="Tahrirlash"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => openDeleteTable(tbl)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                      title="Stolni o'chirish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: ZAL QO'SHISH / TAHRIRLASH (MATCHING SCREENSHOT 3) */}
      {isHallModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md p-6 text-[#1E293B]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">
                {editingHall ? "Zalni tahrirlash" : "Zal qo'shish"}
              </h3>
              <button 
                onClick={() => setIsHallModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {hallModalError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{hallModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveHall} className="space-y-4 text-xs">
              {/* Field 1: Nomi */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nomi
                </label>
                <input
                  type="text"
                  value={hallName}
                  onChange={(e) => setHallName(e.target.value)}
                  placeholder="Masalan: Asosiy zal, Terassa, VIP"
                  required
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Field 2: Servis foizi % */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Servis foizi (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={hallServicePercent}
                    onChange={(e) => setHallServicePercent(e.target.value)}
                    placeholder="10"
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-600 pr-8"
                  />
                  <Percent size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Field 3: Holati */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Holati
                </label>
                <select
                  value={hallStatus}
                  onChange={(e) => setHallStatus(e.target.value as any)}
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="active">Faol</option>
                  <option value="inactive">Infaol</option>
                </select>
              </div>

              {/* Action buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsHallModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSavingHall}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  {isSavingHall ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STOL QO'SHISH / TAHRIRLASH */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md p-6 text-[#1E293B]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">
                {editingTable ? "Stolni tahrirlash" : "Yangi stol qo'shish"}
              </h3>
              <button 
                onClick={() => setIsTableModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {tableModalError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{tableModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTable} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Stol raqami yoki nomi
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Masalan: 1, 12, VIP-1"
                  required
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Sig'imi (O'rinlar soni)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Qaysi zalga tegishli
                </label>
                <select
                  value={tableHall}
                  onChange={(e) => setTableHall(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-600"
                >
                  {halls.map((h) => (
                    <option key={h.id} value={h.name}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSavingTable}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  {isSavingTable ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (2-rasmdagidek tasdiqlash oynasi) */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.type === "hall" ? "Zalni o'chirish" : "Stolni o'chirish"}
        itemName={deleteModal.name}
        itemType={deleteModal.type === "hall" ? "zal" : "stol"}
        message={
          deleteModal.type === "hall"
            ? `Haqiqatdan ham «${deleteModal.name}» zalini o'chirib tashlamoqchimisiz? Ushbu zalga biriktirilgan stollar boshqa zalga ko'chirilishi yoki o'chirilishi mumkin.`
            : `Haqiqatdan ham «${deleteModal.name}» stolini tizim va POS interfeysidan butunlay o'chirib tashlamoqchimisiz?`
        }
        isDeleting={isDeleting}
        onConfirm={handleExecuteDelete}
        onClose={() => setDeleteModal({ isOpen: false, type: "hall", id: "", name: "" })}
      />
    </div>
  );
};
