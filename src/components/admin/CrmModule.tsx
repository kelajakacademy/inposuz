import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/utils";
import { Client, ClientGroup, ClientTransaction, LoyaltySettings, RfmSegmentSummary } from "../../types";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  CreditCard,
  Award,
  DollarSign,
  Gift,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  UserX,
  History,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  X,
  CheckCircle2,
  Tag,
  ShieldCheck,
  Send,
  RefreshCw,
  QrCode,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Heart,
  HelpCircle,
  Percent,
  Eye
} from "lucide-react";
import { DeleteConfirmationModal } from "../common/DeleteConfirmationModal";

interface CrmModuleProps {
  cafeId?: string;
}

type CrmSubTab = "clients" | "loyalty" | "debts_deposits" | "rfm" | "groups" | "marketing";

export const CrmModule: React.FC<CrmModuleProps> = ({ cafeId = "default" }) => {
  const [activeSubTab, setActiveSubTab] = useState<CrmSubTab>("clients");
  const [clients, setClients] = useState<Client[]>([]);
  const [groups, setGroups] = useState<ClientGroup[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  const [rfmSummary, setRfmSummary] = useState<RfmSegmentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("lastVisit");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Selected client detailed view
  const [activeClientDetail, setActiveClientDetail] = useState<{
    client: Client;
    transactions: ClientTransaction[];
    orders: any[];
  } | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Modals state
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceModalType, setBalanceModalType] = useState<"deposit" | "debt" | "bonus">("deposit");
  const [balanceModalAction, setBalanceModalAction] = useState<"add" | "spend" | "pay" | "deduct">("add");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceComment, setBalanceComment] = useState("");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ClientGroup | null>(null);

  // Client delete confirmation modal state
  const [deleteClientModal, setDeleteClientModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({
    isOpen: false,
    id: "",
    name: ""
  });
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  // Form states for new/edit client
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    cardNumber: "",
    groupId: "grp-regular",
    groupName: "Doimiy mijozlar",
    discountPercent: 0,
    cashbackPercent: 3,
    birthday: "",
    gender: "unspecified" as "male" | "female" | "unspecified",
    notes: "",
    status: "active" as "active" | "blocked"
  });

  // Marketing broadcast form state
  const [broadcastTarget, setBroadcastTarget] = useState("all");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastChannel, setBroadcastChannel] = useState<"telegram" | "sms">("telegram");
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedGroupId && selectedGroupId !== "all") params.append("groupId", selectedGroupId);
      if (selectedStatus && selectedStatus !== "all") params.append("status", selectedStatus);
      if (sortBy) params.append("sortBy", sortBy);

      const res = await fetch(`/api/clients?${params.toString()}`, {
        headers: { "x-cafe-id": cafeId }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setClients(data);
      }
    } catch (e) {
      console.error("Error fetching clients", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/client-groups", {
        headers: { "x-cafe-id": cafeId }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setGroups(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLoyaltySettings = async () => {
    try {
      const res = await fetch("/api/loyalty-settings", {
        headers: { "x-cafe-id": cafeId }
      });
      const data = await res.json();
      if (data) {
        setLoyaltySettings(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRfmSummary = async () => {
    try {
      const res = await fetch("/api/clients/rfm-analytics", {
        headers: { "x-cafe-id": cafeId }
      });
      const data = await res.json();
      if (data) {
        setRfmSummary(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchGroups();
    fetchLoyaltySettings();
    fetchRfmSummary();
  }, [cafeId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedGroupId, selectedStatus, sortBy]);

  const openClientDetails = async (client: Client) => {
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        headers: { "x-cafe-id": cafeId }
      });
      const data = await res.json();
      if (data && data.client) {
        setActiveClientDetail(data);
        setIsDetailDrawerOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    try {
      const selectedG = groups.find((g) => g.id === formData.groupId);
      const payload = {
        ...formData,
        groupName: selectedG ? selectedG.name : "Doimiy mijozlar"
      };

      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAddClientModalOpen(false);
        setFormData({
          name: "",
          phone: "",
          email: "",
          cardNumber: "",
          groupId: "grp-regular",
          groupName: "Doimiy mijozlar",
          discountPercent: 0,
          cashbackPercent: 3,
          birthday: "",
          gender: "unspecified",
          notes: "",
          status: "active"
        });
        fetchClients();
        fetchRfmSummary();
      } else {
        alert(data.error || "Mijozni saqlashda xatolik yuz berdi");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    try {
      const selectedG = groups.find((g) => g.id === formData.groupId);
      const payload = {
        ...formData,
        groupName: selectedG ? selectedG.name : "Doimiy mijozlar"
      };

      const res = await fetch(`/api/clients/${selectedClientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsEditClientModalOpen(false);
        fetchClients();
        if (activeClientDetail?.client.id === selectedClientId) {
          openClientDetails({ ...activeClientDetail.client, ...payload } as any);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openConfirmDeleteClient = (id: string, name: string) => {
    setDeleteClientModal({
      isOpen: true,
      id,
      name
    });
  };

  const handleConfirmDeleteClient = async () => {
    if (!deleteClientModal.id) return;
    setIsDeletingClient(true);
    try {
      const res = await fetch(`/api/clients/${deleteClientModal.id}`, {
        method: "DELETE",
        headers: { "x-cafe-id": cafeId }
      });
      if (res.ok) {
        if (selectedClientId === deleteClientModal.id) setSelectedClientId(null);
        if (activeClientDetail?.client.id === deleteClientModal.id) setIsDetailDrawerOpen(false);
        fetchClients();
        fetchRfmSummary();
        setDeleteClientModal({ isOpen: false, id: "", name: "" });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingClient(false);
    }
  };

  const handleBalanceOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !balanceAmount) return;

    const num = Number(balanceAmount);
    if (num <= 0) return;

    try {
      let endpoint = "";
      let payload: any = {
        amount: num,
        comment: balanceComment,
        waiterName: "Admin"
      };

      if (balanceModalType === "deposit") {
        endpoint = `/api/clients/${selectedClientId}/deposit`;
        payload.action = balanceModalAction === "spend" ? "spend" : "topup";
      } else if (balanceModalType === "debt") {
        endpoint = `/api/clients/${selectedClientId}/debt`;
        payload.action = balanceModalAction === "pay" ? "pay" : "add";
      } else if (balanceModalType === "bonus") {
        endpoint = `/api/clients/${selectedClientId}/bonus`;
        payload.action = balanceModalAction === "deduct" ? "deduct" : "add";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsBalanceModalOpen(false);
        setBalanceAmount("");
        setBalanceComment("");
        fetchClients();
        fetchRfmSummary();
        if (activeClientDetail?.client.id === selectedClientId) {
          openClientDetails(data.client);
        }
      } else {
        alert(data.error || "Amaliyot bajarilmadi");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveLoyaltySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loyaltySettings) return;

    try {
      const res = await fetch("/api/loyalty-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
        body: JSON.stringify(loyaltySettings)
      });
      if (res.ok) {
        alert("Sodiqlik dasturi sozlamalari muvaffaqiyatli saqlandi!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !editingGroup.name) return;

    try {
      const res = await fetch("/api/client-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
        body: JSON.stringify(editingGroup)
      });
      if (res.ok) {
        setIsGroupModalOpen(false);
        setEditingGroup(null);
        fetchGroups();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMarketing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    try {
      const res = await fetch("/api/clients/send-marketing-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetGroup: broadcastTarget,
          message: broadcastMessage,
          channel: broadcastChannel
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBroadcastSuccess(`Xabar ${data.sentCount} ta mijozga muvaffaqiyatli yuborildi!`);
        setBroadcastMessage("");
        setTimeout(() => setBroadcastSuccess(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Top total stats
  const totalClientsCount = clients.length;
  const totalBonusPool = clients.reduce((s, c) => s + (c.bonusBalance || 0), 0);
  const totalDepositPool = clients.reduce((s, c) => s + (c.depositBalance || 0), 0);
  const totalDebtPool = clients.reduce((s, c) => s + (c.debtBalance || 0), 0);
  const totalSpentAll = clients.reduce((s, c) => s + (c.totalSpent || 0), 0);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div className="flex-1 flex flex-col bg-[#ECEEF1] overflow-hidden text-gray-800">
      {/* 1. TOP SUB-NAV BAR (iNPOS CRM Style) */}
      <div className="bg-[#58606E] text-white px-4 py-1.5 flex items-center justify-between shadow-sm shrink-0 border-b border-[#434954]">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab("clients")}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "clients"
                ? "bg-[#ECEEF1] text-[#2B303A] font-bold shadow-sm"
                : "text-gray-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <Users size={14} />
            <span>Клиенты (База гостей)</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-[#00A3E0] text-white font-bold">
              {totalClientsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("loyalty")}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "loyalty"
                ? "bg-[#ECEEF1] text-[#2B303A] font-bold shadow-sm"
                : "text-gray-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <Award size={14} className="text-amber-300" />
            <span>Программа лояльности & Скидки</span>
          </button>

          <button
            onClick={() => setActiveSubTab("debts_deposits")}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "debts_deposits"
                ? "bg-[#ECEEF1] text-[#2B303A] font-bold shadow-sm"
                : "text-gray-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <CreditCard size={14} className="text-emerald-300" />
            <span>Депозиты и Долги</span>
            {totalDebtPool > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-rose-500 text-white font-bold animate-pulse">
                Долг: {formatCurrency(totalDebtPool)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("rfm")}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "rfm"
                ? "bg-[#ECEEF1] text-[#2B303A] font-bold shadow-sm"
                : "text-gray-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <TrendingUp size={14} className="text-sky-300" />
            <span>RFM & Аналитика гостей</span>
          </button>

          <button
            onClick={() => setActiveSubTab("groups")}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "groups"
                ? "bg-[#ECEEF1] text-[#2B303A] font-bold shadow-sm"
                : "text-gray-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <Tag size={14} className="text-violet-300" />
            <span>Группы клиентов</span>
          </button>

          <button
            onClick={() => setActiveSubTab("marketing")}
            className={`px-3 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "marketing"
                ? "bg-[#ECEEF1] text-[#2B303A] font-bold shadow-sm"
                : "text-gray-200 hover:text-white hover:bg-white/10"
            }`}
          >
            <Send size={14} className="text-blue-300" />
            <span>Рассылка & Telegram</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchClients();
              fetchRfmSummary();
            }}
            title="Yangilash"
            className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS (Top Bar) */}
      <div className="bg-white border-b border-[#D9DDE2] px-6 py-3 grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0">
        <div className="bg-[#F8F9FB] border border-[#E2E6EC] rounded p-2.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase">Всего клиентов</div>
            <div className="text-lg font-black text-gray-900">{totalClientsCount} <span className="text-xs text-gray-500 font-normal">гостей</span></div>
          </div>
        </div>

        <div className="bg-[#F8F9FB] border border-[#E2E6EC] rounded p-2.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Award size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase">Бонусный фонд</div>
            <div className="text-lg font-black text-amber-600">{formatCurrency(totalBonusPool)}</div>
          </div>
        </div>

        <div className="bg-[#F8F9FB] border border-[#E2E6EC] rounded p-2.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CreditCard size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase">Депозиты гостей</div>
            <div className="text-lg font-black text-emerald-600">{formatCurrency(totalDepositPool)}</div>
          </div>
        </div>

        <div className="bg-[#F8F9FB] border border-[#E2E6EC] rounded p-2.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase">Долги / На балансе</div>
            <div className="text-lg font-black text-rose-600">{formatCurrency(totalDebtPool)}</div>
          </div>
        </div>

        <div className="bg-[#F8F9FB] border border-[#E2E6EC] rounded p-2.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase">Сумма всех покупок</div>
            <div className="text-lg font-black text-gray-900">{formatCurrency(totalSpentAll)}</div>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT BASED ON ACTIVE SUB-TAB */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* ================= SUBTAB 1: CLIENTS LIST (Mijozlar ro'yxati) ================= */}
        {activeSubTab === "clients" && (
          <div className="flex-1 flex flex-col min-h-0 p-4 space-y-3 overflow-hidden">
            {/* Action Bar (matching Jowi buttons) */}
            <div className="flex flex-wrap items-center justify-between gap-2 shrink-0 bg-white p-2.5 rounded border border-[#D9DDE2] shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsAddClientModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#4CAF50] hover:bg-[#43A047] text-white text-xs font-bold rounded shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider"
                >
                  <Plus size={14} />
                  <span>ДОБАВИТЬ КЛИЕНТА</span>
                </button>

                <button
                  onClick={() => {
                    if (!selectedClient) {
                      alert("Iltimos, avval ro‘yxatdan mijozni tanlang!");
                      return;
                    }
                    setFormData({
                      name: selectedClient.name,
                      phone: selectedClient.phone,
                      email: selectedClient.email || "",
                      cardNumber: selectedClient.cardNumber || "",
                      groupId: selectedClient.groupId,
                      groupName: selectedClient.groupName,
                      discountPercent: selectedClient.discountPercent,
                      cashbackPercent: selectedClient.cashbackPercent,
                      birthday: selectedClient.birthday || "",
                      gender: selectedClient.gender || "unspecified",
                      notes: selectedClient.notes || "",
                      status: selectedClient.status
                    });
                    setIsEditClientModalOpen(true);
                  }}
                  disabled={!selectedClientId}
                  className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider ${
                    selectedClientId
                      ? "bg-[#ECEEF1] hover:bg-gray-300 text-gray-700 border border-gray-300"
                      : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
                  }`}
                >
                  <Edit2 size={13} />
                  <span>РЕДАКТИРОВАТЬ</span>
                </button>

                <button
                  onClick={() => {
                    if (selectedClient) {
                      openConfirmDeleteClient(selectedClient.id, selectedClient.name);
                    }
                  }}
                  disabled={!selectedClientId}
                  className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider ${
                    selectedClientId
                      ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                      : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
                  }`}
                >
                  <Trash2 size={13} />
                  <span>УДАЛИТЬ</span>
                </button>

                <div className="h-6 w-px bg-gray-300 mx-1" />

                {/* Balance operations */}
                <button
                  onClick={() => {
                    if (!selectedClient) {
                      alert("Avval mijozni tanlang!");
                      return;
                    }
                    setBalanceModalType("deposit");
                    setBalanceModalAction("add");
                    setIsBalanceModalOpen(true);
                  }}
                  disabled={!selectedClientId}
                  className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                    selectedClientId
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
                  }`}
                >
                  <CreditCard size={13} />
                  <span>Пополнить депозит</span>
                </button>

                <button
                  onClick={() => {
                    if (!selectedClient) {
                      alert("Avval mijozni tanlang!");
                      return;
                    }
                    setBalanceModalType("debt");
                    setBalanceModalAction("pay");
                    setIsBalanceModalOpen(true);
                  }}
                  disabled={!selectedClientId}
                  className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                    selectedClientId
                      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                      : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
                  }`}
                >
                  <DollarSign size={13} />
                  <span>Погасить долг</span>
                </button>

                <button
                  onClick={() => {
                    if (!selectedClient) {
                      alert("Avval mijozni tanlang!");
                      return;
                    }
                    setBalanceModalType("bonus");
                    setBalanceModalAction("add");
                    setIsBalanceModalOpen(true);
                  }}
                  disabled={!selectedClientId}
                  className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                    selectedClientId
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60"
                  }`}
                >
                  <Gift size={13} />
                  <span>Начислить бонусы</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск (Имя, Телефон, Карта)..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded bg-white w-56 focus:outline-none focus:border-[#00A3E0]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-[#00A3E0]"
                >
                  <option value="all">Все группы</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-[#00A3E0]"
                >
                  <option value="lastVisit">По последнему визиту</option>
                  <option value="totalSpent">По сумме покупок (VIP)</option>
                  <option value="totalVisits">По кол-ву визитов</option>
                  <option value="bonusBalance">По бонусам</option>
                  <option value="debtBalance">По долгам</option>
                  <option value="name">По алфавиту</option>
                </select>
              </div>
            </div>

            {/* Clients Table */}
            <div className="flex-1 bg-white border border-[#D9DDE2] rounded shadow-sm overflow-hidden flex flex-col min-h-0">
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#58606E] text-white font-bold sticky top-0 z-10 select-none shadow-sm">
                    <tr>
                      <th className="px-3 py-2.5 w-10 border-r border-[#4A515E] text-center">№</th>
                      <th className="px-3 py-2.5 border-r border-[#4A515E]">Клиент (ФИО)</th>
                      <th className="px-3 py-2.5 border-r border-[#4A515E]">Телефон</th>
                      <th className="px-3 py-2.5 border-r border-[#4A515E]">Номер карты / QR</th>
                      <th className="px-3 py-2.5 border-r border-[#4A515E]">Группа</th>
                      <th className="px-3 py-2.5 border-r border-[#4A515E] text-center">Скидка / Кешбэк</th>
                      <th className="px-3 py-2.5 border-r border-[#4A515E] text-right">Бонусы</th>
                      <th className="px-3 py-2.5 border-r border-[#4A515E] text-right">Депозит</th>
                      <th className="px-3 py-2.5 border-r border-[#4A515E] text-right">Долг</th>
                      <th className="px-3 py-2.5 border-r border-[#4A515E] text-center">Визиты</th>
                      <th className="px-3 py-2.5 border-r border-[#4A515E] text-right">Всего покупок</th>
                      <th className="px-3 py-2.5 border-r border-[#4A515E]">Последний визит</th>
                      <th className="px-3 py-2.5 text-center">Карточка</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="text-center py-12 text-gray-400">
                          <Users size={36} className="mx-auto mb-2 opacity-40" />
                          <p className="font-semibold">Mijozlar topilmadi</p>
                          <p className="text-xs text-gray-400 mt-0.5">Yangi mijoz qo‘shish uchun «Добавить клиента» tugmasini bosing</p>
                        </td>
                      </tr>
                    ) : (
                      clients.map((client, idx) => {
                        const isSelected = selectedClientId === client.id;
                        const clientGroup = groups.find((g) => g.id === client.groupId);
                        const groupColor = clientGroup?.color || "#3B82F6";

                        return (
                          <tr
                            key={client.id}
                            onClick={() => setSelectedClientId(client.id)}
                            onDoubleClick={() => openClientDetails(client)}
                            className={`cursor-pointer transition-colors select-none ${
                              isSelected
                                ? "bg-amber-100/90 font-medium text-gray-900 border-l-4 border-l-amber-500"
                                : idx % 2 === 0
                                ? "bg-white hover:bg-gray-50"
                                : "bg-[#F9FAFB] hover:bg-gray-50"
                            }`}
                          >
                            <td className="px-3 py-2 text-center text-gray-500 font-medium border-r border-gray-200">
                              {idx + 1}
                            </td>

                            <td className="px-3 py-2 font-bold text-gray-900 border-r border-gray-200">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 shadow-xs"
                                  style={{ backgroundColor: groupColor }}
                                >
                                  {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="leading-tight">{client.name}</div>
                                  {client.notes && (
                                    <div className="text-[10px] text-gray-400 truncate max-w-xs">{client.notes}</div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-3 py-2 text-gray-700 font-mono border-r border-gray-200">
                              {client.phone}
                            </td>

                            <td className="px-3 py-2 text-gray-600 font-mono border-r border-gray-200">
                              <span className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[11px] font-bold">
                                {client.cardNumber || "—"}
                              </span>
                            </td>

                            <td className="px-3 py-2 border-r border-gray-200">
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs inline-block"
                                style={{ backgroundColor: groupColor }}
                              >
                                {client.groupName || "Doimiy"}
                              </span>
                            </td>

                            <td className="px-3 py-2 text-center border-r border-gray-200">
                              <div className="inline-flex items-center gap-1.5 text-[11px]">
                                {client.discountPercent > 0 && (
                                  <span className="text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded">
                                    -{client.discountPercent}%
                                  </span>
                                )}
                                {client.cashbackPercent > 0 && (
                                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                    +{client.cashbackPercent}% кб
                                  </span>
                                )}
                                {client.discountPercent === 0 && client.cashbackPercent === 0 && (
                                  <span className="text-gray-400">0%</span>
                                )}
                              </div>
                            </td>

                            <td className="px-3 py-2 text-right font-bold text-amber-600 border-r border-gray-200">
                              {client.bonusBalance > 0 ? formatCurrency(client.bonusBalance) : "0"}
                            </td>

                            <td className="px-3 py-2 text-right font-bold text-emerald-600 border-r border-gray-200">
                              {client.depositBalance > 0 ? formatCurrency(client.depositBalance) : "0"}
                            </td>

                            <td className="px-3 py-2 text-right font-bold border-r border-gray-200">
                              {client.debtBalance > 0 ? (
                                <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                  {formatCurrency(client.debtBalance)}
                                </span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>

                            <td className="px-3 py-2 text-center font-bold text-gray-700 border-r border-gray-200">
                              {client.totalVisits || 0}
                            </td>

                            <td className="px-3 py-2 text-right font-black text-gray-900 border-r border-gray-200">
                              {formatCurrency(client.totalSpent || 0)}
                            </td>

                            <td className="px-3 py-2 text-gray-500 text-[11px] border-r border-gray-200">
                              {client.lastVisit
                                ? new Date(client.lastVisit).toLocaleDateString("ru-RU", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric"
                                  })
                                : "—"}
                            </td>

                            <td className="px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openClientDetails(client);
                                  }}
                                  className="p-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Tafsilotlar"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openConfirmDeleteClient(client.id, client.name);
                                  }}
                                  className="p-1.5 bg-rose-50 text-rose-600 hover:text-rose-800 hover:bg-rose-100 border border-rose-200 rounded transition-colors cursor-pointer"
                                  title="Mijozni o'chirish"
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

              {/* Table Footer Summary */}
              <div className="bg-[#ECEEF1] border-t border-[#D9DDE2] px-4 py-2 flex items-center justify-between text-xs font-semibold text-gray-600">
                <div>Показано клиентов: <span className="text-gray-900 font-bold">{clients.length}</span></div>
                <div className="flex items-center gap-6">
                  <div>Сумма покупок: <span className="text-gray-900 font-bold">{formatCurrency(totalSpentAll)}</span></div>
                  <div>Всего бонусов: <span className="text-amber-600 font-bold">{formatCurrency(totalBonusPool)}</span></div>
                  <div>Всего депозитов: <span className="text-emerald-600 font-bold">{formatCurrency(totalDepositPool)}</span></div>
                  <div>Всего долгов: <span className="text-rose-600 font-bold">{formatCurrency(totalDebtPool)}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SUBTAB 2: LOYALTY PROGRAM & DISCOUNTS (Sodiqlik dasturi) ================= */}
        {activeSubTab === "loyalty" && loyaltySettings && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-6">
              <form onSubmit={handleSaveLoyaltySettings} className="bg-white border border-[#D9DDE2] rounded shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                      <Award size={22} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Программа лояльности & Кешбэк iNPOS</h2>
                      <p className="text-xs text-gray-500">Avtomatik keshbek, bonuslar to‘plash va shaxsiy chegirmalar tizimi</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs font-bold text-gray-700">Tizim holati:</span>
                    <input
                      type="checkbox"
                      checked={Boolean(loyaltySettings.enabled)}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, enabled: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className={`text-xs font-bold ${loyaltySettings.enabled ? "text-emerald-600" : "text-gray-400"}`}>
                      {loyaltySettings.enabled ? "FAOL" : "O‘CHIRILGAN"}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" />
                      <span>Основные параметры начисления</span>
                    </h3>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Стандартный кешбэк (%) при закрытии счёта:
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={loyaltySettings.defaultCashbackPercent}
                          onChange={(e) => setLoyaltySettings({ ...loyaltySettings, defaultCashbackPercent: Number(e.target.value) })}
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Har bir yopilgan chek summasidan mijoz balansiga keshbek tushadi</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Максимальный % оплаты бонусами от суммы счёта:
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={loyaltySettings.maxBonusUsagePercent}
                          onChange={(e) => setLoyaltySettings({ ...loyaltySettings, maxBonusUsagePercent: Number(e.target.value) })}
                          min="1"
                          max="100"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Masalan: 50% bo‘lsa, 100 000 so‘mlik chekning 50 000 so‘mini bonus bilan to‘lash mumkin</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Курс бонуса (1 бонус = ? сум):
                      </label>
                      <input
                        type="number"
                        value={loyaltySettings.bonusToCurrencyRate}
                        onChange={(e) => setLoyaltySettings({ ...loyaltySettings, bonusToCurrencyRate: Number(e.target.value) })}
                        min="1"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Gift size={14} className="text-purple-500" />
                      <span>Приветственные и праздничные бонусы</span>
                    </h3>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Приветственный бонус (Welcome bonus при регистрации):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={loyaltySettings.welcomeBonus}
                          onChange={(e) => setLoyaltySettings({ ...loyaltySettings, welcomeBonus: Number(e.target.value) })}
                          min="0"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">UZS</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Yangi mijoz bazaga birinchi marta qo‘shilganda uning hisobiga tushadi</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Бонус на День рождения:
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={loyaltySettings.birthdayBonus}
                          onChange={(e) => setLoyaltySettings({ ...loyaltySettings, birthdayBonus: Number(e.target.value) })}
                          min="0"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">UZS</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Скидка в День рождения (%):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={loyaltySettings.birthdayDiscountPercent}
                          onChange={(e) => setLoyaltySettings({ ...loyaltySettings, birthdayDiscountPercent: Number(e.target.value) })}
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">Tug‘ilgan kunda va undan 3 kun oldin/keyin avtomatik qo‘llanadi</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#00A3E0] hover:bg-[#008BBF] text-white text-xs font-bold rounded shadow-sm transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    СОХРАНИТЬ НАСТРОЙКИ ЛОЯЛЬНОСТИ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= SUBTAB 3: DEBTS & DEPOSITS (Nasiyalar va Depozitlar) ================= */}
        {activeSubTab === "debts_deposits" && (
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Debtors (Qarzdorlar) */}
              <div className="bg-white border border-[#D9DDE2] rounded shadow-sm flex flex-col min-h-[400px]">
                <div className="px-4 py-3 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-rose-600" />
                    <h3 className="font-bold text-rose-900 text-sm">Должники / На балансе (Qarzdorlar)</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-800 text-xs font-bold">
                    Итого: {formatCurrency(totalDebtPool)}
                  </span>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar p-2">
                  <table className="w-full text-left text-xs">
                    <thead className="text-gray-500 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-2">Клиент</th>
                        <th className="py-2 px-2">Телефон</th>
                        <th className="py-2 px-2 text-right">Сумма долга</th>
                        <th className="py-2 px-2 text-center">Действие</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clients.filter((c) => (c.debtBalance || 0) > 0).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400">
                            <CheckCircle2 size={32} className="mx-auto mb-1 text-emerald-500 opacity-60" />
                            <span>Qarzdor mijozlar yo‘q</span>
                          </td>
                        </tr>
                      ) : (
                        clients
                          .filter((c) => (c.debtBalance || 0) > 0)
                          .map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50">
                              <td className="py-2.5 px-2 font-bold text-gray-900">{c.name}</td>
                              <td className="py-2.5 px-2 text-gray-600 font-mono">{c.phone}</td>
                              <td className="py-2.5 px-2 text-right font-black text-rose-600">
                                {formatCurrency(c.debtBalance)}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedClientId(c.id);
                                    setBalanceModalType("debt");
                                    setBalanceModalAction("pay");
                                    setBalanceAmount(String(c.debtBalance));
                                    setIsBalanceModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold shadow-xs cursor-pointer"
                                >
                                  Погасить
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: Deposits (Depozitlar) */}
              <div className="bg-white border border-[#D9DDE2] rounded shadow-sm flex flex-col min-h-[400px]">
                <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-emerald-600" />
                    <h3 className="font-bold text-emerald-900 text-sm">Депозитные счета гостей</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 text-xs font-bold">
                    Итого: {formatCurrency(totalDepositPool)}
                  </span>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar p-2">
                  <table className="w-full text-left text-xs">
                    <thead className="text-gray-500 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-2">Клиент</th>
                        <th className="py-2 px-2">Телефон</th>
                        <th className="py-2 px-2 text-right">Баланс депозита</th>
                        <th className="py-2 px-2 text-center">Действие</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clients.filter((c) => (c.depositBalance || 0) > 0).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400">
                            <span>Depozitda mablag‘ga ega mijozlar yo‘q</span>
                          </td>
                        </tr>
                      ) : (
                        clients
                          .filter((c) => (c.depositBalance || 0) > 0)
                          .map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50">
                              <td className="py-2.5 px-2 font-bold text-gray-900">{c.name}</td>
                              <td className="py-2.5 px-2 text-gray-600 font-mono">{c.phone}</td>
                              <td className="py-2.5 px-2 text-right font-black text-emerald-600">
                                {formatCurrency(c.depositBalance)}
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedClientId(c.id);
                                    setBalanceModalType("deposit");
                                    setBalanceModalAction("add");
                                    setIsBalanceModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs cursor-pointer"
                                >
                                  Пополнить
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
          </div>
        )}

        {/* ================= SUBTAB 4: RFM & GUEST ANALYTICS ================= */}
        {activeSubTab === "rfm" && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* RFM Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border-2 border-amber-400 rounded-xl p-5 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      VIP & Чемпионы
                    </span>
                    <Award className="text-amber-500" size={20} />
                  </div>
                  <div className="text-2xl font-black text-gray-900">{rfmSummary?.vipCount || 0} гостей</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Сумма покупок: <span className="font-bold text-gray-800">{formatCurrency(rfmSummary?.vipRevenue || 0)}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">Eng ko‘p tashrif buyuruvchi va eng yuqori chekka ega asosiy mehmonlar</p>
                </div>

                <div className="bg-white border-2 border-blue-400 rounded-xl p-5 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Постоянные гости
                    </span>
                    <UserCheck className="text-blue-500" size={20} />
                  </div>
                  <div className="text-2xl font-black text-gray-900">{rfmSummary?.regularCount || 0} гостей</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Сумма покупок: <span className="font-bold text-gray-800">{formatCurrency(rfmSummary?.regularRevenue || 0)}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">Muntazam kelib turuvchi ishonchli doimiy mijozlar bazasi</p>
                </div>

                <div className="bg-white border-2 border-emerald-400 rounded-xl p-5 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Новички
                    </span>
                    <Sparkles className="text-emerald-500" size={20} />
                  </div>
                  <div className="text-2xl font-black text-gray-900">{rfmSummary?.newCount || 0} гостей</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Сумма покупок: <span className="font-bold text-gray-800">{formatCurrency(rfmSummary?.newRevenue || 0)}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">Oxirgi 30 kunda birinchi marotaba tashrif buyurgan yangi mehmonlar</p>
                </div>

                <div className="bg-white border-2 border-rose-400 rounded-xl p-5 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      В зоне риска (Уснувшие)
                    </span>
                    <UserX className="text-rose-500" size={20} />
                  </div>
                  <div className="text-2xl font-black text-gray-900">{rfmSummary?.atRiskCount || 0} гостей</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Сумма покупок: <span className="font-bold text-gray-800">{formatCurrency(rfmSummary?.atRiskRevenue || 0)}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">Oxirgi 45+ kundan beri kelmagan mijozlar. Ularga promo taklif yuborish kerak</p>
                </div>
              </div>

              {/* Behavior Strategy recommendations */}
              <div className="bg-white border border-[#D9DDE2] rounded-lg p-6 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#00A3E0]" />
                  <span>Рекомендации CRM по удержанию и росту среднего чека</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                    <div className="font-bold text-amber-900 mb-1">⭐️ VIP guruh mehmonlari bilan ishlash:</div>
                    <p className="text-amber-800 leading-relaxed">
                      Ularga shaxsiy ofitsiant, eng qulay stollar (deraza oldi / VIP zallar) va doimiy 10% diskont yoki yuqori keshbek berish tavsiya etiladi.
                    </p>
                  </div>

                  <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg">
                    <div className="font-bold text-rose-900 mb-1">📢 «Уснувшие» (Yo‘qolib borayotgan) mijozlarni qaytarish:</div>
                    <p className="text-rose-800 leading-relaxed">
                      Telegram bot yoki SMS orqali «Sizni sog‘indik! Keyingi tashrifingizda bepul qahva yoki 15% chegirma sizni kutmoqda» aksiyasini yuboring.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SUBTAB 5: CLIENT GROUPS (Guruhlar) ================= */}
        {activeSubTab === "groups" && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Группы и категории клиентов</h2>
                  <p className="text-xs text-gray-500">Mijozlarni guruhlarga ajratish va guruh bo‘yicha chegirma belgilash</p>
                </div>
                <button
                  onClick={() => {
                    setEditingGroup({
                      id: "",
                      name: "",
                      discountPercent: 5,
                      cashbackPercent: 3,
                      color: "#3B82F6",
                      minSpend: 0
                    });
                    setIsGroupModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#4CAF50] hover:bg-[#43A047] text-white text-xs font-bold rounded shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>СОЗДАТЬ ГРУППУ</span>
                </button>
              </div>

              <div className="bg-white border border-[#D9DDE2] rounded shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#58606E] text-white font-bold">
                    <tr>
                      <th className="px-4 py-3 border-r border-[#4A515E]">Цвет</th>
                      <th className="px-4 py-3 border-r border-[#4A515E]">Название группы</th>
                      <th className="px-4 py-3 border-r border-[#4A515E] text-center">Скидка (%)</th>
                      <th className="px-4 py-3 border-r border-[#4A515E] text-center">Кешбэк (%)</th>
                      <th className="px-4 py-3 border-r border-[#4A515E] text-right">Порог покупок (UZS)</th>
                      <th className="px-4 py-3 border-r border-[#4A515E] text-center">Кол-во клиентов</th>
                      <th className="px-4 py-3 text-center">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {groups.map((g) => (
                      <tr key={g.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border-r border-gray-200">
                          <div className="w-5 h-5 rounded-full shadow-xs" style={{ backgroundColor: g.color }} />
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900 border-r border-gray-200">{g.name}</td>
                        <td className="px-4 py-3 text-center font-bold text-purple-700 border-r border-gray-200">
                          {g.discountPercent}%
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-700 border-r border-gray-200">
                          {g.cashbackPercent}%
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-800 border-r border-gray-200">
                          {formatCurrency(g.minSpend || 0)}
                        </td>
                        <td className="px-4 py-3 text-center font-bold border-r border-gray-200">
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px]">
                            {g.clientsCount || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingGroup(g);
                                setIsGroupModalOpen(true);
                              }}
                              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                              title="Tahrirlash"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`«${g.name}» guruhini o‘chirmoqchimisiz?`)) {
                                  await fetch(`/api/client-groups/${g.id}`, { method: "DELETE" });
                                  fetchGroups();
                                }
                              }}
                              className="p-1.5 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="O‘chirish"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= SUBTAB 6: MARKETING & BROADCAST (Xabarnomalar) ================= */}
        {activeSubTab === "marketing" && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-6">
              <form onSubmit={handleSendMarketing} className="bg-white border border-[#D9DDE2] rounded shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    <Send size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Рассылка акций и спецпредложений</h2>
                    <p className="text-xs text-gray-500">Mijozlarga Telegram bot yoki SMS orqali promo xabarlar yuborish</p>
                  </div>
                </div>

                {broadcastSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{broadcastSuccess}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Канал отправки:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setBroadcastChannel("telegram")}
                        className={`p-3 rounded border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          broadcastChannel === "telegram"
                            ? "bg-[#0088cc] text-white border-[#0088cc] shadow-xs"
                            : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        <Send size={15} />
                        <span>Telegram Bot (Бесплатно)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBroadcastChannel("sms")}
                        className={`p-3 rounded border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          broadcastChannel === "sms"
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                            : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        <Phone size={15} />
                        <span>SMS Xabarnoma</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Целевая аудитория (Сегмент):</label>
                    <select
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-[#00A3E0]"
                    >
                      <option value="all">Все зарегистрированные клиенты ({clients.length})</option>
                      <option value="grp-vip">Только VIP клиенты</option>
                      <option value="at_risk">Уснувшие клиенты (не были 45+ дней)</option>
                      <option value="birthdays">Именинники этого месяца</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Текст сообщения:</label>
                    <textarea
                      rows={4}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Masalan: Aziz do‘stimiz! Bugun iNPOS restoranimizda har bir steyk buyurtmasiga xonaki limonad sovg‘a qilinadi..."
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    <Send size={14} />
                    <span>ОТПРАВИТЬ РАССЫЛКУ</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ================= 4. CLIENT DETAIL PROFILE DRAWER (Mijozning to'liq kartasi) ================= */}
      {isDetailDrawerOpen && activeClientDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="bg-[#2B303A] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#00A3E0] text-white flex items-center justify-center font-black text-lg shadow-md">
                  {activeClientDetail.client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-black leading-tight">{activeClientDetail.client.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-300 font-mono">
                    <span>{activeClientDetail.client.phone}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-400" />
                    <span>Карта: {activeClientDetail.client.cardNumber || "—"}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Balances Summary Banner */}
            <div className="bg-[#F8F9FB] border-b border-[#E2E6EC] px-6 py-3.5 grid grid-cols-3 gap-3 shrink-0">
              <div className="bg-white border border-amber-200 rounded-lg p-2.5 text-center shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-amber-600">Бонусы</div>
                <div className="text-base font-black text-amber-600">
                  {formatCurrency(activeClientDetail.client.bonusBalance || 0)}
                </div>
              </div>

              <div className="bg-white border border-emerald-200 rounded-lg p-2.5 text-center shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-emerald-600">Депозит</div>
                <div className="text-base font-black text-emerald-600">
                  {formatCurrency(activeClientDetail.client.depositBalance || 0)}
                </div>
              </div>

              <div className="bg-white border border-rose-200 rounded-lg p-2.5 text-center shadow-2xs">
                <div className="text-[10px] uppercase font-bold text-rose-600">Долг (На балансе)</div>
                <div className="text-base font-black text-rose-600">
                  {formatCurrency(activeClientDetail.client.debtBalance || 0)}
                </div>
              </div>
            </div>

            {/* Quick Balance Operations */}
            <div className="px-6 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => {
                  setSelectedClientId(activeClientDetail.client.id);
                  setBalanceModalType("deposit");
                  setBalanceModalAction("add");
                  setIsBalanceModalOpen(true);
                }}
                className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <CreditCard size={13} />
                <span>+ Депозит</span>
              </button>

              <button
                onClick={() => {
                  setSelectedClientId(activeClientDetail.client.id);
                  setBalanceModalType("debt");
                  setBalanceModalAction("pay");
                  setIsBalanceModalOpen(true);
                }}
                className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <DollarSign size={13} />
                <span>Погасить долг</span>
              </button>

              <button
                onClick={() => {
                  setSelectedClientId(activeClientDetail.client.id);
                  setBalanceModalType("bonus");
                  setBalanceModalAction("add");
                  setIsBalanceModalOpen(true);
                }}
                className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Gift size={13} />
                <span>+ Бонусы</span>
              </button>
            </div>

            {/* Body: Profile details & Transaction History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Detailed Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="text-gray-500 font-medium">Группа клиентов:</div>
                  <div className="font-bold text-gray-900 mt-0.5">{activeClientDetail.client.groupName}</div>
                </div>

                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="text-gray-500 font-medium">Скидка / Кешбэк:</div>
                  <div className="font-bold text-purple-700 mt-0.5">
                    Скидка: {activeClientDetail.client.discountPercent}% | Кешбэк: {activeClientDetail.client.cashbackPercent}%
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="text-gray-500 font-medium">Всего визитов:</div>
                  <div className="font-bold text-gray-900 mt-0.5">{activeClientDetail.client.totalVisits || 0} раз</div>
                </div>

                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="text-gray-500 font-medium">Общая сумма покупок:</div>
                  <div className="font-bold text-gray-900 mt-0.5">{formatCurrency(activeClientDetail.client.totalSpent || 0)}</div>
                </div>

                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="text-gray-500 font-medium">День рождения:</div>
                  <div className="font-bold text-gray-900 mt-0.5">{activeClientDetail.client.birthday || "Не указан"}</div>
                </div>

                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="text-gray-500 font-medium">E-mail:</div>
                  <div className="font-bold text-gray-900 mt-0.5">{activeClientDetail.client.email || "—"}</div>
                </div>
              </div>

              {activeClientDetail.client.notes && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded text-xs">
                  <div className="font-bold text-blue-900 mb-0.5">ℹ️ Особые пожелания и примечания:</div>
                  <p className="text-blue-800 leading-relaxed">{activeClientDetail.client.notes}</p>
                </div>
              )}

              {/* Transactions History */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                  <History size={14} />
                  <span>История транзакций и начислений</span>
                </h3>

                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-600 font-bold border-b border-gray-200">
                      <tr>
                        <th className="py-2 px-2.5">Дата</th>
                        <th className="py-2 px-2.5">Тип</th>
                        <th className="py-2 px-2.5 text-right">Сумма</th>
                        <th className="py-2 px-2.5">Комментарий</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeClientDetail.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-gray-400">
                            Транзакции отсутствуют
                          </td>
                        </tr>
                      ) : (
                        activeClientDetail.transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-gray-50">
                            <td className="py-2 px-2.5 text-gray-500 text-[11px]">
                              {new Date(tx.createdAt).toLocaleDateString("ru-RU", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </td>
                            <td className="py-2 px-2.5">
                              {tx.type.includes("bonus") ? (
                                <span className="text-amber-600 font-bold">Бонусы</span>
                              ) : tx.type.includes("deposit") ? (
                                <span className="text-emerald-600 font-bold">Депозит</span>
                              ) : (
                                <span className="text-rose-600 font-bold">Долг</span>
                              )}
                            </td>
                            <td className="py-2 px-2.5 text-right font-bold">
                              {tx.type.includes("spend") || tx.type.includes("pay") ? (
                                <span className="text-rose-600">-{formatCurrency(tx.amount)}</span>
                              ) : (
                                <span className="text-emerald-600">+{formatCurrency(tx.amount)}</span>
                              )}
                            </td>
                            <td className="py-2 px-2.5 text-gray-600 text-[11px] truncate max-w-[150px]">
                              {tx.comment || "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. ADD / EDIT CLIENT MODAL ================= */}
      {(isAddClientModalOpen || isEditClientModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 border border-gray-300">
            <div className="bg-[#2B303A] text-white px-5 py-3 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Users size={16} className="text-[#00A3E0]" />
                <span>{isAddClientModalOpen ? "Добавление нового клиента" : "Редактирование клиента"}</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddClientModalOpen(false);
                  setIsEditClientModalOpen(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={isAddClientModalOpen ? handleCreateClient : handleUpdateClient}
              className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    ФИО Клиента <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masalan: Sardor Aliyev"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Телефон <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Номер карты / QR:</label>
                  <input
                    type="text"
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                    placeholder="BP-8801 (avto)"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Группа клиентов:</label>
                  <select
                    value={formData.groupId}
                    onChange={(e) => {
                      const grp = groups.find((g) => g.id === e.target.value);
                      setFormData({
                        ...formData,
                        groupId: e.target.value,
                        groupName: grp ? grp.name : "Doimiy mijozlar",
                        discountPercent: grp ? grp.discountPercent : formData.discountPercent,
                        cashbackPercent: grp ? grp.cashbackPercent : formData.cashbackPercent
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-[#00A3E0]"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">День рождения:</label>
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Индивидуальная скидка (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountPercent}
                    onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Индивидуальный кешбэк (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.cashbackPercent}
                    onChange={(e) => setFormData({ ...formData, cashbackPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Примечания / Предпочтения:</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Sevimli stoli, taomlari, allergiyalari..."
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddClientModalOpen(false);
                    setIsEditClientModalOpen(false);
                  }}
                  className="px-4 py-2 bg-[#F44336] hover:bg-[#D32F2F] text-white text-xs font-bold rounded cursor-pointer uppercase tracking-wider"
                >
                  ОТМЕНА
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4CAF50] hover:bg-[#43A047] text-white text-xs font-bold rounded shadow-sm cursor-pointer uppercase tracking-wider"
                >
                  {isAddClientModalOpen ? "СОЗДАТЬ" : "СОХРАНИТЬ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 6. BALANCE OPERATION MODAL (Deposit / Debt / Bonus) ================= */}
      {isBalanceModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 border border-gray-300">
            <div className="bg-[#2B303A] text-white px-5 py-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {balanceModalType === "deposit"
                  ? "Депозитная операция"
                  : balanceModalType === "debt"
                  ? "Операция с долгом"
                  : "Начисление / Списание бонусов"}
              </h3>
              <button onClick={() => setIsBalanceModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBalanceOperation} className="p-5 space-y-4">
              <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs">
                <div className="font-bold text-gray-900">{selectedClient.name}</div>
                <div className="text-gray-500 font-mono mt-0.5">{selectedClient.phone}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Сумма (UZS):</label>
                <input
                  type="number"
                  required
                  min="100"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="Masalan: 100000"
                  className="w-full px-3 py-2 text-sm font-bold border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Комментарий / Причина:</label>
                <input
                  type="text"
                  value={balanceComment}
                  onChange={(e) => setBalanceComment(e.target.value)}
                  placeholder="Kassaga naqd to'landi / Aksiyali bonus..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBalanceModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4CAF50] hover:bg-[#43A047] text-white text-xs font-bold rounded shadow-sm cursor-pointer uppercase tracking-wider"
                >
                  Выполнить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 7. CLIENT GROUP EDIT MODAL ================= */}
      {isGroupModalOpen && editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 border border-gray-300">
            <div className="bg-[#2B303A] text-white px-5 py-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingGroup.id ? "Редактирование группы" : "Создание новой группы клиентов"}
              </h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Название группы:</label>
                <input
                  type="text"
                  required
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  placeholder="Masalan: VIP Mehmonlar"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Скидка (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingGroup.discountPercent}
                    onChange={(e) => setEditingGroup({ ...editingGroup, discountPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Кешбэк (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingGroup.cashbackPercent}
                    onChange={(e) => setEditingGroup({ ...editingGroup, cashbackPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Цвет бейджа:</label>
                <input
                  type="color"
                  value={editingGroup.color || "#3B82F6"}
                  onChange={(e) => setEditingGroup({ ...editingGroup, color: e.target.value })}
                  className="w-full h-9 p-1 border border-gray-300 rounded cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4CAF50] hover:bg-[#43A047] text-white text-xs font-bold rounded shadow-sm cursor-pointer uppercase tracking-wider"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (2-rasmdagidek tasdiqlash oynasi) */}
      <DeleteConfirmationModal
        isOpen={deleteClientModal.isOpen}
        title="Mijozni o'chirish"
        itemName={deleteClientModal.name}
        itemType="mijoz"
        message={`Haqiqatdan ham «${deleteClientModal.name}» mijozini tizim va bazadan butunlay o'chirib tashlamoqchimisiz? Mijozning barcha to'plangan bonuslari, depoziti va tashriflar tarixi o'chiriladi.`}
        isDeleting={isDeletingClient}
        onConfirm={handleConfirmDeleteClient}
        onClose={() => setDeleteClientModal({ isOpen: false, id: "", name: "" })}
      />
    </div>
  );
};
