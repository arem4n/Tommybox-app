import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Modal from '../components/Modal';
import confetti from 'canvas-confetti';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  isAchievement?: boolean;
}

interface ModalContextType {
  showAlert: (title: string, message: ReactNode, type?: 'info' | 'success' | 'warning' | 'error') => void;
  showConfirm: (title: string, message: ReactNode, onConfirm: () => void, type?: 'info' | 'success' | 'warning' | 'error') => void;
  showAchievement: (title: string, achievementName: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, title: '', message: '' });

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showAlert = useCallback((title: string, message: ReactNode, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: closeModal,
      confirmText: 'Aceptar',
    });
  }, [closeModal]);

  const showConfirm = useCallback((title: string, message: ReactNode, onConfirm: () => void, type: 'info' | 'success' | 'warning' | 'error' = 'warning') => {
    setModalState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => {
        onConfirm();
        closeModal();
      },
      onCancel: closeModal,
      confirmText: 'Aceptar',
      cancelText: 'Cancelar',
    });
  }, [closeModal]);

  const showAchievement = useCallback((title: string, achievementName: string) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    setModalState({
      isOpen: true,
      title,
      message: (
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-center font-semibold text-lg">{achievementName}</p>
        </div>
      ),
      type: 'success',
      isAchievement: true,
      onConfirm: closeModal,
      confirmText: '¡Genial!',
    });
  }, [closeModal]);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showAchievement }}>
      {children}
      <Modal {...modalState} />
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
