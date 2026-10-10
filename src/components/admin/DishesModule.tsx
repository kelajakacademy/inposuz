import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/utils";
import { saveOfflineMutation } from "../../utils/offlineSync";
import { 
  Info, 
  Plus, 
  Trash2, 
  Edit, 
  Printer, 
  Download, 
  X, 
  Check, 
  Layers, 
  Package, 
  ShoppingBag, 
  Utensils, 
  Search,
  ChevronRight,
  ChevronDown,
  Database,
  Building2,
  FolderTree,
  Tag,
  Coffee,
  Sparkles,
  Sliders,
  Link as LinkIcon,
  ArrowRight,
  ArrowLeft,
  FileText,
  Calculator
} from "lucide-react";

export type DishesSubTab = 
  | "stocks"             // Склады
  | "departments"        // Отделы
  | "categories"         // Категории
  | "ingredient_groups"  // Группы ингредиентов
  | "ingredients"        // Ингредиенты
  | "semi_finished"      // Полуфабрикаты
  | "dishes"             // Блюда
  | "linked_dishes"      // Связанные блюда
  | "modifiers";         // Модификаторы

interface StockItem {
  id: string;
  name: string;
  cafeId?: string;
  createdAt?: string;
}

interface DepartmentItem {
  id: string;
  name: string;
  stockId?: string;
  printerType?: string;
  servicePercent?: number;
}

interface CategoryItem {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  deptId?: string;
  deptName?: string;
  stockId?: string;
  stockName?: string;
  btnColor?: string;
  textColor?: string;
  fontSize?: number;
  parentId?: string;
  dishesCount?: number;
}

interface RecipeIngredient {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  costPrice: number;
  supplierPrice?: number;
}

interface DishItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  categoryId?: string;
  stock?: number;
  costPrice?: number;
  profit?: number;
  markup?: number;
  btnColor?: string;
  textColor?: string;
  fontSize?: number;
  timeMinutes?: number;
  article1C?: string;
  isVisible?: boolean | number;
  isPiece?: boolean | number;
  isNoPercent?: boolean | number;
  isCommon?: boolean | number;
  recipe?: string | RecipeIngredient[];
  deptId?: string;
  stockId?: string;
  description?: string;
  mxikCode?: string;
  packageCode?: string;
}

interface ModifierItem {
  id: string;
  name: string;
  price: number;
  category?: string;
}

interface IngredientGroupItem {
  id: string;
  name: string;
}

interface IngredientItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minLimit: number;
  costPrice: number;
  supplier?: string;
}

interface SemiFinishedItem {
  id: string;
  name: string;
  unit: string;
  costPrice: number;
  stockId?: string;
  recipe?: string;
}

interface DishesModuleProps {
  initialSubTab?: DishesSubTab;
  cafeId?: string;
}

