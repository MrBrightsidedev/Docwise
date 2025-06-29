import { useState, useCallback } from 'react';
import { ToastType } from '../components/Toast';

interface ToastState {
  isVisible: boolean;
  type: ToastType;
  message: string;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    type: 'success',
    message: '',
  });

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({
      isVisible: true,
      type,
      message,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
};