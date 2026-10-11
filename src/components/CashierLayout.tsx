import React, { useState, useEffect } from "react";
import { useOrder } from "../context/OrderContext";
import { TableSelection } from "./TableSelection";
import { ProductGrid } from "./ProductGrid";
import { OrderSidebar } from "./OrderSidebar";
import { HistoryView } from "./HistoryView";
import { MenuManagement } from "./MenuManagement";
import { SettingsView } from "./SettingsView";
import { KitchenView } from "./KitchenView";
import { SoliqView } from "./SoliqView";
import { DeliveryView } from "./delivery/DeliveryView";
import { CrmModule } from "./admin/CrmModule";
import { PrintLayout } from "./PrintLayout";
import { TopDeliveryNotification } from "./delivery/TopDeliveryNotification";
import { CashierExpensesView } from "./cashier/CashierExpensesView";
import { CashierAllBillsView } from "./cashier/CashierAllBillsView";
import { YandexEdaView } from "./delivery/YandexEdaView";
import { NetworkSyncStatus } from "./NetworkSyncStatus";
import { 
  Users, 
  LayoutGrid, 
  Bike, 
  CalendarCheck, 
  QrCode, 
  Settings, 
  DollarSign, 
  Receipt, 
  Layers, 
  Tv2, 
  UserCheck, 
  Utensils, 
  LogOut, 
  Filter, 
  X, 
  Plus, 
  ArrowDownRight, 
  ArrowUpRight, 
  Check, 
  Clock,
  Search
} from "lucide-react";

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

