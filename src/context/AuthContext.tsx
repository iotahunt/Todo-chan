import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as AppUser } from '../types/index.ts';
import { useTheme } from './ThemeContext.tsx';
import { auth, googleProvider, db } from '../lib/firebase.ts';
import {
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  deleteUser,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  sessionToken: string | null;
  isLoading: boolean;
  needsProfileSetup: boolean;
  setNeedsProfileSetup: (val: boolean) => void;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendVerification: () => Promise<{ success: boolean; error?: string }>;
  refreshAuthStatus: () => Promise<void>;
  updateUserPreferences: (prefs: Partial<AppUser>) => Promise<void>;
  updateProfileName: (name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const { themeColor, setThemeColor, setIsDarkMode, setIsNeonMode } = useTheme();

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            const data = snap.data() as AppUser;
            // Sync email and emailVerified from current Firebase User
            const mergedUser: AppUser = {
              ...data,
              id: fbUser.uid,
              email: fbUser.email || undefined,
              emailVerified: fbUser.emailVerified,
            };
            setUser(mergedUser);
            if (data.themeColor) setThemeColor(data.themeColor);
            if (typeof data.isDarkMode === 'boolean') setIsDarkMode(data.isDarkMode);
            if (typeof data.isNeonMode === 'boolean') setIsNeonMode(data.isNeonMode);

            // If user has default or empty username, prompt setup
            if (!data.username || data.username === 'Planner' || data.username.trim() === '') {
              setNeedsProfileSetup(true);
            } else {
              setNeedsProfileSetup(false);
            }
          } else {
            // New user signed in (e.g. via Google)
            const fallbackName = fbUser.displayName || fbUser.email?.split('@')[0] || '';
            const newUser: AppUser = {
              id: fbUser.uid,
              username: fallbackName || 'Planner',
              email: fbUser.email || undefined,
              emailVerified: fbUser.emailVerified,
              themeColor: '#ff69b4',
              isDarkMode: true,
              isNeonMode: true,
              eisenhowerThreshold: 7,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await setDoc(userDocRef, newUser);
            setUser(newUser);
            setNeedsProfileSetup(!fallbackName || fallbackName === 'Planner');
          }
        } catch (err) {
          console.error('Error fetching user profile from Firestore:', err);
          // Fallback user object from Firebase auth
          setUser({
            id: fbUser.uid,
            username: fbUser.displayName || fbUser.email?.split('@')[0] || 'Planner',
            email: fbUser.email || undefined,
            emailVerified: fbUser.emailVerified,
            themeColor: '#ff69b4',
            isDarkMode: true,
            isNeonMode: true,
            eisenhowerThreshold: 7,
          });
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setNeedsProfileSetup(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [setThemeColor, setIsDarkMode, setIsNeonMode]);

  // Sign in with Google
  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (popupErr: any) {
      if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return { success: true };
        } catch (redirectErr: any) {
          return { success: false, error: redirectErr.message || 'Google sign-in was blocked.' };
        }
      }
      if (popupErr.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Sign-in cancelled.' };
      }
      return { success: false, error: popupErr.message || 'Failed to sign in with Google.' };
    }
  };

  // Sign in with Email
  const signInWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      return { success: true };
    } catch (err: any) {
      let msg = 'Failed to sign in.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed login attempts. Please try again in a few minutes or reset your password.';
      } else if (err.message) {
        msg = err.message;
      }
      return { success: false, error: msg };
    }
  };

  // Sign up with Email
  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const chosenName = displayName?.trim() || email.split('@')[0];

      if (chosenName) {
        try {
          await updateProfile(cred.user, { displayName: chosenName });
        } catch (e) {
          // ignore
        }
      }

      // Send genuine verification email
      try {
        await sendEmailVerification(cred.user);
      } catch (verErr) {
        console.warn('Could not send verification email immediately:', verErr);
      }

      const newUser: AppUser = {
        id: cred.user.uid,
        username: chosenName,
        email: cred.user.email || undefined,
        emailVerified: false,
        themeColor: '#ff69b4',
        isDarkMode: true,
        isNeonMode: true,
        eisenhowerThreshold: 7,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', cred.user.uid), newUser);
      setUser(newUser);
      setNeedsProfileSetup(!chosenName || chosenName === 'Planner');

      return { success: true };
    } catch (err: any) {
      let msg = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email address is already registered. Please sign in or reset your password.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.message) {
        msg = err.message;
      }
      return { success: false, error: msg };
    }
  };

  // Password reset email
  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: any) {
      // Neutral message to prevent account enumeration
      return {
        success: true,
      };
    }
  };

  // Resend email verification
  const resendVerification = async (): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser) return { success: false, error: 'No user signed in.' };
    try {
      await sendEmailVerification(auth.currentUser);
      return { success: true };
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        return { success: false, error: 'Please wait a moment before requesting another verification email.' };
      }
      return { success: false, error: err.message || 'Failed to resend verification email.' };
    }
  };

  // Refresh user state (check if email verified)
  const refreshAuthStatus = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setFirebaseUser({ ...auth.currentUser });
      if (user) {
        setUser({ ...user, emailVerified: auth.currentUser.emailVerified });
      }
    }
  };

  // Update profile name
  const updateProfileName = async (name: string): Promise<{ success: boolean; error?: string }> => {
    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Name must be at least 2 characters.' };
    }
    if (!auth.currentUser || !user) {
      return { success: false, error: 'Not authenticated.' };
    }

    try {
      await updateProfile(auth.currentUser, { displayName: cleanName });
      await updateDoc(doc(db, 'users', user.id), {
        username: cleanName,
        updatedAt: new Date().toISOString(),
      });
      setUser((prev) => (prev ? { ...prev, username: cleanName } : null));
      setNeedsProfileSetup(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update name.' };
    }
  };

  // Update preferences
  const updateUserPreferences = async (prefs: Partial<AppUser>) => {
    if (!user) return;
    const updated = { ...user, ...prefs, updatedAt: new Date().toISOString() };
    setUser(updated);

    if (prefs.themeColor) setThemeColor(prefs.themeColor);
    if (typeof prefs.isDarkMode === 'boolean') setIsDarkMode(prefs.isDarkMode);
    if (typeof prefs.isNeonMode === 'boolean') setIsNeonMode(prefs.isNeonMode);

    try {
      await updateDoc(doc(db, 'users', user.id), prefs);
    } catch (e) {
      console.warn('Could not update preferences in Firestore:', e);
    }
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  // Delete account feature
  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    if (!auth.currentUser || !user) return { success: false, error: 'No user signed in.' };
    try {
      const uid = user.id;
      // Delete user profile doc from Firestore
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (e) {
        console.warn('Could not delete user document:', e);
      }

      // Delete Firebase Auth user
      await deleteUser(auth.currentUser);
      setUser(null);
      setFirebaseUser(null);
      return { success: true };
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        return {
          success: false,
          error: 'For security reasons, please log out and log back in before deleting your account.',
        };
      }
      return { success: false, error: err.message || 'Failed to delete account.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        sessionToken: user?.id || null,
        isLoading,
        needsProfileSetup,
        setNeedsProfileSetup,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        resendVerification,
        refreshAuthStatus,
        updateUserPreferences,
        updateProfileName,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
