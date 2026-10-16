import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, CheckCircle2, Plus, Layers, Flame, Heart, X, MessageSquare } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';
import { Task, TodoList } from '../../types/index.ts';
import { TodoChanBobCutEmote } from './TodoChanBobCutEmote.tsx';

interface Message {
  id: string;
  sender: 'user' | 'todochan';
  text: string;
  actionTaken?: string;
  createdAt: string;
}

interface TodoChanAIChatProps {
  lists: TodoList[];
  tasks: Task[];
  onAddTask: (taskData: Partial<Task>) => Promise<void>;
  onCreateList: (listData: Partial<TodoList>) => Promise<void>;
  onCompleteTask: (task: Task) => Promise<void>;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const TodoChanAIChat: React.FC<TodoChanAIChatProps> = ({
  lists,
  tasks,
  onAddTask,
  onCreateList,
  onCompleteTask,
  isModal = false,
  onCloseModal,
}) => {
  const { themeColor, isDarkMode, isNeonMode } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_1',
      sender: 'todochan',
      text: "Konnichiwa! I'm Todo-chan, your AI day planner! (✿◠‿◠)✨ You can tell me anything in natural language—like 'Add buy milk at 5pm urgent', 'Create a list for College Finals', or 'What should I do first today?' I'll organize your tasks, map them to Eisenhower quadrants, and assign them right away! 💕",
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isProcessing) return;

    if (!customText) setInput('');
    const userMsgId = 'usr_' + Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: textToSend,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setIsProcessing(true);

