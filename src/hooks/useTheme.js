import { useContext } from 'react';
import { ThemeContext } from '../frontend/providers/ThemeContext.js';

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme ThemeProvider ichida ishlatilishi kerak');
  return ctx;
}
