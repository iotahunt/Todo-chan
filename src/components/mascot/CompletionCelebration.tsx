import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import chocolateImg from '../../assets/images/chocolate_reward_art_1791993043949.jpg';
import bobCutMascotImg from '../../assets/images/todochan_bobcut_mascot_1791995510709.jpg';
import { useTheme } from '../../context/ThemeContext.tsx';

interface CompletionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle?: string;
}

export const CompletionCelebration: React.FC<CompletionCelebrationProps> = ({
  isOpen,
  onClose,
  taskTitle,
}) => {
  const { themeColor, isNeonMode } = useTheme();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 4200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 18, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl bg-slate-900/95 border-2 p-6 shadow-2xl text-center overflow-hidden"
            style={{
              borderColor: themeColor,
              boxShadow: isNeonMode
                ? `0 0 35px ${themeColor}60, 0 0 70px ${themeColor}30`
                : `0 20px 40px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Sparkle decorative particles */}
            <div
              className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40"
              style={{ backgroundColor: themeColor }}
            />
            <div
              className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-40"
              style={{ backgroundColor: themeColor }}
            />

            {/* Mascot + Chocolate Badge */}
            <div className="relative mx-auto w-36 h-36 mb-4 flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, -4, 4, -2, 2, 0], scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2.2 }}
                className="w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 shadow-xl"
                style={{ borderColor: themeColor }}
              >
                <img
                  src={chocolateImg}
                  alt="Delicious reward chocolate"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>

              {/* Transparent Baby Pink Neon Bob Cut Mascot sticker */}
              <div className="absolute -bottom-3 -right-2 w-18 h-18 pointer-events-none flex items-center justify-center">
                <img
                  src={bobCutMascotImg}
                  alt="Todo-chan bob cut anime girl"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,182,193,0.9)]"
                  style={{ mixBlendMode: 'screen' }}
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Headline */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-2 border"
              style={{
                color: themeColor,
                backgroundColor: `${themeColor}20`,
                borderColor: `${themeColor}40`,
              }}
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Great Work!</span>
            </div>

            <h3 className="text-lg font-black text-white tracking-tight">
              YAYY!!! TODO-CHAN GIVES U A CHOCOLATE!!!
            </h3>

            {taskTitle && (
              <p className="mt-2 text-xs text-slate-300 truncate max-w-xs mx-auto">
                Completed:{' '}
                <span className="font-semibold" style={{ color: themeColor }}>
                  "{taskTitle}"
                </span>
              </p>
            )}

            <p className="mt-1 text-[11px] text-slate-400">
              One step closer to greatness today! Keep up the momentum.
            </p>

            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white shadow-lg transition active:scale-95"
              style={{
                backgroundColor: themeColor,
                boxShadow: isNeonMode ? `0 0 15px ${themeColor}60` : undefined,
              }}
            >
              Yummy! Thank you Todo-chan!
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
