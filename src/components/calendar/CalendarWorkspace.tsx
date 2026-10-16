import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle,
  Eye,
  Filter,
} from 'lucide-react';
import { Task, TodoList, AccessLevel } from '../../types/index.ts';
import { useTheme } from '../../context/ThemeContext.tsx';

interface CalendarWorkspaceProps {
  tasks: Task[];
  lists: TodoList[];
  onSelectTask: (task: Task) => void;
  onCreateTaskOnDate?: (dateStr: string) => void;
  userRole?: AccessLevel;
}

type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

export const CalendarWorkspace: React.FC<CalendarWorkspaceProps> = ({
  tasks,
  lists,
  onSelectTask,
  onCreateTaskOnDate,
  userRole = 'editor',
}) => {
  const { themeColor, isDarkMode, isNeonMode } = useTheme();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedListFilter, setSelectedListFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const canModify = userRole !== 'viewer';

  // Navigate functions
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedListFilter !== 'all' && t.listId !== selectedListFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
  }, [tasks, selectedListFilter, statusFilter]);

  // Month days calculation
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Prev month overflow
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      const str = d.toISOString().split('T')[0];
      days.push({ date: d, dateStr: str, isCurrentMonth: false, isToday: false });
    }

    // Current month days
    const todayStr = new Date().toISOString().split('T')[0];
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const str = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateStr: str,
        isCurrentMonth: true,
        isToday: str === todayStr,
      });
    }

    // Next month overflow to fill 35 or 42 slots
    const totalSlots = days.length > 35 ? 42 : 35;
    const remaining = totalSlots - days.length;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      const str = d.toISOString().split('T')[0];
      days.push({ date: d, dateStr: str, isCurrentMonth: false, isToday: false });
    }

    return days;
  }, [currentDate]);

  // Week days calculation
  const weekData = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const days: { date: Date; dateStr: string; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const str = d.toISOString().split('T')[0];
      days.push({ date: d, dateStr: str, isToday: str === todayStr });
    }
    return days;
  }, [currentDate]);

  const monthTitle = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Top Bar Controls */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-colors ${
          isDarkMode
            ? 'bg-slate-900/60 border-slate-800'
            : 'bg-white border-[#E6DFD3] shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#FAF7F2] border-[#E6DFD3]'
            }`}
          >
            <button
              onClick={handlePrev}
              className={`p-1.5 rounded-lg transition ${
                isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-stone-500 hover:text-stone-900 hover:bg-[#EAE3D6]'
              }`}
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                isDarkMode ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-stone-600 hover:text-stone-900 hover:bg-[#EAE3D6]'
              }`}
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className={`p-1.5 rounded-lg transition ${
                isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-stone-500 hover:text-stone-900 hover:bg-[#EAE3D6]'
              }`}
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2
            className={`text-base font-bold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-stone-900'
            }`}
          >
            {monthTitle}
          </h2>
        </div>

        {/* View Mode Selector & Filters */}
        <div className="flex items-center flex-wrap gap-2">
          {/* List Filter */}
          {lists.length > 1 && (
            <select
              value={selectedListFilter}
              onChange={(e) => setSelectedListFilter(e.target.value)}
              className={`text-xs rounded-xl px-2.5 py-1.5 border focus:outline-hidden ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-700 text-slate-300'
                  : 'bg-[#FAF7F2] border-[#D6CEC0] text-stone-800'
              }`}
            >
              <option value="all">All Lists</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          )}

          {/* View Toggles */}
          <div
            className={`flex p-1 rounded-xl border ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#FAF7F2] border-[#E6DFD3]'
            }`}
          >
            {(['month', 'week', 'day', 'agenda'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                  viewMode === mode
                    ? 'btn-theme-gradient text-white shadow-xs'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-white'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div
          className={`border rounded-2xl overflow-hidden shadow-xl transition-colors ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white border-[#E6DFD3]'
          }`}
        >
          {/* Day Headers */}
          <div
            className={`grid grid-cols-7 border-b text-center py-2 text-[11px] font-bold uppercase tracking-wider ${
              isDarkMode
                ? 'border-slate-800 text-slate-400 bg-slate-950/60'
                : 'border-[#E6DFD3] text-stone-500 bg-[#F4EFE6]'
            }`}
          >
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div
            className={`grid grid-cols-7 divide-x divide-y ${
              isDarkMode ? 'divide-slate-800/80' : 'divide-[#E6DFD3]'
            }`}
          >
            {monthData.map((slot) => {
              const dayTasks = filteredTasks.filter(
                (t) => t.dueDate === slot.dateStr || t.startDate === slot.dateStr
              );

              return (
                <div
                  key={slot.dateStr}
                  onClick={() => canModify && onCreateTaskOnDate && onCreateTaskOnDate(slot.dateStr)}
                  className={`min-h-[105px] p-1.5 transition flex flex-col group relative ${
                    slot.isCurrentMonth
                      ? isDarkMode
                        ? 'bg-slate-900/40'
                        : 'bg-white'
                      : isDarkMode
                      ? 'bg-slate-950/40 opacity-40'
                      : 'bg-[#FAF7F2] opacity-50'
                  } ${canModify ? (isDarkMode ? 'cursor-pointer hover:bg-slate-800/40' : 'cursor-pointer hover:bg-[#FAF7F2]') : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-mono font-semibold w-6 h-6 rounded-full flex items-center justify-center ${
                        slot.isToday
                          ? 'btn-theme-gradient text-white font-bold'
                          : isDarkMode
                          ? 'text-slate-300'
                          : 'text-stone-700'
                      }`}
                    >
                      {slot.date.getDate()}
                    </span>

                    {canModify && (
                      <span className="opacity-0 group-hover:opacity-100 text-theme p-0.5">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Tasks */}
                  <div className="space-y-1 overflow-y-auto max-h-20">
                    {dayTasks.map((t) => {
                      const isDone = t.status === 'completed';
                      return (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTask(t);
                          }}
                          className={`px-1.5 py-1 rounded-md text-[10px] font-medium truncate flex items-center gap-1 border transition hover:opacity-90 cursor-pointer ${
                            isDone
                              ? isDarkMode
                                ? 'line-through opacity-50 bg-slate-800 text-slate-400 border-slate-700'
                                : 'line-through opacity-50 bg-stone-100 text-stone-400 border-stone-200'
                              : isDarkMode
                              ? 'text-white'
                              : 'text-stone-900'
                          }`}
                          style={{
                            backgroundColor: !isDone ? `${t.color}25` : undefined,
                            borderColor: !isDone ? `${t.color}60` : undefined,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.color }}
                          />
                          <span className="truncate">{t.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div
          className={`border rounded-2xl overflow-hidden shadow-xl ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white border-[#E6DFD3]'
          }`}
        >
          <div
            className={`grid grid-cols-7 divide-x ${
              isDarkMode ? 'divide-slate-800' : 'divide-[#E6DFD3]'
            }`}
          >
            {weekData.map((col) => {
              const dayTasks = filteredTasks.filter(
                (t) => t.dueDate === col.dateStr || t.startDate === col.dateStr
              );
              return (
                <div key={col.dateStr} className="min-h-[360px] p-3 flex flex-col">
                  <div
                    className={`text-center pb-2 border-b mb-2 ${
                      isDarkMode ? 'border-slate-800' : 'border-[#E6DFD3]'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase block ${
                        isDarkMode ? 'text-slate-400' : 'text-stone-500'
                      }`}
                    >
                      {col.date.toLocaleDateString('default', { weekday: 'short' })}
                    </span>
                    <span
                      className={`inline-block font-mono text-sm font-bold mt-0.5 w-7 h-7 rounded-full leading-7 ${
                        col.isToday
                          ? 'btn-theme-gradient text-white'
                          : isDarkMode
                          ? 'text-slate-200'
                          : 'text-stone-800'
                      }`}
                    >
                      {col.date.getDate()}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onSelectTask(t)}
                        className={`p-2 rounded-xl border text-xs cursor-pointer transition ${
                          isDarkMode
                            ? 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                            : 'border-[#E6DFD3] bg-[#FAF7F2] hover:border-[#D6CEC0]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                          <span
                            className={`font-semibold truncate ${
                              isDarkMode ? 'text-white' : 'text-stone-900'
                            }`}
                          >
                            {t.title}
                          </span>
                        </div>
                        <div
                          className={`text-[10px] flex items-center justify-between ${
                            isDarkMode ? 'text-slate-400' : 'text-stone-500'
                          }`}
                        >
                          <span>{t.startTime ? `${t.startTime} - ${t.dueTime}` : 'All Day'}</span>
                          <span className="capitalize">{t.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div
          className={`border rounded-2xl p-6 shadow-xl ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white border-[#E6DFD3]'
          }`}
        >
          <div
            className={`pb-3 border-b mb-4 flex items-center justify-between ${
              isDarkMode ? 'border-slate-800' : 'border-[#E6DFD3]'
            }`}
          >
            <h3
              className={`text-base font-bold ${
                isDarkMode ? 'text-white' : 'text-stone-900'
              }`}
            >
              {currentDate.toLocaleDateString('default', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h3>
            {canModify && onCreateTaskOnDate && (
              <button
                onClick={() => onCreateTaskOnDate(currentDate.toISOString().split('T')[0])}
                className="btn-theme-gradient flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task Today</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filteredTasks
              .filter((t) => {
                const curStr = currentDate.toISOString().split('T')[0];
                return t.dueDate === curStr || t.startDate === curStr;
              })
              .map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isDarkMode
                      ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      : 'bg-[#FAF7F2] border-[#E6DFD3] hover:border-[#D6CEC0]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                    <div>
                      <h4
                        className={`text-sm font-semibold ${
                          isDarkMode ? 'text-white' : 'text-stone-900'
                        }`}
                      >
                        {t.title}
                      </h4>
                      <p
                        className={`text-xs mt-0.5 ${
                          isDarkMode ? 'text-slate-400' : 'text-stone-500'
                        }`}
                      >
                        {t.isAllDay ? 'All Day Task' : `${t.startTime || ''} to ${t.dueTime || ''}`} · {t.durationMinutes} mins · Quadrant {t.matrixQuadrant.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-md border capitalize ${
                      isDarkMode
                        ? 'bg-slate-900 border-slate-800 text-slate-300'
                        : 'bg-white border-[#E6DFD3] text-stone-700'
                    }`}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* AGENDA VIEW */}
      {viewMode === 'agenda' && (
        <div
          className={`border rounded-2xl p-6 shadow-xl ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white border-[#E6DFD3]'
          }`}
        >
          <h3
            className={`text-sm font-bold uppercase tracking-wider mb-4 ${
              isDarkMode ? 'text-slate-400' : 'text-stone-500'
            }`}
          >
            Upcoming Task Agenda
          </h3>
          <div className="space-y-3">
            {filteredTasks
              .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
              .map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isDarkMode
                      ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      : 'bg-[#FAF7F2] border-[#E6DFD3] hover:border-[#D6CEC0]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center border shrink-0 ${
                        isDarkMode
                          ? 'bg-slate-900 border-slate-800'
                          : 'bg-white border-[#E6DFD3]'
                      }`}
                    >
                      <span
                        className={`text-[9px] uppercase ${
                          isDarkMode ? 'text-slate-500' : 'text-stone-400'
                        }`}
                      >
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString('default', { month: 'short' }) : 'Any'}
                      </span>
                      <span
                        className={`font-mono text-xs font-bold ${
                          isDarkMode ? 'text-white' : 'text-stone-900'
                        }`}
                      >
                        {t.dueDate ? new Date(t.dueDate).getDate() : '--'}
                      </span>
                    </div>
                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          isDarkMode ? 'text-white' : 'text-stone-900'
                        }`}
                      >
                        {t.title}
                      </h4>
                      <span
                        className={`text-[11px] ${
                          isDarkMode ? 'text-slate-400' : 'text-stone-500'
                        }`}
                      >
                        {t.description ? t.description.slice(0, 60) + '...' : 'No description'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-semibold text-theme block">
                      Imp {t.importance} · Urg {t.urgency}
                    </span>
                    <span
                      className={`text-[10px] uppercase ${
                        isDarkMode ? 'text-slate-500' : 'text-stone-400'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
