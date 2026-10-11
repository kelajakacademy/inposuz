import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useOrder } from "../context/OrderContext";
import { 
  Building2, 
  LogOut, 
  ShieldAlert, 
  Phone, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ChevronLeft,
  Settings,
  UserCheck,
  Globe,
  Wifi,
  Server,
  RefreshCw,
  Save
} from "lucide-react";
import forestBg from "../assets/images/pos_forest_bg_1790355821595.jpg";
import { getStoredSystemConfig } from "../utils/systemConfig";
import { getServerUrl, setServerUrl, testServerConnection } from "../lib/api";
import { InposLogo } from "./common/InposLogo";

interface StaffUser {
  id: string;
  name: string;
  role: string;
  pin?: string;
  phone?: string;
  cafeId?: string;
}

// Helper to determine role styling matching Jowi POS screenshots
function getRoleTheme(role: string, name?: string) {
  const r = (role || "").toLowerCase();
  const n = (name || "").toLowerCase();

  if (r.includes("barmen") || r.includes("бармен") || n.includes("бармен")) {
    return {
      bgGradient: "bg-gradient-to-b from-[#b4e600] via-[#94cc00] to-[#74a800]",
      border: "border-[#649400]",
      textTop: "text-[#2a3800]",
      textSub: "text-[#3f5500]",
      shadow: "shadow-[0_4px_12px_rgba(116,168,0,0.35)]",
      badgeColor: "bg-[#74a800]",
      roleLabel: "Бармен"
    };
  }
  if (r.includes("kassir") || r.includes("кассир") || r.includes("cashier") || n.includes("аида") || n.includes("кассир")) {
    return {
      bgGradient: "bg-gradient-to-b from-[#7e57c2] via-[#673ab7] to-[#512da8]",
      border: "border-[#4527a0]",
      textTop: "text-white",
      textSub: "text-purple-200",
      shadow: "shadow-[0_4px_12px_rgba(81,45,168,0.4)]",
      badgeColor: "bg-[#512da8]",
      roleLabel: "Кассир"
    };
  }
  if (r.includes("admin") || r.includes("manager") || r.includes("менеджер") || n.includes("admin") || n.includes("менеджер")) {
    return {
      bgGradient: "bg-gradient-to-b from-[#3a8ee6] via-[#2171c7] to-[#1559a4]",
      border: "border-[#0e4480]",
      textTop: "text-white",
      textSub: "text-blue-200",
      shadow: "shadow-[0_4px_12px_rgba(21,89,164,0.4)]",
      badgeColor: "bg-[#1559a4]",
      roleLabel: "Менеджер"
    };
  }
  // Default: Waiter / Официант (Emerald green)
  return {
    bgGradient: "bg-gradient-to-b from-[#43a047] via-[#2e7d32] to-[#1b5e20]",
    border: "border-[#144818]",
    textTop: "text-white",
    textSub: "text-emerald-200",
    shadow: "shadow-[0_4px_12px_rgba(27,94,32,0.4)]",
    badgeColor: "bg-[#1b5e20]",
    roleLabel: "Официант"
  };
}

