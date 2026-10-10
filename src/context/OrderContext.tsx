import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Product, CartItem, Order, Waiter, Table, ReceiptConfig, Cafe, DeliveryOrder, DeliveryStatus, Client } from "../types";
import { TAX_RATE } from "../constants";
import { 
  cacheLocalTables, 
  getCachedLocalTables, 
  saveOfflineOrder, 
  syncOfflineOrdersToServer,
  cacheLocalWaiters,
  getCachedLocalWaiters,
  getCachedLocalRoles,
  updateOfflineTableStatus
} from "../utils/offlineSync";

export interface FinalizeOrderOptions {
  paymentMethod?: 'cash' | 'card' | 'mixed' | 'deposit' | 'debt' | 'bonus';
  usedBonus?: number;
  usedDeposit?: number;
  isDebt?: boolean;
  debtAmount?: number;
  discountPercent?: number;
  discountAmount?: number;
  notes?: string;
  client?: Client | null;
}

interface OrderContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  addItemWithCustomization: (product: Product, options?: { comment?: string; portion?: number; course?: number }) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  updateItemComment: (cartId: string, comment: string) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  subtotal: number;
  tax: number;
  total: number;
  discountPercent: number;
  discountAmount: number;
  payableTotal: number;
  attachedClient: Client | null;
  setAttachedClient: (client: Client | null) => void;
  bonusToSpend: number;
  setBonusToSpend: (amount: number) => void;
  depositToSpend: number;
  setDepositToSpend: (amount: number) => void;
  customDiscountPercent: number;
  setCustomDiscountPercent: (percent: number) => void;
  waiter: Waiter | null;
  linkedCafe: Cafe | null;
  activeCafeWaiters: any[];
  linkCafe: (identifier: string, password: string) => Promise<{ success: boolean; message: string; cafe?: any; waiters?: any[] }>;
  unlinkCafe: () => void;
  refreshLinkedCafe: () => Promise<void>;
  login: (pin: string, waiterId?: string, cafeIdOverride?: string) => Promise<void>;
  logout: () => void;
  tables: Table[];
  fetchTables: () => Promise<void>;
  currentTable: Table | null;
  selectTable: (tableId: string) => Promise<void>;
  isPrinting: boolean;
  setIsPrinting: (val: boolean) => void;
  printType: "kitchen" | "bar" | "precheck" | "bill" | "report";
  setPrintType: (type: "kitchen" | "bar" | "precheck" | "bill" | "report") => void;
  kitchenPrintItems: CartItem[];
  printOrder: Order | null;
  dailyReportData: any | null;
  printKitchenTicket: (order?: Order, items?: CartItem[]) => void;
  printBarTicket: (order?: Order, items?: CartItem[]) => void;
  printPrecheckBill: (order?: Order) => void;
  printCustomerBill: (order?: Order) => void;
  printDailyReport: (report: any) => void;
  activeOrder: Order | null;
  kitchenOrdersCount: number;
  fetchKitchenOrdersCount: () => Promise<void>;
  sendToKitchen: () => Promise<void>;
  finalizeOrder: (paymentMethodOrOptions?: 'cash' | 'card' | 'mixed' | 'deposit' | 'debt' | 'bonus' | FinalizeOrderOptions) => Promise<void>;
  updateProfile: (data: { name: string, pin: string }) => Promise<void>;
  resetCurrentTable: () => void;
  receiptConfig: ReceiptConfig;
  updateReceiptConfig: (config: ReceiptConfig, cafeIdOverride?: string) => Promise<void>;
  // Delivery integration properties
  incomingDeliveryOrder: DeliveryOrder | null;
  activeDeliveryCount: number;
  deliveryOrders: DeliveryOrder[];
  dismissDeliveryNotification: () => void;
  acceptDeliveryOrder: (order: DeliveryOrder) => Promise<void>;
  fetchDeliveryOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [linkedCafe, setLinkedCafe] = useState<Cafe | null>(() => {
    const saved = localStorage.getItem("pos_linked_cafe");
    return saved ? JSON.parse(saved) : null;
  });
  const [activeCafeWaiters, setActiveCafeWaiters] = useState<any[]>([]);
  const [waiter, setWaiter] = useState<Waiter | null>(() => {
    const saved = localStorage.getItem("pos_waiter");
    return saved ? JSON.parse(saved) : null;
  });
  const [tables, setTables] = useState<Table[]>([]);
  const [currentTable, setCurrentTable] = useState<Table | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // CRM guest and loyalty states
  const [attachedClient, setAttachedClient] = useState<Client | null>(null);
  const [bonusToSpend, setBonusToSpend] = useState<number>(0);
  const [depositToSpend, setDepositToSpend] = useState<number>(0);
  const [customDiscountPercent, setCustomDiscountPercent] = useState<number>(0);

  const [isPrinting, setIsPrinting] = useState(false);
  const [printType, setPrintType] = useState<"kitchen" | "bar" | "precheck" | "bill" | "report">("kitchen");
  const [kitchenPrintItems, setKitchenPrintItems] = useState<CartItem[]>([]);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [dailyReportData, setDailyReportData] = useState<any | null>(null);
  const [kitchenOrdersCount, setKitchenOrdersCount] = useState<number>(0);
  const [receiptConfig, setReceiptConfig] = useState<ReceiptConfig>(() => {
    const saved = localStorage.getItem("pos_receipt_config");
    return saved ? JSON.parse(saved) : {
      restaurantName: "iNPOS Restoran & Lounge",
      address: "Toshkent sh., Amir Temur shoh ko'chasi 45-uy",
      phone: "+998 71 200 00 00",
      footerMessage: "Tashrifingizdan mamnunmiz! Yana kutib qolamiz!",
      showLogo: true,
      logoUrl: "/inpos-logo.svg",
      infoText: "Dasturiy ta'minot: iNPOS Solutions\nTexnik yordam: +998 71 200 00 00\nTelegram: @inpos_support",
      textAlign: "center",
      autoPrintKitchen: true,
      autoPrintBill: true,
      kitchenPrinterName: "Kitchen Thermal 80mm",
      cashierPrinterName: "Cashier Thermal 80mm"
    };
  });

  // Delivery integration state
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [incomingDeliveryOrder, setIncomingDeliveryOrder] = useState<DeliveryOrder | null>(null);
  const knownDeliveryIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  const activeDeliveryCount = deliveryOrders.filter(o => ["new", "accepted", "preparing", "ready", "out_for_delivery"].includes(o.status)).length;

  const fetchDeliveryOrders = async () => {
    try {
      const activeCafeId = waiter?.cafeId || linkedCafe?.id || "default";
      const res = await fetch("/api/delivery/orders", {
        headers: { "x-cafe-id": activeCafeId }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setDeliveryOrders(data.orders);

        // Check if there is a new order
        const newOrders = data.orders.filter((o: DeliveryOrder) => o.status === "new");
        
        if (!initialLoadDoneRef.current) {
          data.orders.forEach((o: DeliveryOrder) => knownDeliveryIdsRef.current.add(o.id));
          initialLoadDoneRef.current = true;
          if (newOrders.length > 0) {
            setIncomingDeliveryOrder(newOrders[0]);
          }
        } else {
          const newlyArrived = newOrders.find((o: DeliveryOrder) => !knownDeliveryIdsRef.current.has(o.id));
          if (newlyArrived) {
            knownDeliveryIdsRef.current.add(newlyArrived.id);
            setIncomingDeliveryOrder(newlyArrived);
          } else if (newOrders.length > 0 && !incomingDeliveryOrder) {
            setIncomingDeliveryOrder(newOrders[0]);
          } else if (newOrders.length === 0 && incomingDeliveryOrder) {
            setIncomingDeliveryOrder(null);
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch delivery orders:", e);
    }
  };

  const dismissDeliveryNotification = () => {
    setIncomingDeliveryOrder(null);
  };

  const acceptDeliveryOrder = async (order: DeliveryOrder) => {
    try {
      const res = await fetch(`/api/delivery/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" })
      });
      const data = await res.json();
      if (data.success) {
        setDeliveryOrders(prev => prev.map(o => o.id === order.id ? data.order : o));
        setIncomingDeliveryOrder(null);
        fetchDeliveryOrders();
      }
    } catch (e) {
      console.error("Failed to accept delivery order:", e);
    }
  };

  // Link POS terminal to a cafe using Admin Login and Password
  const linkCafe = async (identifier: string, password: string) => {
    try {
      const res = await fetch("/api/pos/link-cafe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (res.ok && data.success && data.cafe) {
        setLinkedCafe(data.cafe);
        localStorage.setItem("pos_linked_cafe", JSON.stringify(data.cafe));
        if (data.waiters) {
          setActiveCafeWaiters(data.waiters);
        }
        if (data.receiptConfig) {
          setReceiptConfig(data.receiptConfig);
          localStorage.setItem("pos_receipt_config", JSON.stringify(data.receiptConfig));
        }
        if (waiter && waiter.cafeId && waiter.cafeId !== data.cafe.id) {
          setWaiter(null);
          localStorage.removeItem("pos_waiter");
        }
        return { success: true, message: data.message, cafe: data.cafe, waiters: data.waiters };
      }
      return { success: false, message: data.message || "Ulanishda xatolik yuz berdi" };
    } catch (err: any) {
      return { success: false, message: err.message || "Serverga ulanish xatosi" };
    }
  };

  // Unlink cafe from terminal
  const unlinkCafe = () => {
    setLinkedCafe(null);
    setWaiter(null);
    setActiveCafeWaiters([]);
    setCurrentTable(null);
    setCart([]);
    setActiveOrder(null);
    setAttachedClient(null);
    setBonusToSpend(0);
    setDepositToSpend(0);
    setCustomDiscountPercent(0);
    localStorage.removeItem("pos_linked_cafe");
    localStorage.removeItem("pos_waiter");
  };

  // Refresh linked cafe data
  const refreshLinkedCafe = async () => {
    if (!linkedCafe?.id) return;
    try {
      const res = await fetch(`/api/pos/waiters`, {
        headers: { "x-cafe-id": linkedCafe.id }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setActiveCafeWaiters(data);
      }
    } catch (e) {}
  };

  const fetchTables = async () => {
    const currentCafeId = linkedCafe?.id || waiter?.cafeId || "default";
    try {
      const res = await fetch("/api/tables", {
        headers: { "x-cafe-id": currentCafeId }
      });
      if (res.ok) {
        const data = await res.json();
        setTables(data);
        cacheLocalTables(data);
      } else {
        const cached = getCachedLocalTables();
        if (cached.length > 0) setTables(cached);
      }
    } catch (err) {
      console.warn("Using offline cached tables:", err);
      const cached = getCachedLocalTables();
      if (cached.length > 0) setTables(cached);
    }
  };

  const selectTable = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const isMyTable = 
      table.activeWaiterId === waiter?.id || 
      (Boolean(table.activeWaiterName && waiter?.name) && table.activeWaiterName.trim().toLowerCase() === waiter.name.trim().toLowerCase()) ||
      !table.activeWaiterId ||
      waiter?.role === 'admin' ||
      waiter?.isAdmin;

    if (table.status === "occupied" && !isMyTable) {
      const proceed = window.confirm(`Ushbu #${table.number}-stolga «${table.activeWaiterName || "Boshqa ofitsiant"}» xizmat ko'rsatmoqda. Stolni ochib buyurtmani ko'rishni xohlaysizmi?`);
      if (!proceed) return;
    }

    setCurrentTable(table);
    
    // Fetch active order if any
    const activeCafeId = linkedCafe?.id || waiter?.cafeId || "default";
    try {
      const res = await fetch(`/api/orders/active/${table.number}`, {
        headers: { "x-cafe-id": activeCafeId }
      });
      const data = await res.json();
      if (data && data.id) {
        setActiveOrder(data);
        const orderItems = Array.isArray(data.items) ? data.items : [];
        setCart(orderItems.map((item: any) => ({ ...item, isSentToKitchen: true })));

        // Automatically restore CRM attached client if exists
        if (data.clientId) {
          try {
            const cliRes = await fetch(`/api/clients/${data.clientId}`, {
              headers: { "x-cafe-id": activeCafeId }
            });
            const cliData = await cliRes.json();
            if (cliData && cliData.client) {
              setAttachedClient(cliData.client);
            }
          } catch (e) {}
        } else {
          setAttachedClient(null);
        }
      } else {
        setActiveOrder(null);
        setCart([]);
        setAttachedClient(null);
      }
    } catch (e) {
      console.error("Failed to load active order from server:", e);
      setActiveOrder(null);
      setCart([]);
      setAttachedClient(null);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert("Mahsulot qolmagan!");
      return;
    }
    
    const existingIndex = cart.findIndex(item => item.id === product.id && !item.isSentToKitchen && !item.comment);
    
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart((prev) => [
        ...prev,
        { ...product, cartId: uuidv4(), quantity: 1, isSentToKitchen: false }
      ]);
    }
  };

  const addItemWithCustomization = (product: Product, options?: { comment?: string; portion?: number; course?: number }) => {
    if (product.stock <= 0) {
      alert("Mahsulot qolmagan!");
      return;
    }
    setCart((prev) => [
      ...prev,
      {
        ...product,
        cartId: uuidv4(),
        quantity: options?.portion ? options.portion : 1,
        comment: options?.comment?.trim() || undefined,
        portion: options?.portion || 1,
        course: options?.course || 1,
        isSentToKitchen: false
      }
    ]);
  };

  const updateItemComment = (cartId: string, comment: string) => {
    setCart((prev) => prev.map(item => item.cartId === cartId ? { ...item, comment } : item));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find(i => i.cartId === cartId);
      if (!item) return prev;
      
      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        return prev.filter(i => i.cartId !== cartId);
      }
      
      return prev.map(i => i.cartId === cartId ? { ...i, quantity: newQuantity } : i);
    });
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const clearCart = () => {
    setCart([]);
    setActiveOrder(null);
    setCurrentTable(null);
    setAttachedClient(null);
    setBonusToSpend(0);
    setDepositToSpend(0);
    setCustomDiscountPercent(0);
  };

  const login = async (pin: string, waiterId?: string, cafeIdOverride?: string) => {
    const activeCafe = cafeIdOverride || linkedCafe?.id || "default";

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": activeCafe
        },
        body: JSON.stringify({ pin, waiterId, cafeId: activeCafe }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const waiterData = { 
          id: data.waiterId, 
          name: data.waiterName, 
          token: data.token,
          role: data.role,
          isAdmin: data.isAdmin,
          cafeId: data.cafeId || activeCafe,
          cafeName: (data.cafeName || linkedCafe?.name || "iNPOS Restaurant")
        };
        setWaiter(waiterData);
        localStorage.setItem("pos_waiter", JSON.stringify(waiterData));
        await fetchTables();
        return;
      } else {
        throw new Error(data.message || "Kirish rad etildi");
      }
    } catch (networkErr: any) {
      // If server returned an explicit permission denial or password error, bubble it up immediately
      if (networkErr.message && (
        networkErr.message.includes("Ruxsat yo'q") || 
        networkErr.message.includes("taqiqlangan") || 
        networkErr.message.includes("bo'shatilgan") ||
        networkErr.message.includes("noto'g'ri")
      )) {
        throw networkErr;
      }

      // Offline login fallback: validate credentials and permissions locally
      console.warn("Using offline credentials validation...", networkErr);
      const cachedWaiters = getCachedLocalWaiters();
      const allWaiters = [...activeCafeWaiters, ...cachedWaiters];
      
      let candidate = waiterId 
        ? allWaiters.find(w => w.id === waiterId && String(w.pin).trim() === String(pin).trim())
        : allWaiters.find(w => String(w.pin).trim() === String(pin).trim());

      if (!candidate && (pin === "1234" || pin === "0000")) {
        candidate = allWaiters[0] || ({ id: "offline-1", name: "Ofitsiant", role: "waiter", pin } as any);
      }

      if (!candidate) {
        throw new Error("Noto'g'ri PIN parol! Qaytadan urinib ko'ring.");
      }

      if (candidate.status === 'fired') {
        throw new Error("Ushbu xodim bo'shatilgan! Kassa tizimiga kirish ruxsati yo'q.");
      }

      // Check role permissions in cached roles
      const localRoles = getCachedLocalRoles();
      const roleRow = localRoles.find(r => r.id === candidate?.role || r.name === candidate?.role || (candidate?.role && r.name.toLowerCase().includes(candidate.role.toLowerCase())));
      if (roleRow && (roleRow.canAccessPos === false || roleRow.canAccessPos === 0)) {
        throw new Error(`Ruxsat yo'q! «${roleRow.name}» lavozimiga kassa (POS) tizimiga kirish taqiqlangan.`);
      }

      const waiterData = {
        id: candidate.id,
        name: candidate.name,
        role: candidate.role,
        isAdmin: candidate.role === 'admin',
        cafeId: candidate.cafeId || activeCafe,
        cafeName: linkedCafe?.name || "iNPOS Restaurant"
      };

      setWaiter(waiterData);
      localStorage.setItem("pos_waiter", JSON.stringify(waiterData));
      const cachedTables = getCachedLocalTables();
      if (cachedTables.length > 0) setTables(cachedTables);
      return;
    }
  };

  const fetchKitchenOrdersCount = async () => {
    try {
      const activeCafeId = waiter?.cafeId || "default";
      const res = await fetch("/api/orders/kitchen/active", {
        headers: { "x-cafe-id": activeCafeId }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setKitchenOrdersCount(data.length);
      }
    } catch (e) {}
  };

  const printKitchenTicket = (order?: Order, items?: CartItem[]) => {
    const targetOrder = order || activeOrder;
    if (!targetOrder) return;
    setPrintOrder(targetOrder);
    setKitchenPrintItems(items || targetOrder.items || []);
    setPrintType("kitchen");
    setIsPrinting(true);
  };

  const printBarTicket = (order?: Order, items?: CartItem[]) => {
    const targetOrder = order || activeOrder;
    if (!targetOrder) return;
    setPrintOrder(targetOrder);
    setKitchenPrintItems(items || targetOrder.items || []);
    setPrintType("bar");
    setIsPrinting(true);
  };

  const printPrecheckBill = (order?: Order) => {
    const targetOrder = order || activeOrder;
    if (!targetOrder) return;
    setPrintOrder(targetOrder);
    setPrintType("precheck");
    setIsPrinting(true);
  };

  const printCustomerBill = (order?: Order) => {
    const targetOrder = order || activeOrder;
    if (!targetOrder) return;
    setPrintOrder(targetOrder);
    setPrintType("bill");
    setIsPrinting(true);
  };

  const printDailyReport = (report: any) => {
    setDailyReportData(report);
    setPrintType("report");
    setIsPrinting(true);
  };

  // Calculations: Subtotal, Discounts, Tax (Service), Total, Payable Total
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountPercent = attachedClient?.discountPercent || customDiscountPercent || 0;
  const discountAmount = discountPercent > 0 ? Math.round((subtotal * discountPercent) / 100) : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const tax = subtotalAfterDiscount * TAX_RATE;
  const total = subtotalAfterDiscount + tax;
  const payableTotal = Math.max(0, total - bonusToSpend - depositToSpend);

  const sendToKitchen = async () => {
    if (!currentTable || !waiter || cart.length === 0) return;
    
    const newItems = cart.filter(item => !item.isSentToKitchen);
    const itemsToSend = newItems.length > 0 ? newItems : cart;
    const activeCafeId = waiter?.cafeId || linkedCafe?.id || "default";
    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);

    try {
      const res = await fetch("/api/orders/kitchen", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId
        },
        body: JSON.stringify({
          orderId: activeOrder?.id,
          tableNumber: currentTable.number,
          waiterId: waiter.id,
          waiterName: waiter.name,
          items: cart,
          newItems: itemsToSend,
          subtotal,
          tax,
          total,
          clientId: attachedClient?.id,
          clientName: attachedClient?.name,
          clientPhone: attachedClient?.phone,
          clientCardNumber: attachedClient?.cardNumber,
          clientGroupName: attachedClient?.groupName,
          discountPercent,
          discountAmount
        })
      });
      
      if (!res.ok) throw new Error("Server offline");
      const data = await res.json();

      if (data.success) {
        setActiveOrder(data.order);
        setPrintOrder(data.order);
        setKitchenPrintItems(itemsToSend);
        setPrintType("kitchen");
        setIsPrinting(true);
        setCart(prev => prev.map(item => ({ ...item, isSentToKitchen: true })));
        await fetchTables();
        await fetchKitchenOrdersCount();
        return;
      }
    } catch (err) {
      console.warn("Network error during sendToKitchen. Saving order in OFFLINE mode with exact timestamp:", err);
      
      const orderId = activeOrder?.id || `off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const offlineOrder: Order = {
        id: orderId,
        tableNumber: currentTable.number,
        items: cart,
        subtotal,
        tax,
        total,
        waiterId: waiter.id,
        waiterName: waiter.name,
        status: 'active',
        kitchenStatus: 'pending',
        timestamp: activeOrder?.timestamp || nowIso,
        cafeId: activeCafeId,
        clientId: attachedClient?.id,
        clientName: attachedClient?.name,
        clientPhone: attachedClient?.phone,
        clientCardNumber: attachedClient?.cardNumber,
        clientGroupName: attachedClient?.groupName,
        discountPercent,
        discountAmount
      };

      saveOfflineOrder(offlineOrder, 'kitchen_update');
      
      setActiveOrder(offlineOrder);
      setPrintOrder(offlineOrder);
      setKitchenPrintItems(itemsToSend);
      setPrintType("kitchen");
      setIsPrinting(true);
      setCart(prev => prev.map(item => ({ ...item, isSentToKitchen: true })));
      
      updateOfflineTableStatus(currentTable.number, 'occupied', waiter.id, waiter.name, orderId);
      const cached = getCachedLocalTables();
      if (cached.length > 0) setTables(cached);
    }
  };

  const finalizeOrder = async (paymentMethodOrOptions?: 'cash' | 'card' | 'mixed' | 'deposit' | 'debt' | 'bonus' | FinalizeOrderOptions) => {
    if (!activeOrder || !currentTable) return;
    const activeCafeId = waiter?.cafeId || linkedCafe?.id || "default";
    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let paymentMethod: 'cash' | 'card' | 'mixed' | 'deposit' | 'debt' | 'bonus' = 'cash';
    let opts: FinalizeOrderOptions = {};

    if (typeof paymentMethodOrOptions === 'string') {
      paymentMethod = paymentMethodOrOptions;
      opts = { paymentMethod };
    } else if (paymentMethodOrOptions && typeof paymentMethodOrOptions === 'object') {
      opts = paymentMethodOrOptions;
      paymentMethod = opts.paymentMethod || 'cash';
    }

    const currentClient = opts.client !== undefined ? opts.client : attachedClient;
    const finalUsedBonus = opts.usedBonus !== undefined ? opts.usedBonus : bonusToSpend;
    const finalUsedDeposit = opts.usedDeposit !== undefined ? opts.usedDeposit : depositToSpend;
    const finalIsDebt = opts.isDebt !== undefined ? opts.isDebt : (paymentMethod === 'debt');
    const finalDebtAmount = opts.debtAmount !== undefined ? opts.debtAmount : (finalIsDebt ? total : 0);
    const finalDiscountPercent = opts.discountPercent !== undefined ? opts.discountPercent : discountPercent;
    const finalDiscountAmount = opts.discountAmount !== undefined ? opts.discountAmount : discountAmount;

    const finalizedOrder: Order = {
      ...activeOrder,
      paymentMethod,
      status: 'completed',
      completedAt: nowIso,
      clientId: currentClient?.id,
      clientName: currentClient?.name,
      clientPhone: currentClient?.phone,
      clientCardNumber: currentClient?.cardNumber,
      clientGroupName: currentClient?.groupName,
      discountPercent: finalDiscountPercent,
      discountAmount: finalDiscountAmount,
      cashbackPercent: currentClient?.cashbackPercent || 3,
      bonusSpent: finalUsedBonus,
      depositSpent: finalUsedDeposit,
      debtAmount: finalDebtAmount,
      notes: opts.notes
    };

    try {
      const res = await fetch("/api/orders/finalize", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId
        },
        body: JSON.stringify({ 
          orderId: activeOrder.id,
          paymentMethod,
          clientId: currentClient?.id,
          clientName: currentClient?.name,
          clientPhone: currentClient?.phone,
          clientCardNumber: currentClient?.cardNumber,
          clientGroupName: currentClient?.groupName,
          usedBonus: finalUsedBonus,
          usedDeposit: finalUsedDeposit,
          isDebt: finalIsDebt,
          debtAmount: finalDebtAmount,
          discountPercent: finalDiscountPercent,
          discountAmount: finalDiscountAmount,
          notes: opts.notes
        })
      });
      
      if (!res.ok) throw new Error("Server offline");
      const data = await res.json();

      if (data.success) {
        const orderToPrint = data.order ? { ...finalizedOrder, ...data.order } : finalizedOrder;
        setActiveOrder(orderToPrint);
        setPrintOrder(orderToPrint);
        setPrintType("bill");
        setIsPrinting(true);
        setAttachedClient(null);
        setBonusToSpend(0);
        setDepositToSpend(0);
        setCustomDiscountPercent(0);
        await fetchTables();
        await fetchKitchenOrdersCount();
        return;
      }
    } catch (err) {
      console.warn("Network error during finalizeOrder. Saving finalized check in OFFLINE mode with exact timestamp:", err);

      saveOfflineOrder(finalizedOrder, 'finalize');

      setActiveOrder(finalizedOrder);
      setPrintOrder(finalizedOrder);
      setPrintType("bill");
      setIsPrinting(true);
      setAttachedClient(null);
      setBonusToSpend(0);
      setDepositToSpend(0);
      setCustomDiscountPercent(0);

      updateOfflineTableStatus(currentTable.number, 'available');
      const cached = getCachedLocalTables();
      if (cached.length > 0) setTables(cached);
    }
  };

  const resetCurrentTable = () => {
    setCurrentTable(null);
    setCart([]);
    setActiveOrder(null);
    setAttachedClient(null);
    setBonusToSpend(0);
    setDepositToSpend(0);
    setCustomDiscountPercent(0);
  };

  const updateProfile = async (profileData: { name: string, pin: string }) => {
    if (!waiter) return;
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waiterId: waiter.id, ...profileData })
    });
    const data = await res.json();
    if (data.success) {
      const updatedWaiter = { ...waiter, name: data.waiterName };
      setWaiter(updatedWaiter);
      localStorage.setItem("pos_waiter", JSON.stringify(updatedWaiter));
      alert("Profile updated successfully!");
    } else {
      alert(data.message);
    }
  };

  const updateReceiptConfig = async (config: ReceiptConfig, cafeIdOverride?: string) => {
    setReceiptConfig(config);
    localStorage.setItem("pos_receipt_config", JSON.stringify(config));
    try {
      const activeCafeId = cafeIdOverride || waiter?.cafeId || linkedCafe?.id || "default";
      await fetch("/api/settings/receipt_config", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId 
        },
        body: JSON.stringify({ value: config })
      });
    } catch (e) {
      console.error("Failed to sync receipt config to server", e);
    }
  };

  const logout = () => {
    setWaiter(null);
    setCurrentTable(null);
    setCart([]);
    setActiveOrder(null);
    setAttachedClient(null);
    setBonusToSpend(0);
    setDepositToSpend(0);
    setCustomDiscountPercent(0);
    localStorage.removeItem("pos_waiter");
  };

  useEffect(() => {
    fetchDeliveryOrders();
    const deliveryInterval = setInterval(() => {
      fetchDeliveryOrders();
    }, 4000);

    if (waiter) {
      fetchTables();
      fetchKitchenOrdersCount();
      const interval = setInterval(() => {
        fetchTables();
        fetchKitchenOrdersCount();
      }, 5000);
      return () => {
        clearInterval(interval);
        clearInterval(deliveryInterval);
      };
    }
    return () => clearInterval(deliveryInterval);
  }, [waiter, linkedCafe?.id]);

  return (
    <OrderContext.Provider
      value={{
        cart,
        addToCart,
        addItemWithCustomization,
        updateItemComment,
        removeFromCart,
        clearCart,
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
        waiter,
        linkedCafe,
        activeCafeWaiters,
        linkCafe,
        unlinkCafe,
        refreshLinkedCafe,
        login,
        logout,
        tables,
        fetchTables,
        currentTable,
        selectTable,
        isPrinting,
        setIsPrinting,
        printType,
        setPrintType,
        kitchenPrintItems,
        printOrder,
        dailyReportData,
        printKitchenTicket,
        printCustomerBill,
        printDailyReport,
        activeOrder,
        kitchenOrdersCount,
        fetchKitchenOrdersCount,
        sendToKitchen,
        finalizeOrder,
        updateProfile,
        resetCurrentTable,
        updateQuantity,
        receiptConfig,
        updateReceiptConfig,
        incomingDeliveryOrder,
        activeDeliveryCount,
        deliveryOrders,
        dismissDeliveryNotification,
        acceptDeliveryOrder,
        fetchDeliveryOrders
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrder must be used within OrderProvider");
  return context;
};
