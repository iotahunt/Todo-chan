import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
  Circle,
  Sliders,
  Search,
  Filter,
  Bot,
  Tag,
} from 'lucide-react';
import { Task, TodoList } from '../../types/index.ts';
import heroBannerImg from '../../assets/images/todochan_hero_banner_1791993044637.jpg';
import { useTheme } from '../../context/ThemeContext.tsx';
import { TodoChanAIChat } from '../mascot/TodoChanAIChat.tsx';

interface PersonalDashboardProps {
  username: string;
  tasks: Task[];
  lists: TodoList[];
  onOpenCreateTask: () => void;
  onOpenCreateList: () => void;
  onSelectTask: (task: Task) => void;
  onSelectList?: (list: TodoList) => void;
  onNavigateTab: (tab: 'lists' | 'calendar' | 'matrix' | 'connect') => void;
  onToggleComplete: (task: Task) => void;
  onSaveTask: (taskData: Partial<Task>) => Promise<void>;
  onCreateListSubmit: (listData: Partial<TodoList>) => Promise<void>;
}

export const PersonalDashboard: React.FC<PersonalDashboardProps> = ({
  username,
  tasks,
  lists,
  onOpenCreateTask,
  onOpenCreateList,
  onSelectTask,
  onSelectList,
  onNavigateTab,
  onToggleComplete,
  onSaveTask,
  onCreateListSubmit,
}) => {
  const { themeColor, isDarkMode, isNeonMode } = useTheme();
  const [activeFeedTab, setActiveFeedTab] = useState<'all' | 'today' | 'q1' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListFilter, setSelectedListFilter] = useState<string>('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentDateFormatted = new Date().toLocaleDateString('default', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const todayTasks = tasks.filter((t) => t.dueDate === todayStr || t.startDate === todayStr);
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < todayStr && t.status !== 'completed'
  );
  const upcomingTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate > todayStr && t.status !== 'completed'
  );
  const q1Tasks = tasks.filter(
    (t) => t.matrixQuadrant === 'q1' && t.status !== 'completed'
  );
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const total = tasks.length;
  const completedCount = completedTasks.length;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Filtered task list for main feed
  const feedTasks = tasks.filter((t) => {
    // Tab filter
    if (activeFeedTab === 'today') {
      if (t.dueDate !== todayStr && t.startDate !== todayStr) return false;
    } else if (activeFeedTab === 'q1') {
      if (t.matrixQuadrant !== 'q1') return false;
    } else if (activeFeedTab === 'upcoming') {
      if (!t.dueDate || t.dueDate <= todayStr || t.status === 'completed') return false;
    } else if (activeFeedTab === 'completed') {
      if (t.status !== 'completed') return false;
    }

    // List filter
    if (selectedListFilter !== 'all' && t.listId !== selectedListFilter) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div
        className={`relative rounded-3xl overflow-hidden border shadow-xl min-h-[160px] flex items-center transition-colors ${
          isDarkMode
            ? 'border-slate-800 bg-slate-900'
            : 'border-[#E6DFD3] bg-[#F4EFE6]'
        }`}
      >
        <img
          src={heroBannerImg}
          alt="Workspace daylight"
          className="absolute inset-0 w-full h-full object-cover opacity-20 filter saturate-150"
          referrerPolicy="no-referrer"
        />
        <div
          className={`absolute inset-0 ${
            isDarkMode
              ? 'bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent'
              : 'bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2]/90 to-transparent'
          }`}
        />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-theme mb-1">
              <Sparkles className="w-4 h-4" />
              <span>{currentDateFormatted}</span>
            </div>
            <h1
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                isDarkMode ? 'text-white' : 'text-stone-900'
              }`}
            >
              Hello, <span className="text-theme">{username}</span>!
            </h1>
            <p
              className={`text-xs sm:text-sm mt-1 max-w-md ${
                isDarkMode ? 'text-slate-300' : 'text-stone-600'
              }`}
            >
              {overdueTasks.length > 0
                ? `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} that need attention.`
                : todayTasks.length > 0
                ? `You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} scheduled for today.`
                : "You're all caught up! Instruct Todo-chan or plan your next goals."}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenCreateTask}
              className="btn-theme-gradient flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition active:scale-95 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Add Task</span>
            </button>
            <button
              onClick={onOpenCreateList}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition ${
                isDarkMode
                  ? 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border-slate-700/60'
                  : 'text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 border-[#DCD4C5]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>New List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Todo-chan AI Integrated Natural Language Companion Card */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2
            className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              isDarkMode ? 'text-slate-400' : 'text-stone-500'
            }`}
          >
            <Bot className="w-4 h-4 text-theme" />
            <span>Todo-chan AI Assistant (Home Page Chat)</span>
          </h2>
          <span className="text-[11px] text-pink-500 font-semibold">
            Type anything to create tasks & auto-assign ✨
          </span>
        </div>
        <TodoChanAIChat
          lists={lists}
          tasks={tasks}
          onAddTask={onSaveTask}
          onCreateList={onCreateListSubmit}
          onCompleteTask={async (t) => onToggleComplete(t)}
        />
      </div>

      {/* Daily Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className={`border rounded-2xl p-4 shadow-xs transition-colors ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white border-[#E6DFD3]'
          }`}
        >
          <div
            className={`flex items-center justify-between text-xs mb-2 ${
              isDarkMode ? 'text-slate-400' : 'text-stone-500'
            }`}
          >
            <span>Total Tasks</span>
            <Layers className="w-4 h-4 text-theme" />
          </div>
          <div
            className={`text-2xl font-black font-mono tabular-nums ${
              isDarkMode ? 'text-white' : 'text-stone-900'
            }`}
          >
            {tasks.length}
          </div>
          <span
            className={`text-[11px] mt-1 block ${
              isDarkMode ? 'text-slate-500' : 'text-stone-400'
            }`}
          >
            Across {lists.length} lists
          </span>
        </div>

        <div
          className={`border rounded-2xl p-4 shadow-xs transition-colors ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white border-[#E6DFD3]'
          }`}
        >
          <div
            className={`flex items-center justify-between text-xs mb-2 ${
              isDarkMode ? 'text-slate-400' : 'text-stone-500'
            }`}
          >
            <span>Today's Schedule</span>
            <CalendarIcon className="w-4 h-4 text-theme" />
          </div>
          <div
            className={`text-2xl font-black font-mono tabular-nums ${
              isDarkMode ? 'text-white' : 'text-stone-900'
            }`}
          >
            {todayTasks.length}
          </div>
          <span
            className={`text-[11px] mt-1 block ${
              isDarkMode ? 'text-slate-500' : 'text-stone-400'
            }`}
          >
            Scheduled for today
          </span>
        </div>

        <div
          className={`border rounded-2xl p-4 shadow-xs transition-colors ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white border-[#E6DFD3]'
          }`}
        >
          <div
            className={`flex items-center justify-between text-xs mb-2 ${
              isDarkMode ? 'text-slate-400' : 'text-stone-500'
            }`}
          >
            <span>Do First (Q1)</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-500 tabular-nums">
            {q1Tasks.length}
          </div>
          <span
            className={`text-[11px] mt-1 block ${
              isDarkMode ? 'text-slate-500' : 'text-stone-400'
            }`}
          >
            Urgent & Important
          </span>
        </div>

        <div
          className={`border rounded-2xl p-4 shadow-xs transition-colors ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white border-[#E6DFD3]'
          }`}
        >
          <div
            className={`flex items-center justify-between text-xs mb-2 ${
              isDarkMode ? 'text-slate-400' : 'text-stone-500'
            }`}
          >
            <span>Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-500 tabular-nums">
            {progressPercent}%
          </div>
          <div
            className={`w-full h-1.5 rounded-full mt-2 overflow-hidden ${
              isDarkMode ? 'bg-slate-800' : 'bg-stone-200'
            }`}
          >
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Task Feed Section */}
      <div
        className={`border rounded-2xl p-5 shadow-lg transition-colors ${
          isDarkMode
            ? 'bg-slate-900/80 border-slate-800'
            : 'bg-white border-[#E6DFD3]'
        }`}
      >
        {/* Header & View Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-inherit">
          <div>
            <h3
              className={`text-base font-bold flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-stone-900'
              }`}
            >
              <span>Task Feed & Daily Schedule</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-mono font-bold"
                style={{
                  backgroundColor: 'rgba(255, 105, 180, 0.15)',
                  color: '#ff69b4',
                }}
              >
                {feedTasks.length} task{feedTasks.length !== 1 ? 's' : ''}
              </span>
            </h3>
            <p
              className={`text-xs mt-0.5 ${
                isDarkMode ? 'text-slate-400' : 'text-stone-500'
              }`}
            >
              All tasks automatically mapped to Eisenhower Matrix & Calendar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search
                className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${
                  isDarkMode ? 'text-slate-400' : 'text-stone-400'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className={`text-xs pl-8 pr-3 py-1.5 rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-pink-400 transition w-36 sm:w-44 ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-700/80 text-white placeholder-slate-500'
                    : 'bg-[#FAF7F2] border-[#D6CEC0] text-stone-900 placeholder-stone-400'
                }`}
              />
            </div>

            {/* List Selector Dropdown */}
            {lists.length > 0 && (
              <select
                value={selectedListFilter}
                onChange={(e) => setSelectedListFilter(e.target.value)}
                className={`text-xs px-3 py-1.5 rounded-xl border focus:outline-hidden transition ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-700/80 text-white'
                    : 'bg-[#FAF7F2] border-[#D6CEC0] text-stone-900'
                }`}
              >
                <option value="all">All To-Do Lists ({lists.length})</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={onOpenCreateTask}
              className="btn-theme-gradient text-xs font-bold text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 pt-3 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: `All Tasks (${tasks.length})` },
            { id: 'today', label: `Today's Schedule (${todayTasks.length})` },
            { id: 'q1', label: `Do First / Q1 (${q1Tasks.length})` },
            { id: 'upcoming', label: `Upcoming (${upcomingTasks.length})` },
            { id: 'completed', label: `Completed (${completedTasks.length})` },
          ].map((tab) => {
            const isActive = activeFeedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFeedTab(tab.id as any)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'btn-theme-gradient text-white shadow-xs'
                    : isDarkMode
                    ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white'
                    : 'bg-[#F4EFE6] hover:bg-[#EAE3D6] text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Task Cards Feed */}
        <div className="mt-3 space-y-2.5">
          {feedTasks.length === 0 ? (
            <div
              className={`py-12 text-center rounded-2xl border border-dashed ${
                isDarkMode
                  ? 'border-slate-800 text-slate-400 bg-slate-950/40'
                  : 'border-[#E6DFD3] text-stone-500 bg-[#FAF7F2]'
              }`}
            >
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-pink-400 animate-pulse" />
              <p className="text-sm font-bold">No tasks found in this view</p>
              <p className="text-xs mt-1">
                Click "Quick Add Task" above or ask Todo-chan AI to create one!
              </p>
              <button
                onClick={onOpenCreateTask}
                className="mt-3 btn-theme-gradient px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task Now</span>
              </button>
            </div>
          ) : (
            feedTasks.map((t) => {
              const isDone = t.status === 'completed';
              const parentList = lists.find((l) => l.id === t.listId);
              const quadrantBadge: Record<string, { label: string; cls: string }> = {
                q1: { label: 'Q1 · Do First', cls: 'text-rose-500 bg-rose-500/10 border-rose-500/30' },
                q2: { label: 'Q2 · Schedule', cls: 'text-purple-500 bg-purple-500/10 border-purple-500/30' },
                q3: { label: 'Q3 · Delegate', cls: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
                q4: { label: 'Q4 · Eliminate', cls: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
              };
              const qInfo = quadrantBadge[t.matrixQuadrant] || quadrantBadge.q2;

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                    isDone ? 'opacity-55' : ''
                  } ${
                    isDarkMode
                      ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-[#E6DFD3] hover:border-[#D6CEC0] shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(t);
                      }}
                      className="text-slate-400 hover:text-pink-500 transition shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: t.color || parentList?.color || themeColor }}
                        />
                        <h4
                          className={`text-xs font-bold truncate ${
                            isDone
                              ? 'line-through text-slate-400'
                              : isDarkMode
                              ? 'text-white'
                              : 'text-stone-900'
                          }`}
                        >
                          {t.title}
                        </h4>

                        {/* List Badge */}
                        {parentList && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md border truncate max-w-[120px]"
                            style={{
                              backgroundColor: `${parentList.color}15`,
                              color: parentList.color,
                              borderColor: `${parentList.color}35`,
                            }}
                          >
                            {parentList.name}
                          </span>
                        )}

                        {/* Eisenhower Quadrant Badge */}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${qInfo.cls}`}
                        >
                          {qInfo.label}
                        </span>
                      </div>

                      <div
                        className={`text-[11px] mt-1 flex flex-wrap items-center gap-3 ${
                          isDarkMode ? 'text-slate-400' : 'text-stone-500'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-pink-400" />
                          <span>
                            {t.dueDate ? `Due ${t.dueDate}` : 'No deadline'}
                          </span>
                        </span>
                        {!t.isAllDay && t.startTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-purple-400" />
                            <span>
                              {t.startTime} {t.dueTime ? `- ${t.dueTime}` : ''}
                            </span>
                          </span>
                        )}
                        <span>{t.durationMinutes || 30} mins</span>
                      </div>
                    </div>
                  </div>

                  {/* Urgency & Importance Scores */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold ${
                        isDarkMode
                          ? 'bg-slate-900 text-slate-300 border-slate-800'
                          : 'bg-[#F4EFE6] text-stone-700 border-[#E6DFD3]'
                      }`}
                      title="Urgency score (0-10)"
                    >
                      Urg: {t.urgency ?? 5}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold ${
                        isDarkMode
                          ? 'bg-slate-900 text-slate-300 border-slate-800'
                          : 'bg-[#F4EFE6] text-stone-700 border-[#E6DFD3]'
                      }`}
                      title="Importance score (0-10)"
                    >
                      Imp: {t.importance ?? 5}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
