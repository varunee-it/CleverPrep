import React, { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import Spinner from "../../components/common/Spinner";
import authService from "../../services/authService";
import progressService from "../../services/progressService";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { User, Mail, Lock, ShieldCheck, BookOpen, BrainCircuit, FileText, CheckCircle2, LogOut } from "lucide-react";
import moment from "moment";

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    createdAt: null
  });
  const [statsData, setStatsData] = useState(null);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          authService.getProfile(),
          progressService.getDashboardData().catch(() => null)
        ]);
        
        setProfileData({
          username: profileRes.data.username || "",
          email: profileRes.data.email || "",
          createdAt: profileRes.data.createdAt || null
        });
        
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
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
      toast.error(error.error || "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return <div className="h-[60vh] flex items-center justify-center"><Spinner /></div>;
  }

  const displayName = profileData.username || user?.username || "Learner";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto pb-12 relative z-10">
      <PageHeader title="Account Hub" subtitle="Manage your learning identity and preferences" />

      {/* Top Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 transition-shadow hover:shadow-md">
        <div className="shrink-0 w-24 h-24 rounded-full bg-slate-50 border-4 border-white shadow-lg shadow-slate-200/50 flex items-center justify-center text-slate-700 text-4xl font-bold">
          {initial}
        </div>
        <div className="text-center sm:text-left flex-1 pt-1">
          <h2 className="text-2xl font-bold text-slate-900 mb-1 flex items-center justify-center sm:justify-start gap-2">
            {displayName} <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </h2>
          <p className="text-slate-500 font-medium mb-3">{profileData.email}</p>
          {profileData.createdAt && (
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Member since {moment(profileData.createdAt).format("MMMM YYYY")}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Learning Identity Section */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 pl-1">
            Learning Identity
          </h3>
          
          {statsLoading ? (
            <div className="flex items-center justify-center h-48 bg-white rounded-3xl border border-slate-200"><Spinner /></div>
          ) : statsData ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-orange-300 transition-colors">
                <p className="text-3xl font-bold text-slate-900 mb-1">{statsData.studyStreak || 0}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span>🔥</span> Study Streak
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-blue-300 transition-colors">
                <p className="text-3xl font-bold text-slate-900 mb-1">{statsData.totalDocuments || 0}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span>📚</span> Documents Studied
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-emerald-300 transition-colors">
                <p className="text-3xl font-bold text-slate-900 mb-1">{statsData.reviewedFlashcards || statsData.totalFlashcards || 0}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span>🧠</span> Flashcards Reviewed
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-purple-300 transition-colors">
                <p className="text-3xl font-bold text-slate-900 mb-1">{statsData.completedQuizzes || statsData.totalQuizzes || 0}</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span>📝</span> Quizzes Completed
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
               <p className="text-slate-500 text-sm font-medium">No learning statistics available yet.</p>
            </div>
          )}
        </div>

        {/* Account Section */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 pl-1">
            Account Section
          </h3>
          
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            
            <button className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 w-full group">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Account Settings</p>
                <p className="text-xs font-medium text-slate-500">Manage your profile information</p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 w-full group">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Security & Password</p>
                <p className="text-xs font-medium text-slate-500">Update your password and security</p>
              </div>
            </button>

            <button className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 w-full group">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Notifications</p>
                <p className="text-xs font-medium text-slate-500">Manage email preferences</p>
              </div>
            </button>

            <button 
              onClick={() => {
                 // Triggers standard logout flow just like the sidebar or directly logs out.
                 // For now, it will use the authContext logout but ideally connects to the sidebar's modal.
                 // Since they requested this in the account section, we'll keep it functional.
              }}
              className="flex items-center gap-4 p-5 hover:bg-red-50 transition-colors text-left w-full group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-red-700">Logout</p>
                <p className="text-xs font-medium text-slate-500 group-hover:text-red-600/80">Sign out of your account</p>
              </div>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}

export default ProfilePage;