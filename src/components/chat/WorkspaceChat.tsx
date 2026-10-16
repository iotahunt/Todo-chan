import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Lock, AlertCircle, Sparkles } from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase.ts';
import { ChatMessage, AccessLevel } from '../../types/index.ts';
import { useTheme } from '../../context/ThemeContext.tsx';

interface WorkspaceChatProps {
  listId: string;
  listName: string;
  userRole: AccessLevel;
  currentUserId: string;
  currentUsername: string;
  chatEnabled?: boolean;
  canUserChat?: boolean;
}

export const WorkspaceChat: React.FC<WorkspaceChatProps> = ({
  listId,
  listName,
  userRole,
  currentUserId,
  currentUsername,
  chatEnabled = true,
  canUserChat = true,
}) => {
  const { themeColor, isDarkMode, isNeonMode } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isChatAllowed = chatEnabled && canUserChat;

  useEffect(() => {
    if (!listId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'messages'), where('listId', '==', listId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        msgs.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      // Sort chronologically
      msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [listId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !isChatAllowed || isSending || !listId) return;

    setIsSending(true);
    const text = inputText.trim();
    setInputText('');

    try {
      await addDoc(collection(db, 'messages'), {
        listId,
        senderId: currentUserId,
        senderUsername: currentUsername,
        content: text,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error posting message to Firestore:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      className={`border rounded-2xl flex flex-col h-[560px] shadow-xl overflow-hidden transition-colors ${
        isDarkMode
          ? 'bg-slate-900/90 border-slate-800'
          : 'bg-white border-[#E6DFD3]'
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b flex items-center justify-between ${
          isDarkMode
            ? 'bg-slate-950/40 border-slate-800'
            : 'bg-[#F4EFE6] border-[#E6DFD3]'
        }`}
      >
        <div>
          <h3
            className={`text-sm font-bold flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-stone-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-theme" />
            <span>Workspace Live Chat</span>
          </h3>
          <p
            className={`text-[11px] ${
              isDarkMode ? 'text-slate-400' : 'text-stone-500'
            }`}
          >
            "{listName}"
          </p>
        </div>

        {!chatEnabled ? (
          <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/30 px-2.5 py-0.5 rounded-md flex items-center gap-1 font-semibold">
            <Lock className="w-3 h-3" /> Chat Disabled by Owner
          </span>
        ) : !canUserChat ? (
          <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2.5 py-0.5 rounded-md flex items-center gap-1 font-semibold">
            <Lock className="w-3 h-3" /> Viewer (Read Only)
          </span>
        ) : (
          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-md flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Firebase Live Sync</span>
          </span>
        )}
      </div>

      {/* Message List */}
      <div
        className={`flex-1 p-4 overflow-y-auto space-y-3 ${
          isDarkMode ? 'bg-slate-950/70' : 'bg-[#FAF7F2]'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-stone-400">
            <Sparkles className="w-4 h-4 animate-spin text-pink-500 mr-2" />
            <span>Connecting to live chat stream...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 text-theme ${
                isDarkMode ? 'bg-slate-800/60' : 'bg-[#EAE3D6]'
              }`}
            >
              <Sparkles className="w-6 h-6" />
            </div>
            <h4
              className={`text-xs font-bold ${
                isDarkMode ? 'text-white' : 'text-stone-900'
              }`}
            >
              No messages yet
            </h4>
            <p
              className={`text-[11px] max-w-xs mt-1 ${
                isDarkMode ? 'text-slate-400' : 'text-stone-500'
              }`}
            >
              Start coordinating with workspace collaborators in real time via Firebase!
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === currentUserId || m.senderUsername === currentUsername;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span
                    className={`text-[10px] font-bold ${
                      isMe
                        ? 'text-pink-500'
                        : isDarkMode
                        ? 'text-slate-300'
                        : 'text-stone-700'
                    }`}
                  >
                    {isMe ? 'You' : m.senderUsername}
                  </span>
                  <span
                    className={`text-[9px] ${
                      isDarkMode ? 'text-slate-500' : 'text-stone-400'
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs max-w-md break-words ${
                    isMe
                      ? 'btn-theme-gradient text-white rounded-br-xs'
                      : isDarkMode
                      ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-xs'
                      : 'bg-white border border-[#E6DFD3] text-stone-900 rounded-bl-xs shadow-2xs'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        className={`p-3 border-t ${
          isDarkMode
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-[#F4EFE6] border-[#E6DFD3]'
        }`}
      >
        {!isChatAllowed ? (
          <div className="text-center text-xs text-stone-500 py-2">
            You do not have permission to post messages in this workspace.
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send message to workspace (Enter to send)..."
              className={`flex-1 text-xs px-3.5 py-2.5 rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-pink-400 resize-none transition ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-white border-[#D6CEC0] text-stone-900 placeholder-stone-400'
              }`}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="btn-theme-gradient p-2.5 rounded-xl text-white disabled:opacity-40 transition active:scale-95 shadow-md flex items-center justify-center shrink-0"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
