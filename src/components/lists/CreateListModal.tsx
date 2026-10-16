import React, { useState } from 'react';
import { X, Lock, KeyRound, Eye, Edit3, Sparkles, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { TodoList } from '../../types/index.ts';
import { db } from '../../lib/firebase.ts';
import { doc, setDoc } from 'firebase/firestore';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (list: TodoList) => void;
  sessionToken?: string | null;
}

export const CreateListModal: React.FC<CreateListModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  sessionToken: propSessionToken,
}) => {
  const { sessionToken: authSessionToken, user } = useAuth();
  const { isDarkMode, themeColor } = useTheme();
  const sessionToken = propSessionToken || authSessionToken;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#ff69b4');
  
  // 2-Step Password default generators
  const [viewPassword, setViewPassword] = useState('view' + Math.floor(100 + Math.random() * 900));
  const [editPassword, setEditPassword] = useState('edit' + Math.floor(100 + Math.random() * 900));
  
  const [allowViewOnly, setAllowViewOnly] = useState(true);
  const [allowEditing, setAllowEditing] = useState(true);
  const [allowViewerChat, setAllowViewerChat] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGeneratePasswords = () => {
    setViewPassword('view' + Math.floor(100 + Math.random() * 900));
    setEditPassword('edit' + Math.floor(100 + Math.random() * 900));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for your To-Do List.');
      return;
    }

    if (!user) {
      setError('You must be logged in to create a list.');
      return;
    }

    setLoading(true);
    setError(null);

    const cleanName = name.trim();
    const cleanDesc = description.trim();
    const cleanViewPass = viewPassword.trim() || 'view' + Math.floor(100 + Math.random() * 900);
    const cleanEditPass = editPassword.trim() || 'edit' + Math.floor(100 + Math.random() * 900);

    // Generate unique 6-character clean List ID (e.g. '839201')
    let listId = '';
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    for (let i = 0; i < 6; i++) {
      listId += chars[Math.floor(Math.random() * chars.length)];
    }

    const listDocId = 'lst_' + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 8);
    const membershipId = `${listDocId}_${user.id}`;
    const nowIso = new Date().toISOString();

    const newListData: TodoList = {
      id: listDocId,
      listId,
      name: cleanName,
      description: cleanDesc,
      color,
      ownerId: user.id,
      ownerUsername: user.username,
      viewPassword: cleanViewPass,
      editPassword: cleanEditPass,
      viewPasswordHash: cleanViewPass,
      editPasswordHash: cleanEditPass,
      allowViewOnlySharing: allowViewOnly,
      allowEditingSharing: allowEditing,
      allowViewerChat,
      allowViewerNotes: true,
      allowViewerComments: true,
      chatEnabled,
      isArchived: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      role: 'owner',
    };

    try {
      // 1. Direct Firestore write guarantees 100% resilience and immediate realtime sync
      await setDoc(doc(db, 'lists', listDocId), {
        ...newListData,
      });

      await setDoc(doc(db, 'memberships', membershipId), {
        id: membershipId,
        listId,
        listDocId,
        listName: cleanName,
        userId: user.id,
        username: user.username,
        role: 'owner',
        canChat: true,
        grantedAt: nowIso,
        revoked: false,
      });

      onCreated(newListData);
      onClose();
    } catch (err: any) {
      console.error('Failed to create to-do list in Firestore:', err);
      setError(err.message || 'Failed to create list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const colorPresets = ['#ff69b4', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl my-8 transition-colors ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-[#E6DFD3] text-stone-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-4 border-b ${
            isDarkMode ? 'border-slate-800' : 'border-[#E6DFD3]'
          }`}
        >
          <div>
            <h2
              className={`text-lg font-bold flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-stone-900'
              }`}
            >
              <Sparkles className="w-5 h-5 text-pink-500" />
              <span>Create New To-Do List</span>
            </h2>
            <p
              className={`text-xs mt-0.5 ${
                isDarkMode ? 'text-slate-400' : 'text-stone-500'
              }`}
            >
              Create a workspace to organize your tasks with 2-step password sharing.
            </p>
          </div>
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

        {/* Notice: Lists vs Tasks mental model */}
        <div
          className={`mt-4 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
            isDarkMode
              ? 'bg-slate-950/60 border-slate-800 text-slate-300'
              : 'bg-[#FAF7F2] border-[#E6DFD3] text-stone-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
          <div>
            <strong>To-Do Lists vs Tasks:</strong> A To-Do List is a workspace folder (e.g. Work, College, Project). Once created, you will enter tasks inside it, and each task will map to the <strong>Eisenhower Matrix</strong> and <strong>Calendar</strong>!
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          {/* List Name */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${
                isDarkMode ? 'text-slate-300' : 'text-stone-600'
              }`}
            >
              To-Do List Name <span className="text-pink-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. College Semester, Personal Goals, Work Sprint..."
              required
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold border focus:outline-hidden transition ${
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
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What tasks and milestones are kept in this to-do list?"
              className={`w-full rounded-xl px-3.5 py-2 text-xs border focus:outline-hidden resize-none transition ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-[#FAF7F2] border-[#D6CEC0] text-stone-900 placeholder-stone-400'
              }`}
            />
          </div>

          {/* Color */}
          <div>
            <label
              className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                isDarkMode ? 'text-slate-300' : 'text-stone-600'
              }`}
            >
              List Accent Color
            </label>
            <div className="flex items-center gap-2">
              {colorPresets.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-xl border border-white/20 transition transform hover:scale-110 flex items-center justify-center"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <span className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                </button>
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer p-0"
                title="Choose custom color"
              />
            </div>
          </div>

          {/* Two-Level Passwords Setup */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isDarkMode
                ? 'bg-slate-950/80 border-slate-800'
                : 'bg-[#FAF7F2] border-[#E6DFD3]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isDarkMode ? 'text-slate-200' : 'text-stone-700'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-pink-500" />
                <span>2-Step Password Protection</span>
              </span>
              <button
                type="button"
                onClick={handleGeneratePasswords}
                className="text-[11px] text-pink-500 hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Generate New</span>
              </button>
            </div>

            <p
              className={`text-[11px] ${
                isDarkMode ? 'text-slate-400' : 'text-stone-500'
              }`}
            >
              When sharing this To-Do List with its unique code, guests can use either password depending on the access you grant:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Step 1: View Password */}
              <div
                className={`p-3 rounded-xl border ${
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E6DFD3]'
                }`}
              >
                <label className="text-xs font-bold text-sky-500 flex items-center gap-1.5 mb-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>1st Step: View Password</span>
                </label>
                <input
                  type="text"
                  value={viewPassword}
                  onChange={(e) => setViewPassword(e.target.value)}
                  placeholder="e.g. view123"
                  className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono border ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-[#FAF7F2] border-[#D6CEC0] text-stone-900'
                  }`}
                />
                <span
                  className={`text-[10px] mt-1 block ${
                    isDarkMode ? 'text-slate-400' : 'text-stone-500'
                  }`}
                >
                  <strong>Read-Only:</strong> Can view tasks, matrix & calendar without editing.
                </span>
              </div>

              {/* Step 2: Edit Password */}
              <div
                className={`p-3 rounded-xl border ${
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#E6DFD3]'
                }`}
              >
                <label className="text-xs font-bold text-pink-500 flex items-center gap-1.5 mb-1">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>2nd Step: Edit Password</span>
                </label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="e.g. edit456"
                  className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono border ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-700 text-white'
                      : 'bg-[#FAF7F2] border-[#D6CEC0] text-stone-900'
                  }`}
                />
                <span
                  className={`text-[10px] mt-1 block ${
                    isDarkMode ? 'text-slate-400' : 'text-stone-500'
                  }`}
                >
                  <strong>Full Editing:</strong> Can add, edit, and check off tasks & move quadrants.
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div
            className={`flex items-center justify-end gap-3 pt-3 border-t ${
              isDarkMode ? 'border-slate-800' : 'border-[#E6DFD3]'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-medium rounded-xl transition ${
                isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-[#F4EFE6]'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-theme-gradient px-6 py-2.5 text-xs font-bold text-white rounded-xl transition active:scale-95 disabled:opacity-50 shadow-md"
            >
              {loading ? 'Creating List...' : 'Create To-Do List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
