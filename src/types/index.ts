export type AccessLevel = 'owner' | 'editor' | 'viewer';

export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'blocked';

export type MatrixQuadrant = 'q1' | 'q2' | 'q3' | 'q4';

export interface User {
  id: string;
  username: string;
  themeColor: string;
  isDarkMode: boolean;
  isNeonMode: boolean;
  eisenhowerThreshold: number;
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
