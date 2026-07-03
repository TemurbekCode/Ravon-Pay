import { useContext } from 'react';
import { AuthContext } from '../frontend/providers/AuthProvider.jsx';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak');
  return ctx;
}
