import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types/index.ts';
import { useTheme } from './ThemeContext.tsx';
import { db } from '../lib/firebase.ts';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserPreferences: (prefs: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Web Crypto SHA-256 helper for client-side fallback
async function sha256Hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return localStorage.getItem('todochan_session_token');
  });
  const [isLoading, setIsLoading] = useState(true);
  const { setThemeColor, setIsDarkMode, setIsNeonMode } = useTheme();

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('todochan_session_token');
      const cachedUserId = localStorage.getItem('todochan_user_id');

      if (!token && !cachedUserId) {
        setIsLoading(false);
        return;
      }

      // Try backend check
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const text = await res.text();
          let data: any = null;
          try {
            data = JSON.parse(text);
          } catch (e) {
            data = null;
          }

          if (res.ok && data?.user) {
            setUser(data.user);
            if (data.user.id) localStorage.setItem('todochan_user_id', data.user.id);
            if (data.user.themeColor) setThemeColor(data.user.themeColor);
            if (typeof data.user.isDarkMode === 'boolean') setIsDarkMode(data.user.isDarkMode);
            if (typeof data.user.isNeonMode === 'boolean') setIsNeonMode(data.user.isNeonMode);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          // Backend offline or route not reached
        }
      }

      // Fallback: check Firestore directly with cachedUserId
      if (cachedUserId) {
        try {
          const userSnap = await getDoc(doc(db, 'users', cachedUserId));
          if (userSnap.exists()) {
            const uData = userSnap.data() as User;
            setUser(uData);
            if (uData.themeColor) setThemeColor(uData.themeColor);
            if (typeof uData.isDarkMode === 'boolean') setIsDarkMode(uData.isDarkMode);
            if (typeof uData.isNeonMode === 'boolean') setIsNeonMode(uData.isNeonMode);
          } else {
            localStorage.removeItem('todochan_session_token');
            localStorage.removeItem('todochan_user_id');
            setSessionToken(null);
            setUser(null);
          }
        } catch (e) {
          console.warn('Could not read cached user profile from Firestore.');
        }
      }

      setIsLoading(false);
    };

    checkSession();
  }, []);

  const login = async (username: string, password: string) => {
    const cleanUsername = username.trim();
    const normalized = cleanUsername.toLowerCase();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = null;
      }

      // If backend responded with valid JSON
      if (data && typeof data === 'object') {
        if (!res.ok) {
          return { success: false, error: data.error || 'Login failed.' };
        }
        setUser(data.user);
        setSessionToken(data.sessionToken);
        localStorage.setItem('todochan_session_token', data.sessionToken);
        if (data.user.id) localStorage.setItem('todochan_user_id', data.user.id);
        if (data.user.themeColor) setThemeColor(data.user.themeColor);
        if (typeof data.user.isDarkMode === 'boolean') setIsDarkMode(data.user.isDarkMode);
        if (typeof data.user.isNeonMode === 'boolean') setIsNeonMode(data.user.isNeonMode);
        return { success: true };
      }

      // Fallback: Authenticate directly against Firestore
      const reservationRef = doc(db, 'usernames', normalized);
      const resSnap = await getDoc(reservationRef);
      if (!resSnap.exists()) {
        return { success: false, error: 'Invalid username or password.' };
      }

      const { userId } = resSnap.data() as { userId: string };
      const userSnap = await getDoc(doc(db, 'users', userId));
      if (!userSnap.exists()) {
        return { success: false, error: 'Invalid username or password.' };
      }

      const userData = userSnap.data();
      const candidateHash = await sha256Hex(password + (userData.passwordSalt || ''));
      if (userData.passwordHash && userData.passwordHash !== candidateHash && userData.passwordHash !== password) {
        // Allow pass through if hash matched or client fallback matched
        return { success: false, error: 'Invalid username or password.' };
      }

      const localToken = 's_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const authenticatedUser: User = {
        id: userId,
        username: userData.username || cleanUsername,
        themeColor: userData.themeColor || '#ec4899',
        isDarkMode: userData.isDarkMode ?? true,
        isNeonMode: userData.isNeonMode ?? true,
        eisenhowerThreshold: userData.eisenhowerThreshold ?? 7,
      };

      setUser(authenticatedUser);
      setSessionToken(localToken);
      localStorage.setItem('todochan_session_token', localToken);
      localStorage.setItem('todochan_user_id', userId);
      if (authenticatedUser.themeColor) setThemeColor(authenticatedUser.themeColor);
      if (typeof authenticatedUser.isDarkMode === 'boolean') setIsDarkMode(authenticatedUser.isDarkMode);
      if (typeof authenticatedUser.isNeonMode === 'boolean') setIsNeonMode(authenticatedUser.isNeonMode);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login error occurred.' };
    }
  };

  const register = async (username: string, password: string) => {
    const cleanUsername = username.trim();
    const normalized = cleanUsername.toLowerCase();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = null;
      }

      // If backend responded with valid JSON
      if (data && typeof data === 'object') {
        if (!res.ok) {
          return { success: false, error: data.error || 'Registration failed.' };
        }
        setUser(data.user);
        setSessionToken(data.sessionToken);
        localStorage.setItem('todochan_session_token', data.sessionToken);
        if (data.user.id) localStorage.setItem('todochan_user_id', data.user.id);
        if (data.user.themeColor) setThemeColor(data.user.themeColor);
        if (typeof data.user.isDarkMode === 'boolean') setIsDarkMode(data.user.isDarkMode);
        if (typeof data.user.isNeonMode === 'boolean') setIsNeonMode(data.user.isNeonMode);
        return { success: true };
      }

      // Fallback: Register directly in Firestore if backend proxy returned non-JSON
      const reservationRef = doc(db, 'usernames', normalized);
      const existingRes = await getDoc(reservationRef);
      if (existingRes.exists()) {
        return { success: false, error: 'Username is already taken. Please choose another.' };
      }

      const userId = 'u_' + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
      const salt = Math.random().toString(36).substring(2, 10);
      const passwordHash = await sha256Hex(password + salt);

      // Reserve username
      await setDoc(reservationRef, {
        userId,
        username: cleanUsername,
        reservedAt: new Date().toISOString(),
      });

      // Create user profile
      const initialUserData: any = {
        id: userId,
        username: cleanUsername,
        normalizedUsername: normalized,
        passwordHash,
        passwordSalt: salt,
        themeColor: '#ec4899',
        isDarkMode: true,
        isNeonMode: true,
        eisenhowerThreshold: 7,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', userId), initialUserData);

      const localToken = 's_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const newUser: User = {
        id: userId,
        username: cleanUsername,
        themeColor: initialUserData.themeColor,
        isDarkMode: initialUserData.isDarkMode,
        isNeonMode: initialUserData.isNeonMode,
        eisenhowerThreshold: initialUserData.eisenhowerThreshold,
      };

      setUser(newUser);
      setSessionToken(localToken);
      localStorage.setItem('todochan_session_token', localToken);
      localStorage.setItem('todochan_user_id', userId);
      if (newUser.themeColor) setThemeColor(newUser.themeColor);
      if (typeof newUser.isDarkMode === 'boolean') setIsDarkMode(newUser.isDarkMode);
      if (typeof newUser.isNeonMode === 'boolean') setIsNeonMode(newUser.isNeonMode);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration error occurred.' };
    }
  };

  const logout = async () => {
    if (sessionToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
      } catch (err) {
        // silent fail
      }
    }
    localStorage.removeItem('todochan_session_token');
    localStorage.removeItem('todochan_user_id');
    setSessionToken(null);
    setUser(null);
  };

  const updateUserPreferences = async (prefs: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...prefs });

    // Update in Firestore
    try {
      await setDoc(doc(db, 'users', user.id), prefs, { merge: true });
    } catch (e) {
      console.warn('Could not persist preferences directly to Firestore');
    }

    // Also notify backend if token exists
    if (sessionToken) {
      try {
        await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify(prefs),
        });
      } catch (err) {
        // silent fail
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionToken,
        isLoading,
        login,
        register,
        logout,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
