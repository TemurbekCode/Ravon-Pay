import { useContext } from 'react';
import { WalletContext } from '../frontend/providers/WalletContext.js';

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet WalletProvider ichida ishlatilishi kerak');
  return ctx;
}
