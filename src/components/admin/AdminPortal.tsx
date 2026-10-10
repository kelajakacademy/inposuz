import React, { useState, useEffect } from "react";
import { AdminUser } from "../../types";
import { InposDashboard } from "./InposDashboard";
import { DishesModule, DishesSubTab } from "./DishesModule";
import { CrmModule } from "./CrmModule";
import { MenuManager } from "./MenuManager";
import { EmployeesManager, PermissionsSubTab } from "./EmployeesManager";
import { TablesManager } from "./TablesManager";
import { InventoryManager, WarehouseSubTab } from "./InventoryManager";
import { InvoicesModule } from "./InvoicesModule";
import { OrdersHistoryManager, OrdersSubTab } from "./OrdersHistoryManager";
import { ReportsManager } from "./ReportsManager";
import { FinanceModule, FinanceSubTab } from "./FinanceModule";
import { PaymentTypesManager } from "./PaymentTypesManager";
import { PrintersManager } from "./PrintersManager";
import { AuditLogsManager } from "./AuditLogsManager";
import { SoliqView } from "../SoliqView";
import { useOrder } from "../../context/OrderContext";
import { InposLogo } from "../common/InposLogo";
import { subscribeToSync, syncOfflineOrdersToServer, SyncStatus } from "../../utils/offlineSync";
import { 
  LayoutDashboard, 
  RotateCw,
  RefreshCw,
  BarChart2, 
  TrendingUp, 
  Package, 
  CreditCard, 
  Folder, 
  Receipt, 
  Users, 
  Grid, 
  Clock, 
  DollarSign, 
  UtensilsCrossed, 
  Warehouse, 
  ShoppingBag, 
  ShieldCheck, 
  ShieldAlert,
  Printer,
  Settings, 
  HelpCircle, 
  Bell, 
  ChevronDown, 
  ChevronRight, 
  LogOut, 
  Monitor, 
  X, 
  Check, 
  Upload,
  Globe,
  Tv,
  TrendingDown,
  Plus,
  Trash2,
  Utensils,
  Layers
} from "lucide-react";

interface AdminPortalProps {
  admin: AdminUser;
  onLogout: () => void;
  onGoToPos: () => void;
}

type MainTab = 
  | "dashboard"     // Boshqaruv paneli
  | "reports"       // Hisobotlar (Savdo, Mahsulotlar, etc)
  | "finance"       // Moliya
  | "menu"          // Menyu / Taomlar
  | "warehouse"     // Ombor
  | "orders"        // Buyurtmalar
  | "permissions"   // Ruxsat / Xodimlar
  | "settings";     // Sozlamalar

