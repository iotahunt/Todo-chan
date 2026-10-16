import crypto from 'crypto';
import express, { Request, Response } from 'express';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const apiRouter = express.Router();
apiRouter.use(express.json());

// In-memory session store & rate limiters
interface SessionData {
  userId: string;
  username: string;
  createdAt: number;
}
const sessions = new Map<string, SessionData>();

interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitEntry>();

function checkRateLimit(key: string, maxAttempts = 10, windowMs = 5 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxAttempts) {
    return false;
  }
  entry.count += 1;
  return true;
}

function resetRateLimit(key: string) {
  rateLimits.delete(key);
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function verifyPassword(candidate: string, salt: string, storedHash: string): boolean {
  const hash = hashPassword(candidate, salt);
  const bufA = Buffer.from(hash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function getSessionUser(req: Request): SessionData | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const xUid = req.headers['x-user-id'] as string;
    const xUname = req.headers['x-username'] as string;
    if (xUid) {
      return { userId: xUid, username: xUname || 'user', createdAt: Date.now() };
    }
    return null;
  }
  const token = authHeader.substring(7);
  const found = sessions.get(token);
  if (found) return found;

  const xUid = req.headers['x-user-id'] as string;
  const xUname = req.headers['x-username'] as string;
  if (xUid) {
    const sess = { userId: xUid, username: xUname || 'user', createdAt: Date.now() };
    sessions.set(token, sess);
    return sess;
  }
  return null;
}

async function getSessionUserAsync(req: Request): Promise<SessionData | null> {
  const sync = getSessionUser(req);
  if (sync) return sync;

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const xUid = req.headers['x-user-id'] as string;
  const xUname = req.headers['x-username'] as string;

  if (xUid) {
    try {
      const uSnap = await getDoc(doc(db, 'users', xUid));
      if (uSnap.exists()) {
        const uData = uSnap.data();
        const sess = { userId: xUid, username: uData.username || xUname || 'user', createdAt: Date.now() };
        if (token) sessions.set(token, sess);
        return sess;
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
}

// 1. REGISTER
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 30) {
      return res.status(400).json({ error: 'Username must be between 3 and 30 characters.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanUsername = username.trim();
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'Username may only contain letters, numbers, and underscores.' });
    }

    const normalized = cleanUsername.toLowerCase();
    const reservationRef = doc(db, 'usernames', normalized);
    const existingRes = await getDoc(reservationRef);
    if (existingRes.exists()) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }

    const userId = 'u_' + crypto.randomBytes(12).toString('hex');
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    // Reserve username
    await setDoc(reservationRef, {
      userId,
      username: cleanUsername,
      reservedAt: new Date().toISOString()
    });

    // Create user profile
    const userDocRef = doc(db, 'users', userId);
    const initialUserData = {
      id: userId,
      username: cleanUsername,
      normalizedUsername: normalized,
      passwordHash,
      passwordSalt: salt,
      themeColor: '#ec4899', // Pink default neon accent
      isDarkMode: true,
      isNeonMode: true,
      eisenhowerThreshold: 7,
      createdAt: new Date().toISOString()
    };
    await setDoc(userDocRef, initialUserData);

    const sessionToken = 's_' + crypto.randomBytes(32).toString('hex');
    const sessionData = { userId, username: cleanUsername, createdAt: Date.now() };
    sessions.set(sessionToken, sessionData);

    return res.json({
      success: true,
      sessionToken,
      user: {
        id: userId,
        username: cleanUsername,
        themeColor: initialUserData.themeColor,
        isDarkMode: initialUserData.isDarkMode,
        isNeonMode: initialUserData.isNeonMode,
        eisenhowerThreshold: initialUserData.eisenhowerThreshold,
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// 2. LOGIN
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const ip = req.ip || 'global';
    const rateLimitKey = `login_${ip}_${username}`;

    if (!checkRateLimit(rateLimitKey, 10, 5 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many failed login attempts. Please wait 5 minutes.' });
    }

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const normalized = String(username).trim().toLowerCase();
    const reservationRef = doc(db, 'usernames', normalized);
    const resSnap = await getDoc(reservationRef);

    if (!resSnap.exists()) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const { userId } = resSnap.data() as { userId: string };
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const userData = userSnap.data();
    const isValid = verifyPassword(password, userData.passwordSalt, userData.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    resetRateLimit(rateLimitKey);

    const sessionToken = 's_' + crypto.randomBytes(32).toString('hex');
    sessions.set(sessionToken, { userId, username: userData.username, createdAt: Date.now() });

    return res.json({
      success: true,
      sessionToken,
      user: {
        id: userId,
        username: userData.username,
        themeColor: userData.themeColor || '#ec4899',
        isDarkMode: userData.isDarkMode ?? true,
        isNeonMode: userData.isNeonMode ?? true,
        eisenhowerThreshold: userData.eisenhowerThreshold ?? 7,
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// 3. CURRENT USER / ME
apiRouter.get('/auth/me', async (req: Request, res: Response) => {
  try {
    const session = getSessionUser(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized session' });
    }
    const userSnap = await getDoc(doc(db, 'users', session.userId));
    if (!userSnap.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = userSnap.data();
    return res.json({
      user: {
        id: session.userId,
        username: userData.username,
        themeColor: userData.themeColor || '#ec4899',
        isDarkMode: userData.isDarkMode ?? true,
        isNeonMode: userData.isNeonMode ?? true,
        eisenhowerThreshold: userData.eisenhowerThreshold ?? 7,
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// 4. LOGOUT
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    sessions.delete(token);
  }
  return res.json({ success: true });
});

// 5. UPDATE PROFILE / PREFERENCES
apiRouter.post('/auth/update-profile', async (req: Request, res: Response) => {
  try {
    const session = getSessionUser(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    const { themeColor, isDarkMode, isNeonMode, eisenhowerThreshold } = req.body;
    const updates: Record<string, any> = {};
    if (themeColor) updates.themeColor = themeColor;
    if (typeof isDarkMode === 'boolean') updates.isDarkMode = isDarkMode;
    if (typeof isNeonMode === 'boolean') updates.isNeonMode = isNeonMode;
    if (typeof eisenhowerThreshold === 'number') updates.eisenhowerThreshold = eisenhowerThreshold;

    await updateDoc(doc(db, 'users', session.userId), updates);
    return res.json({ success: true, updates });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// 6. CONNECT TO-DO LIST (Two-Level Password Access)
apiRouter.post('/lists/connect', async (req: Request, res: Response) => {
  try {
    const session = await getSessionUserAsync(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized session. Please login.' });

    const { listId, viewPassword, editPassword } = req.body;
    if (!listId || typeof listId !== 'string') {
      return res.status(400).json({ error: 'To-Do List ID is required.' });
    }

    const trimmedId = listId.trim();
    const ip = req.ip || 'global';
    const rateLimitKey = `connect_${ip}_${trimmedId}`;

    if (!checkRateLimit(rateLimitKey, 15, 5 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many attempts. Please try again in 5 minutes.' });
    }

    if (!viewPassword && !editPassword) {
      return res.status(400).json({
        error: 'Please enter either the View Password (for read-only access) or Edit Password (for editing access).'
      });
    }

    // Find list document by listId field
    const listsColl = collection(db, 'lists');
    const q = query(listsColl, where('listId', '==', trimmedId));
    const snap = await getDocs(q);

    if (snap.empty) {
      return res.status(401).json({ error: 'Invalid List ID or password.' });
    }

    const listDoc = snap.docs[0];
    const listData = listDoc.data();

    // Check if list sharing is enabled
    if (listData.isArchived) {
      return res.status(403).json({ error: 'This list has been archived by the owner.' });
    }

    let grantedRole: 'editor' | 'viewer' | null = null;

    // Check Edit Password first if supplied
    if (editPassword && typeof editPassword === 'string' && editPassword.trim()) {
      const eInput = editPassword.trim();
      const matchPlain = listData.editPassword && listData.editPassword === eInput;
      const matchHashDirect = listData.editPasswordHash && listData.editPasswordHash === eInput;
      const matchPbkdf2 = listData.editPasswordHash && listData.editPasswordSalt && verifyPassword(eInput, listData.editPasswordSalt, listData.editPasswordHash);
      if (matchPlain || matchHashDirect || matchPbkdf2) {
        grantedRole = 'editor';
      }
    }

    // Check View Password if Edit Password wasn't granted and View Password was supplied
    if (!grantedRole && viewPassword && typeof viewPassword === 'string' && viewPassword.trim()) {
      const vInput = viewPassword.trim();
      const matchPlain = listData.viewPassword && listData.viewPassword === vInput;
      const matchHashDirect = listData.viewPasswordHash && listData.viewPasswordHash === vInput;
      const matchPbkdf2 = listData.viewPasswordHash && listData.viewPasswordSalt && verifyPassword(vInput, listData.viewPasswordSalt, listData.viewPasswordHash);
      if (matchPlain || matchHashDirect || matchPbkdf2) {
        grantedRole = 'viewer';
      }
    }

    if (!grantedRole) {
      return res.status(401).json({ error: 'Invalid List ID or password. Please verify the 1st step (View) or 2nd step (Edit) password.' });
    }

    resetRateLimit(rateLimitKey);

    // If user is actually the owner of the list, retain 'owner'
    if (listData.ownerId === session.userId) {
      grantedRole = 'editor'; // or owner
    }

    // Record or update authorized membership
    const membershipId = `${listDoc.id}_${session.userId}`;
    const membershipRef = doc(db, 'memberships', membershipId);
    const existingMembership = await getDoc(membershipRef);

    const canChat = grantedRole === 'editor' ? true : (listData.allowViewerChat ?? false);

    await setDoc(membershipRef, {
      id: membershipId,
      listId: listData.listId,
      listDocId: listDoc.id,
      listName: listData.name,
      userId: session.userId,
      username: session.username,
      role: grantedRole,
      canChat,
      grantedAt: existingMembership.exists() ? existingMembership.data().grantedAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revoked: false,
    }, { merge: true });

    return res.json({
      success: true,
      role: grantedRole,
      listDocId: listDoc.id,
      listId: listData.listId,
      listName: listData.name,
      canChat,
      message: grantedRole === 'editor' ? 'Connected as Editor (Full access)' : 'Connected as Viewer (Read-only access)'
    });
  } catch (err: any) {
    console.error('Connect list error:', err);
    return res.status(500).json({ error: 'Connection failed. Please verify credentials.' });
  }
});

// 7. UPGRADE ACCESS (Viewer to Editor)
apiRouter.post('/lists/upgrade-access', async (req: Request, res: Response) => {
  try {
    const session = await getSessionUserAsync(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized session.' });

    const { listDocId, editPassword } = req.body;
    if (!listDocId || !editPassword) {
      return res.status(400).json({ error: 'List ID and Edit Password are required.' });
    }

    const listRef = doc(db, 'lists', listDocId);
    const listSnap = await getDoc(listRef);
    if (!listSnap.exists()) {
      return res.status(404).json({ error: 'List not found.' });
    }

    const listData = listSnap.data();
    const eInput = String(editPassword).trim();
    const matchPlain = listData.editPassword && listData.editPassword === eInput;
    const matchHashDirect = listData.editPasswordHash && listData.editPasswordHash === eInput;
    const matchPbkdf2 = listData.editPasswordHash && listData.editPasswordSalt && verifyPassword(eInput, listData.editPasswordSalt, listData.editPasswordHash);

    if (!matchPlain && !matchHashDirect && !matchPbkdf2) {
      return res.status(401).json({ error: 'Incorrect Edit Password (2nd step password).' });
    }

    const membershipId = `${listDocId}_${session.userId}`;
    await setDoc(doc(db, 'memberships', membershipId), {
      role: 'editor',
      canChat: true,
      revoked: false,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return res.json({ success: true, role: 'editor', message: 'Upgraded to Editor access successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to upgrade access.' });
  }
});

// 8. CREATE LIST
apiRouter.post('/lists/create', async (req: Request, res: Response) => {
  try {
    const session = await getSessionUserAsync(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized session. Please login.' });

    const {
      name,
      description,
      color,
      viewPassword,
      editPassword,
      allowViewOnlySharing = true,
      allowEditingSharing = true,
      allowViewerChat = false,
      allowViewerNotes = true,
      allowViewerComments = true,
      chatEnabled = true,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'List name is required.' });
    }

    // Generate unique 6-character clean List ID (e.g. '676767' or random alphanumeric)
    let listId = '';
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    for (let i = 0; i < 6; i++) {
      listId += chars[Math.floor(Math.random() * chars.length)];
    }

    const vPassword = (viewPassword && String(viewPassword).trim()) || 'view' + Math.floor(100 + Math.random() * 900);
    const ePassword = (editPassword && String(editPassword).trim()) || 'edit' + Math.floor(100 + Math.random() * 900);

    const viewSalt = crypto.randomBytes(16).toString('hex');
    const editSalt = crypto.randomBytes(16).toString('hex');
    const viewPasswordHash = hashPassword(vPassword, viewSalt);
    const editPasswordHash = hashPassword(ePassword, editSalt);

    const listDocId = 'list_' + crypto.randomBytes(12).toString('hex');
    const newListDoc = {
      id: listDocId,
      name: name.trim(),
      description: (description || '').trim(),
      listId,
      ownerId: session.userId,
      ownerUsername: session.username,
      color: color || '#ec4899',
      viewPassword: vPassword,
      editPassword: ePassword,
      viewPasswordHash,
      viewPasswordSalt: viewSalt,
      editPasswordHash,
      editPasswordSalt: editSalt,
      allowViewOnlySharing: !!allowViewOnlySharing,
      allowEditingSharing: !!allowEditingSharing,
      allowViewerChat: !!allowViewerChat,
      allowViewerNotes: !!allowViewerNotes,
      allowViewerComments: !!allowViewerComments,
      chatEnabled: !!chatEnabled,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'lists', listDocId), newListDoc);

    // Create owner membership
    const membershipId = `${listDocId}_${session.userId}`;
    await setDoc(doc(db, 'memberships', membershipId), {
      id: membershipId,
      listId,
      listDocId,
      listName: name.trim(),
      userId: session.userId,
      username: session.username,
      role: 'owner',
      canChat: true,
      grantedAt: new Date().toISOString(),
      revoked: false
    });

    return res.json({
      success: true,
      list: {
        id: listDocId,
        listId,
        name: newListDoc.name,
        description: newListDoc.description,
        color: newListDoc.color,
        role: 'owner',
        viewPassword: vPassword,
        editPassword: ePassword,
      }
    });
  } catch (err: any) {
    console.error('Create list error:', err);
    return res.status(500).json({ error: 'Failed to create list' });
  }
});

// 9. UPDATE LIST PASSWORDS & REVOCATION
apiRouter.post('/lists/update-passwords', async (req: Request, res: Response) => {
  try {
    const session = await getSessionUserAsync(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized session' });

    const { listDocId, viewPassword, editPassword, revokeExistingGrants } = req.body;
    const listRef = doc(db, 'lists', listDocId);
    const snap = await getDoc(listRef);

    if (!snap.exists()) return res.status(404).json({ error: 'List not found' });
    const listData = snap.data();

    if (listData.ownerId !== session.userId) {
      return res.status(403).json({ error: 'Only the list owner can change access passwords.' });
    }

    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };

    if (viewPassword && String(viewPassword).trim()) {
      const cleanV = String(viewPassword).trim();
      const viewSalt = crypto.randomBytes(16).toString('hex');
      updates.viewPassword = cleanV;
      updates.viewPasswordSalt = viewSalt;
      updates.viewPasswordHash = hashPassword(cleanV, viewSalt);
    }

    if (editPassword && String(editPassword).trim()) {
      const cleanE = String(editPassword).trim();
      const editSalt = crypto.randomBytes(16).toString('hex');
      updates.editPassword = cleanE;
      updates.editPasswordSalt = editSalt;
      updates.editPasswordHash = hashPassword(cleanE, editSalt);
    }

    await updateDoc(listRef, updates);

    // If requested, invalidate all previously issued access grants except the owner
    if (revokeExistingGrants) {
      const q = query(collection(db, 'memberships'), where('listDocId', '==', listDocId));
      const membersSnap = await getDocs(q);
      const updatePromises = membersSnap.docs
        .filter(d => d.data().userId !== session.userId)
        .map(d => updateDoc(d.ref, { revoked: true, revokedAt: new Date().toISOString() }));
      await Promise.all(updatePromises);
    }

    return res.json({ success: true, message: 'Passwords updated successfully.', updates });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update credentials.' });
  }
});

// 10. REMOVE / REVOKE MEMBER
apiRouter.post('/lists/revoke-member', async (req: Request, res: Response) => {
  try {
    const session = await getSessionUserAsync(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized session' });

    const { listDocId, targetUserId } = req.body;
    const listRef = doc(db, 'lists', listDocId);
    const snap = await getDoc(listRef);
    if (!snap.exists()) return res.status(404).json({ error: 'List not found' });
    if (snap.data().ownerId !== session.userId) {
      return res.status(403).json({ error: 'Only the list owner can manage members.' });
    }

    const membershipId = `${listDocId}_${targetUserId}`;
    await deleteDoc(doc(db, 'memberships', membershipId));
    return res.json({ success: true, message: 'Member access revoked.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to revoke member' });
  }
});

// 11. TODO-CHAN AI NATURAL LANGUAGE TASK & LIST ENGINE
apiRouter.post('/todochan/ai', async (req: Request, res: Response) => {
  try {
    const { message, existingLists = [], existingTasks = [] } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const promptText = message.trim();
    const today = new Date().toISOString().split('T')[0];

    // Check if Gemini API key exists
    let aiResponse: any = null;
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const listNames = existingLists.map((l: any) => `"${l.name}" (id: ${l.id})`).join(', ');
        const taskTitles = existingTasks.map((t: any) => `"${t.title}" (id: ${t.id})`).join(', ');

        const systemInstruction = `You are Todo-chan, a cute, energetic anime kawaii assistant and task manager (bob cut with baby pink neon aesthetic).
Your mission is to understand user commands and return a valid JSON object.
Available lists: [${listNames}].
Available tasks: [${taskTitles}].
Today's date is ${today}.

Supported actions:
1. "create_task": User wants to add, create, or schedule a task.
   Fields to extract:
   - title: clear, concise task title
   - description: optional details
   - dueDate: YYYY-MM-DD (resolve relative words like 'today', 'tomorrow', 'next monday', or default to ${today})
   - startTime: HH:MM 24-hr string or undefined
   - dueTime: HH:MM 24-hr string or undefined
   - isAllDay: boolean
   - urgency: number between 0 and 10 (high urgency if user said urgent, ASAP, now, deadline soon)
   - importance: number between 0 and 10 (high importance if crucial, high priority, exam, project)
   - durationMinutes: estimated duration (e.g. 30, 60)
   - suggestedListId: the ID of the most relevant existing list from available lists, or empty if a new list is needed
   - matrixQuadrant: "q1" (urgent+important), "q2" (important not urgent), "q3" (urgent not important), "q4" (neither)
   - reply: enthusiastic, cute Todo-chan anime response with kaomoji (e.g. (✿◠‿◠), (｡•̀ᴗ-)✧, ✨, 💕) confirming the task creation and quadrant!

2. "create_list": User wants to create a new To-Do List or workspace.
   Fields to extract:
   - name: list name
   - description: optional
   - color: hex color (baby pink #ff69b4, violet #8b5cf6, cyan #06b6d4, etc.)
   - viewPassword: 4-6 char pass
   - editPassword: 4-6 char pass
   - reply: cute confirmation message

3. "complete_task": User wants to mark a task done or completed.
   - targetTaskId: id of the matching task
   - reply: celebratory anime encouragement

4. "chat_response": General greeting, motivation, or question.
   - reply: cute, supportive Todo-chan anime message reminding them of their goals!

Return ONLY raw JSON conforming to:
{
  "action": "create_task" | "create_list" | "complete_task" | "chat_response",
  "taskData": { ... },
  "listData": { ... },
  "targetTaskId": "...",
  "reply": "..."
}`;

        const modelRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });

        if (modelRes.text) {
          aiResponse = JSON.parse(modelRes.text);
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to smart local NLP parser:', geminiErr);
      }
    }

    // Fallback rule-based NLP parser if Gemini not configured or failed
    if (!aiResponse) {
      const lower = promptText.toLowerCase();

      // Check for complete task
      if (lower.startsWith('complete') || lower.startsWith('finish') || lower.includes('mark done') || lower.includes('mark as completed')) {
        const found = existingTasks.find((t: any) =>
          lower.includes(t.title.toLowerCase()) || t.title.toLowerCase().includes(lower.replace(/(complete|finish|mark done|mark as completed)/g, '').trim())
        );
        aiResponse = {
          action: 'complete_task',
          targetTaskId: found ? found.id : (existingTasks[0]?.id || null),
          reply: found
            ? `YAYYY! I marked "${found.title}" as completed! Todo-chan is so proud of you! ✨🎉 (｡•̀ᴗ-)✧`
            : `I'll help you complete that! Keep up the amazing momentum! 💕`,
        };
      }
      // Check for create list
      else if (lower.startsWith('create list') || lower.startsWith('new list') || lower.startsWith('add list') || lower.includes('create a list')) {
        const cleaned = promptText.replace(/(create a list for|create list for|create a list|create list|new list|add list)/i, '').trim();
        const listName = cleaned.length > 0 ? cleaned : 'New Workspace';
        aiResponse = {
          action: 'create_list',
          listData: {
            name: listName,
            description: `Workspace created by Todo-chan for ${listName}`,
            color: '#ff69b4',
            viewPassword: 'view' + Math.floor(100 + Math.random() * 900),
            editPassword: 'edit' + Math.floor(100 + Math.random() * 900),
          },
          reply: `Hai hai! I created the To-Do List "${listName}" for you with secure 2-step passwords! (✿◠‿◠)✨`,
        };
      }
      // Check for create task
      else if (
        lower.startsWith('add task') ||
        lower.startsWith('add ') ||
        lower.startsWith('remind me to') ||
        lower.startsWith('todo ') ||
        lower.startsWith('create task') ||
        !lower.includes('?')
      ) {
        let taskTitle = promptText
          .replace(/^(add task|add|remind me to|create task|todo:?)/i, '')
          .trim();

        // Extract urgency and importance
        const isUrgent = /urgent|asap|today|emergency|deadline|fast|quick|now/i.test(promptText);
        const isImportant = /important|critical|crucial|exam|test|boss|meeting|project|high priority/i.test(promptText);

        const urgency = isUrgent ? 9 : 5;
        const importance = isImportant ? 9 : 6;

        let quadrant: 'q1' | 'q2' | 'q3' | 'q4' = 'q2';
        if (urgency >= 7 && importance >= 7) quadrant = 'q1';
        else if (importance >= 7) quadrant = 'q2';
        else if (urgency >= 7) quadrant = 'q3';
        else quadrant = 'q4';

        // Match list
        let matchedList = existingLists[0] || null;
        for (const l of existingLists) {
          if (lower.includes(l.name.toLowerCase())) {
            matchedList = l;
            break;
          }
        }

        aiResponse = {
          action: 'create_task',
          taskData: {
            title: taskTitle || 'New Goal',
            description: `Scheduled via Todo-chan AI assistant`,
            dueDate: today,
            startTime: '10:00',
            dueTime: '11:00',
            isAllDay: false,
            urgency,
            importance,
            matrixQuadrant: quadrant,
            durationMinutes: 45,
            suggestedListId: matchedList?.id || '',
          },
          reply: `Hai hai! I scheduled "${taskTitle || 'New Goal'}" into "${matchedList?.name || 'your workspace'}" and mapped it to Quadrant ${quadrant.toUpperCase()}! Don't worry, Todo-chan will keep you on track! (｡•̀ᴗ-)✧💕`,
        };
      } else {
        aiResponse = {
          action: 'chat_response',
          reply: `Hello there! Todo-chan is ready to help you conquer your goals! Just type "Add [task]", "Create list [name]", or ask me anything! ✨ (✿◠‿◠)`,
        };
      }
    }

    return res.json({ success: true, ...aiResponse });
  } catch (err: any) {
    console.error('Todo-chan AI error:', err);
    return res.status(500).json({
      error: 'Todo-chan got a little confused!',
      reply: 'Oopsies! Todo-chan tripped over some wires! Please try again! (｡•́︿•̀｡)',
    });
  }
});
