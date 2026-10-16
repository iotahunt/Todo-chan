import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  CheckCircle,
  Circle,
  FileText,
  MessageSquare,
  Send,
  Edit2,
  Trash2,
  Lock,
  Eye,
  Sliders,
  Tag,
  Share2,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../lib/firebase.ts';
import { Task, Comment, AccessLevel } from '../../types/index.ts';

interface TaskDetailsPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleComplete: (task: Task) => void;
  userRole: AccessLevel;
  currentUsername: string;
  currentUserId: string;
  allowViewerNotes?: boolean;
  allowViewerComments?: boolean;
}

export const TaskDetailsPanel: React.FC<TaskDetailsPanelProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
  userRole,
  currentUsername,
  currentUserId,
  allowViewerNotes = true,
  allowViewerComments = true,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSending, setIsSending] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement | null>(null);

  const isViewer = userRole === 'viewer';
  const canModify = userRole === 'owner' || userRole === 'editor';

  // Listen to comments in real time
  useEffect(() => {
    if (!task || !isOpen) return;

    const q = query(
      collection(db, 'comments'),
      where('taskId', '==', task.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Comment[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setComments(list);
    });

    return () => unsubscribe();
  }, [task, isOpen]);

  useEffect(() => {
    if (comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  if (!isOpen || !task) return null;

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isViewer) return;
    setIsSending(true);

    try {
      await addDoc(collection(db, 'comments'), {
        taskId: task.id,
        listId: task.listId,
        authorId: currentUserId,
        authorUsername: currentUsername,
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
      });
      setNewComment('');
    } catch (err) {
      console.error('Error sending comment:', err);
    } finally {
      setIsSending(false);
    }
  };

  const isCompleted = task.status === 'completed';
  const canSeeNotes = !task.notesPrivate || canModify || task.creatorId === currentUserId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 my-8">
        {/* Header & Status Indicator */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => canModify && onToggleComplete(task)}
              disabled={isViewer}
              className={`p-1 rounded-full transition ${
                isViewer ? 'opacity-60 cursor-not-allowed' : 'hover:scale-110 cursor-pointer'
              }`}
              title={isViewer ? 'View-only mode: Cannot complete task' : isCompleted ? 'Reopen task' : 'Mark completed'}
            >
              {isCompleted ? (
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              ) : (
                <Circle className="w-6 h-6 text-slate-500 hover:text-theme" />
              )}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: task.color }} />
                <h2 className={`text-base font-bold text-white ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                  {task.title}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span className="capitalize">{task.status.replace('_', ' ')}</span>
                <span>·</span>
                <span>Quadrant {task.matrixQuadrant.toUpperCase()}</span>
                {isViewer && (
                  <>
                    <span>·</span>
                    <span className="text-[10px] bg-slate-800 text-sky-300 px-2 py-0.5 rounded-md border border-sky-500/30 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      View Only
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {canModify && (
              <>
                <button
                  onClick={() => onEdit(task)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Edit task"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Description */}
          {task.description && (
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {task.description}
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block mb-0.5">DATES</span>
              <span className="font-semibold text-slate-200">
                {task.dueDate ? `Due ${task.dueDate}` : 'No due date'}
              </span>
              {task.startDate && <span className="text-[10px] text-slate-500 block">Start: {task.startDate}</span>}
            </div>

            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block mb-0.5">PRIORITY MATRIX</span>
              <span className="font-semibold text-theme">Imp {task.importance}/10</span>
              <span className="text-purple-400 text-[11px] block">Urg {task.urgency}/10</span>
            </div>

            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block mb-0.5">TIME & DURATION</span>
              <span className="font-semibold text-slate-200">
                {task.isAllDay ? 'All Day' : `${task.startTime || ''} - ${task.dueTime || ''}`}
              </span>
              <span className="text-[10px] text-slate-500 block">{task.durationMinutes} mins</span>
            </div>

            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 sm:col-span-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block">PEOPLE</span>
                <span className="text-slate-300">
                  Assigned by <strong className="text-white">{task.assignedBy || 'Unknown'}</strong> to{' '}
                  <strong className="text-white">{task.assignedTo?.join(', ') || 'Unassigned'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {allowViewerNotes && task.notes && canSeeNotes && (
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-1 text-[11px] font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-theme" />
                  <span>Notes</span>
                </span>
                {task.notesPrivate && (
                  <span className="text-[10px] text-amber-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Private Note
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap">{task.notes}</p>
            </div>
          )}

          {/* Comments Section */}
          {allowViewerComments && (
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                <span>Discussion Thread ({comments.length})</span>
              </div>

              {/* Thread */}
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">No comments yet. Start the conversation!</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/60 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-theme">{c.authorUsername}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-200">{c.content}</p>
                    </div>
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Add Comment Input */}
              {canModify ? (
                <form onSubmit={handleSendComment} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !newComment.trim()}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>
                </form>
              ) : (
                <p className="mt-2 text-[11px] text-slate-500 italic">
                  View-only members cannot post comments.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
