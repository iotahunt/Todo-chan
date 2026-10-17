import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  X,
  Heart,
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
  Clock,
  BookOpen,
  Droplets,
  Apple,
  Coffee,
  Footprints,
  Sun,
  Activity,
  Smile,
  CheckSquare,
  Gamepad2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { MoodType, WellnessCheckin, CareTask, Task } from '../../types/index.ts';
import { db } from '../../lib/firebase.ts';
import {
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import todochanMascotImg from '../../assets/images/todochan_ethereal_fairy_neon.png';
import { MindfulnessGroundingGame } from './MindfulnessGroundingGame.tsx';

interface EmotionTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCareTaskToPlanner?: (taskData: Partial<Task>) => Promise<void>;
  onTaskAddedToast?: (title: string, destination: string) => void;
  initialMood?: MoodType | null;
}

const moodOptions: { type: MoodType; label: string; emoji: string; color: string; quote: string }[] = [
  { type: 'happy', label: 'Happy', emoji: '✨', color: '#ff69b4', quote: 'Your happiness radiates, Senpai! Let’s keep this gentle momentum going! (✿◠‿◠)💕' },
  { type: 'excited', label: 'Excited', emoji: '🎉', color: '#f43f5e', quote: 'EEE! That spark in you is amazing! Let’s channel that energy into what you love! ⚡' },
  { type: 'calm', label: 'Calm', emoji: '🌸', color: '#10b981', quote: 'A peaceful heart is so precious. Breathe in the tranquility of this moment. (｡•̀ᴗ-)✧' },
  { type: 'okay', label: 'Okay', emoji: '🌱', color: '#06b6d4', quote: 'Being just okay is completely fine! One step at a time is still moving forward. ♡' },
  { type: 'tired', label: 'Tired', emoji: '🌙', color: '#8b5cf6', quote: 'You’ve worked hard. Please remember that resting is productive too. Todo-chan is proud of you! 💤' },
  { type: 'stressed', label: 'Stressed', emoji: '🫧', color: '#f59e0b', quote: 'It feels heavy right now, but you don’t have to solve everything today. Let’s unburden your mind. ♡' },
  { type: 'sad', label: 'Sad', emoji: '🌧️', color: '#6366f1', quote: 'I’m right beside you. It’s okay to feel sad. You are safe and worthy just as you are. 💕' },
  { type: 'anxious', label: 'Anxious', emoji: '🌊', color: '#eab308', quote: 'Inhale peace, exhale tension. The future hasn’t arrived yet; let’s stay right here. 🌸' },
  { type: 'overwhelmed', label: 'Overwhelmed', emoji: '🍃', color: '#ef4444', quote: 'Pause everything for one minute. Close your eyes. Let’s choose just one small thing. ♡' },
  { type: 'frustrated', label: 'Frustrated', emoji: '⚡', color: '#ec4899', quote: 'It’s natural to feel frustrated when things don’t align. Give yourself grace to reset. (｡•́︿•̀｡)' },
];

const presetCareTasks = [
  { title: 'Drink a glass of water', category: 'hydration', icon: Droplets },
  { title: 'Eat a nourishing meal', category: 'nutrition', icon: Apple },
  { title: 'Take a 10-minute break', category: 'break', icon: Coffee },
  { title: 'Stretch shoulders & neck', category: 'movement', icon: Activity },
  { title: 'Take a brief walk outside', category: 'movement', icon: Footprints },
  { title: 'Step into sunlight', category: 'rest', icon: Sun },
];

