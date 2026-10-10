import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  X, 
  AlertCircle,
  Banknote,
  Globe,
  Wallet
} from "lucide-react";

interface PaymentTypeItem {
  id: string;
  name: string;
  type: "cash" | "card" | "online" | "debt" | string;
  status: "active" | "inactive" | string;
}

interface PaymentTypesManagerProps {
  cafeId?: string;
}

export const PaymentTypesManager: React.FC<PaymentTypesManagerProps> = ({ cafeId = "default" }) => {
  const [payTypes, setPayTypes] = useState<PaymentTypeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentTypeItem | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"cash" | "card" | "online" | "debt">("cash");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const fetchPaymentTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payment-types", {
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        const data = await res.json();
        setPayTypes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentTypes();
  }, [cafeId]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName("");
    setType("cash");
    setStatus("active");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pt: PaymentTypeItem) => {
    setEditingItem(pt);
    setName(pt.name);
    setType((pt.type as any) || "cash");
    setStatus(pt.status === "inactive" ? "inactive" : "active");
    setModalError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError("To'lov turi nomini kiriting");
      return;
    }

    setIsSaving(true);
    setModalError("");

    try {
      const payload = { name: name.trim(), type, status };
      if (editingItem) {
        const res = await fetch(`/api/payment-types/${editingItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-cafe-id": cafeId
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchPaymentTypes();
        } else {
          setModalError("Saqlashda xatolik");
        }
      } else {
        const res = await fetch("/api/payment-types", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cafe-id": cafeId
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchPaymentTypes();
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

  const handleDelete = async (id: string) => {
    if (!confirm("Ushbu to'lov turini o'chirishni tasdiqlaysizmi?")) return;
    try {
      const res = await fetch(`/api/payment-types/${id}`, {
        method: "DELETE",
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        fetchPaymentTypes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getTypeLabel = (t: string) => {
    switch (t) {
      case "cash":
        return { label: "Naqd pul", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Banknote };
      case "card":
        return { label: "Plastik karta", color: "bg-blue-50 text-blue-700 border-blue-200", icon: CreditCard };
      case "online":
        return { label: "Onlayn / QR", color: "bg-purple-50 text-purple-700 border-purple-200", icon: Globe };
      case "debt":
        return { label: "Nasiya / Qarzsizlik", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Wallet };
      default:
        return { label: "Boshqa", color: "bg-gray-50 text-gray-700 border-gray-200", icon: CreditCard };
    }
  };

  return (
    <div className="flex-1 bg-[#F8FAFC] p-6 lg:p-8 overflow-y-auto custom-scrollbar select-none text-[#1E293B]">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            To'lov turlari
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Mijozlar buyurtma uchun to'lov qiladigan usullar (Naqd, Karta, Onlayn, Nasiya) va ularning holati
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPaymentTypes}
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
            <span>To'lov turini qo'shish</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-blue-600" />
            <h2 className="text-sm font-bold text-gray-900">Mavjud to'lov usullari</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/60">
              {payTypes.length} ta
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">NOMI</th>
                <th className="py-3 px-4">TURI / KATEGORIYA</th>
                <th className="py-3 px-4">HOLAT</th>
                <th className="py-3 px-4 text-right">AMALLAR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800 font-medium">
              {payTypes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    To'lov turlari topilmadi
                  </td>
                </tr>
              ) : (
                payTypes.map((pt) => {
                  const info = getTypeLabel(pt.type);
                  const Icon = info.icon;
                  const isAct = pt.status === "active";

                  return (
                    <tr key={pt.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                          <Icon size={16} />
                        </div>
                        <span>{pt.name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${info.color}`}>
                          <span>{info.label}</span>
                        </span>
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
                          onClick={() => handleOpenEdit(pt)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(pt.id)}
                          className="p-1.5 text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                          title="O'chirish"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md p-6 text-[#1E293B]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">
                {editingItem ? "To'lov turini tahrirlash" : "Yangi to'lov turini qo'shish"}
              </h3>
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
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  To'lov turi nomi
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Naqd pul, Uzcard / Humo, Payme"
                  required
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  To'lov xarakteri (Turi)
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="cash">Naqd pul (Cash)</option>
                  <option value="card">Plastik karta (Uzcard/Humo/Visa)</option>
                  <option value="online">Onlayn to'lov (Payme/Click/QR)</option>
                  <option value="debt">Nasiya / Hisobdan (Qarz)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Holati
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-600"
                >
                  <option value="active">Faol</option>
                  <option value="inactive">Infaol</option>
                </select>
              </div>

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
    </div>
  );
};
