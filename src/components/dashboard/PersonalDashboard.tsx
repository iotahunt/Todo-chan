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
  Tag,
  Heart,
  Smile,
} from 'lucide-react';
import { Task, TodoList, UnorganizedTask } from '../../types/index.ts';
import heroBannerImg from '../../assets/images/todochan_hero_banner_1791993044637.jpg';
import { useTheme } from '../../context/ThemeContext.tsx';
import { TalkToTodoChan } from '../capture/TalkToTodoChan.tsx';

interface PersonalDashboardProps {
  username: string;
  tasks: Task[];
  lists: TodoList[];
  unorganizedTasks?: UnorganizedTask[];
  onOpenCreateTask: () => void;
  onOpenCreateList: () => void;
  onSelectTask: (task: Task) => void;
  onSelectList?: (list: TodoList) => void;
  onNavigateTab: (tab: 'lists' | 'calendar' | 'matrix' | 'connect' | 'unorganized' | 'chat') => void;
  onToggleComplete: (task: Task) => void;
  onSaveTask: (taskData: Partial<Task>) => Promise<void>;
  onCreateListSubmit: (listData: Partial<TodoList>) => Promise<void>;
  onOpenUnorganizedView?: () => void;
  onOpenWellnessTracker?: () => void;
}

export const PersonalDashboard: React.FC<PersonalDashboardProps> = ({
  username,
  tasks,
  lists,
  unorganizedTasks = [],
  onOpenCreateTask,
  onOpenCreateList,
  onSelectTask,
  onSelectList,
  onNavigateTab,
  onToggleComplete,
  onSaveTask,
  onCreateListSubmit,
  onOpenUnorganizedView,
  onOpenWellnessTracker,
}) => {
  const { themeColor, isDarkMode, isNeonMode } = useTheme();
  const [activeFeedTab, setActiveFeedTab] = useState<'all' | 'today' | 'q1' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListFilter, setSelectedListFilter] = useState<string>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  const todayTasks = tasks.filter(
    (t) => t.dueDate === todayStr || t.startDate === todayStr
  );
  const q1Tasks = tasks.filter((t) => t.matrixQuadrant === 'q1' && t.status !== 'completed');
  const completedToday = tasks.filter(
    (t) => t.status === 'completed' && t.completedAt?.startsWith(todayStr)
  );
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < todayStr && t.status !== 'completed'
  );

  const currentDateFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Filtered tasks for feed view
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
          isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-[#E6DFD3] bg-[#F4EFE6]'
        }`}
        style={{
          boxShadow: 'var(--neon-card-glow)',
          borderColor: 'rgba(var(--accent-rgb), 0.4)',
        }}
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
                : "You're all caught up! Capture new goals with Todo-chan or plan your week."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenWellnessTracker && (
              <button
                onClick={onOpenWellnessTracker}
                className="btn-theme-secondary flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition active:scale-95"
              >
                <Smile className="w-4 h-4" />
                <span>Wellness Tracker</span>
              </button>
            )}
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

      {/* Talk to Todo-chan: Personal Task-Capture Space */}
      <TalkToTodoChan
        onOpenUnorganizedView={onOpenUnorganizedView}
      />

      {/* Daily Overview Metric Cards with Dynamic Neon Glow */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className={`border rounded-2xl p-4 transition-colors app-card`}
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
          className={`border rounded-2xl p-4 transition-colors app-card`}
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
          className={`border rounded-2xl p-4 transition-colors app-card`}
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

        {/* Unorganized Tasks Quick Card */}
        <div
          onClick={onOpenUnorganizedView}
          className={`border rounded-2xl p-4 transition-all cursor-pointer app-card hover:scale-[1.02]`}
        >
          <div
            className={`flex items-center justify-between text-xs mb-2 ${
              isDarkMode ? 'text-slate-400' : 'text-stone-500'
            }`}
          >
            <span>Unorganized Inbox</span>
            <Sparkles className="w-4 h-4 text-theme" />
          </div>
          <div
            className={`text-2xl font-black font-mono tabular-nums text-theme`}
          >
            {unorganizedTasks.length}
          </div>
          <span
            className={`text-[11px] mt-1 block text-theme font-medium flex items-center gap-1`}
          >
            <span>Tap to organize</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* All Tasks Feed Section */}
      <div
        className={`border rounded-3xl p-5 sm:p-6 transition-colors app-card`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-slate-800">
          <div>
            <h2
              className={`text-lg font-black tracking-tight ${
                isDarkMode ? 'text-white' : 'text-stone-900'
              }`}
            >
              Task Feed & All Tasks
            </h2>
            <p
              className={`text-xs mt-0.5 ${
                isDarkMode ? 'text-slate-400' : 'text-stone-500'
              }`}
            >
              Showing {feedTasks.length} of {tasks.length} total tasks
            </p>
          </div>

          {/* Search and List Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl text-xs app-input w-48 sm:w-56"
              />
            </div>

            <select
              value={selectedListFilter}
              onChange={(e) => setSelectedListFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs app-input cursor-pointer"
            >
              <option value="all">All Lists ({lists.length})</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar border-b border-stone-100 dark:border-slate-800/80">
          {[
            { id: 'all', label: 'All Tasks', count: tasks.length },
            { id: 'today', label: "Today's Schedule", count: todayTasks.length },
            { id: 'q1', label: 'Do First (Q1)', count: q1Tasks.length },
            { id: 'upcoming', label: 'Upcoming', count: tasks.filter((t) => t.dueDate && t.dueDate > todayStr && t.status !== 'completed').length },
            { id: 'completed', label: 'Completed', count: tasks.filter((t) => t.status === 'completed').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFeedTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 flex items-center gap-1.5 ${
                activeFeedTab === tab.id
                  ? 'btn-theme-primary text-white'
                  : isDarkMode
                  ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeFeedTab === tab.id
                    ? 'bg-white/20 text-white'
                    : isDarkMode
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="pt-3">
          {feedTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-stone-300 dark:text-slate-700 mx-auto mb-2" />
              <p
                className={`text-sm font-semibold ${
                  isDarkMode ? 'text-slate-400' : 'text-stone-500'
                }`}
              >
                No tasks found in this view
              </p>
              <p
                className={`text-xs mt-1 ${
                  isDarkMode ? 'text-slate-600' : 'text-stone-400'
                }`}
              >
                Create a new task with the button above or type in Talk to Todo-chan!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {feedTasks.map((t) => {
                const parentList = lists.find((l) => l.id === t.listId);
                const isOverdue = t.dueDate && t.dueDate < todayStr && t.status !== 'completed';
                const isCompleted = t.status === 'completed';

                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer hover:translate-x-0.5 ${
                      isCompleted
                        ? 'opacity-60 bg-emerald-500/5'
                        : isDarkMode
                        ? 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
                        : 'bg-white hover:bg-stone-50 border-[#E6DFD3]'
                    }`}
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: t.color || parentList?.color || themeColor,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleComplete(t);
                        }}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition ${
                          isCompleted
                            ? 'bg-theme border-theme text-white'
                            : 'border-stone-300 dark:border-slate-600 hover:border-pink-400'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold truncate ${
                              isCompleted
                                ? 'line-through text-stone-400 dark:text-slate-500'
                                : isDarkMode
                                ? 'text-white'
                                : 'text-stone-900'
                            }`}
                          >
                            {t.title}
                          </span>
                          {t.isCareTask && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-pink-500/10 text-theme border border-pink-500/30">
                              Care Task 🌸
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                          {parentList && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.2 rounded-md font-mono"
                              style={{
                                backgroundColor: `${parentList.color}15`,
                                color: parentList.color,
                              }}
                            >
                              {parentList.name}
                            </span>
                          )}

                          {t.dueDate && (
                            <span
                              className={`flex items-center gap-1 font-mono text-[10px] ${
                                isOverdue
                                  ? 'text-rose-500 font-bold'
                                  : isDarkMode
                                  ? 'text-slate-400'
                                  : 'text-stone-500'
                              }`}
                            >
                              <CalendarIcon className="w-3 h-3" />
                              <span>{t.dueDate}</span>
                              {t.dueTime && <span>at {t.dueTime}</span>}
                              {isOverdue && <span>(Overdue)</span>}
                            </span>
                          )}

                          <span
                            className="text-[10px] px-1.5 py-0.2 rounded-md font-bold uppercase"
                            style={{
                              backgroundColor:
                                t.matrixQuadrant === 'q1'
                                  ? 'rgba(244,63,94,0.15)'
                                  : t.matrixQuadrant === 'q2'
                                  ? 'rgba(59,130,246,0.15)'
                                  : t.matrixQuadrant === 'q3'
                                  ? 'rgba(234,179,8,0.15)'
                                  : 'rgba(100,116,139,0.15)',
                              color:
                                t.matrixQuadrant === 'q1'
                                  ? '#f43f5e'
                                  : t.matrixQuadrant === 'q2'
                                  ? '#3b82f6'
                                  : t.matrixQuadrant === 'q3'
                                  ? '#eab308'
                                  : '#64748b',
                            }}
                          >
                            {t.matrixQuadrant.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-stone-400">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
