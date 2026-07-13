import React, { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import Spinner from "../../components/common/Spinner";
import authService from "../../services/authService";
import progressService from "../../services/progressService";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  BookOpen,
  BrainCircuit,
  FileText,
  LogOut,
  Bell,
  Check,
  AlertCircle
} from "lucide-react";
import moment from "moment";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Active section: 'account' | 'security' | 'notifications'
  const [activeSection, setActiveSection] = useState("account");

  // Profile data state
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    createdAt: null
  });
  const [statsData, setStatsData] = useState(null);

  // Form states
  const [usernameInput, setUsernameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [preferredNameInput, setPreferredNameInput] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          authService.getProfile(),
          progressService.getDashboardData().catch(() => null)
        ]);

        const usernameVal = profileRes.data.username || "";
        const emailVal = profileRes.data.email || "";

        setProfileData({
          username: usernameVal,
          email: emailVal,
          createdAt: profileRes.data.createdAt || null
        });

        setUsernameInput(usernameVal);
        setEmailInput(emailVal);

        // Load preferred study name
        const savedName = localStorage.getItem("preferredStudyName") || "";
        setPreferredNameInput(savedName);

        // Load notifications
        try {
          const savedNotifs = localStorage.getItem("cleverprep_notification_prefs");
          if (savedNotifs) {
            const parsed = JSON.parse(savedNotifs);
            setEmailAlerts(parsed.emailAlerts !== false);
            setWeeklyReport(parsed.weeklyReport === true);
          }
        } catch (e) {}

        if (statsRes && statsRes.data) {
          setStatsData(statsRes.data.overview);
        }
      } catch (error) {
        toast.error("Failed to load profile data.");
        console.error(error);
      } finally {
        setLoading(false);
        setStatsLoading(false);
      }
    };
    fetchProfileAndStats();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      toast.error("Username cannot be empty.");
      return;
    }
    if (!emailInput.trim()) {
      toast.error("Email cannot be empty.");
      return;
    }

    setProfileSaving(true);
    try {
      await authService.updateProfile({ username: usernameInput, email: emailInput });
      
      setProfileData((prev) => ({
        ...prev,
        username: usernameInput,
        email: emailInput
      }));

      if (preferredNameInput.trim()) {
        localStorage.setItem("preferredStudyName", preferredNameInput.trim());
      } else {
        localStorage.removeItem("preferredStudyName");
      }

      toast.success("Profile details updated successfully!");
    } catch (error) {
      toast.error(error.message || error.error || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Current password is required.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      toast.error(error.message || error.error || "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setNotifSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      localStorage.setItem(
        "cleverprep_notification_prefs",
        JSON.stringify({ emailAlerts, weeklyReport })
      );
      toast.success("Notification preferences saved!");
    } catch (error) {
      toast.error("Failed to save preferences.");
    } finally {
      setNotifSaving(false);
    }
  };

  const confirmLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const displayName = profileData.username || user?.username || "Learner";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto pb-12 relative z-10 space-y-8">
      <PageHeader title="Account Hub" subtitle="Manage your learning identity and preferences" />

      {/* Top Banner section */}
      <div className="bg-white border border-slate-200/85 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6 transition-all duration-300 hover:shadow-md hover:border-slate-300/80">
        <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-br from-emerald-50 to-teal-50 border-4 border-white shadow-lg shadow-slate-200/50 flex items-center justify-center text-emerald-600 text-3xl sm:text-4xl font-black font-display">
          {initial}
        </div>
        <div className="text-center sm:text-left flex-1 pt-1 space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
            {displayName} <ShieldCheck className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
          </h2>
          <p className="text-slate-500 font-semibold text-sm">{profileData.email}</p>
          {profileData.createdAt && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">
              Member since {moment(profileData.createdAt).format("MMMM YYYY")}
            </p>
          )}
        </div>
      </div>

      {/* Main Grid: Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Stats + Navigation Options Menu */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Stats Widget */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
              Learning Identity
            </h3>
            {statsLoading ? (
              <div className="flex items-center justify-center h-28 bg-white rounded-3xl border border-slate-200">
                <Spinner />
              </div>
            ) : statsData ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center transition-all hover:border-blue-300">
                  <p className="text-2xl font-bold text-slate-900 mb-0.5">{statsData.totalDocuments || 0}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex flex-col items-center gap-1">
                    <span>📚</span> Doc Studied
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center transition-all hover:border-emerald-300">
                  <p className="text-2xl font-bold text-slate-900 mb-0.5">
                    {statsData.reviewedFlashcards || statsData.totalFlashcards || 0}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex flex-col items-center gap-1">
                    <span>🧠</span> Cards Rev
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-center transition-all hover:border-purple-300">
                  <p className="text-2xl font-bold text-slate-900 mb-0.5">
                    {statsData.completedQuizzes || statsData.totalQuizzes || 0}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex flex-col items-center gap-1">
                    <span>📝</span> Quiz Done
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-xs">
                <p className="text-slate-500 text-xs font-semibold">No statistics available yet.</p>
              </div>
            )}
          </div>

          {/* Navigation Links Menu */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
              Account Options
            </h3>
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col p-1.5 gap-1">
              
              <button
                onClick={() => setActiveSection("account")}
                className={`flex items-center gap-4 p-4.5 rounded-2xl transition-all duration-200 text-left w-full group ${
                  activeSection === "account"
                    ? "bg-emerald-50/60 text-emerald-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  activeSection === "account" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                }`}>
                  <User className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Account Settings</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">Manage preferred study name</p>
                </div>
              </button>

              <button
                onClick={() => setActiveSection("security")}
                className={`flex items-center gap-4 p-4.5 rounded-2xl transition-all duration-200 text-left w-full group ${
                  activeSection === "security"
                    ? "bg-emerald-50/60 text-emerald-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  activeSection === "security" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                }`}>
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Security & Password</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">Update credentials & password</p>
                </div>
              </button>

              <button
                onClick={() => setActiveSection("notifications")}
                className={`flex items-center gap-4 p-4.5 rounded-2xl transition-all duration-200 text-left w-full group ${
                  activeSection === "notifications"
                    ? "bg-emerald-50/60 text-emerald-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  activeSection === "notifications" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                }`}>
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Notifications</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">Configure alerts & reminders</p>
                </div>
              </button>

              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="flex items-center gap-4 p-4.5 rounded-2xl transition-all duration-200 text-left w-full group text-slate-600 hover:bg-red-50 hover:text-red-600"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-red-100 group-hover:text-red-600 flex items-center justify-center transition-colors">
                  <LogOut className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Logout</p>
                  <p className="text-[11px] font-medium text-slate-400 group-hover:text-red-600/70 mt-0.5">Sign out of your account</p>
                </div>
              </button>

            </div>
          </div>

        </div>

        {/* Right Side: Active Detail Panel */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between min-h-[420px] transition-all duration-300 hover:shadow-md hover:border-slate-300/80">
          
          {activeSection === "account" && (
            <form onSubmit={handleUpdateProfile} className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900">Account Settings</h4>
                <p className="text-xs text-slate-500 font-semibold">Update your personal study settings.</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
                    Username <span className="text-[9px] text-slate-400 font-medium normal-case font-sans bg-slate-100 px-1.5 py-0.5 rounded-sm">Locked</span>
                  </label>
                  <input
                    type="text"
                    value={usernameInput}
                    disabled
                    placeholder="Enter username"
                    className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-400 cursor-not-allowed outline-hidden transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
                    Email Address <span className="text-[9px] text-slate-400 font-medium normal-case font-sans bg-slate-100 px-1.5 py-0.5 rounded-sm">Locked</span>
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    disabled
                    placeholder="Enter email address"
                    className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-400 cursor-not-allowed outline-hidden transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Preferred Study Name
                  </label>
                  <input
                    type="text"
                    value={preferredNameInput}
                    onChange={(e) => setPreferredNameInput(e.target.value)}
                    placeholder="e.g. Piyush"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden transition-all"
                  />
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed pl-1 pt-0.5">
                    This preferred name is used by the AI podcast host when directly addressing you during dialog transcripts.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
                >
                  {profileSaving ? (
                    <>
                      <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeSection === "security" && (
            <form onSubmit={handleChangePassword} className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900">Security & Password</h4>
                <p className="text-xs text-slate-500 font-semibold">Change your password and ensure your account stays secure.</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden transition-all"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
                >
                  {passwordLoading ? (
                    <>
                      <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-white" />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeSection === "notifications" && (
            <form onSubmit={handleSaveNotifications} className="space-y-6 animate-in fade-in duration-300 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-slate-900">Notifications</h4>
                  <p className="text-xs text-slate-500 font-semibold">Choose how and when you receive summaries and updates from CleverPrep.</p>
                </div>

                <div className="space-y-5 pt-4 border-t border-slate-100">
                  <label className="flex items-start gap-3.5 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="w-5 h-5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-500 mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900">AI Material Generation Alerts</p>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5 leading-normal">
                        Receive email alerts as soon as your PDF podcasts, flashcards, or study plans are successfully generated.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3.5 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      checked={weeklyReport}
                      onChange={(e) => setWeeklyReport(e.target.checked)}
                      className="w-5 h-5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-500 mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900">Weekly Learning Summaries</p>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5 leading-normal">
                        Get a detailed diagnostic email report every Sunday reviewing your quiz results and document study activity.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={notifSaving}
                  className="px-6 h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
                >
                  {notifSaving ? (
                    <>
                      <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
          )}

        </div>

      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          onClick={() => setIsLogoutModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5 shadow-xs border border-red-100 animate-bounce">
                <AlertCircle className="w-8 h-8 text-red-500 animate-pulse" strokeWidth={2} />
              </div>
              <h3 id="logout-modal-title" className="text-xl font-bold text-slate-900 mb-3">
                Log out of CleverPrep?
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                Your study materials, flashcards, quizzes, and progress will remain safely stored in your account.
              </p>
              
              <div className="flex flex-col sm:flex-row w-full gap-3">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors focus:outline-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 rounded-xl text-sm font-semibold transition-colors focus:outline-none cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;