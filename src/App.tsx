import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Layers,
  Calendar,
  Sliders,
  Palette,
  Plus,
  KeyRound,
  Sparkles,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  ShieldAlert,
  ArrowRight,
  MessageSquare,
  Bot,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from './lib/firebase.ts';
import { useAuth } from './context/AuthContext.tsx';
import { useTheme } from './context/ThemeContext.tsx';
import { TodoList, Task, Membership, MatrixQuadrant, AccessLevel } from './types/index.ts';

// Components
import { AuthModal } from './components/auth/AuthModal.tsx';
import { PersonalDashboard } from './components/dashboard/PersonalDashboard.tsx';
import { SelectedListView } from './components/lists/SelectedListView.tsx';
import { CreateListModal } from './components/lists/CreateListModal.tsx';
import { TaskFormModal } from './components/tasks/TaskFormModal.tsx';
import { TaskDetailsPanel } from './components/tasks/TaskDetailsPanel.tsx';
import { ConnectListDialog } from './components/workspace/ConnectListDialog.tsx';
import { ConnectedWorkspacesView } from './components/workspace/ConnectedWorkspacesView.tsx';
import { UpgradeAccessDialog } from './components/workspace/UpgradeAccessDialog.tsx';
import { ListSharingSettingsDialog } from './components/workspace/ListSharingSettingsDialog.tsx';
import { CalendarWorkspace } from './components/calendar/CalendarWorkspace.tsx';
import { EisenhowerMatrix } from './components/matrix/EisenhowerMatrix.tsx';
import { ColorWheel } from './components/theme/ColorWheel.tsx';
import { TocoChan } from './components/mascot/TocoChan.tsx';
import { CompletionCelebration } from './components/mascot/CompletionCelebration.tsx';
import { PWAInstallButton } from './components/pwa/PWAInstallButton.tsx';
import { OfflineIndicator } from './components/pwa/OfflineIndicator.tsx';
import { TodoChanAIChat } from './components/mascot/TodoChanAIChat.tsx';
import { WorkspaceChat } from './components/chat/WorkspaceChat.tsx';

type MainNavTab = 'dashboard' | 'lists' | 'calendar' | 'matrix' | 'chat' | 'connect' | 'settings';

