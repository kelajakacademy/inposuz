import React, { useState, useEffect } from "react";
import { useOrder } from "../../context/OrderContext";

interface ExpenseGroup {
  id: string;
  name: string;
}

interface CashOperation {
  id: string;
  groupId: string;
  groupName: string;
  type: "expense" | "income" | "transfer";
  cashRegister: string;
  date: string;
  description: string;
  cashAmount: number;
  bankAccountAmount: number;
  bankCardAmount: number;
  totalAmount: number;
  author: string;
  createdAt: string;
}

interface CashierExpensesViewProps {
  onBack: () => void;
  onExit: () => void;
}

export const CashierExpensesView: React.FC<CashierExpensesViewProps> = ({ onBack, onExit }) => {
  const { waiter, linkedCafe } = useOrder();
  const activeCafeId = waiter?.cafeId || linkedCafe?.id || "default";

  // Expense Groups state
  const [groups, setGroups] = useState<ExpenseGroup[]>([
    { id: "g1", name: "Группа 1" },
    { id: "g2", name: "Закуп" },
    { id: "g3", name: "Зарплата" },
    { id: "g4", name: "Инвестиции" },
    { id: "g5", name: "Инкассация" },
    { id: "g6", name: "Расходный материал" }
  ]);

  const [selectedGroupId, setSelectedGroupId] = useState<string>("g2");
  const [searchQuery, setSearchQuery] = useState("");

  // Form states matching screenshot 1
  const [cashRegister] = useState("Касса по умолчанию");
  const [currentDate] = useState(() => {
    const d = new Date();
    const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  });

  const [description, setDescription] = useState("");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [bankAccountAmount, setBankAccountAmount] = useState<string>("");
  const [bankCardAmount, setBankCardAmount] = useState<string>("");

  // Recent operations list
  const [operations, setOperations] = useState<CashOperation[]>([]);

  // Modals
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [editGroupName, setEditGroupName] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDesc, setTransferDesc] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  // Fetch groups and operations on load
  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/expense-groups", {
        headers: { "x-cafe-id": activeCafeId }
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setGroups(data);
        if (!data.some((g: any) => g.id === selectedGroupId)) {
          setSelectedGroupId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Error fetching expense groups:", e);
    }
  };

  const fetchOperations = async () => {
    try {
      const res = await fetch("/api/cash-operations?limit=100", {
        headers: { "x-cafe-id": activeCafeId }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setOperations(data);
      }
    } catch (e) {
      console.error("Error fetching cash operations:", e);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchOperations();
  }, [activeCafeId]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || groups[0] || { id: "g2", name: "Закуп" };

  const totalCalculated = 
    (Number(cashAmount) || 0) + 
    (Number(bankAccountAmount) || 0) + 
    (Number(bankCardAmount) || 0);

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateOperation = async (type: "expense" | "income") => {
    if (totalCalculated <= 0) {
      showToast("Iltimos, summani kiriting (Наличные, Банковский счет yoki Карта)!");
      return;
    }

    const payload = {
      groupId: selectedGroup.id,
      groupName: selectedGroup.name,
      type,
      cashRegister,
      date: currentDate,
      description: description || (type === "expense" ? "Chiqim amaliyoti" : "Kirim amaliyoti"),
      cashAmount: Number(cashAmount) || 0,
      bankAccountAmount: Number(bankAccountAmount) || 0,
      bankCardAmount: Number(bankCardAmount) || 0,
      totalAmount: totalCalculated,
      author: waiter?.name || "Kassir"
    };

    try {
      const res = await fetch("/api/cash-operations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId 
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.operation) {
        setOperations(prev => [data.operation, ...prev]);
        setDescription("");
        setCashAmount("");
        setBankAccountAmount("");
        setBankCardAmount("");
        showToast(type === "expense" ? "Расход муваффақиятли сақланди!" : "Приход муваффақиятли сақланди!");
      }
    } catch (e) {
      console.error("Error creating cash operation:", e);
    }
  };

  const handleAddGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch("/api/expense-groups", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId 
        },
        body: JSON.stringify({ name: newGroupName.trim() })
      });
      const data = await res.json();
      if (data.success && data.group) {
        setGroups(prev => [...prev, data.group]);
        setSelectedGroupId(data.group.id);
        setNewGroupName("");
        setShowAddGroupModal(false);
        showToast("Янги гуруҳ қўшилди!");
      }
    } catch (e) {
      console.error("Error creating group:", e);
    }
  };

  const handleEditGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGroupName.trim() || !selectedGroupId) return;

    try {
      const res = await fetch(`/api/expense-groups/${selectedGroupId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId 
        },
        body: JSON.stringify({ name: editGroupName.trim() })
      });
      const data = await res.json();
      if (data.success && data.group) {
        setGroups(prev => prev.map(g => g.id === selectedGroupId ? data.group : g));
        setShowEditGroupModal(false);
        showToast("Гуруҳ номи янгиланди!");
      }
    } catch (e) {
      console.error("Error editing group:", e);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || Number(transferAmount) <= 0) return;

    const payload = {
      groupId: "g5",
      groupName: "Инкассация / Перевод",
      type: "income",
      cashRegister: "Касса по умолчанию",
      date: currentDate,
      description: `Кассага ўтказма: ${transferDesc || "Инкассация"}`,
      cashAmount: Number(transferAmount),
      bankAccountAmount: 0,
      bankCardAmount: 0,
      totalAmount: Number(transferAmount),
      author: waiter?.name || "Kassir"
    };

    try {
      const res = await fetch("/api/cash-operations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId 
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.operation) {
        setOperations(prev => [data.operation, ...prev]);
        setShowTransferModal(false);
        setTransferAmount("");
        setTransferDesc("");
        showToast("Кассага ўтказма амалга оширилди!");
      }
    } catch (e) {
      console.error("Error transferring cash:", e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#d0d4da] select-none font-sans text-black relative">
      {/* Toast popup */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#25292e] text-white px-5 py-2.5 rounded-xl border border-white/20 shadow-2xl text-xs font-bold animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* TOP HEADER / SEARCH BAR */}
      <div className="h-10 px-4 bg-gradient-to-r from-[#bec3cb] via-[#d0d4da] to-[#bec3cb] border-b border-[#9ba1aa] flex items-center justify-between text-xs">
        <div className="font-bold text-[#2d3748] tracking-wider uppercase text-[11px]">
          ГРУППА
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-bold text-[11px]">Поиск</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 sm:w-64 bg-white/90 border border-gray-400 rounded px-2 py-0.5 text-xs text-black outline-none focus:border-blue-500 shadow-inner"
            placeholder=""
          />
        </div>
      </div>

      {/* MAIN TWO-COLUMN CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: GROUPS LIST & ACTION BUTTONS */}
        <div className="w-56 sm:w-64 bg-[#c2c7cf] border-r border-[#9ba1aa] flex flex-col justify-between p-2 shadow-inner">
          {/* GROUPS LIST */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filteredGroups.map((grp) => {
              const isSelected = grp.id === selectedGroupId;
              return (
                <button
                  key={grp.id}
                  onClick={() => setSelectedGroupId(grp.id)}
                  className={`w-full text-left px-3 py-2 rounded text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-gradient-to-b from-[#2196f3] via-[#1e88e5] to-[#1565c0] text-white border-[#0d47a1] shadow-md"
                      : "bg-[#d8dce2] text-[#2c3038] border-[#a0a6b0] hover:bg-[#e4e8ee]"
                  }`}
                >
                  {grp.name}
                </button>
              );
            })}
          </div>

          {/* BOTTOM GROUP MANAGEMENT BUTTONS */}
          <div className="pt-2 border-t border-[#9ba1aa] space-y-1.5 shrink-0">
            <button
              onClick={() => {
                setNewGroupName("");
                setShowAddGroupModal(true);
              }}
              className="w-full py-2 px-3 rounded bg-gradient-to-b from-[#f5f7fa] to-[#cfd8dc] hover:from-[#ffffff] hover:to-[#dbf0f8] border border-[#8090a0] text-[#1e232a] font-bold text-xs shadow-sm flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>➕ Добавить группу</span>
            </button>

            <button
              onClick={() => {
                if (selectedGroup) {
                  setEditGroupName(selectedGroup.name);
                  setShowEditGroupModal(true);
                }
              }}
              className="w-full py-2 px-3 rounded bg-gradient-to-b from-[#f5f7fa] to-[#cfd8dc] hover:from-[#ffffff] hover:to-[#dbf0f8] border border-[#8090a0] text-[#1e232a] font-bold text-xs shadow-sm flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>✏️ Редактировать</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: EXPENSE/INCOME FORM & CASH HISTORY */}
        <div className="flex-1 flex flex-col bg-[#e0e4eb] p-3 overflow-y-auto space-y-3">
          {/* TOP FORM BOX (MATCHING SCREENSHOT 1) */}
          <div className="bg-[#c2c7cf] border-2 border-[#9ba1aa] rounded-lg p-3 shadow-md space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Left Form Inputs */}
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-700 block mb-0.5">Касса</label>
                  <input
                    type="text"
                    readOnly
                    value={cashRegister}
                    className="w-full bg-[#d0d4da] border border-[#9098a2] rounded px-2.5 py-1 text-xs font-bold text-gray-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-700 block mb-0.5">Дата</label>
                  <input
                    type="text"
                    readOnly
                    value={currentDate}
                    className="w-full bg-[#d0d4da] border border-[#9098a2] rounded px-2.5 py-1 text-xs font-bold text-gray-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-700 block mb-0.5">Группа расходов</label>
                  <input
                    type="text"
                    readOnly
                    value={selectedGroup.name}
                    className="w-full bg-[#3f51b5] border border-[#283593] rounded px-2.5 py-1 text-xs font-black text-white shadow"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-700 block mb-0.5">Примечание / Комментарий</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Масалан: Go'sht va sabzavotlar xaridi"
                    className="w-full bg-white border border-[#9098a2] rounded p-2 text-xs text-black outline-none focus:border-blue-500 shadow-inner resize-none font-medium"
                  />
                </div>
              </div>

              {/* Right Amounts & Type Inputs */}
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-700 block mb-0.5">Наличные (So'm)</label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white border border-[#9098a2] rounded px-2.5 py-1 text-xs font-mono font-bold text-black outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-700 block mb-0.5">Банковский счет (So'm)</label>
                  <input
                    type="number"
                    value={bankAccountAmount}
                    onChange={(e) => setBankAccountAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white border border-[#9098a2] rounded px-2.5 py-1 text-xs font-mono font-bold text-black outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-700 block mb-0.5">Карта / Терминал (So'm)</label>
                  <input
                    type="number"
                    value={bankCardAmount}
                    onChange={(e) => setBankCardAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white border border-[#9098a2] rounded px-2.5 py-1 text-xs font-mono font-bold text-black outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>

                <div className="pt-1">
                  <div className="text-[11px] font-black text-[#1e232a] flex items-center justify-between bg-white/60 p-1.5 rounded border border-gray-300">
                    <span>ИТОГО СУММА:</span>
                    <span className="font-mono text-sm text-blue-700">{totalCalculated.toLocaleString()} SO'M</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS: PACХОД | ПРИХОД | ПЕРЕВОД НА КАССУ */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#a0a6b0]">
              <button
                type="button"
                onClick={() => handleCreateOperation("expense")}
                className="py-2.5 px-3 rounded bg-gradient-to-b from-[#e53935] via-[#d32f2f] to-[#c62828] hover:from-[#ef5350] hover:to-[#b71c1c] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer border border-[#b71c1c]"
              >
                🔴 РАСХОД (ЧИҚИМ)
              </button>

              <button
                type="button"
                onClick={() => handleCreateOperation("income")}
                className="py-2.5 px-3 rounded bg-gradient-to-b from-[#43a047] via-[#388e3c] to-[#2e7d32] hover:from-[#66bb6a] hover:to-[#1b5e20] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer border border-[#1b5e20]"
              >
                🟢 ПРИХОД (КИРИМ)
              </button>

              <button
                type="button"
                onClick={() => setShowTransferModal(true)}
                className="py-2.5 px-3 rounded bg-gradient-to-b from-[#00acc1] via-[#00897b] to-[#00695c] hover:from-[#26c6da] hover:to-[#004d40] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer border border-[#004d40]"
              >
                🔄 ПЕРЕВОД НА КАССУ
              </button>
            </div>
          </div>

          {/* HISTORY TABLE OF OPERATIONS */}
          <div className="flex-1 bg-white rounded-lg border-2 border-[#9ba1aa] shadow-inner p-2 flex flex-col overflow-hidden">
            <div className="text-xs font-black text-[#2c3038] mb-2 flex items-center justify-between border-b pb-1.5">
              <span>ОПЕРАЦИЯЛАР ТАРИХИ</span>
              <span className="text-[11px] font-mono text-gray-500">Жами: {operations.length} та</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 border-b font-bold text-[11px]">
                    <th className="p-2">Вақт</th>
                    <th className="p-2">Гуруҳ</th>
                    <th className="p-2">Тур</th>
                    <th className="p-2">Изоҳ</th>
                    <th className="p-2 text-right">Сумма</th>
                    <th className="p-2">Муаллиф</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {operations.map((op) => (
                    <tr key={op.id} className="hover:bg-gray-50 text-[11px]">
                      <td className="p-2 font-mono text-gray-500">{op.date}</td>
                      <td className="p-2 font-bold text-gray-800">{op.groupName}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          op.type === "expense" 
                            ? "bg-red-100 text-red-700 border border-red-300"
                            : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                        }`}>
                          {op.type === "expense" ? "ЧИҚИМ" : "КИРИМ"}
                        </span>
                      </td>
                      <td className="p-2 text-gray-700 max-w-xs truncate">{op.description || "-"}</td>
                      <td className={`p-2 text-right font-mono font-bold ${
                        op.type === "expense" ? "text-red-600" : "text-emerald-600"
                      }`}>
                        {op.type === "expense" ? "-" : "+"}{op.totalAmount.toLocaleString()} SO'M
                      </td>
                      <td className="p-2 text-gray-600">{op.author}</td>
                    </tr>
                  ))}
                  {operations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400 font-bold">
                        Ҳозирча касса чиқим/кирим амалиётлари мавжуд эмас.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER BAR (MATCHING SCREENSHOT 1) */}
      <div className="h-12 px-4 bg-gradient-to-r from-[#b0b5be] via-[#c4c9d2] to-[#b0b5be] border-t-2 border-[#8e949e] flex items-center justify-between shadow-md shrink-0">
        <button
          onClick={onBack}
          className="px-5 py-2 rounded bg-gradient-to-b from-[#e0e0e0] to-[#b0b0b0] hover:from-[#ffffff] hover:to-[#cccccc] border border-[#707070] text-black font-bold text-xs shadow cursor-pointer active:scale-95"
        >
          ◄ ОРҚАГА
        </button>

        <button
          onClick={onExit}
          className="px-5 py-2 rounded bg-gradient-to-b from-[#ef5350] to-[#c62828] hover:from-[#ff6b6b] hover:to-[#b71c1c] border border-[#900000] text-white font-bold text-xs shadow cursor-pointer active:scale-95"
        >
          ЧИҚИШ (ВЫХОД)
        </button>
      </div>

      {/* MODAL 1: ADD GROUP */}
      {showAddGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#c2c7cf] border-2 border-[#9ba1aa] rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-gray-900 border-b pb-2">
              ➕ ЯНГИ ГУРУҲ ҚЎШИШ
            </h3>

            <form onSubmit={handleAddGroupSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Гуруҳ номи:</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Масалан: Ижара тўлови"
                  className="w-full bg-white border border-gray-400 rounded p-2 text-xs text-black font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGroupModal(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold text-xs rounded"
                >
                  Бекор қилиш
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded"
                >
                  Сақлаш
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT GROUP */}
      {showEditGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#c2c7cf] border-2 border-[#9ba1aa] rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-gray-900 border-b pb-2">
              ✏️ ГУРУҲ НОМИНИ ТАҲРИРЛАШ
            </h3>

            <form onSubmit={handleEditGroupSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Гуруҳ номи:</label>
                <input
                  type="text"
                  required
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="w-full bg-white border border-gray-400 rounded p-2 text-xs text-black font-medium outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditGroupModal(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold text-xs rounded"
                >
                  Бекор қилиш
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded"
                >
                  Янгилаш
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TRANSFER TO CASH REGISTER */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#c2c7cf] border-2 border-[#9ba1aa] rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-gray-900 border-b pb-2">
              🔄 КАССАГА ЎТКАЗМА (ИЗ КАССЫ/В КАССУ)
            </h3>

            <form onSubmit={handleTransferSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Сумма (So'm):</label>
                <input
                  type="number"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white border border-gray-400 rounded p-2 text-xs font-mono font-bold text-black outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Изоҳ:</label>
                <input
                  type="text"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  placeholder="Масалан: Inkassatsiya summasi"
                  className="w-full bg-white border border-gray-400 rounded p-2 text-xs text-black outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold text-xs rounded"
                >
                  Бекор қилиш
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded"
                >
                  Ўтказиш
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
