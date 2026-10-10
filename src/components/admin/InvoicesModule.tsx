import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/utils";
import { 
  FileText, 
  Search, 
  Plus, 
  Printer, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRightLeft, 
  TrendingDown, 
  Boxes, 
  Truck, 
  Calendar, 
  Filter, 
  X, 
  Check, 
  Building, 
  RefreshCw,
  ChevronDown,
  Layers,
  ShoppingBag,
  DollarSign
} from "lucide-react";

export type InvoicesSubTab = "invoices" | "stocks_remain" | "suppliers" | "writeoffs";

export interface InvoiceItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  sum: number;
  batch?: string;
  expiryDate?: string;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  type: "incoming" | "transfer" | "writeoff" | "return";
  stockId?: string;
  stockName?: string;
  targetStockId?: string;
  targetStockName?: string;
  supplierId?: string;
  supplierName?: string;
  itemsCount: number;
  totalQuantity: number;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  paymentMethod: "cash" | "transfer" | "debt" | "card" | "internal" | "writeoff";
  status: "conducted" | "draft" | "cancelled";
  comment?: string;
  items: InvoiceItem[];
  createdBy?: string;
  cafeId?: string;
  createdAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  inn?: string;
  bankDetails?: string;
  balance: number;
  cafeId?: string;
}

export interface Stock {
  id: string;
  name: string;
  cafeId?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minLimit: number;
  costPrice: number;
  supplier?: string;
}

interface InvoicesModuleProps {
  cafeId?: string;
}