    try {
      const res = await fetch('/api/todochan/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          existingLists: lists.map((l) => ({ id: l.id, name: l.name })),
          existingTasks: tasks.map((t) => ({ id: t.id, title: t.title })),
        }),
      });

      const data = await res.json();
      let actionNote: string | undefined = undefined;

      if (data.action === 'create_task' && data.taskData) {
        // Find best list or fallback to first list
        let chosenListId = data.taskData.suggestedListId;
        if (!chosenListId || !lists.some((l) => l.id === chosenListId)) {
          chosenListId = lists[0]?.id;
        }

        await onAddTask({
          ...data.taskData,
          listId: chosenListId,
        });
        const listName = lists.find((l) => l.id === chosenListId)?.name || 'General';
        actionNote = `Task "${data.taskData.title}" created in [${listName}] and mapped to Eisenhower ${data.taskData.matrixQuadrant?.toUpperCase()}!`;
      } else if (data.action === 'create_list' && data.listData) {
        await onCreateList(data.listData);
        actionNote = `List "${data.listData.name}" created with 2-level password!`;
      } else if (data.action === 'complete_task' && data.targetTaskId) {
        const target = tasks.find((t) => t.id === data.targetTaskId);
        if (target) {
          await onCompleteTask(target);
          actionNote = `Marked "${target.title}" as completed!`;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: 'ai_' + Date.now(),
          sender: 'todochan',
          text: data.reply || "Done, Senpai! I've updated your planner! (｡•̀ᴗ-)✧",
          actionTaken: actionNote,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'todochan',
          text: "Gomen ne! I had a tiny glitch, but I'm still cheering you on! (｡•́︿•̀｡)",
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickPrompts = [
    'Add finish assignment today at 4pm urgent',
    'Create a list for College Finals',
    'What urgent tasks do I have?',
    'Remind me to drink water and take a break',
  ];

  const content = (
    <div className={`flex flex-col ${isModal ? 'h-[550px]' : 'h-[360px]'} overflow-hidden rounded-2xl`}>
      {/* Header */}
      <div
        className={`p-3.5 border-b flex items-center justify-between transition-colors ${
          isDarkMode
            ? 'bg-slate-900/90 border-slate-800 text-white'
            : 'bg-[#F4EFE6] border-[#E6DFD3] text-stone-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <TodoChanBobCutEmote size={28} />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs">Todo-chan AI Companion</span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: 'rgba(255, 105, 180, 0.15)',
                  color: '#ff69b4',
                  border: '1px solid rgba(255, 105, 180, 0.4)',
                }}
              >
                Baby Pink Neon AI
              </span>
            </div>
            <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
              Type any task or instruct Todo-chan to organize your day
            </p>
          </div>
        </div>

        {isModal && onCloseModal && (
          <button
            onClick={onCloseModal}
            className={`p-1.5 rounded-lg transition ${
              isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-stone-500 hover:text-stone-900 hover:bg-[#EAE3D6]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Message History */}
      <div
        className={`flex-1 p-3.5 overflow-y-auto space-y-3 ${
          isDarkMode ? 'bg-slate-950/70' : 'bg-[#FAF7F2]'
        }`}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-end gap-2 max-w-[85%]">
              {m.sender === 'todochan' && (
                <div className="shrink-0 mb-1">
                  <TodoChanBobCutEmote size={22} />
                </div>
              )}
              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'btn-theme-gradient text-white rounded-br-xs'
                    : isDarkMode
                    ? 'bg-slate-900 border border-pink-400/30 text-slate-100 rounded-bl-xs shadow-md'
                    : 'bg-white border border-[#E6DFD3] text-stone-900 rounded-bl-xs shadow-xs'
                }`}
                style={
                  m.sender === 'todochan' && isNeonMode
                    ? {
                        boxShadow: '0 0 14px rgba(255, 105, 180, 0.15)',
                      }
                    : undefined
                }
              >
                <p>{m.text}</p>
                {m.actionTaken && (
                  <div
                    className="mt-2 pt-2 border-t text-[11px] font-semibold flex items-center gap-1.5"
                    style={{
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                      color: '#ff69b4',
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{m.actionTaken}</span>
                  </div>
                )}
                <span
                  className={`text-[9px] mt-1 block text-right ${
                    m.sender === 'user'
                      ? 'text-pink-100'
                      : isDarkMode
                      ? 'text-slate-500'
                      : 'text-stone-400'
                  }`}
                >
                  {m.createdAt}
                </span>
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-pink-400 p-2 animate-pulse">
            <TodoChanBobCutEmote size={20} />
            <span className="font-medium text-[11px]">Todo-chan is thinking & assigning... ✨</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div
        className={`px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t text-[10px] ${
          isDarkMode
            ? 'bg-slate-900/60 border-slate-800/80 text-slate-400'
            : 'bg-[#F4EFE6] border-[#E6DFD3] text-stone-600'
        }`}
      >
        <Sparkles className="w-3 h-3 text-pink-400 shrink-0" />
        {quickPrompts.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            className={`whitespace-nowrap px-2.5 py-1 rounded-full border transition active:scale-95 text-[10px] ${
              isDarkMode
                ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
                : 'bg-white hover:bg-stone-50 border-[#DCD4C5] text-stone-700 hover:text-stone-900 shadow-2xs'
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className={`p-2.5 border-t flex items-center gap-2 ${
          isDarkMode
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-[#F4EFE6] border-[#E6DFD3]'
        }`}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Instruct Todo-chan (e.g. 'Add buy groceries at 6pm urgent')..."
          className={`flex-1 text-xs px-3.5 py-2.5 rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-pink-400 transition ${
            isDarkMode
              ? 'bg-slate-950 border-slate-700/80 text-white placeholder-slate-500'
              : 'bg-white border-[#D6CEC0] text-stone-900 placeholder-stone-400'
          }`}
        />
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="btn-theme-gradient p-2.5 rounded-xl text-white disabled:opacity-40 transition active:scale-95 flex items-center justify-center shrink-0 shadow-md"
          title="Send to Todo-chan"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
        <div
          className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 ${
            isDarkMode
              ? 'bg-slate-900 border-slate-800'
              : 'bg-white border-[#E6DFD3]'
          }`}
          style={{
            boxShadow: '0 0 35px rgba(255, 105, 180, 0.3)',
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border shadow-lg overflow-hidden transition-colors ${
        isDarkMode
          ? 'bg-slate-900/90 border-slate-800'
          : 'bg-white border-[#E6DFD3]'
      }`}
      style={
        isNeonMode
          ? {
              boxShadow: '0 0 20px rgba(255, 105, 180, 0.15)',
            }
          : undefined
      }
    >
      {content}
    </div>
  );
};
