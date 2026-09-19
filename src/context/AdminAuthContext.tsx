import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { AdminAuthState } from '../types';

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDefaultPin, setIsDefaultPin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState('Admin authorization is required.');
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);
  const pendingActionRef = useRef<(() => void | Promise<void>) | null>(null);

  const verifyAuthStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/printpulse/auth/status', { credentials: 'include' });
      const data = await res.json();
      setIsDefaultPin(Boolean(data.isDefaultPin));
      setIsAdmin(Boolean(data.authenticated));
      if (!data.authenticated) setAdminToken(null);
    } catch (err) {
      console.warn('Could not verify admin status with server:', err);
      setIsAdmin(false);
      setAdminToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { verifyAuthStatus(); }, [verifyAuthStatus]);

  const unlockAdmin = useCallback(async (pin: string) => {
    try {
      const res = await fetch('/api/printpulse/auth/verify-pin', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) return { success: false, error: data.error || 'Authorization failed' };
      setAdminToken('session');
      setIsAdmin(true);
      setIsAuthModalOpen(false);
      if (pendingActionRef.current) {
        await pendingActionRef.current();
        pendingActionRef.current = null;
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verification network failure' };
    }
  }, []);

  const lockAdmin = useCallback(async () => {
    try { await fetch('/api/printpulse/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    setAdminToken(null);
    setIsAdmin(false);
    pendingActionRef.current = null;
  }, []);

  const changePin = useCallback(async (newPin: string) => {
    try {
      const res = await fetch('/api/printpulse/auth/change-pin', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPin }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) return { success: false, error: data.error || 'Failed to update PIN' };
      setIsDefaultPin(false);
      setIsChangePinModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error changing PIN' };
    }
  }, []);

  const openAuthModal = useCallback((reason?: string, pendingAction?: () => void | Promise<void>) => {
    setAuthModalReason(reason || 'Admin authorization is required.');
    pendingActionRef.current = pendingAction || null;
    setIsAuthModalOpen(true);
  }, []);
  const closeAuthModal = useCallback(() => { setIsAuthModalOpen(false); pendingActionRef.current = null; }, []);
  const requireAdminAction = useCallback((action: () => void | Promise<void>, reason?: string) => {
    if (isAdmin) void action(); else openAuthModal(reason, action);
  }, [isAdmin, openAuthModal]);

  return <AdminAuthContext.Provider value={{
    isAdmin, adminToken, isDefaultPin, isLoading, unlockAdmin, lockAdmin, changePin,
    requireAdminAction, isAuthModalOpen, openAuthModal, closeAuthModal, authModalReason,
    isChangePinModalOpen, openChangePinModal: () => setIsChangePinModalOpen(true),
    closeChangePinModal: () => setIsChangePinModalOpen(false),
  }}>{children}</AdminAuthContext.Provider>;
};

export function useAdminAuth(): AdminAuthState {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return context;
}
