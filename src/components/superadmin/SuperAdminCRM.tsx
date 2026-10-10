import React, { useState } from "react";
import { 
  getStoredSystemConfig, 
  saveStoredSystemConfig, 
  getStoredCafesData, 
  saveStoredCafesData, 
  SystemConfig, 
  CafeCRMRecord, 
  SupportPhoneItem 
} from "../../utils/systemConfig";
import { InposLogo } from "../common/InposLogo";
import { 
  Building2, 
  CreditCard, 
  Phone, 
  Mail, 
  ShieldCheck, 
  PlusCircle, 
  History, 
  Settings, 
  DollarSign, 
  Calendar, 
  Save, 
  Trash2, 
  CheckCircle2, 
  ArrowLeft,
  Monitor,
  Tv,
  User,
  Info,
  LogOut,
  RefreshCw,
  Image as ImageIcon,
  Check,
  ChevronRight
} from "lucide-react";

interface SuperAdminCRMProps {
  onBackToPos?: () => void;
  onLogout?: () => void;
}

export const SuperAdminCRM: React.FC<SuperAdminCRMProps> = ({ onBackToPos, onLogout }) => {
  const [activeTab, setActiveCategoryTab] = useState<"dashboard" | "cafes" | "support_settings">("dashboard");
  const [periodFilter, setPeriodFilter] = useState<"today" | "week" | "month" | "year">("today");
  const [lang, setLang] = useState<"ru" | "uz">("ru");

  // Load configuration & cafes state
  const [config, setConfig] = useState<SystemConfig>(getStoredSystemConfig());
  const [cafes, setCafes] = useState<CafeCRMRecord[]>(getStoredCafesData());

  // Save notification toast
  const [toastMessage, setToastMessage] = useState<string>("");

  // Cafe creation modal
  const [showAddCafeModal, setShowAddCafeModal] = useState(false);
  const [newCafeName, setNewCafeName] = useState("");
  const [newCafeOwner, setNewCafeOwner] = useState("");
  const [newCafePhone, setNewCafePhone] = useState("+998 ");
  const [newCafeAddress, setNewCafeAddress] = useState("");

  // Payment creation modal
  const [selectedCafeForPayment, setSelectedCafeForPayment] = useState<CafeCRMRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("500000");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank" | "online">("card");
  const [paymentNotes, setPaymentNotes] = useState<string>("POS дастури ойлик обуна тўлови");

  // Payment history modal
  const [selectedCafeForHistory, setSelectedCafeForHistory] = useState<CafeCRMRecord | null>(null);

  // New Support Phone line state
  const [newCity, setNewCity] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Overall Financial Totals
  const totalDailyTurnover = cafes.reduce((sum, c) => sum + c.dailyTurnover, 0);
  const totalMonthlyTurnover = cafes.reduce((sum, c) => sum + c.monthlyTurnover, 0);
  const totalYearlyTurnover = cafes.reduce((sum, c) => sum + c.yearlyTurnover, 0);
  const totalCollectedPayments = cafes.reduce((sum, c) => sum + c.totalPaid, 0);

  // Handle saving system config
  const handleSaveConfig = () => {
    saveStoredSystemConfig(config);
    showToast("✅ Служба поддержки ва бренд созламалари муваффақиятли сақланди!");
  };

  // Add new Cafe
  const handleCreateCafe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCafeName.trim()) return;

    const newId = `CF-${1000 + cafes.length + 1}`;
    const newCafe: CafeCRMRecord = {
      id: newId,
      name: newCafeName,
      ownerName: newCafeOwner || "Номаълум",
      phone: newCafePhone || "+998 90 000 00 00",
      address: newCafeAddress || "Ташкент ш.",
      registrationDate: new Date().toISOString().split("T")[0],
      status: "active",
      dailyTurnover: 0,
      monthlyTurnover: 0,
      yearlyTurnover: 0,
      totalPaid: 0,
      payments: []
    };

    const updated = [newCafe, ...cafes];
    setCafes(updated);
    saveStoredCafesData(updated);

    setShowAddCafeModal(false);
    setNewCafeName("");
    setNewCafeOwner("");
    setNewCafePhone("+998 ");
    setNewCafeAddress("");
    showToast(`✅ Янги кафе ${newId} сақланди!`);
  };

  // Add payment for cafe ID
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafeForPayment || !paymentAmount) return;

    const amt = Number(paymentAmount) || 0;
    const newPayment = {
      id: `PAY-${Date.now()}`,
      cafeId: selectedCafeForPayment.id,
      date: new Date().toISOString().split("T")[0],
      amount: amt,
      paymentMethod,
      notes: paymentNotes
    };

    const updated = cafes.map(c => {
      if (c.id === selectedCafeForPayment.id) {
        return {
          ...c,
          totalPaid: c.totalPaid + amt,
          payments: [newPayment, ...c.payments]
        };
      }
      return c;
    });

    setCafes(updated);
    saveStoredCafesData(updated);

    setSelectedCafeForPayment(null);
    setPaymentAmount("500000");
    setPaymentNotes("POS дастури ойлик обуна тўлови");
    showToast(`💳 ${selectedCafeForPayment.id} кафеси учун ${amt.toLocaleString()} so'm тўлов сақланди!`);
  };

  // Add support phone line
  const handleAddSupportPhone = () => {
    if (!newCity.trim() || !newPhone.trim()) return;
    const newLine: SupportPhoneItem = {
      id: `sp-${Date.now()}`,
      city: newCity.toUpperCase(),
      phone: newPhone
    };
    setConfig(prev => ({
      ...prev,
      supportPhones: [...prev.supportPhones, newLine]
    }));
    setNewCity("");
    setNewPhone("");
  };

  // Remove support phone line
  const handleRemoveSupportPhone = (id: string) => {
    setConfig(prev => ({
      ...prev,
      supportPhones: prev.supportPhones.filter(p => p.id !== id)
    }));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#ECEEF1] text-[#333] overflow-hidden font-sans select-none antialiased">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER (Dark Bar matching Image 2 Admin UI)                          */}
      {/* ========================================================================= */}
      <header className="bg-[#2B303A] text-white px-6 py-2.5 flex items-center justify-between shrink-0 border-b border-black/30 shadow-md">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer">
            <InposLogo className="h-7 w-auto" variant="white" />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              Master Owner CRM
            </span>
          </div>

          {/* Center Info: System Status & User Email */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            <span className="text-gray-400">
              Логин: <strong className="text-amber-400 font-mono">nastarin@inpos.uz</strong>
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-[#64D878] flex items-center gap-1.5">
              <span>Синхронизация: меньше 1 минуты назад</span>
              <span className="text-gray-400" title="Все данные системы авто-синхронизированы">
                <Info size={13} />
              </span>
            </span>
          </div>
        </div>

        {/* Right Actions: TV, Profile, Language, Logout */}
        <div className="flex items-center gap-4 text-xs text-gray-300">
          <a
            href="/kitchen"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-white font-bold transition-all"
          >
            <Tv size={13} />
            <span>Кухня ТВ</span>
          </a>

          <div className="flex items-center gap-1 text-gray-400">
            <span>Язык:</span>
            <button 
              onClick={() => setLang(lang === "ru" ? "uz" : "ru")}
              className="text-white font-bold underline cursor-pointer hover:text-amber-300"
            >
              {lang === "ru" ? "Русский" : "O'zbekcha"}
            </button>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="text-gray-300 hover:text-red-400 underline font-semibold transition-colors cursor-pointer"
            >
              Выйти
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

      {/* ========================================================================= */}
      {/* 2. MAIN TABS NAVIGATION BAR (Dark grey gradient ribbon matching Image 2)   */}
      {/* ========================================================================= */}
      <nav className="bg-gradient-to-b from-[#4A505C] to-[#3E434D] border-b border-[#30353D] px-4 flex items-center shrink-0">
        <div className="flex items-center">
          <button
            onClick={() => setActiveCategoryTab("dashboard")}
            className={`px-5 py-2.5 text-xs font-bold transition-colors cursor-pointer border-r border-[#383D47] ${
              activeTab === "dashboard"
                ? "bg-white text-[#333] shadow-inner font-black"
                : "text-gray-200 hover:bg-white/10"
            }`}
          >
            Главная (Дашборд)
          </button>

          <button
            onClick={() => setActiveCategoryTab("cafes")}
            className={`px-5 py-2.5 text-xs font-bold transition-colors cursor-pointer border-r border-[#383D47] ${
              activeTab === "cafes"
                ? "bg-white text-[#333] shadow-inner font-black"
                : "text-gray-200 hover:bg-white/10"
            }`}
          >
            Кафелар ва Оборот (Все кафе)
          </button>

          <button
            onClick={() => setActiveCategoryTab("support_settings")}
            className={`px-5 py-2.5 text-xs font-bold transition-colors cursor-pointer border-r border-[#383D47] ${
              activeTab === "support_settings"
                ? "bg-white text-[#333] shadow-inner font-black"
                : "text-gray-200 hover:bg-white/10"
            }`}
          >
            Служба поддержки ва Бренд
          </button>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 3. SUB-NAVIGATION RIBBON (Light grey bar with filters matching Image 2)    */}
      {/* ========================================================================= */}
      <div className="bg-[#E2E5EA] border-b border-[#CDD2DA] px-6 py-2 flex items-center justify-between text-xs text-[#444] shrink-0">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-white border border-gray-300 rounded font-bold shadow-xs text-[#2B303A]">
            Диспетчерская (Супер-Админ)
          </span>
          <span className="text-gray-500">
            Барча Кафелар Сводкаси: <strong className="text-blue-700">{cafes.length} та кафе</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-gray-500 mr-1">Давр:</span>
          <button
            onClick={() => setPeriodFilter("today")}
            className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
              periodFilter === "today" ? "bg-[#343A40] text-white shadow-sm" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            Бугун
          </button>
          <button
            onClick={() => setPeriodFilter("week")}
            className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
              periodFilter === "week" ? "bg-[#343A40] text-white shadow-sm" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            Ҳафталик (7 кун)
          </button>
          <button
            onClick={() => setPeriodFilter("month")}
            className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
              periodFilter === "month" ? "bg-[#343A40] text-white shadow-sm" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            Ойлик (30 кун)
          </button>
          <button
            onClick={() => setPeriodFilter("year")}
            className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-all ${
              periodFilter === "year" ? "bg-[#343A40] text-white shadow-sm" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            Йиллик (12 ой)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN CONTENT CONTAINER (WHITE CARDS LAYOUT MATCHING IMAGE 2)            */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* ROW 1: BREAKDOWN TABLE CARD MATCHING IMAGE 2 */}
            <div className="bg-white rounded border border-[#CBD0D8] shadow-sm overflow-hidden">
              <div className="bg-[#707784] text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
                <span>Касса (Бугунги савдо тушумлари - Умумий тизим)</span>
                <span className="text-[11px] opacity-90">0 та ёпилган чек • 3 та фаол стол</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F5F6F8] border-b border-[#D8DCE3] text-gray-700 font-bold">
                      <th className="py-2.5 px-3 border-r border-[#E0E4EC]">№</th>
                      <th className="py-2.5 px-3 border-r border-[#E0E4EC]">Тип</th>
                      <th className="py-2.5 px-3 border-r border-[#E0E4EC]">Наличные (Нақд)</th>
                      <th className="py-2.5 px-3 border-r border-[#E0E4EC]">Банковский счет</th>
                      <th className="py-2.5 px-3 border-r border-[#E0E4EC]">Долг (Қарз)</th>
                      <th className="py-2.5 px-3 border-r border-[#E0E4EC]">Депозит</th>
                      <th className="py-2.5 px-3 border-r border-[#E0E4EC] text-red-600">Не оплаченный (Очиқ)</th>
                      <th className="py-2.5 px-3 border-r border-[#E0E4EC]">Онлайн платежи</th>
                      <th className="py-2.5 px-3 border-r border-[#E0E4EC]">Банковская карта</th>
                      <th className="py-2.5 px-3 font-black text-emerald-700">Итого</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#E8ECF2] hover:bg-gray-50">
                      <td className="py-2.5 px-3 border-r border-[#E0E4EC] font-bold">1</td>
                      <td className="py-2.5 px-3 border-r border-[#E0E4EC] font-semibold text-gray-800">Баланс савдо</td>
                      <td className="py-2.5 px-3 border-r border-[#E0E4EC] font-mono">$0.00</td>
                      <td className="py-2.5 px-3 border-r border-[#E0E4EC] font-mono">0 сўм</td>
                      <td className="py-2.5 px-3 border-r border-[#E0E4EC] font-mono">$0.00</td>
                      <td className="py-2.5 px-3 border-r border-[#E0E4EC] font-mono">0 сўм</td>
                      <td className="py-2.5 px-3 border-r border-[#E0E4EC] font-mono font-bold text-red-600">$137.15</td>
                      <td className="py-2.5 px-3 border-r border-[#E0E4EC] font-mono">$0.00</td>
                      <td className="py-2.5 px-3 border-r border-[#E0E4EC] font-mono">$0.00</td>
                      <td className="py-2.5 px-3 font-mono font-black text-emerald-600">$0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-2.5 bg-[#FAFAFC] border-t border-[#E0E4EC] text-[11px] text-gray-500 flex justify-between items-center px-4">
                <span>Обновлено в: {new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="text-emerald-600 font-bold">✓ Master CRM касса баланслари 100% синхронланган</span>
              </div>
            </div>

            {/* ROW 2: PRIHODY (BUGUN) & RASHODY MATCHING IMAGE 2 CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Приходы Card */}
              <div className="bg-white rounded border border-[#CBD0D8] shadow-sm p-6 text-center">
                <div className="text-gray-600 text-xs font-bold uppercase mb-2 flex items-center justify-center gap-1">
                  <span>Приходы (Бугун умумий тушум)</span>
                  <Info size={14} className="text-gray-400" />
                </div>
                <div className="text-3xl font-black text-[#2B303A] tracking-tight">
                  {totalDailyTurnover > 0 ? `${totalDailyTurnover.toLocaleString()} so'm` : "$0.00"}
                </div>
                <p className="text-xs text-gray-500 mt-2">Жами барча кафелардан олинган савдо</p>
              </div>

              {/* Расходы Card */}
              <div className="bg-white rounded border border-[#CBD0D8] shadow-sm p-6 text-center">
                <div className="text-gray-600 text-xs font-bold uppercase mb-2 flex items-center justify-center gap-1">
                  <span>Расходы</span>
                  <Info size={14} className="text-gray-400" />
                </div>
                <div className="text-3xl font-black text-[#2B303A] tracking-tight">
                  $0.00
                </div>
                <p className="text-xs text-gray-500 mt-2">Омборда кам қолган хом-ашёлар: 0 та</p>
              </div>
            </div>

            {/* ROW 3: BALANCE STATS & ATTENTION BOX MATCHING IMAGE 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Balance Box */}
              <div className="bg-white rounded border border-[#CBD0D8] shadow-sm p-5 space-y-3">
                <div className="flex justify-between text-xs border-b border-gray-100 pb-2">
                  <span className="text-gray-600 font-medium">На начало дня:</span>
                  <span className="font-mono font-bold text-gray-800">$106,090.00</span>
                </div>
                <div className="flex justify-between text-xs border-b border-gray-100 pb-2">
                  <span className="text-gray-600 font-medium">Приходы (Савдо тушуми):</span>
                  <span className="font-mono font-bold text-emerald-600">+$0.00</span>
                </div>
                <div className="flex justify-between text-xs border-b border-gray-100 pb-2">
                  <span className="text-gray-600 font-medium">Расходы:</span>
                  <span className="font-mono font-bold text-red-600">$0.00</span>
                </div>
                <div className="flex justify-between text-xs border-b border-gray-100 pb-2">
                  <span className="text-gray-600 font-medium">Баланс дня:</span>
                  <span className="font-mono font-bold text-blue-600">$0.00</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1">
                  <span className="text-gray-900">На конец дня:</span>
                  <span className="font-mono font-black text-[#2B303A] text-base">$106,090.00</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                  <span>Ўртача чек миқдори:</span>
                  <span className="font-mono font-bold text-gray-700">$0.00</span>
                </div>
              </div>

              {/* Обратите внимание! Box matching Image 2 */}
              <div className="bg-white rounded border border-[#CBD0D8] shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase mb-3 flex items-center gap-1.5">
                    <span>Обратите внимание!</span>
                    <Info size={14} className="text-gray-400" />
                  </h3>

                  <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium flex items-center justify-between mb-4">
                    <span>Остались открытые счета за последние 7 дней: <strong>3</strong></span>
                    <button 
                      onClick={() => setActiveCategoryTab("cafes")}
                      className="text-red-700 hover:text-red-900 underline font-bold text-[11px] flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Просмотр</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-gray-700">
                      <span>Жами рўйхатдаги кафелар:</span>
                      <span className="font-bold">{cafes.length} та</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Фаол кафелар:</span>
                      <span className="font-bold text-emerald-600">
                        {cafes.filter(c => c.status === "active").length} та
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Синовдаги (Триал) кафелар:</span>
                      <span className="font-bold text-amber-600">
                        {cafes.filter(c => c.status === "trial").length} та
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => setShowAddCafeModal(true)}
                    className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle size={15} />
                    <span>Янги Кафе Қўшиш</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CAFES TURNOVERS & ID PAYMENTS                                      */}
        {/* ========================================================================= */}
        {activeTab === "cafes" && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="bg-white rounded border border-[#CBD0D8] shadow-sm overflow-hidden">
              <div className="bg-[#707784] text-white px-5 py-3 text-xs font-bold flex items-center justify-between">
                <span>Барча Рўйхатдан Ўтган Кафелар Обороти ва ID Тўловлари</span>
                <button
                  onClick={() => setShowAddCafeModal(true)}
                  className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <PlusCircle size={15} />
                  <span>Янги Кафе Қўшиш</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F5F6F8] text-gray-700 font-bold border-b border-[#CBD0D8]">
                      <th className="p-3 border-r border-[#E0E4EC]">CAFE ID</th>
                      <th className="p-3 border-r border-[#E0E4EC]">КАФЕ НОМИ</th>
                      <th className="p-3 border-r border-[#E0E4EC]">ЭГАСИ ВА ТЕЛЕФОН</th>
                      <th className="p-3 border-r border-[#E0E4EC]">СТАТУС</th>
                      <th className="p-3 text-right border-r border-[#E0E4EC]">КУНЛИК ОБОРОТ</th>
                      <th className="p-3 text-right border-r border-[#E0E4EC]">ОЙЛИК ОБОРОТ</th>
                      <th className="p-3 text-right border-r border-[#E0E4EC]">ЙИЛЛИК ОБОРОТ</th>
                      <th className="p-3 text-right border-r border-[#E0E4EC]">ID ТЎЛОВЛАРИ</th>
                      <th className="p-3 text-center">АМАЛЛАР</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cafes.map((cafe) => (
                      <tr key={cafe.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-mono font-black text-amber-600 border-r border-[#E0E4EC]">{cafe.id}</td>
                        <td className="p-3 font-bold text-gray-900 border-r border-[#E0E4EC]">
                          <div>{cafe.name}</div>
                          <div className="text-[10px] text-gray-500 font-normal">{cafe.address}</div>
                        </td>
                        <td className="p-3 border-r border-[#E0E4EC]">
                          <div className="font-bold text-gray-800">{cafe.ownerName}</div>
                          <div className="text-[10px] font-mono text-gray-500">{cafe.phone}</div>
                        </td>
                        <td className="p-3 border-r border-[#E0E4EC]">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            cafe.status === "active"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : cafe.status === "trial"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-red-100 text-red-800 border border-red-300"
                          }`}>
                            {cafe.status === "active" ? "Актив" : cafe.status === "trial" ? "Триал" : "Муддати ўтган"}
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-amber-700 border-r border-[#E0E4EC]">
                          {cafe.dailyTurnover.toLocaleString()} so'm
                        </td>
                        <td className="p-3 text-right font-black text-emerald-700 border-r border-[#E0E4EC]">
                          {cafe.monthlyTurnover.toLocaleString()} so'm
                        </td>
                        <td className="p-3 text-right font-black text-purple-700 border-r border-[#E0E4EC]">
                          {cafe.yearlyTurnover.toLocaleString()} so'm
                        </td>
                        <td className="p-3 text-right font-black text-cyan-700 border-r border-[#E0E4EC]">
                          {cafe.totalPaid.toLocaleString()} so'm
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedCafeForPayment(cafe)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer shadow-xs"
                            >
                              + Тўлов
                            </button>
                            <button
                              onClick={() => setSelectedCafeForHistory(cafe)}
                              className="px-2.5 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-[11px] cursor-pointer"
                            >
                              Тарих
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

        {/* ========================================================================= */}
        {/* TAB 3: BRANDING & SUPPORT SETTINGS                                        */}
        {/* ========================================================================= */}
        {activeTab === "support_settings" && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white rounded border border-[#CBD0D8] shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#2B303A] uppercase tracking-wide">
                    Служба Поддержки ва Бренд Созламалари
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Бу ерда киритилган маълумотлар кириш экранида ва чекларда сақланади.
                  </p>
                </div>
                <button
                  onClick={handleSaveConfig}
                  className="px-5 py-2.5 rounded bg-[#00A3E0] hover:bg-[#008cc2] text-white font-black text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Save size={16} />
                  <span>Созламаларни Сақлаш</span>
                </button>
              </div>

              {/* BRAND & WATERMARK */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-2">
                  1. Дастур Бренд Номи ва Сув Белгиси
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Дастур Бренд Номи (e.g. JOWI RESTAURANT):
                    </label>
                    <input
                      type="text"
                      value={config.brandName}
                      onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded bg-gray-50 border border-gray-300 text-gray-900 font-bold text-xs outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Сув Белгиси (e.g. www.jowi.club):
                    </label>
                    <input
                      type="text"
                      value={config.watermarkText}
                      onChange={(e) => setConfig({ ...config, watermarkText: e.target.value })}
                      className="w-full px-3.5 py-2 rounded bg-gray-50 border border-gray-300 text-gray-900 font-bold text-xs outline-none focus:border-blue-500 focus:bg-white"
                    />
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Valyuta (e.g. UZS):
                    </label>
                    <input
                      type="text"
                      value={config.currency}
                      onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                      className="w-full px-3.5 py-2 rounded bg-gray-50 border border-gray-300 text-gray-900 font-bold text-xs outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SUPPORT BOX SETTINGS & LOGO */}
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-2">
                  2. Служба Поддержки ва Логотип
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Служба Поддержки Сарлавҳаси:
                    </label>
                    <input
                      type="text"
                      value={config.supportTitle}
                      onChange={(e) => setConfig({ ...config, supportTitle: e.target.value })}
                      className="w-full px-3.5 py-2 rounded bg-gray-50 border border-gray-300 text-gray-900 font-bold text-xs outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Support Email (e.g. help@jowi.club):
                    </label>
                    <input
                      type="email"
                      value={config.supportEmail}
                      onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                      className="w-full px-3.5 py-2 rounded bg-gray-50 border border-gray-300 text-gray-900 font-bold text-xs outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <ImageIcon size={14} className="text-blue-600" />
                    <span>Служба Поддержки устига Логотип (Logo URL):</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com/logo.png"
                    value={config.supportLogoUrl || ""}
                    onChange={(e) => setConfig({ ...config, supportLogoUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded bg-gray-50 border border-gray-300 text-gray-900 text-xs font-mono outline-none focus:border-blue-500 focus:bg-white"
                  />
                  {config.supportLogoUrl && (
                    <div className="mt-2 p-2.5 bg-gray-100 border border-gray-300 rounded inline-block">
                      <span className="text-[10px] font-bold text-gray-500 block mb-1">Логотип превью:</span>
                      <img src={config.supportLogoUrl} alt="Logo preview" className="h-8 w-auto object-contain" />
                    </div>
                  )}
                </div>
              </div>

              {/* PHONES LIST */}
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-2 flex items-center gap-1.5">
                  <Phone size={15} />
                  <span>3. Телефон Рақамлар Рўйхати (Шаҳарлар бўйича)</span>
                </h3>

                <div className="space-y-2">
                  {config.supportPhones.map((sp) => (
                    <div key={sp.id} className="flex items-center justify-between p-2.5 rounded bg-gray-50 border border-gray-200">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase text-gray-700 px-2 py-0.5 rounded bg-gray-200">
                          {sp.city}
                        </span>
                        <span className="text-xs font-mono font-bold text-gray-900">{sp.phone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSupportPhone(sp.id)}
                        className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                        title="Ўчириш"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Шаҳар (e.g. ТАШКЕНТ)"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-1/3 px-3 py-1.5 rounded bg-gray-50 border border-gray-300 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Тел (e.g. +998 (95) 198-88-44)"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded bg-gray-50 border border-gray-300 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddSupportPhone}
                    className="px-3.5 py-1.5 rounded bg-gray-800 text-white font-bold text-xs hover:bg-gray-700 cursor-pointer"
                  >
                    + Қўшиш
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW CAFE                                                       */}
      {/* ========================================================================= */}
      {showAddCafeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-md w-full text-xs text-gray-900 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#2B303A] border-b border-gray-200 pb-2">
              Янги Кафе Рўйхатдан Ўтказиш
            </h3>

            <form onSubmit={handleCreateCafe} className="space-y-3">
              <div>
                <label className="block font-bold mb-1 text-gray-700">Кафе / Ресторан Номи:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jowi Restaurant & Lounge"
                  value={newCafeName}
                  onChange={(e) => setNewCafeName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-50 border border-gray-300 font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-gray-700">Кафе Эгаси (Ф.И.Ш):</label>
                <input
                  type="text"
                  placeholder="e.g. Хакимжон Хайитов"
                  value={newCafeOwner}
                  onChange={(e) => setNewCafeOwner(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-50 border border-gray-300 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-gray-700">Телефон Рақами:</label>
                <input
                  type="text"
                  value={newCafePhone}
                  onChange={(e) => setNewCafePhone(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-50 border border-gray-300 font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-gray-700">Манзили:</label>
                <input
                  type="text"
                  placeholder="Toshkent sh., Amir Temur ko'chasi"
                  value={newCafeAddress}
                  onChange={(e) => setNewCafeAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-50 border border-gray-300 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCafeModal(false)}
                  className="py-2.5 rounded bg-gray-200 hover:bg-gray-300 font-bold text-gray-800 cursor-pointer"
                >
                  Бекор қилиш
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold cursor-pointer shadow-sm"
                >
                  Сақлаш
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PAYMENT FOR CAFE ID                                            */}
      {/* ========================================================================= */}
      {selectedCafeForPayment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-md w-full text-xs text-gray-900 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-emerald-800 border-b border-gray-200 pb-2">
              Кафе ID бўйича Обуна Тўлови Қўшиш
            </h3>

            <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600 font-bold">Cafe ID:</span>
                <span className="font-mono font-black text-amber-700">{selectedCafeForPayment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-bold">Кафе Номи:</span>
                <span className="font-bold text-gray-900">{selectedCafeForPayment.name}</span>
              </div>
            </div>

            <form onSubmit={handleAddPayment} className="space-y-3">
              <div>
                <label className="block font-bold mb-1 text-gray-700">Тўлов Суммаси (UZS):</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-50 border border-gray-300 font-mono font-bold text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-gray-700">Тўлов Усули:</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-50 border border-gray-300 font-bold outline-none cursor-pointer"
                >
                  <option value="card">Plastik Karta (Card)</option>
                  <option value="bank">Bank Hisob raqam (Bank)</option>
                  <option value="cash">Naqd Pul (Cash)</option>
                  <option value="online">Click / Payme (Online)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-gray-700">Тўлов Изоҳи:</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-gray-50 border border-gray-300 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCafeForPayment(null)}
                  className="py-2.5 rounded bg-gray-200 hover:bg-gray-300 font-bold text-gray-800 cursor-pointer"
                >
                  Бекор қилиш
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-sm"
                >
                  Тўловни Сақлаш
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAYMENT HISTORY FOR CAFE ID                                        */}
      {/* ========================================================================= */}
      {selectedCafeForHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-lg w-full text-xs text-gray-900 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="text-base font-bold text-gray-900">
                {selectedCafeForHistory.id} — Тўловлар Тарихи
              </h3>
              <button
                onClick={() => setSelectedCafeForHistory(null)}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-bold cursor-pointer"
              >
                ✕ Yopish
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between">
              <span className="font-bold text-gray-800">{selectedCafeForHistory.name}</span>
              <span className="font-black text-emerald-700">
                Жами: {selectedCafeForHistory.totalPaid.toLocaleString()} so'm
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {selectedCafeForHistory.payments.length === 0 ? (
                <div className="text-center py-6 text-gray-500 font-bold">
                  Тўловлар тарихи мавжуд эмас
                </div>
              ) : (
                selectedCafeForHistory.payments.map((p) => (
                  <div key={p.id} className="p-3 bg-gray-50 border border-gray-200 rounded flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900">{p.notes}</div>
                      <div className="text-[10px] text-gray-500">{p.date} • Усули: {p.paymentMethod.toUpperCase()}</div>
                    </div>
                    <div className="font-black text-emerald-700 text-sm">
                      +{p.amount.toLocaleString()} so'm
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
