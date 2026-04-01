import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Dumbbell, Zap, Award, CreditCard, Building2, X } from 'lucide-react';

const DEFAULT_PLANS = [
  {
    id: 'plan_1',
    name: 'Esencial',
    price: 70000,
    description: 'Perfecto para establecer una base sólida. Incluye 4 sesiones al mes, distribuidas en una por semana.',
    icon: 'Dumbbell',
    featured: false,
    features: ['4 sesiones al mes', 'Programa personalizado', 'Seguimiento de progreso']
  },
  {
    id: 'plan_2',
    name: 'Avanzado',
    price: 80000,
    description: 'Ideal para un progreso constante. Incluye 8 sesiones al mes, distribuidas en dos por semana.',
    icon: 'Zap',
    featured: true,
    features: ['8 sesiones al mes', 'Programa personalizado', 'Seguimiento de progreso', 'Chat con entrenador']
  },
  {
    id: 'plan_3',
    name: 'Elite',
    price: 90000,
    description: 'Para un compromiso total. Incluye 12 sesiones al mes, distribuidas en tres por semana.',
    icon: 'Award',
    featured: false,
    features: ['12 sesiones al mes', 'Programa personalizado', 'Seguimiento de progreso', 'Chat con entrenador', 'Acceso prioritario']
  },
];

const renderIcon = (iconName: string, isCurrent: boolean, featured: boolean) => {
  let imgSrc = '/custom-icons/plan_esencial.png';
  if (iconName === 'Zap') imgSrc = '/custom-icons/plan_avanzado.png';
  if (iconName === 'Award') imgSrc = '/custom-icons/plan_elite.png';

  return (
    <div className={`w-full h-48 rounded-2xl flex items-center justify-center mb-6 lg:mb-8 bg-slate-900 border border-slate-800 overflow-hidden`}>
      <img src={imgSrc} alt="Plan icon" className={`w-full h-full object-contain mix-blend-screen ${isCurrent ? 'opacity-50' : 'opacity-100'}`} />
    </div>
  );
};

