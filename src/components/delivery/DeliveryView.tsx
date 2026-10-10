import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBag, 
  Bike, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  UtensilsCrossed, 
  Package, 
  Send, 
  Printer, 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  ChevronRight, 
  X, 
  ExternalLink, 
  Check, 
  Copy, 
  Eye, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  SlidersHorizontal,
  Bot,
  QrCode
} from "lucide-react";
import { DeliveryOrder, DeliveryAggregator, DeliveryStatus, DeliverySettings } from "../../types";
import { formatCurrency, cn } from "../../lib/utils";
import { useOrder } from "../../context/OrderContext";
import { playDeliveryOrderChime, playOrderAcceptedSound } from "../../services/deliverySound";
import { TelegramBotCustomerModal } from "./TelegramBotCustomerModal";
import { AggregatorSettingsModal } from "./AggregatorSettingsModal";

export const DeliveryView: React.FC = () => {
  const { waiter, receiptConfig, linkedCafe } = useOrder();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("all");
  const [activeAggregatorFilter, setActiveAggregatorFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  
  // Selected order for detailed modal
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  
  // Telegram Bot Customer & Setup modal
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState("");
  
  // Stats
  const [stats, setStats] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);

  // Fetch orders
  const fetchDeliveryOrders = async () => {
    try {
      const res = await fetch("/api/delivery/orders");
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error("Error fetching delivery orders:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/delivery/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (e) {}
  };

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/delivery/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setDeliverySettings(data.settings);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchDeliveryOrders();
    fetchStats();
    fetchSettings();

    const interval = setInterval(() => {
      fetchDeliveryOrders();
      fetchStats();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Handle status update
  const handleUpdateStatus = async (orderId: string, newStatus: DeliveryStatus) => {
    try {
      const res = await fetch(`/api/delivery/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        if (newStatus === "accepted") {
          playOrderAcceptedSound();
        }
        setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
        fetchStats();
      }
    } catch (e) {
      console.error("Error updating order status:", e);
    }
  };

  // Simulate new incoming order from Yandex Eats or Uzum Tezkor
  const handleSimulateOrder = async (aggregator: DeliveryAggregator) => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/delivery/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aggregator })
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrders(prev => [data.order, ...prev]);
        fetchStats();
        playDeliveryOrderChime(aggregator);
      }
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Save settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverySettings) return;
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/delivery/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deliverySettings)
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSavedMessage("Sozlamalar saqlandi!");
        setTimeout(() => setSettingsSavedMessage(""), 3000);
      }
    } catch (e) {
      console.error("Error saving settings:", e);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(id);
    setTimeout(() => setCopiedWebhook(null), 2500);
  };

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    if (activeStatusFilter !== "all" && order.status !== activeStatusFilter) {
      return false;
    }
    if (activeAggregatorFilter !== "all" && order.aggregator !== activeAggregatorFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchNumber = order.orderNumber.toLowerCase().includes(query);
      const matchCustomer = order.customerName.toLowerCase().includes(query);
      const matchPhone = order.customerPhone.toLowerCase().includes(query);
      const matchAddress = order.deliveryAddress.toLowerCase().includes(query);
      const matchItem = order.items.some(i => i.name.toLowerCase().includes(query));
      return matchNumber || matchCustomer || matchPhone || matchAddress || matchItem;
    }
    return true;
  });

  const getAggregatorBadge = (aggregator: DeliveryAggregator) => {
    switch (aggregator) {
      case "yandex_eats":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-[#FCE000] text-black shadow-sm">
            <span className="w-2 h-2 rounded-full bg-black" />
            Yandex Eats
          </span>
        );
      case "uzum_tezkor":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-[#7000FF] text-[#FCE000] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#FCE000]" />
            Uzum Tezkor
          </span>
        );
      case "telegram":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-[#2AABEE] text-white shadow-sm">
            <Send size={12} className="-rotate-12" />
            Telegram Bot
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500 text-white shadow-sm">
            <Bike size={12} />
            To'g'ridan-to'g'ri
          </span>
        );
    }
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case "new":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">Yangi</span>;
      case "accepted":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Qabul qilindi</span>;
      case "preparing":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Oshxonada</span>;
      case "ready":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">Kuryer kutilmoqda</span>;
      case "out_for_delivery":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Yo'lda (Kuryerda)</span>;
      case "delivered":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Yetkazildi</span>;
      case "cancelled":
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30">Bekor qilingan</span>;
    }
  };

  // Print Courier Receipt
  const handlePrintCourierReceipt = (order: DeliveryOrder) => {
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) {
      alert("Iltimos brauzerda pop-uplarga ruxsat bering");
      return;
    }

    const itemsHtml = order.items.map(i => `
      <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px;">
        <div><b>${i.quantity}x</b> ${i.name} ${i.comment ? `<br><small style="color:#666;">(${i.comment})</small>` : ''}</div>
        <div><b>${formatCurrency(i.price * i.quantity)}</b></div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dostavka Cheki #${order.orderNumber}</title>
        <style>
          body { font-family: monospace; padding: 10px; width: 280px; margin: 0 auto; color: black; }
          .header { text-align: center; border-bottom: 2px dashed black; padding-bottom: 8px; margin-bottom: 8px; }
          .badge { display: inline-block; padding: 2px 6px; font-weight: bold; border: 1px solid black; margin-bottom: 4px; }
          .section { border-bottom: 1px dashed black; padding: 6px 0; margin-bottom: 6px; font-size: 11px; }
          .total { font-size: 14px; font-weight: bold; display: flex; justify-content: space-between; border-top: 2px solid black; padding-top: 6px; margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${receiptConfig.restaurantName}</h2>
          <div class="badge">${order.aggregator.toUpperCase().replace('_', ' ')}</div>
          <div style="font-size: 16px; font-weight: 900;">BUYURTMA: #${order.orderNumber}</div>
          <div style="font-size: 10px;">${new Date(order.createdAt).toLocaleString('uz-UZ')}</div>
        </div>

        <div class="section">
          <div><b>MIJOZ:</b> ${order.customerName}</div>
          <div><b>TEL:</b> ${order.customerPhone}</div>
          <div><b>MANZIL:</b> ${order.deliveryAddress}</div>
          ${order.deliveryLocation ? `<div><b>MO'LJAL:</b> ${order.deliveryLocation}</div>` : ''}
          ${order.comment ? `<div style="background:#eee; padding:3px; margin-top:3px;"><b>IZOH:</b> ${order.comment}</div>` : ''}
        </div>

        <div class="section">
          <div><b>KURYER:</b> ${order.courierName || 'Kuryer biriktirilmoqda'}</div>
          <div><b>TEL:</b> ${order.courierPhone || '-'}</div>
          <div><b>KUTILAYOTGAN VAQT:</b> ${order.estimatedDeliveryTime || '25 min'}</div>
        </div>

        <div class="section">
          <div style="font-weight:bold; margin-bottom:4px; text-decoration:underline;">BUYURTMA TARKIBI:</div>
          ${itemsHtml}
        </div>

        <div class="total">
          <span>JAMI SUMMA:</span>
          <span>${formatCurrency(order.totalAmount)}</span>
        </div>

        <div style="text-align:center; font-size:10px; margin-top:10px;">
          <div>To'lov holati: <b>${order.paymentStatus === 'paid' ? 'ONLAYN TO\'LANGAN' : 'NAQD / KURYERGA'}</b></div>
          <br>
          <div>*** OSHXONA VA KURYER UCHUN NUSXA ***</div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0E1013] text-gray-200 overflow-hidden">
      {/* Top Delivery Header */}
      <div className="bg-[#14171C] border-b border-gray-800 px-6 py-4 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center font-black shadow-lg">
              <Bike size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">Dostavka & Agregatorlar</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-gray-400">Yandex Eats va Uzum Tezkor buyurtmalarini boshqarish</p>
            </div>
          </div>
        </div>

        {/* Aggregator Statuses & Simulation Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Yandex Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1C1F26] border border-gray-800 rounded-xl text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FCE000] shadow-[0_0_8px_#FCE000]" />
            <span className="font-black text-[#FCE000]">Yandex Eats</span>
          </div>

          {/* Uzum Tezkor Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1C1F26] border border-gray-800 rounded-xl text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7000FF] shadow-[0_0_8px_#7000FF]" />
            <span className="font-black text-[#A855F7]">Uzum Tezkor</span>
          </div>

          {/* Telegram Bot Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1C1F26] border border-gray-800 rounded-xl text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2AABEE] shadow-[0_0_8px_#2AABEE]" />
            <span className="font-black text-[#54C5FF]">Telegram Bot</span>
          </div>

          {/* Telegram Customer Bot / Menu Button */}
          <button
            onClick={() => setShowTelegramModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-[#2AABEE]/25 transition-all active:scale-95"
            title="Telegram Bot orqali buyurtma berish oynasi va Bot sozlamalari"
          >
            <Send size={14} className="-rotate-12" />
            Telegram Buyurtma (Bot)
          </button>

          {/* Simulate Yandex Eats Order Button */}
          <button
            onClick={() => handleSimulateOrder("yandex_eats")}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-xl bg-[#FCE000] hover:bg-[#ebd000] text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#FCE000]/15 transition-all active:scale-95 disabled:opacity-50"
            title="Yandex Eats dan yangi buyurtma kelishini sinab ko'rish"
          >
            <Sparkles size={13} />
            + Yandex
          </button>

          {/* Simulate Uzum Tezkor Order Button */}
          <button
            onClick={() => handleSimulateOrder("uzum_tezkor")}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-xl bg-[#7000FF] hover:bg-[#6000e0] text-[#FCE000] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#7000FF]/20 transition-all active:scale-95 disabled:opacity-50"
            title="Uzum Tezkor dan yangi buyurtma kelishini sinab ko'rish"
          >
            <Sparkles size={13} />
            + Uzum
          </button>

          {/* Settings button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 bg-[#1C1F26] hover:bg-[#262B34] border border-gray-800 hover:border-gray-700 text-gray-300 rounded-xl transition-all"
            title="Dostavka, Agregator va Telegram Bot Sozlamalari"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-6 py-3 bg-[#111317] border-b border-gray-800/80">
        <div className="bg-[#181B22] border border-gray-800/60 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Bugungi Tushum</p>
            <p className="text-lg font-black text-emerald-400 mt-0.5">
              {formatCurrency(stats?.totalRevenue || 0)}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign size={18} />
          </div>
        </div>

        <div className="bg-[#181B22] border border-gray-800/60 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Yangi Buyurtmalar</p>
            <p className="text-lg font-black text-red-400 mt-0.5 flex items-center gap-1.5">
              {stats?.newOrdersCount || 0}
              {(stats?.newOrdersCount || 0) > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
            <AlertCircle size={18} />
          </div>
        </div>

        <div className="bg-[#181B22] border border-gray-800/60 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#FCE000] uppercase tracking-wider">Yandex Eats</p>
            <p className="text-base font-black text-white mt-0.5">
              {stats?.yandex?.count || 0} ta <span className="text-xs text-gray-400 font-normal">({formatCurrency(stats?.yandex?.revenue || 0)})</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#FCE000]/15 text-[#FCE000] flex items-center justify-center font-black text-xs">
            YE
          </div>
        </div>

        <div className="bg-[#181B22] border border-gray-800/60 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-[#A855F7] uppercase tracking-wider">Uzum Tezkor</p>
            <p className="text-base font-black text-white mt-0.5">
              {stats?.uzum?.count || 0} ta <span className="text-xs text-gray-400 font-normal">({formatCurrency(stats?.uzum?.revenue || 0)})</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#7000FF]/20 text-[#A855F7] flex items-center justify-center font-black text-xs">
            UT
          </div>
        </div>

        <div className="bg-[#181B22] border border-gray-800/60 rounded-xl p-3 flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[11px] font-bold text-[#54C5FF] uppercase tracking-wider">Telegram Bot</p>
            <p className="text-base font-black text-white mt-0.5">
              {stats?.telegram?.count || 0} ta <span className="text-xs text-gray-400 font-normal">({formatCurrency(stats?.telegram?.revenue || 0)})</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#2AABEE]/20 text-[#54C5FF] flex items-center justify-center font-black text-xs">
            <Send size={15} className="-rotate-12" />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="px-6 py-3 bg-[#14171C] border-b border-gray-800 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
        {/* Aggregator selector tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0E1013] rounded-xl border border-gray-800 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveAggregatorFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
              activeAggregatorFilter === "all" ? "bg-white text-black shadow" : "text-gray-400 hover:text-white"
            )}
          >
            Barchasi ({orders.length})
          </button>
          <button
            onClick={() => setActiveAggregatorFilter("yandex_eats")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
              activeAggregatorFilter === "yandex_eats" ? "bg-[#FCE000] text-black shadow" : "text-[#FCE000] hover:bg-white/5"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-black" />
            Yandex Eats ({orders.filter(o => o.aggregator === "yandex_eats").length})
          </button>
          <button
            onClick={() => setActiveAggregatorFilter("uzum_tezkor")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
              activeAggregatorFilter === "uzum_tezkor" ? "bg-[#7000FF] text-[#FCE000] shadow" : "text-[#A855F7] hover:bg-white/5"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-[#FCE000]" />
            Uzum Tezkor ({orders.filter(o => o.aggregator === "uzum_tezkor").length})
          </button>
          <button
            onClick={() => setActiveAggregatorFilter("telegram")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
              activeAggregatorFilter === "telegram" ? "bg-[#2AABEE] text-white shadow" : "text-[#54C5FF] hover:bg-white/5"
            )}
          >
            <Send size={12} className="-rotate-12" />
            Telegram Bot ({orders.filter(o => o.aggregator === "telegram").length})
          </button>
          <button
            onClick={() => setActiveAggregatorFilter("direct")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
              activeAggregatorFilter === "direct" ? "bg-emerald-500 text-white shadow" : "text-emerald-400 hover:bg-white/5"
            )}
          >
            To'g'ridan-to'g'ri ({orders.filter(o => o.aggregator === "direct").length})
          </button>
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Qidiruv (Mijoz, Raqam, Manzil)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0E1013] border border-gray-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center p-1 bg-[#0E1013] rounded-xl border border-gray-800">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                viewMode === "kanban" ? "bg-[#25292E] text-white" : "text-gray-400 hover:text-white"
              )}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                viewMode === "list" ? "bg-[#25292E] text-white" : "text-gray-400 hover:text-white"
              )}
            >
              Ro'yxat
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-gray-800 flex items-center justify-center text-gray-500 mb-4">
              <Package size={32} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Buyurtmalar topilmadi</h3>
            <p className="text-xs text-gray-500 max-w-sm mb-4">
              Hozirda tanlangan filtrlar bo'yicha hech qanday dostavka buyurtmasi mavjud emas.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSimulateOrder("yandex_eats")}
                className="px-4 py-2 rounded-xl bg-[#FCE000] text-black font-bold text-xs hover:bg-[#ebd000]"
              >
                + Yandex Eats Simulyatsiyasi
              </button>
              <button
                onClick={() => handleSimulateOrder("uzum_tezkor")}
                className="px-4 py-2 rounded-xl bg-[#7000FF] text-[#FCE000] font-bold text-xs hover:bg-[#6000e0]"
              >
                + Uzum Tezkor Simulyatsiyasi
              </button>
            </div>
          </div>
        ) : viewMode === "kanban" ? (
          /* Kanban Board Columns */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {/* Column 1: Yangi (New) */}
            <div className="bg-[#14171C] border border-gray-800/80 rounded-2xl p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Yangi Buyurtmalar</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-500/20 text-red-400">
                  {filteredOrders.filter(o => o.status === "new").length}
                </span>
              </div>

              <div className="space-y-3">
                {filteredOrders.filter(o => o.status === "new").map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onView={() => setSelectedOrder(order)}
                    onUpdateStatus={handleUpdateStatus}
                    onPrint={() => handlePrintCourierReceipt(order)}
                    getAggregatorBadge={getAggregatorBadge}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
                {filteredOrders.filter(o => o.status === "new").length === 0 && (
                  <p className="text-center text-xs text-gray-600 py-6">Yangi buyurtmalar yo'q</p>
                )}
              </div>
            </div>

            {/* Column 2: Tayyorlanmoqda (Preparing / In Kitchen) */}
            <div className="bg-[#14171C] border border-gray-800/80 rounded-2xl p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Oshxonada</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-400">
                  {filteredOrders.filter(o => ["accepted", "preparing"].includes(o.status)).length}
                </span>
              </div>

              <div className="space-y-3">
                {filteredOrders.filter(o => ["accepted", "preparing"].includes(o.status)).map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onView={() => setSelectedOrder(order)}
                    onUpdateStatus={handleUpdateStatus}
                    onPrint={() => handlePrintCourierReceipt(order)}
                    getAggregatorBadge={getAggregatorBadge}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
                {filteredOrders.filter(o => ["accepted", "preparing"].includes(o.status)).length === 0 && (
                  <p className="text-center text-xs text-gray-600 py-6">Hozirda oshxonada taom yo'q</p>
                )}
              </div>
            </div>

            {/* Column 3: Kuryer kutilmoqda / Yo'lda */}
            <div className="bg-[#14171C] border border-gray-800/80 rounded-2xl p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Kuryer / Yo'lda</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-purple-500/20 text-purple-400">
                  {filteredOrders.filter(o => ["ready", "out_for_delivery"].includes(o.status)).length}
                </span>
              </div>

              <div className="space-y-3">
                {filteredOrders.filter(o => ["ready", "out_for_delivery"].includes(o.status)).map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onView={() => setSelectedOrder(order)}
                    onUpdateStatus={handleUpdateStatus}
                    onPrint={() => handlePrintCourierReceipt(order)}
                    getAggregatorBadge={getAggregatorBadge}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
                {filteredOrders.filter(o => ["ready", "out_for_delivery"].includes(o.status)).length === 0 && (
                  <p className="text-center text-xs text-gray-600 py-6">Kuryer kutilayotgan buyurtma yo'q</p>
                )}
              </div>
            </div>

            {/* Column 4: Yetkazildi (Delivered) */}
            <div className="bg-[#14171C] border border-gray-800/80 rounded-2xl p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Yetkazildi</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400">
                  {filteredOrders.filter(o => o.status === "delivered").length}
                </span>
              </div>

              <div className="space-y-3">
                {filteredOrders.filter(o => o.status === "delivered").slice(0, 10).map(order => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onView={() => setSelectedOrder(order)}
                    onUpdateStatus={handleUpdateStatus}
                    onPrint={() => handlePrintCourierReceipt(order)}
                    getAggregatorBadge={getAggregatorBadge}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
                {filteredOrders.filter(o => o.status === "delivered").length === 0 && (
                  <p className="text-center text-xs text-gray-600 py-6">Hali yetkazilgan buyurtma yo'q</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* List View Table */
          <div className="bg-[#14171C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181B22] border-b border-gray-800 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Buyurtma</th>
                    <th className="p-3.5">Agregator</th>
                    <th className="p-3.5">Mijoz & Manzil</th>
                    <th className="p-3.5">Taomlar</th>
                    <th className="p-3.5">Kuryer</th>
                    <th className="p-3.5 text-right">Summa</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/80">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5 font-mono font-bold text-white">
                        #{order.orderNumber}
                        <div className="text-[10px] text-gray-500 font-normal">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-3.5">
                        {getAggregatorBadge(order.aggregator)}
                      </td>
                      <td className="p-3.5 max-w-[200px]">
                        <div className="font-bold text-white truncate">{order.customerName}</div>
                        <div className="text-[11px] text-gray-400 truncate">{order.deliveryAddress}</div>
                      </td>
                      <td className="p-3.5 max-w-[220px]">
                        <div className="truncate text-gray-300">
                          {order.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                        </div>
                      </td>
                      <td className="p-3.5 text-gray-300">
                        <div>{order.courierName || "—"}</div>
                        <div className="text-[10px] text-gray-500">{order.courierPhone || ""}</div>
                      </td>
                      <td className="p-3.5 text-right font-black text-emerald-400">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="p-3.5 text-center">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                            title="Batafsil"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handlePrintCourierReceipt(order)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
                            title="Chek chiqarish"
                          >
                            <Printer size={15} />
                          </button>
                          {order.status === "new" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "accepted")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold text-xs"
                            >
                              Qabul
                            </button>
                          )}
                          {order.status === "accepted" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "preparing")}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-bold text-xs"
                            >
                              Oshxona
                            </button>
                          )}
                          {order.status === "preparing" && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, "ready")}
                              className="px-2.5 py-1 rounded-lg bg-purple-500 text-white font-bold text-xs"
                            >
                              Tayyor
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#181B22] border border-gray-700 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              {getAggregatorBadge(selectedOrder.aggregator)}
              <div>
                <h2 className="text-xl font-black">Buyurtma #{selectedOrder.orderNumber}</h2>
                <p className="text-xs text-gray-400">{new Date(selectedOrder.createdAt).toLocaleString('uz-UZ')}</p>
              </div>
            </div>

            {/* Status changer bar */}
            <div className="bg-[#111317] p-3 rounded-2xl border border-gray-800 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Joriy Holat</span>
                <div className="mt-0.5">{getStatusBadge(selectedOrder.status)}</div>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedOrder.status === "new" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "accepted")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-lg"
                  >
                    Qabul qilish
                  </button>
                )}
                {["accepted", "preparing"].includes(selectedOrder.status) && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "ready")}
                    className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-black shadow-lg"
                  >
                    Kuryerga berish
                  </button>
                )}
                {selectedOrder.status === "ready" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "out_for_delivery")}
                    className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-black shadow-lg"
                  >
                    Yo'lga chiqdi
                  </button>
                )}
                {selectedOrder.status === "out_for_delivery" && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, "delivered")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-lg"
                  >
                    Yetkazildi
                  </button>
                )}
              </div>
            </div>

            {/* Customer & Courier Details */}
            <div className="space-y-3 bg-[#111317] p-4 rounded-2xl border border-gray-800 mb-4 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">{selectedOrder.customerName} ({selectedOrder.customerPhone})</div>
                  <div className="text-gray-300 mt-0.5">{selectedOrder.deliveryAddress}</div>
                  {selectedOrder.deliveryLocation && (
                    <div className="text-amber-400/90 text-[11px] mt-0.5 font-medium">
                      Mo'ljal: {selectedOrder.deliveryLocation}
                    </div>
                  )}
                </div>
              </div>

              {selectedOrder.comment && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300">
                  <span className="font-bold">Mijoz izohi:</span> {selectedOrder.comment}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-gray-800 pt-2 text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Bike size={14} className="text-purple-400" />
                  <span>Kuryer: <strong className="text-white">{selectedOrder.courierName || "Tayinlanmoqda"}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <Clock size={14} className="text-emerald-400" />
                  <span>{selectedOrder.estimatedDeliveryTime || "25 min"}</span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-4">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Buyurtma Taomlari</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] text-xs">
                    <div>
                      <span className="font-black text-white">{item.quantity}x</span> {item.name}
                      {item.comment && <div className="text-[10px] text-amber-400 italic">({item.comment})</div>}
                    </div>
                    <span className="font-bold text-gray-300">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="border-t border-gray-800 pt-3 space-y-1 text-xs mb-5">
              <div className="flex justify-between text-gray-400">
                <span>Taomlar summasi:</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Dostavka to'lovi:</span>
                <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-amber-400/80">
                <span>Agregator komissiyasi:</span>
                <span>- {formatCurrency(selectedOrder.aggregatorFee)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-white border-t border-gray-800 pt-2 mt-1">
                <span>Jami Mijoz To'lovi:</span>
                <span className="text-emerald-400">{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePrintCourierReceipt(selectedOrder)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Printer size={15} />
                Chek chiqarish
              </button>
              {selectedOrder.status !== "cancelled" && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, "cancelled")}
                  className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-xs"
                >
                  Bekor qilish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aggregator & API Settings Modal */}
      <AggregatorSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        activeCafe={linkedCafe}
        onSaved={fetchDeliveryOrders}
      />

      {/* Telegram Bot Customer & Setup Modal */}
      <TelegramBotCustomerModal
        isOpen={showTelegramModal}
        onClose={() => setShowTelegramModal(false)}
        onOrderCreated={fetchDeliveryOrders}
      />
    </div>
  );
};

// Sub-component for individual order card
interface OrderCardProps {
  order: DeliveryOrder;
  onView: () => void;
  onUpdateStatus: (orderId: string, status: DeliveryStatus) => void;
  onPrint: () => void;
  getAggregatorBadge: (aggregator: DeliveryAggregator) => React.ReactNode;
  getStatusBadge: (status: DeliveryStatus) => React.ReactNode;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onView,
  onUpdateStatus,
  onPrint,
  getAggregatorBadge,
  getStatusBadge
}) => {
  const isYandex = order.aggregator === "yandex_eats";
  const isUzum = order.aggregator === "uzum_tezkor";
  const isTelegram = order.aggregator === "telegram";

  return (
    <div className={`p-3.5 rounded-2xl border transition-all hover:shadow-xl bg-[#181B22] ${
      order.status === "new" 
        ? isYandex 
          ? "border-[#FCE000] shadow-[0_4px_20px_rgba(252,224,0,0.15)]" 
          : isUzum 
            ? "border-[#7000FF] shadow-[0_4px_20px_rgba(112,0,255,0.15)]" 
            : isTelegram
              ? "border-[#2AABEE] shadow-[0_4px_20px_rgba(42,171,238,0.2)]"
              : "border-red-500"
        : "border-gray-800 hover:border-gray-700"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        {getAggregatorBadge(order.aggregator)}
        <span className="font-mono font-bold text-white text-xs">#{order.orderNumber}</span>
      </div>

      {/* Customer info */}
      <div className="mb-2.5">
        <div className="font-bold text-white text-xs truncate flex items-center justify-between">
          <span>{order.customerName}</span>
          {order.telegramUsername && (
            <span className="text-[10px] text-[#54C5FF] font-mono">@{order.telegramUsername}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <a
            href={`tel:${order.customerPhone.replace(/\s+/g, '')}`}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone size={10} />
            {order.customerPhone}
          </a>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
            order.paymentMethod === 'cash' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : order.paymentMethod === 'card_on_delivery'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {order.paymentMethod === 'cash' ? '💵 Naqd' : order.paymentMethod === 'card_on_delivery' ? '💳 Terminal' : '💳 Onlayn'}
          </span>
        </div>
        <div className="text-[11px] text-gray-400 truncate flex items-center gap-1 mt-1">
          <MapPin size={11} className="shrink-0 text-gray-500" />
          {order.deliveryAddress}
        </div>
      </div>

      {/* Items preview */}
      <div className="bg-[#111317] p-2 rounded-xl text-[11px] text-gray-300 mb-2.5 space-y-0.5 border border-gray-800/60">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span className="truncate pr-1">
              <strong className="text-white">{item.quantity}x</strong> {item.name}
            </span>
            <span className="text-gray-400 font-mono text-[10px] shrink-0">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Price & ETA */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="text-gray-400 flex items-center gap-1 font-mono text-[11px]">
          <Clock size={12} className="text-amber-400" />
          {order.estimatedDeliveryTime || "25 min"}
        </div>
        <div className="font-black text-emerald-400 text-sm">
          {formatCurrency(order.totalAmount)}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-gray-800/80">
        <button
          onClick={onView}
          className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[11px] font-bold transition-colors"
        >
          Ko'rish
        </button>

        <button
          onClick={onPrint}
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
          title="Chek chiqarish"
        >
          <Printer size={14} />
        </button>

        {order.status === "new" && (
          <button
            onClick={() => onUpdateStatus(order.id, "accepted")}
            className={`px-3 py-1.5 rounded-xl font-black text-[11px] shadow-md transition-all active:scale-95 ${
              isYandex 
                ? "bg-[#FCE000] text-black" 
                : isUzum 
                  ? "bg-[#7000FF] text-white" 
                  : isTelegram
                    ? "bg-[#2AABEE] text-white"
                    : "bg-emerald-500 text-white"
            }`}
          >
            Qabul qilish
          </button>
        )}

        {order.status === "accepted" && (
          <button
            onClick={() => onUpdateStatus(order.id, "preparing")}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-[11px]"
          >
            Oshxona
          </button>
        )}

        {order.status === "preparing" && (
          <button
            onClick={() => onUpdateStatus(order.id, "ready")}
            className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-black text-[11px]"
          >
            Tayyor
          </button>
        )}

        {order.status === "ready" && (
          <button
            onClick={() => onUpdateStatus(order.id, "out_for_delivery")}
            className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-[11px]"
          >
            Yo'lda
          </button>
        )}

        {order.status === "out_for_delivery" && (
          <button
            onClick={() => onUpdateStatus(order.id, "delivered")}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px]"
          >
            Yetkazildi
          </button>
        )}
      </div>
    </div>
  );
};
