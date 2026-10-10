import React, { useState, useEffect } from "react";
import { useOrder } from "../../context/OrderContext";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface BillRecord {
  id: string;
  billNumber: string | number;
  openDate: string;
  closeDate?: string;
  waiterName: string;
  hallName: string;
  tableNumber: string | number;
  clientName?: string;
  smartCard?: string;
  guestsCount?: number;
  subtotal: number;
  serviceCharge: number;
  discount: number;
  total: number;
  status: "open" | "closed" | "debt";
  items: OrderItem[];
  paymentMethod?: string;
  description?: string;
}

interface CashierAllBillsViewProps {
  onBack: () => void;
  onExit: () => void;
}

const MONTH_NAMES_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

const SHORT_MONTH_NAMES_RU = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"
];

const WEEKDAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const CashierAllBillsView: React.FC<CashierAllBillsViewProps> = ({ onBack, onExit }) => {
  const { waiter, linkedCafe } = useOrder();

  // Tab filter: 'open' | 'closed' | 'debt'
  const [activeBillTab, setActiveBillTab] = useState<"open" | "closed" | "debt">("open");
  const [searchQuery, setSearchQuery] = useState("");

  // Dates state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });

  // Calendar Modal State (Image 3)
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calLeftMonth, setCalLeftMonth] = useState(startDate.getMonth());
  const [calLeftYear, setCalLeftYear] = useState(startDate.getFullYear());
  const [tempStartDate, setTempStartDate] = useState(startDate);

  const [calRightMonth, setCalRightMonth] = useState(endDate.getMonth());
  const [calRightYear, setCalRightYear] = useState(endDate.getFullYear());
  const [tempEndDate, setTempEndDate] = useState(endDate);

  // Selected bill for left preview panel
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  // Toast / alert message
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  // Sample and live bills list
  const [bills, setBills] = useState<BillRecord[]>([
    {
      id: "bill-101",
      billNumber: "101",
      openDate: "22.12.2018 16:15",
      waiterName: "Аида",
      hallName: "Asosiy zal",
      tableNumber: "4",
      clientName: "Азиз Каримов",
      smartCard: "BP-4921",
      guestsCount: 4,
      subtotal: 420000,
      serviceCharge: 42000,
      discount: 20000,
      total: 442000,
      status: "open",
      description: "VIP mijoz",
      items: [
        { id: "i1", name: "Choynak choy (ko'k)", price: 15000, quantity: 2 },
        { id: "i2", name: "Osh (Choyxona palov)", price: 55000, quantity: 4 },
        { id: "i3", name: "Achichuk salati", price: 20000, quantity: 2 },
        { id: "i4", name: "Non (patir)", price: 12000, quantity: 2 },
        { id: "i5", name: "Kofe Americano", price: 22000, quantity: 2 }
      ]
    },
    {
      id: "bill-102",
      billNumber: "102",
      openDate: "22.12.2018 15:40",
      waiterName: "Ержан",
      hallName: "Terassa",
      tableNumber: "7",
      clientName: "Шерзод",
      smartCard: "BP-1029",
      guestsCount: 2,
      subtotal: 180000,
      serviceCharge: 18000,
      discount: 0,
      total: 198000,
      status: "open",
      description: "",
      items: [
        { id: "i6", name: "Lavash standart", price: 38000, quantity: 2 },
        { id: "i7", name: "Coca Cola 0.5L", price: 12000, quantity: 2 },
        { id: "i8", name: "Free kartoshkasi", price: 25000, quantity: 2 }
      ]
    },
    {
      id: "bill-98",
      billNumber: "98",
      openDate: "22.12.2018 13:10",
      closeDate: "22.12.2018 14:30",
      waiterName: "Ибрагим",
      hallName: "Asosiy zal",
      tableNumber: "2",
      clientName: "Дилмурод",
      smartCard: "",
      guestsCount: 3,
      subtotal: 290000,
      serviceCharge: 29000,
      discount: 0,
      total: 319000,
      status: "closed",
      paymentMethod: "Naqd",
      description: "Yopilgan hisob",
      items: [
        { id: "i9", name: "Shashlik qiyma", price: 22000, quantity: 6 },
        { id: "i10", name: "Somsa tandir", price: 16000, quantity: 4 },
        { id: "i11", name: "Moxito kokteyli", price: 30000, quantity: 2 }
      ]
    },
    {
      id: "bill-85",
      billNumber: "85",
      openDate: "21.12.2018 20:00",
      closeDate: "21.12.2018 22:45",
      waiterName: "Николай",
      hallName: "VIP xonalar",
      tableNumber: "VIP 1",
      clientName: "Рустам ака (Қарз)",
      smartCard: "BP-9002",
      guestsCount: 8,
      subtotal: 1450000,
      serviceCharge: 145000,
      discount: 50000,
      total: 1545000,
      status: "debt",
      paymentMethod: "Qarzga yozildi",
      description: "Keyingi hafta to'lanadi",
      items: [
        { id: "i12", name: "Qo'y go'shti qovurma", price: 180000, quantity: 3 },
        { id: "i13", name: "Assorti shashlik", price: 350000, quantity: 2 },
        { id: "i14", name: "Salatlar to'plami", price: 120000, quantity: 2 }
      ]
    }
  ]);

  // Fetch real orders from database
  const fetchRealOrders = async () => {
    try {
      const activeCafeId = linkedCafe?.id || "default";
      const res = await fetch("/api/orders", {
        headers: { "x-cafe-id": activeCafeId }
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: BillRecord[] = data.map((o: any) => {
          let status: "open" | "closed" | "debt" = "open";
          if (o.status === "completed" || o.status === "paid") status = "closed";
          else if (o.status === "debt" || o.paymentMethod === "debt") status = "debt";

          const itemsArr = Array.isArray(o.items) ? o.items : [];
          const subtotal = itemsArr.reduce((acc: number, it: any) => acc + (it.price * it.quantity), 0);
          const total = o.total || subtotal;

          return {
            id: o.id.toString(),
            billNumber: o.orderNumber || o.id,
            openDate: o.createdAt ? new Date(o.createdAt).toLocaleString("ru-RU") : "22.12.2018 16:00",
            closeDate: o.closedAt ? new Date(o.closedAt).toLocaleString("ru-RU") : undefined,
            waiterName: o.waiterName || "Кассир",
            hallName: o.hallName || "Asosiy zal",
            tableNumber: o.tableNumber || "1",
            clientName: o.clientName || "",
            smartCard: o.cardNumber || "",
            guestsCount: o.guestsCount || 2,
            subtotal,
            serviceCharge: o.serviceAmount || Math.round(subtotal * 0.1),
            discount: o.discountAmount || 0,
            total,
            status,
            paymentMethod: o.paymentMethod || "Naqd",
            description: o.notes || "",
            items: itemsArr
          };
        });
        setBills(mapped);
      }
    } catch (e) {
      console.warn("Using sample bills data:", e);
    }
  };

  useEffect(() => {
    fetchRealOrders();
  }, []);

  // Filter bills based on tab, date range, search query
  const filteredBills = bills.filter((b) => {
    if (b.status !== activeBillTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = b.billNumber.toString().includes(q);
      const matchWaiter = b.waiterName.toLowerCase().includes(q);
      const matchTable = b.tableNumber.toString().includes(q);
      const matchClient = (b.clientName || "").toLowerCase().includes(q);
      const matchHall = b.hallName.toLowerCase().includes(q);
      if (!matchNum && !matchWaiter && !matchTable && !matchClient && !matchHall) return false;
    }
    return true;
  });

  const selectedBill = bills.find(b => b.id === selectedBillId) || filteredBills[0] || null;

  // Format date range string: "С 22 Дек 2018 По 22 Дек 2018"
  const formatDateRangeBtn = () => {
    const sDay = startDate.getDate();
    const sMon = SHORT_MONTH_NAMES_RU[startDate.getMonth()];
    const sYr = startDate.getFullYear();

    const eDay = endDate.getDate();
    const eMon = SHORT_MONTH_NAMES_RU[endDate.getMonth()];
    const eYr = endDate.getFullYear();

    return `С ${sDay} ${sMon} ${sYr} По ${eDay} ${eMon} ${eYr}`;
  };

  // Actions
  const handlePrint = () => {
    if (!selectedBill) {
      showToast("Iltimos, avval ro'yxatdan stol/hisobni tanlang!");
      return;
    }
    showToast(`№${selectedBill.billNumber}-hisob cheki (Stol #${selectedBill.tableNumber}) chop etilmoqda...`);
    window.print();
  };

  const handleDeleteBill = () => {
    if (!selectedBill) return;
    if (window.confirm(`№${selectedBill.billNumber} рақамли ҳисобни ўчиришни тасдиқлайсизми?`)) {
      setBills(prev => prev.filter(b => b.id !== selectedBill.id));
      showToast(`№${selectedBill.billNumber} ҳисоб ўчирилди!`);
    }
  };

  // Payment Modal state matching Image 3 & 4
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payCash, setPayCash] = useState<string>("");
  const [payBankAccount, setPayBankAccount] = useState<string>("0");
  const [payBankCard, setPayBankCard] = useState<string>("0");
  const [payFree, setPayFree] = useState<string>("0");
  const [payDebt, setPayDebt] = useState<string>("0");
  const [payDescription, setPayDescription] = useState<string>("");

  const handleOpenPaymentModal = () => {
    if (!selectedBill) return;
    setPayCash(selectedBill.total.toString());
    setPayBankAccount("0");
    setPayBankCard("0");
    setPayFree("0");
    setPayDebt("0");
    setPayDescription("");
    setShowPaymentModal(true);
  };

  const handleExecutePayment = () => {
    if (!selectedBill) return;
    const isDebtOnly = Number(payDebt) > 0 && Number(payCash) === 0 && Number(payBankAccount) === 0 && Number(payBankCard) === 0;

    setBills(prev => prev.map(b => {
      if (b.id === selectedBill.id) {
        return {
          ...b,
          status: isDebtOnly ? "debt" : "closed",
          closeDate: new Date().toLocaleString("ru-RU"),
          paymentMethod: isDebtOnly ? "Qarzga yozildi" : "To'landi"
        };
      }
      return b;
    }));

    setShowPaymentModal(false);
    showToast(isDebtOnly ? `№${selectedBill.billNumber} ҳисоб қарзга ёзилди!` : `№${selectedBill.billNumber} ҳисоб муваффақиятли тўланди!`);
  };

  const handleCloseBill = () => {
    if (!selectedBill) {
      showToast("Iltimos, avval ro'yxatdan stol/hisobni tanlang!");
      return;
    }
    if (selectedBill.status === "closed") {
      showToast(`№${selectedBill.billNumber}-hisob (Stol #${selectedBill.tableNumber}) allaqachon yopilgan!`);
      return;
    }

    setBills(prev => prev.map(b => b.id === selectedBill.id ? { 
      ...b, 
      status: "closed", 
      closeDate: new Date().toLocaleString("ru-RU"),
      paymentMethod: b.paymentMethod || "Naqd"
    } : b));

    showToast(`№${selectedBill.billNumber}-hisob (Stol #${selectedBill.tableNumber}) muvaffaqiyatli yopildi!`);
  };

  const handlePayBill = () => {
    handleOpenPaymentModal();
  };

  const handlePayOffDebt = () => {
    handleOpenPaymentModal();
  };

  // Helper for generating calendar grid for given month and year
  const getDaysMatrix = (month: number, year: number) => {
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const matrix: Array<{ day: number; isCurrentMonth: boolean; dateObj: Date }> = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      matrix.push({ day: d, isCurrentMonth: false, dateObj: new Date(year, month - 1, d) });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      matrix.push({ day: d, isCurrentMonth: true, dateObj: new Date(year, month, d) });
    }

    // Next month filler days to complete 35 or 42 cells
    const remaining = (7 - (matrix.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      matrix.push({ day: d, isCurrentMonth: false, dateObj: new Date(year, month + 1, d) });
    }

    return matrix;
  };

  // Sum of all filtered bills
  const totalBillsSum = filteredBills.reduce((acc, b) => acc + b.total, 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#d0d4da] select-none font-sans text-black relative">
      {/* Toast Popup */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#25292e] text-white px-5 py-2.5 rounded-xl border border-white/20 shadow-2xl text-xs font-bold animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP BAR (MATCHING IMAGE 2)                                                */}
      {/* ========================================================================= */}
      <div className="h-12 px-3 bg-gradient-to-r from-[#bec3cb] via-[#d0d4da] to-[#bec3cb] border-b border-[#9ba1aa] flex items-center justify-between text-xs gap-2">
        {/* Left Side: 'Сегодня', Date Range Button, Filter Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Сегодня Button */}
          <button
            onClick={() => {
              const now = new Date();
              setStartDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
              setEndDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
              showToast("Бугунги кун танланди");
            }}
            className="px-3.5 py-1.5 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-bold text-xs shadow-sm active:translate-y-0.5 cursor-pointer"
          >
            Сегодня
          </button>

          {/* Date Range Button (Clicking opens Dual Calendar Modal - Image 3) */}
          <button
            onClick={() => {
              setTempStartDate(startDate);
              setTempEndDate(endDate);
              setCalLeftMonth(startDate.getMonth());
              setCalLeftYear(startDate.getFullYear());
              setCalRightMonth(endDate.getMonth());
              setCalRightYear(endDate.getFullYear());
              setShowCalendarModal(true);
            }}
            className="px-3.5 py-1.5 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-bold text-xs shadow-sm active:translate-y-0.5 cursor-pointer text-center whitespace-nowrap"
          >
            {formatDateRangeBtn()}
          </button>

          {/* Filter Tab: Открытые счета */}
          <button
            onClick={() => setActiveBillTab("open")}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              activeBillTab === "open"
                ? "bg-gradient-to-b from-[#2171c7] via-[#1559a4] to-[#0e4480] text-white border-[#0e4480] shadow-inner"
                : "bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] border-[#8f96a0] shadow-sm"
            }`}
          >
            Открытые счета
          </button>

          {/* Filter Tab: Закрытые счета */}
          <button
            onClick={() => setActiveBillTab("closed")}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              activeBillTab === "closed"
                ? "bg-gradient-to-b from-[#2171c7] via-[#1559a4] to-[#0e4480] text-white border-[#0e4480] shadow-inner"
                : "bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] border-[#8f96a0] shadow-sm"
            }`}
          >
            Закрытые счета
          </button>

          {/* Filter Tab: Погасить долг */}
          <button
            onClick={() => setActiveBillTab("debt")}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              activeBillTab === "debt"
                ? "bg-gradient-to-b from-[#2171c7] via-[#1559a4] to-[#0e4480] text-white border-[#0e4480] shadow-inner"
                : "bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] border-[#8f96a0] shadow-sm"
            }`}
          >
            Погасить долг
          </button>
        </div>

        {/* Right Side: 'Получить счет' and 'Поиск' */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRealOrders}
            className="px-3.5 py-1.5 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-bold text-xs shadow-sm active:translate-y-0.5 cursor-pointer whitespace-nowrap"
          >
            Получить счет
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-700 font-bold text-[11px]">Поиск</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder=""
              className="w-32 sm:w-44 bg-white/90 border border-gray-400 rounded px-2 py-0.5 text-xs text-black outline-none focus:border-blue-500 shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN TWO-COLUMN WORK AREA (MATCHING IMAGE 2)                               */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden p-2.5 gap-2.5">
        {/* LEFT PANEL: BILL / CLIENT DETAILS & DISHES LIST */}
        <div className="w-1/4 min-w-[220px] max-w-[280px] flex flex-col bg-[#c6cad2] rounded-xl border border-[#9ea4ad] overflow-hidden shadow-inner">
          {/* Top Info Card */}
          <div className="p-3 bg-[#e4e7eb] border-b border-[#a8afb8] text-[11px] leading-relaxed space-y-0.5">
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">Клиент:</span>
              <span className="font-bold text-gray-900 truncate max-w-[120px]">
                {selectedBill?.clientName || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">Описание:</span>
              <span className="text-gray-800 truncate max-w-[120px]">
                {selectedBill?.description || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">Стол:</span>
              <span className="font-bold text-gray-900">
                {selectedBill ? `#${selectedBill.tableNumber}` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">Гостей:</span>
              <span className="font-bold text-gray-900">
                {selectedBill?.guestsCount || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">Smart карта:</span>
              <span className="text-blue-700 font-mono font-bold">
                {selectedBill?.smartCard || "—"}
              </span>
            </div>

            <div className="pt-2 mt-1 border-t border-gray-300 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-gray-600 font-bold">Подитог:</span>
                <span className="font-bold text-gray-900">
                  {selectedBill ? `${selectedBill.subtotal.toLocaleString()} so'm` : "0"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-bold">Обслуж:</span>
                <span className="text-gray-900">
                  {selectedBill ? `${selectedBill.serviceCharge.toLocaleString()} so'm` : "0"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-bold">Скидка:</span>
                <span className="text-red-600 font-bold">
                  {selectedBill && selectedBill.discount > 0 ? `-${selectedBill.discount.toLocaleString()} so'm` : "0"}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="font-bold">Накоп.:</span>
                <span>0</span>
              </div>
            </div>
          </div>

          {/* Dishes Items Header with Scroll Arrow Buttons */}
          <div className="h-7 px-3 bg-[#d5d8de] border-b border-[#a8afb8] flex items-center justify-between text-[11px] font-bold text-gray-700">
            <span>Блюда в чеке:</span>
            <div className="flex items-center gap-1">
              <button className="w-5 h-5 rounded bg-white/80 border border-gray-400 flex items-center justify-center text-[9px] hover:bg-white cursor-pointer shadow-xs">
                ▲
              </button>
              <button className="w-5 h-5 rounded bg-white/80 border border-gray-400 flex items-center justify-center text-[9px] hover:bg-white cursor-pointer shadow-xs">
                ▼
              </button>
            </div>
          </div>

          {/* Dishes List */}
          <div className="flex-1 p-2 overflow-y-auto bg-[#e8ebf0] divide-y divide-gray-200">
            {selectedBill && selectedBill.items && selectedBill.items.length > 0 ? (
              selectedBill.items.map((item, idx) => (
                <div key={idx} className="py-1.5 text-xs flex items-center justify-between">
                  <div className="truncate max-w-[130px]">
                    <div className="font-semibold text-gray-900 truncate">{item.name}</div>
                    <div className="text-[10px] text-gray-500">
                      {item.quantity} x {item.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="font-bold text-gray-900 text-xs">
                    {(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 text-xs py-8 italic">
                {selectedBill ? "Чекда таомлар йўқ" : "Ҳисоб танланмаган"}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT MAIN TABLE PANEL: СЧЕТА (TABLE VIEW) */}
        <div className="flex-1 flex flex-col bg-[#e3e6eb] rounded-xl border border-[#9ea4ad] overflow-hidden shadow-inner">
          {/* Table Header Columns (Glossy Blue Gradient) */}
          <div className="h-8 bg-gradient-to-b from-[#a4c0e4] via-[#8bb1dc] to-[#719fd2] border-b border-[#5e8bbb] grid grid-cols-12 items-center px-3 text-xs font-bold text-[#1a2f4c] shadow-sm">
            <div className="col-span-3 flex items-center gap-1">
              <span>ДАТА ОТК / ДАТА ЗАКР.</span>
              <span className="text-[10px]">⌄</span>
            </div>
            <div className="col-span-1 text-center">№</div>
            <div className="col-span-3">ОФИЦИАНТ</div>
            <div className="col-span-2">ЗАЛ</div>
            <div className="col-span-1 text-right">СУММА БЛЮД</div>
            <div className="col-span-2 text-right">ИТОГО</div>
          </div>

          {/* Table Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-300 bg-[#e8ebf0]">
            {filteredBills.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-semibold">
                Ушбу бўлимда ҳисоблар мавжуд эмас
              </div>
            ) : (
              filteredBills.map((b) => {
                const isSelected = selectedBill?.id === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBillId(b.id)}
                    className={`grid grid-cols-12 items-center px-3 py-2 text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#c1d9f8] text-[#0d2e59] font-bold border-l-4 border-blue-600 shadow-sm"
                        : "hover:bg-white/60 text-gray-900"
                    }`}
                  >
                    <div className="col-span-3 text-[11px] leading-tight">
                      <div>{b.openDate}</div>
                      {b.closeDate && <div className="text-gray-500">{b.closeDate}</div>}
                    </div>
                    <div className="col-span-1 text-center font-bold font-mono">
                      #{b.billNumber}
                    </div>
                    <div className="col-span-3 truncate">
                      {b.waiterName}
                    </div>
                    <div className="col-span-2 truncate text-gray-700">
                      {b.hallName}
                    </div>
                    <div className="col-span-1 text-right text-gray-700">
                      {b.subtotal.toLocaleString()}
                    </div>
                    <div className="col-span-2 text-right font-bold text-[#1a2f4c]">
                      {b.total.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Table Footer: Итого */}
          <div className="h-8 px-4 bg-[#d5d9df] border-t border-[#a8afb8] flex items-center justify-between text-xs font-bold text-gray-800">
            <div>
              Итого: <span className="font-black text-[#1a2f4c] ml-1">{totalBillsSum.toLocaleString()} so'm</span>
            </div>
            <div className="text-gray-600 text-[11px]">
              Ҳисоблар сони: <b>{filteredBills.length}</b>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FOOTER BAR (MATCHING IMAGE 2)                                             */}
      {/* ========================================================================= */}
      <div className="h-14 px-4 bg-gradient-to-b from-[#d5d9de] via-[#bec4cc] to-[#a8afb8] border-t-2 border-[#828892] flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Печать чека */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-bold text-xs shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
            title="Shtol/Hisob uchun chek chiqarish"
          >
            <span>🖨️</span>
            <span>Печать чека</span>
          </button>

          {/* Удалить счет */}
          <button
            onClick={handleDeleteBill}
            className="px-4 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-bold text-xs shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
          >
            <span>🗑️</span>
            <span>Удалить счет</span>
          </button>

          {/* Закрыть счет */}
          <button
            onClick={handleCloseBill}
            className="px-4 py-2 rounded-lg border border-red-700 bg-gradient-to-b from-[#e74c3c] via-[#c0392b] to-[#a93226] text-white font-black text-xs shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer flex items-center gap-1.5 hover:brightness-110"
            title="Tanlangan stol hisobini yopish"
          >
            <span>🔒</span>
            <span>Закрыть счет</span>
          </button>

          {/* Оплатить счет / Погасить долг */}
          {activeBillTab === "debt" ? (
            <button
              onClick={handlePayOffDebt}
              className="px-5 py-2 rounded-lg border border-amber-600 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-black font-black text-xs shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer"
            >
              Погасить долг
            </button>
          ) : (
            <button
              onClick={handlePayBill}
              className="px-5 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-bold text-xs shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer"
            >
              Оплатить счет
            </button>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-5 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-bold text-xs shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer"
          >
            Назад
          </button>
          <button
            onClick={onExit}
            className="px-5 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-bold text-xs shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer"
          >
            Выход
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DUAL CALENDAR MODAL (MATCHING IMAGE 3 EXACTLY)                            */}
      {/* ========================================================================= */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="flex items-center gap-6 max-w-4xl w-full justify-center">
            {/* 1. LEFT CALENDAR: START DATE («С ...») */}
            <div className="w-[310px] bg-[#dce0e6] border-2 border-[#9ba1aa] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-3 flex flex-col space-y-2.5 text-xs text-black">
              {/* Header: Month & Year Selectors with ◀ ▶ */}
              <div className="grid grid-cols-2 gap-2">
                {/* Month Picker */}
                <div className="flex items-center justify-between bg-white border border-gray-400 rounded-lg p-1 shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      if (calLeftMonth === 0) {
                        setCalLeftMonth(11);
                        setCalLeftYear(prev => prev - 1);
                      } else {
                        setCalLeftMonth(prev => prev - 1);
                      }
                    }}
                    className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 font-bold flex items-center justify-center cursor-pointer text-xs"
                  >
                    ❮
                  </button>
                  <span className="font-bold text-gray-800 text-xs">
                    {MONTH_NAMES_RU[calLeftMonth]}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (calLeftMonth === 11) {
                        setCalLeftMonth(0);
                        setCalLeftYear(prev => prev + 1);
                      } else {
                        setCalLeftMonth(prev => prev + 1);
                      }
                    }}
                    className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 font-bold flex items-center justify-center cursor-pointer text-xs"
                  >
                    ❯
                  </button>
                </div>

                {/* Year Picker */}
                <div className="flex items-center justify-between bg-white border border-gray-400 rounded-lg p-1 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setCalLeftYear(prev => prev - 1)}
                    className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 font-bold flex items-center justify-center cursor-pointer text-xs"
                  >
                    ❮
                  </button>
                  <span className="font-bold text-gray-800 text-xs">
                    {calLeftYear}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCalLeftYear(prev => prev + 1)}
                    className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 font-bold flex items-center justify-center cursor-pointer text-xs"
                  >
                    ❯
                  </button>
                </div>
              </div>

              {/* Weekday Headers (Blue Header Bar) */}
              <div className="grid grid-cols-7 bg-[#71a6dc] border border-[#5289c0] rounded text-center py-1 text-[11px] font-bold text-[#0d2e59]">
                {WEEKDAYS_RU.map((w, i) => (
                  <span key={i}>{w}</span>
                ))}
              </div>

              {/* Days Matrix */}
              <div className="grid grid-cols-7 gap-1 bg-[#eceef1] border border-gray-300 rounded p-1.5">
                {getDaysMatrix(calLeftMonth, calLeftYear).map((cell, idx) => {
                  const isSelected =
                    tempStartDate.getDate() === cell.day &&
                    tempStartDate.getMonth() === cell.dateObj.getMonth() &&
                    tempStartDate.getFullYear() === cell.dateObj.getFullYear();

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTempStartDate(cell.dateObj)}
                      className={`h-7 rounded flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#4da1e8] text-white shadow-sm ring-2 ring-blue-600"
                          : cell.isCurrentMonth
                          ? "hover:bg-white text-gray-800"
                          : "text-gray-400 opacity-60"
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons: OK and Отмена */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStartDate(tempStartDate);
                    setEndDate(tempEndDate);
                    setShowCalendarModal(false);
                    showToast("Саналар интервали янгиланди");
                  }}
                  className="py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-sm cursor-pointer"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-sm cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            </div>

            {/* 2. RIGHT CALENDAR: END DATE («ПО ...») */}
            <div className="w-[310px] bg-[#dce0e6] border-2 border-[#9ba1aa] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-3 flex flex-col space-y-2.5 text-xs text-black">
              {/* Header: Month & Year Selectors with ◀ ▶ */}
              <div className="grid grid-cols-2 gap-2">
                {/* Month Picker */}
                <div className="flex items-center justify-between bg-white border border-gray-400 rounded-lg p-1 shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      if (calRightMonth === 0) {
                        setCalRightMonth(11);
                        setCalRightYear(prev => prev - 1);
                      } else {
                        setCalRightMonth(prev => prev - 1);
                      }
                    }}
                    className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 font-bold flex items-center justify-center cursor-pointer text-xs"
                  >
                    ❮
                  </button>
                  <span className="font-bold text-gray-800 text-xs">
                    {MONTH_NAMES_RU[calRightMonth]}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (calRightMonth === 11) {
                        setCalRightMonth(0);
                        setCalRightYear(prev => prev + 1);
                      } else {
                        setCalRightMonth(prev => prev + 1);
                      }
                    }}
                    className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 font-bold flex items-center justify-center cursor-pointer text-xs"
                  >
                    ❯
                  </button>
                </div>

                {/* Year Picker */}
                <div className="flex items-center justify-between bg-white border border-gray-400 rounded-lg p-1 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setCalRightYear(prev => prev - 1)}
                    className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 font-bold flex items-center justify-center cursor-pointer text-xs"
                  >
                    ❮
                  </button>
                  <span className="font-bold text-gray-800 text-xs">
                    {calRightYear}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCalRightYear(prev => prev + 1)}
                    className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 font-bold flex items-center justify-center cursor-pointer text-xs"
                  >
                    ❯
                  </button>
                </div>
              </div>

              {/* Weekday Headers (Blue Header Bar) */}
              <div className="grid grid-cols-7 bg-[#71a6dc] border border-[#5289c0] rounded text-center py-1 text-[11px] font-bold text-[#0d2e59]">
                {WEEKDAYS_RU.map((w, i) => (
                  <span key={i}>{w}</span>
                ))}
              </div>

              {/* Days Matrix */}
              <div className="grid grid-cols-7 gap-1 bg-[#eceef1] border border-gray-300 rounded p-1.5">
                {getDaysMatrix(calRightMonth, calRightYear).map((cell, idx) => {
                  const isSelected =
                    tempEndDate.getDate() === cell.day &&
                    tempEndDate.getMonth() === cell.dateObj.getMonth() &&
                    tempEndDate.getFullYear() === cell.dateObj.getFullYear();

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTempEndDate(cell.dateObj)}
                      className={`h-7 rounded flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#4da1e8] text-white shadow-sm ring-2 ring-blue-600"
                          : cell.isCurrentMonth
                          ? "hover:bg-white text-gray-800"
                          : "text-gray-400 opacity-60"
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons: OK and Отмена */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStartDate(tempStartDate);
                    setEndDate(tempEndDate);
                    setShowCalendarModal(false);
                    showToast("Саналар интервали янгиланди");
                  }}
                  className="py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-sm cursor-pointer"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-sm cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* PAYMENT MODAL: ОПЛАТИТЬ СЧЕТ (MATCHING IMAGE 3 & 4 EXACTLY)                */}
      {/* ========================================================================= */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 z-50 bg-[repeating-linear-gradient(45deg,#0a0b0d,#0a0b0d_10px,#14171c_10px,#14171c_20px)]/90 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#e2e5ea] border-2 border-[#9ba1aa] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-4 max-w-3xl w-full flex flex-col space-y-3 text-xs text-black font-sans">
            {/* Main 2-column layout */}
            <div className="grid grid-cols-12 gap-3 items-start">
              {/* LEFT COLUMN: BILL INFO & DISHES LIST */}
              <div className="col-span-5 flex flex-col space-y-2">
                {/* Top Bill Info Box */}
                <div className="bg-[#f0f2f5] border border-gray-400 rounded-xl p-3 text-[11px] space-y-0.5 shadow-inner">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-bold">Официант:</span>
                    <span className="font-bold text-gray-900">{selectedBill.waiterName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-bold">Стол:</span>
                    <span className="font-bold text-gray-900">#{selectedBill.tableNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-bold">Клиент:</span>
                    <span className="font-bold text-gray-900">{selectedBill.clientName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-bold">Гостей:</span>
                    <span className="font-bold text-gray-900">{selectedBill.guestsCount || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-bold">Smart карта:</span>
                    <span className="text-blue-700 font-mono font-bold">{selectedBill.smartCard || "—"}</span>
                  </div>

                  <div className="pt-2 mt-1 border-t border-gray-300 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-bold">Подитог:</span>
                      <span className="font-bold text-gray-900">{selectedBill.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-bold">Обслуж:</span>
                      <span className="text-gray-900">{selectedBill.serviceCharge.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-bold">Скидка:</span>
                      <span className="text-red-600 font-bold">{selectedBill.discount > 0 ? `-${selectedBill.discount.toLocaleString()}` : "0"}</span>
                    </div>
                  </div>

                  {/* Big Total */}
                  <div className="pt-2 mt-1 border-t border-gray-400 flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-gray-800">Итого:</span>
                    <span className="text-lg font-black text-[#0d2e59]">{selectedBill.total.toLocaleString()} so'm</span>
                  </div>
                </div>

                {/* Dishes list box */}
                <div className="bg-[#f0f2f5] border border-gray-400 rounded-xl overflow-hidden shadow-inner flex-1 max-h-56 overflow-y-auto">
                  <div className="bg-gradient-to-r from-[#e86f68] to-[#d9534f] text-white px-3 py-1 font-bold text-[11px]">
                    Счет #{selectedBill.billNumber}
                  </div>
                  <div className="p-2 divide-y divide-gray-200">
                    {selectedBill.items.map((it, i) => (
                      <div key={i} className="py-1 flex items-center justify-between text-[11px]">
                        <span className="truncate max-w-[130px] font-medium text-gray-800">{i + 1}. {it.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-bold">{it.quantity}x</span>
                          <span className="font-bold text-gray-900">{(it.price * it.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: PAYMENT METHODS & LED STATUS BULBS */}
              <div className="col-span-7 bg-[#f0f2f5] border border-gray-400 rounded-xl p-4 shadow-inner space-y-3">
                <div className="font-bold text-xs uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1.5 flex items-center justify-between">
                  <span>ТИП ОПЛАТЫ</span>
                  <div className="flex items-center gap-1">
                    <button className="w-5 h-5 rounded bg-white border border-gray-400 flex items-center justify-center text-[9px]">▲</button>
                    <button className="w-5 h-5 rounded bg-white border border-gray-400 flex items-center justify-center text-[9px]">▼</button>
                  </div>
                </div>

                {/* 5 PAYMENT TYPES WITH CIRCULAR STATUS BULBS (RED 🔴 / GREEN 🟢) */}
                <div className="space-y-2 text-xs">
                  {/* 1. Наличные */}
                  <div className="grid grid-cols-12 items-center gap-2">
                    <label className="col-span-5 font-bold text-gray-700">Наличные</label>
                    <input
                      type="number"
                      value={payCash}
                      onChange={(e) => setPayCash(e.target.value)}
                      className="col-span-6 bg-white border border-gray-400 rounded px-2.5 py-1 text-right font-bold text-gray-900 outline-none focus:border-blue-500 shadow-inner"
                    />
                    <div className="col-span-1 flex justify-center">
                      <span className={`w-4 h-4 rounded-full border border-black/20 shadow-md transition-all ${
                        Number(payCash) > 0 
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" 
                          : "bg-rose-600 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                      }`} />
                    </div>
                  </div>

                  {/* 2. Банковский счет */}
                  <div className="grid grid-cols-12 items-center gap-2">
                    <label className="col-span-5 font-bold text-gray-700">Банковский счет</label>
                    <input
                      type="number"
                      value={payBankAccount}
                      onChange={(e) => setPayBankAccount(e.target.value)}
                      className="col-span-6 bg-white border border-gray-400 rounded px-2.5 py-1 text-right font-bold text-gray-900 outline-none focus:border-blue-500 shadow-inner"
                    />
                    <div className="col-span-1 flex justify-center">
                      <span className={`w-4 h-4 rounded-full border border-black/20 shadow-md transition-all ${
                        Number(payBankAccount) > 0 
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" 
                          : "bg-rose-600 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                      }`} />
                    </div>
                  </div>

                  {/* 3. Банковская карта */}
                  <div className="grid grid-cols-12 items-center gap-2">
                    <label className="col-span-5 font-bold text-gray-700">Банковская карта</label>
                    <input
                      type="number"
                      value={payBankCard}
                      onChange={(e) => setPayBankCard(e.target.value)}
                      className="col-span-6 bg-white border border-gray-400 rounded px-2.5 py-1 text-right font-bold text-gray-900 outline-none focus:border-blue-500 shadow-inner"
                    />
                    <div className="col-span-1 flex justify-center">
                      <span className={`w-4 h-4 rounded-full border border-black/20 shadow-md transition-all ${
                        Number(payBankCard) > 0 
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" 
                          : "bg-rose-600 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                      }`} />
                    </div>
                  </div>

                  {/* 4. Без оплаты */}
                  <div className="grid grid-cols-12 items-center gap-2">
                    <label className="col-span-5 font-bold text-gray-700">Без оплаты</label>
                    <input
                      type="number"
                      value={payFree}
                      onChange={(e) => setPayFree(e.target.value)}
                      className="col-span-6 bg-white border border-gray-400 rounded px-2.5 py-1 text-right font-bold text-gray-900 outline-none focus:border-blue-500 shadow-inner"
                    />
                    <div className="col-span-1 flex justify-center">
                      <span className={`w-4 h-4 rounded-full border border-black/20 shadow-md transition-all ${
                        Number(payFree) > 0 
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" 
                          : "bg-rose-600 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                      }`} />
                    </div>
                  </div>

                  {/* 5. Долг */}
                  <div className="grid grid-cols-12 items-center gap-2">
                    <label className="col-span-5 font-bold text-gray-700">Долг</label>
                    <input
                      type="number"
                      value={payDebt}
                      onChange={(e) => setPayDebt(e.target.value)}
                      className="col-span-6 bg-white border border-gray-400 rounded px-2.5 py-1 text-right font-bold text-gray-900 outline-none focus:border-blue-500 shadow-inner"
                    />
                    <div className="col-span-1 flex justify-center">
                      <span className={`w-4 h-4 rounded-full border border-black/20 shadow-md transition-all ${
                        Number(payDebt) > 0 
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" 
                          : "bg-rose-600 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                      }`} />
                    </div>
                  </div>
                </div>

                {/* Description & Totals */}
                <div className="pt-2 border-t border-gray-300 space-y-2 text-xs">
                  <div className="grid grid-cols-12 items-center gap-2">
                    <label className="col-span-4 font-bold text-gray-700">Описание</label>
                    <input
                      type="text"
                      value={payDescription}
                      onChange={(e) => setPayDescription(e.target.value)}
                      placeholder=""
                      className="col-span-8 bg-white border border-gray-400 rounded px-2.5 py-1 text-xs outline-none focus:border-blue-500 shadow-inner"
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-gray-600">
                    <span>Накопление: <b>0 (0%)</b></span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-gray-500">Накопление</span>
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-600 border border-black/20" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center font-bold text-xs pt-1">
                    <span className="text-gray-700">Оплачено:</span>
                    <span className="font-mono text-gray-900">
                      {(
                        (Number(payCash) || 0) +
                        (Number(payBankAccount) || 0) +
                        (Number(payBankCard) || 0) +
                        (Number(payFree) || 0) +
                        (Number(payDebt) || 0)
                      ).toLocaleString()} so'm
                    </span>
                  </div>

                  <div className="flex justify-between items-center font-bold text-xs">
                    <span className="text-gray-700">Осталось оплатить:</span>
                    <span className={`font-mono ${
                      selectedBill.total - (
                        (Number(payCash) || 0) +
                        (Number(payBankAccount) || 0) +
                        (Number(payBankCard) || 0) +
                        (Number(payFree) || 0) +
                        (Number(payDebt) || 0)
                      ) > 0 ? "text-red-600 font-black" : "text-emerald-700 font-black"
                    }`}>
                      {Math.max(0, selectedBill.total - (
                        (Number(payCash) || 0) +
                        (Number(payBankAccount) || 0) +
                        (Number(payBankCard) || 0) +
                        (Number(payFree) || 0) +
                        (Number(payDebt) || 0)
                      )).toLocaleString()} so'm
                    </span>
                  </div>

                  <div className="text-[10px] text-gray-500 pt-1 flex items-center justify-between">
                    <span>Касса: <b>Касса по умолчанию</b></span>
                    <a href="#policy" onClick={(e) => { e.preventDefault(); alert("Накопления политикаси: Standart 3% cashback"); }} className="text-blue-700 underline font-bold uppercase">
                      ПОЛИТИКА НАКОПЛЕНИЯ
                    </a>
                  </div>
                </div>

                {/* Action Buttons: Оплатить and Отмена */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={handleExecutePayment}
                    className="px-6 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-md cursor-pointer"
                  >
                    Оплатить
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-6 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-md cursor-pointer"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
