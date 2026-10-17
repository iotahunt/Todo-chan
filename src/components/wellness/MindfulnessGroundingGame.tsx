import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Volume2,
  Eye,
  Wind,
  Heart,
  CheckCircle2,
  RotateCcw,
  Calendar,
  X,
  Play,
  Pause,
  ChevronRight,
  Smile,
  Lock,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import todochanMascotImg from '../../assets/images/todochan_ethereal_fairy_neon.png';
import { db } from '../../lib/firebase.ts';
import { setDoc, doc } from 'firebase/firestore';

interface MindfulnessGroundingGameProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSaveToCalendar?: (mood: string, reflectionNote: string) => Promise<void>;
  onTaskAddedToast?: (title: string, destination: string) => void;
}

type GameStage = 'intro' | 'sound_timer' | 'sound_answer' | 'color_hunt' | 'deep_breathing' | 'completed';

const SIX_COLORS = [
  { id: 'pink', name: 'Cotton Candy Baby Pink', hex: '#ff69b4', border: '#ffb6c1', emoji: '🌸', hint: 'Look for stationery, clothes, flowers, or covers!' },
  { id: 'blue', name: 'Sky & Ocean Blue', hex: '#38bdf8', border: '#7dd3fc', emoji: '🌊', hint: 'Look for screens, sky outside, pens, or bottles!' },
  { id: 'green', name: 'Fresh Mint Green', hex: '#34d399', border: '#6ee7b7', emoji: '🌿', hint: 'Look for plants, leaves, cups, or logos!' },
  { id: 'yellow', name: 'Warm Sunshine Yellow', hex: '#facc15', border: '#fde047', emoji: '☀️', hint: 'Look for sticky notes, highlighters, or warm light!' },
  { id: 'purple', name: 'Dreamy Lavender', hex: '#c084fc', border: '#d8b4fe', emoji: '💜', hint: 'Look for books, accessories, or twilight hues!' },
  { id: 'orange', name: 'Cozy Amber Orange', hex: '#fb923c', border: '#fdba74', emoji: '🍊', hint: 'Look for warm wood, desk items, or snacks!' },
];

