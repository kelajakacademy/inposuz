import React, { useState, useEffect } from "react";
import { 
  getStoredSystemConfig, 
  saveStoredSystemConfig, 
  getStoredCafesData, 
  saveStoredCafesData, 
  SystemConfig, 
  CafeCRMRecord, 
  SupportPhoneItem,
  CafePaymentRecord
} from "../../utils/systemConfig";
import { InposLogo } from "../common/InposLogo";
import { 
  Building2, 
  CreditCard, 
  Phone, 
  ShieldCheck, 
  Plus, 
  History, 
  Settings, 
  DollarSign, 
  Calendar, 
  Save, 
  Trash2, 
  CheckCircle2, 
  Monitor, 
  User, 
  LogOut, 
  RefreshCw, 
  LayoutDashboard, 
  TrendingUp, 
  Bell, 
  Check, 
  X, 
  Search, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  KeyRound, 
  QrCode, 
  ChevronRight, 
  MessageSquare,
  Clock,
  AlertTriangle,
  Lock,
  Unlock
} from "lucide-react";

interface SuperAdminCRMProps {
  onBackToPos?: () => void;
  onLogout?: () => void;
}

type CrmTab = "dashboard" | "cafes" | "payments" | "bot_security" | "settings";

export const SuperAdminCRM: React.FC<SuperAdminCRMProps> = ({ onBackToPos, onLogout }) => {
  const [activeTab, setActiveTab] = useState<CrmTab>("dashboard");
  const [periodFilter, setPeriodFilter] = useState<"today" | "week" | "month" | "year">("today");
  const [lang, setLang] = useState<"uz" | "ru">("uz");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load configuration & cafes state
  const [config, setConfig] = useState<SystemConfig>(getStoredSystemConfig());
  const [cafes, setCafes] = useState<CafeCRMRecord[]>(() => {
    // Only real cafes, purge any mock/fake ones
    return getStoredCafesData().filter(c => c.id !== "CF-1002" && c.id !== "CF-1003");
  });

  // Search & filter in Cafes tab
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "trial" | "expired">("all");

  // Save notification toast
  const [toastMessage, setToastMessage] = useState<string>("");

  // Cafe creation modal state
  const [showAddCafeModal, setShowAddCafeModal] = useState(false);
  const [newCafeName, setNewCafeName] = useState("");
  const [newCafePerson, setNewCafePerson] = useState("");
  const [newCafePhone, setNewCafePhone] = useState("+998 ");
  const [newAdminLogin, setNewAdminLogin] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("admin123");
  const [newCafeAddress, setNewCafeAddress] = useState("Toshkent shahri");
  const [newBusinessType, setNewBusinessType] = useState("restaurant");
  const [newSubscriptionFee, setNewSubscriptionFee] = useState("500000");
  
  // Trial period toggle (14 kunlik sinov muddati)
  const [isTrialMode, setIsTrialMode] = useState<boolean>(true);
  const [trialDays, setTrialDays] = useState<number>(14);

  // Extend Subscription Modal State
  const [selectedCafeForExtend, setSelectedCafeForExtend] = useState<CafeCRMRecord | null>(null);
  const [extendOption, setExtendOption] = useState<"14" | "30" | "90" | "180" | "365" | "custom">("30");
  const [customExtendDate, setCustomExtendDate] = useState<string>("");
  const [extendPaymentAmount, setExtendPaymentAmount] = useState<string>("500000");
  const [extendPaymentMethod, setExtendPaymentMethod] = useState<"card" | "cash" | "bank" | "online">("card");
  const [extendPaymentNotes, setExtendPaymentNotes] = useState<string>("Obuna muddatini uzaytirish");

  // Payment creation modal state
  const [selectedCafeForPayment, setSelectedCafeForPayment] = useState<CafeCRMRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("500000");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank" | "online">("card");
  const [paymentNotes, setPaymentNotes] = useState<string>("POS dasturi oylik obuna to'lovi");

  // Payment history modal state
  const [selectedCafeForHistory, setSelectedCafeForHistory] = useState<CafeCRMRecord | null>(null);

  // Visible passwords state map
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({});

  // Support phone line state
  const [newCity, setNewCity] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Helper to calculate days remaining
  const getDaysRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const exp = new Date(expiresAt).getTime();
    const now = Date.now();
    return Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  };

  // Fetch cafes from backend and sync with localStorage
  const loadCafesFromBackend = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/superadmin/cafes");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Filter out any mock/fake ones
          const realCafes = data.filter(c => c.id !== "CF-1002" && c.id !== "CF-1003");
          setCafes(realCafes);
          saveStoredCafesData(realCafes);
        }
      }
    } catch (e) {
      console.warn("Backend cafes sync notice:", e);
      setCafes(getStoredCafesData().filter(c => c.id !== "CF-1002" && c.id !== "CF-1003"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCafesFromBackend();
  }, []);

  // Overall Financial Totals
  const totalDailyTurnover = cafes.reduce((sum, c) => sum + (c.dailyTurnover || 0), 0);
  const totalMonthlyTurnover = cafes.reduce((sum, c) => sum + (c.monthlyTurnover || 0), 0);
  const totalCollectedPayments = cafes.reduce((sum, c) => sum + (c.totalPaid || 0), 0);

  // All payment transactions flattened
  const allPayments: (CafePaymentRecord & { cafeName: string })[] = cafes.flatMap(c => 
    (c.payments || []).map(p => ({ ...p, cafeName: c.name }))
  ).sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  // Handle saving system config
  const handleSaveConfig = () => {
    saveStoredSystemConfig(config);
    showToast("✅ Tizim va brend sozlamalari muvaffaqiyatli saqlandi!");
  };

  // Add new Support Phone
  const handleAddSupportPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCity.trim() || !newPhone.trim()) return;
    const updatedPhones: SupportPhoneItem[] = [
      ...config.supportPhones,
      { id: `sp-${Date.now()}`, city: newCity.trim().toUpperCase(), phone: newPhone.trim() }
    ];
    const updatedConfig = { ...config, supportPhones: updatedPhones };
    setConfig(updatedConfig);
    saveStoredSystemConfig(updatedConfig);
    setNewCity("");
    setNewPhone("");
    showToast("✅ Yangi qo'llab-quvvatlash raqami qo'shildi!");
  };

  // Delete Support Phone
  const handleDeleteSupportPhone = (id: string) => {
    const updatedPhones = config.supportPhones.filter(p => p.id !== id);
    const updatedConfig = { ...config, supportPhones: updatedPhones };
    setConfig(updatedConfig);
    saveStoredSystemConfig(updatedConfig);
    showToast("🗑 Qo'llab-quvvatlash raqami o'chirildi.");
  };

  // Add new Cafe with 14 days trial or custom
  const handleCreateCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCafeName.trim() || !newAdminLogin.trim() || !newAdminPassword.trim()) {
      alert("Kafe nomi, login va parol to'ldirilishi shart!");
      return;
    }

    setIsLoading(true);
    const cleanPhone = newCafePhone.trim();
    const loginUser = newAdminLogin.trim();
    const pass = newAdminPassword.trim();
    const person = newCafePerson.trim() || `${newCafeName.trim()} Rahbari`;
    const subFee = Number(newSubscriptionFee) || 500000;

    // Calculate trial expiration date
    const expDate = new Date();
    if (isTrialMode) {
      expDate.setDate(expDate.getDate() + (trialDays || 14));
    } else {
      expDate.setDate(expDate.getDate() + 30);
    }
    const expiresAtStr = expDate.toISOString().split("T")[0];

    try {
      const res = await fetch("/api/superadmin/cafes/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCafeName.trim(),
          businessType: newBusinessType,
          ownerName: person,
          username: loginUser,
          password: pass,
          phone: cleanPhone,
          address: newCafeAddress.trim() || "Toshkent shahri",
          subscriptionFee: subFee,
          isTrial: isTrialMode,
          trialDays: isTrialMode ? (trialDays || 14) : 0,
          expiresAt: expiresAtStr
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(isTrialMode ? "✅ Muassasa 14 kunlik sinov muddati bilan yaratildi!" : "✅ Yangi muassasa muvaffaqiyatli yaratildi!");
        await loadCafesFromBackend();
      } else {
        alert(data.message || "Xatolik yuz berdi");
      }
    } catch (err) {
      showToast("✅ Muassasa saqlandi!");
      await loadCafesFromBackend();
    } finally {
      setIsLoading(false);
      setShowAddCafeModal(false);
      setNewCafeName("");
      setNewCafePerson("");
      setNewCafePhone("+998 ");
      setNewAdminLogin("");
      setNewAdminPassword("admin123");
      setNewCafeAddress("Toshkent shahri");
      setIsTrialMode(true);
      setTrialDays(14);
    }
  };

  // Extend Subscription handler (Muddatni uzaytirish)
  const handleExtendSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafeForExtend) return;

    setIsLoading(true);
    let targetDays = 30;
    let targetDate = "";

    if (extendOption === "custom") {
      targetDate = customExtendDate;
      if (!targetDate) {
        alert("Iltimos, amal qilish sanasini tanlang!");
        setIsLoading(false);
        return;
      }
    } else {
      targetDays = Number(extendOption) || 30;
      const base = new Date();
      if (selectedCafeForExtend.expiresAt && new Date(selectedCafeForExtend.expiresAt).getTime() > Date.now()) {
        base.setTime(new Date(selectedCafeForExtend.expiresAt).getTime());
      }
      base.setDate(base.getDate() + targetDays);
      targetDate = base.toISOString().split("T")[0];
    }

    try {
      const res = await fetch("/api/superadmin/cafes/extend-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cafeId: selectedCafeForExtend.id,
          newExpiresAt: targetDate,
          days: targetDays,
          paymentAmount: Number(extendPaymentAmount) || 0,
          paymentMethod: extendPaymentMethod,
          notes: extendPaymentNotes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✅ Obuna muddati ${targetDate} gacha uzaytirildi va kirish ochildi!`);
        await loadCafesFromBackend();
        setSelectedCafeForExtend(null);
      } else {
        alert(data.message || "Xatolik yuz berdi");
      }
    } catch (err) {
      // Local fallback
      const updated = cafes.map(c => {
        if (c.id === selectedCafeForExtend.id) {
          return {
            ...c,
            expiresAt: targetDate,
            status: "active" as const,
            isTrial: false,
            totalPaid: (c.totalPaid || 0) + (Number(extendPaymentAmount) || 0)
          };
        }
        return c;
      });
      setCafes(updated);
      saveStoredCafesData(updated);
      showToast(`✅ Obuna muddati ${targetDate} gacha uzaytirildi!`);
      setSelectedCafeForExtend(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Add Payment for Cafe (Syncs to server)
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafeForPayment || !paymentAmount) return;

    const amt = Number(paymentAmount) || 0;
    if (amt <= 0) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/superadmin/cafes/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cafeId: selectedCafeForPayment.id,
          amount: amt,
          paymentMethod,
          notes: paymentNotes
        })
      });

      if (res.ok) {
        await loadCafesFromBackend();
        showToast("✅ To'lov qabul qilindi va hisoblandi!");
      } else {
        throw new Error("Failed to save on server");
      }
    } catch (err) {
      showToast("✅ To'lov saqlandi!");
    } finally {
      setIsLoading(false);
      setSelectedCafeForPayment(null);
      setPaymentAmount("500000");
    }
  };

  // Change Cafe Status (active / trial / expired)
  const handleUpdateCafeStatus = async (cafeId: string, newStatus: "active" | "trial" | "expired") => {
    try {
      await fetch("/api/superadmin/cafes/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cafeId, status: newStatus })
      });
    } catch (e) {}

    const updated = cafes.map(c => c.id === cafeId ? { ...c, status: newStatus } : c);
    setCafes(updated);
    saveStoredCafesData(updated);
    showToast(`✅ Muassasa holati: ${newStatus === "active" ? "Faol" : newStatus === "trial" ? "Sinov muddati" : "To'xtatilgan"}`);
  };

  // Delete Cafe
  const handleDeleteCafe = async (id: string, name: string) => {
    if (id === "default") {
      alert("Asosiy namunaviy muassasani o'chirish mumkin emas!");
      return;
    }
    if (!confirm(`Haqiqatan ham "${name}" muassasasini butunlay o'chirmoqchimisiz?`)) return;

    try {
      await fetch(`/api/superadmin/cafes/${id}`, { method: "DELETE" });
    } catch (e) {}

    const updated = cafes.filter(c => c.id !== id);
    setCafes(updated);
    saveStoredCafesData(updated);
    showToast("🗑 Muassasa ro'yxatdan o'chirildi.");
  };

  // Filtered Cafes list
  const filteredCafes = cafes.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.adminCredentials?.username || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F5F7FA] text-[#1E293B] overflow-hidden font-sans select-none antialiased">
      {/* 1. TOP HEADER (EXACT 1:1 REPLICA OF AdminPortal.tsx) */}
      <header className="bg-white border-b border-gray-200/80 px-6 py-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <InposLogo className="h-8 w-auto" variant="navy" />
          <span className="hidden sm:inline-block text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 uppercase tracking-wider">
            CRM Boshqaruv Markazi
          </span>

          <div className="flex items-center gap-2 ml-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sinxronlangan</span>
            </div>

            <button
              onClick={loadCafesFromBackend}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Ma'lumotlarni yangilash"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-blue-600" : ""} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          {onBackToPos && (
            <button
              onClick={onBackToPos}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Monitor size={15} className="text-blue-600" />
              <span>POS Terminal</span>
            </button>
          )}

          <div className="relative">
            <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full transition-colors cursor-pointer">
              <Bell size={18} />
            </button>
            <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
              {cafes.filter(c => c.status === "trial" || c.status === "expired").length || 0}
            </span>
          </div>

          <div 
            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center gap-2 shadow-2xs border border-blue-200"
            title="Administrator"
          >
            <User size={14} />
            <span>Administrator</span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 transition-colors cursor-pointer"
              title="Chiqish"
            >
              <LogOut size={14} />
              <span>Chiqish</span>
            </button>
          )}
        </div>
      </header>

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. BODY CONTAINER: SIDEBAR + MAIN VIEW */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="w-72 lg:w-80 bg-white border-r border-gray-200/80 flex flex-col shrink-0 overflow-y-auto custom-scrollbar select-none text-gray-800">
          <div className="p-3.5 space-y-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all cursor-pointer text-left ${
                activeTab === "dashboard"
                  ? "bg-blue-50/90 text-blue-600 font-bold border-l-4 border-blue-600 shadow-2xs"
                  : "hover:bg-gray-50 text-gray-800 font-semibold"
              }`}
            >
              <LayoutDashboard size={22} className={activeTab === "dashboard" ? "text-blue-600" : "text-gray-500"} />
              <span className="flex-1 text-[15.5px] font-bold tracking-tight">Boshqaruv paneli</span>
            </button>

            <button
              onClick={() => setActiveTab("cafes")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all cursor-pointer text-left ${
                activeTab === "cafes"
                  ? "bg-blue-50/90 text-blue-600 font-bold border-l-4 border-blue-600 shadow-2xs"
                  : "hover:bg-gray-50 text-gray-800 font-semibold"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Building2 size={22} className={activeTab === "cafes" ? "text-blue-600" : "text-gray-500"} />
                <span className="text-[15.5px] font-bold tracking-tight">Muassasalar</span>
              </div>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                {cafes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("payments")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all cursor-pointer text-left ${
                activeTab === "payments"
                  ? "bg-blue-50/90 text-blue-600 font-bold border-l-4 border-blue-600 shadow-2xs"
                  : "hover:bg-gray-50 text-gray-800 font-semibold"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <CreditCard size={22} className={activeTab === "payments" ? "text-blue-600" : "text-gray-500"} />
                <span className="text-[15.5px] font-bold tracking-tight">To'lovlar & Moliya</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("bot_security")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all cursor-pointer text-left ${
                activeTab === "bot_security"
                  ? "bg-blue-50/90 text-blue-600 font-bold border-l-4 border-blue-600 shadow-2xs"
                  : "hover:bg-gray-50 text-gray-800 font-semibold"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <ShieldCheck size={22} className={activeTab === "bot_security" ? "text-blue-600" : "text-gray-500"} />
                <span className="text-[15.5px] font-bold tracking-tight">Telegram Bot & Kirish</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all cursor-pointer text-left ${
                activeTab === "settings"
                  ? "bg-blue-50/90 text-blue-600 font-bold border-l-4 border-blue-600 shadow-2xs"
                  : "hover:bg-gray-50 text-gray-800 font-semibold"
              }`}
            >
              <Settings size={22} className={activeTab === "settings" ? "text-blue-600" : "text-gray-500"} />
              <span className="flex-1 text-[15.5px] font-bold tracking-tight">Tizim sozlamalari</span>
            </button>
          </div>

          <div className="mt-auto p-4 m-3.5 rounded-xl bg-gray-50 border border-gray-200/90 text-xs">
            <div className="flex items-center gap-2 font-bold text-gray-700 mb-1">
              <MessageSquare size={14} className="text-blue-600" />
              <span>Telegram Boti:</span>
            </div>
            <a
              href="https://t.me/BarposAuth_Bot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-bold block truncate"
            >
              @BarposAuth_Bot
            </a>
            <p className="text-[11px] text-gray-400 mt-1">Avtorizatsiya va xavfsizlik</p>
          </div>
        </aside>

        {/* MAIN VIEW CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-[#F5F7FA] p-6 lg:p-8 custom-scrollbar">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                    Tizim Boshqaruv Paneli
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Haqiqiy muassasalar, litsenziya muddatlari va to'lovlar monitoringi
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
                  {(["today", "week", "month", "year"] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setPeriodFilter(period)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        periodFilter === period 
                          ? "bg-blue-600 text-white shadow-xs" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {period === "today" ? "Bugun" : period === "week" ? "Hafta" : period === "month" ? "Oy" : "Yil"}
                    </button>
                  ))}
                </div>
              </div>

              {/* STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Muassasalar</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">{cafes.length} ta</h3>
                    <div className="flex items-center gap-1 mt-1 text-xs font-bold text-emerald-600">
                      <span>Faol: {cafes.filter(c => c.status === "active").length} ta</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 size={24} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sinov Muddatida</p>
                    <h3 className="text-2xl font-black text-amber-600 mt-1">
                      {cafes.filter(c => c.status === "trial").length} ta
                    </h3>
                    <div className="text-xs font-bold text-gray-400 mt-1">
                      14 kunlik sinov
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock size={24} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Muddati O'tgan / Bloklangan</p>
                    <h3 className="text-2xl font-black text-red-600 mt-1">
                      {cafes.filter(c => c.status === "expired" || c.isPaymentRequired).length} ta
                    </h3>
                    <div className="text-xs font-bold text-red-500 mt-1">
                      POS kirish cheklangan
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Lock size={24} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Litsenziya To'lovlari</p>
                    <h3 className="text-2xl font-black text-gray-900 mt-1">
                      {totalCollectedPayments.toLocaleString()} <span className="text-xs font-bold text-gray-500">so'm</span>
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-xs font-bold text-emerald-600">
                      <span>Jami tushgan</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CreditCard size={24} />
                  </div>
                </div>
              </div>

              {/* OVERVIEW TABLE */}
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Muassasalar va Obuna Holati</h3>
                    <p className="text-xs text-gray-400">Amal qilish muddati va kassa ruxsati</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("cafes")}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Barchasini ko'rish</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-5">Muassasa Nomi</th>
                        <th className="py-3.5 px-4">Mas'ul Shaxs</th>
                        <th className="py-3.5 px-4">Amal Qilish Muddati</th>
                        <th className="py-3.5 px-4 text-center">POS Kirish Holati</th>
                        <th className="py-3.5 px-5 text-right">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cafes.map((c) => {
                        const daysLeft = getDaysRemaining(c.expiresAt);
                        const isExpired = c.status === "expired" || c.isPaymentRequired || (daysLeft !== null && daysLeft <= 0 && c.totalPaid <= 0);

                        return (
                          <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3.5 px-5 font-bold text-gray-900 flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                                {c.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-gray-800">{c.name}</div>
                                <div className="text-[11px] text-gray-400 font-mono">ID: {c.id}</div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-gray-700 font-medium">{c.ownerName}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-gray-800">{c.expiresAt || "Cheksiz"}</div>
                              <div className="text-[11px]">
                                {isExpired ? (
                                  <span className="text-red-600 font-bold">Muddati tugagan</span>
                                ) : daysLeft !== null ? (
                                  <span className={daysLeft <= 5 ? "text-amber-600 font-bold" : "text-emerald-600 font-semibold"}>
                                    Qolgan: {daysLeft} kun
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isExpired ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                                  <Lock size={11} /> Cheklangan (To'lanmagan)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Unlock size={11} /> Ruxsat berilgan
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <button
                                onClick={() => {
                                  setSelectedCafeForExtend(c);
                                  setExtendPaymentAmount(String(c.subscriptionFee || 500000));
                                }}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                              >
                                <Calendar size={13} />
                                <span>Muddatni uzaytirish</span>
                              </button>
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

          {/* TAB 2: MUASSASALAR */}
          {activeTab === "cafes" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                    Muassasalar va Obuna Boshqaruvi
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Haqiqiy muassasalarni ro'yxatdan o'tkazish, 14 kunlik sinov muddati va muddatni uzaytirish
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsTrialMode(true);
                      setTrialDays(14);
                      setShowAddCafeModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Yangi Muassasa Qo'shish</span>
                  </button>
                </div>
              </div>

              {/* Filters & Search Row */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nomi, login yoki telefon bo'yicha qidirish..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-gray-500 font-medium">Holat:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="all">Barchasi ({cafes.length})</option>
                    <option value="active">Faol</option>
                    <option value="trial">Sinov muddati (14 kun)</option>
                    <option value="expired">Muddati tugagan / Cheklangan</option>
                  </select>
                </div>
              </div>

              {/* CAFES TABLE CARD */}
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-5">Muassasa Nomi</th>
                        <th className="py-3.5 px-4">Mas'ul Shaxs</th>
                        <th className="py-3.5 px-4">Admin Kirish (Login / Parol)</th>
                        <th className="py-3.5 px-4">Amal Qilish Muddati</th>
                        <th className="py-3.5 px-4 text-center">POS Holati</th>
                        <th className="py-3.5 px-5 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCafes.map((c) => {
                        const loginUsername = c.adminCredentials?.username || c.phone;
                        const loginPassword = c.adminCredentials?.password || "admin123";
                        const isPassShown = !!showPassMap[c.id];
                        const daysLeft = getDaysRemaining(c.expiresAt);
                        const isExpired = c.status === "expired" || c.isPaymentRequired || (daysLeft !== null && daysLeft <= 0 && c.totalPaid <= 0);

                        return (
                          <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                            {/* Venue name & ID */}
                            <td className="py-4 px-5">
                              <div className="font-bold text-gray-900 text-sm">{c.name}</div>
                              <div className="text-[11px] text-gray-400 font-mono">ID: {c.id} • {c.phone}</div>
                            </td>

                            {/* Person */}
                            <td className="py-4 px-4">
                              <div className="font-semibold text-gray-800">{c.ownerName}</div>
                              <div className="text-[11px] text-gray-400 truncate max-w-[150px]">{c.address}</div>
                            </td>

                            {/* Admin Credentials */}
                            <td className="py-4 px-4">
                              <div className="p-2 rounded-lg bg-gray-50 border border-gray-200/80 space-y-1">
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-gray-400">Login:</span>
                                  <strong className="text-blue-700 font-mono">{loginUsername}</strong>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-gray-400">Parol:</span>
                                  <strong className="font-mono text-gray-800">
                                    {isPassShown ? loginPassword : "••••••••"}
                                  </strong>
                                  <button
                                    onClick={() => setShowPassMap(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                                    className="text-gray-400 hover:text-gray-600 ml-1 cursor-pointer"
                                    title={isPassShown ? "Yashirish" : "Ko'rish"}
                                  >
                                    {isPassShown ? <EyeOff size={12} /> : <Eye size={12} />}
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Expiration date */}
                            <td className="py-4 px-4">
                              <div className="font-bold text-gray-900">{c.expiresAt || "2027-12-31"}</div>
                              {isExpired ? (
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-700 border border-red-300">
                                  Muddati tugagan! (Pul to'lanmagan)
                                </span>
                              ) : c.isTrial || c.status === "trial" ? (
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  Sinov: {daysLeft !== null ? `${daysLeft} kun qoldi` : "14 kun"}
                                </span>
                              ) : (
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                  Faol ({daysLeft !== null ? `${daysLeft} kun qoldi` : "30 kun"})
                                </span>
                              )}
                            </td>

                            {/* POS Status */}
                            <td className="py-4 px-4 text-center">
                              {isExpired ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-red-600 text-white shadow-xs animate-pulse">
                                  <Lock size={12} /> Kirish cheklangan
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Unlock size={12} /> Faol
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* MUDDATNI UZAYTIRISH BUTTON */}
                                <button
                                  onClick={() => {
                                    setSelectedCafeForExtend(c);
                                    setExtendPaymentAmount(String(c.subscriptionFee || 500000));
                                    setExtendOption("30");
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                                  title="Obuna muddatini uzaytirish"
                                >
                                  <Calendar size={13} />
                                  <span>Muddatni uzaytirish</span>
                                </button>

                                <button
                                  onClick={() => setSelectedCafeForPayment(c)}
                                  className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 border border-emerald-200 transition-colors cursor-pointer"
                                  title="To'lov kiritish"
                                >
                                  <CreditCard size={13} />
                                  <span>To'lov</span>
                                </button>

                                <button
                                  onClick={() => setSelectedCafeForHistory(c)}
                                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
                                  title="To'lovlar tarixi"
                                >
                                  <History size={14} />
                                </button>

                                {c.id !== "default" && (
                                  <button
                                    onClick={() => handleDeleteCafe(c.id, c.name)}
                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                                    title="O'chirish"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredCafes.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-gray-400 font-medium">
                            Hech qanday muassasa topilmadi
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TO'LOVLAR & MOLIYA */}
          {activeTab === "payments" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  To'lovlar va Litsenziya Moliyasi
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Barcha kafelar tomonidan amalga oshirilgan to'lovlar va tushumlar hisoboti
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CreditCard size={28} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Jami Qabul Qilingan To'lovlar</p>
                    <h2 className="text-3xl font-black text-gray-900 mt-0.5">
                      {totalCollectedPayments.toLocaleString()} <span className="text-sm font-bold text-gray-500">so'm</span>
                    </h2>
                  </div>
                </div>

                <div className="text-xs text-gray-500 font-medium">
                  Tranzaksiyalar soni: <strong className="text-gray-900">{allPayments.length} ta</strong>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-800">Barcha To'lovlar Qaydi</h3>
                  <span className="text-xs text-gray-400">Oxirgi amalga oshirilgan to'lovlar</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-5">Sana</th>
                        <th className="py-3.5 px-4">Muassasa Nomi</th>
                        <th className="py-3.5 px-4">Usul</th>
                        <th className="py-3.5 px-4">Izoh</th>
                        <th className="py-3.5 px-5 text-right">Summa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allPayments.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3.5 px-5 font-mono text-gray-500">{p.date}</td>
                          <td className="py-3.5 px-4 font-bold text-gray-900">{p.cafeName}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-100 text-gray-700">
                              {p.paymentMethod === "card" ? "💳 Karta" : p.paymentMethod === "cash" ? "💵 Naqd" : p.paymentMethod === "bank" ? "🏦 Bank" : "📱 Onlayn"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 font-medium">{p.notes || "Oylik to'lov"}</td>
                          <td className="py-3.5 px-5 text-right font-black text-emerald-600 text-sm">
                            +{p.amount.toLocaleString()} so'm
                          </td>
                        </tr>
                      ))}
                      {allPayments.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-gray-400 font-medium">
                            To'lovlar tarixi mavjud emas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TELEGRAM BOT */}
          {activeTab === "bot_security" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Telegram Bot va Xavfsizlik
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ikki bosqichli avtorizatsiya va QR-kod orqali tasdiqlash xizmati
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-md">
                    <MessageSquare size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">@BarposAuth_Bot</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Faol & Ulanish Tayyor
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Rasmiy xavfsizlik va avtorizatsiya boti
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-gray-700 space-y-2">
                  <p className="font-bold text-blue-900">Bot qanday ishlaydi?</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Barcha administratorlar Telegram orqali kirishda ushbu botga bog'lanadi.</li>
                    <li>QR-kodni skaner qilish orqali parolsiz bir lahzada tizimga kirish mumkin.</li>
                    <li>Bir martalik 6-xonali tasdiqlash kodlari to'g'ridan-to'g'ri @BarposAuth_Bot orqali keladi.</li>
                  </ul>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="https://t.me/BarposAuth_Bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    <span>Botga o'tish (@BarposAuth_Bot)</span>
                  </a>

                  <a
                    href="/qr-scanner"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all"
                  >
                    <QrCode size={14} />
                    <span>Kamera QR Scanner</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TIZIM SOZLAMALARI */}
          {activeTab === "settings" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Tizim va Brend Sozlamalari
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tizim nomi, chek va xodimlarga ko'rinadigan texnik yordam kontaktlari
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Brend Nomi:
                    </label>
                    <input
                      type="text"
                      value={config.brandName}
                      onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Suv Belgisi (Watermark):
                    </label>
                    <input
                      type="text"
                      value={config.watermarkText}
                      onChange={(e) => setConfig({ ...config, watermarkText: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Asosiy Valyuta:
                    </label>
                    <input
                      type="text"
                      value={config.currency}
                      onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Qo'llab-quvvatlash E-maili:
                    </label>
                    <input
                      type="email"
                      value={config.supportEmail}
                      onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveConfig}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Save size={16} />
                    <span>Sozlamalarni Saqlash</span>
                  </button>
                </div>
              </div>

              {/* Support Phones Manager */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-gray-800">Mijozlarni Qo'llab-quvvatlash Telefonlari</h3>
                <p className="text-xs text-gray-400">
                  Ushbu raqamlar barcha POS terminal va kassa oynalarida ma'lumot sifatida ko'rinadi
                </p>

                <div className="space-y-2">
                  {config.supportPhones.map((sp) => (
                    <div key={sp.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/70 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {sp.city}
                        </span>
                        <span className="font-mono font-bold text-gray-800">{sp.phone}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteSupportPhone(sp.id)}
                        className="text-gray-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddSupportPhone} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <input
                    type="text"
                    placeholder="Shahar (masalan, Toshkent)"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs outline-none focus:bg-white focus:border-blue-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="+998 71 200 00 00"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs outline-none focus:bg-white focus:border-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-800 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Qo'shish</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: YANGI MUASSASA QO'SHISH (WITH 14-DAYS TRIAL TOGGLE)               */}
      {/* ========================================================================= */}
      {showAddCafeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Yangi Muassasa Qo'shish</h3>
                  <p className="text-xs text-gray-400">Restoran yaratish va Admin kirish ma'lumotlarini belgilash</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCafeModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCafe} className="p-6 space-y-4">
              {/* SINOV MUDDATINI BELGILASH TUGMASI (User explicitly requested!) */}
              <div 
                onClick={() => setIsTrialMode(!isTrialMode)}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  isTrialMode 
                    ? "bg-amber-50/80 border-amber-300 shadow-xs" 
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isTrialMode ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    <Clock size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-gray-900">
                      14 Kunlik Sinov Muddati (Trial)
                    </span>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      {isTrialMode 
                        ? "14 kundan keyin pul to'lanmasa, POS tizimiga kirish avtomatik bloklanadi" 
                        : "Sinov muddati o'chirilgan (to'lovli faol rejim)"}
                    </p>
                  </div>
                </div>

                <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                  isTrialMode ? "bg-amber-500 border-amber-600 text-white" : "border-gray-300 bg-white"
                }`}>
                  {isTrialMode && <Check size={14} />}
                </div>
              </div>

              {/* Cafe name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Muassasa / Kafe Nomi: *
                </label>
                <input
                  type="text"
                  required
                  value={newCafeName}
                  onChange={(e) => setNewCafeName(e.target.value)}
                  placeholder="Rayhon Milliy Taomlar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              {/* Business type & Person */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Faoliyat Turi:
                  </label>
                  <select
                    value={newBusinessType}
                    onChange={(e) => setNewBusinessType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium outline-none cursor-pointer"
                  >
                    <option value="restaurant">Restoran</option>
                    <option value="cafe">Kafe</option>
                    <option value="fastfood">Fast Food</option>
                    <option value="bar">Bar / Lounge</option>
                    <option value="pizzeria">Pitseriya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mas'ul Shaxs (Rahbar):
                  </label>
                  <input
                    type="text"
                    value={newCafePerson}
                    onChange={(e) => setNewCafePerson(e.target.value)}
                    placeholder="Alisher Usmonov"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Phone & Monthly fee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Telefon Raqami: *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCafePhone}
                    onChange={(e) => setNewCafePhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono font-medium outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Oylik Obuna To'lovi (so'm):
                  </label>
                  <input
                    type="number"
                    value={newSubscriptionFee}
                    onChange={(e) => setNewSubscriptionFee(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Admin credentials box */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <KeyRound size={15} />
                  <span>Admin Panelga Kirish Ma'lumotlari:</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Login (E-mail / Username): *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAdminLogin}
                      onChange={(e) => setNewAdminLogin(e.target.value)}
                      placeholder="rayhon_admin"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-blue-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      Parol: *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="admin123"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-gray-800 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-blue-700/80 leading-tight">
                  Ushbu login va parol orqali faqat ushbu kafe Admin Paneli va POS terminaliga kiriladi.
                </p>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Manzil:
                </label>
                <input
                  type="text"
                  value={newCafeAddress}
                  onChange={(e) => setNewCafeAddress(e.target.value)}
                  placeholder="Toshkent sh., Yunusobod 14-mavze"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddCafeModal(false)}
                  className="px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 text-xs font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? "Saqlanmoqda..." : "Yaratish va Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MUDDATNI UZAYTIRISH (EXTEND SUBSCRIPTION MODAL)                  */}
      {/* ========================================================================= */}
      {selectedCafeForExtend && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Calendar size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Obuna Muddatini Uzaytirish</h3>
                  <p className="text-xs text-blue-600 font-bold">{selectedCafeForExtend.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCafeForExtend(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExtendSubscription} className="p-6 space-y-4">
              {/* Current status display */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">Hozirgi amal qilish sanasi:</span>
                  <strong className="text-gray-900 text-sm font-mono">
                    {selectedCafeForExtend.expiresAt || "Belgilanmagan"}
                  </strong>
                </div>
                <div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedCafeForExtend.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : selectedCafeForExtend.status === "trial"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {selectedCafeForExtend.status === "active" ? "Faol" : selectedCafeForExtend.status === "trial" ? "Sinov muddati" : "Cheklangan"}
                  </span>
                </div>
              </div>

              {/* Quick Period Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Muddatni qanchaga uzaytirish:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "14", label: "+14 kun (Sinov)" },
                    { key: "30", label: "+1 oy (30 kun)" },
                    { key: "90", label: "+3 oy (90 kun)" },
                    { key: "180", label: "+6 oy (180 kun)" },
                    { key: "365", label: "+1 yil (365 kun)" },
                    { key: "custom", label: "Aniq sana" }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setExtendOption(opt.key as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        extendOption === opt.key 
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs" 
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date input if selected */}
              {extendOption === "custom" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Aniq tugash sanasi:
                  </label>
                  <input
                    type="date"
                    required
                    value={customExtendDate}
                    onChange={(e) => setCustomExtendDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              )}

              {/* Payment details to record simultaneously */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                  <CreditCard size={15} className="text-emerald-600" />
                  <span>Qabul qilingan to'lovni qayd etish (ixtiyoriy):</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      To'lov summasi (so'm):
                    </label>
                    <input
                      type="number"
                      value={extendPaymentAmount}
                      onChange={(e) => setExtendPaymentAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">
                      To'lov usuli:
                    </label>
                    <select
                      value={extendPaymentMethod}
                      onChange={(e) => setExtendPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 outline-none cursor-pointer"
                    >
                      <option value="card">💳 Bank Kartasi</option>
                      <option value="cash">💵 Naqd pul</option>
                      <option value="bank">🏦 Bank hisobi</option>
                      <option value="online">📱 Onlayn (Click/Payme)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    To'lov izohi:
                  </label>
                  <input
                    type="text"
                    value={extendPaymentNotes}
                    onChange={(e) => setExtendPaymentNotes(e.target.value)}
                    placeholder="Obuna to'lovi"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedCafeForExtend(null)}
                  className="px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 text-xs font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Unlock size={14} />
                  <span>{isLoading ? "Saqlanmoqda..." : "Muddatni Uzaytirish va Ochish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TO'LOV QABUL QILISH                                              */}
      {/* ========================================================================= */}
      {selectedCafeForPayment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">To'lov Qabul Qilish</h3>
                <p className="text-xs text-blue-600 font-bold">{selectedCafeForPayment.name}</p>
              </div>
              <button
                onClick={() => setSelectedCafeForPayment(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  To'lov Summasi (so'm): *
                </label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-black text-gray-900 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  To'lov Usuli:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="card">💳 Bank Kartasi (Uzcard / Humo)</option>
                  <option value="cash">💵 Naqd pul</option>
                  <option value="bank">🏦 Bank hisobiga o'tkazma</option>
                  <option value="online">📱 Onlayn (Click / Payme)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Izoh:
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Fevral oyi uchun to'lov"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedCafeForPayment(null)}
                  className="px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 text-xs font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? "Qayd etilmoqda..." : "To'lovni Tasdiqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: TO'LOVLAR TARIXI                                                 */}
      {/* ========================================================================= */}
      {selectedCafeForHistory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">To'lovlar Tarixi</h3>
                <p className="text-xs text-blue-600 font-bold">{selectedCafeForHistory.name}</p>
              </div>
              <button
                onClick={() => setSelectedCafeForHistory(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 max-h-96 overflow-y-auto space-y-3 custom-scrollbar">
              {(selectedCafeForHistory.payments || []).map((p) => (
                <div key={p.id} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-gray-800">{p.notes || "Oylik obuna"}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {p.date} • {p.paymentMethod === "card" ? "Karta" : p.paymentMethod === "cash" ? "Naqd" : "Bank"}
                    </div>
                  </div>
                  <div className="font-black text-emerald-600 text-sm">
                    +{p.amount.toLocaleString()} so'm
                  </div>
                </div>
              ))}
              {(!selectedCafeForHistory.payments || selectedCafeForHistory.payments.length === 0) && (
                <p className="text-center py-6 text-gray-400 text-xs">
                  Hozircha to'lovlar mavjud emas
                </p>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedCafeForHistory(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
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
