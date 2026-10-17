export type AccessLevel = 'owner' | 'editor' | 'viewer';

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'blocked';

export type MatrixQuadrant = 'q1' | 'q2' | 'q3' | 'q4';

export interface User {
  id: string;
  username: string;
  email?: string;
  emailVerified?: boolean;
  themeColor: string;
  isDarkMode: boolean;
  isNeonMode: boolean;
  eisenhowerThreshold: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TodoList {
  id: string; // Firestore document ID
  listId: string; // 6-char public ID e.g. '676767'
  name: string;
  description?: string;
  color: string;
  ownerId: string;
  ownerUsername: string;
  viewPassword?: string;
  editPassword?: string;
  viewPasswordHash?: string;
  editPasswordHash?: string;
  allowViewOnlySharing?: boolean;
  allowEditingSharing?: boolean;
  allowViewerChat?: boolean;
  allowViewerNotes?: boolean;
  allowViewerComments?: boolean;
  chatEnabled?: boolean;
  isArchived?: boolean;
  createdAt: string;
  updatedAt?: string;
  role?: AccessLevel;
}

export interface Membership {
  id: string; // `${listDocId}_${userId}`
  listId: string; // 6-character clean ID
  listDocId: string; // Firestore doc ID
  listName: string;
  userId: string;
  username: string;
  role: AccessLevel;
  canChat: boolean;
  chatAllowed?: boolean;
  grantedAt: string;
  revoked?: boolean;
}

export interface Task {
  id: string;
  listId: string; // references listDocId
  title: string;
  description?: string;
  assignedBy?: string;
  assignedTo?: string[];
  startDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  dueTime?: string; // HH:mm
  isAllDay?: boolean;
  importance: number; // 1 to 10
  urgency: number; // 1 to 10
  matrixQuadrant: MatrixQuadrant;
  matrixOverride?: boolean;
  durationMinutes?: number;
  color: string;
  status: TaskStatus;
  notes?: string;
  notesPrivate?: boolean;
  creatorId: string;
  creatorUsername: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string | null;
  isCareTask?: boolean;
}

export interface Comment {
  id: string;
  taskId: string;
  listId: string;
  authorId: string;
  authorUsername: string;
  content: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  listId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  createdAt: string;
}

// Talk to Todo-chan Task Capture Types
export interface UnorganizedTask {
  id: string;
  text: string;
  userId: string;
  scheduledDate?: string;
  notes?: string;
  isCompleted?: boolean;
  isOrganized?: boolean;
  destinationListId?: string;
  createdAt: string;
}

// Wellness, Moods & Care Task Types
export type MoodType =
  | 'happy'
  | 'excited'
  | 'calm'
  | 'okay'
  | 'tired'
  | 'stressed'
  | 'sad'
  | 'anxious'
  | 'overwhelmed'
  | 'frustrated';

export interface WellnessCheckin {
  id: string;
  userId: string;
  mood: MoodType;
  intensity: number; // 1 to 5
  reflection?: {
    day?: string;
    cause?: string;
    proudOf?: string;
    needsNow?: string;
    tomorrowBetter?: string;
  };
  createdAt: string;
}

export interface CareTask {
  id: string;
  userId: string;
  title: string;
  category: 'hydration' | 'nutrition' | 'break' | 'movement' | 'mental' | 'rest' | 'custom';
  isCompleted: boolean;
  isPrivate: boolean;
  linkedTaskId?: string;
  scheduledDate?: string;
  createdAt: string;
}
