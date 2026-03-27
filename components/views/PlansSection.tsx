import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Dumbbell, Zap, Award } from 'lucide-react';

const DEFAULT_PLANS = [
  {
    id: 'plan_1',
    name: '1 Sesión / Semana',
    price: 70000,
    description: 'Perfecto para establecer una base sólida. Incluye 4 sesiones al mes, distribuidas en una por semana.',
    icon: 'Dumbbell',
    featured: false,
    features: ['4 sesiones al mes', 'Programa personalizado', 'Seguimiento de progreso']
  },
  {
    id: 'plan_2',
    name: '2 Sesiones / Semana',
    price: 80000,
    description: 'Ideal para un progreso constante. Incluye 8 sesiones al mes, distribuidas en dos por semana.',
    icon: 'Zap',
    featured: true,
    features: ['8 sesiones al mes', 'Programa personalizado', 'Seguimiento de progreso', 'Chat con entrenador']
  },
  {
    id: 'plan_3',
    name: '3 Sesiones / Semana',
    price: 90000,
    description: 'Para un compromiso total. Incluye 12 sesiones al mes, distribuidas en tres por semana.',
    icon: 'Award',
    featured: false,
    features: ['12 sesiones al mes', 'Programa personalizado', 'Seguimiento de progreso', 'Chat con entrenador', 'Acceso prioritario']
  },
];

const renderIcon = (iconName: string, isCurrent: boolean, featured: boolean) => {
  const colorClass = isCurrent ? 'text-blue-600 bg-blue-100' : featured ? 'text-white bg-blue-500' : 'text-blue-600 bg-blue-50';

  let iconComponent = <Dumbbell size={24} />;
  if (iconName === 'Zap') iconComponent = <Zap size={24} />;
  if (iconName === 'Award') iconComponent = <Award size={24} />;

  return (
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${colorClass}`}>
      {iconComponent}
    </div>
  );
};

const PlansSection = ({ user }: { user: any }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string>(user?.plan || 'free');

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

  const selectPlan = async (planId: string, planName: string) => {
    if (!user?.id) return;
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        plan: planId
      });
    } catch (error) {
      console.error("Error updating plan: ", error);
    }
  };

  const plansToRender = plans.length > 0 ? plans : DEFAULT_PLANS;

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Elige el plan perfecto para ti</h2>
          <p className="text-xl text-gray-500">Transforma tu vida con nuestros programas de entrenamiento personalizado.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-center">
        {plansToRender.map(plan => {
          const isCurrent = currentPlan === plan.id;
          const isFeatured = plan.featured;

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-[2rem] p-8 flex flex-col h-full transition-all duration-300 ${
                isFeatured ? 'ring-4 ring-blue-600 shadow-2xl lg:-mt-8 lg:mb-8 scale-105 z-10' : 'border border-gray-100 shadow-xl hover:shadow-2xl hover:-translate-y-2'
              } ${isCurrent ? 'bg-blue-50/30' : ''}`}
            >
              {isFeatured && !isCurrent && (
                <div className="absolute -top-5 left-0 right-0 flex justify-center">
                    <span className="bg-blue-600 text-white text-sm font-black px-4 py-2 rounded-full shadow-lg uppercase tracking-wider">
                        Más Popular
                    </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-5 left-0 right-0 flex justify-center">
                    <span className="bg-green-500 text-white text-sm font-black px-4 py-2 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        Tu Plan Actual
                    </span>
                </div>
              )}

              <div className="flex-1">
                {renderIcon(plan.icon, isCurrent, isFeatured)}

                <h3 className="text-2xl font-black text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-500 mb-6 min-h-[48px]">{plan.description}</p>

                <div className="mb-8">
                  <span className="text-5xl font-extrabold text-gray-900">
                    {plan.price === 0 ? "Gratis" : `$${(plan.price/1000).toFixed(0)}.000`}
                  </span>
                  {plan.price !== 0 && <span className="text-gray-500 font-medium ml-2">/ mes</span>}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features?.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start text-gray-700 font-medium">
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
                onClick={() => selectPlan(plan.id, plan.name)}
                disabled={isCurrent}
                className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${
                  isCurrent
                    ? 'bg-green-500 text-white cursor-not-allowed shadow-md shadow-green-500/30'
                    : isFeatured
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/30 hover:-translate-y-1'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 hover:-translate-y-1'
                }`}
              >
                {isCurrent ? 'Plan Activo' : 'Seleccionar Plan'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlansSection;