export const InvoicesModule: React.FC<InvoicesModuleProps> = ({ cafeId = "default" }) => {
  const [subTab, setSubTab] = useState<InvoicesSubTab>("invoices");
  
  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStock, setSelectedStock] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Selection for batch actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Create / Edit Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [modalType, setModalType] = useState<"incoming" | "transfer" | "writeoff" | "return">("incoming");
  const [modalNumber, setModalNumber] = useState("");
  const [modalDate, setModalDate] = useState("");
  const [modalStockId, setModalStockId] = useState("");
  const [modalTargetStockId, setModalTargetStockId] = useState("");
  const [modalSupplierId, setModalSupplierId] = useState("");
  const [modalPaymentMethod, setModalPaymentMethod] = useState<"cash" | "transfer" | "debt" | "card">("cash");
  const [modalComment, setModalComment] = useState("");
  const [modalItems, setModalItems] = useState<InvoiceItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Detail / Print Preview Modal
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Supplier Modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supContact, setSupContact] = useState("");
  const [supAddress, setSupAddress] = useState("");
  const [supInn, setSupInn] = useState("");
  const [supBalance, setSupBalance] = useState("0");

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { "x-cafe-id": cafeId };

      const [invRes, stockRes, supRes, itemsRes] = await Promise.all([
        fetch(`/api/invoices`, { headers }),
        fetch(`/api/stocks`, { headers }),
        fetch(`/api/suppliers`, { headers }),
        fetch(`/api/inventory`, { headers })
      ]);

      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData);
      }
      if (stockRes.ok) {
        const stockData = await stockRes.json();
        setStocks(stockData);
      }
      if (supRes.ok) {
        const supData = await supRes.json();
        setSuppliers(supData);
      }
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setInventoryItems(itemsData);
      }
    } catch (e) {
      console.error("Failed to load invoice module data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cafeId]);

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    if (selectedStock !== "all") {
      if (inv.stockId !== selectedStock && inv.targetStockId !== selectedStock) return false;
    }
    if (selectedSupplier !== "all" && inv.supplierId !== selectedSupplier) return false;
    if (selectedType !== "all" && inv.type !== selectedType) return false;
    if (selectedStatus !== "all" && inv.status !== selectedStatus) return false;

    if (startDate && new Date(inv.date) < new Date(startDate)) return false;
    if (endDate && new Date(inv.date) > new Date(endDate + " 23:59:59")) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = inv.number.toLowerCase().includes(q);
      const matchSup = (inv.supplierName || "").toLowerCase().includes(q);
      const matchStock = (inv.stockName || "").toLowerCase().includes(q);
      const matchComment = (inv.comment || "").toLowerCase().includes(q);
      const matchItems = inv.items?.some(it => it.name.toLowerCase().includes(q));
      if (!matchNum && !matchSup && !matchStock && !matchComment && !matchItems) return false;
    }

    return true;
  });

  // Calculate totals
  const totalInvoicesSum = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const totalDebtSum = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.debtAmount) || 0), 0);
  const totalPaidSum = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredInvoices.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Open Create Invoice Modal
  const handleOpenCreateModal = (type: "incoming" | "transfer" | "writeoff" | "return" = "incoming") => {
    setEditingInvoice(null);
    setModalType(type);
    
    // Auto-generate invoice number
    const count = invoices.length;
    setModalNumber(String(count + 125).padStart(5, '0'));
    
    // Date & Time
    const now = new Date();
    const formatted = now.getFullYear() + "-" + 
      String(now.getMonth() + 1).padStart(2, '0') + "-" + 
      String(now.getDate()).padStart(2, '0') + " " + 
      String(now.getHours()).padStart(2, '0') + ":" + 
      String(now.getMinutes()).padStart(2, '0');
    setModalDate(formatted);

    setModalStockId(stocks[0]?.id || "3");
    setModalTargetStockId(stocks[1]?.id || "1");
    setModalSupplierId(suppliers[0]?.id || "");
    setModalPaymentMethod("cash");
    setModalComment("");
    setModalError("");

    // Start with 1 default item row
    setModalItems([
      { id: "item-1", name: "", unit: "kg", quantity: 1, price: 0, sum: 0 }
    ]);

    setIsCreateModalOpen(true);
  };

  // Open Edit Invoice Modal
  const handleOpenEditModal = (inv: Invoice) => {
    setEditingInvoice(inv);
    setModalType(inv.type);
    setModalNumber(inv.number);
    setModalDate(inv.date);
    setModalStockId(inv.stockId || "");
    setModalTargetStockId(inv.targetStockId || "");
    setModalSupplierId(inv.supplierId || "");
    setModalPaymentMethod(inv.paymentMethod as any || "cash");
    setModalComment(inv.comment || "");
    setModalError("");
    setModalItems(inv.items.map(it => ({ ...it })));
    setIsCreateModalOpen(true);
  };

  // Item row operations
  const handleAddItemRow = () => {
    setModalItems(prev => [
      ...prev,
      { id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`, name: "", unit: "kg", quantity: 1, price: 0, sum: 0 }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (modalItems.length === 1) return;
    setModalItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setModalItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      
      // Auto-fill unit and price if product selected from dropdown
      if (field === "name") {
        const matched = inventoryItems.find(i => i.name.toLowerCase() === String(value).toLowerCase());
        if (matched) {
          item.unit = matched.unit || "kg";
          if (!item.price || item.price === 0) {
            item.price = matched.costPrice || 0;
          }
        }
      }

      // Re-calculate sum
      if (field === "quantity" || field === "price" || field === "name") {
        const qty = Number(item.quantity) || 0;
        const pr = Number(item.price) || 0;
        item.sum = Math.round(qty * pr);
      }

      updated[index] = item;
      return updated;
    });
  };

  // Save Invoice (as Conducted or Draft)
  const handleSaveInvoice = async (status: "conducted" | "draft") => {
    const validItems = modalItems.filter(it => it.name.trim() !== "");
    if (validItems.length === 0) {
      setModalError("Kamida 1 ta tovar yoki mahsulot nomini kiriting!");
      return;
    }

    setIsSaving(true);
    setModalError("");

    try {
      const stockObj = stocks.find(s => s.id === modalStockId);
      const targetStockObj = stocks.find(s => s.id === modalTargetStockId);
      const supplierObj = suppliers.find(s => s.id === modalSupplierId);

      const totalSum = validItems.reduce((acc, it) => acc + (Number(it.sum) || 0), 0);
      const paid = modalPaymentMethod === "debt" ? 0 : totalSum;
      const debt = totalSum - paid;

      const payload = {
        number: modalNumber.trim(),
        date: modalDate,
        type: modalType,
        stockId: modalStockId,
        stockName: stockObj?.name || "Склад",
        targetStockId: modalType === "transfer" ? modalTargetStockId : null,
        targetStockName: modalType === "transfer" ? targetStockObj?.name : null,
        supplierId: modalType === "incoming" ? modalSupplierId : null,
        supplierName: modalType === "incoming" ? supplierObj?.name : (modalType === "transfer" ? "Ichki ko‘chirish" : "Hisobdan chiqarish"),
        items: validItems,
        paidAmount: paid,
        debtAmount: debt,
        paymentMethod: modalPaymentMethod,
        status,
        comment: modalComment.trim(),
        createdBy: "Admin"
      };

      let res;
      if (editingInvoice) {
        res = await fetch(`/api/invoices/${editingInvoice.id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "x-cafe-id": cafeId 
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/invoices`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-cafe-id": cafeId 
          },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        await fetchData();
        setIsCreateModalOpen(false);
      } else {
        const data = await res.json();
        setModalError(data.error || "Nomalum xatolik yuz berdi");
      }
    } catch (e: any) {
      setModalError(e.message || "Serverga ulanishda xatolik");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("Ushbu nakladnoyni o‘chirishni xohlaysizmi?")) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        fetchData();
        setSelectedIds(prev => prev.filter(i => i !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open Supplier Modal
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupName("");
    setSupPhone("");
    setSupContact("");
    setSupAddress("");
    setSupInn("");
    setSupBalance("0");
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupName(sup.name);
    setSupPhone(sup.phone || "");
    setSupContact(sup.contactPerson || "");
    setSupAddress(sup.address || "");
    setSupInn(sup.inn || "");
    setSupBalance(String(sup.balance || 0));
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    try {
      const res = await fetch(`/api/suppliers`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": cafeId 
        },
        body: JSON.stringify({
          id: editingSupplier?.id,
          name: supName.trim(),
          phone: supPhone.trim(),
          contactPerson: supContact.trim(),
          address: supAddress.trim(),
          inn: supInn.trim(),
          balance: Number(supBalance) || 0
        })
      });

      if (res.ok) {
        await fetchData();
        setIsSupplierModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm("Ushbu yetkazib beruvchini o‘chirishni xohlaysizmi?")) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
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

  // Print Batch
  const handlePrintSelected = () => {
    const selectedInvoices = invoices.filter(i => selectedIds.includes(i.id));
    if (selectedInvoices.length === 0) {
      alert("Chop etish uchun biror nakladnoyni belgilang!");
      return;
    }
    window.print();
  };

  // Export CSV
  const handleExportCSV = (onlySelected: boolean = false) => {
    const listToExport = onlySelected 
      ? invoices.filter(i => selectedIds.includes(i.id))
      : filteredInvoices;

    if (listToExport.length === 0) {
      alert("Eksport qilish uchun nakladnoy mavjud emas");
      return;
    }

    const headers = ["№", "Sana", "Turi", "Ombor", "Yetkazib beruvchi", "Pozitsiyalar soni", "Jami miqdor", "Summa (so'm)", "To'langan", "Qarz", "To'lov turi", "Holati", "Izoh"];
    const rows = listToExport.map(i => [
      i.number,
      i.date,
      i.type === 'incoming' ? 'Приход' : i.type === 'transfer' ? 'Перемещение' : i.type === 'writeoff' ? 'Списание' : 'Возврат',
      i.stockName || '',
      i.supplierName || '',
      i.itemsCount,
      i.totalQuantity,
      i.totalAmount,
      i.paidAmount,
      i.debtAmount,
      i.paymentMethod,
      i.status === 'conducted' ? 'Проведена' : i.status === 'draft' ? 'Черновик' : 'Отменена',
      i.comment || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nakladnie_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#ECEEF1] overflow-hidden text-sm select-none">
      {/* 1. TOP SUB-HEADER WITH TABS & JOWI ACTION BUTTONS */}
      <div className="bg-white border-b border-[#D9DDE2] px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        {/* Sub-tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab("invoices")}
            className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === "invoices"
                ? "bg-[#2B303A] text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FileText size={15} />
            <span>Накладные ({invoices.length})</span>
          </button>

          <button
            onClick={() => setSubTab("stocks_remain")}
            className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === "stocks_remain"
                ? "bg-[#2B303A] text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Boxes size={15} />
            <span>Остатки на складах ({inventoryItems.length})</span>
          </button>

          <button
            onClick={() => setSubTab("suppliers")}
            className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === "suppliers"
                ? "bg-[#2B303A] text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Truck size={15} />
            <span>Поставщики ({suppliers.length})</span>
          </button>
        </div>

        {/* Action Buttons matching Jowi screenshots */}
        {subTab === "invoices" && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleOpenCreateModal("incoming")}
              className="bg-[#2EB85C] hover:bg-[#28A745] active:scale-95 text-white font-bold text-xs px-4 py-2 rounded shadow flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={16} className="stroke-[3]" />
              <span>+ СОЗДАТЬ НАКЛАДНУЮ</span>
            </button>

            <button
              onClick={handlePrintSelected}
              disabled={selectedIds.length === 0}
              className={`text-xs font-bold px-3 py-2 rounded border flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedIds.length > 0 
                  ? "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 shadow-sm" 
                  : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              }`}
            >
              <Printer size={14} />
              <span>ПЕЧАТЬ ВЫБРАННЫХ</span>
            </button>

            <button
              onClick={() => handleExportCSV(false)}
              className="bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold px-3 py-2 rounded border border-gray-300 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>ЭКСПОРТ</span>
            </button>

            <button
              onClick={() => handleExportCSV(true)}
              disabled={selectedIds.length === 0}
              className={`text-xs font-bold px-3 py-2 rounded border flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedIds.length > 0 
                  ? "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 shadow-sm" 
                  : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              }`}
            >
              <Download size={14} />
              <span>ЭКСПОРТ ВЫБРАННЫХ</span>
            </button>

            <button
              onClick={fetchData}
              title="Yangilash"
              className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        )}

        {subTab === "suppliers" && (
          <button
            onClick={handleOpenAddSupplier}
            className="bg-[#2EB85C] hover:bg-[#28A745] active:scale-95 text-white font-bold text-xs px-4 py-2 rounded shadow flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>+ ДОБАВИТЬ ПОСТАВЩИКА</span>
          </button>
        )}
      </div>

      {/* 2. TAB 1: НАКЛАДНЫЕ (INVOICES LIST VIEW) */}
      {subTab === "invoices" && (
        <div className="flex-1 flex flex-col min-h-0 p-6 overflow-hidden">
          {/* Filters Bar matching Jowi.club */}
          <div className="bg-white border border-[#D9DDE2] rounded-t p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm shrink-0">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Склад Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-semibold">Склад:</span>
                <select
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  className="bg-[#F8F9FA] border border-gray-300 text-gray-800 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="all">Все склады</option>
                  {stocks.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Поставщик Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-semibold">Поставщик:</span>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="bg-[#F8F9FA] border border-gray-300 text-gray-800 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-medium max-w-[200px]"
                >
                  <option value="all">Все поставщики</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Тип Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-semibold">Тип:</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-[#F8F9FA] border border-gray-300 text-gray-800 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="all">Все типы</option>
                  <option value="incoming">Приходная (Приход)</option>
                  <option value="transfer">Перемещение</option>
                  <option value="writeoff">Списание</option>
                  <option value="return">Возврат поставщику</option>
                </select>
              </div>

              {/* Статус Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-semibold">Статус:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-[#F8F9FA] border border-gray-300 text-gray-800 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="all">Все статусы</option>
                  <option value="conducted">Проведена</option>
                  <option value="draft">Черновик</option>
                  <option value="cancelled">Отменена</option>
                </select>
              </div>

              {/* Date Pickers */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-semibold">Период:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-[#F8F9FA] border border-gray-300 text-gray-800 text-xs rounded px-2 py-1 focus:outline-none focus:border-amber-500"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-[#F8F9FA] border border-gray-300 text-gray-800 text-xs rounded px-2 py-1 focus:outline-none focus:border-amber-500"
                />
                {(startDate || endDate) && (
                  <button 
                    onClick={() => { setStartDate(""); setEndDate(""); }}
                    className="text-gray-400 hover:text-gray-700 text-xs"
                    title="Filtrni tozalash"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по номеру или товару..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#F8F9FA] border border-gray-300 rounded text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Invoices Table */}
          <div className="flex-1 bg-white border-x border-b border-[#D9DDE2] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F1F3F5] text-gray-700 text-xs uppercase font-bold sticky top-0 border-b border-gray-300 z-10">
                <tr>
                  <th className="p-3 w-10 text-center border-r border-gray-300">
                    <input
                      type="checkbox"
                      checked={filteredInvoices.length > 0 && selectedIds.length === filteredInvoices.length}
                      onChange={handleSelectAll}
                      className="rounded text-amber-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 border-r border-gray-300 w-24">№</th>
                  <th className="p-3 border-r border-gray-300 w-36">Дата</th>
                  <th className="p-3 border-r border-gray-300 w-32">Тип</th>
                  <th className="p-3 border-r border-gray-300">Склад</th>
                  <th className="p-3 border-r border-gray-300">Поставщик / Контрагент</th>
                  <th className="p-3 border-r border-gray-300 text-center w-24">Позиций</th>
                  <th className="p-3 border-r border-gray-300 text-right w-36">Сумма</th>
                  <th className="p-3 border-r border-gray-300 text-center w-28">Оплата</th>
                  <th className="p-3 border-r border-gray-300 text-center w-28">Статус</th>
                  <th className="p-3 text-center w-28">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs text-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-gray-500">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-amber-500" />
                      <span>Накладные загружаются...</span>
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-gray-400">
                      <FileText size={36} className="mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-gray-600">Накладные не найдены</p>
                      <p className="text-xs text-gray-400 mt-1">«+ СОЗДАТЬ НАКЛАДНУЮ» tugmasini bosib birinchi nakladnoyni yarating</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const isSelected = selectedIds.includes(inv.id);
                    return (
                      <tr
                        key={inv.id}
                        className={`hover:bg-[#F9FAFB] transition-colors ${
                          isSelected ? "bg-amber-50/60" : ""
                        }`}
                      >
                        <td className="p-3 text-center border-r border-gray-200">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(inv.id)}
                            className="rounded text-amber-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 border-r border-gray-200 font-bold text-gray-900 font-mono">
                          № {inv.number}
                        </td>
                        <td className="p-3 border-r border-gray-200 text-gray-600 whitespace-nowrap">
                          {inv.date}
                        </td>
                        <td className="p-3 border-r border-gray-200">
                          {inv.type === "incoming" && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Приход
                            </span>
                          )}
                          {inv.type === "transfer" && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 w-fit">
                              <ArrowRightLeft size={10} />
                              <span>Перемещение</span>
                            </span>
                          )}
                          {inv.type === "writeoff" && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 border border-red-200">
                              Списание
                            </span>
                          )}
                          {inv.type === "return" && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                              Возврат
                            </span>
                          )}
                        </td>
                        <td className="p-3 border-r border-gray-200 font-medium text-gray-800">
                          {inv.type === "transfer" ? (
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-gray-600">{inv.stockName}</span>
                              <span className="text-amber-500 font-bold">→</span>
                              <span className="text-blue-700 font-bold">{inv.targetStockName}</span>
                            </div>
                          ) : (
                            inv.stockName || "Основной склад"
                          )}
                        </td>
                        <td className="p-3 border-r border-gray-200 font-medium text-gray-800">
                          {inv.supplierName || "—"}
                        </td>
                        <td className="p-3 border-r border-gray-200 text-center font-semibold text-gray-700">
                          {inv.itemsCount || inv.items?.length || 0} поз.
                        </td>
                        <td className="p-3 border-r border-gray-200 text-right font-bold text-gray-900 font-mono">
                          {Number(inv.totalAmount).toLocaleString()} сум
                        </td>
                        <td className="p-3 border-r border-gray-200 text-center">
                          {inv.debtAmount > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              В долг ({Number(inv.debtAmount).toLocaleString()})
                            </span>
                          ) : inv.paidAmount > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Оплачено
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="p-3 border-r border-gray-200 text-center">
                          {inv.status === "conducted" && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
                              Проведена
                            </span>
                          )}
                          {inv.status === "draft" && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Черновик
                            </span>
                          )}
                          {inv.status === "cancelled" && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
                              Отменена
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setPreviewInvoice(inv);
                                setIsPrintModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            >
                              Детали
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(inv)}
                              title="Редактировать"
                              className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(inv.id)}
                              title="Удалить"
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Totals Bar */}
          <div className="bg-[#2B303A] text-white px-6 py-3 rounded-b flex flex-wrap items-center justify-between gap-4 text-xs font-semibold shadow shrink-0">
            <div className="flex items-center gap-6">
              <span>
                Всего накладных: <strong className="text-amber-400 text-sm">{filteredInvoices.length}</strong>
              </span>
              {selectedIds.length > 0 && (
                <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  Выбрано: <strong>{selectedIds.length}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-6 text-sm">
              <span className="text-gray-300">
                Оплачено: <strong className="text-emerald-400">{Number(totalPaidSum).toLocaleString()} сум</strong>
              </span>
              <span className="text-gray-300">
                Долг: <strong className="text-amber-400">{Number(totalDebtSum).toLocaleString()} сум</strong>
              </span>
              <span className="text-gray-200">
                Общая сумма: <strong className="text-white text-base font-mono underline decoration-amber-400">{Number(totalInvoicesSum).toLocaleString()} сум</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB 2: ОСТАТКИ НА СКЛАДАХ (LIVE STOCKS VIEW) */}
      {subTab === "stocks_remain" && (
        <div className="flex-1 flex flex-col min-h-0 p-6 overflow-hidden">
          <div className="bg-white border border-[#D9DDE2] rounded p-4 mb-4 flex items-center justify-between shadow-sm shrink-0">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Boxes className="text-amber-500" />
                <span>Текущие остатки сырья и товаров на складах</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Nalichie mahsulotlar ofitsiant POS tizimiga avtomatik ulanadi va hisobdan chiqariladi.
              </p>
            </div>
            <button
              onClick={fetchData}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={13} />
              <span>Обновить</span>
            </button>
          </div>

          <div className="flex-1 bg-white border border-[#D9DDE2] rounded overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F1F3F5] text-gray-700 text-xs uppercase font-bold sticky top-0 border-b border-gray-300 z-10">
                <tr>
                  <th className="p-3 border-r border-gray-300">Наименование сырья / товара</th>
                  <th className="p-3 border-r border-gray-300">Категория</th>
                  <th className="p-3 border-r border-gray-300 text-center w-24">Ед. изм.</th>
                  <th className="p-3 border-r border-gray-300 text-right w-32">Остаток</th>
                  <th className="p-3 border-r border-gray-300 text-right w-32">Мин. лимит</th>
                  <th className="p-3 border-r border-gray-300 text-right w-36">Цена закупки</th>
                  <th className="p-3 border-r border-gray-300 text-right w-36">Общая сумма</th>
                  <th className="p-3 text-center w-28">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs text-gray-800">
                {inventoryItems.map((item) => {
                  const isLow = item.quantity <= item.minLimit;
                  const itemTotalVal = item.quantity * item.costPrice;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-3 border-r border-gray-200 font-bold text-gray-900">
                        {item.name}
                      </td>
                      <td className="p-3 border-r border-gray-200 text-gray-600">
                        {item.category || "Общие"}
                      </td>
                      <td className="p-3 border-r border-gray-200 text-center font-medium">
                        {item.unit || "kg"}
                      </td>
                      <td className="p-3 border-r border-gray-200 text-right font-bold text-gray-900 font-mono text-sm">
                        {item.quantity}
                      </td>
                      <td className="p-3 border-r border-gray-200 text-right text-gray-500 font-mono">
                        {item.minLimit}
                      </td>
                      <td className="p-3 border-r border-gray-200 text-right font-mono">
                        {Number(item.costPrice).toLocaleString()} сум
                      </td>
                      <td className="p-3 border-r border-gray-200 text-right font-bold font-mono text-gray-900">
                        {Number(itemTotalVal).toLocaleString()} сум
                      </td>
                      <td className="p-3 text-center">
                        {isLow ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 flex items-center justify-center gap-1">
                            <AlertCircle size={10} />
                            <span>Мало</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            В норме
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB 3: ПОСТАВЩИКИ (SUPPLIERS MANAGEMENT) */}
      {subTab === "suppliers" && (
        <div className="flex-1 flex flex-col min-h-0 p-6 overflow-hidden">
          <div className="flex-1 bg-white border border-[#D9DDE2] rounded overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F1F3F5] text-gray-700 text-xs uppercase font-bold sticky top-0 border-b border-gray-300 z-10">
                <tr>
                  <th className="p-3 border-r border-gray-300">Компания / Поставщик</th>
                  <th className="p-3 border-r border-gray-300">Контактное лицо</th>
                  <th className="p-3 border-r border-gray-300">Телефон</th>
                  <th className="p-3 border-r border-gray-300">Адрес / ИНН</th>
                  <th className="p-3 border-r border-gray-300 text-right w-36">Баланс (Долг)</th>
                  <th className="p-3 text-center w-28">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs text-gray-800">
                {suppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-gray-50">
                    <td className="p-3 border-r border-gray-200 font-bold text-gray-900">
                      {sup.name}
                    </td>
                    <td className="p-3 border-r border-gray-200 text-gray-700">
                      {sup.contactPerson || "—"}
                    </td>
                    <td className="p-3 border-r border-gray-200 font-mono text-gray-700">
                      {sup.phone || "—"}
                    </td>
                    <td className="p-3 border-r border-gray-200 text-gray-600">
                      {sup.address || sup.inn || "—"}
                    </td>
                    <td className="p-3 border-r border-gray-200 text-right font-mono font-bold">
                      {sup.balance < 0 ? (
                        <span className="text-red-600">Qarz: {Math.abs(sup.balance).toLocaleString()} сум</span>
                      ) : sup.balance > 0 ? (
                        <span className="text-emerald-600">+{sup.balance.toLocaleString()} сум</span>
                      ) : (
                        <span className="text-gray-400">0 сум</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditSupplier(sup)}
                          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(sup.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT INVOICE (JOWI BUILDER) ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#2B303A] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-emerald-600 flex items-center justify-center font-bold text-white shadow">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingInvoice ? `Редактирование накладной № ${modalNumber}` : "Создание новой накладной"}
                  </h3>
                  <p className="text-xs text-gray-300">
                    O‘tkazilgan (Проведена) nakladnoylar zaxirani omborga darhol kirim qiladi.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-5">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Main Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Тип накладной:
                  </label>
                  <select
                    value={modalType}
                    onChange={(e) => setModalType(e.target.value as any)}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="incoming">Приходная (Приход на склад)</option>
                    <option value="transfer">Перемещение (Между складами)</option>
                    <option value="writeoff">Списание (Hisobdan chiqarish)</option>
                    <option value="return">Возврат поставщику</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Номер накладной:
                  </label>
                  <input
                    type="text"
                    value={modalNumber}
                    onChange={(e) => setModalNumber(e.target.value)}
                    placeholder="00125"
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs font-mono font-bold text-gray-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Дата и время:
                  </label>
                  <input
                    type="text"
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Warehouse */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {modalType === "transfer" ? "Склад-отправитель:" : "Целевой склад:"}
                  </label>
                  <select
                    value={modalStockId}
                    onChange={(e) => setModalStockId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500"
                  >
                    {stocks.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Target warehouse for transfer */}
                {modalType === "transfer" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Склад-получатель:
                    </label>
                    <select
                      value={modalTargetStockId}
                      onChange={(e) => setModalTargetStockId(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500"
                    >
                      {stocks.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Supplier for incoming/return */}
                {(modalType === "incoming" || modalType === "return") && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Поставщик:
                    </label>
                    <select
                      value={modalSupplierId}
                      onChange={(e) => setModalSupplierId(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500"
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Условия оплаты:
                  </label>
                  <select
                    value={modalPaymentMethod}
                    onChange={(e) => setModalPaymentMethod(e.target.value as any)}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="cash">Наличные (Naqd pul)</option>
                    <option value="transfer">Перечисление (Bank o‘tkazmasi)</option>
                    <option value="card">Банковская карта (Humo/Uzcard)</option>
                    <option value="debt">В долг / Консигнация (Nasiya)</option>
                  </select>
                </div>
              </div>

              {/* Items Table Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Товары / Сырье в накладной:
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>+ Добавить строку</span>
                  </button>
                </div>

                <div className="border border-gray-300 rounded overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300">
                      <tr>
                        <th className="p-2.5 w-10 text-center border-r border-gray-300">№</th>
                        <th className="p-2.5 border-r border-gray-300">Наименование товара / сырья</th>
                        <th className="p-2.5 border-r border-gray-300 w-24 text-center">Ед. изм.</th>
                        <th className="p-2.5 border-r border-gray-300 w-28 text-right">Кол-во</th>
                        <th className="p-2.5 border-r border-gray-300 w-32 text-right">Цена за ед.</th>
                        <th className="p-2.5 border-r border-gray-300 w-36 text-right">Сумма (UZS)</th>
                        <th className="p-2.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {modalItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-2 text-center border-r border-gray-200 text-gray-500 font-bold">
                            {idx + 1}
                          </td>
                          <td className="p-2 border-r border-gray-200">
                            <input
                              type="text"
                              list="inventory-suggestions"
                              placeholder="Masalan: Mol go'shti (Lahm), Coca-cola..."
                              value={item.name}
                              onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-emerald-500 font-medium"
                            />
                          </td>
                          <td className="p-2 border-r border-gray-200 text-center">
                            <select
                              value={item.unit}
                              onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded px-1.5 py-1.5 text-xs text-gray-800 text-center focus:outline-none focus:border-emerald-500"
                            >
                              <option value="kg">kg</option>
                              <option value="litr">litr</option>
                              <option value="dona">dona</option>
                              <option value="quti">quti</option>
                              <option value="porsiya">porsiya</option>
                              <option value="gramm">gramm</option>
                            </select>
                          </td>
                          <td className="p-2 border-r border-gray-200 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-right font-mono font-bold text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="p-2 border-r border-gray-200 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.price}
                              onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-right font-mono text-gray-900 focus:outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="p-2 border-r border-gray-200 text-right font-mono font-bold text-gray-900">
                            {Number(item.sum || 0).toLocaleString()} сум
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              disabled={modalItems.length === 1}
                              className={`p-1 rounded ${
                                modalItems.length === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              }`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Suggestions datalist */}
                <datalist id="inventory-suggestions">
                  {inventoryItems.map(inv => (
                    <option key={inv.id} value={inv.name} />
                  ))}
                </datalist>
              </div>

              {/* Comment / Note */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Примечание / Комментарий к накладной:
                </label>
                <input
                  type="text"
                  value={modalComment}
                  onChange={(e) => setModalComment(e.target.value)}
                  placeholder="Masalan: Shartnoma asosida kelgan go'sht partiyasi, qabul qiluvchi: Alisher..."
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Calculated Summary Card */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs text-amber-900 font-medium">Позиций: <strong>{modalItems.filter(i => i.name).length}</strong></span>
                  <span className="text-xs text-amber-900 font-medium ml-4">Общее кол-во: <strong>{modalItems.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0)}</strong></span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-600 block">Итоговая сумма накладной:</span>
                  <span className="text-xl font-black font-mono text-gray-900">
                    {modalItems.reduce((acc, i) => acc + (Number(i.sum) || 0), 0).toLocaleString()} UZS
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-gray-100 px-6 py-3 border-t border-gray-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-200 cursor-pointer"
              >
                Отмена
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveInvoice("draft")}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded shadow transition-all cursor-pointer"
                >
                  Сохранить как черновик
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleSaveInvoice("conducted")}
                  className="px-5 py-2 bg-[#2EB85C] hover:bg-[#28A745] text-white font-bold text-xs rounded shadow flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check size={16} className="stroke-[3]" />
                  <span>Провести накладную</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRINT / DETAILED PREVIEW OF INVOICE ================= */}
      {isPrintModalOpen && previewInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
            {/* Header */}
            <div className="bg-[#2B303A] text-white px-6 py-3 flex items-center justify-between shrink-0">
              <span className="text-sm font-bold flex items-center gap-2">
                <FileText size={16} />
                <span>Приходная накладная № {previewInvoice.number}</span>
              </span>
              <button onClick={() => setIsPrintModalOpen(false)} className="text-gray-300 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Printable Area */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar font-serif text-gray-900 bg-white">
              <div className="text-center pb-4 border-b-2 border-black mb-6">
                <h2 className="text-xl font-black uppercase tracking-wider">ПРИХОДНАЯ НАКЛАДНАЯ</h2>
                <p className="text-sm font-bold mt-1">№ {previewInvoice.number} от {previewInvoice.date}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-6 font-sans">
                <div className="space-y-1">
                  <p><strong>Склад:</strong> {previewInvoice.stockName || "Основной склад"}</p>
                  <p><strong>Поставщик:</strong> {previewInvoice.supplierName || "—"}</p>
                  <p><strong>Основание:</strong> {previewInvoice.comment || "Договор поставки"}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p><strong>Тип операции:</strong> {previewInvoice.type}</p>
                  <p><strong>Форма оплаты:</strong> {previewInvoice.paymentMethod}</p>
                  <p><strong>Статус:</strong> {previewInvoice.status === "conducted" ? "Проведена на склад" : "Черновик"}</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse border border-black text-xs font-sans mb-6">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 text-center w-8">№</th>
                    <th className="border border-black p-2 text-left">Наименование товара / сырья</th>
                    <th className="border border-black p-2 text-center w-16">Ед. изм.</th>
                    <th className="border border-black p-2 text-right w-20">Количество</th>
                    <th className="border border-black p-2 text-right w-24">Цена (сум)</th>
                    <th className="border border-black p-2 text-right w-28">Сумма (сум)</th>
                  </tr>
                </thead>
                <tbody>
                  {previewInvoice.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="border border-black p-2 text-center">{idx + 1}</td>
                      <td className="border border-black p-2 font-semibold">{it.name}</td>
                      <td className="border border-black p-2 text-center">{it.unit}</td>
                      <td className="border border-black p-2 text-right font-mono">{it.quantity}</td>
                      <td className="border border-black p-2 text-right font-mono">{Number(it.price).toLocaleString()}</td>
                      <td className="border border-black p-2 text-right font-mono font-bold">{Number(it.sum).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold font-sans">
                    <td colSpan={3} className="border border-black p-2 text-right">ИТОГО:</td>
                    <td className="border border-black p-2 text-right font-mono">{previewInvoice.totalQuantity}</td>
                    <td className="border border-black p-2"></td>
                    <td className="border border-black p-2 text-right font-mono text-sm">{Number(previewInvoice.totalAmount).toLocaleString()} сум</td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 text-xs font-sans pt-6 border-t border-gray-300">
                <div>
                  <p className="mb-6">Отпустил (Сдал): ___________________</p>
                  <p className="text-gray-500 text-[10px]">М.П. (Печать поставщика)</p>
                </div>
                <div className="text-right">
                  <p className="mb-6">Принял на склад: ___________________</p>
                  <p className="text-gray-500 text-[10px]">Заведующий складом / Бухгалтер</p>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="bg-gray-100 px-6 py-3 border-t border-gray-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-200"
              >
                Закрыть
              </button>

              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={15} />
                <span>Распечатать накладную</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT SUPPLIER ================= */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="bg-[#2B303A] text-white px-6 py-3 flex items-center justify-between">
              <span className="text-sm font-bold">
                {editingSupplier ? "Редактировать поставщика" : "Новый поставщик"}
              </span>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Название компании / Поставщика *</label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="OOO 'Food Logistics'..."
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Контактное лицо (Менеджер)</label>
                <input
                  type="text"
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                  placeholder="Jasur Alimov"
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Телефон</label>
                <input
                  type="text"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  placeholder="+998 71 200 00 00"
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Адрес / Город</label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  placeholder="Toshkent sh., Chilonzor..."
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">ИНН</label>
                <input
                  type="text"
                  value={supInn}
                  onChange={(e) => setSupInn(e.target.value)}
                  placeholder="302918273"
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded font-bold text-gray-700 hover:bg-gray-100"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow cursor-pointer"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
