import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  Sliders,
  X,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { UnorganizedTask, TodoList, Task, MatrixQuadrant } from '../../types/index.ts';
import { db } from '../../lib/firebase.ts';
import { deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';

interface UnorganizedTasksViewProps {
  unorganizedTasks: UnorganizedTask[];
  lists: TodoList[];
  onTaskOrganized: (taskData: Partial<Task>) => Promise<void>;
  onClose?: () => void;
}

export const UnorganizedTasksView: React.FC<UnorganizedTasksViewProps> = ({
  unorganizedTasks,
  lists,
  onTaskOrganized,
  onClose,
}) => {
  const { user } = useAuth();
  const { isDarkMode, themeColor } = useTheme();

  const [selectedTask, setSelectedTask] = useState<UnorganizedTask | null>(null);
  const [organizeTitle, setOrganizeTitle] = useState('');
  const [targetListId, setTargetListId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [importance, setImportance] = useState<number>(7);
  const [urgency, setUrgency] = useState<number>(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openOrganizeModal = (task: UnorganizedTask) => {
    setSelectedTask(task);
    setOrganizeTitle(task.text);
    setTargetListId(lists[0]?.id || '');
    setDueDate(task.scheduledDate || new Date().toISOString().split('T')[0]);
    setImportance(7);
    setUrgency(7);
  };

  const handleToggleComplete = async (task: UnorganizedTask) => {
    try {
      await updateDoc(doc(db, 'unorganized_tasks', task.id), {
        isCompleted: !task.isCompleted,
      });
    } catch (e) {
      console.error('Failed to toggle task:', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'unorganized_tasks', id));
    } catch (e) {
      console.error('Failed to delete unorganized task:', e);
    }
  };

  const handleConfirmMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !organizeTitle.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);

    let quadrant: MatrixQuadrant = 'q2';
    if (urgency >= 7 && importance >= 7) quadrant = 'q1';
    else if (importance >= 7) quadrant = 'q2';
    else if (urgency >= 7) quadrant = 'q3';
    else quadrant = 'q4';

    try {
      // 1. Add as organized task into destination list
      await onTaskOrganized({
        listId: targetListId || lists[0]?.id,
        title: organizeTitle.trim(),
        dueDate: dueDate || undefined,
        importance,
        urgency,
        matrixQuadrant: quadrant,
        status: selectedTask.isCompleted ? 'completed' : 'todo',
        notes: selectedTask.notes,
        createdAt: selectedTask.createdAt,
      });

      // 2. Remove from unorganized_tasks collection once move succeeds
      await deleteDoc(doc(db, 'unorganized_tasks', selectedTask.id));

      setSelectedTask(null);
    } catch (err) {
      console.error('Failed to organize task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unorganized Task Inbox ({unorganizedTasks.length})</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Quick Capture Feed</h2>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
            Thoughts and tasks captured via "Talk to Todo-chan". Move them into lists whenever ready!
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition ${
              isDarkMode ? 'border-slate-800 text-slate-400 hover:text-white' : 'border-[#E6DFD3] text-stone-500 hover:text-stone-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Task List */}
      {unorganizedTasks.length === 0 ? (
        <div
          className={`p-8 rounded-3xl border text-center space-y-2 app-subcard`}
        >
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-pink-500/10 text-theme border border-pink-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold">No unorganized tasks right now!</h3>
          <p className={`text-xs max-w-sm mx-auto ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
            All your captured thoughts have been organized into your workspaces. Type anything in Talk to Todo-chan to add more!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {unorganizedTasks.map((task) => {
            const dateStr = new Date(task.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={task.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                  task.isCompleted ? 'opacity-60 bg-emerald-500/5' : ''
                } ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-[#E6DFD3]'}`}
                style={{
                  boxShadow: 'var(--neon-card-glow)',
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition ${
                      task.isCompleted
                        ? 'bg-theme border-theme text-white'
                        : 'border-stone-300 dark:border-slate-600 hover:border-pink-400'
                    }`}
                  >
                    {task.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-semibold leading-snug break-words ${
                        task.isCompleted ? 'line-through text-stone-400 dark:text-slate-500' : ''
                      }`}
                    >
                      {task.text}
                    </p>
                    <span className="text-[10px] text-stone-400 dark:text-slate-500 font-mono">
                      Captured {dateStr}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openOrganizeModal(task)}
                    className="btn-theme-gradient py-1.5 px-3 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Organize</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 transition"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Organize Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl relative transition-colors ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#E6DFD3] text-stone-900'
            }`}
            style={{
              boxShadow: 'var(--neon-card-glow)',
              borderColor: 'var(--accent-color)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-theme" />
                <h3 className="text-base font-black">Move to Workspace</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmMove} className="space-y-4">
              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={organizeTitle}
                  onChange={(e) => setOrganizeTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs app-input"
                />
              </div>

              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                  Destination To-Do List / Workspace
                </label>
                <select
                  value={targetListId}
                  onChange={(e) => setTargetListId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs app-input cursor-pointer"
                >
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                  Scheduled Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs app-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span>Urgency</span>
                    <span className="font-mono text-theme">{urgency}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={urgency}
                    onChange={(e) => setUrgency(Number(e.target.value))}
                    className="w-full accent-pink-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span>Importance</span>
                    <span className="font-mono text-theme">{importance}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={importance}
                    onChange={(e) => setImportance(Number(e.target.value))}
                    className="w-full accent-pink-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-theme-gradient px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md active:scale-95 transition"
                >
                  <span>{isSubmitting ? 'Organizing...' : 'Save & Move to List'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