export const AdminPortal: React.FC<AdminPortalProps> = ({ admin, onLogout, onGoToPos }) => {
  const [activeTab, setActiveTab] = useState<MainTab>("dashboard");
  const [reportsExpanded, setReportsExpanded] = useState<boolean>(true);
  const [activeReportSubTab, setActiveReportSubTab] = useState<string>("savdo");

  // Other section expanders
  const [financeExpanded, setFinanceExpanded] = useState<boolean>(true);
  const [activeFinanceSubTab, setActiveFinanceSubTab] = useState<FinanceSubTab>("dashboard");

  const [menuExpanded, setMenuExpanded] = useState<boolean>(true);
  const [activeMenuSubTab, setActiveMenuSubTab] = useState<DishesSubTab>("dishes");
  
  const [warehouseExpanded, setWarehouseExpanded] = useState<boolean>(true);
  const [activeWarehouseSubTab, setActiveWarehouseSubTab] = useState<WarehouseSubTab>("warehouses");

  const [ordersExpanded, setOrdersExpanded] = useState<boolean>(true);
  const [activeOrdersSubTab, setActiveOrdersSubTab] = useState<OrdersSubTab>("orders");

  const [permissionsExpanded, setPermissionsExpanded] = useState<boolean>(true);
  const [activePermissionsSubTab, setActivePermissionsSubTab] = useState<PermissionsSubTab>("employees");

  const [settingsExpanded, setSettingsExpanded] = useState<boolean>(true);
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<"halls" | "payment_types" | "printers" | "audit_logs" | "soliq" | "general">("halls");

  const { receiptConfig, updateReceiptConfig } = useOrder();

  // Settings state
  const [restName, setRestName] = useState(receiptConfig.restaurantName || "iNPOS Restoran");
  const [restAddress, setRestAddress] = useState(receiptConfig.address || "Toshkent shahri");
  const [restPhone, setRestPhone] = useState(receiptConfig.phone || "+998 71 200 00 00");
  const [footerMsg, setFooterMsg] = useState(receiptConfig.footerMessage || "Tashrifingiz uchun rahmat!");
  const [logoUrl, setLogoUrl] = useState(receiptConfig.logoUrl || "");
  const [loginBgUrl, setLoginBgUrl] = useState(receiptConfig.loginBgUrl || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleLoginBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("Fayl hajmi 3MB dan katta bo'lmasligi kerak!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLoginBgUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Profile Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [adminFullName, setAdminFullName] = useState(admin.fullName || "Hakimjon Khayitov");
  const [adminPhone, setAdminPhone] = useState(admin.phone || "+998339939900");
  const [newPassword, setNewPassword] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (admin.companyName) {
      setRestName(admin.companyName);
    }
  }, [admin.companyName]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateReceiptConfig({
      restaurantName: restName,
      address: restAddress,
      phone: restPhone,
      footerMessage: footerMsg,
      logoUrl: logoUrl,
      loginBgUrl: loginBgUrl
    } as any, admin.cafeId);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: admin.username,
          fullName: adminFullName,
          phone: adminPhone,
          newPassword: newPassword || undefined
        })
      });
      if (res.ok) {
        setProfileSaved(true);
        setTimeout(() => {
          setProfileSaved(false);
          setIsProfileModalOpen(false);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    pendingCount: 0,
    ordersCount: 0,
    mutationsCount: 0,
    isSyncing: false,
    lastSyncTime: null
  });

  useEffect(() => {
    return subscribeToSync((status) => {
      setSyncStatus(status);
    });
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F5F7FA] text-[#1E293B] overflow-hidden font-sans select-none">
      {/* 1. TOP HEADER MATCHING SCREENSHOT */}
      <header className="bg-white border-b border-gray-200/80 px-6 py-3 flex items-center justify-between shrink-0 z-20">
        {/* Left: Brand Logo & Title & Live Sync Status */}
        <div className="flex items-center gap-3">
          <InposLogo className="h-8 w-auto" variant="navy" />
          <span className="hidden sm:inline-block text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 uppercase tracking-wider">
            Boshqaruv Paneli
          </span>

          {/* Real-time Online / Offline BD Sync Badge */}
          <div className="flex items-center gap-2 ml-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              syncStatus.isOnline 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              <span className={`w-2 h-2 rounded-full ${syncStatus.isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              <span>{syncStatus.isOnline ? "Onlayn" : "Oflayn rejim"}</span>
              {syncStatus.pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                  {syncStatus.pendingCount} ta amal kutilmoqda
                </span>
              )}
            </div>

            {syncStatus.isOnline && syncStatus.pendingCount > 0 && (
              <button
                onClick={() => syncOfflineOrdersToServer(admin.cafeId || "default")}
                disabled={syncStatus.isSyncing}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Oflayn qilingan ishlarni hozir sinxronlash"
              >
                <RotateCw size={12} className={syncStatus.isSyncing ? "animate-spin" : ""} />
                <span>{syncStatus.isSyncing ? "Sinxronlanmoqda..." : "Sinxronlash"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Help, Notifications bell with badge '3', Profile XX avatar */}
        <div className="flex items-center gap-4">
          <a
            href="/kitchen"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors"
          >
            <Tv size={14} />
            <span>Oshxona TV</span>
          </a>

          <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full transition-colors cursor-pointer" title="Yordam">
            <HelpCircle size={18} />
          </button>

          <div className="relative cursor-pointer">
            <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full transition-colors">
              <Bell size={18} />
            </button>
            <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
              3
            </span>
          </div>

          <div 
            onClick={() => setIsProfileModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center gap-2 cursor-pointer hover:bg-blue-100 transition-all shadow-2xs border border-blue-200"
            title="Profil"
          >
            <span className="font-bold text-xs">{admin.username || admin.fullName || "Admin"}</span>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTAINER: SIDEBAR + MAIN VIEW */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR NAVIGATION MATCHING SCREENSHOT (Kattalashtirilgan qulay shriftlar) */}
        <aside className="w-72 lg:w-80 bg-white border-r border-gray-200/80 flex flex-col shrink-0 overflow-y-auto custom-scrollbar select-none text-gray-800">
          <div className="p-3.5 space-y-2">
            {/* ITEM 1: Boshqaruv paneli */}
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all cursor-pointer text-left ${
                activeTab === "dashboard"
                  ? "bg-blue-50/90 text-blue-600 font-bold border-l-4 border-blue-600 shadow-2xs"
                  : "hover:bg-gray-50 text-gray-800 font-semibold"
              }`}
            >
              <LayoutDashboard size={22} className={activeTab === "dashboard" ? "text-blue-600" : "text-gray-500"} />
              <span className="flex-1 text-[15.5px] font-bold tracking-tight">Boshqaruv paneli</span>
            </button>

            {/* ITEM 2: Hisobotlar (Dropdown with Sub-items) */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("reports");
                  setReportsExpanded(!reportsExpanded);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === "reports" ? "text-blue-600 font-bold bg-blue-50/50" : "hover:bg-gray-50 text-gray-800 font-semibold"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <BarChart2 size={22} className={activeTab === "reports" ? "text-blue-600" : "text-gray-500"} />
                  <span className="text-[15.5px] font-bold tracking-tight">Hisobotlar</span>
                </div>
                {reportsExpanded ? <ChevronDown size={19} className="text-gray-500" /> : <ChevronRight size={19} className="text-gray-400" />}
              </button>

              {/* Expanded Sub-items matching image.png */}
              {reportsExpanded && (
                <div className="ml-7 mt-1.5 space-y-1 border-l-2 border-gray-200 pl-3">
                  {[
                    { id: "savdo", label: "Savdo", icon: TrendingUp },
                    { id: "mahsulotlar", label: "Mahsulotlar", icon: Package },
                    { id: "tolovlar", label: "To'lovlar", icon: CreditCard },
                    { id: "kategoriyalar", label: "Kategoriyalar", icon: Folder },
                    { id: "abc", label: "ABC tahlil", icon: BarChart2 },
                    { id: "cheklar", label: "Cheklar", icon: Receipt },
                    { id: "xodimlar", label: "Xodimlar", icon: Users },
                    { id: "stollar", label: "Stollar", icon: Grid },
                    { id: "smenalar", label: "Smenalar", icon: Clock },
                  ].map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeTab === "reports" && activeReportSubTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveTab("reports");
                          setActiveReportSubTab(sub.id);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[14px] transition-colors cursor-pointer text-left ${
                          isSubActive
                            ? "bg-blue-50 text-blue-600 font-bold"
                            : "hover:bg-gray-50 text-gray-700 font-medium"
                        }`}
                      >
                        <SubIcon size={18} className={isSubActive ? "text-blue-600" : "text-gray-400"} />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ITEM 3: Moliya */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("finance");
                  setFinanceExpanded(!financeExpanded);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === "finance" ? "text-blue-600 font-bold bg-blue-50/50" : "hover:bg-gray-50 text-gray-800 font-semibold"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <DollarSign size={22} className={activeTab === "finance" ? "text-blue-600" : "text-gray-500"} />
                  <span className="text-[15.5px] font-bold tracking-tight">Moliya</span>
                </div>
                {financeExpanded ? <ChevronDown size={19} className="text-gray-500" /> : <ChevronRight size={19} className="text-gray-400" />}
              </button>

              {financeExpanded && (
                <div className="ml-7 mt-1.5 space-y-1 border-l-2 border-gray-200 pl-3">
                  {[
                    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                    { id: "xarajatlar", label: "Xarajatlar", icon: TrendingDown },
                  ].map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeTab === "finance" && activeFinanceSubTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveTab("finance");
                          setActiveFinanceSubTab(sub.id as FinanceSubTab);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[14px] transition-colors cursor-pointer text-left ${
                          isSubActive
                            ? "bg-blue-50 text-blue-600 font-bold"
                            : "hover:bg-gray-50 text-gray-700 font-medium"
                        }`}
                      >
                        <SubIcon size={18} className={isSubActive ? "text-blue-600" : "text-gray-400"} />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ITEM 4: Menyu */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("menu");
                  setMenuExpanded(!menuExpanded);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === "menu" ? "text-blue-600 font-bold bg-blue-50/50" : "hover:bg-gray-50 text-gray-800 font-semibold"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <UtensilsCrossed size={22} className={activeTab === "menu" ? "text-blue-600" : "text-gray-500"} />
                  <span className="text-[15.5px] font-bold tracking-tight">Menyu</span>
                </div>
                {menuExpanded ? <ChevronDown size={19} className="text-gray-500" /> : <ChevronRight size={19} className="text-gray-400" />}
              </button>

              {menuExpanded && (
                <div className="ml-7 mt-1.5 space-y-1 border-l-2 border-gray-200 pl-3">
                  {[
                    { id: "dishes", label: "1. Mahsulotlar", icon: Package },
                    { id: "categories", label: "2. Mahsulot kategoriyalari", icon: Folder },
                    { id: "ingredients", label: "3. Ingridientlar", icon: Utensils },
                    { id: "ingredient_groups", label: "4. Ingridient kategoriyalari", icon: Layers },
                  ].map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeTab === "menu" && activeMenuSubTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveTab("menu");
                          setActiveMenuSubTab(sub.id as DishesSubTab);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[14px] transition-colors cursor-pointer text-left ${
                          isSubActive
                            ? "bg-blue-50 text-blue-600 font-bold"
                            : "hover:bg-gray-50 text-gray-700 font-medium"
                        }`}
                      >
                        <SubIcon size={18} className={isSubActive ? "text-blue-600" : "text-gray-400"} />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ITEM 5: Omborlar */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("warehouse");
                  setWarehouseExpanded(!warehouseExpanded);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === "warehouse" ? "text-blue-600 font-bold bg-blue-50/50" : "hover:bg-gray-50 text-gray-800 font-semibold"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Warehouse size={22} className={activeTab === "warehouse" ? "text-blue-600" : "text-gray-500"} />
                  <span className="text-[15.5px] font-bold tracking-tight">Omborlar</span>
                </div>
                {warehouseExpanded ? <ChevronDown size={19} className="text-gray-500" /> : <ChevronRight size={19} className="text-gray-400" />}
              </button>

              {warehouseExpanded && (
                <div className="ml-7 mt-1.5 space-y-1 border-l-2 border-gray-200 pl-3">
                  {[
                    { id: "warehouses", label: "1. Omborlar", icon: Warehouse },
                    { id: "stock", label: "2. Qoldiqlar", icon: Package },
                  ].map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeTab === "warehouse" && activeWarehouseSubTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveTab("warehouse");
                          setActiveWarehouseSubTab(sub.id as WarehouseSubTab);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[14px] transition-colors cursor-pointer text-left ${
                          isSubActive
                            ? "bg-blue-50 text-blue-600 font-bold"
                            : "hover:bg-gray-50 text-gray-700 font-medium"
                        }`}
                      >
                        <SubIcon size={18} className={isSubActive ? "text-blue-600" : "text-gray-400"} />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ITEM 6: Buyurtmalar */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("orders");
                  setOrdersExpanded(!ordersExpanded);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === "orders" ? "text-blue-600 font-bold bg-blue-50/50" : "hover:bg-gray-50 text-gray-800 font-semibold"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <ShoppingBag size={22} className={activeTab === "orders" ? "text-blue-600" : "text-gray-500"} />
                  <span className="text-[15.5px] font-bold tracking-tight">Buyurtmalar</span>
                </div>
                {ordersExpanded ? <ChevronDown size={19} className="text-gray-500" /> : <ChevronRight size={19} className="text-gray-400" />}
              </button>

              {ordersExpanded && (
                <div className="ml-7 mt-1.5 space-y-1 border-l-2 border-gray-200 pl-3">
                  {[
                    { id: "orders", label: "1. Buyurtmalar", icon: ShoppingBag },
                    { id: "customers", label: "2. Mijozlar", icon: Users },
                  ].map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeTab === "orders" && activeOrdersSubTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveTab("orders");
                          setActiveOrdersSubTab(sub.id as OrdersSubTab);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[14px] transition-colors cursor-pointer text-left ${
                          isSubActive
                            ? "bg-blue-50 text-blue-600 font-bold"
                            : "hover:bg-gray-50 text-gray-700 font-medium"
                        }`}
                      >
                        <SubIcon size={18} className={isSubActive ? "text-blue-600" : "text-gray-400"} />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ITEM 7: Ruxsat */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("permissions");
                  setPermissionsExpanded(!permissionsExpanded);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === "permissions" ? "text-blue-600 font-bold bg-blue-50/50" : "hover:bg-gray-50 text-gray-800 font-semibold"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <ShieldCheck size={22} className={activeTab === "permissions" ? "text-blue-600" : "text-gray-500"} />
                  <span className="text-[15.5px] font-bold tracking-tight">Ruxsat</span>
                </div>
                {permissionsExpanded ? <ChevronDown size={19} className="text-gray-500" /> : <ChevronRight size={19} className="text-gray-400" />}
              </button>

              {permissionsExpanded && (
                <div className="ml-7 mt-1.5 space-y-1 border-l-2 border-gray-200 pl-3">
                  {[
                    { id: "employees", label: "1. Xodimlar", icon: Users },
                    { id: "roles", label: "2. Lavozimlar", icon: ShieldCheck },
                  ].map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeTab === "permissions" && activePermissionsSubTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveTab("permissions");
                          setActivePermissionsSubTab(sub.id as PermissionsSubTab);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[14px] transition-colors cursor-pointer text-left ${
                          isSubActive
                            ? "bg-blue-50 text-blue-600 font-bold"
                            : "hover:bg-gray-50 text-gray-700 font-medium"
                        }`}
                      >
                        <SubIcon size={18} className={isSubActive ? "text-blue-600" : "text-gray-400"} />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ITEM 8: Sozlamalar */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("settings");
                  setSettingsExpanded(!settingsExpanded);
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === "settings" ? "text-blue-600 font-bold bg-blue-50/50" : "hover:bg-gray-50 text-gray-800 font-semibold"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Settings size={22} className={activeTab === "settings" ? "text-blue-600" : "text-gray-500"} />
                  <span className="text-[15.5px] font-bold tracking-tight">Sozlamalar</span>
                </div>
                {settingsExpanded ? <ChevronDown size={19} className="text-gray-500" /> : <ChevronRight size={19} className="text-gray-400" />}
              </button>

              {settingsExpanded && (
                <div className="ml-7 mt-1.5 space-y-1 border-l-2 border-gray-200 pl-3">
                  {[
                    { id: "halls", label: "Zallar va stollar", icon: Grid },
                    { id: "payment_types", label: "To'lov turlari", icon: CreditCard },
                    { id: "printers", label: "Printerlar", icon: Printer },
                    { id: "audit_logs", label: "Audit loglar", icon: ShieldAlert },
                    { id: "soliq", label: "Soliq (OFD)", icon: ShieldCheck },
                    { id: "general", label: "Umumiy sozlamalar", icon: Settings },
                  ].map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeTab === "settings" && activeSettingsSubTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveTab("settings");
                          setActiveSettingsSubTab(sub.id as any);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[14px] transition-colors cursor-pointer text-left ${
                          isSubActive
                            ? "bg-blue-50 text-blue-600 font-bold"
                            : "hover:bg-gray-50 text-gray-700 font-medium"
                        }`}
                      >
                        <SubIcon size={18} className={isSubActive ? "text-blue-600" : "text-gray-400"} />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/70">
            <button
              onClick={onLogout}
              className="flex items-center gap-3 text-sm md:text-base font-bold text-gray-700 hover:text-red-600 transition-colors cursor-pointer py-2 px-3 rounded-xl hover:bg-red-50"
            >
              <LogOut size={20} />
              <span>Chiqish</span>
            </button>
          </div>
        </aside>

        {/* DYNAMIC CONTENT VIEW */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* TAB 1: Boshqaruv paneli (iNPOS Dashboard View) */}
          {activeTab === "dashboard" && (
            <InposDashboard 
              cafeId={admin.cafeId} 
              restaurantName={restName} 
              onNavigateTab={(tab: any) => setActiveTab(tab)} 
            />
          )}

          {/* TAB 2: Hisobotlar (Savdo, Mahsulotlar, To'lovlar, Kategoriyalar, ABC tahlil, Cheklar, Xodimlar, Stollar, Smenalar) */}
          {activeTab === "reports" && (
            <ReportsManager 
              cafeId={admin.cafeId} 
              initialSubTab={activeReportSubTab} 
              onSubTabChange={(tab) => setActiveReportSubTab(tab)} 
            />
          )}

          {/* TAB 3: Moliya (Dashboard, Xarajatlar) */}
          {activeTab === "finance" && (
            <FinanceModule 
              cafeId={admin.cafeId} 
              initialSubTab={activeFinanceSubTab} 
              onSubTabChange={(sub) => setActiveFinanceSubTab(sub)} 
            />
          )}

          {/* TAB 4: Menyu (Mahsulotlar, Kategoriyalari, Ingridientlar, Ing-kategoriyalari) */}
          {activeTab === "menu" && (
            <DishesModule 
              cafeId={admin.cafeId} 
              initialSubTab={activeMenuSubTab} 
            />
          )}

          {/* TAB 5: Omborlar (Omborlar, Qoldiqlar) */}
          {activeTab === "warehouse" && (
            <InventoryManager 
              cafeId={admin.cafeId} 
              initialSubTab={activeWarehouseSubTab} 
              onSubTabChange={(sub) => setActiveWarehouseSubTab(sub)} 
            />
          )}

          {/* TAB 6: Buyurtmalar (Buyurtmalar, Mijozlar) */}
          {activeTab === "orders" && (
            <OrdersHistoryManager 
              cafeId={admin.cafeId} 
              initialSubTab={activeOrdersSubTab} 
              onSubTabChange={(sub) => setActiveOrdersSubTab(sub)} 
            />
          )}

          {/* TAB 7: Ruxsat (Xodimlar, Lavozimlar) */}
          {activeTab === "permissions" && (
            <EmployeesManager 
              cafeId={admin.cafeId} 
              initialSubTab={activePermissionsSubTab} 
              onSubTabChange={(sub) => setActivePermissionsSubTab(sub)} 
            />
          )}

          {/* TAB 8: Sozlamalar (Zallar va stollar, To'lov turlari, Soliq, Umumiy) */}
          {activeTab === "settings" && (
            <>
              {activeSettingsSubTab === "halls" && (
                <TablesManager cafeId={admin.cafeId} />
              )}

              {activeSettingsSubTab === "payment_types" && (
                <PaymentTypesManager cafeId={admin.cafeId} />
              )}

              {activeSettingsSubTab === "printers" && (
                <PrintersManager cafeId={admin.cafeId} />
              )}

              {activeSettingsSubTab === "audit_logs" && (
                <AuditLogsManager cafeId={admin.cafeId} />
              )}

              {activeSettingsSubTab === "soliq" && (
                <div className="flex-1 bg-[#F5F7FA] p-6 overflow-y-auto custom-scrollbar">
                  <div className="max-w-4xl mx-auto bg-white border border-gray-200/80 rounded-xl shadow-2xs p-6 space-y-4">
                    <h3 className="text-base font-bold text-gray-900">Soliq (OFD Fiskalize Integratsiyasi)</h3>
                    <SoliqView />
                  </div>
                </div>
              )}

              {activeSettingsSubTab === "general" && (
                <div className="flex-1 bg-[#F5F7FA] p-6 overflow-y-auto custom-scrollbar">
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs p-6 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <h2 className="text-base font-bold text-gray-900">
                          Restoran Sozlamalari & Chek Shablonlari
                        </h2>
                      </div>

                      {savedSuccess && (
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                          <Check size={16} />
                          <span>Sozlamalar muvaffaqiyatli saqlandi!</span>
                        </div>
                      )}

                      <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Restoran nomi
                          </label>
                          <input
                            type="text"
                            value={restName}
                            onChange={(e) => setRestName(e.target.value)}
                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-blue-600"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Manzil
                            </label>
                            <input
                              type="text"
                              value={restAddress}
                              onChange={(e) => setRestAddress(e.target.value)}
                              className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-blue-600"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Telefon raqami
                            </label>
                            <input
                              type="text"
                              value={restPhone}
                              onChange={(e) => setRestPhone(e.target.value)}
                              className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-blue-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Chek osti matni (Footer Message)
                          </label>
                          <input
                            type="text"
                            value={footerMsg}
                            onChange={(e) => setFooterMsg(e.target.value)}
                            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            Kirish ekrani fon rasmi (Login Screen Background)
                          </label>
                          <div className="flex gap-4 items-center">
                            <label className="flex-1 cursor-pointer group">
                              <div className="w-full h-36 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1.5 group-hover:border-blue-500 transition-all overflow-hidden relative shadow-inner">
                                {loginBgUrl ? (
                                  <img src={loginBgUrl} className="w-full h-full object-cover" alt="Login BG preview" />
                                ) : (
                                  <>
                                    <Upload size={20} className="text-gray-400 group-hover:text-blue-500" />
                                    <span className="text-[11px] text-gray-500 group-hover:text-blue-600 font-bold">Fon rasmini yuklash (PNG, JPG)</span>
                                  </>
                                )}
                              </div>
                              <input type="file" className="hidden" accept="image/*" onChange={handleLoginBgUpload} />
                            </label>
                            {loginBgUrl && (
                              <button
                                type="button"
                                onClick={() => setLoginBgUrl("")}
                                className="px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                              >
                                <Trash2 size={14} />
                                <span>O'chirish</span>
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1 italic">
                            Ushbu rasm POS kirish (Login) ekranida soat va parol kiritish oynasi ortida ko'rsatiladi.
                          </p>
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
                          >
                            Sozlamalarni saqlash
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Admin Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md p-6 text-[#1E293B]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Administrator profili</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {profileSaved && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                ✓ Profil muvaffaqiyatli yangilandi!
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">F.I.Sh</label>
                <input
                  type="text"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Telefon raqami</label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Yangi parol (agar o'zgartirsangiz)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-2xs"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
