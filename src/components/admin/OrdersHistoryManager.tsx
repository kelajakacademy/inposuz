import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/utils";
import { 
  ShoppingBag, 
  Receipt, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Printer, 
  Eye, 
  X, 
  RefreshCw, 
  Filter, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Phone, 
  Star, 
  Percent,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { DeleteConfirmationModal } from "../common/DeleteConfirmationModal";

export type OrdersSubTab = "orders" | "customers";

interface Customer {
  id: string;
  name: string;
  phone: string;
  discountPercent: number;
  ordersCount: number;
  totalSpent: number;
  status: "active" | "inactive";
  lastVisit?: string;
  notes?: string;
}

interface OrdersHistoryManagerProps {
  cafeId?: string;
  initialSubTab?: OrdersSubTab;
  onSubTabChange?: (tab: OrdersSubTab) => void;
}

export const OrdersHistoryManager: React.FC<OrdersHistoryManagerProps> = ({ 
  cafeId = "default",
  initialSubTab = "orders",
  onSubTabChange
}) => {
  const [activeSubTab, setActiveSubTab] = useState<OrdersSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleTabChange = (tab: OrdersSubTab) => {
    setActiveSubTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  // ---------------- ORDERS STATE ----------------
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // ---------------- CUSTOMERS STATE ----------------
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [custSearch, setCustSearch] = useState("");
  const [isCustModalOpen, setIsCustModalOpen] = useState(false);
  const [editingCust, setEditingCust] = useState<Customer | null>(null);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custDiscount, setCustDiscount] = useState("5");
  const [custNotes, setCustNotes] = useState("");

  // ---------------- DELETE CONFIRMATION STATE ----------------
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "customer" | "order";
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: "customer",
    id: "",
    name: ""
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = statusFilter === "all" 
        ? "/api/admin/orders?limit=150" 
        : `/api/admin/orders?status=${statusFilter}&limit=150`;
      const res = await fetch(url, {
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/clients", {
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCustomers(data.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            discountPercent: Number(c.discountPercent) || 0,
            ordersCount: Number(c.totalVisits) || 0,
            totalSpent: Number(c.totalSpent) || 0,
            status: c.status === "blocked" ? "inactive" : "active",
            lastVisit: c.lastVisit ? String(c.lastVisit).split("T")[0] : "",
            notes: c.notes || ""
          })));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
  }, [cafeId, statusFilter]);

  // Customer handlers
  const handleOpenCustModal = (cust?: Customer) => {
    if (cust) {
      setEditingCust(cust);
      setCustName(cust.name);
      setCustPhone(cust.phone);
      setCustDiscount(String(cust.discountPercent));
      setCustNotes(cust.notes || "");
    } else {
      setEditingCust(null);
      setCustName("");
      setCustPhone("+998 ");
      setCustDiscount("5");
      setCustNotes("");
    }
    setIsCustModalOpen(true);
  };

  const handleSaveCust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) return;

    try {
      if (editingCust) {
        const res = await fetch(`/api/clients/${editingCust.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
          body: JSON.stringify({
            name: custName.trim(),
            phone: custPhone.trim(),
            discountPercent: Number(custDiscount) || 0,
            notes: custNotes
          })
        });
        if (res.ok) {
          setIsCustModalOpen(false);
          fetchCustomers();
        }
      } else {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
          body: JSON.stringify({
            name: custName.trim(),
            phone: custPhone.trim(),
            discountPercent: Number(custDiscount) || 0,
            notes: custNotes
          })
        });
        if (res.ok) {
          setIsCustModalOpen(false);
          fetchCustomers();
        } else {
          const data = await res.json();
          alert(data.error || "Mijozni saqlashda xatolik");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openDeleteCustomer = (c: Customer) => {
    setDeleteModal({
      isOpen: true,
      type: "customer",
      id: c.id,
      name: c.name
    });
  };

  const openDeleteOrder = (o: any) => {
    setDeleteModal({
      isOpen: true,
      type: "order",
      id: o.id,
      name: `Buyurtma #${o.id} (Stol ${o.tableNumber || '-'})`
    });
  };

  const handleExecuteDelete = async () => {
    if (!deleteModal.id) return;
    setIsDeleting(true);
    try {
      if (deleteModal.type === "customer") {
        const res = await fetch(`/api/clients/${deleteModal.id}`, {
          method: "DELETE",
          headers: { "x-cafe-id": cafeId }
        });
        if (res.ok) {
          fetchCustomers();
          setDeleteModal({ isOpen: false, type: "customer", id: "", name: "" });
        }
      } else if (deleteModal.type === "order") {
        const res = await fetch(`/api/orders/${deleteModal.id}`, {
          method: "DELETE",
          headers: { "x-cafe-id": cafeId }
        });
        if (res.ok) {
          if (selectedOrder?.id === deleteModal.id) {
            setSelectedOrder(null);
          }
          fetchOrders();
          setDeleteModal({ isOpen: false, type: "order", id: "", name: "" });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const tableMatch = String(o.tableNumber || "").toLowerCase().includes(q);
      const waiterMatch = String(o.waiterName || "").toLowerCase().includes(q);
      const idMatch = String(o.id || "").toLowerCase().includes(q);
      return tableMatch || waiterMatch || idMatch;
    }
    return true;
  });

  const filteredCustomers = customers.filter(c => {
    if (custSearch.trim()) {
      const q = custSearch.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
    }
    return true;
  });

  const totalSales = filteredOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return (
    <div className="flex-1 bg-[#F5F7FA] min-h-0 flex flex-col overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">

        {/* Top Header & Subtabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
              <ShoppingBag className="text-blue-600" size={24} />
              {activeSubTab === "orders" ? "Buyurtmalar va Cheklar" : "Mijozlar (CRM)"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {activeSubTab === "orders" 
                ? "Kassa va waiter POS orqali yopilgan va faol cheklar tarixi" 
                : "Doimiy mijozlar bazasi, chegirmalar va xaridlar tarixi"}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => handleTabChange("orders")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === "orders"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              1. Buyurtmalar
            </button>
            <button
              onClick={() => handleTabChange("customers")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === "customers"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              2. Mijozlar
            </button>
          </div>
        </div>

        {/* ================= TAB 1: BUYURTMALAR ================= */}
        {activeSubTab === "orders" && (
          <div className="space-y-4">
            {/* KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500">Jami ko'rsatilgan tushum</span>
                  <p className="text-lg font-black text-gray-900 mt-0.5">{formatCurrency(totalSales)}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  UZS
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500">Ko'rsatilgan cheklar</span>
                  <p className="text-lg font-black text-gray-900 mt-0.5">{filteredOrders.length} ta</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                  <Receipt size={20} />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500">O'rtacha chek summasi</span>
                  <p className="text-lg font-black text-emerald-600 mt-0.5">
                    {filteredOrders.length > 0 ? formatCurrency(Math.round(totalSales / filteredOrders.length)) : "0 UZS"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={20} />
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
                    placeholder="Stol, ofitsiant yoki ID bo'yicha..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                  {[
                    { id: "all", label: "Barchasi" },
                    { id: "closed", label: "Yopilgan" },
                    { id: "open", label: "Ochiq" },
                    { id: "cancelled", label: "Bekor qilingan" }
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setStatusFilter(st.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        statusFilter === st.id
                          ? "bg-white text-blue-600 shadow-2xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={fetchOrders}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={15} className={loading ? "animate-spin text-blue-600" : ""} />
                <span>Yangilash</span>
              </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">STOL #</th>
                      <th className="py-3.5 px-4">OFITSIANT</th>
                      <th className="py-3.5 px-4">VAQTI</th>
                      <th className="py-3.5 px-4">SUMMA</th>
                      <th className="py-3.5 px-4">TO'LOV TURI</th>
                      <th className="py-3.5 px-4">HOLATI</th>
                      <th className="py-3.5 px-4 text-right">AMALLAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400">
                          Yuklanmoqda...
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400">
                          Buyurtmalar topilmadi
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-900">
                            Stol {o.tableNumber || "-"}
                          </td>
                          <td className="py-3.5 px-4 text-gray-700">{o.waiterName || "Ofitsiant"}</td>
                          <td className="py-3.5 px-4 text-gray-500 font-mono">
                            {o.createdAt ? new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                            {formatCurrency(o.total)}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600">
                            {o.paymentMethod === "card" ? "Karta" : o.paymentMethod === "transfer" ? "O'tkazma" : "Naqd"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              o.status === "closed" 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : o.status === "cancelled"
                                ? "bg-red-50 text-red-700 border border-red-200/60"
                                : "bg-amber-50 text-amber-700 border border-amber-200/60"
                            }`}>
                              {o.status === "closed" ? "Yopilgan" : o.status === "cancelled" ? "Bekor qilingan" : "Ochiq"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Ko'rish"
                            >
                              <Eye size={13} />
                              <span>Ko'rish</span>
                            </button>
                            <button
                              onClick={() => openDeleteOrder(o)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer border border-red-200"
                              title="Buyurtmani butunlay o'chirish"
                            >
                              <Trash2 size={14} />
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

        {/* ================= TAB 2: MIJOZLAR (CRM) ================= */}
        {activeSubTab === "customers" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                  placeholder="Mijoz ismi yoki telefon raqami bo'yicha..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => handleOpenCustModal()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <Plus size={16} />
                <span>+ Mijoz qo'shish</span>
              </button>
            </div>

            {/* Customer Table */}
            <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">MIJOZ F.I.O</th>
                      <th className="py-3.5 px-4">TELEFON</th>
                      <th className="py-3.5 px-4">CHEGIRMA %</th>
                      <th className="py-3.5 px-4">BUYURTMALAR</th>
                      <th className="py-3.5 px-4">JAMI TUSHUM</th>
                      <th className="py-3.5 px-4">OXIRGI TASHRIF</th>
                      <th className="py-3.5 px-4 text-right">AMALLAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400">
                          Mijozlar topilmadi
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
                              {c.name.charAt(0)}
                            </div>
                            <div>
                              <span>{c.name}</span>
                              {c.notes && <p className="text-[10px] text-gray-400 font-normal">{c.notes}</p>}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-700">{c.phone}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                              {c.discountPercent}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-800">{c.ordersCount} ta</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{formatCurrency(c.totalSpent)}</td>
                          <td className="py-3.5 px-4 text-gray-500">{c.lastVisit || "-"}</td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenCustModal(c)}
                              className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                              title="Tahrirlash"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => openDeleteCustomer(c)}
                              className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                              title="Mijozni o'chirish"
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

      </div>

      {/* Customer Modal */}
      {isCustModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {editingCust ? "Mijozni tahrirlash" : "Yangi mijoz qo'shish"}
              </h3>
              <button onClick={() => setIsCustModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCust} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mijoz F.I.O</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="Masalan: Valiyev Jamshid"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Telefon raqami</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Chegirma (Diskont) %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={custDiscount}
                  onChange={(e) => setCustDiscount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Izoh / Eslatma</label>
                <input
                  type="text"
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                  placeholder="Masalan: VIP mijoz, doimiy tashrif buyuruvchi..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustModalOpen(false)}
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

      {/* Order View Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Chek Tafsilotlari</h3>
                <p className="text-xs text-gray-500 font-mono">ID: #{String(selectedOrder.id).slice(-8)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Stol:</span>
                <span className="font-bold text-gray-900">Stol {selectedOrder.tableNumber}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Ofitsiant:</span>
                <span className="font-bold text-gray-900">{selectedOrder.waiterName || "Ofitsiant"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500">Holati:</span>
                <span className="font-bold text-emerald-600">{selectedOrder.status === "closed" ? "Yopilgan" : "Ochiq"}</span>
              </div>

              {/* Items */}
              <div className="pt-2">
                <p className="font-bold text-gray-800 mb-2">Buyurtma tahriri:</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.items && Array.isArray(selectedOrder.items) ? (
                    selectedOrder.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-gray-700">
                        <span>{it.quantity}x {it.name || it.title}</span>
                        <span className="font-mono">{formatCurrency((it.price || 0) * (it.quantity || 1))}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic">Buyurtma mahsulotlari ma'lumoti yo'q</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-sm font-bold">
                <span>Jami Summa:</span>
                <span className="text-blue-600 text-base">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (2-rasmdagidek tasdiqlash oynasi) */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.type === "customer" ? "Mijozni o'chirish" : "Buyurtmani o'chirish"}
        itemName={deleteModal.name}
        itemType={deleteModal.type === "customer" ? "mijoz" : "buyurtma"}
        isDeleting={isDeleting}
        onConfirm={handleExecuteDelete}
        onClose={() => setDeleteModal({ isOpen: false, type: "customer", id: "", name: "" })}
      />
    </div>
  );
};
