import React, { useState, useEffect } from "react";
import { useOrder } from "../../context/OrderContext";
import { WaiterOrderTakingView } from "./WaiterOrderTakingView";
import { InposLogo } from "../common/InposLogo";

interface WaiterLayoutProps {
  onLogout: () => void;
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

export const WaiterLayout: React.FC<WaiterLayoutProps> = ({ onLogout }) => {
  const { waiter, tables, selectTable, linkedCafe } = useOrder();

  const [time, setTime] = useState(new Date());
  const [halls, setHalls] = useState<Array<{ id: string; name: string; servicePercent?: number; status?: string }>>([
    { id: "h-1", name: "Asosiy zal", servicePercent: 10, status: "active" },
    { id: "h-2", name: "Terassa", servicePercent: 10, status: "active" },
    { id: "h-3", name: "VIP xonalar", servicePercent: 15, status: "active" }
  ]);
  const [selectedHall, setSelectedHall] = useState<string>("Asosiy zal");
  const [viewMode, setViewMode] = useState<"tables" | "closed_bills" | "take_order">("tables");
  const [rightPanelFilter, setRightPanelFilter] = useState<"by_bills" | "by_name">("by_bills");

  // Selected Table & Guest Count Modal state (Image 1)
  const [selectedTableObj, setSelectedTableObj] = useState<{ id: string; number: number } | null>(null);
  const [showGuestModal, setShowGuestModal] = useState<boolean>(false);
  const [guestCountInput, setGuestCountInput] = useState<string>("4");

  // Saved Orders state for active tables
  const [savedOrdersRecord, setSavedOrdersRecord] = useState<Record<string, {
    tableNumber: number;
    guestsCount: number;
    items: Array<{ id: string; name: string; price: number; quantity: number; subNote?: string }>;
    total: number;
    savedAt: string;
  }>>({});

  // Closed Bills list
  const [closedBillsList, setClosedBillsList] = useState<Array<{
    id: string;
    tableNumber: number;
    guestsCount: number;
    items: Array<{ id: string; name: string; price: number; quantity: number; subNote?: string }>;
    total: number;
    closedAt: string;
    waiterName: string;
  }>>([]);

  // Clock tick & Halls fetch
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchHalls = async () => {
      const cafeId = linkedCafe?.id || waiter?.cafeId || "default";
      try {
        const res = await fetch("/api/halls", { headers: { "x-cafe-id": cafeId } });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setHalls(data);
            localStorage.setItem("inpos_halls", JSON.stringify(data));
            if (!data.some((h: any) => h.name === selectedHall)) {
              setSelectedHall(data[0].name);
            }
            return;
          }
        }
      } catch (e) {
        console.warn("Using offline cached halls:", e);
      }
      try {
        const cached = JSON.parse(localStorage.getItem("inpos_halls") || "[]");
        if (cached.length > 0) {
          setHalls(cached);
          if (!cached.some((h: any) => h.name === selectedHall)) {
            setSelectedHall(cached[0].name);
          }
        }
      } catch (e) {}
    };
    fetchHalls();
    const interval = setInterval(fetchHalls, 5000);
    return () => clearInterval(interval);
  }, [linkedCafe?.id, waiter?.cafeId]);

  // Filter tables by selected hall name
  const filteredTables = tables.filter(t => {
    const hallName = (t as any).hall || halls[0]?.name || "Asosiy zal";
    return hallName === selectedHall;
  });

  // Step 1: Click table -> Open Guest Count Numpad Modal (Image 1)
  const handleTableClick = (t: { id: string; number: number }) => {
    setSelectedTableObj(t);
    selectTable(t.id);
    const existing = savedOrdersRecord[t.number.toString()];
    if (existing) {
      setGuestCountInput(existing.guestsCount.toString());
      setViewMode("take_order");
    } else {
      setGuestCountInput("4");
      setShowGuestModal(true);
    }
  };

  // Step 2: Confirm Guest Count -> Open Order Taking View (Image 2 & 3)
  const handleConfirmGuests = () => {
    setShowGuestModal(false);
    setViewMode("take_order");
  };

  const handleSaveOrderData = (savedData: {
    tableNumber: string | number;
    guestsCount: number;
    items: Array<{ id: string; name: string; price: number; quantity: number; subNote?: string }>;
    total: number;
  }) => {
    const tableKey = savedData.tableNumber.toString();
    setSavedOrdersRecord(prev => ({
      ...prev,
      [tableKey]: {
        tableNumber: Number(savedData.tableNumber),
        guestsCount: savedData.guestsCount,
        items: savedData.items,
        total: savedData.total,
        savedAt: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
      }
    }));
    setViewMode("tables");
  };

  // Close bill and free the table!
  const handleCloseBillData = (tableNumber: string | number) => {
    const tableKey = tableNumber.toString();
    const existing = savedOrdersRecord[tableKey];

    setClosedBillsList(prev => [
      {
        id: Date.now().toString(),
        tableNumber: Number(tableNumber),
        guestsCount: existing ? existing.guestsCount : 1,
        items: existing ? existing.items : [],
        total: existing ? existing.total : 0,
        closedAt: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        waiterName: waiter?.name || "Ибрагим"
      },
      ...prev
    ]);

    setSavedOrdersRecord(prev => {
      const copy = { ...prev };
      delete copy[tableKey];
      return copy;
    });

    setViewMode("tables");
  };

  const handleNumpadPress = (val: string) => {
    if (val === "clear") {
      setGuestCountInput(prev => (prev.length > 1 ? prev.slice(0, -1) : ""));
    } else {
      setGuestCountInput(prev => (prev === "0" ? val : prev + val));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen w-screen bg-[#d0d4da] select-none font-sans text-black relative overflow-hidden">
      {/* ========================================================================= */}
      {/* TOP HEADER BAR (MATCHING WAITER SCREENSHOT EXACTLY)                        */}
      {/* ========================================================================= */}
      <header className="h-16 px-4 bg-gradient-to-b from-[#d5d9de] via-[#bec4cc] to-[#a8afb8] border-b-2 border-[#828892] flex items-center justify-between shadow-md z-30 shrink-0">
        {/* Left: Waiter Name, Date, Time */}
        <div className="flex flex-col text-[11px] leading-tight text-[#1e2329]">
          <div className="font-black text-xs text-[#11161d]">
            Официант: {waiter?.name || "Ибрагим"}
          </div>
          <div className="text-[10px] text-gray-700 font-semibold">
            {formatJowiDate(time)}
          </div>
          <div className="text-xs font-mono font-black text-[#11161d]">
            {time.toLocaleTimeString("ru-RU")}
          </div>
        </div>

        {/* Center Top Action Buttons: Новый счет & Закрытые счета */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const firstT = tables[0] || { id: "1", number: 1 };
              handleTableClick({ id: firstT.id, number: firstT.number });
            }}
            className="px-5 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer"
          >
            Новый счет
          </button>

          <button
            onClick={() => setViewMode(viewMode === "closed_bills" ? "tables" : "closed_bills")}
            className={`px-5 py-2 rounded-lg border text-xs font-black transition-all cursor-pointer ${
              viewMode === "closed_bills"
                ? "bg-gradient-to-b from-[#2171c7] via-[#1559a4] to-[#0e4480] text-white border-[#0e4480] shadow-inner"
                : "bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] border-[#8f96a0] shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)]"
            }`}
          >
            Закрытые счета
          </button>
        </div>

        {/* Brand Inpos Logo */}
        <div className="w-32 flex justify-end items-center">
          <InposLogo className="h-6 w-auto" variant="navy" />
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA                                                         */}
      {/* ========================================================================= */}
      {viewMode === "take_order" ? (
        <WaiterOrderTakingView
          tableNumber={selectedTableObj?.number || 1}
          hallName={selectedHall}
          guestsCount={Number(guestCountInput) || 1}
          initialItems={selectedTableObj ? savedOrdersRecord[selectedTableObj.number.toString()]?.items : undefined}
          onSaveOrder={handleSaveOrderData}
          onCloseBill={handleCloseBillData}
          onCancel={() => setViewMode("tables")}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden p-2.5 gap-2.5">
          {/* 1. LEFT PANEL: ЗАЛЫ */}
          <div className="w-1/5 min-w-[180px] max-w-[240px] flex flex-col bg-[#c2c6cd] rounded-xl border border-[#9ea4ad] overflow-hidden shadow-inner">
            {/* Table Header Tab */}
            <div className="h-8 px-4 bg-gradient-to-b from-[#a4c0e4] via-[#8bb1dc] to-[#719fd2] border-b border-[#5e8bbb] flex items-center shadow-sm">
              <span className="text-xs font-bold text-[#1a2f4c] uppercase tracking-wider">
                ЗАЛЫ
              </span>
            </div>

            {/* Hall Buttons List */}
            <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
              {halls.map((hallObj) => {
                const hallName = hallObj.name;
                const isSelected = selectedHall === hallName;
                return (
                  <button
                    key={hallObj.id || hallName}
                    onClick={() => {
                      setSelectedHall(hallName);
                      setViewMode("tables");
                    }}
                    className={`w-full py-2.5 px-4 rounded-lg text-center text-xs font-bold transition-all border shadow-sm cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-b from-[#b8d4f7] via-[#9ec6f5] to-[#7db0ef] border-[#4a8cd4] text-[#0d2e59] shadow-inner"
                        : "bg-gradient-to-b from-[#f3f4f6] via-[#e2e5e9] to-[#ccd1d8] hover:from-white hover:to-[#dce0e6] text-[#2c3238] border-[#a2a8b2]"
                    }`}
                  >
                    {hallName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. CENTER PANEL: ОТКРЫТЫЕ СЧЕТА / TABLES */}
          <div className="flex-1 flex flex-col bg-[#e3e6eb] rounded-xl border border-[#9ea4ad] overflow-hidden shadow-inner">
            {/* Header Tab */}
            <div className="h-8 px-4 bg-gradient-to-b from-[#a4c0e4] via-[#8bb1dc] to-[#719fd2] border-b border-[#5e8bbb] flex items-center justify-between shadow-sm">
              <span className="text-xs font-bold text-[#1a2f4c] uppercase tracking-wider">
                {viewMode === "closed_bills" ? "ЗАКРЫТЫЕ СЧЕТА" : "ОТКРЫТЫЕ СЧЕТА"}
              </span>
              <span className="text-[11px] font-bold text-[#1a2f4c]">
                {selectedHall}
              </span>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-[#e8ebf0]">
              {viewMode === "closed_bills" ? (
                closedBillsList.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500 font-bold text-xs">
                    Ушбу сменада ёпилган чеклар рўйхати бўш
                  </div>
                ) : (
                  <div className="space-y-2">
                    {closedBillsList.map((bill, index) => (
                      <div key={bill.id || index} className="p-3 bg-white border border-gray-300 rounded-xl shadow-xs flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-gray-900">
                            Stol #{bill.tableNumber} | <span className="text-emerald-700">Ёпилган (Shot yopildi)</span>
                          </div>
                          <div className="text-[11px] text-gray-500">
                            Ofitsiant: {bill.waiterName} | Mehmonlar: {bill.guestsCount} | Yopilgan vaqti: {bill.closedAt}
                          </div>
                          <div className="text-[11px] text-gray-600 mt-0.5">
                            Taomlar soni: {bill.items.reduce((a, b) => a + b.quantity, 0)} ta
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-gray-500">Jami to'landi:</div>
                          <div className="text-sm font-black text-blue-900 font-mono">
                            {bill.total.toLocaleString()} so'm
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredTables.map((t) => {
                    const savedOrder = savedOrdersRecord[t.number.toString()];
                    const isOccupied = t.status === "occupied" || Boolean(savedOrder);
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleTableClick({ id: t.id, number: t.number })}
                        className={`h-28 rounded-xl border p-3 flex flex-col justify-between text-left transition-all cursor-pointer shadow-sm relative overflow-hidden ${
                          isOccupied
                            ? "bg-gradient-to-b from-[#f8d7da] to-[#f5c6cb] border-red-400 text-red-950 font-bold shadow-md"
                            : "bg-gradient-to-b from-[#f8f9fa] via-[#e9ecef] to-[#dee2e6] border-gray-400 hover:from-white text-gray-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black">#{t.number}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isOccupied ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
                          }`}>
                            {isOccupied ? "Банд" : "Бўш"}
                          </span>
                        </div>

                        <div className="text-xs">
                          {isOccupied ? (
                            <div>
                              <div className="font-bold truncate">{t.activeWaiterName || waiter?.name || "Ибрагим"}</div>
                              <div className="text-[10px] text-red-700 font-black">
                                {savedOrder ? `${savedOrder.total.toLocaleString()} so'm` : "Очиқ ҳисоб"}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-500 text-[11px]">Бўш стол</div>
                          )}
                        </div>

                        <div className="text-[10px] text-gray-500 border-t border-gray-300/80 pt-1 flex justify-between">
                          <span>{savedOrder ? `${savedOrder.guestsCount} меҳмон` : `${t.seats || 4} кишилик`}</span>
                          {savedOrder && <span className="text-[9px] font-mono">{savedOrder.savedAt}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 3. RIGHT PANEL: FILTER & DISHES LIST */}
          <div className="w-1/4 min-w-[220px] max-w-[280px] flex flex-col bg-[#c2c6cd] rounded-xl border border-[#9ea4ad] overflow-hidden shadow-inner">
            {/* Filter Buttons Top: 'По счетам' | 'По названию' */}
            <div className="p-2 bg-[#d5d8de] border-b border-[#a8afb8] flex items-center justify-between gap-1.5">
              <button
                onClick={() => setRightPanelFilter("by_bills")}
                className={`flex-1 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                  rightPanelFilter === "by_bills"
                    ? "bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] border-[#8f96a0] text-black shadow-inner"
                    : "bg-gray-200 border-gray-300 text-gray-600 hover:bg-gray-300"
                }`}
              >
                По счетам
              </button>
              <button
                onClick={() => setRightPanelFilter("by_name")}
                className={`flex-1 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                  rightPanelFilter === "by_name"
                    ? "bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] border-[#8f96a0] text-black shadow-inner"
                    : "bg-gray-200 border-gray-300 text-gray-600 hover:bg-gray-300"
                }`}
              >
                По названию
              </button>
            </div>

            {/* Table Header Columns: Sort arrows, Блюдо, Счет */}
            <div className="h-7 px-3 bg-gradient-to-b from-[#a4c0e4] via-[#8bb1dc] to-[#719fd2] border-b border-[#5e8bbb] flex items-center justify-between text-[11px] font-bold text-[#1a2f4c] shadow-sm">
              <div className="flex items-center gap-1">
                <span className="text-emerald-700 font-black">⬆</span>
                <span className="text-red-700 font-black">⬇</span>
              </div>
              <span>Блюдо</span>
              <span>Счет</span>
            </div>

            {/* Dishes Content List */}
            <div className="flex-1 p-2 bg-[#e8ebf0] overflow-y-auto divide-y divide-gray-300 text-xs font-sans">
              {Object.keys(savedOrdersRecord).length === 0 ? (
                <div className="py-4 text-center text-gray-400 text-xs italic">
                  Буюртмалар рўйхати бўш
                </div>
              ) : (
                Object.values(savedOrdersRecord).map((so: any, i: number) => (
                  <div key={i} className="py-2 space-y-1">
                    <div className="flex justify-between font-black text-gray-900 border-b border-gray-300 pb-0.5">
                      <span>Стол #{so.tableNumber}</span>
                      <span className="text-blue-800">{so.total.toLocaleString()} so'm</span>
                    </div>
                    {so.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-[11px] text-gray-700">
                        <span className="truncate max-w-[140px] font-medium">{it.name}</span>
                        <div className="flex gap-2">
                          <span className="font-bold">x{it.quantity}</span>
                          <span className="font-semibold text-gray-900">{(it.price * it.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FOOTER BAR (MATCHING WAITER SCREENSHOT EXACTLY)                           */}
      {/* ========================================================================= */}
      {viewMode !== "take_order" && (
        <footer className="h-14 px-4 bg-gradient-to-b from-[#d5d9de] via-[#bec4cc] to-[#a8afb8] border-t-2 border-[#828892] flex items-center justify-end shadow-md shrink-0 z-30">
          <button
            onClick={onLogout}
            className="px-6 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer"
          >
            Выход
          </button>
        </footer>
      )}

      {/* ========================================================================= */}
      {/* GUEST COUNT NUMPAD MODAL (MATCHING IMAGE 1 EXACTLY)                       */}
      {/* ========================================================================= */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 bg-[repeating-linear-gradient(45deg,#0a0b0d,#0a0b0d_10px,#14171c_10px,#14171c_20px)]/90 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#e2e5ea] border-2 border-[#9ba1aa] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] p-5 max-w-sm w-full flex flex-col items-center space-y-3 text-xs text-black font-sans">
            {/* Header Title */}
            <div className="font-bold text-xs text-gray-800 text-center">
              Пожалуйста, введите кол-во гостей
            </div>

            {/* Display Input Box */}
            <div className="w-full bg-[#3e454d] border border-gray-600 rounded-lg p-2.5 text-center text-xl font-bold font-mono text-white shadow-inner min-h-[44px]">
              {guestCountInput || "0"}
            </div>

            {/* On-screen Keypad Grid */}
            <div className="w-full grid grid-cols-3 gap-2 pt-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumpadPress(num)}
                  className="py-2.5 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#11161d] font-black text-sm shadow-sm active:translate-y-0.5 cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleNumpadPress("0")}
                className="py-2.5 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#11161d] font-black text-sm shadow-sm active:translate-y-0.5 cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleNumpadPress("clear")}
                className="col-span-2 py-2.5 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#11161d] font-bold text-xs shadow-sm active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1"
              >
                <span>← Стереть</span>
              </button>
            </div>

            {/* Action Buttons: OK and Отмена */}
            <div className="w-full grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmGuests}
                className="py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-sm cursor-pointer"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setShowGuestModal(false)}
                className="py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-sm cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
