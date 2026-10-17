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
  User as UserIcon,
  Smile,
  Heart,
  Inbox,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from './lib/firebase.ts';
import { useAuth } from './context/AuthContext.tsx';
import { useTheme } from './context/ThemeContext.tsx';
import { TodoList, Task, Membership, MatrixQuadrant, AccessLevel, UnorganizedTask, MoodType } from './types/index.ts';

// Components
import { AuthModal } from './components/auth/AuthModal.tsx';
import { ProfileSetupModal } from './components/auth/ProfileSetupModal.tsx';
import { UserProfileModal } from './components/profile/UserProfileModal.tsx';
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
import { TodoChanMascot } from './components/mascot/TodoChanMascot.tsx';
import { EmotionTrackerModal } from './components/wellness/EmotionTrackerModal.tsx';
import { WelcomeCheckIn } from './components/mascot/WelcomeCheckIn.tsx';
import { UnorganizedTasksView } from './components/capture/UnorganizedTasksView.tsx';
import { CompletionCelebration } from './components/mascot/CompletionCelebration.tsx';
import { PWAInstallButton } from './components/pwa/PWAInstallButton.tsx';
import { OfflineIndicator } from './components/pwa/OfflineIndicator.tsx';
import { WorkspaceChat } from './components/chat/WorkspaceChat.tsx';
import todochanMascotImg from './assets/images/todochan_winking_clean.png';

type MainNavTab = 'dashboard' | 'lists' | 'unorganized' | 'calendar' | 'matrix' | 'chat' | 'connect' | 'settings';