export const DishesModule: React.FC<DishesModuleProps> = ({ 
  initialSubTab = "dishes", 
  cafeId = "default" 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<DishesSubTab>(initialSubTab);

  const safeCafeId = cafeId && cafeId !== "undefined" && cafeId !== "null" ? cafeId : "default";

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Core Data with instant localStorage cache for real zero-latency offline reliability
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      const cached = localStorage.getItem("pos_cached_categories");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [dishes, setDishes] = useState<DishItem[]>(() => {
    try {
      const cached = localStorage.getItem("pos_cached_products");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [ingredientGroups, setIngredientGroups] = useState<IngredientGroupItem[]>([]);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [semiFinished, setSemiFinished] = useState<SemiFinishedItem[]>([]);
  const [modifiers, setModifiers] = useState<ModifierItem[]>([]);

  // Selection states for toolbar actions
  const [selectedStockIds, setSelectedStockIds] = useState<string[]>([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);

  // Toast / alerts
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ================= MODALS & FORM STATES =================
  // 1. Stocks Modal
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [newStockName, setNewStockName] = useState("");
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);

  // 2. Departments Modal
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptStockId, setNewDeptStockId] = useState("");
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);

  // 3. Category & Subcategory Modal (Screenshots 1, 2, 3)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [catName, setCatName] = useState("");
  const [catParentId, setCatParentId] = useState("");
  const [catDeptId, setCatDeptId] = useState("");
  const [catStockId, setCatStockId] = useState("");
  const [catBtnColor, setCatBtnColor] = useState("#000000");
  const [catTextColor, setCatTextColor] = useState("#419aff");
  const [catFontSize, setCatFontSize] = useState(16);

  // Subcategory form in same modal (Screenshot 3)
  const [subcatName, setSubcatName] = useState("");
  const [subcatBtnColor, setSubcatBtnColor] = useState("#000000");
  const [subcatTextColor, setSubcatTextColor] = useState("#419aff");
  const [subcatFontSize, setSubcatFontSize] = useState(16);

  // Expanded category sub-tables (Screenshot 2)
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({
    "cat-wines": true
  });

  // 4. Dishes Search & Filter States (Screenshots 4 & 5)
  const [dishSearchQuery, setDishSearchQuery] = useState("");
  const [dishFilterStock, setDishFilterStock] = useState("");
  const [dishFilterDept, setDishFilterDept] = useState("");
  const [dishFilterCat, setDishFilterCat] = useState("");
  const [dishesPerPage, setDishesPerPage] = useState(100);

  // Expanded dish calculation details (Screenshot 7)
  const [expandedDishCalcIds, setExpandedDishCalcIds] = useState<Record<string, boolean>>({});

  // 5. Dish Recipe / Calculation Creator Modal (Screenshot 6)
  const [isAddDishModalOpen, setIsAddDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<DishItem | null>(null);
  const [dishFormName, setDishFormName] = useState("");
  const [dishFormCatId, setDishFormCatId] = useState("");
  const [dishFormPrice, setDishFormPrice] = useState("");
  const [dishFormArticle1C, setDishFormArticle1C] = useState("");
  const [dishFormBtnColor, setDishFormBtnColor] = useState("#fff71f");
  const [dishFormTextColor, setDishFormTextColor] = useState("#000000");
  const [dishFormFontSize, setDishFormFontSize] = useState(16);
  const [dishFormTimeMinutes, setDishFormTimeMinutes] = useState(10);
  const [dishFormIsVisible, setDishFormIsVisible] = useState(true);
  const [dishFormIsPiece, setDishFormIsPiece] = useState(true);
  const [dishFormIsNoPercent, setDishFormIsNoPercent] = useState(false);
  const [dishFormIsCommon, setDishFormIsCommon] = useState(false);

  // Recipe ingredients builder
  const [recipeSelectedTab, setRecipeSelectedTab] = useState<"ingredients" | "semi_finished" | "import">("ingredients");
  const [recipeSearchQuery, setRecipeSearchQuery] = useState("");
  const [recipeFilterGroup, setRecipeFilterGroup] = useState("");
  const [recipeFilterStock, setRecipeFilterStock] = useState("");
  const [availableSelectedIngIds, setAvailableSelectedIngIds] = useState<string[]>([]);
  const [selectedRecipeItems, setSelectedRecipeItems] = useState<RecipeIngredient[]>([]);

  // Show Toast
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchData = async () => {
    try {
      const headers = { "x-cafe-id": safeCafeId };

      const safeFetch = async (url: string) => {
        try {
          const res = await fetch(url, { headers });
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn("Fetch error for " + url, e);
        }
        return null;
      };

      const [
        dataStocks, 
        dataDepts, 
        dataCats, 
        dataDishes, 
        dataIngGroups, 
        dataIngs, 
        dataSemi, 
        dataMods
      ] = await Promise.all([
        safeFetch("/api/stocks"),
        safeFetch("/api/departments"),
        safeFetch("/api/categories"),
        safeFetch("/api/products"),
        safeFetch("/api/ingredient-groups"),
        safeFetch("/api/inventory"),
        safeFetch("/api/semi-finished"),
        safeFetch("/api/modifiers"),
      ]);

      if (Array.isArray(dataStocks)) setStocks(dataStocks);
      if (Array.isArray(dataDepts)) setDepartments(dataDepts);
      if (Array.isArray(dataCats) && dataCats.length > 0) {
        setCategories(dataCats);
        try { localStorage.setItem("pos_cached_categories", JSON.stringify(dataCats)); } catch(e){}
      }
      if (Array.isArray(dataDishes) && dataDishes.length > 0) {
        setDishes(dataDishes);
        try { localStorage.setItem("pos_cached_products", JSON.stringify(dataDishes)); } catch(e){}
      }
      if (Array.isArray(dataIngGroups)) setIngredientGroups(dataIngGroups);
      if (Array.isArray(dataIngs)) setIngredients(dataIngs);
      if (Array.isArray(dataSemi)) setSemiFinished(dataSemi);
      if (Array.isArray(dataMods)) setModifiers(dataMods);
    } catch (err) {
      console.error("Failed to load Dishes module data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [safeCafeId]);

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  // Helpers
  const getStockName = (stockId?: string) => {
    if (!stockId) return "—";
    const found = stocks.find(s => s.id === stockId);
    return found ? found.name : stockId;
  };

  const getDeptName = (deptId?: string) => {
    if (!deptId) return "—";
    const found = departments.find(d => d.id === deptId);
    return found ? found.name : deptId;
  };

  // ================= STOCKS OPERATIONS =================
  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStockName.trim()) return;

    try {
      const url = editingStock ? `/api/stocks/${editingStock.id}` : "/api/stocks";
      const method = editingStock ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
        body: JSON.stringify({ name: newStockName.trim() })
      });
      if (res.ok) {
        showToast(editingStock ? "Склад успешно обновлен!" : "Склад успешно создан!");
        setIsAddStockOpen(false);
        setEditingStock(null);
        setNewStockName("");
        fetchData();
      }
    } catch (err) {
      showToast("Ошибка при сохранении склада", "error");
    }
  };

  const handleDeleteSelectedStocks = async () => {
    if (selectedStockIds.length === 0) return;
    const toDelete = [...selectedStockIds];
    setStocks(prev => prev.filter(s => !toDelete.includes(s.id)));
    setSelectedStockIds([]);
    showToast(`${toDelete.length} ta ombor o'chirildi`);

    for (const id of toDelete) {
      fetch(`/api/stocks/${id}`, { method: "DELETE", headers: { "x-cafe-id": safeCafeId } }).catch(console.error);
    }
  };

  // ================= DEPARTMENTS OPERATIONS =================
  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    try {
      const url = editingDept ? `/api/departments/${editingDept.id}` : "/api/departments";
      const method = editingDept ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-cafe-id": safeCafeId },
        body: JSON.stringify({ 
          name: newDeptName.trim(),
          stockId: newDeptStockId || null
        })
      });
      if (res.ok) {
        showToast(editingDept ? "Bo'lim muvaffaqiyatli yangilandi!" : "Bo'lim muvaffaqiyatli yaratildi!");
        setIsAddDeptOpen(false);
        setEditingDept(null);
        setNewDeptName("");
        setNewDeptStockId("");
        fetchData();
      }
    } catch (err) {
      showToast("Bo'limni saqlashda xatolik yuz berdi", "error");
    }
  };

  const handleDeleteSelectedDepts = async () => {
    if (selectedDeptIds.length === 0) return;
    const toDelete = [...selectedDeptIds];
    setDepartments(prev => prev.filter(d => !toDelete.includes(d.id)));
    setSelectedDeptIds([]);
    showToast(`${toDelete.length} ta bo'lim o'chirildi`);

    for (const id of toDelete) {
      fetch(`/api/departments/${id}`, { method: "DELETE", headers: { "x-cafe-id": safeCafeId } }).catch(console.error);
    }
  };

  // ================= CATEGORIES OPERATIONS (Screenshots 1, 2, 3) =================
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const catId = editingCategory ? editingCategory.id : `cat-${Date.now()}`;
    const selectedDept = departments.find(d => d.id === catDeptId);
    const selectedStock = stocks.find(s => s.id === catStockId);

    const newCatItem: CategoryItem = {
      id: catId,
      name: catName.trim(),
      parentId: catParentId || undefined,
      deptId: catDeptId || undefined,
      deptName: selectedDept ? selectedDept.name : undefined,
      stockId: catStockId || undefined,
      stockName: selectedStock ? selectedStock.name : undefined,
      btnColor: catBtnColor,
      textColor: catTextColor,
      fontSize: Number(catFontSize) || 16,
      dishesCount: editingCategory ? editingCategory.dishesCount : 0
    };

    // 1. Instant optimistic state update (real zero-latency)
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === catId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newCatItem;
        return copy;
      }
      return [...prev, newCatItem];
    });

    // 2. Cache locally
    try {
      const stored = JSON.parse(localStorage.getItem("pos_cached_categories") || "[]");
      const filtered = stored.filter((c: any) => c.id !== catId);
      localStorage.setItem("pos_cached_categories", JSON.stringify([...filtered, newCatItem]));
    } catch (err) {}

    showToast(editingCategory ? "Kategoriya yangilandi!" : "Kategoriya muvaffaqiyatli saqlandi!");
    setIsCategoryModalOpen(false);
    setEditingCategory(null);

    // 3. Queue offline mutation for DB sync
    saveOfflineMutation("category", "upsert", catId, {
      id: catId,
      name: catName.trim(),
      parentId: catParentId || null,
      deptId: catDeptId || null,
      deptName: selectedDept ? selectedDept.name : null,
      stockId: catStockId || null,
      stockName: selectedStock ? selectedStock.name : null,
      btnColor: catBtnColor,
      textColor: catTextColor,
      fontSize: Number(catFontSize) || 16
    });

    // 4. Persist to API if reachable
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-cafe-id": safeCafeId },
        body: JSON.stringify({
          id: catId,
          name: catName.trim(),
          parentId: catParentId || null,
          deptId: catDeptId || null,
          deptName: selectedDept ? selectedDept.name : null,
          stockId: catStockId || null,
          stockName: selectedStock ? selectedStock.name : null,
          btnColor: catBtnColor,
          textColor: catTextColor,
          fontSize: Number(catFontSize) || 16
        })
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData.category) {
          setCategories(prev => prev.map(c => c.id === catId ? { ...c, ...resData.category } : c));
        }
      }
    } catch (err) {
      console.warn("Category saved locally in offline queue:", err);
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcatName.trim() || !catParentId) {
      showToast("Iltimos, ota kategoriyani tanlang va subkategoriya nomini kiriting!", "error");
      return;
    }

    const subId = `cat-sub-${Date.now()}`;
    const parent = categories.find(c => c.id === catParentId);

    const newSubCat: CategoryItem = {
      id: subId,
      name: subcatName.trim(),
      parentId: catParentId,
      deptId: parent?.deptId,
      deptName: parent?.deptName,
      stockId: parent?.stockId,
      stockName: parent?.stockName,
      btnColor: subcatBtnColor,
      textColor: subcatTextColor,
      fontSize: Number(subcatFontSize) || 16,
      dishesCount: 0
    };

    // Instant optimistic state update
    setCategories(prev => [...prev, newSubCat]);
    try {
      const stored = JSON.parse(localStorage.getItem("pos_cached_categories") || "[]");
      localStorage.setItem("pos_cached_categories", JSON.stringify([...stored, newSubCat]));
    } catch (err) {}

    showToast("Subkategoriya muvaffaqiyatli yaratildi!");
    setSubcatName("");
    setIsCategoryModalOpen(false);

    // Queue offline mutation
    saveOfflineMutation("category", "upsert", subId, {
      id: subId,
      name: subcatName.trim(),
      parentId: catParentId,
      deptId: parent?.deptId || null,
      deptName: parent?.deptName || null,
      stockId: parent?.stockId || null,
      stockName: parent?.stockName || null,
      btnColor: subcatBtnColor,
      textColor: subcatTextColor,
      fontSize: Number(subcatFontSize) || 16
    });

    try {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cafe-id": safeCafeId },
        body: JSON.stringify({
          id: subId,
          name: subcatName.trim(),
          parentId: catParentId,
          deptId: parent?.deptId || null,
          deptName: parent?.deptName || null,
          stockId: parent?.stockId || null,
          stockName: parent?.stockName || null,
          btnColor: subcatBtnColor,
          textColor: subcatTextColor,
          fontSize: Number(subcatFontSize) || 16
        })
      });
    } catch (err) {
      console.warn("Subcategory saved in offline queue:", err);
    }
  };

  const handleDeleteSelectedCategories = async () => {
    if (selectedCategoryIds.length === 0) {
      showToast("O'chirish uchun avval ro'yxatdan kategoriyalarni tanlang!", "error");
      return;
    }
    const toDelete = [...selectedCategoryIds];

    // Instant UI update
    setCategories(prev => prev.filter(c => !toDelete.includes(c.id) && !toDelete.includes(c.parentId || "")));
    setSelectedCategoryIds([]);
    showToast(`${toDelete.length} ta kategoriya muvaffaqiyatli o'chirildi!`);

    try {
      const stored = JSON.parse(localStorage.getItem("pos_cached_categories") || "[]");
      localStorage.setItem("pos_cached_categories", JSON.stringify(stored.filter((c: any) => !toDelete.includes(c.id) && !toDelete.includes(c.parentId))));
    } catch (e) {}

    for (const id of toDelete) {
      saveOfflineMutation("category", "delete", id);
      fetch(`/api/categories/${id}`, { method: "DELETE", headers: { "x-cafe-id": safeCafeId } }).catch(console.error);
    }
  };

  const handleDeleteSingleCategory = async (id: string) => {
    // Instant UI update
    setCategories(prev => prev.filter(c => c.id !== id && c.parentId !== id));
    setSelectedCategoryIds(prev => prev.filter(i => i !== id));
    showToast("Kategoriya muvaffaqiyatli o'chirildi!");

    try {
      const stored = JSON.parse(localStorage.getItem("pos_cached_categories") || "[]");
      localStorage.setItem("pos_cached_categories", JSON.stringify(stored.filter((c: any) => c.id !== id && c.parentId !== id)));
    } catch (e) {}

    saveOfflineMutation("category", "delete", id);
    fetch(`/api/categories/${id}`, { method: "DELETE", headers: { "x-cafe-id": safeCafeId } }).catch(console.error);
  };

  // ================= DISHES RECIPE & CALCULATION OPERATIONS (Screenshots 4, 5, 6, 7) =================
  const handleAddIngredientToRecipe = (ing: IngredientItem) => {
    if (selectedRecipeItems.some(i => i.id === ing.id)) return;
    setSelectedRecipeItems(prev => [
      ...prev,
      {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        quantity: 1,
        costPrice: ing.costPrice,
        supplierPrice: ing.costPrice
      }
    ]);
  };

  const handleRemoveIngredientFromRecipe = (id: string) => {
    setSelectedRecipeItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateRecipeQuantity = (id: string, qty: number) => {
    setSelectedRecipeItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  // Calculate total cost of recipe
  const recipeTotalCost = selectedRecipeItems.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
  const dishPriceNum = Number(dishFormPrice) || 0;
  const calculatedProfit = dishPriceNum - recipeTotalCost;
  const calculatedMarkup = recipeTotalCost > 0 ? (dishPriceNum / recipeTotalCost).toFixed(2) : "1.00";

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishFormName.trim() || !dishFormPrice) {
      showToast("Iltimos, taom nomi va narxini kiriting!", "error");
      return;
    }

    const dishId = editingDish ? editingDish.id : `dish-${Date.now()}`;
    const selectedCat = categories.find(c => c.id === dishFormCatId) || categories[0];

    const newDishItem: DishItem = {
      id: dishId,
      name: dishFormName.trim(),
      price: Number(dishFormPrice),
      categoryId: dishFormCatId || (selectedCat ? selectedCat.id : undefined),
      category: selectedCat ? selectedCat.name : "Taomlar",
      costPrice: recipeTotalCost,
      profit: calculatedProfit,
      markup: Number(calculatedMarkup),
      article1C: dishFormArticle1C.trim() || undefined,
      btnColor: dishFormBtnColor,
      textColor: dishFormTextColor,
      fontSize: Number(dishFormFontSize) || 16,
      timeMinutes: Number(dishFormTimeMinutes) || 10,
      isVisible: dishFormIsVisible ? 1 : 0,
      isPiece: dishFormIsPiece ? 1 : 0,
      isNoPercent: dishFormIsNoPercent ? 1 : 0,
      isCommon: dishFormIsCommon ? 1 : 0,
      recipe: selectedRecipeItems,
      deptId: selectedCat?.deptId,
      stockId: selectedCat?.stockId
    };

    // 1. Instant optimistic state update
    setDishes(prev => {
      const idx = prev.findIndex(d => d.id === dishId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newDishItem;
        return copy;
      }
      return [newDishItem, ...prev];
    });

    // 2. Cache in localStorage
    try {
      const stored = JSON.parse(localStorage.getItem("pos_cached_products") || "[]");
      const filtered = stored.filter((d: any) => d.id !== dishId);
      localStorage.setItem("pos_cached_products", JSON.stringify([newDishItem, ...filtered]));
    } catch (e) {}

    showToast(editingDish ? "Taom muvaffaqiyatli yangilandi!" : "Taom muvaffaqiyatli yaratildi!");
    setIsAddDishModalOpen(false);
    setEditingDish(null);
    setSelectedRecipeItems([]);

    // If currently filtered by a different category, reset category filter so the user immediately sees the new dish!
    if (dishFilterCat && dishFilterCat !== dishFormCatId) {
      setDishFilterCat("");
    }

    const payload = {
      id: dishId,
      name: dishFormName.trim(),
      price: Number(dishFormPrice),
      categoryId: dishFormCatId || (selectedCat ? selectedCat.id : null),
      category: selectedCat ? selectedCat.name : "Taomlar",
      costPrice: recipeTotalCost,
      profit: calculatedProfit,
      markup: Number(calculatedMarkup),
      article1C: dishFormArticle1C.trim() || null,
      btnColor: dishFormBtnColor,
      textColor: dishFormTextColor,
      fontSize: Number(dishFormFontSize) || 16,
      timeMinutes: Number(dishFormTimeMinutes) || 10,
      isVisible: dishFormIsVisible ? 1 : 0,
      isPiece: dishFormIsPiece ? 1 : 0,
      isNoPercent: dishFormIsNoPercent ? 1 : 0,
      isCommon: dishFormIsCommon ? 1 : 0,
      recipe: selectedRecipeItems,
      deptId: selectedCat?.deptId || null,
      stockId: selectedCat?.stockId || null
    };

    // Queue offline mutation for DB sync
    saveOfflineMutation("product", "upsert", dishId, payload);

    // 3. Persist to API if reachable
    try {
      const url = editingDish ? `/api/products/${editingDish.id}` : "/api/products";
      const method = editingDish ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-cafe-id": safeCafeId },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.product) {
          setDishes(prev => prev.map(d => d.id === dishId ? { ...d, ...data.product } : d));
        }
      }
    } catch (err) {
      console.warn("Dish saved in offline queue:", err);
    }
  };

  const handleDeleteSelectedDishes = async () => {
    if (selectedDishIds.length === 0) {
      showToast("O'chirish uchun avval ro'yxatdan taomlarni tanlang!", "error");
      return;
    }
    const toDelete = [...selectedDishIds];

    // Instant optimistic state update
    setDishes(prev => prev.filter(d => !toDelete.includes(d.id)));
    setSelectedDishIds([]);
    showToast(`${toDelete.length} ta taom muvaffaqiyatli o'chirildi!`);

    try {
      const stored = JSON.parse(localStorage.getItem("pos_cached_products") || "[]");
      localStorage.setItem("pos_cached_products", JSON.stringify(stored.filter((d: any) => !toDelete.includes(d.id))));
    } catch (e) {}

    for (const id of toDelete) {
      saveOfflineMutation("product", "delete", id);
      fetch(`/api/products/${id}`, { method: "DELETE", headers: { "x-cafe-id": safeCafeId } }).catch(console.error);
    }
  };

  const handleDeleteSingleDish = async (id: string) => {
    setDishes(prev => prev.filter(d => d.id !== id));
    setSelectedDishIds(prev => prev.filter(i => i !== id));
    showToast("Taom muvaffaqiyatli o'chirildi!");

    try {
      const stored = JSON.parse(localStorage.getItem("pos_cached_products") || "[]");
      localStorage.setItem("pos_cached_products", JSON.stringify(stored.filter((d: any) => d.id !== id)));
    } catch (e) {}

    saveOfflineMutation("product", "delete", id);
    fetch(`/api/products/${id}`, { method: "DELETE", headers: { "x-cafe-id": safeCafeId } }).catch(console.error);
  };

  // Filtered dishes
  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = !dishSearchQuery || dish.name.toLowerCase().includes(dishSearchQuery.toLowerCase());
    const matchesStock = !dishFilterStock || dish.stockId === dishFilterStock;
    const matchesDept = !dishFilterDept || dish.deptId === dishFilterDept;
    const matchesCat = !dishFilterCat || dish.categoryId === dishFilterCat || dish.category === dishFilterCat;
    return matchesSearch && matchesStock && matchesDept && matchesCat;
  });

  // Category Tree: Group parent categories and their subcategories
  const parentCategories = categories.filter(c => !c.parentId || c.parentId === "" || c.parentId === "null" || c.parentId === null);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parentId && c.parentId === parentId && c.parentId !== "");

  return (
    <div className="flex-1 flex flex-col h-full bg-[#ECEEF1] overflow-hidden text-gray-800 font-sans">
      {/* 1. TOP SUB-NAV BAR (Tabs for the 9 submodules in Uzbek) */}
      <div className="bg-[#58606E] text-white px-4 py-1.5 flex items-center justify-between shadow-sm shrink-0 border-b border-[#434954]">
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar text-xs font-semibold">
          {[
            { id: "dishes" as DishesSubTab, label: "Mahsulotlar" },
            { id: "categories" as DishesSubTab, label: "Mahsulot kategoriyalari" },
            { id: "ingredients" as DishesSubTab, label: "Ingridientlar" },
            { id: "ingredient_groups" as DishesSubTab, label: "Ingridient kategoriyalari" },
            { id: "semi_finished" as DishesSubTab, label: "Yarim tayyor mahsulotlar" },
            { id: "departments" as DishesSubTab, label: "Bo'limlar" },
            { id: "stocks" as DishesSubTab, label: "Omborlar" },
            { id: "linked_dishes" as DishesSubTab, label: "Bog'langan mahsulotlar" },
            { id: "modifiers" as DishesSubTab, label: "Modifikatorlar" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded transition-all cursor-pointer whitespace-nowrap ${
                activeSubTab === tab.id
                  ? "bg-[#ECEEF1] text-[#2B303A] font-bold shadow-sm"
                  : "text-gray-200 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. DYNAMIC SUBMODULE VIEW */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* Toast Alert */}
        {message && (
          <div className={`mb-3 px-4 py-2 rounded text-xs font-bold flex items-center gap-2 shadow-sm ${
            message.type === "success" 
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800" 
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            <Check size={14} />
            <span>{message.text}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: OMBORLAR (STOCKS)                                                 */}
        {/* ========================================================================= */}
        {activeSubTab === "stocks" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingStock(null);
                  setNewStockName("");
                  setIsAddStockOpen(true);
                }}
                className="px-4 py-2 rounded bg-[#70B328] hover:bg-[#609B20] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>QO'SHISH</span>
              </button>

              <button
                onClick={() => {
                  if (selectedStockIds.length !== 1) return;
                  const item = stocks.find(s => s.id === selectedStockIds[0]);
                  if (item) {
                    setEditingStock(item);
                    setNewStockName(item.name);
                    setIsAddStockOpen(true);
                  }
                }}
                disabled={selectedStockIds.length !== 1}
                className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wide transition-all shadow-xs ${
                  selectedStockIds.length === 1
                    ? "bg-[#CCD1D9] text-gray-800 hover:bg-[#BAC0CB] cursor-pointer"
                    : "bg-[#E5E8EB] text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                TAHRIRLASH
              </button>

              <button
                onClick={handleDeleteSelectedStocks}
                disabled={selectedStockIds.length === 0}
                className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wide transition-all shadow-xs ${
                  selectedStockIds.length > 0
                    ? "bg-[#FF6F61] text-white hover:bg-[#E85B4D] cursor-pointer"
                    : "bg-[#E5E8EB] text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                O'CHIRISH
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded bg-[#00A3E0] hover:bg-[#008BBF] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all cursor-pointer"
              >
                CHOP ETISH
              </button>

              <button
                onClick={() => {
                  const csv = "No,Nomi\n" + stocks.map((s, idx) => `${idx + 1},"${s.name}"`).join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `stocks_${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                }}
                className="px-4 py-2 rounded bg-[#00A3E0] hover:bg-[#008BBF] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all cursor-pointer"
              >
                EKSPORT
              </button>
            </div>

            {/* Stocks Table */}
            <div className="bg-white border border-[#D9DDE2] rounded shadow-sm overflow-hidden">
              <div className="bg-gradient-to-b from-[#6A7280] to-[#58606E] text-white px-4 py-2 text-sm font-bold tracking-wide flex items-center gap-1.5">
                <span>Omborlar</span>
                <span className="text-gray-300 cursor-help" title="Omborlar ro'yxati">
                  <Info size={14} />
                </span>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#ECEEF1] text-gray-700 font-bold border-b border-[#D9DDE2]">
                    <th className="py-2.5 px-3 w-10 text-center border-r border-[#D9DDE2]">
                      <input
                        type="checkbox"
                        checked={stocks.length > 0 && selectedStockIds.length === stocks.length}
                        onChange={(e) => setSelectedStockIds(e.target.checked ? stocks.map(s => s.id) : [])}
                        className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3 w-14 text-center border-r border-[#D9DDE2]">№</th>
                    <th className="py-2.5 px-4 font-bold">Nomi</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock, idx) => {
                    const isSelected = selectedStockIds.includes(stock.id);
                    return (
                      <tr
                        key={stock.id}
                        onClick={() => setSelectedStockIds(prev => prev.includes(stock.id) ? prev.filter(i => i !== stock.id) : [...prev, stock.id])}
                        className={`border-b border-[#E9ECF0] transition-colors cursor-pointer ${
                          isSelected ? "bg-[#D6EAF8] text-[#1B4F72] font-semibold" : idx % 2 === 1 ? "bg-[#F9FAFB] hover:bg-[#F2F4F7]" : "bg-white hover:bg-[#F2F4F7]"
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2]" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => setSelectedStockIds(prev => prev.includes(stock.id) ? prev.filter(i => i !== stock.id) : [...prev, stock.id])}
                            className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2] font-semibold text-gray-700">{idx + 1}</td>
                        <td className="py-2.5 px-4 text-gray-900 font-medium">{stock.name}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: BO'LIMLAR (DEPARTMENTS)                                           */}
        {/* ========================================================================= */}
        {activeSubTab === "departments" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingDept(null);
                  setNewDeptName("");
                  setNewDeptStockId("");
                  setIsAddDeptOpen(true);
                }}
                className="px-4 py-2 rounded bg-[#70B328] hover:bg-[#609B20] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>QO'SHISH</span>
              </button>

              <button
                onClick={() => {
                  if (selectedDeptIds.length !== 1) return;
                  const item = departments.find(d => d.id === selectedDeptIds[0]);
                  if (item) {
                    setEditingDept(item);
                    setNewDeptName(item.name);
                    setNewDeptStockId(item.stockId || "");
                    setIsAddDeptOpen(true);
                  }
                }}
                disabled={selectedDeptIds.length !== 1}
                className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wide transition-all shadow-xs ${
                  selectedDeptIds.length === 1
                    ? "bg-[#CCD1D9] text-gray-800 hover:bg-[#BAC0CB] cursor-pointer"
                    : "bg-[#E5E8EB] text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                TAHRIRLASH
              </button>

              <button
                onClick={handleDeleteSelectedDepts}
                disabled={selectedDeptIds.length === 0}
                className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wide transition-all shadow-xs ${
                  selectedDeptIds.length > 0
                    ? "bg-[#FF6F61] text-white hover:bg-[#E85B4D] cursor-pointer"
                    : "bg-[#E5E8EB] text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                O'CHIRISH
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded bg-[#00A3E0] hover:bg-[#008BBF] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all cursor-pointer"
              >
                CHOP ETISH
              </button>

              <button
                onClick={() => {
                  const csv = "No,Bo'lim,Ombor\n" + departments.map((d, idx) => `${idx + 1},"${d.name}","${getStockName(d.stockId)}"`).join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `departments_${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                }}
                className="px-4 py-2 rounded bg-[#00A3E0] hover:bg-[#008BBF] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all cursor-pointer"
              >
                EKSPORT
              </button>
            </div>

            {/* Departments Table */}
            <div className="bg-white border border-[#D9DDE2] rounded shadow-sm overflow-hidden">
              <div className="bg-gradient-to-b from-[#6A7280] to-[#58606E] text-white px-4 py-2 text-sm font-bold tracking-wide flex items-center gap-1.5">
                <span>Bo'limlar</span>
                <span className="text-gray-300 cursor-help" title="Savdo bo'limlari ro'yxati">
                  <Info size={14} />
                </span>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#ECEEF1] text-gray-700 font-bold border-b border-[#D9DDE2]">
                    <th className="py-2.5 px-3 w-10 text-center border-r border-[#D9DDE2]">
                      <input
                        type="checkbox"
                        checked={departments.length > 0 && selectedDeptIds.length === departments.length}
                        onChange={(e) => setSelectedDeptIds(e.target.checked ? departments.map(d => d.id) : [])}
                        className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3 w-14 text-center border-r border-[#D9DDE2]">№</th>
                    <th className="py-2.5 px-4 font-bold border-r border-[#D9DDE2]">Bo'lim</th>
                    <th className="py-2.5 px-4 font-bold">Ombor</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept, idx) => {
                    const isSelected = selectedDeptIds.includes(dept.id);
                    return (
                      <tr
                        key={dept.id}
                        onClick={() => setSelectedDeptIds(prev => prev.includes(dept.id) ? prev.filter(i => i !== dept.id) : [...prev, dept.id])}
                        className={`border-b border-[#E9ECF0] transition-colors cursor-pointer ${
                          isSelected ? "bg-[#D6EAF8] text-[#1B4F72] font-semibold" : idx % 2 === 1 ? "bg-[#F9FAFB] hover:bg-[#F2F4F7]" : "bg-white hover:bg-[#F2F4F7]"
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2]" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => setSelectedDeptIds(prev => prev.includes(dept.id) ? prev.filter(i => i !== dept.id) : [...prev, dept.id])}
                            className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2] font-semibold text-gray-700">{idx + 1}</td>
                        <td className="py-2.5 px-4 text-gray-900 font-medium border-r border-[#D9DDE2]">{dept.name}</td>
                        <td className="py-2.5 px-4 text-gray-700">{getStockName(dept.stockId)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: MAHSULOT KATEGORIYALARI (CATEGORIES)                              */}
        {/* ========================================================================= */}
        {activeSubTab === "categories" && (
          <div className="space-y-3">
            {/* Top Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCatName("");
                  setCatParentId("");
                  setCatDeptId(departments[0]?.id || "");
                  setCatStockId(stocks[0]?.id || "");
                  setCatBtnColor("#000000");
                  setCatTextColor("#419aff");
                  setCatFontSize(16);
                  setIsCategoryModalOpen(true);
                }}
                className="px-4 py-2 rounded bg-[#70B328] hover:bg-[#609B20] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>QO'SHISH</span>
              </button>

              <button
                onClick={() => {
                  if (selectedCategoryIds.length !== 1) return;
                  const item = categories.find(c => c.id === selectedCategoryIds[0]);
                  if (item) {
                    setEditingCategory(item);
                    setCatName(item.name);
                    setCatParentId(item.parentId || "");
                    setCatDeptId(item.deptId || "");
                    setCatStockId(item.stockId || "");
                    setCatBtnColor(item.btnColor || "#000000");
                    setCatTextColor(item.textColor || "#419aff");
                    setCatFontSize(item.fontSize || 16);
                    setIsCategoryModalOpen(true);
                  }
                }}
                disabled={selectedCategoryIds.length !== 1}
                className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wide transition-all shadow-xs ${
                  selectedCategoryIds.length === 1
                    ? "bg-[#CCD1D9] text-gray-800 hover:bg-[#BAC0CB] cursor-pointer"
                    : "bg-[#E5E8EB] text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                TAHRIRLASH
              </button>

              <button
                onClick={handleDeleteSelectedCategories}
                disabled={selectedCategoryIds.length === 0}
                className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-wide transition-all shadow-xs ${
                  selectedCategoryIds.length > 0
                    ? "bg-[#FF6F61] text-white hover:bg-[#E85B4D] cursor-pointer"
                    : "bg-[#E5E8EB] text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                O'CHIRISH
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded bg-[#00A3E0] hover:bg-[#008BBF] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all cursor-pointer"
              >
                CHOP ETISH
              </button>

              <button
                onClick={() => {
                  const csv = "No,Nomi,Bo'lim,Ombor,Tugma rangi,Matn rangi,Shrift o'lchami\n" + 
                    categories.map((c, idx) => `${idx + 1},"${c.name}","${c.deptName || ''}","${c.stockName || ''}","${c.btnColor || ''}","${c.textColor || ''}",${c.fontSize || 16}`).join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `categories_${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                }}
                className="px-4 py-2 rounded bg-[#00A3E0] hover:bg-[#008BBF] text-white font-bold text-xs uppercase tracking-wide shadow-xs transition-all cursor-pointer"
              >
                EKSPORT
              </button>
            </div>

            {/* Categories Table */}
            <div className="bg-white border border-[#D9DDE2] rounded shadow-sm overflow-hidden">
              <div className="bg-gradient-to-b from-[#6A7280] to-[#58606E] text-white px-4 py-2 text-sm font-bold tracking-wide flex items-center gap-1.5">
                <span>Mahsulot kategoriyalari</span>
                <span className="text-gray-300 cursor-help" title="Kategoriyalar va subkategoriyalar ro'yxati">
                  <Info size={14} />
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#ECEEF1] text-gray-700 font-bold border-b border-[#D9DDE2]">
                      <th className="py-2.5 px-3 w-10 text-center border-r border-[#D9DDE2]">
                        <input
                          type="checkbox"
                          checked={categories.length > 0 && selectedCategoryIds.length === categories.length}
                          onChange={(e) => setSelectedCategoryIds(e.target.checked ? categories.map(c => c.id) : [])}
                          className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3 w-12 text-center border-r border-[#D9DDE2]">№</th>
                      <th className="py-2.5 px-4 font-bold border-r border-[#D9DDE2] w-1/4">Nomi</th>
                      <th className="py-2.5 px-4 font-bold border-r border-[#D9DDE2] w-1/4">Bo'lim</th>
                      <th className="py-2.5 px-4 font-bold border-r border-[#D9DDE2] w-1/4">Ombor</th>
                      <th className="py-2.5 px-4 font-bold text-center w-28 border-r border-[#D9DDE2]">Mahsulotlar</th>
                      <th className="py-2.5 px-4 font-bold text-center w-24">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parentCategories.map((parent, pIdx) => {
                      const isSelected = selectedCategoryIds.includes(parent.id);
                      const subcats = getSubcategories(parent.id);
                      const isExpanded = expandedCategoryIds[parent.id] ?? subcats.length > 0;

                      return (
                        <React.Fragment key={parent.id}>
                          {/* Parent Category Row */}
                          <tr
                            onClick={() => setSelectedCategoryIds(prev => prev.includes(parent.id) ? prev.filter(i => i !== parent.id) : [...prev, parent.id])}
                            className={`border-b border-[#E9ECF0] transition-colors cursor-pointer ${
                              isSelected ? "bg-[#D6EAF8] text-[#1B4F72] font-semibold" : pIdx % 2 === 1 ? "bg-[#F9FAFB] hover:bg-[#F2F4F7]" : "bg-white hover:bg-[#F2F4F7]"
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2]" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => setSelectedCategoryIds(prev => prev.includes(parent.id) ? prev.filter(i => i !== parent.id) : [...prev, parent.id])}
                                className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2] font-semibold text-gray-700">{pIdx + 1}</td>
                            <td className="py-2.5 px-4 text-gray-900 font-bold border-r border-[#D9DDE2]">
                              <div className="flex items-center gap-1.5">
                                {subcats.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedCategoryIds(prev => ({ ...prev, [parent.id]: !isExpanded }));
                                    }}
                                    className="text-gray-500 hover:text-gray-800"
                                  >
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </button>
                                )}
                                <span>{parent.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-gray-700 border-r border-[#D9DDE2]">{parent.deptName || getDeptName(parent.deptId)}</td>
                            <td className="py-2.5 px-4 text-gray-700 border-r border-[#D9DDE2]">{parent.stockName || getStockName(parent.stockId)}</td>
                            <td className="py-2.5 px-4 text-center border-r border-[#D9DDE2]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDishFilterCat(parent.id);
                                  setActiveSubTab("dishes");
                                }}
                                className="text-[#00A3E0] hover:underline font-bold cursor-pointer"
                              >
                                Mahsulotlar
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingCategory(parent);
                                    setCatName(parent.name);
                                    setCatParentId(parent.parentId || "");
                                    setCatDeptId(parent.deptId || "");
                                    setCatStockId(parent.stockId || "");
                                    setCatBtnColor(parent.btnColor || "#000000");
                                    setCatTextColor(parent.textColor || "#419aff");
                                    setCatFontSize(parent.fontSize || 16);
                                    setIsCategoryModalOpen(true);
                                  }}
                                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
                                  title="Tahrirlash"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteSingleCategory(parent.id)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                  title="O'chirish"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Nested Subcategories Tree */}
                          {isExpanded && subcats.length > 0 && (
                            <tr className="bg-gray-50/70 border-b border-[#D9DDE2]">
                              <td colSpan={9} className="p-0">
                                <div className="pl-12 pr-4 py-2">
                                  <table className="w-full text-left border border-gray-300 bg-white rounded shadow-2xs text-xs">
                                    <thead>
                                      <tr className="bg-[#ECEEF1] text-gray-700 font-bold border-b border-gray-300">
                                        <th className="py-2 px-2.5 w-8 text-center border-r border-gray-300">
                                          <input
                                            type="checkbox"
                                            checked={subcats.every(s => selectedCategoryIds.includes(s.id))}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedCategoryIds(prev => [...new Set([...prev, ...subcats.map(s => s.id)])]);
                                              } else {
                                                setSelectedCategoryIds(prev => prev.filter(id => !subcats.some(s => s.id === id)));
                                              }
                                            }}
                                            className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                                          />
                                        </th>
                                        <th className="py-2 px-2.5 w-10 text-center border-r border-gray-300">№</th>
                                        <th className="py-2 px-3 font-bold border-r border-gray-300">Nomi</th>
                                        <th className="py-2 px-3 font-bold border-r border-gray-300">Bo'lim</th>
                                        <th className="py-2 px-3 font-bold border-r border-gray-300">Ombor</th>
                                        <th className="py-2 px-3 font-bold text-center border-r border-gray-300">Tugma rangi</th>
                                        <th className="py-2 px-3 font-bold text-center border-r border-gray-300">Matn rangi</th>
                                        <th className="py-2 px-3 font-bold text-center border-r border-gray-300">Shrift o'lchami</th>
                                        <th className="py-2 px-3 font-bold text-center border-r border-gray-300">Mahsulotlar</th>
                                        <th className="py-2 px-3 font-bold text-center w-16">Amallar</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {subcats.map((sub, sIdx) => {
                                        const isSubSelected = selectedCategoryIds.includes(sub.id);
                                        return (
                                          <tr
                                            key={sub.id}
                                            onClick={() => setSelectedCategoryIds(prev => prev.includes(sub.id) ? prev.filter(i => i !== sub.id) : [...prev, sub.id])}
                                            className={`border-b border-gray-200 transition-colors cursor-pointer ${
                                              isSubSelected ? "bg-[#D6EAF8] text-[#1B4F72] font-semibold" : "hover:bg-gray-50"
                                            }`}
                                          >
                                            <td className="py-2 px-2.5 text-center border-r border-gray-300" onClick={e => e.stopPropagation()}>
                                              <input
                                                type="checkbox"
                                                checked={isSubSelected}
                                                onChange={() => setSelectedCategoryIds(prev => prev.includes(sub.id) ? prev.filter(i => i !== sub.id) : [...prev, sub.id])}
                                                className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                                              />
                                            </td>
                                            <td className="py-2 px-2.5 text-center border-r border-gray-300 font-semibold text-gray-600">{sIdx + 1}</td>
                                            <td className="py-2 px-3 text-gray-800 font-medium border-r border-gray-300">{sub.name}</td>
                                            <td className="py-2 px-3 text-gray-600 border-r border-gray-300">{sub.deptName || parent.deptName || "Bar"}</td>
                                            <td className="py-2 px-3 text-gray-600 border-r border-gray-300">{sub.stockName || parent.stockName || "Bar Ombori"}</td>
                                            <td className="py-2 px-3 text-center border-r border-gray-300">
                                              <div className="inline-block w-10 h-4 rounded shadow-2xs border border-gray-300" style={{ backgroundColor: sub.btnColor || "#000000" }} />
                                            </td>
                                            <td className="py-2 px-3 text-center border-r border-gray-300">
                                              <div className="inline-block w-10 h-4 rounded shadow-2xs border border-gray-300" style={{ backgroundColor: sub.textColor || "#419aff" }} />
                                            </td>
                                            <td className="py-2 px-3 text-center border-r border-gray-300 font-mono">{sub.fontSize || 16}</td>
                                            <td className="py-2 px-3 text-center border-r border-gray-300">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setDishFilterCat(sub.id);
                                                  setActiveSubTab("dishes");
                                                }}
                                                className="text-[#00A3E0] hover:underline font-bold cursor-pointer"
                                              >
                                                Mahsulotlar
                                              </button>
                                            </td>
                                            <td className="py-2 px-2.5 text-center" onClick={e => e.stopPropagation()}>
                                              <button
                                                onClick={() => handleDeleteSingleCategory(sub.id)}
                                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                                title="O'chirish"
                                              >
                                                <Trash2 size={13} />
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: MAHSULOTLAR (DISHES CATALOG & CALCULATION)                        */}
        {/* ========================================================================= */}
        {activeSubTab === "dishes" && (
          <div className="space-y-3">
            {/* Top Search & Filter Bar */}
            <div className="bg-white border border-[#D9DDE2] rounded p-3 space-y-3 shadow-sm">
              <div className="text-xs font-bold text-gray-700">Filtr bo'yicha qidiruv</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <select
                  value={dishFilterStock}
                  onChange={(e) => setDishFilterStock(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                >
                  <option value="">Barcha omborlar</option>
                  {stocks.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <select
                  value={dishFilterDept}
                  onChange={(e) => setDishFilterDept(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                >
                  <option value="">Barcha bo'limlar</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>

                <select
                  value={dishFilterCat}
                  onChange={(e) => setDishFilterCat(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                >
                  <option value="">Barcha kategoriyalar</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <input
                  type="text"
                  value={dishSearchQuery}
                  onChange={(e) => setDishSearchQuery(e.target.value)}
                  placeholder="Qidiruv matnini kiriting..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:border-[#00A3E0]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchData()}
                  className="px-4 py-1.5 bg-[#70B328] hover:bg-[#609B20] text-white text-xs font-bold rounded shadow-xs uppercase tracking-wider cursor-pointer"
                >
                  QIDIRISH
                </button>
                <button
                  onClick={() => {
                    setDishSearchQuery("");
                    setDishFilterStock("");
                    setDishFilterDept("");
                    setDishFilterCat("");
                  }}
                  className="px-4 py-1.5 bg-[#00A3E0] hover:bg-[#008BBF] text-white text-xs font-bold rounded shadow-xs uppercase tracking-wider cursor-pointer"
                >
                  TOZALASH
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => {
                  setEditingDish(null);
                  setDishFormName("");
                  setDishFormCatId(categories[0]?.id || "");
                  setDishFormPrice("");
                  setDishFormArticle1C("");
                  setDishFormBtnColor("#fff71f");
                  setDishFormTextColor("#000000");
                  setDishFormFontSize(16);
                  setDishFormTimeMinutes(10);
                  setSelectedRecipeItems([]);
                  setIsAddDishModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded bg-[#70B328] hover:bg-[#609B20] text-white font-bold text-xs uppercase tracking-wide shadow-xs cursor-pointer"
              >
                QO'SHISH
              </button>

              <button
                onClick={() => {
                  if (selectedDishIds.length !== 1) return;
                  const item = dishes.find(d => d.id === selectedDishIds[0]);
                  if (item) {
                    setEditingDish(item);
                    setDishFormName(item.name);
                    setDishFormCatId(item.categoryId || "");
                    setDishFormPrice(String(item.price));
                    setDishFormArticle1C(item.article1C || "");
                    setDishFormBtnColor(item.btnColor || "#fff71f");
                    setDishFormTextColor(item.textColor || "#000000");
                    setDishFormFontSize(item.fontSize || 16);
                    setDishFormTimeMinutes(item.timeMinutes || 10);
                    setSelectedRecipeItems(typeof item.recipe === "string" ? JSON.parse(item.recipe || "[]") : (item.recipe || []));
                    setIsAddDishModalOpen(true);
                  }
                }}
                disabled={selectedDishIds.length !== 1}
                className={`px-3.5 py-1.5 rounded font-bold text-xs uppercase tracking-wide transition-all shadow-xs ${
                  selectedDishIds.length === 1
                    ? "bg-[#CCD1D9] text-gray-800 hover:bg-[#BAC0CB] cursor-pointer"
                    : "bg-[#E5E8EB] text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                TAHRIRLASH
              </button>

              <button
                onClick={handleDeleteSelectedDishes}
                disabled={selectedDishIds.length === 0}
                className={`px-3.5 py-1.5 rounded font-bold text-xs uppercase tracking-wide transition-all shadow-xs ${
                  selectedDishIds.length > 0
                    ? "bg-[#FF6F61] text-white hover:bg-[#E85B4D] cursor-pointer"
                    : "bg-[#E5E8EB] text-gray-400 cursor-not-allowed opacity-70"
                }`}
              >
                O'CHIRISH
              </button>

              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded bg-[#00A3E0] hover:bg-[#008BBF] text-white font-bold text-xs uppercase tracking-wide shadow-xs cursor-pointer"
              >
                CHOP ETISH
              </button>

              <button
                onClick={() => {
                  const csv = "No,Nomi,Narxi,Tannarxi,Foyda,Ustama,Kategoriya\n" + 
                    filteredDishes.map((d, idx) => `${idx + 1},"${d.name}",${d.price},${d.costPrice || 0},${d.profit || 0},${d.markup || 1},"${d.category || ''}"`).join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `dishes_${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                }}
                className="px-3 py-1.5 rounded bg-[#00A3E0] hover:bg-[#008BBF] text-white font-bold text-xs uppercase tracking-wide shadow-xs cursor-pointer"
              >
                EKSPORT
              </button>
            </div>

            {/* Dishes Table */}
            <div className="bg-white border border-[#D9DDE2] rounded shadow-sm overflow-hidden">
              <div className="bg-gradient-to-b from-[#6A7280] to-[#58606E] text-white px-4 py-2 flex items-center justify-between">
                <div className="text-sm font-bold tracking-wide flex items-center gap-1.5">
                  <span>Mahsulotlar</span>
                  <span className="text-gray-300 cursor-help" title="Mahsulotlar katalogi, narxlar va kalkulatsiya">
                    <Info size={14} />
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span>Sahifada ko'rsatish:</span>
                  <select
                    value={dishesPerPage}
                    onChange={(e) => setDishesPerPage(Number(e.target.value))}
                    className="bg-white text-gray-800 px-2 py-0.5 rounded text-xs font-bold border border-gray-300"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#ECEEF1] text-gray-700 font-bold border-b border-[#D9DDE2]">
                      <th className="py-2.5 px-3 w-8 text-center border-r border-[#D9DDE2]">
                        <input
                          type="checkbox"
                          checked={filteredDishes.length > 0 && selectedDishIds.length === filteredDishes.length}
                          onChange={(e) => setSelectedDishIds(e.target.checked ? filteredDishes.map(d => d.id) : [])}
                          className="rounded border-gray-400 text-[#00A3E0] focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3 w-10 text-center border-r border-[#D9DDE2]">№</th>
                      <th className="py-2.5 px-4 font-bold border-r border-[#D9DDE2]">Nomi ⇅</th>
                      <th className="py-2.5 px-4 font-bold border-r border-[#D9DDE2]">Shtrix kod ⇅</th>
                      <th className="py-2.5 px-4 font-bold border-r border-[#D9DDE2]">Kategoriya ⇅</th>
                      <th className="py-2.5 px-3 font-bold text-right border-r border-[#D9DDE2]">Narxi ⇅</th>
                      <th className="py-2.5 px-3 font-bold text-center border-r border-[#D9DDE2]">Qoldiq ⇅</th>
                      <th className="py-2.5 px-3 font-bold text-center border-r border-[#D9DDE2]">Holati</th>
                      <th className="py-2.5 px-3 font-bold text-center border-r border-[#D9DDE2]">Yaratilgan</th>
                      <th className="py-2.5 px-3 font-bold text-center border-r border-[#D9DDE2]">O'zgartirilgan</th>
                      <th className="py-2.5 px-3 font-bold text-center">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDishes.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="py-8 text-center text-gray-400">
                          Mahsulotlar topilmadi
                        </td>
                      </tr>
                    ) : (
                      filteredDishes.slice(0, dishesPerPage).map((dish, idx) => {
                        const isSelected = selectedDishIds.includes(dish.id);
                        const isDetailsOpen = expandedDishCalcIds[dish.id];
                        const recipeItems: RecipeIngredient[] = typeof dish.recipe === "string" 
                          ? JSON.parse(dish.recipe || "[]") 
                          : (dish.recipe || []);

                        return (
                          <React.Fragment key={dish.id}>
                            <tr
                              onClick={() => setSelectedDishIds(prev => prev.includes(dish.id) ? prev.filter(i => i !== dish.id) : [...prev, dish.id])}
                              className={`border-b border-[#E9ECF0] transition-colors cursor-pointer ${
                                isSelected ? "bg-[#D6EAF8] text-[#1B4F72] font-semibold" : idx % 2 === 1 ? "bg-[#F9FAFB] hover:bg-[#F2F4F7]" : "bg-white hover:bg-[#F2F4F7]"
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center border-r border-[#D9DDE2] font-semibold text-gray-700">{idx + 1}</td>
                              <td className="py-2.5 px-4 text-gray-900 font-bold border-r border-[#D9DDE2]">{dish.name}</td>
                              <td className="py-2.5 px-4 text-gray-700 border-r border-[#D9DDE2]">{dish.barcode || "—"}</td>
                              <td className="py-2.5 px-4 text-gray-700 border-r border-[#D9DDE2]">{dish.category || "—"}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 border-r border-[#D9DDE2]">
                                {formatCurrency(dish.price)}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-gray-700 border-r border-[#D9DDE2]">{dish.stock || 0}</td>
                              <td className="py-2.5 px-3 text-center text-emerald-600 font-bold border-r border-[#D9DDE2]">{dish.status || "Faol"}</td>
                              <td className="py-2.5 px-3 text-center text-gray-600 border-r border-[#D9DDE2]">{dish.createdAt?.substring(0, 10)}</td>
                              <td className="py-2.5 px-3 text-center text-gray-600 border-r border-[#D9DDE2]">{dish.updatedAt?.substring(0, 10)}</td>
                              <td className="py-2.5 px-3 text-center">
                                <button className="text-emerald-500 hover:text-emerald-700 mx-1"><Edit size={14} /></button>
                                <button className="text-red-500 hover:text-red-700 mx-1"><Trash2 size={14} /></button>
                              </td>
                            </tr>

                            {/* Expanded Recipe Calculation Subtable */}
                            {isDetailsOpen && (
                              <tr className="bg-gray-50 border-b border-gray-300">
                                <td colSpan={13} className="p-4">
                                  <div className="max-w-2xl bg-white border border-gray-300 rounded shadow-xs p-3">
                                    <div className="font-bold text-gray-800 mb-2 flex items-center justify-between">
                                      <span>Kalkulatsiya: {dish.name}</span>
                                      <span className="text-[11px] text-gray-500 font-normal">
                                        Narxlar sanasi: {new Date().toLocaleDateString("uz-UZ", { day: "2-digit", month: "long", year: "numeric" })}
                                      </span>
                                    </div>
                                    <table className="w-full text-left border border-gray-200 text-xs">
                                      <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                                        <tr>
                                          <th className="py-1.5 px-2 w-8 text-center border-r border-gray-200">№</th>
                                          <th className="py-1.5 px-3 border-r border-gray-200">Ingridient</th>
                                          <th className="py-1.5 px-2 text-center border-r border-gray-200">O'lchov b.</th>
                                          <th className="py-1.5 px-2 text-center border-r border-gray-200">Miqdori</th>
                                          <th className="py-1.5 px-3 text-right">Kirim narxi</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {recipeItems.length === 0 ? (
                                          <tr>
                                            <td colSpan={5} className="py-4 text-center text-gray-400">
                                              Kalkulatsiyaga ingridientlar qo'shilmagan
                                            </td>
                                          </tr>
                                        ) : (
                                          recipeItems.map((ing, rIdx) => (
                                            <tr key={rIdx} className="border-b border-gray-100">
                                              <td className="py-1.5 px-2 text-center border-r border-gray-200">{rIdx + 1}</td>
                                              <td className="py-1.5 px-3 font-medium text-gray-800 border-r border-gray-200">{ing.name}</td>
                                              <td className="py-1.5 px-2 text-center border-r border-gray-200">{ing.unit}</td>
                                              <td className="py-1.5 px-2 text-center font-mono border-r border-gray-200">{ing.quantity}</td>
                                              <td className="py-1.5 px-3 text-right font-mono font-bold text-gray-900">
                                                {formatCurrency(ing.costPrice * ing.quantity)}
                                              </td>
                                            </tr>
                                          ))
                                        )}
                                      </tbody>
                                      <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                                        <tr>
                                          <td colSpan={4} className="py-1.5 px-3 text-right">Итого себестоимость:</td>
                                          <td className="py-1.5 px-3 text-right text-rose-700 font-mono">
                                            {formatCurrency(dish.costPrice || 0)}
                                          </td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Other 5 Subtabs (Ingridientlar, Guruhlar, Yarim tayyor mahsulotlar, Modifikatorlar, Bog'langan taomlar) */}
        {activeSubTab === "ingredient_groups" && (
          <div className="bg-white border border-[#D9DDE2] rounded p-4 space-y-3">
            <h3 className="font-bold text-sm text-gray-800">Ingridient kategoriyalari</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {ingredientGroups.map((g, i) => (
                <div key={g.id} className="p-3 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
                  <span className="font-bold text-xs">{i + 1}. {g.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === "ingredients" && (
          <div className="bg-white border border-[#D9DDE2] rounded p-4 space-y-3">
            <h3 className="font-bold text-sm text-gray-800">Ingridientlar va qoldiqlar</h3>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#ECEEF1] font-bold">
                <tr>
                  <th className="p-2">№</th>
                  <th className="p-2">Nomi</th>
                  <th className="p-2">Kategoriya</th>
                  <th className="p-2 text-center">Birlik</th>
                  <th className="p-2 text-right">Miqdor</th>
                  <th className="p-2 text-right">Xarid narxi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ingredients.map((ing, i) => (
                  <tr key={ing.id} className="hover:bg-gray-50">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2 font-bold">{ing.name}</td>
                    <td className="p-2 text-gray-500">{ing.category}</td>
                    <td className="p-2 text-center">{ing.unit}</td>
                    <td className="p-2 text-right font-mono">{ing.quantity}</td>
                    <td className="p-2 text-right font-mono font-bold">{formatCurrency(ing.costPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === "semi_finished" && (
          <div className="bg-white border border-[#D9DDE2] rounded p-4 space-y-3">
            <h3 className="font-bold text-sm text-gray-800">Yarim tayyor mahsulotlar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {semiFinished.map((s, i) => (
                <div key={s.id} className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between">
                  <span className="font-bold">{s.name} ({s.unit})</span>
                  <span className="font-mono font-bold text-rose-700">{formatCurrency(s.costPrice)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === "modifiers" && (
          <div className="bg-white border border-[#D9DDE2] rounded p-4 space-y-3">
            <h3 className="font-bold text-sm text-gray-800">Mahsulot modifikatorlari</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              {modifiers.map((m) => (
                <div key={m.id} className="p-3 bg-gray-50 rounded border border-gray-200 flex justify-between">
                  <div>
                    <div className="font-bold">{m.name}</div>
                    <div className="text-[10px] text-gray-400">{m.category}</div>
                  </div>
                  <div className="font-bold text-emerald-700">{formatCurrency(m.price)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === "linked_dishes" && (
          <div className="bg-white border border-[#D9DDE2] rounded p-4 text-xs space-y-2">
            <h3 className="font-bold text-sm text-gray-800">Bog'langan mahsulotlar (Setlar va kombolar)</h3>
            <p className="text-gray-500">Kombo-to'plamlar va maxsus bog'langan pozitsiyalar</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. CATEGORY & SUBCATEGORY MODAL                                            */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl border border-gray-300 overflow-hidden">
            {/* Header with Red Close Button */}
            <div className="bg-[#ECEEF1] border-b border-[#CCD1D9] px-5 py-2.5 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800">
                {editingCategory ? "Kategoriyani tahrirlash" : "Yangi kategoriya qo'shish"}
              </span>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Side-by-Side Dual Forms */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Kategoriyani tahrirlash */}
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Kategoriya parametrlari</h4>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nomi <span className="text-red-500">*</span> ℹ️
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Masalan: Ichimliklar"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#70B328]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Asosiy (Ota) kategoriya ℹ️
                  </label>
                  <select
                    value={catParentId}
                    onChange={(e) => setCatParentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-[#70B328]"
                  >
                    <option value="">Ota kategoriyasiz (Asosiy)</option>
                    {parentCategories.map(c => (
                      <option key={c.id} value={c.id}>- {c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tugma rangi * ℹ️</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={catBtnColor}
                        onChange={(e) => setCatBtnColor(e.target.value)}
                        className="w-8 h-8 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={catBtnColor}
                        onChange={(e) => setCatBtnColor(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Matn rangi * ℹ️</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={catTextColor}
                        onChange={(e) => setCatTextColor(e.target.value)}
                        className="w-8 h-8 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={catTextColor}
                        onChange={(e) => setCatTextColor(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Shrift o'lchami * ℹ️</label>
                  <input
                    type="number"
                    value={catFontSize}
                    onChange={(e) => setCatFontSize(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#70B328] hover:bg-[#609B20] text-white text-xs font-bold rounded shadow-xs uppercase tracking-wider cursor-pointer"
                  >
                    SAQLASH
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-5 py-2 bg-[#FF6F61] hover:bg-[#E85B4D] text-white text-xs font-bold rounded shadow-xs uppercase tracking-wider cursor-pointer"
                  >
                    BEKOR QILISH
                  </button>
                </div>
              </form>

              {/* Right Column: Unterkategoriya qo'shish */}
              <form onSubmit={handleCreateSubcategory} className="space-y-4 border-l border-gray-200 pl-8">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Ost (Sub) Kategoriya qo'shish ℹ️</h4>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nomi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subcatName}
                    onChange={(e) => setSubcatName(e.target.value)}
                    placeholder="Masalan: Gazlangan ichimliklar"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#70B328]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Tugma rangi *</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={subcatBtnColor}
                        onChange={(e) => setSubcatBtnColor(e.target.value)}
                        className="w-8 h-8 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={subcatBtnColor}
                        onChange={(e) => setSubcatBtnColor(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Matn rangi *</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={subcatTextColor}
                        onChange={(e) => setSubcatTextColor(e.target.value)}
                        className="w-8 h-8 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={subcatTextColor}
                        onChange={(e) => setSubcatTextColor(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Shrift o'lchami *</label>
                  <input
                    type="number"
                    value={subcatFontSize}
                    onChange={(e) => setSubcatFontSize(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#70B328] hover:bg-[#609B20] text-white text-xs font-bold rounded shadow-xs uppercase tracking-wider cursor-pointer"
                  >
                    YARATISH
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DISH RECIPE & CALCULATION BUILDER MODAL                                */}
      {/* ========================================================================= */}
      {isAddDishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl border border-gray-300 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-[#ECEEF1] border-b border-[#CCD1D9] px-5 py-2.5 flex items-center justify-between shrink-0">
              <span className="text-sm font-bold text-gray-800">
                {editingDish ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
              </span>
              <button
                onClick={() => setIsAddDishModalOpen(false)}
                className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {/* Top Form Fields Row 1 */}
              <div className="grid grid-cols-2 md:grid-cols-8 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Nomi: <span className="text-red-500">*</span> ℹ️
                  </label>
                  <input
                    type="text"
                    required
                    value={dishFormName}
                    onChange={(e) => setDishFormName(e.target.value)}
                    placeholder="Masalan: Steak"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#70B328]"
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-gray-700">
                      Kategoriya: <span className="text-red-500">*</span> ℹ️
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setCatName("");
                        setCatParentId("");
                        setIsCategoryModalOpen(true);
                      }}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer underline"
                    >
                      + Yangi kategoriya ochish
                    </button>
                  </div>
                  <select
                    required
                    value={dishFormCatId || (categories[0]?.id || "")}
                    onChange={(e) => setDishFormCatId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-[#70B328]"
                  >
                    {categories.length === 0 ? (
                      <option value="">Kategoriya mavjud emas (Avval kategoriya qo'shing)</option>
                    ) : (
                      categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Birlik narxi <span className="text-red-500">*</span> ℹ️
                  </label>
                  <input
                    type="number"
                    required
                    value={dishFormPrice}
                    onChange={(e) => setDishFormPrice(e.target.value)}
                    placeholder="15000"
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:border-[#70B328]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">1S Artikul: ℹ️</label>
                  <input
                    type="text"
                    value={dishFormArticle1C}
                    onChange={(e) => setDishFormArticle1C(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Tugma rangi * ℹ️</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={dishFormBtnColor}
                      onChange={(e) => setDishFormBtnColor(e.target.value)}
                      className="w-6 h-6 rounded border cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={dishFormBtnColor}
                      onChange={(e) => setDishFormBtnColor(e.target.value)}
                      className="w-full px-1 py-1 text-[10px] font-mono border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Vaqt (daq.) ℹ️</label>
                  <input
                    type="number"
                    value={dishFormTimeMinutes}
                    onChange={(e) => setDishFormTimeMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Checkboxes Row */}
              <div className="flex items-center gap-6 text-xs text-gray-700 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishFormIsVisible}
                    onChange={(e) => setDishFormIsVisible(e.target.checked)}
                    className="rounded text-[#70B328]"
                  />
                  <span>Ko'rinadigan: ℹ️</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishFormIsPiece}
                    onChange={(e) => setDishFormIsPiece(e.target.checked)}
                    className="rounded text-[#70B328]"
                  />
                  <span>Dona hisobida: ℹ️</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishFormIsNoPercent}
                    onChange={(e) => setDishFormIsNoPercent(e.target.checked)}
                    className="rounded text-[#70B328]"
                  />
                  <span>% siz: ℹ️</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishFormIsCommon}
                    onChange={(e) => setDishFormIsCommon(e.target.checked)}
                    className="rounded text-[#70B328]"
                  />
                  <span>Umumiy ℹ️</span>
                </label>
              </div>

              {/* 3-Column Recipe Calculator Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
                {/* Column 1: Available Ingredients list */}
                <div className="md:col-span-5 bg-white border border-gray-300 rounded p-2.5 space-y-2 flex flex-col h-[350px]">
                  <div className="flex items-center gap-1 border-b border-gray-200 pb-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setRecipeSelectedTab("ingredients")}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                        recipeSelectedTab === "ingredients" ? "bg-[#ECEEF1] text-gray-900 border border-gray-300" : "text-gray-500"
                      }`}
                    >
                      Ingridientlar
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipeSelectedTab("semi_finished")}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer ${
                        recipeSelectedTab === "semi_finished" ? "bg-[#ECEEF1] text-gray-900 border border-gray-300" : "text-gray-500"
                      }`}
                    >
                      Yarim tayyor mahsulotlar
                    </button>
                  </div>

                  <input
                    type="text"
                    value={recipeSearchQuery}
                    onChange={(e) => setRecipeSearchQuery(e.target.value)}
                    placeholder="Qidiruv matnini kiriting..."
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={recipeFilterGroup}
                      onChange={(e) => setRecipeFilterGroup(e.target.value)}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded bg-white"
                    >
                      <option value="">Guruhni tanlang</option>
                      {ingredientGroups.map(g => (
                        <option key={g.id} value={g.name}>{g.name}</option>
                      ))}
                    </select>

                    <select
                      value={recipeFilterStock}
                      onChange={(e) => setRecipeFilterStock(e.target.value)}
                      className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded bg-white"
                    >
                      <option value="">Omborni tanlang</option>
                      {stocks.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Available Items Table */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar border border-gray-200 rounded">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0">
                        <tr>
                          <th className="p-1.5 w-6 text-center"></th>
                          <th className="p-1.5">Nomi</th>
                          <th className="p-1.5 text-center">O'lchov b.</th>
                          <th className="p-1.5">Guruh</th>
                          <th className="p-1.5 text-right">Narxi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {ingredients
                          .filter(i => !recipeSearchQuery || i.name.toLowerCase().includes(recipeSearchQuery.toLowerCase()))
                          .map(ing => (
                            <tr
                              key={ing.id}
                              onClick={() => handleAddIngredientToRecipe(ing)}
                              className="hover:bg-gray-50 cursor-pointer"
                            >
                              <td className="p-1.5 text-center">
                                <Plus size={12} className="text-[#70B328]" />
                              </td>
                              <td className="p-1.5 font-medium text-gray-800">{ing.name}</td>
                              <td className="p-1.5 text-center text-gray-500">{ing.unit}</td>
                              <td className="p-1.5 text-gray-500 truncate max-w-[80px]">{ing.category}</td>
                              <td className="p-1.5 text-right font-mono font-bold text-gray-900">{formatCurrency(ing.costPrice)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Column 2: Selected Ingredients in recipe */}
                <div className="md:col-span-4 bg-white border border-gray-300 rounded p-2.5 flex flex-col h-[350px]">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <span className="text-xs font-bold text-gray-700">Tanlangan ingridientlar ℹ️</span>
                    <button
                      type="button"
                      className="px-2.5 py-1 bg-[#00A3E0] text-white text-[11px] font-bold rounded cursor-pointer"
                    >
                      HISOBLASH
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar border border-gray-200 rounded mt-2">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0">
                        <tr>
                          <th className="p-1.5 w-6 text-center">№</th>
                          <th className="p-1.5">Nomi</th>
                          <th className="p-1.5 text-center">O'lchov b.</th>
                          <th className="p-1.5 text-center w-16">Miqdori</th>
                          <th className="p-1.5 w-6"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedRecipeItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-400">
                              Kalkulatsiyaga qo'shish uchun chapdagi ingridient ustiga bosing
                            </td>
                          </tr>
                        ) : (
                          selectedRecipeItems.map((item, idx) => (
                            <tr key={item.id}>
                              <td className="p-1.5 text-center text-gray-500">{idx + 1}</td>
                              <td className="p-1.5 font-medium text-gray-900 truncate max-w-[100px]">{item.name}</td>
                              <td className="p-1.5 text-center text-gray-500">{item.unit}</td>
                              <td className="p-1.5 text-center">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.001"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateRecipeQuantity(item.id, Number(e.target.value))}
                                  className="w-14 px-1 py-0.5 text-center font-mono border border-gray-300 rounded"
                                />
                              </td>
                              <td className="p-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveIngredientFromRecipe(item.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X size={12} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Column 3: Tannarx hisob-kitobi */}
                <div className="md:col-span-3 bg-[#F8F9FB] border border-gray-300 rounded p-3 flex flex-col justify-between h-[350px]">
                  <div>
                    <h5 className="text-xs font-bold text-gray-800 border-b border-gray-300 pb-1.5">
                      Tannarx hisob-kitobi ℹ️
                    </h5>

                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sotuv narxi:</span>
                        <span className="font-bold font-mono text-gray-900">{formatCurrency(dishPriceNum)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tannarxi:</span>
                        <span className="font-bold font-mono text-rose-700">{formatCurrency(recipeTotalCost)}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-1.5">
                        <span className="text-gray-700 font-bold">Foyda:</span>
                        <span className="font-bold font-mono text-emerald-700">{formatCurrency(calculatedProfit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ustama:</span>
                        <span className="font-bold font-mono text-blue-700">{calculatedMarkup}x</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                    💡 Kirim narxlari o'zgarganda mahsulot tannarxi avtomatik qayta hisoblanadi.
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    onClick={() => console.log("Submitting form...")}
                    className="px-6 py-2 rounded bg-[#70B328] hover:bg-[#609B20] text-white font-bold text-xs uppercase tracking-wide shadow-sm cursor-pointer"
                  >
                    {editingDish ? "SAQLASH" : "YARATISH"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddDishModalOpen(false)}
                    className="px-6 py-2 rounded bg-[#FF6F61] hover:bg-[#E85B4D] text-white font-bold text-xs uppercase tracking-wide shadow-sm cursor-pointer"
                  >
                    BEKOR QILISH
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
