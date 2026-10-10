import React, { useState, useEffect } from "react";
import { useOrder } from "../../context/OrderContext";
import { Trash2, Plus, Minus } from "lucide-react";

interface DishItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  isDark?: boolean;
}

interface WaiterOrderTakingViewProps {
  tableNumber: string | number;
  hallName: string;
  guestsCount: number;
  initialItems?: Array<{ id: string; name: string; price: number; quantity: number; subNote?: string }>;
  onSaveOrder: (savedData: {
    tableNumber: string | number;
    guestsCount: number;
    items: Array<{ id: string; name: string; price: number; quantity: number; subNote?: string }>;
    total: number;
  }) => void;
  onCloseBill?: (tableNumber: string | number) => void;
  onCancel: () => void;
}

export const WaiterOrderTakingView: React.FC<WaiterOrderTakingViewProps> = ({
  tableNumber,
  hallName,
  guestsCount,
  initialItems,
  onSaveOrder,
  onCloseBill,
  onCancel
}) => {
  const { waiter, linkedCafe, printPrecheckBill } = useOrder();

  const [dishes, setDishes] = useState<DishItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["Barchasi"]);
  const [activeCategory, setActiveCategory] = useState<string>("Barchasi");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Cart State for current order
  const [cartItems, setCartItems] = useState<Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    subNote?: string;
  }>>(initialItems && initialItems.length > 0 ? initialItems : []);

  const activeCafeId = waiter?.cafeId || linkedCafe?.id || "default";

  // Fetch real dishes added from Admin Panel
  useEffect(() => {
    const fetchDishesAndCats = async () => {
      setIsLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/products", { headers: { "x-cafe-id": activeCafeId } }),
          fetch("/api/categories", { headers: { "x-cafe-id": activeCafeId } })
        ]);
        
        const prods = await prodRes.json();
        const cats = await catRes.json();

        if (Array.isArray(prods)) {
          const mappedProds: DishItem[] = prods.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.price) || 0,
            category: p.category || "General",
            image: p.image
          }));
          setDishes(mappedProds);

          // Extract unique categories from backend
          const catNames: string[] = ["Barchasi"];
          if (Array.isArray(cats) && cats.length > 0) {
            cats.forEach(c => {
              if (c.name && !catNames.includes(c.name)) catNames.push(c.name);
            });
          }
          mappedProds.forEach(p => {
            if (p.category && !catNames.includes(p.category)) catNames.push(p.category);
          });
          setCategories(catNames);
        }
      } catch (err) {
        console.error("Failed to fetch products in Waiter view:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDishesAndCats();
  }, [activeCafeId]);

  // Filtered dishes
  const filteredDishes = dishes.filter((dish) => {
    if (searchQuery.trim()) {
      return dish.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (activeCategory === "Barchasi") return true;
    return dish.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const handleAddDish = (dish: DishItem) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === dish.id);
      if (existing) {
        return prev.map(item =>
          item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: dish.id, name: dish.name, price: dish.price, quantity: 1 }];
    });
  };

  const handleIncrease = (itemId: string) => {
    setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item));
  };

  const handleDecrease = (itemId: string) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleRemove = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Modal states for Prechek & Payment (Zakrit Shot)
  const [showPrecheckModal, setShowPrecheckModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "uzcard" | "humo">("cash");

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const serviceCharge = Math.round(subtotal * 0.1);
  const total = subtotal + serviceCharge;

  // Helper to categorize bar vs kitchen
  const isBarItem = (name: string) => {
    const n = name.toLowerCase();
    return n.includes("ichimlik") || n.includes("sok") || n.includes("cola") || n.includes("pepsi") || 
           n.includes("fanta") || n.includes("sprite") || n.includes("suv") || n.includes("choy") || 
           n.includes("kofe") || n.includes("коктейль") || n.includes("пиво") || n.includes("bar") ||
           n.includes("flesh") || n.includes("redbull") || n.includes("mojito");
  };

  // 1. SAQLASH / ЗАКАЗАТЬ: Department ticket printing
  const handleSaveOrder = () => {
    if (cartItems.length === 0) {
      alert("Taomlar tanlanmagan!");
      return;
    }

    const barList = cartItems.filter(i => isBarItem(i.name));
    const kitchenList = cartItems.filter(i => !isBarItem(i.name));

    let msg = "✅ BUYURTMA SAQLANDI VA BO'LIM PRINTERLARIGA YUBORILDI!\n\n";

    if (kitchenList.length > 0) {
      msg += `🍳 OSHXONA PRINTERI: ${kitchenList.length} ta taom cheki chop etilmoqda...\n`;
    }
    if (barList.length > 0) {
      msg += `🍹 BAR PRINTERI: ${barList.length} ta ichimlik cheki chop etilmoqda...\n`;
    }

    alert(msg);

    onSaveOrder({
      tableNumber,
      guestsCount,
      items: cartItems,
      total
    });
  };

  // 2. PRECHEK: Preliminary bill for customer review
  const handleOpenPrecheck = () => {
    if (cartItems.length === 0) {
      alert("Taomlar tanlanmagan!");
      return;
    }
    setShowPrecheckModal(true);
  };

  const handlePrintPrecheckBill = () => {
    alert(`📄 №${tableNumber}-stol uchun PRECHEK mijozga berish uchun chop etildi!`);
    window.print();
    setShowPrecheckModal(false);
  };

  // 3. ЗАКРЫТЬ СЧЕТ / КАССА ЧЕКИ: Finalize payment & Close account
  const handleOpenPayment = () => {
    if (cartItems.length === 0) {
      alert("Taomlar tanlanmagan!");
      return;
    }
    setShowPaymentModal(true);
  };

  const handleConfirmPaymentAndCloseBill = () => {
    const payMethodName = 
      paymentMethod === "cash" ? "NAQD PUL" :
      paymentMethod === "card" ? "PLASTIK KARTA" :
      paymentMethod === "uzcard" ? "UZCARD" : "HUMO";

    alert(`🧾 №${tableNumber}-STOL BO'YICHA ${payMethodName} ORQALI TЎLOV QABUL QILINDI!\n\nKassa cheki chop etilmoqda va SHOT YOPILDI!`);
    window.print();

    setShowPaymentModal(false);
    if (onCloseBill) {
      onCloseBill(tableNumber);
    } else {
      onSaveOrder({
        tableNumber,
        guestsCount,
        items: cartItems,
        total
      });
    }
    onCancel();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#d0d4da] text-black select-none font-sans overflow-hidden">
      {/* ========================================================================= */}
      {/* TOP BAR: SEARCH AND CATEGORY NAVIGATION TABS                             */}
      {/* ========================================================================= */}
      <div className="h-12 px-2 bg-gradient-to-b from-[#bec3cb] via-[#d0d4da] to-[#bec3cb] border-b border-[#9ba1aa] flex items-center justify-between gap-2 shrink-0">
        {/* Left: Search input */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-400 rounded-lg px-2.5 py-1 w-52 shadow-inner">
          <span className="text-gray-500 font-bold text-xs">🔍</span>
          <input
            type="text"
            placeholder="Qidiruv..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold bg-transparent outline-none text-gray-800"
          />
        </div>

        {/* Scroll Category Left Button */}
        <button
          onClick={() => {
            const idx = categories.indexOf(activeCategory);
            if (idx > 0) setActiveCategory(categories[idx - 1]);
          }}
          className="w-8 h-8 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] to-[#b8bec7] font-black text-xs flex items-center justify-center cursor-pointer shadow-sm hover:from-white"
        >
          ❮
        </button>

        {/* Category Tabs */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setSearchQuery("");
                }}
                className={`px-4 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-b from-[#f2f4f6] via-[#e2e5e9] to-[#ccd1d8] border-[#8f96a0] text-black shadow-inner ring-1 ring-gray-400"
                    : "bg-gradient-to-b from-[#e3e6eb] to-[#c2c6cd] border-gray-400 text-gray-700 hover:bg-white"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Scroll Category Right Button */}
        <button
          onClick={() => {
            const idx = categories.indexOf(activeCategory);
            if (idx < categories.length - 1) setActiveCategory(categories[idx + 1]);
          }}
          className="w-8 h-8 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] to-[#b8bec7] font-black text-xs flex items-center justify-center cursor-pointer shadow-sm hover:from-white"
        >
          ❯
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MAIN WORK AREA: LEFT SIDEBAR CART + RIGHT DISHES GRID                      */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden p-2 gap-2">
        {/* LEFT COLUMN: ORDER INFO CARD & BILL ITEMS LIST */}
        <div className="w-[300px] sm:w-[340px] flex flex-col bg-[#c2c6cd] border border-[#9ea4ad] rounded-xl overflow-hidden shadow-inner shrink-0">
          {/* Top Info Box */}
          <div className="bg-[#f0f2f5] border-b border-gray-400 p-2 text-[11px] space-y-0.5 shadow-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">Ofitsiant:</span>
              <span className="font-bold text-gray-900">{waiter?.name || "Xodim"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">Stol:</span>
              <span className="font-bold text-gray-900">{hallName} #{tableNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-bold">Mehmonlar:</span>
              <span className="font-bold text-gray-900">{guestsCount} kishi</span>
            </div>

            <div className="pt-1.5 mt-1 border-t border-gray-300 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-gray-600 font-bold">Oraliq hisob:</span>
                <span className="font-bold text-gray-900">{subtotal.toLocaleString()} so'm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-bold">Xizmat (10%):</span>
                <span className="text-gray-900 font-bold">{serviceCharge.toLocaleString()} so'm</span>
              </div>
            </div>

            {/* Big Total */}
            <div className="pt-1.5 mt-1 border-t border-gray-400 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-gray-700">Jami:</span>
              <span className="text-lg font-black text-[#0d2e59]">{total.toLocaleString()} so'm</span>
            </div>
          </div>

          {/* Cart Header */}
          <div className="bg-gradient-to-r from-[#e86f68] to-[#d9534f] text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
            <span>Tanlangan taomlar ({cartItems.length})</span>
            {cartItems.length > 0 && (
              <button 
                onClick={() => setCartItems([])}
                className="text-[10px] bg-black/20 hover:bg-black/40 px-2 py-0.5 rounded font-normal transition-all"
              >
                Tozalash
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 bg-[#e8ebf0] p-2 overflow-y-auto divide-y divide-gray-300">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs font-bold p-4 text-center">
                <span>Taomlar tanlanmagan</span>
                <span className="text-[10px] font-normal text-gray-400 mt-1">O'ng tomondan taomni bosing</span>
              </div>
            ) : (
              cartItems.map((item, idx) => (
                <div key={item.id || idx} className="py-2 text-xs flex flex-col space-y-1">
                  <div className="flex items-center justify-between font-bold text-gray-900">
                    <span className="truncate max-w-[160px]">{idx + 1}. {item.name}</span>
                    <span className="font-mono text-[#0d2e59]">{(item.price * item.quantity).toLocaleString()} so'm</span>
                  </div>

                  {/* Quantity increase (+), decrease (-), and Delete buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 bg-white border border-gray-400 rounded-md p-0.5 shadow-xs">
                      <button
                        onClick={() => handleDecrease(item.id)}
                        className="w-6 h-6 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-bold flex items-center justify-center cursor-pointer text-xs"
                        title="Sonini kamaytirish"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-2 font-bold font-mono text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => handleIncrease(item.id)}
                        className="w-6 h-6 bg-[#E74C3C] hover:bg-red-600 text-white rounded font-bold flex items-center justify-center cursor-pointer text-xs"
                        title="Sonini ko'paytirish"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      className="flex items-center gap-1 text-red-600 hover:bg-red-100 border border-red-300 px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors"
                      title="Kerak bo'lmasa o'chirish"
                    >
                      <Trash2 size={12} />
                      <span>O'chirish</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Left Footer Buttons: Заказать, Prechek va Закрыть счет (Yagona POS stilida, rang-barang emas) */}
          <div className="p-2 bg-[#c2c6cd] border-t border-gray-400 flex flex-col gap-1.5 shrink-0">
            {/* Top row: Заказать */}
            <button
              onClick={handleSaveOrder}
              className="w-full py-2.5 px-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#1c232b] font-black text-xs shadow-[0_2px_4px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider"
              title="Buyurtmani saqlash va bo'lim printerlariga (Oshxona/Bar) yuborish"
            >
              <span>🛒</span>
              <span>Заказать</span>
            </button>

            {/* Middle row: Prechek & Закрыть счет (ALOHIDA YONMA-YON, BIR XIL STILDA) */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleOpenPrecheck}
                className="py-2.5 px-1.5 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#1c232b] font-black text-[11px] shadow-[0_2px_4px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1 uppercase tracking-tight"
                title="Mijozga oldindan hisob-kitob (prechek) chiqarib berish"
              >
                <span>📄</span>
                <span>Пречек</span>
              </button>

              <button
                onClick={handleOpenPayment}
                className="py-2.5 px-1.5 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#1c232b] font-black text-[11px] shadow-[0_2px_4px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1 uppercase tracking-tight"
                title="To'lovni qabul qilish va hisobni yopish"
              >
                <span>💳</span>
                <span>Закрыть счет</span>
              </button>
            </div>

            <button
              onClick={onCancel}
              className="w-full py-1.5 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#e3e6eb] to-[#c2c6cd] hover:from-white hover:to-[#d6dade] text-[#2c3238] font-bold text-xs shadow-xs cursor-pointer text-center"
            >
              Yopish (Orqaga)
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: DISHES GRID (FETCHED FROM ADMIN API) */}
        <div className="flex-1 flex flex-col bg-[#e3e6eb] border border-[#9ea4ad] rounded-xl overflow-hidden shadow-inner">
          {/* Top Bar above grid */}
          <div className="h-8 px-3 bg-gradient-to-b from-[#d5d8de] to-[#bec3cb] border-b border-[#a8afb8] flex items-center justify-between text-xs font-bold text-gray-800 shrink-0">
            <span className="uppercase tracking-wider">{activeCategory} ({filteredDishes.length} ta taom)</span>
            <span className="text-[11px] text-gray-600 font-normal">Admindan qo'shilgan taomlar ro'yxati</span>
          </div>

          {/* Dishes Grid */}
          <div className="flex-1 p-2.5 overflow-y-auto bg-[#e8ebf0]">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-gray-500 font-bold text-sm">
                Taomlar yuklanmoqda...
              </div>
            ) : filteredDishes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 font-bold text-sm p-6 text-center">
                <span>Ushbu bo'limda taomlar mavjud emas</span>
                <span className="text-xs font-normal text-gray-400 mt-1">Admin panelidan taom qo'shing</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {filteredDishes.map((dish) => (
                  <button
                    key={dish.id}
                    onClick={() => handleAddDish(dish)}
                    className="min-h-[70px] rounded-lg p-2.5 flex flex-col justify-between text-left transition-all cursor-pointer shadow-sm relative border active:scale-95 bg-gradient-to-b from-[#7ec855] via-[#5da835] to-[#478f24] border-[#38731b] text-white hover:from-[#8bd761] hover:to-[#509c2a]"
                  >
                    <span className="text-[11px] font-bold leading-tight line-clamp-2 drop-shadow-xs">
                      {dish.name}
                    </span>
                    <span className="text-[11px] font-black self-end tracking-wider drop-shadow-xs font-mono mt-2">
                      {dish.price.toLocaleString()} so'm
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM FOOTER BAR                                                         */}
      {/* ========================================================================= */}
      <div className="h-14 px-4 bg-gradient-to-b from-[#d5d9de] via-[#bec4cc] to-[#a8afb8] border-t-2 border-[#828892] flex items-center justify-between shadow-md shrink-0">
        <button
          onClick={onCancel}
          className="px-5 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-sm cursor-pointer"
        >
          Asosiy menyu
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveOrder}
            className="px-4 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#1c232b] font-black text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <span>🛒</span>
            <span>Заказать</span>
          </button>
          
          <button
            onClick={handleOpenPrecheck}
            className="px-4 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#1c232b] font-black text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <span>📄</span>
            <span>Пречек</span>
          </button>

          <button
            onClick={handleOpenPayment}
            className="px-4 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#1c232b] font-black text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <span>💳</span>
            <span>Закрыть счет</span>
          </button>

          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-[#8f96a0] bg-gradient-to-b from-[#f2f4f6] via-[#d6dade] to-[#b8bec7] hover:from-white hover:to-[#c6ccd6] text-[#2c3238] font-black text-xs shadow-sm cursor-pointer"
          >
            Orqaga
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRECHEK MODAL                                                             */}
      {/* ========================================================================= */}
      {showPrecheckModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gray-600 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col text-black font-sans">
            <div className="bg-[#1e293b] text-white px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-2">
                <span>📄</span>
                <span>Mijoz uchun Prechek (Oldindan hisob)</span>
              </span>
              <button 
                onClick={() => setShowPrecheckModal(false)}
                className="text-gray-400 hover:text-white font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto text-xs">
              <div className="text-center space-y-1 border-b border-gray-300 pb-2">
                <div className="font-black text-sm uppercase tracking-wide text-gray-900">PRECHEK / ПРЕЧЕК</div>
                <div className="text-gray-600 font-semibold">{hallName} - Stol #{tableNumber}</div>
                <div className="text-gray-500 text-[10px]">Ofitsiant: {waiter?.name || "Xodim"} | Mehmonlar: {guestsCount} kishi</div>
                <div className="text-gray-400 text-[10px]">{new Date().toLocaleString("ru-RU")}</div>
              </div>

              {/* Items Table */}
              <div className="space-y-1.5">
                <div className="grid grid-cols-12 font-bold text-gray-600 border-b pb-1 text-[11px]">
                  <span className="col-span-6">Taom nomi</span>
                  <span className="col-span-2 text-center">Soni</span>
                  <span className="col-span-4 text-right">Summa</span>
                </div>
                {cartItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 py-0.5 text-[11px]">
                    <span className="col-span-6 font-semibold text-gray-800 truncate">{item.name}</span>
                    <span className="col-span-2 text-center font-mono">{item.quantity}</span>
                    <span className="col-span-4 text-right font-mono font-bold">{(item.price * item.quantity).toLocaleString()} so'm</span>
                  </div>
                ))}
              </div>

              {/* Calculation Summary */}
              <div className="pt-2 border-t border-gray-300 space-y-1 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Oraliq hisob:</span>
                  <span className="font-mono font-bold">{subtotal.toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Xizmat haqida (10%):</span>
                  <span className="font-mono font-bold">{serviceCharge.toLocaleString()} so'm</span>
                </div>
                <div className="flex justify-between font-black text-sm text-[#0d2e59] pt-1 border-t border-gray-400">
                  <span>JAMI TЎLANISHI KERAK:</span>
                  <span className="font-mono text-base">{total.toLocaleString()} so'm</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-100 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPrecheckModal(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg text-xs font-bold cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handlePrintPrecheckBill}
                className="px-5 py-2 bg-[#2980b9] hover:bg-[#1f6391] text-white rounded-lg text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <span>🖨️</span>
                <span>Prechek Chop Etish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAYMENT & CLOSE BILL MODAL                                                */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-black font-sans">
            <div className="bg-gradient-to-r from-red-700 to-red-900 text-white px-4 py-3 flex items-center justify-between">
              <span className="font-black text-sm flex items-center gap-2">
                <span>💳</span>
                <span>TЎLOV QABUL QILISH VA SHOTNI YOPISH</span>
              </span>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-white hover:text-gray-300 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center space-y-1">
                <div className="text-xs font-bold text-gray-600">
                  {hallName} - Stol #{tableNumber} | Jami summa:
                </div>
                <div className="text-2xl font-black text-red-700 font-mono">
                  {total.toLocaleString()} so'm
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  To'lov turini tanlang:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`py-3 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === "cash"
                        ? "bg-green-600 text-white border-green-700 shadow-md ring-2 ring-green-400"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                    }`}
                  >
                    <span>💵</span>
                    <span>Naqd pul</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`py-3 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === "card"
                        ? "bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                    }`}
                  >
                    <span>💳</span>
                    <span>Plastik Karta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("uzcard")}
                    className={`py-3 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === "uzcard"
                        ? "bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                    }`}
                  >
                    <span>🔹</span>
                    <span>Uzcard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("humo")}
                    className={`py-3 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      paymentMethod === "humo"
                        ? "bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
                    }`}
                  >
                    <span>🔸</span>
                    <span>Humo</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-100 border-t flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg text-xs font-bold cursor-pointer"
              >
                Orqaga
              </button>
              <button
                onClick={handleConfirmPaymentAndCloseBill}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-lg text-xs font-black shadow-lg cursor-pointer flex items-center gap-2 uppercase tracking-wide"
              >
                <span>🧾</span>
                <span>To'lovni tasdiqlash va Chek chiqarish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
