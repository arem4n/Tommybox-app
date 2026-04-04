const fs = require('fs');

// 1. components/views/PlansSection.tsx
let plansCode = fs.readFileSync('components/views/PlansSection.tsx', 'utf8');

// Also import Timestamp
if (!plansCode.includes("import { doc, getDoc, updateDoc, collection, query, onSnapshot, Timestamp } from 'firebase/firestore';")) {
  plansCode = plansCode.replace(
    /import \{ doc, getDoc, updateDoc, collection, query, onSnapshot \} from 'firebase\/firestore';/,
    `import { doc, getDoc, updateDoc, collection, query, onSnapshot, Timestamp } from 'firebase/firestore';`
  );
}

const newTransferPayment = `
  const handleTransferPayment = async () => {
    if (!user?.id || !selectedPlanForPayment) return;
    try {
      await updateDoc(doc(db, 'users', user.id), {
        pendingPlan: selectedPlanForPayment.id,
        pendingPlanName: selectedPlanForPayment.name,
        pendingPlanPrice: selectedPlanForPayment.price,
        pendingPlanRequestedAt: Timestamp.now(),
        paymentStatus: 'pending_verification'
      });

      const phone = import.meta.env.VITE_TRAINER_PHONE || '';
      const message = encodeURIComponent(
        \`Hola! Quiero solicitar el plan \${selectedPlanForPayment.name} (\$\${selectedPlanForPayment.price.toLocaleString('es-CL')} CLP). Mi nombre: \${user.displayName}. Por favor confirma cuando esté activo. ¡Gracias!\`
      );
      if(phone) window.open(\`https://wa.me/\${phone}?text=\${message}\`, '_blank');

      alert('Tu solicitud fue enviada. El entrenador activará tu plan una vez confirmado el pago.');
      setSelectedPlanForPayment(null);
    } catch (error) {
      console.error("Error updating plan status: ", error);
    }
  };
`;

plansCode = plansCode.replace(
  /const handleTransferPayment = async \(\) => \{[^]*?\}\n\s*\};/,
  newTransferPayment
);

fs.writeFileSync('components/views/PlansSection.tsx', plansCode);

// 2. components/views/TrainerDashboard.tsx
let trainerCode = fs.readFileSync('components/views/TrainerDashboard.tsx', 'utf8');

if (!trainerCode.includes('deleteField')) {
    trainerCode = trainerCode.replace(
      /import \{ collection, query, onSnapshot, doc, updateDoc, deleteDoc, Timestamp \} from 'firebase\/firestore';/,
      `import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, Timestamp, deleteField } from 'firebase/firestore';`
    );
}

const targetPaymentsUI = `      {/* ── Payments ── */}
        {currentTab === 'payments' && (`;

const newPaymentsUI = `      {/* ── Payments / Solicitudes Pendientes ── */}
        {currentTab === 'payments' && (
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
                            \${client.pendingPlanPrice.toLocaleString('es-CL')} CLP
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
        )}
`;

// Find the block from "Payments" up to "Clients"
const paymentsStart = trainerCode.indexOf(`{/* ── Payments ── */}`);
const clientsStart = trainerCode.indexOf(`{/* ── Clients ── */}`);
if (paymentsStart !== -1 && clientsStart !== -1) {
  trainerCode = trainerCode.slice(0, paymentsStart) + newPaymentsUI + "\n        " + trainerCode.slice(clientsStart);
}
fs.writeFileSync('components/views/TrainerDashboard.tsx', trainerCode);
