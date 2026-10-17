import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Heart,
  ArrowRight,
  Layers,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { UnorganizedTask } from '../../types/index.ts';
import { db } from '../../lib/firebase.ts';
import { setDoc, doc, deleteDoc } from 'firebase/firestore';
import todochanMascotImg from '../../assets/images/todochan_ethereal_fairy_neon.png';

interface TalkToTodoChanProps {
  onOpenUnorganizedView?: () => void;
  onOrganizeTask?: (task: UnorganizedTask) => void;
  onSaveUnorganizedTask?: (task: UnorganizedTask) => Promise<void>;
  onTaskAddedToast?: (title: string, destination: string) => void;
  unorganizedTasks?: UnorganizedTask[];
}

interface ChatBubble {
  id: string;
  sender: 'user' | 'todochan';
  text: string;
  taskId?: string;
  createdAt: string;
}

const PREDEFINED_REPLIES = [
  "Hehe, I've saved that for you! We can organize it later ♡ (✿◠‿◠)",
  "Got it, Senpai! Saved safely in your Unorganized Tasks! ✨💕",
  "Yay! Thought captured! Feel free to keep brain-dumping anything! 🌸",
  "Stored away in your planner pocket! We'll sort it out whenever you're ready! (｡•̀ᴗ-)✧",
  "Don't worry about which list it belongs to yet—Todo-chan has got it! 💕",
];

