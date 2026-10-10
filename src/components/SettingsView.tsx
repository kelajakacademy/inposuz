import React, { useState, useEffect } from "react";
import { useOrder } from "../context/OrderContext";
import { User, Lock, Save, ShieldCheck, Printer, Store, MapPin, Phone, MessageSquare, Image as ImageIcon, Plus, Trash2, Database, Users, Globe, Cloud, Smartphone, Download, CheckCircle2, FileCode, ExternalLink, Server, Wifi, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getServerUrl, setServerUrl, testServerConnection } from "../lib/api";
import { syncOfflineOrdersToServer, getOfflineOrdersQueue } from "../utils/offlineSync";

export const SettingsView = () => {
  const { waiter, linkedCafe, updateProfile, receiptConfig, updateReceiptConfig } = useOrder();
  const [activeTab, setActiveTab] = useState<'profile' | 'receipt' | 'appearance' | 'system' | 'waiters' | 'cloud' | 'android'>('profile');
  
  const activeCafeId = waiter?.cafeId || linkedCafe?.id || "default";

  // Profile state
  const [name, setName] = useState(waiter?.name || "");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Cloud & VPS Server state
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [shopId, setShopId] = useState("");
  const [cloudApiKey, setCloudApiKey] = useState("");

  // VPS API Server state
  const [vpsServerUrl, setVpsServerUrl] = useState(() => getServerUrl());
  const [vpsTestResult, setVpsTestResult] = useState<{ testing: boolean; success?: boolean; message?: string } | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(() => getOfflineOrdersQueue().length);

  const handleTestVpsConnection = async () => {
    setVpsTestResult({ testing: true });
    const res = await testServerConnection(vpsServerUrl);
    setVpsTestResult({ testing: false, success: res.success, message: res.message });
  };

  const handleSaveVpsServerUrl = () => {
    setServerUrl(vpsServerUrl);
    alert("VPS Server sozlamasi muvaffaqiyatli saqlandi! Barcha so'rovlar ushbu serverga yo'naltiriladi.");
  };

  const handleSyncOfflineOrders = async () => {
    setIsManualSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await syncOfflineOrdersToServer(activeCafeId);
      if (res.success) {
        setSyncStatusMsg(`✅ ${res.syncedCount} ta oflayn buyurtma serverga yuklandi!`);
        setPendingOrdersCount(getOfflineOrdersQueue().length);
      } else {
        setSyncStatusMsg(`⚠️ Xatolik: ${res.error || "Server javob bermadi"}`);
      }
    } catch (e: any) {
      setSyncStatusMsg(`⚠️ Ulanish xatosi: ${e.message}`);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const fetchCloudSettings = async () => {
    try {
      const res = await fetch("/api/settings/cloud", {
        headers: { "x-cafe-id": activeCafeId }
      });
      const data = await res.json();
      if (data) {
        setCloudEnabled(data.enabled);
        setShopId(data.shopId);
        setCloudApiKey(data.apiKey);
      }
    } catch (err) {
      console.error("Failed to fetch cloud settings", err);
    }
  };

  useEffect(() => {
    fetchCloudSettings();
  }, [activeCafeId]);

  const handleCloudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    await fetch("/api/settings/cloud", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-cafe-id": activeCafeId 
      },
      body: JSON.stringify({ value: { enabled: cloudEnabled, shopId, apiKey: cloudApiKey } })
    });
    alert("Cloud settings saved locally!");
    setIsUpdating(false);
  };

  // Receipt & Appearance state
  const [rConfig, setRConfig] = useState(receiptConfig);

  // Waiters management state
  const [waitersList, setWaitersList] = useState<any[]>([]);
  const [newWaiter, setNewWaiter] = useState({ name: "", pin: "", role: "waiter" });

  const fetchWaiters = async () => {
    const res = await fetch("/api/waiters", {
      headers: { "x-cafe-id": activeCafeId }
    });
    const data = await res.json();
    if (Array.isArray(data)) setWaitersList(data);
  };

  useEffect(() => {
    if (activeTab === 'waiters') {
      fetchWaiters();
    }
  }, [activeTab, activeCafeId]);

  const handleAddWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newWaiter.pin.length < 4) {
      alert("PIN must be at least 4 digits");
      return;
    }
    const res = await fetch("/api/waiters", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-cafe-id": activeCafeId 
      },
      body: JSON.stringify(newWaiter)
    });
    const data = await res.json();
    if (data.success) {
      setNewWaiter({ name: "", pin: "", role: "waiter" });
      fetchWaiters();
    }
  };

  const handleDeleteWaiter = async (id: string) => {
    if (id === waiter?.id) {
       alert("Cannot delete yourself!");
       return;
    }
    if (!confirm("Are you sure you want to delete this waiter?")) return;
    const res = await fetch(`/api/waiters/${id}`, { 
      method: "DELETE",
      headers: { "x-cafe-id": activeCafeId }
    });
    const data = await res.json();
    if (data.success) fetchWaiters();
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin && pin !== confirmPin) {
      alert("PINs do not match!");
      return;
    }
    setIsUpdating(true);
    await updateProfile({ name, pin });
    setPin("");
    setConfirmPin("");
    alert("Profile updated successfully!");
    setIsUpdating(false);
  };

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    await updateReceiptConfig(rConfig);
    alert("Settings saved!");
    setIsUpdating(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("Logo file is too large! Please use a smaller image (< 1MB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRConfig({ ...rConfig, logoUrl: reader.result as string, showLogo: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for BG
        alert("Background file is too large! Please use a smaller image (< 2MB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRConfig({ ...rConfig, loginBgUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#1A1D21] p-8 overflow-y-auto custom-scrollbar">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Configure your personal profile and system preferences.</p>
      </header>

      <div className="flex gap-4 mb-8 p-1 bg-[#25292E] w-fit rounded-2xl border border-gray-800">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'profile' ? "bg-[#E74C3C] text-white shadow-lg" : "text-gray-500 hover:text-white"
          }`}
        >
          My Profile
        </button>
        {waiter?.isAdmin && (
          <>
            <button 
              onClick={() => setActiveTab('receipt')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'receipt' ? "bg-[#3498DB] text-white shadow-lg" : "text-gray-500 hover:text-white"
              }`}
            >
              Receipt Design
            </button>
            <button 
              onClick={() => setActiveTab('appearance')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'appearance' ? "bg-[#2ECC71] text-white shadow-lg" : "text-gray-500 hover:text-white"
              }`}
            >
              Appearance
            </button>
            <button 
              onClick={() => setActiveTab('waiters')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'waiters' ? "bg-purple-600 text-white shadow-lg" : "text-gray-500 hover:text-white"
              }`}
            >
              Staff Management
            </button>
            <button 
              onClick={() => setActiveTab('cloud')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'cloud' ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30" : "text-gray-400 hover:text-white"
              }`}
            >
              <Server size={16} />
              VPS Server & API
            </button>
            <button 
              onClick={() => setActiveTab('system')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'system' ? "bg-amber-600 text-white shadow-lg" : "text-gray-500 hover:text-white"
              }`}
            >
              System Info
            </button>
            <button 
              onClick={() => setActiveTab('android')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'android' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30" : "text-gray-400 hover:text-white"
              }`}
            >
              <Smartphone size={16} />
              Android Studio (APK)
            </button>
          </>
        )}
      </div>

      <div className="max-w-6xl">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-[#25292E] rounded-3xl p-8 border border-gray-800 shadow-xl max-w-2xl"
            >
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-800">
                 <div className="w-16 h-16 rounded-2xl bg-[#E74C3C]/10 flex items-center justify-center text-[#E74C3C]">
                    <User size={32} />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-white">Profile Control</h2>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                       {waiter?.isAdmin && <ShieldCheck size={14} className="text-[#E74C3C]" />}
                       <span>{waiter?.isAdmin ? "Administrator" : "Staff Member"}</span>
                    </div>
                 </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <User size={14} /> Full Name
                  </label>
                  <input 
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-[#E74C3C] outline-none"
                    placeholder="Your display name"
                  />
                </div>

                <div className="pt-6 border-t border-gray-800 space-y-6">
                   <h3 className="text-sm font-bold text-white flex items-center gap-2 border-l-4 border-[#E74C3C] pl-3">
                      Security (Change PIN)
                   </h3>
                   
                   <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                          <Lock size={14} /> New PIN
                        </label>
                        <input 
                          type="password"
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          placeholder={waiter?.isAdmin ? "8-digit PIN" : "4-digit PIN"}
                          className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-[#E74C3C] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                          <Lock size={14} /> Confirm PIN
                        </label>
                        <input 
                          type="password"
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value)}
                          placeholder="Repeat new PIN"
                          className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-[#E74C3C] outline-none"
                        />
                      </div>
                   </div>
                   <p className="text-[10px] text-gray-500 italic">
                      * Note: Admin PINs must be 8 digits. Staff PINs must be 4 digits.
                   </p>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    disabled={isUpdating}
                    className="w-full bg-[#E74C3C] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[#E74C3C]/20 disabled:opacity-50"
                  >
                    <Save size={18} />
                    {isUpdating ? "Updating..." : "Save Profile Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : activeTab === 'waiters' ? (
            <motion.div 
              key="waiters"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Add New Waiter Form */}
              <div className="lg:col-span-1 bg-[#25292E] rounded-3xl p-8 border border-gray-800 shadow-xl self-start">
                 <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-800">
                    <div className="w-12 h-12 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-600">
                       <Users size={24} />
                    </div>
                    <div>
                       <h2 className="text-lg font-bold text-white">Add Staff</h2>
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">New Employee Registration</p>
                    </div>
                 </div>

                 <form onSubmit={handleAddWaiter} className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Employee Name</label>
                       <input 
                         required
                         type="text" 
                         value={newWaiter.name}
                         onChange={(e) => setNewWaiter({...newWaiter, name: e.target.value})}
                         className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-purple-600 outline-none"
                         placeholder="e.g. Alice Smith"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Login PIN</label>
                       <input 
                         required
                         type="password" 
                         value={newWaiter.pin}
                         onChange={(e) => setNewWaiter({...newWaiter, pin: e.target.value})}
                         className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-purple-600 outline-none"
                         placeholder="Min 4 digits"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Role</label>
                       <select 
                         value={newWaiter.role}
                         onChange={(e) => setNewWaiter({...newWaiter, role: e.target.value})}
                         className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-purple-600 outline-none appearance-none"
                       >
                          <option value="waiter">Waiter / Staff</option>
                          <option value="admin">Administrator</option>
                       </select>
                    </div>
                    <button 
                       type="submit"
                       className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-purple-600/20 mt-4"
                    >
                       <Plus size={18} />
                       Register Staff
                    </button>
                 </form>
              </div>

              {/* Waiters List */}
              <div className="lg:col-span-2 space-y-4">
                 <div className="flex items-center justify-between px-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                       Active Staff List <span className="bg-purple-600/20 text-purple-500 text-[10px] px-2 py-0.5 rounded-full">{waitersList.length}</span>
                    </h3>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Manage Access</div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {waitersList.map((w) => (
                       <motion.div 
                          layout
                          key={w.id}
                          className="bg-[#25292E] border border-gray-800 p-4 rounded-2xl flex items-center justify-between group hover:border-purple-600/50 transition-all"
                       >
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
                                <User size={24} />
                             </div>
                             <div>
                                <h4 className="text-white font-bold text-sm tracking-tight">{w.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                   <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                      w.role === 'admin' ? "bg-red-500/10 text-red-500" : "bg-[#2ECC71]/10 text-[#2ECC71]"
                                   }`}>
                                      {w.role}
                                   </span>
                                   <span className="text-[10px] text-gray-600 font-mono">ID: {w.id}</span>
                                </div>
                             </div>
                          </div>
                          
                          <button 
                             onClick={() => handleDeleteWaiter(w.id)}
                             disabled={w.id === waiter?.id}
                             className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 disabled:hidden"
                          >
                             <Trash2 size={18} />
                          </button>
                       </motion.div>
                    ))}
                 </div>
              </div>
            </motion.div>
          ) : activeTab === 'cloud' ? (
            <motion.div 
              key="cloud"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <form onSubmit={handleCloudSubmit} className="bg-[#25292E] rounded-3xl p-8 border border-gray-800 shadow-xl">
                 <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-800">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
                       <Cloud size={24} />
                    </div>
                    <div>
                       <h2 className="text-lg font-bold text-white">iPOS.uz Cloud Sync</h2>
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Connect your cafe to the global network</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-blue-600/5 border border-blue-600/20 p-4 rounded-2xl flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Globe size={20} className="text-blue-500" />
                          <div>
                             <p className="text-sm font-bold text-white">Feature Status</p>
                             <p className="text-[10px] text-gray-500">Enable data sync to iPOS.uz dashboard</p>
                          </div>
                       </div>
                       <button 
                          type="button"
                          onClick={() => setCloudEnabled(!cloudEnabled)}
                          className={`w-12 h-6 rounded-full transition-all relative ${cloudEnabled ? 'bg-blue-600' : 'bg-gray-800'}`}
                       >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${cloudEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Shop ID</label>
                          <input 
                            type="text" 
                            disabled={!cloudEnabled}
                            value={shopId}
                            onChange={(e) => setShopId(e.target.value)}
                            className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-600 outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                            placeholder="e.g. SHOP_4512"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cloud API Key</label>
                          <input 
                            type="password" 
                            disabled={!cloudEnabled}
                            value={cloudApiKey}
                            onChange={(e) => setCloudApiKey(e.target.value)}
                            className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-600 outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                            placeholder="Enter Key"
                          />
                       </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
                       <p className="text-[10px] text-amber-500 font-bold italic">
                          ℹ️ Future Feature: When enabled, sales statistics will be automatically uploaded to iPOS.uz for remote monitoring.
                       </p>
                    </div>

                    <button 
                       type="submit"
                       disabled={isUpdating}
                       className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 mt-8"
                    >
                       <Save size={18} />
                       {isUpdating ? "Saving..." : "Save Cloud Configuration"}
                    </button>
                 </div>
              </form>
            </motion.div>
          ) : activeTab === 'receipt' ? (
            <motion.div 
              key="receipt"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col lg:flex-row gap-8 items-start"
            >
              <div className="flex-1 bg-[#25292E] rounded-3xl p-8 border border-gray-800 shadow-xl w-full lg:max-w-xl">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-800">
                   <div className="w-16 h-16 rounded-2xl bg-[#3498DB]/10 flex items-center justify-center text-[#3498DB]">
                      <Printer size={32} />
                   </div>
                   <div>
                      <h2 className="text-xl font-bold text-white">Receipt Design</h2>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Logo & Business Info</p>
                   </div>
                </div>

                <form onSubmit={handleReceiptSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon size={14} /> Brand Logo (Shown throughout App)
                    </label>
                    <div className="flex gap-4">
                       <label className="flex-1 cursor-pointer group">
                          <div className="w-full h-32 rounded-2xl bg-[#1A1D21] border-2 border-dashed border-gray-800 flex flex-col items-center justify-center gap-2 group-hover:border-[#3498DB] transition-all overflow-hidden relative">
                             {rConfig.logoUrl ? (
                               <img src={rConfig.logoUrl} className="w-full h-full object-contain p-2" />
                             ) : (
                               <>
                                 <Plus size={24} className="text-gray-600 group-hover:text-[#3498DB]" />
                                 <span className="text-xs text-gray-600 group-hover:text-gray-400">Click to upload logo</span>
                               </>
                             )}
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                       </label>
                       {rConfig.logoUrl && (
                         <button 
                           type="button"
                           onClick={() => setRConfig({...rConfig, logoUrl: undefined, showLogo: false})}
                           className="shrink-0 w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mt-auto hover:bg-red-500 hover:text-white transition-all"
                         >
                           <Trash2 size={20} />
                         </button>
                       )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <Store size={14} /> Restaurant Name
                    </label>
                    <input 
                      type="text"
                      value={rConfig.restaurantName}
                      onChange={(e) => setRConfig({...rConfig, restaurantName: e.target.value})}
                      className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#3498DB]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={14} /> Address
                    </label>
                    <input 
                      type="text"
                      value={rConfig.address}
                      onChange={(e) => setRConfig({...rConfig, address: e.target.value})}
                      className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#3498DB]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <Phone size={14} /> Phone
                    </label>
                    <input 
                      type="text"
                      value={rConfig.phone}
                      onChange={(e) => setRConfig({...rConfig, phone: e.target.value})}
                      className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#3498DB]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={14} /> Footer Message
                    </label>
                    <textarea 
                      rows={2}
                      value={rConfig.footerMessage}
                      onChange={(e) => setRConfig({...rConfig, footerMessage: e.target.value})}
                      className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#3498DB] resize-none"
                    />
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      className="w-full bg-[#3498DB] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[#3498DB]/20"
                    >
                      <Save size={18} />
                      Save Receipt Design
                    </button>
                  </div>
                </form>
              </div>

              {/* LIVE PREVIEW SECTION */}
              <div className="w-full lg:w-80 flex flex-col gap-4">
                 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em] text-center">Live Preview</h3>
                 <div className="bg-white text-black p-8 shadow-2xl rounded-sm font-mono text-[10px] space-y-4">
                    <div className="text-center space-y-1">
                       {rConfig.logoUrl && rConfig.showLogo && (
                         <div className="flex justify-center mb-2">
                           <img src={rConfig.logoUrl} className="h-10 w-auto grayscale" />
                         </div>
                       )}
                       <h4 className="text-sm font-bold uppercase">{rConfig.restaurantName || "RESTAURANT NAME"}</h4>
                       <p>{rConfig.address || "123 Street Address"}</p>
                       <p>Tel: {rConfig.phone || "+000 000 000"}</p>
                    </div>

                    <div className="border-y border-dashed border-black py-2 my-4 space-y-1 text-[8px]">
                       <div className="flex justify-between">
                          <span>REG: 001</span>
                          <span>DATE: {new Date().toLocaleDateString()}</span>
                       </div>
                       <div className="flex justify-between">
                          <span>TABLE: #05</span>
                          <span>WAITR: {waiter?.name}</span>
                       </div>
                    </div>

                    <div className="space-y-1">
                       <div className="flex justify-between font-bold">
                          <span>ITEM</span>
                          <span>PRICE</span>
                       </div>
                       <div className="flex justify-between">
                          <span>2x Classic Burger</span>
                          <span>$25.00</span>
                       </div>
                       <div className="flex justify-between">
                          <span>1x Coca Cola</span>
                          <span>$2.50</span>
                       </div>
                    </div>

                    <div className="border-t border-dashed border-black pt-2 mt-4 space-y-1">
                       <div className="flex justify-between">
                          <span>SUBTOTAL</span>
                          <span>$27.50</span>
                       </div>
                       <div className="flex justify-between">
                          <span>TAX (10%)</span>
                          <span>$2.75</span>
                       </div>
                       <div className="flex justify-between text-base font-black pt-1">
                          <span>TOTAL</span>
                          <span>$30.25</span>
                       </div>
                    </div>

                    <div className="text-center pt-6 space-y-2">
                       <p className="uppercase">{rConfig.footerMessage || "Thank you!"}</p>
                       <div className="h-4 w-full bg-black/10 flex gap-0.5 p-0.5 opacity-30">
                          {[...Array(12)].map((_, i) => (
                            <div key={i} className={`h-full ${i % 3 === 0 ? "flex-1" : "flex-[2]"} bg-black`} />
                          ))}
                       </div>
                    </div>
                 </div>
                 <p className="text-[10px] text-center text-gray-500 italic">This is a mock representation of the thermal print output</p>
              </div>
            </motion.div>
          ) : activeTab === 'system' ? (
            <motion.div 
              key="system"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#25292E] rounded-3xl p-8 border border-gray-800 shadow-xl max-w-2xl"
            >
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-800">
                 <div className="w-16 h-16 rounded-2xl bg-amber-600/10 flex items-center justify-center text-amber-600">
                    <Database size={32} />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-white">Advanced System Info</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Developer & Support Text</p>
                 </div>
              </div>

              <form onSubmit={handleReceiptSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} /> Developer Info (Shown on Login Screen)
                  </label>
                  <textarea 
                    rows={6}
                    value={rConfig.infoText || ""}
                    onChange={(e) => setRConfig({...rConfig, infoText: e.target.value})}
                    className="w-full bg-[#1A1D21] border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-amber-600 outline-none resize-none font-mono text-sm"
                    placeholder="Enter support info, developer name, etc..."
                  />
                  <p className="text-[10px] text-gray-500 italic">
                    This text appears in the bottom-left corner of the login screen. Use \n for new lines.
                  </p>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full bg-amber-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-amber-600/20"
                  >
                    <Save size={18} />
                    Save System Settings
                  </button>
                </div>
              </form>
            </motion.div>
          ) : activeTab === 'appearance' ? (
            <motion.div 
              key="appearance"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col lg:flex-row gap-8 items-start"
            >
              <div className="flex-1 bg-[#25292E] rounded-3xl p-8 border border-gray-800 shadow-xl w-full lg:max-w-xl">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-800">
                   <div className="w-16 h-16 rounded-2xl bg-[#2ECC71]/10 flex items-center justify-center text-[#2ECC71]">
                      <ImageIcon size={32} />
                   </div>
                   <div>
                      <h2 className="text-xl font-bold text-white">Login Appearance</h2>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Background Image</p>
                   </div>
                </div>

                <form onSubmit={handleReceiptSubmit} className="space-y-5">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                       Login Screen Background
                    </label>
                    <div className="flex gap-4">
                       <label className="flex-1 cursor-pointer group">
                          <div className="w-full h-48 rounded-2xl bg-[#1A1D21] border-2 border-dashed border-gray-800 flex flex-col items-center justify-center gap-2 group-hover:border-[#2ECC71] transition-all overflow-hidden relative">
                             {rConfig.loginBgUrl ? (
                               <img src={rConfig.loginBgUrl} className="w-full h-full object-cover opacity-50" />
                             ) : (
                               <>
                                 <Plus size={24} className="text-gray-600 group-hover:text-[#2ECC71]" />
                                 <span className="text-xs text-gray-600 group-hover:text-gray-400">Upload Login BG</span>
                               </>
                             )}
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={handleLoginBgUpload} />
                       </label>
                       {rConfig.loginBgUrl && (
                         <button 
                           type="button"
                           onClick={() => setRConfig({...rConfig, loginBgUrl: undefined})}
                           className="shrink-0 w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mt-auto hover:bg-red-500 hover:text-white transition-all"
                         >
                           <Trash2 size={20} />
                         </button>
                       )}
                    </div>
                    <p className="text-[10px] text-gray-500 italic">This image will be shown on the login screen behind the keypad.</p>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      className="w-full bg-[#2ECC71] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[#2ECC71]/20"
                    >
                      <Save size={18} />
                      Save Appearance Settings
                    </button>
                  </div>
                </form>
              </div>

              {/* LIVE PREVIEW SECTION FOR LOGIN */}
              <div className="w-full lg:w-80 flex flex-col gap-4">
                 <h3 className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em] text-center">Login Preview</h3>
                 <div className="aspect-[9/16] bg-[#1A1D21] rounded-3xl overflow-hidden relative border border-gray-800 shadow-2xl">
                    {rConfig.loginBgUrl && (
                      <img src={rConfig.loginBgUrl} className="absolute inset-0 w-full h-full object-cover opacity-30" />
                    )}
                    <div className="absolute inset-x-4 top-1/4 space-y-6 text-center">
                       <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg mx-auto flex items-center justify-center text-white font-bold italic text-sm overflow-hidden border border-white/10">
                          {rConfig.logoUrl ? (
                            <img src={rConfig.logoUrl} className="w-full h-full object-contain" alt="P" />
                          ) : (
                            <span>P</span>
                          )}
                       </div>
                       <div className="space-y-1 text-white">
                          <div className="h-4 w-24 bg-white/20 rounded mx-auto" />
                          <div className="h-2 w-32 bg-white/10 rounded mx-auto" />
                       </div>
                       <div className="grid grid-cols-3 gap-2 px-4">
                         {[...Array(9)].map((_, i) => (
                           <div key={i} className="h-8 rounded-lg bg-white/10" />
                         ))}
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          ) : activeTab === 'cloud' ? (
            <motion.div 
              key="cloud"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-[#25292E] rounded-3xl p-8 border border-gray-800 shadow-xl max-w-4xl space-y-8"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20 shadow-inner">
                    <Server size={34} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      Markaziy VPS Server & API Sozlamasi
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                        REST API v2.0
                      </span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Kassir Desktop ilovasi, planshet va Admin panelni bitta markaziy VPS serverga bog'lash
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {getServerUrl() ? "Tashqi VPS Faol" : "Lokal Server Faol"}
                  </span>
                </div>
              </div>

              {/* Server URL Input & Ping Test */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1A1D21] p-6 rounded-2xl border border-gray-800 space-y-5">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <Globe size={15} className="text-cyan-400" />
                      VPS Server Manzili (API Base URL)
                    </label>
                    <input 
                      type="text"
                      value={vpsServerUrl}
                      onChange={(e) => setVpsServerUrl(e.target.value)}
                      placeholder="Masalan: http://95.130.227.12:3000 yoki https://pos.restoran.uz"
                      className="w-full bg-[#25292E] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-cyan-500 transition-colors"
                    />
                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                      Bo'sh qoldirilsa dastur joriy domendagi API'dan foydalanadi. Desktop (.exe) yoki kassa monoblokida ishlatilganda ushbu maydonga VPS IP manzili kiritiladi.
                    </p>
                  </div>

                  {/* Presets */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setVpsServerUrl("")}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      🏠 Lokal (Default)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVpsServerUrl("http://localhost:3000")}
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      💻 Localhost:3000
                    </button>
                  </div>

                  {/* Ping Result */}
                  {vpsTestResult && (
                    <div
                      className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                        vpsTestResult.testing
                          ? "bg-blue-500/10 border border-blue-500/30 text-blue-400"
                          : vpsTestResult.success
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                          : "bg-red-500/10 border border-red-500/30 text-red-400"
                      }`}
                    >
                      {vpsTestResult.testing ? (
                        <>
                          <RefreshCw size={16} className="animate-spin text-blue-400 shrink-0" />
                          <span>VPS Server bilan ulanish sinovdan o'tkazilmoqda...</span>
                        </>
                      ) : vpsTestResult.success ? (
                        <>
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                          <span>{vpsTestResult.message}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} className="text-red-400 shrink-0" />
                          <span>{vpsTestResult.message}</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleTestVpsConnection}
                      disabled={vpsTestResult?.testing}
                      className="py-3 px-4 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Wifi size={15} />
                      <span>Ulanishni Tekshirish</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveVpsServerUrl}
                      className="py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 cursor-pointer"
                    >
                      <Save size={15} />
                      <span>Saqlash</span>
                    </button>
                  </div>
                </div>

                {/* Offline Synchronization Status */}
                <div className="bg-[#1A1D21] p-6 rounded-2xl border border-gray-800 space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <RefreshCw size={15} className="text-amber-400" />
                      Oflayn Buyurtmalar & Ma'lumotlar Sinxronizatsiyasi
                    </h3>
                    
                    <div className="p-4 rounded-xl bg-[#25292E] border border-gray-700/60 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-400">Kutilayotgan oflayn buyurtmalar:</div>
                        <div className="text-2xl font-black text-white mt-1">
                          {pendingOrdersCount} <span className="text-xs font-normal text-gray-400">ta buyurtma</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${pendingOrdersCount > 0 ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"}`}>
                        {pendingOrdersCount > 0 ? "Sinxronlash lozim" : "Hammasi yangilangan"}
                      </div>
                    </div>

                    {syncStatusMsg && (
                      <div className="p-3 rounded-xl bg-gray-800 text-xs font-medium text-gray-200 border border-gray-700">
                        {syncStatusMsg}
                      </div>
                    )}

                    <p className="text-xs text-gray-400 leading-relaxed">
                      Internet uzilib qolganda kassada olingan buyurtmalar lokal xotirada saqlanadi. Internet tiklanganda yoki ushbu tugma bosilganda avtomatik ravishda VPS serverga yuboriladi.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncOfflineOrders}
                    disabled={isManualSyncing || pendingOrdersCount === 0}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer"
                  >
                    <RefreshCw size={16} className={isManualSyncing ? "animate-spin" : ""} />
                    <span>{isManualSyncing ? "Serverga yuborilmoqda..." : "Serverga Darhol Sinxronlash"}</span>
                  </button>
                </div>
              </div>

              {/* Architecture & How It Works Guide */}
              <div className="bg-[#1A1D21] p-6 rounded-2xl border border-gray-800 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Database size={15} className="text-cyan-400" />
                  Arxitektura: VPS Server va Desktop Ilova Qanday Ishlaydi?
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#25292E]/60 border border-gray-800 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <div className="font-bold text-white">VPS Markaziy Server</div>
                    <div className="text-gray-400 leading-relaxed text-[11px]">
                      Node.js Express + SQLite API serveri VPS-da ishlab turadi. Barcha ma'lumotlar (taomlar, ofitsiantlar, buyurtmalar) ushbu markaziy bazada saqlanadi.
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#25292E]/60 border border-gray-800 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div className="font-bold text-white">Admin Panel orqali Boshqaruv</div>
                    <div className="text-gray-400 leading-relaxed text-[11px]">
                      Admin brauzerdan yoki masofadan kirib, yangi taomlar, xodimlar yoki stollarni qo'shadi. O'zgarishlar darhol VPS serveriga yoziladi.
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#25292E]/60 border border-gray-800 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <div className="font-bold text-white">Desktop / Kassa Terminali</div>
                    <div className="text-gray-400 leading-relaxed text-[11px]">
                      Kassir yoki ofitsiant POS ekrani har bir so'rovni VPS API serveriga yuboradi. Yangi taomlar kassada o'sha soniyaning o'zida ko'rinadi!
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'android' ? (
            <motion.div 
              key="android"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-[#25292E] rounded-3xl p-8 border border-gray-800 shadow-xl max-w-4xl space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-inner">
                    <Smartphone size={34} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      Android Studio (Native APK) Loyihasi
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Tayyor
                      </span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Android Studio dasturida ochib, 1 bosishda <span className="text-white font-mono font-bold">.apk</span> fayl yig'ish uchun to'liq loyiha
                    </p>
                  </div>
                </div>

                <a 
                  href="/api/android/download-project" 
                  download="iNPOS_Android_Studio.zip"
                  className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all text-sm"
                >
                  <Download size={18} />
                  <span>Loyihani Yuklab Olish (.ZIP)</span>
                </a>
              </div>

              {/* 3 Steps Guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#1A1D21] p-5 rounded-2xl border border-gray-800 flex flex-col gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
                    1
                  </div>
                  <h4 className="font-bold text-white text-sm">Arxivni ochish</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Yuqoridagi tugma orqali <span className="text-gray-200">iNPOS_Android_Studio.zip</span> faylini yuklab olib, kompyuteringizda arxivdan chiqaring.
                  </p>
                </div>

                <div className="bg-[#1A1D21] p-5 rounded-2xl border border-gray-800 flex flex-col gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-sm">
                    2
                  </div>
                  <h4 className="font-bold text-white text-sm">Android Studio'da ochish</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Android Studio dasturini oching, <span className="text-gray-200">"Open"</span> tugmasini bosing va ochilgan jildni tanlang. Gradle avtomatik sinxronlanadi.
                  </p>
                </div>

                <div className="bg-[#1A1D21] p-5 rounded-2xl border border-gray-800 flex flex-col gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-sm">
                    3
                  </div>
                  <h4 className="font-bold text-white text-sm">Build APK bosish</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Yuqori menyudan <span className="text-gray-200 font-medium">Build ➔ Build Bundle(s) / APK(s) ➔ Build APK(s)</span> bosing. Tayyor <span className="text-emerald-400 font-mono">app-debug.apk</span> chiqadi!
                  </p>
                </div>
              </div>

              {/* Technical Details */}
              <div className="bg-[#1A1D21] p-6 rounded-2xl border border-gray-800 space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <FileCode size={14} className="text-emerald-400" />
                  Loyiha Texnik Xususiyatlari & Integratsiyasi
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#25292E]/60 border border-gray-800">
                    <span className="text-gray-400">Application ID / Package:</span>
                    <span className="text-emerald-400 font-mono font-bold">uz.inpos.pos</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#25292E]/60 border border-gray-800">
                    <span className="text-gray-400">Target SDK:</span>
                    <span className="text-white font-mono font-bold">Android 14 / 15 (API 34)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#25292E]/60 border border-gray-800">
                    <span className="text-gray-400">Dasturlash tili:</span>
                    <span className="text-white font-bold">Kotlin & Modern Gradle 8.7</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#25292E]/60 border border-gray-800">
                    <span className="text-gray-400">Server ulanishi:</span>
                    <span className="text-emerald-400 font-bold">Cloud & Wi-Fi Local POS qo'llab-quvvatlanadi</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>Ofitsiant va kassa buyurtmalari avtomatik real vaqtda sinxronlanadi.</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>Bluetooth termal chek printerlar va vibro-bildirishnomalar uchun ruxsatnomalar sozlangan.</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>Internet uzilib qolganda chiroyli Offline ekrani va avtomatik qayta ulanish mavjud.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};
