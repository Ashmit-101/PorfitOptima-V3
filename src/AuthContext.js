import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email/password
  const signup = async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name
    await updateProfile(userCredential.user, {
      displayName: displayName
    });
    
    return userCredential;
  };

  // Login with email/password
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Login with Google
  const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  // Logout
  const logout = () => {
    return signOut(auth);
  };

  // Reset password
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Update email
  const updateEmail = (email) => {
    return updateEmail(auth.currentUser, email);
  };

  // Update password
  const updatePassword = (password) => {
    return updatePassword(auth.currentUser, password);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateEmail,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}