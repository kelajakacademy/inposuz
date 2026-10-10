import React, { useState, useEffect } from "react";
import { 
  Printer, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  X, 
  AlertCircle,
  Wifi,
  Usb,
  Network,
  Bluetooth,
  FileText,
  UtensilsCrossed,
  Receipt,
  Wine,
  Settings,
  Check,
  Send
} from "lucide-react";
import { DeleteConfirmationModal } from "../common/DeleteConfirmationModal";

export interface PrinterDevice {
  id: string;
  name: string;
  type: "kitchen" | "cash" | "bar";
  connectionType: "lan" | "usb" | "bluetooth" | "wifi";
  ipAddress?: string;
  port?: number;
  paperWidth?: string;
  departmentId?: string;
  departmentName?: string;
  assignedCategories?: string[];
  status: "active" | "inactive";
  isDefault?: number;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface PrintersManagerProps {
  cafeId?: string;
}

export const PrintersManager: React.FC<PrintersManagerProps> = ({ cafeId = "default" }) => {
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterDevice | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [type, setType] = useState<"kitchen" | "cash" | "bar">("kitchen");
  const [connectionType, setConnectionType] = useState<"lan" | "usb" | "bluetooth" | "wifi">("lan");
  const [ipAddress, setIpAddress] = useState("192.168.1.100");
  const [port, setPort] = useState("9100");
  const [paperWidth, setPaperWidth] = useState("80mm");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [testPrintStatus, setTestPrintStatus] = useState<{ id: string; msg: string } | null>(null);

  const fetchPrintersAndCategories = async () => {
    setLoading(true);
    try {
      const [printersRes, catsRes] = await Promise.all([
        fetch("/api/printers", { headers: { "x-cafe-id": cafeId } }),
        fetch("/api/categories", { headers: { "x-cafe-id": cafeId } })
      ]);

      if (printersRes.ok) {
        const pData = await printersRes.json();
        setPrinters(pData);
      }
      if (catsRes.ok) {
        const cData = await catsRes.json();
        setCategories(cData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrintersAndCategories();
  }, [cafeId]);

  const handleOpenAdd = () => {
    setEditingPrinter(null);
    setName("");
    setType("kitchen");
    setConnectionType("lan");
    setIpAddress("192.168.1.100");
    setPort("9100");
    setPaperWidth("80mm");
    setSelectedCats([]);
    setStatus("active");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PrinterDevice) => {
    setEditingPrinter(p);
    setName(p.name);
    setType(p.type || "kitchen");
    setConnectionType(p.connectionType || "lan");
    setIpAddress(p.ipAddress || "192.168.1.100");
    setPort(String(p.port || 9100));
    setPaperWidth(p.paperWidth || "80mm");
    setSelectedCats(Array.isArray(p.assignedCategories) ? p.assignedCategories : []);
    setStatus(p.status === "inactive" ? "inactive" : "active");
    setModalError("");
    setIsModalOpen(true);
  };

  const toggleCategory = (catId: string) => {
    if (selectedCats.includes(catId)) {
      setSelectedCats(selectedCats.filter((c) => c !== catId));
    } else {
      setSelectedCats([...selectedCats, catId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError("Printer nomini kiriting");
      return;
    }

    setIsSaving(true);
    setModalError("");

    try {
      const payload = {
        name: name.trim(),
        type,
        connectionType,
        ipAddress: connectionType === "lan" || connectionType === "wifi" ? ipAddress.trim() : null,
        port: connectionType === "lan" || connectionType === "wifi" ? Number(port) || 9100 : null,
        paperWidth,
        assignedCategories: selectedCats,
        status
      };

      if (editingPrinter) {
        const res = await fetch(`/api/printers/${editingPrinter.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-cafe-id": cafeId
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchPrintersAndCategories();
        } else {
          setModalError("Printer parametrlarini saqlashda xatolik");
        }
      } else {
        const res = await fetch("/api/printers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cafe-id": cafeId
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchPrintersAndCategories();
        } else {
          setModalError("Printer qo'shishda xatolik yuz berdi");
        }
      }
    } catch (err) {
      setModalError("Serverga ulanishda xatolik");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({
    isOpen: false,
    id: "",
    name: ""
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteModal = (p: PrinterDevice) => {
    setDeleteModal({
      isOpen: true,
      id: p.id,
      name: p.name
    });
  };

  const handleExecuteDelete = async () => {
    if (!deleteModal.id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/printers/${deleteModal.id}`, {
        method: "DELETE",
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        fetchPrintersAndCategories();
        setDeleteModal({ isOpen: false, id: "", name: "" });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTestPrint = async (p: PrinterDevice) => {
    try {
      setTestPrintStatus({ id: p.id, msg: "Test chek yuborilmoqda..." });
      const res = await fetch(`/api/printers/${p.id}/test-print`, {
        method: "POST",
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        setTestPrintStatus({ id: p.id, msg: "✓ Test chek muvaffaqiyatli chiqarildi!" });
        setTimeout(() => setTestPrintStatus(null), 3500);
      }
    } catch (e) {
      setTestPrintStatus({ id: p.id, msg: "Aloqa xatosi!" });
      setTimeout(() => setTestPrintStatus(null), 3000);
    }
  };

  const getTypeBadge = (t: string) => {
    switch (t) {
      case "cash":
        return {
          label: "Kassa printeri (Chek)",
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: Receipt
        };
      case "bar":
        return {
          label: "Bar printeri (Ichimliklar)",
          color: "bg-purple-50 text-purple-700 border-purple-200",
          icon: Wine
        };
      case "kitchen":
      default:
        return {
          label: "Oshxona printeri (Kotyovka)",
          color: "bg-blue-50 text-blue-700 border-blue-200",
          icon: UtensilsCrossed
        };
    }
  };

  const getConnectionIcon = (c: string) => {
    switch (c) {
      case "usb":
        return <Usb size={14} className="text-gray-600" />;
      case "wifi":
        return <Wifi size={14} className="text-sky-600" />;
      case "bluetooth":
        return <Bluetooth size={14} className="text-indigo-600" />;
      case "lan":
      default:
        return <Network size={14} className="text-blue-600" />;
    }
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] p-6 lg:p-8 overflow-y-auto custom-scrollbar select-none text-[#1E293B]">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Printerlar
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Oshxona va kassa chek printerlarini ulash, IP manzil, qog'oz formati va mahsulotlar marshrutizatsiyasi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPrintersAndCategories}
            className="p-2 rounded-lg bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Yangilash"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-blue-600" : ""} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Printer qo'shish</span>
          </button>
        </div>
      </div>

      {testPrintStatus && (
        <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Send size={15} className="text-blue-600" />
          <span>{testPrintStatus.msg}</span>
        </div>
      )}

      {/* Main Content: If no printers, show clean empty state */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 text-xs">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
          <span>Printerlar yuklanmoqda...</span>
        </div>
      ) : printers.length === 0 ? (
        /* Empty State (User requirement: "printer qushilmagan bulsa printer chiqmasin ruyxatda") */
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-2xs my-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4 text-blue-600">
            <Printer size={32} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            Hozircha hech qanday printer ulanmagan
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
            Kassada mijozlar chekini chiqarish yoki oshxona va bar uchun yangi buyurtmalarni (kotyovka) avtomatik chop etish uchun printerni qo'shing.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Birinchi printerni qo'shish</span>
          </button>
        </div>
      ) : (
        /* Printers Table */
        <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Printer size={18} className="text-blue-600" />
              <h2 className="text-sm font-bold text-gray-900">Ulangan printerlar</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/60">
                {printers.length} ta
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">NOMI</th>
                  <th className="py-3 px-4">MAQSADI / TURI</th>
                  <th className="py-3 px-4">ULANISH</th>
                  <th className="py-3 px-4">BIRIKTIRILGAN BO'LIMLAR</th>
                  <th className="py-3 px-4">QOG'OZ</th>
                  <th className="py-3 px-4">HOLAT</th>
                  <th className="py-3 px-4 text-right">AMALLAR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800 font-medium">
                {printers.map((p) => {
                  const badge = getTypeBadge(p.type);
                  const BadgeIcon = badge.icon;
                  const isAct = p.status === "active";

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-gray-100 text-gray-700">
                          <Printer size={16} />
                        </div>
                        <span>{p.name}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.color}`}>
                          <BadgeIcon size={12} />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-gray-700">
                          {getConnectionIcon(p.connectionType)}
                          <span>
                            {(p.connectionType || 'LAN').toUpperCase()}: {p.ipAddress ? `${p.ipAddress}:${p.port || 9100}` : 'USB Port'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.type === "cash" ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                              Barcha to'lov cheklari
                            </span>
                          ) : p.assignedCategories && p.assignedCategories.length > 0 ? (
                            p.assignedCategories.map((cId) => {
                              const found = categories.find((c) => c.id === cId);
                              return (
                                <span
                                  key={cId}
                                  className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                                >
                                  {found?.name || cId}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                              Barcha taomlar
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-gray-600 text-xs">
                        {p.paperWidth || "80mm"}
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

                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleTestPrint(p)}
                          className="px-2 py-1 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border border-emerald-200"
                          title="Test chek chiqarish"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(p)}
                          className="p-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRINTER MODAL (MATCHING SCREENSHOT 2 & 3) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-lg p-6 text-[#1E293B] max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">
                  {editingPrinter ? "Printerni tahrirlash" : "Yangi printer qo'shish"}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Field 1: Printer Nomi */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Printer nomi
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Oshxona printeri (Issiq taomlar), Kassa printeri"
                  required
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              {/* Field 2: Kimning printeri / Qaysi maqsad uchun (Kassa yoki Oshxona) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Printer kimniki? (Kassagami yoki oshxonagami)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "kitchen", label: "Oshxona", sub: "Kotyovka / Runner", icon: UtensilsCrossed },
                    { id: "cash", label: "Kassa", sub: "Mijoz cheki / Prechek", icon: Receipt },
                    { id: "bar", label: "Bar", sub: "Ichimliklar & Kofe", icon: Wine }
                  ].map((item) => {
                    const ItemIcon = item.icon;
                    const isSelected = type === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setType(item.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-2xs"
                            : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <ItemIcon size={16} className={isSelected ? "text-blue-600" : "text-gray-500"} />
                          {isSelected && <Check size={14} className="text-blue-600 font-bold" />}
                        </div>
                        <div className="font-bold text-xs">{item.label}</div>
                        <div className="text-[10px] text-gray-500">{item.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 3: Ulanish turi (Connection Type) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Ulanish turi
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "lan", label: "LAN / Tarmoq", icon: Network },
                    { id: "usb", label: "USB kabel", icon: Usb },
                    { id: "wifi", label: "Wi-Fi", icon: Wifi },
                    { id: "bluetooth", label: "Bluetooth", icon: Bluetooth }
                  ].map((conn) => {
                    const ConnIcon = conn.icon;
                    const isSelected = connectionType === conn.id;
                    return (
                      <button
                        type="button"
                        key={conn.id}
                        onClick={() => setConnectionType(conn.id as any)}
                        className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/70 text-blue-900 font-bold"
                            : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                        }`}
                      >
                        <ConnIcon size={16} className={`mx-auto mb-1 ${isSelected ? "text-blue-600" : "text-gray-500"}`} />
                        <span className="text-[11px] block">{conn.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional: IP Address and Port if LAN / Wi-Fi */}
              {(connectionType === "lan" || connectionType === "wifi") && (
                <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Printer IP manzili
                    </label>
                    <input
                      type="text"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      placeholder="192.168.1.100"
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Port
                    </label>
                    <input
                      type="text"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      placeholder="9100"
                      className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              )}

              {/* Field 4: Qaysi mahsulotlar/kategoriyalar ushbu printerda chiqadi */}
              {type !== "cash" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ushbu printerda chop etiladigan taom kategoriyalari:
                  </label>
                  <p className="text-[11px] text-gray-500 mb-2">
                    Tanlangan kategoriyadagi taomlar buyurtma qilinganda ushbu printerdan kotyovka chiqadi:
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200 custom-scrollbar">
                    {categories.map((c) => {
                      const isChecked = selectedCats.includes(c.id);
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => toggleCategory(c.id)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                            isChecked
                              ? "bg-blue-600 text-white font-bold"
                              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {isChecked && <Check size={12} />}
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Field 5: Qog'oz kengligi & Holat */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Qog'oz kengligi
                  </label>
                  <select
                    value={paperWidth}
                    onChange={(e) => setPaperWidth(e.target.value)}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="80mm">80 mm (Standart POS)</option>
                    <option value="58mm">58 mm (Ixcham chek)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Holati
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Infaol</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  {isSaving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (2-rasmdagidek tasdiqlash oynasi) */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Printerni o'chirish"
        itemName={deleteModal.name}
        itemType="printer"
        message={`Haqiqatdan ham «${deleteModal.name}» printerini tizimdan o'chirib tashlamoqchimisiz? Ushbu printerga endi cheklar yo'naltirilmaydi.`}
        isDeleting={isDeleting}
        onConfirm={handleExecuteDelete}
        onClose={() => setDeleteModal({ isOpen: false, id: "", name: "" })}
      />
    </div>
  );
};
