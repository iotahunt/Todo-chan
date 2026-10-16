import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Sliders,
  MessageSquare,
  Settings,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Circle,
  Eye,
  Shield,
  Edit3,
  Copy,
  Check,
  Tag,
  KeyRound,
  Trash2,
  Archive,
} from 'lucide-react';
import { TodoList, Task, AccessLevel, MatrixQuadrant, TaskStatus } from '../../types/index.ts';
import { CalendarWorkspace } from '../calendar/CalendarWorkspace.tsx';
import { EisenhowerMatrix } from '../matrix/EisenhowerMatrix.tsx';
import { WorkspaceChat } from '../chat/WorkspaceChat.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';

interface SelectedListViewProps {
  list: TodoList;
  tasks: Task[];
  userRole: AccessLevel;
  currentUserId?: string;
  currentUsername: string;
  onBack: () => void;
  onOpenCreateTask: () => void;
  onSelectTask: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onMoveQuadrant: (taskId: string, quad: MatrixQuadrant) => void;
  onOpenSharingSettings: () => void;
  onOpenUpgradeDialog: () => void;
  onDeleteList: (listDocId: string) => void;
  onUpdateListNameOrColor: (listDocId: string, name: string, color: string) => void;
}

export const SelectedListView: React.FC<SelectedListViewProps> = ({
  list,
  tasks,
  userRole,
  currentUserId = '',
  currentUsername,
  onBack,
  onOpenCreateTask,
  onSelectTask,
  onToggleComplete,
  onMoveQuadrant,
  onOpenSharingSettings,
  onOpenUpgradeDialog,
  onDeleteList,
  onUpdateListNameOrColor,
}) => {
  const { themeColor, isDarkMode, isNeonMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'tasks' | 'calendar' | 'matrix' | 'chat' | 'settings'>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [copiedId, setCopiedId] = useState(false);

  // Rename & edit state
  const [editName, setEditName] = useState(list.name);
  const [editColor, setEditColor] = useState(list.color);

  const isOwner = userRole === 'owner';
  const isViewer = userRole === 'viewer';
  const canModify = !isViewer;

  const copyId = () => {
    navigator.clipboard.writeText(list.listId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchAssignee = t.assignedTo?.some((a) => a.toLowerCase().includes(q));
        const matchAssigner = t.assignedBy?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAssignee && !matchAssigner) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, searchQuery]);

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Workspace Header */}
      <div
        className={`border rounded-2xl p-5 shadow-xl transition-colors ${
          isDarkMode
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-white border-[#E6DFD3]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className={`p-2 rounded-xl border transition ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  : 'bg-[#FAF7F2] border-[#E6DFD3] text-stone-600 hover:text-stone-900'
              }`}
              title="Back to all lists"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: list.color }} />
                <h1
                  className={`text-xl font-black tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-stone-900'
                  }`}
                >
                  {list.name}
                </h1>

                {/* Role badge */}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    isOwner
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                      : userRole === 'editor'
                      ? 'bg-pink-500/20 text-pink-500 border border-pink-500/30'
                      : 'bg-sky-500/20 text-sky-500 border border-sky-500/30'
                  }`}
                >
                  {isOwner ? <Shield className="w-3 h-3" /> : userRole === 'editor' ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {isOwner ? 'Owner' : userRole === 'editor' ? 'Editor' : 'Viewer'}
                </span>
              </div>

              {list.description && (
                <p
                  className={`text-xs mt-1 max-w-xl ${
                    isDarkMode ? 'text-slate-400' : 'text-stone-500'
                  }`}
                >
                  {list.description}
                </p>
              )}

              {/* ID and info */}
              <div
                className={`flex items-center gap-3 text-xs mt-2 ${
                  isDarkMode ? 'text-slate-400' : 'text-stone-500'
                }`}
              >
                <button
                  onClick={copyId}
                  className={`font-mono text-xs text-theme flex items-center gap-1 px-2 py-0.5 rounded-md border transition ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-800 hover:text-pink-300'
                      : 'bg-[#FAF7F2] border-[#E6DFD3] hover:text-pink-600'
                  }`}
                  title="Click to copy List ID"
                >
                  <span>ID: {list.listId}</span>
                  {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
                <span>·</span>
                <span>Owner: <strong>{list.ownerUsername}</strong></span>
                <span>·</span>
                <span>{completedCount}/{tasks.length} Done ({progressPct}%)</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
            {isOwner && (
              <button
                onClick={onOpenSharingSettings}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-[#F4EFE6] hover:bg-[#EAE3D6] text-stone-700 border-[#DCD4C5]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-pink-500" />
                <span>Sharing & Passwords</span>
              </button>
            )}

            {isViewer && (
              <button
                onClick={onOpenUpgradeDialog}
                className="btn-theme-secondary flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Upgrade to Editor</span>
              </button>
            )}

            {canModify && (
              <button
                onClick={onOpenCreateTask}
                className="btn-theme-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition active:scale-95 shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Read-Only Banner for Viewers */}
        {isViewer && (
          <div className="mt-4 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-300 text-xs flex items-center gap-2">
            <Eye className="w-4 h-4 text-sky-500 shrink-0" />
            <span>
              You are currently connected in <strong>View Only</strong> mode via the View Password. You can inspect tasks, calendar, and the Eisenhower Matrix. To edit tasks, click <strong>Upgrade to Editor</strong> above.
            </span>
          </div>
        )}

        {/* Workspace Navigation Tabs */}
        <div
          className={`flex border-b mt-5 pt-1 gap-1 overflow-x-auto ${
            isDarkMode ? 'border-slate-800' : 'border-[#E6DFD3]'
          }`}
        >
          {[
            { id: 'tasks', label: 'Tasks', count: tasks.length },
            { id: 'calendar', label: 'Calendar' },
            { id: 'matrix', label: 'Eisenhower Matrix' },
            { id: 'chat', label: 'Live Chat' },
            ...(isOwner ? [{ id: 'settings', label: 'Settings' }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition -mb-[1px] whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-theme text-theme'
                  : isDarkMode
                  ? 'border-transparent text-slate-400 hover:text-white'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}

      {/* 1. TASKS TAB */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl border ${
              isDarkMode
                ? 'bg-slate-900/60 border-slate-800'
                : 'bg-white border-[#E6DFD3]'
            }`}
          >
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks by title, description, or assignee..."
                className={`w-full rounded-xl pl-9 pr-3.5 py-2 text-xs border focus:outline-hidden transition ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-[#FAF7F2] border-[#D6CEC0] text-stone-900 placeholder-stone-400'
                }`}
              />
            </div>

            <div
              className={`flex items-center gap-1 p-1 rounded-xl border self-stretch sm:self-auto overflow-x-auto ${
                isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#FAF7F2] border-[#E6DFD3]'
              }`}
            >
              {(['all', 'todo', 'in_progress', 'completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition ${
                    statusFilter === st
                      ? isDarkMode
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-white text-stone-900 shadow-xs'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Task Cards List */}
          {filteredTasks.length === 0 ? (
            <div
              className={`border rounded-2xl p-10 text-center ${
                isDarkMode
                  ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                  : 'bg-white border-[#E6DFD3] text-stone-500'
              }`}
            >
              <p
                className={`text-sm font-semibold mb-1 ${
                  isDarkMode ? 'text-white' : 'text-stone-900'
                }`}
              >
                No tasks found
              </p>
              <p className="text-xs text-stone-400 mb-4">
                {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'This list has no tasks yet.'}
              </p>
              {canModify && (
                <button
                  onClick={onOpenCreateTask}
                  className="btn-theme-gradient px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm"
                >
                  + Create First Task
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTasks.map((t) => {
                const isDone = t.status === 'completed';
                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    className={`border rounded-2xl p-4 shadow-sm transition flex flex-col justify-between cursor-pointer ${
                      isDone ? 'opacity-50' : ''
                    } ${
                      isDarkMode
                        ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-[#E6DFD3] hover:border-[#D6CEC0]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (canModify) onToggleComplete(t);
                            }}
                            disabled={isViewer}
                            className="text-stone-400 hover:text-pink-500 transition"
                          >
                            {isDone ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>
                          <h3
                            className={`text-xs sm:text-sm font-bold truncate ${
                              isDone
                                ? 'line-through text-slate-400'
                                : isDarkMode
                                ? 'text-white'
                                : 'text-stone-900'
                            }`}
                          >
                            {t.title}
                          </h3>
                        </div>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                          style={{ backgroundColor: t.color || list.color }}
                        />
                      </div>

                      {t.description && (
                        <p
                          className={`text-xs line-clamp-2 mb-3 leading-relaxed ${
                            isDarkMode ? 'text-slate-400' : 'text-stone-500'
                          }`}
                        >
                          {t.description}
                        </p>
                      )}
                    </div>

                    <div
                      className={`pt-2 border-t flex items-center justify-between text-[11px] ${
                        isDarkMode
                          ? 'border-slate-800/80 text-slate-400'
                          : 'border-[#E6DFD3] text-stone-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {t.dueDate && <span>Due {t.dueDate}</span>}
                        <span>·</span>
                        <span>{t.durationMinutes}m</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-pink-500 font-bold">Imp {t.importance}</span>
                        <span>·</span>
                        <span className="text-purple-400 font-bold">Urg {t.urgency}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <CalendarWorkspace
          tasks={tasks}
          lists={[list]}
          onSelectTask={onSelectTask}
          onCreateTaskOnDate={canModify ? () => onOpenCreateTask() : undefined}
          userRole={userRole}
        />
      )}

      {/* 3. EISENHOWER MATRIX TAB */}
      {activeTab === 'matrix' && (
        <EisenhowerMatrix
          tasks={tasks}
          onSelectTask={onSelectTask}
          onMoveQuadrant={onMoveQuadrant}
          onToggleComplete={onToggleComplete}
          userRole={userRole}
        />
      )}

      {/* 4. CHAT TAB */}
      {activeTab === 'chat' && (
        <WorkspaceChat
          listId={list.id}
          listName={list.name}
          userRole={userRole}
          currentUserId={currentUserId}
          currentUsername={currentUsername}
          chatEnabled={list.chatEnabled}
          canUserChat={isOwner || userRole === 'editor' ? true : list.allowViewerChat}
        />
      )}

      {/* 5. OWNER SETTINGS TAB */}
      {activeTab === 'settings' && isOwner && (
        <div
          className={`border rounded-2xl p-6 shadow-xl max-w-xl space-y-5 ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800'
              : 'bg-white border-[#E6DFD3]'
          }`}
        >
          <h3
            className={`text-sm font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-white' : 'text-stone-900'
            }`}
          >
            List Configuration
          </h3>

          <div>
            <label
              className={`block text-xs font-semibold mb-1 ${
                isDarkMode ? 'text-slate-300' : 'text-stone-600'
              }`}
            >
              List Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={`w-full rounded-xl px-3 py-2 text-xs border focus:outline-hidden ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-700 text-white'
                  : 'bg-[#FAF7F2] border-[#D6CEC0] text-stone-900'
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-xs font-semibold mb-1 ${
                isDarkMode ? 'text-slate-300' : 'text-stone-600'
              }`}
            >
              Workspace Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={editColor}
                onChange={(e) => setEditColor(e.target.value)}
                className="w-8 h-8 rounded-lg bg-transparent cursor-pointer"
              />
              <span className="font-mono text-xs">{editColor}</span>
            </div>
          </div>

          <button
            onClick={() => onUpdateListNameOrColor(list.id, editName, editColor)}
            className="btn-theme-gradient px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm"
          >
            Save Changes
          </button>

          <div
            className={`pt-4 border-t ${
              isDarkMode ? 'border-slate-800' : 'border-[#E6DFD3]'
            }`}
          >
            <h4 className="text-xs font-bold text-red-500 mb-1">Danger Zone</h4>
            <p
              className={`text-[11px] mb-3 ${
                isDarkMode ? 'text-slate-400' : 'text-stone-500'
              }`}
            >
              Permanently delete this to-do list and all its associated tasks and discussion threads.
            </p>
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${list.name}"? This cannot be undone.`)) {
                  onDeleteList(list.id);
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete This List</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
