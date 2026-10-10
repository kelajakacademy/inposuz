import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/utils";
import { 
  Plus, 
  Search, 
  Calendar, 
  Download, 
  Filter, 
  Trash2, 
  Edit, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  DollarSign,
  X,
  Check
} from "lucide-react";

export type FinanceSubTab = "dashboard" | "xarajatlar";

interface FinanceModuleProps {
  cafeId?: string;
  initialSubTab?: FinanceSubTab;
  onSubTabChange?: (sub: FinanceSubTab) => void;
}

interface TransactionItem {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  paymentMethod: string;
  date: string;
  comment: string;
  createdBy: string;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({
  cafeId = "default",
  initialSubTab = "dashboard",
  onSubTabChange
}) => {
  const [subTab, setSubTab] = useState<FinanceSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabChange = (newTab: FinanceSubTab) => {
    setSubTab(newTab);
    if (onSubTabChange) {
      onSubTabChange(newTab);
    }
  };

  // State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Transactions / Expenses data
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Kommunal");
  const [expensePaymentMethod, setExpensePaymentMethod] = useState("Naqd");
  const [expenseComment, setExpenseComment] = useState("");

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || Number(expenseAmount) <= 0) return;

    const newTx: TransactionItem = {
      id: "tx-" + Math.random().toString(36).substr(2, 6),
      type: "expense",
      amount: Number(expenseAmount),
      category: expenseCategory,
      paymentMethod: expensePaymentMethod,
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      comment: expenseComment || "Xarajat",
      createdBy: "Hakimjon Khayitov"
    };

