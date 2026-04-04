import React from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
import { AppUser } from '../../../types';
import { db } from '../../../services/firebase';
import { doc, updateDoc, deleteField } from 'firebase/firestore';

interface TrainerPaymentsProps {
  pendingPayments: AppUser[];
  showAlert: (message: string) => void;
}

const TrainerPayments: React.FC<TrainerPaymentsProps> = ({ pendingPayments, showAlert }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">
          Solicitudes Pendientes ({pendingPayments.length})
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Confirma manualmente las solicitudes de plan para activarlas a tus atletas.
        </p>
      </div>
      {pendingPayments.length === 0 ? (
        <div className="p-12 text-center text-gray-500 font-medium">
          No tienes solicitudes pendientes por verificar.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {pendingPayments.map(client => (
            <div key={client.id} className="p-6 hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{client.displayName}</p>
                  <p className="text-sm text-gray-500">{client.email}</p>
                  {client.pendingPlanRequestedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Solicitado el {client.pendingPlanRequestedAt.toDate?.().toLocaleDateString('es-CL')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                <div className="flex flex-col items-start sm:items-end">
                  <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">
                    {client.pendingPlanName || 'Plan solicitado'}
                  </span>
                  {client.pendingPlanPrice && (
                    <span className="text-xs text-gray-500 font-medium mt-1 pr-1">
                      ${client.pendingPlanPrice.toLocaleString('es-CL')} CLP
                    </span>
                  )}
                </div>
                <button
                  onClick={async () => {
                     try {
                       await updateDoc(doc(db, 'users', client.id), {
                         plan: client.pendingPlan || client.plan,
                         paymentStatus: deleteField(),
                         pendingPlan: deleteField(),
                         pendingPlanName: deleteField(),
                         pendingPlanPrice: deleteField(),
                         pendingPlanRequestedAt: deleteField()
                       });
                       showAlert('Plan activado correctamente.');
                     } catch(e) { console.error(e); }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  <CheckCircle size={18} /> Activar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainerPayments;
