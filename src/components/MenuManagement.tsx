import React, { useState, useEffect, useRef } from "react";
import { Plus, Image as ImageIcon, Check, Download, Upload } from "lucide-react";
import { Product } from "../types";
import { CATEGORIES } from "../constants";
import { motion, AnimatePresence } from "motion/react";
import { formatCurrency } from "../lib/utils";
import { useOrder } from "../context/OrderContext";
import * as XLSX from "xlsx";

export const MenuManagement = () => {
  const { waiter, linkedCafe } = useOrder();
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "Burger",
    stock: "20",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop"
  });

  const activeCafeId = waiter?.cafeId || linkedCafe?.id || "default";

  useEffect(() => {
    fetch("/api/products", {
      headers: { "x-cafe-id": activeCafeId }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
      });
  }, [activeCafeId]);

  const downloadTemplate = () => {
    const categoriesList = CATEGORIES.filter(c => c.id !== 'all').map(c => c.name).join(", ");
    const data = [
      { 
        "Name": "Classic Burger", 
        "Price": 12.99, 
        "Category": "Burger", 
        "Stock": 50,
        "Help": `Available Categories: ${categoriesList}` 
      },
      { 
        "Name": "Coca Cola", 
        "Price": 2.50, 
        "Category": "Drinks", 
        "Stock": 100 
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Menu Template");
    
    const catData = CATEGORIES.filter(c => c.id !== 'all').map(c => ({ "Category ID": c.id, "Category Name": c.name }));
    const catSheet = XLSX.utils.json_to_sheet(catData);
    XLSX.utils.book_append_sheet(workbook, catSheet, "Available Categories");

    XLSX.writeFile(workbook, "pos_menu_template.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result as string;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const importedProducts = data.filter(item => item.Name && item.Price).map(item => ({
          name: item.Name,
          price: parseFloat(item.Price),
          category: item.Category || "Burger",
          stock: parseInt(item.Stock) || 20,
          image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop"
        }));

        if (importedProducts.length === 0) {
          alert("No valid products found in the file.");
          return;
        }

        if (confirm(`Import ${importedProducts.length} products?`)) {
          for (const prod of importedProducts) {
             const res = await fetch("/api/products", {
               method: "POST",
               headers: { 
                 "Content-Type": "application/json",
                 "x-cafe-id": activeCafeId 
               },
               body: JSON.stringify(prod)
             });
             const saved = await res.json();
             setProducts(prev => [...prev, saved.product]);
          }
          alert("Import successful!");
        }
      } catch (err) {
        console.error("Import error:", err);
        alert("Failed to parse Excel file. Please use the template.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = {
      ...newProduct,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock)
    };

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-cafe-id": activeCafeId 
      },
      body: JSON.stringify(product)
    });

    if (res.ok) {
      const data = await res.json();
      setProducts(prev => [...prev, data.product]);
      setIsAdding(false);
      setNewProduct({
        name: "",
        price: "",
        category: "Burger",
        stock: "20",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop"
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#1A1D21] p-8 overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Menu Management</h1>
          <p className="text-gray-400">Add or edit products in your menu.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={downloadTemplate}
            className="bg-[#25292E] text-gray-300 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:text-white border border-gray-800 transition-all text-sm"
            title="Download Excel Template"
          >
            <Download size={18} />
            Template
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#25292E] text-[#3498DB] px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#3498DB]/10 border border-[#3498DB]/30 transition-all text-sm"
          >
            <Upload size={18} />
            Import Excel
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
            accept=".xlsx, .xls" 
          />
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#E74C3C] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-opacity text-sm"
          >
            <Plus size={20} />
            Add New Product
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#25292E] rounded-3xl p-6 border-2 border-dashed border-gray-800 flex flex-col"
              >
                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#E74C3C] outline-none"
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Narxi</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#E74C3C] outline-none"
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 block">Category</label>
                    <select 
                      className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#E74C3C] outline-none"
                      value={newProduct.category}
                      onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    >
                      {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="flex-1 py-2 rounded-xl bg-white/5 text-gray-400 font-bold hover:text-white"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-[#E74C3C] text-white font-bold"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {products.map((product) => (
            <div key={product.id} className="bg-[#25292E] rounded-3xl p-4 border border-gray-800 group hover:border-[#E74C3C]/50 transition-all flex flex-col shadow-lg">
              <div className="w-full aspect-video rounded-2xl overflow-hidden mb-4 relative">
                 <img src={product.image} className="w-full h-full object-cover" />
                 <div className="absolute top-3 right-3 px-3 py-1 bg-[#1A1D21]/80 backdrop-blur rounded-lg text-[10px] font-bold text-gray-100">
                    ID: #{product.id}
                 </div>
              </div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white group-hover:text-[#E74C3C] transition-all">{product.name}</h3>
                  <span className="text-[10px] text-gray-500 uppercase tracking-tighter">{product.category}</span>
                </div>
                <div className="text-right">
                  <p className="font-black text-[#E74C3C]">{formatCurrency(product.price)}</p>
                  <p className="text-[10px] text-gray-500">Stock: {product.stock}</p>
                </div>
              </div>
              <button className="mt-auto w-full py-2 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-white rounded-xl transition-all">
                Edit Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
