import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  confirmInputRequirement = "",
  loading = false,
  loadingText = "Processing...",
  variant = "danger",
}) => {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setInputValue("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmedDisabled = 
    confirmInputRequirement && 
    inputValue.trim() !== confirmInputRequirement;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-rose-50 border-rose-100",
          iconColor: "text-rose-500",
          confirmBtn: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20",
        };
      case "warning":
        return {
          iconBg: "bg-amber-50 border-amber-100",
          iconColor: "text-amber-500",
          confirmBtn: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20",
        };
      default:
        return {
          iconBg: "bg-emerald-50 border-emerald-100",
          iconColor: "text-emerald-500",
          confirmBtn: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 border ${styles.iconBg}`}>
            <AlertCircle className={`w-7 h-7 ${styles.iconColor}`} />
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            {message}
          </p>

          {confirmInputRequirement && (
            <div className="w-full mb-6 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                Type <span className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-sm select-all">{confirmInputRequirement}</span> to confirm
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Type ${confirmInputRequirement}`}
                disabled={loading}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm font-semibold text-slate-800 outline-hidden transition-all placeholder:text-slate-400"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row w-full gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white rounded-xl text-sm font-semibold transition-all focus:outline-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading || isConfirmedDisabled}
              className={`flex-1 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition-all focus:outline-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${styles.confirmBtn}`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {loadingText}
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
