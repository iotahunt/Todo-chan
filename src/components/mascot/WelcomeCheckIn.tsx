import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Heart, Smile, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';
import { MoodType } from '../../types/index.ts';
import todochanMascotImg from '../../assets/images/todochan_winking_clean.png';

interface WelcomeCheckInProps {
  username?: string;
  onSelectMood: (mood: MoodType) => void;
  onOpenFullTracker: () => void;
  onDismiss: () => void;
}

const quickMoods: { mood: MoodType; emoji: string; label: string }[] = [
  { mood: 'happy', emoji: '✨', label: 'Happy' },
  { mood: 'excited', emoji: '🎉', label: 'Excited' },
  { mood: 'okay', emoji: '🌱', label: 'Okay' },
  { mood: 'tired', emoji: '🌙', label: 'Tired' },
  { mood: 'stressed', emoji: '🫧', label: 'Stressed' },
  { mood: 'sad', emoji: '🌧️', label: 'Sad' },
];

export const WelcomeCheckIn: React.FC<WelcomeCheckInProps> = ({
  username,
  onSelectMood,
  onOpenFullTracker,
  onDismiss,
}) => {
  const { isDarkMode, themeColor } = useTheme();
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [responseMsg, setResponseMsg] = useState<string | null>(null);

  const responses: Record<MoodType, string> = {
    happy: 'YAYY! I hope we can keep this energy going today! (✿◠‿◠)♡',
    excited: 'EEE! Let’s make something amazing happen today! 🎉💕',
    okay: 'That’s okay too! Let’s take today nice and steady. (｡•̀ᴗ-)✧',
    tired: 'Aww, let’s take things one small step at a time today. Rest is productive too! 🌙',
    stressed: 'It’s okay. We can make the day feel a little more manageable together! 🫧♡',
    sad: 'I’m right here with you. You don’t have to do everything all at once. 💕',
    calm: 'Such a peaceful mindset. Let’s enjoy today’s flow! 🌸',
    anxious: 'Take a gentle deep breath. Todo-chan is right by your side! ♡',
    overwhelmed: 'Let’s pause and pick just one tiny thing. You’ve got this! ✨',
    frustrated: 'Take a breath, Senpai. Every reset is a fresh start! 💕',
  };

  const handlePickMood = (m: MoodType) => {
    setSelectedMood(m);
    setResponseMsg(responses[m]);
    onSelectMood(m);
    setTimeout(() => {
      onDismiss();
    }, 2800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.95 }}
      className={`rounded-2xl border p-4 sm:p-5 shadow-xl relative overflow-hidden transition-colors ${
        isDarkMode ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white border-[#E6DFD3] text-stone-900'
      }`}
      style={{
        boxShadow: 'var(--neon-card-glow)',
        borderColor: 'rgba(var(--accent-rgb), 0.5)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-black/30 border p-1 shrink-0 flex items-center justify-center filter drop-shadow-[0_0_8px_#ff69b4]"
            style={{ borderColor: 'var(--accent-color)' }}
          >
            <img src={todochanMascotImg} alt="Todo-chan" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-theme">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Todo-chan Welcome Check-in</span>
              <Heart className="w-3 h-3 fill-current" />
            </div>
            <h3 className="text-sm sm:text-base font-black">
              {username ? `Heyyy, ${username}! ♡` : "Heyyy, you're back! ♡"}
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
              How are you feeling today?
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className={`p-1 rounded-lg text-xs transition ${
            isDarkMode ? 'text-slate-400 hover:text-white' : 'text-stone-400 hover:text-stone-800'
          }`}
          title="Dismiss for now"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {responseMsg ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-xs font-semibold text-theme flex items-center gap-2"
        >
          <span>{responseMsg}</span>
        </motion.div>
      ) : (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {quickMoods.map((item) => (
              <button
                key={item.mood}
                onClick={() => handlePickMood(item.mood)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 active:scale-95 transition ${
                  isDarkMode
                    ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
                    : 'bg-stone-50 hover:bg-stone-100 border-[#E6DFD3] text-stone-700'
                }`}
                style={{
                  boxShadow: '0 0 8px rgba(var(--accent-rgb), 0.15)',
                }}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-100 dark:border-slate-800 text-xs">
            <button
              onClick={onOpenFullTracker}
              className="text-theme hover:underline font-bold flex items-center gap-1 text-[11px]"
            >
              <span>Open Full Wellness Tracker & Reflection</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={onDismiss}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-slate-200 text-[11px]"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
