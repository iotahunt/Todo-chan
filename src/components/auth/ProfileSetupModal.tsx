import React, { useState } from 'react';
import { User, Sparkles, ArrowRight, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import todochanMascotImg from '../../assets/images/todochan_winking_clean.png';

interface ProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfileName } = useAuth();
  const { isDarkMode, themeColor } = useTheme();
  const [nameInput, setNameInput] = useState(user?.username && user.username !== 'Planner' ? user.username : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      setError('Please enter a name with at least 2 characters.');
      return;
    }

    setLoading(true);
    const res = await updateProfileName(nameInput.trim());
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to save name.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className={`w-full max-w-sm rounded-3xl border p-6 text-center shadow-2xl relative overflow-hidden transition-colors ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#E6DFD3] text-stone-900'
        }`}
        style={{
          boxShadow: 'var(--neon-card-glow)',
          borderColor: 'var(--accent-color)',
        }}
      >
        {/* Mascot Avatar with Neon Aura */}
        <div className="flex justify-center mb-3">
          <div className="w-24 h-24 relative flex items-center justify-center filter drop-shadow-[0_0_14px_rgba(255,105,180,0.85)]">
            <img
              src={todochanMascotImg}
              alt="Todo-chan mascot"
              className="w-full h-full object-contain filter drop-shadow-[0_0_8px_#ff69b4]"
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-theme mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Welcome to Todo-chan!</span>
          <Heart className="w-3.5 h-3.5 fill-current" />
        </div>

        <h2 className="text-xl font-black tracking-tight">Set Up Your Profile</h2>
        <p className={`text-xs mt-1 mb-5 ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
          Todo-chan wants to know what to call you, Senpai! ♡
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
              Your Name / Nickname
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Alex, Sakura, Chin"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  setError(null);
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs app-input"
              />
            </div>
            {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-theme-gradient py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition shadow-md"
          >
            <span>{loading ? 'Saving...' : "Let's Get Started ♡"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
