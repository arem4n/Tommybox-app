import React from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Aceptar', cancelText = 'Cancelar', type = 'info' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-scale-up">
        <h3 className={`text-lg font-bold mb-2 ${type === 'error' ? 'text-red-600' : type === 'success' ? 'text-green-600' : type === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`}>
          {title}
        </h3>
        <div className="text-gray-600 mb-6">{message}</div>
        <div className="flex justify-end gap-3">
          {onCancel && (
            <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              {cancelText}
            </button>
          )}
          {onConfirm && (
            <button onClick={onConfirm} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${type === 'error' ? 'bg-red-600 hover:bg-red-700' : type === 'success' ? 'bg-green-600 hover:bg-green-700' : type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
