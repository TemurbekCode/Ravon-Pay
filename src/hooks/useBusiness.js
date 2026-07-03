import { useContext } from 'react';
import { BusinessContext } from '../frontend/providers/BusinessContext.js';

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness BusinessProvider ichida ishlatilishi kerak');
  return ctx;
}
