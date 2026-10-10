import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  X, 
  ShoppingBag, 
  Plus, 
  Minus, 
  MapPin, 
  Phone, 
  User, 
  Check, 
  CreditCard, 
  Banknote, 
  Sparkles, 
  QrCode, 
  Copy, 
  ExternalLink,
  MessageSquare,
  Bot,
  Layers,
  ArrowRight,
  ShieldCheck,
  Clock
} from "lucide-react";
import { useOrder } from "../../context/OrderContext";
import { formatCurrency } from "../../lib/utils";
import { playDeliveryOrderChime } from "../../services/deliverySound";

interface TelegramBotCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: () => void;
}

export const TelegramBotCustomerModal: React.FC<TelegramBotCustomerModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated
}) => {
  const { products, categories } = useOrder();
  const [activeTab, setActiveTab] = useState<"menu" | "guide">("menu");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  
  // Customer details
  const [customerName, setCustomerName] = useState("Jasur Rustamov");
  const [customerPhone, setCustomerPhone] = useState("+998 90 345 67 89");
  const [telegramUsername, setTelegramUsername] = useState("jasur_dev");
  const [deliveryAddress, setDeliveryAddress] = useState("Yunusobod tumani, 12-mavze, 18-uy");
  const [deliveryLocation, setDeliveryLocation] = useState("2-podezd, 4-etaj, 14-xonadon");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash">("online");
  const [paymentProvider, setPaymentProvider] = useState<"payme" | "click" | "cash">("payme");
  const [comment, setComment] = useState("Iltimos, taomlar issiq yetkazilsin");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate cart items & totals
  const cartItems = Object.entries(cart)
    .filter(([_, qty]) => Number(qty) > 0)
    .map(([productId, qty]) => {
      const product = products.find(p => p.id === productId);
      const count = Number(qty) || 0;
      return {
        id: productId,
        name: product?.name || "Taom",
        price: Number(product?.price) || 0,
        quantity: count
      };
    });

  const subtotal = cartItems.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);
  const deliveryFee = 1.50; // $1.50 or standard TG delivery
  const totalAmount = subtotal > 0 ? subtotal + deliveryFee : 0;

  const handleAddToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: current - 1 };
    });
  };

  const handleSubmitTelegramOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert("Iltimos, avval menyudan taom tanlang!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/telegram/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          telegramUsername: telegramUsername.replace("@", ""),
          deliveryAddress,
          deliveryLocation,
          items: cartItems,
          subtotal,
          deliveryFee,
          paymentMethod: paymentProvider,
          comment: comment ? `[To'lov: ${paymentProvider.toUpperCase()}] ${comment}` : `[To'lov: ${paymentProvider.toUpperCase()}]`
        })
      });

      const data = await res.json();
      if (data.success && data.order) {
        setSubmittedOrder(data.order);
        playDeliveryOrderChime("telegram");
        if (onOrderCreated) onOrderCreated();
      } else {
        alert(data.message || "Xatolik yuz berdi");
      }
    } catch (e) {
      console.error("Error submitting telegram order:", e);
      alert("Server bilan bog'lanishda xatolik");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filteredProducts = products.filter(p => {
    if (selectedCategory === "all") return true;
    return p.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="bg-[#17212B] border border-[#242F3D] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#E4ECF2]"
      >
        {/* Telegram Header */}
        <div className="bg-[#242F3D] px-6 py-4 flex items-center justify-between border-b border-[#0E1621] shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#2AABEE] text-white flex items-center justify-center shadow-lg shadow-[#2AABEE]/30">
              <Send size={24} className="-rotate-12 translate-x-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white flex items-center gap-1.5">
                  Telegram Bot Buyurtma Berish
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h2>
                <a
                  href="https://t.me/buyurtmachi_inpos_bot"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#2AABEE]/20 text-[#54C5FF] border border-[#2AABEE]/30 font-mono hover:bg-[#2AABEE]/30 transition-colors flex items-center gap-1"
                >
                  @buyurtmachi_inpos_bot
                  <ExternalLink size={10} />
                </a>
              </div>
              <p className="text-xs text-[#8292A1]">Mijozlar uchun Telegram bot va WebApp menyusi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="p-1 bg-[#17212B] rounded-xl flex items-center border border-[#0E1621]">
              <button
                onClick={() => { setActiveTab("menu"); setSubmittedOrder(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "menu" ? "bg-[#2AABEE] text-white" : "text-[#8292A1] hover:text-white"
                }`}
              >
                Menyu & Buyurtma
              </button>
              <button
                onClick={() => setActiveTab("guide")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  activeTab === "guide" ? "bg-[#2AABEE] text-white" : "text-[#8292A1] hover:text-white"
                }`}
              >
                <Bot size={13} />
                Botni Ulash
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "guide" ? (
            /* Telegram Bot Connection & BotFather Guide */
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#2AABEE]/15 rounded-3xl flex items-center justify-center mx-auto text-[#2AABEE] mb-3">
                  <Bot size={36} />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Telegram Bot orqali Restoran Menyusini ishga tushirish</h3>
                <p className="text-xs text-[#8292A1]">
                  Mijozlaringiz Telegram orqali taomlarni ko'rib, yetkazib berishga to'g'ridan-to'g'ri buyurtma bera oladilar.
                </p>
              </div>

              {/* Steps Card */}
              <div className="bg-[#242F3D] rounded-2xl p-5 border border-[#0E1621] space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#2AABEE] text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                  <div className="text-xs">
                    <p className="font-bold text-white mb-1">BotFather orqali yangi bot yarating:</p>
                    <p className="text-[#8292A1] mb-2">Telegram da <code className="text-[#54C5FF] bg-black/30 px-1 py-0.5 rounded">@BotFather</code> ga kiring va <code className="text-[#54C5FF] bg-black/30 px-1 py-0.5 rounded">/newbot</code> buyrug'ini yuboring.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#2AABEE] text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                  <div className="text-xs flex-1">
                    <p className="font-bold text-white mb-1">Menyu tugmasini sozlang (Telegram WebApp):</p>
                    <p className="text-[#8292A1] mb-2">BotFather da <code className="text-[#54C5FF] bg-black/30 px-1 py-0.5 rounded">/setmenubutton</code> buyrug'ini tanlang va do'kon URL manzilini kiriting.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#2AABEE] text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                  <div className="text-xs flex-1">
                    <p className="font-bold text-white mb-1">Webhook URL manzili:</p>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={`https://${window.location.host}/api/telegram/webhook`}
                        className="w-full bg-[#17212B] border border-[#0E1621] rounded-xl px-3 py-2 text-xs font-mono text-[#54C5FF] select-all"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`https://${window.location.host}/api/telegram/webhook`, "tgwebhook")}
                        className="px-3 py-2 bg-[#2AABEE] hover:bg-[#229ED9] rounded-xl text-xs font-bold text-white shrink-0 flex items-center gap-1"
                      >
                        {copiedCode === "tgwebhook" ? <Check size={14} /> : <Copy size={14} />}
                        Nusxa
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bot QR & Direct link preview */}
              <div className="bg-[#242F3D] rounded-2xl p-5 border border-[#0E1621] flex flex-col sm:flex-row items-center gap-6 justify-between">
                <div className="text-center sm:text-left">
                  <span className="text-[11px] font-bold text-[#54C5FF] uppercase tracking-wider">Mijozlar uchun havola</span>
                  <a
                    href="https://t.me/buyurtmachi_inpos_bot"
                    target="_blank"
                    rel="noreferrer"
                    className="text-base font-black text-[#54C5FF] hover:underline flex items-center gap-1.5 mt-0.5"
                  >
                    t.me/buyurtmachi_inpos_bot
                    <ExternalLink size={14} />
                  </a>
                  <p className="text-xs text-[#8292A1] mt-1">Stol ustiga yoki bannerlarga QR-kod joylashtiring</p>
                </div>
                <div className="w-24 h-24 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
                  <QrCode size={76} className="text-black" />
                </div>
              </div>
            </div>
          ) : submittedOrder ? (
            /* Order success state */
            <div className="max-w-md mx-auto text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto animate-bounce">
                <Check size={36} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Buyurtma qabul qilindi!</h3>
                <p className="text-sm font-mono font-bold text-[#54C5FF] mt-1">
                  Raqam: #{submittedOrder.orderNumber}
                </p>
                <p className="text-xs text-[#8292A1] mt-2">
                  Buyurtma POS va Oshxona (KDS) monitoriga darhol yuborildi. Top bildirishnoma orqali ko'rishingiz mumkin.
                </p>
              </div>

              <div className="bg-[#242F3D] p-4 rounded-2xl border border-[#0E1621] text-left text-xs space-y-2">
                <div className="flex justify-between text-[#8292A1]">
                  <span>Mijoz:</span>
                  <span className="text-white font-bold">{submittedOrder.customerName}</span>
                </div>
                <div className="flex justify-between text-[#8292A1]">
                  <span>Manzil:</span>
                  <span className="text-white font-bold">{submittedOrder.deliveryAddress}</span>
                </div>
                <div className="flex justify-between text-[#8292A1]">
                  <span>To'lov usuli:</span>
                  <span className="text-emerald-400 font-bold">{submittedOrder.paymentMethod === 'online' ? 'Onlayn (Payme/Click)' : 'Naqd'}</span>
                </div>
                <div className="flex justify-between text-[#8292A1] pt-2 border-t border-[#0E1621]">
                  <span className="font-bold">Jami:</span>
                  <span className="text-emerald-400 font-black text-sm">{formatCurrency(submittedOrder.totalAmount)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSubmittedOrder(null);
                    setCart({});
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                >
                  Yana buyurtma berish
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold text-xs"
                >
                  Dostavka paneliga o'tish
                </button>
              </div>
            </div>
          ) : (
            /* Interactive Ordering Menu & Cart form */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Menu Items */}
              <div className="lg:col-span-7 flex flex-col space-y-4">
                {/* Category filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === "all"
                        ? "bg-[#2AABEE] text-white"
                        : "bg-[#242F3D] text-[#8292A1] hover:text-white"
                    }`}
                  >
                    Barchasi ({products.length})
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        selectedCategory === cat.id
                          ? "bg-[#2AABEE] text-white"
                          : "bg-[#242F3D] text-[#8292A1] hover:text-white"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Product list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {filteredProducts.map(product => {
                    const qty = cart[product.id] || 0;
                    return (
                      <div
                        key={product.id}
                        className={`p-3 rounded-2xl bg-[#242F3D] border transition-all flex flex-col justify-between ${
                          qty > 0 ? "border-[#2AABEE] shadow-[0_0_15px_rgba(42,171,238,0.15)]" : "border-[#0E1621] hover:border-[#384656]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-bold text-white text-xs leading-tight">{product.name}</h4>
                            <p className="text-[10px] text-[#8292A1] mt-0.5 line-clamp-1">{product.category}</p>
                          </div>
                          <span className="font-black text-emerald-400 text-xs shrink-0 font-mono">
                            {formatCurrency(Number(product.price))}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#17212B]">
                          <span className="text-[10px] text-[#8292A1]">Miqdor:</span>
                          {qty > 0 ? (
                            <div className="flex items-center gap-2 bg-[#17212B] rounded-xl px-2 py-1 border border-[#0E1621]">
                              <button
                                onClick={() => handleRemoveFromCart(product.id)}
                                className="w-5 h-5 rounded-lg bg-white/10 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="font-bold text-white text-xs font-mono w-4 text-center">{qty}</span>
                              <button
                                onClick={() => handleAddToCart(product.id)}
                                className="w-5 h-5 rounded-lg bg-[#2AABEE] hover:bg-[#229ED9] text-white flex items-center justify-center transition-colors"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(product.id)}
                              className="px-3 py-1 rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                            >
                              <Plus size={13} />
                              Qo'shish
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Customer Details & Order Submit */}
              <div className="lg:col-span-5 bg-[#242F3D] rounded-3xl p-4 border border-[#0E1621] flex flex-col justify-between">
                <form onSubmit={handleSubmitTelegramOrder} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#17212B] pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                      <ShoppingBag size={14} className="text-[#2AABEE]" />
                      Buyurtma Ma'lumotlari
                    </h3>
                    <span className="text-xs font-bold text-[#54C5FF]">
                      {cartItems.length} xil taom
                    </span>
                  </div>

                  {/* Customer name & username */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-[#8292A1] mb-1">Mijoz ismi</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-[#17212B] border border-[#0E1621] rounded-xl px-2.5 py-1.5 text-white placeholder-[#8292A1] focus:outline-none focus:border-[#2AABEE]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#8292A1] mb-1">Telegram @username</label>
                      <input
                        type="text"
                        value={telegramUsername}
                        onChange={(e) => setTelegramUsername(e.target.value)}
                        className="w-full bg-[#17212B] border border-[#0E1621] rounded-xl px-2.5 py-1.5 text-white font-mono placeholder-[#8292A1] focus:outline-none focus:border-[#2AABEE]"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="text-xs">
                    <label className="block text-[11px] font-bold text-[#8292A1] mb-1">Telefon raqam</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#17212B] border border-[#0E1621] rounded-xl px-2.5 py-1.5 text-white font-mono placeholder-[#8292A1] focus:outline-none focus:border-[#2AABEE]"
                    />
                  </div>

                  {/* Address */}
                  <div className="text-xs">
                    <label className="block text-[11px] font-bold text-[#8292A1] mb-1">Yetkazish manzili</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full bg-[#17212B] border border-[#0E1621] rounded-xl px-2.5 py-1.5 text-white placeholder-[#8292A1] focus:outline-none focus:border-[#2AABEE]"
                    />
                  </div>

                  {/* Location detail */}
                  <div className="text-xs">
                    <label className="block text-[11px] font-bold text-[#8292A1] mb-1">Mo'ljal / Kvartira / Qavat</label>
                    <input
                      type="text"
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value)}
                      className="w-full bg-[#17212B] border border-[#0E1621] rounded-xl px-2.5 py-1.5 text-white placeholder-[#8292A1] focus:outline-none focus:border-[#2AABEE]"
                    />
                  </div>

                  {/* Payment provider selector */}
                  <div className="text-xs">
                    <label className="block text-[11px] font-bold text-[#8292A1] mb-1">To'lov usuli</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setPaymentProvider("payme"); setPaymentMethod("online"); }}
                        className={`py-1.5 px-1 rounded-xl text-center text-[11px] font-bold transition-all flex flex-col items-center ${
                          paymentProvider === "payme"
                            ? "bg-[#00CCCC] text-black shadow-md font-black"
                            : "bg-[#17212B] text-gray-300 hover:text-white border border-[#0E1621]"
                        }`}
                      >
                        Payme
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPaymentProvider("click"); setPaymentMethod("online"); }}
                        className={`py-1.5 px-1 rounded-xl text-center text-[11px] font-bold transition-all flex flex-col items-center ${
                          paymentProvider === "click"
                            ? "bg-[#0080FF] text-white shadow-md font-black"
                            : "bg-[#17212B] text-gray-300 hover:text-white border border-[#0E1621]"
                        }`}
                      >
                        Click
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPaymentProvider("cash"); setPaymentMethod("cash"); }}
                        className={`py-1.5 px-1 rounded-xl text-center text-[11px] font-bold transition-all flex flex-col items-center ${
                          paymentProvider === "cash"
                            ? "bg-emerald-500 text-white shadow-md font-black"
                            : "bg-[#17212B] text-gray-300 hover:text-white border border-[#0E1621]"
                        }`}
                      >
                        Naqd
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPaymentProvider("card_on_delivery"); setPaymentMethod("card_on_delivery"); }}
                        className={`py-1.5 px-1 rounded-xl text-center text-[11px] font-bold transition-all flex flex-col items-center ${
                          paymentProvider === "card_on_delivery"
                            ? "bg-purple-500 text-white shadow-md font-black"
                            : "bg-[#17212B] text-gray-300 hover:text-white border border-[#0E1621]"
                        }`}
                      >
                        Terminal
                      </button>
                    </div>
                  </div>

                  {/* Total calculation */}
                  <div className="bg-[#17212B] p-2.5 rounded-xl border border-[#0E1621] text-xs space-y-1 mt-2">
                    <div className="flex justify-between text-[#8292A1]">
                      <span>Taomlar:</span>
                      <span className="font-mono text-white">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[#8292A1]">
                      <span>Dostavka xizmati:</span>
                      <span className="font-mono text-white">{formatCurrency(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold pt-1 border-t border-[#0E1621] text-sm">
                      <span>Jami to'lov:</span>
                      <span className="font-mono text-emerald-400 font-black">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>

                  {/* Order Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || cartItems.length === 0}
                    className="w-full py-3 rounded-2xl bg-[#2AABEE] hover:bg-[#229ED9] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#2AABEE]/30 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Send size={15} className="-rotate-12" />
                    {isSubmitting ? "Yuborilmoqda..." : "Telegram orqali buyurtma berish"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
