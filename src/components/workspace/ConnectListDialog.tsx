import React, { useState } from 'react';
import { KeyRound, Eye, Edit3, X, AlertCircle, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { db } from '../../lib/firebase.ts';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

interface ConnectListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (connected: { listId: string; listDocId: string; role: string; listName: string }) => void;
  sessionToken?: string | null;
}

export const ConnectListDialog: React.FC<ConnectListDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  sessionToken: propSessionToken,
}) => {
  const { sessionToken: authSessionToken, user } = useAuth();
  const sessionToken = propSessionToken || authSessionToken;

  const [listId, setListId] = useState('');
  const [viewPassword, setViewPassword] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanListId = listId.trim().toUpperCase();
    const cleanView = viewPassword.trim();
    const cleanEdit = editPassword.trim();

    if (!cleanListId) {
      setError('Please provide the Unique To-Do List Code (e.g. 839201).');
      return;
    }

    if (!cleanView && !cleanEdit) {
      setError('Please provide at least one password (either 1st step View Password or 2nd step Edit Password).');
      return;
    }

    if (!user) {
      setError('You must be signed in to connect to a list.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Try querying Firestore directly for highest speed and reliability
      const listsColl = collection(db, 'lists');
      const q = query(listsColl, where('listId', '==', cleanListId));
      let snap = await getDocs(q);

      // If uppercase didn't match, try case-insensitive / raw
      if (snap.empty) {
        const qRaw = query(listsColl, where('listId', '==', listId.trim()));
        snap = await getDocs(qRaw);
      }

      if (snap.empty) {
        setError(`No To-Do List found with Code "${cleanListId}". Please check with the owner.`);
        setLoading(false);
        return;
      }

      const targetDoc = snap.docs[0];
      const listData = targetDoc.data();

      if (listData.isArchived) {
        setError('This To-Do List has been archived by the owner.');
        setLoading(false);
        return;
      }

      let determinedRole: 'editor' | 'viewer' | null = null;

      // Check if user is the owner
      if (listData.ownerId === user.id) {
        determinedRole = 'editor';
      }

      // Check Edit Password (Level 2)
      if (!determinedRole && cleanEdit) {
        const matchPlain = listData.editPassword && listData.editPassword === cleanEdit;
        const matchHash = listData.editPasswordHash && listData.editPasswordHash === cleanEdit;
        if (matchPlain || matchHash) {
          determinedRole = 'editor';
        }
      }

      // Check View Password (Level 1)
      if (!determinedRole && cleanView) {
        const matchPlain = listData.viewPassword && listData.viewPassword === cleanView;
        const matchHash = listData.viewPasswordHash && listData.viewPasswordHash === cleanView;
        if (matchPlain || matchHash) {
          determinedRole = 'viewer';
        }
      }

      // Also handle case where user entered edit password in view field or vice versa
      if (!determinedRole && cleanView) {
        if (listData.editPassword === cleanView || listData.editPasswordHash === cleanView) {
          determinedRole = 'editor';
        }
      }
      if (!determinedRole && cleanEdit) {
        if (listData.viewPassword === cleanEdit || listData.viewPasswordHash === cleanEdit) {
          determinedRole = 'viewer';
        }
      }

      // Fallback check: if backend API can verify PBKDF2 hash
      if (!determinedRole) {
        try {
          const apiRes = await fetch('/api/lists/connect', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sessionToken || ''}`,
              'x-user-id': user.id,
              'x-username': user.username,
            },
            body: JSON.stringify({
              listId: cleanListId,
              viewPassword: cleanView || undefined,
              editPassword: cleanEdit || undefined,
            }),
          });
          const apiData = await apiRes.json();
          if (apiRes.ok && apiData.role) {
            determinedRole = apiData.role;
          }
        } catch (apiErr) {
          // Ignore API error if failed
        }
      }

      if (!determinedRole) {
        setError('Access denied: Invalid password. Please verify the 1st step (View) or 2nd step (Edit) password.');
        setLoading(false);
        return;
      }

      // Record membership in Firestore
      const memId = `${targetDoc.id}_${user.id}`;
      await setDoc(doc(db, 'memberships', memId), {
        id: memId,
        userId: user.id,
        username: user.username,
        listId: listData.listId,
        listDocId: targetDoc.id,
        listName: listData.name,
        role: determinedRole,
        canChat: determinedRole === 'editor' || !!listData.allowViewerChat,
        grantedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        revoked: false,
      }, { merge: true });

      onSuccess({
        listId: listData.listId,
        listDocId: targetDoc.id,
        role: determinedRole,
        listName: listData.name,
      });
      onClose();
    } catch (err: any) {
      console.error('Error connecting to list:', err);
      setError(err.message || 'Failed to connect. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-theme" />
              <span>Connect Shared To-Do List</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter the unique list code and 2-step password to access a workspace.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Access Levels Explanation Banner */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 mb-1">
              <Eye className="w-3.5 h-3.5" />
              <span>1st Step: View Password</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Grants <strong>Read-Only</strong> access. You can view all tasks, Eisenhower Matrix, and calendar without editing.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-theme mb-1">
              <Edit3 className="w-3.5 h-3.5" />
              <span>2nd Step: Edit Password</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Grants <strong>Full Editing</strong> access. You can add tasks, edit details, move quadrants, check off tasks & chat.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* List ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Unique To-Do List Code <span className="text-theme">*</span>
            </label>
            <input
              type="text"
              value={listId}
              onChange={(e) => setListId(e.target.value.trim().toUpperCase())}
              placeholder="e.g. 839201"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono tracking-widest uppercase focus:outline-hidden focus:border-theme transition font-bold"
            />
          </div>

          {/* View Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                1st Step: View Password (Read-Only)
              </label>
              <span className="text-[10px] text-slate-500">For inspection</span>
            </div>
            <div className="relative">
              <Eye className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={viewPassword}
                onChange={(e) => setViewPassword(e.target.value)}
                placeholder="Enter View Password"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-theme transition"
              />
            </div>
          </div>

          {/* Edit Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                2nd Step: Edit Password (Full Editing Access)
              </label>
              <span className="text-[10px] text-slate-500">For adding/editing tasks</span>
            </div>
            <div className="relative">
              <Edit3 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Enter Edit Password"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-theme transition"
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-theme shrink-0 mt-0.5" />
            <span>
              If you only have the 1st step password, you can connect as Viewer and later enter the 2nd step password to upgrade to Editor.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-theme-gradient flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl transition active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span>Connecting...</span>
              ) : (
                <>
                  <span>Connect To-Do List</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
