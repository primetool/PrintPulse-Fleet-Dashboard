import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { AdminAuthState } from '../types';

const AdminAuthContext = createContext<AdminAuthState | null>(null);

const STORAGE_TOKEN_KEY = 'printpulse_admin_token';

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_TOKEN_KEY);
    }
    return null;
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(Boolean(adminToken));
  const [isDefaultPin, setIsDefaultPin] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState('Admin Passcode required to modify fleet configuration.');
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);

  // Pending action to execute upon successful unlock
  const pendingActionRef = useRef<(() => void | Promise<void>) | null>(null);

  // Check auth status with backend on load
  const verifyAuthStatus = useCallback(async (tokenToCheck: string | null) => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (tokenToCheck) {
        headers['x-admin-token'] = tokenToCheck;
      }
      const res = await fetch('/api/printpulse/auth/status', { headers });
      if (res.ok) {
        const data = await res.json();
        setIsDefaultPin(Boolean(data.isDefaultPin));
        if (data.authenticated) {
          setIsAdmin(true);
        } else if (tokenToCheck) {
          // Token expired or invalid
          setAdminToken(null);
          setIsAdmin(false);
          localStorage.removeItem(STORAGE_TOKEN_KEY);
        }
      }
    } catch (err) {
      console.warn('Could not verify admin status with server:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyAuthStatus(adminToken);
  }, []);

  const unlockAdmin = useCallback(async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/printpulse/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const token = data.token;
        setAdminToken(token);
        setIsAdmin(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_TOKEN_KEY, token);
        }
        setIsAuthModalOpen(false);

        // Execute any queued pending action
        if (pendingActionRef.current) {
          try {
            await pendingActionRef.current();
          } catch (actionErr) {
            console.error('Error running pending admin action:', actionErr);
          }
          pendingActionRef.current = null;
        }

        return { success: true };
      } else {
        return { success: false, error: data.error || 'Incorrect Admin PIN' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Verification network failure' };
    }
  }, []);

  const lockAdmin = useCallback(() => {
    setAdminToken(null);
    setIsAdmin(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    }
    pendingActionRef.current = null;
  }, []);

  const changePin = useCallback(async (newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!adminToken) {
      return { success: false, error: 'Not authenticated as admin' };
    }
    try {
      const res = await fetch('/api/printpulse/auth/change-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ newPin }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          setAdminToken(data.token);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
          }
        }
        setIsDefaultPin(newPin.trim() === '2026');
        setIsChangePinModalOpen(false);
        return { success: true };
      }
      return { success: false, error: data.error || 'Failed to update PIN' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error changing PIN' };
    }
  }, [adminToken]);

  const openAuthModal = useCallback((reason?: string, pendingAction?: () => void | Promise<void>) => {
    if (reason) {
      setAuthModalReason(reason);
    } else {
      setAuthModalReason('Admin Passcode required to modify printers or fleet data.');
    }
    if (pendingAction) {
      pendingActionRef.current = pendingAction;
    }
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    pendingActionRef.current = null;
  }, []);

  const requireAdminAction = useCallback((action: () => void | Promise<void>, promptReason?: string) => {
    if (isAdmin && adminToken) {
      action();
    } else {
      openAuthModal(promptReason, action);
    }
  }, [isAdmin, adminToken, openAuthModal]);

  const openChangePinModal = useCallback(() => {
    setIsChangePinModalOpen(true);
  }, []);

  const closeChangePinModal = useCallback(() => {
    setIsChangePinModalOpen(false);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        isAdmin,
        adminToken,
        isDefaultPin,
        isLoading,
        unlockAdmin,
        lockAdmin,
        changePin,
        requireAdminAction,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalReason,
        isChangePinModalOpen,
        openChangePinModal,
        closeChangePinModal,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth(): AdminAuthState {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