export const TalkToTodoChan: React.FC<TalkToTodoChanProps> = ({
  onOpenUnorganizedView,
  onOrganizeTask,
  onSaveUnorganizedTask,
  onTaskAddedToast,
  unorganizedTasks = [],
}) => {
  const { user } = useAuth();
  const { isDarkMode, themeColor, isNeonMode } = useTheme();

  const [input, setInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showQuickReview, setShowQuickReview] = useState(false);
  const [bubbles, setBubbles] = useState<ChatBubble[]>([
    {
      id: 'welcome',
      sender: 'todochan',
      text: "Konnichiwa! This is Talk to Todo-chan—your personal quick task-capture space! (✿◠‿◠)✨ Just type any work, goal, or thought (e.g. 'Finish physics lab record tomorrow'), and I'll save it to your Unorganized Tasks so you can review and organize it later! 💕",
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [bubbles]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || !user || isSaving) return;

    setInput('');
    setIsSaving(true);

    const nowIso = new Date().toISOString();
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const cleanRandom = Math.random().toString(36).substring(2, 8);
    const taskId = 'unorg_' + Date.now() + '_' + cleanRandom;

    // 1. Add user bubble to local chat UI
    setBubbles((prev) => [
      ...prev,
      {
        id: 'usr_' + Date.now(),
        sender: 'user',
        text,
        createdAt: timeFormatted,
      },
    ]);

    // 2. Prepare unorganized task record
    const unorgTask: UnorganizedTask = {
      id: taskId,
      text,
      userId: user.id,
      isCompleted: false,
      isOrganized: false,
      createdAt: nowIso,
    };

    try {
      // Direct Firestore write
      await setDoc(doc(db, 'unorganized_tasks', taskId), unorgTask);

      // LocalStorage backup
      try {
        const stored = JSON.parse(localStorage.getItem(`unorg_tasks_${user.id}`) || '[]');
        stored.unshift(unorgTask);
        localStorage.setItem(`unorg_tasks_${user.id}`, JSON.stringify(stored));
      } catch {}

      // App-level state update
      if (onSaveUnorganizedTask) {
        await onSaveUnorganizedTask(unorgTask);
      }

      // Display the requested Task Added toast!
      if (onTaskAddedToast) {
        onTaskAddedToast(text, 'Unorganized Tasks Inbox');
      }

      // 3. Todo-chan responds with friendly anime message
      const randomReply = PREDEFINED_REPLIES[Math.floor(Math.random() * PREDEFINED_REPLIES.length)];
      setBubbles((prev) => [
        ...prev,
        {
          id: 'todo_' + Date.now(),
          sender: 'todochan',
          text: `${randomReply} (Saved to Unorganized Tasks!)`,
          taskId,
          createdAt: timeFormatted,
        },
      ]);
    } catch (err) {
      console.error('Failed to save unorganized task:', err);
      // Still notify user locally so nothing is lost
      if (onSaveUnorganizedTask) {
        await onSaveUnorganizedTask(unorgTask);
      }
      if (onTaskAddedToast) {
        onTaskAddedToast(text, 'Unorganized Tasks Inbox (Local)');
      }

      setBubbles((prev) => [
        ...prev,
        {
          id: 'todo_' + Date.now(),
          sender: 'todochan',
          text: `Saved "${text}" to your local unorganized inbox, Senpai! ✨`,
          taskId,
          createdAt: timeFormatted,
        },
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'unorganized_tasks', id));
    } catch (e) {
      console.error('Failed to delete unorganized task:', e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`rounded-3xl border shadow-xl flex flex-col h-[520px] overflow-hidden transition-colors ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-[#E6DFD3]'
      }`}
      style={{
        boxShadow: 'var(--neon-card-glow)',
        borderColor: 'rgba(var(--accent-rgb), 0.4)',
      }}
    >
      {/* Header */}
      <div className="p-3.5 sm:p-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl bg-black/40 border p-1 shrink-0 flex items-center justify-center filter drop-shadow-[0_0_10px_#ff69b4]"
            style={{ borderColor: '#ffb6c1' }}
          >
            <img src={todochanMascotImg} alt="Todo-chan" className="w-full h-full object-contain filter drop-shadow-[0_0_6px_#ffb6c1]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-theme uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-pink-400" />
              <span>Talk to Todo-chan</span>
              <Heart className="w-3 h-3 fill-current text-pink-400" />
            </div>
            <h3 className="text-xs sm:text-sm font-black">Personal Task-Capture Space</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Review Drawer Toggle */}
          <button
            onClick={() => setShowQuickReview(!showQuickReview)}
            className={`btn-theme-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              showQuickReview ? 'bg-theme text-white border-theme' : ''
            }`}
            title="Review your unorganized tasks right here"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Review Inbox ({unorganizedTasks.length})</span>
            {showQuickReview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {onOpenUnorganizedView && (
            <button
              onClick={onOpenUnorganizedView}
              className="p-1.5 rounded-xl border border-stone-200 dark:border-slate-800 text-stone-500 hover:text-theme transition"
              title="Open full page Unorganized Tasks View"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Quick Review Drawer inside Chat */}
      {showQuickReview && (
        <div className="p-3 border-b border-stone-200 dark:border-slate-800 bg-pink-500/5 max-h-48 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Your Unorganized Tasks ({unorganizedTasks.length})</span>
            </span>
            {onOpenUnorganizedView && (
              <button
                onClick={onOpenUnorganizedView}
                className="text-[10px] text-theme font-bold hover:underline flex items-center gap-0.5"
              >
                <span>Full Organize Screen</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {unorganizedTasks.length === 0 ? (
            <p className="text-xs text-stone-400 dark:text-slate-500 text-center py-2">
              No unorganized tasks right now! Type any thought below to capture it. ✨
            </p>
          ) : (
            <div className="space-y-1.5">
              {unorganizedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E6DFD3]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{task.text}</p>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {new Date(task.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onOrganizeTask && (
                      <button
                        onClick={() => onOrganizeTask(task)}
                        className="btn-theme-gradient px-2 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1"
                      >
                        <span>Organize</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-stone-400 hover:text-rose-500 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conversation Area */}
      <div
        className={`flex-1 p-4 overflow-y-auto space-y-3.5 ${
          isDarkMode ? 'bg-slate-950/70' : 'bg-[#FAF7F2]'
        }`}
      >
        {bubbles.map((b) => (
          <div
            key={b.id}
            className={`flex flex-col ${b.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
              {b.sender === 'todochan' && (
                <div
                  className="w-8 h-8 rounded-xl bg-black/40 border shrink-0 flex items-center justify-center p-0.5 filter drop-shadow-[0_0_8px_#ff69b4]"
                  style={{ borderColor: '#ffb6c1' }}
                >
                  <img src={todochanMascotImg} alt="Todo-chan" className="w-full h-full object-contain filter drop-shadow-[0_0_4px_#ffb6c1]" />
                </div>
              )}

              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed transition-all ${
                  b.sender === 'user'
                    ? 'btn-theme-gradient text-white rounded-br-xs shadow-md'
                    : isDarkMode
                    ? 'bg-slate-900 border border-pink-400/40 text-slate-100 rounded-bl-xs shadow-md'
                    : 'bg-white border border-[#E6DFD3] text-stone-900 rounded-bl-xs shadow-xs'
                }`}
                style={
                  b.sender === 'todochan'
                    ? {
                        borderColor: 'rgba(var(--accent-rgb), 0.45)',
                        boxShadow: '0 0 14px rgba(var(--accent-rgb), 0.15)',
                      }
                    : undefined
                }
              >
                <p className="font-medium whitespace-pre-wrap">{b.text}</p>
                <div className="flex items-center justify-between gap-3 mt-1.5 text-[10px] opacity-75">
                  <span className="font-mono">{b.createdAt}</span>
                  {b.taskId && (
                    <button
                      onClick={() => setShowQuickReview(true)}
                      className="text-theme font-bold flex items-center gap-1 hover:underline"
                    >
                      <CheckCircle2 className="w-3 h-3 text-pink-400" />
                      <span>Review in Unorganized ({unorganizedTasks.length})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-stone-200 dark:border-slate-800 flex items-end gap-2 bg-transparent"
      >
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type any task or brain-dump (e.g. 'Finish physics lab record tomorrow')..."
          className="flex-1 p-2.5 rounded-xl text-xs app-input resize-none max-h-24 leading-snug"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSaving}
          className="btn-theme-gradient p-2.5 rounded-xl text-white font-bold flex items-center justify-center shrink-0 active:scale-95 transition disabled:opacity-50 shadow-md"
          title="Save task to Unorganized Tasks"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
