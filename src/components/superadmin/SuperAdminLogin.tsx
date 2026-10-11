import React, { useState, useEffect } from "react";
import { User, Monitor, Send, Check, ShieldCheck, RefreshCw, ExternalLink, QrCode, Lock, KeyRound, Sparkles } from "lucide-react";
import { InposLogo } from "../common/InposLogo";

interface SuperAdminLoginProps {
  onLoginSuccess: () => void;
  onGoToPos: () => void;
}

export const SuperAdminLogin: React.FC<SuperAdminLoginProps> = ({ onLoginSuccess, onGoToPos }) => {
  const [lang, setLang] = useState<"uz" | "ru" | "en">("uz");
  const [authMode, setAuthMode] = useState<"qr" | "code">("qr");

  // Form states - Empty initial email as requested!
  const [email, setEmail] = useState("");
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [otpCode, setOtpCode] = useState("");

  // QR Auth states
  const [qrSessionId, setQrSessionId] = useState("");
  const [qrLink, setQrLink] = useState("");
  const [isQrApproved, setIsQrApproved] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const BOT_USERNAME = "@BarposAuth_Bot";

  const t = {
    uz: {
      title: "CRM",
      subtitle: "",
      qrTab: "📷 QR-код сканерлаш (Автомат)",
      codeTab: "🔑 Telegram Код орқали",
      emailLabel: "Login Email",
      emailPlaceholder: "Эмаил манзилингизни киритинг",
      emailHint: "Авторизация эмаили",
      requestBtn: "Telegram Bot орқали код олиш",
      verifyLabel: "Telegram 6-хонали тасдиқлаш коди",
      verifyHint: "@BarposAuth_Bot ботидан юборилган 6 хонали тасдиқлаш кодини киритинг",
      submitBtn: "КИРИШ ЖАРЁНОНИНИ ТАСДИҚЛАШ",
      resendBtn: "Кодни қайта юбориш",
      posBtn: "POS Терминалга қайтиш",
      openBotBtn: "Telegram Ботда тасдиқлаш",
      qrHintTitle: "QR-код орқали киришни тасдиқлаш:",
      qrHintText: "Телефонингиз камераси ёки Telegram орқали ушбу QR-кодни сканер қилинг. Ботингизда тасдиқланиши билан браузерга автоматик кирилади."
    },
    ru: {
      title: "CRM",
      subtitle: "",
      qrTab: "📷 QR-код сканирование (Автомат)",
      codeTab: "🔑 Вход по Telegram коду",
      emailLabel: "Login Email",
      emailPlaceholder: "Введите Ваш e-mail адрес",
      emailHint: "Авторизационный e-mail",
      requestBtn: "Получить код через Telegram Bot",
      verifyLabel: "6-значный код подтверждения Telegram",
      verifyHint: "Введите 6-значный код, полученный от бота @BarposAuth_Bot",
      submitBtn: "ПОДТВЕРДИТЬ ВХОД",
      resendBtn: "Запросить код повторно",
      posBtn: "Вернуться в POS",
      openBotBtn: "Открыть и Подтвердить в Telegram",
      qrHintTitle: "Подтверждение входа по QR-коду:",
      qrHintText: "Отсканируйте QR-код камерой телефона или Telegram. После подтверждения в боте вход выполнится автоматически."
    },
    en: {
      title: "CRM",
      subtitle: "",
      qrTab: "📷 QR Code Scan (Auto)",
      codeTab: "🔑 Telegram Code Auth",
      emailLabel: "Login Email",
      emailPlaceholder: "Enter your email address",
      emailHint: "Authorization email",
      requestBtn: "Get Code via Telegram Bot",
      verifyLabel: "6-digit Telegram Verification Code",
      verifyHint: "Enter 6-digit verification code received from @BarposAuth_Bot",
      submitBtn: "CONFIRM AND SIGN IN",
      resendBtn: "Resend Code",
      posBtn: "Back to POS",
      openBotBtn: "Confirm in Telegram Bot",
      qrHintTitle: "QR Code Authentication:",
      qrHintText: "Scan QR Code using phone camera or Telegram app. Once confirmed in bot, sign-in happens automatically."
    }
  }[lang];

  // Initialize QR Code Auth Session
  const initQrSession = async () => {
    try {
      const res = await fetch("/api/superadmin/create-qr-session", { method: "POST" });
      const data = await res.json();
      if (data && data.sessionId) {
        setQrSessionId(data.sessionId);
        setQrLink(data.qrLink || `https://t.me/BarposAuth_Bot?start=${data.sessionId}`);
      }
    } catch (e) {
      console.error("QR Session creation error", e);
    }
  };

  useEffect(() => {
    initQrSession();
  }, []);

  // Poll QR Code approval status every 1.5 seconds when on QR tab
  useEffect(() => {
    if (authMode !== "qr" || !qrSessionId || isQrApproved) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/superadmin/check-qr-session?sessionId=${qrSessionId}`);
        const data = await res.json();
        if (data && data.approved) {
          setIsQrApproved(true);
          setSuccessMsg("✅ QR-код орқали муваффақиятли тасдиқланди! Тизимга кирилмоқда...");
          clearInterval(interval);

          setTimeout(() => {
            localStorage.setItem("inpos_master_crm_auth", "true");
            onLoginSuccess();
          }, 800);
        }
      } catch (e) {}
    }, 1500);

    return () => clearInterval(interval);
  }, [authMode, qrSessionId, isQrApproved]);

  // Request Telegram OTP Code
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const em = email.trim().toLowerCase();
    if (!em || em !== "nastarin@inpos.uz") {
      setError("❌ Илтимос, тўғри CRM логини (nastarin@inpos.uz) ни киритинг!");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/superadmin/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();
      setOtpStep("verify");

      if (res.ok && data.success) {
        setSuccessMsg(`🔑 Тасдиқлаш коди Telegram орқали ботингизга юборилди!`);
      } else {
        setError(data.message || "Код юборишда хатолик юз берди.");
      }
    } catch (err) {
      setOtpStep("verify");
      setSuccessMsg(`🤖 Илтимос, Telegram'да @BarposAuth_Bot ботига кириб /start босинг!`);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Telegram OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otpCode.trim() || otpCode.length !== 6) {
      setError("Илтимос, 6-хонали тасдиқлаш кодини тўлиқ киритинг!");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/superadmin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode.trim() })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg("✅ Тасдиқланди! CRM ойнасига кирилмоқда...");
        setTimeout(() => {
          localStorage.setItem("inpos_master_crm_auth", "true");
          onLoginSuccess();
        }, 600);
      } else {
        setError(data.message || "❌ Тасдиқлаш коди нотўғри! Илтимос, қайтадан текшириб киритинг.");
      }
    } catch (err) {
      setError("Сервер билан алоқа хатоси.");
    } finally {
      setIsLoading(false);
    }
  };

  const qrImageUrl = qrLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrLink)}`
    : "";

  return (
    <div className="min-h-screen w-full bg-[#F5F7FA] text-[#333333] flex flex-col justify-between font-sans select-none antialiased">
      {/* TOP BAR / LANGUAGE HEADER */}
      <div className="w-full max-w-6xl mx-auto px-6 pt-4 pb-2 flex items-center justify-between text-xs text-gray-500">
        <button
          onClick={onGoToPos}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:text-blue-600 hover:border-blue-400 font-medium shadow-sm transition-all cursor-pointer"
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
            <option value="uz">O'zbekcha</option>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* BRAND LOGO (iNPOS) */}
        <div className="mb-6 text-center flex flex-col items-center">
          <div className="flex items-center gap-2">
            <InposLogo className="h-10 w-auto" variant="navy" />
            <span className="text-xs bg-blue-500/10 text-blue-700 border border-blue-500/20 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              CRM
            </span>
          </div>
        </div>

        {/* AUTH MODE TOGGLE TABS */}
        <div className="w-full max-w-[580px] grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={() => { setAuthMode("qr"); setError(""); }}
            className={`py-3 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${
              authMode === "qr"
                ? "bg-[#00A3E0] text-white border-[#00A3E0] shadow-md"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <QrCode size={16} />
            <span>{t.qrTab}</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMode("code"); setError(""); }}
            className={`py-3 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border ${
              authMode === "code"
                ? "bg-[#00A3E0] text-white border-[#00A3E0] shadow-md"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <KeyRound size={16} />
            <span>{t.codeTab}</span>
          </button>
        </div>

        {/* WHITE FORM CARD */}
        <div className="w-full max-w-[580px] bg-white rounded-xl border border-gray-200 shadow-md p-8 transition-all">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
              <span className="font-bold text-sm">✕</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5">
              <Check size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successMsg}</div>
            </div>
          )}

          {authMode === "qr" ? (
            /* ========================================================================= */
            /* MODE 1: QR CODE AUTHENTICATION                                            */
            /* ========================================================================= */
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900 flex items-center justify-center gap-1.5">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>{t.qrHintTitle}</span>
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  {t.qrHintText}
                </p>
              </div>

              {/* QR CODE BOX */}
              <div className="relative p-4 bg-white rounded-2xl border-2 border-gray-200 shadow-lg inline-block">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="iNPOS Auth QR Code"
                    className="w-52 h-52 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-52 h-52 bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs animate-pulse">
                    QR-код яратилмоқда...
                  </div>
                )}

                {/* Scan Status Badge */}
                <div className="mt-3 py-1 px-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <span>Сканерланиши кутилмоқда...</span>
                </div>
              </div>

              {/* Direct Link Button */}
              {qrLink && (
                <a
                  href={qrLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-[#1C2733] hover:bg-[#283845] text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <Send size={15} className="text-blue-400" />
                  <span>{t.openBotBtn}</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          ) : (
            /* ========================================================================= */
            /* MODE 2: TELEGRAM 6-DIGIT CODE AUTHENTICATION                             */
            /* ========================================================================= */
            <>
              {otpStep === "request" ? (
                <form onSubmit={handleRequestOtp} className="space-y-6">
                  {/* Email Input Field - START EMPTY (MANUAL TYPING) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">
                      {t.emailLabel}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <User size={16} />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-xs font-mono font-bold focus:border-[#00A3E0] focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight pt-1">
                      {t.emailHint}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-6 rounded-lg bg-[#00A3E0] hover:bg-[#008cc2] text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span>Код юборилмоқда...</span>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>{t.requestBtn}</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* Direct Bot Link */}
                  <div className="p-4 bg-[#1C2733] text-white rounded-xl border border-blue-400/30 shadow-md text-center space-y-3">
                    <div className="text-xs font-bold text-blue-300">
                      📲 Telegram Бот орқали кодингизни олинг:
                    </div>

                    <a
                      href="https://t.me/BarposAuth_Bot?start=login"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-400 text-white font-black text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <Send size={16} />
                      <span>{t.openBotBtn}</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">
                      {t.verifyLabel}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <ShieldCheck size={18} />
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="Кодни киритинг"
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-lg font-mono font-black tracking-widest focus:border-[#00A3E0] focus:bg-white outline-none transition-all text-center"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight pt-1">
                      {t.verifyHint}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setOtpStep("request"); setError(""); }}
                      className="py-3 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw size={14} />
                      <span>{t.resendBtn}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="py-3 px-4 rounded-lg bg-[#00A3E0] hover:bg-[#008cc2] text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? "Текширилмоқда..." : t.submitBtn}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full text-center py-4 text-[11px] text-gray-400 border-t border-gray-200/60 bg-white">
        © 2026 iNPOS Cloud CRM System. All rights reserved.
      </footer>
    </div>
  );
};
