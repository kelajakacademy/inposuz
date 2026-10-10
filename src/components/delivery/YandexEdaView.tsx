import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Flame, 
  Star, 
  Send, 
  ShieldCheck, 
  Key, 
  ExternalLink, 
  Check, 
  Ban, 
  Utensils, 
  Truck, 
  Phone, 
  MessageSquare, 
  Zap,
  Search,
  ChevronRight
} from "lucide-react";
import { formatCurrency } from "../../lib/utils";

interface YandexEdaOrder {
  id: string;
  eatsId: string;
  platform: "YE" | "DC";
  discriminator: "yandex" | "marketplace" | "pickup";
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  courierName?: string;
  courierPhone?: string;
  courierType?: string;
  status: "NEW" | "ACCEPTED_BY_RESTAURANT" | "COOKING" | "READY" | "TAKEN_BY_COURIER" | "DELIVERED" | "CANCELLED";
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    modifications?: Array<{ id: string; name: string; quantity: number; price: number }>;
  }>;
  totalAmount: number;
  comment?: string;
  createdAt: string;
  courierArrivementDate?: string;
  pickupCodeValidation?: { isValid: boolean; attemptsLeft: number };
}

interface YandexFeedback {
  id: string;
  eatsId: string;
  rating: number;
  comment: string;
  predefinedComment?: string;
  createdAt: string;
  answer?: string;
}

interface YandexEdaViewProps {
  activeCafeId?: string;
  onBack?: () => void;
}

