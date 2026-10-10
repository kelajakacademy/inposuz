import React, { useState, useEffect } from "react";
import { Product } from "../../types";
import { formatCurrency } from "../../lib/utils";
import { 
  UtensilsCrossed, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  FolderPlus, 
  Image, 
  Boxes, 
  Check, 
  X, 
  RotateCw,
  AlertCircle
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

export const MenuManager: React.FC<{ cafeId?: string }> = ({ cafeId = "default" }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Dish modal
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Product | null>(null);
  const [dishName, setDishName] = useState("");
  const [dishPrice, setDishPrice] = useState("");
  const [dishCategoryId, setDishCategoryId] = useState("");
  const [dishStock, setDishStock] = useState("");
  const [dishImage, setDishImage] = useState("");
  const [dishDescription, setDishDescription] = useState("");
  const [dishMxikCode, setDishMxikCode] = useState("05610001001000000");
  const [dishPackageCode, setDishPackageCode] = useState("1475765");
  const [dishVatPercent, setDishVatPercent] = useState("12");
  const [dishError, setDishError] = useState("");
  const [isSavingDish, setIsSavingDish] = useState(false);

  // Category modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("bg-blue-500");
  const [categoryError, setCategoryError] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products", { headers: { "x-cafe-id": cafeId } }),
        fetch("/api/categories", { headers: { "x-cafe-id": cafeId } })
      ]);
      const prods = await prodRes.json();
      const cats = await catRes.json();
      if (Array.isArray(prods)) setProducts(prods);
      if (Array.isArray(cats)) {
        setCategories(cats);
        if (cats.length > 0 && !dishCategoryId) {
          setDishCategoryId(cats[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load menu data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cafeId]);

  const openAddDishModal = () => {
    setEditingDish(null);
    setDishName("");
    setDishPrice("");
    setDishCategoryId(categories.length > 0 ? categories[0].id : "");
    setDishStock("50");
    setDishImage("");
    setDishDescription("");
    setDishMxikCode("05610001001000000");
    setDishPackageCode("1475765");
    setDishVatPercent("12");
    setDishError("");
    setIsDishModalOpen(true);
  };

  const openEditDishModal = (dish: Product) => {
    setEditingDish(dish);
    setDishName(dish.name);
    setDishPrice(dish.price.toString());
    // Find category ID by name or direct ID
    const catObj = categories.find(c => c.name === dish.category || c.id === dish.category);
    setDishCategoryId(catObj ? catObj.id : (categories[0]?.id || ""));
    setDishStock((dish.stock || 0).toString());
    setDishImage(dish.image || "");
    setDishDescription((dish as any).description || "");
    setDishMxikCode(dish.mxikCode || "05610001001000000");
    setDishPackageCode(dish.packageCode || "1475765");
    setDishVatPercent(dish.vatPercent !== undefined ? dish.vatPercent.toString() : "12");
    setDishError("");
    setIsDishModalOpen(true);
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim() || !dishPrice) {
      setDishError("Taom nomi va narxi kiritilishi shart");
      return;
    }

    const priceNum = parseFloat(dishPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setDishError("Iltimos, to'g'ri narx kiriting");
      return;
    }

    setIsSavingDish(true);
    setDishError("");

    try {
      const res = await fetch("/api/admin/menu/product", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": cafeId
        },
        body: JSON.stringify({
          id: editingDish ? editingDish.id : undefined,
          name: dishName.trim(),
          price: priceNum,
          categoryId: dishCategoryId,
          stock: parseInt(dishStock) || 0,
          image: dishImage.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
          description: dishDescription.trim(),
          mxikCode: dishMxikCode.trim() || "05610001001000000",
          packageCode: dishPackageCode.trim() || "1475765",
          vatPercent: parseFloat(dishVatPercent) || 0
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsDishModalOpen(false);
        fetchData();
      } else {
        setDishError(data.message || "Saqlashda xatolik");
      }
    } catch (err: any) {
      setDishError("Serverga ulanishda xatolik");
    } finally {
      setIsSavingDish(false);
    }
  };

  const handleDeleteDish = async (id: string, name: string) => {
    if (window.confirm(`Haqiqatan ham "${name}" taomini o'chirmoqchimisiz?`)) {
      try {
        const res = await fetch(`/api/admin/menu/product/${id}`, { 
          method: "DELETE",
          headers: { "x-cafe-id": cafeId }
        });
        if (res.ok) {
          fetchData();
        }
      } catch (err) {
        console.error("Failed to delete dish:", err);
      }
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setCategoryError("Kategoriya nomi kiritilishi shart");
      return;
    }

    setIsSavingCategory(true);
    setCategoryError("");

    try {
      const res = await fetch("/api/admin/menu/category", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": cafeId
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          color: categoryColor,
          icon: "Utensils"
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsCategoryModalOpen(false);
        setCategoryName("");
        fetchData();
      } else {
        setCategoryError(data.message || "Xatolik");
      }
    } catch (err: any) {
      setCategoryError("Serverga ulanishda xatolik");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) {
      const catObj = categories.find(c => c.id === selectedCategory);
      if (!catObj || p.category !== catObj.name) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !(p.category || "").toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#121417] p-6 lg:p-8 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Меню и Блюда
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Restoran taomlari, narxlari, ombor qoldiqlari va toifalarini to'liq boshqarish
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-[#1E2227] hover:bg-[#25292F] text-gray-300 hover:text-white border border-gray-800 text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <FolderPlus size={15} />
            <span>Новая категория</span>
          </button>

          <button
            onClick={openAddDishModal}
            className="px-4 py-2.5 rounded-xl bg-[#F39C12] hover:bg-[#E67E22] text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Добавить блюдо</span>
          </button>
        </div>
      </div>

      {/* Categories Horizontal Tabs */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors ${
            selectedCategory === "all"
              ? "bg-white text-black shadow"
              : "bg-[#181A1F] text-gray-400 hover:text-white border border-gray-800"
          }`}
        >
          Все категории ({products.length})
        </button>
        {categories.map((cat) => {
          const count = products.filter(p => p.category === cat.name || p.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-2 ${
                selectedCategory === cat.name
                  ? "bg-[#F39C12] text-black shadow"
                  : "bg-[#181A1F] text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-[10px] opacity-70 px-1.5 py-0.2 bg-black/20 rounded">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div className="mb-6 relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск блюд по названию..."
          className="w-full bg-[#181A1F] border border-gray-800 text-white rounded-xl pl-10 pr-3.5 py-2.5 text-xs placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Dishes Grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 mb-4">
            <UtensilsCrossed size={32} />
          </div>
          <h3 className="text-base font-bold text-gray-300">Блюда не найдены</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Ushbu toifada hali taomlar kiritilmagan. "+ Добавить блюдо" tugmasi orqali yangi taom qo'shing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredProducts.map((dish) => (
            <div
              key={dish.id}
              className="bg-[#181A1F] rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all flex flex-col group shadow-lg"
            >
              {/* Image */}
              <div className="h-36 bg-[#121417] relative overflow-hidden">
                <img
                  src={dish.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"}
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c";
                  }}
                />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">
                  {dish.category}
                </span>

                {dish.stock !== undefined && (
                  <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[10px] font-black border backdrop-blur-md ${
                    dish.stock <= 5 
                      ? "bg-red-500/80 text-white border-red-400/30" 
                      : "bg-emerald-500/80 text-white border-emerald-400/30"
                  }`}>
                    {dish.stock} dona
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white line-clamp-1 mb-1" title={dish.name}>
                    {dish.name}
                  </h3>
                  <p className="text-base font-black text-emerald-400 mb-3">
                    {formatCurrency(dish.price)}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-800/80">
                  <button
                    onClick={() => openEditDishModal(dish)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/5 transition-colors"
                  >
                    <Edit3 size={13} />
                    <span>Таҳрирлаш</span>
                  </button>
                  <button
                    onClick={() => handleDeleteDish(dish.id, dish.name)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors border border-red-500/20"
                    title="O'chirish"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isDishModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181A1F] border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-4">
              <div>
                <h3 className="text-lg font-black text-white">
                  {editingDish ? "Таомни таҳрирлаш" : "Янги таом қўшиш"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Menyuga yangi pozitsiya kiritish va narx belgilash
                </p>
              </div>
              <button
                onClick={() => setIsDishModalOpen(false)}
                className="text-gray-500 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {dishError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{dishError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDish} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Таом номи *
                </label>
                <input
                  type="text"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="Masalan: Qozon Kabob"
                  required
                  className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">
                    Нархи (сўм) *
                  </label>
                  <input
                    type="number"
                    value={dishPrice}
                    onChange={(e) => setDishPrice(e.target.value)}
                    placeholder="Masalan: 45000"
                    required
                    className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">
                    Омбор қолдиғи (dona)
                  </label>
                  <input
                    type="number"
                    value={dishStock}
                    onChange={(e) => setDishStock(e.target.value)}
                    placeholder="50"
                    className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Категорияси
                </label>
                <select
                  value={dishCategoryId}
                  onChange={(e) => setDishCategoryId(e.target.value)}
                  className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Расм ҳаволаси (Image URL)
                </label>
                <input
                  type="url"
                  value={dishImage}
                  onChange={(e) => setDishImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Солиқ (OFD) Фискал параметрлари */}
              <div className="p-3 bg-black/40 border border-amber-500/20 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    🏛️ Солиқ (ОФД) фискал реквизитлари
                  </span>
                  <span className="text-[10px] text-gray-500">soliq.uz</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-0.5">
                      МХИК Коди (17 рақам)
                    </label>
                    <input
                      type="text"
                      value={dishMxikCode}
                      onChange={(e) => setDishMxikCode(e.target.value)}
                      placeholder="05610001001000000"
                      className="w-full bg-[#121417] border border-gray-700 text-white font-mono rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-0.5">
                      Ўрам коди (Упаковка)
                    </label>
                    <input
                      type="text"
                      value={dishPackageCode}
                      onChange={(e) => setDishPackageCode(e.target.value)}
                      placeholder="1475765"
                      className="w-full bg-[#121417] border border-gray-700 text-white font-mono rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-0.5">
                    ҚҚС (НДС) фоизи
                  </label>
                  <select
                    value={dishVatPercent}
                    onChange={(e) => setDishVatPercent(e.target.value)}
                    className="w-full bg-[#121417] border border-gray-700 text-white rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-amber-500"
                  >
                    <option value="12">12% (Асосий ҚҚС ставкаси)</option>
                    <option value="0">0% (ҚҚСсиз / Озод этилган)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsDishModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold transition-colors"
                >
                  Бекор қилиш
                </button>
                <button
                  type="submit"
                  disabled={isSavingDish}
                  className="px-5 py-2.5 rounded-xl bg-[#F39C12] hover:bg-[#E67E22] text-black font-black text-xs transition-colors shadow-lg"
                >
                  {isSavingDish ? "Сақланмоқда..." : "Сақлаш"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181A1F] border border-gray-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <h3 className="text-base font-black text-white">Янги категория қўшиш</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {categoryError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold">
                {categoryError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">
                  Категория номи *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="Masalan: Issiq Taomlar, Ichimliklar"
                  required
                  className="w-full bg-[#121417] border border-gray-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 text-gray-400 text-xs font-bold"
                >
                  Бекор қилиш
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="px-4 py-2 rounded-xl bg-[#F39C12] text-black font-black text-xs"
                >
                  {isSavingCategory ? "Қўшилмоқда..." : "Қўшиш"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
