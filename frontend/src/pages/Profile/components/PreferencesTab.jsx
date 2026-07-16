import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import authService from "../../../services/authService";
import toast from "react-hot-toast";
import { Check, Loader2 } from "lucide-react";

const PreferencesTab = () => {
  const { user, updateUser } = useAuth();
  const [emailAlerts, setEmailAlerts] = useState(
    user?.notificationPrefs?.emailAlerts !== false
  );
  const [weeklyReport, setWeeklyReport] = useState(
    user?.notificationPrefs?.weeklyReport === true
  );
  const [productUpdates, setProductUpdates] = useState(
    user?.notificationPrefs?.productUpdates === true
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const res = await authService.updateProfile({
        notificationPrefs: {
          emailAlerts,
          weeklyReport,
          productUpdates,
        },
      });

      updateUser({
        notificationPrefs: res.data.notificationPrefs,
      });

      toast.success("Settings updated successfully");
    } catch (err) {
      toast.error(err.message || err.error || "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h4 className="text-lg font-bold text-slate-900">Notifications</h4>
        <p className="text-xs text-slate-500 font-semibold">Configure how and when you receive study summaries and updates from CleverPrep.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pt-4 border-t border-slate-100">
        <div className="space-y-5">
          {/* Email Alerts Toggle */}
          <div className="flex items-start justify-between gap-4 py-2">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-slate-800">Email Notifications</p>
              <p className="text-xs text-slate-400 font-semibold leading-normal max-w-md">
                Receive email alerts as soon as your PDF podcasts, flashcards, or study plans are successfully generated.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEmailAlerts(!emailAlerts)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                emailAlerts ? "bg-emerald-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  emailAlerts ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Weekly Report Toggle */}
          <div className="flex items-start justify-between gap-4 py-2 border-t border-slate-50 pt-4">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-slate-800">Weekly Study Summary</p>
              <p className="text-xs text-slate-400 font-semibold leading-normal max-w-md">
                Get a detailed diagnostic email report every Sunday reviewing your quiz results and document study activity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWeeklyReport(!weeklyReport)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                weeklyReport ? "bg-emerald-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  weeklyReport ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Product Updates Toggle */}
          <div className="flex items-start justify-between gap-4 py-2 border-t border-slate-50 pt-4">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-slate-800">Product Updates</p>
              <p className="text-xs text-slate-400 font-semibold leading-normal max-w-md">
                Receive notifications about new features, enhancements, and monthly roadmap releases.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setProductUpdates(!productUpdates)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                productUpdates ? "bg-emerald-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  productUpdates ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreferencesTab;