export const CashierLayout: React.FC = () => {
  const { 
    waiter, 
    linkedCafe,
    logout, 
    isPrinting, 
    currentTable, 
    tables, 
    selectTable, 
    incomingDeliveryOrder, 
    acceptDeliveryOrder, 
    dismissDeliveryNotification 
  } = useOrder();

  // Active view: null (pure black screen matching screenshot) | 'halls' | 'staff' | 'delivery' | 'booking' | 'qr_menu' | 'settings' | 'expenses' | 'bill' | 'all_bills' | 'monitor' | 'clients' | 'dishes'
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());

  const handleToggleTab = (tabName: string) => {
    setActiveTab(prev => (prev === tabName ? null : tabName));
  };

  // Filter Modal
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedHallFilter, setSelectedHallFilter] = useState("all");
  const [selectedWaiterFilter, setSelectedWaiterFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Dynamic Halls from server/admin sync
  const [halls, setHalls] = useState<Array<{ id: string; name: string; servicePercent?: number; status?: string }>>([
    { id: "h1", name: "Asosiy zal", servicePercent: 10, status: "active" },
    { id: "h2", name: "Terassa", servicePercent: 10, status: "active" },
    { id: "h3", name: "VIP xonalar", servicePercent: 15, status: "active" },
    { id: "h4", name: "Bar", servicePercent: 10, status: "active" }
  ]);

  useEffect(() => {
    const fetchHalls = async () => {
      const cafeId = linkedCafe?.id || waiter?.cafeId || "default";
      try {
        const res = await fetch("/api/halls", { headers: { "x-cafe-id": cafeId } });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setHalls(data);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch halls in cashier:", e);
      }
    };
    fetchHalls();
    const interval = setInterval(fetchHalls, 5000);
    return () => clearInterval(interval);
  }, [linkedCafe?.id, waiter?.cafeId]);

  // Filter tables by selected hall name
  const filteredTables = tables.filter(t => {
    if (selectedHallFilter === "all") return true;
    const hallName = (t as any).hall || halls[0]?.name || "Asosiy zal";
    return hallName === selectedHallFilter;
  });

  // Expenses and Incomes (Расходы и приходы) Modal/State
  const [cashTransactions, setCashTransactions] = useState<Array<{
    id: string;
    type: "income" | "expense";
    category: string;
    amount: number;
    description: string;
    time: string;
    author: string;
  }>>([
    { id: "1", type: "income", category: "Kassa ochilishi", amount: 500000, description: "Boshlang'ich qoldiq", time: "09:00", author: "Аида" },
    { id: "2", type: "expense", category: "Xo'jalik", amount: 80000, description: "Salfetka va tozalash vositalari", time: "11:30", author: "Аида" }
  ]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newTransType, setNewTransType] = useState<"income" | "expense">("expense");
  const [newTransCategory, setNewTransCategory] = useState("Xo'jalik xarajatlari");
  const [newTransAmount, setNewTransAmount] = useState("");
  const [newTransDesc, setNewTransDesc] = useState("");

  // Reservations (Бронирование) State
  const [bookings, setBookings] = useState<Array<{
    id: string;
    guestName: string;
    phone: string;
    tableNumber: string;
    guestsCount: number;
    time: string;
    deposit: number;
    status: "confirmed" | "pending" | "cancelled";
    note: string;
  }>>([
    { id: "b1", guestName: "Rustam aka", phone: "+998 90 123 45 67", tableNumber: "VIP 1", guestsCount: 8, time: "19:00", deposit: 200000, status: "confirmed", note: "Tug'ilgan kun ziyofati" },
    { id: "b2", guestName: "Dilshod", phone: "+998 97 765 43 21", tableNumber: "12", guestsCount: 4, time: "20:30", deposit: 100000, status: "confirmed", note: "Oyna yonidagi stol" }
  ]);
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    guestName: "",
    phone: "+998 ",
    tableNumber: "1",
    guestsCount: 2,
    time: "19:00",
    deposit: 0,
    note: ""
  });

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransAmount || isNaN(Number(newTransAmount))) return;
    const amountNum = Number(newTransAmount);
    setCashTransactions(prev => [
      {
        id: Date.now().toString(),
        type: newTransType,
        category: newTransCategory,
        amount: amountNum,
        description: newTransDesc,
        time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        author: waiter?.name || "Кассир"
      },
      ...prev
    ]);
    setShowExpenseModal(false);
    setNewTransAmount("");
    setNewTransDesc("");
  };

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.guestName) return;
    setBookings(prev => [
      {
        id: Date.now().toString(),
        guestName: newBooking.guestName,
        phone: newBooking.phone,
        tableNumber: newBooking.tableNumber,
        guestsCount: newBooking.guestsCount,
        time: newBooking.time,
        deposit: Number(newBooking.deposit) || 0,
        status: "confirmed",
        note: newBooking.note
      },
      ...prev
    ]);
    setShowNewBookingModal(false);
    setNewBooking({
      guestName: "",
      phone: "+998 ",
      tableNumber: "1",
      guestsCount: 2,
      time: "19:00",
      deposit: 0,
      note: ""
    });
  };

  // Switch to bill view when table selected
  const handleSelectTableAndBill = (tableId: string) => {
    selectTable(tableId);
    setActiveTab("bill");
  };

  // Metallic button classes
  const getButtonClass = (isActive: boolean) => {
    if (isActive) {
      return "bg-gradient-to-b from-[#2171c7] via-[#1559a4] to-[#0e4480] text-white border-[#0e4480] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] font-bold";
    }
    return "bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-[#ffffff] hover:via-[#e2e6eb] hover:to-[#c6ccd6] text-[#2c3238] border-[#8f96a0] shadow-[0_2px_4px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 font-bold";
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-black select-none font-sans">
      {/* Top Notification for incoming delivery orders */}
      <TopDeliveryNotification
        incomingOrder={incomingDeliveryOrder}
        onAccept={acceptDeliveryOrder}
        onSendToKitchen={acceptDeliveryOrder}
        onDismiss={dismissDeliveryNotification}
        onViewOrder={() => setActiveTab("delivery")}
      />

      {/* ========================================================================= */}
      {/* TOP HEADER BAR (METALLIC GREY - MATCHING JOWI POS EXACTLY)                 */}
      {/* ========================================================================= */}
      <header className="h-16 px-4 bg-gradient-to-b from-[#d5d9de] via-[#bec4cc] to-[#a8afb8] border-b-2 border-[#828892] flex items-center justify-between shadow-[0_4px_10px_rgba(0,0,0,0.4)] z-30 shrink-0">
        {/* TOP LEFT: CASHIER INFO, DATE, TIME, FILTER BUTTON */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-[11px] leading-tight text-[#1e2329]">
            <div className="font-black text-xs text-[#11161d]">
              {waiter?.role === "admin" || waiter?.isAdmin ? "Администратор" : "Кассир"}: {waiter?.name || "Аида"}
            </div>
            <div className="text-[10px] text-gray-700 font-semibold">
              {formatJowiDate(time)}
            </div>
            <div className="text-xs font-mono font-black text-[#11161d]">
              {time.toLocaleTimeString("ru-RU")}
            </div>
          </div>

          {/* Фильтр button */}
          <button
            onClick={() => setShowFilterModal(true)}
            className={`px-3 py-1.5 rounded-lg border text-xs tracking-wide transition-all cursor-pointer ${
              selectedHallFilter !== "all" || selectedWaiterFilter !== "all" || selectedStatusFilter !== "all"
                ? "bg-amber-400 text-black border-amber-600 font-black shadow-md"
                : getButtonClass(false)
            }`}
          >
            Фильтр
          </button>
        </div>

        {/* TOP RIGHT NAVIGATION BUTTONS */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Network / Server Sync Status Badge */}
          <NetworkSyncStatus compact />

          {/* 1. Персонал ресторана */}
          <button
            onClick={() => handleToggleTab("staff")}
            className={`px-3 sm:px-3.5 py-2 rounded-lg border text-[11px] sm:text-xs transition-all cursor-pointer ${getButtonClass(activeTab === "staff")}`}
          >
            Персонал ресторана
          </button>

          {/* 2. Залы (Tables / Halls) */}
          <button
            onClick={() => handleToggleTab("halls")}
            className={`px-3 sm:px-4 py-2 rounded-lg border text-[11px] sm:text-xs transition-all cursor-pointer ${getButtonClass(activeTab === "halls")}`}
          >
            Залы
          </button>

          {/* 3. Доставка (Delivery) */}
          <button
            onClick={() => handleToggleTab("delivery")}
            className={`px-3 sm:px-3.5 py-2 rounded-lg border text-[11px] sm:text-xs transition-all cursor-pointer ${getButtonClass(activeTab === "delivery")}`}
          >
            Доставка
          </button>

          {/* 4. Бронирование (Reservations) */}
          <button
            onClick={() => handleToggleTab("booking")}
            className={`px-3 sm:px-3.5 py-2 rounded-lg border text-[11px] sm:text-xs transition-all cursor-pointer ${getButtonClass(activeTab === "booking")}`}
          >
            Бронирование
          </button>

          {/* 5. Электронное меню (QR menu) */}
          <button
            onClick={() => handleToggleTab("qr_menu")}
            className={`px-3 sm:px-3.5 py-2 rounded-lg border text-[11px] sm:text-xs transition-all cursor-pointer ${getButtonClass(activeTab === "qr_menu")}`}
          >
            Электронное меню
          </button>

          {/* 6. Настройки (Settings) */}
          <button
            onClick={() => handleToggleTab("settings")}
            className={`px-3 sm:px-3.5 py-2 rounded-lg border text-[11px] sm:text-xs transition-all cursor-pointer ${getButtonClass(activeTab === "settings")}`}
          >
            Настройки
          </button>

          {/* 7. Yandex EDA */}
          <button
            onClick={() => handleToggleTab("yandex_eda")}
            className={`px-3 sm:px-3.5 py-2 rounded-lg border text-[11px] sm:text-xs font-black transition-all cursor-pointer bg-[#ffcc00]/10 border-amber-500/40 text-[#ffcc00] hover:bg-[#ffcc00]/20 ${getButtonClass(activeTab === "yandex_eda")}`}
          >
            🟡 Yandex EDA
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CENTRAL WORK AREA (BLACK HIGH-CONTRAST CANVAS)                       */}
      {/* ========================================================================= */}
      <main className="flex-1 flex overflow-hidden relative bg-black">
        {/* VIEW 1: ЗАЛЫ (HALLS / TABLES) */}
        {activeTab === "halls" && (
          <div className="flex-1 flex flex-col h-full bg-[#121418] overflow-hidden">
            {/* Top Sub-Bar for Halls Tabs */}
            <div className="h-10 px-4 bg-[#1a1d22] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedHallFilter("all")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    selectedHallFilter === "all"
                      ? "bg-[#ffcc00] text-black border border-amber-500 font-black shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Barchasi
                </button>
                {halls.map((h) => (
                  <button
                    key={h.id || h.name}
                    onClick={() => setSelectedHallFilter(h.name)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      selectedHallFilter === h.name
                        ? "bg-[#ffcc00] text-black border border-amber-500 font-black shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {h.name}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedHallFilter("Yandex EDA")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                    selectedHallFilter === "Yandex EDA"
                      ? "bg-[#ffcc00] text-black border border-amber-500 font-black shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  🟡 Yandex EDA
                </button>
              </div>
              <div className="text-xs text-gray-400 whitespace-nowrap">
                Jami stollar: <span className="text-white font-bold">{filteredTables.length}</span> / {tables.length}
              </div>
            </div>

            {/* If Yandex EDA is selected inside Halls, render YandexEdaView, otherwise Tables Grid */}
            {selectedHallFilter === "Yandex EDA" ? (
              <YandexEdaView activeCafeId={waiter?.cafeId || linkedCafe?.id || "default"} />
            ) : (
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredTables.map((table) => {
                    const isOccupied = table.status === "occupied";
                    return (
                      <button
                        key={table.id}
                        onClick={() => handleSelectTableAndBill(table.id)}
                        className={`h-36 rounded-2xl border-2 p-4 flex flex-col justify-between text-left transition-all cursor-pointer relative overflow-hidden group shadow-lg ${
                          isOccupied
                            ? "bg-gradient-to-br from-[#7e22ce]/30 via-[#581c87]/20 to-[#3b0764]/40 border-purple-500/70 hover:border-purple-400"
                            : "bg-[#1f2329] border-gray-700/80 hover:border-gray-500"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-2xl font-black text-white">
                            #{table.number}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isOccupied ? "bg-purple-600 text-white" : "bg-emerald-600/30 text-emerald-400 border border-emerald-500/30"
                          }`}>
                            {isOccupied ? "Band" : "Bo'sh"}
                          </span>
                        </div>

                        <div>
                          {isOccupied ? (
                            <div className="space-y-0.5">
                              <div className="text-xs text-purple-200 font-bold truncate">
                                {table.activeWaiterName || "Ofitsiant"}
                              </div>
                              <div className="text-[11px] text-gray-400">
                                Buyurtma ochilgan
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">
                              Stol tayyor
                            </div>
                          )}
                        </div>

                        <div className="text-[10px] text-gray-400 flex items-center justify-between border-t border-white/5 pt-1.5">
                          <span>{table.seats || 4} kishilik</span>
                          <span className="text-amber-400 group-hover:underline">Ochish →</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW: YANDEX EDA DIRECT TAB */}
        {activeTab === "yandex_eda" && (
          <div className="flex-1 flex flex-col h-full bg-[#121418] overflow-hidden">
            <YandexEdaView activeCafeId={waiter?.cafeId || linkedCafe?.id || "default"} />
          </div>
        )}

        {/* VIEW 2: СЧЕТ (ACTIVE BILL / ORDER CART) */}
        {activeTab === "bill" && (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <ProductGrid />
            </div>
            <OrderSidebar />
          </div>
        )}

        {/* VIEW 3: ВСЕ СЧЕТА (ALL BILLS & ACCOUNTS - MATCHING IMAGES EXACTLY) */}
        {activeTab === "all_bills" && (
          <CashierAllBillsView
            onBack={() => setActiveTab(null)}
            onExit={logout}
          />
        )}

        {/* VIEW 4: МОНИТОР (KITCHEN / BAR DISPLAY MONITOR) */}
        {activeTab === "monitor" && (
          <div className="flex-1 h-full overflow-hidden">
            <KitchenView />
          </div>
        )}

        {/* VIEW 5: КЛИЕНТЫ (CRM LOYALTY & DEBTS) */}
        {activeTab === "clients" && (
          <div className="flex-1 h-full overflow-hidden bg-[#121418]">
            <CrmModule />
          </div>
        )}

        {/* VIEW 6: БЛЮДА (MENU / DISHES MANAGEMENT) */}
        {activeTab === "dishes" && (
          <div className="flex-1 h-full overflow-hidden bg-[#121418]">
            <MenuManagement />
          </div>
        )}

        {/* VIEW 7: ДОСТАВКА (DELIVERY VIEW) */}
        {activeTab === "delivery" && (
          <div className="flex-1 h-full overflow-hidden bg-[#121418]">
            <DeliveryView />
          </div>
        )}

        {/* VIEW 8: ПЕРСОНАЛ РЕСТОРАНА (STAFF VIEW) */}
        {activeTab === "staff" && (
          <div className="flex-1 bg-[#121418] p-6 overflow-y-auto text-white">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black">Restoran xodimlari va navbatchilik</h1>
                  <p className="text-gray-400 text-xs">Ofitsiantlar, barmenlar va kassirlar holati</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Аида", role: "Кассир", status: "online", shift: "08:00 - 20:00", orders: 18 },
                  { name: "Бармен", role: "Бармен", status: "online", shift: "10:00 - 23:00", orders: 32 },
                  { name: "Ержан", role: "Официант", status: "online", shift: "09:00 - 22:00", orders: 12 },
                  { name: "Ибрагим", role: "Официант", status: "online", shift: "09:00 - 22:00", orders: 9 },
                  { name: "Николай", role: "Официант", status: "online", shift: "11:00 - 23:00", orders: 15 },
                  { name: "Менеджер", role: "Менеджер", status: "online", shift: "09:00 - 21:00", orders: 0 }
                ].map((s, idx) => (
                  <div key={idx} className="bg-[#1f2329] border border-gray-700/70 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-base">{s.name}</div>
                        <div className="text-xs text-amber-400">{s.role}</div>
                      </div>
                      <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    </div>
                    <div className="text-xs text-gray-400 flex items-center justify-between border-t border-white/5 pt-2">
                      <span>Smena: {s.shift}</span>
                      <span className="text-white font-bold">{s.orders} ta buyurtma</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 9: БРОНИРОВАНИЕ (RESERVATIONS VIEW) */}
        {activeTab === "booking" && (
          <div className="flex-1 bg-[#121418] p-6 overflow-y-auto text-white">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black">Stol band qilish (Bron)</h1>
                  <p className="text-gray-400 text-xs">Mijozlar buyurtmalari va kelgusi bronlar</p>
                </div>
                <button
                  onClick={() => setShowNewBookingModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Yangi bron qo'shish</span>
                </button>
              </div>

              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="bg-[#1f2329] border border-gray-700 p-4 rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base text-white">{b.guestName}</span>
                        <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded font-bold">Stol: #{b.tableNumber}</span>
                        <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded font-bold">{b.guestsCount} kishi</span>
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-3">
                        <span>Tel: {b.phone}</span>
                        <span>Vaqt: <b>{b.time}</b></span>
                        {b.deposit > 0 && <span className="text-emerald-400 font-bold">Depozit: {b.deposit.toLocaleString()} so'm</span>}
                      </div>
                      {b.note && <div className="text-[11px] text-gray-400 italic">Izoh: {b.note}</div>}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-lg">
                        Tasdiqlangan
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 10: РАСХОДЫ И ПРИХОДЫ (CASH EXPENSES / INCOMES - MATCHING IMAGES EXACTLY) */}
        {activeTab === "expenses" && (
          <CashierExpensesView
            onBack={() => setActiveTab(null)}
            onExit={logout}
          />
        )}

        {/* VIEW 11: ЭЛЕКТРОННОЕ МЕНЮ (ELECTRONIC QR MENU) */}
        {activeTab === "qr_menu" && (
          <div className="flex-1 bg-[#121418] p-6 overflow-y-auto text-white flex flex-col items-center justify-center">
            <div className="max-w-md w-full bg-[#1f2329] border border-gray-700 p-8 rounded-2xl text-center space-y-4 shadow-2xl">
              <QrCode size={64} className="mx-auto text-amber-400" />
              <h2 className="text-xl font-black">Elektron QR Menyu</h2>
              <p className="text-gray-400 text-xs">
                Mijozlar stol ustidagi QR kodni skanerlab restoranning elektron menyusini ko'rishlari mumkin.
              </p>
              <div className="p-4 bg-white rounded-xl inline-block shadow-lg">
                <div className="w-44 h-44 bg-gray-900 flex items-center justify-center text-white font-mono text-xs rounded">
                  QR MENU CODE
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 12: НАСТРОЙКИ (SETTINGS VIEW) */}
        {activeTab === "settings" && (
          <div className="flex-1 h-full overflow-hidden bg-[#121418]">
            <SettingsView />
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* BOTTOM FOOTER BAR (METALLIC GREY - MATCHING JOWI POS EXACTLY)             */}
      {/* ========================================================================= */}
      <footer className="h-16 px-4 bg-gradient-to-b from-[#d5d9de] via-[#bec4cc] to-[#a8afb8] border-t-2 border-[#828892] flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.3)] z-30 shrink-0">
        {/* BOTTOM LEFT BUTTONS */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 1. Расходы и приходы */}
          <button
            onClick={() => handleToggleTab("expenses")}
            className={`px-3 sm:px-3.5 py-2 rounded-lg border text-[11px] sm:text-xs transition-all cursor-pointer ${getButtonClass(activeTab === "expenses")}`}
          >
            Расходы и приходы
          </button>

          {/* 2. Счет (Current Bill / Order) */}
          <button
            onClick={() => handleToggleTab("bill")}
            className={`px-3 sm:px-4 py-2 rounded-lg border text-[11px] sm:text-xs transition-all cursor-pointer ${getButtonClass(activeTab === "bill")}`}
          >
            Счет
          </button>

          {/* 3. Все счета (All Accounts) */}
          <button
            onClick={() => handleToggleTab("all_bills")}
            className={`px-3 sm:px-3.5 py-2 rounded-lg border text-[11px] sm:text-xs transition-all cursor-pointer ${getButtonClass(activeTab === "all_bills")}`}
          >
            Все счета
          </button>

          {/* 4. Монитор (Kitchen/Bar Display) */}
          <button
            onClick={() => handleToggleTab("monitor")}
            className={`px-3 sm:px-3.5 py-2 rounded-lg border text-[11px] sm:text-xs transition-all cursor-pointer ${getButtonClass(activeTab === "monitor")}`}
          >
            Монитор
          </button>

          {/* 5. Клиенты (CRM Clients) */}
          <button
            onClick={() => handleToggleTab("clients")}
            className={`px-3 sm:px-3.5 py-2 rounded-lg border text-[11px] sm:text-xs transition-all cursor-pointer ${getButtonClass(activeTab === "clients")}`}
          >
            Клиенты
          </button>

          {/* 6. Блюда (Dishes Catalog) */}
          <button
            onClick={() => handleToggleTab("dishes")}
            className={`px-3 sm:px-3.5 py-2 rounded-lg border text-[11px] sm:text-xs transition-all cursor-pointer ${getButtonClass(activeTab === "dishes")}`}
          >
            Блюда
          </button>
        </div>

        {/* BOTTOM RIGHT: ВЫХОД (EXIT / LOGOUT) */}
        <div>
          <button
            onClick={logout}
            className="px-5 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-[#ffffff] hover:via-[#e2e6eb] hover:to-[#c6ccd6] text-[#2c3238] text-xs font-black shadow-[0_2px_4px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer"
          >
            Выход
          </button>
        </div>
      </footer>

      {/* FILTER MODAL */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1f2329] border border-gray-700 rounded-2xl w-full max-w-md p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-700 pb-3">
              <h3 className="font-black text-base">Stollarni filtrlash</h3>
              <button onClick={() => setShowFilterModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Zal bo'yicha:</label>
                <select
                  value={selectedHallFilter}
                  onChange={(e) => setSelectedHallFilter(e.target.value)}
                  className="w-full bg-[#121418] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                >
                  <option value="all">Barcha zallar</option>
                  {halls.map((h) => (
                    <option key={h.id || h.name} value={h.name}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Holati bo'yicha:</label>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full bg-[#121418] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none"
                >
                  <option value="all">Barchasi</option>
                  <option value="available">Faqat bo'sh stollar</option>
                  <option value="occupied">Faqat band stollar</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={() => {
                  setSelectedHallFilter("all");
                  setSelectedWaiterFilter("all");
                  setSelectedStatusFilter("all");
                  setShowFilterModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 font-bold hover:bg-white/5 cursor-pointer text-xs"
              >
                Tozalash
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black cursor-pointer text-xs"
              >
                Qo'llash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW EXPENSE / INCOME MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddTransaction} className="bg-[#1f2329] border border-gray-700 rounded-2xl w-full max-w-md p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-700 pb-3">
              <h3 className="font-black text-base">Kassa amaliyoti kiritish</h3>
              <button type="button" onClick={() => setShowExpenseModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewTransType("expense")}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  newTransType === "expense" ? "bg-rose-500 text-white" : "bg-white/5 text-gray-400"
                }`}
              >
                Chiqim (Xarajat)
              </button>
              <button
                type="button"
                onClick={() => setNewTransType("income")}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  newTransType === "income" ? "bg-emerald-500 text-white" : "bg-white/5 text-gray-400"
                }`}
              >
                Kirim (To'lov)
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Kategoriya:</label>
                <input
                  type="text"
                  value={newTransCategory}
                  onChange={(e) => setNewTransCategory(e.target.value)}
                  placeholder="Masalan: Mahsulot sotib olish, Xo'jalik"
                  className="w-full bg-[#121418] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Summa (so'm):</label>
                <input
                  type="number"
                  value={newTransAmount}
                  onChange={(e) => setNewTransAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-[#121418] border border-gray-700 rounded-xl px-3 py-2 text-white text-base font-bold outline-none"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Izoh:</label>
                <textarea
                  value={newTransDesc}
                  onChange={(e) => setNewTransDesc(e.target.value)}
                  placeholder="Qisqacha izoh..."
                  className="w-full bg-[#121418] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none h-16 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 font-bold cursor-pointer text-xs"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black cursor-pointer text-xs"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NEW BOOKING MODAL */}
      {showNewBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddBooking} className="bg-[#1f2329] border border-gray-700 rounded-2xl w-full max-w-md p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-700 pb-3">
              <h3 className="font-black text-base">Yangi stol band qilish</h3>
              <button type="button" onClick={() => setShowNewBookingModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Mijoz ismi:</label>
                <input
                  type="text"
                  value={newBooking.guestName}
                  onChange={(e) => setNewBooking({ ...newBooking, guestName: e.target.value })}
                  placeholder="Mijoz to'liq ismi"
                  className="w-full bg-[#121418] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Telefon:</label>
                  <input
                    type="text"
                    value={newBooking.phone}
                    onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                    className="w-full bg-[#121418] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Stol raqami:</label>
                  <input
                    type="text"
                    value={newBooking.tableNumber}
                    onChange={(e) => setNewBooking({ ...newBooking, tableNumber: e.target.value })}
                    className="w-full bg-[#121418] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Mehmonlar soni:</label>
                  <input
                    type="number"
                    value={newBooking.guestsCount}
                    onChange={(e) => setNewBooking({ ...newBooking, guestsCount: Number(e.target.value) })}
                    className="w-full bg-[#121418] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Vaqti:</label>
                  <input
                    type="text"
                    value={newBooking.time}
                    onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })}
                    placeholder="19:00"
                    className="w-full bg-[#121418] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Depozit summasi (agar olingan bo'lsa):</label>
                <input
                  type="number"
                  value={newBooking.deposit}
                  onChange={(e) => setNewBooking({ ...newBooking, deposit: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full bg-[#121418] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Izoh:</label>
                <textarea
                  value={newBooking.note}
                  onChange={(e) => setNewBooking({ ...newBooking, note: e.target.value })}
                  placeholder="Masalan: Maxsus menyu yoki bezak..."
                  className="w-full bg-[#121418] border border-gray-700 rounded-xl px-3 py-2 text-white outline-none h-16 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewBookingModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 font-bold cursor-pointer text-xs"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black cursor-pointer text-xs"
              >
                Bron qilish
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bill Printing Layout */}
      {isPrinting && <PrintLayout />}
    </div>
  );
};
