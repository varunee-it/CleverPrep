import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useTour } from "../../../context/TourContext";
import authService from "../../../services/authService";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

const SettingsTab = () => {
  const { user, logout } = useAuth();
  const { replayTour, toggleAutoShowNewTours } = useTour();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await authService.deleteAccount();
      toast.success("Account deleted successfully");
      setShowDeleteModal(false);
      logout();
    } catch (err) {
      toast.error(err.message || err.error || "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  const deleteConfirmationInput = user?.username || "DELETE";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h4 className="text-lg font-bold text-slate-900">Settings & Account Control</h4>
        <p className="text-xs text-slate-500 font-semibold">Manage system behaviors and account status.</p>
      </div>

      <div className="pt-6 border-t border-slate-100 space-y-4">
        {/* Export Data */}
        <div className="flex items-center justify-between border border-slate-200/80 rounded-xl p-4 bg-slate-50/30">
          <div>
            <h5 className="text-xs font-bold text-slate-900">Export Account Data</h5>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Request a downloadable archive of your study notes and documents.</p>
          </div>
          <button
            disabled
            className="h-9 px-4 bg-slate-100 text-slate-450 border border-slate-250/60 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed select-none"
          >
            <span>📦</span>
            <span>Export (Soon)</span>
          </button>
        </div>

        {/* Product Tour Replay Settings */}
        <div className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/30 space-y-4 tour-profile-settings">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-slate-900">Product Tour</h5>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Replay the CleverPrep guided onboarding walkthrough tutorial.</p>
            </div>
            <button
              onClick={() => replayTour()}
              className="h-9 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Start Tour
            </button>
          </div>
          
          <div className="pt-3 border-t border-slate-100/70 flex items-center gap-3">
            <input
              type="checkbox"
              id="autoShowNewTours"
              checked={user?.onboarding?.autoShowNewTours ?? true}
              onChange={(e) => toggleAutoShowNewTours(e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-slate-350 rounded focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="autoShowNewTours" className="text-[11px] font-bold text-slate-650 cursor-pointer">
              Automatically show new feature tours
            </label>
          </div>
        </div>

        {/* Delete Account */}
        <div className="flex items-center justify-between border border-slate-200/80 rounded-xl p-4 bg-slate-50/30">
          <div>
            <h5 className="text-xs font-bold text-slate-900">Delete Account</h5>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Deleting your account permanently removes all your study data.</p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="h-9 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-rose-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete your CleverPrep account?"
        message="This action is permanent and cannot be undone. To prevent accidental deletions, please type your username below to confirm."
        confirmText="Permanently Delete Account"
        confirmInputRequirement={deleteConfirmationInput}
        loading={deleting}
        loadingText="Deleting account..."
        variant="danger"
      />
    </div>
  );
};

export default SettingsTab;
