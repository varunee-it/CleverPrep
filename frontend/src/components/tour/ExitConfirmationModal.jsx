import React, { useEffect } from "react";
import { AlertCircle } from "lucide-react";

const ExitConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 backdrop-blur-[3px] p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 sm:p-8 border border-slate-100/50 transform transition-all duration-200 animate-in fade-in zoom-in-95 ease-out"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-modal-title"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-4 border border-amber-100 shadow-xs">
            <AlertCircle className="w-6 h-6 text-amber-500" strokeWidth={2} />
          </div>
          <h3 id="exit-modal-title" className="text-lg font-bold text-slate-900 mb-2">
            Leave the guided tour?
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-6 font-semibold">
            You can replay this tour at any time from your Account Settings.
          </p>
          
          <div className="flex w-full gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none focus:ring-2 focus:ring-slate-300"
              autoFocus
            >
              Continue Tour
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/25 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-rose-500"
            >
              Exit Tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmationModal;
