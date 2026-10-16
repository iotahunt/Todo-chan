import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, ArrowRight, Sparkles, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { TodoChanBobCutEmote } from '../mascot/TodoChanBobCutEmote.tsx';

export const AuthModal: React.FC = () => {
  const { login, register } = useAuth();
  const { isDarkMode, setIsDarkMode, themeColor } = useTheme();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }

    if (isRegisterMode) {
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters.');
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
        setError('Username may only contain letters, numbers, and underscores.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setLoading(true);
      const res = await register(username.trim(), password);
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Failed to create account.');
      }
    } else {
      setLoading(true);
      const res = await login(username.trim(), password);
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Invalid username or password.');
      }
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#FAF7F2] text-stone-900'
      }`}
    >
      {/* Background neon glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

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
        className={`w-full max-w-md rounded-3xl border p-8 shadow-2xl backdrop-blur-xl relative z-10 transition-colors ${
          isDarkMode
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-[#E6DFD3]'
        }`}
        style={{
          boxShadow: '0 0 30px rgba(255, 105, 180, 0.18)',
        }}
      >
        {/* Transparent Neon Mascot & Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <div className="w-24 h-24 flex items-center justify-center filter drop-shadow-[0_0_14px_rgba(255,105,180,0.8)]">
              <TodoChanBobCutEmote size={95} />
            </div>
          </div>
          <h1
            className={`text-2xl font-black tracking-tight flex items-center justify-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-stone-900'
            }`}
          >
            <span>Todo-chan</span>
            <Sparkles className="w-5 h-5 text-pink-500" />
          </h1>
          <p
            className={`text-xs mt-1 ${
              isDarkMode ? 'text-slate-400' : 'text-stone-500'
            }`}
          >
            {isRegisterMode ? 'Create your personal day planner account' : 'Welcome back! Sign in to continue'}
          </p>
          <div
            className="inline-block mt-2 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: 'rgba(255, 105, 180, 0.12)',
              color: '#ff69b4',
              border: '1px solid rgba(255, 105, 180, 0.35)',
            }}
          >
            Username & Password Only · No Email Needed
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username input */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isDarkMode ? 'text-slate-300' : 'text-stone-600'
              }`}
            >
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose unique username"
                maxLength={30}
                required
                className={`w-full rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-semibold border focus:outline-hidden transition ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-[#FAF7F2] border-[#D6CEC0] text-stone-900 placeholder-stone-400'
                }`}
              />
            </div>
            {isRegisterMode && (
              <span
                className={`text-[10px] mt-1 block ${
                  isDarkMode ? 'text-slate-500' : 'text-stone-400'
                }`}
              >
                3-30 characters, letters, numbers, and underscores only.
              </span>
            )}
          </div>

          {/* Password input */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isDarkMode ? 'text-slate-300' : 'text-stone-600'
              }`}
            >
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your secret password"
                required
                className={`w-full rounded-xl pl-9 pr-10 py-2.5 text-sm font-mono border focus:outline-hidden transition ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-[#FAF7F2] border-[#D6CEC0] text-stone-900 placeholder-stone-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-pink-500"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength bar */}
            {isRegisterMode && password.length > 0 && (
              <div className="mt-2">
                <div
                  className={`flex items-center justify-between text-[10px] mb-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-stone-500'
                  }`}
                >
                  <span>Strength</span>
                  <span className="font-semibold">{strength.label}</span>
                </div>
                <div
                  className={`h-1 w-full rounded-full overflow-hidden flex gap-1 ${
                    isDarkMode ? 'bg-slate-800' : 'bg-stone-200'
                  }`}
                >
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 transition-all ${
                        step <= strength.score ? strength.color : isDarkMode ? 'bg-slate-800' : 'bg-stone-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password (Register mode only) */}
          {isRegisterMode && (
            <div>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-stone-600'
                }`}
              >
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className={`w-full rounded-xl pl-9 pr-10 py-2.5 text-sm font-mono border focus:outline-hidden transition ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-[#FAF7F2] border-[#D6CEC0] text-stone-900 placeholder-stone-400'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-theme-gradient w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>{isRegisterMode ? 'Creating Account...' : 'Signing In...'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>{isRegisterMode ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Instant Demo Option */}
        <div className="mt-4 pt-3 border-t border-inherit">
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setError(null);
              const demoName = 'planner_' + Math.floor(1000 + Math.random() * 9000);
              const demoPass = 'demo_pass123';
              const regRes = await register(demoName, demoPass);
              if (!regRes.success) {
                const logRes = await login(demoName, demoPass);
                if (!logRes.success) {
                  setError(regRes.error || 'Could not start instant session.');
                }
              }
              setLoading(false);
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
              isDarkMode
                ? 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border-slate-700'
                : 'text-stone-700 hover:text-stone-900 bg-[#FAF7F2] hover:bg-[#EAE3D6] border-[#D6CEC0]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            <span>Instant Demo (1-Click Start)</span>
          </button>
        </div>

        {/* Toggle mode link */}
        <div
          className={`mt-5 text-center text-xs pt-4 border-t ${
            isDarkMode ? 'border-slate-800 text-slate-400' : 'border-[#E6DFD3] text-stone-500'
          }`}
        >
          {isRegisterMode ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setError(null);
                }}
                className="font-bold text-pink-500 hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setError(null);
                }}
                className="font-bold text-pink-500 hover:underline"
              >
                Create one now
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
