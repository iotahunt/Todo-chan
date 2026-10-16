import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, ChevronDown, ChevronUp, Heart, Bot, Bell, Star } from 'lucide-react';
import { TodoChanBobCutEmote } from './TodoChanBobCutEmote.tsx';
import { Task } from '../../types/index.ts';
import { useTheme } from '../../context/ThemeContext.tsx';

interface TocoChanProps {
  tasks?: Task[];
  onOpenAiChat?: () => void;
}

export const TocoChan: React.FC<TocoChanProps> = ({ tasks = [], onOpenAiChat }) => {
  const { isDarkMode, isNeonMode } = useTheme();
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const bubbleTimeout = useRef<any>(null);
  const longPressTimer = useRef<any>(null);

  // Generate dynamic quotes including actual task reminders
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const todayStr = new Date().toISOString().split('T')[0];
  const urgentTasks = pendingTasks.filter(
    (t) => t.matrixQuadrant === 'q1' || (t.urgency && t.urgency >= 7) || t.dueDate === todayStr
  );

  const dynamicQuotes = [
    "HEYYYY! TODO-CHAN SAYS COMPLETE YOUR WORKS! 💕",
    urgentTasks.length > 0
      ? `Senpai! You still have "${urgentTasks[0].title}" waiting! Don't let Todo-chan down! (｡•́︿•̀｡)✨`
      : "You're doing super great today! Todo-chan believes in you! ✨",
    "Todo-chan is watching your Eisenhower Matrix (≖‿≖)♡",
    urgentTasks.length > 1
      ? `Attention! You have ${urgentTasks.length} urgent tasks in Quadrant 1 (Do First)! Let's conquer them! 🎯`
      : "Don't procrastinate! Todo-chan will reward you with chocolate! 🍫",
    "Long-press or click me to talk with my integrated AI! 🤖💕",
    "Todo-chan feels happy when you check off your tasks! (✿◠‿◠)",
  ];

  const handleMascotClick = () => {
    if (bubbleTimeout.current) clearTimeout(bubbleTimeout.current);
    setQuoteIndex((prev) => (prev + 1) % dynamicQuotes.length);
    setShowSpeechBubble(true);

    bubbleTimeout.current = setTimeout(() => {
      setShowSpeechBubble(false);
    }, 6000);
  };

  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      if (onOpenAiChat) {
        onOpenAiChat();
      }
    }, 550);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    setIsLongPressing(false);
  };

  useEffect(() => {
    return () => {
      if (bubbleTimeout.current) clearTimeout(bubbleTimeout.current);
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  return (
    <aside
      aria-label="Todo-chan Mascot"
      className="fixed bottom-3 right-3 z-40 select-none flex flex-col items-end pointer-events-none"
    >
      {/* Speech Bubble with Task Reminder & AI Trigger */}
      <AnimatePresence>
        {showSpeechBubble && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 320 }}
            className={`pointer-events-auto mb-2 max-w-xs rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md relative border ${
              isDarkMode
                ? 'bg-slate-950/95 border-pink-400/80 text-white'
                : 'bg-white/95 border-pink-400 text-stone-900'
            }`}
            style={{
              boxShadow: isNeonMode
                ? '0 0 25px rgba(255, 105, 180, 0.45), inset 0 0 15px rgba(255, 105, 180, 0.1)'
                : '0 8px 24px rgba(0,0,0,0.15)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-pink-500">
                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                <span>Todo-chan (Bob Cut)</span>
                <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
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
              {dynamicQuotes[quoteIndex % dynamicQuotes.length]}
            </p>

            {/* Quick Action Button to open AI Chat */}
            {onOpenAiChat && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAiChat();
                }}
                className="mt-2.5 w-full btn-theme-gradient py-1.5 px-3 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Chat with AI Todo-chan ✨</span>
              </button>
            )}

            {/* Bubble beak pointing directly at mascot */}
            <div
              className={`absolute -bottom-2 right-12 w-4 h-4 border-r border-b transform rotate-45 ${
                isDarkMode ? 'bg-slate-950 border-pink-400/80' : 'bg-white border-pink-400'
              }`}
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
              animate={{ y: [0, -10, 0], rotate: [0, 10, -5, 0], scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
              className="absolute -top-3 -left-3 pointer-events-none text-pink-400 drop-shadow-[0_0_8px_rgba(255,105,180,0.8)]"
            >
              <Heart className="w-4 h-4 fill-pink-400" />
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, -15, 5, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 3.2, delay: 0.5, ease: 'easeInOut' }}
              className="absolute top-2 -right-3 pointer-events-none text-pink-300 drop-shadow-[0_0_10px_rgba(255,182,193,0.9)]"
            >
              <Star className="w-4 h-4 fill-pink-300 text-pink-200" />
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0], scale: [0.9, 1.1, 0.9] }}
              transition={{ repeat: Infinity, duration: 2.4, delay: 1, ease: 'easeInOut' }}
              className="absolute bottom-6 -left-3 pointer-events-none text-pink-400 drop-shadow-[0_0_6px_rgba(255,105,180,0.8)]"
            >
              <Sparkles className="w-4 h-4 text-pink-400" />
            </motion.div>

            {/* Mascot Character with Bob Cut & Baby Pink Neon */}
            <motion.div
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.94 }}
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
              aria-label="Todo-chan mascot. Click for tips or long-press for AI assistant."
              className="relative cursor-pointer flex flex-col items-center"
            >
              <div className="w-28 h-32 sm:w-32 sm:h-36 flex items-center justify-center relative bg-transparent">
                <TodoChanBobCutEmote size={135} />

                {/* Pulsing AI Badge */}
                <div
                  className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-lg animate-pulse flex items-center gap-1"
                  style={{
                    backgroundColor: '#ff69b4',
                    boxShadow: '0 0 12px #ff69b4',
                  }}
                  title="Long press to talk to AI"
                >
                  <Bot className="w-3 h-3" />
                  <span>AI</span>
                </div>
              </div>

              {/* Tooltip on Hover */}
              <div
                className={`opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold -mt-1 px-2.5 py-0.5 rounded-full shadow-md border ${
                  isDarkMode
                    ? 'bg-slate-950/95 text-pink-300 border-pink-400/60'
                    : 'bg-white text-pink-600 border-pink-400'
                }`}
              >
                Click or Hold for AI! 💕
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
              ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-pink-300 border-slate-700/80'
              : 'bg-white hover:bg-stone-100 text-stone-500 hover:text-pink-500 border-[#E6DFD3]'
          }`}
          title={isMinimized ? 'Expand Todo-chan' : 'Minimize Todo-chan'}
        >
          {isMinimized ? <ChevronUp className="w-4 h-4 text-pink-500" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
