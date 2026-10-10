import React, { useState, useEffect } from "react";
import { useOrder } from "../context/OrderContext";
import { formatCurrency } from "../lib/utils";
import { SoliqConfig, FiscalRecord } from "../types";
import { 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  QrCode, 
  ExternalLink, 
  FileText, 
  Receipt, 
  Save, 
  Sliders, 
  TrendingUp, 
  Calendar, 
  ShieldCheck,
  Zap,
  Info,
  Layers,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const SoliqView: React.FC = () => {
  const { waiter, linkedCafe, printCustomerBill } = useOrder();
  const activeCafeId = waiter?.cafeId || linkedCafe?.id || "default";

  const [activeTab, setActiveTab] = useState<"records" | "config" | "zreport">("records");
  const [config, setConfig] = useState<SoliqConfig | null>(null);
  const [records, setRecords] = useState<FiscalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mxikPresets, setMxikPresets] = useState<any[]>([]);
  const [packagePresets, setPackagePresets] = useState<any[]>([]);
  const [ofdOperators, setOfdOperators] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<FiscalRecord | null>(null);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);

  // Connection testing state
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Z-Report state
  const [zReport, setZReport] = useState<any | null>(null);
  const [generatingZ, setGeneratingZ] = useState(false);
  const [zDate, setZDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Form edit state
  const [formConfig, setFormConfig] = useState<Partial<SoliqConfig>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const fetchSoliqData = async () => {
    setLoading(true);
    try {
      const [cfgRes, recRes, preRes, opRes] = await Promise.all([
        fetch("/api/soliq/config", { headers: { "x-cafe-id": activeCafeId } }),
        fetch("/api/soliq/records?limit=100", { headers: { "x-cafe-id": activeCafeId } }),
        fetch("/api/soliq/presets", { headers: { "x-cafe-id": activeCafeId } }),
        fetch("/api/soliq/operators", { headers: { "x-cafe-id": activeCafeId } })
      ]);

      const cfgData = await cfgRes.json();
      const recData = await recRes.json();
      const preData = await preRes.json();
      const opData = await opRes.json();

      if (cfgData.success && cfgData.config) {
        setConfig(cfgData.config);
        setFormConfig(cfgData.config);
      }
      if (recData.success && Array.isArray(recData.records)) {
        setRecords(recData.records);
      }
      if (preData.success) {
        setMxikPresets(preData.mxikPresets || []);
        setPackagePresets(preData.packagePresets || []);
      }
      if (opData.success && Array.isArray(opData.operators)) {
        setOfdOperators(opData.operators);
      }
    } catch (err) {
      console.error("Failed to load Soliq data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSoliqData();
  }, [activeCafeId]);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/soliq/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId
        },
        body: JSON.stringify(formConfig)
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        connected: false,
        message: "Server bilan bog'lanishda xatolik: " + err.message
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch("/api/soliq/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId
        },
        body: JSON.stringify(formConfig)
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setSaveSuccessMsg("Soliq va OFD sozlamalari muvaffaqiyatli saqlandi!");
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        alert(data.message || "Xatolik yuz berdi");
      }
    } catch (err: any) {
      alert("Server bilan bog'lanishda xatolik: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateZReport = async () => {
    setGeneratingZ(true);
    try {
      const res = await fetch("/api/soliq/z-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId
        },
        body: JSON.stringify({ date: zDate })
      });
      const data = await res.json();
      if (data.success) {
        setZReport(data);
      } else {
        alert(data.error || "Z-Hisobot yaratishda xatolik yuz berdi");
      }
    } catch (err: any) {
      alert("Xatolik: " + err.message);
    } finally {
      setGeneratingZ(false);
    }
  };

  // Calculations
  const totalFiscalAmount = records.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
  const totalVatAmount = records.reduce((sum, r) => sum + (Number(r.vatAmount) || 0), 0);
  const totalCashAmount = records.reduce((sum, r) => sum + (Number(r.cashAmount) || 0), 0);
  const totalCardAmount = records.reduce((sum, r) => sum + (Number(r.cardAmount) || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#1A1D21] p-6 lg:p-8 overflow-y-auto custom-scrollbar">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-white">Soliq.uz Integratsiyasi</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck size={12} />
                  OFD Fiskal
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-0.5">
                Davlat Soliq Qo'mitasi virtual kassasi: sotuvlar avtomatik ro'yxatdan o'tadi va keshbek QR-cheklari generatsiya qilinadi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSoliqData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25292E] hover:bg-gray-800 text-gray-300 hover:text-white text-xs font-bold transition-all border border-gray-700"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Yangilash
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#25292E] p-5 rounded-2xl border border-gray-800 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Fiskal Sotuvlar Soni</span>
            <Receipt size={18} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{records.length} ta</div>
          <p className="text-xs text-gray-500 mt-1">Soliqda qayd etilgan cheklar</p>
        </div>

        <div className="bg-[#25292E] p-5 rounded-2xl border border-gray-800 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Jami Soliq Tushumi</span>
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{formatCurrency(totalFiscalAmount)}</div>
          <p className="text-xs text-gray-500 mt-1">Naqd: {formatCurrency(totalCashAmount)} | Karta: {formatCurrency(totalCardAmount)}</p>
        </div>

        <div className="bg-[#25292E] p-5 rounded-2xl border border-gray-800 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Hisoblangan QQS (12%)</span>
            <Zap size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{formatCurrency(totalVatAmount)}</div>
          <p className="text-xs text-gray-500 mt-1">Davlat byudjetiga hisoblangan soliq</p>
        </div>

        <div className="bg-[#25292E] p-5 rounded-2xl border border-gray-800 shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Kassa & Rejim</span>
            <ShieldCheck size={18} className="text-purple-400" />
          </div>
          <div className="text-lg font-black text-white truncate">{config?.virtualKassaNumber || "RNM-34857715"}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${config?.enabled ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-xs text-gray-400">
              {config?.enabled ? (config.isTestMode ? "Test / Simulyatsiya" : "Jonli OFD") : "O'chirilgan"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-[#25292E] w-fit rounded-2xl border border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab("records")}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "records" ? "bg-emerald-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
          }`}
        >
          <Receipt size={15} />
          Fiskal Cheklar Ro'yxati ({records.length})
        </button>
        <button
          onClick={() => setActiveTab("zreport")}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "zreport" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
          }`}
        >
          <FileText size={15} />
          Kunlik Z-Hisobot (Soliq)
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "config" ? "bg-purple-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
          }`}
        >
          <Sliders size={15} />
          Soliq & Kassa Sozlamalari
        </button>
      </div>

      {/* TAB 1: FISCAL RECORDS */}
      {activeTab === "records" && (
        <div className="bg-[#25292E] rounded-3xl border border-gray-800 shadow-xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Soliq.uz da Ro'yxatdan O'tgan Sotuvlar</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Har bir urilgan mahsulot soliqda sotuv sifatida ko'rinadi, keshbek uchun rasmiy fiskal belgi va Soliq QR havolasiga ega.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">Jami: {records.length} ta chek</span>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="p-16 text-center text-gray-500">
              <Receipt size={48} className="mx-auto mb-3 opacity-30 text-emerald-400" />
              <p className="text-base font-bold text-gray-400">Hozircha fiskal cheklar mavjud emas</p>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                Kassada buyurtmani yopib to'lov qilganingizda, sotuv avtomatik ravishda Soliq tizimida ro'yxatdan o'tadi va bu yerda ko'rinadi.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#1A1D21] text-gray-400 uppercase font-black tracking-wider text-[10px] border-b border-gray-800">
                  <tr>
                    <th className="py-3.5 px-4">Chek #</th>
                    <th className="py-3.5 px-4">Sana & Vaqt</th>
                    <th className="py-3.5 px-4">Fiskal Belgi (Sign)</th>
                    <th className="py-3.5 px-4">Summa</th>
                    <th className="py-3.5 px-4">QQS (12%)</th>
                    <th className="py-3.5 px-4">To'lov Turi</th>
                    <th className="py-3.5 px-4">Holati</th>
                    <th className="py-3.5 px-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 font-medium">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        #{rec.receiptNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {rec.createdAt ? new Date(rec.createdAt).toLocaleString("uz-UZ", {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : "-"}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400 font-bold tracking-wider">
                        {rec.fiscalSign}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {formatCurrency(rec.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-amber-400 font-bold">
                        {formatCurrency(rec.vatAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-gray-800 text-gray-300">
                          {rec.cashAmount > 0 && rec.cardAmount > 0 ? "Aralash" : rec.cardAmount > 0 ? "Karta" : "Naqd"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 size={12} />
                          Tasdiqlangan
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {rec.fiscalUrl && (
                            <>
                              <button
                                onClick={() => setQrModalUrl(rec.fiscalUrl || null)}
                                title="Soliq QR kodini ko'rsatish"
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              >
                                <QrCode size={14} />
                              </button>
                              <a
                                href={rec.fiscalUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Soliq.uz da tekshirish"
                                className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                              >
                                <ExternalLink size={14} />
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Z-REPORT */}
      {activeTab === "zreport" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-[#25292E] p-6 rounded-3xl border border-gray-800 shadow-xl h-fit">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-800">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Z-Hisobot Parametrlari</h3>
                <p className="text-xs text-gray-400">Kunlik fiskal yakun</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Hisobot Sanasi
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={zDate}
                    onChange={(e) => setZDate(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl py-2.5 pl-10 pr-3 text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-blue-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Info size={14} />
                  Soliq Z-Hisoboti nima?
                </p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Z-Hisobot smena yakunida barcha urilgan cheklar, umumiy savdo, naqd va karta tushumlari hamda hisoblangan QQS miqdorini jamlab Soliq organiga rasmiy yuboradi.
                </p>
              </div>

              <button
                onClick={handleGenerateZReport}
                disabled={generatingZ}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
              >
                {generatingZ ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Z-Hisobot shakllantirilmoqda...
                  </>
                ) : (
                  <>
                    <FileText size={16} />
                    Z-Hisobotni Shakllantirish va Yopish
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            {zReport ? (
              <div className="bg-[#25292E] p-8 rounded-3xl border border-gray-800 shadow-xl">
                <div className="text-center pb-6 border-b border-dashed border-gray-700 mb-6">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1 mb-2">
                    <CheckCircle2 size={12} />
                    Soliqqa muvaffaqiyatli topshirildi
                  </span>
                  <h2 className="text-xl font-black text-white uppercase">{zReport.companyName}</h2>
                  <p className="text-xs text-gray-400 mt-1">KUNLIK KASSA Z-HISOBOTI: {zReport.zReportNumber}</p>
                  <p className="text-xs text-gray-500">STIR (INN): {zReport.companyInn} | RNM: {zReport.terminalNumber}</p>
                  <p className="text-xs text-gray-500">FM: {zReport.fiscalModuleNumber} | Sana: {zReport.date}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-[#1A1D21] border border-gray-800 text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Jami Cheklar</span>
                    <div className="text-xl font-black text-white mt-1">{zReport.totalReceipts} ta</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#1A1D21] border border-gray-800 text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Jami Tushum</span>
                    <div className="text-xl font-black text-emerald-400 mt-1">{formatCurrency(zReport.totalRevenue)}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#1A1D21] border border-gray-800 text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Naqd Savdo</span>
                    <div className="text-xl font-black text-white mt-1">{formatCurrency(zReport.cashTotal)}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#1A1D21] border border-gray-800 text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Karta Savdo</span>
                    <div className="text-xl font-black text-white mt-1">{formatCurrency(zReport.cardTotal)}</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#1A1D21] border border-gray-800 mb-6 flex justify-between items-center text-sm font-bold">
                  <span className="text-gray-400">Jami Hisoblangan QQS (12%):</span>
                  <span className="text-amber-400 font-black">{formatCurrency(zReport.vatTotal)}</span>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-gray-200 transition-all flex items-center gap-2"
                  >
                    <Receipt size={14} />
                    Z-Hisobotni Chop Etish
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#25292E] p-12 rounded-3xl border border-gray-800 text-center text-gray-500">
                <FileText size={48} className="mx-auto mb-3 opacity-30 text-blue-400" />
                <h3 className="text-base font-bold text-gray-300">Z-Hisobot shakllantirilmagan</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  Chap tarafdagi tugma orqali bugungi yoki tanlangan sana bo'yicha Soliq Z-Hisobotini generatsiya qiling.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CONFIGURATION */}
      {activeTab === "config" && (
        <div className="space-y-6 max-w-4xl">
          {/* OFD.uz & Soliq.uz Diagnostic & Explanation Banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 shadow-xl">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle size={22} />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Nega https://ofd.uz yoki Soliq ilovasida "Chek xato / Topilmadi" deydi?</span>
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  O'zbekiston Respublikasi Davlat Soliq Qo'mitasi talablariga binoan, chek <strong className="text-white">ofd.uz</strong> yoki <strong className="text-white">soliq.uz</strong> bazasida rasmiy chiqishi va 1% keshbek berishi uchun:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px]">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <span className="font-bold text-amber-400 block">1. Kassa RNM va STIR</span>
                    <span className="text-gray-400">DSQ (my.soliq.uz) da ro'yxatdan o'tgan Virtual Kassa RNM raqami va korxona STIR kiritilishi shart.</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <span className="font-bold text-amber-400 block">2. OFD Operator & Kalit</span>
                    <span className="text-gray-400">OFD operatoringiz (OFD.uz, Soliq.uz yoki E-POS) shartnoma bo'yicha bergan API kalitini kiriting.</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <span className="font-bold text-emerald-400 block">3. Jonli OFD Rejimi</span>
                    <span className="text-gray-400">Pastdagi "Test / Simulyatsiya Rejimi"ni o'chirib, "Jonli OFD Shlyuzi"ga o'tkazing.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="bg-[#25292E] rounded-3xl p-8 border border-gray-800 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-800 mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Soliq & Virtual Kassa Sozlamalari</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  OFD.uz va Davlat Soliq Qo'mitasi integratsiyasi parametrlari.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <RefreshCw size={14} className={testingConnection ? "animate-spin" : ""} />
                  {testingConnection ? "Tekshirilmoqda..." : "Ulanishni Tekshirish"}
                </button>
                {saveSuccessMsg && (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 size={14} />
                    {saveSuccessMsg}
                  </span>
                )}
              </div>
            </div>

            {/* Test Result Toast */}
            {testResult && (
              <div className={`p-4 rounded-2xl mb-6 border flex items-start gap-3 ${
                testResult.connected ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"
              }`}>
                {testResult.connected ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">{testResult.message}</p>
                  {testResult.operator && <p className="text-[11px] text-gray-400">Operator: {testResult.operator} | Terminal: {testResult.terminal || formConfig.virtualKassaNumber}</p>}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Master Toggle & Auto-Fiscalize */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center justify-between p-4 rounded-2xl bg-[#1A1D21] border border-gray-800 cursor-pointer">
                  <div>
                    <span className="text-sm font-bold text-white block">Soliq Integratsiyasi</span>
                    <span className="text-xs text-gray-400">Sotuvlarni Soliqda ro'yxatdan o'tkazish</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formConfig.enabled ?? true}
                    onChange={(e) => setFormConfig({ ...formConfig, enabled: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-2xl bg-[#1A1D21] border border-gray-800 cursor-pointer">
                  <div>
                    <span className="text-sm font-bold text-white block">Avtomatik Fiskallashtirish</span>
                    <span className="text-xs text-gray-400">Chek yopilganda soliqqa avtomat uzatish</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formConfig.autoFiscalize ?? true}
                    onChange={(e) => setFormConfig({ ...formConfig, autoFiscalize: e.target.checked })}
                    className="w-5 h-5 accent-blue-500 rounded"
                  />
                </label>
              </div>

              {/* Mode Selector (Test vs Live) */}
              <div className="p-4 rounded-2xl bg-[#1A1D21] border border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white block">
                    {formConfig.isTestMode ? "🛠️ Test / Simulyatsiya Rejimi" : "🟢 Jonli OFD Shlyuzi (OFD.uz / Soliq.uz)"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formConfig.isTestMode
                      ? "Faol: Cheklar lokal generatsiya qilinadi (OFD serveriga yuborilmaydi). Soliq tekshiruvida xato bermasligi uchun haqiqiy soliqqa ulanishdan oldin jonli rejimni yoqing."
                      : "Jonli Rejim: Cheklar to'g'ridan-to'g'ri OFD.uz / Soliq.uz serveriga uzatiladi va Soliq ilovasida 1% keshbek beradi."}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formConfig.isTestMode ?? true}
                  onChange={(e) => setFormConfig({ ...formConfig, isTestMode: e.target.checked })}
                  className="w-5 h-5 accent-purple-500 rounded"
                />
              </div>

              {/* OFD Operator Selector */}
              <div className="p-4 rounded-2xl bg-[#1A1D21] border border-gray-800 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  OFD Operatorini Tanlang *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ofdOperators.length > 0 ? ofdOperators.map(op => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setFormConfig({
                        ...formConfig,
                        ofdOperator: op.name,
                        apiUrl: op.url
                      })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formConfig.ofdOperator?.includes(op.name.split(" ")[0]) || formConfig.apiUrl === op.url
                          ? "bg-emerald-500/10 border-emerald-500 text-white"
                          : "bg-[#25292E] border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white"
                      }`}
                    >
                      <span className="text-xs font-bold block">{op.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono truncate block mt-0.5">{op.url}</span>
                    </button>
                  )) : (
                    <button
                      type="button"
                      onClick={() => setFormConfig({ ...formConfig, ofdOperator: "OFD.uz (UzSmart)", apiUrl: "https://ofd.uz/api/v1/receipt" })}
                      className="p-3 rounded-xl border bg-emerald-500/10 border-emerald-500 text-white text-left"
                    >
                      <span className="text-xs font-bold block">OFD.uz (UzSmart)</span>
                      <span className="text-[10px] text-gray-400">https://ofd.uz/api/v1/receipt</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Korxona STIR (INN) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="308192847"
                    value={formConfig.companyInn || ""}
                    onChange={(e) => setFormConfig({ ...formConfig, companyInn: e.target.value })}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Korxona / Kafe Nomi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="INPOS RESTAURANT MCHJ"
                    value={formConfig.companyName || ""}
                    onChange={(e) => setFormConfig({ ...formConfig, companyName: e.target.value })}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Virtual Kassa Raqami (RNM) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="RNM-34857715"
                    value={formConfig.virtualKassaNumber || ""}
                    onChange={(e) => setFormConfig({ ...formConfig, virtualKassaNumber: e.target.value })}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Fiskal Modul Raqami (FM ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="FM-99881122"
                    value={formConfig.fiscalModuleNumber || ""}
                    onChange={(e) => setFormConfig({ ...formConfig, fiscalModuleNumber: e.target.value })}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    OFD API Manzili (URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://ofd.uz/api/v1/receipt"
                    value={formConfig.apiUrl || ""}
                    onChange={(e) => setFormConfig({ ...formConfig, apiUrl: e.target.value })}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    OFD API Kalit (Token / Parol)
                  </label>
                  <input
                    type="password"
                    placeholder="OFD Operatoringiz bergan maxfiy kalit"
                    value={formConfig.apiKey || ""}
                    onChange={(e) => setFormConfig({ ...formConfig, apiKey: e.target.value })}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Standart QQS Stavkasi (%)
                  </label>
                  <select
                    value={formConfig.defaultVatPercent ?? 12}
                    onChange={(e) => setFormConfig({ ...formConfig, defaultVatPercent: Number(e.target.value) })}
                    className="w-full bg-[#1A1D21] border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value={12}>12% (Standart QQS stavkasi O'zbekiston)</option>
                    <option value={0}>0% (QQS to'lamaydigan kichik biznes / soddalashtirilgan)</option>
                  </select>
                </div>
              </div>

              {/* Default MXIK (IKPU) & Package */}
              <div className="p-5 rounded-2xl bg-[#1A1D21] border border-gray-800 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Standart MXIK (IKPU) va O'lchov Birligi
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5">
                      Standart MXIK (IKPU) Kodi
                    </label>
                    <select
                      value={formConfig.defaultMxikCode || "05610001001000000"}
                      onChange={(e) => setFormConfig({ ...formConfig, defaultMxikCode: e.target.value })}
                      className="w-full bg-[#25292E] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                    >
                      {mxikPresets.map((m) => (
                        <option key={m.code} value={m.code}>
                          {m.code} - {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5">
                      Standart O'lchov Birligi (Package Code)
                    </label>
                    <select
                      value={formConfig.defaultPackageCode || "796"}
                      onChange={(e) => setFormConfig({ ...formConfig, defaultPackageCode: e.target.value })}
                      className="w-full bg-[#25292E] border border-gray-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                    >
                      {packagePresets.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.code} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Saqlanmoqda..." : "Soliq Sozlamalarini Saqlash"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* QR Code Inspection Modal */}
      {qrModalUrl && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#25292E] border border-gray-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-base font-bold text-white mb-1">Soliq.uz Fiskal QR Keshbek Kody</h3>
            <p className="text-xs text-gray-400 mb-4">Mijoz Soliq ilovasida 1% keshbek olishi mumkin</p>

            <div className="p-4 bg-white rounded-2xl inline-block mb-4 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrModalUrl)}`}
                alt="Soliq QR"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="text-[11px] font-mono text-gray-400 break-all p-2 rounded-xl bg-[#1A1D21] border border-gray-800 mb-4">
              {qrModalUrl}
            </div>

            <div className="flex gap-2">
              <a
                href={qrModalUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 flex items-center justify-center gap-1.5"
              >
                <ExternalLink size={14} />
                Soliq.uz da ochish
              </a>
              <button
                onClick={() => setQrModalUrl(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-bold text-xs hover:bg-gray-700"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