export const MindfulnessGroundingGame: React.FC<MindfulnessGroundingGameProps> = ({
  isOpen = true,
  onClose,
  onSaveToCalendar,
  onTaskAddedToast,
}) => {
  const { user } = useAuth();
  const { isDarkMode, themeColor, isNeonMode } = useTheme();

  const [stage, setStage] = useState<GameStage>('intro');

  // Sound stage state
  const [soundSecondsLeft, setSoundSecondsLeft] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [soundsCount, setSoundsCount] = useState<number>(3);
  const [soundTypesSelected, setSoundTypesSelected] = useState<string[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Color hunt stage state
  const [currentColorIdx, setCurrentColorIdx] = useState(0);
  const [colorCounts, setColorCounts] = useState<{ [colorId: string]: number }>({
    pink: 1,
    blue: 1,
    green: 1,
    yellow: 1,
    purple: 1,
    orange: 1,
  });

  // Breathing stage state
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCycle, setBreathCycle] = useState(1);
  const [breathSeconds, setBreathSeconds] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  // Calendar recording state
  const [isSavingToCalendar, setIsSavingToCalendar] = useState(false);
  const [savedToCalendar, setSavedToCalendar] = useState(false);

  // Web Audio chime generator for soothing sound cues
  const playSoothingChime = (freq = 528, type: OscillatorType = 'sine', duration = 1.8) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      // Soft gentle harmonic envelope
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Sound Timer Effect
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setSoundSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsTimerRunning(false);
            playSoothingChime(660, 'sine', 2.2);
            setStage('sound_answer');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  // Breathing Guided Effect
  useEffect(() => {
    if (!isBreathingActive) return;

    let breathTimer: any;
    const runCycle = () => {
      // 4s Inhale
      setBreathPhase('inhale');
      playSoothingChime(432, 'sine', 2.0);

      breathTimer = setTimeout(() => {
        // 4s Hold
        setBreathPhase('hold');
        playSoothingChime(528, 'triangle', 1.5);

        breathTimer = setTimeout(() => {
          // 4s Exhale
          setBreathPhase('exhale');
          playSoothingChime(396, 'sine', 2.5);

          breathTimer = setTimeout(() => {
            setBreathCycle((prev) => {
              if (prev >= 3) {
                setIsBreathingActive(false);
                playSoothingChime(528, 'sine', 3.0);
                setTimeout(() => setStage('completed'), 800);
                return 3;
              }
              return prev + 1;
            });
          }, 4000);
        }, 4000);
      }, 4000);
    };

    runCycle();

    return () => {
      if (breathTimer) clearTimeout(breathTimer);
    };
  }, [isBreathingActive, breathCycle]);

  const handleStartSoundMeditation = () => {
    setSoundSecondsLeft(60);
    setIsTimerRunning(true);
    setStage('sound_timer');
    playSoothingChime(432, 'sine', 2.0);
  };

  const handleSkipSoundTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsTimerRunning(false);
    playSoothingChime(528, 'sine', 1.8);
    setStage('sound_answer');
  };

  const handleFinishSoundAnswer = () => {
    playSoothingChime(587, 'sine', 1.5);
    setCurrentColorIdx(0);
    setStage('color_hunt');
  };

  const handleColorCountChange = (delta: number) => {
    const colorId = SIX_COLORS[currentColorIdx].id;
    setColorCounts((prev) => ({
      ...prev,
      [colorId]: Math.max(0, (prev[colorId] || 0) + delta),
    }));
  };

  const handleNextColor = () => {
    playSoothingChime(528 + currentColorIdx * 30, 'sine', 1.2);
    if (currentColorIdx < SIX_COLORS.length - 1) {
      setCurrentColorIdx((prev) => prev + 1);
    } else {
      // Finished all 6 colors! Move to breathing
      setStage('deep_breathing');
      setBreathCycle(1);
      setIsBreathingActive(true);
    }
  };

  const handleSaveToCalendarRecord = async () => {
    if (!user || isSavingToCalendar) return;
    setIsSavingToCalendar(true);

    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];
    const checkinId = 'well_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const totalObjects = Object.values(colorCounts).reduce((a, b) => a + b, 0);
    const reflectionText = `Completed Todo-chan's Grounding Game: Heard ${soundsCount} sounds during 1-min listening, spotted ${totalObjects} colorful objects across 6 colors, and took 3 deep grounding breath cycles. Feeling peaceful and centered.`;

    const record = {
      id: checkinId,
      userId: user.id,
      mood: 'calm',
      intensity: 5,
      reflection: {
        day: reflectionText,
        proudOf: 'Took time to practice sensory grounding with Todo-chan',
        needsNow: 'Remaining centered and gentle with myself',
      },
      createdAt: nowIso,
      isGameCompleted: true,
    };

    try {
      await setDoc(doc(db, 'wellness_checkins', checkinId), record);
      // Also cache in localStorage for instant offline access
      const existing = JSON.parse(localStorage.getItem(`wellness_${user.id}`) || '[]');
      existing.unshift(record);
      localStorage.setItem(`wellness_${user.id}`, JSON.stringify(existing));

      setSavedToCalendar(true);
      playSoothingChime(660, 'sine', 2.0);

      if (onTaskAddedToast) {
        onTaskAddedToast('Calm Emotional Record', 'Calendar (Private to you)');
      }
      if (onSaveToCalendar) {
        await onSaveToCalendar('calm', reflectionText);
      }
    } catch (e) {
      console.error('Failed to save to calendar:', e);
      // Fallback to local
      setSavedToCalendar(true);
    } finally {
      setIsSavingToCalendar(false);
    }
  };

  const handleRestart = () => {
    setStage('intro');
    setSoundSecondsLeft(60);
    setIsTimerRunning(false);
    setCurrentColorIdx(0);
    setBreathCycle(1);
    setIsBreathingActive(false);
    setSavedToCalendar(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden my-auto flex flex-col transition-colors ${
          isDarkMode ? 'bg-slate-900/95 border-pink-500/40' : 'bg-white/95 border-[#E6DFD3]'
        }`}
        style={{
          boxShadow: '0 0 35px rgba(255, 182, 193, 0.45), 0 0 70px rgba(255, 105, 180, 0.25)',
          borderColor: 'var(--accent-color)',
        }}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-pink-500/10 via-purple-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center p-1 border shrink-0 bg-black/40"
              style={{
                borderColor: '#ffb6c1',
                filter: 'drop-shadow(0 0 10px #ff69b4)',
              }}
            >
              <img
                src={todochanMascotImg}
                alt="Todo-chan"
                className="w-full h-full object-contain filter drop-shadow-[0_0_6px_#ffb6c1]"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-theme">
                <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Todo-chan's Healing Game</span>
                <Heart className="w-3.5 h-3.5 fill-current text-pink-400" />
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Sensory Calm & Grounding Quest
              </h2>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl border transition ${
                isDarkMode
                  ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'border-[#E6DFD3] text-stone-500 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress Bar through 3 Core Steps */}
        <div className="px-5 pt-3 pb-1 flex items-center justify-between text-[11px] font-bold border-b border-stone-100 dark:border-slate-800/80 bg-stone-50/50 dark:bg-slate-950/40">
          <div className={`flex items-center gap-1.5 ${stage === 'sound_timer' || stage === 'sound_answer' ? 'text-theme font-black' : 'text-stone-400'}`}>
            <Volume2 className="w-3.5 h-3.5" />
            <span>1. Listen (1 Min)</span>
          </div>
          <ChevronRight className="w-3 h-3 text-stone-300 dark:text-slate-700" />
          <div className={`flex items-center gap-1.5 ${stage === 'color_hunt' ? 'text-theme font-black' : 'text-stone-400'}`}>
            <Eye className="w-3.5 h-3.5" />
            <span>2. 6 Colors Hunt</span>
          </div>
          <ChevronRight className="w-3 h-3 text-stone-300 dark:text-slate-700" />
          <div className={`flex items-center gap-1.5 ${stage === 'deep_breathing' ? 'text-theme font-black' : 'text-stone-400'}`}>
            <Wind className="w-3.5 h-3.5" />
            <span>3. Deep Breathing</span>
          </div>
        </div>

        {/* Main Game Stage Content */}
        <div className="p-5 sm:p-6 flex-1 flex flex-col justify-center min-h-[360px]">
          {/* STAGE: INTRO */}
          {stage === 'intro' && (
            <div className="text-center space-y-4 py-2">
              <div
                className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center p-2 border relative overflow-hidden"
                style={{
                  borderColor: '#ffb6c1',
                  boxShadow: '0 0 25px rgba(255,182,193,0.7)',
                  background: 'radial-gradient(circle, rgba(255,182,193,0.2) 0%, rgba(255,105,180,0.05) 100%)',
                }}
              >
                <img
                  src={todochanMascotImg}
                  alt="Todo-chan"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_12px_#ff69b4]"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-theme px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20">
                  Fairy Tale Mindfulness Quest 🌸
                </span>
                <h3 className="text-xl font-black mt-2">
                  "Ready to ground your senses with me, Senpai?"
                </h3>
                <p className={`text-xs mt-1.5 max-w-md mx-auto leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-stone-600'}`}>
                  First, we will sit and close our eyes to listen to surrounding sounds for 1 minute.
                  Next, we will look around for 6 different vibrant colors.
                  Finally, we will take peaceful deep healing breaths together! (✿◠‿◠)💕
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center max-w-sm mx-auto">
                <button
                  onClick={handleStartSoundMeditation}
                  className="btn-theme-gradient py-3 px-6 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Begin 1-Minute Listening</span>
                </button>
              </div>
            </div>
          )}

          {/* STAGE 1: SOUND TIMER (Sit & Close Eyes for 1 Minute) */}
          {stage === 'sound_timer' && (
            <div className="text-center space-y-5 py-2">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-theme">
                <Volume2 className="w-4 h-4 animate-pulse text-pink-400" />
                <span>Sit comfortably & close your eyes...</span>
              </div>

              {/* 1-Minute Countdown Clock with Cotton Candy Fairy Pulse */}
              <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                    boxShadow: [
                      '0 0 20px rgba(255, 182, 193, 0.4)',
                      '0 0 45px rgba(255, 105, 180, 0.7)',
                      '0 0 20px rgba(255, 182, 193, 0.4)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full border-4 border-dashed"
                  style={{ borderColor: '#ffb6c1' }}
                />

                <div
                  className={`w-36 h-36 rounded-full flex flex-col items-center justify-center border shadow-xl z-10 ${
                    isDarkMode ? 'bg-slate-950/90 border-pink-400/50' : 'bg-white/90 border-pink-300'
                  }`}
                >
                  <span className="text-3xl font-black font-mono tracking-tight text-theme tabular-nums">
                    0:{soundSecondsLeft < 10 ? `0${soundSecondsLeft}` : soundSecondsLeft}
                  </span>
                  <span className="text-[10px] font-semibold text-stone-400 mt-1 uppercase tracking-wider">
                    Listening to Sounds
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold text-stone-800 dark:text-stone-100">
                  "Todo-chan is keeping time! Close your eyes and notice every sound."
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                  Bird songs, computer fan, distant cars, clock ticks, or gentle breathing...
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
                    isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-[#E6DFD3] bg-stone-50'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isTimerRunning ? 'Pause' : 'Resume'}</span>
                </button>
                <button
                  onClick={handleSkipSoundTimer}
                  className="btn-theme-secondary px-4 py-2 rounded-xl text-xs font-bold transition"
                >
                  I'm Ready Early ✨
                </button>
              </div>
            </div>
          )}

          {/* STAGE 1 ANSWER: How many sounds did you hear? */}
          {stage === 'sound_answer' && (
            <div className="space-y-4 py-1 text-center">
              <div
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center p-1 border bg-black/30"
                style={{ borderColor: '#ffb6c1', boxShadow: '0 0 15px rgba(255,182,193,0.5)' }}
              >
                <img src={todochanMascotImg} alt="Todo-chan" className="w-full h-full object-contain" />
              </div>

              <div>
                <h3 className="text-lg font-black tracking-tight">
                  "Gently open your eyes! (✿◠‿◠)"
                </h3>
                <p className="text-xs text-theme font-bold mt-1">
                  How many types of sounds did you hear during the past 1 minute?
                </p>
              </div>

              {/* Number Stepper */}
              <div className="flex items-center justify-center gap-4 py-2">
                <button
                  onClick={() => setSoundsCount((prev) => Math.max(1, prev - 1))}
                  className="w-10 h-10 rounded-xl border font-black text-lg flex items-center justify-center btn-theme-secondary"
                >
                  -
                </button>
                <div
                  className="w-16 h-14 rounded-2xl border flex items-center justify-center text-2xl font-black font-mono text-theme"
                  style={{ borderColor: 'var(--accent-color)' }}
                >
                  {soundsCount}
                </div>
                <button
                  onClick={() => setSoundsCount((prev) => prev + 1)}
                  className="w-10 h-10 rounded-xl border font-black text-lg flex items-center justify-center btn-theme-secondary"
                >
                  +
                </button>
              </div>

              {/* Quick tags */}
              <div className="space-y-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                  Tap sounds you noticed (optional):
                </span>
                <div className="flex flex-wrap justify-center gap-1.5 max-w-md mx-auto">
                  {['Wind / AC', 'Birds / Animals', 'Clock ticking', 'Vehicles / Road', 'Footsteps', 'My breathing', 'Keyboard / Mice', 'Voices'].map((sound) => {
                    const isSelected = soundTypesSelected.includes(sound);
                    return (
                      <button
                        key={sound}
                        onClick={() => {
                          setSoundTypesSelected((prev) =>
                            isSelected ? prev.filter((s) => s !== sound) : [...prev, sound]
                          );
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition ${
                          isSelected
                            ? 'bg-theme text-white border-theme'
                            : isDarkMode
                            ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                            : 'bg-stone-50 border-[#E6DFD3] text-stone-700'
                        }`}
                      >
                        {sound}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleFinishSoundAnswer}
                  className="btn-theme-gradient py-2.5 px-6 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition"
                >
                  <span>Next: Look Around for 6 Colors! 🌈</span>
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: 6 DIFFERENT COLORS HUNT */}
          {stage === 'color_hunt' && (
            <div className="space-y-4 py-1 text-center">
              {(() => {
                const cur = SIX_COLORS[currentColorIdx];
                const count = colorCounts[cur.id] || 0;
                return (
                  <>
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-theme">
                        Color {currentColorIdx + 1} of 6
                      </span>
                      <span className="text-xs font-mono font-bold text-stone-400">
                        {cur.name}
                      </span>
                    </div>

                    {/* Glowing Color Card */}
                    <motion.div
                      key={cur.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-5 rounded-3xl border shadow-xl max-w-sm mx-auto relative overflow-hidden app-card"
                      style={{
                        borderColor: cur.hex,
                        boxShadow: `0 0 25px ${cur.hex}50`,
                      }}
                    >
                      <div
                        className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-2"
                        style={{
                          backgroundColor: `${cur.hex}25`,
                          border: `2px solid ${cur.hex}`,
                        }}
                      >
                        {cur.emoji}
                      </div>

                      <h4 className="text-base font-black" style={{ color: cur.hex }}>
                        Spot: {cur.name}
                      </h4>
                      <p className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-300' : 'text-stone-600'}`}>
                        {cur.hint}
                      </p>

                      {/* Counter */}
                      <div className="flex items-center justify-center gap-3 mt-4">
                        <button
                          onClick={() => handleColorCountChange(-1)}
                          className="w-9 h-9 rounded-xl border font-black text-lg flex items-center justify-center btn-theme-secondary"
                        >
                          -
                        </button>
                        <div
                          className="w-14 h-12 rounded-xl border flex items-center justify-center text-xl font-black font-mono"
                          style={{ borderColor: cur.hex, color: cur.hex }}
                        >
                          {count}
                        </div>
                        <button
                          onClick={() => handleColorCountChange(1)}
                          className="w-9 h-9 rounded-xl border font-black text-lg flex items-center justify-center btn-theme-secondary"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[10px] text-stone-400 font-semibold block mt-1">
                        {count === 0 ? 'None spotted yet' : count === 1 ? '1 object spotted' : `${count} objects spotted`}
                      </span>
                    </motion.div>

                    {/* Navigation */}
                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        onClick={handleNextColor}
                        className="btn-theme-gradient py-2.5 px-6 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition"
                      >
                        {currentColorIdx < SIX_COLORS.length - 1 ? (
                          <span>Next Color ({currentColorIdx + 2}/6) →</span>
                        ) : (
                          <span>All 6 Colors Found! Next: Deep Breaths 🌸</span>
                        )}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* STAGE 3: GUIDED DEEP BREATHING */}
          {stage === 'deep_breathing' && (
            <div className="space-y-4 py-2 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-theme">
                <Wind className="w-4 h-4 animate-pulse text-pink-400" />
                <span>Cycle {breathCycle} of 3</span>
              </div>

              {/* Expanding & Contracting Breathing Orb */}
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: breathPhase === 'inhale' ? 1.35 : breathPhase === 'hold' ? 1.35 : 0.85,
                  }}
                  transition={{ duration: 4, ease: 'easeInOut' }}
                  className="w-32 h-32 rounded-full flex flex-col items-center justify-center border-4 shadow-2xl relative"
                  style={{
                    borderColor: '#ffb6c1',
                    background: 'radial-gradient(circle, rgba(255,182,193,0.4) 0%, rgba(255,105,180,0.15) 70%, transparent 100%)',
                    boxShadow: '0 0 40px rgba(255, 182, 193, 0.8), 0 0 80px rgba(255, 105, 180, 0.4)',
                  }}
                >
                  <span className="text-sm font-black uppercase tracking-wider text-theme">
                    {breathPhase === 'inhale'
                      ? 'Breathe In'
                      : breathPhase === 'hold'
                      ? 'Hold Gently'
                      : 'Slowly Breathe Out'}
                  </span>
                  <span className="text-[10px] font-semibold text-stone-500 dark:text-slate-400 mt-0.5">
                    {breathPhase === 'inhale'
                      ? 'Through nose 🌸'
                      : breathPhase === 'hold'
                      ? 'Feel peace ✨'
                      : 'Release tension 🍃'}
                  </span>
                </motion.div>
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold">
                  {breathPhase === 'inhale' && '"Inhale deep, healing calmness..."'}
                  {breathPhase === 'hold' && '"Pause and feel your heartbeat at ease..."'}
                  {breathPhase === 'exhale' && '"Slowly breathe out... let all worries dissolve."'}
                </h4>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                  Follow the rhythm of Todo-chan's cotton candy breath orb.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setStage('completed')}
                  className="btn-theme-secondary py-1.5 px-4 rounded-xl text-xs font-bold transition"
                >
                  Finish Breaths Early
                </button>
              </div>
            </div>
          )}

          {/* STAGE 4: COMPLETED & CALENDAR LOGGING */}
          {stage === 'completed' && (
            <div className="space-y-4 py-2 text-center">
              <div
                className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center p-1.5 border relative"
                style={{
                  borderColor: '#ffb6c1',
                  boxShadow: '0 0 35px rgba(255,182,193,0.85), 0 0 70px rgba(255,105,180,0.5)',
                  background: 'radial-gradient(circle, rgba(255,182,193,0.3) 0%, transparent 100%)',
                }}
              >
                <img
                  src={todochanMascotImg}
                  alt="Todo-chan"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_10px_#ff69b4]"
                />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  Quest Complete! ✨
                </span>
                <h3 className="text-xl font-black mt-2">
                  "You did it, Senpai! Feel how calm and safe you are right now!"
                </h3>
                <p className={`text-xs mt-1.5 max-w-md mx-auto leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-stone-600'}`}>
                  You listened to {soundsCount} sounds, grounded your eyes with 6 colors, and took 3 healing breaths.
                  Your nervous system is gently reset! (✿◠‿◠)💕
                </p>
              </div>

              {/* Save to Calendar Card */}
              <div className="p-4 rounded-2xl border app-subcard max-w-md mx-auto text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-theme">
                    <Calendar className="w-4 h-4" />
                    <span>Daily Wellbeing Emotional State Record</span>
                  </div>
                  <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-pink-400" />
                    <span>Only you can see</span>
                  </span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                  Keep track of this calm emotional state on your Calendar so you can look back on your wellbeing trajectory over time!
                </p>

                {savedToCalendar ? (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>✓ Saved to your Calendar for today! Only you can see it. 🔒</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSaveToCalendarRecord}
                    disabled={isSavingToCalendar}
                    className="w-full btn-theme-gradient py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                    <span>{isSavingToCalendar ? 'Saving to Calendar...' : 'Save "Calm & Grounded" to Calendar 🔒'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={handleRestart}
                  className="btn-theme-secondary py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Play Again</span>
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="btn-theme-primary py-2 px-5 rounded-xl text-xs font-bold text-white transition"
                  >
                    Back to Planner
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