export default function App() {
  const { user, sessionToken, isLoading: authLoading, logout } = useAuth();
  const { themeColor, isDarkMode, setIsDarkMode, isNeonMode } = useTheme();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<MainNavTab>('dashboard');
  const [selectedList, setSelectedList] = useState<TodoList | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Firestore real-time data
  const [lists, setLists] = useState<TodoList[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modal dialog states
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sharingSettingsList, setSharingSettingsList] = useState<TodoList | null>(null);
  const [upgradeTarget, setUpgradeTarget] = useState<{ listDocId: string; listName: string } | null>(null);
  const [isAiChatModalOpen, setIsAiChatModalOpen] = useState(false);

  // Celebration state
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationTaskTitle, setCelebrationTaskTitle] = useState('');

  // 1. Listen to User's Memberships in real time
  useEffect(() => {
    if (!user) {
      setMemberships([]);
      setLists([]);
      setTasks([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    const q = query(collection(db, 'memberships'), where('userId', '==', user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mems: Membership[] = [];
      snapshot.forEach((d) => mems.push({ id: d.id, ...(d.data() as any) }));
      setMemberships(mems);
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Fetch Lists that user is member or owner of
  useEffect(() => {
    if (!user || memberships.length === 0) {
      return;
    }

    const listDocIds = Array.from(new Set(memberships.map((m) => m.listDocId)));
    const unsubscribes: (() => void)[] = [];

    listDocIds.forEach((docId) => {
      const unsub = onSnapshot(doc(db, 'lists', docId), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const mem = memberships.find((m) => m.listDocId === docId);
          setLists((prev) => {
            const filtered = prev.filter((l) => l.id !== docId);
            return [
              ...filtered,
              {
                id: snap.id,
                ...(data as any),
                role: mem?.role || (data.ownerId === user.id ? 'owner' : 'viewer'),
              },
            ];
          });
        }
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach((u) => u());
  }, [user, memberships]);

  // 3. Auto-ensure user has at least one default workspace so tasks ALWAYS have a home!
  useEffect(() => {
    if (!user || loadingData) return;

    if (lists.length === 0 && memberships.length === 0) {
      const defaultDocId = 'lst_' + Math.random().toString(36).substring(2, 11);
      const membershipId = `${defaultDocId}_${user.id}`;
      const nowIso = new Date().toISOString();

      const defaultList: TodoList = {
        id: defaultDocId,
        listId: '101' + Math.floor(100 + Math.random() * 900),
        name: 'Personal & Goals',
        description: 'Primary workspace created by Todo-chan',
        color: '#ff69b4',
        ownerId: user.id,
        ownerUsername: user.username,
        viewPassword: 'view' + Math.floor(100 + Math.random() * 900),
        editPassword: 'edit' + Math.floor(100 + Math.random() * 900),
        viewPasswordHash: 'view101',
        editPasswordHash: 'edit202',
        allowViewOnlySharing: true,
        allowEditingSharing: true,
        allowViewerChat: true,
        allowViewerNotes: true,
        allowViewerComments: true,
        chatEnabled: true,
        isArchived: false,
        createdAt: nowIso,
        updatedAt: nowIso,
        role: 'owner',
      };

      setLists([defaultList]);

      setDoc(doc(db, 'lists', defaultDocId), defaultList).catch(() => {});
      setDoc(doc(db, 'memberships', membershipId), {
        id: membershipId,
        listId: defaultList.listId,
        listDocId: defaultDocId,
        listName: defaultList.name,
        userId: user.id,
        username: user.username,
        role: 'owner',
        canChat: true,
        grantedAt: nowIso,
        revoked: false,
      }).catch(() => {});
    }
  }, [user, loadingData, lists.length, memberships.length]);

  // 4. Listen to Tasks in real time (both by creator and by accessible lists)
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    const unsubscribes: (() => void)[] = [];

    // Listener A: Tasks created by user
    const qUser = query(collection(db, 'tasks'), where('creatorId', '==', user.id));
    const unsubUser = onSnapshot(qUser, (snapshot) => {
      const userTasks: Task[] = [];
      snapshot.forEach((d) => userTasks.push({ id: d.id, ...(d.data() as any) }));
      setTasks((prev) => {
        const otherTasks = prev.filter((t) => t.creatorId !== user.id);
        const map = new Map<string, Task>();
        [...otherTasks, ...userTasks].forEach((t) => map.set(t.id, t));
        return Array.from(map.values());
      });
    });
    unsubscribes.push(unsubUser);

    // Listener B: Tasks in member lists
    const listDocIds = Array.from(new Set(memberships.map((m) => m.listDocId)));
    listDocIds.forEach((docId) => {
      const qList = query(collection(db, 'tasks'), where('listId', '==', docId));
      const unsub = onSnapshot(qList, (snapshot) => {
        const docTasks: Task[] = [];
        snapshot.forEach((d) => docTasks.push({ id: d.id, ...(d.data() as any) }));
        setTasks((prev) => {
          const map = new Map<string, Task>();
          prev.forEach((t) => map.set(t.id, t));
          docTasks.forEach((t) => map.set(t.id, t));
          return Array.from(map.values());
        });
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach((u) => u());
  }, [user, memberships]);

  if (authLoading) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center ${
          isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-[#FAF7F2] text-stone-500'
        }`}
      >
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center border animate-pulse shadow-xl ${
            isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-[#E6DFD3] bg-white'
          }`}
        >
          <Sparkles className="w-7 h-7 text-pink-500 animate-spin" />
        </div>
        <p className="mt-4 text-xs font-semibold tracking-wide">Loading Todo-chan Planner...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  // Determine current user's role on selected list
  const currentListRole: AccessLevel = selectedList
    ? memberships.find((m) => m.listDocId === selectedList.id)?.role ||
      (selectedList.ownerId === user.id ? 'owner' : 'viewer')
    : 'owner';

  // Task actions with optimistic updates for instant UI feedback
  const handleSaveTask = async (taskData: Partial<Task>) => {
    let targetListId = taskData.listId || (selectedList ? selectedList.id : lists[0]?.id);
    if (!targetListId) {
      targetListId = 'lst_' + Math.random().toString(36).substring(2, 10);
    }

    const taskId = editingTask ? editingTask.id : 'task_' + Math.random().toString(36).substring(2, 12);
    const now = new Date().toISOString();

    const fullTask: Task = {
      id: taskId,
      listId: targetListId,
      title: taskData.title || 'New Task',
      description: taskData.description || '',
      assignedBy: taskData.assignedBy || user.username,
      assignedTo: taskData.assignedTo || [user.username],
      startDate: taskData.startDate,
      dueDate: taskData.dueDate,
      startTime: taskData.startTime,
      dueTime: taskData.dueTime,
      isAllDay: taskData.isAllDay ?? true,
      importance: taskData.importance ?? 7,
      urgency: taskData.urgency ?? 7,
      matrixQuadrant: taskData.matrixQuadrant || 'q1',
      matrixOverride: taskData.matrixOverride ?? false,
      durationMinutes: taskData.durationMinutes ?? 30,
      color: taskData.color || '#ff69b4',
      status: taskData.status || 'todo',
      notes: taskData.notes || '',
      notesPrivate: taskData.notesPrivate ?? false,
      creatorId: user.id,
      creatorUsername: user.username,
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic state update: appears in UI in 0 milliseconds!
    setTasks((prev) => {
      const filtered = prev.filter((t) => t.id !== taskId);
      return [fullTask, ...filtered];
    });

    if (editingTask) {
      await updateDoc(doc(db, 'tasks', editingTask.id), {
        ...taskData,
        updatedAt: now,
      });
      setEditingTask(null);
    } else {
      await setDoc(doc(db, 'tasks', taskId), fullTask);
    }
  };

  const handleCreateListSubmit = async (listData: Partial<TodoList>) => {
    const listDocId = 'lst_' + Math.random().toString(36).substring(2, 11);
    let listId = '';
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    for (let i = 0; i < 6; i++) {
      listId += chars[Math.floor(Math.random() * chars.length)];
    }

    const cleanName = (listData.name || 'New List').trim();
    const cleanViewPass = listData.viewPassword || 'view' + Math.floor(100 + Math.random() * 900);
    const cleanEditPass = listData.editPassword || 'edit' + Math.floor(100 + Math.random() * 900);
    const nowIso = new Date().toISOString();

    const newList: TodoList = {
      id: listDocId,
      listId,
      name: cleanName,
      description: listData.description || '',
      color: listData.color || '#ff69b4',
      ownerId: user.id,
      ownerUsername: user.username,
      viewPassword: cleanViewPass,
      editPassword: cleanEditPass,
      viewPasswordHash: cleanViewPass,
      editPasswordHash: cleanEditPass,
      allowViewOnlySharing: true,
      allowEditingSharing: true,
      allowViewerChat: true,
      allowViewerNotes: true,
      allowViewerComments: true,
      chatEnabled: true,
      isArchived: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      role: 'owner',
    };

    setLists((prev) => [...prev, newList]);

    await setDoc(doc(db, 'lists', listDocId), newList);
    const membershipId = `${listDocId}_${user.id}`;
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
  };

  const handleToggleComplete = async (task: Task) => {
    const isCompleted = task.status === 'completed';
    const nextStatus = isCompleted ? 'todo' : 'completed';

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    const taskRef = doc(db, 'tasks', task.id);
    await updateDoc(taskRef, {
      status: nextStatus,
      completedAt: !isCompleted ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    });

    if (!isCompleted) {
      setCelebrationTaskTitle(task.title);
      setCelebrationOpen(true);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await deleteDoc(doc(db, 'tasks', taskId));
    if (selectedTaskForDetails?.id === taskId) {
      setSelectedTaskForDetails(null);
    }
  };

  const handleMoveQuadrant = async (taskId: string, targetQuadrant: MatrixQuadrant) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, matrixQuadrant: targetQuadrant, matrixOverride: true }
          : t
      )
    );
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      matrixQuadrant: targetQuadrant,
      matrixOverride: true,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteList = async (listDocId: string) => {
    await deleteDoc(doc(db, 'lists', listDocId));
    const myMem = memberships.find((m) => m.listDocId === listDocId);
    if (myMem) {
      await deleteDoc(doc(db, 'memberships', myMem.id));
    }
    setLists((prev) => prev.filter((l) => l.id !== listDocId));
    setSelectedList(null);
    setCurrentTab('lists');
  };

  const handleUpdateListNameOrColor = async (listDocId: string, name: string, color: string) => {
    const listRef = doc(db, 'lists', listDocId);
    await updateDoc(listRef, {
      name: name.trim(),
      color,
      updatedAt: new Date().toISOString(),
    });
    setLists((prev) =>
      prev.map((l) => (l.id === listDocId ? { ...l, name: name.trim(), color } : l))
    );
    if (selectedList && selectedList.id === listDocId) {
      setSelectedList({ ...selectedList, name: name.trim(), color });
    }
  };

  const handleRemoveConnection = async (membershipId: string) => {
    await deleteDoc(doc(db, 'memberships', membershipId));
    setMemberships((prev) => prev.filter((m) => m.id !== membershipId));
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'lists', label: 'My Lists', icon: <Layers className="w-4 h-4" />, count: lists.length },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'matrix', label: 'Eisenhower Matrix', icon: <Sliders className="w-4 h-4" /> },
    { id: 'chat', label: 'Live Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'connect', label: 'Connect Workspace', icon: <KeyRound className="w-4 h-4" />, count: memberships.length },
    { id: 'settings', label: 'Theme & Settings', icon: <Palette className="w-4 h-4" /> },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row relative transition-colors duration-200 ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#FAF7F2] text-stone-900'
      }`}
    >
      {/* Ambient background glow if Neon Mode is on */}
      {isNeonMode && (
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-30 blur-3xl"
          style={{ background: 'var(--ambient-glow)' }}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col justify-between w-64 border-r p-5 shrink-0 min-h-screen sticky top-0 z-30 backdrop-blur-md transition-colors ${
          isDarkMode
            ? 'bg-slate-900/90 border-slate-800/80 text-white'
            : 'bg-[#F4EFE6] border-[#E6DFD3] text-stone-900 shadow-xs'
        }`}
      >
        <div>
          {/* Brand Wordmark */}
          <div
            className={`flex items-center justify-between pb-6 border-b ${
              isDarkMode ? 'border-slate-800' : 'border-[#E6DFD3]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="w-3.5 h-3.5 rounded-full shadow-xs"
                style={{
                  backgroundColor: themeColor,
                  boxShadow: isNeonMode ? `0 0 12px ${themeColor}` : undefined,
                }}
              />
              <span
                className={`font-black text-lg tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-stone-900'
                }`}
              >
                Todo-chan
              </span>
            </div>
            <span
              className={`text-[10px] font-mono uppercase tracking-wider ${
                isDarkMode ? 'text-slate-500' : 'text-stone-400 font-bold'
              }`}
            >
              Planner
            </span>
          </div>

          {/* Quick Add Task Button: ALWAYS creates a task, NEVER forces list creation! */}
          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="w-full mt-5 py-2.5 px-4 rounded-xl font-bold text-xs text-white shadow-md transition flex items-center justify-center gap-2 active:scale-98"
            style={{
              backgroundColor: themeColor,
              boxShadow: isNeonMode ? `0 0 18px ${themeColor}70` : undefined,
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Quick Add Task</span>
          </button>

          {/* Primary Navigation Links */}
          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id && !selectedList;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedList(null);
                    setCurrentTab(item.id as MainNavTab);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? isDarkMode
                        ? 'bg-slate-800 border border-slate-700 shadow-xs'
                        : 'bg-white border border-[#E6DFD3] shadow-xs'
                      : isDarkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-[#EAE3D6]'
                  }`}
                  style={
                    isActive
                      ? {
                          color: themeColor,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {typeof item.count === 'number' && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick List Shortcuts in Sidebar */}
          {lists.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2 px-1">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-slate-400' : 'text-stone-500'
                  }`}
                >
                  My Workspaces
                </span>
                <button
                  onClick={() => setIsCreateListOpen(true)}
                  className="text-pink-500 hover:underline text-[11px] font-bold"
                  title="Create new list"
                >
                  + New
                </button>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar">
                {lists.slice(0, 5).map((l) => {
                  const isListActive = selectedList?.id === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => {
                        setSelectedList(l);
                        setCurrentTab('lists');
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-left truncate transition ${
                        isListActive
                          ? isDarkMode
                            ? 'bg-slate-800 text-white'
                            : 'bg-white text-stone-900 shadow-xs'
                          : isDarkMode
                          ? 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-[#EAE3D6]'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: l.color }}
                      />
                      <span className="truncate">{l.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div
          className={`pt-4 border-t space-y-3 ${
            isDarkMode ? 'border-slate-800' : 'border-[#E6DFD3]'
          }`}
        >
          {/* Theme Quick Toggle (Light Cream vs Dark) */}
          <div className="flex items-center justify-between px-2">
            <span
              className={`text-xs font-semibold flex items-center gap-1.5 ${
                isDarkMode ? 'text-slate-400' : 'text-stone-600'
              }`}
            >
              {isDarkMode ? <Moon className="w-3.5 h-3.5 text-pink-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              <span>{isDarkMode ? 'Dark Theme' : 'Cream Light Theme'}</span>
            </span>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-1.5 rounded-lg border transition ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-white border-[#D6CEC0] text-stone-700 hover:text-stone-900 shadow-xs'
              }`}
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-pink-500" />}
            </button>
          </div>

          {/* User Info & Logout */}
          <div
            className={`flex items-center justify-between p-2.5 rounded-xl border ${
              isDarkMode
                ? 'bg-slate-950/60 border-slate-800'
                : 'bg-white border-[#E6DFD3] shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0"
                style={{ backgroundColor: themeColor }}
              >
                {user?.username ? user.username.slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <span
                  className={`text-xs font-bold block truncate ${
                    isDarkMode ? 'text-white' : 'text-stone-900'
                  }`}
                >
                  {user?.username || 'User'}
                </span>
                <span className="text-[10px] text-pink-500 font-mono">Online</span>
              </div>
            </div>

            <button
              onClick={logout}
              className={`p-1.5 rounded-lg transition ${
                isDarkMode
                  ? 'text-slate-400 hover:text-red-400 hover:bg-slate-900'
                  : 'text-stone-400 hover:text-red-600 hover:bg-stone-100'
              }`}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <PWAInstallButton />
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header
        className={`md:hidden flex items-center justify-between p-4 border-b sticky top-0 z-40 backdrop-blur-md ${
          isDarkMode
            ? 'bg-slate-900/90 border-slate-800 text-white'
            : 'bg-[#F4EFE6] border-[#E6DFD3] text-stone-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: themeColor }}
          />
          <span className="font-black text-base">Todo-chan</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg border ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-[#D6CEC0]'
            }`}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-pink-500" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-lg border ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-[#D6CEC0] text-stone-700'
            }`}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden p-4 border-b space-y-2 z-40 ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-[#F4EFE6] border-[#E6DFD3] text-stone-900'
          }`}
        >
          <button
            onClick={() => {
              setIsCreateTaskOpen(true);
              setMobileMenuOpen(false);
            }}
            className="w-full btn-theme-gradient py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Quick Add Task</span>
          </button>

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedList(null);
                setCurrentTab(item.id as MainNavTab);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                currentTab === item.id && !selectedList
                  ? 'btn-theme-gradient text-white'
                  : isDarkMode
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-stone-700 hover:bg-[#EAE3D6]'
              }`}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {typeof item.count === 'number' && <span>{item.count}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {selectedList ? (
          <SelectedListView
            list={selectedList}
            tasks={tasks.filter((t) => t.listId === selectedList.id)}
            userRole={currentListRole}
            currentUsername={user?.username || ''}
            onBack={() => setSelectedList(null)}
            onOpenCreateTask={() => setIsCreateTaskOpen(true)}
            onSelectTask={(t) => setSelectedTaskForDetails(t)}
            onToggleComplete={handleToggleComplete}
            onMoveQuadrant={handleMoveQuadrant}
            onOpenSharingSettings={() => setSharingSettingsList(selectedList)}
            onOpenUpgradeDialog={() =>
              setUpgradeTarget({ listDocId: selectedList.id, listName: selectedList.name })
            }
            onDeleteList={handleDeleteList}
            onUpdateListNameOrColor={handleUpdateListNameOrColor}
          />
        ) : (
          <>
            {/* 1. DASHBOARD */}
            {currentTab === 'dashboard' && (
              <PersonalDashboard
                username={user.username}
                tasks={tasks}
                lists={lists}
                onOpenCreateTask={() => setIsCreateTaskOpen(true)}
                onOpenCreateList={() => setIsCreateListOpen(true)}
                onSelectTask={(t) => setSelectedTaskForDetails(t)}
                onSelectList={(l) => setSelectedList(l)}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onToggleComplete={handleToggleComplete}
                onSaveTask={handleSaveTask}
                onCreateListSubmit={handleCreateListSubmit}
              />
            )}

            {/* 2. ALL LISTS */}
            {currentTab === 'lists' && (
              <div className="space-y-6">
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border ${
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
                      <Layers className="w-5 h-5 text-purple-400" />
                      <span>My To-Do Lists ({lists.length})</span>
                    </h2>
                    <p
                      className={`text-xs mt-0.5 ${
                        isDarkMode ? 'text-slate-400' : 'text-stone-500'
                      }`}
                    >
                      Independent workspaces for college, work, personal goals, and routines.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsConnectOpen(true)}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition ${
                        isDarkMode
                          ? 'text-slate-300 hover:text-white bg-slate-800 border-slate-700'
                          : 'text-stone-700 hover:text-stone-900 bg-stone-100 border-[#DCD4C5]'
                      }`}
                    >
                      Connect Shared List
                    </button>
                    <button
                      onClick={() => setIsCreateListOpen(true)}
                      className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition"
                      style={{
                        backgroundColor: themeColor,
                        boxShadow: isNeonMode ? `0 0 15px ${themeColor}60` : undefined,
                      }}
                    >
                      + Create New List
                    </button>
                  </div>
                </div>

                {lists.length === 0 ? (
                  <div
                    className={`border rounded-2xl p-12 text-center ${
                      isDarkMode
                        ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                        : 'bg-white border-[#E6DFD3] text-stone-500'
                    }`}
                  >
                    <p className="text-base font-bold mb-1">No lists created yet</p>
                    <p className="text-xs mb-4">Organize your tasks into clean, focused workspaces.</p>
                    <button
                      onClick={() => setIsCreateListOpen(true)}
                      className="btn-theme-gradient px-5 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm"
                    >
                      Create First List
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lists.map((l) => {
                      const listTasks = tasks.filter((t) => t.listId === l.id);
                      const done = listTasks.filter((t) => t.status === 'completed').length;
                      const pct = listTasks.length > 0 ? Math.round((done / listTasks.length) * 100) : 0;
                      const isOwner = l.ownerId === user.id;

                      return (
                        <div
                          key={l.id}
                          onClick={() => setSelectedList(l)}
                          className={`border rounded-2xl p-5 shadow-lg transition cursor-pointer flex flex-col justify-between ${
                            isDarkMode
                              ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                              : 'bg-white border-[#E6DFD3] hover:border-[#D6CEC0]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: l.color }}
                              />
                              <span
                                className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md border ${
                                  isDarkMode
                                    ? 'bg-slate-950 border-slate-800'
                                    : 'bg-[#FAF7F2] border-[#E6DFD3]'
                                }`}
                                style={{ color: themeColor }}
                              >
                                ID: {l.listId}
                              </span>
                            </div>

                            <h3
                              className={`text-base font-bold ${
                                isDarkMode ? 'text-white' : 'text-stone-900'
                              }`}
                            >
                              {l.name}
                            </h3>
                            {l.description && (
                              <p
                                className={`text-xs line-clamp-2 mt-1 ${
                                  isDarkMode ? 'text-slate-400' : 'text-stone-500'
                                }`}
                              >
                                {l.description}
                              </p>
                            )}

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
                                <span>{done}/{listTasks.length} Completed</span>
                                <span className="font-mono">{pct}%</span>
                              </div>
                              <div
                                className={`w-full h-1.5 rounded-full overflow-hidden ${
                                  isDarkMode ? 'bg-slate-800' : 'bg-stone-200'
                                }`}
                              >
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, backgroundColor: themeColor }}
                                />
                              </div>
                            </div>
                          </div>

                          <div
                            className={`mt-4 pt-2 border-t flex items-center justify-between text-[11px] ${
                              isDarkMode ? 'border-slate-800/60 text-slate-400' : 'border-[#E6DFD3] text-stone-500'
                            }`}
                          >
                            <span>{isOwner ? 'Your List' : `Shared by ${l.ownerUsername}`}</span>
                            <span
                              className="font-semibold hover:underline"
                              style={{ color: themeColor }}
                            >
                              Open Workspace →
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. GLOBAL CALENDAR */}
            {currentTab === 'calendar' && (
              <CalendarWorkspace
                tasks={tasks}
                lists={lists}
                onSelectTask={(t) => setSelectedTaskForDetails(t)}
                onCreateTaskOnDate={() => setIsCreateTaskOpen(true)}
                userRole="editor"
              />
            )}

            {/* 4. EISENHOWER MATRIX */}
            {currentTab === 'matrix' && (
              <EisenhowerMatrix
                tasks={tasks}
                onSelectTask={(t) => setSelectedTaskForDetails(t)}
                onMoveQuadrant={handleMoveQuadrant}
                onToggleComplete={handleToggleComplete}
                userRole="editor"
              />
            )}

            {/* 5. LIVE WORKSPACE CHAT */}
            {currentTab === 'chat' && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
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
                      <MessageSquare className="w-5 h-5 text-pink-500" />
                      <span>Live Workspace Chat (Firebase Stream)</span>
                    </h2>
                    <p
                      className={`text-xs mt-0.5 ${
                        isDarkMode ? 'text-slate-400' : 'text-stone-500'
                      }`}
                    >
                      Real-time synchronized messaging with workspace members across sessions.
                    </p>
                  </div>
                </div>

                <WorkspaceChat
                  listId={lists[0]?.id || 'global_workspace'}
                  listName={lists[0]?.name || 'Primary Workspace'}
                  userRole="owner"
                  currentUserId={user.id}
                  currentUsername={user.username}
                  chatEnabled={true}
                  canUserChat={true}
                />
              </div>
            )}

            {/* 6. CONNECT WORKSPACE */}
            {currentTab === 'connect' && (
              <ConnectedWorkspacesView
                memberships={memberships}
                lists={lists}
                tasks={tasks}
                onOpenConnectDialog={() => setIsConnectOpen(true)}
                onOpenList={(l) => setSelectedList(l)}
                onUpgradeList={(listDocId, listName) =>
                  setUpgradeTarget({ listDocId, listName })
                }
                onRemoveConnection={handleRemoveConnection}
                onOpenCalendarForList={(l) => setSelectedList(l)}
                onOpenChatForList={(l) => setSelectedList(l)}
              />
            )}

            {/* 7. SETTINGS & COLOR WHEEL */}
            {currentTab === 'settings' && (
              <div className="max-w-2xl space-y-6">
                <ColorWheel />
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Mascot Todo-chan (Baby Pink Neon with Real Task Reminders) */}
      <TocoChan tasks={tasks} onOpenAiChat={() => setIsAiChatModalOpen(true)} />

      {/* Modal Popup AI Chat when Long-pressing or Clicking Todo-chan */}
      {isAiChatModalOpen && (
        <TodoChanAIChat
          lists={lists}
          tasks={tasks}
          onAddTask={handleSaveTask}
          onCreateList={handleCreateListSubmit}
          onCompleteTask={async (t) => handleToggleComplete(t)}
          isModal={true}
          onCloseModal={() => setIsAiChatModalOpen(false)}
        />
      )}

      {/* Floating Offline Connectivity Notice */}
      <OfflineIndicator />

      {/* Celebration Modal on Task Completion */}
      <CompletionCelebration
        isOpen={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
        taskTitle={celebrationTaskTitle}
      />

      {/* Create List Modal */}
      <CreateListModal
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onCreated={(nl) => {
          setSelectedList(nl);
        }}
        sessionToken={sessionToken}
      />

      {/* Connect List Dialog */}
      <ConnectListDialog
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        onSuccess={(result) => {
          const found = lists.find((l) => l.id === result.listDocId);
          if (found) setSelectedList(found);
          setCurrentTab('connect');
        }}
        sessionToken={sessionToken}
      />

      {/* Create Task Modal */}
      <TaskFormModal
        isOpen={isCreateTaskOpen || !!editingTask}
        onClose={() => {
          setIsCreateTaskOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
        listId={selectedList ? selectedList.id : lists[0]?.id || ''}
        lists={lists}
        currentUsername={user?.username || ''}
        eisenhowerThreshold={user?.eisenhowerThreshold ?? 7}
      />

      {/* Task Details & Comments Panel */}
      <TaskDetailsPanel
        task={selectedTaskForDetails}
        isOpen={!!selectedTaskForDetails}
        onClose={() => setSelectedTaskForDetails(null)}
        onEdit={(t) => {
          setSelectedTaskForDetails(null);
          setEditingTask(t);
        }}
        onDelete={handleDeleteTask}
        onToggleComplete={handleToggleComplete}
        userRole={currentListRole}
        currentUsername={user?.username || ''}
        currentUserId={user?.id || ''}
        allowViewerNotes={selectedList?.allowViewerNotes}
        allowViewerComments={selectedList?.allowViewerComments}
      />

      {/* List Sharing & Passwords Dialog */}
      {sharingSettingsList && (
        <ListSharingSettingsDialog
          isOpen={!!sharingSettingsList}
          onClose={() => setSharingSettingsList(null)}
          list={sharingSettingsList}
          sessionToken={sessionToken}
          onListUpdated={() => {}}
        />
      )}

      {/* Upgrade Access Dialog */}
      {upgradeTarget && (
        <UpgradeAccessDialog
          isOpen={!!upgradeTarget}
          onClose={() => setUpgradeTarget(null)}
          listDocId={upgradeTarget.listDocId}
          listName={upgradeTarget.listName}
          sessionToken={sessionToken}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
