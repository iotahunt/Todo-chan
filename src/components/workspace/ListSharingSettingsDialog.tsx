import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Shield,
  KeyRound,
  Users,
  Eye,
  Edit3,
  MessageSquare,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Share2,
} from 'lucide-react';
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase.ts';
import { TodoList, Membership } from '../../types/index.ts';

interface ListSharingSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  list: TodoList;
  sessionToken: string | null;
  onListUpdated: () => void;
}

export const ListSharingSettingsDialog: React.FC<ListSharingSettingsDialogProps> = ({
  isOpen,
  onClose,
  list,
  sessionToken,
  onListUpdated,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [newViewPassword, setNewViewPassword] = useState('');
  const [newEditPassword, setNewEditPassword] = useState('');
  const [revokeExisting, setRevokeExisting] = useState(false);
  const [isUpdatingPasswords, setIsUpdatingPasswords] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sharing permissions state
  const [allowViewOnly, setAllowViewOnly] = useState(list.allowViewOnlySharing ?? true);
  const [allowEditing, setAllowEditing] = useState(list.allowEditingSharing ?? true);
  const [allowViewerChat, setAllowViewerChat] = useState(list.allowViewerChat ?? false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Members list
  const [members, setMembers] = useState<Membership[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const viewPassDisplay = list.viewPassword || (list as any).viewPasswordHash || 'view123';
  const editPassDisplay = list.editPassword || (list as any).editPasswordHash || 'edit456';

  useEffect(() => {
    if (!isOpen) return;

    // Listen to real-time members for this list
    const q = query(collection(db, 'memberships'), where('listDocId', '==', list.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listMembers: Membership[] = [];
      snapshot.forEach((docSnap) => {
        listMembers.push(docSnap.data() as Membership);
      });
      setMembers(listMembers);
      setLoadingMembers(false);
    });

    return () => unsubscribe();
  }, [isOpen, list.id]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleCopyFullInvitation = () => {
    const inviteText = `📋 Join my Todo-chan To-Do List: "${list.name}"\n` +
      `🔑 Unique List Code: ${list.listId}\n` +
      `👁️ 1st Step Password (View-Only): ${viewPassDisplay}\n` +
      `✏️ 2nd Step Password (Full Editing): ${editPassDisplay}\n\n` +
      `Open Todo-chan -> Connect Workspace -> Enter Code & Password!`;
    copyToClipboard(inviteText, 'fullInvite');
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViewPassword.trim() && !newEditPassword.trim()) return;
    setIsUpdatingPasswords(true);
    setPasswordMsg(null);

    const cleanV = newViewPassword.trim();
    const cleanE = newEditPassword.trim();

    try {
      const listRef = doc(db, 'lists', list.id);
      const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
      if (cleanV) {
        updates.viewPassword = cleanV;
        updates.viewPasswordHash = cleanV;
      }
      if (cleanE) {
        updates.editPassword = cleanE;
        updates.editPasswordHash = cleanE;
      }

      await updateDoc(listRef, updates);

      // Backend sync
      try {
        fetch('/api/lists/update-passwords', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken || ''}`,
          },
          body: JSON.stringify({
            listDocId: list.id,
            viewPassword: cleanV || undefined,
            editPassword: cleanE || undefined,
            revokeExistingGrants: revokeExisting,
          }),
        }).catch(() => {});
      } catch (err) {
        // ignore
      }

      setPasswordMsg({
        type: 'success',
        text: 'Passwords updated successfully! Your list now uses the updated 2-step credentials.',
      });
      setNewViewPassword('');
      setNewEditPassword('');
      onListUpdated();
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Error updating passwords.' });
    } finally {
      setIsUpdatingPasswords(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const listRef = doc(db, 'lists', list.id);
      await updateDoc(listRef, {
        allowViewOnlySharing: allowViewOnly,
        allowEditingSharing: allowEditing,
        allowViewerChat: allowViewerChat,
        updatedAt: new Date().toISOString(),
      });
      onListUpdated();
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-theme" />
              <span>Share To-Do List & 2-Step Passwords</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Share "{list.name}" using its unique code and tiered access passwords.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Quick Share Invitation Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Unique To-Do List Code
                </span>
                <span className="font-mono text-2xl font-black text-theme tracking-widest">
                  {list.listId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(list.listId, 'listId')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition border border-slate-700"
                >
                  {copiedField === 'listId' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Code</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCopyFullInvitation}
                  className="btn-theme-gradient flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition active:scale-95"
                >
                  {copiedField === 'fullInvite' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied Invite!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Copy Full Invite</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Passwords grid display */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {/* Step 1 View Password */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5 mb-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>1st Step: View Password</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {viewPassDisplay}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Read-Only access</span>
                </div>
                <button
                  onClick={() => copyToClipboard(viewPassDisplay, 'viewPass')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Copy View Password"
                >
                  {copiedField === 'viewPass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Step 2 Edit Password */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-theme flex items-center gap-1.5 mb-1">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>2nd Step: Edit Password</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {editPassDisplay}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Full Editing access</span>
                </div>
                <button
                  onClick={() => copyToClipboard(editPassDisplay, 'editPass')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Copy Edit Password"
                >
                  {copiedField === 'editPass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Change Passwords Form */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-2">
              <KeyRound className="w-4 h-4 text-theme" />
              <span>Update 2-Step Passwords</span>
            </h3>

            {passwordMsg && (
              <div
                className={`mb-3 p-2.5 rounded-lg text-xs ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                    : 'bg-red-950/60 border border-red-800 text-red-300'
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-sky-300 flex items-center gap-1 mb-1">
                    <Eye className="w-3 h-3" />
                    <span>New 1st Step View Password</span>
                  </label>
                  <input
                    type="text"
                    value={newViewPassword}
                    onChange={(e) => setNewViewPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-theme flex items-center gap-1 mb-1">
                    <Edit3 className="w-3 h-3" />
                    <span>New 2nd Step Edit Password</span>
                  </label>
                  <input
                    type="text"
                    value={newEditPassword}
                    onChange={(e) => setNewEditPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPasswords || (!newViewPassword.trim() && !newEditPassword.trim())}
                  className="btn-theme-gradient px-4 py-2 text-xs font-bold text-white rounded-xl transition active:scale-95 disabled:opacity-50"
                >
                  {isUpdatingPasswords ? 'Updating...' : 'Save New Passwords'}
                </button>
              </div>
            </form>
          </div>

          {/* Connected Members */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Connected Members ({members.length})</span>
            </h3>

            {loadingMembers ? (
              <div className="py-4 text-center text-xs text-slate-500">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">
                No members connected yet. Share the code and passwords above!
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{m.username}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          m.role === 'owner'
                            ? 'bg-amber-500/20 text-amber-300'
                            : m.role === 'editor'
                            ? 'bg-pink-500/20 text-pink-300'
                            : 'bg-sky-500/20 text-sky-300'
                        }`}
                      >
                        {m.role === 'owner' ? 'Owner' : m.role === 'editor' ? 'Editor (2nd Step)' : 'Viewer (1st Step)'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 mt-6 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
