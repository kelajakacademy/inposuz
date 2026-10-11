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
  ownerName: string; // Mas'ul shaxs / Rahbar
  phone: string;
  address: string;
  registrationDate: string;
  status: "active" | "trial" | "expired";
  subscriptionFee?: number;
  businessType?: string;
  dailyTurnover: number;
  monthlyTurnover: number;
  yearlyTurnover: number;
  totalPaid: number;
  payments: CafePaymentRecord[];
  adminCredentials?: {
    username: string;
    password: string;
  };
  expiresAt?: string;
  isTrial?: boolean;
  trialDays?: number;
  isPaymentRequired?: boolean;
}

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  brandName: "iNPOS RESTAURANT",
  watermarkText: "www.inpos.uz",
  loginInstructionText: "iNPOS tizimi xodimlari uchun qo'llanma",
  supportTitle: "Mijozlarni qo'llab-quvvatlash xizmati",
  supportLogoUrl: "/inpos-logo.svg",
  supportEmail: "help@inpos.uz",
  supportPhones: [
    { id: "sp1", city: "TOSHKENT", phone: "+998 (71) 200-00-00" },
    { id: "sp2", city: "TOSHKENT", phone: "+998 (95) 198-88-44" },
    { id: "sp3", city: "SAMARQAND", phone: "+998 (93) 123-45-67" }
  ],
  currency: "UZS"
};

// ONLY real registered cafes - fake cafes removed
export const INITIAL_CAFES_DATA: CafeCRMRecord[] = [
  {
    id: "default",
    name: "iNPOS Restaurant",
    ownerName: "Xakimjon Xayitov",
    phone: "+998339939900",
    address: "Toshkent shahri",
    registrationDate: "2026-01-10",
    status: "active",
    subscriptionFee: 500000,
    businessType: "restaurant",
    dailyTurnover: 0,
    monthlyTurnover: 0,
    yearlyTurnover: 0,
    totalPaid: 500000,
    payments: [],
    expiresAt: "2027-12-31",
    isTrial: false,
    trialDays: 14,
    adminCredentials: {
      username: "admin",
      password: "admin123"
    }
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
    if (saved) {
      const parsed: CafeCRMRecord[] = JSON.parse(saved);
      // Filter out any fake demo cafes (CF-1002, CF-1003, etc.)
      const cleaned = parsed.filter(c => c.id !== "CF-1002" && c.id !== "CF-1003");
      if (cleaned.length !== parsed.length) {
        saveStoredCafesData(cleaned);
      }
      return cleaned;
    }
  } catch (e) {
    console.warn("Failed to load cafes data:", e);
  }
  return INITIAL_CAFES_DATA;
}

export function saveStoredCafesData(cafes: CafeCRMRecord[]): void {
  try {
    // Purge fake mock cafes before saving
    const cleaned = cafes.filter(c => c.id !== "CF-1002" && c.id !== "CF-1003");
    localStorage.setItem("propos_cafes_crm", JSON.stringify(cleaned));
  } catch (e) {
    console.warn("Failed to save cafes data:", e);
  }
}
