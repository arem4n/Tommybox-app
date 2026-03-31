import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { confirmPasswordReset } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Lock, Loader2 } from 'lucide-react';
import { useModal } from '../../contexts/ModalContext';

export default function ResetPasswordView() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useModal();

  const queryParams = new URLSearchParams(location.search);
  const oobCode = queryParams.get('oobCode');

  if (!oobCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace inválido</h2>
          <p className="text-gray-600 mb-6">El enlace para restablecer la contraseña no es válido o ha expirado.</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Volver al inicio</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      showAlert('Error', 'Las contraseñas no coinciden.', 'error');
      return;
    }
    if (password.length < 6) {
      showAlert('Error', 'La contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }

    setLoading(true);
    try {
      if(auth) {
         await confirmPasswordReset(auth, oobCode, password);
         showAlert('¡Éxito!', 'Tu contraseña ha sido actualizada.', 'success');
         navigate('/');
      } else {
         showAlert('Error', 'No se pudo conectar al servicio de autenticación', 'error');
      }
    } catch (error: any) {
      console.error(error);
      showAlert('Error', 'No se pudo restablecer la contraseña. Puede que el enlace haya expirado.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Nueva Contraseña</h2>
        <p className="text-center text-gray-500 mb-8">Ingresa tu nueva contraseña para TommyBox.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
