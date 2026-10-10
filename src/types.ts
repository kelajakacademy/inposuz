export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  cafeId?: string;
  mxikCode?: string;      // 17-digit IKPU / MXIK code for Soliq
  packageCode?: string;   // O'lchov birligi (dona: 796, kg: 166, litr: 112)
  vatPercent?: number;    // QQS stavkasi (0 yoki 12%)
}

export interface CartItem extends Product {
  cartId: string;
  extras?: string[];
  quantity: number;
  isSentToKitchen?: boolean;
  comment?: string;       // Maxsus izoh (masalan: "bez piyoz", "achchiq", "muzsiz")
  portion?: number;       // Porsiya (1, 0.5, 1.5)
  course?: number;        // Navbat (1-taom, 2-taom, desert)
}

export interface Order {
  id: string;
  tableNumber: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  waiterId: string;
  waiterName: string;
  status: 'active' | 'kitchen' | 'completed' | 'cancelled';
  kitchenStatus?: 'pending' | 'preparing' | 'ready' | 'served';
  paymentMethod?: 'cash' | 'card' | 'mixed' | 'deposit' | 'debt' | 'bonus';
  timestamp: string;
  completedAt?: string;
  cafeId?: string;
  // CRM Client & Loyalty fields
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  clientCardNumber?: string;
  clientGroupName?: string;
  discountPercent?: number;
  discountAmount?: number;
  cashbackPercent?: number;
  cashbackEarned?: number;
  bonusSpent?: number;
  depositSpent?: number;
  debtAmount?: number;
  notes?: string;
  // Soliq / OFD fiscal fields
  isFiscalized?: boolean;
  fiscalReceiptSeq?: number;
  fiscalSign?: string;
  fiscalQrUrl?: string;
  fiscalTerminalId?: string;
  fiscalDateTime?: string;
  fiscalVatAmount?: number;
}

export interface Table {
  id: string;
  number: string;
  capacity?: number;
  hall?: string;
  status: 'available' | 'occupied' | 'reserved';
  activeWaiterId?: string;
  activeWaiterName?: string;
  activeOrderId?: string;
  cafeId?: string;
}

export interface Waiter {
  id: string;
  name: string;
  token: string;
  isAdmin?: boolean;
  role?: string;
  phone?: string;
  cafeId?: string;
  cafeName?: string;
}

export interface Cafe {
  id: string;
  name: string;
  businessType?: string;
  ownerId?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  phone?: string;
  role: string;
  token?: string;
  companyName?: string;
  businessType?: string;
  cafeId?: string;
}

export interface Employee {
  id: string;
  name: string;
  pin: string;
  role: 'waiter' | 'admin' | 'cashier' | 'chef' | string;
  phone?: string;
  status: 'active' | 'fired';
  createdAt?: string;
  cafeId?: string;
}

export interface AdminReportData {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalOrdersCount: number;
  cashSales: number;
  cardSales: number;
  mixedSales: number;
  averageCheck: number;
  waiterStats: Array<{ waiterName: string; orderCount: number; totalRevenue: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  hourlyStats?: Array<{ hour: string; count: number; revenue: number }>;
  orders: Order[];
}

export interface ReceiptConfig {
  restaurantName: string;
  address: string;
  phone: string;
  footerMessage: string;
  showLogo: boolean;
  logoUrl?: string;
  loginBgUrl?: string;
  infoText?: string;
  textAlign: 'left' | 'center';
  autoPrintKitchen?: boolean;
  autoPrintBill?: boolean;
  kitchenPrinterName?: string;
  cashierPrinterName?: string;
  currency?: string;
}

export interface OfflineOrder extends Order {
  offlineSavedAt?: string;
  offlineAction?: 'create' | 'finalize' | 'kitchen_update';
}

export interface SoliqConfig {
  enabled: boolean;
  companyInn: string;         // STIR / INN (9 digits)
  companyName: string;        // Korxona nomi
  virtualKassaNumber: string; // Kassa zavod/registratsiya raqami
  fiscalModuleNumber: string; // FM seriya raqami
  ofdOperator: string;        // OFD provayderi (Soliq.uz / Multikassa / E-Kassa)
  apiUrl?: string;            // OFD server API URL
  apiKey?: string;            // OFD API kaliti
  isTestMode: boolean;        // Test yoki jonli rejim
  autoFiscalize: boolean;     // Chek to'langanda avtomatik Soliqqa sotuv yuborish
  defaultVatPercent: number;  // Standart QQS (0% yoki 12%)
  defaultMxikCode: string;    // Standart MXIK/IKPU kodi (masalan: 05610001001000000)
  defaultPackageCode: string; // Standart o'lchov birligi (796 - dona)
}

export interface FiscalRecord {
  id: string;
  orderId: string;
  receiptNumber: string;
  fiscalSign: string;
  fiscalModuleNumber: string;
  terminalNumber: string;
  fiscalUrl: string;
  totalAmount: number;
  vatAmount: number;
  cashAmount: number;
  cardAmount: number;
  status: 'success' | 'failed' | 'cancelled';
  errorMessage?: string;
  cafeId?: string;
  createdAt: string;
}

export type DeliveryAggregator = 'yandex_eats' | 'uzum_tezkor' | 'telegram' | 'direct';
export type DeliveryStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface DeliveryItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  comment?: string;
  portion?: number;
  mxikCode?: string;
  packageCode?: string;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string;               // e.g. "YE-8492", "UT-4019", "TG-7721"
  aggregator: DeliveryAggregator;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryLocation?: string;        // Dom / Podezd / Etaj / Xonadon
  courierName?: string;
  courierPhone?: string;
  courierType?: 'aggregator' | 'own';
  status: DeliveryStatus;
  items: DeliveryItem[];
  subtotal: number;
  deliveryFee: number;
  aggregatorFee: number;            // Aggregator commission
  totalAmount: number;
  paymentMethod: 'online' | 'cash' | 'card_on_delivery';
  paymentStatus: 'paid' | 'pending';
  comment?: string;
  estimatedDeliveryTime?: string;   // "20-30 min"
  etaMinutes?: number;
  cafeId?: string;
  createdAt: string;
  acceptedAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  // Soliq fiscal integration
  isFiscalized?: boolean;
  fiscalSign?: string;
  fiscalQrUrl?: string;
}

