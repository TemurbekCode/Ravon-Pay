import { useContext } from 'react';
import { ToastContext } from '../frontend/dashboard/businessDashboard/ToastContext.js';

export function useToast() {
  return useContext(ToastContext);
}
