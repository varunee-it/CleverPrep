import React, { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import authService from "../../services/authService";
import progressService from "../../services/progressService";
import { useAuth } from "../../context/AuthContext";
import moment from "moment";
import { User, Lock, Bell, BarChart3, Settings, ShieldCheck } from "lucide-react";

import ProfileSkeleton from "./components/ProfileSkeleton";
import AccountTab from "./components/AccountTab";
import SecurityTab from "./components/SecurityTab";
import PreferencesTab from "./components/PreferencesTab";
import StatisticsTab from "./components/StatisticsTab";
import SettingsTab from "./components/SettingsTab";
import { useTour } from "../../context/TourContext";

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Active section tab: 'account' | 'security' | 'notifications' | 'statistics' | 'settings'
  const [activeSection, setActiveSection] = useState("account");
  const { activeStep } = useTour();

  useEffect(() => {
    if (activeStep && activeStep.route === "/profile" && activeStep.profileSection) {
      setActiveSection(activeStep.profileSection);
    }
  }, [activeStep]);

  const isGoogleUser = user?.provider === "google";

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await progressService.getDashboardData();
        if (statsRes && statsRes.data) {
          setStatsData(statsRes.data);
        }
      } catch (err) {
        console.error("Failed to load statistics:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    // Load statistics in background
    fetchStats();
    
    // Simulate minor visual delay for premium loading experience
    const timer = setTimeout(() => {
      setLoading(false);
    }, 450);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <ProfileSkeleton />;
  }

  const getInitials = () => {
    if (!user?.username) return "CP";
    const parts = user.username.split(/[._\s]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  const avatarSrc = user?.profileImage || user?.avatar;

  return (
    <div className="max-w-5xl mx-auto pb-12 relative z-10 space-y-8 animate-in fade-in duration-300">
      <PageHeader title="Account Hub" subtitle="Manage your learning identity, security, and preferences" />

      {/* Top Banner section */}
      <div className="bg-white border border-slate-200/85 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6 transition-all duration-300 hover:shadow-md hover:border-slate-300/80">
        <div className={`shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center font-bold text-3xl overflow-hidden select-none ${
          !avatarSrc ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-500/10" : ""
        }`}>
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentNode.classList.add('bg-gradient-to-br', 'from-emerald-400', 'to-teal-500', 'text-white');
                e.target.parentNode.innerHTML = `<span>${getInitials()}</span>`;
              }}
            />
          ) : (
            <span>{getInitials()}</span>
          )}
        </div>

        <div className="text-center sm:text-left flex-1 pt-1 space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {user?.username || "Learner"}{" "}
            {user?.isEmailVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100/50">
                Verified Student <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
              </span>
            )}
            {isGoogleUser && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                Google Account
              </span>
            )}
          </h2>
          <p className="text-slate-500 font-semibold text-sm">{user?.email}</p>
          {user?.createdAt && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">
              Member since {moment(user.createdAt).format("MMMM YYYY")}
            </p>
          )}
        </div>
      </div>

      {/* Main Grid: Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Navigation Options Menu */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
            Account Options
          </h3>
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col p-1.5 gap-1">
            {/* Account Settings */}
            <button
              onClick={() => setActiveSection("account")}
              className={`flex items-center gap-4 p-4.5 rounded-2xl transition-all duration-200 text-left w-full group cursor-pointer ${
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
                <p className="text-sm font-semibold">Personal Information</p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">Manage username and avatar picture</p>
              </div>
            </button>

            {/* Security Settings */}
            <button
              onClick={() => setActiveSection("security")}
              className={`flex items-center gap-4 p-4.5 rounded-2xl transition-all duration-200 text-left w-full group cursor-pointer ${
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
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">Update credentials and secure keys</p>
              </div>
            </button>

            {/* Preferences Settings */}
            <button
              onClick={() => setActiveSection("notifications")}
              className={`flex items-center gap-4 p-4.5 rounded-2xl transition-all duration-200 text-left w-full group cursor-pointer ${
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
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">Configure weekly digest alerts</p>
              </div>
            </button>

            {/* Statistics */}
            <button
              onClick={() => setActiveSection("statistics")}
              className={`flex items-center gap-4 p-4.5 rounded-2xl transition-all duration-200 text-left w-full group cursor-pointer ${
                activeSection === "statistics"
                  ? "bg-emerald-50/60 text-emerald-700 font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                activeSection === "statistics" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600"
              }`}>
                <BarChart3 className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Learning Analytics</p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">Verify study cards and quiz results</p>
              </div>
            </button>

            {/* Account Control Settings */}
            <button
              onClick={() => setActiveSection("settings")}
              className={`flex items-center gap-4 p-4.5 rounded-2xl transition-all duration-200 text-left w-full group cursor-pointer ${
                activeSection === "settings"
                  ? "bg-emerald-50/60 text-emerald-700 font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                activeSection === "settings" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600"
              }`}>
                <Settings className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Settings & Control</p>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">Export data or delete profile details</p>
              </div>
            </button>
          </div>
        </div>

        {/* Right Side: Active Detail Panel */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between min-h-[420px] transition-all duration-300 hover:shadow-md hover:border-slate-300/80">
          {activeSection === "account" && <AccountTab />}
          {activeSection === "security" && <SecurityTab />}
          {activeSection === "notifications" && <PreferencesTab />}
          {activeSection === "statistics" && <StatisticsTab statsData={statsData} loading={statsLoading} />}
          {activeSection === "settings" && <SettingsTab />}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;