import React from 'react';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  Circle,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Flame,
  Calendar,
  UserCheck,
  Trash,
} from 'lucide-react';
import { Task, MatrixQuadrant, AccessLevel } from '../../types/index.ts';
import { useTheme } from '../../context/ThemeContext.tsx';

interface EisenhowerMatrixProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onMoveQuadrant: (taskId: string, targetQuadrant: MatrixQuadrant) => void;
  onToggleComplete: (task: Task) => void;
  userRole: AccessLevel;
}

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  onSelectTask,
  onMoveQuadrant,
  onToggleComplete,
  userRole,
}) => {
  const { isDarkMode, themeColor } = useTheme();
  const isViewer = userRole === 'viewer';
  const canModify = !isViewer;

  const quadrantsConfig: Record<
    MatrixQuadrant,
    {
      title: string;
      subtitle: string;
      accent: string;
      borderColor: string;
      bgGradient: string;
      icon: React.ReactNode;
      explanation: string;
    }
  > = {
    q1: {
      title: 'Do First',
      subtitle: 'Urgent & Important',
      accent: 'text-rose-500',
      borderColor: 'border-rose-500/40',
      bgGradient: isDarkMode ? 'from-rose-950/30 to-slate-900/40' : 'from-rose-500/10 to-rose-500/5',
      icon: <Flame className="w-4 h-4 text-rose-500" />,
      explanation: 'Critical deadlines, immediate crises, high-impact pressing tasks.',
    },
    q2: {
      title: 'Schedule',
      subtitle: 'Important, Not Urgent',
      accent: 'text-sky-500',
      borderColor: 'border-sky-500/40',
      bgGradient: isDarkMode ? 'from-sky-950/30 to-slate-900/40' : 'from-sky-500/10 to-sky-500/5',
      icon: <Calendar className="w-4 h-4 text-sky-500" />,
      explanation: 'Long-term planning, studying, deep work, personal development.',
    },
    q3: {
      title: 'Delegate',
      subtitle: 'Urgent, Not Important',
      accent: 'text-amber-500',
      borderColor: 'border-amber-500/40',
      bgGradient: isDarkMode ? 'from-amber-950/30 to-slate-900/40' : 'from-amber-500/10 to-amber-500/5',
      icon: <UserCheck className="w-4 h-4 text-amber-500" />,
      explanation: 'Routine requests, interruptions, tasks that others can handle.',
    },
    q4: {
      title: 'Eliminate',
      subtitle: 'Not Urgent & Not Important',
      accent: isDarkMode ? 'text-slate-400' : 'text-stone-500',
      borderColor: isDarkMode ? 'border-slate-700/60' : 'border-[#E6DFD3]',
      bgGradient: isDarkMode ? 'from-slate-950/40 to-slate-900/20' : 'from-stone-500/10 to-stone-500/5',
      icon: <Trash className="w-4 h-4 text-stone-400" />,
      explanation: 'Time-wasters, excessive distractions, trivial activities.',
    },
  };

  const tasksByQuadrant: Record<MatrixQuadrant, Task[]> = {
    q1: tasks.filter((t) => t.matrixQuadrant === 'q1'),
    q2: tasks.filter((t) => t.matrixQuadrant === 'q2'),
    q3: tasks.filter((t) => t.matrixQuadrant === 'q3'),
    q4: tasks.filter((t) => t.matrixQuadrant === 'q4'),
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!canModify) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetQuadrant: MatrixQuadrant) => {
    if (!canModify) return;
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onMoveQuadrant(taskId, targetQuadrant);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl border transition-colors ${
          isDarkMode
            ? 'bg-slate-900/60 border-slate-800'
            : 'bg-white border-[#E6DFD3] shadow-xs'
        }`}
      >
        <div>
          <h2
            className={`text-base font-bold flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-stone-900'
            }`}
          >
            <span>Eisenhower Decision Matrix</span>
          </h2>
          <p
            className={`text-xs mt-0.5 ${
              isDarkMode ? 'text-slate-400' : 'text-stone-500'
            }`}
          >
            Prioritize tasks across urgency and importance axes. Drag cards or use the quadrant switchers to reclassify.
          </p>
        </div>
        {isViewer && (
          <span className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/30">
            View Only Mode
          </span>
        )}
      </div>

      {/* 4 Quadrants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(['q1', 'q2', 'q3', 'q4'] as MatrixQuadrant[]).map((qKey) => {
          const config = quadrantsConfig[qKey];
          const qTasks = tasksByQuadrant[qKey];

          return (
            <div
              key={qKey}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, qKey)}
              className={`min-h-[280px] rounded-2xl border ${config.borderColor} bg-gradient-to-b ${config.bgGradient} p-4 flex flex-col transition-shadow hover:shadow-lg ${
                isDarkMode ? '' : 'shadow-2xs'
              }`}
            >
              {/* Quadrant Header */}
              <div
                className={`flex items-center justify-between pb-2.5 border-b mb-3 ${
                  isDarkMode ? 'border-slate-800/80' : 'border-[#E6DFD3]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg border ${
                      isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-[#E6DFD3]'
                    }`}
                  >
                    {config.icon}
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${config.accent}`}>
                      {config.title}
                    </h3>
                    <span
                      className={`text-[10px] block -mt-0.5 ${
                        isDarkMode ? 'text-slate-400' : 'text-stone-500'
                      }`}
                    >
                      {config.subtitle}
                    </span>
                  </div>
                </div>
                <span
                  className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-md border ${
                    isDarkMode
                      ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                      : 'bg-white border-[#E6DFD3] text-stone-700'
                  }`}
                >
                  {qTasks.length} {qTasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>

              {/* Quadrant Helper text */}
              <p
                className={`text-[11px] mb-3 leading-relaxed ${
                  isDarkMode ? 'text-slate-400' : 'text-stone-500'
                }`}
              >
                {config.explanation}
              </p>

              {/* Task list container */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-80 pr-1">
                {qTasks.length === 0 ? (
                  <div
                    className={`h-28 border border-dashed rounded-xl flex items-center justify-center text-xs ${
                      isDarkMode
                        ? 'border-slate-800/80 text-slate-500'
                        : 'border-[#E6DFD3] text-stone-400'
                    }`}
                  >
                    No tasks in this quadrant
                  </div>
                ) : (
                  qTasks.map((t) => {
                    const isDone = t.status === 'completed';
                    return (
                      <div
                        key={t.id}
                        draggable={canModify}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', t.id);
                        }}
                        onClick={() => onSelectTask(t)}
                        className={`group p-3 rounded-xl border transition cursor-pointer shadow-xs ${
                          isDone ? 'opacity-60' : ''
                        } ${
                          isDarkMode
                            ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                            : 'bg-white border-[#E6DFD3] hover:border-[#D6CEC0]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (canModify) onToggleComplete(t);
                              }}
                              disabled={isViewer}
                              className="mt-0.5 text-stone-400 hover:text-pink-500 transition"
                            >
                              {isDone ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`text-xs font-semibold truncate ${
                                  isDone
                                    ? 'line-through text-slate-400'
                                    : isDarkMode
                                    ? 'text-white'
                                    : 'text-stone-900'
                                }`}
                              >
                                {t.title}
                              </h4>
                              <div
                                className={`flex items-center gap-2 text-[10px] mt-1 ${
                                  isDarkMode ? 'text-slate-400' : 'text-stone-500'
                                }`}
                              >
                                {t.dueDate && <span>Due {t.dueDate}</span>}
                                <span>·</span>
                                <span className="font-mono text-pink-500 font-bold">Imp {t.importance}</span>
                                <span>·</span>
                                <span className="font-mono text-purple-400 font-bold">Urg {t.urgency}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Quadrant Shift Dropdown for Mobile / Non-drag */}
                          {canModify && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <select
                                value={t.matrixQuadrant}
                                onChange={(e) => onMoveQuadrant(t.id, e.target.value as MatrixQuadrant)}
                                className={`text-[10px] rounded px-1.5 py-0.5 border focus:outline-hidden ${
                                  isDarkMode
                                    ? 'bg-slate-950 border-slate-700 text-slate-300'
                                    : 'bg-[#FAF7F2] border-[#D6CEC0] text-stone-800'
                                }`}
                              >
                                <option value="q1">Q1 Do First</option>
                                <option value="q2">Q2 Schedule</option>
                                <option value="q3">Q3 Delegate</option>
                                <option value="q4">Q4 Eliminate</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
