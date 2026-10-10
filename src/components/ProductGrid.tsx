import React, { useState, useEffect } from "react";
import { Search, Beef, Soup, CupSoda, Salad, UtensilsCrossed, Coffee, LayoutGrid, Zap, Fingerprint, IceCream, ArrowLeft, RefreshCw } from "lucide-react";
import { useOrder } from "../context/OrderContext";
import { CATEGORIES } from "../constants";
import { Product } from "../types";
import { subscribeToSync, syncOfflineOrdersToServer, SyncStatus } from "../utils/offlineSync";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatCurrency } from "../lib/utils";

const iconMap: Record<string, any> = {
  LayoutGrid, Beef, Soup, CupSoda, Salad, UtensilsCrossed, Coffee, Zap, Fingerprint, IceCream
};

export const ProductGrid = () => {
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

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem("pos_cached_products");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [categories, setCategories] = useState<{ id: string; name: string; icon?: string }[]>(() => {
    try {
      const cached = localStorage.getItem("pos_cached_categories");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [{ id: "all", name: "Barcha taomlar", icon: "LayoutGrid" }, ...parsed];
        }
      }
    } catch (e) {}
    return [{ id: "all", name: "Barcha taomlar", icon: "LayoutGrid" }, ...CATEGORIES];
  });

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { addToCart, waiter, resetCurrentTable, linkedCafe } = useOrder();

  const fetchProductList = async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true);
    const activeCafeId = waiter?.cafeId || linkedCafe?.id || "default";
    try {
      // Also trigger offline sync if items are pending
      if (showLoading && syncStatus.pendingCount > 0) {
        syncOfflineOrdersToServer(activeCafeId);
      }
      // 1. Fetch products
      const res = await fetch("/api/products", {
        headers: { "x-cafe-id": activeCafeId }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
          try { localStorage.setItem("pos_cached_products", JSON.stringify(data)); } catch (e) {}
        }
      }

      // 2. Fetch dynamic categories (created in admin panel)
      const catRes = await fetch("/api/categories", {
        headers: { "x-cafe-id": activeCafeId }
      });
      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData) && catData.length > 0) {
          setCategories([
            { id: "all", name: "Barcha taomlar", icon: "LayoutGrid" },
            ...catData.map((c: any) => ({
              id: c.id,
              name: c.name,
              icon: c.icon || "UtensilsCrossed"
            }))
          ]);
          try { localStorage.setItem("pos_cached_categories", JSON.stringify(catData)); } catch (e) {}
        }
      }
    } catch (err) {
      console.error("Failed to fetch products or categories:", err);
    } finally {
      if (showLoading) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProductList();
    // Auto sync products every 10s to immediately catch new items added in admin panel
    const interval = setInterval(() => {
      fetchProductList(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [waiter?.cafeId, linkedCafe?.id]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCategory === "all") return true;

    const activeCatObj = categories.find(c => c.id === selectedCategory);
    const catName = activeCatObj?.name?.toLowerCase();

    return (
      p.categoryId === selectedCategory || 
      p.category === selectedCategory || 
      (catName && p.category?.toLowerCase() === catName)
    );
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#1A1D21] p-6 gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Xush kelibsiz, {waiter?.name}</h1>
            {/* Live Online / Offline Sync Badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              syncStatus.isOnline 
                ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800" 
                : "bg-amber-950/70 text-amber-400 border border-amber-800"
            }`}>
              <span className={`w-2 h-2 rounded-full ${syncStatus.isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span>{syncStatus.isOnline ? "Onlayn" : "Oflayn rejim"}</span>
              {syncStatus.pendingCount > 0 && (
                <span className="text-[10px] text-amber-300">({syncStatus.pendingCount} ta amal kutilmoqda)</span>
              )}
            </div>
          </div>
          <p className="text-gray-400 text-sm">{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3 w-full max-w-lg">
          <button 
            onClick={resetCurrentTable}
            className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-[#25292E] border border-gray-700 text-gray-400 hover:text-white transition-all hover:bg-gray-800 cursor-pointer"
            title="Stollarga qaytish"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              placeholder="Taomlarni qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#25292E] border-none rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#E74C3C] transition-all"
            />
          </div>
          <button
            onClick={() => fetchProductList(true)}
            disabled={isRefreshing}
            className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-[#25292E] border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 transition-all cursor-pointer active:scale-95"
            title="Menyuni yangilash (Serverdan yuklash)"
          >
            <RefreshCw size={18} className={isRefreshing ? "animate-spin text-[#E74C3C]" : ""} />
          </button>
        </div>
      </header>

      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none">
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon || ""] || UtensilsCrossed;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border cursor-pointer",
                selectedCategory === cat.id
                  ? "bg-[#E74C3C] text-white border-[#E74C3C] shadow-md"
                  : "bg-[#25292E] text-gray-400 border-gray-700 hover:text-white hover:bg-gray-800"
              )}
            >
              <div className="flex items-center gap-2">
                <Icon size={16} />
                {cat.name}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => addToCart(product)}
                className="bg-[#25292E] rounded-2xl p-4 flex flex-col gap-3 relative border border-gray-700 cursor-pointer group hover:border-[#E74C3C] transition-all"
              >
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-800">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                
                <div className={cn(
                  "absolute top-6 right-6 px-2 py-1 rounded text-[10px] border whitespace-nowrap",
                  product.stock <= 5 
                    ? "bg-[#1A1D21] text-[#E74C3C] border-[#E74C3C]" 
                    : "bg-[#1A1D21] text-gray-500 border-gray-700"
                )}>
                  {product.stock > 0 ? `${product.stock} items left` : 'Out of Stock'}
                </div>

                <div className={cn(product.stock === 0 && "opacity-50")}>
                  <h3 className="font-semibold text-gray-100 group-hover:text-[#E74C3C] transition-colors">{product.name}</h3>
                  <p className="text-[#E74C3C] font-bold mt-1">{formatCurrency(product.price)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
