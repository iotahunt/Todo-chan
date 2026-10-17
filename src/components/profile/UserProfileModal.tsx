import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  CheckSquare,
  Trash2,
  X,
  Palette,
  ShieldAlert,
  Edit2,
  Save,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { Task, TodoList } from '../../types/index.ts';
import todochanMascotImg from '../../assets/images/todochan_winking_clean.png';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  lists: TodoList[];
  onOpenColorWheel: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  tasks,
  lists,
  onOpenColorWheel,
}) => {
  const { user, firebaseUser, updateProfileName, logout, deleteAccount } = useAuth();
  const { isDarkMode, themeColor } = useTheme();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.username || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasksCount = tasks.filter((t) => t.status !== 'completed').length;

  const handleSaveName = async () => {
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      setNameError('Name must be at least 2 characters.');
      return;
    }
    setIsSavingName(true);
    const res = await updateProfileName(nameInput.trim());
    setIsSavingName(false);
    if (res.success) {
      setIsEditingName(false);
      setNameError(null);
    } else {
      setNameError(res.error || 'Failed to update name.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput.trim().toLowerCase() !== 'delete') {
      setDeleteError('Please type DELETE to confirm.');
      return;
    }
    setIsDeleting(true);
    const res = await deleteAccount();
    setIsDeleting(false);
    if (res.success) {
      onClose();
    } else {
      setDeleteError(res.error || 'Failed to delete account.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className={`w-full max-w-lg rounded-3xl border p-6 sm:p-7 shadow-2xl relative overflow-hidden transition-colors max-h-[90vh] overflow-y-auto ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#E6DFD3] text-stone-900'
        }`}
        style={{
          boxShadow: 'var(--neon-card-glow)',
          borderColor: 'rgba(var(--accent-rgb), 0.5)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-1.5 rounded-full transition ${
            isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-stone-200 dark:border-slate-800">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl border-2 flex items-center justify-center p-1 bg-black/40 overflow-hidden"
              style={{
                borderColor: 'var(--accent-color)',
                boxShadow: 'var(--neon-card-glow)',
              }}
            >
              <img
                src={todochanMascotImg}
                alt="Profile Mascot"
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_#ff69b4]"
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="px-2 py-1 rounded-lg text-sm app-input flex-1 font-bold"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    className="p-1.5 rounded-lg btn-theme-primary text-white"
                    title="Save Name"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                      setNameInput(user.username);
                    }}
                    className="p-1.5 rounded-lg border text-stone-400 hover:text-stone-600"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black truncate">{user.username}</h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 rounded-lg text-theme hover:bg-pink-500/10 transition"
                    title="Edit Name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {nameError && <p className="text-[11px] text-red-400 mt-0.5">{nameError}</p>}

            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-slate-400 mt-1 truncate">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{user.email || firebaseUser?.email || 'No email associated'}</span>
              {user.emailVerified || firebaseUser?.emailVerified ? (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded-full border border-amber-500/30">
                  <AlertCircle className="w-2.5 h-2.5" />
                  Unverified
                </span>
              )}
            </div>

            <p className="text-[11px] text-stone-400 dark:text-slate-500 mt-0.5">
              Account ID: <span className="font-mono text-[10px]">{user.id.substring(0, 10)}...</span>
            </p>
          </div>
        </div>

        {/* Profile Monitor Metrics */}
        <div className="mb-6">
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
            Activity & Productivity Monitor
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            <div className={`p-3 rounded-2xl border text-center transition ${isDarkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-stone-50 border-[#E6DFD3]'}`}>
              <CheckSquare className="w-4 h-4 text-theme mx-auto mb-1" />
              <div className="text-lg font-black font-mono">{completedTasksCount}</div>
              <div className="text-[10px] text-stone-400 font-medium">Completed</div>
            </div>

            <div className={`p-3 rounded-2xl border text-center transition ${isDarkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-stone-50 border-[#E6DFD3]'}`}>
              <Calendar className="w-4 h-4 text-theme mx-auto mb-1" />
              <div className="text-lg font-black font-mono">{pendingTasksCount}</div>
              <div className="text-[10px] text-stone-400 font-medium">Pending Tasks</div>
            </div>

            <div className={`p-3 rounded-2xl border text-center transition ${isDarkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-stone-50 border-[#E6DFD3]'}`}>
              <Layers className="w-4 h-4 text-theme mx-auto mb-1" />
              <div className="text-lg font-black font-mono">{lists.length}</div>
              <div className="text-[10px] text-stone-400 font-medium">Workspaces</div>
            </div>
          </div>
        </div>

        {/* Theme Settings Shortcut */}
        <div className="mb-6">
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-stone-50 border-[#E6DFD3]'}`}>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full border-2 shadow-xs" style={{ backgroundColor: themeColor, borderColor: 'white' }} />
              <div>
                <div className="text-xs font-bold">Theme Color Wheel</div>
                <div className="text-[10px] text-stone-400">Current accent: {themeColor} (Baby Pink default)</div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenColorWheel();
              }}
              className="btn-theme-secondary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Customize</span>
            </button>
          </div>
        </div>

        {/* Account Deletion Section */}
        <div className="pt-4 border-t border-stone-200 dark:border-slate-800">
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Delete Account</span>
                </div>
                <p className="text-[11px] text-stone-400">Permanently erase your account, profile, and lists</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 border border-red-500/40 hover:bg-red-500/10 transition"
              >
                Delete Account
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-3">
              <div className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" />
                <span>Confirm Permanent Deletion</span>
              </div>
              <p className="text-[11px] text-red-400/90 leading-relaxed">
                This action cannot be undone. All your personal tasks, wellness records, and workspaces will be deleted.
                Type <strong>DELETE</strong> below to confirm.
              </p>
              <input
                type="text"
                placeholder="Type DELETE"
                value={deleteInput}
                onChange={(e) => {
                  setDeleteInput(e.target.value);
                  setDeleteError(null);
                }}
                className="w-full px-3 py-1.5 rounded-xl text-xs border border-red-500/40 bg-black/20 text-white font-mono"
              />
              {deleteError && <p className="text-[11px] text-red-400">{deleteError}</p>}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteInput.trim().toLowerCase() !== 'delete'}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-500 transition disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteInput('');
                    setDeleteError(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