const PlansSection = ({ user }: { user: any }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string>(user?.plan || 'free');
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<any | null>(null);
  const [showPlanChangeWarning, setShowPlanChangeWarning] = useState<any | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      const q = query(collection(db, 'plans'));
      const querySnapshot = await getDocs(q);
      const plansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlans(plansData);
    };

    fetchPlans();
  }, []);

  useEffect(() => {
      if (!user?.id) return;
      const unsubscribe = onSnapshot(doc(db, 'users', user.id), (docSnap) => {
          if (docSnap.exists()) {
              setCurrentPlan(docSnap.data().plan || 'free');
          }
      });
      return () => unsubscribe();
  }, [user?.id]);

  const handleCardPayment = async () => {
    if (!user?.id || !selectedPlanForPayment) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { plan: selectedPlanForPayment.id });
      setSelectedPlanForPayment(null);
    } catch (error) {
      console.error("Error updating plan: ", error);
    }
  };

  const handleTransferPayment = async () => {
    if (!user?.id || !selectedPlanForPayment) return;
    try {
      await updateDoc(doc(db, 'users', user.id), {
        plan: selectedPlanForPayment.id,
        paymentStatus: 'pending_verification'
      });
      setSelectedPlanForPayment(null);
    } catch (error) {
      console.error("Error updating plan status: ", error);
    }
  };

  const plansToRender = plans.length > 0 ? plans : DEFAULT_PLANS;

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-fade-in relative">
      <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-32">
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4 lg:mb-6 lg:mb-8 tracking-tight">Elige el plan perfecto para ti</h2>
          <p className="text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-gray-500 mb-12">Transforma tu vida con nuestros programas de entrenamiento personalizado.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-16 items-center">
        {plansToRender.map(plan => {
          const isCurrent = currentPlan === plan.id;
          const isFeatured = plan.featured;

          return (
            <div
              key={plan.id}
              className={`relative rounded-[2rem] transition-all duration-300 flex flex-col h-full ${
                isFeatured ? 'shadow-2xl lg:-mt-8 lg:mb-8 scale-105 z-10' : 'shadow-xl hover:shadow-2xl hover:-translate-y-2 z-10'
              } ${isCurrent ? '' : 'bg-slate-900 border border-slate-800 p-8'}`}
            >
              {/* Badges colocados AFUERA del overlow-hidden para ser siempre visibles */}
              {isFeatured && !isCurrent && (
                <div className="absolute -top-5 left-0 right-0 flex justify-center z-30 pointer-events-none">
                    <span className="bg-blue-600 text-white text-sm font-black px-4 py-2 rounded-full shadow-lg uppercase tracking-wider">
                        Más Popular
                    </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-5 left-0 right-0 flex justify-center z-30 pointer-events-none">
                    <span className="bg-blue-600 text-white text-sm font-black px-4 py-2 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)] border-2 border-blue-400 uppercase tracking-wider flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        Tu Plan Actual
                    </span>
                </div>
              )}

              <div className={`relative flex flex-col flex-1 h-full rounded-[2rem] ${isCurrent ? 'p-[4px] overflow-hidden shadow-[0_0_20px_rgba(37,99,235,0.2)]' : ''}`}>
                {isCurrent && (
                  <>
                    <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0_180deg,#38bdf8_280deg,#1d4ed8_360deg)] animate-[spin_2s_linear_infinite] blur-xl opacity-90" />
                    <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_180deg,transparent_0_180deg,#0ea5e9_280deg,#1e3a8a_360deg)] animate-[spin_2s_linear_infinite] blur-xl opacity-90" />
                  </>
                )}

                <div className={isCurrent ? 'relative bg-slate-900 rounded-[calc(2rem-4px)] p-8 flex flex-col flex-1 h-full z-10 border border-slate-800' : 'flex flex-col flex-1 h-full'}>

              <div className="flex-1">
                {renderIcon(plan.icon, isCurrent, isFeatured)}

                <h3 className="text-2xl lg:text-3xl lg:text-4xl font-black text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 mb-6 lg:mb-8 min-h-[48px]">{plan.description}</p>

                <div className="mb-8">
                  <span className="text-5xl font-extrabold text-white">
                    {plan.price === 0 ? "Gratis" : `$${(plan.price/1000).toFixed(0)}.000`}
                  </span>
                  {plan.price !== 0 && <span className="text-slate-400 font-medium ml-2">/ mes</span>}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features?.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start text-slate-300 font-medium">
                      <div className="mt-1 bg-green-100 rounded-full p-0.5 mr-3 shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

                <button
                  onClick={() => {
                      const hasActivePaidPlan = currentPlan && currentPlan !== 'free' && currentPlan !== 'Sin plan';
                      if (hasActivePaidPlan) {
                          setShowPlanChangeWarning(plan);
                      } else {
                          setSelectedPlanForPayment(plan);
                      }
                  }}
                  disabled={isCurrent}
                  className={`w-full py-4 rounded-2xl font-black text-lg lg:text-xl lg:text-2xl lg:text-3xl lg:text-4xl transition-all ${
                    isCurrent
                      ? 'bg-slate-800 text-blue-500 cursor-not-allowed shadow-inner'
                      : isFeatured
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/30 hover:-translate-y-1 z-20 relative'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200 hover:-translate-y-1 z-20 relative'
                  }`}
                >
                  {isCurrent ? 'Plan Activo' : 'Seleccionar Plan'}
                </button>
              </div>
             </div> 
            </div>
          );
        })}
      </div>

      {/* Plan Change Warning Modal */}
      {showPlanChangeWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto animate-fade-in">
          <div className="flex min-h-full items-start justify-center p-4 lg:p-8">
            <div className="my-auto bg-white rounded-3xl max-w-md w-full relative shadow-2xl p-6 lg:p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                <Award size={32} />
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-4">¡Excelente decisión! 🚀</h2>
            
            <p className="text-gray-600 font-medium mb-4">
                Nos emociona mucho que quieras saltar al plan <span className="font-bold text-blue-600">{showPlanChangeWarning.name}</span>.
            </p>

            {/* Value differential highlight */}
            {showPlanChangeWarning.features && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4 text-left">
                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">¿Qué ganas con este plan?</p>
                <ul className="space-y-1.5">
                  {showPlanChangeWarning.features.slice(0, 4).map((feat: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-500 font-black mt-0.5">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-gray-500 text-sm mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                Tu plan actual se mantiene vigente hasta fin de mes. Los nuevos beneficios se activan el próximo ciclo.
            </p>

            <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowPlanChangeWarning(null)}
                  className="flex-1 py-3 text-gray-500 hover:bg-gray-100 font-bold rounded-xl transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={() => {
                      setSelectedPlanForPayment(showPlanChangeWarning);
                      setShowPlanChangeWarning(null);
                  }}
                  className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
                >
                  Continuar
                </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedPlanForPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 lg:p-8">
            <div className="my-auto bg-white rounded-3xl max-w-lg lg:max-w-4xl w-full relative shadow-2xl flex flex-col border border-gray-100">
            <div className="absolute top-4 right-4 z-10">
                <button
                onClick={() => setSelectedPlanForPayment(null)}
                className="text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                >
                <X size={24} />
                </button>
            </div>

            <div className="p-6 lg:p-8 pt-10 sm:pt-6">
                <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2 text-center mt-2">Confirmar Plan</h2>
            <p className="text-center text-gray-500 font-medium text-lg lg:text-xl lg:text-2xl lg:text-3xl lg:text-4xl mb-8">
              {selectedPlanForPayment.name} — <span className="font-bold text-blue-600">${(selectedPlanForPayment.price/1000).toFixed(0)}.000</span>
            </p>

            <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-stretch">
              {/* Option 1: Card */}
              <div className="border border-slate-800 rounded-2xl bg-slate-900 flex flex-col overflow-hidden">
                <img src="/custom-icons/pay_card.png" alt="Pagar con tarjeta" className="w-full h-48 object-contain mix-blend-screen bg-slate-900" />
                <div className="p-6 lg:p-8 flex flex-col flex-1">
                <p className="text-slate-400 text-sm mb-6 flex-1 lg:text-base">Integración con Webpay próximamente. Tu plan será activado manualmente tras confirmar.</p>
                <button
                  onClick={handleCardPayment}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors mt-auto text-lg"
                >
                  Confirmar de todas formas
                </button>
                </div>
              </div>

              {/* Option 2: Transfer */}
              <div className="border border-gray-200 rounded-2xl p-6 lg:p-8 bg-gray-50/50 flex flex-col">
                <div className="flex items-center gap-3 mb-4 lg:mb-6 lg:mb-8">
                  <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                    <Building2 size={24} />
                  </div>
                  <h3 className="font-bold text-xl lg:text-2xl lg:text-3xl lg:text-4xl text-gray-900">Transferencia bancaria</h3>
                </div>
                <div className="bg-white rounded-xl p-4 lg:p-6 lg:p-8 text-sm font-medium text-gray-700 space-y-2 mb-6 lg:mb-8 border border-gray-100 flex-1">
                  <p><span className="text-gray-500 w-24 inline-block">Banco:</span> BancoEstado</p>
                  <p><span className="text-gray-500 w-24 inline-block">Cuenta Rut:</span> 12.345.678-9</p>
                  <p><span className="text-gray-500 w-24 inline-block">N° Cuenta:</span> 123456789</p>
                  <p><span className="text-gray-500 w-24 inline-block">Nombre:</span> Tommy Box SpA</p>
                  <p><span className="text-gray-500 w-24 inline-block">Email:</span> pagos@tommybox.cl</p>
                </div>
                <button
                  onClick={handleTransferPayment}
                  className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-md shadow-green-500/20 mt-auto"
                >
                  Ya realicé la transferencia
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedPlanForPayment(null)}
              className="w-full py-3 mt-6 text-gray-500 hover:text-gray-700 font-bold underline transition-colors"
            >
              Cancelar
            </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansSection;
