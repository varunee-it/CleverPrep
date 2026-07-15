import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import authService from "../../services/authService";

import {
  BrainCircuit,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";

import toast from "react-hot-toast";

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const LoginPage = () => {
  // ==========================================
  // States
  // ==========================================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [googleAuthData, setGoogleAuthData] = useState(null);

  // ==========================================
  // Hooks
  // ==========================================
  const navigate = useNavigate();
  const { login } = useAuth();

  // ==========================================
  // Handle Submit
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowResend(false);
    setLoading(true);

    try {
      const { token, user } = await authService.login(email, password);
      login(user, token);
      toast.success("Logged in successfully!");
      navigate("/dashboard");
    } catch (err) {
      const errorMsg = err.error || err.message || "Failed to login";
      setError(errorMsg);
      toast.error(errorMsg);
      if (err.notVerified) {
        navigate("/verify-email", { state: { email } });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const response = await authService.resendVerification(email);
      toast.success(response.message || "Verification email sent successfully!");
      setShowResend(false);
    } catch (err) {
      toast.error(err.error || err.message || "Failed to resend verification email");
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (loading || googleLoading) return;
    setGoogleLoading(true);
    setError("");

    try {
      if (!window.google) {
        toast.error("Google login services are still loading. Please wait a moment.");
        setGoogleLoading(false);
        return;
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error("[Google OAuth Error] VITE_GOOGLE_CLIENT_ID is missing from frontend environment configuration (.env).");
        toast.error("Google Sign-In configuration is missing. Please contact system administrator.");
        setGoogleLoading(false);
        return;
      }

      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: "openid email profile",
        ux_mode: "popup",
        callback: async (response) => {
          if (response.error) {
            toast.error(`Google Sign-in failed: ${response.error}`);
            setGoogleLoading(false);
            return;
          }

          try {
            const data = await authService.googleSignIn(response.code);
            setGoogleAuthData({ email: data.user.email, step: "Signing you in..." });

            await new Promise(r => setTimeout(r, 650));
            setGoogleAuthData({ email: data.user.email, step: "Loading profile..." });

            await new Promise(r => setTimeout(r, 650));
            setGoogleAuthData({ email: data.user.email, step: "Connecting account..." });

            await new Promise(r => setTimeout(r, 650));
            setGoogleAuthData({ email: data.user.email, step: "Preparing your workspace..." });

            await new Promise(r => setTimeout(r, 650));
            setGoogleAuthData({ email: data.user.email, step: "Redirecting..." });

            await new Promise(r => setTimeout(r, 450));
            login(data.user, data.token);
            navigate("/dashboard");
          } catch (err) {
            toast.error(err.error || err.message || "Failed to log in with Google.");
            setGoogleLoading(false);
          }
        },
        error_callback: (err) => {
          toast.error(err.message || "Google authentication was cancelled.");
          setGoogleLoading(false);
        }
      });
      client.requestCode();
    } catch (err) {
      console.error("Google Auth initialization failed:", err);
      toast.error("Failed to start Google login.");
      setGoogleLoading(false);
    }
  };

  if (googleAuthData) {
    return (
      <div className="fixed inset-0 z-55 bg-white flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div className="w-full max-w-sm px-6 text-center space-y-6 animate-in slide-in-from-bottom-2 duration-400">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-linear-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-500/20 mb-4 animate-bounce">
            <BrainCircuit className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display">CleverPrep</h2>
            <p className="text-sm font-bold text-emerald-600 animate-pulse">{googleAuthData.step}</p>
          </div>

          {googleAuthData.email && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {googleAuthData.email}
            </div>
          )}

          <div className="pt-4 flex justify-center">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-linear-to-br from-emerald-50/20 via-slate-50 to-teal-50/10 overflow-hidden py-12">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none"></div>

      {/* Card */}
      <div className="relative w-full max-w-md px-6">
        <div className="bg-white/85 backdrop-blur-xl border border-slate-200/70 rounded-[32px] shadow-2xl p-8 sm:p-10 transition-all duration-300">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-15 h-15 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/10 mb-4 animate-pulse">
              <BrainCircuit className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">Welcome Back</h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">Sign in to continue your journey</p>
          </div>

          {/* Google Sign In Option */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full h-12 border-2 border-slate-200/80 hover:border-slate-300/80 bg-white hover:bg-slate-50/50 text-slate-700 font-bold text-sm rounded-xl transition-all duration-200 shadow-xs hover:shadow-md flex items-center justify-center active:scale-[0.99] cursor-pointer disabled:opacity-50 mb-4"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin mr-3" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          {/* OR Divider */}
          <div className="relative flex py-2 items-center select-none mb-4">
            <div className="flex-grow border-t border-slate-200/80"></div>
            <span className="flex-shrink mx-4 text-xs font-black text-slate-400 uppercase tracking-widest">
              OR
            </span>
            <div className="flex-grow border-t border-slate-200/80"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Email Address</label>
              <div
                className={`relative rounded-xl border-2 transition-all duration-200 bg-slate-50/30 flex items-center ${
                  focusedField === "email"
                    ? "border-emerald-500 bg-white"
                    : "border-slate-200/70 hover:border-slate-300/70"
                }`}
              >
                <div className={`pl-4 ${focusedField === "email" ? "text-emerald-500" : "text-slate-400"}`}>
                  <Mail className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="name@domain.com"
                  className="w-full h-12 pl-3 pr-4 bg-transparent outline-none text-sm font-semibold text-slate-850 placeholder-slate-400"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between mb-1 pl-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <Link to="/forgot-password" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div
                className={`relative rounded-xl border-2 transition-all duration-200 bg-slate-50/30 flex items-center ${
                  focusedField === "password"
                    ? "border-emerald-500 bg-white"
                    : "border-slate-200/70 hover:border-slate-300/70"
                }`}
              >
                <div className={`pl-4 ${focusedField === "password" ? "text-emerald-500" : "text-slate-400"}`}>
                  <Lock className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-3 pr-4 bg-transparent outline-none text-sm font-semibold text-slate-850 placeholder-slate-400"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 font-bold leading-normal">{error}</p>
              </div>
            )}

            {/* Resend Verification Option */}
            {showResend && (
              <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3.5 text-center space-y-1 animate-in fade-in duration-200">
                <p className="text-xs text-emerald-800 font-semibold">Verification link expired or not received?</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer disabled:opacity-50"
                >
                  {resendLoading ? "Resending Email..." : "Resend Verification Email"}
                </button>
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full h-12 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden cursor-pointer"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200/80">
            <p className="text-center text-sm text-slate-500 font-semibold">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors ml-1"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;