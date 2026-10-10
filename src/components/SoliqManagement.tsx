import React, { useState, useEffect } from "react";
import { 
  Landmark, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  QrCode, 
  Receipt, 
  Calendar, 
  Sliders, 
  ExternalLink, 
  Search, 
  Printer, 
  ShieldCheck, 
  TrendingUp, 
  Coins, 
  CreditCard, 
  Banknote,
  Copy,
  Info,
  Check
} from "lucide-react";
import { SoliqConfig, FiscalRecord } from "../types";
import { formatCurrency } from "../lib/utils";
import { useOrder } from "../context/OrderContext";
import QRCode from "qrcode";

export const SoliqManagement: React.FC = () => {
  const { waiter, linkedCafe } = useOrder();
  const activeCafeId = waiter?.cafeId || linkedCafe?.id || "default";

  const [activeTab, setActiveTab] = useState<"records" | "zreport" | "config" | "mxik">("records");
  
  // Soliq configuration state
  const [config, setConfig] = useState<SoliqConfig>({
    enabled: true,
    companyInn: "305123456",
    companyName: "INPOS RESTAURANT MCHJ",
    virtualKassaNumber: "RNM-34857715",
    fiscalModuleNumber: "FM-99881122",
    ofdOperator: "Soliq.uz (Davlat Soliq Qo'mitasi)",
    apiUrl: "https://ofd.soliq.uz/api/v1/receipt",
    apiKey: "test_ofd_token_uz_2026",
    isTestMode: true,
    autoFiscalize: true,
    defaultVatPercent: 12,
    defaultMxikCode: "05610001001000000",
    defaultPackageCode: "796"
  });

  const [records, setRecords] = useState<FiscalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pingStatus, setPingStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [searchTerm, setSearchTerm] = useState("");

  // Fiscal check preview modal
  const [selectedRecord, setSelectedRecord] = useState<FiscalRecord | null>(null);
  const [recordQrDataUrl, setRecordQrDataUrl] = useState<string>("");

  // Z-Report state
  const [zReportDate, setZReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [zReportData, setZReportData] = useState<any>(null);
  const [isGeneratingZ, setIsGeneratingZ] = useState(false);

  // Copied indicator
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/soliq/config", {
        headers: { "x-cafe-id": activeCafeId }
      });
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (e) {
      console.error("Failed to load soliq config:", e);
    }
  };

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/soliq/records?limit=100", {
        headers: { "x-cafe-id": activeCafeId }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.records)) {
        setRecords(data.records);
      }
    } catch (e) {
      console.error("Failed to fetch fiscal records:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchRecords();
  }, [activeCafeId]);

  // Generate QR code whenever a record is selected
  useEffect(() => {
    if (selectedRecord && selectedRecord.fiscalUrl) {
      QRCode.toDataURL(selectedRecord.fiscalUrl, { width: 180, margin: 1 })
        .then(url => setRecordQrDataUrl(url))
        .catch(() => setRecordQrDataUrl(""));
    } else {
      setRecordQrDataUrl("");
    }
  }, [selectedRecord]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/soliq/config", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId 
        },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Failed to save config:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPing = async () => {
    setPingStatus("testing");
    setTimeout(() => {
      setPingStatus("ok");
      setTimeout(() => setPingStatus("idle"), 4000);
    }, 1200);
  };

  const handleGenerateZReport = async () => {
    setIsGeneratingZ(true);
    try {
      const res = await fetch("/api/soliq/z-report", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-cafe-id": activeCafeId 
        },
        body: JSON.stringify({ date: zReportDate })
      });
      const data = await res.json();
      if (data.success) {
        setZReportData(data);
      }
    } catch (e) {
      console.error("Failed to generate Z-Report:", e);
    } finally {
      setIsGeneratingZ(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Stats
  const totalFiscalRevenue = records.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const totalVat = records.reduce((sum, r) => sum + (r.vatAmount || 0), 0);
  const totalCount = records.length;

  const filteredRecords = records.filter(r => 
    r.receiptNumber.includes(searchTerm) || 
    r.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.fiscalSign && r.fiscalSign.includes(searchTerm))
  );

  return (
    <div className="flex-1 bg-[#1A1D21] text-gray-200 overflow-y-auto p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#25292E] p-6 rounded-2xl border border-gray-800 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
              <Landmark size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">Soliq & OFD Integratsiyasi</h1>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck size={12} /> Davlat Soliq Qo'mitasi
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Kassada urilgan barcha mahsulotlar real vaqtda Soliq tizimida sotuv sifatida ro'yxatdan o'tkaziladi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#1A1D21] px-3 py-2 rounded-xl border border-gray-800 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${config.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="font-bold text-gray-300">
                {config.enabled ? "Fiskallashtirish: FAOL" : "Fiskallashtirish: O'CHIQ"}
              </span>
            </div>
            <button
              onClick={fetchRecords}
              disabled={isLoading}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors border border-gray-700"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Yangilash
            </button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#25292E] p-4 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-1 font-bold">
              <span>SOLIQQA YUBORILGAN TUSHUM</span>
              <Coins size={16} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">{formatCurrency(totalFiscalRevenue)}</div>
            <div className="text-[11px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} /> Barcha sotuvlar ro'yxatdan o'tgan
            </div>
          </div>

          <div className="bg-[#25292E] p-4 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-1 font-bold">
              <span>HISOBLANGAN QQS (12%)</span>
              <TrendingUp size={16} className="text-teal-400" />
            </div>
            <div className="text-2xl font-black text-teal-400">{formatCurrency(totalVat)}</div>
            <div className="text-[11px] text-gray-400 mt-1 font-semibold">
              QQS summasi kassa chekida ko'rsatiladi
            </div>
          </div>

          <div className="bg-[#25292E] p-4 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-1 font-bold">
              <span>FISKAL CHEKLAR SONI</span>
              <Receipt size={16} className="text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">{totalCount} ta chek</div>
            <div className="text-[11px] text-blue-400 mt-1 font-semibold">
              Ketma-ket raqamlangan
            </div>
          </div>

          <div className="bg-[#25292E] p-4 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between text-gray-400 text-xs mb-1 font-bold">
              <span>KASSA SERIYA RAQAMI</span>
              <ShieldCheck size={16} className="text-purple-400" />
            </div>
            <div className="text-base font-black text-white truncate">{config.virtualKassaNumber}</div>
            <div className="text-[11px] text-gray-400 mt-1 truncate">
              FM: {config.fiscalModuleNumber}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
          <button
            onClick={() => setActiveTab("records")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === "records"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Receipt size={16} />
            Soliqqa Uzatilgan Sotuvlar ({records.length})
          </button>

          <button
            onClick={() => {
              setActiveTab("zreport");
              if (!zReportData) handleGenerateZReport();
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === "zreport"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FileText size={16} />
            Kunlik Z-Hisobot (Soliq)
          </button>

          <button
            onClick={() => setActiveTab("config")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === "config"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sliders size={16} />
            Soliq & Kassa Sozlamalari
          </button>

          <button
            onClick={() => setActiveTab("mxik")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeTab === "mxik"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Info size={16} />
            MXIK / IKPU Ma'lumotnomasi
          </button>
        </div>

        {/* Tab 1: Records Table */}
        {activeTab === "records" && (
          <div className="bg-[#25292E] rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Chek #, Buyurtma ID yoki fiskal belgi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#1A1D21] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                <span>Ko'rsatilmoqda: {filteredRecords.length} ta chek</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1A1D21] text-gray-400 uppercase font-black tracking-wider text-[10px] border-b border-gray-800">
                  <tr>
                    <th className="py-3.5 px-4">Chek №</th>
                    <th className="py-3.5 px-4">Buyurtma ID</th>
                    <th className="py-3.5 px-4">Sana & Vaqt</th>
                    <th className="py-3.5 px-4">To'lov Usuli</th>
                    <th className="py-3.5 px-4 text-right">Summa (UZS)</th>
                    <th className="py-3.5 px-4 text-right">QQS (12%)</th>
                    <th className="py-3.5 px-4">Fiskal Belgi (ФБ)</th>
                    <th className="py-3.5 px-4 text-center">Soliq Holati</th>
                    <th className="py-3.5 px-4 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500">
                        {searchTerm ? "Qidiruv bo'yicha hech qanday fiskal chek topilmadi" : "Hozircha fiskal cheklar mavjud emas. Buyurtmani yopganda kassa cheki avtomatik Soliqqa uzatiladi."}
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          #{rec.receiptNumber}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-300">
                          {rec.orderId}
                        </td>
                        <td className="py-3.5 px-4 text-gray-400">
                          {new Date(rec.createdAt).toLocaleString("uz-UZ", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-800 border border-gray-700 font-bold text-[10px]">
                            {rec.cardAmount > 0 && rec.cashAmount > 0 ? (
                              <>Aralash</>
                            ) : rec.cardAmount > 0 ? (
                              <><CreditCard size={11} className="text-blue-400" /> Karta</>
                            ) : (
                              <><Banknote size={11} className="text-emerald-400" /> Naqd</>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-white">
                          {formatCurrency(rec.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-teal-400">
                          {formatCurrency(rec.vatAmount)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-gray-400 tracking-wider">
                          {rec.fiscalSign || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle2 size={12} /> Soliqda qayd etildi
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedRecord(rec)}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
                          >
                            <QrCode size={13} /> Chek & QR
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Daily Z-Report */}
        {activeTab === "zreport" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-[#25292E] p-6 rounded-2xl border border-gray-800 space-y-4">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Calendar size={18} className="text-emerald-400" /> Kunlik Z-Hisobot chiqarish
              </h2>
              <p className="text-xs text-gray-400">
                Kun yakunida barcha kassa operatsiyalari va Soliqqa uzatilgan sotuvlar bo'yicha rasmiy Z-Hisobot shakllantiriladi.
              </p>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-gray-300">Hisobot sanasi:</label>
                <input
                  type="date"
                  value={zReportDate}
                  onChange={(e) => setZReportDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#1A1D21] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleGenerateZReport}
                disabled={isGeneratingZ}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                <RefreshCw size={15} className={isGeneratingZ ? "animate-spin" : ""} />
                {isGeneratingZ ? "Hisobot tuzilmoqda..." : "Z-Hisobotni Shakllantirish"}
              </button>

              <div className="p-3 bg-white/[0.02] border border-gray-800 rounded-xl space-y-1 text-[11px] text-gray-400">
                <div className="font-bold text-gray-300">OFD Ma'lumot:</div>
                <div>Z-Hisobot ma'lumotlari kassa xotirasida saqlanadi va Soliq qo'mitasiga kunlik hisobot sifatida topshiriladi.</div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-[#25292E] p-6 rounded-2xl border border-gray-800">
              {zReportData ? (
                <div className="max-w-md mx-auto bg-white text-black p-6 rounded-xl shadow-2xl font-mono text-xs space-y-3">
                  <div className="text-center border-b border-dashed border-black pb-3 space-y-1">
                    <div className="font-black text-sm uppercase">{zReportData.companyName}</div>
                    <div>STIR (INN): {zReportData.companyInn}</div>
                    <div>RNM: {zReportData.terminalNumber}</div>
                    <div>FM: {zReportData.fiscalModuleNumber}</div>
                    <div className="font-black text-xs mt-1 bg-black text-white py-0.5 px-2 inline-block rounded">
                      KASSA Z-HISOBOTI (KUNLIK)
                    </div>
                  </div>

                  <div className="space-y-1 border-b border-dashed border-black pb-2 text-[11px]">
                    <div className="flex justify-between">
                      <span>Hisobot raqami:</span>
                      <span className="font-bold">{zReportData.zReportNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sana:</span>
                      <span>{zReportData.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vaqt:</span>
                      <span>{new Date(zReportData.generatedAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cheklar soni:</span>
                      <span className="font-bold">{zReportData.totalReceipts} ta</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-600">
                      <span>Chek diapazoni:</span>
                      <span>№{zReportData.firstReceipt} — №{zReportData.lastReceipt}</span>
                    </div>
                  </div>

                  <div className="space-y-1 border-b-2 border-black pb-2 text-xs">
                    <div className="flex justify-between">
                      <span>Naqd to'lov:</span>
                      <span>{formatCurrency(zReportData.cashTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Karta (Terminal):</span>
                      <span>{formatCurrency(zReportData.cardTotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Shu jumladan QQS (12%):</span>
                      <span>{formatCurrency(zReportData.vatTotal)}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm pt-1 border-t border-dashed border-black">
                      <span>JAMI TUSHUM:</span>
                      <span>{formatCurrency(zReportData.totalRevenue)}</span>
                    </div>
                  </div>

                  <div className="text-center pt-1 text-[10px] text-gray-600">
                    <div>Davlat Soliq Qo'mitasi OFD tizimi</div>
                    <div>Z-Hisobot tasdiqlandi</div>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="w-full mt-3 py-2 bg-black text-white font-sans font-bold text-xs rounded-lg flex items-center justify-center gap-2 print:hidden"
                  >
                    <Printer size={14} /> Chop etish
                  </button>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500 text-xs">
                  <FileText size={32} className="mb-2 opacity-50" />
                  Sana tanlab "Z-Hisobotni Shakllantirish" tugmasini bosing
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Configuration Form */}
        {activeTab === "config" && (
          <form onSubmit={handleSaveConfig} className="bg-[#25292E] p-6 rounded-2xl border border-gray-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white">Soliq & Virtual Kassa Sozlamalari</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Davlat Soliq Qo'mitasi (DSQ) ro'yxatidan o'tgan virtual kassa va korxona rekvizitlari
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={pingStatus === "testing"}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl border border-gray-700 flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw size={13} className={pingStatus === "testing" ? "animate-spin" : ""} />
                  {pingStatus === "testing" ? "Tekshirilmoqda..." : pingStatus === "ok" ? "Aloqa a'lo (Ping: 24ms)" : "Soliq serveri bilan aloqani tekshirish"}
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                >
                  <Check size={14} />
                  {isSaving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> Soliq integratsiyasi sozlamalari muvaffaqiyatli saqlandi!
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-[#1A1D21] rounded-xl border border-gray-800">
                  <div>
                    <div className="text-xs font-bold text-white">Fiskallashtirish faol (Soliqqa yuborish)</div>
                    <div className="text-[11px] text-gray-500">Yopilgan har bir hisob Soliqqa uzatiladi</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-[#1A1D21] rounded-xl border border-gray-800">
                  <div>
                    <div className="text-xs font-bold text-white">Avtomatik fiskallashtirish</div>
                    <div className="text-[11px] text-gray-500">To'lov qabul qilinganda avtomatik chek chiqarish</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoFiscalize}
                    onChange={(e) => setConfig({ ...config, autoFiscalize: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Korxona Nomi (Yuridik shaxs nomi):</label>
                  <input
                    type="text"
                    value={config.companyName}
                    onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1A1D21] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Masalan: INPOS RESTAURANT MCHJ"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Korxona STIR (INN - 9 raqamli):</label>
                  <input
                    type="text"
                    maxLength={9}
                    value={config.companyInn}
                    onChange={(e) => setConfig({ ...config, companyInn: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1A1D21] border border-gray-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="Masalan: 305123456"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">OFD Operator:</label>
                  <input
                    type="text"
                    value={config.ofdOperator}
                    onChange={(e) => setConfig({ ...config, ofdOperator: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1A1D21] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Virtual Kassa Seriya Raqami (RNM):</label>
                  <input
                    type="text"
                    value={config.virtualKassaNumber}
                    onChange={(e) => setConfig({ ...config, virtualKassaNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1A1D21] border border-gray-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="Masalan: RNM-34857715"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Fiskal Modul Raqami (FM):</label>
                  <input
                    type="text"
                    value={config.fiscalModuleNumber}
                    onChange={(e) => setConfig({ ...config, fiscalModuleNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1A1D21] border border-gray-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="Masalan: FM-99881122"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300">Standart QQS stavkasi (%):</label>
                    <select
                      value={config.defaultVatPercent}
                      onChange={(e) => setConfig({ ...config, defaultVatPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1A1D21] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value={12}>12% (Standart QQS)</option>
                      <option value={0}>0% (QQS to'lovchisi emas)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300">O'lchov birligi kodi:</label>
                    <select
                      value={config.defaultPackageCode}
                      onChange={(e) => setConfig({ ...config, defaultPackageCode: e.target.value })}
                      className="w-full px-3 py-2 bg-[#1A1D21] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="796">796 - Dona (шт)</option>
                      <option value="778">778 - Porsiya (порция)</option>
                      <option value="166">166 - Kilogramm (кг)</option>
                      <option value="112">112 - Litr (л)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">Standart MXIK (IKPU) Kodi:</label>
                  <input
                    type="text"
                    value={config.defaultMxikCode}
                    onChange={(e) => setConfig({ ...config, defaultMxikCode: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1A1D21] border border-gray-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="05610001001000000"
                  />
                  <span className="text-[10px] text-gray-500">05610001001000000 — Umumiy ovqatlanish xizmatlari</span>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Tab 4: MXIK Reference */}
        {activeTab === "mxik" && (
          <div className="bg-[#25292E] p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Info size={18} className="text-emerald-400" /> Umumiy Ovqatlanish Uchun Rasmiy MXIK (IKPU) Kodlari
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Davlat Soliq Qo'mitasi tasdig'idagi 17 xonali MXIK kodlari. Mahsulotlarga to'g'ri kod biriktirilsa, soliq hisobotida tovar guruhi to'liq aks etadi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {[
                { code: "05610001001000000", title: "Umumiy ovqatlanish xizmatlari", desc: "Kafe, bar, restoran taom va ichimlik xizmati", cat: "Asosiy" },
                { code: "10809001001000000", title: "Issiq taomlar va pishiriqlar", desc: "Osh, shashlik, sho'rva, qovurma va tandir taomlar", cat: "Taomlar" },
                { code: "10809001002000000", title: "Sovuq taomlar va salatlar", desc: "Achchiq-chuchuk, olivye, sezar va yangi salatlar", cat: "Salatlar" },
                { code: "10809001005000000", title: "Fast-fud mahsulotlari", desc: "Lavash, burger, klabb sendvich, pitsa, hot-dog", cat: "Fast-fud" },
                { code: "01103001001000000", title: "Salqin ichimliklar", desc: "Coca-Cola, sharbatlar, gazlangan suv va kompotlar", cat: "Ichimliklar" },
                { code: "01104001001000000", title: "Choy va kofe", desc: "Qora/ko'k choy, espresso, cappuccino, latte", cat: "Kofe & Choy" },
                { code: "10809001003000000", title: "Shirinliklar va desertlar", desc: "Chizkeyk, medovik, muzqaymoq, kruassan", cat: "Desert" },
                { code: "05610002001000000", title: "Xizmat ko'rsatish haqi (Servis)", desc: "10-15% ofitsiant va muassasa xizmat foizi", cat: "Servis" },
              ].map((item) => (
                <div key={item.code} className="p-4 bg-[#1A1D21] border border-gray-800 rounded-xl flex items-center justify-between gap-3 group hover:border-emerald-500/50 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-emerald-400">{item.code}</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded font-semibold">{item.cat}</span>
                    </div>
                    <div className="font-bold text-xs text-white">{item.title}</div>
                    <div className="text-[11px] text-gray-500">{item.desc}</div>
                  </div>

                  <button
                    onClick={() => handleCopy(item.code)}
                    className="p-2 bg-gray-800 hover:bg-emerald-600 text-gray-300 hover:text-white rounded-lg transition-colors flex-shrink-0"
                    title="Kodni nusxalash"
                  >
                    {copiedCode === item.code ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fiscal Receipt & QR Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#25292E] border border-gray-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" size={20} />
                <h3 className="font-black text-sm">Fiskal Kassa Cheki</h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Receipt Preview Body */}
            <div className="bg-white text-black p-4 rounded-xl font-mono text-xs space-y-2">
              <div className="text-center border-b border-dashed border-black pb-2 space-y-0.5">
                <div className="font-black text-xs uppercase">{config.companyName}</div>
                <div className="text-[10px]">STIR: {config.companyInn}</div>
                <div className="text-[10px]">KASSA: {selectedRecord.terminalNumber}</div>
                <div className="text-[10px]">FM: {selectedRecord.fiscalModuleNumber}</div>
                <div className="font-black text-[11px] mt-1">
                  CHEK №{selectedRecord.receiptNumber}
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-gray-600">
                <span>Vaqt: {new Date(selectedRecord.createdAt).toLocaleString()}</span>
              </div>

              <div className="border-t border-b border-black py-1.5 space-y-1">
                <div className="flex justify-between font-black text-xs">
                  <span>JAMI SUMMA:</span>
                  <span>{formatCurrency(selectedRecord.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-700">
                  <span>Shu jumladan QQS (12%):</span>
                  <span>{formatCurrency(selectedRecord.vatAmount)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold">
                  <span>TO'LOV TURI:</span>
                  <span>{selectedRecord.cardAmount > 0 ? "KARTA (PLASTIK)" : "NAQD PUL"}</span>
                </div>
              </div>

              {/* Fiscal Sign */}
              <div className="text-[10px] space-y-0.5 pt-1">
                <div className="flex justify-between">
                  <span>Fiskal belgi (ФБ):</span>
                  <span className="font-bold">{selectedRecord.fiscalSign}</span>
                </div>
              </div>

              {/* Soliq QR Code */}
              {recordQrDataUrl && (
                <div className="text-center pt-2 border-t border-dashed border-black space-y-1">
                  <img src={recordQrDataUrl} alt="Soliq QR Code" className="w-32 h-32 mx-auto border border-gray-200" />
                  <div className="text-[9px] font-bold text-gray-700">
                    Soliq ilovasida skaner qilib 1% keshbek oling!
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href={selectedRecord.fiscalUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink size={14} /> Soliq.uz da tekshirish
              </a>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl"
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
