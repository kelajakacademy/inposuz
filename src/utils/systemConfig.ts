export interface SupportPhoneItem {
  id: string;
  city: string;
  phone: string;
}

export interface SystemConfig {
  brandName: string;
  watermarkText: string;
  loginInstructionText: string;
  supportTitle: string;
  supportLogoUrl?: string;
  supportEmail: string;
  supportPhones: SupportPhoneItem[];
  currency: string;
}

export interface CafePaymentRecord {
  id: string;
  cafeId: string;
  date: string;
  amount: number;
  paymentMethod: "cash" | "card" | "bank" | "online";
  notes: string;
}

export interface CafeCRMRecord {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  registrationDate: string;
  status: "active" | "trial" | "expired";
  dailyTurnover: number;
  monthlyTurnover: number;
  yearlyTurnover: number;
  totalPaid: number;
  payments: CafePaymentRecord[];
}

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  brandName: "iNPOS RESTAURANT",
  watermarkText: "www.inpos.uz",
  loginInstructionText: "Инструкция для кассиров в программе iNPOS",
  supportTitle: "Служба поддержки",
  supportLogoUrl: "/inpos-logo.svg",
  supportEmail: "help@inpos.uz",
  supportPhones: [
    { id: "sp1", city: "ТАШКЕНТ", phone: "+998 (95) 198-88-44" },
    { id: "sp2", city: "ТАШКЕНТ", phone: "+998 (95) 144-64-51" },
    { id: "sp3", city: "САМАРКАНД", phone: "+998 (93) 123-45-67" }
  ],
  currency: "UZS"
};

export const INITIAL_CAFES_DATA: CafeCRMRecord[] = [
  {
    id: "CF-1001",
    name: "Jowi Restaurant & Lounge",
    ownerName: "Хакимжон Хайитов",
    phone: "+998 90 123 45 67",
    address: "Toshkent sh., Amir Temur ko'chasi 45-uy",
    registrationDate: "2026-01-10",
    status: "active",
    dailyTurnover: 4850000,
    monthlyTurnover: 145500000,
    yearlyTurnover: 1746000000,
    totalPaid: 2500000,
    payments: [
      { id: "p1", cafeId: "CF-1001", date: "2026-01-10", amount: 1000000, paymentMethod: "card", notes: "Борд улаш тўлови" },
      { id: "p2", cafeId: "CF-1001", date: "2026-02-10", amount: 1500000, paymentMethod: "bank", notes: "Февраль ойлик POS обуна" }
    ]
  },
  {
    id: "CF-1002",
    name: "Grand Fast Food & Cafe",
    ownerName: "Исломжон Алиев",
    phone: "+998 93 555 44 33",
    address: "Toshkent sh., Chorsu bozori 12-д",
    registrationDate: "2026-02-01",
    status: "active",
    dailyTurnover: 3200000,
    monthlyTurnover: 96000000,
    yearlyTurnover: 1152000000,
    totalPaid: 1500000,
    payments: [
      { id: "p3", cafeId: "CF-1002", date: "2026-02-01", amount: 1500000, paymentMethod: "cash", notes: "Февраль POS лицензия" }
    ]
  },
  {
    id: "CF-1003",
    name: "Karaoke & Bar Gold",
    ownerName: "Фаррух Каримов",
    phone: "+998 97 888 77 66",
    address: "Toshkent sh., Chilanzar 5-kvartal",
    registrationDate: "2026-02-15",
    status: "trial",
    dailyTurnover: 8500000,
    monthlyTurnover: 255000000,
    yearlyTurnover: 3060000000,
    totalPaid: 0,
    payments: []
  }
];

export function getStoredSystemConfig(): SystemConfig {
  try {
    const saved = localStorage.getItem("propos_system_config");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Failed to load system config:", e);
  }
  return DEFAULT_SYSTEM_CONFIG;
}

export function saveStoredSystemConfig(config: SystemConfig): void {
  try {
    localStorage.setItem("propos_system_config", JSON.stringify(config));
  } catch (e) {
    console.warn("Failed to save system config:", e);
  }
}

export function getStoredCafesData(): CafeCRMRecord[] {
  try {
    const saved = localStorage.getItem("propos_cafes_crm");
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Failed to load cafes data:", e);
  }
  return INITIAL_CAFES_DATA;
}

export function saveStoredCafesData(cafes: CafeCRMRecord[]): void {
  try {
    localStorage.setItem("propos_cafes_crm", JSON.stringify(cafes));
  } catch (e) {
    console.warn("Failed to save cafes data:", e);
  }
}