export const YandexEdaView: React.FC<YandexEdaViewProps> = ({ activeCafeId = "default", onBack }) => {
  const [activeTab, setActiveTab] = useState<"orders" | "stoplist" | "busymode" | "feedback" | "settings">("orders");

  // API credentials config state
  const [config, setConfig] = useState({
    enabled: true,
    clientId: "yandex_eda_client_34857715",
    clientSecret: "ye_secret_key_2026_x89a",
    restaurantId: "rest-34857715",
    partnerName: "iNPOS Partner",
    isTestMode: true,
    webhookUrl: `${window.location.origin}/api/yandex-eda/webhook`
  });

  const [orders, setOrders] = useState<YandexEdaOrder[]>([]);
  const [stopList, setStopList] = useState<Array<{ id: string; name: string; category: string; price: number; inStopList: boolean }>>([]);
  const [feedbacks, setFeedbacks] = useState<YandexFeedback[]>([]);
  
  // Busy mode state
  const [busyModeActive, setBusyModeActive] = useState(false);
  const [extraMinutes, setExtraMinutes] = useState(15);

  // Courier code verification
  const [verifyOrderId, setVerifyOrderId] = useState<string | null>(null);
  const [courierCodeInput, setCourierCodeInput] = useState("");
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null);

  // Reply feedback form state
  const [replyFeedbackId, setReplyFeedbackId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyPromo, setReplyPromo] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Fetch Yandex Eda data
  const fetchYandexData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/yandex-eda/data", {
        headers: { "x-cafe-id": activeCafeId }
      });
      const data = await res.json();
      if (data.success) {
        if (data.config) setConfig(data.config);
        if (Array.isArray(data.orders)) setOrders(data.orders);
        if (Array.isArray(data.stopList)) setStopList(data.stopList);
        if (Array.isArray(data.feedbacks)) setFeedbacks(data.feedbacks);
        if (typeof data.busyModeActive === "boolean") setBusyModeActive(data.busyModeActive);
      }
    } catch (e) {
      console.warn("Error loading Yandex Eda data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchYandexData();
    const interval = setInterval(fetchYandexData, 12000);
    return () => clearInterval(interval);
  }, [activeCafeId]);

  // Handle Order status update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: YandexEdaOrder["status"]) => {
    try {
      const res = await fetch(`/api/yandex-eda/orders/${orderId}/status`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId 
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        showToast(`Статус заказа изменен на ${newStatus}`);
      }
    } catch (e) {
      showToast("Ошибка обновления статуса!");
    }
  };

  // Validate Courier Code
  const handleValidateCourierCode = async (orderId: string) => {
    if (!courierCodeInput.trim()) return;
    try {
      const res = await fetch(`/api/yandex-eda/orders/${orderId}/validate-code`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId 
        },
        body: JSON.stringify({ code: courierCodeInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setVerificationResult({
          success: data.isValid,
          message: data.isValid 
            ? "✅ Код курьера верный! Заказ можно передавать курьеру." 
            : `❌ Неверный код! Осталось попыток: ${data.attemptsLeft || 0}`
        });
      }
    } catch (e) {
      setVerificationResult({ success: false, message: "Ошибка связи с сервером" });
    }
  };

  // Toggle item in Stop-List
  const handleToggleStopList = async (itemId: string) => {
    try {
      const res = await fetch("/api/yandex-eda/stop-list/toggle", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId 
        },
        body: JSON.stringify({ itemId })
      });
      const data = await res.json();
      if (data.success) {
        setStopList(prev => prev.map(item => item.id === itemId ? { ...item, inStopList: !item.inStopList } : item));
        showToast("Стоп-лист обновлен!");
      }
    } catch (e) {
      showToast("Ошибка обновления стоп-листа");
    }
  };

  // Toggle Busy Mode
  const handleToggleBusyMode = async () => {
    const nextState = !busyModeActive;
    try {
      const res = await fetch("/api/yandex-eda/busy-mode", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId 
        },
        body: JSON.stringify({ active: nextState, extraMinutes })
      });
      const data = await res.json();
      if (data.success) {
        setBusyModeActive(nextState);
        showToast(nextState ? `Режим «Высокий спрос» включен (+${extraMinutes} мин)` : "Режим «Высокий спрос» отключен");
      }
    } catch (e) {
      showToast("Ошибка переключения режима");
    }
  };

  // Reply to Customer Feedback
  const handleSendFeedbackReply = async (feedbackId: string) => {
    if (!replyText.trim()) return;
    try {
      const res = await fetch("/api/yandex-eda/feedback/reply", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId 
        },
        body: JSON.stringify({ feedbackId, text: replyText, promoPercent: replyPromo })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, answer: replyText } : f));
        setReplyFeedbackId(null);
        setReplyText("");
        setReplyPromo(0);
        showToast("Ответ на отзыв отправлен клиенту!");
      }
    } catch (e) {
      showToast("Ошибка отправки ответа");
    }
  };

  // Save Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/yandex-eda/config", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId 
        },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        showToast("Настройки Яндекс Еда API успешно сохранены!");
      }
    } catch (e) {
      showToast("Ошибка сохранения настроек");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#14181f] text-white font-sans overflow-hidden select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#ffcc00] text-black px-5 py-2.5 rounded-xl font-bold text-xs shadow-2xl border border-amber-400 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* BRANDED YANDEX EDA TOP HEADER */}
      <div className="h-14 px-5 bg-gradient-to-r from-[#1c222e] via-[#242c3b] to-[#1c222e] border-b border-amber-500/30 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#ffcc00] text-black font-black text-sm flex items-center justify-center shadow-[0_0_15px_rgba(255,204,0,0.4)]">
            Еда
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wide text-white">
                Яндекс Еда API Интеграция
              </h1>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-mono font-bold">
                OpenAPI 3.0 v1.0
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Yandex & Marketplace Integration Hub
            </p>
          </div>
        </div>

        {/* TOP STATUS BADGES */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
            busyModeActive 
              ? "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse" 
              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
          }`}>
            <Flame size={14} className={busyModeActive ? "text-red-400" : "text-emerald-400"} />
            <span>{busyModeActive ? `Высокий спрос (+${extraMinutes}мин)` : "Обычный спрос"}</span>
          </div>

          <button
            onClick={fetchYandexData}
            disabled={isLoading}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-all cursor-pointer"
            title="Обновить данные"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin text-amber-400" : ""} />
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs rounded-lg transition-all"
            >
              Назад
            </button>
          )}
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="px-5 bg-[#1a202c] border-b border-gray-800 flex items-center gap-1 shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "orders"
              ? "border-[#ffcc00] text-[#ffcc00] bg-amber-400/10"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <ShoppingBag size={15} />
          <span>Заказы ({orders.filter(o => o.status !== "DELIVERED" && o.status !== "CANCELLED").length})</span>
        </button>

        <button
          onClick={() => setActiveTab("stoplist")}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "stoplist"
              ? "border-[#ffcc00] text-[#ffcc00] bg-amber-400/10"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Ban size={15} />
          <span>Стоп-лист ({stopList.filter(s => s.inStopList).length})</span>
        </button>

        <button
          onClick={() => setActiveTab("busymode")}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "busymode"
              ? "border-[#ffcc00] text-[#ffcc00] bg-amber-400/10"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Flame size={15} />
          <span>Высокий спрос</span>
        </button>

        <button
          onClick={() => setActiveTab("feedback")}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "feedback"
              ? "border-[#ffcc00] text-[#ffcc00] bg-amber-400/10"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Star size={15} />
          <span>Отзывы ({feedbacks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "settings"
              ? "border-[#ffcc00] text-[#ffcc00] bg-amber-400/10"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <ShieldCheck size={15} />
          <span>API & OAuth</span>
        </button>
      </div>

      {/* MAIN CONTENT CANVAS */}
      <div className="flex-1 p-5 overflow-y-auto">
        {/* TAB 1: ACTIVE ORDERS MONITOR */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {orders.map((order) => {
                const isCompleted = order.status === "DELIVERED";
                const isCancelled = order.status === "CANCELLED";

                return (
                  <div 
                    key={order.id}
                    className={`rounded-2xl border bg-[#1c2330] p-4 flex flex-col justify-between space-y-3 transition-all ${
                      order.status === "NEW"
                        ? "border-[#ffcc00] shadow-[0_0_20px_rgba(255,204,0,0.2)] animate-pulse"
                        : isCancelled
                        ? "border-red-500/40 opacity-60"
                        : isCompleted
                        ? "border-emerald-500/40"
                        : "border-blue-500/40"
                    }`}
                  >
                    {/* ORDER CARD HEADER */}
                    <div className="flex items-center justify-between border-b border-gray-700/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase bg-[#ffcc00] text-black">
                            {order.platform || "YE"}
                          </span>
                          <span className="font-mono font-black text-sm text-white">
                            {order.eatsId}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {order.createdAt}
                        </p>
                      </div>

                      {/* STATUS BADGE */}
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        order.status === "NEW"
                          ? "bg-amber-400 text-black"
                          : order.status === "COOKING"
                          ? "bg-blue-500 text-white"
                          : order.status === "READY"
                          ? "bg-purple-500 text-white"
                          : order.status === "TAKEN_BY_COURIER"
                          ? "bg-teal-500 text-white"
                          : isCompleted
                          ? "bg-emerald-600 text-white"
                          : "bg-red-600 text-white"
                      }`}>
                        {order.status === "NEW"
                          ? "Новый"
                          : order.status === "ACCEPTED_BY_RESTAURANT"
                          ? "Принят"
                          : order.status === "COOKING"
                          ? "Готовится"
                          : order.status === "READY"
                          ? "Готов"
                          : order.status === "TAKEN_BY_COURIER"
                          ? "У курьера"
                          : isCompleted
                          ? "Доставлен"
                          : "Отменен"}
                      </span>
                    </div>

                    {/* CUSTOMER & COURIER DETAILS */}
                    <div className="space-y-1.5 text-xs text-gray-300 bg-gray-900/50 p-2.5 rounded-xl border border-gray-800">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Клиент: {order.customerName}</span>
                        <span className="font-mono text-gray-400">{order.customerPhone}</span>
                      </div>

                      {order.deliveryAddress && (
                        <p className="text-[11px] text-gray-400 truncate">
                          📍 {order.deliveryAddress}
                        </p>
                      )}

                      {order.courierName && (
                        <div className="pt-1.5 border-t border-gray-800 flex items-center justify-between text-[11px] text-amber-300">
                          <span className="flex items-center gap-1 font-bold">
                            <Truck size={13} />
                            <span>Курьер: {order.courierName} ({order.courierType || "пешеход"})</span>
                          </span>
                          <span className="font-mono">{order.courierPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* DISHES ITEMS LIST */}
                    <div className="space-y-1 my-1 flex-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-xs flex items-center justify-between text-gray-200">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-mono text-gray-400">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {order.comment && (
                        <p className="text-[11px] text-amber-300 italic pt-1 border-t border-gray-800">
                          💬 "{order.comment}"
                        </p>
                      )}
                    </div>

                    {/* TOTAL AMOUNT & COURIER CODE VALIDATION */}
                    <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400">Сумма заказа:</span>
                      <span className="text-sm font-mono font-black text-[#ffcc00]">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>

                    {/* ACTION PIPELINE BUTTONS */}
                    {!isCompleted && !isCancelled && (
                      <div className="pt-2 space-y-2">
                        <div className="grid grid-cols-2 gap-1.5">
                          {order.status === "NEW" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "ACCEPTED_BY_RESTAURANT")}
                              className="py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-lg transition-all cursor-pointer col-span-2"
                            >
                              Принять заказ
                            </button>
                          )}

                          {order.status === "ACCEPTED_BY_RESTAURANT" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "COOKING")}
                              className="py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer col-span-2"
                            >
                              Начать готовку
                            </button>
                          )}

                          {order.status === "COOKING" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "READY")}
                              className="py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer col-span-2"
                            >
                              Заказ готов
                            </button>
                          )}

                          {order.status === "READY" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "TAKEN_BY_COURIER")}
                              className="py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer col-span-2"
                            >
                              Передан курьеру
                            </button>
                          )}

                          {order.status === "TAKEN_BY_COURIER" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "DELIVERED")}
                              className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer col-span-2"
                            >
                              Завершить (Доставлен)
                            </button>
                          )}
                        </div>

                        {/* COURIER CODE VERIFIER TOGGLE */}
                        <button
                          onClick={() => {
                            setVerifyOrderId(order.id);
                            setCourierCodeInput("");
                            setVerificationResult(null);
                          }}
                          className="w-full py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-[11px] rounded-lg border border-gray-700 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ShieldCheck size={13} className="text-amber-400" />
                          <span>Проверить код курьера</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {orders.length === 0 && (
                <div className="col-span-full p-12 text-center bg-[#1c2330] rounded-2xl border border-gray-800 space-y-3">
                  <ShoppingBag size={40} className="mx-auto text-amber-400/50" />
                  <p className="text-sm font-bold text-gray-300">
                    Активных заказов из Яндекс Еда пока нет.
                  </p>
                  <p className="text-xs text-gray-500">
                    Новые заказы автоматически появятся здесь при поступлении от сервиса Яндекс Еда.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: STOP-LIST MANAGEMENT */}
        {activeTab === "stoplist" && (
          <div className="space-y-4">
            <div className="bg-[#1c2330] p-4 rounded-2xl border border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Ban className="text-red-400" size={18} />
                  <span>Управление Стоп-листом Яндекс Еда</span>
                </h2>
                <p className="text-xs text-gray-400">
                  Позиции из стоп-листа немедленно скрываются в приложении Яндекс Еда.
                </p>
              </div>

              <button
                onClick={fetchYandexData}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition-all cursor-pointer"
              >
                Принудительный запуск обновления меню
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {stopList.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    item.inStopList
                      ? "bg-red-500/10 border-red-500/40 text-red-200"
                      : "bg-[#1c2330] border-gray-800 text-white"
                  }`}
                >
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">{item.category}</span>
                    <span className="text-xs font-bold block">{item.name}</span>
                    <span className="text-xs font-mono font-bold text-amber-400">{formatCurrency(item.price)}</span>
                  </div>

                  <button
                    onClick={() => handleToggleStopList(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      item.inStopList
                        ? "bg-red-600 hover:bg-red-500 text-white shadow-lg"
                        : "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
                    }`}
                  >
                    {item.inStopList ? "В стоп-листе" : "Доступно"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BUSY MODE (ВЫСОКИЙ СПРОС) */}
        {activeTab === "busymode" && (
          <div className="max-w-xl mx-auto bg-[#1c2330] p-6 rounded-2xl border border-amber-500/30 space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg border border-amber-500/30">
              <Flame size={32} />
            </div>

            <div>
              <h2 className="text-lg font-black text-white">
                Режим Высокого Спроса (Busy Mode)
              </h2>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Установите этот режим, если кухня нагружена. Время приготовления заказов в приложении Яндекс Еда будет временно увеличено на выбранное число минут.
              </p>
            </div>

            <div className="space-y-3 bg-gray-900/60 p-4 rounded-xl border border-gray-800">
              <label className="text-xs font-bold text-gray-300 block">
                Добавочное время к готовке:
              </label>
              <div className="flex items-center justify-center gap-3">
                {[10, 15, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setExtraMinutes(mins)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      extraMinutes === mins
                        ? "bg-[#ffcc00] text-black shadow-lg"
                        : "bg-gray-800 text-gray-300 border border-gray-700"
                    }`}
                  >
                    +{mins} мин
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleToggleBusyMode}
              className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-xl cursor-pointer ${
                busyModeActive
                  ? "bg-red-600 hover:bg-red-500 text-white"
                  : "bg-amber-400 hover:bg-amber-300 text-black"
              }`}
            >
              {busyModeActive ? "Отключить высокий спрос" : `Включить высокий спрос (+${extraMinutes} мин)`}
            </button>
          </div>
        )}

        {/* TAB 4: REVIEWS & FEEDBACK */}
        {activeTab === "feedback" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="bg-[#1c2330] p-4 rounded-2xl border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <div className="flex items-center gap-1.5 text-amber-400 font-black text-sm">
                      <Star size={16} className="fill-amber-400" />
                      <span>{fb.rating} / 5</span>
                    </div>
                    <span className="text-[11px] font-mono text-gray-400">{fb.eatsId} ({fb.createdAt})</span>
                  </div>

                  <p className="text-xs text-gray-200 leading-relaxed font-medium">
                    "{fb.comment}"
                  </p>

                  {fb.answer ? (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-xs text-amber-200">
                      <span className="font-bold block text-[10px] text-amber-400 uppercase">Ваш ответ клиенту:</span>
                      {fb.answer}
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyFeedbackId(fb.id)}
                      className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare size={14} className="text-amber-400" />
                      <span>Ответить клиенту</span>
                    </button>
                  )}
                </div>
              ))}

              {feedbacks.length === 0 && (
                <div className="col-span-full p-12 text-center bg-[#1c2330] rounded-2xl border border-gray-800 space-y-2">
                  <Star size={36} className="mx-auto text-amber-400/50" />
                  <p className="text-xs text-gray-400">Отзывов пока нет.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SETTINGS & OAUTH API */}
        {activeTab === "settings" && (
          <form onSubmit={handleSaveConfig} className="max-w-2xl mx-auto bg-[#1c2330] p-6 rounded-2xl border border-gray-800 space-y-5">
            <h2 className="text-sm font-black text-white border-b border-gray-800 pb-3 flex items-center gap-2">
              <ShieldCheck className="text-[#ffcc00]" size={18} />
              <span>Параметры интеграции Яндекс Еда Vendor Management API</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-gray-400 font-bold block mb-1">OAuth Client ID</label>
                <input
                  type="text"
                  value={config.clientId}
                  onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-gray-400 font-bold block mb-1">OAuth Client Secret</label>
                <input
                  type="password"
                  value={config.clientSecret}
                  onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-gray-400 font-bold block mb-1">ID Ресторана (restaurantId / origin_id)</label>
                <input
                  type="text"
                  value={config.restaurantId}
                  onChange={(e) => setConfig({ ...config, restaurantId: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-gray-400 font-bold block mb-1">Webhook Handler URL</label>
                <input
                  type="text"
                  readOnly
                  value={config.webhookUrl}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-amber-300 font-mono text-[11px]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#ffcc00] hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Сохранить параметры API
            </button>
          </form>
        )}
      </div>

      {/* COURIER CODE VERIFICATION MODAL */}
      {verifyOrderId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c2330] border border-amber-500/40 p-6 rounded-2xl max-w-sm w-full space-y-4 text-center">
            <h3 className="text-sm font-black text-white flex items-center justify-center gap-2">
              <ShieldCheck className="text-amber-400" size={18} />
              <span>Проверка кода курьера</span>
            </h3>

            <p className="text-xs text-gray-400 leading-relaxed">
              Введите 4-значный код, который курьер назвал перед получением заказа.
            </p>

            <input
              type="text"
              placeholder="Код курьера (например 1234)"
              value={courierCodeInput}
              onChange={(e) => setCourierCodeInput(e.target.value)}
              className="w-full text-center bg-gray-900 border border-gray-700 rounded-xl py-3 text-lg font-mono font-bold text-amber-400 outline-none focus:border-amber-400"
            />

            {verificationResult && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                verificationResult.success 
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" 
                  : "bg-red-500/20 text-red-300 border border-red-500/40"
              }`}>
                {verificationResult.message}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVerifyOrderId(null)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl"
              >
                Закрыть
              </button>

              <button
                type="button"
                onClick={() => handleValidateCourierCode(verifyOrderId)}
                className="flex-1 py-2.5 bg-[#ffcc00] hover:bg-amber-400 text-black font-black text-xs rounded-xl"
              >
                Проверить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPLY FEEDBACK MODAL */}
      {replyFeedbackId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c2330] border border-amber-500/40 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <MessageSquare className="text-amber-400" size={18} />
              <span>Ответ на отзыв клиента</span>
            </h3>

            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Напишите ответ клиенту..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400 resize-none"
            />

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1">Выдать промокод на скидку:</label>
              <div className="flex gap-2">
                {[0, 10, 15, 20].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setReplyPromo(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      replyPromo === p 
                        ? "bg-amber-400 text-black border-amber-500 font-black" 
                        : "bg-gray-800 text-gray-300 border-gray-700"
                    }`}
                  >
                    {p === 0 ? "Без промокода" : `${p}% скидка`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReplyFeedbackId(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-xl"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={() => handleSendFeedbackReply(replyFeedbackId)}
                className="px-4 py-2 bg-[#ffcc00] hover:bg-amber-400 text-black font-black text-xs rounded-xl"
              >
                Отправить ответ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
