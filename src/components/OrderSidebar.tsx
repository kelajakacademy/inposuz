import React, { useState, useEffect } from "react";
import { useOrder } from "../context/OrderContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trash2, 
  ShoppingBag, 
  CreditCard, 
  Banknote, 
  Landmark, 
  User, 
  UserCheck, 
  X, 
  Search, 
  Plus, 
  Award, 
  Gift, 
  Sparkles, 
  Percent, 
  Wallet, 
  FileText, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { formatCurrency, cn } from "../lib/utils";
import { Client } from "../types";

export const OrderSidebar = () => {
  const { 
    cart, 
    subtotal, 
    tax, 
    total, 
    discountPercent,
    discountAmount,
    payableTotal,
    attachedClient,
    setAttachedClient,
    bonusToSpend,
    setBonusToSpend,
    depositToSpend,
    setDepositToSpend,
    customDiscountPercent,
    setCustomDiscountPercent,
    removeFromCart,
    updateQuantity,
    sendToKitchen,
    finalizeOrder,
    activeOrder,
    currentTable,
    clearCart,
    waiter
  } = useOrder();

  const [showPaymentSelection, setShowPaymentSelection] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [isQuickRegister, setIsQuickRegister] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("+998 ");
  const [selectedPaymentTab, setSelectedPaymentTab] = useState<'methods' | 'bonus' | 'deposit'>('methods');
  const [inputBonusAmount, setInputBonusAmount] = useState<string>("");
  const [inputDepositAmount, setInputDepositAmount] = useState<string>("");

  const hasNewItems = cart.some(item => !item.isSentToKitchen);

  // Fetch clients for POS lookup
  const searchClients = async (query = "") => {
    try {
      const activeCafeId = waiter?.cafeId || "default";
      const res = await fetch(`/api/clients?search=${encodeURIComponent(query)}`, {
        headers: { "x-cafe-id": activeCafeId }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setAvailableClients(data);
      }
    } catch (e) {
      console.error("Error searching clients", e);
    }
  };

  useEffect(() => {
    if (showClientModal) {
      searchClients(clientSearchQuery);
    }
  }, [showClientModal, clientSearchQuery]);

  const handleQuickRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || !quickPhone.trim()) return;

    try {
      const activeCafeId = waiter?.cafeId || "default";
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cafe-id": activeCafeId },
        body: JSON.stringify({
          name: quickName.trim(),
          phone: quickPhone.trim(),
          groupId: "grp-regular",
          groupName: "Doimiy mijozlar",
          discountPercent: 0,
          cashbackPercent: 3
        })
      });
      const data = await res.json();
      if (res.ok && data.client) {
        setAttachedClient(data.client);
        setShowClientModal(false);
        setIsQuickRegister(false);
        setQuickName("");
        setQuickPhone("+998 ");
      } else {
        alert(data.error || "Mijozni saqlab bo'lmadi");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyBonus = () => {
    const num = Math.min(Number(inputBonusAmount) || 0, attachedClient?.bonusBalance || 0, total);
    setBonusToSpend(num);
    setSelectedPaymentTab('methods');
  };

  const handleApplyDeposit = () => {
    const num = Math.min(Number(inputDepositAmount) || 0, attachedClient?.depositBalance || 0, total);
    setDepositToSpend(num);
    setSelectedPaymentTab('methods');
  };

  const handleFinalizeWithMethod = (method: 'cash' | 'card' | 'mixed' | 'deposit' | 'debt' | 'bonus') => {
    let usedBonus = bonusToSpend;
    let usedDeposit = depositToSpend;
    let isDebt = false;
    let debtAmount = 0;

    if (method === 'bonus') {
      usedBonus = Math.min(total, attachedClient?.bonusBalance || 0);
    } else if (method === 'deposit') {
      usedDeposit = Math.min(total, attachedClient?.depositBalance || 0);
    } else if (method === 'debt') {
      isDebt = true;
      debtAmount = total;
    }

    finalizeOrder({
      paymentMethod: method,
      usedBonus,
      usedDeposit,
      isDebt,
      debtAmount,
      discountPercent,
      discountAmount,
      client: attachedClient
    });

    setShowPaymentSelection(false);
  };

  // Estimated Cashback Calculation
  const cashbackPercent = attachedClient?.cashbackPercent || 3;
  const netPaidCashOrCard = Math.max(0, total - bonusToSpend);
  const estimatedCashback = Math.round((netPaidCashOrCard * cashbackPercent) / 100);

  return (
    <div className="w-[340px] bg-[#25292E] flex flex-col border-l border-gray-800 shadow-2xl relative">
      <div className="p-4 border-b border-gray-700 bg-[#1F2327]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">Order Detail</h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Table #{currentTable?.number || "-"}</p>
          </div>
          {!activeOrder && (
            <button 
              onClick={clearCart}
              className="text-gray-500 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* CRM GUEST ATTACHMENT CARD */}
        <div className="mt-2.5 pt-2.5 border-t border-gray-700/60">
          {attachedClient ? (
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                  <UserCheck size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-300 truncate">{attachedClient.name}</span>
                    {attachedClient.groupName && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold">
                        {attachedClient.groupName}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-2 font-mono mt-0.5">
                    <span>{attachedClient.phone}</span>
                    <span className="text-amber-400 font-bold">💎 {formatCurrency(attachedClient.bonusBalance || 0)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setAttachedClient(null);
                  setBonusToSpend(0);
                  setDepositToSpend(0);
                }}
                className="text-gray-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                title="Mijozni ajratish"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClientModal(true)}
              className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-dashed border-gray-600 hover:border-emerald-500/50 rounded-xl text-xs text-gray-300 hover:text-emerald-300 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <User size={14} className="text-emerald-400" />
              <span className="font-semibold">Прикрепить гостя (CRM / Бонусы)</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 custom-scrollbar">
        <AnimatePresence initial={false}>
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 my-auto">
              <ShoppingBag size={44} strokeWidth={1} className="mb-3" />
              <p className="text-xs font-medium">Buyurtma hali bo‘sh</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {cart.map((item) => (
                <motion.div
                  key={item.cartId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex gap-2.5 p-2 bg-white/5 rounded-xl border border-gray-700/50 group"
                >
                  <div className="w-11 h-11 bg-gray-700 rounded-lg shrink-0 overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col min-w-0 pr-1">
                        <p className="font-medium text-xs truncate text-gray-100">{item.name}</p>
                        {item.isSentToKitchen && (
                          <span className="text-[9px] text-[#2ECC71] font-bold flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC71]" />
                            OSHXONAGA YUBORILDI
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-gray-100 shrink-0 font-mono">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-700/40">
                      <div className="flex items-center gap-1.5 bg-[#1A1D21] p-0.5 rounded-lg border border-gray-700">
                        <button 
                          onClick={() => updateQuantity(item.cartId, -1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-200 rounded font-bold transition-all cursor-pointer text-xs active:scale-95"
                          title="Sonini kamaytirish (-)"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-white font-mono px-1.5 min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.cartId, 1)}
                          className="w-6 h-6 flex items-center justify-center bg-[#E74C3C] hover:bg-[#c0392b] text-white rounded font-bold transition-all cursor-pointer text-xs active:scale-95 shadow-sm"
                          title="Sonini ko'paytirish (+)"
                        >
                          +
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => removeFromCart(item.cartId)}
                        className="flex items-center gap-1 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 px-2 py-1 rounded-lg transition-all cursor-pointer text-xs font-semibold shadow-xs"
                        title="Kerak emas bo'lsa o'chirish"
                      >
                        <Trash2 size={13} />
                        <span className="text-[10px]">O'chirish</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER & TOTALS */}
      <div className="p-4 bg-[#1A1D21] border-t border-gray-700 space-y-3">
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Oraliq hisob (Subtotal)</span>
            <span className="text-gray-200 font-mono">{formatCurrency(subtotal)}</span>
          </div>

          {/* CRM Discount */}
          {discountPercent > 0 && (
            <div className="flex justify-between text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
              <span className="flex items-center gap-1">
                <Percent size={12} />
                Chegirma ({discountPercent}%):
              </span>
              <span className="font-mono">-{formatCurrency(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-gray-400">
            <span>Xizmat haqi (10%)</span>
            <span className="text-gray-200 font-mono">{formatCurrency(tax)}</span>
          </div>

          {/* Bonus Cashback Estimate */}
          {attachedClient && (
            <div className="flex justify-between text-emerald-400 font-semibold bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-500/20 text-[11px]">
              <span className="flex items-center gap-1">
                <Sparkles size={12} />
                Keshbek ({cashbackPercent}%):
              </span>
              <span className="font-mono font-bold">+{formatCurrency(estimatedCashback)}</span>
            </div>
          )}

          {bonusToSpend > 0 && (
            <div className="flex justify-between text-purple-400 font-bold">
              <span>Sarflanadigan bonus:</span>
              <span className="font-mono">-{formatCurrency(bonusToSpend)}</span>
            </div>
          )}

          {depositToSpend > 0 && (
            <div className="flex justify-between text-blue-400 font-bold">
              <span>Depozitdan:</span>
              <span className="font-mono">-{formatCurrency(depositToSpend)}</span>
            </div>
          )}

          <div className="flex justify-between font-black text-base pt-2 border-t border-gray-800 text-white">
            <span>Jami to‘lov</span>
            <span className="text-[#E74C3C] font-mono">{formatCurrency(payableTotal)}</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          {(hasNewItems || !activeOrder) ? (
            <button 
              onClick={sendToKitchen}
              disabled={cart.length === 0}
              className={cn(
                "w-full py-3 rounded-xl font-bold transition-all shadow-lg text-xs tracking-wider uppercase cursor-pointer",
                cart.length > 0 
                  ? "bg-[#E74C3C] text-white shadow-[#E74C3C]/20 hover:opacity-90 active:scale-[0.98]" 
                  : "bg-gray-700/50 text-gray-600 cursor-not-allowed"
              )}
            >
              Oshxonaga yuborish (KOT)
            </button>
          ) : null}

          {activeOrder && (
            <button 
              onClick={() => {
                setSelectedPaymentTab('methods');
                setShowPaymentSelection(true);
              }}
              className="w-full bg-white text-black py-3 rounded-xl font-bold shadow-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
            >
              <CreditCard size={15} />
              To‘lov va Hisob-kitob (Kassa)
            </button>
          )}
        </div>
      </div>

      {/* POS CLIENT SELECTION MODAL */}
      <AnimatePresence>
        {showClientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#25292E] text-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="px-5 py-4 bg-[#1F2327] border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#00A3E0]/20 text-[#00A3E0] flex items-center justify-center">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Прикрепить гостя (CRM)</h3>
                    <p className="text-[10px] text-gray-400">Bonus, chegirma va depozit hisob-kitobi</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowClientModal(false);
                    setIsQuickRegister(false);
                  }}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {!isQuickRegister ? (
                <div className="p-4 flex flex-col gap-3 overflow-hidden flex-1">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                        placeholder="Qidiruv (Ism, telefon, karta)..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#1A1D21] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#00A3E0]"
                      />
                    </div>
                    <button
                      onClick={() => setIsQuickRegister(true)}
                      className="px-3 py-2 bg-[#00A3E0] hover:bg-[#008BBF] text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      <Plus size={14} />
                      <span>Yangi mehmon</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-[350px]">
                    {availableClients.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 text-xs">
                        Mijoz topilmadi. «Yangi mehmon» tugmasi orqali tezkor qo‘shing.
                      </div>
                    ) : (
                      availableClients.map((cli) => (
                        <div
                          key={cli.id}
                          onClick={() => {
                            setAttachedClient(cli);
                            setShowClientModal(false);
                          }}
                          className="p-3 bg-white/5 hover:bg-white/10 border border-gray-700/60 hover:border-emerald-500/50 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-xs text-white flex items-center gap-1.5">
                              <span>{cli.name}</span>
                              {cli.discountPercent > 0 && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                                  -{cli.discountPercent}%
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono mt-0.5">{cli.phone}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-amber-400 font-mono">
                              💎 {formatCurrency(cli.bonusBalance || 0)}
                            </div>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-bold inline-block mt-0.5">
                              {cli.groupName || "Doimiy"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleQuickRegisterClient} className="p-5 space-y-4">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Tezkor yangi mehmon ro‘yxatga olish:
                  </h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">F.I.SH / Ismi:</label>
                    <input
                      type="text"
                      required
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      placeholder="Masalan: Sardor Aliyev"
                      className="w-full px-3 py-2.5 text-xs bg-[#1A1D21] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#00A3E0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Telefon raqami:</label>
                    <input
                      type="text"
                      required
                      value={quickPhone}
                      onChange={(e) => setQuickPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full px-3 py-2.5 text-xs bg-[#1A1D21] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#00A3E0]"
                    />
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-center gap-2.5">
                    <Sparkles size={16} className="shrink-0 text-amber-400" />
                    <span>Yangi mehmonga avtomatik 15 000 UZS xush kelibsiz bonusi taqdim etiladi!</span>
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsQuickRegister(false)}
                      className="px-3.5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Ortga
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-[#4CAF50] hover:bg-[#43A047] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer uppercase tracking-wider"
                    >
                      Ro‘yxatdan o‘tkazish
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Selection Overlay */}
      <AnimatePresence>
        {showPaymentSelection && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute inset-0 z-20 bg-[#25292E] flex flex-col p-5 overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
              <div>
                <h3 className="text-base font-bold text-white">To‘lovni qabul qilish</h3>
                <p className="text-[10px] text-gray-400">Stol #{currentTable?.number} | Chek yopish</p>
              </div>
              <button 
                onClick={() => setShowPaymentSelection(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Attached Guest Info Banner */}
            {attachedClient ? (
              <div className="mb-4 p-3 bg-gradient-to-r from-emerald-950/60 to-blue-950/60 border border-emerald-500/30 rounded-xl text-xs space-y-1.5 shadow-md">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-300">{attachedClient.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    +{cashbackPercent}% Keshbek
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] pt-1 border-t border-white/5">
                  <div>
                    <span className="text-gray-400 block">Bonus:</span>
                    <span className="font-bold text-amber-400 font-mono">{formatCurrency(attachedClient.bonusBalance || 0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Depozit:</span>
                    <span className="font-bold text-blue-400 font-mono">{formatCurrency(attachedClient.depositBalance || 0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Qarz:</span>
                    <span className="font-bold text-rose-400 font-mono">{formatCurrency(attachedClient.debtBalance || 0)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-3">
                <button
                  onClick={() => setShowClientModal(true)}
                  className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-dashed border-gray-600 rounded-xl text-[11px] text-gray-300 hover:text-emerald-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <User size={13} className="text-emerald-400" />
                  <span>CRM Mehmon biriktirish (Keshbek & Bonus)</span>
                </button>
              </div>
            )}

            {/* Payment Mode Selection */}
            <div className="flex-1 flex flex-col gap-2.5">
              <button 
                onClick={() => handleFinalizeWithMethod('cash')}
                className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/5 border border-gray-700/60 hover:border-[#2ECC71] hover:bg-emerald-500/10 transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-[#2ECC71]/15 flex items-center justify-center text-[#2ECC71] shrink-0">
                  <Banknote size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-xs text-white">Naqd pul (Cash)</p>
                  <p className="text-[10px] text-gray-400">To‘liq naqd shaklda qabul qilish</p>
                </div>
              </button>

              <button 
                onClick={() => handleFinalizeWithMethod('card')}
                className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/5 border border-gray-700/60 hover:border-[#3498DB] hover:bg-blue-500/10 transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-[#3498DB]/15 flex items-center justify-center text-[#3498DB] shrink-0">
                  <CreditCard size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-xs text-white">Plastik karta (Terminal)</p>
                  <p className="text-[10px] text-gray-400">Humo / Uzcard / Visa / Mastercard</p>
                </div>
              </button>

              {/* Bonus Payment Option */}
              {attachedClient && (attachedClient.bonusBalance || 0) > 0 && (
                <button 
                  onClick={() => handleFinalizeWithMethod('bonus')}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/20 transition-all group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Gift size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xs text-amber-300">Bonusdan to‘lash</p>
                    <p className="text-[10px] text-gray-400">Mavjud: {formatCurrency(attachedClient.bonusBalance || 0)}</p>
                  </div>
                </button>
              )}

              {/* Deposit Payment Option */}
              {attachedClient && (attachedClient.depositBalance || 0) > 0 && (
                <button 
                  onClick={() => handleFinalizeWithMethod('deposit')}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-400 hover:bg-blue-500/20 transition-all group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Wallet size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xs text-blue-300">Depozitdan to‘lash</p>
                    <p className="text-[10px] text-gray-400">Mavjud: {formatCurrency(attachedClient.depositBalance || 0)}</p>
                  </div>
                </button>
              )}

              {/* Debt Payment Option */}
              {attachedClient && (
                <button 
                  onClick={() => handleFinalizeWithMethod('debt')}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:border-rose-400 hover:bg-rose-500/20 transition-all group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xs text-rose-300">Nasiya / Qarzga yozish</p>
                    <p className="text-[10px] text-gray-400">Mehmon hisobiga qarz yoziladi</p>
                  </div>
                </button>
              )}

              <button 
                onClick={() => handleFinalizeWithMethod('mixed')}
                className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/5 border border-gray-700/60 hover:border-[#9B59B6] hover:bg-purple-500/10 transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-[#9B59B6]/15 flex items-center justify-center text-[#9B59B6] shrink-0">
                  <Landmark size={20} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-xs text-white">Aralash to‘lov (Mixed)</p>
                  <p className="text-[10px] text-gray-400">Naqd + Karta birgalikda</p>
                </div>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Jami to‘lanadigan summa:</span>
                <span className="text-lg font-black text-[#E74C3C] font-mono">{formatCurrency(payableTotal)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
