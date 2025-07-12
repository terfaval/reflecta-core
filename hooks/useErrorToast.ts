import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext';

export function useErrorToast() {
  return useContext(ToastContext).showError;
}