import React, { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { AppUser } from '../../../types';
import { db } from '../../../services/firebase';
import { doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { getPlanName } from '../../../utils/plans';

interface TrainerClientsListProps {
  activeClients: AppUser[];
  archivedClients: AppUser[];
  setSelectedClient: (client: AppUser | null) => void;
  showConfirm: (title: string, msg: string, onConfirm: () => void) => void;
}

const TrainerClientsList: React.FC<TrainerClientsListProps> = ({
  activeClients,
  archivedClients,
  setSelectedClient,
  showConfirm
}) => {
  const [showArchived, setShowArchived] = useState(false);

  const archiveClient = async (clientId: string) => {
    try {
      await updateDoc(doc(db, 'users', clientId), { status: 'archived', archivedAt: Timestamp.now() });
    } catch(e) { console.error(e); }
  };

  const restoreClient = async (clientId: string) => {
    try {
      await updateDoc(doc(db, 'users', clientId), { status: 'active', archivedAt: null });
    } catch(e) { console.error(e); }
  };

  const deleteClient = async (clientId: string) => {
    showConfirm('¿Eliminar cliente permanentemente?', 'Esta acción no se puede deshacer.', async () => {
      try { await deleteDoc(doc(db, 'users', clientId)); } catch(e) { console.error(e); }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 mb-4">
          Clientes Activos <span className="text-gray-400 font-medium text-lg">({activeClients.length})</span>
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {activeClients.map(client => (
            <div key={client.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                {client.photoURL ? (
                  <img src={client.photoURL} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-blue-600 text-lg">
                    {client.displayName?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{client.displayName}</p>
                <p className="text-xs text-gray-500 truncate">{client.email}</p>
                {client.createdAt?.toDate && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Miembro desde {client.createdAt.toDate().toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>

              {/* Plan badge */}
              <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold whitespace-nowrap hidden sm:block">
                {client.plan ? getPlanName(client.plan) : 'Sin plan'}
              </span>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedClient(client)}
                  className="px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Ver →
                </button>
                <button
                  onClick={() => archiveClient(client.id)}
                  className="px-3 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors hidden sm:block"
                >
                  Archivar
                </button>
              </div>
            </div>
          ))}
          {activeClients.length === 0 && (
            <div className="p-12 text-center text-gray-500">No hay clientes activos.</div>
          )}
        </div>
      </div>

      {/* Archived toggle */}
      <button
        onClick={() => setShowArchived(!showArchived)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
      >
        <ChevronDown size={16} className={showArchived ? 'rotate-180 transition-transform' : 'transition-transform'} />
        Archivados ({archivedClients.length})
      </button>

      {showArchived && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Info size={12} /> Los clientes archivados se eliminan automáticamente después de 60 días.
          </p>
          {archivedClients.map(client => (
            <div key={client.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 opacity-70">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="font-black text-gray-400 text-lg">
                  {client.displayName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-600 truncate">{client.displayName}</p>
                <p className="text-xs text-gray-400">
                  Archivado: {client.archivedAt?.toDate?.().toLocaleDateString('es-CL') || '—'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => restoreClient(client.id)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 text-sm font-bold rounded-xl hover:bg-blue-200 transition-colors"
                >
                  Restaurar
                </button>
                <button
                  onClick={() => deleteClient(client.id)}
                  className="px-3 py-2 bg-red-100 text-red-600 text-sm font-bold rounded-xl hover:bg-red-200 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainerClientsList;