export const EmotionTrackerModal: React.FC<EmotionTrackerModalProps> = ({
  isOpen,
  onClose,
  onAddCareTaskToPlanner,
  onTaskAddedToast,
  initialMood,
}) => {
  const { user } = useAuth();
  const { isDarkMode, themeColor } = useTheme();

  const [activeTab, setActiveTab] = useState<'tracker' | 'care' | 'history' | 'game'>('tracker');
  const [selectedMood, setSelectedMood] = useState<MoodType>(initialMood || 'happy');
  const [intensity, setIntensity] = useState<number>(3);

  // Reflection questions
  const [daySummary, setDaySummary] = useState('');
  const [moodCause, setMoodCause] = useState('');
  const [proudOf, setProudOf] = useState('');
  const [needsNow, setNeedsNow] = useState('');
  const [tomorrowBetter, setTomorrowBetter] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Care tasks state & duplicate-prevention state
  const [careTasks, setCareTasks] = useState<CareTask[]>([]);
  const [customCareTitle, setCustomCareTitle] = useState('');
  const [newCareToPlanner, setNewCareToPlanner] = useState(false);
  const [recentlyAddedTitles, setRecentlyAddedTitles] = useState<{ [title: string]: boolean }>({});
  const [taskAddedBanner, setTaskAddedBanner] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<WellnessCheckin[]>([]);

  // Listen to user's private wellness check-ins
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'wellness_checkins'), where('userId', '==', user.id));
    const unsub = onSnapshot(q, (snapshot) => {
      const records: WellnessCheckin[] = [];
      snapshot.forEach((d) => records.push({ id: d.id, ...(d.data() as any) }));
      records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistory(records);
    });
    return () => unsub();
  }, [user]);

  // Listen to user's care tasks
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'care_tasks'), where('userId', '==', user.id));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: CareTask[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCareTasks(list);
    });
    return () => unsub();
  }, [user]);

  if (!isOpen || !user) return null;

  const currentMoodObj = moodOptions.find((m) => m.type === selectedMood) || moodOptions[0];

  const handleSaveCheckIn = async () => {
    setIsSaving(true);
    const checkinId = 'well_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const record: WellnessCheckin = {
      id: checkinId,
      userId: user.id,
      mood: selectedMood,
      intensity,
      reflection: {
        day: daySummary.trim() || undefined,
        cause: moodCause.trim() || undefined,
        proudOf: proudOf.trim() || undefined,
        needsNow: needsNow.trim() || undefined,
        tomorrowBetter: tomorrowBetter.trim() || undefined,
      },
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'wellness_checkins', checkinId), record);
      setSaveSuccess(true);
      if (onTaskAddedToast) {
        onTaskAddedToast(`Daily Mood (${currentMoodObj.label})`, 'Calendar (Private)');
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save checkin:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCheckIn = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'wellness_checkins', id));
    } catch (e) {
      console.error('Failed to delete checkin:', e);
    }
  };

  const handleAddCareTask = async (title: string, category: any = 'custom', addToMainPlanner = false) => {
    if (!title.trim() || recentlyAddedTitles[title.trim()]) return;
    const cleanTitle = title.trim();

    // Prevent nuisance duplicate adds: mark as recently added for 3 seconds
    setRecentlyAddedTitles((prev) => ({ ...prev, [cleanTitle]: true }));
    setTimeout(() => {
      setRecentlyAddedTitles((prev) => {
        const copy = { ...prev };
        delete copy[cleanTitle];
        return copy;
      });
    }, 3500);

    const careId = 'care_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newCare: CareTask = {
      id: careId,
      userId: user.id,
      title: cleanTitle,
      category,
      isCompleted: false,
      isPrivate: !addToMainPlanner,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'care_tasks', careId), newCare);

      // If user toggled or requested to add to main planner
      if (addToMainPlanner && onAddCareTaskToPlanner) {
        await onAddCareTaskToPlanner({
          title: `🌸 Care: ${cleanTitle}`,
          description: `Self-care task from Todo-chan Wellness tracker`,
          matrixQuadrant: 'q2', // Important, not urgent (self care)
          importance: 8,
          urgency: 4,
          isCareTask: true,
          dueDate: new Date().toISOString().split('T')[0],
        });
      }

      const dest = addToMainPlanner ? 'Main Planner Calendar' : 'Care Tasks';
      setTaskAddedBanner(`✨ Added "${cleanTitle}" to ${dest}! Todo-chan is cheering you on!`);
      if (onTaskAddedToast) {
        onTaskAddedToast(cleanTitle, dest);
      }
      setTimeout(() => setTaskAddedBanner(null), 3500);

      setCustomCareTitle('');
    } catch (e) {
      console.error('Failed to add care task:', e);
    }
  };

  const handleToggleCareTask = async (task: CareTask) => {
    try {
      await updateDoc(doc(db, 'care_tasks', task.id), {
        isCompleted: !task.isCompleted,
      });
    } catch (e) {
      console.error('Failed to toggle care task:', e);
    }
  };

  const handleDeleteCareTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'care_tasks', id));
    } catch (e) {
      console.error('Failed to delete care task:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 15 }}
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] transition-colors ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#E6DFD3] text-stone-900'
        }`}
        style={{
          boxShadow: 'var(--neon-card-glow)',
          borderColor: 'var(--accent-color)',
        }}
      >
        {/* Top Header with Mascot & Title */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl bg-black/40 border p-1 shrink-0 flex items-center justify-center filter drop-shadow-[0_0_10px_#ff69b4]"
              style={{ borderColor: '#ffb6c1' }}
            >
              <img
                src={todochanMascotImg}
                alt="Todo-chan"
                className="w-full h-full object-contain filter drop-shadow-[0_0_6px_#ffb6c1]"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-theme">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Todo-chan Surprise Wellness Easter Egg! ✨</span>
                <Heart className="w-3 h-3 fill-current text-pink-400" />
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Emotional Wellness & Grounding Quest
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition ${
              isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Added Confirmation Banner */}
        {taskAddedBanner && (
          <div className="px-5 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{taskAddedBanner}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 dark:border-slate-800 px-4 pt-2 gap-2 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'tracker'
                ? 'border-theme text-theme'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-white'
            }`}
          >
            <Smile className="w-4 h-4" />
            <span>Emotion Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('game')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'game'
                ? 'border-theme text-theme'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-pink-400" />
            <span>Grounding Game 🌸🎮</span>
          </button>

          <button
            onClick={() => setActiveTab('care')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'care'
                ? 'border-theme text-theme'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Care Tasks ({careTasks.filter((c) => !c.isCompleted).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'history'
                ? 'border-theme text-theme'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Private History ({history.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'game' && (
            <MindfulnessGroundingGame
              isOpen={true}
              onClose={() => setActiveTab('tracker')}
              onTaskAddedToast={onTaskAddedToast}
            />
          )}

          {activeTab === 'tracker' && (
            <div className="space-y-6">
              {/* Mood Selection Grid */}
              <div className="space-y-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                  Select Your Current Emotion:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {moodOptions.map((mood) => {
                    const isSelected = selectedMood === mood.type;
                    return (
                      <button
                        key={mood.type}
                        type="button"
                        onClick={() => setSelectedMood(mood.type)}
                        className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? 'bg-theme/20 border-theme text-theme scale-105 font-bold shadow-md'
                            : isDarkMode
                            ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                            : 'bg-stone-50 border-[#E6DFD3] hover:bg-stone-100 text-stone-700'
                        }`}
                        style={isSelected ? { borderColor: mood.color, boxShadow: `0 0 12px ${mood.color}40` } : undefined}
                      >
                        <span className="text-2xl">{mood.emoji}</span>
                        <span className="text-xs">{mood.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Todo-chan Caring Quote */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
                  isDarkMode ? 'bg-slate-950/80' : 'bg-pink-500/5'
                }`}
                style={{
                  borderColor: currentMoodObj.color,
                  boxShadow: `0 0 15px ${currentMoodObj.color}25`,
                }}
              >
                <div className="text-2xl">{currentMoodObj.emoji}</div>
                <p className="text-xs font-semibold leading-relaxed" style={{ color: currentMoodObj.color }}>
                  {currentMoodObj.quote}
                </p>
              </div>

              {/* Emotion Intensity Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-stone-600'}>
                    Emotion Intensity (1 - 5):
                  </span>
                  <span className="font-mono font-bold text-theme">Level {intensity} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer"
                />
              </div>

              {/* Optional Daily Reflection Prompts */}
              <div className="space-y-3 pt-2 border-t border-stone-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-theme">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Optional Daily Reflections</span>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-stone-600'}`}>
                    How was your day?
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Reflect on today..."
                    value={daySummary}
                    onChange={(e) => setDaySummary(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs app-input resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-stone-600'}`}>
                      What is one thing you are proud of today?
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Woke up early, finished task..."
                      value={proudOf}
                      onChange={(e) => setProudOf(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl text-xs app-input"
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-stone-600'}`}>
                      What do you need right now?
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. A hot shower, peaceful nap, tea..."
                      value={needsNow}
                      onChange={(e) => setNeedsNow(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl text-xs app-input"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-stone-600'}`}>
                    What could make tomorrow a little better?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Preparing my clothes tonight, saying kind words..."
                    value={tomorrowBetter}
                    onChange={(e) => setTomorrowBetter(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-xs app-input"
                  />
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Check-in saved to your private wellness journal and Calendar! ♡</span>
                </div>
              )}

              {/* Save Check-in Button */}
              <button
                type="button"
                onClick={handleSaveCheckIn}
                disabled={isSaving}
                className="w-full btn-theme-gradient py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition shadow-md"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>{isSaving ? 'Saving Check-in...' : 'Save Check-In to My Private Calendar Record 🔒'}</span>
              </button>
            </div>
          )}

          {activeTab === 'care' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-theme">
                    Personal Mental & Physical Health Tasks
                  </h3>
                  <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                    Gentle self-care tasks you can check off or schedule onto your planner
                  </p>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                  Quick Add Suggested Care Tasks
                </span>
                <div className="flex flex-wrap gap-2">
                  {presetCareTasks.map((p) => {
                    const Icon = p.icon;
                    const isAdded = recentlyAddedTitles[p.title];
                    return (
                      <button
                        key={p.title}
                        onClick={() => handleAddCareTask(p.title, p.category, false)}
                        disabled={isAdded}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition active:scale-95 ${
                          isAdded
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 cursor-default'
                            : isDarkMode
                            ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-200'
                            : 'bg-stone-50 hover:bg-stone-100 border-[#E6DFD3] text-stone-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-theme" />
                        <span>{p.title}</span>
                        {isAdded ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Plus className="w-3 h-3 text-stone-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Care Task Input */}
              <div className="p-3.5 rounded-2xl border app-subcard space-y-2">
                <span className="text-[11px] font-bold">Add Custom Care Task</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Listen to ambient music, 5-min meditation..."
                    value={customCareTitle}
                    onChange={(e) => setCustomCareTitle(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl text-xs app-input"
                  />
                  <button
                    onClick={() => handleAddCareTask(customCareTitle, 'custom', newCareToPlanner)}
                    disabled={!customCareTitle.trim()}
                    className="btn-theme-primary px-3 py-1.5 rounded-xl text-xs font-bold text-white shrink-0 active:scale-95 transition"
                  >
                    Add Task
                  </button>
                </div>
                <label className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-slate-400 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newCareToPlanner}
                    onChange={(e) => setNewCareToPlanner(e.target.checked)}
                    className="rounded text-theme"
                  />
                  <span>Also sync to main Planner Calendar & Eisenhower Matrix (Quadrant 2)</span>
                </label>
              </div>

              {/* Active Care Tasks List */}
              <div className="space-y-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                  Your Care Tasks
                </span>
                {careTasks.length === 0 ? (
                  <p className={`text-xs py-4 text-center ${isDarkMode ? 'text-slate-500' : 'text-stone-400'}`}>
                    No care tasks yet! Tap any quick suggestion above to get started. 🌸
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {careTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                          task.isCompleted ? 'opacity-60 bg-emerald-500/5' : ''
                        } ${isDarkMode ? 'bg-slate-800/40 border-slate-700/80' : 'bg-white border-[#E6DFD3]'}`}
                      >
                        <button
                          onClick={() => handleToggleCareTask(task)}
                          className="flex items-center gap-2.5 text-left flex-1"
                        >
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition ${
                              task.isCompleted
                                ? 'bg-theme border-theme text-white'
                                : 'border-stone-300 dark:border-slate-600'
                            }`}
                          >
                            {task.isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <span className={`text-xs font-medium ${task.isCompleted ? 'line-through text-stone-400' : ''}`}>
                            {task.title}
                          </span>
                        </button>

                        <button
                          onClick={() => handleDeleteCareTask(task.id)}
                          className="p-1 rounded text-stone-400 hover:text-red-400 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                  Private Emotional History
                </span>
                <span className="text-[10px] text-theme font-semibold">Only visible to you 🔒</span>
              </div>

              {history.length === 0 ? (
                <p className={`text-xs py-6 text-center ${isDarkMode ? 'text-slate-500' : 'text-stone-400'}`}>
                  No check-in history yet. Save your first check-in in the Emotion Tracker! ♡
                </p>
              ) : (
                <div className="space-y-2.5">
                  {history.map((item) => {
                    const moodObj = moodOptions.find((m) => m.type === item.mood) || moodOptions[0];
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border app-subcard space-y-2 transition`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{moodObj.emoji}</span>
                            <div>
                              <span className="text-xs font-bold capitalize" style={{ color: moodObj.color }}>
                                {moodObj.label} (Intensity: {item.intensity}/5)
                              </span>
                              <span className="text-[10px] text-stone-400 block font-mono">
                                {new Date(item.createdAt).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteCheckIn(item.id)}
                            className="p-1 text-stone-400 hover:text-red-400 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.reflection && (
                          <div className="text-[11px] space-y-1 pt-1 border-t border-stone-200/50 dark:border-slate-800">
                            {item.reflection.day && <p><strong>Day:</strong> {item.reflection.day}</p>}
                            {item.reflection.proudOf && <p><strong>Proud of:</strong> {item.reflection.proudOf}</p>}
                            {item.reflection.needsNow && <p><strong>Needed:</strong> {item.reflection.needsNow}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
