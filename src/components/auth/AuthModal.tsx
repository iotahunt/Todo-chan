import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import todochanMascotImg from '../../assets/images/todochan_winking_clean.png';

export const AuthModal: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    resendVerification,
    refreshAuthStatus,
    firebaseUser,
  } = useAuth();
  const { isDarkMode, setIsDarkMode, themeColor } = useTheme();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'verify'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(false);

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-stone-300 dark:bg-slate-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-sky-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = calculatePasswordStrength(password);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const res = await signInWithGoogle();
    setLoading(false);
    if (!res.success && res.error) {
      setError(res.error);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      await sendPasswordReset(email.trim());
      setLoading(false);
      setSuccessMsg("If an account exists for this email, we've sent password reset instructions! ♡");
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setLoading(true);
      const res = await signUpWithEmail(email.trim(), password, displayName.trim());
      setLoading(false);
      if (res.success) {
        setMode('verify');
        setSuccessMsg('Account created! A verification link was sent to your email.');
      } else {
        setError(res.error || 'Failed to create account.');
      }
    } else {
      setLoading(true);
      const res = await signInWithEmail(email.trim(), password);
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Invalid email or password.');
      }
    }
  };

  const handleResend = async () => {
    if (resendCooldown) return;
    setError(null);
    setResendCooldown(true);
    const res = await resendVerification();
    if (res.success) {
      setSuccessMsg('Verification email sent! Please check your inbox and spam folder.');
    } else {
      setError(res.error || 'Failed to send verification email.');
    }
    setTimeout(() => setResendCooldown(false), 30000);
  };

  const handleCheckVerified = async () => {
    setLoading(true);
    await refreshAuthStatus();
    setLoading(false);
    if (firebaseUser?.emailVerified) {
      setSuccessMsg('Email verified! Welcome to Todo-chan! 💕');
    } else {
      setError("Email not verified yet. Please click the link in your email first, then click 'Check Status'.");
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#FAF7F2] text-stone-900'
      }`}
    >
      {/* Background ambient neon glows */}
      <div
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-40"
        style={{ backgroundColor: themeColor }}
      />
      <div
        className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-30"
        style={{ backgroundColor: themeColor }}
      />

      {/* Theme toggle in top right */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`absolute top-5 right-5 p-2 rounded-xl border transition ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            : 'bg-white border-[#E6DFD3] text-stone-700 hover:text-stone-900 shadow-xs'
        }`}
        title="Toggle Theme"
      >
        {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-pink-500" />}
      </button>

      <div
        className={`w-full max-w-md rounded-3xl border p-7 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 transition-colors ${
          isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-[#E6DFD3]'
        }`}
        style={{
          boxShadow: 'var(--neon-card-glow)',
          borderColor: 'rgba(var(--accent-rgb), 0.45)',
        }}
      >
        {/* Transparent Baby-Pink Neon Mascot Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <div className="w-24 h-24 flex items-center justify-center filter drop-shadow-[0_0_16px_rgba(var(--accent-rgb),0.85)]">
              <img
                src={todochanMascotImg}
                alt="Todo-chan mascot"
                className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,105,180,0.85)]"
              />
            </div>
          </div>
          <h1
            className={`text-2xl font-black tracking-tight flex items-center justify-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-stone-900'
            }`}
          >
            <span>Todo-chan</span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold"
              style={{
                backgroundColor: 'rgba(var(--accent-rgb), 0.15)',
                color: 'var(--accent-color)',
                border: '1px solid rgba(var(--accent-rgb), 0.4)',
                boxShadow: '0 0 10px rgba(var(--accent-rgb), 0.3)',
              }}
            >
              Planner
            </span>
          </h1>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
            {mode === 'verify'
              ? 'Please verify your email address to get started'
              : mode === 'forgot'
              ? 'Reset your Todo-chan account password'
              : mode === 'signup'
              ? 'Create your account & join Todo-chan!'
              : 'Sign in to access your planner & shared lists'}
          </p>
        </div>

        {/* Verification Screen */}
        {mode === 'verify' ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Mail className="w-6 h-6 animate-pulse" />
            </div>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-stone-600'}`}>
              We sent a verification link to <strong className="text-theme">{email}</strong>. Please check your inbox
              and click the link to verify your account.
            </p>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleCheckVerified}
                disabled={loading}
                className="w-full btn-theme-gradient py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Check Verification Status</span>
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown}
                className={`w-full py-2 px-4 rounded-xl text-xs font-semibold border transition ${
                  resendCooldown ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  isDarkMode
                    ? 'border-slate-800 text-slate-300 hover:text-white'
                    : 'border-[#E6DFD3] text-stone-700 hover:text-stone-900'
                }`}
              >
                {resendCooldown ? 'Cooldown active...' : 'Resend Verification Email'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-theme hover:underline pt-2 block mx-auto font-medium"
              >
                ← Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Google Real Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2.5 transition active:scale-98 shadow-sm ${
                isDarkMode
                  ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-white'
                  : 'bg-white hover:bg-stone-50 border-[#D6CEC0] text-stone-800'
              }`}
              style={{
                boxShadow: '0 0 12px rgba(var(--accent-rgb), 0.2)',
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className={`h-px flex-1 ${isDarkMode ? 'bg-slate-800' : 'bg-stone-200'}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-stone-400'}`}>
                Or with Email
              </span>
              <div className={`h-px flex-1 ${isDarkMode ? 'bg-slate-800' : 'bg-stone-200'}`} />
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {/* Display Name when signing up */}
              {mode === 'signup' && (
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                    Your Name (What Todo-chan calls you)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="e.g. Alex"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs app-input"
                    />
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs app-input"
                  />
                </div>
              </div>

              {/* Password Input (Hidden in forgot mode) */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setError(null);
                          setSuccessMsg(null);
                        }}
                        className="text-[11px] text-theme hover:underline font-medium"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-9 py-2 rounded-xl text-xs app-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength guide on register */}
                  {mode === 'signup' && password.length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-all duration-300 ${
                              i <= strength.score ? strength.color : 'bg-stone-200 dark:bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-stone-500 font-medium">Strength: {strength.label}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Confirm Password in Signup Mode */}
              {mode === 'signup' && (
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl text-xs app-input"
                    />
                  </div>
                </div>
              )}

              {/* Error & Success Alerts */}
              {error && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-theme-gradient py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition mt-2 shadow-md"
              >
                <span>
                  {loading
                    ? 'Please wait...'
                    : mode === 'forgot'
                    ? 'Send Reset Link'
                    : mode === 'signup'
                    ? 'Create Todo-chan Account'
                    : 'Sign In to Planner'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Toggle Modes */}
            <div className="pt-2 text-center text-xs">
              {mode === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-theme hover:underline font-semibold"
                >
                  ← Return to Sign In
                </button>
              ) : mode === 'signin' ? (
                <p className={isDarkMode ? 'text-slate-400' : 'text-stone-500'}>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-theme hover:underline font-bold"
                  >
                    Create Account
                  </button>
                </p>
              ) : (
                <p className={isDarkMode ? 'text-slate-400' : 'text-stone-500'}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-theme hover:underline font-bold"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
