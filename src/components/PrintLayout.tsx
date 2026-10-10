import React, { useEffect, useState } from "react";
import { useOrder } from "../context/OrderContext";
import { formatCurrency } from "../lib/utils";
import { Printer, X, CheckCircle2, UtensilsCrossed, Receipt, FileText } from "lucide-react";
import QRCode from "qrcode";

export const PrintLayout = () => {
  const { 
    cart, 
    total, 
    subtotal, 
    tax, 
    waiter, 
    currentTable, 
    setIsPrinting, 
    clearCart, 
    printType, 
    activeOrder, 
    receiptConfig,
    kitchenPrintItems,
    printOrder,
    dailyReportData
  } = useOrder();

  const [hasPrinted, setHasPrinted] = useState(false);
  const [soliqQrDataUrl, setSoliqQrDataUrl] = useState<string>("");

  const isKitchen = printType === "kitchen";
  const isBar = printType === "bar";
  const isPrecheck = printType === "precheck";
  const isReport = printType === "report";
  const isBill = printType === "bill";

  // Target Order resolution
  const targetOrder = printOrder || activeOrder;
  const targetTableNumber = targetOrder?.tableNumber || currentTable?.number || "-";
  const targetWaiterName = targetOrder?.waiterName || waiter?.name || "Waiter";

  // Items resolution
  const printedItems = isKitchen
    ? (kitchenPrintItems.length > 0 ? kitchenPrintItems : (targetOrder?.items || cart))
    : (targetOrder?.items || cart);

  const handleManualPrint = () => {
    window.print();
  };

  const handleClose = () => {
    setIsPrinting(false);
    if (isBill) {
      clearCart();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        window.print();
        setHasPrinted(true);
      } catch (e) {
        console.warn("Auto-print could not open system dialog:", e);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [printType]);

  useEffect(() => {
    if (isBill) {
      const qrTarget = targetOrder?.fiscalQrUrl || `https://soliq.uz/check?t=${targetOrder?.fiscalTerminalId || 'RNM-34857715'}&s=${targetOrder?.fiscalSign || '994829104820'}&a=${targetOrder?.total || total}`;
      QRCode.toDataURL(qrTarget, { width: 140, margin: 1 })
        .then(url => setSoliqQrDataUrl(url))
        .catch(err => {
          console.warn("QR generation error:", err);
          setSoliqQrDataUrl("");
        });
    }
  }, [isBill, targetOrder, total]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Screen action card */}
      <div className="bg-[#25292E] border border-gray-700 rounded-2xl p-4 shadow-2xl max-w-sm w-full mb-4 flex flex-col gap-3 text-white print:hidden">
        <div className="flex items-center justify-between border-b border-gray-700 pb-3">
          <div className="flex items-center gap-2">
            {isKitchen ? (
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                🍳
              </div>
            ) : isBar ? (
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                🍹
              </div>
            ) : isPrecheck ? (
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                📄
              </div>
            ) : isReport ? (
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                📊
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                💳
              </div>
            )}
            <div>
              <p className="font-bold text-sm">
                {isKitchen 
                  ? "Ошхона чеки (Кухня KOT)" 
                  : isBar 
                  ? "Бар чеки (Бар KOT)" 
                  : isPrecheck 
                  ? "Пречек (Ҳисоб-чек)" 
                  : isReport 
                  ? "Кунлик ҳисобот (Z-Report)" 
                  : "Фискаль тўлов чеки"}
              </p>
              <p className="text-[10px] text-gray-400">
                Printer: {isKitchen || isBar ? "KOT Thermal 80mm" : "Cashier Thermal 80mm"}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleManualPrint}
            className="flex-1 bg-white text-black py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-md"
          >
            <Printer size={16} />
            Chop etish (Print)
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl bg-gray-800 text-gray-300 hover:text-white text-xs font-semibold hover:bg-gray-700 transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>

      {/* Printable Paper Canvas */}
      <div 
        id="thermal-receipt" 
        className="bg-white text-black p-6 rounded-lg shadow-2xl font-mono text-xs w-[340px] max-w-full print:w-full print:p-0 print:shadow-none print:rounded-none"
        style={{ letterSpacing: "-0.01em" }}
      >
        {isReport && dailyReportData ? (
          /* DAILY FINANCIAL REPORT (Z-REPORT) */
          <div>
            <div className="text-center pb-3 border-b-2 border-dashed border-black mb-3">
              <h1 className="text-base font-black uppercase tracking-wider">{receiptConfig.restaurantName}</h1>
              <p className="font-bold text-sm mt-1">*** KUNLIK KASSA HISOBOTI ***</p>
              <p className="text-[10px] text-gray-600">SANA: {dailyReportData.date}</p>
              <p className="text-[10px] text-gray-600">CHOP VAQTI: {new Date().toLocaleTimeString()}</p>
              <p className="text-[10px] text-gray-600">KASSIR/ADMIN: {waiter?.name}</p>
            </div>

            <div className="space-y-2 mb-3 pb-3 border-b border-dashed border-black">
              <div className="flex justify-between font-black text-sm">
                <span>JAMI TUSHUM:</span>
                <span>{formatCurrency(dailyReportData.totalSales)}</span>
              </div>
              <div className="flex justify-between">
                <span>Buyurtmalar soni:</span>
                <span className="font-bold">{dailyReportData.totalOrdersCount} ta</span>
              </div>
              <div className="flex justify-between">
                <span>O'rtacha chek:</span>
                <span className="font-bold">
                  {dailyReportData.totalOrdersCount > 0 
                    ? formatCurrency(Math.round(dailyReportData.totalSales / dailyReportData.totalOrdersCount)) 
                    : formatCurrency(0)}
                </span>
              </div>
            </div>

            <div className="space-y-1 mb-3 pb-3 border-b border-dashed border-black">
              <p className="font-bold uppercase text-[10px]">To'lov turlari bo'yicha:</p>
              <div className="flex justify-between">
                <span>• Naqd pul:</span>
                <span className="font-bold">{formatCurrency(dailyReportData.cashSales)}</span>
              </div>
              <div className="flex justify-between">
                <span>• Plastik karta:</span>
                <span className="font-bold">{formatCurrency(dailyReportData.cardSales)}</span>
              </div>
              {dailyReportData.mixedSales > 0 && (
                <div className="flex justify-between">
                  <span>• Aralash:</span>
                  <span className="font-bold">{formatCurrency(dailyReportData.mixedSales)}</span>
                </div>
              )}
            </div>

            {dailyReportData.waiters && dailyReportData.waiters.length > 0 && (
              <div className="mb-3 pb-3 border-b border-dashed border-black">
                <p className="font-bold uppercase text-[10px] mb-1">Ofitsiantlar bo'yicha:</p>
                {dailyReportData.waiters.map((w: any, idx: number) => (
                  <div key={idx} className="flex justify-between py-0.5">
                    <span>{w.waiterName} ({w.orderCount} ta)</span>
                    <span className="font-bold">{formatCurrency(w.totalSales)}</span>
                  </div>
                ))}
              </div>
            )}

            {dailyReportData.topProducts && dailyReportData.topProducts.length > 0 && (
              <div className="mb-3 pb-3 border-b border-dashed border-black">
                <p className="font-bold uppercase text-[10px] mb-1">Top mahsulotlar:</p>
                {dailyReportData.topProducts.map((p: any, idx: number) => (
                  <div key={idx} className="flex justify-between py-0.5 text-[11px]">
                    <span className="truncate pr-2">{idx + 1}. {p.name}</span>
                    <span className="font-bold">{p.quantity} dona</span>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center pt-2 text-[10px]">
              <p className="font-bold">*** KASSA YOPILDI ***</p>
              <p className="text-[9px] text-gray-500 mt-1">iPOS Tizimi orqali generatsiya qilindi</p>
            </div>
          </div>
        ) : (isKitchen || isBar) ? (
          /* KITCHEN OR BAR ORDER TICKET (KOT) */
          <div>
            <div className="text-center border-b-2 border-black pb-2 mb-3">
              <h1 className="text-lg font-black uppercase tracking-widest bg-black text-white py-1 px-2">
                {isBar ? "БАР ЧЕКИ (БАР KOT)" : "ОШХОНА ЧЕКИ (КУХНЯ KOT)"}
              </h1>
              <p className="text-[10px] font-bold mt-1 uppercase tracking-wider text-gray-700">
                ПРИНТЕР: {isBar ? "BAR PRINTER 80mm" : (receiptConfig.kitchenPrinterName || "KITCHEN PRINTER 80mm")}
              </p>
            </div>

            <div className="border-b-2 border-black pb-2 mb-3 space-y-1 font-bold">
              <div className="flex justify-between items-center">
                <span className="text-base font-black">СТОЛ #:</span>
                <span className="text-2xl font-black bg-black text-white px-2 py-0.5 rounded">
                  {targetTableNumber}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span>ОФИЦИАНТ:</span>
                <span className="uppercase">{targetWaiterName}</span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-700">
                <span>ВАҚТ:</span>
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            </div>

            {/* Kitchen/Bar Items List */}
            <div className="border-b-2 border-black pb-3 mb-3">
              <div className="text-left font-bold border-b border-black pb-1 mb-2 flex justify-between text-xs">
                <span>{isBar ? "ИЧИМЛИК NOMI" : "ТАОМ NOMI"}</span>
                <span>СОНИ</span>
              </div>
              <div className="space-y-3">
                {printedItems.map((item, idx) => (
                  <div key={item.cartId || idx} className="flex items-start justify-between">
                    <div className="pr-2">
                      <p className="font-black text-sm uppercase leading-tight">
                        {item.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black border-2 border-black px-1.5 py-0.5 inline-block">
                        x{item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center pt-1 font-bold">
              <p className="text-xs uppercase font-black tracking-wider">
                {isBar ? "*** БАРДА ТЕЗДА ТАЙЁРЛАНСИН ***" : "*** ОШХОНАДА ТЕЗДА ТАЙЁРЛАНСИН ***"}
              </p>
            </div>
          </div>
        ) : isPrecheck ? (
          /* PRE-CHECK (ПРЕЧЕК - СЧЕТ ГОСТЮ BEFORE PAYMENT) */
          <div>
            <div className="text-center pb-2 border-b-2 border-black mb-3">
              <h1 className="text-base font-black uppercase tracking-wider">{receiptConfig.restaurantName}</h1>
              <div className="text-xs font-black bg-black text-white py-0.5 px-2 rounded inline-block mt-1">
                ПРЕЧЕК / СЧЕТ ГОСТЮ
              </div>
              <p className="text-[10px] text-gray-700 mt-1">Тел: {receiptConfig.phone}</p>
            </div>

            <div className="border-b border-dashed border-black py-2 mb-3 text-[11px] space-y-0.5 font-bold">
              <div className="flex justify-between">
                <span>СТОЛ: #{targetTableNumber}</span>
                <span>ОФИЦИАНТ: {targetWaiterName}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-[10px]">
                <span>Сана: {new Date().toLocaleDateString()}</span>
                <span>Вақт: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <table className="w-full text-left mb-3">
              <thead>
                <tr className="border-b border-black text-[10px] font-bold">
                  <th className="py-1">НАЗВАНИЕ</th>
                  <th className="py-1 text-center">КОЛ-ВО</th>
                  <th className="py-1 text-right">ЦЕНА</th>
                  <th className="py-1 text-right">ИТОГО</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-gray-300">
                {printedItems.map((item, idx) => (
                  <tr key={idx} className="py-1 text-[11px]">
                    <td className="py-1 font-bold truncate max-w-[120px]">{item.name}</td>
                    <td className="py-1 text-center font-bold">{item.quantity}</td>
                    <td className="py-1 text-right">{formatCurrency(item.price)}</td>
                    <td className="py-1 text-right font-black">{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-black pt-2 space-y-1 mb-3 text-xs font-bold">
              <div className="flex justify-between">
                <span>Подитог:</span>
                <span>{formatCurrency(targetOrder?.subtotal || subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Обслуживание (10%):</span>
                <span>{formatCurrency(targetOrder?.tax || tax)}</span>
              </div>
              <div className="flex justify-between text-base font-black border-t-2 border-black pt-1.5 mt-1">
                <span>К ОПЛАТЕ:</span>
                <span>{formatCurrency(targetOrder?.total || total)}</span>
              </div>
            </div>

            <div className="text-center pt-2 border-t border-dashed border-black text-[10px] font-bold">
              <p>*** ПРЕЧЕК - ТЎЛОВДАН ОЛДИНГИ ЧЕК ***</p>
              <p className="text-[9px] text-gray-500 font-normal">Раҳмат! Яна кутиб қоламиз!</p>
            </div>
          </div>
        ) : (
          /* FINAL CUSTOMER BILL / CASHIER RECEIPT */
          <div>
            <div className="text-center pb-3 border-b border-dashed border-black mb-3">
              {receiptConfig.showLogo && (
                <div className="flex justify-center mb-1.5">
                  {receiptConfig.logoUrl ? (
                    <img src={receiptConfig.logoUrl} className="h-10 w-auto grayscale" alt="Logo" />
                  ) : (
                    <div className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center font-bold text-base italic">
                      {receiptConfig.restaurantName.charAt(0) || "P"}
                    </div>
                  )}
                </div>
              )}
              <h1 className="text-sm font-black uppercase tracking-wider">{receiptConfig.restaurantName}</h1>
              <p className="text-[10px] text-gray-700">{receiptConfig.address}</p>
              <p className="text-[10px] text-gray-700">Tel: {receiptConfig.phone}</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">
                Kassa Printeri: {receiptConfig.cashierPrinterName || "Cashier"}
              </p>
            </div>

            <div className="border-b border-dashed border-black py-2 mb-3 text-[11px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>STOL: #{targetTableNumber}</span>
                <span>OFITSIANT: {targetWaiterName}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Sana: {new Date().toLocaleDateString()}</span>
                <span>Vaqt: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {targetOrder?.id && (
                <div className="text-gray-500 text-[10px]">
                  Chek: #{targetOrder.id.toUpperCase()}
                </div>
              )}
              {targetOrder?.clientName && (
                <div className="border-t border-dotted border-gray-400 pt-1 mt-1 font-bold text-black flex justify-between">
                  <span>MEHMON (CRM):</span>
                  <span>{targetOrder.clientName} {targetOrder.clientGroupName ? `(${targetOrder.clientGroupName})` : ''}</span>
                </div>
              )}
            </div>

            {/* Table of items */}
            <table className="w-full text-left mb-3">
              <thead>
                <tr className="border-b border-black text-[10px] font-bold">
                  <th className="py-1">NOM</th>
                  <th className="py-1 text-center">SON</th>
                  <th className="py-1 text-right">NARX</th>
                  <th className="py-1 text-right">JAMI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-gray-300">
                {printedItems.map((item, idx) => (
                  <tr key={item.cartId || idx} className="py-1.5">
                    <td className="py-1 font-bold truncate max-w-[130px]">
                      <div>{item.name}</div>
                      <div className="text-[8px] text-gray-500 font-mono">
                        MXIK: {item.mxikCode || '05610001001000000'}
                      </div>
                    </td>
                    <td className="py-1 text-center font-bold">{item.quantity}</td>
                    <td className="py-1 text-right">{formatCurrency(item.price)}</td>
                    <td className="py-1 text-right font-black">{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Totals */}
            <div className="border-t border-black pt-2 space-y-1 mb-3">
              <div className="flex justify-between text-xs">
                <span>Oraliq hisob (Subtotal):</span>
                <span>{formatCurrency(targetOrder?.subtotal || subtotal)}</span>
              </div>
              {Number(targetOrder?.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-xs font-bold">
                  <span>Chegirma ({targetOrder?.discountPercent || 0}%):</span>
                  <span>-{formatCurrency(targetOrder?.discountAmount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span>Shu jumladan QQS (12%):</span>
                <span>{formatCurrency(targetOrder?.fiscalVatAmount || Math.round((targetOrder?.total || total) * 0.12 / 1.12))}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Xizmat haqi (10%):</span>
                <span>{formatCurrency(targetOrder?.tax || tax)}</span>
              </div>

              {Number(targetOrder?.bonusSpent || 0) > 0 && (
                <div className="flex justify-between text-xs font-bold">
                  <span>Bonusdan to‘landi:</span>
                  <span>-{formatCurrency(targetOrder?.bonusSpent || 0)}</span>
                </div>
              )}

              {Number(targetOrder?.depositSpent || 0) > 0 && (
                <div className="flex justify-between text-xs font-bold">
                  <span>Depozitdan yechildi:</span>
                  <span>-{formatCurrency(targetOrder?.depositSpent || 0)}</span>
                </div>
              )}

              {Number(targetOrder?.debtAmount || 0) > 0 && (
                <div className="flex justify-between text-xs font-bold text-red-600">
                  <span>Nasiya / Qarz summasi:</span>
                  <span>{formatCurrency(targetOrder?.debtAmount || 0)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-black border-t-2 border-black pt-1.5 mt-1">
                <span>JAMI TO'LOV:</span>
                <span>{formatCurrency(targetOrder?.total || total)}</span>
              </div>

              {(targetOrder?.paymentMethod || activeOrder?.paymentMethod) && (
                <div className="flex justify-between text-[11px] font-bold border-t border-dashed border-black pt-1.5 mt-1">
                  <span>TO'LOV USULI:</span>
                  <span className="uppercase font-black text-black">
                    {targetOrder?.paymentMethod === 'cash' ? "NAQD PUL" : 
                     targetOrder?.paymentMethod === 'card' ? "PLASTIK KARTA" : 
                     targetOrder?.paymentMethod === 'deposit' ? "DEPOZIT HISOBIDAN" :
                     targetOrder?.paymentMethod === 'debt' ? "NASIYA / QARZ" :
                     targetOrder?.paymentMethod === 'bonus' ? "BONUS HISOBIDAN" :
                     targetOrder?.paymentMethod === 'mixed' ? "ARALASH TO'LOV" :
                     targetOrder?.paymentMethod || "NAQD"}
                  </span>
                </div>
              )}

              {Number(targetOrder?.cashbackEarned || 0) > 0 && (
                <div className="flex justify-between text-[11px] font-bold border-t border-dotted border-black pt-1 mt-1 text-emerald-800">
                  <span>💎 KESHBEK HISOBLANDI:</span>
                  <span>+{formatCurrency(targetOrder?.cashbackEarned || 0)}</span>
                </div>
              )}
            </div>

            {/* Soliq.uz Official Fiscalization Block */}
            <div className="border-t-2 border-dashed border-black pt-2.5 pb-2 text-center my-2 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider bg-black text-white py-0.5 px-1 rounded inline-block">
                SOLIQ.UZ FISKAL CHEKI
              </div>
              <div className="text-[9px] font-mono text-gray-700 leading-tight">
                RNM: {targetOrder?.fiscalTerminalId || "RNM-34857715"} | FM: {targetOrder?.fiscalModuleNumber || "FM-99881122"}
              </div>
              <div className="text-[9px] font-mono font-bold">
                Fiskal belgi: {targetOrder?.fiscalSign || "994829104820"}
              </div>
              <div className="text-[9px] text-gray-600">
                Fiskal chek raqami: #{targetOrder?.fiscalReceiptSeq || (targetOrder?.id ? targetOrder.id.slice(-6).toUpperCase() : "000124")}
              </div>

              {/* Soliq 1% Cashback QR Code */}
              <div className="py-1 flex flex-col items-center justify-center">
                {soliqQrDataUrl ? (
                  <img 
                    src={soliqQrDataUrl}
                    alt="Soliq QR Code"
                    className="w-20 h-20 border border-gray-300 p-1"
                  />
                ) : (
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                      targetOrder?.fiscalQrUrl || `https://soliq.uz/check?t=${targetOrder?.fiscalTerminalId || 'RNM-34857715'}&s=${targetOrder?.fiscalSign || '994829104820'}&a=${targetOrder?.total || total}`
                    )}`}
                    alt="Soliq QR Code"
                    className="w-20 h-20 border border-gray-300 p-1"
                  />
                )}
                <span className="text-[8px] font-black uppercase tracking-wider text-black mt-1">
                  Soliq ilovasida 1% keshbek oling
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t border-dashed border-black pt-3">
              <p className="text-[10px] font-bold uppercase">{receiptConfig.footerMessage}</p>
              <p className="text-[9px] text-gray-500 mt-1">Xaridingiz uchun tashakkur!</p>

              {/* Barcode simulation */}
              <div className="mt-2 flex justify-center">
                <div className="h-7 w-40 bg-black flex gap-[2px] p-[2px]">
                  {[...Array(24)].map((_, i) => (
                    <div key={i} className="bg-white flex-1" style={{ width: ((i % 3) + 1) + 'px' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          #thermal-receipt, #thermal-receipt * { visibility: visible !important; }
          #thermal-receipt { 
            position: fixed !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 8px !important;
            background: white !important;
            color: black !important;
          }
        }
      `}} />
    </div>
  );
};

