import React, { useState, useEffect } from "react";
import { 
  X, 
  Check, 
  Copy, 
  Send, 
  Volume2, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Store, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Sliders, 
  Building2, 
  Key, 
  ShieldCheck, 
  Radio
} from "lucide-react";
import { DeliverySettings, Cafe } from "../../types";

interface AggregatorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCafe?: Cafe | null;
  onSaved?: () => void;
}

export const AggregatorSettingsModal: React.FC<AggregatorSettingsModalProps> = ({
  isOpen,
  onClose,
  activeCafe,
  onSaved
}) => {
  const [activeTab, setActiveTab] = useState<"yandex" | "uzum" | "telegram" | "general">("yandex");
  const [cafes, setCafes] = useState<Array<{ id: string; name: string; businessType?: string }>>([]);
  const [selectedCafeId, setSelectedCafeId] = useState<string>(activeCafe?.id || "default");
  
  const [settings, setSettings] = useState<DeliverySettings>({
    cafeId: "default",
    cafeName: "Asosiy Kafe",
    yandexEats: {
      enabled: true,
      storeId: "YE-REST-77881",
      apiKey: "ye_live_sec_9948291048",
      clientSecret: "sec_yandex_webhook_sign_2026",
      webhookUrl: `https://${window.location.host}/api/delivery/orders?source=yandex`,
      autoAccept: false,
      commissionPercent: 20,
      status: "connected",
      soundAlert: true,
      connectionMessage: "Aloqa barqaror"
    },
    uzumTezkor: {
      enabled: true,
      merchantId: "UZUM-TEZKOR-84920",
      secretKey: "uzum_live_sec_33481029",
      outletId: "default",
      webhookUrl: `https://${window.location.host}/api/delivery/orders?source=uzum`,
      autoAccept: false,
      commissionPercent: 18,
      status: "connected",
      soundAlert: true,
      connectionMessage: "Aloqa barqaror"
    },
    telegramBot: {
      enabled: true,
      botToken: "7492819201:AAH8k2j1m92kz91ls0289192kssla",
      botUsername: "InposDeliveryBot",
      adminChatId: "982173491",
      webhookUrl: `https://${window.location.host}/api/telegram/webhook`,
      autoAccept: false,
      welcomeMessage: "Assalomu alaykum! Bizning restoran Telegram botiga xush kelibsiz. Quyidagi menyu orqali sevimli taomlaringizga buyurtma bering 🍕🍔",
      soundAlert: true,
      status: "connected",
      connectionMessage: "Telegram Bot faol"
    },
    directDelivery: {
      enabled: true,
      minOrderAmount: 30.00,
      defaultDeliveryFee: 2.00,
      freeDeliveryThreshold: 100.00,
      phone: "+998 71 200 00 00"
    },
    soundNotification: true,
    autoPrintReceipt: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Test connection state
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [isSettingWebhook, setIsSettingWebhook] = useState(false);
  const [webhookSetResult, setWebhookSetResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testResult, setTestResult] = useState<{
    provider: string;
    success: boolean;
    message: string;
    latency?: number;
    details?: any;
  } | null>(null);

  // Accordion guide states
  const [showYandexGuide, setShowYandexGuide] = useState(false);
  const [showUzumGuide, setShowUzumGuide] = useState(false);
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);

  // Fetch cafes list
  const fetchCafes = async () => {
    try {
      const res = await fetch("/api/cafes");
      const data = await res.json();
      if (data.success && Array.isArray(data.cafes) && data.cafes.length > 0) {
        setCafes(data.cafes);
      } else {
        setCafes([
          { id: activeCafe?.id || "default", name: activeCafe?.name || "Asosiy Kafe" }
        ]);
      }
    } catch (e) {
      setCafes([
        { id: activeCafe?.id || "default", name: activeCafe?.name || "Asosiy Kafe" }
      ]);
    }
  };

  // Fetch settings for active cafe
  const fetchSettings = async (cafeId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/delivery/settings?cafeId=${cafeId}`, {
        headers: { "x-cafe-id": cafeId }
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error("Error fetching delivery settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCafes();
      const initialCafeId = activeCafe?.id || "default";
      setSelectedCafeId(initialCafeId);
      fetchSettings(initialCafeId);
      setTestResult(null);
      setSaveSuccessMessage("");
    }
  }, [isOpen, activeCafe]);

  const handleCafeChange = (cafeId: string) => {
    setSelectedCafeId(cafeId);
    fetchSettings(cafeId);
    setTestResult(null);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Run real API Ping / Test Connection
  const handleTestConnection = async (provider: "yandex" | "uzum" | "telegram") => {
    setTestingProvider(provider);
    setTestResult(null);

    let config: any = {};
    if (provider === "yandex") {
      config = {
        storeId: settings.yandexEats.storeId,
        apiKey: settings.yandexEats.apiKey,
        clientSecret: settings.yandexEats.clientSecret
      };
    } else if (provider === "uzum") {
      config = {
        merchantId: settings.uzumTezkor.merchantId,
        secretKey: settings.uzumTezkor.secretKey,
        outletId: settings.uzumTezkor.outletId
      };
    } else if (provider === "telegram") {
      config = {
        botToken: settings.telegramBot.botToken,
        botUsername: settings.telegramBot.botUsername
      };
    }

    try {
      const res = await fetch("/api/delivery/test-connection", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": selectedCafeId
        },
        body: JSON.stringify({
          provider,
          config,
          cafeId: selectedCafeId
        })
      });

      const data = await res.json();
      setTestResult({
        provider,
        success: data.success,
        message: data.message,
        latency: data.latency,
        details: data.details
      });

      // Update in-memory status
      if (provider === "yandex") {
        setSettings(prev => ({
          ...prev,
          yandexEats: {
            ...prev.yandexEats,
            status: data.success ? "connected" : "error",
            connectionMessage: data.message,
            lastCheckedAt: new Date().toLocaleTimeString()
          }
        }));
      } else if (provider === "uzum") {
        setSettings(prev => ({
          ...prev,
          uzumTezkor: {
            ...prev.uzumTezkor,
            status: data.success ? "connected" : "error",
            connectionMessage: data.message,
            lastCheckedAt: new Date().toLocaleTimeString()
          }
        }));
      } else if (provider === "telegram") {
        setSettings(prev => ({
          ...prev,
          telegramBot: {
            ...prev.telegramBot,
            status: data.success ? "connected" : "error",
            connectionMessage: data.message,
            lastCheckedAt: new Date().toLocaleTimeString()
          }
        }));
      }
    } catch (e: any) {
      setTestResult({
        provider,
        success: false,
        message: `Ulanishda xatolik: ${e.message}`
      });
    } finally {
      setTestingProvider(null);
    }
  };

  // Auto register Telegram Webhook with Telegram API
  const handleAutoSetTelegramWebhook = async () => {
    setIsSettingWebhook(true);
    setWebhookSetResult(null);

    const botToken = settings.telegramBot.botToken;
    const webhookUrl = `https://${window.location.host}/api/telegram/webhook?cafeId=${selectedCafeId}`;

    if (!botToken || botToken.trim().length < 10) {
      setWebhookSetResult({
        success: false,
        message: "Bot Token kiritilmagan. Avval @BotFather dan olingan tokenni kiriting."
      });
      setIsSettingWebhook(false);
      return;
    }

    try {
      const res = await fetch("/api/delivery/telegram/set-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken, webhookUrl })
      });
      const data = await res.json();
      setWebhookSetResult({
        success: data.success,
        message: data.message || data.description
      });
    } catch (e: any) {
      setWebhookSetResult({
        success: false,
        message: `Webhook ulashda xatolik: ${e.message}`
      });
    } finally {
      setIsSettingWebhook(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMessage("");

    try {
      const payload = {
        ...settings,
        cafeId: selectedCafeId
      };

      const res = await fetch("/api/delivery/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": selectedCafeId
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccessMessage("Sozlamalar muvaffaqiyatli saqlandi!");
        if (onSaved) onSaved();
        setTimeout(() => {
          setSaveSuccessMessage("");
        }, 3000);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#181B22] border border-gray-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between bg-[#111317]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Agregatorlar va API Integratsiya Sozlamalari
              </h2>
              <p className="text-xs text-gray-400">
                Yandex Eats, Uzum Tezkor va Telegram Bot API kalitlarini kiritish va sozlash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cafe / Branch Selector Bar */}
        <div className="bg-[#14161D] px-4 sm:px-6 py-3 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-gray-300">Faol Kafe / Filial:</span>
            <select
              value={selectedCafeId}
              onChange={(e) => handleCafeChange(e.target.value)}
              className="bg-[#1D212B] border border-gray-700 text-amber-300 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
            >
              {cafes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (ID: {c.id})
                </option>
              ))}
            </select>
          </div>
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Har bir filial o'zining shaxsiy API kalitlariga ega bo'ladi</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-gray-800 bg-[#14161D] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("yandex")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "yandex"
                ? "border-[#FCE000] text-[#FCE000]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-[#FCE000]" />
            Yandex Eats API
            {settings.yandexEats.enabled && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#FCE000]/20 text-[#FCE000] text-[10px]">Faol</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("uzum")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "uzum"
                ? "border-[#7000FF] text-[#A855F7]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <span className="w-3 h-3 rounded-full bg-[#7000FF]" />
            Uzum Tezkor API
            {settings.uzumTezkor.enabled && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#7000FF]/20 text-[#A855F7] text-[10px]">Faol</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("telegram")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "telegram"
                ? "border-[#2AABEE] text-[#54C5FF]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Send size={13} className="text-[#2AABEE]" />
            Telegram Bot API
            {settings.telegramBot.enabled && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#2AABEE]/20 text-[#54C5FF] text-[10px]">Faol</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "general"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Volume2 size={13} />
            Umumiy / Chek
          </button>
        </div>

        {/* Content Area */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {isLoading ? (
            <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="animate-spin text-amber-400" size={28} />
              <p className="text-xs">Sozlamalar yuklanmoqda...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: YANDEX EATS */}
              {activeTab === "yandex" && (
                <div className="space-y-4">
                  {/* Status & Toggle banner */}
                  <div className="p-4 rounded-2xl bg-[#111317] border border-[#FCE000]/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FCE000] text-black flex items-center justify-center font-black text-base shadow-lg shadow-[#FCE000]/10">
                        Y
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-white text-sm">Yandex Eats Integratsiyasi</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            settings.yandexEats.status === "connected"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}>
                            {settings.yandexEats.status === "connected" ? "🟢 Ulangan" : "🔴 Ulanmagan"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Yandex Eats buyurtmalarini to'g'ridan-to'g'ri POS va oshxonaga qabul qilish
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-200">
                      <input
                        type="checkbox"
                        checked={settings.yandexEats.enabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          yandexEats: { ...settings.yandexEats, enabled: e.target.checked }
                        })}
                        className="w-4 h-4 rounded text-amber-500"
                      />
                      Integratsiyani yoqish
                    </label>
                  </div>

                  {/* Form inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 font-bold text-xs mb-1.5 flex items-center justify-between">
                        <span>Restoran ID (Store ID / Place ID) *</span>
                        <span className="text-[10px] text-gray-500">Yandex Partner da beriladi</span>
                      </label>
                      <input
                        type="text"
                        placeholder="YE-REST-77881 yoki 123456"
                        value={settings.yandexEats.storeId}
                        onChange={(e) => setSettings({
                          ...settings,
                          yandexEats: { ...settings.yandexEats, storeId: e.target.value }
                        })}
                        className="w-full bg-[#111317] border border-gray-800 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:border-[#FCE000] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold text-xs mb-1.5 flex items-center justify-between">
                        <span>API Kalit (OAuth Token / API Key) *</span>
                        <span className="text-[10px] text-gray-500">Maxfiy kalit</span>
                      </label>
                      <input
                        type="password"
                        placeholder="ye_live_sec_9948..."
                        value={settings.yandexEats.apiKey}
                        onChange={(e) => setSettings({
                          ...settings,
                          yandexEats: { ...settings.yandexEats, apiKey: e.target.value }
                        })}
                        className="w-full bg-[#111317] border border-gray-800 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:border-[#FCE000] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold text-xs mb-1.5 flex items-center justify-between">
                        <span>Client Secret (Webhook Sign Key)</span>
                        <span className="text-[10px] text-gray-500">Ixtiyoriy</span>
                      </label>
                      <input
                        type="password"
                        placeholder="sec_yandex_..."
                        value={settings.yandexEats.clientSecret || ""}
                        onChange={(e) => setSettings({
                          ...settings,
                          yandexEats: { ...settings.yandexEats, clientSecret: e.target.value }
                        })}
                        className="w-full bg-[#111317] border border-gray-800 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:border-[#FCE000] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold text-xs mb-1.5">Komissiya stavkasi (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={settings.yandexEats.commissionPercent}
                        onChange={(e) => setSettings({
                          ...settings,
                          yandexEats: { ...settings.yandexEats, commissionPercent: Number(e.target.value) }
                        })}
                        className="w-full bg-[#111317] border border-gray-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-[#FCE000] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Webhook URL copy section */}
                  <div className="bg-[#111317] p-3.5 rounded-2xl border border-gray-800 space-y-1.5">
                    <label className="block text-gray-300 font-bold text-xs">
                      Yandex Eats Webhook URL (Ushbu havolani Yandex shaxsiy kabinetiga qo'ying):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`https://${window.location.host}/api/delivery/orders?source=yandex&cafeId=${selectedCafeId}`}
                        className="w-full bg-[#181B22] border border-gray-700 rounded-xl px-3 py-2 text-xs font-mono text-[#FCE000] select-all"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`https://${window.location.host}/api/delivery/orders?source=yandex&cafeId=${selectedCafeId}`, "yandex_wh")}
                        className="px-4 py-2 bg-[#FCE000]/10 hover:bg-[#FCE000]/20 text-[#FCE000] rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 border border-[#FCE000]/30 transition-all"
                      >
                        {copiedKey === "yandex_wh" ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        Nusxa
                      </button>
                    </div>
                  </div>

                  {/* Test Connection Button */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={testingProvider === "yandex"}
                      onClick={() => handleTestConnection("yandex")}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-gray-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {testingProvider === "yandex" ? (
                        <RefreshCw size={14} className="animate-spin text-[#FCE000]" />
                      ) : (
                        <Radio size={14} className="text-[#FCE000]" />
                      )}
                      {testingProvider === "yandex" ? "Tekshirilmoqda..." : "🔌 Yandex API Aloqasini Tekshirish"}
                    </button>
                  </div>

                  {/* Test result output */}
                  {testResult && testResult.provider === "yandex" && (
                    <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      testResult.success 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}>
                      {testResult.success ? <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />}
                      <div>
                        <div className="font-bold">{testResult.message}</div>
                        {testResult.latency && <div className="text-[10px] text-gray-400 mt-0.5">Javob vaqti (Ping): {testResult.latency} ms</div>}
                      </div>
                    </div>
                  )}

                  {/* Accordion Guide */}
                  <div className="border border-gray-800 rounded-2xl overflow-hidden bg-[#111317]">
                    <button
                      type="button"
                      onClick={() => setShowYandexGuide(!showYandexGuide)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-[#FCE000]">
                        <HelpCircle size={15} />
                        Yandex Eats API ma'lumotlarini qayerdan olish kerak? (Qo'llanma)
                      </span>
                      {showYandexGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {showYandexGuide && (
                      <div className="px-4 pb-4 text-xs text-gray-300 space-y-2.5 border-t border-gray-800/80 pt-3">
                        <p className="font-bold text-white">Yandex Eats bilan ulash bo'yicha 5 ta oddiy qadam:</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-gray-400 leading-relaxed">
                          <li><strong className="text-white">Yandex Partner kabinetiga kiring:</strong> <code className="text-[#FCE000] font-mono bg-black/40 px-1 py-0.5 rounded">https://partner.eda.yandex.ru</code> portaliga kiring.</li>
                          <li><strong className="text-white">Restoran ID:</strong> Shaxsiy kabinetingizdagi restoran sahifasidagi ID raqamni nusxalab <strong className="text-white">Restoran ID</strong> maydoniga qo'ying.</li>
                          <li><strong className="text-white">API Token olish:</strong> "Интеграции" (Integratsiyalar) yoki "Разработчикам" bo'limiga o'tib yangi API kalit yarating va nusxalang.</li>
                          <li><strong className="text-white">Webhook URL ni ulash:</strong> Yuqoridagi <strong className="text-[#FCE000]">Yandex Eats Webhook URL</strong> havolasini Yandex kabinetidagi Webhook manziliga kiriting.</li>
                          <li><strong className="text-white">Aloqani tekshirish:</strong> "Aloqani tekshirish" tugmasini bosing va "Saqlash" tugmasi orqali sozlamalarni yakunlang.</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: UZUM TEZKOR */}
              {activeTab === "uzum" && (
                <div className="space-y-4">
                  {/* Status & Toggle banner */}
                  <div className="p-4 rounded-2xl bg-[#111317] border border-[#7000FF]/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#7000FF] text-white flex items-center justify-center font-black text-base shadow-lg shadow-[#7000FF]/20">
                        U
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-white text-sm">Uzum Tezkor Integratsiyasi</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            settings.uzumTezkor.status === "connected"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}>
                            {settings.uzumTezkor.status === "connected" ? "🟢 Ulangan" : "🔴 Ulanmagan"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Uzum Tezkor buyurtmalarini avtomatik qabul qilish va oshxonaga uzatish
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-200">
                      <input
                        type="checkbox"
                        checked={settings.uzumTezkor.enabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          uzumTezkor: { ...settings.uzumTezkor, enabled: e.target.checked }
                        })}
                        className="w-4 h-4 rounded text-purple-600"
                      />
                      Integratsiyani yoqish
                    </label>
                  </div>

                  {/* Form inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 font-bold text-xs mb-1.5 flex items-center justify-between">
                        <span>Merchant ID (Do'kon ID) *</span>
                        <span className="text-[10px] text-gray-500">Uzum Tezkor Partner da beriladi</span>
                      </label>
                      <input
                        type="text"
                        placeholder="UZUM-TEZKOR-84920"
                        value={settings.uzumTezkor.merchantId}
                        onChange={(e) => setSettings({
                          ...settings,
                          uzumTezkor: { ...settings.uzumTezkor, merchantId: e.target.value }
                        })}
                        className="w-full bg-[#111317] border border-gray-800 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:border-[#7000FF] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold text-xs mb-1.5 flex items-center justify-between">
                        <span>Secret Key / API Token *</span>
                        <span className="text-[10px] text-gray-500">Maxfiy kalit</span>
                      </label>
                      <input
                        type="password"
                        placeholder="uzum_live_sec_..."
                        value={settings.uzumTezkor.secretKey}
                        onChange={(e) => setSettings({
                          ...settings,
                          uzumTezkor: { ...settings.uzumTezkor, secretKey: e.target.value }
                        })}
                        className="w-full bg-[#111317] border border-gray-800 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:border-[#7000FF] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold text-xs mb-1.5 flex items-center justify-between">
                        <span>Outlet / Filial ID</span>
                        <span className="text-[10px] text-gray-500">Bir nechta filiallar uchun</span>
                      </label>
                      <input
                        type="text"
                        placeholder="filial-1"
                        value={settings.uzumTezkor.outletId || ""}
                        onChange={(e) => setSettings({
                          ...settings,
                          uzumTezkor: { ...settings.uzumTezkor, outletId: e.target.value }
                        })}
                        className="w-full bg-[#111317] border border-gray-800 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:border-[#7000FF] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold text-xs mb-1.5">Komissiya stavkasi (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={settings.uzumTezkor.commissionPercent}
                        onChange={(e) => setSettings({
                          ...settings,
                          uzumTezkor: { ...settings.uzumTezkor, commissionPercent: Number(e.target.value) }
                        })}
                        className="w-full bg-[#111317] border border-gray-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-[#7000FF] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Webhook URL copy section */}
                  <div className="bg-[#111317] p-3.5 rounded-2xl border border-gray-800 space-y-1.5">
                    <label className="block text-gray-300 font-bold text-xs">
                      Uzum Tezkor Webhook URL (Ushbu havolani Uzum Tezkor shaxsiy kabinetiga qo'ying):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`https://${window.location.host}/api/delivery/orders?source=uzum&cafeId=${selectedCafeId}`}
                        className="w-full bg-[#181B22] border border-gray-700 rounded-xl px-3 py-2 text-xs font-mono text-[#A855F7] select-all"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`https://${window.location.host}/api/delivery/orders?source=uzum&cafeId=${selectedCafeId}`, "uzum_wh")}
                        className="px-4 py-2 bg-[#7000FF]/10 hover:bg-[#7000FF]/20 text-[#A855F7] rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 border border-[#7000FF]/30 transition-all"
                      >
                        {copiedKey === "uzum_wh" ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        Nusxa
                      </button>
                    </div>
                  </div>

                  {/* Test Connection Button */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={testingProvider === "uzum"}
                      onClick={() => handleTestConnection("uzum")}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-gray-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {testingProvider === "uzum" ? (
                        <RefreshCw size={14} className="animate-spin text-[#A855F7]" />
                      ) : (
                        <Radio size={14} className="text-[#A855F7]" />
                      )}
                      {testingProvider === "uzum" ? "Tekshirilmoqda..." : "🔌 Uzum Tezkor API Aloqasini Tekshirish"}
                    </button>
                  </div>

                  {/* Test result output */}
                  {testResult && testResult.provider === "uzum" && (
                    <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      testResult.success 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}>
                      {testResult.success ? <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />}
                      <div>
                        <div className="font-bold">{testResult.message}</div>
                        {testResult.latency && <div className="text-[10px] text-gray-400 mt-0.5">Javob vaqti (Ping): {testResult.latency} ms</div>}
                      </div>
                    </div>
                  )}

                  {/* Accordion Guide */}
                  <div className="border border-gray-800 rounded-2xl overflow-hidden bg-[#111317]">
                    <button
                      type="button"
                      onClick={() => setShowUzumGuide(!showUzumGuide)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-[#A855F7]">
                        <HelpCircle size={15} />
                        Uzum Tezkor API kalitlarini qanday olish kerak? (Qo'llanma)
                      </span>
                      {showUzumGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {showUzumGuide && (
                      <div className="px-4 pb-4 text-xs text-gray-300 space-y-2.5 border-t border-gray-800/80 pt-3">
                        <p className="font-bold text-white">Uzum Tezkor Merchant Portaliga ulanish tartibi:</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-gray-400 leading-relaxed">
                          <li><strong className="text-white">Uzum Merchant portaliga kiring:</strong> <code className="text-[#A855F7] font-mono bg-black/40 px-1 py-0.5 rounded">https://merchant.uzumtezkor.uz</code></li>
                          <li><strong className="text-white">Sozlamalar bo'limi:</strong> "Sozlamalar" &rarr; "POS va API Integratsiyasi" sahifasiga kiring.</li>
                          <li><strong className="text-white">Merchant ID va Token:</strong> Berilgan Merchant ID va API maxfiy kalitini nusxalab bu yerga joylashtiring.</li>
                          <li><strong className="text-white">Webhook URL:</strong> Yuqoridagi Uzum Tezkor Webhook URL manzilini Uzum portaliga kiritib "Saqlash"ni bosing.</li>
                          <li><strong className="text-white">Tekshiruv:</strong> "Uzum Tezkor API Aloqasini Tekshirish" tugmasi orqali integratsiyani tasdiqlang.</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: TELEGRAM BOT */}
              {activeTab === "telegram" && (
                <div className="space-y-4">
                  {/* Status & Toggle banner */}
                  <div className="p-4 rounded-2xl bg-[#111317] border border-[#2AABEE]/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#2AABEE] text-white flex items-center justify-center font-black text-base shadow-lg shadow-[#2AABEE]/20">
                        <Send size={18} className="-rotate-12" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-white text-sm">Telegram Bot Integratsiyasi</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            settings.telegramBot.status === "connected"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}>
                            {settings.telegramBot.status === "connected" ? "🟢 Faol" : "🔴 O'chiq"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Mijozlaringiz Telegram orqali taomlarni ko'rib, to'g'ridan-to'g'ri buyurtma bera oladi
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-200">
                      <input
                        type="checkbox"
                        checked={settings.telegramBot.enabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          telegramBot: { ...settings.telegramBot, enabled: e.target.checked }
                        })}
                        className="w-4 h-4 rounded text-[#2AABEE]"
                      />
                      Botni yoqish
                    </label>
                  </div>

                  {/* Form inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 font-bold text-xs mb-1.5 flex items-center justify-between">
                        <span>Bot Username *</span>
                        <span className="text-[10px] text-gray-500">Masalan: @MeningKafemBot</span>
                      </label>
                      <input
                        type="text"
                        placeholder="@InposDeliveryBot"
                        value={settings.telegramBot.botUsername}
                        onChange={(e) => setSettings({
                          ...settings,
                          telegramBot: { ...settings.telegramBot, botUsername: e.target.value }
                        })}
                        className="w-full bg-[#111317] border border-gray-800 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:border-[#2AABEE] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold text-xs mb-1.5 flex items-center justify-between">
                        <span>Bot Token (BotFather dan) *</span>
                        <span className="text-[10px] text-gray-500">123456789:ABCdef...</span>
                      </label>
                      <input
                        type="password"
                        placeholder="7492819201:AAH8k2j1m92kz91ls0289192kssla"
                        value={settings.telegramBot.botToken}
                        onChange={(e) => setSettings({
                          ...settings,
                          telegramBot: { ...settings.telegramBot, botToken: e.target.value }
                        })}
                        className="w-full bg-[#111317] border border-gray-800 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:border-[#2AABEE] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold text-xs mb-1.5 flex items-center justify-between">
                        <span>Admin / Filial Chat ID</span>
                        <span className="text-[10px] text-gray-500">Buyurtma xabari tushadigan guruh/kanal</span>
                      </label>
                      <input
                        type="text"
                        placeholder="-100192849102"
                        value={settings.telegramBot.adminChatId || ""}
                        onChange={(e) => setSettings({
                          ...settings,
                          telegramBot: { ...settings.telegramBot, adminChatId: e.target.value }
                        })}
                        className="w-full bg-[#111317] border border-gray-800 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:border-[#2AABEE] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold text-xs mb-1.5">Xush kelibsiz xabari</label>
                      <input
                        type="text"
                        value={settings.telegramBot.welcomeMessage || ""}
                        onChange={(e) => setSettings({
                          ...settings,
                          telegramBot: { ...settings.telegramBot, welcomeMessage: e.target.value }
                        })}
                        className="w-full bg-[#111317] border border-gray-800 rounded-xl px-3 py-2.5 text-white text-xs focus:border-[#2AABEE] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Webhook URL copy section */}
                  <div className="bg-[#111317] p-3.5 rounded-2xl border border-gray-800 space-y-1.5">
                    <label className="block text-gray-300 font-bold text-xs">
                      Telegram Webhook URL:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`https://${window.location.host}/api/telegram/webhook?cafeId=${selectedCafeId}`}
                        className="w-full bg-[#181B22] border border-gray-700 rounded-xl px-3 py-2 text-xs font-mono text-[#54C5FF] select-all"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`https://${window.location.host}/api/telegram/webhook?cafeId=${selectedCafeId}`, "tg_wh")}
                        className="px-4 py-2 bg-[#2AABEE]/10 hover:bg-[#2AABEE]/20 text-[#54C5FF] rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 border border-[#2AABEE]/30 transition-all"
                      >
                        {copiedKey === "tg_wh" ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        Nusxa
                      </button>
                    </div>
                  </div>

                  {/* Test Telegram Bot and Auto Set Webhook Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={testingProvider === "telegram"}
                      onClick={() => handleTestConnection("telegram")}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-gray-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {testingProvider === "telegram" ? (
                        <RefreshCw size={14} className="animate-spin text-[#54C5FF]" />
                      ) : (
                        <Radio size={14} className="text-[#54C5FF]" />
                      )}
                      {testingProvider === "telegram" ? "Tekshirilmoqda..." : "🔌 Telegram Botni Tekshirish (getMe)"}
                    </button>

                    <button
                      type="button"
                      disabled={isSettingWebhook}
                      onClick={handleAutoSetTelegramWebhook}
                      className="px-4 py-2 bg-[#2AABEE]/20 hover:bg-[#2AABEE]/30 text-[#54C5FF] rounded-xl text-xs font-bold flex items-center gap-2 border border-[#2AABEE]/40 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSettingWebhook ? (
                        <RefreshCw size={14} className="animate-spin text-[#54C5FF]" />
                      ) : (
                        <ExternalLink size={14} />
                      )}
                      {isSettingWebhook ? "Webhook ulanmoqda..." : "⚡ 1-Tugma: Webhookni Telegramga Bog'lash"}
                    </button>
                  </div>

                  {/* Webhook Set result message */}
                  {webhookSetResult && (
                    <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      webhookSetResult.success 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}>
                      {webhookSetResult.success ? <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />}
                      <div>
                        <div className="font-bold">{webhookSetResult.message}</div>
                        {webhookSetResult.success && (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Endi mijozlar Telegram botingizga <code>/start</code> yoki <code>/menu</code> yozsa, POS dagi barcha taomlar va narxlar avtomatik yuboriladi!
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Test result output */}
                  {testResult && testResult.provider === "telegram" && (
                    <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      testResult.success 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}>
                      {testResult.success ? <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 text-red-400 mt-0.5" />}
                      <div>
                        <div className="font-bold">{testResult.message}</div>
                        {testResult.latency && <div className="text-[10px] text-gray-400 mt-0.5">Javob tezligi: {testResult.latency} ms</div>}
                      </div>
                    </div>
                  )}

                  {/* Accordion Guide */}
                  <div className="border border-gray-800 rounded-2xl overflow-hidden bg-[#111317]">
                    <button
                      type="button"
                      onClick={() => setShowTelegramGuide(!showTelegramGuide)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-[#54C5FF]">
                        <HelpCircle size={15} />
                        Telegram Bot qanday ochiladi va ulanadi? (Yo'riqnoma)
                      </span>
                      {showTelegramGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {showTelegramGuide && (
                      <div className="px-4 pb-4 text-xs text-gray-300 space-y-2.5 border-t border-gray-800/80 pt-3">
                        <p className="font-bold text-white">Telegram Bot yaratish:</p>
                        <ol className="list-decimal list-inside space-y-1.5 text-gray-400 leading-relaxed">
                          <li>Telegram ilovasida <code className="text-[#54C5FF] font-mono bg-black/40 px-1 py-0.5 rounded">@BotFather</code> ga kiring va <strong className="text-white">/newbot</strong> buyrug'ini yuboring.</li>
                          <li>Botga nom (masalan: <em>"Lazzat Kafe Buyurtma Boti"</em>) va username (masalan: <em>@lazzat_kafe_bot</em>) bering.</li>
                          <li>@BotFather sizga bergan <strong className="text-white">HTTP API Token</strong> ni nusxalab yuqoridagi <strong className="text-white">Bot Token</strong> maydoniga qo'ying.</li>
                          <li>"Telegram Botni Tekshirish" tugmasini bosing va sozlamalarni saqlang!</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: GENERAL / NOTIFICATIONS */}
              {activeTab === "general" && (
                <div className="space-y-4">
                  <div className="bg-[#111317] p-4 rounded-2xl border border-gray-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-2">
                        <Volume2 size={16} className="text-amber-400" />
                        Yangi buyurtmalar ovozli signali
                      </div>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        Yandex, Uzum va Telegram dan buyurtma kelganda qo'ng'iroq chalinadi
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.soundNotification}
                      onChange={(e) => setSettings({
                        ...settings,
                        soundNotification: e.target.checked
                      })}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                  </div>

                  <div className="bg-[#111317] p-4 rounded-2xl border border-gray-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-2">
                        <Printer size={16} className="text-emerald-400" />
                        Kuryer chekini avtomatik chiqarish
                      </div>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        Buyurtma qabul qilinganda kuryer uchun manzil va taomlar chekini darhol chop etish
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoPrintReceipt}
                      onChange={(e) => setSettings({
                        ...settings,
                        autoPrintReceipt: e.target.checked
                      })}
                      className="w-4 h-4 rounded text-emerald-500"
                    />
                  </div>

                  <div className="bg-[#111317] p-4 rounded-2xl border border-gray-800 space-y-3">
                    <h4 className="font-bold text-white text-xs">To'g'ridan-to'g'ri yetkazib berish (Telefon orqali)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-gray-400 font-bold mb-1">Minimal buyurtma</label>
                        <input
                          type="number"
                          value={settings.directDelivery.minOrderAmount}
                          onChange={(e) => setSettings({
                            ...settings,
                            directDelivery: { ...settings.directDelivery, minOrderAmount: Number(e.target.value) }
                          })}
                          className="w-full bg-[#181B22] border border-gray-800 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 font-bold mb-1">Yetkazib berish narxi</label>
                        <input
                          type="number"
                          value={settings.directDelivery.defaultDeliveryFee}
                          onChange={(e) => setSettings({
                            ...settings,
                            directDelivery: { ...settings.directDelivery, defaultDeliveryFee: Number(e.target.value) }
                          })}
                          className="w-full bg-[#181B22] border border-gray-800 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 font-bold mb-1">Aloqa telefoni</label>
                        <input
                          type="text"
                          value={settings.directDelivery.phone}
                          onChange={(e) => setSettings({
                            ...settings,
                            directDelivery: { ...settings.directDelivery, phone: e.target.value }
                          })}
                          className="w-full bg-[#181B22] border border-gray-800 rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-800">
            {saveSuccessMessage ? (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 size={16} />
                {saveSuccessMessage}
              </span>
            ) : (
              <span className="text-[11px] text-gray-500">
                O'zgarishlar faqat <strong>{settings.cafeName || selectedCafeId}</strong> filialiga saqlanadi
              </span>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
              >
                Yopish
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                {isSaving ? "Saqlanmoqda..." : "Sozlamalarni Saqlash"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