export interface DeliverySettings {
  cafeId?: string;
  cafeName?: string;
  yandexEats: {
    enabled: boolean;
    storeId: string;
    apiKey: string;
    clientSecret?: string;
    webhookUrl: string;
    autoAccept: boolean;
    commissionPercent: number;
    status: 'connected' | 'disconnected' | 'error' | 'testing';
    soundAlert: boolean;
    lastCheckedAt?: string;
    connectionMessage?: string;
  };
  uzumTezkor: {
    enabled: boolean;
    merchantId: string;
    secretKey: string;
    outletId?: string;
    webhookUrl: string;
    autoAccept: boolean;
    commissionPercent: number;
    status: 'connected' | 'disconnected' | 'error' | 'testing';
    soundAlert: boolean;
    lastCheckedAt?: string;
    connectionMessage?: string;
  };
  telegramBot: {
    enabled: boolean;
    botToken: string;
    botUsername: string;
    adminChatId: string;
    webhookUrl: string;
    autoAccept: boolean;
    welcomeMessage: string;
    soundAlert: boolean;
    status: 'connected' | 'disconnected' | 'error' | 'testing';
    lastCheckedAt?: string;
    connectionMessage?: string;
  };
  directDelivery: {
    enabled: boolean;
    minOrderAmount: number;
    defaultDeliveryFee: number;
    freeDeliveryThreshold: number;
    phone: string;
  };
  soundNotification: boolean;
  autoPrintReceipt: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cardNumber?: string;
  groupId: string;
  groupName: string;
  discountPercent: number;
  cashbackPercent: number;
  bonusBalance: number;
  depositBalance: number;
  debtBalance: number;
  totalVisits: number;
  totalSpent: number;
  avgCheck: number;
  birthday?: string;
  gender?: 'male' | 'female' | 'unspecified';
  notes?: string;
  status: 'active' | 'blocked';
  lastVisit?: string;
  cafeId?: string;
  createdAt: string;
}

export interface ClientGroup {
  id: string;
  name: string;
  discountPercent: number;
  cashbackPercent: number;
  color: string;
  minSpend: number;
  cafeId?: string;
  createdAt: string;
  clientsCount?: number;
}

export interface ClientTransaction {
  id: string;
  clientId: string;
  type: 'bonus_add' | 'bonus_spend' | 'deposit_topup' | 'deposit_spend' | 'debt_add' | 'debt_pay' | 'order_discount';
  amount: number;
  orderId?: string;
  comment?: string;
  waiterName?: string;
  cafeId?: string;
  createdAt: string;
}

export interface LoyaltySettings {
  cafeId: string;
  enabled: boolean;
  type: 'cashback' | 'discount' | 'tiered';
  defaultCashbackPercent: number;
  maxBonusUsagePercent: number;
  bonusToCurrencyRate: number;
  welcomeBonus: number;
  birthdayBonus: number;
  birthdayDiscountPercent: number;
}

export interface RfmSegmentSummary {
  vipCount: number;
  vipRevenue: number;
  regularCount: number;
  regularRevenue: number;
  atRiskCount: number;
  atRiskRevenue: number;
  newCount: number;
  newRevenue: number;
  totalClients: number;
  totalBonuses: number;
  totalDeposits: number;
  totalDebts: number;
}


