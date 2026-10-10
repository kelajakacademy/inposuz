import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/utils";
import { 
  Warehouse, 
  Boxes, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Check, 
  X, 
  RefreshCw, 
  ArrowDownToLine, 
  Layers, 
  Filter,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";

export type WarehouseSubTab = "warehouses" | "stock";

interface WarehouseLocation {
  id: string;
  name: string;
  code: string;
  manager: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minLimit: number;
  costPrice: number;
  supplier?: string;
  updatedAt?: string;
}

interface InventoryManagerProps {
  cafeId?: string;
  initialSubTab?: WarehouseSubTab;
  onSubTabChange?: (tab: WarehouseSubTab) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ 
  cafeId = "default",
  initialSubTab = "stock",
  onSubTabChange
}) => {
  const [activeSubTab, setActiveSubTab] = useState<WarehouseSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleTabChange = (tab: WarehouseSubTab) => {
    setActiveSubTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  // ---------------- WAREHOUSES STATE ----------------
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([
    {
      id: "wh-1",
      name: "Bosh Ombor",
      code: "WH-001",
      manager: "Ahmadov Jasur",
      status: "active",
      createdAt: "2024-01-15",
      updatedAt: "2024-03-20"
    },
    {
      id: "wh-2",
      name: "Oshxona Ombori",
      code: "WH-002",
      manager: "Karimov Sherzod",
      status: "active",
      createdAt: "2024-02-01",
      updatedAt: "2024-03-22"
    },
    {
      id: "wh-3",
      name: "Bar Ombori",
      code: "WH-003",
      manager: "Soliyev Bekzod",
      status: "active",
      createdAt: "2024-02-10",
      updatedAt: "2024-03-24"
    }
  ]);
  const [whSearch, setWhSearch] = useState("");
  const [isWhModalOpen, setIsWhModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<WarehouseLocation | null>(null);
  const [whName, setWhName] = useState("");
  const [whCode, setWhCode] = useState("");
  const [whManager, setWhManager] = useState("");

  // ---------------- STOCK / INVENTORY STATE ----------------
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Add/Edit Item Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Go'sht va go'sht mahsulotlari");
  const [unit, setUnit] = useState("kg");
  const [quantity, setQuantity] = useState("0");
  const [minLimit, setMinLimit] = useState("5");
  const [costPrice, setCostPrice] = useState("0");
  const [supplier, setSupplier] = useState("");
  const [modalError, setModalError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Stock In Modal (Kirim qilish)
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [stockInItem, setStockInItem] = useState<InventoryItem | null>(null);
  const [addQuantity, setAddQuantity] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [stockInError, setStockInError] = useState("");
  const [isSavingStockIn, setIsSavingStockIn] = useState(false);

  const categories = [
    "Go'sht va go'sht mahsulotlari",
    "Don mahsulotlari",
    "Sut mahsulotlari",
    "Yog' va souslar",
    "Sabzavot va mevalar",
    "Ichimliklar & Bar",
    "Ziravorlar & Boshqa"
  ];

  const units = ["kg", "gramm", "litr", "dona", "quti", "porsiya"];

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory", {
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [cafeId]);

  // Warehouse handlers
  const handleOpenWhModal = (wh?: WarehouseLocation) => {
    if (wh) {
      setEditingWh(wh);
      setWhName(wh.name);
      setWhCode(wh.code);
      setWhManager(wh.manager);
    } else {
      setEditingWh(null);
      setWhName("");
      setWhCode(`WH-00${warehouses.length + 1}`);
      setWhManager("");
    }
    setIsWhModalOpen(true);
  };

  const handleSaveWh = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName.trim()) return;

    if (editingWh) {
      setWarehouses(warehouses.map(w => w.id === editingWh.id ? {
        ...w,
        name: whName,
        code: whCode,
        manager: whManager,
        updatedAt: new Date().toISOString().split('T')[0]
      } : w));
    } else {
      setWarehouses([
        ...warehouses,
        {
          id: `wh-${Date.now()}`,
          name: whName,
          code: whCode || `WH-00${warehouses.length + 1}`,
          manager: whManager || "Biriktirilmagan",
          status: "active",
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0]
        }
      ]);
    }
    setIsWhModalOpen(false);
  };

  const handleDeleteWh = (id: string) => {
    if (confirm("Ushbu omborni o'chirishni tasdiqlaysizmi?")) {
      setWarehouses(warehouses.filter(w => w.id !== id));
    }
  };

  // Stock Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setName("");
    setCategory("Go'sht va go'sht mahsulotlari");
    setUnit("kg");
    setQuantity("10");
    setMinLimit("5");
    setCostPrice("50000");
    setSupplier("");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category || "Go'sht va go'sht mahsulotlari");
    setUnit(item.unit || "kg");
    setQuantity(String(item.quantity));
    setMinLimit(String(item.minLimit));
    setCostPrice(String(item.costPrice));
    setSupplier(item.supplier || "");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleOpenStockIn = (item: InventoryItem) => {
    setStockInItem(item);
    setAddQuantity("");
    setNewCostPrice(String(item.costPrice || ""));
    setNewSupplier(item.supplier || "");
    setStockInError("");
    setIsStockInModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError("Mahsulot nomini kiriting");
      return;
    }

    setIsSaving(true);
    setModalError("");

    try {
      if (editingItem) {
        const res = await fetch(`/api/inventory/${editingItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-cafe-id": cafeId
          },
          body: JSON.stringify({
            name: name.trim(),
            category,
            unit,
            quantity: Number(quantity) || 0,
            minLimit: Number(minLimit) || 5,
            costPrice: Number(costPrice) || 0,
            supplier: supplier.trim()
          })
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchInventory();
        } else {
          setModalError("Saqlashda xatolik");
        }
      } else {
        const res = await fetch("/api/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cafe-id": cafeId
          },
          body: JSON.stringify({
            name: name.trim(),
            category,
            unit,
            quantity: Number(quantity) || 0,
            minLimit: Number(minLimit) || 5,
            costPrice: Number(costPrice) || 0,
            supplier: supplier.trim()
          })
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchInventory();
        } else {
          setModalError("Qo'shishda xatolik");
        }
      }
    } catch (err) {
      setModalError("Serverga ulanishda xatolik");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInItem || !addQuantity || Number(addQuantity) <= 0) {
      setStockInError("To'g'ri miqdor kiriting");
      return;
    }

    setIsSavingStockIn(true);
    setStockInError("");

    try {
      const res = await fetch(`/api/inventory/${stockInItem.id}/stock-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cafe-id": cafeId
        },
        body: JSON.stringify({
          addQuantity: Number(addQuantity),
          costPrice: Number(newCostPrice) || undefined,
          supplier: newSupplier.trim() || undefined
        })
      });
      if (res.ok) {
        setIsStockInModalOpen(false);
        fetchInventory();
      } else {
        setStockInError("Kirimni saqlashda xatolik");
      }
    } catch (err) {
      setStockInError("Serverga ulanishda xatolik");
    } finally {
      setIsSavingStockIn(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Ushbu mahsulotni ombordan o'chirishni tasdiqlaysizmi?")) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        fetchInventory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredWh = warehouses.filter(w => {
    if (whSearch.trim()) {
      const q = whSearch.toLowerCase();
      return w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q) || w.manager.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredItems = items.filter((item) => {
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || (item.supplier && item.supplier.toLowerCase().includes(q));
    }
    return true;
  });

  const totalValue = filteredItems.reduce((sum, i) => sum + (i.quantity * i.costPrice), 0);
  const lowStockCount = filteredItems.filter(i => i.quantity <= i.minLimit).length;

  return (
    <div className="flex-1 bg-[#F5F7FA] min-h-0 flex flex-col overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        
        {/* Top Header & Subtabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
              <Warehouse className="text-blue-600" size={24} />
              {activeSubTab === "warehouses" ? "Omborlar" : "Qoldiqlar (Ombor zaxiralari)"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {activeSubTab === "warehouses" 
                ? "Barcha ombor joylashuvlari va mas'ul shaxslar ro'yxati" 
                : "Ombordagi barcha maxsulot va ingridientlar qoldig'i, kelish narxi va limitlari"}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => handleTabChange("warehouses")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === "warehouses"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              1. Omborlar
            </button>
            <button
              onClick={() => handleTabChange("stock")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === "stock"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              2. Qoldiqlar
            </button>
          </div>
        </div>

        {/* ================= TAB 1: OMBORLAR ================= */}
        {activeSubTab === "warehouses" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={whSearch}
                  onChange={(e) => setWhSearch(e.target.value)}
                  placeholder="Ombor nomi yoki mas'ul shaxs bo'yicha qidirish..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => handleOpenWhModal()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <Plus size={16} />
                <span>+ Ombor qo'shish</span>
              </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">NOMI</th>
                      <th className="py-3.5 px-4">KOD</th>
                      <th className="py-3.5 px-4">MAS'UL SHAXS</th>
                      <th className="py-3.5 px-4">HOLATI</th>
                      <th className="py-3.5 px-4">YARATILGAN</th>
                      <th className="py-3.5 px-4 text-right">AMALLAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {filteredWh.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                          Omborlar topilmadi
                        </td>
                      </tr>
                    ) : (
                      filteredWh.map((w) => (
                        <tr key={w.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2.5">
                            <Building2 size={16} className="text-blue-600" />
                            <span>{w.name}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-600">{w.code}</td>
                          <td className="py-3.5 px-4 text-gray-700">{w.manager}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              Faol
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500">{w.createdAt}</td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenWhModal(w)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteWh(w.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Trash2 size={15} />
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

        {/* ================= TAB 2: QOLDIQLAR ================= */}
        {activeSubTab === "stock" && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500">Jami ombor qiymati</span>
                  <p className="text-lg font-black text-gray-900 mt-0.5">{formatCurrency(totalValue)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  UZS
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500">Mahsulot turlari</span>
                  <p className="text-lg font-black text-gray-900 mt-0.5">{filteredItems.length} ta</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                  <Boxes size={20} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500">Kam qolganlar (Limit)</span>
                  <p className="text-lg font-black text-amber-600 mt-0.5">{lowStockCount} ta</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Mahsulot yoki yetkazib beruvchi..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Barcha kategoriyalar</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchInventory}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                  title="Yangilash"
                >
                  <RefreshCw size={15} className={loading ? "animate-spin text-blue-600" : ""} />
                </button>
                <button
                  onClick={handleOpenAdd}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <Plus size={16} />
                  <span>+ Mahsulot qo'shish</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">MAHSULOT NOMI</th>
                      <th className="py-3.5 px-4">KATEGORIYA</th>
                      <th className="py-3.5 px-4">QOLDIQ</th>
                      <th className="py-3.5 px-4">MIN CHEGARA</th>
                      <th className="py-3.5 px-4">TANNARXI</th>
                      <th className="py-3.5 px-4">JAMI QIYMATI</th>
                      <th className="py-3.5 px-4">YETKAZIB BERUVCHI</th>
                      <th className="py-3.5 px-4 text-right">AMALLAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-400">
                          Yuklanmoqda...
                        </td>
                      </tr>
                    ) : filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-400">
                          Mahsulotlar topilmadi
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const isLow = item.quantity <= item.minLimit;
                        const itemVal = item.quantity * item.costPrice;
                        return (
                          <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-gray-900">{item.name}</td>
                            <td className="py-3.5 px-4 text-gray-600">{item.category || "-"}</td>
                            <td className="py-3.5 px-4">
                              <span className={`font-mono font-bold ${isLow ? "text-amber-600" : "text-gray-900"}`}>
                                {item.quantity} {item.unit}
                              </span>
                              {isLow && (
                                <span className="ml-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                  Kam
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-gray-500 font-mono">{item.minLimit} {item.unit}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-gray-700">{formatCurrency(item.costPrice)}</td>
                            <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{formatCurrency(itemVal)}</td>
                            <td className="py-3.5 px-4 text-gray-500">{item.supplier || "-"}</td>
                            <td className="py-3.5 px-4 text-right space-x-1.5">
                              <button
                                onClick={() => handleOpenStockIn(item)}
                                className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                                title="Kirim qilish"
                              >
                                <ArrowDownToLine size={13} />
                                <span>Kirim</span>
                              </button>
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
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
          </div>
        )}

      </div>

      {/* Warehouse Modal */}
      {isWhModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {editingWh ? "Omborni tahrirlash" : "Yangi ombor qo'shish"}
              </h3>
              <button onClick={() => setIsWhModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveWh} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ombor nomi</label>
                <input
                  type="text"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  placeholder="Masalan: Bosh Ombor, Bar Ombori..."
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ombor kodi</label>
                <input
                  type="text"
                  value={whCode}
                  onChange={(e) => setWhCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mas'ul shaxs (Omborchi)</label>
                <input
                  type="text"
                  value={whManager}
                  onChange={(e) => setWhManager(e.target.value)}
                  placeholder="Masalan: Ahmadov Jasur"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWhModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {editingItem ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mahsulot nomi</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Mol go'shti, Guruch..."
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategoriya</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">O'lchov birligi</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Qoldiq</label>
                  <input
                    type="number"
                    step="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Min limit</label>
                  <input
                    type="number"
                    step="0.1"
                    value={minLimit}
                    onChange={(e) => setMinLimit(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tannarx (so'm)</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Yetkazib beruvchi</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Masalan: Agro Meat Toshkent"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  {isSaving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock In Modal */}
      {isStockInModalOpen && stockInItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Omborga kirim qilish</h3>
                <p className="text-xs text-blue-600 font-bold mt-0.5">{stockInItem.name}</p>
              </div>
              <button onClick={() => setIsStockInModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {stockInError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {stockInError}
              </div>
            )}

            <form onSubmit={handleSaveStockIn} className="space-y-4">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-gray-600 font-bold">Hozirgi qoldiq:</span>
                <span className="font-bold text-gray-900 font-mono">{stockInItem.quantity} {stockInItem.unit}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kirim qilinayotgan miqdor ({stockInItem.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(e.target.value)}
                  placeholder={`Masalan: 20 ${stockInItem.unit}`}
                  required
                  autoFocus
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kelish narxi (1 {stockInItem.unit} uchun)
                </label>
                <input
                  type="number"
                  value={newCostPrice}
                  onChange={(e) => setNewCostPrice(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Yetkazib beruvchi
                </label>
                <input
                  type="text"
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStockInModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSavingStockIn}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  {isSavingStockIn ? "Kirim qilinmoqda..." : "Kiriimni tasdiqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