    setTransactions(prev => [newTx, ...prev]);
    setIsExpenseModalOpen(false);
    setExpenseAmount("");
    setExpenseComment("");
  };

  // Calculations
  const totalIncome = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(t => {
    if (subTab === "xarajatlar" && t.type !== "expense") return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCat = t.category.toLowerCase().includes(q);
      const matchComment = t.comment.toLowerCase().includes(q);
      const matchUser = t.createdBy.toLowerCase().includes(q);
      if (!matchCat && !matchComment && !matchUser) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F5F7FA] overflow-y-auto custom-scrollbar select-none p-6 lg:p-8">
      {/* 1. MOLIYA DASHBOARD (Image 1) */}
      {subTab === "dashboard" && (
        <div className="space-y-6 max-w-7xl mx-auto w-full">
          {/* Title */}
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Moliya</h1>

          {/* Top Filter Bar */}
          <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs flex flex-wrap items-end justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Boshlanish sanasi va vaqti
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
                    placeholder="дд.мм.гггг --:--"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tugash sanasi va vaqti
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-blue-600"
                    placeholder="дд.мм.гггг --:--"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => {}}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer h-9 shrink-0"
            >
              Statistikani yuklash
            </button>
          </div>

          {/* 3 Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Jami Kirim */}
            <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-2xs">
              <p className="text-xs font-medium text-gray-500">Jami kirim</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(totalIncome)} UZS</p>
            </div>

            {/* Jami Chiqim */}
            <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-2xs">
              <p className="text-xs font-medium text-gray-500">Jami chiqim</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(totalExpense)} UZS</p>
            </div>

            {/* Sof Foyda */}
            <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-2xs">
              <p className="text-xs font-medium text-gray-500">Sof foyda</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(netProfit)} UZS</p>
            </div>
          </div>

          {/* Tranzaksiyalar Section */}
          <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
              <h2 className="text-sm font-bold text-gray-900">Tranzaksiyalar</h2>

              <div className="flex items-center gap-2.5">
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none"
                >
                  <option value="all">Hammasi</option>
                  <option value="income">Kirim</option>
                  <option value="expense">Chiqim / Xarajat</option>
                </select>

                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus size={15} />
                  <span>Xarajat qo'shish</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">TURI</th>
                    <th className="py-3 px-4">SUMMA</th>
                    <th className="py-3 px-4">KATEGORIYA</th>
                    <th className="py-3 px-4">TO'LOV TURI</th>
                    <th className="py-3 px-4">SANA</th>
                    <th className="py-3 px-4">IZOH</th>
                    <th className="py-3 px-4">KIM KIRITDI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                        Ma'lumotlar topilmadi
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] ${tx.type === "income" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                            {tx.type === "income" ? "Kirim" : "Chiqim"}
                          </span>
                        </td>
                        <td className={`py-3 px-4 font-bold ${tx.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                          {formatCurrency(tx.amount)} UZS
                        </td>
                        <td className="py-3 px-4">{tx.category}</td>
                        <td className="py-3 px-4">{tx.paymentMethod}</td>
                        <td className="py-3 px-4 text-gray-500">{tx.date}</td>
                        <td className="py-3 px-4">{tx.comment}</td>
                        <td className="py-3 px-4 font-medium">{tx.createdBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Pagination */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  Sahifada:
                  <select
                    value={pageSize}
                    onChange={e => setPageSize(Number(e.target.value))}
                    className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-700 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </span>
                <span>Jami: {filteredTransactions.length}</span>
              </div>

              <div className="flex items-center gap-1">
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer disabled:opacity-40" disabled>
                  <ChevronsLeft size={16} />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer disabled:opacity-40" disabled>
                  <ChevronLeft size={16} />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer disabled:opacity-40" disabled>
                  <ChevronRight size={16} />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer disabled:opacity-40" disabled>
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MOLIYA XARAJATLAR (Image 2) */}
      {subTab === "xarajatlar" && (
        <div className="space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Xarajatlar</h1>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Kategoriya yoki izoh bo'yicha qidirish..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-600 shadow-2xs w-64"
                />
              </div>

              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus size={15} />
                <span>Xarajat qo'shish</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">KATEGORIYA</th>
                    <th className="py-3 px-4">SUMMA</th>
                    <th className="py-3 px-4">SANA</th>
                    <th className="py-3 px-4">IZOH</th>
                    <th className="py-3 px-4">KIM KIRITDI</th>
                    <th className="py-3 px-4 text-center">AMALLAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                        Ma'lumotlar topilmadi
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900">{tx.category}</td>
                        <td className="py-3 px-4 font-bold text-red-600">{formatCurrency(tx.amount)} UZS</td>
                        <td className="py-3 px-4 text-gray-500">{tx.date}</td>
                        <td className="py-3 px-4">{tx.comment}</td>
                        <td className="py-3 px-4 font-medium">{tx.createdBy}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setTransactions(prev => prev.filter(t => t.id !== tx.id))}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="O'chirish"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Pagination */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  Sahifada:
                  <select
                    value={pageSize}
                    onChange={e => setPageSize(Number(e.target.value))}
                    className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-700 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </span>
                <span>Jami: {filteredTransactions.length}</span>
              </div>

              <div className="flex items-center gap-1">
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer disabled:opacity-40" disabled>
                  <ChevronsLeft size={16} />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer disabled:opacity-40" disabled>
                  <ChevronLeft size={16} />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer disabled:opacity-40" disabled>
                  <ChevronRight size={16} />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer disabled:opacity-40" disabled>
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* XARAJAT QO'SHISH MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <h3 className="text-sm font-bold text-gray-900">Yangi xarajat qo'shish</h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/60 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Xarajat summasi (UZS)</label>
                <input
                  type="number"
                  required
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  placeholder="Masalan: 150000"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kategoriya</label>
                <select
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none"
                >
                  <option value="Kommunal">Kommunal to'lovlar</option>
                  <option value="Ijara">Bino ijarasi</option>
                  <option value="Ish haqi">Xodimlar ish haqi</option>
                  <option value="Mahsulot">Mahsulot xarid qilish</option>
                  <option value="Reklama">Marketing va reklama</option>
                  <option value="Boshqa">Boshqa xarajatlar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">To'lov turi</label>
                <select
                  value={expensePaymentMethod}
                  onChange={e => setExpensePaymentMethod(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none"
                >
                  <option value="Naqd">Naqd pul</option>
                  <option value="Karta">Bank kartasi</option>
                  <option value="Hisob raqam">Bank o'tkazmasi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Izoh</label>
                <input
                  type="text"
                  value={expenseComment}
                  onChange={e => setExpenseComment(e.target.value)}
                  placeholder="Xarajat bo'yicha qisqa izoh..."
                  className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer shadow-2xs"
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