export default function App() {
  const { user, needsProfileSetup, setNeedsProfileSetup, isLoading: authLoading, logout } = useAuth();
  const { themeColor, isDarkMode, setIsDarkMode, isNeonMode } = useTheme();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<MainNavTab>('dashboard');
  const [selectedList, setSelectedList] = useState<TodoList | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Firestore real-time data
  const [lists, setLists] = useState<TodoList[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [unorganizedTasks, setUnorganizedTasks] = useState<UnorganizedTask[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modal dialog states
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sharingSettingsList, setSharingSettingsList] = useState<TodoList | null>(null);
  const [upgradeTarget, setUpgradeTarget] = useState<{ listDocId: string; listName: string } | null>(null);

  // Profile & Wellness Easter Egg states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEasterEggOpen, setIsEasterEggOpen] = useState(false);
  const [welcomeMood, setWelcomeMood] = useState<MoodType | null>(null);
  const [welcomeCheckInDismissed, setWelcomeCheckInDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('todochan_welcome_dismissed') === 'true';
  });

  // Celebration state
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [celebrationTaskTitle, setCelebrationTaskTitle] = useState('');

  // 1. Listen to User's Memberships in real time
  useEffect(() => {
    if (!user) {
      setMemberships([]);
      setLists([]);
      setTasks([]);
      setUnorganizedTasks([]);
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
      const unsub = onSnapshot(doc(db, 'lists', docId), (docSnap) => {
        if (docSnap.exists()) {
          const lData = { id: docSnap.id, ...(docSnap.data() as any) } as TodoList;
          setLists((prev) => {
            const index = prev.findIndex((item) => item.id === docId);
            if (index >= 0) {
              const copy = [...prev];
              copy[index] = lData;
              return copy;
            }
            return [...prev, lData];
          });
        } else {
          setLists((prev) => prev.filter((item) => item.id !== docId));
        }
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach((u) => u());
  }, [user, memberships]);

  // 3. Fallback: Auto-provision Default List for brand-new users
  useEffect(() => {
    if (user && !loadingData && lists.length === 0 && memberships.length === 0) {
      const defaultDocId = 'lst_' + Math.random().toString(36).substring(2, 10);
      const membershipId = `${defaultDocId}_${user.id}`;
      const nowIso = new Date().toISOString();

      const defaultList: TodoList = {
        id: defaultDocId,
        listId: Math.floor(100000 + Math.random() * 900000).toString(),
        name: 'Personal & Goals',
        description: 'My primary workspace with Todo-chan',
        color: '#ff69b4',
        ownerId: user.id,
        ownerUsername: user.username,
        viewPassword: 'view' + Math.floor(100 + Math.random() * 900),
        editPassword: 'edit' + Math.floor(100 + Math.random() * 900),
        allowViewOnlySharing: true,
        allowEditingSharing: true,
        allowViewerChat: false,
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

  // 4. Listen to Tasks in real time
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

  // 5. Listen to Unorganized Tasks in real time
  useEffect(() => {
    if (!user) {
      setUnorganizedTasks([]);
      return;
    }

    const qUnorg = query(collection(db, 'unorganized_tasks'), where('userId', '==', user.id));
    const unsub = onSnapshot(qUnorg, (snapshot) => {
      const items: UnorganizedTask[] = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...(d.data() as any) }));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUnorganizedTasks(items);
    });

    return () => unsub();
  }, [user]);

  if (authLoading) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center ${
          isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-[#FAF7F2] text-stone-500'
        }`}
      >
        <div
          className={`w-16 h-16 rounded-3xl flex items-center justify-center border shadow-2xl relative overflow-hidden ${
            isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-[#E6DFD3] bg-white'
          }`}
          style={{
            borderColor: 'var(--accent-color)',
            boxShadow: 'var(--neon-card-glow)',
          }}
        >
          <img src={todochanMascotImg} alt="Todo-chan" className="w-12 h-12 object-contain animate-bounce" />
        </div>
        <p className="mt-4 text-xs font-bold tracking-wide text-theme">
          Waking up Todo-chan Planner... ✨
        </p>
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
      isCareTask: taskData.isCareTask,
    };

    // Optimistic state update
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

  const handleToggleComplete = async (task: Task) => {
    const isNowCompleted = task.status !== 'completed';
    const now = new Date().toISOString();

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: isNowCompleted ? 'completed' : 'todo',
              completedAt: isNowCompleted ? now : null,
              updatedAt: now,
            }
          : t
      )
    );

    if (isNowCompleted) {
      setCelebrationTaskTitle(task.title);
      setCelebrationOpen(true);
    }

    await updateDoc(doc(db, 'tasks', task.id), {
      status: isNowCompleted ? 'completed' : 'todo',
      completedAt: isNowCompleted ? now : null,
      updatedAt: now,
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskForDetails?.id === taskId) {
      setSelectedTaskForDetails(null);
    }
    await deleteDoc(doc(db, 'tasks', taskId));
  };

  const handleCreateListSubmit = async (listData: Partial<TodoList>) => {
    const listDocId = 'lst_' + Math.random().toString(36).substring(2, 10);
    const publicListId = Math.floor(100000 + Math.random() * 900000).toString();
    const membershipId = `${listDocId}_${user.id}`;
    const now = new Date().toISOString();

    const newList: TodoList = {
      id: listDocId,
      listId: publicListId,
      name: listData.name || 'New Workspace',
      description: listData.description || '',
      color: listData.color || '#ff69b4',
      ownerId: user.id,
      ownerUsername: user.username,
      viewPassword: listData.viewPassword || '',
      editPassword: listData.editPassword || '',
      allowViewOnlySharing: listData.allowViewOnlySharing ?? true,
      allowEditingSharing: listData.allowEditingSharing ?? true,
      allowViewerChat: listData.allowViewerChat ?? false,
      chatEnabled: true,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      role: 'owner',
    };

    setLists((prev) => [...prev, newList]);

    await setDoc(doc(db, 'lists', listDocId), newList);
    await setDoc(doc(db, 'memberships', membershipId), {
      id: membershipId,
      listId: publicListId,
      listDocId: listDocId,
      listName: newList.name,
      userId: user.id,
      username: user.username,
      role: 'owner',
      canChat: true,
      grantedAt: now,
      revoked: false,
    });

    setIsCreateListOpen(false);
    setSelectedList(newList);
    setCurrentTab('lists');
  };

  const handleDismissWelcomeCheckIn = () => {
    setWelcomeCheckInDismissed(true);
    sessionStorage.setItem('todochan_welcome_dismissed', 'true');
  };

  return (
    <div
      className={`min-h-screen flex flex-col md:flex-row relative transition-colors ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#FAF7F2] text-stone-900'
      }`}
    >
      <OfflineIndicator />

      {/* Profile Setup Modal for first time user */}
      <ProfileSetupModal
        isOpen={needsProfileSetup}
        onClose={() => setNeedsProfileSetup(false)}
      />

      {/* User Profile Monitor & Settings Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        tasks={tasks}
        lists={lists}
        onOpenColorWheel={() => setCurrentTab('settings')}
      />

      {/* Long-Press Easter Egg & Emotion Tracker Modal */}
      <EmotionTrackerModal
        isOpen={isEasterEggOpen}
        onClose={() => setIsEasterEggOpen(false)}
        initialMood={welcomeMood}
        onAddCareTaskToPlanner={handleSaveTask}
      />

      {/* Completion Celebration Modal */}
      <CompletionCelebration
        isOpen={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
        taskTitle={celebrationTaskTitle}
      />

      {/* Sidebar Navigation */}
      <aside
        className={`w-full md:w-64 border-r shrink-0 flex flex-col justify-between p-4 z-20 transition-colors app-sidebar ${
          mobileMenuOpen ? 'block' : 'hidden md:flex'
        }`}
      >
        <div>
          {/* Logo & Brand with Baby-Pink Neon Mascot */}
          <div className="flex items-center justify-between mb-6 px-2">
            <div
              onClick={() => {
                setSelectedList(null);
                setCurrentTab('dashboard');
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center p-0.5 border relative overflow-hidden transition transform group-hover:scale-105"
                style={{
                  borderColor: 'var(--accent-color)',
                  boxShadow: 'var(--neon-card-glow)',
                }}
              >
                <img
                  src={todochanMascotImg}
                  alt="Todo-chan Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_8px_#ff69b4]"
                />
              </div>
              <div>
                <span className="font-black text-sm tracking-tight flex items-center gap-1">
                  <span>Todo-chan</span>
                  <Heart className="w-3 h-3 text-theme fill-current animate-pulse" />
                </span>
                <span className="text-[10px] text-theme font-bold block -mt-0.5">
                  Baby Pink Neon
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg border app-border text-stone-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="space-y-2 mb-6">
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="w-full btn-theme-gradient py-2.5 px-3 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>

            <button
              onClick={() => setIsCreateListOpen(true)}
              className="w-full btn-theme-secondary py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Layers className="w-4 h-4" />
              <span>Create List</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => {
                setSelectedList(null);
                setCurrentTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'dashboard' && !selectedList
                  ? 'btn-theme-primary text-white'
                  : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Personal Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => {
                setSelectedList(null);
                setCurrentTab('unorganized');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'unorganized'
                  ? 'btn-theme-primary text-white'
                  : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>Unorganized Tasks</span>
              </div>
              {unorganizedTasks.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-pink-500/20 text-theme font-bold">
                  {unorganizedTasks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setSelectedList(null);
                setCurrentTab('lists');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'lists' && !selectedList
                  ? 'btn-theme-primary text-white'
                  : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>My To-Do Lists</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-400">
                {lists.length}
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedList(null);
                setCurrentTab('calendar');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'calendar'
                  ? 'btn-theme-primary text-white'
                  : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Full Calendar</span>
            </button>

            <button
              onClick={() => {
                setSelectedList(null);
                setCurrentTab('matrix');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'matrix'
                  ? 'btn-theme-primary text-white'
                  : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Eisenhower Matrix</span>
            </button>

            <button
              onClick={() => {
                setSelectedList(null);
                setCurrentTab('chat');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'chat'
                  ? 'btn-theme-primary text-white'
                  : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Live Workspace Chat</span>
            </button>

            <button
              onClick={() => {
                setSelectedList(null);
                setCurrentTab('connect');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'connect'
                  ? 'btn-theme-primary text-white'
                  : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Connect Workspaces</span>
            </button>

            <button
              onClick={() => {
                setSelectedList(null);
                setCurrentTab('settings');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                currentTab === 'settings'
                  ? 'btn-theme-primary text-white'
                  : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-slate-800'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Color Wheel & Theme</span>
            </button>
          </nav>

          {/* Active Lists Quick List */}
          <div className="mt-6 pt-4 border-t border-stone-200 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3 block mb-2">
              Workspaces ({lists.length})
            </span>
            <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
              {lists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setSelectedList(l);
                    setCurrentTab('lists');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition text-left ${
                    selectedList?.id === l.id
                      ? 'bg-theme text-white font-bold'
                      : 'text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: l.color || themeColor }}
                  />
                  <span className="truncate">{l.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer: User Profile & Actions */}
        <div className="pt-4 border-t border-stone-200 dark:border-slate-800 space-y-2">
          {/* User profile button */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className={`w-full p-2.5 rounded-2xl border flex items-center justify-between text-left transition hover:scale-[1.01] ${
              isDarkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-white border-[#E6DFD3]'
            }`}
            style={{
              borderColor: 'rgba(var(--accent-rgb), 0.4)',
              boxShadow: '0 0 10px rgba(var(--accent-rgb), 0.2)',
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-theme shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">{user.username}</div>
                <div className="text-[10px] text-stone-400 truncate">
                  {user.email || 'Monitor Profile'}
                </div>
              </div>
            </div>
            <span className="text-[10px] text-theme font-bold">Profile</span>
          </button>

          {/* Theme & Logout Buttons */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl border flex-1 flex items-center justify-center gap-1.5 text-xs transition ${
                isDarkMode ? 'border-slate-800 text-slate-300' : 'border-[#E6DFD3] text-stone-700'
              }`}
              title="Toggle Light/Dark Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-pink-500" />}
              <span className="text-[11px] font-semibold">{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>

            <button
              onClick={logout}
              className={`p-2 rounded-xl border flex items-center justify-center text-stone-400 hover:text-red-400 transition ${
                isDarkMode ? 'border-slate-800' : 'border-[#E6DFD3]'
              }`}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <PWAInstallButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-stone-200 dark:border-slate-800 app-sidebar">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border app-border text-stone-600 dark:text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center p-0.5 border border-pink-400 bg-black/30">
              <img src={todochanMascotImg} alt="Todo-chan" className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-sm text-theme">Todo-chan</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="p-1.5 rounded-lg border app-border text-theme"
              title="Profile"
            >
              <UserIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="btn-theme-gradient p-1.5 rounded-lg text-white"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Welcome Check-in Card on App Open / Reload */}
          {!welcomeCheckInDismissed && (
            <WelcomeCheckIn
              username={user.username}
              onSelectMood={(m) => {
                setWelcomeMood(m);
              }}
              onOpenFullTracker={() => {
                setIsEasterEggOpen(true);
              }}
              onDismiss={handleDismissWelcomeCheckIn}
            />
          )}

          {/* Tab Content Rendering */}
          {selectedList ? (
            <SelectedListView
              list={selectedList}
              tasks={tasks.filter((t) => t.listId === selectedList.id)}
              currentUserId={user.id}
              currentUsername={user.username}
              userRole={currentListRole}
              onBack={() => setSelectedList(null)}
              onOpenCreateTask={() => setIsCreateTaskOpen(true)}
              onSelectTask={(task: Task) => setSelectedTaskForDetails(task)}
              onToggleComplete={handleToggleComplete}
              onMoveQuadrant={async (taskId: string, quad: MatrixQuadrant) => {
                await updateDoc(doc(db, 'tasks', taskId), { matrixQuadrant: quad });
              }}
              onOpenSharingSettings={() => setSharingSettingsList(selectedList)}
              onOpenUpgradeDialog={() =>
                setUpgradeTarget({ listDocId: selectedList.id, listName: selectedList.name })
              }
              onDeleteList={async (listDocId: string) => {
                setSelectedList(null);
                await deleteDoc(doc(db, 'lists', listDocId));
              }}
              onUpdateListNameOrColor={async (listDocId: string, name: string, color: string) => {
                await updateDoc(doc(db, 'lists', listDocId), { name, color });
              }}
            />
          ) : currentTab === 'dashboard' ? (
            <PersonalDashboard
              username={user.username}
              tasks={tasks}
              lists={lists}
              unorganizedTasks={unorganizedTasks}
              onOpenCreateTask={() => setIsCreateTaskOpen(true)}
              onOpenCreateList={() => setIsCreateListOpen(true)}
              onSelectTask={(task: Task) => setSelectedTaskForDetails(task)}
              onSelectList={(list: TodoList) => setSelectedList(list)}
              onNavigateTab={(tab) => {
                if (tab === 'unorganized') setCurrentTab('unorganized');
                else setCurrentTab(tab as any);
              }}
              onToggleComplete={handleToggleComplete}
              onSaveTask={handleSaveTask}
              onCreateListSubmit={handleCreateListSubmit}
              onOpenUnorganizedView={() => setCurrentTab('unorganized')}
              onOpenWellnessTracker={() => setIsEasterEggOpen(true)}
            />
          ) : currentTab === 'unorganized' ? (
            <UnorganizedTasksView
              unorganizedTasks={unorganizedTasks}
              lists={lists}
              onTaskOrganized={handleSaveTask}
              onClose={() => setCurrentTab('dashboard')}
            />
          ) : currentTab === 'lists' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight">Your To-Do Lists</h1>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                    Manage, share, and collaborate across your personal and multi-user workspaces.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsConnectOpen(true)}
                    className="btn-theme-secondary flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Connect Workspace</span>
                  </button>
                  <button
                    onClick={() => setIsCreateListOpen(true)}
                    className="btn-theme-gradient flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition active:scale-95 shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create List</span>
                  </button>
                </div>
              </div>

              {/* Lists Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lists.map((l) => {
                  const listTasks = tasks.filter((t) => t.listId === l.id);
                  const completedCount = listTasks.filter((t) => t.status === 'completed').length;
                  const isOwner = l.ownerId === user.id;

                  return (
                    <div
                      key={l.id}
                      onClick={() => setSelectedList(l)}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer hover:-translate-y-1 app-card`}
                      style={{
                        borderTopWidth: '5px',
                        borderTopColor: l.color || themeColor,
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: `${l.color}18`,
                            color: l.color,
                          }}
                        >
                          Code: {l.listId}
                        </span>
                        <span className="text-[10px] text-stone-400 font-semibold">
                          {isOwner ? 'Owner' : 'Member'}
                        </span>
                      </div>

                      <h3 className="font-bold text-base mt-1 truncate">{l.name}</h3>
                      <p className={`text-xs line-clamp-2 mt-1 min-h-[32px] ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                        {l.description || 'No description provided.'}
                      </p>

                      <div className="mt-4 pt-3 border-t border-stone-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-stone-500">
                          {completedCount} / {listTasks.length} Done
                        </span>
                        <span className="text-theme font-bold flex items-center gap-1 text-[11px]">
                          <span>Open List</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : currentTab === 'calendar' ? (
            <CalendarWorkspace
              tasks={tasks}
              lists={lists}
              onSelectTask={(task: Task) => setSelectedTaskForDetails(task)}
              userRole={currentListRole}
            />
          ) : currentTab === 'matrix' ? (
            <EisenhowerMatrix
              tasks={tasks}
              onSelectTask={(task: Task) => setSelectedTaskForDetails(task)}
              onMoveQuadrant={async (taskId: string, quad: MatrixQuadrant) => {
                await updateDoc(doc(db, 'tasks', taskId), { matrixQuadrant: quad });
              }}
              onToggleComplete={handleToggleComplete}
              userRole="owner"
            />
          ) : currentTab === 'chat' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-theme" />
                    <span>Live Workspace Chat</span>
                  </h1>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                    Real-time collaboration chat attached directly to each of your shared to-do lists.
                  </p>
                </div>
              </div>

              {lists.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Select Room:</span>
                    {lists.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setSelectedList(l)}
                        className="btn-theme-secondary px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 active:scale-95 transition"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                        <span>{l.name}</span>
                      </button>
                    ))}
                  </div>

                  <WorkspaceChat
                    listId={lists[0].id}
                    listName={lists[0].name}
                    currentUserId={user.id}
                    currentUsername={user.username}
                    userRole="owner"
                    chatEnabled={true}
                  />
                </div>
              ) : (
                <p className="text-xs text-stone-500">Create a to-do list first to chat inside its workspace.</p>
              )}
            </div>
          ) : currentTab === 'connect' ? (
            <ConnectedWorkspacesView
              memberships={memberships}
              lists={lists}
              tasks={tasks}
              onOpenConnectDialog={() => setIsConnectOpen(true)}
              onUpgradeList={(docId: string, name: string) =>
                setUpgradeTarget({ listDocId: docId, listName: name })
              }
              onRemoveConnection={async (memId: string) => {
                await deleteDoc(doc(db, 'memberships', memId));
              }}
              onOpenList={(list: TodoList) => setSelectedList(list)}
              onOpenCalendarForList={(list: TodoList) => {
                setSelectedList(list);
                setCurrentTab('calendar');
              }}
              onOpenChatForList={(list: TodoList) => {
                setSelectedList(list);
                setCurrentTab('chat');
              }}
            />
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-black tracking-tight">Theme & Color Wheel</h1>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-stone-500'}`}>
                  Customize your accent color using the HSV color wheel. Default is Baby Pink Neon. All elements and neon glow automatically adapt!
                </p>
              </div>
              <ColorWheel />
            </div>
          )}
        </main>
      </div>

      {/* Persistent Floating Todo-chan Mascot (Winking reference design with peace sign) */}
      <TodoChanMascot
        tasks={tasks}
        username={user.username}
        onTriggerEasterEgg={() => setIsEasterEggOpen(true)}
        onOpenCheckIn={() => setIsEasterEggOpen(true)}
      />

      {/* Modals & Dialogs */}
      {isCreateTaskOpen && (
        <TaskFormModal
          isOpen={isCreateTaskOpen}
          onClose={() => {
            setIsCreateTaskOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
          initialTask={editingTask}
          listId={selectedList ? selectedList.id : (lists[0]?.id || '')}
          lists={lists}
          currentUsername={user.username}
        />
      )}

      {isCreateListOpen && (
        <CreateListModal
          isOpen={isCreateListOpen}
          onClose={() => setIsCreateListOpen(false)}
          onCreated={(newList: TodoList) => {
            setLists((prev) => [...prev, newList]);
            setSelectedList(newList);
            setIsCreateListOpen(false);
          }}
          sessionToken={user.id}
        />
      )}

      {isConnectOpen && (
        <ConnectListDialog
          isOpen={isConnectOpen}
          onClose={() => setIsConnectOpen(false)}
          onSuccess={() => {
            setIsConnectOpen(false);
            setCurrentTab('lists');
          }}
          sessionToken={user.id}
        />
      )}

      {selectedTaskForDetails && (
        <TaskDetailsPanel
          task={selectedTaskForDetails}
          isOpen={!!selectedTaskForDetails}
          onClose={() => setSelectedTaskForDetails(null)}
          onEdit={(t: Task) => {
            setEditingTask(t);
            setSelectedTaskForDetails(null);
            setIsCreateTaskOpen(true);
          }}
          onDelete={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
          userRole={currentListRole}
          currentUsername={user.username}
          currentUserId={user.id}
        />
      )}

      {sharingSettingsList && (
        <ListSharingSettingsDialog
          isOpen={!!sharingSettingsList}
          list={sharingSettingsList}
          onClose={() => setSharingSettingsList(null)}
          sessionToken={user.id}
          onListUpdated={() => setSharingSettingsList(null)}
        />
      )}

      {upgradeTarget && (
        <UpgradeAccessDialog
          isOpen={!!upgradeTarget}
          listDocId={upgradeTarget.listDocId}
          listName={upgradeTarget.listName}
          onClose={() => setUpgradeTarget(null)}
          onSuccess={() => setUpgradeTarget(null)}
          sessionToken={user.id}
        />
      )}
    </div>
  );
}
