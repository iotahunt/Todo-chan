import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Sparkles,
  Sliders,
  Tag,
  User,
  FileText,
  Lock,
  Globe,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { Task, MatrixQuadrant, TaskStatus, TodoList } from '../../types/index.ts';
import { useTheme } from '../../context/ThemeContext.tsx';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => Promise<void>;
  initialTask?: Task | null;
  listId: string;
  lists?: TodoList[];
  currentUsername: string;
  eisenhowerThreshold?: number;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  listId,
  lists = [],
  currentUsername,
  eisenhowerThreshold = 7,
}) => {
  const { themeColor, isDarkMode, isNeonMode } = useTheme();
  const [selectedListId, setSelectedListId] = useState(listId || (lists[0]?.id || ''));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedBy, setAssignedBy] = useState(currentUsername);
  const [assignedTo, setAssignedTo] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [importance, setImportance] = useState(5);
  const [urgency, setUrgency] = useState(5);
  const [matrixQuadrant, setMatrixQuadrant] = useState<MatrixQuadrant>('q2');
  const [matrixOverride, setMatrixOverride] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [color, setColor] = useState('#ff69b4');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [notes, setNotes] = useState('');
  const [notesPrivate, setNotesPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculate quadrant when importance/urgency change (unless overridden)
  useEffect(() => {
    if (!matrixOverride) {
      const isImportant = importance >= eisenhowerThreshold;
      const isUrgent = urgency >= eisenhowerThreshold;

      if (isImportant && isUrgent) {
        setMatrixQuadrant('q1'); // Do First
      } else if (isImportant && !isUrgent) {
        setMatrixQuadrant('q2'); // Schedule
      } else if (!isImportant && isUrgent) {
        setMatrixQuadrant('q3'); // Delegate
      } else {
        setMatrixQuadrant('q4'); // Eliminate
      }
    }
  }, [importance, urgency, matrixOverride, eisenhowerThreshold]);

  useEffect(() => {
    if (listId) setSelectedListId(listId);
    else if (lists && lists.length > 0 && !selectedListId) setSelectedListId(lists[0].id);
  }, [listId, lists, isOpen]);

  useEffect(() => {
    if (initialTask) {
      if (initialTask.listId) setSelectedListId(initialTask.listId);
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setAssignedBy(initialTask.assignedBy || currentUsername);
      setAssignedTo(initialTask.assignedTo ? initialTask.assignedTo.join(', ') : '');
      setStartDate(initialTask.startDate || '');
      setDueDate(initialTask.dueDate || '');
      setStartTime(initialTask.startTime || '');
      setDueTime(initialTask.dueTime || '');
      setIsAllDay(initialTask.isAllDay ?? true);
      setImportance(initialTask.importance ?? 5);
      setUrgency(initialTask.urgency ?? 5);
      setMatrixQuadrant(initialTask.matrixQuadrant || 'q2');
      setMatrixOverride(initialTask.matrixOverride ?? false);
      setDurationMinutes(initialTask.durationMinutes ?? 30);
      setColor(initialTask.color || '#ff69b4');
      setStatus(initialTask.status || 'todo');
      setNotes(initialTask.notes || '');
      setNotesPrivate(initialTask.notesPrivate ?? false);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setAssignedBy(currentUsername);
      setAssignedTo(currentUsername);
      setStartDate(today);
      setDueDate(today);
      setStartTime('10:00');
      setDueTime('11:00');
      setIsAllDay(false);
      setImportance(7);
      setUrgency(7);
      setMatrixOverride(false);
      setDurationMinutes(60);
      setColor('#ff69b4');
      setStatus('todo');
      setNotes('');
      setNotesPrivate(false);
    }
    setError(null);
  }, [initialTask, currentUsername, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    // Target list is selected list or listId or first existing list
    const targetList = selectedListId || listId || (lists && lists[0]?.id) || 'default_list';

    setIsSubmitting(true);
    setError(null);

    try {
      const assignees = assignedTo
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await onSave({
        listId: targetList,
        title: title.trim(),
        description: description.trim(),
        assignedBy: assignedBy.trim(),
        assignedTo: assignees,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        startTime: !isAllDay ? startTime || undefined : undefined,
        dueTime: !isAllDay ? dueTime || undefined : undefined,
        isAllDay,
        importance,
        urgency,
        matrixQuadrant,
        matrixOverride,
        durationMinutes,
        color,
        status,
        notes: notes.trim(),
        notesPrivate,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quadrantLabels: Record<MatrixQuadrant, { name: string; desc: string; color: string }> = {
    q1: { name: 'Do First', desc: 'Urgent & Important', color: 'text-rose-500 border-rose-500/40 bg-rose-500/10' },
    q2: { name: 'Schedule', desc: 'Important, Not Urgent', color: 'text-sky-500 border-sky-500/40 bg-sky-500/10' },
    q3: { name: 'Delegate', desc: 'Urgent, Not Important', color: 'text-amber-500 border-amber-500/40 bg-amber-500/10' },
    q4: { name: 'Eliminate', desc: 'Neither Urgent Nor Important', color: 'text-slate-500 border-slate-500/30 bg-slate-500/10' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl my-8 transition-colors ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-[#E6DFD3] text-stone-900'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-inherit">
          <h2
            className={`text-base font-bold flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-stone-900'
            }`}
          >
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span>{initialTask ? 'Edit Task' : 'Create New Task'}</span>
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition ${
              isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-stone-400 hover:text-stone-900 hover:bg-[#F4EFE6]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Target To-Do List Dropdown */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between ${
                isDarkMode ? 'text-slate-300' : 'text-stone-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-pink-500" />
                <span>Assign to To-Do List</span>
              </span>
              <span className="text-[10px] text-pink-500 font-normal">
                Tasks belong inside to-do lists
              </span>
            </label>
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className={`w-full rounded-xl px-3 py-2 text-xs font-medium cursor-pointer border transition focus:outline-hidden ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-700 text-white'
                  : 'bg-[#FAF7F2] border-[#D6CEC0] text-stone-900'
              }`}
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  📋 {l.name} (ID: {l.listId})
                </option>
              ))}
              {lists.length === 0 && (
                <option value="default_list">📋 Primary Workspace (Auto-create)</option>
              )}
            </select>
          </div>

          {/* Title */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
                isDarkMode ? 'text-slate-300' : 'text-stone-600'
              }`}
            >
              Task Title <span className="text-pink-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish Calculus Problem Set"
              required
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-medium border focus:outline-hidden transition ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-[#FAF7F2] border-[#D6CEC0] text-stone-900 placeholder-stone-400'
              }`}
            />
          </div>

          {/* Description */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
                isDarkMode ? 'text-slate-300' : 'text-stone-600'
              }`}
            >
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add extra context, steps, or notes..."
              className={`w-full rounded-xl px-3.5 py-2 text-xs border focus:outline-hidden transition resize-none ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-[#FAF7F2] border-[#D6CEC0] text-stone-900 placeholder-stone-400'
              }`}
            />
          </div>

          {/* Dates & Times */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border ${
              isDarkMode
                ? 'bg-slate-950/40 border-slate-800'
                : 'bg-[#FAF7F2] border-[#E6DFD3]'
            }`}
          >
            <div>
              <label
                className={`block text-[11px] font-semibold mb-1 flex items-center gap-1.5 ${
                  isDarkMode ? 'text-slate-400' : 'text-stone-500'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-pink-500" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full rounded-lg px-2.5 py-1.5 text-xs border ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-[#D6CEC0] text-stone-900'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  className={`text-[11px] font-semibold flex items-center gap-1.5 ${
                    isDarkMode ? 'text-slate-400' : 'text-stone-500'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Time / Duration</span>
                </label>
                <label className="text-[10px] flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="rounded border-slate-700 text-pink-500"
                  />
                  <span>All Day</span>
                </label>
              </div>

              {isAllDay ? (
                <div
                  className={`text-xs p-2 rounded-lg text-center ${
                    isDarkMode
                      ? 'bg-slate-900/60 text-slate-400'
                      : 'bg-white text-stone-500'
                  }`}
                >
                  All day task (No specific hours)
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`rounded-lg px-2 py-1 text-xs border ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-[#D6CEC0] text-stone-900'
                    }`}
                  />
                  <span className="text-xs text-stone-400">to</span>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className={`rounded-lg px-2 py-1 text-xs border ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-[#D6CEC0] text-stone-900'
                    }`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Importance & Urgency Sliders */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl border ${
              isDarkMode
                ? 'bg-slate-950/40 border-slate-800'
                : 'bg-[#FAF7F2] border-[#E6DFD3]'
            }`}
          >
            {/* Importance */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span
                  className={`font-semibold ${
                    isDarkMode ? 'text-slate-300' : 'text-stone-700'
                  }`}
                >
                  Importance
                </span>
                <span className="font-mono font-bold text-pink-500">{importance}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={importance}
                onChange={(e) => setImportance(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <span
                className={`text-[10px] mt-1 block ${
                  isDarkMode ? 'text-slate-500' : 'text-stone-400'
                }`}
              >
                {importance >= 7 ? 'High Impact' : importance >= 4 ? 'Moderate Impact' : 'Low Impact'}
              </span>
            </div>

            {/* Urgency */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span
                  className={`font-semibold ${
                    isDarkMode ? 'text-slate-300' : 'text-stone-700'
                  }`}
                >
                  Urgency
                </span>
                <span className="font-mono font-bold text-purple-400">{urgency}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={urgency}
                onChange={(e) => setUrgency(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span
                className={`text-[10px] mt-1 block ${
                  isDarkMode ? 'text-slate-500' : 'text-stone-400'
                }`}
              >
                {urgency >= 7 ? 'Immediate Action' : urgency >= 4 ? 'Upcoming' : 'Can Wait'}
              </span>
            </div>
          </div>

          {/* Eisenhower Matrix Placement */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDarkMode
                ? 'bg-slate-950/40 border-slate-800'
                : 'bg-[#FAF7F2] border-[#E6DFD3]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-semibold flex items-center gap-1.5 ${
                  isDarkMode ? 'text-slate-300' : 'text-stone-700'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-pink-500" />
                <span>Eisenhower Matrix Placement</span>
              </span>
              <label
                className={`flex items-center gap-1.5 text-[11px] cursor-pointer ${
                  isDarkMode ? 'text-slate-400' : 'text-stone-500'
                }`}
              >
                <input
                  type="checkbox"
                  checked={matrixOverride}
                  onChange={(e) => setMatrixOverride(e.target.checked)}
                  className="rounded border-slate-700 text-pink-500"
                />
                <span>Manual Override</span>
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['q1', 'q2', 'q3', 'q4'] as MatrixQuadrant[]).map((q) => {
                const info = quadrantLabels[q];
                const isSelected = matrixQuadrant === q;
                return (
                  <button
                    key={q}
                    type="button"
                    disabled={!matrixOverride && matrixQuadrant !== q}
                    onClick={() => {
                      setMatrixQuadrant(q);
                      setMatrixOverride(true);
                    }}
                    className={`p-2 rounded-xl text-left border transition ${
                      isSelected
                        ? `${info.color} ring-1 ring-current`
                        : isDarkMode
                        ? 'border-slate-800 bg-slate-900/40 text-slate-500'
                        : 'border-[#E6DFD3] bg-white text-stone-400'
                    }`}
                  >
                    <span className="text-xs font-bold block">{info.name}</span>
                    <span className="text-[9px] opacity-80 block">{info.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-inherit">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                isDarkMode
                  ? 'text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800'
                  : 'text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-theme-gradient px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{initialTask ? 'Update Task' : 'Create Task'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
