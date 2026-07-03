import { useContext } from 'react';
import { LanguageContext } from '../frontend/providers/LanguageProvider.jsx';

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage LanguageProvider ichida ishlatilishi kerak');
  return ctx;
}
