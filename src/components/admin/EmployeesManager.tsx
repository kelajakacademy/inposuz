import React, { useState, useEffect } from "react";
import { Employee } from "../../types";
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Phone, 
  Key, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Check, 
  X,
  RotateCw,
  AlertCircle,
  Shield,
  Lock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { DeleteConfirmationModal } from "../common/DeleteConfirmationModal";
import { saveOfflineMutation } from "../../utils/offlineSync";

export type PermissionsSubTab = "employees" | "roles";

export interface RoleItem {
  id: string;
  name: string;
  accessLevel: "Super Admin" | "To'liq kirish" | "Cheklangan kirish" | "Faqat kassa";
  employeesCount: number;
  description: string;
  canAccessPos?: boolean;
  canTakeOrders?: boolean;
  canCloseOrders?: boolean;
  canCancelOrders?: boolean;
  canGiveDiscount?: boolean;
  canAccessReports?: boolean;
  canAccessAdmin?: boolean;
  createdAt: string;
}

interface EmployeesManagerProps {
  cafeId?: string;
  initialSubTab?: PermissionsSubTab;
  onSubTabChange?: (tab: PermissionsSubTab) => void;
}

export const EmployeesManager: React.FC<EmployeesManagerProps> = ({ 
  cafeId = "default",
  initialSubTab = "employees",
  onSubTabChange
}) => {
  const [activeSubTab, setActiveSubTab] = useState<PermissionsSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleTabChange = (tab: PermissionsSubTab) => {
    setActiveSubTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  // ---------------- EMPLOYEES STATE ----------------
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [empStatusTab, setEmpStatusTab] = useState<"active" | "fired" | "all">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("waiter");
  const [formPin, setFormPin] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "fired">("active");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ---------------- ROLES & PERMISSIONS STATE ----------------
  const [roles, setRoles] = useState<RoleItem[]>(() => {
    try {
      const cached = localStorage.getItem("inpos_roles");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [roleSearch, setRoleSearch] = useState("");
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleAccessLevel, setRoleAccessLevel] = useState<"Super Admin" | "To'liq kirish" | "Cheklangan kirish" | "Faqat kassa">("Cheklangan kirish");
  const [roleDescription, setRoleDescription] = useState("");

  // Detailed Granular Permissions
  const [canAccessPos, setCanAccessPos] = useState(true);
  const [canTakeOrders, setCanTakeOrders] = useState(true);
  const [canCloseOrders, setCanCloseOrders] = useState(true);
  const [canCancelOrders, setCanCancelOrders] = useState(false);
  const [canGiveDiscount, setCanGiveDiscount] = useState(false);
  const [canAccessReports, setCanAccessReports] = useState(false);
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/employees", {
        headers: { "x-cafe-id": cafeId }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/admin/roles", {
        headers: { "x-cafe-id": cafeId }
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const formatted: RoleItem[] = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          accessLevel: r.accessLevel || "Cheklangan kirish",
          employeesCount: r.employeesCount || 0,
          description: r.description || "",
          canAccessPos: Boolean(r.canAccessPos),
          canTakeOrders: Boolean(r.canTakeOrders),
          canCloseOrders: Boolean(r.canCloseOrders),
          canCancelOrders: Boolean(r.canCancelOrders),
          canGiveDiscount: Boolean(r.canGiveDiscount),
          canAccessReports: Boolean(r.canAccessReports),
          canAccessAdmin: Boolean(r.canAccessAdmin),
          createdAt: r.createdAt ? r.createdAt.split(" ")[0] : new Date().toISOString().split("T")[0]
        }));
        setRoles(formatted);
        try { localStorage.setItem("inpos_roles", JSON.stringify(formatted)); } catch(e){}
      }
    } catch (err) {
      console.warn("Failed to load roles from API:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, [cafeId]);

  // Employee Modals
  const openAddModal = () => {
    setEditingEmployee(null);
    setFormName("");
    setFormPhone("+998 ");
    setFormRole("waiter");
    setFormPin("");
    setFormStatus("active");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormPhone(emp.phone || "");
    setFormRole(emp.role);
    setFormPin(emp.pin);
    setFormStatus(emp.status || "active");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPin.trim()) {
      setFormError("Xodim F.I.O va PIN kodi kiritilishi shart");
      return;
    }
    if (formPin.length < 4) {
      setFormError("PIN kod kamida 4 xonali bo'lishi kerak");
      return;
    }

    setIsSaving(true);
    setFormError("");

    const empId = editingEmployee ? editingEmployee.id : `emp-${Date.now()}`;
    const empPayload = {
      id: empId,
      name: formName.trim(),
      phone: formPhone.trim(),
      role: formRole,
      pin: formPin.trim(),
      status: editingEmployee ? formStatus : "active"
    };

    // 1. Optimistic state update
    setEmployees(prev => {
      const idx = prev.findIndex(e => e.id === empId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...empPayload };
        return copy;
      }
      return [empPayload as any, ...prev];
    });

    // 2. Cache in localStorage for POS login
    try {
      const stored = JSON.parse(localStorage.getItem("pos_cached_waiters") || "[]");
      const filtered = stored.filter((w: any) => w.id !== empId);
      localStorage.setItem("pos_cached_waiters", JSON.stringify([empPayload, ...filtered]));
    } catch (e) {}

    // 3. Queue offline mutation for DB sync
    saveOfflineMutation("waiter", "upsert", empId, empPayload);
    setIsModalOpen(false);
    setIsSaving(false);

    // 4. Send to server in background
    try {
      if (editingEmployee) {
        fetch(`/api/admin/employees/${editingEmployee.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
          body: JSON.stringify(empPayload)
        }).then(() => fetchEmployees()).catch(console.warn);
      } else {
        fetch("/api/admin/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
          body: JSON.stringify(empPayload)
        }).then(() => fetchEmployees()).catch(console.warn);
      }
    } catch (err) {
      console.warn("Employee saved locally in offline queue:", err);
    }
  };

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    role: string;
  }>({
    isOpen: false,
    id: "",
    name: "",
    role: ""
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteModal = (emp: Employee) => {
    setDeleteModal({
      isOpen: true,
      id: emp.id,
      name: emp.name,
      role: emp.role || "Xodim"
    });
  };

  const handleExecuteDeleteEmployee = async () => {
    if (!deleteModal.id) return;
    const targetId = deleteModal.id;
    setIsDeleting(false);
    setDeleteModal({ isOpen: false, id: "", name: "", role: "" });

    // Optimistic state removal
    setEmployees(prev => prev.filter(e => e.id !== targetId));
    try {
      const stored = JSON.parse(localStorage.getItem("pos_cached_waiters") || "[]");
      localStorage.setItem("pos_cached_waiters", JSON.stringify(stored.filter((w: any) => w.id !== targetId)));
    } catch (e) {}

    // Queue offline mutation
    saveOfflineMutation("waiter", "delete", targetId);

    try {
      fetch(`/api/admin/employees/${targetId}`, {
        method: "DELETE",
        headers: { "x-cafe-id": cafeId }
      }).then(() => fetchEmployees()).catch(console.warn);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Role Handlers
  const handleOpenRoleModal = (role?: RoleItem) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setRoleAccessLevel(role.accessLevel);
      setRoleDescription(role.description);
      setCanAccessPos(role.canAccessPos ?? true);
      setCanTakeOrders(role.canTakeOrders ?? true);
      setCanCloseOrders(role.canCloseOrders ?? true);
      setCanCancelOrders(role.canCancelOrders ?? false);
      setCanGiveDiscount(role.canGiveDiscount ?? false);
      setCanAccessReports(role.canAccessReports ?? false);
      setCanAccessAdmin(role.canAccessAdmin ?? false);
    } else {
      setEditingRole(null);
      setRoleName("");
      setRoleAccessLevel("Cheklangan kirish");
      setRoleDescription("");
      setCanAccessPos(true);
      setCanTakeOrders(true);
      setCanCloseOrders(true);
      setCanCancelOrders(false);
      setCanGiveDiscount(false);
      setCanAccessReports(false);
      setCanAccessAdmin(false);
    }
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    const roleId = editingRole ? editingRole.id : `role-${Date.now()}`;
    const newRoleObj: RoleItem = {
      id: roleId,
      name: roleName.trim(),
      accessLevel: roleAccessLevel,
      employeesCount: editingRole ? editingRole.employeesCount : 0,
      description: roleDescription || "Lavozim ruxsatlari",
      canAccessPos,
      canTakeOrders,
      canCloseOrders,
      canCancelOrders,
      canGiveDiscount,
      canAccessReports,
      canAccessAdmin,
      createdAt: editingRole ? editingRole.createdAt : new Date().toISOString().split('T')[0]
    };

    // Instant optimistic state update
    setRoles(prev => {
      const idx = prev.findIndex(r => r.id === roleId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newRoleObj;
        return copy;
      }
      return [...prev, newRoleObj];
    });

    try {
      const stored = JSON.parse(localStorage.getItem("inpos_roles") || "[]");
      const filtered = stored.filter((r: any) => r.id !== roleId);
      localStorage.setItem("inpos_roles", JSON.stringify([...filtered, newRoleObj]));
    } catch (e) {}

    // Queue offline mutation for DB sync
    saveOfflineMutation("role", "upsert", roleId, {
      id: roleId,
      name: roleName.trim(),
      accessLevel: roleAccessLevel,
      description: roleDescription,
      canAccessPos,
      canTakeOrders,
      canCloseOrders,
      canCancelOrders,
      canGiveDiscount,
      canAccessReports,
      canAccessAdmin
    });

    setIsRoleModalOpen(false);

    // Sync with backend API if online
    try {
      const url = editingRole ? `/api/admin/roles/${editingRole.id}` : "/api/admin/roles";
      const method = editingRole ? "PUT" : "POST";
      fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-cafe-id": cafeId },
        body: JSON.stringify({
          id: roleId,
          name: roleName.trim(),
          accessLevel: roleAccessLevel,
          description: roleDescription,
          canAccessPos,
          canTakeOrders,
          canCloseOrders,
          canCancelOrders,
          canGiveDiscount,
          canAccessReports,
          canAccessAdmin
        })
      }).then(() => fetchRoles()).catch(console.warn);
    } catch (err) {
      console.warn("Role save background sync warning:", err);
    }
  };

  const handleDeleteRole = async (id: string) => {
    // Instant deletion without blocking alert/confirm
    setRoles(prev => prev.filter(r => r.id !== id));
    try {
      const stored = JSON.parse(localStorage.getItem("inpos_roles") || "[]");
      localStorage.setItem("inpos_roles", JSON.stringify(stored.filter((r: any) => r.id !== id)));
    } catch (e) {}

    // Queue offline mutation
    saveOfflineMutation("role", "delete", id);

    try {
      fetch(`/api/admin/roles/${id}`, {
        method: "DELETE",
        headers: { "x-cafe-id": cafeId }
      }).then(() => fetchRoles()).catch(console.warn);
    } catch (err) {
      console.error("Delete role error:", err);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (empStatusTab === "active" && emp.status === "fired") return false;
    if (empStatusTab === "fired" && emp.status !== "fired") return false;
    if (roleFilter !== "all" && emp.role !== roleFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = emp.name.toLowerCase().includes(q);
      const phoneMatch = emp.phone ? emp.phone.toLowerCase().includes(q) : false;
      const pinMatch = emp.pin ? emp.pin.includes(q) : false;
      return nameMatch || phoneMatch || pinMatch;
    }
    return true;
  });

  const filteredRoles = roles.filter(r => {
    if (roleSearch.trim()) {
      const q = roleSearch.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    }
    return true;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Admin</span>;
      case "cashier":
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Kassir</span>;
      case "chef":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Oshpaz</span>;
      default:
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Ofitsiant</span>;
    }
  };

  return (
    <div className="flex-1 bg-[#F5F7FA] min-h-0 flex flex-col overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">

        {/* Top Header & Subtabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="text-blue-600" size={24} />
              {activeSubTab === "employees" ? "Xodimlar Boshqaruvi" : "Lavozimlar va Ruxsatlar"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {activeSubTab === "employees" 
                ? "Restoranning barcha ishchilari, PIN kodlari va rollari" 
                : "Tizim lavozimlari va xodimlar ruxsat darajalari"}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => handleTabChange("employees")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === "employees"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              1. Xodimlar
            </button>
            <button
              onClick={() => handleTabChange("roles")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === "roles"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              2. Lavozimlar
            </button>
          </div>
        </div>

        {/* ================= TAB 1: XODIMLAR ================= */}
        {activeSubTab === "employees" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Xodim F.I.O yoki PIN bo'yicha..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setEmpStatusTab("active")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      empStatusTab === "active" ? "bg-white text-blue-600 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Ishlayotganlar
                  </button>
                  <button
                    onClick={() => setEmpStatusTab("fired")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      empStatusTab === "fired" ? "bg-white text-blue-600 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Bo'shatilganlar
                  </button>
                  <button
                    onClick={() => setEmpStatusTab("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      empStatusTab === "all" ? "bg-white text-blue-600 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Barchasi
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchEmployees}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                  title="Yangilash"
                >
                  <RotateCw size={15} className={isLoading ? "animate-spin text-blue-600" : ""} />
                </button>
                <button
                  onClick={openAddModal}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <Plus size={16} />
                  <span>+ Xodim qo'shish</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">F.I.O</th>
                      <th className="py-3.5 px-4">LAVOZIM</th>
                      <th className="py-3.5 px-4">TELEFON</th>
                      <th className="py-3.5 px-4">PIN KOD</th>
                      <th className="py-3.5 px-4">HOLATI</th>
                      <th className="py-3.5 px-4 text-right">AMALLAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          Yuklanmoqda...
                        </td>
                      </tr>
                    ) : filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          Xodimlar topilmadi
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
                              {emp.name.charAt(0)}
                            </div>
                            <span>{emp.name}</span>
                          </td>
                          <td className="py-3.5 px-4">{getRoleBadge(emp.role)}</td>
                          <td className="py-3.5 px-4 font-mono text-gray-600">{emp.phone || "-"}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded w-fit">
                            ****
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              emp.status === "fired" 
                                ? "bg-red-50 text-red-700 border border-red-200" 
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}>
                              {emp.status === "fired" ? "Bo'shatilgan" : "Faol"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(emp)}
                              className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                              title="Tahrirlash"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(emp)}
                              className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                              title="Xodimni o'chirish"
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
            </div>
          </div>
        )}

        {/* ================= TAB 2: LAVOZIMLAR ================= */}
        {activeSubTab === "roles" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  placeholder="Lavozim nomi yoki tavsifi bo'yicha..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={() => handleOpenRoleModal()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
              >
                <Plus size={16} />
                <span>+ Lavozim qo'shish</span>
              </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">LAVOZIM NOMI</th>
                      <th className="py-3.5 px-4">RUXSATLAR DARAJASI</th>
                      <th className="py-3.5 px-4">XODIMLAR SONI</th>
                      <th className="py-3.5 px-4">TAVSIFI</th>
                      <th className="py-3.5 px-4">YARATILGAN</th>
                      <th className="py-3.5 px-4 text-right">AMALLAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {filteredRoles.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          Lavozimlar topilmadi
                        </td>
                      </tr>
                    ) : (
                      filteredRoles.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-900 flex items-center gap-2.5">
                            <Shield size={16} className="text-blue-600" />
                            <span>{r.name}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                              {r.accessLevel}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-gray-800">{r.employeesCount} kishi</td>
                          <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate">{r.description}</td>
                          <td className="py-3.5 px-4 text-gray-500">{r.createdAt}</td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenRoleModal(r)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteRole(r.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
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
            </div>
          </div>
        )}

      </div>

      {/* Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {editingEmployee ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Xodim F.I.O</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Masalan: Soliyev Bekzod"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Telefon raqami</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Lavozimi</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name} ({r.accessLevel})</option>
                    ))}
                    {roles.length === 0 && (
                      <>
                        <option value="waiter">Ofitsiant</option>
                        <option value="cashier">Kassir</option>
                        <option value="chef">Oshpaz</option>
                        <option value="admin">Administrator</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">PIN kodi (Kassa / POS)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value)}
                    placeholder="1234"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 font-mono tracking-widest"
                  />
                </div>
              </div>

              {editingEmployee && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Xodim holati</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">Faol (Ishlamoqda)</option>
                    <option value="fired">Bo'shatilgan</option>
                  </select>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  {isSaving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {editingRole ? "Lavozimni tahrirlash" : "Yangi lavozim qo'shish"}
              </h3>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Lavozim nomi</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Masalan: Katta Kassir, Barista..."
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ruxsat darajasi</label>
                <select
                  value={roleAccessLevel}
                  onChange={(e) => setRoleAccessLevel(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="To'liq kirish">To'liq kirish</option>
                  <option value="Cheklangan kirish">Cheklangan kirish</option>
                  <option value="Faqat kassa">Faqat kassa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Vazifa va tavsifi</label>
                <input
                  type="text"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Masalan: Barcha buyurtmalarga va kassaga javobgar"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Ruxsatlar va Cheklovlar bo'limi (POS bilan sinxron) */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-800">
                    Ruxsatlar va cheklovlar (POS bilan sinxron)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const allTrue = !(canAccessPos && canTakeOrders && canCloseOrders);
                      setCanAccessPos(allTrue);
                      setCanTakeOrders(allTrue);
                      setCanCloseOrders(allTrue);
                      setCanCancelOrders(allTrue);
                      setCanGiveDiscount(allTrue);
                      setCanAccessReports(allTrue);
                      setCanAccessAdmin(allTrue);
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    Barchasini belgilash
                  </button>
                </div>
                <div className="space-y-2.5 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <label className="flex items-center gap-2.5 text-xs text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canAccessPos}
                      onChange={(e) => setCanAccessPos(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold text-gray-900">Kassaga kirish (POS terminalga kirish ruxsati)</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canTakeOrders}
                      onChange={(e) => setCanTakeOrders(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Buyurtma olish va oshxonaga yuborish</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canCloseOrders}
                      onChange={(e) => setCanCloseOrders(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Chek yopish va to'lovlarni qabul qilish</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canCancelOrders}
                      onChange={(e) => setCanCancelOrders(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Chek bekor qilish / Taom o'chirish</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canGiveDiscount}
                      onChange={(e) => setCanGiveDiscount(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Chegirma berish</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canAccessReports}
                      onChange={(e) => setCanAccessReports(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Hisobotlarni ko'rish</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={canAccessAdmin}
                      onChange={(e) => setCanAccessAdmin(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Admin panelga kirish</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (2-rasmdagidek tasdiqlash oynasi) */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Xodimni o'chirish"
        itemName={deleteModal.name}
        itemType="xodim"
        message={`Haqiqatdan ham «${deleteModal.name}» (${deleteModal.role}) xodimini tizim va bazadan butunlay o'chirib tashlamoqchimisiz? Ushbu xodim endi POS terminal va tizimga kira olmaydi.`}
        isDeleting={isDeleting}
        onConfirm={handleExecuteDeleteEmployee}
        onClose={() => setDeleteModal({ isOpen: false, id: "", name: "", role: "" })}
      />
    </div>
  );
};
