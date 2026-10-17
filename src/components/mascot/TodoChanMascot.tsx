import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Heart, Star, Smile, Bell, Gamepad2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';
import { Task } from '../../types/index.ts';
import todochanMascotImg from '../../assets/images/todochan_ethereal_fairy_neon.png';

interface TodoChanMascotProps {
  tasks?: Task[];
  onTriggerEasterEgg: () => void;
  onOpenCheckIn?: () => void;
  onOpenGame?: () => void;
  username?: string;
}

export const TodoChanMascot: React.FC<TodoChanMascotProps> = ({
  tasks = [],
  onTriggerEasterEgg,
  onOpenCheckIn,
  onOpenGame,
  username,
}) => {
  const { themeColor, isDarkMode, isNeonMode } = useTheme();
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const longPressTimer = useRef<any>(null);
  const bubbleTimeout = useRef<any>(null);

  // Dynamic quotes with reminders and the required Easter egg hint
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const urgentTasks = pendingTasks.filter(
    (t) => t.matrixQuadrant === 'q1' || (t.urgency && t.urgency >= 7)
  );

  const quotes = [
    'Long press me for a surprise! ✨💕',
    username ? `Hey ${username}! Let's make today productive and kind! (✿◠‿◠)` : 'Todo-chan is cheering you on! (✿◠‿◠)✨',
    urgentTasks.length > 0
      ? `Senpai! You have "${urgentTasks[0].title}" in Quadrant 1 (Do First)! Don't forget! 🎯`
      : 'All caught up? You can capture thoughts in "Talk to Todo-chan"! 📝',
    'Long press me for a surprise! 🤫💖',
    'Remember to drink some water and stretch your shoulders! 🌸',
    'Want to play my Calming Sensory Game? Tap below! 🎮🌸',
    urgentTasks.length > 1
      ? `Attention Senpai! ${urgentTasks.length} urgent tasks waiting for your focus! Let's conquer them! ⚡`
      : 'You are doing great! Todo-chan believes in your momentum! 💕',
    'Click me for quick tips, or hold me down! (｡•̀ᴗ-)✧',
  ];

  // Auto-show bubble periodically with the surprise message
  useEffect(() => {
    setShowSpeechBubble(true);
    bubbleTimeout.current = setTimeout(() => {
      setShowSpeechBubble(false);
    }, 9000);

    return () => {
      if (bubbleTimeout.current) clearTimeout(bubbleTimeout.current);
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  const handleMascotClick = () => {
    if (bubbleTimeout.current) clearTimeout(bubbleTimeout.current);
    setQuoteIndex((prev) => (prev + 1) % quotes.length);
    setShowSpeechBubble(true);
    bubbleTimeout.current = setTimeout(() => {
      setShowSpeechBubble(false);
    }, 7000);
  };

  const handlePointerDown = () => {
    setIsLongPressing(true);
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(false);
      onTriggerEasterEgg();
    }, 650);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    setIsLongPressing(false);
  };

  return (
    <aside
      aria-label="Todo-chan Mascot"
      className="fixed bottom-3 right-3 z-40 select-none flex flex-col items-end pointer-events-none"
    >
      {/* Speech Bubble */}
      <AnimatePresence>
        {showSpeechBubble && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 320 }}
            className={`pointer-events-auto mb-2 max-w-xs rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md relative border ${
              isDarkMode ? 'bg-slate-950/95 text-white' : 'bg-white/95 text-stone-900'
            }`}
            style={{
              borderColor: '#ffb6c1',
              boxShadow: '0 0 25px rgba(255, 182, 193, 0.4), 0 0 50px rgba(255, 105, 180, 0.25)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-theme">
                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                <span>Todo-chan</span>
                <Heart className="w-3 h-3 fill-current text-pink-400" />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSpeechBubble(false);
                }}
                className={`p-0.5 rounded-sm transition ${
                  isDarkMode ? 'text-slate-400 hover:text-white' : 'text-stone-400 hover:text-stone-800'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="mt-1.5 text-xs font-semibold leading-snug">
              {quotes[quoteIndex % quotes.length]}
            </p>

            {/* Quick Actions Shortcuts */}
            <div className="mt-2.5 flex items-center gap-1.5">
              {onOpenGame && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenGame();
                  }}
                  className="flex-1 btn-theme-gradient py-1.5 px-2 rounded-xl text-[10px] font-bold text-white flex items-center justify-center gap-1 shadow-sm active:scale-95 transition"
                >
                  <Gamepad2 className="w-3 h-3" />
                  <span>Calm Game 🌸</span>
                </button>
              )}

              {onOpenCheckIn && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCheckIn();
                  }}
                  className="flex-1 btn-theme-secondary py-1.5 px-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 transition"
                >
                  <Smile className="w-3 h-3" />
                  <span>Mood Check ♡</span>
                </button>
              )}
            </div>

            {/* Bubble beak pointing directly at mascot */}
            <div
              className={`absolute -bottom-2 right-12 w-4 h-4 border-r border-b transform rotate-45 ${
                isDarkMode ? 'bg-slate-950' : 'bg-white'
              }`}
              style={{ borderColor: '#ffb6c1' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Interactive Todo-chan Container */}
      <div className="pointer-events-auto flex items-end gap-1.5">
        {!isMinimized && (
          <div className="relative group">
            {/* Multiple Floating Baby Pink Neon Elements */}
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 10, -5, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
              className="absolute -top-3 -left-3 pointer-events-none text-theme drop-shadow-[0_0_8px_rgba(255,182,193,0.95)]"
            >
              <Heart className="w-4 h-4 fill-current text-pink-400" />
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, -15, 5, 0], scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 3.2, delay: 0.5, ease: 'easeInOut' }}
              className="absolute top-2 -right-3 pointer-events-none text-theme drop-shadow-[0_0_10px_rgba(255,105,180,0.95)]"
            >
              <Star className="w-4 h-4 fill-current text-pink-400" />
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0], scale: [0.9, 1.15, 0.9] }}
              transition={{ repeat: Infinity, duration: 2.4, delay: 1, ease: 'easeInOut' }}
              className="absolute bottom-6 -left-3 pointer-events-none text-theme drop-shadow-[0_0_8px_rgba(255,182,193,0.95)]"
            >
              <Sparkles className="w-4 h-4 text-pink-300" />
            </motion.div>

            {/* Mascot Character with Ethereal Cotton Candy Fairy Tale Glow */}
            <motion.div
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 3.5,
                ease: 'easeInOut',
              }}
              onClick={handleMascotClick}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              role="button"
              tabIndex={0}
              aria-label="Todo-chan mascot. Click for tips or long-press for wellness surprise."
              className="relative cursor-pointer flex flex-col items-center"
            >
              <div
                className="w-28 h-32 sm:w-32 sm:h-36 flex items-center justify-center relative rounded-3xl"
                style={{
                  background: 'radial-gradient(circle, rgba(255,182,193,0.25) 0%, rgba(255,105,180,0.08) 55%, transparent 75%)',
                }}
              >
                <img
                  src={todochanMascotImg}
                  alt="Todo-chan Anime Mascot (Ethereal Cotton Candy Baby Pink Winking Girl)"
                  className="w-full h-full object-contain select-none pointer-events-none transition-all duration-300"
                  style={{
                    filter: isLongPressing
                      ? 'drop-shadow(0 0 10px #ffb6c1) drop-shadow(0 0 22px rgba(255,182,193,1)) drop-shadow(0 0 45px rgba(255,105,180,0.9))'
                      : 'drop-shadow(0 0 6px #ffb6c1) drop-shadow(0 0 16px rgba(255,182,193,0.85)) drop-shadow(0 0 30px rgba(255,105,180,0.5))',
                  }}
                  draggable={false}
                />

                {/* Long-press progress feedback badge */}
                <div
                  className={`absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-lg transition-transform ${
                    isLongPressing ? 'scale-125 bg-pink-600' : 'animate-pulse'
                  }`}
                  style={{
                    backgroundColor: '#ff69b4',
                    boxShadow: '0 0 12px #ff69b4',
                  }}
                  title="Hold for a surprise!"
                >
                  <span>{isLongPressing ? 'Holding...' : 'Hold ✨'}</span>
                </div>
              </div>

              {/* Tooltip on Hover */}
              <div
                className={`opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold -mt-1 px-2.5 py-0.5 rounded-full shadow-md border ${
                  isDarkMode
                    ? 'bg-slate-950/95 text-pink-300 border-pink-400/60'
                    : 'bg-white text-pink-600 border-pink-400'
                }`}
                style={{
                  boxShadow: '0 0 15px rgba(255, 182, 193, 0.4)',
                }}
              >
                Long press me for a surprise! ✨
              </div>
            </motion.div>
          </div>
        )}

        {/* Minimize / Expand Toggle */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          aria-label={isMinimized ? 'Show Todo-chan' : 'Minimize Todo-chan'}
          className={`p-1.5 rounded-full border shadow-lg backdrop-blur-xs transition mb-2 ${
            isDarkMode
              ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-700/80'
              : 'bg-white hover:bg-stone-100 text-stone-500 hover:text-stone-800 border-[#E6DFD3]'
          }`}
          style={{
            borderColor: '#ffb6c1',
          }}
          title={isMinimized ? 'Expand Todo-chan' : 'Minimize Todo-chan'}
        >
          {isMinimized ? <Sparkles className="w-4 h-4 text-theme" /> : <X className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
