import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import authService from "../../../services/authService";
import toast from "react-hot-toast";
import { Check, AlertTriangle, Loader2 } from "lucide-react";
import AvatarUpload from "./AvatarUpload";

const RESERVED_USERNAMES = [
  "admin", "administrator", "root", "support", "system", "api", "login", "logout", "register", 
  "settings", "profile", "dashboard", "library", "documents", "flashcards", "quiz", "search", 
  "upload", "notifications", "help", "privacy", "terms", "cleverprep"
];

const AccountTab = () => {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [preferredStudyName, setPreferredStudyName] = useState(user?.preferredStudyName || "");
  const [saving, setSaving] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameError, setUsernameError] = useState("");

  const isGoogleUser = user?.provider === "google";

  // Validate username syntax on change
  useEffect(() => {
    if (username.trim() === user?.username) {
      setUsernameAvailable(null);
      setUsernameError("");
      return;
    }

    const u = username.trim().toLowerCase();
    if (!u) {
      setUsernameAvailable(null);
      setUsernameError("Username is required.");
      return;
    }

    if (u.length < 5) {
      setUsernameAvailable(null);
      setUsernameError("Username must be at least 5 characters.");
      return;
    }

    if (u.length > 30) {
      setUsernameAvailable(null);
      setUsernameError("Username cannot exceed 30 characters.");
      return;
    }

    if (!/^[A-Za-z0-9_]+$/.test(u)) {
      setUsernameAvailable(null);
      setUsernameError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    if (u.startsWith("_") || u.endsWith("_")) {
      setUsernameAvailable(null);
      setUsernameError("Username cannot start or end with an underscore.");
      return;
    }

    if (RESERVED_USERNAMES.includes(u)) {
      setUsernameAvailable(null);
      setUsernameError("This username is reserved.");
      return;
    }

    setUsernameError("");
    setCheckingUsername(true);

    const debounce = setTimeout(async () => {
      try {
        const res = await authService.checkUsername(username.trim());
        setUsernameAvailable(res.available);
      } catch (err) {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 450);

    return () => clearTimeout(debounce);
  }, [username, user?.username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    if (username.trim() !== user?.username && usernameAvailable === false) {
      toast.error("Username is already taken.");
      return;
    }

    setSaving(true);
    try {
      const res = await authService.updateProfile({
        username: username.trim(),
        preferredStudyName: preferredStudyName.trim(),
      });

      updateUser({
        username: res.data.username,
        preferredStudyName: res.data.preferredStudyName,
      });

      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.message || err.error || "Failed to update profile details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h4 className="text-lg font-bold text-slate-900">Personal Information</h4>
        <p className="text-xs text-slate-500 font-semibold">Update your credentials and study preferences.</p>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <AvatarUpload isGoogleUser={isGoogleUser} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 pt-4 border-t border-slate-100">
        {/* Username Field */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Username
          </label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              disabled={saving}
              className={`w-full h-11 pl-4 pr-10 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-hidden transition-all ${
                usernameError 
                  ? "border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500" 
                  : usernameAvailable === true
                  ? "border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  : "border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              }`}
            />
            {/* Status Icons */}
            <div className="absolute right-3.5 inset-y-0 flex items-center justify-center">
              {checkingUsername && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
              {!checkingUsername && usernameAvailable === true && <Check className="w-4.5 h-4.5 text-emerald-500" strokeWidth={2.5} />}
              {!checkingUsername && (usernameError || usernameAvailable === false) && <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />}
            </div>
          </div>
          {/* Helper Feedback Message */}
          {usernameError ? (
            <p className="text-[11px] font-medium text-rose-500 pl-1">{usernameError}</p>
          ) : usernameAvailable === true ? (
            <p className="text-[11px] font-medium text-emerald-600 pl-1">✓ Username available</p>
          ) : usernameAvailable === false ? (
            <p className="text-[11px] font-medium text-rose-500 pl-1">Username is already taken.</p>
          ) : (
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed pl-1">
              Username must be 5-30 characters, and contain only letters, numbers, and underscores.
            </p>
          )}
        </div>

        {/* Email Field (Disabled) */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
            Email Address <span className="text-[9px] text-slate-400 font-medium normal-case font-sans bg-slate-100 px-1.5 py-0.5 rounded-sm">Read-Only</span>
          </label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-400 cursor-not-allowed outline-hidden"
          />
        </div>

        {/* Preferred Name Field */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Preferred Study Name
          </label>
          <input
            type="text"
            value={preferredStudyName}
            onChange={(e) => setPreferredStudyName(e.target.value)}
            placeholder="e.g. Varunee"
            disabled={saving}
            className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden transition-all"
          />
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed pl-1 pt-0.5">
            Used by the AI podcast host to address you during study generation transcripts.
          </p>
        </div>

        {/* Account Provider */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Account Provider
          </label>
          <div className="flex items-center gap-2.5 px-4 h-11 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600">
            {isGoogleUser ? (
              <>
                <span className="text-base">🌐</span>
                <span>Google OAuth 2.0</span>
              </>
            ) : (
              <>
                <span className="text-base">📧</span>
                <span>Email Credentials</span>
              </>
            )}
          </div>
        </div>

        <div className="pt-5 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving || !!usernameError || (username.trim() !== user?.username && usernameAvailable === false)}
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
                Save Details
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountTab;