// Format Russian Date like in screenshot: "22 Декабрь 2018, Суббота"
function formatJowiDate(date: Date) {
  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  const weekdays = [
    "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const weekday = weekdays[date.getDay()];
  return `${day} ${month} ${year}, ${weekday}`;
}

export default function LoginScreen() {
  // Navigation views: 'clock' (1-rasm) -> 'users' (2-rasm) -> 'pin' (3-rasm)
  const [viewState, setViewState] = useState<"clock" | "users" | "pin">("clock");
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [time, setTime] = useState(new Date());

  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Link Cafe / Admin credentials setup state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [adminPhone, setAdminPhone] = useState("+998 33 993 99 00");
  const [adminPassword, setAdminPassword] = useState("admin123");
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  // Exit modal state
  const [showExitModal, setShowExitModal] = useState(false);

  const { login, receiptConfig, linkedCafe, linkCafe, unlinkCafe } = useOrder();
  const navigate = useNavigate();

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch staff list for current cafe
  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const activeCafeId = linkedCafe?.id || "default";
      const res = await fetch("/api/waiters", {
        headers: { "x-cafe-id": activeCafeId }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setStaffList(data);
      } else {
        setStaffList([]);
      }
    } catch (e) {
      setStaffList([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [linkedCafe]);

  // Handle entering PIN digits
  const handleKeyClick = (digit: string) => {
    if (pin.length < 10) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError("");
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  const handleExecuteLogin = async () => {
    if (!pin) {
      setError("Parolni kiriting!");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await login(pin, selectedUser?.id);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Noto'g'ri parol! Qaytadan urinib ko'ring.");
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user: StaffUser) => {
    setSelectedUser(user);
    setPin("");
    setError("");
    setViewState("pin");
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError("");
    setLinkSuccess("");
    if (!adminPhone.trim() || !adminPassword.trim()) {
      setLinkError("Логин (телефон) ва паролни киритинг!");
      return;
    }

    setIsLinking(true);
    try {
      const result = await linkCafe(adminPhone.trim(), adminPassword.trim());
      if (result.success) {
        setLinkSuccess(result.message || "Кафе муваффақиятли уланди!");
        setTimeout(() => {
          setShowLinkModal(false);
          fetchStaff();
          // Direct transition to the Staff / Users list (2-rasm)
          setViewState("users");
        }, 300);
      } else {
        setLinkError(result.message || "Кафе логин ёки пароли нотўғри!");
      }
    } catch (err: any) {
      setLinkError(err.message || "Сервер билан алоқа хатоси");
    } finally {
      setIsLinking(false);
    }
  };

  // Flip Clock digits helper
  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");
  const digits = [hours[0], hours[1], minutes[0], minutes[1], seconds[0], seconds[1]];

  // Load dynamic system config for branding & support
  const [sysConfig, setSysConfig] = useState(() => getStoredSystemConfig());

  useEffect(() => {
    setSysConfig(getStoredSystemConfig());
  }, [viewState]);

  const cafeDisplayName = linkedCafe?.name || sysConfig.brandName;

  return (
    <div className="fixed inset-0 overflow-hidden font-sans select-none bg-[#111]">
      {/* BACKGROUND IMAGE (Nature canopy highway matching JOWI POS) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100"
        style={{ 
          backgroundImage: `url(${receiptConfig.loginBgUrl || forestBg})`
        }}
      />

      {/* SUBTLE VIGNETTE & LIGHTING OVERLAY */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

      {/* TOP BRAND LOGO (iNPOS) & WATERMARK */}
      <div className="absolute top-3 left-5 z-20 flex items-center gap-2">
        <InposLogo className="h-8 w-auto" variant="white" />
      </div>
      <div className="absolute top-3 right-5 z-10 text-white/70 text-[11px] font-mono tracking-widest uppercase drop-shadow-md">
        {sysConfig.watermarkText || "www.inpos.uz"}
      </div>

      {/* ========================================================================= */}
      {/* 1-RASM: MAIN LOCK SCREEN WITH FLIP CLOCK & CENTER CONTROL BOX              */}
      {/* ========================================================================= */}
      {viewState === "clock" && (
        <motion.div 
          key="view-clock"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative z-10 w-full h-full flex flex-col items-center justify-between py-12 px-6"
        >
          {/* TOP FLIP CLOCK */}
          <div className="mt-4 flex flex-col items-center">
            <div className="bg-gradient-to-b from-[#b8bcc2] via-[#9da3ab] to-[#888e96] p-2.5 sm:p-3 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] border border-white/50 inline-block">
              {/* DIGITS DISPLAY */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-b from-[#2a2d32] to-[#1c1e22] p-2.5 sm:p-3 rounded-xl shadow-inner border border-black/50">
                {digits.map((digit, idx) => (
                  <React.Fragment key={idx}>
                    {/* Individual Split Flip Card */}
                    <div className="relative w-11 sm:w-14 md:w-16 h-18 sm:h-22 md:h-26 bg-gradient-to-b from-[#f8f9fa] via-[#e9ecef] to-[#dee2e6] rounded-lg shadow-[0_4px_8px_rgba(0,0,0,0.4)] border border-gray-400 flex items-center justify-center overflow-hidden">
                      {/* Top card glossy highlight */}
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/40 border-b border-black/20 pointer-events-none" />
                      {/* Horizontal Split Line */}
                      <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-black/40 shadow-[0_1px_2px_rgba(255,255,255,0.8)] z-10" />
                      {/* Digit Number */}
                      <span className="text-4xl sm:text-5xl md:text-6xl font-sans font-bold text-[#212529] tracking-tighter drop-shadow-sm">
                        {digit}
                      </span>
                    </div>

                    {/* Gap separator after HH and MM */}
                    {(idx === 1 || idx === 3) && (
                      <div className="w-1.5 sm:w-2.5" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* DATE SUBTITLE (RUSSIAN / UZBEK FORMATTED) */}
              <div className="text-center mt-2 text-[#2b3038] font-bold text-xs sm:text-sm tracking-wide drop-shadow-sm">
                {formatJowiDate(time)}
              </div>
            </div>
          </div>

          {/* CENTER CONTROL BOX (INPOS LOGO / CAFE NAME / ВХОД / ВЫХОД) */}
          <div className="my-auto">
            <div className="w-[280px] sm:w-[320px] bg-gradient-to-b from-[#c8ccd2] via-[#b4b9c1] to-[#9fa5ad] p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-2 border-white/60 text-center flex flex-col items-center">
              {/* iNPOS Official Brand Logo & Cafe Subtitle */}
              <div className="mb-4 flex flex-col items-center justify-center">
                <InposLogo className="h-11 sm:h-12 w-auto" variant="navy" />
                <span className="text-[11px] font-bold text-gray-700 tracking-wider uppercase mt-1 drop-shadow-2xs">
                  {(() => {
                    const rawName = linkedCafe?.name || receiptConfig.cafeName || "iNPOS Restaurant";
                    return rawName.replace(/stpos/gi, "iNPOS");
                  })()}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-3.5">
                {linkedCafe ? (
                  <>
                    {/* 1. ВХОД (ENTER -> Opens Users list directly) */}
                    <button
                      onClick={() => {
                        setError("");
                        setPin("");
                        setViewState("users");
                      }}
                      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-b from-[#eceff1] via-[#cfd8dc] to-[#b0bec5] hover:from-[#ffffff] hover:via-[#dbe2e6] hover:to-[#bcc9cf] active:from-[#b0bec5] active:to-[#cfd8dc] text-[#263238] font-black text-sm uppercase tracking-wider border-2 border-[#90a4ae] shadow-[0_4px_10px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.9)] active:translate-y-0.5 active:shadow-inner transition-all flex items-center justify-center cursor-pointer"
                    >
                      Вход
                    </button>

                    {/* 2. ВЫХОД (EXIT -> Opens Exit / Unlink confirmation) */}
                    <button
                      onClick={() => setShowExitModal(true)}
                      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-b from-[#eceff1] via-[#cfd8dc] to-[#b0bec5] hover:from-[#ffffff] hover:via-[#dbe2e6] hover:to-[#bcc9cf] active:from-[#b0bec5] active:to-[#cfd8dc] text-[#263238] font-black text-sm uppercase tracking-wider border-2 border-[#90a4ae] shadow-[0_4px_10px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.9)] active:translate-y-0.5 active:shadow-inner transition-all flex items-center justify-center cursor-pointer"
                    >
                      Выход
                    </button>
                  </>
                ) : (
                  /* WHEN UNLINKED / EXITED: ONLY THE SINGLE 'ВХОД' BUTTON IS SHOWN! */
                  <button
                    onClick={() => {
                      setLinkError("");
                      setLinkSuccess("");
                      setShowLinkModal(true);
                    }}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-b from-[#eceff1] via-[#cfd8dc] to-[#b0bec5] hover:from-[#ffffff] hover:via-[#dbe2e6] hover:to-[#bcc9cf] active:from-[#b0bec5] active:to-[#cfd8dc] text-[#263238] font-black text-base uppercase tracking-wider border-2 border-[#90a4ae] shadow-[0_4px_10px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.9)] active:translate-y-0.5 active:shadow-inner transition-all flex items-center justify-center cursor-pointer"
                  >
                    Вход
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM BAR: SUPPORT INFO & SUPERADMIN CRM LINK */}
          <div className="w-full flex items-end justify-between text-white/90 text-xs">
            {/* SUPPORT INFO (BOTTOM LEFT WITH DYNAMIC LOGO & DETAILS) */}
            <div className="space-y-1.5 drop-shadow-md bg-black/50 backdrop-blur-md p-3.5 rounded-xl border border-white/10 max-w-[300px]">
              {/* Optional Support Logo above Title */}
              {sysConfig.supportLogoUrl && (
                <div className="mb-1">
                  <img 
                    src={sysConfig.supportLogoUrl} 
                    alt="Support Logo" 
                    className="h-9 w-auto max-w-[220px] object-contain" 
                  />
                </div>
              )}

              <div className="text-[11px] text-gray-200 font-black uppercase tracking-wider">
                {sysConfig.supportTitle || "Служба поддержки"}
              </div>
              <div className="text-amber-400 font-mono font-bold text-[11px]">
                {sysConfig.supportEmail || "help@inpos.uz"}
              </div>
              
              {sysConfig.supportPhones && sysConfig.supportPhones.length > 0 && (
                <div className="pt-1.5 border-t border-white/15 space-y-1">
                  {sysConfig.supportPhones.map((p) => (
                    <div key={p.id} className="text-[11px]">
                      <span className="text-gray-400 font-bold uppercase text-[10px] mr-1.5">{p.city}:</span>
                      <span className="text-white font-mono font-semibold">{p.phone}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 2-RASM: USERS SELECTION SCREEN / "ПОЛЬЗОВАТЕЛИ" (FULLSCREEN METALLIC)      */}
      {/* ========================================================================= */}
      {viewState === "users" && (
        <motion.div 
          key="view-users"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="fixed inset-2 sm:inset-4 md:inset-6 z-20 bg-gradient-to-b from-[#d2d6dc] via-[#bec3cb] to-[#aab0b9] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] border-[3px] border-[#9aa0aa] flex flex-col overflow-hidden text-black"
        >
          {/* TOP WINDOW TITLE BAR */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-[#b0b5be] via-[#c4c9d2] to-[#b0b5be] border-b-2 border-[#8e949e] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <InposLogo className="h-6 w-auto" variant="navy" />
              <div className="h-4 w-px bg-gray-400" />
              <span className="text-[#2d3748] font-black text-sm sm:text-base uppercase tracking-wider">
                ПОЛЬЗОВАТЕЛИ
              </span>
              <span className="text-[11px] font-bold text-gray-600 bg-white/50 px-2 py-0.5 rounded-full">
                ({staffList.length})
              </span>
            </div>

            <div className="text-xs font-bold text-gray-700">
              {cafeDisplayName.replace(/iNPOS/gi, "iNPOS")}
            </div>
          </div>

          {/* MAIN CONTENT AREA: HORIZONTAL USER BUTTONS RIBBON & GRID */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {loadingStaff ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-gray-700 font-bold text-sm animate-pulse">
                  Foydalanuvchilar yuklanmoqda...
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Horizontal Ribbon / Grid matching Image 2 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-3.5">
                  {staffList.map((user) => {
                    const theme = getRoleTheme(user.role, user.name);
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className={`group relative h-20 sm:h-22 rounded-xl ${theme.bgGradient} border-2 ${theme.border} ${theme.shadow} hover:brightness-110 active:scale-97 transition-all flex flex-col items-center justify-center p-2 text-center cursor-pointer overflow-hidden`}
                      >
                        {/* Glossy top bevel reflection */}
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 pointer-events-none rounded-t-lg" />
                        
                        {/* User Name */}
                        <span className={`text-sm sm:text-base font-black ${theme.textTop} tracking-tight leading-tight drop-shadow-sm`}>
                          {user.name}
                        </span>

                        {/* Role Subtitle Badge */}
                        <span className={`text-[10px] sm:text-[11px] font-bold ${theme.textSub} mt-1 drop-shadow-sm opacity-90`}>
                          {theme.roleLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Info guidance */}
                <div className="p-4 rounded-xl bg-white/30 border border-white/50 text-gray-800 text-xs flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping shrink-0" />
                  <span>
                    💡 <b>Ko'rsatma:</b> Tizimga kirish uchun o'zingizning foydalanuvchi kartangizni bosing va 4 xonali parolingizni tering.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM WINDOW FOOTER BAR: "НАЗАД" BUTTON (BOTTOM RIGHT) */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#b0b5be] via-[#c4c9d2] to-[#b0b5be] border-t-2 border-[#8e949e] flex items-center justify-between">
            <div className="text-xs text-gray-600 font-medium">
              Ofitsiant / Kassir / Admin autentifikatsiyasi
            </div>

            {/* НАЗАД (BACK) BUTTON MATCHING SCREENSHOT 2 */}
            <button
              onClick={() => setViewState("clock")}
              className="py-2.5 px-8 rounded-xl bg-gradient-to-b from-[#eceff1] via-[#cfd8dc] to-[#b0bec5] hover:from-[#ffffff] hover:via-[#dbe2e6] hover:to-[#bcc9cf] active:from-[#b0bec5] active:to-[#cfd8dc] text-[#263238] font-black text-xs uppercase tracking-wider border-2 border-[#90a4ae] shadow-[0_3px_8px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.9)] active:translate-y-0.5 active:shadow-inner transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Назад</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 3-RASM: PIN KEYPAD FOR SELECTED USER (MODAL OVER NATURE BACKGROUND)        */}
      {/* ========================================================================= */}
      {viewState === "pin" && selectedUser && (
        <motion.div 
          key="view-pin"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative z-10 w-full h-full flex flex-col items-center justify-between py-8 px-4"
        >
          {/* TOP FLIP CLOCK (IDENTICAL TO IMAGE 3) */}
          <div className="mt-1 flex flex-col items-center">
            <div className="bg-gradient-to-b from-[#b8bcc2] via-[#9da3ab] to-[#888e96] p-2.5 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] border border-white/50 inline-block scale-90 sm:scale-100">
              <div className="flex items-center gap-1.5 bg-gradient-to-b from-[#2a2d32] to-[#1c1e22] p-2.5 rounded-xl shadow-inner border border-black/50">
                {digits.map((digit, idx) => (
                  <React.Fragment key={idx}>
                    <div className="relative w-10 sm:w-12 md:w-14 h-16 sm:h-18 md:h-22 bg-gradient-to-b from-[#f8f9fa] via-[#e9ecef] to-[#dee2e6] rounded-lg shadow-[0_4px_8px_rgba(0,0,0,0.4)] border border-gray-400 flex items-center justify-center overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/40 border-b border-black/20 pointer-events-none" />
                      <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-black/40 shadow-[0_1px_2px_rgba(255,255,255,0.8)] z-10" />
                      <span className="text-3xl sm:text-4xl md:text-5xl font-sans font-bold text-[#212529] tracking-tighter">
                        {digit}
                      </span>
                    </div>
                    {(idx === 1 || idx === 3) && <div className="w-1 sm:w-2" />}
                  </React.Fragment>
                ))}
              </div>
              <div className="text-center mt-1.5 text-[#2b3038] font-bold text-xs tracking-wide">
                {formatJowiDate(time)}
              </div>
            </div>
          </div>

          {/* CENTER PIN KEYPAD MODAL (MATCHING IMAGE 3) */}
          <div className="my-auto">
            <div className="w-[290px] sm:w-[320px] bg-gradient-to-b from-[#c8ccd2] via-[#b4b9c1] to-[#9fa5ad] p-4 sm:p-5 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] border-2 border-white/70 flex flex-col items-center">
              {/* iNPOS Brand Logo */}
              <div className="mb-2.5 flex items-center justify-center">
                <InposLogo className="h-7 w-auto" variant="navy" />
              </div>

              {/* TOP USER CARD BADGE (WITH ROLE COLOR) */}
              {(() => {
                const theme = getRoleTheme(selectedUser.role, selectedUser.name);
                return (
                  <div className={`w-full py-3 px-4 rounded-xl ${theme.bgGradient} border-2 ${theme.border} ${theme.shadow} text-center mb-3 relative overflow-hidden`}>
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 pointer-events-none rounded-t-lg" />
                    <div className={`text-base sm:text-lg font-black ${theme.textTop} tracking-wide drop-shadow-sm`}>
                      {selectedUser.name}
                    </div>
                    <div className={`text-[11px] font-bold ${theme.textSub} opacity-90`}>
                      {theme.roleLabel}
                    </div>
                  </div>
                );
              })()}

              {/* PIN DISPLAY CONTAINER (RECESSED DARK SCREEN WITH BULLET DOTS) */}
              <div className="w-full h-12 rounded-xl bg-gradient-to-b from-[#1a1e24] via-[#242930] to-[#2e343d] border-2 border-[#121519] shadow-inner flex items-center justify-center px-4 mb-3">
                {pin.length === 0 ? (
                  <span className="text-gray-500 text-xs font-mono tracking-widest">
                    _ _ _ _
                  </span>
                ) : (
                  <div className="flex items-center gap-2.5">
                    {pin.split("").map((_, i) => (
                      <span key={i} className="text-white text-xl sm:text-2xl leading-none">
                        ●
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ERROR MESSAGE IF INVALID PIN OR UNPAID ACCESS DENIAL */}
              {error && (
                <div className={`w-full mb-3 p-3 rounded-xl text-center font-black shadow-lg ${
                  error.includes("Puli to'lanmaganligi") || error.includes("cheklangan")
                    ? "bg-red-600 text-white border-2 border-red-300 animate-pulse text-xs leading-snug"
                    : "bg-red-600/95 text-white text-[11px] animate-shake"
                }`}>
                  <div className="flex items-center justify-center gap-1.5">
                    <ShieldAlert size={16} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                  {error.includes("Puli to'lanmaganligi") && (
                    <div className="text-[10px] text-white/90 font-medium mt-1">
                      Obuna muddatini uzaytirish uchun CRM administratoriga murojaat qiling
                    </div>
                  )}
                </div>
              )}

              {/* NUMERIC KEYPAD (1-9, 0, BACKSPACE) */}
              <div className="w-full grid grid-cols-3 gap-2 mb-3.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleKeyClick(num.toString())}
                    disabled={isLoading}
                    className="h-11 sm:h-12 rounded-xl bg-gradient-to-b from-[#f5f6f8] via-[#e2e5e9] to-[#caced4] hover:from-[#ffffff] hover:to-[#d8dbe0] active:from-[#caced4] active:to-[#e2e5e9] text-[#212529] font-black text-xl border border-[#9ca3af] shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 active:shadow-inner transition-all flex items-center justify-center cursor-pointer"
                  >
                    {num}
                  </button>
                ))}

                {/* 0 BUTTON */}
                <button
                  onClick={() => handleKeyClick("0")}
                  disabled={isLoading}
                  className="h-11 sm:h-12 rounded-xl bg-gradient-to-b from-[#f5f6f8] via-[#e2e5e9] to-[#caced4] hover:from-[#ffffff] hover:to-[#d8dbe0] active:from-[#caced4] active:to-[#e2e5e9] text-[#212529] font-black text-xl border border-[#9ca3af] shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 active:shadow-inner transition-all flex items-center justify-center cursor-pointer"
                >
                  0
                </button>

                {/* СТЕРЕТЬ / BACKSPACE (SPANS 2 COLS) */}
                <button
                  onClick={handleBackspace}
                  disabled={isLoading}
                  className="col-span-2 h-11 sm:h-12 rounded-xl bg-gradient-to-b from-[#eceff1] via-[#cfd8dc] to-[#b0bec5] hover:from-[#ffffff] hover:to-[#bcc9cf] active:from-[#b0bec5] active:to-[#cfd8dc] text-[#37474f] font-black text-xs uppercase tracking-wider border border-[#90a4ae] shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 active:shadow-inner transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>← Стереть</span>
                </button>
              </div>

              {/* ACTION BUTTONS: ВХОД & НАЗАД (MATCHING IMAGE 3) */}
              <div className="w-full space-y-2">
                {/* 1. ВХОД */}
                <button
                  onClick={handleExecuteLogin}
                  disabled={isLoading || pin.length === 0}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-b from-[#eceff1] via-[#cfd8dc] to-[#b0bec5] hover:from-[#ffffff] hover:via-[#dbe2e6] hover:to-[#bcc9cf] active:from-[#b0bec5] active:to-[#cfd8dc] text-[#263238] font-black text-xs uppercase tracking-wider border-2 border-[#90a4ae] shadow-[0_3px_8px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.9)] active:translate-y-0.5 active:shadow-inner disabled:opacity-50 transition-all flex items-center justify-center cursor-pointer"
                >
                  {isLoading ? "Tekshirilmoqda..." : "Вход"}
                </button>

                {/* 2. НАЗАД */}
                <button
                  onClick={() => {
                    setPin("");
                    setError("");
                    setViewState("users");
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-b from-[#eceff1] via-[#cfd8dc] to-[#b0bec5] hover:from-[#ffffff] hover:via-[#dbe2e6] hover:to-[#bcc9cf] active:from-[#b0bec5] active:to-[#cfd8dc] text-[#263238] font-black text-xs uppercase tracking-wider border-2 border-[#90a4ae] shadow-[0_3px_8px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.9)] active:translate-y-0.5 active:shadow-inner transition-all flex items-center justify-center cursor-pointer"
                >
                  Назад
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM BAR INFO */}
          <div className="w-full flex items-center justify-between text-white/80 text-[11px]">
            <div className="bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              Tanlangan foydalanuvchi: <b className="text-white">{selectedUser.name}</b> ({selectedUser.role})
            </div>
            <div className="bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              Standart PIN: <span className="text-amber-400 font-mono font-bold">{selectedUser.pin || "1111 / 1234 / 2222"}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* LINK CAFE MODAL (CAFE LOGIN & PASSWORD FOR TERMINAL AUTHENTICATION)       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showLinkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-7 bg-[#1c1f24] border-2 border-white/15 rounded-3xl max-w-md w-full shadow-[0_25px_60px_rgba(0,0,0,0.8)] text-left relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-3 shadow-lg text-black font-black">
                <Building2 size={28} />
              </div>

              <div className="flex justify-center mb-2">
                <InposLogo className="h-7 w-auto" variant="white" />
              </div>

              <h3 className="text-xl font-black text-center text-white">
                Кафега Кириш
              </h3>
              <p className="text-gray-400 text-xs text-center mt-1 mb-5">
                Терминални улаш учун кафе администратори логин ва паролини киритинг
              </p>

              {linkError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{linkError}</span>
                </div>
              )}

              {linkSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{linkSuccess}</span>
                </div>
              )}

              <form onSubmit={handleLinkSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Логин ёки Телефон
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      placeholder="admin ёки +998 33 993 99 00"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D0F12] border border-gray-700 text-white text-xs font-medium focus:border-amber-500 outline-none transition-colors"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Пароль
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Пароль"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D0F12] border border-gray-700 text-white text-xs font-medium focus:border-amber-500 outline-none transition-colors"
                      required
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    Тест учун: <span className="text-amber-400 font-mono">admin / admin123</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(false)}
                    className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Бекор қилиш
                  </button>
                  <button
                    type="submit"
                    disabled={isLinking}
                    className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isLinking ? "Уланмоқда..." : "Кириш"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* EXIT CONFIRMATION MODAL                                                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#181A1F] border-2 border-red-500/40 rounded-3xl p-6 lg:p-8 max-w-md w-full shadow-2xl text-left"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5 text-red-400 shadow-lg shadow-red-500/10">
                <ShieldAlert size={32} />
              </div>

              <h3 className="text-xl font-black text-white text-center mb-2">
                Кафедан Чиқиш?
              </h3>
              
              <p className="text-gray-300 text-xs leading-relaxed text-center mb-6">
                Ҳақиқатан ҳам кафедан чиқмоқчимисиз? Чиқиш босилгандан кейин экранда фақат <b className="text-amber-400">«Вход»</b> тугмаси қолади ва қайта кириш учун кафе логин-пароли сўралади.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Бекор қилиш
                </button>
                <button
                  onClick={() => {
                    unlinkCafe();
                    setShowExitModal(false);
                    setViewState("clock");
                  }}
                  className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Чиқиш</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
