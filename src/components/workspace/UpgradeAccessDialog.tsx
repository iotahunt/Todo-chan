import React, { useState } from 'react';
import { Edit3, Lock, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { db } from '../../lib/firebase.ts';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface UpgradeAccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  listDocId: string;
  listName: string;
  onSuccess: () => void;
  sessionToken?: string | null;
}

export const UpgradeAccessDialog: React.FC<UpgradeAccessDialogProps> = ({
  isOpen,
  onClose,
  listDocId,
  listName,
  onSuccess,
  sessionToken: propSessionToken,
}) => {
  const { sessionToken: authSessionToken, user } = useAuth();
  const sessionToken = propSessionToken || authSessionToken;

  const [editPassword, setEditPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPassword = editPassword.trim();
    if (!cleanPassword) {
      setError('Please provide the 2nd step Edit Password.');
      return;
    }

    if (!user) {
      setError('You must be signed in to upgrade access.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Check list document in Firestore directly
      const listRef = doc(db, 'lists', listDocId);
      const listSnap = await getDoc(listRef);

      if (!listSnap.exists()) {
        setError('To-Do List not found.');
        setLoading(false);
        return;
      }

      const listData = listSnap.data();
      const matchPlain = listData.editPassword && listData.editPassword === cleanPassword;
      const matchHash = listData.editPasswordHash && listData.editPasswordHash === cleanPassword;

      let verified = matchPlain || matchHash;

      // Also try API if direct didn't match
      if (!verified) {
        try {
          const apiRes = await fetch('/api/lists/upgrade-access', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${sessionToken || ''}`,
              'x-user-id': user.id,
              'x-username': user.username,
            },
            body: JSON.stringify({
              listDocId,
              editPassword: cleanPassword,
            }),
          });
          const apiData = await apiRes.json();
          if (apiRes.ok && apiData.success) {
            verified = true;
          }
        } catch (apiErr) {
          // ignore
        }
      }

      if (!verified) {
        setError('Incorrect 2nd step Edit Password. Please verify with the list owner.');
        setLoading(false);
        return;
      }

      // Update membership in Firestore
      const memId = `${listDocId}_${user.id}`;
      await updateDoc(doc(db, 'memberships', memId), {
        role: 'editor',
        canChat: true,
        updatedAt: new Date().toISOString(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to upgrade access:', err);
      setError(err.message || 'Failed to upgrade access.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-theme-soft text-theme flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Upgrade to Editor</h3>
              <p className="text-xs text-slate-400">"{listName}"</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-300 leading-relaxed">
          You currently have <strong>View Only</strong> (1st Step) access. Enter the <strong>2nd Step Edit Password</strong> to upgrade to Editor and unlock task creation, task editing, Eisenhower matrix updates, and real-time collaboration.
        </p>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpgrade} className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-theme" />
                <span>2nd Step Edit Password</span>
              </label>
            </div>
            <input
              type="text"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Enter 2nd step edit password"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-hidden focus:border-theme"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-theme-gradient px-4 py-2 text-xs font-bold text-white rounded-xl transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Upgrade Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
