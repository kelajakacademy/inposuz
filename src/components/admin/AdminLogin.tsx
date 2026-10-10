import React, { useState } from "react";
import { User, KeyRound, Building2, Eye, EyeOff, Check, HelpCircle, Monitor, MessageSquare } from "lucide-react";
import { AdminUser } from "../../types";
import { InposLogo } from "../common/InposLogo";

interface AdminLoginProps {
  onLoginSuccess: (admin: AdminUser) => void;
  onGoToPos: () => void;
  initialMode?: "login" | "register";
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ 
  onLoginSuccess, 
  onGoToPos,
  initialMode = "login"
}) => {
  const [mode, setMode] = useState<"login" | "register" | "forgot">(initialMode);
  const [lang, setLang] = useState<"ru" | "uz" | "en">("ru");

  // Form states
  const [emailOrPhone, setEmailOrPhone] = useState("+998 33 993 99 00");
  const [password, setPassword] = useState("admin123");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Registration states (Simple and Compact)
  const [companyName, setCompanyName] = useState("");
  const [regEmailPhone, setRegEmailPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Translations
  const t = {
    ru: {
      langLabel: "Язык: Русский",
      signIn: "ВОЙТИ",
      register: "Регистрация",
      forgotPass: "Забыли пароль?",
      loginTab: "Вход",
      emailLabel: "E-mail / Телефон",
      emailHint: "Введите Ваш email (электронный почтовый адрес) или телефон, указанный при Регистрации",
      passLabel: "Пароль",
      passHint: "Введите Ваш пароль, который Вы придумали при Регистрации",
      remember: "Запомнить",
      companyLabel: "Название заведения",
      companyHint: "Введите название Вашего ресторана, кафе или бара",
      regEmailHint: "Укажите email или телефон для входа в облачный бэк-офис",
      regPassHint: "Придумайте пароль для доступа к панели управления",
      submitReg: "ЗАРЕГИСТРИРОВАТЬСЯ",
      quickContact: "Быстрая связь",
      product: "Продукт",
      tariffs: "Тарифы",
      features: "Возможности",
      download: "Скачать",
      support: "Поддержка",
      forManager: "Для менеджера",
      forAccountant: "Для бухгалтера",
      forCashier: "Для кассира",
      forWaiter: "Для официанта",
      forCook: "Для повара",
      taxes: "Работа с налогами (Soliq)",
      promo: "Работа с акциями",
      printSetup: "Настройка печати",
      copyright: "© 2026 iNPOS Cloud. Все права защищены.",
      liveChat: "Напишите нам, мы онлайн!",
      posBtn: "POS Терминал"
    },
    uz: {
      langLabel: "Til: O'zbekcha",
      signIn: "KIRISH",
      register: "Ro'yxatdan o'tish",
      forgotPass: "Parolni unutdingizmi?",
      loginTab: "Kirish",
      emailLabel: "E-mail / Telefon",
      emailHint: "Ro'yxatdan o'tishda ko'rsatilgan email yoki telefon raqamingizni kiriting",
      passLabel: "Parol",
      passHint: "Ro'yxatdan o'tishda o'rnatilgan parolingizni kiriting",
      remember: "Eslab qolish",
      companyLabel: "Muassasa nomi",
      companyHint: "Restoran, kafe yoki baringiz nomini kiriting",
      regEmailHint: "Bulutli back-office ga kirish uchun email yoki telefon kiriting",
      regPassHint: "Boshqaruv paneliga kirish uchun xavfsiz parol o'rnating",
      submitReg: "RO'YXATDAN O'TISH",
      quickContact: "Tezkor aloqa",
      product: "Mahsulot",
      tariffs: "Tariflar",
      features: "Imkoniyatlar",
      download: "Yuklab olish",
      support: "Qo'llab-quvvatlash",
      forManager: "Menejer uchun",
      forAccountant: "Buxgalter uchun",
      forCashier: "Kassir uchun",
      forWaiter: "Ofitsiant uchun",
      forCook: "Oshpaz uchun",
      taxes: "Soliq va fiskal (OFD)",
      promo: "Aksiyalar bilan ishlash",
      printSetup: "Chek chiqarish sozlamalari",
      copyright: "© 2026 iNPOS Cloud. Barcha huquqlar himoyalangan.",
      liveChat: "Bizga yozing, biz onlaynmiz!",
      posBtn: "POS Terminal"
    },
    en: {
      langLabel: "Language: English",
      signIn: "SIGN IN",
      register: "Registration",
      forgotPass: "Forgot password?",
      loginTab: "Sign In",
      emailLabel: "E-mail / Phone",
      emailHint: "Enter your email or phone number provided during registration",
      passLabel: "Password",
      passHint: "Enter your password created during registration",
      remember: "Remember me",
      companyLabel: "Venue name",
      companyHint: "Enter the name of your restaurant, cafe or bar",
      regEmailHint: "Enter email or phone number for back-office login",
      regPassHint: "Create a password for back-office management access",
      submitReg: "REGISTER NOW",
      quickContact: "Quick contact",
      product: "Product",
      tariffs: "Pricing",
      features: "Features",
      download: "Download",
      support: "Support",
      forManager: "For Manager",
      forAccountant: "For Accountant",
      forCashier: "For Cashier",
      forWaiter: "For Waiter",
      forCook: "For Chef / Kitchen",
      taxes: "Tax & Fiscal system",
      promo: "Marketing & Discounts",
      printSetup: "Printer Settings",
      copyright: "© 2026 iNPOS Cloud. All rights reserved.",
      liveChat: "Chat with us, we are online!",
      posBtn: "POS Terminal"
    }
  }[lang];

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: emailOrPhone.trim(),
          username: emailOrPhone.trim(),
          password
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.admin) {
        if (rememberMe) {
          localStorage.setItem("inpos_admin_session", JSON.stringify(data.admin));
        }
        onLoginSuccess(data.admin);
      } else {
        setError(data.message || (lang === "ru" ? "Неверный e-mail/телефон или пароль!" : "E-mail/telefon yoki parol noto'g'ri!"));
      }
    } catch (err: any) {
      setError(lang === "ru" ? "Ошибка подключения к серверу" : "Serverga ulanishda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Simple & Compact Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!companyName.trim() || !regEmailPhone.trim() || !regPassword.trim()) {
      setError(lang === "ru" ? "Пожалуйста, заполните все поля!" : "Iltimos, barcha maydonlarni to'ldiring!");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          businessType: "restaurant",
          fullName: companyName.trim() + " Egasi",
          phone: regEmailPhone.trim(),
          email: regEmailPhone.trim(),
          password: regPassword.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.admin) {
        localStorage.setItem("inpos_admin_session", JSON.stringify(data.admin));
        setSuccessMsg(lang === "ru" ? "Успешная регистрация! Вход в систему..." : "Muvaffaqiyatli ro'yxatdan o'tildi! Tizimga kirilmoqda...");
        setTimeout(() => {
          onLoginSuccess(data.admin);
        }, 600);
      } else {
        setError(data.message || (lang === "ru" ? "Ошибка регистрации" : "Ro'yxatdan o'tishda xatolik"));
      }
    } catch (err: any) {
      setError(lang === "ru" ? "Ошибка подключения к серверу" : "Serverga ulanishda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F7FA] text-[#333333] flex flex-col justify-between font-sans select-none antialiased">
      {/* TOP BAR / LANGUAGE HEADER */}
      <div className="w-full max-w-6xl mx-auto px-6 pt-4 pb-2 flex items-center justify-between text-xs text-gray-500">
        <button
          onClick={onGoToPos}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:text-blue-600 hover:border-blue-400 font-medium shadow-sm transition-all"
        >
          <Monitor size={14} className="text-blue-500" />
          <span>{t.posBtn}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-gray-400">Язык:</span>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            className="bg-transparent text-blue-600 font-medium outline-none cursor-pointer border-b border-transparent hover:border-blue-400 py-0.5"
          >
            <option value="ru">Русский</option>
            <option value="uz">O'zbekcha</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* BRAND LOGO (iNPOS) */}
        <div className="mb-6 text-center flex flex-col items-center">
          <InposLogo className="h-12 w-auto mb-2" variant="navy" />
          <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">
            Restaurant & POS Management System
          </p>
        </div>

        {/* TOP TAB NAVIGATION */}
        <div className="w-full max-w-[620px] flex items-center justify-between px-2 mb-2 text-xs font-medium text-gray-500">
          <div>
            {mode === "login" ? (
              <button
                onClick={() => { setMode("register"); setError(""); }}
                className="text-[#00A3E0] hover:underline"
              >
                {t.register}
              </button>
            ) : (
              <button
                onClick={() => { setMode("login"); setError(""); }}
                className="text-[#00A3E0] hover:underline font-bold"
              >
                {t.loginTab}
              </button>
            )}
          </div>

          <div>
            <button
              onClick={() => {
                alert(lang === "ru" ? "Для сброса пароля обратитесь в службу поддержки: +998 71 200 00 00" : "Parolni tiklash uchun qo'llab-quvvatlash xizmatiga murojaat qiling: +998 71 200 00 00");
              }}
              className="text-[#00A3E0] hover:underline"
            >
              {t.forgotPass}
            </button>
          </div>
        </div>

        {/* WHITE FORM CARD */}
        <div className="w-full max-w-[620px] bg-white rounded-lg border border-gray-200 shadow-sm p-8 transition-all">
          {error && (
            <div className="mb-6 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
              <span className="font-bold">✕</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
              <Check size={14} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === "login" ? (
            /* ================= LOGIN FORM ================= */
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              {/* E-mail / Phone Field */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-full sm:w-1/2 space-y-1">
                  <label className="text-xs font-medium text-gray-700 block">
                    {t.emailLabel}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User size={15} />
                    </div>
                    <input
                      type="text"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder="admin@inpos.uz"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:border-[#00A3E0] focus:ring-1 focus:ring-[#00A3E0] outline-none transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="w-full sm:w-1/2 pt-6 text-[11px] text-gray-400 leading-snug">
                  {t.emailHint}
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-full sm:w-1/2 space-y-1">
                  <label className="text-xs font-medium text-gray-700 block">
                    {t.passLabel}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <KeyRound size={15} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:border-[#00A3E0] focus:ring-1 focus:ring-[#00A3E0] outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="w-full sm:w-1/2 pt-6 text-[11px] text-gray-400 leading-snug">
                  {t.passHint}
                </div>
              </div>

              {/* Bottom Row: Remember Me + Sign In Button */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#00A3E0] focus:ring-[#00A3E0]"
                  />
                  <span>{t.remember}</span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-2.5 bg-[#00A3E0] hover:bg-[#008fcc] active:bg-[#007ba8] text-white font-bold text-xs uppercase tracking-wider rounded shadow-sm transition-all disabled:opacity-50"
                >
                  {isLoading ? "..." : t.signIn}
                </button>
              </div>
            </form>
          ) : (
            /* ================= REGISTRATION FORM (ODDIY VA IXCHAM) ================= */
            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              {/* Venue Name */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-full sm:w-1/2 space-y-1">
                  <label className="text-xs font-medium text-gray-700 block">
                    {t.companyLabel}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Building2 size={15} />
                    </div>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Rayhon Milliy Taomlar"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:border-[#00A3E0] focus:ring-1 focus:ring-[#00A3E0] outline-none transition-all"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="w-full sm:w-1/2 pt-6 text-[11px] text-gray-400 leading-snug">
                  {t.companyHint}
                </div>
              </div>

              {/* Email / Phone */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-full sm:w-1/2 space-y-1">
                  <label className="text-xs font-medium text-gray-700 block">
                    {t.emailLabel}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User size={15} />
                    </div>
                    <input
                      type="text"
                      value={regEmailPhone}
                      onChange={(e) => setRegEmailPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:border-[#00A3E0] focus:ring-1 focus:ring-[#00A3E0] outline-none transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="w-full sm:w-1/2 pt-6 text-[11px] text-gray-400 leading-snug">
                  {t.regEmailHint}
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-full sm:w-1/2 space-y-1">
                  <label className="text-xs font-medium text-gray-700 block">
                    {t.passLabel}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <KeyRound size={15} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded text-xs text-gray-800 focus:border-[#00A3E0] focus:ring-1 focus:ring-[#00A3E0] outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="w-full sm:w-1/2 pt-6 text-[11px] text-gray-400 leading-snug">
                  {t.regPassHint}
                </div>
              </div>

              {/* Register Button */}
              <div className="pt-3 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-2.5 bg-[#00A3E0] hover:bg-[#008fcc] active:bg-[#007ba8] text-white font-bold text-xs uppercase tracking-wider rounded shadow-sm transition-all disabled:opacity-50"
                >
                  {isLoading ? "..." : t.submitReg}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* DARK FOOTER EXACTLY AS IN JOWI SCREENSHOT */}
      <footer className="w-full bg-[#2C3238] text-gray-300 text-xs py-10 px-6 sm:px-12 border-t border-gray-700">
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Links */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 text-[11px]">
            {/* Col 1: Fast Contact */}
            <div className="space-y-2">
              <h3 className="text-white font-bold text-xs mb-3">{t.quickContact}</h3>
              <div className="space-y-1.5 text-gray-400">
                <div className="flex gap-2">
                  <span className="text-gray-500">Тел.:</span>
                  <div className="space-y-1">
                    <p className="text-gray-300">Ташкент: +998 (71) 200-00-00</p>
                    <p>Москва: +7 (925) 934-41-84</p>
                    <p>Санкт-Петербург: +7 (812) 425-56-98</p>
                    <p>Алма-Ата: +7 (727) 330-53-53</p>
                  </div>
                </div>
                <div className="pt-2">
                  <span className="text-gray-500">Email: </span>
                  <a href="mailto:support@inpos.uz" className="text-blue-400 hover:underline">
                    help@inpos.uz
                  </a>
                </div>
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-2">
              <h3 className="text-white font-bold text-xs mb-3">{t.product}</h3>
              <ul className="space-y-1.5 text-gray-400">
                <li><a href="#tariffs" className="hover:text-white transition-colors">{t.tariffs}</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">{t.features}</a></li>
                <li><a href="#download" className="hover:text-white transition-colors">{t.download}</a></li>
                <li><a href="#support" className="hover:text-white transition-colors">{t.support}</a></li>
              </ul>
            </div>

            {/* Col 3: Role-based */}
            <div className="space-y-2">
              <h3 className="text-white font-bold text-xs mb-3">Для персонала</h3>
              <ul className="space-y-1.5 text-gray-400">
                <li><a href="#manager" className="hover:text-white transition-colors">{t.forManager}</a></li>
                <li><a href="#accountant" className="hover:text-white transition-colors">{t.forAccountant}</a></li>
                <li><a href="#cashier" className="hover:text-white transition-colors">{t.forCashier}</a></li>
                <li><a href="#waiter" className="hover:text-white transition-colors">{t.forWaiter}</a></li>
              </ul>
            </div>

            {/* Col 4: Operations & Taxes */}
            <div className="space-y-2">
              <h3 className="text-white font-bold text-xs mb-3">Функции & Фискал</h3>
              <ul className="space-y-1.5 text-gray-400">
                <li><a href="#cook" className="hover:text-white transition-colors">{t.forCook}</a></li>
                <li><a href="#taxes" className="hover:text-white transition-colors">{t.taxes}</a></li>
                <li><a href="#promo" className="hover:text-white transition-colors">{t.promo}</a></li>
                <li><a href="#print" className="hover:text-white transition-colors">{t.printSetup}</a></li>
              </ul>
            </div>
          </div>

          {/* Languages & Copyright Line */}
          <div className="pt-6 border-t border-gray-700/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-400">
            <div className="flex flex-wrap gap-4 text-gray-400">
              <button onClick={() => setLang("ru")} className={`hover:text-white ${lang === "ru" ? "text-white underline font-bold" : ""}`}>Русский</button>
              <button onClick={() => setLang("en")} className={`hover:text-white ${lang === "en" ? "text-white underline font-bold" : ""}`}>English</button>
              <button onClick={() => setLang("uz")} className={`hover:text-white ${lang === "uz" ? "text-white underline font-bold" : ""}`}>O'zbekcha</button>
              <span className="text-gray-600">|</span>
              <span className="text-gray-500">Тоҷикӣ</span>
              <span className="text-gray-500">Azərbaycan</span>
              <span className="text-gray-500">Қазақша</span>
            </div>

            <div>
              <p>{t.copyright}</p>
            </div>
          </div>
        </div>

        {/* JIVOSITE STYLE CHAT BADGE */}
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => alert(lang === "ru" ? "Служба поддержки онлайн: +998 71 200 00 00" : "Qo'llab-quvvatlash xizmati online: +998 71 200 00 00")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#242A30] border border-gray-600/70 text-white text-xs font-medium shadow-2xl hover:bg-[#2e353c] transition-all"
          >
            <span>{t.liveChat}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>
      </footer>
    </div>
  );
};
