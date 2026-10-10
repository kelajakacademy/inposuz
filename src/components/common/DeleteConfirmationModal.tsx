import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  itemName?: string;
  itemType?: string; // "mijoz", "xodim", "buyurtma", "printer", "zal"
  message?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title = "O'chirishni tasdiqlang",
  itemName,
  itemType = "ma'lumot",
  message,
  isDeleting = false,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="bg-white border border-gray-200 rounded-2xl shadow-2xl max-w-md w-full p-6 text-[#1E293B] relative animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Warning Icon Banner */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100/80 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
            <Trash2 size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-snug">
              {title}
            </h3>
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-0.5">
              <AlertTriangle size={13} />
              <span>Bu amalni ortga qaytarib bo'lmaydi!</span>
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-gray-50/80 border border-gray-150 rounded-xl p-3.5 mb-5 text-xs text-gray-600 leading-relaxed">
          {message ? (
            <p>{message}</p>
          ) : (
            <p>
              Haqiqatdan ham {itemName ? <strong className="text-gray-900 font-bold">«{itemName}»</strong> : "ushbu"} {itemType}ni tizim va bazadan butunlay o'chirib tashlamoqchimisiz?
            </p>
          )}
          <p className="mt-2 text-[11px] text-gray-500">
            O'chirish amalga oshirilgach, barcha tegishli yozuvlar va o'zgarishlar <strong className="text-gray-700">Audit loglar</strong> jurnalida qayd etiladi.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
          >
            <Trash2 size={15} />
            <span>{isDeleting ? "O'chirilmoqda..." : "Ha, butunlay o'chirilsin"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
