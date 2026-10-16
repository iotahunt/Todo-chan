import React from 'react';
import {
  KeyRound,
  Eye,
  Edit3,
  Shield,
  Plus,
  Trash2,
  Calendar,
  MessageSquare,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Membership, TodoList, Task } from '../../types/index.ts';
import { useTheme } from '../../context/ThemeContext.tsx';

interface ConnectedWorkspacesViewProps {
  memberships: Membership[];
  lists: TodoList[];
  tasks: Task[];
  onOpenConnectDialog: () => void;
  onUpgradeList: (listDocId: string, listName: string) => void;
  onRemoveConnection: (membershipId: string) => void;
  onOpenList: (list: TodoList) => void;
  onOpenCalendarForList: (list: TodoList) => void;
  onOpenChatForList: (list: TodoList) => void;
}

export const ConnectedWorkspacesView: React.FC<ConnectedWorkspacesViewProps> = ({
  memberships,
  lists,
  tasks,
  onOpenConnectDialog,
  onUpgradeList,
  onRemoveConnection,
  onOpenList,
  onOpenCalendarForList,
  onOpenChatForList,
}) => {
  const { themeColor, isDarkMode, isNeonMode } = useTheme();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border transition-colors ${
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
            <KeyRound className="w-5 h-5 text-pink-500" />
            <span>Connect Workspaces & Shared Lists</span>
          </h2>
          <p
            className={`text-xs mt-0.5 ${
              isDarkMode ? 'text-slate-400' : 'text-stone-500'
            }`}
          >
            Connect to shared workspaces using two-level passwords (View Password for read-only, Edit Password for full editor access).
          </p>
        </div>

        <button
          onClick={onOpenConnectDialog}
          className="btn-theme-gradient flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition active:scale-95 self-start sm:self-auto shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Connect New To-Do List</span>
        </button>
      </div>

      {/* Connection Cards Grid */}
      {memberships.length === 0 ? (
        <div
          className={`border rounded-2xl p-12 text-center transition-colors ${
            isDarkMode
              ? 'bg-slate-900/40 border-slate-800 text-slate-400'
              : 'bg-white border-[#E6DFD3] text-stone-500'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border text-pink-500 ${
              isDarkMode
                ? 'bg-slate-800/80 border-slate-700'
                : 'bg-[#FAF7F2] border-[#E6DFD3]'
            }`}
          >
            <KeyRound className="w-7 h-7" />
          </div>
          <h3
            className={`text-base font-bold mb-1 ${
              isDarkMode ? 'text-white' : 'text-stone-900'
            }`}
          >
            No Connected Workspaces Yet
          </h3>
          <p className="text-xs max-w-sm mx-auto mb-5 leading-relaxed">
            Have a friend's To-Do List ID and View/Edit Password? Connect below to collaborate in real-time or view their schedule.
          </p>
          <button
            onClick={onOpenConnectDialog}
            className="btn-theme-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm"
          >
            Connect With List ID & Password
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberships.map((m) => {
            const listObj = lists.find((l) => l.id === m.listDocId);
            const listTasks = tasks.filter((t) => t.listId === m.listDocId);
            const completedCount = listTasks.filter((t) => t.status === 'completed').length;
            const pct = listTasks.length > 0 ? Math.round((completedCount / listTasks.length) * 100) : 0;
            const isViewer = m.role === 'viewer';
            const isOwner = m.role === 'owner';
            const isRevoked = !!m.revoked;

            return (
              <div
                key={m.id}
                className={`border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all ${
                  isRevoked
                    ? 'border-red-500/50 opacity-60'
                    : isDarkMode
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-[#E6DFD3] hover:border-[#D6CEC0]'
                }`}
              >
                <div>
                  {/* Top Bar with Role Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border text-pink-500 ${
                        isDarkMode
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-[#FAF7F2] border-[#E6DFD3]'
                      }`}
                    >
                      ID: {m.listId}
                    </span>

                    {isRevoked ? (
                      <span className="text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        Access Revoked
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                          isOwner
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                            : m.role === 'editor'
                            ? 'bg-pink-500/10 text-pink-500 border-pink-500/30'
                            : 'bg-sky-500/10 text-sky-500 border-sky-500/30'
                        }`}
                      >
                        {isOwner ? (
                          <Shield className="w-3 h-3" />
                        ) : m.role === 'editor' ? (
                          <Edit3 className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                        <span>{isOwner ? 'Owner' : m.role === 'editor' ? 'Editor Access' : 'View Only Access'}</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="mb-2">
                    <h3
                      className={`text-sm font-bold flex items-center gap-2 ${
                        isDarkMode ? 'text-white' : 'text-stone-900'
                      }`}
                    >
                      {listObj && (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: listObj.color }}
                        />
                      )}
                      <span className="truncate">{m.listName}</span>
                    </h3>
                  </div>

                  {/* Progress indicator */}
                  <div
                    className={`mt-4 pt-3 border-t ${
                      isDarkMode ? 'border-slate-800' : 'border-[#E6DFD3]'
                    }`}
                  >
                    <div
                      className={`flex justify-between text-xs mb-1 ${
                        isDarkMode ? 'text-slate-400' : 'text-stone-500'
                      }`}
                    >
                      <span>{completedCount}/{listTasks.length} Completed</span>
                      <span className="font-mono">{pct}%</span>
                    </div>
                    <div
                      className={`w-full h-1.5 rounded-full overflow-hidden ${
                        isDarkMode ? 'bg-slate-800' : 'bg-stone-200'
                      }`}
                    >
                      <div
                        className="bg-pink-500 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div
                  className={`mt-4 pt-3 border-t flex items-center justify-between gap-2 ${
                    isDarkMode ? 'border-slate-800' : 'border-[#E6DFD3]'
                  }`}
                >
                  {isViewer && !isRevoked && (
                    <button
                      onClick={() => onUpgradeList(m.listDocId, m.listName)}
                      className="text-xs font-semibold text-pink-500 hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Enter 2nd Password</span>
                    </button>
                  )}

                  {listObj ? (
                    <button
                      onClick={() => onOpenList(listObj)}
                      className="text-xs font-bold text-pink-500 hover:underline flex items-center gap-1"
                    >
                      <span>Open Workspace</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-stone-400">Workspace data syncing</span>
                  )}

                  {!isOwner && (
                    <button
                      onClick={() => onRemoveConnection(m.id)}
                      className="text-stone-400 hover:text-red-500 p-1 rounded-lg transition"
                      title="Disconnect from this list"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
