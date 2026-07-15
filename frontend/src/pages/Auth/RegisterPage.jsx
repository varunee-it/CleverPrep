import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import authService from "../../services/authService";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  BrainCircuit,
  Mail,
  Lock,
  ArrowRight,
  User,
  Eye,
  EyeOff,
  AlertCircle
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

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field focus trackers
  const [focusedField, setFocusedField] = useState(null);

  // Operation loads & checkers
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [googleAuthData, setGoogleAuthData] = useState(null);

  // React Hook Form initialization
  const {
    register: formRegister,
    handleSubmit: formHandleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm({
    mode: "onChange"
  });

  const usernameVal = watch("username", "") || "";
  const emailVal = watch("email", "") || "";
  const passwordVal = watch("password", "") || "";
  const confirmPasswordVal = watch("confirmPassword", "") || "";

  // Password requirement flags
  const hasMinLength = passwordVal.length >= 8;
  const hasUpperCase = /[A-Z]/.test(passwordVal);
  const hasLowerCase = /[a-z]/.test(passwordVal);
  const hasDigit = /[0-9]/.test(passwordVal);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordVal);
  const passwordsMatch = passwordVal && passwordVal === confirmPasswordVal;
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasDigit && hasSpecial;

  // Live username availability check
  useEffect(() => {
    const u = usernameVal.trim();
    if (!u || u.length < 5 || u.length > 20 || !/^[A-Za-z0-9_]+$/.test(u) || u.startsWith('_') || u.endsWith('_')) {
      setUsernameAvailable(null);
      return;
    }
    setUsernameChecking(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await authService.checkUsername(u);
        setUsernameAvailable(res.available);
      } catch (e) {
        setUsernameAvailable(null);
      } finally {
        setUsernameChecking(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [usernameVal]);

  const checkEmailValid = (em) => {
    const trimmed = em.trim().toLowerCase();
    if (!trimmed) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) return false;

    const domainPart = trimmed.split('@')[1];
    if (!domainPart || domainPart.startsWith('.') || domainPart.endsWith('.') || !domainPart.includes('.')) {
      return false;
    }

    const blockedDomains = [
      "example.com", "test.com", "fake.com", "invalid.com", 
      "mailinator.com", "tempmail.com", "guerrillamail.com"
    ];
    if (blockedDomains.some(domain => domainPart === domain)) {
      return false;
    }
    return true;
  };

  const getPasswordStrength = () => {
    let score = 0;
    if (hasMinLength) score++;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;
    if (hasDigit) score++;
    if (hasSpecial) score++;
    return score;
  };

  const getPasswordStrengthLabel = () => {
    const score = getPasswordStrength();
    if (score <= 1) return { label: "Weak", color: "bg-rose-500", text: "text-rose-500" };
    if (score <= 3) return { label: "Fair", color: "bg-amber-500", text: "text-amber-500" };
    if (score === 4) return { label: "Good", color: "bg-emerald-400", text: "text-emerald-400" };
    return { label: "Strong", color: "bg-emerald-600", text: "text-emerald-600" };
  };

  const getPasswordFeedback = () => {
    if (!passwordVal) return "";
    if (!hasMinLength) return "Password must contain at least 8 characters.";
    if (!hasUpperCase) return "Include one uppercase letter.";
    if (!hasLowerCase) return "Include one lowercase letter.";
    if (!hasDigit) return "Include one number.";
    if (!hasSpecial) return "Include one special character.";
    return "Strong password";
  };

  const onSubmit = async (data) => {
    setError("");
    setLoading(true);

    const trimmedUsername = data.username.trim();
    const trimmedEmail = data.email.trim().toLowerCase();

    try {
      await authService.register(trimmedUsername, trimmedEmail, data.password);
      toast.success("Verification code sent to your email!");
      navigate("/verify-email", { state: { email: trimmedEmail } });
    } catch (err) {
      const errorMsg = err.error || err.message || "Failed to create account. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
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
            toast.error(`Google Sign-up failed: ${response.error}`);
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
            toast.error(err.error || err.message || "Failed to sign up with Google.");
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

      <div className="relative w-full max-w-lg px-6">
        <div className="bg-white/85 backdrop-blur-xl border border-slate-200/70 rounded-[32px] shadow-2xl p-8 sm:p-10 transition-all duration-300">
          
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-15 h-15 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/10 mb-4 animate-pulse">
              <BrainCircuit className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Create your account
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Start your premium AI study companion with CleverPrep.
            </p>
          </div>

          {/* Social Sign Up option */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading || googleLoading}
            className="w-full h-12 border-2 border-slate-200/80 hover:border-slate-300/80 bg-white hover:bg-slate-50/50 text-slate-700 font-bold text-sm rounded-xl transition-all duration-200 shadow-xs hover:shadow-md flex items-center justify-center active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin mr-3" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          {/* OR Divider */}
          <div className="relative flex py-5 items-center select-none">
            <div className="flex-grow border-t border-slate-200/80"></div>
            <span className="flex-shrink mx-4 text-xs font-black text-slate-400 uppercase tracking-widest">
              OR
            </span>
            <div className="flex-grow border-t border-slate-200/80"></div>
          </div>

          {/* Registration Form */}
          <form onSubmit={formHandleSubmit(onSubmit)} className="space-y-5">
            
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Username
              </label>
              <div
                className={`relative rounded-xl border-2 transition-all duration-200 bg-slate-50/30 flex items-center ${
                  errors.username
                    ? "border-rose-300/80 focus-within:border-rose-400"
                    : focusedField === "username"
                    ? "border-emerald-500 bg-white"
                    : "border-slate-200/70 hover:border-slate-300/70"
                }`}
              >
                <div className={`pl-4 ${focusedField === "username" ? "text-emerald-500" : "text-slate-400"}`}>
                  <User className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type="text"
                  id="username-input"
                  placeholder="yourusername"
                  onFocus={() => setFocusedField("username")}
                  className="w-full h-12 pl-3 pr-4 bg-transparent outline-none text-sm font-semibold text-slate-850 placeholder-slate-400"
                  {...formRegister("username", {
                    required: "Username is required",
                    minLength: { value: 5, message: "Username must be at least 5 characters" },
                    maxLength: { value: 20, message: "Username cannot exceed 20 characters" },
                    pattern: { value: /^[A-Za-z0-9_]+$/, message: "Letters, numbers, underscores only. No spaces." },
                    validate: {
                      noUnderscoreStartEnd: (v) => (!v.startsWith("_") && !v.endsWith("_")) || "Cannot start or end with underscore."
                    }
                  })}
                  onBlur={(e) => {
                    setFocusedField(null);
                    formRegister("username").onBlur(e);
                  }}
                />
              </div>
              
              {usernameVal.trim() && (
                <div className="mt-1.5 animate-in fade-in duration-200 pl-1">
                  {usernameChecking ? (
                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-slate-350 border-t-slate-700 rounded-full animate-spin inline-block" />
                      Checking username...
                    </p>
                  ) : errors.username ? (
                    <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                      ✗ {errors.username.message}
                    </p>
                  ) : usernameAvailable === true ? (
                    <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      ✓ Username available
                    </p>
                  ) : usernameAvailable === false ? (
                    <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                      ✗ Username already taken
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Email Address
              </label>
              <div
                className={`relative rounded-xl border-2 transition-all duration-200 bg-slate-50/30 flex items-center ${
                  errors.email
                    ? "border-rose-300/80 focus-within:border-rose-400"
                    : focusedField === "email"
                    ? "border-emerald-500 bg-white"
                    : "border-slate-200/70 hover:border-slate-300/70"
                }`}
              >
                <div className={`pl-4 ${focusedField === "email" ? "text-emerald-500" : "text-slate-400"}`}>
                  <Mail className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type="email"
                  id="email-input"
                  placeholder="name@domain.com"
                  onFocus={() => setFocusedField("email")}
                  className="w-full h-12 pl-3 pr-4 bg-transparent outline-none text-sm font-semibold text-slate-850 placeholder-slate-400"
                  {...formRegister("email", {
                    required: "Email address is required",
                    validate: (val) => checkEmailValid(val) || "Please enter a valid email address."
                  })}
                  onBlur={(e) => {
                    setFocusedField(null);
                    formRegister("email").onBlur(e);
                  }}
                />
              </div>
              {emailVal.trim() && (
                <div className="mt-1.5 animate-in fade-in duration-200 pl-1">
                  {checkEmailValid(emailVal) === true ? (
                    <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      ✓ Valid email
                    </p>
                  ) : (
                    <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                      ✗ {errors.email?.message || "Invalid email address"}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Password
              </label>
              <div
                className={`relative rounded-xl border-2 transition-all duration-200 bg-slate-50/30 flex items-center ${
                  errors.password
                    ? "border-rose-300/80 focus-within:border-rose-400"
                    : focusedField === "password"
                    ? "border-emerald-500 bg-white"
                    : "border-slate-200/70 hover:border-slate-300/70"
                }`}
              >
                <div className={`pl-4 ${focusedField === "password" ? "text-emerald-500" : "text-slate-400"}`}>
                  <Lock className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password-input"
                  placeholder="••••••••"
                  onFocus={() => setFocusedField("password")}
                  className="w-full h-12 pl-3 pr-10 bg-transparent outline-none text-sm font-semibold text-slate-850 placeholder-slate-400"
                  {...formRegister("password", {
                    required: "Password is required",
                    validate: () => isPasswordValid || "Please enter a stronger password."
                  })}
                  onBlur={(e) => {
                    setFocusedField(null);
                    formRegister("password").onBlur(e);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {passwordVal && (
                <div className="mt-3 space-y-2 pl-1 select-none animate-in fade-in duration-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password requirements</p>
                  <div className="space-y-1 text-xs font-semibold">
                    <div className={`flex items-center gap-1.5 transition-colors duration-250 ${hasMinLength ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                      <span className="text-base leading-none">{hasMinLength ? "✓" : "○"}</span>
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1.5 transition-colors duration-250 ${hasUpperCase ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                      <span className="text-base leading-none">{hasUpperCase ? "✓" : "○"}</span>
                      <span>One uppercase letter</span>
                    </div>
                    <div className={`flex items-center gap-1.5 transition-colors duration-250 ${hasLowerCase ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                      <span className="text-base leading-none">{hasLowerCase ? "✓" : "○"}</span>
                      <span>One lowercase letter</span>
                    </div>
                    <div className={`flex items-center gap-1.5 transition-colors duration-250 ${hasDigit ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                      <span className="text-base leading-none">{hasDigit ? "✓" : "○"}</span>
                      <span>One number</span>
                    </div>
                    <div className={`flex items-center gap-1.5 transition-colors duration-250 ${hasSpecial ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                      <span className="text-base leading-none">{hasSpecial ? "✓" : "○"}</span>
                      <span>One special character</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Confirm Password
              </label>
              <div
                className={`relative rounded-xl border-2 transition-all duration-200 bg-slate-50/30 flex items-center ${
                  errors.confirmPassword
                    ? "border-rose-300/80 focus-within:border-rose-400"
                    : focusedField === "confirm"
                    ? "border-emerald-500 bg-white"
                    : "border-slate-200/70 hover:border-slate-300/70"
                }`}
              >
                <div className={`pl-4 ${focusedField === "confirm" ? "text-emerald-500" : "text-slate-400"}`}>
                  <Lock className="h-5 w-5" strokeWidth={2} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm-password-input"
                  placeholder="••••••••"
                  onFocus={() => setFocusedField("confirm")}
                  className="w-full h-12 pl-3 pr-10 bg-transparent outline-none text-sm font-semibold text-slate-850 placeholder-slate-400"
                  {...formRegister("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (val) => val === passwordVal || "Passwords do not match."
                  })}
                  onBlur={(e) => {
                    setFocusedField(null);
                    formRegister("confirmPassword").onBlur(e);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPasswordVal && (
                <div className="mt-1.5 animate-in fade-in duration-200 pl-1">
                  {passwordsMatch ? (
                    <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      ✓ Passwords match
                    </p>
                  ) : (
                    <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                      ✗ Passwords do not match
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Submission Error messages */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 font-bold leading-normal">{error}</p>
              </div>
            )}

            {/* Create Account Action */}
            <button
              type="submit"
              disabled={loading || googleLoading || !isValid || usernameAvailable !== true}
              className="group relative w-full h-12 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden cursor-pointer"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Redirection Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200/80">
            <p className="text-center text-sm text-slate-500 font-semibold">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors ml-1"
              >
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;